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
    console.log(`\u{1F50D} Fetching token_pair_id for ${burnContractAddress}, token ${burnTokenId}`);

    const url =
      `${tzktBase}/v1/contracts/${escrowAddress}` +
      `/bigmaps/token_mapping/keys?active=true&limit=10000`;

    const response = await fetch(url);
    const raw = await response.json();
    console.log("\u{1F4DC} Retrieved raw token_mapping data:", raw);

    const tokenMappings = (raw || []).filter(
      (entry) => entry && entry.active !== false && entry.value != null
    );

    console.log("\u{1F4DC} Filtered active token_mapping data:", tokenMappings);

    const burnContract = String(burnContractAddress).toLowerCase();
    const tokenId = String(burnTokenId);
    const matching = tokenMappings.find(
      (entry) =>
        String(entry.value.burn_contract_address).toLowerCase() === burnContract &&
        String(entry.value.burn_token_id) === tokenId
    );

    if (matching) {
      console.log(`\u2705 Found token_pair_id: ${matching.key}`);
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
    try {
      const url = `${tzktBase}/v1/contracts/${contractAddress}/bigmaps/operators/keys?active=true`;
      const response = await fetch(url);
      const operators = await response.json();

      groups[contractAddress].forEach(token => {
        const isApproved = operators.some(op =>
          op.key.owner === userWalletAddress &&
          op.key.operator === escrowAddress &&
          parseInt(op.key.token_id, 10) === parseInt(token.tokenId, 10)
        );

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
      });
    } catch (error) {
      console.error(`${operatorErrorPrefix}Error checking operators for ${contractAddress}:`, error);
      groups[contractAddress].forEach(token => {
        approvalOps.push(createApprovalOp({
          contractAddress,
          escrowAddress,
          userWalletAddress,
          tokenId: token.tokenId
        }));
      });
    }
  }

  return approvalOps;
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
