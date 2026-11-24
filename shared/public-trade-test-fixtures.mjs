import { fetchFa2BalancePages } from './tzkt-fa2-balances.js';
import { areTradedTokensRefreshed } from './public-trade-ops.js';

export const appliedOperations = (receipt, level = 100) => receipt.operations.map((_, id) => ({
  id, type: 'transaction', hash: receipt.hash, sender: { address: receipt.account },
  target: { address: receipt.escrowAddress }, parameter: { entrypoint: 'initiate_trade' },
  status: 'applied', level,
}));

// Existing burn-only scenarios model a lagging indexer until the expected burn
// has been indexed. This is fixture evidence, never a production freshness rule.
// Incoming-transfer tests explicitly supply their own level, independent of balance.
export function balanceRows(nfts, receipt, account) {
  return nfts.map((n, id) => ({ id: n.id ?? id, balance: n.balance,
    account: { address: account },
    lastLevel: areTradedTokensRefreshed([n], (receipt?.tradedTokens || []).filter(t =>
      t.contractAddress === n.contractAddress && String(t.tokenId) === String(n.tokenId))) ? 100 : 99,
    ...Object.fromEntries(['lastLevel', 'account', 'entrypoint'].filter(k => k in n).map(k => [k, n[k]])),
    token: { tokenId: n.tokenId, contract: { address: n.contractAddress } },
  }));
}

export async function fixtureHoldings(nfts, receipt, scope) {
  return fetchFa2BalancePages({ baseUrl: scope.tzktBase, account: scope.account, project: true,
    fetchImpl: async () => ({ ok: true, json: async () => balanceRows(nfts, receipt, scope.account) }) });
}
