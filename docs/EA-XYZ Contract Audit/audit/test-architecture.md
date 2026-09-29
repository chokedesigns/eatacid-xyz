# BurnRedeemEscrow standalone test architecture

## Scope and decision

This design implements the denominator in `semantic-model.md`, `security-invariants.md`, and `test-coverage-requirements.md`; it does not redefine it. No Phase 1 inconsistency was found.

| Decision | Result |
|---|---|
| Separate standalone suite | Supported |
| Tested implementation | `source/burn-redeem-escrow-audit.py` only |
| Load mechanism | `sp.io.import_script_from_url("file:docs/EA-XYZ Contract Audit/source/burn-redeem-escrow-audit.py")` from repository root |
| Contract reference | Returned module's `BurnRedeemEscrow` class |
| Contract logic in tests | None duplicated |
| Future test files | Two |

The imported fixture contains a compilation target but no test target. Importing it from the suite therefore makes the contract class available without executing the removed legacy tests. The path is repository-relative, so execution must use the repository root as the working directory.

Legacy SmartPy scenarios can assert storage, balances, calls, and failures, but expose no in-scenario event-query API. Exact event proof therefore uses a second, read-only verifier over the pinned compiler's deterministic per-scenario `log.txt` files. The suite places a unique `EVENT_CASE::<id>` heading immediately before each event-relevant call. The verifier segments the corresponding execution, distinguishes committed from failed/backtracked executions, and compares tag, canonical payload, multiplicity, and order against an independent expectation table. Rendered values alone do not distinguish positive `nat` from `int`; the verifier separately checks all eight compiled `EMIT` tags and type schemas. It also verifies the compiled parameter surface for the construction/immutability negative obligation.

## Execution model

Pinned image: `morum/smartpy@sha256:445853de4f23a25b9e6b48cd0cb2f786319c5b44cc2219d207589880f7cf54ba` (repository tag `0.17.4`). The native `/smartpy/smartpyc` path was selected because it is the image's executable compiler; the bundled `SmartPy.sh` expects host-wrapper dependencies absent from the image.

Planned command, from repository root in PowerShell:

```powershell
docker run --rm --volume "${PWD}:/workspace:ro" --workdir /workspace --entrypoint /bin/sh morum/smartpy@sha256:445853de4f23a25b9e6b48cd0cb2f786319c5b44cc2219d207589880f7cf54ba -c "/smartpy/smartpyc 'docs/EA-XYZ Contract Audit/tests/burn-redeem-correctness-suite.py' --kind test --output /tmp/burn-redeem-correctness --install /smartpy --purge && python3 'docs/EA-XYZ Contract Audit/tests/verify-smartpy-output.py' /tmp/burn-redeem-correctness"
```

The repository is mounted read-only and compiler output is ephemeral. Success requires both the SmartPy scenarios and the independent output verifier to exit zero.

## Harness

Eight small helper groups are sufficient. Helpers construct data or assert explicit state; entrypoint calls and their sender/amount/failure expectations remain visible in each test.

| Group | Responsibilities |
|---|---|
| Deployment | Create deterministic accounts, conforming/adversarial token contracts, escrow, and the tez-admin proxy; register them in a fixed order. |
| Data builders | `pair(...)`, `trade(...)`, FA2 transfer/operator records; every field remains named at call sites. |
| FA2 setup | Mint balances, add/remove token-specific escrow operators, and seed escrow inventory. |
| Pair setup | Add, update, and clean up pairs without wrapping the entrypoint `.run(...)` assertion. |
| Trade setup | Build single/repeated/heterogeneous batches; execution remains explicit in the test. |
| Observation | `balance(owner, token_id)`, exact recorded transfer batches, escrow tez balance, mapping membership, and known-key enumeration. |
| State assertions | Assert all five escrow fields, every expected six-field pair, size/cardinality, relevant FA2 ledgers/operators/call journals, escrow/proxy tez balances, and unaffected decoys. |
| Event/output oracle | Add stable case markers; verify compiled entrypoint surface and exact committed event results from compiler logs. |

State checks are explicit `check_core`, `check_pair`, `check_balance`, `check_call`, and inline assertions; there are no `snapshot_relevant_state` or `assert_rollback` helpers. Representative success/failure cases enumerate the relevant configured IDs and ledger keys rather than compare opaque big maps. T09's redeem-shortage case also attaches 7 mutez and directly asserts unchanged escrow tez, core/pair state, token balances, and call counts.

The tez-admin proxy is used only where recipient balance must be observable. It is constructed as escrow admin, forwards a withdrawal request, accepts the returned tez, and exposes its own contract balance. Ordinary authorization tests use direct deterministic accounts.

## FA2 fixtures

Exactly three typed FA2 fixtures are planned, all defined in the suite file with the fixture's transfer type written once.

| Fixture | Minimal behavior | Audit purpose |
|---|---|---|
| `ConformingFA2` | Ledger keyed by `(owner, token_id)`; test-only mint; token-specific add/remove operators; owner-or-operator authorization; sequential balance movement; deterministic `FA2_NOT_OPERATOR` and `FA2_INSUFFICIENT_BALANCE`; committed transfer-call journal including caller, attached tez, and full batch. | All economic, custody, routing, grouping, balance, authorization, and depletion proofs. |
| `RejectingFA2` | Correctly typed `transfer` that always fails with `FA2_REJECTED`. | Deterministic downstream burn/redeem/admin-transfer failure and rollback. |
| `AcceptingNoOpFA2` | Readable test ledger with mint/setup; correctly typed `transfer` records caller, attached tez, and full batch but never mutates that ledger. | I-24 trust-boundary proof: exact pre/post balances show that escrow success/event does not guarantee token economics. |

A missing/wrong `transfer` interface uses an already deployed non-FA2 contract address (the tez-admin proxy); no fourth token fixture is needed. The conforming fixture is intentionally not a full FA2 implementation: it has no metadata, views, permissions policy, or unrelated entrypoints.

## Named test groups

| ID | Future `@sp.add_test` scenario | Direct scope |
|---|---|---|
| T01 | `construction_and_entrypoint_surface` | Initial storage; exact eight-entrypoint surface; immutable admin/burn address after representative calls. |
| T02 | `privileged_authorization_and_paused_nontrade` | Admin success and non-admin exact failure for all six privileged entrypoints; seven non-trade entrypoints while initially paused. |
| T03 | `pair_lifecycle_cardinality_and_events` | Single/multi/ID-0 add; per-field/all-field/identical update; mixed/missing/repeated/empty cleanup; delete/re-add. |
| T04 | `pair_validation_and_add_atomicity` | Existing/in-batch duplicate, zero amounts, equal addresses, late-invalid rollback, validation-before-auth. |
| T05 | `pause_and_trade_presence_validation` | Paused, empty, existing, missing first/late pair, unpause success. |
| T06 | `trade_term_and_wallet_binding` | Six independent term mismatches; correct wallet; first/late wallet mismatch; no generated token calls on validation failure. |
| T07 | `single_trade_operator_balances_and_custody` | Exact non-unit burn/redeem routing; operator lifecycle; exact inventory/depletion; token deposit/redeem/admin recovery. |
| T08 | `heterogeneous_batch_grouping_and_routing` | Same-contract repeated rows plus mixed contracts/IDs/pairs; exact per-contract batches/call counts; decoys unchanged. |
| T09 | `external_failure_atomicity_and_boundaries` | Missing/revoked operator; user and redeem one-unit/aggregate shortage; rejecting burn/redeem/admin transfer; amount 1 and large-natural success. |
| T10 | `repeated_trades_and_stale_quotes` | Sequential and repeated-in-batch additivity; fresh update succeeds; old terms and deleted pair fail; later checks still apply. |
| T11 | `tez_custody_and_withdrawal` | Default 1/large receipts, zero default, attached tez on a named entrypoint, partial/full withdrawal, zero/over/non-admin failures, both observable contract balances. |
| T12 | `fa2_interface_and_noop_trust_boundary` | Exact typed zero-tez calls; wrong/missing interface; accepting no-op success for trade and admin transfer; no economic movement. |
| T13 | `event_surface_and_backtracking` | Compact success/failure matrix for all eight tags, exact list push order, update no-op absence, batch trade ordering, and downstream backtracking. |

T13 supplies focused event cases, while event assertions attached to T02-T12 remain part of those tests' obligations. It is not a substitute for their state/balance assertions.

## Assertion standard

1. **Successful calls:** assert every relevant escrow field, all affected FA2 balances, all observable affected tez balances, exact recorded FA2 requests, required event results, and decoy/unaffected keys named by the invariant.
2. **Contract rejection:** use `.run(valid=False, exception=<exact Phase 1 string>)`; then expand the full relevant snapshot and require no committed event. Generic `valid=False` is prohibited when the contract error is known.
3. **Downstream rejection:** require `FA2_NOT_OPERATOR`, `FA2_INSUFFICIENT_BALANCE`, or `FA2_REJECTED` as applicable; assert escrow storage, all relevant ledgers/call journals, escrow/proxy tez balances, and committed events equal the pre-call snapshot.
4. **Batch rejection:** snapshot before the call and prove earlier-valid rows left no durable storage, token, tez, call-journal, or event effect. Separate cases fail validation early/middle/late and execution in burn/redeem operations.
5. **Events:** match exact tag, record fields/types/values, count, and order within the call. Assert reverse encounter order for `push`-built add/update/delete list fields. Do not assert cross-contract FA2 operation order because map iteration is not public; assert each target's received batch instead. A failed/backtracked execution has zero committed events even if the trace shows a staged event before a later operation fails.
6. **Storage completeness:** mapping assertions enumerate every ID introduced in that isolated scenario, assert exact six-field records or absence, and assert `token_mapping_size` equals that enumeration. Successful and failed trades additionally assert all five storage fields unchanged.
7. **Isolation:** each named scenario deploys fresh contracts. No scenario depends on another scenario's address allocation, balances, output, or execution order.

## Deterministic test data

| Kind | Values and use |
|---|---|
| Actors | `Admin`, `UserA`, `UserB`, `Outsider`, `BurnSink`; fixed `sp.test_account` names. Tez recipient accounting uses the admin proxy. |
| Pair IDs | `0` boundary, `1` primary, `2` heterogeneous/repeated, `9` missing/decoy. |
| Token IDs | `0` boundary, `7` primary burn, `8` primary redeem, `17` alternate, `99` decoy. |
| Standard quantities | `(burn=2, redeem=3)` primary; `(burn=5, redeem=1)` alternate; `1` minimum. |
| Balance boundaries | Exact requirement; requirement minus one; aggregate exact/short; final transfer depleting to zero. |
| Large natural | `2**60` for a token amount/ledger balance and a separate large token ID; no combinatorial pairing. |
| Tez | `1` mutez minimum, `7` mutez attached to a named call, `10_000_000` mutez receipt, partial and exact-full withdrawals, one-mutez overdraw. |
| Lists | Empty set/cleanup/trade, duplicate pair IDs in one add, repeated cleanup ID, two same-pair rows, and three-row mixed-contract batch. |
| Updates | Each field changed once, one all-fields update, one byte-for-byte identical update, one stale pre-update trade. |

The heterogeneous batch uses two conforming burn and two conforming redeem contracts. All other tests reuse one burn/redeem pair unless the invariant requires an adversarial target.

## Entrypoint and completion gates

| Surface | Positive | Negative |
|---|---|---|
| Constructor | T01 | Exact compiled entrypoint surface plus immutability assertions in T01 |
| `toggle_pause` | T02/T05 | T02 unauthorized |
| `admin_withdraw_xtz` | T02/T11 | T02/T11 unauthorized, zero, overdraw |
| `admin_transfer_token` | T02/T07 | T02/T09/T12 unauthorized, zero, shortage, rejection/interface |
| `initiate_trade` | T05-T10/T12 | T05/T06/T09/T10/T12 |
| `set_token_pairs` | T02-T04 | T02/T04 |
| `update_token_pair` | T02-T04/T10 | T02/T04/T10 |
| `cleanup_token_pairs` | T02/T03/T10 | T02; missing/repeated are successful reported failures in T03 |
| `default` | T02/T11 | T11 zero tez |

Implementation is complete only when all 26 rows in `invariant-test-map.md` are linked to implemented names, every listed obligation is asserted directly, both command stages pass under the pinned image, and all ten Phase 1 suite-completion rules remain true. A passing SmartPy exit without a passing output verifier is incomplete.

## Future file layout

```text
docs/EA-XYZ Contract Audit/tests/
  burn-redeem-correctness-suite.py
  verify-smartpy-output.py
```

All harness helpers, the three FA2 fixtures, and the tez-admin proxy remain in the suite file. No fixtures directory, package file, generated output, or framework configuration is needed.
