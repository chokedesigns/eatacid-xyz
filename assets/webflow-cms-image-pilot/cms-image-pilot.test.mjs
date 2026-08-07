import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import sharp from 'sharp';

import {
  DEFAULT_PATHS,
  PUBLISH_CONFIRMATION,
  PilotError,
  TARGET,
  WebflowClient,
  applyStaged,
  assetFilename,
  compareImageContent,
  compareTarget,
  digest,
  downloadImage,
  dryRun,
  evaluatePreflight,
  exactRollback,
  isPublishEligible,
  main,
  reconcile,
  reconcilePublished,
  redact,
  uploadBinary,
  validateLocalImage,
  verifyPublicRoute,
  verifyStagedChange,
} from './cms-image-pilot.mjs';

const clone = (value) => structuredClone(value);
const response = (value, status = 200, headers = {}) => new Response(
  typeof value === 'string' || value instanceof Uint8Array ? value : JSON.stringify(value),
  { status, headers: { ...(typeof value === 'object' ? { 'content-type': 'application/json' } : {}), ...headers } }
);
function targetItem(overrides = {}) {
  const base = {
    id: TARGET.itemId,
    cmsLocaleId: TARGET.localeId,
    isDraft: false,
    isArchived: false,
    createdOn: '2024-01-12T22:35:09.987Z',
    lastUpdated: '2026-08-04T00:00:00.000Z',
    lastPublished: '2026-08-04T00:00:00.000Z',
    fieldData: {
      name: TARGET.name,
      slug: TARGET.slug,
      'token-id': TARGET.tokenId,
      title: TARGET.name,
      image: clone(TARGET.oldImage),
      collection: 'CANAAN',
      editions: 10,
    },
  };
  return { ...base, ...overrides, fieldData: { ...base.fieldData, ...overrides.fieldData } };
}
function mapping() {
  return [{
    cmsItemId: TARGET.itemId,
    collectionId: TARGET.collectionId,
    cmsTokenId: TARGET.tokenId,
    cmsItemName: TARGET.name,
    cmsSlug: TARGET.slug,
    cmsLocaleId: TARGET.localeId,
    localApprovedJpegPath: TARGET.localPath,
  }];
}
function preflightArgs(overrides = {}) {
  const stagedItems = overrides.stagedItems ?? [targetItem()];
  return {
    stagedItems,
    liveItems: overrides.liveItems ?? clone(stagedItems),
    collection: overrides.collection ?? { id: TARGET.collectionId, displayName: 'CANAANs', singularName: 'CANAAN' },
    mappingEntries: overrides.mappingEntries ?? mapping(),
    dropParams: overrides.dropParams ?? { redeemToken: { collection: 'CANAAN', tokenId: '29' } },
  };
}
async function tempRuntime(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'cms-img-2-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  return root;
}
const state = (items) => ({ items: clone(items), pagination: { total: items.length, limit: 100, offset: 0 } });
function verifiedJournal(image, overrides = {}) {
  return {
    ticket: TARGET.ticket, siteId: TARGET.siteId, collectionId: TARGET.collectionId,
    itemId: TARGET.itemId, tokenId: TARGET.tokenId, localPath: TARGET.localPath,
    currentPhase: 'staged-verified', lastSuccessfulPhase: 'staged-verified', reconciliationRequired: false,
    timestamps: { created: '2026-08-06T00:00:00.000Z', updated: '2026-08-06T00:00:00.000Z' },
    beforeImage: TARGET.oldImage, beforeHostedImageHash: 'old-hash', localReplacementHash: { sha256: 'new-hash' },
    uploadedAssetId: 'uploaded-asset-id', uploadedAssetUrl: 'https://assets.example.test/replacement.jpg',
    stagedPatchResult: {}, stagedVerificationResult: { ok: true, image, comparison: { ok: true } },
    publishResult: null, liveVerificationResult: null, rollbackStatus: 'not-started',
    errors: [], attempts: [], blockedAttempts: [], lastAttempt: null, lastAttemptStatus: null,
    retryCount: 0, finalState: 'awaiting-publish-approval',
    ...overrides,
  };
}
async function writeRuntimeJson(runtime, name, value) {
  await fs.writeFile(path.join(runtime, name), `${JSON.stringify(value, null, 2)}\n`);
}
async function localBytes() {
  return fs.readFile(DEFAULT_PATHS.localImage);
}
function readOnlyApi({ staged = [targetItem()], live = clone(staged), assets = [] } = {}) {
  const calls = [];
  return {
    calls,
    getCollection: async () => { calls.push('getCollection'); return { id: TARGET.collectionId, displayName: 'CANAANs', singularName: 'CANAAN' }; },
    listItems: async (type) => { calls.push(`listItems:${type}`); return { items: clone(type === 'live' ? live : staged), pagination: { total: 1 } }; },
    listAssets: async () => { calls.push('listAssets'); return clone(assets); },
    createAsset: async () => assert.fail('dry-run must not create an asset'),
    patchImage: async () => assert.fail('dry-run must not patch CMS'),
    publishOne: async () => assert.fail('dry-run must not publish'),
  };
}
function imageAndRouteFetch(bytes, hostedUrl = null) {
  return async (url) => {
    if (url === TARGET.route) return response(`<html>${TARGET.oldImage.url}</html>`);
    if (url === TARGET.oldImage.url || url === hostedUrl) return response(bytes);
    return response('not found', 404);
  };
}

function unrelatedItem(overrides = {}) {
  const base = {
    id: 'unrelated-item', cmsLocaleId: TARGET.localeId, isDraft: false, isArchived: false,
    createdOn: '2024-01-01T00:00:00.000Z', lastUpdated: '2024-01-01T00:00:00.000Z',
    lastPublished: '2024-01-01T00:00:00.000Z',
    fieldData: { name: 'OTHER', slug: 'other', 'token-id': 2, title: 'OTHER',
      image: { fileId: 'other-image', url: 'https://cdn.example.test/other.jpg', alt: null },
      collection: 'CANAAN', editions: 10 },
  };
  return { ...base, ...overrides, fieldData: { ...base.fieldData, ...overrides.fieldData } };
}

async function reconcileFixture(t, overrides = {}) {
  const runtime = await tempRuntime(t);
  const replacementBytes = await localBytes();
  const originalBytes = await sharp({
    create: { width: 300, height: 375, channels: 3, background: { r: 12, g: 34, b: 56 } },
  }).jpeg({ quality: 90 }).toBuffer();
  const replacementImage = { fileId: 'cms-replacement-id', url: 'https://cdn.example.test/replacement.jpeg', alt: null };
  const originalImage = clone(TARGET.oldImage);
  const other = unrelatedItem();
  const beforeStaged = state([targetItem({ fieldData: { image: originalImage } }), other]);
  const beforeLive = clone(beforeStaged);
  const stagedItems = overrides.stagedItems ?? [
    targetItem({ fieldData: { image: replacementImage, ...(overrides.targetNonImageDrift ? { title: 'DRIFT' } : {}) } }),
    overrides.unrelatedDrift ? unrelatedItem({ fieldData: { title: 'DRIFT' } }) : clone(other),
  ];
  const liveItems = overrides.liveItems ?? [
    targetItem({ fieldData: { image: overrides.liveReplacement ? replacementImage : originalImage } }),
    clone(other),
  ];
  const publishedLiveItems = [targetItem({
    lastPublished: '2026-08-06T23:19:41.000Z', fieldData: { image: replacementImage },
  }), clone(other)];
  const journal = verifiedJournal(replacementImage, overrides.journal ?? {});
  await Promise.all([
    writeRuntimeJson(runtime, 'before.staged.json', beforeStaged),
    writeRuntimeJson(runtime, 'before.live.json', beforeLive),
    writeRuntimeJson(runtime, 'after.staged.json', state(stagedItems)),
    writeRuntimeJson(runtime, 'journal.json', journal),
    fs.writeFile(path.join(runtime, 'before-image.bin'), originalBytes),
  ]);
  const calls = [];
  let publishAttempted = false;
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url, method: options.method ?? 'GET' });
    if (url.includes(`/collections/${TARGET.collectionId}/items/live?`)) {
      if (overrides.failReadsAfterPublish && publishAttempted) return response({ message: 'read failed' }, 500);
      return response(state(overrides.applyPublishOnSuccess && publishAttempted ? publishedLiveItems : liveItems));
    }
    if (url.includes(`/collections/${TARGET.collectionId}/items?`)) {
      if (overrides.failReadsAfterPublish && publishAttempted) return response({ message: 'read failed' }, 500);
      return response(state(stagedItems));
    }
    if (url.endsWith(`/collections/${TARGET.collectionId}/items/publish`)) {
      publishAttempted = true;
      return response({ message: 'unknown publish failure' }, overrides.publishStatus ?? 500);
    }
    if (url === replacementImage.url) return response(overrides.replacementContent ??
      (overrides.stagedContent === 'original' ? originalBytes : replacementBytes),
      200, { 'content-type': 'image/jpeg' });
    if (url === originalImage.url) return response(overrides.liveContent === 'replacement' ? replacementBytes : originalBytes,
      200, { 'content-type': 'image/jpeg' });
    if (url === TARGET.route) return response('route response', overrides.routeStatus ?? 200,
      { 'content-type': 'text/html' });
    return response('not found', 404);
  };
  return { runtime, paths: { ...DEFAULT_PATHS, runtime }, replacementBytes, originalBytes,
    replacementImage, originalImage, stagedItems, liveItems, journal, calls, fetchImpl };
}

test('correct target constants are immutably constrained', () => {
  assert.deepEqual(
    { site: TARGET.siteId, collection: TARGET.collectionId, item: TARGET.itemId, token: TARGET.tokenId, path: TARGET.localPath },
    { site: '656cf42faa2b1a7a1582d9d2', collection: '65a1be9dcae2314a8ac50aae', item: '65a1bf3dc64d193880da0093', token: 1, path: 'admin-ui/src/thumbs/canaan/1.jpg' }
  );
  assert.equal(assetFilename('bdc5527224ff0000'), 'canaan-1-i-am-bicycle-300w-bdc5527224ff.jpg');
  assert.equal(Object.isFrozen(TARGET), true);
});

test('dry-run performs all reads and no Webflow writes', async (t) => {
  const runtime = await tempRuntime(t);
  const api = readOnlyApi();
  const bytes = await localBytes();
  const result = await dryRun({
    api,
    paths: { ...DEFAULT_PATHS, runtime },
    fetchImpl: imageAndRouteFetch(bytes),
  });
  assert.equal(result.local.sha256, 'bdc5527224ff0926202ddbd8696f756bfc9289ade76d577754a9651933a948f9');
  assert.deepEqual(api.calls, ['getCollection', 'listItems:staged', 'listItems:live', 'listAssets']);
  assert.equal((await fs.readFile(path.join(runtime, 'before-image.bin'))).length, bytes.length);
});

test('dry-run accepts visually restored staged state under a normalized CMS Image object', async (t) => {
  const runtime = await tempRuntime(t);
  const bytes = await localBytes();
  const normalizedOldImage = { fileId: 'rollback-cms-file-id', url: 'https://cdn.example.test/restored-original.jpeg', alt: null };
  const api = readOnlyApi({
    staged: [targetItem({ fieldData: { image: normalizedOldImage } })],
    live: [targetItem()],
  });
  const result = await dryRun({
    api,
    paths: { ...DEFAULT_PATHS, runtime },
    fetchImpl: imageAndRouteFetch(bytes, normalizedOldImage.url),
  });
  assert.equal(result.stagedImageVerification.ok, true);
  assert.equal(result.stagedImageVerification.normalization.fileIdChanged, true);
  assert.equal(result.stagedImageVerification.normalization.resultingExtension, '.jpeg');
});

test('preflight rejects identity mismatch', () => {
  assert.throws(() => evaluatePreflight(preflightArgs({ stagedItems: [targetItem({ fieldData: { name: 'WRONG' } })],
    liveItems: [targetItem({ fieldData: { name: 'WRONG' } })] })), /identity mismatch/);
});

test('preflight rejects staged/live drift', () => {
  assert.throws(() => evaluatePreflight(preflightArgs({ liveItems: [targetItem({ fieldData: { title: 'DRIFT' } })] })), /drift/);
});

test('preflight rejects active-token conflict', () => {
  assert.throws(() => evaluatePreflight(preflightArgs({
    dropParams: { redeemToken: { collection: 'CANAAN', tokenId: '1' } },
  })), /active redeem token/);
});

test('local image validation rejects undecodable input', async (t) => {
  const runtime = await tempRuntime(t);
  const bad = path.join(runtime, 'bad.jpg');
  await fs.writeFile(bad, 'not an image');
  await assert.rejects(validateLocalImage(bad), /cannot be decoded/);
});

test('old image download failure blocks preflight', async () => {
  await assert.rejects(downloadImage(TARGET.oldImage.url, async () => response('missing', 404)), /HTTP 404/);
});

test('successful asset multipart upload includes every presigned field and exact bytes', async () => {
  const bytes = await localBytes();
  let observed;
  const result = await uploadBinary({
    metadata: {
      uploadUrl: 'https://example.test/presigned?X-Amz-Signature=secret',
      uploadDetails: { key: 'site/asset_file.jpg', Policy: 'secret-policy', success_action_status: '201' },
      contentType: 'image/jpeg', originalFileName: 'pilot.jpg',
    },
    local: { bytes },
    fetchImpl: async (url, options) => { observed = { url, options }; return response('', 201); },
  });
  assert.equal(result.status, 201);
  assert.equal(observed.options.method, 'POST');
  assert.equal(observed.options.body.get('key'), 'site/asset_file.jpg');
  assert.equal(observed.options.body.get('Policy'), 'secret-policy');
  assert.equal(observed.options.body.get('file').size, bytes.length);
});

test('asset upload success followed by CMS patch failure does not retry the write', async () => {
  const calls = [];
  const client = new WebflowClient({
    token: 'test-token',
    fetchImpl: async (url, options) => {
      calls.push({ url, method: options.method, body: options.body });
      return response({ message: 'patch rejected' }, 500);
    },
  });
  await assert.rejects(client.patchImage({ fileId: 'new', url: 'https://example.test/new.jpg', alt: null }), /HTTP 500/);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, 'PATCH');
});

test('staged patch request changes only Image and uses skipInvalidFiles=false', async () => {
  let request;
  const client = new WebflowClient({
    token: 'test-token',
    fetchImpl: async (url, options) => { request = { url, options }; return response({ ok: true }); },
  });
  const image = { fileId: 'new-asset', url: 'https://example.test/new.jpg', alt: null };
  await client.patchImage(image);
  assert.match(request.url, /skipInvalidFiles=false$/);
  assert.deepEqual(JSON.parse(request.options.body), {
    items: [{ id: TARGET.itemId, cmsLocaleId: TARGET.localeId, fieldData: { image } }],
  });
});

test('unexpected non-image change aborts staged verification', () => {
  const beforeStaged = { items: [targetItem()] };
  const beforeLive = clone(beforeStaged);
  const newImage = { fileId: 'new', url: 'https://example.test/new.jpg', alt: null };
  const after = { items: [targetItem({ fieldData: { image: newImage, title: 'UNEXPECTED' } })] };
  const result = verifyStagedChange(beforeStaged, beforeLive, after, beforeLive, {
    source: { bytes: Buffer.from('unused') },
    fetchImpl: async () => response('not an image'),
    submittedImage: newImage,
  });
  return result.then((verification) => {
    assert.equal(verification.ok, false);
    assert.deepEqual(verification.target.nonImageDifferences, ['fieldData.title']);
  });
});

test('staged verification accepts a Webflow CMS fileId and jpg-to-jpeg URL normalization', async () => {
  const sourceBytes = await localBytes();
  const reencodedBytes = await sharp(sourceBytes).jpeg({ quality: 80 }).toBuffer();
  const submittedImage = { fileId: 'uploaded-asset-id', url: 'https://assets.example.test/replacement.jpg', alt: null };
  const resultingImage = { fileId: 'webflow-cms-file-id', url: 'https://cdn.example.test/imported-replacement.jpeg', alt: null };
  const beforeStaged = { items: [targetItem()] };
  const beforeLive = clone(beforeStaged);
  const staged = { items: [targetItem({ fieldData: { image: resultingImage } })] };
  const result = await verifyStagedChange(beforeStaged, beforeLive, staged, beforeLive, {
    source: { bytes: sourceBytes, sha256: digest(sourceBytes, 'sha256') },
    fetchImpl: async (url) => url === resultingImage.url ? response(reencodedBytes) : response('not found', 404),
    submittedImage,
  });
  assert.equal(result.ok, true);
  assert.equal(result.target.imageVerification.retrievable, true);
  assert.equal(result.target.imageVerification.normalization.fileIdChanged, true);
  assert.equal(result.target.imageVerification.normalization.submittedExtension, '.jpg');
  assert.equal(result.target.imageVerification.normalization.resultingExtension, '.jpeg');
  assert.equal(result.target.imageVerification.content.byteExact, false);
  assert.equal(result.target.imageVerification.content.perceptuallyEquivalent, true);
  assert.deepEqual(result.target.imageVerification.content.actual, { format: 'jpeg', width: 300, height: 375 });
});

test('content equivalence rejects different dimensions', async () => {
  const sourceBytes = await localBytes();
  const resizedBytes = await sharp(sourceBytes).resize(150, 188).jpeg().toBuffer();
  const comparison = await compareImageContent(sourceBytes, resizedBytes);
  assert.equal(comparison.ok, false);
  assert.equal(comparison.dimensionsMatch, false);
});

test('publish payload contains exactly one approved item ID', async () => {
  let body;
  const client = new WebflowClient({
    token: 'test-token',
    fetchImpl: async (url, options) => { body = JSON.parse(options.body); return response({ published: true }); },
  });
  await client.publishOne();
  assert.deepEqual(body, { itemIds: [TARGET.itemId] });
});

test('rollback sends the exact historical Image object only', async () => {
  let body;
  const client = new WebflowClient({
    token: 'test-token',
    fetchImpl: async (url, options) => { body = JSON.parse(options.body); return response({ ok: true }); },
  });
  await client.patchImage(TARGET.oldImage);
  assert.deepEqual(body.items[0].fieldData, { image: TARGET.oldImage });
  assert.deepEqual(Object.keys(body.items[0]).sort(), ['cmsLocaleId', 'fieldData', 'id']);
});

test('legacy fileId rejection records cached-byte fallback as approval-required', async (t) => {
  const runtime = await tempRuntime(t);
  const api = { patchImage: async () => { throw new PilotError('legacy rejected', { status: 400 }); } };
  await assert.rejects(exactRollback({
    api, beforeStaged: { items: [targetItem()] }, beforeLive: { items: [targetItem()] },
    paths: { ...DEFAULT_PATHS, runtime }, logger: async () => {},
  }), (error) => error.code === 'LEGACY_FILE_ID_ROLLBACK_FAILED');
  const rollback = JSON.parse(await fs.readFile(path.join(runtime, 'rollback.json'), 'utf8'));
  assert.equal(rollback.fallbackRequiresExplicitApproval, true);
  assert.deepEqual(rollback.oldImage, TARGET.oldImage);
});

test('rollback verification accepts original artwork imported under a new CMS fileId', async (t) => {
  const runtime = await tempRuntime(t);
  const sourceBytes = await localBytes();
  await fs.writeFile(path.join(runtime, 'before-image.bin'), sourceBytes);
  const resultingImage = { fileId: 'rollback-cms-file-id', url: 'https://cdn.example.test/restored-original.jpeg', alt: null };
  let staged = [targetItem({ fieldData: { image: { fileId: 'replacement-cms-file-id', url: 'https://cdn.example.test/replacement.jpeg', alt: null } } })];
  const live = [targetItem()];
  let submitted;
  const api = {
    patchImage: async (image) => { submitted = image; staged = [targetItem({ fieldData: { image: resultingImage } })]; return { ok: true }; },
    listItems: async (type) => ({ items: clone(type === 'live' ? live : staged) }),
  };
  const rollback = await exactRollback({
    api,
    beforeStaged: { items: [targetItem()] },
    expectedLive: { items: live },
    paths: { ...DEFAULT_PATHS, runtime },
    fetchImpl: async (url) => url === resultingImage.url ? response(sourceBytes) : response('not found', 404),
    logger: async () => {},
  });
  assert.deepEqual(submitted, TARGET.oldImage);
  assert.equal(rollback.status, 'staged-restored');
  assert.equal(rollback.resultingImage.fileId, 'rollback-cms-file-id');
  assert.equal(rollback.check.target.imageVerification.normalization.fileIdChanged, true);
  assert.equal(rollback.check.target.imageVerification.normalization.resultingExtension, '.jpeg');
});

test('resume after unknown patch outcome rereads state and avoids duplicate upload', async (t) => {
  const runtime = await tempRuntime(t);
  const bytes = await localBytes();
  const sha256 = digest(bytes, 'sha256');
  const filename = assetFilename(sha256);
  const hostedUrl = 'https://example.test/new.jpg';
  const asset = { id: 'new-asset-id', siteId: TARGET.siteId, originalFileName: filename, hostedUrl };
  let staged = [targetItem()];
  let patchCalls = 0;
  const api = readOnlyApi({ staged, live: [targetItem()], assets: [asset] });
  api.listItems = async (type) => ({ items: clone(type === 'live' ? [targetItem()] : staged), pagination: { total: 1 } });
  api.getAsset = async () => clone(asset);
  api.createAsset = async () => assert.fail('existing verified asset must be reused');
  api.patchImage = async (image) => {
    patchCalls += 1;
    staged = [targetItem({ fieldData: { image } })];
    throw new Error('connection lost after accepted patch');
  };
  const paths = { ...DEFAULT_PATHS, runtime };
  const fetchImpl = imageAndRouteFetch(bytes, hostedUrl);
  await dryRun({ api, paths, fetchImpl });
  const result = await applyStaged({ api, paths, fetchImpl });
  assert.equal(result.patchResult.outcomeRecoveredByReread, true);
  assert.equal(patchCalls, 1);
  assert.equal(result.newImage.fileId, asset.id);
  api.patchImage = async () => assert.fail('resume must not repatch an observed successful state');
  const resumed = await applyStaged({ api, paths, fetchImpl });
  assert.equal(resumed.patchResult.outcomeRecoveredByResumeReread, true);
  assert.equal(patchCalls, 1);
});

test('tokens and presigned values are redacted from structured logs', () => {
  const value = redact({
    Authorization: 'Bearer real-token',
    uploadUrl: 'https://s3.test/x?X-Amz-Signature=secret&Policy=also-secret',
    uploadDetails: { 'X-Amz-Credential': 'credential', Policy: 'policy', safe: 'visible' },
    message: 'Authorization: Bearer abc.def',
  });
  assert.equal(value.Authorization, '[REDACTED]');
  assert.equal(value.uploadUrl, '[REDACTED]');
  assert.equal(value.uploadDetails['X-Amz-Credential'], '[REDACTED]');
  assert.equal(value.uploadDetails.Policy, '[REDACTED]');
  assert.doesNotMatch(JSON.stringify(value), /real-token|secret|credential|policy|abc\.def/);
});

test('compareTarget allows timestamps but preserves title, flags, locale, and all other fields', () => {
  const before = targetItem();
  const image = { fileId: 'new', url: 'https://example.test/new.jpg', alt: null };
  const after = targetItem({ lastUpdated: '2026-08-05T00:00:00.000Z', fieldData: { image } });
  assert.equal(compareTarget(before, after, { ok: true, image }).ok, true);
});

test('publish missing confirmation preserves staged-verified and records a blocked attempt', async (t) => {
  const runtime = await tempRuntime(t);
  const image = { fileId: 'cms-replacement-id', url: 'https://cdn.example.test/replacement.jpeg', alt: null };
  await writeRuntimeJson(runtime, 'journal.json', verifiedJournal(image));
  let requests = 0;
  await assert.rejects(main({
    argv: ['publish'], env: { WEBFLOW_API_TOKEN: 'test-token' }, paths: { ...DEFAULT_PATHS, runtime },
    fetchImpl: async () => { requests += 1; return response('unexpected', 500); },
  }), /confirmation/);
  const journal = JSON.parse(await fs.readFile(path.join(runtime, 'journal.json'), 'utf8'));
  assert.equal(requests, 0);
  assert.equal(journal.currentPhase, 'staged-verified');
  assert.equal(journal.lastSuccessfulPhase, 'staged-verified');
  assert.equal(journal.reconciliationRequired, false);
  assert.equal(journal.lastAttemptStatus, 'blocked');
  assert.equal(journal.blockedAttempts.length, 1);
  assert.equal(journal.errors.length, 1);
  assert.equal(isPublishEligible(journal), true);
});

test('successful apply-staged recovery records staged-verified as the durable phase', async (t) => {
  const runtime = await tempRuntime(t);
  const bytes = await localBytes();
  const sha256 = digest(bytes, 'sha256');
  const hostedUrl = 'https://assets.example.test/replacement.jpg';
  const submittedImage = { fileId: 'uploaded-asset-id', url: hostedUrl, alt: null };
  const asset = { id: submittedImage.fileId, siteId: TARGET.siteId,
    originalFileName: assetFilename(sha256), displayName: assetFilename(sha256), hostedUrl };
  const beforeStaged = state([targetItem()]);
  const beforeLive = clone(beforeStaged);
  const staged = state([targetItem({ fieldData: { image: submittedImage } })]);
  await Promise.all([
    writeRuntimeJson(runtime, 'journal.json', verifiedJournal(submittedImage, {
      currentPhase: 'apply-staged-started', lastSuccessfulPhase: 'dry-run-ready',
      stagedVerificationResult: null,
    })),
    writeRuntimeJson(runtime, 'before.staged.json', beforeStaged),
    writeRuntimeJson(runtime, 'before.live.json', beforeLive),
    writeRuntimeJson(runtime, 'uploaded-asset.json', asset),
  ]);
  const fetchImpl = async (url, options = {}) => {
    if (url.includes(`/collections/${TARGET.collectionId}/items/live?`)) return response(beforeLive);
    if (url.includes(`/collections/${TARGET.collectionId}/items?`)) return response(staged);
    if (url.endsWith(`/assets/${asset.id}`)) return response(asset);
    if (url === hostedUrl) return response(bytes, 200, { 'content-type': 'image/jpeg' });
    if (options.method === 'PATCH' || options.method === 'POST') assert.fail('recovered apply must not write');
    return response('not found', 404);
  };
  const result = await main({
    argv: ['apply-staged'], env: { WEBFLOW_API_TOKEN: 'test-token' },
    paths: { ...DEFAULT_PATHS, runtime }, fetchImpl,
  });
  assert.equal(result.journal.currentPhase, 'staged-verified');
  assert.equal(result.journal.lastSuccessfulPhase, 'staged-verified');
  assert.equal(result.journal.stagedVerificationResult.ok, true);
  assert.equal(isPublishEligible(result.journal), true);
});

test('publish authentication failure before any request preserves staged-verified', async (t) => {
  const runtime = await tempRuntime(t);
  const image = { fileId: 'cms-replacement-id', url: 'https://cdn.example.test/replacement.jpeg', alt: null };
  await writeRuntimeJson(runtime, 'journal.json', verifiedJournal(image));
  let requests = 0;
  await assert.rejects(main({
    argv: ['publish'], env: { CMS_IMG_2_PUBLISH_CONFIRM: PUBLISH_CONFIRMATION }, paths: { ...DEFAULT_PATHS, runtime },
    fetchImpl: async () => { requests += 1; return response('unexpected', 500); },
  }), /WEBFLOW_API_TOKEN/);
  const journal = JSON.parse(await fs.readFile(path.join(runtime, 'journal.json'), 'utf8'));
  assert.equal(requests, 0);
  assert.equal(journal.currentPhase, 'staged-verified');
  assert.equal(journal.lastSuccessfulPhase, 'staged-verified');
  assert.equal(journal.reconciliationRequired, false);
  assert.equal(isPublishEligible(journal), true);
});

test('repeated blocked publish attempts remain eligible and append errors without corrupting phase history', async (t) => {
  const runtime = await tempRuntime(t);
  const image = { fileId: 'cms-replacement-id', url: 'https://cdn.example.test/replacement.jpeg', alt: null };
  await writeRuntimeJson(runtime, 'journal.json', verifiedJournal(image));
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await assert.rejects(main({
      argv: ['publish'], env: { WEBFLOW_API_TOKEN: 'test-token' }, paths: { ...DEFAULT_PATHS, runtime },
      fetchImpl: async () => assert.fail('missing confirmation must not make a request'),
    }), /confirmation/);
  }
  const journal = JSON.parse(await fs.readFile(path.join(runtime, 'journal.json'), 'utf8'));
  assert.equal(journal.currentPhase, 'staged-verified');
  assert.equal(journal.lastSuccessfulPhase, 'staged-verified');
  assert.equal(journal.blockedAttempts.length, 2);
  assert.equal(journal.errors.length, 2);
  assert.equal(journal.attempts.length, 2);
  assert.equal(isPublishEligible(journal), true);
});

test('reconcile command restores publish eligibility only after full read-only verification', async (t) => {
  const fixture = await reconcileFixture(t, { journal: { currentPhase: 'publish-blocked', lastSuccessfulPhase: null } });
  const result = await main({
    argv: ['reconcile'], env: { WEBFLOW_API_TOKEN: 'test-token' }, paths: fixture.paths, fetchImpl: fixture.fetchImpl,
  });
  assert.equal(result.result.ok, true);
  assert.equal(result.journal.currentPhase, 'staged-verified');
  assert.equal(result.journal.lastSuccessfulPhase, 'staged-verified');
  assert.equal(result.journal.reconciliationRequired, false);
  assert.equal(isPublishEligible(result.journal), true);
  assert.equal(fixture.calls.every((call) => call.method === 'GET'), true);
  assert.equal(result.result.staged.target.nonImageDifferences.length, 0);
  assert.equal(result.result.staged.unrelatedStaged.ok, true);
  assert.equal(result.result.live.ok, true);
  assert.equal(result.result.liveUnrelated.ok, true);
});

test('reconciliation refuses staged or live content drift', async (t) => {
  for (const drift of [{ stagedContent: 'original' }, { liveContent: 'replacement' }]) {
    const fixture = await reconcileFixture(t, drift);
    const api = {
      listItems: async (type) => state(type === 'live' ? fixture.liveItems : fixture.stagedItems),
    };
    await assert.rejects(reconcile({ api, journal: fixture.journal, paths: fixture.paths, fetchImpl: fixture.fetchImpl }),
      /publish-eligible/);
  }
});

test('reconciliation refuses target non-image and unrelated-item drift', async (t) => {
  for (const drift of [{ targetNonImageDrift: true }, { unrelatedDrift: true }]) {
    const fixture = await reconcileFixture(t, drift);
    const api = {
      listItems: async (type) => state(type === 'live' ? fixture.liveItems : fixture.stagedItems),
    };
    await assert.rejects(reconcile({ api, journal: fixture.journal, paths: fixture.paths, fetchImpl: fixture.fetchImpl }),
      /publish-eligible/);
  }
});

test('unknown publish write outcome preserves durable history but requires reconciliation', async (t) => {
  const fixture = await reconcileFixture(t, { failReadsAfterPublish: true });
  await writeRuntimeJson(fixture.runtime, 'after.staged.json', state(fixture.stagedItems));
  await assert.rejects(main({
    argv: ['publish'],
    env: { WEBFLOW_API_TOKEN: 'test-token', CMS_IMG_2_PUBLISH_CONFIRM: PUBLISH_CONFIRMATION },
    paths: fixture.paths,
    fetchImpl: fixture.fetchImpl,
  }), /could not be reconciled/);
  const journal = JSON.parse(await fs.readFile(path.join(fixture.runtime, 'journal.json'), 'utf8'));
  assert.equal(journal.currentPhase, 'staged-verified');
  assert.equal(journal.lastSuccessfulPhase, 'staged-verified');
  assert.equal(journal.reconciliationRequired, true);
  assert.equal(journal.lastAttemptStatus, 'reconciliation-required');
  assert.equal(journal.lastAttempt.writeOutcome, 'unknown');
  assert.equal(isPublishEligible(journal), false);
  assert.equal(journal.errors.length, 1);
});

test('non-authoritative route 404 is recorded separately and is not a publish hard failure', async () => {
  const result = await verifyPublicRoute({
    fetchImpl: async () => response('missing', 404),
    policy: { url: TARGET.route, authoritative: false, directRouteExists: null,
      maxAttempts: 3, retryDelaysMs: [1, 1], evidence: 'test' },
    sleep: async () => {},
  });
  assert.equal(result.classification, 'route-not-authoritative-publish-signal');
  assert.equal(result.hardFailure, false);
  assert.equal(result.attempts.length, 3);
});

test('route policy can record that no authoritative Collection Page exists', async () => {
  const result = await verifyPublicRoute({
    fetchImpl: async () => response('missing', 404),
    policy: { url: TARGET.route, authoritative: false, directRouteExists: false,
      maxAttempts: 1, retryDelaysMs: [], evidence: 'no direct route' },
  });
  assert.equal(result.classification, 'no-direct-public-route-exists');
  assert.equal(result.hardFailure, false);
});

test('public route can succeed after bounded propagation retry', async () => {
  let calls = 0;
  const result = await verifyPublicRoute({
    fetchImpl: async () => response(calls++ === 0 ? 'missing' : 'ready', calls === 1 ? 404 : 200),
    policy: { url: TARGET.route, authoritative: true, directRouteExists: true,
      maxAttempts: 3, retryDelaysMs: [1, 1], evidence: 'authoritative route' },
    sleep: async () => {},
  });
  assert.equal(result.classification, 'confirmed-and-passed');
  assert.equal(result.recoveredAfterRetry, true);
  assert.equal(result.attempts.length, 2);
});

test('confirmed authoritative route remaining 404 is a hard failure', async () => {
  const result = await verifyPublicRoute({
    fetchImpl: async () => response('missing', 404),
    policy: { url: TARGET.route, authoritative: true, directRouteExists: true,
      maxAttempts: 2, retryDelaysMs: [1], evidence: 'authoritative route' },
    sleep: async () => {},
  });
  assert.equal(result.classification, 'confirmed-and-failed');
  assert.equal(result.hardFailure, true);
});

test('successful publish is live-CMS verified even when a non-authoritative route returns 404', async (t) => {
  const fixture = await reconcileFixture(t, {
    publishStatus: 200, applyPublishOnSuccess: true, routeStatus: 404,
  });
  const result = await main({
    argv: ['publish'],
    env: { WEBFLOW_API_TOKEN: 'test-token', CMS_IMG_2_PUBLISH_CONFIRM: PUBLISH_CONFIRMATION },
    paths: fixture.paths,
    fetchImpl: fixture.fetchImpl,
  });
  assert.equal(result.journal.currentPhase, 'published-verified');
  assert.equal(result.journal.liveVerificationResult.ok, true);
  assert.equal(result.result.publicVerification.classification, 'route-not-authoritative-publish-signal');
  assert.equal(fixture.calls.filter((call) => call.method === 'POST').length, 1);
});

test('post-publish reconciliation verifies byte-exact staged and live replacement content', async (t) => {
  const fixture = await reconcileFixture(t, { liveReplacement: true });
  const api = { listItems: async (type) => state(type === 'live' ? fixture.liveItems : fixture.stagedItems) };
  const result = await reconcilePublished({
    api, journal: fixture.journal, paths: fixture.paths, fetchImpl: fixture.fetchImpl,
    sleep: async () => {},
  });
  assert.equal(result.cmsVerified, true);
  assert.equal(result.staged.imageVerification.content.byteExact, true);
  assert.equal(result.live.imageVerification.content.byteExact, true);
  assert.equal(result.cmsWritesPerformed, 0);
  assert.equal(result.publishRequestsPerformed, 0);
});

test('post-publish reconciliation accepts strict decoded equivalence after Webflow JPEG normalization', async (t) => {
  const source = await localBytes();
  const reencoded = await sharp(source).jpeg({ quality: 80 }).toBuffer();
  const fixture = await reconcileFixture(t, { liveReplacement: true, replacementContent: reencoded });
  const api = { listItems: async (type) => state(type === 'live' ? fixture.liveItems : fixture.stagedItems) };
  const result = await reconcilePublished({ api, journal: fixture.journal, paths: fixture.paths,
    fetchImpl: fixture.fetchImpl, sleep: async () => {} });
  assert.equal(result.live.imageVerification.content.byteExact, false);
  assert.equal(result.live.imageVerification.content.perceptuallyEquivalent, true);
  assert.deepEqual(result.live.imageVerification.content.actual, { format: 'jpeg', width: 300, height: 375 });
});

test('post-publish reconciliation refuses original or mixed live image state', async (t) => {
  const fixture = await reconcileFixture(t);
  const api = { listItems: async (type) => state(type === 'live' ? fixture.liveItems : fixture.stagedItems) };
  await assert.rejects(reconcilePublished({ api, journal: fixture.journal, paths: fixture.paths,
    fetchImpl: fixture.fetchImpl, sleep: async () => {} }), /did not conclusively verify/);
});

test('post-publish reconciliation refuses target non-image and unrelated CANAAN drift', async (t) => {
  for (const drift of [{ liveReplacement: true, targetNonImageDrift: true },
    { liveReplacement: true, unrelatedDrift: true }]) {
    const fixture = await reconcileFixture(t, drift);
    const api = { listItems: async (type) => state(type === 'live' ? fixture.liveItems : fixture.stagedItems) };
    await assert.rejects(reconcilePublished({ api, journal: fixture.journal, paths: fixture.paths,
      fetchImpl: fixture.fetchImpl, sleep: async () => {} }), /did not conclusively verify/);
  }
});

test('post-publish reconciliation repairs the journal read-only, preserves history, and is idempotent', async (t) => {
  const priorAttempt = { id: 'prior-route-404', mode: 'publish', status: 'reconciliation-required',
    writeAttempted: true, writeOutcome: 'applied-unverified', error: { message: 'Public route failed with HTTP 404.' } };
  const fixture = await reconcileFixture(t, { liveReplacement: true, journal: {
    reconciliationRequired: true, finalState: 'reconciliation-required',
    attempts: [priorAttempt], blockedAttempts: [priorAttempt], errors: [priorAttempt.error],
  } });
  const first = await main({ argv: ['reconcile-published'], env: { WEBFLOW_API_TOKEN: 'test-token' },
    paths: fixture.paths, fetchImpl: fixture.fetchImpl });
  const second = await main({ argv: ['reconcile-published'], env: { WEBFLOW_API_TOKEN: 'test-token' },
    paths: fixture.paths, fetchImpl: fixture.fetchImpl });
  assert.equal(second.journal.currentPhase, 'published-verified');
  assert.equal(second.journal.lastSuccessfulPhase, 'published-verified');
  assert.equal(second.journal.reconciliationRequired, false);
  assert.equal(second.journal.publishResult.status, 'successful-proven-through-live-cms-state');
  assert.equal(second.journal.publishResult.additionalPublishRequestPerformed, false);
  assert.equal(second.journal.attempts.length, 3);
  assert.equal(second.journal.blockedAttempts.length, 1);
  assert.equal(second.journal.errors.length, 1);
  assert.equal(fixture.calls.every((call) => call.method === 'GET'), true);
  assert.equal(first.result.ok, true);
  assert.equal(second.result.ok, true);
});

test('unknown post-publish CMS state cannot clear reconciliationRequired', async (t) => {
  const fixture = await reconcileFixture(t, { journal: { reconciliationRequired: true } });
  await assert.rejects(main({ argv: ['reconcile-published'], env: { WEBFLOW_API_TOKEN: 'test-token' },
    paths: fixture.paths, fetchImpl: fixture.fetchImpl }), /did not conclusively verify/);
  const journal = JSON.parse(await fs.readFile(path.join(fixture.runtime, 'journal.json'), 'utf8'));
  assert.equal(journal.currentPhase, 'staged-verified');
  assert.equal(journal.lastSuccessfulPhase, 'staged-verified');
  assert.equal(journal.reconciliationRequired, true);
  assert.equal(journal.lastAttemptStatus, 'reconciliation-required');
});
