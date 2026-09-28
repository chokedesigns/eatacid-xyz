# BurnRedeemEscrow correctness and security invariants

These are test obligations for the current fixed contract, not proposed behavior.

### I-01
ID: I-01
Invariant: Construction yields `paused=True`, the supplied immutable `admin` and `burn_address`, an empty mapping, and size zero; no successful entrypoint can change admin or burn address.
Applies to: constructor; all entrypoints.
Positive proof target: assert initial storage and immutability after representative successful calls.
Negative proof target: demonstrate there is no callable path that replaces either immutable address.

### I-02
ID: I-02
Invariant: Only the stored admin can successfully toggle pause, withdraw tez/tokens, add/update pairs, or clean up pairs.
Applies to: six privileged entrypoints.
Positive proof target: admin succeeds for each action with otherwise valid inputs.
Negative proof target: non-admin calls fail exactly with `Error: Unauthorized.` and leave state/balances/events unchanged (noting update validates parameters first).

### I-03
ID: I-03
Invariant: While paused, every trade fails; pause does not gate the other seven entrypoints.
Applies to: `toggle_pause`, `initiate_trade`, all non-trade entrypoints.
Positive proof target: trade succeeds after unpause and permitted non-trade actions succeed while paused.
Negative proof target: a valid trade while paused fails exactly with `Error: Contract is paused.` without effects.

### I-04
ID: I-04
Invariant: `token_mapping_size` always equals mapping cardinality; an ID appears at most once, deletion decrements once, update never changes size, and a deleted ID may be reused.
Applies to: add, update, cleanup.
Positive proof target: mixed add/update/delete/re-add sequence preserves equality.
Negative proof target: duplicates never increase cardinality, and repeated/missing deletions never decrement it.

### I-05
ID: I-05
Invariant: Pair creation accepts only positive burn/redeem amounts, distinct burn/redeem FA2 addresses, and IDs absent both before and earlier in the same batch.
Applies to: `set_token_pairs`.
Positive proof target: valid single/multiple/zero-ID pairs are stored exactly.
Negative proof target: independently exercise duplicate, zero burn, zero redeem, and equal-address errors; a late-invalid row rolls back the full batch.

### I-06
ID: I-06
Invariant: Updating requires an existing ID, positive amounts, and distinct FA2 addresses; success stores exactly the supplied six fields and preserves size.
Applies to: `update_token_pair`.
Positive proof target: change each field and all fields; verify exact post-state and changed-field event; identical update is a no-op.
Negative proof target: missing ID and each invalid-value class fail exactly with no mutation/event; verify validation-before-auth behavior.

### I-07
ID: I-07
Invariant: Cleanup deletes existing IDs but treats missing IDs, and repeats after their first deletion, as reported failures rather than transaction failures.
Applies to: `cleanup_token_pairs`.
Positive proof target: mixed existing/missing/repeated and empty lists produce exact final mapping, size, and event partitions.
Negative proof target: non-admin cannot delete; absent IDs cannot underflow size or remove other records.

### I-08
ID: I-08
Invariant: A trade batch must be non-empty and every referenced pair must exist at validation time.
Applies to: `initiate_trade`.
Positive proof target: one and multiple existing pairs proceed.
Negative proof target: empty list and missing ID fail with exact errors and no effects; missing late row rolls back earlier rows.

### I-09
ID: I-09
Invariant: Each trade is bound to the current pair's two contract addresses, two token IDs, burn amount, and redeem amount; all six must match exactly.
Applies to: `initiate_trade`.
Positive proof target: exact current record succeeds.
Negative proof target: alter each field independently, including `redeem_amount`, and assert `Error: Invalid token parameters.` plus no transfers/events.

### I-10
ID: I-10
Invariant: `sp.sender` equals every trade's `user_wallet`; one sender cannot submit for another wallet or mix wallets in a batch.
Applies to: `initiate_trade`.
Positive proof target: all rows bind to sender.
Negative proof target: a first or late mismatched wallet fails exactly and rolls back the batch.

### I-11
ID: I-11
Invariant: For each successful trade, the burn request is exactly from `user_wallet` to immutable `burn_address` for configured burn FA2, token ID, and amount.
Applies to: `initiate_trade` burn leg.
Positive proof target: instrumented FA2 and balances prove exact request/effect.
Negative proof target: insufficient balance or authorization fails with no redeem or durable event.

### I-12
ID: I-12
Invariant: For each successful trade, the redeem request is exactly from escrow to the same user for configured redeem FA2, token ID, and amount.
Applies to: `initiate_trade` redeem leg.
Positive proof target: instrumented FA2 and balances prove exact request/effect, especially non-unit `redeem_amount`.
Negative proof target: insufficient escrow inventory fails and rolls back burn, events, and all other batch legs.

### I-13
ID: I-13
Invariant: Contract routing and token-ID routing never cross between pairs or legs, including batches containing multiple FA2 addresses and token IDs.
Applies to: `initiate_trade`; `admin_transfer_token`.
Positive proof target: heterogeneous batch and admin recovery affect only designated contracts/IDs.
Negative proof target: decoy contracts/IDs retain unchanged balances; mismatched submitted routes fail trade binding.

### I-14
ID: I-14
Invariant: With a conforming FA2, the escrow must be authorized to transfer from the user and the user must hold the aggregate burn amount.
Applies to: burn FA2 operations.
Positive proof target: sufficient balance plus operator approval succeeds.
Negative proof target: missing/revoked operator approval and insufficient aggregate balance each fail atomically.

### I-15
ID: I-15
Invariant: With a conforming FA2, escrow must hold the aggregate redeem inventory; successful transfers reduce escrow and increase recipients by equal totals.
Applies to: redeem FA2 operations.
Positive proof target: exact sufficient inventory succeeds, including depletion to zero.
Negative proof target: one-unit-short and aggregate-short inventory fail atomically.

### I-16
ID: I-16
Invariant: In a successful batch, all trades are represented exactly once in burn and redeem transfer lists, grouped by their respective FA2 address, without loss or duplication.
Applies to: multi-trade `initiate_trade`.
Positive proof target: repeated same-contract and mixed-contract batches prove per-contract call count and aggregate contents.
Negative proof target: decoy transfer records are absent and failed validation generates no calls.

### I-17
ID: I-17
Invariant: Validation and external-operation failure anywhere in a batch leaves all escrow state, FA2 balances, tez balances, and events as before the call.
Applies to: batched add/trade; external operations generally.
Positive proof target: fully valid batches commit all effects.
Negative proof target: fail early, middle, late, burn execution, and redeem execution; assert full rollback.

### I-18
ID: I-18
Invariant: Repeated trades are allowed; no nonce or per-pair consumption state exists, so each successful sequential or repeated-in-batch trade applies the configured quantities again.
Applies to: `initiate_trade`.
Positive proof target: sequential and duplicate-pair batch trades produce additive exact balance changes/events.
Negative proof target: the first success grants no exemption from later balance, authorization, pause, or current-term checks.

### I-19
ID: I-19
Invariant: A quote based on an updated pair is accepted only with the new full terms; a quote for a deleted pair is rejected.
Applies to: update/cleanup followed by trade.
Positive proof target: fresh post-update terms succeed.
Negative proof target: old terms fail exact matching; deleted ID fails existence; no trade effects occur.

### I-20
ID: I-20
Invariant: Tokens sent to escrow remain under FA2 custody until a trade redeem or admin transfer; only admin can request arbitrary token recovery, for a positive amount and exact route.
Applies to: `admin_transfer_token`; redeem leg.
Positive proof target: deposits, trade payout, and admin withdrawal show exact custody deltas and event.
Negative proof target: non-admin/zero/insufficient/wrong-interface transfers fail without custody loss.

### I-21
ID: I-21
Invariant: Positive default tez receipts increase escrow balance; zero default receipt fails; only admin can withdraw a positive amount not exceeding current balance.
Applies to: `default`, `admin_withdraw_xtz`, and attached tez custody.
Positive proof target: receive then partial/full withdraw with exact balance/event assertions; account for tez attached to named entrypoints.
Negative proof target: zero receipt, zero withdrawal, over-withdrawal, and non-admin withdrawal fail exactly and preserve balances.

### I-22
ID: I-22
Invariant: Every successful event-bearing path emits the documented tag/payload; update emits only on change; list payloads follow actual push order; no failed transaction leaves events.
Applies to: all eight entrypoints.
Positive proof target: assert exact tag, typed fields, values, multiplicity, and ordering for each success/no-op case.
Negative proof target: assert event absence for failures and identical update; downstream FA2 failure rolls back prequeued trade/token events.

### I-23
ID: I-23
Invariant: Pair/token ID zero is valid; configured amounts zero are invalid; positive boundary `1` and large naturals retain exact arithmetic without truncation; tez obeys mutez/balance limits.
Applies to: configuration, trade, withdrawals.
Positive proof target: IDs zero, amounts one, exact-balance, and feasible large values succeed with exact state/balances.
Negative proof target: zero configured/transfer/withdraw amounts and one-unit-short balances fail as specified; no size underflow.

### I-24
ID: I-24
Invariant: The enforceable FA2 boundary is typed operation submission, not token semantics: a target exposing the expected type may accept while doing nothing or behaving non-standardly.
Applies to: trade and admin token transfer.
Positive proof target: conforming instrumented FA2 proves intended economics.
Negative proof target: accepting no-op FA2 demonstrates that escrow may succeed/event without real balance movement; document this as a trust boundary, not an escrow assertion failure.

### I-25
ID: I-25
Invariant: Every generated FA2 call targets `transfer` with the exact declared type and zero tez; a missing/wrong interface or rejecting target prevents any durable call effects.
Applies to: trade and admin token transfer.
Positive proof target: instrumented FA2 records correctly typed zero-tez calls.
Negative proof target: wrong/missing interface and deliberate FA2 failure roll back escrow state/events and other operations.

### I-26
ID: I-26
Invariant: Trading never mutates pause/admin/burn address/pair records/size; it changes only external balances and emits events.
Applies to: successful and failed `initiate_trade`.
Positive proof target: snapshot all storage before/after successful single and batch trades and prove equality.
Negative proof target: failed trades likewise preserve storage and all external state.
