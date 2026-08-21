import assert from 'node:assert/strict';
import {
  copyFile,
  mkdtemp,
  mkdir,
  readFile,
  rm,
  writeFile
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { verifyPagesLoaderArtifacts } from './verify-pages-loader-artifacts.mjs';

const SURFACES = ['home', 'drops', 'exchange'];
const FIRST_PAINT_BUNDLE =
  `const STATE_KEY = '__EA_PUBLIC_FIRST_PAINT__';\n`;
const DROPS_FIRST_PAINT_BUNDLE =
  `const STATE_KEY = '__EA_DROPS_EARLY_FIRST_PAINT__';\n` +
  FIRST_PAINT_BUNDLE;
const APPLICATION_BUNDLE = `console.log('[EA] application fixture');\n`;
const LEGACY_LOADERS = Object.fromEntries(SURFACES.map(surface => [surface,
  `const PROD_HOSTS = new Set(["eatacid.xyz", "www.eatacid.xyz"]);\n\n` +
  `const base = PROD_HOSTS.has(window.location.hostname) ? "./prod" : "./staging";\n\n` +
  `import(\`\${base}/${surface}.js\`).catch((err) => {\n` +
  `  console.error("[EA] ${surface} bundle load failed:", base, err);\n` +
  `});\n`
]));

const sourceRoot = new URL('..', import.meta.url);
const ROOT_SOURCES = Object.fromEntries(await Promise.all(SURFACES.map(
  async surface => [surface, await readFile(
    new URL(`loaders/root/${surface}.js`, sourceRoot),
    'utf8'
  )]
)));
const ENVIRONMENT_SOURCES = Object.fromEntries(await Promise.all(SURFACES.map(
  async surface => [surface, await readFile(
    new URL(`loaders/environment/${surface}.js`, sourceRoot),
    'utf8'
  )]
)));
function legacyEnvironmentSource(surface) {
  const title = surface[0].toUpperCase() + surface.slice(1);
  return `function importBundle(specifier) {
  return import(specifier);
}

function start${title}Bundle({
  importModule = importBundle,
  logger = console
} = {}) {
  const specifier = "./${surface}.js";
  let bundleLoad;

  try {
    bundleLoad = Promise.resolve(importModule(specifier)).catch((err) => {
      logger.error("[EA] ${surface} bundle load failed:", specifier, err);
      return null;
    });
  } catch (err) {
    logger.error("[EA] ${surface} bundle load failed:", specifier, err);
    bundleLoad = Promise.resolve(null);
  }

  return { bundleLoad };
}

if (typeof window !== "undefined") {
  start${title}Bundle();
}

export { start${title}Bundle };
`;
}

const LEGACY_DROPS_ENVIRONMENT_SOURCE = legacyEnvironmentSource('drops');
const LEGACY_EXCHANGE_ENVIRONMENT_SOURCE = legacyEnvironmentSource('exchange');
const HOME_WITHOUT_FIRST_PAINT_SOURCE = legacyEnvironmentSource('home');
const PAGES_WORKFLOW = await readFile(
  new URL('.github/workflows/pages.yml', sourceRoot),
  'utf8'
);

async function writeReferencedEarlyArtifacts(
  artifact,
  owner,
  environment,
  environmentSources
) {
  const bundles = new Map([
    ['first-paint.js', FIRST_PAINT_BUNDLE],
    ['drops-first-paint.js', DROPS_FIRST_PAINT_BUNDLE]
  ]);

  for (const [artifactName, bundle] of bundles) {
    const reference = `./${artifactName}`;
    if (!Object.values(environmentSources).some(source => source.includes(reference))) {
      continue;
    }

    await Promise.all([
      writeFile(join(artifact, environment, artifactName), bundle),
      writeFile(join(owner, 'dist', environment, artifactName), bundle)
    ]);
  }
}

async function createFixture(
  mode,
  {
    mainEnvironmentSources = ENVIRONMENT_SOURCES,
    stagingEnvironmentSources = ENVIRONMENT_SOURCES
  } = {}
) {
  const directory = await mkdtemp(join(tmpdir(), 'ea-pages-loaders-'));
  const artifact = join(directory, 'dist');
  const main = join(directory, 'repo-main');
  const staging = join(directory, 'repo-staging');

  await Promise.all([
    mkdir(artifact, { recursive: true }),
    mkdir(join(main, 'loaders'), { recursive: true }),
    mkdir(join(main, 'dist', 'prod'), { recursive: true }),
    mkdir(join(staging, 'loaders', 'root'), { recursive: true }),
    mkdir(join(staging, 'loaders', 'environment'), { recursive: true }),
    mkdir(join(staging, 'dist', 'staging'), { recursive: true }),
    ...['prod', 'staging'].map(environment =>
      mkdir(join(artifact, environment), { recursive: true })
    )
  ]);

  for (const surface of SURFACES) {
    await Promise.all([
      writeFile(
        join(staging, 'loaders', 'root', `${surface}.js`),
        ROOT_SOURCES[surface]
      ),
      writeFile(
        join(staging, 'loaders', 'environment', `${surface}.js`),
        stagingEnvironmentSources[surface]
      ),
      writeFile(join(artifact, 'prod', `${surface}.js`), APPLICATION_BUNDLE),
      writeFile(join(artifact, 'staging', `${surface}.js`), APPLICATION_BUNDLE),
      writeFile(
        join(main, 'dist', 'prod', `${surface}.js`),
        APPLICATION_BUNDLE
      ),
      writeFile(
        join(staging, 'dist', 'staging', `${surface}.js`),
        APPLICATION_BUNDLE
      ),
      writeFile(
        join(artifact, 'staging', `${surface}-loader.js`),
        stagingEnvironmentSources[surface]
      )
    ]);
  }
  await writeReferencedEarlyArtifacts(
    artifact,
    staging,
    'staging',
    stagingEnvironmentSources
  );

  if (mode === 'stable-cutover') {
    await Promise.all([
      mkdir(join(main, 'loaders', 'root'), { recursive: true }),
      mkdir(join(main, 'loaders', 'environment'), { recursive: true })
    ]);
    for (const surface of SURFACES) {
      await Promise.all([
        writeFile(
          join(main, 'loaders', 'root', `${surface}.js`),
          ROOT_SOURCES[surface]
        ),
        writeFile(
          join(main, 'loaders', 'environment', `${surface}.js`),
          mainEnvironmentSources[surface]
        ),
        writeFile(join(artifact, `${surface}.js`), ROOT_SOURCES[surface]),
        writeFile(
          join(artifact, 'prod', `${surface}-loader.js`),
          mainEnvironmentSources[surface]
        )
      ]);
    }
    await writeReferencedEarlyArtifacts(
      artifact,
      main,
      'prod',
      mainEnvironmentSources
    );
  } else {
    for (const surface of SURFACES) {
      await Promise.all([
        writeFile(
          join(main, 'loaders', `${surface}.loader.js`),
          LEGACY_LOADERS[surface]
        ),
        writeFile(join(artifact, `${surface}.js`), LEGACY_LOADERS[surface]),
        writeFile(
          join(artifact, `candidate-${surface}.js`),
          ROOT_SOURCES[surface]
        )
      ]);
    }
  }

  return { directory, artifact, main, staging };
}

async function withFixture(mode, run, options) {
  const fixture = await createFixture(mode, options);
  try {
    await run(fixture);
  } finally {
    await rm(fixture.directory, { recursive: true, force: true });
  }
}

const quiet = { log() {} };
const STAGING_FIRST_EXCHANGE_ROLLOUT = {
  mainEnvironmentSources: {
    ...ENVIRONMENT_SOURCES,
    exchange: LEGACY_EXCHANGE_ENVIRONMENT_SOURCE
  }
};
const STAGING_FIRST_DROPS_ROLLOUT = {
  mainEnvironmentSources: {
    ...ENVIRONMENT_SOURCES,
    drops: LEGACY_DROPS_ENVIRONMENT_SOURCE
  }
};

await withFixture('stable-cutover', async fixture => {
  const result = await verifyPagesLoaderArtifacts(
    fixture.artifact,
    fixture.main,
    fixture.staging,
    quiet
  );
  assert.equal(result.mode, 'stable-cutover');
  assert.equal(result.roots.length, 3);
  assert.equal(result.environmentLoaders.length, 6);
  assert.equal(result.artifacts.length, 10);
  assert.deepEqual(
    result.artifacts.find(artifact =>
      artifact.environment === 'prod' && artifact.surface === 'first-paint'
    ).referencedBy,
    ['home', 'exchange']
  );
  assert.deepEqual(
    result.artifacts.find(artifact =>
      artifact.environment === 'prod' &&
      artifact.surface === 'drops-first-paint'
    ).referencedBy,
    ['drops']
  );
  assert.deepEqual(
    result.artifacts.find(artifact =>
      artifact.environment === 'staging' && artifact.surface === 'drops'
    ).referencedBy,
    ['drops']
  );
});

await withFixture('stable-cutover', async fixture => {
  const result = await verifyPagesLoaderArtifacts(
    fixture.artifact,
    fixture.main,
    fixture.staging,
    quiet
  );
  assert.equal(result.mode, 'stable-cutover');
  assert.equal(result.artifacts.length, 10);
  assert.deepEqual(
    result.artifacts.find(artifact =>
      artifact.environment === 'prod' && artifact.surface === 'first-paint'
    ).referencedBy,
    ['home']
  );
  assert.deepEqual(
    result.artifacts.find(artifact =>
      artifact.environment === 'staging' && artifact.surface === 'first-paint'
    ).referencedBy,
    ['home', 'exchange']
  );
}, STAGING_FIRST_EXCHANGE_ROLLOUT);

await withFixture('stable-cutover', async fixture => {
  const result = await verifyPagesLoaderArtifacts(
    fixture.artifact,
    fixture.main,
    fixture.staging,
    quiet
  );
  assert.equal(result.mode, 'stable-cutover');
  assert.equal(result.artifacts.length, 9);
  assert.equal(
    result.artifacts.some(artifact =>
      artifact.environment === 'prod' &&
      artifact.surface === 'drops-first-paint'
    ),
    false
  );
  assert.deepEqual(
    result.artifacts.find(artifact =>
      artifact.environment === 'staging' &&
      artifact.surface === 'drops-first-paint'
    ).referencedBy,
    ['drops']
  );
  await assert.rejects(
    readFile(join(fixture.artifact, 'prod', 'drops-first-paint.js')),
    /ENOENT/
  );
}, STAGING_FIRST_DROPS_ROLLOUT);

await withFixture('candidate', async fixture => {
  const result = await verifyPagesLoaderArtifacts(
    fixture.artifact,
    fixture.main,
    fixture.staging,
    quiet
  );
  assert.equal(result.mode, 'candidate');
  assert.equal(result.roots.length, 6);
  assert.equal(result.environmentLoaders.length, 3);
  assert.equal(result.artifacts.length, 8);
  await assert.rejects(
    readFile(join(fixture.artifact, 'prod', 'home-loader.js')),
    /ENOENT/
  );
  await assert.rejects(
    readFile(join(fixture.artifact, 'prod', 'first-paint.js')),
    /ENOENT/
  );
});

await withFixture('stable-cutover', async fixture => {
  await rm(join(fixture.artifact, 'staging', 'home.js'));
  await assert.rejects(
    verifyPagesLoaderArtifacts(
      fixture.artifact,
      fixture.main,
      fixture.staging,
      quiet
    ),
    /missing staging home application artifact/
  );
});

await withFixture('stable-cutover', async fixture => {
  await writeFile(
    join(fixture.artifact, 'prod', 'drops-loader.js'),
    ENVIRONMENT_SOURCES.exchange
  );
  await assert.rejects(
    verifyPagesLoaderArtifacts(
      fixture.artifact,
      fixture.main,
      fixture.staging,
      quiet
    ),
    /prod drops environment loader differs/
  );
});

await withFixture('stable-cutover', async fixture => {
  await writeFile(
    join(fixture.artifact, 'staging', 'exchange.js'),
    'console.log("not the staging build output");\n'
  );
  await assert.rejects(
    verifyPagesLoaderArtifacts(
      fixture.artifact,
      fixture.main,
      fixture.staging,
      quiet
    ),
    /staging exchange application artifact differs from staging build output/
  );
});

await withFixture('stable-cutover', async fixture => {
  await rm(join(fixture.artifact, 'staging', 'first-paint.js'));
  await assert.rejects(
    verifyPagesLoaderArtifacts(
      fixture.artifact,
      fixture.main,
      fixture.staging,
      quiet
    ),
    /missing staging first-paint artifact referenced by home\/exchange environment loader\(s\)/
  );
}, STAGING_FIRST_EXCHANGE_ROLLOUT);

await withFixture('stable-cutover', async fixture => {
  const invalidFirstPaint = 'console.log("missing coordinator marker");\n';
  await Promise.all([
    writeFile(
      join(fixture.artifact, 'staging', 'first-paint.js'),
      invalidFirstPaint
    ),
    writeFile(
      join(fixture.staging, 'dist', 'staging', 'first-paint.js'),
      invalidFirstPaint
    )
  ]);
  await assert.rejects(
    verifyPagesLoaderArtifacts(
      fixture.artifact,
      fixture.main,
      fixture.staging,
      quiet
    ),
    /staging first-paint artifact lacks coordinator marker/
  );
}, STAGING_FIRST_EXCHANGE_ROLLOUT);

await withFixture('stable-cutover', async fixture => {
  await rm(join(fixture.artifact, 'staging', 'drops-first-paint.js'));
  await assert.rejects(
    verifyPagesLoaderArtifacts(
      fixture.artifact,
      fixture.main,
      fixture.staging,
      quiet
    ),
    /missing staging drops-first-paint artifact referenced by drops environment loader\(s\)/
  );
}, STAGING_FIRST_DROPS_ROLLOUT);

await withFixture('stable-cutover', async fixture => {
  const missingIdentity = FIRST_PAINT_BUNDLE;
  await Promise.all([
    writeFile(
      join(fixture.artifact, 'staging', 'drops-first-paint.js'),
      missingIdentity
    ),
    writeFile(
      join(fixture.staging, 'dist', 'staging', 'drops-first-paint.js'),
      missingIdentity
    )
  ]);
  await assert.rejects(
    verifyPagesLoaderArtifacts(
      fixture.artifact,
      fixture.main,
      fixture.staging,
      quiet
    ),
    /staging drops first-paint artifact lacks identity marker/
  );
}, STAGING_FIRST_DROPS_ROLLOUT);

await withFixture('stable-cutover', async fixture => {
  const missingCoordinator =
    `const STATE_KEY = '__EA_DROPS_EARLY_FIRST_PAINT__';\n`;
  await Promise.all([
    writeFile(
      join(fixture.artifact, 'prod', 'drops-first-paint.js'),
      missingCoordinator
    ),
    writeFile(
      join(fixture.main, 'dist', 'prod', 'drops-first-paint.js'),
      missingCoordinator
    )
  ]);
  await assert.rejects(
    verifyPagesLoaderArtifacts(
      fixture.artifact,
      fixture.main,
      fixture.staging,
      quiet
    ),
    /prod drops first-paint artifact lacks coordinator marker/
  );
});

await withFixture('stable-cutover', async fixture => {
  await writeFile(
    join(fixture.artifact, 'prod', 'exchange-loader.js'),
    ENVIRONMENT_SOURCES.exchange
  );
  await assert.rejects(
    verifyPagesLoaderArtifacts(
      fixture.artifact,
      fixture.main,
      fixture.staging,
      quiet
    ),
    /prod exchange environment loader differs from authoritative main/
  );
}, STAGING_FIRST_EXCHANGE_ROLLOUT);

await withFixture('stable-cutover', async fixture => {
  await writeFile(
    join(fixture.artifact, 'staging', 'exchange-loader.js'),
    LEGACY_EXCHANGE_ENVIRONMENT_SOURCE
  );
  await assert.rejects(
    verifyPagesLoaderArtifacts(
      fixture.artifact,
      fixture.main,
      fixture.staging,
      quiet
    ),
    /staging exchange environment loader differs from authoritative staging/
  );
}, STAGING_FIRST_EXCHANGE_ROLLOUT);

await withFixture('stable-cutover', async fixture => {
  await rm(join(fixture.artifact, 'prod', 'first-paint.js'));
  await assert.rejects(
    verifyPagesLoaderArtifacts(
      fixture.artifact,
      fixture.main,
      fixture.staging,
      quiet
    ),
    /missing prod first-paint artifact referenced by home\/exchange environment loader\(s\)/
  );
});

await withFixture('stable-cutover', async fixture => {
  await rm(join(fixture.artifact, 'staging', 'first-paint.js'));
  await assert.rejects(
    verifyPagesLoaderArtifacts(
      fixture.artifact,
      fixture.main,
      fixture.staging,
      quiet
    ),
    /missing staging first-paint artifact referenced by home environment loader\(s\)/
  );
}, {
  mainEnvironmentSources: {
    ...ENVIRONMENT_SOURCES,
    exchange: LEGACY_EXCHANGE_ENVIRONMENT_SOURCE
  },
  stagingEnvironmentSources: {
    ...ENVIRONMENT_SOURCES,
    exchange: LEGACY_EXCHANGE_ENVIRONMENT_SOURCE
  }
});

await withFixture('stable-cutover', async fixture => {
  await Promise.all([
    writeFile(
      join(fixture.main, 'loaders', 'environment', 'home.js'),
      HOME_WITHOUT_FIRST_PAINT_SOURCE
    ),
    writeFile(
      join(fixture.artifact, 'prod', 'home-loader.js'),
      HOME_WITHOUT_FIRST_PAINT_SOURCE
    )
  ]);
  await assert.rejects(
    verifyPagesLoaderArtifacts(
      fixture.artifact,
      fixture.main,
      fixture.staging,
      quiet
    ),
    /authoritative main home environment-loader source is missing required local artifact reference: \.\/first-paint\.js/
  );
});

await withFixture('stable-cutover', async fixture => {
  await writeFile(
    join(fixture.artifact, 'prod', 'first-paint.js'),
    'console.log("wrong artifact");\n'
  );
  await writeFile(
    join(fixture.main, 'dist', 'prod', 'first-paint.js'),
    'console.log("wrong artifact");\n'
  );
  await assert.rejects(
    verifyPagesLoaderArtifacts(
      fixture.artifact,
      fixture.main,
      fixture.staging,
      quiet
    ),
    /prod first-paint artifact lacks coordinator marker/
  );
});

await withFixture('candidate', async fixture => {
  await copyFile(
    join(fixture.artifact, 'candidate-home.js'),
    join(fixture.artifact, 'candidate-drops.js')
  );
  await assert.rejects(
    verifyPagesLoaderArtifacts(
      fixture.artifact,
      fixture.main,
      fixture.staging,
      quiet
    ),
    /temporary staging drops candidate router differs/
  );
});

await withFixture('stable-cutover', async fixture => {
  const invalidRoot = ROOT_SOURCES.home.replace(
    'window.location.hostname',
    '"hard-coded-host"'
  );
  await Promise.all([
    writeFile(join(fixture.main, 'loaders', 'root', 'home.js'), invalidRoot),
    writeFile(join(fixture.artifact, 'home.js'), invalidRoot)
  ]);
  await assert.rejects(
    verifyPagesLoaderArtifacts(
      fixture.artifact,
      fixture.main,
      fixture.staging,
      quiet
    ),
    /root home router is missing required reference: window\.location\.hostname/
  );
});

await withFixture('candidate', async fixture => {
  await mkdir(join(fixture.main, 'loaders', 'root'), { recursive: true });
  await writeFile(
    join(fixture.main, 'loaders', 'root', 'home.js'),
    ROOT_SOURCES.home
  );
  await assert.rejects(
    verifyPagesLoaderArtifacts(
      fixture.artifact,
      fixture.main,
      fixture.staging,
      quiet
    ),
    /main contains only part of the root-router source set/
  );
});

{
  const assemblyMarker = '- name: Assemble dist for Pages';
  const verificationCommand =
    'node repo-staging/scripts/verify-pages-loader-artifacts.mjs ' +
    'dist repo-main repo-staging';
  const uploadStep = 'uses: actions/upload-pages-artifact@v3';
  const assemblyIndex = PAGES_WORKFLOW.indexOf(assemblyMarker);
  const verificationIndex = PAGES_WORKFLOW.indexOf(verificationCommand);
  const uploadIndex = PAGES_WORKFLOW.indexOf(uploadStep);

  assert.ok(assemblyIndex >= 0, 'workflow must assemble the Pages graph');
  assert.ok(
    verificationIndex > assemblyIndex,
    'workflow must verify after all Pages assembly copies'
  );
  assert.ok(
    uploadIndex > verificationIndex,
    'workflow must verify before uploading the Pages artifact'
  );

  const postVerificationWorkflow = PAGES_WORKFLOW.slice(
    verificationIndex + verificationCommand.length,
    uploadIndex
  );
  assert.equal(
    /\b(?:cp|mv|rm|sed|install|rsync|truncate)\b[^\n]*\bdist(?:[\/\\]|(?=\s|$))/.test(
      postVerificationWorkflow
    ),
    false,
    'workflow must not mutate any verified Pages graph file after validation'
  );
}

console.log('Pages loader artifact graph tests passed.');
