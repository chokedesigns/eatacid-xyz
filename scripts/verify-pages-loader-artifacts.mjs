import { readFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const SURFACES = ['home', 'drops', 'exchange'];
const ENVIRONMENTS = ['prod', 'staging'];
const PROD_HOST_DECLARATION =
  'new Set(["eatacid.xyz", "www.eatacid.xyz"])';
const FIRST_PAINT_MARKER = '__EA_PUBLIC_FIRST_PAINT__';
const FIRST_PAINT_SURFACES = new Set(['home', 'exchange']);

function fail(message) {
  throw new Error(`[pages-loaders] ${message}`);
}

async function pathIsFile(path) {
  try {
    return (await stat(path)).isFile();
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

async function readRequiredFile(path, description) {
  let fileStat;

  try {
    fileStat = await stat(path);
  } catch (error) {
    if (error?.code === 'ENOENT') {
      fail(`missing ${description}: ${path}`);
    }
    throw error;
  }

  if (!fileStat.isFile()) {
    fail(`${description} is not a file: ${path}`);
  }

  const contents = await readFile(path);
  if (contents.byteLength === 0) {
    fail(`${description} is empty: ${path}`);
  }

  return contents;
}

async function requireEqualFiles(
  deployedPath,
  sourcePath,
  deployedDescription,
  sourceDescription
) {
  const [deployed, source] = await Promise.all([
    readRequiredFile(deployedPath, deployedDescription),
    readRequiredFile(sourcePath, sourceDescription)
  ]);

  if (!deployed.equals(source)) {
    fail(`${deployedDescription} differs from ${sourceDescription}: ` +
      `${deployedPath} != ${sourcePath}`);
  }

  return deployed;
}

function requireReference(text, reference, description) {
  if (!text.includes(reference)) {
    fail(`${description} is missing required reference: ${reference}`);
  }
}

function verifyRootRouterText(contents, surface, description) {
  const text = contents.toString('utf8');

  requireReference(text, PROD_HOST_DECLARATION, description);
  requireReference(text, 'window.location.hostname', description);
  requireReference(text, '"./prod"', description);
  requireReference(text, '"./staging"', description);
  requireReference(text, `\`${'${base}'}/${surface}-loader.js\``, description);

  if (text.includes('first-paint.js')) {
    fail(`${description} must not own early first-paint sequencing`);
  }
  if (text.includes(`\`${'${base}'}/${surface}.js\``)) {
    fail(`${description} must import the environment loader, not the application bundle`);
  }
}

function verifyLegacyRootText(contents, surface, description) {
  const text = contents.toString('utf8');

  requireReference(text, PROD_HOST_DECLARATION, description);
  requireReference(text, 'window.location.hostname', description);
  requireReference(text, '"./prod"', description);
  requireReference(text, '"./staging"', description);
  requireReference(text, `\`${'${base}'}/${surface}.js\``, description);
}

function verifyEnvironmentLoaderText(contents, surface, description) {
  const text = contents.toString('utf8');

  if (FIRST_PAINT_SURFACES.has(surface)) {
    requireReference(text, '"./first-paint.js"', description);
  }
  requireReference(text, `"./${surface}.js"`, description);

  requireReference(text, 'bundle load failed:', description);
}

async function verifyApplicationArtifacts(
  artifactRoot,
  mainRoot,
  stagingRoot,
  environments
) {
  const artifacts = [];

  for (const environment of environments) {
    for (const surface of SURFACES) {
      const applicationPath = join(artifactRoot, environment, `${surface}.js`);
      const ownerRoot = environment === 'prod' ? mainRoot : stagingRoot;
      const sourcePath = join(
        ownerRoot,
        'dist',
        environment,
        `${surface}.js`
      );
      const application = await requireEqualFiles(
        applicationPath,
        sourcePath,
        `${environment} ${surface} application artifact`,
        `${environment === 'prod' ? 'main' : 'staging'} build output`
      );
      artifacts.push({
        environment,
        surface,
        path: applicationPath,
        bytes: application.byteLength
      });
    }

    const ownerRoot = environment === 'prod' ? mainRoot : stagingRoot;
    const firstPaintPath = join(artifactRoot, environment, 'first-paint.js');
    const firstPaintSourcePath = join(
      ownerRoot,
      'dist',
      environment,
      'first-paint.js'
    );
    const firstPaint = await requireEqualFiles(
      firstPaintPath,
      firstPaintSourcePath,
      `${environment} first-paint artifact referenced by Home/Exchange environment loaders`,
      `${environment === 'prod' ? 'main' : 'staging'} first-paint build output`
    );
    if (!firstPaint.includes(FIRST_PAINT_MARKER)) {
      fail(`${environment} first-paint artifact lacks coordinator marker ` +
        `${FIRST_PAINT_MARKER}: ${firstPaintPath}`);
    }
    artifacts.push({
      environment,
      surface: 'first-paint',
      path: firstPaintPath,
      bytes: firstPaint.byteLength
    });
  }

  return artifacts;
}

async function verifyLegacyApplicationArtifacts(
  artifactRoot,
  mainRoot,
  stagingRoot
) {
  const artifacts = [];
  for (const environment of ENVIRONMENTS) {
    for (const surface of SURFACES) {
      const applicationPath = join(artifactRoot, environment, `${surface}.js`);
      const ownerRoot = environment === 'prod' ? mainRoot : stagingRoot;
      const sourcePath = join(
        ownerRoot,
        'dist',
        environment,
        `${surface}.js`
      );
      const application = await requireEqualFiles(
        applicationPath,
        sourcePath,
        `${environment} ${surface} application artifact referenced by legacy root loader`,
        `${environment === 'prod' ? 'main' : 'staging'} build output`
      );
      artifacts.push({
        environment,
        surface,
        path: applicationPath,
        bytes: application.byteLength
      });
    }
  }
  return artifacts;
}

async function detectMode(mainRoot) {
  const rootPaths = SURFACES.map(surface =>
    join(mainRoot, 'loaders', 'root', `${surface}.js`)
  );
  const present = await Promise.all(rootPaths.map(pathIsFile));

  if (present.every(Boolean)) {
    return 'stable-cutover';
  }
  if (present.some(Boolean)) {
    fail('main contains only part of the root-router source set');
  }
  return 'candidate';
}

async function verifyStableCutover(artifactRoot, mainRoot, stagingRoot) {
  const roots = [];
  const environmentLoaders = [];

  for (const surface of SURFACES) {
    const deployedPath = join(artifactRoot, `${surface}.js`);
    const sourcePath = join(mainRoot, 'loaders', 'root', `${surface}.js`);
    const contents = await requireEqualFiles(
      deployedPath,
      sourcePath,
      `root ${surface} router`,
      `authoritative main ${surface} root-router source`
    );
    verifyRootRouterText(contents, surface, `root ${surface} router`);
    roots.push({ surface, path: deployedPath, bytes: contents.byteLength });

    const candidatePath = join(artifactRoot, `candidate-${surface}.js`);
    if (await pathIsFile(candidatePath)) {
      fail(`temporary candidate router remains after stable cutover: ${candidatePath}`);
    }

    for (const environment of ENVIRONMENTS) {
      const ownerRoot = environment === 'prod' ? mainRoot : stagingRoot;
      const deployedLoaderPath = join(
        artifactRoot,
        environment,
        `${surface}-loader.js`
      );
      const sourceLoaderPath = join(
        ownerRoot,
        'loaders',
        'environment',
        `${surface}.js`
      );
      const loader = await requireEqualFiles(
        deployedLoaderPath,
        sourceLoaderPath,
        `${environment} ${surface} environment loader`,
        `authoritative ${environment === 'prod' ? 'main' : 'staging'} ` +
          `${surface} environment-loader source`
      );
      verifyEnvironmentLoaderText(
        loader,
        surface,
        `${environment} ${surface} environment loader`
      );
      environmentLoaders.push({
        environment,
        surface,
        path: deployedLoaderPath,
        bytes: loader.byteLength
      });
    }
  }

  const artifacts = await verifyApplicationArtifacts(
    artifactRoot,
    mainRoot,
    stagingRoot,
    ENVIRONMENTS
  );

  return { roots, environmentLoaders, artifacts };
}

async function verifyCandidateMigration(artifactRoot, mainRoot, stagingRoot) {
  const roots = [];
  const environmentLoaders = [];

  for (const surface of SURFACES) {
    const unexpectedProdLoader = join(
      artifactRoot,
      'prod',
      `${surface}-loader.js`
    );
    if (await pathIsFile(unexpectedProdLoader)) {
      fail(`pre-cutover artifact must not synthesize a prod environment loader: ` +
        unexpectedProdLoader);
    }

    const stablePath = join(artifactRoot, `${surface}.js`);
    const legacySourcePath = join(
      mainRoot,
      'loaders',
      `${surface}.loader.js`
    );
    const stable = await requireEqualFiles(
      stablePath,
      legacySourcePath,
      `pre-cutover stable ${surface} loader`,
      `authoritative legacy main ${surface} loader source`
    );
    verifyLegacyRootText(stable, surface, `pre-cutover stable ${surface} loader`);
    roots.push({
      kind: 'stable-legacy',
      surface,
      path: stablePath,
      bytes: stable.byteLength
    });

    const candidatePath = join(artifactRoot, `candidate-${surface}.js`);
    const candidateSourcePath = join(
      stagingRoot,
      'loaders',
      'root',
      `${surface}.js`
    );
    const candidate = await requireEqualFiles(
      candidatePath,
      candidateSourcePath,
      `temporary staging ${surface} candidate router`,
      `authoritative staging ${surface} root-router source`
    );
    verifyRootRouterText(
      candidate,
      surface,
      `temporary staging ${surface} candidate router`
    );
    roots.push({
      kind: 'staging-candidate',
      surface,
      path: candidatePath,
      bytes: candidate.byteLength
    });

    const deployedLoaderPath = join(
      artifactRoot,
      'staging',
      `${surface}-loader.js`
    );
    const sourceLoaderPath = join(
      stagingRoot,
      'loaders',
      'environment',
      `${surface}.js`
    );
    const loader = await requireEqualFiles(
      deployedLoaderPath,
      sourceLoaderPath,
      `staging ${surface} environment loader`,
      `authoritative staging ${surface} environment-loader source`
    );
    verifyEnvironmentLoaderText(
      loader,
      surface,
      `staging ${surface} environment loader`
    );
    environmentLoaders.push({
      environment: 'staging',
      surface,
      path: deployedLoaderPath,
      bytes: loader.byteLength
    });
  }

  const artifacts = await verifyLegacyApplicationArtifacts(
    artifactRoot,
    mainRoot,
    stagingRoot
  );
  const firstPaintPath = join(artifactRoot, 'staging', 'first-paint.js');
  const firstPaintSourcePath = join(
    stagingRoot,
    'dist',
    'staging',
    'first-paint.js'
  );
  const firstPaint = await requireEqualFiles(
    firstPaintPath,
    firstPaintSourcePath,
    'staging first-paint artifact referenced by Home/Exchange environment loaders',
    'staging first-paint build output'
  );
  if (!firstPaint.includes(FIRST_PAINT_MARKER)) {
    fail(`staging first-paint artifact lacks coordinator marker ` +
      `${FIRST_PAINT_MARKER}: ${firstPaintPath}`);
  }
  artifacts.push({
    environment: 'staging',
    surface: 'first-paint',
    path: firstPaintPath,
    bytes: firstPaint.byteLength
  });

  return { roots, environmentLoaders, artifacts };
}

async function verifyPagesLoaderArtifacts(
  artifactDirectory,
  mainRepositoryDirectory,
  stagingRepositoryDirectory,
  { log = console.log } = {}
) {
  const artifactRoot = resolve(artifactDirectory);
  const mainRoot = resolve(mainRepositoryDirectory);
  const stagingRoot = resolve(stagingRepositoryDirectory);
  const mode = await detectMode(mainRoot);
  const graph = mode === 'stable-cutover'
    ? await verifyStableCutover(artifactRoot, mainRoot, stagingRoot)
    : await verifyCandidateMigration(artifactRoot, mainRoot, stagingRoot);

  const result = { artifactRoot, mainRoot, stagingRoot, mode, ...graph };
  log(`[pages-loaders] verified ${mode} graph: ${artifactRoot}`);
  log(`[pages-loaders] roots=${result.roots.length}, ` +
    `environment-loaders=${result.environmentLoaders.length}, ` +
    `referenced-artifacts=${result.artifacts.length}`);
  return result;
}

const isCli = process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isCli) {
  const [artifactDirectory, mainRepositoryDirectory, stagingRepositoryDirectory] =
    process.argv.slice(2);

  if (!artifactDirectory || !mainRepositoryDirectory || !stagingRepositoryDirectory) {
    console.error(
      'Usage: node scripts/verify-pages-loader-artifacts.mjs ' +
      '<assembled-pages-directory> <main-repository> <staging-repository>'
    );
    process.exitCode = 2;
  } else {
    try {
      await verifyPagesLoaderArtifacts(
        artifactDirectory,
        mainRepositoryDirectory,
        stagingRepositoryDirectory
      );
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    }
  }
}

export { verifyPagesLoaderArtifacts };
