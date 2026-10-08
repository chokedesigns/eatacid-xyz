```text
# Phase 7 — Pristine Adversarial Release-Candidate Verification

## A. Candidate Identity

Branch at start and completion: audit/contract-freeze-candidate-261008
HEAD at review start: 3d2d7651651ad46b475e7ee39c88abffe8d15c0c
Working tree at review start: clean
HEAD at review completion: 3d2d7651651ad46b475e7ee39c88abffe8d15c0c
Working tree at review completion: clean, including untracked files

Canonical audit workspace: docs/EA-XYZ Contract Audit/
Contract source: contracts/burn-redeem-escrow/smartpy/burn-redeem-escrow-smartpy.py
Frozen Michelson: docs/EA-XYZ Contract Audit/artifacts/burn-redeem-escrow-audited.tz

SHA-256 identities independently verified:

- Canonical SmartPy and identical legacy snapshot, recorded CRLF bytes:
  0BC3B735377B92F1E5635ED7789B7693018DECA2256FA79DEEBD952279FC8BD9
- Stripped audit fixture, recorded CRLF bytes:
  68E5F2931FE40BD4B3779098E8607C4E67877C83C0AA97B8C5E32BABED5CC50B
- Frozen committed LF Michelson and freshly generated Michelson:
  FE850EA74A082D8E57EE47D0E3D70339088D1490128D93A86BDDDB338947F0A9
- Frozen Michelson as checked out with Git CRLF conversion:
  1CC23C16256BF6A237E9E6F5BFFBFDD3AA2822ACE3A0ED987C23FB517DE32FFC
- Canonical checked-in Michelson, recorded CRLF bytes:
  D74F3ED4A0A6FB7DA410E3136A10C3F7B893AD501343257CDD2E55C915A735A2
- Canonical Michelson committed LF bytes:
  5020738310D71B57C417DFA2602890B8190CC99AA1EBA034D0E5A58C1322F7F1
- Current standalone correctness suite, CRLF checkout:
  1D9CEC43EF14490A99CAD7C33B70A5C7F91C3498F45A72367E9E339C5095F3D5

All 31 tracked files under the reviewed contract and audit directories match HEAD content. Their checkout-versus-commit byte differences consist solely of Git line-ending conversion. The frozen committed artifact exactly matches its recorded build hash.

Candidate identity is unambiguous. The branch and HEAD remained unchanged. No repository files, audit artifacts, or Git state were deliberately mutated. Verification output existed only in ephemeral containers; no report file was written.

## B. Evidence Reviewed

- Canonical fixed SmartPy, identical legacy snapshot, stripped audit fixture, constructor target, canonical Michelson, and frozen Michelson.
- Historical baseline reports 01–09, including BR-01, prior simulation weaknesses, threat assumptions, correspondence evidence, and limitations.
- Source provenance and mechanical fixture-derivation rules.
- Current semantic model and all 26 security/correctness invariants.
- Coverage requirements, invariant-to-test map, manifest, and reconciliation report.
- Complete standalone T01–T13 suite, its conforming, rejecting, and accepting-no-op FA2 fixtures, tez-admin proxy, and assertion helpers.
- Event/compiled-schema verifier and invariant-coverage verifier.
- Phase 6 build provenance, pinned compiler/verifier identities, reproducibility claims, and native-typecheck results.
- Historical adversarial-development report and its three assurance-gap closures.
- Relevant Git remediation/provenance history.

The current contract/audit directories have no changes after historical closure commit 9a7feaf832f83b556bef51b57ec4cda9cdd4b82b. That historical review was treated as development evidence, not as this certification.

## C. Independent Verification Performed

Repository checks:
- git rev-parse --show-toplevel
- git branch --show-current
- git rev-parse HEAD
- git status --short
- git status --porcelain=v1 --untracked-files=all
- git diff --check

Result: designated branch; unchanged HEAD; clean working tree; no diff errors.

Identity/provenance checks:
- SHA-256 verification and comparisons against exact HEAD blobs.
- Mechanical reconstruction of the stripped fixture: 705/705 lines match.
- Canonical source versus legacy snapshot: byte-identical.
- Recorded remediation/build/closure commits: ancestors of HEAD.
- Historical retained evidence: unchanged committed hashes.
- Independent UTF-8 parsing of the obligation table: 26 invariants and 181 marked cells, exactly matching the manifest.

Pinned SmartPy image:
morum/smartpy@sha256:445853de4f23a25b9e6b48cd0cb2f786319c5b44cc2219d207589880f7cf54ba

Executed inside network-disabled containers with read-only repository mounts:

/smartpy/smartpyc 'docs/EA-XYZ Contract Audit/tests/burn-redeem-correctness-suite.py' --kind test --output /tmp/p7-tests --install /smartpy --purge
python3 'docs/EA-XYZ Contract Audit/tests/verify-smartpy-output.py' /tmp/p7-tests
python3 'docs/EA-XYZ Contract Audit/tests/verify-invariant-coverage.py'

Result: all 13 scenarios passed; event verification passed 90 cases, eight entrypoints, eight exact event types, and 11 staged-event rollbacks; coverage verification passed 26/26 invariants and 181/181 obligations.

An in-memory TradeInitiated.token_pair_id nat→int challenge was rejected by the compiled-schema oracle.

Executed compilation twice per completed reproducibility check:

/smartpy/smartpyc 'docs/EA-XYZ Contract Audit/source/burn-redeem-escrow-audit.py' --kind compilation --output /tmp/p7-build-1 --install /smartpy --purge
/smartpy/smartpyc 'docs/EA-XYZ Contract Audit/source/burn-redeem-escrow-audit.py' --kind compilation --output /tmp/p7-build-2 --install /smartpy --purge

Result: byte-identical builds; exact frozen committed hash; expected initial storage and constructor addresses.

Pinned native verifier:
tezos/tezos-bare@sha256:ea2297e0ebd1e2181516d4a93501a927b219aa4e2a13812f95a8d28e852372d3
Observed version: Octez 25.2, revision f6062853.

Executed:
octez-client --base-dir /tmp/p7-native --mode mockup create mockup
octez-client --base-dir /tmp/p7-native --mode mockup typecheck script /tmp/p7-frozen.tz
octez-client --base-dir /tmp/p7-native --mode mockup typecheck script /tmp/p7-canonical.tz

Temporary inputs were exact HEAD blobs, with hashes verified before typechecking.

Result: default Alpha protocol; both artifacts “Well typed”; both reported 1039055.711 gas units remaining.

Execution qualifications:
- Initial Docker access required sandbox escalation.
- Initial PowerShell quoting/newline and local text-encoding errors affected review wrappers; corrected executions passed.
- Direct native parsing of the CRLF checkout failed on carriage returns. Exact committed LF bytes passed. No repository normalization occurred.
- An initial comparison assertion assumed the provenance text’s integer-location direction; independent inspection established the actual direction and the completed comparison passed.

## D. Adversarial Review

Contract semantics and authorization:
Reviewed every storage field and all eight entrypoints. Challenged admin-only operations, sender-versus-wallet binding, pause scope, validation precedence, pair validity/cardinality, immutable identities, custody powers, and attached tez. No unauthorized mutation or withdrawal path was established.

State interactions:
Reviewed repeated and heterogeneous trades, aggregate balances, operator revocation, inventory depletion, stale terms, pause changes, deletion/reuse, duplicate insertion, repeated cleanup, and no-op updates. The current six-field trade matching closes historical BR-01: changed redeem quantities invalidate the submitted terms.

Failure and atomicity:
Inspected exact negative-path preconditions, failure expectations, balances, call journals, and post-state assertions. Validation failures and downstream burn/redeem rejection are materially covered. T09 directly verifies rollback of seven attached mutez.

FA2 boundary:
Conforming fixtures enforce owner/operator authorization and sequential balance accounting. Rejecting fixtures exercise downstream failure. The two-row accepting-no-op case demonstrates that typed acceptance does not guarantee asset movement. Economic guarantees remain explicitly conditional on honest configured FA2 behavior.

Events:
Compared emitted tags, compiled types/layouts, payload values, multiplicity, accumulated-list ordering, update no-op absence, and failed/backtracked executions. The compiled-type oracle meaningfully distinguishes nat from int.

Coverage:
Independently reconciled the denominator and inspected mapped assertions against source behavior. Mapping-verifier success was not treated as proof of assertion quality. No material unsupported coverage claim or omitted security property was established under the stated model.

Compilation and provenance:
Fresh builds reproduce the frozen committed artifact exactly. Canonical and frozen Michelson have 1,378 aligned lines and exactly 37 differing integer pushes immediately before compiler-generated FAILWITH instructions; all other content matches.

The Phase 6 narrative reverses the observed direction: canonical instructions contain -1, while frozen/generated instructions contain positive source locations. This descriptive discrepancy does not obscure artifact identity or invalidate equivalence. Guard inspection supports source-reachable equivalence, including the fixed implicit admin, mapping-membership checks, local-map construction, and cardinality-preserving transitions.

Historical findings and limitations:
Verified the current implementation and evidence supporting closure of BR-01, post-success authorization/balance coverage, funded rollback, no-op batch coverage, and compiled event types. Historical findings were not counted as current defects.

## E. Findings

### Contract Defects

None.

### Assurance Gaps

None.

### Provenance / Identity Inconsistencies

None material. The descriptive integer-location reversal and Git checkout line-ending effects are explained in Sections C and D; exact candidate identity remains established.

## F. Known Limitations

- Configured FA2 contracts must honestly implement compatible authorization, balances, and transfer semantics.
- Administrator custody, configuration, and pause authority remain trusted and permanent.
- Burn-address key control and unspendability are not enforced or proved.
- Historical compiler provenance for canonical Michelson remains unknown; canonical/frozen equivalence is confined to source-reachable states.
- Native validation applies to the pinned Alpha mockup context.
- Deployed-contract identity and compatibility with a specific deployed protocol remain unverified.
- SmartPy scenarios and logs are not live-chain receipts.
- No formal proof, exhaustive exploration, comprehensive fuzzing, production-FA2 campaign, or gas-limit campaign was performed.

These limitations accurately bound the freeze claim. None invalidates the defined audit standard. This verdict does not establish deployment identity or compatibility beyond the recorded protocol context.

## G. Final Counts

- Contract defects: 0
- Assurance gaps: 0
- Provenance / identity inconsistencies: 0
- Unresolved blocking findings: 0

## H. Final Verdict

PASS

The exact release candidate reviewed in this phase satisfies the defined EA-XYZ contract-audit freeze gate and is eligible to be frozen.
```