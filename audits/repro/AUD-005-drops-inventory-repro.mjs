import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// The original defect reproduction is now maintained with the real Drops
// lifecycle regressions. Keep this audit command as a focused regression entry.
const result = spawnSync(process.execPath, [
  '--test', '--experimental-test-isolation=none', '--test-name-pattern=AUD-005-004',
  fileURLToPath(new URL('../../drops/js/trade-lifecycle.test.mjs', import.meta.url))
], { stdio: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
