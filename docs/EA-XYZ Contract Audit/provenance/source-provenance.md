# BurnRedeemEscrow source provenance

Recorded from repository commit `1b87c5fba38afab6fd69019ffca5fdb7bf080834` on branch `audit/burn-redeem-correctness-suite`.

| Role | Repository-relative path | SHA-256 |
|---|---|---|
| Canonical SmartPy | `contracts/burn-redeem-escrow/smartpy/burn-redeem-escrow-smartpy.py` | `0BC3B735377B92F1E5635ED7789B7693018DECA2256FA79DEEBD952279FC8BD9` |
| Legacy snapshot | `docs/EA-XYZ Contract Audit/source/legacy/burn-redeem-escrow-with-legacy-tests.py` | `0BC3B735377B92F1E5635ED7789B7693018DECA2256FA79DEEBD952279FC8BD9` |
| Stripped audit fixture | `docs/EA-XYZ Contract Audit/source/burn-redeem-escrow-audit.py` | `68E5F2931FE40BD4B3779098E8607C4E67877C83C0AA97B8C5E32BABED5CC50B` |
| Canonical Michelson | `contracts/burn-redeem-escrow/artifacts/checks/burn-redeem-escrow-michelson.tz` | `D74F3ED4A0A6FB7DA410E3136A10C3F7B893AD501343257CDD2E55C915A735A2` |

## Relationship and equivalence rule

- The legacy snapshot is a byte-for-byte copy of the canonical SmartPy file; equal SHA-256 hashes prove snapshot identity.
- The audit fixture is mechanically derived from that same file. It preserves every byte before the legacy test-suite banner, removes the `@sp.add_test` simulation/test definition and body, and preserves the existing `sp.add_compilation_target` call, target name, constructor, addresses, and comments. The retained target block is dedented from the removed test function to valid top-level syntax.
- Mechanical regeneration and comparison produced the recorded audit-fixture hash; searches confirm the fixture has no legacy test banner, `@sp.add_test`, or `def test`, and has exactly one unchanged compilation-target call.
- Therefore the only substantive difference between canonical/legacy source and the audit fixture is removal of the embedded legacy test block. No contract class logic, helper/test-token class, storage, type, constant, event, implementation comment, or compilation-target content differs.

Until a deliberate audited contract change is approved, `source/burn-redeem-escrow-audit.py` may differ from the matching canonical/legacy snapshot only by that mechanical legacy-test removal and the necessary dedent of the unchanged compilation target. It is an audit fixture, not an independently maintained implementation.
