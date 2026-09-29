# BurnRedeem Phase 7 — final adversarial review

**Status: COMPLETE.** GPT-6 Astra Ultra performed the substantive two-pass adversarial review. Its run was interrupted by account usage exhaustion. GPT-5.6 Sol High preserved those edits, verified the three corrections, completed the final checks, and wrote this report. This is an evidence-bounded audit of the frozen candidate, not formal proof or third-party certification.

## Scope and target integrity

The independent implementation pass preceded reading the 26 invariants and suite. The review used the audited SmartPy fixture, frozen Michelson, Phase 6 provenance, then only the relevant semantic model, obligation table, tests, oracles, and reconciliation. The Phase 6 hashes matched before the challenge and remained unchanged at completion:

| Target | SHA-256 | Recorded match |
|---|---|---|
| `source/burn-redeem-escrow-audit.py` | `68E5F2931FE40BD4B3779098E8607C4E67877C83C0AA97B8C5E32BABED5CC50B` | Yes |
| `artifacts/burn-redeem-escrow-audited.tz` | `FE850EA74A082D8E57EE47D0E3D70339088D1490128D93A86BDDDB338947F0A9` | Yes |

No contract logic, audit fixture, or frozen Michelson was edited. Current canonical SmartPy/Michelson hashes also matched their recorded provenance values.

## Independent questions and assurance comparison

Pass 1 raised nine concrete questions before consulting the existing invariant set:

| Question | Pass 2 disposition |
|---|---|
| Updated or deleted/reused pair ID versus an earlier quote | Current six-field matching rejects changed terms; a recreated ID with identical terms can trade, consistent with ID reuse and no nonce. I-04, I-09, I-18, I-19. |
| Duplicate cleanup, re-addition, and size underflow | Membership guards and source-valid cardinality transitions hold; mixed/repeated deletion is directly tested. I-04–I-07. |
| Repeated/mixed FA2 batches, aggregate balances, and grouped operation order | Per-contract calls and aggregate economics are checked with conforming FA2s; execution failure backtracks the batch. I-11–I-18. |
| Forwarded calls, sender binding, and callbacks | Privilege and `user_wallet` checks use `SENDER`; queued internal calls cannot change the current frame's guards. I-02, I-10. |
| Pause, pair changes, and admin inventory changes between transactions | Trade reads current pause, pair, and external inventory at execution; stale/insufficient paths fail. I-03, I-19, I-20. |
| Attached tez, withdrawal, and downstream rollback | Successful named calls retain tez by design. A missing funded-failure test was confirmed and closed below. I-17, I-21. |
| Typed/no-op/rejecting FA2s and irreversible burn assumption | Escrow enforces typed zero-tez calls, not honest token movement or sink unspendability. Missing no-op batch proof was closed below. I-24, I-25. |
| Events staged before downstream failure and log ordering | Tag/value/order and backtracking are checked; a missing compiled-type oracle was closed below. I-22. |
| Frozen Michelson and 37 generated-versus-canonical failure payloads | Eight-entrypoint ABI, six trade fields, caller guards, operations, and events match source. All 37 differences are integer payloads immediately before source-unreachable `FAILWITH` guards under the fixed initial state; no reachable unexplained difference. |

Pass 2 challenged all 26 invariants and the 181-cell obligation denominator. No missing or incorrect invariant, invalidated existing test, reachable contract defect, frozen-artifact semantic discrepancy, or generated-versus-canonical equivalence concern was established. The coverage verifier checks mapping and names; direct assertion quality required separate inspection. Cross-state, oracle, FA2, and Michelson questions above were resolved under the stated trust boundaries.

## Confirmed assurance gaps and resolution

1. **I-17/Bal — funded failure rollback.** Earlier failed trade cases carried zero tez, so tez rollback was not directly proven. T09 now attaches 7 mutez to a two-row redeem-inventory shortage and asserts the exact `FA2_INSUFFICIENT_BALANCE` error, unchanged escrow tez/core/pair state, both token legs and call counts; the event oracle checks no durable event.
2. **I-24/Bat — accepting-no-op batch.** The mapped no-op trade had one row. T12 now submits two repeated rows, checks both requested burn/redeem records, one grouped call per FA2, unchanged ledgers, and two exact trade events. This demonstrates the declared configured-FA2 trust boundary, not a BurnRedeem defect.
3. **I-22/Evt — event payload types.** Pinned SmartPy logs render positive `nat` and `int` values identically. The event verifier now compares all eight compiled `EMIT` tags and full type schemas against fixed expectations, in addition to rendered payload/order checks. A deliberate `TradeInitiated.token_pair_id` `nat`→`int` compiled-schema mutation was rejected.

The architecture and invariant map now describe the actual inline state checks and strengthened evidence. No new invariant or obligation was needed: the denominator remains **26 invariants / 181 obligations**, with 13 standalone scenarios. All three gaps are closed; no gap remains unresolved.

## Verification and limits

Final pinned SmartPy verification completed twice with clean exit: 13/13 standalone scenarios, event verifier 90 cases across eight entrypoints and eight exact event schemas with 11 staged-event rollbacks, and invariant verifier 26/26 and 181/181 on each run. After substituting only each output-directory prefix, all 13 scenario logs matched; the compiled escrow script was byte-identical. The event-schema mutation check passed. The temporary Windows PowerShell shell-wrapper newline/quoting errors were outside the repository; a corrected in-memory wrapper exited successfully. Phase 6 compilation and Octez typechecking were not rerun because their inputs were unchanged.

Residual material limitations are: (1) honest, conforming configured FA2 behavior; (2) burn-address control/unspendability is not proved by escrow; (3) SmartPy scenario/log evidence is not a chain receipt; (4) historical compiler provenance for the checked-in canonical Michelson remains unknown, with equivalence confined to source-reachable states; (5) the recorded Michelson typecheck applies to the locked Alpha mockup context; (6) deployed-contract identity and deployed-protocol compatibility are unverified. Administrator custody/configuration authority is an explicit trust assumption. None of these is a confirmed contract defect.

**Final Phase 7 result:** zero confirmed contract defects; three confirmed assurance gaps resolved; no release promotion or deployment performed.
