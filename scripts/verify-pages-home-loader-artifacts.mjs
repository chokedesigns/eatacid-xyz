import { readFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const REQUIRED_LOADER_REFERENCES = [
  '"./prod"',
  '"./staging"',
  '`${base}/first-paint.js`',
  '`${base}/home.js`'
];
const ENVIRONMENTS = ['prod', 'staging'];
const FIRST_PAINT_MARKER = '__EA_PUBLIC_FIRST_PAINT__';

function fail(message) {
  throw new Error(`[pages-home-loader] ${message}`);
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

async function verifyPagesHomeLoaderArtifacts(
  artifactDirectory,
  authoritativeLoaderPath,
  { log = console.log } = {}
) {
  const artifactRoot = resolve(artifactDirectory);
  const loaderSource = resolve(authoritativeLoaderPath);
  const deployedLoaderPath = join(artifactRoot, 'home.js');
  const [deployedLoader, authoritativeLoader] = await Promise.all([
    readRequiredFile(deployedLoaderPath, 'root Home loader'),
    readRequiredFile(loaderSource, 'authoritative main Home loader source')
  ]);

  if (!deployedLoader.equals(authoritativeLoader)) {
    fail(
      `root Home loader differs from authoritative main source: ` +
      `${deployedLoaderPath} != ${loaderSource}`
    );
  }

  const loaderText = deployedLoader.toString('utf8');
  for (const reference of REQUIRED_LOADER_REFERENCES) {
    if (!loaderText.includes(reference)) {
      fail(`root Home loader is missing required reference: ${reference}`);
    }
  }

  const artifacts = [];
  for (const environment of ENVIRONMENTS) {
    const firstPaintPath = join(artifactRoot, environment, 'first-paint.js');
    const homePath = join(artifactRoot, environment, 'home.js');
    const [firstPaint, home] = await Promise.all([
      readRequiredFile(
        firstPaintPath,
        `${environment} first-paint artifact referenced by root Home loader`
      ),
      readRequiredFile(
        homePath,
        `${environment} Home application artifact referenced by root Home loader`
      )
    ]);

    if (!firstPaint.includes(FIRST_PAINT_MARKER)) {
      fail(
        `${environment} first-paint artifact lacks coordinator marker ` +
        `${FIRST_PAINT_MARKER}: ${firstPaintPath}`
      );
    }

    artifacts.push({
      environment,
      firstPaintPath,
      firstPaintBytes: firstPaint.byteLength,
      homePath,
      homeBytes: home.byteLength
    });
  }

  const result = {
    artifactRoot,
    deployedLoaderPath,
    authoritativeLoaderPath: loaderSource,
    loaderBytes: deployedLoader.byteLength,
    artifacts
  };

  log(`[pages-home-loader] compatible Pages artifact: ${artifactRoot}`);
  for (const artifact of artifacts) {
    log(
      `[pages-home-loader] ${artifact.environment}: ` +
      `first-paint=${artifact.firstPaintBytes} bytes, ` +
      `home=${artifact.homeBytes} bytes`
    );
  }

  return result;
}

const isCli = process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isCli) {
  const [artifactDirectory, authoritativeLoaderPath] = process.argv.slice(2);

  if (!artifactDirectory || !authoritativeLoaderPath) {
    console.error(
      'Usage: node scripts/verify-pages-home-loader-artifacts.mjs ' +
      '<assembled-pages-directory> <authoritative-main-home-loader>'
    );
    process.exitCode = 2;
  } else {
    try {
      await verifyPagesHomeLoaderArtifacts(
        artifactDirectory,
        authoritativeLoaderPath
      );
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    }
  }
}

export { verifyPagesHomeLoaderArtifacts };
