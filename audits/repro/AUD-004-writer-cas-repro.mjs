import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Investigation evidence: asserts the current lost-edit failure in disposable
// copies. Production writer/projector run unchanged. The hook models an editor
// saving the authoritative JS while an ordinary operation is staging its files.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const work = path.join(root, 'audits/work');
await mkdir(work, { recursive: true });
for (const externalEdit of [false, true]) {
  const fixture = await mkdtemp(path.join(work, 'AUD-004-cas-'));
  assert.equal(path.dirname(fixture), work);
  try {
    await mkdir(path.join(fixture, 'shared/drop-params'), { recursive: true });
    await mkdir(path.join(fixture, 'admin-ui/src'), { recursive: true });
    await writeFile(path.join(fixture, 'package.json'), '{"type":"module"}');
    for (const file of ['chain-registry.js', 'network.js', 'drop-time.js', 'public-drop-compatibility.js'])
      await cp(path.join(root, 'shared', file), path.join(fixture, 'shared', file));
    for (const file of ['drop-params.js', 'drop-params.json', 'drop-params-authoring.mjs',
      'drop-params-projector.mjs', 'drop-params-archive.mjs', 'drop-params-recovery.mjs', 'drop-params-transaction.mjs'])
      await cp(path.join(root, 'shared/drop-params', file), path.join(fixture, 'shared/drop-params', file));
    await cp(path.join(root, 'admin-ui/src/drop-params.mirror.json'), path.join(fixture, 'admin-ui/src/drop-params.mirror.json'));
    const load = file => import(pathToFileURL(path.join(fixture, 'shared/drop-params', file)).href);
    const writer = await load('drop-params-transaction.mjs');
    const projector = await load('drop-params-projector.mjs');
    const schema = await load('drop-params-authoring.mjs');
    const current = (await load('drop-params.js')).default;
    const candidate = { ...current, dropName: 'REVIEWED CANDIDATE' };
    const later = { ...current, dropName: 'LATER OPERATOR EDIT' };
    const expectedSourceVersion = await projector.getCurrentSourceVersion();
    let injected = false;
    const result = await writer.editDropParams({ operationId: 'aud004-cas', expectedSourceVersion, candidate }, {
      testHooks: { async beforeReplaceFile({ index }) {
        if (externalEdit && index === 0) {
          const bytes = schema.serializeDropParamsSource(later);
          await writeFile(projector.DROP_PARAMS_PATHS.canonicalSource, bytes);
          assert.notEqual(await projector.getCurrentSourceVersion(), expectedSourceVersion);
          injected = true;
        }
      } },
    });
    assert.equal(injected, externalEdit);
    assert.equal(result.status, 'completed');
    assert.equal(await readFile(projector.DROP_PARAMS_PATHS.canonicalSource, 'utf8'), schema.serializeDropParamsSource(candidate));
    assert.equal((await projector.verifyDropParamsEquality({ expectedParams: candidate })).ok, true);
    assert.equal((await writer.inspectDropParamsTransactionStatus()).blocked, false);
    console.log(`${externalEdit ? 'Late external edit overwritten' : 'Unchanged-source control'}: completed, equal projections, writer unblocked`);
  } finally {
    const rel = path.relative(work, fixture);
    assert.ok(rel && !rel.startsWith('..') && !path.isAbsolute(rel));
    await rm(fixture, { recursive: true, force: true });
  }
}
