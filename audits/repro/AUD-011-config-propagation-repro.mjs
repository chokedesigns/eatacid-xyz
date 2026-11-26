// B2 source-seam evidence, not remediation or live operation evidence.
// All writes/locks/journals are in a fresh disposable copy under audits/work.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createProductionDropParamsProvider } from '../../admin-ui/src/features/drops/drop-params.provider.js';
import { createServiceBackedDropParamsProvider } from '../../admin-ui/src/features/drops/authoring/drop-params.provider.dev.js';
import { createAuthoringController } from '../../admin-ui/src/features/drops/authoring/authoring.controller.js';
import { createAuthoringView } from '../../admin-ui/src/features/drops/authoring/authoring.view.js';
import { buildOperatorPreview } from '../../admin-ui/src/features/drops/authoring/authoring.preview.js';

const repo = fileURLToPath(new URL('../../', import.meta.url));
const work = path.join(repo, 'audits/work');
await mkdir(work, { recursive: true });
const root = await mkdtemp(path.join(work, 'AUD-011-batch2-'));
const load = name => import(pathToFileURL(path.join(root, 'shared/drop-params', name)).href);
let child;
let childExit;
try {
  for (const dir of ['shared/drop-params', 'admin-ui/src']) await mkdir(path.join(root, dir), { recursive: true });
  await writeFile(path.join(root, 'package.json'), '{"type":"module"}\n');
  for (const name of ['shared/chain-registry.js', 'shared/network.js', 'shared/drop-time.js',
    'shared/public-drop-compatibility.js', ...['authoring', 'archive', 'projector', 'recovery',
      'transaction', 'authoring-service'].map(n => `shared/drop-params/drop-params-${n}.mjs`)]) {
    await copyFile(path.join(repo, name), path.join(root, name));
  }
  const a = await load('drop-params-authoring.mjs');
  const p = await load('drop-params-projector.mjs');
  const w = await load('drop-params-transaction.mjs');
  const { createDropParamsAuthoringApi } = await load('drop-params-authoring-service.mjs');
  const api = createDropParamsAuthoringApi(); // Actual filesystem reader/writer.
  const active = { dropScheduled: true, dropName: 'AUD-011 B2 CONTROL', mirrorNetwork: 'testnet',
    dropDate: { month: 'May', day: '28', year: '2026' },
    dropTime: { time: '9:00', period: 'PM', timezone: 'EST' },
    burnTokens: [{ collection: 'HEN', enabled: true, exclude: ['141634'], burnAmount: 1 }],
    redeemToken: { collection: 'CANAAN', tokenId: '29', redeemAmount: 1, totalSupply: 10 } };
  async function setParams(params) {
    await writeFile(p.DROP_PARAMS_PATHS.canonicalSource, a.serializeDropParamsSource(params));
    await p.projectDropParams();
    assert.equal((await p.verifyDropParamsEquality()).ok, true);
  }

  // The authoritative canonical domain includes unscheduled authored content.
  // Both provider modes must accept the supported committed configuration domain.
  for (const [label, params, accepts] of [
    ['active', active, true], ['exact inactive', a.INACTIVE_DROP_PARAMS, true],
    ['unscheduled authored', { ...active, dropScheduled: false }, false],
  ]) {
    assert.equal(a.validateDropParams(params).ok, true);
    await setParams(params);
    const snapshot = await api.getState();
    assert.equal(snapshot.representations.equal, true);
    assert.equal(snapshot.writer.blocked, false);
    const provider = createServiceBackedDropParamsProvider({ load: api.getState });
    if (accepts) {
      assert.equal(createProductionDropParamsProvider({ params }).getSnapshot().status, 'READY');
      assert.equal((await provider.refresh()).status, 'READY');
    } else {
      assert.throws(() => createProductionDropParamsProvider({ params }), { code: 'invalid_snapshot' });
      await assert.rejects(provider.refresh(), { code: 'invalid_snapshot' });
      assert.equal(provider.getSnapshot().status, 'ERROR');
      assert.equal(provider.getSnapshot().params, null);
    }
    console.log(`canonical/provider ${label}: ${accepts ? 'accepted control' : 'confirmed domain mismatch'}`);
  }
  await setParams(active);

  // Reuse the existing inert DOM fixture verbatim; run the real view's
  // populate/readCandidate and the real API/writer, with current title data.
  // Thumbnail URLs do not participate in selector values and are omitted.
  const fixtureSource = await readFile(path.join(repo, 'admin-ui/tests/runtime/authoring-session.test.mjs'), 'utf8');
  const fixtureStart = fixtureSource.indexOf('function documentFixture() {');
  const fixtureEnd = fixtureSource.indexOf('\nconst active =', fixtureStart);
  assert.ok(fixtureStart >= 0 && fixtureEnd > fixtureStart);
  const documentFixture = new Function(`${fixtureSource.slice(fixtureStart, fixtureEnd)}; return documentFixture;`)();
  const henTitles = JSON.parse(await readFile(path.join(repo, 'admin-ui/src/titles/hen.json'), 'utf8'));
  const tokenRows = collection => collection === 'HEN'
    ? Object.entries(henTitles).map(([tokenId, title]) => ({ tokenId, title })) : [];
  const view = createAuthoringView({ document: documentFixture(), tokenRows });
  const formParams = { ...active,
    burnTokens: [{ collection: 'INTRODUCTIONS', enabled: true, exclude: [], burnAmount: 1 }] };
  view.openForm({ operation: 'EDIT', params: formParams,
    capabilities: { collections: ['HEN', 'INTRODUCTIONS', 'CANAAN'], mirrorNetworks: ['testnet'], timezones: ['EST'] } });
  const collectionSelector = view.getRoot().querySelector('[name="redeemCollection"]');
  collectionSelector.value = 'HEN';
  collectionSelector.fire('change'); // Actual view listener repopulates the token selector.
  const selector = view.getRoot().querySelector('[name="redeemTokenId"]');
  assert.ok(selector.children.some(option => option.value === '141634'));
  assert.equal(selector.children.some(option => option.value === '6'), false);
  selector.value = '141634'; // Choose the actual titled option from the repopulated selector.
  const selected = view.readCandidate();
  assert.equal(selected.redeemToken.tokenId, '141634');
  const operatorPreview = buildOperatorPreview({ operation: 'EDIT', candidate: selected, tokenRows });
  assert.equal(operatorPreview.redeem.tokenTitle, 'COPY MACHINE');
  const { chainRegistry } = await import(pathToFileURL(path.join(root, 'shared/chain-registry.js')).href);
  assert.equal(chainRegistry.testnet.mirrors.HEN['141634'], '6');
  assert.equal((await api.validate({ operation: 'EDIT', candidate: selected })).ok, true);
  const plan = { operation: 'EDIT', expectedSourceVersion: await p.getCurrentSourceVersion(), candidate: selected };
  const token = await api.preview(plan);
  assert.equal((await api.apply({ ...plan, candidateHash: token.candidateHash, planHash: token.planHash,
    previewToken: token.previewToken })).result.status, 'completed');
  assert.equal((await api.getState()).params.redeemToken.tokenId, '141634');
  assert.equal(a.validateDropParams({ ...selected, redeemToken: { ...selected.redeemToken, tokenId: '6' } }).ok, true);
  console.log('HEN redeem selector: COPY MACHINE commits canonical 141634; registry native ID is 6; API-native-ID control accepted');
  await setParams(active);

  function controllerFixture() {
    const observed = { enabled: null, timer: null };
    const provider = createServiceBackedDropParamsProvider({ load: api.getState });
    const view = { ensure() {}, bindActions() {}, setMode() {}, inferScheduled: () => true,
      setServiceState(status, message, enabled) { observed.status = status; observed.enabled = enabled; } };
    const controller = createAuthoringController({ provider, view, client: {},
      documentRef: { getElementById: () => null },
      setTimeoutImpl(fn) { observed.timer = fn; return { unref() {} }; },
      clearTimeoutImpl() {} });
    controller.init();
    return { controller, provider, observed };
  }
  const healthy = controllerFixture();
  await healthy.controller.refresh();
  assert.equal(healthy.controller.state.status, 'READY');
  assert.equal(healthy.observed.enabled, true);
  for (const blocked of ['BUSY', 'RECONCILIATION REQUIRED']) {
    let lock;
    if (blocked === 'BUSY') lock = await p.acquireDropParamsLock();
    else await assert.rejects(w.editDropParams({ operationId: 'interrupted',
      expectedSourceVersion: await p.getCurrentSourceVersion(), candidate: { ...active, dropName: 'NEXT' } },
    { testHooks: { beforeStageFile() { throw Object.assign(new Error('interruption'), { simulateProcessInterruption: true }); } } }), /interruption/);
    const f = controllerFixture();
    await f.controller.refresh();
    assert.equal(f.controller.state.status, blocked);
    assert.equal(f.observed.enabled, false);
    if (lock) await lock.release();
    else assert.equal((await w.reconcileDropParamsTransactions()).blocked, false);
    // Invoke the actual controller's scheduled health callback, not a substitute transition.
    await f.observed.timer();
    assert.equal(f.provider.getSnapshot().status, 'READY');
    assert.equal(f.controller.state.snapshot.writer.busy, false);
    assert.equal(f.controller.state.snapshot.writer.blocked, false);
    assert.equal(f.controller.state.status, blocked);
    assert.equal(f.observed.enabled, false);
    await f.observed.timer();
    assert.equal(f.controller.state.status, blocked, 'another healthy poll cannot recover controls');
    await f.controller.refresh(); // Explicit non-monitor control recovers; no such refresh button is bound.
    assert.equal(f.controller.state.status, 'READY');
    assert.equal(f.observed.enabled, true);
    console.log(`controller ${blocked}: confirmed disabled after recovery; explicit refresh control passes`);
  }

  // Delay actual reads, without substituting bytes or overriding the API/writer.
  // A supported writer can finish between the version read and snapshot reads.
  let captured;
  const overlappingProvider = createServiceBackedDropParamsProvider({ load: async () => {
    captured = await api.getState(); return captured;
  } });
  const oldPublished = await overlappingProvider.refresh();
  const oldVersion = oldPublished.sourceVersion;
  const later = { ...active, dropName: 'SUPPORTED CONCURRENT COMMIT' };
  const protectedPaths = new Set([p.DROP_PARAMS_PATHS.canonicalSource,
    p.DROP_PARAMS_PATHS.outerJson, p.DROP_PARAMS_PATHS.adminMirror]);
  const originalRead = fs.readFile;
  let seen = 0, startCommit, resumeReads;
  const versionCaptured = new Promise(resolve => { startCommit = resolve; });
  const resume = new Promise(resolve => { resumeReads = resolve; });
  fs.readFile = async (file, ...args) => {
    if (protectedPaths.has(file) && seen < 4) {
      const index = seen++;
      if (index === 0) {
        const bytes = await originalRead(file, ...args);
        startCommit(); await resume; return bytes;
      }
      await resume;
    }
    return originalRead(file, ...args);
  };
  syncBuiltinESMExports();
  let overlap;
  try {
    overlap = overlappingProvider.refresh();
    await versionCaptured;
    await w.editDropParams({ operationId: 'supported-snapshot-overlap',
      expectedSourceVersion: oldVersion, candidate: later });
    resumeReads();
    await overlap;
  } finally {
    resumeReads();
    fs.readFile = originalRead;
    syncBuiltinESMExports();
    await overlap;
  }
  assert.equal(seen, 4);
  assert.equal(captured.sourceVersion, oldVersion);
  assert.equal(captured.params.dropName, later.dropName);
  assert.equal(captured.representations.equal, true);
  assert.notEqual(await p.getCurrentSourceVersion(), captured.sourceVersion);
  assert.equal(overlappingProvider.getSnapshot(), oldPublished, 'sameSource discards newer params under the old digest');
  assert.equal(overlappingProvider.getSnapshot().params.dropName, active.dropName);
  const recoveryRead = await overlappingProvider.refresh();
  assert.equal(recoveryRead.params.dropName, later.dropName);
  assert.notEqual(recoveryRead.sourceVersion, oldVersion);
  await assert.rejects(api.preview({ operation: 'EDIT', expectedSourceVersion: oldVersion, candidate: active }),
    { code: 'stale_source_version' });
  console.log('concurrent snapshot: confirmed later params under earlier sourceVersion; READY cache retains old params; next poll and writer CAS controls pass');
  await setParams(active);

  // Existing service contention tests own the lock in the service PID. Test the
  // supported separate CLI/watcher PID too. No HTTP listener is started.
  const projectorUrl = pathToFileURL(path.join(root, 'shared/drop-params/drop-params-projector.mjs')).href;
  child = spawn(process.execPath, ['--input-type=module', '-e',
    `const p = await import(${JSON.stringify(projectorUrl)}); const lock = await p.acquireDropParamsLock();
     console.log('owned'); process.stdin.resume(); process.stdin.once('end', async () => { await lock.release(); process.exit(0); });`],
  { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
  childExit = new Promise((resolve, reject) => { child.once('exit', resolve); child.once('error', reject); });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('child acquisition timeout')), 5000);
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.stdout.once('data', data => { clearTimeout(timer); assert.match(String(data), /owned/); resolve(); });
  });
  const snapshot = await api.getState();
  assert.equal(snapshot.writer.lockState, 'active');
  assert.equal(snapshot.writer.busy, false);
  const provider = createServiceBackedDropParamsProvider({ load: api.getState });
  assert.equal((await provider.refresh()).status, 'READY');
  const preview = await api.preview({ operation: 'EDIT', expectedSourceVersion: snapshot.sourceVersion,
    candidate: { ...active, dropName: 'PREVIEW WHILE OTHER PID OWNS LOCK' } });
  assert.ok(preview.previewToken);
  child.stdin.end();
  assert.equal(await childExit, 0);
  child = null;
  console.log('cross-process owner: confirmed busy=false / provider READY / preview issued; file-lock exclusion is separate');
  assert.equal((await p.verifyDropParamsEquality()).ok, true);
  console.log('PASS: 5 bounded failures observed with valid and recovered controls; no real repository mutations');
} finally {
  if (child) { child.kill(); await childExit?.catch(() => {}); }
  assert.ok(path.resolve(root).startsWith(path.resolve(work) + path.sep));
  await rm(root, { recursive: true, force: true });
}
