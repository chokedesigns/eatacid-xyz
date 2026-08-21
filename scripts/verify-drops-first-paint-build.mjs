import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

const BUILD_VARIANTS = ['staging', 'prod'];
const EXPECTED_EARLY_SOURCES = [
  'webflow/drops-first-paint.js',
  'shared/public-first-paint.js',
  'shared/network.js',
  'shared/chain-registry.js',
  'node_modules/@parcel/transformer-js/src/esmodule-helpers.js'
];
const REQUIRED_EARLY_MARKERS = [
  '__EA_DROPS_EARLY_FIRST_PAINT__',
  '__EA_PUBLIC_FIRST_PAINT__',
  'drops-params-pending',
  'drops-preview-pending',
  'drops-wallet-tokens-pending'
];
const FORBIDDEN_EARLY_MARKERS = [
  '@airgap/beacon',
  '@walletconnect/',
  'shared/beacon-setup.js',
  'shared/public-trade-ops.js',
  'drops/js/events.js',
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
  const firstPaintPath = `dist/${variant}/drops-first-paint.js`;
  const dropsPath = `dist/${variant}/drops.js`;
  const firstPaintSourceMapPath = `${firstPaintPath}.map`;
  const dropsSourceMapPath = `${dropsPath}.map`;

  await Promise.all([
    stat(firstPaintPath),
    stat(dropsPath),
    stat(firstPaintSourceMapPath),
    stat(dropsSourceMapPath)
  ]);

  const [firstPaintCode, firstPaintSourceMap, dropsSourceMap] = await Promise.all([
    readFile(firstPaintPath, 'utf8'),
    readFile(firstPaintSourceMapPath, 'utf8').then(JSON.parse),
    readFile(dropsSourceMapPath, 'utf8').then(JSON.parse)
  ]);

  assert.deepEqual(
    firstPaintSourceMap.sources,
    EXPECTED_EARLY_SOURCES,
    `${variant} Drops first-paint dependency graph changed`
  );
  assert.equal(
    /(?:^|\n)\s*import\s*(?:\(|["'{*])/m.test(firstPaintCode),
    false,
    `${variant} Drops first-paint entry unexpectedly requires another emitted chunk`
  );

  const earlyGraphText = `${firstPaintSourceMap.sources.join('\n')}\n${firstPaintCode}`;
  for (const marker of REQUIRED_EARLY_MARKERS) {
    assert.equal(
      earlyGraphText.includes(marker),
      true,
      `${variant} Drops first-paint graph lacks required marker: ${marker}`
    );
  }
  for (const marker of FORBIDDEN_EARLY_MARKERS) {
    assert.equal(
      earlyGraphText.includes(marker),
      false,
      `${variant} Drops first-paint graph contains forbidden marker: ${marker}`
    );
  }

  assert.equal(
    dropsSourceMap.sources.includes('shared/beacon-setup.js'),
    true,
    `${variant} Drops graph no longer contains the expected Beacon setup fallback`
  );
  assert.equal(
    dropsSourceMap.sources.some(source => source.includes('@airgap/beacon-sdk')),
    true,
    `${variant} Drops graph should provide a positive Beacon-control comparison`
  );

  const [firstPaintSizes, dropsSizes] = await Promise.all([
    fileSizes(firstPaintPath),
    fileSizes(dropsPath)
  ]);
  assert.ok(
    firstPaintSizes.rawBytes < dropsSizes.rawBytes / 10,
    `${variant} Drops first-paint output is not substantially smaller than Drops`
  );

  console.log(JSON.stringify({
    variant,
    dropsFirstPaint: firstPaintSizes,
    drops: dropsSizes,
    earlySources: firstPaintSourceMap.sources,
    sharedChunks: [],
    beaconInEarlyGraph: false
  }, null, 2));
}

console.log('Drops first-paint build graph verification passed.');
