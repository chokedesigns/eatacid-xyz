const DEBUG = false;
const dlog = (...args) => { if (DEBUG) console.log(...args); };

/**
 * Looks up the on-chain token_pair_id for a given burn contract and token.
 *
 * @param {Object} args
 * @param {string} args.tzktBase
 * @param {string} args.escrowAddress
 * @param {string} args.burnContractAddress
 * @param {number|string} args.burnTokenId
 * @returns {Promise<number|null>}
 */
export async function fetchTokenPairId({
  tzktBase,
  escrowAddress,
  burnContractAddress,
  burnTokenId
}) {
  try {
    dlog(`\u{1F50D} Fetching token_pair_id for ${burnContractAddress}, token ${burnTokenId}`);

    const url =
      `${tzktBase}/v1/contracts/${escrowAddress}` +
      `/bigmaps/token_mapping/keys?active=true&limit=10000`;

    const response = await fetch(url);
    await assertTzktResponseOk(response, 'fetch token_pair_id mapping');
    const raw = await response.json();
    dlog("\u{1F4DC} Retrieved raw token_mapping data:", raw);

    const tokenMappings = (raw || []).filter(
      (entry) => entry && entry.active !== false && entry.value != null
    );

    dlog("\u{1F4DC} Filtered active token_mapping data:", tokenMappings);

    const burnContract = String(burnContractAddress).toLowerCase();
    const tokenId = String(burnTokenId);
    const matching = tokenMappings.find(
      (entry) =>
        String(entry.value.burn_contract_address).toLowerCase() === burnContract &&
        String(entry.value.burn_token_id) === tokenId
    );

    if (matching) {
      dlog(`\u2705 Found token_pair_id: ${matching.key}`);
      return Number(matching.key);
    }

    console.warn(`\u274C No token_pair_id for ${burnContractAddress} / ${burnTokenId}`);
    return null;
  } catch (error) {
    console.error("\u274C Error fetching token_pair_id:", error);
    return null;
  }
}

/**
 * Builds update_operators ops for burn-cart tokens missing escrow approval.
 *
 * @param {Object} args
 * @param {string} args.tzktBase
 * @param {string} args.escrowAddress
 * @param {string} args.userWalletAddress
 * @param {Array<{tokenId:string,quantity:number,contractAddress:string}>} args.burnCart
 * @param {Function} [args.onApprovalCheck]
 * @param {string} [args.operatorErrorPrefix]
 * @returns {Promise<Array>}
 */
export async function buildApprovalOps({
  tzktBase,
  escrowAddress,
  userWalletAddress,
  burnCart,
  onApprovalCheck,
  operatorErrorPrefix = ''
}) {
  const groups = burnCart.reduce((acc, item) => {
    (acc[item.contractAddress] ||= []).push(item);
    return acc;
  }, {});
  const approvalOps = [];

  for (const contractAddress of Object.keys(groups)) {
    for (const token of groups[contractAddress]) {
      try {
        const isApproved = await isTokenApprovedForEscrow({
          tzktBase,
          contractAddress,
          escrowAddress,
          userWalletAddress,
          tokenId: token.tokenId
        });

        if (onApprovalCheck) {
          onApprovalCheck({ token, contractAddress, isApproved });
        }

        if (!isApproved) {
          approvalOps.push(createApprovalOp({
            contractAddress,
            escrowAddress,
            userWalletAddress,
            tokenId: token.tokenId
          }));
        }
      } catch (error) {
        console.error(`${operatorErrorPrefix}Error checking operators for ${contractAddress}:`, error);
        approvalOps.push(createApprovalOp({
          contractAddress,
          escrowAddress,
          userWalletAddress,
          tokenId: token.tokenId
        }));
      }
    }
  }

  return approvalOps;
}

async function isTokenApprovedForEscrow({
  tzktBase,
  contractAddress,
  escrowAddress,
  userWalletAddress,
  tokenId
}) {
  const params = new URLSearchParams({
    active: 'true',
    'key.owner': userWalletAddress,
    'key.operator': escrowAddress,
    'key.token_id': tokenId.toString(),
    limit: '1'
  });
  const url = `${tzktBase}/v1/contracts/${contractAddress}/bigmaps/operators/keys?${params.toString()}`;
  const response = await fetch(url);
  await assertTzktResponseOk(response, `fetch operator for ${contractAddress} token ${tokenId}`);
  const operators = await response.json();

  if (!Array.isArray(operators)) {
    throw new Error(`Unexpected operators response for ${contractAddress} token ${tokenId}`);
  }

  return operators.some(op =>
    normalizeAddress(op?.key?.owner) === normalizeAddress(userWalletAddress) &&
    normalizeAddress(op?.key?.operator) === normalizeAddress(escrowAddress) &&
    String(op?.key?.token_id) === String(tokenId)
  );
}

/**
 * Polls TzKT for operation confirmation until the operation is applied or times out.
 *
 * @param {Object} args
 * @param {string} args.tzktBase
 * @param {string} args.opHash
 * @param {number} [args.timeout=120000]
 * @param {number} [args.interval=5000]
 * @param {string} [args.logPrefix]
 * @param {string} [args.expectedDestination]
 * @param {string} [args.expectedEntrypoint]
 * @returns {Promise<Object|Array>}
 */
export async function pollForConfirmation({
  tzktBase,
  opHash,
  timeout = 120000,
  interval = 5000,
  logPrefix,
  expectedDestination,
  expectedEntrypoint
}) {
  const startTime = Date.now();
  let lastTzktPollingError = null;

  while (Date.now() - startTime < timeout) {
    const response = await fetch(`${tzktBase}/v1/operations/${opHash}`);
    try {
      await assertTzktResponseOk(response, `poll operation confirmation for ${opHash}`);
    } catch (error) {
      lastTzktPollingError = error;
      logIfEnabled(logPrefix, "Polling confirmation request failed:", error);
      logIfEnabled(logPrefix, "Waiting for transaction confirmation...");
      await delay(interval);
      continue;
    }

    const ops = await response.json();
    logIfEnabled(logPrefix, "Polling confirmation from", tzktBase, "ops:", ops);

    const confirmation = getOperationConfirmation(ops, {
      expectedDestination,
      expectedEntrypoint
    });

    if (confirmation.failed) {
      throw new Error(confirmation.message);
    }

    if (confirmation.applied) {
      logIfEnabled(logPrefix, "Transaction confirmed on-chain.");
      return ops;
    }

    logIfEnabled(logPrefix, "Waiting for transaction confirmation...");
    await delay(interval);
  }

  if (lastTzktPollingError) {
    throw new Error(`Transaction confirmation timed out. Last TzKT polling error: ${lastTzktPollingError.message}`);
  }

  throw new Error("Transaction confirmation timed out.");
}

/**
 * Polls wallet NFTs until each traded token is absent, zeroed, or decreased by its expected burn quantity.
 *
 * @param {Object} args
 * @param {Function} args.fetchNFTs
 * @param {string} args.address
 * @param {Array<{contractAddress:string,tokenId:string|number,quantity?:number|string,startingBalance?:number|string}>} args.tradedTokens
 * @param {number} [args.timeout=30000]
 * @param {number} [args.interval=3000]
 * @param {string} [args.logPrefix]
 * @param {string} [args.timeoutMessage]
 * @param {boolean} [args.fetchBeforePolling=false]
 * @param {boolean} [args.refetchOnTimeout=false]
 * @returns {Promise<Array>}
 */
export async function pollForNFTUpdate({
  fetchNFTs,
  address,
  tradedTokens,
  timeout = 30000,
  interval = 3000,
  logPrefix,
  timeoutMessage,
  fetchBeforePolling = false,
  refetchOnTimeout = false
}) {
  const startTime = Date.now();
  let nfts = fetchBeforePolling ? await fetchNFTs(address) : [];

  while (Date.now() - startTime < timeout) {
    nfts = await fetchNFTs(address);

    if (areTradedTokensRefreshed(nfts, tradedTokens)) {
      logIfEnabled(logPrefix, "All traded tokens are refreshed.");
      return nfts;
    }

    logIfEnabled(logPrefix, "Waiting for NFT update...");
    await delay(interval);
  }

  if (timeoutMessage) {
    logIfEnabled(logPrefix, timeoutMessage);
  }

  return refetchOnTimeout ? await fetchNFTs(address) : nfts;
}

function createApprovalOp({
  contractAddress,
  escrowAddress,
  userWalletAddress,
  tokenId
}) {
  return {
    kind: 'transaction',
    destination: contractAddress,
    amount: '0',
    parameters: {
      entrypoint: 'update_operators',
      value: [
        {
          prim: 'Left',
          args: [
            {
              prim: 'Pair',
              args: [
                { string: userWalletAddress },
                {
                  prim: 'Pair',
                  args: [
                    { string: escrowAddress },
                    { int: tokenId.toString() }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  };
}

function isAppliedOperationResponse(ops) {
  if (Array.isArray(ops)) {
    return ops.some(isAppliedOperation);
  }

  return isAppliedOperation(ops);
}

export function __getOperationConfirmationForFixture(ops, expected = {}) {
  return getOperationConfirmation(ops, expected);
}

function getOperationConfirmation(ops, {
  expectedDestination,
  expectedEntrypoint
}) {
  if (!expectedDestination && !expectedEntrypoint) {
    return { applied: isAppliedOperationResponse(ops), failed: false };
  }

  const matchingOps = toOperationList(ops).filter(op =>
    matchesExpectedOperation(op, {
      expectedDestination,
      expectedEntrypoint
    })
  );

  const failedOp = matchingOps.find(isTerminalFailedOperation);
  if (failedOp) {
    const status = getOperationStatus(failedOp) || 'unknown';
    return {
      applied: false,
      failed: true,
      message: `Transaction confirmation failed: expected ${expectedEntrypoint || 'transaction'} operation ended with status ${status}.`
    };
  }

  return {
    applied: matchingOps.some(isAppliedOperation),
    failed: false
  };
}

function toOperationList(ops) {
  return Array.isArray(ops) ? ops : [ops].filter(Boolean);
}

function matchesExpectedOperation(op, {
  expectedDestination,
  expectedEntrypoint
}) {
  if (op?.type && op.type !== 'transaction') {
    return false;
  }

  if (expectedDestination) {
    const destination = getOperationDestination(op);
    if (normalizeAddress(destination) !== normalizeAddress(expectedDestination)) {
      return false;
    }
  }

  if (expectedEntrypoint) {
    const entrypoint = getOperationEntrypoint(op);
    if (entrypoint !== expectedEntrypoint) {
      return false;
    }
  }

  return true;
}

function getOperationDestination(op) {
  return (
    op?.target?.address ||
    op?.destination?.address ||
    op?.target ||
    op?.destination ||
    op?.contractAddress ||
    op?.contract?.address ||
    ''
  );
}

function getOperationEntrypoint(op) {
  return (
    op?.parameter?.entrypoint ||
    op?.parameters?.entrypoint ||
    op?.metadata?.operation_result?.parameters?.entrypoint ||
    ''
  );
}

function isAppliedOperation(op) {
  return getOperationStatus(op) === "applied";
}

function isTerminalFailedOperation(op) {
  return ["failed", "backtracked", "skipped"].includes(getOperationStatus(op));
}

function getOperationStatus(op) {
  return (
    op?.status ||
    op?.metadata?.operation_result?.status ||
    ''
  );
}

function normalizeAddress(address) {
  return String(address || '').trim().toLowerCase();
}

export function __areTradedTokensRefreshedForFixture(nfts, tradedTokens) {
  return areTradedTokensRefreshed(nfts, tradedTokens);
}

function areTradedTokensRefreshed(nfts, tradedTokens) {
  return tradedTokens.every(token => {
    const tradedContractAddress = String(token.contractAddress).toLowerCase();
    const match = nfts.find(nft =>
      String(nft.contractAddress).toLowerCase() === tradedContractAddress &&
      String(nft.tokenId) === String(token.tokenId)
    );

    if (!match) {
      return true;
    }

    const currentBalance = Number(match.balance);
    if (currentBalance === 0) {
      return true;
    }

    const startingBalance = Number(token.startingBalance);
    const quantity = Number(token.quantity);
    if (Number.isFinite(startingBalance) && Number.isFinite(quantity)) {
      return currentBalance <= startingBalance - quantity;
    }

    return false;
  });
}

function logIfEnabled(logPrefix, ...args) {
  if (logPrefix !== undefined) {
    console.log(`${logPrefix}${args[0]}`, ...args.slice(1));
  }
}

async function assertTzktResponseOk(response, context) {
  if (response.ok) {
    return;
  }

  const statusText = response.statusText ? ` ${response.statusText}` : '';
  let bodyExcerpt = '';

  try {
    const body = await response.text();
    if (body) {
      bodyExcerpt = ` Body: ${body.slice(0, 300)}`;
    }
  } catch (error) {
    bodyExcerpt = ` Body unavailable: ${error?.message || 'failed to read response body'}`;
  }

  throw new Error(`TzKT ${context} failed with HTTP ${response.status}${statusText}.${bodyExcerpt}`);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
