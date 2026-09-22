import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveBurnTokenRenderIdentities } from './token-rendering.js';

test('testnet mirrored identities retain canonical CMS rows and wallet token IDs', () => {
  assert.deepEqual(
    resolveBurnTokenRenderIdentities({
      canonicalTokenIds: ['94684', '103062', '104492'],
      eligibleTokenIds: ['0', '2'],
      tokenMapping: {
        '94684': '0',
        '103062': '1',
        '104492': '2'
      }
    }),
    [
      { canonicalTokenId: '94684', walletTokenId: '0' },
      { canonicalTokenId: '104492', walletTokenId: '2' }
    ]
  );
});

test('Mainnet empty mirrors render eligible canonical identities directly', () => {
  assert.deepEqual(
    resolveBurnTokenRenderIdentities({
      canonicalTokenIds: ['94684', '103062', '104492'],
      eligibleTokenIds: ['94684', '104492'],
      excludedTokenIds: ['103062'],
      tokenMapping: {}
    }),
    [
      { canonicalTokenId: '94684', walletTokenId: '94684' },
      { canonicalTokenId: '104492', walletTokenId: '104492' }
    ]
  );
});

test('render identities do not duplicate rows or reuse a wallet identity', () => {
  assert.deepEqual(
    resolveBurnTokenRenderIdentities({
      canonicalTokenIds: ['7', '7', '8'],
      eligibleTokenIds: ['7', '7', '8'],
      tokenMapping: {}
    }),
    [
      { canonicalTokenId: '7', walletTokenId: '7' },
      { canonicalTokenId: '8', walletTokenId: '8' }
    ]
  );

  assert.deepEqual(
    resolveBurnTokenRenderIdentities({
      eligibleTokenIds: ['0'],
      tokenMapping: { '94684': '0', '103062': '0' }
    }),
    [{ canonicalTokenId: '94684', walletTokenId: '0' }]
  );
});
