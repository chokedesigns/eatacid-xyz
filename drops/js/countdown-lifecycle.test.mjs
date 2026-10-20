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

function fixture({ past = false, pendingTime = false, wallet = false } = {}) {
  const f = clockFixture();
  f.window = new TrackedTarget();
  f.document = Object.assign(new TrackedTarget(), { hidden: false });
  const state = { walletConnected: wallet, activeAccount: wallet ? { address: 'inert-wallet' } : null };
  const pills = [{}, {}]; const storage = []; const nft = []; const errors = []; const waits = new Map();
  let waitId = 0; let walletRenders = 0; let configValid = true; let resolveTime; let timeSignal;
  if (pendingTime) f.clock = createTrustedClock({
    monotonicNow: () => f.mono, wallNow: () => f.wall, nonce: () => 'inert',
    setTimeoutFn: () => 1, clearTimeoutFn() {},
    fetchTime: (url, options) => { timeSignal = options.signal; return new Promise(r => { resolveTime = r; }); },
  });
  const context = vm.createContext({
    window: f.window, document: { querySelector: sel => sel.endsWith('-mobile') ? pills[1] : pills[0] },
    AbortController, TIME_UNAVAILABLE, applyEllipsis() {}, AppState: state,
    updateAppState: patch => Object.assign(state, patch),
    console: { warn() {}, error: (...args) => errors.push(args) }, logger: { log() {} },
    dropDate: {}, dropTime: {},
    computeDropInstant: () => configValid ? { ok: true, date: new Date(BASE + (past ? -1000 : 3600000)) }
      : { ok: false, error: 'BAD_DATE' },
    formatDropCountdown,
    startDropCountdown: args => startDropCountdown({ ...args, ...f.options, clock: f.clock,
      windowRef: f.window, documentRef: f.document }),
    BURN_REDEEM_CONTRACT_ADDRESS: 'inert', TZKT_BASE: 'https://inert.invalid', networkConfigAvailable: true,
    fetch: (url, options) => new Promise((resolve, reject) => storage.push({ url, options, resolve, reject })),
    fetchNFTs: () => new Promise(resolve => nft.push(resolve)),
    updateTokensWithWalletData: async () => { walletRenders++; },
    walletRefreshGeneration: 0,
    walletHoldingsRequest: 0,
    setTimeout: fn => { const id = ++waitId; waits.set(id, fn); return id; },
    clearTimeout: id => waits.delete(id),
  });
  vm.runInContext(code, context);
  const call = text => vm.runInContext(text, context);
  const pagehide = persisted => f.window.dispatchEvent(Object.assign(new Event('pagehide'), { persisted }));
  return { f, state, pills, storage, nft, errors, waits, call, pagehide,
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

test('late standby storage cannot publish LIVE after pagehide', async () => {
  const h = fixture({ past: true });
  h.call('startCountdown()'); await flush();
  assert.equal(h.state.countdownPhase, 'standby');
  const first = h.storage[0];
  h.pagehide(false);
  first.resolve({ json: async () => ({ paused: false }) }); await flush();
  assert.notEqual(h.state.countdownPhase, 'live'); // Original T001 writes LIVE NOW! here.
  assert.equal(h.pills[0].textContent, TIME_UNAVAILABLE);
  assert.equal(first.options.signal.aborted, true);
  assert.equal(h.f.timers.size, 0); assert.equal(h.listenerCount(), 0);
  assert.equal(h.errors.length, 0);
});

test('standby replacement suppresses stale success and error, while current polling can recover', async () => {
  const h = fixture({ past: true });
  h.call('startCountdown()'); await flush(); const first = h.storage[0];
  h.call('startCountdown()'); await flush(); const second = h.storage[1];
  assert.equal(first.options.signal.aborted, true);
  first.resolve({ json: async () => ({ paused: false }) }); await flush();
  assert.equal(h.state.countdownPhase, 'standby');
  h.call('startCountdown()'); await flush();
  second.reject(new Error('superseded storage failure')); await flush();
  assert.equal(h.errors.length, 0);
  h.storage[2].resolve({ json: async () => ({ paused: false }) }); await flush();
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
  h.storage[1].resolve({ json: async () => ({ paused: true }) }); await flush();
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
    h.storage[0].resolve({ json: () => new Promise(resolve => { finishBody = resolve; }) }); await flush();
    if (stage === 'wallet') { finishBody({ paused: false }); await flush(); assert.equal(h.nft.length, 1); }
    h.pagehide(false);
    if (stage === 'body') finishBody({ paused: false }); else h.nft[0]([]);
    await flush();
    assert.equal(h.walletRenders(), 0); assert.notEqual(h.state.countdownPhase, 'live');
    assert.equal(h.listenerCount(), 0);
  }
});

test('standby NFT response cannot repaint after disconnect and reconnect to the same address', async () => {
  const h = fixture({ past: true, wallet: true });
  h.call('startCountdown()'); await flush();
  h.storage[0].resolve({ json: async () => ({ paused: false }) }); await flush();
  assert.equal(h.nft.length, 1);
  h.state.activeAccount = null; h.state.walletConnected = false;
  h.call('walletRefreshGeneration++');
  h.state.activeAccount = { address: 'inert-wallet' }; h.state.walletConnected = true;
  h.call('walletRefreshGeneration++');
  h.nft[0]([]); await flush();
  assert.equal(h.walletRenders(), 0);
  assert.equal(h.errors.length, 0);
  h.call('stopPublicCountdown()');
});

test('replacement with invalid configuration still disposes the previous owner', async () => {
  const h = fixture();
  h.call('startCountdown()'); await flush();
  h.invalidateConfig(); h.call('startCountdown()');
  assert.equal(h.state.countdownPhase, 'config-error');
  assert.equal(h.f.timers.size, 0); assert.equal(h.listenerCount(), 0);
});
