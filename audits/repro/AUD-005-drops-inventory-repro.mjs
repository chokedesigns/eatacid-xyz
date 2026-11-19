import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as shared from '../../shared/public-trade-ops.js';
import params from '../../shared/drop-params/drop-params.js';
import { validateDropParams } from '../../shared/drop-params/drop-params-authoring.mjs';

assert.equal(validateDropParams({ ...params, redeemToken: { ...params.redeemToken, redeemAmount: 3 } }, { operation: 'active' }).ok, true,
  'redeem amount 3 is supported by current authoring/runtime compatibility validation');

// Reuse the maintained real-handler extraction. Only test fixture setup is
// loaded; its test registrations and assertions are not executed here.
const source = readFileSync(new URL('../../drops/js/events.js', import.meta.url), 'utf8').replace(/\r\n?/g, '\n');
const helperSource = readFileSync(new URL('../../drops/js/burn-quantity.test.mjs', import.meta.url), 'utf8');
const begin = helperSource.indexOf('function section(');
const end = helperSource.indexOf("test('FIND-P2-003");
assert.ok(begin >= 0 && end > begin);
const realm = vm.createContext({ ...shared, assert, source, vm, structuredClone });
vm.runInContext(helperSource.slice(begin, end), realm);
for (const supply of [0, 1, 2, 3, 4]) {
  const fixture = realm.fixture({ redeemAmount: 3 });
  fixture.context.AppState.redeemSupply = supply;
  vm.runInContext(realm.section('function computeExchangeButtonState(', '/**\n * Renders the exchange button'), fixture.context);
  const button = fixture.context.computeExchangeButtonState({ walletConnected: true, selectedTokenId: '4',
    countdownPhase: 'live', contractPaused: false, redeemSupply: supply });
  await fixture.send();
  const sent = fixture.operations.length;
  assert.equal(sent, supply > 0 ? 1 : 0);
  assert.equal(typeof button.clickAction === 'function', supply > 0);
  if (sent) assert.equal(realm.terms(fixture)[5], '3');
  console.log(JSON.stringify({ supply, required: 3, actionable: typeof button.clickAction === 'function', walletRequests: sent,
    sufficient: supply >= 3 }));
}
console.log('Confirmed: zero blocks, sufficient inventory sends, positive inventory below the configured redeem amount still enables and sends. No chain execution was simulated.');
