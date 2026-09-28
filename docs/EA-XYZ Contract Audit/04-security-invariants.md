# Contract-specific security invariants

| ID | Precise invariant |
|---|---|
| I-01 | Only the stored admin can toggle pause, withdraw tez, transfer escrow-held FA2 tokens, or add/update/delete pair mappings. Failed unauthorized calls leave storage/assets unchanged. |
| I-02 | When paused, every `initiate_trade` call fails before emitting executable FA2 transfers; pause does not imply admin/default lockout. |
| I-03 | A successful trade item can use only an existing pair and must bind the caller to `user_wallet` and the configured burn contract, burn token ID, burn amount, redeem contract, and redeem token ID. |
| I-04 | The redeem quantity delivered by a successful trade must match the economic output authorized by the user when signing; an intervening pair mutation must not silently reduce that output. |
| I-05 | For compliant configured FA2s, each successful item moves exactly the configured burn amount from the user to the immutable burn address and exactly the configured redeem amount from escrow to that user. |
| I-06 | Failure of any validation or internal FA2 operation in a multi-item trade leaves every burn/redeem asset effect and contract storage effect backtracked. |
| I-07 | Pair IDs are unique within the mapping; adds cannot overwrite; updates cannot create; cleanup removes only present IDs; `token_mapping_size` equals mapping cardinality for all source-reachable states. |
| I-08 | Every stored pair has strictly positive burn/redeem amounts and different burn/redeem contract addresses. Token contract plus token ID identifies each asset. |
| I-09 | A deleted pair cannot execute; changing any caller-bound field of a pending trade makes it fail rather than execute under different asset identity or burn quantity. |
| I-10 | A caller cannot trade another wallet’s assets merely by supplying that address, even when the escrow has FA2 operator permission from that wallet. |
| I-11 | Repeated calls and repeated items consume/redeem once per successful item; literal manager-operation replay is outside contract storage and governed by Tezos counters. |
| I-12 | Zero trade lists fail; configured zero quantities cannot be introduced; large naturals do not wrap. |
| I-13 | Tez leaves contract custody only through an admin-authorized withdrawal of a positive amount not exceeding current balance. |
| I-14 | Escrow-held FA2 tokens leave through trades or the explicit admin rescue power; no public caller can invoke rescue from contract custody. |
| I-15 | Security of burn and redeem effects depends on each configured token contract faithfully implementing the accepted transfer interface and authority/balance semantics. |
| I-16 | Admin identity and burn address remain constant because no transition entrypoint exists. |

Assessment result: I-04 is violated by confirmed finding BR-01. I-01–I-03 and I-05–I-16 held under the stated trust assumptions and source-reachable state model.

