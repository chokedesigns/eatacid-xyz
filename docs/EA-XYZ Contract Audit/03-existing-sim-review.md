# Existing SmartPy simulation review

The single embedded scenario `BurnRedeemEscrow Test Suite` ran successfully under the locked legacy SmartPy image. Its breadth is useful, but the suite uses a permissive `MockFA2.transfer` that performs no sender/operator check, so it cannot establish production FA2 authorization behavior.

| Logical group | What the setup/assertions genuinely prove | Classification | Material limitation |
|---|---|---|---|
| Initialization and mint baseline | Constructor pause/storage assumptions and mock balances used later | STRONG | Test fixture only; mock mint is unrestricted. |
| Default deposits | Calls with 1 mutez and 10 tez succeed | WEAK ASSERTION | `contract_balance` is a Python variable, not an assertion of contract balance or sender debit. Zero default is not tested. |
| XTZ withdrawal | Admin success; zero/excess/unauthorized/huge attempts fail; later withdrawal succeeds | PARTIAL | Most failures do not assert exact reasons; no actual admin balance assertion; local variable postconditions do not observe chain balance. |
| Pair creation | Empty input, many valid pairs, stored membership, and duplicate-against-existing failure | PARTIAL | Stored fields/size are not consistently asserted; zero amounts, same-contract input, and duplicate-within-one-call atomicity are absent. |
| Admin authorization | Non-admin set/delete/update/pause/withdraw fail | PARTIAL | Only pause asserts the exact unauthorized error; most failed calls lack focused storage postconditions. |
| Pause toggling | Initial pause, repeated admin toggles, unauthorized failure and state preservation | STRONG | Event payloads are not asserted. |
| Standard single trades | User/escrow/sink balances for multiple ratios and repeated users | STRONG for mock-ledger accounting | Does not exercise FA2 operator approval. |
| Pause rejection | A trade fails while paused and later unpause succeeds | PARTIAL | Failure reason and all immediate asset postconditions are not asserted. |
| Insufficient user burn balance | Failure plus later balance checks | PARTIAL | No exact downstream error; permissive mock still checks balance. |
| Caller field mismatch | Wrong burn amount and redeem contract fail with unchanged balances | PARTIAL | Other identity fields are not independently challenged; only one case asserts exact error. |
| Sender/user-wallet binding | None in the embedded suite | NOT COVERED | Direct impersonation path is untested. |
| Empty trade batch | None | NOT COVERED | Explicit `EMPTY_TRADE_LIST` branch is untested. |
| Frequent/repeated trades | Many sequential successes/failures and final aggregate balances | PARTIAL | Several loops lack immediate postconditions and exact failure reasons; timestamps do not model simultaneous execution. |
| Pair update then trade | Updated burn amount is used successfully; invalid update values preserve a pair | PARTIAL | No assertion that changed fields/event are correct; no pending-call/redeem-only update test. |
| Redeem depletion (ID 3 case) | Only proves a call with absent pair ID 3 fails | NOT MEANINGFUL for its label | Pair 3 was never created, so failure occurs at pair lookup, not redeem insufficiency. |
| Redeem depletion (10-user case) | First five consume inventory; last five fail with exact downstream error; failed users and sink remain unchanged | STRONG | Still uses non-authorizing mock FA2. |
| Large nat/high token ID | Large balance/amount and token ID 100000 execute with exact balance checks | STRONG | Practical gas extremes and protocol operation-size limits are not explored. |
| Cleanup | Duplicate, nonexistent, mixed IDs, membership and size effects | STRONG | Claimed “event verification” only rechecks storage; no event is inspected. |
| Admin token rescue | Two successful transfers with balances; zero/unauthorized failures | PARTIAL | Missing-interface/downstream failure and pause independence are untested. |
| Invalid recipient address | Python construction error is swallowed by bare `except` | NOT MEANINGFUL | The contract entrypoint is not exercised; any host-language exception passes this block. |
| Multi-pair single call | Aggregate two-pair accounting in one call | STRONG | Both legs use the same permissive mock contracts. |
| Mixed burn/redeem FA2 batching | Correct aggregate balances across two burn or redeem contracts | STRONG for grouping | Does not prove standard FA2 authorization or hostile-contract containment. |
| Atomic downstream failure | Depleted redeem calls leave late users’ burn/sink/redeem balances unchanged | STRONG in simulator | No strict operator-aware FA2; audit-only tests independently repeated this property. |
| Unexpected tez on non-default entrypoints | None | NOT COVERED | All non-default calls use zero attached tez. |
| Events | Execution logs show events | WEAK ASSERTION | No tag/payload/order assertions; one cleanup section is mislabeled as event verification. |

Passing this suite proves the encoded scenario under its mocks. It is not evidence of completeness, production FA2 compliance, deployment identity, or protection against pair repricing between signing and inclusion.

