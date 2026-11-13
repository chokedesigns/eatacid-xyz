// A pending writer journal must not be published as verified local authoring READY.
import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const outer = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const work = path.join(outer, 'audits', 'work');
await mkdir(work, { recursive: true });
const fixture = await mkdtemp(path.join(work, 'AUD-003-pending-'));
assert.equal(path.dirname(fixture), work);
const sourceDir = path.join(outer, 'shared', 'drop-params');
const destDir = path.join(fixture, 'shared', 'drop-params');

try {
  await mkdir(destDir, { recursive: true });
  await mkdir(path.join(fixture, 'admin-ui', 'src', 'features', 'drops', 'authoring'), { recursive: true });
  for (const name of ['chain-registry.js', 'drop-time.js', 'network.js', 'public-drop-compatibility.js']) {
    await cp(path.join(outer, 'shared', name), path.join(fixture, 'shared', name));
  }
  for (const name of [
    'drop-params-authoring.mjs', 'drop-params-archive.mjs', 'drop-params-projector.mjs',
    'drop-params-recovery.mjs', 'drop-params-transaction.mjs', 'drop-params-authoring-service.mjs',
    'drop-params.js', 'drop-params.json',
  ]) await cp(path.join(sourceDir, name), path.join(destDir, name));
  const admin = path.join(fixture, 'admin-ui', 'src');
  await cp(path.join(outer, 'admin-ui', 'src', 'drop-params.mirror.json'), path.join(admin, 'drop-params.mirror.json'));
  for (const name of ['drop-params.provider.js', 'authoring/drop-params.provider.dev.js', 'authoring/authoring.client.js']) {
    await cp(path.join(outer, 'admin-ui', 'src', 'features', 'drops', name), path.join(admin, 'features', 'drops', name));
  }
  const projector = await import(pathToFileURL(path.join(destDir, 'drop-params-projector.mjs')));
  const writer = await import(pathToFileURL(path.join(destDir, 'drop-params-transaction.mjs')));
  const service = await import(pathToFileURL(path.join(destDir, 'drop-params-authoring-service.mjs')));
  const { createServiceBackedDropParamsProvider } = await import(pathToFileURL(path.join(admin, 'features', 'drops', 'authoring', 'drop-params.provider.dev.js')));
  const { default: original } = await import(pathToFileURL(path.join(destDir, 'drop-params.js')));
  const api = service.createDropParamsAuthoringApi();
  const provider = createServiceBackedDropParamsProvider({ load: api.getState });
  assert.equal((await provider.refresh()).status, 'READY', 'healthy copied baseline');
  const candidate = { ...original, dropName: `${original.dropName} PENDING` };
  await assert.rejects(writer.editDropParams({
    operationId: 'aud003-all-files-pending',
    expectedSourceVersion: await projector.getCurrentSourceVersion(), candidate,
  }, { testHooks: { afterReplaceFile({ key }) {
    if (key !== 'adminMirror') return;
    const error = new Error('inert interruption after all replacements');
    error.simulateProcessInterruption = true;
    throw error;
  } } }), /inert interruption/);
  const journal = await writer.inspectDropParamsTransactionStatus();
  assert.equal(journal.operations[0].status, 'pending');
  assert.equal(journal.blocked, true, 'pending requires reconciliation even with matching files');
  const state = await api.getState();
  assert.equal(state.representations.equal, true);
  assert.equal(state.writer.busy, false);
  assert.equal(state.writer.blocked, true);
  await assert.rejects(provider.refresh(), error => error.code === 'reconciliation_required');
  assert.equal(provider.getSnapshot().status, 'RECONCILIATION REQUIRED');
  assert.equal(provider.getSnapshot().params.dropName, original.dropName, 'pending candidate is never published');
  const freshProvider = createServiceBackedDropParamsProvider({ load: api.getState });
  await assert.rejects(freshProvider.refresh(), error => error.code === 'reconciliation_required');
  assert.equal(freshProvider.getSnapshot().params, null);
  await assert.rejects(projector.projectDropParams(), error => error.code === 'reconciliation_required',
    'ordinary projection correctly rejects the same pending journal');
  const nextRequest = { operation: 'EDIT',
    expectedSourceVersion: await projector.getCurrentSourceVersion(),
    candidate: { ...candidate, dropName: `${candidate.dropName} NEXT` },
  };
  await assert.rejects(api.preview(nextRequest), error => error.code === 'reconciliation_required',
    'no actionable preview is issued during pending recovery');
  const reconciled = await writer.reconcileDropParamsTransactions();
  assert.equal(reconciled.operations[0].status, 'completed', 'explicit recovery establishes valid target control');
  assert.equal((await provider.refresh()).status, 'READY');
  assert.equal(provider.getSnapshot().params.dropName, candidate.dropName);
  assert.equal((await api.preview(nextRequest)).ok, true, 'explicit reconciliation restores preview publication');
  console.log('Pending: matching files remain blocked and non-READY without a preview; explicit reconciliation completes the journal and restores READY/preview.');
} finally {
  const relative = path.relative(work, fixture);
  assert.ok(relative && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
  await rm(fixture, { recursive: true, force: true });
}
