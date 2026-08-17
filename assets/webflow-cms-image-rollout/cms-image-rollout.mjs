import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import sharp from 'sharp';

import {
  compareTarget,
  diffPaths,
  digest,
  publicError,
  stable,
  verifyCmsImage,
  withoutImage,
} from '../webflow-cms-image-pilot/cms-image-pilot.mjs';

export const TICKET = 'CMS-IMG-3';
export const ELIGIBLE_COLLECTIONS = Object.freeze([
  'CANAAN',
  'THE 419 SCRIPT',
  'INTRODUCTIONS',
]);
export const EXCLUDED_COLLECTIONS = Object.freeze(['HEN']);
export const COLLECTION_POLICY = Object.freeze({
  CANAAN: Object.freeze({ eligible: true, order: 0, expectedCount: 31 }),
  'THE 419 SCRIPT': Object.freeze({ eligible: true, order: 1, expectedCount: 13 }),
  INTRODUCTIONS: Object.freeze({ eligible: true, order: 2, expectedCount: 5 }),
  HEN: Object.freeze({ eligible: false, order: 3, expectedCount: 17, reason: 'explicit sparse mirror belongs to CMS-IMG-4' }),
});
export const MODES = Object.freeze([
  'plan',
  'status',
  'stage-batch',
  'verify-staged',
  'publish-batch',
  'reconcile-published',
]);
export const WRITE_CAPABLE_MODES = Object.freeze(['stage-batch', 'publish-batch']);
export const EXPECTED_COUNTS = Object.freeze({ audited: 66, eligible: 49, excluded: 17, completed: 1, rollout: 48 });

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_PATHS = Object.freeze({
  repoRoot: path.resolve(moduleDir, '..', '..'),
  mapping: path.resolve(moduleDir, '..', '..', 'docs', 'webflow-cms-image-audit', 'CMS-IMG-1.mapping.json'),
  completions: path.resolve(moduleDir, '..', '..', 'docs', 'webflow-cms-image-audit', 'CMS-IMG-2.completion.json'),
  dropParams: path.resolve(moduleDir, '..', '..', 'shared', 'drop-params', 'drop-params.js'),
  planJson: path.resolve(moduleDir, '..', '..', 'docs', 'webflow-cms-image-audit', 'CMS-IMG-3.rollout-plan.json'),
  planMarkdown: path.resolve(moduleDir, '..', '..', 'docs', 'webflow-cms-image-audit', 'CMS-IMG-3.rollout-plan.md'),
  runtime: path.join(moduleDir, 'runtime'),
});

const REQUIRED_STRING_FIELDS = Object.freeze([
  'collection', 'collectionId', 'cmsItemId', 'cmsItemName', 'cmsSlug',
  'cmsLocaleId', 'localApprovedJpegPath', 'mappingAuthority', 'mappingConfidence',
]);
const RETAINED_METADATA = Object.freeze(['exif', 'icc', 'iptc', 'xmp', 'tifftagPhotoshop', 'comments']);
const SYSTEM_TIMESTAMPS = new Set(['lastUpdated', 'lastPublished']);
const SUCCESS_PHASES = new Set([
  'pending', 'upload-ready', 'uploaded', 'staged', 'staged-verified',
  'publish-approved', 'published', 'published-verified',
]);
const TRANSITIONS = Object.freeze({
  pending: new Set(['upload-ready', 'uploaded', 'staged', 'staged-verified', 'published-verified']),
  'upload-ready': new Set(['uploaded', 'staged', 'staged-verified', 'published-verified']),
  uploaded: new Set(['staged', 'staged-verified', 'published-verified']),
  staged: new Set(['staged-verified', 'published-verified']),
  'staged-verified': new Set(['publish-approved', 'published', 'published-verified']),
  'publish-approved': new Set(['published', 'published-verified']),
  published: new Set(['published-verified']),
  'published-verified': new Set(['published-verified']),
});

export class RolloutError extends Error {
  constructor(message, { code = 'BLOCKED', details, writeOutcome = 'not-attempted' } = {}) {
    super(message);
    this.name = 'RolloutError';
    this.code = code;
    this.details = details;
    this.writeOutcome = writeOutcome;
  }
}

const ROLLOUT_SECRET_KEY = /authorization|^token$|api[-_]?token|secret|signature|credential|policy|x-amz-|uploadurl/i;

export function redactRollout(value, key = '') {
  if (ROLLOUT_SECRET_KEY.test(key)) return '[REDACTED]';
  if (Array.isArray(value)) return value.map((item) => redactRollout(item));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([childKey, child]) => [childKey, redactRollout(child, childKey)]));
  }
  if (typeof value === 'string') {
    return value
      .replace(/Bearer\s+[A-Za-z0-9._~+\/-]+=*/gi, 'Bearer [REDACTED]')
      .replace(/([?&](?:X-Amz-[^=]+|Policy|Signature|Credential)=)[^&\s]+/gi, '$1[REDACTED]');
  }
  return value;
}

const readJson = async (filePath) => JSON.parse(await fs.readFile(filePath, 'utf8'));

async function atomicWrite(filePath, contents) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.${process.pid}.${crypto.randomUUID()}.tmp`;
  await fs.writeFile(temporary, contents);
  await fs.rename(temporary, filePath);
}

export async function writeJson(filePath, value) {
  await atomicWrite(filePath, `${JSON.stringify(redactRollout(value), null, 2)}\n`);
}

function assertNonEmptyString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') throw new RolloutError(`${label} must be a non-empty string.`);
}

function itemKey(item) {
  return `${item.collection}|${Number(item.cmsTokenId)}`;
}

function compareItems(left, right) {
  const collectionDifference = COLLECTION_POLICY[left.collection].order - COLLECTION_POLICY[right.collection].order;
  if (collectionDifference !== 0) return collectionDifference;
  const tokenDifference = Number(left.cmsTokenId) - Number(right.cmsTokenId);
  return tokenDifference || left.cmsItemId.localeCompare(right.cmsItemId);
}

export function validateMapping(mapping) {
  if (!mapping || !Array.isArray(mapping.items)) throw new RolloutError('Mapping authority must contain an items array.');
  if (mapping.mappingSummary?.total !== EXPECTED_COUNTS.audited || mapping.items.length !== EXPECTED_COUNTS.audited) {
    throw new RolloutError(`Mapping total is ${mapping.items.length}/${mapping.mappingSummary?.total}; expected ${EXPECTED_COUNTS.audited}.`);
  }
  const itemIds = new Set();
  const tokens = new Set();
  const localPaths = new Set();
  const counts = {};
  for (const [index, item] of mapping.items.entries()) {
    for (const field of REQUIRED_STRING_FIELDS) assertNonEmptyString(item[field], `items[${index}].${field}`);
    if (!Object.hasOwn(COLLECTION_POLICY, item.collection)) throw new RolloutError(`Unsupported collection ${item.collection}.`);
    if (!Number.isSafeInteger(item.cmsTokenId) || item.cmsTokenId < 0) throw new RolloutError(`${itemKey(item)} has an invalid token ID.`);
    if (!Number.isSafeInteger(item.localNumericBasename) ||
        (COLLECTION_POLICY[item.collection].eligible && item.localNumericBasename !== item.cmsTokenId)) {
      throw new RolloutError(`${itemKey(item)} does not directly match its authoritative numeric basename.`);
    }
    if (!Number.isSafeInteger(item.localFileBytes) || item.localFileBytes <= 0) throw new RolloutError(`${itemKey(item)} has invalid local byte metadata.`);
    if (!Number.isSafeInteger(item.localDimensions?.width) || !Number.isSafeInteger(item.localDimensions?.height)) {
      throw new RolloutError(`${itemKey(item)} has invalid local dimensions.`);
    }
    if (item.mappingConfidence !== 'HIGH' || item.ambiguityOrDiscrepancy !== null) {
      throw new RolloutError(`${itemKey(item)} is not an unambiguous HIGH-confidence mapping.`);
    }
    if (item.isDraft !== false || item.isArchived !== false) throw new RolloutError(`${itemKey(item)} is draft or archived.`);
    if (itemIds.has(item.cmsItemId)) throw new RolloutError(`Duplicate CMS item ID ${item.cmsItemId}.`);
    if (tokens.has(itemKey(item))) throw new RolloutError(`Duplicate collection/token ${itemKey(item)}.`);
    if (localPaths.has(item.localApprovedJpegPath)) throw new RolloutError(`Duplicate local path ${item.localApprovedJpegPath}.`);
    itemIds.add(item.cmsItemId);
    tokens.add(itemKey(item));
    localPaths.add(item.localApprovedJpegPath);
    counts[item.collection] = (counts[item.collection] ?? 0) + 1;
  }
  for (const [collection, policy] of Object.entries(COLLECTION_POLICY)) {
    if (counts[collection] !== policy.expectedCount) {
      throw new RolloutError(`${collection} mapping count is ${counts[collection] ?? 0}; expected ${policy.expectedCount}.`);
    }
  }
  return { counts, itemIds, tokens, localPaths };
}

export function validateCompletions(completions, mapping) {
  if (!completions || !Array.isArray(completions.items)) throw new RolloutError('Completion authority must contain an items array.');
  assertNonEmptyString(completions.ticket, 'completion authority ticket');
  const known = new Map(mapping.items.map((item) => [item.cmsItemId, item]));
  const completed = new Map();
  for (const completion of completions.items) {
    assertNonEmptyString(completion.cmsItemId, 'completion.cmsItemId');
    assertNonEmptyString(completion.status, 'completion.status');
    const item = known.get(completion.cmsItemId);
    if (!item) throw new RolloutError(`Completion ${completion.cmsItemId} is absent from the mapping authority.`);
    if (completion.status !== 'published-verified') throw new RolloutError(`Completion ${completion.cmsItemId} is not published-verified.`);
    if (completion.collection !== item.collection || Number(completion.cmsTokenId) !== item.cmsTokenId) {
      throw new RolloutError(`Completion ${completion.cmsItemId} identity disagrees with the mapping authority.`);
    }
    if (!Array.isArray(completion.evidence) || completion.evidence.length === 0) {
      throw new RolloutError(`Completion ${completion.cmsItemId} lacks durable evidence references.`);
    }
    if (completed.has(completion.cmsItemId)) throw new RolloutError(`Duplicate completion ${completion.cmsItemId}.`);
    completed.set(completion.cmsItemId, { ...completion, ticket: completion.ticket ?? completions.ticket });
  }
  return completed;
}

export async function inspectLocalImage(repoRoot, item) {
  const localPath = path.resolve(repoRoot, item.localApprovedJpegPath);
  const relative = path.relative(repoRoot, localPath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new RolloutError(`Local image escapes the repository: ${item.localApprovedJpegPath}.`);
  let bytes;
  try { bytes = await fs.readFile(localPath); }
  catch (error) { throw new RolloutError(`Missing local image ${item.localApprovedJpegPath}: ${error.message}`); }
  let metadata;
  try { metadata = await sharp(bytes, { failOn: 'error' }).metadata(); }
  catch (error) { throw new RolloutError(`Undecodable local image ${item.localApprovedJpegPath}: ${error.message}`); }
  const retainedMetadata = RETAINED_METADATA.filter((field) => {
    const value = metadata[field];
    return Array.isArray(value) ? value.length > 0 : value != null;
  });
  const failures = [];
  if (metadata.format !== 'jpeg') failures.push(`format=${metadata.format}`);
  if (metadata.width !== item.localDimensions.width || metadata.height !== item.localDimensions.height) {
    failures.push(`dimensions=${metadata.width}x${metadata.height}`);
  }
  if (metadata.width !== 300) failures.push(`width=${metadata.width}`);
  if (metadata.isProgressive !== true) failures.push('not progressive');
  if (metadata.space?.toLowerCase() !== 'srgb') failures.push(`colourspace=${metadata.space}`);
  if (metadata.hasProfile) failures.push('embedded profile present');
  if (retainedMetadata.length) failures.push(`metadata present: ${retainedMetadata.join(', ')}`);
  if (bytes.length !== item.localFileBytes) failures.push(`bytes=${bytes.length}, mapped=${item.localFileBytes}`);
  if (failures.length) throw new RolloutError(`${itemKey(item)} local image mismatch (${failures.join('; ')}).`);
  return {
    bytes,
    sha256: digest(bytes, 'sha256'),
    md5: digest(bytes, 'md5'),
    bytesLength: bytes.length,
    dimensions: { width: metadata.width, height: metadata.height },
    format: metadata.format,
    progressive: metadata.isProgressive,
  };
}

function batchItems(items) {
  const byCollection = new Map(ELIGIBLE_COLLECTIONS.map((collection) => [collection, items.filter((item) => item.collection === collection)]));
  const batches = [];
  const add = (collection, members) => {
    if (!members.length) return;
    batches.push({
      batchId: `B${batches.length + 1}`,
      batchNumber: batches.length + 1,
      collection,
      itemIds: members.map((item) => item.cmsItemId),
      count: members.length,
    });
  };
  const canaan = byCollection.get('CANAAN');
  add('CANAAN', canaan.slice(0, 5));
  for (let index = 5; index < canaan.length; index += 13) add('CANAAN', canaan.slice(index, index + 13));
  for (const collection of ['THE 419 SCRIPT', 'INTRODUCTIONS']) {
    const members = byCollection.get(collection);
    for (let index = 0; index < members.length; index += 13) add(collection, members.slice(index, index + 13));
  }
  if (batches[0]?.count !== 5) throw new RolloutError(`Batch 1 contains ${batches[0]?.count ?? 0} items; expected exactly 5.`);
  return batches;
}

export async function buildRolloutPlan({ mapping, completions, repoRoot = DEFAULT_PATHS.repoRoot }) {
  const mappingValidation = validateMapping(mapping);
  const completed = validateCompletions(completions, mapping);
  const eligible = mapping.items.filter((item) => COLLECTION_POLICY[item.collection].eligible).sort(compareItems);
  const excluded = mapping.items.filter((item) => !COLLECTION_POLICY[item.collection].eligible).sort(compareItems);
  const rollout = eligible.filter((item) => !completed.has(item.cmsItemId));
  if (eligible.length !== EXPECTED_COUNTS.eligible || excluded.length !== EXPECTED_COUNTS.excluded ||
      completed.size !== EXPECTED_COUNTS.completed || rollout.length !== EXPECTED_COUNTS.rollout) {
    throw new RolloutError(`Population mismatch: eligible=${eligible.length}, excluded=${excluded.length}, completed=${completed.size}, rollout=${rollout.length}.`);
  }
  const batches = batchItems(rollout);
  const batchByItem = new Map(batches.flatMap((batch) => batch.itemIds.map((id) => [id, batch])));
  const inspected = new Map();
  for (const item of eligible) inspected.set(item.cmsItemId, await inspectLocalImage(repoRoot, item));
  const items = eligible.map((item) => {
    const completion = completed.get(item.cmsItemId);
    const batch = batchByItem.get(item.cmsItemId);
    const local = inspected.get(item.cmsItemId);
    return {
      batchNumber: batch?.batchNumber ?? null,
      batchId: batch?.batchId ?? null,
      collection: item.collection,
      collectionId: item.collectionId,
      tokenId: item.cmsTokenId,
      title: item.cmsItemName,
      cmsItemId: item.cmsItemId,
      localeId: item.cmsLocaleId,
      slug: item.cmsSlug,
      localSourceImage: item.localApprovedJpegPath,
      localSha256: local.sha256,
      localMd5: local.md5,
      localBytes: local.bytesLength,
      expectedDimensions: local.dimensions,
      migrationStatus: completion ? 'already-migrated' : 'pending',
      skipReason: completion ? `${completion.ticket} durable completion record: ${completion.status}` : null,
    };
  });
  return {
    ticket: TICKET,
    sourceTicket: mapping.ticket,
    sourceGeneratedAt: mapping.generatedAt,
    sources: {
      mapping: 'docs/webflow-cms-image-audit/CMS-IMG-1.mapping.json',
      completion: 'docs/webflow-cms-image-audit/CMS-IMG-2.completion.json',
      pilotImplementation: 'assets/webflow-cms-image-pilot/cms-image-pilot.mjs',
      pilotEvidence: 'assets/webflow-cms-image-pilot/README.md',
    },
    site: { siteId: mapping.site?.siteId, displayName: mapping.site?.displayName },
    orderingRule: 'collection policy order, then numeric CMS token ID ascending, then CMS item ID',
    batchingRule: 'CANAAN starts with exactly 5, then collection-local chunks of at most 13; later collections use collection-local chunks of at most 13',
    counts: {
      totalAuditedMappings: mapping.items.length,
      eligibleDirectMapMappings: eligible.length,
      excludedHenMappings: excluded.length,
      alreadyMigratedMappings: completed.size,
      remainingRolloutMappings: rollout.length,
      byCollection: mappingValidation.counts,
      rolloutByCollection: Object.fromEntries(ELIGIBLE_COLLECTIONS.map((collection) => [collection, rollout.filter((item) => item.collection === collection).length])),
    },
    policy: Object.fromEntries(Object.entries(COLLECTION_POLICY).map(([name, value]) => [name, { eligible: value.eligible, reason: value.reason ?? null }])),
    completedItems: [...completed.values()].map((completion) => redactRollout(completion)),
    batches,
    items,
    hardStops: [
      'mapping ambiguity or unsupported collection',
      'duplicate CMS item, collection/token, or local path',
      'unexpected CMS identity or missing item',
      'a planned item is the currently configured active redeem token',
      'missing, undecodable, or metadata-mismatched local image',
      'content hash/dimension mismatch',
      'non-image field or unrelated-item drift',
      'stale or uncertain journal state requiring reconciliation',
      'failed content-based staged/live verification',
      'unknown upload, patch, or publish outcome',
      'publication response or live-state ambiguity',
    ],
    publicationBoundary: 'Staging never cascades to publishing. publish-batch requires a named batch, an exact verified item-ID set, an exact confirmation string, and no blocked or reconciliation-required item.',
    externalWritesPerformed: 0,
    statement: 'Generated entirely from repository mapping, local image bytes, and durable pilot evidence. No Webflow request or write was performed.',
  };
}

function stripSystemTimestamps(value) {
  if (Array.isArray(value)) return value.map(stripSystemTimestamps);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value)
      .filter(([key]) => !SYSTEM_TIMESTAMPS.has(key))
      .map(([key, child]) => [key, stripSystemTimestamps(child)]));
  }
  return value;
}

function sortCmsItems(items) {
  return [...items].sort((left, right) => `${left.id}:${left.cmsLocaleId}`.localeCompare(`${right.id}:${right.cmsLocaleId}`));
}

function parsedCmsTimestamp(value) {
  if (typeof value !== 'string' || value.length === 0) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function verifyCleanPublishedState(staged, live) {
  const stagedLastUpdated = parsedCmsTimestamp(staged?.lastUpdated);
  const stagedLastPublished = parsedCmsTimestamp(staged?.lastPublished);
  const liveLastUpdated = parsedCmsTimestamp(live?.lastUpdated);
  const liveLastPublished = parsedCmsTimestamp(live?.lastPublished);
  const lastPublishedPresent = staged?.lastPublished != null && live?.lastPublished != null;
  const timestampsValid = [stagedLastUpdated, stagedLastPublished, liveLastUpdated, liveLastPublished]
    .every((timestamp) => timestamp !== null);
  const stagedUpdatedNotAfterPublished = timestampsValid && stagedLastUpdated <= stagedLastPublished;
  const liveUpdatedNotAfterPublished = timestampsValid && liveLastUpdated <= liveLastPublished;
  const publicationMarkersCoverAllUpdates = timestampsValid &&
    Math.max(stagedLastUpdated, liveLastUpdated) <= Math.min(stagedLastPublished, liveLastPublished);
  const publishedFlagsClean = staged?.isDraft === false && live?.isDraft === false &&
    staged?.isArchived === false && live?.isArchived === false;
  return {
    ok: lastPublishedPresent && timestampsValid && stagedUpdatedNotAfterPublished &&
      liveUpdatedNotAfterPublished && publicationMarkersCoverAllUpdates && publishedFlagsClean,
    lastPublishedPresent,
    timestampsValid,
    stagedUpdatedNotAfterPublished,
    liveUpdatedNotAfterPublished,
    publicationMarkersCoverAllUpdates,
    publishedFlagsClean,
    staged: { lastUpdated: staged?.lastUpdated ?? null, lastPublished: staged?.lastPublished ?? null },
    live: { lastUpdated: live?.lastUpdated ?? null, lastPublished: live?.lastPublished ?? null },
  };
}

export function compareUnrelatedItems(beforeItems, afterItems, targetItemIds) {
  const targets = new Set(targetItemIds);
  const before = sortCmsItems(beforeItems.filter((item) => !targets.has(item.id))).map(stripSystemTimestamps);
  const after = sortCmsItems(afterItems.filter((item) => !targets.has(item.id))).map(stripSystemTimestamps);
  return { ok: stable(before) === stable(after), differences: diffPaths(before, after) };
}

export function assertCmsIdentity(cmsItem, plannedItem) {
  const failures = [];
  if (cmsItem?.id !== plannedItem.cmsItemId) failures.push(`id=${cmsItem?.id}`);
  if (cmsItem?.cmsLocaleId !== plannedItem.localeId) failures.push(`cmsLocaleId=${cmsItem?.cmsLocaleId}`);
  if (Number(cmsItem?.fieldData?.['token-id']) !== plannedItem.tokenId) failures.push(`token-id=${cmsItem?.fieldData?.['token-id']}`);
  if (cmsItem?.fieldData?.name !== plannedItem.title) failures.push(`name=${cmsItem?.fieldData?.name}`);
  if (cmsItem?.fieldData?.slug !== plannedItem.slug) failures.push(`slug=${cmsItem?.fieldData?.slug}`);
  if (cmsItem?.isDraft !== false) failures.push(`isDraft=${cmsItem?.isDraft}`);
  if (cmsItem?.isArchived !== false) failures.push(`isArchived=${cmsItem?.isArchived}`);
  if (failures.length) throw new RolloutError(`${plannedItem.collection}|${plannedItem.tokenId} CMS identity mismatch (${failures.join('; ')}).`, {
    code: 'CMS_IDENTITY_MISMATCH', details: { itemId: plannedItem.cmsItemId, failures },
  });
}

export function assertNoActiveRedeemTarget(plannedItems, dropParams) {
  const activeCollection = dropParams?.redeemToken?.collection;
  const activeTokenId = Number(dropParams?.redeemToken?.tokenId);
  const conflict = plannedItems.find((item) => item.collection === activeCollection && item.tokenId === activeTokenId);
  if (conflict) {
    throw new RolloutError(`${conflict.collection}|${conflict.tokenId} is the configured active redeem token.`, {
      code: 'ACTIVE_REDEEM_TOKEN_CONFLICT', details: { itemId: conflict.cmsItemId },
    });
  }
}

function exactlyOneCmsItem(items, plannedItem, label) {
  const matches = items.filter((item) => item.id === plannedItem.cmsItemId);
  if (matches.length !== 1) throw new RolloutError(`${label} match count for ${plannedItem.cmsItemId} is ${matches.length}; expected 1.`, {
    code: 'CMS_ITEM_MATCH_COUNT', details: { itemId: plannedItem.cmsItemId, label, matches: matches.length },
  });
  assertCmsIdentity(matches[0], plannedItem);
  return matches[0];
}

export async function verifyPlannedCmsImage(cmsImage, local, fetchImpl = fetch, submittedImage = null) {
  return verifyCmsImage(cmsImage, { bytes: local.bytes, sha256: local.sha256,
    metadata: { format: local.format, ...local.dimensions } }, fetchImpl, submittedImage);
}

export function initialItemState(plannedItem) {
  return {
    cmsItemId: plannedItem.cmsItemId,
    collection: plannedItem.collection,
    tokenId: plannedItem.tokenId,
    localSourceImage: plannedItem.localSourceImage,
    localSha256: plannedItem.localSha256,
    currentPhase: 'pending',
    lastSuccessfulPhase: 'pending',
    reconciliationRequired: false,
    lastAttempt: null,
    lastAttemptStatus: null,
    attempts: [],
    blockedAttempts: [],
    uploadedAsset: null,
    submittedImage: null,
    resultingStagedImage: null,
    publishedImage: null,
    errors: [],
  };
}

export function initialBatchJournal(plan, batchId, now = new Date().toISOString()) {
  const batch = requireBatch(plan, batchId);
  const plannedItems = batch.itemIds.map((id) => requirePlanItem(plan, id));
  return {
    schemaVersion: 1,
    ticket: TICKET,
    batchId,
    collection: batch.collection,
    plannedItemIds: [...batch.itemIds],
    planFingerprint: digest(Buffer.from(stable(plannedItems)), 'sha256'),
    createdAt: now,
    updatedAt: now,
    attempts: [],
    publishApproval: null,
    items: Object.fromEntries(plannedItems.map((item) => [item.cmsItemId, initialItemState(item)])),
  };
}

export function recordItemAttempt(journal, itemId, attempt, now = new Date().toISOString()) {
  const prior = journal.items?.[itemId];
  if (!prior) throw new RolloutError(`Journal has no planned item ${itemId}.`);
  const status = attempt.status;
  if (!['succeeded', 'blocked', 'reconciliation-required'].includes(status)) throw new RolloutError(`Invalid attempt status ${status}.`);
  const record = redactRollout({ id: attempt.id ?? crypto.randomUUID(), phase: attempt.phase, status,
    at: attempt.at ?? now, writeOutcome: attempt.writeOutcome ?? 'not-attempted', error: attempt.error ?? null,
    details: attempt.details ?? null });
  let nextItem = { ...prior, lastAttempt: record, lastAttemptStatus: status, attempts: [...prior.attempts, record] };
  if (status === 'succeeded') {
    if (!SUCCESS_PHASES.has(attempt.phase)) throw new RolloutError(`Unknown successful phase ${attempt.phase}.`);
    const allowed = TRANSITIONS[prior.currentPhase];
    if (!allowed?.has(attempt.phase) && prior.currentPhase !== attempt.phase) {
      throw new RolloutError(`Invalid state transition ${prior.currentPhase} -> ${attempt.phase} for ${itemId}.`);
    }
    nextItem = {
      ...nextItem,
      currentPhase: attempt.phase,
      lastSuccessfulPhase: attempt.phase,
      reconciliationRequired: false,
      ...(attempt.patch ?? {}),
    };
  } else {
    const reconciliationRequired = prior.reconciliationRequired || status === 'reconciliation-required' ||
      ['unknown', 'applied-unverified'].includes(record.writeOutcome);
    nextItem = {
      ...nextItem,
      currentPhase: prior.lastSuccessfulPhase,
      lastSuccessfulPhase: prior.lastSuccessfulPhase,
      reconciliationRequired,
      blockedAttempts: [...prior.blockedAttempts, record],
      errors: record.error ? [...prior.errors, record.error] : prior.errors,
    };
  }
  return {
    ...journal,
    updatedAt: now,
    attempts: [...journal.attempts, { itemId, ...record }],
    items: { ...journal.items, [itemId]: nextItem },
  };
}

export function determineIdempotentAction({ itemState, localMatchesStaged, localMatchesLive, reusableUploadedAsset }) {
  if (itemState.reconciliationRequired) return 'reconcile-required';
  if (localMatchesLive) return 'reconcile-published';
  if (localMatchesStaged) return 'verify-staged-noop';
  if (reusableUploadedAsset?.verifiedSha256 === itemState.localSha256) return 'reuse-upload';
  return 'upload-and-stage';
}

export function requireBatch(plan, batchId) {
  const batch = plan.batches.find((candidate) => candidate.batchId === batchId);
  if (!batch) throw new RolloutError(`Unknown batch ${batchId}.`);
  if (batch.count !== batch.itemIds.length || batch.count === 0) throw new RolloutError(`Batch ${batchId} is malformed.`);
  if (new Set(batch.itemIds).size !== batch.itemIds.length) throw new RolloutError(`Batch ${batchId} contains duplicate item IDs.`);
  return batch;
}

export function requirePlanItem(plan, itemId) {
  const matches = plan.items.filter((item) => item.cmsItemId === itemId && item.migrationStatus === 'pending');
  if (matches.length !== 1) throw new RolloutError(`Pending plan item ${itemId} match count is ${matches.length}; expected 1.`);
  return matches[0];
}

export function exactPublishItemIds(plan, batchId, journal) {
  const batch = requireBatch(plan, batchId);
  if (journal.batchId !== batchId || stable(journal.plannedItemIds) !== stable(batch.itemIds)) {
    throw new RolloutError(`Journal identity does not match batch ${batchId}.`);
  }
  for (const itemId of batch.itemIds) {
    const state = journal.items[itemId];
    if (state?.currentPhase !== 'staged-verified' || state.lastSuccessfulPhase !== 'staged-verified' ||
        state.reconciliationRequired || state.lastAttemptStatus !== 'succeeded') {
      throw new RolloutError(`Item ${itemId} is not publish eligible.`);
    }
  }
  return [...batch.itemIds];
}

export function publishConfirmation(batchId, itemIds) {
  return `${TICKET}:PUBLISH:${batchId}:${itemIds.join(',')}`;
}

export function approvePublish(plan, batchId, journal, confirmation, now = new Date().toISOString()) {
  const itemIds = exactPublishItemIds(plan, batchId, journal);
  const expected = publishConfirmation(batchId, itemIds);
  if (confirmation !== expected) throw new RolloutError('Exact batch publish confirmation is missing.');
  let next = { ...journal, publishApproval: { approvedAt: now, batchId, itemIds, confirmationSha256: digest(Buffer.from(confirmation), 'sha256') } };
  for (const itemId of itemIds) next = recordItemAttempt(next, itemId, { phase: 'publish-approved', status: 'succeeded' }, now);
  return next;
}

function planFingerprint(plan, batchId) {
  const batch = requireBatch(plan, batchId);
  return digest(Buffer.from(stable(batch.itemIds.map((id) => requirePlanItem(plan, id)))), 'sha256');
}

export async function loadBatchJournal(plan, batchId, runtime = DEFAULT_PATHS.runtime) {
  const filePath = path.join(runtime, batchId, 'journal.json');
  let journal;
  try { journal = await readJson(filePath); }
  catch (error) {
    if (error?.code === 'ENOENT') return initialBatchJournal(plan, batchId);
    throw error;
  }
  if (journal.ticket !== TICKET || journal.batchId !== batchId || journal.planFingerprint !== planFingerprint(plan, batchId)) {
    throw new RolloutError(`Stale or foreign journal for ${batchId}.`);
  }
  return journal;
}

export async function saveBatchJournal(journal, runtime = DEFAULT_PATHS.runtime) {
  await writeJson(path.join(runtime, journal.batchId, 'journal.json'), journal);
}

export class WebflowRolloutClient {
  constructor({ token, siteId, fetchImpl = fetch, sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)) }) {
    if (!token) throw new RolloutError('WEBFLOW_API_TOKEN is not set.');
    assertNonEmptyString(siteId, 'siteId');
    this.token = token;
    this.siteId = siteId;
    this.fetch = fetchImpl;
    this.sleep = sleep;
    this.base = 'https://api.webflow.com/v2';
  }

  async request(method, endpoint, { body } = {}) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      let response;
      try {
        response = await this.fetch(`${this.base}${endpoint}`, {
          method,
          headers: { Authorization: `Bearer ${this.token}`, Accept: 'application/json',
            ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        });
      } catch (error) {
        if (method !== 'GET' || attempt === 2) throw error;
        await this.sleep(500);
        continue;
      }
      const text = await response.text();
      let parsed = null;
      try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
      if (response.status === 429 && attempt < 2) {
        await this.sleep(500 * (attempt + 1));
        continue;
      }
      if (!response.ok) throw new RolloutError(`Webflow ${method} ${endpoint} failed with HTTP ${response.status}.`, { details: redactRollout(parsed) });
      return parsed;
    }
    throw new RolloutError(`Webflow ${method} ${endpoint} exhausted retries.`);
  }

  getCollection(collectionId) { return this.request('GET', `/collections/${collectionId}`); }

  async listItems(collectionId, type) {
    const items = [];
    const suffix = type === 'live' ? '/live' : '';
    let total = Infinity;
    while (items.length < total) {
      const page = await this.request('GET', `/collections/${collectionId}/items${suffix}?limit=100&offset=${items.length}`);
      if (!Array.isArray(page?.items)) throw new RolloutError(`Invalid ${type} item-list response.`);
      items.push(...page.items);
      total = page.pagination?.total ?? items.length;
      if (page.items.length === 0) break;
    }
    return { items, pagination: { total, limit: 100, offset: 0 } };
  }

  async listAssets() {
    const assets = [];
    let total = Infinity;
    while (assets.length < total) {
      const page = await this.request('GET', `/sites/${this.siteId}/assets?limit=100&offset=${assets.length}`);
      if (!Array.isArray(page?.assets)) throw new RolloutError('Invalid asset-list response.');
      assets.push(...page.assets);
      total = page.pagination?.total ?? assets.length;
      if (page.assets.length === 0) break;
    }
    return assets;
  }

  getAsset(assetId) { return this.request('GET', `/assets/${assetId}`); }
  createAsset(fileName, fileHash) { return this.request('POST', `/sites/${this.siteId}/assets`, { body: { fileName, fileHash } }); }
  patchImage(collectionId, itemId, localeId, image) {
    return this.request('PATCH', `/collections/${collectionId}/items?skipInvalidFiles=false`, {
      body: { items: [{ id: itemId, cmsLocaleId: localeId, fieldData: { image } }] },
    });
  }
  publishItems(collectionId, itemIds) {
    return this.request('POST', `/collections/${collectionId}/items/publish`, { body: { itemIds } });
  }
}

export function assetFilename(plannedItem) {
  const collection = plannedItem.collection.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const slug = plannedItem.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `${collection}-${plannedItem.tokenId}-${slug}-300w-${plannedItem.localSha256.slice(0, 12)}.jpg`;
}

function assetNameMatches(asset, filename) {
  return asset?.originalFileName === filename || asset?.displayName === filename || asset?.displayName?.endsWith(`_${filename}`);
}

async function downloadBytes(url, fetchImpl = fetch) {
  let response;
  try { response = await fetchImpl(url, { method: 'GET', headers: { Accept: 'image/*' } }); }
  catch (error) { throw new RolloutError(`Image download failed before an HTTP response: ${error.message}`); }
  if (!response.ok) throw new RolloutError(`Image download failed with HTTP ${response.status}.`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.length) throw new RolloutError('Image download returned empty bytes.');
  return bytes;
}

async function verifyReusableAsset({ api, asset, plannedItem, local, fetchImpl }) {
  const current = await api.getAsset(asset.id);
  const filename = assetFilename(plannedItem);
  if (!assetNameMatches(current, filename)) throw new RolloutError(`Asset ${asset.id} filename mismatch.`);
  const url = current.hostedUrl ?? asset.hostedUrl ?? asset.assetUrl;
  if (!url) throw new RolloutError(`Asset ${asset.id} lacks a hosted URL.`);
  const sha256 = digest(await downloadBytes(url, fetchImpl), 'sha256');
  if (sha256 !== local.sha256) throw new RolloutError(`Asset ${asset.id} content hash mismatch.`);
  return redactRollout({ ...current, hostedUrl: url, verifiedSha256: sha256 });
}

async function uploadBinary(metadata, local, fetchImpl = fetch) {
  if (!metadata?.uploadUrl || !metadata?.uploadDetails) throw new RolloutError('Asset metadata lacks presigned upload details.');
  const form = new FormData();
  for (const [key, value] of Object.entries(metadata.uploadDetails)) form.append(key, String(value));
  form.append('file', new Blob([local.bytes], { type: metadata.contentType ?? 'image/jpeg' }), metadata.originalFileName);
  let response;
  try { response = await fetchImpl(metadata.uploadUrl, { method: 'POST', body: form }); }
  catch (error) {
    throw new RolloutError(`Asset byte upload outcome is unknown: ${error.message}`, {
      code: 'UNKNOWN_UPLOAD_OUTCOME', writeOutcome: 'unknown',
    });
  }
  if (response.status !== 201) throw new RolloutError(`Asset byte upload failed with HTTP ${response.status}.`, { writeOutcome: 'not-applied' });
}

async function ensureAsset({ api, plannedItem, local, itemState, assets, fetchImpl }) {
  const filename = assetFilename(plannedItem);
  const candidates = [];
  if (itemState.uploadedAsset?.id) candidates.push(itemState.uploadedAsset);
  for (const asset of assets.filter((candidate) => assetNameMatches(candidate, filename))) {
    if (!candidates.some((candidate) => candidate.id === asset.id)) candidates.push(asset);
  }
  for (const candidate of candidates) {
    try { return await verifyReusableAsset({ api, asset: candidate, plannedItem, local, fetchImpl }); }
    catch (error) {
      if (candidate.id === itemState.uploadedAsset?.id) {
        throw new RolloutError(`Journaled asset ${candidate.id} cannot be safely reused.`, { details: publicError(error) });
      }
    }
  }
  if (candidates.length) throw new RolloutError(`A deterministic-name asset exists for ${plannedItem.cmsItemId} but cannot be verified; duplicate upload refused.`);
  let metadata;
  try { metadata = await api.createAsset(filename, local.md5); }
  catch (error) {
    throw new RolloutError(`Asset-create outcome is unknown for ${plannedItem.cmsItemId}.`, {
      code: 'UNKNOWN_ASSET_CREATE_OUTCOME', details: publicError(error), writeOutcome: 'unknown',
    });
  }
  await uploadBinary(metadata, local, fetchImpl);
  return verifyReusableAsset({ api, asset: metadata, plannedItem, local, fetchImpl });
}

async function readCollectionStates(api, collectionId) {
  const [staged, live] = await Promise.all([
    api.listItems(collectionId, 'staged'),
    api.listItems(collectionId, 'live'),
  ]);
  return { staged, live };
}

function expectedCollectionId(plan, batch) {
  const ids = new Set(batch.itemIds.map((id) => requirePlanItem(plan, id).collectionId).filter(Boolean));
  if (ids.size === 1) return [...ids][0];
  const original = plan.items.filter((item) => batch.itemIds.includes(item.cmsItemId));
  const inferred = new Set(original.map((item) => item.collectionId).filter(Boolean));
  if (inferred.size !== 1) throw new RolloutError(`Batch ${batch.batchId} lacks one collection ID.`);
  return [...inferred][0];
}

function verifyBatchCollectionState({ plan, batch, baseline, current, imageChecks, requireLiveReplacement = false }) {
  const targetIds = batch.itemIds;
  const targetResults = [];
  for (const itemId of targetIds) {
    const plannedItem = requirePlanItem(plan, itemId);
    const beforeStaged = exactlyOneCmsItem(baseline.staged.items, plannedItem, 'Baseline staged');
    const beforeLive = exactlyOneCmsItem(baseline.live.items, plannedItem, 'Baseline live');
    const staged = exactlyOneCmsItem(current.staged.items, plannedItem, 'Current staged');
    const live = exactlyOneCmsItem(current.live.items, plannedItem, 'Current live');
    const stagedCheck = compareTarget(beforeStaged, staged, imageChecks[itemId]?.staged);
    const liveCheck = requireLiveReplacement ? compareTarget(beforeLive, live, imageChecks[itemId]?.live) : {
      ok: stable(stripSystemTimestamps(beforeLive)) === stable(stripSystemTimestamps(live)),
      differences: diffPaths(stripSystemTimestamps(beforeLive), stripSystemTimestamps(live)),
    };
    const publicationState = requireLiveReplacement ? verifyCleanPublishedState(staged, live) : null;
    targetResults.push({ itemId, staged: stagedCheck, live: liveCheck,
      stagedLiveNonImageMatch: stable(withoutImage(staged)) === stable(withoutImage(live)), publicationState });
  }
  const unrelatedStaged = compareUnrelatedItems(baseline.staged.items, current.staged.items, targetIds);
  const unrelatedLive = compareUnrelatedItems(baseline.live.items, current.live.items, targetIds);
  const ok = targetResults.every((result) => result.staged.ok && result.live.ok &&
    (!requireLiveReplacement || (result.stagedLiveNonImageMatch && result.publicationState.ok))) &&
    unrelatedStaged.ok && unrelatedLive.ok;
  return { ok, targetResults, unrelatedStaged, unrelatedLive };
}

async function localForPlanItem(paths, plannedItem) {
  return inspectLocalImage(paths.repoRoot, {
    collection: plannedItem.collection,
    cmsTokenId: plannedItem.tokenId,
    localApprovedJpegPath: plannedItem.localSourceImage,
    localFileBytes: plannedItem.localBytes,
    localDimensions: plannedItem.expectedDimensions,
  });
}

function baselineFile(paths, batchId) {
  return path.join(paths.runtime, batchId, 'baseline.json');
}

async function loadBaseline(paths, batchId) {
  const baseline = await loadBaselineIfPresent(paths, batchId);
  if (!baseline) throw new RolloutError(`Batch ${batchId} has no durable pre-stage baseline.`);
  return baseline;
}

async function loadBaselineIfPresent(paths, batchId) {
  try { return await readJson(baselineFile(paths, batchId)); }
  catch (error) { if (error?.code === 'ENOENT') return null; throw error; }
}

async function saveBaseline(paths, batchId, baseline) {
  if (await loadBaselineIfPresent(paths, batchId)) {
    throw new RolloutError(`Batch ${batchId} baseline already exists and is immutable.`, { code: 'BASELINE_IMMUTABLE' });
  }
  await writeJson(baselineFile(paths, batchId), baseline);
}

export async function loadCurrentDropParams(paths = DEFAULT_PATHS) {
  return (await import(`${pathToFileURL(paths.dropParams).href}?rollout=${Date.now()}-${crypto.randomUUID()}`)).default;
}

function collectionStateEqual(left, right) {
  return stable(sortCmsItems(left.items).map(stripSystemTimestamps)) ===
    stable(sortCmsItems(right.items).map(stripSystemTimestamps));
}

function baselineItemEqual(baselineItem, currentItem) {
  return stable(stripSystemTimestamps(baselineItem)) === stable(stripSystemTimestamps(currentItem));
}

async function readFreshBatchSafetyState({ plan, batchId, api, paths, dropParamsLoader }) {
  const batch = requireBatch(plan, batchId);
  if (batch.collection === 'HEN' || !ELIGIBLE_COLLECTIONS.includes(batch.collection)) throw new RolloutError(`${batch.collection} is not CMS-IMG-3 eligible.`);
  const plannedItems = batch.itemIds.map((id) => requirePlanItem(plan, id));
  const dropParams = await dropParamsLoader(paths);
  assertNoActiveRedeemTarget(plannedItems, dropParams);
  const collectionId = expectedCollectionId(plan, batch);
  const [collection, states] = await Promise.all([api.getCollection(collectionId), readCollectionStates(api, collectionId)]);
  if (collection?.id !== collectionId) throw new RolloutError(`Collection ID mismatch for ${batchId}.`, {
    code: 'COLLECTION_IDENTITY_MISMATCH', details: { itemId: batch.itemIds[0], expected: collectionId, actual: collection?.id },
  });
  const locals = {};
  for (const itemId of batch.itemIds) {
    const plannedItem = requirePlanItem(plan, itemId);
    exactlyOneCmsItem(states.staged.items, plannedItem, 'Staged preflight');
    exactlyOneCmsItem(states.live.items, plannedItem, 'Live preflight');
    locals[itemId] = await localForPlanItem(paths, plannedItem);
  }
  return { batch, plannedItems, dropParams, collectionId, collection, locals, ...states };
}

function assertPristinePreflight(fresh, batchId) {
  if (!collectionStateEqual(fresh.staged, fresh.live)) {
    throw new RolloutError(`Staged/live collection drift exists before ${batchId}.`);
  }
}

export async function preflightBatch({ plan, batchId, api, paths = DEFAULT_PATHS,
  dropParamsLoader = loadCurrentDropParams }) {
  const fresh = await readFreshBatchSafetyState({ plan, batchId, api, paths, dropParamsLoader });
  assertPristinePreflight(fresh, batchId);
  return fresh;
}

function assertJournalResumeShape(plan, batch, journal) {
  if (journal.batchId !== batch.batchId || stable(journal.plannedItemIds) !== stable(batch.itemIds)) {
    throw new RolloutError(`Journal identity does not match ${batch.batchId}.`, { code: 'INVALID_RESUME_JOURNAL' });
  }
  const phases = [];
  for (const itemId of batch.itemIds) {
    const plannedItem = requirePlanItem(plan, itemId);
    const state = journal.items?.[itemId];
    if (!state || !SUCCESS_PHASES.has(state.currentPhase) || state.lastSuccessfulPhase !== state.currentPhase) {
      throw new RolloutError(`Unknown or inconsistent journal state for ${itemId}.`, {
        code: 'INVALID_RESUME_JOURNAL', details: { itemId, currentPhase: state?.currentPhase,
          lastSuccessfulPhase: state?.lastSuccessfulPhase },
      });
    }
    if (state.cmsItemId !== itemId || state.collection !== plannedItem.collection || state.tokenId !== plannedItem.tokenId ||
        state.localSourceImage !== plannedItem.localSourceImage || state.localSha256 !== plannedItem.localSha256) {
      throw new RolloutError(`Journal item identity mismatch for ${itemId}.`, {
        code: 'INVALID_RESUME_JOURNAL', details: { itemId },
      });
    }
    if (state.currentPhase === 'uploaded' && !state.uploadedAsset?.id) {
      throw new RolloutError(`Uploaded journal state for ${itemId} lacks an asset ID.`, {
        code: 'INVALID_RESUME_JOURNAL', details: { itemId },
      });
    }
    if (['staged', 'staged-verified', 'publish-approved', 'published', 'published-verified'].includes(state.currentPhase) &&
        !state.submittedImage && !state.resultingStagedImage) {
      throw new RolloutError(`Journal state ${state.currentPhase} for ${itemId} lacks a known replacement Image.`, {
        code: 'INVALID_RESUME_JOURNAL', details: { itemId },
      });
    }
    if (state.currentPhase === 'published-verified' && !state.publishedImage) {
      throw new RolloutError(`Published-verified journal state for ${itemId} lacks a published Image.`, {
        code: 'INVALID_RESUME_JOURNAL', details: { itemId },
      });
    }
    phases.push(state.currentPhase);
  }
  const publicationProgress = phases.filter((phase) => ['publish-approved', 'published', 'published-verified'].includes(phase));
  if (publicationProgress.length > 0 && publicationProgress.length !== phases.length) {
    throw new RolloutError(`Partial publication journal state for ${batch.batchId} requires reconciliation.`, {
      code: 'INVALID_RESUME_JOURNAL', details: { itemId: batch.itemIds[0], phases },
    });
  }
}

function resumeDrift(message, itemId, phase, details) {
  return new RolloutError(message, {
    code: 'RESUME_STATE_DRIFT', details: { itemId, phase, ...details }, writeOutcome: 'not-attempted',
  });
}

export async function validateResumeState({ plan, batch, journal, baseline, current, locals, fetchImpl = fetch }) {
  assertJournalResumeShape(plan, batch, journal);
  if (baseline.collection?.id !== expectedCollectionId(plan, batch)) {
    throw resumeDrift(`Original baseline collection identity is invalid for ${batch.batchId}.`, batch.itemIds[0], null, {});
  }
  const unrelatedStaged = compareUnrelatedItems(baseline.staged.items, current.staged.items, batch.itemIds);
  const unrelatedLive = compareUnrelatedItems(baseline.live.items, current.live.items, batch.itemIds);
  if (!unrelatedStaged.ok || !unrelatedLive.ok) {
    throw resumeDrift(`Unrelated collection state drifted since the original ${batch.batchId} baseline.`, batch.itemIds[0], null,
      { unrelatedStaged, unrelatedLive });
  }
  const items = {};
  for (const itemId of batch.itemIds) {
    const plannedItem = requirePlanItem(plan, itemId);
    const state = journal.items[itemId];
    const baselineStaged = exactlyOneCmsItem(baseline.staged.items, plannedItem, 'Baseline staged');
    const baselineLive = exactlyOneCmsItem(baseline.live.items, plannedItem, 'Baseline live');
    const staged = exactlyOneCmsItem(current.staged.items, plannedItem, 'Current staged');
    const live = exactlyOneCmsItem(current.live.items, plannedItem, 'Current live');
    const phase = state.currentPhase;
    if (state.reconciliationRequired) {
      throw resumeDrift(`${itemId} already requires reconciliation.`, itemId, phase, { reconciliationRequired: true });
    }
    if (['pending', 'upload-ready', 'uploaded'].includes(phase)) {
      const stagedAtBaseline = baselineItemEqual(baselineStaged, staged);
      const liveAtBaseline = baselineItemEqual(baselineLive, live);
      if (!stagedAtBaseline || !liveAtBaseline) {
        throw resumeDrift(`${phase} item ${itemId} no longer matches its original CMS baseline.`, itemId, phase,
          { stagedAtBaseline, liveAtBaseline,
            stagedDifferences: diffPaths(stripSystemTimestamps(baselineStaged), stripSystemTimestamps(staged)),
            liveDifferences: diffPaths(stripSystemTimestamps(baselineLive), stripSystemTimestamps(live)) });
      }
      items[itemId] = { phase, stagedAtBaseline, liveAtBaseline };
      continue;
    }
    const submitted = state.resultingStagedImage ?? state.submittedImage;
    const stagedImage = await verifyPlannedCmsImage(staged.fieldData?.image, locals[itemId], fetchImpl, submitted);
    const stagedCheck = compareTarget(baselineStaged, staged, stagedImage);
    if (!stagedCheck.ok) {
      throw resumeDrift(`Known staged replacement for ${itemId} cannot be verified.`, itemId, phase, { stagedCheck });
    }
    if (['staged', 'staged-verified', 'publish-approved'].includes(phase)) {
      const liveAtBaseline = baselineItemEqual(baselineLive, live);
      if (!liveAtBaseline) {
        throw resumeDrift(`Live state changed before journaled publication for ${itemId}.`, itemId, phase,
          { liveAtBaseline, liveDifferences: diffPaths(stripSystemTimestamps(baselineLive), stripSystemTimestamps(live)) });
      }
      items[itemId] = { phase, stagedCheck, liveAtBaseline };
      continue;
    }
    if (!['published', 'published-verified'].includes(phase)) {
      throw new RolloutError(`Unsupported resume phase ${phase} for ${itemId}.`, {
        code: 'INVALID_RESUME_JOURNAL', details: { itemId, phase },
      });
    }
    const liveImage = await verifyPlannedCmsImage(live.fieldData?.image, locals[itemId], fetchImpl,
      state.publishedImage ?? submitted);
    const liveCheck = compareTarget(baselineLive, live, liveImage);
    const stagedLiveNonImageMatch = stable(withoutImage(staged)) === stable(withoutImage(live));
    const publicationState = verifyCleanPublishedState(staged, live);
    if (!liveCheck.ok || !stagedLiveNonImageMatch || !publicationState.ok) {
      throw resumeDrift(`Published replacement for ${itemId} cannot be reconciled.`, itemId, phase,
        { liveCheck, stagedLiveNonImageMatch, publicationState });
    }
    items[itemId] = { phase, stagedCheck, liveCheck, stagedLiveNonImageMatch, publicationState };
  }
  return { ok: true, items, unrelatedStaged, unrelatedLive };
}

export async function preflightStageInvocation({ plan, batchId, journal, baseline, api, paths = DEFAULT_PATHS,
  fetchImpl = fetch, dropParamsLoader = loadCurrentDropParams }) {
  let fresh;
  try {
    fresh = await readFreshBatchSafetyState({ plan, batchId, api, paths, dropParamsLoader });
  } catch (error) {
    if (!baseline || error?.code === 'ACTIVE_REDEEM_TOKEN_CONFLICT') throw error;
    throw resumeDrift(`Fresh resume safety read failed for ${batchId}: ${error.message}`,
      error?.details?.itemId ?? requireBatch(plan, batchId).itemIds[0], null, { cause: publicError(error) });
  }
  if (!baseline) {
    assertJournalResumeShape(plan, fresh.batch, journal);
    if (Object.values(journal.items).some((item) => item.currentPhase !== 'pending' || item.reconciliationRequired)) {
      throw new RolloutError(`${batchId} has journaled progress but no original baseline.`, {
        code: 'INVALID_RESUME_JOURNAL', details: { itemId: fresh.batch.itemIds[0] },
      });
    }
    assertPristinePreflight(fresh, batchId);
    return { kind: 'first-run', fresh, baseline: { collection: fresh.collection, staged: fresh.staged, live: fresh.live },
      validation: { ok: true, pristine: true } };
  }
  const validation = await validateResumeState({ plan, batch: fresh.batch, journal, baseline,
    current: { staged: fresh.staged, live: fresh.live }, locals: fresh.locals, fetchImpl });
  return { kind: 'resume', fresh, baseline, validation };
}

async function itemImageChecks({ plan, batch, current, paths, journal, fetchImpl, includeLive }) {
  const checks = {};
  for (const itemId of batch.itemIds) {
    const plannedItem = requirePlanItem(plan, itemId);
    const local = await localForPlanItem(paths, plannedItem);
    const staged = exactlyOneCmsItem(current.staged.items, plannedItem, 'Current staged');
    const live = exactlyOneCmsItem(current.live.items, plannedItem, 'Current live');
    const submitted = journal.items[itemId]?.submittedImage ?? journal.items[itemId]?.resultingStagedImage;
    checks[itemId] = {
      staged: await verifyPlannedCmsImage(staged.fieldData?.image, local, fetchImpl, submitted),
      live: includeLive ? await verifyPlannedCmsImage(live.fieldData?.image, local, fetchImpl, submitted) : null,
    };
  }
  return checks;
}

function errorAttempt(phase, error, writeAttempted) {
  const writeOutcome = error?.writeOutcome && error.writeOutcome !== 'not-attempted' ? error.writeOutcome :
    (writeAttempted ? 'unknown' : 'not-attempted');
  return {
    phase,
    status: ['unknown', 'applied-unverified'].includes(writeOutcome) ? 'reconciliation-required' : 'blocked',
    writeOutcome,
    error: publicError(error),
  };
}

function preflightErrorAttempt(error, hadBaseline) {
  const reconciliationRequired = hadBaseline && error?.code !== 'ACTIVE_REDEEM_TOKEN_CONFLICT';
  return {
    phase: 'stage-batch-preflight',
    status: reconciliationRequired ? 'reconciliation-required' : 'blocked',
    writeOutcome: 'not-attempted',
    error: publicError(error),
    details: { freshSafetyGate: true, baselineExisted: hadBaseline },
  };
}

function preflightFailureItemId(batch, journal, error) {
  const reported = error?.details?.itemId;
  if (reported && journal.items?.[reported]) return reported;
  return batch.itemIds.find((itemId) => journal.items?.[itemId]?.reconciliationRequired) ?? batch.itemIds[0];
}

export async function stageBatch({ plan, batchId, api, paths = DEFAULT_PATHS, fetchImpl = fetch,
  dropParamsLoader = loadCurrentDropParams }) {
  const batch = requireBatch(plan, batchId);
  let journal = await loadBatchJournal(plan, batchId, paths.runtime);
  const existingBaseline = await loadBaselineIfPresent(paths, batchId);
  let invocationGate;
  try {
    invocationGate = await preflightStageInvocation({ plan, batchId, journal, baseline: existingBaseline,
      api, paths, fetchImpl, dropParamsLoader });
  } catch (error) {
    if (error?.code !== 'INVALID_RESUME_JOURNAL') {
      const itemId = preflightFailureItemId(batch, journal, error);
      journal = recordItemAttempt(journal, itemId, preflightErrorAttempt(error, existingBaseline !== null));
      await saveBatchJournal(journal, paths.runtime);
    }
    throw error;
  }
  const baseline = invocationGate.baseline;
  if (!existingBaseline) await saveBaseline(paths, batchId, baseline);
  const noStagePhases = new Set(['staged-verified', 'publish-approved', 'published', 'published-verified']);
  const mutableItemIds = batch.itemIds.filter((itemId) => !noStagePhases.has(journal.items[itemId].currentPhase));
  if (mutableItemIds.length === 0) {
    return { result: { ok: true, idempotentNoop: true, freshSafetyGate: invocationGate.validation }, journal,
      preflight: { kind: invocationGate.kind, cmsWritesPerformed: 0, baselineCreated: !existingBaseline } };
  }
  const collectionId = expectedCollectionId(plan, batch);
  const assets = await api.listAssets();
  for (const itemId of batch.itemIds) {
    const plannedItem = requirePlanItem(plan, itemId);
    if (noStagePhases.has(journal.items[itemId].currentPhase)) continue;
    const local = await localForPlanItem(paths, plannedItem);
    let writeAttempted = false;
    try {
      const before = await readCollectionStates(api, collectionId);
      const stagedItem = exactlyOneCmsItem(before.staged.items, plannedItem, 'Current staged');
      const liveItem = exactlyOneCmsItem(before.live.items, plannedItem, 'Current live');
      const [stagedImage, liveImage] = await Promise.all([
        verifyPlannedCmsImage(stagedItem.fieldData?.image, local, fetchImpl, journal.items[itemId].submittedImage),
        verifyPlannedCmsImage(liveItem.fieldData?.image, local, fetchImpl, journal.items[itemId].submittedImage),
      ]);
      const action = determineIdempotentAction({ itemState: journal.items[itemId], localMatchesStaged: stagedImage.ok,
        localMatchesLive: liveImage.ok, reusableUploadedAsset: journal.items[itemId].uploadedAsset });
      if (action === 'reconcile-published') {
        journal = recordItemAttempt(journal, itemId, { phase: 'published-verified', status: 'succeeded',
          details: { idempotentAction: action }, patch: { publishedImage: liveItem.fieldData.image } });
        await saveBatchJournal(journal, paths.runtime);
        continue;
      }
      if (action !== 'verify-staged-noop') {
        writeAttempted = true;
        const asset = await ensureAsset({ api, plannedItem, local, itemState: journal.items[itemId], assets, fetchImpl });
        journal = recordItemAttempt(journal, itemId, { phase: 'uploaded', status: 'succeeded', writeOutcome: 'applied-verified', patch: { uploadedAsset: asset } });
        await saveBatchJournal(journal, paths.runtime);
        const submittedImage = { fileId: asset.id, url: asset.hostedUrl, alt: null };
        try { await api.patchImage(collectionId, itemId, plannedItem.localeId, submittedImage); }
        catch (error) {
          error.writeOutcome = 'unknown';
          throw error;
        }
        journal = recordItemAttempt(journal, itemId, { phase: 'staged', status: 'succeeded', writeOutcome: 'applied-verified', patch: { submittedImage } });
        await saveBatchJournal(journal, paths.runtime);
      }
      const current = await readCollectionStates(api, collectionId);
      const resulting = exactlyOneCmsItem(current.staged.items, plannedItem, 'Resulting staged');
      const verification = await verifyPlannedCmsImage(resulting.fieldData?.image, local, fetchImpl, journal.items[itemId].submittedImage);
      const target = compareTarget(exactlyOneCmsItem(baseline.staged.items, plannedItem, 'Baseline staged'), resulting, verification);
      const liveUnchanged = stable(stripSystemTimestamps(exactlyOneCmsItem(baseline.live.items, plannedItem, 'Baseline live'))) ===
        stable(stripSystemTimestamps(exactlyOneCmsItem(current.live.items, plannedItem, 'Current live')));
      const unrelatedLive = compareUnrelatedItems(baseline.live.items, current.live.items, batch.itemIds);
      if (!target.ok || !liveUnchanged || !unrelatedLive.ok) {
        throw new RolloutError(`Staged verification failed for ${itemId}.`, {
          code: 'STAGED_VERIFICATION_FAILED', details: { target, liveUnchanged, unrelatedLive }, writeOutcome: 'applied-unverified',
        });
      }
      journal = recordItemAttempt(journal, itemId, { phase: 'staged-verified', status: 'succeeded',
        writeOutcome: writeAttempted ? 'applied-verified' : 'not-attempted',
        details: { idempotentAction: action, normalization: verification.normalization },
        patch: { resultingStagedImage: resulting.fieldData.image } });
      await saveBatchJournal(journal, paths.runtime);
    } catch (error) {
      journal = recordItemAttempt(journal, itemId, errorAttempt('stage-batch', error, writeAttempted));
      await saveBatchJournal(journal, paths.runtime);
      throw error;
    }
  }
  return verifyStagedBatch({ plan, batchId, api, paths, fetchImpl, journal });
}

export async function verifyStagedBatch({ plan, batchId, api, paths = DEFAULT_PATHS, fetchImpl = fetch, journal: suppliedJournal }) {
  const batch = requireBatch(plan, batchId);
  let journal = suppliedJournal ?? await loadBatchJournal(plan, batchId, paths.runtime);
  const baseline = await loadBaseline(paths, batchId);
  const current = await readCollectionStates(api, expectedCollectionId(plan, batch));
  const checks = await itemImageChecks({ plan, batch, current, paths, journal, fetchImpl, includeLive: false });
  const result = verifyBatchCollectionState({ plan, batch, baseline, current, imageChecks: checks });
  if (!result.ok) throw new RolloutError(`Full staged batch verification failed for ${batchId}.`, { details: result });
  for (const itemId of batch.itemIds) {
    if (journal.items[itemId].currentPhase === 'published-verified') continue;
    const currentItem = exactlyOneCmsItem(current.staged.items, requirePlanItem(plan, itemId), 'Verified staged');
    journal = recordItemAttempt(journal, itemId, { phase: 'staged-verified', status: 'succeeded',
      patch: { resultingStagedImage: currentItem.fieldData.image }, details: { batchReconciled: true } });
  }
  await saveBatchJournal(journal, paths.runtime);
  await writeJson(path.join(paths.runtime, batchId, 'comparison.staged.json'), result);
  return { result, journal };
}

export async function publishBatch({ plan, batchId, api, confirmation, paths = DEFAULT_PATHS, fetchImpl = fetch }) {
  let journal = await loadBatchJournal(plan, batchId, paths.runtime);
  const gate = await verifyStagedBatch({ plan, batchId, api, paths, fetchImpl, journal });
  journal = approvePublish(plan, batchId, gate.journal, confirmation);
  await saveBatchJournal(journal, paths.runtime);
  const itemIds = journal.publishApproval.itemIds;
  const batch = requireBatch(plan, batchId);
  const collectionId = expectedCollectionId(plan, batch);
  try { await api.publishItems(collectionId, itemIds); }
  catch (error) {
    for (const itemId of itemIds) journal = recordItemAttempt(journal, itemId, errorAttempt('publish-batch',
      new RolloutError(`Publish outcome is unknown for ${batchId}.`, { details: publicError(error), writeOutcome: 'unknown' }), true));
    await saveBatchJournal(journal, paths.runtime);
    throw error;
  }
  for (const itemId of itemIds) journal = recordItemAttempt(journal, itemId, { phase: 'published', status: 'succeeded', writeOutcome: 'applied-verified' });
  await saveBatchJournal(journal, paths.runtime);
  return reconcilePublishedBatch({ plan, batchId, api, paths, fetchImpl, journal });
}

export async function reconcilePublishedBatch({ plan, batchId, api, paths = DEFAULT_PATHS, fetchImpl = fetch, journal: suppliedJournal }) {
  const batch = requireBatch(plan, batchId);
  let journal = suppliedJournal ?? await loadBatchJournal(plan, batchId, paths.runtime);
  const baseline = await loadBaseline(paths, batchId);
  const current = await readCollectionStates(api, expectedCollectionId(plan, batch));
  const checks = await itemImageChecks({ plan, batch, current, paths, journal, fetchImpl, includeLive: true });
  const result = verifyBatchCollectionState({ plan, batch, baseline, current, imageChecks: checks, requireLiveReplacement: true });
  if (!result.ok) {
    const error = new RolloutError(`Published reconciliation failed for ${batchId}.`, {
      code: 'PUBLISHED_RECONCILIATION_FAILED', details: result,
    });
    const publicationFailures = result.targetResults.filter((target) => target.publicationState?.ok === false);
    for (const target of publicationFailures) {
      journal = recordItemAttempt(journal, target.itemId, {
        phase: 'reconcile-published', status: 'reconciliation-required', writeOutcome: 'not-attempted',
        error: publicError(error), details: { publicationState: target.publicationState },
      });
    }
    if (publicationFailures.length > 0) {
      await saveBatchJournal(journal, paths.runtime);
      await writeJson(path.join(paths.runtime, batchId, 'comparison.published.json'), result);
    }
    throw error;
  }
  for (const itemId of batch.itemIds) {
    const live = exactlyOneCmsItem(current.live.items, requirePlanItem(plan, itemId), 'Verified live');
    journal = recordItemAttempt(journal, itemId, { phase: 'published-verified', status: 'succeeded',
      details: { proof: 'fresh-authenticated-staged-and-live-cms-state', publishRequestPerformedByThisMode: false },
      patch: { publishedImage: live.fieldData.image } });
  }
  await saveBatchJournal(journal, paths.runtime);
  await writeJson(path.join(paths.runtime, batchId, 'comparison.published.json'), result);
  return { result, journal, cmsWritesPerformed: 0, publishRequestsPerformed: 0 };
}

function markdownTable(items) {
  const lines = [
    '| Batch | Collection | Token | Title | CMS item ID | Slug | Local source | SHA-256 | Dimensions | Status / skip reason |',
    '|---:|---|---:|---|---|---|---|---|---|---|',
  ];
  for (const item of items) {
    lines.push(`| ${item.batchNumber ?? '—'} | ${item.collection} | ${item.tokenId} | ${item.title.replaceAll('|', '\\|')} | \`${item.cmsItemId}\` | \`${item.slug}\` | \`${item.localSourceImage}\` | \`${item.localSha256}\` | ${item.expectedDimensions.width}×${item.expectedDimensions.height} | ${item.migrationStatus}${item.skipReason ? ` — ${item.skipReason}` : ''} |`);
  }
  return lines.join('\n');
}

export function renderPlanMarkdown(plan) {
  const batchSections = plan.batches.map((batch) => {
    const members = batch.itemIds.map((id) => plan.items.find((item) => item.cmsItemId === id));
    return `### ${batch.batchId} — ${batch.collection} (${batch.count})\n\n${markdownTable(members)}`;
  }).join('\n\n');
  const skipped = plan.items.filter((item) => item.migrationStatus === 'already-migrated');
  return `# CMS-IMG-3 direct-map thumbnail rollout plan

This deterministic plan was generated from \`${plan.sources.mapping}\`, current local image bytes, and \`${plan.sources.completion}\`. Content verification reuses \`${plan.sources.pilotImplementation}\`; pilot completion evidence is retained at \`${plan.sources.pilotEvidence}\`. The ordering rule is: ${plan.orderingRule}. The batching rule is: ${plan.batchingRule}.

## Population

- Total audited mappings: ${plan.counts.totalAuditedMappings}
- Eligible direct-map mappings (including the completed pilot): ${plan.counts.eligibleDirectMapMappings}
- Excluded HEN mappings: ${plan.counts.excludedHenMappings}
- Already migrated: ${plan.counts.alreadyMigratedMappings}
- Remaining CMS-IMG-3 rollout population: ${plan.counts.remainingRolloutMappings}
- Remaining by collection: CANAAN ${plan.counts.rolloutByCollection.CANAAN}; THE 419 SCRIPT ${plan.counts.rolloutByCollection['THE 419 SCRIPT']}; INTRODUCTIONS ${plan.counts.rolloutByCollection.INTRODUCTIONS}

HEN is explicitly ineligible for this rollout because its sparse mirror mapping belongs to CMS-IMG-4.

## Already complete / skipped

${markdownTable(skipped)}

## Exact batches

${batchSections}

## Safety and publication boundary

Every \`stage-batch\` invocation rereads current drop parameters and staged/live CMS state before another write is possible. The first invocation saves an immutable pre-write baseline; a resumed invocation must reconcile current state to that original baseline plus known journaled progress. Unexplained drift blocks execution and is never absorbed by refreshing the baseline.

The lifecycle is fresh invocation safety gate → sequential stage and per-item verification → full staged-batch reconciliation → explicit human publish approval → exact-ID batch publish → fresh live CMS reconciliation. Staging never cascades into publication. The future \`publish-batch\` command requires the named batch, the exact staged-verified item IDs, an exact confirmation string, and no blocked or reconciliation-required item.

Hard stops:

${plan.hardStops.map((condition) => `- ${condition}`).join('\n')}

## Execution boundary

${plan.statement}
`;
}

export async function generatePlan(paths = DEFAULT_PATHS) {
  const [mapping, completions] = await Promise.all([readJson(paths.mapping), readJson(paths.completions)]);
  const plan = await buildRolloutPlan({ mapping, completions, repoRoot: paths.repoRoot });
  await Promise.all([
    writeJson(paths.planJson, plan),
    atomicWrite(paths.planMarkdown, `${renderPlanMarkdown(plan).trimEnd()}\n`),
  ]);
  return plan;
}

export async function rolloutStatus(plan, paths = DEFAULT_PATHS) {
  const batches = [];
  for (const batch of plan.batches) {
    let journal = null;
    try { journal = await loadBatchJournal(plan, batch.batchId, paths.runtime); }
    catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
    const phases = journal ? Object.fromEntries(Object.entries(journal.items).map(([id, item]) => [id, {
      phase: item.currentPhase,
      lastSuccessfulPhase: item.lastSuccessfulPhase,
      lastAttemptStatus: item.lastAttemptStatus,
      reconciliationRequired: item.reconciliationRequired,
    }])) : Object.fromEntries(batch.itemIds.map((id) => [id, { phase: 'pending', lastSuccessfulPhase: 'pending',
      lastAttemptStatus: null, reconciliationRequired: false }]));
    batches.push({ batchId: batch.batchId, collection: batch.collection, phases });
  }
  return { ticket: TICKET, batches };
}

function parseArguments(argv) {
  const [mode, ...rest] = argv;
  if (!MODES.includes(mode)) throw new RolloutError(`Usage: npm run cms:image-rollout -- <${MODES.join('|')}> [--batch B1]`);
  let batchId = null;
  for (let index = 0; index < rest.length; index += 1) {
    if (rest[index] !== '--batch' || !rest[index + 1] || batchId !== null) throw new RolloutError('Only one --batch <batch-id> argument is supported.');
    batchId = rest[index + 1];
    index += 1;
  }
  if (mode !== 'plan' && mode !== 'status' && !batchId) throw new RolloutError(`${mode} requires --batch <batch-id>.`);
  if ((mode === 'plan' || mode === 'status') && batchId) throw new RolloutError(`${mode} does not accept --batch.`);
  return { mode, batchId };
}

export async function main({ argv = process.argv.slice(2), env = process.env, paths = DEFAULT_PATHS, fetchImpl = fetch } = {}) {
  const { mode, batchId } = parseArguments(argv);
  if (mode === 'plan') {
    const plan = await generatePlan(paths);
    console.log(JSON.stringify({ mode, counts: plan.counts, batches: plan.batches, externalWritesPerformed: 0 }, null, 2));
    return { mode, plan, externalWritesPerformed: 0 };
  }
  const plan = await readJson(paths.planJson);
  if (mode === 'status') {
    const status = await rolloutStatus(plan, paths);
    console.log(JSON.stringify(status, null, 2));
    return { mode, status, externalWritesPerformed: 0 };
  }
  const api = new WebflowRolloutClient({ token: env.WEBFLOW_API_TOKEN, siteId: plan.site.siteId, fetchImpl });
  let result;
  if (mode === 'stage-batch') result = await stageBatch({ plan, batchId, api, paths, fetchImpl });
  else if (mode === 'verify-staged') result = await verifyStagedBatch({ plan, batchId, api, paths, fetchImpl });
  else if (mode === 'publish-batch') result = await publishBatch({ plan, batchId, api,
    confirmation: env.CMS_IMG_3_PUBLISH_CONFIRM, paths, fetchImpl });
  else result = await reconcilePublishedBatch({ plan, batchId, api, paths, fetchImpl });
  console.log(JSON.stringify(redactRollout({ mode, batchId, result }), null, 2));
  return { mode, batchId, result };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(redactRollout(error.message));
    process.exitCode = 1;
  });
}
