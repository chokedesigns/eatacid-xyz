# Finding Schema

## Purpose

This schema defines the durable contract for a current correctness finding and the linked records used to track remediation and verification. It also prevents assurance, coverage, hardening, observability, testing, cleanup, and speculative future work from being mislabeled as active correctness.

A finding record does not replace its Coverage Matrix rows. Every active correctness finding must link to at least one audit object, and every coverage row disposed as `FINDING` must link back to at least one finding.

## Record classes

Use exactly one record class:

- `ACTIVE_CORRECTNESS`: a current supported defect or correctness risk that meets the threshold below.
- `DERIVED_COVERAGE`: work to inspect an unclosed or newly relevant area.
- `DERIVED_ASSURANCE`: work that increases confidence without proving a current defect.
- `DERIVED_HARDENING`: resilience or defensive improvement beyond current correctness requirements.
- `DERIVED_OBSERVABILITY`: logging, metrics, diagnostics, or operational visibility work.
- `DERIVED_TESTING`: test work that does not itself establish a current production defect.

Only `ACTIVE_CORRECTNESS` is a correctness-finding record and receives a `FIND-*` or compatible phase-native finding ID. The record class preserves what kind of concern was originally raised; the current finding disposition determines whether it remains active. Derived records use a `WORK-*` or compatible phase-native work ID. A derived record may link to an originating finding, but it must not be counted as an active finding or correctness-closure blocker merely because it could expose or prevent a future bug.

## Active-correctness threshold

An `ACTIVE_CORRECTNESS` record requires all of these:

1. an identifiable invariant, contract, lifecycle rule, transition rule, or ownership rule;
2. a concrete current repository code path or artifact;
3. current evidence for the claimed violation;
4. a realistic trigger or set of preconditions; and
5. a behaviorally meaningful failure mode.

`DIRECT` evidence is preferred. `INFERRED` evidence may support a finding only when the static reasoning chain is complete, every necessary premise is evidenced, and the trigger and failure mode are current rather than hypothetical. `INCOMPLETE` or `EXTERNAL` evidence alone supports an unresolved question or boundary, not an active correctness finding.

The following do not meet the threshold by themselves:

- complexity or unfamiliarity;
- style or consistency preferences;
- broad cleanup or refactoring value;
- speculative interleavings or future changes;
- a maintainability hazard that could become a bug later;
- missing tests, monitoring, or documentation; or
- hardening beyond a demonstrated current contract.

## Severity and classification

Active correctness severity describes the impact and urgency of a current supported concern:

- `P0`: current evidence supports catastrophic, dangerous, broadly corrupting, or release-blocking behavior, or a failure that is highly likely on a core path.
- `P1`: current evidence supports a behaviorally meaningful defect, stale/incorrect state risk, invalid contract, or concrete fragility that warrants normal correctness remediation.
- `P2`: current evidence supports a real but lower-impact, narrower, or less frequently triggered correctness defect or risk. The behavior is wrong now under evidenced preconditions; `P2` is not a label for a merely plausible future bug.

If the evidence supports only future hazard, cleanup, hardening, missing coverage, or a testing opportunity, create the applicable derived-work record instead of assigning `P2`.

`Classification` names the current failure mechanism or correctness class using the producing level's declared controlled vocabulary. `Level/domain` records resolution ownership. Severity, classification, and confidence are separate fields and must not substitute for one another.

## Evidence strength and confidence

Evidence strength uses:

- `DIRECT`: explicitly demonstrated by current source, configuration, workflow, artifact, or a safe deterministic result.
- `INFERRED`: supported by a complete static reasoning chain but not explicitly declared or directly executed.
- `INCOMPLETE`: relevant evidence exists, but a necessary link is missing or conflicting.
- `EXTERNAL`: resolution depends on hosted, provider, browser, production, manual, or other out-of-repository evidence.

Confidence uses `HIGH`, `MEDIUM`, or `LOW` and describes confidence that the stated evidence chain supports the finding as written. Lower confidence does not relax the active-correctness threshold. If confidence is too low to support the required chain, use an external, unverifiable, or derived-work record instead.

## Active correctness record

```text
Finding ID:
Record class: ACTIVE_CORRECTNESS
Title:
Linked object IDs:
Search-space ID / version:
Audit-run ID:
Repository / surface:
Level / domain:
Classification:
Severity: P0 | P1 | P2
Historical severity / classification: NONE | <as originally recorded>
Invariant or contract violated:
Current evidence:
Evidence strength: DIRECT | INFERRED
Repository anchors:
Complete reasoning or proof chain:
Concrete failure mode:
Trigger / preconditions:
Reachability:
Observable consequence:
Confidence: HIGH | MEDIUM | LOW
Remediation status: NOT_STARTED | PLANNED | IN_PROGRESS | IMPLEMENTED | NOT_REQUIRED | UNKNOWN
Ticket / change / commit references: NONE | <references>
Verification status: NOT_RUN | FAILED | PASSED | EXTERNAL_REQUIRED | UNVERIFIABLE
Verification references: NONE | <VERIFY-* or evidence references>
Residual risk:
Finding disposition: ACTIVE | REMEDIATED_PENDING_VERIFICATION | VERIFIED_CLOSED | INVALIDATED | ACCEPTED_RISK | DEFERRED | EXTERNAL_BOUNDARY | UNVERIFIABLE
Derived-work references: NONE | <WORK-* IDs>
Upward-invalidation reference: NONE | <INVALID-* ID>
Historical source references: NONE | <references>
```

Field rules:

- `Finding ID` is stable and is never reassigned or removed after remediation.
- `Linked object IDs`, `current evidence`, `failure mode`, and `trigger/preconditions` are mandatory.
- `Repository anchors` identify the narrowest stable files, symbols, configuration keys, workflows, artifacts, or contract edges; line numbers are optional navigation aids.
- `NOT_REQUIRED` remediation is valid only for an `INVALIDATED` finding or an explicitly recorded non-code resolution.
- `IMPLEMENTED` does not imply `PASSED` verification or `VERIFIED_CLOSED` disposition.
- `VERIFIED_CLOSED` requires linked remediation or non-code resolution evidence plus verification against the applicable search space.
- `INVALIDATED` means later evidence disproved the finding as stated; it is not a synonym for fixed.
- `ACCEPTED_RISK` and `DEFERRED` preserve the supported active concern and therefore do not count as zero for correctness closure.
- `EXTERNAL_BOUNDARY` and `UNVERIFIABLE` bound the claim; they do not permit an unqualified correctness conclusion.

For compatibility with existing Level-1 handoff concepts, legacy dispositions must be normalized explicitly rather than copied ambiguously: `fixed` maps to `VERIFIED_CLOSED` only when closure evidence exists and otherwise to `REMEDIATED_PENDING_VERIFICATION`; `invalidated` maps to `INVALIDATED`; `accepted` maps to `ACCEPTED_RISK` when the current concern remains supported; `deferred` maps to `DEFERRED`; and `external/manual` maps to `EXTERNAL_BOUNDARY`. A legacy `unresolved` record maps according to its evidence, normally `ACTIVE` or `UNVERIFIABLE`. Preserve the original term in `Historical severity / classification` or historical source evidence.

## Derived-work record

```text
Work ID:
Record class: DERIVED_COVERAGE | DERIVED_ASSURANCE | DERIVED_HARDENING | DERIVED_OBSERVABILITY | DERIVED_TESTING
Title:
Reason and desired evidence or outcome:
Linked object IDs: NONE | <object IDs>
Originating finding IDs: NONE | <finding IDs>
Repository / surface:
Level / domain:
Current evidence:
Owner / target phase or workflow:
Status: OPEN | IN_PROGRESS | COMPLETE | DEFERRED | NOT_PLANNED
Ticket / change / commit references: NONE | <references>
Verification references: NONE | <references>
```

Derived work must remain in a separate section or ledger from active correctness findings. Completing derived work does not close a finding unless the finding's own remediation and verification fields establish closure.

## Finding-ledger validation

A finding ledger passes only when:

1. every active finding meets the active-correctness threshold;
2. IDs are stable and all object, evidence, remediation, verification, derived-work, and invalidation references resolve;
3. severity describes current impact rather than future possibility;
4. finding and remediation dispositions are compatible with their evidence;
5. every historically recorded finding remains traceable after fix or invalidation;
6. no derived-work item is counted as an active correctness finding; and
7. closure counts only `VERIFIED_CLOSED` and `INVALIDATED` findings as no longer supported active findings.
