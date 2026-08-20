import assert from 'node:assert/strict';

import { selectHomeBase, startHomeBundles } from './home.loader.js';

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

function createLogger() {
  const errors = [];
  return {
    errors,
    error(...args) {
      errors.push(args);
    }
  };
}

assert.equal(selectHomeBase('eatacid.xyz'), './prod');
assert.equal(selectHomeBase('www.eatacid.xyz'), './prod');
assert.equal(selectHomeBase('staging.eatacid.xyz'), './staging');
assert.equal(selectHomeBase('localhost'), './staging');

for (const { hostname, base } of [
  { hostname: 'eatacid.xyz', base: './prod' },
  { hostname: 'staging.eatacid.xyz', base: './staging' }
]) {
  const firstPaint = deferred();
  const home = deferred();
  const calls = [];
  const logger = createLogger();
  const importModule = (specifier) => {
    calls.push(specifier);
    return specifier.endsWith('/first-paint.js')
      ? firstPaint.promise
      : home.promise;
  };

  const loads = startHomeBundles({ hostname, importModule, logger });

  assert.equal(loads.base, base);
  assert.deepEqual(calls, [
    `${base}/first-paint.js`,
    `${base}/home.js`
  ]);

  firstPaint.resolve('first-paint-ready');
  assert.equal(await loads.firstPaintLoad, 'first-paint-ready');

  let homeSettled = false;
  void loads.homeLoad.then(() => {
    homeSettled = true;
  });
  await Promise.resolve();
  assert.equal(homeSettled, false);

  home.resolve('home-ready');
  assert.equal(await loads.homeLoad, 'home-ready');
  assert.deepEqual(logger.errors, []);
}

{
  const firstPaint = deferred();
  const home = deferred();
  const logger = createLogger();
  const loads = startHomeBundles({
    hostname: 'staging.eatacid.xyz',
    logger,
    importModule(specifier) {
      return specifier.endsWith('/first-paint.js')
        ? firstPaint.promise
        : home.promise;
    }
  });

  firstPaint.reject(new Error('first-paint unavailable'));
  assert.equal(await loads.firstPaintLoad, null);

  home.resolve('home-ready');
  assert.equal(await loads.homeLoad, 'home-ready');
  assert.equal(logger.errors.length, 1);
  assert.match(logger.errors[0][0], /first-paint bundle load failed/);
}

{
  const firstPaint = deferred();
  const home = deferred();
  const logger = createLogger();
  const loads = startHomeBundles({
    hostname: 'eatacid.xyz',
    logger,
    importModule(specifier) {
      return specifier.endsWith('/first-paint.js')
        ? firstPaint.promise
        : home.promise;
    }
  });

  home.reject(new Error('home unavailable'));
  assert.equal(await loads.homeLoad, null);

  firstPaint.resolve('first-paint-ready');
  assert.equal(await loads.firstPaintLoad, 'first-paint-ready');
  assert.equal(logger.errors.length, 1);
  assert.match(logger.errors[0][0], /home bundle load failed/);
}

{
  const calls = [];
  const logger = createLogger();
  const loads = startHomeBundles({
    hostname: 'staging.eatacid.xyz',
    logger,
    importModule(specifier) {
      calls.push(specifier);
      if (specifier.endsWith('/first-paint.js')) {
        throw new Error('synchronous first-paint failure');
      }
      return Promise.resolve('home-ready');
    }
  });

  assert.deepEqual(calls, [
    './staging/first-paint.js',
    './staging/home.js'
  ]);
  assert.equal(await loads.firstPaintLoad, null);
  assert.equal(await loads.homeLoad, 'home-ready');
}

{
  const firstPaint = deferred();
  const home = deferred();
  const loads = startHomeBundles({
    hostname: 'staging.eatacid.xyz',
    logger: createLogger(),
    importModule(specifier) {
      return specifier.endsWith('/first-paint.js')
        ? firstPaint.promise
        : home.promise;
    }
  });

  home.resolve('home-ready-first');
  assert.equal(await loads.homeLoad, 'home-ready-first');

  let firstPaintSettled = false;
  void loads.firstPaintLoad.then(() => {
    firstPaintSettled = true;
  });
  await Promise.resolve();
  assert.equal(firstPaintSettled, false);

  firstPaint.resolve('first-paint-ready-second');
  assert.equal(await loads.firstPaintLoad, 'first-paint-ready-second');
}

{
  const firstPaint = deferred();
  const home = deferred();
  const loads = startHomeBundles({
    hostname: 'eatacid.xyz',
    logger: createLogger(),
    importModule(specifier) {
      return specifier.endsWith('/first-paint.js')
        ? firstPaint.promise
        : home.promise;
    }
  });

  firstPaint.resolve('first-paint-ready');
  home.resolve('home-ready');
  assert.deepEqual(await Promise.all([
    loads.firstPaintLoad,
    loads.homeLoad
  ]), ['first-paint-ready', 'home-ready']);
}

{
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    requestAnimationFrame: globalThis.requestAnimationFrame,
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout
  };
  const bodyClasses = new Set(['first-paint-main']);
  const scheduledTimeouts = [];

  globalThis.window = {};
  globalThis.document = {
    body: {
      classList: {
        add(...names) {
          names.forEach(name => bodyClasses.add(name));
        },
        contains(name) {
          return bodyClasses.has(name);
        },
        remove(name) {
          bodyClasses.delete(name);
        }
      },
      querySelector() {
        return null;
      },
      querySelectorAll() {
        return [];
      }
    },
    getElementById() {
      return {};
    }
  };
  globalThis.requestAnimationFrame = callback => callback();
  globalThis.setTimeout = (callback, milliseconds) => {
    const timer = { callback, milliseconds };
    scheduledTimeouts.push(timer);
    return timer;
  };
  globalThis.clearTimeout = () => {};

  try {
    await import(`../webflow/first-paint.js?isolated=${Date.now()}`);
    assert.equal(globalThis.window.__EA_PUBLIC_FIRST_PAINT__.started, true);
    assert.equal(
      scheduledTimeouts.some(timer => timer.milliseconds === 1300),
      true,
      'the coordinator fail-open timer should start without importing Home'
    );
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete globalThis[key];
      } else {
        globalThis[key] = value;
      }
    }
  }
}

{
  const previousWindow = globalThis.window;
  globalThis.window = {};

  try {
    const nonce = `${Date.now()}-${Math.random()}`;
    const earlyEntry = await import(`../shared/public-first-paint.js?early=${nonce}`);
    const homeFallback = await import(`../shared/public-first-paint.js?home=${nonce}`);

    assert.equal(earlyEntry.publicFirstPaint.started, true);
    assert.strictEqual(homeFallback.publicFirstPaint, earlyEntry.publicFirstPaint);
    assert.strictEqual(
      homeFallback.startPublicFirstPaint(),
      earlyEntry.publicFirstPaint
    );
  } finally {
    if (previousWindow === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = previousWindow;
    }
  }
}

console.log('Home first-paint loader tests passed.');
