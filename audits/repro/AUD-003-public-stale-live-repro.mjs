import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../../drops/js/events.js', import.meta.url), 'utf8');
const start = source.indexOf('let publicCountdownOwner');
const end = source.indexOf('// EXCHANGE BUTTON STATE MANAGEMENT', start);
const buttonStart = source.indexOf('function computeExchangeButtonState(');
const buttonEnd = source.indexOf('function updateExchangeButtonState(', buttonStart);
assert.ok(start >= 0 && end > start && buttonEnd > buttonStart);
const code = `${source.slice(start, end)}\n${source.slice(buttonStart, buttonEnd)}`;
const flush = () => new Promise(resolve => setImmediate(resolve));

async function run(initialPaused) {
  let actualPaused = initialPaused, reads = 0;
  let nextTimer = 0; const timers = new Map();
  const state = { walletConnected: false, activeAccount: null, contractPaused: null,
    countdownPhase: 'pre', selectedTokenId: null, redeemSupply: null };
  const pill = {};
  const realm = vm.createContext({
    window: { addEventListener() {}, removeEventListener() {} },
    document: { querySelector: () => pill },
    AppState: state, updateAppState: patch => Object.assign(state, patch),
    applyEllipsis() {}, AbortController, TIME_UNAVAILABLE: 'TIME UNAVAILABLE',
    console: { error() {}, warn() {} }, logger: { log() {} },
    dropDate: {}, dropTime: {}, computeDropInstant: () => ({ ok: true, date: new Date(0) }),
    startDropCountdown: ({ onExpire }) => { queueMicrotask(onExpire); return { timerId: 1, stop() {} }; },
    BURN_REDEEM_CONTRACT_ADDRESS: 'KT1inert', TZKT_BASE: 'https://inert.invalid',
    networkConfigAvailable: true, fetch: async () => { reads++; return { ok: true, json: async () => ({ paused: actualPaused }) }; },
    setTimeout: (fn, delay) => { const id = ++nextTimer; timers.set(id, { fn, delay }); return id; },
    clearTimeout: id => timers.delete(id),
    walletRefreshGeneration: 0, walletHoldingsRequest: 0,
    dropsBalanceRefreshFailed: false, handleEventExchange() {},
  });
  vm.runInContext(code, realm);
  vm.runInContext('startCountdown()', realm);
  await flush(); await flush();
  return { state, pill, realm, reads: () => reads, setPaused: value => { actualPaused = value; },
    async poll() {
      assert.equal(timers.size, 1, 'one owned pause retry');
      const timer = [...timers.values()][0]; assert.equal(timer.delay, 3000);
      timer.fn(); await flush();
    },
    stop: () => vm.runInContext('stopPublicCountdown()', realm),
    button: () => vm.runInContext('computeExchangeButtonState(AppState)', realm) };
}

const paused = await run(true);
assert.equal(paused.state.countdownPhase, 'standby', 'paused control remains standby');
paused.state.walletConnected = true; paused.state.selectedTokenId = '4'; paused.state.redeemSupply = 5;
assert.equal(paused.button().clickAction, null, 'paused control is not actionable');
paused.stop();

const live = await run(false);
assert.equal(live.state.countdownPhase, 'live');
assert.equal(live.pill.textContent, 'LIVE NOW!');
live.state.walletConnected = true; live.state.selectedTokenId = '4'; live.state.redeemSupply = 5;
assert.equal(typeof live.button().clickAction, 'function', 'valid unpause control is actionable');
live.setPaused(true); // external Admin pause after initial LIVE
await live.poll();
assert.equal(live.reads(), 2, 'pause observations continue throughout LIVE');
assert.equal(live.state.countdownPhase, 'standby');
assert.equal(live.pill.textContent, 'STANDBY…');
assert.equal(live.button().clickAction, null, 'later pause retires the Exchange action');
live.setPaused(false); await live.poll();
assert.equal(live.state.countdownPhase, 'live');
assert.equal(typeof live.button().clickAction, 'function', 'verified unpause restores an otherwise-ready action');
live.state.contractPaused = true;
assert.equal(live.button().clickAction, null, 'explicit paused state cannot retain an action');
live.stop();
console.log('public pause: initial/later pause disable Exchange and retire LIVE; verified unpause restores readiness');
