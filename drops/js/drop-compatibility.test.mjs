import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import base from '../../shared/drop-params/drop-params.js';
import { chainRegistry } from '../../shared/chain-registry.js';
import { network } from '../../shared/network.js';
import { validatePublicDropCompatibility } from '../../shared/public-drop-compatibility.js';
import { INACTIVE_DROP_PARAMS, validateDropParams, serializeDropParamsSource,
  sha256SourceBytes } from '../../shared/drop-params/drop-params-authoring.mjs';
import { serializeDropParamsJson } from '../../shared/drop-params/drop-params-projector.mjs';
import { getDropParamsRequestPlanHash } from '../../shared/drop-params/drop-params-transaction.mjs';
import { createDropParamsAuthoringApi } from '../../shared/drop-params/drop-params-authoring-service.mjs';
import { createDropsConfig } from './events-config.js';
import { createSubmittedTradeStore, fetchTokenPairId } from '../../shared/public-trade-ops.js';
import { resolveBurnTokenRenderIdentities } from './token-rendering.js';
import { exactTokenId, compareTokenIds } from '../../admin-ui/src/features/drops/utils/token-id.js';

const root = new URL('../../', import.meta.url);
const publicSource = readFileSync(new URL('./events.js', import.meta.url), 'utf8').replace(/\r\n?/g, '\n');
function section(start, end) {
  const begin = publicSource.indexOf(start), finish = publicSource.indexOf(end, begin);
  assert.ok(begin >= 0 && finish > begin, `Missing production anchors: ${start}, ${end}`);
  return publicSource.slice(begin, finish);
}
function adminModule(relative, globals) {
  const source = readFileSync(new URL(relative, root), 'utf8')
    .replace(/^import\s[\s\S]*?;\s*/gm, '').replace(/export /g, '');
  const context = vm.createContext({ console, ...globals });
  vm.runInContext(source, context);
  return context;
}
const data = adminModule('admin-ui/src/features/drops/drops.data.js', {
  exactTokenId, compareTokenIds,
  log() {}, reportError() {}, getLiveCfg: () => ({ network }),
  getIdMirrorForCollection: collection => chainRegistry[network].mirrors[collection] || {}
});
const builder = adminModule('admin-ui/src/features/drops/drops.builder.js', { log() {} });
const keys = Object.keys(chainRegistry.testnet.collections);
function candidate(burn = 'HEN', redeem = 'CANAAN') {
  const params = structuredClone(base);
  params.burnTokens = [{ collection: burn, enabled: true,
    exclude: burn === 'HEN' ? ['141634'] : ['2'], burnAmount: 2 }];
  params.redeemToken = { collection: redeem, tokenId: redeem === 'CANAAN' ? '29' : '0',
    redeemAmount: 3, totalSupply: 10 };
  return params;
}
const supported = (burn, redeem) => ['HEN', 'INTRODUCTIONS'].includes(burn)
  && ['HEN', 'INTRODUCTIONS', 'CANAAN'].includes(redeem) && burn !== redeem;
const unsupported = [];
for (const burn of keys) for (const redeem of keys) {
  if (!supported(burn, redeem)) unsupported.push(candidate(burn, redeem));
}
const multi = candidate();
multi.burnTokens.push({ collection: 'INTRODUCTIONS', enabled: true, exclude: [], burnAmount: 4 });
unsupported.push(multi);
const noEnabled = candidate();
noEnabled.burnTokens[0].enabled = false;
unsupported.push(noEnabled);
const wrongNetwork = candidate();
wrongNetwork.mirrorNetwork = 'mainnet';
unsupported.push(wrongNetwork);

test('CFG-003: all registry collection combinations cross actual authoring, Admin, rendering and Public lookup seams', async () => {
  assert.equal(network, 'testnet', 'This regression targets the selected Shadownet Public surface');
  const savedFetch = globalThis.fetch;
  try {
    for (const burn of keys) for (const redeem of keys) {
      const params = candidate(burn, redeem);
      const validation = validateDropParams(params, { operation: 'active' });
      assert.equal(validation.ok, supported(burn, redeem), `${burn} -> ${redeem}: ${JSON.stringify(validation.errors)}`);
      const config = createDropsConfig(params);
      assert.equal(config.isConfigured, validation.ok);
      if (!validation.ok) continue;

      assert.deepEqual(JSON.parse(serializeDropParamsJson(params)), params);
      const current = config.contracts[config.network];
      const items = builder.buildItems(data.normalize(params), { startId: 0 });
      assert.ok(items.length > 0);
      const mirror = chainRegistry[network].mirrors[burn];
      const identities = resolveBurnTokenRenderIdentities({
        canonicalTokenIds: Object.keys(mirror), eligibleTokenIds: Object.values(mirror),
        excludedTokenIds: params.burnTokens[0].exclude, tokenMapping: current.tokenMapping[burn]
      });
      assert.deepEqual(Array.from(items, item => String(item.burn.tokenId)), identities.map(id => id.walletTokenId));
      assert.ok(!identities.some(id => params.burnTokens[0].exclude.includes(id.canonicalTokenId)));

      let requests = 0;
      const rows = items.map(item => ({ key: String(item.token_pair_id), active: true, value: {
        burn_contract_address: current.collections[item.burn.collection], burn_token_id: String(item.burn.tokenId),
        burn_amount: String(item.burn.amount), redeem_contract_address: current.collections[item.redeem.collection],
        redeem_token_id: String(item.redeem.tokenId), redeem_amount: String(item.redeem.amount)
      } }));
      globalThis.fetch = async url => {
        requests++;
        assert.ok(String(url).includes(current.escrow));
        // Competing historical token/amount rows must not substitute for intent.
        return { ok: true, json: async () => [
          ...rows.map(row => ({ ...row, key: `old-${row.key}`, value: { ...row.value, redeem_token_id: '999' } })),
          ...rows
        ] };
      };
      const lookup = vm.createContext({ fetchSharedTokenPairId: fetchTokenPairId,
        TZKT_BASE: 'https://inert.invalid', BURN_REDEEM_CONTRACT_ADDRESS: current.escrow,
        REDEEM_CONTRACT_ADDRESS: current.collections[redeem], redeemToken: params.redeemToken });
      vm.runInContext(section('async function fetchTokenPairId(', '// HELPERS: BALANCE PROCESSING'), lookup);
      for (const item of items) {
        assert.equal(item.redeem.collection, redeem);
        assert.equal(item.redeem.tokenId, params.redeemToken.tokenId);
        assert.equal(item.burn.amount, 2);
        assert.equal(item.redeem.amount, 3);
        assert.equal(current.collections[burn], chainRegistry[network].collections[burn]);
        assert.equal(current.collections[redeem], chainRegistry[network].collections[redeem]);
        assert.equal(await lookup.fetchTokenPairId(current.collections[burn], String(item.burn.tokenId), item.burn.amount),
          String(item.token_pair_id));
      }
      assert.equal(requests, items.length);
    }
    // The committed CANAAN control is unchanged, including its amounts and pair 0.
    assert.equal(validateDropParams(base).ok, true);
    const current = createDropsConfig(base).contracts[network];
    globalThis.fetch = async () => ({ ok: true, json: async () => [{ key: '0', active: true, value: {
      burn_contract_address: current.collections.HEN, burn_token_id: '0', burn_amount: '1',
      redeem_contract_address: current.collections.CANAAN, redeem_token_id: '29', redeem_amount: '1'
    } }] });
    const lookup = vm.createContext({ fetchSharedTokenPairId: fetchTokenPairId, TZKT_BASE: 'https://inert.invalid',
      BURN_REDEEM_CONTRACT_ADDRESS: current.escrow, REDEEM_CONTRACT_ADDRESS: current.collections.CANAAN,
      redeemToken: base.redeemToken });
    vm.runInContext(section('async function fetchTokenPairId(', '// HELPERS: BALANCE PROCESSING'), lookup);
    assert.equal(await lookup.fetchTokenPairId(current.collections.HEN, '0', 1), '0');
  } finally { globalThis.fetch = savedFetch; }
});

test('CFG-003: unsupported candidates fail service validate/preview/apply and serialization before publication', async () => {
  const sourceBytes = Buffer.from(serializeDropParamsSource(base));
  const json = Buffer.from(serializeDropParamsJson(base));
  const sourceVersion = sha256SourceBytes(sourceBytes);
  let executions = 0;
  const api = createDropParamsAuthoringApi({
    readSnapshot: async () => ({ params: base, sourceVersion,
      files: { sourceBytes, outerBytes: json, adminBytes: json }, equality: { equal: true } }),
    readWriterState: async () => ({ busy: false, blocked: false }),
    execute: async () => { executions++; throw new Error('Must never publish an unsupported candidate'); }
  });
  const preview = await api.preview({ operation: 'EDIT', expectedSourceVersion: sourceVersion, candidate: base });
  for (const params of unsupported) {
    const rejects = error => error.code === 'validation_failed';
    await assert.rejects(api.validate({ operation: 'EDIT', candidate: params }), rejects);
    await assert.rejects(api.preview({ operation: 'EDIT', expectedSourceVersion: sourceVersion, candidate: params }), rejects);
    await assert.rejects(api.apply({ operation: 'EDIT', expectedSourceVersion: sourceVersion, candidate: params,
      candidateHash: preview.candidateHash, planHash: preview.planHash, previewToken: preview.previewToken }), rejects);
    assert.throws(() => serializeDropParamsSource(params), /Invalid Drop Params/);
    assert.throws(() => serializeDropParamsJson(params), /Invalid Drop Params/);
    assert.throws(() => getDropParamsRequestPlanHash('EDIT', sourceVersion, params), /Invalid Drop Params/);
  }
  assert.equal(executions, 0);
});

test('CFG-003: Public rejects incompatible bundled params before wallet/provider/financial operations', async () => {
  for (const params of unsupported) {
    const config = createDropsConfig(params);
    assert.equal(config.isConfigured, false);
    assert.match(config.unavailableMessage, /configuration is not supported/);
    const messages = [];
    const context = vm.createContext({ createSubmittedTradeStore, networkConfigAvailable: config.isConfigured,
      networkUnavailableMessage: config.unavailableMessage, console: { error() {} },
      showModal: (...args) => messages.push(args), hideModal() {}, setTimeout() {} });
    vm.runInContext(section('let eventExchangeInFlight', '// UI STATE TOGGLING:'), context);
    // No wallet, approvals, indexer or requestOperation is provided: any attempt fails.
    await context.handleEventExchange();
    assert.equal(messages[0][0], 'ERROR');
    assert.equal(messages[0][1], config.unavailableMessage);
  }
  assert.equal(validatePublicDropCompatibility(candidate(), 'mainnet').ok, false);
  assert.equal(createDropsConfig({ ...candidate(), mirrorNetwork: 'mainnet' }, 'mainnet').isConfigured, false);
});

test('CFG-003: HEN redeem presentation resolves the canonical catalog without changing network trade identity', () => {
  const cfg = candidate('INTRODUCTIONS', 'HEN').redeemToken;
  const row = { dataset: { tokenId: '94684' } };
  const context = vm.createContext({ tokenMapping: chainRegistry[network].mirrors,
    window: { cmsRowsByCollection: { HEN: [row] } }, document: { querySelectorAll: () => [] } });
  vm.runInContext(section('function findRedeemRow(', '/**\n * Resolves title'), context);
  assert.equal(context.findRedeemRow(cfg, 'HEN'), row);
  assert.equal(cfg.tokenId, '0');
  assert.equal(context.findRedeemRow({ ...cfg, tokenId: '999' }, 'HEN'), null);
});

test('CFG-003: disabled rows, exclusions, unscheduled authored content and exact inactive shape retain their contracts', () => {
  const params = candidate();
  params.burnTokens.push({ collection: 'THE 419 SCRIPT', enabled: false, exclude: [''], burnAmount: 5 });
  assert.equal(validateDropParams(params).ok, true);
  assert.deepEqual(JSON.parse(serializeDropParamsJson(params)), params);
  assert.equal(createDropsConfig(params).isConfigured, true);
  for (const inactive of [INACTIVE_DROP_PARAMS, { ...multi, dropScheduled: false },
    { ...wrongNetwork, dropScheduled: false }]) {
    assert.equal(validateDropParams(inactive).ok, true);
    assert.equal(createDropsConfig(inactive).isConfigured, true);
  }
});
