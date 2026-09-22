import assert from 'node:assert/strict';
import test from 'node:test';

import {
  chainRegistry,
  resolveDropsEscrow,
  resolveExchangeEscrow,
  resolveSurfaceEscrow,
  validateAdminNetworkConfig,
  validatePublicDropsConfig
} from './chain-registry.js';

const ADDRESS = 'KT1ValidAddressForFocusedRegistryTest';

function configuredMainnet() {
  const config = structuredClone(chainRegistry.mainnet);
  config.escrow = ADDRESS;
  config.collections['ACID COIN'] = ADDRESS;
  return config;
}

test('Mainnet public Drops requires its dedicated surface escrow', () => {
  const config = configuredMainnet();
  const resolved = resolveDropsEscrow(config);

  assert.equal(resolved.configuredAddress, '');
  assert.equal(resolved.fallbackAddress, ADDRESS);
  assert.equal(resolved.effectiveAddress, '');
  assert.equal(resolved.dropsEscrow, '');
  assert.equal(resolved.source, 'none');
  assert.equal(resolved.strict, true);
  assert.equal(resolveSurfaceEscrow(config, 'drops').effectiveAddress, '');
  assert.deepEqual(
    validatePublicDropsConfig(config),
    { ok: false, missing: ['escrows.drops.address'] }
  );
});

test('Mainnet public Drops resolves only its dedicated surface escrow', () => {
  const config = configuredMainnet();
  config.escrows.drops.address = `${ADDRESS}Drops`;

  const resolved = resolveDropsEscrow(config);
  assert.equal(resolved.effectiveAddress, `${ADDRESS}Drops`);
  assert.equal(resolved.source, 'surface');
  assert.equal(validatePublicDropsConfig(config).ok, true);
});

test('testnet Drops retains the legacy escrow fallback', () => {
  const config = structuredClone(chainRegistry.testnet);
  config.escrows.drops.address = '';

  const resolved = resolveDropsEscrow(config);
  assert.equal(resolved.effectiveAddress, config.escrow);
  assert.equal(resolved.source, 'legacy-fallback');
  assert.equal(resolved.strict, false);
  assert.equal(validatePublicDropsConfig(config).ok, true);
});

test('Admin root and strict Exchange resolution remain unchanged', () => {
  const config = configuredMainnet();

  assert.equal(validateAdminNetworkConfig(config).ok, true);

  const exchange = resolveExchangeEscrow(config, { strict: true });
  assert.equal(exchange.effectiveAddress, '');
  assert.equal(exchange.source, 'none');
  assert.equal(exchange.strict, true);
});
