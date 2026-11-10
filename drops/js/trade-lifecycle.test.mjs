import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import { isCurrentWalletProjection } from './reveal-coordinator.js';
import { classifyPublicTradeRequestRejection, createSubmittedTradeStore, showSubmittedTradeStatus, pollForConfirmation as reconcileConfirmation } from '../../shared/public-trade-ops.js';
import { fetchFa2BalancePages } from '../../shared/tzkt-fa2-balances.js';

// Execute current production selection, send and wallet lifecycle consumers.
// Only DOM rendering, Beacon and indexer/poll boundaries are inert.
const source = readFileSync(new URL('./events.js', import.meta.url), 'utf8').replace(/\r\n?/g, '\n');
function section(start, end) {
  const begin = source.indexOf(start), finish = source.indexOf(end, begin);
  assert.ok(begin >= 0 && finish > begin, `Missing production anchors: ${start}, ${end}`);
  return source.slice(begin, finish);
}
const flush = () => new Promise(resolve => setImmediate(resolve));
const walletAbort = () => ({ type: 'error', version: '2', id: 'wallet-request', senderId: 'wallet-sender', errorType: 'ABORTED_ERROR' });
function deferred() {
  let resolve;
  const promise = new Promise(yes => { resolve = yes; });
  return { promise, resolve };
}

function fixture({ pause, approved = false, failure, inventory = false, storage = new Map(), confirmation,
  operationResponse = { transactionHash: 'inert-operation-hash' }, requestError, originType = 'extension' } = {}) {
  const gate = deferred(), started = new Set(), requests = [], approvals = [], mappings = [];
  const errors = [], modals = [], confirmations = [], balances = [], refreshes = [];
  const state = { redeemSupply: inventory ? null : 7, countdownPhase: 'live' };
  const checkbox = { checked: true }, listeners = new Set();
  const makeAccount = address => ({ address, senderId: 'wallet-sender', origin: { type: originType } });
  let account = makeAccount('wallet-A'), accountReads = 0;
  const row = { dataset: { contractAddress: 'burn', tokenId: '4' },
    querySelector: () => ({ textContent: String(row.balance) }), balance: 5 };
  checkbox.closest = () => row;
  const approval = { kind: 'transaction', destination: 'burn', amount: '0',
    parameters: { entrypoint: 'update_operators', value: [{ prim: 'Left', args: [{ prim: 'Pair',
      args: [{ string: 'wallet-A' }, { prim: 'Pair', args: [{ string: 'escrow' }, { int: '4' }] }] }] }] } };
  async function boundary(name, result) {
    started.add(name);
    if (pause === name) await gate.promise;
    if (failure === name) throw (name === 'request' && requestError) || new Error(`inert ${name} failure`);
    return result;
  }
  const context = vm.createContext({
    networkConfigAvailable: true, network: 'testnet', TZKT_BASE: 'https://inert.test',
    createSubmittedTradeStore: () => createSubmittedTradeStore({ locks: () => ({ request: async (_name, options, run) => (run || options)({}) }), storage: () => ({ get length() { return storage.size; }, key: i => [...storage.keys()][i], getItem: k => storage.get(k), setItem: (k, v) => storage.set(k, v), removeItem: k => storage.delete(k) }) }),
    classifyPublicTradeRequestRejection, showSubmittedTradeStatus,
    burnTokens: [{ collection: 'HEN', enabled: true, burnAmount: 2 }], collections: { HEN: 'burn', REDEEM: 'redeem' },
    redeemToken: { collection: 'REDEEM', tokenId: '7', redeemAmount: 3 }, REDEEM_CONTRACT_ADDRESS: 'redeem',
    BURN_REDEEM_CONTRACT_ADDRESS: 'escrow',
    normalizeString: value => String(value ?? '').trim().toLowerCase(),
    logger: { log() {} }, console: { error: (...args) => errors.push(args), warn() {} },
    isCurrentWalletProjection, AppState: state, updateAppState: patch => {
      Object.assign(state, patch); listeners.forEach(fn => fn(state));
    },
    subscribeToAppState: fn => listeners.add(fn),
    getVerifiedPublicActiveAccount: () => boundary(++accountReads === 1 ? 'initial-account' : 'final-account', account),
    buildApprovalOps: (owner, cart) => {
      approvals.push({ owner, cart: structuredClone(cart) });
      return boundary('approval', approved ? [] : [approval]);
    },
    fetchTokenPairId: (...terms) => { mappings.push(terms); return boundary('mapping', '10'); },
    window: { dAppClient: { requestOperation: payload => {
      requests.push(structuredClone(payload)); return boundary('request', operationResponse);
    } } },
    document: {
      querySelector: selector => selector.includes(':checked') ? (checkbox.checked ? checkbox : null)
        : selector === '.loading-modal-div' ? { querySelector: () => null } : null,
      querySelectorAll: () => [checkbox],
    },
    showModal: (...args) => modals.push(args), hideModal() {}, setTimeout() {}, clearInterval() {},
    renderWalletTokenLoadingState() {}, renderDisconnectedWalletTokenState() {},
    renderConnectedWalletTokenFailureState() {}, updateEventCartBurnToken() {},
    updateTokensWithWalletData: async () => {}, fetchNFTs: async () => [],
    resetEventsUI() { checkbox.checked = false; },
    pollForConfirmation: (hash, receipt) => { confirmations.push(hash); return confirmation ? confirmation(hash, receipt) : boundary('confirmation'); },
    pollForNFTUpdate: (address, tokens) => {
      balances.push({ address, tokens: structuredClone(tokens) }); return boundary('balances', ['updated-holdings']);
    },
    refreshConnectedState: nfts => { refreshes.push(nfts); },
  });
  vm.runInContext([
    section('function getBurnAmountForContract(', '// HELPERS: REDEEM PANEL'),
    section('let eventExchangeInFlight', '// UI STATE TOGGLING:'),
    section('let synchronizedWalletAddress', 'document.addEventListener(PUBLIC_WALLET_STATE_EVENT'),
  ].join('\n'), context);
  const sync = status => context.synchronizeDropsWalletState({ status, account, nftsPromise: Promise.resolve([]) });
  sync('connected'); checkbox.checked = true;
  const change = (kind, reselect = false) => {
    if (kind === 'pending') sync('pending');
    else {
      account = kind === 'disconnect' ? null : makeAccount(kind === 'replacement' ? 'wallet-B' : 'wallet-A');
      if (kind === 'reconnect') { context.synchronizeDropsWalletState({ status: 'unconnected' }); }
      sync(account ? 'connected' : 'unconnected');
    }
    if (reselect) checkbox.checked = true;
  };
  const f = { context, state, gate, started, requests, approvals, mappings, errors, modals, confirmations, balances, refreshes,
    row, checkbox, change, setAccount: value => { account = value; }, send: () => context.handleEventExchange(),
    clearFailure: () => { failure = undefined; },
    pending: () => vm.runInContext('eventExchangeInFlight', context),
    async waitAt(name) { await flush(); assert.ok(started.has(name), `Production path reached ${name}`); } };
  if (inventory) installInventory(f);
  return f;
}

// Compose the real supply resolver/poller, UI renderer, fetchNFTs proxy and
// Beacon complete-read adapter. Only HTTP, DOM, timers and wallet are inert.
function installInventory(f) {
  const { context, state } = f;
  const intervals = new Map(), events = new Map(), pill = {}, revealed = [];
  const button = { style: { removeProperty() {} }, classList: { toggle() {}, add() {}, remove() {} } };
  let reads = 0, nextTimer = 0;
  let provider = async () => ({ ok: true, json: async () => [
    { id: 1, token: { tokenId: '7', contract: { address: 'redeem' } }, balance: '7' }
  ] });
  const beaconSource = readFileSync(new URL('../../shared/beacon-setup.js', import.meta.url), 'utf8');
  const beacon = vm.createContext({ fetchFa2BalancePages, tzkt: { testnet: 'https://inert.invalid' },
    network: 'testnet', logger: { log() {} }, console: context.console,
    fetch: (...args) => { reads++; return provider(...args); } });
  vm.runInContext(beaconSource.slice(beaconSource.indexOf('async function fetchNFTs('),
    beaconSource.indexOf('window.fetchNFTs = fetchNFTs;')), beacon);
  context.window.fetchNFTs = beacon.fetchNFTs;
  context.document.hidden = false;
  context.document.addEventListener = (name, fn) => events.set(name, fn);
  const query = context.document.querySelector;
  context.document.querySelector = selector => selector === '.supply-text-number' ? pill
    : selector === '.event-cart-exchange-button-no-select.w-button' ? button : query(selector);
  Object.assign(context, {
    redeemInitialSupplyCommitted: false, redeemInitialSupplyPublishing: false,
    initialDropStateReveal: { markReady: name => revealed.push({ name, text: pill.textContent, supply: state.redeemSupply }) },
    setInterval: (fn, ms) => { const id = ++nextTimer; intervals.set(id, { fn, ms }); return id; },
    clearInterval: id => intervals.delete(id),
  });
  state.selectedTokenId = '4';
  vm.runInContext([
    section('async function fetchNFTs(', '/**\n * Renders all'),
    section('let redeemSupplyIntervalId', '// HANDLER: EVENTS EXCHANGE FLOW'),
    section('function commitInitialRedeemSupply(', '// HELPERS: CMS ROWS'),
    section('function computeExchangeButtonState(', '/**\n * Ensures only one burn-token checkbox'),
    section("document.addEventListener('visibilitychange'", '// — no spinner toggles'),
    'subscribeToAppState(updateExchangeButtonState); updateExchangeButtonState(AppState);',
  ].join('\n'), context);
  f.inventory = { pill, button, intervals, revealed,
    reads: () => reads, timersCreated: () => nextTimer,
    provider: fn => { provider = fn; },
    initialize: async () => context.commitInitialRedeemSupply({ querySelector: () => pill }, await context.resolveInitialRedeemSupply()),
    tick: () => [...intervals.values()][0].fn(),
    phase: phase => context.updateAppState({ countdownPhase: phase }),
    visible: visible => { context.document.hidden = !visible; events.get('visibilitychange')(); },
    fail: () => { provider = async () => ({ ok: false, status: 503 }); },
  };
}

test('BAL-002: initial failure is unavailable and disabled, then seven verified units restore trading', async () => {
  const f = fixture({ inventory: true }), s = f.inventory;
  s.fail(); await s.initialize();
  assert.equal(f.state.redeemSupply, null); assert.equal(s.pill.textContent, '[UNAVAILABLE]');
  assert.equal(f.state.exchangeDisabled, true); assert.equal(s.intervals.size, 1);
  assert.equal([...s.intervals.values()][0].ms, 10000); assert.equal(s.reads(), 1);
  assert.deepEqual(s.revealed, [{ name: 'initial-supply', text: '[UNAVAILABLE]', supply: null }]);
  await f.send();
  assert.equal(f.requests.length, 0); assert.equal(f.approvals.length, 0);
  assert.equal(f.started.size, 0, 'unknown entry does not even read the wallet');
  s.provider(async () => ({ ok: true, json: async () => [
    { id: 1, token: { tokenId: '7', contract: { address: 'redeem' } }, balance: '7' }
  ] }));
  await s.tick();
  assert.equal(s.pill.textContent, 'x07'); assert.equal(f.state.redeemSupply, 7);
  assert.equal(f.state.exchangeDisabled, false); assert.equal(s.timersCreated(), 1);
  await s.button.onclick({ preventDefault() {} }); await flush();
  assert.equal(f.requests.length, 1); assert.equal(f.confirmations.length, 1);
  assert.equal(f.requests[0].operationDetails.at(-1).parameters.entrypoint, 'initiate_trade');
  assert.equal(s.revealed.length, 1);
});

test('BAL-002: unresolved healthy initial supply holds publication and cannot start recovery early', async () => {
  const f = fixture({ inventory: true }), s = f.inventory, gate = deferred();
  s.provider(() => gate.promise);
  const initial = s.initialize();
  f.context.reconcileRedeemSupplyPolling(); s.visible(false); s.visible(true);
  assert.equal(s.reads(), 1); assert.equal(s.intervals.size, 0); assert.equal(s.revealed.length, 0);
  assert.equal(f.state.exchangeDisabled, true);
  gate.resolve({ ok: true, json: async () => [
    { id: 1, token: { tokenId: '7', contract: { address: 'redeem' } }, balance: '7' }
  ] });
  await initial;
  assert.deepEqual(s.revealed, [{ name: 'initial-supply', text: 'x07', supply: 7 }]);
  assert.equal(s.intervals.size, 1); assert.equal(s.reads(), 1);
  assert.equal(f.state.exchangeDisabled, false);
});

test('BAL-002: recovery that verifies zero stops polling and stays sold out', async () => {
  const f = fixture({ inventory: true }), s = f.inventory;
  s.fail(); await s.initialize();
  s.provider(async () => ({ ok: true, json: async () => [] }));
  await s.tick();
  assert.equal(f.state.redeemSupply, 0); assert.equal(s.pill.textContent, 'x00');
  assert.equal(s.intervals.size, 0); assert.equal(f.state.exchangeDisabled, true);
  s.visible(false); s.visible(true); s.phase('standby'); s.phase('live');
  assert.equal(s.reads(), 2); assert.equal(s.intervals.size, 0);
  await f.send(); assert.equal(f.requests.length, 0);
});

for (const empty of [false, true]) {
  test(`BAL-002: complete ${empty ? 'absent-token' : 'zero'} inventory stays sold out across lifecycle changes`, async () => {
    const f = fixture({ inventory: true }), s = f.inventory;
    s.provider(async () => ({ ok: true, json: async () => empty ? [] : [
      { id: 1, token: { tokenId: '7', contract: { address: 'redeem' } }, balance: '0' }
    ] }));
    await s.initialize();
    assert.equal(f.state.redeemSupply, 0); assert.equal(s.pill.textContent, 'x00');
    assert.match(s.button.textContent, /SOLD/); assert.equal(f.state.exchangeDisabled, true);
    for (const phase of ['pre', 'standby', 'live']) { s.phase(phase); s.visible(false); s.visible(true); }
    assert.equal(s.intervals.size, 0); assert.equal(s.reads(), 1);
    await f.send(); assert.equal(f.requests.length, 0);
  });
}

test('BAL-002: repeated failures keep one bounded poll and never publish readiness', async () => {
  const f = fixture({ inventory: true }), s = f.inventory;
  s.fail(); await s.initialize();
  for (let tick = 0; tick < 5; tick++) {
    for (let i = 0; i < 3; i++) f.context.reconcileRedeemSupplyPolling();
    assert.equal(s.reads(), tick + 1);
    await s.tick();
    assert.equal(f.state.redeemSupply, null); assert.equal(s.pill.textContent, '[UNAVAILABLE]');
    assert.equal(f.state.exchangeDisabled, true); assert.equal(s.intervals.size, 1);
  }
  assert.equal(s.timersCreated(), 1); assert.equal(s.reads(), 6);
  await f.send(); assert.equal(f.requests.length, 0);
});

test('BAL-002: recovery follows visibility and pre/standby/live without overlapping reads', async () => {
  const f = fixture({ inventory: true }), s = f.inventory;
  s.phase('pre'); s.fail(); await s.initialize();
  assert.equal(s.intervals.size, 0);
  s.phase('standby'); assert.equal(s.intervals.size, 0);
  s.visible(false); s.phase('live'); assert.equal(s.intervals.size, 0);
  const gate = deferred();
  s.provider(() => gate.promise);
  s.visible(true); assert.equal(s.intervals.size, 1); assert.equal(s.reads(), 2);
  const tick = s.tick(); assert.equal(s.reads(), 2);
  s.visible(false); assert.equal(s.intervals.size, 0);
  s.phase('standby'); s.visible(true); assert.equal(s.intervals.size, 0);
  s.phase('live'); assert.equal(s.intervals.size, 1); assert.equal(s.reads(), 2);
  s.phase('pre'); assert.equal(s.intervals.size, 0);
  gate.resolve({ ok: true, json: async () => [
    { id: 1, token: { tokenId: '7', contract: { address: 'redeem' } }, balance: '7' }
  ] });
  await tick;
  assert.equal(f.state.redeemSupply, 7); assert.equal(s.intervals.size, 0);
  assert.equal(f.state.exchangeDisabled, true, 'verified supply cannot enable a pre-phase button');
  s.phase('live'); await flush();
  assert.equal(s.intervals.size, 1); assert.equal(f.state.exchangeDisabled, false);
});

test('BAL-002: a later incomplete read revokes positive inventory instead of publishing its partial seven units', async () => {
  const f = fixture({ inventory: true }), s = f.inventory;
  await s.initialize(); assert.equal(f.state.redeemSupply, 7);
  s.provider(async url => new URL(url).searchParams.has('id.gt') ? { ok: false, status: 503 }
    : { ok: true, json: async () => Array.from({ length: 100 }, (_, i) => ({
      id: i + 1, token: { tokenId: String(i === 0 ? 7 : i + 100), contract: { address: 'redeem' } }, balance: '7'
    })) });
  await s.tick();
  assert.equal(f.state.redeemSupply, null); assert.equal(s.pill.textContent, '[UNAVAILABLE]');
  assert.equal(f.state.exchangeDisabled, true); assert.equal(s.intervals.size, 1);
  assert.equal(s.reads(), 3); await f.send(); assert.equal(f.requests.length, 0);
});

for (const stage of ['initial-account', 'approval', 'mapping', 'final-account']) {
  test(`BAL-002: captured Exchange action cannot send after supply fails during ${stage}`, async () => {
    const f = fixture({ inventory: true, pause: stage }), s = f.inventory;
    await s.initialize();
    const capturedAction = f.context.computeExchangeButtonState(f.state).clickAction;
    const run = capturedAction(); await f.waitAt(stage);
    s.fail(); await s.tick(); assert.equal(f.state.redeemSupply, null);
    f.gate.resolve(); await run;
    assert.equal(f.requests.length, 0); assert.equal(f.confirmations.length, 0);
    assert.equal(f.pending(), false); assert.equal(f.modals.at(-1)[0], 'ERROR');
    await capturedAction(); assert.equal(f.requests.length, 0);
  });
}

for (const stage of ['initial-account', 'approval', 'mapping', 'final-account']) {
  for (const change of ['disconnect', 'replacement', 'reconnect', 'pending']) {
    test(`EA-XYZ-P3-T002: ${change} during ${stage} prevents a stale request`, async () => {
      const f = fixture({ pause: stage });
      const run = f.send(); await f.waitAt(stage);
      // Re-selecting the same eligible token cannot restore a revoked generation.
      f.change(change, true); f.gate.resolve(); await run;
      assert.equal(f.requests.length, 0);
      assert.equal(f.confirmations.length, 0); assert.equal(f.refreshes.length, 0);
      assert.equal(f.pending(), false); assert.equal(f.modals.at(-1)[0], 'ERROR');
    });
  }
}

for (const stage of ['approval', 'mapping', 'final-account']) {
  for (const change of ['unselect', 'token', 'contract', 'balance', 'balance-increase', 'amount']) {
    test(`EA-XYZ-P3-T002: changed selected cart (${change}) during ${stage} prevents send`, async () => {
      const f = fixture({ pause: stage }); const run = f.send(); await f.waitAt(stage);
      if (change === 'unselect') f.checkbox.checked = false;
      if (change === 'token') f.row.dataset.tokenId = '5';
      if (change === 'contract') f.row.dataset.contractAddress = 'another-burn';
      if (change === 'balance') f.row.balance = 1;
      if (change === 'balance-increase') f.row.balance = 6;
      if (change === 'amount') f.context.burnTokens[0].burnAmount = 3;
      f.gate.resolve(); await run;
      assert.equal(f.requests.length, 0); assert.equal(f.pending(), false);
      assert.equal(f.modals.at(-1)[0], 'ERROR');
    });
  }
}

test('EA-XYZ-P3-T002: disconnected entry never builds or requests a trade', async () => {
  const f = fixture(); f.change('disconnect'); await f.send();
  assert.equal(f.requests.length, 0); assert.equal(f.approvals.length, 0);
  assert.equal(f.modals.at(-1)[1], '[NO WALLET CONNECTED.]'); assert.equal(f.pending(), false);
});

test('EA-XYZ-P3-T002: account differing from the selected wallet projection cannot authorize a trade', async () => {
  const f = fixture(); f.setAccount({ address: 'wallet-B' }); await f.send();
  assert.equal(f.requests.length, 0); assert.equal(f.approvals.length, 0);
  assert.equal(f.modals.at(-1)[0], 'ERROR'); assert.equal(f.pending(), false);
});

for (const account of [null, { address: 'wallet-B' }]) {
  test(`EA-XYZ-P3-T002: final verified account ${account?.address || 'absent'} blocks send without a projection event`, async () => {
    const f = fixture({ pause: 'mapping' }); const run = f.send(); await f.waitAt('mapping');
    f.setAccount(account); f.gate.resolve(); await run;
    assert.equal(f.requests.length, 0); assert.equal(f.pending(), false);
  });
}

for (const approved of [false, true]) {
  test(`EA-XYZ-P3-T002: authorized trade preserves terms, approval order and confirmed refresh (approved=${approved})`, async () => {
    const f = fixture({ approved }); await f.send();
    assert.equal(f.requests.length, 1); assert.equal(f.errors.length, 0);
    const ops = f.requests[0].operationDetails;
    assert.equal(ops.length, approved ? 1 : 2);
    if (!approved) {
      assert.equal(ops[0].parameters.entrypoint, 'update_operators');
      assert.equal(ops[0].parameters.value[0].args[0].args[0].string, 'wallet-A');
    }
    assert.deepEqual(ops.at(-1), { kind: 'transaction', destination: 'escrow', amount: '0',
      parameters: { entrypoint: 'initiate_trade', value: [{ prim: 'Pair', args: [
        { prim: 'Pair', args: [{ prim: 'Pair', args: [{ int: '2' }, { string: 'burn' }] },
          { prim: 'Pair', args: [{ int: '4' }, { int: '3' }] }] },
        { prim: 'Pair', args: [{ prim: 'Pair', args: [{ string: 'redeem' }, { int: '7' }] },
          { prim: 'Pair', args: [{ int: '10' }, { string: 'wallet-A' }] }] },
      ] }] } });
    assert.equal(f.approvals[0].owner, 'wallet-A');
    assert.deepEqual(f.approvals[0].cart, [{ contractAddress: 'burn', tokenId: '4', quantity: 2, startingBalance: 5 }]);
    assert.deepEqual(Array.from(f.mappings[0]), ['burn', '4', 2]);
    assert.deepEqual(f.confirmations, ['inert-operation-hash']);
    assert.deepEqual(f.balances, [{ address: 'wallet-A', tokens: f.approvals[0].cart }]);
    assert.deepEqual(f.refreshes, [['updated-holdings']]); assert.equal(f.pending(), false);
  });
}

for (const stage of ['initial-account', 'approval', 'mapping', 'final-account', 'request', 'confirmation']) {
  test(`EA-XYZ-P3-T002: pending ownership prevents duplicates during ${stage}`, async () => {
    const f = fixture({ pause: stage }); const run = f.send(); await f.waitAt(stage);
    await f.send(); assert.equal(f.approvals.length, stage === 'initial-account' ? 0 : 1);
    f.gate.resolve(); await run; assert.equal(f.requests.length, 1); assert.equal(f.pending(), false);
  });
}

for (const stage of ['final-account', 'request']) {
  test(`EA-XYZ-P3-T002: ${stage} failure reports error and releases ownership for retry`, async () => {
    const f = fixture({ failure: stage, requestError: walletAbort() }); await f.send();
    assert.equal(f.modals.at(-1)[0], 'ERROR'); assert.equal(f.pending(), false);
    assert.equal(f.refreshes.length, 0);
    const previousRequests = f.requests.length;
    f.clearFailure(); f.checkbox.checked = true; await f.send();
    assert.equal(f.requests.length, previousRequests + 1); assert.equal(f.pending(), false);
    assert.equal(f.refreshes.length, 1); assert.equal(f.errors.length, 1);
  });
}

test('EA-XYZ-P3-T002: disconnect during submitted confirmation retains polling but prevents stale holdings refresh', async () => {
  const f = fixture({ pause: 'confirmation' }); const run = f.send(); await f.waitAt('confirmation');
  f.change('disconnect'); f.gate.resolve(); await run;
  assert.equal(f.requests.length, 1); assert.equal(f.confirmations.length, 1);
  assert.equal(f.balances.length, 1); assert.equal(f.refreshes.length, 0); assert.equal(f.pending(), false);
});

test('EA-XYZ-P3-T002: cancelled stale intent permits a fresh authorized trade', async () => {
  const f = fixture({ pause: 'mapping' }); const run = f.send(); await f.waitAt('mapping');
  f.change('replacement', true); f.gate.resolve(); await run; assert.equal(f.requests.length, 0);
  f.change('reconnect', true); await f.send(); assert.equal(f.requests.length, 1); assert.equal(f.pending(), false);
});

test('TX-002: real confirmation timeout survives resets/reconnect/reload and reconciles without another send', async () => {
  const storage = new Map();
  let evidence = [], mode = 'missing';
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    if (mode === 'outage') throw new Error('inert outage');
    if (mode === 'malformed') return { ok: true, json: async () => { throw new SyntaxError('inert JSON'); } };
    return { ok: true, json: async () => evidence };
  };
  const confirmation = (hash, receipt) => reconcileConfirmation({ tzktBase: receipt.tzktBase, opHash: hash,
    expectedDestination: receipt.escrowAddress, expectedEntrypoint: 'initiate_trade', submittedTrade: receipt,
    timeout: 8, interval: 0 });
  try {
    const h = fixture({ storage, confirmation }); await h.send();
    assert.equal(h.requests.length, 1); assert.equal(h.modals.at(-1)[0], 'CONFIRMATION UNKNOWN');
    for (mode of ['outage', 'malformed', 'missing']) {
      await h.context.retryTradeConfirmation(); await h.send();
      assert.equal(h.requests.length, 1); assert.equal(h.refreshes.length, 0);
    }
    h.context.resetEventsUI(); h.checkbox.checked = true;
    h.change('reconnect', true); await flush(); await h.send();
    assert.equal(h.requests.length, 1);
    const reloaded = fixture({ storage, confirmation }); await reloaded.send();
    assert.equal(reloaded.requests.length, 0);
    evidence = [{ id: 1, type: 'transaction', hash: 'inert-operation-hash', sender: { address: 'wallet-B' },
      target: { address: 'escrow' }, parameter: { entrypoint: 'initiate_trade' }, status: 'applied' }];
    await reloaded.context.retryTradeConfirmation();
    assert.equal(vm.runInContext('submittedTrades.get(submittedTradeScope()).status', reloaded.context), 'submitted');
    evidence[0].sender.address = 'wallet-A';
    await reloaded.context.retryTradeConfirmation();
    assert.equal(reloaded.requests.length, 0);
    assert.equal(vm.runInContext('submittedTrades.get(submittedTradeScope()).status', reloaded.context), 'applied');
    assert.equal(vm.runInContext('confirmedDropsTrades.has("wallet-A")', reloaded.context), true);
    assert.match(reloaded.modals.at(-1)[0], /BURN COMPLETE/);
  } finally { globalThis.fetch = originalFetch; }
});

test('TX-002: verified terminal failure releases Drops receipt and permits an evidence-based fresh send', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: true, json: async () => [{ id: 1, type: 'transaction',
    hash: 'inert-operation-hash', sender: { address: 'wallet-A' }, target: { address: 'escrow' },
    parameter: { entrypoint: 'initiate_trade' }, status: 'backtracked' }] });
  try {
    const h = fixture({ confirmation: (hash, receipt) => reconcileConfirmation({ tzktBase: receipt.tzktBase,
      opHash: hash, submittedTrade: receipt, timeout: 8, interval: 0 }) });
    await h.send(); assert.equal(h.requests.length, 1); assert.equal(h.refreshes.length, 0);
    assert.equal(h.modals.at(-1)[0], 'ERROR'); assert.match(h.modals.at(-1)[1], /backtracked/);
    assert.equal(vm.runInContext('submittedTrades.get(submittedTradeScope())', h.context), null);
    await h.send(); assert.equal(h.requests.length, 2);
  } finally { globalThis.fetch = originalFetch; }
});

test('TX-002: Drops captures opHash alias and retains missing-hash responses across retry', async () => {
  const alias = fixture({ operationResponse: { opHash: 'alias-hash' }, failure: 'confirmation' });
  await alias.send(); assert.deepEqual(alias.confirmations, ['alias-hash']);
  await alias.send(); assert.equal(alias.requests.length, 1);
  const missing = fixture({ operationResponse: {} });
  await missing.send(); await missing.send(); await missing.context.retryTradeConfirmation();
  assert.equal(missing.requests.length, 1); assert.equal(missing.confirmations.length, 0);
  assert.match(missing.modals.at(-1)[1], /CHECK WALLET OPERATION HISTORY/);
});

test('TX-002: ambiguous Drops wallet rejections retain receipts across resets, reconnect and reload', async () => {
  for (const [originType, rejection] of [
    ['extension', new Error('inert transport outcome unknown')],
    ['walletconnect', walletAbort()],
    ['extension', { ...walletAbort(), senderId: '' }],
    ['extension', { ...walletAbort(), senderId: 'other-wallet' }],
    ['extension', { name: 'UnknownBeaconError', title: 'Aborted', message: '[ABORTED_ERROR]:The action was aborted by the user.' }],
    ['extension', { ...walletAbort(), transactionHash: 'unverified-hash-hint' }],
    ['extension', { ...walletAbort(), errorData: { transactionHash: 'unverified-hash-hint' } }],
    ['unknown', walletAbort()]
  ]) {
    const storage = new Map();
    const h = fixture({ storage, originType, failure: 'request', requestError: rejection });
    await h.send(); assert.equal(h.requests.length, 1); assert.equal(h.modals.at(-1)[0], 'CONFIRMATION UNKNOWN');
    assert.equal(vm.runInContext('submittedTrades.get(submittedTradeScope()).hash', h.context), null);
    h.clearFailure(); h.context.resetEventsUI(); h.change('reconnect', true); await flush();
    await h.send(); await h.context.retryTradeConfirmation(); assert.equal(h.requests.length, 1);
    assert.equal(h.confirmations.length, 0, 'No hash is inferred from generic error payloads');
    const reload = fixture({ storage }); await reload.send();
    assert.equal(reload.requests.length, 0); assert.equal(reload.modals.at(-1)[0], 'CONFIRMATION UNKNOWN');
  }
});

test('TX-002: explicit matching Drops wallet abort is retryable on extension and P2P', async () => {
  for (const originType of ['extension', 'p2p']) {
    const storage = new Map(), h = fixture({ storage, originType, failure: 'request', requestError: walletAbort() });
    await h.send(); assert.equal(h.requests.length, 1); assert.equal(h.modals.at(-1)[0], 'ERROR');
    assert.equal(vm.runInContext('submittedTrades.get(submittedTradeScope())', h.context), null);
    const reload = fixture({ storage, originType }); await reload.send(); assert.equal(reload.requests.length, 1);
  }
});

test('TX-002: Drops captures rejection provenance before the wallet await and retains a complete returned receipt', async () => {
  const h = fixture({ originType: 'walletconnect', pause: 'request', failure: 'request', requestError: walletAbort() });
  const run = h.send(); await h.waitAt('request');
  h.state.activeAccount.origin.type = 'extension'; h.gate.resolve(); await run;
  assert.equal(h.modals.at(-1)[0], 'CONFIRMATION UNKNOWN'); await h.send(); assert.equal(h.requests.length, 1);
  const storage = new Map(), returned = fixture({ storage, failure: 'request', requestError: {
    type: 'operation_response', version: '2', id: 'wallet-request', senderId: 'wallet-sender', transactionHash: 'returned-hash'
  } });
  await returned.send(); assert.equal(vm.runInContext('submittedTrades.get(submittedTradeScope()).hash', returned.context), 'returned-hash');
  const reload = fixture({ storage }); await reload.send(); assert.equal(reload.requests.length, 0);
  await reload.context.retryTradeConfirmation(); assert.deepEqual(reload.confirmations, ['returned-hash']);
  assert.equal(reload.requests.length, 0);
});
