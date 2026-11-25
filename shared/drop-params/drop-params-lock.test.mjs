import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import { syncBuiltinESMExports } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const repo = fileURLToPath(new URL("../../", import.meta.url));
const work = path.join(repo, "audits/work");
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
function latch() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}
async function until(predicate, label) {
  const deadline = Date.now() + 5_000;
  while (!await predicate()) {
    assert.ok(Date.now() < deadline, label);
    await delay(5);
  }
}

async function fixture(t) {
  await fs.mkdir(work, { recursive: true });
  const root = await fs.mkdtemp(path.join(work, "AUD-009-lock-"));
  t.after(async () => {
    assert.ok(path.resolve(root).startsWith(path.resolve(work) + path.sep));
    await fs.rm(root, { recursive: true, force: true });
  });
  await fs.mkdir(path.join(root, "shared/drop-params"), { recursive: true });
  await fs.writeFile(path.join(root, "package.json"), '{"type":"module"}\n');
  for (const name of ["shared/chain-registry.js", "shared/network.js", "shared/drop-time.js",
    "shared/public-drop-compatibility.js",
    ...["authoring", "archive", "projector", "recovery"].map(n => `shared/drop-params/drop-params-${n}.mjs`)]) {
    await fs.copyFile(path.join(repo, name), path.join(root, name));
  }
  const url = pathToFileURL(path.join(root, "shared/drop-params/drop-params-projector.mjs"));
  const p = await import(url);
  const directory = p.DROP_PARAMS_PATHS.transactionLock;
  await fs.mkdir(directory);
  const claimPath = token => path.join(directory, `claim-${token}.json`);
  const empty = async () => assert.deepEqual(await fs.readdir(directory), []);
  return { p, url, directory, claimPath, empty };
}

function patch(t, object, key, replacement) {
  const original = object[key];
  object[key] = replacement(original);
  syncBuiltinESMExports();
  t.after(() => { object[key] = original; syncBuiltinESMExports(); });
}

// Retain the native-create pause, real default grace, lower A token and delayed
// revival. Atomic publication must keep the paused file private: reaching a
// stale-invalid visible A claim is precisely the defect. No shorter grace or
// automatic release lets the contenders escape this schedule.
test("AUD-009-001: delayed creation past production grace cannot publish a stale-invalid live claim", { timeout: 25_000 }, async t => {
  const f = await fixture(t), { p } = f;
  const created = latch(), resume = latch();
  const aToken = "00000000-0000-4000-8000-000000000001";
  const bToken = "ffffffff-ffff-4fff-8fff-ffffffffffff";
  let nextToken = aToken;
  patch(t, crypto, "randomUUID", original => () => {
    const token = nextToken; nextToken = null; return token || original();
  });
  patch(t, fs, "open", original => async (file, flags, ...args) => {
    const handle = await original(file, flags, ...args);
    if (flags === "wx" && (file === f.claimPath(aToken) ||
      path.basename(file).startsWith(`.claim-${aToken}.json.`))) {
      created.resolve(); await resume.promise;
    }
    return handle;
  });
  let a, b, aEntered = false;
  const acquiringA = p.acquireDropParamsLock({ timeoutMs: 15_000, retryMs: 5 })
    .then(lock => { aEntered = true; a = lock; return lock; });
  try {
    await created.promise;
    await delay(5_100); // Unchanged production 5,000 ms invalid-metadata grace.
    assert.equal((await p.inspectDropParamsLock()).state, "unlocked");
    await assert.rejects(fs.stat(f.claimPath(aToken)), { code: "ENOENT" });
    nextToken = bToken;
    b = await p.acquireDropParamsLock({ timeoutMs: 15_000, retryMs: 5,
      testHooks: { beforeReclaim() { assert.fail("an unpublished claim cannot be reclaimed"); } } });
    assert.equal(b.metadata.ticket, 1);
    assert.equal(b.metadata.token, bToken);
    resume.resolve();
    await until(async () => (await p.inspectDropParamsLock()).claims.some(c =>
      c.metadata?.token === aToken && c.metadata.phase === "waiting"), "A did not revive into waiting");
    const waiting = (await p.inspectDropParamsLock()).claims.find(c => c.metadata?.token === aToken);
    assert.equal(waiting.metadata.ticket, 2);
    assert.equal(aEntered, false, "both handles must not be owned simultaneously");
    await b.release(); b = null;
    a = await acquiringA;
    assert.equal(a.metadata.phase, "owned");
    await a.release(); a = null;
    await f.empty();
  } finally {
    resume.resolve();
    if (b) await b.release();
    await acquiringA;
    if (a) await a.release();
  }
});

test("publication completion delayed past grace still exposes complete live metadata", { timeout: 25_000 }, async t => {
  const f = await fixture(t);
  const published = latch(), resume = latch();
  let first = true, a;
  patch(t, fs, "link", original => async (...args) => {
    await original(...args);
    if (first) { first = false; published.resolve(); await resume.promise; }
  });
  const acquiring = f.p.acquireDropParamsLock({ timeoutMs: 15_000, retryMs: 5 }).then(lock => { a = lock; });
  try {
    await published.promise;
    await delay(5_100);
    const state = await f.p.inspectDropParamsLock();
    assert.equal(state.state, "active");
    assert.equal(state.metadata.phase, "choosing");
    assert.equal(await f.p.reclaimStaleDropParamsLock(state), false);
    await assert.rejects(f.p.acquireDropParamsLock({ timeoutMs: 60, retryMs: 5 }), /Timed out/);
  } finally {
    resume.resolve(); await acquiring;
    if (a) await a.release();
  }
  await f.empty();
});

test("last stale-invalid inspection overlaps publication and waiting without reviving its stale path", async t => {
  const f = await fixture(t);
  const created = latch(), resume = latch();
  let first = true, a, b, bEntered = false;
  patch(t, fs, "open", original => async (file, flags, ...args) => {
    const handle = await original(file, flags, ...args);
    if (flags === "wx" && first) { first = false; created.resolve(); await resume.promise; }
    return handle;
  });
  const acquiringA = f.p.acquireDropParamsLock({ retryMs: 5 }).then(lock => { a = lock; return lock; });
  await created.promise;
  // Legacy abandoned invalid claims retain their recovery path. A's private
  // file cannot become this stale path; the exact old alias is now impossible.
  const stalePath = f.claimPath("abandoned-invalid");
  await fs.writeFile(stalePath, "");
  let reclaimed = false;
  const acquiringB = f.p.acquireDropParamsLock({ retryMs: 5, invalidLockGraceMs: 0,
    testHooks: { beforeReclaim: async ({ claimPath }) => {
      assert.equal(claimPath, stalePath);
      resume.resolve();
      await until(async () => (await f.p.inspectDropParamsLock()).claims.some(c =>
        c.metadata?.phase === "waiting"), "A did not reach waiting before unlink");
      reclaimed = true;
    } }
  }).then(lock => { bEntered = true; b = lock; return lock; });
  try {
    a = await acquiringA;
    assert.equal(reclaimed, true);
    assert.equal(bEntered, false);
    assert.equal(a.metadata.ticket, 1);
    await a.release(); a = null;
    b = await acquiringB;
    assert.equal(b.metadata.ticket, 2);
    await b.release(); b = null;
    await f.empty();
  } finally {
    resume.resolve();
    if (a) await a.release();
    await acquiringB;
    if (b) await b.release();
  }
});

test("equal tickets and reversed publication completions admit only the lower token", async t => {
  const f = await fixture(t);
  const lower = "00000000-0000-4000-8000-000000000001", higher = "ffffffff-ffff-4fff-8fff-ffffffffffff";
  let nextToken = lower;
  patch(t, crypto, "randomUUID", original => () => {
    const token = nextToken; nextToken = null; return token || original();
  });
  const reachedLower = latch(), reachedHigher = latch(), resumeLower = latch(), resumeHigher = latch();
  patch(t, fs, "rename", original => async (source, target) => {
    const row = JSON.parse(await fs.readFile(source, "utf8"));
    if (row.phase === "waiting") {
      assert.equal(row.ticket, 1);
      const low = row.token === lower;
      (low ? reachedLower : reachedHigher).resolve();
      await (low ? resumeLower : resumeHigher).promise;
    }
    return original(source, target);
  });
  let a, b, bEntered = false;
  const acquiringA = f.p.acquireDropParamsLock({ retryMs: 5 }).then(lock => { a = lock; return lock; });
  await reachedLower.promise;
  nextToken = higher;
  const acquiringB = f.p.acquireDropParamsLock({ retryMs: 5 }).then(lock => { bEntered = true; b = lock; return lock; });
  try {
    await reachedHigher.promise;
    resumeHigher.resolve();
    await until(async () => JSON.parse(await fs.readFile(f.claimPath(higher), "utf8")).phase === "waiting", "higher waiting");
    assert.equal(bEntered, false, "higher token waits for lower's choosing phase");
    resumeLower.resolve();
    a = await acquiringA;
    assert.equal(bEntered, false);
    await a.release(); a = null;
    b = await acquiringB;
    assert.equal(b.metadata.ticket, 1);
    await b.release(); b = null;
    await f.empty();
  } finally {
    resumeLower.resolve(); resumeHigher.resolve();
    if (a) await a.release();
    await acquiringB;
    if (b) await b.release();
  }
});

test("overlapping acquisitions serialize, timeout cleans up, and retry progresses", async t => {
  const f = await fixture(t);
  const owner = await f.p.acquireDropParamsLock();
  await assert.rejects(f.p.acquireDropParamsLock({ timeoutMs: 40, retryMs: 5 }), /Timed out/);
  assert.equal((await f.p.inspectDropParamsLock()).claims.length, 1);
  assert.equal(await owner.release(), true);
  assert.equal(await owner.release(), false);
  let owners = 0, maximum = 0, completed = 0;
  await Promise.all(Array.from({ length: 8 }, () => f.p.withDropParamsLock(async metadata => {
    assert.equal(metadata.phase, "owned");
    maximum = Math.max(maximum, ++owners);
    await delay(10);
    --owners; ++completed;
  }, { timeoutMs: 5_000, retryMs: 2 })));
  assert.equal(maximum, 1);
  assert.equal(completed, 8);
  await f.empty();
});

test("real child owner is protected while live and reclaimed after death", async t => {
  const f = await fixture(t);
  const child = spawn(process.execPath, ["--input-type=module", "-e",
    `const p = await import(${JSON.stringify(f.url.href)}); const lock = await p.acquireDropParamsLock();
     console.log(JSON.stringify(lock.metadata)); process.stdin.resume();`], { windowsHide: true });
  let output = "", errors = "";
  child.stdout.on("data", bytes => { output += bytes; });
  child.stderr.on("data", bytes => { errors += bytes; });
  const exited = new Promise((resolve, reject) => { child.once("exit", resolve); child.once("error", reject); });
  t.after(async () => { child.kill(); await exited; });
  await until(() => output.includes("\n"), `child failed to acquire: ${errors}`);
  const state = await f.p.inspectDropParamsLock({ invalidLockGraceMs: 0 });
  assert.equal(state.metadata.pid, child.pid);
  assert.equal(await f.p.reclaimStaleDropParamsLock(state), false);
  await assert.rejects(f.p.acquireDropParamsLock({ timeoutMs: 40, retryMs: 5 }), /Timed out/);
  child.kill(); await exited;
  const stale = await f.p.inspectDropParamsLock();
  assert.equal(stale.reason, "owner-not-running");
  const lock = await f.p.acquireDropParamsLock();
  assert.notEqual(lock.metadata.token, stale.metadata.token);
  assert.equal(await f.p.reclaimStaleDropParamsLock(stale), false);
  await lock.release();
  await f.empty();
});

test("fresh invalid claims block; stale invalid, missing and replaced claims recover", async t => {
  const f = await fixture(t);
  for (const bytes of ["", "{", "null"]) {
    const target = f.claimPath("invalid");
    await fs.writeFile(target, bytes);
    await assert.rejects(f.p.acquireDropParamsLock({ timeoutMs: 30, retryMs: 5, invalidLockGraceMs: 60_000 }), /Timed out/);
    const stale = await f.p.inspectDropParamsLock({ invalidLockGraceMs: 0 });
    assert.equal(stale.state, "stale");
    await fs.unlink(target);
    assert.equal(await f.p.reclaimStaleDropParamsLock(stale), false);
    await fs.writeFile(target, "replacement bytes");
    assert.equal(await f.p.reclaimStaleDropParamsLock(stale, { invalidLockGraceMs: 0 }), false);
    assert.equal(await fs.readFile(target, "utf8"), "replacement bytes");
    const lock = await f.p.acquireDropParamsLock({ invalidLockGraceMs: 0 });
    await lock.release();
    await f.empty();
  }
});

test("competing reclaimers completing in reverse order cannot remove a subsequent acquisition", async t => {
  const f = await fixture(t);
  await fs.writeFile(f.claimPath("abandoned"), "");
  const stale = await f.p.inspectDropParamsLock({ invalidLockGraceMs: 0 });
  const firstReached = latch(), secondReached = latch(), finishFirst = latch(), finishSecond = latch();
  const first = f.p.reclaimStaleDropParamsLock(stale, { invalidLockGraceMs: 0,
    testHooks: { beforeReclaim: async () => { firstReached.resolve(); await finishFirst.promise; } } });
  await firstReached.promise;
  const second = f.p.reclaimStaleDropParamsLock(stale, { invalidLockGraceMs: 0,
    testHooks: { beforeReclaim: async () => { secondReached.resolve(); await finishSecond.promise; } } });
  let owner;
  try {
    await secondReached.promise;
    owner = await f.p.acquireDropParamsLock({ invalidLockGraceMs: 0 });
    finishSecond.resolve();
    assert.equal(await second, false);
    finishFirst.resolve();
    assert.equal(await first, false);
    assert.equal((await f.p.inspectDropParamsLock()).metadata.token, owner.metadata.token);
  } finally {
    finishFirst.resolve(); finishSecond.resolve();
    await Promise.all([first, second]);
    if (owner) await owner.release();
  }
  await f.empty();
});

test("removed or replaced waiting claims fail before entry; cleanup preserves foreign identity", async t => {
  for (const replacement of [false, true]) await t.test(replacement ? "replacement" : "missing", async t => {
    const f = await fixture(t);
    let replacedPath, replacementBytes;
    patch(t, fs, "rename", original => async (source, target) => {
      const row = JSON.parse(await fs.readFile(source, "utf8"));
      await original(source, target);
      if (row.phase === "waiting") {
        replacedPath = target;
        await fs.unlink(target);
        if (replacement) {
          replacementBytes = JSON.stringify({ ...row, token: "foreign-owner" });
          await fs.writeFile(target, replacementBytes);
        }
      }
    });
    await assert.rejects(f.p.acquireDropParamsLock(), { code: "lock_ownership_lost" });
    assert.ok(replacedPath);
    if (replacement) {
      assert.equal(await fs.readFile(replacedPath, "utf8"), replacementBytes);
      await fs.unlink(replacedPath);
    }
    await f.empty();
  });
});

test("release detects same-metadata replacement; colliding creation cannot remove another owner", async t => {
  const f = await fixture(t);
  const owner = await f.p.acquireDropParamsLock();
  const target = f.claimPath(owner.metadata.token), bytes = await fs.readFile(target);
  const replacement = path.join(f.directory, "replacement.tmp");
  await fs.writeFile(replacement, bytes);
  await fs.rename(replacement, target);
  assert.equal(await owner.release(), false);
  let next = owner.metadata.token;
  patch(t, crypto, "randomUUID", original => () => { const token = next; next = null; return token || original(); });
  await assert.rejects(f.p.acquireDropParamsLock(), { code: "EEXIST" });
  assert.deepEqual(await fs.readFile(target), bytes);
  assert.deepEqual(await fs.readdir(f.directory), [path.basename(target)]);
  await fs.unlink(target);
  await f.empty();
});

test("cancellation before creation, during retry and publication never returns owned or leaks claims", async t => {
  const f = await fixture(t);
  await assert.rejects(f.p.acquireDropParamsLock({ signal: AbortSignal.abort(new Error("pre-aborted")) }), /pre-aborted/);
  await f.empty();
  const owner = await f.p.acquireDropParamsLock();
  const controller = new AbortController();
  const pending = f.p.acquireDropParamsLock({ signal: controller.signal, retryMs: 10_000 });
  const rejected = assert.rejects(pending, error => error.name === "AbortError" || /cancel/.test(error.message));
  await until(async () => (await f.p.inspectDropParamsLock()).claims.length === 2, "cancel contender missing");
  controller.abort(new Error("cancel retry"));
  await rejected;
  assert.equal((await f.p.inspectDropParamsLock()).claims.length, 1);
  await owner.release();
  const during = new AbortController();
  patch(t, fs, "link", original => async (...args) => { await original(...args); during.abort(new Error("cancel publication")); });
  await assert.rejects(f.p.acquireDropParamsLock({ signal: during.signal }), /cancel publication/);
  await f.empty();
  const entering = new AbortController();
  patch(t, fs, "rename", original => async (source, target) => {
    const row = JSON.parse(await fs.readFile(source, "utf8"));
    await original(source, target);
    if (row.phase === "owned") entering.abort(new Error("cancel entry"));
  });
  await assert.rejects(f.p.acquireDropParamsLock({ signal: entering.signal }), /cancel entry/);
  await f.empty();
});

test("unsupported links and staging errors fail closed; publication-error cleanup is identity scoped", async t => {
  for (const boundary of ["link", "writeFile", "unlink"]) await t.test(boundary, async t => {
    const f = await fixture(t);
    let injected = false;
    if (boundary === "writeFile") {
      patch(t, fs, "open", original => async (...args) => {
        const handle = await original(...args);
        if (args[1] === "wx") handle.writeFile = async () => { throw new Error("injected staging failure"); };
        return handle;
      });
    } else {
      patch(t, fs, boundary, original => async (...args) => {
        if (!injected) { injected = true; throw Object.assign(new Error("injected filesystem failure"), { code: "ENOTSUP" }); }
        return original(...args);
      });
    }
    await assert.rejects(f.p.acquireDropParamsLock(), /injected/);
    await f.empty();
  });
});
