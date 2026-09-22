import { link, mkdir, open, readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";

import {
  DROP_PARAMS_OPERATIONS,
  assertValidDropParams,
  sha256SourceBytes,
  toCanonicalDropParams
} from "./drop-params-authoring.mjs";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));

export const DROP_PARAMS_ARCHIVE_SCHEMA_VERSION = 1;
export const DROP_PARAMS_ARCHIVE_KIND = "drop-params-deactivation-archive";
export const DROP_PARAMS_ARCHIVE_DIRECTORY = path.join(moduleDirectory, "archive");

const SOURCE_PATH = "shared/drop-params/drop-params.js";
const OUTER_PATH = "shared/drop-params/drop-params.json";
const ADMIN_PATH = "admin-ui/src/drop-params.mirror.json";
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const OPERATION_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;

export class DropParamsArchiveError extends Error {
  constructor(code, message, options = {}) {
    super(message, options);
    this.name = "DropParamsArchiveError";
    this.code = code;
  }
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(value, keys) {
  return isRecord(value) &&
    Object.keys(value).length === keys.length &&
    keys.every(key => Object.hasOwn(value, key));
}

function isCanonicalIsoTimestamp(value) {
  if (typeof value !== "string") return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString() === value;
}

export function assertValidOperationId(operationId) {
  if (typeof operationId !== "string" || !OPERATION_ID_PATTERN.test(operationId)) {
    throw new TypeError(
      "operationId must be 1-128 filesystem-safe alphanumeric, dot, underscore, or hyphen characters"
    );
  }
  return operationId;
}

export function sanitizeDropSlug(dropName) {
  const slug = String(dropName || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
  return slug || "drop";
}

export function formatArchiveTimestamp(value) {
  const timestamp = value instanceof Date ? value.toISOString() : value;
  if (!isCanonicalIsoTimestamp(timestamp)) {
    throw new TypeError("archive timestamp must be a canonical UTC ISO timestamp");
  }
  return timestamp.replace(/[-:]/g, "");
}

function canonicalSnapshotBytes(params) {
  return `${JSON.stringify(toCanonicalDropParams(params, {
    operation: DROP_PARAMS_OPERATIONS.ACTIVE
  }), null, 2)}\n`;
}

export function buildDeactivationArchive({
  operationId,
  archiveCreatedAt,
  deactivationRequestedAt,
  sourceSha256,
  sourceParams,
  outerSha256,
  adminMirrorSha256
}) {
  assertValidOperationId(operationId);
  const params = toCanonicalDropParams(sourceParams, {
    operation: DROP_PARAMS_OPERATIONS.ACTIVE
  });
  const payload = {
    schemaVersion: DROP_PARAMS_ARCHIVE_SCHEMA_VERSION,
    kind: DROP_PARAMS_ARCHIVE_KIND,
    operationId,
    archiveCreatedAt,
    deactivationRequestedAt,
    source: {
      path: SOURCE_PATH,
      sha256: sourceSha256,
      snapshotSha256: sha256SourceBytes(canonicalSnapshotBytes(params)),
      params
    },
    projections: {
      outerJson: {
        path: OUTER_PATH,
        sha256: outerSha256
      },
      adminMirror: {
        path: ADMIN_PATH,
        sha256: adminMirrorSha256
      }
    }
  };
  assertValidDeactivationArchive(payload);
  return payload;
}

export function validateDeactivationArchive(payload) {
  const errors = [];
  const add = message => errors.push(message);

  if (!hasExactKeys(payload, [
    "schemaVersion",
    "kind",
    "operationId",
    "archiveCreatedAt",
    "deactivationRequestedAt",
    "source",
    "projections"
  ])) add("archive must contain exactly the schema version 1 fields");

  if (payload?.schemaVersion !== DROP_PARAMS_ARCHIVE_SCHEMA_VERSION) {
    add("schemaVersion must be 1");
  }
  if (payload?.kind !== DROP_PARAMS_ARCHIVE_KIND) {
    add(`kind must be ${DROP_PARAMS_ARCHIVE_KIND}`);
  }
  try {
    assertValidOperationId(payload?.operationId);
  } catch (error) {
    add(error.message);
  }
  if (!isCanonicalIsoTimestamp(payload?.archiveCreatedAt)) {
    add("archiveCreatedAt must be a canonical UTC ISO timestamp");
  }
  if (!isCanonicalIsoTimestamp(payload?.deactivationRequestedAt)) {
    add("deactivationRequestedAt must be a canonical UTC ISO timestamp");
  }

  if (!hasExactKeys(payload?.source, ["path", "sha256", "snapshotSha256", "params"])) {
    add("source must contain exactly path, sha256, snapshotSha256, and params");
  } else {
    if (payload.source.path !== SOURCE_PATH) add(`source.path must be ${SOURCE_PATH}`);
    if (!SHA256_PATTERN.test(payload.source.sha256)) add("source.sha256 must be a SHA-256 hex digest");
    if (!SHA256_PATTERN.test(payload.source.snapshotSha256)) {
      add("source.snapshotSha256 must be a SHA-256 hex digest");
    }
    try {
      assertValidDropParams(payload.source.params, {
        operation: DROP_PARAMS_OPERATIONS.ACTIVE
      });
      const expectedSnapshotHash = sha256SourceBytes(
        canonicalSnapshotBytes(payload.source.params)
      );
      if (payload.source.snapshotSha256 !== expectedSnapshotHash) {
        add("source.snapshotSha256 does not match source.params");
      }
    } catch (error) {
      add(`source.params is not a complete active configuration: ${error.message}`);
    }
  }

  if (!hasExactKeys(payload?.projections, ["outerJson", "adminMirror"])) {
    add("projections must contain exactly outerJson and adminMirror");
  } else {
    for (const [key, expectedPath] of [
      ["outerJson", OUTER_PATH],
      ["adminMirror", ADMIN_PATH]
    ]) {
      const projection = payload.projections[key];
      if (!hasExactKeys(projection, ["path", "sha256"])) {
        add(`projections.${key} must contain exactly path and sha256`);
        continue;
      }
      if (projection.path !== expectedPath) {
        add(`projections.${key}.path must be ${expectedPath}`);
      }
      if (!SHA256_PATTERN.test(projection.sha256)) {
        add(`projections.${key}.sha256 must be a SHA-256 hex digest`);
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

export function assertValidDeactivationArchive(payload) {
  const result = validateDeactivationArchive(payload);
  if (!result.ok) {
    throw new DropParamsArchiveError(
      "archive_schema_invalid",
      `Invalid Drop Params deactivation archive:\n- ${result.errors.join("\n- ")}`
    );
  }
  return payload;
}

export function serializeDeactivationArchive(payload) {
  assertValidDeactivationArchive(payload);
  return `${JSON.stringify(payload, null, 2)}\n`;
}

export function getDeactivationArchiveFilename(payload) {
  assertValidDeactivationArchive(payload);
  return `${formatArchiveTimestamp(payload.archiveCreatedAt)}--${sanitizeDropSlug(
    payload.source.params.dropName
  )}--${payload.source.sha256.slice(0, 12)}--${payload.operationId}.json`;
}

function assertArchivePath(archivePath) {
  const resolved = path.resolve(archivePath);
  const directory = path.dirname(resolved);
  if (directory !== path.resolve(DROP_PARAMS_ARCHIVE_DIRECTORY)) {
    throw new DropParamsArchiveError(
      "archive_path_invalid",
      "archive path is outside the fixed Drop Params archive directory"
    );
  }
  return resolved;
}

export async function verifyDeactivationArchive(archivePath, options = {}) {
  const resolved = assertArchivePath(archivePath);
  const bytes = await readFile(resolved);
  let payload;
  try {
    payload = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new DropParamsArchiveError(
      "archive_parse_failed",
      `Drop Params archive is not valid JSON: ${error.message}`,
      { cause: error }
    );
  }
  assertValidDeactivationArchive(payload);

  const expectedFilename = getDeactivationArchiveFilename(payload);
  if (path.basename(resolved) !== expectedFilename) {
    throw new DropParamsArchiveError(
      "archive_filename_invalid",
      `Drop Params archive filename does not match its verified payload: ${expectedFilename}`
    );
  }

  const canonicalBytes = Buffer.from(serializeDeactivationArchive(payload));
  if (!bytes.equals(canonicalBytes)) {
    throw new DropParamsArchiveError(
      "archive_bytes_invalid",
      "Drop Params archive bytes are not the deterministic schema serialization"
    );
  }
  if (options.expectedPayload && !isDeepStrictEqual(payload, options.expectedPayload)) {
    throw new DropParamsArchiveError(
      "archive_collision",
      "Existing Drop Params archive does not match this operation"
    );
  }
  return {
    path: resolved,
    payload,
    sha256: sha256SourceBytes(bytes),
    bytes
  };
}

export async function publishDeactivationArchive(payload, options = {}) {
  assertValidDeactivationArchive(payload);
  const bytes = Buffer.from(serializeDeactivationArchive(payload));
  const filename = getDeactivationArchiveFilename(payload);
  const finalPath = assertArchivePath(path.join(DROP_PARAMS_ARCHIVE_DIRECTORY, filename));
  const temporaryPath = assertArchivePath(path.join(
    DROP_PARAMS_ARCHIVE_DIRECTORY,
    `.${filename}.${process.pid}.${payload.operationId}.tmp`
  ));
  let handle;
  let published = false;

  await mkdir(DROP_PARAMS_ARCHIVE_DIRECTORY, { recursive: true });
  try {
    if (typeof options.testHooks?.beforeTempWrite === "function") {
      await options.testHooks.beforeTempWrite({ temporaryPath, finalPath, payload });
    }
    handle = await open(temporaryPath, "wx");
    await handle.writeFile(bytes);
    await handle.sync();
    await handle.close();
    handle = null;

    if (typeof options.testHooks?.beforePublish === "function") {
      await options.testHooks.beforePublish({ temporaryPath, finalPath, payload });
    }
    try {
      await link(temporaryPath, finalPath);
      published = true;
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
    }

    if (typeof options.testHooks?.afterPublish === "function") {
      await options.testHooks.afterPublish({ finalPath, payload, published });
    }
    const verified = await verifyDeactivationArchive(finalPath, {
      expectedPayload: payload
    });
    return {
      ...verified,
      relativePath: `shared/drop-params/archive/${filename}`,
      reused: !published
    };
  } finally {
    if (handle) await handle.close().catch(() => {});
    await unlink(temporaryPath).catch(() => {});
  }
}
