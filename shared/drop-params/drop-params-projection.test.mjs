import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs, { copyFile, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { syncBuiltinESMExports } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const repo = fileURLToPath(new URL("../../", import.meta.url));
const work = path.join(repo, "audits", "work");
const moduleNames = [
  "drop-params-authoring.mjs", "drop-params-projector.mjs", "drop-params-recovery.mjs",
  "drop-params-transaction.mjs", "drop-params-archive.mjs", "drop-params-authoring-service.mjs",
  "gen-drop-params-json.mjs", "watch-drop-params-json.mjs", "drop-params.js", "drop-params.json"
];
const protectedKeys = ["canonicalSource", "outerJson", "adminMirror"];

async function fixture(t) {
  await mkdir(work, { recursive: true });
  const root = await mkdtemp(path.join(work, "CFG-002-projection-"));
  t.after(async () => {
    assert.ok(path.resolve(root).startsWith(path.resolve(work) + path.sep));
    await rm(root, { recursive: true, force: true });
  });
  for (const dir of ["shared/drop-params/archive", "admin-ui/src"])
    await mkdir(path.join(root, dir), { recursive: true });
  await writeFile(path.join(root, "package.json"), '{"type":"module"}\n');
  for (const name of ["shared/chain-registry.js", "shared/drop-time.js",
    "shared/network.js", "shared/public-drop-compatibility.js",
    ...moduleNames.map(n => `shared/drop-params/${n}`)])
    await copyFile(path.join(repo, name), path.join(root, name));
  const json = await readFile(path.join(root, "shared/drop-params/drop-params.json"));
  await writeFile(path.join(root, "admin-ui/src/drop-params.mirror.json"), json);
  const load = name => import(pathToFileURL(path.join(root, "shared/drop-params", name)).href);
  const projector = await load("drop-params-projector.mjs");
  const writer = await load("drop-params-transaction.mjs");
  const candidate = { ...JSON.parse(json), dropName: "CFG-002 VALID" };
  const journal = writer.DROP_PARAMS_TRANSACTION_PATHS.journalDirectory;
  const bytes = () => Promise.all(protectedKeys.map(key => readFile(projector.DROP_PARAMS_PATHS[key])));
  const journalBytes = async () => Promise.all((await readdir(journal)).filter(n => n.endsWith(".json"))
    .sort().map(n => readFile(path.join(journal, n))));
  return { root, projector, writer, candidate, journal, bytes, journalBytes };
}

function cli(root, script, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], { cwd: root, windowsHide: true });
    let output = "";
    child.stdout.on("data", data => { output += data; });
    child.stderr.on("data", data => { output += data; });
    child.once("error", reject);
    const timer = setTimeout(() => { child.kill(); reject(new Error(`CLI timed out: ${output}`)); }, 20_000);
    child.once("close", code => { clearTimeout(timer); resolve({ code, output }); });
  });
}

function entrypoints(p, candidate) {
  return [
    () => p.generateOuterDropParamsJson(),
    () => p.generateOuterDropParamsJson({ params: candidate, sourceVersion: "0".repeat(64) }),
    () => p.synchronizeAdminDropParamsMirror(),
    () => p.synchronizeAdminDropParamsMirror({ jsonText: JSON.stringify(candidate) }),
    () => p.projectDropParams(),
    () => p.projectDropParams({ syncAdmin: false }),
    ...[p.generateOuterDropParamsJson, p.synchronizeAdminDropParamsMirror, p.projectDropParams]
      .map(fn => () => p.withDropParamsLock(() => fn({ lock: false })))
  ];
}

const blocked = error => error.code === "reconciliation_required" && /projection blocked/.test(error.message);

async function assertAllBlocked(f, predicate = blocked) {
  const before = await f.bytes();
  for (const run of entrypoints(f.projector, f.candidate)) {
    await assert.rejects(run(), predicate);
    assert.deepEqual(await f.bytes(), before);
  }
}

const failingReplace = ({ index }) => { if (index === 1) throw new Error("injected replacement failure"); };
const failingRollback = ({ key }) => { if (key === "canonicalSource") throw new Error("injected rollback failure"); };
async function edit(f, id, hooks = {}) {
  return f.writer.editDropParams({ operationId: id,
    expectedSourceVersion: await f.projector.getCurrentSourceVersion(), candidate: f.candidate }, { testHooks: hooks });
}

test("CFG-003: direct writers reject incompatible active candidates before journal or configuration publication", async t => {
  const f = await fixture(t);
  const before = await f.bytes();
  const sourceVersion = await f.projector.getCurrentSourceVersion();
  const variants = [
    { ...f.candidate, redeemToken: { ...f.candidate.redeemToken, collection: "THE 419 SCRIPT", tokenId: "0" } },
    { ...f.candidate, burnTokens: [{ ...f.candidate.burnTokens[0], collection: "CANAAN" }] },
    { ...f.candidate, burnTokens: [...f.candidate.burnTokens,
      { collection: "INTRODUCTIONS", enabled: true, exclude: [], burnAmount: 2 }] },
    { ...f.candidate, burnTokens: [{ ...f.candidate.burnTokens[0], enabled: false }] },
    { ...f.candidate, mirrorNetwork: "mainnet" }
  ];
  for (const [index, candidate] of variants.entries()) {
    for (const run of [f.writer.createDropParams, f.writer.editDropParams]) {
      await assert.rejects(run({ operationId: `cfg003-${index}-${run.name}`,
        expectedSourceVersion: sourceVersion, candidate }),
      error => error.errors?.some(item => item.code === "public_compatibility"));
      assert.deepEqual(await f.bytes(), before);
    }
  }
  const journals = await readdir(f.journal).catch(error => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  assert.deepEqual(journals, []);
});

test("clear and rolled-back recovery permit ordinary generation/mirroring; unresolved recovery blocks every entrypoint", async t => {
  const f = await fixture(t);
  const p = f.projector;
  for (const run of entrypoints(p, f.candidate)) await run();
  // Caller-supplied JSON is still copied byte-for-byte in a clear state.
  const customJson = JSON.stringify(f.candidate) + "\n";
  await p.synchronizeAdminDropParamsMirror({ jsonText: customJson });
  assert.equal(await readFile(p.DROP_PARAMS_PATHS.adminMirror, "utf8"), customJson);
  await p.projectDropParams();
  assert.equal((await p.verifyDropParamsEquality()).ok, true);
  await assert.rejects(edit(f, "rolled-back", { beforeReplaceFile: failingReplace }),
    e => e.code === "transaction_rolled_back");
  assert.equal((await f.writer.inspectDropParamsTransactionStatus()).operations[0].status, "rolled_back");
  for (const run of entrypoints(p, f.candidate)) await run();
  await p.projectDropParams();
  await assert.rejects(edit(f, "unresolved", { beforeReplaceFile: failingReplace, beforeRollbackFile: failingRollback }),
    e => e.code === "reconciliation_required");
  assert.equal((await f.writer.inspectDropParamsTransactionStatus()).blocked, true);
  const journals = await f.journalBytes();
  await assertAllBlocked(f);
  for (const [script, args, message] of [
    ["gen-drop-params-json.mjs", [], "generation failed"],
    ["watch-drop-params-json.mjs", ["--once"], "projections stale"]
  ]) {
    const before = await f.bytes();
    const result = await cli(f.root, `shared/drop-params/${script}`, args);
    assert.equal(result.code, 1, result.output);
    assert.ok(result.output.includes(message) && result.output.includes("unresolved"), result.output);
    assert.deepEqual(await f.bytes(), before);
  }
  assert.deepEqual(await f.journalBytes(), journals, "projection must not reconcile or modify journals");
  assert.equal((await f.writer.reconcileDropParamsTransactions()).blocked, false);
  await p.projectDropParams();
  for (const run of entrypoints(p, f.candidate)) await run();
  await p.projectDropParams();
  assert.equal((await p.verifyDropParamsEquality()).ok, true);
  await edit(f, "after-reconcile");
  assert.equal((await p.verifyDropParamsEquality()).ok, true);
});

test("pending, malformed and unreadable recovery fail closed without protected writes", async t => {
  const f = await fixture(t);
  await mkdir(f.journal, { recursive: true });
  const journalPath = path.join(f.journal, "invalid.json");
  for (const text of ["{", "null", JSON.stringify({ schemaVersion: 999 }),
    JSON.stringify({ schemaVersion: 1, operationId: "invalid", operation: "EDIT", status: "unknown" })]) {
    await writeFile(journalPath, text);
    await assertAllBlocked(f, e => e.code === "journal_invalid" && /recovery state/.test(e.message));
  }
  await rm(journalPath);
  await mkdir(journalPath);
  await assertAllBlocked(f, e => e.code === "journal_invalid");
  await rm(journalPath, { recursive: true });
  await rm(f.journal, { recursive: true });
  await writeFile(f.journal, "not a directory");
  await assertAllBlocked(f, e => e.code === "journal_invalid");
  await rm(f.journal);
  await mkdir(f.journal);
  await writeFile(journalPath, JSON.stringify({ schemaVersion: 1, operationId: "invalid", operation: "EDIT",
    status: "pending", baseSourceVersion: "0".repeat(64), planHash: "1".repeat(64) }));
  await assertAllBlocked(f);
  // Inject real filesystem permission errors at the narrow read seam on every OS.
  for (const method of ["readFile", "readdir"]) {
    const original = fs[method];
    fs[method] = async (target, ...args) => {
      if (String(target).startsWith(f.journal))
        throw Object.assign(new Error("injected EACCES reading recovery state"), { code: "EACCES" });
      return original(target, ...args);
    };
    syncBuiltinESMExports();
    try {
      await assertAllBlocked(f, e => e.code === "journal_invalid" && e.cause?.code === "EACCES");
    } finally {
      fs[method] = original;
      syncBuiltinESMExports();
    }
  }
});

async function waitForClaim(p, count = 2) {
  const deadline = Date.now() + 5_000;
  while ((await p.inspectDropParamsLock()).claims.length < count) {
    assert.ok(Date.now() < deadline, "contender did not reach the transaction lock");
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

function latch() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

test("writer/projector contention checks recovery after acquiring the lock in both orders", { timeout: 30_000 }, async t => {
  const f = await fixture(t);
  const p = f.projector;
  const reached = latch();
  const release = latch();
  const writeResult = edit(f, "concurrent-failure", {
    beforeReplaceFile: async event => {
      if (event.index === 1) { reached.resolve(); await release.promise; failingReplace(event); }
    }, beforeRollbackFile: failingRollback
  }).catch(error => error);
  await reached.promise;
  const before = await f.bytes();
  const projectionResult = p.projectDropParams().catch(error => error);
  const generator = cli(f.root, "shared/drop-params/gen-drop-params-json.mjs");
  const watcher = cli(f.root, "shared/drop-params/watch-drop-params-json.mjs", ["--once"]);
  try {
    await waitForClaim(p, 4);
    assert.deepEqual(await f.bytes(), before, "queued projectors cannot write while writer owns lock");
  } finally { release.resolve(); }
  assert.equal((await writeResult).code, "reconciliation_required");
  const afterRollback = await f.bytes();
  assert.ok(blocked(await projectionResult));
  for (const result of await Promise.all([generator, watcher])) {
    assert.equal(result.code, 1, result.output);
    assert.match(result.output, /unresolved operation/);
  }
  assert.deepEqual(await f.bytes(), afterRollback);
  await f.writer.reconcileDropParamsTransactions();
  let queuedWriter;
  await p.withDropParamsLock(async () => {
    queuedWriter = edit(f, "writer-after-projection");
    await waitForClaim(p);
    // Projection reuses this call chain's lock; it cannot reacquire behind the writer.
    await p.projectDropParams({ lock: false });
    assert.equal((await p.verifyDropParamsEquality()).ok, true);
  });
  assert.equal((await queuedWriter).status, "completed");
  assert.equal((await p.verifyDropParamsEquality()).ok, true);
});

test("lock:false requires current async ownership and cannot reuse a released lock", async t => {
  const f = await fixture(t);
  const p = f.projector;
  for (const fn of [p.generateOuterDropParamsJson, p.synchronizeAdminDropParamsMirror, p.projectDropParams])
    await assert.rejects(fn({ lock: false }), /requires withDropParamsLock ownership/);
  const resume = latch();
  let delayed;
  await p.withDropParamsLock(async () => {
    delayed = (async () => { await resume.promise; return p.projectDropParams({ lock: false }); })();
    await p.projectDropParams({ lock: false });
  });
  resume.resolve();
  await assert.rejects(delayed, /requires withDropParamsLock ownership/);
});

test("existing writer, service and watcher suites pass only against a disposable repository", { timeout: 60_000 }, async t => {
  const f = await fixture(t);
  await mkdir(path.join(f.root, "scripts"));
  await copyFile(path.join(repo, "scripts/drop-params-transaction.mjs"), path.join(f.root, "scripts/drop-params-transaction.mjs"));
  for (const name of ["drop-params-transaction.test.mjs", "drop-params-authoring-service.test.mjs", "watch-drop-params-json.test.mjs"])
    await copyFile(path.join(repo, "shared/drop-params", name), path.join(f.root, "shared/drop-params", name));
  for (const names of [["drop-params-transaction.test.mjs", "drop-params-authoring-service.test.mjs"], ["watch-drop-params-json.test.mjs"]]) {
    const result = await cli(f.root, "--test", ["--experimental-test-isolation=none", ...names.map(n => `shared/drop-params/${n}`)]);
    assert.equal(result.code, 0, result.output);
    t.diagnostic(result.output.match(/# tests \d+[\s\S]*$/)?.[0] || result.output);
  }
});
