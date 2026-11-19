import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { run, checkManifest } from '../../admin-ui/scripts/gen-thumbs-manifest.mjs';

// Current generator and checker, with disposable copies of the actual assets.
// A numeric-prefix suffix is explicitly supported by getFolderRows/tokenIdOf.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const work = path.join(root, 'audits/work');
await mkdir(work, { recursive: true });
const fixture = await mkdtemp(path.join(work, 'AUD-004-thumb-name-'));
assert.equal(path.dirname(fixture), work);
try {
  const src = path.join(fixture, 'src');
  const thumbsRoot = path.join(src, 'thumbs');
  const outFile = path.join(src, 'thumbs.manifest.js');
  await cp(path.join(root, 'admin-ui/src/thumbs'), thumbsRoot, { recursive: true });
  await writeFile(path.join(fixture, 'package.json'), '{"type":"module"}');
  await run({ thumbsRoot, outFile, log() {} });
  await checkManifest({ thumbsRoot, outFile });
  console.log('Valid ordinary-filename control: generation and import/freshness check pass');
  await rename(path.join(thumbsRoot, 'canaan/29.jpg'), path.join(thumbsRoot, "canaan/29_artist's.jpg"));
  await run({ thumbsRoot, outFile, log() {} }); // reports success, replaces manifest
  await assert.rejects(checkManifest({ thumbsRoot, outFile }), /cannot be loaded/);
  console.log('Supported apostrophe suffix: generator succeeds, emitted JavaScript cannot be imported');
} finally {
  const rel = path.relative(work, fixture);
  assert.ok(rel && !rel.startsWith('..') && !path.isAbsolute(rel));
  await rm(fixture, { recursive: true, force: true });
}
