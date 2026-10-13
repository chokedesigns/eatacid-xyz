import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import { computeDropInstant } from '../../shared/drop-time.js';
import { startDropCountdown, formatDropCountdown } from '../../shared/drop-countdown.js';
import { BASE, clockFixture, flush } from '../../shared/drop-countdown.fixtures.mjs';

const source = readFileSync(new URL('./events.js', import.meta.url), 'utf8');
const countdownSource = source.slice(source.indexOf('function startCountdown() {'),
  source.indexOf('// EXCHANGE BUTTON STATE MANAGEMENT', source.indexOf('function startCountdown() {')));

test('public countdown uses synchronized time on both pills and retains manual-unpause standby/live', async () => {
  const f = clockFixture(7 * 86400000);
  const pills = [{}, {}]; const state = {}; let polls = 0; let unpause;
  const context = vm.createContext({
    document: { querySelector: selector => selector.endsWith('-mobile') ? pills[1] : pills[0] },
    applyEllipsis() {}, updateAppState: patch => Object.assign(state, patch), AppState: state,
    console, logger: { log() {} },
    dropDate: { month: 'October', day: '9', year: '2026' },
    dropTime: { time: '3:00', period: 'PM', timezone: 'EST' },
    computeDropInstant, formatDropCountdown,
    startDropCountdown: options => startDropCountdown({ ...options, ...f.options }),
    BURN_REDEEM_CONTRACT_ADDRESS: 'unchanged-escrow',
    pollForUnpause: (address, delay, status) => {
      polls++; assert.equal(address, 'unchanged-escrow'); assert.equal(delay, 3000);
      status(true); return new Promise(resolve => { unpause = resolve; });
    },
  });
  vm.runInContext(countdownSource + '\nstartCountdown();', context);
  assert.equal(pills[0].textContent, 'TIME UNAVAILABLE');
  assert.equal(pills[1].textContent, 'TIME UNAVAILABLE');
  assert.equal(polls, 0);
  await flush(); assert.match(pills[0].textContent, /00:01:00$/);
  assert.equal(pills[0].textContent, pills[1].textContent);
  f.document.hidden = true; f.document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(pills[0].textContent, 'TIME UNAVAILABLE');
  f.advance(0, 120000, 120000);
  f.document.hidden = false; f.document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(polls, 0); await flush();
  assert.equal(state.countdownPhase, 'standby'); assert.equal(polls, 1);
  assert.equal(pills[0].textContent, 'STANDBY…');
  assert.equal(f.timers.size, 0);
  unpause(); await flush();
  assert.equal(state.countdownPhase, 'live');
  assert.equal(pills[0].textContent, 'LIVE NOW!');
});

test('public sync failure stays unavailable, recovers and does not poll release early', async () => {
  const f = clockFixture(-86400000); f.fail = true;
  const pill = {}; const state = {};
  const context = vm.createContext({ document: { querySelector: () => pill }, applyEllipsis() {},
    updateAppState: patch => Object.assign(state, patch), AppState: state, console,
    dropDate: {}, dropTime: {}, computeDropInstant: () => ({ ok: true, date: new Date(BASE + 60000) }),
    formatDropCountdown, startDropCountdown: options => startDropCountdown({ ...options, ...f.options }),
    pollForUnpause: () => assert.fail('unverified time cannot expire'),
  });
  vm.runInContext(countdownSource + '\nstartCountdown();', context);
  await flush(); assert.equal(pill.textContent, 'TIME UNAVAILABLE');
  f.fail = false; f.tick(5000); await flush();
  assert.match(pill.textContent, /00:00:55$/);
  assert.equal(state.countdownPhase, 'pre');
  f.clock.invalidate('test cleanup'); f.timers.clear();
});
