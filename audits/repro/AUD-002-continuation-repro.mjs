import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { Readable } from 'node:stream';
import vm from 'node:vm';
import { createDropParamsAuthoringApi, createDropParamsAuthoringHttpServer } from '../../shared/drop-params/drop-params-authoring-service.mjs';
import { validateDropParams, serializeDropParamsSource, sha256SourceBytes } from '../../shared/drop-params/drop-params-authoring.mjs';
import { serializeDropParamsJson } from '../../shared/drop-params/drop-params-projector.mjs';
import { chainRegistry } from '../../shared/chain-registry.js';
import dropsConfig, { createDropsConfig } from '../../drops/js/events-config.js';
import { fetchTokenPairId } from '../../shared/public-trade-ops.js';
import base from '../../shared/drop-params/drop-params.js';

const root = new URL('../../', import.meta.url);
function load(relative, globals = {}) {
  let code = readFileSync(new URL(relative, root), 'utf8').replace(/\r\n?/g, '\n')
    .replace(/^import\s[\s\S]*?;\s*/gm, '')
    .replace(/export default /g, 'var ignoredDefault = ').replace(/export (const|let) /g, 'var ').replace(/export /g, '');
  const ctx = vm.createContext({ console, URL, Event, CustomEvent, AbortController, structuredClone, ...globals });
  vm.runInContext(code, ctx, { filename: relative });
  return ctx;
}
function snapshot(params) {
  const sourceBytes = Buffer.from(serializeDropParamsSource(params));
  const json = Buffer.from(serializeDropParamsJson(params));
  return { params, sourceVersion: sha256SourceBytes(sourceBytes), files: { sourceBytes, outerBytes: json, adminBytes: json },
    equality: { equal: true } };
}
let current = snapshot(structuredClone(base));
let now = Date.UTC(2026, 10, 3);
let executed = [];
const api = createDropParamsAuthoringApi({ nonce: 'inert-nonce', now: () => new Date(now), tokenTtlMs: 1000,
  readSnapshot: async () => current,
  readWriterState: async () => ({ busy: false, blocked: false }),
  execute: async request => { executed.push(request); return { status: 'completed', sourceVersion: 'inert' }; } });
const candidate = { ...base, dropName: 'INERT API CANDIDATE' };
const request = { operation: 'EDIT', expectedSourceVersion: current.sourceVersion, candidate };
const applyBody = preview => ({ ...request, candidateHash: preview.candidateHash, planHash: preview.planHash, previewToken: preview.previewToken });
let preview = await api.preview(request);
assert.equal(executed.length, 0);
assert.equal((await api.apply(applyBody(preview))).ok, true);
assert.equal(executed.length, 1);
await assert.rejects(api.apply(applyBody(preview)), e => e.code === 'preview_token_unavailable');
preview = await api.preview(request);
await assert.rejects(api.apply({ ...applyBody(preview), candidate: { ...candidate, dropName: 'ALTERED' } }), e => e.code === 'preview_binding_mismatch');
preview = await api.preview(request);
now += 1001;
await assert.rejects(api.apply(applyBody(preview)), e => e.code === 'preview_token_expired');
preview = await api.preview(request);
const heldSnapshot = current;
current = snapshot({ ...base, dropName: 'OTHER COMMITTED STATE' });
await assert.rejects(api.apply(applyBody(preview)), e => e.code === 'stale_source_version');
current = heldSnapshot;
assert.equal(executed.length, 1);
console.log('API controls: preview inert; exact apply only once; replay, changed candidate, expiry and source drift rejected');

// Exercise the actual HTTP request listener without opening a listening socket.
const { server } = createDropParamsAuthoringHttpServer({ api, bodyLimit: 128 });
async function httpRequest({ host = '127.0.0.1:47831', origin = 'http://localhost:3000', method = 'POST', path = '/v1/drop-params/validate', nonce = api.nonce, body = '{}', type = 'application/json' } = {}) {
  const req = Readable.from([Buffer.from(body)]);
  Object.assign(req, { url: path, method, headers: { host, origin, 'content-type': type, 'x-drop-params-nonce': nonce } });
  return new Promise(resolve => {
    const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(text) { resolve({ status: this.statusCode, body: text ? JSON.parse(text) : null, headers: this.headers }); } };
    server.emit('request', req, res);
  });
}
assert.equal((await httpRequest({ body: JSON.stringify({ operation: 'DEACTIVATE' }) })).status, 200);
for (const [options, expected] of [
  [{ host: 'evil.invalid:47831' }, 403], [{ origin: 'https://evil.invalid' }, 403],
  [{ origin: null }, 403], [{ nonce: 'wrong' }, 401], [{ method: 'DELETE' }, 405],
  [{ path: '/v1/drop-params/validate?x=1' }, 404], [{ type: 'text/plain' }, 415],
  [{ body: '{' }, 400], [{ body: 'x'.repeat(129) }, 413],
]) {
  assert.equal((await httpRequest(options)).status, expected);
}
assert.equal((await httpRequest({ method: 'GET', path: '/v1/drop-params', origin: null })).status, 200);
assert.equal((await httpRequest({ method: 'OPTIONS', origin: null })).status, 403);
assert.equal((await httpRequest({ method: 'OPTIONS' })).status, 204);
assert.equal(executed.length, 1);
console.log('HTTP controls: allowed request works; Host/origin/nonce/method/route/type/body size/JSON checks reject; no socket or writer used');

// Resolve accepted Public configuration hypothesis at actual validators/builders/lookup.
const data = load('admin-ui/src/features/drops/drops.data.js', { log() {}, reportError() {},
  getLiveCfg: () => ({ network: 'testnet' }),
  getIdMirrorForCollection: collection => chainRegistry.testnet.mirrors[collection] || {} });
const builder = load('admin-ui/src/features/drops/drops.builder.js', { log() {} });
const unsupported = { ...structuredClone(base), redeemToken: { ...base.redeemToken, collection: 'THE 419 SCRIPT', tokenId: '0' } };
const unsupportedValidation = validateDropParams(unsupported);
assert.equal(unsupportedValidation.ok, false);
assert.ok(unsupportedValidation.errors.some(error =>
  error.path === '$.redeemToken.collection' && error.code === 'public_compatibility'));
await assert.rejects(api.validate({ operation: 'EDIT', candidate: unsupported }), e => e.code === 'validation_failed');
await assert.rejects(api.preview({ ...request, candidate: unsupported }), e => e.code === 'validation_failed');
assert.equal(executed.length, 1, 'unsupported candidate never reaches the writer');
const normalized = data.normalize(unsupported);
const items = builder.buildItems(normalized, { startId: 0 });
assert.ok(items.length > 0);
assert.ok(items.every(item => item.redeem.collection === 'THE 419 SCRIPT'));
assert.equal(dropsConfig.isConfigured, true);
assert.equal(createDropsConfig(unsupported).isConfigured, false);
assert.equal(dropsConfig.contracts.testnet.collections['THE 419 SCRIPT'], undefined);
const publicSource = readFileSync(new URL('drops/js/events.js', root), 'utf8');
const begin = publicSource.indexOf('async function fetchTokenPairId(');
const end = publicSource.indexOf('// HELPERS: BALANCE PROCESSING', begin);
let fetches = 0;
const savedFetch = globalThis.fetch, savedError = console.error;
try {
  globalThis.fetch = async () => { fetches++; return { ok: true, json: async () => [{ key: '0', active: true, value: {
    burn_contract_address: chainRegistry.testnet.collections.HEN, burn_token_id: '0', burn_amount: '1',
    redeem_contract_address: chainRegistry.testnet.collections.CANAAN, redeem_token_id: '29', redeem_amount: '1' } }] }; };
  console.error = () => {};
  for (const params of [unsupported, base]) {
    const ctx = vm.createContext({ fetchSharedTokenPairId: fetchTokenPairId, TZKT_BASE: 'https://inert.invalid',
      BURN_REDEEM_CONTRACT_ADDRESS: dropsConfig.contracts.testnet.escrow,
      REDEEM_CONTRACT_ADDRESS: dropsConfig.contracts.testnet.collections[params.redeemToken.collection] || '', redeemToken: params.redeemToken });
    vm.runInContext(publicSource.slice(begin, end), ctx);
    assert.equal(await ctx.fetchTokenPairId(chainRegistry.testnet.collections.HEN, '0', 1), params === base ? '0' : null);
  }
} finally { globalThis.fetch = savedFetch; console.error = savedError; }
assert.equal(fetches, 1);
console.log('AUD-002-005 regression: HEN -> 419 rejected by authoring and Public before publication/trade; counterfactual Admin pairs retain 419 identity; CANAAN control resolves');

// Exact selected pair identity through the real table reader and cleanup serializer.
for (const selected of ['29', '9007199254740993']) {
  const doc = { querySelectorAll: () => [{ getAttribute: () => selected }] };
  const table = load('admin-ui/src/features/pairs/pairs.view.table.js', { document: doc, $: () => null,
    UNDEFINED_IMG: '', setStatus() {}, log() {} });
  const ids = table.getSelectedPairIds();
  const requests = [];
  const ops = load('admin-ui/src/escrow-ops.js', { getLiveCfg: () => ({}), requireEscrow: () => 'KT1InertEscrow',
    verifyAdminActiveAccount: value => value,
    window: { dAppClient: { getActiveAccount: async () => ({ address: 'tz1Inert' }),
      requestOperation: async value => { requests.push(value); return { transactionHash: 'inert' }; } } } });
  await ops.cleanupTokenPairs(ids);
  assert.equal(requests[0].operationDetails[0].parameters.value[0].int,
    selected === '29' ? '29' : '9007199254740992');
}
console.log('AUD-002-006: selecting exact large pair ID serializes cleanup of its rounded neighbor; ID 29 control exact');

// Initial inventory error, recovery scheduling and actual button-state consumer.
const supplyBegin = publicSource.indexOf('let redeemSupplyIntervalId');
const supplyEnd = publicSource.indexOf('// HANDLER: EVENTS EXCHANGE FLOW', supplyBegin);
const commitBegin = publicSource.indexOf('function commitInitialRedeemSupply(');
const commitEnd = publicSource.indexOf('// HELPERS: CMS ROWS', commitBegin);
const buttonBegin = publicSource.indexOf('function computeExchangeButtonState(');
const buttonEnd = publicSource.indexOf('function updateExchangeButtonState(', buttonBegin);
for (const failFirst of [true, false]) {
  const state = { countdownPhase: 'live', walletConnected: true, selectedTokenId: '0', contractPaused: false };
  const intervals = [], pill = {};
  let reads = 0;
  const supply = vm.createContext({ AppState: state, document: { hidden: false },
    redeemInitialSupplyCommitted: false, redeemInitialSupplyPublishing: false,
    networkConfigAvailable: true, BURN_REDEEM_CONTRACT_ADDRESS: 'KT1Escrow',
    collections: { CANAAN: 'KT1Redeem' }, redeemToken: { collection: 'CANAAN', tokenId: '29' },
    updateAppState: patch => Object.assign(state, patch), initialDropStateReveal: { markReady() {} },
    fetchNFTs: async () => { if (++reads === 1 && failFirst) throw new Error('inert initial HTTP failure');
      return [{ contractAddress: 'KT1Redeem', tokenId: '29', balance: '7' }]; },
    setInterval: fn => { intervals.push(fn); return intervals.length; }, clearInterval() {}, subscribeToAppState() {},
    console: { error() {} }, dropsBalanceRefreshFailed: false, handleEventExchange() {}, retryDropsBalances() {} });
  vm.runInContext(publicSource.slice(supplyBegin, supplyEnd) + '\n' + publicSource.slice(commitBegin, commitEnd)
    + '\n' + publicSource.slice(buttonBegin, buttonEnd), supply);
  const result = await supply.resolveInitialRedeemSupply();
  supply.commitInitialRedeemSupply({ querySelector: () => pill }, result);
  for (let i = 0; i < 3; i++) supply.reconcileRedeemSupplyPolling();
  assert.equal(reads, 1);
  assert.equal(intervals.length, failFirst ? 0 : 1);
  assert.equal(state.redeemSupply, failFirst ? undefined : 7);
  assert.equal(typeof supply.computeExchangeButtonState(state).clickAction, 'function');
  assert.equal(pill.textContent, failFirst ? '[UNAVAILABLE]' : 'x07');
}
console.log('AUD-002-007: initial inventory failure installs no recovery poll yet enables Exchange; healthy control installs one poll');

// Confirmation producer: preserve real poll semantics with inert fetch and delay.
const poll = (await import('../../admin-ui/src/utils/poll.js')).poll;
for (const [row, expected] of [
  [{ type: 'transaction', target: { address: 'KT1Intended' }, parameter: { entrypoint: 'set_token_pairs' }, status: 'applied' }, true],
  [{ type: 'transaction', target: { address: 'KT1Unrelated' }, parameter: { entrypoint: 'other' }, status: 'applied' }, true],
  [{ type: 'transaction', target: { address: 'KT1Intended' }, parameter: { entrypoint: 'set_token_pairs' }, status: 'failed' }, false],
]) {
  const ops = load('admin-ui/src/escrow-ops.js', { poll, getLiveCfg: () => ({ tzktBase: 'https://inert.invalid' }),
    fetch: async () => ({ ok: true, json: async () => [row] }) });
  assert.equal(await ops.waitForOperation('inert-hash', { timeoutMs: 100, pollMs: 0 }), expected);
}
console.log('AUD-002-008: legacy confirmation accepts unrelated last applied row; matching applied/failed controls distinguished');

// Compose the real sequential Drops sender with the real legacy confirmation helper.
const fixtureUrl = new URL('admin-ui/tests/runtime/drops-send-invalidation.test.mjs', root);
let fixtureCode = readFileSync(fixtureUrl, 'utf8').replace(/\r\n?/g, '\n');
fixtureCode = fixtureCode.slice(0, fixtureCode.indexOf("for (const change of ['provider'"))
  .replace(/^import\s[\s\S]*?;\s*/gm, '').replaceAll('import.meta.url', JSON.stringify(fixtureUrl.href));
const makeSend = vm.runInNewContext(fixtureCode + '\nfixture;', { assert, readFileSync, vm, URL, Event, CustomEvent,
  EventTarget, structuredClone, console, setImmediate });
for (const status of ['applied', 'failed']) {
  const h = makeSend();
  h.cfg.tzktBase = 'https://inert.invalid';
  h.ready();
  const ops = load('admin-ui/src/escrow-ops.js', { poll, getLiveCfg: () => h.cfg,
    fetch: async () => ({ ok: true, json: async () => [{ type: 'transaction', target: { address: status === 'applied' ? 'KT1Other' : h.cfg.escrow },
      parameter: { entrypoint: status === 'applied' ? 'other' : 'set_token_pairs' }, status }] }) });
  h.deps.waitForOperation = ops.waitForOperation;
  await h.send();
  assert.equal(h.submissions.length, status === 'applied' ? 3 : 1);
  assert.equal(h.statuses.some(([message]) => message === 'Drop pairs confirmed on-chain.'), status === 'applied');
}
console.log('AUD-002-008 consumer: unrelated applied rows advance all 3 real sender batches and publish confirmed; matching failure stops after batch 1');

const modalFixtureUrl = new URL('admin-ui/tests/runtime/pair-modal-pending.test.mjs', root);
let modalCode = readFileSync(modalFixtureUrl, 'utf8').replace(/\r\n?/g, '\n');
modalCode = modalCode.slice(0, modalCode.indexOf("test('PROBE-P3-MODAL-PENDING:"))
  .replace(/^import\s[\s\S]*?;\s*/gm, '').replaceAll('import.meta.url', JSON.stringify(modalFixtureUrl.href));
const makeModal = await new Function('assert', 'readFile', 'vm', 'URL', 'Event', 'EventTarget', 'setImmediate', 'setTimeout',
  `return (async () => { ${modalCode}; return { fixture, pair, settle }; })();`)(assert, readFile, vm, URL, Event, EventTarget, setImmediate, setTimeout);
for (const tokenId of ['1', '99']) {
  const h = makeModal.fixture(), operation = h.operation();
  const pair = makeModal.pair(12);
  pair.burn.tokenId = tokenId;
  await h.open(pair, operation.hooks);
  h.edit('burn-amount', '2');
  await makeModal.settle();
  assert.equal(h.snapshot().disabled, false);
  const sending = h.save();
  assert.equal(operation.payloads[0].burn_token_id, tokenId === '1' ? '1' : '0');
  operation.send.resolve({ opHash: 'inert' }); operation.confirmation.resolve(false);
  await sending;
}
console.log('AUD-002-011: amount-only edit of known-collection pair with unlisted token 99 serializes token 0; listed token 1 control preserved');

console.log('Continuation inert assertions passed; no live requests, wallet actions or source writes');
