import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Parser } from '@taquito/michel-codec';
import { ParameterSchema, Schema } from '@taquito/michelson-encoder';
import { MichelCodecPacker, TezosToolkit } from '@taquito/taquito';
import { chainRegistry } from '../shared/chain-registry.js';
import { pollForConfirmation } from '../shared/public-trade-ops.js';

// No signer is constructed here. --execute requires an existing local provider
// module exporting `tezos`, a Taquito toolkit already configured with its signer.
// Commands (from the outer repository):
//   node scripts/shadownet-exchange-pairs.mjs
//   node scripts/shadownet-exchange-pairs.mjs --verify
//   node scripts/shadownet-exchange-pairs.mjs --execute --provider <local-module.mjs>
// Provider modules must be kept local/ignored and must not submit operations on import.
export const TARGET = Object.freeze({
  network: 'Shadownet',
  chainId: 'NetXsqzbfFenSTS',
  escrow: 'KT1Ue9es4biDzt528YhNctPGcNeqw9nDXnSv',
  canaan: 'KT1GCvVdxELA4mPUn4DiBpPAd8ARRtyoEpke',
  script419: 'KT1WczRb1giprHqCp3ADRn8JrkGBT6aENJmV',
  acidCoin: 'KT1WdWDKYmxHGNVWqnSPNnm7ZB6NeKNG6zPB',
  redeemTokenId: 0,
  decimals: 0,
});

// Canonical ticket dataset: pair IDs 0..30 = CANAAN; 31..43 = THE 419 SCRIPT.
// Pair IDs are explicit operational assignments, not token_mapping_size offsets.
const COLLECTION_AMOUNTS = Object.freeze([
  Object.freeze({ contract: TARGET.canaan, amounts: Object.freeze([
    10, 10, 20, 25, 20, 20, 20, 12, 25, 20, 34, 12, 13, 15, 20, 25,
    34, 50, 5, 50, 20, 25, 25, 20, 5, 17, 20, 20, 10, 10, 3,
  ]) }),
  Object.freeze({ contract: TARGET.script419, amounts: Object.freeze([
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  ]) }),
]);
export const PAIRS = Object.freeze(COLLECTION_AMOUNTS.flatMap(({ contract, amounts }, collection) =>
  amounts.map((redeemAmount, tokenId) => Object.freeze({
    token_pair_id: tokenId + (collection === 0 ? 0 : 31),
    burn_contract_address: contract,
    burn_token_id: tokenId,
    burn_amount: 1,
    redeem_contract_address: TARGET.acidCoin,
    redeem_token_id: TARGET.redeemTokenId,
    redeem_amount: redeemAmount,
  }))));

export function validatePairs(pairs = PAIRS, config = chainRegistry.testnet) {
  assert.equal(config.label, TARGET.network, 'Network must be Shadownet');
  assert.equal(config.beaconNetwork, 'shadownet');
  assert.equal(config.rpc, 'https://rpc.tzkt.io/shadownet');
  assert.equal(config.tzkt, 'https://api.shadownet.tzkt.io');
  assert.equal(config.escrows.exchange.address, TARGET.escrow, 'Verified Exchange target required');
  assert.equal(config.collections.CANAAN, TARGET.canaan);
  assert.equal(config.collections['THE 419 SCRIPT'], TARGET.script419);
  assert.equal(config.collections['ACID COIN'], TARGET.acidCoin);
  assert.equal(pairs.length, 44, 'Exactly 44 pairs required');
  assert.equal(new Set(pairs.map(p => `${p.burn_contract_address}:${p.burn_token_id}`)).size, 44,
    'Duplicate burn collection/token');
  assert.equal(new Set(pairs.map(p => p.token_pair_id)).size, 44, 'Duplicate pair ID');
  for (const { contract, amounts } of COLLECTION_AMOUNTS) {
    const group = pairs.filter(p => p.burn_contract_address === contract);
    assert.equal(group.length, amounts.length, 'Wrong collection count');
    assert.deepEqual(group.map(p => p.burn_token_id).sort((a, b) => a - b), amounts.map((_, id) => id),
      'Token IDs must cover the complete collection');
    for (const pair of group) {
      assert.equal(pair.redeem_amount, amounts[pair.burn_token_id], 'Amount differs from ticket table');
      assert.equal(pair.token_pair_id, pair.burn_token_id + (contract === TARGET.canaan ? 0 : 31));
    }
  }
  for (const pair of pairs) {
    assert.deepEqual(Object.keys(pair).sort(), Object.keys(PAIRS[0]).sort(), 'Unexpected record fields');
    for (const field of ['token_pair_id', 'burn_token_id', 'burn_amount', 'redeem_token_id', 'redeem_amount']) {
      assert.ok(Number.isSafeInteger(pair[field]) && pair[field] >= 0, `${field} must be a natural integer`);
    }
    assert.equal(pair.burn_amount, 1);
    assert.equal(pair.redeem_contract_address, TARGET.acidCoin);
    assert.equal(pair.redeem_token_id, 0);
    assert.ok(pair.redeem_amount > 0);
  }
}

function findAnnotated(node, annotation) {
  if (node.annots?.includes(annotation)) return node;
  return node.args?.map(child => findAnnotated(child, annotation)).find(Boolean);
}

export async function buildPayload(pairs = PAIRS) {
  validatePairs(pairs);
  const artifact = await readFile(new URL('../contracts/burn-redeem-escrow/artifacts/burn-redeem-escrow-audited.tz', import.meta.url));
  assert.equal(createHash('sha256').update(artifact).digest('hex'),
    'fe850ea74a082d8e57ee47d0e3d70339088d1490128d93a86bdddb338947f0a9', 'Promoted ABI artifact changed');
  // Strip parser source-position symbols before comparing with RPC JSON schemas.
  const code = JSON.parse(JSON.stringify(new Parser().parseScript(artifact.toString('utf8'))));
  const annotatedType = findAnnotated(code.find(n => n.prim === 'parameter'), '%set_token_pairs');
  assert.equal(annotatedType?.prim, 'list', 'set_token_pairs must take a bare list');
  // Octez /entrypoints removes the root entrypoint name; retain all record annotations.
  const { annots, ...type } = annotatedType;
  const schema = new ParameterSchema(type);
  const value = schema.EncodeObject(pairs);
  const decoded = schema.Execute(value);
  assert.deepEqual(decoded.map(pair => Object.fromEntries(Object.entries(pair).map(([key, item]) =>
    [key, typeof pairs[0][key] === 'number' ? Number(item.toString()) : item]))), pairs,
  'Taquito ABI round trip failed');
  return { type, code, parameter: { entrypoint: 'set_token_pairs', value } };
}

export function printSummary(payload, log = console.log) {
  log(`Target: ${TARGET.escrow}\nNetwork: ${TARGET.network} (registry slot testnet)\nRPC: ${chainRegistry.testnet.rpc}`);
  log('Validation PASS: 44 pairs; CANAAN 31; THE 419 SCRIPT 13; no duplicates; exact ticket amounts; burn 1; ACID COIN token 0 / decimals 0.');
  log(Object.keys(PAIRS[0]).join(' | '));
  for (const pair of PAIRS) log(Object.values(pair).join(' | '));
  log('Deterministic payload (bare list, no token_pairs wrapper):');
  log(JSON.stringify({ to: TARGET.escrow, amount: 0, parameter: payload.parameter }, null, 2));
}

export async function inspectChain(tezos, payload) {
  assert.equal(tezos.rpc.getRpcUrl().replace(/\/$/, ''), chainRegistry.testnet.rpc, 'Provider RPC must match Shadownet');
  assert.equal(await tezos.rpc.getChainId(), TARGET.chainId, 'Wrong chain ID');
  const header = await tezos.rpc.getBlockHeader();
  const block = String(header.level);
  const script = await tezos.rpc.getScript(TARGET.escrow, { block });
  const entrypoints = await tezos.rpc.getEntrypoints(TARGET.escrow, { block });
  assert.deepEqual(entrypoints.entrypoints.set_token_pairs, payload.type, 'Live entrypoint ABI differs');
  const storageType = script.code.find(n => n.prim === 'storage').args[0];
  assert.deepEqual(storageType, payload.code.find(n => n.prim === 'storage').args[0], 'Live storage ABI differs');
  const storage = new Schema(storageType).Execute(script.storage);
  const mapType = findAnnotated(storageType, '%token_mapping');
  assert.equal(mapType?.prim, 'big_map', 'token_mapping must be a big-map');
  const schema = new Schema(mapType);
  assert.ok(storage.token_mapping != null, 'token_mapping big-map absent');
  return { schema, storage, level: header.level };
}

export async function readBack(tezos, snapshot) {
  // Local packing avoids even the RPC pack_data simulation helper.
  tezos.setPackerProvider(new MichelCodecPacker());
  const { schema, storage, level } = snapshot;
  const report = { level, matching: [], missing: [], mismatched: [], unexpectedCount: 0,
    unexpectedIds: 'Not enumerable through RPC: token_mapping is a big_map, not a map.' };
  let present = 0;
  for (const pair of PAIRS) {
    let actual;
    try {
      actual = await tezos.contract.getBigMapKeyByID(storage.token_mapping.toString(), pair.token_pair_id, schema, level);
    } catch (error) {
      if (error.status !== 404) throw error;
    }
    if (actual == null) { report.missing.push(pair.token_pair_id); continue; }
    present++;
    const differences = Object.entries(pair).filter(([field, value]) =>
      field !== 'token_pair_id' && String(actual[field]) !== String(value))
      .map(([field, expected]) => ({ field, expected, actual: String(actual[field]) }));
    if (differences.length) report.mismatched.push({ token_pair_id: pair.token_pair_id, differences });
    else report.matching.push(pair.token_pair_id);
  }
  const size = Number(storage.token_mapping_size.toString());
  assert.ok(Number.isSafeInteger(size) && size >= present, 'Invalid on-chain map cardinality');
  report.unexpectedCount = size - present;
  return report;
}

export function parseArgs(args) {
  let mode = 'dry-run';
  let provider;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--execute' || arg === '--verify') {
      assert.equal(mode, 'dry-run', 'Choose only one mode');
      mode = arg.slice(2);
    } else if (arg === '--provider') {
      assert.ok(!provider && args[i + 1] && !args[i + 1].startsWith('--'), '--provider requires one local module path');
      provider = args[++i];
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  assert.ok(mode === 'execute' || !provider, '--provider is only allowed with --execute');
  return { mode, provider };
}

export async function run(args = process.argv.slice(2), log = console.log) {
  const { mode, provider } = parseArgs(args);
  const payload = await buildPayload();
  printSummary(payload, log);
  if (mode === 'dry-run') {
    log('DRY RUN ONLY: no provider loaded, signer requested, RPC request, or transaction attempted.');
    return;
  }
  let tezos;
  if (mode === 'execute') {
    assert.ok(provider, 'Execution requires --provider <local-module.mjs> exporting a signer-configured tezos toolkit');
    ({ tezos } = await import(pathToFileURL(resolve(provider)).href));
    assert.ok(tezos?.signer?.publicKeyHash && tezos?.contract?.at, 'Configured Taquito signer/provider absent');
  } else tezos = new TezosToolkit(chainRegistry.testnet.rpc);
  const snapshot = await inspectChain(tezos, payload);
  if (mode === 'verify') {
    const report = await readBack(tezos, snapshot);
    log(JSON.stringify(report, null, 2));
    return report.matching.length === 44 && report.unexpectedCount === 0;
  }
  assert.equal(await tezos.signer.publicKeyHash(), snapshot.storage.admin, 'Signer must be the escrow administrator');
  const before = await readBack(tezos, snapshot);
  assert.equal(before.missing.length, 44, 'Pair IDs already occupied; set_token_pairs cannot overwrite. Review read-back before retrying.');
  assert.equal(before.unexpectedCount, 0, 'Unexpected existing pairs; review before execution');
  const contract = await tezos.contract.at(TARGET.escrow);
  const method = contract.methodsObject.set_token_pairs(PAIRS);
  assert.deepEqual(method.toTransferParams().parameter, payload.parameter, 'Live Taquito payload differs from reviewed payload');
  const operation = await method.send({ amount: 0 });
  log(`Operation injected: ${operation.hash}`);
  await pollForConfirmation({ tzktBase: chainRegistry.testnet.tzkt, opHash: operation.hash,
    expectedDestination: TARGET.escrow, expectedEntrypoint: 'set_token_pairs', timeout: 120000, interval: 5000 });
  const after = await readBack(tezos, await inspectChain(tezos, payload));
  log(JSON.stringify(after, null, 2));
  assert.equal(after.matching.length, 44, 'Confirmed operation read-back differs from intended pairs');
  assert.equal(after.unexpectedCount, 0, 'Unexpected pairs after confirmation');
  return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  run().then(result => { if (result === false) process.exitCode = 1; }).catch(error => {
    // Avoid dumping signer/provider objects or configuration containing secrets.
    console.error(`Exchange pairs failed: ${error.message}`);
    process.exitCode = 1;
  });
}
