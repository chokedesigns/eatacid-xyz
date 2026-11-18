# POST-AUD-003-001 — Consolidated evidence

2026-11-17; ROUTINE; Outer + Admin. Both started clean on
`ticket-POST-AUD-003-001-evidence-consolidation`, at Outer
`aa634a37ef9c498d8e9edbb7706b1ea55675e7c8` and Admin
`57400fe63b68fe44c8bad45e4f6a99558c66b4dc`. Verification used the existing
Windows installation: Node v22.16.0, npm 10.4.0, Beacon 4.8.1, Parcel 2.16.4,
Taquito 19.0.2 and Sharp 0.35.3. No dependencies were installed or changed.

## Roundtable disposition

| Item | Verified disposition |
| --- | --- |
| RT-01 | 018 failed on `.params.dropName` because corrected health loss clears params. It now asserts null params/sourceVersion, retaining pending/no-preview and explicit-recovery controls. Nine original defect scripts plus the old fixture diagnostic remain intact, explicitly mapped to passing current executable replacements in [repro/README.md](repro/README.md). |
| RT-02 | Initial Public sweep: 338/341 passed; three Drops pair-caller failures reached the real `assertDropLive` without LIVE/unpaused fixture state. Supplying those preconditions restores the existing assertions. Final pair/outcome run: 26/26; outcomes alone: 13/13, including the installed Beacon 4.8.1 transport method. The ZIP dependency failure does not reproduce here. |
| RT-03 | Installed-environment Public/compatibility, CMS, thumbnail, authoring/projection and Admin suites/builds pass below. Child-process sandbox failures were retried outside the sandbox without source changes. |
| RT-04 | Admin `getEditionsForToken` preserves null unless the value is a safe nonnegative integer. HEALTH-001 regressions exercise malformed/negative/missing values through CMS, distinct from zero/five. `docs/known-issues.md` now records the existing remediation. |
| RT-05 | Current Drops button and action handler require LIVE/unpaused state; the final pre-wallet boundary rechecks. Continuous pause polling retires eligibility on later pause/unavailability. Lifecycle/trade controls pass; `docs/testnet-to-mainnet.md` now describes this while retaining contract-pause containment. |
| RT-06 | The [AUD-003 ledger](AUD-003-findings.md#post-remediation-reconciliation--2026-11-17) adds all twenty source-remediation mappings and evidence without altering historical finding bodies. No new audit or coverage refresh was performed. |
| RT-07 | Checklist 2.6/finding 015 = Admin `bb6c3c7`, ticket alias `AUD-003-008-canaan-acid-csv-validation`. Checklist 3.2/finding 008 = Admin `73c28d5`, separate ticket `AUD-003-008-local-drops-health-invalidation`. Health test/output labels identify 015 and retain alias 008; assertions are unchanged. |

## Commands and results

All final current gates below passed with no skipped tests. Logs are retained
under ignored `audits/work/POST-AUD-003-001-*.log`; historical failing executions
are classified in the reproduction map, not counted as passing regressions.

| Repository / command | Result | Log suffix |
| --- | --- | --- |
| Outer: Public sweep listed below | 377 passed / 0 failed | `public-final.log` |
| Outer: `node --test --experimental-test-isolation=none shared/public-trade-pairs.test.mjs shared/public-trade-outcomes.test.mjs` | 26 passed / 0 failed | `pairs-outcomes.log` |
| Outer: `npm run test:drop-params` | 54 + 1 watcher passed | `params-normal.log` |
| Outer: `node --test --experimental-test-isolation=none assets/thumbs/scripts/thumbs.test.mjs assets/webflow-cms/webflow-cms.test.mjs shared/drop-params/drop-params-projection.test.mjs` | 119 passed; nested disposable authoring/watcher suites also passed 54 + 1 | `tools-projection.log` |
| Outer: `node --experimental-vm-modules <script>` for all twelve current repros identified in `repro/README.md` | All twelve exited 0 | `repros-current.log` |
| Outer: `npm run build:pages:staging` | Passed | `outer-build.log` |
| Admin: `npm run test:runtime` | 1,570 passed / 0 failed after label changes | `admin-final.log` |
| Admin: `node tests/repro/AUD-003-<name>-repro.mjs` for `health-missing-acid`, `health-refresh-cache`, `health`, `pause`, `treasury` | All five exited 0 | Direct command output |
| Admin: `npm run test:thumbs` | 16 passed / 0 failed | `admin-thumbs.log` |
| Admin: `npm run build:clean` | Passed freshness, mirror sync/guard, Parcel, development-chunk pruning and production isolation | `admin-build.log` |

The exact final Public sweep (Outer):

```text
node --test --experimental-vm-modules --experimental-test-isolation=none shared/fa2-balances.test.mjs shared/beacon-setup.test.mjs exchange/js/exchange-wallet.test.mjs drops/js/wallet-rendering.test.mjs drops/js/trade-lifecycle.test.mjs shared/public-trade-ops.fixtures.mjs shared/public-trade-pairs.test.mjs shared/public-trade-outcomes.test.mjs shared/public-confirmation-deadline.test.mjs drops/js/burn-quantity.test.mjs drops/js/reveal-coordinator.test.mjs drops/js/countdown-lifecycle.test.mjs scripts/mainnet-runbook.test.mjs drops/js/drop-compatibility.test.mjs shared/chain-registry.test.mjs shared/drop-time.test.mjs shared/drop-countdown.test.mjs drops/js/countdown.test.mjs drops/js/token-rendering.test.mjs shared/hen-identity.test.mjs scripts/public-navigation.test.mjs loaders/loader-architecture.test.mjs scripts/verify-pages-loader-artifacts.test.mjs
```

## Environmental and live boundaries

The sandbox initially denied child-process spawning in the Windows delete-pending
claim test and thumbnail reproduction (`spawn EPERM`). The same installed
dependencies passed outside that restriction; tools/projection and builds also
ran outside the sandbox for worker access. No assertions or safeguards were
relaxed. Builds emitted nonblocking stale Browserslist-data warnings. CI's Node 20
environment was not reproduced; this baseline is the installed Node 22 environment.

No current production defect was established by these failures. Source/inert
verification does not establish live Webflow markup/CMS or navigation, Beacon
transport/device persistence, wallet timing/signing, TzKT/RPC freshness/completeness,
external time/IPFS/raw checklist responses, deployed Pages/CDN provenance, or
originated contract state/behavior. Those live checks remain outstanding; Mainnet
readiness remains incomplete. No browser/dev/sanity server, deployment, transaction,
contract work or new audit was performed.

Production source, network/address settings, wallet/event/DOM contracts, timers,
poll/retry/stale-write protection and transaction pipelines are unchanged.
Generated params/mirror/thumbnail manifest have no tracked delta. Only the
fixture preconditions, 018 regression assertions, Health evidence labels and
documentation changed; operational recovery journals/locks were not bypassed.
