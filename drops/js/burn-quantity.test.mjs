import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import { pollForNFTUpdate } from '../../shared/public-trade-ops.js';

// Execute the current page functions with inert DOM, wallet and indexer boundaries.
const source = readFileSync(new URL('./events.js', import.meta.url), 'utf8').replace(/\r\n?/g, '\n');
function section(start, end) {
  const begin = source.indexOf(start);
  assert.ok(begin >= 0, `Missing source anchor: ${start}`);
  const finish = source.indexOf(end, begin);
  assert.ok(finish > begin, `Missing source end: ${end}`);
  return source.slice(begin, finish);
}
function fixture({ amount = 2, balance = 5, redeemAmount = 3, enabled = true, fail = false, confirmFail = false } = {}) {
  const approvals = []; const operations = []; const refreshes = []; const errors = [];
  const details = {};
  const config = [{ collection: 'HEN', enabled, exclude: [], burnAmount: amount }];
  const context = vm.createContext({
    burnTokens: config, collections: { HEN: 'burn-contract' },
    redeemToken: { collection: 'CANAAN', tokenId: '7', redeemAmount }, REDEEM_CONTRACT_ADDRESS: 'redeem-contract',
    BURN_REDEEM_CONTRACT_ADDRESS: 'escrow', network: 'testnet', networkConfigAvailable: true,
    normalizeString: value => String(value ?? '').trim().toLowerCase(),
    logger: { log() {} }, console: { error: (...args) => errors.push(args), warn() {} },
    getVerifiedPublicActiveAccount: async () => ({ address: 'inert-wallet' }),
    getSelectedEventTokenWithBalance: () => ({ contractAddress: 'burn-contract', tokenId: '4', oldBalance: balance }),
    buildApprovalOps: async (_, cart) => { approvals.push(structuredClone(cart)); return [{ kind: 'approval' }]; },
    fetchTokenPairId: async () => 10,
    window: { dAppClient: { requestOperation: async payload => {
      operations.push(payload); if (fail) throw new Error('fixture contract rejection');
      return { transactionHash: 'inert-hash' };
    } } },
    showModal: (title, message) => { details.title = title; details.message = message; }, hideModal() {},
    document: { querySelector: selector => selector === '.loading-modal-div' ? { querySelector: () => null } : null },
    setTimeout() {}, resetEventsUI() {}, pollForConfirmation: async () => {
      if (confirmFail) throw new Error('fixture contract rejection at confirmation');
    },
    pollForNFTUpdate: async (_, tokens) => { refreshes.push(structuredClone(tokens)); return []; },
    walletRefreshGeneration: 1, synchronizedWalletAddress: 'inert-wallet',
    walletHoldingsRequest: 0, confirmedDropsTrades: new Map(), dropsBalanceRefreshFailed: false,
    renderWalletTokenLoadingState() {}, updateAppState() {}, updateEventCartBurnToken() {}, clearInterval() {},
    isCurrentWalletProjection: () => true, refreshConnectedState() {},
  });
  const helper = source.includes('function getBurnAmountForContract(')
    ? section('function getBurnAmountForContract(', '/**\n * Returns the one selected') : '';
  vm.runInContext(helper + section('function assertDropsTradeBalances(', 'async function retryDropsBalances(') +
    section('let eventExchangeInFlight', '// UI STATE TOGGLING:'), context);
  return { context, config, approvals, operations, refreshes, errors, details,
    send: () => context.handleEventExchange() };
}
function terms(f) {
  const ops = f.operations[0].operationDetails;
  const trade = ops.at(-1);
  assert.equal(ops[0].kind, 'approval');
  assert.equal(trade.destination, 'escrow');
  assert.equal(trade.parameters.entrypoint, 'initiate_trade');
  assert.equal(trade.parameters.value.length, 1, 'One exchange is one trade, even for burn > 1');
  const [left, right] = trade.parameters.value[0].args;
  return [left.args[0].args[1].string, left.args[1].args[0].int, left.args[0].args[0].int,
    right.args[0].args[0].string, right.args[0].args[1].int, left.args[1].args[1].int];
}

test('FIND-P2-003: authored burn2 matches exact pair terms and refresh delta', async () => {
  const f = fixture(); await f.send();
  assert.deepEqual(terms(f), ['burn-contract', '4', '2', 'redeem-contract', '7', '3']);
  assert.equal(f.approvals[0][0].quantity, 2);
  assert.equal(f.refreshes[0][0].quantity, 2);
  assert.equal(f.refreshes[0][0].startingBalance, 5);
  assert.equal(f.errors.length, 0);
});
test('Public burn1 and burn5 retain one trade and the configured redeem amount', async () => {
  for (const amount of [1, 5]) {
    const f = fixture({ amount, balance: 6 }); await f.send();
    assert.equal(terms(f)[2], String(amount));
    assert.equal(f.refreshes[0][0].quantity, amount);
  }
});
test('Public mechanics preview displays the same authored quantity as the trade', async () => {
  for (const amount of [1, 2, 5]) {
    const f = fixture({ amount, balance: 6 }); await f.send();
    const nodes = new Map(['burn-amount', 'burn-collection', 'redeem-amount', 'redeem-collection']
      .map(key => [`.drop-details-${key}-text`, {}]));
    f.context.document = { querySelector: selector => nodes.get(selector) };
    vm.runInContext(section('function updateDropMechanics(', '/**\n * Updates the exclusions'), f.context);
    f.context.updateDropMechanics();
    assert.equal(nodes.get('.drop-details-burn-amount-text').innerHTML, `x${terms(f)[2]}`);
    assert.equal(nodes.get('.drop-details-redeem-amount-text').innerHTML, `x${terms(f)[5]}`);
  }
});
test('Public invalid amounts, disabled burns and insufficient holdings never request an operation', async () => {
  for (const amount of [undefined, null, 0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '2', 'x2', true]) {
    const f = fixture(); f.config[0].burnAmount = amount; await f.send();
    assert.equal(f.operations.length, 0, `burn amount ${String(amount)}`);
    assert.equal(f.approvals.length, 0);
    assert.equal(f.details.title, 'ERROR');
  }
  for (const options of [{ enabled: false }, { balance: 1 }, { balance: NaN }, { redeemAmount: 1.5 }]) {
    const f = fixture(options); await f.send(); assert.equal(f.operations.length, 0);
  }
});
test('Public wallet eligibility requires the configured amount', async () => {
  const f = fixture(); let count;
  Object.assign(f.context, {
    document: { querySelector: () => null }, window: { cmsRowsByCollection: { HEN: [] } },
    renderWalletTokenLoadingState() {}, updateEventCartBurnToken() {},
    getCollectionSlug: () => 'hen', resolveBurnTokenRenderIdentities: () => [], updateOwnedTokenCounts() {},
    renderConnectedWalletTokenState: value => { count = value; }, tokenMapping: { HEN: {} },
  });
  vm.runInContext(section('async function updateTokensWithWalletData(', '// EVENT CART UPDATES'), f.context);
  await f.context.updateTokensWithWalletData([1, 2, 3].map((balance, id) => ({
    contractAddress: 'burn-contract', tokenId: String(id), balance,
  })));
  assert.equal(count, 2);
  f.config[0].burnAmount = 1.5;
  await f.context.updateTokensWithWalletData([{ contractAddress: 'burn-contract', tokenId: '1', balance: 3 }]);
  assert.equal(count, 0);
});
test('Shared NFT polling waits for the full configured burn delta', async () => {
  let reads = 0;
  const nfts = await pollForNFTUpdate({ address: 'inert-wallet', timeout: 1000, interval: 0,
    tradedTokens: [{ contractAddress: 'burn-contract', tokenId: '4', startingBalance: 5, quantity: 2 }],
    fetchNFTs: async () => [{ contractAddress: 'burn-contract', tokenId: '4', balance: ++reads === 1 ? 4 : 3 }],
  });
  assert.equal(reads, 2); assert.equal(nfts[0].balance, 3);
});
test('Public confirmed refresh removes insufficient burn holdings and retains owned non-burn rows', async () => {
  const f = fixture(); let eligibleCount;
  const makeRow = (contractAddress, tokenId) => ({ dataset: { contractAddress, tokenId }, removed: false,
    remove() { this.removed = true; } });
  const rows = [makeRow('burn-contract', '1'), makeRow('burn-contract', '2'), makeRow('redeem-contract', '7')];
  Object.assign(f.context, {
    document: { querySelectorAll: selector => selector === '.w-dyn-item[data-token-id]' ? rows
      : rows.filter(row => !row.removed && row.dataset.contractAddress === 'burn-contract') },
    renderWalletTokenLoadingState() {}, setEventContractAndTokenAttributes() {}, updateOwnedTokenCounts() {},
    computeBalances: () => ({ 'burn-contract:1': 1, 'burn-contract:2': 2, 'redeem-contract:7': 3 }),
    updateEventCartBurnToken() {}, getCollectionSlug: () => 'hen',
    renderConnectedWalletTokenState: count => { eligibleCount = count; },
    updateTokensWithWalletData: async () => {},
  });
  vm.runInContext(section('async function refreshConnectedState(', '// HELPERS: REDEEM'), f.context);
  await f.context.refreshConnectedState([]);
  assert.equal(rows[0].removed, true); assert.equal(rows[1].removed, false);
  assert.equal(rows[2].removed, false, 'Owned metadata/redeem rows retain their previous behavior');
  assert.equal(eligibleCount, 1);
});
test('Public reports contract rejection, skips refresh and releases its send guard', async () => {
  const f = fixture({ fail: true }); await f.send(); await f.send();
  assert.equal(f.operations.length, 2); assert.equal(f.refreshes.length, 0);
  assert.match(f.details.message, /contract rejection/);
});
test('Public rejected confirmation does not claim success or refresh holdings', async () => {
  const f = fixture({ confirmFail: true }); await f.send(); await f.send();
  assert.equal(f.operations.length, 2); assert.equal(f.refreshes.length, 0);
  assert.equal(f.details.title, 'ERROR'); assert.match(f.details.message, /rejection at confirmation/);
});
