# Threat and trust model

## Attacker models

| Actor | Reachable capability and result |
|---|---|
| Arbitrary caller | Can fund `default`, attach tez to other successful public calls, and submit trades only as itself. Cannot mutate admin state or withdraw custody. Missing/mismatched pairs and paused trades fail. |
| Malicious legitimate holder | Can intentionally repeat valid exchanges, batch repeated IDs, choose ordering, and consume available inventory at configured terms. This is allowed behavior; no per-user quota exists. Cannot nominate another wallet because sender binding is per item. |
| Caller with escrow FA2 operator approval | Approval alone is insufficient to steal from the owner: the contract additionally requires `sender == user_wallet`. The operator grant exposes the owner to the escrow’s configured trade logic and compromised-admin repricing of a pending call. |
| Hostile/non-standard FA2 | A configured transfer-compatible burn contract can acknowledge without moving assets, allowing redemption. A redeem contract can reject or behave nonstandardly. This is a configuration/FA2 trust dependency; Tezos atomicity contains failures but not successful lies. |
| Transaction-ordering adversary | Cannot alter signed parameters. Can order an existing admin pair update before a pending user trade. Caller-bound field changes cause failure, but a redeem-amount-only change does not, enabling BR-01. Can otherwise cause expected availability changes through pause/delete/inventory races, not unauthorized execution. |
| Compromised administrator | Can pause/unpause, replace pair terms, delete/add pairs, withdraw all tez, and rescue all escrow-held FA2 inventory. Those are explicit powers. Beyond normal prospective configuration, BR-01 lets the key silently alter the output of a user’s already signed/pending trade. The admin cannot directly initiate a trade from an unrelated user wallet. |

## Explicit trust assumptions

- Administrator: trusted for custody, pair correctness, pause control, and operational timing; the key is permanent in this contract.
- Configured token contracts: trusted to implement the expected FA2-compatible `transfer` behavior rather than merely matching its Michelson type.
- FA2 authority: users must grant the escrow suitable token-specific operator authority where the burn FA2 requires it; revocation/approval sequencing is off-contract.
- Burn address: trusted to be an intended irreversible or organizational sink. The contract only transfers to an address; it does not prove key destruction or unspendability.
- Pair configuration: token identities and ratios are administrator-supplied. The contract validates positivity, distinct contract addresses, and unique IDs—not economic fairness, supply, inventory, interface behavior, or duplicate relationships.
- Off-chain callers/UI: trusted to display the current pair and construct the exact on-chain fields, but cannot bind redeem amount because the entrypoint schema omits it.
- Chain semantics: relies on Tezos sender semantics, manager counters, ordered execution, and backtracking of internal operations on failure.

Intended centralization—inventory rescue, tez withdrawal, pause, and pair administration—is recorded as trust, not labeled a vulnerability. BR-01 is distinct because it affects terms already authorized by a user without invalidating the signed payload.
