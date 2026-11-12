import assert from 'node:assert/strict';
import { pollForConfirmation, pollForNFTUpdate } from '../../shared/public-trade-ops.js';

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const bounded = async promise => Promise.race([promise.then(() => 'settled', () => 'settled'), wait(75).then(() => 'pending')]);
const originalFetch = globalThis.fetch;
try {
  globalThis.fetch = async () => new Response(JSON.stringify([{ status: 'applied' }]), { status: 200 });
  await pollForConfirmation({ tzktBase: 'https://inert.invalid', opHash: 'inert', timeout: 20, interval: 1 });
  const confirmedNFTs = await pollForNFTUpdate({
    fetchNFTs: async () => [{ contractAddress: 'KT1burn', tokenId: '4', balance: '3' }],
    address: 'tz1owner', tradedTokens: [{ contractAddress: 'KT1burn', tokenId: '4', quantity: 2, startingBalance: 5 }],
    timeout: 20, interval: 1,
  });
  assert.equal(confirmedNFTs[0].balance, '3', 'updated balance control');

  globalThis.fetch = () => new Promise(() => {});
  assert.equal(await bounded(pollForConfirmation({
    tzktBase: 'https://inert.invalid', opHash: 'inert', timeout: 20, interval: 1,
  })), 'pending', 'confirmation read does not obey the 20ms overall timeout');
  // The generic helper also waits for its fetch callback, but the active
  // Public fetchNFTs adapter has a separate 15s-per-page deadline. This is
  // helper behavior, not evidence of an indefinitely stalled active pager.
  assert.equal(await bounded(pollForNFTUpdate({
    fetchNFTs: () => new Promise(() => {}), address: 'tz1owner',
    tradedTokens: [{ contractAddress: 'KT1burn', tokenId: '4', quantity: 2, startingBalance: 5 }],
    timeout: 20, interval: 1,
  })), 'pending', 'balance read does not obey the 20ms overall timeout');
  console.log('public polls: valid controls settle; confirmation fetch stalls; generic balance callback outlives its helper deadline');
} finally {
  globalThis.fetch = originalFetch;
}
