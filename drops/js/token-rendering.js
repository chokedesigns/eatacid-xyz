export function resolveBurnTokenRenderIdentities({
  canonicalTokenIds = [],
  eligibleTokenIds = [],
  excludedTokenIds = [],
  tokenMapping = {}
} = {}) {
  const eligible = new Set(eligibleTokenIds.map(String));
  const excluded = new Set(excludedTokenIds.map(String));
  const mappingEntries = Object.entries(tokenMapping || {});
  const candidates = mappingEntries.length > 0
    ? mappingEntries
    : canonicalTokenIds.map(tokenId => [String(tokenId), String(tokenId)]);
  const seenCanonical = new Set();
  const seenWallet = new Set();

  return candidates.reduce((identities, [canonicalTokenId, walletTokenId]) => {
    const canonicalId = String(canonicalTokenId);
    const walletId = String(walletTokenId);

    if (
      excluded.has(canonicalId) ||
      !eligible.has(walletId) ||
      seenCanonical.has(canonicalId) ||
      seenWallet.has(walletId)
    ) {
      return identities;
    }

    seenCanonical.add(canonicalId);
    seenWallet.add(walletId);
    identities.push({ canonicalTokenId: canonicalId, walletTokenId: walletId });
    return identities;
  }, []);
}
