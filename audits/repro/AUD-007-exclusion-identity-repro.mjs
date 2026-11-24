import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { copyFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import params from '../../shared/drop-params/drop-params.js';
import { chainRegistry } from '../../shared/chain-registry.js';
import { validateDropParams, serializeDropParamsSource } from '../../shared/drop-params/drop-params-authoring.mjs';
import { createDropsConfig } from '../../drops/js/events-config.js';
import { normalize } from '../../admin-ui/src/features/drops/drops.data.js';
import { buildItems } from '../../admin-ui/src/features/drops/drops.builder.js';
import { getLiveCfg } from '../../admin-ui/src/utils/live-cfg.js';
import { validateTranslationAudit } from '../../admin-ui/src/features/drops/utils/validate-translation-audit.js';
import { resolveBurnTokenRenderIdentities } from '../../drops/js/token-rendering.js';
import { isCurrentWalletProjection, setRegionPending } from '../../drops/js/reveal-coordinator.js';
import * as trade from '../../shared/public-trade-ops.js';

// Historical executable entrypoint, now maintained positive corrective evidence
// for AUD-007-001. The original observed failure remains in AUD-007-findings.md.
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

for (const [label, exclusions, expectedEligible] of [
  ['no exclusions control', [], true],
  ['mapped canonical exclusion control', ['94684'], false],
  ['different canonical ID collides with network ID', ['0'], true],
  ['multiple canonical exclusions', ['103062', '104492', '2'], true],
]) {
  const candidate = structuredClone(params);
  candidate.burnTokens[0].exclude = exclusions;
  const validation = validateDropParams(candidate, { operation: 'active' });
  assert.equal(validation.ok, true, JSON.stringify(validation.errors));
  assert.equal(createDropsConfig(candidate).isConfigured, true);
  assert.match(serializeDropParamsSource(candidate, { operation: 'active' }), /export default/);
  const expectedIds = Object.entries(mirror).filter(([canonical]) => !exclusions.includes(canonical)).map(([, id]) => id);
  assert.equal(expectedIds.includes('0'), expectedEligible, 'oracle excludes canonical identities before translation');

  const norm = normalize(candidate);
  assert.deepEqual(norm.burnTokenIds.map(String), expectedIds);
  const items = buildItems(norm, { startId: 10 });
  assert.deepEqual(items.map(item => String(item.burn.tokenId)), expectedIds);
  assert.ok(items.every(item => item.burn.collection === 'HEN'
    && item.burn.amount === candidate.burnTokens[0].burnAmount
    && item.redeem.tokenId === candidate.redeemToken.tokenId));
  const audit = validateTranslationAudit({ rawParams: candidate, norm, cfg,
    items });
  assert.equal(audit.ok, true);
  const corrupted = { ...norm, burnTokenIds: [...norm.burnTokenIds, 999] };
  assert.equal(validateTranslationAudit({ rawParams: candidate, norm: corrupted, cfg }).ok, false,
    'independent translation audit still rejects corrupted normalization');

  const f = realm.fixture({ enabled: ['HEN'] });
  Object.assign(f.context, { burnTokens: candidate.burnTokens,
    collections: chainRegistry.testnet.collections, tokenMapping: chainRegistry.testnet.mirrors });
  const heldCanonical = ['94684', '103062', '104492']; // actual inert CMS catalog
  f.connect('inert-wallet', Promise.resolve(heldCanonical.map(id => ({
    contractAddress: chainRegistry.testnet.collections.HEN, tokenId: mirror[id], balance: '2',
  }))));
  await flush();
  assert.equal(f.errors.length, 0, 'page fixture reaches a successful holdings render');
  assert.equal(f.ids('HEN').includes('0'), expectedEligible);
  assert.deepEqual(Array.from(f.ids('HEN')), heldCanonical.filter(id => !exclusions.includes(id)).map(id => mirror[id]));
  for (const row of f.panes.HEN.querySelectorAll('[data-token-id]')) {
    assert.equal(row.dataset.contractAddress, chainRegistry.testnet.collections.HEN);
    assert.ok(expectedIds.includes(row.dataset.tokenId), 'native transaction ID is never replaced by a canonical ID');
  }
  console.log(`${label}: supported schema/config accepted; Admin/Public canonical eligibility agrees; translation audit passes and rejects drift.`);
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
console.log('PASS AUD-007-001: canonical exclusion 0 preserves HEN 94684 -> Shadownet 0; canonical exclusion 94684 removes it. No real operational state or external systems touched.');
