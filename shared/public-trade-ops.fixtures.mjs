import assert from 'node:assert/strict';

import {
  buildApprovalOps,
  pollForConfirmation,
  pollForNFTUpdate,
  __areTradedTokensRefreshedForFixture,
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

await run('confirmation polling retries fetch rejection before matching success', async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;

  try {
    globalThis.fetch = async () => {
      calls += 1;

      if (calls === 1) {
        throw new Error('network down');
      }

      return jsonResponse([
        operation({
          destination: ESCROW_ADDRESS,
          entrypoint: 'initiate_trade',
          status: 'applied'
        })
      ]);
    };

    const ops = await pollForConfirmation({
      tzktBase: TZKT_BASE,
      opHash: 'ooConfirmationFetchRetrySuccess',
      timeout: 50,
      interval: 0,
      ...initiateTradeMatcher
    });

    assert.equal(calls, 2);
    assert.equal(ops[0].status, 'applied');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

await run('confirmation polling retries repeated fetch rejections until timeout', async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;

  try {
    globalThis.fetch = async () => {
      calls += 1;
      throw new Error(`network down ${calls}`);
    };

    await assert.rejects(
      pollForConfirmation({
        tzktBase: TZKT_BASE,
        opHash: 'ooConfirmationFetchRetryTimeout',
        timeout: 20,
        interval: 1,
        ...initiateTradeMatcher
      }),
      (error) => {
        assert.match(error.message, /^Transaction confirmation timed out\. Last TzKT polling error: network down \d+$/);
        return true;
      }
    );

    assert.ok(calls > 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

await run('partial burn refresh completes when balance decreases by expected quantity', () => {
  assert.equal(
    __areTradedTokensRefreshedForFixture(
      [{ contractAddress: BURN_CONTRACT, tokenId: '7', balance: '2' }],
      [{ contractAddress: BURN_CONTRACT, tokenId: '7', startingBalance: 3, quantity: 1 }]
    ),
    true
  );
});

await run('partial burn refresh waits when balance has not decreased', () => {
  assert.equal(
    __areTradedTokensRefreshedForFixture(
      [{ contractAddress: BURN_CONTRACT, tokenId: '7', balance: '3' }],
      [{ contractAddress: BURN_CONTRACT, tokenId: '7', startingBalance: 3, quantity: 1 }]
    ),
    false
  );
});

await run('absent traded token refreshes as complete', () => {
  assert.equal(
    __areTradedTokensRefreshedForFixture(
      [],
      [{ contractAddress: BURN_CONTRACT, tokenId: '7', startingBalance: 3, quantity: 1 }]
    ),
    true
  );
});

await run('zero traded token balance refreshes as complete', () => {
  assert.equal(
    __areTradedTokensRefreshedForFixture(
      [{ contractAddress: BURN_CONTRACT, tokenId: '7', balance: '0' }],
      [{ contractAddress: BURN_CONTRACT, tokenId: '7', startingBalance: 3, quantity: 1 }]
    ),
    true
  );
});

await run('legacy traded token identifier preserves depletion-only wait behavior', () => {
  assert.equal(
    __areTradedTokensRefreshedForFixture(
      [{ contractAddress: BURN_CONTRACT, tokenId: '7', balance: '2' }],
      [{ contractAddress: BURN_CONTRACT, tokenId: '7' }]
    ),
    false
  );
});

await run('legacy traded token identifier preserves depletion-only success behavior', () => {
  assert.equal(
    __areTradedTokensRefreshedForFixture(
      [{ contractAddress: BURN_CONTRACT, tokenId: '7', balance: '0' }],
      [{ contractAddress: BURN_CONTRACT, tokenId: '7' }]
    ),
    true
  );
});

const duplicateTrade = [
  { contractAddress: BURN_CONTRACT, tokenId: '7', startingBalance: 5, quantity: 2 },
  { contractAddress: BURN_CONTRACT, tokenId: 7, startingBalance: 5, quantity: 1 }
];
const duplicateHoldings = balance => [{ contractAddress: BURN_CONTRACT, tokenId: '7', balance: String(balance) }];

await run('duplicate identities require the summed reduction independent of selection order', () => {
  for (const tokens of [duplicateTrade, [...duplicateTrade].reverse()]) {
    for (const balance of [5, 4, 3, 2, 1, 0]) {
      assert.equal(__areTradedTokensRefreshedForFixture(duplicateHoldings(balance), tokens), balance <= 2);
    }
    assert.equal(__areTradedTokensRefreshedForFixture([], tokens), true);
  }
  const depleted = duplicateTrade.map(token => ({ ...token, startingBalance: 3 }));
  assert.equal(__areTradedTokensRefreshedForFixture(duplicateHoldings(1), depleted), false);
  assert.equal(__areTradedTokensRefreshedForFixture(duplicateHoldings(0), depleted), true);
});

await run('distinct exact contracts and token IDs retain independent burn requirements', () => {
  for (const identity of [
    { contractAddress: OTHER_ADDRESS, tokenId: '7' },
    { contractAddress: BURN_CONTRACT.toLowerCase(), tokenId: '7' },
    { contractAddress: BURN_CONTRACT, tokenId: '8' },
    { contractAddress: BURN_CONTRACT, tokenId: '9007199254740993' },
    { contractAddress: BURN_CONTRACT, tokenId: '07' }
  ]) {
    const tokens = [duplicateTrade[0], { ...duplicateTrade[1], ...identity }];
    const holdings = [...duplicateHoldings(3), { ...identity, balance: '4' }];
    assert.equal(__areTradedTokensRefreshedForFixture(holdings, tokens), true);
    holdings[1].balance = '5';
    assert.equal(__areTradedTokensRefreshedForFixture(holdings, tokens), false);
  }
});

await run('duplicated snapshots are not summed or relaxed and legacy rows remain depletion-only', () => {
  const snapshots = [duplicateTrade[0], { ...duplicateTrade[1], startingBalance: 6 }];
  for (const tokens of [snapshots, [...snapshots].reverse()]) {
    assert.equal(__areTradedTokensRefreshedForFixture(duplicateHoldings(3), tokens), false);
    assert.equal(__areTradedTokensRefreshedForFixture(duplicateHoldings(2), tokens), true);
  }
  const legacy = { contractAddress: BURN_CONTRACT, tokenId: '7' };
  for (const tokens of [[legacy, ...duplicateTrade], [...duplicateTrade, legacy]]) {
    assert.equal(__areTradedTokensRefreshedForFixture(duplicateHoldings(2), tokens), false);
    assert.equal(__areTradedTokensRefreshedForFixture(duplicateHoldings(0), tokens), true);
    assert.equal(__areTradedTokensRefreshedForFixture([], tokens), true);
  }
});

await run('balance polling waits through stale partial duplicate reductions', async () => {
  let reads = 0;
  const observed = await pollForNFTUpdate({
    fetchNFTs: async () => duplicateHoldings([5, 4, 3, 2][reads++]),
    address: OWNER_ADDRESS, tradedTokens: duplicateTrade,
    timeout: 1000, interval: 0, fetchBeforePolling: true, refetchOnTimeout: true
  });
  assert.equal(reads, 4);
  assert.equal(observed[0].balance, '2');
});

await run('timeout refetch remains a snapshot requiring final consumer validation', async () => {
  let reads = 0;
  const observed = await pollForNFTUpdate({
    fetchNFTs: async () => { reads++; return duplicateHoldings(3); },
    address: OWNER_ADDRESS, tradedTokens: duplicateTrade,
    timeout: 0, interval: 0, fetchBeforePolling: true, refetchOnTimeout: true
  });
  assert.equal(reads, 2);
  assert.equal(__areTradedTokensRefreshedForFixture(observed, duplicateTrade), false);
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
