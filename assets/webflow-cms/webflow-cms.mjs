import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

const SECRET_KEY = /authorization|^token$|api[-_]?token|secret|signature|credential|policy|x-amz-|uploadurl/i;
const SYSTEM_TIMESTAMPS = new Set(['lastUpdated', 'lastPublished']);

export const IMAGE_EQUIVALENCE_LIMITS = Object.freeze({
  maximumNormalizedMeanAbsoluteError: 0.02,
  minimumPsnr: 30,
  maximumDifferenceHashDistance: 4,
});

export class WebflowCmsError extends Error {
  constructor(message, { code = 'BLOCKED', status, details, writeOutcome = 'not-attempted' } = {}) {
    super(message);
    this.name = 'WebflowCmsError';
    this.code = code;
    this.status = status;
    this.details = details;
    this.writeOutcome = writeOutcome;
  }
}

export const digest = (bytes, algorithm = 'sha256') =>
  crypto.createHash(algorithm).update(bytes).digest('hex');

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
    return Object.fromEntries(
      Object.entries(value).map(([childKey, child]) => [childKey, redact(child, childKey)])
    );
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
    name: error?.name ?? 'Error',
    message: error?.message ?? String(error),
    code: error?.code,
    status: error?.status,
    details: error?.details,
    writeOutcome: error?.writeOutcome,
  });
}

export async function writeRedactedJsonAtomic(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.${process.pid}.${crypto.randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporary, `${JSON.stringify(redact(value), null, 2)}\n`, 'utf8');
    await fs.rename(temporary, filePath);
  } finally {
    await fs.rm(temporary, { force: true });
  }
}

function responseRetryDelay(response, attempt) {
  const header = response.headers.get('retry-after');
  if (header) {
    const seconds = Number(header);
    if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
    const date = Date.parse(header);
    if (Number.isFinite(date)) return Math.max(0, date - Date.now());
  }
  return Math.min(500 * 2 ** attempt, 4000);
}

async function responseBody(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export class WebflowCmsClient {
  constructor({
    token,
    siteId,
    fetchImpl = fetch,
    sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
    onRetry = () => {},
    maxGetAttempts = 3,
  }) {
    if (!token) throw new WebflowCmsError('WEBFLOW_API_TOKEN is not set.');
    if (typeof siteId !== 'string' || siteId.trim() === '') {
      throw new WebflowCmsError('siteId must be a non-empty string.');
    }
    if (!Number.isSafeInteger(maxGetAttempts) || maxGetAttempts < 1) {
      throw new WebflowCmsError('maxGetAttempts must be a positive integer.');
    }
    this.token = token;
    this.siteId = siteId;
    this.fetch = fetchImpl;
    this.sleep = sleep;
    this.onRetry = onRetry;
    this.maxGetAttempts = maxGetAttempts;
    this.base = 'https://api.webflow.com/v2';
  }

  async request(method, endpoint, { body } = {}) {
    const normalizedMethod = method.toUpperCase();
    const attempts = normalizedMethod === 'GET' ? this.maxGetAttempts : 1;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      let response;
      try {
        response = await this.fetch(`${this.base}${endpoint}`, {
          method: normalizedMethod,
          headers: {
            Authorization: `Bearer ${this.token}`,
            Accept: 'application/json',
            ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
          },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        });
      } catch (error) {
        if (normalizedMethod === 'GET' && attempt + 1 < attempts) {
          const delay = 500;
          this.onRetry({ endpoint, attempt: attempt + 1, delay });
          await this.sleep(delay);
          continue;
        }
        if (normalizedMethod !== 'GET') {
          throw new WebflowCmsError(
            `Webflow ${normalizedMethod} ${endpoint} outcome is unknown: ${error.message}`,
            {
              code: 'AMBIGUOUS_MUTATION_OUTCOME',
              details: publicError(error),
              writeOutcome: 'unknown',
            }
          );
        }
        throw error;
      }

      if (normalizedMethod === 'GET' && response.status === 429 && attempt + 1 < attempts) {
        const delay = responseRetryDelay(response, attempt);
        this.onRetry({ endpoint, attempt: attempt + 1, delay });
        await this.sleep(delay);
        continue;
      }

      const parsed = await responseBody(response);
      if (!response.ok) {
        const mutationOutcomeUnknown =
          normalizedMethod !== 'GET' &&
          (response.status === 408 || response.status === 429 || response.status >= 500);
        throw new WebflowCmsError(
          `Webflow ${normalizedMethod} ${endpoint} failed with HTTP ${response.status}.`,
          {
            code: mutationOutcomeUnknown ? 'AMBIGUOUS_MUTATION_OUTCOME' : 'HTTP_ERROR',
            status: response.status,
            details: redact(parsed),
            writeOutcome:
              normalizedMethod === 'GET'
                ? 'not-attempted'
                : mutationOutcomeUnknown
                  ? 'unknown'
                  : 'not-applied',
          }
        );
      }
      return parsed;
    }
    throw new WebflowCmsError(`Webflow GET ${endpoint} exhausted retries.`, {
      code: 'GET_RETRIES_EXHAUSTED',
    });
  }

  getCollection(collectionId) {
    return this.request('GET', `/collections/${collectionId}`);
  }

  async listItems(collectionId, state = 'staged') {
    if (!['staged', 'live'].includes(state)) {
      throw new WebflowCmsError(`Unsupported CMS item state: ${state}.`);
    }
    const items = [];
    const suffix = state === 'live' ? '/live' : '';
    let total = Infinity;
    while (items.length < total) {
      const page = await this.request(
        'GET',
        `/collections/${collectionId}/items${suffix}?limit=100&offset=${items.length}`
      );
      if (!Array.isArray(page?.items)) {
        throw new WebflowCmsError(`Invalid ${state} item-list response.`);
      }
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
      const page = await this.request(
        'GET',
        `/sites/${this.siteId}/assets?limit=100&offset=${assets.length}`
      );
      if (!Array.isArray(page?.assets)) throw new WebflowCmsError('Invalid asset-list response.');
      assets.push(...page.assets);
      total = page.pagination?.total ?? assets.length;
      if (page.assets.length === 0) break;
    }
    return assets;
  }

  getAsset(assetId) {
    return this.request('GET', `/assets/${assetId}`);
  }

  createAsset(fileName, fileHash) {
    return this.request('POST', `/sites/${this.siteId}/assets`, {
      body: { fileName, fileHash },
    });
  }

  patchItemFields(collectionId, itemId, localeId, fieldData) {
    return this.request('PATCH', `/collections/${collectionId}/items?skipInvalidFiles=false`, {
      body: { items: [{ id: itemId, cmsLocaleId: localeId, fieldData }] },
    });
  }

  patchImage(collectionId, itemId, localeId, image) {
    return this.patchItemFields(collectionId, itemId, localeId, { image });
  }

  publishItems(collectionId, itemIds) {
    if (!Array.isArray(itemIds) || itemIds.length === 0 || new Set(itemIds).size !== itemIds.length) {
      throw new WebflowCmsError('publishItems requires a non-empty set of unique item IDs.');
    }
    return this.request('POST', `/collections/${collectionId}/items/publish`, {
      body: { itemIds: [...itemIds] },
    });
  }
}

export function deterministicAssetFilename({ collection, tokenId, slug, width, sha256 }) {
  const clean = (value, label) => {
    const result = String(value ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    if (!result) throw new WebflowCmsError(`${label} cannot be normalized into an asset name.`);
    return result;
  };
  if (!Number.isSafeInteger(width) || width < 1) throw new WebflowCmsError('width must be positive.');
  if (!/^[a-f0-9]{12,}$/i.test(String(sha256 ?? ''))) {
    throw new WebflowCmsError('sha256 must contain at least 12 hexadecimal characters.');
  }
  return `${clean(collection, 'collection')}-${clean(tokenId, 'tokenId')}-${clean(slug, 'slug')}-${width}w-${sha256.slice(0, 12).toLowerCase()}.jpg`;
}

export async function downloadImage(url, fetchImpl = fetch) {
  let response;
  try {
    response = await fetchImpl(url, { method: 'GET', headers: { Accept: 'image/*' } });
  } catch (error) {
    throw new WebflowCmsError(`Image download failed before an HTTP response: ${error.message}`);
  }
  if (!response.ok) throw new WebflowCmsError(`Image download failed with HTTP ${response.status}.`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.length) throw new WebflowCmsError('Image download returned empty bytes.');
  let metadata;
  try {
    metadata = await sharp(bytes, { failOn: 'error' }).metadata();
  } catch (error) {
    throw new WebflowCmsError(`Downloaded bytes do not decode as an image: ${error.message}`);
  }
  return {
    bytes,
    sha256: digest(bytes),
    status: response.status,
    contentType: response.headers.get('content-type'),
    metadata: { format: metadata.format, width: metadata.width, height: metadata.height },
  };
}

async function comparablePixels(bytes) {
  return sharp(bytes, { failOn: 'error' })
    .rotate()
    .flatten({ background: '#fff' })
    .toColourspace('srgb')
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
}

async function differenceHash(bytes) {
  const pixels = await sharp(bytes, { failOn: 'error' })
    .rotate()
    .flatten({ background: '#fff' })
    .greyscale()
    .resize(9, 8, { fit: 'fill' })
    .raw()
    .toBuffer();
  return Array.from({ length: 64 }, (_, index) =>
    pixels[index + Math.floor(index / 8) + 1] >= pixels[index + Math.floor(index / 8)] ? '1' : '0'
  ).join('');
}

export async function compareImageContent(expectedBytes, actualBytes) {
  const [expectedMetadata, actualMetadata, expectedPixels, actualPixels, expectedHash, actualHash] =
    await Promise.all([
      sharp(expectedBytes, { failOn: 'error' }).metadata(),
      sharp(actualBytes, { failOn: 'error' }).metadata(),
      comparablePixels(expectedBytes),
      comparablePixels(actualBytes),
      differenceHash(expectedBytes),
      differenceHash(actualBytes),
    ]);
  const expected = {
    format: expectedMetadata.format,
    width: expectedMetadata.width,
    height: expectedMetadata.height,
  };
  const actual = {
    format: actualMetadata.format,
    width: actualMetadata.width,
    height: actualMetadata.height,
  };
  const formatMatches = expected.format === actual.format;
  const dimensionsMatch =
    expectedPixels.info.width === actualPixels.info.width &&
    expectedPixels.info.height === actualPixels.info.height &&
    expectedPixels.info.channels === actualPixels.info.channels;
  const byteExact = digest(expectedBytes) === digest(actualBytes);
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
  const metrics = {
    meanAbsoluteError,
    normalizedMeanAbsoluteError,
    rootMeanSquaredError,
    psnr,
    differenceHashDistance,
  };
  const perceptuallyEquivalent =
    normalizedMeanAbsoluteError <= IMAGE_EQUIVALENCE_LIMITS.maximumNormalizedMeanAbsoluteError &&
    (psnr === null || psnr >= IMAGE_EQUIVALENCE_LIMITS.minimumPsnr) &&
    differenceHashDistance <= IMAGE_EQUIVALENCE_LIMITS.maximumDifferenceHashDistance;
  return {
    ok: formatMatches && (byteExact || perceptuallyEquivalent),
    byteExact,
    perceptuallyEquivalent,
    formatMatches,
    dimensionsMatch,
    expected,
    actual,
    metrics,
  };
}

function imageExtension(url) {
  try {
    return path.extname(new URL(url).pathname).toLowerCase();
  } catch {
    return null;
  }
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
  try {
    hosted = await downloadImage(image.url, fetchImpl);
  } catch (error) {
    return {
      ok: false,
      image,
      shape,
      retrievable: false,
      retrievalError: publicError(error),
      content: null,
    };
  }
  const content = await compareImageContent(source.bytes, hosted.bytes);
  const normalization = submittedImage
    ? {
        fileIdChanged: image.fileId !== submittedImage.fileId,
        urlChanged: image.url !== submittedImage.url,
        submittedExtension: imageExtension(submittedImage.url),
        resultingExtension: imageExtension(image.url),
      }
    : null;
  return {
    ok: content.ok,
    image,
    shape,
    retrievable: true,
    hosted: {
      sha256: hosted.sha256,
      bytes: hosted.bytes.length,
      status: hosted.status,
      contentType: hosted.contentType,
      metadata: hosted.metadata,
    },
    source: {
      sha256: source.sha256 ?? digest(source.bytes),
      bytes: source.bytes.length,
      metadata: source.metadata,
    },
    content,
    normalization,
  };
}

export async function uploadAssetBinary({ metadata, bytes, fetchImpl = fetch }) {
  if (!metadata?.uploadUrl || !metadata?.uploadDetails || !metadata?.originalFileName) {
    throw new WebflowCmsError('Asset metadata lacks presigned upload details.');
  }
  const form = new FormData();
  for (const [key, value] of Object.entries(metadata.uploadDetails)) form.append(key, String(value));
  form.append(
    'file',
    new Blob([bytes], { type: metadata.contentType ?? 'image/jpeg' }),
    metadata.originalFileName
  );
  let response;
  try {
    response = await fetchImpl(metadata.uploadUrl, { method: 'POST', body: form });
  } catch (error) {
    throw new WebflowCmsError(`Asset byte upload outcome is unknown: ${error.message}`, {
      code: 'AMBIGUOUS_MUTATION_OUTCOME',
      writeOutcome: 'unknown',
    });
  }
  if (response.status !== 201) {
    throw new WebflowCmsError(`Asset byte upload failed with HTTP ${response.status}.`, {
      status: response.status,
      writeOutcome: 'not-applied',
    });
  }
  return { status: response.status };
}

function assetNameMatches(asset, filename) {
  return (
    asset?.originalFileName === filename ||
    asset?.displayName === filename ||
    asset?.displayName?.endsWith(`_${filename}`)
  );
}

export async function verifyAssetContent({
  client,
  asset,
  expectedBytes,
  expectedFilename,
  fetchImpl = fetch,
}) {
  if (!asset?.id) throw new WebflowCmsError('Asset verification requires an asset ID.');
  const current = await client.getAsset(asset.id);
  if (expectedFilename && !assetNameMatches(current, expectedFilename)) {
    throw new WebflowCmsError(`Asset ${asset.id} filename mismatch.`);
  }
  const url = current.hostedUrl ?? asset.hostedUrl ?? asset.assetUrl;
  if (!url) throw new WebflowCmsError(`Asset ${asset.id} lacks a hosted URL.`);
  const downloaded = await downloadImage(url, fetchImpl);
  const expectedSha256 = digest(expectedBytes);
  if (downloaded.sha256 !== expectedSha256) {
    throw new WebflowCmsError(`Asset ${asset.id} content hash mismatch.`);
  }
  return { ...current, hostedUrl: url, verifiedSha256: expectedSha256 };
}

export function withoutSystemTimestamps(value) {
  if (Array.isArray(value)) return value.map(withoutSystemTimestamps);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !SYSTEM_TIMESTAMPS.has(key))
        .map(([key, child]) => [key, withoutSystemTimestamps(child)])
    );
  }
  return value;
}

export function diffPaths(before, after, prefix = '') {
  if (stable(before) === stable(after)) return [];
  if (!before || !after || typeof before !== 'object' || typeof after !== 'object') {
    return [prefix || '$'];
  }
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...keys]
    .sort()
    .flatMap((key) => diffPaths(before[key], after[key], prefix ? `${prefix}.${key}` : key));
}

export function compareCmsItemContent(staged, live) {
  const stagedContent = withoutSystemTimestamps(staged);
  const liveContent = withoutSystemTimestamps(live);
  return {
    ok: stable(stagedContent) === stable(liveContent),
    differences: diffPaths(stagedContent, liveContent),
  };
}

export function compareCmsItemSets(beforeItems, afterItems, { excludeItemIds = [] } = {}) {
  const excluded = new Set(excludeItemIds);
  const normalized = (items) =>
    [...items]
      .filter((item) => !excluded.has(item.id))
      .sort((left, right) =>
        `${left.id}:${left.cmsLocaleId}`.localeCompare(`${right.id}:${right.cmsLocaleId}`)
      )
      .map(withoutSystemTimestamps);
  const before = normalized(beforeItems);
  const after = normalized(afterItems);
  return { ok: stable(before) === stable(after), differences: diffPaths(before, after) };
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
  const timestampsValid = [
    stagedLastUpdated,
    stagedLastPublished,
    liveLastUpdated,
    liveLastPublished,
  ].every((timestamp) => timestamp !== null);
  const stagedUpdatedNotAfterPublished = timestampsValid && stagedLastUpdated <= stagedLastPublished;
  const liveUpdatedNotAfterPublished = timestampsValid && liveLastUpdated <= liveLastPublished;
  const publicationMarkersCoverAllUpdates =
    timestampsValid &&
    Math.max(stagedLastUpdated, liveLastUpdated) <=
      Math.min(stagedLastPublished, liveLastPublished);
  const publishedFlagsClean =
    staged?.isDraft === false &&
    live?.isDraft === false &&
    staged?.isArchived === false &&
    live?.isArchived === false;
  return {
    ok:
      lastPublishedPresent &&
      timestampsValid &&
      stagedUpdatedNotAfterPublished &&
      liveUpdatedNotAfterPublished &&
      publicationMarkersCoverAllUpdates &&
      publishedFlagsClean,
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

export async function readCollectionStates(client, collectionId) {
  const [staged, live] = await Promise.all([
    client.listItems(collectionId, 'staged'),
    client.listItems(collectionId, 'live'),
  ]);
  return { staged, live };
}

export async function reconcileAmbiguousMutation({ readState, verifyApplied }) {
  if (typeof readState !== 'function' || typeof verifyApplied !== 'function') {
    throw new WebflowCmsError('Reconciliation requires readState and verifyApplied functions.');
  }
  const state = await readState();
  const verification = await verifyApplied(state);
  const outcome = verification?.ok === true
    ? 'applied'
    : verification?.definitive === true
      ? 'not-applied'
      : 'unresolved';
  return { outcome, state, verification };
}
