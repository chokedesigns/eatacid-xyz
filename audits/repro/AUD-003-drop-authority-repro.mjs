import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { exactTokenId, compareTokenIds } from '../../admin-ui/src/features/drops/utils/token-id.js';

// Reuse the existing inert fixture's full current sender, normalizer, builder,
// state, and serializer. Wallet SDK and TzKT are the controlled boundaries.
const testUrl = new URL('../../admin-ui/tests/runtime/drops-send-invalidation.test.mjs', import.meta.url);
const testSource = readFileSync(testUrl, 'utf8');
const start = testSource.indexOf('function load(path, globals = {})');
const end = testSource.indexOf("\nfor (const change of ['provider'", start);
assert.ok(start >= 0 && end > start);
const prelude = testSource.slice(start, end).replace(
  'new URL(`../../src/${path}.js`, import.meta.url)',
  'new URL(`../../src/${path}.js`, auditBase)',
);
const realm = { assert, readFileSync, URL, auditBase: testUrl, vm, console, Event,
  CustomEvent, EventTarget, AbortController, setTimeout, clearTimeout,
  exactTokenId, compareTokenIds, structuredClone, setImmediate };
vm.runInNewContext(`${prelude}\nglobalThis.auditFixture = fixture; globalThis.auditLoad = load;`, realm);

async function run(accounts) {
  const f = realm.auditFixture();
  f.cfg.escrow = 'KT1HMCqYqyP9fTDjzm8KAfyPhFn3tpmSW4kc';
  f.ready();
  const calls = [], requests = [];
  let active = accounts[0];
  const adapter = realm.auditLoad('escrow-ops', {
    getLiveCfg: () => f.cfg,
    verifyAdminActiveAccount: account => account?.network?.type === 'shadownet' ? account : null,
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
  assert.equal(requests.length, 1);
  assert.equal(requests[0].payload.operationDetails[0].destination, f.cfg.escrow);
  assert.equal(requests[0].payload.operationDetails[0].parameters.entrypoint, 'set_token_pairs');
  return { requests, f };
}

const A = { address: 'tz1hcAYJhEB9n6ezLFcbuejzZ821zrL1c3vW', network: { type: 'shadownet' } };
const B = { address: 'tz1dpaqpwKqPSft4SFvd5tA9bx7iDUNHnVsz', network: { type: 'shadownet' } };
const changed = await run([A, B]);
assert.equal(changed.requests[0].signer, B.address,
  'preview opened under A reaches the changed B wallet without invalidation');
assert.equal(changed.f.state.sendHistory[0].batches[0].status, 'unconfirmed');
const stable = await run([A, A]);
assert.equal(stable.requests[0].signer, A.address, 'unchanged-wallet control submits normally');
console.log('drop send: changed B account receives A preview payload; stable A control submits normally');
