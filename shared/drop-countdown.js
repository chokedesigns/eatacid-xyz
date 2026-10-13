// Published schedule time only. Contract eligibility still belongs to manual unpause.
export const TIME_UNAVAILABLE = 'TIME UNAVAILABLE';
export const TIME_REFERENCE = 'https://timeapi.io/api/time/current/zone';
const MAX_AGE_MS = 60000;
const REFRESH_MS = 30000;
const RETRY_MS = 5000;
const MAX_RTT_MS = 1500;
const MAX_TICK_GAP_MS = 2500;
const CLOCK_JUMP_MS = 250;
const DRIFT_RATE = 0.001; // Conservative 1000 ppm; also detect wall/elapsed divergence.

function utcTimestamp(body) {
  if (body?.timeZone !== 'UTC' || typeof body.dateTime !== 'string'
    || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3,7}$/.test(body.dateTime)) {
    throw new Error('Invalid UTC time reference');
  }
  const ms = Date.parse(`${body.dateTime}Z`);
  const date = new Date(ms);
  if (!Number.isFinite(ms) || date.getUTCFullYear() !== body.year
    || date.getUTCMonth() + 1 !== body.month || date.getUTCDate() !== body.day
    || date.getUTCHours() !== body.hour || date.getUTCMinutes() !== body.minute
    || date.getUTCSeconds() !== body.seconds) {
    throw new Error('Inconsistent UTC time reference');
  }
  return ms;
}

export function createTrustedClock({
  fetchTime = (...args) => fetch(...args),
  monotonicNow = () => performance.now(),
  wallNow = () => Date.now(),
  setTimeoutFn = setTimeout,
  clearTimeoutFn = clearTimeout,
  nonce = () => crypto.randomUUID(),
} = {}) {
  let sample = null;
  let previous = null;
  let lastServerMs = -Infinity;
  let checkpoint = null;
  let generation = 0;
  let request = null;
  let error = 'Not synchronized';

  function invalidate(reason = 'Time synchronization required') {
    generation++;
    sample = null;
    previous = null; // A suspended elapsed clock cannot predict a resumed sample.
    checkpoint = null;
    error = reason;
    request?.controller.abort();
    request = null;
  }

  function read() {
    const mono = monotonicNow();
    const wall = wallNow();
    if (checkpoint && (mono < checkpoint.mono || mono - checkpoint.mono > MAX_TICK_GAP_MS
      || Math.abs((wall - checkpoint.wall) - (mono - checkpoint.mono)) > CLOCK_JUMP_MS)) {
      invalidate('Clock changed or browser resumed');
    }
    checkpoint = { mono, wall };
    if (sample) {
      const age = mono - sample.mono;
      if (age < 0 || age >= MAX_AGE_MS
        || Math.abs((wall - sample.wall) - age) > CLOCK_JUMP_MS) {
        invalidate('Time reference expired or clock drifted');
      } else {
        const nowMs = sample.epoch + age;
        const uncertaintyMs = sample.uncertainty + age * DRIFT_RATE;
        return { valid: true, nowMs, uncertaintyMs, ageMs: age };
      }
    }
    return { valid: false, error };
  }

  async function sync() {
    if (request) return request.promise;
    const epoch = generation;
    const controller = new AbortController();
    const pending = { controller, promise: null };
    request = pending;
    pending.promise = (async () => {
      const started = monotonicNow();
      const wallStarted = wallNow();
      const timeout = setTimeoutFn(() => controller.abort(), 4000);
      try {
        const url = new URL(TIME_REFERENCE);
        url.searchParams.set('timeZone', 'UTC');
        url.searchParams.set('_', nonce());
        const response = await fetchTime(url.href, {
          cache: 'no-store', credentials: 'omit', redirect: 'error', signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Time reference HTTP ${response.status}`);
        // Age may be absent under CORS. Never accept a positively aged cache response.
        const age = response.headers?.get('age');
        if (age !== null && age !== undefined && (!/^\d+$/.test(age) || Number(age) > 0)) {
          throw new Error('Cached time reference');
        }
        const serverMs = utcTimestamp(await response.json());
        const ended = monotonicNow();
        const wallEnded = wallNow();
        const rtt = ended - started;
        if (epoch !== generation) return false;
        if (controller.signal.aborted) throw new Error('Time reference request aborted');
        if (!Number.isFinite(rtt) || rtt < 0 || rtt > MAX_RTT_MS
          || Math.abs((wallEnded - wallStarted) - rtt) > CLOCK_JUMP_MS) {
          throw new Error('Time reference latency or clock discontinuity');
        }
        // The UTC response is generated during the request: midpoint compensation
        // bounds unknown server processing/network asymmetry by half the full RTT.
        const next = { epoch: serverMs + rtt / 2, mono: ended, wall: wallEnded,
          uncertainty: rtt / 2 + 2 };
        if (serverMs <= lastServerMs) throw new Error('Time reference did not advance');
        if (previous) {
          const elapsed = ended - previous.mono;
          if (serverMs <= previous.serverMs || elapsed < 0
            || Math.abs(next.epoch - (previous.epoch + elapsed))
              > next.uncertainty + previous.uncertainty + elapsed * DRIFT_RATE + CLOCK_JUMP_MS) {
            throw new Error('Time reference did not advance consistently');
          }
        }
        sample = next;
        lastServerMs = serverMs;
        previous = { ...next, serverMs };
        checkpoint = { mono: ended, wall: wallEnded };
        error = null;
        return true;
      } catch (err) {
        if (epoch === generation) {
          sample = null;
          error = err?.message || 'Time reference unavailable';
        }
        return false;
      } finally {
        clearTimeoutFn(timeout);
        if (request === pending) request = null;
      }
    })();
    return pending.promise;
  }
  return { read, sync, invalidate };
}

export function formatDropCountdown(startAtMs, time) {
  if (!time?.valid) return TIME_UNAVAILABLE;
  const diff = startAtMs - time.nowMs;
  if (Math.abs(diff) <= time.uncertaintyMs) return TIME_UNAVAILABLE;
  if (diff < 0) return 'STANDBY…';
  const total = Math.ceil(diff / 1000);
  const days = Math.floor(total / 86400);
  const pad = n => String(n).padStart(2, '0');
  const sameDay = new Date(startAtMs).toDateString() === new Date(time.nowMs).toDateString();
  const label = days ? (days === 1 ? '1 DAY' : `${days} DAYS`) : (sameDay ? 'TODAY' : '0 DAYS');
  return `${label} • ${pad(Math.floor(total % 86400 / 3600))}:${pad(Math.floor(total % 3600 / 60))}:${pad(total % 60)}`;
}

// One owned timer plus lifecycle listeners; consumers keep their existing phase/poll contracts.
export function startDropCountdown({ startAtMs, onTick, onExpire,
  clock = createTrustedClock(), windowRef = globalThis.window, documentRef = globalThis.document,
  setIntervalFn = setInterval, clearIntervalFn = clearInterval,
  monotonicNow = () => performance.now(),
}) {
  let stopped = false;
  let syncing = false;
  let syncEpoch = 0;
  let wasValid = false;
  let retryAt = -Infinity;
  let suspended = !!documentRef?.hidden;
  const listeners = [];
  function stop() {
    if (stopped) return;
    stopped = true;
    clearIntervalFn(timerId);
    clock.invalidate('Countdown stopped');
    for (const [target, name, handler] of listeners) target.removeEventListener(name, handler);
  }
  function render() {
    if (stopped) return;
    const time = suspended ? { valid: false } : clock.read();
    if (wasValid && !time.valid) retryAt = -Infinity;
    wasValid = time.valid;
    onTick(time);
    if (time.valid && time.nowMs - time.uncertaintyMs >= startAtMs) {
      stop();
      onExpire();
    }
    return time;
  }
  function synchronize() {
    if (syncing || stopped || suspended || windowRef?.navigator?.onLine === false) return;
    syncing = true;
    const epoch = ++syncEpoch;
    clock.sync().then(ok => {
      if (stopped || epoch !== syncEpoch) return;
      syncing = false;
      render();
      retryAt = monotonicNow() + (ok ? REFRESH_MS : RETRY_MS);
    });
  }
  function tick() {
    const time = render();
    if (!stopped && (monotonicNow() >= retryAt || !time?.valid && !syncing && retryAt === -Infinity)) {
      synchronize();
    }
  }
  function lifecycle(event) {
    clock.invalidate('Browser lifecycle changed');
    syncEpoch++;
    syncing = false;
    retryAt = -Infinity;
    suspended = event.type === 'pagehide' || event.type === 'offline' || !!documentRef?.hidden;
    render();
    synchronize();
  }
  for (const [target, names] of [[windowRef, ['pagehide', 'pageshow', 'focus', 'online', 'offline']],
    [documentRef, ['visibilitychange']]]) {
    for (const name of names) {
      if (!target?.addEventListener) continue;
      target.addEventListener(name, lifecycle);
      listeners.push([target, name, lifecycle]);
    }
  }
  const timerId = setIntervalFn(tick, 1000);
  // Seed unavailable synchronously; start async work after the owner stores its handle.
  onTick({ valid: false });
  Promise.resolve().then(synchronize);
  return { timerId, stop };
}
