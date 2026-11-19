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
  return { root, projector, writer, candidate, journal, bytes, journalBytes, load };
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

test("AUD-004-003: normal apply preserves intervening edits at staging and every replacement boundary", async t => {
  for (const boundary of ["staging", ...protectedKeys, "final"]) {
    for (const conflict of protectedKeys) {
      await t.test(`${boundary}/${conflict}`, async t => {
        const f = await fixture(t);
        const p = f.projector;
        const a = await f.load("drop-params-authoring.mjs");
        const base = await f.bytes();
        const expectedSourceVersion = await p.getCurrentSourceVersion();
        const external = { ...f.candidate, dropName: "LATER INDEPENDENT SAVE" };
        const externalBytes = conflict === "canonicalSource"
          ? a.serializeDropParamsSource(external)
          // Semantically unchanged JSON is still an independent exact-byte edit.
          : Buffer.concat([base[protectedKeys.indexOf(conflict)], Buffer.from("\n ")]);
        let saved;
        let rollbackCalled = false;
        const save = async () => {
          await writeFile(p.DROP_PARAMS_PATHS[conflict], externalBytes);
          saved = await f.bytes();
        };
        const hooks = {
          beforeRollbackFile() { rollbackCalled = true; },
          ...(boundary === "staging" ? {
            beforeStageFile: async ({ key }) => { if (key === "adminMirror") await save(); }
          } : boundary === "final" ? { beforeFinalVerification: save } : {
            beforeReplaceFile: async ({ key }) => { if (key === boundary) await save(); }
          })
        };
        await assert.rejects(f.writer.editDropParams({ operationId: "apply-conflict",
          expectedSourceVersion, candidate: f.candidate }, { testHooks: hooks }),
        error => error.code === "reconciliation_required");
        assert.ok(saved, "external save reached the real writer boundary");
        assert.deepEqual(await f.bytes(), saved, "no replacement or rollback may erase the save");
        assert.equal(rollbackCalled, false);
        const journalPath = path.join(f.journal, "apply-conflict.json");
        const record = JSON.parse(await readFile(journalPath));
        assert.equal(record.status, "reconciliation_required");
        assert.equal(record.failure.code, "apply_state_diverged");
        assert.equal(record.result, null);
        assert.equal(record.baseSourceVersion, expectedSourceVersion);
        for (const [index, key] of protectedKeys.entries())
          assert.equal(record.recovery.baseFiles[key].bytesBase64, base[index].toString("base64"));
        const stage = path.join(f.journal, "stage-apply-conflict");
        const names = await readdir(stage);
        const staged = await Promise.all(names.map(name => readFile(path.join(stage, name))));
        const journals = await f.journalBytes();
        assert.equal((await f.writer.getDropParamsTransactionStatus()).blocked, true);
        await assert.rejects(edit(f, "later"), error => error.code === "reconciliation_required");
        await assertAllBlocked(f);
        assert.deepEqual(await f.journalBytes(), journals, "ordinary writes never reconcile the conflict");
        assert.equal((await f.writer.reconcileDropParamsTransactions()).blocked, true);
        assert.deepEqual(await f.bytes(), saved);
        assert.deepEqual(JSON.parse(await readFile(journalPath)).recovery, record.recovery);
        assert.deepEqual(await readdir(stage), names);
        assert.deepEqual(await Promise.all(names.map(name => readFile(path.join(stage, name)))), staged);
        for (const [index, key] of protectedKeys.entries()) await writeFile(p.DROP_PARAMS_PATHS[key], base[index]);
        assert.equal((await f.writer.reconcileDropParamsTransactions()).blocked, false);
        assert.equal((await edit(f, "resolved")).status, "completed");
      });
    }
  }
});

test("AUD-004-003: CREATE/EDIT/DEACTIVATE protect ownership and preserve successful unchanged controls", async t => {
  for (const operation of ["CREATE", "EDIT", "DEACTIVATE"]) {
    for (const externalEdit of [false, true]) {
      await t.test(`${operation}/${externalEdit ? "external source" : "unchanged bytes"}`, async t => {
        const f = await fixture(t);
        const p = f.projector;
        const a = await f.load("drop-params-authoring.mjs");
        if (operation === "CREATE") {
          await writeFile(p.DROP_PARAMS_PATHS.canonicalSource, a.serializeDropParamsSource(a.INACTIVE_DROP_PARAMS));
          await p.projectDropParams();
        }
        const base = await f.bytes();
        const request = { operation, operationId: "apply-control",
          expectedSourceVersion: await p.getCurrentSourceVersion(),
          ...(operation === "DEACTIVATE" ? {} : { candidate: f.candidate }) };
        let saved;
        const run = f.writer.executeDropParamsOperation(request, { testHooks: {
          async beforeReplaceFile({ key, index }) {
            if (externalEdit && index === 0) {
              await writeFile(p.DROP_PARAMS_PATHS.canonicalSource, Buffer.concat([base[0], Buffer.from("\n ")]));
              saved = await f.bytes();
            } else if (!externalEdit) {
              // Re-saving exact expected bytes does not revoke byte ownership.
              await writeFile(p.DROP_PARAMS_PATHS[key], base[index]);
            }
          }
        } });
        if (externalEdit) {
          await assert.rejects(run, error => error.code === "reconciliation_required" && error.cause.code === "apply_state_diverged");
          assert.deepEqual(await f.bytes(), saved);
        } else {
          const result = await run;
          assert.equal(result.status, "completed");
          assert.equal(result.baseSourceVersion, request.expectedSourceVersion);
          assert.equal(result.sourceVersion, await p.getCurrentSourceVersion());
          assert.equal((await p.assertDropParamsEquality({ expectedParams:
            operation === "DEACTIVATE" ? a.INACTIVE_DROP_PARAMS : f.candidate })).ok, true);
          assert.equal((await f.writer.executeDropParamsOperation(request)).idempotent, true);
        }
        const record = JSON.parse(await readFile(path.join(f.journal, "apply-control.json")));
        assert.equal((await f.writer.inspectDropParamsTransactionStatus()).blocked, externalEdit);
        if (operation === "DEACTIVATE") {
          const archive = await readFile(path.join(f.root, record.archive.relativePath));
          const { verifyDeactivationArchive } = await f.load("drop-params-archive.mjs");
          assert.equal((await verifyDeactivationArchive(path.join(f.root, record.archive.relativePath))).sha256,
            record.archive.sha256);
          if (externalEdit) {
            assert.equal((await f.writer.reconcileDropParamsTransactions()).blocked, true);
            assert.deepEqual(await readFile(path.join(f.root, record.archive.relativePath)), archive);
          }
        }
      });
    }
  }
});

test("AUD-004-003: expected phase rejects external base/target bytes, even alongside a partial failure", async t => {
  for (const boundary of ["canonicalSource", "outerJson", "adminMirror"]) {
    for (const fail of [false, true]) {
      await t.test(`${boundary}/${fail ? "write failure" : "continue"}`, async t => {
        const f = await fixture(t);
        const a = await f.load("drop-params-authoring.mjs");
        const base = await f.bytes();
        let saved;
        await assert.rejects(edit(f, "phase-conflict", {
          async beforeReplaceFile({ key }) {
            if (key !== boundary) return;
            // An external save can equal a recorded target before our rename,
            // or revert an already replaced file to its recorded base.
            const changedKey = boundary === "adminMirror" ? "outerJson" : "canonicalSource";
            const bytes = boundary === "canonicalSource" ? a.serializeDropParamsSource(f.candidate)
              : base[protectedKeys.indexOf(changedKey)];
            await writeFile(f.projector.DROP_PARAMS_PATHS[changedKey], bytes);
            saved = await f.bytes();
            if (fail) throw new Error("injected replacement failure after external save");
          }
        }), error => error.code === "reconciliation_required");
        assert.deepEqual(await f.bytes(), saved, "base/target membership must not authorize automatic rollback");
        const journals = await f.journalBytes();
        await assert.rejects(edit(f, "later"), error => error.code === "reconciliation_required");
        assert.deepEqual(await f.journalBytes(), journals);
        // Only explicit recovery may resolve this recorded base/target mixture.
        assert.equal((await f.writer.reconcileDropParamsTransactions()).blocked, false);
        assert.deepEqual(await f.bytes(), base);
      });
    }
  }
});

test("AUD-004-003: an interrupted partial apply preserves an intervening save through interrupted recovery", async t => {
  const f = await fixture(t);
  const base = await f.bytes();
  await assert.rejects(edit(f, "interrupted-apply", { afterReplaceFile({ key }) {
    if (key === "canonicalSource") interruptRecoveryTest();
  } }), error => error.simulateProcessInterruption === true);
  // Recovery itself may be interrupted after restoring one owned file.
  const interrupted = await cli(f.root, "--input-type=module", ["-e", `
    import { readFile, writeFile } from "node:fs/promises";
    import { DROP_PARAMS_PATHS } from "./shared/drop-params/drop-params-projector.mjs";
    import { reconcileDropParamsTransactions } from "./shared/drop-params/drop-params-transaction.mjs";
    await reconcileDropParamsTransactions({ testHooks: {
      async beforeRollbackFile({ key }) {
        if (key === "outerJson") {
          const file = DROP_PARAMS_PATHS.canonicalSource;
          await writeFile(file, Buffer.concat([await readFile(file), Buffer.from("\\n ")]));
          process.exit(77);
        }
      }
    } });
  `]);
  assert.equal(interrupted.code, 77, interrupted.output);
  const saved = await f.bytes();
  assert.deepEqual(saved[0], Buffer.concat([base[0], Buffer.from("\n ")]));
  assert.equal((await f.writer.inspectDropParamsTransactionStatus()).operations[0].status, "pending");
  assert.equal((await f.writer.reconcileDropParamsTransactions()).blocked, true);
  assert.deepEqual(await f.bytes(), saved);
  assert.equal((await f.writer.inspectDropParamsTransactionStatus()).operations[0].result, null);
  await assertAllBlocked(f);
});

test("AUD-004-003: missing files and consistent external projections cannot be replaced during apply", async t => {
  for (const conflict of [...protectedKeys, "consistent-save"]) {
    await t.test(conflict, async t => {
      const f = await fixture(t);
      const p = f.projector;
      const a = await f.load("drop-params-authoring.mjs");
      const bytes = () => Promise.all(protectedKeys.map(key => readFile(p.DROP_PARAMS_PATHS[key]).catch(error => {
        if (error.code === "ENOENT") return null;
        throw error;
      })));
      let saved;
      await assert.rejects(edit(f, "external-state", { async beforeReplaceFile({ key }) {
        if (key !== "outerJson") return;
        if (conflict === "consistent-save") {
          const external = { ...f.candidate, dropName: "EXTERNALLY CONSISTENT SAVE" };
          await writeFile(p.DROP_PARAMS_PATHS.canonicalSource, a.serializeDropParamsSource(external));
          for (const projection of ["outerJson", "adminMirror"])
            await writeFile(p.DROP_PARAMS_PATHS[projection], p.serializeDropParamsJson(external));
          assert.equal((await p.assertDropParamsEquality()).ok, true);
        } else await rm(p.DROP_PARAMS_PATHS[conflict]);
        saved = await bytes();
      } }), error => error.code === "reconciliation_required" && error.cause.code === "apply_state_diverged");
      assert.deepEqual(await bytes(), saved);
      if (conflict === "canonicalSource") {
        // Reconciliation records the block, but status cannot hash a deleted source.
        await assert.rejects(f.writer.reconcileDropParamsTransactions(), error => error.code === "ENOENT");
      } else assert.equal((await f.writer.reconcileDropParamsTransactions()).blocked, true);
      assert.deepEqual(await bytes(), saved);
      const record = JSON.parse(await readFile(path.join(f.journal, "external-state.json")));
      assert.equal(record.status, "reconciliation_required");
      assert.equal(record.result, null);
      assert.ok(record.recovery);
    });
  }
});

test("AUD-003-016: every projection must validate and equal canonical params", async t => {
  const f = await fixture(t);
  const p = f.projector;
  const valid = await readFile(p.DROP_PARAMS_PATHS.outerJson);
  const invalid = ["null\n", "false\n", "0\n", '""\n', "{}\n", "[]\n", "{", ""];
  const different = p.serializeDropParamsJson(f.candidate);
  for (const text of [...invalid, different]) {
    for (const keys of [["outerJson"], ["adminMirror"], ["outerJson", "adminMirror"]]) {
      for (const key of ["outerJson", "adminMirror"])
        await writeFile(p.DROP_PARAMS_PATHS[key], keys.includes(key) ? text : valid);
      const result = await p.verifyDropParamsEquality();
      assert.equal(result.ok, false, `${keys}: ${JSON.stringify(text)}`);
      assert.ok(result.errors.length > 0);
      await assert.rejects(p.assertDropParamsEquality(), /equality verification failed/);
    }
  }
  for (const key of ["outerJson", "adminMirror"]) {
    await writeFile(p.DROP_PARAMS_PATHS.outerJson, valid);
    await writeFile(p.DROP_PARAMS_PATHS.adminMirror, valid);
    await rm(p.DROP_PARAMS_PATHS[key]);
    assert.equal((await p.verifyDropParamsEquality()).ok, false, `missing ${key}`);
  }
  await p.projectDropParams();
  assert.equal((await p.assertDropParamsEquality()).ok, true);
});

test("AUD-003-016/017: invalid external final projections block CREATE, EDIT and DEACTIVATE", async t => {
  for (const operation of ["CREATE", "EDIT", "DEACTIVATE"]) {
    await t.test(operation, async t => {
      const f = await fixture(t);
      const p = f.projector;
      if (operation === "CREATE") {
        const a = await f.load("drop-params-authoring.mjs");
        await writeFile(p.DROP_PARAMS_PATHS.canonicalSource, a.serializeDropParamsSource(a.INACTIVE_DROP_PARAMS));
        await p.projectDropParams();
      }
      const before = await f.bytes();
      const request = { operation, operationId: `invalid-${operation}`,
        expectedSourceVersion: await p.getCurrentSourceVersion(),
        ...(operation === "DEACTIVATE" ? {} : { candidate: f.candidate }) };
      await assert.rejects(f.writer.executeDropParamsOperation(request, { testHooks: {
        async beforeFinalVerification() {
          await writeFile(p.DROP_PARAMS_PATHS.outerJson, "null\n");
          await writeFile(p.DROP_PARAMS_PATHS.adminMirror, "null\n");
        }
      } }), error => error.code === "reconciliation_required" && /equality verification failed/.test(error.cause.message));
      assert.equal(await readFile(p.DROP_PARAMS_PATHS.outerJson, "utf8"), "null\n");
      assert.equal(await readFile(p.DROP_PARAMS_PATHS.adminMirror, "utf8"), "null\n");
      const status = await f.writer.inspectDropParamsTransactionStatus();
      assert.equal(status.blocked, true);
      assert.equal(status.operations[0].status, "reconciliation_required");
      assert.equal(status.operations[0].result, null);
      for (const [index, key] of protectedKeys.entries()) await writeFile(p.DROP_PARAMS_PATHS[key], before[index]);
      assert.equal((await f.writer.reconcileDropParamsTransactions()).blocked, false);
      const completed = await f.writer.executeDropParamsOperation(request);
      assert.equal(completed.status, "completed");
      assert.equal((await p.assertDropParamsEquality()).ok, true);
      assert.equal((await f.writer.executeDropParamsOperation(request)).idempotent, true);
    });
  }
});

test("AUD-003-016: partial generation/replacement never advances to final verification or completion", async t => {
  const scenarios = [
    ["partial-stage", { beforeStageFile({ key }) {
      if (key === "outerJson") throw new Error("injected projection generation failure");
    } }],
    ["invalid-stage", { async beforeStageFile({ key, path: stagedPath }) {
      if (key === "adminMirror") await writeFile(path.join(path.dirname(stagedPath), "outer.json"), "null\n");
    } }],
    ["partial-replacement", { beforeReplaceFile: failingReplace }]
  ];
  for (const [name, hooks] of scenarios) {
    await t.test(name, async t => {
      const f = await fixture(t);
      const before = await f.bytes();
      let verified = false;
      await assert.rejects(edit(f, name, { ...hooks,
        beforeFinalVerification() { verified = true; }
      }), error => error.code === "transaction_rolled_back");
      assert.equal(verified, false);
      assert.deepEqual(await f.bytes(), before);
      assert.equal((await f.writer.inspectDropParamsTransactionStatus()).operations[0].status, "rolled_back");
    });
  }
});

test("AUD-003-016: unusable final projections preserve failed-rollback and pending recovery gates", async t => {
  for (const interrupted of [false, true]) {
    await t.test(interrupted ? "pending" : "failed rollback", async t => {
      const f = await fixture(t);
      const p = f.projector;
      const before = await f.bytes();
      await assert.rejects(edit(f, "invalid-recovery", {
        async beforeFinalVerification() {
          await writeFile(p.DROP_PARAMS_PATHS.outerJson, "false\n");
          await writeFile(p.DROP_PARAMS_PATHS.adminMirror, "false\n");
          if (interrupted) throw Object.assign(new Error("interrupted invalid projection"),
            { simulateProcessInterruption: true });
        },
        ...(interrupted ? {} : { beforeRollbackFile: failingRollback })
      }), error => interrupted ? error.simulateProcessInterruption === true : error.code === "reconciliation_required");
      const status = await f.writer.inspectDropParamsTransactionStatus();
      assert.equal(status.blocked, true);
      assert.equal(status.operations[0].status, interrupted ? "pending" : "reconciliation_required");
      assert.equal(status.operations[0].result, null);
      assert.equal((await p.verifyDropParamsEquality()).ok, false);
      const journals = await f.journalBytes();
      await assertAllBlocked(f);
      const { createDropParamsAuthoringApi } = await f.load("drop-params-authoring-service.mjs");
      const api = createDropParamsAuthoringApi();
      assert.equal((await api.getState()).writer.blocked, true);
      await assert.rejects(api.preview({ operation: "EDIT",
        expectedSourceVersion: await p.getCurrentSourceVersion(), candidate: f.candidate }),
      error => error.code === "representation_drift");
      assert.deepEqual(await f.journalBytes(), journals);
      assert.equal((await f.writer.reconcileDropParamsTransactions()).blocked, true);
      for (const [index, key] of protectedKeys.entries()) await writeFile(p.DROP_PARAMS_PATHS[key], before[index]);
      const recovered = await f.writer.reconcileDropParamsTransactions();
      assert.equal(recovered.blocked, false);
      assert.equal(recovered.operations[0].status, "rolled_back");
      assert.deepEqual(await f.bytes(), before);
      assert.equal((await edit(f, "valid-after-recovery")).status, "completed");
    });
  }
});

test("AUD-003-016/017: authoring apply reports external projection conflict and recovers after resolution", async t => {
  const f = await fixture(t);
  const before = await f.bytes();
  const { createDropParamsAuthoringApi } = await f.load("drop-params-authoring-service.mjs");
  let corrupt = true;
  const api = createDropParamsAuthoringApi({ execute: (request, options) =>
    f.writer.executeDropParamsOperation(request, { ...options, testHooks: {
      async beforeFinalVerification() {
        if (corrupt) {
          await writeFile(f.projector.DROP_PARAMS_PATHS.outerJson, "0\n");
          await writeFile(f.projector.DROP_PARAMS_PATHS.adminMirror, "0\n");
        }
      }
    } }) });
  const request = { operation: "EDIT", expectedSourceVersion: await f.projector.getCurrentSourceVersion(),
    candidate: f.candidate };
  const apply = async () => {
    const preview = await api.preview(request);
    assert.equal(preview.effects.writesPerformed, false);
    return api.apply({ ...request, candidateHash: preview.candidateHash,
      planHash: preview.planHash, previewToken: preview.previewToken });
  };
  const failed = await apply();
  assert.equal(failed.ok, false);
  assert.equal(failed.result, null);
  assert.equal(failed.failure.code, "reconciliation_required");
  assert.deepEqual(failed.rollback, { verified: false, status: "reconciliation_required" });
  assert.equal(failed.reconciliationRequired, true);
  assert.equal(await readFile(f.projector.DROP_PARAMS_PATHS.outerJson, "utf8"), "0\n");
  assert.equal((await api.getState()).writer.blocked, true);
  for (const [index, key] of protectedKeys.entries()) await writeFile(f.projector.DROP_PARAMS_PATHS[key], before[index]);
  assert.equal((await f.writer.reconcileDropParamsTransactions()).blocked, false);
  corrupt = false;
  const success = await apply();
  assert.equal(success.ok, true);
  assert.equal(success.result.status, "completed");
  const state = await api.getState();
  assert.equal(state.writer.blocked, false);
  assert.equal(state.representations.equal, true);
  assert.deepEqual(state.params, f.candidate);
});

function interruptRecoveryTest() {
  throw Object.assign(new Error("simulated recovery interruption"), { simulateProcessInterruption: true });
}

test("AUD-003-017: external edits at interrupted write boundaries preserve files and recovery evidence", async t => {
  for (const boundary of ["before-replacement", ...protectedKeys]) {
    for (const conflict of [...protectedKeys, "missing-projection", "matching-external-projections"]) {
      await t.test(`${boundary}/${conflict}`, async t => {
        const f = await fixture(t);
        const p = f.projector;
        const before = await f.bytes();
        const request = { operationId: "interrupted", candidate: f.candidate,
          expectedSourceVersion: await p.getCurrentSourceVersion() };
        await assert.rejects(f.writer.editDropParams(request, { testHooks: boundary === "before-replacement"
          ? { beforeStageFile: interruptRecoveryTest }
          : { afterReplaceFile: ({ key }) => { if (key === boundary) interruptRecoveryTest(); } }
        }), error => error.simulateProcessInterruption === true);
        const journalPath = path.join(f.journal, "interrupted.json");
        const originalRecord = JSON.parse(await readFile(journalPath));
        const stage = path.join(f.journal, "stage-interrupted");
        const stageNames = await readdir(stage);
        const stageBytes = await Promise.all(stageNames.map(n => readFile(path.join(stage, n))));
        if (conflict === "missing-projection") await rm(p.DROP_PARAMS_PATHS.outerJson);
        else if (conflict === "matching-external-projections") {
          const a = await f.load("drop-params-authoring.mjs");
          const external = { ...f.candidate, dropName: "EXTERNAL CONSISTENT EDIT" };
          await writeFile(p.DROP_PARAMS_PATHS.canonicalSource, a.serializeDropParamsSource(external));
          for (const key of ["outerJson", "adminMirror"])
            await writeFile(p.DROP_PARAMS_PATHS[key], p.serializeDropParamsJson(external));
          assert.equal((await p.verifyDropParamsEquality()).ok, true);
        } else {
          // Even whitespace-only edits are outside the recorded exact-byte state.
          await writeFile(p.DROP_PARAMS_PATHS[conflict], Buffer.concat([
            await readFile(p.DROP_PARAMS_PATHS[conflict]), Buffer.from("\n ")
          ]));
        }
        const currentBytes = () => Promise.all(protectedKeys.map(key =>
          readFile(p.DROP_PARAMS_PATHS[key]).catch(error => {
            if (error.code === "ENOENT") return null;
            throw error;
          })));
        const externalBytes = await currentBytes();
        // A different operation must be blocked too, even with a current version.
        await assert.rejects(edit(f, "later"), error => error.code === "reconciliation_required");
        await assert.rejects(f.writer.editDropParams(request), error => error.code === "reconciliation_required");
        const status = await f.writer.reconcileDropParamsTransactions();
        assert.equal(status.blocked, true);
        assert.equal(status.operations.length, 1, "no later writer journal is created");
        assert.equal(status.operations[0].failure.code, "recovery_state_diverged");
        assert.deepEqual(await currentBytes(), externalBytes, "no destructive recovery on divergence");
        const unresolvedRecord = JSON.parse(await readFile(journalPath));
        assert.deepEqual(unresolvedRecord.recovery, originalRecord.recovery);
        assert.deepEqual(await readdir(stage), stageNames);
        assert.deepEqual(await Promise.all(stageNames.map(n => readFile(path.join(stage, n)))), stageBytes);
        await assert.rejects(p.projectDropParams(), blocked);
        // Independent resolution restores reviewed exact base bytes in this fixture.
        for (const [index, key] of protectedKeys.entries()) await writeFile(p.DROP_PARAMS_PATHS[key], before[index]);
        assert.equal((await f.writer.reconcileDropParamsTransactions()).blocked, false);
        await assert.rejects(readdir(stage), error => error.code === "ENOENT");
        assert.equal((await f.writer.editDropParams(request)).status, "completed");
        assert.equal((await p.assertDropParamsEquality({ expectedParams: f.candidate })).ok, true);
      });
    }
  }
});

test("AUD-003-017: recorded base/target mixtures recover normally and permit retry", async t => {
  for (const boundary of ["before-replacement", ...protectedKeys]) {
    await t.test(boundary, async t => {
      const f = await fixture(t);
      const before = await f.bytes();
      const request = { operationId: "unchanged", candidate: f.candidate,
        expectedSourceVersion: await f.projector.getCurrentSourceVersion() };
      await assert.rejects(f.writer.editDropParams(request, { testHooks: boundary === "before-replacement"
        ? { beforeStageFile: interruptRecoveryTest }
        : { afterReplaceFile: ({ key }) => { if (key === boundary) interruptRecoveryTest(); } }
      }), error => error.simulateProcessInterruption === true);
      const recovered = await f.writer.reconcileDropParamsTransactions();
      assert.equal(recovered.blocked, false);
      assert.equal(recovered.operations[0].status, boundary === "adminMirror" ? "completed" : "rolled_back");
      if (boundary !== "adminMirror") assert.deepEqual(await f.bytes(), before);
      const result = await f.writer.editDropParams(request);
      assert.equal(result.status, "completed");
      assert.equal(result.idempotent === true, boundary === "adminMirror");
    });
  }
});

test("AUD-003-017: rollback rechecks ownership after staging bytes for atomic replacement", async t => {
  const f = await fixture(t);
  const p = f.projector;
  await assert.rejects(edit(f, "boundary-race", { afterReplaceFile: ({ key }) => {
    if (key === "canonicalSource") interruptRecoveryTest();
  } }), error => error.simulateProcessInterruption === true);
  const partial = await f.bytes();
  const external = Buffer.concat([partial[0], Buffer.from("\n// external edit during recovery staging\n")]);
  const originalOpen = fs.open;
  let injected = false;
  fs.open = async (target, ...args) => {
    const handle = await originalOpen(target, ...args);
    if (path.basename(String(target)).startsWith(".drop-params.js.") && args[0] === "wx") {
      const sync = handle.sync.bind(handle);
      handle.sync = async () => {
        await sync();
        await writeFile(p.DROP_PARAMS_PATHS.canonicalSource, external);
        injected = true;
      };
    }
    return handle;
  };
  syncBuiltinESMExports();
  try {
    const status = await f.writer.reconcileDropParamsTransactions();
    assert.equal(injected, true, "inject after recovery temporary-file staging");
    assert.equal(status.blocked, true);
    assert.equal(status.operations[0].failure.code, "recovery_state_diverged");
  } finally {
    fs.open = originalOpen;
    syncBuiltinESMExports();
  }
  assert.deepEqual(await f.bytes(), [external, ...partial.slice(1)]);
  assert.ok((await readdir(f.journal)).includes("stage-boundary-race"));
});

test("AUD-003-017: deactivation without recorded targets preserves external edits and verified archive", async t => {
  const f = await fixture(t);
  const p = f.projector;
  const before = await f.bytes();
  const request = { operationId: "archive-interrupted", expectedSourceVersion: await p.getCurrentSourceVersion() };
  await assert.rejects(f.writer.deactivateDropParams(request, { testHooks: {
    beforeInactiveSerialization: interruptRecoveryTest
  } }), error => error.simulateProcessInterruption === true);
  const record = JSON.parse(await readFile(path.join(f.journal, "archive-interrupted.json")));
  assert.equal(record.recovery.targetFiles, null);
  const archivePath = path.join(f.root, record.archive.relativePath);
  const archiveBytes = await readFile(archivePath);
  const external = Buffer.concat([before[0], Buffer.from("\n// external edit after archive\n")]);
  await writeFile(p.DROP_PARAMS_PATHS.canonicalSource, external);
  assert.equal((await f.writer.reconcileDropParamsTransactions()).blocked, true);
  assert.deepEqual(await f.bytes(), [external, ...before.slice(1)]);
  assert.deepEqual(await readFile(archivePath), archiveBytes);
  await writeFile(p.DROP_PARAMS_PATHS.canonicalSource, before[0]);
  assert.equal((await f.writer.reconcileDropParamsTransactions()).blocked, false);
  const result = await f.writer.deactivateDropParams(request);
  assert.equal(result.archiveReused, true);
  assert.equal(result.status, "completed");
  assert.deepEqual(await readFile(archivePath), archiveBytes);
});

test("AUD-003-018: unresolved journals prevent new provider READY snapshots and previews until explicit reconciliation", async t => {
  const interrupt = () => {
    const error = new Error("simulated process interruption");
    error.simulateProcessInterruption = true;
    throw error;
  };
  const scenarios = [
    ["before-replacement", { beforeStageFile: interrupt }, "pending", true, "rolled_back"],
    ["partial-replacement", { afterReplaceFile: ({ key }) => {
      if (key === "canonicalSource") interrupt();
    } }, "pending", false, "rolled_back"],
    ["all-replaced", { afterReplaceFile: ({ key }) => {
      if (key === "adminMirror") interrupt();
    } }, "pending", true, "completed"],
    ["before-final-verification", { beforeFinalVerification: interrupt }, "pending", true, "completed"],
    ["failed-rollback-with-matching-files", {
      beforeStageFile() { throw new Error("injected staging failure"); },
      beforeRollbackFile: failingRollback
    }, "reconciliation_required", true, "rolled_back"]
  ];
  for (const [name, hooks, status, equal, reconciledStatus] of scenarios) {
    await t.test(name, async t => {
      const f = await fixture(t);
      const { createDropParamsAuthoringApi } = await f.load("drop-params-authoring-service.mjs");
      const adminFeatures = "admin-ui/src/features/drops";
      await mkdir(path.join(f.root, adminFeatures, "authoring"), { recursive: true });
      for (const name of ["drop-params.provider.js", "authoring/drop-params.provider.dev.js", "authoring/authoring.client.js"])
        await copyFile(path.join(repo, adminFeatures, name), path.join(f.root, adminFeatures, name));
      const { createServiceBackedDropParamsProvider } = await import(pathToFileURL(
        path.join(f.root, adminFeatures, "authoring/drop-params.provider.dev.js")).href);
      const api = createDropParamsAuthoringApi();
      const provider = createServiceBackedDropParamsProvider({ load: api.getState });
      const baseline = await provider.refresh();
      assert.equal(baseline.status, "READY");
      const publications = [];
      provider.subscribe(state => publications.push(state));

      await assert.rejects(edit(f, name, hooks), error => status === "pending"
        ? error.simulateProcessInterruption === true : error.code === "reconciliation_required");
      const before = await f.bytes();
      const journals = await f.journalBytes();
      for (const inspect of [f.writer.inspectDropParamsTransactionStatus, f.writer.getDropParamsTransactionStatus]) {
        const state = await inspect();
        assert.equal(state.blocked, true);
        assert.equal(state.operations[0].status, status);
      }
      const serviceState = await api.getState();
      assert.equal(serviceState.representations.equal, equal);
      assert.equal(serviceState.writer.busy, false, "lock release alone does not establish completion");
      assert.equal(serviceState.writer.blocked, true);
      const blockedCode = equal ? "reconciliation_required" : "representation_drift";
      await assert.rejects(provider.refresh(), error => error.code === blockedCode);
      assert.equal(provider.getSnapshot().status, "RECONCILIATION REQUIRED");
      assert.ok(publications.every(state => state.status !== "READY"));
      assert.equal(provider.getSnapshot().sourceVersion, null, "blocked provider retires action authority");
      assert.equal(provider.getSnapshot().params, null);
      assert.equal(provider.getSnapshot().metadata.serviceSnapshot.sourceVersion, baseline.sourceVersion,
        "prior snapshot remains diagnostic only; unresolved data cannot replace it");
      const fresh = createServiceBackedDropParamsProvider({ load: api.getState });
      await assert.rejects(fresh.refresh(), error => error.code === blockedCode);
      assert.equal(fresh.getSnapshot().params, null);
      const previewRequest = async () => ({ operation: "EDIT",
        expectedSourceVersion: await f.projector.getCurrentSourceVersion(),
        candidate: { ...f.candidate, dropName: `${f.candidate.dropName} NEXT` } });
      await assert.rejects(api.preview(await previewRequest()), error => error.code === blockedCode);
      assert.deepEqual(await f.bytes(), before);
      assert.deepEqual(await f.journalBytes(), journals, "status/provider/preview must leave recovery evidence untouched");

      const reconciled = await f.writer.reconcileDropParamsTransactions();
      assert.equal(reconciled.blocked, false);
      assert.equal(reconciled.operations[0].status, reconciledStatus);
      assert.equal((await provider.refresh()).status, "READY");
      const request = await previewRequest();
      const preview = await api.preview(request);
      assert.equal(preview.ok, true);
      assert.equal(preview.effects.writesPerformed, false);
      const applied = await api.apply({ ...request, candidateHash: preview.candidateHash,
        planHash: preview.planHash, previewToken: preview.previewToken });
      assert.equal(applied.result.status, "completed");
      const completed = await provider.refresh();
      assert.equal(completed.status, "READY");
      assert.equal(completed.params.dropName, request.candidate.dropName);
      assert.equal((await f.writer.inspectDropParamsTransactionStatus()).blocked, false);
    });
  }
});

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

test("existing authoring, writer, service and watcher suites pass only against a disposable repository", { timeout: 60_000 }, async t => {
  const f = await fixture(t);
  await mkdir(path.join(f.root, "scripts"));
  await copyFile(path.join(repo, "scripts/drop-params-transaction.mjs"), path.join(f.root, "scripts/drop-params-transaction.mjs"));
  for (const name of ["admin-ui/src/features/drops/drops.data.js", "admin-ui/src/features/drops/utils/token-id.js",
    "admin-ui/src/network.js", "admin-ui/src/utils/io.js", "admin-ui/src/utils/live-cfg.js",
    "admin-ui/src/utils/report-error.js", "admin-ui/src/utils/log.js", "admin-ui/src/utils/debug.js",
    "shared/drop-params/fixtures/delete-pending-claim.ps1", "drops/js/events.js"]) {
    await mkdir(path.dirname(path.join(f.root, name)), { recursive: true });
    await copyFile(path.join(repo, name), path.join(f.root, name));
  }
  for (const name of ["drop-params-authoring.test.mjs", "drop-params-transaction.test.mjs", "drop-params-authoring-service.test.mjs", "watch-drop-params-json.test.mjs"])
    await copyFile(path.join(repo, "shared/drop-params", name), path.join(f.root, "shared/drop-params", name));
  for (const names of [["drop-params-authoring.test.mjs", "drop-params-transaction.test.mjs", "drop-params-authoring-service.test.mjs"], ["watch-drop-params-json.test.mjs"]]) {
    const result = await cli(f.root, "--test", ["--experimental-test-isolation=none", ...names.map(n => `shared/drop-params/${n}`)]);
    assert.equal(result.code, 0, result.output);
    t.diagnostic(result.output.match(/# tests \d+[\s\S]*$/)?.[0] || result.output);
  }
});
