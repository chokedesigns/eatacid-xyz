// Disposable regression fixtures; never uses defaultPaths() or operational assets.
import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { run as generateManifest, checkManifest } from '../../../admin-ui/scripts/gen-thumbs-manifest.mjs';
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
  // Exercise standalone npm generation without targeting Admin.
  const generatorUrl = new URL('../../../admin-ui/scripts/gen-thumbs-manifest.mjs', import.meta.url).href;
  await fs.writeFile(path.join(root, 'generate.mjs'),
    `import { run } from ${JSON.stringify(generatorUrl)};\nawait run(${JSON.stringify({ thumbsRoot: paths.mastersRoot, outFile: paths.manifestPath })});\n`);
  await fs.writeFile(path.join(root, 'package.json'), JSON.stringify({ scripts: { 'gen:thumbs': 'node generate.mjs' } }));
  await regenerate(paths);
  return paths;
}

export async function regenerate(paths, options = {}) {
  return generateManifest({ log: () => {}, ...options, thumbsRoot: paths.mastersRoot, outFile: paths.manifestPath });
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
  const fail = async (_adminRoot, options) => {
    await regenerate(paths, options); // Failure after an actual manifest write.
    throw new Error('inert manifest regeneration failure');
  };
  const firstCollection = successFirst ? 'the_419_script' : 'canaan';
  const first = processInputCollection(firstCollection, paths, {
    beforeWrite: async () => { ready.resolve(); await held.promise; },
    manifestRunner: successFirst ? (_adminRoot, options) => regenerate(paths, options) : fail,
  });
  await Promise.race([
    ready.promise,
    first.then((result) => { throw new Error(`Owner did not reach the hold point: ${JSON.stringify(result)}`); }),
  ]);
  const second = processInputCollection(successFirst ? 'canaan' : 'the_419_script', paths, {
    manifestRunner: successFirst ? fail : (_adminRoot, options) => regenerate(paths, options),
  });
  let blocked;
  try {
    // Keep the owner held until a third concurrent call proves bounded contention.
    // This also makes the regression reject the original uncoordinated writer.
    blocked = await processInputCollection('the_419_script', paths, {
      lockTimeoutMs: 100, manifestRunner: (_adminRoot, options) => regenerate(paths, options),
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

export async function concurrentGeneratorRollback(paths, { independent = false, generatorFirst = false, failure = true } = {}) {
  const sourceBytes = await pendingImage(paths, 'canaan');
  const addedMaster = path.join(paths.mastersRoot, 'the_419_script', '1.jpg');
  const held = gate();
  const ready = gate();
  const addMaster = () => fs.copyFile(path.join(paths.mastersRoot, 'the_419_script', '0.jpg'), addedMaster);
  if (generatorFirst) {
    await addMaster();
    if (independent) assert.equal((await inputWorker(paths, null, { generator: true }).done).status, 'generated');
    else await regenerate(paths);
  }
  const before = await fs.readFile(paths.manifestPath);
  const input = processInputCollection('canaan', paths, {
    beforeWrite: async () => { ready.resolve(); await held.promise; },
    manifestRunner: async (_adminRoot, options) => {
      await regenerate(paths, options);
      if (failure) throw new Error('inert input failure after generation');
    },
  });
  let direct;
  let worker;
  try {
    await Promise.race([ready.promise, input.then((result) => { throw new Error(JSON.stringify(result)); })]);
    if (!generatorFirst) await addMaster();
    // Prove bounded contention before allowing the import to finish.
    if (independent) {
      const blocked = await inputWorker(paths, null, { generator: true, lockTimeoutMs: 100 }).done;
      assert.equal(blocked.status, 'failed');
      assert.match(blocked.errors.join(' '), /lock is busy/);
      worker = inputWorker(paths, null, { generator: true });
      await worker.started;
      direct = worker.done;
    } else {
      await assert.rejects(regenerate(paths, { lockTimeoutMs: 100 }), /lock is busy/);
      direct = regenerate(paths);
    }
    assert.deepEqual(await fs.readFile(paths.manifestPath), before);
  } finally {
    held.resolve();
  }
  try {
    const [result, generated] = await Promise.all([input, direct]);
    if (independent) assert.equal(generated.status, 'generated', JSON.stringify(generated));
    if (failure) {
      assert.equal(result.status, 'failed');
      assert.match(result.errors.join(' '), /manifest restored/);
      await fs.access(path.join(paths.inputRoot, 'canaan', 'new.png'));
      assert.deepEqual(await fs.readdir(path.join(paths.mastersRoot, 'canaan')), ['0.jpg']);
    } else {
      await assertCommitted(paths, 'canaan', result, sourceBytes);
    }
    await fs.access(addedMaster);
    assert.match(await fs.readFile(paths.manifestPath, 'utf8'), /the_419_script\/1\.jpg/);
    await check(paths);
    await assert.rejects(fs.access(lockPath(paths)), { code: 'ENOENT' });
  } finally {
    await worker?.stop();
  }
}

export function inputWorker(paths, collection, { hold = false, failure = false, lockTimeoutMs = 5_000, holdAfterGenerate = false, generator = false } = {}) {
  const child = fork(fileURLToPath(import.meta.url), ['--worker', JSON.stringify({ paths, collection, hold, failure, lockTimeoutMs, holdAfterGenerate, generator })], {
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
  const { paths, collection, hold, failure, lockTimeoutMs, holdAfterGenerate, generator } = JSON.parse(process.argv[3]);
  const released = gate();
  process.on('message', (message) => { if (message === 'release') released.resolve(); });
  const wait = async () => { process.send({ ready: true }); await released.promise; };
  // Test-only pause after the real standalone writer acquires its lock. No
  // production bypass or ownership delegation is involved in this hold point.
  if (generator && hold) {
    const readFile = fs.readFile;
    fs.readFile = async (file, ...args) => {
      if (file === path.join(lockPath(paths), 'owner.json')) {
        fs.readFile = readFile;
        await wait();
      }
      return readFile(file, ...args);
    };
  }
  const transaction = generator ? regenerate(paths, { lockTimeoutMs }).then(
    () => ({ status: 'generated' }),
    (error) => ({ status: 'failed', errors: [error.message] })
  ) : processInputCollection(collection, paths, {
    lockTimeoutMs,
    beforeWrite: hold && !holdAfterGenerate ? wait : undefined,
    manifestRunner: async (_adminRoot, options) => {
      await regenerate(paths, options);
      if (holdAfterGenerate) await wait();
      if (failure) throw new Error('inert worker manifest failure');
    },
  });
  process.send({ started: true });
  const result = await transaction;
  process.send({ result }, () => process.disconnect());
}
