import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile, copyFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Execute unmodified configuration modules in an isolated disposable repository
// shape. Never import a real projector/writer with a mutable production path.
const repo = fileURLToPath(new URL('../../', import.meta.url));
const work = path.join(repo, 'audits', 'work');
await mkdir(work, { recursive: true });
const fixture = await mkdtemp(path.join(work, 'AUD-002-config-'));
assert.ok(fixture.startsWith(work + path.sep));
try {
  for (const dir of ['shared/drop-params', 'admin-ui/src']) await mkdir(path.join(fixture, dir), { recursive: true });
  await writeFile(path.join(fixture, 'package.json'), '{"type":"module"}\n');
  for (const name of ['shared/chain-registry.js', 'shared/drop-time.js',
    ...['drop-params-authoring.mjs', 'drop-params-projector.mjs', 'drop-params-transaction.mjs',
      'drop-params-archive.mjs', 'drop-params-recovery.mjs', 'drop-params.js', 'drop-params.json'].map(n => 'shared/drop-params/' + n)]) {
    await copyFile(path.join(repo, name), path.join(fixture, name));
  }
  const baseJson = await readFile(path.join(fixture, 'shared/drop-params/drop-params.json'));
  await writeFile(path.join(fixture, 'admin-ui/src/drop-params.mirror.json'), baseJson);
  const mod = rel => import(pathToFileURL(path.join(fixture, 'shared/drop-params', rel)).href);
  const writer = await mod('drop-params-transaction.mjs');
  const projector = await mod('drop-params-projector.mjs');
  const base = JSON.parse(baseJson);
  const candidate = { ...base, dropName: 'AUD-002 ISOLATED CANDIDATE' };

  const committed = await writer.editDropParams({ operationId: 'aud002-valid',
    expectedSourceVersion: await projector.getCurrentSourceVersion(), candidate });
  assert.equal(committed.status, 'completed');
  assert.equal((await projector.verifyDropParamsEquality()).ok, true);
  assert.equal(JSON.parse(await readFile(projector.DROP_PARAMS_PATHS.adminMirror)).dropName, candidate.dropName);
  console.log('Control: valid edit commits exact candidate to all three isolated files');

  const second = { ...candidate, dropName: 'AUD-002 ROLLBACK CANDIDATE' };
  const baseVersion = await projector.getCurrentSourceVersion();
  await assert.rejects(writer.editDropParams({ operationId: 'aud002-rollback',
    expectedSourceVersion: baseVersion, candidate: second }, { testHooks: {
    beforeReplaceFile: ({ index }) => { if (index === 1) throw new Error('inert second-file write failure'); },
  } }), e => e.code === 'transaction_rolled_back');
  assert.equal(await projector.getCurrentSourceVersion(), baseVersion);
  assert.equal((await projector.verifyDropParamsEquality()).ok, true);
  console.log('Control: injected partial replacement + successful rollback restores exact prior files');

  await assert.rejects(writer.editDropParams({ operationId: 'aud002-unresolved',
    expectedSourceVersion: baseVersion, candidate: second }, { testHooks: {
    beforeReplaceFile: ({ index }) => { if (index === 1) throw new Error('inert second-file write failure'); },
    beforeRollbackFile: ({ key }) => { if (key === 'canonicalSource') throw new Error('inert canonical rollback failure'); },
  } }), e => e.code === 'reconciliation_required');
  assert.equal((await writer.inspectDropParamsTransactionStatus()).blocked, true);
  assert.equal(JSON.parse(await readFile(projector.DROP_PARAMS_PATHS.adminMirror)).dropName, candidate.dropName);
  await assert.rejects(writer.editDropParams({ operationId: 'aud002-blocked',
    expectedSourceVersion: await projector.getCurrentSourceVersion(), candidate }), e => e.code === 'reconciliation_required');
  const blockedFiles = await Promise.all(['canonicalSource', 'outerJson', 'adminMirror']
    .map(key => readFile(projector.DROP_PARAMS_PATHS[key])));
  await assert.rejects(projector.projectDropParams({ syncAdmin: true }),
    e => e.code === 'reconciliation_required');
  assert.deepEqual(await Promise.all(['canonicalSource', 'outerJson', 'adminMirror']
    .map(key => readFile(projector.DROP_PARAMS_PATHS[key]))), blockedFiles);
  assert.equal(JSON.parse(await readFile(projector.DROP_PARAMS_PATHS.adminMirror)).dropName, candidate.dropName);
  assert.equal((await writer.inspectDropParamsTransactionStatus()).blocked, true);
  console.log('AUD-002-004 regression: projection rejects without changing protected files while journal remains blocked; no reconciliation invoked');

  const reconciled = await writer.reconcileDropParamsTransactions();
  assert.equal(reconciled.blocked, false);
  await projector.projectDropParams({ syncAdmin: true });
  assert.equal((await projector.verifyDropParamsEquality()).ok, true);
  for (const index of [0, 1, 2]) {
    const prior = await projector.getCurrentSourceVersion();
    await assert.rejects(writer.editDropParams({ operationId: `aud002-matrix-${index}`,
      expectedSourceVersion: prior, candidate }, { testHooks: {
      beforeReplaceFile: event => { if (event.index === index) throw new Error('inert replacement boundary'); },
    } }), e => e.code === 'transaction_rolled_back');
    assert.equal(await projector.getCurrentSourceVersion(), prior);
    assert.equal((await projector.verifyDropParamsEquality()).ok, true);
  }
  console.log('Controls: explicit reconcile clears block; failures at each of 3 replacement boundaries restore exact prior state');
  const prior = await projector.getCurrentSourceVersion();
  await assert.rejects(writer.editDropParams({ operationId: 'aud002-stale', expectedSourceVersion: '0'.repeat(64), candidate }),
    e => e.code === 'stale_source_version');
  assert.equal(await projector.getCurrentSourceVersion(), prior);
  const deactivateRequest = { operationId: 'aud002-deactivate', expectedSourceVersion: prior };
  const deactivated = await writer.deactivateDropParams(deactivateRequest);
  assert.equal(deactivated.outcome, 'deactivated');
  assert.ok(deactivated.archivePath);
  const archive = JSON.parse(await readFile(path.join(fixture, deactivated.archivePath)));
  assert.equal(archive.source.params.dropName, candidate.dropName);
  assert.equal(JSON.parse(await readFile(projector.DROP_PARAMS_PATHS.adminMirror)).dropScheduled, false);
  assert.equal((await projector.verifyDropParamsEquality()).ok, true);
  const replayed = await writer.deactivateDropParams(deactivateRequest);
  assert.equal(replayed.idempotent, true);
  assert.equal(replayed.archivePath, deactivated.archivePath);
  await assert.rejects(writer.createDropParams({ ...deactivateRequest, candidate }), e => e.code === 'operation_id_conflict');
  console.log('Controls: stale source rejected; deactivation archives reviewed source and makes all files inactive; replay idempotent; conflicting ID rejected');
  console.log('All isolated configuration assertions passed; real source, mirrors, journals and locks untouched');
} finally {
  const checked = path.resolve(fixture);
  assert.ok(checked.startsWith(path.resolve(work) + path.sep));
  await rm(checked, { recursive: true, force: true });
}
