import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import vm from 'node:vm';
import test from 'node:test';

const sourceRoot = process.env.EA_T004_SOURCE_ROOT
  ? pathToFileURL(`${process.env.EA_T004_SOURCE_ROOT}/`)
  : new URL('../', import.meta.url);
const { fetchTokenPairId } = await import(new URL('shared/public-trade-ops.js', sourceRoot));
const intended = {
  tzktBase: 'https://inert.tzkt.test', escrowAddress: 'KT1Escrow',
  burnContractAddress: 'KT1Burn', burnTokenId: '0', burnAmount: 2,
  redeemContractAddress: 'KT1Redeem', redeemTokenId: '29', redeemAmount: 3,
};
function pair(key = '11', overrides = {}, active = true) {
  return { key, active, value: {
    burn_contract_address: intended.burnContractAddress, burn_token_id: '0', burn_amount: '2',
    redeem_contract_address: intended.redeemContractAddress, redeem_token_id: '29', redeem_amount: '3',
    ...overrides,
  } };
}
async function boundary(response, fn) {
  const saved = { fetch: globalThis.fetch, warn: console.warn, error: console.error };
  const urls = []; const diagnostics = [];
  globalThis.fetch = async url => {
    urls.push(url);
    const body = typeof response === 'function' ? await response(url, urls.length) : response;
    return { ok: true, json: async () => body };
  };
  console.warn = (...args) => diagnostics.push(args.join(' '));
  console.error = (...args) => diagnostics.push(args.join(' '));
  try { return await fn({ urls, diagnostics }); }
  finally { Object.assign(globalThis, { fetch: saved.fetch }); console.warn = saved.warn; console.error = saved.error; }
}

test('FIND-P2-018: competing historical redeem1 and intended redeem29 select the complete tuple', async () => {
  const older = pair('10', { redeem_token_id: '1' });
  for (const rows of [[older, pair()], [pair(), older]]) {
    await boundary(rows, async () => assert.equal(String(await fetchTokenPairId(intended)), '11'));
  }
  await boundary([older, pair()], async () => {
    assert.equal(await fetchTokenPairId({ ...intended, redeemTokenId: 1 }), '10', 'Historical pair remains valid');
  });
});

test('Each address, token ID and quantity must match; inactive and empty rows cannot compete', async () => {
  for (const [field, value] of Object.entries({
    burn_contract_address: 'KT1Other', burn_token_id: '1', burn_amount: '1',
    redeem_contract_address: 'KT1Other', redeem_token_id: '1', redeem_amount: '1',
  })) {
    const mismatch = pair('10', { [field]: value });
    await boundary([mismatch], async () => assert.equal(await fetchTokenPairId(intended), null, field));
    await boundary([mismatch, pair()], async () => assert.equal(await fetchTokenPairId(intended), '11', field));
  }
  await boundary([pair('10', {}, false), null, { active: true, value: null }, pair()], async () => {
    assert.equal(await fetchTokenPairId(intended), '11');
  });
  for (const field of ['burn_contract_address', 'redeem_contract_address']) {
    await boundary([pair('10', { [field]: intended[field === 'burn_contract_address' ? 'burnContractAddress' : 'redeemContractAddress'].toLowerCase() })],
      async () => assert.equal(await fetchTokenPairId(intended), null, 'Base58 addresses are case-sensitive'));
  }
});

test('Multiple exact pairs fail explicitly regardless of order, including duplicate response rows', async () => {
  for (const rows of [[pair('10'), pair()], [pair(), pair('10')], [pair(), pair()]]) {
    await boundary(rows, async ({ diagnostics }) => {
      assert.equal(await fetchTokenPairId(intended), null);
      assert.match(diagnostics.join('\n'), /ambiguous/i);
    });
  }
});

test('Exact nat IDs and amounts retain precision and reject invalid or incomplete input', async () => {
  const huge = '900719925474099312345';
  await boundary([pair(huge, { burn_token_id: huge, redeem_token_id: huge, redeem_amount: huge })], async () => {
    assert.equal(await fetchTokenPairId({ ...intended, burnTokenId: huge, redeemTokenId: huge, redeemAmount: huge }), huge);
  });
  await boundary([pair(0, { burn_token_id: 0, redeem_token_id: 29, burn_amount: 2, redeem_amount: 3 })], async () => {
    assert.equal(await fetchTokenPairId(intended), '0');
  });
  for (const field of Object.keys(intended)) {
    const args = { ...intended }; delete args[field];
    await boundary([pair()], async ({ urls }) => {
      assert.equal(await fetchTokenPairId(args), null, `missing ${field}`);
      assert.equal(urls.length, 0);
    });
  }
  for (const field of ['burnTokenId', 'redeemTokenId', 'burnAmount', 'redeemAmount']) {
    for (const value of [null, true, '', -1, 1.5, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1, '1.5', '1e3']) {
      await boundary([pair()], async ({ urls }) => {
        assert.equal(await fetchTokenPairId({ ...intended, [field]: value }), null);
        assert.equal(urls.length, 0);
      });
    }
  }
  for (const field of ['burnAmount', 'redeemAmount']) {
    await boundary([pair()], async () => assert.equal(await fetchTokenPairId({ ...intended, [field]: 0 }), null));
  }
  for (const key of [null, true, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, 'bad']) {
    await boundary([pair(key)], async () => assert.equal(await fetchTokenPairId(intended), null));
  }
});

test('Missing, malformed and failed indexer reads fail closed', async () => {
  for (const body of [[], null, {}, { error: 'not rows' }]) {
    await boundary(body, async () => assert.equal(await fetchTokenPairId(intended), null));
  }
  for (const failure of ['fetch', 'http', 'json']) {
    await boundary([], async () => {
      globalThis.fetch = async () => {
        if (failure === 'fetch') throw new Error('inert offline');
        return { ok: failure !== 'http', status: 503, text: async () => 'inert unavailable',
          json: async () => { throw new Error('inert malformed JSON'); } };
      };
      assert.equal(await fetchTokenPairId(intended), null);
    });
  }
});

test('A full mapping page cannot hide a later match, ambiguity or read failure', async () => {
  const first = Array.from({ length: 10000 }, (_, i) => pair(String(i), { redeem_token_id: '1' }));
  await boundary((url, call) => call === 1 ? first : [pair('10000')], async ({ urls }) => {
    assert.equal(await fetchTokenPairId(intended), '10000');
    assert.equal(new URL(urls[1]).searchParams.get('offset'), '10000');
    assert.equal(new URL(urls[0]).searchParams.get('active'), 'true');
    assert.equal(new URL(urls[0]).pathname, '/v1/contracts/KT1Escrow/bigmaps/token_mapping/keys');
  });
  const withMatch = [...first]; withMatch[0] = pair();
  await boundary((url, call) => call === 1 ? withMatch : [pair('10000')], async () => {
    assert.equal(await fetchTokenPairId(intended), null);
  });
  await boundary((url, call) => { if (call === 2) throw new Error('inert page failure'); return withMatch; }, async () => {
    assert.equal(await fetchTokenPairId(intended), null);
  });
});

function section(source, start, end) {
  const begin = source.indexOf(start); const finish = source.indexOf(end, begin);
  assert.ok(begin >= 0 && finish > begin, `Source anchors ${start} / ${end}`);
  return source.slice(begin, finish);
}
function consumer(surface, { rows, cart, selected = 'KT1Burn', burnAmount = 2, redeemAmount = 3 } = {}) {
  const drops = surface === 'drops';
  const source = readFileSync(new URL(drops ? 'drops/js/events.js' : 'exchange/js/exchange.js', sourceRoot), 'utf8').replace(/\r\n?/g, '\n');
  const sent = []; const errors = []; const lookups = [];
  const context = vm.createContext({
    TZKT_BASE: intended.tzktBase, BURN_REDEEM_CONTRACT_ADDRESS: intended.escrowAddress,
    BURN_REDEEM_CONTRACT: 'KT1ExchangeEscrow', REDEEM_CONTRACT_ADDRESS: 'KT1Redeem', REDEEM_TOKEN_CONTRACT: 'KT1ExchangeRedeem',
    redeemToken: { collection: 'REDEEM', tokenId: '29', redeemAmount },
    burnTokens: [{ collection: 'FIRST', enabled: true, burnAmount: 1 }, { collection: 'SECOND', enabled: true, burnAmount }],
    collections: { FIRST: 'KT1First', SECOND: 'KT1Burn' },
    normalizeString: v => String(v ?? '').trim().toLowerCase(),
    getSelectedEventTokenWithBalance: () => ({ contractAddress: selected, tokenId: '0', oldBalance: 5 }),
    getBurnCart: () => structuredClone(cart ?? [{ contractAddress: 'KT1Burn', tokenId: '0', quantity: 2, redeemAmount: 10 }]),
    fetchSharedTokenPairId: args => { lookups.push(args); return fetchTokenPairId(args); },
    getVerifiedPublicActiveAccount: async () => ({ address: 'inert-wallet' }),
    buildApprovalOps: async () => [{ kind: 'approval' }],
    window: { dAppClient: { requestOperation: async payload => { sent.push(payload); return { transactionHash: 'inert-hash' }; } } },
    networkConfigAvailable: true, network: 'testnet', EXPLORER_BASE: 'https://inert.explorer.test',
    exchangeInFlight: false, logger: { log() {} }, console: { error: (...args) => errors.push(args), warn() {} },
    showModal() {}, hideModal() {}, setTimeout() {}, clearInterval() {},
    document: { querySelector: selector => selector === '.loading-modal-div' ? { querySelector: () => null } : null },
    resetEventsUI() {}, resetExchangeUI() {}, pollForConfirmation: async () => {}, pollForNFTUpdate: async () => [],
    walletRefreshGeneration: 0, synchronizedWalletAddress: 'inert-wallet', isCurrentWalletProjection: () => true, refreshConnectedState() {},
    exchangeWalletLifecycleStatus: 'connected', walletBalancesVerified: true, confirmedTradeRefresh: null,
    renderWalletTokenLoadingState() {}, renderConnectedWalletTokenFailureState() {},
  });
  let code;
  if (drops) {
    code = section(source, 'async function fetchTokenPairId(', '// =============================================================================');
    code += section(source, 'function getBurnAmountForContract(', '/**\n * Returns the one selected');
    code += section(source, 'let eventExchangeInFlight', '// UI STATE TOGGLING:');
  } else {
    // Supply the page's current ownership guards as well as its trading functions.
    code = section(source, 'function isCurrentExchangeWallet(', 'function resetBurnCartDisplay(');
    // Exchange's helper ends at its next section heading, not the entire approval/polling region.
    code += section(source, 'async function fetchTokenPairId(', '// -----------------------------------------------------');
    code += section(source, 'function assertTradedBalancesRefreshed(', '// -----------------------------------------------------');
    // Include the nested countdown helper and handleExchange's closing brace.
    code += section(source, 'async function handleExchange()', '// -----------------------------------------------------\n// RESET EXCHANGE UI');
  }
  vm.runInContext(code, context);
  return { sent, errors, lookups, run: async () => boundary(rows, async () => {
    await (drops ? context.handleEventExchange() : context.handleExchange());
  }) };
}
function tradeTerms(trade) {
  const [left, right] = trade.args;
  return [left.args[0].args[1].string, left.args[1].args[0].int, left.args[0].args[0].int,
    right.args[0].args[0].string, right.args[0].args[1].int, left.args[1].args[1].int, right.args[1].args[0].int];
}

test('Drops caller resolves the selected independent collection with exact burn2/redeem terms', async () => {
  const f = consumer('drops', { rows: [pair('10', { redeem_token_id: '1' }), pair()] });
  await f.run();
  assert.equal(f.sent.length, 1); assert.equal(f.errors.length, 0);
  const ops = f.sent[0].operationDetails;
  assert.equal(ops[0].kind, 'approval'); assert.equal(ops[1].destination, 'KT1Escrow');
  assert.deepEqual(tradeTerms(ops[1].parameters.value[0]), ['KT1Burn', '0', '2', 'KT1Redeem', '29', '3', '11']);
  const first = consumer('drops', { selected: 'KT1First', rows: [pair('12', { burn_contract_address: 'KT1First', burn_amount: '1' }), pair()] });
  await first.run(); assert.equal(first.sent.length, 1);
  assert.equal(tradeTerms(first.sent[0].operationDetails[1].parameters.value[0])[6], '12');
});

test('Exchange caller resolves unit burns with edition reward and configured redeem/escrow context', async () => {
  const row = pair('15', { burn_amount: '1', redeem_contract_address: 'KT1ExchangeRedeem', redeem_token_id: '0', redeem_amount: '10' });
  const f = consumer('exchange', { rows: [pair('14', { ...row.value, burn_amount: '2' }), row] }); await f.run();
  assert.equal(f.sent.length, 1); assert.equal(f.errors.length, 0);
  const ops = f.sent[0].operationDetails;
  assert.equal(ops[0].kind, 'approval'); assert.equal(ops[1].destination, 'KT1ExchangeEscrow');
  assert.equal(f.lookups[0].escrowAddress, 'KT1ExchangeEscrow');
  assert.equal(ops[1].parameters.value.length, 2, 'Quantity repeats unit trades');
  for (const trade of ops[1].parameters.value) {
    assert.deepEqual(tradeTerms(trade), ['KT1Burn', '0', '1', 'KT1ExchangeRedeem', '0', '10', '15']);
  }
});

test('Legacy active-row shape and mixed number/string nats remain compatible', async () => {
  const row = pair('0', { burn_token_id: 0, burn_amount: 2, redeem_token_id: 29, redeem_amount: 3 });
  delete row.active;
  await boundary([row], async () => assert.equal(await fetchTokenPairId(intended), '0'));
  for (const field of Object.keys(row.value)) {
    const incomplete = structuredClone(row); delete incomplete.value[field];
    await boundary([incomplete], async () => assert.equal(await fetchTokenPairId(intended), null, field));
  }
});

test('Pagination validates every page, accepts an empty terminal page and fails at its safety cap', async () => {
  const full = Array.from({ length: 10000 }, (_, i) => pair(String(i), { redeem_token_id: '1' }));
  const withMatch = [...full]; withMatch[0] = pair();
  await boundary((url, call) => call === 1 ? withMatch : [], async ({ urls }) => {
    assert.equal(await fetchTokenPairId(intended), '11'); assert.equal(urls.length, 2);
    for (const url of urls) assert.equal(new URL(url).searchParams.get('sort.asc'), 'id');
  });
  for (const badPage of [null, {}, [...full, pair()]]) {
    await boundary((url, call) => call === 1 ? withMatch : badPage, async () => {
      assert.equal(await fetchTokenPairId(intended), null, 'A known match cannot survive an invalid later page');
    });
  }
  await boundary((url, call) => call === 1 ? withMatch : full, async ({ urls, diagnostics }) => {
    assert.equal(await fetchTokenPairId(intended), null);
    assert.equal(urls.length, 100); assert.match(diagnostics.join('\n'), /paging cap/i);
  });
});

test('Caller lookup and submitted Micheline agree on every term, including exact large IDs', async () => {
  const huge = '900719925474099312345';
  const row = pair(huge, { burn_amount: '1', burn_token_id: huge, redeem_contract_address: 'KT1ExchangeRedeem', redeem_token_id: huge, redeem_amount: '10' });
  const f = consumer('exchange', { rows: [row],
    cart: [{ contractAddress: 'KT1Burn', tokenId: huge, quantity: 3, redeemAmount: 10, redeemTokenId: huge }] });
  await f.run(); assert.equal(f.sent.length, 1); assert.equal(f.errors.length, 0);
  for (const trade of f.sent[0].operationDetails[1].parameters.value) {
    assert.deepEqual(tradeTerms(trade), ['KT1Burn', huge, '1', 'KT1ExchangeRedeem', huge, '10', huge]);
  }
  for (const fixture of [f, consumer('drops', { rows: [pair()] })]) {
    if (fixture !== f) await fixture.run();
    const args = fixture.lookups[0];
    const terms = tradeTerms(fixture.sent[0].operationDetails[1].parameters.value[0]);
    assert.deepEqual([args.burnContractAddress, String(args.burnTokenId), String(args.burnAmount),
      args.redeemContractAddress, String(args.redeemTokenId), String(args.redeemAmount)], terms.slice(0, 6));
    assert.equal(args.escrowAddress, fixture.sent[0].operationDetails[1].destination);
  }
});

test('Both callers withhold the entire wallet batch for missing, mismatched or ambiguous pairs and release guards', async () => {
  for (const surface of ['drops', 'exchange']) {
    const row = surface === 'drops' ? pair() : pair('15', { burn_amount: '1', redeem_contract_address: 'KT1ExchangeRedeem', redeem_token_id: '0', redeem_amount: '10' });
    for (const rows of [[], [pair('10', { redeem_contract_address: 'KT1Wrong' })], [row, { ...row, key: '16' }]]) {
      const f = consumer(surface, { rows }); await f.run(); await f.run();
      assert.equal(f.sent.length, 0); assert.equal(f.lookups.length, 2, 'Send guard releases after lookup failure');
    }
  }
  const f = consumer('exchange', { rows: [pair('15', { burn_amount: '1', redeem_contract_address: 'KT1ExchangeRedeem', redeem_token_id: '0', redeem_amount: '10' })],
    cart: [{ contractAddress: 'KT1Burn', tokenId: '0', quantity: 1, redeemAmount: 10 },
      { contractAddress: 'KT1Burn', tokenId: '1', quantity: 1, redeemAmount: 10 }] });
  await f.run(); assert.equal(f.sent.length, 0, 'One unresolved cart row blocks all trades and approvals');
});
