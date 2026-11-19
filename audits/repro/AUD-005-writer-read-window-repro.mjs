import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Copy current modules unchanged. The FS read seam inserts a real editor save
// after the ownership check has obtained the old source bytes, before it checks
// the other files/renames. This is an ordered interleaving, not a timing guess.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const work = path.join(root, 'audits/work');
await mkdir(work, { recursive: true });
for (const schedule of ['unchanged', 'before-check', 'during-check']) {
  const fixture = await mkdtemp(path.join(work, 'AUD-005-write-window-'));
  assert.equal(path.dirname(fixture), work);
  let hooks;
  try {
    const dest = path.join(fixture, 'shared/drop-params');
    await mkdir(dest, { recursive: true });
    await mkdir(path.join(fixture, 'admin-ui/src'), { recursive: true });
    await writeFile(path.join(fixture, 'package.json'), '{"type":"module"}');
    for (const name of ['chain-registry.js', 'network.js', 'drop-time.js', 'public-drop-compatibility.js'])
      await cp(path.join(root, 'shared', name), path.join(fixture, 'shared', name));
    for (const name of ['drop-params.js', 'drop-params.json', 'drop-params-authoring.mjs', 'drop-params-projector.mjs',
      'drop-params-archive.mjs', 'drop-params-recovery.mjs', 'drop-params-transaction.mjs'])
      await cp(path.join(root, 'shared/drop-params', name), path.join(dest, name));
    await cp(path.join(root, 'admin-ui/src/drop-params.mirror.json'), path.join(fixture, 'admin-ui/src/drop-params.mirror.json'));
    const writerUrl = pathToFileURL(path.join(dest, 'drop-params-transaction.mjs')).href;
    const sourcePath = path.join(dest, 'drop-params.js');
    const edgeUrl = `aud005-fs:${path.basename(fixture)}`;
    const state = { armed: false, injected: false, sourcePath, async save() {
      await writeFile(sourcePath, state.laterBytes);
      assert.equal(await readFile(sourcePath, 'utf8'), state.laterBytes);
      state.injected = true;
    } };
    globalThis.__aud005WriterRead = state;
    hooks = registerHooks({
      resolve(specifier, context, next) {
        if (specifier === 'node:fs/promises' && context.parentURL === writerUrl) return { shortCircuit: true, url: edgeUrl };
        return next(specifier, context);
      },
      load(url, context, next) {
        if (url !== edgeUrl) return next(url, context);
        return { shortCircuit: true, format: 'module', source: `
          import * as fs from 'node:fs/promises';
          export const { mkdir, open, rename, rm, unlink } = fs;
          export async function readFile(...args) {
            const bytes = await fs.readFile(...args);
            const state = globalThis.__aud005WriterRead;
            if (state.armed && args[0] === state.sourcePath) {
              state.armed = false;
              await state.save();
            }
            return bytes;
          }
        ` };
      },
    });
    const load = name => import(pathToFileURL(path.join(dest, name)).href);
    const writer = await load('drop-params-transaction.mjs');
    const projector = await load('drop-params-projector.mjs');
    const schema = await load('drop-params-authoring.mjs');
    const current = (await load('drop-params.js')).default;
    const candidate = { ...current, dropName: 'REVIEWED CANDIDATE' };
    state.laterBytes = schema.serializeDropParamsSource({ ...current, dropName: 'LATER EDITOR SAVE' });
    const apply = writer.editDropParams({ operationId: 'aud005-read-window', candidate,
      expectedSourceVersion: await projector.getCurrentSourceVersion() }, { testHooks: {
      async beforeReplaceFile({ index }) {
        if (index !== 0) return;
        if (schedule === 'before-check') await state.save();
        if (schedule === 'during-check') state.armed = true;
      },
    } });
    if (schedule === 'before-check') {
      await assert.rejects(apply, { code: 'reconciliation_required' });
      assert.equal(await readFile(sourcePath, 'utf8'), state.laterBytes);
      assert.equal((await writer.inspectDropParamsTransactionStatus()).blocked, true);
    } else {
      assert.equal((await apply).status, 'completed');
      assert.equal(await readFile(sourcePath, 'utf8'), schema.serializeDropParamsSource(candidate));
      assert.equal((await projector.verifyDropParamsEquality({ expectedParams: candidate })).ok, true);
      assert.equal((await writer.inspectDropParamsTransactionStatus()).blocked, false);
    }
    assert.equal(state.injected, schedule !== 'unchanged');
    console.log(JSON.stringify({ schedule, laterSaveMade: state.injected,
      laterSavePreserved: schedule === 'before-check', completed: schedule !== 'before-check' }));
  } finally {
    hooks?.deregister();
    delete globalThis.__aud005WriterRead;
    const relative = path.relative(work, fixture);
    assert.ok(relative && !relative.startsWith('..') && !path.isAbsolute(relative));
    await rm(fixture, { recursive: true, force: true });
  }
}
