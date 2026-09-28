# Findings

## BR-01 — Pending trades can be silently repriced downward

- ID: BR-01
- Category: CONFIRMED SECURITY VULNERABILITY
- Severity: MEDIUM
- Affected entrypoint/state: `update_token_pair` followed by `initiate_trade`; `redeem_amount` in `token_mapping`.
- Invariant violated: I-04 — successful output must remain bound to the economic output authorized when the user signed, or an intervening mutation must invalidate the call.
- Required attacker capability: administrator authority plus ordering before a user’s pending trade; equivalently, a compromised administrator observing a pending operation. No user key or FA2-operator key is required.

### Concrete reachable execution

1. Initial state: unpaused; pair 11 maps burn asset B, amount 2, to redeem asset R, amount 5; escrow holds at least 5 R; user holds 2 B and has approved escrow for B.
2. The user prepares/signs `initiate_trade` for pair 11 with its burn/redeem contracts and token IDs and burn amount 2. The schema contains no `redeem_amount` or minimum output.
3. Before inclusion, admin calls `update_token_pair` with every field unchanged except `redeem_amount=1`.
4. The pending user call executes. Pair existence, all five caller-supplied pair fields, and `sender == user_wallet` still pass.
5. External operations transfer 2 B from user to the immutable burn address and 1 R from escrow to user; 4 R remain in escrow.
6. Result: the signed call succeeds under materially worse output terms rather than failing. The burn transfer is not recoverable through this contract.

### Impact

A privileged ordering attacker can cause a pending user transaction to burn the full expected input while delivering as little as one unit of output. Impact is bounded to trades included after the malicious update and before users stop/cancel inclusion; it can affect every item using the repriced pair. Severity is MEDIUM because impact is direct asset loss and deterministic, but exploitation requires the privileged administrator (or an already-planned admin update whose ordering is adversarial).

### Evidence

- SmartPy: `initiate_trade` type at source lines 374–383 omits redeem amount; matching at 407–415 excludes it; transfer/event construction at 443 and 463 reads the current stored amount. `update_token_pair` changes that field at lines 619–621.
- Michelson: generated and checked-in parameter line 1 omit `%redeem_amount` from `%initiate_trade`; the generated line-314 validation comment enumerates the five comparisons; line 568 constructs the output from storage. Correspondence is semantically equivalent.
- Audit test: `evidence/audit-only-tests/burn-redeem-adversarial.py`, test `Audit-only pending trade redeem repricing`, preserves a pre-update payload, performs a redeem-only update, then proves the call burns 2 and returns 1. Locked SmartPy execution passed.
- Confidence: HIGH.

## Confirmed correctness defects

None separately confirmed. BR-01 also creates benign update-race correctness risk, but it is counted once under the stronger security classification.

## Trust assumptions

- TA-01: administrator honestly manages pause, mappings, tez, and token custody.
- TA-02: configured FA2 contracts faithfully move the represented assets and enforce suitable authority/balance rules.
- TA-03: the configured burn address is an intended sink and is not expected to return or spend received assets.
- TA-04: users establish the escrow’s required FA2 operator permission before trading.
- TA-05: configured ratios, identities, and escrow inventory are operationally correct.
- TA-06: Tezos atomic internal-operation failure, sender, ordering, and counter semantics hold.

The hostile-FA2 audit test concretely demonstrates TA-02: a type-compatible no-op burn contract permits redeem inventory to leave without a real burn. This requires admin configuration and is not classified as an unauthorized contract vulnerability.

## Defense-in-depth observations

- DD-01: successful non-default entrypoints accept attached tez. The audit test funded `toggle_pause` with 7 mutez and then withdrew exactly 7 mutez. No unauthorized withdrawal exists, but accidental caller funds enter admin-controlled custody.
- DD-02: pair configuration checks type-level addresses only at execution; it does not establish FA2 compliance, token existence, balance, or honest transfer behavior.
- DD-03: admin and burn address are immutable. This limits mutation paths but provides no on-contract key rotation/recovery or sink transition.
- DD-04: duplicate economic pair relationships under different IDs are allowed. This does not break mapping integrity but expands configuration ambiguity.

## Test-suite weaknesses

- TS-01: permissive `MockFA2` omits operator authorization, masking the production approval precondition.
- TS-02: the labeled depleted-redeem test uses nonexistent pair ID 3 and fails at pair lookup; a later standalone group does genuinely cover depletion.
- TS-03: many `valid=False` calls do not assert an exception, so they do not prove the intended failure branch.
- TS-04: the malformed recipient test swallows any Python exception and never meaningfully exercises the contract.
- TS-05: XTZ assertions use a Python accounting variable rather than contract/admin balances.
- TS-06: events are not asserted; the cleanup “event” checks only storage membership.
- TS-07: no embedded coverage for sender mismatch, empty batches, duplicate IDs within one add call, hostile FA2 behavior, attached tez on non-default entrypoints, or pending redeem repricing.

## Unverified concerns

None. Deployment identity and historical provenance gaps are audit limitations, not speculative contract findings.

## Adversarial static-analysis disposition

| Challenge | Disposition |
|---|---|
| Unauthorized admin calls | Rejected by sender checks; no mutation path found. |
| Pause bypass | No trade bypass found; only admin/default actions intentionally remain available. |
| Missing/malformed pair and field mismatch | Rejected; exception ordering sometimes differs from test labels but no asset effect. |
| Pair add/update/delete sequences | Cardinality and membership remain coherent from constructor state. |
| Duplicate relationships/IDs | Duplicate IDs rejected; duplicate relationships are permitted configuration. |
| Zero/large quantities | Stored zero quantities rejected; Michelson nat prevents wrap; practical resource limits remain. |
| Wrong token contracts/IDs | Caller-bound changes fail, except redeem quantity is not caller-bound (BR-01). |
| Operator edge cases | Missing approval fails atomically with strict FA2; approval does not bypass wallet/sender binding. |
| Repeated/batched trades | Each item creates one burn and one redeem transfer; aggregate insufficiency backtracks all. |
| Unexpected tez | Accepted on successful non-default calls; admin-only exit (DD-01). |
| Treasury boundaries | Only admin rescue/withdraw; broad authority is explicit. |
| External-operation failure | Backtracks prior operations in simulator; no partial asset effect found. |
| Hostile external contract | Successful lies are not detectable (TA-02); failed calls are atomic. |
| Ordering around update/delete/pause | Delete/pause/bound-field changes cause failure; redeem-only update silently reprices (BR-01). |
| Reentrancy | No synchronous callback/reentrant state window exists in the Michelson operation model; emitted operations execute after contract code returns. |
