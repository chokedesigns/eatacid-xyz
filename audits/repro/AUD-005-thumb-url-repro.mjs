import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { run, checkManifest } from '../../admin-ui/scripts/gen-thumbs-manifest.mjs';
import { chainRegistry } from '../../shared/chain-registry.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const work = path.join(root, 'audits/work');
await mkdir(work, { recursive: true });
const fixture = await mkdtemp(path.join(work, 'AUD-005-thumb-url-'));
assert.equal(path.dirname(fixture), work);
try {
  const thumbsRoot = path.join(fixture, 'src/thumbs');
  const outFile = path.join(fixture, 'src/thumbs.manifest.js');
  await cp(path.join(root, 'admin-ui/src/thumbs'), thumbsRoot, { recursive: true });
  await writeFile(path.join(fixture, 'package.json'), '{"type":"module"}');
  let previous = '29.jpg';
  for (const [filename, valid] of [['29.jpg', true], ["29_artist's.jpg", true], ['29_artist#proof.jpg', false], ['29_artist%20proof.jpg', false]]) {
    if (filename !== previous) await rename(path.join(thumbsRoot, 'canaan', previous), path.join(thumbsRoot, 'canaan', filename));
    previous = filename;
    await run({ thumbsRoot, outFile, log() {} });
    const manifest = (await import(`${pathToFileURL(outFile).href}?probe=${encodeURIComponent(filename)}`)).default;
    const actualPath = fileURLToPath(manifest[chainRegistry.testnet.collections.CANAAN]['29']);
    const expectedPath = path.join(thumbsRoot, 'canaan', filename);
    if (valid) {
      assert.equal(actualPath, expectedPath);
      await checkManifest({ thumbsRoot, outFile });
    } else {
      assert.notEqual(actualPath, expectedPath);
      await assert.rejects(checkManifest({ thumbsRoot, outFile }), /manifest is stale/);
    }
    console.log(JSON.stringify({ filename, generator: 'success', correctAsset: actualPath === expectedPath, checker: valid ? 'passes' : 'rejects' }));
  }
} finally {
  const relative = path.relative(work, fixture);
  assert.ok(relative && !relative.startsWith('..') && !path.isAbsolute(relative));
  await rm(fixture, { recursive: true, force: true });
}
