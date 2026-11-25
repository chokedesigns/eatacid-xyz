import assert from 'node:assert/strict';
import params from '../../shared/drop-params/drop-params.js';
import { validateDropParams } from '../../shared/drop-params/drop-params-authoring.mjs';
import { fetchTokenPairId } from '../../shared/public-trade-ops.js';
import { normalize } from '../../admin-ui/src/features/drops/drops.data.js';
import { buildItems } from '../../admin-ui/src/features/drops/drops.builder.js';
import { evaluateDropStatus } from '../../admin-ui/src/features/drops/drops.pairs.status.js';
import { getLiveCfg } from '../../admin-ui/src/utils/live-cfg.js';
import { load, pairWriteDependencies } from '../../admin-ui/tests/runtime/treasury.fixture.mjs';

// Native production normalization, builder, paged Admin API, status classifier
// and Public resolver; only HTTP and checklist DOM rendering are inert.
// No wallet, live read, write, permission request or transaction occurs.
assert.equal(validateDropParams(params).ok, true);
const cfg = getLiveCfg();
const norm = normalize(params);
const items = buildItems(norm, { startId: 100 });
assert.ok(items.length > 1);
const rows = items.map((item, index) => ({ id: index + 1, active: true,
  key: String(item.token_pair_id), value: {
    burn_contract_address: cfg.collections[item.burn.collection],
    burn_token_id: String(item.burn.tokenId), burn_amount: String(item.burn.amount),
    redeem_contract_address: cfg.collections[item.redeem.collection],
    redeem_token_id: String(item.redeem.tokenId), redeem_amount: String(item.redeem.amount),
  } }));
const first = rows[0].value;
const terms = { tzktBase: cfg.tzktBase, escrowAddress: cfg.escrow,
  burnContractAddress: first.burn_contract_address, burnTokenId: first.burn_token_id,
  burnAmount: first.burn_amount, redeemContractAddress: first.redeem_contract_address,
  redeemTokenId: first.redeem_token_id, redeemAmount: first.redeem_amount };
let served = rows;
let requests = 0;
const originalFetch = globalThis.fetch;
const originalError = console.error;
const diagnostics = [];
globalThis.fetch = async url => {
  const parsed = new URL(url);
  assert.equal(parsed.origin, new URL(cfg.tzktBase).origin);
  assert.equal(parsed.pathname, `/v1/contracts/${cfg.escrow}/bigmaps/token_mapping/keys`);
  assert.equal(parsed.searchParams.get('active'), 'true');
  assert.equal(parsed.searchParams.get('offset'), '0');
  requests++;
  return { ok: true, json: async () => structuredClone(served) };
};
console.error = (...args) => diagnostics.push(args.map(String).join(' '));
try {
  const control = await evaluateDropStatus({ norm, items });
  assert.equal(control.status, 'full');
  assert.equal(await fetchTokenPairId(terms), '100');

  // set_token_pairs permits identical six-term mappings at different unused IDs.
  // A manual Set Pair can produce this state. The drop panel's full-status
  // Send lock is preserved: this proof does not bypass that UI lock.
  const sends = [];
  const ops = load('escrow-ops', { ...pairWriteDependencies(),
    getLiveCfg: () => cfg, verifyAdminActiveAccount: value => value,
    window: { dAppClient: {
      getActiveAccount: async () => ({ address: 'inert-admin', network: { type: 'shadownet' } }),
      requestOperation: async request => { sends.push(request); return { transactionHash: 'inert-hash' }; },
    } },
  });
  const unusedId = '500';
  assert.ok(rows.every(row => row.key !== unusedId));
  await ops.setTokenPairs([{ token_pair_id: unusedId, ...first }], cfg.escrow);
  assert.equal(sends.length, 1);
  assert.equal(sends[0].operationDetails[0].parameters.entrypoint, 'set_token_pairs');
  assert.equal(sends[0].operationDetails[0].parameters.value[0].args[0].int, unusedId);
  served = [...rows, { ...structuredClone(rows[0]), id: rows.length + 1, key: '500' }];
  const duplicate = await evaluateDropStatus({ norm, items });
  assert.equal(duplicate.status, 'full');
  assert.equal(duplicate.matchedCount, items.length);
  const dots = [];
  const checklist = load('features/drops/drops.checklist.controller', {
    document: { addEventListener() {}, getElementById() { return null; } },
    window: { addEventListener() {} },
    getLiveCfg: () => cfg,
    setChecklistDot: (name, state) => dots.push([name, state]),
    assertChecklistNeutralInvariant() {}, debug() {}, logWarn() {},
  });
  // Seed only the current published lifecycle used by the production consumer.
  checklist.__norm = norm;
  checklist.__summary = duplicate;
  const vm = await import('node:vm');
  vm.runInContext('__latestNorm = __norm; __countdownPhase = "pre"; updatePairsOnChainFromStatus(__summary);', checklist);
  assert.ok(dots.some(([name, state]) => name === 'pairsOnChain' && state === 'ok'));
  assert.equal(await fetchTokenPairId(terms), null);
  assert.ok(diagnostics.some(text => text.includes('Ambiguous token pair')));

  // A duplicate at an unused ID for every term blocks the entire drop, while
  // the existing contiguous block continues to score as fully set.
  served = [...rows, ...rows.map((row, index) => ({ ...structuredClone(row),
    id: rows.length + index + 1, key: String(500 + index) }))];
  assert.equal((await evaluateDropStatus({ norm, items })).status, 'full');
  for (const row of rows) {
    assert.equal(await fetchTokenPairId({ ...terms, burnTokenId: row.value.burn_token_id }), null);
  }
  served = rows; // Removing just the extra mappings restores Public resolution.
  assert.equal(await fetchTokenPairId(terms), '100');
  assert.equal((await evaluateDropStatus({ norm, items })).status, 'full');
  assert.equal(requests, 7 + items.length);
  console.log(JSON.stringify({ control: 'full / Public resolves 100',
    duplicate: 'full / green pairsOnChain / Public rejects ambiguity',
    allDuplicated: `${items.length} Public resolutions blocked`,
    repairedControl: 'full / Public resolves 100', expectedPairs: items.length, requests,
    inertPairRequests: sends.length }));
} finally {
  globalThis.fetch = originalFetch;
  console.error = originalError;
}
