# Phase 10 - Audited Artifact Promotion Record

Repository: EA-XYZ / eatacid-xyz, outer repository only.
Promotion date: 2026-10-08 (America/Chicago).
Branch: `audit/contract-freeze-candidate-261008`.
Starting working tree: clean, including untracked files.

## Frozen provenance chain

| Identity | Commit |
|---|---|
| Phase-7-certified candidate | `3d2d7651651ad46b475e7ee39c88abffe8d15c0c` |
| Phase-8 freeze | `a183e949906cdb2f2300457048ab55589db8b5db` |
| Phase-9 public provenance | `bb1691c7e81afa58d3900df625e9b726df6d235b` |
| Phase-10 starting HEAD / required promotion parent | `bb1691c7e81afa58d3900df625e9b726df6d235b` |

The dedicated promotion commit is the unique creation commit of this record,
with the sole parent above and message `audit: promote frozen contract artifacts`.
Resolve its literal SHA with:

```powershell
git log --diff-filter=A --format=%H -- 'docs/EA-XYZ Contract Audit/release/PHASE-10-PROMOTION-RECORD.md'
```

The post-commit Phase-10 report records that SHA and verification results. This
creation-commit reference avoids embedding the commit's own SHA in its contents.

## SmartPy - ALREADY PROMOTED

Certified source and production path:
`contracts/burn-redeem-escrow/smartpy/burn-redeem-escrow-smartpy.py`.

- Certified/current checkout SHA-256: `0BC3B735377B92F1E5635ED7789B7693018DECA2256FA79DEEBD952279FC8BD9`.
- Certified/current Git-blob SHA-256: `E5427B26C472517D7555C1A431FF190C7F4E420996E46E96D6901CC69B84C422`.
- No source rewrite, copy, test change, or constructor change.

## Michelson promotion

- Frozen source: `docs/EA-XYZ Contract Audit/artifacts/burn-redeem-escrow-audited.tz`.
- Frozen committed/build LF SHA-256: `FE850EA74A082D8E57EE47D0E3D70339088D1490128D93A86BDDDB338947F0A9`.
- Untouched frozen Windows CRLF checkout SHA-256: `1CC23C16256BF6A237E9E6F5BFFBFDD3AA2822ACE3A0ED987C23FB517DE32FFC`.
- Deployment target: `contracts/burn-redeem-escrow/artifacts/burn-redeem-escrow-audited.tz`.
- Promoted target committed/build and LF checkout SHA-256: `FE850EA74A082D8E57EE47D0E3D70339088D1490128D93A86BDDDB338947F0A9`.
- Exact identity: copied all 406725 bytes directly from the frozen Git blob using binary subprocess output and a binary file write; no compilation or text transformation.

The manifest designates `artifacts/checks/` as historical evidence, and the
contract workspace reserves `artifacts/deployment-notes/` for deployment notes.
No active deployment Michelson path existed. The promoted file uses the existing
contract `artifacts/` directory, with a short note identifying its deployment role.
A narrowly scoped `text eol=lf` attribute preserves the promoted LF bytes on
checkout; it does not change the frozen source or historical artifact attributes.

## Historical artifact preservation

Preserved unchanged:
`contracts/burn-redeem-escrow/artifacts/checks/burn-redeem-escrow-michelson.tz`.

- Checkout SHA-256: `D74F3ED4A0A6FB7DA410E3136A10C3F7B893AD501343257CDD2E55C915A735A2`.
- Committed LF SHA-256: `5020738310D71B57C417DFA2602890B8190CC99AA1EBA034D0E5A58C1322F7F1`.

## Frozen integrity and exact change boundary

Frozen Phase 0-9 input changed: **No**. Before promotion, all 31 candidate/evidence
rows and all three archive identities matched the Phase-8 manifest. The manifest
and freeze record matched their Phase-8 blobs; the Phase-9 README matched its
Phase-9 blob. All 39 pre-existing tracked files under the contract/audit workspace
retain their exact checkout bytes. The certified contract README is preserved.

Only these four additions belong to the promotion commit:

| File | Purpose |
|---|---|
| `contracts/burn-redeem-escrow/artifacts/burn-redeem-escrow-audited.tz` | Exact frozen deployment Michelson |
| `contracts/burn-redeem-escrow/artifacts/.gitattributes` | Preserve that artifact's LF checkout identity |
| `contracts/burn-redeem-escrow/artifacts/deployment-notes/audited-release.md` | Distinguish the audited deployment release from historical/check evidence |
| `docs/EA-XYZ Contract Audit/release/PHASE-10-PROMOTION-RECORD.md` | Phase-10 provenance |

Promotion is limited to repository artifact identity. No recompilation, new audit,
origination, chain-registry update, pair configuration, funding, enablement,
deployment smoke test, or Phase 11 work is performed.
