import { createHash, randomBytes, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import http from "node:http";
import { isDeepStrictEqual } from "node:util";

import {
  DROP_PARAMS_OPERATIONS,
  INACTIVE_DROP_PARAMS,
  KNOWN_COLLECTION_KEYS,
  SUPPORTED_MIRROR_NETWORKS,
  getCandidateSourceVersion,
  serializeDropParamsSource,
  sha256SourceBytes,
  toCanonicalDropParams,
  validateDropParams
} from "./drop-params-authoring.mjs";
import {
  buildDeactivationArchive,
  getDeactivationArchiveFilename
} from "./drop-params-archive.mjs";
import {
  DROP_PARAMS_PATHS,
  DROP_PARAMS_REPO_ROOT,
  importCanonicalDropParams,
  inspectDropParamsLock,
  serializeDropParamsJson
} from "./drop-params-projector.mjs";
import {
  DROP_PARAMS_OPERATION_STATUSES,
  DROP_PARAMS_WRITER_OPERATIONS,
  executeDropParamsOperation,
  getDropParamsRequestPlanHash,
  inspectDropParamsTransactionStatus
} from "./drop-params-transaction.mjs";

export const DROP_PARAMS_AUTHORING_HOST = "127.0.0.1";
export const DROP_PARAMS_AUTHORING_PORT = 47831;
export const DROP_PARAMS_AUTHORING_BODY_LIMIT = 64 * 1024;
export const DROP_PARAMS_PREVIEW_TTL_MS = 2 * 60 * 1000;
export const DROP_PARAMS_AUTHORING_SERVICE_NAME = "eatacid-drop-params-authoring";
export const DROP_PARAMS_AUTHORING_PROTOCOL_VERSION = 1;

export const DROP_PARAMS_ADMIN_ORIGINS = Object.freeze([
  "http://localhost:3000",
  "http://127.0.0.1:3000"
]);

const API_ROUTES = new Map([
  ["/v1/drop-params", new Set(["GET", "OPTIONS"])],
  ["/v1/drop-params/validate", new Set(["POST", "OPTIONS"])],
  ["/v1/drop-params/preview", new Set(["POST", "OPTIONS"])],
  ["/v1/drop-params/apply", new Set(["POST", "OPTIONS"])]
]);
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

export class DropParamsAuthoringServiceError extends Error {
  constructor(code, message, statusCode = 400, details = null, options = {}) {
    super(message, options);
    this.name = "DropParamsAuthoringServiceError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

function clone(value) {
  return structuredClone(value);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function assertExactKeys(value, allowed, label) {
  if (!isRecord(value)) {
    throw new DropParamsAuthoringServiceError("invalid_request", `${label} must be a JSON object`);
  }
  const allowedSet = new Set(allowed);
  const extra = Object.keys(value).filter(key => !allowedSet.has(key));
  if (extra.length) {
    throw new DropParamsAuthoringServiceError(
      "invalid_request",
      `${label} contains unsupported field(s): ${extra.join(", ")}`
    );
  }
}

function normalizeOperation(operation) {
  const value = String(operation || "").toUpperCase();
  if (!Object.values(DROP_PARAMS_WRITER_OPERATIONS).includes(value)) {
    throw new DropParamsAuthoringServiceError(
      "unsupported_operation",
      `operation must be one of: ${Object.values(DROP_PARAMS_WRITER_OPERATIONS).join(", ")}`
    );
  }
  return value;
}

function assertSourceVersion(value) {
  if (typeof value !== "string" || !SHA256_PATTERN.test(value)) {
    throw new DropParamsAuthoringServiceError(
      "invalid_source_version",
      "expectedSourceVersion must be a lowercase SHA-256 digest"
    );
  }
  return value;
}

function assertHash(value, label, { nullable = false } = {}) {
  if (nullable && value === null) return null;
  if (typeof value !== "string" || !SHA256_PATTERN.test(value)) {
    throw new DropParamsAuthoringServiceError("invalid_hash", `${label} must be a lowercase SHA-256 digest`);
  }
  return value;
}

function operationCandidate(operation, body) {
  if (operation === DROP_PARAMS_WRITER_OPERATIONS.DEACTIVATE) {
    if (Object.hasOwn(body, "candidate")) {
      throw new DropParamsAuthoringServiceError(
        "invalid_request",
        "DEACTIVATE does not accept a candidate"
      );
    }
    return null;
  }
  if (!Object.hasOwn(body, "candidate")) {
    throw new DropParamsAuthoringServiceError("invalid_request", `${operation} requires candidate`);
  }
  const validation = validateDropParams(body.candidate, {
    operation: DROP_PARAMS_OPERATIONS.ACTIVE
  });
  if (!validation.ok) {
    throw new DropParamsAuthoringServiceError(
      "validation_failed",
      "Candidate Drop Params failed strict schema validation",
      422,
      { errors: validation.errors }
    );
  }
  return toCanonicalDropParams(body.candidate, {
    operation: DROP_PARAMS_OPERATIONS.ACTIVE
  });
}

function assertOperationAllowed(operation, current) {
  if (operation === DROP_PARAMS_WRITER_OPERATIONS.CREATE && current.dropScheduled !== false) {
    throw new DropParamsAuthoringServiceError(
      "create_requires_inactive",
      "CREATE requires inactive current Drop Params",
      409
    );
  }
  if ((operation === DROP_PARAMS_WRITER_OPERATIONS.EDIT || operation === DROP_PARAMS_WRITER_OPERATIONS.DEACTIVATE) &&
      current.dropScheduled !== true) {
    throw new DropParamsAuthoringServiceError(
      operation === DROP_PARAMS_WRITER_OPERATIONS.EDIT ? "edit_requires_active" : "deactivate_requires_active",
      `${operation} requires active current Drop Params`,
      409
    );
  }
}

function diffValues(before, after, path = "$") {
  if (isDeepStrictEqual(before, after)) return [];
  if (Array.isArray(before) && Array.isArray(after)) {
    const changes = [];
    const length = Math.max(before.length, after.length);
    for (let index = 0; index < length; index += 1) {
      changes.push(...diffValues(before[index], after[index], `${path}[${index}]`));
    }
    return changes;
  }
  if (isRecord(before) && isRecord(after)) {
    const changes = [];
    for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
      changes.push(...diffValues(before[key], after[key], `${path}.${key}`));
    }
    return changes;
  }
  return [{ path, before: before === undefined ? null : before, after: after === undefined ? null : after }];
}

function canonicalNow(now) {
  const value = typeof now === "function" ? now() : new Date();
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.valueOf())) throw new TypeError("authoring-service clock returned an invalid date");
  return date;
}

function repoId() {
  return createHash("sha256").update(DROP_PARAMS_REPO_ROOT).digest("hex");
}

async function readRepositorySnapshot() {
  const [{ params, sourceVersion }, sourceBytes, outerBytes, adminBytes] = await Promise.all([
    importCanonicalDropParams(),
    readFile(DROP_PARAMS_PATHS.canonicalSource),
    readFile(DROP_PARAMS_PATHS.outerJson),
    readFile(DROP_PARAMS_PATHS.adminMirror)
  ]);
  let outer = null;
  let admin = null;
  const errors = [];
  try { outer = JSON.parse(outerBytes.toString("utf8")); } catch (error) {
    errors.push(`outer JSON is invalid: ${error.message}`);
  }
  try { admin = JSON.parse(adminBytes.toString("utf8")); } catch (error) {
    errors.push(`Admin mirror is invalid: ${error.message}`);
  }
  const sourceEqualsProjection = outer !== null && isDeepStrictEqual(params, outer);
  const sourceEqualsAdminMirror = admin !== null && isDeepStrictEqual(params, admin);
  const projectionsByteEqual = outerBytes.equals(adminBytes);
  if (!sourceEqualsProjection) errors.push("outer JSON differs from canonical source");
  if (!sourceEqualsAdminMirror) errors.push("Admin mirror differs from canonical source");
  if (!projectionsByteEqual) errors.push("outer JSON and Admin mirror bytes differ");
  return {
    params,
    sourceVersion,
    files: { sourceBytes, outerBytes, adminBytes },
    equality: {
      equal: errors.length === 0,
      sourceEqualsProjection,
      sourceEqualsAdminMirror,
      projectionsByteEqual,
      errors
    }
  };
}

async function readWriterState() {
  const [lock, journal] = await Promise.all([
    inspectDropParamsLock(),
    inspectDropParamsTransactionStatus()
  ]);
  const busy = ["owned", "contended"].includes(lock.state);
  return {
    busy,
    lockState: lock.state,
    blocked: journal.blocked,
    operations: journal.operations
  };
}

function assertWritableState(snapshot, writer) {
  if (!snapshot.equality.equal) {
    throw new DropParamsAuthoringServiceError(
      "representation_drift",
      "Drop Params source/projection/Admin mirror drift blocks authoring",
      409,
      snapshot.equality
    );
  }
  if (writer.blocked) {
    throw new DropParamsAuthoringServiceError(
      "reconciliation_required",
      "A prior Drop Params operation requires reconciliation",
      409,
      writer
    );
  }
  if (writer.busy) {
    throw new DropParamsAuthoringServiceError(
      "writer_busy",
      "The Drop Params writer is busy",
      409,
      { lockState: writer.lockState }
    );
  }
}

function plannedFiles(snapshot, candidate) {
  const proposedSource = serializeDropParamsSource(candidate, {
    operation: candidate.dropScheduled ? DROP_PARAMS_OPERATIONS.ACTIVE : DROP_PARAMS_OPERATIONS.INACTIVE
  });
  const proposedJson = serializeDropParamsJson(candidate);
  return {
    canonicalSource: {
      path: "shared/drop-params/drop-params.js",
      before: snapshot.files.sourceBytes.toString("utf8"),
      after: proposedSource,
      beforeSha256: sha256SourceBytes(snapshot.files.sourceBytes),
      afterSha256: sha256SourceBytes(proposedSource)
    },
    outerJson: {
      path: "shared/drop-params/drop-params.json",
      before: snapshot.files.outerBytes.toString("utf8"),
      after: proposedJson,
      beforeSha256: sha256SourceBytes(snapshot.files.outerBytes),
      afterSha256: sha256SourceBytes(proposedJson)
    },
    adminMirror: {
      path: "admin-ui/src/drop-params.mirror.json",
      before: snapshot.files.adminBytes.toString("utf8"),
      after: proposedJson,
      beforeSha256: sha256SourceBytes(snapshot.files.adminBytes),
      afterSha256: sha256SourceBytes(proposedJson)
    }
  };
}

function errorStatus(error) {
  if (Number.isInteger(error?.statusCode)) return error.statusCode;
  if (["stale_source_version", "representation_drift", "reconciliation_required", "transaction_rolled_back"].includes(error?.code)) return 409;
  return error instanceof TypeError ? 400 : 500;
}

function publicError(error) {
  return {
    code: error?.code || (error instanceof TypeError ? "invalid_request" : "internal_error"),
    message: error?.message || "Unexpected authoring service error",
    details: error?.details || null,
    operationId: error?.operationId || null,
    status: error?.status || null
  };
}

export function createDropParamsAuthoringApi(options = {}) {
  const nonce = options.nonce || randomBytes(32).toString("hex");
  const now = options.now || (() => new Date());
  const tokenTtlMs = options.tokenTtlMs || DROP_PARAMS_PREVIEW_TTL_MS;
  const readSnapshot = options.readSnapshot || readRepositorySnapshot;
  const readWriter = options.readWriterState || readWriterState;
  const execute = options.execute || executeDropParamsOperation;
  const previews = new Map();
  const startedAt = canonicalNow(now).toISOString();
  const repositoryId = repoId();

  function purgeExpiredPreviews(atMs) {
    for (const [token, preview] of previews) {
      if (preview.expiresAtMs <= atMs) previews.delete(token);
    }
  }

  async function getState() {
    const [snapshot, writer] = await Promise.all([readSnapshot(), readWriter()]);
    return {
      ok: true,
      service: {
        name: DROP_PARAMS_AUTHORING_SERVICE_NAME,
        protocolVersion: DROP_PARAMS_AUTHORING_PROTOCOL_VERSION,
        status: "READY",
        host: DROP_PARAMS_AUTHORING_HOST,
        port: DROP_PARAMS_AUTHORING_PORT,
        startedAt,
        repositoryId,
        mutationNonce: nonce
      },
      params: snapshot.params,
      inactiveTemplate: clone(INACTIVE_DROP_PARAMS),
      sourceVersion: snapshot.sourceVersion,
      representations: snapshot.equality,
      writer,
      capabilities: {
        operations: Object.values(DROP_PARAMS_WRITER_OPERATIONS),
        mirrorNetworks: [...SUPPORTED_MIRROR_NETWORKS],
        collections: [...KNOWN_COLLECTION_KEYS],
        timezones: ["CST", "EST", "PST"]
      }
    };
  }

  async function validate(body) {
    assertExactKeys(body, ["operation", "candidate"], "validate request");
    const operation = normalizeOperation(body.operation);
    const candidate = operationCandidate(operation, body);
    return {
      ok: true,
      operation,
      candidate: candidate ? clone(candidate) : null,
      validation: { ok: true, errors: [] }
    };
  }

  async function preview(body) {
    assertExactKeys(body, ["operation", "expectedSourceVersion", "candidate"], "preview request");
    const operation = normalizeOperation(body.operation);
    const expectedSourceVersion = assertSourceVersion(body.expectedSourceVersion);
    const candidate = operationCandidate(operation, body);
    const [snapshot, writer] = await Promise.all([readSnapshot(), readWriter()]);
    assertWritableState(snapshot, writer);
    if (snapshot.sourceVersion !== expectedSourceVersion) {
      throw new DropParamsAuthoringServiceError(
        "stale_source_version",
        `Expected sourceVersion ${expectedSourceVersion}, found ${snapshot.sourceVersion}`,
        409,
        { expectedSourceVersion, sourceVersion: snapshot.sourceVersion }
      );
    }
    assertOperationAllowed(operation, snapshot.params);

    const operationId = randomUUID();
    const archiveCreatedAt = canonicalNow(now).toISOString();
    const target = candidate || clone(INACTIVE_DROP_PARAMS);
    const candidateHash = candidate ? getCandidateSourceVersion(candidate, {
      operation: DROP_PARAMS_OPERATIONS.ACTIVE
    }) : null;
    const planHash = getDropParamsRequestPlanHash(operation, expectedSourceVersion, candidate);
    const files = plannedFiles(snapshot, target);
    let archivePath = null;
    if (operation === DROP_PARAMS_WRITER_OPERATIONS.DEACTIVATE) {
      const archive = buildDeactivationArchive({
        operationId,
        archiveCreatedAt,
        deactivationRequestedAt: archiveCreatedAt,
        sourceSha256: snapshot.sourceVersion,
        sourceParams: snapshot.params,
        outerSha256: sha256SourceBytes(snapshot.files.outerBytes),
        adminMirrorSha256: sha256SourceBytes(snapshot.files.adminBytes)
      });
      archivePath = `shared/drop-params/archive/${getDeactivationArchiveFilename(archive)}`;
    }
    const issuedAtMs = canonicalNow(now).getTime();
    const expiresAtMs = issuedAtMs + tokenTtlMs;
    purgeExpiredPreviews(issuedAtMs);
    const previewToken = randomBytes(32).toString("hex");
    previews.set(previewToken, {
      operation,
      expectedSourceVersion,
      candidateHash,
      planHash,
      candidate,
      operationId,
      archiveCreatedAt,
      expiresAtMs
    });

    return {
      ok: true,
      operation,
      sourceVersion: expectedSourceVersion,
      candidateHash,
      planHash,
      previewToken,
      expiresAt: new Date(expiresAtMs).toISOString(),
      diff: {
        fields: diffValues(snapshot.params, target),
        changedFieldCount: diffValues(snapshot.params, target).length
      },
      effects: {
        files,
        archivePath,
        writesPerformed: false,
        onChainStateChanges: false
      },
      warnings: operation === DROP_PARAMS_WRITER_OPERATIONS.DEACTIVATE
        ? ["On-chain state will not change.", "The active local configuration will be archived before the inactive template is written."]
        : ["On-chain state will not change.", "No files have been written; Apply is a separate action."]
    };
  }

  async function apply(body) {
    assertExactKeys(
      body,
      ["operation", "expectedSourceVersion", "candidate", "candidateHash", "planHash", "previewToken"],
      "apply request"
    );
    const operation = normalizeOperation(body.operation);
    const expectedSourceVersion = assertSourceVersion(body.expectedSourceVersion);
    const candidate = operationCandidate(operation, body);
    const candidateHash = assertHash(body.candidateHash, "candidateHash", {
      nullable: operation === DROP_PARAMS_WRITER_OPERATIONS.DEACTIVATE
    });
    const planHash = assertHash(body.planHash, "planHash");
    if (typeof body.previewToken !== "string" || !/^[a-f0-9]{64}$/.test(body.previewToken)) {
      throw new DropParamsAuthoringServiceError("invalid_preview_token", "previewToken is invalid", 410);
    }
    const preview = previews.get(body.previewToken);
    if (!preview) {
      throw new DropParamsAuthoringServiceError(
        "preview_token_unavailable",
        "Preview token is expired, already used, or unknown",
        410
      );
    }
    previews.delete(body.previewToken);
    const currentMs = canonicalNow(now).getTime();
    if (preview.expiresAtMs <= currentMs) {
      throw new DropParamsAuthoringServiceError("preview_token_expired", "Preview token has expired", 410);
    }
    const computedCandidateHash = candidate ? getCandidateSourceVersion(candidate, {
      operation: DROP_PARAMS_OPERATIONS.ACTIVE
    }) : null;
    const computedPlanHash = getDropParamsRequestPlanHash(operation, expectedSourceVersion, candidate);
    const bindingMatches = preview.operation === operation &&
      preview.expectedSourceVersion === expectedSourceVersion &&
      preview.candidateHash === candidateHash &&
      preview.candidateHash === computedCandidateHash &&
      preview.planHash === planHash &&
      preview.planHash === computedPlanHash;
    if (!bindingMatches) {
      throw new DropParamsAuthoringServiceError(
        "preview_binding_mismatch",
        "Apply request does not exactly match its preview",
        409
      );
    }
    const [snapshot, writer] = await Promise.all([readSnapshot(), readWriter()]);
    assertWritableState(snapshot, writer);
    if (snapshot.sourceVersion !== expectedSourceVersion) {
      throw new DropParamsAuthoringServiceError(
        "stale_source_version",
        `Expected sourceVersion ${expectedSourceVersion}, found ${snapshot.sourceVersion}`,
        409,
        { expectedSourceVersion, sourceVersion: snapshot.sourceVersion }
      );
    }
    assertOperationAllowed(operation, snapshot.params);

    const request = {
      operation,
      operationId: preview.operationId,
      expectedSourceVersion,
      ...(candidate ? { candidate } : { deactivationRequestedAt: preview.archiveCreatedAt })
    };
    try {
      const result = await execute(request, {
        now: () => new Date(preview.archiveCreatedAt)
      });
      return {
        ok: true,
        operation,
        result,
        rollback: null,
        reconciliationRequired: result?.status === DROP_PARAMS_OPERATION_STATUSES.RECONCILIATION_REQUIRED
      };
    } catch (error) {
      const reconciliationRequired = error?.code === "reconciliation_required" ||
        error?.status === DROP_PARAMS_OPERATION_STATUSES.RECONCILIATION_REQUIRED;
      return {
        ok: false,
        operation,
        result: null,
        failure: publicError(error),
        rollback: {
          verified: error?.code === "transaction_rolled_back",
          status: error?.status || null
        },
        reconciliationRequired
      };
    }
  }

  return Object.freeze({ nonce, repositoryId, getState, validate, preview, apply });
}

function setCorsHeaders(response, origin) {
  if (!origin || !DROP_PARAMS_ADMIN_ORIGINS.includes(origin)) return;
  response.setHeader("Access-Control-Allow-Origin", origin);
  response.setHeader("Vary", "Origin");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Drop-Params-Nonce");
  response.setHeader("Access-Control-Max-Age", "300");
}

function sendJson(response, statusCode, payload, origin = null) {
  setCorsHeaders(response, origin);
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.end(`${JSON.stringify(payload)}\n`);
}

async function readJsonBody(request, limit) {
  const contentType = String(request.headers["content-type"] || "").split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/json") {
    throw new DropParamsAuthoringServiceError(
      "unsupported_content_type",
      "POST requests require application/json",
      415
    );
  }
  const declared = Number(request.headers["content-length"] || 0);
  if (Number.isFinite(declared) && declared > limit) {
    throw new DropParamsAuthoringServiceError("request_too_large", "Request body is too large", 413);
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > limit) {
      throw new DropParamsAuthoringServiceError("request_too_large", "Request body is too large", 413);
    }
    chunks.push(chunk);
  }
  if (!size) throw new DropParamsAuthoringServiceError("invalid_json", "Request body is required");
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch (error) {
    throw new DropParamsAuthoringServiceError("invalid_json", "Request body is not valid JSON", 400, null, { cause: error });
  }
}

function acceptedHosts(port) {
  return new Set([`127.0.0.1:${port}`, `localhost:${port}`]);
}

export function createDropParamsAuthoringHttpServer(options = {}) {
  const port = options.port ?? DROP_PARAMS_AUTHORING_PORT;
  const api = options.api || createDropParamsAuthoringApi(options.apiOptions);
  const bodyLimit = options.bodyLimit || DROP_PARAMS_AUTHORING_BODY_LIMIT;
  const hosts = acceptedHosts(port);

  const server = http.createServer(async (request, response) => {
    const origin = request.headers.origin || null;
    let requestPath = null;
    try {
      if (!hosts.has(String(request.headers.host || "").toLowerCase())) {
        throw new DropParamsAuthoringServiceError("invalid_host", "Host is not allowed", 403);
      }
      const requestUrl = new URL(request.url || "/", `http://${request.headers.host}`);
      requestPath = requestUrl.pathname;
      const allowedMethods = API_ROUTES.get(requestUrl.pathname);
      if (!allowedMethods || requestUrl.search) {
        throw new DropParamsAuthoringServiceError("route_not_found", "Route not found", 404);
      }
      if (!allowedMethods.has(request.method)) {
        throw new DropParamsAuthoringServiceError("method_not_allowed", "Method not allowed", 405);
      }
      if (origin && !DROP_PARAMS_ADMIN_ORIGINS.includes(origin)) {
        throw new DropParamsAuthoringServiceError("origin_not_allowed", "Origin is not allowed", 403);
      }
      if (request.method === "OPTIONS") {
        if (!origin) throw new DropParamsAuthoringServiceError("origin_required", "Origin is required", 403);
        setCorsHeaders(response, origin);
        response.statusCode = 204;
        response.end();
        return;
      }
      if (request.method === "GET") {
        sendJson(response, 200, await api.getState(), origin);
        return;
      }
      if (!origin || !DROP_PARAMS_ADMIN_ORIGINS.includes(origin)) {
        throw new DropParamsAuthoringServiceError("origin_required", "An allowed Admin origin is required", 403);
      }
      if (request.headers["x-drop-params-nonce"] !== api.nonce) {
        throw new DropParamsAuthoringServiceError("nonce_required", "A valid per-process nonce is required", 401);
      }
      const body = await readJsonBody(request, bodyLimit);
      const method = requestUrl.pathname.endsWith("/validate")
        ? api.validate
        : requestUrl.pathname.endsWith("/preview")
          ? api.preview
          : api.apply;
      const payload = await method(body);
      sendJson(response, payload.ok === false ? 409 : 200, payload, origin);
    } catch (error) {
      const failure = publicError(error);
      const payload = requestPath === "/v1/drop-params/apply"
        ? {
            ok: false,
            operation: null,
            result: null,
            failure,
            rollback: null,
            reconciliationRequired: failure.code === "reconciliation_required"
          }
        : { ok: false, error: failure };
      sendJson(response, errorStatus(error), payload, origin);
    }
  });
  return { server, api, port };
}

function probeExistingService(port, repositoryId) {
  return new Promise(resolve => {
    const request = http.get({
      host: DROP_PARAMS_AUTHORING_HOST,
      port,
      path: "/v1/drop-params",
      headers: { Host: `127.0.0.1:${port}` },
      timeout: 1_000
    }, response => {
      const chunks = [];
      response.on("data", chunk => chunks.push(chunk));
      response.on("end", () => {
        try {
          const payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
          resolve(response.statusCode === 200 &&
            payload?.service?.name === DROP_PARAMS_AUTHORING_SERVICE_NAME &&
            payload?.service?.repositoryId === repositoryId);
        } catch {
          resolve(false);
        }
      });
    });
    request.on("timeout", () => request.destroy());
    request.on("error", () => resolve(false));
  });
}

export async function startDropParamsAuthoringService(options = {}) {
  const instance = createDropParamsAuthoringHttpServer(options);
  try {
    await new Promise((resolve, reject) => {
      const onError = error => {
        instance.server.off("listening", onListening);
        reject(error);
      };
      const onListening = () => {
        instance.server.off("error", onError);
        resolve();
      };
      instance.server.once("error", onError);
      instance.server.once("listening", onListening);
      instance.server.listen(instance.port, DROP_PARAMS_AUTHORING_HOST);
    });
    return { ...instance, reused: false };
  } catch (error) {
    if (error?.code !== "EADDRINUSE") throw error;
    if (await probeExistingService(instance.port, instance.api.repositoryId)) {
      return { server: null, api: null, port: instance.port, reused: true };
    }
    throw new DropParamsAuthoringServiceError(
      "port_occupied",
      `127.0.0.1:${instance.port} is occupied by an unrelated process`,
      409,
      { host: DROP_PARAMS_AUTHORING_HOST, port: instance.port },
      { cause: error }
    );
  }
}
