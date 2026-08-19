import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

import { chainRegistry } from '../../shared/chain-registry.js';
import { compareTarget, redact } from '../webflow-cms-image-pilot/cms-image-pilot.mjs';
import {
  COLLECTION_POLICY,
  DEFAULT_PATHS,
  ELIGIBLE_COLLECTIONS,
  EXPECTED_COUNTS,
  HEN_EXPECTED_COUNT,
  HEN_WRITE_CAPABLE_MODES,
  WRITE_CAPABLE_MODES,
  WebflowRolloutClient,
  approvePublish,
  assertNoActiveRedeemTarget,
  assertHenActiveRedeemModel,
  buildRolloutPlan,
  buildHenRolloutPlan,
  compareUnrelatedItems,
  determineIdempotentAction,
  exactPublishItemIds,
  generatePlan,
  generateHenPlan,
  henRolloutStatus,
  initialBatchJournal,
  inspectLocalImage,
  main,
  publishConfirmation,
  publishBatch,
  publishHenBatch,
  reconcilePublishedBatch,
  reconcileHenPublishedBatch,
  redactRollout,
  recordItemAttempt,
  renderPlanMarkdown,
  renderHenPlanMarkdown,
  resolveHenThumbnailLookupId,
  stageBatch,
  stageHenBatch,
  validateCompletions,
  validateHenAudit,
  validateHenMirror,
  validateHenExecutionPlan,
  validateMapping,
  verifyPlannedCmsImage,
  verifyHenStagedBatch,
  verifyCleanPublishedState,
  writeJson,
} from './cms-image-rollout.mjs';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(moduleDir, '..', '..');
const mappingPath = path.join(repoRoot, 'docs', 'webflow-cms-image-audit', 'CMS-IMG-1.mapping.json');
const completionsPath = path.join(repoRoot, 'docs', 'webflow-cms-image-audit', 'CMS-IMG-2.completion.json');
const mapping = JSON.parse(await fs.readFile(mappingPath, 'utf8'));
const completions = JSON.parse(await fs.readFile(completionsPath, 'utf8'));
const henMappingPath = path.join(repoRoot, 'docs', 'webflow-cms-image-audit', 'CMS-IMG-4.mapping.json');
const henTitlesPath = path.join(repoRoot, 'admin-ui', 'src', 'titles', 'hen.json');
const henMapping = JSON.parse(await fs.readFile(henMappingPath, 'utf8'));
const henTitles = JSON.parse(await fs.readFile(henTitlesPath, 'utf8'));
const plan = await buildRolloutPlan({ mapping, completions, repoRoot });
const henPlan = await buildHenRolloutPlan({ audit: henMapping, titles: henTitles, network: 'testnet', repoRoot });

function clone(value) {
  return structuredClone(value);
}

function fakeCmsItem(plannedItem, image = { fileId: 'old-id', url: 'https://example.test/old.jpg', alt: null }) {
  return {
    id: plannedItem.cmsItemId,
    cmsLocaleId: plannedItem.localeId,
    isDraft: false,
    isArchived: false,
    lastUpdated: '2026-08-17T00:00:00.000Z',
    lastPublished: '2026-08-17T00:00:00.000Z',
    fieldData: {
      name: plannedItem.title,
      slug: plannedItem.slug,
      'token-id': plannedItem.tokenId,
      image,
      reference: 'preserve-me',
    },
  };
}

test('collection policy explicitly includes only direct-map collections and excludes HEN', () => {
  assert.deepEqual(ELIGIBLE_COLLECTIONS, ['CANAAN', 'THE 419 SCRIPT', 'INTRODUCTIONS']);
  assert.equal(COLLECTION_POLICY.HEN.eligible, false);
  assert.match(COLLECTION_POLICY.HEN.reason, /CMS-IMG-4/);
  assert.deepEqual(WRITE_CAPABLE_MODES, ['stage-batch', 'publish-batch']);
});

test('CMS-IMG-4 audit and authoritative registry prove all 17 HEN mappings', () => {
  const validation = validateHenAudit({ audit: henMapping, titles: henTitles });
  assert.equal(validation.canonicalIds.size, HEN_EXPECTED_COUNT);
  assert.equal(validation.lookupIds.size, HEN_EXPECTED_COUNT);
  assert.equal(validation.cmsItemIds.size, HEN_EXPECTED_COUNT);
  assert.equal(validation.localPaths.size, HEN_EXPECTED_COUNT);
  const expected = [
    [94684, 0], [103062, 1], [104492, 2], [114368, 3], [125115, 4], [135460, 5],
    [141634, 6], [147893, 7], [175592, 8], [200717, 9], [209650, 10], [279300, 11],
    [369693, 12], [397098, 13], [422822, 14], [455835, 15], [526531, 16],
  ];
  assert.deepEqual(henMapping.mappings.map((item) => [item.canonicalHenTokenId,
    resolveHenThumbnailLookupId({ canonicalTokenId: item.canonicalHenTokenId, network: 'testnet' })]), expected);
});

test('HEN resolution is network-explicit: Shadownet mirrors and mainnet is identity', () => {
  assert.equal(resolveHenThumbnailLookupId({ canonicalTokenId: 94684, network: 'testnet' }), 0);
  assert.equal(resolveHenThumbnailLookupId({ canonicalTokenId: 526531, network: 'testnet' }), 16);
  assert.equal(resolveHenThumbnailLookupId({ canonicalTokenId: 94684, network: 'mainnet' }), 94684);
  assert.notEqual(resolveHenThumbnailLookupId({ canonicalTokenId: 94684, network: 'mainnet' }), 0);
});

test('HEN resolution fails closed for unknown token, missing mirror, duplicate target, gap, and unknown network', () => {
  assert.throws(() => resolveHenThumbnailLookupId({ canonicalTokenId: 999999, network: 'testnet' }), /absent from the authoritative testnet mirror/);
  const missing = clone(chainRegistry.testnet.mirrors.HEN);
  delete missing['94684'];
  assert.throws(() => resolveHenThumbnailLookupId({ canonicalTokenId: 94684, network: 'testnet', mirror: missing }), /has 16 entries/);
  const duplicate = clone(chainRegistry.testnet.mirrors.HEN);
  duplicate['103062'] = duplicate['94684'];
  assert.throws(() => validateHenMirror(duplicate), /Duplicate HEN mirror target 0/);
  const gap = clone(chainRegistry.testnet.mirrors.HEN);
  gap['526531'] = '17';
  assert.throws(() => validateHenMirror(gap), /has a gap/);
  assert.throws(() => resolveHenThumbnailLookupId({ canonicalTokenId: 94684, network: 'ghostnet' }), /Unsupported HEN thumbnail network/);
});

test('HEN audit validation rejects audit/registry mismatch, duplicate identities, and missing audited canonical IDs', () => {
  const mismatch = clone(henMapping);
  mismatch.mappings[0].testnetHenTokenId = 99;
  assert.throws(() => validateHenAudit({ audit: mismatch, titles: henTitles }), /Audit\/registry mismatch/);

  const duplicateCanonical = clone(henMapping);
  duplicateCanonical.mappings[1].canonicalHenTokenId = duplicateCanonical.mappings[0].canonicalHenTokenId;
  assert.throws(() => validateHenAudit({ audit: duplicateCanonical, titles: henTitles }), /Duplicate audited canonical HEN ID/);

  const missingAudit = clone(henMapping);
  missingAudit.mappings.pop();
  assert.throws(() => validateHenAudit({ audit: missingAudit, titles: henTitles }), /contains 16 mappings/);
});

test('CMS-IMG-4 testnet plan contains 17 verified local JPEG mappings and separate pending state', () => {
  assert.equal(henPlan.ticket, 'CMS-IMG-4');
  assert.deepEqual(henPlan.network, { slot: 'testnet', label: 'Shadownet' });
  assert.equal(henPlan.items.length, HEN_EXPECTED_COUNT);
  assert.equal(henPlan.cmsImg3RuntimeStateConsumed, false);
  assert.equal(henPlan.stateNamespace, 'CMS-IMG-4/HEN/testnet');
  assert.deepEqual(HEN_WRITE_CAPABLE_MODES, ['hen-stage-batch', 'hen-publish-batch']);
  assert.deepEqual(henPlan.batches.map((batch) => [batch.batchId, batch.count]), [['H1', 5], ['H2', 12]]);
  assert.equal(new Set(henPlan.items.map((item) => item.webflowCmsItemId)).size, HEN_EXPECTED_COUNT);
  assert.equal(new Set(henPlan.items.map((item) => item.localThumbnailPath)).size, HEN_EXPECTED_COUNT);
  for (const item of henPlan.items) {
    assert.match(item.sha256, /^[a-f0-9]{64}$/);
    assert.ok(item.byteCount > 0);
    assert.deepEqual(item.dimensions, { width: 300, height: 375 });
    assert.equal(item.imageFormat, 'jpeg');
    assert.equal(item.progressive, true);
    assert.equal(item.confidence, 'HIGH');
    assert.equal(item.expectedPhase, 'pending');
  }
});

test('H1 and H2 have exact deterministic canonical membership', () => {
  validateHenExecutionPlan(henPlan);
  const canonicalFor = (batch) => batch.itemIds.map((itemId) => henPlan.items.find((item) => item.cmsItemId === itemId).tokenId);
  assert.deepEqual(canonicalFor(henPlan.batches[0]), [94684, 103062, 104492, 114368, 125115]);
  assert.deepEqual(canonicalFor(henPlan.batches[1]), [135460, 141634, 147893, 175592, 200717, 209650,
    279300, 369693, 397098, 422822, 455835, 526531]);
});

test('HEN execution plan fails closed on batch, plan-entry, mirror-resolution, and network tampering', async () => {
  const duplicate = clone(henPlan);
  duplicate.batches[0].itemIds[1] = duplicate.batches[0].itemIds[0];
  assert.throws(() => validateHenExecutionPlan(duplicate), /batch membership/);

  const mismatched = clone(henPlan);
  mismatched.batches[0].itemIds[0] = mismatched.batches[1].itemIds[0];
  assert.throws(() => validateHenExecutionPlan(mismatched), /batch membership/);

  const missing = clone(henPlan);
  missing.items.pop();
  assert.throws(() => validateHenExecutionPlan(missing), /exactly 17 plan items/);

  const mirrorMismatch = clone(henPlan);
  mirrorMismatch.items[0].thumbnailLookupId = 16;
  assert.throws(() => validateHenExecutionPlan(mirrorMismatch), /resolution mismatch/);

  const wrongNetwork = clone(henPlan);
  wrongNetwork.network.slot = 'mainnet';
  assert.throws(() => validateHenExecutionPlan(wrongNetwork), /CMS-IMG-4\/HEN\/testnet/);

  await assert.rejects(stageHenBatch({ plan: henPlan, batchId: 'UNKNOWN', api: null,
    paths: { ...DEFAULT_PATHS, runtime: os.tmpdir() } }), /Unknown batch UNKNOWN/);
});

test('HEN active-token safety uses canonical IDs and rejects mirror-shaped active identity', () => {
  const h1 = henPlan.batches[0].itemIds.map((itemId) => henPlan.items.find((item) => item.cmsItemId === itemId));
  assert.doesNotThrow(() => assertHenActiveRedeemModel(henPlan, { redeemToken: { collection: '', tokenId: '' } }));
  assert.doesNotThrow(() => assertHenActiveRedeemModel(henPlan,
    { redeemToken: { collection: 'HEN', tokenId: '94684' } }));
  assert.throws(() => assertNoActiveRedeemTarget(h1,
    { redeemToken: { collection: 'HEN', tokenId: '94684' } }), /configured active redeem token/);
  assert.throws(() => assertHenActiveRedeemModel(henPlan,
    { redeemToken: { collection: 'HEN', tokenId: '0' } }), /not a canonical audited HEN ID/);
});

test('CMS-IMG-4 mainnet planning preserves identity and fails on the documented sparse-file seam', async () => {
  await assert.rejects(buildHenRolloutPlan({ audit: henMapping, titles: henTitles, network: 'mainnet', repoRoot }),
    /Missing local HEN thumbnail admin-ui\/src\/thumbs\/hen\/94684\.jpg/);
});

test('CMS-IMG-4 plan Markdown and status expose mappings without CMS-IMG-3 state', async () => {
  const markdown = renderHenPlanMarkdown(henPlan);
  assert.match(markdown, /CMS-IMG-4 HEN thumbnail rollout plan/);
  assert.match(markdown, /94684.*\| 0 .*67be1933648307936604171f/);
  assert.match(markdown, /526531.*\| 16 .*67be2f200e39e3baf53bcc67/);
  assert.match(markdown, /CMS-IMG-3 runtime\/journal state is not consumed/);
  assert.match(markdown, /No Webflow request or write was performed/);
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'cms-img-4-status-'));
  const status = await henRolloutStatus(henPlan, { ...DEFAULT_PATHS, runtime: temp });
  await fs.rm(temp, { recursive: true, force: true });
  assert.equal(status.cmsImg3RuntimeStateConsumed, false);
  assert.equal(Object.keys(status.expectedPhases).length, HEN_EXPECTED_COUNT);
  assert.equal(new Set(Object.values(status.expectedPhases)).size, 1);
  assert.equal(Object.values(status.expectedPhases)[0], 'pending');
});

test('authoritative mapping validates expected collection counts and uniqueness', () => {
  const result = validateMapping(mapping);
  assert.deepEqual(result.counts, { CANAAN: 31, 'THE 419 SCRIPT': 13, HEN: 17, INTRODUCTIONS: 5 });
  assert.equal(result.itemIds.size, 66);
  assert.equal(result.tokens.size, 66);
  assert.equal(result.localPaths.size, 66);
});

test('mapping validation rejects duplicate item IDs, duplicate tokens, duplicate paths, and unsupported collections', () => {
  const duplicateItem = clone(mapping);
  duplicateItem.items[1].cmsItemId = duplicateItem.items[0].cmsItemId;
  assert.throws(() => validateMapping(duplicateItem), /Duplicate CMS item ID/);

  const duplicateToken = clone(mapping);
  const sameCollection = duplicateToken.items.find((item, index) => index > 0 && item.collection === duplicateToken.items[0].collection);
  sameCollection.cmsTokenId = duplicateToken.items[0].cmsTokenId;
  sameCollection.localNumericBasename = duplicateToken.items[0].cmsTokenId;
  assert.throws(() => validateMapping(duplicateToken), /Duplicate collection\/token/);

  const duplicatePath = clone(mapping);
  duplicatePath.items[1].localApprovedJpegPath = duplicatePath.items[0].localApprovedJpegPath;
  assert.throws(() => validateMapping(duplicatePath), /Duplicate local path/);

  const unsupported = clone(mapping);
  unsupported.items[0].collection = 'UNKNOWN';
  assert.throws(() => validateMapping(unsupported), /Unsupported collection/);
});

test('mapping validation rejects non-direct basename identity and ambiguity', () => {
  const offByOne = clone(mapping);
  offByOne.items[0].localNumericBasename += 1;
  assert.throws(() => validateMapping(offByOne), /numeric basename/);
  const ambiguous = clone(mapping);
  ambiguous.items[0].mappingConfidence = 'MEDIUM';
  assert.throws(() => validateMapping(ambiguous), /not an unambiguous HIGH-confidence mapping/);
});

test('completion authority identifies exactly CANAAN token 1 as published-verified', () => {
  const completed = validateCompletions(completions, mapping);
  assert.equal(completed.size, 1);
  const pilot = completed.get('65a1bf3dc64d193880da0093');
  assert.equal(pilot.collection, 'CANAAN');
  assert.equal(pilot.cmsTokenId, 1);
  assert.equal(pilot.status, 'published-verified');
  assert.ok(pilot.evidence.length >= 1);
});

test('completion validation rejects unknown, duplicate, or non-verified records', () => {
  const unknown = clone(completions);
  unknown.items[0].cmsItemId = 'unknown';
  assert.throws(() => validateCompletions(unknown, mapping), /absent from the mapping/);
  const duplicate = clone(completions);
  duplicate.items.push(clone(duplicate.items[0]));
  assert.throws(() => validateCompletions(duplicate, mapping), /Duplicate completion/);
  const incomplete = clone(completions);
  incomplete.items[0].status = 'published';
  assert.throws(() => validateCompletions(incomplete, mapping), /not published-verified/);
});

test('planner produces exactly 48 remaining items and excludes all HEN items', () => {
  assert.equal(plan.counts.totalAuditedMappings, EXPECTED_COUNTS.audited);
  assert.equal(plan.counts.eligibleDirectMapMappings, EXPECTED_COUNTS.eligible);
  assert.equal(plan.counts.excludedHenMappings, EXPECTED_COUNTS.excluded);
  assert.equal(plan.counts.alreadyMigratedMappings, EXPECTED_COUNTS.completed);
  assert.equal(plan.counts.remainingRolloutMappings, EXPECTED_COUNTS.rollout);
  assert.deepEqual(plan.counts.rolloutByCollection, { CANAAN: 30, 'THE 419 SCRIPT': 13, INTRODUCTIONS: 5 });
  assert.equal(plan.items.some((item) => item.collection === 'HEN'), false);
});

test('planner shows CANAAN token 1 as an explained skip rather than silently omitting it', () => {
  const pilot = plan.items.find((item) => item.collection === 'CANAAN' && item.tokenId === 1);
  assert.equal(pilot.cmsItemId, '65a1bf3dc64d193880da0093');
  assert.equal(pilot.batchId, null);
  assert.equal(pilot.migrationStatus, 'already-migrated');
  assert.match(pilot.skipReason, /CMS-IMG-2/);
});

test('batching is deterministic, collection-local, and starts with exactly five derived CANAAN items', async () => {
  const second = await buildRolloutPlan({ mapping, completions, repoRoot });
  assert.deepEqual(second.batches, plan.batches);
  assert.deepEqual(plan.batches.map((batch) => [batch.batchId, batch.collection, batch.count]), [
    ['B1', 'CANAAN', 5],
    ['B2', 'CANAAN', 13],
    ['B3', 'CANAAN', 12],
    ['B4', 'THE 419 SCRIPT', 13],
    ['B5', 'INTRODUCTIONS', 5],
  ]);
  const first = plan.batches[0].itemIds.map((id) => plan.items.find((item) => item.cmsItemId === id));
  assert.deepEqual(first.map((item) => item.tokenId), [0, 2, 3, 4, 5]);
  assert.equal(new Set(plan.batches.flatMap((batch) => batch.itemIds)).size, 48);
});

test('all planned local paths are unique, valid, hashed, and dimension checked', () => {
  const rolloutItems = plan.items.filter((item) => item.migrationStatus === 'pending');
  assert.equal(new Set(rolloutItems.map((item) => item.localSourceImage)).size, 48);
  for (const item of rolloutItems) {
    assert.match(item.localSha256, /^[a-f0-9]{64}$/);
    assert.equal(item.expectedDimensions.width, 300);
    assert.ok([375, 386].includes(item.expectedDimensions.height));
  }
});

test('local inspection rejects a missing path and path traversal', async () => {
  const item = mapping.items.find((candidate) => candidate.collection === 'CANAAN');
  await assert.rejects(inspectLocalImage(repoRoot, { ...item, localApprovedJpegPath: 'missing.jpg' }), /Missing local image/);
  await assert.rejects(inspectLocalImage(repoRoot, { ...item, localApprovedJpegPath: '../outside.jpg' }), /escapes the repository/);
});

test('journal success transitions and blocked attempts preserve the last successful phase', () => {
  let journal = initialBatchJournal(plan, 'B1', '2026-08-17T00:00:00.000Z');
  const itemId = plan.batches[0].itemIds[0];
  journal = recordItemAttempt(journal, itemId, { phase: 'uploaded', status: 'succeeded',
    writeOutcome: 'applied-verified', patch: { uploadedAsset: { id: 'asset', verifiedSha256: journal.items[itemId].localSha256 } } }, '2026-08-17T00:01:00.000Z');
  journal = recordItemAttempt(journal, itemId, { phase: 'stage-batch', status: 'blocked',
    error: { message: 'pre-write rejection' } }, '2026-08-17T00:02:00.000Z');
  const state = journal.items[itemId];
  assert.equal(state.currentPhase, 'uploaded');
  assert.equal(state.lastSuccessfulPhase, 'uploaded');
  assert.equal(state.lastAttemptStatus, 'blocked');
  assert.equal(state.attempts.length, 2);
  assert.equal(state.blockedAttempts.length, 1);
  assert.equal(state.reconciliationRequired, false);
});

test('unknown write outcome preserves durable phase and requires reconciliation', () => {
  let journal = initialBatchJournal(plan, 'B1');
  const itemId = plan.batches[0].itemIds[0];
  journal = recordItemAttempt(journal, itemId, { phase: 'uploaded', status: 'succeeded' });
  journal = recordItemAttempt(journal, itemId, { phase: 'stage-batch', status: 'reconciliation-required',
    writeOutcome: 'unknown', error: { message: 'connection lost' } });
  assert.equal(journal.items[itemId].currentPhase, 'uploaded');
  assert.equal(journal.items[itemId].lastSuccessfulPhase, 'uploaded');
  assert.equal(journal.items[itemId].reconciliationRequired, true);
});

test('invalid per-item state transitions are rejected', () => {
  const journal = initialBatchJournal(plan, 'B1');
  const itemId = plan.batches[0].itemIds[0];
  assert.throws(() => recordItemAttempt(journal, itemId, { phase: 'published', status: 'succeeded' }), /Invalid state transition/);
});

test('idempotency chooses reconciliation, no-op stage verification, asset reuse, then upload', () => {
  const state = { localSha256: 'expected', reconciliationRequired: false };
  assert.equal(determineIdempotentAction({ itemState: { ...state, reconciliationRequired: true } }), 'reconcile-required');
  assert.equal(determineIdempotentAction({ itemState: state, localMatchesLive: true }), 'reconcile-published');
  assert.equal(determineIdempotentAction({ itemState: state, localMatchesStaged: true }), 'verify-staged-noop');
  assert.equal(determineIdempotentAction({ itemState: state, reusableUploadedAsset: { verifiedSha256: 'expected' } }), 'reuse-upload');
  assert.equal(determineIdempotentAction({ itemState: state }), 'upload-and-stage');
});

test('preflight policy rejects the configured active redeem token', () => {
  const active = plan.items.find((item) => item.collection === 'CANAAN' && item.tokenId === 29);
  assert.throws(() => assertNoActiveRedeemTarget([active], { redeemToken: { collection: 'CANAAN', tokenId: '29' } }),
    /configured active redeem token/);
  assert.doesNotThrow(() => assertNoActiveRedeemTarget(
    plan.batches[0].itemIds.map((id) => plan.items.find((item) => item.cmsItemId === id)),
    { redeemToken: { collection: 'CANAAN', tokenId: '29' } },
  ));
});

test('normalized Webflow image identity is accepted through content verification', async () => {
  const plannedItem = plan.items.find((item) => item.collection === 'CANAAN' && item.tokenId === 0);
  const local = await inspectLocalImage(repoRoot, mapping.items.find((item) => item.cmsItemId === plannedItem.cmsItemId));
  const normalized = await sharp(local.bytes).jpeg({ quality: 91, progressive: true }).toBuffer();
  const image = { fileId: 'cms-normalized-id', url: 'https://example.test/normalized.jpeg', alt: null };
  const submitted = { fileId: 'submitted-asset-id', url: 'https://example.test/original.jpg', alt: null };
  const verification = await verifyPlannedCmsImage(image, local, async () => new Response(normalized, {
    status: 200, headers: { 'content-type': 'image/jpeg' },
  }), submitted);
  assert.equal(verification.ok, true);
  assert.equal(verification.normalization.fileIdChanged, true);
  assert.equal(verification.normalization.urlChanged, true);
});

test('content verification rejects changed dimensions', async () => {
  const plannedItem = plan.items.find((item) => item.collection === 'CANAAN' && item.tokenId === 0);
  const local = await inspectLocalImage(repoRoot, mapping.items.find((item) => item.cmsItemId === plannedItem.cmsItemId));
  const resized = await sharp(local.bytes).resize(299, 375, { fit: 'fill' }).jpeg().toBuffer();
  const verification = await verifyPlannedCmsImage({ fileId: 'id', url: 'https://example.test/image.jpeg', alt: null }, local,
    async () => new Response(resized, { status: 200, headers: { 'content-type': 'image/jpeg' } }));
  assert.equal(verification.ok, false);
  assert.equal(verification.content.dimensionsMatch, false);
});

test('non-image and unrelated-item drift are hard failures', () => {
  const first = plan.items.find((item) => item.cmsItemId === plan.batches[0].itemIds[0]);
  const second = plan.items.find((item) => item.cmsItemId === plan.batches[0].itemIds[1]);
  const before = fakeCmsItem(first);
  const after = clone(before);
  after.fieldData.reference = 'drifted';
  const target = compareTarget(before, after, { ok: true, image: after.fieldData.image });
  assert.equal(target.ok, false);
  assert.deepEqual(target.nonImageDifferences, ['fieldData.reference']);

  const beforeItems = [before, fakeCmsItem(second)];
  const afterItems = clone(beforeItems);
  afterItems[1].fieldData.name = 'UNRELATED DRIFT';
  const unrelated = compareUnrelatedItems(beforeItems, afterItems, [first.cmsItemId]);
  assert.equal(unrelated.ok, false);
});

test('clean publication metadata permits harmless timestamp differences', () => {
  const item = plan.items.find((candidate) => candidate.cmsItemId === plan.batches[0].itemIds[0]);
  const staged = fakeCmsItem(item);
  const live = clone(staged);
  staged.lastUpdated = '2026-08-17T00:00:00.000Z';
  staged.lastPublished = '2026-08-17T00:02:00.000Z';
  live.lastUpdated = '2026-08-16T23:59:00.000Z';
  live.lastPublished = '2026-08-17T00:01:00.000Z';
  const result = verifyCleanPublishedState(staged, live);
  assert.equal(result.ok, true);
  assert.equal(result.publicationMarkersCoverAllUpdates, true);
});

test('content-identical queued metadata is not a clean published state', () => {
  const item = plan.items.find((candidate) => candidate.cmsItemId === plan.batches[0].itemIds[0]);
  const live = fakeCmsItem(item);
  const staged = clone(live);
  staged.lastUpdated = '2026-08-17T00:01:00.000Z';
  staged.lastPublished = '2026-08-17T00:00:00.000Z';
  const result = verifyCleanPublishedState(staged, live);
  assert.equal(result.ok, false);
  assert.equal(result.stagedUpdatedNotAfterPublished, false);
});

test('matching content with null lastPublished is not a clean published state', () => {
  const item = plan.items.find((candidate) => candidate.cmsItemId === plan.batches[0].itemIds[0]);
  const staged = fakeCmsItem(item);
  const live = clone(staged);
  staged.lastPublished = null;
  live.lastPublished = null;
  const result = verifyCleanPublishedState(staged, live);
  assert.equal(result.ok, false);
  assert.equal(result.lastPublishedPresent, false);
});

test('individually clean but inconsistent staged/live publication metadata fails', () => {
  const item = plan.items.find((candidate) => candidate.cmsItemId === plan.batches[0].itemIds[0]);
  const staged = fakeCmsItem(item);
  const live = clone(staged);
  staged.lastUpdated = '2026-08-17T00:01:00.000Z';
  staged.lastPublished = '2026-08-17T00:03:00.000Z';
  live.lastUpdated = '2026-08-16T23:59:00.000Z';
  live.lastPublished = '2026-08-17T00:00:00.000Z';
  const result = verifyCleanPublishedState(staged, live);
  assert.equal(result.stagedUpdatedNotAfterPublished, true);
  assert.equal(result.liveUpdatedNotAfterPublished, true);
  assert.equal(result.publicationMarkersCoverAllUpdates, false);
  assert.equal(result.ok, false);
});

function stagedVerifiedJournal() {
  let journal = initialBatchJournal(plan, 'B1', '2026-08-17T00:00:00.000Z');
  for (const itemId of plan.batches[0].itemIds) {
    journal = recordItemAttempt(journal, itemId, { phase: 'staged-verified', status: 'succeeded',
      patch: { resultingStagedImage: { fileId: `cms-${itemId}`, url: `https://example.test/${itemId}.jpeg`, alt: null } } });
  }
  return journal;
}

test('publish gating constructs the exact ordered batch ID set and requires exact confirmation', () => {
  const journal = stagedVerifiedJournal();
  const expectedIds = plan.batches[0].itemIds;
  assert.deepEqual(exactPublishItemIds(plan, 'B1', journal), expectedIds);
  const confirmation = publishConfirmation('B1', expectedIds);
  const approved = approvePublish(plan, 'B1', journal, confirmation, '2026-08-17T01:00:00.000Z');
  assert.deepEqual(approved.publishApproval.itemIds, expectedIds);
  assert.ok(Object.values(approved.items).every((item) => item.currentPhase === 'publish-approved'));
  assert.throws(() => approvePublish(plan, 'B1', journal, `${confirmation}-wrong`), /confirmation is missing/);
});

test('publish gating rejects blocked and reconciliation-required items', () => {
  let journal = stagedVerifiedJournal();
  const itemId = plan.batches[0].itemIds[0];
  journal = recordItemAttempt(journal, itemId, { phase: 'publish-batch', status: 'blocked', error: { message: 'blocked' } });
  assert.throws(() => exactPublishItemIds(plan, 'B1', journal), /not publish eligible/);
  journal.items[itemId].reconciliationRequired = true;
  assert.throws(() => exactPublishItemIds(plan, 'B1', journal), /not publish eligible/);
});

test('generalized Webflow client patches only Image and publishes only exact item IDs through mocks', async () => {
  const requests = [];
  const client = new WebflowRolloutClient({ token: 'mock-token', siteId: plan.site.siteId, fetchImpl: async (url, options) => {
    requests.push({ url, options });
    return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
  } });
  const item = plan.items.find((candidate) => candidate.cmsItemId === plan.batches[0].itemIds[0]);
  const image = { fileId: 'asset-id', url: 'https://example.test/asset.jpg', alt: null };
  await client.patchImage(item.collectionId, item.cmsItemId, item.localeId, image);
  await client.publishItems(item.collectionId, plan.batches[0].itemIds);
  assert.equal(requests[0].options.method, 'PATCH');
  assert.match(requests[0].url, /skipInvalidFiles=false$/);
  assert.deepEqual(JSON.parse(requests[0].options.body), {
    items: [{ id: item.cmsItemId, cmsLocaleId: item.localeId, fieldData: { image } }],
  });
  assert.equal(requests[1].options.method, 'POST');
  assert.deepEqual(JSON.parse(requests[1].options.body), { itemIds: plan.batches[0].itemIds });
});

test('Webflow client bounds GET retry/backoff and never blindly retries mutation responses', async () => {
  let getCalls = 0;
  const sleeps = [];
  const getClient = new WebflowRolloutClient({ token: 'mock-token', siteId: henPlan.site.siteId,
    sleep: async (milliseconds) => { sleeps.push(milliseconds); },
    fetchImpl: async () => {
      getCalls += 1;
      if (getCalls < 3) return new Response('{}', { status: 429 });
      return new Response(JSON.stringify({ id: henPlan.collection.id }), { status: 200 });
    } });
  assert.equal((await getClient.getCollection(henPlan.collection.id)).id, henPlan.collection.id);
  assert.equal(getCalls, 3);
  assert.deepEqual(sleeps, [500, 1000]);

  let patchCalls = 0;
  const patchClient = new WebflowRolloutClient({ token: 'mock-token', siteId: henPlan.site.siteId,
    sleep: async () => { throw new Error('mutation backoff must not run'); },
    fetchImpl: async () => { patchCalls += 1; return new Response('{}', { status: 429 }); } });
  const item = henPlan.items[0];
  await assert.rejects(patchClient.patchImage(item.collectionId, item.cmsItemId, item.localeId,
    { fileId: 'asset', url: 'https://example.test/asset.jpg', alt: null }), /HTTP 429/);
  assert.equal(patchCalls, 1);
});

test('mocked batch stages five sequentially without publishing, then exact publish reconciles live state', async (t) => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'cms-img-3-stage-mock-'));
  t.after(() => fs.rm(temp, { recursive: true, force: true }));
  const paths = { ...DEFAULT_PATHS, runtime: path.join(temp, 'runtime') };
  const members = plan.batches[0].itemIds.map((id) => plan.items.find((item) => item.cmsItemId === id));
  const oldBytes = await sharp({ create: { width: 300, height: 375, channels: 3, background: '#000000' } })
    .jpeg({ progressive: true }).toBuffer();
  let stagedItems = members.map((item) => fakeCmsItem(item, { fileId: `old-${item.cmsItemId}`,
    url: `https://old.example.test/${item.cmsItemId}.jpg`, alt: null }));
  let liveItems = clone(stagedItems);
  const uploaded = new Map();
  const patchCalls = [];
  let publishCalls = 0;
  let collectionReads = 0;
  let itemReads = 0;
  const api = {
    getCollection: async (collectionId) => { collectionReads += 1; return { id: collectionId }; },
    listItems: async (_collectionId, type) => {
      itemReads += 1;
      return { items: clone(type === 'live' ? liveItems : stagedItems), pagination: { total: members.length } };
    },
    listAssets: async () => [],
    createAsset: async (fileName) => {
      const item = members.find((candidate) => fileName.includes(`-${candidate.tokenId}-`));
      const metadata = { id: `asset-${item.cmsItemId}`, originalFileName: fileName,
        hostedUrl: `https://assets.example.test/${item.cmsItemId}.jpg`,
        uploadUrl: `https://upload.example.test/${item.cmsItemId}`, uploadDetails: { key: item.cmsItemId } };
      uploaded.set(metadata.id, { metadata, item });
      return metadata;
    },
    getAsset: async (assetId) => uploaded.get(assetId).metadata,
    patchImage: async (_collectionId, itemId, localeId, image) => {
      patchCalls.push({ itemId, localeId, image });
      stagedItems = stagedItems.map((item) => item.id === itemId ? { ...item, fieldData: { ...item.fieldData, image } } : item);
      return { items: [{ id: itemId }] };
    },
    publishItems: async (_collectionId, itemIds) => {
      assert.deepEqual(itemIds, plan.batches[0].itemIds);
      publishCalls += 1;
      const publishedAt = '2026-08-17T02:00:00.000Z';
      stagedItems = stagedItems.map((item) => ({ ...item, lastUpdated: publishedAt, lastPublished: publishedAt }));
      liveItems = clone(stagedItems);
    },
  };
  const localBytes = new Map();
  for (const item of members) localBytes.set(item.cmsItemId, await fs.readFile(path.join(repoRoot, item.localSourceImage)));
  const fetchImpl = async (url, options = {}) => {
    if (options.method === 'POST') return new Response('', { status: 201 });
    const oldMatch = /old\.example\.test\/([a-f0-9]+)\.jpg/.exec(url);
    if (oldMatch) return new Response(oldBytes, { status: 200, headers: { 'content-type': 'image/jpeg' } });
    const assetMatch = /assets\.example\.test\/([a-f0-9]+)\.jpg/.exec(url);
    if (assetMatch) return new Response(localBytes.get(assetMatch[1]), { status: 200, headers: { 'content-type': 'image/jpeg' } });
    throw new Error(`Unexpected mocked URL ${url}`);
  };
  const result = await stageBatch({ plan, batchId: 'B1', api, paths, fetchImpl });
  const originalBaseline = JSON.parse(await fs.readFile(path.join(paths.runtime, 'B1', 'baseline.json'), 'utf8'));
  assert.equal(originalBaseline.collection.id, members[0].collectionId);
  assert.ok(collectionReads >= 1);
  assert.ok(itemReads >= 2);
  assert.equal(patchCalls.length, 5);
  assert.equal(publishCalls, 0);
  assert.equal(result.result.ok, true);
  assert.ok(Object.values(result.journal.items).every((item) => item.currentPhase === 'staged-verified'));
  assert.ok(Object.values(result.journal.items).every((item) => item.reconciliationRequired === false));

  const confirmation = publishConfirmation('B1', plan.batches[0].itemIds);
  const published = await publishBatch({ plan, batchId: 'B1', api, confirmation, paths, fetchImpl });
  assert.equal(publishCalls, 1);
  assert.equal(published.result.ok, true);
  assert.ok(Object.values(published.journal.items).every((item) => item.currentPhase === 'published-verified'));
});

async function createResumeFixture(t) {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'cms-img-3-resume-'));
  t.after(() => fs.rm(temp, { recursive: true, force: true }));
  const paths = { ...DEFAULT_PATHS, runtime: path.join(temp, 'runtime') };
  const batch = plan.batches[0];
  const members = batch.itemIds.map((id) => plan.items.find((item) => item.cmsItemId === id));
  const originalItems = members.map((item) => fakeCmsItem(item, { fileId: `old-${item.cmsItemId}`,
    url: `https://old.example.test/${item.cmsItemId}.jpg`, alt: null }));
  let stagedItems = clone(originalItems);
  let liveItems = clone(originalItems);
  let dropParams = { redeemToken: { collection: 'CANAAN', tokenId: '29' } };
  const oldBytes = await sharp({ create: { width: 300, height: 375, channels: 3, background: '#000000' } })
    .jpeg({ progressive: true }).toBuffer();
  const localBytes = new Map();
  for (const item of members) localBytes.set(item.cmsItemId, await fs.readFile(path.join(repoRoot, item.localSourceImage)));
  const assets = new Map();
  const calls = { dropParams: 0, collectionReads: 0, itemReads: 0, listAssets: 0,
    createAsset: 0, upload: 0, patchImage: 0, publishItems: 0 };
  const api = {
    getCollection: async (collectionId) => { calls.collectionReads += 1; return { id: collectionId }; },
    listItems: async (_collectionId, type) => {
      calls.itemReads += 1;
      return { items: clone(type === 'live' ? liveItems : stagedItems), pagination: { total: members.length } };
    },
    listAssets: async () => { calls.listAssets += 1; return []; },
    createAsset: async (fileName) => {
      calls.createAsset += 1;
      const item = members.find((candidate) => fileName.includes(`-${candidate.tokenId}-`));
      const metadata = { id: `asset-${item.cmsItemId}`, originalFileName: fileName,
        hostedUrl: `https://assets.example.test/${item.cmsItemId}.jpg`,
        uploadUrl: `https://upload.example.test/${item.cmsItemId}`, uploadDetails: { key: item.cmsItemId } };
      assets.set(metadata.id, metadata);
      return metadata;
    },
    getAsset: async (assetId) => assets.get(assetId),
    patchImage: async (_collectionId, itemId, _localeId, image) => {
      calls.patchImage += 1;
      stagedItems = stagedItems.map((item) => item.id === itemId ? { ...item, fieldData: { ...item.fieldData, image } } : item);
      return { items: [{ id: itemId }] };
    },
    publishItems: async () => { calls.publishItems += 1; liveItems = clone(stagedItems); },
  };
  const fetchImpl = async (url, options = {}) => {
    if (options.method === 'POST') { calls.upload += 1; return new Response('', { status: 201 }); }
    const oldMatch = /old\.example\.test\/([a-f0-9]+)\.jpg/.exec(url);
    if (oldMatch) return new Response(oldBytes, { status: 200, headers: { 'content-type': 'image/jpeg' } });
    const assetMatch = /(?:assets|cms)\.example\.test\/([a-f0-9]+)\.jpg/.exec(url);
    if (assetMatch) return new Response(localBytes.get(assetMatch[1]), { status: 200, headers: { 'content-type': 'image/jpeg' } });
    throw new Error(`Unexpected mocked URL ${url}`);
  };
  const dropParamsLoader = async () => { calls.dropParams += 1; return clone(dropParams); };
  const baseline = { collection: { id: members[0].collectionId },
    staged: { items: clone(originalItems), pagination: { total: members.length } },
    live: { items: clone(originalItems), pagination: { total: members.length } } };
  let journal = initialBatchJournal(plan, 'B1', '2026-08-17T00:00:00.000Z');
  const persist = async () => {
    await writeJson(path.join(paths.runtime, 'B1', 'baseline.json'), baseline);
    await writeJson(path.join(paths.runtime, 'B1', 'journal.json'), journal);
  };
  const setStagedVerified = (itemId) => {
    const image = { fileId: `cms-${itemId}`, url: `https://cms.example.test/${itemId}.jpg`, alt: null };
    stagedItems = stagedItems.map((item) => item.id === itemId ? { ...item, fieldData: { ...item.fieldData, image } } : item);
    journal = recordItemAttempt(journal, itemId, { phase: 'staged-verified', status: 'succeeded',
      patch: { submittedImage: image, resultingStagedImage: image } }, '2026-08-17T00:01:00.000Z');
  };
  const setPublishedVerified = (itemId) => {
    const image = { fileId: `cms-${itemId}`, url: `https://cms.example.test/${itemId}.jpg`, alt: null };
    stagedItems = stagedItems.map((item) => item.id === itemId ? { ...item, fieldData: { ...item.fieldData, image } } : item);
    liveItems = liveItems.map((item) => item.id === itemId ? { ...item, fieldData: { ...item.fieldData, image } } : item);
    journal = recordItemAttempt(journal, itemId, { phase: 'published-verified', status: 'succeeded',
      patch: { submittedImage: image, resultingStagedImage: image, publishedImage: image } }, '2026-08-17T00:02:00.000Z');
  };
  const setPublished = (itemId) => {
    const image = { fileId: `cms-${itemId}`, url: `https://cms.example.test/${itemId}.jpg`, alt: null };
    stagedItems = stagedItems.map((item) => item.id === itemId ? { ...item, fieldData: { ...item.fieldData, image } } : item);
    liveItems = liveItems.map((item) => item.id === itemId ? { ...item, fieldData: { ...item.fieldData, image } } : item);
    journal = recordItemAttempt(journal, itemId, { phase: 'staged-verified', status: 'succeeded',
      patch: { submittedImage: image, resultingStagedImage: image } }, '2026-08-17T00:01:00.000Z');
    journal = recordItemAttempt(journal, itemId, { phase: 'publish-approved', status: 'succeeded' },
      '2026-08-17T00:01:30.000Z');
    journal = recordItemAttempt(journal, itemId, { phase: 'published', status: 'succeeded' },
      '2026-08-17T00:02:00.000Z');
  };
  const mutationCount = () => calls.createAsset + calls.upload + calls.patchImage + calls.publishItems;
  return {
    paths, batch, members, baseline, api, fetchImpl, dropParamsLoader, calls, mutationCount,
    get journal() { return journal; },
    set journal(value) { journal = value; },
    get stagedItems() { return stagedItems; },
    set stagedItems(value) { stagedItems = value; },
    get liveItems() { return liveItems; },
    set liveItems(value) { liveItems = value; },
    setDropParams(value) { dropParams = value; },
    persist, setStagedVerified, setPublishedVerified, setPublished,
  };
}

async function createHenExecutionFixture(t, batchId = 'H1') {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'cms-img-4-hen-execution-'));
  t.after(() => fs.rm(temp, { recursive: true, force: true }));
  const paths = { ...DEFAULT_PATHS, runtime: path.join(temp, 'runtime') };
  const runtime = path.join(paths.runtime, 'CMS-IMG-4', 'HEN', 'testnet');
  const batch = henPlan.batches.find((candidate) => candidate.batchId === batchId);
  const members = batch.itemIds.map((itemId) => henPlan.items.find((item) => item.cmsItemId === itemId));
  const originalItems = henPlan.items.map((item) => fakeCmsItem(item, { fileId: `old-${item.cmsItemId}`,
    url: `https://old.example.test/${item.cmsItemId}.jpg`, alt: null }));
  let stagedItems = clone(originalItems);
  let liveItems = clone(originalItems);
  let dropParams = { redeemToken: { collection: '', tokenId: '' } };
  let patchUncertainItemId = null;
  let publishUncertain = false;
  const oldBytes = await sharp({ create: { width: 300, height: 375, channels: 3, background: '#000000' } })
    .jpeg({ progressive: true }).toBuffer();
  const localBytes = new Map();
  for (const item of henPlan.items) localBytes.set(item.cmsItemId, await fs.readFile(path.join(repoRoot, item.localSourceImage)));
  const assets = new Map();
  const calls = { dropParams: 0, collectionReads: 0, itemReads: 0, listAssets: 0,
    createAsset: 0, upload: 0, patchImage: 0, publishItems: 0 };
  const patchCalls = [];
  const publishCalls = [];
  const api = {
    getCollection: async (collectionId) => { calls.collectionReads += 1; return { id: collectionId }; },
    listItems: async (_collectionId, type) => {
      calls.itemReads += 1;
      return { items: clone(type === 'live' ? liveItems : stagedItems), pagination: { total: HEN_EXPECTED_COUNT } };
    },
    listAssets: async () => { calls.listAssets += 1; return []; },
    createAsset: async (fileName) => {
      calls.createAsset += 1;
      const item = members.find((candidate) => fileName.includes(`-${candidate.tokenId}-`));
      const metadata = { id: `asset-${item.cmsItemId}`, originalFileName: fileName,
        hostedUrl: `https://assets.example.test/${item.cmsItemId}.jpg`,
        uploadUrl: `https://upload.example.test/${item.cmsItemId}`, uploadDetails: { key: item.cmsItemId } };
      assets.set(metadata.id, metadata);
      return metadata;
    },
    getAsset: async (assetId) => assets.get(assetId),
    patchImage: async (collectionId, itemId, localeId, image) => {
      calls.patchImage += 1;
      patchCalls.push({ collectionId, itemId, localeId, image });
      stagedItems = stagedItems.map((item) => item.id === itemId ? { ...item, fieldData: { ...item.fieldData, image } } : item);
      if (itemId === patchUncertainItemId) throw new Error('mock patch response lost');
      return { items: [{ id: itemId }] };
    },
    publishItems: async (collectionId, itemIds) => {
      calls.publishItems += 1;
      publishCalls.push({ collectionId, itemIds: [...itemIds] });
      const publishedAt = '2026-08-18T03:00:00.000Z';
      const authorized = new Set(itemIds);
      stagedItems = stagedItems.map((item) => authorized.has(item.id) ?
        { ...item, lastUpdated: publishedAt, lastPublished: publishedAt } : item);
      const stagedById = new Map(stagedItems.map((item) => [item.id, item]));
      liveItems = liveItems.map((item) => authorized.has(item.id) ? clone(stagedById.get(item.id)) : item);
      if (publishUncertain) throw new Error('mock publish response lost');
    },
  };
  const fetchImpl = async (url, options = {}) => {
    if (options.method === 'POST') { calls.upload += 1; return new Response('', { status: 201 }); }
    const oldMatch = /old\.example\.test\/([a-f0-9]+)\.jpg/.exec(url);
    if (oldMatch) return new Response(oldBytes, { status: 200, headers: { 'content-type': 'image/jpeg' } });
    const imageMatch = /(?:assets|cms)\.example\.test\/([a-f0-9]+)\.jpg/.exec(url);
    if (imageMatch) return new Response(localBytes.get(imageMatch[1]), { status: 200, headers: { 'content-type': 'image/jpeg' } });
    throw new Error(`Unexpected mocked URL ${url}`);
  };
  const dropParamsLoader = async () => { calls.dropParams += 1; return clone(dropParams); };
  const baseline = { collection: { id: henPlan.collection.id },
    staged: { items: clone(originalItems), pagination: { total: HEN_EXPECTED_COUNT } },
    live: { items: clone(originalItems), pagination: { total: HEN_EXPECTED_COUNT } } };
  let journal = initialBatchJournal(henPlan, batchId, '2026-08-18T00:00:00.000Z');
  const persist = async () => {
    await writeJson(path.join(runtime, batchId, 'baseline.json'), baseline);
    await writeJson(path.join(runtime, batchId, 'journal.json'), journal);
  };
  const setStagedVerified = (itemId) => {
    const image = { fileId: `cms-${itemId}`, url: `https://cms.example.test/${itemId}.jpg`, alt: null };
    stagedItems = stagedItems.map((item) => item.id === itemId ? { ...item, fieldData: { ...item.fieldData, image } } : item);
    journal = recordItemAttempt(journal, itemId, { phase: 'staged-verified', status: 'succeeded',
      patch: { submittedImage: image, resultingStagedImage: image } }, '2026-08-18T00:01:00.000Z');
  };
  const mutationCount = () => calls.createAsset + calls.upload + calls.patchImage + calls.publishItems;
  return {
    paths, runtime, batch, members, originalItems, baseline, api, fetchImpl, dropParamsLoader, calls, patchCalls, publishCalls, assets,
    mutationCount, persist, setStagedVerified,
    get journal() { return journal; }, set journal(value) { journal = value; },
    get stagedItems() { return stagedItems; }, set stagedItems(value) { stagedItems = value; },
    get liveItems() { return liveItems; }, set liveItems(value) { liveItems = value; },
    setDropParams(value) { dropParams = value; },
    setPatchUncertain(itemId) { patchUncertainItemId = itemId; },
    setPublishUncertain(value) { publishUncertain = value; },
  };
}

test('HEN H1 stages sequentially with canonical identity, mirror-derived files, Image-only patches, and isolated state', async (t) => {
  const fixture = await createHenExecutionFixture(t);
  const cms3Sentinel = path.join(fixture.paths.runtime, 'B1', 'journal.json');
  await writeJson(cms3Sentinel, { ticket: 'CMS-IMG-3', preserve: true });
  const liveBefore = clone(fixture.liveItems);
  const result = await stageHenBatch({ plan: henPlan, batchId: 'H1', api: fixture.api, paths: fixture.paths,
    fetchImpl: fixture.fetchImpl, dropParamsLoader: fixture.dropParamsLoader });
  assert.equal(result.result.ok, true);
  assert.equal(fixture.patchCalls.length, 5);
  assert.deepEqual(fixture.patchCalls.map((call) => call.itemId), fixture.batch.itemIds);
  assert.ok(fixture.patchCalls.every((call) => Object.keys(call).sort().join(',') === 'collectionId,image,itemId,localeId'));
  assert.deepEqual(fixture.liveItems, liveBefore);
  assert.deepEqual(fixture.stagedItems.filter((item) => !fixture.batch.itemIds.includes(item.id)),
    fixture.originalItems.filter((item) => !fixture.batch.itemIds.includes(item.id)));
  for (const member of fixture.members) {
    const staged = fixture.stagedItems.find((item) => item.id === member.cmsItemId);
    assert.equal(staged.fieldData['token-id'], member.canonicalHenTokenId);
    assert.notEqual(staged.fieldData['token-id'], member.thumbnailLookupId);
    assert.equal(staged.fieldData.reference, 'preserve-me');
    assert.match([...fixture.assets.values()].find((asset) => asset.id === `asset-${member.cmsItemId}`).originalFileName,
      new RegExp(`hen-${member.canonicalHenTokenId}-`));
  }
  const journal = JSON.parse(await fs.readFile(path.join(fixture.runtime, 'H1', 'journal.json'), 'utf8'));
  assert.equal(journal.ticket, 'CMS-IMG-4');
  assert.ok(Object.values(journal.items).every((item) => item.currentPhase === 'staged-verified' && !item.reconciliationRequired));
  assert.deepEqual(JSON.parse(await fs.readFile(cms3Sentinel, 'utf8')), { ticket: 'CMS-IMG-3', preserve: true });
  const mutationsBeforeVerify = fixture.mutationCount();
  const verified = await verifyHenStagedBatch({ plan: henPlan, batchId: 'H1', api: fixture.api,
    paths: fixture.paths, fetchImpl: fixture.fetchImpl });
  assert.equal(verified.result.ok, true);
  assert.equal(verified.cmsWritesPerformed, 0);
  assert.equal(fixture.mutationCount(), mutationsBeforeVerify);
});

test('HEN clean resume verifies prior progress and stages only remaining H1 items', async (t) => {
  const fixture = await createHenExecutionFixture(t);
  fixture.setStagedVerified(fixture.batch.itemIds[0]);
  await fixture.persist();
  const result = await stageHenBatch({ plan: henPlan, batchId: 'H1', api: fixture.api, paths: fixture.paths,
    fetchImpl: fixture.fetchImpl, dropParamsLoader: fixture.dropParamsLoader });
  assert.equal(result.result.ok, true);
  assert.equal(fixture.calls.patchImage, 4);
  assert.equal(fixture.calls.createAsset, 4);
  assert.ok(Object.values(result.journal.items).every((item) => item.currentPhase === 'staged-verified'));
});

test('HEN GET-only staged verifier rejects mirror ID in canonical CMS identity', async (t) => {
  const fixture = await createHenExecutionFixture(t);
  for (const itemId of fixture.batch.itemIds) fixture.setStagedVerified(itemId);
  const first = fixture.members[0];
  fixture.stagedItems = fixture.stagedItems.map((item) => item.id === first.cmsItemId ?
    { ...item, fieldData: { ...item.fieldData, 'token-id': first.thumbnailLookupId } } : item);
  await fixture.persist();
  await assert.rejects(verifyHenStagedBatch({ plan: henPlan, batchId: 'H1', api: fixture.api,
    paths: fixture.paths, fetchImpl: fixture.fetchImpl }), /CMS identity mismatch/);
  assert.equal(fixture.mutationCount(), 0);
});

test('HEN GET-only staged verifier rejects remaining-item and live drift with zero writes', async (t) => {
  const fixture = await createHenExecutionFixture(t);
  for (const itemId of fixture.batch.itemIds) fixture.setStagedVerified(itemId);
  await fixture.persist();
  const unrelatedId = henPlan.batches[1].itemIds[0];
  fixture.stagedItems = fixture.stagedItems.map((item) => item.id === unrelatedId ?
    { ...item, fieldData: { ...item.fieldData, reference: 'unexpected-staged-drift' } } : item);
  await assert.rejects(verifyHenStagedBatch({ plan: henPlan, batchId: 'H1', api: fixture.api,
    paths: fixture.paths, fetchImpl: fixture.fetchImpl }), /Full staged batch verification failed/);
  fixture.stagedItems = fixture.stagedItems.map((item) => item.id === unrelatedId ?
    clone(fixture.originalItems.find((original) => original.id === unrelatedId)) : item);
  const targetId = fixture.batch.itemIds[0];
  fixture.liveItems = fixture.liveItems.map((item) => item.id === targetId ?
    { ...item, fieldData: { ...item.fieldData, reference: 'unexpected-live-drift' } } : item);
  await assert.rejects(verifyHenStagedBatch({ plan: henPlan, batchId: 'H1', api: fixture.api,
    paths: fixture.paths, fetchImpl: fixture.fetchImpl }), /Full staged batch verification failed/);
  assert.equal(fixture.mutationCount(), 0);
});

test('HEN upload-complete patch-uncertain outcome stops and requires reconciliation without blind retry', async (t) => {
  const fixture = await createHenExecutionFixture(t);
  const itemId = fixture.batch.itemIds[0];
  fixture.setPatchUncertain(itemId);
  await assert.rejects(stageHenBatch({ plan: henPlan, batchId: 'H1', api: fixture.api, paths: fixture.paths,
    fetchImpl: fixture.fetchImpl, dropParamsLoader: fixture.dropParamsLoader }), /mock patch response lost/);
  assert.equal(fixture.calls.createAsset, 1);
  assert.equal(fixture.calls.upload, 1);
  assert.equal(fixture.calls.patchImage, 1);
  const journal = JSON.parse(await fs.readFile(path.join(fixture.runtime, 'H1', 'journal.json'), 'utf8'));
  assert.equal(journal.items[itemId].currentPhase, 'uploaded');
  assert.equal(journal.items[itemId].lastSuccessfulPhase, 'uploaded');
  assert.equal(journal.items[itemId].reconciliationRequired, true);
  const mutations = fixture.mutationCount();
  await assert.rejects(stageHenBatch({ plan: henPlan, batchId: 'H1', api: fixture.api, paths: fixture.paths,
    fetchImpl: fixture.fetchImpl, dropParamsLoader: fixture.dropParamsLoader }), /already requires reconciliation/);
  assert.equal(fixture.mutationCount(), mutations);
});

test('HEN canonical active token blocks fresh preflight before any external mutation', async (t) => {
  const fixture = await createHenExecutionFixture(t);
  fixture.setDropParams({ redeemToken: { collection: 'HEN', tokenId: '94684' } });
  await assert.rejects(stageHenBatch({ plan: henPlan, batchId: 'H1', api: fixture.api, paths: fixture.paths,
    fetchImpl: fixture.fetchImpl, dropParamsLoader: fixture.dropParamsLoader }), /configured active redeem token/);
  assert.equal(fixture.mutationCount(), 0);
});

test('HEN publication uses exact authorized IDs, performs no upload or patch, and cleanly reconciles metadata', async (t) => {
  const fixture = await createHenExecutionFixture(t);
  await stageHenBatch({ plan: henPlan, batchId: 'H1', api: fixture.api, paths: fixture.paths,
    fetchImpl: fixture.fetchImpl, dropParamsLoader: fixture.dropParamsLoader });
  const writesBeforePublish = { createAsset: fixture.calls.createAsset, upload: fixture.calls.upload, patchImage: fixture.calls.patchImage };
  const confirmation = publishConfirmation('H1', fixture.batch.itemIds, 'CMS-IMG-4');
  const published = await publishHenBatch({ plan: henPlan, batchId: 'H1', api: fixture.api, confirmation,
    paths: fixture.paths, fetchImpl: fixture.fetchImpl });
  assert.deepEqual(fixture.publishCalls, [{ collectionId: henPlan.collection.id, itemIds: fixture.batch.itemIds }]);
  assert.deepEqual({ createAsset: fixture.calls.createAsset, upload: fixture.calls.upload, patchImage: fixture.calls.patchImage }, writesBeforePublish);
  assert.ok(Object.values(published.journal.items).every((item) => item.currentPhase === 'published-verified' && !item.reconciliationRequired));
  assert.ok(published.result.targetResults.every((target) => target.publicationState.ok));
  const mutations = fixture.mutationCount();
  const reconciled = await reconcileHenPublishedBatch({ plan: henPlan, batchId: 'H1', api: fixture.api,
    paths: fixture.paths, fetchImpl: fixture.fetchImpl });
  assert.equal(reconciled.cmsWritesPerformed, 0);
  assert.equal(fixture.mutationCount(), mutations);
});

test('HEN publication ambiguity is attempted once, records reconciliationRequired, and blocks GET reconciliation', async (t) => {
  const fixture = await createHenExecutionFixture(t);
  await stageHenBatch({ plan: henPlan, batchId: 'H1', api: fixture.api, paths: fixture.paths,
    fetchImpl: fixture.fetchImpl, dropParamsLoader: fixture.dropParamsLoader });
  fixture.setPublishUncertain(true);
  const confirmation = publishConfirmation('H1', fixture.batch.itemIds, 'CMS-IMG-4');
  await assert.rejects(publishHenBatch({ plan: henPlan, batchId: 'H1', api: fixture.api, confirmation,
    paths: fixture.paths, fetchImpl: fixture.fetchImpl }), /mock publish response lost/);
  assert.equal(fixture.calls.publishItems, 1);
  const journal = JSON.parse(await fs.readFile(path.join(fixture.runtime, 'H1', 'journal.json'), 'utf8'));
  assert.ok(Object.values(journal.items).every((item) => item.reconciliationRequired));
  const mutations = fixture.mutationCount();
  await assert.rejects(reconcileHenPublishedBatch({ plan: henPlan, batchId: 'H1', api: fixture.api,
    paths: fixture.paths, fetchImpl: fixture.fetchImpl }), /reconciliation-required items/);
  assert.equal(fixture.mutationCount(), mutations);
});

test('HEN published reconciliation rejects a queued content-identical revision with zero writes', async (t) => {
  const fixture = await createHenExecutionFixture(t);
  await stageHenBatch({ plan: henPlan, batchId: 'H1', api: fixture.api, paths: fixture.paths,
    fetchImpl: fixture.fetchImpl, dropParamsLoader: fixture.dropParamsLoader });
  const confirmation = publishConfirmation('H1', fixture.batch.itemIds, 'CMS-IMG-4');
  await publishHenBatch({ plan: henPlan, batchId: 'H1', api: fixture.api, confirmation,
    paths: fixture.paths, fetchImpl: fixture.fetchImpl });
  const itemId = fixture.batch.itemIds[0];
  fixture.stagedItems = fixture.stagedItems.map((item) => item.id === itemId ?
    { ...item, lastUpdated: '2026-08-18T03:01:00.000Z', lastPublished: '2026-08-18T03:00:00.000Z' } : item);
  const mutations = fixture.mutationCount();
  await assert.rejects(reconcileHenPublishedBatch({ plan: henPlan, batchId: 'H1', api: fixture.api,
    paths: fixture.paths, fetchImpl: fixture.fetchImpl }), /Published reconciliation failed/);
  assert.equal(fixture.mutationCount(), mutations);
  const journal = JSON.parse(await fs.readFile(path.join(fixture.runtime, 'H1', 'journal.json'), 'utf8'));
  assert.equal(journal.items[itemId].reconciliationRequired, true);
});

test('HEN Webflow patch surface cannot write canonical or mirror token fields', async () => {
  const requests = [];
  const client = new WebflowRolloutClient({ token: 'mock-token', siteId: henPlan.site.siteId, fetchImpl: async (url, options) => {
    requests.push({ url, options });
    return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
  } });
  const item = henPlan.items[0];
  const image = { fileId: 'asset-id', url: 'https://example.test/asset.jpg', alt: null };
  await client.patchImage(item.collectionId, item.cmsItemId, item.localeId, image);
  const body = JSON.parse(requests[0].options.body);
  assert.deepEqual(body, { items: [{ id: item.cmsItemId, cmsLocaleId: item.localeId, fieldData: { image } }] });
  assert.equal(JSON.stringify(body).includes('token-id'), false);
  assert.equal(JSON.stringify(body).includes(`:${item.thumbnailLookupId}`), false);
});

test('queued but content-identical reconciliation fails without a write and requires reconciliation', async (t) => {
  const fixture = await createResumeFixture(t);
  for (const itemId of fixture.batch.itemIds) fixture.setPublished(itemId);
  const itemId = fixture.batch.itemIds[0];
  fixture.stagedItems = fixture.stagedItems.map((item) => item.id === itemId ? {
    ...item, lastUpdated: '2026-08-17T00:03:00.000Z', lastPublished: '2026-08-17T00:02:00.000Z',
  } : item);
  fixture.liveItems = fixture.liveItems.map((item) => item.id === itemId ? {
    ...item, lastUpdated: '2026-08-17T00:02:00.000Z', lastPublished: '2026-08-17T00:02:00.000Z',
  } : item);
  await fixture.persist();
  await assert.rejects(reconcilePublishedBatch({ plan, batchId: 'B1', api: fixture.api,
    paths: fixture.paths, fetchImpl: fixture.fetchImpl }), /Published reconciliation failed/);
  assert.equal(fixture.mutationCount(), 0);
  const journal = JSON.parse(await fs.readFile(path.join(fixture.paths.runtime, 'B1', 'journal.json'), 'utf8'));
  assert.ok(Object.values(journal.items).every((entry) => entry.currentPhase !== 'published-verified'));
  assert.equal(journal.items[itemId].currentPhase, 'published');
  assert.equal(journal.items[itemId].lastSuccessfulPhase, 'published');
  assert.equal(journal.items[itemId].lastAttemptStatus, 'reconciliation-required');
  assert.equal(journal.items[itemId].reconciliationRequired, true);
});

test('clean content-identical reconciliation reaches published-verified without a write', async (t) => {
  const fixture = await createResumeFixture(t);
  for (const itemId of fixture.batch.itemIds) fixture.setPublished(itemId);
  await fixture.persist();
  const result = await reconcilePublishedBatch({ plan, batchId: 'B1', api: fixture.api,
    paths: fixture.paths, fetchImpl: fixture.fetchImpl });
  assert.equal(result.result.ok, true);
  assert.ok(result.result.targetResults.every((entry) => entry.publicationState.ok));
  assert.ok(Object.values(result.journal.items).every((entry) => entry.currentPhase === 'published-verified'));
  assert.equal(fixture.mutationCount(), 0);
});

test('clean resume freshly validates staged progress and permits the next pending item', async (t) => {
  const fixture = await createResumeFixture(t);
  fixture.setStagedVerified(fixture.batch.itemIds[0]);
  await fixture.persist();
  const result = await stageBatch({ plan, batchId: 'B1', api: fixture.api, paths: fixture.paths,
    fetchImpl: fixture.fetchImpl, dropParamsLoader: fixture.dropParamsLoader });
  assert.equal(result.result.ok, true);
  assert.equal(fixture.calls.dropParams, 1);
  assert.ok(fixture.calls.itemReads >= 2);
  assert.equal(fixture.calls.patchImage, 4);
  assert.ok(Object.values(result.journal.items).every((item) => item.currentPhase === 'staged-verified'));
});

test('resume rereads drop params and blocks a newly active target before any mutation', async (t) => {
  const fixture = await createResumeFixture(t);
  await fixture.persist();
  fixture.setDropParams({ redeemToken: { collection: 'CANAAN', tokenId: '0' } });
  await assert.rejects(stageBatch({ plan, batchId: 'B1', api: fixture.api, paths: fixture.paths,
    fetchImpl: fixture.fetchImpl, dropParamsLoader: fixture.dropParamsLoader }), /configured active redeem token/);
  assert.equal(fixture.calls.dropParams, 1);
  assert.equal(fixture.mutationCount(), 0);
  const journal = JSON.parse(await fs.readFile(path.join(fixture.paths.runtime, 'B1', 'journal.json'), 'utf8'));
  assert.equal(journal.items[fixture.batch.itemIds[0]].lastAttemptStatus, 'blocked');
  assert.equal(journal.items[fixture.batch.itemIds[0]].reconciliationRequired, false);
});

test('pending staged-image drift blocks resume before any mutation', async (t) => {
  const fixture = await createResumeFixture(t);
  const itemId = fixture.batch.itemIds[1];
  fixture.stagedItems = fixture.stagedItems.map((item) => item.id === itemId ?
    { ...item, fieldData: { ...item.fieldData, image: { fileId: 'external', url: 'https://old.example.test/external.jpg', alt: null } } } : item);
  await fixture.persist();
  await assert.rejects(stageBatch({ plan, batchId: 'B1', api: fixture.api, paths: fixture.paths,
    fetchImpl: fixture.fetchImpl, dropParamsLoader: fixture.dropParamsLoader }), /no longer matches its original CMS baseline/);
  assert.equal(fixture.mutationCount(), 0);
});

test('unexpected live Image drift blocks resume before any mutation', async (t) => {
  const fixture = await createResumeFixture(t);
  const itemId = fixture.batch.itemIds[2];
  fixture.liveItems = fixture.liveItems.map((item) => item.id === itemId ?
    { ...item, fieldData: { ...item.fieldData, image: { fileId: 'external', url: 'https://old.example.test/external.jpg', alt: null } } } : item);
  await fixture.persist();
  await assert.rejects(stageBatch({ plan, batchId: 'B1', api: fixture.api, paths: fixture.paths,
    fetchImpl: fixture.fetchImpl, dropParamsLoader: fixture.dropParamsLoader }), /no longer matches its original CMS baseline/);
  assert.equal(fixture.mutationCount(), 0);
});

test('unexpected non-image drift blocks resume before any mutation', async (t) => {
  const fixture = await createResumeFixture(t);
  const itemId = fixture.batch.itemIds[3];
  fixture.stagedItems = fixture.stagedItems.map((item) => item.id === itemId ?
    { ...item, fieldData: { ...item.fieldData, reference: 'external-drift' } } : item);
  await fixture.persist();
  await assert.rejects(stageBatch({ plan, batchId: 'B1', api: fixture.api, paths: fixture.paths,
    fetchImpl: fixture.fetchImpl, dropParamsLoader: fixture.dropParamsLoader }), /no longer matches its original CMS baseline/);
  assert.equal(fixture.mutationCount(), 0);
});

test('unrelated-item drift blocks resume before any mutation', async (t) => {
  const fixture = await createResumeFixture(t);
  const unrelated = { id: 'unrelated-item', cmsLocaleId: fixture.members[0].localeId,
    isDraft: false, isArchived: false, fieldData: { name: 'UNRELATED', slug: 'unrelated', image: null, note: 'baseline' } };
  fixture.baseline.staged.items.push(clone(unrelated));
  fixture.baseline.live.items.push(clone(unrelated));
  fixture.stagedItems = [...fixture.stagedItems, { ...clone(unrelated), fieldData: { ...unrelated.fieldData, note: 'external-drift' } }];
  fixture.liveItems = [...fixture.liveItems, clone(unrelated)];
  await fixture.persist();
  await assert.rejects(stageBatch({ plan, batchId: 'B1', api: fixture.api, paths: fixture.paths,
    fetchImpl: fixture.fetchImpl, dropParamsLoader: fixture.dropParamsLoader }), /Unrelated collection state drifted/);
  assert.equal(fixture.mutationCount(), 0);
});

test('fully staged-verified resume passes fresh safety gate as a no-op', async (t) => {
  const fixture = await createResumeFixture(t);
  for (const itemId of fixture.batch.itemIds) fixture.setStagedVerified(itemId);
  await fixture.persist();
  const result = await stageBatch({ plan, batchId: 'B1', api: fixture.api, paths: fixture.paths,
    fetchImpl: fixture.fetchImpl, dropParamsLoader: fixture.dropParamsLoader });
  assert.equal(result.result.idempotentNoop, true);
  assert.equal(fixture.calls.dropParams, 1);
  assert.ok(fixture.calls.itemReads >= 2);
  assert.equal(fixture.mutationCount(), 0);
});

test('disappeared staged-verified content blocks and preserves the successful phase', async (t) => {
  const fixture = await createResumeFixture(t);
  for (const itemId of fixture.batch.itemIds) fixture.setStagedVerified(itemId);
  await fixture.persist();
  const itemId = fixture.batch.itemIds[0];
  fixture.stagedItems = fixture.stagedItems.map((item, index) => index === 0 ? clone(fixture.baseline.staged.items[0]) : item);
  await assert.rejects(stageBatch({ plan, batchId: 'B1', api: fixture.api, paths: fixture.paths,
    fetchImpl: fixture.fetchImpl, dropParamsLoader: fixture.dropParamsLoader }), /cannot be verified/);
  assert.equal(fixture.mutationCount(), 0);
  const journal = JSON.parse(await fs.readFile(path.join(fixture.paths.runtime, 'B1', 'journal.json'), 'utf8'));
  assert.equal(journal.items[itemId].currentPhase, 'staged-verified');
  assert.equal(journal.items[itemId].lastSuccessfulPhase, 'staged-verified');
  assert.equal(journal.items[itemId].lastAttemptStatus, 'reconciliation-required');
  assert.equal(journal.items[itemId].blockedAttempts.length, 1);
  assert.equal(journal.items[itemId].errors.length, 1);
});

test('published-verified resume reconciles staged/live content and introduces no publication', async (t) => {
  const fixture = await createResumeFixture(t);
  for (const itemId of fixture.batch.itemIds) fixture.setPublishedVerified(itemId);
  await fixture.persist();
  const result = await stageBatch({ plan, batchId: 'B1', api: fixture.api, paths: fixture.paths,
    fetchImpl: fixture.fetchImpl, dropParamsLoader: fixture.dropParamsLoader });
  assert.equal(result.result.idempotentNoop, true);
  assert.equal(fixture.calls.publishItems, 0);
  assert.equal(fixture.mutationCount(), 0);
});

test('published-verified resume rejects a later queued revision and requires reconciliation', async (t) => {
  const fixture = await createResumeFixture(t);
  for (const itemId of fixture.batch.itemIds) fixture.setPublishedVerified(itemId);
  const itemId = fixture.batch.itemIds[0];
  fixture.stagedItems = fixture.stagedItems.map((item) => item.id === itemId ? {
    ...item, lastUpdated: '2026-08-17T00:03:00.000Z', lastPublished: '2026-08-17T00:02:00.000Z',
  } : item);
  fixture.liveItems = fixture.liveItems.map((item) => item.id === itemId ? {
    ...item, lastUpdated: '2026-08-17T00:02:00.000Z', lastPublished: '2026-08-17T00:02:00.000Z',
  } : item);
  await fixture.persist();
  await assert.rejects(stageBatch({ plan, batchId: 'B1', api: fixture.api, paths: fixture.paths,
    fetchImpl: fixture.fetchImpl, dropParamsLoader: fixture.dropParamsLoader }), /cannot be reconciled/);
  assert.equal(fixture.mutationCount(), 0);
  const journal = JSON.parse(await fs.readFile(path.join(fixture.paths.runtime, 'B1', 'journal.json'), 'utf8'));
  assert.equal(journal.items[itemId].currentPhase, 'published-verified');
  assert.equal(journal.items[itemId].lastSuccessfulPhase, 'published-verified');
  assert.equal(journal.items[itemId].lastAttemptStatus, 'reconciliation-required');
  assert.equal(journal.items[itemId].reconciliationRequired, true);
});

test('existing reconciliation-required state refuses another stage mutation', async (t) => {
  const fixture = await createResumeFixture(t);
  const itemId = fixture.batch.itemIds[0];
  fixture.journal = recordItemAttempt(fixture.journal, itemId, { phase: 'stage-batch',
    status: 'reconciliation-required', writeOutcome: 'unknown', error: { message: 'uncertain outcome' } });
  await fixture.persist();
  await assert.rejects(stageBatch({ plan, batchId: 'B1', api: fixture.api, paths: fixture.paths,
    fetchImpl: fixture.fetchImpl, dropParamsLoader: fixture.dropParamsLoader }), /already requires reconciliation/);
  assert.equal(fixture.mutationCount(), 0);
});

test('unknown journal phase hard-stops without rewriting journal state', async (t) => {
  const fixture = await createResumeFixture(t);
  const itemId = fixture.batch.itemIds[0];
  fixture.journal.items[itemId].currentPhase = 'unknown-phase';
  await fixture.persist();
  const journalPath = path.join(fixture.paths.runtime, 'B1', 'journal.json');
  const before = await fs.readFile(journalPath);
  await assert.rejects(stageBatch({ plan, batchId: 'B1', api: fixture.api, paths: fixture.paths,
    fetchImpl: fixture.fetchImpl, dropParamsLoader: fixture.dropParamsLoader }), /Unknown or inconsistent journal state/);
  const after = await fs.readFile(journalPath);
  assert.deepEqual(after, before);
  assert.equal(fixture.mutationCount(), 0);
});

test('resume preflight never overwrites the original durable baseline', async (t) => {
  const fixture = await createResumeFixture(t);
  for (const itemId of fixture.batch.itemIds) fixture.setStagedVerified(itemId);
  await fixture.persist();
  const baselinePath = path.join(fixture.paths.runtime, 'B1', 'baseline.json');
  const before = await fs.readFile(baselinePath);
  await stageBatch({ plan, batchId: 'B1', api: fixture.api, paths: fixture.paths,
    fetchImpl: fixture.fetchImpl, dropParamsLoader: fixture.dropParamsLoader });
  const after = await fs.readFile(baselinePath);
  assert.deepEqual(after, before);
});

test('plan Markdown contains counts, exact batch 1, hard stops, publication boundary, and no-write statement', () => {
  const markdown = renderPlanMarkdown(plan);
  assert.match(markdown, /docs\/webflow-cms-image-audit\/CMS-IMG-1\.mapping\.json/);
  assert.match(markdown, /assets\/webflow-cms-image-pilot\/cms-image-pilot\.mjs/);
  assert.match(markdown, /Total audited mappings: 66/);
  assert.match(markdown, /Remaining CMS-IMG-3 rollout population: 48/);
  assert.match(markdown, /B1 — CANAAN \(5\)/);
  assert.match(markdown, /HEN is explicitly ineligible/);
  assert.match(markdown, /saves an immutable pre-write baseline/);
  assert.match(markdown, /resumed invocation must reconcile current state/);
  assert.match(markdown, /Staging never cascades into publication/);
  assert.match(markdown, /No Webflow request or write was performed/);
});

test('runtime path is ignored and tracked plans contain no secrets or signed URLs', async () => {
  const ignore = await fs.readFile(path.join(repoRoot, '.gitignore'), 'utf8');
  assert.match(ignore, /assets\/webflow-cms-image-rollout\/runtime\//);
  const serialized = JSON.stringify(plan);
  assert.doesNotMatch(serialized, /WEBFLOW_API_TOKEN|Bearer\s|X-Amz-|Signature=|Credential=/i);
  assert.equal(plan.externalWritesPerformed, 0);
  assert.equal(plan.items.find((item) => item.collection === 'CANAAN' && item.cmsItemId === '65a1bef667f967865601b215').tokenId, 0);
});

test('structured writes redact secrets and signed query values', async (t) => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'cms-img-3-redact-'));
  t.after(() => fs.rm(temp, { recursive: true, force: true }));
  const file = path.join(temp, 'journal.json');
  await writeJson(file, { token: 'secret-token', authorization: 'Bearer abc',
    url: 'https://example.test/file?X-Amz-Signature=abc&Credential=def', safe: 'value' });
  const written = await fs.readFile(file, 'utf8');
  assert.doesNotMatch(written, /secret-token|Bearer abc|Signature=abc|Credential=def/);
  assert.match(written, /\[REDACTED\]/);
  assert.equal(redact({ token: 'secret' }).token, '[REDACTED]');
  assert.equal(redactRollout({ cmsTokenId: 5, tokenId: 5 }).cmsTokenId, 5);
  assert.equal(redactRollout({ cmsTokenId: 5, tokenId: 5 }).tokenId, 5);
});

test('offline plan mode performs no fetch and writes only deterministic plan targets', async (t) => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'cms-img-3-plan-'));
  t.after(() => fs.rm(temp, { recursive: true, force: true }));
  const paths = {
    ...DEFAULT_PATHS,
    planJson: path.join(temp, 'plan.json'),
    planMarkdown: path.join(temp, 'plan.md'),
    runtime: path.join(temp, 'runtime'),
  };
  let fetchCalls = 0;
  const result = await main({ argv: ['plan'], paths, env: { WEBFLOW_API_TOKEN: 'must-not-be-read' }, fetchImpl: async () => {
    fetchCalls += 1;
    throw new Error('fetch must not run');
  } });
  assert.equal(result.externalWritesPerformed, 0);
  assert.equal(fetchCalls, 0);
  assert.equal((await fs.stat(paths.planJson)).isFile(), true);
  assert.equal((await fs.stat(paths.planMarkdown)).isFile(), true);
  await assert.rejects(fs.stat(paths.runtime), /ENOENT/);
});

test('offline HEN plan/status modes perform no fetch and never touch CMS-IMG-3 runtime state', async (t) => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'cms-img-4-plan-'));
  t.after(() => fs.rm(temp, { recursive: true, force: true }));
  const paths = {
    ...DEFAULT_PATHS,
    henPlanJson: path.join(temp, 'hen-plan.json'),
    henPlanMarkdown: path.join(temp, 'hen-plan.md'),
    runtime: path.join(temp, 'cms-img-3-runtime-must-not-exist'),
  };
  let fetchCalls = 0;
  const fetchImpl = async () => {
    fetchCalls += 1;
    throw new Error('fetch must not run');
  };
  const planned = await main({ argv: ['hen-plan', 'testnet'], paths,
    env: { WEBFLOW_API_TOKEN: 'must-not-be-read' }, fetchImpl });
  const status = await main({ argv: ['hen-status'], paths,
    env: { WEBFLOW_API_TOKEN: 'must-not-be-read' }, fetchImpl });
  assert.equal(planned.externalWritesPerformed, 0);
  assert.equal(status.externalWritesPerformed, 0);
  assert.equal(status.status.cmsImg3RuntimeStateConsumed, false);
  assert.equal(fetchCalls, 0);
  assert.equal((await fs.stat(paths.henPlanJson)).isFile(), true);
  assert.equal((await fs.stat(paths.henPlanMarkdown)).isFile(), true);
  await assert.rejects(fs.stat(paths.runtime), /ENOENT/);
});

test('generated HEN plan is deterministic across repeated offline generations', async (t) => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'cms-img-4-deterministic-'));
  t.after(() => fs.rm(temp, { recursive: true, force: true }));
  const paths = { ...DEFAULT_PATHS, henPlanJson: path.join(temp, 'plan.json'), henPlanMarkdown: path.join(temp, 'plan.md') };
  await generateHenPlan({ network: 'testnet', paths });
  const first = [await fs.readFile(paths.henPlanJson, 'utf8'), await fs.readFile(paths.henPlanMarkdown, 'utf8')];
  await generateHenPlan({ network: 'testnet', paths });
  const second = [await fs.readFile(paths.henPlanJson, 'utf8'), await fs.readFile(paths.henPlanMarkdown, 'utf8')];
  assert.deepEqual(second, first);
});

test('generated plan is deterministic across repeated offline generations', async (t) => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'cms-img-3-deterministic-'));
  t.after(() => fs.rm(temp, { recursive: true, force: true }));
  const paths = { ...DEFAULT_PATHS, planJson: path.join(temp, 'plan.json'), planMarkdown: path.join(temp, 'plan.md') };
  await generatePlan(paths);
  const first = [await fs.readFile(paths.planJson, 'utf8'), await fs.readFile(paths.planMarkdown, 'utf8')];
  await generatePlan(paths);
  const second = [await fs.readFile(paths.planJson, 'utf8'), await fs.readFile(paths.planMarkdown, 'utf8')];
  assert.deepEqual(second, first);
});
