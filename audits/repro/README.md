# AUD-006 evidence (2026-11-19; source pass completed 2026-11-23)

The [AUD-006 working findings](../AUD-006-findings.md) document two current
Admin Drops ownership failures and positive controls. Run separately from Admin:

```text
node tests/repro/AUD-006-drop-auto-error-repro.mjs
node tests/repro/AUD-006-unpause-owner-repro.mjs
```

These run checked-out functions with inert DOM, indexer and countdown boundaries;
the loader now also covers older-manual/newer-Auto success and rejection. The
second also runs the current poll helper and preview renderer. Success
asserts the documented defects, not their remediation. They do not send wallet,
chain or Webflow requests or change configuration. The application-wide source
examination is complete with these two unremediated findings; see
[coverage](../coverage.md) for external/unexecuted boundaries. Older evidence
below retains its original revision and purpose.

Two additional Admin runners preserve challenged hypotheses without counting
them as defects:

```text
node tests/repro/AUD-006-send-input-repro.mjs
node tests/repro/AUD-006-modal-content-repro.mjs
```

The first characterizes draft-input versus already-clicked cached send intent;
no independent cancellation requirement is asserted. The second demonstrates
modal mutation only with an injected delayed local metadata promise, which the
current production producer cannot supply across ordinary user clicks. Both
have positive controls; neither is a remediation gate or a follow-up ticket.

# AUD-005 evidence (2026-11-19)

The [AUD-005 findings](../AUD-005-findings.md) classify five current failures,
their controls and limitations at Outer `fd47dda4adc4ccd23b71447d765acc8c1198d543`
and Admin `9edef7cac18c04f40e75a9b15fca0517208f7c6a`. These reproduction scripts
assert bad behavior; success demonstrates a defect, not a remediation gate.

```text
# Outer: actual functions / disposable copies, inert I/O
node audits/repro/AUD-005-writer-read-window-repro.mjs
node audits/repro/AUD-005-drops-inventory-repro.mjs
node audits/repro/AUD-005-thumb-url-repro.mjs

# Admin: actual client/provider/subscriber and status producer/consumer
node tests/repro/AUD-005-authoring-body-repro.mjs
node tests/repro/AUD-005-drop-status-order-repro.mjs

# Supporting current ABI check; same limits as the historical probe below
node audits/repro/AUD-005-contract-abi-check.mjs
```

The writer runner copies unchanged modules and wraps only a native filesystem
read seam to interleave an independently verified editor save after old source
bytes were obtained. Before-check and unchanged controls distinguish the
remaining window from the corrected AUD-004 trigger. It never edits a real
source/projection/journal/archive/lock. Asset runners likewise use bounded
disposable workspace copies. No runner sends a wallet/chain/CMS request.

The body-stall runner controls time and HTTP bodies, composing the real client,
provider and subscriber. The status-order runner uses current bundled params,
normalizer/builder/classifier/publication guards and controlled indexer ordering.
Drops inventory uses maintained real-handler extraction plus the real button
function and schema acceptance check. Mocked confirmation is not chain execution.

Current AUD-004 writer/provenance and isolated config runners remain useful.
The historical AUD-004 ABI probe needs new pair authority/target dependencies;
the AUD-005 copy supplies the maintained fixture dependencies without changing
production code. Outer AUD-003 `drop-authority` similarly has an obsolete helper
VM and is not a passing current gate; Admin's current
`tests/runtime/drops-send-invalidation.test.mjs` and `pair-authority.test.mjs`
cover its maintained behavior. The other eleven maintained Outer AUD-003 runners
and five Admin AUD-003 replacements passed this pass. Frozen old defect
assertions are preserved below, not reinterpreted as current runtime failures.

# AUD-004 evidence (2026-11-17)

The [AUD-004 findings](../AUD-004-findings.md) describe five failures at the reviewed
revisions and their valid/unchanged controls. Except for the maintained writer
regression noted below, these scripts deliberately assert observed bad behavior;
success is reproduction evidence, **not** a remediation gate. Run from
the indicated repository with the reviewed Windows/Node 22.16.0 environment and
installed dependencies:

```text
# Outer: actual writer and asset tools, disposable workspace copies only
node audits/repro/AUD-004-writer-cas-repro.mjs
node audits/repro/AUD-004-thumb-filename-repro.mjs

# Admin: real controllers/helpers, inert DOM/wallet/indexer boundaries
node tests/repro/AUD-004-withdraw-input-repro.mjs
node tests/repro/AUD-004-pair-authority-repro.mjs
node tests/repro/AUD-004-checklist-supply-repro.mjs

# Outer: supporting ABI/identity checks and isolated config suites
node audits/repro/AUD-004-contract-abi-check.mjs
node audits/repro/AUD-004-contract-provenance-check.mjs
node audits/repro/AUD-004-config-suite.mjs
```

The pair reproduction includes an actual Set Pair listener held at its
availability lookup with immediately resolved SDK account reads; separate helper
cases use a controlled older account read. Neither establishes real signing or
on-chain authority. ABI decoding is not Michelson execution/typechecking or
legacy SmartPy compilation. Provenance assertions target recorded Windows
checkout byte hashes and normalize LF for frozen/promoted comparison.

Asset/configuration runners require native dependencies/child-process access.
They validate fixture paths and remove only their own disposable subdirectories
of ignored `audits/work/`. No script recovers/deletes a real journal, edits
operational configuration or makes a live wallet/chain/CMS request. The config
runner executes unchanged tests in separate processes; do not replace it with
real-tree transaction tests that intentionally write source/projection paths.
Both repositories must be present for cross-repository evidence.

`AUD-004-writer-cas-repro.mjs` is now a maintained regression for AUD-004-003:
the later save must survive with reconciliation required, while unchanged apply
still completes. The original lost-edit observation remains in the dated findings.
`shared/drop-params/drop-params-projection.test.mjs` extends this case across
staging/replacement boundaries, exact-byte ownership, partial failures and
interrupted recovery using disposable fixtures.

# AUD-003 reproduction status

Reconciled by POST-AUD-003-001 on 2026-11-17. The original findings, defect
assertions and valid controls are historical evidence, not expectations for
remediated source. The original tracked scripts are available at Outer
`1dfcffa` (`ticket-AUD-003-full-correctness-pass`). Do not run every
`AUD-003-*-repro.mjs` as a current regression gate: the following scripts retain
their historical bodies unchanged. Their current executable replacements run
real production functions with inert boundaries and reject the former triggers.
No runtime tests or assertions have been removed or disabled.

| Historical script (`AUD-003-` prefix) | Current replacement in `admin-ui/tests/` | Initial current-source classification |
| --- | --- | --- |
| `treasury-repro.mjs` | `repro/AUD-003-treasury-repro.mjs`; `runtime/treasury-recovery.test.mjs` | Old second-send assertion rejects the corrected repeat exclusion. |
| `health-repro.mjs`, `health-missing-account-repro.mjs` | `repro/AUD-003-health-repro.mjs`; `runtime/health-cms.test.mjs` | Old VM lacks current dependencies/valid identities and comparator binding; not current provider evidence. |
| `pause-repro.mjs` | `repro/AUD-003-pause-repro.mjs`; `runtime/pause-recovery.test.mjs` | Fixture extraction anchor changed; current replacement covers both surfaces, unknown exclusion and attributed recovery. |
| `pair-status-repro.mjs` | `runtime/drops-pair-status.test.mjs` | Former wrong-adjacent-ID `full` assertion now returns `missing`. |
| `local-snapshot-repro.mjs` | `runtime/drops-local-snapshot.test.mjs`; `runtime/drops-send-invalidation.test.mjs` | Historical runtime stub lacks `updateProviderState`; current subscriber revokes params and fences Send. |
| `pair-pagination-repro.mjs` | `runtime/pair-pagination.test.mjs` | Malformed HTTP-200 page now rejects with `TZKT_PAIR_PAGES_UNAVAILABLE`; status is verification-required, not missing. |
| `health-refresh-cache-repro.mjs` | `repro/AUD-003-health-refresh-cache-repro.mjs`; `runtime/health-cms.test.mjs` | Old VM/comparator binding is stale; current explicit refresh bypasses cache and retires failed evidence. |
| `health-missing-acid-repro.mjs` | `repro/AUD-003-health-missing-acid-repro.mjs`; `runtime/health-cms.test.mjs` | Old VM/comparator binding is stale; current CANAAN validation rejects missing/invalid values. Canonical finding 015, ticket alias 008. |
| `fixture-diagnostics.mjs` | Outer `drops/js/burn-quantity.test.mjs`, `drops/js/reveal-coordinator.test.mjs`, `shared/public-trade-pairs.test.mjs` | Historical diagnostic asserts the pre-TEST-001 missing dependencies; it is not a regression gate for repaired fixtures. |

Run the current Admin replacements with `npm run test:runtime` from Admin.
The five Admin `tests/repro/AUD-003-*-repro.mjs` scripts can also be run directly
with Node from Admin; the Health pagination script includes missing-holder
controls. The current Public pair/outcome, burn and reveal tests run with:

```text
node --test --experimental-test-isolation=none shared/public-trade-pairs.test.mjs shared/public-trade-outcomes.test.mjs drops/js/burn-quantity.test.mjs drops/js/reveal-coordinator.test.mjs
```

The other twelve `AUD-003-*-repro.mjs` scripts in this directory are adapted
current regressions. Use `node --experimental-vm-modules <script>` (the wallet
reproduction requires VM modules). The pending-READY regression now checks
that health loss clears both params and sourceVersion, then verifies explicit
reconciliation restores READY and preview. Thumbnail concurrency requires
working child-process/native-dependency access; sandbox `spawn EPERM` is an
environmental failure, not a race assertion result.

See the [dated ledger reconciliation](../AUD-003-findings.md#post-remediation-reconciliation--2026-11-17)
and [ticket evidence](../POST-AUD-003-001-evidence.md) for verification outcomes
and live-check boundaries. Historical failures remain preserved; they do not
establish a new production defect on corrected source.
