import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { copyFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import params from '../../shared/drop-params/drop-params.js';
import { chainRegistry } from '../../shared/chain-registry.js';
import { validateDropParams, serializeDropParamsSource } from '../../shared/drop-params/drop-params-authoring.mjs';
import { normalize } from '../../admin-ui/src/features/drops/drops.data.js';
import { buildItems } from '../../admin-ui/src/features/drops/drops.builder.js';
import { getLiveCfg } from '../../admin-ui/src/utils/live-cfg.js';
import { validateTranslationAudit } from '../../admin-ui/src/features/drops/utils/validate-translation-audit.js';
import { resolveBurnTokenRenderIdentities } from '../../drops/js/token-rendering.js';
import { isCurrentWalletProjection, setRegionPending } from '../../drops/js/reveal-coordinator.js';
import * as trade from '../../shared/public-trade-ops.js';

// Reuse the maintained inert DOM/CMS fixture, executing the current production
// page functions that fixture extracts. Do not write real params, request a
// wallet, fetch a provider, or manipulate real operational journals/locks/archives.
const source = readFileSync(new URL('../../drops/js/events.js', import.meta.url), 'utf8').replace(/\r\n?/g, '\n');
const fixtureSource = readFileSync(new URL('../../drops/js/wallet-rendering.test.mjs', import.meta.url), 'utf8');
const begin = fixtureSource.indexOf('function section(');
const end = fixtureSource.indexOf('function assertCanonical(');
assert.ok(begin >= 0 && end > begin);
const realm = vm.createContext({ source, vm, assert, ...trade,
  resolveBurnTokenRenderIdentities, isCurrentWalletProjection, setRegionPending,
  pollForSharedNFTUpdate: trade.pollForNFTUpdate,
});
vm.runInContext(fixtureSource.slice(begin, end), realm);
const cfg = getLiveCfg();
const mirror = chainRegistry.testnet.mirrors.HEN;
assert.equal(mirror['94684'], '0');
assert.equal(Object.hasOwn(mirror, '0'), false);
const flush = () => new Promise(resolve => setImmediate(resolve));

for (const [label, exclusions, expectedEligible, observedEligible] of [
  ['no exclusions control', [], true, true],
  ['mapped canonical exclusion control', ['94684'], false, false],
  ['different canonical ID collides with network ID', ['0'], true, false],
]) {
  const candidate = structuredClone(params);
  candidate.burnTokens[0].exclude = exclusions;
  const validation = validateDropParams(candidate, { operation: 'active' });
  assert.equal(validation.ok, true, JSON.stringify(validation.errors));
  assert.match(serializeDropParamsSource(candidate, { operation: 'active' }), /export default/);
  const expectedIds = Object.entries(mirror).filter(([canonical]) => !exclusions.includes(canonical)).map(([, id]) => id);
  assert.equal(expectedIds.includes('0'), expectedEligible, 'oracle excludes canonical identities before translation');

  const norm = normalize(candidate);
  assert.equal(norm.burnTokenIds.map(String).includes('0'), observedEligible);
  const audit = validateTranslationAudit({ rawParams: candidate, norm, cfg,
    items: buildItems(norm, { startId: 10 }) });
  assert.equal(audit.ok, label !== 'different canonical ID collides with network ID');
  if (!audit.ok) assert.equal(audit.reason, 'network-mirror-mismatch');

  const f = realm.fixture({ enabled: ['HEN'] });
  Object.assign(f.context, { burnTokens: candidate.burnTokens,
    collections: chainRegistry.testnet.collections, tokenMapping: chainRegistry.testnet.mirrors });
  f.connect('inert-wallet', Promise.resolve([{
    contractAddress: chainRegistry.testnet.collections.HEN, tokenId: '0', balance: '2',
  }]));
  await flush();
  assert.equal(f.errors.length, 0, 'page fixture reaches a successful holdings render');
  assert.equal(f.ids('HEN').includes('0'), observedEligible);
  console.log(`${label}: schema accepted; intended 94684 -> 0 eligible=${expectedEligible}; Admin/Public eligible=${observedEligible}; translation audit=${audit.ok ? 'ok' : audit.reason}`);
}

// Prove admission through the actual supported writer in a disposable copy,
// rather than inferring that a schema-only probe necessarily reaches publication.
const root = fileURLToPath(new URL('../../', import.meta.url));
const work = join(root, 'audits', 'work');
await mkdir(work, { recursive: true });
const sandbox = await mkdtemp(join(work, 'AUD-007-exclusions-'));
assert.equal(dirname(sandbox), work);
try {
  for (const dir of ['shared/drop-params', 'admin-ui/src']) await mkdir(join(sandbox, dir), { recursive: true });
  await writeFile(join(sandbox, 'package.json'), '{"type":"module"}');
  const modules = ['chain-registry.js', 'drop-time.js', 'network.js', 'public-drop-compatibility.js',
    ...['authoring', 'archive', 'projector', 'recovery', 'transaction'].map(name => `drop-params/drop-params-${name}.mjs`),
    'drop-params/drop-params.js', 'drop-params/drop-params.json'];
  for (const name of modules) await copyFile(join(root, 'shared', name), join(sandbox, 'shared', name));
  await copyFile(join(sandbox, 'shared/drop-params/drop-params.json'), join(sandbox, 'admin-ui/src/drop-params.mirror.json'));
  const projector = await import(pathToFileURL(join(sandbox, 'shared/drop-params/drop-params-projector.mjs')));
  const writer = await import(pathToFileURL(join(sandbox, 'shared/drop-params/drop-params-transaction.mjs')));
  const candidate = structuredClone(params);
  candidate.burnTokens[0].exclude = ['0'];
  const result = await writer.editDropParams({ operationId: 'AUD-007-exclusion-control',
    expectedSourceVersion: await projector.getCurrentSourceVersion(), candidate });
  assert.equal(result.status, 'completed');
  await projector.assertDropParamsEquality({ expectedParams: candidate });
  console.log('Supported EDIT writer: completed; source, generated JSON and Admin mirror all verify the accepted exclusion 0 in a disposable copy.');
} finally {
  const cleanup = relative(resolve(work), resolve(sandbox));
  assert.ok(cleanup && !cleanup.startsWith('..') && !isAbsolute(cleanup));
  await rm(sandbox, { recursive: true, force: true });
}
console.log('CONFIRMED: accepted canonical exclusion 0 removes the distinct HEN 94684 -> Shadownet 0 identity; both positive controls pass. No real operational state or external systems touched.');
