import assert from "node:assert/strict";
import {
  mkdir,
  readFile,
  readdir,
  rm,
  unlink,
  writeFile
} from "node:fs/promises";
import path from "node:path";
import { afterEach, beforeEach, test } from "node:test";

import {
  DROP_PARAMS_OPERATIONS,
  INACTIVE_DROP_PARAMS,
  serializeDropParamsSource,
  sha256SourceBytes
} from "./drop-params-authoring.mjs";
import {
  DROP_PARAMS_ARCHIVE_DIRECTORY,
  buildDeactivationArchive,
  getDeactivationArchiveFilename,
  publishDeactivationArchive,
  serializeDeactivationArchive,
  verifyDeactivationArchive
} from "./drop-params-archive.mjs";
import {
  DROP_PARAMS_PATHS,
  assertDropParamsEquality,
  getCurrentSourceVersion,
  replaceDropParamsFileAtomic,
  serializeDropParamsJson
} from "./drop-params-projector.mjs";
import {
  DROP_PARAMS_TRANSACTION_PATHS,
  createDropParams,
  deactivateDropParams,
  dropParamsWriterPathsAreRepositoryScoped,
  editDropParams,
  getDropParamsTransactionStatus,
  reconcileDropParamsTransactions
} from "./drop-params-transaction.mjs";

const testPrefix = "g2test-";
const originalFiles = Object.fromEntries(await Promise.all([
  ["canonicalSource", DROP_PARAMS_PATHS.canonicalSource],
  ["outerJson", DROP_PARAMS_PATHS.outerJson],
  ["adminMirror", DROP_PARAMS_PATHS.adminMirror]
].map(async ([key, filePath]) => [key, await readFile(filePath)])));
const originalParams = JSON.parse(originalFiles.outerJson.toString("utf8"));

function clone(value) {
  return structuredClone(value);
}

function activeFixture(suffix = "ACTIVE") {
  const params = clone(originalParams);
  params.dropScheduled = true;
  params.dropName = `SPLINTERED ${suffix}`;
  return params;
}

async function setCurrent(params) {
  const source = serializeDropParamsSource(params, {
    operation: params.dropScheduled
      ? DROP_PARAMS_OPERATIONS.ACTIVE
      : DROP_PARAMS_OPERATIONS.INACTIVE
  });
  const json = serializeDropParamsJson(params);
  await replaceDropParamsFileAtomic(DROP_PARAMS_PATHS.canonicalSource, source);
  await replaceDropParamsFileAtomic(DROP_PARAMS_PATHS.outerJson, json);
  await replaceDropParamsFileAtomic(DROP_PARAMS_PATHS.adminMirror, json);
}

async function restoreOriginalFiles() {
  await Promise.all(Object.entries(originalFiles).map(([key, bytes]) =>
    replaceDropParamsFileAtomic(DROP_PARAMS_PATHS[key], bytes)
  ));
}

async function removeTestRuntimeArtifacts() {
  const journalEntries = await readdir(DROP_PARAMS_TRANSACTION_PATHS.journalDirectory, {
    withFileTypes: true
  }).catch(error => error?.code === "ENOENT" ? [] : Promise.reject(error));
  for (const entry of journalEntries) {
    if (entry.name.includes(testPrefix)) {
      await rm(path.join(DROP_PARAMS_TRANSACTION_PATHS.journalDirectory, entry.name), {
        recursive: true,
        force: true
      });
    }
  }

  const archiveEntries = await readdir(DROP_PARAMS_ARCHIVE_DIRECTORY, {
    withFileTypes: true
  }).catch(error => error?.code === "ENOENT" ? [] : Promise.reject(error));
  for (const entry of archiveEntries) {
    if (entry.isFile() && entry.name.includes(testPrefix)) {
      await unlink(path.join(DROP_PARAMS_ARCHIVE_DIRECTORY, entry.name));
    }
  }
}

async function exactCurrentBytes() {
  return Object.fromEntries(await Promise.all(Object.entries(DROP_PARAMS_PATHS)
    .filter(([key]) => Object.hasOwn(originalFiles, key))
    .map(async ([key, filePath]) => [key, await readFile(filePath)])));
}

function assertByteMapsEqual(actual, expected) {
  for (const key of Object.keys(expected)) assert.deepEqual(actual[key], expected[key], key);
}

async function expectCode(promise, code) {
  await assert.rejects(promise, error => {
    assert.equal(error.code, code);
    return true;
  });
}

beforeEach(async () => {
  await restoreOriginalFiles();
  await removeTestRuntimeArtifacts();
});

afterEach(async () => {
  await restoreOriginalFiles();
  await removeTestRuntimeArtifacts();
});

test("CREATE commits a complete active configuration and duplicate completion is idempotent", async () => {
  const operationId = `${testPrefix}create-success`;
  const candidate = activeFixture("CREATE");
  const request = {
    operationId,
    expectedSourceVersion: await getCurrentSourceVersion(),
    candidate
  };
  const result = await createDropParams(request);
  assert.equal(result.outcome, "created");
  assert.equal(result.sourceVersion, sha256SourceBytes(serializeDropParamsSource(candidate, {
    operation: DROP_PARAMS_OPERATIONS.ACTIVE
  })));
  assert.equal((await assertDropParamsEquality({ expectedParams: candidate })).ok, true);

  const duplicate = await createDropParams(request);
  assert.equal(duplicate.idempotent, true);
  assert.equal(duplicate.operationId, operationId);
});

test("CREATE rejects active state and stale sourceVersion before journal creation", async () => {
  const active = activeFixture("CREATE REJECT");
  await setCurrent(active);
  await expectCode(createDropParams({
    operationId: `${testPrefix}create-active`,
    expectedSourceVersion: await getCurrentSourceVersion(),
    candidate: activeFixture("OTHER")
  }), "create_requires_inactive");

  const staleId = `${testPrefix}create-stale`;
  await expectCode(createDropParams({
    operationId: staleId,
    expectedSourceVersion: "0".repeat(64),
    candidate: activeFixture("STALE")
  }), "stale_source_version");
  await assert.rejects(readFile(path.join(
    DROP_PARAMS_TRANSACTION_PATHS.journalDirectory,
    `${staleId}.json`
  )), error => error.code === "ENOENT");
});

test("CREATE mutation failure restores exact prior bytes", async () => {
  const before = await exactCurrentBytes();
  await expectCode(createDropParams({
    operationId: `${testPrefix}create-rollback`,
    expectedSourceVersion: await getCurrentSourceVersion(),
    candidate: activeFixture("ROLLBACK")
  }, {
    testHooks: {
      beforeReplaceFile({ key }) {
        if (key === "outerJson") throw new Error("injected outer write failure");
      }
    }
  }), "transaction_rolled_back");
  assertByteMapsEqual(await exactCurrentBytes(), before);
});

test("EDIT commits an active edit and verifies final equality", async () => {
  const active = activeFixture("EDIT BASE");
  await setCurrent(active);
  const candidate = clone(active);
  candidate.dropName = "SPLINTERED EDITED";
  const result = await editDropParams({
    operationId: `${testPrefix}edit-success`,
    expectedSourceVersion: await getCurrentSourceVersion(),
    candidate
  });
  assert.equal(result.outcome, "edited");
  assert.equal((await assertDropParamsEquality({ expectedParams: candidate })).ok, true);
});

test("EDIT rejects inactive state and cannot deactivate", async () => {
  await expectCode(editDropParams({
    operationId: `${testPrefix}edit-inactive`,
    expectedSourceVersion: await getCurrentSourceVersion(),
    candidate: activeFixture("INACTIVE")
  }), "edit_requires_active");

  const active = activeFixture("EDIT FALSE");
  await setCurrent(active);
  const invalid = clone(active);
  invalid.dropScheduled = false;
  await assert.rejects(editDropParams({
    operationId: `${testPrefix}edit-false`,
    expectedSourceVersion: await getCurrentSourceVersion(),
    candidate: invalid
  }), /must be true for an active operation/);
});

test("DEACTIVATE archives the verified active snapshot before exact inactive reset", async () => {
  const active = activeFixture("DEACTIVATE SUCCESS");
  await setCurrent(active);
  const sourceVersion = await getCurrentSourceVersion();
  const result = await deactivateDropParams({
    operationId: `${testPrefix}deactivate-success`,
    expectedSourceVersion: sourceVersion,
    deactivationRequestedAt: "2026-09-22T20:00:00.000Z"
  }, { now: () => new Date("2026-09-22T20:00:01.000Z") });

  assert.equal(result.outcome, "deactivated");
  assert.equal(result.archiveReused, false);
  assert.equal((await assertDropParamsEquality({ expectedParams: INACTIVE_DROP_PARAMS })).ok, true);
  const verified = await verifyDeactivationArchive(path.resolve(
    path.dirname(DROP_PARAMS_PATHS.canonicalSource),
    "..",
    "..",
    ...result.archivePath.split("/")
  ));
  assert.equal(verified.payload.source.sha256, sourceVersion);
  assert.deepEqual(verified.payload.source.params, active);
  assert.equal(verified.payload.projections.outerJson.sha256, verified.payload.projections.adminMirror.sha256);
  assert.equal(Object.hasOwn(verified.payload, "liveSupply"), false);
  assert.equal(Object.hasOwn(verified.payload.source, "bytes"), false);
});

test("archive write failure performs zero config writes", async () => {
  await setCurrent(activeFixture("ARCHIVE WRITE FAILURE"));
  const before = await exactCurrentBytes();
  await expectCode(deactivateDropParams({
    operationId: `${testPrefix}archive-write-failure`,
    expectedSourceVersion: await getCurrentSourceVersion()
  }, {
    testHooks: { archive: { beforeTempWrite() { throw new Error("injected archive write failure"); } } }
  }), "transaction_rolled_back");
  assertByteMapsEqual(await exactCurrentBytes(), before);
  assert.equal((await readdir(DROP_PARAMS_ARCHIVE_DIRECTORY)).some(name =>
    name.includes(`${testPrefix}archive-write-failure`)
  ), false);
});

test("archive publication and read-back/schema failures perform zero config writes", async () => {
  const scenarios = [
    ["publication", {
      beforePublish() { throw new Error("injected publication failure"); }
    }],
    ["verify", {
      async afterPublish({ finalPath }) {
        await writeFile(finalPath, "{\"corrupt\":true}\n");
      }
    }]
  ];
  for (const [name, archiveHooks] of scenarios) {
    await setCurrent(activeFixture(`ARCHIVE ${name}`));
    const before = await exactCurrentBytes();
    await expectCode(deactivateDropParams({
      operationId: `${testPrefix}archive-${name}-failure`,
      expectedSourceVersion: await getCurrentSourceVersion()
    }, {
      testHooks: { archive: archiveHooks }
    }), "transaction_rolled_back");
    assertByteMapsEqual(await exactCurrentBytes(), before);
  }
});

test("an interrupted partial write is deterministically reconciled on retry", async () => {
  const operationId = `${testPrefix}interrupted-create`;
  const candidate = activeFixture("INTERRUPTED");
  const request = {
    operationId,
    expectedSourceVersion: await getCurrentSourceVersion(),
    candidate
  };
  await assert.rejects(createDropParams(request, {
    testHooks: {
      afterReplaceFile({ key }) {
        if (key === "canonicalSource") {
          const error = new Error("simulated process interruption");
          error.simulateProcessInterruption = true;
          throw error;
        }
      }
    }
  }), /simulated process interruption/);
  assert.equal((await getDropParamsTransactionStatus()).operations.find(operation =>
    operation.operationId === operationId
  ).status, "pending");

  const result = await createDropParams(request);
  assert.equal(result.outcome, "created");
  assert.equal((await assertDropParamsEquality({ expectedParams: candidate })).ok, true);
});

test("an interrupted DEACTIVATE after archive verification reuses the archive on retry", async () => {
  await setCurrent(activeFixture("INTERRUPTED DEACTIVATE"));
  const request = {
    operationId: `${testPrefix}interrupted-deactivate`,
    expectedSourceVersion: await getCurrentSourceVersion()
  };
  await assert.rejects(deactivateDropParams(request, {
    testHooks: {
      beforeInactiveSerialization() {
        const error = new Error("simulated deactivation interruption");
        error.simulateProcessInterruption = true;
        throw error;
      }
    }
  }), /simulated deactivation interruption/);
  assert.equal((await getDropParamsTransactionStatus()).operations.find(operation =>
    operation.operationId === request.operationId
  ).status, "pending");

  const result = await deactivateDropParams(request);
  assert.equal(result.outcome, "deactivated");
  assert.equal(result.archiveReused, true);
  assert.equal((await assertDropParamsEquality({ expectedParams: INACTIVE_DROP_PARAMS })).ok, true);
});

test("post-archive reset, projection, mirror, and final verification faults restore exact bytes", async () => {
  const scenarios = [
    ["generator", { beforeInactiveSerialization() { throw new Error("injected generator failure"); } }],
    ["reset", { beforeReplaceFile({ key }) { if (key === "canonicalSource") throw new Error("injected reset failure"); } }],
    ["projection", { beforeReplaceFile({ key }) { if (key === "outerJson") throw new Error("injected projection failure"); } }],
    ["mirror", { beforeReplaceFile({ key }) { if (key === "adminMirror") throw new Error("injected mirror failure"); } }],
    ["equality", {
      async beforeFinalVerification() {
        await replaceDropParamsFileAtomic(DROP_PARAMS_PATHS.adminMirror, "{}\n");
      }
    }]
  ];

  for (const [name, testHooks] of scenarios) {
    const active = activeFixture(`FAULT ${name}`);
    await setCurrent(active);
    const before = await exactCurrentBytes();
    const operationId = `${testPrefix}deactivate-${name}`;
    await expectCode(deactivateDropParams({
      operationId,
      expectedSourceVersion: await getCurrentSourceVersion()
    }, { testHooks }), "transaction_rolled_back");
    assertByteMapsEqual(await exactCurrentBytes(), before);
    assert.equal((await readdir(DROP_PARAMS_ARCHIVE_DIRECTORY)).some(filename =>
      filename.includes(operationId)
    ), true, `${name} archive must remain after rollback`);
  }
});

test("rollback verification failure blocks later writers until explicit reconciliation", async () => {
  const active = activeFixture("RECONCILE");
  await setCurrent(active);
  const sourceVersion = await getCurrentSourceVersion();
  await expectCode(deactivateDropParams({
    operationId: `${testPrefix}needs-reconcile`,
    expectedSourceVersion: sourceVersion
  }, {
    testHooks: {
      beforeReplaceFile({ key }) {
        if (key === "outerJson") throw new Error("injected projection failure");
      },
      beforeRollbackFile({ key }) {
        if (key === "canonicalSource") throw new Error("injected rollback failure");
      }
    }
  }), "reconciliation_required");

  assert.equal((await getDropParamsTransactionStatus()).blocked, true);
  await expectCode(editDropParams({
    operationId: `${testPrefix}blocked-later`,
    expectedSourceVersion: sourceVersion,
    candidate: activeFixture("BLOCKED")
  }), "reconciliation_required");

  await setCurrent(active);
  const reconciled = await reconcileDropParamsTransactions();
  assert.equal(reconciled.blocked, false);
  assert.equal(reconciled.operations.find(operation =>
    operation.operationId === `${testPrefix}needs-reconcile`
  ).status, "rolled_back");
});

test("new DEACTIVATE against inactive state is an explicit no-op without archive", async () => {
  const beforeNames = new Set(await readdir(DROP_PARAMS_ARCHIVE_DIRECTORY));
  const result = await deactivateDropParams({
    operationId: `${testPrefix}already-inactive`,
    expectedSourceVersion: await getCurrentSourceVersion()
  });
  assert.equal(result.outcome, "already_inactive");
  assert.equal(result.archivePath, null);
  assert.deepEqual(new Set(await readdir(DROP_PARAMS_ARCHIVE_DIRECTORY)), beforeNames);
});

test("same DEACTIVATE retry reuses a matching verified archive after rollback", async () => {
  await setCurrent(activeFixture("RETRY"));
  const request = {
    operationId: `${testPrefix}deactivate-retry`,
    expectedSourceVersion: await getCurrentSourceVersion()
  };
  await expectCode(deactivateDropParams(request, {
    testHooks: { beforeInactiveSerialization() { throw new Error("retry me"); } }
  }), "transaction_rolled_back");
  const result = await deactivateDropParams(request);
  assert.equal(result.outcome, "deactivated");
  assert.equal(result.archiveReused, true);
});

test("archive collision never overwrites an unrelated artifact", async () => {
  const active = activeFixture("COLLISION");
  await setCurrent(active);
  const [sourceBytes, outerBytes, adminBytes] = await Promise.all([
    readFile(DROP_PARAMS_PATHS.canonicalSource),
    readFile(DROP_PARAMS_PATHS.outerJson),
    readFile(DROP_PARAMS_PATHS.adminMirror)
  ]);
  const common = {
    operationId: `${testPrefix}collision`,
    archiveCreatedAt: "2026-09-22T21:00:00.000Z",
    sourceSha256: sha256SourceBytes(sourceBytes),
    sourceParams: active,
    outerSha256: sha256SourceBytes(outerBytes),
    adminMirrorSha256: sha256SourceBytes(adminBytes)
  };
  const expected = buildDeactivationArchive({
    ...common,
    deactivationRequestedAt: "2026-09-22T20:59:59.000Z"
  });
  const unrelated = buildDeactivationArchive({
    ...common,
    deactivationRequestedAt: "2026-09-22T20:59:58.000Z"
  });
  await mkdir(DROP_PARAMS_ARCHIVE_DIRECTORY, { recursive: true });
  const archivePath = path.join(DROP_PARAMS_ARCHIVE_DIRECTORY, getDeactivationArchiveFilename(expected));
  const unrelatedBytes = Buffer.from(serializeDeactivationArchive(unrelated));
  await writeFile(archivePath, unrelatedBytes, { flag: "wx" });
  await assert.rejects(publishDeactivationArchive(expected), error => error.code === "archive_collision");
  assert.deepEqual(await readFile(archivePath), unrelatedBytes);
});

test("source/projection/mirror drift blocks before mutation", async () => {
  const sourceVersion = await getCurrentSourceVersion();
  await replaceDropParamsFileAtomic(DROP_PARAMS_PATHS.adminMirror, "{}\n");
  await expectCode(createDropParams({
    operationId: `${testPrefix}drift`,
    expectedSourceVersion: sourceVersion,
    candidate: activeFixture("DRIFT")
  }), "representation_drift");
  await assert.rejects(readFile(path.join(
    DROP_PARAMS_TRANSACTION_PATHS.journalDirectory,
    `${testPrefix}drift.json`
  )), error => error.code === "ENOENT");
});

test("concurrent transactions serialize and preserve one owner", async () => {
  const expectedSourceVersion = await getCurrentSourceVersion();
  const candidate = activeFixture("CONCURRENT");
  const results = await Promise.allSettled([
    createDropParams({
      operationId: `${testPrefix}concurrent-a`,
      expectedSourceVersion,
      candidate
    }, { lockOptions: { timeoutMs: 2_000, retryMs: 5 } }),
    createDropParams({
      operationId: `${testPrefix}concurrent-b`,
      expectedSourceVersion,
      candidate
    }, { lockOptions: { timeoutMs: 2_000, retryMs: 5 } })
  ]);
  assert.equal(results.filter(result => result.status === "fulfilled").length, 1);
  const rejected = results.find(result => result.status === "rejected");
  assert.equal(rejected.reason.code, "stale_source_version");
  assert.equal((await assertDropParamsEquality({ expectedParams: candidate })).ok, true);
});

test("writer surface is fixed-path and has no external mutation dependencies", async () => {
  assert.equal(dropParamsWriterPathsAreRepositoryScoped(), true);
  assert.equal((await getDropParamsTransactionStatus()).sourceVersion, await getCurrentSourceVersion());
  const [writerSource, archiveSource, cliSource] = await Promise.all([
    readFile(new URL("./drop-params-transaction.mjs", import.meta.url), "utf8"),
    readFile(new URL("./drop-params-archive.mjs", import.meta.url), "utf8"),
    readFile(new URL("../../scripts/drop-params-transaction.mjs", import.meta.url), "utf8")
  ]);
  const combined = `${writerSource}\n${archiveSource}\n${cliSource}`;
  assert.doesNotMatch(combined, /node:child_process|@airgap|Beacon|github|GitHub|Webflow|wallet/i);
  await assert.rejects(createDropParams({
    operationId: `${testPrefix}caller-path`,
    expectedSourceVersion: await getCurrentSourceVersion(),
    candidate: activeFixture("PATH"),
    path: "outside-the-repository"
  }), /Unsupported CREATE request field: path/);
});
