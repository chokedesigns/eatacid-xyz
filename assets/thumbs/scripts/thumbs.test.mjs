import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

import {
  BACKFILL_COLLECTIONS,
  INPUT_COLLECTIONS,
  convertThumbnail,
  isCompliant,
  nextNumericKey,
  retainedMetadataFields,
  runBackfill,
  runInput,
} from './thumbs.mjs';

async function makeFixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'eatacid-thumbs-'));
  const adminRoot = path.join(root, 'admin-ui');
  const paths = {
    repoRoot: root,
    adminRoot,
    inputRoot: path.join(root, 'assets', 'thumbs', 'input'),
    processedRoot: path.join(root, 'assets', 'thumbs', 'processed'),
    reviewRoot: path.join(root, 'assets', 'thumbs', 'review'),
    reportPath: path.join(root, 'assets', 'thumbs', 'backfill-report.json'),
    mastersRoot: path.join(adminRoot, 'src', 'thumbs'),
    manifestPath: path.join(adminRoot, 'src', 'thumbs.manifest.js'),
  };

  await fs.mkdir(path.dirname(paths.reportPath), { recursive: true });
  await fs.mkdir(path.dirname(paths.manifestPath), { recursive: true });
  await fs.writeFile(paths.manifestPath, 'original manifest\n');
  for (const collection of BACKFILL_COLLECTIONS) {
    await fs.mkdir(path.join(paths.mastersRoot, collection), { recursive: true });
    await fs.mkdir(path.join(paths.reviewRoot, collection), { recursive: true });
  }
  for (const collection of INPUT_COLLECTIONS) {
    await fs.mkdir(path.join(paths.inputRoot, collection), { recursive: true });
    await fs.mkdir(path.join(paths.processedRoot, collection), { recursive: true });
  }

  return {
    root,
    paths,
    async cleanup() {
      await fs.rm(root, { recursive: true, force: true });
    },
  };
}

async function image(filePath, {
  width = 400,
  height = 300,
  format = 'png',
  metadata = false,
  colour = { r: 80, g: 120, b: 160, alpha: 1 },
} = {}) {
  let pipeline = sharp({
    create: { width, height, channels: 4, background: colour },
  });
  if (metadata) {
    pipeline = pipeline.withExif({ IFD0: { Artist: 'thumbnail test fixture' } });
  }
  if (format === 'jpeg') pipeline = pipeline.jpeg({ quality: 95 });
  else if (format === 'webp') pipeline = pipeline.webp();
  else pipeline = pipeline.png();
  await pipeline.toFile(filePath);
}

async function bytesByPath(root) {
  const values = new Map();
  for (const collection of BACKFILL_COLLECTIONS) {
    const directory = path.join(root, collection);
    for (const filename of await fs.readdir(directory)) {
      const filePath = path.join(directory, filename);
      values.set(filePath, await fs.readFile(filePath));
    }
  }
  return values;
}

test('shared conversion enforces the canonical output and upscales narrow sources', async (t) => {
  const fixture = await makeFixture();
  t.after(() => fixture.cleanup());
  const wide = path.join(fixture.root, 'wide.png');
  const narrow = path.join(fixture.root, 'narrow.png');
  await image(wide, { width: 400, height: 300 });
  await image(narrow, { width: 100, height: 50 });

  const wideResult = await convertThumbnail(wide);
  const warnings = [];
  const narrowResult = await convertThumbnail(narrow, {
    warn: (message) => warnings.push(message),
  });
  const wideMetadata = await sharp(wideResult.data).metadata();
  const narrowMetadata = await sharp(narrowResult.data).metadata();

  assert.equal(wideMetadata.width, 300);
  assert.equal(wideMetadata.height, 225);
  assert.equal(wideMetadata.format, 'jpeg');
  assert.equal(wideMetadata.space, 'srgb');
  assert.equal(wideMetadata.isProgressive, true);
  assert.deepEqual(retainedMetadataFields(wideMetadata), []);
  assert.equal(isCompliant(wideMetadata), true);
  assert.equal(narrowMetadata.width, 300);
  assert.equal(narrowMetadata.height, 150);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /upscaled/);

  const repeated = await convertThumbnail(wide);
  assert.deepEqual(repeated.data, wideResult.data);
});

test('input mode supports only active collections, safely skips empties, and rejects multiples', async (t) => {
  const fixture = await makeFixture();
  t.after(() => fixture.cleanup());

  assert.deepEqual(INPUT_COLLECTIONS, ['canaan', 'the_419_script']);
  const empty = await runInput(fixture.paths, {
    manifestRunner: async () => assert.fail('manifest should not run for empty inputs'),
  });
  assert.equal(empty.ok, true);
  assert.deepEqual(empty.results.map((result) => result.status), ['skipped', 'skipped']);

  await image(path.join(fixture.paths.inputRoot, 'canaan', 'first.png'));
  await image(path.join(fixture.paths.inputRoot, 'canaan', 'second.jpg'), { format: 'jpeg' });
  await image(path.join(fixture.paths.inputRoot, 'the_419_script', 'valid.png'));
  let manifestCalls = 0;
  const multiple = await runInput(fixture.paths, {
    manifestRunner: async () => {
      manifestCalls += 1;
    },
  });
  assert.equal(multiple.ok, false);
  assert.equal(multiple.results[0].status, 'failed');
  assert.match(multiple.results[0].errors[0], /no more than one/);
  assert.equal(multiple.results[1].status, 'processed');
  assert.equal(manifestCalls, 1);
  assert.deepEqual(await fs.readdir(path.join(fixture.paths.mastersRoot, 'canaan')), []);
  assert.deepEqual(await fs.readdir(path.join(fixture.paths.mastersRoot, 'the_419_script')), [
    '0.jpg',
  ]);
});

test('input mode uses manifest keys and archives only after successful generation', async (t) => {
  const fixture = await makeFixture();
  t.after(() => fixture.cleanup());

  await image(path.join(fixture.paths.mastersRoot, 'canaan', '0.jpg'), { format: 'jpeg' });
  await image(path.join(fixture.paths.mastersRoot, 'canaan', '2_existing.webp'), { format: 'webp' });
  await image(path.join(fixture.paths.inputRoot, 'canaan', 'source art.png'), {
    width: 320,
    height: 160,
  });
  await fs.writeFile(path.join(fixture.paths.processedRoot, 'canaan', 'source art.png'), 'existing');

  let manifestCalls = 0;
  const first = await runInput(fixture.paths, {
    manifestRunner: async () => {
      manifestCalls += 1;
      await fs.access(path.join(fixture.paths.inputRoot, 'canaan', 'source art.png'));
      await fs.writeFile(fixture.paths.manifestPath, 'generated manifest\n');
    },
  });

  assert.equal(first.ok, true);
  assert.equal(first.results[0].status, 'processed');
  assert.equal(first.results[0].key, 3);
  assert.equal(first.results[0].dimensions, '300x150');
  assert.match(first.results[0].sourceArchivePath, /source art-2\.png$/);
  assert.equal(manifestCalls, 1);
  assert.equal((await sharp(path.join(fixture.paths.mastersRoot, 'canaan', '3.jpg')).metadata()).width, 300);
  await assert.rejects(fs.access(path.join(fixture.paths.inputRoot, 'canaan', 'source art.png')));

  const rerun = await runInput(fixture.paths, {
    manifestRunner: async () => assert.fail('processed source must not run again'),
  });
  assert.equal(rerun.ok, true);
  assert.deepEqual(rerun.results.map((result) => result.status), ['skipped', 'skipped']);
  assert.equal((await fs.readdir(path.join(fixture.paths.mastersRoot, 'canaan'))).length, 3);

  assert.equal(nextNumericKey(['0.jpg', '2_existing.webp']), 3);
  assert.throws(() => nextNumericKey(['0.jpg', '0_duplicate.png']), /duplicate manifest keys/);
});

test('input rollback restores the manifest, removes output, and leaves source pending', async (t) => {
  const fixture = await makeFixture();
  t.after(() => fixture.cleanup());

  await image(path.join(fixture.paths.mastersRoot, 'canaan', '0.jpg'), { format: 'jpeg' });
  const sourcePath = path.join(fixture.paths.inputRoot, 'canaan', 'pending.png');
  await image(sourcePath);

  const result = await runInput(fixture.paths, {
    manifestRunner: async () => {
      await fs.writeFile(fixture.paths.manifestPath, 'partial bad manifest\n');
      throw new Error('simulated generator failure');
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.results[0].status, 'failed');
  assert.match(result.results[0].errors[0], /manifest restored/);
  assert.equal(await fs.readFile(fixture.paths.manifestPath, 'utf8'), 'original manifest\n');
  await fs.access(sourcePath);
  await assert.rejects(fs.access(path.join(fixture.paths.mastersRoot, 'canaan', '1.jpg')));
  assert.deepEqual(await fs.readdir(path.join(fixture.paths.processedRoot, 'canaan')), []);

  const collision = await runInput(fixture.paths, {
    manifestRunner: async () => assert.fail('manifest must not run after an overwrite collision'),
    beforeWrite: async ({ outputPath }) => fs.writeFile(outputPath, 'preexisting race winner'),
  });
  assert.equal(collision.ok, false);
  assert.match(collision.results[0].errors[0], /exist/i);
  assert.equal(
    await fs.readFile(path.join(fixture.paths.mastersRoot, 'canaan', '1.jpg'), 'utf8'),
    'preexisting race winner'
  );
  await fs.access(sourcePath);
});

test('backfill audits independently, preserves masters, cleans stale candidates, and reports errors', async (t) => {
  const fixture = await makeFixture();
  t.after(() => fixture.cleanup());

  const compliantSource = path.join(fixture.root, 'compliant-source.png');
  await image(compliantSource, { width: 400, height: 200 });
  const compliant = await convertThumbnail(compliantSource);
  await fs.writeFile(path.join(fixture.paths.mastersRoot, 'canaan', '0.jpg'), compliant.data);
  await image(path.join(fixture.paths.mastersRoot, 'canaan', '1.jpg'), {
    width: 400,
    height: 150,
    format: 'jpeg',
  });
  await image(path.join(fixture.paths.mastersRoot, 'hen', '2.png'), {
    width: 300,
    height: 240,
    format: 'png',
  });
  await image(path.join(fixture.paths.mastersRoot, 'introductions', '3.jpg'), {
    width: 300,
    height: 100,
    format: 'jpeg',
    metadata: true,
  });
  await image(path.join(fixture.paths.mastersRoot, 'the_419_script', '4.jpg'), {
    width: 100,
    height: 100,
    format: 'jpeg',
  });
  await fs.writeFile(path.join(fixture.paths.mastersRoot, 'the_419_script', 'bad.jpg'), 'not an image');
  await fs.writeFile(path.join(fixture.paths.mastersRoot, 'the_419_script', '5.jpg'), 'not an image');
  await image(path.join(fixture.paths.mastersRoot, 'the_419_script', '6.jpg'));
  await image(path.join(fixture.paths.mastersRoot, 'the_419_script', '6_alternate.png'));

  for (const collection of BACKFILL_COLLECTIONS) {
    await fs.writeFile(path.join(fixture.paths.reviewRoot, collection, '99.jpg'), 'stale');
  }
  await fs.writeFile(path.join(fixture.paths.reviewRoot, 'hen', 'notes.txt'), 'preserve me');

  const before = await bytesByPath(fixture.paths.mastersRoot);
  const report = await runBackfill(fixture.paths);
  const after = await bytesByPath(fixture.paths.mastersRoot);

  assert.equal(report.ok, false);
  assert.equal(report.totals.filesScanned, 9);
  assert.equal(report.totals.compliantSkipped, 1);
  assert.equal(report.totals.candidatesGenerated, 4);
  assert.ok(report.errors.length >= 2);
  assert.ok(report.warnings.some((warning) => /upscaled/.test(warning.message)));
  assert.ok(report.warnings.some((warning) => /cannot be decoded/.test(warning.message)));
  assert.ok(report.warnings.some((warning) => /ambiguous/.test(warning.message)));
  assert.ok(report.items.some((item) => item.originalFormat === 'png' && item.candidatePath));
  assert.ok(
    report.items.some(
      (item) => item.originalPath.endsWith(path.join('introductions', '3.jpg')) && item.candidatePath
    )
  );

  for (const [filePath, bytes] of before) assert.deepEqual(after.get(filePath), bytes);
  for (const collection of BACKFILL_COLLECTIONS) {
    await assert.rejects(fs.access(path.join(fixture.paths.reviewRoot, collection, '99.jpg')));
  }
  assert.equal(
    await fs.readFile(path.join(fixture.paths.reviewRoot, 'hen', 'notes.txt'), 'utf8'),
    'preserve me'
  );
  assert.deepEqual(
    (await fs.readdir(path.join(fixture.paths.reviewRoot, 'canaan'))).sort(),
    ['1.jpg']
  );
  assert.deepEqual((await fs.readdir(path.join(fixture.paths.reviewRoot, 'hen'))).sort(), [
    '2.jpg',
    'notes.txt',
  ]);
  assert.deepEqual(await fs.readdir(path.join(fixture.paths.reviewRoot, 'introductions')), ['3.jpg']);
  assert.deepEqual(await fs.readdir(path.join(fixture.paths.reviewRoot, 'the_419_script')), ['4.jpg']);

  const metadataCandidate = await sharp(
    path.join(fixture.paths.reviewRoot, 'introductions', '3.jpg')
  ).metadata();
  assert.equal(metadataCandidate.width, 300);
  assert.equal(metadataCandidate.format, 'jpeg');
  assert.deepEqual(retainedMetadataFields(metadataCandidate), []);
  assert.ok(report.candidateByteSizes.minimum > 0);
  assert.ok(report.candidateByteSizes.maximum >= report.candidateByteSizes.median);
  assert.equal(JSON.parse(await fs.readFile(fixture.paths.reportPath, 'utf8')).totals.filesScanned, 9);
});

test('Windows runners resolve from their own location and preserve visible status', async () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  for (const [filename, command] of [
    ['RUN_INPUT.cmd', 'thumbs:input'],
    ['RUN_BACKFILL.cmd', 'thumbs:backfill'],
  ]) {
    const text = await fs.readFile(path.join(root, filename), 'utf8');
    assert.match(text, /%~dp0/);
    assert.match(text, /pushd "%REPO_ROOT%"/);
    assert.match(text, new RegExp(`npm run ${command}`));
    assert.match(text, /set "THUMBS_EXIT_CODE=%ERRORLEVEL%"/);
    assert.match(text, /pause >nul/);
    assert.match(text, /exit \/b %THUMBS_EXIT_CODE%/);
  }
});