# SmartPy ↔ Michelson correspondence

## Result: SEMANTICALLY EQUIVALENT

The locked SmartPy compilation and both Octez Alpha typechecks succeeded. The freshly generated and checked-in Michelson are not byte-identical, but all observed differences are confined to compiler-internal failure payload integers on source-invariant-guarded branches.

| Artifact | SHA-256 | Size |
|---|---|---:|
| Authoritative SmartPy source | `1D2746687A9962E2B991F7AE6B5FC59181B49262718EA26220504BCE5580B98B` | 2,534 lines |
| Fresh generated Michelson | `AF8BD83AA41DEB281B5E8B4A88774EB7A17B0DE41E9E72074FECD868FA4FB88B` | 380,974 bytes / 1,361 lines |
| Checked-in Michelson | `C0297A396C6C4B3DF02C62ABB77A336EB7D21E5DDABE9A63497B75E77830E6D2` | 382,371 bytes / 1,361 lines |
| Checked-in, LF-normalized evidence | `AE95C392BBC5217D9AC0E8AB04D58A36316A5A561FD6BC13807658FA41655C0B` | 381,012 bytes / 1,361 lines |

## Comparison evidence

- Exact byte equality: no.
- Equality after CRLF/LF normalization and trailing-newline normalization: no.
- Same line count: yes, 1,361.
- Differing aligned lines: 37.
- Every differing line: checked-in `PUSH int <positive source line>; FAILWITH` versus generated `PUSH int -1; FAILWITH`.
- Non-location/payload differences: zero.

The differing failure values are emitted for compiler proof obligations such as `open_some` after a successful `MEM`, `as_nat(size - 1)` after deletion of a present key, and equivalent guarded map/local access. From the declared constructor state and contract transitions, those branches are unreachable. On an artificially inconsistent storage value not producible by this source, a branch such as size underflow could expose a different failure payload; no authorized initial or reachable state established that path.

## Security-relevant correspondence

| Surface | Result |
|---|---|
| Parameter schema/layout | Equivalent: seven entrypoints; `initiate_trade` lacks `redeem_amount`; set/update include it. |
| Storage schema/layout | Equivalent, including immutable admin/burn address fields, pause, pair big-map, and size. |
| Constants and errors | Equivalent except the 37 unreachable compiler-internal integer payloads. |
| Authorization | Equivalent sender/admin checks and per-trade sender/user binding. |
| Pause | Equivalent; only trade is gated. |
| Pair add/update/delete | Equivalent validation, mutation, size accounting, and event paths. |
| Trade construction | Equivalent grouping, configured burn/redeem quantities, zero-tez FA2 calls, and event construction. |
| Tez behavior | Equivalent positive-only default, unrestricted attached tez elsewhere, and admin withdrawal. |
| Failure behavior | Equivalent on source-reachable states and calls. |

The confirmed redeem-repricing finding is explicit in both artifacts: `%initiate_trade` has no redeem amount at Michelson line 1; the five supplied economic identity fields are compared at generated line 314; and the redeem transfer reads `redeem_amount` from storage at generated line 568. The checked-in artifact has the same lines/instructions.

## Native validation

- Checked-in artifact: Octez 25.2 mockup, default Alpha protocol — `Well typed`, gas remaining `1039075.121`.
- Generated artifact: Octez 25.2 mockup, default Alpha protocol — `Well typed`, gas remaining `1039075.121`.

Retained evidence: `evidence/generated-michelson.tz` and `evidence/checked-in-michelson-normalized.tz`.

## Provenance status

- Historical SmartPy compiler version: unverified.
- Current locked compile compatibility: established with the supplied digest; observed compatible version remains 0.17.4.
- Source-to-checked-in historical compilation provenance: unverified.
- Current generated-to-checked-in semantics: verified as above.
- Checked-in-to-deployment identity: unverified; no deployment artifact was in scope.
- Protocol scope: typechecking used the image’s default Alpha protocol; no repository evidence established a deployed/historical protocol for an additional native check.

