import assert from 'node:assert/strict';
import test from 'node:test';
import { pollForConfirmation } from './public-trade-ops.js';

const flush = () => new Promise(setImmediate);
const options = { tzktBase: 'https://inert.invalid', opHash: 'inert-hash', timeout: 25, interval: 8,
  expectedDestination: 'escrow', expectedEntrypoint: 'initiate_trade' };
const operation = (status = 'applied', destination = 'escrow', entrypoint = 'initiate_trade') =>
  ({ type: 'transaction', target: { address: destination }, parameter: { entrypoint }, status });
const response = body => ({ ok: true, json: async () => body });
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function clock(t) {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 0 });
  // Track live timers as well as elapsed time, including early-return cleanup.
  const set = globalThis.setTimeout, clear = globalThis.clearTimeout, timers = new Set();
  t.mock.method(globalThis, 'setTimeout', (callback, ms) => {
    const id = set(() => { timers.delete(id); callback(); }, ms);
    timers.add(id); return id;
  });
  t.mock.method(globalThis, 'clearTimeout', id => { timers.delete(id); clear(id); });
  return { timers, async tick(ms) { t.mock.timers.tick(ms); await flush(); } };
}
function observe(promise) {
  const state = { settled: false };
  state.result = promise.then(value => { state.settled = true; return { value }; },
    error => { state.settled = true; return { error }; });
  return state;
}
function unknown(error) {
  assert.match(error.message, /^Transaction confirmation timed out\./);
  assert.notEqual(error.code, 'PUBLIC_TRADE_FAILED');
}

for (const stage of ['fetch', 'json', 'http-text']) {
  for (const late of ['resolve', 'reject']) {
    test(`AUD-003-010: stalled ${stage}, late ${late} stays unknown and inert`, async t => {
      const c = clock(t), gate = deferred(), logs = [];
      let signal, calls = 0, bodyReads = 0, evidenceReads = 0, aborts = 0;
      const evidence = operation();
      Object.defineProperty(evidence, 'status', { get() { evidenceReads++; return 'applied'; } });
      t.mock.method(globalThis, 'fetch', (_url, init) => {
        calls++; signal = init.signal;
        signal.addEventListener('abort', () => { aborts++; }, { once: true });
        if (stage === 'fetch') return gate.promise; // Intentionally ignores abort.
        return Promise.resolve({ ok: stage === 'json', status: 503, statusText: 'Unavailable',
          [stage === 'json' ? 'json' : 'text']: () => { bodyReads++; return gate.promise; } });
      });
      t.mock.method(console, 'log', (...args) => logs.push(args));
      const poll = observe(pollForConfirmation({ ...options, logPrefix: '[inert] ' }));
      await flush();
      assert.equal(bodyReads, stage === 'fetch' ? 0 : 1);
      await c.tick(24); assert.equal(poll.settled, false);
      await c.tick(1); unknown((await poll.result).error);
      assert.equal(Date.now(), 25); assert.equal(signal.aborted, true); assert.equal(aborts, 1);
      assert.equal(c.timers.size, 0);
      const logsAtTimeout = logs.length;
      if (late === 'reject') gate.reject(new Error('late inert transport rejection'));
      else gate.resolve(stage === 'fetch'
        ? { ok: true, json() { bodyReads++; return [evidence]; } }
        : stage === 'json' ? [evidence] : 'late error body');
      await flush(); await c.tick(100);
      assert.equal(calls, 1); assert.equal(evidenceReads, 0);
      assert.equal(bodyReads, stage === 'fetch' ? 0 : 1, 'Late headers cannot start another read');
      assert.equal(logs.length, logsAtTimeout); assert.equal(c.timers.size, 0);
    });
  }
}

test('AUD-003-010: repeated network failures and retry delays share one total deadline', async t => {
  const c = clock(t), times = [], signals = [];
  t.mock.method(globalThis, 'fetch', async (_url, { signal }) => {
    times.push(Date.now()); signals.push(signal); throw new Error(`inert outage ${times.length}`);
  });
  const poll = observe(pollForConfirmation(options));
  await flush();
  for (let i = 0; i < 3; i++) await c.tick(8);
  assert.deepEqual(times, [0, 8, 16, 24]); assert.equal(poll.settled, false);
  await c.tick(1);
  const { error } = await poll.result; unknown(error);
  assert.match(error.message, /Last TzKT polling error: inert outage 4$/);
  assert.ok(signals.every(signal => signal.aborted)); assert.equal(c.timers.size, 0);
  await c.tick(100); assert.equal(times.length, 4);
});

for (const kind of ['missing', 'http', 'json']) {
  test(`AUD-003-010: ${kind} evidence and long polling interval cannot exceed the deadline`, async t => {
    const c = clock(t);
    const fetch = t.mock.method(globalThis, 'fetch', async () => kind === 'missing' ? response([])
      : kind === 'http' ? { ok: false, status: 503, text: async () => 'inert outage' }
      : { ok: true, json: async () => { throw new SyntaxError('inert JSON'); } });
    const poll = observe(pollForConfirmation({ ...options, interval: 5000 }));
    await flush(); await c.tick(25); unknown((await poll.result).error);
    assert.equal(fetch.mock.callCount(), 1); assert.equal(c.timers.size, 0);
    await c.tick(5000); assert.equal(fetch.mock.callCount(), 1);
  });
}

test('AUD-003-010: headers, parsing, polling delay and subsequent requests consume the same budget', async t => {
  const c = clock(t), headers = deferred(), body = deferred();
  const fetch = t.mock.method(globalThis, 'fetch', () => headers.promise);
  const poll = observe(pollForConfirmation(options));
  await c.tick(8); headers.resolve({ ok: true, json: () => body.promise }); await flush();
  await c.tick(8); body.resolve([]); await flush();
  assert.equal(fetch.mock.callCount(), 1);
  await c.tick(8); assert.equal(fetch.mock.callCount(), 2);
  await c.tick(1); unknown((await poll.result).error); assert.equal(c.timers.size, 0);
});

for (const status of ['applied', 'failed', 'backtracked', 'skipped']) {
  test(`AUD-003-010: matching ${status} control cleans up its deadline`, async t => {
    const c = clock(t);
    const ops = [operation('applied', 'other', 'update_operators'), operation(status)];
    t.mock.method(globalThis, 'fetch', async () => response(ops));
    const result = await observe(pollForConfirmation(options)).result;
    if (status === 'applied') assert.equal(result.value, ops);
    else { assert.equal(result.error.code, 'PUBLIC_TRADE_FAILED'); assert.match(result.error.message, new RegExp(status)); }
    assert.equal(c.timers.size, 0); await c.tick(100);
  });
}

test('AUD-003-010: signer provisioning matcher still retries unavailable evidence then confirms set_token_pairs', async t => {
  const c = clock(t);
  const bodies = [[operation()], [operation('applied', 'escrow', 'set_token_pairs')]];
  t.mock.method(globalThis, 'fetch', async () => response(bodies.shift()));
  const poll = observe(pollForConfirmation({ ...options, expectedEntrypoint: 'set_token_pairs' }));
  await flush(); assert.equal(poll.settled, false);
  await c.tick(8); assert.equal((await poll.result).value[0].parameter.entrypoint, 'set_token_pairs');
  assert.equal(c.timers.size, 0);
});

test('AUD-003-010: zero budget starts no request', async t => {
  const c = clock(t), fetch = t.mock.method(globalThis, 'fetch', () => { throw new Error('Forbidden request'); });
  unknown((await observe(pollForConfirmation({ ...options, timeout: 0 })).result).error);
  assert.equal(fetch.mock.callCount(), 0); assert.equal(c.timers.size, 0);
});

test('AUD-003-010: non-cancellable transport is still bounded without AbortController', async t => {
  const c = clock(t);
  const original = globalThis.AbortController;
  t.after(() => { globalThis.AbortController = original; });
  globalThis.AbortController = undefined;
  t.mock.method(globalThis, 'fetch', () => new Promise(() => {}));
  const poll = observe(pollForConfirmation(options));
  await flush(); await c.tick(25); unknown((await poll.result).error);
  assert.equal(c.timers.size, 0);
});

test('AUD-003-010: elapsed deadline rejects late terminal evidence before a delayed timer can fire', async t => {
  const c = clock(t), body = deferred();
  t.mock.method(globalThis, 'fetch', async () => ({ ok: true, json: () => body.promise }));
  const poll = observe(pollForConfirmation(options));
  await flush(); t.mock.timers.setTime(25); body.resolve([operation('failed')]);
  await flush(); unknown((await poll.result).error); assert.equal(c.timers.size, 0);
});
