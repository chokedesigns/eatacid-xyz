import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import sharp from 'sharp';

import {
  WebflowCmsClient,
  compareCmsItemContent,
  compareCmsItemSets,
  compareImageContent,
  deterministicAssetFilename,
  reconcileAmbiguousMutation,
  redact,
  uploadAssetBinary,
  verifyAssetContent,
  verifyCleanPublishedState,
  verifyCmsImage,
  writeRedactedJsonAtomic,
} from './webflow-cms.mjs';

function jsonResponse(body, { status = 200, headers = {} } = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

test('client bounds GET retries and reports retry attempts', async () => {
  let calls = 0;
  const retries = [];
  const client = new WebflowCmsClient({
    token: 'secret',
    siteId: 'site',
    fetchImpl: async () => {
      calls += 1;
      if (calls < 3) return jsonResponse({}, { status: 429, headers: { 'retry-after': '0' } });
      return jsonResponse({ id: 'collection' });
    },
    sleep: async () => {},
    onRetry: (retry) => retries.push(retry),
  });

  assert.deepEqual(await client.getCollection('collection'), { id: 'collection' });
  assert.equal(calls, 3);
  assert.equal(retries.length, 2);
});

test('mutation transport ambiguity is surfaced and never blindly retried', async () => {
  let calls = 0;
  const client = new WebflowCmsClient({
    token: 'secret',
    siteId: 'site',
    fetchImpl: async () => {
      calls += 1;
      throw new Error('connection lost');
    },
  });

  await assert.rejects(
    client.patchImage('collection', 'item', 'locale', { fileId: 'asset' }),
    (error) =>
      error.code === 'AMBIGUOUS_MUTATION_OUTCOME' && error.writeOutcome === 'unknown'
  );
  assert.equal(calls, 1);
});

test('ambiguous mutation HTTP responses are not blindly retried', async () => {
  let calls = 0;
  const client = new WebflowCmsClient({
    token: 'secret',
    siteId: 'site',
    fetchImpl: async () => {
      calls += 1;
      return jsonResponse({ message: 'server failed after accepting request' }, { status: 500 });
    },
  });

  await assert.rejects(
    client.publishItems('collection', ['item']),
    (error) =>
      error.code === 'AMBIGUOUS_MUTATION_OUTCOME' && error.writeOutcome === 'unknown'
  );
  assert.equal(calls, 1);
});

test('client patches only supplied fields and publishes the exact ID set', async () => {
  const requests = [];
  const client = new WebflowCmsClient({
    token: 'secret',
    siteId: 'site',
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      return jsonResponse({ ok: true });
    },
  });

  await client.patchImage('collection', 'item', 'locale', { fileId: 'asset', url: 'https://image' });
  await client.publishItems('collection', ['item-2', 'item-1']);

  assert.deepEqual(JSON.parse(requests[0].options.body), {
    items: [
      {
        id: 'item',
        cmsLocaleId: 'locale',
        fieldData: { image: { fileId: 'asset', url: 'https://image' } },
      },
    ],
  });
  assert.deepEqual(JSON.parse(requests[1].options.body), { itemIds: ['item-2', 'item-1'] });
});

test('uploaded and CMS-normalized image identities are verified by content', async () => {
  const source = await sharp({
    create: { width: 300, height: 375, channels: 3, background: '#663399' },
  })
    .jpeg({ quality: 84, progressive: true })
    .toBuffer();
  const normalized = await sharp(source).jpeg({ quality: 85, progressive: true }).toBuffer();
  const image = { fileId: 'cms-file', url: 'https://cdn.example/normalized.jpeg', alt: null };
  const submitted = { fileId: 'library-asset', url: 'https://cdn.example/submitted.jpg', alt: null };
  const fetchImpl = async () =>
    new Response(normalized, { status: 200, headers: { 'content-type': 'image/jpeg' } });

  const result = await verifyCmsImage(image, { bytes: source }, fetchImpl, submitted);
  assert.equal(result.ok, true);
  assert.equal(result.normalization.fileIdChanged, true);
  assert.equal(result.normalization.urlChanged, true);
  assert.equal(result.normalization.submittedExtension, '.jpg');
  assert.equal(result.normalization.resultingExtension, '.jpeg');
});

test('content verification rejects changed dimensions', async () => {
  const expected = await sharp({
    create: { width: 300, height: 375, channels: 3, background: '#111111' },
  }).jpeg().toBuffer();
  const actual = await sharp({
    create: { width: 300, height: 374, channels: 3, background: '#111111' },
  }).jpeg().toBuffer();

  const result = await compareImageContent(expected, actual);
  assert.equal(result.ok, false);
  assert.equal(result.dimensionsMatch, false);
});

test('staged/live equality ignores timestamps but reports content drift', () => {
  const staged = {
    id: 'item',
    lastUpdated: '2026-01-01T00:00:00.000Z',
    lastPublished: '2026-01-01T00:00:01.000Z',
    fieldData: { name: 'Work' },
  };
  const live = {
    ...structuredClone(staged),
    lastUpdated: '2026-01-01T00:00:02.000Z',
    lastPublished: '2026-01-01T00:00:03.000Z',
  };
  assert.deepEqual(compareCmsItemContent(staged, live), { ok: true, differences: [] });
  live.fieldData.name = 'Changed';
  assert.deepEqual(compareCmsItemContent(staged, live), {
    ok: false,
    differences: ['fieldData.name'],
  });
});

test('unrelated item comparison ignores targets and timestamps but catches other drift', () => {
  const target = { id: 'target', cmsLocaleId: 'locale', fieldData: { name: 'Before' } };
  const unrelated = {
    id: 'other',
    cmsLocaleId: 'locale',
    lastUpdated: '2026-01-01T00:00:00.000Z',
    fieldData: { name: 'Other' },
  };
  const after = [
    { ...target, fieldData: { name: 'After' } },
    { ...structuredClone(unrelated), lastUpdated: '2026-01-02T00:00:00.000Z' },
  ];
  assert.deepEqual(compareCmsItemSets([target, unrelated], after, { excludeItemIds: ['target'] }), {
    ok: true,
    differences: [],
  });
  after[1].fieldData.name = 'Drifted';
  assert.equal(
    compareCmsItemSets([target, unrelated], after, { excludeItemIds: ['target'] }).ok,
    false
  );
});

test('content equality does not hide a queued staged revision', () => {
  const content = { id: 'item', isDraft: false, isArchived: false, fieldData: { name: 'Work' } };
  const staged = {
    ...content,
    lastUpdated: '2026-01-01T00:00:02.000Z',
    lastPublished: '2026-01-01T00:00:01.000Z',
  };
  const live = {
    ...content,
    lastUpdated: '2026-01-01T00:00:01.000Z',
    lastPublished: '2026-01-01T00:00:01.000Z',
  };
  assert.equal(compareCmsItemContent(staged, live).ok, true);
  assert.equal(verifyCleanPublishedState(staged, live).ok, false);
});

test('clean publication accepts harmless timestamp differences covered by publication', () => {
  const content = { id: 'item', isDraft: false, isArchived: false };
  const staged = {
    ...content,
    lastUpdated: '2026-01-01T00:00:00.000Z',
    lastPublished: '2026-01-01T00:00:03.000Z',
  };
  const live = {
    ...content,
    lastUpdated: '2026-01-01T00:00:01.000Z',
    lastPublished: '2026-01-01T00:00:02.000Z',
  };
  assert.equal(verifyCleanPublishedState(staged, live).ok, true);
});

test('ambiguous mutation reconciliation is read-only and evidence driven', async () => {
  let reads = 0;
  const result = await reconcileAmbiguousMutation({
    readState: async () => {
      reads += 1;
      return { image: 'expected' };
    },
    verifyApplied: async (state) => ({ ok: state.image === 'expected' }),
  });
  assert.equal(reads, 1);
  assert.equal(result.outcome, 'applied');
});

test('deterministic names include normalized identity, width, and content hash', () => {
  assert.equal(
    deterministicAssetFilename({
      collection: 'THE 419 SCRIPT',
      tokenId: 12,
      slug: '// 13',
      width: 300,
      sha256: 'ABCDEF0123456789abcdef0123456789',
    }),
    'the-419-script-12-13-300w-abcdef012345.jpg'
  );
});

test('presigned upload sends every field and flags unknown write outcomes', async () => {
  const metadata = {
    uploadUrl: 'https://upload.example',
    uploadDetails: { key: 'value', policy: 'sensitive' },
    originalFileName: 'image.jpg',
    contentType: 'image/jpeg',
  };
  let request;
  await uploadAssetBinary({
    metadata,
    bytes: Buffer.from('image'),
    fetchImpl: async (url, options) => {
      request = { url, options };
      return new Response('', { status: 201 });
    },
  });
  assert.equal(request.url, metadata.uploadUrl);
  assert.equal(request.options.method, 'POST');
  assert.equal(request.options.body.get('key'), 'value');
  assert.equal(request.options.body.get('policy'), 'sensitive');

  await assert.rejects(
    uploadAssetBinary({
      metadata,
      bytes: Buffer.from('image'),
      fetchImpl: async () => {
        throw new Error('connection lost');
      },
    }),
    (error) =>
      error.code === 'AMBIGUOUS_MUTATION_OUTCOME' && error.writeOutcome === 'unknown'
  );
});

test('asset verification checks deterministic name and exact uploaded bytes', async () => {
  const bytes = await sharp({
    create: { width: 10, height: 10, channels: 3, background: '#abcdef' },
  }).jpeg().toBuffer();
  const result = await verifyAssetContent({
    client: {
      getAsset: async () => ({
        id: 'asset',
        originalFileName: 'expected.jpg',
        hostedUrl: 'https://cdn.example/expected.jpg',
      }),
    },
    asset: { id: 'asset' },
    expectedBytes: bytes,
    expectedFilename: 'expected.jpg',
    fetchImpl: async () =>
      new Response(bytes, { status: 200, headers: { 'content-type': 'image/jpeg' } }),
  });
  assert.match(result.verifiedSha256, /^[a-f0-9]{64}$/);
});

test('atomic JSON writes redact credentials before persistence', async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'webflow-cms-test-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const filePath = path.join(directory, 'journal.json');
  await writeRedactedJsonAtomic(filePath, {
    token: 'secret',
    result: { id: 'safe' },
  });
  assert.deepEqual(JSON.parse(await fs.readFile(filePath, 'utf8')), {
    token: '[REDACTED]',
    result: { id: 'safe' },
  });
});

test('credential-safe diagnostics redact tokens and presigned URL fields', () => {
  const result = redact({
    authorization: 'Bearer top-secret',
    nested: { uploadUrl: 'https://upload.example?X-Amz-Signature=secret' },
    message: 'request used Bearer another-secret',
  });
  assert.equal(result.authorization, '[REDACTED]');
  assert.equal(result.nested.uploadUrl, '[REDACTED]');
  assert.equal(result.message, 'request used Bearer [REDACTED]');
});
