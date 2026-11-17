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
  generateManifest,
  isCompliant,
  nextNumericKey,
  processInputCollection,
  retainedMetadataFields,
  runBackfill,
  runInput,
} from './thumbs.mjs';
import {
  assertCommitted, check, concurrentRollback, concurrentGeneratorRollback, inputWorker, lockPath,
  manifestFixture, pendingImage, regenerate,
} from './thumbs-transaction-fixtures.mjs';

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

async function transactionFixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'eatacid-thumbs-transaction-'));
  t.after(async () => {
    assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir()) + path.sep));
    await fs.rm(root, { recursive: true, force: true });
  });
  return manifestFixture(root);
}

for (const independent of [false, true]) {
  for (const generatorFirst of [false, true]) {
    for (const failure of [false, true]) {
      test(`generator/import coordination (process: ${independent ? 'independent' : 'same'}, generator first: ${generatorFirst}, failure: ${failure})`, { timeout: 30_000 }, async (t) => {
        await concurrentGeneratorRollback(await transactionFixture(t), { independent, generatorFirst, failure });
      });
    }
  }
}

for (const failure of [false, true]) {
  test(`standalone generator ownership blocks an independent input (input failure: ${failure})`, { timeout: 30_000 }, async (t) => {
    const paths = await transactionFixture(t);
    const bytes = await pendingImage(paths, 'canaan');
    const addedMaster = path.join(paths.mastersRoot, 'the_419_script', '1.jpg');
    await fs.copyFile(path.join(paths.mastersRoot, 'the_419_script', '0.jpg'), addedMaster);
    const generator = inputWorker(paths, null, { generator: true, hold: true });
    t.after(() => generator.stop());
    await generator.ready;
    const before = await fs.readFile(paths.manifestPath);
    const owner = await fs.readFile(path.join(lockPath(paths), 'owner.json'));
    const blocked = inputWorker(paths, 'canaan', { lockTimeoutMs: 100 });
    t.after(() => blocked.stop());
    const result = await blocked.done;
    assert.equal(result.status, 'failed');
    assert.match(result.errors.join(' '), /lock is busy/);
    assert.deepEqual(await fs.readFile(paths.manifestPath), before);
    assert.deepEqual(await fs.readFile(path.join(lockPath(paths), 'owner.json')), owner);
    assert.deepEqual(await fs.readdir(path.join(paths.mastersRoot, 'canaan')), ['0.jpg']);
    const input = inputWorker(paths, 'canaan', { failure });
    t.after(() => input.stop());
    await input.started;
    generator.release();
    assert.equal((await generator.done).status, 'generated');
    const completed = await input.done;
    if (failure) {
      assert.equal(completed.status, 'failed');
      assert.match(completed.errors.join(' '), /manifest restored/);
      assert.deepEqual(await fs.readFile(path.join(paths.inputRoot, 'canaan', 'new.png')), bytes);
      assert.deepEqual(await fs.readdir(path.join(paths.mastersRoot, 'canaan')), ['0.jpg']);
    } else {
      await assertCommitted(paths, 'canaan', completed, bytes);
    }
    assert.match(await fs.readFile(paths.manifestPath, 'utf8'), /the_419_script\/1\.jpg/);
    await check(paths);
    await assert.rejects(fs.access(lockPath(paths)), { code: 'ENOENT' });
  });
}

for (const successFirst of [false, true]) {
  test(`same-process overlap preserves the successful import (success first: ${successFirst})`, { timeout: 30_000 }, async (t) => {
    await concurrentRollback(await transactionFixture(t), successFirst);
  });

  test(`independent-process overlap preserves committed work (success first: ${successFirst})`, { timeout: 30_000 }, async (t) => {
    const paths = await transactionFixture(t);
    await pendingImage(paths, 'canaan');
    const bytes = await pendingImage(paths, 'the_419_script');
    const owner = inputWorker(paths, successFirst ? 'the_419_script' : 'canaan', { hold: true, failure: !successFirst });
    t.after(() => owner.stop());
    await owner.ready;
    const contender = inputWorker(paths, successFirst ? 'canaan' : 'the_419_script', { failure: successFirst });
    t.after(() => contender.stop());
    await contender.started;
    // A distinct Node process must time out without touching the held transaction.
    const blocked = inputWorker(paths, 'canaan', { lockTimeoutMs: 100 });
    t.after(() => blocked.stop());
    const contention = await blocked.done;
    assert.equal(contention.status, 'failed');
    assert.match(contention.errors.join(' '), /lock is busy/);
    owner.release();
    const results = await Promise.all([owner.done, contender.done]);
    const [success, failure] = successFirst ? results : results.reverse();
    assert.equal(failure.status, 'failed');
    assert.match(failure.errors.join(' '), /manifest restored/);
    await assertCommitted(paths, 'the_419_script', success, bytes);
    assert.deepEqual(await fs.readdir(path.join(paths.mastersRoot, 'canaan')), ['0.jpg']);
    await assert.rejects(fs.access(lockPath(paths)), { code: 'ENOENT' });
  });
}

test('same-collection processes serialize key selection and sequential imports still work', { timeout: 30_000 }, async (t) => {
  const paths = await transactionFixture(t);
  const bytes = await pendingImage(paths, 'canaan');
  const original = await fs.readFile(path.join(paths.mastersRoot, 'canaan', '0.jpg'));
  const contenderPaths = {
    ...paths, inputRoot: path.join(paths.repoRoot, 'second-input'),
    processedRoot: path.join(paths.repoRoot, 'second-processed'),
  };
  const secondBytes = await pendingImage(contenderPaths, 'canaan');
  const owner = inputWorker(paths, 'canaan', { hold: true });
  t.after(() => owner.stop());
  await owner.ready;
  const contender = inputWorker(contenderPaths, 'canaan');
  t.after(() => contender.stop());
  await contender.started;
  const blocked = inputWorker(paths, 'canaan', { lockTimeoutMs: 100 });
  t.after(() => blocked.stop());
  assert.equal((await blocked.done).status, 'failed');
  owner.release();
  const [first, second] = await Promise.all([owner.done, contender.done]);
  assert.equal(first.key, 1);
  assert.equal(second.key, 2);
  await assertCommitted(paths, 'canaan', first, bytes);
  await assertCommitted(contenderPaths, 'canaan', second, secondBytes);
  const committed = await fs.readFile(first.thumbnailPath);
  await pendingImage(paths, 'canaan');
  // Default runner invokes the actual generator under the existing transaction capability.
  const sequential = await processInputCollection('canaan', paths);
  assert.equal(sequential.key, 3);
  await assertCommitted(paths, 'canaan', sequential, bytes);
  assert.match(sequential.sourceArchivePath, /new-2\.png$/);
  assert.deepEqual(await fs.readFile(first.thumbnailPath), committed);
  assert.deepEqual(await fs.readFile(path.join(paths.mastersRoot, 'canaan', '0.jpg')), original);
  assert.deepEqual(await fs.readdir(path.join(paths.mastersRoot, 'canaan')), ['0.jpg', '1.jpg', '2.jpg', '3.jpg']);
  // Preserve the standalone exported helper's normal npm workflow as well.
  const manifest = await fs.readFile(paths.manifestPath);
  await generateManifest(paths.adminRoot);
  assert.deepEqual(await fs.readFile(paths.manifestPath), manifest);
  await check(paths);
});

test('manifest and archive failures preserve committed bytes and release the lock', { timeout: 30_000 }, async (t) => {
  const paths = await transactionFixture(t);
  const bytes = await pendingImage(paths, 'the_419_script');
  const committed = await processInputCollection('the_419_script', paths, { manifestRunner: (_adminRoot, options) => regenerate(paths, options) });
  await assertCommitted(paths, 'the_419_script', committed, bytes);
  const manifest = await fs.readFile(paths.manifestPath);
  const master = await fs.readFile(committed.thumbnailPath);
  await pendingImage(paths, 'canaan');
  for (const failure of ['manifest', 'archive']) {
    const result = await processInputCollection('canaan', paths, {
      manifestRunner: async (_adminRoot, options) => {
        await regenerate(paths, options);
        if (failure === 'manifest') throw new Error('inert manifest failure after writing');
        // The chosen archive destination becomes occupied after allocation.
        await fs.writeFile(path.join(paths.processedRoot, 'canaan', 'new.png'), 'unowned archive collision');
      },
    });
    assert.equal(result.status, 'failed');
    assert.match(result.errors.join(' '), /manifest restored/);
    assert.deepEqual(await fs.readFile(paths.manifestPath), manifest);
    assert.deepEqual(await fs.readFile(committed.thumbnailPath), master);
    assert.deepEqual(await fs.readFile(committed.sourceArchivePath), bytes);
    assert.deepEqual(await fs.readdir(path.join(paths.mastersRoot, 'canaan')), ['0.jpg']);
    await fs.access(path.join(paths.inputRoot, 'canaan', 'new.png'));
    await check(paths);
    await assert.rejects(fs.access(lockPath(paths)), { code: 'ENOENT' });
  }
  assert.equal(await fs.readFile(path.join(paths.processedRoot, 'canaan', 'new.png'), 'utf8'), 'unowned archive collision');
});

test('foreign or malformed lock ownership is never removed, and ownership loss blocks writes', { timeout: 30_000 }, async (t) => {
  const paths = await transactionFixture(t);
  await pendingImage(paths, 'canaan');
  const manifest = await fs.readFile(paths.manifestPath);
  await fs.mkdir(lockPath(paths));
  const ownerPath = path.join(lockPath(paths), 'owner.json');
  for (const owner of ['not JSON', JSON.stringify({ pid: 99999999, startedAt: '1970-01-01', token: 'foreign' })]) {
    await fs.writeFile(ownerPath, owner);
    const result = await processInputCollection('canaan', paths, { lockTimeoutMs: 50 });
    assert.equal(result.status, 'failed');
    assert.match(result.errors.join(' '), /lock is busy/);
    assert.equal(await fs.readFile(ownerPath, 'utf8'), owner);
    assert.deepEqual(await fs.readFile(paths.manifestPath), manifest);
  }
  // Remove only this test's fabricated lock, then replace the acquired token.
  await fs.unlink(ownerPath);
  await fs.rmdir(lockPath(paths));
  const result = await processInputCollection('canaan', paths, {
    beforeWrite: () => fs.writeFile(ownerPath, 'replacement owner'),
  });
  assert.equal(result.status, 'failed');
  assert.match(result.errors.join(' '), /ownership is uncertain/);
  assert.equal(await fs.readFile(ownerPath, 'utf8'), 'replacement owner');
  assert.deepEqual(await fs.readFile(paths.manifestPath), manifest);
  assert.deepEqual(await fs.readdir(path.join(paths.mastersRoot, 'canaan')), ['0.jpg']);
  await check(paths);
});

test('archive unlink failure cleans only its owned copy; uncertain cleanup retains the lock', { timeout: 30_000 }, async (t) => {
  const paths = await transactionFixture(t);
  const committedBytes = await pendingImage(paths, 'the_419_script');
  const committed = await processInputCollection('the_419_script', paths, { manifestRunner: (_adminRoot, options) => regenerate(paths, options) });
  await assertCommitted(paths, 'the_419_script', committed, committedBytes);
  const manifest = await fs.readFile(paths.manifestPath);
  await pendingImage(paths, 'canaan');
  const sourcePath = path.join(paths.inputRoot, 'canaan', 'new.png');
  const archivePath = path.join(paths.processedRoot, 'canaan', 'new.png');
  const unlink = fs.unlink;
  const rm = fs.rm;
  t.mock.method(fs, 'unlink', async (filePath) => {
    if (filePath === sourcePath) throw new Error('inert source unlink failure');
    return unlink(filePath);
  });
  const recovered = await processInputCollection('canaan', paths, { manifestRunner: (_adminRoot, options) => regenerate(paths, options) });
  assert.equal(recovered.status, 'failed');
  assert.match(recovered.errors.join(' '), /manifest restored/);
  await assert.rejects(fs.access(archivePath), { code: 'ENOENT' });
  await assert.rejects(fs.access(lockPath(paths)), { code: 'ENOENT' });
  await check(paths);
  t.mock.method(fs, 'rm', async (filePath, options) => {
    if (filePath === archivePath) throw new Error('inert archive cleanup failure');
    return rm(filePath, options);
  });
  const uncertain = await processInputCollection('canaan', paths, { manifestRunner: (_adminRoot, options) => regenerate(paths, options) });
  t.mock.restoreAll();
  assert.equal(uncertain.status, 'failed');
  assert.match(uncertain.errors.join(' '), /lock retained for manual review/);
  await fs.access(sourcePath);
  await fs.access(archivePath);
  assert.deepEqual(await fs.readFile(paths.manifestPath), manifest);
  assert.deepEqual(await fs.readFile(committed.sourceArchivePath), committedBytes);
  await check(paths);
  const blocked = await processInputCollection('canaan', paths, { lockTimeoutMs: 50 });
  assert.match(blocked.errors.join(' '), /lock is busy/);
});

test('lost ownership after generation cannot roll back or release a replacement lock', { timeout: 30_000 }, async (t) => {
  const paths = await transactionFixture(t);
  await pendingImage(paths, 'canaan');
  let manifest;
  const result = await processInputCollection('canaan', paths, {
    manifestRunner: async (_adminRoot, options) => {
      await regenerate(paths, options);
      manifest = await fs.readFile(paths.manifestPath);
      await fs.writeFile(path.join(lockPath(paths), 'owner.json'), 'replacement owner');
      throw new Error('inert failure after ownership loss');
    },
  });
  assert.equal(result.status, 'failed');
  assert.match(result.errors.join(' '), /rollback failed.*ownership is uncertain/);
  assert.match(result.errors.join(' '), /lock retained for manual review/);
  assert.deepEqual(await fs.readFile(paths.manifestPath), manifest);
  await fs.access(path.join(paths.mastersRoot, 'canaan', '1.jpg'));
  await fs.access(path.join(paths.inputRoot, 'canaan', 'new.png'));
  assert.equal(await fs.readFile(path.join(lockPath(paths), 'owner.json'), 'utf8'), 'replacement owner');
});

test('interrupted post-generation owner leaves a blocking lock and uncommitted state untouched', { timeout: 30_000 }, async (t) => {
  const paths = await transactionFixture(t);
  await pendingImage(paths, 'canaan');
  const owner = inputWorker(paths, 'canaan', { holdAfterGenerate: true });
  t.after(() => owner.stop());
  await owner.ready;
  const ownerBytes = await fs.readFile(path.join(lockPath(paths), 'owner.json'));
  const manifest = await fs.readFile(paths.manifestPath);
  const master = await fs.readFile(path.join(paths.mastersRoot, 'canaan', '1.jpg'));
  await owner.stop();
  const result = await processInputCollection('canaan', paths, { lockTimeoutMs: 100 });
  assert.equal(result.status, 'failed');
  assert.match(result.errors.join(' '), /interrupted transaction requires manual review/);
  await assert.rejects(regenerate(paths, { lockTimeoutMs: 100 }), /interrupted transaction requires manual review/);
  assert.deepEqual(await fs.readFile(path.join(lockPath(paths), 'owner.json')), ownerBytes);
  assert.deepEqual(await fs.readFile(paths.manifestPath), manifest);
  assert.deepEqual(await fs.readFile(path.join(paths.mastersRoot, 'canaan', '1.jpg')), master);
  await fs.access(path.join(paths.inputRoot, 'canaan', 'new.png'));
  assert.deepEqual(await fs.readdir(path.join(paths.processedRoot, 'canaan')), []);
});

test('incomplete rollback retains the lock and blocks subsequent imports', { timeout: 30_000 }, async (t) => {
  const paths = await transactionFixture(t);
  await pendingImage(paths, 'canaan');
  const result = await processInputCollection('canaan', paths, {
    manifestRunner: async () => {
      await fs.unlink(paths.manifestPath);
      await fs.mkdir(paths.manifestPath);
      throw new Error('inert unusable manifest destination');
    },
  });
  assert.equal(result.status, 'failed');
  assert.match(result.errors.join(' '), /rollback failed/);
  assert.match(result.errors.join(' '), /lock retained for manual review/);
  const blocked = await processInputCollection('canaan', paths, { lockTimeoutMs: 50 });
  assert.equal(blocked.status, 'failed');
  assert.match(blocked.errors.join(' '), /lock is busy/);
});
