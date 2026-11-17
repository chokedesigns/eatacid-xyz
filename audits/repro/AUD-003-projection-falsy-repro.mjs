// Exercise the checked-out writer/projector in disposable copies only.
import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const outer = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const work = path.join(outer, 'audits', 'work');
await mkdir(work, { recursive: true });
const fixture = await mkdtemp(path.join(work, 'AUD-003-falsy-'));
assert.equal(path.dirname(fixture), work, 'fixture must stay in ignored audit work');
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
  const { default: current } = await import(pathToFileURL(path.join(destDir, 'drop-params.js')));
  assert.equal((await projector.verifyDropParamsEquality()).ok, true, 'valid copied control');
  const candidate = structuredClone(current);
  candidate.dropName += ' AUDIT';
  const request = {
    operationId: 'aud003-falsy-projection',
    expectedSourceVersion: await projector.getCurrentSourceVersion(),
    candidate,
  };
  const outerJson = projector.DROP_PARAMS_PATHS.outerJson;
  const mirror = projector.DROP_PARAMS_PATHS.adminMirror;
  const paths = [projector.DROP_PARAMS_PATHS.canonicalSource, outerJson, mirror];
  const before = await Promise.all(paths.map(file => readFile(file)));
  await assert.rejects(writer.editDropParams(request, {
    testHooks: { async beforeFinalVerification() {
      await writeFile(outerJson, 'null\n');
      await writeFile(mirror, 'null\n');
      assert.equal((await projector.verifyDropParamsEquality({ expectedParams: candidate })).ok, false,
        'shared verifier rejects falsy projections');
    } },
  }), error => error.code === 'reconciliation_required' && /equality verification failed/.test(error.cause.message));
  assert.equal(await readFile(outerJson, 'utf8'), 'null\n', 'external projection preserved');
  assert.equal(await readFile(mirror, 'utf8'), 'null\n', 'external mirror preserved');
  const status = await writer.getDropParamsTransactionStatus();
  assert.equal(status.blocked, true);
  assert.equal(status.operations[0].status, 'reconciliation_required');
  assert.equal(status.operations[0].result, null);
  for (const [index, file] of paths.entries()) await writeFile(file, before[index]);
  assert.equal((await writer.reconcileDropParamsTransactions()).blocked, false);
  const result = await writer.editDropParams(request);
  assert.equal(result.status, 'completed', 'valid retry completes');
  assert.equal((await projector.verifyDropParamsEquality({ expectedParams: candidate })).ok, true);
  console.log('Projection: valid control passes; null projections fail verification and remain blocked and preserved; retry completes after exact-state resolution.');
} finally {
  const relative = path.relative(work, fixture);
  assert.ok(relative && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
  await rm(fixture, { recursive: true, force: true });
}
