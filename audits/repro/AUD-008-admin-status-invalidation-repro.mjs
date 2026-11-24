import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Reuse the maintained composed controller/classifier/view seam, exposing its
// existing runtime solely to drive the production provider-consumer boundary.
const fixtureUrl = new URL('../../admin-ui/tests/runtime/drops-status-ordering.test.mjs', import.meta.url);
let source = readFileSync(fixtureUrl, 'utf8');
const end = source.indexOf('\nfunction assertStatus(');
assert.ok(end > 0, 'Maintained fixture boundary');
source = source.slice(0, end)
  .replace(/from (['"])([^'"]+)\1/g, (_match, _quote, specifier) =>
    `from ${JSON.stringify(specifier.startsWith('.') ? new URL(specifier, fixtureUrl).href : specifier)}`)
  .replaceAll('import.meta.url', JSON.stringify(fixtureUrl.href));
assert.ok(source.includes('wired.defaultExport(raw);'));
assert.ok(source.includes('return { tasks, snapshots, fire:'));
source = source.replace('wired.defaultExport(raw);', 'const runtime = wired.defaultExport(raw);')
  .replace('return { tasks, snapshots, fire:', 'return { runtime, tasks, snapshots, fire:')
  .replace('const common = {', 'const common = { invalidateDropInstant, setStatus,')
  .replace("getDropsPublicState: () => { snapshots.push('state'); return {}; }",
    "getDropsPublicState: value => { snapshots.push('state'); return getDropsPublicState(value); }");
source = `import { invalidateDropInstant } from ${JSON.stringify(new URL('../../admin-ui/src/features/drops/drops.time-cache.js', import.meta.url).href)};\n`
  + `import { setStatus } from ${JSON.stringify(new URL('../../admin-ui/src/utils/status.js', import.meta.url).href)};\n`
  + `import { getDropsPublicState } from ${JSON.stringify(new URL('../../admin-ui/src/features/drops/drops.public-state.js', import.meta.url).href)};\n` + source;
const { fixture, settle } = await import(`data:text/javascript;base64,${Buffer.from(source + '\nexport { fixture, settle };').toString('base64')}`);

const f = fixture();
const wired = f.wireController();
const old = f.run();
await settle();
f.reads[0].resolve(f.rows);
await old;
assert.match(f.nodes['drop-status-label'].textContent, /^FULLY SET/,
  'Positive control: real classifier and view establish old terms fully set');

const next = structuredClone(f.deps.DROP_PARAMS);
next.burnTokens.find(token => token.enabled).burnAmount += 1;
assert.equal(wired.runtime.updateParams(next), true,
  'Production consumer accepts a replacement immutable provider snapshot');
await settle();
assert.ok(f.reads.length >= 2, 'Replacement starts its own real pair-status read');
assert.match(f.nodes['drop-status-label'].textContent, /^FULLY SET/,
  'Defect: previous fully-set claim survives changed terms during verification');
assert.equal(f.nodes['btn-drop-send'].disabled, true,
  'Do not confuse the incorrect readiness claim with an unsafe Send bypass');

// Keep chain mappings unchanged: their old amounts no longer match new terms.
f.reads.at(-1).resolve(f.rows);
await settle(); await settle();
assert.match(f.nodes['drop-status-label'].textContent, /^NOT SET/,
  'Positive control: current completed read reports the changed terms missing');
assert.deepEqual(f.errors, [], 'No hidden controller or loader exception');
console.log('AUD-008 status invalidation: old FULLY SET claim survives new provider terms while their read is pending; resolved current evidence correctly reports NOT SET. No send bypass claimed.');
