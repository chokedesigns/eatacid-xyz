# BurnRedeem Contract Security Audit

## 1. Audit scope

Audited current outer-repository commit `9d7262795bdb89d86c6cffb86f3131f6abfd1714`:

- authoritative legacy SmartPy source: `contracts/burn-redeem-escrow/smartpy/burn-redeem-escrow-smartpy.py`;
- embedded `BurnRedeemEscrow Test Suite`;
- checked-in Michelson: `contracts/burn-redeem-escrow/artifacts/checks/burn-redeem-escrow-michelson.tz`;
- fresh Michelson generated with the locked `morum/smartpy` digest;
- targeted audit-only tests retained under `evidence/audit-only-tests`.

All pre-existing repository files remained read-only. No deployment, chain transaction, configured-address change, remediation, or contract/test modification was performed.

## 2. Executive result

One confirmed MEDIUM security vulnerability was found: a pending user trade does not bind its redeem quantity, so an administrator can lower only `redeem_amount` before inclusion and the unchanged signed trade will still burn the full input while returning the reduced output (BR-01).

- Confirmed security vulnerabilities: 1.
- Confirmed correctness defects: 0 separate defects.
- Unverified concerns: 0.

No other reachable unauthorized asset/control violation was confirmed. This result is not proof of security.

## 3. Contract security model

The contract is an admin-configured, inventory-funded exchange adapter. It keeps no per-user accounting: on each unpaused trade it validates a pair ID and caller-supplied asset fields, binds every `user_wallet` to `sender`, then emits grouped zero-tez FA2 transfers from user to a fixed burn address and from escrow inventory to user. Tezos transaction atomicity is the containment boundary for downstream failures.

The immutable admin controls pause, all pair lifecycle operations, all escrow-held FA2 tokens, and all tez. The immutable burn address is trusted as the intended sink. Configured token contracts are trusted to behave honestly and compatibly; the contract verifies only transfer-entrypoint type availability, not asset movement or FA2 compliance. Detailed entrypoint/storage semantics are in `01-semantic-model.md`.

## 4. SmartPy ↔ Michelson correspondence result

Classification: **SEMANTICALLY EQUIVALENT**.

Fresh and checked-in artifacts each contain 1,361 aligned lines. They are not exact matches: 37 lines replace positive source-location integers in the checked-in artifact with `-1` in fresh compiler-internal `FAILWITH` payloads. No other line differs. Those guards are unreachable from the constructor state and source transitions; reachable parameter/storage schemas, constants, authorization, pause, pair logic, tez logic, FA2 operations, and failures correspond.

Both artifacts typechecked successfully with Octez 25.2 using the locked image’s default Alpha protocol and reported identical remaining gas. BR-01 is present in both: `%initiate_trade` omits redeem amount and its output transfer reads the storage-current value. Full hashes and caveats are in `02-smartpy-michelson-correspondence.md`.

## 5. Existing simulation-suite assessment

The embedded suite passed under the locked legacy SmartPy image. It strongly exercises mock-ledger trade accounting, repeated trades, mixed-contract grouping, cleanup/cardinality, large values, inventory depletion, and atomic failure. It is not security-complete.

Most materially, `MockFA2.transfer` has no owner/operator check, so every user burn succeeds without approval. Several negative cases accept any failure reason; the labeled depleted-redeem test with pair ID 3 actually fails because that pair is absent; the malformed-address block swallows a host-language exception; XTZ balance checks use a Python variable; and events are not asserted. It has no pending-repricing, sender-mismatch, empty-batch, hostile-FA2, or non-default-tez case. See `03-existing-sim-review.md`.

## 6. Security invariants assessed

Sixteen implementation-specific invariants covered admin authority, pause, caller/pair binding, signed output terms, burn/redeem conservation, atomicity, mapping cardinality/validity, deletion/update effects, sender/operator separation, repeat behavior, quantity boundaries, tez custody, token custody, FA2 trust, and immutable identities.

I-04 (signed redeem-output binding) is violated by BR-01. The others held under source-reachable storage and the explicit admin/FA2/burn-address/chain trust assumptions. Definitions and the coverage matrix are in `04-security-invariants.md` and `07-test-coverage-matrix.md`.

## 7. Confirmed findings

### BR-01

- ID: BR-01
- Category: CONFIRMED SECURITY VULNERABILITY
- Severity: MEDIUM
- Affected entrypoint/state: `update_token_pair` → `initiate_trade`; pair `redeem_amount`
- Invariant violated: I-04
- Required attacker capability: administrator authority and transaction ordering before a pending user trade
- Concrete execution path: with pair B:2→R:5, escrow inventory 5 R, user balance 2 B, approval present, and contract unpaused, user signs the schema-valid trade. Admin updates only redeem amount to 1. Because the signed payload contains no redeem amount, all checks pass. Internal operations move 2 B to the burn address and only 1 R to the user, leaving 4 R in escrow.
- Impact: deterministic underpayment and irreversible loss of the user’s burned input; potentially every pending item for the repriced pair.
- SmartPy evidence: source trade type omits `redeem_amount`; validation omits it; transfer construction reads current storage; update can change it independently.
- Michelson confirmation: `%initiate_trade` schema at line 1 omits the field; line-314 validation compares only supplied fields; line 568 reads storage-current redeem amount. The checked-in artifact has the same behavior.
- Audit-test evidence: `Audit-only pending trade redeem repricing` passed, proving final balances user B=0, burn sink B=2, user R=1, escrow R=4.
- Confidence: HIGH

There are no separately confirmed correctness defects.

## 8. Trust assumptions

- The permanent admin honestly manages mappings, pause, tez, and token custody.
- Configured token contracts faithfully implement compatible transfer, authority, balance, and asset semantics.
- The burn address is the intended sink; unspendability is not enforced by this contract.
- Users create the necessary escrow operator approval for each burn asset.
- Pair identities, ratios, and redeem inventory are operationally correct.
- Tezos sender, ordering, counter, and atomic backtracking semantics apply.
- Off-chain clients correctly display current terms, while recognizing that on-chain payloads cannot bind redeem quantity.

The no-op burn-token audit test proved that a successfully lying configured contract can release redeem inventory without a real burn. Because configuration is admin-controlled, this remains a trust assumption rather than an unauthorized-caller finding.

## 9. Defense-in-depth observations

- Successful non-default entrypoints accept attached tez; audit evidence proved tez can enter through `toggle_pause` and later be withdrawn by admin.
- Configuration does not prove FA2 compliance, token existence, inventory, or honest behavior.
- Admin and burn address cannot transition on-chain, leaving no contract-native rotation/recovery path.
- Multiple IDs may describe duplicate economic relationships, increasing configuration ambiguity without violating ID uniqueness.

No observation above demonstrated an additional invariant violation.

## 10. Test-suite weaknesses / coverage gaps

- permissive mock FA2 omits operator enforcement;
- broad negative tests often omit exact exceptions and focused postconditions;
- one redeem-depletion test fails for the wrong reason;
- invalid recipient test is host-language-only and catches every exception;
- actual tez balances and event payloads are not asserted;
- no embedded tests cover BR-01, sender mismatch, empty batches, same-call duplicate insertion, hostile FA2 behavior, or non-default tez receipt;
- set-time zero/same-contract validation is not directly tested, although update-time validation is.

Targeted audit tests resolved the highest-value gaps; results are in `08-adversarial-test-results.md`.

## 11. Unverified concerns

None. Items lacking deployment/provenance evidence are limitations rather than asserted contract concerns.

## 12. Audit limitations

- Historical SmartPy compiler version and historical source-to-checked-in build provenance remain unverified.
- Checked-in Michelson identity with any deployed contract remains unverified; no chain/deployment evidence was supplied or queried.
- Octez validation used the locked image’s default Alpha protocol; no stronger repository evidence selected a deployed/historical protocol.
- Simulations do not substitute for execution against each production FA2 implementation or a live protocol context.
- No formal proof, exhaustive state exploration, gas-limit campaign, or full property fuzzing was performed; targeted tests addressed identified contract-specific questions.
- Admin intent and burn-address key control cannot be inferred from code.

## 13. Final conclusion

The current contract has one confirmed MEDIUM vulnerability: redeem output is not part of the user-authorized trade payload, permitting privileged pre-inclusion repricing without invalidation. Apart from BR-01, the audited code preserves admin gating, pause enforcement, pair identity/burn-amount binding, wallet binding, mapping integrity, token/tez custody boundaries, and atomic failure behavior under its explicit trust model.

The current generated Michelson and checked-in artifact are semantically equivalent for source-reachable behavior and both typecheck natively under the stated Alpha environment. The passing embedded and audit-only suites materially support the conclusions but do not prove the contract secure, deployed, or compatible with every real FA2/protocol context.
