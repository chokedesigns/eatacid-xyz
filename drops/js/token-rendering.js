export function resolveBurnTokenRenderIdentities({
  canonicalTokenIds = [],
  eligibleTokenIds = [],
  excludedTokenIds = [],
  tokenMapping = {},
  allowCanonicalFallback = true
} = {}) {
  const eligible = new Set(eligibleTokenIds.map(String));
  const excluded = new Set(excludedTokenIds.map(String));
  if (!tokenMapping || typeof tokenMapping !== 'object' || Array.isArray(tokenMapping)) {
    throw new Error('Invalid burn token translation map.');
  }
  const mappingEntries = Object.entries(tokenMapping);
  if (!mappingEntries.length && !allowCanonicalFallback) {
    throw new Error('Missing burn token translation map.');
  }
  // Resolve exclusions only against canonical keys. Validate the whole map before
  // filtering so an excluded key cannot conceal an ambiguous wallet identity.
  const targets = new Set();
  for (const [canonicalId, walletId] of mappingEntries) {
    if (!/^(0|[1-9]\d*)$/.test(canonicalId)
      || !['string', 'number'].includes(typeof walletId)
      || (typeof walletId === 'number' && !Number.isSafeInteger(walletId))
      || !/^(0|[1-9]\d*)$/.test(String(walletId))) {
      throw new Error('Invalid burn token translation identity.');
    }
    if (targets.has(String(walletId))) throw new Error('Ambiguous burn token translation identity.');
    targets.add(String(walletId));
  }
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
