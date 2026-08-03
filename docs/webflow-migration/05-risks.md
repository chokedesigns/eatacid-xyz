# WF-MIG.5 Static Visual and Behavioral Risks

## Blocking

### B-01 — Collection Utility has no Git-owned page source

- **Affected page(s):** Collection Utility (`/collection-utility`, `6978f5a970f1cfe7b14f7b09`).
- **Dependency:** Current Webflow page structure and serialization.
- **Evidence:** WEBFLOW exposes the banner/nav, `home-viewport`/`home-main-div`, Discord Rules Banner, marquee, footer, and `home.js` custom code. REPOSITORY has no `collection-utility/index.html` or another public page source.
- **Current behavior:** Webflow supplies the page shell and published output.
- **Failure mode:** A repository-only reproduction omits this current public route or invents unverified structure, attributes, assets, and initialization.
- **Migration impact:** Checked HTML plus current Git runtime is not sufficient by itself to recreate every current public page with evidenced parity.
- **Confidence:** HIGH.
- **Follow-up dependency:** WF-MIG.6 must treat the page-source gap explicitly; later read-only extraction/browser validation must establish the missing published contract before implementation.

### B-02 — No local equivalent of the complete presentation stylesheet

- **Affected page(s):** Home, Collection Utility, Drops, The Exchange.
- **Dependency:** `staging-eatacid-xyz.webflow.shared.f47fa79a6.css` on the Webflow CDN.
- **Evidence:** All three checked HTML pages load the same remote file; no public local CSS exists. Read-only inspection shows it owns normalization, fonts, every site layout, breakpoints, widgets, state visibility, and first-paint initial state.
- **Current behavior:** One generated remote stylesheet makes the checked/generated HTML visually and responsively usable.
- **Failure mode:** Removing or losing the file produces an unstyled/non-equivalent site and breaks visibility/state contracts.
- **Migration impact:** Webflow presentation cannot be removed without a complete material-rule reproduction and validation.
- **Confidence:** HIGH.
- **Follow-up dependency:** WF-MIG.6 architecture decision and later implementation/visual validation; no implementation is authorized here.

## High

### H-01 — Webflow-hosted visible assets have no verified local equivalents

- **Affected page(s):** Four static pages; Drops and Exchange CMS rows.
- **Dependency:** 13 material non-CMS assets plus 66 exact CMS media records hosted through Webflow.
- **Evidence:** Webflow asset reads and checked CDN URLs; repository filename/reference search found no local equivalents; WF-MIG.4 did not establish CMS image independence.
- **Current behavior:** Brand, hero, utility banner, controls/state art, icons, and token thumbnails render remotely.
- **Failure mode:** Assets disappear or variants/load behavior change when Webflow hosting is unavailable.
- **Migration impact:** Exact visual parity and state feedback cannot be independently served until equivalent assets exist under controlled hosting.
- **Confidence:** HIGH.
- **Follow-up dependency:** Asset acquisition/provenance and later hash/visual comparison; do not download under this ticket.

### H-02 — Mobile navigation depends on Webflow JavaScript

- **Affected page(s):** Four static pages.
- **Dependency:** Common Webflow Navbar module plus jQuery and generated CSS.
- **Evidence:** The active shared component uses `.w-nav` with `data-collapse="medium"`; CSS hides `.w-nav-menu` and shows the button at <=991px; generated runtime supplies overlay/open/keyboard/ARIA behavior.
- **Current behavior:** Mobile/tablet users open and navigate the shared menu by pointer or keyboard.
- **Failure mode:** Without Webflow JS the menu remains hidden at <=991px and is inaccessible.
- **Migration impact:** A behavior/accessibility replacement is mandatory before runtime removal.
- **Confidence:** HIGH.
- **Follow-up dependency:** Equivalent Navbar implementation and multi-breakpoint keyboard/focus/browser validation.

### H-03 — Exchange Tabs are a Webflow/Git initialization seam

- **Affected page(s):** The Exchange.
- **Dependency:** Webflow Tabs module, generated ARIA/active state, pane membership, and Git's fixed 500ms initialization.
- **Evidence:** Live/checked `.w-tabs` structure; generated module supplies roles, `aria-selected`, `w--current`, `w--tab-active`, click/keyboard switching; `exchange/js/exchange.js` queries `.tab-link[aria-selected="true"]` after 500ms.
- **Current behavior:** 419/CANAAN pane selection determines contract identity and available controls.
- **Failure mode:** Without Tabs initialization, switching and ARIA fail and Git may not identify the active collection/contract.
- **Migration impact:** Replacement must be ready before Git consumption and preserve pane identity, not merely visual tabs.
- **Confidence:** HIGH.
- **Follow-up dependency:** Equivalent Tabs contract plus slow-load, keyboard, focus, and transaction-flow testing.

### H-04 — First-paint has a remote-bundle permanent-hide failure mode

- **Affected page(s):** Home, Drops, The Exchange; Collection Utility is partially coupled.
- **Dependency:** Generated first-paint CSS and Git `shared/public-first-paint.js`, delivered live through GitHub Pages bundles.
- **Evidence:** CSS hides first-paint surfaces/chrome with opacity/visibility/pointer-events; Git releases them. Live custom code uses absolute GitHub Pages modules.
- **Current behavior:** Content reveals after font/hero readiness or bounded fail-open.
- **Failure mode:** If the Git bundle itself fails before running, fail-open never executes and marked main/footer content can remain hidden/non-interactive.
- **Migration impact:** CSS and initialization must be migrated atomically with a robust visible fallback.
- **Confidence:** HIGH for marked pages; MEDIUM for Collection Utility due partial observed classes.
- **Follow-up dependency:** Later failure-injection/FOUC/layout-shift browser validation.

### H-05 — Live Git behavior is loaded from absolute GitHub Pages bundles

- **Affected page(s):** Four static pages.
- **Dependency:** `https://chokedesigns.github.io/eatacid-xyz/home.js`, `drops.js`, and `exchange.js`.
- **Evidence:** Current Webflow page footer code uses those exact URLs; checked snapshots use local entrypoints instead. Remote bundle bytes were not compared.
- **Current behavior:** Core first-paint, wallet, Drops, and Exchange behavior begins only after external module delivery.
- **Failure mode:** Bundle outage, path/version mismatch, or cross-origin/module failure disables core behavior.
- **Migration impact:** Deployment ownership and exact source-to-deployed mapping must be resolved without changing runtime contracts.
- **Confidence:** HIGH for the dependency; MEDIUM for bundle equivalence.
- **Follow-up dependency:** Reproducible bundle verification/deployment design in later work.

### H-06 — Webflow classes and hierarchy are hard Git contracts

- **Affected page(s):** Home, Drops, The Exchange; shared shell on Collection Utility.
- **Dependency:** first-paint selectors, wallet classes, Drops list/row/checkbox/state classes, Exchange Tabs/panes/lists/selects, hidden identity nodes.
- **Evidence:** Complete Git import/selector review plus WF-MIG.3 DOM contracts.
- **Current behavior:** Git finds, clones, mutates, filters, attributes, and reads Webflow-authored nodes.
- **Failure mode:** A visually plausible markup rewrite can silently break identity, eligibility, selection, wallet, cart, or transaction behavior.
- **Migration impact:** Any structural/class change requires coordinated consumer updates and contract tests.
- **Confidence:** HIGH.
- **Follow-up dependency:** WF-MIG.3/WF-MIG.5 contract-driven implementation validation.

## Medium

### M-01 — Saved Designer state and published snapshots are not provably identical

- **Affected page(s):** All eight.
- **Dependency:** Webflow Data API saved/current view versus last-published generated HTML.
- **Evidence:** Current page/element/style reads and repository snapshots come from different interfaces; metadata cannot establish byte equality.
- **Current behavior:** Three snapshots semantically match current major structures and WF-MIG.4 values.
- **Failure mode:** An unpublished class/link/style/widget change is omitted or a snapshot-only generated detail is mistaken for saved intent.
- **Migration impact:** Final parity baselines need explicit published/browser reconciliation.
- **Confidence:** HIGH that ambiguity exists.
- **Follow-up dependency:** Published-output capture and browser comparison later.

### M-02 — Interaction metadata is not exposed through the available read-only tooling

- **Affected page(s):** All pages.
- **Dependency:** Designer/Bridge-only saved interaction state.
- **Evidence:** No active Designer MCP app; no interaction data tool; generated output contains no IX2 module/config and checked DOM contains zero `data-w-id`.
- **Current behavior:** No IX2 effect is observed in current generated output; custom CSS/Git motion exists.
- **Failure mode:** Unpublished/historical IX2 intent could be omitted from a later migration baseline.
- **Migration impact:** Current output can proceed with “zero observed IX2,” but that is not proof about inaccessible Designer history.
- **Confidence:** HIGH for current generated output; LOW for inaccessible saved metadata.
- **Follow-up dependency:** Read-only Bridge/Designer inspection only if material and available; do not install for completeness.

### M-03 — Breakpoint-only behavior can be lost without four-family validation

- **Affected page(s):** Four static pages, especially Drops and Exchange.
- **Dependency:** base, <=991px, <=767px, <=479px cascade and generic >=768px helpers.
- **Evidence:** Exact generated CSS media queries and visibility/layout rules.
- **Current behavior:** Alternate header/flame/arrow/cart/column/button/modal/footer states appear at specific ranges.
- **Failure mode:** Desktop testing passes while mobile controls, menu, row identity cues, loading feedback, or layout are absent/wrong.
- **Migration impact:** Each family must be contract-tested; portrait modal/button hiding must be reproduced unless explicitly changed later.
- **Confidence:** HIGH.
- **Follow-up dependency:** Responsive browser/screenshot and functional testing.

### M-04 — External fonts affect layout and first-paint timing

- **Affected page(s):** Four static pages.
- **Dependency:** Google WebFont Loader, Google Fonts, Changa One and Inconsolata.
- **Evidence:** Checked head configuration, generated font-family rules, first-paint font polling.
- **Current behavior:** Site-specific metrics load externally before/bounded by reveal.
- **Failure mode:** Fallback metrics cause wrapping, overflow, FOUC, or delayed reveal.
- **Migration impact:** Font delivery and readiness outcome require validation even if loader technology changes.
- **Confidence:** HIGH.
- **Follow-up dependency:** Font provenance/licensing plus layout-shift/font-failure tests.

### M-05 — Route and link behavior assumes a domain root

- **Affected page(s):** All static routes and four CMS route families.
- **Dependency:** Root-relative links and asset/module paths; Webflow current-link state.
- **Evidence:** Checked links use `/`, `/drops`, `/exchange`, `/collection-utility`; loaders also distinguish production hostnames.
- **Current behavior:** Routes resolve from a Webflow/custom-domain root.
- **Failure mode:** Project-subpath hosting produces broken navigation/current state or loads the wrong bundle environment.
- **Migration impact:** Any target must reproduce base URL and hostname/network selection behavior.
- **Confidence:** HIGH.
- **Follow-up dependency:** Routing/deployment contract in WF-MIG.6; browser history/404 validation later.

### M-06 — Collection Utility first-paint ownership is internally asymmetric

- **Affected page(s):** Collection Utility.
- **Dependency:** `home.js` versus observed first-paint classes.
- **Evidence:** Live page loads `home.js` and has first-paint banner classes, but its observed `home-viewport` and footer omit Home's `first-paint-surface`/`first-paint-chrome` classes.
- **Current behavior:** Banner/network behavior is coupled; full main/footer hide/reveal is not evidenced.
- **Failure mode:** Copying Home's contract could introduce an unintended hidden/reveal transition; omitting it could miss published behavior not visible through current tooling.
- **Migration impact:** Page needs direct source/browser confirmation before implementation.
- **Confidence:** MEDIUM.
- **Follow-up dependency:** Collection Utility published capture/browser observation.

### M-07 — Custom pulse/GIF motion lacks complete reduced-motion evidence

- **Affected page(s):** Drops and The Exchange.
- **Dependency:** Drops `pulse` animation and animated GIF state art.
- **Evidence:** Marquee has a `prefers-reduced-motion` rule; no comparable pulse/GIF override was observed.
- **Current behavior:** Standby/fire/spinner/completion/coin motion can continue independently of reduced-motion preference.
- **Failure mode:** A replacement may accidentally remove current motion or preserve motion where later accessibility requirements expect reduction.
- **Migration impact:** Exact current behavior is known, but accessibility intent needs an explicit later decision rather than silent redesign.
- **Confidence:** HIGH.
- **Follow-up dependency:** Browser/reduced-motion validation and separate accessibility authorization if behavior changes.

## Low

### L-01 — Generic Webflow forms runtime is loaded for non-submitting controls

- **Affected page(s):** Drops and The Exchange.
- **Dependency:** Webflow forms chunk and `.w-form-done`/`.w-form-fail` wrappers.
- **Evidence:** Five form definitions have GET/empty action and no submit button, redirect, or confirmation; Git listens to checkbox/select changes.
- **Current behavior:** Native controls drive product state; generic success/error submission nodes are apparently unused.
- **Failure mode:** Removing the module changes only generic focus/submission behavior unless an unobserved submit path exists.
- **Migration impact:** Small validation seam; preserve native controls and Git behavior.
- **Confidence:** HIGH.
- **Follow-up dependency:** Browser keyboard/focus/control regression tests.

### L-02 — Repeated CMS rows duplicate form and control IDs

- **Affected page(s):** Drops and The Exchange.
- **Dependency:** Webflow prototype expansion.
- **Evidence:** Checked snapshots repeat `email-form`, `email-form-2`, `field`, `field-2`, and checkbox IDs across rows.
- **Current behavior:** Git selects by row/class and current behavior reconciles; no actual form submission is used.
- **Failure mode:** ID-based browser/assistive behavior or future consumers may target the first duplicate unexpectedly.
- **Migration impact:** Preserve behavior during parity work; any normalization is a separate coordinated change.
- **Confidence:** HIGH.
- **Follow-up dependency:** Accessibility/browser observation; no cleanup under this ticket.

### L-03 — Footer Collection Utility link differs from header navigation

- **Affected page(s):** Home, Drops, The Exchange checked snapshots.
- **Dependency:** Static footer `href="#"` versus header `/collection-utility`.
- **Evidence:** Exact checked HTML link attributes.
- **Current behavior:** Header navigates; footer link changes/targets the current hash rather than the route.
- **Failure mode:** A migration may unintentionally “fix” or further break current hash/scroll behavior.
- **Migration impact:** Treat as an explicit parity/product decision, not a silent cleanup.
- **Confidence:** HIGH.
- **Follow-up dependency:** Browser hash behavior and later product authorization.

### L-04 — Zero-instance Webflow components can be mistaken for active dependencies

- **Affected page(s):** None currently.
- **Dependency:** Four stored Nav Button components with zero instances.
- **Evidence:** Webflow component inventory.
- **Current behavior:** They do not participate in current page trees.
- **Failure mode:** Unnecessary migration scope is added.
- **Migration impact:** Classify APPARENTLY UNUSED unless later evidence shows a current consumer.
- **Confidence:** HIGH.
- **Follow-up dependency:** None beyond final inventory reconciliation.

## Informational

### I-01 — No current Webflow IX2 runtime dependency was observed

- **Affected page(s):** All checked/live pages.
- **Dependency:** Potential Webflow IX2 interaction runtime.
- **Evidence:** Zero `data-w-id`; zero IX2 module/config strings in exact common/page runtime files; no IX2 setup in custom code.
- **Current behavior:** Motion comes from CSS, widgets, GIFs, and Git code.
- **Failure mode:** None for current generated IX2 output.
- **Migration impact:** Do not allocate an IX2 replacement solely on present evidence; retain the tooling limitation.
- **Confidence:** HIGH for current generated output.
- **Follow-up dependency:** Only saved Designer inspection if it becomes material and available.

### I-02 — CMS templates are empty in the current element view

- **Affected page(s):** Four CMS templates.
- **Dependency:** Webflow route/item shell rather than Body content.
- **Evidence:** Read-only Elements API returned Body with no children for each template.
- **Current behavior:** No visible template widget/asset/custom code is evidenced.
- **Failure mode:** None established for static Body presentation; HTTP/head behavior remains unresolved.
- **Migration impact:** Do not invent template UI.
- **Confidence:** HIGH for the current saved Body tree.
- **Follow-up dependency:** Published-route/head/404 validation.

### I-03 — Unused site-library media is not a current page dependency

- **Affected page(s):** None observed.
- **Dependency:** Asset-library files including older videos/arrows/flames/spinners not referenced by current page trees/snapshots.
- **Evidence:** Webflow library has 28 assets; material DOM/reference reconciliation reduced the non-CMS current set to 13.
- **Current behavior:** Unreferenced library items do not render.
- **Failure mode:** None for current page parity.
- **Migration impact:** Do not widen migration scope solely because an asset remains in the library.
- **Confidence:** HIGH for inspected current structures.
- **Follow-up dependency:** Recheck only if a later page/source inventory changes.

## Unresolved

### U-01 — Browser-only visual and behavioral equivalence

- **Affected page(s):** All current pages.
- **Dependency:** Actual browser layout, paint, network timing, focus, motion, history and device behavior.
- **Evidence:** This ticket performed structural/runtime/CSS inspection, not a pixel-perfect or interactive browser pass.
- **Current behavior:** Defined from generated rules and code; not directly replayed.
- **Failure mode:** A reasoned equivalent can differ in paint timing, stacking, focus order, animation, scroll/hash, or device-specific rendering.
- **Migration impact:** Later implementation requires browser and screenshot validation; no readiness claim is possible now.
- **Confidence:** HIGH that validation remains.
- **Follow-up dependency:** Browser/Bridge or equivalent test environment after architecture/implementation decisions.

### U-02 — 404, redirect, canonical, Password and Search behavior

- **Affected page(s):** Site-wide routing and all route families.
- **Dependency:** Webflow hosting/system behavior not exposed in the current page list/repository.
- **Evidence:** No 404, Password, Search, or utility/system page appears; no redirect configuration was available in inspected read-only tools.
- **Current behavior:** Unknown.
- **Failure mode:** A replacement can differ for missing paths, protected access, search, canonical URLs, and redirects.
- **Migration impact:** Hosting/routing parity remains incomplete until explicitly observed.
- **Confidence:** HIGH that the facts are unresolved.
- **Follow-up dependency:** Read-only host/browser configuration validation later.

### U-03 — Exact deployed Git bundle contents

- **Affected page(s):** Four static pages.
- **Dependency:** Absolute GitHub Pages modules versus local source/loaders.
- **Evidence:** URL/source graph difference; no byte/hash comparison of deployed page bundles.
- **Current behavior:** Major live structures and local runtime intent align.
- **Failure mode:** Remote deployed behavior may contain unreconciled version/config differences.
- **Migration impact:** Source-of-truth/deployment parity cannot be asserted.
- **Confidence:** HIGH that comparison was not performed.
- **Follow-up dependency:** Controlled deployed-artifact comparison in later work.

### U-04 — Google font licensing and binary availability

- **Affected page(s):** Four static pages.
- **Dependency:** Changa One and Inconsolata delivery.
- **Evidence:** Families/provider are known; exact browser-selected URLs/licenses were not researched.
- **Current behavior:** Fonts load dynamically from Google infrastructure.
- **Failure mode:** Local hosting or provider changes may be legally or technically constrained.
- **Migration impact:** Font ownership choice remains open.
- **Confidence:** HIGH that this is unresolved.
- **Follow-up dependency:** Licensing/provenance review outside this audit.
