# AUD-004 evidence (2026-11-17)

The [AUD-004 findings](../AUD-004-findings.md) describe five current failures and
their valid/unchanged controls. These scripts deliberately assert observed bad
behavior; success is reproduction evidence, **not** a remediation gate. Run from
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
