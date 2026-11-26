// B4 isolated evidence: current Public handlers/helpers and installed SDK methods.
// No SDK client construction, network, signing, operational storage or Admin sends.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import * as trade from '../../shared/public-trade-ops.js';
import * as fixtures from '../../shared/public-trade-test-fixtures.mjs';
import { fetchFa2BalancePages } from '../../shared/tzkt-fa2-balances.js';
import { isCurrentWalletProjection } from '../../drops/js/reveal-coordinator.js';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8').replace(/\r\n?/g, '\n');
const flush = () => new Promise(setImmediate);
const deferred = () => { let resolve; const promise = new Promise(yes => { resolve = yes; }); return { promise, resolve }; };
function load(path, stop, extras = {}) {
  const full = read(path), end = full.indexOf(stop);
  assert.ok(end > 0, path);
  const prefix = full.slice(0, end).replace(/import[\s\S]*?from\s+['"][^'"]+['"];\s*/g, '')
    .replaceAll('import.meta.url', JSON.stringify(new URL(path, import.meta.url).href))
    .replace(/const walletSource = await readFile\([^\n]+\);/, 'const walletSource = walletText;');
  const c = vm.createContext({ assert, readFileSync, vm, process: { env: {} }, URL, setImmediate, structuredClone,
    Event, EventTarget, AbortController, ...trade, ...fixtures, fetchFa2BalancePages,
    isCurrentWalletProjection, reconcileConfirmation: trade.pollForConfirmation, ...extras });
  vm.runInContext(prefix, c);
  return c;
}
const dropsFixture = load('../../drops/js/trade-lifecycle.test.mjs', '\ntest(').fixture;
const exchangeFixture = load('../../exchange/js/exchange-wallet.test.mjs', '\nfunction unavailable(').fixture;
const walletFixtureContext = load('../../shared/beacon-setup.test.mjs', '\n{\n  const initialAccount = deferred();', {
  walletText: read('../../shared/beacon-setup.js'), createContext: vm.createContext,
  SourceTextModule: vm.SourceTextModule, SyntheticModule: vm.SyntheticModule,
});
const walletFixture = vm.runInContext('createWalletFixture', walletFixtureContext);
const call = (h, code) => vm.runInContext(code, h.context);
async function page(surface) {
  if (surface === 'drops') {
    const h = dropsFixture();
    return { h, send: h.send, pending: h.pending,
      receipt: () => call(h, 'submittedTrades.get(submittedTradeScope("wallet-A"))'),
      replace: value => { h.setAccount(value); if (value?.address === 'wallet-B') h.change('replacement'); },
    };
  }
  const h = exchangeFixture(); await h.connect('wallet-A', [{ contractAddress: 'KT1419', tokenId: '0', balance: 5 }]); h.select('1');
  return { h, send: h.trade, pending: () => call(h, 'exchangeInFlight'),
    receipt: () => call(h, 'submittedTrades.get(submittedTradeScope("wallet-A"))'),
    replace: value => { h.account = value; h.state({ status: 'connected', account: value }); },
  };
}

// Unbounded preflight: use actual shared helpers in BOTH real handlers. Keep
// headers/body deferred, move the clock forward, retry, then release the same
// request. Advancing Date is an elapsed-time probe, not a browser suspension claim.
const savedFetch = globalThis.fetch, savedNow = Date.now, savedError = console.error;
try {
  console.error = () => {};
  for (const surface of ['drops', 'exchange']) for (const stage of [
    'operator-fetch', 'operator-json', 'operator-http-text', 'pair-fetch', 'pair-json', 'pair-http-text',
  ]) {
    const p = await page(surface), { h } = p, gate = deferred(); let reads = 0, walletCalls = 0;
    const originalSend = h.context.window.dAppClient.requestOperation;
    h.context.window.dAppClient.requestOperation = input => { walletCalls++; return originalSend(input); };
    const operator = stage.startsWith('operator');
    globalThis.fetch = () => {
      reads++;
      return stage.endsWith('fetch') ? gate.promise : Promise.resolve(stage.endsWith('json')
        ? { ok: true, json: () => gate.promise }
        : { ok: false, status: 503, text: () => gate.promise });
    };
    const scope = call(h, 'submittedTradeScope("wallet-A")');
    const approve = (address, cart) => operator ? trade.buildApprovalOps({ tzktBase: scope.tzktBase,
      escrowAddress: scope.escrowAddress, userWalletAddress: address, burnCart: cart }) : Promise.resolve([]);
    const pair = (burnContractAddress, burnTokenId, burnAmount) => trade.fetchTokenPairId({
      tzktBase: scope.tzktBase, escrowAddress: scope.escrowAddress, burnContractAddress, burnTokenId, burnAmount,
      redeemContractAddress: h.context.REDEEM_CONTRACT_ADDRESS,
      redeemTokenId: h.context.redeemToken.tokenId, redeemAmount: h.context.redeemToken.redeemAmount });
    // Preserve every production handler statement; replace only fixture boundaries.
    h.context.buildApprovalOps = approve;
    if (!operator && surface === 'drops') h.context.fetchTokenPairId = pair;
    else if (!operator) h.context.fetchSharedTokenPairId = trade.fetchTokenPairId;
    const run = p.send(); await flush(); assert.equal(reads, 1); assert.equal(p.pending(), true);
    const now = savedNow(); Date.now = () => now + 3600000;
    await flush(); await p.send();
    assert.equal(p.pending(), true); assert.equal(reads, 1); assert.equal(walletCalls, 0); assert.equal(p.receipt(), null);
    Date.now = savedNow;
    gate.resolve(stage.endsWith('fetch') ? { ok: true, json: async () => [] }
      : stage.endsWith('http-text') ? 'inert unavailable' : []);
    await run; assert.equal(p.pending(), false);
    if (operator) assert.equal(walletCalls, 1, 'Missing operator has the real approval fallback');
    else assert.equal(walletCalls, 0, 'Completed absent pair releases ownership without sending');
    console.log(`PASS ${surface} ${stage}: indefinite preflight ownership observed; eventual-response control releases it`);
  }
} finally { globalThis.fetch = savedFetch; Date.now = savedNow; console.error = savedError; }

// Public-specific SDK boundary. Reuse neither the Admin authority module nor
// its reproduction. Run Public's actual verifier and both actual handlers.
const require = createRequire(import.meta.url);
const { DAppClient, Serializer, BeaconEvent, BeaconEventHandler } = require('@airgap/beacon-sdk');
const { ExposedPromise } = require('@airgap/beacon-utils');
assert.equal(JSON.parse(read('../../node_modules/@airgap/beacon-sdk/package.json')).version, '4.8.1');
const account = address => ({ address, accountIdentifier: address, senderId: address, scopes: ['operation_request'],
  network: { type: 'shadownet' }, origin: { type: 'extension', id: address } });
for (const surface of ['drops', 'exchange']) for (const scenario of ['unchanged', 'event-first', 'final-read-overlap']) {
  const p = await page(surface), { h } = p;
  const unavailableConfirmation = async () => { throw new Error('inert confirmation unavailable'); };
  if (surface === 'drops') h.context.pollForConfirmation = unavailableConfirmation;
  else h.confirm = unavailableConfirmation;
  const w = await walletFixture(Promise.resolve(null)); await flush();
  const A = account('wallet-A'), B = account('wallet-B');
  await w.client.accountListener(A);
  const dispatch = w.document.dispatchEvent;
  w.document.dispatchEvent = event => {
    dispatch(event);
    if (event.detail?.status === 'connected') p.replace(event.detail.account);
  };
  let response, switching, verifiedReads = 0;
  const emitted = [];
  const transport = { connectionStatus: 'CONNECTED', connect: async () => {},
    getPeers: async () => [A, B].map(a => ({ id: a.address, senderId: a.senderId })),
    send: async (payload, peer) => {
      emitted.push({ ...await new Serializer().deserialize(payload), peer });
      response.resolve({ message: { transactionHash: 'inert-sdk-hash' }, connectionInfo: {} });
    } };
  const native = name => function (...args) { return DAppClient.prototype[name].apply(this, args); };
  const sdk = { _activeAccount: ExposedPromise.resolve(A), isGetActiveAccountHandled: true,
    getActiveAccount: native('getActiveAccount'), isInvalidState: native('isInvalidState'),
    setActiveAccount: native('setActiveAccount'), initInternalTransports: native('initInternalTransports'),
    setTransport: async () => {}, setActivePeer: async () => {},
    storage: { get: async () => 'cd'.repeat(32), set: async () => {} },
    _transport: { isResolved: () => true }, postMessageTransport: transport, transport,
    analytics: { track() {} }, sendMetrics() {}, buildPayload: async () => ({}),
    multiTabChannel: { init: async () => {}, isLeader: () => true }, checkMakeRequest: native('checkMakeRequest'),
    _initPromise: Promise.resolve(), init: native('init'), addRequestAndCheckIfRateLimited: async () => false,
    checkPermissions: native('checkPermissions'), beaconId: 'ab'.repeat(32),
    addOpenRequest: (_id, exposed) => { response = exposed; }, getPeer: native('getPeer'),
    tryToAppSwitch() {}, notifySuccess: async () => {}, getWalletInfo: async () => ({}), blockExplorer: {},
    makeRequest: native('makeRequest'),
    events: { callbackMap: { [BeaconEvent.ACTIVE_ACCOUNT_SET]: [w.client.accountListener] },
      emit(...args) { return BeaconEventHandler.prototype.emit.call(this, ...args); } },
  };
  w.client.getActiveAccount = () => {
    const captured = sdk.getActiveAccount();
    if (++verifiedReads === 2 && scenario === 'final-read-overlap') {
      // Start the supported SDK setter after the real getter captures A.
      // Public still performs its full verification/epoch chain afterward.
      // No gated storage, delayed notification, substituted getter or client.
      switching = sdk.setActiveAccount(B);
    }
    return captured;
  };
  h.context.getVerifiedPublicActiveAccount = () => w.wallet.getVerifiedPublicActiveAccount();
  if (surface === 'exchange') h.verify = h.context.getVerifiedPublicActiveAccount;
  h.context.window.dAppClient.requestOperation = native('requestOperation').bind(sdk);
  if (scenario === 'event-first') await sdk.setActiveAccount(B);
  await p.send(); await switching; await flush();
  if (scenario === 'event-first') assert.equal(emitted.length, 0, 'Retired projection cannot authorize a send');
  else {
    assert.equal(emitted.length, 1, `${surface} ${scenario}: ${h.errors.map(args => args.map(a => a?.stack || String(a)).join(' ')).join('\n')}; ${JSON.stringify(h.modals)}`);
    assert.equal(emitted[0].sourceAddress, scenario === 'unchanged' ? A.address : B.address);
    assert.equal(emitted[0].peer.id, emitted[0].sourceAddress);
    const tradeOp = emitted[0].operationDetails.find(op => op.parameters?.entrypoint === 'initiate_trade');
    assert.equal(tradeOp.parameters.value[0].args[1].args[1].args[1].string, A.address);
    const receipt = p.receipt();
    assert.equal(receipt.account, A.address); assert.equal(receipt.hash, 'inert-sdk-hash');
    const wrongSender = fixtures.appliedOperations(receipt).map(op => ({ ...op, sender: { address: B.address }, status: 'failed' }));
    if (scenario !== 'unchanged') {
      assert.deepEqual(trade.__getOperationConfirmationForFixture(wrongSender, { submittedTrade: receipt }), { applied: false, failed: false },
        'A receipt cannot reconcile even a terminal B request');
      assert.equal(trade.__getOperationConfirmationForFixture(wrongSender.map(op => ({ ...op, sender: { address: A.address } })),
        { submittedTrade: receipt }).failed, true, 'The same terminal evidence attributed to A releases the A receipt');
      assert.equal(trade.__getOperationConfirmationForFixture(fixtures.appliedOperations(receipt),
        { submittedTrade: receipt }).applied, true, 'Matching applied A evidence is the success control');
    }
  }
  console.log(`PASS ${surface} SDK ${scenario}: ${scenario === 'final-read-overlap' ? 'B source / A user_wallet and journal (defect)' : 'control'}`);
}
console.log('B4 evidence complete: twelve preflight stalls and two Public SDK discrepancies, with response/authority controls. No live operations.');
