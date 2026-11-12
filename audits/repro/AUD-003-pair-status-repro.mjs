import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { exactTokenId, compareTokenIds } from '../../admin-ui/src/features/drops/utils/token-id.js';
import { createProductionDropParamsProvider, validateProviderParams } from '../../admin-ui/src/features/drops/drop-params.provider.js';
import { normalize } from '../../admin-ui/src/features/drops/drops.data.js';
import { buildItems } from '../../admin-ui/src/features/drops/drops.builder.js';
import { getLiveCfg } from '../../admin-ui/src/utils/live-cfg.js';

const src = path => readFileSync(new URL(`../../admin-ui/src/${path}.js`, import.meta.url), 'utf8')
  .replace(/^import\s[\s\S]*?;\s*/gm, '')
  .replace(/^export default\s*\{[\s\S]*?^\};\s*/gm, '')
  .replace(/export default /g, '').replace(/export /g, '');
const raw = structuredClone(createProductionDropParamsProvider().getSnapshot().params);
const expectedId = '9007199254740993';
raw.redeemToken.tokenId = expectedId;
assert.equal(validateProviderParams(raw), true, 'current producer accepts exact large ID');
const norm = normalize(raw);
const items = buildItems(norm, { startId: 10 });
assert.ok(items.length > 0);
assert.equal(items[0].redeem.tokenId, expectedId, 'normalizer and builder preserve exact ID');
const cfg = getLiveCfg();
let chainRedeemId;
const realm = vm.createContext({ console, exactTokenId, compareTokenIds,
  getLiveCfg: () => cfg, hasDropsConfigConfigured: () => true,
  getTokenPairs: async () => items.map(item => ({ key: String(item.token_pair_id), value: {
    burn_contract_address: cfg.collections[item.burn.collection],
    burn_token_id: String(item.burn.tokenId), burn_amount: String(item.burn.amount),
    redeem_contract_address: cfg.collections[item.redeem.collection],
    redeem_token_id: chainRedeemId, redeem_amount: String(item.redeem.amount),
  } })), logWarn() {}, debug() {} });
vm.runInContext(src('features/drops/utils/validate-translation-audit'), realm);
vm.runInContext(src('features/drops/drops.pairs.status'), realm);
chainRedeemId = expectedId;
const exact = await realm.evaluateDropStatus({ norm, items });
assert.equal(exact.status, 'full', 'exact large-ID control');
assert.equal(exact.matchedCount, items.length);
chainRedeemId = '9007199254740992';
const rounded = await realm.evaluateDropStatus({ norm, items });
assert.equal(rounded.status, 'full',
  'different adjacent large ID is falsely classified full');
assert.equal(rounded.matchedCount, items.length);
chainRedeemId = '29';
assert.equal((await realm.evaluateDropStatus({ norm, items })).status, 'missing', 'safe differing-ID control');
console.log(`pair status: ${items.length} exact pairs full, ${items.length} adjacent wrong-ID pairs falsely full, safe mismatch missing`);
