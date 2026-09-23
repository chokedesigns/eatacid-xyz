import { randomUUID } from "node:crypto";
import {
  mkdir,
  open,
  readFile,
  readdir,
  rename,
  rm,
  unlink
} from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";

import {
  DROP_PARAMS_OPERATIONS as VALIDATION_OPERATIONS,
  INACTIVE_DROP_PARAMS,
  assertValidDropParams,
  getCandidateSourceVersion,
  getPlanVersion,
  serializeDropParamsSource,
  sha256SourceBytes,
  toCanonicalDropParams
} from "./drop-params-authoring.mjs";
import {
  DROP_PARAMS_PATHS,
  DROP_PARAMS_REPO_ROOT,
  acquireDropParamsLock,
  assertDropParamsEquality,
  replaceDropParamsFileAtomic,
  serializeDropParamsJson
} from "./drop-params-projector.mjs";
import {
  DROP_PARAMS_ARCHIVE_DIRECTORY,
  assertValidOperationId,
  buildDeactivationArchive,
  getDeactivationArchiveFilename,
  publishDeactivationArchive,
  verifyDeactivationArchive
} from "./drop-params-archive.mjs";

export const DROP_PARAMS_WRITER_OPERATIONS = Object.freeze({
  CREATE: "CREATE",
  EDIT: "EDIT",
  DEACTIVATE: "DEACTIVATE"
});

export const DROP_PARAMS_OPERATION_STATUSES = Object.freeze({
  PENDING: "pending",
  COMPLETED: "completed",
  ROLLED_BACK: "rolled_back",
  RECONCILIATION_REQUIRED: "reconciliation_required"
});

const JOURNAL_SCHEMA_VERSION = 1;
const moduleDirectory = path.dirname(DROP_PARAMS_PATHS.canonicalSource);
const journalDirectory = path.join(moduleDirectory, ".drop-params.operations");
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

export const DROP_PARAMS_TRANSACTION_PATHS = Object.freeze({
  journalDirectory,
  archiveDirectory: DROP_PARAMS_ARCHIVE_DIRECTORY
});

const fileDefinitions = Object.freeze({
  canonicalSource: Object.freeze({
    path: DROP_PARAMS_PATHS.canonicalSource,
    relativePath: "shared/drop-params/drop-params.js",
    stageName: "canonical-source.mjs"
  }),
  outerJson: Object.freeze({
    path: DROP_PARAMS_PATHS.outerJson,
    relativePath: "shared/drop-params/drop-params.json",
    stageName: "outer.json"
  }),
  adminMirror: Object.freeze({
    path: DROP_PARAMS_PATHS.adminMirror,
    relativePath: "admin-ui/src/drop-params.mirror.json",
    stageName: "admin-mirror.json"
  })
});

export class DropParamsTransactionError extends Error {
  constructor(code, message, options = {}) {
    super(message, options);
    this.name = "DropParamsTransactionError";
    this.code = code;
    if (options.operationId) this.operationId = options.operationId;
    if (options.status) this.status = options.status;
  }
}

function nowIso(options) {
  const value = typeof options.now === "function" ? options.now() : new Date();
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.valueOf())) throw new TypeError("transaction clock returned an invalid date");
  return date.toISOString();
}

function normalizeOperation(operation) {
  const normalized = String(operation || "").toUpperCase();
  if (!Object.values(DROP_PARAMS_WRITER_OPERATIONS).includes(normalized)) {
    throw new TypeError(`Unsupported Drop Params writer operation: ${operation}`);
  }
  return normalized;
}

function assertSourceVersion(sourceVersion) {
  if (typeof sourceVersion !== "string" || !SHA256_PATTERN.test(sourceVersion)) {
    throw new TypeError("expectedSourceVersion must be a lowercase SHA-256 hex digest");
  }
  return sourceVersion;
}

function relativePath(filePath) {
  return path.relative(DROP_PARAMS_REPO_ROOT, filePath).split(path.sep).join("/");
}

function journalPath(operationId) {
  assertValidOperationId(operationId);
  return path.join(journalDirectory, `${operationId}.json`);
}

function stageDirectory(operationId) {
  assertValidOperationId(operationId);
  return path.join(journalDirectory, `stage-${operationId}`);
}

function assertFixedJournalPath(filePath) {
  const resolved = path.resolve(filePath);
  const relative = path.relative(path.resolve(journalDirectory), resolved);
  if (relative === "" || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new DropParamsTransactionError(
      "journal_path_invalid",
      "Drop Params journal path is outside the fixed journal directory"
    );
  }
  return resolved;
}

async function readIfExists(filePath) {
  try {
    return await readFile(filePath);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function evaluateSourceBytes(bytes) {
  const dataUrl = `data:text/javascript;base64,${Buffer.from(bytes).toString("base64")}`;
  const namespace = await import(`${dataUrl}#${randomUUID()}`);
  assertValidDropParams(namespace.default);
  return toCanonicalDropParams(namespace.default);
}

async function readVerifiedCurrentState(expectedSourceVersion) {
  const [sourceBytes, outerBytes, adminBytes] = await Promise.all([
    readFile(fileDefinitions.canonicalSource.path),
    readFile(fileDefinitions.outerJson.path),
    readFile(fileDefinitions.adminMirror.path)
  ]);
  const sourceVersion = sha256SourceBytes(sourceBytes);
  if (sourceVersion !== expectedSourceVersion) {
    throw new DropParamsTransactionError(
      "stale_source_version",
      `Expected Drop Params sourceVersion ${expectedSourceVersion}, found ${sourceVersion}`
    );
  }

  let params;
  let outerParams;
  let adminParams;
  try {
    [params, outerParams, adminParams] = await Promise.all([
      evaluateSourceBytes(sourceBytes),
      Promise.resolve(JSON.parse(outerBytes.toString("utf8"))),
      Promise.resolve(JSON.parse(adminBytes.toString("utf8")))
    ]);
  } catch (error) {
    throw new DropParamsTransactionError(
      "current_state_invalid",
      `Current Drop Params representations could not be evaluated: ${error.message}`,
      { cause: error }
    );
  }

  const equalityErrors = [];
  if (!isDeepStrictEqual(params, outerParams)) equalityErrors.push("outer JSON differs from canonical source");
  if (!isDeepStrictEqual(params, adminParams)) equalityErrors.push("Admin mirror differs from canonical source");
  if (!outerBytes.equals(adminBytes)) equalityErrors.push("outer JSON and Admin mirror bytes differ");
  if (equalityErrors.length > 0) {
    throw new DropParamsTransactionError(
      "representation_drift",
      `Drop Params source/projection/mirror drift blocks mutation:\n- ${equalityErrors.join("\n- ")}`
    );
  }

  return {
    params,
    sourceVersion,
    files: {
      canonicalSource: sourceBytes,
      outerJson: outerBytes,
      adminMirror: adminBytes
    }
  };
}

function snapshotFiles(files) {
  return Object.fromEntries(Object.entries(fileDefinitions).map(([key, definition]) => {
    const bytes = files[key] ?? null;
    return [key, {
      path: definition.relativePath,
      exists: bytes !== null,
      sha256: bytes === null ? null : sha256SourceBytes(bytes),
      bytesBase64: bytes === null ? null : Buffer.from(bytes).toString("base64")
    }];
  }));
}

function targetFileHashes(targets) {
  return Object.fromEntries(Object.entries(fileDefinitions).map(([key, definition]) => [key, {
    path: definition.relativePath,
    exists: true,
    sha256: sha256SourceBytes(targets[key])
  }]));
}

async function filesMatch(fileState) {
  for (const [key, definition] of Object.entries(fileDefinitions)) {
    const expected = fileState?.[key];
    if (!expected || expected.path !== definition.relativePath) return false;
    const bytes = await readIfExists(definition.path);
    if (expected.exists === false) {
      if (bytes !== null) return false;
    } else if (!bytes || sha256SourceBytes(bytes) !== expected.sha256) {
      return false;
    }
  }
  return true;
}

async function restoreSnapshot(snapshot, options = {}) {
  const failures = [];
  for (const [key, definition] of Object.entries(fileDefinitions)) {
    const saved = snapshot?.[key];
    try {
      if (!saved || saved.path !== definition.relativePath) {
        throw new Error(`invalid recovery snapshot for ${key}`);
      }
      if (typeof options.testHooks?.beforeRollbackFile === "function") {
        await options.testHooks.beforeRollbackFile({ key, path: definition.path });
      }
      if (saved.exists) {
        const bytes = Buffer.from(saved.bytesBase64, "base64");
        if (sha256SourceBytes(bytes) !== saved.sha256) {
          throw new Error(`recovery bytes for ${key} do not match their recorded hash`);
        }
        await replaceDropParamsFileAtomic(definition.path, bytes);
      } else {
        await unlink(definition.path).catch(error => {
          if (error?.code !== "ENOENT") throw error;
        });
      }
    } catch (error) {
      failures.push(`${key}: ${error.message}`);
    }
  }
  const verified = await filesMatch(snapshot).catch(() => false);
  if (!verified) failures.push("restored files do not match the exact prior snapshot");
  return { ok: failures.length === 0, errors: failures };
}

function validateJournalRecord(record) {
  if (!record || record.schemaVersion !== JOURNAL_SCHEMA_VERSION) {
    throw new DropParamsTransactionError("journal_invalid", "Drop Params operation journal has an invalid schema version");
  }
  assertValidOperationId(record.operationId);
  normalizeOperation(record.operation);
  if (!Object.values(DROP_PARAMS_OPERATION_STATUSES).includes(record.status)) {
    throw new DropParamsTransactionError("journal_invalid", "Drop Params operation journal has an invalid status");
  }
  if (!SHA256_PATTERN.test(record.baseSourceVersion) || !SHA256_PATTERN.test(record.planHash)) {
    throw new DropParamsTransactionError("journal_invalid", "Drop Params operation journal has invalid version hashes");
  }
  return record;
}

async function readJournalRecord(operationId) {
  const bytes = await readIfExists(journalPath(operationId));
  if (!bytes) return null;
  try {
    const record = validateJournalRecord(JSON.parse(bytes.toString("utf8")));
    if (record.operationId !== operationId) {
      throw new DropParamsTransactionError(
        "journal_invalid",
        `Drop Params journal filename does not match operationId ${record.operationId}`
      );
    }
    return record;
  } catch (error) {
    if (error instanceof DropParamsTransactionError) throw error;
    throw new DropParamsTransactionError(
      "journal_invalid",
      `Drop Params operation journal ${operationId} is invalid: ${error.message}`,
      { cause: error }
    );
  }
}

async function writeJournalRecord(record) {
  validateJournalRecord(record);
  await mkdir(journalDirectory, { recursive: true });
  const finalPath = assertFixedJournalPath(journalPath(record.operationId));
  const temporaryPath = assertFixedJournalPath(path.join(
    journalDirectory,
    `.${record.operationId}.${process.pid}.${randomUUID()}.tmp`
  ));
  let handle;
  try {
    handle = await open(temporaryPath, "wx");
    await handle.writeFile(`${JSON.stringify(record, null, 2)}\n`, "utf8");
    await handle.sync();
    await handle.close();
    handle = null;
    await rename(temporaryPath, finalPath);
  } finally {
    if (handle) await handle.close().catch(() => {});
    await unlink(temporaryPath).catch(() => {});
  }
  return record;
}

async function listJournalRecords() {
  let entries;
  try {
    entries = await readdir(journalDirectory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
  const records = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json") || entry.name.startsWith(".")) continue;
    const operationId = entry.name.slice(0, -5);
    records.push(await readJournalRecord(operationId));
  }
  return records;
}

function archiveAbsolutePath(archive) {
  if (!archive?.relativePath?.startsWith("shared/drop-params/archive/")) {
    throw new DropParamsTransactionError("journal_invalid", "journal archive path is invalid");
  }
  const resolved = path.resolve(DROP_PARAMS_REPO_ROOT, ...archive.relativePath.split("/"));
  if (path.dirname(resolved) !== path.resolve(DROP_PARAMS_ARCHIVE_DIRECTORY)) {
    throw new DropParamsTransactionError("journal_invalid", "journal archive path is outside the archive directory");
  }
  return resolved;
}

async function archiveMatches(record) {
  if (!record.archive) return true;
  try {
    const verified = await verifyDeactivationArchive(archiveAbsolutePath(record.archive), {
      expectedPayload: record.archive.payload
    });
    return !record.archive.sha256 || verified.sha256 === record.archive.sha256;
  } catch {
    return false;
  }
}

function completedRecord(record, timestamp) {
  return {
    ...record,
    status: DROP_PARAMS_OPERATION_STATUSES.COMPLETED,
    updatedAt: timestamp,
    recovery: null
  };
}

function rolledBackRecord(record, timestamp, failure) {
  return {
    ...record,
    status: DROP_PARAMS_OPERATION_STATUSES.ROLLED_BACK,
    updatedAt: timestamp,
    failure: failure ? { message: failure.message, code: failure.code || "transaction_failed" } : null,
    recovery: null,
    result: null
  };
}

async function reconcileRecord(record, options = {}) {
  if (![DROP_PARAMS_OPERATION_STATUSES.PENDING, DROP_PARAMS_OPERATION_STATUSES.RECONCILIATION_REQUIRED].includes(record.status)) {
    return record;
  }
  const recovery = record.recovery;
  if (!recovery?.baseFiles ||
      !Object.hasOwn(recovery, "targetFiles") ||
      !recovery?.result) {
    throw new DropParamsTransactionError(
      "journal_invalid",
      `Operation ${record.operationId} lacks recovery data`
    );
  }

  if (recovery.targetFiles &&
      await filesMatch(recovery.targetFiles) &&
      await archiveMatches(record)) {
    const next = completedRecord({ ...record, result: recovery.result }, nowIso(options));
    await writeJournalRecord(next);
    await rm(stageDirectory(record.operationId), { recursive: true, force: true });
    return next;
  }
  if (await filesMatch(recovery.baseFiles)) {
    const next = rolledBackRecord(record, nowIso(options), {
      message: "interrupted operation reconciled to its exact prior files",
      code: "interrupted_before_completion"
    });
    await writeJournalRecord(next);
    await rm(stageDirectory(record.operationId), { recursive: true, force: true });
    return next;
  }

  const rollback = await restoreSnapshot(recovery.baseFiles, options);
  if (rollback.ok) {
    const next = rolledBackRecord(record, nowIso(options), {
      message: "interrupted partial operation restored to its exact prior files",
      code: "interrupted_partial_write"
    });
    await writeJournalRecord(next);
    await rm(stageDirectory(record.operationId), { recursive: true, force: true });
    return next;
  }

  const next = {
    ...record,
    status: DROP_PARAMS_OPERATION_STATUSES.RECONCILIATION_REQUIRED,
    updatedAt: nowIso(options),
    failure: {
      code: "rollback_verification_failed",
      message: rollback.errors.join("; ")
    }
  };
  await writeJournalRecord(next);
  return next;
}

async function reconcilePendingOperations(options = {}) {
  const records = await listJournalRecords();
  const blocked = records.filter(record =>
    record.status === DROP_PARAMS_OPERATION_STATUSES.RECONCILIATION_REQUIRED
  );
  if (blocked.length > 0 && options.includeReconciliationRequired !== true) {
    throw new DropParamsTransactionError(
      "reconciliation_required",
      `Drop Params writes are blocked by operation(s): ${blocked.map(record => record.operationId).join(", ")}`
    );
  }
  const reconciled = [];
  for (const record of records) {
    if (record.status === DROP_PARAMS_OPERATION_STATUSES.PENDING ||
        (options.includeReconciliationRequired === true &&
         record.status === DROP_PARAMS_OPERATION_STATUSES.RECONCILIATION_REQUIRED)) {
      reconciled.push(await reconcileRecord(record, options));
    } else {
      reconciled.push(record);
    }
  }
  return reconciled;
}

export function getDropParamsRequestPlanHash(operation, expectedSourceVersion, candidate) {
  const normalizedOperation = normalizeOperation(operation);
  const normalizedSourceVersion = assertSourceVersion(expectedSourceVersion);
  return getPlanVersion(`${JSON.stringify({
    operation: normalizedOperation,
    expectedSourceVersion: normalizedSourceVersion,
    candidateHash: candidate ? getCandidateSourceVersion(candidate, {
      operation: VALIDATION_OPERATIONS.ACTIVE
    }) : null
  })}\n`);
}

function assertExistingOperationMatches(record, operation, planHash) {
  if (record.operation !== operation || record.planHash !== planHash) {
    throw new DropParamsTransactionError(
      "operation_id_conflict",
      `operationId ${record.operationId} is already associated with a different Drop Params plan`,
      { operationId: record.operationId, status: record.status }
    );
  }
}

async function writeStageFile(filePath, bytes) {
  assertFixedJournalPath(filePath);
  let handle;
  try {
    handle = await open(filePath, "wx");
    await handle.writeFile(bytes);
    await handle.sync();
    await handle.close();
    handle = null;
  } finally {
    if (handle) await handle.close().catch(() => {});
  }
}

async function stageAndVerifyTargets(operationId, targets, validationOperation, options = {}) {
  const directory = assertFixedJournalPath(stageDirectory(operationId));
  await rm(directory, { recursive: true, force: true });
  await mkdir(directory, { recursive: true });
  const staged = {};
  for (const [key, definition] of Object.entries(fileDefinitions)) {
    const stagedPath = assertFixedJournalPath(path.join(directory, definition.stageName));
    if (typeof options.testHooks?.beforeStageFile === "function") {
      await options.testHooks.beforeStageFile({ key, path: stagedPath });
    }
    await writeStageFile(stagedPath, targets[key]);
    staged[key] = stagedPath;
  }

  const sourceUrl = pathToFileURL(staged.canonicalSource);
  sourceUrl.searchParams.set("operationId", operationId);
  sourceUrl.searchParams.set("nonce", randomUUID());
  const namespace = await import(sourceUrl.href);
  assertValidDropParams(namespace.default, { operation: validationOperation });
  const [outerBytes, adminBytes] = await Promise.all([
    readFile(staged.outerJson),
    readFile(staged.adminMirror)
  ]);
  const outer = JSON.parse(outerBytes.toString("utf8"));
  const admin = JSON.parse(adminBytes.toString("utf8"));
  if (!isDeepStrictEqual(namespace.default, outer) ||
      !isDeepStrictEqual(namespace.default, admin) ||
      !outerBytes.equals(adminBytes)) {
    throw new DropParamsTransactionError(
      "stage_verification_failed",
      "Staged Drop Params source/projection/mirror are not equal"
    );
  }
  return staged;
}

async function replaceTargets(staged, options = {}) {
  let index = 0;
  for (const [key, definition] of Object.entries(fileDefinitions)) {
    if (typeof options.testHooks?.beforeReplaceFile === "function") {
      await options.testHooks.beforeReplaceFile({ key, index, path: definition.path });
    }
    await rename(staged[key], definition.path);
    if (typeof options.testHooks?.afterReplaceFile === "function") {
      await options.testHooks.afterReplaceFile({ key, index, path: definition.path });
    }
    index += 1;
  }
}

function publicRecord(record) {
  return {
    operationId: record.operationId,
    operation: record.operation,
    status: record.status,
    baseSourceVersion: record.baseSourceVersion,
    candidateHash: record.candidateHash,
    planHash: record.planHash,
    archivePath: record.archive?.relativePath || null,
    archiveSha256: record.archive?.sha256 || null,
    result: record.result || null,
    failure: record.failure || null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

async function executeLocked(request, options) {
  const operation = normalizeOperation(request.operation);
  const allowedRequestKeys = new Set([
    "operation",
    "operationId",
    "expectedSourceVersion",
    ...(operation === DROP_PARAMS_WRITER_OPERATIONS.DEACTIVATE
      ? ["deactivationRequestedAt"]
      : ["candidate"])
  ]);
  for (const key of Object.keys(request)) {
    if (!allowedRequestKeys.has(key)) {
      throw new TypeError(`Unsupported ${operation} request field: ${key}`);
    }
  }
  const operationId = request.operationId || randomUUID();
  assertValidOperationId(operationId);
  const expectedSourceVersion = assertSourceVersion(request.expectedSourceVersion);

  let candidate = null;
  if (operation === DROP_PARAMS_WRITER_OPERATIONS.CREATE || operation === DROP_PARAMS_WRITER_OPERATIONS.EDIT) {
    candidate = toCanonicalDropParams(request.candidate, {
      operation: VALIDATION_OPERATIONS.ACTIVE
    });
  } else if (request.candidate !== undefined) {
    throw new TypeError("DEACTIVATE does not accept a candidate configuration");
  }
  const planHash = getDropParamsRequestPlanHash(operation, expectedSourceVersion, candidate);

  await reconcilePendingOperations(options);
  let existing = await readJournalRecord(operationId);
  if (existing) {
    assertExistingOperationMatches(existing, operation, planHash);
    if (existing.status === DROP_PARAMS_OPERATION_STATUSES.COMPLETED) {
      return { ...existing.result, idempotent: true };
    }
    if (existing.status === DROP_PARAMS_OPERATION_STATUSES.RECONCILIATION_REQUIRED) {
      throw new DropParamsTransactionError(
        "reconciliation_required",
        `Operation ${operationId} requires reconciliation before retry`,
        { operationId, status: existing.status }
      );
    }
  }

  const current = await readVerifiedCurrentState(expectedSourceVersion);
  if (operation === DROP_PARAMS_WRITER_OPERATIONS.CREATE && current.params.dropScheduled !== false) {
    throw new DropParamsTransactionError("create_requires_inactive", "CREATE requires an inactive current Drop Params source");
  }
  if (operation === DROP_PARAMS_WRITER_OPERATIONS.EDIT && current.params.dropScheduled !== true) {
    throw new DropParamsTransactionError("edit_requires_active", "EDIT requires an active current Drop Params source");
  }

  const timestamp = nowIso(options);
  if (operation === DROP_PARAMS_WRITER_OPERATIONS.DEACTIVATE && current.params.dropScheduled !== true) {
    const result = {
      operationId,
      operation,
      status: DROP_PARAMS_OPERATION_STATUSES.COMPLETED,
      outcome: "already_inactive",
      baseSourceVersion: current.sourceVersion,
      sourceVersion: current.sourceVersion,
      candidateHash: null,
      planHash,
      archivePath: null,
      archiveSha256: null,
      archiveReused: false,
      projections: {
        outerJsonSha256: sha256SourceBytes(current.files.outerJson),
        adminMirrorSha256: sha256SourceBytes(current.files.adminMirror)
      }
    };
    const record = {
      schemaVersion: JOURNAL_SCHEMA_VERSION,
      operationId,
      operation,
      status: DROP_PARAMS_OPERATION_STATUSES.COMPLETED,
      baseSourceVersion: current.sourceVersion,
      candidateHash: null,
      planHash,
      createdAt: existing?.createdAt || timestamp,
      updatedAt: timestamp,
      archive: null,
      recovery: null,
      failure: null,
      result
    };
    await writeJournalRecord(record);
    return result;
  }

  let targets;
  let archive = existing?.archive || null;
  let candidateHash = null;
  if (candidate) {
    const sourceText = serializeDropParamsSource(candidate, {
      operation: VALIDATION_OPERATIONS.ACTIVE
    });
    const jsonText = serializeDropParamsJson(candidate);
    targets = {
      canonicalSource: Buffer.from(sourceText),
      outerJson: Buffer.from(jsonText),
      adminMirror: Buffer.from(jsonText)
    };
    candidateHash = sha256SourceBytes(targets.canonicalSource);
  } else {
    if (!archive) {
      const requestedAt = request.deactivationRequestedAt || timestamp;
      const parsedRequestedAt = new Date(requestedAt);
      if (Number.isNaN(parsedRequestedAt.valueOf()) || parsedRequestedAt.toISOString() !== requestedAt) {
        throw new TypeError("deactivationRequestedAt must be a canonical UTC ISO timestamp");
      }
      const payload = buildDeactivationArchive({
        operationId,
        archiveCreatedAt: timestamp,
        deactivationRequestedAt: requestedAt,
        sourceSha256: current.sourceVersion,
        sourceParams: current.params,
        outerSha256: sha256SourceBytes(current.files.outerJson),
        adminMirrorSha256: sha256SourceBytes(current.files.adminMirror)
      });
      archive = {
        relativePath: `shared/drop-params/archive/${getDeactivationArchiveFilename(payload)}`,
        sha256: null,
        payload,
        reused: false
      };
    }
    targets = null;
  }

  const baseFiles = snapshotFiles(current.files);
  const initialTargets = targets;
  const outcome = operation === DROP_PARAMS_WRITER_OPERATIONS.CREATE
    ? "created"
    : operation === DROP_PARAMS_WRITER_OPERATIONS.EDIT
      ? "edited"
      : "deactivated";
  const result = {
    operationId,
    operation,
    status: DROP_PARAMS_OPERATION_STATUSES.COMPLETED,
    outcome,
    baseSourceVersion: current.sourceVersion,
    sourceVersion: initialTargets
      ? sha256SourceBytes(initialTargets.canonicalSource)
      : null,
    candidateHash,
    planHash,
    archivePath: archive?.relativePath || null,
    archiveSha256: archive?.sha256 || null,
    archiveReused: archive?.reused || false,
    projections: initialTargets ? {
      outerJsonSha256: sha256SourceBytes(initialTargets.outerJson),
      adminMirrorSha256: sha256SourceBytes(initialTargets.adminMirror)
    } : null
  };
  let record = {
    schemaVersion: JOURNAL_SCHEMA_VERSION,
    operationId,
    operation,
    status: DROP_PARAMS_OPERATION_STATUSES.PENDING,
    baseSourceVersion: current.sourceVersion,
    candidateHash,
    planHash,
    createdAt: existing?.createdAt || timestamp,
    updatedAt: timestamp,
    archive,
    recovery: {
      baseFiles,
      targetFiles: initialTargets ? targetFileHashes(initialTargets) : null,
      result
    },
    failure: null,
    result: null
  };
  await writeJournalRecord(record);

  try {
    if (operation === DROP_PARAMS_WRITER_OPERATIONS.DEACTIVATE) {
      const published = await publishDeactivationArchive(archive.payload, {
        testHooks: options.testHooks?.archive
      });
      archive = {
        ...archive,
        sha256: published.sha256,
        reused: published.reused
      };
      result.archiveSha256 = published.sha256;
      result.archiveReused = published.reused;
      record = {
        ...record,
        archive,
        recovery: { ...record.recovery, result },
        updatedAt: nowIso(options)
      };
      await writeJournalRecord(record);
      if (typeof options.testHooks?.beforeInactiveSerialization === "function") {
        await options.testHooks.beforeInactiveSerialization();
      }
      targets = {
        canonicalSource: Buffer.from(serializeDropParamsSource(INACTIVE_DROP_PARAMS, {
          operation: VALIDATION_OPERATIONS.INACTIVE
        })),
        outerJson: Buffer.from(serializeDropParamsJson(INACTIVE_DROP_PARAMS)),
        adminMirror: Buffer.from(serializeDropParamsJson(INACTIVE_DROP_PARAMS))
      };
      result.sourceVersion = sha256SourceBytes(targets.canonicalSource);
      result.projections = {
        outerJsonSha256: sha256SourceBytes(targets.outerJson),
        adminMirrorSha256: sha256SourceBytes(targets.adminMirror)
      };
      record = {
        ...record,
        recovery: {
          ...record.recovery,
          targetFiles: targetFileHashes(targets),
          result
        },
        updatedAt: nowIso(options)
      };
      await writeJournalRecord(record);
    }

    const staged = await stageAndVerifyTargets(
      operationId,
      targets,
      operation === DROP_PARAMS_WRITER_OPERATIONS.DEACTIVATE
        ? VALIDATION_OPERATIONS.INACTIVE
        : VALIDATION_OPERATIONS.ACTIVE,
      options
    );
    await replaceTargets(staged, options);
    if (typeof options.testHooks?.beforeFinalVerification === "function") {
      await options.testHooks.beforeFinalVerification();
    }
    await assertDropParamsEquality({
      expectedParams: operation === DROP_PARAMS_WRITER_OPERATIONS.DEACTIVATE
        ? INACTIVE_DROP_PARAMS
        : candidate
    });
    const actualSourceVersion = sha256SourceBytes(
      await readFile(fileDefinitions.canonicalSource.path)
    );
    if (actualSourceVersion !== result.sourceVersion) {
      throw new DropParamsTransactionError(
        "final_verification_failed",
        "Final Drop Params sourceVersion differs from the planned result"
      );
    }
    record = completedRecord({ ...record, archive, result }, nowIso(options));
    await writeJournalRecord(record);
    return result;
  } catch (error) {
    if (error?.simulateProcessInterruption === true) throw error;
    const rollback = await restoreSnapshot(baseFiles, options);
    if (!rollback.ok) {
      record = {
        ...record,
        archive,
        status: DROP_PARAMS_OPERATION_STATUSES.RECONCILIATION_REQUIRED,
        updatedAt: nowIso(options),
        failure: {
          code: "rollback_verification_failed",
          message: `${error.message}; rollback: ${rollback.errors.join("; ")}`
        }
      };
      await writeJournalRecord(record);
      throw new DropParamsTransactionError(
        "reconciliation_required",
        `Drop Params operation ${operationId} failed and exact rollback could not be verified`,
        { cause: error, operationId, status: record.status }
      );
    }
    record = rolledBackRecord({ ...record, archive }, nowIso(options), error);
    await writeJournalRecord(record);
    throw new DropParamsTransactionError(
      "transaction_rolled_back",
      `Drop Params operation ${operationId} failed and exact prior files were restored: ${error.message}`,
      { cause: error, operationId, status: record.status }
    );
  } finally {
    await rm(stageDirectory(operationId), { recursive: true, force: true });
  }
}

export async function executeDropParamsOperation(request, options = {}) {
  if (!request || typeof request !== "object" || Array.isArray(request)) {
    throw new TypeError("Drop Params transaction request must be an object");
  }
  const lock = await acquireDropParamsLock(options.lockOptions);
  try {
    return await executeLocked(request, options);
  } finally {
    await lock.release();
  }
}

export async function createDropParams(request, options = {}) {
  return executeDropParamsOperation({ ...request, operation: DROP_PARAMS_WRITER_OPERATIONS.CREATE }, options);
}

export async function editDropParams(request, options = {}) {
  return executeDropParamsOperation({ ...request, operation: DROP_PARAMS_WRITER_OPERATIONS.EDIT }, options);
}

export async function deactivateDropParams(request, options = {}) {
  return executeDropParamsOperation({ ...request, operation: DROP_PARAMS_WRITER_OPERATIONS.DEACTIVATE }, options);
}

export async function getDropParamsTransactionStatus() {
  const lock = await acquireDropParamsLock();
  try {
    const records = await listJournalRecords();
    return {
      sourceVersion: sha256SourceBytes(await readFile(DROP_PARAMS_PATHS.canonicalSource)),
      blocked: records.some(record => record.status === DROP_PARAMS_OPERATION_STATUSES.RECONCILIATION_REQUIRED),
      operations: records.map(publicRecord)
    };
  } finally {
    await lock.release();
  }
}

export async function inspectDropParamsTransactionStatus() {
  const records = await listJournalRecords();
  return {
    sourceVersion: sha256SourceBytes(await readFile(DROP_PARAMS_PATHS.canonicalSource)),
    blocked: records.some(record => record.status === DROP_PARAMS_OPERATION_STATUSES.RECONCILIATION_REQUIRED),
    operations: records.map(publicRecord)
  };
}

export async function reconcileDropParamsTransactions(options = {}) {
  const lock = await acquireDropParamsLock(options.lockOptions);
  try {
    const records = await reconcilePendingOperations({
      ...options,
      includeReconciliationRequired: true
    });
    return {
      sourceVersion: sha256SourceBytes(await readFile(DROP_PARAMS_PATHS.canonicalSource)),
      blocked: records.some(record => record.status === DROP_PARAMS_OPERATION_STATUSES.RECONCILIATION_REQUIRED),
      operations: records.map(publicRecord)
    };
  } finally {
    await lock.release();
  }
}

export function dropParamsWriterPathsAreRepositoryScoped() {
  const paths = [journalDirectory, DROP_PARAMS_ARCHIVE_DIRECTORY];
  return paths.every(filePath => {
    const relative = path.relative(DROP_PARAMS_REPO_ROOT, filePath);
    return relative !== "" && relative !== ".." &&
      !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
  }) && Object.values(fileDefinitions).every(definition =>
    relativePath(definition.path) === definition.relativePath
  );
}
