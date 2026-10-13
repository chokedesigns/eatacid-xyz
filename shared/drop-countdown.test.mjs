import assert from 'node:assert/strict';
import test from 'node:test';
import { createTrustedClock, startDropCountdown, formatDropCountdown, TIME_UNAVAILABLE } from './drop-countdown.js';
import { BASE, response, clockFixture, flush } from './drop-countdown.fixtures.mjs';

test('UTC reference and midpoint latency compensate without using a skewed wall clock', async () => {
  for (const skew of [-7 * 86400000, -3600000, 0, 3600000, 7 * 86400000]) {
    const f = clockFixture(skew);
    assert.equal(f.clock.read().valid, false);
    assert.equal(await f.clock.sync(), true);
    assert.equal(f.clock.read().nowMs, BASE + 100);
    assert.equal(f.clock.read().uncertaintyMs, 52);
    f.advance(1000);
    assert.equal(f.clock.read().nowMs, BASE + 1100);
    assert.equal(f.requests[0].options.cache, 'no-store');
    assert.equal(new URL(f.requests[0].url).searchParams.get('timeZone'), 'UTC');
    assert.equal(f.timeouts.size, 0);
  }
});

test('freshness expires, monotonic drift is bounded, wall-clock jumps invalidate', async () => {
  const f = clockFixture();
  await f.clock.sync();
  for (let i = 0; i < 59; i++) { f.advance(1000, 1001); assert.equal(f.clock.read().valid, true); }
  assert.equal(f.clock.read().nowMs, BASE + 59100);
  assert.equal(f.clock.read().uncertaintyMs, 111);
  f.advance(1000);
  assert.equal(f.clock.read().valid, false);
  assert.equal(await f.clock.sync(), true);
  f.advance(1000, 3600000);
  assert.equal(f.clock.read().valid, false);
  assert.equal(await f.clock.sync(), true); // A corrected device clock is not the authority.
  f.advance(1000, 1500);
  assert.equal(f.clock.read().valid, false);
});

test('delayed ticks and a sleeping/nonadvancing elapsed clock require a new sample', async () => {
  for (const frozen of [false, true]) {
    const f = clockFixture();
    await f.clock.sync();
    f.advance(frozen ? 0 : 120000, 120000, 120000);
    assert.equal(f.clock.read().valid, false);
    assert.equal(await f.clock.sync(), true);
    assert.equal(f.clock.read().nowMs, f.server);
  }
});

test('elapsed-clock oscillator drift stays inside uncertainty and resynchronization corrects it', async () => {
  const f = clockFixture();
  await f.clock.sync();
  for (let i = 0; i < 29; i++) {
    f.advance(1001, 1000, 1000);
    const time = f.clock.read();
    assert.equal(time.valid, true);
    assert.ok(Math.abs(time.nowMs - f.server) <= time.uncertaintyMs);
  }
  assert.equal(f.clock.read().nowMs - f.server, 29);
  assert.equal(await f.clock.sync(), true);
  assert.equal(f.clock.read().nowMs, f.server);
});

test('failed, malformed, stale and slow references cannot produce confident time; recovery works', async () => {
  const cases = [response(BASE, { status: 503 }), response(BASE, { age: '12' }),
    response(BASE, { age: 'bad' }), response(BASE, { body: { timeZone: 'America/New_York' } }),
    response(BASE, { body: { timeZone: 'UTC', dateTime: '2026-02-31T00:00:00.000', year: 2026, month: 2, day: 31 } }),
    response(BASE, { body: { timeZone: 'UTC', dateTime: '2026-10-09T18:59:00', year: 2026, month: 10, day: 9 } })];
  for (const bad of cases) {
    const f = clockFixture(); f.nextResponse = bad;
    assert.equal(await f.clock.sync(), false);
    assert.equal(f.clock.read().valid, false);
    f.nextResponse = null;
    assert.equal(await f.clock.sync(), true);
  }
  const f = clockFixture(); f.rtt = 2000;
  assert.equal(await f.clock.sync(), false);
  f.rtt = 100; assert.equal(await f.clock.sync(), true);
  const cached = f.server;
  f.nextResponse = response(cached);
  f.advance(30000); f.clock.invalidate('resume');
  assert.equal(await f.clock.sync(), true); // First sample was 50ms earlier than cached.
  f.advance(30000); f.clock.invalidate('resume');
  assert.equal(await f.clock.sync(), false); // Repeated server instant cannot be accepted.
  f.nextResponse = null;
  assert.equal(await f.clock.sync(), true);
  f.fail = true; assert.equal(await f.clock.sync(), false);
  assert.equal(f.clock.read().valid, false);
  f.fail = false; assert.equal(await f.clock.sync(), true);
});

test('cancellation, timeout and out-of-order completion cannot overwrite recovered time', async () => {
  let mono = 0;
  const requests = [];
  let timeout;
  const clock = createTrustedClock({ monotonicNow: () => mono, wallNow: () => mono + BASE,
    nonce: () => 'test', setTimeoutFn: fn => { timeout = fn; return 1; }, clearTimeoutFn: () => {},
    fetchTime: (url, options) => new Promise(resolve => requests.push({ options, resolve })),
  });
  const old = clock.sync();
  clock.invalidate('network reset');
  assert.equal(requests[0].options.signal.aborted, true);
  const current = clock.sync(); mono = 100;
  requests[1].resolve(response(BASE + 50));
  assert.equal(await current, true);
  requests[0].resolve(response(BASE - 999999));
  assert.equal(await old, false);
  assert.equal(clock.read().nowMs, BASE + 100);
  const timedOut = clock.sync(); timeout();
  requests[2].resolve(response(BASE + 200));
  assert.equal(await timedOut, false);
  // An aborted current request must also invalidate the old confident sample.
  assert.equal(clock.read().valid, false);
});

test('shared runner refreshes, fails closed, retries and recovers after offline or resume', async () => {
  const f = clockFixture(86400000); const seen = [];
  const run = startDropCountdown({ ...f.options, startAtMs: BASE + 3600000,
    onTick: value => seen.push(value), onExpire: () => assert.fail('early expiration') });
  assert.equal(seen.at(-1).valid, false); await flush();
  assert.equal(seen.at(-1).valid, true);
  for (let i = 0; i < 30; i++) { f.tick(); await flush(); }
  await flush(); assert.equal(f.requests.length, 2);
  f.fail = true;
  for (let i = 0; i < 30; i++) { f.tick(); await flush(); }
  await flush(); assert.equal(seen.at(-1).valid, false);
  f.fail = false;
  for (let i = 0; i < 5; i++) { f.tick(); await flush(); }
  await flush(); assert.equal(seen.at(-1).valid, true);
  f.document.hidden = true; f.document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(seen.at(-1).valid, false);
  f.advance(0, 600000, 600000);
  f.document.hidden = false; f.document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(seen.at(-1).valid, false); await flush();
  assert.equal(seen.at(-1).nowMs, f.server);
  f.window.navigator.onLine = false; f.window.dispatchEvent(new Event('offline'));
  assert.equal(seen.at(-1).valid, false);
  f.advance(1000); f.window.navigator.onLine = true; f.window.dispatchEvent(new Event('online'));
  await flush(); assert.equal(seen.at(-1).valid, true);
  run.stop(); const count = seen.length;
  f.window.dispatchEvent(new Event('focus')); await flush();
  assert.equal(seen.length, count); assert.equal(f.timers.size, 0);
});

test('expiry waits for a certain published boundary and fires once, independently of manual release', async () => {
  const f = clockFixture(); let expired = 0; const seen = [];
  startDropCountdown({ ...f.options, startAtMs: BASE + 1000,
    onTick: t => seen.push(formatDropCountdown(BASE + 1000, t)), onExpire: () => expired++ });
  await flush(); assert.match(seen.at(-1), /00:00:01$/);
  f.tick(850); assert.equal(expired, 0); assert.equal(seen.at(-1), TIME_UNAVAILABLE);
  f.tick(100); assert.equal(expired, 0);
  f.tick(10); assert.equal(expired, 1); assert.equal(f.timers.size, 0);
  f.tick(); assert.equal(expired, 1);
});
