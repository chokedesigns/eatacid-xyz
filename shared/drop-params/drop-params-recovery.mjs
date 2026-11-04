// Read-only recovery state shared by writer and projector. Callers hold the
// transaction lock when using this state to authorize writes; no recovery occurs here.
import { lstat, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertValidOperationId } from "./drop-params-archive.mjs";

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

export const JOURNAL_SCHEMA_VERSION = 1;
const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
export const journalDirectory = path.join(moduleDirectory, ".drop-params.operations");
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

export class DropParamsTransactionError extends Error {
  constructor(code, message, options = {}) {
    super(message, options);
    this.name = "DropParamsTransactionError";
    this.code = code;
    if (options.operationId) this.operationId = options.operationId;
    if (options.status) this.status = options.status;
  }
}

export function normalizeOperation(operation) {
  const normalized = String(operation || "").toUpperCase();
  if (!Object.values(DROP_PARAMS_WRITER_OPERATIONS).includes(normalized)) {
    throw new TypeError(`Unsupported Drop Params writer operation: ${operation}`);
  }
  return normalized;
}

export function journalPath(operationId) {
  assertValidOperationId(operationId);
  return path.join(journalDirectory, `${operationId}.json`);
}

async function readIfExists(filePath) {
  try {
    return await readFile(filePath);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

export function validateJournalRecord(record) {
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

export async function readJournalRecord(operationId) {
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

export async function listJournalRecords() {
  let directory;
  try {
    directory = await lstat(journalDirectory);
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
  if (!directory.isDirectory()) {
    throw new DropParamsTransactionError("journal_invalid", "Drop Params recovery path is not a regular directory");
  }
  const entries = await readdir(journalDirectory, { withFileTypes: true });
  const records = [];
  for (const entry of entries) {
    if (!entry.name.endsWith(".json") || entry.name.startsWith(".")) continue;
    if (!entry.isFile()) {
      throw new DropParamsTransactionError("journal_invalid", `Drop Params journal ${entry.name} is not a regular file`);
    }
    const operationId = entry.name.slice(0, -5);
    const record = await readJournalRecord(operationId);
    if (!record) {
      throw new DropParamsTransactionError("journal_invalid", `Drop Params journal ${entry.name} disappeared during inspection`);
    }
    records.push(record);
  }
  return records;
}

export async function assertDropParamsProjectionAllowed() {
  let records;
  try {
    records = await listJournalRecords();
  } catch (error) {
    throw new DropParamsTransactionError(
      "journal_invalid",
      `Drop Params projection blocked: recovery state could not be inspected: ${error.message}`,
      { cause: error }
    );
  }
  const unresolved = records.filter(record =>
    record.status === DROP_PARAMS_OPERATION_STATUSES.PENDING ||
    record.status === DROP_PARAMS_OPERATION_STATUSES.RECONCILIATION_REQUIRED
  );
  if (unresolved.length > 0) {
    throw new DropParamsTransactionError(
      "reconciliation_required",
      `Drop Params projection blocked by unresolved operation(s): ${unresolved.map(record => record.operationId).join(", ")}. Inspect status and use explicit reconcile before retrying.`
    );
  }
}
