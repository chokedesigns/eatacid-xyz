import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { isCurrentWalletProjection } from '../../drops/js/reveal-coordinator.js';
import { fetchFa2BalancePages } from '../../shared/tzkt-fa2-balances.js';
import { __areTradedTokensRefreshedForFixture, pollForNFTUpdate } from '../../shared/public-trade-ops.js';
import * as treasuryFixture from '../../admin-ui/tests/runtime/treasury.fixture.mjs';
import { validateDropParams } from '../../shared/drop-params/drop-params-authoring.mjs';
import committedDropParams from '../../shared/drop-params/drop-params.js';

// Reuse checked-in inert fixture definitions, without executing or editing their tests.
// The definitions themselves read and execute the current production source.
function fixtureFrom(relativePath, endAnchor, resultName = 'fixture', globals = {}) {
  const url = new URL(relativePath, import.meta.url);
  let code = readFileSync(url, 'utf8').replace(/\r\n?/g, '\n');
  const end = code.indexOf(endAnchor);
  assert.ok(end > 0, `Missing fixture boundary: ${endAnchor}`);
  code = code.slice(0, end)
    .replace(/import[\s\S]*?from\s+['"][^'"]+['"];\s*/g, '')
    .replaceAll('import.meta.url', JSON.stringify(url.href));
  const context = vm.createContext({ assert, readFileSync, vm, URL, structuredClone, Event, CustomEvent, EventTarget, AbortController,
    isCurrentWalletProjection, pollForNFTUpdate, fetchFa2BalancePages, setImmediate, console, process: { env: {} }, ...globals });
  return vm.runInContext(code + `\n${resultName};`, context);
}

// Restrict remediation verification to the two balance findings when requested.
const balancesOnly = process.argv.includes('--balances-only');
if (!balancesOnly) {
const dropsFixture = fixtureFrom('../../drops/js/trade-lifecycle.test.mjs', "for (const stage of ['initial-account'");
{
  const h = dropsFixture({ failure: 'confirmation' });
  await h.send();
  assert.equal(h.requests.length, 1);
  assert.equal(h.confirmations.length, 1);
  assert.equal(h.pending(), false);
  assert.equal(h.checkbox.checked, true);
  assert.equal(h.modals.at(-1)[0], 'ERROR');
  h.clearFailure();
  await h.send(); // No reselect, reconnect, balance refresh, or operation resolution.
  assert.equal(h.requests.length, 2);
  assert.deepEqual(h.requests[0], h.requests[1]);
  console.log('AUD-002-002: returned hash + confirmation outage permits identical Drops request twice');
}
{
  const h = dropsFixture();
  await h.send();
  h.checkbox.checked = true;
  await h.send();
  assert.equal(h.requests.length, 1, 'Confirmed unresolved holdings block repeat');
  const rejected = dropsFixture({ failure: 'final-account' });
  await rejected.send();
  assert.equal(rejected.requests.length, 0);
  rejected.clearFailure();
  await rejected.send();
  assert.equal(rejected.requests.length, 1, 'Pre-submit failure safely permits retry');
  console.log('AUD-002-002 controls: confirmed trade blocks repeat; pre-submit failure permits fresh send');
}

const exchangeFixture = fixtureFrom('../../exchange/js/exchange-wallet.test.mjs', 'function unavailable(');
{
  const h = exchangeFixture();
  const holdings = [{ contractAddress: 'KT1419', tokenId: '0', balance: '5' }];
  await h.connect('wallet-A', holdings);
  h.select('1');
  h.confirm = async () => { throw new Error('inert confirmation timeout after returned hash'); };
  await h.trade();
  assert.equal(h.sent.length, 1);
  assert.equal(h.controls.connect.textContent, 'RETRY BALANCES');
  h.fetchRows = async () => holdings; // Indexer is still behind the accepted request.
  await h.context.retryExchangeBalances();
  h.select('1');
  h.confirm = async () => {};
  await h.trade();
  assert.equal(h.sent.length, 2);
  assert.equal(JSON.stringify(h.sent[0]), JSON.stringify(h.sent[1]));
  console.log('AUD-002-002 Exchange: confirmation timeout + Retry Balances on stale indexer permits identical second request');
}
{
  const h = exchangeFixture();
  await h.connect('wallet-A', [{ contractAddress: 'KT1419', tokenId: '0', balance: '5' }]);
  assert.equal(h.dropdowns[0].options.length, 6);
  let appended = 0;
  const append = h.dropdowns[0].appendChild.bind(h.dropdowns[0]);
  h.dropdowns[0].appendChild = option => {
    if (++appended > 10000) throw new Error('AUD-002 inert allocation stop');
    return append(option);
  };
  h.context.largeRows = [{ contractAddress: 'KT1419', tokenId: '0', balance: '1000000000000' }];
  assert.throws(() => h.call('renderConnectedWalletTokenState(largeRows)'), /inert allocation stop/);
  assert.equal(appended, 10001);
  console.log('AUD-002-003: valid large safe-integer holdings attempt >10,000 options synchronously; 5-balance control has 6');
}

}

// Test the real Public shared holdings seam and its real supply/refresh consumers.
const walletSource = readFileSync(new URL('../../shared/beacon-setup.js', import.meta.url), 'utf8');
const holdingsCode = walletSource.slice(walletSource.indexOf('async function fetchNFTs('), walletSource.indexOf('window.fetchNFTs = fetchNFTs;'));
const eventsSource = readFileSync(new URL('../../drops/js/events.js', import.meta.url), 'utf8');
const supplyCode = eventsSource.slice(eventsSource.indexOf('async function fetchRedeemSupply('), eventsSource.indexOf('async function updateRedeemSupplyDisplay('));
const contract = 'KT1Redeem', wanted = '29';
const rows = Array.from({ length: 100 }, (_, i) => ({ id: i, token: { tokenId: String(i), contract: { address: 'KT1Other' } }, balance: '1' }));
const missing = { id: 100, token: { tokenId: wanted, contract: { address: contract } }, balance: '7' };
let page = [...rows, missing];
const urls = [];
const c = vm.createContext({ fetchFa2BalancePages, network: 'testnet', tzkt: { testnet: 'https://inert.invalid' },
  networkConfigAvailable: true, BURN_REDEEM_CONTRACT_ADDRESS: 'KT1Escrow',
  collections: { CANAAN: contract }, redeemToken: { collection: 'CANAAN', tokenId: wanted },
  logger: { log() {} }, console, fetch: async url => {
    urls.push(url);
    const cursor = new URL(url).searchParams.get('id.gt');
    return { ok: true, json: async () => page.filter(row => cursor === null || BigInt(row.id) > BigInt(cursor)).slice(0, 100) };
  } });
vm.runInContext(holdingsCode + '\n' + supplyCode, c);
assert.equal(await c.fetchRedeemSupply(), 7);
assert.equal(urls.length, 2);
assert.ok(urls[0].includes('limit=100') && urls[1].includes('id.gt=99'));
const holdings = await c.fetchNFTs('wallet-A');
assert.equal(holdings.length, 101);
assert.equal(__areTradedTokensRefreshedForFixture(holdings,
  [{ contractAddress: contract, tokenId: wanted, startingBalance: 7, quantity: 1 }]), false);
page = [missing];
assert.equal(await c.fetchRedeemSupply(), 7);
console.log('BAL-001 / AUD-002-001: 101st funded holding retained, supply 7, unchanged traded balance stays pending; single-page control preserved');

if (!balancesOnly) {
// Known CHR-006: execute the whole current economics module, replacing only config import.
const econ = readFileSync(new URL('../../admin-ui/src/utils/token-econ.js', import.meta.url), 'utf8')
  .replace(/import[^;]+;/, '').replaceAll('export ', '');
for (const [balance, expected] of [['not-a-nat', 0], ['-1', 0], ['0', 0], ['5', 5]]) {
  const ec = vm.createContext({ getLiveCfg: () => ({ network: 'testnet', tzktBase: 'https://inert.invalid' }),
    console, fetch: async () => ({ ok: true, json: async () => [{ token: { tokenId: '1' }, account: { address: 'tz1Owner' }, balance }] }) });
  vm.runInContext(econ, ec);
  assert.equal(await ec.getEditionsForToken('KT1Test', '1', { force: true }), expected);
}
console.log('CHR-006 reconfirmed: malformed/negative -> 0; valid zero/five controls preserved');

// Known CHR-001: use the whole current shared wallet module with inert SDK/DOM.
const walletTestUrl = new URL('../../shared/beacon-setup.test.mjs', import.meta.url);
let walletFixtureSource = readFileSync(walletTestUrl, 'utf8').replace(/\r\n?/g, '\n');
walletFixtureSource = walletFixtureSource.slice(0, walletFixtureSource.indexOf('\n{\n  const initialAccount'))
  .replace(/import[\s\S]*?from\s+['"][^'"]+['"];\s*/g, '')
  .replaceAll('import.meta.url', JSON.stringify(walletTestUrl.href));
const loadWallet = new Function('assert', 'readFile', 'createContext', 'SourceTextModule', 'SyntheticModule', 'fetchFa2BalancePages',
  `return (async () => { ${walletFixtureSource}; return { createWalletFixture, deferred, settle }; })();`);
const wf = await loadWallet(assert, readFile, vm.createContext, vm.SourceTextModule, vm.SyntheticModule, fetchFa2BalancePages);
for (const network of ['mainnet', 'shadownet']) {
  const boot = wf.deferred();
  const h = await wf.createWalletFixture(boot.promise);
  await h.client.accountListener({ address: 'tz1NewB', network: { type: 'shadownet' } });
  assert.equal(h.wallet.getPublicWalletState().account.address, 'tz1NewB');
  boot.resolve({ address: 'tz1OldA', network: { type: network } });
  await wf.settle();
  assert.equal(h.clearCalls, network === 'mainnet' ? 1 : 0);
  assert.equal(h.wallet.getPublicWalletState().status, network === 'mainnet' ? 'unconnected' : 'connected');
}
console.log('CHR-001 reconfirmed: stale wrong-network boot clears newer B; same-network boot control preserves B');

// BAL-003 / CHR-005: execute current countdown owner and corrected standby continuation.
const clockTestUrl = new URL('../../drops/js/countdown-lifecycle.test.mjs', import.meta.url);
let countdownFixture = readFileSync(clockTestUrl, 'utf8').replace(/\r\n?/g, '\n');
countdownFixture = countdownFixture.slice(0, countdownFixture.indexOf("test('public replacement"))
  .replace(/import[\s\S]*?from\s+['"][^'"]+['"];\s*/g, '')
  .replaceAll('import.meta.url', JSON.stringify(clockTestUrl.href));
const clockLib = await import('../../shared/drop-countdown.js');
const clockFixtureLib = await import('../../shared/drop-countdown.fixtures.mjs');
const cc = vm.createContext({ ...clockLib, ...clockFixtureLib, assert, readFileSync, vm, URL, EventTarget, Event, AbortController });
const makeClock = vm.runInContext(countdownFixture + '\nfixture;', cc);
for (const status of [200, 503]) {
  const h = makeClock({ past: true });
  h.call('startCountdown()');
  await clockFixtureLib.flush();
  assert.equal(h.state.countdownPhase, 'standby');
  h.storage[0].resolve({ ok: status === 200, status, json: async () => ({ paused: false }) });
  await clockFixtureLib.flush();
  if (status === 503) {
    assert.equal(h.state.countdownPhase, 'standby');
    assert.equal(h.state.contractPaused, true);
    assert.equal(h.pills[0].textContent, 'STATUS UNAVAILABLE');
    assert.equal(h.errors.length, 1);
    assert.equal(h.waits.size, 1);
    await h.retry();
    assert.equal(h.storage.length, 2);
    h.storage[1].resolve({ ok: true, status: 200, json: async () => ({ paused: false }) });
    await clockFixtureLib.flush();
  }
  assert.equal(h.state.countdownPhase, 'live');
  assert.equal(h.pills[0].textContent, 'LIVE NOW!');
  assert.equal(h.errors.length, status === 503 ? 1 : 0);
  assert.equal(h.publications.filter(p => p.countdownPhase === 'live').length, 1);
  assert.equal(h.waits.size, 0);
  h.call('stopPublicCountdown()');
}
console.log('BAL-003 / CHR-005: HTTP 503 stays unavailable and retries; verified HTTP 200 publishes LIVE once');

const makePause = fixtureFrom('../../admin-ui/tests/runtime/pause-pending.test.mjs', 'async function duplicate(');
for (const surface of ['drops', 'exchange']) {
  const h = makePause(surface);
  await new Promise(setImmediate);
  let resolve;
  h.setEnsure(() => new Promise(yes => { resolve = yes; }));
  const pending = h.controller.onToggle();
  await new Promise(setImmediate);
  h.setEscrowSuffix('-replacement');
  await h.controller.renderPause();
  resolve();
  await pending;
  assert.equal(h.requests.length, 1);
  assert.equal(h.requests[0], `${surface}-escrow`);
  const control = makePause(surface);
  await new Promise(setImmediate);
  await control.controller.onToggle();
  assert.equal(control.requests.length, 1);
}
console.log('CHR-002 reconfirmed: both pause surfaces submit old escrow after target replacement during ensureAccount; unchanged controls submit once');

const composed = fixtureFrom('../../admin-ui/tests/runtime/treasury-submit-invalidation.test.mjs',
  "for (const surface of ['drops'", 'composed', treasuryFixture);
for (const surface of ['drops', 'exchange']) for (const action of ['transfer', 'withdraw']) {
  for (const sdkAccount of [null, { address: 'tz2' + 'b'.repeat(33), network: { type: 'shadownet' } }]) {
    const h = composed(surface);
    const held = treasuryFixture.deferred();
    const captured = h.activeAccount;
    h.readAccount = count => count === 2 ? held.promise : captured;
    const pending = h.submit(action);
    await treasuryFixture.settle();
    assert.equal(h.accountReads, 2);
    for (const { handler } of h.accountHandlers) await handler(sdkAccount);
    held.resolve(captured);
    await treasuryFixture.settle();
    assert.equal(h.operationsRequested.length, 1);
    if (h.confirmation) { h.confirmation.resolve(false); await pending; }
    else await pending;
  }
  const control = composed(surface);
  const held = treasuryFixture.deferred();
  const captured = control.activeAccount;
  control.readAccount = count => count === 2 ? held.promise : captured;
  const pending = control.submit(action);
  await treasuryFixture.settle();
  control.document.dispatchEvent(new Event('wallet:disconnected'));
  held.resolve(captured);
  await pending;
  assert.equal(control.operationsRequested.length, 0);
}
console.log('CHR-003 reconfirmed: all eight SDK account-event treasury cases submit; all four document-disconnect controls block');

}

// BAL-001 / CHR-004 at the actual API seam: all 501 rows must be retained.
const apiCode = readFileSync(new URL('../../admin-ui/src/tzkt-api.js', import.meta.url), 'utf8')
  .replace(/^import[^;]+;/gm, '').replace('export default {', 'const ignoredDefault = {').replaceAll('export ', '');
const apiUrls = [];
const apiRows = Array.from({ length: 501 }, (_, i) => ({ id: i, token: { tokenId: String(i), contract: { address: contract } }, balance: '1' }));
const ac = vm.createContext({ URL, console, fetchFa2BalancePages,
  getLiveCfg: () => ({ network: 'testnet', tzktBase: 'https://inert.invalid' }),
  shortAddress: v => v, fetch: async url => {
    apiUrls.push(url);
    const cursor = new URL(url).searchParams.get('id.gt');
    return { ok: true, json: async () => apiRows.filter(row => cursor === null || BigInt(row.id) > BigInt(cursor)).slice(0, 500) };
  } });
vm.runInContext(apiCode, ac);
const ar = await ac.getFa2Balances('KT1Escrow');
assert.equal(ar.length, 501);
assert.equal(apiUrls.length, 2);
assert.ok(apiUrls[0].includes('limit=500'));
assert.ok(ar.some(row => row.token.tokenId === '500'));
assert.ok(apiUrls[1].includes('id.gt=499'));
assert.equal(ar.find(row => row.token.tokenId === '0').balance, '1');
console.log('BAL-001 / CHR-004: all 501 fixture holdings retained; funded row 501 remains present');

if (!balancesOnly) {
const makeSend = fixtureFrom('../../admin-ui/tests/runtime/drops-send-invalidation.test.mjs', "for (const change of ['provider'");
for (const id of ['29', '9007199254740993']) {
  const authored = structuredClone(committedDropParams);
  authored.redeemToken.tokenId = id;
  assert.equal(validateDropParams(authored).ok, true);
  const providerCode = readFileSync(new URL('../../admin-ui/src/features/drops/drop-params.provider.js', import.meta.url), 'utf8')
    .replace(/^import[^;]+;/gm, '').replaceAll('export ', '');
  const provider = vm.createContext({ structuredClone });
  vm.runInContext(providerCode, provider);
  assert.equal(provider.validateProviderParams(authored), true);
  const h = makeSend();
  h.raw.redeemToken.tokenId = id;
  h.ready();
  await h.send();
  assert.equal(h.submissions.length, 3);
  const observed = Array.from(h.submissions, s => String(s.batch[0].redeem_token_id));
  assert.deepEqual(observed, Array(3).fill(id === '29' ? '29' : '9007199254740992'));
  const captured = [];
  const ops = treasuryFixture.load('escrow-ops', { getLiveCfg: () => h.cfg,
    requireEscrow: () => h.cfg.escrow, verifyAdminActiveAccount: account => account,
    window: { dAppClient: { getActiveAccount: async () => ({ address: 'tz1Inert' }),
      requestOperation: async request => { captured.push(request); return { transactionHash: 'inert' }; } } } });
  for (const submitted of h.submissions) await ops.setTokenPairs(submitted.batch, submitted.target);
  assert.equal(captured.length, 3);
  for (const request of captured) {
    let pair = request.operationDetails[0].parameters.value[0];
    for (let i = 0; i < 5; i++) pair = pair.args[1];
    assert.equal(pair.args[0].int, observed[0]);
  }
}
console.log('CHR-007 reconfirmed send conversion: exact large ID rounded in all 3 batches; ID 29 control preserved');

}

console.log(balancesOnly ? 'BAL-001 balance reproduction regressions passed.' : 'All AUD-002 inert reproduction assertions passed. No network, wallet, or filesystem effects from tested production paths.');
