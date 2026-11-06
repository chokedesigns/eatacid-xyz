import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import { createTrustedClock, startDropCountdown, formatDropCountdown, TIME_UNAVAILABLE } from '../../shared/drop-countdown.js';
import { BASE, response, clockFixture, flush } from '../../shared/drop-countdown.fixtures.mjs';

const source = readFileSync(new URL('./events.js', import.meta.url), 'utf8');
const ownerStart = source.indexOf('let publicCountdownOwner');
const begin = ownerStart < 0 ? source.indexOf('async function pollForUnpause(') : ownerStart;
const code = source.slice(begin, source.indexOf('// EXCHANGE BUTTON STATE MANAGEMENT', begin));

class TrackedTarget extends EventTarget {
  listeners = new Map();
  addEventListener(type, handler, options) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(handler);
    super.addEventListener(type, handler, options);
  }
  removeEventListener(type, handler, options) {
    this.listeners.get(type)?.delete(handler);
    super.removeEventListener(type, handler, options);
  }
  count() { return [...this.listeners.values()].reduce((sum, set) => sum + set.size, 0); }
}

function fixture({ past = false, pendingTime = false, wallet = false, networkAvailable = true } = {}) {
  const f = clockFixture();
  f.window = new TrackedTarget();
  f.document = Object.assign(new TrackedTarget(), { hidden: false });
  const state = { walletConnected: wallet, activeAccount: wallet ? { address: 'inert-wallet' } : null };
  const pills = [{}, {}]; const storage = []; const nft = []; const errors = []; const waits = new Map();
  const publications = []; const waitDelays = [];
  let waitId = 0; let walletRenders = 0; let configValid = true; let resolveTime; let timeSignal;
  if (pendingTime) f.clock = createTrustedClock({
    monotonicNow: () => f.mono, wallNow: () => f.wall, nonce: () => 'inert',
    setTimeoutFn: () => 1, clearTimeoutFn() {},
    fetchTime: (url, options) => { timeSignal = options.signal; return new Promise(r => { resolveTime = r; }); },
  });
  const context = vm.createContext({
    window: f.window, document: { querySelector: sel => sel.endsWith('-mobile') ? pills[1] : pills[0] },
    AbortController, TIME_UNAVAILABLE, applyEllipsis() {}, AppState: state,
    updateAppState: patch => { publications.push(patch); Object.assign(state, patch); },
    console: { warn() {}, error: (...args) => errors.push(args) }, logger: { log() {} },
    dropDate: {}, dropTime: {},
    computeDropInstant: () => configValid ? { ok: true, date: new Date(BASE + (past ? -1000 : 3600000)) }
      : { ok: false, error: 'BAD_DATE' },
    formatDropCountdown,
    startDropCountdown: args => startDropCountdown({ ...args, ...f.options, clock: f.clock,
      windowRef: f.window, documentRef: f.document }),
    BURN_REDEEM_CONTRACT_ADDRESS: 'inert', TZKT_BASE: 'https://inert.invalid', networkConfigAvailable: networkAvailable,
    networkUnavailableMessage: 'This network is not configured yet.',
    fetch: (url, options) => new Promise((resolve, reject) => storage.push({ url, options, resolve, reject })),
    fetchNFTs: () => new Promise(resolve => nft.push(resolve)),
    updateTokensWithWalletData: async () => { walletRenders++; },
    walletRefreshGeneration: 0,
    walletHoldingsRequest: 0,
    setTimeout: (fn, delay) => { const id = ++waitId; waits.set(id, fn); waitDelays.push(delay); return id; },
    clearTimeout: id => waits.delete(id),
    dropsBalanceRefreshFailed: false, handleEventExchange() {},
  });
  vm.runInContext(code, context);
  const call = text => vm.runInContext(text, context);
  const pagehide = persisted => f.window.dispatchEvent(Object.assign(new Event('pagehide'), { persisted }));
  return { f, state, pills, storage, nft, errors, waits, waitDelays, publications, call, pagehide,
    async retry() {
      assert.equal(waits.size, 1, 'exactly one delayed retry');
      [...waits.values()][0](); await flush();
    },
    buttonState() {
      vm.runInContext(source.slice(source.indexOf('function computeExchangeButtonState('),
        source.indexOf('function updateExchangeButtonState(')), context);
      return call('computeExchangeButtonState(AppState)');
    },
    listenerCount: () => f.window.count() + f.document.count(),
    invalidateConfig: () => { configValid = false; },
    resolveTime: () => resolveTime(response(BASE + 50)),
    timeSignal: () => timeSignal, walletRenders: () => walletRenders };
}

test('public replacement disposes previous countdown and exactly one owner remains', async () => {
  const h = fixture();
  h.call('startCountdown()'); await flush();
  const listenerCount = h.listenerCount();
  assert.equal(h.f.timers.size, 1);
  h.call('startCountdown()'); await flush();
  assert.equal(h.f.timers.size, 1); // Original T001 leaves two timers here.
  assert.equal(h.listenerCount(), listenerCount);
  h.call('stopPublicCountdown()');
  assert.equal(h.f.timers.size, 0); assert.equal(h.listenerCount(), 0);
  assert.equal(h.state.countdownTimerId, null);
});

test('BAL-003: HTTP 503 false stays unavailable; a verified retry publishes LIVE exactly once', async () => {
  const h = fixture({ past: true }); let bodyReads = 0;
  h.call('startCountdown()'); await flush();
  h.storage[0].resolve({ ok: false, status: 503, json: async () => { bodyReads++; return { paused: false }; } });
  await flush();
  assert.equal(bodyReads, 0, 'an HTTP error body is not readiness evidence');
  assert.equal(h.state.countdownPhase, 'standby'); assert.equal(h.state.contractPaused, true);
  assert.equal(h.pills[0].textContent, 'STATUS UNAVAILABLE');
  assert.equal(h.errors.length, 1); assert.equal(h.storage.length, 1);
  assert.deepEqual(h.waitDelays, [3000]); assert.equal(h.f.timers.size, 0);
  assert.equal(h.publications.filter(p => p.countdownPhase === 'live').length, 0);
  await h.retry();
  assert.equal(h.storage.length, 2); assert.equal(h.waits.size, 0);
  h.storage[1].resolve({ ok: true, status: 200, json: async () => ({ paused: false }) }); await flush();
  assert.equal(h.state.countdownPhase, 'live'); assert.equal(h.state.contractPaused, false);
  assert.equal(h.pills[0].textContent, 'LIVE NOW!'); assert.equal(h.pills[1].textContent, 'LIVE NOW!');
  assert.equal(h.publications.filter(p => p.countdownPhase === 'live').length, 1);
  h.f.tick(6000); await flush();
  assert.equal(h.storage.length, 2); assert.equal(h.waits.size, 0);
  assert.equal(h.publications.filter(p => p.countdownPhase === 'live').length, 1);
  h.call('stopPublicCountdown()');
});

for (const [name, reply] of [
  ['HTTP 404', () => ({ ok: false, status: 404, json: async () => ({ paused: false }) })],
  ['HTTP 500', () => ({ ok: false, status: 500, json: async () => ({ paused: false }) })],
  ['missing HTTP success', () => ({ json: async () => ({ paused: false }) })],
  ...[{}, null, [], false, { paused: null }, { paused: 'false' }, { paused: 0 }, { paused: 1 }]
    .map(body => [`invalid status ${JSON.stringify(body)}`, () => ({ ok: true, status: 200, json: async () => body })]),
  ['malformed JSON', () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError('invalid JSON'); } })],
  ['transport failure', () => new Error('offline')],
]) {
  test(`BAL-003: ${name} cannot authorize LIVE and recovers through one retry`, async () => {
    const h = fixture({ past: true, wallet: true });
    h.call('startCountdown()'); await flush();
    const result = reply();
    if (result instanceof Error) h.storage[0].reject(result); else h.storage[0].resolve(result);
    await flush();
    assert.equal(h.state.countdownPhase, 'standby'); assert.equal(h.state.contractPaused, true);
    assert.equal(h.pills[0].textContent, 'STATUS UNAVAILABLE');
    assert.equal(h.nft.length, 0); assert.equal(h.errors.length, 1);
    assert.equal(h.storage.length, 1); assert.equal(h.waits.size, 1);
    assert.deepEqual(h.waitDelays, [3000]);
    await h.retry();
    assert.equal(h.storage.length, 2); assert.equal(h.waits.size, 0);
    h.storage[1].resolve({ ok: true, status: 200, json: async () => ({ paused: true }) }); await flush();
    assert.equal(h.state.countdownPhase, 'standby'); assert.equal(h.state.contractPaused, true);
    assert.equal(h.pills[0].textContent, 'STANDBY…');
    assert.equal(h.nft.length, 0); assert.equal(h.waits.size, 1);
    h.call('stopPublicCountdown()'); await flush();
    assert.equal(h.waits.size, 0); assert.equal(h.listenerCount(), 0);
  });
}

test('BAL-003: verified paused status retains STANDBY messaging through retry failures and recovers', async () => {
  const h = fixture({ past: true });
  h.call('startCountdown()'); await flush();
  h.storage[0].resolve({ ok: true, status: 200, json: async () => ({ paused: true }) }); await flush();
  assert.equal(h.state.countdownPhase, 'standby'); assert.equal(h.pills[0].textContent, 'STANDBY…');
  for (let i = 1; i <= 2; i++) {
    await h.retry();
    assert.equal(h.storage.length, i + 1); assert.equal(h.waits.size, 0);
    await flush(); assert.equal(h.storage.length, i + 1, 'no concurrent or busy-loop requests');
    h.storage[i].reject(new Error('retry failed')); await flush();
    assert.equal(h.state.countdownPhase, 'standby'); assert.equal(h.pills[0].textContent, 'STANDBY…');
    assert.equal(h.waits.size, 1);
  }
  await h.retry();
  h.storage[3].resolve({ ok: true, status: 200, json: async () => ({ paused: false }) }); await flush();
  assert.equal(h.state.countdownPhase, 'live'); assert.equal(h.waits.size, 0);
  assert.equal(h.publications.filter(p => p.countdownPhase === 'live').length, 1);
  h.call('stopPublicCountdown()');
});

test('BAL-003: unavailable network configuration stays non-LIVE with one cancellable retry', async () => {
  const h = fixture({ past: true, networkAvailable: false });
  h.call('startCountdown()'); await flush();
  assert.equal(h.state.countdownPhase, 'standby'); assert.equal(h.state.contractPaused, true);
  assert.equal(h.pills[0].textContent, 'STATUS UNAVAILABLE'); assert.equal(h.errors.length, 1);
  assert.equal(h.storage.length, 0); assert.equal(h.waits.size, 1);
  await h.retry();
  assert.equal(h.state.countdownPhase, 'standby'); assert.equal(h.errors.length, 2);
  assert.equal(h.storage.length, 0); assert.equal(h.waits.size, 1);
  assert.deepEqual(h.waitDelays, [3000, 3000]);
  h.pagehide(false); await flush();
  assert.equal(h.waits.size, 0); assert.equal(h.listenerCount(), 0);
});

test('BAL-003: resolved polling without explicit verification cannot publish LIVE', async () => {
  for (const result of ['undefined', 'null', 'false', '{}', '"true"']) {
    const h = fixture({ past: true });
    h.call(`pollForUnpause = async () => (${result})`);
    h.call('startCountdown()'); await flush();
    assert.equal(h.state.countdownPhase, 'standby'); assert.equal(h.pills[0].textContent, 'STANDBY…');
    h.call('stopPublicCountdown()');
  }
});

test('BAL-003: verified unpause refreshes the current wallet before enabling the trade action', async () => {
  const h = fixture({ past: true, wallet: true });
  Object.assign(h.state, { selectedTokenId: '4', redeemSupply: 7 });
  h.call('startCountdown()'); await flush();
  assert.equal(h.buttonState().clickAction, null);
  h.storage[0].resolve({ ok: true, status: 200, json: async () => ({ paused: false }) }); await flush();
  assert.equal(h.nft.length, 1); assert.equal(h.walletRenders(), 0);
  assert.equal(h.state.countdownPhase, 'standby'); assert.equal(h.buttonState().clickAction, null);
  h.nft[0]([]); await flush();
  assert.equal(h.walletRenders(), 1); assert.equal(h.state.countdownPhase, 'live');
  assert.equal(h.buttonState().liveClass, true);
  assert.equal(h.buttonState().clickAction, h.call('handleEventExchange'));
  assert.equal(h.publications.filter(p => p.countdownPhase === 'live').length, 1);
  assert.equal(h.storage.length, 1); assert.equal(h.waits.size, 0);
  h.call('stopPublicCountdown()');
});

test('BAL-003: aborted owner cannot publish a late verified unpause', async () => {
  const h = fixture({ past: true });
  h.call('startCountdown()'); await flush(); h.call('publicCountdownOwner.abort.abort()');
  h.storage[0].resolve({ ok: true, status: 200, json: async () => ({ paused: false }) }); await flush();
  assert.equal(h.state.countdownPhase, 'standby'); assert.equal(h.waits.size, 0);
  h.call('stopPublicCountdown()'); assert.equal(h.listenerCount(), 0);
});

test('late standby storage cannot publish LIVE after pagehide', async () => {
  const h = fixture({ past: true });
  h.call('startCountdown()'); await flush();
  assert.equal(h.state.countdownPhase, 'standby');
  const first = h.storage[0];
  h.pagehide(false);
  first.resolve({ ok: true, status: 200, json: async () => ({ paused: false }) }); await flush();
  assert.notEqual(h.state.countdownPhase, 'live'); // Original T001 writes LIVE NOW! here.
  assert.equal(h.pills[0].textContent, TIME_UNAVAILABLE);
  assert.equal(first.options.signal.aborted, true);
  assert.equal(h.f.timers.size, 0); assert.equal(h.listenerCount(), 0);
  assert.equal(h.errors.length, 0);
});

test('BAL-003: cached standby resumes one fresh poll and retires the hidden owner', async () => {
  const h = fixture({ past: true });
  h.call('startCountdown()'); await flush(); const old = h.storage[0];
  h.pagehide(true);
  assert.equal(old.options.signal.aborted, true); assert.equal(h.listenerCount(), 1);
  old.resolve({ ok: true, status: 200, json: async () => ({ paused: false }) }); await flush();
  assert.notEqual(h.state.countdownPhase, 'live'); assert.equal(h.waits.size, 0);
  h.f.window.dispatchEvent(Object.assign(new Event('pageshow'), { persisted: true })); await flush();
  assert.equal(h.storage.length, 2); assert.equal(h.state.countdownPhase, 'standby');
  h.f.window.dispatchEvent(Object.assign(new Event('pageshow'), { persisted: true })); await flush();
  assert.equal(h.storage.length, 2);
  h.storage[1].resolve({ ok: true, status: 200, json: async () => ({ paused: false }) }); await flush();
  assert.equal(h.state.countdownPhase, 'live');
  assert.equal(h.publications.filter(p => p.countdownPhase === 'live').length, 1);
  h.call('stopPublicCountdown()'); assert.equal(h.listenerCount(), 0);
});

test('standby replacement suppresses stale success and error, while current polling can recover', async () => {
  const h = fixture({ past: true });
  h.call('startCountdown()'); await flush(); const first = h.storage[0];
  h.call('startCountdown()'); await flush(); const second = h.storage[1];
  assert.equal(first.options.signal.aborted, true);
  first.resolve({ ok: true, status: 200, json: async () => ({ paused: false }) }); await flush();
  assert.equal(h.state.countdownPhase, 'standby');
  h.call('startCountdown()'); await flush();
  second.reject(new Error('superseded storage failure')); await flush();
  assert.equal(h.errors.length, 0);
  h.storage[2].resolve({ ok: true, status: 200, json: async () => ({ paused: false }) }); await flush();
  assert.equal(h.state.countdownPhase, 'live');
  assert.equal(h.pills[0].textContent, 'LIVE NOW!');
  h.call('stopPublicCountdown()'); assert.equal(h.listenerCount(), 0);
});

test('teardown cancels an owned standby retry wait and failure recovery still retries normally', async () => {
  const h = fixture({ past: true });
  h.call('startCountdown()'); await flush();
  h.storage[0].reject(new Error('temporary storage failure')); await flush();
  assert.equal(h.errors.length, 1);
  assert.equal(h.pills[0].textContent, 'STATUS UNAVAILABLE');
  assert.equal(h.waits.size, 1);
  const retry = [...h.waits.values()][0]; h.waits.clear(); retry(); await flush();
  assert.equal(h.storage.length, 2);
  h.storage[1].resolve({ ok: true, status: 200, json: async () => ({ paused: true }) }); await flush();
  assert.equal(h.pills[0].textContent, 'STANDBY…'); assert.equal(h.waits.size, 1);
  h.pagehide(false); await flush();
  assert.equal(h.waits.size, 0); assert.equal(h.listenerCount(), 0);
  assert.equal(h.storage.length, 2);
});

test('back/forward-cache return creates one fresh owner and consumes its one-shot resume listener', async () => {
  const h = fixture();
  h.call('startCountdown()'); await flush();
  h.pagehide(true);
  assert.equal(h.f.timers.size, 0); assert.equal(h.listenerCount(), 1);
  assert.equal(h.pills[0].textContent, TIME_UNAVAILABLE);
  h.f.advance(0, 60000, 60000);
  h.f.window.dispatchEvent(Object.assign(new Event('pageshow'), { persisted: true }));
  assert.equal(h.pills[0].textContent, TIME_UNAVAILABLE); await flush();
  assert.equal(h.f.timers.size, 1);
  assert.match(h.pills[0].textContent, /00:59:00$/);
  const activeListeners = h.listenerCount();
  h.f.window.dispatchEvent(Object.assign(new Event('pageshow'), { persisted: true })); await flush();
  assert.equal(h.f.timers.size, 1); assert.equal(h.listenerCount(), activeListeners);
  h.pagehide(true); h.call('stopPublicCountdown()');
  assert.equal(h.listenerCount(), 0);
  h.f.window.dispatchEvent(new Event('pageshow')); await flush();
  assert.equal(h.f.timers.size, 0);
});

test('teardown aborts pending time work; late synchronization cannot repaint', async () => {
  const h = fixture({ pendingTime: true });
  h.call('startCountdown()'); await flush();
  h.pagehide(false);
  assert.equal(h.timeSignal().aborted, true);
  h.resolveTime(); await flush();
  assert.equal(h.pills[0].textContent, TIME_UNAVAILABLE);
  assert.equal(h.f.timers.size, 0); assert.equal(h.listenerCount(), 0);
});

test('teardown during body parsing or wallet refresh prevents late phase and wallet commits', async () => {
  for (const stage of ['body', 'wallet']) {
    const h = fixture({ past: true, wallet: true });
    h.call('startCountdown()'); await flush();
    let finishBody;
    h.storage[0].resolve({ ok: true, status: 200, json: () => new Promise(resolve => { finishBody = resolve; }) }); await flush();
    if (stage === 'wallet') { finishBody({ paused: false }); await flush(); assert.equal(h.nft.length, 1); }
    h.pagehide(false);
    if (stage === 'body') finishBody({ paused: false }); else h.nft[0]([]);
    await flush();
    assert.equal(h.walletRenders(), 0); assert.notEqual(h.state.countdownPhase, 'live');
    assert.equal(h.listenerCount(), 0);
  }
});

test('verified standby unpause survives retired wallet refreshes without stale repaint', async () => {
  for (const change of ['reconnect', 'account', 'request']) {
    const h = fixture({ past: true, wallet: true });
    h.call('startCountdown()'); await flush();
    h.storage[0].resolve({ ok: true, status: 200, json: async () => ({ paused: false }) }); await flush();
    assert.equal(h.nft.length, 1);
    if (change === 'reconnect') {
      h.state.activeAccount = null; h.state.walletConnected = false;
      h.call('walletRefreshGeneration++');
      h.state.activeAccount = { address: 'inert-wallet' }; h.state.walletConnected = true;
      h.call('walletRefreshGeneration++');
    } else if (change === 'account') {
      h.state.activeAccount = { address: 'replacement-wallet' };
    } else {
      h.call('walletHoldingsRequest++');
    }
    h.nft[0]([]); await flush();
    assert.equal(h.walletRenders(), 0, change);
    assert.equal(h.state.countdownPhase, 'live', change);
    assert.equal(h.state.contractPaused, false);
    assert.equal(h.pills[0].textContent, 'LIVE NOW!');
    assert.equal(h.publications.filter(p => p.countdownPhase === 'live').length, 1);
    assert.equal(h.storage.length, 1); assert.equal(h.waits.size, 0);
    assert.equal(h.errors.length, 0);
    h.call('stopPublicCountdown()');
  }
});

test('retired wallet refresh cannot publish verified unpause for a cancelled countdown owner', async () => {
  for (const cancel of ['abort', 'replace', 'pagehide']) {
    const h = fixture({ past: true, wallet: true });
    h.call('startCountdown()'); await flush();
    h.storage[0].resolve({ ok: true, status: 200, json: async () => ({ paused: false }) }); await flush();
    assert.equal(h.nft.length, 1);
    h.call('walletRefreshGeneration++; walletHoldingsRequest++');
    h.state.activeAccount = { address: 'replacement-wallet' };
    if (cancel === 'abort') h.call('publicCountdownOwner.abort.abort()');
    else if (cancel === 'replace') h.call('startCountdown()');
    else h.pagehide(false);
    await flush(); h.nft[0]([]); await flush();
    assert.equal(h.walletRenders(), 0, cancel);
    assert.notEqual(h.state.countdownPhase, 'live', cancel);
    assert.equal(h.publications.filter(p => p.countdownPhase === 'live').length, 0);
    assert.equal(h.storage.length, cancel === 'replace' ? 2 : 1);
    assert.equal(h.waits.size, 0);
    h.call('stopPublicCountdown()'); assert.equal(h.listenerCount(), 0);
  }
});

test('replacement with invalid configuration still disposes the previous owner', async () => {
  const h = fixture();
  h.call('startCountdown()'); await flush();
  h.invalidateConfig(); h.call('startCountdown()');
  assert.equal(h.state.countdownPhase, 'config-error');
  assert.equal(h.f.timers.size, 0); assert.equal(h.listenerCount(), 0);
});
