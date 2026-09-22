import { randomUUID } from "node:crypto";
import { mkdir, open, readFile, readdir, rename, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";

import {
  assertValidDropParams,
  sha256SourceBytes,
  toCanonicalDropParams
} from "./drop-params-authoring.mjs";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(moduleDirectory, "..", "..");

export const DROP_PARAMS_PATHS = Object.freeze({
  canonicalSource: path.join(moduleDirectory, "drop-params.js"),
  outerJson: path.join(moduleDirectory, "drop-params.json"),
  adminMirror: path.join(repoRoot, "admin-ui", "src", "drop-params.mirror.json"),
  transactionLock: path.join(moduleDirectory, ".drop-params.transaction.lock")
});

const writablePaths = new Set([
  DROP_PARAMS_PATHS.canonicalSource,
  DROP_PARAMS_PATHS.outerJson,
  DROP_PARAMS_PATHS.adminMirror
].map(normalizePath));

function normalizePath(filePath) {
  const resolved = path.resolve(filePath);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

function assertAllowedWritablePath(filePath) {
  if (!writablePaths.has(normalizePath(filePath))) {
    throw new Error(`Drop Params writes are not allowed at: ${filePath}`);
  }
}

function sleep(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function readIfExists(filePath) {
  try {
    return await readFile(filePath);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

export async function replaceDropParamsFileAtomic(filePath, contents) {
  assertAllowedWritablePath(filePath);
  const bytes = Buffer.isBuffer(contents) ? contents : Buffer.from(contents);
  const temporaryPath = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.${process.pid}.${randomUUID()}.tmp`
  );
  let handle;

  try {
    handle = await open(temporaryPath, "wx");
    await handle.writeFile(bytes);
    await handle.sync();
    await handle.close();
    handle = null;
    await rename(temporaryPath, filePath);
  } catch (error) {
    if (handle) await handle.close().catch(() => {});
    await unlink(temporaryPath).catch(() => {});
    throw error;
  }
}

export async function writeDropParamsFileIfChanged(filePath, contents) {
  assertAllowedWritablePath(filePath);
  const nextBytes = Buffer.isBuffer(contents) ? contents : Buffer.from(contents);
  const previousBytes = await readIfExists(filePath);
  if (previousBytes && previousBytes.equals(nextBytes)) return false;
  await replaceDropParamsFileAtomic(filePath, nextBytes);
  return true;
}

function processIsAlive(pid) {
  if (!Number.isSafeInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code === "EPERM";
  }
}

const lockClaimPrefix = "claim-";
const lockClaimSuffix = ".json";

function lockClaimPath(token) {
  if (typeof token !== "string" || !/^[a-zA-Z0-9-]+$/.test(token)) {
    throw new TypeError("Drop Params lock token is invalid");
  }
  return path.join(
    DROP_PARAMS_PATHS.transactionLock,
    `${lockClaimPrefix}${token}${lockClaimSuffix}`
  );
}

function isLockClaimPath(claimPath) {
  const resolved = path.resolve(claimPath);
  const directory = path.dirname(resolved);
  const name = path.basename(resolved);
  return normalizePath(directory) === normalizePath(DROP_PARAMS_PATHS.transactionLock) &&
    name.startsWith(lockClaimPrefix) &&
    name.endsWith(lockClaimSuffix);
}

async function ensureLockDirectory() {
  await mkdir(DROP_PARAMS_PATHS.transactionLock, { recursive: true });
}

async function readLockSnapshot(claimPath) {
  if (!isLockClaimPath(claimPath)) {
    throw new Error("Drop Params lock claim is outside the repository-scoped lock directory");
  }
  let handle;
  try {
    handle = await open(claimPath, "r");
    const [lockStat, text] = await Promise.all([
      handle.stat(),
      handle.readFile("utf8")
    ]);
    return {
      text,
      identity: {
        dev: lockStat.dev,
        ino: lockStat.ino,
        size: lockStat.size,
        mtimeMs: lockStat.mtimeMs,
        birthtimeMs: lockStat.birthtimeMs
      }
    };
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  } finally {
    if (handle) await handle.close().catch(() => {});
  }
}

function sameLockSnapshot(left, right) {
  if (!left || !right || left.text !== right.text) return false;
  return Object.keys(left.identity).every(key =>
    left.identity[key] === right.identity[key]
  );
}

async function inspectLockClaim(claimPath, options = {}) {
  const invalidLockGraceMs = options.invalidLockGraceMs ?? 5_000;
  const snapshot = await readLockSnapshot(claimPath);
  if (!snapshot) return null;

  let metadata = null;
  try {
    metadata = JSON.parse(snapshot.text);
  } catch {}

  const ageMs = Math.max(0, Date.now() - snapshot.identity.mtimeMs);
  if (!metadata || typeof metadata.token !== "string" || !Number.isSafeInteger(metadata.pid)) {
    return {
      exists: true,
      state: ageMs >= invalidLockGraceMs ? "stale" : "active",
      reason: "invalid-metadata",
      metadata: null,
      ageMs,
      snapshot,
      claimPath
    };
  }

  if (metadata.pid === process.pid && metadata.phase === "owned") {
    return {
      exists: true,
      state: "owned",
      reason: "current-process",
      metadata,
      ageMs,
      snapshot,
      claimPath
    };
  }
  if (processIsAlive(metadata.pid)) {
    return {
      exists: true,
      state: "active",
      reason: "owner-running",
      metadata,
      ageMs,
      snapshot,
      claimPath
    };
  }
  return {
    exists: true,
    state: "stale",
    reason: "owner-not-running",
    metadata,
    ageMs,
    snapshot,
    claimPath
  };
}

async function listLockClaims(options = {}) {
  let entries;
  try {
    entries = await readdir(DROP_PARAMS_PATHS.transactionLock, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }

  const claimPaths = entries
    .filter(entry =>
      entry.isFile() &&
      entry.name.startsWith(lockClaimPrefix) &&
      entry.name.endsWith(lockClaimSuffix)
    )
    .map(entry => path.join(DROP_PARAMS_PATHS.transactionLock, entry.name));
  const states = await Promise.all(claimPaths.map(claimPath =>
    inspectLockClaim(claimPath, options)
  ));
  return states.filter(Boolean);
}

export async function inspectDropParamsLock(options = {}) {
  const claims = await listLockClaims(options);
  if (claims.length === 0) return { exists: false, state: "unlocked", claims: [] };

  const selected = claims.find(claim => claim.state === "owned") ||
    claims.find(claim => claim.state === "active") ||
    claims[0];
  return { ...selected, claims };
}

export async function reclaimStaleDropParamsLock(inspectedState, options = {}) {
  if (
    inspectedState?.state !== "stale" ||
    !inspectedState.snapshot ||
    !isLockClaimPath(inspectedState.claimPath)
  ) {
    return false;
  }

  const currentState = await inspectLockClaim(inspectedState.claimPath, options);
  if (
    currentState?.state !== "stale" ||
    !sameLockSnapshot(inspectedState.snapshot, currentState.snapshot)
  ) {
    return false;
  }

  if (typeof options.testHooks?.beforeReclaim === "function") {
    await options.testHooks.beforeReclaim({ ...currentState });
  }

  try {
    await unlink(inspectedState.claimPath);
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
  return true;
}

async function writeLockClaim(metadata, options = {}) {
  await ensureLockDirectory();
  const claimPath = lockClaimPath(metadata.token);
  const text = `${JSON.stringify(metadata)}\n`;
  let handle;

  if (options.create === true) {
    try {
      handle = await open(claimPath, "wx");
      await handle.writeFile(text, "utf8");
      await handle.sync();
      await handle.close();
      return claimPath;
    } catch (error) {
      if (handle) await handle.close().catch(() => {});
      throw error;
    }
  }

  const temporaryPath = path.join(
    DROP_PARAMS_PATHS.transactionLock,
    `.${path.basename(claimPath)}.${process.pid}.${randomUUID()}.tmp`
  );
  try {
    handle = await open(temporaryPath, "wx");
    await handle.writeFile(text, "utf8");
    await handle.sync();
    await handle.close();
    handle = null;
    await rename(temporaryPath, claimPath);
    return claimPath;
  } catch (error) {
    if (handle) await handle.close().catch(() => {});
    await unlink(temporaryPath).catch(() => {});
    throw error;
  }
}

async function releaseOwnedLock(expectedMetadata) {
  const claimPath = lockClaimPath(expectedMetadata.token);
  let currentMetadata;
  try {
    currentMetadata = JSON.parse(await readFile(claimPath, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
  if (
    currentMetadata?.token !== expectedMetadata.token ||
    currentMetadata?.pid !== process.pid ||
    currentMetadata?.phase !== "owned"
  ) {
    return false;
  }
  await unlink(claimPath);
  return true;
}

function validTicket(metadata) {
  return Number.isSafeInteger(metadata?.ticket) && metadata.ticket > 0;
}

function claimPrecedes(left, right) {
  if (left.ticket !== right.ticket) return left.ticket < right.ticket;
  return left.token.localeCompare(right.token) < 0;
}

async function reclaimObservedStaleClaims(states, options) {
  for (const state of states) {
    if (state.state === "stale") {
      await reclaimStaleDropParamsLock(state, options);
    }
  }
}

export async function acquireDropParamsLock(options = {}) {
  const timeoutMs = options.timeoutMs ?? 10_000;
  const retryMs = options.retryMs ?? 25;
  const startedAt = Date.now();
  const token = randomUUID();
  let metadata = {
    pid: process.pid,
    token,
    phase: "choosing",
    ticket: null,
    acquiredAt: new Date().toISOString()
  };
  const claimPath = await writeLockClaim(metadata, { create: true });

  try {
    let claims = await listLockClaims(options);
    await reclaimObservedStaleClaims(claims, options);
    claims = await listLockClaims(options);
    const highestTicket = claims.reduce((highest, claim) =>
      validTicket(claim.metadata)
        ? Math.max(highest, claim.metadata.ticket)
        : highest
    , 0);
    metadata = { ...metadata, phase: "waiting", ticket: highestTicket + 1 };
    await writeLockClaim(metadata);

    while (true) {
      claims = await listLockClaims(options);
      await reclaimObservedStaleClaims(claims, options);
      claims = await listLockClaims(options);

      const otherClaims = claims.filter(claim => claim.metadata?.token !== token);
      const blocked = otherClaims.some(claim => {
        if (claim.state === "stale") return false;
        if (!claim.metadata || claim.metadata.phase === "choosing") return true;
        if (!validTicket(claim.metadata)) return true;
        return claimPrecedes(claim.metadata, metadata);
      });

      if (!blocked) {
        metadata = { ...metadata, phase: "owned" };
        await writeLockClaim(metadata);
        let released = false;
        const ownedMetadata = Object.freeze({ ...metadata });
        return Object.freeze({
          metadata: ownedMetadata,
          async release() {
            if (released) return false;
            const didRelease = await releaseOwnedLock(ownedMetadata);
            released = true;
            return didRelease;
          }
        });
      }

      if (Date.now() - startedAt >= timeoutMs) {
        const owner = otherClaims.find(claim => claim.metadata?.phase === "owned");
        const ownerLabel = owner?.metadata?.pid
          ? ` (owner pid ${owner.metadata.pid})`
          : "";
        throw new Error(`Timed out waiting for the Drop Params transaction lock${ownerLabel}`);
      }
      await sleep(retryMs);
    }
  } catch (error) {
    await unlink(claimPath).catch(() => {});
    throw error;
  }
}

export async function withDropParamsLock(callback, options = {}) {
  const lock = await acquireDropParamsLock(options);
  try {
    return await callback(lock.metadata);
  } finally {
    await lock.release();
  }
}

export async function getCurrentSourceVersion() {
  return sha256SourceBytes(await readFile(DROP_PARAMS_PATHS.canonicalSource));
}

export async function importCanonicalDropParams() {
  const sourceVersion = await getCurrentSourceVersion();
  const sourceUrl = pathToFileURL(DROP_PARAMS_PATHS.canonicalSource);
  sourceUrl.searchParams.set("sourceVersion", sourceVersion);
  sourceUrl.searchParams.set("nonce", randomUUID());
  const namespace = await import(sourceUrl.href);
  assertValidDropParams(namespace.default);
  return { params: namespace.default, sourceVersion };
}

export function serializeDropParamsJson(params) {
  return `${JSON.stringify(toCanonicalDropParams(params), null, 2)}\n`;
}

export async function generateOuterDropParamsJson(options = {}) {
  const run = async () => {
    const imported = options.params
      ? { params: options.params, sourceVersion: options.sourceVersion ?? null }
      : await importCanonicalDropParams();
    const jsonText = serializeDropParamsJson(imported.params);
    const changed = await writeDropParamsFileIfChanged(DROP_PARAMS_PATHS.outerJson, jsonText);
    return { ...imported, jsonText, changed, path: DROP_PARAMS_PATHS.outerJson };
  };
  return options.lock === false ? run() : withDropParamsLock(run, options.lockOptions);
}

export async function synchronizeAdminDropParamsMirror(options = {}) {
  const run = async () => {
    const jsonBytes = options.jsonText == null
      ? await readFile(DROP_PARAMS_PATHS.outerJson)
      : Buffer.from(options.jsonText);
    const changed = await writeDropParamsFileIfChanged(DROP_PARAMS_PATHS.adminMirror, jsonBytes);
    return { changed, path: DROP_PARAMS_PATHS.adminMirror, jsonBytes };
  };
  return options.lock === false ? run() : withDropParamsLock(run, options.lockOptions);
}

export async function projectDropParams(options = {}) {
  const run = async () => {
    const imported = await importCanonicalDropParams();
    const jsonText = serializeDropParamsJson(imported.params);
    const outerChanged = await writeDropParamsFileIfChanged(
      DROP_PARAMS_PATHS.outerJson,
      jsonText
    );
    const mirrorChanged = options.syncAdmin === false
      ? null
      : await writeDropParamsFileIfChanged(DROP_PARAMS_PATHS.adminMirror, jsonText);
    return {
      ...imported,
      jsonText,
      outer: { changed: outerChanged, path: DROP_PARAMS_PATHS.outerJson },
      adminMirror: options.syncAdmin === false
        ? null
        : { changed: mirrorChanged, path: DROP_PARAMS_PATHS.adminMirror }
    };
  };
  return options.lock === false ? run() : withDropParamsLock(run, options.lockOptions);
}

export async function verifyDropParamsEquality(options = {}) {
  const errors = [];
  let canonical;
  let sourceVersion = null;
  let outerBytes;
  let mirrorBytes;
  let outerParams;
  let mirrorParams;

  try {
    const imported = await importCanonicalDropParams();
    canonical = imported.params;
    sourceVersion = imported.sourceVersion;
  } catch (error) {
    errors.push(`canonical JS could not be evaluated and validated: ${error.message}`);
  }

  try {
    outerBytes = await readFile(DROP_PARAMS_PATHS.outerJson);
    outerParams = JSON.parse(outerBytes.toString("utf8"));
  } catch (error) {
    errors.push(`outer JSON could not be read and parsed: ${error.message}`);
  }

  try {
    mirrorBytes = await readFile(DROP_PARAMS_PATHS.adminMirror);
    mirrorParams = JSON.parse(mirrorBytes.toString("utf8"));
  } catch (error) {
    errors.push(`Admin mirror could not be read and parsed: ${error.message}`);
  }

  if (canonical && options.expectedParams && !isDeepStrictEqual(canonical, options.expectedParams)) {
    errors.push("canonical JS does not equal the expected params");
  }
  if (canonical && outerParams && !isDeepStrictEqual(outerParams, canonical)) {
    errors.push("outer JSON does not semantically equal canonical JS");
  }
  if (canonical && mirrorParams && !isDeepStrictEqual(mirrorParams, canonical)) {
    errors.push("Admin mirror does not semantically equal canonical JS");
  }
  if (outerBytes && mirrorBytes && !outerBytes.equals(mirrorBytes)) {
    errors.push("outer JSON and Admin mirror are not byte-identical");
  }

  return { ok: errors.length === 0, errors, sourceVersion };
}

export async function assertDropParamsEquality(options = {}) {
  const result = await verifyDropParamsEquality(options);
  if (!result.ok) throw new Error(`Drop Params equality verification failed:\n- ${result.errors.join("\n- ")}`);
  return result;
}

export function dropParamsPathsAreRepositoryScoped() {
  const relativePaths = Object.values(DROP_PARAMS_PATHS).map(filePath =>
    path.relative(repoRoot, filePath)
  );
  return relativePaths.every(relativePath =>
    relativePath !== "" &&
    relativePath !== ".." &&
    !relativePath.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relativePath)
  );
}

export const DROP_PARAMS_REPO_ROOT = repoRoot;
