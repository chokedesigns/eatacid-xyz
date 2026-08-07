import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import sharp from 'sharp';

export const TARGET = Object.freeze({
  ticket: 'CMS-IMG-2',
  siteId: '656cf42faa2b1a7a1582d9d2',
  collection: 'CANAAN',
  collectionId: '65a1be9dcae2314a8ac50aae',
  itemId: '65a1bf3dc64d193880da0093',
  tokenId: 1,
  name: 'I AM BICYCLE',
  slug: 'i-am-bicycle',
  localeId: '656d1d76a2cda12f26e04687',
  localPath: 'admin-ui/src/thumbs/canaan/1.jpg',
  route: 'https://staging-eatacid-xyz.webflow.io/canaan/i-am-bicycle',
  width: 300,
  height: 375,
  expectedBytes: 43729,
  oldImage: Object.freeze({
    fileId: '65a1bf3789f7470b14f399b7',
    url: 'https://uploads-ssl.webflow.com/656d1d76a2cda12f26e04688/65a1bf3789f7470b14f399b7_01_I_Am_Bicycle_01.jpg',
    alt: null,
  }),
});

export const MODES = Object.freeze([
  'dry-run',
  'apply-staged',
  'publish',
  'verify',
  'reconcile',
  'reconcile-published',
  'rollback-staged',
  'rollback-publish',
]);
export const PUBLIC_ROUTE_POLICY = Object.freeze({
  url: TARGET.route,
  authoritative: false,
  directRouteExists: null,
  maxAttempts: 3,
  retryDelaysMs: Object.freeze([250, 750]),
  evidence: 'The CANAAN Collection Template exists in repository evidence, but its body and published route behavior are unresolved; no application link to the item route is recorded.',
});
export const PUBLISH_CONFIRMATION = `${TARGET.ticket}:PUBLISH:${TARGET.itemId}`;
export const ROLLBACK_PUBLISH_CONFIRMATION = `${TARGET.ticket}:ROLLBACK-PUBLISH:${TARGET.itemId}`;

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_PATHS = Object.freeze({
  repoRoot: path.resolve(moduleDir, '..', '..'),
  runtime: path.join(moduleDir, 'runtime'),
  mapping: path.resolve(moduleDir, '..', '..', 'docs', 'webflow-cms-image-audit', 'CMS-IMG-1.mapping.json'),
  dropParams: path.resolve(moduleDir, '..', '..', 'shared', 'drop-params', 'drop-params.js'),
  localImage: path.resolve(moduleDir, '..', '..', TARGET.localPath),
});

const SECRET_KEY = /authorization|token|secret|signature|credential|policy|x-amz-|uploadurl/i;
const RETAINED_METADATA = ['exif', 'icc', 'iptc', 'xmp', 'tifftagPhotoshop', 'comments'];
const SYSTEM_TIMESTAMPS = new Set(['lastUpdated', 'lastPublished']);
const DURABLE_PHASES = new Set([
  'dry-run-ready', 'staged-verified', 'published-verified',
  'rollback-staged-verified', 'rollback-published-verified',
]);
export const IMAGE_EQUIVALENCE_LIMITS = Object.freeze({
  maximumNormalizedMeanAbsoluteError: 0.02,
  minimumPsnr: 30,
  maximumDifferenceHashDistance: 4,
});

export class PilotError extends Error {
  constructor(message, { code = 'BLOCKED', status, details, writeOutcome = 'not-attempted' } = {}) {
    super(message);
    this.name = 'PilotError';
    this.code = code;
    this.status = status;
    this.details = details;
    this.writeOutcome = writeOutcome;
  }
}

export const digest = (bytes, algorithm) => crypto.createHash(algorithm).update(bytes).digest('hex');
export const assetFilename = (sha256) => `canaan-1-i-am-bicycle-300w-${sha256.slice(0, 12)}.jpg`;

function sortValue(value) {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortValue(value[key])]));
  }
  return value;
}
export const stable = (value) => JSON.stringify(sortValue(value));

export function redact(value, key = '') {
  if (SECRET_KEY.test(key)) return '[REDACTED]';
  if (Array.isArray(value)) return value.map((item) => redact(item));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([childKey, child]) => [childKey, redact(child, childKey)]));
  }
  if (typeof value === 'string') {
    return value
      .replace(/Bearer\s+[A-Za-z0-9._~+\/-]+=*/gi, 'Bearer [REDACTED]')
      .replace(/([?&](?:X-Amz-[^=]+|Policy|Signature|Credential)=)[^&\s]+/gi, '$1[REDACTED]');
  }
  return value;
}

export function publicError(error) {
  return redact({
    name: error?.name ?? 'Error', message: error?.message ?? String(error),
    code: error?.code, status: error?.status, details: error?.details,
    writeOutcome: error?.writeOutcome, at: new Date().toISOString(),
  });
}

async function atomicWrite(filePath, bytes) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.${process.pid}.${crypto.randomUUID()}.tmp`;
  await fs.writeFile(temporary, bytes);
  await fs.rename(temporary, filePath);
}
export const writeJson = (filePath, value) => atomicWrite(filePath, `${JSON.stringify(value, null, 2)}\n`);
const readJson = async (filePath) => JSON.parse(await fs.readFile(filePath, 'utf8'));

export function createLogger(runtime, { output = console.log } = {}) {
  return async (event, details = {}) => {
    const entry = redact({ at: new Date().toISOString(), event, details });
    await fs.mkdir(runtime, { recursive: true });
    await fs.appendFile(path.join(runtime, 'run.log'), `${JSON.stringify(entry)}\n`, { encoding: 'utf8', mode: 0o600 });
    output(`${event}${Object.keys(details).length ? ` ${JSON.stringify(redact(details))}` : ''}`);
  };
}

function initialJournal() {
  return {
    ticket: TARGET.ticket, siteId: TARGET.siteId, collectionId: TARGET.collectionId,
    itemId: TARGET.itemId, tokenId: TARGET.tokenId, localPath: TARGET.localPath,
    currentPhase: 'initialized', timestamps: { created: new Date().toISOString(), updated: new Date().toISOString() },
    lastSuccessfulPhase: null, reconciliationRequired: false,
    lastAttempt: null, lastAttemptStatus: null, attempts: [], blockedAttempts: [],
    beforeImage: null, beforeHostedImageHash: null, localReplacementHash: null,
    uploadedAssetId: null, uploadedAssetUrl: null, stagedPatchResult: null,
    stagedVerificationResult: null, publishResult: null, liveVerificationResult: null,
    rollbackStatus: 'not-started', errors: [], retryCount: 0, finalState: 'incomplete',
  };
}
export async function loadJournal(runtime) {
  try {
    const journal = await readJson(path.join(runtime, 'journal.json'));
    return {
      ...journal,
      lastSuccessfulPhase: journal.lastSuccessfulPhase ?? (DURABLE_PHASES.has(journal.currentPhase) ? journal.currentPhase : null),
      reconciliationRequired: journal.reconciliationRequired ?? false,
      lastAttempt: journal.lastAttempt ?? null,
      lastAttemptStatus: journal.lastAttemptStatus ?? null,
      attempts: journal.attempts ?? [],
      blockedAttempts: journal.blockedAttempts ?? [],
    };
  }
  catch (error) { if (error?.code === 'ENOENT') return initialJournal(); throw error; }
}
export async function updateJournal(runtime, journal, patch) {
  const next = {
    ...journal, ...patch,
    timestamps: { ...journal.timestamps, ...patch.timestamps, updated: new Date().toISOString() },
  };
  await writeJson(path.join(runtime, 'journal.json'), next);
  return next;
}

export function isPublishEligible(journal) {
  return journal.currentPhase === 'staged-verified' &&
    journal.lastSuccessfulPhase === 'staged-verified' &&
    journal.reconciliationRequired !== true &&
    journal.stagedVerificationResult?.ok === true;
}

async function responseBody(response) {
  const text = await response.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}
function retryDelay(response, attempt) {
  const header = response.headers.get('retry-after');
  if (header) {
    const seconds = Number(header);
    if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
    const date = Date.parse(header);
    if (Number.isFinite(date)) return Math.max(0, date - Date.now());
  }
  return Math.min(1000 * 2 ** attempt, 8000);
}

export class WebflowClient {
  constructor({ token, fetchImpl = fetch, sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)), onRetry = () => {} }) {
    if (!token) throw new PilotError('WEBFLOW_API_TOKEN is not set.');
    this.token = token;
    this.fetch = fetchImpl;
    this.sleep = sleep;
    this.onRetry = onRetry;
    this.base = 'https://api.webflow.com/v2';
  }
  async request(method, endpoint, { body } = {}) {
    const maxAttempts = 3;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      let response;
      try {
        response = await this.fetch(`${this.base}${endpoint}`, {
          method,
          headers: { Authorization: `Bearer ${this.token}`, Accept: 'application/json', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        });
      } catch (error) {
        if (method !== 'GET' || attempt + 1 >= maxAttempts) throw error;
        this.onRetry({ endpoint, attempt: attempt + 1, delay: 500 });
        await this.sleep(500);
        continue;
      }
      if (response.status === 429 && attempt + 1 < maxAttempts) {
        const delay = retryDelay(response, attempt);
        this.onRetry({ endpoint, attempt: attempt + 1, delay });
        await this.sleep(delay);
        continue;
      }
      const parsed = await responseBody(response);
      if (!response.ok) throw new PilotError(`Webflow ${method} ${endpoint} failed with HTTP ${response.status}.`, { code: 'HTTP_ERROR', status: response.status, details: redact(parsed) });
      return parsed;
    }
    throw new PilotError(`Webflow ${method} ${endpoint} exhausted retries.`);
  }
  getCollection() { return this.request('GET', `/collections/${TARGET.collectionId}`); }
  async listItems(type) {
    const suffix = type === 'live' ? '/live' : '';
    const items = [];
    let total = Infinity;
    while (items.length < total) {
      const page = await this.request('GET', `/collections/${TARGET.collectionId}/items${suffix}?limit=100&offset=${items.length}`);
      if (!Array.isArray(page?.items)) throw new PilotError(`Invalid ${type} item-list response.`);
      items.push(...page.items);
      total = page.pagination?.total ?? items.length;
      if (!page.items.length) break;
    }
    return { items, pagination: { total, limit: 100, offset: 0 } };
  }
  async listAssets() {
    const assets = [];
    let total = Infinity;
    while (assets.length < total) {
      const page = await this.request('GET', `/sites/${TARGET.siteId}/assets?limit=100&offset=${assets.length}`);
      if (!Array.isArray(page?.assets)) throw new PilotError('Invalid asset-list response.');
      assets.push(...page.assets);
      total = page.pagination?.total ?? assets.length;
      if (!page.assets.length) break;
    }
    return assets;
  }
  getAsset(id) { return this.request('GET', `/assets/${id}`); }
  createAsset(fileName, fileHash) { return this.request('POST', `/sites/${TARGET.siteId}/assets`, { body: { fileName, fileHash } }); }
  patchImage(image) {
    return this.request('PATCH', `/collections/${TARGET.collectionId}/items?skipInvalidFiles=false`, {
      body: { items: [{ id: TARGET.itemId, cmsLocaleId: TARGET.localeId, fieldData: { image } }] },
    });
  }
  publishOne() {
    return this.request('POST', `/collections/${TARGET.collectionId}/items/publish`, { body: { itemIds: [TARGET.itemId] } });
  }
}

export async function validateLocalImage(filePath) {
  let bytes;
  try { bytes = await fs.readFile(filePath); }
  catch (error) { throw new PilotError(`Local replacement cannot be read: ${error.message}`); }
  let metadata;
  try { metadata = await sharp(bytes, { failOn: 'error' }).metadata(); }
  catch (error) { throw new PilotError(`Local replacement cannot be decoded: ${error.message}`); }
  const retained = RETAINED_METADATA.filter((field) => {
    const value = metadata[field];
    return Array.isArray(value) ? value.length > 0 : value != null;
  });
  const failures = [];
  if (metadata.format !== 'jpeg') failures.push(`format=${metadata.format}`);
  if (metadata.width !== TARGET.width || metadata.height !== TARGET.height) failures.push(`dimensions=${metadata.width}x${metadata.height}`);
  if (metadata.isProgressive !== true) failures.push('not progressive');
  if (metadata.space?.toLowerCase() !== 'srgb') failures.push(`colourspace=${metadata.space}`);
  if (metadata.hasProfile) failures.push('embedded profile present');
  if (retained.length) failures.push(`metadata present: ${retained.join(', ')}`);
  if (bytes.length !== TARGET.expectedBytes) failures.push(`unexpected size=${bytes.length}`);
  if (failures.length) throw new PilotError(`Local image validation failed (${failures.join('; ')}).`);
  return {
    bytes,
    metadata: {
      format: metadata.format, width: metadata.width, height: metadata.height, space: metadata.space,
      isProgressive: metadata.isProgressive, hasProfile: metadata.hasProfile,
      retainedMetadata: retained, bytes: bytes.length,
    },
    sha256: digest(bytes, 'sha256'), md5: digest(bytes, 'md5'),
  };
}

function withoutTimestamps(value) {
  if (Array.isArray(value)) return value.map(withoutTimestamps);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value)
      .filter(([key]) => !SYSTEM_TIMESTAMPS.has(key))
      .map(([key, child]) => [key, withoutTimestamps(child)]));
  }
  return value;
}
export function withoutImage(item) {
  const copy = structuredClone(item);
  if (copy.fieldData) delete copy.fieldData.image;
  return withoutTimestamps(copy);
}
export function diffPaths(before, after, prefix = '') {
  if (stable(before) === stable(after)) return [];
  if (!before || !after || typeof before !== 'object' || typeof after !== 'object') return [prefix || '$'];
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...keys].sort().flatMap((key) => diffPaths(before[key], after[key], prefix ? `${prefix}.${key}` : key));
}
export function compareTarget(before, after, imageVerification) {
  const nonImageDifferences = diffPaths(withoutImage(before), withoutImage(after));
  const image = after?.fieldData?.image;
  const imageMatches = imageVerification?.ok === true && stable(imageVerification.image) === stable(image);
  return {
    ok: nonImageDifferences.length === 0 && imageMatches,
    nonImageDifferences, imageMatches, imageVerification,
    beforeImage: before?.fieldData?.image, afterImage: image,
    allowedTimestampDifferences: diffPaths(before, after).filter((item) => SYSTEM_TIMESTAMPS.has(item)),
  };
}
function byIdentity(items) {
  return [...items].sort((a, b) => `${a.id}:${a.cmsLocaleId}`.localeCompare(`${b.id}:${b.cmsLocaleId}`));
}
export function compareUnrelated(beforeItems, afterItems) {
  const before = byIdentity(beforeItems.filter((item) => item.id !== TARGET.itemId)).map(withoutTimestamps);
  const after = byIdentity(afterItems.filter((item) => item.id !== TARGET.itemId)).map(withoutTimestamps);
  return { ok: stable(before) === stable(after), differences: diffPaths(before, after) };
}
function exactlyOne(items, label) {
  const matches = items.filter((item) => item.id === TARGET.itemId);
  if (matches.length !== 1) throw new PilotError(`${label} target match count is ${matches.length}, expected exactly 1.`);
  return matches[0];
}
function assertIdentity(item, label) {
  const failures = [];
  if (item.id !== TARGET.itemId) failures.push(`id=${item.id}`);
  if (Number(item.fieldData?.['token-id']) !== TARGET.tokenId) failures.push(`token-id=${item.fieldData?.['token-id']}`);
  if (item.fieldData?.name !== TARGET.name) failures.push(`name=${item.fieldData?.name}`);
  if (item.fieldData?.slug !== TARGET.slug) failures.push(`slug=${item.fieldData?.slug}`);
  if (item.cmsLocaleId !== TARGET.localeId) failures.push(`cmsLocaleId=${item.cmsLocaleId}`);
  if (item.isDraft !== false) failures.push(`isDraft=${item.isDraft}`);
  if (item.isArchived !== false) failures.push(`isArchived=${item.isArchived}`);
  if (failures.length) throw new PilotError(`${label} identity mismatch (${failures.join('; ')}).`);
}

export function evaluatePreflight({ stagedItems, liveItems, collection, mappingEntries, dropParams }) {
  if (collection?.id !== TARGET.collectionId) throw new PilotError('Collection ID mismatch.');
  if (collection?.displayName !== 'CANAANs' || collection?.singularName !== TARGET.collection) {
    throw new PilotError(`Collection identity mismatch (${collection?.displayName}/${collection?.singularName}).`);
  }
  const mappings = mappingEntries.filter((entry) => entry.cmsItemId === TARGET.itemId);
  if (mappings.length !== 1) throw new PilotError(`Audit target mapping count is ${mappings.length}, expected exactly 1.`);
  const mapping = mappings[0];
  if (mapping.collectionId !== TARGET.collectionId || Number(mapping.cmsTokenId) !== TARGET.tokenId ||
      mapping.cmsItemName !== TARGET.name || mapping.cmsSlug !== TARGET.slug ||
      mapping.cmsLocaleId !== TARGET.localeId || mapping.localApprovedJpegPath !== TARGET.localPath) {
    throw new PilotError('Audit target mapping identity mismatch.');
  }
  const staged = exactlyOne(stagedItems, 'Staged');
  const live = exactlyOne(liveItems, 'Live');
  assertIdentity(staged, 'Staged');
  assertIdentity(live, 'Live');
  const targetNonImageMatches = stable(withoutImage(staged)) === stable(withoutImage(live));
  const unrelatedMatch = compareUnrelated(stagedItems, liveItems);
  if (!targetNonImageMatches || !unrelatedMatch.ok) {
    throw new PilotError('Staged/live collection drift exists; unrelated staged changes are not safe to overwrite.');
  }
  if (dropParams?.redeemToken?.collection === TARGET.collection && Number(dropParams.redeemToken.tokenId) === TARGET.tokenId) {
    throw new PilotError('CANAAN token 1 is the configured active redeem token.');
  }
  return { staged, live, mapping };
}

export async function downloadImage(url, fetchImpl = fetch) {
  let response;
  try { response = await fetchImpl(url, { method: 'GET', headers: { Accept: 'image/*' } }); }
  catch (error) { throw new PilotError(`Image download failed before an HTTP response: ${error.message}`); }
  if (!response.ok) throw new PilotError(`Image download failed with HTTP ${response.status}.`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.length) throw new PilotError('Image download returned empty bytes.');
  let metadata;
  try { metadata = await sharp(bytes, { failOn: 'error' }).metadata(); }
  catch (error) { throw new PilotError(`Downloaded bytes do not decode as an image: ${error.message}`); }
  return {
    bytes, sha256: digest(bytes, 'sha256'), status: response.status,
    contentType: response.headers.get('content-type'),
    metadata: { format: metadata.format, width: metadata.width, height: metadata.height },
  };
}

async function comparablePixels(bytes) {
  return sharp(bytes, { failOn: 'error' })
    .rotate().flatten({ background: '#fff' }).toColourspace('srgb').removeAlpha()
    .raw().toBuffer({ resolveWithObject: true });
}

async function differenceHash(bytes) {
  const pixels = await sharp(bytes, { failOn: 'error' })
    .rotate().flatten({ background: '#fff' }).greyscale().resize(9, 8, { fit: 'fill' }).raw().toBuffer();
  return Array.from({ length: 64 }, (_, index) => pixels[index + Math.floor(index / 8) + 1] >= pixels[index + Math.floor(index / 8)] ? '1' : '0').join('');
}

export async function compareImageContent(expectedBytes, actualBytes) {
  const [expectedMetadata, actualMetadata, expectedPixels, actualPixels, expectedHash, actualHash] = await Promise.all([
    sharp(expectedBytes, { failOn: 'error' }).metadata(),
    sharp(actualBytes, { failOn: 'error' }).metadata(),
    comparablePixels(expectedBytes), comparablePixels(actualBytes),
    differenceHash(expectedBytes), differenceHash(actualBytes),
  ]);
  const expected = { format: expectedMetadata.format, width: expectedMetadata.width, height: expectedMetadata.height };
  const actual = { format: actualMetadata.format, width: actualMetadata.width, height: actualMetadata.height };
  const formatMatches = expected.format === actual.format;
  const dimensionsMatch = expectedPixels.info.width === actualPixels.info.width &&
    expectedPixels.info.height === actualPixels.info.height && expectedPixels.info.channels === actualPixels.info.channels;
  const byteExact = digest(expectedBytes, 'sha256') === digest(actualBytes, 'sha256');
  if (!dimensionsMatch) {
    return { ok: false, byteExact, formatMatches, dimensionsMatch, expected, actual, metrics: null };
  }
  let absolute = 0;
  let squared = 0;
  for (let index = 0; index < expectedPixels.data.length; index += 1) {
    const difference = Math.abs(expectedPixels.data[index] - actualPixels.data[index]);
    absolute += difference;
    squared += difference * difference;
  }
  const meanAbsoluteError = absolute / expectedPixels.data.length;
  const normalizedMeanAbsoluteError = meanAbsoluteError / 255;
  const rootMeanSquaredError = Math.sqrt(squared / expectedPixels.data.length);
  const psnr = rootMeanSquaredError === 0 ? null : 20 * Math.log10(255 / rootMeanSquaredError);
  let differenceHashDistance = 0;
  for (let index = 0; index < expectedHash.length; index += 1) {
    if (expectedHash[index] !== actualHash[index]) differenceHashDistance += 1;
  }
  const metrics = { meanAbsoluteError, normalizedMeanAbsoluteError, rootMeanSquaredError, psnr, differenceHashDistance };
  const perceptuallyEquivalent = normalizedMeanAbsoluteError <= IMAGE_EQUIVALENCE_LIMITS.maximumNormalizedMeanAbsoluteError &&
    (psnr === null || psnr >= IMAGE_EQUIVALENCE_LIMITS.minimumPsnr) &&
    differenceHashDistance <= IMAGE_EQUIVALENCE_LIMITS.maximumDifferenceHashDistance;
  return { ok: formatMatches && (byteExact || perceptuallyEquivalent), byteExact, perceptuallyEquivalent,
    formatMatches, dimensionsMatch, expected, actual, metrics };
}

function imageExtension(url) {
  try { return path.extname(new URL(url).pathname).toLowerCase(); }
  catch { return null; }
}

export async function verifyCmsImage(image, source, fetchImpl = fetch, submittedImage = null) {
  const shape = {
    hasFileId: typeof image?.fileId === 'string' && image.fileId.length > 0,
    hasHttpUrl: typeof image?.url === 'string' && /^https:\/\//.test(image.url),
    altIsNull: image?.alt === null,
  };
  if (!shape.hasFileId || !shape.hasHttpUrl || !shape.altIsNull) {
    return { ok: false, image, shape, retrievable: false, content: null };
  }
  let hosted;
  try { hosted = await downloadImage(image.url, fetchImpl); }
  catch (error) {
    return { ok: false, image, shape, retrievable: false, retrievalError: publicError(error), content: null };
  }
  const content = await compareImageContent(source.bytes, hosted.bytes);
  const normalization = submittedImage ? {
    fileIdChanged: image.fileId !== submittedImage.fileId,
    urlChanged: image.url !== submittedImage.url,
    submittedExtension: imageExtension(submittedImage.url),
    resultingExtension: imageExtension(image.url),
  } : null;
  return {
    ok: content.ok, image, shape, retrievable: true,
    hosted: { sha256: hosted.sha256, bytes: hosted.bytes.length, status: hosted.status,
      contentType: hosted.contentType, metadata: hosted.metadata },
    source: { sha256: source.sha256 ?? digest(source.bytes, 'sha256'), bytes: source.bytes.length,
      metadata: source.metadata },
    content, normalization,
  };
}

async function loadAuthorities(paths) {
  const audit = await readJson(paths.mapping);
  const dropParams = (await import(`${pathToFileURL(paths.dropParams).href}?pilot=${Date.now()}`)).default;
  return { mappingEntries: audit.items, dropParams };
}
async function fetchRoute(fetchImpl = fetch) {
  try {
    const response = await fetchImpl(TARGET.route, { method: 'GET', headers: { Accept: 'text/html' } });
    const bytes = Buffer.from(await response.arrayBuffer());
    return { ok: response.ok, status: response.status, sha256: digest(bytes, 'sha256'), bytes: bytes.length,
      referencesOldImage: bytes.includes(Buffer.from(TARGET.oldImage.url)) };
  } catch (error) { return { ok: false, status: null, error: error.message }; }
}
async function preflight({ api, paths, fetchImpl = fetch }) {
  const [{ mappingEntries, dropParams }, local, collection, stagedState, liveState, assets] = await Promise.all([
    loadAuthorities(paths), validateLocalImage(paths.localImage), api.getCollection(),
    api.listItems('staged'), api.listItems('live'), api.listAssets(),
  ]);
  const target = evaluatePreflight({ stagedItems: stagedState.items, liveItems: liveState.items, collection, mappingEntries, dropParams });
  const oldImage = await downloadImage(TARGET.oldImage.url, fetchImpl);
  const [stagedImageVerification, liveImageVerification] = await Promise.all([
    verifyCmsImage(target.staged.fieldData.image, oldImage, fetchImpl, TARGET.oldImage),
    verifyCmsImage(target.live.fieldData.image, oldImage, fetchImpl, TARGET.oldImage),
  ]);
  if (!stagedImageVerification.ok || !liveImageVerification.ok) {
    throw new PilotError('Current staged or live Image does not match the original visual/content state.', {
      details: { stagedImageVerification, liveImageVerification },
    });
  }
  const route = await fetchRoute(fetchImpl);
  return { local, collection, stagedState, liveState, assets, target,
    oldImage, stagedImageVerification, liveImageVerification, route };
}
async function saveBefore(paths, result) {
  await Promise.all([
    writeJson(path.join(paths.runtime, 'before.staged.json'), result.stagedState),
    writeJson(path.join(paths.runtime, 'before.live.json'), result.liveState),
    writeJson(path.join(paths.runtime, 'before-image.json'), { image: TARGET.oldImage, sha256: result.oldImage.sha256,
      bytes: result.oldImage.bytes.length, metadata: result.oldImage.metadata }),
    atomicWrite(path.join(paths.runtime, 'before-image.bin'), result.oldImage.bytes),
    atomicWrite(path.join(paths.runtime, 'before-image.sha256'), `${result.oldImage.sha256}\n`),
    atomicWrite(path.join(paths.runtime, 'local-image.sha256'), `${result.local.sha256}\n`),
    atomicWrite(path.join(paths.runtime, 'local-image.md5'), `${result.local.md5}\n`),
  ]);
}
export function proposedChange(local) {
  return {
    target: { siteId: TARGET.siteId, collectionId: TARGET.collectionId, itemId: TARGET.itemId,
      tokenId: TARGET.tokenId, name: TARGET.name, slug: TARGET.slug, localeId: TARGET.localeId, localPath: TARGET.localPath },
    assetFilename: assetFilename(local.sha256),
    cmsPatch: { items: [{ id: TARGET.itemId, cmsLocaleId: TARGET.localeId,
      fieldData: { image: { fileId: '<created-asset-id>', url: '<created-asset-hosted-url>', alt: null } } }] },
    preservationCheck: 'Every non-image field, flag, identity, locale, and all non-target CANAAN items must remain unchanged.',
  };
}
export async function dryRun({ api, paths = DEFAULT_PATHS, fetchImpl = fetch, logger = async () => {} }) {
  await logger('dry-run-preflight-started', { target: TARGET.itemId });
  const result = await preflight({ api, paths, fetchImpl });
  await saveBefore(paths, result);
  await logger('dry-run-ready', proposedChange(result.local));
  return result;
}

const findTarget = (state) => exactlyOne(state.items, 'Current');
async function assertDryRunUnchanged(paths, result) {
  const [beforeStaged, beforeLive, beforeImage] = await Promise.all([
    readJson(path.join(paths.runtime, 'before.staged.json')),
    readJson(path.join(paths.runtime, 'before.live.json')),
    readJson(path.join(paths.runtime, 'before-image.json')),
  ]);
  if (stable(beforeStaged) !== stable(result.stagedState) || stable(beforeLive) !== stable(result.liveState)) {
    throw new PilotError('Staged or live state changed since dry-run.');
  }
  if (beforeImage.sha256 !== result.oldImage.sha256) throw new PilotError('Hosted before-image bytes changed since dry-run.');
  return { beforeStaged, beforeLive };
}
function assetNameMatches(asset, filename) {
  return asset?.originalFileName === filename || asset?.displayName === filename || asset?.displayName?.endsWith(`_${filename}`);
}
async function verifyUploadedAsset({ api, asset, filename, local, fetchImpl }) {
  const current = await api.getAsset(asset.id);
  if (current.siteId !== TARGET.siteId) throw new PilotError('Uploaded asset site ID mismatch.');
  if (!assetNameMatches(current, filename)) throw new PilotError('Uploaded asset filename mismatch.');
  const url = current.hostedUrl ?? asset.hostedUrl ?? asset.assetUrl;
  if (!url) throw new PilotError('Uploaded asset has no hosted URL.');
  const downloaded = await downloadImage(url, fetchImpl);
  if (downloaded.sha256 !== local.sha256) throw new PilotError('Uploaded asset bytes do not match the local SHA-256.');
  return { ...current, hostedUrl: url, verifiedSha256: downloaded.sha256 };
}
export async function uploadBinary({ metadata, local, fetchImpl = fetch }) {
  if (!metadata.uploadUrl || !metadata.uploadDetails) throw new PilotError('Asset metadata response lacks presigned upload details.');
  const form = new FormData();
  for (const [key, value] of Object.entries(metadata.uploadDetails)) form.append(key, String(value));
  form.append('file', new Blob([local.bytes], { type: metadata.contentType ?? 'image/jpeg' }), metadata.originalFileName);
  let response;
  try { response = await fetchImpl(metadata.uploadUrl, { method: 'POST', body: form }); }
  catch (error) { throw new PilotError(`Asset byte upload outcome is unknown: ${error.message}`, { code: 'UNKNOWN_UPLOAD_OUTCOME' }); }
  if (response.status !== 201) throw new PilotError(`Asset byte upload failed with HTTP ${response.status}.`, { status: response.status });
  return { status: response.status };
}
export async function ensureReplacementAsset({ api, result, paths, fetchImpl, logger }) {
  const filename = assetFilename(result.local.sha256);
  const candidates = result.assets.filter((asset) => assetNameMatches(asset, filename));
  for (const candidate of candidates) {
    try {
      const verified = await verifyUploadedAsset({ api, asset: candidate, filename, local: result.local, fetchImpl });
      await logger('existing-replacement-asset-reused', { id: verified.id, hostedUrl: verified.hostedUrl });
      await writeJson(path.join(paths.runtime, 'uploaded-asset.json'), redact(verified));
      return verified;
    } catch (error) { await logger('same-name-asset-not-reusable', publicError(error)); }
  }
  let metadata;
  if (candidates.length) {
    throw new PilotError('A deterministic-name asset exists but could not be verified; refusing a duplicate upload.');
  }
  try { metadata = await api.createAsset(filename, result.local.md5); }
  catch (error) {
    if (error instanceof PilotError) throw error;
    throw new PilotError(`Asset metadata creation outcome is unknown: ${error.message}`, { code: 'UNKNOWN_ASSET_CREATE_OUTCOME' });
  }
  await writeJson(path.join(paths.runtime, 'uploaded-asset.json'), redact(metadata));
  await logger('asset-metadata-created', { id: metadata.id, filename });
  await uploadBinary({ metadata, local: result.local, fetchImpl });
  const verified = await verifyUploadedAsset({ api, asset: metadata, filename, local: result.local, fetchImpl });
  await writeJson(path.join(paths.runtime, 'uploaded-asset.json'), redact(verified));
  await logger('asset-upload-verified', { id: verified.id, hostedUrl: verified.hostedUrl, sha256: verified.verifiedSha256 });
  return verified;
}
async function currentStates(api) {
  const [stagedState, liveState] = await Promise.all([api.listItems('staged'), api.listItems('live')]);
  return { stagedState, liveState };
}
export async function verifyStagedChange(beforeStaged, beforeLive, stagedState, liveState,
  { source, fetchImpl = fetch, submittedImage = null }) {
  const currentTarget = findTarget(stagedState);
  const imageVerification = await verifyCmsImage(currentTarget.fieldData?.image, source, fetchImpl, submittedImage);
  const target = compareTarget(exactlyOne(beforeStaged.items, 'Before staged'), currentTarget, imageVerification);
  const unrelatedStaged = compareUnrelated(beforeStaged.items, stagedState.items);
  const liveUnchanged = stable(beforeLive) === stable(liveState);
  return { ok: target.ok && unrelatedStaged.ok && liveUnchanged, target, unrelatedStaged, liveUnchanged };
}
export async function exactRollback({ api, beforeStaged, expectedLive, paths, fetchImpl = fetch, logger }) {
  try { await api.patchImage(TARGET.oldImage); }
  catch (error) {
    const rollback = { status: 'legacy-fileId-rejected-or-patch-failed', oldImage: TARGET.oldImage,
      cachedBytes: 'before-image.bin', fallbackRequiresExplicitApproval: true, error: publicError(error) };
    await writeJson(path.join(paths.runtime, 'rollback.json'), rollback);
    throw new PilotError('Exact staged rollback failed. Cached-byte fallback requires explicit approval.', {
      code: 'LEGACY_FILE_ID_ROLLBACK_FAILED', details: rollback,
    });
  }
  const { stagedState, liveState } = await currentStates(api);
  const source = { bytes: await fs.readFile(path.join(paths.runtime, 'before-image.bin')) };
  const check = await verifyStagedChange(beforeStaged, expectedLive, stagedState, liveState,
    { source, fetchImpl, submittedImage: TARGET.oldImage });
  const rollback = { status: check.ok ? 'staged-restored' : 'staged-rollback-unverified', check,
    submittedImage: TARGET.oldImage, resultingImage: findTarget(stagedState).fieldData.image };
  await writeJson(path.join(paths.runtime, 'rollback.json'), rollback);
  await logger('automatic-staged-rollback-result', rollback);
  if (!check.ok) throw new PilotError('Staged rollback could not be verified.', { code: 'ROLLBACK_UNVERIFIED' });
  return rollback;
}

async function knownUploadedAsset(paths) {
  try {
    const asset = await readJson(path.join(paths.runtime, 'uploaded-asset.json'));
    if (!asset?.id || !asset?.hostedUrl || asset.id === '[REDACTED]' || asset.hostedUrl === '[REDACTED]') return null;
    return asset;
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
}
export async function recoverApplyOutcome({ api, paths = DEFAULT_PATHS, fetchImpl = fetch, logger = async () => {} }) {
  const asset = await knownUploadedAsset(paths);
  if (!asset) return null;
  const [beforeStaged, beforeLive] = await Promise.all([
    readJson(path.join(paths.runtime, 'before.staged.json')),
    readJson(path.join(paths.runtime, 'before.live.json')),
  ]);
  const states = await currentStates(api);
  const submittedImage = { fileId: asset.id, url: asset.hostedUrl, alt: null };
  const local = await validateLocalImage(paths.localImage);
  const comparison = await verifyStagedChange(beforeStaged, beforeLive, states.stagedState, states.liveState,
    { source: local, fetchImpl, submittedImage });
  if (!comparison.target.imageMatches) return null;
  if (!comparison.ok) throw new PilotError('Recovered staged write has unexpected differences.', { details: comparison });
  const verifiedAsset = await verifyUploadedAsset({ api, asset, filename: assetFilename(local.sha256), local, fetchImpl });
  await Promise.all([
    writeJson(path.join(paths.runtime, 'after.staged.json'), states.stagedState),
    writeJson(path.join(paths.runtime, 'after.live.json'), states.liveState),
    writeJson(path.join(paths.runtime, 'comparison.staged.json'), comparison),
  ]);
  await logger('staged-write-recovered-after-resume', { assetId: verifiedAsset.id });
  return { result: { recoveredAfterCrash: true }, asset: verifiedAsset,
    submittedImage, newImage: findTarget(states.stagedState).fieldData.image,
    patchResult: { outcomeRecoveredByResumeReread: true }, ...states, comparison };
}
export async function applyStaged({ api, paths = DEFAULT_PATHS, fetchImpl = fetch, logger = async () => {},
  checkpoint = async () => {}, onWriteStart = async () => {} }) {
  const recovered = await recoverApplyOutcome({ api, paths, fetchImpl, logger });
  if (recovered) return recovered;
  const result = await preflight({ api, paths, fetchImpl });
  const { beforeStaged, beforeLive } = await assertDryRunUnchanged(paths, result);
  await onWriteStart();
  const asset = await ensureReplacementAsset({ api, result, paths, fetchImpl, logger });
  const submittedImage = { fileId: asset.id, url: asset.hostedUrl, alt: null };
  let patchResult;
  await checkpoint({ currentPhase: 'asset-uploaded-verified', uploadedAssetId: asset.id, uploadedAssetUrl: asset.hostedUrl });

  try { patchResult = await api.patchImage(submittedImage); }
  catch (error) {
    const reread = await currentStates(api);
    const recovered = await verifyStagedChange(beforeStaged, beforeLive, reread.stagedState, reread.liveState,
      { source: result.local, fetchImpl, submittedImage });
    if (!recovered.ok) throw error;
    patchResult = { outcomeRecoveredByReread: true };
  }
  const { stagedState, liveState } = await currentStates(api);
  await checkpoint({ currentPhase: 'staged-patch-observed', stagedPatchResult: redact(patchResult) });

  const comparison = await verifyStagedChange(beforeStaged, beforeLive, stagedState, liveState,
    { source: result.local, fetchImpl, submittedImage });
  const route = await fetchRoute(fetchImpl);
  if (stable(route) !== stable(result.route)) {
    comparison.ok = false;
    comparison.publicRouteChangedBeforePublish = { before: result.route, after: route };
  }
  await Promise.all([
    writeJson(path.join(paths.runtime, 'after.staged.json'), stagedState),
    writeJson(path.join(paths.runtime, 'after.live.json'), liveState),
    writeJson(path.join(paths.runtime, 'comparison.staged.json'), comparison),
  ]);
  if (!comparison.ok) {
    await logger('staged-verification-failed', comparison);
    await exactRollback({ api, beforeStaged, expectedLive: beforeLive, paths, fetchImpl, logger });
    throw new PilotError('Staged verification failed; staged visual/content rollback was performed.');
  }
  return { result, asset, submittedImage, newImage: findTarget(stagedState).fieldData.image,
    patchResult: redact(patchResult), stagedState, liveState, comparison };
}

export async function verifyPublicRoute({ fetchImpl = fetch, policy = PUBLIC_ROUTE_POLICY,
  sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)) } = {}) {
  const attempts = [];
  for (let index = 0; index < policy.maxAttempts; index += 1) {
    if (index > 0) await sleep(policy.retryDelaysMs[index - 1] ?? 0);
    try {
      const response = await fetchImpl(policy.url, { method: 'GET', headers: { Accept: 'text/html' } });
      const bytes = Buffer.from(await response.arrayBuffer());
      attempts.push({ attempt: index + 1, ok: response.ok, status: response.status,
        bytes: bytes.length, sha256: digest(bytes, 'sha256') });
      if (response.ok) {
        return { classification: 'confirmed-and-passed', ok: true, hardFailure: false,
          authoritative: policy.authoritative, directRouteExists: policy.directRouteExists,
          recoveredAfterRetry: index > 0, evidence: policy.evidence, attempts };
      }
    } catch (error) {
      attempts.push({ attempt: index + 1, ok: false, status: null, error: error.message });
    }
  }
  const transientOnly = attempts.every((attempt) => attempt.status == null || attempt.status === 429 || attempt.status >= 500);
  const classification = policy.directRouteExists === false ? 'no-direct-public-route-exists' :
    (policy.authoritative === true ? (transientOnly ? 'temporarily-unavailable-after-bounded-propagation-retries' :
      'confirmed-and-failed') : 'route-not-authoritative-publish-signal');
  return { classification, ok: false, hardFailure: policy.authoritative === true,
    authoritative: policy.authoritative, directRouteExists: policy.directRouteExists,
    recoveredAfterRetry: false, evidence: policy.evidence, attempts };
}

export async function publish({ api, journal, paths = DEFAULT_PATHS, fetchImpl = fetch, confirmation,
  onWriteStart = async () => {} }) {
  if (!isPublishEligible(journal)) throw new PilotError('Journal does not record an eligible staged verification.');
  if (confirmation !== PUBLISH_CONFIRMATION) throw new PilotError('Exact publish confirmation is missing.');
  const [beforeStaged, beforeLive, verifiedStaged] = await Promise.all([
    readJson(path.join(paths.runtime, 'before.staged.json')),
    readJson(path.join(paths.runtime, 'before.live.json')),
    readJson(path.join(paths.runtime, 'after.staged.json')),
  ]);
  const newImage = journal.stagedVerificationResult?.image;
  if (!newImage) throw new PilotError('Journal lacks the verified replacement Image object.');
  const local = await validateLocalImage(paths.localImage);
  const fresh = await currentStates(api);
  const gate = await verifyStagedChange(beforeStaged, beforeLive, fresh.stagedState, fresh.liveState,
    { source: local, fetchImpl, submittedImage: newImage });
  if (!gate.ok || stable(fresh.stagedState) !== stable(verifiedStaged)) {
    throw new PilotError('Fresh publish gate does not match the verified staged state.');
  }
  let publishResult;
  await onWriteStart();
  try { publishResult = await api.publishOne(); }
  catch (error) {
    let reread;
    try { reread = await currentStates(api); }
    catch (reconciliationError) {
      throw new PilotError('Publish request failed and CMS state could not be reconciled.', {
        code: 'UNKNOWN_WRITE_OUTCOME', writeOutcome: 'unknown',
        details: { publishError: publicError(error), reconciliationError: publicError(reconciliationError) },
      });
    }
    const rereadLiveTarget = findTarget(reread.liveState);
    const liveImageVerification = await verifyCmsImage(rereadLiveTarget.fieldData.image, local, fetchImpl, newImage);
    const liveTargetCheck = compareTarget(exactlyOne(beforeLive.items, 'Before live'), rereadLiveTarget, liveImageVerification);
    if (liveTargetCheck.ok && compareUnrelated(beforeLive.items, reread.liveState.items).ok) {
      publishResult = { outcomeRecoveredByReread: true };
    } else {
      const stagedStillVerified = await verifyStagedChange(beforeStaged, beforeLive, reread.stagedState, reread.liveState,
        { source: local, fetchImpl, submittedImage: newImage });
      if (stagedStillVerified.ok) {
        error.writeOutcome = 'not-applied';
        throw error;
      }
      throw new PilotError('Publish request failed and reread did not prove either pre-publish or published state.', {
        code: 'UNKNOWN_WRITE_OUTCOME', writeOutcome: 'unknown',
        details: { publishError: publicError(error), stagedStillVerified, liveTargetCheck },
      });
    }
  }
  const after = await currentStates(api);
  const stagedTarget = findTarget(after.stagedState);
  const liveTarget = findTarget(after.liveState);
  const [stagedImageVerification, liveImageVerification] = await Promise.all([
    verifyCmsImage(stagedTarget.fieldData.image, local, fetchImpl, newImage),
    verifyCmsImage(liveTarget.fieldData.image, local, fetchImpl, newImage),
  ]);
  const target = compareTarget(exactlyOne(beforeLive.items, 'Before live'), liveTarget, liveImageVerification);
  const liveEqualsStaged = stable(withoutImage(stagedTarget)) === stable(withoutImage(liveTarget)) &&
    stagedImageVerification.ok && liveImageVerification.ok;
  const unrelatedLive = compareUnrelated(beforeLive.items, after.liveState.items);
  const comparison = { ok: target.ok && liveEqualsStaged && unrelatedLive.ok, target, liveEqualsStaged, unrelatedLive };
  if (!comparison.ok) throw new PilotError('Post-publish live verification failed.', {
    code: 'LIVE_UNVERIFIED', details: comparison, writeOutcome: 'applied-unverified',
  });
  const publicVerification = await verifyPublicRoute({ fetchImpl });
  await Promise.all([
    writeJson(path.join(paths.runtime, 'after.staged.json'), after.stagedState),
    writeJson(path.join(paths.runtime, 'after.live.json'), after.liveState),
    writeJson(path.join(paths.runtime, 'comparison.live.json'), { ...comparison, publicVerification }),
  ]);
  if (publicVerification.hardFailure) {
    throw new PilotError('Authoritative public route verification failed after bounded retries.', {
      code: 'AUTHORITATIVE_ROUTE_UNVERIFIED', details: publicVerification, writeOutcome: 'applied-unverified',
    });
  }
  return { publishResult: redact(publishResult), after, comparison, publicVerification, newImage };
}

export async function verify({ api, journal, paths = DEFAULT_PATHS, fetchImpl = fetch }) {
  const [beforeStaged, beforeLive] = await Promise.all([
    readJson(path.join(paths.runtime, 'before.staged.json')),
    readJson(path.join(paths.runtime, 'before.live.json')),
  ]);
  const image = journal.stagedVerificationResult?.image ?? TARGET.oldImage;
  const replacementExpected = ['staged-verified', 'published-verified'].includes(journal.currentPhase) &&
    journal.stagedVerificationResult?.image != null;
  const stagedSource = replacementExpected ? await validateLocalImage(paths.localImage) :
    { bytes: await fs.readFile(path.join(paths.runtime, 'before-image.bin')) };
  const states = await currentStates(api);
  const expectedLive = journal.currentPhase === 'published-verified' ? image : TARGET.oldImage;
  const liveSource = journal.currentPhase === 'published-verified' ? stagedSource :
    { bytes: await fs.readFile(path.join(paths.runtime, 'before-image.bin')) };
  const [stagedImageVerification, liveImageVerification] = await Promise.all([
    verifyCmsImage(findTarget(states.stagedState).fieldData.image, stagedSource, fetchImpl, image),
    verifyCmsImage(findTarget(states.liveState).fieldData.image, liveSource, fetchImpl, expectedLive),
  ]);
  const result = {
    staged: compareTarget(exactlyOne(beforeStaged.items, 'Before staged'), findTarget(states.stagedState), stagedImageVerification),
    live: compareTarget(exactlyOne(beforeLive.items, 'Before live'), findTarget(states.liveState), liveImageVerification),
    stagedUnrelated: compareUnrelated(beforeStaged.items, states.stagedState.items),
    liveUnrelated: compareUnrelated(beforeLive.items, states.liveState.items),
  };
  result.ok = result.staged.ok && result.live.ok && result.stagedUnrelated.ok && result.liveUnrelated.ok;
  await Promise.all([
    writeJson(path.join(paths.runtime, 'after.staged.json'), states.stagedState),
    writeJson(path.join(paths.runtime, 'after.live.json'), states.liveState),
    writeJson(path.join(paths.runtime, 'comparison.staged.json'), result),
    writeJson(path.join(paths.runtime, 'comparison.live.json'), result),
  ]);
  if (!result.ok) throw new PilotError('Verification found unexpected state.', { details: result });
  return result;
}

export async function reconcile({ api, journal, paths = DEFAULT_PATHS, fetchImpl = fetch }) {
  const [beforeStaged, beforeLive, local, originalBytes] = await Promise.all([
    readJson(path.join(paths.runtime, 'before.staged.json')),
    readJson(path.join(paths.runtime, 'before.live.json')),
    validateLocalImage(paths.localImage),
    fs.readFile(path.join(paths.runtime, 'before-image.bin')),
  ]);
  const states = await currentStates(api);
  const submittedImage = journal.stagedVerificationResult?.image ?? {
    fileId: journal.uploadedAssetId, url: journal.uploadedAssetUrl, alt: null,
  };
  const staged = await verifyStagedChange(beforeStaged, beforeLive, states.stagedState, states.liveState,
    { source: local, fetchImpl, submittedImage });
  const liveTarget = findTarget(states.liveState);
  const liveImageVerification = await verifyCmsImage(liveTarget.fieldData.image,
    { bytes: originalBytes }, fetchImpl, TARGET.oldImage);
  const live = compareTarget(exactlyOne(beforeLive.items, 'Before live'), liveTarget, liveImageVerification);
  const liveUnrelated = compareUnrelated(beforeLive.items, states.liveState.items);
  const result = {
    ok: staged.ok && live.ok && liveUnrelated.ok,
    staged, live, liveUnrelated,
    resultingStagedImage: findTarget(states.stagedState).fieldData.image,
    resultingLiveImage: liveTarget.fieldData.image,
  };
  await Promise.all([
    writeJson(path.join(paths.runtime, 'after.staged.json'), states.stagedState),
    writeJson(path.join(paths.runtime, 'after.live.json'), states.liveState),
    writeJson(path.join(paths.runtime, 'comparison.reconcile.json'), result),
  ]);
  if (!result.ok) throw new PilotError('Reconciliation did not prove a publish-eligible staged state.', {
    code: 'RECONCILIATION_FAILED', details: result, writeOutcome: 'not-attempted',
  });
  return result;
}

export async function reconcilePublished({ api, journal, paths = DEFAULT_PATHS, fetchImpl = fetch,
  routePolicy = PUBLIC_ROUTE_POLICY, sleep } = {}) {
  const [beforeStaged, beforeLive, local] = await Promise.all([
    readJson(path.join(paths.runtime, 'before.staged.json')),
    readJson(path.join(paths.runtime, 'before.live.json')),
    validateLocalImage(paths.localImage),
  ]);
  const states = await currentStates(api);
  const stagedTarget = exactlyOne(states.stagedState.items, 'Current staged');
  const liveTarget = exactlyOne(states.liveState.items, 'Current live');
  assertIdentity(stagedTarget, 'Current staged');
  assertIdentity(liveTarget, 'Current live');
  const submittedImage = journal.stagedVerificationResult?.image ?? {
    fileId: journal.uploadedAssetId, url: journal.uploadedAssetUrl, alt: null,
  };
  const [stagedImageVerification, liveImageVerification, publicVerification] = await Promise.all([
    verifyCmsImage(stagedTarget.fieldData.image, local, fetchImpl, submittedImage),
    verifyCmsImage(liveTarget.fieldData.image, local, fetchImpl, submittedImage),
    verifyPublicRoute({ fetchImpl, policy: routePolicy, sleep }),
  ]);
  const staged = compareTarget(exactlyOne(beforeStaged.items, 'Before staged'), stagedTarget, stagedImageVerification);
  const live = compareTarget(exactlyOne(beforeLive.items, 'Before live'), liveTarget, liveImageVerification);
  const stagedUnrelated = compareUnrelated(beforeStaged.items, states.stagedState.items);
  const liveUnrelated = compareUnrelated(beforeLive.items, states.liveState.items);
  const stagedLiveNonImageMatch = stable(withoutImage(stagedTarget)) === stable(withoutImage(liveTarget));
  const cmsVerified = staged.ok && live.ok && stagedUnrelated.ok && liveUnrelated.ok && stagedLiveNonImageMatch;
  const result = {
    ok: cmsVerified && !publicVerification.hardFailure,
    cmsVerified,
    staged,
    live,
    stagedUnrelated,
    liveUnrelated,
    stagedLiveNonImageMatch,
    resultingStagedImage: stagedTarget.fieldData.image,
    resultingLiveImage: liveTarget.fieldData.image,
    publicVerification,
    proof: 'fresh-authenticated-staged-and-live-cms-state',
    cmsWritesPerformed: 0,
    publishRequestsPerformed: 0,
  };
  await Promise.all([
    writeJson(path.join(paths.runtime, 'after.staged.json'), states.stagedState),
    writeJson(path.join(paths.runtime, 'after.live.json'), states.liveState),
    writeJson(path.join(paths.runtime, 'comparison.published-reconcile.json'), result),
  ]);
  if (!result.ok) throw new PilotError('Post-publish reconciliation did not conclusively verify published state.', {
    code: 'PUBLISHED_RECONCILIATION_FAILED', details: result, writeOutcome: 'not-attempted',
  });
  return result;
}

export async function rollbackStaged({ api, paths = DEFAULT_PATHS, fetchImpl = fetch, logger = async () => {} }) {
  const [beforeStaged, beforeLive] = await Promise.all([
    readJson(path.join(paths.runtime, 'before.staged.json')),
    readJson(path.join(paths.runtime, 'before.live.json')),
  ]);
  const states = await currentStates(api);
  const source = { bytes: await fs.readFile(path.join(paths.runtime, 'before-image.bin')) };
  const current = await verifyStagedChange(beforeStaged, beforeLive, states.stagedState, states.liveState,
    { source, fetchImpl, submittedImage: TARGET.oldImage });
  if (current.target.imageMatches) {
    if (!current.ok) throw new PilotError('Restored staged image has unexpected non-image, unrelated-item, or live differences.', { details: current });
    const rollback = { status: 'already-staged-restored', check: current,
      resultingImage: findTarget(states.stagedState).fieldData.image };
    await writeJson(path.join(paths.runtime, 'rollback.json'), rollback);
    return rollback;
  }
  return exactRollback({ api, beforeStaged, expectedLive: beforeLive, paths, fetchImpl, logger });
}
export async function rollbackPublish({ api, paths = DEFAULT_PATHS, fetchImpl = fetch, confirmation }) {
  if (confirmation !== ROLLBACK_PUBLISH_CONFIRMATION) throw new PilotError('Exact rollback publish confirmation is missing.');
  const beforeLive = await readJson(path.join(paths.runtime, 'before.live.json'));
  const states = await currentStates(api);
  const source = { bytes: await fs.readFile(path.join(paths.runtime, 'before-image.bin')) };
  const stagedImageVerification = await verifyCmsImage(findTarget(states.stagedState).fieldData.image, source, fetchImpl, TARGET.oldImage);
  if (!stagedImageVerification.ok) throw new PilotError('Staged state is not restored to the original visual/content state.');
  await api.publishOne();
  const after = await currentStates(api);
  const liveTarget = findTarget(after.liveState);
  const liveImageVerification = await verifyCmsImage(liveTarget.fieldData.image, source, fetchImpl, TARGET.oldImage);
  const live = compareTarget(exactlyOne(beforeLive.items, 'Before live'), liveTarget, liveImageVerification);
  const unrelated = compareUnrelated(beforeLive.items, after.liveState.items);
  const route = await verifyPublicRoute({ fetchImpl });
  const rollback = { status: live.ok && unrelated.ok ? 'published-restored' : 'published-rollback-unverified', live, unrelated, route };
  await writeJson(path.join(paths.runtime, 'rollback.json'), rollback);
  if (rollback.status !== 'published-restored') throw new PilotError('Published rollback could not be verified.', { details: rollback });
  return rollback;
}

export async function main({ argv = process.argv.slice(2), env = process.env, paths = DEFAULT_PATHS, fetchImpl = fetch } = {}) {
  const mode = argv[0];
  if (!MODES.includes(mode) || argv.length !== 1) throw new PilotError(`Usage: npm run cms:image-pilot -- <${MODES.join('|')}>`);
  await fs.mkdir(paths.runtime, { recursive: true });
  const logger = createLogger(paths.runtime);
  const prior = await loadJournal(paths.runtime);
  const retries = [];
  const attempt = {
    id: crypto.randomUUID(), mode, status: 'started', startedAt: new Date().toISOString(),
    finishedAt: null, writeAttempted: false, writeOutcome: 'not-attempted', error: null,
  };
  let journal = await updateJournal(paths.runtime, prior, {
    lastAttempt: attempt, lastAttemptStatus: 'started', finalState: prior.finalState,
  });
  const markWriteStart = async () => {
    attempt.writeAttempted = true;
    attempt.writeOutcome = 'unknown';
    journal = await updateJournal(paths.runtime, journal, { lastAttempt: { ...attempt } });
  };
  try {
    const api = new WebflowClient({ token: env.WEBFLOW_API_TOKEN, fetchImpl, onRetry: (entry) => retries.push(entry) });
    let result;
    if (mode === 'dry-run') {
      journal = await updateJournal(paths.runtime, journal, { currentPhase: 'dry-run-started', finalState: 'incomplete' });
      result = await dryRun({ api, paths, fetchImpl, logger });
      journal = await updateJournal(paths.runtime, journal, {
        currentPhase: 'dry-run-ready', lastSuccessfulPhase: 'dry-run-ready', beforeImage: TARGET.oldImage,
        beforeHostedImageHash: result.oldImage.sha256,
        localReplacementHash: { sha256: result.local.sha256, md5: result.local.md5 },
        publicRouteBefore: result.route, retryCount: journal.retryCount + retries.length,
        finalState: 'ready-for-apply-staged',
      });
      console.log(JSON.stringify(proposedChange(result.local), null, 2));
      console.log('READY FOR APPLY-STAGED');
    } else if (mode === 'apply-staged') {
      const resumable = new Set(['dry-run-ready', 'apply-staged-started', 'asset-uploaded-verified', 'staged-patch-observed', 'apply-staged-blocked']);
      if (!prior.beforeImage || !resumable.has(prior.currentPhase)) {
        throw new PilotError('A successful dry-run journal is required before apply-staged.');
      }
      journal = await updateJournal(paths.runtime, journal, { currentPhase: 'apply-staged-started', finalState: 'incomplete' });
      result = await applyStaged({ api, paths, fetchImpl, logger, onWriteStart: markWriteStart, checkpoint: async (patch) => {
        journal = await updateJournal(paths.runtime, journal, patch);
      } });
      journal = await updateJournal(paths.runtime, journal, {
        currentPhase: 'staged-verified', lastSuccessfulPhase: 'staged-verified', reconciliationRequired: false,
        uploadedAssetId: result.asset.id, uploadedAssetUrl: result.asset.hostedUrl,
        stagedPatchResult: result.patchResult,
        stagedVerificationResult: { ok: true, image: result.newImage, comparison: result.comparison },
        retryCount: journal.retryCount + retries.length, finalState: 'awaiting-publish-approval',
      });
      console.log('STAGED VERIFIED. Publish was not performed.');
      console.log('Next command after explicit approval: npm run cms:image-pilot -- publish');
    } else if (mode === 'publish') {
      result = await publish({ api, journal: prior, paths, fetchImpl,
        confirmation: env.CMS_IMG_2_PUBLISH_CONFIRM, onWriteStart: markWriteStart });
      journal = await updateJournal(paths.runtime, journal, {
        currentPhase: 'published-verified', lastSuccessfulPhase: 'published-verified', reconciliationRequired: false,
        publishResult: result.publishResult,
        liveVerificationResult: { ok: true, comparison: result.comparison, publicVerification: result.publicVerification },
        retryCount: journal.retryCount + retries.length, finalState: 'published-verified',
      });
      console.log(`PUBLISHED AND LIVE-CMS-VERIFIED. Route classification: ${result.publicVerification.classification}`);
    } else if (mode === 'verify') {
      result = await verify({ api, journal: prior, paths, fetchImpl });
      journal = await updateJournal(paths.runtime, journal, {
        retryCount: journal.retryCount + retries.length, finalState: 'verified',
      });
      console.log('VERIFIED');
    } else if (mode === 'reconcile') {
      result = await reconcile({ api, journal: prior, paths, fetchImpl });
      journal = await updateJournal(paths.runtime, journal, {
        currentPhase: 'staged-verified', lastSuccessfulPhase: 'staged-verified', reconciliationRequired: false,
        stagedVerificationResult: { ok: true, image: result.resultingStagedImage, comparison: result.staged },
        retryCount: journal.retryCount + retries.length, finalState: 'awaiting-publish-approval',
      });
      console.log('RECONCILED. Staged replacement is verified; publish was not performed.');
    } else if (mode === 'reconcile-published') {
      result = await reconcilePublished({ api, journal: prior, paths, fetchImpl });
      const reconciledAt = new Date().toISOString();
      journal = await updateJournal(paths.runtime, journal, {
        currentPhase: 'published-verified', lastSuccessfulPhase: 'published-verified', reconciliationRequired: false,
        publishResult: {
          status: 'successful-proven-through-live-cms-state', reconciledAt,
          originalPublishAttemptRetained: true, additionalPublishRequestPerformed: false,
        },
        liveVerificationResult: {
          ok: true, proof: result.proof, reconciledAt,
          comparison: { staged: result.staged, live: result.live,
            stagedUnrelated: result.stagedUnrelated, liveUnrelated: result.liveUnrelated,
            stagedLiveNonImageMatch: result.stagedLiveNonImageMatch },
          publicVerification: result.publicVerification,
        },
        stagedVerificationResult: { ok: true, image: result.resultingStagedImage, comparison: result.staged },
        retryCount: journal.retryCount + retries.length, finalState: 'published-verified',
      });
      console.log(`POST-PUBLISH RECONCILED. No publish request was performed. Route classification: ${result.publicVerification.classification}`);
    } else if (mode === 'rollback-staged') {
      await markWriteStart();
      result = await rollbackStaged({ api, paths, fetchImpl, logger });
      journal = await updateJournal(paths.runtime, journal, {
        currentPhase: 'rollback-staged-verified', lastSuccessfulPhase: 'rollback-staged-verified',
        reconciliationRequired: false, rollbackStatus: result.status,
        retryCount: journal.retryCount + retries.length, finalState: 'awaiting-rollback-publish-approval',
      });
      console.log('STAGED ROLLBACK VERIFIED. Rollback publish was not performed.');
    } else {
      await markWriteStart();
      result = await rollbackPublish({ api, paths, fetchImpl, confirmation: env.CMS_IMG_2_ROLLBACK_PUBLISH_CONFIRM });
      journal = await updateJournal(paths.runtime, journal, {
        currentPhase: 'rollback-published-verified', lastSuccessfulPhase: 'rollback-published-verified',
        reconciliationRequired: false, rollbackStatus: result.status,
        retryCount: journal.retryCount + retries.length, finalState: 'rolled-back',
      });
      console.log(`ROLLBACK PUBLISHED AND VERIFIED: ${TARGET.route}`);
    }
    const completedAttempt = { ...attempt, status: 'succeeded', finishedAt: new Date().toISOString(),
      writeOutcome: attempt.writeAttempted ? 'applied-verified' : 'not-attempted' };
    journal = await updateJournal(paths.runtime, journal, {
      lastAttempt: completedAttempt, lastAttemptStatus: 'succeeded',
      attempts: [...journal.attempts, completedAttempt],
    });
    return { ok: true, mode, result, journal };
  } catch (error) {
    const errorRecord = publicError(error);
    const writeOutcome = error?.writeOutcome && error.writeOutcome !== 'not-attempted' ? error.writeOutcome :
      (attempt.writeAttempted ? 'unknown' : 'not-attempted');
    const reconciliationRequired = journal.reconciliationRequired === true || mode === 'reconcile' ||
      mode === 'reconcile-published' ||
      writeOutcome === 'unknown' || writeOutcome === 'applied-unverified';
    const blockedAttempt = { ...attempt, status: reconciliationRequired ? 'reconciliation-required' : 'blocked',
      finishedAt: new Date().toISOString(), writeOutcome, error: errorRecord };
    const durablePhase = journal.lastSuccessfulPhase ?? prior.lastSuccessfulPhase;
    journal = await updateJournal(paths.runtime, journal, {
      currentPhase: durablePhase ?? prior.currentPhase,
      lastSuccessfulPhase: durablePhase ?? null,
      reconciliationRequired,
      lastAttempt: blockedAttempt,
      lastAttemptStatus: blockedAttempt.status,
      attempts: [...journal.attempts, blockedAttempt],
      blockedAttempts: [...journal.blockedAttempts, blockedAttempt],
      errors: [...journal.errors, errorRecord],
      retryCount: journal.retryCount + retries.length,
      finalState: reconciliationRequired ? 'reconciliation-required' : 'blocked',
    });
    await logger('pilot-blocked', { ...errorRecord, preservedDurablePhase: journal.currentPhase,
      reconciliationRequired, writeOutcome });
    console.error('BLOCKED');
    throw error;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(redact(error.message)); process.exitCode = 1; });
}
