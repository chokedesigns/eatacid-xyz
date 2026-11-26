# AUD-011 — Correctness Investigation

Status: **COMPLETE / NOT CLEAN — final reconciliation, 2026-11-25.** All seven
source-examination batches and 40 bounded scopes are reconciled. Fifteen
independent material source findings remain confirmed and unresolved. One
additional nonmaterial display discrepancy is retained separately. No production
remediation, clean-result refresh, live integration or deployment certification.

## Final disposition and evidence boundary

Reviewed and finally tested source: Outer
`2453358c8cf91d4db3bc24e447ed0859f91216e8`; independent Admin
`d8636e957d3974ba73882d9d29242898f10ed3e0`; both remain on
`ticket-AUD-011-full-correctness-review`. The working-tree delta contains only
Outer audit documentation and inert evidence entrypoints. Installed Windows
Node `v22.16.0`, npm `10.4.0`, Beacon SDK `4.8.1` and existing dependencies were
used without installation/upgrade. Testnet means Shadownet; Mainnet is not enabled.

The [final coverage reconciliation](coverage.md#aud-011--final-reconciliation-2026-11-25)
accounts for initial W01–W39, subsequently discovered W40, all original 33
workflows and all 20 consolidated groups. The seven examinations were reused,
not repeated. No consequential source obligation lacks a batch owner. Their
explicit source stop boundaries do not imply external systems were exercised.
Historical planning statuses and batch-time deferred statements below are
superseded by this section and the final verification ledger in coverage.

All fifteen provisional material observations are **confirmed source failures**
with final **P2** severity. Conditional defects require operator-authored
configuration (including B2-001's ineligible HEN redeem), malformed CMS data,
stalled provider, overlapping lifecycle work or storage-fault schedule. These are reachable conditions, not
assertions of live incidents. Decisive source traces and distinguishing controls
establish the defects; wallet acceptance, chain application, incidence and loss
remain unverified. P2 reflects demonstrated intent/configuration, availability,
readiness or recovery effects. No unsupported material hypothesis is retained
as a confirmed finding.

Each linked original entry retains its exact source locations, entrypoint,
conditions, invariant, observable consequence and reproduction qualifications.
The last column gives the bounded remediation and [checklist](remediation-checklist.md) item.

| Finding / final disposition | Reachable entry, consequence and evidence quality | Remediation boundary / checklist |
| --- | --- | --- |
| [E2 SDK account binding](#validated-finding--admin-intent-can-be-rebound-to-another-sdk-account) — confirmed P2, account-transition schedule | Six Admin writers and both Public send handlers accept A before native Beacon captures B. Actual installed getter/setter/request/peer methods, unchanged-A/event-first controls. Admin receipts retain A; [Public's sender matcher](#e2-extension--public-intent-and-retained-journal-can-also-disagree-with-sdk-source) cannot settle A's receipt from terminal B evidence. | Bind accepted account to actual request and attributed recovery; preserve permission, contract and uncertain-send gates. `2.1`. No authorization bypass or successful wrong-account operation established. |
| [B2-001 ineligible HEN redeem admission](#aud-011-b2-001--hen-redeem-is-admitted-despite-its-burn-only-role) — confirmed conditional P2, corrected | HEN is burn-side only by the AUD-011 correction requirement. CREATE/EDIT offers it as redeem; real form→service→writer commits it. Canonical `141634` and native `6` both pass validation; neither is an eligible HEN redeem. | Enforce the HEN role restriction at selector and authoritative admission/runtime boundaries, preserving HEN burns and canonical exclusions. `0.1`. Translation is not the remedy; chain effects unverified. |
| [B2-002 unscheduled snapshots](#aud-011-b2-002--valid-unscheduled-canonical-content-prevents-admin-initialization) — confirmed conditional P2 | Supported manual unscheduling passes canonical schema/projection/service equality; production provider throws, development retires params. Active/exact-inactive controls succeed. | Align both Admin providers with authoritative admitted unscheduled domain, retaining drift/invalid retirement. `0.2`. Current active snapshot unaffected. |
| [B2-003 authoring recovery](#aud-011-b2-003--healthy-polls-cannot-restore-authoring-controls-after-busyrecovery) — confirmed P2 | Actual scheduled monitor after lock release or explicit journal reconcile leaves BUSY/recovery controls disabled despite READY provider. Healthy startup/explicit refresh controls recover. | Restore controls on verified health recovery without weakening writer/journal blocking. `1.3`. No writer corruption shown. |
| [B2-004 snapshot binding](#aud-011-b2-004--a-supported-concurrent-commit-can-misbind-snapshot-version) — confirmed conditional P2 | Real snapshot reads overlap supported locked EDIT: params B under A's digest suppress B in READY cache. Subsequent coherent poll and stale-preview CAS rejection controls. | Bind bytes, imported params, projections and version to one coherent committed observation. `1.1`. Writer CAS intact; no lost update shown. |
| [B2-005 foreign lock readiness](#aud-011-b2-005--a-different-processs-live-lock-does-not-mark-the-service-busy) — confirmed conditional P2 | Real child owns lock; service reports `active` but not busy, provider READY, preview issued. Same-process owned-lock control blocks. | Recognize live foreign-owner inspector state in readiness/preview admission. `1.2`. Underlying write exclusion still holds. |
| [B3-001 disconnect ownership](#aud-011-b3-001--delayed-disconnect-overwrites-a-newer-valid-wallet) — confirmed P2 | Late explicit disconnect publishes null after verified B; actual SDK emitter ordering and ordinary-disconnect/fresh-B controls. [Admin extension](#b3-001-extension--admin-delayed-disconnect-can-hide-a-newer-verified-account) establishes both implementations. | Fence explicit disconnect completion against newer lifecycle ownership. `2.2`. Availability/state discrepancy, not wrong-signer proof. |
| [B3-002 obsolete LIVE](#aud-011-b3-002--hidden-tab-resume-retains-obsolete-actionable-live) — confirmed P2 | Actual trusted expiry→pause owner lacks continuing visibility/focus/online freshness retirement. Controlled resume retains hour-old LIVE/action; subsequent paused read closes it. | Retire aged availability and verify pause on resume, preserving countdown/unpause owners. `4.1`. Contract pause guard still applies. |
| [B3-003 edition parsing](#aud-011-b3-003--exchange-accepts-malformed-edition-prefixes-as-reward-terms) — confirmed conditional P2 | Registered cart quotes financial reward from `1e2`, `1.5`, `1,000`, `31oops`; actual extraction/render/action runs. Valid counts/wholly invalid controls distinguish prefix acceptance. | Validate complete safe positive edition counts consistently before quote/action publication. `0.3`. No malformed hosted row or overpayment established; pair lookup can reject. |
| [B4-001 Public read owners](#aud-011-b4-001--stalled-preflight-reads-indefinitely-retain-public-send-ownership) — confirmed P2 | Both handlers await unbounded operator/pair fetch, JSON or error-text. Twelve held-read cases retain processing before journal/request; eventual-response controls release. | Bound/cancel non-wallet preflight reads and retire their local owners independently of submitted requests. `3.1`. No movement/journal in these stalls. |
| [B5-001 Admin read owners](#aud-011-b5-001--stalled-reads-retain-admin-action-ownership-after-replacement-refresh) — confirmed P2 | Both pause final reads, withdrawal fetch/body and transfer preflight, plus [pair/GitHub extensions](#b5-001-extension--pair-preflight-and-github-refresh-also-retain-obsolete-read-owners), remain busy after successful replacement reads. Actual controllers and eventual-response/stale-publication controls. | Bound non-wallet reads and release obsolete action ownership across all recorded callers. `3.2`. Preserve terminal/uncertain wallet status independently. |
| [B5-002 recovery identity](#aud-011-b5-002--emergency-recovery-memory-can-overwrite-a-newer-unresolved-operation) — confirmed conditional P2 | Receipt setItem succeeds, verification getItem fails; second tab settles old receipt and reserves new uncertainty; old memory-first settlement overwrites it. Both stores/four actual Refresh cases; ordinary-persistence controls reject stale ID. | Reconcile emergency memory against current durable journal ID under existing lock before replacement. `2.3`. Specific storage fault/two-tab order required; no live duplicate/loss asserted. |
| [B6-001 Set Auto ownership](#aud-011-b6-001--an-obsolete-set-pair-auto-read-overwrites-newer-operator-input) — confirmed P2 | Both actual Auto handlers overwrite Reset/new manual ID `90` after held availability/highest-ID reads. Unchanged-Auto controls select expected IDs. | Retire each Auto continuation after Reset, edits or replacement Auto action. `4.2`. Mapping gates remain; no automatic send shown. |
| [B6-002 partial chunk recovery](#aud-011-b6-002--a-later-chunk-request-error-restores-send-over-a-partially-applied-plan) — confirmed P2 | Batch 1 applied, batch 2 request throws: actual send/view restores whole-plan Send and missing readiness, skips final invalidation. All-applied/unconfirmed/hashless controls lock appropriately. | Retire stale whole-plan readiness, retain applied receipts and reconcile uncertain chunks before retry/repreview. `4.3`. Fresh mapping blocks occupied-ID retry; no duplicate application proven. |
| [B6-003 cleanup ownership](#aud-011-b6-003--selected-pair-cleanup-can-submit-again-while-its-first-outcome-is-unresolved) — confirmed P2 | Enabled registered Drops Delete has no pending owner: second click reaches identical serialized request during first confirmation. Single-click control sends once. | Exclude repeated destructive intent through uncertain/terminal outcome, preserving exact target/ID/authority. `2.4`. Two requests, not distinct hashes/applications; replacement-ID deletion is a source inference. |

### Consolidation and qualified dispositions

The final material count remains **15**. E2's Public discrepancy/recovery effect
extends the Admin SDK root; B3-001 includes Admin disconnect; B5-001 includes
pair preflight and GitHub Refresh. B4-001 and B5-001 share a read-liveness theme
but retain distinct entrypoints and preflight versus post-operation effects.
B2-003 is a latched status, not a stalled-read duplicate. B6's three findings
retain distinct input, partial-readiness and destructive-request consequences.
No supported consequence was dropped to simplify the count.

B2-001's correction changes the defect contract and remediation, not its
confirmed conditional P2 disposition or the **15**-finding count. Accidental
admission of an ineligible collection remains a consequential configuration
failure; the ID mismatch is retained evidence on that invalid path, not a
second finding or a requirement to support HEN redemption.

The [mobile `STANDBY…` discrepancy](#additional-b3-evidence--standby-display-and-rejected-hypotheses)
is a confirmed **P3 display observation**, additional to the fifteen material
findings. Real ellipsis restores an earlier mobile countdown string while
authoritative standby/paused state stays correct. Checklist `5.1` preserves this
actionable observation without elevating it to a financial/authority finding.

- **Accepted limitation:** AUD-005-001's independent external editor racing
  final ownership read/replacement remains accepted and unchanged. B2-004 uses
  the supported locked writer and concerns snapshot-version truth. The opt-in
  external-concurrency defect suite is not a passing regression gate.
- **Conditional exported capability, active reachability unestablished:** held
  custom modal token resolvers can corrupt replacement population; registered
  callers use immediate local metadata. Dormant params parse/load exports and
  CMS write helpers are not evidence of shipped upload/publish workflows. No
  current non-test CMS orchestration caller was found. These are qualified
  limits, not additional confirmed active material defects.
- **Trust/integration boundaries:** signer ABI admission does not verify live
  executable code; provider stability, numeric-level reorgs, pending-send
  reconciliation and manual retry limits remain explicit. Direct authorized
  contract calls can create duplicate tuples under distinct IDs. Current Public
  rejects ambiguity and supported Admin preflight/readiness detects it: the
  prior AUD-010 supported-client defect is not an unresolved checklist item.
- Thumbnail parser differences reject/rollback rather than demonstrate wrong
  successful publication. Manifest freshness does not certify artwork or image
  quality. Metadata/cache diagnostics, zero-supply polling policy and rejected
  hypotheses retain their earlier qualifications; none is quietly counted as
  a confirmed material failure or claimed as verified external behavior.

### Final verification and evidence preservation

The [final verification ledger](coverage.md#final-verification-and-limitations)
records Public/supporting/Admin/configuration, thumbnail/CMS, ABI/provenance/
consistency and isolated build commands/outcomes. All nine AUD-011 scripts are
exported under `audits/repro/` and run from Outer. Existing scripts remain
byte-for-byte unchanged. B1's formerly ignored evidence script is copied exactly
to `audits/repro/AUD-011-contract-provenance-check.mjs`, SHA-256
`11603D1621BBA48F48EE1E6DDB3D3FCEEFFA7A96AE71009266C9BE317E49DC22`.
Its original `audits/work/AUD-011-batch1-checks.mjs` remains preserved. Historical
logs and in-memory supplemental SDK schedules remain reported evidence, not
newly reconstructed executions. Existing Admin SDK and independent Public
scripts provide executable positive/negative controls for that finding.

Reproduction success asserts the defect and its controls, not remediation.
Native legacy SmartPy compilation/scenarios, Octez typecheck, real wallet/signer,
chain/FA2/Webflow/GitHub/provider observations, operational service, deployment
and transactions were not performed. Browser storage durability, native Web
Locks/event scheduling, hosted dependency identity, deployed code/state,
external truth and finality remain unverified. These explicit external stop
boundaries limit the completed source result. Material findings preclude clean
criteria; no independent final-clean coverage refresh was performed.

## Historical batch records

Checkpoint PARTIAL/deferred/next-batch language below is historical and
superseded by the final status above. The former opening status is preserved:

Status: PARTIAL — Batches 1–7 COMPLETE within their recorded source/inert boundaries. B7 establishes no additional material finding; fifteen independent provisional findings and their earlier evidence remain unresolved/preserved. Restricted child-process checks and external integration evidence remain deferred. Finalization, checklist reconciliation, broad final verification and exports have not occurred. No full-pass final or clean result.

## Batch 7 examination — 2026-11-25

**COMPLETE, bounded source/inert examination: B7 / W03/W04/W36–W39.** All four
prescribed slices were examined, including the unregistered CMS support boundary
and exporter effects. The [coverage ledger](coverage.md#aud-011--batch-7-examination-2026-11-25)
records forward/reverse/boundary obligations and all six dispositions. Current
bounded source totals: **40 COMPLETE, 0 PARTIAL, 0 NOT EXAMINED**; this does not
complete AUD-011 finalization or the deferred execution checks below.

Source remains Outer `2453358c8cf91d4db3bc24e447ed0859f91216e8` and Admin
`d8636e957d3974ba73882d9d29242898f10ed3e0`, both on
`ticket-AUD-011-full-correctness-review`. Initial Outer audit changes were
expected; Admin was clean. Windows PowerShell/Node `v22.16.0`/npm `10.4.0` and
installed dependencies were used. Public delivery environment and network slot
remain distinct: prod paths do not imply Mainnet. No actual provider module,
signer, wallet, external response, live CMS or deployment was inspected.

### B7 source conclusions and challenged assumptions

**No new independent material finding was established.** This is not a clean
result: E2 and B2–B6's fifteen independent provisional findings remain unresolved.
The following are supported behavior and qualified limits, not additional
confirmed active application defects.

1. **Thumbnail transaction ownership is shared across imports and generators.**
   `assets/thumbs/scripts/thumbs.mjs:252–360` acquires the Admin manifest lock
   before inspecting pending inputs or choosing a key, regenerates in-process
   with its actual capability and archives only afterward. `writeNewFile`,
   exclusive archive copy/unlink, byte snapshot restore and rollback uncertainty
   were traced separately; no copied owner record/environment flag delegates
   ownership. `admin-ui/scripts/thumbs-manifest-lock.mjs` resolves the manifest
   parent, exclusively creates a directory, validates directory/owner identity
   and bounds contention without stale-PID reclamation. Successful rollback
   releases; uncertainty/interruption retains blocking evidence. Standalone
   generation checks that capability before scanning and around writes.
   Same-process overlap, ordinary/uncertain cleanup, foreign/replaced ownership
   and valid import controls passed existing fixtures. Real cross-process/crash
   cases remain blocked as recorded below; passing in-process cases do not
   replace them or justify removing any operational lock.

2. **Thumbnail identity and certification claims are narrower than comments.**
   Intake `tokenIdOf:49–52` retains leading zeroes, while Admin's generator
   canonicalizes with BigInt. The controlled boundary checks show `0001` → raw
   `0001` versus manifest `1`; intake chooses next key `2`. The generator rejects
   canonical collisions rather than emitting duplicate IDs, causing import
   rollback before archival. An existing ID `9007199254740993` is valid for the
   generator but blocks intake's safe-Number allocator. The two parsers are not
   identical despite the comment; this did not establish wrong successful
   publication. Generator/checker validate filesystem/URL/key agreement and
   required placeholder/folders, **not image decoding, artwork identity or
   on-chain token existence**. Backfill's compliance predicate checks width,
   JPEG and retained metadata; it does not certify the original quality setting,
   progressive encoding or sRGB conversion. Conversion does enforce its stated
   output properties. Backfill is review/report-only, has no promotion path or
   shared review/report lock and is not a consistent snapshot during concurrent
   backfills/imports/direct edits. Rerun/review must precede manual use of those
   candidates; no master loss or automatically wrong consumer identity was
   demonstrated. B6's canonical/native HEN and presentation-only consumers are
   retained unchanged.

3. **CMS capabilities do not establish a supported migration workflow.**
   Search of imports, package commands and caller symbols found no current
   executable application/CLI caller of `assets/webflow-cms/webflow-cms.mjs`
   outside tests. The retirement record confirms the former orchestration was
   removed. Exported `request/createAsset/patchItemFields/publishItems` are real
   write capabilities, examined with injected transports only. They preserve
   explicit field/item/locale payloads and never retry mutations. Transport,
   body-read and 408/429/5xx ambiguity stay unknown; definitive other 4xx
   rejection stays not-applied. Successful HTTP text/empty/JSON returns are raw
   request results, not a verified item or published-state result. Pagination
   validates totals/offsets/page sizes and item+locale identity, but does not
   lock an external collection snapshot. No remote API contract or deployment
   was freshly verified.

   Asset verification combines a reread ID/name/hosted URL with exact bytes;
   CMS-image verification deliberately permits changed file ID/URL when decoded
   dimensions/format and configured content metrics agree. It cannot establish
   semantic token/artwork identity by perceptual comparison alone. Timestamp/
   draft/archive checks and content equality are independent helpers; neither
   automatically invokes the other or verifies its caller's intended site,
   collection or locale. `reconcileAmbiguousMutation:668–680` only reads and
   consumes a caller-supplied exact verification result; nondefinitive mismatch
   stays unresolved. There is no automatic replay, application journal, publish
   owner or orchestration to credit. B6's local CSV/readiness path is separate.

4. **Signer provisioning validates a fixed dataset and ABI, not live code
   provenance or durable uncertainty.** `scripts/shadownet-exchange-pairs.mjs`
   validates every fixed assignment and pinned local promoted artifact before
   any mode reaches a provider. Default dry-run has neither provider import nor
   RPC; `--verify` creates a read-only toolkit. `inspectChain:121–137` checks RPC
   URL, chain ID and parameter/storage ABI at a numeric block level. It does
   **not compare the executable `code` section**. A controlled altered-code
   fixture with identical ABIs is accepted. This identifies the limit of that
   check, not evidence that the configured deployed contract differs; B1's
   local provenance result cannot establish deployed identity.

   Execute separately checks signer/admin, all 44 empty IDs/zero unexpected
   cardinality, encoded live method equality and zero attached tez, then awaits
   target/entrypoint confirmation and exact post-state. Real `run` orchestration
   controls reject wrong RPC/chain/parameter or storage ABI/admin, occupied IDs,
   unexpected map size, unavailable readback, payload drift, send rejection,
   terminal failure, confirmation timeout and post-state drift. Valid success
   reads all 44 exact records; repeat execution with occupied IDs cannot send.
   This uses real encoder/schema/reader/poller functions and **fake send/RPC**,
   not a signer transaction. The timeout case injects a rejected poller; B4's
   actual deadline examination is reused, not repeated.

   The local provider is trusted code and must have no import side effects;
   a module-provided signer can change after its initial check. Chain admin
   authorization still applies. Readback handles only RPC 404 as missing and
   reports, rather than enumerates, unexpected big-map IDs. Numeric block level
   is not a reorg-proof block-hash snapshot. No per-await RPC timeout, process
   lock or durable pending-operation journal exists. Send rejection/lost hash/
   timeout must remain uncertain; a new process cannot infer “not injected”
   from still-empty storage, and concurrent executions can both prepare before
   one applies. Contract occupied-ID rejection blocks overwriting, not redundant
   pending requests/fees. Retry requires operator reconciliation of the reported
   hash/provider history; no automatic safe retry or live finality is claimed.

5. **Public availability is separated from wallet work, within a loaded runtime.**
   All root routers select prod only for the two exact production hosts; dynamic
   imports resolve relative to the router/loader URL, independently of the HTML
   route. Loaders start early and application imports independently and log both
   synchronous and asynchronous failures. Normal repeated imports use ESM URL
   caching; global first-paint and wallet/page guards protect repeated boot.
   Exported start helpers are not self-healing retries for cached failed module
   imports. `shared/public-first-paint.js:344–417` owns one DOM-ready run, font/
   hero deadlines and independent 1300ms fail-open. New actual-body controls
   establish ready, rejected-font, broken-image, stalled font/image, late DOM
   and repeat-start behavior, including inline visibility after fail-open.
   Utility's actual image handlers passed cached success/failure and later
   load/error/missing-spinner controls. No wallet observation or transaction
   gates the Home/Utility static content. If the runtime itself never loads,
   its module-owned fail-open cannot execute. Without live CSS/embedding reads,
   do not infer either a live blank-page incident or complete integration.
   Utility SVG/marquee and route/anchor behavior were read separately; responsive
   geometry, browser image scheduling and live asset URLs were not exercised.

6. **Delivery checks certify their supplied inputs.** The workflow builds main
   and staging independently, checks generated projection freshness, copies
   authoritative routers/loaders, removes/asserts absent maps and verifies before
   upload. Current graph fixtures compare synthetic bundles with supplied owner
   outputs, not fresh Parcel emissions or live Pages bytes. Main/staging refs
   and GitHub Actions execution were not inspected. Environment loaders and
   chunks all come from their declared owner in this workflow; no local evidence
   proves what a currently deployed root router imports. Admin production uses
   the static provider, prunes development split chunks and checks runtime
   markers; disposable actual prune/verifier controls reject pre-prune authoring
   chunks and forbidden surviving transport, and accept clean content. No fresh
   Admin production compilation or emitted source-map analysis was performed.
   B2's provider findings remain unresolved; packaging is not their fix.

   Dev commands, fixed-input image optimizers, source-map source normalization,
   port diagnostics and sanity harness have local effects only. Harness
   direct-bundle and loader-chain paths preserve inline/Webflow code, replace
   app script registrations and refuse unknown legacy cleanup content; server/
   browser lifecycle was source-reviewed only. Exporter source checks repo,
   branch, ignored output paths and conflict/override conditions, uses a private
   index/object directory, locks the output pair, invalidates stale exports on
   failure and bounds cleanup. AST parsing does not exercise Git/export/copy
   faults. Running it was explicitly deferred, so no new export or temporary
   Git repository was created.

### B7 verification, deferred checks and preservation

New preserved evidence:
[AUD-011-delivery-tooling-repro.mjs](repro/AUD-011-delivery-tooling-repro.mjs).
It executes complete production first-paint/Utility bodies with imports replaced
only at their controlled boundaries. For the signer, it extracts the current
`run` body and replaces exactly its single local-provider import; production
encoder, `inspectChain`, `readBack` and normal confirmation poller remain actual
imports, with an inert provider/send/fetch. It constructs no real SDK client or
signer and invokes neither operational CLI mode. The altered-code admission
case confirms an evidence limit. Prune/isolation writes are restricted to an
owned disposable `audits/work/AUD-011-B7-*` directory, removed after bounded-path
verification. Exit 0 is evidence for these controls, not deployed correctness.

Actual commands/outcomes are recorded in the [B7 coverage verification](coverage.md#b7-verification-and-limitations):
the six selected loader/navigation/reveal/graph/source-map/signer test files
passed in one in-process invocation; CMS **39/39 PASS**; Admin manifest tests
and read-only freshness **PASS**; B7 inert script and JS/PowerShell syntax
**PASS**. Outer thumbnail suite exit 1: **17 passed; 10 could not spawn their
independent-process fixtures (`EPERM`)**. No assertion about cross-process
correctness follows from those ten failures. Independent process ordering,
interruption and crash-recovery execution are explicitly deferred by capability;
their source paths are examined. The blocked command was not retried/escalated.

No B7 source slice is left unexamined. Remaining evidence obligations are those
restricted child-process executions and the qualified live/provider/browser/
deployment boundaries above. Fresh builds/emitted graphs, broad final checks,
review exports and final finding/checklist reconciliation stay deferred to
AUD-011 finalization. Earlier scripts and finding records are preserved; no
finding was silently resolved, no checklist was edited and no clean refresh
occurred. Only Outer coverage/findings and the new B7 script change in this batch;
Admin remains clean, both branches/HEADs/index entries are preserved. No live
signer/wallet/RPC submission, Webflow mutation, external write, operational
change, production fix, GitHub integration, commit/merge/push or deployment.

## Batch 6 examination — 2026-11-25

**COMPLETE / WITH FINDINGS within source/inert boundaries: B6 / W21–W29.**
All four prescribed slices are examined. The [coverage ledger](coverage.md#aud-011--batch-6-examination-2026-11-25)
records complete obligations, producer/consumer comparisons and external limits.
Current totals: **34 COMPLETE (bounded source), 0 PARTIAL, 6 NOT EXAMINED** of
40 scopes. Those six scopes are B7, which was not started. This completes B6,
not AUD-011 or its clean-result procedure.

Source remains Outer `2453358c8cf91d4db3bc24e447ed0859f91216e8` and Admin
`d8636e957d3974ba73882d9d29242898f10ed3e0`, both on
`ticket-AUD-011-full-correctness-review`. Expected prior audit changes were
preserved; Admin was clean. Windows/Node `v22.16.0`, installed dependencies and
registry testnet/Shadownet configuration are assumed. E1/E2 and completed
B1/B2/B4/B5 evidence are reused at direct dependencies; their operation-binding,
ABI, writer and custody investigations were not repeated. Historical tests were
not substituted for current source examination.

New controlled evidence: [AUD-011-admin-orchestration-repro.mjs](repro/AUD-011-admin-orchestration-repro.mjs).
It reads setup-only portions of existing fixtures and executes current production
bodies. Indexer, DOM, storage, clocks and wallet request seams are inert; no SDK
client, live account, browser session or real transaction is created. Exit 0
asserts the observed failures and distinguishing controls, not clean behavior.

### AUD-011-B6-001 — An obsolete Set Pair Auto read overwrites newer operator input

**Confirmed source failure; provisional P2 (configuration intent/availability).**
Reset and newer Pair ID edits must retire an earlier asynchronous Auto action.
Its result must not silently replace the identity the operator now intends.

**Reachability/source.** Both registered Set Pair panels use
`admin-ui/src/features/pairs/setpanel.controller.js:473–541,775–786`.
Drops Auto awaits availability probes (`:450–466`), backed by
`pairs.controller.js:546–557` → `hasActivePairId` → TzKT. Exchange Auto awaits
`highestActiveExchangePairId` (`exchange-pairs.js:252–261,619–623`), backed by the
complete pair reader. These are actual external read boundaries. Neither Auto
captures an owner/version nor rechecks after awaiting before `setAutoPairId`
writes the input (`setpanel.controller.js:409–415,509`). Reset increments load
and availability counters (`:286–310`); manual input versions only availability
checks (`:355–404,716–718`). Neither retires the pending Auto continuation.
Multiple Auto clicks can likewise finish out of order.

**Observed.** Invoke each actual registered Auto button handler, hold its
availability/highest-ID producer, press Reset, enter ID `90` and dispatch its
input event. Resolve the original read as free/highest `3`. Drops writes `0`;
Exchange writes `4`, replacing `90` and publishing an Auto-filled status.
Unchanged-Auto controls choose the same expected IDs without a newer edit.
The fixture's field-reset/render helpers are inert: the assertions concern the
actual Pair ID node and production status writes, not fabricated transaction
fields. No wallet request is made by Auto.

**Consequence/limits.** Newer manual preparation is overwritten; Drops also
clears redeem selection, while Exchange reapplies its locked ACID COIN #0.
Continuing to Set can therefore use the late Auto ID unless the operator notices
and corrects it. Final availability/mapping checks protect against an occupied
or ambiguous ID, but cannot reconstruct the discarded ID choice. No wrong live
write or automatic send is demonstrated. Provider latency and user timing are
controlled preconditions, not measured incidence. This is the manual Set Pair
Auto owner, distinct from the separately versioned Drops batch Auto loader.

### AUD-011-B6-002 — A later chunk request error restores Send over a partially applied plan

**Confirmed source failure; provisional P2 (readiness/recovery).** Once an earlier
chunk is known applied, a later error must not restore the old whole-plan Send
readiness while retaining the earlier missing-pairs observation.

**Reachability/source.** `drops.send.service.js:309–323` records each batch and
awaits set/confirmation in sequence. If batch 1 applies and batch 2's set request
throws, the catch at `:385–392` records the second batch as `error` and reports
`Send failed. See console.` It skips both `ui.canSend=false` at `:371–376` and
the pair-final/list-change events at `:378–384`. Finally `:394–404` releases
pending ownership and republishes the unchanged true readiness. The actual view
uses that readiness plus its still-`missing` pair status and verified pause
(`drops.view.panel.js:291–349,574–599`) and enables Send again. The shared pair
adapter returns raw SDK errors and has no pair recovery reservation
(`escrow-ops.js:70–146`); an exception need not mean definite non-submission.

**Observed.** Execute the actual loader fixture's normalizer/builder/send and
the actual Send view. A three-item plan uses one-item chunks. Batch 1 receives
applied evidence; batch 2 throws an inert transport error. The in-memory history
retains batch 1 `applied`/batch 2 `error`, but `state.ui.canSend` and mirrored
dataset are true, the real Send button is enabled, and no pair-status update or
`pairs:op:final` occurred. All-applied controls submit three chunks and lock Send;
unconfirmed and hashless second-batch controls stop at two and lock Send without
claiming full confirmation. The failure is the catch path, not those controls.

**Consequence/limits.** A partial installation looks eligible for the original
whole-plan action. With current complete mapping evidence, an immediate retry
at the same start is rejected on the already active first ID; this is not proof
of a duplicate applied write. An uncertain second request and its original
hash/source/terms need independent reconciliation before cleanup/recreation.
History is page memory only and not exposed in public controller state; reload
cannot recover it. There is no supported automatic resume of the remaining
chunks: the normal partial-status UX requires operator cleanup/repreview.
The finding is stale action/readiness and incomplete error recovery, not false
overall success, a demonstrated extra fee, funds movement or chain application.

### AUD-011-B6-003 — Selected pair cleanup can submit again while its first outcome is unresolved

**Confirmed source failure; provisional P2 (duplicate destructive requests).**
A selected cleanup should own its in-flight request through confirmation;
repeated clicks must not open independent cleanup requests for the same intent.

**Reachability/source.** Drops registers the enabled Delete button at
`pairs.controller.js:433–435`; `onCleanupSelected:704–748` snapshots selected IDs
and awaits cleanup/confirmation without a pending guard, button lock or durable
uncertainty exclusion. `pairs.view.table.js:210–216` disables only when selection
is empty. `escrow-ops.js:322–343,108–146` validates exact IDs and current wallet
authority, then sends every call independently. No Exchange cleanup is
registered. B1 establishes that on-chain cleanup addresses current contents by
ID, not a captured tuple/version; missing IDs are reported, not fatal.

**Observed.** Compose the actual table, registered controller and serializer with
one selected ID `29`; hold the first confirmation. Delete remains enabled. A
second click reaches the inert SDK request seam a second time, with the same
exact target/entrypoint/ID. The single-click control makes one request. Both
continuations complete when their held evidence is released. The fixture returns
one fixed hash: the assertions establish two request calls, not two distinct
hashes or two applied operations.

**Consequence/limits.** Repeated user clicks can produce redundant wallet prompts
and, if separately approved/included, fee-bearing cleanup attempts. A later
cleanup can remove a replacement at a reused ID if recreation occurs between
applications; that is an inference from B1's current-ID deletion semantics,
not a native execution or observed operational schedule. Without reuse a second
applied cleanup of an absent ID is a no-op deletion failure. Wallet approval,
admin authorization and chain inclusion remain required; no bypass or live loss
is claimed. Manual create and modal edit have in-flight owners; their presence
does not protect this separate cleanup entry.

### B5-001 extension — Pair preflight and GitHub refresh also retain obsolete read owners

This extends the existing stalled-read family, not the independent finding count.
Both manual creates claim `beginSetPairSubmit` before an external active-ID read
(`pairs.controller.js:612–649`, `exchange-pairs.js:542–567`). Pair fetch/body
reads have no deadline (`tzkt-api.js:37–41,188–198,284–294`). A fresh successful
table refresh cannot release the old submit owner; Reset explicitly refuses to
release it. New inert cases hold that active-ID preflight on each surface,
complete a newer table read and verify Set remains disabled with no request.
Resolving the original read releases the preflight and permits its one request;
settling that request releases ownership. This does not authorize abandoning an
uncertain wallet request: these stalls occur before it.

GitHub comparison has the same availability problem at another owner:
`drops.checklist.controller.js:685–692` has unbounded fetch/text, manual Refresh
disables until its awaited in-flight comparison settles (`:776–802`). Provider
invalidation can retire that comparison and start a new successful staging/main
comparison, but cannot release the old click continuation. Controlled fetch and
body stalls both leave Refresh disabled even after the replacement comparisons
are green. Resolving the old response releases the button; epoch guards correctly
prevent its mismatch from overwriting the newer green. No GitHub request was
actually sent. The complete pair pager/catalogue and Health orchestration also
have unbounded waits; Health's separate economics pager bounds fetch and body.

### B6 rejected hypotheses, supported limits and verification

- **Exported modal hook qualification.** The new script retains an informative
  controlled case: a custom pending `uiToken` hook during initial population can
  overwrite a newer pair's token and Save can carry it with the newer pair ID.
  Complete modal content lacks population-wide cancellation after its awaits.
  However, both registered callers use `makeChainUi.token`; its current title/
  image producers are local-only and settle through immediate promise turns.
  Holding that resolver is not evidence of a user-click interleaving in the
  shipped UI. This is an exported-hook reliability limitation, **not a fourth
  active material finding**. Remote custom-hook timing/reachability is
  unestablished; no artificial delay is presented as actual transport latency.
- Exact amount/identity/current-plan equality, all-page/ambiguous mapping
  admission, provider retirement and stale publication were examined from
  current source. Normal chunk ordering and stale receipt retention pass focused
  checks. The separate established E2 request-account discrepancy is unchanged.
- Normalizer multi-collection/explicit-pair/fallback and parse/load exports were
  assessed separately from the active immutable provider. The supported canonical
  writer admits exactly one enabled burn collection; extra normalizer capability
  and serializer tests do not create Public multi-burn support or an upload UI.
- CMS means an imported local CSV compared with local manifests and circulating
  indexer balances, not a fresh live Webflow observation. GitHub dots mean parsed
  branch-file equality, not deployed Pages/CDN equality. Countdown `live` is the
  phase reached after one verified unpause; later pause/unknown is conveyed by
  the independent pause/checklist lane. The preview phase itself is not continuing
  pause certification, and supply is not proof of trade application.
- Conservative diagnostic limits remain: `tokenExists` collapses transport
  failure to false; catalogue snapshots merge remembered IDs; optional metadata
  enrichment and presentation caches cannot authorize financial identities.
  CMS persistence failures can lose the chosen export while an in-memory check
  passes; its green result does not certify durable storage. These were traced,
  not silently treated as stronger guarantees or new live failures.

Actual verification at the stated revisions:

- **252/252 PASS:** `node --test --experimental-test-isolation=none tests/runtime/pair-pagination.test.mjs tests/runtime/pair-read-response.test.mjs tests/runtime/pair-compatibility.test.mjs tests/runtime/pair-modal-pending.test.mjs tests/runtime/pair-modal-session.test.mjs tests/runtime/pairs-stale-render.test.mjs tests/runtime/exchange-pairs-refresh-order.test.mjs tests/runtime/pairs-cleanup.test.mjs tests/runtime/set-pair-availability.test.mjs tests/runtime/set-pair-ownership.test.mjs`
- **250/250 PASS:** `node --test --experimental-test-isolation=none tests/runtime/drops-local-snapshot.test.mjs tests/runtime/drops-multi-collection.test.mjs tests/runtime/drops-manual-range.test.mjs tests/runtime/drops-loader-ownership.test.mjs tests/runtime/drops-pair-status.test.mjs tests/runtime/drops-status-ordering.test.mjs tests/runtime/drops-checklist-contract.test.mjs tests/runtime/drops-checklist-supply.test.mjs tests/runtime/drops-checklist-lifecycle.test.mjs tests/runtime/drops-countdown.test.mjs tests/runtime/drops-unpause-ownership.test.mjs tests/runtime/drops-readiness-invalidation.test.mjs`
- **128/128 PASS:** `node --test --experimental-test-isolation=none tests/runtime/health-cms.test.mjs tests/runtime/health-enumeration.test.mjs`
- **38/38 selected PASS:** `node --test --experimental-test-isolation=none --test-name-pattern='(TX-001 real three-batch|normal multi-batch send|late wallet receipt|reset during post-send|FIND-P3-011|Admin blocks drift|Admin normalization|Admin preserves readiness|Admin detects changes|Admin stops chunk|Admin confirmation refresh)' tests/runtime/drops-send-invalidation.test.mjs tests/runtime/drops-burn-quantity.test.mjs`
- The four test commands ran from Admin: **668 selected checks PASS**, exit 0.
  No full runtime suite, broad build, repeated B1 ABI/E2 investigation or live
  smoke ran. The local-snapshot test uses its existing disposable writer copy;
  it does not modify operational journals or start the real service.
- Outer `node audits/repro/AUD-011-admin-orchestration-repro.mjs` — PASS,
  repeatable; `node --check` for that file and final diff/whitespace checks — PASS.
  Harness development corrected async fixture loading, missing inert globals,
  a cross-realm assertion and missing pause DOM nodes before final runs. The held
  modal case was explicitly downgraded after producer analysis, as above.

No capability restriction prevented an in-scope source/inert examination.
Real browser event-loop/storage/Web Locks behavior, wallet prompts/transport,
RPC/TzKT snapshot accuracy, external FA2/chain application/finality, time provider,
GitHub branches, live Webflow/CMS and deployed identities remain unverified at
the declared external boundaries. Only Outer coverage/findings and the new
reproduction changed during B6; Admin source, both HEADs/indexes/branches, prior
evidence, parameters/generated copies and operational state are preserved.
**B7 remains W03/W04/W36–W39 at its original four slices.** No remediation,
checklist update, AUD-011 finalization, clean refresh or ticket exports occurred.

## Batch 5 examination — 2026-11-25

**COMPLETE / WITH FINDINGS within source/inert boundaries: B5 / W13–W20.**
All four planned slices were examined: remaining Admin authority/network/surface/
indicator paths; both pause instances and recovery; both inventories/MAX/XTZ
paths; FA2 selection/batch sends and durable reconciliation. The detailed
[coverage entry](coverage.md#aud-011--batch-5-examination-2026-11-25) records
examined branches, immediate consumers, rejected hypotheses and external limits.
Current totals: **25 COMPLETE (bounded source), 4 PARTIAL, 11 NOT EXAMINED**
of 40 scopes. B6 and B7 have not begun. No permission/capability restriction
blocked an in-scope functional examination; external/live behavior is unverified
at the declared stop boundaries, not silently credited as exercised.

Source remains Outer `2453358c8cf91d4db3bc24e447ed0859f91216e8` and Admin
`d8636e957d3974ba73882d9d29242898f10ed3e0`, both
`ticket-AUD-011-full-correctness-review`. The expected pre-existing Outer audit
changes were retained; Admin was clean. Windows/Node `v22.16.0`, installed
Beacon SDK 4.8.1, current Shadownet configuration and source snapshots are the
assumptions. E1/B1 and E2 were used only at direct dependency/consumer seams;
the established Admin A-intent/B-request proof was not repeated or expanded.
The SDK lifecycle check below concerns ordinary UI publication, without invoking
requestOperation. Historical audits supplied no examination credit.

Common new evidence:
[AUD-011-admin-custody-repro.mjs](repro/AUD-011-admin-custody-repro.mjs).
It executes current production bodies using existing setup-only fixtures and
actual Exchange initializers. DOM, clocks, indexer, browser storage/locks and SDK
transport are inert. No DAppClient is constructed, real storage accessed,
account connected or transaction signed. Exit 0 asserts the observed failures
and distinguishing controls; it does not mean these paths are defect-free.

### AUD-011-B5-001 — Stalled reads retain Admin action ownership after replacement refresh

**Confirmed source failure; provisional P2 (availability).** A completed chain
result and a newer successful non-wallet refresh should not leave the action
permanently busy waiting for an obsolete read. Releasing local read ownership is
separate from deciding that an uncertain wallet request failed. The demonstrated
pause/withdraw records already have terminal application evidence; the transfer
case has not reached a wallet request at all.

**Reachability/source.** Both pause controllers set `pending` before awaits and
release it only in `finally` (`admin-ui/src/features/pause.js:601–704`). After
complete terminal operation evidence settles the reservation, `:675` awaits
`readPauseStorage`. `tzkt-api.js:37–47` awaits storage fetch/JSON without a
deadline or abort owner. While pending, Refresh calls `renderPause` (`:463–465`)
and can publish new storage, but cannot settle the original promise or release
pending. Additional toggle invocations return immediately.

Both withdrawal controllers await `updateWithdrawBalance` after settlement
(`features/treasury/withdraw.controller.js:450–454`). The balance fetch and JSON
awaits at `:249–251` have no deadline. A newer successful refresh invalidates the
old balance request's publication; the original submit still awaits it, retains
`withdrawUi.busy` and prevents reconciliation/repeat until its finally runs.
Transfer acquires busy before `await getStatePromise()` (`transfer.controller.js:
353–389`). The orchestrator/manual refresh replaces `statePromise` for new
requests, but an already waiting submit retains the old promise. Storage or
catalogue enumeration can hold that older refresh indefinitely. The complete
FA2 pager's own deadlines do not bound these other awaits.

**Observed.** On **each surface**, complete the actual pause send/poll/settlement
then hold its final storage read. A successful Refresh displays Live, yet Toggle
remains disabled, the original handler remains unresolved and a duplicate call
sends nothing. Release the very same old read: ownership releases, its stale
Paused value cannot replace Live. On both surfaces hold withdrawal's final
balance fetch and JSON separately (**four cases**): complete applied evidence
has cleared recovery; a new Refresh displays `1.234567`, but busy remains and a
new submit returns without a wallet request. Release the old response: busy
releases without replacing the newer balance. For both transfers, start a manual
refresh with a held storage prerequisite over existing selected rows, then click
Transfer. A newer successful manual refresh replaces the state promise and rows,
but cannot release the submit waiting on the old promise. Release that old
refresh: it returns obsolete/null, the submit refuses unavailable balances and
releases busy, with no wallet request. **Eight held-read cases** in total.

**Consequence/limits.** A stalled provider/request/body or catalogue read can
strand otherwise recoverable controls in processing until the particular
promise settles or the page reloads, even after a successful replacement read.
No duplicate submission, wrong asset movement or false chain application is
demonstrated by this failure. The harness does not wait wall-clock hours or
simulate every browser timeout; it holds real await seams and pairs them with
eventual-response controls. The source supplies no timer/cancellation race that
could release those owners. Existing tests exercise rejected/settled old reads
and bounded operation polling, not never-settling action-owned refreshes. Wallet
permission/request waits are outside this non-wallet-read finding. Public
B4-001 is preserved as a separate implementation path, not rerun here.

### AUD-011-B5-002 — Emergency recovery memory can overwrite a newer unresolved operation

**Confirmed source failure under the stated storage-failure schedule;
provisional P2 (recovery bookkeeping, possible repeat effects).** An old terminal
operation may settle only its own current journal identity. Unresolved newer
work must survive another tab's reconciliation even if the older tab retained
emergency receipt information after a storage error.

**Reachability/source.** Pause `features/pause-recovery.js:24–25` and Treasury
`features/treasury/recovery.js:25–26` prefer an in-memory uncertain row over the
durable row without comparing IDs. Their `write` functions retain the proposed
row **before** setItem/readback and delete memory only after verification succeeds
(`pause-recovery.js:32–38`, `treasury/recovery.js:29–35`). A successful receipt
setItem followed by a throwing verification getItem leaves an uncertain copy in
memory **and** a receipt hash in durable storage. Another tab can legitimately
recover that durable receipt and later save a different unresolved operation.

Settlement takes the shared Web Lock, then reads through the same memory-first
accessor and compares the requested ID to that result (`pause-recovery.js:64–73`,
`treasury/recovery.js:73–83`). In the older tab, this comparison sees its own old
ID rather than the newer durable ID. The subsequent write replaces the newer
record with the old terminal row. Existing storage/recovery event listeners
recompute controls/notices; they do not reconcile or retire the stale memory.
The actual callers are Pause `pause.js:432–457` and Treasury
`recovery-ui.js:54–64`: both can poll the old retained hash, obtain valid terminal
evidence for it and invoke this erroneous settlement. Correct operation polling
does not repair incorrect ownership of the journal being replaced.

**Observed controlled sequence.** Two independent module instances share an
inert localStorage and exclusive-lock fixture. A reserves/sends operation 1;
receipt setItem succeeds, then its verification read throws once. B reads the
persisted hash, reconciles operation 1 with complete applied evidence, and
submits operation 2. Operation 2 remains uncertain with a distinct hash and ID;
its send lock has released, as in ordinary confirmation polling. A reads its
retained operation 1, polls valid evidence for operation 1 and settles it. The
shared journal now says operation 1 applied; operation 2's unresolved row is
gone. A further ordinary submit passes exclusion and reaches the inert wallet
seam. No lock is disabled, malformed journal substituted or status evidence for
operation 2 fabricated. Direct Pause/Treasury cases both demonstrate this; the
**unchanged-persistence controls** reject the stale ID, retain operation 2 and
reject the third request.

Four further cases run the **actual Refresh controllers**: Drops/Exchange ×
Pause/withdrawal. A's receipt readback error is handled by the existing UI catch;
B's Refresh settles operation 1, B submits operation 2 and times out/has unknown
evidence; A's Refresh then overwrites B's new row using operation 1's valid
evidence. The combined inert request count reaches three. This establishes
functional UI reachability beyond calling the exported store helpers. The
Treasury store is shared by withdrawal and FA2 transfer, so either action's newer
row is susceptible; the controller-level positive scenarios use withdrawal.

**Consequence/limits.** A newer uncertain pause/withdraw/transfer can lose its
durable exclusion and recovery record. Operators may be offered a further
submission while that operation's application remains unknown; another toggle
can reverse state, and a repeated authorized withdrawal/FA2 transfer could have
additional effects if accepted and funded. There is no automatic third send,
authorization bypass, observed live duplicate, signed transaction or established
loss. The required fault is specifically **setItem succeeds, its verification
getItem fails**, followed by two active tabs and the stated recovery order.
A receipt setItem failure that leaves only a hashless durable reservation does
not by itself demonstrate this cross-tab sequence. Browser permission changes,
storage-failure incidence, event delivery and real lock scheduling were not
measured; the assertion is about the source's response to that controlled I/O
failure. Existing tests separately cover failed receipt writes, cross-tab locks
and stale IDs, but not stale retained memory after another tab advances the ID.

### B3-001 extension — Admin delayed disconnect can hide a newer verified account

This is **new Admin evidence for B3-001**, not a thirteenth independent finding
or another E2 operation-binding investigation. Admin's
`beacon-setup.js:478–489` invalidates intent before clearActiveAccount, then
unconditionally calls `syncDisconnectedAdminUi` on completion (`:366–382`). It
lacks the initiating-generation guard used by mismatched-account cleanup.

Execute the installed SDK getter/setter/clear/event-emitter against an inert
object, bridging its actual account callback to the actual Admin subscriber.
Start clearing A; hold its storage await. Start B's setter and hold its storage;
the SDK's null event releases B's storage. Actual emitter/microtask ordering
publishes B before the old explicit-disconnect continuation. Admin then emits
`wallet:disconnected`, invalidates B's action intents and renders Connect while
its real verified-account getter still returns B. A fresh B event restores the
connected button; the unchanged-disconnect control remains disconnected.
This can retire pending UI authority and MAX/indicator state despite a valid
newer account; it does not demonstrate a request or a wrong signer.

The storage awaits are deliberately controlled lifecycle scheduling, not a claim
that ordinary synchronous browser localStorage takes arbitrarily long. SDK
transport/peer/account-manager persistence and analytics remain inert. Real
wallet timing and live incidence are unverified. Existing boot/cleanup/delayed
button tests protect other generations, but do not fence this explicit late
disconnect publication. B3's original Public evidence is unchanged.

### B5 additional examination evidence and limitations

- Current setNetwork uses clear → persist → reload, with no `network:change`
  emitter. Its failure order, same/invalid slots and legacy migration were
  checked inertly. Tests that dispatch synthetic network events validate consumer
  safeguards, not actual reload execution. Mainnet remains incomplete and no
  network selection/persistence on the user's computer was changed.
- Both actual surface initializer configurations and independent state owners
  were traced. Hiding a surface does not invalidate or retarget its controllers;
  the Drops modal closes when leaving Drops. The root/global Admin and Escrow
  indicators remain deliberately Drops/default scoped per current ownership
  notes. Their presence does not certify Exchange authority.
- Admin indicator retries unknown reads and fences stale account/context results;
  successful root-admin caching is not a source violation here because the
  examined contract has no admin setter. Exchange status is read-only, uses its
  explicit target and native disabled Refresh while reading, and renders unknown
  paused values as Unknown. Its `Read OK` label is request completion, not a
  complete-storage-schema or continuing-freshness assertion. No presently
  registered concurrent refresh race was established from hypothetical events.
- Treasury's complete reader preserves exact native identities and raw balances;
  row metadata cannot change payload identity. Large balance strings are retained
  while selected quantities are limited to safe exact positive integers. Full
  XTZ decimal conversion uses BigInt, not MAX's legacy Number helper. Zero,
  unknown, invalid and failed reads remain distinct. Exact huge-text serializer
  tests do not certify protocol range admission or browser number-input editing.
- Pause/withdraw/FA2 operation results require attributed full group evidence,
  not a storage boolean, wallet hash, partial batch or balance delta. Approval/
  internal/reveal accounting, failed/backtracked/skipped versus unknown, whole
  deadlines and stale/cancelled continuation checks were read and tested. Native
  chain atomicity, actual FA2 behavior and provider/hash accuracy remain B1's
  unverified integrations. Admin sender/payload equality is not independently
  attested by this matcher; E2's saved-account qualification remains open.
- Direct exported optionless/single-token/explicit-target helpers have no new
  registered UI caller. They retain durable exclusion but do not themselves
  capture the active controllers' authority owner, and their syntax/numeric
  admission is weaker. They were examined as capabilities; no active UI path or
  live alternative-path outcome was invented. Supported UI validation was
  independently followed through serialization, not inferred from helper tests.
- Drops document pause/default Treasury events and Exchange panel/namespace
  events stay distinct. Immediate Drops consumers were inspected only for their
  current target/payload/invalidation contract. Complete B6 plan, Health, supply,
  countdown and readiness examinations remain outstanding.

### B5 verification and preservation

- Admin: `node --test --experimental-test-isolation=none --test-reporter=dot` with fifteen explicit `tests/runtime/*.test.mjs` paths: `beacon-wallet-boot-race`, `beacon-wallet-delayed-state`, `admin-indicator`, `pause-pending`, `pause-recovery`, `treasury-max`, `treasury-withdraw-input`, `treasury-quantity`, `treasury-submit-invalidation`, `treasury-refresh-order`, `treasury-pending-operation`, `treasury-confirmation`, `treasury-recovery`, `legacy-confirmation`, `fa2-balances` — **all selected tests PASS, native exit 0**. Existing MockTimers diagnostic only; no broad suite/build.
- Outer: `node audits/repro/AUD-011-admin-custody-repro.mjs` — **PASS**, repeated after final evidence additions; `node --check audits/repro/AUD-011-admin-custody-repro.mjs` — **PASS**. All I/O is inert. SDK import mock-ping messages do not represent a live connection. No environmental restriction was encountered or repeatedly retried.
- Harness corrections before the final successful run: added missing URL to the setup-prefix VM; supplied B's actual target/hash in its Pause read evidence (the fixture default uses its own last local send); re-entered B's withdrawal amount after successful recovery correctly cleared it. Initial assertions exposed those fixture assumptions; no production body was modified. Source-read PowerShell syntax/path errors were corrected without altering files or claiming verification from them.
- Focused diff inspection, `git status --short`, `git diff --stat`, `git diff --check` in both repositories — **PASS**. Untracked findings/evidence also pass `git diff --no-index --check -- NUL` (exit 1 for content differing from NUL; checkout line-ending advisories only). Both real index hashes and all five prior AUD-011 reproduction hashes match their starting values. Prior coverage/findings text hashes match when reconstructing the old status/checkpoint and original findings BOM; the original BOM is retained. No generated files, locks/journals, caches, existing assets or previous reproductions were modified. Only Outer coverage/findings and the new inert evidence file change; Admin remains clean. Both HEADs and branches are unchanged.

**B6–B7 remain outstanding; AUD-011 stays PARTIAL.** No fixes, remediation
checklist edit, production change, full-pass finalization, clean-result refresh,
live operation, external integration, export, commit, merge, push or deployment
was performed. Browser/SDK/provider/chain limits above qualify B5's bounded
completion and preserve E2's previously stated unresolved integration questions.

## Batch 4 examination — 2026-11-25

**COMPLETE / WITH FINDINGS: B4 / W09, W11, W12.** The complete
[B4 coverage ledger](coverage.md#aud-011--batch-4-examination-2026-11-25) records
the pre-examination source boundary, every planned slice, consequential negative
and recovery branches, direct producer/contract comparisons, checks and limits.
Current totals are **17 COMPLETE (bounded source), 9 PARTIAL, 14 NOT EXAMINED**
of 40 scopes. Completion is examination coverage, not a clean disposition.

Reviewed unchanged Outer `2453358c8cf91d4db3bc24e447ed0859f91216e8` and Admin
`d8636e957d3974ba73882d9d29242898f10ed3e0`, both
`ticket-AUD-011-full-correctness-review`. Initial Outer state comprised the
expected modified coverage and five untracked prior findings/reproduction files;
Admin was clean. Node `v22.16.0`, installed Beacon 4.8.1, fixed Shadownet Public
selection and current canonical params are the assumptions. B1/B3 dependencies
and E1 ABI evidence were reused only within their recorded bounds. No completed
batch was reexamined for credit, and the Admin SDK reproduction was not rerun.

Common new evidence:
[AUD-011-public-operations-repro.mjs](repro/AUD-011-public-operations-repro.mjs).
It loads existing fixture setup prefixes before their tests and runs current
production functions. DOM, browser journal, network, SDK lifecycle/transport and
response boundaries are inert. No real DAppClient is constructed, real storage is
accessed, connection made or transaction signed. The SDK getter/setter,
requestOperation, permission, serialization, peer selection and emitter methods
come from the installed package. Fixture clocks/schedules and synthetic accounts
establish controlled source failures, not observed live incidents.

### AUD-011-B4-001 — Stalled preflight reads indefinitely retain Public send ownership

**Confirmed source failure; provisional P2 (availability).** A failed provider
must allow the page to leave processing and recover without an unresolved
preflight permanently owning all subsequent actions. Operator and pair reads
precede wallet access and journal reservation, so a deadline here need not imply
that a wallet request was cancelled or that a submitted operation failed.

**Reachability/source.** Every supported Drops/Exchange send calls
`buildApprovalOps`, then `fetchTokenPairId` (`drops/js/events.js:1166–1175`,
`exchange/js/exchange.js:1289–1298`). Shared operator lookup awaits `fetch` and
`json` at `shared/public-trade-ops.js:355–357`; pair lookup does the same at
`:244–246`. Failed HTTP responses also await `response.text` at `:783` before
throwing. None has a deadline, abort owner or elapsed-time check. The complete
confirmation deadline later at `:383–478` does not cover preflight. Both page
handlers set their in-flight boolean before these awaits and clear it only in
`finally`; both status retry handlers return while that boolean remains true.
Wallet lifecycle invalidation can retire intent but cannot settle the held read.

**Observed.** Run both actual handlers with the actual shared helper at the
selected boundary. For operator and pair lookup separately, defer fetch, JSON
body or failed-HTTP text body: **12 cases**. After advancing the elapsed clock
one hour, processing is still owned; another invocation returns immediately,
no journal exists and no wallet request has occurred. Advancing Date is a probe
of missing elapsed-time enforcement, not a simulation of every browser task.
Release the very same deferred response: missing operators take the normal
approval fallback and reach the wallet; missing pairs return an error without
sending; all guards release. This distinguishes an actual unresolved provider
await from a broken handler fixture. Source contains no timer that could settle
the held read; a browser/transport's eventual timeout is not application recovery.

**Consequence/limits.** A stalled provider/request/body can strand the current
page in processing indefinitely, including after intent invalidation; click and
status retries cannot recover until that promise settles or the page reloads.
There is no demonstrated asset movement, duplicate submission or corrupted
journal in this preflight failure. Live provider incidence and browser transport
timeouts are unverified. Existing tests cover rejected/completed HTTP/JSON and
post-submission stalls, not indefinitely unresolved preflight reads. The
bounded correction is not implemented in this investigation.

### E2 extension — Public intent and retained journal can also disagree with SDK source

**Relevant new evidence for the recovered SDK finding, not a second independent
root finding.** Prior E2 evidence concerned Admin. B4 independently examined
Public's verifier, page authority gates, real SDK request boundary and Public
journal/confirmation consumers; no Admin action or authority module runs here.
The observed Public discrepancy has provisional P2 impact. Live signing,
financial impact and transport-dependent severity remain unestablished.

**Source trace.** `shared/beacon-setup.js:435–475` verifies the observed account
and rejects an intervening observed lifecycle generation. Drops captures its
page generation before the first account await and checks selection, balance,
configured quantity, LIVE and inventory after its final verified read inside the
submission lock (`events.js:1259–1278`). Exchange verifies address/generation and
current cart inside its lock (`exchange.js:1386–1398`). Both reserve a receipt
for A before calling `requestOperation({ operationDetails })`. These guards do
not carry A as an account equality precondition into Beacon's request.

Installed SDK behavior is the source behavior described in recovered E2 below:
the setter changes its exposed account promise before awaiting transport/peer/
storage and notifying the application; native `requestOperation` independently
reads that promise to derive sourceAddress/network. Later native makeRequest
reads the current account again for permissions and peer selection. The SDK has
supported inbound/cross-tab account replacement paths; this reproduction starts
at their setter seam, not an invented Public call to the setter. The inbound
account validation/manager path is not executed by this reproduction.

**Independent Public observation.** Begin with A and a valid selected trade. At
the final application's SDK getter, retain the actual getter promise for A and
start the actual setter for B. Public's complete real verification/epoch chain
still returns A before receiving the account event. Both actual handlers pass
their final guards and reserve A. Native requestOperation then emits
**sourceAddress B**, choosing B's synthetic prepaired peer, while the serialized
trade still carries **user_wallet A** and the saved hash/receipt still attributes
the request to **A**. The native event handler invokes the real Public subscriber;
its actual document publication is bridged to each fixture's production page
lifecycle consumer. The event can retire A after entry into the SDK request and
cannot revoke that request's subsequent dispatch. There is **no storage gate,
notification suppression or fabricated getter result** in the final experiment.
Unchanged A emits A; an event-first B transition retires the old projection and
emits nothing. All four controls and both discrepancies pass repeatably.

**Consequence and independent recovery distinction.** B1's source requires
`sp.sender == trade.user_wallet` for each trade. A B-signed A trade should fail
that check (or A's approval-owner check), preserving chain authorization; no
successful wrong-account trade or loss is demonstrated. Public confirmation
requires `op.sender.address === submittedTrade.account`
(`shared/public-trade-ops.js:591–594`). An operation row for B is therefore
ignored even when failed/backtracked/skipped. The reproduction asserts that a
terminal failed B row cannot classify the A receipt as failed. Thus the
misattributed reservation can keep A blocked with a known hash; subsequent
correct provider evidence for B does not unlock it through current status retry.
This differs from the recorded Admin matcher, which did not require the saved
sender. Hash capture, scope locks and stale-balance fences still work; they do
not repair the originating account mismatch. Actual signer, fees, operation
execution and persistent live blockage were not observed.

Controls assume two operation-permitted accounts, initialized extension/leader
transport, synthetic prepaired peers and an inert hash response. SDK storage
returns immediately resolved promises; its lifecycle, wallet info, analytics,
account-manager persistence, response and actual transport are inert. P2P,
WalletConnect/follower routing, later source/peer transition orderings, real
wallet prompts/rejections and hosted SDK identity remain unverified integrations.
No equivalent Public result is inferred for those paths from the Admin proof.

### B4 additional examination evidence and qualified boundaries

- Pair resolution checks all six exact terms and the complete mapping before
  accepting uniqueness. A later changed mapping is checked again by the contract
  and fails if the supplied terms disagree; client reads cannot reserve a pair
  or inventory. Operator reads can cause a redundant add_operator on failure;
  approval and trade remain ordered in one batch. Persistent approvals do not
  remove the contract's per-trade sender check. B1's native protocol/FA2 limits
  remain limits, not a fresh transaction test.
- Public Drops quantities/IDs/addresses agree with the direct Admin normalized
  pair→builder→chain-item boundary. Exchange's locked ACID/#0 identity agrees,
  but arbitrary positive Admin terms need not match Public's unit-burn/reward
  rule. Full producer controller/preview/cache/readiness examination is B6;
  none is credited here. E1 decoding is reused without another ABI run.
- Unconfirmed journal rows survive reload, ambiguous rejection, no-hash response,
  account changes and reset. Only a provenance-matched extension/P2P abort or
  complete terminal chain failure permits retry. Missing hash remains explicitly
  unresolved; inspecting wallet history does not itself change it. Emergency
  memory can retain a hash after persistence failure, while reload retains the
  earlier reservation. Browser eviction, durability and Web Locks scheduling
  remain external limitations, not guaranteed by in-memory fixtures.
- Receipt confirmation counts all submitted grouped trade calls, not approvals
  or one convenient row. Incomplete/duplicate/wrong-source/wrong-target evidence
  and inconsistent terminal statuses remain unknown. Missing/inconsistent levels
  can mark application applied while keeping holdings unavailable. The Public
  path always supplies a receipt; legacy any-applied/matcher interfaces are not
  its success oracle. The shared store assumes the supplied poller fulfills its
  contract: fixture stubs returning undefined alone are not real confirmation.
- Complete-reader provenance and block attribution control holdings cleanup,
  rather than apparent burn deltas. Same-token incoming transfers can offset or
  exceed the burn and still recover correctly. An absent row supplies no ledger
  level; explicit attributed zero recovers. Every duplicated/exact identity must
  be current. Post-timeout snapshots still pass consumer freshness gates before
  publication. The NFT poll budget is checked between full reads; individual
  pages have deadlines, so it is not a strict overall holdings deadline.
- The source contract's per-entry equality/sender checks and grouped external
  effects support interpreting a complete applied call under B1's identified
  artifact/protocol/FA2 assumptions. Indexer/hash/status/level accuracy, wallet
  hash fidelity, native effects/finality and deployed code were not independently
  attested. No live FA2/indexer/wallet evidence was obtained and no arbitrary
  hostile provider response is treated as authentic chain truth.

### B4 verification and limits

- `node --test --experimental-vm-modules --experimental-test-isolation=none shared/public-trade-pairs.test.mjs shared/public-trade-outcomes.test.mjs shared/public-trade-freshness.test.mjs shared/public-confirmation-deadline.test.mjs drops/js/trade-lifecycle.test.mjs exchange/js/exchange-wallet.test.mjs` — **238/238 PASS**, native exit 0.
- `node --test --experimental-vm-modules --experimental-test-isolation=none --test-name-pattern='(AUD-008-001|EA-XYZ-P3-T013|Wallet change during confirmed|Confirmed trade NFT)' drops/js/wallet-rendering.test.mjs` — **22/22 selected PASS**, native exit 0.
- `node --experimental-vm-modules audits/repro/AUD-011-public-operations-repro.mjs` — PASS, repeatedly, native exit 0; twelve stalled-preflight cases, two Public SDK discrepancies and response/authority controls. Exit 0 asserts the recorded defects. `node --check audits/repro/AUD-011-public-operations-repro.mjs` — PASS.
- During harness development, an unnecessary pair stub caused the operator control to stop before submission; a missing outer-VM structuredClone binding and an unchanged Exchange control clearing its receipt also needed correction. An initial schedule started the setter too late to change the SDK source and was rejected by the assertion; the final schedule starts it at the real final getter's captured-promise seam. These were harness/experimental corrections, not additional production findings. The corrected final harness uses actual Public publication and no artificial storage delay. Node VM/MockTimers warnings and SDK import/timing diagnostics are expected; explicit native exit codes are successful. No environment-blocked command was retried; one PowerShell source-read command's brace syntax was corrected.
- Final focused diff inspection, `git status --short`, `git diff --stat`, `git diff --check` in both repositories — PASS. `git diff --no-index --check -- NUL` on untracked findings/new evidence reports no whitespace errors (exit 1 for content differing from NUL; ordinary LF→CRLF advisories only). Both HEADs/branches and index SHA-256 hashes remain unchanged. Task-created ignored logs were removed using exact workspace-verified paths; earlier evidence/assets/operational state remain.

Only Outer audit records and the new reproduction changed during B4. Admin is
clean; runtime, generated config, contracts, remediation checklist and prior
reproductions are untouched. Builds/broad final verification and ticket:diff
exports are deferred by task instruction. No external operation, transaction,
Git integration, remediation, B5 examination, clean refresh or AUD-011
finalization occurred. **B5–B7 remain outstanding.** No consequential B4 source
path remains unexamined; the external/live limits above qualify completion.

## Batch 3 examination — 2026-11-25

**COMPLETE / WITH FINDINGS: B3 / W01, W05–W08, W10**, through final Public
observation/cart/action inputs, excluding B4 operation construction/outcomes and
B7 first-paint/delivery. All four slices and consequential negative/recovery
branches were examined with forward, reverse and boundary analysis; the detailed
[coverage ledger](coverage.md#aud-011--batch-3-examination-2026-11-25) records paths,
properties, evidence and exclusions. Current totals: **14 COMPLETE (bounded
source), 11 PARTIAL, 15 NOT EXAMINED** of 40 scopes.

Source remains Outer `2453358c8cf91d4db3bc24e447ed0859f91216e8` and Admin
`d8636e957d3974ba73882d9d29242898f10ed3e0`, both
`ticket-AUD-011-full-correctness-review`. Initial Outer changes were the expected
coverage edit and four untracked prior evidence files; Admin was clean. Node
`v22.16.0`, installed Beacon SDK 4.8.1 and Public Shadownet configuration were
used. B1 identities/B2 accepted configuration contracts were reused as dependency
facts; neither previous batches nor E1/E2 validation were rerun. Installed SDK
getter/setter/clear/emitter examination below is a direct W01 dependency, not
another Admin operation-binding test. Historical audits supplied no credit.

The following are **confirmed source failures with provisional P2 impact
assessments**, not observed live incidents. Common evidence:
[AUD-011-public-observations-repro.mjs](repro/AUD-011-public-observations-repro.mjs).
It loads the current inert fixtures only through their setup prefixes, evaluates
current production functions, and asserts both the defect and distinguishing
controls. No SDK client is constructed and no operation handler is invoked by
this reproduction. Network, storage, timers and DOM boundaries are inert; the
installed SDK methods run against a plain object. Exit 0 means the recorded
failures were observed, not that these paths passed a clean correctness check.

### AUD-011-B3-001 — Delayed disconnect overwrites a newer valid wallet

**Reachability/property.** Desktop/mobile explicit disconnect calls
`shared/beacon-setup.js:511–525` `disconnectWallet`. It awaits Beacon clear and
then unconditionally calls `syncDisconnectedWalletState` (`:390–406`). A newer
valid account event must retain ownership of shared wallet/pane state. Unlike
mismatched-account cleanup, explicit disconnect has no captured-generation guard.

**Observed.** Run actual installed `DAppClient.getActiveAccount`,
`setActiveAccount`, `clearActiveAccount` and `BeaconEventHandler.emit` with inert
transport and deferred storage. Start disconnect A; let clear mutate SDK state
and wait at its real storage await. Start B's setter and hold its storage. Release
clear; its null event releases B's storage before clear's application continuation.
The SDK's actual non-awaiting emitter/microtask order produces shared publications
`A → null → B → null`. The last null comes from the old `disconnectWallet`
continuation, while the real SDK getter and Public verification still return B.
Connected controls hide, Connect reappears, and each page's shared-state consumer
retires B's holdings. A normal disconnect without B remains disconnected; a fresh
B event restores connected state. This does not suppress any authoritative later
SDK null event or assume an in-flight clear can be cancelled.

**Consequence/limits.** A supported overlapping SDK account lifecycle can leave
the public UI disconnected from its verified active wallet until another event
or reload. This is an availability/state-ownership defect, not a demonstrated
wrong-signer transaction. Pairing/transport timing and a live incident are
unverified. Direct SDK dependency locations: installed
`node_modules/@airgap/beacon-dapp/dist/esm/dapp-client/DAppClient.js:622–749` and
`dist/esm/events.js:658–670` (execution uses their installed CJS exports).

### AUD-011-B3-002 — Hidden-tab resume retains obsolete actionable LIVE

**Reachability/property.** After trusted expiry,
`shared/drop-countdown.js:183–189` stops its timer/listeners, then
`drops/js/events.js:2562–2588` owns continuing pause polling. The remaining
owner handles pagehide/BFCache, but not visibility/focus/online resume. The main
visibility hook (`events.js:3102–3105`) only reconciles supply. LIVE should not
retain current actionable authority from an arbitrarily old pre-suspension pause
observation.

**Observed.** Reach verified LIVE through the real shared countdown and Public
pause loop. Give the reachable connected/selected state sufficient inventory.
Hide, suspend polling tasks for one hour, then deliver visibility before the
overdue retry task. The trusted countdown has already removed its listeners;
resume starts no pause read and retires no pause evidence. Both pills still say
`LIVE NOW!`, `contractPaused === false`, and the real
`computeExchangeButtonState` still returns the send handler. Running the delayed
retry and returning `paused:true` closes the action and restores standby.
Existing ongoing-poll/deadline tests pass, but test completed reads and timeout
callbacks rather than expiry of previously cached LIVE across visibility.

**Consequence/limits.** If the escrow pauses during suspension, the returned page
can advertise and permit entry to Exchange using hour-old availability evidence.
The contract's pause enforcement remains intact; this is false actionable
readiness, not demonstrated loss or successful execution while paused. An active
read's 10-second deadline checks that response, not the age of retained LIVE.
The fixture deliberately controls timer/task ordering; no claim is made that a
specific browser always delivers resume this way. Full signing/outcome behavior
remains B4, and actual chain/indexer/browser behavior is unverified.

### AUD-011-B3-003 — Exchange accepts malformed edition prefixes as reward terms

**Reachability/property.** CMS edition text enters `window.getEditionCount`
(`exchange/js/exchange.js:196–206`), then `getBurnCart` (`:760–784`) uses
`ceil(100 / editions)` as a per-unit financial term. Cart rendering separately
uses `parseInt` at `:981–982`. Editions are whole counts; missing, fractional or
malformed text must not acquire a confident reward through a numeric prefix.
Safe reward arithmetic does not validate the original edition count.

**Observed.** With real connected holdings/quantity projection, select one unit
and change only its CMS edition text. `1e2`, `1.5` and `1,000` all produce a
per-unit reward and displayed total **100** with an active Exchange control;
`31oops` produces **4**. There is no error. Actual cart extraction, total
calculation, cart rendering and bottom-action code run. Valid `31` and `100`
controls yield 4 and 1; empty/zero/negative/wholly-nonnumeric controls fail closed.
No pair lookup, approval or operation request occurs in the reproduction.

**Consequence/limits.** A malformed or formatted CMS value becomes trusted
financial intent, rather than unavailable data. For example, if grouping text
`1,000` denotes 1000 editions, the quoted value is 100 instead of 1. No current
malformed hosted CMS row or overpayment is established. Downstream exact pair
matching can reject these terms; it does not repair the false actionable quote.
Full producer/public pair comparison remains B4/B6 at its planned boundary.

### Additional B3 evidence — standby display and rejected hypotheses

`events.js:217–244` treats any dynamic DOM string ending in `…` as already
truncated. Legitimate `STANDBY…` therefore restores the previously cached mobile
countdown text. The real ellipsis function, a wide nonoverflowing element and
`TIME UNAVAILABLE → STANDBY…` reproduce `TIME UNAVAILABLE`; `LIVE NOW!` updates
normally. This is a confirmed display discrepancy, recorded separately from
material findings: `AppState` stays standby/paused and no trade gate is enabled.
Existing countdown fixtures stub `applyEllipsis`, so their pill assertions do not
cover this consumer. Desktop countdown is not in the ellipsis selector set.

Other challenged paths did not establish additional material failures: exact
native IDs survive canonical exclusion/mirror projection; unsafe/overflowed
balances and incomplete pages retire quantities; current failures expose retry;
obsolete A/B/reconnect results cannot replace current rows. Zero supply's lack of
automatic replenishment polling is explicit current policy, not a newly inferred
failure. Disconnected canonical catalogue previews are not connected ownership
evidence. A hung image can retain its image spinner but does not hold the
independent metadata/supply/action authority. Fixed Public network selection is
not a runtime switch. Retained post-trade publication gates were traced only to
their freshness/epoch boundary; no B4 send/recovery examination credit is claimed.

### B3 verification and limits

- Core focused invocation recorded in coverage: **118/118 PASS**, native exit 0.
- `node --test --experimental-vm-modules --experimental-test-isolation=none --test-name-pattern='(AUD-007-001|AUD-003-002|BAL-001|FIND-P2-002|FIND-P2-014|Pending and disabled|Late success and failure|Current fetch failure|Wallet change during|huge verified holdings|aggregate 51|Startup, disconnect|Successful refresh uses|Initial refresh failure|Late wallet refresh|Malformed balances|Retry results|Invalid selections|oversized|forged)' drops/js/wallet-rendering.test.mjs exchange/js/exchange-wallet.test.mjs` — **27/27 PASS**, native exit 0.
- `node --experimental-vm-modules audits/repro/AUD-011-public-observations-repro.mjs` — PASS, including installed SDK ordering, three bounded defects, display evidence and their controls. Corrected harness passed repeatedly; initial harness-only failures (missing SDK delegate and cross-realm array comparison) were corrected without application edits.
- `node --check audits/repro/AUD-011-public-observations-repro.mjs` — PASS. `git diff --check`, focused diff inspection, `git diff --stat` and `git status --short` in both repositories — PASS; `git diff --no-index --check -- NUL` for the untracked findings and new reproduction — PASS (Git's expected LF→CRLF conversion warnings only). Experimental Node warnings are expected; explicit native exits distinguish them from PowerShell's stderr wrapper. No process-spawning check was needed, and no blocked B2 command was rerun.

Final Git state: Outer has modified `audits/coverage.md` and five untracked files
(findings and the four preserved/new AUD-011 reproductions); Admin is clean.
Both branches/HEADs above and both index SHA-256 hashes are unchanged across final
verification. Four task-created TAP/stderr logs were removed by exact verified
workspace paths; pre-existing ignored work, operational files and evidence remain.

No live wallet/SDK transport, CMS, time service, TzKT/RPC, browser suspension,
contract state or hosted/deployed identity was observed. Complete pagination is
not an atomic cross-page chain snapshot. Native provider decimal identity and
FA2 compatibility assumptions remain external contracts, not facts proved by
mocks. Post-operation balance attribution/signing/finality remain B4; native
contract execution remains unverified as in B1. No builds/broad suites were
appropriate for these documentation/evidence changes. B3 source examination is
complete with findings; AUD-011 remains PARTIAL and not clean. Batches **4–7**,
their original dependencies and remaining external uncertainties are unchanged.
No remediation, compact-checklist edit, clean refresh, finalization, exports,
operational writes, Git integration or transactions occurred. Only Outer audit
records and this new reproduction changed; Admin, runtime/generated files,
prior evidence, branch/HEAD/index and operational state are preserved.

## Batch 2 examination — 2026-11-25

**COMPLETE / WITH FINDINGS, bounded source examination: B2 / W30–W32.** All three
planned slices were examined through configuration files and committed snapshot
publication, including alternate CLI entries, negative branches, supported
contention, interruption/recovery and consumer invalidation. The
[coverage ledger](coverage.md#aud-011--batch-2-examination-2026-11-25) records source
paths, obligations, actual commands and stop boundaries. Current totals are
**8 COMPLETE (bounded source), 11 PARTIAL, 21 NOT EXAMINED** out of 40 scopes.

Reviewed unchanged Outer `2453358c8cf91d4db3bc24e447ed0859f91216e8` and Admin
`d8636e957d3974ba73882d9d29242898f10ed3e0`, both
`ticket-AUD-011-full-correctness-review`. Initial Outer changes were the expected
prior coverage edit and recovered findings/ABI/SDK files; Admin was clean. Node
`v22.16.0`, current local dependencies and a coherent local NTFS/PID namespace were
used. B1's exact native redeem identities and current Shadownet registry were
reused only as direct dependencies; ABI/SDK/native contract examinations were not
repeated. Historical tests supplied no examination credit.

The five entries below are **confirmed source-level failures with provisional
impact assessments**, not live incidents or authorization to fix. They affect
token/configuration identity, local availability or actionable readiness. The
common evidence is [AUD-011-config-propagation-repro.mjs](repro/AUD-011-config-propagation-repro.mjs).
It copies current modules into a new `audits/work/AUD-011-batch2-*` directory and
uses real validators/projector/service/writer/provider/controller/view functions.
Its UI is the existing session fixture's inert DOM; filesystem scheduling and a
child lock holder are controlled. It starts no operational service, signs
nothing, makes no external requests and deletes only its verified disposable
root. Exit 0 means the asserted defects and distinguishing controls were observed,
not that the implementation is correct.

### AUD-011-B2-001 — HEN redeem is admitted despite its burn-only role

**Corrective disposition — 2026-11-25.** Confirmed conditional **P2**, unresolved;
Checklist **0.1** now concerns collection-role admission. The original diagnosis,
“HEN redeem selection publishes the canonical ID as native,” incorrectly treated
UI/validator acceptance as intended support and recommended translation. That
interpretation and remedy are superseded; the observed reproduction is preserved.

**Requirement and documentation gap.** The owner's AUD-011 B2-001 correction
explicitly establishes that HEN tokens are burn-side assets, not eligible Drop
redeem assets. This task requirement is the eligibility oracle, consistent with
[project intent](../PROJECT_INTENT.md#knowledge-and-ai-assisted-engineering): code
and tests establish behavior, not intent. The repository's
[collection policy](../docs/admin-authoring-pipeline/06-collection-policies.md#hen)
records HEN's current burn role and no permission for new HEN redeem works;
the [handoff restrictions](../docs/admin-authoring-pipeline/08-canaan-drop-handoff.md#what-the-handoff-must-not-do)
prohibit eligibility by analogy. Those design records concern future new-work
authoring, and [A-020](../docs/admin-authoring-pipeline/12-decisions-and-invariants.md#a-020--additional-collection-authoring)
leaves wider collection eligibility open. They do not independently supply a
complete current Drop role matrix. Before this correction, the developer guide
described admitted HEN redemption as a surface capability without distinguishing
intent. Its [Drops paragraph](../docs/developer-guide.md#drops-architecture) now
records the requirement/implementation conflict. No CANAAN-only rule, INTRODUCTIONS redeem
restriction or other additional eligibility policy is inferred here.

**Actual reachability, not supported behavior.** Local CREATE/EDIT offers HEN
redeem with a distinct INTRODUCTIONS burn. The service's
`drop-params-authoring-service.mjs:354–359` supplies the general
`KNOWN_COLLECTION_KEYS`; `authoring.view.js:417` uses those same capabilities
for the redeem selector without role filtering. `authoring/index.js:11–16`
supplies `localTokenRows` unchanged; `titles.manifest.js:48–54` reads canonical
title keys. `authoring.tokens.js:5–15` makes those IDs selector values;
`authoring.view.js:312–321,545–577` preserves the selected value as
`redeemToken.tokenId`. The authoritative schema checks collection membership,
decimal ID/amounts and distinct contracts (`drop-params-authoring.mjs:256–280,331`),
then shares `validatePublicDropCompatibility`. That gate uses
`PUBLIC_DROPS_COLLECTION_KEYS` (`chain-registry.js:106–111`), which includes HEN
as both a burn and redeem capability. Service validation/preview/apply and the
locked CLI writer converge on this admission. Public's
`drops/js/events-config.js:45–56` uses the same permissive compatibility gate.
Thus distinct contracts do not enforce the HEN role restriction. Existing
`drops/js/drop-compatibility.test.mjs` also encodes HEN redemption as supported;
its passing matrix is implementation evidence with an incorrect eligibility
oracle, not an independent requirement. No production code or test is changed.

**Observed.** The real form populated with current HEN title data offers COPY
MACHINE as `141634`, never native `6`; the operator preview also calls it COPY
MACHINE. The real validate→preview→apply→writer→service snapshot path accepts and
commits `141634`. Current `chainRegistry.testnet.mirrors.HEN['141634']` is `6`.
A direct candidate using native `6` validates as the serialization control.
Both IDs belong to ineligible HEN redeem configurations; accepting `6` does not
make it a valid product control. The same script's active HEN-burn/CANAAN-redeem
case is the eligible role control. The reproduction omits only thumbnail URLs
from the title callback; it executes actual form population/serialization.
Downstream `drops.data.js:294–295,456–462`, `drops.builder.js:77–80` and Public
`drops/js/events.js:726–736,2211–2226` preserve the configured native redeem ID.
That explains the observed mismatch but cannot legitimize the collection role.

**Consequence/severity/limits.** An operator must choose HEN and approve the
preview/apply, or supply an equivalent candidate through an existing writer
entry. The application can then commit and propagate an ineligible Drop as
admitted configuration. Inventory/pair lookups and plans target that configured
HEN identity; missing inventory/pairs can block use. Any chain effect additionally
requires funding, matching on-chain terms, wallet authorization and successful
execution, none established here. Contract-level generic FA2 support does not
define product collection eligibility. The checked-in HEN-burn/CANAAN-redeem
snapshot is unaffected. P2 is retained for reachable consequential configuration
admission, not for denying a required HEN redemption feature, a proven live
incident or demonstrated funds loss. Token `141634` existence/custody and live
reachability remain unverified; no B3/B6 completion credit is added.

**Remediation boundary.** Reject HEN redeem selection and candidates at the UI
and shared authoritative schema/compatibility boundaries used by service, CLI
writer and Public runtime; align capability semantics and the mistaken test
oracle with that restriction. Preserve supported HEN burns, canonical burn
exclusions, mirror translation and exact native IDs for eligible redeems.
Translating HEN redeem `141634` to `6` would leave the admission defect intact.
The original script and all historical logs remain unchanged; its assertions
record accidental acceptance and ID serialization, not future expected behavior.

### AUD-011-B2-002 — Valid unscheduled canonical content prevents Admin initialization

**Reachability/property.** Manual source editing outside authoring/recovery is
supported, followed by normal generation/mirroring. The canonical validator
(`drop-params-authoring.mjs:298–335`) deliberately accepts complete authored
content with `dropScheduled:false` as well as the exact empty inactive template;
current tests explicitly exercise this domain. Production and development
providers must be compatible with these supported source snapshots.

**Observed.** Starting with the valid active control, change only
`dropScheduled` to false. Actual canonical validation and projection/equality
pass, and the actual service returns equal/unblocked representations. Admin
`drop-params.provider.js:59–69,94–118` instead requires every false snapshot to
equal the empty inactive shape. Production provider creation throws
`invalid_snapshot`; development refresh publishes ERROR/null params. Active and
exact inactive controls both publish READY.

**Consequence/limits.** Production `admin.js:245–248` cannot initialize Drops from
this supported mirror and stops that startup callback at the provider throw.
Development cannot publish initial Drops or enable authoring to schedule a
replacement. Fixing the source through the supported manual/CLI route can recover;
this is availability/schema disagreement, not a demonstrated chain mutation or
corruption. The currently checked-in active CANAAN-redeem configuration is unaffected.

### AUD-011-B2-003 — Healthy polls cannot restore authoring controls after busy/recovery

**Reachability/property.** Authoring can start or poll while its service writer
is busy or has a pending journal. After the owner releases/reconciles and a
verified snapshot is READY, the existing health loop should restore controls.
`authoring.controller.js:176–186` updates a monitor result's status only when
the previous status is OFFLINE or the new service status is not READY.
`renderServiceState` enables controls only for READY.

**Observed.** With the real provider/service and no open operation, acquire the
disposable writer lock: initialization becomes BUSY/disabled. Release the lock
and invoke the actual scheduled health callback twice: provider and snapshot are
READY/unblocked, but controller status remains BUSY and controls remain disabled.
Repeat with a real interrupted writer journal and explicit successful reconcile:
RECONCILIATION REQUIRED remains latched after healthy polls. Healthy initialization
and explicit non-monitor refresh are passing controls.

**Consequence/limits.** A resolved local condition can strand all authoring
entry controls until reload or another explicit non-monitor refresh. The bound
view has no general refresh action to perform that recovery when no modal is
open. Provider/Drops recovery itself works; this finding concerns the authoring
control state, not permanent writer blockage or rollback correctness. Existing
OFFLINE→READY tests do not cover these previous statuses.

### AUD-011-B2-004 — A supported concurrent commit can misbind snapshot version

**Reachability/property.** A service snapshot's params and sourceVersion must
describe one committed source image. `drop-params-projector.mjs:484–491` hashes
the source before separately importing it; service `readRepositorySnapshot`
(`drop-params-authoring-service.mjs:195–231`) reads import/source/projections in
parallel without the writer lock. Equality compares params/projections but never
binds the separately read source bytes/version. `getState` also reads writer
state independently.

**Observed.** Capture source A's actual version bytes, pause that return and the
three other actual snapshot reads, then complete a supported locked EDIT to B.
Resume reads unchanged: real service reports params B, equal=true, but A's
sourceVersion. An already READY provider for A treats that as `sameSource`
(`drop-params.provider.dev.js:119–120`) and retains A without publishing B. The
reproduction delays real reads only; it substitutes neither bytes nor API/writer
results. An ordinary subsequent poll publishes B with B's correct hash, and a
fresh preview using A's stale version rejects as the controls.

**Consequence/limits.** Version/content binding is false; an initial consumer can
receive B under A's digest, while an existing consumer can suppress B and retain
READY A. This is beyond an ordinary coherent-but-old snapshot. Fresh writer CAS
remains intact: no wrong write, lost update, chain send or financial outcome was
demonstrated. The ordering is deterministic seam evidence, not measured incidence
under native browser/filesystem scheduling. It uses supported writer contention,
not the accepted unsupported independent-editor race.

### AUD-011-B2-005 — A different process's live lock does not mark the service busy

**Reachability/property.** CLI/watcher and service normally run in different
processes but share one repository lock. `inspectLockClaim` in
`drop-params-projector.mjs:202–222` returns `owned` only for this process's owned
claim; another live PID is `active`. Service
`drop-params-authoring-service.mjs:231–244` defines busy using only `owned` or
`contended` (`contended` is not returned by this inspector).

**Observed.** A real child acquires and retains the disposable lock. Actual API
getState reports lockState=active and busy=false; real provider publishes READY
and preview issues a token. Same-process owned-lock rejection is the control
already exercised above and by the existing service contention test. The child
releases its lock normally and current representations remain equal.

**Consequence/limits.** Cross-process contention is presented as available;
preview is authorized despite the documented busy precondition. Apply can enter
lock waiting/timeout instead of rejecting busy (source trace), consuming a
single-use preview and requiring another preview after failure. The underlying
lock still serializes writes and the writer rechecks source/equality; no lock
bypass or overwrite was observed. A pending journal may independently block
readiness after a transaction starts. Existing same-PID lock tests and mocked
writer.busy responses miss this classification mismatch.

### B2 verification, remaining scope and preservation

Fresh focused execution is recorded in the coverage ledger: Outer 101/107 initial
passes with six sandbox process failures, then all six selected tests PASS with
permitted process access (including 54 schema/writer/service and one watcher
check inside disposable copies); Admin 80/80 PASS with native exit 0. The initial
Admin combined-redirection shell status was 1 solely on an experimental warning;
separate stderr/native-exit capture resolved it. No automatic approval rejection
occurred. No production fixture was run against real canonical/mirror files.

The finalized reproduction ran twice with all five defect assertions and
distinguishing controls passing. Its SHA-256 and final whitespace/state results
are recorded at completion below. Ignored detailed outputs are
`audits/work/AUD-011-batch2-outer-tests.log`, `AUD-011-batch2-outer-retry.log` and
its `.stderr.log`, `AUD-011-batch2-admin-tests.log`,
`AUD-011-batch2-admin-native-exit.log` and its `.stderr.log`; these are local test
transcripts, not new audit infrastructure or deployed evidence.

All B2 consequential source obligations are examined; findings remain unfixed.
External/live browser behavior, native scheduling incidence, remote publication,
deployed code/chain state and machine/power-loss durability are unverified.
One-host coherent filesystem/PID/UUID assumptions, no mixed writer versions and
the existing unsupported independent-editor overlap limitation remain explicit.
No final clean-result refresh, checklist change, export generation, operational
mutation, transaction, build or deployment occurred. Batches **3–7 remain
outstanding** in the preserved plan; AUD-011 remains **PARTIAL**. B1/E1/E2 and
their exact existing evidence are preserved, not broadened by these findings.

Completion checks: finalized reproduction SHA-256
`98FC3F012432F37671E6CDF78587376BD4727DCB2399992AF1DED98B648B558C`;
two consecutive native-exit-0 runs retained in ignored
`audits/work/AUD-011-batch2-repro-final-{1,2}.log` and corresponding `.stderr.log`.
`node --check audits/repro/AUD-011-config-propagation-repro.mjs` PASS.
Focused diff review, `git diff --check`, `git diff --stat` and `git status --short`
completed in both repositories; untracked findings/reproduction also passed
`git diff --no-index --check -- NUL <path>` (checkout LF→CRLF advisories only).
A 54-entry hash/path snapshot of the real Drop Params tree, mirror, both indexes
and recovered reproductions is unchanged. Removing only the new section/status/
plan annotation reconstructs the initial findings SHA-256
`44937B86C6BCBD93118A4BFF61717B9775DBE79773C5404D15992EB8DC4D80A9`.
Only Outer `audits/coverage.md`, `audits/AUD-011-findings.md` and the new config
reproduction change for B2; Admin remains clean. Both verified branches/HEADs
are unchanged. No staging, commit, merge, push or exports.

## Batch 1 examination — 2026-11-25

**COMPLETE, bounded source examination: B1 / W02, W33–W35, W40.** All three recorded slices were examined through their consequential effects and identified external boundaries. This supersedes these five rows' initial NOT EXAMINED labels in the preserved inventory below. Current totals: **5 COMPLETE (bounded source), 11 PARTIAL, 24 NOT EXAMINED**. Completion does not include native contract execution or live integration. No Batch 2 work, production fix, final coverage refresh or checklist update was performed. The existing E2 finding remains confirmed and unresolved; no additional material finding or unresolved source-level hypothesis was established in B1.

Source: Outer `2453358c8cf91d4db3bc24e447ed0859f91216e8`; Admin `d8636e957d3974ba73882d9d29242898f10ed3e0`, both `ticket-AUD-011-full-correctness-review`. Initial Outer state was the expected modified coverage file and three recovered untracked evidence files; Admin was clean. Application source was unchanged throughout. Existing E1 decoding and E2 account-binding evidence were preserved and not rerun. Local checks used Node `v22.16.0`, installed Taquito 19.0.2 packages and Python; no dependency installation or external request was made. Configuration assumptions remain those in the inventory, including Shadownet's `testnet` slot and unconfigured Mainnet.

### Expected properties and traversal

Project intent supplies exact financial identity, current authority and truthful outcome requirements. Constructor/storage and declared entrypoint types supply the supported state domain; UI restrictions are not assumed to apply to direct callers. For honest compatible FA2 transfers, each successful trade must debit the specified user's configured burn quantity to the stored sink and debit the escrow's configured redeem quantity to the same user. Pair cardinality must equal existing IDs; only the stored admin may change configuration or dispose of custody. Provider observations, staged events, wallet acceptance and chain application remain distinct evidence.

Forward examination covered registry selection/resolution and every escrow entrypoint, including construction, empty inputs, repeated actions and error branches. Reverse examination started from every `sp.transfer`, `sp.send`, mapping/count/pause mutation and event and traced its parameters and authorization to direct calls and the existing Public/Admin/provisioning consumers. Boundary examination compared surface/network/address and mirror identities, exact nat/mutez terms, FA2 handles and recipients, source/fixture/release identities, and funding observations. The table records source reasoning separately from executed checks.

| Behavior / current evidence | Examined branches and result |
| --- | --- |
| **W02 configuration identity.** `shared/chain-registry.js:1–305`, `shared/network.js`; `drops/js/events-config.js`, `exchange/js/exchange-config.js`; Admin `src/network.js`, `src/utils/live-cfg.js`. | Current Public and Admin Shadownet Drops targets both resolve to `KT1HMCqYqyP9fTDjzm8KAfyPhFn3tpmSW4kc`; Exchange resolves to `KT1Ue9es4biDzt528YhNctPGcNeqw9nDXnSv`. The legacy root target remains separate registry data. Public Exchange is strict; Admin retains fallback metadata but its Exchange action resolver rejects legacy fallback. Testnet Drops compatibility fallback is intentional; Mainnet Public Drops requires a dedicated address. Mainnet is unconfigured on current copies; unknown Public `NETWORK` throws, while unsupported Admin persisted selection defaults to testnet. Checked all current nonempty address checksums, mirror key/value nat shapes, injectivity, safe translated IDs, both slots' targets and copied ranges/mirrors. Current mirror values are small; the numeric legacy translator is not assurance for future large mirror values. Mainnet→testnet maps retain direction and collection separation. Persist/clear/reload and asynchronous surface lifecycle remain B5; CMS/translation consumers remain B3/B6. |
| **W33 trade admission and exact effects.** SmartPy `:368–495`, constructor `:176–196`, FA2 type `:154–165`; Public trade builders and `shared/public-trade-ops.js:194–280` at the dependency boundary. | Paused or empty rejects before transfers. Inside the loop, every item requires an existing ID, all six exact stored terms and `sp.sender == user_wallet`; a valid first item cannot authorize a later mismatch. Zero quantities cannot enter reachable mappings through set/update; token and pair ID zero and arbitrarily large naturals remain exact on-chain. Repeated valid entries intentionally repeat both debits; amounts are not multiplied by caller quantities. Burn uses stored ID/amount and user→stored sink; redeem uses escrow→same user and equality-bound redeem amount. Unknown/deleted/reconfigured pairs, zero/malformed/negative/overquoted terms and foreign wallets fail by type or explicit check. Successful trades do not mutate pair/count/pause/admin/sink state. No first-item-only or redeem-amount bypass remains in current source. |
| **W33 grouping, failure and ordering.** Same trade loop and both grouped transfer loops `:421–494`; promoted Michelson initiate-trade block. | Transfers are grouped separately by FA2 and role, not by pair ID: multiple tokens, repeated pairs and heterogeneous FA2s retain their source/destination/amount records. List `push` prepends within a group; map iteration supplies contract-key order. This is grouped execution, not a promise of cart order or sequential per-trade settlement. Reciprocal cross-role FA2s and shared redeem inventory still require sufficient balances when the queued transfers execute; there is no netting promise. Missing/incompatible handles fail; absent/revoked operator, aggregate burn/redeem shortage and rejecting FA2 propagate failure without a swallowed exception or partial-success branch. Whole-call effects/events/attached tez rollback relies on Tezos internal-operation atomicity, explicitly unexecuted here. Separate manager operations can be ordered around pause/update/rescue; each trade evaluates its then-current mapping/pause and FA2 balances. There is no application await inside on-chain validation; malicious FA2 callbacks/nonconforming semantics are an external trust boundary. |
| **W34 pair lifecycle.** SmartPy `:499–675`; Admin `src/features/pairs/pair-compatibility.js`, shared `token-pair-terms.js`, Public `fetchTokenPairId` consumer. | Set is admin-only, rejects existing IDs and intra-list repeats, zero amounts and same burn/redeem FA2. An invalid later item must rollback earlier inserts/count/events under protocol atomicity. Empty set is an allowed no-op with an empty event. Update validates amounts/distinct contracts, admin and existing ID, writes only the six terms, preserves count, and emits changed fields only when different; invalid input may fail before authorization without a write. Cleanup deletes each present ID once and decrements once; missing/repeated IDs are reported as failed deletions, not whole-call failure. Empty cleanup is allowed. From empty constructor state, set +1 / update 0 / present cleanup −1 preserves cardinality and prevents underflow. Naturals are unbounded by JS safe-integer limits on-chain. Pause does not restrict these privileged entries. |
| **W34 uniqueness/consumer comparison.** Same pair entries and exact-term consumer seams. | Contract uniqueness is by **ID**, not six-term tuple; direct authorized set/update can create duplicate terms at other IDs. Current Public correctly returns no pair on ambiguity. Current Admin preflight rejects duplicate terms and unreadable mapping evidence, accepts a distinct tuple and unchanged-ID update, and rejects unsafe numeric identity. Existing AUD-010's application-side protection is present; direct admin trust and preflight-to-chain concurrency are not contract-level uniqueness guarantees. Complete producer UI/readiness/send/race examination remains B6 and Public operation handling remains B4; neither receives completion credit from these focused dependency checks. |
| **W34 pause and custody actions, separately traced.** SmartPy `:220–248,258–361`. | Six privileged entrypoints use stored-admin sender equality; no replacement-admin or sink setter exists. Toggle changes exactly one boolean and reports its new value; two successful calls restore the original state, so retry is not idempotent. XTZ withdrawal requires positive mutez and sufficient balance, sends exactly to stored admin, and reports the requested amount/success. Zero, overbalance, outsider and incompatible/rejecting recipient cannot commit a successful payout under the protocol assumption. Token rescue requires admin/positive nat, sends the exact token/amount from escrow to the supplied recipient through a typed FA2 handle with zero attached tez; balance/operator enforcement is delegated to FA2. Arbitrary token/recipient, full balance and self-recipient are allowed, independently of pause/pair configuration; no approval or user-to-escrow transfer is fabricated. No contract recovery/resend mechanism exists: client uncertainty/recovery remains B5. |
| **W35 funding and observation boundary.** SmartPy `:681–696`; Public `shared/beacon-setup.js:270–292`, `drops/js/events.js:894–908`; Admin `src/tzkt-api.js:383`, `features/drops/drops.checklist.controller.js:481–525`, Treasury fetchers. | Default accepts positive tez from any sender and emits amount only; zero default rejects. Other entrypoints do not reject attached tez: successful calls retain it, failed calls rely on rollback, and withdrawal's available balance includes ingress. FA2 funding is a ledger transfer into escrow, not a default call, mint or pair change. No internal ledger/initial-supply reservation or refund entitlement is inferred. Supply consumers select both FA2 and token ID at the configured escrow from the complete shared reader; failed reads reject rather than establish an absent token. Funding alone establishes neither unpause nor trade success. Exact holdings publication, continuing supply/unknown/stale behavior and Treasury balance/MAX controllers remain B3/B5/B6. Sink transfers preserve FA2 total supply; sink unspendability/key control is not enforced. If a controlled sink trades with itself, self-transfer need not consume its tokens: this is part of the explicit sink-trust assumption, not proof of supply destruction. |
| **W40 provenance and consumer identity.** Canonical source, legacy snapshot/stripped fixture, audit tests/verifiers/provenance and release Phase-7/8/10/11 records, promoted/historical `.tz`, deployment note; `scripts/shadownet-exchange-pairs.mjs:94–109`; preserved E1 script artifact path. | Freshly checked all 31 manifest rows against exact checkout and current HEAD blobs, three archive hashes, canonical/snapshot equality, and mechanical removal of embedded tests/dedent of unchanged target. Promoted LF artifact equals the frozen Git blob, SHA-256 `FE850EA74A082D8E57EE47D0E3D70339088D1490128D93A86BDDDB338947F0A9`; freeze/promotion creation commits and parents match the records. Historical check artifact has a different identity: parsed comparison finds exactly 37 integer-leaf changes, each in `PUSH int` immediately before `FAILWITH`, consistent with recorded compiler differences. This is not a new proof of semantic equivalence. Exact eight compiled event schemas pass the maintained verifier helper; a nat→int mutation rejects. The Phase-11 compressed archive has its recorded 1,032,879-byte hash and both archived code/type arrays equal the current promoted parse. Those are October observations, not fresh deployed identity. Historical constructor literals do not override Phase-11 environment-specific admin/sink intent. Provisioning pins the promoted artifact hash; its live schema checks do not independently certify full live executable code. Provisioning behavior remains B7. |

### Challenged tests, outcomes and limitations

The embedded `MockFA2` checks balances but omits owner/operator authorization; it cannot establish real FA2 permission behavior. Independently read the maintained standalone suite's conforming, rejecting and accepting-no-op FA2s and T01–T13 assertions: first/later invalid trades, heterogeneous/repeated transfers, revoked approval, aggregate shortage, stale pair edits, full/partial custody and rollback are represented. Its transfer fixtures and tez proxy are test contracts, not deployed dependencies. The accepting-no-op case explicitly permits committed escrow events without asset movement, so event schema or operation success cannot prove honest external FA2 effects. Gas/resource exhaustion, cross-role grouping and arbitrary callback implementations have no exhaustive native execution evidence here. Source reasoning covered these boundaries without substituting a JS/Python reimplementation for the contract.

Executed locally on the unchanged source revisions:

- `node audits/work/AUD-011-batch1-checks.mjs` — PASS, finalized in-memory/read-only identity/provenance and real configuration/preflight controls described above. Script retained in ignored work, SHA-256 `11603D1621BBA48F48EE1E6DDB3D3FCEEFFA7A96AE71009266C9BE317E49DC22`. The first sandboxed attempt failed at Node spawning Git (`EPERM`); the read-only rerun succeeded with sandbox elevation. No automatic approval rejection occurred.
- `node --test --experimental-test-isolation=none shared/chain-registry.test.mjs` — **4/4 PASS**.
- `node --test --experimental-test-isolation=none --test-name-pattern='^(FIND-P2-018|Each address|Multiple exact|Exact nat|Missing, malformed|A full mapping|Legacy active|Pagination validates)' shared/public-trade-pairs.test.mjs` — **8/8 selected PASS**, inert indexer only. Includes exact/zero/large IDs, every term, ambiguity/duplicates, malformed/error responses, continuation and cap controls. These exercise only B1's mapping identity dependency.
- `python 'docs/EA-XYZ Contract Audit/tests/verify-invariant-coverage.py'` — PASS, 26 invariant names / 181 mapped obligations / 13 named tests. This checks mapping integrity, **not execution or fulfillment of those obligations**. Only `verify_event_types` from the output verifier was executed against parsed current Michelson; no historical event logs were relabeled as a fresh run.

No legacy compilation, native SmartPy scenario/event execution, Octez typecheck, live FA2/wallet/RPC/TzKT/browser/hosting check, provider protocol validation, transaction or operational write occurred. E1's existing ABI evidence was reused without rerun; E2 was neither repeated nor generalized to Public. Native rollback/finality, honest external FA2 behavior, actual admin/sink custody and current deployed code/state remain **unverified integrations** at B1's explicit stop boundaries. No consequential in-scope source path is left unexamined; these external limits constrain the completed claim. Builds/broad suites/patch exports were deliberately skipped under this bounded task. Final `git status --short`, `git diff --stat` and `git diff --check` passed the intended-change review in both repositories; the untracked findings file also passed `git diff --no-index --check -- NUL audits/AUD-011-findings.md` (only a checkout line-ending advisory). Both HEADs/branches, both index SHA-256 values and both recovered reproduction SHA-256 values match their initial observations. Existing source, generated data and journals/locks are unchanged. Batches **2–7 remain outstanding** with the obligations in the plan below; AUD-011 remains **PARTIAL**.

## Recovered evidence

### Contract ABI compatibility

Evidence: audits/repro/AUD-011-contract-abi-check.mjs

The current Admin and Public operation payloads decoded against the audited escrow Michelson artifact in the local test.

Covered:
- Admin pair creation, update and cleanup
- Pause
- XTZ withdrawal
- Token transfer
- Public Drops and Exchange trade payloads

Local execution exited 0. This is ABI compatibility evidence, not live contract execution or deployed-contract identity verification.

### Validated finding — Admin intent can be rebound to another SDK account

**B4 evidence update:** independent Public handler/verification/SDK examination
also demonstrates A intent/journal versus B request; see
[E2 Public extension](#e2-extension--public-intent-and-retained-journal-can-also-disagree-with-sdk-source).
That section records Public's distinct sender-filtered reconciliation consequence
and controls. The recovered Admin evidence and all original limits below are
preserved; it was not rerun or generalized by assumption.

Bounded source validation: 2026-11-25. Disposition: **confirmed source-level correctness defect**, reachable through supported SDK account-transition paths under concurrent submission. This validates this observation only; AUD-011 remains PARTIAL. Transaction success, financial impact and live-wallet severity are unestablished.

Here A and B denote accounts. They may belong to the same wallet peer. “A-authorized” means Admin's captured intent and verified account observation still identify A; it does not establish that A or B is the contract administrator.

Evidence: `audits/repro/AUD-011-sdk-account-binding-repro.mjs` (preserved unchanged). Recovered execution evidence reports six discrepancies (pair creation, pair update, pair cleanup, pause, XTZ withdrawal and token transfer), twelve unchanged-account/event-first controls, and exit 0. That original execution was not repeated in this bounded review.

#### Authority and submission in Admin

- `admin-ui/src/beacon-setup.js:179–237`: a send intent captures a generation and an account key comprising address, account identifier and network type. `acceptAccount` rejects a changed observed account even without an event. The `ACTIVE_ACCOUNT_SET` subscriber (`498–532`) verifies the account network and advances the authority generation synchronously before its first return; a different account or null retires the previous intent. A same-key event preserves a current intent; an A→B→A sequence cannot revive a retired one. Disconnect invalidates before awaiting SDK clearing (`478–489`), and network/disconnect events also invalidate authority.
- `admin-ui/src/escrow-ops.js:33–65`: `ensureAccount` checks authority before and after wallet/permission awaits, validates the returned account's network, and accepts that account into the intent. It does not obtain an atomic lease on the SDK account. An already captured getter promise can still return A after the SDK has started replacing its account with B.
- `escrow-ops.js:71–104,111–143,260–269`: the final application checks precede `requestOperation`. The request carries operation details, without the accepted account or an account equality precondition. Pair helpers additionally guard target/network/indexer scope and, for set/update, await a final mapping-compatibility read. Those checks consult application authority, not the SDK's current account. Pause/Treasury recheck authority inside their recovery lock immediately before reserving and sending.
- Supported callers retain these guards: pair create/edit/cleanup in `features/pairs/pairs.controller.js:506–515,614–686,704–729`, Exchange wrappers/submission in `features/pairs/exchange-pairs.js:304–310,552–594`, Drops batches in `features/drops/drops.send.service.js:266–311`, pause in `features/pause.js:619–655`, withdrawal in `features/treasury/withdraw.controller.js:383–425`, and transfer in `features/treasury/transfer.controller.js:371–454`. The latter three controllers perform an initial account check, then their write helper checks again. The transition can overlap the helper's final read; the earlier check does not bind the later SDK request. Pair helpers capture authority themselves when the caller supplies none.

#### Installed Beacon execution and supported transition entry points

SDK references below are to `node_modules/@airgap/beacon-dapp/dist/cjs/dapp-client/DAppClient.js` in the local installation. Both manifests pin `@airgap/beacon-sdk` 4.8.1; its dependency is `beacon-dapp` 4.8.1 (several other Beacon packages are 4.8.0). Module resolution selects separate Outer and Admin installations; SHA-256 comparisons found identical DAppClient CJS/ESM, event-handler, LocalStorage, Client transport and crypto source files across those installations. The reproduction uses the CommonJS export. The corresponding installed ESM paths used by bundlers were also inspected: `getActiveAccount:623–625`/`setActiveAccount:699–741`, `requestOperation:1364–1384`, and `makeRequest:1687–1733` have the same relevant ordering. This is local source evidence, not verification of a deployed bundle.

1. `getActiveAccount:632–635` returns the current exposed promise; replacing `_activeAccount` does not change a previously returned promise. `setActiveAccount:717–759` publishes B to `_activeAccount` **before** awaiting transport initialization, transport selection, peer lookup/selection, storage persistence and finally `ACTIVE_ACCOUNT_SET`. Even an initialized transport takes the awaited seed/keypair path in `initInternalTransports:365–375`.
2. Account replacement is supported behavior, not an application call invented by the test. The SDK handles an unsolicited `ChangeAccountRequest` through `handleResponse:214–220` → `onNewAccount:2039–2069`. That method validates the address, constructs account identity/origin/network/scopes, stores the account and invokes `setActiveAccount`. Permission responses also use `onNewAccount` (`1176–1184`). The constructor's storage subscription (`77–94`) resolves another tab's active-account identifier and invokes the same setter. Admin does not directly call `setActiveAccount(B)`.
3. Admin's subscription legitimately sets `isGetActiveAccountHandled = true` (`subscribeToEvent:955–961`). The fixture's flag therefore matches this application. `isInvalidState:637–643` is not an account-transition lock in this subscribed state. `setTransport:1531–1546` and `setActivePeer:1507–1525` also provide no serialization with an operation request.
4. `requestOperation:1414–1435` independently reads the SDK account and derives `network` and `sourceAddress` from it, copying only `input.operationDetails`. If that read observes B, the payload asks for B, although Admin accepted A. `makeRequest:1767–1810` awaits initialization/rate limiting, checks the currently active account's operation scope (`checkPermissions:969–995`), serializes the request, then reads the account again to choose a peer (`getPeer:1743–1764`, sender-ID match with origin-ID fallback). It does not compare these reads with Admin's A or cancel when Admin's authority later becomes stale. An additional transition between SDK reads could separate payload source from peer selection; that alternative is source-supported but was not reproduced here.
5. The tested resident extension/leader path uses `makeRequest`, a supported outcome of `checkMakeRequest:878–885`. WalletConnect follower dispatch via `makeRequestBC`/`prepareRequest` is a separate branch, not exercised or certified by this result.

A supported ordering is therefore: capture A intent → Admin getter captures A → concurrent account-change processing publishes B → Admin accepts its captured A and passes final checks before notification → SDK `requestOperation` captures B → account event retires A → SDK still dispatches the B request. No supported application invariant serializes these independent async chains. If notification reaches Admin before its final guard, submission is rejected instead.

#### What the controlled boundaries do and do not establish

The recovered script executes the actual Admin authority module, write helpers, recovery writers, and installed SDK getter/setter/request/permission/serialization/peer-selection methods. It constructs no DAppClient and replaces SDK lifecycle, storage, transport and response boundaries with inert objects. Its getter wrapper captures the genuine A promise and then starts the setter; it does not falsify the getter's returned account.

The seed-storage gate deliberately holds the setter before application notification until after dispatch/receipt. This demonstrates the internal ordering gap, but **dispatch before notification for that entire interval is a controlled test schedule**, not a measured property of Admin's default storage. Beacon's default `LocalStorage.get/set` (`@airgap/beacon-core/dist/cjs/storage/LocalStorage.js:29–63`) performs synchronous browser storage access within promise-returning methods. The gate must not be described as an ordinary long-running localStorage read. The fixture also uses synthetic account addresses, two pre-existing extension peers, an initialized client, operation permission on both accounts, no rate limit and a fabricated successful response. The script does not execute inbound account validation, real peer delivery, wallet approval or signing. No evidenced test defect required altering it; these are limitations on its claims.

Necessary supplemental checks were run as in-memory variants via `node --input-type=module`, without saving scripts or creating operational state:

- Removing the storage gate from the six-path recovered scenario still emitted B's source and selected B's synthetic peer for all six paths (exit 0). Authority was stale by completion. This isolates the artificial delay; it retains the original getter-triggered setter and other fixture assumptions.
- Starting the genuine `onNewAccount` independently **before** the cleanup action, with valid-format A/B addresses and no setter injection in the getter, exercised thirteen microtask offsets with ungated storage. Offsets 0–4 emitted B; offsets 5–12 rejected obsolete authority without sending. In successful cases notification preceded transport dispatch. These are controlled schedules, not browser timing/frequency measurements.
- A stronger cleanup/pause check used the genuine `onNewAccount`, `setTransport`, `setActivePeer` and Beacon `LocalStorage` adapter over an in-memory browser-storage shim, with no storage gate and an unchanged getter. Four positive cases asserted B's source for same-peer and distinct-prepaired-peer transitions; pause also asserted its durable reservation still named A. Two event-first controls asserted stale-authority rejection and zero sends. All six cases passed their assertions (exit 0); each positive timeline was account notification → inert transport send. Account-manager persistence, event delivery, wallet-info/analytics, request response and actual transport delivery remained inert.

Thus the general A-intent/B-request discrepancy does not depend on withholding the notification until dispatch. Notification can arrive after the request crosses Admin's final guard and still fail to prevent dispatch. A different peer is conditional on the account's peer mapping; a normal same-wallet account change can retain the same peer while changing the requested source to B.

#### Durable attribution, consequences and negative paths

`admin-ui/src/features/pause-recovery.js:48–60` reserves A's address; `features/treasury/recovery.js:53–69` reserves A's address/account identifier/network and the operation details. Reservations precede the SDK call and retain that account when a receipt hash is saved, including late receipts after UI invalidation. The recovered six-path evidence observed A attribution for pause, withdrawal and transfer; the stronger supplemental pause assertion independently confirmed it. In a B-dispatched request these records describe the initiating observation, not verified signer identity.

Recovery exclusion remains keyed by network/escrow across accounts (`pause-recovery.js:6–8`, `treasury/recovery.js:6–8`). Locks, durable-write verification and uncertain-result blocking still operate; account changes do not remove the reservation. A rejected/no-hash wallet outcome can consequently remain blocked for supported recovery. Treasury's message explicitly calls the unresolved request “from” the recorded A (`features/treasury/recovery-status.js:14–17`). Hash reconciliation (`features/treasury/recovery-ui.js:54–61`, `features/pause.js:432–454`) and `escrow-ops.js:423–449` validate operation grouping/hash/destination/entrypoint/status, without comparing chain sender against the recorded account. A later applied result therefore does not independently certify A as signer. No live reconciliation or false-success outcome was demonstrated.

The correctness consequences are a request for an account different from the initiating Admin intent, possible selection of another already paired wallet, and inconsistent durable attribution. Successful execution still depends on wallet acceptance/signing and the destination contract's authorization rules. This is not evidence of bypassing either boundary, forging A's signature, an attacker acquiring authority, a deployed unauthorized transaction or financial loss.

Safeguards/alternative outcomes retained in source:
- Unchanged accounts and same-key notifications keep valid intents usable. Changed-account reads, event-first replacement, A→B→A, null/disconnect and network changes retire obsolete intents when observed before the guard; stale reads cannot revive them. The recovered unchanged/event-first controls and supplemental event-first checks support these distinct outcomes, not every possible lifecycle permutation.
- An initial unconnected intent may adopt a permission-granted account while `beginPermissions` is active. An intent already bound to A cannot adopt a different account through `acceptAccount`. Wrong-network accounts seen by Admin fail verification and trigger cleanup (`beacon-setup.js:383–447`). The reproduced transition keeps both accounts on Shadownet; later cross-network switching was not tested.
- SDK no-active-account, missing operation scope, rate-limit and initialization failures can stop a request. The fixture assumes these checks allow B; it does not show permission bypass or successful delivery to an unavailable peer.
- Controller busy/target/context guards, final pair mapping checks, stale-publication fences and durable recovery prevent other stale work or repeat requests. They do not carry A into the SDK request or revoke an SDK request already entered. Post-submission invalidation can suppress UI publication while recovery retains a late hash.

Unresolved for this finding: real extension/wallet account-change timing and prompts, actual same-peer/distinct-peer delivery and rejection behavior, browser scheduling and Web Locks timing, WalletConnect/P2P/follower/reconnect paths, transitions between later SDK reads, deployed dependency identity, actual signer/chain outcomes and resulting severity. No live connection, real wallet operation, transaction or remote action was performed. No production fix or remediation-checklist change is included.

## Investigation status

Historical recovered checkpoint; the Batch 7 ledger above supersedes its
examination progress. B1–B7 are now bounded source COMPLETE; finalization and
the explicitly deferred execution/integration evidence remain outstanding.

The full examination was interrupted before complete coverage documentation and historical reconciliation were produced. The bounded SDK account-binding source validation and subsequent Batch 1 examination are now incorporated; neither completes the wider audit.

Outstanding:
- Complete Batches 2–7 of the remaining independent functional correctness examination.
- Maintain the provisional historical 33-workflow/20-group crosswalk as examination progresses; the inventory below already records its initial reconciliation.
- Resolve the SDK finding's explicitly listed live-wallet and alternative-path unknowns; its bounded source-supported reachability is established above.
- Finalize findings and the compact remediation checklist.
- Perform the independent coverage refresh only if the completed examination is provisionally clean.

Do not classify AUD-011 as COMPLETE or CLEAN based on this checkpoint.

## Preservation

Both repositories remain on ticket-AUD-011-full-correctness-review.

No production remediation has been authorized under this investigation ticket.

The recovered reproduction scripts must remain unchanged until their evidence is incorporated into the completed audit.

## Remaining coverage inventory — 2026-11-25

This is a **provisional coverage-planning checkpoint**, not a completed examination, finding finalization or clean-result claim. The recovered evidence and bounded SDK validation above remain authoritative for what AUD-011 actually established. No reproduction, ABI check, build, broad test, wallet action or operational write was repeated for this inventory. The remediation checklist is unchanged.

Source identity: Outer `2453358c8cf91d4db3bc24e447ed0859f91216e8`; Admin `d8636e957d3974ba73882d9d29242898f10ed3e0`; both on `ticket-AUD-011-full-correctness-review`. Initial Outer changes were only the three untracked recovered files named above; Admin was clean. This checkpoint changes audit documentation only. Configuration assumptions are the checked-out registry and drop source, Public's default `testnet` slot (Shadownet, with explicit build-time `NETWORK` override), Admin's persisted network selection and separate Drops/Exchange targets, and the manifests' pinned Beacon SDK 4.8.1. These are source assumptions, not deployed identity or Mainnet readiness evidence.

### Evidence ledger and status rules

- **COMPLETE, bounded evidence E1:** the recovered ABI compatibility check, with the payload scope and local exit-0 result recorded above. It establishes decoding against the identified local artifact only. It does not establish contract semantics, client lifecycle correctness, direct-chain behavior or deployed identity.
- **COMPLETE, bounded validation E2:** the separately completed source-level validation of the Admin intent/SDK account-binding observation above, including its recovered controls and supplemental checks. Its stated SDK branches, controlled boundaries and live unknowns remain in force. Do not repeat that investigation merely to complete a batch below.
- **PARTIAL workflow:** E1 or E2 examined a consequential seam of that workflow; the rest is unfinished. PARTIAL never means that all non-finding behavior passed. Where E2 only traced a caller or recovery consumer, that limited trace is the credit.
- **NOT EXAMINED workflow:** no AUD-011 correctness examination evidence is recorded for that behavior. Locating a function, following imports, reading registrations, finding existing tests or historical audit results earns no examination credit.
- No complete end-to-end workflow is evidenced. The preserved checkpoint contains one validated source defect, not additional substantiated hypotheses. Unexamined paths below are coverage gaps, not suspected defects. Any unrecorded work lost during interruption cannot be credited.

### Independent source inventory — frozen before historical comparison

The following table and initial crosswalks preserve the planning checkpoint's status snapshot. The Batch 1 ledger above supersedes NOT EXAMINED for W02/W33–W35/W40 only; all other examination obligations remain as recorded.

The candidate rows W01–W39 below were formed from current source before opening the historical coverage maps. Their numbering is local to this table, not a new audit framework. Forward discovery used public entries and DOM actions, Admin bootstrap/controller registrations, startup/polling/retry handlers, CLI/package entries and contract entrypoints. Reverse discovery started at the two public `requestOperation` sites, Admin `escrow-ops.js` send helpers, SmartPy transfer/send and mapping mutations, configuration file replacement, and actionable balance/readiness/success publishers. Boundary discovery followed wallet/account/network identity, DOM/CMS and token translations, shared source/JSON/Admin mirror, indexer/time inputs, recovery storage/locks, and router/bundle/build provenance.

Paths below are Outer-relative; `admin-ui/` explicitly denotes the independent Admin repository. Function names identify source entrypoints without implying a complete trace. Each row includes its consequential contract and dependency boundary. Shared dependencies must be examined in the consuming behavior as well as at their own boundary.

| Scope | Workflow / source entrypoints and consequential boundaries | AUD-011 examination status / remaining work |
| --- | --- | --- |
| W01 | Public wallet startup, persisted account, connect/disconnect and balance publication: `shared/beacon-setup.js` (`getVerifiedPublicActiveAccount`, `requestPublicWalletConnection`, account events, DOM controls) → `shared/tzkt-fa2-balances.js` → Drops/Exchange wallet-state consumers; also loaded by Home/Utility. Account/network authority and unknown versus zero must survive SDK/indexer failure and stale results. | **NOT EXAMINED**. E2 concerns Admin; do not transfer its result or control coverage to Public. |
| W02 | Shared network/contract/token identity selection: `shared/chain-registry.js`, `shared/network.js`, `drops/js/events-config.js`, `exchange/js/exchange-config.js` → public send/read targets and Admin `src/network.js`, `src/utils/live-cfg.js`. Distinct surface escrows, pair ranges and mainnet↔testnet token mirrors must retain identity. | **NOT EXAMINED** as a configuration contract. E2 used one same-network context only. |
| W03 | Public page delivery: `loaders/root/{home,drops,exchange,collection-utility}.js` → corresponding `loaders/environment/` files → `webflow/` entries → page modules. Host routing, parallel first-paint/runtime loading, failures and repeat boot determine availability and bundle identity. Depends on W39 and external Webflow embeds. | **NOT EXAMINED**; checked-out loaders do not establish live embedding. |
| W04 | Home/Utility navigation and public reveal: `webflow/home.js`, `collection-utility/js/main.js`, `shared/public-first-paint.js`; local `index.html` and `collection-utility/index.html` navigation, inline scripts and image/font load/failure paths. Navigation and reveal must leave supported actions reachable with truthful network/wallet chrome. | **NOT EXAMINED**. Utility is informational/navigation/image behavior plus shared wallet; no implemented Ethereum/WAVE redemption was discovered. |
| W05 | Drops schedule/configuration admission and CMS identity projection: `drops/js/events.js` (`initializeDropParameterRegion`, `getTokenData`, `setEventContractAndTokenAttributes`, exclusions/default token rendering), `token-rendering.js`, `shared/public-drop-compatibility.js` → authoritative params, registry and Webflow rows. Rendered token/contract IDs and exclusions must match actionable intent. | **NOT EXAMINED**. Cross-repo producers are W30–W32, not proof that the Public consumer is correct. |
| W06 | Drops holdings, eligibility, exclusive selection and burn/redeem cart: `events.js` (`refreshDropsWallet`, `updateTokensWithWalletData`, `setupExclusiveCheckboxesWallet`, `updateEventCartBurnToken`, `updateEventCartRedeemToken`, action-state rendering), `reveal-coordinator.js` → W01/W05/W08/W09. Exact quantities and current-account snapshots must determine selection and enabled actions. | **NOT EXAMINED**. ABI decoding does not examine balance/cart behavior. |
| W07 | Public Drops scheduled/countdown/standby/LIVE lifecycle: `events.js` (`startCountdown`, `pollForUnpause`, `computeExchangeButtonState`, pagehide/pageshow/visibility handling) → `shared/drop-time.js`, `shared/drop-countdown.js`, time provider and escrow storage. Time expiration alone must not claim contract availability; polling/cancellation/re-entry remain in scope. | **NOT EXAMINED**. Shared Admin countdown consumers are W27. |
| W08 | Drops redeem metadata/image and live inventory: `events.js` (`resolveRedeemMetadata`, `resolveRedeemImage`, `fetchRedeemSupply`, supply polling and initial reveal commits) → CMS, TzKT, configured FA2/escrow and W06/W09. Unknown/stale supply must not become a confident tradable amount. | **NOT EXAMINED**. |
| W09 | Public Drops approval/trade construction and submission: `events.js:1097` `handleEventExchange` → pair/approval helpers in `shared/public-trade-ops.js` → `requestOperation` → escrow `initiate_trade` and external FA2. Selected user, IDs, amounts, pair terms and approvals must retain meaning through send. | **PARTIAL — E1 Drops payload decoding only**. Full client path, authority changes, exact payload semantics, rejection and chain effects remain. |
| W10 | Exchange CMS token/economic identity, wallet quantities and cart: `exchange/js/exchange.js` (`setContractAndTokenAttributes`, `processWalletNFTs`, `populateDropdown`, `updateBurnCart`, `updateTotal`, clear/remove/tab handlers) → registry/config, W01 and W11. Collection/token identity and exact burn/redemption totals must survive DOM and holdings changes. | **NOT EXAMINED**. |
| W11 | Public Exchange approvals/trade submission: `exchange.js:1242` `handleExchange` → shared pair/approval helpers → `requestOperation` → escrow/FA2; current account, cart and pair terms must authorize the final serialized operation. | **PARTIAL — E1 Exchange payload decoding only**. Remaining client and execution semantics are unexamined; no Public account-binding finding is inferred from E2. |
| W12 | Public submitted-trade durability, confirmation, retry/resume and refreshed balances: `shared/public-trade-ops.js` (`createSubmittedTradeStore`, rejection classification, `pollForConfirmation`, `pollForNFTUpdate`, refresh predicates) ← both pages' restore/retry handlers and send paths. Storage/Web Locks, operation grouping/status/destination and post-trade snapshots must support truthful outcomes across reload/account changes. | **NOT EXAMINED**. E1 mock/local payload evidence establishes neither confirmation nor applied-state recovery. |
| W13 | Admin wallet lifecycle and send authority: `admin-ui/src/beacon-setup.js`, `src/utils/wallet.js`, `escrow-ops.js:33` `ensureAccount` → installed Beacon SDK. Startup/permissions/disconnect/account and network transitions must preserve the initiating authority at effect. | **PARTIAL — E2** establishes the recorded source defect and bounded controls. Other lifecycle/SDK branches and live behavior remain explicitly unverified. |
| W14 | Admin network and surface changes: `src/admin.js` network selector/surface switcher → `src/network.js` (`getNetwork`, `setNetwork`), `utils/live-cfg.js`, modal closure and per-surface feature instances. Persist/clear/reload and context invalidation must retain target identity across awaits. | **NOT EXAMINED** end to end; E2's authority-invalidation references are not a network-switch examination. Cross-repo W02. |
| W15 | Admin ownership indicator and Exchange read-only status: `src/features/admin-indicator.js`, `exchange-status.js` → wallet observation, escrow storage, target resolution and polling. Admin/pause/configured/error signals must describe the current surface, account and network. | **NOT EXAMINED**. `exchange-custody.js` is an unregistered no-op, not a separate custody workflow. |
| W16 | Admin pause/unpause, both surface instances: `src/admin.js` → `features/pause.js` (`createPauseController`, toggle/refresh handlers) → `escrow-ops.js:170` → `pause-recovery.js`, operation polling and escrow storage/events. Authorized target and post-operation pause state must remain truthful; toggles are not idempotent. | **PARTIAL — E1 pause payload; E2 send/attribution seam**. Complete controller, pause/event, failure and repeat/recovery behavior remains. |
| W17 | Admin treasury balance loading, row selection and refresh: `features/treasury/orchestrate.js`, `fetchers.js`, `withdraw.controller.js` balance/MAX handlers, `transfer.controller.js` refresh, `table.render.js`, lifecycle/context → TzKT/RPC, token metadata and per-surface targets. Unknown/stale balances and exact spendable quantities must remain distinct. | **NOT EXAMINED**. Both Drops and Exchange instances require attention. |
| W18 | Admin XTZ withdrawal, both surfaces: `features/treasury/withdraw.controller.js` form submit → conversion/validation → `escrow-ops.js:175` `adminWithdrawXtz` → recovery, SDK and contract admin payout. Exact mutez, destination/admin, scope and final outcome are consequential. Exported `withdrawXtzFromEscrow` is an alternate helper with no current in-source UI caller found. | **PARTIAL — E1 withdrawal payload; E2 authority/reservation seam**. Numeric, controller, target, contract and outcome behavior remains. |
| W19 | Admin token custody transfer, both surfaces: `features/treasury/transfer.controller.js` → `escrow-ops.js:223` `adminBatchTransferTokens` → recovery, SDK, escrow `admin_transfer_token`, FA2. Also inventory exported single-token helpers `adminTransferToken`/`transferTokenFromEscrow`; no current controller caller found. Recipients, IDs, batch totals and atomic effects require examination. | **PARTIAL — E1 transfer payload; E2 authority/reservation seam**. The exported alternatives and entire transfer lifecycle are not certified. |
| W20 | Admin durable pause/treasury reservation, ambiguous receipt and reconciliation: `features/pause-recovery.js`, `pause.js` recovery handler; `features/treasury/{recovery,recovery-ui,recovery-status,status}.js` → localStorage/Web Locks, `escrow-ops.js` `waitForOperationResult` and storage/readback. Cross-account exclusion, late hashes, sender attribution, malformed state and failed/unknown results must preserve safe recovery. | **PARTIAL — E2 attribution, lock scope and reconciliation references only**. Complete recovery state machines and cross-tab/reload/error paths remain. |
| W21 | Admin pair read/refresh, token catalogue, auto-ID and create/edit preparation: `features/pairs/{pairs.data,setpanel.controller,setpanel.validators}.js`, modal controllers/validators, `exchange-pairs.js` read/auto-ID wrappers → `tzkt-api.js`, adapters, title/thumb manifests and pair ranges. Complete pagination, active IDs and asynchronous preview identity determine safe actions. | **NOT EXAMINED**. Common data/metadata dependencies also feed W17/W25/W28/W29. |
| W22 | Admin manual pair creation, Drops and Exchange: `pairs.controller.js:608` submit listener and `exchange-pairs.js` set-submit/exported `setExchangeTokenPair` → `escrow-ops.js:349` `setTokenPairs` and `pair-compatibility.js`. Exact input, target, unused ID and mapping compatibility must hold at send and readback. | **PARTIAL — E1 set payload; E2 guarded submission paths**. Complete validation, collision, direct-helper and result paths remain. |
| W23 | Admin pair editing, Drops and Exchange: `pairs.controller.js` modal `onSave`, `exchange-pairs.js` edit callback/`updateExchangeTokenPair` → modal state/epochs → `escrow-ops.js:280` `updateTokenPair`. Preserve pair identity, mapping uniqueness and changed-field intent through modal/target changes and confirmation. | **PARTIAL — E1 update payload; E2 authority seam**. Full modal/validation/update/readback path remains. |
| W24 | Admin selected-pair cleanup: `pairs.controller.js` cleanup button/`onCleanupSelected` → `escrow-ops.js:322` `cleanupTokenPairs` → contract mapping deletion and UI refresh. Selection, authority, pair lookup consistency and operation outcome require examination. No Exchange cleanup registration was discovered. | **PARTIAL — E1 cleanup payload; E2 source/supplemental cleanup validation**. Full deletion and publication semantics remain. |
| W25 | Admin Drops initial/automatic/manual load and batch planning: `features/drops/drops.controller.js` input and `drops:ui:*` handlers → `drops.load.service.js`, `drops.data.js` normalize, `drops.builder.js`, translation audit, input/view signatures and preview. Canonical params, exclusions, mirror translations, pair start ID and chunk boundaries must agree. | **NOT EXAMINED**. Cross-repo inputs W02/W30–W32. |
| W26 | Admin Drops batch pair submission and partial progress: `drops.controller.js` send event → `drops.send.service.js:22` `handleSend` → final plan revalidation, chunked `setTokenPairs`, confirmation/status refresh. Every batch must retain target/authority/IDs and report partial outcomes without replay or stale publication. | **PARTIAL — E2 caller/authority trace; E1 set-pair payload prerequisite**. Multi-batch correctness, interruption, cancellation and recovery are not evidenced. |
| W27 | Admin Drops actionable readiness, pair status, checklist/countdown and LIVE: `drops.status.service.js`, `drops.pairs.status.js` `evaluateDropStatus`, `drops.checklist.controller.js` health/pause/transfer/pair events and manual checks, `drops.countdown.service.js`, `drops.public-state.js` → chain storage, balances, token existence, time provider and W16/W20/W26/W28/W29. Unknown, stale and mismatched evidence must not become readiness; saving a schedule does not unpause. | **NOT EXAMINED**. All auto/manual/background event entries remain. |
| W28 | Admin chain/local-catalogue health: `features/health/health.controller.js` initial/manual checks and network changes → `tzkt-api.js`, `adapters/collection-catalog.js`, manifests, token UI/economics → `health:check:result` and Drops checklist. Partial provider/catalogue data must not become confident health. | **NOT EXAMINED**. |
| W29 | Admin CMS CSV import, persistence/recheck and health publication: `features/health/health.cms.js` choose/load/recheck/clear paths → `utils/{parse-csv,cms-store,hen-ids,token-econ}.js`, mirrors, titles/thumbs → `health:cms:result` and checklist. CSV token identities, duplicates, economics and network-scoped cached evidence must remain sound. | **NOT EXAMINED**. Local CSV validation is distinct from live Webflow CMS identity. |
| W30 | Local Admin drop authoring: `admin.js` development-only dynamic import → `features/drops/authoring/{index,authoring.controller,authoring.client,authoring.form,authoring.state,authoring.preview,drop-params.provider.dev}.js`; create/edit/deactivate, validate/preview/apply/health polling → Outer HTTP service and committed snapshot → Drops reinitialization. Preview identity and invalidation must bind the committed result. | **NOT EXAMINED**. Production immutable provider is separately part of W32; production isolation belongs to W39. |
| W31 | Authoritative config write/archive/recovery: `scripts/drop-params-transaction.mjs` create/edit/deactivate/status/reconcile and `scripts/drop-params-authoring-service.mjs` → `shared/drop-params/{drop-params-authoring-service,drop-params-authoring,drop-params-transaction,drop-params-archive,drop-params-recovery,drop-params-projector}.mjs`. Direct CLI/API paths, preview tokens/origin/nonce, CAS/versioning, repository locks, journaling, rollback and uncertain-state blocking must preserve source and projections. | **NOT EXAMINED**. W30 and CLI are distinct entries into the same writer; unresolved journals/locks must not be removed for review. |
| W32 | Source→JSON→Admin mirror/provider projection: `shared/drop-params/{index.js,drop-params.js,gen-drop-params-json.mjs,watch-drop-params-json.mjs,drop-params-projector.mjs}` → Admin sync/watch/build guard and `features/drops/drop-params.provider.js` → W05/W25. Concurrent edits/watch epochs, regeneration equality and immutable production snapshots must preserve one authoring authority. | **NOT EXAMINED**. Includes supported direct source edits/regeneration as well as W31 writes. |
| W33 | Direct-chain burn/redeem: `contracts/burn-redeem-escrow/smartpy/burn-redeem-escrow-smartpy.py:368` `initiate_trade` → sender checks, token mapping, burn/redeem amounts, external FA2 transfers and events. Calls bypassing UI must retain financial identities, storage invariants, external-call failure atomicity and mixed-batch semantics. | **NOT EXAMINED** for contract behavior. E1 decodes client payloads against a local Michelson artifact; it supplies no semantic/legacy compilation/deployment credit here. |
| W34 | Direct-chain privileged state/custody operations: same SmartPy source `toggle_pause`, `set_token_pairs`, `update_token_pair`, `cleanup_token_pairs`, `admin_withdraw_xtz`, `admin_transfer_token`; initialized admin/burn destination and mapping bookkeeping → transfer/send/events. Direct callers bypass Admin validation; admin authority, uniqueness/deletion, exact payout and recovery effects need independent examination. | **NOT EXAMINED** for contract behavior. E1/E2 do not verify direct-entrypoint invariants or FA2 execution. |
| W35 | Escrow funding and unsolicited asset boundaries: SmartPy `default:681`, FA2 ledger transfers into escrow, treasury/readiness inventory consumers. Positive XTZ acceptance/event, token identity and available custody balance must be distinguished from authorized withdrawals/redemptions. The embedded mock FA2 and scenarios are test support, not another shipped asset contract. | **NOT EXAMINED**. External FA2 behavior and deployed contract identity remain external dependencies. |
| W36 | Thumbnail intake/backfill and Admin metadata publication: `assets/thumbs/scripts/thumbs.mjs` `input`/`backfill` → Admin `src/thumbs/`, `scripts/gen-thumbs-manifest.mjs`, `thumbs-manifest-lock.mjs` → token catalogue/views/build checks. Token-key assignment, exclusive file/archive handling, rollback and manifest freshness affect operator token identity. | **NOT EXAMINED**. Image optimization utilities are supporting W04/W36 asset inputs, not financial workflows. |
| W37 | Webflow CMS mutation/reconciliation **boundary candidate**, not an evidenced registered application workflow: `assets/webflow-cms/webflow-cms.mjs` exports API client, upload/image verification, staged/live comparisons and ambiguous mutation reconciliation. Remote asset/CMS identity and retry outcomes could feed public token rows. | **NOT EXAMINED**. No non-test application/CLI caller was found in searched current source. Keep as an unresolved support-library boundary; do not invent an executable publishing flow or perform remote writes. |
| W38 | Signer-backed Shadownet Exchange pair operations: `scripts/shadownet-exchange-pairs.mjs` `run` dry-run/`--verify`/`--execute` → local provider import, ABI payload, RPC script/storage identity, signer/admin guard, `set_token_pairs`, shared confirmation and readback. This entry bypasses Admin UI/Beacon and must retain explicit target/pair assignments and safe retry semantics. | **NOT EXAMINED**. E1's separately recorded Admin/Public ABI check does not cover this CLI. No mode executed here. |
| W39 | Build/dev/release and artifact provenance: Outer/Admin `package.json`, `.github/workflows/pages.yml`, `scripts/verify-pages-loader-artifacts.mjs`, first-paint verifiers, dev/harness/source-map scripts; Admin mirror/thumb guards and production authoring prune/isolation scripts. Main/staging source ownership, router/bundle graph, source-map removal, generated-copy freshness and development-only isolation must survive packaging/deployment. | **NOT EXAMINED**. Read-only discovery of deploy code grants no authorization to deploy; no Admin CI deployment definition was found in the inspected tree. |

Frozen total: **39 scopes: 38 workflow scopes plus one unresolved support-library boundary (W37); 0 COMPLETE workflows, 11 PARTIAL, 28 NOT EXAMINED scopes**. E1 and E2 are the two completed bounded evidence items, not extra completed workflows. W34 intentionally groups direct privileged entrypoints while their distinct client workflows remain split above; it must be subdivided during its bounded examinations. No particular row count is an exhaustiveness claim.

The reverse pass accounts for each discovered effect family: Public approvals and trades (W09/W11), Admin pause/withdraw/transfer/pair sends including exported alternatives (W16/W18/W19/W22–W26), signer CLI (W38), direct-chain sends/mutations/funding (W33–W35), file/configuration/archive/manifest mutation (W30–W32/W36), possible remote CMS writes (W37), and release publication (W39). Consequential read decisions are explicit in W01/W05–W08/W10/W12/W15/W17/W21/W27–W29. Discovery explains where further examination must go; it does not certify that every branch or external consumer was found.

### Historical reconciliation — performed after the freeze

Compared with the original 33-row map under **Historical AUD-001 enumeration and context / Behavioral map** in [coverage](coverage.md#historical-aud-001-enumeration-and-context), and the later 20-group map under **AUD-006 / Completed behavioral examination** in [coverage](coverage.md#aud-006--completed-source-examination-2026-11-23). Later AUD-009/AUD-010 crosswalks were navigation checks, not examination evidence. Historical group labels below are prefixed **H** (H01 means historical W01); current W01–W40 always refer to this checkpoint.

Reconciliation exposed these inventory omissions or under-specified boundaries. Targeted source checks established their location, not their correctness:

1. **Missing independent scope: artifact provenance (original #29 / H20).** The frozen table identified ABI and provisioning artifacts but did not inventory the source→compilation fixture→certified/frozen→promoted→originated identity chain. Add **W40, NOT EXAMINED**: canonical SmartPy and `docs/EA-XYZ Contract Audit/source/` snapshots/stripped fixture; standalone `tests/burn-redeem-correctness-suite.py`, `tests/invariant-coverage.json` and verifier scripts; `provenance/`; release manifest and Phase-7/8/10/11 records; promoted `contracts/burn-redeem-escrow/artifacts/burn-redeem-escrow-audited.tz` and its `deployment-notes/audited-release.md`. Current consumer `scripts/shadownet-exchange-pairs.mjs` pins an artifact/ABI identity; E1 uses the local artifact. Determine which identities each claim/consumer requires without adopting certification as fresh execution. No byte/ABI/provenance suite was rerun here. This is a consequential dependency, not a new deployed workflow.
2. **W27 lacked an explicit external readiness producer.** `admin-ui/src/features/drops/drops.checklist.controller.js:687–692` fetches raw GitHub branch params; manual refresh, throttled/in-flight polls and checklist epochs consume the result. Retain staging/main comparison, unknown/error/cache/visibility and source-versus-publication meaning inside W27. Git equality is not proof of deployed equality. **NOT EXAMINED**.
3. **W25/W21 need explicit alternate-export/cache boundaries.** `drops.data.js` exports file/URL loading and JSON/JS parsing (including evaluation), distinct from active `normalize`. No current runtime caller of those loading/parsing exports was found by targeted symbol search. Preserve as dormant exported boundary under W25, with caller reachability unresolved beyond inspected source; do not label it an active upload UI. W21/W28/W29 include `utils/{nft,cache,hen-ids,token-econ}.js`, local title/thumb manifests and catalogue enrichment, not merely pair tables. Forced economics refresh, complete holder enumeration, unknown versus zero and persistent network-scoped CMS state remain **NOT EXAMINED**.
4. **W39 lacked explicit review-export effects and asset launchers.** Include `admin-ui/scripts/export-ticket-diff.ps1` (used by both package commands): invoking-repo selection, private index/object storage, output lock, exact export paths and cleanup; include `assets/thumbs/RUN_INPUT.cmd` / `RUN_BACKFILL.cmd` in W36 and local optimization/dev/harness helpers in their existing scopes. None ran. These are tooling effects, not new transaction authority. **NOT EXAMINED**.

The reconciled inventory is therefore **40 scopes: 38 workflow scopes plus W37's support-library boundary and W40's provenance dependency; 0 COMPLETE, 11 PARTIAL, 29 NOT EXAMINED**. The original 39-row freeze is intentionally retained above so the discovered omission stays visible. No historical row was dropped because it lacked a current UI caller; unsupported/planned behavior is distinguished from exported capabilities instead.

| Original workflow # / obligation | Current inventory retaining the obligation | AUD-011 gap |
| --- | --- | --- |
| 1 Arrival/navigation/Utility | W03/W04 | All examination outstanding. |
| 2 Network/escrow/token identity | W02/W14 | All examination outstanding. |
| 3 Public wallet/holdings | W01/W06/W10/W12 | All examination outstanding. |
| 4 Drops config/catalog/selection | W05/W06/W08 | All examination outstanding. |
| 5 Time/pause/inventory | W07/W08 | All examination outstanding. |
| 6 Drops trade/refresh | W09/W12/W33 | E1 decoding only; remaining workflow outstanding. |
| 7 Exchange cart/economics | W10 | All examination outstanding. |
| 8 Exchange multi-token send | W11/W12/W33 | E1 decoding only; remaining workflow outstanding. |
| 9 Approval/pair/outcome evidence | W09/W11/W12, producer comparison W22/W23/W26/W27 | E1 does not examine unique terms, approval state or outcomes. |
| 10 Admin boot/wallet/network | W13/W14/W30/W32 | E2 authority seam only; other entries unfinished. |
| 11 Admin indication/pause | W15/W16/W20 | E1/E2 pause seam only; status/recovery unfinished. |
| 12 Treasury inventory/rescue | W17/W19/W20/W34/W35 | E1/E2 send/attribution only; custody semantics unfinished. |
| 13 XTZ/MAX/withdrawal | W17/W18/W20/W34 | E1/E2 send/attribution only; amounts/MAX/outcomes unfinished. |
| 14 Drops pair create/edit/cleanup | W21–W24/W34 | E1/E2 submission seams only; rest unfinished. |
| 15 Exchange pair management | W02/W14/W21–W23/W34 | E1/E2 submission seams only; dedicated target/locked terms unfinished. |
| 16 Drop load/preview | W25/W32 | All examination outstanding, including alternate exports. |
| 17 Drop chunk send | W26 | E2 caller trace and E1 payload prerequisite only. |
| 18 Lifecycle/readiness/checklist | W07/W27 | All examination outstanding, including GitHub producer. |
| 19 Health/CMS/economics | W28/W29 | All examination outstanding. |
| 20 Labels/catalogue/caches | W21/W28/W29/W36 | All examination outstanding; presentation versus financial reads must stay distinct. |
| 21 Authoring UI/provider | W30/W32/W25 | All examination outstanding. |
| 22 Loopback API | W30/W31 | All examination outstanding. |
| 23 Writer/archive/recovery | W31 | All examination outstanding. |
| 24 Projection/mirror | W32/W31/W39 | All examination outstanding. |
| 25 Direct trade/FA2 | W33/W35 | Contract semantics not examined; E1 gives no execution credit. |
| 26 Direct pair mutation | W34 | Contract semantics not examined. |
| 27 Direct pause/rescue/XTZ | W34/W35 | Contract semantics not examined. |
| 28 Signer provisioning | W38 | All examination outstanding. |
| 29 Provenance/origination | **W40 added after freeze** | Missing inventory scope; no fresh provenance or deployed identity examination. |
| 30 Thumbnail/site assets | W36/W04/W39 | All examination outstanding, including launchers/optimizers. |
| 31 Exported Webflow CMS | W37 | Exported capability retained; current executable caller unestablished. |
| 32 Public delivery/build/Pages | W03/W04/W39 | All examination outstanding. |
| 33 Admin production/dev/harness | W30–W32/W39 | All examination outstanding, including exporter effects. |

| Later group (historical W label) | Current inventory | Remaining AUD-011 coverage |
| --- | --- | --- |
| H01 Arrival/Utility/reveal | W03/W04 | NOT EXAMINED. |
| H02 Public wallet | W01 | NOT EXAMINED. |
| H03 Holdings/identity/rendering | W01/W05/W06/W10/W17 | NOT EXAMINED. |
| H04 Drops schedule/pause/inventory | W05/W07/W08 | NOT EXAMINED. |
| H05 Drops trade | W09/W12/W33 | PARTIAL client ABI seam only. |
| H06 Exchange | W10–W12/W33 | PARTIAL client ABI seam only. |
| H07 Retained Public submissions | W12 | NOT EXAMINED. |
| H08 Admin boot/network/authority | W13–W15 | PARTIAL E2 seam; no complete lifecycle examination. |
| H09 Pause/recovery | W16/W20/W34 | PARTIAL E1/E2 seams. |
| H10 Treasury | W17–W20/W34/W35 | PARTIAL E1/E2 seams. |
| H11 Pairs | W21–W24/W34 | PARTIAL E1/E2 seams. |
| H12 Admin Drops | W25–W27/W32 | PARTIAL W26 caller seam only. |
| H13 Checklist/Health/catalogue | W21/W27–W29/W36 | NOT EXAMINED. |
| H14 Authoring/provider | W30/W32 | NOT EXAMINED. |
| H15 Writer/projection/archive/recovery | W31/W32 | NOT EXAMINED. |
| H16 Direct contracts | W33–W35 | NOT EXAMINED semantically. |
| H17 Build/delivery/dev | W03/W04/W30/W32/W39 | NOT EXAMINED. |
| H18 Assets/CMS | W36/W37, catalogue consumers W21/W28/W29 | NOT EXAMINED; W37 has no evidenced registered caller. |
| H19 Provisioning CLI | W38 | NOT EXAMINED. |
| H20 Contract provenance | **W40 added after freeze** | NOT EXAMINED. |

These crosswalks establish provisional scope correspondence, not coverage completion or proof of semantic equivalence of every historical subpath. Historical findings, fixes, accepted limitations and earlier tests remain historical evidence to reassess at the relevant seam. In particular, [known issues](../docs/known-issues.md), historical supported-writer/external-editor distinctions and pair producer/Public consumer ambiguity must not be silently treated as resolved by this checkpoint. No historical disposition is changed here.

### Recommended bounded examination batches

Current execution checkpoint: **B1–B7 COMPLETE** within their recorded
source/inert boundaries above; AUD-011 remains **PARTIAL** pending finalization,
with restricted execution and external integration limits explicitly retained.
The original boundaries and dependencies below are preserved as the execution
plan, not inherited examination credit or a new clean-result refresh.

Use the following seven source-bounded batches; each listed slice is a stop boundary for an execution, not permission to start remediation or to call the entire batch examined after one slice. Reuse E1/E2 where applicable and record only newly examined behavior. Prioritize exact authority/financial/outcome contracts before presentation. Dependencies specify evidence needed to finish a consumer; independent source reading can proceed earlier.

| Batch / order | Source boundary and bounded slices | Dependencies / completion evidence still needed |
| --- | --- | --- |
| B1 Identity, contract effects and provenance | W02/W33–W35/W40. Slice 1: registry/resolvers and source/artifact consumer identity. Slice 2: direct `initiate_trade`, FA2 effects, per-item/grouped-batch failure semantics and events. Slice 3: direct pair mutation/count/uniqueness, then pause/custody/default ingress as separate action traces. Stop at external FA2/protocol/deployed-code boundaries and label them. | Foundation for B2–B7. Reuse ABI evidence; no repeat ABI run just to earn credit. Establish current expected properties/source invariants; separate source review from unavailable legacy execution and deployed identity. |
| B2 Configuration authoring and propagation | W30–W32. Slice 1: Admin local authoring/provider session and loopback validate/preview/apply. Slice 2: direct CLI/service writer, archive/CAS/lock/journal/rollback/reconcile. Slice 3: source regeneration/watch→JSON→Admin mirror/provider and invalidation. Stop at file and committed snapshot publication into consumers. | B1 identities/accepted shapes. Establish error, concurrency and interrupted recovery properties in disposable seams only; preserve real journals/locks. Consumers continue in B3/B6; production graph in B7. |
| B3 Public observations and actionable state | W01/W05–W08/W10. Slice 1: wallet startup/events/holdings pager and each page's generations/retry. Slice 2: Drops params/CMS/exclusions/cart/supply/reveal. Slice 3: calendar/trusted time/pause/visibility and continuing LIVE. Slice 4: Exchange CMS economics/cart/quantities. Stop at final inputs consumed by send handlers. | B1 identity and B2 configuration contracts. Establish unknown/stale/exact-quantity behavior across external provider failures; no transfer of Admin SDK findings to Public. First-paint/navigation remains B7. |
| B4 Public operation construction and outcomes | W09/W11/W12. Slice 1: both handler→unique pair/operator→approval/trade payload paths and final authority gates. Slice 2: durable reservation/lock/send rejection/no-hash/late-hash cases. Slice 3: whole-operation confirmation, reload/retry and refreshed holdings. Include direct consumer comparisons from B1. | B1/B3. Reuse E1; examine semantic identity, SDK request boundary and recovery without repeating the validated Admin finding. Applied outcome and balance freshness need independent evidence; live signing/finality stay qualified. |
| B5 Admin authority, status and custody | W13–W20. Slice 1: unexamined wallet/network/surface/indicator branches. Slice 2: both pause instances through state refresh/recovery. Slice 3: both treasury inventory/MAX and XTZ paths. Slice 4: FA2 selection/batch transfer and shared durable reconciliation. Split per action/surface where effects or events differ. | B1 and recorded E2. Preserve E2 as established; inspect only remaining branches/consumers and its explicit alternative-path unknowns when needed. Do not spend another execution recreating the same A-intent/B-request proof. Chain authorization and all intended-operation outcomes remain separate obligations. |
| B6 Admin pairs, Drops orchestration and readiness | W21–W29. Slice 1: pair pagination/catalogue/availability and manual create/edit/cleanup across surfaces. Slice 2: immutable params→normalize/translation→initial/Auto/manual preview/cache, including dormant exports separately. Slice 3: per-chunk send/partial result/status. Slice 4: Health holder/economics/CSV caches→checklist, GitHub comparison, countdown and event invalidation. | B1/B2/B5; coordinate full-term producer/consumer comparison with B4. E1/E2 seams are reused, not full-row credit. Complete stale-request/unknown/readiness and current-plan equality examination is required beyond existing regressions. |
| B7 Assets, operator tooling and delivery | W03/W04/W36–W39. Slice 1: thumbnail launchers/input/backfill/manifest locks and catalogue consumers. Slice 2: exported CMS library capability/read-write ambiguity, retaining its unestablished application caller. Slice 3: signer provisioning dry-run/verify/execute boundaries through confirmed exact readback. Slice 4: public shell/inline code/reveal/router/CI graph, Admin production isolation, dev/harness/exporter effects. | B1 provenance, B2 mirror/provider and relevant B3/B6 consumers. Inert fixtures/source can examine operational write paths without invoking them. Choose focused verification per slice; builds only when later authorized/justified, never deployment or transactions by implication. |

### Limitations and next checkpoint

- The inventory is source-derived and provisional. Targeted registration/caller/effect discovery is deliberately shallower than the correctness method's complete control/data-flow examination. The post-freeze provenance omission demonstrates why this checkpoint cannot substitute for a later independent coverage refresh. No clean-result refresh is due while the pass is partial.
- E1's recovered result lacks a per-run revision/transcript in this checkpoint; E2 describes its source/version assumptions and controlled supplemental results above. Preserve their reported bounds rather than inventing execution dates, wider coverage or fresh runs. Current source HEADs identify this inventory, not a newly tested build.
- No live Webflow site/custom code, remote CMS, current wallet/SDK transport, browser storage/Web Locks scheduling, RPC/TzKT/time/GitHub response, external FA2, Pages/CDN or deployed code/storage was observed. Local shells, manifests, registry addresses and release records cannot establish those truths. W37's downstream application caller and remote publishing integration remain unestablished; planned minting/authoring/bridge work is not inferred as shipped.
- Legacy SmartPy compilation/native execution requires its compatible toolchain and remains unperformed. Historical source/fixture/certification/promotion/origination correspondence must be examined as W40; no modern substitute or historical execution is current certification.
- Current supported config writers coordinate through recovery/locks. Direct source edits and regeneration are inventory entries, but concurrent independent direct editing is a separately recorded unsupported boundary; its historical limitation is not reclassified or fixed here. Operational state, pre-existing assets and generated outputs are preserved.
- Next work is examination of the bounded slices above and explicit resolution/qualification of their uncertainties. Only after the full pass may findings/checklist finalization be considered; AUD-011 remains **PARTIAL**, with the validated SDK source defect and its live/alternative-path unknowns preserved.
