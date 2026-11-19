import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { Parser } from '@taquito/michel-codec';
import { ParameterSchema } from '@taquito/michelson-encoder';
import * as shared from '../../shared/public-trade-ops.js';
import { load, pairWriteDependencies } from '../../admin-ui/tests/runtime/treasury.fixture.mjs';

// AUD-005 adaptation: current pair authority fixture dependencies supplied. Historical probe preserved.
// Decoder compatibility only: this does not compile SmartPy, typecheck or execute
// Michelson, prove address validity, or establish any deployed contract identity.
const root = new URL('../../', import.meta.url);
const code = new Parser().parseScript(readFileSync(new URL('contracts/burn-redeem-escrow/artifacts/burn-redeem-escrow-audited.tz', root), 'utf8'));
function annotated(node, name) {
  return node.annots?.includes(`%${name}`) ? node : node.args?.map(child => annotated(child, name)).find(Boolean);
}
const parameter = code.find(node => node.prim === 'parameter');
const decode = op => new ParameterSchema(annotated(parameter, op.parameters.entrypoint)).Execute(op.parameters.value);
const calls = [];
const escrow = 'KT1HMCqYqyP9fTDjzm8KAfyPhFn3tpmSW4kc';
const burn = 'KT1GnVnQvvb7R6h4EhveBmN17ysaTuGRDoWW';
const redeem = 'KT1GCvVdxELA4mPUn4DiBpPAd8ARRtyoEpke';
const account = { address: 'tz1burnburnburnburnburnburnburjAYjjX' };
const ops = load('escrow-ops', { ...pairWriteDependencies(),
  getLiveCfg: () => ({ network: 'testnet', tzktBase: 'https://inert.invalid' }),
  verifyAdminActiveAccount: value => value,
  requestTreasuryOperation: (_, send) => send(), requestPauseOperation: (_, send) => send(),
  window: { dAppClient: { getActiveAccount: async () => account,
    requestOperation: async request => { calls.push(...request.operationDetails); return { transactionHash: 'inert' }; } } },
});
const huge = '900719925474099312345';
const pair = { token_pair_id: huge, burn_contract_address: burn, burn_token_id: huge, burn_amount: '2',
  redeem_contract_address: redeem, redeem_token_id: '29', redeem_amount: '3' };
await ops.setTokenPairs([pair], escrow);
await ops.updateTokenPair({ ...pair, burn_contract: burn, redeem_contract: redeem }, escrow);
await ops.cleanupTokenPairs([huge, '0'], escrow);
await ops.togglePause(escrow);
await ops.adminWithdrawXtz({ amountMutez: '1000001' }, escrow);
await ops.adminBatchTransferTokens({ to: account.address, items: [{ contract: redeem, tokenId: huge, amount: '3' }] }, escrow);
for (const op of calls) {
  const result = decode(op);
  assert.ok(result !== undefined);
  console.log(`${op.parameters.entrypoint}: current Admin payload decoded`);
}
const set = decode(calls[0])[0];
assert.equal(set.token_pair_id.toString(), huge);
assert.equal(set.burn_token_id.toString(), huge);
assert.equal(set.redeem_amount.toString(), '3');

// Reuse the maintained fixture's production-handler extraction, rather than
// hand-constructing a second implementation of either public trade serializer.
const source = readFileSync(new URL('shared/public-trade-pairs.test.mjs', root), 'utf8');
const slice = (start, end) => source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)));
const realm = vm.createContext({ ...shared, assert, readFileSync, vm, sourceRoot: root,
  structuredClone, URL, console, globalThis,
  intended: { tzktBase: 'https://inert.tzkt.test', escrowAddress: 'KT1Escrow',
    burnContractAddress: 'KT1Burn', burnTokenId: '0', burnAmount: 2,
    redeemContractAddress: 'KT1Redeem', redeemTokenId: '29', redeemAmount: 3 },
});
vm.runInContext(slice('function pair(', 'async function boundary(')
  + slice('async function boundary(', "test('FIND-P2-018")
  + slice('function section(', "test('Drops caller resolves"), realm);
for (const surface of ['drops', 'exchange']) {
  const rows = surface === 'drops' ? [realm.pair()] : [realm.pair('15', {
    burn_amount: '1', redeem_contract_address: 'KT1ExchangeRedeem', redeem_token_id: '0', redeem_amount: '10',
  })];
  const f = realm.consumer(surface, { rows });
  await f.run();
  assert.equal(f.errors.length, 0);
  assert.equal(f.sent.length, 1, 'current public handler must reach the inert wallet seam');
  const trade = f.sent[0].operationDetails.find(op => op.parameters?.entrypoint === 'initiate_trade');
  const result = decode(trade);
  assert.equal(result.length, surface === 'drops' ? 1 : 2);
  assert.equal(result[0].burn_amount.toString(), surface === 'drops' ? '2' : '1');
  assert.equal(result[0].redeem_amount.toString(), surface === 'drops' ? '3' : '10');
  assert.equal(result[0].user_wallet, 'inert-wallet');
  console.log(`${surface}: current public trade payload decoded, amounts and user preserved`);
}
