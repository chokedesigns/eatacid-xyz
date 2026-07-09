import assert from 'node:assert/strict';

import {
  buildApprovalOps,
  __getOperationConfirmationForFixture
} from './public-trade-ops.js';

const ESCROW_ADDRESS = 'KT1Escrow111111111111111111111111111111';
const OTHER_ADDRESS = 'KT1Operator111111111111111111111111111';
const OWNER_ADDRESS = 'tz1Owner111111111111111111111111111111';
const BURN_CONTRACT = 'KT1Burn111111111111111111111111111111';
const TZKT_BASE = 'https://example.tzkt.test';

const initiateTradeMatcher = {
  expectedDestination: ESCROW_ADDRESS,
  expectedEntrypoint: 'initiate_trade'
};

function operation({
  destination,
  entrypoint,
  status,
  type = 'transaction'
}) {
  return {
    type,
    target: { address: destination },
    parameter: { entrypoint },
    status
  };
}

async function run(name, fn) {
  try {
    await fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

await run('applied approval plus failed matching initiate_trade confirms as failure', () => {
  const confirmation = __getOperationConfirmationForFixture([
    operation({
      destination: OTHER_ADDRESS,
      entrypoint: 'update_operators',
      status: 'applied'
    }),
    operation({
      destination: ESCROW_ADDRESS,
      entrypoint: 'initiate_trade',
      status: 'failed'
    })
  ], initiateTradeMatcher);

  assert.deepEqual(confirmation, {
    applied: false,
    failed: true,
    message: 'Transaction confirmation failed: expected initiate_trade operation ended with status failed.'
  });
});

await run('matching applied initiate_trade confirms as success', () => {
  const confirmation = __getOperationConfirmationForFixture([
    operation({
      destination: OTHER_ADDRESS,
      entrypoint: 'update_operators',
      status: 'applied'
    }),
    operation({
      destination: ESCROW_ADDRESS,
      entrypoint: 'initiate_trade',
      status: 'applied'
    })
  ], initiateTradeMatcher);

  assert.deepEqual(confirmation, {
    applied: true,
    failed: false
  });
});

await run('unrelated applied operation with matcher does not confirm success', () => {
  const confirmation = __getOperationConfirmationForFixture([
    operation({
      destination: OTHER_ADDRESS,
      entrypoint: 'update_operators',
      status: 'applied'
    })
  ], initiateTradeMatcher);

  assert.deepEqual(confirmation, {
    applied: false,
    failed: false
  });
});

await run('no matcher preserves legacy any applied operation behavior', () => {
  const confirmation = __getOperationConfirmationForFixture([
    operation({
      destination: OTHER_ADDRESS,
      entrypoint: 'update_operators',
      status: 'applied'
    }),
    operation({
      destination: ESCROW_ADDRESS,
      entrypoint: 'initiate_trade',
      status: 'failed'
    })
  ]);

  assert.deepEqual(confirmation, {
    applied: true,
    failed: false
  });
});

await run('exact active operator approval omits approval op', async () => {
  const calls = [];
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = async (url) => {
      calls.push(url);
      return jsonResponse([
        {
          key: {
            owner: OWNER_ADDRESS,
            operator: ESCROW_ADDRESS,
            token_id: '7'
          }
        }
      ]);
    };

    const approvalOps = await buildApprovalOps(approvalArgs());

    assert.equal(approvalOps.length, 0);
    assert.equal(calls.length, 1);
    assert.equal(
      calls[0],
      `${TZKT_BASE}/v1/contracts/${BURN_CONTRACT}/bigmaps/operators/keys?active=true&key.owner=${OWNER_ADDRESS}&key.operator=${ESCROW_ADDRESS}&key.token_id=7&limit=1`
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

await run('missing active operator approval adds approval op', async () => {
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = async () => jsonResponse([]);

    const approvalOps = await buildApprovalOps(approvalArgs());

    assert.equal(approvalOps.length, 1);
    assert.equal(approvalOps[0].destination, BURN_CONTRACT);
    assert.equal(approvalOps[0].parameters.entrypoint, 'update_operators');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

await run('operator approval read failure preserves approval fallback', async () => {
  const originalFetch = globalThis.fetch;
  const originalError = console.error;

  try {
    globalThis.fetch = async () => {
      throw new Error('network down');
    };
    console.error = () => {};

    const approvalOps = await buildApprovalOps(approvalArgs());

    assert.equal(approvalOps.length, 1);
    assert.equal(approvalOps[0].destination, BURN_CONTRACT);
    assert.equal(approvalOps[0].parameters.entrypoint, 'update_operators');
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalError;
  }
});

function approvalArgs() {
  return {
    tzktBase: TZKT_BASE,
    escrowAddress: ESCROW_ADDRESS,
    userWalletAddress: OWNER_ADDRESS,
    burnCart: [
      {
        contractAddress: BURN_CONTRACT,
        tokenId: '7',
        quantity: 1
      }
    ]
  };
}

function jsonResponse(body, ok = true) {
  return {
    ok,
    status: ok ? 200 : 500,
    statusText: ok ? 'OK' : 'Server Error',
    json: async () => body,
    text: async () => JSON.stringify(body)
  };
}
