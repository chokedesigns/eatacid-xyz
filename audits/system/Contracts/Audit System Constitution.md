# Audit System Constitution

## Authority and purpose

This Constitution defines the laws shared by every software-correctness audit level and phase in this repository. Phase prompts may specialize these laws for their resolution, but may not weaken or redefine them. The files under `Schemas/` define the durable artifact contracts that implement these laws.

If a current phase prompt conflicts with this Constitution or a referenced schema, record the conflict as a methodology defect. Do not silently choose the weaker rule.

## Shared terms

- **Level**: one declared resolution of analysis.
- **Search space**: the versioned denominator of candidate audit objects for a level and repository state.
- **Audit object**: one enumerated item that can receive an independent applicability and coverage disposition at the current resolution.
- **Pending inspection**: an explicit coverage state for an applicable object that the producing phase has successfully inventoried and accounted for, while its contract assigns correctness inspection to a named downstream consumer. It is neither a correctness conclusion nor an evidence limitation.
- **Scope delta**: an explicitly authorized addition, removal, or reclassification in a search space after its baseline was frozen.
- **Correctness finding**: a current, evidence-supported violation of an invariant or contract with a behaviorally meaningful failure mode.
- **Derived work**: coverage, assurance, hardening, observability, or testing work that is not itself an active correctness finding.
- **Stopping boundary**: the finest resolution actually established for a domain or object, including the limits of that conclusion.
- **Handoff**: the validated producer-consumer artifact that transfers coverage, findings, closure state, boundaries, and next inputs.
- **Discrepancy**: a durable record that preserves and adjudicates a material conflict between current evidence and an inherited historical statement, reference, scope claim, identity, or conclusion.
- **Upward invalidation**: an explicit reopening of an earlier conclusion because evidence found at a deeper level contradicts it.
- **Replacement handoff**: a new handoff that supersedes an earlier handoff for current authority after producer-owned re-adjudication and required reclosure, while preserving the earlier handoff as historical evidence.
- **Descendant reconciliation**: the evidence-backed comparison of existing descendant ancestry and claims against a replacement parent handoff to determine what remains reusable and what requires reparenting, scope delta, re-enumeration, or correctness re-inspection.

Stable IDs are never reused for a different entity. Existing phase-native IDs, including `L1-*`, `L2-*`, and phase-prefixed finding IDs, remain valid when they are unique and durable. Cross-artifact references must preserve the producer's exact ID. Blank fields are not evidence: use `NONE` for an evidenced absence and `UNTRACED` when required evidence or provenance is missing.

## System laws

### 1. Current-state authority and historical authority

The current checked-out repository is the factual source of truth for present code, configuration, architecture, behavior supported by static evidence, and repository provenance. Record repository root, branch, full commit, and relevant worktree state so that the factual baseline is identifiable.

Historical artifacts are authoritative only for the historical conclusions, coverage claims, findings, decisions, and evidence they actually recorded. They are not authority for current facts and may not be used to manufacture missing present evidence. When current facts conflict with historical conclusions, preserve both, apply the current repository to the current fact, and record the discrepancy.

An artifact may remain historically `COMPLETE`, `CLOSED`, or otherwise valid for its original repository and search-space state after later evidence invalidates an ancestor claim. Preserve its IDs, provenance, evidence, findings, prior statuses, and the invalidation that superseded its affected use. Do not delete it or rewrite its historical status. It is not current authoritative ancestry for affected claims until the owning producer has issued a validated replacement chain and the affected consumer has completed descendant reconciliation. The validated replacement parent handoff may be current authority for entry into that reconciliation while affected pre-existing descendant artifacts remain historical-only for current claims. Current-authority determinations must be explicit in durable artifacts; Git history and conversational memory are not substitutes.

### 2. Durable producer-consumer contracts

Every phase must declare its required inputs and produce a durable, versioned artifact whose stable IDs and references can be validated without conversational memory. Producers own the completeness and precision of their outputs. A later synthesis or consumer may preserve missing data as `UNTRACED`; it may not retroactively claim that omitted inspection occurred.

No phase may claim completeness when a required upstream artifact is missing, unusable, incompatible, or incomplete for that phase's entry conditions. A consumer must validate repository identity, artifact versions, reference integrity, completeness status, and required closure gates before relying on a handoff.

A producer may complete its own enumerating or understanding contract while a different downstream correctness question remains `PENDING_INSPECTION`, provided the producer's contract explicitly permits that deferral, the responsible consumer and obligation are named, and the producer's own evidence and accounting are complete. Deliberate downstream sequencing is not `UNVERIFIABLE` and does not by itself create a recorded limitation.

### 3. Progressive refinement

Every level after the first must inherit the prior level's closed map, conclusions, limitations, and stopping boundaries. It then expands only eligible objects exactly one resolution level finer. It must not redo broad parent-level work merely to appear thorough, and it must not skip an intermediate resolution.

The first level must create its own declared search-space denominator. A later level must retain a parent reference for every finer object. A parent with no justified finer object may record a no-expansion decision; no child is to be invented merely to populate a deeper level.

### 4. Enumerate before audit

Each level must enumerate its complete candidate search space before findings are finalized. The enumeration rule, search-space identity, repository provenance, and any exclusions must be explicit. Discovery of additional eligible objects during inspection requires an authorized scope delta and an updated denominator; it does not permit silent expansion or omission.

### 5. Exhaustive producer coverage and explicit disposition

Every enumerated object must receive an applicability decision and a coverage disposition under `Schemas/Coverage Matrix.md`. Exhaustiveness concerns completion of the producing phase's declared work across the whole denominator, not production of a large finding set.

Absence of a row is never equivalent to `CORRECT`. A heading, summary, sample path, or domain-level conclusion cannot substitute for object-level accounting where independently meaningful objects exist.

Coverage completeness and correctness closure are separate claims. A phase whose contract explicitly produces inventory or understanding before a later correctness audit may use `PENDING_INSPECTION` after it completes its producer-owned work. The named correctness-audit consumer must inspect every such applicable object and replace that state with an evidence-supported current disposition; `PENDING_INSPECTION` never counts as correctness closure.

### 6. Traversal order is not traversal scope

Risk may determine which object is inspected first and how effort is sequenced. Risk may never reduce the declared denominator or excuse an undispositioned object. Finding count, including zero findings or an apparently sufficient number of high-confidence findings, must never terminate traversal.

### 7. Correctness-finding threshold

A correctness finding is valid only when current evidence supports all of the following:

- an identifiable invariant, contract, lifecycle rule, transition rule, or ownership rule;
- a concrete current code path or artifact;
- a realistic trigger or set of preconditions; and
- a behaviorally meaningful failure mode.

The evidence chain must distinguish demonstrated facts, supported inference, missing evidence, and external evidence. Complexity, unfamiliarity, inconsistency alone, style preferences, cleanup, speculative future hazards, and missing tests alone do not meet the threshold.

Severity expresses the impact or urgency of a current supported correctness concern. It must not be used to promote future risk or improvement work into active correctness. `Schemas/Finding Schema.md` owns the finding, severity, evidence, remediation, and disposition fields.

### 8. Correctness and derived work remain separate

Active correctness findings must be recorded separately from coverage, assurance, hardening, observability, and testing work. Derived work may be trace-linked to a correctness finding, but it must use a derived-work record and must not be counted as an active correctness defect. Missing regression coverage does not by itself prove incorrect production behavior.

### 9. External, manual, and uncertain boundaries are explicit

Hosted, provider, browser, production, manual, live-system, or other out-of-repository dependencies must be recorded as explicit boundaries. State exactly what repository evidence establishes, what it cannot establish, what evidence is still required, and what authorization limits apply.

`EXTERNAL_BOUNDARY` and `UNVERIFIABLE` are visible dispositions, not permission to omit an object. `UNVERIFIABLE` identifies a genuine evidence deficiency and must not represent ordinary work assigned to a named downstream phase; use `PENDING_INSPECTION` for valid sequencing. Conclusions must remain bounded to the evidence actually available.

### 10. Remediation is outside audit discovery and remains traceable

Audit discovery identifies and records findings; remediation occurs as a separate ticket or fix workflow. Every remediation must remain linked to the original finding, affected object IDs, repository change or commit where available, and verification evidence. Implemented is not synonymous with verified or closed.

Audit prompts must not mutate the system under audit unless a task expressly authorizes that mutation. An authorized fix does not erase the historical finding or the obligation to rerun its search space.

### 11. Closure is a same-space rerun to zero

Correctness closure requires a rerun of the same identified search space after remediation, plus only explicitly authorized scope deltas. The rerun must:

1. preserve the original denominator and stable object identities;
2. incorporate and identify every authorized delta;
3. re-inspect every applicable object, not only prior findings or high-risk objects;
4. refresh every object's disposition and evidence;
5. trace every prior finding through remediation and verification; and
6. produce zero remaining supported active correctness findings.

`ACCEPTED_RISK`, `DEFERRED`, `REMEDIATED_PENDING_VERIFICATION`, or otherwise unresolved supported findings are not zero. External or manual limitations may yield only a conclusion explicitly bounded by those limitations, never an unqualified closure claim. A zero-finding report without a complete same-space coverage ledger is not closure.

### 12. Stopping boundaries govern level ownership

Every level must record what is closed at its current resolution, the evidence basis, what remains limited or uncertain, and what may be expanded next. Boundary status evaluates the question owned by the producing phase. A producer may close a fully established architectural, inventory, or ownership boundary while carrying an explicit downstream correctness obligation; that downstream question does not make the producer-owned boundary `OPEN`. A stopping boundary must state what is closed, what is not claimed, and what downstream inspection remains, and it claims no correctness below or outside the resolution and question actually inspected. Same-level downstream inspection is not finer-resolution expansion. Where deeper work is not justified, record a reason rather than inventing a finer object.

### 13. Recursive cross-level invalidation and continuity

For arbitrary adjacent levels N and N+1, N produces the authoritative parent search space and handoff and N+1 inherits them. When N+1 discovers a material conflict with an inherited historical statement, reference, scope claim, identity, or conclusion, it must record a discrepancy. A discrepancy becomes a formal `UPWARD INVALIDATION` only when evidence shows that the conflict contradicts a producer-owned conclusion whose continued validity is necessary for current descendant ancestry or downstream claims. Qualifying producer conclusions include object identity, parent-child ownership, applicability, denominator membership, domain ownership, correctness or finding disposition, closure, stopping boundary, next-expansion decision, external/manual or provenance assumption, and a handoff consumer-entry condition.

Additional child detail that fits the parent claim, an ordinary finer-level finding beneath a correctly modeled parent, optional coherence work, derived work, or any case in which the parent remains valid at its declared resolution is not an upward invalidation. The discovering phase must state evidence showing contradiction rather than refinement.

The universal lifecycle is:

`DISCOVER CONTRADICTION -> RECORD DISCREPANCY -> QUALIFY UPWARD INVALIDATION -> HAND BACK -> BLOCK AFFECTED CURRENT DESCENDANT AUTHORITY -> RE-ADJUDICATE -> RECLOSE AS REQUIRED -> REISSUE HANDOFF -> RECONCILE DESCENDANTS -> RE-ENUMERATE / RE-INSPECT ONLY WHERE REQUIRED -> RESUME`

These stages are distinct:

1. **Discover contradiction.** Preserve the inherited historical statement and record the conflicting current evidence in a discrepancy.
2. **Invalidate.** When the shared trigger is met, create a stable upward-invalidation record naming the exact producer-owned question and conclusion reopened.
3. **Hand back.** Return that question to its owning phase and resolution. The discovering deeper phase may not decide or repair the parent-level question on the owner's behalf.
4. **Suspend dependent authority.** Trace actual dependencies and block only descendant ancestry and claims that require the challenged conclusion. No descendant gate may pass over an unresolved required ancestor invalidation.
5. **Re-adjudicate.** The owning resolution preserves the original record, performs its required producer/correctness work, and uses authorized scope-delta/versioning when its denominator changes. Remediation remains separate and traceable when an actual supported defect requires it.
6. **Reclose.** The owning resolution reruns its required closure workflow over the resulting current denominator and obtains a valid replacement closure state. A code change, fix commit, informal "handled" label, or descendant workaround is not reclosure.
7. **Reissue handoff.** The owning chain issues a validated replacement handoff that names the handoff superseded for current authority, originating invalidations, prior and replacement search-space identities/versions, authorized deltas, re-adjudication and closure evidence, changed and unchanged parent identities, and exact consumer entry conditions. The earlier handoff remains historical evidence.
8. **Reconcile descendants.** The descendant producer/consumer compares the old and replacement parent handoffs, old descendant denominator and ancestry, and current evidence. It preserves stable descendant IDs where logical identity is unchanged; uses authorized scope deltas only for actual membership, identity, grouping, or applicability changes; re-enumerates where the replacement invalidates an earlier denominator or sibling-exhaustiveness claim; and requires correctness re-inspection only where the correctness obligation or relevant evidence changed.
9. **Resume.** Canonical downstream work resumes only after replacement parent closure exists, the replacement handoff validates, reconciliation covers every existing and newly applicable descendant, required deltas and re-enumeration are complete, and the applicable downstream gate passes. A gate into the named descendant correctness consumer may pass when reconciled ancestry and its complete re-inspection queue are valid; no gate that requires descendant correctness closure or consumer readiness may pass until required re-inspection and closure obligations complete.

An `UPWARD INVALIDATION` is not a finding disposition, remediation status, scope delta, new finding by itself, replacement closure, descendant fix, or permission for a deeper phase to repair its parent. A resolved invalidation does not by itself prove descendant reconciliation or authorize downstream resume.

Descendant propagation follows demonstrated dependency, never mere ancestry proximity. Each descendant must be classified with evidence as: unaffected; ancestry-dependent but potentially reusable; invalidated or stale for current use; or requiring re-enumeration/re-inspection. Represent those effects through invalidation, dependency, reconciliation, handoff, Coverage Matrix, stopping-boundary, gate, history, and existing `INCOMPLETE` mechanisms, not through new correctness dispositions or global completeness statuses. Unaffected descendants are retained only with evidence of ancestry continuity; affected descendants may remain historical evidence but may not remain current authority until reconciled.

Existing descendant enumeration may be reused only when evidence proves the object still exists at the same resolution, its parent ancestry resolves under the replacement, its denominator and applicability remain valid, grouping/splitting identity and sibling exhaustiveness remain valid, producer-owned evidence remains valid, and no invalidation affects its own claim. Existing correctness may be reused only when its correctness obligation and relevant evidence remain unchanged. Re-inspection is required when replacement ancestry changes ownership, authority source, lifecycle, contract, applicability, parent invariant, execution target, external/manual assumption, grouping/splitting, sibling interaction, identity/collision domain, denominator membership, or the exact correctness obligation. Unchanged paths or IDs alone do not prove reuse; parent provenance change alone does not require re-inspection.

This rule applies recursively. N+1 may challenge N only through discrepancy and, when qualified, upward invalidation; N remains owner of N-resolution re-adjudication and replacement authority; N+1 owns reconciliation of its descendants; and N+1 cannot issue a canonical downstream handoff while required parent ancestry or descendant reconciliation remains unresolved.

### 14. Handoffs carry closure and limits without strengthening them

A handoff must use `Schemas/Handoff Schema.md` and carry the exact coverage ledger, finding ledger, remediation and closure state, stopping-boundary register, downstream inspection obligations, next-level expansion inputs, external/manual boundaries, unresolved objects, upward invalidations, discrepancies, and completeness status required by its consumer. Same-level downstream inspection and finer-resolution expansion are distinct and must not be represented as one another.

A handoff may compress evidence but may not strengthen it, erase limitations, synthesize missing inspection, or convert an open producer-owned state into closure. Carrying a genuinely closed producer-owned boundary together with an explicit downstream inspection obligation does not convert the pending downstream question into correctness closure. The consumer must be able to proceed without reconstructing the producer's work.

A consumer must determine from the handoff itself whether it is current authority, whether a required ancestor has been invalidated, whether a validated replacement exists, whether this consumer reconciled against it, whether scope delta, re-enumeration, or correctness re-inspection is required, and whether its downstream gate may pass. An unresolved required ancestor invalidation, missing replacement closure/handoff, or incomplete descendant reconciliation forces the affected current handoff/gate to fail even when an older artifact remains historically complete.

## Constitutional completion test

An audit artifact may claim completion at its declared resolution only when:

- its required upstream contracts passed validation;
- the search-space denominator and repository provenance are recorded;
- every enumerated object has a compatible explicit disposition;
- all references resolve;
- every active finding meets the correctness threshold;
- derived work is separated;
- external, manual, and uncertain limits are explicit;
- stopping boundaries are recorded;
- upward invalidations and discrepancies are propagated; and
- every applicable current-authority, replacement-handoff, and descendant-reconciliation condition is resolved; and
- the applicable phase-specific completion and closure rules also pass.

Failure of any required condition makes the artifact `INCOMPLETE`. A recorded limitation can support `COMPLETE_WITH_RECORDED_LIMITATIONS` only when all required evidence and accounting are otherwise present and the resulting claims are expressly bounded. `COMPLETE` is reserved for artifacts with no material recorded limitation.

A valid `PENDING_INSPECTION` disposition is not a material limitation and does not by itself prevent producer completeness. It is valid only when the producing phase completed its own contract, made no correctness claim, and named the downstream inspection owner and obligation. Correctness closure still requires that the responsible consumer replace every applicable pending state through the required exhaustive audit and, where applicable, same-space rerun.
