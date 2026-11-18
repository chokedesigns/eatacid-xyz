// Inert current-source reproduction: no Webflow network request or mutation.
import assert from 'node:assert/strict';
import { WebflowCmsClient, WebflowCmsError } from '../../assets/webflow-cms/webflow-cms.mjs';

const first = Array.from({ length: 100 }, (_, index) => ({
  id: `id-${index}`,
  cmsLocaleId: 'locale',
}));

function response(key, rows, total, offset = 0) {
  return new Response(JSON.stringify({
    [key]: rows,
    ...(total === undefined ? {} : { pagination: { total, limit: 100, offset } }),
  }), { status: 200 });
}

async function exercise(key, method, state) {
  const args = method === 'listItems' ? ['collection', state] : [];
  let calls = 0;
  const valid = new WebflowCmsClient({
    token: 'inert', siteId: 'site',
    fetchImpl: async () => {
      calls += 1;
      return calls === 1 ? response(key, first, 101) : response(key, [{ id: 'id-100', cmsLocaleId: 'locale' }], 101, 100);
    },
  });
  const complete = await valid[method](...args);
  assert.equal((key === 'items' ? complete.items : complete).length, 101);
  assert.equal(calls, 2);

  calls = 0;
  const missingPagination = new WebflowCmsClient({
    token: 'inert', siteId: 'site',
    fetchImpl: async () => { calls += 1; return response(key, first); },
  });
  await assert.rejects(missingPagination[method](...args), WebflowCmsError);
  assert.equal(calls, 1);

  calls = 0;
  const earlyEmpty = new WebflowCmsClient({
    token: 'inert', siteId: 'site',
    fetchImpl: async () => {
      calls += 1;
      return calls === 1 ? response(key, first, 101) : response(key, [], 101, 100);
    },
  });
  await assert.rejects(earlyEmpty[method](...args), WebflowCmsError);
  assert.equal(calls, 2);

  return { validCount: 101, missingPaginationRejected: true, earlyEmptyRejected: true };
}

console.log(JSON.stringify({
  stagedItems: await exercise('items', 'listItems', 'staged'),
  liveItems: await exercise('items', 'listItems', 'live'),
  siteAssets: await exercise('assets', 'listAssets'),
}));
