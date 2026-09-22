import assert from "node:assert/strict";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  DROP_PARAMS_OPERATIONS,
  INACTIVE_DROP_PARAMS,
  evaluateSerializedDropParams,
  getCandidateSourceVersion,
  serializeDropParamsSource,
  sha256SourceBytes,
  validateDropParams
} from "./drop-params-authoring.mjs";
import {
  DROP_PARAMS_PATHS,
  acquireDropParamsLock,
  assertDropParamsEquality,
  dropParamsPathsAreRepositoryScoped,
  getCurrentSourceVersion,
  inspectDropParamsLock,
  projectDropParams,
  reclaimStaleDropParamsLock,
  replaceDropParamsFileAtomic,
  serializeDropParamsJson,
  verifyDropParamsEquality
} from "./drop-params-projector.mjs";
import currentDropParams from "./drop-params.js";
import { normalize as normalizeAdminDropParams } from "../../admin-ui/src/features/drops/drops.data.js";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDirectory, "..", "..");

function clone(value) {
  return structuredClone(value);
}

function activeFixture() {
  const fixture = clone(currentDropParams);
  fixture.dropScheduled = true;
  return fixture;
}

function lockClaimPathForTest(token) {
  return path.join(DROP_PARAMS_PATHS.transactionLock, `claim-${token}.json`);
}

async function writeLockClaimForTest(metadata) {
  await mkdir(DROP_PARAMS_PATHS.transactionLock, { recursive: true });
  const claimPath = lockClaimPathForTest(metadata.token);
  await writeFile(claimPath, `${JSON.stringify(metadata)}\n`);
  return claimPath;
}

function staleLockMetadata(token) {
  return {
    pid: 2_147_483_647,
    token,
    phase: "owned",
    ticket: 1,
    acquiredAt: "2000-01-01T00:00:00.000Z"
  };
}

test("current and active canonical fixtures validate", () => {
  assert.equal(validateDropParams(currentDropParams).ok, true);
  assert.equal(validateDropParams(activeFixture(), {
    operation: DROP_PARAMS_OPERATIONS.ACTIVE
  }).ok, true);
});

test("exact inactive template validates and missing dropScheduled does not", () => {
  assert.deepEqual(INACTIVE_DROP_PARAMS, {
    dropScheduled: false,
    dropName: "",
    mirrorNetwork: null,
    dropDate: null,
    dropTime: null,
    burnTokens: [],
    redeemToken: null
  });
  assert.equal(validateDropParams(INACTIVE_DROP_PARAMS, {
    operation: DROP_PARAMS_OPERATIONS.INACTIVE
  }).ok, true);

  const missingToggle = clone(INACTIVE_DROP_PARAMS);
  delete missingToggle.dropScheduled;
  const result = validateDropParams(missingToggle, {
    operation: DROP_PARAMS_OPERATIONS.INACTIVE
  });
  assert.equal(result.ok, false);
  assert(result.errors.some(error => error.path === "$.dropScheduled"));
});

test("unknown fields reject recursively", () => {
  const topLevel = activeFixture();
  topLevel.unexpected = true;
  assert(validateDropParams(topLevel).errors.some(error => error.code === "unknown_key"));

  const nested = activeFixture();
  nested.burnTokens[0].unexpected = true;
  assert(validateDropParams(nested).errors.some(error =>
    error.path === "$.burnTokens[0].unexpected"
  ));
});

test("date and time use shared executable validation semantics", () => {
  const badDate = activeFixture();
  badDate.dropDate = { month: "November", day: "31", year: "2026" };
  assert(validateDropParams(badDate).errors.some(error => error.code === "drop_time"));

  const badTime = activeFixture();
  badTime.dropTime = { time: "13:00", period: "PM", timezone: "EST" };
  assert(validateDropParams(badTime).errors.some(error => error.code === "drop_time"));
});

test("registry identities, safe integers, and duplicates are strict", () => {
  const invalid = activeFixture();
  invalid.burnTokens[0].collection = "UNKNOWN";
  invalid.burnTokens[0].burnAmount = Number.MAX_SAFE_INTEGER + 1;
  invalid.burnTokens[0].exclude = ["1", "1"];
  invalid.redeemToken.tokenId = "01";
  const result = validateDropParams(invalid);
  assert.equal(result.ok, false);
  assert(result.errors.some(error => error.code === "collection"));
  assert(result.errors.some(error => error.code === "integer"));
  assert(result.errors.some(error => error.code === "duplicate"));
  assert(result.errors.some(error => error.code === "token_id"));

  const duplicateBurnCollection = activeFixture();
  duplicateBurnCollection.burnTokens[1].collection =
    duplicateBurnCollection.burnTokens[0].collection;
  assert(validateDropParams(duplicateBurnCollection).errors.some(error =>
    error.path === "$.burnTokens[1].collection" && error.code === "duplicate"
  ));

  const invalidNetwork = activeFixture();
  invalidNetwork.mirrorNetwork = "shadownet";
  assert(validateDropParams(invalidNetwork).errors.some(error => error.code === "network"));
});

test("collection validation is scoped to the selected registry network", () => {
  const testnet = activeFixture();
  assert.equal(validateDropParams(testnet).ok, true);

  const mainnet = activeFixture();
  mainnet.mirrorNetwork = "mainnet";
  assert.equal(validateDropParams(mainnet).ok, true);

  const unavailableOnMainnet = clone(mainnet);
  unavailableOnMainnet.redeemToken.collection = "ACID COIN";
  const result = validateDropParams(unavailableOnMainnet);
  assert.equal(result.ok, false);
  assert(result.errors.some(error =>
    error.path === "$.redeemToken.collection" &&
    error.code === "collection_network" &&
    error.message.includes("mainnet")
  ));

  const unavailableBurnOnMainnet = clone(mainnet);
  unavailableBurnOnMainnet.burnTokens[0].collection = "ACID COIN";
  const burnResult = validateDropParams(unavailableBurnOnMainnet);
  assert.equal(burnResult.ok, false);
  assert(burnResult.errors.some(error =>
    error.path === "$.burnTokens[0].collection" &&
    error.code === "collection_network" &&
    error.message.includes("mainnet")
  ));

  assert.equal(validateDropParams(INACTIVE_DROP_PARAMS, {
    operation: DROP_PARAMS_OPERATIONS.INACTIVE
  }).ok, true);
});

test("legacy disabled-row empty exclusion sentinel round-trips", async () => {
  const source = serializeDropParamsSource(currentDropParams);
  const evaluated = await evaluateSerializedDropParams(currentDropParams);
  assert.deepEqual(evaluated, currentDropParams);
  assert.match(source, /"exclude": \[\n\s+""\n\s+\]/);

  const invalidEnabledSentinel = activeFixture();
  invalidEnabledSentinel.burnTokens[0].exclude = [""];
  assert.equal(validateDropParams(invalidEnabledSentinel).ok, false);
});

test("canonical source serializer is deterministic with fixed order and LF", async () => {
  const fixture = activeFixture();
  const reordered = {
    redeemToken: fixture.redeemToken,
    burnTokens: fixture.burnTokens,
    dropTime: fixture.dropTime,
    dropDate: fixture.dropDate,
    mirrorNetwork: fixture.mirrorNetwork,
    dropName: fixture.dropName,
    dropScheduled: fixture.dropScheduled
  };
  const first = serializeDropParamsSource(fixture);
  const second = serializeDropParamsSource(reordered);
  assert.equal(first, second);
  assert.equal(first.includes("\r"), false);
  assert(first.endsWith(";\n"));
  assert.deepEqual(await evaluateSerializedDropParams(reordered), fixture);
});

test("projection serialization is deterministic", () => {
  const fixture = activeFixture();
  assert.equal(serializeDropParamsJson(fixture), serializeDropParamsJson(fixture));
  assert.equal(serializeDropParamsJson(fixture).includes("\r"), false);
  assert.deepEqual(JSON.parse(serializeDropParamsJson(fixture)), fixture);
});

test("source versions hash exact source bytes", async () => {
  const bytes = await readFile(DROP_PARAMS_PATHS.canonicalSource);
  assert.equal(await getCurrentSourceVersion(), sha256SourceBytes(bytes));
  assert.equal(sha256SourceBytes(bytes), sha256SourceBytes(Buffer.from(bytes)));
  assert.notEqual(sha256SourceBytes(bytes), sha256SourceBytes(Buffer.concat([bytes, Buffer.from("\n")])));

  const fixture = activeFixture();
  assert.equal(
    getCandidateSourceVersion(fixture),
    sha256SourceBytes(serializeDropParamsSource(fixture))
  );
});

test("projector keeps outer and Admin bytes equal and equality guard detects drift", async () => {
  const originals = await Promise.all([
    readFile(DROP_PARAMS_PATHS.outerJson),
    readFile(DROP_PARAMS_PATHS.adminMirror)
  ]);

  try {
    await projectDropParams({ syncAdmin: true });
    const [outer, mirror] = await Promise.all([
      readFile(DROP_PARAMS_PATHS.outerJson),
      readFile(DROP_PARAMS_PATHS.adminMirror)
    ]);
    assert.deepEqual(mirror, outer);
    assert.equal((await assertDropParamsEquality()).ok, true);

    const drifted = JSON.parse(mirror.toString("utf8"));
    drifted.dropName = "__EQUALITY_GUARD_DRIFT__";
    await replaceDropParamsFileAtomic(
      DROP_PARAMS_PATHS.adminMirror,
      `${JSON.stringify(drifted, null, 2)}\n`
    );
    const drift = await verifyDropParamsEquality();
    assert.equal(drift.ok, false);
    assert(drift.errors.some(error => error.includes("semantically equal")));
    assert(drift.errors.some(error => error.includes("byte-identical")));
  } finally {
    await replaceDropParamsFileAtomic(DROP_PARAMS_PATHS.outerJson, originals[0]);
    await replaceDropParamsFileAtomic(DROP_PARAMS_PATHS.adminMirror, originals[1]);
  }
});

test("active repository-scoped lock is never reclaimed", async () => {
  assert.equal(dropParamsPathsAreRepositoryScoped(), true);
  const lock = await acquireDropParamsLock();
  try {
    const activeState = await inspectDropParamsLock();
    assert.equal(activeState.state, "owned");
    assert.equal(await reclaimStaleDropParamsLock(activeState), false);
    assert.equal((await inspectDropParamsLock()).metadata.token, lock.metadata.token);
  } finally {
    assert.equal(await lock.release(), true);
  }
  assert.equal(await lock.release(), false);
  assert.equal((await inspectDropParamsLock()).state, "unlocked");
});

test("unchanged stale claim is reclaimed explicitly and during acquisition", async () => {
  const explicitToken = "stale-explicit-owner";
  const automaticToken = "stale-automatic-owner";

  try {
    await writeLockClaimForTest(staleLockMetadata(explicitToken));
    const staleState = await inspectDropParamsLock();
    assert.equal(staleState.state, "stale");
    assert.equal(await reclaimStaleDropParamsLock(staleState), true);
    assert.equal((await inspectDropParamsLock()).state, "unlocked");

    await writeLockClaimForTest(staleLockMetadata(automaticToken));
    const acquired = await acquireDropParamsLock();
    assert.notEqual(acquired.metadata.token, automaticToken);
    assert.equal(await acquired.release(), true);
    assert.equal((await inspectDropParamsLock()).state, "unlocked");
  } finally {
    await unlink(lockClaimPathForTest(explicitToken)).catch(() => {});
    await unlink(lockClaimPathForTest(automaticToken)).catch(() => {});
  }
});

test("stale claim replaced before reclaim leaves the fresh owner protected", async () => {
  const staleToken = "stale-before-reclaim";
  let freshLock = null;
  try {
    const stalePath = await writeLockClaimForTest(staleLockMetadata(staleToken));
    const staleState = await inspectDropParamsLock();
    assert.equal(staleState.state, "stale");

    await unlink(stalePath);
    freshLock = await acquireDropParamsLock();
    assert.equal(await reclaimStaleDropParamsLock(staleState), false);
    const current = await inspectDropParamsLock();
    assert.equal(current.state, "owned");
    assert.equal(current.metadata.token, freshLock.metadata.token);
  } finally {
    if (freshLock) await freshLock.release();
    await unlink(lockClaimPathForTest(staleToken)).catch(() => {});
  }
});

test("replacement at the final reclaim boundary cannot be removed", async () => {
  const staleToken = "stale-final-boundary";
  let freshLock = null;
  try {
    await writeLockClaimForTest(staleLockMetadata(staleToken));
    const staleState = await inspectDropParamsLock();
    assert.equal(staleState.state, "stale");

    const reclaimed = await reclaimStaleDropParamsLock(staleState, {
      testHooks: {
        beforeReclaim: async ({ claimPath }) => {
          await unlink(claimPath);
          freshLock = await acquireDropParamsLock();
        }
      }
    });
    assert.equal(reclaimed, false);
    const current = await inspectDropParamsLock();
    assert.equal(current.state, "owned");
    assert.equal(current.metadata.token, freshLock.metadata.token);
  } finally {
    if (freshLock) await freshLock.release();
    await unlink(lockClaimPathForTest(staleToken)).catch(() => {});
  }
});

test("concurrent acquisition preserves single ownership", async () => {
  let ownersInCriticalSection = 0;
  let maximumOwners = 0;

  await Promise.all(Array.from({ length: 4 }, async () => {
    const lock = await acquireDropParamsLock({ timeoutMs: 2_000, retryMs: 5 });
    try {
      ownersInCriticalSection += 1;
      maximumOwners = Math.max(maximumOwners, ownersInCriticalSection);
      await new Promise(resolve => setTimeout(resolve, 20));
      ownersInCriticalSection -= 1;
    } finally {
      await lock.release();
    }
  }));

  assert.equal(maximumOwners, 1);
  assert.equal((await inspectDropParamsLock()).state, "unlocked");
});

test("safe release does not remove another owner's claim", async () => {
  const oldLock = await acquireDropParamsLock();
  let replacementLock = null;
  try {
    await unlink(lockClaimPathForTest(oldLock.metadata.token));
    replacementLock = await acquireDropParamsLock();
    assert.equal(await oldLock.release(), false);
    const current = await inspectDropParamsLock();
    assert.equal(current.state, "owned");
    assert.equal(current.metadata.token, replacementLock.metadata.token);
  } finally {
    if (replacementLock) await replacementLock.release();
    await unlink(lockClaimPathForTest(oldLock.metadata.token)).catch(() => {});
  }
});

test("existing generator remains a thin, deterministic outer projection consumer", async () => {
  const messages = [];
  const originalLog = console.log;
  console.log = (...args) => { messages.push(args.join(" ")); };
  try {
    const generatorUrl = pathToFileURL(path.join(testDirectory, "gen-drop-params-json.mjs"));
    generatorUrl.searchParams.set("test", String(Date.now()));
    await import(generatorUrl.href);
  } finally {
    console.log = originalLog;
  }
  assert(messages.some(message => /\[drop-params\] (?:unchanged|wrote)/.test(message)));
  assert.equal((await verifyDropParamsEquality()).ok, true);
});

test("exact inactive template is tolerated by current public and Admin consumers", async () => {
  const normalized = normalizeAdminDropParams(INACTIVE_DROP_PARAMS);
  assert.equal(normalized.dropScheduled, false);
  assert.equal(normalized.dropName, "-");
  assert.equal(normalized.redeem.tokenId, null);

  const eventsPath = path.join(repoRoot, "drops", "js", "events.js");
  const eventsSource = await readFile(eventsPath, "utf8");
  const start = eventsSource.indexOf("function applyDropScheduledGate()");
  const end = eventsSource.indexOf("\nfunction renderNetworkUnavailable", start);
  assert(start >= 0 && end > start, "public drop-scheduled gate must remain discoverable");
  const gateSource = eventsSource.slice(start, end);
  const elements = new Map([
    [".drops-page-load-spinner-div", { style: {} }],
    [".drops-ui-div", { style: {} }],
    [".no-drops-scheduled-div", { style: {} }]
  ]);
  const document = { querySelector: selector => elements.get(selector) || null };
  const applyGate = Function(
    "dropParams",
    "document",
    `"use strict"; ${gateSource}; return applyDropScheduledGate();`
  );
  assert.equal(applyGate(INACTIVE_DROP_PARAMS, document), false);
  assert.equal(elements.get(".drops-ui-div").style.display, "none");
  assert.equal(elements.get(".no-drops-scheduled-div").style.display, "flex");
  assert.match(eventsSource, /if \(!applyDropScheduledGate\(\)\) \{/);
});
