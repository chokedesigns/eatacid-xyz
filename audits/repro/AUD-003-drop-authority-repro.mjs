import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { exactTokenId, compareTokenIds } from '../../admin-ui/src/features/drops/utils/token-id.js';
import { createDropsWallet } from '../../admin-ui/tests/runtime/drops-wallet.fixture.mjs';

// Reuse the existing inert fixture's full current sender, normalizer, builder,
// state, and serializer. Wallet SDK and TzKT are the controlled boundaries.
const testUrl = new URL('../../admin-ui/tests/runtime/drops-send-invalidation.test.mjs', import.meta.url);
const testSource = readFileSync(testUrl, 'utf8');
const start = testSource.indexOf('function load(path, globals = {})');
const end = testSource.indexOf('\nfunction bindWallet(f)', start);
assert.ok(start >= 0 && end > start);
const prelude = testSource.slice(start, end).replace(
  'new URL(`../../src/${path}.js`, import.meta.url)',
  'new URL(`../../src/${path}.js`, auditBase)',
);
const realm = { assert, readFileSync, URL, auditBase: testUrl, vm, console, Event,
  CustomEvent, EventTarget, AbortController, setTimeout, clearTimeout,
  exactTokenId, compareTokenIds, structuredClone, setImmediate, createDropsWallet };
vm.runInNewContext(`${prelude}\nglobalThis.auditFixture = fixture; globalThis.auditLoad = load;`, realm);

async function run(accounts) {
  const f = realm.auditFixture();
  f.cfg.escrow = 'KT1HMCqYqyP9fTDjzm8KAfyPhFn3tpmSW4kc';
  f.ready();
  await f.wallet.emitAccount(accounts[0]);
  const calls = [], requests = [];
  let active = accounts[0];
  const adapter = realm.auditLoad('escrow-ops', {
    getLiveCfg: () => f.cfg,
    verifyAdminActiveAccount: f.beacon.verifyAdminActiveAccount,
    window: { dAppClient: {
      getActiveAccount: async () => {
        calls.push(active.address);
        if (calls.length === 1) active = accounts[1];
        return calls.length === 1 ? accounts[0] : active;
      },
      requestOperation: async payload => {
        requests.push({ signer: active.address, payload: structuredClone(payload) });
        return { transactionHash: `inert-${requests.length}` };
      },
    } },
  });
  f.deps.ensureAccount = adapter.ensureAccount;
  f.deps.setTokenPairs = adapter.setTokenPairs;
  f.deps.waitForOperation = async () => false; // stop after the first request
  await f.send();
  assert.deepEqual(calls, [accounts[0].address, accounts[1].address]);
  assert.equal(f.wallet.captures, 1);
  assert.equal(f.wallet.releases, 1);
  return { requests, f };
}

const A = { address: 'tz1hcAYJhEB9n6ezLFcbuejzZ821zrL1c3vW', network: { type: 'shadownet' } };
const B = { address: 'tz1dpaqpwKqPSft4SFvd5tA9bx7iDUNHnVsz', network: { type: 'shadownet' } };
const changed = await run([A, B]);
assert.equal(changed.requests.length, 0,
  'the original A-read then B-recheck scenario must never hand the prepared batch to B');
assert.equal(changed.f.state.sendHistory[0].invalidated, true);
assert.equal(changed.f.state.sendHistory[0].batches[0].status, 'error');
assert.equal(changed.f.statuses.some(([msg]) => msg === 'Drop pairs confirmed on-chain.'), false);
const stable = await run([A, A]);
assert.equal(stable.requests.length, 1);
assert.equal(stable.requests[0].signer, A.address, 'unchanged-wallet control submits normally');
assert.equal(stable.requests[0].payload.operationDetails[0].destination, stable.f.cfg.escrow);
assert.equal(stable.requests[0].payload.operationDetails[0].parameters.entrypoint, 'set_token_pairs');
assert.equal(stable.f.state.sendHistory[0].batches[0].status, 'unconfirmed');
assert.equal(stable.f.state.sendHistory[0].invalidated, false);
console.log('drop send: original A-to-B recheck blocked before wallet submission; stable A control submits normally');
