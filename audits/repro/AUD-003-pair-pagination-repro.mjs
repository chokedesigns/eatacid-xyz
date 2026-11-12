import assert from 'node:assert/strict';
import { createProductionDropParamsProvider } from '../../admin-ui/src/features/drops/drop-params.provider.js';
import { normalize } from '../../admin-ui/src/features/drops/drops.data.js';
import { buildItems } from '../../admin-ui/src/features/drops/drops.builder.js';
import { evaluateDropStatus } from '../../admin-ui/src/features/drops/drops.pairs.status.js';
import { getTokenPairs } from '../../admin-ui/src/tzkt-api.js';
import { getLiveCfg } from '../../admin-ui/src/utils/live-cfg.js';

const cfg = getLiveCfg();
const norm = normalize(createProductionDropParamsProvider().getSnapshot().params);
const items = buildItems(norm, { startId: cfg.pairIdRanges.drops.start });
assert.ok(items.length > 0);
const rows = items.map(item => ({ key: String(item.token_pair_id), value: {
  burn_contract_address: cfg.collections[item.burn.collection],
  burn_token_id: String(item.burn.tokenId), burn_amount: String(item.burn.amount),
  redeem_contract_address: cfg.collections[item.redeem.collection],
  redeem_token_id: String(item.redeem.tokenId), redeem_amount: String(item.redeem.amount),
} }));
const originalFetch = globalThis.fetch;
let body = rows;
try {
  globalThis.fetch = async () => new Response(JSON.stringify(body), { status: 200 });
  assert.equal((await getTokenPairs(cfg.escrow, cfg.pairsMapPath)).length, rows.length);
  const valid = await evaluateDropStatus({ norm, items });
  assert.equal(valid.status, 'full', 'valid TzKT rows control');
  body = 'bad'; // HTTP 200 JSON string is iterable but not a key-row array.
  assert.deepEqual(await getTokenPairs(cfg.escrow, cfg.pairsMapPath), ['b', 'a', 'd']);
  const malformed = await evaluateDropStatus({ norm, items });
  assert.equal(malformed.status, 'missing', 'malformed success is falsely treated as no pairs');
  console.log(`pair pagination: ${rows.length} valid rows full; malformed JSON string falsely missing`);
} finally {
  globalThis.fetch = originalFetch;
}
