import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { concurrentRollback, manifestFixture } from '../../assets/thumbs/scripts/thumbs-transaction-fixtures.mjs';
import { WebflowCmsClient, uploadAssetBinary } from '../../assets/webflow-cms/webflow-cms.mjs';

// CMS writes terminate at inert HTTP functions. No connected service or token used.
const metadata = { uploadUrl: 'https://inert.invalid/upload', uploadDetails: { key: 'inert' }, originalFileName: 'inert.jpg' };
assert.deepEqual(await uploadAssetBinary({ metadata, bytes: Buffer.from('inert'), fetchImpl: async () => ({ status: 201 }) }), { status: 201 });
await assert.rejects(uploadAssetBinary({ metadata, bytes: Buffer.from('inert'), fetchImpl: async () => ({ status: 503 }) }),
  e => e.writeOutcome === 'not-applied');
await assert.rejects(uploadAssetBinary({ metadata, bytes: Buffer.from('inert'), fetchImpl: async () => { throw new Error('inert lost response'); } }),
  e => e.writeOutcome === 'unknown');
const client = new WebflowCmsClient({ token: 'inert', siteId: 'inert', fetchImpl: async () => ({ ok: true, status: 200,
  text: async () => { throw new Error('inert body truncation after headers'); } }) });
await assert.rejects(client.patchImage('collection', 'item', 'locale', { fileId: 'inert' }), e => e.writeOutcome === undefined);
console.log('AUD-002-009: binary-upload HTTP 503 claims not-applied; mutation body truncation loses outcome classification; 201/transport-loss controls distinguished');

const work = fileURLToPath(new URL('../work/', import.meta.url));
await fs.mkdir(work, { recursive: true });
const root = await fs.mkdtemp(path.join(work, 'AUD-002-assets-'));
assert.ok(path.resolve(root).startsWith(path.resolve(work) + path.sep));
try {
  for (const successFirst of [false, true]) {
    const paths = await manifestFixture(path.join(root, successFirst ? 'success-first' : 'failure-first'));
    await concurrentRollback(paths, successFirst);
  }
  console.log('AUD-002-010 regression: overlapping imports in both orders preserve the committed master, archived source and manifest entry; actual checkManifest passes after rollback');
} finally {
  const checked = path.resolve(root);
  assert.ok(checked.startsWith(path.resolve(work) + path.sep));
  await fs.rm(checked, { recursive: true, force: true });
}
console.log('Asset assertions passed; real Admin assets/manifests and external services untouched');
