// Inert current-source reproduction: no Webflow network request or mutation.
import assert from 'node:assert/strict';
import { WebflowCmsClient } from '../../assets/webflow-cms/webflow-cms.mjs';

const first = Array.from({ length: 100 }, (_, index) => ({
  id: `id-${index}`,
  cmsLocaleId: 'locale',
}));

function response(key, rows, total) {
  return new Response(JSON.stringify({
    [key]: rows,
    ...(total === undefined ? {} : { pagination: { total, limit: 100, offset: 0 } }),
  }), { status: 200 });
}

async function exercise(key, method) {
  let calls = 0;
  const valid = new WebflowCmsClient({
    token: 'inert', siteId: 'site',
    fetchImpl: async () => {
      calls += 1;
      return calls === 1 ? response(key, first, 101) : response(key, [{ id: 'id-100', cmsLocaleId: 'locale' }], 101);
    },
  });
  const complete = await valid[method](...(method === 'listItems' ? ['collection'] : []));
  assert.equal((key === 'items' ? complete.items : complete).length, 101);
  assert.equal(calls, 2);

  calls = 0;
  const missingPagination = new WebflowCmsClient({
    token: 'inert', siteId: 'site',
    fetchImpl: async () => { calls += 1; return response(key, first); },
  });
  const truncated = await missingPagination[method](...(method === 'listItems' ? ['collection'] : []));
  assert.equal((key === 'items' ? truncated.items : truncated).length, 100);
  assert.equal(calls, 1);
  if (key === 'items') assert.equal(truncated.pagination.total, 100);

  calls = 0;
  const earlyEmpty = new WebflowCmsClient({
    token: 'inert', siteId: 'site',
    fetchImpl: async () => {
      calls += 1;
      return calls === 1 ? response(key, first, 101) : response(key, [], 101);
    },
  });
  const incomplete = await earlyEmpty[method](...(method === 'listItems' ? ['collection'] : []));
  assert.equal((key === 'items' ? incomplete.items : incomplete).length, 100);
  assert.equal(calls, 2);
  if (key === 'items') assert.equal(incomplete.pagination.total, 101);

  return { validCount: 101, missingPaginationCount: 100, earlyEmptyCount: 100 };
}

console.log(JSON.stringify({
  stagedItems: await exercise('items', 'listItems'),
  siteAssets: await exercise('assets', 'listAssets'),
}));
