# Correctness review coverage

## AUD-011 — Final reconciliation (2026-11-25)

**COMPLETE / NOT CLEAN.** The seven recorded source/inert examinations cover
all **40 scopes: 38 workflow scopes, W37's exported support-library boundary and
W40's provenance dependency; 0 PARTIAL, 0 NOT EXAMINED** within that boundary.
All original **33 workflows** and consolidated **20 groups** reconcile below.
Fifteen independent material findings remain confirmed P2 and unresolved;
one additional nonmaterial P3 mobile display discrepancy is preserved. See
[final dispositions](AUD-011-findings.md#final-disposition-and-evidence-boundary)
and the [remediation checklist](remediation-checklist.md). Completion concerns
source investigation/finalization, not verified live integration or readiness.
Material findings preclude a clean-result refresh; none was performed.

Exact reviewed/tested revisions: Outer
`2453358c8cf91d4db3bc24e447ed0859f91216e8`, Admin
`d8636e957d3974ba73882d9d29242898f10ed3e0`; both on
`ticket-AUD-011-full-correctness-review`. Neither implementation changed during
the seven batches or finalization. Initial expected Outer state was modified
coverage plus untracked findings/eight evidence scripts; Admin was clean. Final
delta is Outer audit documentation, those preserved scripts and an exact,
exportable copy of B1's ignored provenance entrypoint. Both HEADs, indexes and
branches, historical evidence, generated data and operational state are preserved.
Windows PowerShell, Node `v22.16.0`, npm `10.4.0`, installed/pinned dependencies
and current source configuration were used without installation or upgrade.
Testnet is Shadownet; Mainnet remains incomplete/disabled. Build delivery variant
does not select a chain. No live/remote system was inspected or mutated.

### B2-001 corrective reconciliation (2026-11-25)

The [corrected finding](AUD-011-findings.md#aud-011-b2-001--hen-redeem-is-admitted-despite-its-burn-only-role)
supersedes the original supported-HEN-redemption assumption. The owner requirement
establishes HEN as burn-side only; current selector/service/schema/Public gate
acceptance is the defect, not evidence of product eligibility. Canonical `141634`
commit and native `6` validation remain preserved observations of that invalid
path; neither is an eligible HEN redeem. The existing HEN-burn/CANAAN-redeem
configuration remains the eligible role control. Checklist `0.1` now rejects HEN
redeem admission rather than translating HEN redeem IDs.

Disposition remains confirmed conditional **P2**: operator-approved ineligible
configuration can be published and consumed; actual chain effects require
additional inventory/pair/wallet conditions and remain unverified. Counts remain
**15 material findings plus one P3 display observation**, with no added root or
coverage credit. Current source, reproduction scripts and historical logs are
unchanged. Policy records corroborate HEN's burn role but concern future new-work
authoring; a complete current collection-role matrix is not established there.
The developer guide now distinguishes implementation admission from the explicit
HEN requirement. No other collection eligibility rule is inferred.

Targeted corrective verification only: read-only Node assertions confirm current
schema, shared compatibility and Public configuration admission for both HEN IDs,
with HEN-burn/CANAAN-redeem control; documentation checks cover corrected links,
checklist format, unchanged counts and preservation of unrelated records/scripts.
`git diff --check` and Outer `npm run ticket:diff` pass; export contents include
all ten pre-existing untracked findings/evidence files and all corrected documents.
Both real indexes, HEADs and branches are preserved; Admin stays clean and its
exports are untouched. Historical broad suites/builds below were not repeated.

### Batch obligations and final source ownership

This is consolidation of the existing forward/reverse/boundary examinations,
not an eighth examination. Each batch's detailed rows and controls below remain
the source trace. The initial 39-scope freeze and post-comparison W40 addition
in the findings remain preserved; discovery is not misrepresented as examination.

| Batch / final scopes | Completed obligations and cross-batch closure |
| --- | --- |
| B1 — W02/W33/W34/W35/W40 (5) | Registry/resolver/token identity; every direct trade and privileged pair/pause/rescue/XTZ branch; default/FA2 ingress and custody; source/fixture/frozen/promoted/archive identity. B4 checks client terms/outcomes, B5 custody callers, B6 producers and B7 signer consumers. Native protocol/FA2/legacy execution and current deployment identity remain explicit stops. |
| B2 — W30/W31/W32 (3) | Registered authoring/provider sessions and loopback validate/preview/apply; supported CLI/service writer, schema, CAS, archive, lock, interrupted rollback/reconcile; source→JSON→mirror/provider retirement. B3/B6 complete downstream state/plan consumers and B7 production packaging. Real operational journals/locks were never recovered or removed. |
| B3 — W01/W05/W06/W07/W08/W10 (6) | Public wallet startup/events/holdings ownership; Drops params/CMS/exclusion/selection/metadata/image/supply; calendar/trusted time/standby/continuing LIVE; Exchange editions/cart/quantities. B4 completes effect-time gates and submitted outcomes; B7 closes independent reveal/navigation. |
| B4 — W09/W11/W12 (3) | Both send handlers through exact six-term mapping/operator reads, approvals/payloads/final authority; durable reservation, rejection/no-hash/late hash/reload/retry; all intended operation evidence and independent refreshed holdings. SDK request mismatch is E2's Public extension, not a duplicated root. B1 direct-chain and B6 producer comparisons are retained. |
| B5 — W13–W20 (8) | Both Admin surfaces' wallet/network/authority/status; both pause actions and durable recovery; inventory/MAX/XTZ/FA2 selection/build/send/confirmation/reconciliation; alternative exports assessed separately. B6 closes event/readiness consumers and extends read-owner findings to pair/GitHub entries. |
| B6 — W21–W29 (9) | Complete pair catalogue/availability/create/edit/cleanup across registered surfaces; immutable params/translation/initial/Auto/manual/cache and dormant parsing exports; every chunk and partial/error result; classifier/checklist/Health/holder/CSV/economics/GitHub/countdown consumers. B1/B4 shared term/authority effects and B2 provider retirement are compared at actual seams. |
| B7 — W03/W04/W36/W37/W38/W39 (6) | Thumbnail launchers/intake/backfill/shared manifest ownership; exported CMS support capability with no registered publisher inferred; signer dry-run/verify/execute source through exact readback; Public shells/inline/reveal/router/loader graph, Admin build/dev isolation, local helpers and invoking-repository exporter. Final execution below closes builds/export and the ten formerly blocked thumbnail cases. |

### Final original-workflow reconciliation

Numbers refer to the original AUD-001 33-row map retained below. W labels refer
to AUD-011's independent inventory, not historical consolidated group labels.
Every row is source COMPLETE through its batch owners above; the qualifications
in those ledgers and final verification still apply. No old scope is silently
dropped because it is dormant, unsupported or externally bounded.

| Original workflow | Final AUD-011 coverage / retained qualification |
| --- | --- |
| 1 Arrival/navigation/Utility | W03/W04; local shells/reveal/inline/routes, live geometry/embedding unverified; no shipped bridge/mint inferred. |
| 2 Network/escrow/token identity | W02/W14; exact targets, strict/fallback/disabled slots and canonical/native mirrors. |
| 3 Public wallet/holdings | W01/W06/W10/W12; current owned projections, complete/exact balances and retained submissions. |
| 4 Drops config/catalog/selection | W05/W06/W08; authored source, CMS canonical IDs, exclusions, selection and reveal owners. |
| 5 Time/pause/inventory | W07/W08; expiry versus unpause, continuing LIVE, unknown supply and resume defect retained. |
| 6 Drops trade/refresh | W09/W12/W33; exact approvals/trade/whole outcomes versus independent holdings freshness. |
| 7 Exchange cart/economics | W10; cart/quantity/quote identity, malformed edition finding retained. |
| 8 Exchange multi-token send | W11/W12/W33; per-unit/grouped operations, authority, recovery and fresh balances. |
| 9 Approval/pair/outcome evidence | W09/W11/W12 plus W22/W23/W26/W27; complete unique six-term reads, producer/consumer agreement and attributed outcomes. |
| 10 Admin boot/wallet/network | W13/W14/W30/W32; independent surfaces, reload and static/dev provider ownership. |
| 11 Admin indication/pause | W15/W16/W20; both targets, authority/readback/pending and terminal versus unknown recovery. |
| 12 Treasury inventory/rescue | W17/W19/W20/W34/W35; complete exact custody reads, selected destinations, admin-only effects and durable uncertainty. |
| 13 XTZ/MAX/withdrawal | W17/W18/W20/W34; account-bound balance/MAX, exact mutez, admin recipient and outcomes. |
| 14 Drops pair create/edit/cleanup | W21–W24/W34; exact terms/IDs, async owners, cleanup concurrency and current-ID deletion. |
| 15 Exchange pair management | W02/W14/W21–W23/W34; dedicated testnet escrow, locked redeem terms, no registered cleanup. |
| 16 Drop load/preview | W25/W32; immutable snapshots, native translation, exact cached/current plans, dormant loader/parser capability separately. |
| 17 Drop chunk send | W26; per-chunk gates, request/terminal/unknown/partial results, stale whole-plan readiness finding. |
| 18 Lifecycle/readiness/checklist | W07/W27; source/plan/pause/supply/time/classifier/GitHub dependency invalidation. |
| 19 Health/CMS/economics | W28/W29; complete holders, unknown counts, local CSV and scoped caches, not live CMS proof. |
| 20 Labels/catalogues/caches | W21/W28/W29/W36; exact identity versus local metadata, HEN display and manifest consumers. |
| 21 Authoring UI/provider | W30/W32/W25; collection-role admission (corrected B2-001: HEN burn-only), eligible redeem identity, preview/session/apply/health and provider admission/version. |
| 22 Loopback API | W30/W31; route/host/origin/payload/token/version/preview binding and uncertain replies in disposable seams. |
| 23 Writer/archive/recovery | W31; supported locks/CAS/journal/rollback/reconcile; AUD-005-001 unsupported external-edit limitation unchanged. |
| 24 Projection/mirror | W31/W32/W39; generation/watch/mirroring/guard/provider and production packaging. |
| 25 Direct trade/FA2 | W33/W35; every sender/term, grouping/recipients and failure atomicity reasoning; no native FA2 execution credit. |
| 26 Direct pair mutation | W34; set/update/cleanup/cardinality and direct duplicate-term capability versus rejecting clients. |
| 27 Direct pause/rescue/XTZ | W34/W35; admin-only effects, custody/sink/default and event meaning. |
| 28 Signer provisioning | W38; fixed assignments, provider/chain/admin/ABI/payload/outcome/readback; no live provider/execute invoked. |
| 29 Provenance/origination | W40, consumers W38/W39; discovered omission closed in B1, local/historical identity distinct from current deployment. |
| 30 Thumbnail/site assets | W36/W04/W39; launchers, import/backfill/generator/lock/rollback, optimizers and consumer identity. |
| 31 Exported Webflow CMS | W37; inert API capability/read-write ambiguity/content/locale/publication helpers; no registered executable publisher found. |
| 32 Public delivery/build/Pages | W03/W04/W39; loaders/root ownership, early/main failure, emitted staging graphs and release source; remote branch/deployment unverified. |
| 33 Admin production/dev/harness | W30–W32/W39; provider graph, mirror/thumb gates, production prune/isolation, local process helpers and separate review export. |

### Final consolidated-group reconciliation

H labels refer to the later AUD-006 W01–W20 map, retained below. The independent
AUD-011 workflow boundaries refine those groups without discarding obligations.

| Historical group | Final AUD-011 scopes / batch owners |
| --- | --- |
| H01 Arrival/Utility/reveal | W03/W04 — B7. |
| H02 Public wallet | W01 — B3; submission consumer W09/W11 — B4. |
| H03 Holdings/identity/rendering | W01/W05/W06/W10/W17 — B3/B5; retained refresh W12 — B4. |
| H04 Drops schedule/pause/inventory | W05/W07/W08 — B3; checklist W27 — B6. |
| H05 Drops trade | W09/W12/W33 — B4/B1. |
| H06 Exchange | W10–W12/W33 — B3/B4/B1. |
| H07 Retained Public submissions | W12 — B4. |
| H08 Admin boot/network/authority | W13–W15 — B5; producer identity W02 — B1. |
| H09 Pause/recovery | W16/W20/W34 — B5/B1. |
| H10 Treasury | W17–W20/W34/W35 — B5/B1. |
| H11 Pairs | W21–W24/W34 — B6/B1; SDK seam E2 retained. |
| H12 Admin Drops | W25–W27/W32 — B6/B2. |
| H13 Checklist/Health/catalogue | W21/W27–W29/W36 — B6/B7. |
| H14 Authoring/provider | W30/W32 — B2; immutable consumer W25 — B6. |
| H15 Writer/projection/archive/recovery | W31/W32 — B2; package consumers W39 — B7. |
| H16 Direct contracts | W33–W35 — B1. |
| H17 Build/delivery/dev | W03/W04/W30/W32/W39 — B7/B2. |
| H18 Assets/CMS | W36/W37, catalogue W21/W28/W29 — B7/B6; exported remote library distinct from registered local CSV. |
| H19 Provisioning CLI | W38 — B7. |
| H20 Contract provenance | W40 — B1; CLI/build/artifact consumers W38/W39 — B7. |

Reconciliation found no new consequential unexamined source workflow requiring
another batch. It closed recorded deferred execution below, made B1's ignored
provenance script exportable, and separated current conclusions from historical
PARTIAL/NOT EXAMINED/deferral snapshots. E1 ABI evidence is now freshly executed;
E2 live/alternative-transport unknowns remain qualified rather than invented
tests. Existing accepted external-edit limits and prior correction evidence
remain preserved. Related observations are consolidated as specified in the
final findings; no duplicate root is added for a new surface or consumer.

### Final verification and limitations

All final successful commands below exited 0. Native exits, not PowerShell's
formatting of stderr warnings, determine outcomes. Public/supporting/Admin each
ran once on unchanged source. Only sandbox-blocked process checks and a failed
build-probe setup were retried for the identified reasons below.

| Actual command / scope | Final outcome and evidence meaning |
| --- | --- |
| Outer `node --test --experimental-vm-modules --experimental-test-isolation=none shared/fa2-balances.test.mjs shared/beacon-setup.test.mjs shared/public-trade-freshness.test.mjs shared/public-trade-outcomes.test.mjs shared/public-trade-pairs.test.mjs shared/public-confirmation-deadline.test.mjs drops/js/trade-lifecycle.test.mjs exchange/js/exchange-wallet.test.mjs` | **298 PASS**, no failures/skips/TODOs. |
| Outer `node --test --experimental-vm-modules --experimental-test-isolation=none shared/drop-time.test.mjs shared/drop-countdown.test.mjs drops/js/countdown.test.mjs drops/js/countdown-lifecycle.test.mjs shared/chain-registry.test.mjs shared/hen-identity.test.mjs drops/js/drop-compatibility.test.mjs drops/js/token-rendering.test.mjs drops/js/reveal-coordinator.test.mjs drops/js/wallet-rendering.test.mjs drops/js/burn-quantity.test.mjs loaders/loader-architecture.test.mjs scripts/verify-pages-loader-artifacts.test.mjs scripts/shadownet-exchange-pairs.test.mjs scripts/public-navigation.test.mjs scripts/parcel-source-map-sources.test.mjs scripts/mainnet-runbook.test.mjs` | **134 PASS**, no failures/skips/TODOs. Includes current navigation, configuration, first-paint/reveal/loader/graph and signer inert regressions. |
| Admin `npm run test:runtime` | **2,204 PASS**, no failures/skips/TODOs; current full runtime infrastructure, including prior correction regressions. |
| Outer `npm run test:drop-params:lock` | **17 PASS**. Initial sandbox result 16 pass/one child `EPERM`; permitted local-process rerun passes. |
| Outer `node audits/repro/AUD-004-config-suite.mjs` | Disposable authoring/transaction/service/projection/watcher suites: **25/19/10/90/1 PASS** respectively, no failures/skips/TODOs. Nested TAP is not counted twice. Initial sandbox child-launch failure resolved with permitted process access; actual operational state untouched. |
| Outer `npm run test:thumbs` | **27/27 PASS** on the one legitimate permitted child-process execution. Resolves B7's exact 17-pass/10-unverified restriction, including independent-process ordering/interruption/recovery. Source and test expectations unchanged. |
| Admin `npm run test:thumbs`; `npm run check:thumbs` | **37 PASS**; read-only manifest freshness: **9 contracts / 133 references / 67 assets**. No real asset regeneration. |
| Outer `npm run test:webflow-cms` | **39 PASS**, no failures/skips/TODOs; injected inert transport only. |
| Outer `node --experimental-vm-modules audits/repro/<name>.mjs`, separately for `AUD-011-admin-custody-repro`, `AUD-011-admin-orchestration-repro`, `AUD-011-config-propagation-repro`, `AUD-011-contract-abi-check`, `AUD-011-delivery-tooling-repro`, `AUD-011-public-observations-repro`, `AUD-011-public-operations-repro`, `AUD-011-sdk-account-binding-repro` | **All eight PASS** with their positive/negative controls. Config reproduction's initial sandbox failure occurred only at the real child lock; `node audits/repro/AUD-011-config-propagation-repro.mjs` with permitted access completes all five assertions/controls. Passing defect assertions do not mean clean source. |
| Outer `node audits/repro/AUD-011-contract-provenance-check.mjs`; `node audits/repro/AUD-004-contract-provenance-check.mjs` | **PASS**: 31 exact checkout/HEAD manifest identities, source/snapshot/mechanical fixture, freeze/promotion/archive correspondence, eight event types and nat/int mutation rejection; resolver/mirror/duplicate-term controls. Ignored B1 script copied exactly to the first exportable entrypoint. Initial Node→Git `EPERM` resolved with read-only permitted subprocess access. ABI script above decodes six actual Admin writes and both Public builders, including huge naturals. No Michelson/native execution. |
| Outer `python -B 'docs/EA-XYZ Contract Audit/tests/verify-invariant-coverage.py'` | **PASS**, 26 invariants / 181 mapped obligations / 13 scenarios; mapping integrity only. Initial temporary runner's quoted filename failed before executing Python; corrected direct command succeeds. |
| Disposable Outer `npm run build:pages:staging`; disposable Admin `npm run build:clean` | **Both PASS**, using current tracked file bytes and installed-dependency junctions, excluding untracked operational state. Source→JSON unchanged; Admin mirror/thumb guards, prune (4 development chunks) and isolation (8 production files) pass. Original outputs/caches/metadata unchanged. Existing Browserslist-age/bundle-size notices only. |
| Existing `scripts/verify-{home,drops}-first-paint-build.mjs` assertions over fresh disposable staging output | **PASS**, staging-only probes: exact early graph, forbidden Beacon/trade graph controls, positive main-bundle Beacon controls and relative size. Verification-copy changes only scope variants to staging and spell the known junction-resolved Parcel helper source as `../../../node_modules/...` after exact realpath identity check. Initial literal-path mismatch was a probe setup failure, corrected before rerun; source maps and production scripts were not altered. No fresh prod compilation or both-variant/deployed graph claim. |
| `node --check` for all nine AUD-011 evidence files; PowerShell AST parse of exporter; Markdown link/checklist/history checks; both repositories' `git diff --check` | **PASS**. Final export/content and Git-preservation checks are described below. |

Live wallet/chain/FA2/SDK transport, Webflow/CMS/custom code, time/indexer/RPC/
GitHub truth, browser layout/storage/Web Locks timing, signer execution/finality,
current hosted/deployed identity and actual Linux CI/remote branch assembly
remain **unverified integrations**. No manual UI/dev server, prod Pages build,
live smoke, legacy SmartPy compile/scenario execution or Octez typecheck ran.
No operational action, external write, transaction, production remediation or
Git integration occurred. The accepted AUD-005-001 unsupported-external-edit
limitation remains unchanged and is not reopened by supported-writer B2 findings.
These external stops constrain a COMPLETE source investigation; they do not
establish deployment readiness. Fifteen material findings preclude CLEAN.

### Review export and preservation

Outer exports are `ticket.AUD-011-full-correctness-review.outer.diff` and
`ticket.AUD-011-full-correctness-review.outer.stat.txt` at the Outer root.
Admin exports are `ticket.AUD-011-full-correctness-review.admin.diff` and
`ticket.AUD-011-full-correctness-review.admin.stat.txt` at the Admin root;
Admin remains unchanged and its exports are empty. Each is generated separately
with `npm run ticket:diff`, without staging or modifying either real index.
The exported file set and Git-normalized blob bytes are checked against actual
tracked modifications and every intended untracked file; all nine AUD-011
entrypoints and the complete findings document are included. Historical audit
text is retained, and prior evidence hashes match their starting values.
Task-created disposable copies/probes/logs are removed after bounded-path checks;
pre-existing work evidence and operational state remain. Final status is Outer
audit-only modifications/untracked evidence, clean Admin, unchanged HEADs,
indexes and branches; no commit/merge/push/deployment or merge approval.

## Historical AUD-011 batch checkpoints

The seven batch and initial planning records below retain their original
time-local statuses, counts and deferred statements. The final reconciliation
above supersedes their AUD-011 PARTIAL/next-batch language and resolves the
thumbnail execution restriction; it does not rewrite earlier evidence.

## AUD-011 — Batch 7 examination (2026-11-25)

**B7 COMPLETE within bounded source/inert examination; AUD-011 remains PARTIAL.**
All four prescribed slices, **W03/W04/W36–W39**, are source-examined. No new
material finding was established; **15 independent provisional findings remain
unresolved**, with all earlier records and scripts preserved. Current bounded
source totals: **40 COMPLETE, 0 PARTIAL, 0 NOT EXAMINED**. This records the last
planned batch, not ticket finalization, a clean result, a coverage refresh or
completion of the deferred execution/integration checks below.

Reviewed source: Outer `2453358c8cf91d4db3bc24e447ed0859f91216e8`; Admin
`d8636e957d3974ba73882d9d29242898f10ed3e0`; both on
`ticket-AUD-011-full-correctness-review`. Initial Outer changes were the expected
modified coverage, untracked findings and seven prior AUD-011 scripts; Admin
was clean. No implementation diff was present. Windows PowerShell, Node
`v22.16.0`, npm `10.4.0`, installed dependencies and current registry/source
configuration were used without installation or upgrade. Public defaults to
testnet/Shadownet; selecting a prod delivery directory does not select Mainnet.
No remote branch, current deployment, live Webflow document or provider was read.

**Declared boundary:** all asset intake/backfill/manifest entries and their
catalogue consumers; exported CMS capability with reachability distinguished;
signer CLI dry-run/verify/execute source through exact readback and retry;
Public local shells/inline code/first paint/routers and Pages build graph;
Admin production/dev packaging, local dev/harness helpers and review exporter.
Expected properties derive from project intent: exact token/target/source
identity, truthful actionable outcomes, independent page availability, owned
file writes and recoverable failures. Forward traces start at package/CLI/
launcher/module/DOM entries. Reverse traces account for thumbnail/manifest/
archive/review/report writes, CMS request capabilities, signer send, revealed
page state, build inputs and release/export outputs. Boundary traces follow
filename → token key → contract manifest → consumer, source/ref → router →
loader → bundle, source → mirror → production provider, and pinned ABI → RPC
snapshot → signer/payload → outcome/readback. External effects remain inert.

| Completed scope | Examination and consequential boundaries |
| --- | --- |
| **W36 / slice 1: thumbnail intake/backfill/manifest.** Complete `assets/thumbs/scripts/thumbs.mjs`, both `RUN_*.cmd`, Admin `scripts/{gen-thumbs-manifest,thumbs-manifest-lock}.mjs`; `utils/nft.js` thumb lookup and B6 catalogue/HEN consumers. | CWD-independent launcher paths/exit status; empty/multiple/corrupt/narrow/metadata-bearing input; sequential collection admission, numeric key allocation, output/processed collisions, exclusive file creation and archive copy/unlink; manifest snapshot, capability ownership, generator failure, rollback and uncertain cleanup. Shared canonical-directory lock covers imports and standalone generation, asserts ownership across awaits, never reclaims by PID/age; failed writes/rollback retain recovery evidence. Backfill writes review candidates/report only, preserves masters, removes only managed numeric JPEG candidates, rejects ambiguous/non-numeric/undecodable entries. Standalone manifest admits canonical BigInt IDs, deduplicates numeric prefixes, requires all folders/placeholder and escapes URL segments; read-only checker compares actual local URLs with the current model. Intake uses raw digit prefixes and safe Number allocation, so its “identical” parser comment is inaccurate; generator still rejects canonical duplicate keys before successful archival. Arbitrary-large master IDs are supported by the generator but deliberately block intake allocation. B6 metadata cannot change transaction identity; no HEN ID translation is inferred from filenames. |
| **W37 / slice 2: exported CMS support boundary.** Complete `assets/webflow-cms/webflow-cms.mjs`, package/import/caller search and retirement record. | Only tests import this library in inspected application/tooling source; no registered migration/publisher CLI or application caller was found. Examined authenticated GETs, stable pagination totals/offsets/identity/locale and failure restart; exact staged field patch/item-ID publish requests; asset metadata → presigned bytes → exact hosted hash versus normalized CMS image comparison; timestamps, draft/archive flags, content and unrelated-item comparisons; mutation transport/body/HTTP ambiguity, no automatic mutation retry, redacted atomic writes and callback-owned read-only reconciliation. A successful HTTP response is request evidence, not publication verification. Helpers require a caller to combine site/collection/item/locale/content/publication checks; do not infer a turnkey publishing workflow, recovery journal or remote state from exports. |
| **W38 / slice 3: Shadownet signer provisioning.** Complete `scripts/shadownet-exchange-pairs.mjs`; B1 artifact/contract and B4 confirmation dependencies reused at the direct seam. | Strict exclusive modes/provider admission; dry-run exits before provider/toolkit/RPC; fixed registry/chain/escrow/collection identities and 44 explicit assignments; safe positive terms, pinned promoted artifact hash and ABI round-trip. Verify uses no signer; chain inspection checks RPC URL/chain plus parameter/storage ABI at one numeric level. Execute imports a trusted local provider, compares signer/admin, requires all intended IDs missing and zero other cardinality, compares live method parameters to the reviewed payload and sends zero tez. Confirmation failure/unknown stops before success; fresh inspection/readback requires all exact six-term records and no extra count. Occupied/partial/different records block replay rather than overwrite. Code-body identity is **not** checked by live ABI admission (controlled altered-code fixture accepted); B1 provenance is local evidence only. Provider behavior, pending-operation ambiguity and retry/reorg limits are explicit in the findings ledger. No actual CLI verify/execute or provider import ran. |
| **W03 / slice 4: Public delivery/startup.** All four root routers, all environment loaders, six `webflow/` entries, shared first paint and direct boot/reveal consumers. | Exact production host allowlist versus staging fallback, module-relative imports, independent early/app loads and sync/async rejection diagnostics. Normal ESM URL caching and global first-paint/wallet/page boot guards bound repeat initialization; explicitly exported start functions can initiate imports again and are not a retry/recovery UI. DOM-present/late, fonts missing/rejected/stalled, cached/broken/decode-stalled hero, RAF stall and 1300ms fail-open were traced. Shared first paint is wallet-independent; main bundles provide its fallback when an early bundle fails. If neither runtime loads, no module-owned fallback can execute; local artifacts cannot establish live CSS, embedding or recovery. Drops pending regions independently require parameters/countdown/metadata/supply; image and wallet projections have distinct publication owners. B3 observation findings are retained, not re-examined as resolved. |
| **W04 / slice 4: Home/Utility availability/navigation.** All four local shells' module/anchor registration, common marquee inline script, Utility inline SVG flow and `collection-utility/js/main.js`. | Root-relative Public routes versus external market links, retained wallet anchors, “coming soon” presentation versus supported actions. Home has first paint plus wallet only; Utility image spinners handle cached good/broken and later load/error independently of wallet observation. Missing image/spinner hooks are tolerated; never-settling image loads have no local image timeout. Inline marquee replaces only generated tracks and rebuilds on font-ready/debounced resize; SVG redraw requires exact stage/card/path hooks and responds to resize/orientation/observer without a transaction path. Local shells are dev/harness inputs, not Pages-hosted HTML or proof of current Webflow markup. Responsive visual geometry and actual asset retrieval remain unverified. |
| **W39 / slice 4: build/delivery/dev/export.** Both package manifests, `.github/workflows/pages.yml`, all loader/first-paint verifiers, Admin mirror guard/prune/isolation, dev/port/source-map/harness/optimization helpers and exporter. | Separate main/prod and staging/staging checkouts/install/builds, generated JSON freshness gate, main-owned permanent routers/prod loaders and staging-owned staging loaders; missing/empty/drifted references fail before upload, maps removed/asserted absent before verification. Verifier compares supplied owner outputs/markers, not source compilation or deployed bytes. Admin build checks thumbs, syncs/guards mirror, builds, prunes authoring chunks then checks forbidden runtime markers; dev starts watchers/service/frontend fail-fast and enables local provider only outside production on loopback hostnames. No Admin deployment definition was found. Local harness strips app scripts, preserves Webflow scripts/inline content and writes separate direct/loader-chain fixtures; refuses unknown legacy cleanup content. Port check diagnoses without killing an owner; image optimizers have fixed local inputs/outputs and no runtime registration. Exporter source traces invoking-repo/branch/path/ignore guards, private index/object store, lock, invalidation of old pairs, Git/copy failure and bounded finally cleanup. Export execution is explicitly deferred. |

### B7 verification and limitations

- Outer `node --test --experimental-test-isolation=none --test-reporter=dot loaders/loader-architecture.test.mjs scripts/public-navigation.test.mjs drops/js/reveal-coordinator.test.mjs scripts/verify-pages-loader-artifacts.test.mjs scripts/parcel-source-map-sources.test.mjs scripts/shadownet-exchange-pairs.test.mjs` — **PASS**, exit 0 (19 native test cases plus the four assertion-driven suites). Synthetic bundle markers are not fresh build outputs.
- Outer `node assets/webflow-cms/webflow-cms.test.mjs` — **39/39 PASS**, exit 0. All transport/upload/publication requests are injected inert functions.
- Outer `node assets/thumbs/scripts/thumbs.test.mjs` — **17 PASS, 10 blocked/fail**, exit 1. Every failed case reports `spawn EPERM` at the child-process fixture. Same-process conversion/import/generator/rollback/ownership checks passed. Independent-process generator/import ordering, interrupted-owner execution and crash recovery execution are **DEFERRED by capability**; their source/lock/recovery paths were examined, but cross-process behavior was not functionally established. Diagnosed once; no escalation or redundant retry.
- Admin `node --test --experimental-test-isolation=none --test-reporter=dot tests/gen-thumbs-manifest.test.mjs` and `npm run check:thumbs` — **PASS**, exit 0. Current read-only manifest check: 9 contracts, 133 references, 67 assets. Freshness/readability does not decode every real image or verify visual identity.
- Outer `node audits/repro/AUD-011-delivery-tooling-repro.mjs` — **PASS**, repeated after adding negative controls. Actual first-paint and Utility bodies; actual signer `run` body with only local provider import replaced, real encoder/inspection/readback/poller with inert RPC/fetch/send; actual production prune/isolation in disposable directories. Timeout branch uses an injected rejecting poller and reuses B4's deadline evidence; no 120-second live poll or signer ran. Includes ABI-versus-code and thumbnail parser boundary controls.
- `node --check audits/repro/AUD-011-delivery-tooling-repro.mjs`, focused JS syntax checks, PowerShell AST parse of `admin-ui/scripts/export-ticket-diff.ps1`, focused diff/whitespace checks in both repositories — **PASS**. The exporter was parsed/read, never invoked.

B1 local artifact/provenance/direct pair semantics, B2 immutable source/mirror
admission and unresolved provider findings, B3/B4 Public state/confirmation,
and B6 catalogue/CMS-CSV/readiness evidence were reconciled only at these
consumers. Exported remote CMS tooling is distinct from B6's registered local
CSV validator. Pages artifact equality does not date GitHub checklist reads or
establish publication; production static mirroring does not repair B2 defects.

No additional B7 source slice is outstanding. Deferred evidence remains:
the ten restricted child-process checks; fresh broad builds and emitted-graph
verification; Windows launcher UI/dev process lifecycle and real browser/layout/
storage timing; live Webflow/CMS, provider/FA2/chain/signer/finality and deployed
code/artifact identity. None is credited as performed. Builds, `ticket:diff`,
final finding/checklist reconciliation and broad final verification remain
deferred to separately authorized AUD-011 finalization. No clean-result refresh,
remediation, operational change, remote write, Git integration or deployment.
Only the two Outer audit records and the new B7 evidence script change in B7;
Admin remains clean. Branches/HEADs/index entries, earlier evidence, generated
projections, assets, locks/journals and runtime contracts are preserved.

## AUD-011 — Batch 6 examination (2026-11-25)

**B6 COMPLETE / WITH FINDINGS within source/inert boundaries; AUD-011 PARTIAL.**
All four prescribed slices, **W21–W29**, are examined. Source remains Outer
`2453358c8cf91d4db3bc24e447ed0859f91216e8` and Admin
`d8636e957d3974ba73882d9d29242898f10ed3e0`, both on
`ticket-AUD-011-full-correctness-review`. Initial Outer state contained the
expected modified coverage, untracked findings and six prior reproductions;
Admin was clean. Windows/Node `v22.16.0`, installed dependencies, current
testnet/Shadownet registry and immutable SPLINTERED snapshot are assumed.
Mainnet remains incomplete. Prior evidence is preserved unchanged. E1/E2 and
B1/B2/B4/B5 are reused only at direct consumers; no new ABI, native contract,
SDK account-binding, supported-writer or custody investigation was performed.

**Pre-examination boundary and obligations:** complete pair catalogue/pagination/
availability and manual create/edit/cleanup on both registered surfaces; immutable
params through normalization, translation, all preview entries and caching,
with dormant exports assessed separately; every chunk's send/status/partial/
recovery path; Health circulation and CMS/CSV caches through checklist, GitHub,
countdown and event consumers. Completion requires exact identities/amounts,
current-plan equality, stale request ownership, ambiguity, negative paths,
pagination completeness and truthful actionable state. Stop at real browser,
wallet transport/signing, external provider truth and native chain/FA2 effects.
B7 asset generation/tooling/delivery is excluded; metadata consumers alone are
included. No production fix, broad suite/build or remote operation is authorized.

Expected properties derive from project intent and B1's exact contract/Public
consumer rules: a current operator plan owns its input and publication; all
six pair terms remain exact and unambiguous; partial/unavailable observations
cannot authorize a full plan; a later chunk failure cannot undo earlier applied
effects or hide them behind old readiness; an in-flight destructive action owns
its request; source-file equality and local CSV checks do not certify deployment.
Forward traces followed initialization, input/Auto/Reset/load/submit/edit/delete,
manual Health/CSV/GitHub actions and background polls. Reverse traces accounted
for each pair write, cached Send plan, readiness dot/count and confirmed/final
event. Boundary traces followed canonical → immutable provider → normalized
native IDs/amounts → cached preview → serialized per-chunk request → attributed
result → pair classifier/checklist, and external catalogue/holder/CSV/branch
observations → caches → consumers. No inference from passing historical tests
replaced that source examination.

| Completed scope / source boundary | Examined consequential branches and evidence |
| --- | --- |
| **W21 pair read/catalogue/availability.** `admin-ui/src/tzkt-api.js:114–315`; complete `features/pairs/pairs.data.js`, `setpanel.{controller,validators,view}.js`, `adapters/{collection-catalog,chain-ui}.js`; title/thumb/`utils/{nft,cache,hen-ids}.js` consumers. | Named-route first-page fallback versus failed continuation; complete short page, item/page caps, advancing row IDs, repeated/invalid/malformed/HTTP/body evidence; exact native IDs, active-only lookup and unknown availability. Range filtering and exact selected IDs are distinct from presentation sorting. Local-title picker eligibility and HEN canonical/native conversion do not rely on remote names. Table render generations fence late successes/errors; old cached catalogue survives a failed read but cannot establish successful Health coverage. Availability debounce/pending gates and final duplicate checks fail closed. Manual Set Auto lacks an owner after its network await (**B6-001**, both surfaces); newer Reset/edit can be overwritten. Stalled pair preflight extends **B5-001**. |
| **W22 manual create.** Complete `pairs.controller.js` submit; `exchange-pairs.js` target/range/locked-side/build/set exports and submit; `escrow-ops.js:33–146,349–420`; complete `pair-compatibility.js`. | Drops targets its captured escrow; Exchange is explicit testnet-only, forbids fallback, fixes ACID COIN #0, validates ranges and accepts exact natural text/positive amount terms. Manual Drops converts picker token IDs to Number, so unsafe numeric IDs are rejected downstream rather than silently serialized; arbitrary large native text remains supported by other exact helper paths. Per-panel pending ownership covers preflight/send/confirmation, independent of other wallet events. Complete current mapping rejects occupied IDs, duplicate proposed IDs/terms, ambiguous existing terms and unreadable rows. Distinct amounts are distinct terms. Direct helper calls capture authority; SDK binding retains E2's limitation. Preflight is not contract-level tuple uniqueness or a snapshot lock. |
| **W23 manual edit.** Complete `pairs/modal/{modal.context,modal.controller,modal.validators,modal.view.content,modal.view.widgets,modal.view.shell}.js` and facade; both parent callbacks; `updateExchangeTokenPair` and `updateTokenPair`. | Select/custom contracts and token zero, missing stored identities, preserved large token text, positive amount/change baselines, direct-handler validation, duplicate-term guard, submitted target/entrypoint metadata, complete-operation confirmation and captured-parent refresh. Save owns its session across wallet/wait/refresh; dismiss/reopen, stale refresh success/failure and current invalid/no-change/retry paths were traced. Exchange edit applies its locked-side validation even though the generic modal can display other options. Optional pending custom-resolver population can corrupt a newer session in a controlled exported-hook case, but shipped resolver is local-only: **qualified capability limitation, not an active timing finding**. |
| **W24 cleanup.** `pairs.controller.js:704–748`, complete `pairs.view.table.js`, `escrow-ops.js:322–343,108–146`; B1 direct cleanup semantics reused. | Exact selected string IDs, invalid/unsafe values, empty list, duplicates, current authority/target, rejected/unknown/applied confirmation and refresh/final events. No Exchange cleanup registration. Missing/deleted IDs are contract no-op deletion failures; `applied` is operation evidence, not per-ID event accounting. Actual Delete remains enabled and has no submit owner: two clicks request identical cleanup before first confirmation (**B6-003**). No durable unresolved pair exclusion exists; no native or remote cleanup was performed. |
| **W25 active immutable plan and dormant exports, separately.** Complete `features/drops/drops.{controller,data,builder,load.service,state,time-cache,ui.sync,public-state,view.panel,view.preview}.js`, input/view signatures and translation audit; provider/writer admissions reused from B2. | Deep-frozen source ownership; initial/Auto/manual/committed-input/Reset/provider-unready/network epochs; no-source/unscheduled/error/empty/resolution failures; named-zone instant caching; canonical exclusion versus native mirror ID, exhausted/malformed/duplicate translation, exact zero/huge text, safe positive quantities/start range/chunk inputs; cached terms versus rebuilt current terms/collection addresses. Late enrichment/overlap/build/status cannot replace newer load ownership. Auto's first-free/aligned window may conservatively conflict rather than search another block; it does not authorize overlaps. Explicit pairs/multi-burn/fallback are exported normalizer capabilities; canonical supported writer requires one enabled burn collection. `loadParams`/`parse` have no registered caller: source-reviewed JSON/CJS/default-export evaluation, file limit and HTTP/type/body/error behavior, including URL reader's lack of HTTP-status check/deadline. No untrusted script or real URL was executed; these exports do not establish a shipped upload UI. |
| **W26 chunk orchestration/outcomes/recovery.** Complete `drops.send.service.js`, current cached-send validator, public state/view, `escrow-ops.js` pair path and legacy confirmation adapter; complete `drops.status.service.js`. | Before every request: current source/preview/signatures, target/network/indexer/collections, authority, pause and exact full-plan equality. Safe native IDs/amounts retained through sequential chunk slicing; only attributed complete applied evidence advances. No hash, rejected request, unconfirmed/failed result, account/provider/Reset replacement, late receipt and post-send status/checklist continuation examined separately. Original run retains memory receipts even after UI invalidation; obsolete owner cannot finalize a newer send. Catch after earlier application skips readiness retirement/final events (**B6-002**). Normal unconfirmed path stops/locks; success refreshes independent checklist and mapping state. No durable pair journal/resume or reload receipt restoration exists; normal partial status requires manual cleanup/repreview, not an automatic replay of remaining chunks. |
| **W27 pair/readiness/classifier/checklist/countdown/GitHub.** Complete `drops.{pairs.status,status.service,checklist.controller,countdown.service,view.checklist}.js`; public state/view and shared countdown/time direct consumers (shared producer examination reused from B3). | Six exact terms compared across complete active mapping, including unsafe-text IDs outside numeric alignment/range; duplicates → conflict; no shape → missing; invalid translation/read failure → verification required. Best contiguous alignment intentionally ignores preview start identity because Public trades resolve by unique terms. Independent request/config epochs prevent old evaluations overwriting new; final pair events retire readiness before refetch. Checklist token existence/supply, planned versus remaining quantity, zero/unknown/unsafe balances, pre/standby/live/paused/depleted states; current surface/network/escrow transfer and pause events, provider replacement and visibility refresh. Expiry only enters standby; HTTP storage success and boolean false establish initial live phase, never unpause automatically. Ongoing pause is separate checklist evidence, not continuing countdown certification. GitHub stable parsed equality, staging/main serial reads, force/throttle/in-flight/error/epoch/poll branches examined: unknown stays neutral; source equality is not deployment. Held fetch/body after replacement strands manual Refresh (**B5-001 extension**) while stale writes remain fenced. |
| **W28 chain/local metadata health/economics.** Complete `health.controller.js`, catalogue and NFT/cache dependencies; `utils/token-econ.js`. | Initial/manual/network entries, single-run ownership, all-collection coverage and any-failure aggregation; complete catalogue pages and later-page/error/malformed/repeated/unsafe evidence. Local-only title/thumb identity and HEN mirror lookup; UI placeholders and metadata cannot alter payload terms. Circulation uses native contract/token/holder attribution, ordered cursor pages, complete short-page evidence/caps, fetch+body deadlines, canonical sink exclusion, exact safe balances/sums and unknown versus zero. Cache network/contract/TTL/in-flight ownership, forced refresh bypass, stale failure/success and immutable comparison-owned snapshot examined. Source-selected real network switching reloads (B5); synthetic consumer events are not proof of an in-page production switch. Indexer honesty/snapshot consistency remain external. |
| **W29 local CMS CSV/persistence/readiness.** Complete `health.cms.js`, `utils/{parse-csv,cms-store,hen-ids,token-econ}.js`, Health summary and checklist listeners. | Choose/cancel/read error/load/reload/recheck/clear, row versions before queued awaits, list/network replacement and stale FileReader/comparator completions; stored CSV is network/collection scoped. Tolerant parser plus strict active admission covers quotes/columns/headers/BOM, duplicate live identities, archived/draft exclusions, missing titles/tokens, known-empty tables, canonical/native mirror coverage, collection/title normalization, thumbs and editions/ACID comparisons. CANAAN requires explicit positive ACID. Malformed/unknown/partial holder evidence revokes CMS readiness, force checks use fresh single owned economics snapshot; per-label failures propagate to all-required-label checklist. Persistent storage failures do not certify durability; a CSV check is not remote CMS verification. |

Verification on those revisions:

- **668 selected checks PASS**, exit 0: pair sources **252**, Drops previews/status/
  countdown/checklist **250**, Health/CMS **128**, selected chunk/equality/outcome
  cases **38**. Exact four Admin invocations are retained in the
  [B6 findings/evidence ledger](AUD-011-findings.md#b6-rejected-hypotheses-supported-limits-and-verification).
  Tests ran in process; no full runtime suite, broad build or unchanged blocked
  command was run. Passing checks establish only their exercised cases.
- Outer `node audits/repro/AUD-011-admin-orchestration-repro.mjs` — PASS,
  repeatable. Actual registered Auto handlers, chunk sender and Send view,
  cleanup table/controller/serializer, both create owners and GitHub checklist
  click continuation; inert external boundaries and valid/eventual-response
  controls. The custom modal hook case is explicitly qualified, not promoted.
- `node --check audits/repro/AUD-011-admin-orchestration-repro.mjs`, focused
  diff inspection and `git diff --check` in both repositories — PASS.

**Current totals: 40 scopes: 34 COMPLETE (bounded source), 0 PARTIAL,
6 NOT EXAMINED.** Three new confirmed source findings have provisional P2
assessments; B5-001 gains B6 read-owner evidence. All twelve earlier independent
findings and reproductions remain unresolved/preserved: **15 independent
provisional findings**. No consequential B6 source obligation remains
unexamined under these boundaries; no capability restriction blocked an inert
functional check. Wallet approval/transport and actual signer, chain/FA2
execution/finality, provider snapshot truth, real browser storage/locks/timing,
live time/GitHub/Webflow/CMS and deployed code remain unverified integrations.

Only Outer `audits/coverage.md`, `audits/AUD-011-findings.md` and new
`audits/repro/AUD-011-admin-orchestration-repro.mjs` changed during B6. Admin
remains clean. Both branches/HEADs/indexes, prior evidence, generated projections,
network/wallet/DOM/event/runtime contracts and operational state are preserved.
**Remaining B7: W03/W04/W36–W39**, with the original asset launcher/manifest,
exported CMS capability, signer provisioning and public/Admin delivery/tooling
slices. B7 was not started. No remediation/checklist change, full-pass
finalization, clean-result refresh, export, Git integration, deployment,
transaction or remote write occurred; `ticket:diff` stays deferred until final
AUD-011 completion.

## AUD-011 — Batch 5 examination (2026-11-25)

**B5 COMPLETE / WITH FINDINGS within source/inert boundaries; AUD-011 PARTIAL.**
All four prescribed slices, **W13–W20**, are examined. Source remains Outer
`2453358c8cf91d4db3bc24e447ed0859f91216e8` and Admin
`d8636e957d3974ba73882d9d29242898f10ed3e0`, both on
`ticket-AUD-011-full-correctness-review`. Initial Outer state was the expected
modified coverage and six untracked prior findings/reproduction files; Admin
was clean. Node `v22.16.0`, installed Beacon SDK 4.8.1 and the registry's
testnet/Shadownet targets are the assumptions. Mainnet remains incomplete.
E1/B1 identities, ABI, direct contract effects and E2's established authority
seam are reused only at their direct consumers; no historical audit credit,
new ABI execution or repeated A-intent/B-request investigation is claimed.

**Pre-examination boundary and outstanding obligations:** B5 assigns the
unexamined Admin wallet/network/surface/indicator branches; both pause instances
through storage refresh and durable recovery; both treasury inventories/MAX and
XTZ submissions; FA2 selection/batch sends and shared reconciliation. Completion
requires the actual registered Drops and Exchange targets, independent owners,
all consequential error/unknown/late/reload/contention branches and exported
alternative helpers, without assuming E2 completed the controllers. Stop at SDK
transport/signing, native chain/FA2 execution, provider truth and real browser
storage/locks. B6 pair/Drops orchestration/readiness and B7 delivery/tooling are
excluded, except the immediate event/configuration consumers needed here.

Expected properties derive from project intent: current account/network/target
owns each action and publication; identities and integer quantities survive
selection/serialization; unknown inventory is distinct from zero; a hash is not
application; complete terminal evidence and current journal identity govern
recovery; one tab's old state cannot erase another's unresolved work. A stalled
non-wallet read must not permanently own an otherwise recoverable action.
Forward examination followed startup, permission/disconnect/account callbacks,
selectors, click/submit, manual/queued refresh and recovery. Reverse examination
accounted for every pause/withdraw/FA2 request, reservation/settlement, balance/MAX,
admin/pause indication and submitted/confirmed event. Boundary examination
followed observed SDK identity → authority → locked reservation/request; raw
inventory → off-DOM rows/selection → exact Micheline; operation evidence →
durable ID → readback/status/event; and per-tab memory ↔ shared storage/locks.

| Completed scope / source boundary | Examined consequential branches and evidence |
| --- | --- |
| **W13 wallet/authority.** Complete `admin-ui/src/beacon-setup.js`, `utils/wallet.js`; remaining `escrow-ops.js:33–104` consumers, using recorded E2. | Constructor/reuse and version-scoped legacy transport cleanup; missing/malformed/future metadata and storage denial; ID/fallback wiring, DOM-ready/boot ownership, persisted null/valid/wrong-network/error, cleanup success/failure and delayed 100ms display. Permissions may adopt an initially unconnected intent; changed account/read/key/null/network/disconnect retires it, same-key events preserve it and A→B→A cannot revive it. Explicit disconnect invalidates before its await, but its late publication can hide newer B (**B3-001 Admin extension**). SDK operation binding, real transport/follower/reconnect paths and signer outcomes retain E2's qualifications. No operation-binding proof was rerun. |
| **W14 network/surface.** Complete `src/network.js`, `admin.js` selector/switcher/initializers; `utils/live-cfg.js` at target boundary. | Supported/default/legacy/invalid persisted slot, debug-only override, same-slot no-op, clear capability/failure, persist failure, reload capability/order and selector error restoration. Actual switching is clear → persist → reload; it does **not** emit `network:change`. Synthetic event tests therefore establish defensive invalidation, not the actual reload lifecycle. Both surface instances stay initialized when hidden; switching changes visibility/ARIA and closes the Drops-owned modal, without retargeting a send or cancelling a valid hidden controller. Exchange rejects missing/malformed/legacy fallback targets; default root remains Drops. Mainnet is not enabled. |
| **W15 indication/read-only status.** Complete `features/admin-indicator.js`, `exchange-status.js`, `utils/poll.js`; `exchange-custody.js` is inert. | Admin poll coalescing, failure/unknown/retry, final verified-wallet comparison, account/context invalidation and late/unload suppression. Successful admin cache is root/Drops scoped, as documented in current ownership notes; B1 source has no admin mutation entrypoint. Global indicator is not Exchange authorization. Exchange status has explicit independent target, native disabled Refresh during a read, no wallet/send, true/false/unknown and read-error/unconfigured presentation. `Read OK` reports a completed request, not schema certification; malformed paused stays Unknown. There is no current source emitter of `network:change`; hypothetical concurrent event-driven status reads are an exported defensive boundary, not a demonstrated current UI race. No periodic Exchange-status freshness promise is inferred. |
| **W16 both pause instances.** Complete `features/pause.js` and direct pause helper/recovery; `admin.js:50–66`. | Target and publication/context owners; pending from first await, duplicate click, cached/uncached storage, strict boolean validation, admin/nonadmin/disconnected render, account/network/target changes and refreshes around every await. Unknown/error emits null although the local fallback badge is conservatively Paused. E1 Unit/zero-tez payload and B1 admin-only non-idempotent toggle effects reused. Hash/rejection/no-hash/late-hash, complete applied/failed operation, current settlement, final storage success/error/supersession and retry examined. Storage boolean alone never settles an uncertain toggle, and unchanged boolean does not refute complete applied evidence. Final-read stall retains pending even after successful replacement refresh (**B5-001**). Drops emits document/global mirror; Exchange emits panel-local without global mirror. |
| **W17 both inventory/MAX paths.** Complete treasury `orchestrate.js`, `context.js`, `treasury.config.js`, `lifecycle.js`, `fetchers.js`, `table.render.js`, both controllers' read/refresh branches; `tzkt-api.js` `j/getStorage/getFa2Balances`. | Independent surface/state/promise ownership; storage prerequisite and complete FA2 cursor pages; missing target, empty versus unavailable, exact large textual native IDs/balances and duplicate/malformed/partial/cap failures. Shared reader contract reused from B3, Admin nonzero adapter independently checked. Off-DOM hydration and single current publication, older/newer manual/queued/initial refreshes, metadata failure fallback and stale errors, context departure/return and lifecycle cleanup. Catalogue/adapter token lookup affects labels/images only, never row contract/ID/max; its awaited shallow-enumeration dependency has no deadline. MAX separately invalidates before reading; exact BigInt mutez formatting, known zero, malformed/HTTP/body/wallet failures, final wallet/context and click-time revalidation, stale request/click and node replacement. Legacy Number fetch/formatter exports have no current caller; MAX does not use them. A newer refresh cannot release a transfer awaiting the old state promise (**B5-001**). |
| **W18 both XTZ withdrawals.** Complete `withdraw.controller.js`, `escrow-ops.js:175–185`, treasury status/recovery consumers. | Full decimal representation, ≤6 fractional places, whitespace trim, one mutez/zero/negative/exponent/fraction/huge text; exact BigInt conversion with no silent rounding. Input validity and safe MAX are independent; submit intentionally relies on on-chain balance/admin authorization, not cached MAX as a spend lease. Captured amount survives edits and awaits; pending/context/authority guards, rejection/missing/late hash, complete terminal result and balance refresh, input clear/status and retry traced. E1 amount payload/B1 stored-admin destination and insufficient-balance atomic rejection reused. Final balance request/body stall holds busy after settled application (**B5-001**). Protocol mutez range, fees, actual payout and external balance freshness are not established by huge-text serializer tests. |
| **W19 both FA2 transfers and alternatives.** Complete `transfer.controller.js`, `escrow-ops.js:190–269`; row/config/status/event dependencies. | Whole selected batch validated before permissions: trimmed recipient syntax, blank versus entered zero, invalid/fraction/exponent/unsafe quantity, maximum equality/excess; safe input quantities serialize exactly even with large ledger balances. Exact token ID/FA2/recipient and per-row amount captured before wallet awaits; no partial send for one invalid row. One top-level escrow transaction per selected item, shared durable exclusion across transfer/withdraw, complete group results and delayed refreshes. B1 external FA2 rejection/whole-group rollback remains distinct from indexer evidence. Exported single-token/explicit-target and optionless helpers are read as capabilities, with no new registered controller caller; unlike active controllers they do not independently capture authority. Their weaker syntax/zero-spelling/unsafe numeric-input admission is not certified as equivalent UI validation. No successful wrong-identity effect is inferred. |
| **W20 durable recovery/outcomes.** Complete `pause-recovery.js`, treasury `recovery.js`, `recovery-ui.js`, `recovery-status.js`, `status.js`; `escrow-ops.js:413–513` matcher/poller. | Network/escrow-wide cross-account/surface/action exclusion, per-category locks and independent targets; write/readback before send, unavailable lock/storage, malformed JSON/schema/changed scope, quota/readback failure and emergency receipt memory. Ambiguous rejection/hashless/reload never guesses failure; late hashes persist independently of publication. Exact hash/target/entrypoint/count, consecutive unique external counters and optional reveal, internal identity/status accounting, partial/malformed/contradictory evidence, complete applied versus complete terminal failure, whole fetch/body/retry deadline and cancellation were examined. Record-ID/current-owner checks, simultaneous recovery and send, status lanes/input/resize/storage-event synchronization and recovery-event payloads traced. Emergency uncertain memory can shadow a newer durable ID and let old reconciliation erase it (**B5-002**). Recorded account is not independently matched to chain sender; E2's attribution limit remains. |

Direct cross-component boundary: Drops pause events feed
`drops.controller.js:711–749`, `drops.view.panel.js:615–629` and checklist
`:220–231`; transfer submitted/confirmed feed checklist `:627–655` with current
Drops/network/escrow filters. Exchange panel-local pause and `exchange-treasury`
events do not alias those document/default contracts. Recovered transfer events
use saved details only after applied evidence. No rows-updated consumer supplies
operation success. These immediate event contracts were read; B6's complete
readiness/supply/plan orchestration was not begun.

Verification on these unchanged runtime revisions:

- Admin: `node --test --experimental-test-isolation=none --test-reporter=dot` with `tests/runtime/{beacon-wallet-boot-race,beacon-wallet-delayed-state,admin-indicator,pause-pending,pause-recovery,treasury-max,treasury-withdraw-input,treasury-quantity,treasury-submit-invalidation,treasury-refresh-order,treasury-pending-operation,treasury-confirmation,treasury-recovery,legacy-confirmation,fa2-balances}.test.mjs` expanded to fifteen explicit paths in PowerShell — **all selected tests PASS, native exit 0**. No broad runtime suite/build. The legacy helper tests exercise the shared outcome dependency, not B6 pair workflow credit.
- Outer: `node audits/repro/AUD-011-admin-custody-repro.mjs` — **PASS**, including eight held-read cases, Pause/Treasury stale-memory cases with unchanged-persistence controls, four actual two-tab Refresh consumer cases, independent Admin disconnect evidence and network/surface/status controls. `node --check audits/repro/AUD-011-admin-custody-repro.mjs` — **PASS**. Exit 0 asserts the recorded defects, not clean behavior. Current production bodies run through existing inert fixtures; no SDK client, real storage/lock/provider or transaction is used. Harness corrections/limits are recorded in findings.
- Focused diff inspection, `git status --short`, `git diff --stat` and `git diff --check` in both repositories — **PASS**. Untracked findings/evidence also pass `git diff --no-index --check -- NUL` (exit 1 means content differs from NUL; only checkout line-ending advisories). Both index SHA-256 values and all five prior AUD-011 reproduction SHA-256 values match the starting observations. Reconstructed prior coverage/findings text hashes also match after accounting only for current status/checkpoint updates. Builds, broad final verification and `ticket:diff` exports remain deferred by task instruction.

**Current totals: 40 scopes: 25 COMPLETE (bounded source), 4 PARTIAL,
11 NOT EXAMINED.** W13–W20's initial PARTIAL/NOT EXAMINED inventory labels are
superseded by this result; the frozen inventory remains historical evidence.
Two new confirmed failures (**B5-001/B5-002**, provisional P2) and a B3-001 Admin
extension bring the independent unresolved total to **twelve**. No consequential
B5 local-source obligation is left unexamined. No capability restriction blocked
or deferred an otherwise in-scope functional check. Completion is specifically
source/inert examination, with the external boundaries below unverified.

Unverified integrations: real wallet account/permission/prompt/transport/follower/
reconnect scheduling and E2's later SDK-read alternatives; hosted SDK identity;
browser storage durability/eviction, permission transitions, cross-tab event
delivery and Web Locks scheduling; actual HTTP/indexer accuracy and consistency,
native protocol/FA2 effects/finality and current deployed code/storage/custody.
The readback-failure schedule assumes setItem succeeds then getItem throws once;
the fixture establishes that source response, not its browser incidence. Held
reads are controlled unresolved promises with source-proven absent deadlines,
not a measured real-provider timeout. Wallet request waits are not treated as
cancellable non-wallet reads. No live observations or external operations ran.

Only Outer audit records and new
`audits/repro/AUD-011-admin-custody-repro.mjs` change in B5; Admin runtime and
tests remain unchanged. Prior evidence, both HEADs/branches/indexes, generated
configuration and operational state are preserved. **B6–B7 remain outstanding**
at the original boundaries. No fixes, remediation-checklist change, full-pass
finalization, clean-result refresh, export, integration or deployment occurred.

## AUD-011 — Batch 4 examination (2026-11-25)

**B4 COMPLETE / WITH FINDINGS within source/inert boundaries; AUD-011 PARTIAL.**
All three planned slices, **W09/W11/W12**, are examined. Reviewed unchanged Outer
`2453358c8cf91d4db3bc24e447ed0859f91216e8` and Admin
`d8636e957d3974ba73882d9d29242898f10ed3e0`, both on
`ticket-AUD-011-full-correctness-review`. Initial Outer changes were the expected
coverage edit and five untracked prior findings/reproduction files; Admin was
clean. Node `v22.16.0`, installed Beacon SDK 4.8.1, fixed Public
testnet/Shadownet configuration and current source snapshots are the assumptions.
No historical examination credit, ABI rerun or repeated Admin binding proof.

**Pre-examination boundary and obligations:** the seven-batch plan assigns B4
both handler→unique six-term pair/operator→approval/trade construction/final
authority paths; durable reservation/Web Locks/send rejection/no-hash/late-hash;
and complete-operation confirmation/reload/status retry/refreshed holdings.
B1 contract/identity and B3 observation/cart contracts are dependency facts, not
reopened batches. Follow their direct consumers, including producer/public term
comparison, through SDK dispatch and retained recovery. Stop at live signing,
chain finality, external FA2/indexer truth and browser storage/lock scheduling.
Admin producer comparison is a narrow dependency; B5/B6 controller examination
and B7 delivery/provisioning remain outside this batch.

Expected properties are independently grounded in project intent: current wallet
and network must authorize the actual request; token IDs, amounts, owner,
operator, escrow and recipient must retain exact meaning; partial/uncertain
evidence must not become success or permission to repeat; applied state and
fresh holdings are separate; obsolete continuations must not restore actionable
balances. Forward traversal followed click, status/balance retry, wallet restore
and late response entries. Reverse traversal accounted for both requestOperation
sites, every journal write/delete, success publication and restored holdings.
Boundary traversal followed cart→six terms→Micheline→SDK source→contract checks,
source/mirror→Admin pair terms→Public lookup, and hash/status/level→attributed
complete holdings→journal cleanup. Neither Utility nor the legacy private
`prepareUpdateOperators` helper provides another reachable send. The CLI's
nonreceipt confirmation matcher remains W38/B7; its shared helper branch was read.

| Completed slice / examined source paths | Consequential branches and evidence |
| --- | --- |
| **W09 Drops construction/authority.** `drops/js/events.js:727–817,1015–1421`, selected-input helpers and action registration/gates; `events-config.js` at configured identity boundary. Complete shared pair/operator/build helpers and `token-pair-terms.js`. | Unconfigured, disconnected, pending/changed/reconnected wallet, duplicate click, no selection, changed ID/contract/balance/amount, unsafe/insufficient quantity, pause/phase/inventory changes around every preflight await and the final lock/account await. All six pair terms, exact zero/large native IDs and pair ID, uniqueness over all pages, absent/inactive/mismatched/ambiguous/malformed/error/cap responses; exact operator owner/token/escrow with missing/error fallback. Approval precedes a zero-tez trade with configured multi-unit burn/redeem and user recipient. Final application guards work for observed invalidation; they do not bind the SDK account (**E2 Public extension**). Unbounded operator/pair reads hold the busy guard (**B4-001**). |
| **W11 Exchange construction/authority.** `exchange/js/exchange.js:100–171,400–455,760–805,1135–1548,1633–1639`; config at target/redeem boundary. Same shared helpers. | Initial/final verified account, account/cart/ownership changes and reconnect epochs, quantity limits before allocation and final send, duplicate identities sharing balances, 20-per-identity/50-total units, exact per-unit reward multiplication/sums. One burn entry per selected unit, grouped by burn FA2 into separate escrow calls; every cart row must resolve before any wallet send. Actual cart fixes redeem token at #0; the large alternate redeem-ID pair fixture is serializer capability evidence, not a registered alternate UI. Both preflight stall and SDK discrepancy are independently observed here. B3's malformed edition quote remains unresolved; exact pair lookup can reject it but cannot repair its quotation. |
| **Direct B1/B2 and Admin comparison, without B6 credit.** Contract `initiate_trade:368–494`; shared exact-term key; Admin `drops.data.js:456–462`, `drops.builder.js:17–88`, `drops.send.service.js:199–230`, `pairs/exchange-pairs.js:268–310`, `pair-compatibility.js`; registry/resolvers and existing E1. | Drops producer preserves numeric burn/redeem amounts, native redeem ID and independently resolved collection addresses; Public matches those six terms. Exchange locks redeem contract/ID #0 but permits positive operator-supplied amounts; Public selects only unit-burn/quoted-reward tuples. A supported Admin pair can intentionally be unusable by Public; arbitrary pair management is not proof of Public compatibility. Complete-term equality/uniqueness is shared. Contract checks current pair terms and sender==user_wallet for every entry, then grouped FA2 calls; mapping changes, insufficient inventory/balance or external rejection fail through B1's whole-operation semantics. Approvals grant the escrow persistent operator permission; contract sender checks still constrain Public trades. E1's payload decode is reused, not rerun; native atomicity/external FA2 honesty remain unverified integrations. |
| **W12 submission durability/uncertainty.** Complete `shared/public-trade-ops.js:12–206`; both handler lock/reservation/rejection/hash catches and both restore/status-retry consumers. | Immutable copied scope/intent, write-before-wallet, global submission lock with ifAvailable, unavailable locking/storage, malformed/oversized journal, 32 receipts/10000 storage keys, invalid new intent, read/quota/remove failures and emergency hash retention. Definite matching extension/P2P abort versus generic/WalletConnect/reset ambiguity; primitive provenance captured before await; complete matching operation response versus loose hash hints; returned alias, missing/invalid hash, interrupted request, late hash after account invalidation, reload and repeat prevention. In-flight guards release on settled errors; unresolved records never expire or evict. No-hash history inspection does not itself supply evidence or unlock; no automatic or UI hash-import recovery is inferred. |
| **W12 confirmation/status recovery.** Complete shared `pollForConfirmation`/confirmation matcher/status extraction and store `reconcile`; Drops/Exchange poll wrappers and retry handlers. | All recorded top-level trade calls require exact hash/sender/escrow/entrypoint, distinct safe indexer IDs and consistent terminal outcomes. Applied approvals/unrelated calls, partial/duplicate/malformed/wrong-scope/contradictory rows cannot confirm a receipt. Failed/backtracked/skipped trade group releases only unconfirmed records; previously applied records survive contradictory retries. Whole deadline bounds fetch, JSON, HTTP-text and retry delay, with abort/late-evidence fencing. Per-record cross-tab reconciliation locks, in-page coalescing, queued stale attempts, changed/removed record and post-read persistence failures were traced. Missing/inconsistent level leaves applied holdings blocked and can recover later. Existing fixture poll callbacks that return undefined are stubs; production poll returns only attributed applied evidence, so those fixture successes alone are not confirmation proof. |
| **W12 post-operation holdings.** Shared `pollForNFTUpdate`, both freshness predicates; complete `shared/tzkt-fa2-balances.js` as direct attribution dependency; Drops `refreshConnectedState`, `updateTokensWithWalletData`, `refreshDropsWallet`, retry/confirmation-map consumers; Exchange render/refresh/retry/confirmed-map consumers. | Complete reader provenance, same account/indexer/escrow/network, unchanged array projection, all exact traded identities, explicit zero, positive safe operation/ledger levels, incoming transfers and duplicate selections. Absence, stale apparent reduction/zero, wrong/missing owner, unsupported entrypoint, partial pages and copied/mutated arrays retain applied records. Total polling budget is checked between awaited complete reads (each page has its own 15s deadline), not a strict total reader deadline; timeout/refetch output is still independently gated by consumers. Failure/repeated retry, reconnect/reload, A→B→A, confirmation after reconnect, older standby/trade/retry versus newer producer and late success/error cannot restore stale actionable balances. Success/status and balance freshness remain distinct. |

Verification on those revisions:

- `node --test --experimental-vm-modules --experimental-test-isolation=none shared/public-trade-pairs.test.mjs shared/public-trade-outcomes.test.mjs shared/public-trade-freshness.test.mjs shared/public-confirmation-deadline.test.mjs drops/js/trade-lifecycle.test.mjs exchange/js/exchange-wallet.test.mjs` — **238/238 PASS**, exit 0.
- `node --test --experimental-vm-modules --experimental-test-isolation=none --test-name-pattern='(AUD-008-001|EA-XYZ-P3-T013|Wallet change during confirmed|Confirmed trade NFT)' drops/js/wallet-rendering.test.mjs` — **22/22 selected PASS**, exit 0, including actual Drops publication and retained-recovery consumers.
- `node --experimental-vm-modules audits/repro/AUD-011-public-operations-repro.mjs` — PASS, repeatable: **12 preflight stalls** (both pages × operator/pair × fetch/JSON/error-text) and **two Public SDK account discrepancies**, with eventual-response, unchanged-account and event-first controls. Actual handlers, helpers, Public verifier and installed native getter/setter/request/permission/serialization/peer/emitter; inert storage/transport, no SDK client. Final harness corrections and bounds are in the findings ledger. Exit 0 asserts the defects, not clean behavior.
- `node --check audits/repro/AUD-011-public-operations-repro.mjs` and final diff/whitespace/Git checks — PASS. Tests run in-process without escalation; Node experimental diagnostics/PowerShell stderr wrappers do not change the captured native exit. No environmental restriction was retried.

**Current totals: 40 scopes: 17 COMPLETE (bounded source), 9 PARTIAL,
14 NOT EXAMINED.** New **B4-001** is a confirmed availability failure with
provisional P2 impact. The recovered E2 finding gains independent Public request
and journal/reconciliation evidence, not a duplicate independent finding. All
nine prior provisional findings/evidence remain; ten independent findings now
accumulate. No consequential B4 source obligation remains unexamined. External
wallet honesty/hash fidelity, actual transport/peer/signing, provider accuracy,
native FA2/protocol execution/finality, browser storage durability/Web Locks,
current hosted SDK/code and deployed identities remain unverified integrations.
The confirmation boundary trusts the identified operation response and indexer's
hash/source/status/level; it is not an independent chain or wallet attestation.

Only Outer `audits/coverage.md`, `audits/AUD-011-findings.md` and new
`audits/repro/AUD-011-public-operations-repro.mjs` changed during B4; Admin is
unchanged. Branches, HEADs, indexes, prior evidence and operational state are
preserved. Task-created ignored logs were removed by verified exact workspace
paths. **B5–B7 remain outstanding at the original plan boundaries.** No B5 work,
fixes, checklist change, full-pass finalization, clean refresh, broad build,
exports, external operation, transaction or Git integration occurred.

## AUD-011 — Batch 3 examination (2026-11-25)

**B3 COMPLETE / WITH FINDINGS within source/inert boundaries; AUD-011 PARTIAL.**
All four planned slices, **W01/W05–W08/W10**, were examined through the final
observation/cart/action-state inputs consumed by Public send handlers. Outer
`2453358c8cf91d4db3bc24e447ed0859f91216e8` and Admin
`d8636e957d3974ba73882d9d29242898f10ed3e0`, both
`ticket-AUD-011-full-correctness-review`, are unchanged. Initial Outer state was
the modified coverage and four untracked prior findings/reproduction files;
Admin was clean. Those files and all B1/B2/E1/E2 evidence are preserved. Node
`v22.16.0`, installed dependencies, the Public `testnet`/Shadownet slot and the
current canonical configuration are the assumptions. Mainnet remains disabled.
No historical examination credit was inherited.

Expected properties: verified current wallet/network ownership; complete reads
before absence becomes zero; exact native identities and safe whole quantities;
canonical exclusions applied before native projection; independent metadata,
image, supply and time ownership; truthful current availability through failure,
suspension and recovery. Forward examination followed startup, SDK/document
events, connect/disconnect, balances/retry, checkbox/dropdown/cart actions,
countdown/polling and lifecycle callbacks. Reverse examination started at every
connected/owned/eligible/supply/LIVE/action publication and cart financial field.
Boundary examination followed SDK→shared state→each page, complete TzKT pages,
canonical CMS→mirror→native row, canonical params→preview/supply, trusted
UTC→calendar→pause evidence, and editions→per-unit reward→aggregate cart.

| Completed slice / examined source paths | Consequential obligations / evidence |
| --- | --- |
| **W01 shared wallet.** Complete `shared/beacon-setup.js`, `shared/tzkt-fa2-balances.js`; relevant logger/network configuration contracts; both page wallet consumers below. Direct dependency only: installed Beacon 4.8.1 `DAppClient.{getActiveAccount,setActiveAccount,clearActiveAccount}` and `BeaconEventHandler.emit`. | Client reuse/legacy migration/storage denial, constructor network, boot timing/binding, permissions deduplication/rejection, explicit disconnect, valid/null/mismatched account events, clearing failures and generations around every account await, shared NFT promise and duplicate-address publications. Complete cursor pagination: exact nats, safe-number admission, zero/empty, multi-page/cap/order/duplicate/HTTP/JSON/request/body-timeout failures, no partial publication. Delayed explicit disconnect can overwrite a newer valid account (**B3-001**). Native SDK lifecycle methods verify the schedule; no Admin account-binding or ABI proof was repeated. |
| **W05/W06 Drops configuration, holdings and cart.** Complete `drops/js/events.js` parameter gate/details, CMS capture/stamping/cloning, balance/eligibility/selection/cart render, wallet synchronization/refresh/retry and refresh producers; complete `token-rendering.js`, `reveal-coordinator.js`; `events-config.js`, `shared/public-drop-compatibility.js` at consumer admission. Canonical params and B1/B2 identity contracts are dependencies. | Scheduled/unscheduled/inactive and unavailable config; malformed dates/amounts, unsupported combinations and distinct FA2s; immutable detached canonical templates versus wallet rows; enabled collection, canonical exclusion and exact native ID (including zero and large text), missing/ambiguous mirror and duplicate CMS handling. Exact per-token balances/aggregate overflow, below/exact burn, absent/zero/failed reads, single checkbox, deselection/reselection/reset, disconnected preview versus connected eligibility. Pending boot, A→B/null/reconnect, late success/error, same-address duplicate notifications, request epochs and repeated retry retire obsolete quantities. Retained-trade freshness is followed only as a publication/invalidation dependency; journal/send/confirmation semantics remain B4. |
| **W08 redeem preview/inventory.** Complete `events.js` metadata lookup/inverse mirror, independent image/supply initialization and commits, supply reader/display/start/stop/reconciliation, and inventory action/flame gates. | Canonical title/image resolution preserves exact native redeem ID; missing row/image/error use explicit fallback, while a stalled image does not block metadata/supply authority. Initial barrier/error releases, independent supply versus image, deduplicated nonoverlapping polls/restart, complete missing token→zero, malformed/unsafe balance→unknown, zero/positive-insufficient/sufficient configured redeem quantity, later failure/recovery, visibility and phase changes were examined. Verified zero intentionally stops replenishment polling; it is not fresh evidence of future inventory. In-flight reads are not cancelled on hiding; reentry shares them. Provider/chain freshness is not independently established. |
| **W07 time and continuing availability.** Complete `shared/drop-time.js`, `shared/drop-countdown.js` and `events.js` countdown owner, pause reader/loop, retry, pagehide/BFCache and visibility consumers; final button/flame/pill state. | Calendar/leap/US seasonal-zone round trips, noon/midnight, invalid times/gaps/folds and viewer-zone independence; UTC payload/HTTP/cache/RTT/uncertainty, age/drift/jump/suspension, cancellation/generations, retry/offline/resume and one certain expiry. Manual unpause remains distinct from expiry. Pause HTTP/boolean/body deadline, overdue response, failure/retry, holdings await→fresh pause reread, repeated pause/unpause, current wallet/request guards and owner replacement/pagehide/BFCache were traced. Continuing LIVE loses the countdown's visibility/freshness hooks at expiry (**B3-002**). Real ellipsis also restores old mobile text for legitimate `STANDBY…`; recorded as display evidence, not an authority failure. |
| **W10 Exchange holdings/economics/cart.** Complete `exchange/js/exchange.js` non-submission paths: startup delay/binding, CMS stamping, shared and independent reads, wallet/pane publication, retry/generations, edition helper, quantity map/dropdowns, cart extraction/render/totals, clear/remove/tab/global hooks and bottom-action observer. `exchange-config.js` at identity boundary. | Exact contract/token IDs, two panes/duplicate rows, missing/zero/unsafe/malformed balances, stale A/B/reconnect/paged results, verified per-dropdown quantities independent of editions, 20-per-identity/50-total limits and safe reward multiplication/sums. Empty/invalid selections retire the displayed cart; hidden tabs remain included, clear/remove recalculate, legacy receive cannot supply authority. Whole-invalid editions reject but numeric prefixes become confident reward terms (**B3-003**). Finite valid reward controls and malformed selections were challenged at final `getBurnCart()`/total outputs; operation lookup/construction/submission remains B4. |

Focused verification (no broad suite/build or exports):

- `node --test --experimental-vm-modules --experimental-test-isolation=none shared/beacon-setup.test.mjs shared/fa2-balances.test.mjs shared/drop-time.test.mjs shared/drop-countdown.test.mjs drops/js/token-rendering.test.mjs drops/js/reveal-coordinator.test.mjs drops/js/countdown.test.mjs drops/js/countdown-lifecycle.test.mjs` — **118/118 PASS**, native exit 0. Includes existing top-level fixture assertions; not a live rendering/SDK/provider claim.
- Selected current Drops/Exchange wallet/quantity tests — **27/27 PASS**, native exit 0; exact invocation in the [B3 evidence ledger](AUD-011-findings.md#b3-verification-and-limits). These test names were selected for observation, quantity and invalidation seams; no B4 completion credit follows from handler controls they also exercise.
- `node --experimental-vm-modules audits/repro/AUD-011-public-observations-repro.mjs` — PASS observing **three source failures** plus the mobile display discrepancy, with unchanged-authority, valid-input, rejection and recovery controls. Current production functions and existing inert fixtures; installed SDK lifecycle methods only, deferred storage, suspended timers and CMS text controlled. No real SDK client, local service, live transport or transaction was started.
- Tests ran in-process without child spawning and needed no escalation. PowerShell wraps Node experimental warnings as stderr `NativeCommandError` records; the captured TAP and explicit `$LASTEXITCODE` are both successful. No unchanged sandbox-blocked B2 command was retried. Harness development corrected a missing inert SDK delegate and a cross-realm assertion before the successful final runs; neither was treated as a production defect.

Current totals: **40 scopes: 14 COMPLETE (bounded source), 11 PARTIAL,
15 NOT EXAMINED.** The three B3 findings have provisional impact assessments and
remain unresolved, as do B2's five findings and E2. No consequential B3 source
obligation remains unexamined. External/live wallet transport, actual browser
suspension/task ordering, CMS payloads, RPC/indexer accuracy/snapshot consistency,
time-provider correctness and deployed identities remain unverified integrations.
Ordinary polling is observational, not a reservation or atomic chain snapshot;
balances can change externally between observations. B3 does not establish
operation construction, signing, confirmation or post-operation correctness.

**Remaining: Batches 4–7 at their original boundaries.** First-paint/navigation
and delivery remain B7; Admin lifecycle and downstream orchestration remain B5/B6.
No remediation, compact-checklist edit, full-pass finalization or clean-result
refresh occurred. Changed files for this batch are only Outer
`audits/coverage.md`, `audits/AUD-011-findings.md` and the new Public reproduction;
Admin is unchanged. Final syntax/repeatability, focused diff/whitespace and Git
state checks are recorded with the findings. Runtime/config/generated files,
operational state, branches, HEADs and indexes are preserved. No ticket exports.

## AUD-011 — Batch 2 examination (2026-11-25)

**B2 COMPLETE / WITH FINDINGS within source and disposable-fixture boundaries;
AUD-011 PARTIAL.** Examined all three B2 slices, W30–W32, through file and committed
snapshot publication. Outer `2453358c8cf91d4db3bc24e447ed0859f91216e8` and Admin
`d8636e957d3974ba73882d9d29242898f10ed3e0`, both
`ticket-AUD-011-full-correctness-review`, remained unchanged. Initial Outer changes
were the prior modified coverage and recovered untracked findings/ABI/SDK evidence;
Admin was clean. Those prior edits/evidence are preserved. Node `v22.16.0`, local
NTFS, current installed dependencies, selected Public testnet/Shadownet and the B1
identity contracts are the assumptions; no historical audit supplies examination
credit. [B2 findings and evidence](AUD-011-findings.md#batch-2-examination--2026-11-25)
supersede W30–W32's initial NOT EXAMINED labels in the retained inventory.

Expected properties: one canonical source; exact network/token and amount meaning
through authoring; preview/source/candidate binding at mutation; serialization of
supported writers; archive before reset; exact rollback or preserved fail-closed
recovery; snapshots bound to their source version; stale work cannot restore
authority; service/provider/control readiness must reflect current observations.
Forward traversal followed UI, HTTP, CLI and startup/watch actions; reverse
traversal followed all replacements, archive/journal writes and provider
publications; boundary traversal compared form/title namespaces, shared schema,
fixed paths, hashes, mirrors and consumer invalidation.

| Completed slice / examined paths | Consequential obligations and evidence |
| --- | --- |
| **W30 local registration/session.** Admin `src/admin.js:233–249`; complete `src/features/drops/authoring/{index,authoring.controller,authoring.client,authoring.state,authoring.view,authoring.form,authoring.tokens,authoring.preview}.js` and relevant visibility/disabled CSS; `titles.manifest.js`, `titles/hen.json` at the selection boundary. | CREATE/EDIT/DEACTIVATE, preserved disabled rows/sentinels, canonical exclusion strings versus native redeem IDs, numeric/date/time parsing, validation/preview/acknowledgement, changes during every request, duplicate events, close/reopen, stale success/failure, apply uncertainty, startup/health retry and deadlines through response decoding. Corrected **B2-001**: the selector offers ineligible HEN redemption and shared validation accepts it; the canonical/native ID mismatch remains evidence on that invalid path, not a supported feature; BUSY/reconciliation recovery leaves controls disabled (**B2-003**). Existing 80 focused Admin checks plus actual-form/real-writer and scheduled-health reproductions. No broad rendering or production-bundle claim. |
| **W30/W31 loopback service.** Complete `scripts/drop-params-authoring-service.mjs`, `shared/drop-params/drop-params-authoring-service.mjs`; Admin client/provider above. | Fixed loopback bind and routes, Host/Origin/CORS, JSON/content-type/body limit, per-process nonce, restart/reuse/foreign-port behavior; read-only validate/preview; operation admission, exact source/candidate/plan binding, single-use/expiry, writer errors, rollback/reconciliation reports and late/unavailable replies. A separate live local PID's lock is classified `active` but not busy (**B2-005**); unlocked read overlap misbinds source version (**B2-004**). Existing mocked writer-state/same-PID contention tests do not cover those schedules. HTTP tests use disposable local listeners, never the operational listener. |
| **W31 schema and mutation entries.** Complete `scripts/drop-params-transaction.mjs`, `shared/drop-params/drop-params-authoring.mjs`, `drop-params-transaction.mjs`; `shared/public-drop-compatibility.js` and `shared/drop-time.js` as direct validation dependencies. | Direct CLI/service converge on fixed-path locked writer; object/operation/path/ID/version validation, exact recursive keys, active/inactive/unscheduled domain, network capability, distinct contracts, enabled-burn cardinality, duplicates, zero/negative/unsafe amounts, exact zero/large token-ID text, invalid calendar/DST gap/fold, deterministic source/JSON and hashes. CREATE/EDIT admission, DEACTIVATE active archive versus inactive no-op; same-plan completion replay and conflicting ID/plan rejection. Canonical unscheduled authored content is supported but rejected by both Admin provider modes (**B2-002**). Collection membership/distinct-contract checks and shared compatibility still admit HEN redeem despite its burn-only role (**B2-001**); direct CLI/service admission shares this gap. Raw source is trusted local executable code, not a remote input parser. |
| **W31 archive, failure and recovery.** Complete `drop-params-archive.mjs`, `drop-params-recovery.mjs`, remaining transaction flow. | Exclusive immutable archive publication/read-back/collision/reuse; staging and each replacement/final-verification failure; journal before effects; exact base/target ownership and all-base/all-target/mixed recovery, missing/divergent files, malformed/unreadable journals, failed/interrupted rollback/reconciliation and retained evidence. Pending blocks READY/projection/service mutation; read-only status stays available. Direct locked writer retry may reconcile pending before retry; explicit reconcile also handles reconciliation-required. Terminal records permit projection; archives remain historical. Process interruption differs from power-loss durability. Disposable tests exercise interruptions, preservation, supported resolution and retries; real journals/locks/archives never changed. |
| **W31 lock/concurrency.** Complete claim inspection/publication/acquisition/release in `drop-params-projector.mjs`, existing lock fixtures. | Complete private staging→exclusive hard-link claims; choosing/waiting/owned, ticket/tie order, competing acquisitions and reclaimers, live/dead PID, delayed publication, invalid grace, cancellation, timeouts, foreign replacement/ownership loss and cleanup. Supported writer/CLI/projector contend through one lock; released async scopes cannot reuse ownership. Cross-process busy reporting fails above, but underlying exclusion/CAS still holds. Unique UUIDs, coherent one-host filesystem/PID namespace and supported lock protocol are assumptions; mixed versions/network volumes/external claim removal are excluded. |
| **W32 propagation and publication.** Complete `shared/drop-params/{index.js,package.json,gen-drop-params-json.mjs,watch-drop-params-json.mjs,drop-params-projector.mjs}`; canonical source/JSON and Admin mirror inspected as inputs; Admin `src/features/drops/drop-params.provider.js`, complete `authoring/drop-params.provider.dev.js`, `scripts/build-guard-drop-params-mirror.mjs`; relevant package sync/watch/build entries. | Source cache busting, deterministic LF output, unchanged-byte no-op, atomic per-file replacement, recovery gate under lock, watch debounce/epochs/in-flight draining/rapid saves, one-shot failures and missing/invalid outputs. Production immutable static mirror versus service-only development; refresh constraints/generations/deduplication, guarded post-apply version/operation, unknown/offline/drift/blocked states retire params, recovery/unchanged publications. Weak build guard only parses JSON; schema/provider admission remains separate. **B2-002/B2-004** qualify acceptance/version truth. Exported low-level option/path helpers were traced to all current callers; they are not extra registered HTTP or CLI capabilities. |
| **W32 consumer stop boundary.** Admin `drops.controller.js:523–568,790–834`, `drops.time-cache.js`, `drops.load.service.js:117–143`, `drops.checklist.controller.js:870–887`; identity dependency only: `drops.data.js:294–295,456–462`, `drops.builder.js:77–80`, Public `drops/js/events.js:726–736,2211–2226`, B1 registry HEN mirror. | Provider subscription initializes once, replacement/non-READY bumps status/checklist/request epochs, retires params/norm/readiness, clears cached intent, disables Send and stops loops before preview reentry. Same source suppresses publications, exposing B2-004. Configured native redeem ID is preserved downstream; this explains the B2-001 serialization observation but does not establish HEN redeem eligibility or a required translation fix. This is boundary tracing only: full normalize/translation/load/send/checklist semantics remain B6; Public observations remain B3; production delivery/isolation remains B7. |

Focused verification (no build, broad application suite or exports):

- `node --test --experimental-test-isolation=none shared/drop-params/drop-params-projection.test.mjs shared/drop-params/drop-params-lock.test.mjs` — initial sandbox run: **101/107 PASS**, six process-dependent failures (`spawn EPERM` and dependent claim waits). No production defect was inferred from them.
- Same command with `--test-name-pattern='^(real child owner|AUD-004-003: an interrupted partial apply|clear and rolled-back recovery|writer/projector contention|AUD-005-001 supported service|existing authoring, writer, service)'` — permitted rerun: **6/6 PASS**, native exit 0; disposable wrapper also reports **54/54** schema/writer/service and **1/1** watcher checks PASS. No broad suite was repeated.
- From Admin: `node --test --experimental-test-isolation=none tests/runtime/drop-params-authoring.test.mjs tests/runtime/drop-params-provider.test.mjs tests/runtime/authoring-session.test.mjs tests/runtime/authoring-response-timeout.test.mjs` — **80/80 PASS**. Initial PowerShell combined redirection reported exit 1 for Node's experimental warning despite passing TAP; rerun with separate stderr and explicit native exit confirmed **exit 0**, 80/80. These mocks do not certify all canonical shapes, cross-PID busy state or every recovery transition.
- `node audits/repro/AUD-011-config-propagation-repro.mjs` — PASS observing the five bounded failures and active/inactive, healthy/recovered, fresh-poll and stale-CAS controls. Real form/provider/controller/service/writer code; reused inert DOM and disposable copied filesystem; only read timing and external boundaries controlled. Assertions describe defects, not passing remediation tests. Final repeatability and diff/state checks are recorded with the findings.

Current totals: **40 scopes: 8 COMPLETE (bounded source: B1's five plus W30–W32),
11 PARTIAL, 21 NOT EXAMINED.** B2 has five unresolved source findings; existing E2
SDK and E1 ABI evidence remain unchanged and were not rerun. No consequential B2
source obligation remains unexamined. Live browser/transport/filesystem scheduling,
power-loss durability, hosted publication and downstream execution remain
unverified integrations. The known unsupported independent-editor race is
preserved, not reclassified as fixed; B2-004 uses a supported locked writer.
Batches **3–7 remain outstanding exactly at their recorded boundaries**. No B3
examination, fixes, remediation-checklist change, final clean refresh or AUD-011
finalization occurred. Runtime/configuration/operational files, branches, HEADs
and indexes were preserved; only Outer audit records and the new reproduction
are intended changes. No ticket exports, commits, integration or deployment.

## AUD-011 — Batch 1 examination (2026-11-25)

**B1 COMPLETE within source/inert boundaries; AUD-011 PARTIAL.** Reviewed unchanged
Outer `2453358c8cf91d4db3bc24e447ed0859f91216e8` and Admin
`d8636e957d3974ba73882d9d29242898f10ed3e0`, both on
`ticket-AUD-011-full-correctness-review`. The expected recovered Outer files and
prior coverage edits were preserved; Admin remains unmodified. The
[Batch 1 evidence ledger](AUD-011-findings.md#batch-1-examination--2026-11-25)
records forward/reverse/boundary examination, negative paths and actual checks.

| Completed bounded scope | Examined effects / boundary |
| --- | --- |
| W02 identity | Registry, Public network/config, Admin network/live-cfg: actual target agreement, strict/fallback/Mainnet admission, current exact collection/mirror/range identities. Persisted-network transition lifecycle remains B5. |
| W33 direct trade | Every trade's sender and six terms, exact burn/redeem recipients and quantities, grouping/repetition, first/later invalid items, shortage/operator/interface/rejection and protocol rollback assumptions. External FA2/chain execution stops explicitly. |
| W34 direct privileged entries | Admin authority, set/update/cleanup/count invariants, tuple versus ID uniqueness, pause toggle, exact XTZ payout and token rescue, events/no-ops/errors and repeated calls. Client submission/recovery remains B5/B6. |
| W35 funding | Positive/zero default, attached tez, unsolicited FA2 ingress, custody-versus-supply/sink meaning and inventory consumer identity boundaries. Full inventory/readiness publication remains B3/B5/B6. |
| W40 provenance | Current source/snapshot/mechanical fixture, exact manifest/release/archive identities, compiled event types, distinct historical artifact and historical deployment records, current artifact consumer obligations. Native compilation and present deployment remain unverified. |

Current reconciled totals: **40 scopes: 5 COMPLETE (bounded source), 11 PARTIAL,
24 NOT EXAMINED**. The initial inventory below remains the planning snapshot,
not current completion credit. No new material finding or unresolved source-level
hypothesis was established in B1. Direct admin duplicate terms, permanent custody
authority, sink control and honest FA2 behavior remain explicit trust boundaries;
the previously validated SDK account-binding defect remains unresolved. Existing
E1/E2 evidence was preserved and not rerun. No historical audit examination or
native execution credit was inherited.

Checks: ignored `audits/work/AUD-011-batch1-checks.mjs` PASS (31 exact checkout/HEAD
manifest identities, fixture/promotion/archive correspondence, compiled event
schema and mutation control, actual registry/resolver/preflight controls);
`node --test --experimental-test-isolation=none shared/chain-registry.test.mjs`
4/4 PASS; eight selected mapping-identity cases in
`shared/public-trade-pairs.test.mjs` PASS; invariant coverage verifier PASS
(mapping integrity only, not 181 executed obligations). Exact commands and limits
are in the linked ledger. Initial Node→Git sandbox `EPERM` was resolved by a
read-only elevated rerun. No live requests, transactions, operational mutations,
builds, broad suites, native legacy execution or patch exports occurred.

**Outstanding:** Batches 2–7, unchanged dependencies/obligations in the seven-batch
plan; B2 was not started. Native rollback/external FA2/SDK/provider and present
deployed-code/state behavior remain unverified at the recorded boundaries. No
final clean refresh, AUD-011 finalization or remediation-checklist change.

## AUD-011 — remaining coverage inventory (2026-11-25)

**Historical planning checkpoint — superseded for B1 by the ledger above; no complete or clean pass.** Source:
Outer `2453358c8cf91d4db3bc24e447ed0859f91216e8`, independent Admin
`d8636e957d3974ba73882d9d29242898f10ed3e0`; both on
`ticket-AUD-011-full-correctness-review`. Initial Outer changes were the three
recovered untracked AUD-011 evidence files; Admin was clean. This execution
changes only Outer audit documentation and preserves all historical records below.

The [AUD-011 checkpoint](AUD-011-findings.md#remaining-coverage-inventory--2026-11-25)
contains the current source-derived inventory, entrypoints, cross-repository
boundaries, evidence ledger, both historical crosswalks and seven bounded
examination batches. Forward, reverse and boundary discovery froze 39 scopes
before consulting the original 33 workflows and later 20 groups. Reconciliation
added missing contract artifact provenance as W40 and made GitHub checklist
reads, dormant exported parsers/catalogue caches and exporter/launcher effects
explicit. The independent freeze and subsequent additions remain distinguishable.

Reconciled coverage: **40 scopes (38 workflows, one support-library boundary,
one provenance dependency): 0 COMPLETE, 11 PARTIAL, 29 NOT EXAMINED.** Only the
recovered local ABI compatibility check and separately bounded Admin/SDK
account-binding validation are completed evidence items. They do not complete
their containing workflows. Historical examination/tests supply no AUD-011
credit. Source discovery itself is not correctness examination.

No reproduction, ABI check, broad test, build, export generation, operational
write, remote integration or remediation ran for this checkpoint. The validated
SDK defect and its live/alternative-path limits remain as recorded. Legacy
execution, deployed identity, live Webflow/wallet/provider behavior and complete
workflow examination remain unverified. The remediation checklist is unchanged.
This is initial coverage recovery/planning, not a post-clean refresh; next work
is the dependency-aware examination slices in the checkpoint.

## AUD-010 — independent full-application investigation (2026-11-24)

**COMPLETE / NOT CLEAN.** One independent adversarial source examination of both
repositories completed at Outer `b547c1617b5a136f833894c873e6e862645a04bf` and
Admin `57e9fb616526e2a0c9da34643c180e10a16e5f7b`, both initially clean on
`ticket-AUD-010-full-correctness-review`. Each HEAD is its local normal-base
merge base (Outer `staging`, Admin `codex`). Only audit documentation and one
inert reproduction are changed; Admin source is unchanged. See
[AUD-010 findings](AUD-010-findings.md) for the confirmed P2 mismatch between
pair authoring/readiness and Public resolution, historical dispositions and
remediation. Material finding: no provisional clean pass and **no clean-result
refresh**. This is a completed investigation, not an implementation or approval.

### Independent discovery, assumptions and examination depth

Before consulting historical findings/maps, forward discovery followed current
Webflow/page imports, Admin registrations, package/CI commands, background
tasks, local authoring entries and contract entrypoints. Reverse examination
started from wallet requests, FA2/XTZ effects, privileged/mapping/file/asset
mutations and success/LIVE/readiness decisions. Boundary examination followed
canonical/display/network IDs, exact amounts, account/network generations,
approval/operation encoding, source/JSON/Admin mirror and loader/artifact owners.
Ignored `work/AUD-010-independent-discovery.md` preserves the original 27-scope
candidate before history. Active provisioning and artifact consumption exposed
an explicit provenance sub-scope during traversal/reconciliation (D28 below);
it was fully examined rather than omitted or treated as historical execution.
No predetermined workflow count supplied the candidate.

Expected properties derive from project intent, exact identity/conservation,
current account/admin authority, truthful actionable evidence and recoverable
publication. Complete entry-to-effect producers/consumers and alternate entries
were followed; existing tests were challenged rather than used as correctness
oracles. Every scope below includes relevant negative paths, absent/malformed/
duplicate/large data, contention, rejected/partial/unknown outcomes, retry,
cancellation, newer ownership and cross-system effects. Bounded financial and
privileged branches were traced per-item/per-batch through direct contract
validation and external transfers, independently of UI gates. Pure visual
branches have proportionate source/fixture checks; unsupported adversarial
metadata promises were not substituted for local-only producers.

Environment: Windows PowerShell, Node `22.16.0`, npm `10.4.0`, existing Beacon
`4.8.1`, Taquito `19.0.2`, Parcel `2.16.4`; no install or dependency change.
Public defaults to testnet/Shadownet. Dedicated Drops
`KT1HMCqYqyP9fTDjzm8KAfyPhFn3tpmSW4kc` and Exchange
`KT1Ue9es4biDzt528YhNctPGcNeqw9nDXnSv` are the source targets; Admin's
testnet compatibility escrow routes to Drops, while registry legacy root
`KT1SZFfxFfRkbTcDUS17y1WVCKeudoLo8LX5` remains distinct. Mainnet is incomplete.
These are configuration identities, not new deployed-code observations.

### Completed behavioral map

Paths are repository-relative; `Admin` explicitly denotes the independent
`admin-ui` repository. “No additional finding” is bounded to examined source and
stated evidence, never proof of absent defects or live correctness.

| Scope | Producers, consumers and examined contract | Result / verification boundary |
| --- | --- | --- |
| D01 Public wallet and holdings ownership | `shared/beacon-setup.js`, `network.js`, `tzkt-fa2-balances.js`, both page lifecycle consumers: constructor/persisted network, permission deduplication, boot versus SDK/null/replacement events, mismatch clearing, disconnect/reconnect, failed reads and stale success/rejection; complete cursor pages/row identity/safe balances and publication. | Original wallet/paging corrections retained; public and supporting fixtures pass. Actual SDK transport and provider truth unverified. |
| D02 Drop configuration and catalog identity | Canonical params, compatibility gate, `drops/js/events-config.js`, `token-rendering.js`, `events.js`: supported enabled collection/redeem shape; canonical exclusions before injective network translation; detached CMS templates, exact row/token contract IDs, zero versus unknown inventory, metadata/image/supply reveal and selection reset. | No original namespace/compatibility regression. Live CMS/DOM integration unverified. |
| D03 Drops selection to trade | `events.js` selection, balance/quantity checks, approval/pair lookup, final account/selection/LIVE/supply gates and serialized trade; shared helpers and direct contract consumer. Configured multi-unit burn/redeem, unsafe/missing/changed selection and rejection branches traced. | Actual builder ABI and burn/render/lifecycle cases pass; no wallet request outside inert seams. |
| D04 Exchange economics and trade | `exchange-config.js`, `exchange.js`: registry pane/redeem targets, CMS editions/reward arithmetic, safe totals, 20-per-token/50-total caps, duplicate identities, cart/clear/tab changes, verified holdings, per-unit expansion and final account/cart capture. | No additional quantity/identity finding; shared duplicate-pair blocking effect also applies here. Source/fixtures only. |
| D05 Public uncertainty and recovery | Both handlers, `public-trade-ops.js`, complete FA2 reader: full six-term unique mapping across pages, approval fallback, pre-wallet durable reservation, Web Locks/tab exclusion, matching transport abort versus ambiguity/hash, storage bounds/errors, reload/status retries, full submitted-operation attribution, fetch/body deadlines, applied-level snapshot ownership and incoming/duplicate/missing/zero balances. | Prior durable outcome/freshness corrections retained. **AUD-010-001** exposes disagreement with Admin producers/readiness, not failure of the intended ambiguity rejection. Browser storage/finality unverified. |
| D06 Published time and Public LIVE | `drop-time.js`, `drop-countdown.js`, Public countdown/pause/supply owners: strict calendar/DST gap/fold rejection; UTC sample identity/RTT/age/drift/jump/resume; unavailable retry; serial pause reads before/after holdings and after LIVE; repause, supply depletion/error, visibility/pagehide/restore and stale reads. | No original HTTP/pause/inventory regression. Trusted provider assumptions remain external; countdown/ownership tests pass. |
| D07 Public arrival/reveal/Utility | Four page entries, local HTML inline programs, `public-first-paint.js`, early Drops shell/reveal coordinator and Utility images: duplicate boot, optional nodes, font/image failure/timeout, reveal release, marquees, resize/SVG connectors, navigation/wallet controls and disconnected/loading/error regions. | No additional finding. Local navigation/loader/reveal cases pass; live Webflow custom code/presentation unverified. |
| D08 Admin boot/network/wallet | `src/admin.js`, `network.js`, `beacon-setup.js`, wallet/live-cfg and every privileged helper caller: both surfaces, persisted selection/migration, reload boundary/errors, active-account validation, same/replacement/null account, permissions and send authority through all preflight/helper/chunk awaits. | Original authority corrections retained; current runtime cases pass. Real browser reload/transport unverified. |
| D09 Admin targets/status/administrator | Registry-to-live-cfg surface resolution, `admin-indicator.js`, `exchange-status.js`, chain adapter and API: strict Exchange target versus legacy fallback, Drops compatibility target, admin/unknown cache and second account observation, malformed storage/read error and diagnostic publication. Indication is separate from on-chain authority. | No additional material finding. Status display is read-only; no claim that it is signing authority or live storage. |
| D10 Both pause scopes | Pause controller/recovery and `escrow-ops.js`: target/current-account ownership, explicit toggle semantics, cache/read errors, pre-send reservation, repeated/inverse/tab exclusion, no-hash/late-hash uncertainty, complete applied/failed recovery, refreshed boolean and correctly scoped broadcasts. | Original stale authority and ambiguous toggle triggers remain corrected; runtime recovery controls pass. |
| D11 Both Treasury custody reads | Treasury context/orchestrator/lifecycle/table/fetchers, complete FA2 API and catalog: complete nonzero custody, malformed/error versus empty, off-DOM row publication, stale network/disconnect refresh, exact IDs/max quantities, XTZ balance wallet/target snapshot and MAX invalidation. | No original holdings/MAX regression; runtime cases pass. Provider accuracy unverified. |
| D12 Both Treasury sends/recovery | Transfer/withdraw controllers, durable recovery/status/UI and escrow helper: safe whole FA2 quantities, exact recipient/items, six-decimal BigInt mutez without rewriting, per-controller ownership, final account/target guards, whole intended receipt including reveal/internal operations, unknown/partial/failed/applied, retained late results and refresh without resubmission. | Original send/outcome corrections retained; ABI and all runtime cases pass. No assets moved. |
| D13 Pair reads/identity/presentation | `pairs.data.js`, both controllers/tables, complete `tzkt-api.js` and catalog/UI adapters: advancing complete pages, malformed/duplicate/failed continuation, named/pointer routes, exact token/pair keys, range selection, title/thumb hydration and newer render ownership. | Original exact-ID/page corrections retained. Sorting/presentation is distinguished from serialized identity. |
| D14 Manual pair mutation | Set-panel/controller/validators, modal content/widgets/session/controller, Exchange lock and escrow helper: current target/account, occupied ID, safe pair range, exact stored/custom token IDs including zero, positive terms, different FA2, edit/reset/close/refill, availability failures, create/update/cleanup and counted confirmation. Direct-contract comparison includes missing/duplicate cleanup entries. | **AUD-010-001:** unused IDs may repeat six-term Public terms. Existing stale-authority/session/zero/rounding corrections retained. A full drop-panel Send is correctly locked and is not the duplicate producer used by the repro. |
| D15 Drop normalization/load/preview | Provider to data/builder/exact-token/translation audit/load/state/controller/views: immutable snapshots, canonical exclusions/translation, per-collection terms, Auto/manual ID spans, safe contiguous ranges, chunks, overlap/unknown rejection, enrichment and cached/generated/rendered state. Newer initial/manual/Auto success/rejection and provider/reset invalidation traced. | AUD-006/AUD-007 corrections retained; actual normalization/build/status used by the new repro. |
| D16 Drop send/status/countdown/checklists | Send/status/controller/checklist/countdown/panel services: cached/current term equivalence, final authority for every chunk, partial earlier success versus later failed/unknown/retired batch, retained receipt history, status request epochs, pause requirement, unpause ownership, supply/readiness dependencies and provider replacement. | Original ordering/epoch/readiness corrections retained. **AUD-010-001:** best-aligned full status ignores duplicate terms elsewhere; green consumer reproduced. |
| D17 Local authoring/provider UI | `authoring/*`, production/development providers: source-bound session/validate/preview/apply/deactivate, edits during requests, close/reopen, acknowledgement, TTL/stale/error health, committed readback, constrained refresh deduplication, immutable params, provider loss/replacement propagation and production separation. | No original health/timeout/consumer invalidation regression. Current Admin runtime cases pass. |
| D18 Projection/mirror/watch/build | Shared schema/projector/watcher/generator, Admin sync/build guard: exact keys/types/safe amounts/native token text, inactive shape, Public compatibility, source serialization, byte/semantic equality, owned nested projection capability, unresolved-journal fail-closed, rapid watch drains and once/build failure. | No additional finding. All mutation-oriented tests ran in disposable copies; actual operational state untouched. |
| D19 Loopback authoring API | Service and launcher plus development client: fixed loopback/host/origin/method/route/body limits, nonce/repository/session, exact source/candidate/plan/token binding, single-use expiration, validation, writer state and delegated CAS; response/body timeout/late outcome and reconnect/reuse. | No additional finding. Isolated service fixtures only; no real authoring service started. |
| D20 Writer coordination/recovery | Projector/transaction/recovery/archive/CLI: complete claim publication, choosing/tickets/liveness, contention/reclaim/timeout/release/collision, per-async-chain projection ownership, journal snapshots/idempotence, staged hashes, archive before inactive source, all-file ownership before each replacement, interrupted exact-base/target recovery, rollback divergence and fail-closed unresolved state. | AUD-009-001 corrected; 17 lock tests pass. AUD-005-001 accepted independent-editor read/replace window remains; no unsupported operational recovery or cleanup. |
| D21 Direct contract public trade | Canonical SmartPy types/init/entry and Public builders: paused/empty rejection; each item's sender/user and all six stored terms; first/later invalid and repeated/heterogeneous trades; grouped user-to-sink and escrow-to-user FA2 effects, insufficient aggregate inventory/balances, revoked operator/rejecting FA2, events/rollback and attached tez. | No additional contract source failure. Honest FA2/protocol atomicity are assumptions; embedded mock lacks operator checks. No legacy/native execution. |
| D22 Direct contract privileged entries | Same source and Admin builders: admin-only pause/rescue/XTZ/set/update/cleanup; exact recipients/amounts, zero/insufficient balance, default ingress, external recipient rejection, duplicate IDs/intra-batch rollback, mapping count and failed-deletion event semantics. No unimplemented admin/sink setter inferred. | ABI compatibility passes; duplicate terms remain permitted by the contract and conflict with Public as in 001. No on-chain mutation. |
| D23 Health/CMS/economics/catalog | Health/CMS controllers, CSV, economics, local HEN/title/thumb resolvers, caches/store/catalog/chain UI: complete token/holder enumeration, strict readiness over tolerant CSV parsing, duplicate/draft/archive/mirror cases, explicit CANAAN ACID, unknown versus zero, sink exclusion, safe totals, forced/cache/concurrent reads, uploads/clear/network/stale result and dependent checklist events. Optional remote metadata exports are distinct from active local-only UI truth. | Prior unknown/forced-health/CSV/supply corrections retained; enumeration/CMS runtime cases pass. Uploaded CSV is not a live Webflow observation. |
| D24 Thumbnail/local asset effects | Outer input/backfill/optimizers and Admin generator/manifest lock: supported formats/numeric identity/path allocation, one pending input, conversion/metadata/width, originals versus review candidates, archive exclusivity, real shared lock capability, standalone/input ordering, output/manifest rollback and interrupted retained lock. JS escaping and URL segment identity rechecked. | 27 Outer/37 Admin cases and read-only real manifest check pass. Real assets/manifest/operational locks preserved. |
| D25 Exported CMS/asset API | `assets/webflow-cms/webflow-cms.mjs`: exported reads/mutations even without active UI caller; complete consistent pagination/unique locale identity, errors/retries, staged/live comparison, presigned upload, transport/body/status ambiguity without blind write retry, binary/perceptual content identity and explicit reconciliation/redacted evidence. | 39 inert cases pass. No actual Webflow account/site/API/S3 query or mutation. |
| D26 Delivery boundaries | Root/environment loaders, page entries, first-paint verifiers, packages, Pages CI, Admin mirror/prune/isolation: exact host routing, independent imports/errors, main-owned roots/prod versus staging-owned loaders, bundle presence/provenance, source-map exclusion and production writer isolation. | Both required isolated builds and loader/artifact tests pass. Actual multi-branch Pages assembly, deployment, fresh Node-20/Linux CI and live hosting unverified. |
| D27 Local tools/provisioning/export | Package scripts, dev-port/Parcel/server/sanity helpers, transaction/service launchers, `shadownet-exchange-pairs.mjs`, diff exporter: dry-run default versus explicit signer/send gate, fixed chain/admin/target/ABI/44 exact pair assignments, occupied/partial/readback/confirmation, dev startup and failures; export private index/object store, locks, inherited overrides and bounded cleanup. | Provisioning fixtures pass; no operational CLI mode/dev server invoked. Final exports use each repo's existing command; no real index staging. |
| D28 Active artifact/provenance obligations | Canonical SmartPy/snapshot/mechanically stripped compilation fixture, standalone conforming/rejecting/no-op tests, promoted/frozen artifacts and Phase-7/8/10/11 records; source consumption from client ABI/provisioning/delivery traced back to exact identity and recorded compiler differences. | Mechanical provenance, 31/31 exact frozen checkout/HEAD-blob hashes and invariant map pass. Certification/deployment history is not fresh execution or current deployed identity. |

### Reconciliation after independent discovery

All original obligations below were matched to their actual current producers
and consumers; grouping is not a substitute for examination. The 27 initial
scopes plus explicit D28 retain all 33 original workflows and all 20 later
groups without forcing either historical count onto the new map.

| Original workflow | Behavioral obligation retained in current examination | Later group |
| --- | --- | --- |
| 1 | Arrival/navigation/Utility/reveal: D07, D26 | W01/W17 |
| 2 | Selected/persisted network and surface/token identity: D01/D02/D08/D09 | W02/W08 |
| 3 | Wallet lifecycle/holdings/outcome authority: D01/D05 | W02/W03/W07 |
| 4 | Drops eligibility/exclusions/translation/rows: D02/D03 | W03/W04 |
| 5 | Time/pause/inventory/unavailable recovery: D06 | W04 |
| 6 | Drops exact approval/trade/confirmation/refresh: D03/D05/D21 | W05/W07 |
| 7 | Exchange quantities/editions/reward/duplicates: D04 | W03/W06 |
| 8 | Exchange per-unit multi-row send/recovery: D04/D05 | W06/W07 |
| 9 | Full-term pair/operator/outcome evidence: D05/D14/D16 | W05/W06/W07 |
| 10 | Admin registration/network reload/wallet authority: D08 | W08 |
| 11 | Admin indication and two pause/recovery scopes: D09/D10 | W08/W09 |
| 12 | Treasury complete FA2/batch recipient/recovery: D11/D12 | W10 |
| 13 | XTZ/MAX/exact mutez/admin recipient/recovery: D11/D12/D22 | W10 |
| 14 | Drops pair enumeration/set/edit/cleanup/session: D13/D14 | W11 |
| 15 | Exchange pair target/locked redeem/scoped writes: D09/D13/D14 | W11 |
| 16 | Drop normalization/translation/range/Auto/manual preview: D15 | W12 |
| 17 | Cached chunk send/authority/partial/unknown: D16 | W12 |
| 18 | Countdown/unpause/checklist/supply/status: D06/D16 | W12/W13 |
| 19 | Complete Health/CMS/economics/forced/unknown: D23 | W13 |
| 20 | Catalog/title/thumb/cache/generated identity: D23/D24 | W13/W18 |
| 21 | Local authoring UI/provider/consumer invalidation: D15/D17/D19 | W14 |
| 22 | Browser/loopback/nonce/repository/preview authority: D17/D19 | W14/W15 |
| 23 | CAS/archive/journal/rollback/reconcile/exclusion: D20 | W15 |
| 24 | Projection/mirror/watch/build equality: D18/D20/D26 | W15 |
| 25 | Direct every-item trade terms/FA2/custody/atomicity: D21 | W16 |
| 26 | Direct pair creation/update/cleanup/cardinality/ABI: D22 | W16 |
| 27 | Direct privileged pause/rescue/XTZ/default: D22 | W16 |
| 28 | Signer provisioning/preflight/confirmation/readback: D27 | W19 |
| 29 | Source/certified/frozen/promoted/deployed provenance: D28 | W20 |
| 30 | Input/backfill/optimizers/manifest coordination: D24 | W18 |
| 31 | Exported CMS pagination/mutation/asset/publication: D25 | W18 |
| 32 | Local shell/early/full loaders/Pages delivery: D07/D26 | W01/W17 |
| 33 | Admin dev/provider/mirror/build/harness/isolation: D17–D20/D26/D27 | W14/W15/W17 |

Consolidated equivalence, with distinct behavior retained: W01→D07;
W02→D01; W03→D01/D02/D04/D11; W04→D02/D06;
W05→D03/D05/D21; W06→D04/D05; W07→D05;
W08→D08/D09; W09→D10/D22; W10→D11/D12/D22;
W11→D13/D14/D22; W12→D15/D16; W13→D16/D23;
W14→D17/D19; W15→D18–D20; W16→D21/D22;
W17→D07/D26/D27; W18→D23–D25; W19→D27; W20→D28.
No consequential scope was discarded. The report separately reassesses all
CHR-001–007, AUD-002-001–011, AUD-003-001–020 (including 015/008 alias),
AUD-004-001–005, AUD-005-001–005, AUD-006-001/002, AUD-007-001,
AUD-008-001/002 and AUD-009-001. Accepted AUD-005-001 is preserved; the
current checklist replaces the corrected historical lock ticket with only 001.

### Actual verification on the reviewed revisions

Logs are ignored `audits/work/AUD-010-*.log`. Broad checks/builds were deferred
until examination completion. File-writing configuration tests and builds used
reviewed existing wrappers that copy current source into fresh bounded audit
directories, excluding actual journals/locks/archives. Builds use existing
dependency junctions without installation; finally blocks unlink junctions
before deleting only the verified created copy. Real caches/dist/generated
files/assets/source and operational state were preserved. No production fixes
were made, so the builds establish source/build compatibility, not remediation.

| Actual command | Observed outcome |
| --- | --- |
| `node audits/repro/AUD-010-pair-readiness-repro.mjs`; `node --check audits/repro/AUD-010-pair-readiness-repro.mjs` | Defect plus unique/removal controls pass; final syntax/repeat recorded in `readiness-final.log`. Exit 0 demonstrates the finding. |
| `npm run test:drop-params:lock` | 17 pass, zero fail/skip/TODO in `lock-permitted.log`. Initial sandbox run: 16 pass/one real-child `spawn EPERM`; permitted rerun resolves it. Default-grace delayed creation and real filesystem/child controls execute. |
| `node --test --experimental-vm-modules --experimental-test-isolation=none shared/fa2-balances.test.mjs shared/beacon-setup.test.mjs shared/public-trade-freshness.test.mjs shared/public-trade-outcomes.test.mjs shared/public-trade-pairs.test.mjs shared/public-confirmation-deadline.test.mjs drops/js/trade-lifecycle.test.mjs exchange/js/exchange-wallet.test.mjs` | 298 pass; zero failures/skips/TODOs, exit 0 (`public.log`). |
| Admin `npm run test:runtime` | 2,092 pass; zero failures/skips/TODOs, exit 0 (`admin-runtime.log`). |
| `node audits/repro/AUD-004-config-suite.mjs` | Current copied authoring/transaction/service/projection/watcher suites: 25/19/10/90/1 pass; no failures/skips/TODOs, exit 0 (`config.log`). Inner TAP is not counted twice. |
| `node --test --experimental-vm-modules --experimental-test-isolation=none shared/drop-time.test.mjs shared/drop-countdown.test.mjs drops/js/countdown.test.mjs drops/js/countdown-lifecycle.test.mjs shared/chain-registry.test.mjs shared/hen-identity.test.mjs drops/js/drop-compatibility.test.mjs drops/js/token-rendering.test.mjs drops/js/reveal-coordinator.test.mjs drops/js/wallet-rendering.test.mjs drops/js/burn-quantity.test.mjs loaders/loader-architecture.test.mjs scripts/verify-pages-loader-artifacts.test.mjs scripts/shadownet-exchange-pairs.test.mjs scripts/public-navigation.test.mjs scripts/parcel-source-map-sources.test.mjs scripts/mainnet-runbook.test.mjs` | 134 pass; zero failures/skips/TODOs, exit 0 (`supporting.log`). |
| `node shared/public-trade-ops.fixtures.mjs` | All assertions pass; exit 0 (`trade-fixtures.log`). Legacy unscoped balance-delta fixtures do not authorize current journal cleanup. |
| `node assets/thumbs/scripts/thumbs.test.mjs` | 27 pass, zero failure/skip, exit 0 (`thumbs-permitted.log`). Initial sandbox run had ten `spawn EPERM` coordination failures; permitted rerun resolves them without changing tests. |
| `node assets/webflow-cms/webflow-cms.test.mjs` | 39 pass, zero failure/skip (`cms.log`). Inert API/image tests, no remote mutation. |
| Admin `npm run test:thumbs`; `npm run check:thumbs` | 37 pass; actual manifest freshness passes without writing, nine contracts/133 references/67 assets (`admin-thumbs.log`, `manifest.log`). |
| `node audits/repro/AUD-005-contract-abi-check.mjs` | Six actual Admin write encodings plus both actual Public builders decode with exact large nat identity (`abi.log`). No Michelson typecheck/execution. |
| `node audits/repro/AUD-004-contract-provenance-check.mjs`; `node audits/work/AUD-009-frozen-hashes.mjs` | Mechanical canonical/snapshot/stripped fixture and frozen/promoted LF correspondence; 31/31 frozen checkout/HEAD-blob identities pass (`provenance.log`, `frozen.log`). Read-only existing scripts reused. |
| `python -B 'docs/EA-XYZ Contract Audit/tests/verify-invariant-coverage.py'` | 26/26 invariants, 181/181 obligations, 13 mapped scenarios pass; exit 0 (`invariants.log`). Mapping is not execution. |
| `node audits/work/AUD-009-build-copy.mjs`, invoking Outer `npm run build:pages:staging` then Admin `npm run build:clean` | Both builds pass in disposable current tracked-file copy; exit 0 (`builds.log`). Mirror/manifest guards and production authoring pruning/isolation pass. Existing Browserslist-age/bundle-size information is retained. Reviewed existing wrapper reused; real outputs untouched. |

Final source syntax/reproduction, focused diff/whitespace/status and separate
`npm run ticket:diff` exports are checked during handoff. Index bytes and
staged-entry snapshots are compared against retained baselines; HEADs/branches
are checked again. Exports contain current audit files only; Admin has no diff.

### Limits and final-pass disposition

Local source and isolated verification do not establish live Webflow DOM/CMS,
browser/Beacon/wallet/Web Locks/storage behavior, RPC/indexer consistency or
balance-level attribution/reorg/finality, time/IPFS/GitHub raw, CI/hosting or
actual contract/FA2 identity and execution. No application remote integration,
service startup, wallet/transaction, operational mutation, recovery or deployment
ran. Primary interface documentation and installed dependency sources informed
the examination; links and TzKT documentation retrieval limits are in the report.

Fresh legacy SmartPy compile/tests, native Michelson typecheck/execution, Outer
production build, both-variant first-paint build verifiers, actual Pages branch
assembly, fresh Node-20/Linux installation/CI and browser smokes were not run.
The dated specialist certification is preserved, not relabeled as fresh evidence.
AUD-005-001's accepted external-editor limitation remains outside supported
writer guarantees; no new supported-path evidence changes its disposition.

All declared behavioral scopes and reconciled obligations are examined with
these external/toolchain boundaries explicit. AUD-010-001 is material and remains
unfixed under investigation-only scope. Therefore **COMPLETE / NOT CLEAN**;
the provisional/final-clean refresh procedure is inapplicable, not a skipped
requirement for a clean claim. No clean report, extra audit requirement, merge
approval or release authorization is issued. Historical records remain below.

## AUD-009 — independent full-application investigation (2026-11-24)

**COMPLETE / NOT CLEAN.** One fresh source-driven examination completed across
both independent repositories on `ticket-AUD-009-full-correctness-review`:
Outer `92d9b75ac70f4e4eeb2419ee71dc59b8f4621fcf`, Admin
`57e9fb616526e2a0c9da34643c180e10a16e5f7b`, both initially clean. Production
source is unchanged. [AUD-009 findings](AUD-009-findings.md) records one confirmed
P2 supported lock-acquisition race and the historical correction reassessment.
No consequential local source hypothesis remains unexamined; external/toolchain
limits below qualify the assurance, rather than pretending those systems ran.
The unresolved material finding precludes a provisional clean verdict; the
conditional independent clean-result coverage refresh is not applicable.

### Independent discovery and expected properties

Before opening historical audit maps/findings, discovery followed current runtime
registrations, supported actions, background entries, contract entries, package
commands and CI. Reverse searches started at wallet requests, FA2/XTZ effects,
mapping/file/CMS writes and reported success/LIVE/readiness. Boundary traces
followed account/network authority, source/display/chain IDs, exact amounts,
RPC/indexer evidence, source/JSON/Admin mirror, loaders and published artifacts.
The original 25-candidate checkpoint is retained, without retroactive rewriting,
in ignored `audits/work/AUD-009-discovery.md`. D25 below separates its already
discovered provisioning, delivery and provenance obligations for assessment.
History was consulted afterward for reconciliation, not used as a starting list.

Expected properties come from project intent and authorized contracts: only the
current account/admin may authorize the exact intended target/IDs/amounts;
grouped asset movements must preserve routing and fail atomically on rejection;
partial/unknown observations cannot become complete absence or success;
obsolete async work cannot own new state; ambiguous submissions retain recovery;
source publication must preserve ownership and recover without destroying newer
state. Tests and safeguards were challenged against these properties, not
accepted as their own oracle. Protocol grounding used identified installed
Beacon 4.8.1/Taquito 19.0.2 sources and primary
[FA2 documentation](https://docs.tezos.com/architecture/tokens/FA2),
[Michelson documentation](https://octez.tezos.com/docs/active/michelson.html) and
[Webflow list pagination](https://developers.webflow.com/data/reference/cms/collection-items/staged-items/list-items).
Those specifications do not establish an actual external implementation's truth.
Current TzKT documentation retrieval was unavailable; endpoint assumptions were
examined in source/fixtures, without a live provider claim.

### Completed workflow examination

Each row records the supported entry-to-effect path and meaningful branch/order
obligations examined. File references are repository-relative, with Admin paths
explicitly identified. All rows are examined; “no additional finding” means no
other confirmed material supported-path defect, not proof of absent defects.

| Discovery | Source path and examined behavioral obligations | Result / evidence boundary |
| --- | --- | --- |
| D01 Public startup/navigation/Utility | `webflow/*`, four routers/environment loaders, `shared/public-first-paint.js`, Home/Utility entry modules and shell inline programs: hostname routing, duplicate boot, optional nodes, font/image errors, mask/reveal release, wallet-control retention, local footer/navigation and collection images. Startup completion was followed into the actual page owners, not inferred from bundle emission. | No additional finding. Loader/reveal/navigation fixtures pass; live Webflow custom code and presentation remain unverified. |
| D02 Public wallet lifecycle | `shared/beacon-setup.js`, both page event handlers/config: stored account/network validation, connect/permissions deduplication, disconnect/reconnect, same/replacement account, boot versus newer event, old rejection/mismatch clearing and request/render retirement. Exact surface addresses and capture around awaits remain distinct from displayed connection state. | No original stale-clear regression. Actual wallet/SDK transport unverified; source and inert wallet fixtures only. |
| D03 Complete holdings and identity | `shared/tzkt-fa2-balances.js`, Public rendering/config and Admin readers: cursor progression, malformed/duplicate rows, full-page continuation, short-page termination, timeouts/page bounds, exact contract/token strings, unsafe/zero balances, account ownership and WeakMap-bound projection freshness. Missing/unknown versus zero is followed into selection/MAX/status, including failed refresh/retry. | No additional finding. Complete paging/identity/quantity fixtures pass; indexed truth is external. |
| D04 Drops configuration/select/cart | `drops/js/events.js`, compatibility/config/token rendering, shared authoritative params: supported burn/redeem shape, canonical exclusions before translation, CMS template identity, quantity and configured amounts, metadata/image/supply commit barrier, selection reset, wallet repaint and restored rows. Final payload uses validated configuration/selection rather than display labels. | AUD-007 namespace correction remains. Runtime compatibility, burn quantity, rendering and reveal cases pass. |
| D05 Drops time/pause/inventory/LIVE | `shared/drop-time.js`, `drop-countdown.js`, Drops countdown/events: strict date/time/DST gaps and folds, trusted UTC latency/age/drift/jump/suspension checks, boolean pause, supply including configured multi-unit redemption, initial failure retry, polling after LIVE, zero/sold-out stop, page visibility/restart and stale request retirement. Entry and final-send gates both traced. | No original later-pause/insufficient-inventory regression. Time/pause/inventory source and deterministic cases; actual clocks/providers unverified. |
| D06 Exchange economics/cart | `exchange/js/exchange.js` and config: exact supported burn identity and locked ACID redeem, rates/edition reward, reserve and wallet snapshots, duplicate row aggregation, safe positive integers, per-token 20/total 50 limits, reward overflow, cart changes/clear/tabs/quantity controls and account-owned rendering. Every repeated unit is represented in the submitted list. | No additional finding; wallet/cart/quantity and actual-builder fixtures pass. CMS/provider values not observed live. |
| D07 Public approval/pair/build/send | Both Public handlers and `shared/public-trade-ops.js`: exact six-term unique pair resolution through complete pages, malformed/duplicate/no-match rejection, exact existing operator versus add-operator fallback, owner/operator/token/entrypoint/zero tez, batch serialization and final account/cart/LIVE/inventory checks inside submission ownership. Missing approvals and FA2 rejection remain distinct from preflight evidence. | Actual builders decode against promoted ABI. Direct escrow effects assessed in D09; no real permission/operation request sent. |
| D08 Public retained outcome/recovery | Shared submission journal/receipt/pollers plus both consumers: reserve before wallet, bounded records/storage failure, scoped Web Locks, rejected versus unknown/no-hash/late hash, account/network/page/tab/reload conflicts, attributed full receipt, timeout across fetch/body/retries and final completion ownership. Fresh balance evidence requires full snapshot/scope/relevant applied level, with incoming tokens, duplicates, absent zero rows, retry and terminal outcomes; no mandatory net depletion. | AUD-008-001 correction retains its intended behavior. Freshness/outcome/deadline fixtures pass. Browser storage/locks, wallet ambiguity and real finality unverified. |
| D09 Direct contract trade | Canonical `contracts/burn-redeem-escrow/smartpy/burn-redeem-escrow-smartpy.py`, helpers/types/init and both serializers: paused/empty rejection; every item's sender, user and all six pair terms; grouped user-to-sink burns and escrow-to-user redeems; repeated and heterogeneous items; first/later invalid item; aggregate insufficiency, revoked operator, external transfer rejection, attached tez and atomic rollback expectations/events. Honest versus no-op/malicious FA2 assumptions were distinguished. | No new source defect. Embedded mock is not an operator oracle. Standalone fixture/source/invariant/ABI evidence only; no fresh legacy or native execution. |
| D10 Direct contract administrator/custody | Same canonical source: admin-only toggle/rescue/XTZ withdrawal; zero/positive amount, insufficient balance, recipient and actual admin destination, payable/default handling, failed external transfer/rollback, storage invariance and events. No unrequested admin/burn-address setter inferred. Sink custody is not conflated with destruction. | No additional finding. All supported direct-call branches traced; current chain storage/external FA2 unverified. |
| D11 Direct pair mapping/ABI | Same canonical source: create/update/cleanup, positive amounts/distinct identities, exact pair IDs, duplicate and intra-batch IDs, missing cleanup behavior, mapping cardinality and failed later entries. Admin create/edit/cleanup and Public trade encodings matched to promoted parameter schema, including nat above JS safe range. | No additional finding. Decoder compatibility is not Michelson typecheck/execution. |
| D12 Admin bootstrap/network/wallet | Admin `src/admin.js`, `network.js`, `beacon-setup.js`, `utils/live-cfg.js`, `escrow-ops.js`, indicator/status: registration and both surfaces, network reload/missing target, persisted accounts, permission/SDK/disconnect epochs, same-account allowance, current administrator reads and final captured authority at every privileged caller. Indication is not used as signing authority. | No original authority regression. Mainnet remains incomplete; actual wallet/network switch unverified. |
| D13 Both Admin pause scopes | Admin pause controller/recovery, Exchange status and operation helper: target/admin/read generation, explicit toggle semantics, reserve before send, unknown/rejected/late-hash outcomes, durable repeat/inverse conflict exclusion and recovery after reload, applied/failed evidence and scoped non-bubbling broadcasts. Old/failing state reads and replacement account cannot authorize obsolete intent. | No additional finding. Stale display alone does not change deliberate toggle semantics. Runtime recovery/authority cases pass. |
| D14 Both treasury scopes | Admin treasury transfer/withdraw/table/lifecycle/config/status/recovery, `tzkt-api.js`, operation helper: complete token inventory, recipient/token grouping, exact MAX snapshot, integer FA2 and six-decimal mutez parsing, unsafe/exponent/negative rejection without rewriting, current target/admin across awaits, whole-intended operation matching including reveal/internal effects and recovery retention through unknown/partial outcome. Failure/retry/reset/account changes retire publication. | No original treasury correction regression. Runtime cases and actual ABI payloads pass; no funds moved. |
| D15 Both pair management scopes | Admin pair controllers, Exchange pair controller, setpanel, modal content/widgets/validators, catalog and API/helper: complete/malformed pages, target-specific custody/availability, exact stored IDs for amount-only edit, custom/local token modes, automatic/manual IDs, locked Exchange redeem, create/update/cleanup confirmations, input/modal/session/reset ownership and failures at each await. Initial modal metadata producers are local-only; injected delayed remote metadata was not treated as a supported producer. | No additional finding. Captured authority spans availability/permissions and final request; runtime cases pass. |
| D16 Admin source/load/preview | Admin Drops providers/state/public-state, data/builder/translationAudit/exact-token-id/load/controller/view: mirror/network/schema, normalized snapshot and canonical exclusions, IDs/amounts, catalog translation, manual/Auto ranges/chunks, duplicate identity and limits, cache versus generated/rendered preview, request epochs for old success/rejection, reset/provider/account changes and invalid input. | AUD-006-001/AUD-007 corrections remain. Current composed runtime/load cases pass. |
| D17 Admin chunk send/status | Admin Drops send/status/pair-status/controller/panel and escrow helper: send from reviewed cached intent, disabled/mutated controls versus true controller authority, each chunk's final account/network/preview checks, complete intended receipt, failure/unknown before and after a partial batch, retained progress, duplicate handling, cancellation and same-context status ordering. Repainting/retry cannot silently imply remaining chunks succeeded. | AUD-005-002/AUD-003-006 corrections remain. Runtime/ABI fixtures; no batch submitted. |
| D18 Readiness/supply/countdown/unpause | Admin checklist/countdown/controller/provider consumers: exact current params/scope, supply unknown versus zero and dependent sold-out recomputation, chain/CMS/local/GitHub dots with epochs/throttle/forced reads, scheduled phase, preview/poll/abort owner, manual unpause and late completion across new previews. Provider content changes invalidate readiness even if writer health remains READY. | AUD-008-002 and AUD-006-002 corrections remain across composed consumers. Runtime cases pass; remote dots/chain not live verified. |
| D19 Authoring/preview/save/archive/recovery | Admin authoring controller/state/form/view/client/provider and Outer authoring/transaction/archive/recovery modules: exact schema, valid inactive config, canonical serialization, preview binds base/source/hash/network/operation, edit-after-preview, single-use expiration, apply/deactivate acknowledgement, archive provenance, idempotence and readback. Writer snapshots/journal precede publication; source/JSON/mirror equality includes falsy data; rollback/reconcile preserve divergent newer files and unresolved state. | No new schema/recovery trigger. Shared serialization is separately defective in D21. AUD-005-001 unsupported external read/replace race remains accepted. |
| D20 Loopback HTTP/provider ownership | Authoring service/launcher and Admin provider/development client: loopback host/origin, session nonce/repository, method/routes, bounded body, preview token/source binding, timeout through body, late mutation ambiguity, health loss/error/reconnect and trusted-snapshot retirement. Production provider remains distinct from development writer authority. | No original timeout/health regression; copied service/provider cases pass. No real service started or process killed. |
| D21 Shared publication/projector/watch/build lock | Projector/transaction/recovery/archive plus generator/watcher/CLI/mirror guards: choosing/waiting/owned claims, live/dead/invalid metadata, concurrent acquisition, timeout/release, nested AsyncLocalStorage capability, drift, pending/reconciliation exclusion, CAS before rename, byte/base ownership on rollback, rapid watch drains and once/build propagation. Reclamation was challenged across incomplete claim publication, rather than accepting existing ordinary concurrency controls. | **AUD-009-001 confirmed:** two supported live acquisitions own concurrently after delayed invalid-claim revival/reclamation. Isolated unchanged-source repro and controls pass repeatedly. No operational journal/lock touched. |
| D22 Health/CMS/economics/catalog | Admin Health/CMS controller, CSV/token-econ, cache/store, local catalog/title/HEN/chain UI/NFT helpers: complete indexed balance/holder/pair enumeration, malformed/unknown versus zero, explicit economics and CANAAN ACID, cache and manual forced refresh, stale/failing completion, displayed actionable conclusions and supply-dependent invalidation. Active local UI metadata distinguished from dormant remote recovery exports. | No original unknown-as-healthy/cache regression. Current Health/runtime fixtures pass; CSV/CMS/provider truth remains external. |
| D23 Thumbnail/asset tooling | Outer thumbs input/backfill and optimizers; Admin generator/shared manifest capability: numeric/suffix/collection/URL/JS identity, skipped/existing/original files, path/output bounds, input exclusivity, standalone generation under same ownership, manifest/asset rollback, ambiguous failure/manual retained lock and cross-repo publication. Generator rejection does not become success; unsupported names fail without discarding originals. | No additional finding; 27 Outer and 37 Admin cases plus real read-only manifest check pass. Real assets preserved. |
| D24 Exported Webflow CMS/asset API | `assets/webflow-cms/webflow-cms.mjs`: supported exported list/read/write/publish/upload/delete capability despite no current UI caller, complete pagination/total/unique IDs and malformed/partial rejection; transport/status/body/upload ambiguity without blind mutation retry; reconciled identity, API result versus published content, binary/perceptual image verification and redacted diagnostics. | No additional finding; 39 local CMS cases pass. No live site inspected or mutated. |
| D25a Provisioning | `scripts/shadownet-exchange-pairs.mjs`: inert default, explicit signer/send gate, fixed chain/admin/escrow/ABI/terms, exact integers, preflight/readback, already-correct/conflicting/partial state, confirmation and final evidence. No invocation of an operational send path. | Source and isolated provisioning fixtures pass; actual signer/chain unavailable and unauthorized. |
| D25b Builds/delivery/dev/export | Both packages, dev-port/Parcel/watch/authoring launchers, sanity harness/server, source-map normalization, first-paint/artifact verifiers, Admin mirror/production isolation/pruning, Pages CI and diff exporter: startup errors/drain, dev versus production authority, correct branch artifact roots, complete local bundle references, stale/mixed artifact exclusion, private export index and failure cleanup. Production verifiers needing both variants were not falsely claimed run. | Supporting fixtures and isolated required builds pass. Actual branch assembly, Linux CI, browser/hosting and production Outer build unverified. |
| D25c Contract provenance | Current canonical source/snapshot/stripped fixture, promoted/frozen artifacts and Phase-7/8/10/11 records: exact bytes versus LF equality, recorded compiler differences and trust, release authorization versus current source, deployment records versus present code/address. Certification was not reused as a fresh executable check. | 31/31 manifest checkout/current-HEAD-blob hashes, mechanical provenance, ABI and invariant-map checks pass. Legacy/native execution and current deployed identity unverified. |

### Behavioral equivalence with the original 33-workflow enumeration

This reconciliation was performed after discovery/examination. Each retained
obligation is matched to actual examined producers/consumers above; shared group
membership alone does not establish coverage.

| Original | Retained behavioral obligation / AUD-009 examination | Later group |
| --- | --- | --- |
| 1 | Arrival, local navigation, Utility and reveal/loading ownership: D01, D25b | W01, W17 |
| 2 | Selected/persisted network and exact surface/token target identity: D02, D12 | W02, W08 |
| 3 | Wallet lifecycle, complete holdings and restored outcome authority: D02, D03, D08 | W02, W03, W07 |
| 4 | Drops eligibility, exclusions, translated IDs and selectable/rendered identity: D03, D04 | W03, W04 |
| 5 | Trusted time, current pause, inventory and recovery: D05 | W04 |
| 6 | Drops exact trade/approval/receipt and refreshed owner: D07, D08 | W05, W07 |
| 7 | Exchange cart, edition economics, quantities and duplicate aggregation: D03, D06 | W03, W06 |
| 8 | Exchange per-unit/multi-row submission and post-trade recovery: D06–D08 | W06, W07 |
| 9 | Unique full pair/operator terms and attributed whole outcome: D07, D08 | W05–W07 |
| 10 | Admin boot/network reload/current wallet authority: D12 | W08 |
| 11 | Admin indication and both scoped pause/recovery surfaces: D12, D13 | W08, W09 |
| 12 | Full FA2 Treasury, exact transfer/batch recipient and recovery: D03, D14 | W10 |
| 13 | Exact XTZ/MAX, admin destination and recovery: D14 | W10 |
| 14 | Drops pair list/set/availability/edit/cleanup/session: D15 | W11 |
| 15 | Dedicated Exchange pair target, locked redeem and scoped effects: D15 | W11 |
| 16 | Drop normalization, translation, Auto/manual ranges and preview: D16 | W12 |
| 17 | Cached send, per-chunk authority, partial/unknown continuation: D17 | W12 |
| 18 | Countdown/manual unpause, status/checklist/supply dependency: D05, D18 | W12, W13 |
| 19 | Complete Health/CMS/economics/forced refresh/unknown: D22 | W13 |
| 20 | Local catalog/title/thumb/cache and generated identity: D22, D23 | W13, W18 |
| 21 | Local authoring UI/provider/session and consumer invalidation: D16, D18–D20 | W14 |
| 22 | Browser/loopback/repository/nonce/preview authority: D20 | W14, W15 |
| 23 | Writer CAS/archive/journal/rollback/reconciliation/exclusion: D19, D21 | W15 |
| 24 | Projection/mirror/watch/build equality and drift: D21, D25b | W15 |
| 25 | Direct trade every-item terms/sender/grouping/custody/rollback: D09 | W16 |
| 26 | Direct mapping create/update/cleanup/cardinality and payloads: D11 | W16 |
| 27 | Direct admin pause/rescue/XTZ/default: D10 | W16 |
| 28 | Signer provisioning CLI, exact terms/confirmation/readback: D25a | W19 |
| 29 | Source/certification/frozen/promotion/deployment provenance: D25c | W20 |
| 30 | Asset/thumb input/backfill/optimizers/manifest ownership: D23 | W18 |
| 31 | Exported CMS API pagination/mutation/asset/publication evidence: D24 | W18 |
| 32 | Public shell/early/full-loader graph and Pages delivery: D01, D25b | W01, W17 |
| 33 | Admin dev/provider/mirror/build/harness/production isolation: D19–D21, D25b | W14, W15, W17 |

### Reconciliation with all 20 later groups

| Group | Current examination preserving its distinct scope |
| --- | --- |
| W01 Arrival/navigation/Utility/reveal | D01 plus D25b loader ownership, including local shell inline programs, not only the wallet pages. |
| W02 Public wallet | D02 current/persisted authority and both page consumers; D08 restored scoped submission. |
| W03 Holdings/identity | D03 complete pager and consumers, D04 translated eligibility, D06 aggregated Exchange identity. |
| W04 Drops time/pause/inventory | D04 configuration/UI barrier and D05 continuing LIVE/poll/retry/final gates. |
| W05 Drops trade/approval | D07 exact builder/approval/full-term pair plus D09 actual direct-call effects. |
| W06 Exchange | D06 economics/cart/bounds, D07 per-unit request and D08 attributed freshness/recovery. |
| W07 Public outcomes | D08 persistence, ambiguous/no-hash/hash/confirmation and snapshot freshness through both handlers. |
| W08 Admin boot/authority | D12 all registrations/network/wallet/admin indication and final operation helper consumers. |
| W09 Pause/recovery | D13 both independent scopes and broadcasts, D10 actual toggle authority/effect. |
| W10 Treasury | D14 both FA2 and XTZ scopes, D03 complete inventory, D10 direct custody/withdraw effects. |
| W11 Pairs | D15 both surfaces/manual/custom/Auto/modal/cleanup plus D11 mapping/payload invariants. |
| W12 Drop load/send | D16 load/preview, D17 per-chunk send/status and D18 countdown/unpause ownership. |
| W13 Checklist/Health | D18 readiness/dependent supply and D22 full economics/CMS/cache/catalog evidence. |
| W14 Authoring/provider | D19 preview/save/archive/consumer propagation and D20 HTTP/deadline/health trust. |
| W15 Writer/projection | D19 recovery/CAS, D21 lock/watch/generation/drift, D25b mirror/build interlocks. New lock finding included rather than accepting historical supported-writer claims. |
| W16 Contract direct entries | D09–D11 all eight entries plus actual client ABI boundaries and external-FA2 oracle limitations. |
| W17 Build/release/dev | D25b both command/CI/loader graphs and D01 bootstrap; actual local required builds distinguished from unexecuted deployment/CI. |
| W18 Thumbs/CMS | D23 local asset/manifest transactional behavior and D24 exported API capabilities, even without current runtime consumers. |
| W19 Provisioning | D25a retained separately from ordinary UI and from direct contract validation. |
| W20 Provenance | D25c retained separately from ABI decoding and historical certification; current deploy identity remains unverified. |

No consequential scope was dropped by consolidation. All CHR-001–007,
AUD-002-001–011, AUD-003-001–020 (including 015/008 alias), AUD-004-001–005,
AUD-005-001–005, AUD-006-001/002, AUD-007-001 and AUD-008-001/002 were reassessed
against these revisions; the report's family ledger gives current dispositions.
AUD-005-001 remains accepted unsupported external-edit concurrency; new
AUD-009-001 is supported lock contention. Historical defect-asserting scripts are
not silently treated as current regression gates. No unrelated fix or new
investigative requirement was added to the final one-root checklist.

### Verification on the examined revisions

Logs below are ignored `audits/work/AUD-009-*.log`. Node v22.16.0/npm 10.4.0;
installed Beacon 4.8.1, Taquito 19.0.2, Parcel 2.16.4. No install/network mutation.
Broad suites/builds were deferred until examination completion. Configuration
tests and builds used bounded disposable copies, excluding actual operational
state; dependency junctions used existing installations. Only created copies
were removed, after absolute path validation and unlinking build junctions.
Real caches, generated source/JSON/mirror, dist, archives, locks, recovery state
and pre-existing local assets were preserved.

| Actual command / scope | Outcome |
| --- | --- |
| `node audits/repro/AUD-009-writer-lock-repro.mjs`; `node --check audits/repro/AUD-009-writer-lock-repro.mjs` | Initial, repeat and final race/control observations pass; final syntax passes; exit 0. `lock-repeat.log`, `lock-final.log`. Exit 0 observes the defect. |
| `node --test --experimental-vm-modules --experimental-test-isolation=none shared/fa2-balances.test.mjs shared/beacon-setup.test.mjs shared/public-trade-freshness.test.mjs shared/public-trade-outcomes.test.mjs shared/public-trade-pairs.test.mjs shared/public-confirmation-deadline.test.mjs drops/js/trade-lifecycle.test.mjs exchange/js/exchange-wallet.test.mjs` | 298 pass, zero failures/skips/TODOs; native command exit 0 (`public-native.log`). Initial complete passing TAP was wrapped in PowerShell's VM experimental-warning error; the native-redirection rerun resolved the exit status. |
| Admin `npm run test:runtime` | 2,092 pass, zero failures/skips/TODOs; exit 0 (`admin-runtime.log`). |
| `node audits/repro/AUD-004-config-suite.mjs` | Isolated unchanged authoring/transaction/service/projection/watcher suites: 25/19/10/90/1 pass respectively, no failures/skips; exit 0 (`config.log`). Initial sandbox child spawn EPERM resolved by permitted rerun. Inner test TAP within projection assertions is not added again to these totals. |
| `node --test --experimental-vm-modules --experimental-test-isolation=none shared/drop-time.test.mjs shared/drop-countdown.test.mjs drops/js/countdown.test.mjs drops/js/countdown-lifecycle.test.mjs shared/chain-registry.test.mjs shared/hen-identity.test.mjs drops/js/drop-compatibility.test.mjs drops/js/token-rendering.test.mjs drops/js/reveal-coordinator.test.mjs drops/js/wallet-rendering.test.mjs drops/js/burn-quantity.test.mjs loaders/loader-architecture.test.mjs scripts/verify-pages-loader-artifacts.test.mjs scripts/shadownet-exchange-pairs.test.mjs scripts/public-navigation.test.mjs scripts/parcel-source-map-sources.test.mjs scripts/mainnet-runbook.test.mjs` | 134 pass, zero failures/skips/TODOs; exit 0 (`supporting.log`). |
| `node shared/public-trade-ops.fixtures.mjs` | All assertions pass; exit 0 (`trade-fixtures.log`). |
| `node assets/thumbs/scripts/thumbs.test.mjs`; `node assets/webflow-cms/webflow-cms.test.mjs` | 27 and 39 pass; zero failures/skips; exit 0 (`assets.log`). |
| Admin `npm run test:thumbs`; `npm run check:thumbs` | 37 pass; actual manifest check passes without writing; exit 0 (`admin-thumbs.log`). |
| `node audits/repro/AUD-005-contract-abi-check.mjs` | Six current Admin write types and both actual Public trade serializers decode, retaining large nat identity; exit 0 (`abi.log`). |
| `node audits/repro/AUD-004-contract-provenance-check.mjs` | Canonical/snapshot exact identity, mechanical stripping with unchanged target and frozen/promoted LF identity; exit 0 (`provenance.log`). |
| `python 'docs/EA-XYZ Contract Audit/tests/verify-invariant-coverage.py'` | 26/26 invariants, 181/181 obligations, 13 mapped tests; exit 0 (`invariants.log`). Initial shell quoting failure corrected; no application failure waived. This verifies mapping, not SmartPy execution. |
| `node audits/work/AUD-009-frozen-hashes.mjs` (read-only one-off manifest comparison) | 31/31 frozen checkout and current HEAD-blob identities; exit 0 (`frozen.log`). |
| `node audits/work/AUD-009-build-copy.mjs`, invoking Outer `npm run build:pages:staging` then Admin `npm run build:clean` | Both pass in fresh tracked-file copy; exit 0 (`builds.log`). Admin check/sync/guard, production authoring pruning and isolation pass. Existing Browserslist age warning and emitted bundle sizes retained. Copy removed safely; original outputs/caches untouched. |

Source verification does not establish actual browser/wallet/transport,
Web Locks/storage, RPC/indexer/finality, clock/IPFS/GitHub raw, Webflow/CMS/hosting,
CI or deployed contract truth. Testnet is Shadownet; configured legacy root is
`KT1SZFfxFfRkbTcDUS17y1WVCKeudoLo8LX5`, dedicated Drops target
`KT1HMCqYqyP9fTDjzm8KAfyPhFn3tpmSW4kc`, dedicated Exchange target
`KT1Ue9es4biDzt528YhNctPGcNeqw9nDXnSv`. Admin testnet's compatibility escrow
routes to Drops. These are source identities; Mainnet remains incomplete.
No real operation, live Webflow query/mutation, dev server or operational recovery
ran. Production Outer build, both-variant first-paint build verifiers, actual
Pages branch assembly, fresh Node-20/Linux CI install, legacy SmartPy execution,
fresh compilation and native Michelson execution/typecheck were not performed.
Historical pristine certification is preserved evidence, not a fresh execution.
The accepted unsupported-editor limitation is neither removed nor counted as a
new remediation ticket. Final changes are audit evidence only; no merge/launch
approval, clean-result refresh or `audits/report.md` is implied.

## AUD-008 — independent full-application investigation (2026-11-24)

**COMPLETE / NOT CLEAN — complete source examination and historical reconciliation.**
Reviewed source starts at Outer `476b83c7267ce46dd2316942d122a983a44f6817`
and independent Admin `bfb9d26cb327723cbd6e76db4247ee8b922663fa`, both on
`ticket-AUD-008-full-correctness-review`, initially clean. Investigation artifacts
are the only authorized changes. Node v22.16.0/npm 10.4.0; installed/pinned
Beacon 4.8.1, Taquito 19.0.2, Parcel 2.16.4; no dependency installation.
Public defaults to testnet/Shadownet. Mainnet remains incomplete. Current targets:
legacy registry root `KT1SZFfxFfRkbTcDUS17y1WVCKeudoLo8LX5`, Public and Admin
Drops `KT1HMCqYqyP9fTDjzm8KAfyPhFn3tpmSW4kc`, Exchange
`KT1Ue9es4biDzt528YhNctPGcNeqw9nDXnSv`. These are source configuration,
not observed deployed identities. No browser/wallet/RPC/indexer/Webflow/hosting
or external FA2 observation was performed. Transactions, deployment and
publication are not authorized or claimed. Legacy SmartPy compilation/execution
remains unavailable.
Admin `network.js` now explicitly routes its testnet compatibility escrow key to
the dedicated Drops target; older audit statements about Admin using the legacy
root do not describe this revision.

### Independent initial discovery

Before opening historical audit maps/findings, discovery started at current
runtime registrations, action handlers, contract entries, package commands and
CI. Forward traces located action/background effects; reverse searches started
at wallet requests, asset/XTZ movements, mapping/file writes and readiness/outcome
decisions; boundary traces followed accounts/networks, exact tokens/amounts,
CMS/mirrors, source/projections and loaders/artifacts. The resulting 31 candidate
behaviors and original source references are retained in
`audits/work/AUD-008-discovery.md` (ignored continuation evidence). This is an
initial candidate map, not a predetermined final count. The completed map below
splits two records where authority/effects differ.

| Candidate | Behavioral contract / consequential source boundaries |
| --- | --- |
| D01 | Public wallet boot/connect/disconnect and current account/network authority: shared Beacon and both page consumers |
| D02 | Registry/surface identity and Admin network reload: shared registry/network; Admin network/live-cfg/Beacon |
| D03 | Complete holdings, unknown versus zero and publication ownership: shared FA2 pager; Public and Admin readers |
| D04 | Drops eligibility/exclusions/canonical-to-wallet identity: compatibility/config, token rendering, shared params |
| D05 | Drops metadata/inventory/cart truth: events, CMS templates, supply and reveal owners |
| D06 | Schedule/time/paused/LIVE transitions: shared clock/countdown; public pause polling |
| D07 | Drops exact submission and final account/cart checks: events, shared operations, direct escrow |
| D08 | Exchange ownership/cart/quantity/economic terms: config, exchange, DOM/CMS/holdings |
| D09 | Exchange multi-unit/multi-row submission: exchange, shared operations, direct escrow |
| D10 | Approval and unique exact six-term pair resolution: shared operations, FA2 operators and mapping |
| D11 | Public durable unknown submission, attributed confirmation, balance refresh/retry: store, both consumers, Web Locks/storage/indexer |
| D12 | Home/Utility/shell/startup/reveal/navigation availability: entry modules, first paint, HTML/inline programs |
| D13 | Admin current wallet/send authority and operator indication: Beacon, escrow-ops, indicator |
| D14 | Both Admin pause surfaces/status/toggle uncertainty/recovery: pause/recovery, Exchange status, escrow-ops |
| D15 | Both Admin XTZ withdrawal/MAX/exact amount/destination/recovery: treasury withdrawal and escrow-ops |
| D16 | Both Admin FA2 treasury inventory/batch rescue/exact destination/recovery: treasury transfer/readers and escrow-ops |
| D17 | Admin pair read/edit/cleanup/session ownership and exact IDs: pair controllers/data/modal, escrow-ops |
| D18 | Manual/Exchange pair creation/catalog/availability/mutations: setpanel, exchange-pairs, catalog, escrow-ops |
| D19 | Admin Drops normalize/build/translate/initial/manual/Auto/chunk preview: data/builder/controller/load service |
| D20 | Admin Drops send/status/checklist/countdown/unpause authority: send/status/checklist/countdown services and views |
| D21 | Local authoring/session/preview/apply/readback/provider isolation: authoring graph and shared service |
| D22 | Schema/canonical source/projection/mirror/watch/build equality: shared authoring/projector/generator/watcher; Admin providers/guards |
| D23 | Writer CAS/locks/journals/archive/partial replacement/idempotence/reconciliation: shared transaction/recovery/archive/projector; CLI/API |
| D24 | Catalog/title/thumb/economics/CMS import and health truth: Admin adapters/utils/health and checklist consumers |
| D25 | Direct trade sender/terms/grouped FA2 custody/atomicity/events: SmartPy initiate_trade; both public serializers |
| D26 | Direct privileged pair mutations/cardinality/pause: SmartPy set/update/cleanup/toggle; Admin callers |
| D27 | Direct FA2 rescue/XTZ ingress-withdrawal/admin authority: SmartPy entries/types/helpers; Admin serializers |
| D28 | Thumbnail input/backfill/manifest/rollback/asset identity: Outer thumbs tooling; Admin manifest generator and consumers |
| D29 | Exported CMS/assets pagination/upload/content/mutation ambiguity: Webflow CMS library; no live mutation |
| D30 | Build/delivery/dev/harness/export/provenance/production isolation: packages, loaders, Pages CI, verification/prune/guard/scripts |
| D31 | Contract source/certification/promotion/deployment evidence and signer provisioning: artifacts/records; Shadownet pair CLI |

No application subsystem is excluded. External effects and unavailable live
systems constrain conclusions; discovery does not establish integration behavior.
Historical maps were opened only after preserving this candidate map; completed
row-by-row reconciliation with original 33 and consolidated 20 appears below.
Historical conclusions/tests are not adopted as proof. AUD-005-001's unsupported
external-edit concurrency disposition is retained; no new supported-path lost-edit
defect was established. The final checklist replaces the historical checklist.
Material findings preclude `audits/report.md` and a clean-result coverage refresh.

### Completed examination

The initial 31 candidates are preserved above and in the original ignored note.
The final source-driven map has **33 workflow records**: D23 separates coordinated
filesystem authority (D23a) from browser/loopback API authority (D23b); D31 separates
signer provisioning (D31a) from certified artifact/provenance claims (D31b).
The numerical agreement with the historical 33 is incidental: the boundaries and
associations below were established from current source. No candidate was dropped.
All records are examined at source level; none remains partial. External execution
limits below qualify assurance, not an unexamined local path.

Expected properties derive from project intent, authorized interfaces, current
account/target authority, exact asset/amount/destination identity, conservation,
truthful readiness/outcomes and recovery. The three-lens discovery preceded history.
Forward action/startup/background traces were followed to effects, reverse traces
returned from every send/write/readiness sink to all current producers, and boundary
traces reconciled independently owned source, cache, DOM, provider and chain state.
Existing tests and historical fixes were challenged as evidence, never adopted as
the expected property. Source scope includes exports with no current caller; dormant
private helpers do not invent a supported user path.

| Record | Completed consequential trace and adverse branches |
| --- | --- |
| D01 Public wallet | Shared Beacon boot/account events/connect/disconnect/permission deduplication through both page subscribers; stale success/rejection/null/mismatch, same-address replacement, disconnect during await and late cleanup. Only verified current observations publish or authorize. SDK transport/signing remains external. |
| D02 Network/target | Registry to Public and Admin adapters, persisted selection, reload and surface resolution; dedicated Drops/Exchange versus legacy fallback, missing Mainnet addresses/endpoints and mismatched persisted wallet. Current source routes Admin to dedicated Drops. No address/network change. |
| D03 Holdings | Shared complete pager to both Public pages and Treasury/checklist; cursor/page/cap, HTTP/body/malformed/duplicate/unsafe/zero/empty cases and stale publication. Unknown evidence cannot imply zero. Independent incoming transfers expose D11's distinct recovery defect. |
| D04 Drops identity | Schema/compatibility/config to canonical templates, mirrors/exclusions, selected wallet identity and builder; enabled/disabled/unsupported/missing collections, unknown exact IDs and canonical exclusion before projection. Current source fixes AUD-007's namespace error without weakening translation validation. |
| D05 Drops display/cart | Complete metadata/title/image/supply/default/redeem/selection/checkbox/modal paths, native versus CMS template IDs and reveal barriers. Metadata/images do not authorize payloads; rejected supply stays unknown and retries. Display cart history is not the selected financial input. Required hooks exist in the local shell. |
| D06 Time/pause/LIVE | Exact schedule/DST/time uncertainty/expiry/resume to countdown, continuing serial pause and inventory polls and final action gates; pre/standby/live/paused/depleted/unavailable, fetch/body failure, reset/re-entry/abort and late completion. Reference time, unpause and liquidity are separate evidence. |
| D07 Drops send | Actual checked token and full balance to unique pair/approval/preflight/reservation/request/receipt/status/refresh. Account/cart/config/phase/pause/inventory replacement at awaits, cancellation versus ambiguous outcome, current terminal failure and applied-but-refresh-pending reviewed. All six terms and destination remain exact. **001** affects recovery. |
| D08 Exchange cart/economics | Full catalog/render/reset/tab/add/remove/clear/quantity/action controls; owned limits, duplicate identity aggregation, finite DOM quantities and ceil(100/editions) per-unit economics. Local 419 IDs 0..12 and CANAAN 0..30 and edition values agree with configured 44-pair provisioning. |
| D09 Exchange send | Full handler and alternate retry/reconnect paths: multi-row/multi-unit expansion, aggregate burns/caps, malformed/empty/changed cart, no partial intent, captured authority after awaits, request rejection/hash/unknown/applied/failure and owned publication. **001** also reproduced through complete page send/reload. |
| D10 Approval/pair binding | Exact decimal identity and six-term uniqueness to each client serializer and FA2 operator list; missing/duplicate/mismatched pairs, existing/unknown approval, all fallback operations, wrong account/network and approval success followed by failed trade. Approval is not proof of trade completion. |
| D11 Durable Public outcomes | Entire reservation/store/classifier/deadline/retry/restore/clear graph; storage unavailable/corrupt/capacity, cross-tab Web Locks, no-hash/ambiguous rejection, attributed versus partial/wrong evidence, aggregate balances and old/current refreshes. **001:** same-token incoming value invalidates the assumed net decrease despite correct applied/current evidence. |
| D12 Arrival/shell/Utility | All four local shells and unique inline programs (font/Webflow flags, marquee and Utility geometry), entries, first paint/reveal, wallet masks and navigation; duplicate boot, missing optional nodes, load/image/font failures. Links target local surfaces correctly; future/marketplace placeholders do not authorize an implemented trade. |
| D13 Admin authority/indicator | Beacon current-account capture/invalidation/release and all helper serializers through final request; SDK/disconnect/account/permission failures and replacements. Indicator caches only resolved admin per scope, retires wallet changes and shows unknown on failures; display does not substitute for contract admin checks. |
| D14 Pause/status/recovery | Both surfaces, manual toggle and Drops auto-unpause, storage guards and durable uncertainty; pre/post-hash persistence failure, reload, terminal evidence, inverse retry exclusion, stale publication and cross-panel events. Pause // Resume is a toggle, not an expected-state setter. Exchange diagnostics are read-only; supported network switching reloads the page. |
| D15 XTZ/MAX | Both scoped controllers/readers/status lanes/recovery and direct helper/contract effect; raw exponent/sign/overprecision rejection, exact mutez, full/partial/zero/overbalance, stale Max, initiating account/target changes, unknown receipt and reload. Destination is contract admin, not arbitrary display text. |
| D16 FA2 Treasury | Both complete inventories/table/selection/recipient/batch helpers and lifecycle/orchestrator/status/recovery; exact strings, summed amounts, unknown/changed balance, current verified destination, partially evidenced batches, failed persistence and independent action/surface controls. No uncertain operation is resent as recovery. Incoming rescue can interact with Public **001**. |
| D17 Pair list/edit/cleanup | Complete reads/data/range/table/modal controller/content/widgets/validators and helpers; exact selected IDs, unlisted custom token preservation, amount-only updates, missing/duplicate/unsafe IDs, read failures, stale modal session/refresh/success/rejection and pending controls. Current local metadata settles without remote initial I/O; injected delays are not a supported producer. |
| D18 Pair creation | Drops set-panel availability/Auto/form/reinitialize events and dedicated Exchange controller; range/safe IDs, existing/missing/error availability, current fresh collision check, reset/pending/owner, exact amounts and both target/account final guards. Exchange locks redeem to configured ACID COIN #0. Cross-surface events are scoped. |
| D19 Drops load/build | Entire normalization, translations/audit, initial/manual/Auto loaders and builder/chunker. All shared preview-epoch success/rejection orders, disabled/empty/malformed/excluded rows, exact large IDs, safe ranges/counts/chunks, failed catalog/pair reads and committed form replacement reviewed. Ambiguous availability is rechecked before Send. |
| D20 Drops readiness/send | Complete controller/state/services/views/checklist/countdown/unpause and every event consumer; cached authorized intent, provider health/params replacement, manual/Auto/reset/network/phase/send cross-ordering, final pause/account/snapshot checks, exact chunks, partial send/confirmation, aborted reads ignoring cancellation and old errors. **002:** provider replacement retires Send authority but leaves the old visible FULLY SET claim during current verification. |
| D21 Authoring UI/provider | All form/token/date/exclusion/disabled-row serialization, preview/view/session/controller/client/provider and subscription paths: create/edit/deactivate, validation/preview version, acknowledged archive-only semantics, changed/cancelled/reopened/out-of-order/expired requests, full-response deadlines and readback before authority propagation. Production provider cannot acquire local writer authority. |
| D22 Schema/projection | Full schema/serializer and source -> deterministic JSON -> Admin mirror/provider/watch/generator/build guards; inactive/active/unsupported/invalid/falsy copies, rapid changes, equality and recovery blocks. Generated/rendered/cached states are not canonical source. Every supported projection writer shares ownership. |
| D23a Writer/archive/recovery | Shared claim lock, CAS, staging/replacement/readback, journals, idempotence, archive, rollback/reconcile and CLI status paths. Concurrent supported writers, each failed replacement, interrupted base/target mixtures, divergent/unreadable/missing files and pending journals preserve fail-closed recovery. AUD-005-001 remains accepted unsupported external editing during final ownership read/rename. |
| D23b Loopback API | Service launcher/probe, repository identity, fixed loopback Host/origin/route/method/body/nonce checks, state/validate/preview/apply and expiring single-use hash-bound tokens. Busy diagnostic mismatch cannot bypass the real under-lock CAS/journal/equality rechecks. State/health/preview do not reconcile implicitly. Browser/network authority is separate from filesystem ownership. |
| D24 Health/CMS/catalog | Full complete catalog/economics and force/snapshot/cache graph, Health summary mirrors, CSV parser/header/raw validation/HEN translations and exact comparisons, upload/restore/recheck/clear, local NFT/title/thumb and formatting adapters. Unknown supply recomputes dependent pills; malformed/duplicate/incomplete evidence cannot become a successful check. Local CSV match does not prove published Webflow equality or live circulation. |
| D25 Direct trade | All typed entry/helper branches, sender and all six terms per item, paused/empty/missing/late mismatch, repeated IDs, grouped heterogeneous FA2 burn/redeem destinations and first/later external failure with whole-call rollback. No-op/dishonest FA2 remains a trust boundary; sink transfer is not proved supply destruction. |
| D26 Direct privileged mapping/pause | Admin versus nonadmin, create existing/intra-batch duplicates/late invalid/empty, update unchanged/every field/missing, cleanup missing/repeated IDs and exact cardinality/events; toggle only changes pause. No admin/sink replacement entry. Direct entries are reviewed independently of UI validators. |
| D27 Direct custody/XTZ | Admin rescue exact FA2/token/recipient/positive amount and interface failure; default/nondefault tez ingress, zero/over/full withdrawal, fixed admin destination and downstream rollback/events. Attached tez on other entries is accepted custody; callers send zero. External receiver/FA2 honesty is not certified. |
| D28 Assets/thumbs | Entire input/backfill/manifest/lock/optimizers and runtime consumers; exclusive names, numeric-prefix duplicates, suffixes/JS escaping/URL encoding, partial output, rollback/concurrent standalone generation and retained failure locks. Generator duplicate rejection prevents allocator prefix discrepancy from silently publishing two IDs. No real asset rewrite. |
| D29 Exported CMS | Entire pagination, asset/content/upload/hash/perceptual/redaction and mutation/outcome reconciliation exports. Malformed/partial pages reject, ambiguous writes are explicit and not blindly retried; no runtime caller was invented. No live CMS or asset mutation performed. |
| D30 Build/delivery/tooling | Full package/CI/root/environment loaders, first-paint graphs, branch-owned assembled-artifact/map verifier, source-map helpers, harness sync, dev/port/sanity commands, Admin guard/prune/isolation and private-index ticket exporter. Missing/failed sibling loads, wrong ownership/markers/source maps and production authoring reachability reviewed. Local copied builds pass; remote assembly and production variant remain unexecuted. |
| D31a Signer provisioning | All CLI dry-run/verify/explicit execute paths, fixed 44 exact pairs/chain/target/admin/ABI/artifact gates, empty-map/cardinality preconditions, signer import, send/confirmation/exact readback. This bypasses Beacon and is not omitted because the UI has guards. No signer/verify/execute invocation. |
| D31b Artifact/provenance | Canonical/snapshot/stripped target, historical check versus frozen/promoted Michelson, 31 frozen input/evidence identities, manifest/promotion/deployment records, ABI/event/coverage verifier logic and fixture limitations. Repository hashes and historical block records are distinct from a fresh legacy compile or current deployed identity. |

Meaningful high-impact combinations were followed across the full effect graph,
not inferred from principal-module reads: account A/current B/null with current
and obsolete success/error; current/old config and UI owner before and after each
await; complete/zero/unknown/stalled evidence; no request/rejected/no hash/retained
hash/partial attribution/failed/applied; burn/redeem identities repeated or distinct
and first/later/grouped failures; single/multiple chunks with early/later failure;
and filesystem old/target/divergent states with before/during/after interruption.
Only material supported-path counterexamples enter findings. Draft typing does not
revoke an already-clicked cached preview without a committed replacement. Private
NFT remote recovery and injected delayed local metadata are not current producers.
Embedded legacy MockFA2 lacks operator authorization; standalone conforming,
rejecting and no-op fixtures improve the oracle but do not prove production FA2
honesty. The invariant verifier checks named mappings/counts, not assertions or
exhaustive state exploration; log failure inference is not fresh chain rollback
execution. ABI decoding and matching hashes are similarly bounded evidence.

### Historical behavioral-equivalence reconciliation

History was consulted only after independent discovery. The following reconciles
all original rows and every W01-W20 group to the completed current behavior above.
Each named sub-obligation remains distinct even when the old group shared a row;
no consolidation was treated as proof that its branches/consumers survived.

| Original paths | Current records / retained consequential obligations | 20-group reconciliation |
| --- | --- | --- |
| 1 | D12 arrival/navigation/Utility/reveal; D30 delivery ownership | W01, W17 |
| 2 | D02 selected/persisted network, surface target, mismatch retirement | W02, W08 |
| 3 | D01 current wallet lifecycle; D03 complete holdings; D11 restored receipt | W02, W03, W07 |
| 4 | D04 canonical eligibility/exclusions/mirror; D05 displayed/selectable identity | W03, W04 |
| 5 | D05 inventory, D06 trusted time/current pause and recovery | W04 |
| 6 | D07 one selected Drops trade, D10 approval, D11 exact retained outcome | W05, W07 |
| 7 | D08 cart/edition/quantity/duplicate aggregation | W06, W03 |
| 8 | D09 full Exchange per-unit/multi-row request, D11 refresh | W06, W07 |
| 9 | D10 exact unique pair/operator terms; D11 attributed outcome | W05-W07 |
| 10 | D02 Admin network reload; D13 wallet boot/final authority | W08 |
| 11 | D13 indicator; D14 both pause/status/recovery scopes | W08, W09 |
| 12 | D03 complete Treasury inventory; D16 exact whole FA2 batch and recovery | W10 |
| 13 | D15 exact XTZ/Max/admin destination and recovery | W10 |
| 14 | D17 Drops list/edit/cleanup; D18 availability/Auto/create | W11 |
| 15 | D17-D18 dedicated Exchange target, locked redeem and scoped events | W11 |
| 16 | D19 normalized snapshot/load/translation/manual/Auto/preview | W12 |
| 17 | D20 cached full batch Send and per-chunk authority/evidence | W12 |
| 18 | D06,D20 countdown/pause/status/checklist publication and supply; D24 dependencies | W12, W13 |
| 19 | D24 Health raw CSV/economics/forced refresh and unknown | W13 |
| 20 | D24 local catalog/title/thumb/persistent cache; D28 generated asset identity | W13, W18 |
| 21 | D21 UI/provider/authoring session and all consumer invalidations | W14 |
| 22 | D23b browser/loopback/repository/nonce/preview authority | W14, W15 |
| 23 | D23a writer CAS/archive/rollback/reconciliation and locks | W15 |
| 24 | D22 projection/mirror/watch/build propagation under shared ownership | W15 |
| 25 | D25 direct trade grouping, sender/terms/custody/atomicity | W16 |
| 26 | D26 direct create/update/cleanup/cardinality | W16 |
| 27 | D26 direct pause; D27 direct rescue/XTZ/default | W16 |
| 28 | D31a explicit signer provisioning and exact readback | W19 |
| 29 | D31b source/certification/frozen/promotion/origination identity | W20 |
| 30 | D28 local assets/thumbs/optimizers/manifest ownership | W18 |
| 31 | D29 exported CMS/asset pagination and write ambiguity | W18 |
| 32 | D12,D30 Public shells/early/full loaders and branch-owned Pages artifacts | W01, W17 |
| 33 | D21-D23,D30 Admin dev/provider/mirror/production isolation and harness | W14, W15, W17 |

| Historical findings re-challenged | Current source disposition on AUD-008 revisions |
| --- | --- |
| Seven CHR issues; AUD-002-001/002/003/007/008; AUD-003-001/002/010/011/012/013 | Generation-owned clearing, complete pagers, bounded quantities, durable reservations, continuing verified pause/inventory recovery, attributed bounded confirmation, summed burns and correct four-shell routes close their original triggers. **001** challenges the separate net-decrease freshness assumption, not paging or receipt attribution. |
| AUD-002-005/006/011; AUD-003-006/007/009; AUD-004-002 | Compatibility, exact string IDs, modal token preservation, malformed mapping-page rejection, full-term matching and captured create/edit/cleanup/Drops authority retain their original protections through both surfaces/direct helpers. |
| AUD-003-003/005; AUD-004-001 | Both Treasury/Pause surfaces retain uncertainty, exclude economic/toggle repeats and validate initiating authority/raw exact withdrawal amounts. No resend is used to recover an unknown receipt. |
| AUD-003-004/014/015; AUD-004-005; AUD-005-002/004 | Complete holder/economics evidence, explicit force/unknown, raw CANAAN ACID validation, recomputed supply dependents, newest-request status guards and sufficient multi-unit redemption retained. **002** is distinct: previous completed status is not retired when its configuration changes, even with correctly ordered new reads. |
| AUD-002-004; AUD-003-008/016/017/018; AUD-004-003; AUD-005-001/003 | Strict equality/falsy rejection, shared lock, journal base/target checks, provider health retirement and full response deadline retain supported writer/projection safeguards. AUD-005-001 remains accepted unsupported concurrent external editing; no new supported-path loss. |
| AUD-002-009/010; AUD-003-019/020; AUD-004-004; AUD-005-005 | Complete CMS reads/explicit write ambiguity, coordinated thumbnail rollback/standalone generator and JS/URL filename identity retain their protections. |
| AUD-006-001/002 | Current initial/manual/Auto shared epoch fences success and rejection; unpause checks captured abort owner and phase/network/preview/poll epochs before completion. Full view/loader consumers traced, not merely the old regression seam. |
| AUD-007-001; previous checklist 0.1 | Public eligibility and Admin normalization filter canonical exclusions before translation; network-ID exclusions are not re-filtered as canonical. Both existing consumer tests and current source support closure of the original namespace trigger. Historical defect-asserting runner is not a current passing remediation gate. |

Historical findings/reproductions retain their revision-specific claims. The final
reverse and boundary sweep accounted for all current wallet request sites, direct
contract entries, file/manifest/CMS effects, readiness/outcome sinks, facades,
operator/background entries and package/CI commands. No unexplained consequential
entrypoint, unexamined dependency or unresolved supported-path material hypothesis
remains. No production remediation was made. The replacement compact checklist
contains the two actionable roots only, grouped by independent implementation
boundary. Accepted limitations are not converted into invented fix tickets.

### Verification on the identified revisions

All logs below are ignored `audits/work/AUD-008-*.log`. No install, wallet/chain
operation, live provider query, browser/Webflow observation, recovery command,
deployment or publication was performed. Builds used a task-created tracked-file
copy at `audits/work/AUD-008-build-copy`, with junctions to existing dependencies;
original caches, generated files and operational state were preserved.
After verification, the dependency junction targets and absolute workspace-bound
copy path were checked, junctions unlinked, and only the task-created build copy
removed. Continuation notes and small evidence logs remain under `audits/work/`.

| Actual command / scope | Result |
| --- | --- |
| `node audits/repro/AUD-008-public-net-balance-repro.mjs`; `node --check audits/repro/AUD-008-public-net-balance-repro.mjs` | Final reproduction and controls pass; syntax passes. Exit 0 observes the defect, not a fix. |
| `node --test --experimental-vm-modules --experimental-test-isolation=none shared/fa2-balances.test.mjs shared/beacon-setup.test.mjs shared/public-trade-outcomes.test.mjs shared/public-trade-pairs.test.mjs shared/public-confirmation-deadline.test.mjs drops/js/wallet-rendering.test.mjs drops/js/trade-lifecycle.test.mjs exchange/js/exchange-wallet.test.mjs` | 299 pass, zero failures/skips/TODOs (`public.log`). |
| Admin `npm run test:runtime` | 2,082 pass, zero failures/skips/TODOs (`admin-runtime.log`). |
| `node --test --experimental-test-isolation=none shared/drop-params/drop-params-projection.test.mjs` | Initial sandbox run: 85 pass/5 fail (four subprocess `EPERM`, one resulting contention timeout). Permitted rerun: 90 pass, zero failures/skips/TODOs, including disposable writer/authoring/service/watcher suites (`projection-permitted.log`). No real journals were touched. |
| `node --test --experimental-test-isolation=none assets/webflow-cms/webflow-cms.test.mjs scripts/shadownet-exchange-pairs.test.mjs shared/drop-time.test.mjs shared/drop-countdown.test.mjs drops/js/countdown.test.mjs drops/js/countdown-lifecycle.test.mjs loaders/loader-architecture.test.mjs scripts/verify-pages-loader-artifacts.test.mjs` | 102 pass, zero failures/skips/TODOs (`supporting.log`). |
| `node --test --experimental-test-isolation=none shared/chain-registry.test.mjs shared/drop-countdown.fixtures.mjs shared/hen-identity.test.mjs drops/js/drop-compatibility.test.mjs drops/js/token-rendering.test.mjs drops/js/reveal-coordinator.test.mjs scripts/parcel-source-map-sources.test.mjs scripts/public-navigation.test.mjs scripts/mainnet-runbook.test.mjs` | 28 pass, zero failures/skips/TODOs (`config-display.log`). |
| `node assets/thumbs/scripts/thumbs.test.mjs`; Admin `npm run test:thumbs` | 27 and 37 pass respectively, zero failures/skips/TODOs; subprocess-capable isolated runs (`thumbs.log`, `admin-thumbs.log`). No real assets/manifest rewritten. |
| `node shared/public-trade-ops.fixtures.mjs` | All fixture cases pass (`shared-trade.log`); no novel incoming-transfer oracle in the old fixtures. |
| `node audits/repro/AUD-005-contract-abi-check.mjs`; `node audits/repro/AUD-004-contract-provenance-check.mjs` | Current client payloads decode against promoted ABI; canonical/snapshot and mechanical test-stripped fixture/unchanged target plus frozen/promoted LF identities pass. No compile/typecheck/execution/deployment certification. |
| Disposable Outer `npm run build:pages:staging`; disposable Admin `npm run build:clean` | Both exit 0; Admin prunes four development chunks and isolation verifies eight production files. Browserslist age and large Public bundle warnings remain. Original tracked runtime/generated files unchanged. |

| Continuation command / scope | Result |
| --- | --- |
| `node audits/repro/AUD-008-admin-status-invalidation-repro.mjs`; both AUD-008 scripts' `node --check` and repeat execution of `AUD-008-public-net-balance-repro.mjs` | Both defect reproductions and positive controls pass; syntax passes. No production change. |
| Admin `node --test --experimental-test-isolation=none tests/runtime/drops-status-ordering.test.mjs tests/runtime/pair-modal-session.test.mjs tests/runtime/authoring-session.test.mjs` | 91 pass; zero failures/skips/TODOs. Focused evidence for the newly examined ownership boundaries; broad suites were not redundantly rerun. |
| Inline Node SHA-256 check of all 31 `PHASE-8-FREEZE-RECORD.md` rows and manifest | All 31 checkout and all 31 HEAD-blob identities plus manifest match. Initial sandbox Git-child EPERM; permitted read-only retry passes. No compilation or live verification. |

Unperformed: production build, real Pages main/staging artifact assembly, first-paint
build verifiers requiring both variants, dev/sanity servers, browser/wallet/Webflow/
RPC/TzKT/time/IPFS/GitHub-raw/FA2/deployed checks and legacy compilation. Fresh
Node-20/Linux CI installation was not reproduced. The copied Windows builds are
not those integrations; existing Browserslist age and large bundle warnings remain.
Static/local source examination is complete, with these external assurance limits
and two confirmed conditional P2 findings. **COMPLETE / NOT CLEAN.** No provisional
clean result, independent clean-result coverage refresh, final clean claim or
`audits/report.md` is appropriate while material findings remain. Remediation and
reexamination use the existing ticket cycle; nothing here authorizes fixes or launch.

Only investigation documentation/reproductions change. Runtime/generated/config/
networks/DOM/events/wallet and transaction pipelines, contract provenance and real
operational journals/locks/archive remain unchanged. Both HEADs/indexes/branches
are preserved. Final diff checks and separate ticket exports are recorded in the
compact handoff.

## AUD-007 — completed application source pass (2026-11-23)

**COMPLETE SOURCE EXAMINATION — ONE CONFIRMED CONDITIONAL FINDING; NOT CLEAN.**
Outer runtime `9c678c7e92f247749a45b3f206823c53b9d5b55d`; independent Admin
runtime `3db964da8cc92b4aad500911c1be3dd65f03fa76`. Both were initially clean
on `ticket-AUD-007-full-correctness-review`. Working changes are investigation
documentation/evidence only. Node v22.16.0/npm 10.4.0; pinned Beacon 4.8.1,
Taquito 19.0.2/Parcel 2.16.4; no install. Public defaults to testnet/Shadownet;
Mainnet remains incomplete. SPLINTERED params are unchanged. Admin Drops/root
is legacy `KT1SZFfxFfRkbTcDUS17y1WVCKeudoLo8LX5`, Public Drops is dedicated
`KT1HMCqYqyP9fTDjzm8KAfyPhFn3tpmSW4kc`, Exchange is dedicated
`KT1Ue9es4biDzt528YhNctPGcNeqw9nDXnSv`. This implemented split does not establish
deployed identity or make Admin Drops writes affect Public Drops.

### Independent discovery and reconciliation

The candidate map was formed from current runtime registrations, DOM actions,
subscriptions/timers, direct contract entries, helper exports/callers, writers,
package commands and CI **before** opening historical findings or coverage.
Pre-reconciliation notes are retained in ignored `audits/work/AUD-007-discovery.md`.
Forward traces followed entries to effects; reverse searches started at Beacon
requests, FA2/XTZ effects, file/manifest/CMS writes and consequential publication;
boundary traces followed identities, amounts, generations, representations and
delivery ownership. Historical maps were consulted only afterward. No historical
workflow is intentionally excluded. Retained Public submissions, GitHub comparison,
signer provisioning and contract provenance are explicit boundaries below. These
were initially consolidated with their consumers/tooling, not dropped. Discovery
does not itself establish examination completion. The completed traces below
supersede the intermediate remainder notes; this is not a post-clean refresh.

| Workflow / boundaries and expected properties | Completed consequential source examination |
| --- | --- |
| Shell/Home/Utility/reveal: HTML -> host/environment loaders -> bundles/DOM; usable truthful visibility | All four entry modules, local shells' inline programs, root/environment wrapper siblings, first paint and reveal coordinator traced. Marquee/Utility SVG geometry has no financial authority. Missing regions, image/font timeout and failed imports release their owned visibility boundaries. Hosted CSS/Webflow behavior is external. |
| Public wallet: persisted/connect/event/mismatch/disconnect -> verified account -> page owners | Complete wallet module, mobile/button branches and complete balance pager traced. SDK 4.8.1 active-account/clear ordering reconciled with both consumers' pending/connected/disconnected generations, replay before boot, stale success/error and disconnect/reconnect. Transport and actual browser storage remain external. |
| Public holdings/CMS/mirrors/exclusions -> selectable exact identities | Full eligibility, metadata/presentation lookup, immutable CMS templates, default/clone/stamp, owned counts, selection and render/reveal branches traced against local shells. Network IDs remain payload identities; canonical keys locate presentation. **001 confirms an exclusion namespace violation before this resolution.** |
| Public Drops time/pause/inventory -> LIVE and transaction admission | Shared clock/time/countdown plus complete serial pause loop, abort/teardown/re-entry, standby/live recovery, supply recovery and final gates traced through buttons/flames/preview/visibility consumers. Unknown is distinct from zero/insufficient stock; schedule expiry does not authorize unpause or a trade. |
| Public Drops trade: selected balance -> approval/pair identity -> batch -> outcome/refresh | Entire handler and upstream selection traced through entry/final identity, account, amount, balance, LIVE, pause and complete redeem-inventory checks; exact approval/trade construction, reservation, rejection, confirmation and refresh/retry. Modal dismissal is not cancellation of an injected operation. |
| Public Exchange: economics/holdings -> bounded aggregate cart -> per-unit trade -> outcome | Entire module and local shell reconciled: edition producer/rounding, rows/tabs, scoped quantity controls, reset/actions, duplicate identities, 20/token and 50 total limits, exact matching pair/operations, captured outcomes and aggregate holdings reconciliation. Live CMS and wallet behavior remain external. |
| Public retained submissions: reserve/lock/hash/unknown -> attributed receipt -> balance admission | Complete shared journal/classifier/resolver/approval/deadline/confirmation/balance helpers and both consumers traced. Capacity/storage/lock failure blocks before send; ambiguous or missing hash remains retained; a matching receipt and complete balance reduction are separate authorities. Cross-origin/device enforcement is outside its browser-local contract. |
| Admin boot/network/wallet/identity: reload-boundary target and initiating authority | Bootstrap, surface switch, selector/reload, live targets, full wallet authority/SDK consumers, admin indicator, Exchange status and inert custody shim reconciled. Both initiating/controller and helper account awaits retain authority. Connected wallet is not on-chain admin proof. |
| Admin pause, both targets: current intent -> durable uncertain toggle -> attributed recovery | Full controller/helper/exclusion/settle/reconcile and display integration traced. Unknown blocks repeats; storage/admin/account/target and result ownership remain distinct. Exchange emits non-bubbling panel-local pause events; it cannot revoke global Drops authority through that path. |
| Admin treasury, both targets: exact recipient/assets/nats/mutez -> custody -> durable outcome | Full controllers/table/MAX/orchestrator/status/lifecycle/config/context/recovery/readers and chain-UI/catalog/local NFT/cache traced. Raw decimal rejection, safe nats, exact mutez, multiple-operation receipts, scope locks and reload recovery examined. Direct exported serializers/send helpers were traced independently of UI validation. |
| Admin pairs, both targets: mapping/set/edit/cleanup -> exact operations -> current publication | Entire controllers/targets, validators, Auto/debounced availability, set-panel views, modal session/content/widgets/shell, table and serializers traced. Stored token IDs survive amount-only edits; current fields feed exact payloads; cleanup validates the whole selection. Local metadata production does not provide the arbitrary delayed remote promise used by a rejected hypothesis. |
| Admin Drops normalize/build/translate -> initial/manual/Auto preview -> batch Send/status/countdown | Complete data/builder/audit, all initial/manual/Auto loaders, Send helpers/prefixes, controller/status/countdown and full views traced. Shared preview epoch retires loader success/rejection across modes; captured abort/phase/network/preview ownership fences old unpause reads. Cached intent and editable draft are distinct. **001 confirmed.** |
| Checklist: pause/pairs/supply + Health/CMS + GitHub -> truthful readiness | Complete module and rendered dots/parent preview reconciled: supply/unknown/depletion recomputation, epochs, pause/lifecycle, treasury/visibility, GitHub stable comparisons/throttle/in-flight ownership and polling/reset. GitHub equality is advisory local/remote content evidence, not hosted publication or chain readiness. |
| Health/imported CMS/economics/catalog -> complete truthful health and metadata | Entire active Health/CMS/parser/economics/store/catalog/chain-UI/cache/local NFT flow traced: complete pages and holder identities, unknown/zero/sink totals, forced freshness/in-flight snapshots, raw/normalized CSV and upload/restore/version ownership. Private dormant NFT remote recovery has no entry/caller; it is excluded from current workflows. |
| Local authoring/provider: session/preview/source version -> apply/readback/invalidation | Complete dev/production provider, transport, session/health/action controller, token helpers, form/view/preview and subscriber traced. Mode-specific actions, acknowledgement, edit/cancel/late responses and body deadlines examined; apply binds exact candidate/version/plan. Production isolation passes. Early busy diagnostic mismatch is dispositioned below. |
| Writer/projection/archive/recovery: supported CLI/service -> exact files/archive/journal | Complete schema/projector/claim lock/writer/recovery/archive/service HTTP+API/watcher/generator/launchers/status CLI traced. Cross-process preflight cannot bypass the writer's under-lock version/equality/journal checks. Real writer admission for 001 passes in a disposable copy. AUD-005-001 remains accepted unsupported external-editor concurrency. |
| Direct escrow: all public/admin/default entries -> exact custody/XTZ/storage/events | All eight active entrypoints/helpers/types/compilation target traced: sender and six stored trade terms for every item, repeated IDs, positive terms, grouped FA2 transfers, downstream failure atomicity, set/update/cleanup cardinality, pause, admin rescue/XTZ/default and event layouts. MockFA2 is test-only and not proof of actual FA2 authorization/honesty. |
| Contract provenance: canonical -> certified/promoted artifact -> originated identity | Canonical/snapshot/mechanical fixture/target, manifest/certification/freeze/promotion/deployment identity and interface reconciled; all 31 freeze checkout/blob identities pass, as do current payload decoders. Phase-11 observations are dated historical evidence, not current chain observations or certification of the legacy Admin root. No compilation/typecheck/live query. |
| Assets/CMS: input/backfill/manifest/rollback; exported CMS/image/upload/reconcile | Entire thumbnail input/backfill/manifest/capability-lock and exported Webflow CMS library traced, including no-current-caller exports: exclusive allocation, partial writes, ownership/rollback, complete pagination, explicit mutation ambiguity/no blind retry, upload/readback/equivalence/redaction. Filename JS escaping and URL encoding are distinct. Current generated manifest passes build check. |
| Build/delivery/dev/tooling/signer CLI: source/environment -> emitted identity; explicit chain admission | Packages/Pages CI, graph and first-paint verifiers, wrappers, manifest generator, exporter, port/Parcel/dev/sanity/harness/optimizers and Admin guard/pruner/isolation traced. Signer CLI's explicit execution, provider/chain/admin/ABI/empty-map and exact payload/readback gates examined. Required staging/Admin builds pass in bounded copies; no dev server, signer execution, deploy or publication. |

### Evidence and verification checkpoint

[AUD-007-001](AUD-007-findings.md) is a confirmed conditional P2: accepted canonical
HEN exclusion `0` removes unrelated canonical `94684` / Shadownet `0` in both
consumers. The real EDIT writer publishes it in a disposable copy; controls with
no exclusions and intentional exclusion `94684` pass. Current committed exclusion
`141634` is unaffected. No remediation was made. Historical dispositions have been
reconciled against the current producers/consumers in the completed rows above.
Admin countdown launched phase is distinct from current pause
authority (`paused-live` is explicit); that observation alone is not a defect.
The loopback service's `readWriterState` checks `owned`/`contended` for busy, whereas
another running process is reported as `active` by the projector: a source-observed
mismatch, **not a material finding in this pass**. Before a journal exists it can
misreport early READY/allow preview, but Apply still acquires the bounded shared
claim and checks journals, exact source version and equality under ownership.
Existing journals independently block authoring; waiting success or explicit
failure/new preview does not demonstrate lost edits or false write completion.
The [findings](AUD-007-findings.md) retain this diagnostic observation and other
challenged hypotheses separately from the confirmed defect.

### Adversarial depth and historical reconciliation

Expected properties came from project intent, exact financial/identity rules and
identified interfaces, rather than the historical tests. The full traces challenged
missing/malformed/negative/oversized values, exact decimal IDs beyond safe Numbers,
zero versus unknown, duplicated identities and summed quantities, independent pair
IDs versus cardinality, every batch item's terms, and failed downstream effects.
For each write family, examination followed authority at the actual request after
every account/permission/read await, serialized target/recipient/assets/amounts,
then confirmation attribution and refreshed evidence separately. A valid earlier
read or applied approval cannot authorize an obsolete or failed trade.

Async examination covered replacement success **and rejection**, current/obsolete
errors, resets, visibility/page re-entry, disconnect/reconnect, polling ownership,
cancelled reads that ignore abort, cached/generated/rendered state separation,
late response bodies, partial batches, retries and interrupted recovery. Finite
configuration/asset writers were traced through ownership, exact staging/readback,
rollback and unresolved journals/locks. External FA2 rejection causes whole-operation
rollback under Tezos semantics; a correctly typed malicious/no-op FA2 is still an
external trust boundary, not proof of burn or conservation. Cosmetic SVG geometry,
marquee motion and sizing do not authorize financial effects; their visibility and
startup interactions were included. Local shell parsing found repeated exported
form-control IDs in Public; current consequential quantity/selection code is
row/element scoped, so duplicate IDs alone are not an actionable failure here.

The final reverse/boundary sweep revisited all wallet request sites, file replacement,
manifest/CMS publication, durable browser records and readiness/LIVE/success sinks.
It reconciled API facades, direct escrow/helper calls, startup/background/operator
entries, provider/builder/view consumers and package/CI commands. No unexplained
consequential current entry or partially examined workflow remains within the
declared source scope. This is the completed original pass, not a new methodology
or a clean-result re-enumeration. No arbitrary delayed metadata producer or
unsupported concurrent external editor was invented to create a finding.

| Historical paths reconsidered after independent discovery | Current source/evidence on the exact AUD-007 revisions |
| --- | --- |
| Seven CHR known issues; AUD-002-001/002/003/007/008; AUD-003-001/002/010/011/012/013 | Generation-owned wallet clearing; complete pagers; reservation/storage/quantity bounds; continuing verified pause, full inventory and owned refresh; bounded attributed confirmation and aggregate duplicate reduction; four-shell navigation. Current Public/time/delivery suites and trade fixtures pass. |
| AUD-002-005/006/011; AUD-003-006/007/009; AUD-004-002 | Compatibility, exact string IDs, stored modal identity, malformed-page rejection, full-term pair identity and captured write authority traced through direct helpers and callers. New 001 concerns exclusion namespaces, not rounding or a bypass of the translation guard. |
| AUD-003-003/005; AUD-004-001 | Both Treasury/Pause scopes persist ambiguous outcomes and exclude repeats; complete receipt evidence, authority and exact raw withdrawal conversion remain. No operation is resent to resolve uncertainty. |
| AUD-003-004/014/015; AUD-004-005; AUD-005-002/004 | Complete holder/economics reads, explicit force/unknown, raw CANAAN ACID validation, supply-dependent recomputation, request-scoped status and full configured redemption coverage remain in current producers/consumers. Maintained Admin/Public cases pass. |
| AUD-002-004; AUD-003-008/016/017/018; AUD-004-003; AUD-005-001/003 | Strict three-copy equality, guarded projection, shared writer claim, journal/recovery base/target checks, provider invalidation and full-response deadline remain. AUD-005-001 is the accepted unsupported external-edit concurrency limitation; no new supported-path lost-edit evidence. |
| AUD-002-009/010; AUD-003-019/020; AUD-004-004; AUD-005-005 | Complete exported CMS pagination/explicit write ambiguity; thumbnail/manifest shared ownership, rollback and filename JS/URL identity traced. Asset/CMS and 37 Admin generator tests pass. |
| AUD-006-001/002; previous checklist 0.1/0.2 | Current initial/manual/Auto shared preview epoch fences both success and rejection; unpause continuation checks captured abort identity plus poll/phase/network/preview epochs. Full loader/countdown/view interactions re-examined; maintained ownership tests pass within the 2,078-test Admin suite. These original paths no longer supply unresolved implementation tickets. |

Historical reports, reproductions and revision-specific claims remain unchanged.
The canonical known-issues document still accurately describes the original seven
remediations; no unrelated documentation is rewritten. Only the completed pass's
one actionable finding enters the replacement remediation checklist. Accepted
external-edit concurrency, operator/admin/FA2 trust, incomplete Mainnet configuration
and unverified live integration remain explicit boundaries, not invented fix tickets.

| Actual command (Outer unless noted) | Outcome |
| --- | --- |
| `node audits/repro/AUD-007-exclusion-identity-repro.mjs`; `node --check audits/repro/AUD-007-exclusion-identity-repro.mjs` | Full consumer/writer reproduction passed twice with both controls; syntax check passed. |
| `node --test --experimental-vm-modules --experimental-test-isolation=none shared/beacon-setup.test.mjs shared/fa2-balances.test.mjs shared/public-trade-pairs.test.mjs shared/public-trade-outcomes.test.mjs shared/public-confirmation-deadline.test.mjs shared/hen-identity.test.mjs drops/js/burn-quantity.test.mjs drops/js/wallet-rendering.test.mjs drops/js/trade-lifecycle.test.mjs exchange/js/exchange-wallet.test.mjs` | 308 pass, 0 fail; `audits/work/AUD-007-public-tests.log`. |
| Admin `npm run test:runtime` | 2,078 pass, 0 fail; `audits/work/AUD-007-admin-runtime.log`. |
| `node shared/public-trade-ops.fixtures.mjs` | 20 retained-confirmation, approval and balance-reduction checks pass. |
| `node --test --experimental-test-isolation=none scripts/parcel-source-map-sources.test.mjs scripts/mainnet-runbook.test.mjs` | 4 pass, 0 fail (including source-map test-file execution). |
| Admin `npm run test:thumbs` | 37 pass, 0 fail; isolated temporary fixtures, approved child-process permission. |
| `node --test --experimental-test-isolation=none assets/thumbs/scripts/thumbs.test.mjs assets/webflow-cms/webflow-cms.test.mjs` | 66 pass, 0 fail, with approved child-process permission; disposable assets/mocked Webflow only. `audits/work/AUD-007-assets-tests.log`. |
| `node audits/repro/AUD-004-config-suite.mjs` | Five disposable suites pass: 25 authoring, 19 transaction, 10 service, 90 projection, 1 watcher; projection additionally reports 54 + 1 inner checks. Initial sandbox spawn EPERM; approved retry passed. `audits/work/AUD-007-config-tests.log`. |
| `node --test --experimental-test-isolation=none shared/drop-time.test.mjs shared/drop-countdown.test.mjs drops/js/countdown.test.mjs drops/js/countdown-lifecycle.test.mjs drops/js/drop-compatibility.test.mjs drops/js/token-rendering.test.mjs drops/js/reveal-coordinator.test.mjs shared/chain-registry.test.mjs loaders/loader-architecture.test.mjs scripts/verify-pages-loader-artifacts.test.mjs scripts/public-navigation.test.mjs scripts/shadownet-exchange-pairs.test.mjs` | 84 pass, 0 fail; `audits/work/AUD-007-time-delivery-tests.log`. |
| `node audits/repro/AUD-005-contract-abi-check.mjs` | Six current Admin entry families and both Public trade payloads decode. No compile/typecheck/execution. |
| `node audits/repro/AUD-004-contract-provenance-check.mjs` | Canonical/snapshot/mechanical-target/frozen-promoted identities pass. Canonical SHA-256 `0BC3B735377B92F1E5635ED7789B7693018DECA2256FA79DEEBD952279FC8BD9`; promoted `FE850EA74A082D8E57EE47D0E3D70339088D1490128D93A86BDDDB338947F0A9`. |
| Inline `node --input-type=module` SHA-256 check: parse all 31 certified rows in `PHASE-8-FREEZE-RECORD.md`; hash each checkout file and `git show HEAD:<path>` bytes | All 31 checkout and 31 HEAD-blob hashes match their respective recorded values. Initial sandbox Git-child spawn EPERM; approved read-only retry passed. No compilation/live query. |
| `npm run build:pages:staging` and Admin `npm run build:clean`, in a disposable `audits/work/AUD-007-build-*` copy | Both pass; six staging entry artifacts; Admin manifest/check/sync/guard and production prune/isolation pass. Logs: `AUD-007-outer-build.log`, `AUD-007-admin-build.log`. Existing per-repo installed dependencies were junction-linked read-only inputs; source/package/lockfiles copied, real journals/locks/archive excluded. Both junctions and the verified bounded fixture directory were removed afterward. No real generated files/build outputs changed. |

No browser, real wallet transport/signing, chain transaction, live RPC/indexer/time,
Webflow/CMS, published hosting/loader or deployed-contract verification occurred.
Authoritative TZIP-12 and Tezos operation semantics were consulted 2026-11-23 (links
in findings); actual FA2 honesty/behavior/finality and live identity remain unverified.
Legacy SmartPy execution is unavailable. Fresh Node-20/Linux installation, production
Outer build, combined staging/prod first-paint artifact checks and actual CI assembly
remain unperformed. Successful copied Windows builds are not those checks; stale
Browserslist-data and bundle-size warnings remain, without dependency updates.
Schema, keys, addresses/networks,
generated files, DOM/events, wallet/transaction behavior, certification and real
operational recovery state remain unchanged. No production remediation occurred.
The prescribed remediation checklist was finalized only after the complete source
pass, consolidating both affected consumers into one ticket; `audits/report.md` is
not created. One material finding remains, so there is no provisional clean verdict,
clean-result coverage refresh or final clean claim. No required source examination
remains; the external/unexecuted verification boundaries above constrain the result.

## AUD-006 — completed source examination (2026-11-23)

**COMPLETE APPLICATION SOURCE PASS — TWO CONFIRMED FINDINGS; NOT CLEAN.**
This continues the November 19 investigation, including its independently
discovered map and evidence. It does not restart enumeration or discard that
checkpoint. All twenty mapped workflows have now received the source audit-pass
procedure; no local consequential workflow remains partially examined. External
integration execution and legacy contract execution remain unverified as stated
below. Completion of source examination is not a deployment or clean verdict.

| Repository / existing branch | Exact reviewed and tested runtime revision |
| --- | --- |
| Outer / `ticket-AUD-006-full-correctness-review` | `5b465deb2e3ffc393a400458cff26725b1a2f612` |
| Admin / `ticket-AUD-006-full-correctness-review` | `3fda8b857d3f3374a49ff4d3e9f7273e96213bca` |

Runtime revisions, lockfiles, installed toolchain, network/address configuration
and scope are unchanged from the checkpoint below. The continuation began with
only the recorded coverage/README/findings changes and two Admin repros. Reviewed
working changes now comprise Outer audit documentation/checklist and four Admin
evidence runners. The two original runners are preserved; the loader runner adds
reverse-order cases. No runtime, schema, generated source/mirror, operational
journal/archive/lock, contract or deployment change was made.

Target identity stays explicit: current Admin Drops/root resolves the documented
legacy root `KT1SZFfxFfRkbTcDUS17y1WVCKeudoLo8LX5`; Public Drops resolves dedicated
`KT1HMCqYqyP9fTDjzm8KAfyPhFn3tpmSW4kc`. Exchange uses its dedicated configured
surface. No assumption is made that setting Admin Drops pairs changes Public
Drops storage. The current root/surface split is an implemented, documented
configuration boundary; the historical Phase-11 verification of the dedicated
instances does not certify the legacy root or its current ABI/storage.

Scope remains the implemented application, including direct contract and operator
entries, shared infrastructure, Public, Admin, assets and delivery. Cosmetic
effects without consequential visibility, future architecture proposals and
third-party internals beyond the identified interfaces remain excluded. Current
source and independently grounded authority/identity/conservation/recovery
properties supplied the oracle; old audit dispositions and passing suites did
not substitute for examination. The original forward/reverse/boundary discovery
and reconciliation are retained below. This is the completion of that same pass,
not the independent post-clean refresh required for a final clean claim: findings
remain, so no provisional clean result or post-clean refresh is claimed.

### Completed behavioral examination

The original map below retains the workflow boundaries, intended properties and
core source locations. This table supersedes its **examination status** column
and unfinished-work list. “Examined” means complete local consequential source
tracing under the stated external assumptions, not that every integration ran.

| Workflow | Completion of forward, reverse and boundary examination |
| --- | --- |
| W01 Arrival/navigation/reveal/Utility | **Examined.** All four local shells' app entries/inline scripts, shared first paint, reveal barrier, navigation and Utility startup traced. Independent early/application imports settle failure separately; inactive/unconfigured/missing-region paths release pending state. Utility SVG and marquee work has no financial authority. Hosted Webflow/CSS behavior is external. |
| W02 Public wallet | **Examined.** Initial, permission, SDK event, same-account, replacement, mismatch, disconnect and mobile entries through verified projections/final account reads. Stale success/rejection/clear completion cannot authorize a replacement. Transport and signing remain external. |
| W03 Holdings/identity/rendering | **Examined.** Complete balance pager through both consumers, canonical CMS snapshots, HEN mirror/exclusions, row cloning/stamping, selection restoration, missing metadata and unknown/zero states. Presentation names/images do not select operation identities; current wallet generations gate publication and exact selected balance gates submission. |
| W04 Drops schedule/pause/inventory | **Examined.** Initial/inactive/config-error, PRE/time-unavailable/standby/LIVE, pause/recovery, visibility/page lifecycle and full redemption thresholds traced through countdown, buttons, flames and final trade gates. Delayed/failed provider data does not establish current readiness. External time/indexer accuracy remains assumed. |
| W05 Public Drops trade | **Examined.** Each selection path through verified balance, approval fallback, unique six-term pair resolution, exact payload, final account/selection/time/pause/inventory check, retained submission, confirmation and balance refresh. Preflight liveness qualification below; no wallet execution. |
| W06 Public Exchange | **Examined.** Startup delay, all panes/tabs, quantity options, clear/remove/reset/cart rendering, duplicate identities, reward totals, per-unit expansion, final cart/account checks and retained receipt/balance reduction. Bounds precede allocation; malformed economics fail the authoritative cart gate. |
| W07 Retained Public submissions | **Examined.** Reservation/hash/unknown/rejection, scoped durable store, lock, retry, deadline, receipt attribution and final balance admission traced from both pages. Reload does not silently turn an ambiguous submitted operation into a fresh trade. Browser locking/storage and real receipts remain external. |
| W08 Admin boot/network/authority | **Examined.** Surface wiring, persisted selector/full reload, wallet SDK event consumers, immutable target capture, admin indicator and read-only Exchange status. Indicator unknown is distinct from verified admin; chain authority remains decisive. Read-only refresh controls serialize supported clicks. |
| W09 Pause/recovery | **Examined.** Both surface controllers through helper, final authority/target checks, persisted uncertainty, conflict/reload/recovery and refreshed pause publication. Rejected-before-request and ambiguous-after-request branches remain distinct. |
| W10 Treasury | **Examined.** Completed orchestrator/config/context/lifecycle/status/bridge and all button/event consumers around previously traced transfer/withdraw/MAX/table/recovery. Exact recipient, token nat and decimal mutez survive helpers; changing account/target/balance context retires pending authority. Unknown receipts retain recovery exclusion. |
| W11 Pairs | **Examined.** Both surfaces' table/create/edit/cleanup, set-panel view/widgets, modal shell/content/widgets/validators/context, custom/local token choices, locked Exchange redemption, status and serializers. Stored IDs survive amount-only edits and absent catalogs. Deferred local-metadata challenge is qualified below; it is not a current supported failure. |
| W12 Admin Drops | **Examined, findings 001/002 remain.** Full normalizer/translation audit/build/load/view/status/countdown/send graph, manual/Auto mutual ordering, reset/provider/network/phase retirement and error branches traced. Direct loader mutation escapes scoped status guards; cancelled unpause completion escapes same-phase ownership. Clicked cached-send intent and draft-input behavior were characterized separately. |
| W13 Checklist/Health/catalog | **Examined.** Completed GitHub comparison/cache/poll/epoch, Health summary mirrors, CSV upload/restore, token economics, full catalog enumeration, NFT/title/thumbnail and persistent cache producers. Known zero differs from unavailable evidence; failed supply recomputes dependents. Current NFT titles/previews are local-only; diagnostic cache is not transaction identity authority. |
| W14 Local authoring/provider | **Examined.** Form/time/token choices, disabled-row preservation, state/view/preview, validation/apply/readback and provider/subscriber invalidation traced. Edit invalidates reviewed candidate/preview; service CAS and consumed preview token govern apply. Production removes the development capability. |
| W15 Writer/projection/archive/recovery | **Examined.** Completed strict active/inactive/canonical schema, deterministic serialization, archive path/hash/schema/exclusive publication/collision/readback, watcher drain and CLI dispatch around full writer/projector/recovery/lock traces. Supported writers share the claim; pending/diverged state blocks projection/READY. External editor concurrency remains the accepted AUD-005-001 limitation. |
| W16 Direct contracts | **Examined source; execution unverified.** Every active escrow entry and meaningful validation/effect/failure branch traced, including all trade terms inside each loop, grouped/repeated identities, later-item and downstream failure, pair cardinality, admin custody/XTZ and default. Typed FA2 acceptance alone cannot prove movement or irreversible burning. |
| W17 Build/delivery/dev | **Examined.** Completed all root/environment wrappers, artifact verifier, first-paint verifiers, dev port/Parcel/harness/sanity scripts and CI assembly. Main owns permanent/prod loaders, staging owns staging loaders; byte provenance and referenced bundles are checked before artifact upload. Admin mirror/manifest/prune/isolation gates traced. Actual remote assembly/hosting and fresh Linux/Node-20 install remain unverified. |
| W18 Assets/CMS | **Examined.** Completed process-local manifest capability/ownership/release, standalone generator, input/backfill allocation/rollback, static optimizers and complete exported Webflow CMS library. Pagination validates completeness; writes are not blindly retried; transport/body/upload ambiguity remains explicit; image identity/content/readback checks are separate. No live CMS mutation or read was made. |
| W19 Pair provisioning CLI | **Examined.** Fixed payload/default dry-run, explicit execute admission, chain/admin/entrypoint/storage/empty-map checks, exact packing and complete readback. No signer/provider/execute invocation in this review. |
| W20 Contract provenance | **Examined local correspondence.** Source/snapshot/mechanical fixture/target, Phase 7/8 certification/freeze, Phase 10 promotion and Phase 11 deployment record traced. All 31 freeze-table checkout/blob identities rechecked, alongside canonical/promoted checks. Historical block-pinned observations are not new live verification. |

### Consequential branch and ordering review

- Public trades: entry/configuration and complete holdings; absent/ambiguous or
  mismatched pairs; approval present/absent/read error; exact per-trade terms and
  whole cart/batch limits; final identity/cart/pause/inventory; request rejection,
  no hash/unknown, applied/failed/unconfirmed, later refresh failure and retry.
  Approval and trade effects share the submitted operation group; source/protocol
  rollback reasoning is distinct from actually running the configured FA2.
  Preflight account/approval/pair reads have no application-wide deadline and may
  leave processing pending until provider settlement or reload. They precede the
  durable request reservation; reload cannot itself duplicate a request that was
  never made. If a held read later settles, final current-context checks still
  apply. The bounded confirmation deadline does not cover these preflight reads.
- Privileged operations: all six helper entry families and both escrow surfaces,
  initiating account/target through availability/permission/account awaits,
  exact nat/decimal conversion and recipient, each batch's request/confirmation,
  stale publication, no-hash/hash uncertainty and supported recovery. Direct
  contract entry bypasses UI checks but retains on-chain admin/sender/six-term
  validation. No admin setter exists; constructor identity is a deployment trust
  boundary. A failed later trade or FA2 call is not a successful partial trade.
- Admin Drops: initial/manual/Auto loaders, every asynchronous overlap/build/
  metadata/status/countdown continuation, success/rejection and reset/provider/
  network/phase replacements. Manual-to-manual and Auto-to-Auto use their own
  epochs; cross-kind supersession and rejected Auto are the 001 gap. Phase/network
  reset fences unpause; same-phase abort without a new poll epoch is 002. Pending
  sends retain per-batch receipts and stop after authoritative preview/config/
  account invalidation. Pure draft edits are discussed in findings, not asserted
  to be revocation without an independent cancellation requirement.
- Configuration/asset writers: admission/CAS, supported lock acquisition/reuse,
  staging/replacement/final equality, partial failure/rollback/reconciliation,
  archive-before-deactivation and collision/readback, watcher coalescing, manifest
  generator versus import rollback, and stale/unknown provider publication.
  Real external edits during apply remain unsupported. OS crash/power-loss and
  noncooperating external writers are not proved safe by disposable fixtures.

Cross-products without reachable effects were not invented: custom modal initial
metadata has no pending I/O in the current producer; changing Admin networks
normally reloads the app; catalog/title/image failures cannot themselves choose
financial terms; read-only Health diagnostics do not mint or transfer assets.
Newly exposed paths were pursued through their real producers and consumers,
including the two controlled but non-finding cases described in the findings.

### Historical reconciliation and actual continuation verification

All seven `docs/known-issues.md` paths, eleven AUD-002 findings, twenty AUD-003
findings (including the canonical 015 / ticket alias 008 distinction), five
AUD-004 findings and five AUD-005 findings were reassessed against current source.
The findings document records their current path dispositions. No prior finding
was dropped because an old report called it fixed. No additional actionable old
issue remains beyond current 001/002; AUD-005-001 remains an accepted unsupported
external-concurrency limitation, with no new supported-writer counterexample.

Continuation checks on November 23 used the exact revisions above. Logs are
ignored `audits/work/AUD-006-continuation-*.log`; commands did not mutate real
operational state. No test count is presented as proof of source examination.

| Actual command / selection | Result |
| --- | --- |
| Outer explicit top-level `shared`, `drops/js`, `exchange/js`, `scripts`, `loaders` `*.test.mjs`, plus Outer thumbnail and CMS suites; `node --test --experimental-vm-modules --experimental-test-isolation=none <enumerated paths>` | 462 selected: 452 pass; ten thumbnail child-process cases blocked at sandbox `spawn EPERM` |
| Permitted `node --test --experimental-test-isolation=none assets/thumbs/scripts/thumbs.test.mjs` | 27/27 pass, including all ten blocked cases |
| Admin `npm run test:runtime`; `npm run test:thumbs` | 1,961/1,961 and 37/37 pass |
| Permitted Outer `node audits/repro/AUD-004-config-suite.mjs` | Disposable unchanged suites: 25 authoring + 19 transaction + 10 service + 90 projection + 1 watcher = 145 pass |
| Admin original `AUD-006-drop-auto-error-repro.mjs` and `AUD-006-unpause-owner-repro.mjs` | Defects and positive controls reproduce; loader adds older-manual/newer-Auto success/rejection evidence |
| Admin `AUD-006-send-input-repro.mjs`; `AUD-006-modal-content-repro.mjs` | Characterization/control and injected-delay/control pass; neither is counted as a confirmed new defect |
| Outer `npm run test:public-trade-ops` | 20 named fixtures and 19 deadline tests pass; overlaps broad selection |
| Outer `node audits/repro/AUD-005-contract-abi-check.mjs`; `node audits/repro/AUD-004-contract-provenance-check.mjs` | Six Admin and both Public builders decode; canonical/snapshot/mechanical-target and frozen/promoted identities pass |
| `python "docs/EA-XYZ Contract Audit/tests/verify-invariant-coverage.py"`; read-only Python SHA-256 comparison of Phase-8 table to checkout and `git show HEAD:<path>` | 26/26 invariants, 181/181 obligations, 13 mapped tests; all 31 certified file checkout/blob pairs match. Mapping/identity only, not legacy execution |
| Outer `npm run build:pages:staging`; Admin `npm run build:clean` | Both pass; six Public bundles; Admin removes four development chunks and verifies eight production files. Existing Browserslist-age/size warnings |
| Outer `npm run verify:home-first-paint-build`; `npm run verify:drops-first-paint-build` | Both pass; staging freshly rebuilt, production output pre-existing |

The November 19 inert default 44-pair provisioning check remains applicable to
unchanged source; it was not repeated as live verification. Historical defect
scripts that assert pre-remediation failures were not repurposed as fix gates.
Both repositories' final diffs/status/whitespace and separate `ticket:diff`
exports are checked for the compact handoff. Indexes/HEADs/branches are preserved.

### Result and unverified boundaries

Completed: 20/20 local behavioral workflows examined, zero unfinished local
source rows. Confirmed: AUD-006-001 and AUD-006-002, both P2 and unremediated.
`audits/remediation-checklist.md` now contains only their actionable loader and
countdown tickets in the prescribed format. Historical findings/checkpoints are
preserved. No `audits/report.md`, final public report or clean claim is produced.

Unverified: current browser/Webflow DOM, custom code, CMS and hosted CSS/assets;
Beacon transport/signing and real browser storage/Web Locks; RPC/TzKT accuracy,
consistency/finality/reorg and time-provider accuracy; configured FA2 ledger,
operator/transfer behavior; present deployed escrow code/storage/admin/sink,
inventory and receipts; remote Pages/main/staging artifact identity and hosting.
No exact live Webflow site was inspected. No wallet/chain transaction, deployment,
dev/sanity server or manual browser smoke; no fresh dependency install, production
rebuild or Linux/Node-20 CI; no OS crash-durability campaign. Compatible legacy
SmartPy compile/scenario/native protocol checks were not run; historical
certification is identified historical evidence, not freshly executed assurance.

---

The following November 19 checkpoint is retained verbatim as partial-pass
history; the November 23 section above supersedes its current-status claims.

## AUD-006 — partial investigation (2026-11-19)

**PARTIAL — FULL APPLICATION EXAMINATION UNFINISHED. Two confirmed Admin
findings. No completed or clean pass is claimed.**
[Working findings and controls](AUD-006-findings.md) describe the evidence.
This section supersedes the current-review context only; historical sections and
their revision-specific claims remain intact. `audits/remediation-checklist.md`
is unchanged: the methodology's final checklist is conditional on completing the
full pass, and must not imply that this partial examination is complete.

| Repository | Exact runtime source reviewed and tested |
| --- | --- |
| Outer, including contracts and shared tooling | `5b465deb2e3ffc393a400458cff26725b1a2f612` |
| Independent Admin | `3fda8b857d3f3374a49ff4d3e9f7273e96213bca` |

Both verified branches are `ticket-AUD-006-full-correctness-review`; both initial
worktrees and indexes were clean. Runtime source stayed at these revisions.
Reviewed working changes are this section, `AUD-006-findings.md`, the evidence
README and two Admin `tests/repro/AUD-006-*.mjs` runners. No runtime remediation,
schema/address/network changes, new audit infrastructure or final public report.

### Scope, assumptions and independent discovery

The intended scope is the entire consequential implemented application: Public,
Admin, direct contract calls, shared configuration/writers, assets and
build/delivery. Exclusions are cosmetic effects without consequential visibility,
unimplemented proposals, and third-party internals beyond identified interfaces;
external effects themselves remain included as boundaries. Scope was **not**
silently narrowed to the examined rows below.

Before opening historical coverage/findings, source discovery read runtime page
and Admin registrations, wallet events, operation builders, contract entrypoints,
package commands, writer/service/projector entries, registry and Pages CI. An
18-group candidate behavioral map was recorded in ignored
`audits/work/AUD-006-discovery.md`. Forward tracing began at user/operator events,
startup/background work and direct-chain/CLI entries. Reverse tracing followed
wallet requests, FA2/XTZ effects, privileged/configuration writes and
balance/readiness/LIVE/outcome publications. Boundary tracing followed
account/network generations, CMS and mirror identities through cart/Micheline to
contract effects, source/projections/mirror, recovery state and artifact delivery.
Only after that candidate map were coverage and prior findings consulted.

Reconciliation retained the earlier W01–W20 behavioral distinctions, explicitly
separating provisioning and contract provenance from general delivery and
splitting public submission from trade construction. No earlier row was dropped
as already fixed. The table below is the current source-discovered map, **not a
claim that each workflow has received the complete audit-pass procedure**.

- Windows PowerShell, Node `v22.16.0`, npm `10.4.0`, installed dependencies; no
  install or upgrade. Beacon SDK 4.8.1/core+dapp 4.8.0, Taquito 19.0.2,
  Parcel 2.16.4, Sharp 0.35.3. Outer lockfile SHA-256
  `D0083CFF4CC978C52830D78062E2A4DE9D7D5C3C9C490AE773ABB664B83EC935`;
  Admin `8A79D21B6E5F50FBAE2E972CE8B665836E8151FF49D2865B83F7E1BEE334C3EB`.
- `NETWORK` unset; Public `testnet` means Shadownet. Admin retains its persisted
  selector/reload boundary. RPC `https://rpc.tzkt.io/shadownet`, indexer
  `https://api.shadownet.tzkt.io`; Drops
  `KT1HMCqYqyP9fTDjzm8KAfyPhFn3tpmSW4kc`, Exchange
  `KT1Ue9es4biDzt528YhNctPGcNeqw9nDXnSv`, legacy
  `KT1SZFfxFfRkbTcDUS17y1WVCKeudoLo8LX5`. Mainnet remains incomplete behind
  configuration gates. These are configured source values, not live observations.
- Current scheduled SPLINTERED source: mirror `testnet`, October 9 2026 3 PM
  seasonal EST zone, HEN burn 1 excluding canonical `141634`, CANAAN `29`
  redeem 1, planned supply 10. Tests use controlled alternative data and clocks.
- Reference reads on 2026-11-19: [Octez failure semantics](https://octez.tezos.com/docs/active/michelson.html#failures)
  and the [raw FA2 specification](https://gitlab.com/tezos/tzip/-/raw/master/proposals/tzip-12/tzip-12.md).
  These ground interface assumptions, not configured-provider behavior or deployed
  identity. No wallet, chain, CMS, Webflow or hosting mutation was performed.

### Behavioral coverage and examination status

Expected properties below derive independently from project intent, exact asset
identity/conservation, current authority, recovery and truthful evidence. Existing
tests were challenged with new ordered rejection/cancellation cases. Passing
tests are supporting seam evidence, not proof that a partial row is examined.

| ID / workflow and consequential source boundaries | Intended properties | Examination status at handoff |
| --- | --- | --- |
| W01 Arrival/navigation/reveal/Utility: shells → `webflow/*`, `shared/public-first-paint.js`, `drops/js/reveal-coordinator.js`, Utility entry | Font/image/load failures settle visibility; usable controls retain identity and local navigation | **Partial.** Shared reveal/Utility and loader registrations read; startup/navigation/reveal fixtures pass. Full shell/custom-code and all arrival alternatives not re-examined; live Webflow unverified. |
| W02 Public wallet: `shared/beacon-setup.js` → page subscribers and SDK | Only verified current network/account observations authorize state and actions; obsolete reads cannot clear replacements | **Local lifecycle examined.** Boot, account events, permission/connect deduplication, mismatch clearing, disconnect and mobile controls traced; current regressions pass. SDK account/request implementation inspected. Transport/signing and SDK asynchronous internals beyond the inspected seam remain external/unverified. |
| W03 Complete holdings/identity: `shared/tzkt-fa2-balances.js` → Drops rendering and Exchange verified quantities | Complete exact balances; unknown differs from zero; canonical CMS IDs/exclusions map to the intended wallet identity | **Core examination done; broader workflow partial.** Pager, cursor/caps, malformed/duplicate/unsafe values and both main consumers traced. Current FA2/wallet/identity suites pass. Full metadata/template and alternate rendering consumers still need examination. |
| W04 Drops time/pause/inventory/LIVE: shared time/countdown → `drops/js/events.js` polling/button guards | Trusted schedule plus current unpause and sufficient full redemption inventory before actionable trade | **Partial.** UTC uncertainty/DST, lifecycle retirement, pause fetch/body deadlines, continuing pause poll, inventory initial/recovery polling and final inventory gates examined. Full remaining UI/state cross-products not completed; provider truth unverified. |
| W05 Drops approval/trade: selected row → shared pair lookup/approval → request → escrow | Exact burn/redeem identities and six terms; current selected balance/wallet at request; no partial cart send | **Core high-impact construction traced; workflow partial.** One-trade payload, approval fallback, full-term uniqueness, entry/final gates and receipt admission read. ABI/current lifecycle tests pass. Remaining selection/metadata alternatives and unbounded preflight-read behavior need examination; no wallet/chain execution. |
| W06 Exchange cart/trade: `exchange/js/*` → shared operations → escrow | Exact per-unit reward, owned/aggregate limits, all intended entries, current cart/account and dedicated target | **Partial.** Cart quantity/duplicate limits, reward arithmetic, per-unit expansion, full-term pair lookup, final equality, confirmation and balance gating read. Remaining reset/tab/UI alternative paths not completely examined. |
| W07 Public retained submission/outcomes: shared store/poll → both page retry/refresh consumers | Ambiguous submission blocks repetition; attribution/terminal result differs from balance refresh; bounded confirmation | **Shared core examined.** Complete store/lock/reservation/rejection/poll/confirmation/reduction code read; page main/retry consumers traced. Fixtures/deadline and runtime controls pass. Browser storage/Web Locks, real receipt attribution, finality and indexer consistency unverified. |
| W08 Admin boot/network/authority: `admin.js`, `network.js`, Beacon, wallet/live-cfg → all writes/status | Correct surface/network and initiating account through awaits; chain admin authority is independent of UI | **Partial.** Startup surface wiring, network persistence/reload, send-authority capture, account events and helper checks examined. Indicator/read-only Exchange status and all event consumers remain to complete. |
| W09 Pause and recovery, both escrows: `pause*` → `escrow-ops.js` → stored request/status | Current target/authority; uncertain toggle cannot become a fresh retry; truthful refreshed status | **Local source examination done.** Controller, recovery locking/storage, final send checks, hash retention, confirmation and refresh ownership read; pause/runtime controls pass. No actual toggle, persisted browser recovery or external confirmation observed. |
| W10 Treasury custody/XTZ/MAX, both escrows: transfer/withdraw/table/recovery → helper → contract | Exact recipient, whole tokens/decimal mutez, current balance context, complete batch and durable uncertainty | **Partial.** Transfer/withdraw/MAX, table, recovery and serialization/confirmation core read. Runtime amount/pending/order/recovery controls pass. Complete orchestrator/config/status/lifecycle event graph still needs independent examination. No funds movement. |
| W11 Pairs list/create/edit/cleanup, both escrows: controllers/set panel/modal → helpers/TzKT | Exact terms/IDs, initiating authority, scoped complete reads, truthful confirmation and retained intent | **Partial.** Main controllers, Exchange locked redeem, modal save/refresh, set validation/availability and all helper serializers read. Pair authority/read/pagination/session controls pass. Full widget/content/set-panel wiring and rejected-await/publication matrix unfinished. |
| W12 Drop normalize/build/load/send/status/countdown: `features/drops/*` → pair helper and preview/checklist | Every asynchronous owner must retain source/network/wallet/UI intent; per-batch exact effects and honest partial results | **Partial, two confirmed findings.** Send/chunk construction and gates, loader ranges, request-scoped pair status, cancellation/epochs and countdown owner read. **001**: old Auto rejection clears newer manual preview. **002**: aborted unpause completion republishes old start ID/LIVE. Full normalization/translation/view and remaining phase/order combinations unfinished. |
| W13 Checklist/Health/CMS/economics/catalog: health and checklist modules → adapters/cache/CSV/TzKT | Current scoped complete evidence; unknown cannot imply zero/ready; exact CMS/token economics | **Partial.** Supply dependency publication, full-page balance economics, Health enumeration, CSV normalization/comparison and upload ownership core examined. Catalog reads and consumers traced. Remaining GitHub comparison/polling, health summary mirrors, NFT/cache/title and all event interactions need completion. |
| W14 Local authoring/provider: controller/client/provider/subscriber → loopback API | Reviewed preview/version owns apply; failed/stalled verification retires trusted params; no production writer authority | **Partial.** Controller request/session state, provider refresh constraints/retirement, full response deadline and apply readback examined. Runtime authoring/timeout tests pass. Form/view/token serialization and complete schema compatibility paths remain. |
| W15 Source/projection/mirror/archive/lock/recovery: service/CLI → writer/projector/watcher | Coordinated supported writers, CAS/idempotence, exact projections, preserved unresolved journal and recoverable partial writes | **Partial.** Complete writer/recovery/projector/lock and service request/apply flows read; isolated current suites pass. Full schema/archive/watcher/CLI examination unfinished. AUD-005-001 stays accepted unsupported independent-editor concurrency; no new supported-writer counterexample asserted. |
| W16 Direct escrow trade/admin/default: active legacy SmartPy plus Public/Admin builders | Every trade matches sender and six stored terms; correct custody/recipients; admin-only mutation; atomic failure and truthful events | **Source-logic examination done; execution unavailable.** Every executable escrow entry read: pause/empty/nonexistent/mismatched/later-item trades; repeated/grouped burn/redeem identities and external FA2 transfer effects; setup/update positive amounts/distinct contracts/duplicate IDs; cleanup cardinality/nonexistent IDs; admin rescue/withdraw and default XTZ receive. External rejection and insufficient inventory roll back under protocol assumptions. ABI decoding passes. Legacy compile/tests/deployed Michelson not verified. |
| W17 Public/Admin build/delivery/dev: packages/CI → projections/bundles → root/environment loaders → Pages | Branch-owned artifact graph and source provenance agree; no development authoring in production | **Partial.** Package/Pages stages, core root/early loader logic and Admin guards/prune/isolation read; both builds and graph fixture checks pass. Complete verifier, remaining loaders, dev/harness command effects, Linux/Node-20 and actual remote branch/deployment graph not fully examined. |
| W18 Thumbnail/site/CMS tooling: Outer asset input/backfill → Admin manifest; CMS library exports | Exact asset identity, originals/exclusive publication/rollback; complete reads and explicit ambiguous writes | **Partial.** Thumbnail conversion/allocation/rollback/backfill and current generator URL fix read; concurrency and filename suites pass. Webflow CMS library only entry-enumerated, not completely re-examined; manifest-lock implementation and static optimizers remain. No live site accessed. |
| W19 Signer provisioning: fixed pair CLI → provider/chain/admin/ABI → send/readback | Default inert; explicit authorized execute; fixed target/exact payload and complete readback | **Source flow examined; external execution unverified.** All command modes, payload validation/packing, signer/chain/entrypoint/storage checks, empty mapping/cardinality, request/confirmation/readback read. Default 44-pair dry-run and fixtures pass. ABI check is not deployed-code equivalence; no live verify/execute. |
| W20 Contract provenance/origination: canonical source → frozen/promoted artifacts and records | Current source, certified snapshot and originated identity remain distinct | **Partial.** Existing source/artifact identity checker and invariant-map checker pass; current payloads decode. Certification/promotion/deployment records and their complete correspondence still need full independent re-examination. Historical origination is not a current live observation. |

For W16, repeated trades do not reuse only the first validation: sender and all
six terms are checked inside the loop, each burn/redeem is accumulated and every
group invokes its FA2 transfer interface. Later validation or external rejection
cannot legitimately be called successful execution; source and protocol reasoning
do not execute these effects. There is no runtime admin/burn-address setter in
the active escrow source. Its constructor identities and actual FA2 behavior
remain deployment trust boundaries. MockFA2 and artifact/ABI checks do not
establish real operator policy or irreversible burning at the configured sink.

### Actual verification at these revisions

Logs are ignored `audits/work/AUD-006-*.log`. Commands below do not imply that
unexamined source was covered by reading or that mocks establish live behavior.

| Actual command or exact selection | Outcome |
| --- | --- |
| Outer PowerShell enumerated top-level `shared/*.test.mjs`, `drops/js/*.test.mjs`, `exchange/js/*.test.mjs`, `scripts/*.test.mjs`, `loaders/*.test.mjs`, plus `assets/thumbs/scripts/thumbs.test.mjs` and `assets/webflow-cms/webflow-cms.test.mjs`; passed paths to `node --test --experimental-vm-modules --experimental-test-isolation=none` | 462 selected: 452 pass, 10 fail solely at sandbox child-process `spawn EPERM` in thumbnail cases; no application assertion failure in the other cases |
| Permitted rerun: `node --test --experimental-test-isolation=none assets/thumbs/scripts/thumbs.test.mjs` | All 27 thumbnail tests pass, including all ten previously blocked cases |
| Admin `npm run test:runtime` | 1,961 pass, zero fail/skip |
| Admin `npm run test:thumbs` | 37 pass, zero fail/skip |
| Outer `node audits/repro/AUD-004-config-suite.mjs` | Initial sandbox `spawnSync EPERM`; permitted rerun passes unchanged suites in disposable copies: 25 schema/authoring + 19 transaction + 10 service + 90 projection + 1 watcher = 145 |
| Outer `npm run test:public-trade-ops` | 20 named fixtures and 19 deadline tests pass; overlaps broad selection |
| Admin `node tests/repro/AUD-006-drop-auto-error-repro.mjs`; `node tests/repro/AUD-006-unpause-owner-repro.mjs` | Both demonstrate their defects and positive controls, repeated successfully; not remediation gates |
| Outer `node audits/repro/AUD-005-contract-abi-check.mjs` | Six Admin operations and both Public handlers decode against promoted ABI, preserving tested terms/user/large IDs; no contract execution |
| Outer `node audits/repro/AUD-004-contract-provenance-check.mjs` | Canonical/snapshot, mechanical fixture/target and frozen/promoted identities pass; canonical SHA-256 `0BC3B735377B92F1E5635ED7789B7693018DECA2256FA79DEEBD952279FC8BD9`, promoted `FE850EA74A082D8E57EE47D0E3D70339088D1490128D93A86BDDDB338947F0A9` |
| `python "docs/EA-XYZ Contract Audit/tests/verify-invariant-coverage.py"` | Mapping checker: 26/26 invariants, 181/181 obligations, 13 mapped tests; not compile/test execution |
| Outer `node scripts/shadownet-exchange-pairs.mjs` | Inert default 44-pair payload/dry-run passes; no provider/signer/RPC/transaction |
| Outer `npm run build:pages:staging`; Admin `npm run build:clean` | Both pass; mirror/manifest guards, six Public bundles and Admin prune/isolation (four dev chunks removed, eight production files checked). Existing Browserslist-age and bundle-size warnings remain |
| Outer `npm run verify:home-first-paint-build`; `npm run verify:drops-first-paint-build` | Pass; staging freshly built, prod output pre-existing and not freshly rebuilt |

### Unfinished examination and result limits

The table's partial rows are unfinished work, not accepted risks or inferred
successes. Continue the original method on their remaining producers/consumers,
alternate entries, malformed/boundary inputs, rejection/cancellation orderings,
recovery and cross-system combinations. In particular, finish the Drops
normalization/translation/view and full async branch matrix; pair widgets/modal
content; Treasury orchestration; checklist GitHub/Health/NFT/cache graph; authoring
form/schema/archive/watcher; complete CMS/asset and build/dev delivery flows; and
historical finding reassessment/provenance. Fresh passing broad suites do not
replace this source examination. Newly exposed local findings 001/002 have been
traced and reproduced with controls; no other material local hypothesis is
asserted as a confirmed defect by this partial result.

Unverified integrations: current browser/Webflow DOM and custom code/CMS;
Beacon transport/wallet signing and real Web Locks/storage; RPC/TzKT pagination
truth, consistency/finality/reorg; time provider accuracy; external FA2 ledger,
operator and transfer behavior; deployed escrow source/code/storage/admin/sink,
inventory and operation outcomes; Pages/hosting/custom-code identity and remote
main/staging artifacts. No detailed Webflow read was performed; no exact site ID
was assumed. No dev/sanity server, fresh dependency install, fresh production
build, Linux/Node-20 CI, OS crash/power-loss durability or manual browser smoke.
Compatible legacy SmartPy tooling was not supplied: no legacy compile/tests,
modern substitute execution, manual Michelson edit or generated artifact.

No complete-pass disposition, no provisional/final clean claim and no conditional
post-clean coverage refresh. No final checklist update or `audits/report.md`.
The supported-workflow limitation in AUD-005-001 remains accepted; it was not
reopened as a production defect. Production behavior, network configuration,
runtime contracts, operational journals/archives/locks and historical evidence
are preserved. Final diff/status/whitespace checks and separate exports are
reported in the universal handoff.

## AUD-005 — current investigation (2026-11-19)

**COMPLETE AVAILABLE-SOURCE PASS — FIVE CONFIRMED FINDINGS.** No clean, deployment-readiness or live-integration claim. [Findings/evidence](AUD-005-findings.md) and the [remediation checklist](remediation-checklist.md) record the result. Historical sections below concern their identified older revisions.

| Repository | Exact reviewed/tested runtime revision and tree |
| --- | --- |
| Outer, including contracts/tooling | `fd47dda4adc4ccd23b71447d765acc8c1198d543`, branch `ticket-AUD-005-full-correctness-review`; initially clean, no implementation changes during review |
| Independent Admin | `9edef7cac18c04f40e75a9b15fca0517208f7c6a`, same branch; initially clean, no implementation changes during review |

Reviewed working-tree additions/edits are only this coverage note, `AUD-005-findings.md`, checklist/reproduction guidance, four Outer `AUD-005-*.mjs` evidence scripts and two Admin `tests/repro/AUD-005-*.mjs` scripts. All source verification remains bound to the above runtime revisions; no passing result is attributed to a fix. Ignored `audits/work/AUD-005-*` retains discovery notes and verification logs. No real configuration journal, archive, lock, thumbnail master or browser storage was recovered/cleared for the investigation.

### Assumptions and boundaries

- Windows PowerShell, Node `v22.16.0`, npm `10.4.0`; installed dependencies, no installation/upgrade. Beacon SDK 4.8.1 (core/dapp 4.8.0), Parcel 2.16.4, Taquito 19.0.2, Sharp 0.35.3. Outer lockfile SHA-256 `D0083CFF4CC978C52830D78062E2A4DE9D7D5C3C9C490AE773ABB664B83EC935`; Admin `8A79D21B6E5F50FBAE2E972CE8B665836E8151FF49D2865B83F7E1BEE334C3EB`. Pages specifies Node 20/Linux, not exercised here.
- `NETWORK` unset; Public default `testnet` is Shadownet; Admin uses its persisted selector/reload lifecycle (tests control storage). RPC `https://rpc.tzkt.io/shadownet`, TzKT `https://api.shadownet.tzkt.io`; Drops `KT1HMCqYqyP9fTDjzm8KAfyPhFn3tpmSW4kc`, Exchange `KT1Ue9es4biDzt528YhNctPGcNeqw9nDXnSv`, legacy `KT1SZFfxFfRkbTcDUS17y1WVCKeudoLo8LX5`. Mainnet remains incomplete behind configuration gates. No address, endpoint, Beacon value, selector or persisted key changed.
- Canonical SPLINTERED params: scheduled, mirror `testnet`, October 9 2026 at 3 PM seasonal EST zone, HEN burn 1 excluding canonical `141634`, CANAAN `29` redeem 1, planned supply 10. Controlled tests also examine other configurations accepted by current schema, especially redeem amount 3. Registry mirrors and surface-specific targets are consequential inputs; configured values are not live observations.
- Scope is all consequential implemented workflows in both repositories, direct contract calls, local tools and build/deployment source. Excluded: cosmetic effects without consequential visibility, proposed/unimplemented architecture, historical model code as runtime, marketplace behavior after navigation, third-party internal audits beyond identified interfaces. Optional/dormant exports were traced for actual callers; presentation-only coercion was distinguished from transaction identity.
- No current live Webflow site/custom code/CMS, Beacon transport/wallet, RPC/indexer/time-provider accuracy, external FA2 ledger/operator semantics, deployed escrow/bundle/hosting identity or live transaction was observed. No detailed site inspection or external mutations occurred. Reference reads on 2026-11-19: [Michelson semantics](https://octez.tezos.com/docs/active/michelson.html) and [FA2 specification](https://gitlab.com/tezos/tzip/-/blob/master/proposals/tzip-12/tzip-12.md); these are interface oracles, not observations of configured services.
- Compatible legacy SmartPy tooling was unavailable; active source was neither changed nor compiled/executed. No modern replacement, generated Michelson or substitute model was used as active-contract evidence. Native OS crash/power-loss durability, Linux/Node-20 CI, fresh dependency install, browser/manual smoke and production rebuild remain unverified. Staging and Admin builds were local only.

### Independent discovery, then historical reconciliation

Before opening prior coverage/findings, source entry registrations, package commands, registry, wallet/trade builders, contract entries and CI formed 15 behavioral candidate groups: wallet/network; page/reveal; Drops actionable state; Exchange cart; public submission/recovery; direct trade; privileged contract/XTZ; Admin pause; treasury; pairs; Drops planning/send; local authoring; health/catalog; assets/CMS; delivery/provenance. The ignored initial note is `audits/work/AUD-005-discovery.md`.

Forward traces started at every page/Admin boot, DOM/SDK event, timer/poll, direct entrypoint and CLI/service/build command. Reverse traces followed wallet requests, FA2/XTZ effects, source/asset writes and balance/readiness/success publications back to all reachable callers. Boundary traces checked account/network generations, exact financial identities through DOM/mirrors/cart/Micheline/storage, asynchronous cached/requested/rendered state, configuration projections/journals, imported assets and branch-owned delivery artifacts. Newly exposed callers entered the map before examination ended.

Only then were AUD-004 W01–W20 and AUD-003/AUD-002/CHR ledgers consulted. Reconciliation explicitly added signer-backed Exchange provisioning, separated frozen/current/deployed contract identity and split shared groups into the stable W01–W20 contracts below. No earlier consequential row was removed as “already fixed.” Cosmetic/dormant exclusions retain the reasons above. This reconciliation is initial discovery completion, not the conditional post-clean refresh.

### Behavioral map and complete pass dispositions

Every row received independent expected-property grounding, producer/consumer/alternate-entry tracing, applicable malformed/boundary/order/failure/recovery challenges and a classified result. “Examined” means explained current local flow under the stated interface assumptions; it does not mean every external effect was executed. Tests support the named seams and never define the property by themselves.

| ID / workflow | Expected property and current source boundaries | Examination / result |
| --- | --- | --- |
| W01 Arrival, navigation, reveal, Utility | Usable page/wallet regions despite font/image/load failure. Outer shells, `webflow/*`, `shared/public-first-paint.js`, `collection-utility/js/main.js`, reveal coordinator | Examined early/full startup, masks, duplicate boot, optional nodes, image/font failure, local routes and Utility controls. Loader/navigation/reveal tests and build graph checks pass. Live Webflow DOM/custom code unverified. |
| W02 Public wallet lifecycle | Only current verified account/network observations authorize or replace state. `shared/beacon-setup.js`, `network.js`, registry and page subscribers | Examined boot/permission/read resolution and rejection, mismatch cleanup before/after event replacement, null/same-address reconnect, mobile controls and SDK version migration. Current wallet tests/repro pass; installed SDK request/account implementation inspected. Transport remains external. |
| W03 Holdings and identity projection | Complete exact balances; unknown distinct from zero; canonical CMS identities mapped to wallet IDs. Shared FA2 pager, Drops token rendering and both page consumers | Examined page caps/cursor progress, failed/partial/malformed/duplicate/unsafe balances, exclusions/mirrors, eligible quantities, template/native row boundaries and retired refreshes. Public/FA2/identity suites pass. Indexer filter truth/completeness is an external assumption. |
| W04 Drops time/pause/inventory/LIVE | Trusted schedule observation and current pause plus sufficient redeem inventory before actionable trade. `events.js`, shared clock/countdown/time/compatibility | Examined DST/date/uncertainty, clock jump/suspension/resume, standby/live/paused/error, initial supply and recovery polling, zero/unknown and configured amounts. **004: positive but insufficient inventory enables trade.** Other lifecycle regressions pass; provider accuracy unverified. |
| W05 Drops trade/approvals | Exact selected identity and all six terms under current wallet/selection/escrow at request. `events.js`, shared trade helpers, contract | Examined configured burn/redeem quantities, selected balance, pair absence/ambiguity/pagination, approval fallback and order, final wallet/selection gates, serialized one-trade payload and errors. Actual handler/ABI checks pass; 004 remains a final inventory-precondition defect. |
| W06 Exchange cart/trades | Exact per-unit ratios, ownership/totals, all batch entries and final current account/cart. `exchange/js/*`, shared helpers, contract | Examined duplicate CMS identities, quantity caps, aggregate reductions, edition-derived terms, each expanded entry, approval grouping, missing one mapping blocks whole batch, final equality and reconnect. Suites/ABI check pass. Actual FA2 inventory/application unverified. |
| W07 Public durable submission/outcomes | Unresolved submission cannot authorize repeats; attributed terminal evidence is separate from refreshed holdings. Shared journal/confirmation/poll and both page consumers | Examined Web Locks, reservation capacity/size/storage failure/reload, matching cancellation versus ambiguous rejection/hashless state, complete receipt count/identity, deadline fetch/body/retry/late result, partial stale balances and recovery. Current tests/repros pass. No real wallet request, finality/reorg or journal reconciliation observed. |
| W08 Admin boot/network/authority | Correct surface target and current authority across awaits/reload; presentation cannot grant chain privilege. Admin bootstrap/network/Beacon/live-cfg/indicator/status | Examined both surface registrations, persisted/legacy keys, mismatch clearing, selector failure, account events and captured write authority, diagnostics and cache scope. AUD-004-002 current guards/tests hold. Mainnet remains gated; SDK/hosting boundaries unverified. |
| W09 Pause/recovery, both escrows | Stored admin authority and verified pause target; ambiguous toggle blocks repetition. `features/pause*`, `escrow-ops.js` | Traced storage/account/button gates, helper checks, durable pre-request reservation, late receipt, cross-tab conflict, confirmation and status-only recovery, failures and publication ownership. Pause suites/current repro pass. No actual toggle performed. |
| W10 Treasury custody/XTZ/MAX/recovery | Exact amounts/IDs/recipient/target, all operations attributed, durable uncertainty and current publication. `features/treasury/*`, escrow helpers, TzKT | Examined complete inventory, submit snapshot, whole-number transfers, decimal conversion, Max request/account context, all batch effects, rejection/confirmation/refresh and conflicting/reloaded recovery. AUD-004-001 corrected input controls and all Treasury suites pass. No custody movement performed. |
| W11 Pair list/create/edit/cleanup | Exact terms/IDs and initiating authority through availability and send; truthful attributed outcomes. `features/pairs/*`, escrow helpers, pair reads | Examined shared/Exchange forms, locked currency, ID availability/range/large nats, modal session and pending ownership, direct helpers, cleanup, list refresh and malformed/partial pages. Current pair-authority suites cover all write routes; original AUD-004-002 trigger rejected. External chain results unverified. |
| W12 Drop load/preview/build/chunked send/status | Source/translation/current UI owns every chunk and readiness publication; partial/unknown results stop continuation. `features/drops/*` services/controller/builder/status | Examined initial/manual/auto paths, canonical/mirror/exclusion and ID allocation, ranges/chunks, cached intent equality, pause/network/account/source changes around awaits, partial/unconfirmed batch history and final refresh. **002: same-context status reads lack per-request publication ownership.** Config resets still fence old status. |
| W13 Checklist/Health/CMS/economics/catalog | Current scoped evidence; complete enumeration and unknown remain explicit. Checklist, health modules, catalog/NFT/cache/CSV/econ utilities | Examined supply-derived depleted/pause/pairs recomputation, health/CMS events, upload/recheck ordering, header/quote/duplicate/missing IDs/ACID, local title/thumb identity, network caches and forced economics refresh. AUD-004-005 controls hold; 002 affects pairs-status input. Current Health/checklist tests pass. Local CSV checks do not certify live CMS/minting. |
| W14 Local authoring/provider | Reviewed immutable preview/source/version owns apply; failed verification revokes trusted params. Admin authoring/provider, Outer loopback API | Examined field serialization, disabled-row preservation, time/amount validation, preview expiry/binding, acknowledgement, edit/close/apply retirement, readback constraints, health loss/retry and production isolation. **003: body stall escapes deadline and retains READY.** Rejected health retires correctly. |
| W15 Source/projections/archive/lock/recovery/CLI | Source ownership, exact projections, concurrency, durable uncertainty and preserved independent edits. Outer `shared/drop-params/*`, CLI/service; Admin mirror guard | Examined CREATE/EDIT/DEACTIVATE, CAS/staging/replacements/final equality, archives/idempotency, lock/reclaim, pending/READY, every recovery outcome and external edits. **001: source save during ownership read is still lost.** Broader-window fix holds. Isolated 144-case config suite and original writer regression pass. |
| W16 Direct contract trades/admin/default | Every trade's sender and six terms; exact custody effects, admin-only mutations, atomic rejection and truthful events. Active legacy source plus all client builders | Exhaustive source branches: pause/empty/missing/mismatched/later-item trades; grouped contract/duplicate items/destinations; setup/update positive amounts and distinct contracts, duplicate IDs and cardinality/cleanup; rescue, XTZ/default and external FA2 failure. No new contract-source defect confirmed. No admin/burn-address setter exists. Legacy compile/execution and real FA2 effects unavailable. |
| W17 Public/Admin build/deploy/dev | Complete branch-owned artifact graph; projections/manifest and production-authoring isolation agree. Packages, Pages CI, loaders/verifier, Admin production scripts, dev/harness commands | Traced dual main/staging checkout, freshness, bundle/copy/provenance/source-map guards/upload/deploy, Admin sync/guard/prune/isolation and dev watcher/service/port/harness writes. Both builds and loader/tooling tests pass. No deploy, sanity server or fresh prod build; remote refs/CI/hosting identity unverified. |
| W18 Thumbnail/site/CMS tooling | Exact asset identity, retained originals, coordinated writes/rollback, complete reads and explicit ambiguous mutations. Outer asset tools/CMS exports; Admin manifest/lock | Examined suffix discovery, conversion/key allocation, exclusive archive/manifest ownership/rollback/backfill, static optimizers, CMS identity/pagination/retries/upload/content/hash/publication comparison/readback. **005: raw URL filename changes identity.** Apostrophe, lock/concurrency and normal-file controls pass. CMS exports have no active app/CLI mutation caller; no live site accessed. |
| W19 Signer provisioning | Default inert; explicit provider/chain/admin/ABI/exact payload and full readback. `scripts/shadownet-exchange-pairs.mjs`, registry, promoted ABI | Traced argument modes, fixed 44 pairs, RPC/chain/block/storage/entrypoint/admin checks, empty mapping/cardinality, signer construction boundary, send/confirmation/readback. Dry-run and tests pass. Script checks ABI, not executable deployed-code equivalence; it has no pause precondition. No current authorized requirement to add one was found; no execute/live verify invoked. |
| W20 Contract provenance/origination | Current source, certified frozen artifact and originated identity remain distinct. Canonical source, promoted artifacts, certification/promotion/deployment records | Current source/snapshot/mechanical fixture/target correspondence and frozen/promoted byte checks pass; actual Public/Admin payloads decode including huge nat. Historical origination record dated 2026-10-08 is not a current live observation. Legacy compile and current deployed code/storage/admin/sink/inventory unverified. |

For bounded financial/privileged paths, construction, request, confirmation and refreshed publication were examined separately. Invalid/missing/unsafe identities/amounts, duplicate and batch totals, account/network/source replacement, external transfer rejection/insufficient balance, partial/failed/ambiguous outcomes and recovery were challenged at their relevant seams. Contract per-element checks and all effects were traced independently of UI validation; native atomicity and FA2 compliance are external protocol assumptions, not a substitute local model. Asset/reveal-only paths have no chain rollback; their output ownership/visibility/failure semantics were examined instead.

### Verification, reconciliation and result note

- Outer public/shared/Drops/Exchange selection: **363 pass**. Script/loader/Outer thumbs/CMS selection: **87 pass**. Shared trade fixtures: **20 named checks + 19 deadline tests pass** (overlapping some broad tests). Windows file selections were enumerated explicitly with the recorded Node flags in the report.
- Admin `npm run test:runtime`: **1,908 pass**. `npm run test:thumbs`: **28 pass**; build's manifest freshness check passes. Real-tree transaction suites were not run; `node audits/repro/AUD-004-config-suite.mjs` ran copied unchanged suites: **25 + 19 + 10 + 89 + 1 = 144 pass**. No real journal was recovered or deleted.
- Five AUD-005 reproductions pass by demonstrating bad behavior and valid controls. The AUD-005 ABI probe passes; the original historical ABI VM lacked new authority/target dependencies. Provenance check, invariant map (**26/26**, **181/181**, **13 tests**) and 44-pair default provisioning dry-run pass. ABI/mapping checks do not compile/typecheck/execute the contract.
- Eleven maintained Outer AUD-003 runners pass: `exchange-duplicate-balance`, `pending-ready`, `projection-falsy`, `public-stalled-reads`, `public-stale-live`, `receipt`, `recovery-external-edit`, `thumb-generator-race`, `utility-footer`, `wallet`, `webflow-pagination`. Five Admin AUD-003 replacements pass. Outer `drop-authority` is not counted as passing: its obsolete helper VM lacks the new target resolver; current `drops-send-invalidation`/`pair-authority` tests provide replacement coverage. The old AUD-004 defect-asserting amount/pair/supply/apostrophe scripts were not treated as current remediation gates.
- All five AUD-004 corrections were reassessed from current code and current controls. Withdrawal/pair-authority/supply-dependency original triggers remain corrected. Thumbnail apostrophes are corrected but URL identity still fails (005). Writer staging edits are detected but the narrower read window still loses them (001). CHR and AUD-003/AUD-002 dispositions are reconciled in the report; passing former triggers is not an adjacent-correctness claim.
- `npm run build:pages:staging` and Admin `npm run build:clean` pass. Both first-paint build verifiers pass, including incidental reads of pre-existing prod output; only staging was freshly built. Admin prune removed four dev chunks and isolation checked eight production files. Existing Browserslist-age/large-bundle warnings remain. No tracked generated drift resulted. Initial native/child-process sandbox failures passed on permitted reruns; no application assertion was waived.
- Findings remain **001–005**. No additional unresolved material local hypothesis is asserted. Speculative branches involving unsupported finite range configuration, arbitrary nonconforming FA2 honesty or SDK transport-internal races were not promoted into findings without a demonstrated reachable local contract/oracle. Current defaults/ranges and pinned interfaces were examined; external uncertainty remains qualified above.
- Examination is complete for declared available-source workflows at the identified revisions. Findings prevent a provisional clean result; the conditional independent post-clean enumeration was **not invoked**, and no final-clean claim is made. Final whitespace/status/diff/export checks accompany the universal handoff. Production behavior, generated data, DOM/events/interfaces/network/wallet contracts and historical evidence remain unchanged.

## AUD-004 — historical investigation (2026-11-17)

**COMPLETE AVAILABLE-SOURCE EXAMINATION — WITH FIVE CONFIRMED FINDINGS.** One complete adversarial pass at the revisions below; no clean-result, deployment-readiness or live-integration claim. The independent W01–W18 candidate map was constructed before opening AUD-003 coverage/findings, then reconciled into W01–W20 below. The [findings and evidence](AUD-004-findings.md) and [current remediation checklist](remediation-checklist.md) record the completed pass. Historical results below identify earlier source only.

| Repository | Reviewed source baseline |
| --- | --- |
| Outer, including contracts | `ticket-AUD-004-full-correctness-review`, HEAD `9675ca35016d1fc9a84a3fd93aa12cfde8732873`; clean tracked/index/untracked state at start. |
| Independent Admin | Same ticket branch, HEAD `38e922c54b57d5645022a0f86f9991fc596576a6`; clean tracked/index/untracked state at start. |

Environment: Windows PowerShell; Node `v22.16.0`, npm `10.4.0`; installed dependencies and lockfiles identify the tested tree, with Pages CI separately specifying Node 20. Public defaults to `testnet` (Shadownet); registry Drops escrow `KT1HMCqYqyP9fTDjzm8KAfyPhFn3tpmSW4kc`, Exchange `KT1Ue9es4biDzt528YhNctPGcNeqw9nDXnSv`, legacy `KT1SZFfxFfRkbTcDUS17y1WVCKeudoLo8LX5`. Mainnet remains incomplete and disabled by configuration gates. No external/live observation is claimed merely from these configured targets.

Scope: all consequential available-source application behavior in both repositories, direct escrow calls, configuration/asset tooling and build/deployment boundaries. Exclusions: purely cosmetic styling/animation without consequential visibility effects; historical proposal/model code as active runtime; third-party implementation audit beyond identified interfaces; behavior after leaving the application for marketplaces. No production-code remediation, operational recovery, live transactions, deployment or external mutations are authorized. Legacy compilation, real crash/filesystem durability, live Webflow DOM/custom code, SDK transport/provider behavior, FA2 semantics/deployed code, RPC/indexer/time accuracy and current deployed bundle identities require separate evidence. Their absence limits integration conclusions, not the obligation to trace local consumers.

Discovery used forward page/Admin registrations, SDK/DOM/lifecycle callbacks, timers, all contract entrypoints, CLI/service commands and CI; reverse searches from wallet sends, asset/configuration writes and authority/readiness/balance/success publications; and boundary traces through account/network generations, token mirrors, DOM/cart/Micheline/FA2 identities, source/projections, journals and branch-owned loader graphs. This formed W01–W18 independently. Reconciliation with AUD-003 then exposed the signer-backed provisioning entry and contract provenance as explicit additional behavioral contracts, retained as W19/W20. No prior workflow is excluded merely because it was remediated. Prior rows are grouped below by shared contracts; all remain required examination.

| ID | Current workflow and consequential boundary | Source anchors (paths relative to their repository) | AUD-003 reconciliation |
| --- | --- | --- | --- |
| W01 | Public arrival/navigation/reveal/Utility: usable page and wallet controls despite image/font/load failures | Outer shells, `webflow/*`, `shared/public-first-paint.js`, `collection-utility/js/main.js` | Prior 1 |
| W02 | Public boot/connect/disconnect/persisted accounts: only current verified network/account may authorize effects | Outer `shared/beacon-setup.js`, `network.js`, `chain-registry.js`, page consumers | Prior 2–3 |
| W03 | Holdings/CMS projection: complete exact balances, canonical/mirror identity, unknown distinct from zero | Outer `shared/tzkt-fa2-balances.js`, `drops/js/token-rendering.js`, both page controllers | Prior 3–4, 7 |
| W04 | Drops schedule/pause/supply/LIVE: trusted time and current boolean pause/inventory evidence | Outer `drops/js/events-config.js`, `events.js`, shared time/countdown/compatibility | Prior 4–5 |
| W05 | Drops approval/selection/trade: exact terms, account and escrow at submission | Outer `drops/js/events.js`, `shared/public-trade-ops.js`, escrow source | Prior 6, 9 |
| W06 | Exchange cart/multi-token trade: exact ratios/totals/approvals, all batch entries, final authority | Outer `exchange/js/*`, `shared/public-trade-ops.js`, escrow source | Prior 7–9 |
| W07 | Public durable reservation/confirmation/recovery: no duplicate unresolved sends, scoped applied evidence and separate holdings reconciliation | Outer `shared/public-trade-ops.js`, both page controllers | Prior 6, 8–9 |
| W08 | Admin boot/network/wallet/surfaces/authority: target and generation ownership through awaits/reload | Admin `src/admin.js`, `network.js`, `beacon-setup.js`, `utils/live-cfg.js`, indicator/status | Prior 10–11, 20 |
| W09 | Admin pause and recovery: verified target/admin/state; unknown toggle outcome blocks repeat | Admin `src/features/pause*`, `src/escrow-ops.js` | Prior 11 |
| W10 | Treasury inventory/FA2 rescue/XTZ/MAX and recovery: exact amounts/destinations, current authority, durable uncertainty | Admin `src/features/treasury/*`, `src/escrow-ops.js`, `src/tzkt-api.js` | Prior 12–13 |
| W11 | Drops/Exchange pair list/create/edit/cleanup: exact IDs, complete reads, ownership and truthful operation outcomes | Admin `src/features/pairs/*`, `src/tzkt-api.js`, `src/escrow-ops.js` | Prior 14–15 |
| W12 | Drop snapshot/load/preview/build/chunked send: source/translation/ID assignment and partial-send boundaries | Admin `src/features/drops/*` excluding authoring/checklist | Prior 16–17 |
| W13 | Checklist/health/CMS/catalog/economics: current scoped readiness; incomplete/unknown/cache state remains explicit | Admin health, checklist/status services, adapters, NFT/cache/CMS/economics utilities | Prior 18–20 |
| W14 | Local authoring/provider: reviewed preview binds source/version/operation; production writer isolation | Admin authoring/provider; Outer loopback authoring service | Prior 21–22 |
| W15 | Source/projection/mirror writer/watch/archive/journal/lock/CLI: CAS, concurrency and interrupted recovery preserve authoritative state | Outer `shared/drop-params/*`, writer CLIs; Admin mirror guard | Prior 23–24 |
| W16 | Direct trade/admin contract entries: every trade's sender/terms, grouped effects, cardinality, rescue/XTZ authority, atomic rejection and event truth | Outer active legacy escrow source and client serializers | Prior 25–27 |
| W17 | Pages/Admin dev/build/release: branch-owned complete artifact graph, projection equality and production authoring exclusion | Both package/build scripts; Outer loaders/Pages CI/verifier; Admin production scripts | Prior 32–33 |
| W18 | Thumbnail/manifest/site asset tooling and exported Webflow CMS library: identity, transactional recovery, pagination and ambiguous mutation evidence | Outer `assets/*`, optimizers; Admin manifest generator/lock | Prior 30–31 |
| W19 | Signer-backed Exchange provisioning: default inert dry-run, fixed chain/admin/ABI/payload/readback | Outer `scripts/shadownet-exchange-pairs.mjs`, shared confirmation/registry | Prior 28; added explicitly during reconciliation |
| W20 | Contract source/frozen/promoted/deployment provenance: current source, certified artifact and originated identity remain distinct | Outer active source, contract artifacts, certification/release records | Prior 29; split from W16 during reconciliation |

Expected properties are independently grounded in `PROJECT_INTENT.md`, authority/conservation/exact-identity rules, repository safeguards and identified protocol interfaces. Code/tests describe behavior and are not their own oracle. All seven CHR known issues and all 20 AUD-003 findings were reassessed at these exact revisions; see the report's reconciliation ledger. Discovery reconciliation is not a post-clean coverage refresh.

### AUD-004 examination dispositions

Every row received expected-property grounding, producer/consumer and alternate-path tracing, relevant adversarial input/order/failure challenges, and evidence classification. “Examined” means local consequential flow was explained; external effects retain the limitations below. Passing tests support particular seams, not an independent correctness oracle or an absence-of-defects claim.

| Workflow | Completed examination and adversarial evidence | Result / consequential limit |
| --- | --- | --- |
| W01 | Page bootstrap/loaders, DOM masks and release owners through font/image failure, duplicate startup, missing optional nodes, local navigation, wallet controls and Utility connectors; first-paint, reveal, loader and footer tests/build checks. Cosmetic animation excluded after classifying its effects. | Examined; no additional confirmed material defect. Live Webflow shell/custom code remains unverified. |
| W02 | Persisted account/network verification, permission rejection, generation-fenced startup and account events, disconnect/reconnect, obsolete resolution/rejection; actual Beacon 4.8.1/4.8.0 account/request interfaces inspected. | Examined; current local tests reject prior stale-owner triggers. Wallet transport, permissions UI and mobile session behavior unverified. |
| W03 | Paged ID-cursor reads, partial/malformed/duplicate/unsafe balances, canonical/mirror translation, exclusions, CMS template cloning and stale rendering through both page consumers; unknown versus empty and aggregate quantities. | Examined with public/FA2/identity suites. Query-filter accuracy and current CMS rows are external assumptions. |
| W04 | Calendar/DST boundaries, trusted clock aging/latency/lifecycle reset, scheduled/unscheduled/incompatible params, pre/standby/live/paused/sold-out/unknown supply, poll retirement and retry. | Examined; current LIVE regressions pass. Real time-provider accuracy and current escrow state unverified. |
| W05 | All selected-token validations, exact six-term pair match, unique/paged mapping, operator read/fallback, final selection/wallet/target checks, approval-first batch and serialized unit trade; malformed/oversized balances and rejection/timeout paths. | Examined with real-handler payload decoding and Public tests. External FA2 operator compliance and application unverified. |
| W06 | Cart add/remove/clear, quantity and total caps, duplicate token identity aggregation, edition-derived redemption, each expanded unit trade, approval groups, final cart/account equality and refresh ownership. | Examined; aggregate-reduction and exact payload tests pass. No real multi-token operation executed. |
| W07 | Reservation/lock/storage failure and reload, hashless/ambiguous request outcome, matching applied/failed/backtracked/skipped evidence, bounded transport/body/retry deadline, stale or partial holdings after confirmed application. | Examined; no repeat authorization from unresolved state in tested paths. Actual indexer receipts/reorg behavior unverified. |
| W08 | Both Admin surface bootstraps and all write callers traced through config resolvers, selector reload, network/persisted account checks, authority events, indicator and diagnostics publication. | Examined; pair callers omit the authority binding used by other privileged writers (finding 002). Presentation is not chain authority. |
| W09 | Pause target/admin/pause reads, final ownership, wallet rejection, ambiguous send and timeout, durable conflict/reload/recovery and scoped storage confirmation on both surfaces. | Examined; current pause recovery/authority tests and maintained repro pass. No toggle performed. |
| W10 | Complete inventory, bulk recipient/FA2 identity/positive exact amounts, approval-free admin rescue, all intended operations' applied evidence; XTZ decimals/Max/snapshot invalidation, persisted unknown outcomes and recovery. | Examined; amount-input corruption confirmed (001); other tested custody/recovery boundaries hold. Real wallet signing and admin custody effects unverified. |
| W11 | All create/edit/cleanup entrypoints across shared and Exchange forms, ID availability/ranges, exact term serializers, safe/unsafe nat handling, complete mapping pages and attributed confirmations; form/render epoch and account-order challenges. | Examined; obsolete Set Pair intent can submit as replacement B (002). Other helper probes characterize omitted guards without claiming B signed or had admin rights. |
| W12 | Static/dev snapshots, falsy/invalid/drift retirement, canonical/mirror transforms, exclusions, explicit pairs, pair allocation/collision/chunk bounds; preview/cache/view-signature and source/account/network/pause invalidation before/after every chunk await. Partial/unknown chunks stop further work. | Examined; runtime suite and CHR/AUD-003 replacements pass. Already submitted chunks cannot be undone by UI retirement; no chain batch run. |
| W13 | Health pagination and holder validation, unknown editions, explicit refresh versus cached economics, CSV header/value/duplicate/missing-ID cases, local assets/catalogs, network scoping and checklist state dependency propagation. Local presentation caches traced separately from financial reads. | Examined; supply failure leaves depleted-derived pill/pair projections stale (005). Local CSV/assets/Git equality do not certify published CMS, minting or deployed readiness. |
| W14 | Authoring actions/delegation, form integer/date/token serialization including disabled-row preservation, validation/preview/acknowledgement, edit retirement, apply/read-back fencing, health loss/retry and production static provider. Service origin/host/path/method/payload/operation guards traced. | Examined; transaction writer's staging race affects this caller too (003). Loopback/service OS permissions and real browser interaction remain unverified. |
| W15 | CREATE/EDIT/DEACTIVATE and CLI, source hash/CAS, archives, staged files, writer/projector locks, source/JSON/mirror equality, pending journal/READY semantics, every replacement failure, rollback/reconciliation and external-edit recovery. Real mutating suites isolated in disposable copies. | Examined; normal apply loses a later external source edit (003). Recovery-specific AUD-003 trigger stays fixed. No real journal recovered/deleted; OS power-loss/fsync durability unverified. |
| W16 | Direct sender validation on every trade; pause, pair existence and all six stored terms; positive setup/update amounts; duplicates/count/remove/clear; same-FA2 prohibition; grouped burns and redeems, destinations, approvals, insufficient inventory/rejecting/no-op FA2 distinction, rescue/admin change/burn-address/XTZ/default and event fields. Client bypasses traced back to source guards. | Examined by source plus actual client payload decode against promoted ABI. No new confirmed source defect. Legacy SmartPy compile/execution and deployed Michelson/FA2 behavior not established by these checks. |
| W17 | Public entry/bundle/loader graph and staging/production ownership through Pages trigger/build/guard/verify/upload/deploy steps; Admin build mirror/manifest/production-authoring prune and isolation; dev port/watcher/service lifecycle. Missing/stale loader artifacts tested. | Examined; staging build and Admin clean build pass. Node 20 CI, remote runner/hosting/custom domain and deployed identities unverified. Pre-existing production bundles were not rebuilt. |
| W18 | Asset fetch/verify/transform, bounded retries/rollback, shared generation lock and output checks; numeric suffix/filename-to-JS boundary; Webflow library pagination/progress, incomplete/ambiguous mutation evidence and identity/hash/perceptual checks. | Examined; supported apostrophe filename emits invalid JS (004). CMS tooling tested inertly; no live site inspection/mutation or upload performed. |
| W19 | Default no-provider/no-network dry-run and fixed 44-pair economics; signer provider selection, Shadownet chain/admin/storage/ABI/paused checks, pinned read scope, exact payload, operation attribution and required full read-back. | Examined; default dry-run and provisioning tests pass. Execute/verify live modes deliberately not run; signer trust, current storage and actual chain outcome unverified. |
| W20 | Canonical/snapshot identity, mechanical legacy-test stripping with unchanged compilation target, frozen/promoted LF identity, manifest/certification/promotion versus historical originated-code observations. | Examined; current byte checks and ABI decoding pass. Historical certification is not a new compile, source-to-deployed equivalence proof or current deployment observation. |

For bounded financial/privileged flows, the examination followed each effect from input/authority through construction, send, outcome and refreshed publication separately. Invalid nat/amount/identity/pair, insufficient ownership/inventory, rejected external transfer, partial batch, ambiguous request/confirmation and account/network/source replacement were considered at each relevant seam. The contract's per-trade checks apply inside the loop, not just to its first element; native Tezos atomic execution is a protocol dependency, not a locally executed simulation result. Arbitrary nonconforming/no-op FA2 code cannot be made honest by client or escrow validation. UI/asset-only flows have no independent chain rollback branches; their applicable failure publication and generation/rollback boundaries were examined instead.

### AUD-004 verification, assumptions and external limits

- Windows/Node 22.16.0 verification used installed lockfile dependencies without installing or upgrading packages: Beacon SDK 4.8.1 (dapp/core 4.8.0), Parcel 2.16.4, Taquito 19.0.2 and Sharp 0.35.3. Node 20, Linux/browser filesystem semantics and fresh dependency installation were not exercised.
- Public/shared top-level and Drops/Exchange tests: **363 passed**. `npm run test:public-trade-ops`: **20 named fixture checks and 19 deadline tests passed** (deadline cases overlap the broad run). Admin `npm run test:runtime`: **1570 passed**. Script/loader/thumbnail/Webflow-library selection: **87 passed**. Admin `npm run test:thumbs`: **16 passed**; `npm run check:thumbs` passed.
- Configuration suites ran unchanged in workspace-bounded disposable copies: **25 authoring + 19 transaction + 10 service + 53 projection + 1 watcher = 108 passed**. The retained [safe runner](repro/AUD-004-config-suite.mjs) creates no operational state in the real source tree. Direct real-tree transaction tests were intentionally avoided.
- All twelve maintained Outer AUD-003 reproductions and five maintained Admin replacements passed. Frozen historical defect-asserting scripts were not misclassified as regression failures. Five new defect reproductions pass by demonstrating the current bad behavior with controls; they are not remediation gates. See the [reproduction guide](repro/README.md).
- `npm run build:pages:staging` and Admin `npm run build:clean` passed. Admin prune removed four development-only chunks and isolation verified eight production files. No tracked generated-file drift resulted. First-paint build verifiers passed for freshly built staging and also inspected existing production files; only staging's build belongs to this run. No Pages sanity/server/live publish test was run. Existing Browserslist-age and large-bundle warnings remain.
- Real current Public and Admin payloads decoded against the promoted Michelson parameter schema, preserving a nat larger than JS safe integer range. Mechanical provenance checks passed; invariant-map verifier reports **26/26 invariants, 181/181 obligations, 13 mapped tests**. This is mapping/identity/schema evidence, not execution of those SmartPy tests, Michelson typechecking or compilation. No compatible legacy compiler was provided or substituted.
- External reference interfaces consulted on **2026-11-17**: [HTML number input](https://html.spec.whatwg.org/multipage/input.html#number-state-(type=number)), [Octez Michelson execution](https://octez.tezos.com/docs/alpha/michelson.html), [Tezos FA2 overview](https://docs.tezos.com/architecture/tokens/FA2), and the [TzKT operation API controller source](https://github.com/baking-bad/tzkt/blob/master/Tzkt.Api/Controllers/OperationsController.cs). These identify interface assumptions, not observations of configured live services or a pinned deployed protocol/API revision. Installed SDK source and repository-pinned ABI provide version-specific local evidence.
- No live Webflow site was inspected. Local shell site marker `656cf42faa2b1a7a1582d9d2` is not verification of that site's current DOM/CMS/custom code. No RPC/TzKT/time-provider/account/signer/wallet session, deployed Pages/Admin bundle, current contract admin/pause/storage/inventory or FA2 transfer was observed. Historical Phase-11 deployment records concern their recorded date/targets; they are not refreshed here. Actual SDK transport, wallets, HTTP accuracy, finality/reorgs, conforming FA2 behavior and external service availability remain unverified integrations.
- Excluded cosmetic/decorative behavior, dormant historical model/test scaffolding and out-of-application marketplace actions do not authorize assets/configuration under the traced current source. Presentation metadata/thumbs and their caches do not establish token ownership, supply, admin rights or operation application.

Pass result: **20/20 workflows examined; zero locally unexamined workflows; five confirmed material failures, all still open because remediation is outside scope.** Potential extra issues (historical countdown phase versus current pause, unsafe presentation-only IDs, provider filter fidelity and SDK internal timing) were investigated without promoting ambiguous intent, a dormant consumer or an unverified upstream assumption to a confirmed failure. Their relevant boundaries are qualified above and in the report. No unresolved additional material local hypothesis is asserted. A provisional clean pass was not reached, so the conditional post-clean independent refresh/final-clean evaluation was not invoked. Reassess and repeat the complete pass after remediation; passing existing checks does not resolve these findings.

Only investigation documentation and evidence were changed; production source, configuration, generated projections/manifests, operational journals, contracts and lockfiles remain unchanged. Exact verification commands and new finding preconditions are in the report. Both HEADs/branches/index contents remained at the declared baselines throughout the examination.

**Historical result: AUD-003 COMPLETE SOURCE EXAMINATION — WITH FINDINGS — 2026-11-12.** All 33 established workflows below were reexamined against that review's source; 0 partial and 0 unexamined. The [AUD-003 findings](AUD-003-findings.md) consolidate 21 inert candidate reproductions into 20 distinct findings. Eleven Public fixture failures are classified separately. This is not a clean result or live deployment certification. Material findings preclude the conditional post-clean source-driven enumeration refresh.

## AUD-003 review context and dispositions

| Repository | Exact current source and state at investigation start |
| --- | --- |
| Outer, including contracts | `ticket-AUD-003-full-correctness-pass`, HEAD `d45e0549029ca383f1e8b08e7c88b16997f12a30`; tracked/staged content clean; 22 retained untracked AUD-003 reproduction/diagnostic scripts. |
| Independent Admin, read-only | `codex`, HEAD `2764a96daaed44dfefe6b970fc99a1c88626075d`; tracked/staged content clean. Its index byte hash differs from the initial protected snapshot as previously documented; no staged content differs. |

Source/toolchain assumptions remain Windows, Node `v22.16.0`, npm `10.4.0`, Beacon SDK `4.8.1`, Taquito `19.0.2`, Parcel `2.16.4`, Sharp `0.35.3`; Pages CI specifies Node 20. The current `testnet` slot is Shadownet, with separate Drops and Exchange escrows stated in the historical map below; Mainnet configuration remains incomplete. Active SPLINTERED source settings are unchanged. Historical release/provenance records and locally generated output do not identify current deployed Pages, originated escrow storage or live FA2 behavior.

Each row below names one already established workflow. “Examined” means its consequential available-source control/data paths, adverse inputs, effect boundaries and consumers were traced; external live dependencies remain qualified in the [findings report](AUD-003-findings.md). Findings may appear in more than one consumer row without becoming duplicate root findings.

| # | Workflow | AUD-003 disposition and finding references |
| --- | --- | --- |
| 1 | Public arrival/navigation/Utility | Examined; [013](AUD-003-findings.md#aud-003-013--collection-utility-footer-link-does-not-navigate-in-local-shells). |
| 2 | Network/escrow/token identity | Examined; source targets/strict selectors preserved, live targets unverified. |
| 3 | Public wallet lifecycle/holdings | Examined; [001](AUD-003-findings.md#aud-003-001--stale-public-wallet-helper-can-disconnect-a-newer-account). |
| 4 | Drops configuration/catalog/selection | Examined; current Public compatibility and exact CMS/registry identity gates traced. |
| 5 | Drop time/pause/inventory availability | Examined; [011](AUD-003-findings.md#aud-003-011--drops-remains-live-and-actionable-after-a-later-pause). |
| 6 | Drops burn/redeem and refresh | Examined; [002](AUD-003-findings.md#aud-003-002--unsafe-drops-starting-balance-can-strand-a-submitted-hash), [010](AUD-003-findings.md#aud-003-010--a-stalled-confirmation-fetch-defeats-the-public-timeout). |
| 7 | Exchange cart/economics | Examined; [012](AUD-003-findings.md#aud-003-012--duplicate-exchange-rows-undercount-balance-reduction). |
| 8 | Exchange multi-token submission | Examined; [010](AUD-003-findings.md#aud-003-010--a-stalled-confirmation-fetch-defeats-the-public-timeout), [012](AUD-003-findings.md#aud-003-012--duplicate-exchange-rows-undercount-balance-reduction). |
| 9 | Shared approval/pair/outcome evidence | Examined; [010](AUD-003-findings.md#aud-003-010--a-stalled-confirmation-fetch-defeats-the-public-timeout), [012](AUD-003-findings.md#aud-003-012--duplicate-exchange-rows-undercount-balance-reduction). |
| 10 | Admin boot/wallet/network | Examined; current authority and switching paths traced. |
| 11 | Admin authority/status/manual pause | Examined; [005](AUD-003-findings.md#aud-003-005--unknown-admin-pause-toggle-can-reverse-the-requested-state). |
| 12 | Admin Treasury FA2 inventory/rescue | Examined; [003](AUD-003-findings.md#aud-003-003--ambiguous-treasury-outcomes-permit-repeat-withdrawal-or-rescue). |
| 13 | Admin XTZ balance/Max/withdrawal | Examined; [003](AUD-003-findings.md#aud-003-003--ambiguous-treasury-outcomes-permit-repeat-withdrawal-or-rescue). |
| 14 | Admin Drops pair create/edit/cleanup | Examined; exact mutation/serialization and direct contract effects traced. |
| 15 | Admin Exchange pair management | Examined; dedicated escrow and locked terms traced. |
| 16 | Admin drop snapshot/load/preview | Examined; [007](AUD-003-findings.md#aud-003-007--rounded-pair-status-can-declare-the-wrong-exact-token-fully-set), [008](AUD-003-findings.md#aud-003-008--local-writer-health-loss-retains-an-actionable-old-drops-snapshot), [009](AUD-003-findings.md#aud-003-009--malformed-admin-pair-pages-become-false-missing-status). |
| 17 | Admin drop batch send | Examined; [006](AUD-003-findings.md#aud-003-006--admin-drops-send-can-hand-as-prepared-batch-to-wallet-b), [008](AUD-003-findings.md#aud-003-008--local-writer-health-loss-retains-an-actionable-old-drops-snapshot). |
| 18 | Admin lifecycle/readiness/checklist | Examined; [007](AUD-003-findings.md#aud-003-007--rounded-pair-status-can-declare-the-wrong-exact-token-fully-set), [009](AUD-003-findings.md#aud-003-009--malformed-admin-pair-pages-become-false-missing-status). |
| 19 | Admin Health/CMS/economics | Examined; [004](AUD-003-findings.md#aud-003-004--malformed-health-balances-can-be-counted-as-complete-circulation), [014](AUD-003-findings.md#aud-003-014--manual-health-refresh-can-reuse-stale-healthy-economics), [015](AUD-003-findings.md#aud-003-015--blank-canaan-acid-csv-value-can-pass-health). |
| 20 | Admin labels/catalogs/presentation caches | Examined; presentation does not establish financial identity/authority. |
| 21 | Local authoring UI/provider handoff | Examined; [008](AUD-003-findings.md#aud-003-008--local-writer-health-loss-retains-an-actionable-old-drops-snapshot), [018](AUD-003-findings.md#aud-003-018--pending-journal-can-be-published-as-ready). |
| 22 | Loopback authoring API | Examined; [018](AUD-003-findings.md#aud-003-018--pending-journal-can-be-published-as-ready). |
| 23 | Transactional config/archive/recovery | Examined; [016](AUD-003-findings.md#aud-003-016--falsy-generated-projections-can-receive-a-completed-journal), [017](AUD-003-findings.md#aud-003-017--automatic-recovery-can-overwrite-a-later-external-source-edit), [018](AUD-003-findings.md#aud-003-018--pending-journal-can-be-published-as-ready). |
| 24 | Projection/mirror propagation | Examined; [016](AUD-003-findings.md#aud-003-016--falsy-generated-projections-can-receive-a-completed-journal), [017](AUD-003-findings.md#aud-003-017--automatic-recovery-can-overwrite-a-later-external-source-edit), [018](AUD-003-findings.md#aud-003-018--pending-journal-can-be-published-as-ready). |
| 25 | Direct escrow trade/FA2 custody | Examined; no new direct-source defect; live FA2/protocol behavior unverified. |
| 26 | Direct privileged pair mutation | Examined; no new direct-source defect; deployed ABI/state unverified. |
| 27 | Direct pause/rescue/XTZ | Examined; direct authority and effects traced; [003](AUD-003-findings.md#aud-003-003--ambiguous-treasury-outcomes-permit-repeat-withdrawal-or-rescue), [005](AUD-003-findings.md#aud-003-005--unknown-admin-pause-toggle-can-reverse-the-requested-state) are UI outcome roots. |
| 28 | Signer-backed Exchange provisioning | Examined; [010](AUD-003-findings.md#aud-003-010--a-stalled-confirmation-fetch-defeats-the-public-timeout) shares poller; live signer/RPC unverified. |
| 29 | Contract provenance/origination | Examined; historical source/artifact/deployment identity reconciled, current live identity unverified. |
| 30 | Thumbnail/site asset authoring | Examined; [020](AUD-003-findings.md#aud-003-020--standalone-thumbnail-generation-can-be-lost-by-input-rollback). |
| 31 | Exported Webflow CMS/asset effects | Examined; [019](AUD-003-findings.md#aud-003-019--exported-cms-list-operations-silently-truncate-malformed-pages), presently unused exported path. |
| 32 | Public delivery/build/Pages | Examined; no new current-source failure; live assembled/deployed artifacts unverified. |
| 33 | Admin production/development/harness | Examined; source guards and inert isolation controls traced, compiled production output unverified. |

Verification and exclusions: unchanged-revision Admin runtime suite 1,392 pass; copied configuration suites 31 plus 28+1 inner pass; tooling/loader/asset/CMS/provisioning suite 50 pass. Public suite 268 total, 257 pass and 11 fixture failures, separately diagnosed. Twenty-one inert candidate reproductions have valid controls; they resolve to 20 findings (two Health input variants share one). No operational build, live wallet/chain/FA2/indexer/Webflow/Pages test or legacy SmartPy compilation was performed. The [findings report](AUD-003-findings.md#verification-fixture-failures-and-boundaries) states exact gaps. No tracked production source or Admin source was changed by AUD-003.

## Historical AUD-001 enumeration and context

**Historical status: ENUMERATED — NOT YET AUDITED on 2026-11-02.** The following original context, discovery notes and behavioral map are preserved as AUD-001 evidence; their older revisions and “future examination” wording do not supersede the current AUD-003 result above. The 33-row map remains the starting scope for AUD-003, not a post-clean refresh.

The authoritative [correctness-review method](../docs/correctness-review.md) is unchanged. Implementation facts below come from current source. Expected properties are future examination targets grounded in [project intent](../PROJECT_INTENT.md), [repository safeguards](../AGENTS.md), [contract guidance](../contracts/AGENTS.md), and the operating/interface contracts in the [developer guide](../docs/developer-guide.md), [operations guide](../docs/operations.md) and [network runbook](../docs/testnet-to-mainnet.md). They are not findings that the implementation satisfies those properties.

## Review context

Scope is the full EA-XYZ application represented by available source: public Home, Drops, Exchange and Collection Utility; shared wallet/trade/time runtime; independent Admin UI and privileged operations; escrow and direct-chain callers; generated configuration, persistence and recovery; asset/CMS tooling; development, build, loaders and deployment integration. Consequential external dependencies are traced to application-facing requests, authority, payloads and outcome consumers; inaccessible internals/live state are qualified below.

| Repository | Examined revision and working tree |
| --- | --- |
| Outer `eatacid-xyz` | Branch `ticket-AUD-001-initial-coverage`, HEAD `328f47bc28cdf33f06fbb051874dd5a9ffed1aaa`; clean at discovery start. Contracts belong to this revision. Only this document changes in AUD-001. |
| Independent `admin-ui` | Branch `codex`, HEAD `c831010483b3bd1e49f94c279045d1f008d6e5be`; clean at discovery start, examined read-only. Outer HEAD does not identify Admin source. |

- Public selection is evaluation/build-time `testnet` unless explicitly overridden with `NETWORK`. Admin defaults to `testnet`, persists `ea.admin.network`, supports a debug-gated window override, migrates a legacy key and clears the active account before reload-boundary switching. `testnet` means Shadownet: RPC `https://rpc.tzkt.io/shadownet`, TzKT `https://api.shadownet.tzkt.io`. Registry targets are Drops `KT1HMCqYqyP9fTDjzm8KAfyPhFn3tpmSW4kc`, Exchange `KT1Ue9es4biDzt528YhNctPGcNeqw9nDXnSv`, legacy escrow `KT1SZFfxFfRkbTcDUS17y1WVCKeudoLo8LX5`. Surface fallback rules differ by consumer. Mainnet escrow/ACID configuration is incomplete; no readiness or deployment is inferred.
- Authored snapshot: scheduled `SPLINTERED`, mirror network `testnet`, October 9, 2026, `3:00 PM EST`; HEN burn 1 excluding canonical ID `141634`; CANAAN redeem ID text `29`, amount 1, planned supply 10. Labels pass through shared timezone/DST conversion. A passed date/configuration does not unpause a contract.
- Both lockfiles pin Beacon SDK `4.8.1` / beacon-core `4.8.0` and Parcel `2.16.4`; Outer locks Taquito `19.0.2` and Sharp `0.35.3`. Lockfiles at the revisions above identify dependency trees, whose internals were not audited. Inspection host reports Node `v22.16.0`, npm `10.4.0`; Pages CI specifies Node `20`. No install/build/toolchain equivalence check ran. SmartPy is legacy syntax, subject to its manual compilation limits.
- Deployment assumptions are source-visible: exact production hostnames select `prod`, others select `staging`; CI separately checks out `main` and `staging`. Their deployment-time revisions/published bundles were not examined. Local shells identify Webflow site `656cf42faa2b1a7a1582d9d2`; no live site was confirmed or inspected. No external observation target/date evidence is claimed.

## Discovery and reconciliation

**Forward:** started from page/module startup, shell inline scripts, DOM actions, Beacon subscriptions, timers/lifecycle events, Admin feature registrations, every escrow entrypoint, service/CLI/configuration writers, package commands and Pages CI. Followed validation, transformations, requests, effects and outcome presentation through their consumers.

**Reverse:** independently located wallet operation requests, approvals, FA2/XTZ movements, privileged storage changes, filesystem/CMS writes, and consequential balance/supply/authority/readiness/LIVE/success decisions. Traced back to public and Admin actions, indirect events/background work, exported helpers, generator/watch/build commands, signer CLI and direct-chain calls. Submission, confirmation and refreshed balances were kept separate.

**Boundary:** followed wallet/network generations; canonical/mirror IDs; DOM/CMS editions and quantities through cart/Micheline/escrow mapping/FA2; cached/requested/rendered state; source JS/JSON/independent Admin mirror/provider; loopback API/filesystem recovery; and Webflow shell/router/environment loader/bundle/deployment ownership. Newly exposed metadata enrichment, GitHub checklist polling, asset/CMS tooling and signer provisioning were pursued below. Tracing stopped at explained source effects or explicitly inaccessible boundaries, not named modules.

Only after forming the candidate map was existing coverage consulted. It was an empty “NOT YET ENUMERATED” template: no old behavioral rows required retention/removal reconciliation. This is initial enumeration, not a post-audit refresh.

## Behavioral map

Paths are relative to Outer, including `admin-ui/` for the independent repository. “Escrow source” means the active SmartPy source linked below, not an originated contract. Expected properties derive from the intent/safeguards above and the stated interface; their satisfaction remains unaudited.

| Workflow | Observed path and consequential boundaries | Grounded expected properties | Relevant source locations |
| --- | --- | --- | --- |
| Public arrival/navigation/Utility | Four Webflow-derived shells load first paint, wallet and page modules. Fonts/hero, fail-open timeout, banner, image load/error, Webflow navigation/tabs and inline marquees/Utility connectors affect access. Outgoing marketplace links leave app authority. THE WAVE/ETH has presentation but no bridge/mint implementation found. | Available, truthful network/action presentation; presentation cannot grant financial authority. | [Home shell](../index.html), [Drops shell](../drops/index.html), [Exchange shell](../exchange/index.html), [Utility shell/runtime](../collection-utility/js/main.js), [Utility markup](../collection-utility/index.html), [first paint](../shared/public-first-paint.js), [Webflow Home entry](../webflow/home.js) |
| Network/escrow/token identity | Registry supplies public adapters, Admin live targets, collection addresses, pair-map paths/ranges and HEN/INTRODUCTIONS mirrors. Dedicated/fallback/incomplete-config rules differ by surface. Admin presentation translates canonical IDs. | Exact chain/escrow/FA2/token meaning across transformations; incomplete configuration cannot imply readiness. | [registry/resolvers/validators](../shared/chain-registry.js), [public network](../shared/network.js), [Drops config](../drops/js/events-config.js), [Exchange config](../exchange/js/exchange-config.js), [Admin network](../admin-ui/src/network.js), [live targets](../admin-ui/src/utils/live-cfg.js), [HEN IDs](../admin-ui/src/utils/hen-ids.js) |
| Public wallet lifecycle/holdings | Beacon client reuse, version-gated Matrix cleanup, permission requests and persisted-account network validation feed desktop/mobile controls. Startup/`ACTIVE_ACCOUNT_SET` publish document `publicWalletStateChanged` with account/NFT promise; Drops/Exchange own pending/error/retry/generation projections. Disconnect also emits `walletDisconnected`. TzKT supplies FA2 holdings. | Current verified wallet/network owns actionable state; obsolete observations cannot authorize later effects; unknown holdings differ from empty. | [wallet lifecycle/fetchNFTs](../shared/beacon-setup.js), [Drops synchronization](../drops/js/events.js), [Exchange synchronization](../exchange/js/exchange.js) |
| Drops configuration/catalog/selection | Bundled params drive scheduled/no-drop gates, details, exclusions and redeem preview. Captured CMS templates provide canonical IDs/labels/images; wallet holdings and mirror map produce eligible rows, burn thresholds and exclusive selection. Metadata/image/supply and wallet reveal owners are separate. | Preserve configured identity/amount/exclusions through CMS-to-wallet projection; metadata is not ownership; terminal unavailable states remain explicit. | [params entry](../shared/drop-params/index.js), [authored params](../shared/drop-params/drop-params.js), [Drops initialization/render/cart](../drops/js/events.js), [identity renderer](../drops/js/token-rendering.js), [reveal barrier](../drops/js/reveal-coordinator.js), [early masks](../webflow/drops-first-paint.js) |
| Drop time/pause/inventory availability | Shared calendar/DST conversion feeds trusted UTC sampling from timeapi.io with latency/age/clock/lifecycle invalidation and retries. Expiry enters standby then polls escrow storage for unpause. Initial/current escrow redeem holdings drive supply, sold-out and visible/live-phase polling; state feeds button action. | Countdown is not unpause authority; unknown time/storage/supply cannot become confident LIVE/sold-out/readiness; retired owners cannot publish. | [calendar conversion](../shared/drop-time.js), [trusted clock/countdown](../shared/drop-countdown.js), [pollForUnpause, startCountdown, supply/button state](../drops/js/events.js) |
| Drops burn/redeem and refresh | Selected contract/token/balance becomes configured-amount trade. Approval/pair reads precede final wallet/selection check, approval-first Beacon batch and `initiate_trade`. Hash confirmation precedes success/explorer; expected balance-reduction polling, confirmed-trade retention and retry handle refresh/account changes. | Exact wallet/terms/recipient at effect; distinguish request, application and holdings freshness; uncertain refresh must not authorize duplicate burn. | [handleEventExchange/balance guards](../drops/js/events.js), [trade helpers](../shared/public-trade-ops.js), [escrow initiate_trade](../contracts/burn-redeem-escrow/smartpy/burn-redeem-escrow-smartpy.py) |
| Exchange cart/economics | 419/CANAAN CMS rows receive registry attributes. Verified holdings enable quantities; add/remove/clear and totals use `ceil(100 / editions)`. Pending/disconnected/error/empty states and bottom actions depend on balance verification; send re-reads cart. | Owned quantities, exact identity, editions, derived amount and totals agree; unknown/malformed inputs cannot create actionable value. | [CMS shell](../exchange/index.html), [getEditionCount/getBurnCart/processWalletNFTs/updateTotal](../exchange/js/exchange.js), [config](../exchange/js/exchange-config.js) |
| Exchange multi-token submission | Each quantity expands into unit-burn trades grouped by FA2, redeeming ACID COIN #0 at derived per-unit amount. Approval/pair reads, final account/cart checks, Beacon send, scoped confirmation, reset and confirmed-trade balance refresh/retry use wallet generations/in-flight ownership. | Per-unit/whole-batch amounts and mappings agree; current wallet authorizes effect; truthful submitted/confirmed/refreshed outcomes. | [handleExchange/post-trade lifecycle](../exchange/js/exchange.js), [shared helpers](../shared/public-trade-ops.js), [escrow source](../contracts/burn-redeem-escrow/smartpy/burn-redeem-escrow-smartpy.py) |
| Shared approval/pair/outcome evidence | Both clients page active mapping for unique exact six-term match; operator reads check owner/operator/token and build missing `update_operators`, with add-approval fallback on read error. Approvals persist at external FA2. Operation polling matches destination/entrypoint/status; NFT polling separately compares starting quantity reduction. | Preserve approval authority and exact trade terms; failed/partial/ambiguous evidence is not confirmed application or complete balances. | [fetchTokenPairId/buildApprovalOps/pollForConfirmation/pollForNFTUpdate](../shared/public-trade-ops.js), [Drops caller](../drops/js/events.js), [Exchange caller](../exchange/js/exchange.js) |
| Admin boot/wallet/network switching | DOM startup wires both surfaces and providers; leaving Drops closes shared pair modal. Beacon validates accounts and emits document `wallet:disconnected`. Selector clears account, persists network then reloads. Localhost development dynamically imports authoring; production uses static provider. | Visibility grants no privilege; current verified account/target owns effects; switching retires old authority/state. | [bootstrap](../admin-ui/src/admin.js), [Beacon](../admin-ui/src/beacon-setup.js), [switch lifecycle](../admin-ui/src/network.js), [wallet helper](../admin-ui/src/utils/wallet.js), [ensureAccount](../admin-ui/src/escrow-ops.js) |
| Admin authority/status/manual pause | Indicator polls wallet/admin storage, caches authority by context. Exchange diagnostics and parameterized pause controllers read paused/admin/burn address; toggle sends then polls storage change. Document versus panel `escrow:paused:state` informs Drops gates/checklist. Privileged Exchange resolution rejects legacy fallback. | Only chain admin controls pause; stale/unknown observations cannot assert privilege/live state; unpause remains deliberate operator action. | [indicator](../admin-ui/src/features/admin-indicator.js), [Exchange status](../admin-ui/src/features/exchange-status.js), [pause controllers](../admin-ui/src/features/pause.js), [targets](../admin-ui/src/utils/live-cfg.js), [builder](../admin-ui/src/escrow-ops.js), [Drops consumer](../admin-ui/src/features/drops/drops.controller.js) |
| Admin treasury FA2 inventory/rescue | Separate surface buckets fetch target storage/holdings and enrich rows. Recipient/amount submission builds one `admin_transfer_token` per item, waits for every intended external transaction, emits namespaced submitted/confirmed events and schedules refreshes; Drops checklist consumes relevant events. | Exact target/token/amount/destination and admin-only movement; incomplete inventory/partial or unknown outcomes cannot imply full success. | [orchestration](../admin-ui/src/features/treasury/orchestrate.js), [surface config](../admin-ui/src/features/treasury/treasury.config.js), [transfer](../admin-ui/src/features/treasury/transfer.controller.js), [rows](../admin-ui/src/features/treasury/table.render.js), [holdings API](../admin-ui/src/tzkt-api.js), [builders/result polling](../admin-ui/src/escrow-ops.js), [checklist](../admin-ui/src/features/drops/drops.checklist.controller.js) |
| Admin XTZ balance/Max/withdrawal | Account/target-bound snapshots format mutez for balance/Max and invalidate on wallet/network events. Decimal input converts to mutez, submits `admin_withdraw_xtz`, confirms intended operation and refreshes. Recipient is storage admin. | Exact XTZ/mutez and snapshot authority; unknown is not zero/Max; submission, failure, unknown and application differ. | [withdraw controller](../admin-ui/src/features/treasury/withdraw.controller.js), [conversion](../admin-ui/src/features/treasury/fetchers.js), [builder/result polling](../admin-ui/src/escrow-ops.js), [escrow withdrawal](../contracts/burn-redeem-escrow/smartpy/burn-redeem-escrow-smartpy.py) |
| Admin Drops pair create/edit/cleanup | Paged mappings normalize six terms/range-filter rows. Set panel checks ID availability, collection/token/custom input and amounts; modal refreshes/edits baseline; cleanup consumes selected IDs. Builders send set/update/cleanup, legacy boolean confirmation triggers refresh/final events; asynchronous forms have epochs/session guards. | Admin-only intended-ID/term mutation; create cannot overwrite; updates/cleanup/events must retain exact meaning and target. | [controller](../admin-ui/src/features/pairs/pairs.controller.js), [data](../admin-ui/src/features/pairs/pairs.data.js), [set panel](../admin-ui/src/features/pairs/setpanel.controller.js), [validation](../admin-ui/src/features/pairs/setpanel.validators.js), [modal](../admin-ui/src/features/pairs/modal/modal.controller.js), [builders](../admin-ui/src/escrow-ops.js), [paged API](../admin-ui/src/tzkt-api.js) |
| Admin Exchange pair management | Separate table/set/edit targets THE EXCHANGE, gates to `testnet`, checks range/active ID and locks redeem side to ACID COIN #0. Shared forms feed Exchange-specific set/update wrappers, confirmation and refresh. | Dedicated target/financial terms survive shared UI; chain authority remains independent of UI/network gating. | [Exchange pairs/wrappers](../admin-ui/src/features/pairs/exchange-pairs.js), [set panel](../admin-ui/src/features/pairs/setpanel.controller.js), [modal](../admin-ui/src/features/pairs/modal/modal.controller.js), [builders](../admin-ui/src/escrow-ops.js) |
| Admin drop snapshot/load/preview | Production validates/freezes bundled mirror; local provider publishes verified snapshots into `updateParams`. Normalizer handles enabled collections, mirrors/exclusions/explicit pairs; builder allocates/chunks IDs. Startup preview, auto next-ID search, input/manual load, overlap checks, source/reset/network changes and status/countdown have distinct cached intent/epochs. | Source ownership, exact translated IDs/counts, collision-free reviewed intent and stale-state retirement across requested/cached/rendered boundaries. | [provider](../admin-ui/src/features/drops/drop-params.provider.js), [controller](../admin-ui/src/features/drops/drops.controller.js), [load paths](../admin-ui/src/features/drops/drops.load.service.js), [normalizer](../admin-ui/src/features/drops/drops.data.js), [builder](../admin-ui/src/features/drops/drops.builder.js), [translation](../admin-ui/src/features/drops/utils/validate-translation-audit.js), [state](../admin-ui/src/features/drops/drops.state.js), [panel events](../admin-ui/src/features/drops/drops.view.panel.js) |
| Admin drop batch send | Send validates cached/source terms, counts/chunks/view signature, network/escrow and verified pause. Sequential `set_token_pairs` chunks check ownership around account awaits, retain hash/status history, stop on uncertainty, refresh pair/status/checklist. Retiring UI cannot undo submitted chunks. | Reviewed intent equals payload at effect; no obsolete source/network/pause authorization; partial batches are not all-confirmed success. | [send validation](../admin-ui/src/features/drops/drops.controller.js), [send/history](../admin-ui/src/features/drops/drops.send.service.js), [builder/confirmation](../admin-ui/src/escrow-ops.js), [status consumers](../admin-ui/src/features/drops/drops.status.service.js) |
| Admin lifecycle/readiness/checklist | Trusted countdown enters standby then polls storage for live. Pair status compares intended terms with mapping: full/partial/missing/verification-required. Checklist combines pause/health/CMS, minted existence, planned/held supply, treasury, depletion and raw GitHub staging/main params equality, with polling/visibility/epoch resets. | Unknown/provenance/scope remain explicit; planned/remaining/redeemed supply and Git equality differ; neither countdown nor Git match proves deployment readiness. | [countdown](../admin-ui/src/features/drops/drops.countdown.service.js), [pair comparison](../admin-ui/src/features/drops/drops.pairs.status.js), [checklist/GitHub polls](../admin-ui/src/features/drops/drops.checklist.controller.js), [controller state](../admin-ui/src/features/drops/drops.public-state.js), [shared clock](../shared/drop-countdown.js), [API](../admin-ui/src/tzkt-api.js) |
| Admin health/CMS/economics | Startup/manual health enumerates token IDs and checks local titles/thumbs. Uploaded/stored per-network/collection CSV validates/translates IDs, compares local assets and chain circulating editions/ACID; balance sums exclude burn sink. Results feed summary/checklist; recheck/clear, row ownership and economics TTL/in-flight cache affect conclusions. | Unknown/incomplete differs from zero/mismatch/healthy; CSV, editions and formula share identity; local checks cannot prove published CMS equality. | [health](../admin-ui/src/features/health/health.controller.js), [CMS checks](../admin-ui/src/features/health/health.cms.js), [CSV parser](../admin-ui/src/utils/parse-csv.js), [persistence](../admin-ui/src/utils/cms-store.js), [economics](../admin-ui/src/utils/token-econ.js), [checklist consumer](../admin-ui/src/features/drops/drops.checklist.controller.js) |
| Admin labels/catalogs/presentation caches | Local titles/thumb manifest map canonical/mirrored identities for forms, previews, treasury, authoring and health. Chain UI layers memory/persistent cache, catalog and local NFT resolver. TzKT catalogs enumerate tokens; pair-modal warm can enrich metadata via HTTP/IPFS. TTL/network invalidation and UNDEFINED affect display. | Cached/enriched presentation cannot alter transaction identity or establish ownership/existence; preserve context and truthful missing labels. | [chain UI](../admin-ui/src/adapters/chain-ui.js), [catalog/enrichment](../admin-ui/src/adapters/collection-catalog.js), [NFT resolver](../admin-ui/src/utils/nft.js), [cache](../admin-ui/src/utils/cache.js), [titles](../admin-ui/src/titles.manifest.js), [thumb manifest](../admin-ui/src/thumbs.manifest.js), [modal choices](../admin-ui/src/features/pairs/modal/modal.view.content.js) |
| Local authoring UI/provider handoff | CREATE/EDIT/archive-DEACTIVATE use token/exclusion forms, lifecycle warnings, validation, preview, acknowledgement and apply. Edits retire preview; health refresh/retry and source-version/operation-guarded read-back publish immutable snapshots into Drops. Production is static. | Applied fields/source equal reviewed preview; offline/busy/drift/reconciliation cannot appear committed; authoring itself changes no chain state. | [entry/consumer](../admin-ui/src/features/drops/authoring/index.js), [controller](../admin-ui/src/features/drops/authoring/authoring.controller.js), [token serialization](../admin-ui/src/features/drops/authoring/authoring.tokens.js), [client](../admin-ui/src/features/drops/authoring/authoring.client.js), [dev provider](../admin-ui/src/features/drops/authoring/drop-params.provider.dev.js) |
| Loopback authoring API | `127.0.0.1:47831` validates Host/origin/method/route/body limit/nonce. State/validate/preview/apply expose snapshot and expiring single-use hash-bound preview. Apply rechecks repository/writer state and invokes writer; startup probes existing service/repository identity. | Local scoped browser-to-filesystem authority; preview is not write; stale/replayed/ambiguous request is not successful apply. | [service/API/probe](../shared/drop-params/drop-params-authoring-service.mjs), [launcher](../scripts/drop-params-authoring-service.mjs), [schema/serializer](../shared/drop-params/drop-params-authoring.mjs), [Admin client](../admin-ui/src/features/drops/authoring/authoring.client.js) |
| Transactional config/archive/recovery | CLI create/edit/deactivate and API share source-version checks, operation-ID idempotence, base/projection verification, staged/hash-verified replacement and durable journals. Deactivation archives first. Lock claims coordinate; reconciliation recognizes target/base or restores exact snapshots; failed rollback blocks. CLI status/reconcile is an alternate entry. | Consistent authoritative source/consumers or explicit fail-closed state; recover interruption without deleting evidence; immutable archive before deactivation. | [CLI](../scripts/drop-params-transaction.mjs), [writer/reconcile](../shared/drop-params/drop-params-transaction.mjs), [archive](../shared/drop-params/drop-params-archive.mjs), [locks/atomic paths](../shared/drop-params/drop-params-projector.mjs), [strict schema](../shared/drop-params/drop-params-authoring.mjs) |
| Projection/mirror propagation | Generator, queued/debounced watcher, Outer build/dev and Admin sync evaluate/validate source JS and project through shared lock/atomic helpers. Public imports source package; Admin bundles mirror. Direct generator/watch paths are distinct from transaction journal decisions. | Source owns generated copies; cross-repository equality, concurrent rebuild behavior and failures/drift remain visible on every write path. | [generator](../shared/drop-params/gen-drop-params-json.mjs), [watcher](../shared/drop-params/watch-drop-params-json.mjs), [projector/equality](../shared/drop-params/drop-params-projector.mjs), [Outer commands](../package.json), [Admin commands](../admin-ui/package.json), [mirror guard](../admin-ui/scripts/build-guard-drop-params-mirror.mjs) |
| Direct escrow trade/FA2 custody | Any caller bypasses UI via `initiate_trade`: unpaused/nonempty check, per-trade mapping/six terms/sender-user validation, grouped burn/redeem transfers and trade events. Burn moves caller tokens to stored sink; redeem moves custody to caller. Direct FA2 transfer can fund escrow. Approvals/balances/rejection/rollback cross external FA2/chain. | Every batch entry preserves sender/recipient/terms, conservation and failure atomicity. Sink transfer is not proof of FA2 supply destruction. | [escrow initiate_trade/FA2_TRANSFER_TYPE](../contracts/burn-redeem-escrow/smartpy/burn-redeem-escrow-smartpy.py), [Drops serializer](../drops/js/events.js), [Exchange serializer](../exchange/js/exchange.js), [approvals](../shared/public-trade-ops.js) |
| Direct privileged pair mutation | Admin set creates new positive/different-FA2 pairs and increments size; update changes existing terms/emits changed fields; cleanup deletes present IDs/decrements size and reports missing IDs. These calls bypass preview/pause/checklist UI restrictions. | Admin authority, exact mapping/cardinality and truthful single/batch/duplicate/missing-ID outcomes; no assumed UI-only restrictions on chain. | [escrow constructor/set/update/cleanup](../contracts/burn-redeem-escrow/smartpy/burn-redeem-escrow-smartpy.py), [Admin builders](../admin-ui/src/escrow-ops.js), [drop caller](../admin-ui/src/features/drops/drops.send.service.js), [signer CLI](../scripts/shadownet-exchange-pairs.mjs) |
| Direct pause/rescue/XTZ | Constructor fixes admin/burn address and paused/empty mapping. Direct admin toggle, arbitrary FA2 rescue to supplied recipient and positive XTZ withdrawal to stored admin emit events. Default accepts positive tez; attached tez on other entrypoints is also a boundary. No admin-replacement entrypoint found. | Admin-only custody/pause; exact amounts/destinations/events; account for tez ingress and external-call rejection/atomicity independently of UI. | [escrow verify_admin/toggle/rescue/withdraw/default](../contracts/burn-redeem-escrow/smartpy/burn-redeem-escrow-smartpy.py), [explicit/default-target helpers](../admin-ui/src/escrow-ops.js) |
| Signer-backed Exchange provisioning | Default dry-run validates 44 fixed pairs, registry and artifact hash/ABI. `--verify` reads RPC block/mapping/cardinality; explicit execute/provider imports signer, checks chain/admin/empty IDs, matches Taquito payload, sends, confirms and reads back. Bypasses Beacon/Admin. | Fixed chain/target/admin/payload provenance; dry-run cannot transact; confirmation differs from exact read-back. | [provision/verify/execute](../scripts/shadownet-exchange-pairs.mjs), [registry](../shared/chain-registry.js), [confirmation](../shared/public-trade-ops.js), [promoted Michelson](../contracts/burn-redeem-escrow/artifacts/burn-redeem-escrow-audited.tz) |
| Contract provenance/origination | Legacy source with embedded fixtures, frozen certified/promoted Michelson and historical check artifact have distinct roles/identities. Deployment note directs frozen release use; certification/promotion/deployment records are separate claims. Configured addresses/ABI consumers still require originated identity evidence. | Preserve release provenance/interface; source/repository/historical test identity does not certify deployed code/storage. | [source](../contracts/burn-redeem-escrow/smartpy/burn-redeem-escrow-smartpy.py), [deployment note](../contracts/burn-redeem-escrow/artifacts/deployment-notes/audited-release.md), [manifest](../docs/EA-XYZ%20Contract%20Audit/release/RELEASE-CANDIDATE-MANIFEST.md), [promotion](../docs/EA-XYZ%20Contract%20Audit/release/PHASE-10-PROMOTION-RECORD.md), [deployment record](../docs/EA-XYZ%20Contract%20Audit/release/PHASE-11-SHADOWNET-DEPLOYMENT.md) |
| Thumbnail/site asset authoring | Outer input converts images, allocates Admin master keys, regenerates Admin manifest, archives input and rolls back output/manifest on failure. Backfill clears managed review images/writes candidates/report. Admin generator/check detects stale/duplicate IDs. One-off optimizers produce local derivatives. | Asset/token identity, originals, exclusive writes and recovery across repositories; manifest matches shipped files. | [thumbnail workflow](../assets/thumbs/scripts/thumbs.mjs), [input launcher](../assets/thumbs/RUN_INPUT.cmd), [backfill launcher](../assets/thumbs/RUN_BACKFILL.cmd), [Admin generator/check](../admin-ui/scripts/gen-thumbs-manifest.mjs), [consumer](../admin-ui/src/utils/nft.js), [coin optimizer](../scripts/optimize-coin-image.mjs), [logos](../scripts/optimize-site-logos.mjs) |
| Exported Webflow CMS/asset effects | Library exports paged staged/live item/site-asset reads, asset creation/upload, field/image patch and publication. GET retries differ from mutations; content verification, naming, staged/live comparison, ambiguous-write read-back and redacted atomic evidence writes are distinct effects. No active application/CLI caller found. | Exact authorized site/collection/item/locale/asset; unknown writes cannot be blindly retried or claimed applied/unapplied; protect credentials. | [CMS client/upload/comparison/reconciliation](../assets/webflow-cms/webflow-cms.mjs) |
| Public delivery/build/Pages | Parcel generates environment artifacts after JSON. Four root routers select host environment; environment loaders start first-paint/page siblings with isolated errors. CI builds main/prod and staging/staging, checks JSON freshness, copies main-owned roots/prod loaders and staging loaders, strips maps, verifies graph/provenance then uploads/deploys under Pages permissions/concurrency. | Source/environment ownership and loader payloads agree; failures cannot silently select another financial environment; preserve release gates. | [commands](../package.json), [root routers](../loaders/root/home.js), [Drops](../loaders/root/drops.js), [Exchange](../loaders/root/exchange.js), [Utility](../loaders/root/collection-utility.js), [Home loader](../loaders/environment/home.js), [Drops loader](../loaders/environment/drops.js), [Exchange loader](../loaders/environment/exchange.js), [Utility loader](../loaders/environment/collection-utility.js), [CI](../.github/workflows/pages.yml), [artifact verifier](../scripts/verify-pages-loader-artifacts.mjs) |
| Admin production/local development/harness | Admin build checks thumbs, syncs/guards mirror, bundles, prunes authoring chunks and checks isolation. Dev runs watchers/service/Parcel. Outer dev checks port/starts watcher/Parcel; sanity rewrites shell script references, copies loaders and serves/opens local harness. These commands write/start processes; none ran here. | Development filesystem authority stays out of production; harness/build output is not deployment evidence; preserve assets and operational state. | [Admin commands](../admin-ui/package.json), [isolation verifier](../admin-ui/scripts/verify-production-authoring-isolation.mjs), [pruner](../admin-ui/scripts/prune-production-authoring.mjs), [Outer commands](../package.json), [port check](../scripts/check-dev-port.mjs), [Parcel wrapper](../scripts/parcel-dev.mjs), [harness](../scripts/sync-test-harness.mjs), [server](../scripts/run-sanity-server.mjs) |

## Exclusions, inaccessible boundaries and uncertainties

- No live Webflow/CMS, browser, wallet/Beacon transport, RPC/TzKT, timeapi.io, GitHub raw content, IPFS/metadata gateway, external FA2 or Pages/hosting observation occurred. Request/response seams are enumerated; provider correctness, pagination guarantees, consistency, CORS/caching, wallet signing, finality/reorg and external execution remain unverified. Source-visible URLs/addresses are not observed deployments.
- External FA2 source/operator/ledger behavior, originated escrow bytecode/storage/admin/sink, balances/funding and operation/event history are unavailable source boundaries. Direct callers are included; live compatibility/atomicity require separate evidence. Embedded MockFA2 is a fixture. Legacy SmartPy was not compiled/executed; historical certification/test artifacts are provenance context, not rerun or adopted as clean evidence.
- Tracked shells represent CMS/editions/Webflow references, not complete current live custom code, interactions or publication. Deployed loader revisions, hosting/DNS/settings/secrets remain unverified. Future CMS authoring/minting, Ethereum/THE WAVE and proposed Webflow migration are plans/presentation, not implemented paths found here. Marketplace behavior after navigation is excluded.
- Persistence/recovery producers and consumers were traced, without treating ignored journal/lock history, browser storage/caches, image masters/exports, earlier review exports or generated dist/sanity output as current runtime truth. Those assets were preserved. Admin `drops.data.js` file/URL/JS parsing exports have no current runtime caller; dormant remote NFT recovery does not replace local-only `getTokenUi`. Catalog enrichment remains reachable through pair-modal warm. Inert `exchange-custody.js` is not a second treasury controller.
- **Checkout observation, not a defect finding:** authored source, Outer JSON and Admin mirror parse to equal values. JSON is 519 bytes with LF; mirror is 550 bytes with CRLF. They match after newline normalization but not byte-for-byte. Since pipeline checks include semantic and byte equality, checkout normalization is material for subsequent examination. No generator/sync/service/recovery was run to change or diagnose behavior.
- Grounded financial/authority/truthfulness properties above do not settle every exceptional provider-outcome requirement. [Known issues](../docs/known-issues.md) remain prior evidence to reassess during audit; none is resolved, newly confirmed or dismissed here. No new defect reproduction/remediation ticket was produced.

## Historical AUD-002 result and focused verification

**AUD-002: COMPLETE — WITH FINDINGS — 2026-11-03.** This supersedes the enumeration-only status above and the November 2 partial result for the current investigation; AUD-001's map/context remains the historical baseline. Reviewed Outer `d0f2c293a2896174eb816677f0f32a017657398f` on `ticket-AUD-002-first-correctness-pass` and independent Admin `c831010483b3bd1e49f94c279045d1f008d6e5be` on `codex`. Revisions are unchanged at continuation; Outer contained only the expected prior coverage-result edit, and Admin remained clean/read-only. Only this result note and ignored working evidence change. No material source change or behavioral-map amendment was needed; the methodology is unchanged.

**All 33 source-level workflow examinations are complete; none remains partial or unexamined.** The continuation closes the previous 16 partial and five unexamined rows, retaining the twelve completed examinations against unchanged source. The [AUD-002 findings report](AUD-002-findings.md) records source/property reasoning, exact preconditions, controls, evidence and external limitations. Eleven AUD-002 findings remain: the original four plus accepted configuration/Public identity mismatch, rounded cleanup IDs, missing initial-supply recovery with actionable trade, conditional insufficient confirmation evidence, CMS write-outcome ambiguity, concurrent thumbnail rollback and amount-only edit changing an unlisted token to zero. Confirmation evidence failure is demonstrated with partial/misattributed provider fixtures; no live TzKT incident is asserted. All seven existing known issues remain confirmed/unresolved. The three prior hypotheses are resolved to these qualified findings; no remediation is implemented.

Executed evidence retains the original inert reproductions/config failure controls, 163 Public tests, 1,092 Admin runtime tests, seven signer-tool tests and 15 shared trade fixtures. New continuation/API/listener and isolated asset reproductions pass with controls; thumbnail tests (6), CMS tests (16), loader architecture and Pages artifact graph checks pass. Unchanged large suites were reused, not rerun. Source/frozen/promoted artifact identities and historical deployment-bundle hash agree with their records; parsing/historical evidence does not establish current deployed correctness. External Webflow/browser/wallet/provider/FA2/hosting integrations, real crash durability and legacy compilation remain unverified. Builds and real-path config suites were skipped to preserve read-only boundaries. Exact commands, evidence and limitations are in the tracked findings report, with four preserved inert scripts under `audits/repro/`. Temporary fixtures and large logs remain in ignored `audits/work/`; the original ignored evidence is retained. No public `audits/report.md`, clean result or post-clean refresh is claimed. Final whitespace/diff/export checks and exact export filenames accompany the universal handoff.
