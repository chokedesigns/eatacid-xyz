import assert from 'node:assert/strict';
import {
  __areTradedTokensRefreshedForFixture as areRefreshed,
  pollForNFTUpdate,
} from '../../shared/public-trade-ops.js';

// Two distinct CMS selections for the same verified FA2 identity. Exchange's
// cart permits them if their aggregate quantity is within the owned balance.
const selected = [
  { contractAddress: 'KT1burn', tokenId: '4', quantity: 2, startingBalance: 5 },
  { contractAddress: 'KT1burn', tokenId: '4', quantity: 1, startingBalance: 5 },
];
const holdings = balance => [{ contractAddress: 'KT1burn', tokenId: '4', balance: String(balance) }];

assert.equal(areRefreshed(holdings(5), selected), false, 'unchanged balance control');
assert.equal(areRefreshed(holdings(2), selected), true, 'all three units reflected control');
assert.equal(areRefreshed(holdings(3), selected), false,
  'two-unit reduction must not satisfy three selected units');

let reads = 0;
const observed = await pollForNFTUpdate({
  fetchNFTs: async () => holdings(++reads < 3 ? 3 : 2),
  address: 'tz1owner', tradedTokens: selected, timeout: 1000, interval: 0,
  fetchBeforePolling: true, refetchOnTimeout: true,
});
assert.equal(observed[0].balance, '2');
assert.equal(reads, 3, 'Exchange polling must pass the partial reduction and wait for all units');
console.log('Exchange duplicate identity: unchanged and partial reductions reject; full aggregate reduction accepts and polling waits');
