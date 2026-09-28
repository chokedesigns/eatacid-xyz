# BurnRedeemEscrow operational model

Evidence baseline: commit `9d7262795bdb89d86c6cffb86f3131f6abfd1714`; authoritative source SHA-256 `1D2746687A9962E2B991F7AE6B5FC59181B49262718EA26220504BCE5580B98B`.

## Storage

| Field | Type | Initial value | Meaning |
|---|---|---|---|
| `admin` | address | constructor argument | Immutable privileged identity; there is no administrator-transition entrypoint. |
| `burn_address` | address | constructor argument | Immutable sink receiving all configured burn transfers. |
| `paused` | bool | `True` | Gates `initiate_trade` only. |
| `token_mapping` | big_map nat → pair record | empty | Pair ID to `{burn_contract_address, burn_token_id, burn_amount, redeem_contract_address, redeem_token_id, redeem_amount}`. |
| `token_mapping_size` | nat | `0` | Explicit count maintained by add/delete operations. |

Compiled storage layout is `(pair (pair admin burn_address) (pair paused (pair token_mapping token_mapping_size)))`. No trade counters, user balances, nonces, reservations, or accrued-fee fields exist.

## Entrypoints

### `toggle_pause`

- Caller requirements: `sender == admin`.
- Inputs: unit.
- Reads: `admin`, `paused`.
- Writes: negates `paused`.
- External operations: `PauseStateToggled {paused}` event.
- Failure conditions: unauthorized sender.
- Economic/control effect: enables or disables new trade calls; it does not gate any admin entrypoint or `default`.

### `admin_withdraw_xtz`

- Caller requirements: `sender == admin`.
- Inputs: logical record `{amount: mutez}`; compiled entrypoint payload is `mutez` because the single field is flattened.
- Reads: `admin`, current balance.
- Writes: no contract storage.
- External operations: sends `amount` to `admin`; emits `XTZWithdrawn {amount, success=True}`.
- Failure conditions: unauthorized; zero amount; amount exceeds balance; recipient/default failure when the emitted transfer executes.
- Economic/control effect: administrator can withdraw any tez held by the contract, including tez received through non-default entrypoints.

### `admin_transfer_token`

- Caller requirements: `sender == admin`.
- Inputs: `{token_contract: address, token_id: nat, to_: address, amount: nat}`.
- Reads: `admin`.
- Writes: no contract storage.
- External operations: zero-tez call to `token_contract%transfer` with `from_=self`; emits `TokenTransferred`.
- Failure conditions: unauthorized; zero amount; missing/incompatible `transfer`; downstream token rejection/failure.
- Economic/control effect: administrator has unrestricted rescue/custody authority over any transferable FA2 asset owned by the escrow.

### `initiate_trade`

- Caller requirements: contract unpaused; nonempty trade list; for every element, `sender == user_wallet`.
- Inputs per trade: `{token_pair_id, user_wallet, burn_contract_address, burn_token_id, burn_amount, redeem_contract_address, redeem_token_id}`. There is no caller-supplied `redeem_amount` or minimum-output field.
- Reads: `paused`, `burn_address`, and the configured pair for each ID.
- Writes: no contract storage.
- Validation: pair exists; caller-supplied burn contract/ID/amount and redeem contract/ID equal storage; sender equals every `user_wallet`.
- External operations: groups burn transfers by burn FA2 and redeem transfers by redeem FA2; burn calls transfer configured amounts from user to `burn_address`; redeem calls transfer configured amounts from escrow to user; emits one `TradeInitiated` event per item.
- Failure conditions: paused; empty list; missing pair; any checked field mismatch; sender mismatch; missing/incompatible FA2 transfer entrypoint; any downstream FA2 failure; gas/operation limits.
- Economic/control effect: exchanges the pair’s fixed burn quantity for the pair’s storage-current redeem quantity. Multiple list items repeat the exchange, including repeated IDs.
- Atomicity: Tezos operation failure backtracks the originating call and its internal operations. Audit tests confirmed a late redeem failure leaves earlier burn effects unchanged.

The escrow is the FA2 caller for both legs. For a compliant burn FA2, the user must have made the escrow an operator for the applicable token ID (unless that FA2 implements some other valid authority rule). Approval is not created or checked locally.

### `set_token_pairs`

- Caller requirements: `sender == admin`.
- Inputs: list of complete pair records including `token_pair_id` and `redeem_amount`.
- Reads: `admin`, mapping membership.
- Writes: inserts each pair and increments `token_mapping_size`.
- External operations: one `TokenPairAdded {added_pairs}` event, including for an empty list.
- Failure conditions: duplicate ID against storage or an earlier element in the same call; zero burn/redeem amount; equal burn and redeem contract addresses. Any failure backtracks all inserts in the call.
- Economic/control effect: creates executable exchange terms. Identical economic relationships under different IDs are allowed.

### `update_token_pair`

- Caller requirements: `sender == admin`; amount/address validation is evaluated before this authorization check.
- Inputs: pair ID plus all six pair fields.
- Reads: mapping membership/current record and `admin`.
- Writes: replaces changed fields for an existing ID; size is unchanged.
- External operations: `TokenPairUpdated {token_pair_id, updated_fields}` only when at least one field changes.
- Failure conditions: zero burn/redeem amount; equal contract addresses; unauthorized; missing ID.
- Economic/control effect: reprices or redirects future pair execution. A redeem-amount-only update also affects already signed/pending trades because that field is absent from `initiate_trade` parameters.

### `cleanup_token_pairs`

- Caller requirements: `sender == admin`.
- Inputs: list of pair IDs.
- Reads: mapping membership, size.
- Writes: deletes each ID that exists at its turn in the loop; decrements size once per actual deletion.
- External operations: `TokenPairDeleted {successful_deletions, failed_deletions}`.
- Failure conditions: unauthorized. Empty, nonexistent, and duplicate IDs are accepted; nonexistent occurrences are reported as failed deletions.
- Economic/control effect: disables deleted pair IDs. A pending trade referencing a deleted ID fails.

### `default`

- Caller requirements: any caller.
- Inputs: unit and attached tez.
- Reads: `amount`.
- Writes: no storage.
- External operations: `XTZReceived {amount}` event.
- Failure conditions: attached amount is zero.
- Economic/control effect: receives positive tez into administrator-withdrawable custody.

## Cross-cutting boundaries and edge behavior

- All entrypoints are payable at Michelson level. Only `default` requires positive tez; the other six do not reject attached tez.
- Pause enforcement is deliberately narrow: only `initiate_trade` checks `paused`.
- Pair quantities are positive nats. Michelson nats do not overflow; practical limits are gas, serialization, balances, and downstream FA2 behavior.
- Pair identity includes contract address and token ID on both legs. The caller binds all configured fields except `redeem_amount`.
- No local balance precheck exists. FA2 contracts decide authorization, balance sufficiency, token existence, and transfer semantics.
- External contract calls are zero-tez. Missing transfer entrypoints fail before operation construction; downstream transfer failures backtrack the call.
- The contract cannot distinguish a compliant FA2 from a transfer-compatible contract that lies, no-ops, burns differently, or has nonstandard authorization.
- A trade is repeatable; there is no replay flag. Tezos manager counters prevent literal replay of an implicit-account operation, while intentional repeated calls remain valid.

