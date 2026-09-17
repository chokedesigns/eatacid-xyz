# Handoff Schema

## Purpose

The Handoff is the durable producer-consumer contract between audit phases or levels. It transfers exactly what the producer established, what remains open or bounded, which correctness inspection a downstream consumer owns, and what a later level may expand. It also records whether the handoff is current authority, whether it replaces an earlier handoff, and whether its consumer has reconciled dependent descendants. Same-level or other downstream inspection obligations are distinct from finer-resolution expansion inputs. A handoff does not repair missing producer coverage, strengthen evidence, or reconstruct unrecorded audit work.

## Completeness status

Use exactly one:

- `COMPLETE`: every required producer artifact and handoff field validates, all consumer entry conditions are met, and no material recorded limitation requires special caution.
- `COMPLETE_WITH_RECORDED_LIMITATIONS`: every required artifact and field validates and the consumer can proceed, but explicit bounded limitations, discrepancies, accepted decisions, or external/manual boundaries must accompany the handoff.
- `INCOMPLETE`: a required input, reference, coverage obligation, closure gate, boundary, or material evidence condition is missing, failed, or incompatible with the consumer's entry conditions.

Completeness describes the handoff contract, not the number of findings. A structurally complete handoff may report an open audit state only when the target phase explicitly permits that state. Valid `PENDING_INSPECTION` rows do not by themselves make a handoff `INCOMPLETE` or require `COMPLETE_WITH_RECORDED_LIMITATIONS` when the producer completed its own contract, the target is the named inspection owner, and the consumer can safely proceed. If the target requires correctness closure as an entry condition, open supported findings or applicable `PENDING_INSPECTION` rows make the handoff `INCOMPLETE` for that target.

Existing `L1-HANDOFF-v1` status phrases normalize as follows when adapted to this schema: `COMPLETE — ready for Phase 5` maps to `COMPLETE`; `COMPLETE WITH RECORDED LIMITATIONS — ready for Phase 5` maps to `COMPLETE_WITH_RECORDED_LIMITATIONS`; and `INCOMPLETE — not safe as sole Level-1 context for Phase 5` maps to `INCOMPLETE`. Preserve the producer's original phrase in provenance.

## Handoff identity and parties

```text
Handoff ID / version:
Produced date:
Source level / phase:
Target level / phase:
Producer artifact IDs / versions:
Consumer contract version:
Repository identity references:
Current-fact authority:
Historical-conclusion authority:
Working-tree basis: COMMITTED_ONLY | EXPLICITLY_ACCEPTED_WORKTREE
Handoff context: INITIAL | REPLACEMENT
Current authority for target consumer: YES | NO + <evidence/reference>
Handoff superseded for current authority: NONE | <handoff ID/version>
Superseded by current-authority handoff: NONE | <handoff ID/version or current continuity-register reference>
Reason for replacement: NONE | <reason>
Originating upward-invalidation references: NONE | <INVALID-* IDs>
Completeness status: COMPLETE | COMPLETE_WITH_RECORDED_LIMITATIONS | INCOMPLETE
Completeness rationale:
```

Repository identity must include every in-scope root, branch, full commit, relevant worktree status, and nested or separate Git boundary. If producer and consumer repository states differ, record the commit interval and authorize the difference as remediation or a scope delta; do not silently treat them as identical.

`Handoff context` is descriptive continuity metadata, not a completeness status. An initial handoff uses evidenced `NONE` for replacement-only fields. A replacement handoff becomes current authority only after producer-owned re-adjudication and required reclosure validate. It names the earlier handoff it supersedes for current use but never deletes, rewrites, or changes the earlier handoff's historical identity, status, evidence, or provenance. A current continuity register may record `Superseded by` without mutating the preserved historical artifact.

## Required contract references

```text
Search-space / Coverage Matrix references:
Finding-ledger references:
Derived-work ledger references: NONE | <references>
Remediation trace references: NONE | <tickets, changes, commits, or artifacts>
Verification / closure-run references: NONE | <references>
Remediation / closure state: NOT_RUN | OPEN | RERUN_IN_PROGRESS | CLOSED | CLOSED_WITH_RECORDED_LIMITATIONS
Stopping-boundary register references:
Pending-inspection object references: NONE | <object IDs + responsible level / phase / consumer>
Downstream inspection obligation references: NONE | <transfer or boundary references>
Explicit next-level expansion inputs: NONE | <boundary and candidate references>
No-expansion decisions: NONE | <boundary references>
External/manual boundary references: NONE | <EXT-* references>
Unresolved / unverifiable object references: NONE | <object IDs>
Upward-invalidation references: NONE | <INVALID-* IDs>
Discrepancy references: NONE | <discrepancy IDs>
Authorized scope-delta references: NONE | <DELTA-* IDs>
Prior Search-space ID / version: NONE | <ID/version>
Replacement Search-space ID / version: NONE | <ID/version>
Logical Search-space identity preserved: NOT_APPLICABLE | YES | NO + <evidence>
Re-adjudication artifact references: NONE | <references>
Replacement closure / reclosure references: NONE | <references>
Replacement producer artifact references: NONE | <references>
Replacement-handoff continuity register reference: NONE | <reference>
Descendant dependency-impact references: NONE | <references>
Descendant reconciliation references: NONE | <references>
```

The handoff carries source artifacts by stable reference. It may include concise summaries for copy/paste use, but the summary must not replace required ledgers or alter their controlled vocabulary.

Preserve logical Search-space identity when the shared search-space rules require version evolution. Use a new logical identity only when evidence establishes that the modeled search space itself is no longer the same logical search space. A replacement handoff reference alone is not a scope delta.

List `PENDING_INSPECTION` objects only in the pending-inspection and downstream-obligation fields, not as unresolved or unverifiable objects. If evidence is genuinely missing, inaccessible, conflicting, external, or untraceable, carry the applicable `UNVERIFIABLE` or `EXTERNAL_BOUNDARY` state instead.

## Producer-consumer transfer register

For each required domain, object group, or contract transferred to the consumer, record:

```text
Transfer ID:
Source domain / object IDs:
Source coverage disposition summary:
Source finding IDs and current dispositions: NONE | <IDs + dispositions>
Source stopping-boundary IDs and status:
What the producer established:
What the producer did not establish:
Consumer entry condition:
Downstream consumer obligation: NONE | <responsible level / phase / consumer + required question or action>
Finer-resolution expansion input: NONE | <parent boundary + candidate reference>
External/manual constraints: NONE | <EXT-* IDs>
Uncertainty: NONE | <description>
Source references:
```

Every `PENDING_INSPECTION` object must resolve to a downstream consumer obligation naming the responsible consumer and required correctness question or action. This obligation may target a later phase at the same level and must not be represented as a finer-resolution expansion. Every next-level expansion input must separately have a parent object or boundary. A no-expansion decision is a valid transfer when supported by the Stopping Boundary Schema. `NONE` is valid only when absence is evidenced and the target does not require the corresponding obligation or expansion input; otherwise use `UNTRACED` and mark the handoff incomplete.

## Current-authority and replacement-handoff continuity

Every handoff or current continuity register must let its consumer answer without Git-history reconstruction or conversational memory:

- whether this handoff is current authority for the consumer;
- whether a required ancestor has been upward-invalidated;
- which handoff supersedes the prior handoff for current authority;
- whether producer re-adjudication and required reclosure validated;
- whether this consumer has reconciled against the replacement;
- whether descendant scope delta, re-enumeration, or correctness re-inspection is required; and
- whether the consumer's downstream gate may safely pass.

For every replacement handoff, include:

```text
Replacement-continuity record ID:
Replacement handoff ID / version:
Prior handoff superseded for current authority:
Prior handoff historical-status and provenance references:
Reason for replacement:
Originating upward-invalidation IDs:
Prior Search-space ID / version:
Replacement Search-space ID / version:
Logical Search-space identity preserved: YES | NO + <evidence>
Authorized scope-delta references: NONE | <DELTA-* IDs>
Re-adjudication artifact references:
Remediation references: NONE | <references>
Reclosure artifact / audit-run / boundary references:
Changed parent Object / Boundary / Domain IDs: NONE | <IDs + change>
Unchanged parent Object / Boundary / Domain IDs: NONE | <IDs + continuity evidence>
Removed or no-longer-applicable parent IDs: NONE | <IDs + evidence>
Newly applicable parent IDs: NONE | <IDs + evidence>
Affected descendant consumers / artifacts / Search spaces: NONE | <references>
Descendant reconciliation required: YES | NO + <evidence>
Descendant reconciliation completed: NOT_APPLICABLE | YES | NO + <evidence/reference>
Descendant scope delta required: YES | NO | TO_BE_DETERMINED_BY_DESCENDANT + <reason>
Descendant re-enumeration required: YES | NO | TO_BE_DETERMINED_BY_DESCENDANT + <reason>
Descendant correctness re-inspection required: YES | NO | TO_BE_DETERMINED_BY_DESCENDANT + <reason>
Exact consumer entry conditions for safe reconciliation:
Exact downstream-resume conditions:
Downstream gate may pass: YES | NO + <evidence/reference>
Current-authority determination and evidence:
```

The parent replacement producer identifies changed and unchanged parent state and potentially affected descendants. It does not decide which descendant objects survive unless that producer also owns the descendant resolution. `TO_BE_DETERMINED_BY_DESCENDANT` preserves that ownership and is descriptive, not a global status.

Historical handoffs and artifacts remain evidence of what was previously produced. Retain their IDs, provenance, findings, evidence, and original completeness/closure states. Record `invalidated-by`, replacement producer artifact, replacement handoff, reclosure artifact, descendant reconciliation, and current-authority references in the current chain. Never rewrite historical status to fabricate replacement history.

## Descendant dependency and reconciliation register

After a validated replacement parent handoff exists, the descendant producer/consumer must compare the old parent handoff, replacement parent handoff, old descendant Search-space ID/version and denominator, changed parent state, each descendant's ancestry dependency, and current repository evidence. Reconciliation covers every previously current descendant and every newly applicable candidate; continuing from the old artifact without this comparison is prohibited.

For every existing or newly required descendant, record:

```text
Descendant reconciliation record ID:
Consumer / descendant artifact:
Old parent handoff reference:
Replacement parent handoff reference:
Originating upward-invalidation references:
Old descendant Search-space ID / version:
Old denominator-rule reference:
Descendant Object / Candidate ID or new-candidate reference:
Prior row / finding / work / boundary / handoff references:
Current Coverage disposition:
Disposition provenance: ORIGINATED_BY_CURRENT_RUN | CARRIED_FORWARD_FROM_PRIOR_AUTHORITATIVE_RUN
Disposition source audit-run / row reference:
Carried finding / verification / closure references: NONE | <references>
Challenged parent claim and demonstrated dependency: NONE | <claim + evidence>
Dependency impact: UNAFFECTED | ANCESTRY_DEPENDENT_POTENTIALLY_REUSABLE | INVALIDATED_OR_STALE_FOR_CURRENT_USE | REQUIRES_REENUMERATION_OR_REINSPECTION
Parent-map change relevant to descendant: NONE | <change>
Current repository evidence:
Reconciliation action: RETAIN_UNCHANGED | UPDATE_PARENT_REFERENCES | RECLASSIFY_APPLICABILITY | MOVE_OR_REPARENT | SPLIT_OR_MERGE | REMOVE_FROM_CURRENT_MEMBERSHIP | ADD_NEW | REENUMERATE | REINSPECT
Replacement parent Object / Boundary / Domain references:
Authorized descendant scope-delta reference: NONE | <DELTA-* ID>
Enumeration-continuity evidence:
Correctness-obligation/evidence continuity:
Disposition continuity evidence: NOT_APPLICABLE | <evidence/reference>
Correctness re-inspection required: NO | YES + <reason, owner, and queue reference>
Current-authority determination:
Source references:
```

The dependency-impact and reconciliation-action values describe evidence and operations; they are not new correctness dispositions, finding dispositions, artifact completeness statuses, stopping-boundary statuses, or next-expansion statuses.

Retain a descendant enumeration only when evidence proves that the object still exists at the same resolution; parent Object/Boundary ancestry resolves under the replacement; the denominator rule and applicability remain valid; grouping/splitting identity remains valid; no sibling change falsifies prior exhaustiveness; producer-owned evidence remains valid; and no invalidation affects the descendant's own claim. Retain its stable ID. A provenance/reference-only update does not require a scope delta when logical identity, membership, grouping, and applicability are unchanged.

Use an authorized descendant scope delta for an actual membership, identity, grouping/splitting, or applicability change. Re-enumerate and repeat omission checks for the exact affected parent/sibling denominator when replacement state invalidates the old rule or exhaustiveness claim. Preserve removed and superseded rows historically and never use a delta to conceal a prior omission.

Reuse a descendant correctness result only when evidence proves that its exact correctness obligation and relevant evidence remain unchanged. Carry its current disposition by exact authoritative downstream audit-run and row reference, mark it as carried rather than originated by the reconciliation producer, and preserve every finding, verification, and closure reference required by that disposition. Require re-inspection for a change in ownership, authority source, lifecycle, contract, applicability, parent invariant, execution target, external/manual assumption, grouping/splitting, sibling interaction, identity/collision domain, denominator membership, or exact correctness obligation. Parent provenance change alone does not force re-inspection; unchanged code lines alone do not prove correctness continuity. A reconciliation producer must not silently strengthen or re-adjudicate a carried downstream disposition.

Rebuild the current canonical descendant artifact and downstream queue from the reconciled denominator. The inspection/re-inspection queue contains exactly candidates that have no prior authoritative correctness result and require initial inspection, plus candidates whose prior result is not current authority and require correctness re-inspection. Do not queue a candidate merely because reconciliation occurred when its prior downstream result remains reusable and current. Transfer every reusable result, its exact source audit-run/row, continuity evidence, and required finding/verification/closure references in the reconciliation and current-state records so downstream consumers can resolve current authority without treating it as awaiting inspection. No affected downstream gate may pass until every descendant is accounted for, required deltas/re-enumeration/re-inspection are explicit and completed to that gate's entry condition, and the replacement chain is current authority. A handoff into the named correctness-reinspection consumer may be complete when the reconciled denominator and full required queue are valid; a gate requiring descendant correctness closure or later consumer readiness remains blocked until the required re-inspection and closure work completes. Do not invalidate unrelated descendants without a demonstrated dependency.

## Remediation and closure state

The handoff must distinguish:

- the discovery search-space ID and audit run;
- the repository state in which findings were raised;
- remediation tickets, changes, and commits;
- the closure-rerun repository state;
- authorized scope deltas;
- verification results for every prior finding; and
- whether the same-space rerun reached zero remaining supported active correctness findings.

Do not translate `IMPLEMENTED`, `ACCEPTED_RISK`, `DEFERRED`, or `REMEDIATED_PENDING_VERIFICATION` into closure. Preserve historical finding IDs and dispositions after fixes.

Do not translate `PENDING_INSPECTION` into correctness closure. Any handoff that claims correctness closure must show that the responsible correctness-audit consumer replaced all applicable pending states with current evidence-supported dispositions and that the same-space closure rules passed.

## External/manual and unresolved register

For every external/manual boundary or unresolved object carried forward, include:

```text
Boundary or object ID:
Affected domain / object / finding IDs:
Repository-side assumption:
What available evidence establishes:
What available evidence cannot establish:
Evidence strength: INCOMPLETE | EXTERNAL
Evidence still required:
Owner / target phase or manual workflow:
Mutation or authorization boundary:
Effect on producer conclusion:
Effect on consumer scope and completeness:
```

External evidence must never be inferred from static repository evidence. An explicit external boundary can accompany `COMPLETE_WITH_RECORDED_LIMITATIONS` only when the consumer can perform its authorized work without treating the unverified claim as established.

## Upward invalidation and discrepancy register

Carry every Upward Invalidation record by its stable `INVALID-*` or compatible phase-native ID. State whether it is open or resolved, which earlier boundary is reopened, who owns re-adjudication, and which consumer claims are limited. An open invalidation prevents reliance on the superseded closure conclusion.

For each other material discrepancy, record:

```text
Discrepancy ID:
Affected artifacts / domains / objects / findings:
Conflicting claims:
Authority rule applied:
Current factual conclusion:
Preserved historical conclusion:
Upward invalidation required: YES | NO
Qualification evidence and reason:
Upward-invalidation reference: NONE | <INVALID-* ID>
Impact on closure or completeness:
Required consumer caution or action:
Source references:
```

Do not use a discrepancy record to silently reopen a historical finding or to conceal missing evidence.

A discrepancy is required for every material conflict. Formal upward invalidation is required only when the conflict contradicts a producer-owned conclusion whose continued validity is necessary for current descendant ancestry or downstream claims. Compatible finer detail, an ordinary descendant finding, optional/derived work, or a still-valid parent claim does not qualify. State why the evidence is contradiction rather than refinement.

## Conditions that force INCOMPLETE

A handoff is `INCOMPLETE` when any applicable condition holds:

1. A required upstream artifact is missing, unusable, incompatible, or already incomplete for the target's entry conditions.
2. Repository roots, branches, full commits, worktree basis, or separate Git boundaries cannot be established.
3. The repository state does not match the producer artifact and the difference is not explained by remediation provenance or an authorized scope delta.
4. The referenced Coverage Matrix is incomplete, contains orphan or undispositioned objects, lacks a reproducible denominator, or contains `PENDING_INSPECTION` rows without valid downstream owners and obligations.
5. Required findings lack stable IDs, object links, current dispositions, remediation trace, or verification evidence.
6. The target requires correctness closure and the same-space rerun is missing, incomplete, has remaining supported active correctness findings, or leaves applicable rows `PENDING_INSPECTION`.
7. A stopping boundary required for the target's entry conditions is missing, `OPEN` or `UNTRACED` for a producer-owned obligation that must already be closed, or too imprecise to support the target's authorized work. A `CLOSED` producer-owned boundary with explicit downstream inspection obligations does not trigger this condition.
8. A required next-level input is missing or was invented without evidence. A justified no-expansion decision does not cause incompleteness.
9. An external/manual or unverifiable object is silently omitted or its effect on claims is not bounded.
10. An open upward invalidation affects a conclusion the target would otherwise inherit as closed.
11. A material discrepancy or `UNTRACED` claim prevents the consumer from identifying authoritative facts or safe scope.
12. Any required ID or artifact reference does not resolve.
13. The consumer would need conversational memory, broad repository reconstruction, or invention to recover the producer's scope or conclusions.
14. The target requires a disposition that the producer's own contract was responsible for providing, but the producer used `PENDING_INSPECTION` instead of completing that obligation.
15. The handoff is superseded for current authority and the consumer attempts to use it for an affected current claim.
16. A required ancestor has an open upward invalidation, or producer re-adjudication, required reclosure, or a validated replacement handoff is missing.
17. Replacement continuity does not identify the prior and replacement handoffs/search spaces, originating invalidations, authorized deltas, re-adjudication/reclosure evidence, and changed versus unchanged parent state.
18. Required descendant reconciliation ownership, inputs, or affected-scope accounting is missing; reconciliation that the target's entry conditions require to be complete is incomplete, silently drops or retains an object, or lacks evidence for a current-authority determination. A replacement-parent handoff may remain complete for a target that is explicitly the reconciliation owner when its full reconciliation inputs and obligations are valid.
19. A descendant membership, identity, grouping/splitting, or applicability change lacks an authorized scope delta, or a provenance-only change is incorrectly used to manufacture denominator change.
20. Required descendant re-enumeration, omission checks, or correctness re-inspection has not reached the target's entry condition.
21. The downstream inspection/re-inspection queue omits a required initial inspection or re-inspection, includes a reusable current correctness result solely because reconciliation occurred, or a carried disposition lacks its authoritative source and continuity references.

`COMPLETE_WITH_RECORDED_LIMITATIONS` must not be used to bypass these failures. It is allowed only after all required accounting and validation pass.

## Handoff validation checklist

Before publication, report PASS or FAIL for:

1. source and target identities;
2. repository and worktree provenance;
3. producer artifact availability and versions;
4. Coverage Matrix completeness and reference integrity;
5. finding-ledger completeness and correctness/derived-work separation;
6. remediation and same-space closure state;
7. stopping-boundary coverage and producer-owned closure;
8. pending-inspection objects and downstream consumer obligations;
9. distinct next-expansion and no-expansion inputs;
10. external/manual and unresolved objects;
11. upward invalidations;
12. discrepancies and authority decisions;
13. authorized scope deltas;
14. consumer entry conditions;
15. current-authority determination and any superseding handoff;
16. replacement-handoff identity, reason, originating invalidations, and Search-space continuity;
17. producer re-adjudication and required reclosure evidence;
18. changed, unchanged, removed, and newly applicable parent state;
19. applicable descendant dependency mapping and reconciliation ownership/completion accounting;
20. scope-delta, re-enumeration, and correctness-reinspection decisions;
21. exact inspection/re-inspection queue membership and carried-disposition provenance;
22. downstream safe-resume conditions and gate result; and
23. ability of the consumer to proceed without reconstructing producer work or relying on conversational memory.

The final handoff must include the selected completeness status, every failed condition, its affected artifacts, and the exact evidence or work required to make it pass. It must never claim that the producer level or the overall methodology is complete beyond the evidence transferred.
