# BurnRedeemEscrow invariant-to-test map

Obligation abbreviations are inherited unchanged from `test-coverage-requirements.md`: `P`, `N`, `B`, `S`, `Bal`, `Fail`, `Evt`, `Bat`. Every abbreviation in the table is a direct assertion requirement, not incidental execution.

Test IDs and full scenario names are defined in `test-architecture.md`.

| Invariant | Named future tests | Marked obligations mapped | Direct proof assignment |
|---|---|---|---|
| I-01 | T01, T02, T03, T07, T11 | P, N, S | T01 asserts exact initial storage and exact eight-entrypoint compiled surface; representative successes across the cited tests reassert immutable admin/burn address. |
| I-02 | T02 | P, N, S, Bal, Fail, Evt | Admin and outsider matrix covers all six privileged entrypoints with exact unauthorized errors, complete post-state/balances, and success/failure event results; invalid outsider update also proves validation precedence. |
| I-03 | T02, T05 | P, N, S, Bal, Fail, Evt | T02 executes all non-trade surfaces while paused; T05 rejects a fully funded valid trade while paused and succeeds after unpause, with snapshots/events. |
| I-04 | T03, T04 | P, N, B, S, Fail, Evt, Bat | Mixed add/update/delete/re-add includes ID 0 and cardinality after every step; duplicate late add rolls back; missing/repeated cleanup never underflows; exact events/errors. |
| I-05 | T03, T04 | P, N, B, S, Fail, Evt, Bat | Exact valid single/multi/ID-0 storage plus independent duplicate, zero-burn, zero-redeem, equal-address, and late-invalid cases. |
| I-06 | T03, T04 | P, N, B, S, Fail, Evt | Per-field and all-field updates preserve size; identical update is eventless; missing/invalid values and validation-before-auth use exact failures and unchanged state. |
| I-07 | T02, T03 | P, N, B, S, Fail, Evt, Bat | Empty and mixed existing/missing/repeated lists assert exact partitions in push order, mapping/size, unauthorized failure, and no unrelated deletion/underflow. |
| I-08 | T05, T08 | P, N, B, S, Bal, Fail, Evt, Bat | Single/multi existing pairs succeed; empty and missing first/late pair fail exactly with full state/balance/call/event rollback. |
| I-09 | T06 | P, N, B, S, Bal, Fail, Evt, Bat | Exact current record succeeds; six one-field mutations each fail `Error: Invalid token parameters.` and a late mismatch proves batch rollback. |
| I-10 | T06 | P, N, S, Bal, Fail, Evt, Bat | Sender-bound single/batch success plus first/late foreign wallet exact failure and complete rollback. |
| I-11 | T07, T09 | P, N, B, S, Bal, Fail, Evt, Bat | Recorded conforming request and ledgers prove exact user-to-burn route/amount; authorization and balance failures prove no redeem/event durability. |
| I-12 | T07, T09 | P, N, B, S, Bal, Fail, Evt, Bat | Non-unit redeem and exact depletion prove escrow-to-user effect; one-unit/aggregate shortage and rejecting redeem roll back burns and events. |
| I-13 | T06, T07, T08 | P, N, B, S, Bal, Fail, Evt, Bat | Heterogeneous trade/admin recovery assert designated contracts/IDs and unchanged decoys; submitted route mismatches fail binding, including late batch rollback. |
| I-14 | T07, T09 | P, N, B, S, Bal, Fail, Evt, Bat | Operator-approved exact/aggregate balances succeed; missing/revoked operator and aggregate shortage return deterministic FA2 errors with atomic rollback. |
| I-15 | T07, T09 | P, N, B, S, Bal, Fail, Evt, Bat | Exact aggregate inventory commits and depletes to zero; one-unit and aggregate shortages preserve all legs/state/events. |
| I-16 | T06, T08 | P, N, B, S, Bal, Evt, Bat | Recorded same-contract and mixed-contract batches prove one representation per row, exact per-target grouping/content, zero tez, event order, and no decoy/validation-failure calls. |
| I-17 | T04, T05, T06, T08, T09, T13 | P, N, S, Bal, Fail, Evt, Bat | Valid batches commit; add/trade validation fails early/middle/late; burn/redeem execution failures restore the full snapshot and have no committed events. |
| I-18 | T09, T10 | P, N, B, S, Bal, Fail, Evt, Bat | Sequential and repeated-pair batch effects/events are additive; after a success, revoked authorization, shortage, pause, or stale terms still fail and roll back. |
| I-19 | T10 | P, N, S, Bal, Fail, Evt | Fresh post-update terms succeed; each old term set fails binding and deleted ID fails existence, with unchanged balances/storage and no trade event. |
| I-20 | T02, T07, T09, T12 | P, N, B, S, Bal, Fail, Evt | Deposits remain in the conforming ledger until exact redeem/admin transfer; outsider, zero, shortage, rejection, and wrong-interface recovery preserve custody. |
| I-21 | T02, T11 | P, N, B, S, Bal, Fail, Evt | Minimum/large default receipts, named-entrypoint tez, partial/full proxy withdrawal, and zero/over/outsider errors assert escrow and recipient proxy balances plus events. |
| I-22 | T02-T13 | P, N, B, S, Evt, Bat | Output oracle covers every successful event-bearing path, exact tags/types/payloads/count/order, update no-op, empty-list events, and absence after all rejection/backtracking classes. |
| I-23 | T03, T04, T07, T09, T11 | P, N, B, S, Bal, Fail, Evt, Bat | ID 0, amount 1, exact balances, full depletion, `2**60` token arithmetic, zero amounts, one-unit shortages, duplicate/repeated IDs, and no underflow are direct cases. |
| I-24 | T07, T12 | P, N, S, Bal, Evt, Bat | Conforming economics are the control; accepting no-op trade/admin transfer succeeds and emits exact events/calls while token balances do not move, explicitly proving the boundary. |
| I-25 | T07, T09, T12 | P, N, S, Bal, Fail, Evt, Bat | Call journals prove exact transfer type/target/payload and zero tez; wrong/missing interface and typed rejection use exact deterministic errors and full rollback. |
| I-26 | T05-T10, T12 | P, N, S, Bal, Fail, Evt, Bat | Every successful single/batch and representative failure expands a five-field escrow snapshot; only conforming external balances/events change on success and nothing changes on failure. |

## Coverage accounting

| Measure | Result |
|---|---:|
| Invariants assigned | 26 / 26 |
| Marked obligation cells assigned | 181 / 181 |
| Unmapped marked obligations | 0 |
| Entrypoints with applicable positive and negative groups | 8 / 8 |

The 181-cell total is the Phase 1 table denominator. A test implementation may reuse a call across rows only when its assertions explicitly name every claimed state, balance, failure, event, or batch effect.
