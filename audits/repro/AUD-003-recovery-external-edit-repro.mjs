// A later writer must not silently erase unrelated source edits during recovery.
import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const outer = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const work = path.join(outer, 'audits', 'work');
await mkdir(work, { recursive: true });
const fixture = await mkdtemp(path.join(work, 'AUD-003-recovery-'));
assert.equal(path.dirname(fixture), work);
const sourceDir = path.join(outer, 'shared', 'drop-params');
const destDir = path.join(fixture, 'shared', 'drop-params');

try {
  await mkdir(destDir, { recursive: true });
  await mkdir(path.join(fixture, 'admin-ui', 'src'), { recursive: true });
  for (const name of ['chain-registry.js', 'drop-time.js', 'network.js', 'public-drop-compatibility.js']) {
    await cp(path.join(outer, 'shared', name), path.join(fixture, 'shared', name));
  }
  for (const name of [
    'drop-params-authoring.mjs', 'drop-params-archive.mjs', 'drop-params-projector.mjs',
    'drop-params-recovery.mjs', 'drop-params-transaction.mjs', 'drop-params.js', 'drop-params.json',
  ]) await cp(path.join(sourceDir, name), path.join(destDir, name));
  await cp(path.join(outer, 'admin-ui', 'src', 'drop-params.mirror.json'),
    path.join(fixture, 'admin-ui', 'src', 'drop-params.mirror.json'));
  const projector = await import(pathToFileURL(path.join(destDir, 'drop-params-projector.mjs')));
  const writer = await import(pathToFileURL(path.join(destDir, 'drop-params-transaction.mjs')));
  const authoring = await import(pathToFileURL(path.join(destDir, 'drop-params-authoring.mjs')));
  const { default: original } = await import(pathToFileURL(path.join(destDir, 'drop-params.js')));
  assert.equal((await projector.verifyDropParamsEquality()).ok, true, 'valid copied control');
  const candidate = { ...original, dropName: `${original.dropName} INTERRUPTED` };
  const manual = { ...original, dropName: `${original.dropName} EXTERNAL` };
  const baseBytes = await readFile(projector.DROP_PARAMS_PATHS.canonicalSource);
  const baseVersion = await projector.getCurrentSourceVersion();
  const request = { operationId: 'aud003-interrupted', expectedSourceVersion: baseVersion, candidate };
  await assert.rejects(writer.editDropParams(request, { testHooks: {
    afterReplaceFile({ key }) {
      if (key !== 'canonicalSource') return;
      const error = new Error('inert interruption');
      error.simulateProcessInterruption = true;
      throw error;
    },
  } }), /inert interruption/);
  assert.equal((await writer.inspectDropParamsTransactionStatus()).operations[0].status, 'pending');
  const manualBytes = authoring.serializeDropParamsSource(manual, { operation: authoring.DROP_PARAMS_OPERATIONS.ACTIVE });
  await writeFile(projector.DROP_PARAMS_PATHS.canonicalSource, manualBytes);
  assert.equal((await readFile(projector.DROP_PARAMS_PATHS.canonicalSource, 'utf8')), manualBytes);
  const later = { ...original, dropName: `${original.dropName} LATER` };
  await assert.rejects(writer.editDropParams({
    operationId: 'aud003-later', expectedSourceVersion: await projector.getCurrentSourceVersion(), candidate: later,
  }), error => error.code === 'stale_source_version');
  assert.deepEqual(await readFile(projector.DROP_PARAMS_PATHS.canonicalSource), baseBytes,
    'automatic recovery overwrote the unrelated canonical edit');
  assert.equal((await writer.inspectDropParamsTransactionStatus()).operations[0].status, 'rolled_back');
  const control = { ...request, operationId: 'aud003-control-interrupted' };
  await assert.rejects(writer.editDropParams(control, { testHooks: {
    afterReplaceFile({ key }) {
      if (key !== 'canonicalSource') return;
      const error = new Error('inert control interruption');
      error.simulateProcessInterruption = true;
      throw error;
    },
  } }), /inert control interruption/);
  const recovered = await writer.editDropParams(control);
  assert.equal(recovered.status, 'completed', 'unchanged interrupted source can recover and retry');
  assert.equal((await projector.verifyDropParamsEquality({ expectedParams: candidate })).ok, true);
  console.log('Recovery: valid copied state; pending interruption plus external source edit is silently rolled back by a later writer, which then rejects stale version.');
} finally {
  const relative = path.relative(work, fixture);
  assert.ok(relative && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
  await rm(fixture, { recursive: true, force: true });
}
