import assert from 'node:assert/strict';

import {
  selectHomeLoaderBase,
  startHomeLoader
} from './root/home.js';
import {
  selectDropsLoaderBase,
  startDropsLoader
} from './root/drops.js';
import {
  selectExchangeLoaderBase,
  startExchangeLoader
} from './root/exchange.js';
import { startHomeBundles } from './environment/home.js';
import { startDropsBundle } from './environment/drops.js';
import { startExchangeBundles } from './environment/exchange.js';

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

const rootSurfaces = [
  {
    name: 'home',
    selectBase: selectHomeLoaderBase,
    startLoader: startHomeLoader
  },
  {
    name: 'drops',
    selectBase: selectDropsLoaderBase,
    startLoader: startDropsLoader
  },
  {
    name: 'exchange',
    selectBase: selectExchangeLoaderBase,
    startLoader: startExchangeLoader
  }
];

for (const { name, selectBase, startLoader } of rootSurfaces) {
  assert.equal(selectBase('eatacid.xyz'), './prod');
  assert.equal(selectBase('www.eatacid.xyz'), './prod');
  assert.equal(selectBase('staging.eatacid.xyz'), './staging');
  assert.equal(selectBase('localhost'), './staging');

  for (const { hostname, base } of [
    { hostname: 'eatacid.xyz', base: './prod' },
    { hostname: 'staging.eatacid.xyz', base: './staging' }
  ]) {
    const calls = [];
    const logger = createLogger();
    const { loaderLoad } = startLoader({
      hostname,
      logger,
      importModule(specifier) {
        calls.push(specifier);
        return Promise.resolve(`${name}-loader-ready`);
      }
    });

    assert.deepEqual(calls, [`${base}/${name}-loader.js`]);
    assert.equal(await loaderLoad, `${name}-loader-ready`);
    assert.deepEqual(logger.errors, []);
  }

  {
    const logger = createLogger();
    const { loaderLoad } = startLoader({
      hostname: 'staging.eatacid.xyz',
      logger,
      importModule() {
        return Promise.reject(new Error('asynchronous loader failure'));
      }
    });

    assert.equal(await loaderLoad, null);
    assert.equal(logger.errors.length, 1);
    assert.match(logger.errors[0][0], /environment loader failed/);
  }

  {
    const logger = createLogger();
    const { loaderLoad } = startLoader({
      hostname: 'eatacid.xyz',
      logger,
      importModule() {
        throw new Error('synchronous loader failure');
      }
    });

    assert.equal(await loaderLoad, null);
    assert.equal(logger.errors.length, 1);
    assert.match(logger.errors[0][0], /environment loader failed/);
  }
}

for (const settleFirst of ['first-paint', 'home']) {
  const firstPaint = deferred();
  const home = deferred();
  const calls = [];
  const logger = createLogger();
  const loads = startHomeBundles({
    logger,
    importModule(specifier) {
      calls.push(specifier);
      return specifier === './first-paint.js'
        ? firstPaint.promise
        : home.promise;
    }
  });

  assert.deepEqual(calls, ['./first-paint.js', './home.js']);

  const first = settleFirst === 'first-paint' ? firstPaint : home;
  const second = settleFirst === 'first-paint' ? home : firstPaint;
  const firstLoad = settleFirst === 'first-paint'
    ? loads.firstPaintLoad
    : loads.homeLoad;
  const secondLoad = settleFirst === 'first-paint'
    ? loads.homeLoad
    : loads.firstPaintLoad;

  first.resolve(`${settleFirst}-ready-first`);
  assert.equal(await firstLoad, `${settleFirst}-ready-first`);

  let secondSettled = false;
  void secondLoad.then(() => {
    secondSettled = true;
  });
  await Promise.resolve();
  assert.equal(secondSettled, false);

  second.resolve('second-ready');
  assert.equal(await secondLoad, 'second-ready');
  assert.deepEqual(logger.errors, []);
}

for (const failingBundle of ['first-paint', 'home']) {
  const firstPaint = deferred();
  const home = deferred();
  const logger = createLogger();
  const loads = startHomeBundles({
    logger,
    importModule(specifier) {
      return specifier === './first-paint.js'
        ? firstPaint.promise
        : home.promise;
    }
  });

  const failed = failingBundle === 'first-paint' ? firstPaint : home;
  const surviving = failingBundle === 'first-paint' ? home : firstPaint;
  const failedLoad = failingBundle === 'first-paint'
    ? loads.firstPaintLoad
    : loads.homeLoad;
  const survivingLoad = failingBundle === 'first-paint'
    ? loads.homeLoad
    : loads.firstPaintLoad;

  failed.reject(new Error(`${failingBundle} unavailable`));
  assert.equal(await failedLoad, null);
  surviving.resolve('survivor-ready');
  assert.equal(await survivingLoad, 'survivor-ready');
  assert.equal(logger.errors.length, 1);
  assert.match(logger.errors[0][0], new RegExp(`${failingBundle} bundle load failed`));
}

for (const failingBundle of ['first-paint', 'home']) {
  const calls = [];
  const logger = createLogger();
  const loads = startHomeBundles({
    logger,
    importModule(specifier) {
      calls.push(specifier);
      if (specifier === `./${failingBundle}.js`) {
        throw new Error(`synchronous ${failingBundle} failure`);
      }
      return Promise.resolve('survivor-ready');
    }
  });

  assert.deepEqual(calls, ['./first-paint.js', './home.js']);
  const failedLoad = failingBundle === 'first-paint'
    ? loads.firstPaintLoad
    : loads.homeLoad;
  const survivingLoad = failingBundle === 'first-paint'
    ? loads.homeLoad
    : loads.firstPaintLoad;
  assert.equal(await failedLoad, null);
  assert.equal(await survivingLoad, 'survivor-ready');
  assert.equal(logger.errors.length, 1);
}

for (const settleFirst of ['first-paint', 'exchange']) {
  const firstPaint = deferred();
  const exchange = deferred();
  const calls = [];
  const logger = createLogger();
  const loads = startExchangeBundles({
    logger,
    importModule(specifier) {
      calls.push(specifier);
      return specifier === './first-paint.js'
        ? firstPaint.promise
        : exchange.promise;
    }
  });

  assert.deepEqual(calls, ['./first-paint.js', './exchange.js']);

  const first = settleFirst === 'first-paint' ? firstPaint : exchange;
  const second = settleFirst === 'first-paint' ? exchange : firstPaint;
  const firstLoad = settleFirst === 'first-paint'
    ? loads.firstPaintLoad
    : loads.exchangeLoad;
  const secondLoad = settleFirst === 'first-paint'
    ? loads.exchangeLoad
    : loads.firstPaintLoad;

  first.resolve(`${settleFirst}-ready-first`);
  assert.equal(await firstLoad, `${settleFirst}-ready-first`);

  let secondSettled = false;
  void secondLoad.then(() => {
    secondSettled = true;
  });
  await Promise.resolve();
  assert.equal(secondSettled, false);

  second.resolve('second-ready');
  assert.equal(await secondLoad, 'second-ready');
  assert.deepEqual(logger.errors, []);
}

for (const failingBundle of ['first-paint', 'exchange']) {
  const firstPaint = deferred();
  const exchange = deferred();
  const logger = createLogger();
  const loads = startExchangeBundles({
    logger,
    importModule(specifier) {
      return specifier === './first-paint.js'
        ? firstPaint.promise
        : exchange.promise;
    }
  });

  const failed = failingBundle === 'first-paint' ? firstPaint : exchange;
  const surviving = failingBundle === 'first-paint' ? exchange : firstPaint;
  const failedLoad = failingBundle === 'first-paint'
    ? loads.firstPaintLoad
    : loads.exchangeLoad;
  const survivingLoad = failingBundle === 'first-paint'
    ? loads.exchangeLoad
    : loads.firstPaintLoad;

  failed.reject(new Error(`${failingBundle} unavailable`));
  assert.equal(await failedLoad, null);
  surviving.resolve('survivor-ready');
  assert.equal(await survivingLoad, 'survivor-ready');
  assert.equal(logger.errors.length, 1);
  assert.match(logger.errors[0][0], new RegExp(`${failingBundle} bundle load failed`));
}

for (const failingBundle of ['first-paint', 'exchange']) {
  const calls = [];
  const logger = createLogger();
  const loads = startExchangeBundles({
    logger,
    importModule(specifier) {
      calls.push(specifier);
      if (specifier === `./${failingBundle}.js`) {
        throw new Error(`synchronous ${failingBundle} failure`);
      }
      return Promise.resolve('survivor-ready');
    }
  });

  assert.deepEqual(calls, ['./first-paint.js', './exchange.js']);
  const failedLoad = failingBundle === 'first-paint'
    ? loads.firstPaintLoad
    : loads.exchangeLoad;
  const survivingLoad = failingBundle === 'first-paint'
    ? loads.exchangeLoad
    : loads.firstPaintLoad;
  assert.equal(await failedLoad, null);
  assert.equal(await survivingLoad, 'survivor-ready');
  assert.equal(logger.errors.length, 1);
}

for (const { name, startBundle } of [
  { name: 'drops', startBundle: startDropsBundle }
]) {
  const calls = [];
  const logger = createLogger();
  const { bundleLoad } = startBundle({
    logger,
    importModule(specifier) {
      calls.push(specifier);
      return Promise.resolve(`${name}-ready`);
    }
  });

  assert.deepEqual(calls, [`./${name}.js`]);
  assert.equal(await bundleLoad, `${name}-ready`);
  assert.deepEqual(logger.errors, []);

  const failureLogger = createLogger();
  const failed = startBundle({
    logger: failureLogger,
    importModule() {
      return Promise.reject(new Error(`${name} unavailable`));
    }
  });
  assert.equal(await failed.bundleLoad, null);
  assert.equal(failureLogger.errors.length, 1);
  assert.match(failureLogger.errors[0][0], new RegExp(`${name} bundle load failed`));

  const synchronousFailureLogger = createLogger();
  const synchronouslyFailed = startBundle({
    logger: synchronousFailureLogger,
    importModule() {
      throw new Error(`synchronous ${name} failure`);
    }
  });
  assert.equal(await synchronouslyFailed.bundleLoad, null);
  assert.equal(synchronousFailureLogger.errors.length, 1);
  assert.match(
    synchronousFailureLogger.errors[0][0],
    new RegExp(`${name} bundle load failed`)
  );
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

console.log('Loader architecture and Home/Exchange first-paint tests passed.');
