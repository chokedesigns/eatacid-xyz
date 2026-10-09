import assert from 'node:assert/strict';
import http from 'node:http';
import https from 'node:https';
import { test } from 'node:test';
import { TezosToolkit } from '@taquito/taquito';
import { chainRegistry } from '../shared/chain-registry.js';
import { PAIRS, TARGET, buildPayload, inspectChain, parseArgs, readBack, run, validatePairs } from './shadownet-exchange-pairs.mjs';

test('all 44 records match the independently supplied ticket table', () => {
  assert.equal(PAIRS.length, 44);
  assert.deepEqual(PAIRS.filter(p => p.burn_contract_address === TARGET.canaan).map(p => p.redeem_amount),
    [10, 10, 20, 25, 20, 20, 20, 12, 25, 20, 34, 12, 13, 15, 20, 25, 34, 50, 5, 50, 20, 25, 25, 20, 5, 17, 20, 20, 10, 10, 3]);
  const script419 = PAIRS.filter(p => p.burn_contract_address === TARGET.script419);
  assert.equal(script419.length, 13);
  assert.ok(script419.every(p => p.redeem_amount === 1));
  validatePairs();
});

test('validation rejects truncated, duplicate, changed or unsafe records and targets', () => {
  assert.throws(() => validatePairs(PAIRS.slice(1)));
  assert.throws(() => validatePairs(PAIRS.map((p, i) => i === 1 ? PAIRS[0] : p)));
  for (const [field, value] of [
    ['token_pair_id', 99], ['burn_contract_address', TARGET.escrow], ['burn_token_id', 31],
    ['burn_amount', 2], ['redeem_contract_address', TARGET.canaan], ['redeem_token_id', 1],
    ['redeem_amount', 11], ['redeem_amount', 0], ['redeem_amount', 1.5], ['redeem_amount', '10'],
  ]) assert.throws(() => validatePairs(PAIRS.map((p, i) => i === 0 ? { ...p, [field]: value } : p)), field);
  for (const patch of [{ label: 'Mainnet' }, { rpc: 'https://mainnet.smartpy.io' },
    { escrows: { exchange: { address: chainRegistry.testnet.escrows.drops.address } } }]) {
    assert.throws(() => validatePairs(PAIRS, { ...chainRegistry.testnet, ...patch }));
  }
});

test('Taquito encoding agrees with the existing admin right-combed Micheline order', async () => {
  const { parameter } = await buildPayload();
  const comb = atoms => atoms.length === 1 ? atoms[0] : { prim: 'Pair', args: [atoms[0], comb(atoms.slice(1))] };
  assert.equal(parameter.entrypoint, 'set_token_pairs');
  assert.deepEqual(parameter.value, PAIRS.map(p => comb([
    { int: String(p.token_pair_id) }, { string: p.burn_contract_address },
    { int: String(p.burn_token_id) }, { int: '1' }, { string: TARGET.acidCoin },
    { int: '0' }, { int: String(p.redeem_amount) },
  ])));
  assert.deepEqual(parameter, (await buildPayload()).parameter, 'Serialization must be deterministic');
});

test('default run reaches no network, provider, signer or injection path', async t => {
  let forbiddenCalls = 0;
  const forbidden = () => { forbiddenCalls++; throw new Error('Forbidden dry-run side effect'); };
  t.mock.method(globalThis, 'fetch', forbidden);
  for (const module of [http, https]) {
    t.mock.method(module, 'request', forbidden);
    t.mock.method(module, 'get', forbidden);
  }
  const fields = ['rpc', 'signer', 'contract', 'wallet'];
  const descriptors = fields.map(field => Object.getOwnPropertyDescriptor(TezosToolkit.prototype, field));
  try {
    fields.forEach(field => Object.defineProperty(TezosToolkit.prototype, field, { configurable: true, get: forbidden }));
    const lines = [];
    await run([], line => lines.push(line));
    assert.match(lines.at(-1), /DRY RUN ONLY/);
    assert.equal(JSON.parse(lines.at(-2)).parameter.value.length, 44);
    assert.equal(forbiddenCalls, 0);
  } finally {
    fields.forEach((field, i) => Object.defineProperty(TezosToolkit.prototype, field, descriptors[i]));
  }
});

test('CLI rejects ambiguous modes, unknown options and providers in dry-run/verify', () => {
  assert.deepEqual(parseArgs([]), { mode: 'dry-run', provider: undefined });
  assert.deepEqual(parseArgs(['--verify']), { mode: 'verify', provider: undefined });
  for (const args of [['--execute', '--verify'], ['--provider', './local.mjs'],
    ['--verify', '--provider', './local.mjs'], ['--execute', '--provider'], ['--mainnet']]) {
    assert.throws(() => parseArgs(args));
  }
});

test('chain inspection isolates the nested big-map schema and rejects the wrong chain or ABI', async () => {
  const payload = await buildPayload();
  const rpc = {
    getRpcUrl: () => chainRegistry.testnet.rpc,
    getChainId: async () => TARGET.chainId,
    getBlockHeader: async () => ({ level: 123 }),
    getEntrypoints: async () => ({ entrypoints: { set_token_pairs: payload.type } }),
    getScript: async (address, { block }) => {
      assert.equal(address, TARGET.escrow);
      assert.equal(block, '123');
      return { code: payload.code, storage: { prim: 'Pair', args: [
        { prim: 'Pair', args: [{ string: 'tz1hr2Y31zqvzkDkNGDMmPcSJLKwzH36t3W9' },
          { string: 'tz1iwgimbUW9fKdTfkS7GNyXqBu5oAjQw6xn' }] },
        { prim: 'False' }, { int: '38911' }, { int: '0' },
      ] } };
    },
  };
  const snapshot = await inspectChain({ rpc }, payload);
  assert.equal(snapshot.storage.token_mapping.toString(), '38911');
  assert.deepEqual(snapshot.schema.EncodeBigMapKey(0), { key: { int: '0' }, type: { prim: 'nat' } });
  rpc.getChainId = async () => 'WrongChain';
  await assert.rejects(() => inspectChain({ rpc }, payload), /Wrong chain ID/);
  rpc.getChainId = async () => TARGET.chainId;
  rpc.getEntrypoints = async () => ({ entrypoints: { set_token_pairs: { prim: 'unit' } } });
  await assert.rejects(() => inspectChain({ rpc }, payload), /Live entrypoint ABI differs/);
});

test('read-back classifies records and unexpected cardinality at the snapshot level', async () => {
  const tezos = { setPackerProvider() {}, contract: { async getBigMapKeyByID(map, id, schema, level) {
    assert.equal(map, '38911');
    assert.equal(level, 123);
    if (id === 1) throw Object.assign(new Error('missing'), { status: 404 });
    const { token_pair_id, ...pair } = PAIRS[id];
    return id === 2 ? { ...pair, redeem_amount: 99 } : pair;
  } } };
  const report = await readBack(tezos, { schema: {}, storage: { token_mapping: 38911, token_mapping_size: 45 }, level: 123 });
  assert.equal(report.matching.length, 42);
  assert.deepEqual(report.missing, [1]);
  assert.deepEqual(report.mismatched, [{ token_pair_id: 2, differences: [{ field: 'redeem_amount', expected: 20, actual: '99' }] }]);
  assert.equal(report.unexpectedCount, 2);
  assert.match(report.unexpectedIds, /Not enumerable/);
  tezos.contract.getBigMapKeyByID = async () => { throw Object.assign(new Error('RPC unavailable'), { status: 503 }); };
  await assert.rejects(() => readBack(tezos, { schema: {}, storage: { token_mapping: 38911 }, level: 123 }), /RPC unavailable/);
});
