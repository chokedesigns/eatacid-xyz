# BurnRedeemEscrow semantic model

Scope: the `BurnRedeemEscrow` class in the current canonical SmartPy source. `MockFA2` is a legacy test helper, not part of the escrow semantic model. The compilation target instantiates the escrow with admin `tz1hcAYJhEB9n6ezLFcbuejzZ821zrL1c3vW` and burn address `tz1dpaqpwKqPSft4SFvd5tA9bx7iDUNHnVsz`.

## Storage and construction

| Field | Type | Initial value | Mutation |
|---|---|---|---|
| `paused` | `bool` | `True` | toggled only by `toggle_pause` |
| `admin` | `address` | constructor argument | none; immutable |
| `burn_address` | `address` | constructor argument | none; immutable |
| `token_mapping` | `big_map nat TokenPair` | empty | add/update/delete entrypoints |
| `token_mapping_size` | `nat` | `0` | increment on add; decrement on successful delete |

`TokenPair` contains `burn_token_id:nat`, `redeem_token_id:nat`, `burn_amount:nat`, `redeem_amount:nat`, `burn_contract_address:address`, and `redeem_contract_address:address`. Token and tez balances are held by the chain/FA2 contracts, not mirrored in escrow storage.

## Entrypoints

### `toggle_pause`

Entrypoint: `toggle_pause`
Authorized caller: `admin` only.
Inputs: unit.
Reads: `admin`, `paused`.
Writes: flips `paused`.
External operations: none; emits `PauseStateToggled {paused}`.
Success effect: paused state is exactly negated.
Failure conditions: non-admin -> `Error: Unauthorized.`

### `admin_withdraw_xtz`

Entrypoint: `admin_withdraw_xtz`
Authorized caller: `admin` only.
Inputs: `{amount: mutez}`.
Reads: `admin`, contract tez balance.
Writes: no storage fields.
External operations: sends `amount` tez to `admin`; emits `XTZWithdrawn {amount, success=True}`.
Success effect: the requested positive amount leaves escrow custody for the immutable admin.
Failure conditions: non-admin -> `Error: Unauthorized.`; zero amount -> `Error: Amount must be greater than zero.`; amount above balance -> `Insufficient contract balance.`; downstream send failure rolls back.

### `admin_transfer_token`

Entrypoint: `admin_transfer_token`
Authorized caller: `admin` only.
Inputs: `{token_contract:address, token_id:nat, to_:address, amount:nat}`.
Reads: `admin`, `self_address`.
Writes: no storage fields.
External operations: one zero-tez FA2 `transfer`, from escrow to `to_`, for the exact token ID and amount; emits `TokenTransferred` with those fields.
Success effect: a conforming FA2 moves the requested escrow-held tokens.
Failure conditions: non-admin; zero amount; absent/wrongly typed `transfer` entrypoint; or any FA2 rejection (including insufficient inventory). All effects roll back.

### `initiate_trade`

Entrypoint: `initiate_trade`
Authorized caller: any sender while unpaused, but `sp.sender` must equal `user_wallet` in every trade in the batch.
Inputs: non-empty `trades`; each trade supplies pair ID, user wallet, both FA2 addresses, both token IDs, burn amount, and redeem amount.
Reads: `paused`, `burn_address`, `token_mapping`, `self_address`.
Writes: no storage fields.
External operations: groups burn transfers by burn FA2 and redeem transfers by redeem FA2; each operation carries zero tez. For each trade, burn is from the user to immutable `burn_address`, and redeem is from escrow to the user. Emits one `TradeInitiated {user, token_pair_id, burn_amount, redeem_amount}` per trade.
Success effect: under conforming FA2 semantics, each exact configured burn amount is moved to the burn address and each exact configured redeem amount is moved from escrow to the same sender.
Failure conditions: paused -> `Error: Contract is paused.`; empty list -> `EMPTY_TRADE_LIST`; absent pair -> `Error: Token pair not found.`; any one of the six supplied token terms differs from current storage -> `Error: Invalid token parameters.`; any `user_wallet` differs from sender -> `Error: Sender does not match user wallet.`; invalid FA2 interface or any FA2 rejection. The whole batch is atomic.

### `set_token_pairs`

Entrypoint: `set_token_pairs`
Authorized caller: `admin` only.
Inputs: `{token_pairs:list}` with full pair records and IDs.
Reads: `admin`, `token_mapping`, `token_mapping_size`.
Writes: inserts each new record and increments size once per insertion.
External operations: none; emits one `TokenPairAdded {added_pairs}` event, including for an empty list.
Success effect: all supplied unique, valid, previously absent pairs are added.
Failure conditions: non-admin -> `Error: Unauthorized.`; existing or in-batch duplicate ID -> `DUPLICATE_TOKEN_PAIR_ID`; zero burn -> `INVALID_BURN_AMOUNT`; zero redeem -> `INVALID_REDEEM_AMOUNT`; equal burn/redeem contract addresses -> `BURN_REDEEM_CONTRACT_MISMATCH`. Any failure rolls back all additions.

### `update_token_pair`

Entrypoint: `update_token_pair`
Authorized caller: `admin` only. Parameter-validity checks precede the authorization check.
Inputs: one pair ID plus all six replacement fields.
Reads: `admin`, selected mapping entry.
Writes: replaces changed fields in that entry; size is unchanged.
External operations: none; emits `TokenPairUpdated {token_pair_id, updated_fields}` only when at least one field changes.
Success effect: an existing pair becomes exactly the supplied valid record; an identical record is a successful no-op without an event.
Failure conditions: zero burn -> `Error: Invalid burn amount.`; zero redeem -> `Error: Invalid redeem amount.`; equal FA2 addresses -> `Error: Burn and Redeem contract addresses cannot be the same.`; non-admin -> `Error: Unauthorized.` after valid parameters; missing pair -> `Error: Token pair not found.`

### `cleanup_token_pairs`

Entrypoint: `cleanup_token_pairs`
Authorized caller: `admin` only.
Inputs: `{token_pair_ids:list nat}`.
Reads: `admin`, mapping membership, size.
Writes: deletes each ID that exists and decrements size once; missing IDs are not failures.
External operations: none; emits `TokenPairDeleted {successful_deletions, failed_deletions}`, including for an empty list.
Success effect: all IDs found at their turn are deleted; absent and repeated-after-delete IDs are reported as failed deletions.
Failure conditions: non-admin -> `Error: Unauthorized.` Atomic rollback applies to unexpected execution failure.

### `default`

Entrypoint: `default`
Authorized caller: any sender.
Inputs: unit plus transferred tez.
Reads: `sp.amount`.
Writes: no storage fields; positive tez remains in contract balance.
External operations: emits `XTZReceived {amount}`.
Success effect: accepts and records a positive tez receipt.
Failure conditions: zero tez -> `Error: No XTZ sent. Only XTZ transfers are accepted by this entrypoint.`

## Cross-entrypoint semantics and boundaries

- Pause gates only `initiate_trade`; configuration, withdrawals, token recovery, pause toggling, and positive default tez receipts remain callable subject to their own checks.
- Pair IDs and token IDs may be zero. Configured amounts must be positive. Michelson naturals are unbounded; practical large-value limits are gas/storage/balance limits.
- `token_mapping_size` is cardinality, not a next-ID counter. IDs can be deleted and reused.
- `list.push` makes the ID/field lists in add, update, and delete events reverse encounter order within each accumulated list. Trade events are emitted once per input iteration. No event is durable if the transaction later fails.
- Burns are queued before redeems, grouped by FA2 address. Map iteration ordering is not part of the public contract. Correctness must not rely on inter-contract operation order because the transaction is atomic.
- A batch can repeat a pair or mix pairs/contracts, but all rows must name the same sender as `user_wallet`. Required balances/authorizations are aggregate across the batch.
- Updating or deleting a pair makes an earlier client quote stale: the old full record fails exact matching, or the removed ID fails existence.
- No entrypoint explicitly rejects attached tez except `default` requires a positive amount. Any accepted attached tez joins escrow custody and is recoverable only through `admin_withdraw_xtz`.
- The escrow checks only that an address exposes the expected FA2 `transfer` type. It does not query balances or prove FA2 conformance; a target that accepts but ignores or misexecutes transfers is outside the escrow's enforceable guarantee.
- Tezos atomicity covers escrow storage, events, tez transfers, and all generated FA2 operations: any failing operation reverts the complete call.
