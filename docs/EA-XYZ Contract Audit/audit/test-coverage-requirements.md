# Standalone suite completion criteria

A row is complete only when every marked obligation has a direct assertion. `P` positive, `N` negative, `B` boundary, `S` post-storage, `Bal` token/tez balance, `Fail` exact contract failure, `Evt` exact event, `Bat` batch/atomicity. `—` means not intrinsically required by that invariant; it may still be exercised by another row.

| ID | P | N | B | S | Bal | Fail | Evt | Bat |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| I-01 | ✓ | ✓ | — | ✓ | — | — | — | — |
| I-02 | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✓ | — |
| I-03 | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✓ | — |
| I-04 | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| I-05 | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| I-06 | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | — |
| I-07 | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| I-08 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| I-09 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| I-10 | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| I-11 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| I-12 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| I-13 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| I-14 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| I-15 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| I-16 | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ |
| I-17 | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| I-18 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| I-19 | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✓ | — |
| I-20 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| I-21 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| I-22 | ✓ | ✓ | ✓ | ✓ | — | — | ✓ | ✓ |
| I-23 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| I-24 | ✓ | ✓ | — | ✓ | ✓ | — | ✓ | ✓ |
| I-25 | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| I-26 | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✓ | ✓ |

## Minimum acceptance rules

- Each explicit contract-side rejection must assert its exact error string, not merely `valid=False`. For FA2-originated errors, assert the configured mock error when deterministic, otherwise assert failure plus complete rollback.
- Each success must assert the relevant storage and all affected FA2/tez balances. A call executing adjacent lines is not coverage.
- Each event obligation must inspect exact tag, payload, multiplicity, and order. Failed calls and downstream-operation failures must prove no durable event.
- Each six-field trade term receives an independent mismatch test. `redeem_amount` is mandatory and may not be inferred from a nearby burn test.
- Batch tests must include multiple rows on one FA2, multiple FA2 addresses, a repeated pair, mixed pairs, and failures in a late validation row, burn operation, and redeem operation.
- A conforming operator-enforcing FA2 is required for economic assertions. Separate instrumented rejecting and accepting-no-op doubles establish interface/atomicity/trust boundaries without treating hostile-token behavior as escrow correctness.
- Boundary coverage includes empty lists where accepted/rejected, ID `0`, amount `1`, exact balance, one-unit shortage, full depletion, feasible large naturals, duplicate IDs within one input, repeated cleanup IDs, and an identical update.
- Completion requires all 26 invariant rows to be linked to named tests with no unasserted marked cell. No Phase 1 artifact itself implements tests.
