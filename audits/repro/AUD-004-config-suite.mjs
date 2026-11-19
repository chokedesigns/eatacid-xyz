import { cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { resolve, join, dirname, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';

// Run suites that intentionally replace config files only in disposable copies.
// Exclude existing journals/locks and archives; never recover or clean real state.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const work = join(root, 'audits/work');
await mkdir(work, { recursive: true });
const sandbox = await mkdtemp(join(work, 'AUD-004-config-'));
assert.equal(dirname(sandbox), work);
try {
  await cp(join(root, 'shared'), join(sandbox, 'shared'), { recursive: true,
    filter: path => !path.includes('.drop-params.') && !path.includes(join('drop-params', 'archive')) });
  await cp(join(root, 'scripts'), join(sandbox, 'scripts'), { recursive: true });
  await cp(join(root, 'drops/js'), join(sandbox, 'drops/js'), { recursive: true });
  await cp(join(root, 'admin-ui/src'), join(sandbox, 'admin-ui/src'), { recursive: true });
  await writeFile(join(sandbox, 'package.json'), '{"type":"module"}');
  // Separate processes preserve each suite's beforeEach/module isolation.
  for (const file of ['drop-params-authoring.test.mjs', 'drop-params-transaction.test.mjs',
    'drop-params-authoring-service.test.mjs', 'drop-params-projection.test.mjs', 'watch-drop-params-json.test.mjs']) {
    const result = spawnSync(process.execPath, ['--test', '--experimental-test-isolation=none',
      `shared/drop-params/${file}`], { cwd: sandbox, encoding: 'utf8', timeout: 180000 });
    process.stdout.write(result.stdout || '');
    process.stderr.write(result.stderr || '');
    if (result.error) throw result.error;
    assert.equal(result.status, 0, `copied suite ${file} failed`);
  }
} finally {
  const rel = relative(work, sandbox);
  assert.ok(rel && !rel.startsWith('..') && !isAbsolute(rel));
  await rm(sandbox, { recursive: true, force: true });
}
