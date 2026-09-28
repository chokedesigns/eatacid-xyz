# Invariant-to-test coverage matrix

| Invariant | Existing coverage | Strength | Gap |
|---|---|---|---|
| I-01 admin-only controls | Non-admin calls for all privileged entrypoints; several exact balance/state checks | PARTIAL | Most failures omit exact reason/postcondition; no missing-interface rescue test. |
| I-02 pause enforcement | Rejected trade while paused; repeated toggles | STRONG | Immediate asset postconditions/reason are weak. |
| I-03 pair/sender/field binding | Pair existence and two mismatches | PARTIAL | Sender mismatch absent; not every field independently varied. |
| I-04 signed output-term binding | None | NOT COVERED | Audit reproduction confirms violation BR-01. |
| I-05 burn/redeem conservation | Extensive single/multi/mixed balances | STRONG under mock | Embedded mock omits operator rules and honest-contract trust boundary. |
| I-06 atomic downstream failure | Depleted inventory with unchanged failed-user/sink balances | STRONG | Audit strict-FA2 batch independently confirms it. |
| I-07 mapping uniqueness/cardinality | Add duplicate; cleanup duplicate/missing/mixed; final size | STRONG | Duplicate-within-one-add atomicity absent from embedded suite; audit-only covered. |
| I-08 valid stored pairs | Invalid update values | PARTIAL | Equivalent invalid `set_token_pairs` cases absent. |
| I-09 delete/update invalidation | Trade after full cleanup fails; updated pair executes | PARTIAL | No pending-call tests for bound-field changes. |
| I-10 sender prevents operator abuse | None | NOT COVERED | Audit-only sender mismatch with strict FA2 passed. |
| I-11 repeat semantics | Frequent, interleaved, repeated-ID inventory use | STRONG | “Simultaneous” label is sequential; literal replay rests on chain counters. |
| I-12 empty/zero/large boundaries | Large amount/ID; invalid update zero | PARTIAL | Empty trade and set-time zero missing; audit-only covered empty. |
| I-13 tez custody | Deposit/withdraw success/failure | PARTIAL | Actual balance assertions absent; non-default receipt absent; audit-only proved non-default receipt/withdraw. |
| I-14 token custody | Admin rescue balances and unauthorized attempt | PARTIAL | Downstream rejection/missing transfer interface absent. |
| I-15 FA2 trust boundary | None; mock is always compliant and non-authorizing | NOT COVERED | Audit no-op FA2 demonstrates dependency. |
| I-16 immutable identities | Static source/storage model | NOT COVERED dynamically | No entrypoint exists to exercise. |

## Smallest high-value missing adversarial set

The retained audit-only suite adds the minimal cases that materially changed confidence:

1. strict operator-aware FA2: missing approval, approval success, sender impersonation, and late batch failure atomicity;
2. redeem-amount-only update ordered before a preconstructed trade (BR-01);
3. duplicate ID within a single add call and atomic rollback;
4. non-default tez receipt followed by exact withdrawal;
5. configured no-op burn contract to make the external-token trust boundary concrete.

No broad fuzz suite was added because these tests resolve the contract-specific unknowns directly.

