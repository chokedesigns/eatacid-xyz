// Disposable regression fixtures; never uses defaultPaths() or operational assets.
import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { buildManifestModel, checkManifest } from '../../../admin-ui/scripts/gen-thumbs-manifest.mjs';
import { processInputCollection } from './thumbs.mjs';

export async function manifestFixture(root) {
  const paths = {
    repoRoot: root, adminRoot: root, inputRoot: path.join(root, 'input'),
    processedRoot: path.join(root, 'processed'), mastersRoot: path.join(root, 'thumbs'),
    manifestPath: path.join(root, 'manifest.mjs'),
  };
  const jpeg = await sharp({ create: { width: 300, height: 400, channels: 3, background: '#345678' } }).jpeg().toBuffer();
  for (const collection of ['acid_coin', 'canaan', 'hen', 'introductions', 'the_419_script', 'undefined']) {
    await fs.mkdir(path.join(paths.mastersRoot, collection), { recursive: true });
    await fs.writeFile(path.join(paths.mastersRoot, collection, collection === 'undefined' ? 'undefined.jpg' : '0.jpg'), jpeg);
  }
  // Exercise generateManifest()'s real npm subprocess path without targeting Admin.
  const generatorUrl = new URL('../../../admin-ui/scripts/gen-thumbs-manifest.mjs', import.meta.url).href;
  await fs.writeFile(path.join(root, 'generate.mjs'),
    `import { run } from ${JSON.stringify(generatorUrl)};\nawait run(${JSON.stringify({ thumbsRoot: paths.mastersRoot, outFile: paths.manifestPath })});\n`);
  await fs.writeFile(path.join(root, 'package.json'), JSON.stringify({ scripts: { 'gen:thumbs': 'node generate.mjs' } }));
  await regenerate(paths);
  return paths;
}

export async function regenerate(paths) {
  await fs.writeFile(paths.manifestPath, buildManifestModel({ thumbsRoot: paths.mastersRoot }).content);
}

export function check(paths) {
  return checkManifest({ thumbsRoot: paths.mastersRoot, outFile: paths.manifestPath });
}

export function lockPath(paths) {
  return path.join(path.dirname(paths.manifestPath), `.${path.basename(paths.manifestPath)}.input.lock`);
}

export async function pendingImage(paths, collection, name = 'new.png') {
  const directory = path.join(paths.inputRoot, collection);
  await fs.mkdir(directory, { recursive: true });
  const bytes = await sharp({ create: { width: 600, height: 800, channels: 3, background: '#abcdef' } }).png().toBuffer();
  await fs.writeFile(path.join(directory, name), bytes);
  return bytes;
}

export function gate() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

export async function assertCommitted(paths, collection, result, sourceBytes) {
  assert.equal(result.status, 'processed', JSON.stringify(result));
  assert.equal((await sharp(result.thumbnailPath).metadata()).width, 300);
  assert.deepEqual(await fs.readFile(result.sourceArchivePath), sourceBytes);
  await assert.rejects(fs.access(path.join(paths.inputRoot, collection, 'new.png')), { code: 'ENOENT' });
  assert.match(await fs.readFile(paths.manifestPath, 'utf8'), new RegExp(`${collection}/${result.key}\\.jpg`));
  await check(paths);
}

// Hold the first owner, start the contender, then release before awaiting it.
// Awaiting the contender while holding the owner deadlocks a serialized writer.
export async function concurrentRollback(paths, successFirst) {
  const sourceBytes = await pendingImage(paths, 'the_419_script');
  await pendingImage(paths, 'canaan');
  const held = gate();
  const ready = gate();
  const fail = async () => {
    await regenerate(paths); // Failure after an actual manifest write.
    throw new Error('inert manifest regeneration failure');
  };
  const firstCollection = successFirst ? 'the_419_script' : 'canaan';
  const first = processInputCollection(firstCollection, paths, {
    beforeWrite: async () => { ready.resolve(); await held.promise; },
    manifestRunner: successFirst ? () => regenerate(paths) : fail,
  });
  await Promise.race([
    ready.promise,
    first.then((result) => { throw new Error(`Owner did not reach the hold point: ${JSON.stringify(result)}`); }),
  ]);
  const second = processInputCollection(successFirst ? 'canaan' : 'the_419_script', paths, {
    manifestRunner: successFirst ? fail : () => regenerate(paths),
  });
  let blocked;
  try {
    // Keep the owner held until a third concurrent call proves bounded contention.
    // This also makes the regression reject the original uncoordinated writer.
    blocked = await processInputCollection('the_419_script', paths, {
      lockTimeoutMs: 100, manifestRunner: () => regenerate(paths),
    });
  } finally {
    held.resolve();
  }
  const results = await Promise.all([first, second]);
  assert.equal(blocked.status, 'failed');
  assert.match(blocked.errors.join(' '), /lock is busy/);
  const [success, failure] = successFirst ? results : results.reverse();
  assert.equal(failure.status, 'failed');
  assert.match(failure.errors.join(' '), /manifest restored/);
  assert.equal(success.key, 1);
  await assertCommitted(paths, 'the_419_script', success, sourceBytes);
  await fs.access(path.join(paths.inputRoot, 'canaan', 'new.png'));
  assert.deepEqual(await fs.readdir(path.join(paths.mastersRoot, 'canaan')), ['0.jpg']);
  await assert.rejects(fs.access(lockPath(paths)), { code: 'ENOENT' });
}

export function inputWorker(paths, collection, { hold = false, failure = false, lockTimeoutMs = 5_000, holdAfterGenerate = false } = {}) {
  const child = fork(fileURLToPath(import.meta.url), ['--worker', JSON.stringify({ paths, collection, hold, failure, lockTimeoutMs, holdAfterGenerate })], {
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
  });
  let output = '';
  child.stdout.on('data', (data) => { output += data; });
  child.stderr.on('data', (data) => { output += data; });
  const ready = gate();
  const started = gate();
  let result;
  child.on('message', (message) => {
    if (message.ready) ready.resolve();
    if (message.started) started.resolve();
    if (message.result) result = message.result;
  });
  const exited = new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('exit', (code, signal) => { ready.resolve(); started.resolve(); resolve({ code, signal }); });
  });
  return {
    child, ready: ready.promise, started: started.promise, exited,
    get done() {
      return exited.then(({ code }) => {
        assert.equal(code, 0, output);
        assert.ok(result, 'worker must report its transaction result');
        return result;
      });
    },
    release() { child.send('release'); },
    async stop() { if (child.exitCode == null && child.signalCode == null) child.kill('SIGKILL'); await exited; },
  };
}

if (process.argv[2] === '--worker') {
  const { paths, collection, hold, failure, lockTimeoutMs, holdAfterGenerate } = JSON.parse(process.argv[3]);
  const released = gate();
  process.on('message', (message) => { if (message === 'release') released.resolve(); });
  const wait = async () => { process.send({ ready: true }); await released.promise; };
  const transaction = processInputCollection(collection, paths, {
    lockTimeoutMs,
    beforeWrite: hold && !holdAfterGenerate ? wait : undefined,
    manifestRunner: async () => {
      await regenerate(paths);
      if (holdAfterGenerate) await wait();
      if (failure) throw new Error('inert worker manifest failure');
    },
  });
  process.send({ started: true });
  const result = await transaction;
  process.send({ result }, () => process.disconnect());
}
