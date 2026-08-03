# WF-MIG.6 Cutover and Validation Plan

## Baseline ownership

WF-MIG.7 must archive the published comparator before implementation: exact site ID, capture time, route/status/headers, sanitized head/body/DOM, exact remote CSS and Git bundle URLs/hashes, four responsive screenshot families, material widget/wallet/list/cart/modal states, network request inventory, and unknown-route behavior. Collection Utility requires complete published structure and screenshot capture because no checked source exists. CMS item routes require status/head/body capture because the audit exposed empty template Bodies but not browser-verified published responses.

The baseline manifest, not a mutable live page, owns visual/structural comparison. Every fixture records provenance and content hash. Session tokens, wallet addresses not deliberately created as fixtures, and authorization data are excluded. Dynamic values are normalized only through documented rules; broad screenshot masks are prohibited. The Webflow site remains frozen after final content reconciliation and is retained as operational rollback through the monitoring window.

Classification: fixture/hash capture is **AUTOMATED REQUIRED** where possible; baseline scenario selection, sanitization, and acceptable-difference policy are **MANUAL REQUIRED**.

## Automated static validation

The build fails on:

- non-deterministic generation or source/output drift;
- invalid collection/token schema, anything other than four collections/66 enabled items, or incomplete 36-field mapping;
- duplicate stable identity, reconciliation identity, main token ID within collection, slug within route family, output path, or presentation order within a list context;
- incomplete contract/mirror configuration, including any missing HEN sparse-ID mapping or implicit active-ID fallback;
- derived Name, `$ACID`, OBJKT, contract, or active token values that differ from audited values/rules;
- missing exact title, Editions, Mint Date, label, slug, image path/alt, or explicit order;
- missing asset, wrong manifest hash/MIME/dimensions, or missing animated/responsive requirement;
- HTML parse errors, broken internal root-relative links, missing favicon/webclip, or missing `404.html`;
- absent output for `/`, `/collection-utility`, `/drops`, `/exchange`, or any of the 66 exact CMS item paths;
- any required Webflow CSS/JS/CMS/asset URL, Webflow common/page runtime, WebFont Loader, Google font URL after self-hosting, or unapproved external dependency;
- deploy manifest mismatch, unhashed/version-unidentified critical bundle, or fetched-byte mismatch.

Run a clean build twice with pinned dependencies/tool versions and compare outputs after excluding only explicitly documented nondeterministic metadata; preferred target is no nondeterministic metadata at all. Classification: all items above are **AUTOMATED REQUIRED**.

## Automated DOM-contract validation

Parse generated Drops/Exchange HTML and assert all five list-specific contracts:

1. Drops HEN checkbox/owned rows.
2. Drops INTRODUCTIONS checkbox/owned rows.
3. Drops CANAAN quantity/value presentation rows.
4. Exchange SCRIPT quantity rows inside pane `419`.
5. Exchange CANAAN quantity rows inside pane `CANAAN`.

Required assertions include `.w-dyn-list/.w-dyn-items/.w-dyn-item`; list-specific wrapper/item classes; `.token-id-number` exact integer text; title/edition/image descendant paths; HEN/INTRO cloneable outer wrappers and real checkboxes; quantity rows and real `.token-qty` selects; checkbox/select ancestry; Drops outer stamping target; Exchange inner `.collection-item-01-div` stamping target; initial pending regions; wallet/first-paint classes; runtime-added data-attribute targets; correct list/pane membership; expected row counts/order; HEN sparse identities; INTRO 4,3,2,1,0 initial order; and the observed `.intros-collection` markup.

Consumer tests must exercise lookup, filtering, removal, deep cloning, mapped-ID rewrite, append ordering, owned count, selection change, quantity repopulation, cart identity, pane/contract resolution, and state-class transitions. Selector/CSS-contract checks assert that every runtime state and responsive helper used by generated DOM has a loaded local definition. Repeated legacy IDs need not remain, but any replacement IDs must be unique and ARIA references valid.

Classification: parser/fixture checks are **AUTOMATED REQUIRED**; a focused producer/consumer review before any selector change is **MANUAL REQUIRED**.

## Functional browser validation

Required automated scenarios:

- Navbar at desktop and collapsed widths: pointer open/close, overlay, outside/route close, resize, repeated toggles, no click-through, current route, wallet controls.
- Exchange Tabs: initial 419 selection, CANAAN switch, pane visibility, contract identity, quantity/cart isolation, click, Left/Right/Home/End, no fixed-delay readiness, and no hash mutation.
- Drops: disconnected/default state, wallet-pending, connected ownership response, HEN/INTRO mirror mapping, clone/filter/removal, checkbox selection, cart totals, empty/no-token states, cancellation/reset/stale-write protections already covered by current runtime.
- Exchange: disconnected/pending/connected states, quantity limits/options, cart ordering/totals, selected contract/token attribution, approval/trade preconditions, cancellation/reset/stale-write protections.
- First paint: scripts disabled, module 404/throw, slow module, font success/failure, hero/image success/failure, offline cached/un-cached cases, timeout/fail-open, and useful visible/focusable content.
- Routes: direct navigation and refresh on all static routes plus representative and exhaustive HTTP probes for the 66 item paths.

Classification: deterministic fixture/browser cases are **AUTOMATED REQUIRED**. Cross-browser expansion beyond the agreed primary/secondary browser matrix is **AUTOMATED PREFERRED**. Live external marketplace availability is **OPTIONAL** and cannot substitute for exact URL validation.

## Accessibility validation

**AUTOMATED REQUIRED:** semantic/ARIA audit on all four static pages and CMS compatibility template; unique IDs; accessible names; no invalid roles/relationships; visible focus; keyboard-operable controls; no focus in hidden panes/menu; image `alt` present; contrast regression checks where reliable; reduced-motion CSS assertions; and no-JS navigation access.

**MANUAL REQUIRED:**

- Navbar trigger name/state/control relationship, opening focus behavior, logical order, Escape close/focus return, overlay behavior, and wallet-control access.
- Tabs roving focus, announcement, `aria-selected`, tab/tabpanel association, hidden-pane exclusion, and activation model.
- Screen-reader spot checks of page landmarks, headings, forms/controls, pending/success/error states, and dynamic cart updates where applicable.
- Per-asset review of decorative empty alt versus meaningful description. The parity pass preserves explicit empty alt where current intent is unknown; descriptive changes require an approved accessibility/content decision.
- Motion assessment for marquee/pulse/GIFs and no-font/no-image failure usability.

Accessibility parity does not mean preserving known invalid repeated IDs. Functionally equivalent valid IDs are required when controls/ARIA are regenerated.

## Visual regression validation

Own a screenshot scenario manifest containing viewport, device scale, browser/version, color state, font state, image state, JavaScript timing, wallet fixture, pane/menu/cart/modal state, animation freeze rule, and baseline hash.

Required page/state coverage:

- Home: initial, hero ready/error, fonts loaded/failed, Navbar desktop/open collapsed, wallet states.
- Collection Utility: exact recovered content, banner ready/error, shared Navbar/wallet/footer, first-paint differences.
- Drops: default/pending/connected, each list family, selected/unselected, cart/modal/success/error states, fire/arrow responsive art, empty/no-token states.
- Exchange: initial 419, CANAAN, pending/connected, quantities/cart, modal/success/error, Tabs focus/selected states.
- Shared: marquee/footer, logo/favicon where capturable, no-JS, slow-script, reduced motion.

Automated pixel/structural diffs are **AUTOMATED REQUIRED**. Manual review of every difference outside a narrow documented tolerance is **MANUAL REQUIRED**. Approved differences record the exact region, cause, user impact, and why parity is maintained or intentionally improved. Whole-page masks, blanket antialiasing tolerances, and “looks close” approval are invalid.

## Responsive validation

The four owned families are desktop/base, `<=991px`, `<=767px`, and `<=479px`. Capture at least one stable width inside each family and boundary-adjacent widths on both sides of 991, 767, and 479 pixels. Validate navigation collapse, page layout, title/collection visibility, rows/controls, cart/modal, arrows/fire art, tabs/panes, footer, image sizing/srcset choice, text wrapping, minimum widths, focus visibility, and absence of horizontal clipping except where the baseline explicitly proves it.

Automated screenshot/layout assertions are **AUTOMATED REQUIRED**. Real-device or device-emulation spot checks for touch target behavior, viewport height, and mobile browser chrome are **MANUAL REQUIRED**. Additional ultra-wide/small-device testing is **AUTOMATED PREFERRED**.

## Asset and font independence validation

Static scans and browser network traces must prove:

- all 13 material site assets and 66 CMS images resolve from the Git deploy origin or another explicitly Git-controlled non-Webflow origin;
- responsive candidates, intrinsic sizes, content hashes, MIME types, and animated behavior match acquisition records;
- logo, hero, Collection Utility banner, spinner, success/fire/coin GIFs, arrows, favicon/webclip, and token thumbnails load from canonical manifest paths;
- HEN mainnet sparse IDs and active mirror IDs resolve the correct image without implicit fallback;
- Changa One 400 normal/italic and Inconsolata 400/700 load through the approved independent delivery path;
- no WebFont Loader, `fonts.googleapis.com`, `fonts.gstatic.com`, Webflow asset/CDN domain, or required embedded `webflow-icons` behavior remains;
- loaded and failed-font/image states remain usable and within approved visual/layout policy.

URL/manifest/network checks are **AUTOMATED REQUIRED**. Hash/decoded-image/animation/metric review and font license/provenance approval are **MANUAL REQUIRED**. New image compression/conversion is **OPTIONAL** after parity.

## Routing validation

Test on local artifact serving, staging origin, and production custom domain:

- `/`, `/collection-utility`, `/drops`, `/exchange`;
- every exact path under `/the-419-script/{slug}`, `/canaan/{slug}`, `/hen/{slug}`, and `/introductions/{slug}`;
- root-relative header/footer/brand links from both root and nested item paths;
- direct navigation, refresh, trailing-slash policy, case sensitivity, percent encoding where present, Back/Forward, and external links;
- `404.html` and representative unknown paths;
- captured CMS item status/head/body behavior; no silent redirect/retirement;
- staging and custom-domain hostname behavior;
- no SPA fallback; Tabs do not add hash/history behavior during migration.

Exhaustive HTTP/path probes are **AUTOMATED REQUIRED**. DNS/custom-domain, browser Back/Forward, and external marketplace spot checks are **MANUAL REQUIRED** except marketplace availability itself is **OPTIONAL**.

## Deployment validation

CI must install from the lockfile, record tool versions/source commit/lock hash, build cleanly, run every required validator, produce a release/deploy manifest, retain the exact artifact, and publish that artifact without rebuilding. Staging and production promotion must use the same bytes. Post-deploy probes compare critical HTML/CSS/JS/font/asset bytes to manifest hashes, enumerate external requests, inspect cache behavior, validate TLS/custom domain and `404`, and verify route freshness after invalidation.

GitHub Pages is accepted only if it demonstrates the required directory routes, staging separation, custom domain/TLS, cache/version behavior, deploy logs, and artifact rollback. If a required capability fails, document the failure and select a static host by capabilities in a new ADR; do not change vendors preemptively.

Build/deploy/hash/route probes are **AUTOMATED REQUIRED**. DNS/certificate/cache and rollback rehearsal are **MANUAL REQUIRED**. Performance optimization is **AUTOMATED PREFERRED** and not a parity waiver.

## Transaction and wallet validation

Preserve the registry slot/environment distinction: `testnet` remains configured to Shadownet; no ticket enables mainnet or changes addresses/RPC/TzKT/Beacon/persisted network behavior without explicit scope.

Required fixture validation covers collection-to-contract mapping; main/active token mapping; Drops and Exchange eligibility; selected token/quantity; pair lookup; approval/trade/burn/redeem construction; event targets/payloads; wallet connect/pending/connected/disconnect; persisted-account validation; network switch; cancellation/reset/retry/stale-write protection; modal/error/success states; and prevention of action with invalid/missing identity.

Automated mocked/fixture preconditions are **AUTOMATED REQUIRED**. Approved Shadownet wallet and transaction smoke using controlled assets/accounts is **MANUAL REQUIRED** before staging approval and repeated as a narrow production smoke if operationally safe. Mainnet transactions are outside scope. Chain live supply must not replace curated Editions. Provider/chain instability must be distinguished from deterministic application failure and cannot be hidden.

## Staging cutover

1. Reconcile the frozen Webflow content snapshot against canonical data; any drift reopens import and affected screenshots.
2. Select the immutable candidate whose manifest passed all automated and manual pre-cutover gates.
3. Deploy to an isolated production-like staging origin using the same root layout/cache configuration intended for production.
4. Run full route, dependency, CSS/font/asset, functional, accessibility, responsive, visual, wallet/network, transaction-safety, and fetched-byte suites.
5. Compare material scenarios side-by-side with the frozen Webflow baseline.
6. Rehearse rollback to the prior staging artifact and re-promote the same candidate without rebuilding.
7. Record exceptions; any BLOCKING BEFORE CUTOVER item returns to its owning ticket.

Staging does not grant production approval. Webflow production remains unchanged and read-only.

## Production cutover

1. Require explicit production authorization and confirm the exact candidate artifact, source commit, manifest, DNS/custom-domain targets, TTL/cache actions, monitoring probes, and rollback authority.
2. Confirm Webflow/content freeze, current backups/baselines, and known-good Git and Webflow rollback paths.
3. Promote the staged artifact without rebuilding; perform the planned domain/deployment switch.
4. Purge/revalidate HTML as planned while hashed assets remain immutable.
5. Verify TLS/domain, all static routes, representative plus automated exhaustive item routes, asset/font/bundle hashes, external dependency scan, intended Shadownet selection, wallet smoke, and safe transaction preconditions.
6. Enter the rollback monitoring window. Do not detach, unpublish, or delete Webflow.

Production success means the candidate is serving and monitored; it is not Webflow-removal approval.

## Rollback triggers

Immediate rollback is required for any of:

- wrong network, contract, token identity, mirror mapping, transaction construction, or transaction target;
- wallet connect/disconnect/persisted-account/network-switch failure that blocks safe use;
- missing/corrupt route, CSS, JS, font, critical asset, or deploy-byte mismatch;
- permanent hidden content, unusable Navbar/Tabs/controls, or widespread no-JS/script-error failure;
- incorrect CMS rows, Editions, `$ACID`, quantities, cart, eligibility, or clone/filter behavior;
- TLS/custom-domain/redirect/cache behavior that prevents reliable access or serves mixed releases;
- unapproved required Webflow dependency discovered after switch;
- material accessibility or responsive regression without a safe same-artifact fix;
- monitoring threshold breach defined in the cutover ticket or inability to observe transaction/runtime health.

Nonmaterial approved visual differences and external OBJKT availability alone are not automatic rollback triggers unless the cutover ticket elevates them.

## Rollback procedure

1. Freeze further deployment and record the active artifact, time, probes, and trigger without exposing wallet/user secrets.
2. Disable or clearly communicate unsafe transaction actions only through a pre-approved reversible operational mechanism; do not improvise code during rollback.
3. Restore the prior production target: redeploy the retained known-good static artifact or restore the frozen Webflow domain/deployment path according to the rehearsed method.
4. Apply documented DNS/cache invalidation and verify TLS, root/static/item routes, critical assets/bundles, intended network, wallet state, and transaction preconditions.
5. Confirm monitoring recovery and preserve failed-artifact/log evidence.
6. Reopen the owning implementation/validation ticket; fix and repeat staging. Never rebuild an untracked hotfix and call it the same release.

Rollback must be executable without Webflow Designer edits. If republishing Webflow is part of the authorized mechanism, it requires the separately approved read-write operation named by the cutover ticket. Destructive cleanup is never part of rollback.

## Monitoring window

The rollback window begins before the production switch and remains open until all state-based exit conditions pass: production bytes remain stable; all synthetic route/dependency probes pass repeatedly; representative real browser sessions cover all four pages and responsive families; approved wallet/network and Shadownet transaction checks pass; no unresolved severity-blocking incident exists; cache/DNS propagation is complete; baseline and both rollback paths are verified; and explicit closure approval is recorded.

No fabricated calendar duration is assigned in this architecture ticket. The production cutover ticket must record the approved operational duration in addition to these minimum evidence conditions. Webflow remains frozen and recoverable for the longer of that approved duration or the time needed to satisfy every exit condition.

Monitor route/status, JS errors, unhandled rejections, asset/font failures, wallet/provider errors, transaction precondition/send/status failures, wrong-network signals, latency/timeouts, cache-version mix, and external Webflow requests. Monitoring must avoid sensitive wallet or transaction payload disclosure.

## Webflow-removal acceptance criteria

Every `REQUIRED` item must pass. `CONDITIONALLY REQUIRED` items must either pass when their condition applies or record an approved not-applicable rationale. `OPTIONAL` items do not block removal.

| Classification | Criterion | Passing evidence |
|---|---|---|
| REQUIRED | Every current route is reproduced intentionally | Four static routes, four CMS route families, all 66 exact slugs, captured status/body behavior, 404/direct/refresh tests. |
| REQUIRED | Current visible page parity is established | Approved screenshot matrix for all four pages/material states/four responsive families. |
| REQUIRED | All runtime-critical behavior is reproduced | Navbar, Tabs, Drops, Exchange, wallet, first-paint, and transaction gates pass. |
| REQUIRED | Accessibility parity is validated | Automated audit plus manual keyboard/focus/ARIA/screen-reader/alt review. |
| REQUIRED | All assets are independently hosted | 13 + 66 manifest coverage, hashes/equivalence, local network trace. |
| REQUIRED | All required fonts are independently delivered | Approved provenance/delivery, correct faces/metrics/fallback, no Google/Webflow request. |
| REQUIRED | No required Webflow CSS | No page fetches Webflow CSS or requires Webflow regeneration; any locally vendored baseline is Git-owned, hash-provenanced, and self-contained. |
| REQUIRED | No required Webflow JS | Webflow common/page/widget runtime absent; owned Navbar/Tabs/first-paint pass. |
| REQUIRED | No required Webflow CMS read | Complete build works offline from canonical data and emits all rows/routes. |
| REQUIRED | No required Webflow asset URL | Static scan and browser trace find none. |
| REQUIRED | No required Webflow custom code | Head/footer behavior is represented in owned templates/styles/modules and scans find no remote loader. |
| REQUIRED | All Git data is canonical | Four collections/66 items/36 field occurrences validate; provenance and derivations reconcile. |
| REQUIRED | DOM/runtime contracts are preserved or jointly migrated | Five list contracts and all selector consumers pass; no identity by index. |
| REQUIRED | All routes and responsive families are validated | Local, staging, production, custom-domain, direct/refresh, and four-family results pass. |
| REQUIRED | Functional transaction flows are validated | Fixture suite plus authorized Shadownet/manual scope; correct identity/network/contracts. |
| REQUIRED | Source/deploy reproducibility is established | Clean double build, pinned inputs, retained manifest/artifact, fetched-byte equality. |
| REQUIRED | Published baseline is archived | Sanitized HTTP/DOM/CSS/runtime/screenshot fixtures and hashes retained. |
| REQUIRED | Rollback artifact and method are retained/tested | Prior Git artifact plus frozen Webflow capability through approved window; rehearsal evidence. |
| REQUIRED | Monitoring window exit conditions pass | Synthetic/user/browser/wallet/transaction/cache evidence and no blocking incident. |
| REQUIRED | No unresolved BLOCKING risk | Residual register reconciled with evidence. |
| REQUIRED | Explicit approval to decommission exists | Recorded approval names exact site/role removal; no inferred consent. |
| CONDITIONALLY REQUIRED | CMS item pages return equivalent empty/static responses | Required if WF-MIG.7 confirms current published item paths exist as empty 200 pages; otherwise reproduce captured redirect/404. |
| CONDITIONALLY REQUIRED | GitHub Pages remains the host | Required only if it passes capability and rollback gates; otherwise a separate host ADR is required. |
| CONDITIONALLY REQUIRED | Webflow unpublish/domain detach is performed | Required to complete operational removal when Webflow still receives the production domain; must be separately authorized and reversible. |
| OPTIONAL | Vendored CSS is refactored into clean owned modules | Independence requires local ownership, not pre-cutover redesign. |
| OPTIONAL | `.w-*` classes, repeated IDs/wrappers, and legacy entrypoint names are cleaned up | Defer until rollback closure and contract-tested cleanup tickets. |
| OPTIONAL | Images are re-encoded/optimized and CSS design tokens introduced | Performance/maintainability work after parity. |

## Decommission checklist

- [ ] Confirm the exact Webflow site ID and decommission authorization.
- [ ] Confirm every REQUIRED/conditional removal criterion disposition and zero BLOCKING risk.
- [ ] Confirm production source of truth is Git data/templates/assets/fonts/runtime/deployment config.
- [ ] Confirm the monitoring/rollback window exit record and retained immutable artifacts.
- [ ] Archive sanitized published baseline, CSS/runtime hashes, CMS import/provenance, asset/font provenance, deployment manifests, and rollback rehearsal.
- [ ] Verify production DNS/custom domain, TLS, routes, caches, monitoring, wallet/network, and transaction smoke immediately before any detachment.
- [ ] Detach domain or unpublish only through the exact separately authorized reversible operation.
- [ ] Re-run production probes and external-request scan after detachment.
- [ ] Retain Webflow account/site evidence according to the approved retention policy.
- [ ] Do not delete the site/assets/CMS destructively; create a new explicit deletion ticket if ever required.
- [ ] Move optional cleanup to WF-MIG.27 child tickets.

## Unresolved pre-cutover requirements

| Requirement | Classification | Closure evidence |
|---|---|---|
| Published vs saved equality and exact baseline | BLOCKING BEFORE CUTOVER | WF-MIG.7 published capture plus final freeze reconciliation. |
| Pixel parity | BLOCKING BEFORE CUTOVER | WF-MIG.22 complete screenshot approval. |
| Collection Utility exact published serialization/runtime | BLOCKING BEFORE IMPLEMENTATION of reconstruction; BLOCKING BEFORE CUTOVER | WF-MIG.7 capture and WF-MIG.13 parity results. |
| 13 + 66 asset equivalence | BLOCKING BEFORE CUTOVER | WF-MIG.8 acquisition/hash/visual records. |
| Font license/provenance/metrics | BLOCKING BEFORE CUTOVER | WF-MIG.9 approval and loaded/failed tests. |
| Editions and Mint Date semantics | VALIDATION REQUIREMENT | Exact preservation/provenance; no new semantic claim. |
| CMS template status/route retention | BLOCKING BEFORE CUTOVER | Captured responses and exhaustive generated route probes. |
| HEN thumbnail mapping | BLOCKING BEFORE CUTOVER | WF-MIG.11 bijective adapter tests. |
| `.intros-collection` drift | VALIDATION REQUIREMENT | Observed markup preserved and all consumers tested; scoped fix if failure is reproduced. |
| Exchange fixed 500 ms | BLOCKING BEFORE CUTOVER | WF-MIG.17 explicit readiness integration/tests. |
| Deployed bundle equivalence | VALIDATION REQUIREMENT | WF-MIG.19 manifest/fetched hash. |
| No observed IX2 vs unavailable metadata | ACCEPTED RISK subject to validation | Browser baseline and no missing interaction in functional/visual matrices. |
| External marketplace route validity | ACCEPTED RISK | Exact derivation equality; optional availability probe. |
| Chain/live supply semantics | VALIDATION REQUIREMENT | Editions not reinterpreted; transaction scope explicitly bounded. |
| Transaction validation scope | BLOCKING BEFORE CUTOVER | Approved fixture/manual Shadownet matrix passes; mainnet remains excluded. |
| DNS/custom-domain/host capabilities | BLOCKING BEFORE CUTOVER | WF-MIG.19 and WF-MIG.24 probes/rehearsal. |
| Webflow rollback retention | BLOCKING BEFORE WEBFLOW REMOVAL | Approved monitoring duration plus state-based exit conditions and explicit closure. |
