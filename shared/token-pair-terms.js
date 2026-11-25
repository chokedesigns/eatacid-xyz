// Exact Public trade identity, shared with Admin authoring and readiness.
export function exactNat(value, positive = false) {
  if (typeof value === 'number' && (!Number.isSafeInteger(value) || value < 0)) return null;
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  const text = String(value);
  if (!/^\d+$/.test(text)) return null;
  const nat = BigInt(text);
  return positive && nat === 0n ? null : nat.toString();
}

export function tokenPairTermsKey(value) {
  if (!value) return null;
  const addresses = [value.burn_contract_address, value.redeem_contract_address];
  if (!addresses.every(v => typeof v === 'string' && v.length > 0 && v.trim() === v)) return null;
  const terms = [addresses[0], exactNat(value.burn_token_id), exactNat(value.burn_amount, true),
    addresses[1], exactNat(value.redeem_token_id), exactNat(value.redeem_amount, true)];
  return terms.some(v => v === null) ? null : JSON.stringify(terms);
}

export function sameTokenPairTerms(left, right) {
  const key = tokenPairTermsKey(left);
  return key !== null && key === tokenPairTermsKey(right);
}
