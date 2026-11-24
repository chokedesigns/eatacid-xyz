import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { syncBuiltinESMExports } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Execute unchanged source in an isolated copy; never use operational locks/files.
const repo = fileURLToPath(new URL('../../', import.meta.url));
const work = path.join(repo, 'audits/work');
await fs.mkdir(work, { recursive: true });
const root = await fs.mkdtemp(path.join(work, 'AUD-009-lock-'));
const originalOpen = fs.open;
const originalUUID = crypto.randomUUID;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const deferred = () => {
  let resolve;
  const promise = new Promise(r => { resolve = r; });
  return { promise, resolve };
};
let a, b;
try {
  await fs.mkdir(path.join(root, 'shared/drop-params'), { recursive: true });
  await fs.writeFile(path.join(root, 'package.json'), '{"type":"module"}\n');
  for (const name of ['shared/chain-registry.js', 'shared/network.js',
    'shared/drop-time.js', 'shared/public-drop-compatibility.js',
    ...['authoring', 'archive', 'projector', 'recovery'].map(n => `shared/drop-params/drop-params-${n}.mjs`)]) {
    await fs.copyFile(path.join(repo, name), path.join(root, name));
  }
  const p = await import(pathToFileURL(path.join(root, 'shared/drop-params/drop-params-projector.mjs')));
  // Positive controls: ordinary contenders exclude each other; a live complete
  // owner remains protected even with zero invalid-metadata grace.
  a = await p.acquireDropParamsLock();
  assert.equal(await p.reclaimStaleDropParamsLock(await p.inspectDropParamsLock({ invalidLockGraceMs: 0 })), false);
  await assert.rejects(p.acquireDropParamsLock({ timeoutMs: 50, retryMs: 5 }), /Timed out/);
  await a.release(); a = null;
  assert.equal((await p.inspectDropParamsLock()).state, 'unlocked');

  const created = deferred(), resume = deferred();
  const aToken = '00000000-0000-4000-8000-000000000001';
  const bToken = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
  const tokens = [aToken, bToken];
  crypto.randomUUID = () => tokens.shift() || originalUUID();
  const aPath = path.join(p.DROP_PARAMS_PATHS.transactionLock, `claim-${aToken}.json`);
  fs.open = async function(file, flags, ...args) {
    const handle = await originalOpen(file, flags, ...args);
    if (file === aPath && flags === 'wx') {
      created.resolve();
      await resume.promise; // Scheduler/I/O delay between creation and metadata write.
    }
    return handle;
  };
  syncBuiltinESMExports();
  const acquiringA = p.acquireDropParamsLock({ timeoutMs: 15000, retryMs: 5 });
  await created.promise;
  await delay(5100); // Exercise the production default 5000 ms grace, not a reduced option.
  const stale = await p.inspectDropParamsLock();
  assert.equal(stale.state, 'stale');
  assert.equal(stale.reason, 'invalid-metadata');
  assert.equal(stale.metadata, null);
  let reclaimedLiveWaiting = false;
  const acquiringB = p.acquireDropParamsLock({ timeoutMs: 15000, retryMs: 5,
    testHooks: { beforeReclaim: async ({ claimPath }) => {
      assert.equal(claimPath, aPath);
      resume.resolve();
      const until = Date.now() + 2000;
      while (true) {
        let row;
        try { row = JSON.parse(await fs.readFile(aPath, 'utf8')); }
        catch (error) {
          // A's metadata may still be absent or partially written in this window.
          if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error;
        }
        if (row?.phase === 'waiting') {
          assert.equal(row.pid, process.pid);
          assert.equal(row.ticket, 1);
          reclaimedLiveWaiting = true;
          break;
        }
        assert.ok(Date.now() < until, 'A did not publish its supported waiting claim');
        await delay(2);
      }
      // This await schedules the same read/unlink gap as an interrupted native
      // filesystem call. B now unlinks the revived claim without revalidating it.
    } },
  });
  b = await acquiringB;
  a = await acquiringA;
  assert.equal(reclaimedLiveWaiting, true);
  assert.equal(a.metadata.ticket, b.metadata.ticket);
  assert.equal(a.metadata.phase, 'owned');
  assert.equal(b.metadata.phase, 'owned');
  const claims = await fs.readdir(p.DROP_PARAMS_PATHS.transactionLock);
  assert.ok(claims.includes(`claim-${aToken}.json`), 'A republishes owned after its waiting claim was removed');
  assert.ok(claims.includes(`claim-${bToken}.json`));
  console.log('CONFIRMED: two supported acquireDropParamsLock calls simultaneously own the critical section; controls pass.');
} finally {
  fs.open = originalOpen;
  crypto.randomUUID = originalUUID;
  syncBuiltinESMExports();
  if (a) await a.release();
  if (b) await b.release();
  assert.ok(path.resolve(root).startsWith(path.resolve(work) + path.sep));
  await fs.rm(root, { recursive: true, force: true });
}
