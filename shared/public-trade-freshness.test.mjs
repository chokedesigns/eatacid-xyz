import assert from 'node:assert/strict';
import test from 'node:test';
import { fetchFa2BalancePages } from './tzkt-fa2-balances.js';
import { appliedOperations } from './public-trade-test-fixtures.mjs';
import { createSubmittedTradeStore, areAppliedTradeBalancesRefreshed, pollForNFTUpdate } from './public-trade-ops.js';

const scope = { network: 'testnet', tzktBase: 'https://inert.test', escrowAddress: 'escrow', account: 'wallet-A' };
const token = (contractAddress = 'burn', tokenId = '4', quantity = 2, startingBalance = 5) =>
  ({ contractAddress, tokenId, quantity, startingBalance });
const balance = (amount = '5', lastLevel = 100, contract = 'burn', tokenId = '4') => ({
  id: 1, balance: amount, lastLevel, account: { address: scope.account },
  token: { tokenId, contract: { address: contract } },
});
const read = (rows, options = {}) => fetchFa2BalancePages({ baseUrl: scope.tzktBase, account: scope.account,
  project: true, fetchImpl: async () => ({ ok: true, json: async () => rows }), ...options });
function fixture(tokens = [token()], calls = 1) {
  const rows = new Map();
  const storage = { get length() { return rows.size; }, key: i => [...rows.keys()][i],
    getItem: key => rows.get(key), setItem: (key, value) => rows.set(key, value), removeItem: key => rows.delete(key) };
  const store = () => createSubmittedTradeStore({ storage: () => storage,
    locks: () => ({ request: async (_name, opts, run) => (run || opts)({}) }) });
  const journal = store();
  const operations = Array.from({ length: calls }, () => ({ destination: scope.escrowAddress,
    parameters: { entrypoint: 'initiate_trade', value: [{ int: '1' }] } }));
  const submit = () => journal.submitted(journal.reserve(scope, operations, tokens), 'inert-hash');
  const record = submit();
  const apply = (ops = appliedOperations(record)) => journal.reconcile(record, async () => ops);
  return { rows, storage, store, journal, record, apply, submit };
}

for (const [name, amount, level] of [
  ['burn only', '3', 100], ['same-block incoming offsets burn', '5', 100],
  ['later incoming exceeds baseline', '9', 101], ['full depletion with explicit zero', '0', 100],
]) test(`AUD-008-001: ${name} recovers without a net-decrease invariant`, async () => {
  const f = fixture(), applied = await f.apply();
  const holdings = await read([balance(amount, level)]);
  assert.equal(applied.appliedLevel, 100);
  assert.equal(areAppliedTradeBalancesRefreshed(holdings, applied, scope), true);
  f.journal.clearApplied(scope, holdings);
  assert.equal(f.store().get(scope), null);
  assert.ok(f.submit(), 'Verified recovery permits a subsequent legitimate reservation');
});

test('AUD-008-001: incoming transfers of another exact identity neither block nor prove the traded balance', async () => {
  for (const [contract, tokenId] of [['other', '4'], ['burn', '5']]) {
    const f = fixture(), applied = await f.apply();
    const incoming = { ...balance('8', 101, contract, tokenId), id: 2 };
    const stale = await read([balance('3', 99), incoming]);
    assert.equal(areAppliedTradeBalancesRefreshed(stale, applied, scope), false);
    assert.throws(() => f.journal.clearApplied(scope, stale), /unverified/);
    const current = await read([balance('3', 100), incoming]);
    assert.equal(areAppliedTradeBalancesRefreshed(current, applied, scope), true);
    f.journal.clearApplied(scope, current);
  }
});

for (const [name, rows] of [
  ['stale unchanged', [balance('5', 99)]], ['stale apparently sufficient', [balance('3', 99)]],
  ['stale zero', [balance('0', 99)]], ['absence has no block attribution', []],
  ['different contract', [balance('5', 99), { ...balance('1', 101, 'other'), id: 2 }]],
  ['different token ID', [balance('5', 99), { ...balance('1', 101, 'burn', '5'), id: 2 }]],
  ['wrong account', [{ ...balance(), account: { address: 'wallet-B' } }]],
  ['missing owner evidence', [{ ...balance(), account: undefined }]],
  ['unsupported entrypoint balance', [{ ...balance(), entrypoint: 'other' }]],
  ...[undefined, null, '100', 0, -1, 100.5, {}, Number.MAX_SAFE_INTEGER + 1].map(level =>
    [`invalid/missing row level ${String(level)}`, [{ ...balance(), lastLevel: level }]]),
]) test(`AUD-008-001: ${name} retains the applied receipt`, async () => {
  const f = fixture(), applied = await f.apply();
  const holdings = await read(rows);
  for (let retry = 0; retry < 3; retry++) {
    assert.equal(areAppliedTradeBalancesRefreshed(holdings, applied, scope), false);
    assert.throws(() => f.journal.clearApplied(scope, holdings), /freshness is unverified/);
    assert.equal(f.store().get(scope).status, 'applied');
    assert.throws(f.submit, /reconciled/);
  }
  const current = await read([balance()]);
  f.store().clearApplied(scope, current);
  assert.equal(f.journal.get(scope), null, 'Reloaded store can recover independently');
});

test('AUD-008-001: complete-reader provenance, all identities, scope and unmodified projection are required', async () => {
  const f = fixture([token(), token(), token('other', '9007199254740993', 3, 8)], 2);
  const applied = await f.apply();
  const rows = [balance('8'), { ...balance('8', 100, 'other', '9007199254740993'), id: 2 }];
  const holdings = await read(rows);
  assert.equal(areAppliedTradeBalancesRefreshed(holdings, applied, scope), true);
  for (const key of ['network', 'tzktBase', 'escrowAddress', 'account']) {
    assert.equal(areAppliedTradeBalancesRefreshed(holdings, applied, { ...scope, [key]: 'other' }), false);
    assert.equal(f.store().get({ ...scope, [key]: 'other' }), null);
  }
  for (const untrusted of [[...holdings], JSON.parse(JSON.stringify(holdings)), [],
    await read(rows, { baseUrl: 'https://other.invalid' }),
    await read(rows, { nonzeroOnly: true }), await read(rows.slice(0, 1)),
    await read([rows[0], { ...rows[1], lastLevel: 99 }])]) {
    assert.equal(areAppliedTradeBalancesRefreshed(untrusted, applied, scope), false);
  }
  holdings[0].balance = '0';
  assert.equal(areAppliedTradeBalancesRefreshed(holdings, applied, scope), false);
  assert.throws(() => f.journal.clearApplied(scope, holdings), /unverified/);
  // A full first page followed by failed/malformed/truncated pagination never
  // yields an admissible array, even when its traded rows look current.
  for (const later of [() => { throw new Error('outage'); }, () => ({}), () => rows]) {
    let page = 0;
    await assert.rejects(read(rows, { pageSize: 2, fetchImpl: async () =>
      ({ ok: true, json: async () => ++page === 1 ? rows : later() }) }));
    assert.equal(f.store().get(scope).status, 'applied');
  }
  f.store().clearApplied(scope, await read(rows));
});

test('AUD-008-001: ambiguous operation block evidence stays applied and can be recovered after reload', async () => {
  for (const levels of [[100, 101], [100, undefined], ['100', '100'], [null, null], [-1, -1]]) {
    const f = fixture([token()], 2);
    const ops = appliedOperations(f.record).map((op, i) => ({ ...op, level: levels[i] }));
    const applied = await f.apply(ops);
    assert.equal(applied.status, 'applied'); assert.equal(applied.appliedLevel, null);
    assert.throws(() => f.journal.clearApplied(scope, []), /unverified/);
    const reload = f.store();
    const recovered = await reload.reconcile(reload.get(scope), async () => appliedOperations(f.record));
    assert.equal(recovered.appliedLevel, 100);
    reload.clearApplied(scope, await read([balance()]));
  }
});

test('AUD-008-001: legacy applied receipt survives unverifiable retry, then acquires attributed block evidence', async () => {
  const f = fixture(); await f.apply();
  const [key, raw] = [...f.rows][0], legacy = JSON.parse(raw); delete legacy.appliedLevel;
  f.rows.set(key, JSON.stringify(legacy));
  const reload = f.store();
  await assert.rejects(reload.reconcile(legacy, async () => { throw Object.assign(new Error('contradictory failure'),
    { code: 'PUBLIC_TRADE_FAILED' }); }));
  assert.equal(reload.get(scope).status, 'applied', 'Previously confirmed receipts cannot be deleted by contradictory retry');
  assert.equal(areAppliedTradeBalancesRefreshed(await read([balance()]), legacy, scope), false);
  const applied = await reload.reconcile(legacy, async () => appliedOperations(legacy));
  assert.equal(applied.appliedLevel, 100);
  reload.clearApplied(scope, await read([balance()]));
});

test('AUD-008-001: unknown/unconfirmed outcomes cannot use fresh holdings to unlock; timeout alone is no evidence', async () => {
  const f = fixture(), current = await read([balance()]);
  assert.equal(areAppliedTradeBalancesRefreshed(current, f.record, scope), false);
  await assert.rejects(f.journal.reconcile(f.record, async () => { throw new Error('unconfirmed'); }));
  assert.equal(f.journal.get(scope).status, 'submitted'); assert.throws(f.submit, /reconciled/);
  const applied = await f.apply();
  const stale = await read([balance('3', 99)]);
  const result = await pollForNFTUpdate({ fetchNFTs: async () => stale, address: scope.account,
    tradedTokens: applied.tradedTokens, submittedTrade: applied, scope, timeout: 0, refetchOnTimeout: true });
  assert.equal(areAppliedTradeBalancesRefreshed(result, applied, scope), false);
  assert.throws(() => f.journal.clearApplied(scope, result), /unverified/);
  let reads = 0;
  const recovered = await pollForNFTUpdate({ fetchNFTs: async () => ++reads === 1 ? stale : current,
    address: scope.account, tradedTokens: applied.tradedTokens, submittedTrade: applied, scope,
    timeout: 1000, interval: 0 });
  assert.equal(reads, 2);
  f.journal.clearApplied(scope, recovered);
});
