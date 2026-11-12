// Inert reproduction at the real Drops selection/send and browser receipt seams.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInContext } from 'node:vm';
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
const page = await readFile(new URL('../../drops/js/events.js', import.meta.url), 'utf8');
function sourceFunction(name) {
  const start = page.indexOf(`function ${name}(`);
  const end = page.indexOf('\n}', start) + 2;
  assert.ok(start >= 0 && end > start);
  return page.slice(start, end);
}
const scope = { network: 'testnet', tzktBase: 'https://inert.test', escrowAddress: 'escrow', account: 'wallet-A' };
const adapter = storage => ({
  get length() { return storage.size; }, key: i => [...storage.keys()][i],
  getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value),
  removeItem: key => storage.delete(key),
});

for (const balance of ['5', '9007199254740993']) {
  const storage = new Map();
  const f = fixture({ storage });
  const ownedText = { textContent: '' };
  f.row.querySelector = () => ownedText;
  const selectAll = f.context.document.querySelectorAll;
  f.context.document.querySelectorAll = selector => selector === '.w-dyn-item[data-token-id]'
    ? [f.row] : selectAll(selector);
  runInContext(sourceFunction('computeBalances') + '\n' + sourceFunction('renderBalances'), f.context);
  f.context.renderBalances(f.context.computeBalances([
    { contractAddress: 'burn', tokenId: '4', balance },
  ]));
  assert.equal(ownedText.textContent, String(Number(balance)), 'Real provider-to-DOM conversion');
  await f.send();
  assert.equal(f.requests.length, 1, 'The current handler reaches the inert wallet request');
  const reloaded = createSubmittedTradeStore({ storage: () => adapter(storage) });
  if (balance === '5') {
    assert.equal(reloaded.get(scope).status, 'applied');
    assert.equal(f.confirmations.length, 1);
  } else {
    assert.equal(f.confirmations.length, 0, 'Receipt status update fails before confirmation');
    assert.throws(() => reloaded.get(scope), /journal is invalid/);
    assert.throws(() => reloaded.get({ ...scope, account: 'wallet-B' }), /journal is invalid/);
    assert.equal(JSON.parse([...storage.values()][0]).status, 'submitting');
    assert.equal(JSON.parse([...storage.values()][0]).hash, null);
    assert.match(f.errors.map(args => args.map(String).join(' ')).join('\n'), /journal is invalid/);
  }
}
console.log('AUD-003 receipt evidence: large Drops balance sends then leaves an unreadable journal across accounts; small-balance control confirms.');
