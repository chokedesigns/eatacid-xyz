import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

const BUILD_VARIANTS = ['staging', 'prod'];
const EXPECTED_EARLY_SOURCES = [
  'webflow/first-paint.js',
  'shared/public-first-paint.js',
  'shared/network.js',
  'shared/chain-registry.js',
  'node_modules/@parcel/transformer-js/src/esmodule-helpers.js'
];
const FORBIDDEN_EARLY_MARKERS = [
  '@airgap/beacon',
  '@walletconnect/',
  'shared/beacon-setup.js',
  'DAppClient',
  'WalletClient'
];

async function fileSizes(path) {
  const contents = await readFile(path);
  return {
    rawBytes: contents.byteLength,
    gzipBytes: gzipSync(contents).byteLength
  };
}

for (const variant of BUILD_VARIANTS) {
  const firstPaintPath = `dist/${variant}/first-paint.js`;
  const homePath = `dist/${variant}/home.js`;
  const firstPaintSourceMapPath = `${firstPaintPath}.map`;
  const homeSourceMapPath = `${homePath}.map`;

  await Promise.all([
    stat(firstPaintPath),
    stat(homePath),
    stat(firstPaintSourceMapPath),
    stat(homeSourceMapPath)
  ]);

  const [firstPaintCode, firstPaintSourceMap, homeSourceMap] = await Promise.all([
    readFile(firstPaintPath, 'utf8'),
    readFile(firstPaintSourceMapPath, 'utf8').then(JSON.parse),
    readFile(homeSourceMapPath, 'utf8').then(JSON.parse)
  ]);

  assert.deepEqual(
    firstPaintSourceMap.sources,
    EXPECTED_EARLY_SOURCES,
    `${variant} first-paint dependency graph changed`
  );
  assert.equal(
    /(?:^|\n)\s*import\s*(?:\(|["'{*])/m.test(firstPaintCode),
    false,
    `${variant} first-paint entry unexpectedly requires another emitted chunk`
  );

  const earlyGraphText = `${firstPaintSourceMap.sources.join('\n')}\n${firstPaintCode}`;
  for (const marker of FORBIDDEN_EARLY_MARKERS) {
    assert.equal(
      earlyGraphText.includes(marker),
      false,
      `${variant} first-paint graph contains forbidden marker: ${marker}`
    );
  }

  assert.equal(
    homeSourceMap.sources.includes('shared/beacon-setup.js'),
    true,
    `${variant} Home graph no longer contains the expected Beacon setup fallback`
  );
  assert.equal(
    homeSourceMap.sources.some(source => source.includes('@airgap/beacon-sdk')),
    true,
    `${variant} Home graph should provide a positive Beacon-control comparison`
  );

  const [firstPaintSizes, homeSizes] = await Promise.all([
    fileSizes(firstPaintPath),
    fileSizes(homePath)
  ]);
  assert.ok(
    firstPaintSizes.rawBytes < homeSizes.rawBytes / 10,
    `${variant} first-paint output is not substantially smaller than Home`
  );

  console.log(JSON.stringify({
    variant,
    firstPaint: firstPaintSizes,
    home: homeSizes,
    earlySources: firstPaintSourceMap.sources,
    sharedChunks: [],
    beaconInEarlyGraph: false
  }, null, 2));
}

console.log('Home first-paint build graph verification passed.');
