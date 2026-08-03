# WF-MIG.6 Target Architecture

## Decision criteria

The following priorities are architecture decisions grounded in the audit. `CRITICAL` means failure prevents safe cutover or can corrupt transaction identity. `HIGH` means failure materially breaks parity or independent ownership. `MEDIUM` means it affects operability and future change cost but can be controlled during migration. `LOW` means useful optimization that must not displace parity work. No numeric score is used because the evidence does not support meaningful cardinal weights; a candidate that fails a CRITICAL criterion cannot win by accumulating lower-priority advantages.

| Criterion | Importance | Decision test |
|---|---|---|
| Functional parity | CRITICAL | Wallet, Drops, Exchange, filtering, cloning, selection, cart, and transaction preconditions retain current contracts. |
| Current Git runtime compatibility | CRITICAL | Existing producers/consumers work without an all-at-once runtime rewrite. |
| DOM-contract preservation | CRITICAL | Hidden token identity, list/pane membership, ancestry, stamping locations, and event targets remain valid through cutover. |
| Content ownership / CMS replacement | CRITICAL | All 66 items and all required field semantics build without Webflow reads. |
| Route compatibility | CRITICAL | Four static routes and four CMS route families, including exact 66 slugs, are intentionally handled. |
| Asset independence | CRITICAL | No required image, icon, CSS, or other visible asset is served by Webflow. |
| Rollback safety | CRITICAL | A versioned deploy artifact and retained Webflow baseline support a tested reversal. |
| Transaction-safety regression risk | CRITICAL | Contract/token identity and network behavior are not coupled to a visual rewrite. |
| Visual parity | HIGH | Current layout, states, animation, typography, and four responsive families are evidenced by screenshots and comparisons. |
| Accessibility parity | HIGH | Navbar, Tabs, controls, focus, keyboard, ARIA, reduced motion, and no-JS behavior are validated. |
| Deterministic and reproducible builds | HIGH | The same source, lockfile, and toolchain produce the same route/data outputs. |
| Responsive fidelity | HIGH | Base, <=991px, <=767px, and <=479px families have owned baselines and gates. |
| Font independence | HIGH | Required font binaries/delivery and fallback metrics no longer depend on Google/Webflow at runtime. |
| Testability | HIGH | Static contracts plus browser, accessibility, route, deployment, and visual tests can fail a cutover. |
| Incremental Webflow retirement | HIGH | Presentation, content, assets, widgets, and hosting can be replaced in reviewable stages while Webflow remains rollback. |
| Reproducibility | HIGH | Every deployed byte is attributable to Git source, verified imported media, or a pinned build input. |
| Deployment simplicity | MEDIUM | A static artifact can deploy without application servers, databases, or runtime CMS credentials. |
| Long-term maintainability | MEDIUM | Shared shell, templates, data schemas, and narrow enhancements remove snapshot duplication. |
| Avoid unnecessary framework complexity | MEDIUM | The site does not acquire SPA routing, hydration, or server rendering without an evidenced need. |
| Font/asset cache efficiency | LOW | Content hashing and long-lived immutable caching are useful after equivalence is proven. |

Confirmed audit facts used by these tests are: only four static pages and four empty CMS templates exist; the public application already owns its transaction logic in Git; five list-specific DOM contracts drive that logic; one remote Webflow stylesheet owns nearly all presentation; Navbar and Tabs are the only observed required Webflow widgets; no IX2 runtime was observed; and all CMS data is flat and small (four collections, 36 physical fields, 66 items). [WF-MIG.1 §§Page inventory, Ownership boundaries; WF-MIG.2 §§Schema overview, Field inventory; WF-MIG.3 §§DOM contracts, Runtime dependency inventory; WF-MIG.5 §§Presentation dependency summary, Risk register]

## Candidate architectures

| Candidate | Repository/parity fit | DOM/runtime fit | Complexity and footprint | Rollback | Classification |
|---|---|---|---|---|---|
| Preserve checked-in Webflow HTML and replace dependencies in place | Fast for Home, Drops, and Exchange, but Collection Utility is absent and 66 CMS rows remain duplicated across snapshots. Manual updates would make content and shared-shell drift likely. | Excellent initially because current classes and hierarchy remain. Current runtime can be retained. | Low initial build change; high recurring maintenance; no natural canonical CMS-to-row generator. | Strong file-by-file rollback, but weak confidence that future hand edits remain synchronized. | VIABLE BUT NOT PREFERRED |
| Static-site generation from structured data and reusable templates | Strong fit for four flat collections, four static pages, shared chrome, and static hosting. Deterministic generation replaces Webflow CMS and duplicated rows. | Strong only if templates deliberately preserve the audited DOM contract during the first pass. | Moderate migration cost; small build-time template layer; no client framework. | Strong: generated artifact and source data are versioned, and old static artifacts can be redeployed. | VIABLE BUT NOT PREFERRED as a purely static label because client transaction behavior and widgets still require enhancement |
| Client-rendered application/component framework | Can model shared components but introduces hydration/routing/runtime rendering that the current site does not need. Content may be absent or unstable before JavaScript. | Requires simultaneously rewriting markup consumers or building a compatibility DOM; increases transaction regression surface. | Highest dependency, runtime, routing, and operational footprint. | Weaker because cutover changes rendering, routing, widgets, and application lifecycle together. | NOT RECOMMENDED |
| Hybrid static generation with targeted client enhancement | Static HTML owns first render, routes, CMS rows, and no-JS visibility; existing Git behavior stays client-side; two small widget modules replace Navbar/Tabs. | Best fit: build templates can preserve exact list/row/pane contracts while current runtime remains authoritative. | Moderate one-time generator work, small runtime additions, no SPA/server/CMS service. | Strongest: Webflow and versioned static artifacts can dual-run; each dependency can be retired behind gates. | RECOMMENDED |

Expanded candidate records:

**1. Preserve checked-in Webflow HTML and replace dependencies in place**

- **Description:** keep the three current snapshots, recover Collection Utility as a fourth snapshot, localize CSS/assets/fonts, hand-maintain or script-inject CMS rows, and replace widgets without establishing shared page templates as the canonical page source.
- **Repository fit / parity fit:** high immediate fit for the three checked pages and excellent initial pixel/DOM fidelity; poor fit for the missing page and recurring shared-shell/CMS changes.
- **DOM-contract fit / runtime compatibility:** excellent because current markup and existing Git entrypoints can remain unchanged.
- **Migration complexity / operational complexity / dependency footprint:** low-to-medium migration complexity, but high ongoing operational complexity from four shells and duplicated 97 row occurrences; runtime footprint remains small.
- **Rollback quality:** strong at first because individual snapshots can be restored, but confidence declines as hand-maintained copies drift.
- **Major advantages:** smallest initial structural diff; easiest direct comparison; useful transitional baseline.
- **Major disadvantages:** generated HTML becomes an authoring source; CMS and shell duplication remain; deterministic cross-page content updates are weak.
- **Migration risks / disqualifying concerns:** manual row edits can break ancestry/identity or diverge between Drops/Exchange; Collection Utility still requires reconstruction. No concern disqualifies a transitional use, but long-term duplicated ownership makes it non-preferred.
- **Viability:** VIABLE BUT NOT PREFERRED.

**2. Static-site generation from structured data and reusable templates**

- **Description:** use build-time page/shell/row templates and canonical token data to emit all static and exact-slug routes, with local presentation dependencies.
- **Repository fit / parity fit:** excellent content/route/shared-shell fit; visual parity depends on first vendoring the complete CSS baseline and encoding all list-specific variants.
- **DOM-contract fit / runtime compatibility:** high when the generator treats audited DOM as an explicit contract; incomplete if “static” is interpreted as removing the required client behavior.
- **Migration complexity / operational complexity / dependency footprint:** medium migration complexity, low ongoing operations, and a small build-only dependency footprint.
- **Rollback quality:** excellent because both generated artifacts and canonical inputs are versioned and Webflow can dual-run.
- **Major advantages:** deterministic CMS replacement, one shared shell, exhaustive route generation, visible no-JS content, static hosting.
- **Major disadvantages:** introduces a generator/schema/test surface and can over-abstract list-specific markup.
- **Migration risks / disqualifying concerns:** escaping/order/variant errors can break current consumers; without client enhancement it cannot support wallet/transactions/Navbar/Tabs, so the pure form is not the complete target.
- **Viability:** VIABLE BUT NOT PREFERRED as a complete architecture; it is the rendering half of the recommendation.

**3. Client-rendered application or component framework**

- **Description:** render views/CMS rows in the browser, use framework components and app routing or hydration, and move page lifecycle into an application root.
- **Repository fit / parity fit:** weak; the site is already static-first, the dataset is small/flat, and no app-routing or live CMS need is evidenced. First-render/no-JS parity would require extra pre-rendering.
- **DOM-contract fit / runtime compatibility:** poor unless the framework emits a compatibility DOM and coordinates hydration with current mutation-heavy consumers.
- **Migration complexity / operational complexity / dependency footprint:** high in all three dimensions; adds framework/runtime/router/hydration lifecycle and larger deployment/test surface.
- **Rollback quality:** materially weaker because rendering, initialization, rows, routing, and widgets change together.
- **Major advantages:** familiar component/state abstractions and possible future application features.
- **Major disadvantages:** unnecessary JavaScript, hydration/order seams, harder offline/script-failure behavior, and duplicated state authority with current runtime.
- **Migration risks / disqualifying concerns:** hydration can overwrite runtime mutations or expose incorrect pane/token identity; framework value is unsupported by current requirements. This is the decisive non-selection concern.
- **Viability:** NOT RECOMMENDED.

**4. Hybrid static generation with targeted client enhancement**

- **Description:** generate complete HTML/routes/rows at build time; retain Git-owned wallet/transaction modules; add only owned Navbar, Tabs, and visible-first enhancements.
- **Repository fit / parity fit:** excellent for four flat collections, shared page chrome, static hosting, current no-server operations, and parity-first migration.
- **DOM-contract fit / runtime compatibility:** best fit because generated templates can preserve hard selectors while current consumers remain the behavioral authority.
- **Migration complexity / operational complexity / dependency footprint:** medium one-time migration, low ongoing static operations, small build template layer, and small targeted browser additions without a framework.
- **Rollback quality:** strongest; Webflow, prior static artifacts, and each dependency replacement can remain separately reversible.
- **Major advantages:** deterministic ownership, visible/no-JS content, incremental retirement, same-origin delivery, and minimal transaction regression surface.
- **Major disadvantages:** deliberately retains legacy classes/entrypoint names and a large vendored CSS baseline until later cleanup.
- **Migration risks / disqualifying concerns:** template abstraction, widget readiness, and first-paint changes require strict contract/browser tests. No disqualifying concern remains when the staged gates are enforced.
- **Viability:** RECOMMENDED.

The first option is not selected because it preserves duplicated generated rows and shared shells as long-term authoring sources. The second describes most of the rendering model but is incomplete without the necessary wallet/transaction/widget JavaScript. The client-rendered option has no evidence-based benefit and would combine migration with a rendering-lifecycle rewrite. No fifth family is materially supported: a server-rendered application or headless runtime CMS would add servers, credentials, cache invalidation, and failure modes to content that currently changes as a small flat set and can be built deterministically.

## Recommended architecture

Select **hybrid generated/enhanced static architecture**: repository-owned structured data and HTML templates generate a complete static site at build time; existing Git-owned wallet, network, Drops, Exchange, and transaction behavior runs as client-side modules; small standalone Navbar and Tabs modules replace Webflow widget JavaScript; CSS, fonts, and assets are served locally from the same deploy artifact.

This is superior for this repository because it changes the ownership boundary without rewriting the risk-heavy behavior. The current public runtime already assumes server-rendered/static DOM, reads stable text identity, and mutates rows. Generating that same DOM is lower risk than making it consume framework state. Static generation naturally turns 66 CMS items into reviewable data, reproduces exact route slugs, and works on a static host. It also makes content visible when JavaScript fails and permits Webflow to remain a rollback target until independent parity is proven.

Decision labels used below:

- **Confirmed audit fact**: directly supported by WF-MIG.1-WF-MIG.5 or current repository evidence.
- **Architecture decision**: binding target for migration tickets unless a later ADR supersedes it with evidence.
- **Implementation recommendation**: preferred mechanics that a scoped ticket may refine without changing the architecture.
- **Explicit assumption**: not yet established and must be verified at its gate.
- **Unresolved dependency**: cannot be treated as complete before the stated gate.

## Rendering and generation model

**Architecture decision:** all useful route HTML and all 66 CMS item compatibility pages are generated before deployment. No production route requires Webflow, a database, server rendering, client-side routing, or client-side CMS row construction.

Generation-time responsibilities are:

1. Validate collection and token schemas, stable keys, contracts, mirrors, exact slugs, orders, and asset references.
2. Render the shared page shell, static page bodies, five collection lists, and 66 equivalent-empty item pages.
3. Derive `name`, `$ACID`, OBJKT URL, environment contract/token identity, responsive asset URLs, and cache-busted output paths.
4. Emit a deterministic route manifest, asset manifest, and deploy artifact.
5. Fail on drift, missing assets, unresolved identity, forbidden Webflow URLs/runtime, or non-deterministic regenerated output.

Runtime responsibilities remain:

1. First-paint enhancement, network banner, and wallet lifecycle.
2. Drops eligibility, ownership reads, cloning/filtering, selection, cart, and burn/redeem flow.
3. Exchange tab activation readiness, quantity/cart behavior, contract/token attribution, approvals, trade construction, send, and status.
4. Navbar and Tabs interaction/accessibility behavior.

The build must emit ordinary directory-index routes (for example `dist/site/drops/index.html` and `dist/site/hen/{slug}/index.html`). HTML contains useful initial content and valid controls before enhancement. JavaScript may update eligibility/state, but it does not create the canonical CMS dataset.

## Target repository structure

The following is a proposed future layout; this ticket creates none of it.

```text
site/
  README.md                                      SOURCE: source-of-truth and generated-file policy
  templates/
    layouts/site-shell.html                     SOURCE: shared document, banner, navbar, marquee, footer
    pages/home.html                              SOURCE: Home body
    pages/collection-utility.html                SOURCE: recovered Collection Utility body
    pages/drops.html                             SOURCE: Drops composition and list slots
    pages/exchange.html                          SOURCE: Exchange composition, tabs, and list slots
    pages/empty-cms-item.html                    SOURCE: route-compatible empty template response
    components/navbar.html                      SOURCE: shared markup
    components/wallet-controls.html             SOURCE: selector-compatible wallet markup
    components/footer.html                      SOURCE: shared markup
    components/token-row-checkbox.html          SOURCE: HEN/INTRO row family with explicit variants
    components/token-row-quantity.html          SOURCE: CANAAN/SCRIPT row family with page/list variants
  data/
    schema/token.schema.json                    SOURCE: canonical token validation schema
    schema/collections.schema.json              SOURCE: collection validation schema
    collections.json                            SOURCE: labels, route/list/pane/display strategies
    tokens/the-419-script.json                  SOURCE: 13 canonical records
    tokens/canaan.json                          SOURCE: 31 canonical records
    tokens/hen.json                             SOURCE: 17 canonical records
    tokens/introductions.json                   SOURCE: 5 canonical records
    pages.json                                  SOURCE: route/template/entrypoint mapping
  styles/
    vendor/webflow-baseline.css                 SOURCE: immutable, locally vendored migration baseline
    base.css                                    SOURCE: locally owned post-baseline reset/base layer
    shell.css                                   SOURCE: shared shell and wallet states
    widgets.css                                 SOURCE: Navbar/Tabs states
    pages/home.css                              SOURCE: page-specific overrides after extraction
    pages/collection-utility.css                SOURCE
    pages/drops.css                             SOURCE
    pages/exchange.css                          SOURCE
  assets/
    site/                                       SOURCE: logo, hero, banner, spinner, state art, arrows, coin, icons
    tokens/the-419-script/                      SOURCE: verified CMS media
    tokens/canaan/                              SOURCE
    tokens/hen/                                 SOURCE
    tokens/introductions/                       SOURCE
    fonts/                                      SOURCE: verified, licensed binaries if self-hosted
    manifest.json                               GENERATED: hashes, dimensions, variants, provenance references
  runtime/
    widgets/navbar.js                           SOURCE: standalone progressive enhancement
    widgets/tabs.js                             SOURCE: standalone accessible tabs and readiness event
    first-paint.js                              SOURCE: visible-first/fail-open orchestration

webflow/home.js                                 SOURCE: retained runtime entrypoint through cutover
webflow/drops.js                                SOURCE: retained runtime entrypoint through cutover
webflow/exchange.js                             SOURCE: retained runtime entrypoint through cutover
shared/**                                       SOURCE: retained network, wallet, trade, and chain contracts
drops/js/**                                     SOURCE: retained Drops behavior
exchange/js/**                                  SOURCE: retained Exchange behavior

scripts/site/build-site.mjs                     SOURCE: deterministic page/data/asset orchestration
scripts/site/validate-data.mjs                  SOURCE: schema and identity checks
scripts/site/validate-output.mjs                SOURCE: routes, DOM, dependencies, assets, and drift
scripts/site/compare-builds.mjs                 SOURCE: reproducibility/byte comparison

tests/contracts/                                SOURCE: DOM/CSS/route contract tests
tests/browser/                                  SOURCE: functional/accessibility browser tests
tests/visual/                                   SOURCE: screenshot scenarios and difference policy
tests/fixtures/webflow-published/               TEST FIXTURE + MIGRATION-ONLY: archived sanitized HTTP/DOM baselines
docs/webflow-migration/fixtures/                MIGRATION-ONLY: import/provenance and acquisition records

dist/site/                                      DEPLOYMENT OUTPUT + GENERATED: complete immutable artifact
deployment/                                     SOURCE: static-host workflow/configuration
```

Generated files must have a banner or manifest classification, must never be hand-edited, and must be reproducible from SOURCE plus pinned dependencies. `dist/site`, generated asset/route manifests, and generated HTML are deployment output, not canonical authoring sources. The vendored CSS baseline is SOURCE because its exact captured bytes and provenance are intentionally versioned; later extraction is a separate cleanup. The legacy `webflow/*.js` filename does not imply a Webflow runtime dependency and remains through cutover to avoid an unrelated entrypoint move.

## Page generation model

| Route | Template/shell and data | Output | Runtime/CSS/assets | Compatibility and visible content decision |
|---|---|---|---|---|
| `/` | `pages/home.html` in `site-shell`; page metadata and hero asset | `dist/site/index.html` | `home.js`; baseline + Home CSS; logo/hero/spinner/icons/fonts | Exact root route; useful Home content remains statically visible. |
| `/collection-utility` | Recovered `pages/collection-utility.html` in `site-shell`; published baseline and banner | `dist/site/collection-utility/index.html` | `home.js` initially; baseline + Collection Utility CSS; logo/banner/spinner/icons/fonts | Exact route. Missing source is recovered by read-only published HTTP/DOM capture, metadata capture, screenshots at four widths, and structural comparison; the result becomes a local template, not a permanent snapshot scrape. Feature-specific runtime remains an unresolved check. |
| `/drops` | `pages/drops.html`; HEN, INTRODUCTIONS, CANAAN data; shared row components | `dist/site/drops/index.html` | `drops.js`; baseline + Drops CSS; shared/state/token assets/fonts | Exact route; useful content and all 53 source rows are static; runtime may filter/remove/clone based on wallet state. |
| `/exchange` | `pages/exchange.html`; SCRIPT and CANAAN data; tabs/panes and quantity rows | `dist/site/exchange/index.html` | `exchange.js` plus Tabs readiness; baseline + Exchange CSS; shared/state/token assets/fonts | Exact route; 44 static source rows and initial pane are present before runtime. |
| `/the-419-script/{slug}` | `empty-cms-item.html`; 13 exact SCRIPT slugs | `dist/site/the-419-script/{slug}/index.html` | No application entrypoint unless WF-MIG.7 proves current published output has one; minimal owned base CSS only if evidenced | No useful body was exposed. Default is an equivalent empty/static 200 page per exact slug, not redirect or retirement. Status/head/canonical behavior must first be captured. |
| `/canaan/{slug}` | Same compatibility template; 31 exact slugs | `dist/site/canaan/{slug}/index.html` | Same as above | Equivalent empty/static route; not silently dropped. |
| `/hen/{slug}` | Same compatibility template; 17 exact slugs | `dist/site/hen/{slug}/index.html` | Same as above | Equivalent empty/static route; not silently dropped. |
| `/introductions/{slug}` | Same compatibility template; 5 exact slugs | `dist/site/introductions/{slug}/index.html` | Same as above | Equivalent empty/static route; explicit slugs preserve current path compatibility. |

**Unresolved dependency:** WF-MIG.1 saw empty template Bodies through the available page interface, not a browser-verified published response. WF-MIG.7 must capture status, headers, head/body serialization, and direct-navigation behavior. If published routes are 404s or redirects, the generator must reproduce that observed behavior rather than force 200 pages; retirement still requires an explicit later product decision.

## Canonical data model

`06-data-model.json` is the normative model design. The eventual source has one collection record and one token record per item. Stable identity is `{collectionKey}:{mainTokenId}`; reconciliation adds `mainnetContract`. Titles, Editions, exact slugs, Mint Dates where present, local image path, explicit image alt, and presentation order are stored. Contracts and active token IDs derive from `shared/chain-registry.js`. `name` derives from `title`; `$ACID` derives as `ceil(100 / editions)`; OBJKT URLs derive using the preserved collection-specific route family.

The Webflow `Collection` value becomes collection-level display metadata. It does not select transaction contracts. Exact labels such as `HIC ET NUNC` are preserved. `Editions` remains a curated integer with unresolved semantics and must not be substituted with live supply. The 35 Mint Dates are preserved without claiming on-chain meaning. The 66 slugs are imported rather than regenerated. Publication timestamps, Webflow IDs, file IDs, and original URLs remain migration/audit provenance and do not enter the deployed runtime.

The 36 physical Webflow fields are completely covered by ten logical field decisions: SCRIPT has 10, CANAAN 8, HEN 9, and INTRODUCTIONS 9. Null does not mean missing schema: CANAAN deliberately has no Mint Date or OBJKT field, while HEN/INTRODUCTIONS have no `$ACID` field. Current null image alt values become explicit empty strings in the parity pass so every generated image has an `alt` attribute; meaningful alt changes require a separate accessibility/content decision.

## DOM compatibility strategy

Choose strategy 1: **preserve current runtime-sensitive classes and hierarchy initially**. Do not update consumers and markup together during the migration pass. Compatibility adapters are allowed only at isolated seams where the source data model differs, notably HEN image keys and Tabs readiness.

The transition contract through production rollback is:

- Preserve `.token-id-number` with exact integer main-token text; it remains hidden but machine-readable.
- Preserve `.w-dyn-list`, `.w-dyn-items`, `.w-dyn-item`, all list-specific wrapper classes, inner row classes, and current descendant paths consumed by Git.
- Preserve Drops stamping on the outer `.w-dyn-item` and Exchange stamping on the inner `.collection-item-01-div`.
- Preserve cloneable HEN/INTRO row templates, real checkbox inputs, real quantity selects, checkbox/select ancestry, title/edition/image descendants, initial pending regions, wallet-state classes, and runtime-added `data-token-id`/`data-contract-address` behavior.
- Preserve Exchange `data-w-tab=419` and `data-w-tab=CANAAN` pane identity and selected-state signals until `exchange.js` consumes an explicit Tabs-ready contract.
- Generate the actually observed `.intros-collection` class. Do not normalize it during migration. The incompatible `.introductions-collection` consumer seam is documented and must be covered by tests; any fix is a separate scoped behavior ticket.
- Preserve first-paint and wallet classes until their producer and every consumer migrate together under tests.

`.w-*` classes remain through the entire rollback window. Runtime/widget classes that are no longer needed may be removed only in post-cutover cleanup after selector inventory, consumer tests, screenshot parity, and one coordinated markup/consumer change. Presentation-only `.w-*` helpers may also remain indefinitely if locally defined and harmless; Webflow independence requires no live Webflow service, not cosmetic renaming.

Before changing any selector, automated tests must prove: row count/membership, identity text and stamp location, clone/filter behavior, checkbox/select events, image/title/edition lookup, pane/contract mapping, wallet-state transitions, and transaction preconditions. Browser tests must run both disconnected and representative connected fixture states.

## CSS ownership strategy

Select **staged vendor-then-refactor**.

Initial migration:

1. Capture the exact published generated stylesheet bytes and provenance during baseline freeze.
2. Check the stylesheet into `site/styles/vendor/webflow-baseline.css` unchanged except for separately reviewed URL localization if unavoidable; prefer an override layer so baseline bytes remain hash-verifiable.
3. Serve it same-origin before page/widget/page-specific CSS. Local font-face and asset URL overrides follow it; widget state CSS follows those; existing page custom CSS remains last until consolidated.
4. Preserve reset/base rules, typography, site shell, form controls, `.w-*` layout/helpers, four media-query families, state visibility, and current initial layout.
5. Replace remote URLs and Webflow runtime assumptions under automated forbidden-URL checks.

Long-term ownership:

- Extract reset/base, shell, widgets, and page styles into readable owned files only after cutover parity.
- Remove dead selectors by measured DOM/visual coverage, never by name inference.
- Keep breakpoint boundaries exactly at base, <=991px, <=767px, and <=479px until a redesign ticket says otherwise.
- Define any CSS custom properties by value-for-value substitution with screenshot approval; do not combine tokenization with migration.
- Keep runtime-state and first-paint rules adjacent to their owning modules and test both initial and transitioned states.

Manual restyling before cutover is rejected because it would combine hosting/CMS/widget migration with a visual redesign and would discard the only complete presentation baseline. The visual baseline consists of archived published screenshots for each page, material state, and breakpoint, plus the exact CSS hash and browser/font/image conditions.

## Webflow widget replacement

Navbar and Tabs are small standalone modules, not framework components.

**Navbar contract:** retain the shared nav DOM, wallet controls, current links, `<=991px` collapse point, menu button, menu container, and overlay region. Desktop keeps links visible and the button inactive. Collapsed mode opens/closes by pointer, Enter, or Space; sets `aria-expanded`; connects control/menu with stable IDs; prevents overlay click-through; closes on outside/overlay activation, route activation, Escape, and transition to desktop; and restores focus to the trigger on Escape/close. Focus moves into the opened menu only when required by the established baseline/accessibility design, is never trapped without a modal semantic, and remains visible. Current route uses `aria-current=page` plus the compatible class. No-JS fallback keeps navigation links visible in a wrapping/stacked layout and wallet controls show a non-operable but understandable state. Required tests cover four widths, resize while open, repeated open/close, pointer, keyboard, focus return/order, ARIA, current route, wallet connect/disconnect/pending controls, overlay stacking, and script failure.

**Exchange Tabs contract:** retain two tab controls and two panes keyed `419` and `CANAAN`. Initial selection is the audited 419 pane unless published-baseline capture proves otherwise. Click activates a tab; Left/Right and Home/End move roving focus and activation consistently; controls use `role=tab`, a single `tabindex=0`, `aria-selected`, and `aria-controls`; panes use `role=tabpanel`, `aria-labelledby`, and correct hidden/active state. Pane identity—not tab index text—maps to collection contract. No animation may expose both actionable panes or delay identity readiness.

Tabs initialization must be synchronous on DOM readiness and dispatch an explicit, documented `eatacid:tabs-ready` event (or provide an awaited initializer) only after selected state and pane visibility are valid. Exchange initialization consumes that signal or calls the initializer; the fixed 500 ms timing assumption is removed in the dedicated high-risk ticket with consumer tests. Hash/history mutation is **not introduced** in the migration pass because current evidence does not show it; Back/Forward behavior therefore remains page navigation only.

## First-paint strategy

Replace hidden-first with **visible-first progressive enhancement**.

Initial HTML/CSS must expose meaningful content, navigation, and footer without JavaScript. Local blocking CSS establishes the intended layout and reserves image dimensions to minimize flash/layout shift. Fonts begin with metric-compatible fallbacks. JavaScript may add a short-lived enhancement class for nonessential opacity transitions only after it has installed a fail-open guard; it must never hide the sole useful content or wallet exit path.

Home may coordinate hero decode/load and font readiness for polish, but content remains visible while waiting. Drops and Exchange may show explicit loading/pending regions for wallet-dependent data while static headings/rows/navigation remain available. Collection Utility receives page-specific behavior only after its recovered structure is known. Every wait has an error path and bounded timeout; timeout, rejected font load, image error, module error, offline bundle, or thrown initializer removes any enhancement-only suppression. A small early inline guard is permitted only if it cannot leave the page hidden after CSP/network/script failure.

FOUC prevention relies on same-origin CSS loaded in the head, stable initial classes, reserved dimensions, and fallback fonts—not permanent opacity/visibility suppression. Tests capture before-script, slow-script, script-error, no-JS, font-loaded/failed, hero-loaded/failed, reduced-motion, and timeout states and assert useful content remains visible and focusable.

## Asset ownership strategy

The 13 material non-CMS assets and 66 CMS media records move through four separate gates:

1. **Acquisition:** fetch exact audited Webflow records under explicit authorization; preserve source bytes, IDs, URLs, headers where useful, MIME, dimensions, animation, and source timestamps in a migration manifest. Do not substitute local candidates during acquisition.
2. **Verification:** hash source bytes; compare existing local candidates by content hash and, where encoded bytes differ, decoded dimensions/frame behavior and pixel/visual comparison. Verify responsive variants against intended `srcset`/sizes. Preserve GIF animation and assess reduced-motion fallbacks.
3. **Canonical naming:** use stable source paths such as `site/assets/tokens/hen/{mainTokenId}.{ext}` and semantic site paths such as `site/assets/site/logo.png`; never key HEN mainnet identity by active IDs `0-16`. Record Webflow file ID and original URL as provenance, not runtime data. Deduplicate only identical content hashes and only when semantic alt/caching behavior remains independent.
4. **Integration/independence:** generate asset-manifest references, local `src/srcset`, intrinsic width/height, explicit alt, and deployment URLs. Scan output and network traces for Webflow hosts. Compare loaded pixels/animation and failure states.

Canonical source filenames remain stable for review. Deployment may emit content-hashed copies and an asset manifest; hashed assets receive `Cache-Control: public, max-age=31536000, immutable`, while HTML/route manifests receive short/no-cache revalidation. Preserve original compression/format until parity; later conversion is optional optimization. Logo, hero, Collection Utility banner, spinner, completion/fire/coin GIFs, arrow images, favicon, webclip, and all token thumbnails are migration-critical.

## Font ownership strategy

Target self-hosted delivery for Changa One 400 normal/italic and Inconsolata 400/700. This removes WebFont Loader, `fonts.googleapis.com`, and `fonts.gstatic.com` from the runtime and makes builds/deploys reproducible. Acquisition is conditional on license/provenance verification and exact binary identification; no font is downloaded or redistributed until that ticket passes.

Verified WOFF2 binaries are stored under `site/assets/fonts`, declared in local `@font-face`, and preloaded only for above-the-fold faces actually used on the initial route. Use `font-display: swap` (or an evidence-backed metric-compatible alternative selected by the font ticket), explicit fallback stacks, and recorded weight/style mapping. Browser screenshot and layout-shift tests compare exact glyph metrics at representative headings, rows, controls, and footer widths under loaded and failed-font states.

The embedded `webflow-icons` font is not retained as a technology requirement. Replace the hamburger glyph with a local inline SVG or CSS shape that has equivalent visible dimensions, currentColor behavior, and accessible name on the button. If the vendored baseline temporarily contains the unused embedded face, it must not be fetched and may be removed after widget parity. No-font failure must leave readable text, usable controls, and stable layout.

## Runtime bundle strategy

Keep the current source entrypoints `webflow/home.js`, `webflow/drops.js`, and `webflow/exchange.js` through cutover. Add local widget/first-paint imports narrowly rather than relocating the transaction modules. Parcel remains suitable for the existing Git runtime unless a later ticket proves a missing deterministic-build capability.

Emit content-hashed or release-versioned module paths into `dist/site/assets/js/` and reference them with root-relative same-origin URLs derived from the deploy manifest. Do not use absolute GitHub Pages bundle URLs in generated HTML. Staging and production use the same built bytes; environment behavior remains driven by the existing hostname/network contract and must be explicitly validated for both hosts. Source maps, if emitted, are non-authoritative deploy companions and must not expose secrets.

The build records source commit, lockfile hash, tool versions, entrypoint-to-output mapping, content hashes, and deploy manifest. CI performs a clean install from the lockfile, builds twice or compares a rebuild, validates output, and publishes exactly the validated artifact. A post-deploy probe hashes fetched modules and compares them with the manifest, resolving the current unknown about deployed GitHub Pages equivalence.

## Routing and deployment model

Deploy one complete static directory with directory-index clean URLs, assets, favicon/webclip, route manifest, and an explicit `404.html`. No SPA fallback or server rewrites are required. All internal links are root-relative so direct navigation, refresh, and nested CMS item paths do not depend on the referring page.

Required host capabilities are: HTTPS and custom domain, atomic/versioned artifact deployment or a practical equivalent, correct directory-index serving, explicit 404, configurable cache headers or hashed-asset semantics, staging isolation, deployment logs, and rollback to a retained artifact. GitHub Pages remains technically suitable for the production static artifact if its workflow, custom-domain/DNS behavior, headers/cache semantics, and staging separation pass WF-MIG.19/WF-MIG.24 validation. No vendor change is justified by current evidence.

**Explicit assumptions:** the production custom domain and DNS ownership are available for a controlled switch; GitHub Pages can serve every exact nested directory route; and hostname-driven network selection can represent the chosen staging domain without changing the testnet/Shadownet contract. These are blocking checks before cutover, not reasons to choose an application host now.

404, Search, Password, About, Roadmap, and FAQ routes were not exposed by WF-MIG.1. Do not invent them. Capture current unknown-path behavior in the baseline, create an equivalent owned 404, and preserve the eight evidenced route families. Redirects require an explicit later decision.

## Validation architecture

| Layer | Required automation | Required manual evidence | Classification |
|---|---|---|---|
| Static/data | Schema; 66 records; 36-field mapping; unique identities/slugs/routes; mirror completeness; derived-value equality; deterministic builds; source/output drift | Review import provenance and semantic unresolved fields | AUTOMATED REQUIRED + MANUAL REQUIRED |
| Output/dependencies | HTML parse; route completeness; asset existence; forbidden Webflow URLs/runtime; external inventory; bundle hash; local CSS/font references | Inspect external inventory exceptions | AUTOMATED REQUIRED |
| DOM/CSS contracts | Five list contracts, pane membership, selectors, ancestry, stamping locations, initial state, generated row counts; CSS selector presence/load order | Focused markup/consumer review | AUTOMATED REQUIRED + MANUAL REQUIRED |
| Functional browser | Navbar; Tabs; Drops clone/filter/select; Exchange quantity/cart/identity; wallet states; transaction preconditions; HEN mirror; first-paint failures; no-JS/slow/offline | Live-wallet and transaction-safe staging checks with approved accounts/network | AUTOMATED REQUIRED where fixtures permit; MANUAL REQUIRED for approved live-chain scope |
| Accessibility | Keyboard, focus, ARIA, names, contrast regression, reduced motion, no-JS navigation | Screen-reader spot check and meaningful/empty alt review | AUTOMATED REQUIRED + MANUAL REQUIRED |
| Visual/responsive | Screenshot matrix for all four static pages and material states at base/991/767/479 boundaries; font/image success/failure; first-paint before/after | Approve differences against owned policy | AUTOMATED REQUIRED + MANUAL REQUIRED |
| Routing/deploy | Root/custom/staging hosts; CMS item paths; 404; direct/refresh/back; asset/bundle hashes; cache; no SPA fallback | DNS/custom-domain and rollback rehearsal | AUTOMATED REQUIRED + MANUAL REQUIRED |

Optional validations are performance-budget improvements and image-format optimization after parity. They cannot replace required functional, accessibility, or visual gates. Exact scenario ownership and cutover gates are defined in `06-cutover-validation.md`.

## Webflow transition role

During transition, Webflow is a read-only baseline, current production/staging comparator, and rollback deployment. Content changes enter a documented freeze before the final canonical import. No migration ticket publishes or mutates Webflow unless a separate ticket explicitly authorizes a rollback publication after a tested trigger.

The Git site and Webflow site dual-run on separate staging URLs. The validated Git artifact becomes production only after route, asset/font independence, behavior, accessibility, visual, wallet/network, and rollback gates pass. Webflow is then frozen and retained, unpublished or domain-detached only after the monitoring/rollback window and explicit approval.

After decommission, Webflow has no runtime, presentation, CMS, asset-hosting, custom-code, or deployment role. A sanitized published baseline, audit artifacts, imported provenance, and the last-known rollback artifact remain archived locally. Destructive Webflow deletion is not part of the migration and requires a distinct approved action after retention requirements are satisfied.

## Residual architectural risks

| Risk/open decision | Classification | Required treatment |
|---|---|---|
| Saved-versus-published ambiguity | BLOCKING BEFORE CUTOVER | Capture published HTTP/DOM/assets immediately, freeze content, and reconcile final import. |
| No pixel verification yet | BLOCKING BEFORE CUTOVER | Own screenshot baselines and pass four-family/state comparisons. |
| Collection Utility exact serialization/source | BLOCKING BEFORE IMPLEMENTATION of that page; BLOCKING BEFORE CUTOVER globally | WF-MIG.7 capture, then WF-MIG.13 reconstruct and validate. |
| Asset-content equivalence | BLOCKING BEFORE CUTOVER | Acquire/hash/inspect all 13 + 66 dependencies. |
| Font licensing/provenance/binaries | BLOCKING BEFORE CUTOVER for self-hosting | Verify rights and exact binaries; otherwise select a documented independently deliverable equivalent with metric tests. |
| Editions semantics | VALIDATION REQUIREMENT | Preserve exact value; do not claim live supply. |
| Mint Date semantics | NON-BLOCKING IMPLEMENTATION DECISION | Preserve exact value/provenance; use explicit order. |
| CMS template route response | BLOCKING BEFORE CUTOVER | Capture status/body/head and reproduce or explicitly retire with approval. |
| HEN thumbnail keys | BLOCKING BEFORE CUTOVER | Main-ID canonical paths plus tested mirror adapter. |
| `.intros-collection` drift | VALIDATION REQUIREMENT | Preserve observed markup; test both current consumers; fix only in a scoped coordinated ticket if needed. |
| Exchange 500 ms initialization | BLOCKING BEFORE CUTOVER | Replace with explicit Tabs readiness and integration tests. |
| Deployed GitHub Pages bundle equivalence | VALIDATION REQUIREMENT | Build/deploy manifest and fetched-byte comparison. |
| No observed IX2 vs inaccessible metadata | ACCEPTED RISK with validation | Generated output shows no IX2; browser baseline must reveal any missing interaction before cutover. |
| External marketplace routes | ACCEPTED RISK | Preserve exact derivation; optionally probe links without making external availability a site-runtime dependency. |
| Chain/live supply semantics | VALIDATION REQUIREMENT | Do not reinterpret Editions; verify only transaction preconditions and scoped chain behavior. |
| Transaction validation scope | BLOCKING BEFORE CUTOVER | Define fixture and approved live Shadownet checks; never enable mainnet as part of migration. |
| Webflow rollback retention | BLOCKING BEFORE WEBFLOW REMOVAL | Retain baseline and operational rollback for the approved window; rehearse rollback. |

There is no blocker to beginning WF-MIG.7. These risks prevent immediate cutover or Webflow removal, not selection of the architecture.

## Final architecture conclusion

Migration is technically feasible. Use generated static HTML with targeted client enhancement, a small Node/HTML build layer, canonical Git data, same-origin local CSS/assets/fonts, retained Git transaction modules, and standalone Navbar/Tabs replacements. Preserve current DOM/classes, routes, copy, network/wallet behavior, and transaction pipelines in the first pass. Vendor the exact CSS baseline before extracting it; import rather than infer Editions, Mint Dates, slugs, and media; derive only fields whose rules were proven.

The minimum safe sequence is baseline/freeze, assets/fonts, structured data and HEN mapping, CSS localization and Collection Utility recovery, generation and CMS rows, widgets/first-paint, deployment, automated/functional/visual validation, staging, production, rollback window, then decommission. Selector renames, `.w-*` cleanup, CSS redesign/tokenization, asset re-encoding, runtime relocation, and new CMS template content are deferred.

Immediate Webflow removal is prevented by missing Collection Utility source, unowned CSS/assets/fonts, unverified pixels/behavior, widget dependencies, first-paint failure behavior, route-response ambiguity, HEN image mapping, bundle/deployment proof, and untested rollback. Success means every evidenced route and state is reproducible from Git, the deployed browser performs no required Webflow request, transaction identity remains correct, all required gates pass, a rollback artifact is retained, and decommission receives explicit approval. The first implementation ticket is **WF-MIG.7 — Capture and freeze the published baseline**.
