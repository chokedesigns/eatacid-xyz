# EA-XYZ Burn/Redeem Escrow — Audited Release

## Overview

This package identifies the exact EA-XYZ `BurnRedeemEscrow` audited release candidate, the audit/test system used to evaluate it, the verification results, and the hashes tying the tested candidate to the frozen release. The escrow exchanges user-held FA2 tokens sent to a configured burn address for tokens held in escrow, at administrator-configured terms.

**Pristine adversarial verification: PASS. Freeze status: FROZEN.**

> The exact candidate identified in this package satisfied the defined EA-XYZ contract-audit freeze gate and was frozen as the audited release candidate.

This claim applies within the documented threat model and limitations. The primary evidence is the [raw pristine certification](release/PHASE-7-PRISTINE-CERTIFICATION.md) and the [Phase-8 release manifest](release/RELEASE-CANDIDATE-MANIFEST.md). The [formal audit history](#formal-audit-history) is a secondary layer explaining predecessor findings and assurance hardening.

## Audited Release Candidate

| Identity | Exact value |
| --- | --- |
| Phase-7-certified candidate commit | `3d2d7651651ad46b475e7ee39c88abffe8d15c0c` |
| Phase-8 freeze commit | `a183e949906cdb2f2300457048ab55589db8b5db` |
| Freeze date | 2026-10-08 (America/Chicago) |
| Certification/freeze branch | `audit/contract-freeze-candidate-261008` |

The freeze commit is the sole-parent successor of the certified commit and adds only the five release/provenance files recorded in the [freeze record](release/PHASE-8-FREEZE-RECORD.md). This public README is subsequent documentation; it does not change the candidate.

The following SHA-256 values identify **exact committed LF bytes**. Paths are repository-relative.

| Artifact | Repository path | SHA-256 committed bytes |
| --- | --- | --- |
| Canonical SmartPy | `contracts/burn-redeem-escrow/smartpy/burn-redeem-escrow-smartpy.py` | `E5427B26C472517D7555C1A431FF190C7F4E420996E46E96D6901CC69B84C422` |
| Frozen audited Michelson; release-critical build | `docs/EA-XYZ Contract Audit/artifacts/burn-redeem-escrow-audited.tz` | `FE850EA74A082D8E57EE47D0E3D70339088D1490128D93A86BDDDB338947F0A9` |
| Historical canonical checked-in Michelson | `contracts/burn-redeem-escrow/artifacts/checks/burn-redeem-escrow-michelson.tz` | `5020738310D71B57C417DFA2602890B8190CC99AA1EBA034D0E5A58C1322F7F1` |

The [manifest](release/RELEASE-CANDIDATE-MANIFEST.md) is the authoritative full identity source, including the stripped compilation fixture, tests, coverage evidence, raw archives, and both checkout and committed hashes. Git converts some LF blobs to CRLF in Windows checkouts; different hashes for those exact byte representations are expected. They do not indicate a changed candidate. Release-critical Michelson identity is the committed/build LF hash above; the pristine review used exact committed LF inputs for native typechecking.

The canonical checked-in Michelson and frozen audited build have separate identities. The pristine review established 37 compiler-generated integer failure-payload differences and equivalence bounded to the documented source-reachable behavior of the fixed target. It also clarified the historical provenance narrative: canonical payloads contain `-1`, while frozen/generated payloads contain positive source locations. The raw evidence remains unchanged.

## What Was Verified

The defined freeze gate evaluated the candidate against documented contract semantics and 26 security/correctness invariants. A standalone correctness suite imported the mechanically stripped audit fixture, whose contract implementation and compilation target derive from canonical SmartPy. Conforming, rejecting, and accepting-no-op FA2 fixtures exercised normal economics, downstream failures, and the external-token trust boundary.

Independent verifiers checked event values, ordering, rollback, and exact compiled payload types, including `nat`/`int` distinctions. Invariant/coverage reconciliation inspected mapped assertions against an independently derived obligation denominator. Deterministic compilation tied the source fixture to the frozen Michelson; native Michelson typechecking used the pinned verifier context. A final pristine adversarial freeze-gate review independently challenged the complete candidate and evidence without mutating them.

## Final Results

These are the results preserved by the final [Phase-7 pristine certification](release/PHASE-7-PRISTINE-CERTIFICATION.md), subsequently frozen by Phase 8. Public packaging does not constitute another verification run.

| Verification area | Result |
| --- | --- |
| Standalone scenarios | 13/13 PASS |
| Event cases | 90 PASS |
| Entrypoints | 8/8 verified |
| Compiled event schemas | 8/8 exact types verified |
| Staged-event rollback cases | 11 verified |
| Security/correctness invariants | 26/26 covered |
| Audit obligations | 181/181 covered |
| Deterministic compilation | PASS; two byte-identical builds |
| Frozen audited Michelson reproduction | Exact committed/build byte match |
| Native Michelson typecheck | Both frozen and canonical committed artifacts: `Well typed` |
| Contract defects | 0 |
| Assurance gaps | 0 |
| Provenance / identity inconsistencies | 0 |
| Unresolved blocking findings | 0 |
| Final pristine verdict | PASS |
| Freeze status | FROZEN |

Coverage totals refer to the defined invariant and obligation set. They are not a measure of every possible execution state or a guarantee against future defects.

## Audit Scope

The audit covers the identified outer-repository contract candidate: construction and storage, all eight entrypoints, administrator and sender authorization, pause behavior, pair lifecycle, exact trade terms, custody and balances, FA2 operations, atomic failures, events, compilation, and artifact provenance. The final [semantic model](audit/semantic-model.md), [invariants](audit/security-invariants.md), and [coverage requirements](audit/test-coverage-requirements.md) define that scope. The nested `admin-ui` repository is outside this freeze.

The certified constructor target has administrator `tz1hcAYJhEB9n6ezLFcbuejzZ821zrL1c3vW`, burn address `tz1dpaqpwKqPSft4SFvd5tA9bx7iDUNHnVsz`, initial `paused=True`, an empty token mapping, and mapping size zero. This is candidate configuration evidence, not deployment verification.

## Threat Model and Trust Assumptions

The review challenged arbitrary callers, malicious holders, transaction ordering, compromised-administrator repricing, stale pair state, inventory/approval changes, and hostile external-token behavior. Trades bind every submitted wallet to the sender and all six submitted token terms to current pair state. Pause gates trades; the other entrypoints retain their documented authorization rules.

Economic transfer claims depend on honestly configured FA2 contracts, suitable user operator permissions, and available inventory. A type-compatible FA2 can accept a call without moving assets; typed acceptance and emitted events alone cannot prove the economics. The administrator permanently controls configuration, pause, tez withdrawal, and token recovery. The contract relies on Tezos sender semantics and atomic backtracking, while burn-address control and off-chain operator/configuration management remain trust assumptions.

## Known Limitations

All eight limitations retained by [manifest section F](release/RELEASE-CANDIDATE-MANIFEST.md#f-known-limitations) apply:

1. Configured FA2 contracts are trusted to honestly implement compatible authorization, balance, and transfer semantics.
2. Administrator custody, configuration, and pause powers are trusted and permanent.
3. Burn-address key control and unspendability are not enforced or proven by this contract.
4. Historical compiler provenance for canonical checked-in Michelson remains unknown; established canonical/frozen equivalence is bounded to the documented source-reachable behavior.
5. Native typechecking used the pinned default Alpha mockup context; its result is scoped to that context.
6. Deployed-contract identity and compatibility with a specific deployed protocol remain unverified until deployment verification.
7. SmartPy scenarios and logs are simulation evidence, not live-chain receipts.
8. The audit is not a formal proof, exhaustive state exploration, comprehensive fuzzing campaign, production-FA2 compatibility campaign, or exhaustive gas/resource analysis.

These boundaries qualify the release claim; the final pristine review retained them without unresolved blocking findings.

## Formal Audit History

The process was iterative: predecessor candidates and evidence were rejected or strengthened when findings warranted it. Historical reports retain their original status wording and describe those earlier states. Final certification applies only to the identified candidate after remediation and upstream reverification.

### BR-01 — Remediated

The formal baseline audit identified one substantive contract defect: **BR-01, confirmed security vulnerability, MEDIUM severity**, involving stale repricing and redemption-amount binding. The original trade schema did not bind the redemption amount. An administrator could reprice a pair between user authorization and execution, allowing the already-authorized trade to burn the expected input but return a reduced redemption amount.

The contract was remediated so execution binds and validates the submitted redemption amount, alongside the other token terms, against current pair state. A stale quote after redemption repricing now invalidates the trade. **Status: closed before final certification; absent from the frozen candidate.** See the [historical finding](06-findings.md), [current trade semantics](audit/semantic-model.md#initiate_trade), T06/T10 in the [standalone suite](tests/burn-redeem-correctness-suite.py), and the [pristine closure review](release/PHASE-7-PRISTINE-CERTIFICATION.md).

### Assurance hardening — Closed

The later [adversarial-development review](audit/final-adversarial-review.md) identified three assurance/test gaps, not new contract defects:

| Historical gap | Closure evidence |
| --- | --- |
| Failed-call rollback with nonzero attached tez | T09 attaches 7 mutez to a failing two-row trade and verifies unchanged tez, storage, token balances, call counts, and no durable event. |
| Explicit accepting-no-op FA2 batch coverage | T12 checks two repeated trade rows, exact requested transfers/events, and unchanged ledgers, demonstrating the configured-FA2 trust boundary. |
| Exact compiled event-payload types | The event verifier checks all eight compiled schemas; a deliberate `TradeInitiated.token_pair_id` `nat`→`int` challenge was rejected. |

**Status: all three closed before pristine Phase-7 certification.** The development review participated in hardening evidence; it is distinct from the subsequent pristine PASS.

Earlier [coverage reconciliation](audit/coverage-reconciliation.md) also strengthened T10 to directly test operator and balance failures after a successful trade. Legacy simulation weaknesses and predecessor reports remain available below as historical context. None of those earlier findings is presented as a current candidate defect or an unresolved assurance gap.

## Reproducing the Verification

Use the exact pinned toolchain and frozen procedures. The [Phase-6 build provenance](provenance/build-provenance.md) records compilation commands and source/build relationships; [pristine certification section C](release/PHASE-7-PRISTINE-CERTIFICATION.md) records the successful final executions; the [Phase-8 manifest](release/RELEASE-CANDIDATE-MANIFEST.md) supplies authoritative identities and toolchain qualifications.

| Tool/context | Frozen identity |
| --- | --- |
| SmartPy image | `morum/smartpy@sha256:445853de4f23a25b9e6b48cd0cb2f786319c5b44cc2219d207589880f7cf54ba` |
| SmartPy version | `0.17.4` image repository tag; not a newly observed binary version |
| Compiler | `/smartpy/smartpyc`, installation `/smartpy` |
| Octez image | `tezos/tezos-bare@sha256:ea2297e0ebd1e2181516d4a93501a927b219aa4e2a13812f95a8d28e852372d3` |
| Observed Octez version/revision | `25.2` / `f6062853` |
| Native context | `octez-client --mode mockup`; pinned image's default Alpha protocol |

These exact commands are excerpts from the successful pristine record. The SmartPy commands ran from the repository root inside the pinned image, with network disabled, a read-only repository mount, and ephemeral output:

```sh
/smartpy/smartpyc 'docs/EA-XYZ Contract Audit/tests/burn-redeem-correctness-suite.py' --kind test --output /tmp/p7-tests --install /smartpy --purge
python3 'docs/EA-XYZ Contract Audit/tests/verify-smartpy-output.py' /tmp/p7-tests
python3 'docs/EA-XYZ Contract Audit/tests/verify-invariant-coverage.py'
/smartpy/smartpyc 'docs/EA-XYZ Contract Audit/source/burn-redeem-escrow-audit.py' --kind compilation --output /tmp/p7-build-1 --install /smartpy --purge
/smartpy/smartpyc 'docs/EA-XYZ Contract Audit/source/burn-redeem-escrow-audit.py' --kind compilation --output /tmp/p7-build-2 --install /smartpy --purge
```

Native commands ran inside the pinned Octez image. Their temporary inputs were exact committed LF blobs of the frozen and canonical Michelson respectively, with hashes checked before typechecking:

```sh
octez-client --base-dir /tmp/p7-native --mode mockup create mockup
octez-client --base-dir /tmp/p7-native --mode mockup typecheck script /tmp/p7-frozen.tz
octez-client --base-dir /tmp/p7-native --mode mockup typecheck script /tmp/p7-canonical.tz
```

Direct native parsing of Windows CRLF checkout text failed on carriage returns in the pristine run; exact committed LF bytes passed. Preserve the distinction when reproducing the recorded checks. These excerpts depend on the recorded container/input setup; the linked provenance supplies the procedure rather than introducing a different verification system.

## Artifact Index

Every displayed path below is repository-relative. Links resolve from this README. Current `audit/` documents and the standalone suite are the final evidence layer; numbered reports and `evidence/` files are retained history. The full identity inventory is in the manifest.

### Candidate

| Role | Repository-relative path |
| --- | --- |
| Canonical SmartPy | [contracts/burn-redeem-escrow/smartpy/burn-redeem-escrow-smartpy.py](../../contracts/burn-redeem-escrow/smartpy/burn-redeem-escrow-smartpy.py) |
| Mechanically stripped audit fixture | [docs/EA-XYZ Contract Audit/source/burn-redeem-escrow-audit.py](source/burn-redeem-escrow-audit.py) |
| Frozen audited Michelson | [docs/EA-XYZ Contract Audit/artifacts/burn-redeem-escrow-audited.tz](artifacts/burn-redeem-escrow-audited.tz) |
| Historical canonical checked-in Michelson | [contracts/burn-redeem-escrow/artifacts/checks/burn-redeem-escrow-michelson.tz](../../contracts/burn-redeem-escrow/artifacts/checks/burn-redeem-escrow-michelson.tz) |
| Canonical source snapshot | [docs/EA-XYZ Contract Audit/source/legacy/burn-redeem-escrow-with-legacy-tests.py](source/legacy/burn-redeem-escrow-with-legacy-tests.py) |

### Test/evidence system

| Role | Repository-relative path |
| --- | --- |
| Standalone T01–T13 suite; embedded `ConformingFA2`, `RejectingFA2`, `AcceptingNoOpFA2` fixtures | [docs/EA-XYZ Contract Audit/tests/burn-redeem-correctness-suite.py](tests/burn-redeem-correctness-suite.py) |
| Event and exact compiled-schema verifier | [docs/EA-XYZ Contract Audit/tests/verify-smartpy-output.py](tests/verify-smartpy-output.py) |
| Invariant coverage verifier | [docs/EA-XYZ Contract Audit/tests/verify-invariant-coverage.py](tests/verify-invariant-coverage.py) |
| Final semantic model | [docs/EA-XYZ Contract Audit/audit/semantic-model.md](audit/semantic-model.md) |
| Final security/correctness invariants | [docs/EA-XYZ Contract Audit/audit/security-invariants.md](audit/security-invariants.md) |
| Test architecture | [docs/EA-XYZ Contract Audit/audit/test-architecture.md](audit/test-architecture.md) |
| Coverage requirements | [docs/EA-XYZ Contract Audit/audit/test-coverage-requirements.md](audit/test-coverage-requirements.md) |
| Invariant-to-test map | [docs/EA-XYZ Contract Audit/audit/invariant-test-map.md](audit/invariant-test-map.md) |
| Coverage manifest | [docs/EA-XYZ Contract Audit/tests/invariant-coverage.json](tests/invariant-coverage.json) |
| Reconciliation report | [docs/EA-XYZ Contract Audit/audit/coverage-reconciliation.md](audit/coverage-reconciliation.md) |
| Canonical contract specification/orientation | [contracts/burn-redeem-escrow/README.md](../../contracts/burn-redeem-escrow/README.md) |

### Provenance

| Role | Repository-relative path |
| --- | --- |
| Source and fixture derivation | [docs/EA-XYZ Contract Audit/provenance/source-provenance.md](provenance/source-provenance.md) |
| Phase-6 build provenance | [docs/EA-XYZ Contract Audit/provenance/build-provenance.md](provenance/build-provenance.md) |
| Raw pristine freeze-gate prompt | [docs/EA-XYZ Contract Audit/release/PHASE-7-PRISTINE-FREEZE-GATE-PROMPT.md](release/PHASE-7-PRISTINE-FREEZE-GATE-PROMPT.md) |
| Raw pristine certification | [docs/EA-XYZ Contract Audit/release/PHASE-7-PRISTINE-CERTIFICATION.md](release/PHASE-7-PRISTINE-CERTIFICATION.md) |
| Phase-8 release-candidate manifest | [docs/EA-XYZ Contract Audit/release/RELEASE-CANDIDATE-MANIFEST.md](release/RELEASE-CANDIDATE-MANIFEST.md) |
| Phase-8 freeze record | [docs/EA-XYZ Contract Audit/release/PHASE-8-FREEZE-RECORD.md](release/PHASE-8-FREEZE-RECORD.md) |

### Historical audit record

BR-01 remediation is evidenced by the fixed source, final trade semantics, T06/T10, and the pristine review linked above; the predecessor finding and reproduction remain unchanged here.

| Historical role | Repository-relative path |
| --- | --- |
| Baseline semantics | [docs/EA-XYZ Contract Audit/01-semantic-model.md](01-semantic-model.md) |
| Baseline SmartPy/Michelson correspondence | [docs/EA-XYZ Contract Audit/02-smartpy-michelson-correspondence.md](02-smartpy-michelson-correspondence.md) |
| Legacy simulation review | [docs/EA-XYZ Contract Audit/03-existing-sim-review.md](03-existing-sim-review.md) |
| Baseline invariants | [docs/EA-XYZ Contract Audit/04-security-invariants.md](04-security-invariants.md) |
| Baseline threat model | [docs/EA-XYZ Contract Audit/05-threat-model.md](05-threat-model.md) |
| BR-01 finding and baseline observations | [docs/EA-XYZ Contract Audit/06-findings.md](06-findings.md) |
| Baseline coverage matrix | [docs/EA-XYZ Contract Audit/07-test-coverage-matrix.md](07-test-coverage-matrix.md) |
| Baseline adversarial results | [docs/EA-XYZ Contract Audit/08-adversarial-test-results.md](08-adversarial-test-results.md) |
| Baseline final security report | [docs/EA-XYZ Contract Audit/09-final-security-report.md](09-final-security-report.md) |
| Baseline BR-01/hostile-FA2 reproduction suite | [docs/EA-XYZ Contract Audit/evidence/audit-only-tests/burn-redeem-adversarial.py](evidence/audit-only-tests/burn-redeem-adversarial.py) |
| Historical generated Michelson | [docs/EA-XYZ Contract Audit/evidence/generated-michelson.tz](evidence/generated-michelson.tz) |
| Historical normalized canonical Michelson | [docs/EA-XYZ Contract Audit/evidence/checked-in-michelson-normalized.tz](evidence/checked-in-michelson-normalized.tz) |
| Adversarial-development findings and assurance closures | [docs/EA-XYZ Contract Audit/audit/final-adversarial-review.md](audit/final-adversarial-review.md) |

## Deployment Status

Frozen-release certification is distinct from deployed-contract identity verification. This package establishes the audited release candidate and its evidence; deployed identity and specific deployed-protocol compatibility remain unverified. A later deployment must be independently checked against the exact frozen Michelson and expected initial storage/configuration before deployed identity can be claimed. Public packaging performs no contract promotion, origination, registry update, or deployment verification.
