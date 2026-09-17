# Coverage Matrix

## Purpose

The Coverage Matrix is the canonical audit-object and search-space ledger. It proves what the declared denominator contained and what happened to every object. Coverage completeness proves complete accounting at the producing phase's declared resolution; it does not by itself prove correctness closure. The matrix does not prove correctness below the audited resolution and does not replace the Finding, Stopping Boundary, or Handoff schemas.

Absence of a row is not equivalent to `CORRECT`.

## Ledger identity

Every ledger begins with this metadata:

```text
Coverage schema version:
Search-space ID:
Search-space version:
Audit-run ID:
Run type: DISCOVERY | CLOSURE_RERUN
Parent-continuity context: NOT_APPLICABLE | INITIAL_PARENT | REPLACEMENT_PARENT_RECONCILIATION
Audit level:
Producing phase:
Parent search-space / handoff reference: NONE | <ID>
Prior parent search-space / handoff reference: NONE | <ID>
Replacement-parent handoff reference: NONE | <ID>
Originating upward-invalidation references: NONE | <INVALID-* IDs>
Descendant reconciliation record references: NONE | <references>
Denominator rule:
Enumeration completed before findings finalized: YES | NO
Repository provenance references:
Authorized scope-delta references: NONE | <DELTA-* IDs>
Coverage status: COMPLETE | COMPLETE_WITH_RECORDED_LIMITATIONS | INCOMPLETE
```

The **Search-space ID** identifies the logical denominator across discovery, remediation, and closure reruns. Its version changes only through an authorized scope delta. The **Audit-run ID** identifies one inspection attempt. A closure rerun retains the original Search-space ID even though remediation changes the repository commit.

`Parent-continuity context` is `NOT_APPLICABLE` when the ledger is not consuming a parent handoff, `INITIAL_PARENT` when it is created from an initial valid parent handoff, and `REPLACEMENT_PARENT_RECONCILIATION` when it is reconciled against a replacement parent handoff. It is not a completeness or correctness status. Preserve the logical descendant Search-space ID when the modeled search space remains the same and evolve its version only through an authorized scope delta. Use a new logical identity only when evidence establishes that the modeled search space is no longer the same logical search space.

Repository provenance must record, for every repository in scope:

- stable repository name and root;
- branch;
- full commit;
- relevant initial worktree status;
- whether committed source only or an explicitly authorized working tree was audited; and
- separate or nested Git boundaries.

## Stable identifiers

Use durable IDs for search spaces, objects, scope deltas, evidence, external boundaries, findings, and verification records. Recommended generic prefixes are `SPACE-*`, `OBJ-*`, `DELTA-*`, `EVID-*`, `EXT-*`, `FIND-*`, and `VERIFY-*`.

Existing phase-native IDs are compatible when unique and stable. Do not rename an `L1-*`, `L2-*`, or phase-prefixed ID merely to match a generic prefix. Never renumber or reuse an ID after publication. Cross-references preserve the exact producer ID.

## Audit-object row

Create one row for every enumerated candidate object. A row contains:

```text
Object ID:
Parent object ID: NONE | <object ID>
Parent search-space / handoff reference:
Search-space ID / version:
Audit-run ID:
Audit level:
Repository identity reference:
Subsystem / surface:
Correctness domain or class:
Object type:
Object anchor:
Applicability: APPLICABLE | NOT_APPLICABLE | UNDETERMINED
Applicability rationale:
Coverage disposition: PENDING_INSPECTION | CORRECT | FINDING | NOT_APPLICABLE | EXTERNAL_BOUNDARY | UNVERIFIABLE
Disposition provenance: ORIGINATED_BY_CURRENT_RUN | CARRIED_FORWARD_FROM_PRIOR_AUTHORITATIVE_RUN
Disposition source audit-run / row reference: <audit-run ID + object/row ID>
Disposition continuity evidence: NOT_APPLICABLE | <evidence/reference>
Downstream inspection owner: NONE | <level / phase / consumer ID>
Downstream inspection obligation: NONE | <required correctness question or action>
Evidence strength: DIRECT | INFERRED | INCOMPLETE | EXTERNAL
Evidence references:
Finding references: NONE | <finding IDs>
External/manual boundary references: NONE | <EXT-* IDs>
Verification references: NONE | <VERIFY-* IDs>
Closure references: NONE | <closure artifact / rerun IDs>
Authorized scope-delta references: NONE | <DELTA-* IDs>
Prior-run row reference: NONE | <audit-run ID + object ID>
Prior-version row reference: NONE | <search-space version + object ID>
Upward-invalidation references affecting ancestry: NONE | <INVALID-* IDs>
Replacement-parent reference: NONE | <handoff + parent IDs>
Descendant reconciliation reference: NONE | <record ID>
Dependency on challenged parent claim: NONE | <exact claim and dependency>
Current ancestry validity: YES | NO + <evidence/reference>
Current row membership / identity / applicability changed: NO | YES + <scope-delta/reference>
Re-enumeration required: NO | YES + <reason and evidence/reference>
Correctness re-inspection required: NO | YES + <reason and owner/reference>
Inspection notes:
```

`Object anchor` is the narrowest durable repository, file, symbol, workflow step, artifact, contract, lifecycle, transition, or other phase-defined anchor appropriate to the current resolution. Line numbers are navigation aids, not stable identity.

The continuity fields describe whether a historical row may be used as current authoritative ancestry. They do not alter or replace `Applicability` or `Coverage disposition`. `Disposition provenance` and its source reference distinguish a disposition established by the current audit run from an existing authoritative disposition carried forward after reconciliation; these fields are provenance metadata, not new dispositions or completeness statuses. A carried disposition requires continuity evidence proving that its exact correctness obligation and correctness-relevant evidence remain unchanged, plus every finding, verification, and closure reference required by that disposition. An ancestry-invalidated row retains its historical disposition and evidence; a current ledger references that row and records why it is blocked, replaced, retained, or changed. Never encode ancestry invalidation as `FINDING`, `UNVERIFIABLE`, or another fake correctness disposition.

The denominator may use domain/object intersections when the same object must be independently inspected under multiple correctness domains. If it does, each intersection receives its own row or an explicit one-to-many mapping that preserves separate dispositions.

## Controlled vocabulary

### Applicability

- `APPLICABLE`: the object is within the declared audit question and must be inspected.
- `NOT_APPLICABLE`: evidence shows that the audit question does not apply to this object.
- `UNDETERMINED`: available evidence cannot establish applicability. This is incomplete accounting, not an exclusion.

### Coverage disposition

- `PENDING_INSPECTION`: applicability, identity, and producer-owned inventory/accounting have been established, but the producing phase's contract explicitly assigns correctness inspection to a named downstream consumer. It makes no correctness judgment and implies no missing, inaccessible, conflicting, external, or untraceable evidence for the producer-owned work.
- `CORRECT`: inspection found current evidence that the applicable object satisfies the audited invariant at this resolution, with no supported active correctness finding.
- `FINDING`: one or more active correctness findings meeting the Finding Schema are linked to the object.
- `NOT_APPLICABLE`: the object was enumerated but the declared audit question does not apply; a rationale is required.
- `EXTERNAL_BOUNDARY`: inspection reaches an explicit external or manual evidence boundary. Record what static evidence establishes, what it cannot establish, and the required external evidence.
- `UNVERIFIABLE`: required evidence is missing, inaccessible, conflicting, or untraceable and no justified correctness conclusion can be made.

Compatibility rules:

- `NOT_APPLICABLE` requires applicability `NOT_APPLICABLE`.
- `PENDING_INSPECTION`, `CORRECT`, and `FINDING` require applicability `APPLICABLE`.
- `PENDING_INSPECTION` requires a producing-phase contract that explicitly defers correctness judgment, plus a non-`NONE` downstream inspection owner and obligation. Its evidence references must establish the object's identity, applicability, and completed producer-owned accounting; correctness evidence is not yet required.
- `PENDING_INSPECTION` uses `DIRECT` or `INFERRED` evidence strength for the producer-owned inventory and accounting. `INCOMPLETE` or `EXTERNAL` evidence for a producer-owned requirement cannot support it.
- `PENDING_INSPECTION` must not hide missing, inaccessible, conflicting, external, or untraceable evidence required by the producer's own contract. Use `UNVERIFIABLE` or `EXTERNAL_BOUNDARY` as applicable when such a limitation exists.
- `PENDING_INSPECTION` is not correctness closure. The named correctness-audit consumer must inspect the object and replace `PENDING_INSPECTION` with an evidence-supported current disposition during its exhaustive audit.
- For every disposition other than `PENDING_INSPECTION`, `Downstream inspection owner` and `Downstream inspection obligation` are normally `NONE`; retain a non-`NONE` value only when another explicit downstream obligation remains and the producing phase contract requires it.
- `EXTERNAL_BOUNDARY` normally requires applicability `APPLICABLE`; use `UNDETERMINED` only when the boundary also prevents deciding applicability.
- `UNVERIFIABLE` may accompany `APPLICABLE` or `UNDETERMINED`, with the missing evidence stated.
- A row with a supported open finding remains `FINDING`; acceptance, deferral, or implementation without verification does not convert it to `CORRECT`.
- `INCOMPLETE` or `EXTERNAL` evidence alone cannot support `CORRECT`.

## Authorized scope-delta record

Do not silently alter a frozen denominator. Record each change as:

```text
Scope-delta ID:
Authorization source:
Reason:
Repository commit interval:
Prior search-space ID / version:
Resulting search-space ID / version:
Added object IDs: NONE | <IDs>
Removed or no-longer-applicable object IDs: NONE | <IDs>
Reclassified object IDs: NONE | <IDs>
Effect on prior findings or boundaries:
Evidence references:
```

Removal never deletes historical rows. Retain the object and record why its current applicability or identity changed.

## Cross-level ancestry continuity

When an upward invalidation affects a parent conclusion, record every descendant row whose validity may depend on it and the exact dependency. Do not cascade the effect to unrelated descendants. Classify the evidence-backed dependency effect in the linked reconciliation record as one of:

1. `UNAFFECTED`: ancestry and the row's own claim do not depend on the challenged conclusion;
2. `ANCESTRY_DEPENDENT_POTENTIALLY_REUSABLE`: evidence or object identity may remain useful, but the row cannot be current authoritative ancestry until replacement-parent reconciliation succeeds;
3. `INVALIDATED_OR_STALE_FOR_CURRENT_USE`: identity, scope, conclusion, or parentage materially depends on the challenged conclusion; or
4. `REQUIRES_REENUMERATION_OR_REINSPECTION`: the replacement may change denominator, applicability, identity, ownership, or an inspection obligation.

These are dependency-effect descriptions, not Coverage Matrix dispositions or artifact statuses.

For every row considered during descendant reconciliation, record:

```text
Descendant reconciliation record ID:
Old parent handoff reference:
Replacement parent handoff reference:
Old descendant Search-space ID / version:
Old descendant denominator-rule reference:
Candidate / Object ID and prior-row reference:
Current Coverage disposition:
Disposition provenance: ORIGINATED_BY_CURRENT_RUN | CARRIED_FORWARD_FROM_PRIOR_AUTHORITATIVE_RUN
Disposition source audit-run / row reference:
Carried finding / verification / closure references: NONE | <references>
Challenged parent claim and dependency: NONE | <claim + evidence>
Dependency effect:
Replacement parent Object / Boundary / Domain references:
Current repository evidence:
Reconciliation action: RETAIN_UNCHANGED | UPDATE_PARENT_REFERENCES | RECLASSIFY_APPLICABILITY | MOVE_OR_REPARENT | SPLIT_OR_MERGE | REMOVE_FROM_CURRENT_MEMBERSHIP | ADD_NEW | REENUMERATE | REINSPECT
Authorized scope-delta reference: NONE | <DELTA-* ID>
Enumeration continuity evidence:
Correctness-obligation continuity evidence:
Disposition continuity evidence: NOT_APPLICABLE | <evidence/reference>
Correctness re-inspection required: NO | YES + <reason and owner>
Current-authority determination and evidence:
```

The `Reconciliation action` values describe the operation applied to a row; they are not correctness dispositions, finding dispositions, completeness statuses, stopping-boundary statuses, or next-expansion statuses.

Retain an existing descendant enumeration only when evidence proves the object still exists; its resolution and parent ancestry remain valid; its denominator rule is unchanged or it remains fully represented under the changed rule; applicability and grouping/splitting identity are unchanged; no sibling addition or removal falsifies the prior exhaustiveness claim; producer-owned evidence remains valid; and no invalidation affects its own current claim. Preserve its stable Object ID. Updating only parent provenance or a reference does not require a scope delta when logical object identity, denominator membership, and applicability are unchanged.

Use an authorized scope delta when replacement-parent reconciliation changes descendant denominator membership, identity, grouping, splitting, or applicability. Re-enumerate the exact affected parent/sibling denominator when replacement parent state invalidates the prior denominator rule or exhaustiveness claim. Preserve removed, superseded, split, and merged rows historically and link their replacements; never renumber unchanged candidates or hide an omission through a delta.

A descendant correctness conclusion is reusable only when evidence proves its exact correctness obligation and relevant evidence remain unchanged. Require re-inspection for a correctness-relevant change in ownership, authority source, lifecycle, contract, applicability, parent invariant, execution target, external/manual assumption, grouping/splitting, sibling interaction, identity/collision domain, denominator membership, or exact obligation. Do not require re-inspection for a provenance-link update alone, and do not retain correctness merely because code lines are unchanged.

An unresolved parent invalidation or incomplete required reconciliation makes affected rows unavailable as current authoritative ancestry and blocks affected current coverage-completeness, closure, and consumer-gate claims. It does not rewrite the historical ledger's original status.

## Completion rules

Coverage is complete at the declared resolution only when all of the following pass:

1. The search-space identity, denominator rule, audit level, and repository provenance are recorded.
2. Candidate enumeration was completed before findings were finalized.
3. Every candidate in the denominator has exactly one current row; no object is silently omitted or duplicated.
4. Every row has an explicit, compatible applicability, coverage disposition, disposition provenance, and source audit-run/row reference.
5. Every `PENDING_INSPECTION`, `CORRECT`, or `FINDING` row has evidence references and an evidence strength. Every `PENDING_INSPECTION` row also has a valid downstream inspection owner and obligation supported by the producing-phase contract.
6. Every `FINDING` row resolves to at least one Finding Schema record, and every finding resolves back to one or more object rows.
7. Every `EXTERNAL_BOUNDARY` or `UNVERIFIABLE` row states the boundary or missing evidence and its effect on the conclusion.
8. Every `PENDING_INSPECTION` row represents completed producer-owned work rather than a missing producer obligation, and its named consumer can safely perform the deferred correctness inspection.
9. All parent, evidence, finding, external-boundary, verification, closure, downstream-owner, and scope-delta references resolve.
10. Every denominator change is represented by an authorized scope delta.
11. Every stopping-boundary claim is supported by the rows it says are closed.
12. Every invalidation affecting parent ancestry is referenced and each potentially affected row has an evidence-backed dependency and current-authority determination.
13. When a replacement parent handoff applies, every prior current row is reconciled exactly once; no row is silently retained, removed, or added.
14. Every retained row proves enumeration and ancestry continuity, every membership/identity/applicability change has an authorized scope delta, and every required re-enumeration or correctness re-inspection is explicit.
15. Every carried-forward disposition resolves to its prior authoritative audit-run and row, has evidence that the exact correctness obligation and correctness-relevant evidence remain unchanged, and preserves all finding, verification, and closure references required by that disposition.
16. No affected current ledger or consumer gate passes while required parent closure, replacement handoff, or descendant reconciliation remains unresolved.

`COMPLETE_WITH_RECORDED_LIMITATIONS` is permitted only when accounting is complete and all limitations are explicit and bounded. Valid `PENDING_INSPECTION` rows do not by themselves make coverage `INCOMPLETE` or require `COMPLETE_WITH_RECORDED_LIMITATIONS`; a producer Coverage Matrix may be `COMPLETE` when its own contract and evidence are complete even though a named downstream correctness inspection remains. An undispositioned, unreferenced, or `UNDETERMINED` object makes coverage `INCOMPLETE`.

## Closure-rerun rules

A closure rerun must use the same Search-space ID and re-inspect:

- every original applicable object;
- every retained object whose applicability changed; and
- every object added by an authorized scope delta.

Each row must link to its prior-run row, preserve historical finding references, and record current verification evidence. Closure requires all applicable rows to be refreshed and zero rows with remaining supported active correctness findings. `ACCEPTED_RISK`, `DEFERRED`, `REMEDIATED_PENDING_VERIFICATION`, and unresolved findings remain supported findings for this test.

The correctness-audit consumer must replace every inherited `PENDING_INSPECTION` state it owns with `CORRECT`, `FINDING`, `EXTERNAL_BOUNDARY`, or `UNVERIFIABLE` as supported by its inspection evidence, or with `NOT_APPLICABLE` only when current evidence and any required authorized scope delta change applicability accordingly. A correctness-audit or closure-rerun matrix cannot claim correctness closure while any applicable row remains `PENDING_INSPECTION`; a closure rerun must contain no current `PENDING_INSPECTION` rows.
