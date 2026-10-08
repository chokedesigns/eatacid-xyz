# Frozen audited deployment artifact

The deployment-facing EA-XYZ audited release is
[`../burn-redeem-escrow-audited.tz`](../burn-redeem-escrow-audited.tz).
Its exact committed/build and checkout SHA-256 is
`FE850EA74A082D8E57EE47D0E3D70339088D1490128D93A86BDDDB338947F0A9`.
The scoped artifact attribute preserves LF checkout bytes for native Michelson use.

Phase 10 copied the exact frozen committed artifact without recompilation from
[`docs/EA-XYZ Contract Audit/artifacts/burn-redeem-escrow-audited.tz`](../../../../docs/EA-XYZ%20Contract%20Audit/artifacts/burn-redeem-escrow-audited.tz).
For this frozen release, use that promoted artifact rather than compiling a replacement.
The canonical SmartPy already matches the certified source and was left unchanged.

[`../checks/burn-redeem-escrow-michelson.tz`](../checks/burn-redeem-escrow-michelson.tz)
is preserved historical/check evidence with a different byte identity, not this
audited deployment release. The frozen contract README retains its historical
manual-compilation workflow; this note identifies the exact promoted release.

See the [Phase-8 manifest](../../../../docs/EA-XYZ%20Contract%20Audit/release/RELEASE-CANDIDATE-MANIFEST.md)
and [Phase-10 promotion record](../../../../docs/EA-XYZ%20Contract%20Audit/release/PHASE-10-PROMOTION-RECORD.md)
for the frozen identities and promotion provenance. Promotion establishes repository
artifact identity only; origination and deployed-contract verification remain separate.
