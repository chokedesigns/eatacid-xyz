# Audit-only adversarial test results

Retained test: `evidence/audit-only-tests/burn-redeem-adversarial.py` (SHA-256 `04724DB5EB8C63EC054D6F6F809CA519A3856CC550CCA11E4DFFB8658B69E31C`).

Execution used the locked image/digest and completed with exit code 0. Importing the authoritative source also reran the embedded `BurnRedeemEscrow Test Suite`; all five scenarios completed:

- `Audit-only_operator_atomicity_and_validation`
- `Audit-only_pair_batch_and_tez_acceptance`
- `Audit-only_hostile_configured_FA2_trust_boundary`
- `Audit-only_pending_trade_redeem_repricing`
- imported `BurnRedeemEscrow_Test_Suite`

| Question | Result | Security implication |
|---|---|---|
| Does a production-like burn FA2 require escrow operator approval, and does missing approval preserve balances? | Missing approval failed with `FA2_NOT_OPERATOR`; user and escrow balances remained unchanged. After token-specific approval, exact burn/redeem balances changed. | Confirms operator dependency and failure atomicity; exposes embedded mock weakness, not a contract defect. |
| Can approved escrow authority be used by a different caller naming the owner wallet? | Failed with `ERROR_SENDER_MISMATCH`. | No operator-based wallet impersonation path. |
| Does a two-item batch partially burn when the second redeem cannot be funded? | Failed with `FA2_INSUFFICIENT_BALANCE`; user, sink, user redeem, and escrow redeem balances remained at pre-call values. | Confirms atomic containment of downstream insufficiency. |
| Is an empty batch rejected? | Failed with `EMPTY_TRADE_LIST`. | Confirms explicit boundary branch. |
| Is duplicate pair ID within one add call atomic? | Call failed with `DUPLICATE_TOKEN_PAIR_ID`; size remained zero and ID absent. | Confirms no partial pair insertion/cardinality drift. |
| Can a non-default entrypoint retain tez? | `toggle_pause` succeeded with 7 mutez; an immediate exact 7-mutez admin withdrawal succeeded. | Confirms DD-01. |
| Can a type-compatible configured burn contract lie successfully? | No-op transfer was called; user still received the escrow’s redeem token. | Confirms external-token honesty is a trust assumption (TA-02). |
| Can an admin change only redeem amount before an already constructed trade without invalidating it? | Pair changed from 2→5 to 2→1; unchanged trade payload succeeded, user burned 2 and received 1. | Confirms BR-01 with deterministic asset effects. |

The audit tests are evidence only. They do not modify or replace the embedded suite or authoritative contract.

