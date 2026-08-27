import assert from 'node:assert/strict';
import {
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
function applicationOnlyEnvironmentSource(surface) {
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

const APPLICATION_ONLY_DROPS_ENVIRONMENT_SOURCE =
  applicationOnlyEnvironmentSource('drops');
const APPLICATION_ONLY_EXCHANGE_ENVIRONMENT_SOURCE =
  applicationOnlyEnvironmentSource('exchange');
const HOME_WITHOUT_FIRST_PAINT_SOURCE = applicationOnlyEnvironmentSource('home');
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

async function createFixture({
  mainEnvironmentSources = ENVIRONMENT_SOURCES,
  stagingEnvironmentSources = ENVIRONMENT_SOURCES
} = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'ea-pages-loaders-'));
  const artifact = join(directory, 'dist');
  const main = join(directory, 'repo-main');
  const staging = join(directory, 'repo-staging');

  await Promise.all([
    mkdir(artifact, { recursive: true }),
    mkdir(join(main, 'loaders', 'root'), { recursive: true }),
    mkdir(join(main, 'loaders', 'environment'), { recursive: true }),
    mkdir(join(main, 'dist', 'prod'), { recursive: true }),
    mkdir(join(staging, 'loaders', 'environment'), { recursive: true }),
    mkdir(join(staging, 'dist', 'staging'), { recursive: true }),
    ...['prod', 'staging'].map(environment =>
      mkdir(join(artifact, environment), { recursive: true })
    )
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
      writeFile(
        join(staging, 'loaders', 'environment', `${surface}.js`),
        stagingEnvironmentSources[surface]
      ),
      writeFile(join(artifact, `${surface}.js`), ROOT_SOURCES[surface]),
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
        join(artifact, 'prod', `${surface}-loader.js`),
        mainEnvironmentSources[surface]
      ),
      writeFile(
        join(artifact, 'staging', `${surface}-loader.js`),
        stagingEnvironmentSources[surface]
      )
    ]);
  }
  await writeReferencedEarlyArtifacts(
    artifact,
    main,
    'prod',
    mainEnvironmentSources
  );
  await writeReferencedEarlyArtifacts(
    artifact,
    staging,
    'staging',
    stagingEnvironmentSources
  );

  return { directory, artifact, main, staging };
}

async function withFixture(run, options) {
  const fixture = await createFixture(options);
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
    exchange: APPLICATION_ONLY_EXCHANGE_ENVIRONMENT_SOURCE
  }
};
const STAGING_FIRST_DROPS_ROLLOUT = {
  mainEnvironmentSources: {
    ...ENVIRONMENT_SOURCES,
    drops: APPLICATION_ONLY_DROPS_ENVIRONMENT_SOURCE
  }
};

await withFixture(async fixture => {
  const result = await verifyPagesLoaderArtifacts(
    fixture.artifact,
    fixture.main,
    fixture.staging,
    quiet
  );
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

await withFixture(async fixture => {
  const result = await verifyPagesLoaderArtifacts(
    fixture.artifact,
    fixture.main,
    fixture.staging,
    quiet
  );
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

await withFixture(async fixture => {
  const result = await verifyPagesLoaderArtifacts(
    fixture.artifact,
    fixture.main,
    fixture.staging,
    quiet
  );
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

await withFixture(async fixture => {
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

await withFixture(async fixture => {
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

await withFixture(async fixture => {
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

await withFixture(async fixture => {
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

await withFixture(async fixture => {
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

await withFixture(async fixture => {
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

await withFixture(async fixture => {
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

await withFixture(async fixture => {
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

await withFixture(async fixture => {
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

await withFixture(async fixture => {
  await writeFile(
    join(fixture.artifact, 'staging', 'exchange-loader.js'),
    APPLICATION_ONLY_EXCHANGE_ENVIRONMENT_SOURCE
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

await withFixture(async fixture => {
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

await withFixture(async fixture => {
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
    exchange: APPLICATION_ONLY_EXCHANGE_ENVIRONMENT_SOURCE
  },
  stagingEnvironmentSources: {
    ...ENVIRONMENT_SOURCES,
    exchange: APPLICATION_ONLY_EXCHANGE_ENVIRONMENT_SOURCE
  }
});

await withFixture(async fixture => {
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

await withFixture(async fixture => {
  const nonLocalHomeSource = ENVIRONMENT_SOURCES.home.replace(
    '"./home.js"',
    '"https://example.invalid/home.js"'
  );
  await Promise.all([
    writeFile(
      join(fixture.main, 'loaders', 'environment', 'home.js'),
      nonLocalHomeSource
    ),
    writeFile(
      join(fixture.artifact, 'prod', 'home-loader.js'),
      nonLocalHomeSource
    )
  ]);
  await assert.rejects(
    verifyPagesLoaderArtifacts(
      fixture.artifact,
      fixture.main,
      fixture.staging,
      quiet
    ),
    /authoritative main home environment-loader source contains a non-local artifact reference/
  );
});

await withFixture(async fixture => {
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

for (const surface of SURFACES) {
  await withFixture(async fixture => {
    await writeFile(
      join(fixture.artifact, `candidate-${surface}.js`),
      ROOT_SOURCES[surface]
    );
    await assert.rejects(
      verifyPagesLoaderArtifacts(
        fixture.artifact,
        fixture.main,
        fixture.staging,
        quiet
      ),
      /retired candidate router artifact must not be present/
    );
  });
}

await withFixture(async fixture => {
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

await withFixture(async fixture => {
  await rm(join(fixture.main, 'loaders', 'root', 'exchange.js'));
  await assert.rejects(
    verifyPagesLoaderArtifacts(
      fixture.artifact,
      fixture.main,
      fixture.staging,
      quiet
    ),
    /main must contain all three permanent root-router sources \(found 2 of 3\)/
  );
});

{
  const assemblyMarker = '- name: Assemble dist for Pages';
  const cleanupCommand = "find dist -type f -name '*.map' -delete";
  const zeroMapAssertion =
    `remaining_map="$(find dist -type f -name '*.map' -print -quit)"`;
  const verificationCommand =
    'node repo-staging/scripts/verify-pages-loader-artifacts.mjs ' +
    'dist repo-main repo-staging';
  const uploadStep = 'uses: actions/upload-pages-artifact@v3';

  function assertWorkflowOrdering(workflow) {
    const assemblyIndex = workflow.indexOf(assemblyMarker);
    const cleanupIndex = workflow.indexOf(cleanupCommand);
    const zeroMapAssertionIndex = workflow.indexOf(zeroMapAssertion);
    const verificationIndex = workflow.indexOf(verificationCommand);
    const uploadIndex = workflow.indexOf(uploadStep);

    assert.ok(assemblyIndex >= 0, 'workflow must assemble the Pages graph');
    assert.ok(
      cleanupIndex > assemblyIndex,
      'workflow must remove source maps after Pages assembly'
    );
    assert.ok(
      zeroMapAssertionIndex > cleanupIndex,
      'workflow must assert zero source maps after source-map cleanup'
    );
    assert.ok(
      verificationIndex > zeroMapAssertionIndex,
      'workflow must verify provenance after the zero-map assertion'
    );
    assert.ok(
      uploadIndex > verificationIndex,
      'workflow must verify before uploading the Pages artifact'
    );

    const postVerificationWorkflow = workflow.slice(
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

  assertWorkflowOrdering(PAGES_WORKFLOW);
  assert.match(
    PAGES_WORKFLOW,
    /if \[\[ "\$main_root_count" -ne 3 \]\]/,
    'workflow must require exactly three permanent main root routers'
  );
  assert.doesNotMatch(
    PAGES_WORKFLOW,
    /loaders\/(?:home|drops|exchange)\.loader\.js/,
    'workflow must not copy retired legacy root loaders'
  );
  assert.doesNotMatch(
    PAGES_WORKFLOW,
    /dist\/candidate-(?:home|drops|exchange)\.js/,
    'workflow must not generate retired candidate routers'
  );

  assert.throws(
    () => assertWorkflowOrdering(PAGES_WORKFLOW.replace(
      cleanupCommand,
      'true'
    ).replace(
      verificationCommand,
      `${verificationCommand}\n${cleanupCommand}`
    )),
    /remove source maps after Pages assembly|zero source maps after source-map cleanup/,
    'workflow ordering must reject source-map cleanup after provenance verification'
  );

  assert.throws(
    () => assertWorkflowOrdering(PAGES_WORKFLOW.replace(
      cleanupCommand,
      'true'
    ).replace(
      uploadStep,
      `${uploadStep}\n${cleanupCommand}`
    )),
    /zero source maps after source-map cleanup|verify before uploading/,
    'workflow ordering must reject source-map cleanup after upload'
  );

  assert.throws(
    () => assertWorkflowOrdering(PAGES_WORKFLOW.replace(
      zeroMapAssertion,
      'remaining_map=""'
    )),
    /assert zero source maps/,
    'workflow ordering must reject a missing zero-map assertion'
  );

  assert.throws(
    () => assertWorkflowOrdering(PAGES_WORKFLOW.replace(
      zeroMapAssertion,
      'true'
    ).replace(
      cleanupCommand,
      `${zeroMapAssertion}\n${cleanupCommand}`
    )),
    /assert zero source maps after source-map cleanup/,
    'workflow ordering must reject a zero-map assertion before cleanup'
  );
}

console.log('Pages loader artifact graph tests passed.');
