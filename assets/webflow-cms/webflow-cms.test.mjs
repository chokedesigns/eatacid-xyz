import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import sharp from 'sharp';

import {
  WebflowCmsClient,
  WebflowCmsError,
  compareCmsItemContent,
  compareCmsItemSets,
  compareImageContent,
  deterministicAssetFilename,
  publicError,
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

function unreadableResponse(status, error) {
  return new Response(new ReadableStream({
    start(controller) { controller.error(error); },
  }), { status });
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

test('mutation body-read failures preserve HTTP evidence and never retry', async () => {
  const mutations = [
    (client) => client.createAsset('image.jpg', 'hash'),
    (client) => client.patchImage('collection', 'item', 'locale', { fileId: 'asset' }),
    (client) => client.publishItems('collection', ['item']),
  ];
  for (const mutate of mutations) {
    for (const status of [200, 201, 202, 302, 400, 401, 403, 404, 422, 408, 429, 500, 503]) {
      let calls = 0;
      const rejected = [400, 401, 403, 404, 422].includes(status);
      const client = new WebflowCmsClient({
        token: 'inert', siteId: 'site',
        fetchImpl: async () => {
          calls += 1;
          return unreadableResponse(status, new Error('body stream lost'));
        },
        sleep: async () => assert.fail('mutations must not retry'),
        onRetry: () => assert.fail('mutations must not retry'),
      });
      await assert.rejects(mutate(client), (error) => {
        assert.ok(error instanceof WebflowCmsError);
        assert.equal(error.status, status);
        assert.equal(error.code, rejected ? 'HTTP_ERROR' : 'AMBIGUOUS_MUTATION_OUTCOME');
        assert.equal(error.writeOutcome, rejected ? 'not-applied' : 'unknown');
        return true;
      });
      assert.equal(calls, 1);
    }
  }
});

test('readable mutation HTTP failures keep status-based outcomes without retrying', async () => {
  for (const status of [302, 400, 403, 422, 408, 429, 500, 503]) {
    let calls = 0;
    const rejected = [400, 403, 422].includes(status);
    const client = new WebflowCmsClient({
      token: 'inert', siteId: 'site',
      fetchImpl: async () => {
        calls += 1;
        return jsonResponse({ message: 'HTTP evidence' }, { status });
      },
    });
    await assert.rejects(client.publishItems('collection', ['item']), (error) => {
      assert.ok(error instanceof WebflowCmsError);
      assert.equal(error.status, status);
      assert.equal(error.code, rejected ? 'HTTP_ERROR' : 'AMBIGUOUS_MUTATION_OUTCOME');
      assert.equal(error.writeOutcome, rejected ? 'not-applied' : 'unknown');
      assert.deepEqual(error.details, { message: 'HTTP evidence' });
      return true;
    });
    assert.equal(calls, 1);
  }
});

test('GET transport and rate-limit retries remain bounded; other read failures stay intact', async () => {
  for (const failure of ['transport', 429, 503]) {
    let calls = 0;
    let retries = 0;
    const transportError = new Error('read connection lost');
    const client = new WebflowCmsClient({
      token: 'inert', siteId: 'site', maxGetAttempts: 2,
      fetchImpl: async () => {
        calls += 1;
        if (failure === 'transport') throw transportError;
        return jsonResponse({ message: 'read failed' }, { status: failure });
      },
      sleep: async () => {},
      onRetry: () => { retries += 1; },
    });
    await assert.rejects(client.getCollection('collection'), (error) => {
      if (failure === 'transport') assert.equal(error, transportError);
      else {
        assert.equal(error.status, failure);
        assert.equal(error.code, 'HTTP_ERROR');
        assert.equal(error.writeOutcome, 'not-attempted');
        assert.deepEqual(error.details, { message: 'read failed' });
      }
      return true;
    });
    assert.equal(calls, failure === 503 ? 1 : 2);
    assert.equal(retries, failure === 503 ? 0 : 1);
  }

  for (const status of [200, 400, 503]) {
    const bodyError = new Error('unreadable GET body');
    let calls = 0;
    const client = new WebflowCmsClient({
      token: 'inert', siteId: 'site',
      fetchImpl: async () => { calls += 1; return unreadableResponse(status, bodyError); },
    });
    await assert.rejects(client.getCollection('collection'), (error) => error === bodyError);
    assert.equal(calls, 1);
  }
});

test('normal JSON, text and empty successful responses retain parsing behavior', async () => {
  for (const method of ['GET', 'POST', 'PATCH']) {
    for (const [body, expected] of [['{"id":"asset"}', { id: 'asset' }], ['accepted', 'accepted'], ['', null]]) {
      const client = new WebflowCmsClient({
        token: 'inert', siteId: 'site',
        fetchImpl: async () => new Response(body, { status: 200 }),
      });
      assert.deepEqual(await client.request(method, '/inert'), expected);
    }
  }
});

test('proven request preparation and validation failures are not attempted', async () => {
  let calls = 0;
  const fetchImpl = async () => { calls += 1; assert.fail('preparation must finish before fetch'); };
  const client = new WebflowCmsClient({ token: 'inert', siteId: 'site', fetchImpl });
  const circular = {};
  circular.self = circular;
  for (const operation of [
    () => client.request('POST', '/inert', { body: circular }),
    () => client.publishItems('collection', []),
    () => uploadAssetBinary({ metadata: {}, bytes: Buffer.from('inert'), fetchImpl }),
    () => uploadAssetBinary({
      metadata: {
        uploadUrl: 'https://inert.invalid', originalFileName: 'image.jpg',
        uploadDetails: { policy: { toString() { throw new Error('secret policy'); } } },
      },
      bytes: Buffer.from('inert'), fetchImpl,
    }),
  ]) {
    await assert.rejects(async () => operation(), (error) => {
      assert.ok(error instanceof WebflowCmsError);
      assert.equal(error.writeOutcome, 'not-attempted');
      assert.doesNotMatch(JSON.stringify(publicError(error)), /secret policy/);
      return true;
    });
  }
  assert.equal(calls, 0);
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

  assert.deepEqual(await client.patchImage('collection', 'item', 'locale', { fileId: 'asset', url: 'https://image' }), { ok: true });
  assert.deepEqual(await client.publishItems('collection', ['item-2', 'item-1']), { ok: true });
  assert.deepEqual(await client.createAsset('image.jpg', 'hash'), { ok: true });

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
  assert.deepEqual(JSON.parse(requests[2].options.body), { fileName: 'image.jpg', fileHash: 'hash' });
  assert.deepEqual(requests.map(({ url }) => url), [
    'https://api.webflow.com/v2/collections/collection/items?skipInvalidFiles=false',
    'https://api.webflow.com/v2/collections/collection/items/publish',
    'https://api.webflow.com/v2/sites/site/assets',
  ]);
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
  for (const [verification, outcome] of [
    [{ ok: true, definitive: true }, 'applied'],
    [{ ok: false, definitive: true }, 'not-applied'],
    [{ ok: false }, 'unresolved'],
    [null, 'unresolved'],
  ]) {
    const state = { image: 'observed' };
    const reconciled = await reconcileAmbiguousMutation({
      readState: async () => { reads += 1; return state; },
      verifyApplied: async (observed) => {
        assert.equal(observed, state);
        return verification;
      },
    });
    assert.deepEqual(reconciled, { outcome, state, verification });
  }
  assert.equal(reads, 5);
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
  const result = await uploadAssetBinary({
    metadata,
    bytes: Buffer.from('image'),
    fetchImpl: async (url, options) => {
      request = { url, options };
      return new Response('', { status: 201 });
    },
  });
  assert.deepEqual(result, { status: 201 });
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

test('presigned upload HTTP failures distinguish rejection from missing completion evidence', async () => {
  const metadata = {
    uploadUrl: 'https://inert.invalid/upload', uploadDetails: { key: 'inert' },
    originalFileName: 'image.jpg',
  };
  for (const status of [200, 202, 204, 302, 400, 403, 422, 408, 429, 500, 503]) {
    let calls = 0;
    const rejected = [400, 403, 422].includes(status);
    await assert.rejects(uploadAssetBinary({
      metadata, bytes: Buffer.from('inert'),
      fetchImpl: async () => { calls += 1; return new Response(null, { status }); },
    }), (error) => {
      assert.ok(error instanceof WebflowCmsError);
      assert.equal(error.status, status);
      assert.equal(error.code, rejected ? 'BLOCKED' : 'AMBIGUOUS_MUTATION_OUTCOME');
      assert.equal(error.writeOutcome, rejected ? 'not-applied' : 'unknown');
      return true;
    });
    assert.equal(calls, 1);
  }
});

test('public and persisted mutation errors omit secret transport and body-read details', async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'webflow-cms-errors-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const uploadUrl = 'https://inert.invalid/private-upload?X-Amz-Signature=signature-secret';
  const privateMessage = `raw-token policy-secret credential-secret Bearer bearer-secret ${uploadUrl}`;
  const metadata = {
    uploadUrl, uploadDetails: { policy: 'policy-secret', credential: 'credential-secret' },
    originalFileName: 'image.jpg',
  };
  const failures = [
    () => uploadAssetBinary({
      metadata, bytes: Buffer.from('inert'),
      fetchImpl: async () => { throw new Error(privateMessage); },
    }),
    ...['transport', 200, 403, 503].map((failure) => () => new WebflowCmsClient({
      token: 'raw-token', siteId: 'site',
      fetchImpl: async () => {
        if (failure === 'transport') throw new Error(privateMessage);
        return unreadableResponse(failure, new Error(privateMessage));
      },
    }).publishItems('collection', ['item'])),
    () => new WebflowCmsClient({
      token: 'raw-token', siteId: 'site',
      fetchImpl: async () => jsonResponse({
        token: 'raw-token', authorization: 'Bearer bearer-secret', uploadUrl,
        uploadDetails: { policy: 'policy-secret', credential: 'credential-secret' },
      }, { status: 400 }),
    }).createAsset('image.jpg', 'hash'),
  ];
  for (const [index, operation] of failures.entries()) {
    let captured;
    await assert.rejects(operation(), (error) => {
      captured = error;
      assert.ok(error instanceof WebflowCmsError);
      const exposed = JSON.stringify(publicError(error));
      assert.doesNotMatch(error.message, /raw-token|policy-secret|credential-secret|bearer-secret|signature-secret|private-upload/);
      assert.doesNotMatch(exposed, /raw-token|policy-secret|credential-secret|bearer-secret|signature-secret|private-upload/);
      return true;
    });
    const filePath = path.join(directory, `${index}.json`);
    await writeRedactedJsonAtomic(filePath, publicError(captured));
    assert.doesNotMatch(await fs.readFile(filePath, 'utf8'), /raw-token|policy-secret|credential-secret|bearer-secret|signature-secret|private-upload/);
  }
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
