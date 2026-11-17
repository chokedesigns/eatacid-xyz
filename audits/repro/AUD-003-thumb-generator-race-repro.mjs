// Disposable cross-repository race regression; never touches real Admin assets.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { concurrentGeneratorRollback, manifestFixture } from '../../assets/thumbs/scripts/thumbs-transaction-fixtures.mjs';

const workspace = path.resolve(os.tmpdir());
const root = await fs.mkdtemp(path.join(workspace, 'AUD-003-thumb-generator-'));
assert.ok(root.startsWith(workspace + path.sep));
try {
  const paths = await manifestFixture(root);
  await concurrentGeneratorRollback(paths, { independent: true });
  console.log('Standalone generation waited for failed input rollback, retained its master entry, and passed freshness.');
} finally {
  assert.ok(root.startsWith(workspace + path.sep));
  await fs.rm(root, { recursive: true, force: true });
}
