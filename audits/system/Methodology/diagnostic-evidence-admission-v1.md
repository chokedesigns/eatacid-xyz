# Diagnostic Evidence Admission v1

Protocol ID: EA-XYZ-DIAGNOSTIC-ADMISSION-v1
Authority: `2026-10-29-project-owner-decision.md` / EA-XYZ-METHODOLOGY-2026-10-29-v1.
Effective date: 2026-10-29 (America/Chicago).
Purpose: separate evidence-backed change accounting, outside finding-derived ticket provenance. "Non-finding repository change provenance" describes accounting outside an allocated audit finding; it does not assert that no correctness defect existed.

## Scope and activation

Only the following existing tuples are eligible for future individual evaluation, never automatic admission. Repository identity includes its resolved root and separate Git boundary; all rows are in `admin-ui`.

| DIAG / CAND identity | Full commit | Direct parent | Exact original summary |
| --- | --- | --- | --- |
| DIAG-EA-XYZ-PRE6-003 / CAND-DCR-003 | e13a427df23b5525cc00afff8466a42e54fd179f | e2a320cc76cb45f6713ace2413eb5bce5ffeb8b8 | DIAG-EA-XYZ-PRE6-003: guard Treasury requests after session invalidation |
| DIAG-EA-XYZ-PRE6-001 / CAND-DCR-001 | b871d14ca275611f01eaa3294065736aadf6bc1d | e13a427df23b5525cc00afff8466a42e54fd179f | DIAG-EA-XYZ-PRE6-001: own asynchronous Pause publications |
| DIAG-EA-XYZ-PRE6-002 / CAND-DCR-002 | 10af957d3cc29a6defaaf955b0d697a0ae74a420 | b871d14ca275611f01eaa3294065736aadf6bc1d | DIAG-EA-XYZ-PRE6-002: reject malformed Pause storage evidence |

The owner decision approves methodology implementation only. Before production or use, obtain a separate durable execution decision naming producer, independent reviewer, consumers, conflict handling, exact sealed sources, output locations, protocol/consumer editions and scope. No source work, admission, helper execution or Phase 3 follows from adoption alone. Future consumers must pin this protocol, owner decision, both helper instructions, Handoff Schema and validation helper by SHA-256; they must reject stale/incompatible editions. Legacy operation without this route retains its existing inputs and semantics.

## Evidence production and individual review

Issue one complete versioned classification supplement plus a sealed input manifest and independent review. Stable record key is resolved repository root + full commit + existing DIAG identity; keep its CAND identity. All three scoped candidates must be accounted for individually, including rejected/unresolved entries. Do not omit a failed candidate to claim completeness. Editions are append-only with prior-edition hashes, supersession/revocation references and reasons; conflicting editions block use until resolved. Never silently edit sealed records.

The producer must supply, and the independent reviewer must read and validate:

1. The original dated implementation instruction or independently authenticated contemporaneous authorization, with identity, exact permitted scope and evidence locator. A diagnostic plan, later acknowledgement, methodology approval, or producer assertion alone is insufficient and cannot fabricate past permission.
2. The sealed pre-remediation candidate/adjudication/work plan, actual discovery context, and implementation/criterion receipts. Preserve each criterion's target, evidence, uncertainty and external/manual limits. Hashes establish bytes, not execution/authorship authenticity. Local acceptance is not current formal verification.
3. Exact immutable commit, all parents, tree, original summary, changed paths and old/new blob identities, original patch/stat bytes and hashes, complete P2-base-to-current log reference, repository root/boundary/branch/full HEAD/worktree basis and ancestry evidence. Preserve original serialization, including PRE6-001's full-index patch. Do not reconstruct missing authority from chronology.
4. A positive rationale comparing authoritative P2/latest-failed-P3/checklist obligations and discovery sources. Explain why separate diagnostic accounting does not conceal required finding-to-ticket remediation. Shared subject matter, no Ticket ID, or SUPPORTED local defect status alone is insufficient. Actual formal obligations still require their original provenance; never attach these diagnostics to T022/T023 or manufacture FIND-P3 IDs, aliases, empty mapping commits or retrospective tickets.
5. Historical and current continuity claims with separately identified exact targets/evidence. Accounted historical implementation can coexist with UNVERIFIABLE current correctness. Retain original formal association UNTRACED, historical unresolved references, previous classifications and original summaries permanently.

The admitted input manifest enumerates every permitted source by exact path, byte count, SHA-256, purpose and evidence locator, including original authorization, sealed candidate/supplement records and their manifests, needed original criterion/export receipts, formal-source comparisons, full provenance interval and repository snapshot. Only these explicitly supplied sources may be read; neither helper may inspect repositories, reconstruct history or fetch unlisted sources. Missing sources require a new authorized source set, never opportunistic dereferencing.

An independent reviewer, distinct from record author and implementation-claim author, records a dated PASS/FAIL with reasons and exact source references for each obligation: original authorization, immutable identity, sealed evidence, positive non-finding rationale, formal non-duplication, current authority and bounded continuity. The execution decision must appoint these actors; distinct strings or repeated hash checks alone do not prove independence. Each consumer must independently read the declared evidence and validate its own contract; neither producer ADMIT nor a software PASS compels acceptance.

Per-record procedural decisions:

- ADMIT: all obligations pass; classification may be `non-finding repository change provenance` after consumer validation.
- REJECT: contradictory identity, unauthorized/out-of-scope work, altered/falsified evidence or inapplicable non-finding rationale. Classification NOT_ESTABLISHED.
- UNRESOLVED: missing/ambiguous authorization, evidence, compatibility or positive rationale. Classification NOT_ESTABLISHED.

These are admission procedure values, not checklist states, findings, verification results or handoff completeness values. Preserve each decision, reasons, missing evidence, responsible owner and consumer effects. Rejected/material unresolved records retain UNTRACED/INCOMPLETE effects. Each consumer can refuse an otherwise admitted record. Revocation requires an appended owner-authorized dated decision, exact affected keys/editions/consumers and reasons; suspend affected use and independently reconcile descendants under existing continuity rules. Rollback affects future methodology authority only and never erases records or reverts source work automatically.

## Machine-readable validation boundary

`../validation/diagnostic_accounting.py` is a pure, non-mutating mechanical validator shared by both amended helpers. It does not issue admission, run reconciliation/synthesis, inspect Git or infer correctness. Its `account(entries, ticket_ids, consumer, mode, bundle=None, context=None)` returns separate formal mappings, ticket provenance and diagnostic accounting. Supply the entire complete-log entry list with `repository`, `commit`, exact `summary`; diagnostic entries additionally carry `parents` and `tree` from declared immutable evidence. Formal Ticket IDs use exact token boundaries, never decorations or substring matches. The caller validates full-log scope/freshness and all ordinary helper gates before calling; missing/incomplete log input must still produce UNTRACED ticket states under the original helper contract. `account` requires that preflight as `log_complete=True`; otherwise it fails closed.

No bundle leaves legacy formal mapping unchanged; unmatched entries remain UNTRACED. A bundle is permitted only for REC/REMEDIATION_RECONCILIATION or TRACE/PHASE_3_RERUN. Other modes reject it. The future independently verified `context` contains:

- `protocol_sha256`, `owner_decision_sha256`, `consumer_sha256`: trusted current edition pins, obtained from the approved implementation/export, never from the supplement itself.
- `execution_sha256`: pin of the separate later execution decision; `actors`: exactly `producer`, `implementation_author`, `reviewer`, `consumer`, appointed and independently authenticated by that decision.
- `roots`: trusted repository-to-resolved-root identities; `evidence`: explicitly admitted source ID -> exact supplied bytes. The consumer checks source identity/purpose and authority, not just bytes.

Bundle fields: `protocol` (the ID above), `edition` (positive integer), `prior_edition` (NONE or sealed reference), `current_authority` (YES), the three edition pins, `execution_sha256`, `actors`, `sources` (each `id`, `path`, `bytes`, `sha256`, `purpose`), `records`, and `consumer_reviews`. Supply pins/reviews for the current invocation's consumer edition. All required source classes and exact locators are represented by the record's evidence references below; protocol, owner and execution bytes must resolve as sources, too.

Each record contains `repository`, `root`, `commit`, `parents`, `tree`, `summary`, `diag_id`, `candidate_id`, `key` (root + `|` + commit + `|` + DIAG), `edition`, `prior_record`, `revocation` (NONE for usable records), `decision`, `classification`, `original_formal_association` (UNTRACED), `historical_unresolved_refs`, `rationale`, `limitations`, `gaps`, and `evidence_refs`. Evidence refs map each obligation named below to a nonempty list of `{source, locator}` objects from the sealed source manifest. They must cover authorization, immutable identity (including complete log/ancestry/patch/stat/blob sets), sealed evidence (including candidate/criteria receipts), non-finding rationale, formal non-duplication, current authority and continuity. Sources contain the actual evidence, not self-certifying checks.

`review` and the matching `consumer_reviews[key]` each contain `actor`, `date`, `decision`, `reason`, and `checks`. Checks are exactly `original_authorization`, `immutable_identity`, `sealed_evidence`, `nonfinding_rationale`, `formal_nonduplication`, `current_authority`, `continuity`; each has `result` PASS/FAIL, a nonempty `reason`, and nonempty `evidence_refs` from the same obligation's source set. ADMIT requires every check PASS and no material gaps. A consumer review is a separately performed validation against its own inputs/edition, not a copy of the admission review. Negative decisions remain individually visible even when mechanical validation fails.

Required nonempty record evidence-reference obligations use those same seven names. The consumer must validate all source contents and detailed obligation fields in the preceding sections; the helper checks seals, links, scope, decisions and accounting only. It reports unresolved/rejected classification and errors without granting current verification, delivery completeness or closure. A source mismatch, unknown/orphan/duplicate record, root/commit/parent/tree/summary disagreement, stale edition, missing authorization, reviewer conflict or failed/missing consumer review prevents positive accounting. Full-log union and reverse record links must reconcile with no omissions or double counting, including existing formal/derived mappings under their unchanged rules.

## Consumer output and preserved gates

REC keeps every original checklist row/status/history and its three existing implementation-provenance values. Only an exact original summary Ticket ID gives PROVENANCE_FOUND. Its separate register carries repository/full commit, DIAG/CAND key, original UNTRACED association, current accounting, protocol/record edition/hash, owner/execution/reviewer references, consumer validation, rationale/source locators, limitations and gaps. One commit counts once even if it has multiple formal edges. An admitted diagnostic supplies no formal finding/ticket/trace row.

TRACE PHASE_3_RERUN independently validates the same complete supplement under its own pins/review and reconciles it to the full fresh log and REC register. It preserves all finding/trace records and histories, original unmatched associations and controlled UNKNOWN/UNVERIFIABLE/NOT_RUN/NONE meanings. INITIAL synthesis is unchanged. Retain already supported derived-work change accounting without converting it to diagnostic provenance.

Both helpers retain mandatory full fenced-response delivery and external-copy rules. Historical INCOMPLETE delivery cannot be cured by a new file or this amendment. Classification is independent of acceptance, current-head verification, response delivery and handoff completeness. Every applicable Handoff INCOMPLETE condition and Phase-3 entry/closure gate still applies; COMPLETE_WITH_RECORDED_LIMITATIONS cannot bypass a failure. Phase 3 independently revalidates current evidence, inspects the whole current denominator and owns rerun rows, verification, dispositions and closure. No pre-populated Phase-3 fields or readiness claim is authorized.
