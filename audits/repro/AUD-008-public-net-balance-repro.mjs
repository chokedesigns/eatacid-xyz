import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import {
  createSubmittedTradeStore,
  areTradedTokensRefreshed,
  __getOperationConfirmationForFixture,
  classifyPublicTradeRequestRejection,
  showSubmittedTradeStatus,
} from '../../shared/public-trade-ops.js';
import { fetchFa2BalancePages } from '../../shared/tzkt-fa2-balances.js';

// Real journal, confirmation classifier, complete balance reader and both page
// admission gates. No chain, wallet, filesystem state or production fix.
function section(file, start, end) {
  const source = readFileSync(new URL(file, import.meta.url), 'utf8');
  const first = source.indexOf(start), last = source.indexOf(end, first);
  assert.ok(first >= 0 && last > first, `Production anchors: ${file}`);
  return source.slice(first, last);
}
const scope = { network: 'testnet', tzktBase: 'https://inert.invalid',
  escrowAddress: 'escrow', account: 'owner' };
const intent = [{ contractAddress: 'burn-fa2', tokenId: '4',
  quantity: 1, startingBalance: 1 }];
const pair = (left, right) => ({ prim: 'Pair', args: [left, right] });
const int = value => ({ int: String(value) });
const string = value => ({ string: value });
const operation = { destination: scope.escrowAddress,
  kind: 'transaction', amount: '0', parameters: { entrypoint: 'initiate_trade', value: [
    pair(pair(pair(int(1), string('burn-fa2')), pair(int(4), int(1))),
      pair(pair(string('redeem-fa2'), int(29)), pair(int(7), string(scope.account)))),
  ] } };
const memory = new Map();
const store = createSubmittedTradeStore({
  storage: () => ({ get length() { return memory.size; },
    key: i => [...memory.keys()][i], getItem: k => memory.get(k),
    setItem: (k, v) => memory.set(k, v), removeItem: k => memory.delete(k) }),
  locks: () => ({ request: async (_name, options, callback) => (callback || options)({}) }),
});
let record = store.reserve(scope, [operation], intent);
record = store.submitted(record, 'applied-trade-hash');
await store.reconcile(record, async (hash, submittedTrade) => {
  const result = __getOperationConfirmationForFixture([{
    id: 1, hash, sender: { address: scope.account }, type: 'transaction',
    target: { address: scope.escrowAddress }, parameter: { entrypoint: 'initiate_trade' },
    status: 'applied',
  }], { submittedTrade });
  assert.equal(result.applied, true, 'Actual classifier accepts the complete applied receipt');
});
assert.equal(store.get(scope).status, 'applied');

const drops = vm.createContext({
  confirmedDropsTrades: new Map([[scope.account, store.get(scope).tradedTokens]]),
  synchronizedWalletAddress: scope.account,
  normalizeString: value => String(value).trim().toLowerCase(),
});
vm.runInContext(section('../../drops/js/events.js',
  'function assertDropsTradeBalances(', 'async function retryDropsBalances('), drops);
const exchange = vm.createContext({ areTradedTokensRefreshed });
vm.runInContext(section('../../exchange/js/exchange.js',
  'function assertTradedBalancesRefreshed(', '// -----------------------------------------------------'), exchange);

async function currentHoldings(balance) {
  // A full, successful page from the real reader. Its value represents a fresh
  // ledger: starting 1 - applied burn 1 + incoming transfer 1 = current 1.
  const rows = await fetchFa2BalancePages({ ...scope, baseUrl: scope.tzktBase,
    fetchImpl: async () => ({ ok: true, json: async () => [{ id: 1, balance,
      token: { tokenId: '4', contract: { address: 'burn-fa2' } } }] }),
  });
  return rows.map(row => ({ contractAddress: row.token.contract.address,
    tokenId: row.token.tokenId, balance: row.balance }));
}
const afterBurnOnly = await currentHoldings('0');
const afterBurnAndIncoming = await currentHoldings('1');
for (const [name, gate] of [
  ['Drops', rows => drops.assertDropsTradeBalances(rows)],
  ['Exchange', rows => exchange.assertTradedBalancesRefreshed(rows, store.get(scope).tradedTokens)],
]) {
  assert.doesNotThrow(() => gate(afterBurnOnly), `${name}: burn-only control admits verified balances`);
  for (let retry = 0; retry < 3; retry++) {
    assert.throws(() => gate(afterBurnAndIncoming), /still updating/,
      `${name}: fresh balance containing incoming token remains blocked on retry ${retry}`);
    assert.equal(store.get(scope).status, 'applied', 'Only admitted projection clears the retained receipt');
  }
  assert.doesNotThrow(() => gate([...afterBurnOnly,
    { contractAddress: 'another-fa2', tokenId: '4', balance: '1' }]),
  `${name}: different-identity incoming transfer does not block`);
}
// Reuse the existing maintained full-Exchange-module seam without registering
// its test suite. Preserve its production module load, DOM and caller wiring.
const fixtureUrl = new URL('../../exchange/js/exchange-wallet.test.mjs', import.meta.url);
const fixtureSource = readFileSync(fixtureUrl, 'utf8');
const fixtureEnd = fixtureSource.indexOf('\nfunction unavailable(h)');
assert.ok(fixtureEnd > 0, 'Maintained Exchange fixture boundary');
const fixtureContext = vm.createContext({ assert, readFileSync, vm, URL, setImmediate,
  process: { env: {} }, fetchFa2BalancePages, createSubmittedTradeStore,
  classifyPublicTradeRequestRejection, showSubmittedTradeStatus, areTradedTokensRefreshed });
vm.runInContext(fixtureSource.slice(0, fixtureEnd)
  .replace(/^import .*;\r?$/gm, '')
  .replaceAll('import.meta.url', JSON.stringify(fixtureUrl.href)), fixtureContext);
async function fullExchange(incomingSameToken) {
  const storage = new Map();
  const h = fixtureContext.fixture({ storage });
  await h.connect();
  h.select('1');
  // Real complete-reader integration remains in the maintained fixture; this
  // response is the ledger after the burn plus the independent incoming move.
  h.fetchRows = async () => [{ balance: incomingSameToken ? '1' : '0',
    contractAddress: 'KT1419', tokenId: '0' }];
  h.confirm = async options => assert.equal(__getOperationConfirmationForFixture([{
    id: 1, hash: options.opHash, type: 'transaction', status: 'applied',
    sender: { address: 'wallet-A' }, target: { address: 'KT1Escrow' },
    parameter: { entrypoint: 'initiate_trade' },
  }], { submittedTrade: options.submittedTrade }).applied, true);
  await h.trade();
  assert.equal(h.sent.length, 1);
  if (!incomingSameToken) {
    assert.equal(storage.size, 0, 'Full handler control releases its applied receipt');
    return;
  }
  const retained = () => h.call('submittedTrades.get(submittedTradeScope())');
  assert.equal(retained().status, 'applied');
  assert.equal(h.dropdowns[0].disabled, true, 'Fresh current holdings remain unavailable');
  for (let retry = 0; retry < 3; retry++) {
    await h.context.retryExchangeBalances();
    assert.equal(retained().status, 'applied');
    assert.equal(h.dropdowns[0].disabled, true);
  }
  h.disconnect(); await h.connect();
  assert.equal(retained().status, 'applied', 'Reconnect does not recover fresh incoming balance');
  const reloaded = fixtureContext.fixture({ storage });
  reloaded.fetchRows = h.fetchRows;
  await reloaded.connect();
  assert.equal(reloaded.call('submittedTrades.get(submittedTradeScope())').status, 'applied');
  assert.equal(reloaded.dropdowns[0].disabled, true, 'Reload restores the blocked projection');
  await h.trade();
  assert.equal(h.sent.length, 1, 'No further trade can be sent from the affected surface');
}
await fullExchange(false);
await fullExchange(true);
console.log('AUD-008 net-balance reproduction: both real gates reject fresh same-token incoming balances. Full Exchange send/confirmation/retry/reconnect/reload retains the applied record and blocks later sends; burn-only and different-token controls pass.');
