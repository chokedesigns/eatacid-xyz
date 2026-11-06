import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import { fetchFa2BalancePages } from './tzkt-fa2-balances.js';
import { pollForNFTUpdate } from './public-trade-ops.js';

const row = (id, contract = 'KT1Other', tokenId = String(id), balance = '1') =>
  ({ id, token: { tokenId, contract: { address: contract } }, balance });
const rows = Array.from({ length: 100 }, (_, id) => row(id));
const target = row(100, 'KT1Redeem', '9007199254740993', '7');
const response = data => ({ ok: true, json: async () => data });
const flush = () => new Promise(resolve => setImmediate(resolve));
function section(path, start, end) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8').replace(/\r\n?/g, '\n');
  const a = source.indexOf(start), b = source.indexOf(end, a);
  assert.ok(a >= 0 && b > a);
  return source.slice(a, b);
}

// Production fetchers and Drops supply consumers; only indexer, config and DOM are inert.
function fixture(surface = 'shared') {
  const h = { urls: [], patches: [], supplyText: 'unknown' };
  h.read = async url => response(url.searchParams.has('id.gt') ? [target] : rows);
  const context = vm.createContext({ fetchFa2BalancePages,
    network: 'testnet', tzkt: { testnet: 'https://inert.invalid' }, TZKT_BASE: 'https://inert.invalid',
    networkConfigAvailable: true, networkUnavailableMessage: 'unconfigured',
    logger: { log() {} }, console: { error() {} },
    fetch: async url => { const parsed = new URL(url); h.urls.push(parsed); return h.read(parsed); },
    BURN_REDEEM_CONTRACT_ADDRESS: 'KT1Escrow', collections: { ART: 'KT1Redeem' },
    redeemToken: { collection: 'ART', tokenId: target.token.tokenId },
    redeemInitialSupplyCommitted: true, redeemSupplyUpdatePromise: null,
    updateAppState: patch => h.patches.push(patch),
    document: { querySelector: () => ({ set textContent(value) { h.supplyText = value; } }) }
  });
  const code = surface === 'shared'
    ? section('./beacon-setup.js', 'async function fetchNFTs(', 'window.fetchNFTs = fetchNFTs;')
    : section('../exchange/js/exchange.js', 'async function fetchNFTs(', '/**\n * Processes');
  vm.runInContext(code + '\n' + section('../drops/js/events.js', 'async function fetchRedeemSupply(', '/**\n * Starts a repeated poll'), context);
  return Object.assign(h, { context, fetch: address => context.fetchNFTs(address),
    supply: () => context.fetchRedeemSupply(), initial: () => context.resolveInitialRedeemSupply(),
    update: () => context.updateRedeemSupplyDisplay() });
}

for (const surface of ['shared', 'exchange']) {
  test(`BAL-001 / ${surface}: AUD-002-001 101st funded token survives, with exact identity and quantity`, async () => {
    const h = fixture(surface);
    const result = await h.fetch('wallet A');
    assert.equal(result.length, 101);
    assert.deepEqual({ ...result[100] }, { contractAddress: 'KT1Redeem', tokenId: target.token.tokenId, balance: '7' });
    assert.equal(h.urls[1].searchParams.get('id.gt'), '99');
    assert.ok(h.urls.every(url => url.searchParams.get('account') === 'wallet A'
      && url.searchParams.get('sort.asc') === 'id' && url.searchParams.get('limit') === '100'));
    assert.equal(await h.supply(), 7);
    h.read = async () => response([row('90071992547409931234', 'KT1Redeem', target.token.tokenId, '90071992547409931235')]);
    assert.equal((await h.fetch('wallet A'))[0].balance, '90071992547409931235');
  });

  for (const failure of ['http', 'timeout', 'json', 'non-array', 'malformed-row', 'repeat', 'backwards', 'duplicate-token', 'cap']) {
    test(`BAL-001 / ${surface}: later ${failure} cannot publish partial supply or complete a trade refresh`, async t => {
      const h = fixture(surface);
      if (failure === 'timeout') t.mock.timers.enable({ apis: ['setTimeout'] });
      h.read = async url => {
        if (!url.searchParams.has('id.gt')) return response(rows);
        switch (failure) {
          case 'http': return { ok: false, status: 503 };
          case 'timeout': return { ok: true, json: () => new Promise(() => {}) };
          case 'json': return { ok: true, json: async () => JSON.parse('{') };
          case 'non-array': return response({});
          case 'malformed-row': return response([{ ...target, balance: null }]);
          case 'repeat': return response(rows);
          case 'backwards': return response([row(100), row(99)]);
          case 'duplicate-token': return response([row(100, 'KT1Other', '0')]);
          case 'cap': return response(Array.from({ length: 100 }, (_, i) => row(Number(url.searchParams.get('id.gt')) + i + 1)));
        }
      };
      const run = async fn => {
        const pending = fn();
        // Attach rejection handling before advancing the inert clock.
        const result = pending.then(value => ({ value }), error => ({ error }));
        if (failure === 'timeout') { await flush(); t.mock.timers.tick(15000); }
        return result;
      };
      assert.ok((await run(() => h.fetch('wallet-A'))).error);
      assert.ok(h.urls.length <= 200);
      const initial = await run(h.initial);
      assert.equal(initial.value.available, false);
      assert.equal(initial.value.value, null);
      assert.equal((await run(h.update)).value, false);
      assert.deepEqual(h.patches.map(patch => patch.redeemSupply), [null]);
      assert.equal(h.supplyText, '[UNAVAILABLE]');
      const refresh = await run(() => pollForNFTUpdate({ fetchNFTs: h.fetch, address: 'wallet-A',
        tradedTokens: [{ contractAddress: 'KT1Redeem', tokenId: target.token.tokenId, startingBalance: 8, quantity: 1 }] }));
      assert.ok(refresh.error, 'An omitted traded token in an incomplete read must not count as refreshed');
    });
  }

  test(`BAL-001 / ${surface}: complete empty and explicit zero preserve genuine absence`, async () => {
    const h = fixture(surface);
    for (const data of [[], [{ ...target, balance: '0' }]]) {
      h.read = async () => response(data);
      assert.equal(await h.supply(), 0);
      assert.equal(await h.update(), true);
      assert.equal(h.patches.at(-1).redeemSupply, 0);
      const result = await pollForNFTUpdate({ fetchNFTs: h.fetch, address: 'wallet-A',
        tradedTokens: [{ contractAddress: 'KT1Redeem', tokenId: target.token.tokenId, startingBalance: 1, quantity: 1 }] });
      assert.equal(result.length, data.length);
    }
  });
}

test('BAL-001: Drops missing provider or network is unavailable, never an empty holdings success', async () => {
  const context = vm.createContext({ window: {}, networkConfigAvailable: true, networkUnavailableMessage: 'unconfigured' });
  vm.runInContext(section('../drops/js/events.js', 'async function fetchNFTs(address)', '/**'), context);
  await assert.rejects(context.fetchNFTs('wallet-A'), /not available/);
  context.networkConfigAvailable = false;
  await assert.rejects(context.fetchNFTs('wallet-A'), /unconfigured/);
});
