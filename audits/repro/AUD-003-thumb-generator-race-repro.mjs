// Disposable cross-repository writer race; never touches real Admin assets.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

import { run as generateManifest } from '../../admin-ui/scripts/gen-thumbs-manifest.mjs';
import { processInputCollection } from '../../assets/thumbs/scripts/thumbs.mjs';
import { check, manifestFixture, pendingImage } from '../../assets/thumbs/scripts/thumbs-transaction-fixtures.mjs';

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../work');
const root = path.join(workspace, `AUD-003-thumb-generator-${randomUUID()}`);
assert.ok(root.startsWith(workspace + path.sep));

try {
  await fs.mkdir(root, { recursive: true });
  const paths = await manifestFixture(root);
  await pendingImage(paths, 'canaan');
  const before = await fs.readFile(paths.manifestPath);
  const addedMaster = path.join(paths.mastersRoot, 'the_419_script', '1.jpg');
  let directGenerated;

  const failedImport = await processInputCollection('canaan', paths, {
    beforeWrite: async () => {
      await fs.copyFile(path.join(paths.mastersRoot, 'the_419_script', '0.jpg'), addedMaster);
      await generateManifest({ thumbsRoot: paths.mastersRoot, outFile: paths.manifestPath });
      directGenerated = await fs.readFile(paths.manifestPath);
      assert.notDeepEqual(directGenerated, before);
      await check(paths); // Valid concurrent projection before the import rolls back.
    },
    manifestRunner: async () => { throw new Error('inert import generator failure'); },
  });

  assert.equal(failedImport.status, 'failed');
  assert.match(failedImport.errors.join(' '), /manifest restored/);
  assert.deepEqual(await fs.readFile(paths.manifestPath), before);
  await fs.access(addedMaster);
  await assert.rejects(check(paths), /stale/);

  // Sequential control: a later direct generation restores exact coverage.
  await generateManifest({ thumbsRoot: paths.mastersRoot, outFile: paths.manifestPath });
  await check(paths);
  assert.deepEqual(await fs.readFile(paths.manifestPath), directGenerated);
  console.log('Concurrent direct generator result was lost by import rollback; sequential regeneration restored it.');
} finally {
  assert.ok(root.startsWith(workspace + path.sep));
  await fs.rm(root, { recursive: true, force: true });
}
