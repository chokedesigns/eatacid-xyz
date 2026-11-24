// Complete FA2 reads shared by Public and Admin. Callers own lifecycle publication.
const isNat = value => (typeof value === 'string' && /^[0-9]+$/.test(value))
  || (Number.isSafeInteger(value) && value >= 0);
const snapshots = new WeakMap();

// Only the complete reader can supply this evidence. A successful arbitrary
// fetch, a copied array, and an absent row carry no post-operation attribution.
export function isPostTradeFa2Snapshot(nfts, { baseUrl, account, minimumLevel, tradedTokens }) {
  const snapshot = snapshots.get(nfts);
  if (!snapshot || snapshot.baseUrl !== baseUrl || snapshot.account !== account ||
      !Number.isSafeInteger(minimumLevel) || minimumLevel <= 0 ||
      !Array.isArray(tradedTokens) || !tradedTokens.length ||
      JSON.stringify(nfts) !== snapshot.projection ||
      nfts.some(row => !isNat(row.balance) || !Number.isSafeInteger(Number(row.balance)))) return false;
  return tradedTokens.every(token => {
    const row = snapshot.rows.find(row => row.contractAddress === token.contractAddress &&
      row.tokenId === String(token.tokenId));
    return row && Number.isSafeInteger(row.lastLevel) && row.lastLevel >= minimumLevel &&
      row.account === account && row.entrypoint == null;
  });
}

export async function fetchFa2BalancePages({
  baseUrl, account, pageSize = 100, nonzeroOnly = false, fetchImpl = fetch,
  maxPages = 200, timeoutMs = 15000, project = false
}) {
  const url = new URL(`${baseUrl}/v1/tokens/balances`);
  url.searchParams.set('account', account);
  url.searchParams.set('token.standard', 'fa2');
  if (nonzeroOnly) url.searchParams.set('balance.ne', '0');
  url.searchParams.set('limit', String(pageSize));
  url.searchParams.set('sort.asc', 'id');
  const all = [];
  const identities = new Set();
  let cursor = -1n;

  for (let page = 0; page < maxPages; page += 1) {
    if (cursor >= 0n) url.searchParams.set('id.gt', String(cursor));
    const controller = new AbortController();
    let timer;
    let rows;
    try {
      // Bound both the request and body parsing, including a stalled body.
      rows = await Promise.race([
        (async () => {
          const response = await fetchImpl(url.toString(), {
            headers: { accept: 'application/json' }, signal: controller.signal
          });
          if (!response.ok) throw new Error(`TzKT ${response.status} reading FA2 balances`);
          return response.json();
        })(),
        new Promise((_, reject) => {
          timer = setTimeout(() => {
            reject(new Error('TzKT FA2 balance read timed out'));
            controller.abort();
          }, timeoutMs);
        })
      ]);
    } finally {
      clearTimeout(timer);
    }

    if (!Array.isArray(rows) || rows.length > pageSize) {
      throw new TypeError('Invalid TzKT FA2 balance page');
    }
    for (const row of rows) {
      const token = row?.token;
      const contract = token?.contract?.address;
      if (!isNat(row?.id) || !isNat(token?.tokenId) || !isNat(row?.balance)
        || typeof contract !== 'string' || !contract.trim()) {
        throw new TypeError('Malformed TzKT FA2 balance row');
      }
      const id = BigInt(row.id);
      const identity = `${contract}:${BigInt(token.tokenId)}`;
      if (id <= cursor || identities.has(identity)) {
        throw new Error('TzKT FA2 balance pagination did not advance');
      }
      cursor = id;
      identities.add(identity);
      all.push(row);
    }
    // A short, valid page establishes completeness, including genuine empty reads.
    if (rows.length < pageSize) {
      if (!project) return all;
      const result = all.map(row => ({ tokenId: row.token.tokenId,
        contractAddress: row.token.contract.address, balance: row.balance }));
      if (!nonzeroOnly && all.every(row => row.account?.address === account && row.entrypoint == null)) snapshots.set(result, { baseUrl, account,
        projection: JSON.stringify(result),
        rows: all.map(row => ({ contractAddress: row.token.contract.address,
          tokenId: String(row.token.tokenId), lastLevel: row.lastLevel,
          account: row.account?.address, entrypoint: row.entrypoint })) });
      return result;
    }
  }
  throw new Error(`TzKT FA2 balance pagination exceeded safety cap (${maxPages} pages)`);
}
