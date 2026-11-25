import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Historical evidence entrypoint, now a corrective gate. Production readers,
// authoring, panel/checklist consumers and Public resolution run in maintained
// regressions with inert HTTP/DOM/wallet edges. No operational writes occur.
// Additional Node test options may be passed after this script (also used to
// verify that an injected child-test failure propagates to this entrypoint).
const root = new URL('../../', import.meta.url);
const suites = [
  { cwd: new URL('admin-ui/', root), files: [
    'tests/runtime/pair-authority.test.mjs',
    'tests/runtime/pair-compatibility.test.mjs',
    'tests/runtime/drops-pair-status.test.mjs',
    'tests/runtime/pair-pagination.test.mjs',
    'tests/runtime/drops-status-ordering.test.mjs',
    'tests/runtime/drops-readiness-invalidation.test.mjs',
    'tests/runtime/drops-send-invalidation.test.mjs',
  ] },
  { cwd: root, files: ['shared/public-trade-pairs.test.mjs'] },
];
for (const { cwd, files } of suites) {
  const result = spawnSync(process.execPath, ['--test', '--experimental-test-isolation=none',
    ...process.argv.slice(2), ...files], { cwd: fileURLToPath(cwd), stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log('AUD-010 pair compatibility corrective regressions passed (inert boundaries only).');
