import assert from 'node:assert/strict';

import { normalizeParcelSources } from './parcel-source-map-sources.mjs';

const EXPECTED_HOME_SOURCES = [
  'webflow/first-paint.js',
  'shared/public-first-paint.js',
  'shared/network.js',
  'shared/chain-registry.js',
  'node_modules/@parcel/transformer-js/src/esmodule-helpers.js'
];
const EXPECTED_DROPS_SOURCES = [
  'webflow/drops-first-paint.js',
  'shared/public-first-paint.js',
  'shared/network.js',
  'shared/chain-registry.js',
  'node_modules/@parcel/transformer-js/src/esmodule-helpers.js'
];

function assertExactSources(actual, expected) {
  assert.deepEqual(normalizeParcelSources(actual), expected);
}

for (const expected of [EXPECTED_HOME_SOURCES, EXPECTED_DROPS_SOURCES]) {
  assert.doesNotThrow(() => assertExactSources(['<anon>', ...expected], expected));
  assert.doesNotThrow(() => assertExactSources(expected, expected));

  assert.throws(() => assertExactSources([
    ...expected,
    'some/real/module.js'
  ], expected));
  assert.throws(() => assertExactSources(expected.slice(0, -1), expected));
  assert.throws(() => assertExactSources([
    '<something-else>',
    ...expected
  ], expected));
}

assert.throws(() => assertExactSources([
  ...EXPECTED_HOME_SOURCES,
  'shared/beacon-setup.js'
], EXPECTED_HOME_SOURCES));
assert.throws(() => assertExactSources([
  ...EXPECTED_DROPS_SOURCES,
  'node_modules/@airgap/beacon-sdk/dist/esm/index.js'
], EXPECTED_DROPS_SOURCES));

console.log('Parcel source-map source normalization tests passed.');
