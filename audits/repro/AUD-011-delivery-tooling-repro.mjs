// B7 evidence only. No SDK client constructed, local provider imported, socket,
// real signer or real send. Production modules are imported without invoking CLIs.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chainRegistry } from '../../shared/chain-registry.js';
import { PAIRS, TARGET, buildPayload, inspectChain, readBack, printSummary } from '../../scripts/shadownet-exchange-pairs.mjs';
import { pollForConfirmation } from '../../shared/public-trade-ops.js';
import { pruneProductionAuthoring } from '../../admin-ui/scripts/prune-production-authoring.mjs';
import { verifyProductionAuthoringIsolation } from '../../admin-ui/scripts/verify-production-authoring-isolation.mjs';
import { tokenIdOf as intakeId, nextNumericKey } from '../../assets/thumbs/scripts/thumbs.mjs';
import { tokenIdOf as manifestId } from '../../admin-ui/scripts/gen-thumbs-manifest.mjs';

const root = fileURLToPath(new URL('../..', import.meta.url));
const read = relative => fs.readFile(path.join(root, relative), 'utf8');
const flush = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); };

// Execute the entire real coordinator, replacing only its static network import
// and export declaration. Timers/DOM/fonts/images are controlled boundaries.
const paintSource = (await read('shared/public-first-paint.js'))
  .replace("import { network } from './network.js';", "const network = 'testnet';")
  .replace(/export \{[\s\S]*?\};\s*$/, 'globalThis.paint = { startPublicFirstPaint, publicFirstPaint };');
assert.ok(paintSource.includes('globalThis.paint ='));
for (const mode of ['ready', 'font-error', 'hero-error', 'stalled', 'dom-late']) {
  const classes = new Set(['first-paint-main']);
  const surfaces = [{ style: {} }, { style: {} }];
  const timers = [];
  let domReady;
  let styles = 0;
  const image = { complete: mode !== 'stalled', naturalWidth: mode === 'hero-error' ? 0 : 100,
    decode: async () => {}, addEventListener() {}, removeEventListener() {} };
  const body = { classList: { add: (...names) => names.forEach(n => classes.add(n)),
    remove: name => classes.delete(name), contains: name => classes.has(name) },
    querySelector: selector => selector === '.home-hero-character-image' ? image : null,
    querySelectorAll: () => surfaces };
  const document = { body: mode === 'dom-late' ? null : body,
    fonts: { load: () => mode === 'stalled' ? new Promise(() => {}) : mode === 'font-error'
      ? Promise.reject(new Error('inert font error')) : Promise.resolve([{}]), check: () => true },
    getElementById: () => null, createElement: () => ({}), head: { appendChild() { styles++; } },
    addEventListener(name, callback) { assert.equal(name, 'DOMContentLoaded'); domReady = callback; } };
  const context = vm.createContext({ window: {}, document, console,
    requestAnimationFrame: callback => callback(),
    setTimeout(callback, ms) { const t = { callback, ms }; timers.push(t); return t; },
    clearTimeout(timer) { timer.cleared = true; } });
  vm.runInContext(paintSource, context);
  const state = context.paint.publicFirstPaint;
  assert.equal(context.paint.startPublicFirstPaint(), state);
  if (mode === 'dom-late') { assert.equal(timers.length, 0); document.body = body; domReady(); }
  await flush();
  assert.equal(styles, 1);
  assert.equal(timers.filter(t => t.ms === 1300).length, 1);
  if (mode === 'stalled') {
    assert.equal(state.ready, false);
    timers.find(t => t.ms === 1300).callback();
    assert.equal(surfaces[0].style.visibility, 'visible');
  } else if (mode === 'font-error') {
    timers.find(t => t.ms === 1000).callback();
    await flush();
  }
  assert.equal(state.ready, true, mode);
  assert.equal(classes.has('is-testnet'), true);
  assert.equal(state.fallback, ['font-error', 'hero-error', 'stalled'].includes(mode));
}
console.log('PASS: real first-paint ready/error/stall/DOM-late/repeat-init controls');

// Utility's actual image continuation: cached good/broken and later load/error.
const utilitySource = (await read('collection-utility/js/main.js')).replace(/^import .*;\r?\n/gm, '');
for (const mode of ['cached-good', 'cached-broken', 'load', 'error', 'no-spinner']) {
  const events = {};
  const spinner = { style: {} };
  const image = { style: {}, complete: mode.startsWith('cached'), naturalWidth: mode === 'cached-good' ? 1 : 0,
    closest: () => ({ querySelector: () => mode === 'no-spinner' ? null : spinner }),
    addEventListener(name, callback) { events[name] = callback; } };
  vm.runInNewContext(utilitySource, { document: { querySelectorAll: () => [image] } });
  if (mode === 'load' || mode === 'error') events[mode]();
  if (mode !== 'no-spinner') assert.equal(spinner.style.display, 'none');
  assert.equal(image.style.opacity === '1', ['cached-good', 'load'].includes(mode));
}
console.log('PASS: real Utility cached/load/error/missing-spinner controls');

// Current run() body with ONLY the local-provider dynamic import replaced.
// Actual ABI encoder, chain inspection, exact readback and poller are reused.
// This is an inert orchestration fixture, never the operational CLI --execute.
const signerSource = await read('scripts/shadownet-exchange-pairs.mjs');
let runBody = signerSource.slice(signerSource.indexOf('export async function run('), signerSource.indexOf('\nif (process.argv[1]'));
const importText = 'await import(pathToFileURL(resolve(provider)).href)';
assert.equal(runBody.split(importText).length, 2);
runBody = runBody.replace('export async function run', 'async function run').replace(importText, 'await fixtureProvider()');
const payload = await buildPayload();
const nativeFetch = globalThis.fetch;
try {
  for (const mode of ['success', 'wrong-rpc', 'wrong-chain', 'wrong-abi', 'wrong-storage', 'wrong-signer', 'occupied',
    'unexpected', 'payload-drift', 'read-error', 'send-error', 'poll-error', 'poll-timeout', 'post-drift']) {
    let sends = 0;
    let polls = 0;
    let imports = 0;
    let written = mode === 'occupied';
    const logs = [];
    const provider = {
      signer: { publicKeyHash: async () => mode === 'wrong-signer' ? 'tz1-other' : 'tz1hr2Y31zqvzkDkNGDMmPcSJLKwzH36t3W9' },
      rpc: { getRpcUrl: () => mode === 'wrong-rpc' ? 'https://inert.invalid' : chainRegistry.testnet.rpc,
        getChainId: async () => mode === 'wrong-chain' ? 'WrongChain' : TARGET.chainId,
        getBlockHeader: async () => ({ level: written ? 124 : 123 }),
        getEntrypoints: async () => ({ entrypoints: { set_token_pairs: mode === 'wrong-abi' ? { prim: 'unit' } : payload.type } }),
        getScript: async () => ({ code: mode === 'wrong-storage'
          ? payload.code.map(n => n.prim === 'storage' ? { prim: 'storage', args: [{ prim: 'unit' }] } : n)
          : payload.code, storage: { prim: 'Pair', args: [
          { prim: 'Pair', args: [{ string: 'tz1hr2Y31zqvzkDkNGDMmPcSJLKwzH36t3W9' }, { string: 'tz1iwgimbUW9fKdTfkS7GNyXqBu5oAjQw6xn' }] },
          { prim: 'False' }, { int: '38911' }, { int: String(written ? 44 : mode === 'unexpected' ? 1 : 0) },
        ] } }) },
      setPackerProvider() {},
      contract: { getBigMapKeyByID: async (_map, id) => {
        if (mode === 'read-error') throw Object.assign(new Error('inert unavailable'), { status: 503 });
        if (!written) throw Object.assign(new Error('inert missing'), { status: 404 });
        const { token_pair_id, ...pair } = PAIRS[id];
        return mode === 'post-drift' && id === 0 ? { ...pair, redeem_amount: 999 } : pair;
      }, at: async target => { assert.equal(target, TARGET.escrow); return { methodsObject: {
        set_token_pairs: pairs => { assert.deepEqual(pairs, PAIRS); return {
          toTransferParams: () => ({ parameter: mode === 'payload-drift' ? { entrypoint: 'wrong' } : payload.parameter }),
          send: async options => {
            assert.equal(options.amount, 0); sends++;
            if (mode === 'send-error') throw new Error('inert send error');
            written = true;
            return { hash: 'inert-operation-hash' };
          },
        }; },
      } }; } },
    };
    globalThis.fetch = async url => {
      polls++;
      assert.equal(url, `${chainRegistry.testnet.tzkt}/v1/operations/inert-operation-hash`);
      return { ok: true, json: async () => [{ type: 'transaction', hash: 'inert-operation-hash',
        target: { address: TARGET.escrow }, parameter: { entrypoint: 'set_token_pairs' },
        status: mode === 'poll-error' ? 'failed' : 'applied' }] };
    };
    const context = vm.createContext({ assert, buildPayload, printSummary, inspectChain, readBack, PAIRS,
      TARGET, chainRegistry, pollForConfirmation: mode === 'poll-timeout'
        ? async () => { throw new Error('inert confirmation deadline'); } : pollForConfirmation,
      resolve: path.resolve, pathToFileURL,
      parseArgs: () => ({ mode: 'execute', provider: 'inert-never-imported' }),
      fixtureProvider: async () => { imports++; return { tezos: provider }; } });
    vm.runInContext(`${runBody}\nglobalThis.runFixture = run;`, context);
    if (mode === 'success') {
      assert.equal(await context.runFixture([], line => logs.push(line)), true);
      assert.equal(sends, 1); assert.equal(polls, 1);
      await assert.rejects(context.runFixture([], () => {}), /already occupied/);
      assert.equal(sends, 1, 'retry cannot replay already occupied IDs');
    } else {
      await assert.rejects(context.runFixture([], () => {}));
      assert.equal(sends, ['send-error', 'poll-error', 'poll-timeout', 'post-drift'].includes(mode) ? 1 : 0, mode);
    }
    assert.ok(imports >= 1);
  }
} finally { globalThis.fetch = nativeFetch; }
console.log('PASS: real signer orchestration, target/ABI/admin/occupancy/payload/send/poll/readback/retry boundaries');

// An explicit evidence limit: inspectChain checks parameter/storage ABI, not the
// live code body. Acceptance here must never be described as deployed code proof.
const rpcAbiOnly = {
  getRpcUrl: () => chainRegistry.testnet.rpc, getChainId: async () => TARGET.chainId,
  getBlockHeader: async () => ({ level: 123 }),
  getEntrypoints: async () => ({ entrypoints: { set_token_pairs: payload.type } }),
  getScript: async () => ({ code: payload.code.map(n => n.prim === 'code'
    ? { prim: 'code', args: [[{ prim: 'FAILWITH' }]] } : n), storage: { prim: 'Pair', args: [
      { prim: 'Pair', args: [{ string: 'tz1hr2Y31zqvzkDkNGDMmPcSJLKwzH36t3W9' }, { string: 'tz1iwgimbUW9fKdTfkS7GNyXqBu5oAjQw6xn' }] },
      { prim: 'False' }, { int: '38911' }, { int: '0' },
    ] } }),
};
assert.equal((await inspectChain({ rpc: rpcAbiOnly }, payload)).level, 123);
console.log('LIMIT CONFIRMED: live ABI admission does not verify live executable code');

// Disposable production packaging: actual prune/isolation, including rejection
// of forbidden reachable content after pruning and a valid clean control.
const work = path.join(root, 'audits', 'work');
await fs.mkdir(work, { recursive: true });
const fixture = await fs.mkdtemp(path.join(work, 'AUD-011-B7-'));
assert.equal(path.dirname(fixture), work);
try {
  await fs.writeFile(path.join(fixture, 'index.js'), 'console.log("production");');
  await fs.writeFile(path.join(fixture, 'authoring.123.js'), 'Local authoring service');
  await fs.writeFile(path.join(fixture, 'authoring.123.js.map'), '{}');
  await assert.rejects(verifyProductionAuthoringIsolation({ outputDirectory: fixture }), /isolation failed/);
  assert.deepEqual((await pruneProductionAuthoring({ outputDirectory: fixture })).sort(), ['authoring.123.js', 'authoring.123.js.map']);
  assert.equal((await verifyProductionAuthoringIsolation({ outputDirectory: fixture })).checkedFiles, 1);
  await fs.writeFile(path.join(fixture, 'index.js'), 'fetch("http://127.0.0.1:47831")');
  await assert.rejects(verifyProductionAuthoringIsolation({ outputDirectory: fixture }), /127.0.0.1:47831/);
} finally {
  const relative = path.relative(work, fixture);
  assert.ok(relative && !relative.startsWith('..') && !path.isAbsolute(relative));
  await fs.rm(fixture, { recursive: true, force: true });
}
console.log('PASS: actual Admin prune/isolation valid and rejecting controls');

// Document the differing key admission boundaries rather than treating the
// intake's comment claiming identical parsing as an identity proof.
assert.equal(intakeId('0001_suffix.jpg'), '0001');
assert.equal(manifestId('0001_suffix.jpg'), '1');
assert.equal(nextNumericKey(['0001_suffix.jpg']), 2);
assert.throws(() => nextNumericKey(['9007199254740993.jpg']), /safe integer/);
assert.equal(manifestId('9007199254740993.jpg'), '9007199254740993');
console.log('PASS: thumbnail key normalization and safe-int boundary controls');
