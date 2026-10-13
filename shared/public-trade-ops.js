const DEBUG = false;
const dlog = (...args) => { if (DEBUG) console.log(...args); };

/**
 * Resolves one active token_pair_id matching all six intended trade terms.
 * The configured indexer and escrow scope the mapping; ambiguity fails closed.
 *
 * @param {Object} args
 * @param {string} args.tzktBase
 * @param {string} args.escrowAddress
 * @param {string} args.burnContractAddress
 * @param {number|string} args.burnTokenId
 * @param {number|string} args.burnAmount
 * @param {string} args.redeemContractAddress
 * @param {number|string} args.redeemTokenId
 * @param {number|string} args.redeemAmount
 * @returns {Promise<string|null>} Exact nat pair ID, or null on absence/error/ambiguity.
 */
export async function fetchTokenPairId({
  tzktBase,
  escrowAddress,
  burnContractAddress,
  burnTokenId,
  burnAmount,
  redeemContractAddress,
  redeemTokenId,
  redeemAmount
}) {
  try {
    if (![tzktBase, escrowAddress, burnContractAddress, redeemContractAddress].every(
      value => typeof value === 'string' && value.length > 0 && value.trim() === value
    )) {
      throw new Error('Missing or invalid token pair address/indexer context.');
    }
    const terms = {
      burn_contract_address: burnContractAddress,
      burn_token_id: exactNat(burnTokenId),
      burn_amount: exactNat(burnAmount, true),
      redeem_contract_address: redeemContractAddress,
      redeem_token_id: exactNat(redeemTokenId),
      redeem_amount: exactNat(redeemAmount, true)
    };
    if (Object.values(terms).some(value => value == null)) {
      throw new Error('Missing or invalid token pair ID/amount terms.');
    }
    dlog(`\u{1F50D} Fetching token_pair_id for ${burnContractAddress}, token ${burnTokenId}`);

    const limit = 10000;
    let matchingId = null;
    // Inspect the complete mapping before accepting a match. A full page is
    // insufficient evidence of uniqueness; a paging cap fails closed as well.
    for (let page = 0; page < 100; page++) {
      const url = `${tzktBase}/v1/contracts/${escrowAddress}` +
        `/bigmaps/token_mapping/keys?active=true&limit=${limit}&offset=${page * limit}&sort.asc=id`;
      const response = await fetch(url);
      await assertTzktResponseOk(response, 'fetch token_pair_id mapping');
      const raw = await response.json();
      if (!Array.isArray(raw) || raw.length > limit) {
        throw new Error('Unexpected token_mapping response.');
      }
      for (const entry of raw) {
        const value = entry?.value;
        if (entry?.active === false || value == null) continue;
        if (value.burn_contract_address !== terms.burn_contract_address ||
            value.redeem_contract_address !== terms.redeem_contract_address ||
            exactNat(value.burn_token_id) !== terms.burn_token_id ||
            exactNat(value.burn_amount, true) !== terms.burn_amount ||
            exactNat(value.redeem_token_id) !== terms.redeem_token_id ||
            exactNat(value.redeem_amount, true) !== terms.redeem_amount) continue;
        if (matchingId !== null) {
          throw new Error('Ambiguous token pair: multiple active mappings match the intended trade terms.');
        }
        matchingId = exactNat(entry.key);
        if (matchingId === null) throw new Error('Invalid token_pair_id in matching mapping.');
      }
      if (raw.length < limit) {
        if (matchingId !== null) {
          dlog(`\u2705 Found token_pair_id: ${matchingId}`);
          return matchingId;
        }
        console.warn(`\u274C No token_pair_id matching intended trade terms for ${burnContractAddress} / ${burnTokenId}`);
        return null;
      }
    }
    throw new Error('Token pair mapping paging cap reached before uniqueness could be established.');
  } catch (error) {
    console.error("\u274C Error fetching token_pair_id:", error);
    return null;
  }
}

function exactNat(value, positive = false) {
  if (typeof value === 'number' && (!Number.isSafeInteger(value) || value < 0)) return null;
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  const text = String(value);
  if (!/^\d+$/.test(text)) return null;
  const nat = BigInt(text);
  return positive && nat === 0n ? null : nat.toString();
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
    let response;
    try {
      response = await fetch(`${tzktBase}/v1/operations/${opHash}`);
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
