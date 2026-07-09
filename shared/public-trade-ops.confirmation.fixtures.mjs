import assert from 'node:assert/strict';

import {
  __getOperationConfirmationForFixture
} from './public-trade-ops.js';

const ESCROW_ADDRESS = 'KT1Escrow111111111111111111111111111111';
const OTHER_ADDRESS = 'KT1Operator111111111111111111111111111';

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

function run(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

run('applied approval plus failed matching initiate_trade confirms as failure', () => {
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

run('matching applied initiate_trade confirms as success', () => {
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

run('unrelated applied operation with matcher does not confirm success', () => {
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

run('no matcher preserves legacy any applied operation behavior', () => {
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
