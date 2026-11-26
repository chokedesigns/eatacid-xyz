// Bounded local identity/provenance evidence. No contract execution or network I/O.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { Parser } from '@taquito/michel-codec';
import { validateAddress } from '@taquito/utils';
const read = p => readFileSync(p);
const hash = b => createHash('sha256').update(b).digest('hex').toUpperCase();
const git = (...args) => execFileSync('git', args);
const base = 'docs/EA-XYZ Contract Audit/';
const manifest = read(base + 'release/RELEASE-CANDIDATE-MANIFEST.md').toString();
const rows = [...manifest.matchAll(/\| `([^`]+)` \| `([A-F0-9]{64})` \| `([A-F0-9]{64})` \|/g)];
assert.equal(rows.length, 31);
for (const [, path, checkout, blob] of rows) {
  assert.equal(hash(read(path)), checkout, path + ' checkout');
  assert.equal(hash(git('show', 'HEAD:' + path)), blob, path + ' HEAD blob');
}
console.log('PASS: 31 frozen manifest rows, exact checkout and HEAD blob hashes');
const canonicalPath = 'contracts/burn-redeem-escrow/smartpy/burn-redeem-escrow-smartpy.py';
const source = read(canonicalPath).toString();
assert.deepEqual(read(canonicalPath), read(base + 'source/legacy/burn-redeem-escrow-with-legacy-tests.py'));
const banner = source.indexOf('# =============================================================================\r\n# =================== BURN & REDEEM ESCROW TEST SUITE');
assert.ok(banner > 0);
const targetBanner = source.lastIndexOf('    # =============================================================================\r\n    # ======== COMPILATION TARGET');
assert.ok(targetBanner > banner);
const derived = source.slice(0, banner) + source.slice(targetBanner).replace(/^    /gm, '');
assert.equal(derived, read(base + 'source/burn-redeem-escrow-audit.py').toString());
const promotedPath = 'contracts/burn-redeem-escrow/artifacts/burn-redeem-escrow-audited.tz';
const promoted = read(promotedPath);
assert.equal(hash(promoted), 'FE850EA74A082D8E57EE47D0E3D70339088D1490128D93A86BDDDB338947F0A9');
assert.deepEqual(promoted, git('show', 'HEAD:' + base + 'artifacts/burn-redeem-escrow-audited.tz'));
assert.notEqual(hash(Buffer.concat([promoted, Buffer.from(' ')])), hash(promoted), 'byte mutation control');
for (const [, path, expected] of manifest.matchAll(/\| `([^`]+)` \| `([A-F0-9]{64})` \|/g)) {
  assert.equal(hash(read(path)), expected, path);
}
const freeze = git('log', '--diff-filter=A', '--format=%H', '--', base + 'release/PHASE-8-FREEZE-RECORD.md').toString().trim();
assert.equal(freeze, 'a183e949906cdb2f2300457048ab55589db8b5db');
assert.equal(git('rev-parse', freeze + '^').toString().trim(), '3d2d7651651ad46b475e7ee39c88abffe8d15c0c');
const promotion = git('log', '--diff-filter=A', '--format=%H', '--', base + 'release/PHASE-10-PROMOTION-RECORD.md').toString().trim();
assert.equal(promotion, '88ce348b9dd85605342439be364b1bca80331a29');
assert.equal(git('rev-parse', promotion + '^').toString().trim(), 'bb1691c7e81afa58d3900df625e9b726df6d235b');
console.log('PASS: source/snapshot/stripped fixture, release/archive bytes, freeze/promotion history');
const parser = new Parser();
const ast = JSON.parse(JSON.stringify(parser.parseScript(promoted.toString())));
const old = JSON.parse(JSON.stringify(parser.parseScript(read('contracts/burn-redeem-escrow/artifacts/checks/burn-redeem-escrow-michelson.tz').toString())));
const differences = [];
function compare(a, b, path = '') {
  if (JSON.stringify(a) === JSON.stringify(b)) return;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') { differences.push([path, a, b]); return; }
  assert.deepEqual(Object.keys(a), Object.keys(b));
  for (const key of Object.keys(a)) compare(a[key], b[key], path + '/' + key);
}
compare(old, ast);
assert.equal(differences.length, 37);
assert.ok(differences.every(([path, a, b]) => path.endsWith('/args/1/int') && a !== b));
for (const [path] of differences) {
  const keys = path.split('/').slice(1, -3);
  const instruction = keys.reduce((node, key) => node[key], ast);
  assert.equal(instruction.prim, 'PUSH');
  assert.equal(instruction.args[0].prim, 'int');
  const siblings = keys.slice(0, -1).reduce((node, key) => node[key], ast);
  assert.equal(siblings[Number(keys.at(-1)) + 1].prim, 'FAILWITH');
}
const walk = (n, fn) => { if (Array.isArray(n)) n.forEach(v => walk(v, fn)); else if (n && typeof n === 'object') { fn(n); if (n.args) walk(n.args, fn); } };
const tags = [];
walk(ast, n => { if (n.prim === 'EMIT') tags.push(...n.annots); });
assert.equal(tags.length, 8);
console.log('PASS: historical/promoted parsed structural delta limited to 37 integer leaves; 8 EMIT tags');
const eventCheck = `import json,runpy,sys,copy
v=runpy.run_path(sys.argv[1]); ast=json.load(sys.stdin)
v['verify_event_types'](ast)
bad=copy.deepcopy(ast)
def mutate(n):
    if isinstance(n,list): return any(mutate(x) for x in n)
    if isinstance(n,dict):
        if n.get('prim')=='nat': n['prim']='int'; return True
        return mutate(n.get('args',[]))
def challenge(n):
    if isinstance(n,list): return any(challenge(x) for x in n)
    if isinstance(n,dict):
        if n.get('prim')=='EMIT' and mutate(n['args']): return True
        return challenge(n.get('args',[]))
assert challenge(bad)
try: v['verify_event_types'](bad)
except ValueError: pass
else: raise AssertionError('event nat/int mutation accepted')
print('PASS: exact compiled event types; nat/int mutation rejected (no event execution)')`;
process.stdout.write(execFileSync('python', ['-B', '-c', eventCheck, base + 'tests/verify-smartpy-output.py'], { input: JSON.stringify(ast) }));
const deployment = read(base + 'release/PHASE-11-SHADOWNET-DEPLOYMENT.md').toString();
const bundle = gunzipSync(Buffer.from(deployment.match(/```base64\s+([\s\S]*?)```/)[1].replace(/\s/g, ''), 'base64'));
assert.equal(bundle.length, 1032879);
assert.equal(hash(bundle), '2A5CA6F3759D3D28090344EB6A8FFD0D88BDF34EB0FAD30E4BFAE26334F0B1A9');
const archived = JSON.parse(bundle);
for (const surface of ['drops', 'exchange']) {
  const script = JSON.parse(archived[surface + '-script.json']);
  assert.deepEqual(script.code, ast, surface + ': historical code/type arrays');
}
console.log('PASS: historical deployment archive byte identity and both archived code/type arrays equal current promoted parse');
const registry = await import(pathToFileURL(process.cwd() + '/shared/chain-registry.js'));
const { chainRegistry, resolveDropsEscrow, resolveExchangeEscrow, validatePublicDropsConfig, validatePublicExchangeConfig } = registry;
for (const [net, cfg] of Object.entries(chainRegistry)) {
  for (const address of [cfg.escrow, ...Object.values(cfg.collections), ...Object.values(cfg.escrows).map(v => v.address)].filter(Boolean)) assert.equal(validateAddress(address), 3, net + ': ' + address);
  for (const mirror of Object.values(cfg.mirrors)) {
    assert.equal(new Set(Object.values(mirror)).size, Object.keys(mirror).length);
    for (const [from, to] of Object.entries(mirror)) assert.ok(/^\d+$/.test(from) && /^\d+$/.test(to) && Number.isSafeInteger(Number(to)));
  }
  assert.equal(validatePublicDropsConfig(net).ok, net === 'testnet');
  assert.equal(validatePublicExchangeConfig(net).ok, net === 'testnet');
}
const state = new Map();
globalThis.window = { location: { search: '' }, localStorage: { getItem: key => state.get(key) ?? null, setItem: (key, value) => state.set(key, value) } };
globalThis.fetch = () => { throw new Error('Network forbidden in Batch 1'); };
const cfgModule = await import(pathToFileURL(process.cwd() + '/admin-ui/src/utils/live-cfg.js'));
const adminNet = await import(pathToFileURL(process.cwd() + '/admin-ui/src/network.js'));
for (const net of ['testnet', 'mainnet']) {
  state.set('ea.admin.network', net);
  const cfg = cfgModule.getLiveCfg();
  assert.equal(cfg.network, net);
  const drops = cfgModule.resolveDropsAdminTarget({ cfg });
  const exchange = cfgModule.resolveExchangeAdminTarget({ cfg });
  assert.equal(drops.address, resolveDropsEscrow(net).effectiveAddress);
  assert.equal(exchange.address, resolveExchangeEscrow(net, { strict: true }).effectiveAddress);
  assert.equal(drops.ok, net === 'testnet');
  assert.equal(exchange.ok, net === 'testnet');
  for (const [collection, mirror] of Object.entries(chainRegistry[net].mirrors)) {
    assert.deepEqual(adminNet.translateIdsToNetwork(collection, Object.keys(mirror), net), Object.values(mirror).map(Number));
  }
}
const fallback = structuredClone(chainRegistry.testnet);
fallback.escrows.exchange.address = '';
assert.equal(resolveExchangeEscrow(fallback).source, 'legacy-fallback');
assert.equal(resolveExchangeEscrow(fallback, { strict: true }).effectiveAddress, '');
const cfg = { network: 'testnet', escrow: fallback.escrow, exchangeEscrow: resolveExchangeEscrow(fallback) };
assert.equal(cfgModule.resolveExchangeAdminTarget({ cfg }).ok, false);
assert.equal(cfgModule.resolveAdminSurfaceTarget('drops').ok, false, 'last selected network is unconfigured Mainnet');
state.set('ea.admin.network', 'invalid');
assert.equal(adminNet.getNetwork(), 'testnet');
const publicDrops = (await import(pathToFileURL(process.cwd() + '/drops/js/events-config.js'))).default;
const publicExchange = (await import(pathToFileURL(process.cwd() + '/exchange/js/exchange-config.js'))).default;
assert.equal(publicDrops.contracts.testnet.escrow, cfgModule.getLiveCfg().escrow);
assert.equal(publicExchange.contracts.testnet.escrow, cfgModule.resolveExchangeAdminTarget().address);
console.log('PASS: all current address checksums/mirrors; both Public/Admin targets; Mainnet/unknown/fallback controls');
const { assertPairWriteCompatible } = await import(pathToFileURL(process.cwd() + '/admin-ui/src/features/pairs/pair-compatibility.js'));
const terms = { burn_contract_address: chainRegistry.testnet.collections.HEN, burn_token_id: '0', burn_amount: '1',
  redeem_contract_address: chainRegistry.testnet.collections.CANAAN, redeem_token_id: '9007199254740993', redeem_amount: '2' };
const existing = [{ key: '0', value: terms }];
assertPairWriteCompatible([{ token_pair_id: '1', ...terms, redeem_amount: '3' }], existing);
assertPairWriteCompatible([{ token_pair_id: '0', ...terms }], existing, { update: true });
assert.throws(() => assertPairWriteCompatible([{ token_pair_id: '1', ...terms }], existing), /conflict/);
assert.throws(() => assertPairWriteCompatible([{ token_pair_id: '1', ...terms }], null), /incomplete/);
assert.throws(() => assertPairWriteCompatible([{ token_pair_id: '1', ...terms, redeem_token_id: 9007199254740992 }], existing), /Invalid/);
for (const network of ['testnet', 'mainnet', 'ghostnet']) {
  const result = spawnSync(process.execPath, ['--input-type=module', '-e',
    "import {network} from './shared/network.js'; process.stdout.write(network)"],
    { env: { ...process.env, NETWORK: network }, encoding: 'utf8' });
  if (network === 'ghostnet') { assert.equal(result.status, 1); assert.match(result.stderr, /Unsupported public network slot/); }
  else { assert.equal(result.status, 0); assert.equal(result.stdout, network); }
}
console.log('PASS: real Admin duplicate/exact-term preflight controls and explicit Public NETWORK admission');
