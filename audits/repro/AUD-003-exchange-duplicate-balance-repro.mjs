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
assert.equal(areRefreshed(holdings(3), selected), true,
  'two-unit reduction is incorrectly accepted for three selected units');

let reads = 0;
const observed = await pollForNFTUpdate({
  fetchNFTs: async () => { reads++; return holdings(3); },
  address: 'tz1owner', tradedTokens: selected, timeout: 30, interval: 1,
  fetchBeforePolling: true, refetchOnTimeout: true,
});
assert.equal(observed[0].balance, '3');
assert.equal(reads, 2, 'Exchange configuration returns on first stale reduction');
console.log('Exchange duplicate identity: unchanged and fully reduced controls pass; two of three units reflected is accepted and polling returns early');
