import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Historical entrypoint now runs the maintained corrective runtime evidence.
// Keep the child result authoritative so a regression fails this command too.
const adminRoot = fileURLToPath(new URL('../../admin-ui/', import.meta.url));
const result = spawnSync(process.execPath, [
  '--test', '--experimental-test-isolation=none',
  'tests/runtime/drops-readiness-invalidation.test.mjs',
], { cwd: adminRoot, stdio: 'inherit' });
if (result.error) throw result.error;
if (result.signal) throw new Error(`Admin readiness regressions terminated by ${result.signal}`);
process.exitCode = result.status ?? 1;
