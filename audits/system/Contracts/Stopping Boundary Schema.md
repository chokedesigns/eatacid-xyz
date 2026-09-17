# Stopping Boundary Schema

## Purpose

The Stopping Boundary records the finest resolution a producing phase actually established for its declared question about a domain or object. It distinguishes closure of that producer-owned current-resolution question from a different downstream correctness question and from finer-resolution expansion. It also owns the record used when deeper evidence invalidates an earlier conclusion.

A stopping boundary does not replace Coverage Matrix rows. It summarizes only closure supported by those rows and their evidence. Boundary closure is scoped to `Current-resolution question`; it is not global correctness closure unless that question is itself the applicable correctness-closure question.

## Boundary status

Use exactly one boundary status:

- `CLOSED`: the producing phase's declared current-resolution question is completely dispositioned, its coverage/accounting obligations are complete, and its conclusion has no material recorded limitation. A distinct downstream inspection may still be pending.
- `CLOSED_WITH_RECORDED_LIMITATIONS`: current-resolution accounting is complete, but explicitly bounded external/manual or other material limitations remain.
- `OPEN`: a producer-owned current-resolution inspection or accounting obligation, supported finding, remediation, verification, or other required conclusion remains open.
- `UNTRACED`: available artifacts do not establish what was covered or where the level stopped.

`CLOSED` and `CLOSED_WITH_RECORDED_LIMITATIONS` close only the stated producer-owned question. Neither implies a downstream correctness judgment that is listed as not claimed or pending. Ordinary downstream work on a different question does not make the producer boundary `OPEN`. `CLOSED_WITH_RECORDED_LIMITATIONS` is not an unqualified correctness claim. `UNTRACED` is never equivalent to closed.

## Next-expansion status

Use exactly one:

- `ELIGIBLE`: evidence identifies one or more first finer-grained candidates.
- `NO_EXPANSION_JUSTIFIED`: evidence supports stopping at the current resolution.
- `EXTERNAL_ONLY`: the next relevant evidence is outside the repository or requires manual/live validation.
- `UNDETERMINED`: evidence is insufficient to identify or reject a finer expansion.

Do not invent a child to avoid `NO_EXPANSION_JUSTIFIED` or `UNDETERMINED`. `UNDETERMINED` caused by required missing evidence prevents a complete handoff to a consumer that needs the finer input.

Next-expansion status describes only expansion to a finer resolution. A same-level downstream consumer obligation, such as a later correctness audit of an upstream inventory, is recorded separately and is not a finer-grained child or an `ELIGIBLE` next-expansion decision.

## Stopping-boundary record

Create one record for every phase-required domain or closed parent object:

```text
Boundary ID:
Search-space ID / version:
Repository identity reference:
Source level / phase:
Domain ID / name:
Object ID: NONE | <object ID>
Parent boundary ID: NONE | <boundary ID>
Current-resolution question:
Current-resolution unit of analysis:
What has been established at this resolution:
Evidence basis:
Coverage-row references:
Finding references: NONE | <finding IDs>
What is explicitly closed:
What is explicitly not claimed:
Downstream consumer obligations: NONE | <responsible level / phase / consumer + pending question or action + affected object IDs>
Boundary status: CLOSED | CLOSED_WITH_RECORDED_LIMITATIONS | OPEN | UNTRACED
Next-expansion status: ELIGIBLE | NO_EXPANSION_JUSTIFIED | EXTERNAL_ONLY | UNDETERMINED
First eligible finer-grained expansion area/object: NONE | <candidate description or stable ID>
No-expansion reason: NONE | <reason>
External/manual limitation references: NONE | <EXT-* IDs>
Uncertainty / untraced state: NONE | <description and missing evidence>
Reopening status: NOT_REOPENED | REOPENED | RECLOSED
Upward-invalidation references: NONE | <INVALID-* IDs>
Invalidated-by reference: NONE | <INVALID-* ID>
Replacement boundary reference: NONE | <Boundary ID>
Replacement handoff reference: NONE | <handoff ID/version>
Reclosure evidence references: NONE | <references>
Descendant reconciliation evidence: NONE | <references>
Current-authority determination: CURRENT | HISTORICAL_ONLY + <evidence/reference>
Source references:
```

Field rules:

- `What is explicitly closed` names the exact domain/object set and resolution supported by the Coverage Matrix; broad phrases such as "important areas" are insufficient.
- `What is explicitly not claimed` prevents the boundary from implying inspection below its resolution or across an external/manual limit.
- `Downstream consumer obligations` is required when linked rows are `PENDING_INSPECTION` or another phase owns a distinct remaining question. It names the responsible consumer, the question/action, and affected Object IDs. It does not alter next-expansion status.
- A producer boundary may be `CLOSED` with linked `PENDING_INSPECTION` rows when identity, applicability, inventory, accounting, and the producer-owned current-resolution conclusion are complete; the deferred correctness question and owner must appear in `What is explicitly not claimed` and `Downstream consumer obligations`.
- Use `OPEN` only for a genuinely incomplete producer-owned obligation. Do not use it merely because a named downstream consumer has not yet performed a different question that the producer was not required to answer.
- `ELIGIBLE` requires at least one first finer-grained candidate. The next level must enumerate the complete finer denominator; this field is an input, not permission to inspect only the named candidate.
- `NO_EXPANSION_JUSTIFIED` requires an evidence-based reason such as current resolution sufficiency, no independently meaningful finer correctness object, or non-applicability.
- `EXTERNAL_ONLY` requires an external/manual boundary reference and states the evidence needed.
- `UNDETERMINED` requires the missing evidence to be recorded; do not disguise uncertainty as a no-expansion decision.
- A boundary with a remaining supported active finding owned by its `Current-resolution question` cannot be `CLOSED`. A finding or pending inspection tied only to a distinct downstream question must be carried explicitly but does not by itself reopen the producer-owned boundary.
- An open upward invalidation forces the current boundary continuity record to `Reopening status: REOPENED` and prevents a current-authority `CLOSED` claim until the owning level re-adjudicates it; it does not rewrite the preserved historical boundary's original status.
- A historically closed boundary is not rewritten when later invalidated. Preserve its original status and record `Current-authority determination: HISTORICAL_ONLY` with the invalidation reference. The owning resolution creates or versions the replacement boundary and records `RECLOSED` only after its required re-adjudication and reclosure workflow succeeds.
- A deeper discovering phase does not close or reclose the earlier phase's boundary. It records the contradiction, applies the interim restriction, and hands the producer-owned question back.
- `Current-authority determination` is continuity metadata, not a boundary status. Record it in the current boundary register or replacement chain without mutating the preserved historical boundary artifact.

## Upward-invalidation trigger

Record a discrepancy whenever current evidence materially conflicts with an inherited historical statement, reference, scope claim, identity, or conclusion. Then separately decide whether the conflict qualifies for formal upward invalidation.

Emit an `UPWARD INVALIDATION` only when explicit evidence shows that the conflict contradicts a producer-owned conclusion whose continued validity is necessary for current descendant ancestry or downstream claims. Applicable challenged conclusions include object identity, parent-child ownership, applicability, denominator membership, domain ownership, correctness or finding disposition, closure conclusion, stopping boundary, next-expansion decision, external/manual or provenance assumption, and a handoff consumer-entry condition.

Do not emit formal invalidation merely because a deeper child adds compatible detail, a normal deeper finding exists beneath a correctly modeled parent, optional coherence or derived work appears, or the parent remains valid at its declared resolution. The record must explain why the parent conclusion is contradicted rather than refined.

The discovering level must preserve the earlier historical conclusion and return the exact reopened question to the phase and resolution that produced it. It must not silently broaden its own scope to answer, repair, close, or reclose the parent-level question.

## Upward-invalidation record

```text
Upward-invalidation ID:
Status: OPEN | RESOLVED
Discovering level / phase:
Discovering Search-space ID / version:
Discovering Audit-run ID:
Contradictory evidence:
Evidence strength: DIRECT | INFERRED
New finding reference: NONE | <finding ID>
Challenged producer artifact ID / version:
Challenged producer level / phase:
Challenged Search-space ID / version:
Challenged Object IDs: NONE | <IDs>
Challenged Domain IDs: NONE | <IDs>
Challenged Boundary IDs: NONE | <IDs>
Challenged Finding IDs: NONE | <IDs>
Exact historical conclusion being preserved and challenged:
Exact contradiction to the producer conclusion:
Exact producer-owned question reopened:
Reason the conclusion no longer supports current ancestry:
Why this is contradiction rather than refinement:
Owning phase / resolution for re-adjudication:
Ownership handback / required producer work:
Affected descendant artifact / Search-space references: NONE | <references>
Affected descendant Object / Candidate IDs: NONE | <IDs>
Descendant dependency-impact record references: NONE | <references>
Interim downstream restriction:
Required replacement evidence:
Required upstream work and reclosure:
Re-adjudication artifact references: NONE | <references>
Remediation references: NONE | <references>
Reclosure audit-run and boundary references: NONE | <references>
Replacement producer artifact reference: NONE | <reference>
Replacement handoff reference: NONE | <reference>
Replacement boundary reference: NONE | <Boundary ID>
Descendant reconciliation references: NONE | <references>
Final resolution reference and current-authority determination:
```

An upward invalidation is not a finding disposition, remediation status, scope delta, new finding by itself, replacement closure, descendant fix, or permission for the deeper phase to repair the producer. `OPEN` and `RESOLVED` are the invalidation record's existing state only; they do not redefine any other schema status.

## Ownership handback, reclosure, and replacement authority

An upward invalidation is `RESOLVED` only when the owning resolution:

1. preserves the original historical record;
2. re-adjudicates the exact reopened producer-owned question;
3. uses authorized scope-delta/versioning when its denominator changes;
4. links any required remediation for a supported defect;
5. reruns the appropriate closure workflow over the resulting current denominator;
6. obtains valid replacement closure and boundary evidence; and
7. issues a validated replacement handoff that supersedes the prior handoff for current authority.

A code change, fix commit, informal "handled" statement, or descendant workaround does not resolve an invalidation. Resolution does not erase the record or make every descendant current. Descendant resume remains blocked until the affected consumer completes reconciliation against the replacement handoff.

For a challenged stopping boundary, the invalidation must trace the exact challenged claim, child/descendant dependencies, reopening effect, owning resolution, interim downstream restriction, required reclosure, replacement boundary/handoff, reclosure evidence, descendant reconciliation evidence, and final current-authority determination. The owner alone closes or recloses its boundary.

## Descendant dependency and reconciliation effects

Create or reference an evidence-backed dependency-impact record for every descendant claim that may depend on the challenged conclusion, including descendant Search-space identities/versions, candidate/object ancestry, Coverage Matrix rows, findings, derived work, stopping boundaries, consumer handoffs, expansion eligibility, closure claims, and external/manual assumptions.

Classify each actual dependency as:

1. `UNAFFECTED`: ancestry and the descendant's own claim do not depend on the challenge;
2. `ANCESTRY_DEPENDENT_POTENTIALLY_REUSABLE`: evidence may remain useful, but current-authority use is suspended until reconciliation;
3. `INVALIDATED_OR_STALE_FOR_CURRENT_USE`: identity, scope, conclusion, or parentage materially depends on the challenge; or
4. `REQUIRES_REENUMERATION_OR_REINSPECTION`: replacement state changes or may change denominator, applicability, identity, ownership, or inspection obligation.

These are dependency-effect descriptions, not new boundary statuses, completeness statuses, finding dispositions, or Coverage Matrix dispositions. Do not invalidate a descendant without a demonstrated dependency, and do not retain one without demonstrated ancestry continuity. Unaffected siblings and descendants remain available when their independence is evidenced.

After a validated replacement handoff exists, the descendant owner must reconcile every previously current descendant as retained unchanged, retained with updated references/provenance, applicability-reclassified, moved/reparented, split/merged, removed from current membership while preserved historically, newly added, re-enumerated, or correctness-reinspected. Use Coverage Matrix scope deltas only when denominator membership, identity, grouping, or applicability changes. Re-enumerate affected siblings when the replacement invalidates the prior denominator rule or exhaustiveness claim. Re-inspect correctness only when the correctness obligation or relevant evidence changes.

## Register validation

A stopping-boundary register passes only when:

1. every domain or object required by the producing phase has one record;
2. every closure claim resolves to complete Coverage Matrix rows and evidence;
3. open findings and limitations are represented accurately;
4. every downstream consumer obligation is explicit, resolves to its affected objects, and is not conflated with finer-resolution expansion;
5. next-expansion and no-expansion fields are internally compatible;
6. no unsupported finer child is invented;
7. every external/manual and untraced state is explicit;
8. every material conflict has a discrepancy and every formal upward invalidation includes evidence that its trigger is met;
9. every upward invalidation resolves to the exact producer artifact, question, object/domain/boundary/finding references, and owning resolution it reopens;
10. every potentially affected descendant has a traceable dependency-impact determination and interim restriction;
11. every resolved invalidation has owning-resolution re-adjudication, required reclosure, replacement boundary/handoff, and current-authority evidence;
12. historical boundary status and evidence remain preserved when current authority is superseded;
13. no affected downstream handoff or gate passes over an open required parent invalidation or incomplete required reconciliation; and
14. every downstream handoff receives the current reopening, replacement, dependency, and pending reconciliation information needed without conversational memory.
