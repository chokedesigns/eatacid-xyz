import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { verifyPagesHomeLoaderArtifacts } from './verify-pages-home-loader-artifacts.mjs';

const CURRENT_LOADER = await readFile(
  new URL('../loaders/home.loader.js', import.meta.url),
  'utf8'
);
const PAGES_WORKFLOW = await readFile(
  new URL('../.github/workflows/pages.yml', import.meta.url),
  'utf8'
);
const OLD_LOADER = `const PROD_HOSTS = new Set(["eatacid.xyz", "www.eatacid.xyz"]);

const base = PROD_HOSTS.has(window.location.hostname) ? "./prod" : "./staging";

import(\`${'${base}'}/home.js\`).catch((err) => {
  console.error("[EA] home bundle load failed:", base, err);
});
`;
const FIRST_PAINT_BUNDLE = `const STATE_KEY = '__EA_PUBLIC_FIRST_PAINT__';\n`;
const HOME_BUNDLE = `console.log('[EA] Home application fixture');\n`;

async function createArtifactTree(loader = CURRENT_LOADER) {
  const directory = await mkdtemp(join(tmpdir(), 'ea-pages-home-loader-'));
  const artifact = join(directory, 'dist');
  const source = join(directory, 'main-home.loader.js');

  await Promise.all([
    mkdir(join(artifact, 'prod'), { recursive: true }),
    mkdir(join(artifact, 'staging'), { recursive: true })
  ]);
  await Promise.all([
    writeFile(source, loader),
    writeFile(join(artifact, 'home.js'), loader),
    writeFile(join(artifact, 'prod', 'first-paint.js'), FIRST_PAINT_BUNDLE),
    writeFile(join(artifact, 'prod', 'home.js'), HOME_BUNDLE),
    writeFile(join(artifact, 'staging', 'first-paint.js'), FIRST_PAINT_BUNDLE),
    writeFile(join(artifact, 'staging', 'home.js'), HOME_BUNDLE)
  ]);

  return { directory, artifact, source };
}

async function withArtifactTree(loader, run) {
  const tree = await createArtifactTree(loader);
  try {
    await run(tree);
  } finally {
    await rm(tree.directory, { recursive: true, force: true });
  }
}

const quiet = { log() {} };

await withArtifactTree(CURRENT_LOADER, async ({ artifact, source }) => {
  const result = await verifyPagesHomeLoaderArtifacts(artifact, source, quiet);
  assert.equal(result.loaderBytes, Buffer.byteLength(CURRENT_LOADER));
  assert.deepEqual(
    result.artifacts.map(({ environment }) => environment),
    ['prod', 'staging']
  );
});

await withArtifactTree(OLD_LOADER, async ({ artifact, source }) => {
  await assert.rejects(
    verifyPagesHomeLoaderArtifacts(artifact, source, quiet),
    /missing required reference: `\$\{base\}\/first-paint\.js`/
  );
});

for (const environment of ['prod', 'staging']) {
  await withArtifactTree(CURRENT_LOADER, async ({ artifact, source }) => {
    await rm(join(artifact, environment, 'first-paint.js'));
    await assert.rejects(
      verifyPagesHomeLoaderArtifacts(artifact, source, quiet),
      new RegExp(`missing ${environment} first-paint artifact`)
    );
  });
}

await withArtifactTree(CURRENT_LOADER, async ({ artifact, source }) => {
  await rm(join(artifact, 'staging', 'home.js'));
  await assert.rejects(
    verifyPagesHomeLoaderArtifacts(artifact, source, quiet),
    /missing staging Home application artifact/
  );
});

await withArtifactTree(CURRENT_LOADER, async ({ artifact, source }) => {
  await writeFile(join(artifact, 'home.js'), OLD_LOADER);
  await assert.rejects(
    verifyPagesHomeLoaderArtifacts(artifact, source, quiet),
    /root Home loader differs from authoritative main source/
  );
});

await withArtifactTree(CURRENT_LOADER, async ({ artifact, source }) => {
  await verifyPagesHomeLoaderArtifacts(artifact, source, quiet);
  await writeFile(join(artifact, 'home.js'), OLD_LOADER);
  await assert.rejects(
    verifyPagesHomeLoaderArtifacts(artifact, source, quiet),
    /root Home loader differs from authoritative main source/
  );
});

await withArtifactTree(CURRENT_LOADER, async ({ artifact, source }) => {
  await writeFile(
    join(artifact, 'prod', 'first-paint.js'),
    'console.log("wrong artifact");\n'
  );
  await assert.rejects(
    verifyPagesHomeLoaderArtifacts(artifact, source, quiet),
    /prod first-paint artifact lacks coordinator marker/
  );
});

{
  const loaderCopy =
    'cp repo-main/loaders/home.loader.js dist/home.js';
  const compatibilityCheck =
    'node repo-staging/scripts/verify-pages-home-loader-artifacts.mjs ' +
    'dist repo-main/loaders/home.loader.js';
  const uploadStep = 'uses: actions/upload-pages-artifact@v3';
  const loaderCopyIndex = PAGES_WORKFLOW.indexOf(loaderCopy);
  const compatibilityCheckIndex = PAGES_WORKFLOW.indexOf(compatibilityCheck);
  const uploadIndex = PAGES_WORKFLOW.indexOf(uploadStep);

  assert.ok(loaderCopyIndex >= 0, 'workflow must copy the Home loader from main');
  assert.ok(
    compatibilityCheckIndex > loaderCopyIndex,
    'workflow must verify after copying the authoritative Home loader'
  );
  assert.ok(
    uploadIndex > compatibilityCheckIndex,
    'workflow must verify before uploading the Pages artifact'
  );

  const postValidationWorkflow = PAGES_WORKFLOW.slice(
    compatibilityCheckIndex + compatibilityCheck.length,
    uploadIndex
  );
  assert.equal(
    /(?:cp|mv|rm|sed)\s+[^\n]*dist(?:\/|\\)home\.js/.test(postValidationWorkflow),
    false,
    'workflow must not mutate dist/home.js after compatibility validation'
  );
}

console.log('Pages Home loader artifact compatibility tests passed.');
