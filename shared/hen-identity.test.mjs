import assert from 'node:assert/strict';
import test from 'node:test';

import { toCanonicalTokenId, toNetworkTokenId } from '../admin-ui/src/utils/hen-ids.js';
import { chainRegistry } from './chain-registry.js';

test('HEN canonical IDs round-trip through every Shadownet lookup adapter', () => {
  const mirror = chainRegistry.testnet?.mirrors?.HEN;
  assert.ok(mirror && Object.keys(mirror).length > 0);
  assert.equal(new Set(Object.values(mirror)).size, Object.keys(mirror).length);

  for (const [canonicalId, lookupId] of Object.entries(mirror)) {
    assert.equal(toNetworkTokenId('HEN', canonicalId, 'testnet'), lookupId);
    assert.equal(toCanonicalTokenId('HEN', lookupId, 'testnet'), canonicalId);
    assert.equal(toNetworkTokenId('HEN', canonicalId, 'mainnet'), canonicalId);
    assert.equal(toCanonicalTokenId('HEN', canonicalId, 'mainnet'), canonicalId);
  }
});

test('HEN translation does not alter other collection identities', () => {
  assert.equal(toNetworkTokenId('CANAAN', '1', 'testnet'), '1');
  assert.equal(toCanonicalTokenId('CANAAN', '1', 'testnet'), '1');
});
