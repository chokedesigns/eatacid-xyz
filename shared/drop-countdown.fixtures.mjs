import { createTrustedClock } from './drop-countdown.js';

export const BASE = Date.parse('2026-10-09T18:59:00Z');
export function response(ms, { age = null, status = 200, body } = {}) {
  const d = new Date(ms);
  return { ok: status === 200, status, headers: { get: () => age }, json: async () => body ?? ({
    timeZone: 'UTC', dateTime: d.toISOString().slice(0, -1), year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1, day: d.getUTCDate(), hour: d.getUTCHours(),
    minute: d.getUTCMinutes(), seconds: d.getUTCSeconds(),
  }) };
}
export function clockFixture(skew = 0) {
  const fixture = { mono: 0, wall: BASE + skew, server: BASE, rtt: 100, requests: [], fail: false,
    nextResponse: null, window: new EventTarget(), document: Object.assign(new EventTarget(), { hidden: false }),
    timers: new Map(), timeouts: new Map(), id: 0 };
  fixture.window.navigator = { onLine: true };
  fixture.advance = (ms, wallMs = ms, serverMs = ms) => {
    fixture.mono += ms; fixture.wall += wallMs; fixture.server += serverMs;
  };
  fixture.clock = createTrustedClock({
    monotonicNow: () => fixture.mono, wallNow: () => fixture.wall, nonce: () => String(fixture.requests.length),
    setTimeoutFn: fn => { const id = ++fixture.id; fixture.timeouts.set(id, fn); return id; },
    clearTimeoutFn: id => fixture.timeouts.delete(id),
    fetchTime: async (url, options) => {
      fixture.requests.push({ url, options });
      if (fixture.fail) throw new Error('offline');
      const result = fixture.nextResponse ?? response(fixture.server + fixture.rtt / 2);
      fixture.advance(fixture.rtt);
      return result;
    },
  });
  fixture.options = {
    clock: fixture.clock, monotonicNow: () => fixture.mono,
    windowRef: fixture.window, documentRef: fixture.document,
    setIntervalFn: fn => { const id = ++fixture.id; fixture.timers.set(id, fn); return id; },
    clearIntervalFn: id => fixture.timers.delete(id),
  };
  fixture.tick = (ms = 1000) => { fixture.advance(ms); for (const fn of [...fixture.timers.values()]) fn(); };
  return fixture;
}
export async function flush() { for (let i = 0; i < 10; i++) await Promise.resolve(); }
