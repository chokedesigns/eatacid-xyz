// Inert reproduction at the real Drops selection/send and browser receipt seams.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createSubmittedTradeStore } from '../../shared/public-trade-ops.js';

// Reuse only checked-in DOM/SDK fixture definitions, without registering its tests.
const fixtureUrl = new URL('../../drops/js/trade-lifecycle.test.mjs', import.meta.url);
let definitions = await readFile(fixtureUrl, 'utf8');
const cutoff = definitions.indexOf("test('BAL-002:");
assert.ok(cutoff > 0);
definitions = definitions.slice(0, cutoff)
  .replaceAll('import.meta.url', JSON.stringify(fixtureUrl.href))
  .replace(/from '(\.[^']+)'/g, (_, relative) => `from '${new URL(relative, fixtureUrl).href}'`);
const { fixture } = await import(`data:text/javascript;base64,${Buffer.from(definitions + '\nexport { fixture };').toString('base64')}`);
const scope = { network: 'testnet', tzktBase: 'https://inert.test', escrowAddress: 'escrow', account: 'wallet-A' };
const adapter = storage => ({
  get length() { return storage.size; }, key: i => [...storage.keys()][i],
  getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value),
  removeItem: key => storage.delete(key),
});

for (const balance of ['5', '9007199254740993', String(Number.MAX_SAFE_INTEGER)]) {
  const storage = new Map();
  const f = fixture({ storage });
  const render = () => f.context.renderBalances(f.context.computeBalances([
    { contractAddress: 'burn', tokenId: '4', balance },
  ]));
  const reloaded = createSubmittedTradeStore({ storage: () => adapter(storage) });
  if (balance !== '9007199254740993') {
    render();
    assert.equal(f.row.balance, balance, 'Safe provider-to-DOM conversion remains exact');
    await f.send();
    assert.equal(f.requests.length, 1);
    assert.equal(reloaded.get(scope).status, 'applied');
    assert.equal(reloaded.get(scope).hash, 'inert-operation-hash');
    assert.equal(f.confirmations.length, 1);
  } else {
    assert.throws(render, /balance is invalid/);
    // A stale or externally altered DOM count must also fail at selection/send.
    f.row.balance = balance; await f.send();
    assert.equal(f.requests.length, 0);
    assert.equal(f.confirmations.length, 0);
    assert.equal(storage.size, 0, 'No malformed reservation was persisted');
    assert.equal(reloaded.get(scope), null);
    assert.equal(reloaded.get({ ...scope, account: 'wallet-B' }), null);
    assert.match(f.modals.at(-1)[1], /balance is invalid.*Retry balances/);
  }
}
console.log('AUD-003-002 fixed: unsafe Drops balance cannot render, reserve or request the wallet; safe and maximum-safe controls retain applied hashes.');
