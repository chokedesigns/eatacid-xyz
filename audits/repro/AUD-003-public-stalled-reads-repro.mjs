import assert from 'node:assert/strict';
import { mock } from 'node:test';
import { pollForConfirmation, pollForNFTUpdate } from '../../shared/public-trade-ops.js';

const flush = () => new Promise(setImmediate);
const originalFetch = globalThis.fetch;
mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 0 });
try {
  globalThis.fetch = async () => new Response(JSON.stringify([{ status: 'applied' }]), { status: 200 });
  await pollForConfirmation({ tzktBase: 'https://inert.invalid', opHash: 'inert', timeout: 20, interval: 1 });
  const confirmedNFTs = await pollForNFTUpdate({
    fetchNFTs: async () => [{ contractAddress: 'KT1burn', tokenId: '4', balance: '3' }],
    address: 'tz1owner', tradedTokens: [{ contractAddress: 'KT1burn', tokenId: '4', quantity: 2, startingBalance: 5 }],
    timeout: 20, interval: 1,
  });
  assert.equal(confirmedNFTs[0].balance, '3', 'updated balance control');

  for (const stage of ['fetch', 'json', 'http-text']) {
    let signal;
    const stalled = () => new Promise(() => {});
    globalThis.fetch = (_url, init) => {
      signal = init.signal;
      return stage === 'fetch' ? stalled() : Promise.resolve(stage === 'json'
        ? { ok: true, json: stalled } : { ok: false, status: 503, text: stalled });
    };
    let settled = false;
    const start = Date.now();
    const checked = assert.rejects(pollForConfirmation({
      tzktBase: 'https://inert.invalid', opHash: 'inert', timeout: 20, interval: 1,
    }), error => {
      assert.match(error.message, /^Transaction confirmation timed out\./);
      assert.notEqual(error.code, 'PUBLIC_TRADE_FAILED');
      return true;
    }).then(() => { settled = true; });
    await flush(); mock.timers.tick(19); await flush(); assert.equal(settled, false);
    mock.timers.tick(1); await flush();
    assert.equal(settled, true, `${stage} obeys the overall deadline`);
    await checked;
    assert.equal(Date.now() - start, 20); assert.equal(signal.aborted, true);
  }
  // The generic helper remains outside this confirmation remediation. Its live
  // Public fetchNFTs adapter bounds each page separately; retain this distinction.
  let balanceSettled = false;
  void pollForNFTUpdate({
    fetchNFTs: () => new Promise(() => {}), address: 'tz1owner',
    tradedTokens: [{ contractAddress: 'KT1burn', tokenId: '4', quantity: 2, startingBalance: 5 }],
    timeout: 20, interval: 1,
  }).then(() => { balanceSettled = true; }, () => { balanceSettled = true; });
  mock.timers.tick(75); await flush();
  assert.equal(balanceSettled, false, 'generic balance callback remains outside this remediation');
  console.log('public confirmation: applied control succeeds; stalled fetch/JSON/HTTP body reads time out at 20ms as unknown and abort; generic NFT helper unchanged');
} finally {
  globalThis.fetch = originalFetch;
  mock.timers.reset();
}
