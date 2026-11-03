import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { processInputCollection } from '../../assets/thumbs/scripts/thumbs.mjs';
import { buildManifestModel, checkManifest } from '../../admin-ui/scripts/gen-thumbs-manifest.mjs';
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
  const paths = { repoRoot: root, adminRoot: root, inputRoot: path.join(root, 'input'), processedRoot: path.join(root, 'processed'),
    mastersRoot: path.join(root, 'thumbs'), manifestPath: path.join(root, 'manifest.js') };
  for (const col of ['acid_coin', 'canaan', 'hen', 'introductions', 'the_419_script']) await fs.mkdir(path.join(paths.mastersRoot, col), { recursive: true });
  const jpeg = await sharp({ create: { width: 300, height: 400, channels: 3, background: '#345678' } }).jpeg().toBuffer();
  for (const col of ['acid_coin', 'canaan', 'hen', 'introductions', 'the_419_script']) await fs.writeFile(path.join(paths.mastersRoot, col, '0.jpg'), jpeg);
  await fs.mkdir(path.join(paths.mastersRoot, 'undefined'));
  await fs.writeFile(path.join(paths.mastersRoot, 'undefined/undefined.jpg'), jpeg);
  const regenerate = async () => fs.writeFile(paths.manifestPath, buildManifestModel({ thumbsRoot: paths.mastersRoot }).content);
  await regenerate();
  const original = await fs.readFile(paths.manifestPath, 'utf8');
  const png = await sharp({ create: { width: 600, height: 800, channels: 3, background: '#abcdef' } }).png().toBuffer();
  for (const col of ['canaan', 'the_419_script']) {
    await fs.mkdir(path.join(paths.inputRoot, col), { recursive: true });
    await fs.writeFile(path.join(paths.inputRoot, col, 'new.png'), png);
  }
  let release, ready;
  const held = new Promise(resolve => { release = resolve; });
  const started = new Promise(resolve => { ready = resolve; });
  const a = processInputCollection('canaan', paths, { beforeWrite: async () => { ready(); await held; },
    manifestRunner: async () => { throw new Error('inert manifest regeneration failure'); } });
  await started;
  const b = await processInputCollection('the_419_script', paths, { manifestRunner: regenerate });
  assert.equal(b.status, 'processed');
  assert.notEqual(await fs.readFile(paths.manifestPath, 'utf8'), original);
  release();
  assert.equal((await a).status, 'failed');
  assert.equal(await fs.readFile(paths.manifestPath, 'utf8'), original);
  assert.ok(await fs.stat(path.join(paths.mastersRoot, 'the_419_script/1.jpg')));
  assert.ok(await fs.stat(path.join(paths.processedRoot, 'the_419_script/new.png')));
  await assert.rejects(checkManifest({ thumbsRoot: paths.mastersRoot, outFile: paths.manifestPath }), /stale/);
  console.log('AUD-002-010: failed concurrent input restores old manifest over another collection\'s successful archived input; successful asset remains, manifest check fails');
  await regenerate();
  const committedB = await fs.readFile(paths.manifestPath, 'utf8');
  const sequential = await processInputCollection('canaan', paths, { manifestRunner: async () => { throw new Error('inert same failure'); } });
  assert.equal(sequential.status, 'failed');
  assert.equal(await fs.readFile(paths.manifestPath, 'utf8'), committedB);
  await checkManifest({ thumbsRoot: paths.mastersRoot, outFile: paths.manifestPath });
  console.log('Control: the same failure after serialized input preserves the successful manifest and passes freshness check');
} finally {
  const checked = path.resolve(root);
  assert.ok(checked.startsWith(path.resolve(work) + path.sep));
  await fs.rm(checked, { recursive: true, force: true });
}
console.log('Asset assertions passed; real Admin assets/manifests and external services untouched');
