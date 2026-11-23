# AUD-006 — correctness investigation

**COMPLETE SOURCE PASS — two confirmed Admin failures; not clean.**
Initial evidence recorded 2026-11-19; unfinished examination completed 2026-11-23
(America/Chicago). This remains working investigation evidence, not a final public
report, remediation or deployment approval. [Coverage](coverage.md) records the
complete behavioral examination, verification and unverified boundaries, while
preserving the original partial checkpoint. The completed pass updates the
existing remediation checklist with only the two actionable ownership fixes.

Reviewed runtime source is Outer `5b465deb2e3ffc393a400458cff26725b1a2f612`
and independent Admin `3fda8b857d3f3374a49ff4d3e9f7273e96213bca`, both initially
clean on `ticket-AUD-006-full-correctness-review`. Runtime source stayed unchanged.
Working changes are investigation documentation/checklist and four inert Admin
evidence scripts. The original two defect runners are preserved, with reverse
loader ordering added to 001; the other two qualify challenged hypotheses.
Expected properties come from project intent's current-authority,
identity and truthful-state requirements, independently of existing fixtures.

| ID | Scope | Confirmed consequence |
| --- | --- | --- |
| AUD-006-001 | Admin Drops Auto / manual preview | Superseded loader completions overwrite or destroy newer preview/send state |
| AUD-006-002 | Admin Drops countdown / unpause / preview | An aborted unpause read can publish the old preview's start ID and LIVE over a replacement countdown |

Both are P2: supported local UI interleavings cause consequential configuration
preview/recovery failures. Neither demonstrates unauthorized chain execution,
asset loss, an actual provider incident or a deployed failure. They can be
handled together as a focused Drops asynchronous-ownership remediation ticket;
that observation does not authorize implementation.

## AUD-006-001 — retired Auto failure clears a newer preview

**Property.** Once manual Load & Preview supersedes an Auto scan, that retired
scan must no longer change the current preview, cached send intent, readiness or
operator status, on either success or rejection.

**Source and supported path.** The Auto button reaches
[`handleAutoStart`](../admin-ui/src/features/drops/drops.load.service.js#L595).
The handler captures cancellation and epochs in `isAborted`. Its full-range
overlap check awaits `hasAnyOverlapInRange` at lines 715–717. The rejection branch
at lines 718–725 publishes an error, clears `state.lastDropsState`, clears the UI
signature and loaded state, and disables Send **before any cancellation check**.
The success continuation checks `isAborted` at line 725. Manual Load & Preview
supersedes the scan using `stopAutostart` at line 913 and can establish a new
`lastDropsState` and ready UI before the old indexer promise rejects. Aborting
the scan does not cancel that pending read. The handler's outer catch also lacks
an ownership check; this reproduction specifically establishes the overlap
rejection branch, not every possible exception in the outer catch.

**Evidence.** From Admin:

```text
node tests/repro/AUD-006-drop-auto-error-repro.mjs
```

The [runner](../admin-ui/tests/repro/AUD-006-drop-auto-error-repro.mjs) executes
the checked-out loader, state and status functions, actual normalizer and builder,
current drop params and registry-derived config. Only indexer completion, DOM,
countdown and metadata enrichment boundaries are inert. It pauses the Auto
handler's range check, completes the actual manual handler for start ID `100`,
verifies `Params loaded.`, a cached start of `100` and `canSend === true`, then
rejects the retired read. Actual result: cached preview becomes null, signature
becomes empty, loaded/readiness become false and the old overlap error replaces
the newer success. This is ordered promise completion, not scheduler luck.

Positive controls: a **current** range-read failure correctly blocks; a retired
**successful** range read preserves the replacement preview and success status.
The script exits zero by asserting the defect and these controls. It is not a
passing remediation regression. No wallet request is invoked.

**Consequence and limits.** An operator can lose a successfully verified setup
and must reload it after an unrelated older request fails. Existing per-request
pair-status guards address `drops:status:update` and checklist publication;
they do not guard these direct state mutations. This is distinct from the
remediated AUD-005-002 status-summary ordering trigger. No financial send or
on-chain effect was demonstrated.

**November 23 continuation — reverse order also fails.** The same runner now
holds a manual range check, completes the actual Auto replacement, then settles
the old manual read. On success, the old manual preview at start `100` replaces
Auto's newer cached preview; on rejection, it clears that preview. The Auto
entry increments `initialPreviewEpoch` and its own `autostartEpoch`, but does not
retire `manualLoadEpoch`. Manual's `isStaleLoad` at lines 900–904 checks only
manual/phase/network epochs, so its after-await checks do not recognize Auto as
a replacement. The status-request wrapper protects separate summary events, not
these shared-state mutations. Both old success and rejection paths are reachable
with normal editable Start/Chunk controls followed by Auto while the indexer read
is pending. This expands 001's mutual-loader ownership root; it is not a third
finding or a regression of AUD-005-002. The original current-failure and
retired-success controls retain their assertions and pass; current manual
success/rejection controls were added as well. The harness inputs now explicitly
match the manual detail signature, preserving the controller's admission
precondition rather than relying on direct-service acceptance alone.

## AUD-006-002 — aborted unpause completion repaints a replacement preview

**Property.** A stopped unpause owner cannot publish phase, preview data or
completion state for a newer countdown. Cancellation must fence the continuation
after a storage await, including replacement within the same configuration epoch.

**Source and supported path.**
[`pollForUnpauseAdmin`](../admin-ui/src/features/drops/drops.countdown.service.js#L41)
checks its signal before `getStorage` (line 61), but after that await its unpaused
branch checks only poll/phase/network epochs (lines 65–66), then sets `live` and
renders its captured `baseModel`. The
[`poll`](../admin-ui/src/utils/poll.js) helper cannot undo effects already
published inside that callback. `startAdminCountdown` calls `stopUnpausePoll`
(line 119), aborting and clearing the old controller, but does not increment
`unpausePollEpoch`. A new manual preview calls this replacement operation within
the same phase/network epoch. Its new trusted-time countdown begins PRE before
the new standby poll can claim a later poll epoch. During that window the old
aborted storage completion still passes the epoch checks.

**Evidence.** From Admin:

```text
node tests/repro/AUD-006-unpause-owner-repro.mjs
```

The [runner](../admin-ui/tests/repro/AUD-006-unpause-owner-repro.mjs) composes
the checked-out countdown owner, state helpers, actual `poll` and actual preview
renderer. The DOM fields and storage/time-provider boundaries are controlled.
An old standby owner captures start ID `10` and waits for storage. Calling the
same `startAdminCountdown` replacement used by manual loading aborts that owner
and renders the new start ID `100` with PRE while trusted time is unavailable.
Resolving the old read as `{paused:false}` then changes the actual displayed
start back to `10`, displays `LIVE NOW!` and sets the shared phase to `live`.
No new poll epoch has started in this deterministic window.

Positive controls: an unchanged current owner correctly publishes LIVE; a
phase-reset replacement rejects the old completion and retains start `100`/PRE.
The shared clock is stubbed only at countdown creation/initial tick, matching its
real initial invalid-time state; this is not a test of timeapi.io or real timers.
An initial harness attempt omitted the preview renderer's default-export
stripping and log dependency; after correcting those inert bindings, the
complete scenarios and controls pass repeatedly. No production change was used
to obtain the result.

**Consequence and limits.** The preview summary can identify an earlier pair
range while the manual loader retains the newer cached send intent and input
signature. The send service serializes that cached intent, so the stale preview
is consequential operator information; an actual mismatched send was not
executed by this runner. This does not establish early contract unpausing,
changed chain storage, incorrect wallet execution or asset loss. The exposed
interval ends when a replacement standby poll increments the epoch. Full reset
and network changes already fence the reproduced completion. The old owner's
`finally` also unconditionally lowers `adminUnpausePollRunning`. Reverse caller
inspection found only `enterAdminStandby` calling this poll, reached by the
countdown's once-only expiry callback; a replacement countdown first stops the
previous controller. No separate supported duplicate-poll entry or consequential
failure from that flag assignment was established, so it is not another finding.

## Challenged paths that are not additional confirmed findings

### Draft input changes during an already-clicked Send

`node tests/repro/AUD-006-send-input-repro.mjs` composes the actual panel,
controller, sender, wallet authority and operation serializer through the
maintained runtime fixture. It holds the first account read, edits Start from
`10` to `100` with the actual `input` event, observes the disabled button and
`dataset.canSend === '0'`, then releases the read. Both edited and unchanged
controls request three exact old-range batches, starting at `10`.

This establishes a UI/controller distinction, not an independently grounded
authority failure: `drops.controller.js` explicitly describes Send as replaying
cached intent, while `drops.view.panel.js` identifies the raw input signature as
UX rather than authoritative params. The clicked preview remains unchanged and
already authorized. A draft edit without blur/change/Enter does not establish a
replacement preview; those committed edit events invoke the owned loader. Real
preview/config/account replacement is separately fenced. No requirement was
found that an in-progress send must be cancelled by draft typing, and no changed
payload, replacement signer or unauthorized destination was demonstrated. An
initial investigation message called this a third failure before resolving that
oracle; that classification is withdrawn. This characterization is not included
as a remediation ticket or an unresolved material defect hypothesis.

### Modal content after injected delayed local metadata

`node tests/repro/AUD-006-modal-content-repro.mjs` reuses the actual modal
controller/content/widgets/validators and actual update serializer with inert
DOM/wallet edges. Holding an injected `uiToken` promise while opening custom-FA2
pair A, opening pair B, then resolving A can reset B's token selection before its
real save handler constructs `update_token_pair`. A serial control retains B's
token. The controller's session check after `populateModalFromPair` cannot undo
content mutations inside that function.

The necessary delayed producer was then traced to completion: `makeChainUi.token`
uses synchronous persistent cache reads and `catalog.get`/`getTokenUi`, whose
current title/thumbnail implementation is local-only with no pending I/O. During
initial modal population a configured collection's token list is local; an
unlisted contract starts in custom token mode and returns before remote catalog
warming. Those Promise chains settle in the same event-loop microtask checkpoint
before the next ordinary user click. The dormant NFT big-map/IPFS helpers have no
caller from current `getTokenUi`. Later remote token-list warming has epoch and
sequence checks. The injected indefinite initial metadata delay therefore does
not establish current supported-workflow reachability. This is preserved latent
gap evidence, not a third production defect or an actionable follow-up. A future
change introducing awaited remote initial metadata would require reassessment.

## Historical reconciliation and external uncertainty

- AUD-005-001 remains the accepted **unsupported external-concurrency
  limitation**, per the owner's support boundary and the existing source-ownership
  record. Current service/CLI/projector/watcher writers share coordination. No new
  evidence was found here that turns independent editor saves into a supported
  application-writer path; no opt-in external-save failure is used as a defect
  or launch blocker.
- AUD-005-002 has current request-scoped status guards and 36 maintained
  status-ordering tests in the passing Admin runtime selection. The new 001
  concerns direct preview-state mutation on rejection, outside those guards.
- AUD-005-003 now bounds headers **and decoding** with one race; the maintained
  response-timeout/provider tests pass in the Admin selection. No body-stall
  regression is claimed from the historical defect-asserting harness.
- AUD-005-004 now checks exact inventory against the full configured amount at
  presentation, handler entry and final request. Its maintained lifecycle cases
  pass in the Outer selection. Source protection does not eliminate subsequent
  external inventory races or prove a successful on-chain redemption.
- AUD-005-005 now encodes filename URL path content and retains JavaScript
  escaping; 37 current Admin manifest tests pass. The preserved historical
  `AUD-005-thumb-url-repro.mjs` still asserts the old defect and was not run as a
  current correction gate.
- The seven known-issue records and AUD-002/003/004/005 ledgers were consulted
  **after** independent source enumeration. Their workflow groups were reconciled
  into coverage. The November 23 continuation completed independent current-path
  reassessment and adjacent source examination, with current maintained suites.
  Their historical findings and revision-specific evidence remain unchanged.

| Historical paths | Current-source disposition supporting this pass |
| --- | --- |
| CHR-001; AUD-003-001 | Public observations and destructive mismatch clearing are generation-owned; obsolete success/rejection and account replacement covered by current wallet paths. |
| CHR-002/003; AUD-003-003/005/006; AUD-004-001/002 | Both Pause/Treasury surfaces and all pair/Drops writes capture current authority, exact amounts/targets and retain ambiguous recovery/receipts. Withdrawal text is no longer rewritten. New 001/002 concern preview ownership, not these old triggers. |
| CHR-004/006; AUD-003-002/004/014/015; AUD-004-005 | Full holdings/Health enumeration and holder identities, unsafe receipt/quantity rejection, unknown economics, explicit forced refresh, CANAAN ACID and supply-dependent recomputation remain in current producers/consumers. Canonical 015's ticket alias 008 is preserved. |
| CHR-005; AUD-002-007; AUD-003-011; AUD-005-004 | Valid boolean unpause, continuing pause/recovery and full configured redemption inventory at entry/final action gates; no current false-LIVE HTTP-error trigger. New 002 is Admin's separate cancelled owner. |
| CHR-007; AUD-002-005/006/011; AUD-003-007/009/012 | Exact string token/pair IDs, runtime Public compatibility, stored modal identities, malformed page rejection, full-term matching and duplicate burn reduction are maintained. Unsafe presentation sorts are not used to serialize identities. |
| AUD-002-001/002/003/008; AUD-003-010/013 | Complete Public pager; retained scoped submissions; 20-per-token/50-total bounds; all-intended Admin receipt matching; bounded confirmation; local Utility links. Live storage/provider truth remains unverified. |
| AUD-002-004; AUD-003-008/016/017/018; AUD-004-003; AUD-005-001/003 | Strict equality including falsy copies, pending/divergence exclusion, exact base/target recovery, shared writer claim, provider health retirement and full body deadline. Only unsupported concurrent editor replacement remains accepted; no supported-writer failure found. |
| AUD-002-009/010; AUD-003-019/020; AUD-004-004; AUD-005-005 | CMS complete pagination/explicit mutation ambiguity and shared manifest lock/rollback ownership; generated JS escaping plus encoded filename URL identity. Current suites cover these seams; no live CMS operation occurred. |

Verification details and exact source revisions are in coverage. Builds, fixtures,
protocol references, ABI decoding and historical certification have distinct
limits. Browser/wallet/live-chain/Webflow/deployed-contract behavior, real
storage/locks, OS crash durability, fresh Linux/Node-20 delivery and compatible
legacy SmartPy execution remain unverified. No `audits/report.md` or public final
report is produced. Both confirmed findings remain unremediated; source-pass
completion does not establish a clean or production-ready application.
