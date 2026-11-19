import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import { syncBuiltinESMExports } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";

// OPT-IN HISTORICAL EVIDENCE for unsupported external saves during authoring.
// The six preservation assertions remain unchanged and currently FAIL. They
// are neither passing regressions nor part of the supported verification gate.
// Run: npm run evidence:drop-params:external-concurrency
// See audits/AUD-005-001-source-ownership.md for the current support boundary.
// As in the projection suite, builtin FS seams are process-wide: run serially.
const repo = fileURLToPath(new URL("../../", import.meta.url));
const work = path.join(repo, "audits/work");
const native = { ...fs };
const runFile = promisify(execFile);
const keys = ["canonicalSource", "outerJson", "adminMirror"];

async function fixture(t) {
  await native.mkdir(work, { recursive: true });
  const root = await native.mkdtemp(path.join(work, "AUD-005-ownership-"));
  t.after(async () => {
    const relative = path.relative(work, root);
    assert.ok(relative && !relative.startsWith("..") && !path.isAbsolute(relative));
    await native.rm(root, { recursive: true, force: true });
  });
  for (const directory of ["shared/drop-params", "admin-ui/src"])
    await native.mkdir(path.join(root, directory), { recursive: true });
  await native.writeFile(path.join(root, "package.json"), '{"type":"module"}\n');
  for (const name of ["chain-registry.js", "network.js", "drop-time.js", "public-drop-compatibility.js"])
    await native.copyFile(path.join(repo, "shared", name), path.join(root, "shared", name));
  const directory = path.join(root, "shared/drop-params");
  for (const name of ["drop-params.js", "drop-params.json", "drop-params-authoring.mjs",
    "drop-params-projector.mjs", "drop-params-archive.mjs", "drop-params-recovery.mjs", "drop-params-transaction.mjs"])
    await native.copyFile(path.join(repo, "shared/drop-params", name), path.join(directory, name));
  const json = await native.readFile(path.join(directory, "drop-params.json"));
  // Derive the disposable mirror from Outer; never read/write the nested repo.
  await native.writeFile(path.join(root, "admin-ui/src/drop-params.mirror.json"), json);
  const load = name => import(pathToFileURL(path.join(directory, name)).href);
  const writer = await load("drop-params-transaction.mjs");
  const projector = await load("drop-params-projector.mjs");
  const authoring = await load("drop-params-authoring.mjs");
  const current = JSON.parse(json);
  const candidate = { ...current, dropName: "REVIEWED CANDIDATE" };
  const source = projector.DROP_PARAMS_PATHS.canonicalSource;
  const later = authoring.serializeDropParamsSource({ ...candidate, dropName: "LATER EDITOR SAVE" });
  const journal = writer.DROP_PARAMS_TRANSACTION_PATHS.journalDirectory;
  const bytes = () => Promise.all(keys.map(key => native.readFile(projector.DROP_PARAMS_PATHS[key])));
  const request = async (operationId = "ownership") => ({ operationId, candidate,
    expectedSourceVersion: await projector.getCurrentSourceVersion() });
  async function save(mode = "write") {
    if (mode === "rename") {
      const temporary = `${source}.editor-tmp`;
      await native.writeFile(temporary, later);
      await native.rename(temporary, source);
    } else await native.writeFile(source, later);
    assert.equal(await native.readFile(source, "utf8"), later, "independent editor read-back");
  }
  return { root, writer, projector, authoring, candidate, source, later, journal, bytes, request, save };
}

async function withFsSeam(overrides, callback) {
  Object.assign(fs, overrides);
  syncBuiltinESMExports();
  try { return await callback(); }
  finally {
    for (const key of Object.keys(overrides)) fs[key] = native[key];
    syncBuiltinESMExports();
  }
}

function interrupt() {
  const error = new Error("simulated partial interruption");
  error.simulateProcessInterruption = true;
  throw error;
}

async function assertConflictPreserved(f, outcome) {
  // Check bytes first: successful/rolled-back status must not conceal a save.
  assert.equal(await native.readFile(f.source, "utf8"), f.later,
    "AUD-005-001: independent source save must survive replacement/recovery");
  if (outcome) assert.equal(outcome.code, "reconciliation_required");
  assert.equal((await f.writer.inspectDropParamsTransactionStatus()).blocked, true);
  const record = JSON.parse(await native.readFile(path.join(f.journal, "ownership.json")));
  assert.equal(record.status, "reconciliation_required");
  assert.equal(record.result, null);
  assert.ok(record.recovery);
  const stage = path.join(f.journal, "stage-ownership");
  const staged = await native.readdir(stage);
  const evidence = await Promise.all(staged.map(name => native.readFile(path.join(stage, name))));
  const saved = await f.bytes();
  assert.equal((await f.writer.reconcileDropParamsTransactions()).blocked, true);
  await assert.rejects(f.projector.projectDropParams(), { code: "reconciliation_required" });
  assert.deepEqual(await f.bytes(), saved);
  assert.deepEqual(JSON.parse(await native.readFile(path.join(f.journal, "ownership.json"))).recovery,
    record.recovery);
  assert.deepEqual(await native.readdir(stage), staged);
  assert.deepEqual(await Promise.all(staged.map(name => native.readFile(path.join(stage, name)))), evidence);
}

for (const operation of ["CREATE", "EDIT", "DEACTIVATE"]) {
  test(`AUD-005-001 unchanged ${operation} preserves existing behavior`, async t => {
    const f = await fixture(t);
    if (operation === "CREATE") {
      await native.writeFile(f.source, f.authoring.serializeDropParamsSource(f.authoring.INACTIVE_DROP_PARAMS));
      await f.projector.projectDropParams();
    }
    const request = { ...await f.request(), operation };
    if (operation === "DEACTIVATE") delete request.candidate;
    const result = await f.writer.executeDropParamsOperation(request);
    assert.equal(result.status, "completed");
    assert.equal(result.sourceVersion, await f.projector.getCurrentSourceVersion());
    assert.equal((await f.projector.assertDropParamsEquality({ expectedParams:
      operation === "DEACTIVATE" ? f.authoring.INACTIVE_DROP_PARAMS : f.candidate })).ok, true);
    assert.equal((await f.writer.executeDropParamsOperation(request)).idempotent, true);
    if (operation === "DEACTIVATE") {
      const archive = await import(pathToFileURL(path.join(f.root, "shared/drop-params/drop-params-archive.mjs")));
      assert.equal((await archive.verifyDeactivationArchive(path.join(f.root, result.archivePath))).sha256,
        result.archiveSha256);
    }
  });
}

for (const mode of ["write", "rename"]) {
  test(`AUD-005-001 before-read ${mode} preserves AUD-004 exclusion and recovery evidence`, async t => {
    const f = await fixture(t);
    const request = await f.request();
    const outcome = await f.writer.editDropParams(request, { testHooks: {
      async beforeReplaceFile({ index }) { if (index === 0) await f.save(mode); }
    } }).catch(error => error);
    await assertConflictPreserved(f, outcome);
  });

  for (const boundary of ["read-window", "rename-window"]) {
    test(`AUD-005-001 corrective ${boundary}/${mode} preserves the intervening source save`, async t => {
      const f = await fixture(t);
      const request = await f.request();
      let armed = false;
      let injected = false;
      const save = async () => { armed = false; await f.save(mode); injected = true; };
      const seam = boundary === "read-window" ? {
        async readFile(target, ...args) {
          const bytes = await native.readFile(target, ...args);
          if (armed && target === f.source) await save();
          return bytes; // Return bytes obtained before the independent save.
        }
      } : {
        async rename(from, to) {
          if (armed && to === f.source) await save(); // All preflight reads have completed.
          return native.rename(from, to);
        }
      };
      const outcome = await withFsSeam(seam, () => f.writer.editDropParams(request, { testHooks: {
        beforeReplaceFile({ index }) { if (index === 0) armed = true; }
      } }).catch(error => error));
      assert.equal(injected, true, "ordered interleaving reached the native FS boundary");
      await assertConflictPreserved(f, outcome);
    });
  }

  test(`AUD-005-001 filesystem assumption/${mode}: lock and read handle do not establish replacement ownership`, async t => {
    const f = await fixture(t);
    await f.projector.withDropParamsLock(async () => {
      const handle = await native.open(f.source, "r");
      let closed = false;
      const saveInChild = () => runFile(process.execPath, ["--input-type=module", "-e", `
          import { writeFile, rename } from 'node:fs/promises';
          const [source, mode, bytes] = process.argv.slice(1);
          if (mode === 'rename') {
            await writeFile(source + '.editor-tmp', bytes);
            await rename(source + '.editor-tmp', source);
          } else await writeFile(source, bytes);
        `, f.source, mode, f.later], { windowsHide: true, timeout: 10_000 });
      try {
        if (mode === "rename" && process.platform === "win32") {
          // Observed Windows MoveFileEx replacement fails while the target is
          // open. It also prevents the writer's replacing rename: closing the
          // handle before that rename reintroduces the unowned interval.
          await assert.rejects(saveInChild(), error =>
            error.code === 1 && /EPERM|EACCES|EBUSY/.test(error.stderr));
          await handle.close();
          closed = true;
          t.diagnostic("Windows denied replacement with an open target; after close the held repository lock does not exclude it");
        }
        await saveInChild();
        assert.equal(await native.readFile(f.source, "utf8"), f.later);
      } finally { if (!closed) await handle.close(); }
    });
    // A legitimate external edit outside a transaction remains source authority.
    await f.projector.projectDropParams();
    assert.equal((await f.projector.assertDropParamsEquality()).ok, true);
    assert.equal(await native.readFile(f.source, "utf8"), f.later);
  });
}

for (const phase of ["automatic-rollback", "explicit-reconciliation"]) {
  for (const externalSave of [false, true]) {
    test(`AUD-005-001 ${externalSave ? "corrective recovery read-window" : "unchanged partial failure"}/${phase}`, async t => {
      const f = await fixture(t);
      const base = await f.bytes();
      const request = await f.request();
      if (phase === "explicit-reconciliation") {
        await assert.rejects(f.writer.editDropParams(request, { testHooks: {
          afterReplaceFile({ index }) { if (index === 0) interrupt(); }
        } }), error => error.simulateProcessInterruption === true);
      }
      let armed = false;
      let injected = false;
      const outcome = await withFsSeam({
        async open(target, ...args) {
          const handle = await native.open(target, ...args);
          // Recovery has staged the prior source. Arm its last ownership read,
          // after earlier checks and before the native replacing rename.
          if (externalSave && path.dirname(target) === path.dirname(f.source) &&
              path.basename(target).startsWith(".drop-params.js.") && args[0] === "wx") armed = true;
          return handle;
        },
        async readFile(target, ...args) {
          const bytes = await native.readFile(target, ...args);
          if (armed && target === f.source) {
            armed = false;
            await f.save();
            injected = true;
          }
          return bytes;
        }
      }, () => phase === "explicit-reconciliation"
        ? f.writer.reconcileDropParamsTransactions()
        : f.writer.editDropParams(request, { testHooks: {
          beforeReplaceFile({ index }) { if (index === 1) throw new Error("injected projection failure"); }
        } }).catch(error => error));
      assert.equal(injected, externalSave);
      if (externalSave) {
        await assertConflictPreserved(f, phase === "explicit-reconciliation" ? null : outcome);
        if (phase === "explicit-reconciliation") assert.equal(outcome.blocked, true);
      } else {
        assert.deepEqual(await f.bytes(), base);
        assert.equal((await f.writer.inspectDropParamsTransactionStatus()).blocked, false);
        assert.equal(phase === "explicit-reconciliation" ? outcome.operations[0].status : outcome.code,
          phase === "explicit-reconciliation" ? "rolled_back" : "transaction_rolled_back");
      }
    });
  }
}
