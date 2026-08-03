# WF-MIG.5 Static Visual and Behavioral Webflow Dependencies

## Audit scope and safety

This audit covers the eight current pages returned for Webflow site `656cf42faa2b1a7a1582d9d2` (`EATACID.xyz`), the three checked-in public HTML snapshots, every public JavaScript entrypoint reachable from those snapshots, page/site custom code, the generated Webflow CSS and JavaScript loaded by the snapshots, and the visible non-CMS assets used by the public site. CMS values and row-level reconciliation remain linked to WF-MIG.2 through WF-MIG.4 rather than repeated.

Evidence labels used below are:

- **WEBFLOW** — directly observed with read-only Data API/MCP operations.
- **REPOSITORY** — observed in the current checked-out files.
- **GENERATED RUNTIME** — observed by read-only inspection of the exact external CSS or JavaScript URLs referenced by checked HTML.
- **INFERENCE** — a conclusion drawn from two or more of those sources.
- **UNRESOLVED** — not available through the read-only interfaces used.

The mandatory connection test returned exactly `EATACID.xyz`, site ID `656cf42faa2b1a7a1582d9d2`. All Webflow operations were read-only. Mutation count and publishing count are both zero. Bridge was not used: a Designer-app read was unavailable, and the ticket prohibits installing or troubleshooting Bridge merely for completeness. No browser or pixel-comparison pass was performed.

## Page inventory and structural status

| Page | ID | Route | Type | Checked source | Structural status |
|---|---|---|---|---|---|
| Home | `656cf42faa2b1a7a1582d9db` | `/` | Static | `index.html` | CURRENT WITH NON-SEMANTIC GENERATED DIFFERENCES |
| Collection Utility | `6978f5a970f1cfe7b14f7b09` | `/collection-utility` | Static | None | UNRESOLVED |
| Drops | `67be119ce0fb23251217c7a9` | `/drops` | Static | `drops/index.html` | CURRENT WITH NON-SEMANTIC GENERATED DIFFERENCES |
| The Exchange | `65dcf9fcd636fdd5996f46ec` | `/exchange` | Static | `exchange/index.html` | CURRENT WITH NON-SEMANTIC GENERATED DIFFERENCES |
| THE 419 SCRIPTs Template | `656f7e03b503790c02f0ee0a` | `/the-419-script/{item-slug}` | CMS template | None | UNRESOLVED |
| CANAANs Template | `65a1be9ecae2314a8ac50ac1` | `/canaan/{item-slug}` | CMS template | None | UNRESOLVED |
| HENs Template | `67be12e2583121ead44b7a2a` | `/hen/{item-slug}` | CMS template | None | UNRESOLVED |
| INTRODUCTIONs Template | `67be31a0b7084dfce7502995` | `/introductions/{item-slug}` | CMS template | None | UNRESOLVED |

About, Roadmap, FAQ, 404, Password, and Search pages are not present in the current page inventory. No additional utility/system pages were exposed. `Collection Utility` is the only additional static page. The four template pages currently expose an empty Body through the Elements API.

For Home, Drops, and The Exchange, page IDs, major hierarchy, classes, text, assets, widgets, and custom CSS match semantically. Generated snapshots expand shared components and CMS prototypes and contain runtime/export attributes not exposed identically by the Elements API. Their Git bootstrap URLs differ: live Webflow custom code loads absolute GitHub Pages bundles, while the checked snapshots load local source entrypoints. That is a load-path value/configuration difference, not observed structural drift; byte equivalence of the deployed bundles was not verified.

All checked public bodies use `body-copy first-paint-main`; none has a body ID. No additional public HTML files or CMS template snapshots are committed.

## Shared site shell

The four static pages share these structural contracts:

- **WEBFLOW-GENERATED / SHARED ACROSS SITE:** Testnet banner; the `Nav Bar` component instance; `Brand Logo`; marquee; footer navigation, marketplace links, social links, copyright; Webflow class hierarchy.
- **GIT-OWNED / SHARED ACROSS SITE:** first-paint release; network detection; Beacon wallet connect/disconnect lifecycle; wallet button state; Shadownet account and NFT reads.
- **RUNTIME-ADDED:** navbar overlay, `w--open`, ARIA menu state, current-link state, focus-visible/touch markers, and page-specific dynamic state.
- **UNRESOLVED:** exact saved-Designer versus last-published equality.

The active `Nav Bar` component is `33cee78f-b5e2-edea-20f8-24dcd14c85bd` with four instances. `Brand Logo` is `7071118a-87de-def0-e628-185bd2f6b11f`, also with four instances. Four other nav-button components have zero instances and are classified APPARENTLY UNUSED for current parity.

The shared navbar contains logo/home navigation; links to Collection Utility, Drops, and Exchange; pending/connect/connected/disconnect wallet states; and the responsive menu button. The shared footer links to Home, Drops, Exchange, marketplaces, and social destinations. Its Collection Utility link is currently `href="#"` in all three checked snapshots, while the header uses `/collection-utility`; preserving or changing this discrepancy is a later explicit product decision.

The first-paint boundary is unusually important. Webflow CSS initially hides `.main-div.first-paint-surface`, `.home-viewport.first-paint-surface`, and `.footer-main-div.first-paint-chrome` with opacity, visibility, and pointer-event rules. `shared/public-first-paint.js` releases those states after fonts/hero readiness or timeout. If the Git module does not execute while the CSS remains, primary content can remain invisible and non-interactive.

## Page-specific static structure

### Home

The Body contains the testnet banner, shared nav, `.home-viewport.first-paint-surface`, `.home-hero`, title and hero image, marquee, and `.footer-main-div.first-paint-chrome`. The hero asset has responsive variants, `decoding="async"`, eager loading, and high fetch priority. Git owns first-paint and wallet/network state; Webflow owns the static composition and CSS.

### Collection Utility

The live tree contains the testnet banner, shared nav, `.home-viewport`, `.home-main-div`, the Discord Rules Banner image, marquee, and footer. It loads `home.js`. Unlike Home, the observed main viewport and footer do not carry the corresponding first-paint surface/chrome classes; the banner still participates in first-paint state. No checked HTML source exists, so exact attributes, generated responsive image markup, and published DOM parity remain unresolved.

### Drops

The live tree includes the loading modal, testnet banner, shared nav, `.main-div.first-paint-surface`, main container, desktop/mobile drop headers, loading/no-schedule states, drop-detail panels, wallet/no-token states, cart preview, action controls, three CMS Collection Lists, marquee, and `.footer-main-div.first-paint-chrome`.

The HEN and INTRO list prototypes contain checkbox forms and must remain cloneable. The CANAAN prototype contains a quantity select but the current Drops runtime does not query `.token-qty`; that control is PRESENTATION-ONLY/UNUSED for current behavior. Git code owns scheduling, filtering, cloning, selection, wallet/token state, transaction state, timers, and chain reads. Webflow owns the prototype structure, assets, responsive styling, and form/list wrappers.

### The Exchange

The live tree includes the loading modal, testnet banner, shared nav, `.main-div.first-paint-surface`, details, a Webflow Tabs widget with `419` and `CANAAN` panes, two CMS lists with quantity selects, the burn cart, exchange action bar, marquee, and first-paint footer. Git owns wallet/NFT reads, list filtering, select option construction, cart totals, contract/token attribution, approvals/trades, transaction status, and modal state. Webflow Tabs own initial pane identity, click/keyboard switching, ARIA, and active-state classes.

### CMS templates

All four live template trees contain only an empty Body. They have no observed custom code, widget, component, visible asset, or checked snapshot. Slug/value ownership remains described by WF-MIG.4.

## Webflow widgets

| Widget | Pages | Active evidence | Webflow behavior | Without Webflow JS | Parity |
|---|---|---|---|---|---|
| Navbar | Four static pages | `.w-nav`, menu/button hierarchy, `data-collapse="medium"`, common runtime module | Responsive overlay; click/keyboard open/close; focus management; `w--open`; ARIA | Desktop links remain; menu is CSS-hidden at <=991px and cannot be opened | Exact behavior/a11y; equivalent implementation acceptable |
| Tabs | The Exchange | `.w-tabs`, two links/panes, page runtime `tabs` module | Click and arrow/Home/End navigation; 300ms in/100ms out; ARIA; active classes | Initial visual pane remains, but tabs do not switch and Git cannot rely on `aria-selected` | Exact behavior/a11y; equivalent implementation acceptable |
| CMS Collection List | Drops (3), Exchange (2) | Five `.w-dyn-list` hierarchies and WF-MIG.3 contracts | Generated row markup and empty states | Existing snapshot rows remain; no Webflow JS is required for a static snapshot | Structural/CSS parity; local generation acceptable |
| Form wrappers | Drops (3 prototypes), Exchange (2 prototypes) | Five Webflow form definitions; no action, redirect, confirmation, or submit button | Generic submission/success/failure module is loaded | Product checkbox/select change handlers still work natively; unused submit machinery disappears | Native control behavior required; wrapper implementation may differ |
| Checkbox | Drops HEN and INTRO | Native checkbox with `.w-checkbox-input`; Git change handlers | Webflow CSS wrapper; generic form/focus support | Git selection remains if DOM/CSS contract is preserved | Mixed ownership; equivalent implementation acceptable |
| Select | Drops CANAAN; Exchange two panes | `.w-select` controls | Native select styling; Exchange options/events are Git-owned | Exchange remains functional if equivalent native controls exist | Mixed ownership; equivalent implementation acceptable |

No active Dropdown, Slider, Lightbox, Lottie, Search, Ecommerce, Background Video, or other Webflow widget was found.

## Webflow interactions and animations

No Webflow IX2 interaction was observed. The checked DOM has zero `data-w-id` occurrences; the exact common and page-generated runtime files contain no `ix2` module/configuration; site/page custom code has no IX2 setup. Confidence is high for current generated output, but saved/unpublished Designer interaction metadata was not exposed, so historical or unpublished IX2 state is unresolved.

Observed non-IX2 motion is:

- The custom marquee uses a CSS keyframe animation and disables motion under `prefers-reduced-motion`.
- First-paint uses Git readiness checks and Webflow opacity/visibility/transition styles.
- Drops uses a 1.5s looping `pulse` animation for standby state, plus 0.2s panel-color and flame-opacity transitions. No reduced-motion override was observed for the pulse.
- Navbar and Tabs transitions are Webflow widget behavior; Tabs use 300ms in/100ms out with `ease`.
- Spinner, completion, fire, and coin GIFs provide looping or state animation.
- Git runtime has countdown, polling, modal, status, hover, click, mutation-observer, resize/orientation, and visibility-change behavior; these are not Webflow IX2.

## Responsive breakpoints and behavior

The exact site CSS breakpoint model is:

| Family | CSS range | Notes |
|---|---|---|
| Desktop/base | No max-width query | Primary generated values; no custom large-screen family observed |
| Tablet | `screen and (max-width: 991px)` | Navbar collapses; home hero stacks; alternate Drops header appears |
| Mobile landscape | `screen and (max-width: 767px)` | Navigation links/footer stack; mobile flame variant; tighter page margins |
| Mobile portrait | `screen and (max-width: 479px)` | Menu/list layouts stack further; vertical arrows; title column hidden |

A generic Webflow helper also uses `min-width: 768px`; it does not establish a fifth site design breakpoint. Max-width rules cascade, so portrait receives tablet and landscape rules too.

Major rules and required classifications:

- Shared shell, page layout, exact spacing, typography, and asset sizing: **EXACT CSS PARITY REQUIRED**.
- Navbar collapse/open behavior and Tabs layout/state: **WEBFLOW-RUNTIME DEPENDENT**; a **FUNCTIONAL RESPONSIVE EQUIVALENT ACCEPTABLE** if visual and accessibility states match.
- Home: `.home-hero` becomes columnar at tablet; viewport stays about 95% wide; hero object position remains center-bottom; portrait has a 354px minimum width. Home viewport height changes with first-paint/network banner state.
- Drops: desktop/mobile headers swap at 991px; flame variants swap at 767/479px; collection title width shrinks then hides; cart becomes `column-reverse` at 479px; page side margins tighten.
- Exchange: tab/list/content widths and row columns contract; mobile controls and hidden title columns must be retained. At portrait width, the generated rule groups `.loading-modal-div` with hidden exchange-button variants, so the modal is intentionally not visible there.
- Footer: maximum width changes at tablet, then navigation/copyright stack on mobile.
- CMS template bodies: **STATIC ACROSS BREAKPOINTS** as currently observed because they are empty.
- Collection Utility: observed hierarchy supports the shared responsive rules, but exact checked-source comparison is **UNRESOLVED**.

Responsive images use Webflow `srcset`/`sizes` where available. Home's hero is eager; CMS and page-state images in Drops/Exchange are lazy. Exact cropping, object fit, and intrinsic dimensions are part of visual parity.

## Typography

Two externally loaded Google font families are material:

- `Changa One` — weight 400, normal and italic; fallback `Impact, sans-serif`; used for headings, navigation, buttons, hero text, and prominent status text.
- `Inconsolata` — weights 400 and 700, normal; fallback `monospace`; used for body/data copy, footer text, tabs, controls, and detail rows.

The WebFont Loader at `ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js` requests those families; resulting stylesheet and font-file URLs are selected dynamically and are not fixed in source. Webflow's custom-font inventory is empty and no local copies were found. Licensing and long-term provider availability were not investigated.

The generated CSS also embeds the `webflow-icons` font as a base64 `@font-face`; the current hamburger glyph uses it. An equivalent local icon is acceptable if dimensions, appearance, focus behavior, and accessible naming remain equivalent.

Font metrics are layout-sensitive because the CSS uses explicit widths, line heights, uppercase transformations, and letter spacing including 0.25px and 2px values. Missing/delayed fonts can change wrapping and overflow. First-paint polls four font descriptors every 50ms for up to 1000ms, waits for the hero for up to 1200ms, and fail-opens after 1300ms if the module itself has loaded.

## Static assets and external hosting

Thirteen material non-CMS static assets are Webflow-hosted with no verified local equivalent: logo, Home hero, Collection Utility banner, spinner GIF, completion GIF, animated and static fire, horizontal and vertical arrow art, static and animated ACID coin art, favicon, and webclip. Their exact asset IDs, URLs, variants, and usage are in `05-assets-fonts.json`.

CMS token imagery is grouped rather than duplicated: WF-MIG.4 records 66 current exact media records. The checked Drops/Exchange snapshots contain responsive, lazy-loaded row images whose continued Webflow-host independence has not been established.

No public video, poster, Lottie file, audio, cursor asset, manifest, Open Graph image, or CSS background image was observed. The generated CSS references a Webflow custom-checkbox SVG, but the current native custom checkbox presentation does not materially depend on that URL/state. The Webflow icon font is inline in CSS.

## Webflow CSS dependencies

All three checked pages load one shared stylesheet before body content:

`https://cdn.prod.website-files.com/656cf42faa2b1a7a1582d9d2/css/staging-eatacid-xyz.webflow.shared.f47fa79a6.css`

There is no checked-in local CSS equivalent. That file combines normalization/base rules, Webflow helpers/widgets, the site design system, responsive rules, first-paint initial state, form control styling, disabled/current/open/active states, focus rules, and the inline icon font.

Material selector families are:

| Selector family | Pages | Purpose and ownership | Failure if absent |
|---|---|---|---|
| element reset/base, `body`, typography | All | Webflow-generated base and site defaults | Unstyled layout, controls, type, margins |
| `.navbar-*`, `.nav-*`, `.w-nav*`, `.w--open`, `.w--current` | Four static | Shared navigation visuals and responsive widget states | Lost layout/current state; unusable mobile menu |
| `.home-*` | Home, Collection Utility | Viewport, hero/utility content, responsive composition | Lost page layout and image sizing |
| `.main-div`, `.main-container`, page header/detail/cart/state families | Drops, Exchange | Core presentation and state layout | Functional nodes remain but site is not visually usable/equivalent |
| `.w-tabs*`, `.tab-*`, `.w--tab-active` | Exchange | Tabs menu/pane layout and active visibility | Panes/state no longer present correctly |
| `.w-form*`, `.w-checkbox*`, `.w-select`, custom checkbox rules | Drops, Exchange | Native control and wrapper presentation | Controls become browser-default; custom selection visuals lost |
| `.w-dyn-*`, collection/list/item families | Drops, Exchange | CMS row/list layout and empty states | Row contract persists structurally but layout collapses |
| `.first-paint-*` | Four static, partially on Collection Utility | Initial hidden/reveal states | FOUC or, when Git is absent, permanently hidden content |
| `.hidden`, pending/live/disabled/flame/loading/cart state families | Drops, Exchange | Git-mutated visibility and state presentation | Wrong or simultaneous states; action affordances lost |
| footer/marquee families | Four static | Shared footer and animation | Lost shared presentation and motion |

Home and Collection Utility add two footer inline style blocks for wallet visibility and marquee animation. Exchange adds the same two families. Drops adds eight blocks covering alignment/truncation, button state, mobile flame spacing, `.hidden`, pulse/live/flame transitions, wallet visibility, checkbox art, and marquee. These page custom styles currently load after the generated Webflow runtime near the end of Body.

Exact class spellings remain hard contracts because Git queries or mutates them. Equivalent local selectors are possible, but only with coordinated HTML and Git changes; this ticket does not select that architecture.

## Webflow runtime JavaScript dependencies

All checked pages load remote jQuery 3.5.1, a common Webflow chunk, and a page-generated Webflow file before the Git module. Drops and Exchange additionally load a form chunk; Exchange's page file contains the Tabs module. Exact hashes and dependency records appear in `05-webflow-runtime-dependencies.json`.

Removing Webflow JavaScript while retaining current HTML, CSS, and Git code would cause:

- **Navbar — MODERATE FUNCTIONAL REPLACEMENT:** desktop links render, but the menu remains hidden at <=991px; open/close classes, overlay, keyboard controls, focus handling, and ARIA state disappear.
- **Exchange Tabs — MODERATE FUNCTIONAL REPLACEMENT:** the baked initial pane remains visual, but tabs do not switch; ARIA is not generated. The Git Exchange initializer waits 500ms and queries `.tab-link[aria-selected="true"]`, so contract identity/init can fail.
- **Current link/focus/touch helpers — SMALL FUNCTIONAL REPLACEMENT:** baked classes cover current snapshots, but generated pages must reproduce URL current state, focus-visible semantics, feature classes, and touch-equivalent behavior.
- **Forms — SMALL FUNCTIONAL REPLACEMENT only if generic Webflow form semantics are retained:** current product flow uses native change events and has no real submission. Webflow success/error machinery is apparently unused.
- **Checkbox/select product control — NO WEBFLOW JS DEPENDENCY / CSS-ONLY WEBFLOW DEPENDENCY:** native controls and Git events work without the Webflow form module if the DOM and styling contract remains.
- **IX2, dropdowns, sliders, lightboxes, search, ecommerce, and background video:** no observed active dependency.

The inline feature script adds `w-mod-js` and may add `w-mod-touch`. Common runtime modules include brand, edit, focus, focus-visible, links, navbar, scroll, and touch. No custom Git code directly queries `w-mod-touch`, but CSS/runtime equivalence must retain observable navigation and focus behavior.

## Navigation and routing

Header routes are `/`, `/collection-utility`, `/drops`, and `/exchange`; the logo points to `/`. Checked current pages bake `w--current` and `aria-current="page"` on matching navigation entries, and Webflow's link module supplies current-route behavior to generated output.

External footer/marketplace/social links open in a new target where configured. Checked `_blank` links have no explicit `rel`; this is current behavior, not a cleanup authorization. Action controls commonly use `href="#"`; Git prevents defaults on primary actions, but current hash/scroll behavior must be observed for any control not intercepted before changing it.

No public app row links to the CMS template pages. The current dynamic routes are `/the-419-script/{item-slug}`, `/canaan/{item-slug}`, `/hen/{item-slug}`, and `/introductions/{item-slug}`. No redirects or 404 behavior were exposed by the inspected repository/page inventory.

Root-relative navigation and assets assume deployment at a domain root. A GitHub project subpath would need equivalent base/routing behavior. The site API reports no custom domains; the stated staging domain is `staging-eatacid-xyz.webflow.io`. Canonical/custom-domain behavior and browser back/forward validation remain unresolved.

## Forms and controls

Five Webflow form definitions exist, all with empty action, GET method, no redirect/confirmation, and no submit button:

| Page/list | Control | Current purpose | Ownership |
|---|---|---|---|
| Drops HEN | `Checkbox-2`, name `Checkbox 2`, `.Events_Checkbox` | Exclusive row selection and cart construction | MIXED OWNERSHIP; Git functional, Webflow markup/CSS |
| Drops INTRO | `Checkbox`, name `Checkbox`, `.Events_Checkbox` | Exclusive row selection and cart construction | MIXED OWNERSHIP; Git functional, Webflow markup/CSS |
| Drops CANAAN | `field-2`, name `Field 2`, `.token-qty` | Present in prototype; current Drops code does not consume it | PRESENTATION-ONLY / UNUSED |
| Exchange 419 | `field`, name `Field` | Git rebuilds quantity options and updates cart | MIXED OWNERSHIP; Git functional, Webflow markup/CSS |
| Exchange CANAAN | `field-2`, name `Field 2` | Git rebuilds quantity options and updates cart | MIXED OWNERSHIP; Git functional, Webflow markup/CSS |

The checked CMS-expanded snapshots repeat prototype form IDs across rows. No actual form submission, validation, endpoint, spam protection, or generated hidden submission field participates in the intended product flow. `.w-form-done` and `.w-form-fail` nodes are PRESENTATION-ONLY/APPARENTLY UNUSED. Keyboard and focus behavior is primarily native; Navbar/Tabs keyboard behavior is Webflow runtime-owned. Wallet/connect/disconnect controls are links/buttons outside a submission flow and are Git functional.

## Load order and initialization

Checked page order is:

1. Remote shared Webflow CSS.
2. Google preconnects and WebFont Loader/configuration.
3. inline feature detection (`w-mod-js`/touch).
4. Body markup, including expanded components/CMS rows.
5. remote jQuery.
6. common Webflow runtime, optional forms chunk, then page Webflow runtime.
7. page custom inline CSS and Git module entrypoint.

Hard dependencies:

- CSS must establish the intended hidden first-paint state before paint, and the Git first-paint module must execute to release it.
- jQuery loads before the current Webflow runtime.
- Exchange Tabs must initialize and set ARIA before Git Exchange code inspects the active tab after its fixed 500ms delay.
- CMS rows and required hidden identity nodes/classes must exist before Git list initialization.
- Current live custom code depends on absolute `https://chokedesigns.github.io/eatacid-xyz/{home,drops,exchange}.js` availability.
- Git page modules are loaded after Body or use DOMContentLoaded-safe initialization.

Soft dependencies include font readiness (1000ms cap), hero readiness (1200ms cap), and their 1300ms fail-open. Drops has 1s countdown updates, a default 10s supply poll, transaction-status polling around 5s with a 120s limit, and 3s modal timing. Exchange uses a 500ms initial delay, MutationObserver cart handling, chain-operation polling, and 3s modal timing. Wallet initialization depends on Beacon and Shadownet RPC/TzKT availability.

Loaders select `./prod` on `eatacid.xyz`/`www.eatacid.xyz` and `./staging` elsewhere, then dynamically import page bundles and report errors. The current Webflow page custom code bypasses those checked loaders in favor of the absolute GitHub Pages bundle URLs; deployed-bundle equality is unresolved.

## Webflow versus checked-in HTML

Home, Drops, and Exchange are structurally current at the page shell level with non-semantic generated differences: shared components are expanded in HTML; CMS list prototypes become row occurrences; Webflow injects widget/current/accessibility state; and serialization details differ. WF-MIG.4 already established that all 97 checked CMS row occurrences are current, so those values are not duplicated here.

Observed page-value difference is the Git module URL/source strategy. Live Webflow custom code references absolute GitHub Pages modules; checked snapshots reference local modules that reach the corresponding source graph. This remains a deployment/configuration seam.

Collection Utility has a live Webflow tree but no checked source. Its structure cannot be verified as a current HTML snapshot. The four CMS templates are empty in the current element read and also have no snapshots. Consequently, the checked-in HTML plus current Git runtime is not by itself sufficient to reproduce every current public route with evidenced structural/visual parity.

The Data API reports current saved structures, while checked snapshots reflect a publication. Last-published metadata is close to the current audit baseline, but no read-only evidence proves byte-for-byte saved-versus-published equality.

## Remaining Webflow ownership

Webflow still owns or hosts the current:

- complete shared presentation stylesheet, responsive design rules, first-paint initial state, helper/widget styling, and icon font;
- static page structure for Collection Utility and the current empty template routes, which have no checked local sources;
- Navbar and Tabs initialization behavior and accessibility state;
- generated CMS/list/form wrapper markup and currently published page serialization;
- thirteen material non-CMS static assets and the current CMS media hosting recorded by WF-MIG.4;
- page custom-code placement and the absolute GitHub Pages module references;
- Google WebFont Loader integration and the timing of generated page/runtime assets.

Git owns page business behavior, wallet/chain integration, first-paint release, state transitions, CMS-row consumption, and transaction pipelines, but it is coupled to Webflow's class/hierarchy/state contracts. No conclusion that Webflow is removable is made here.

## Unresolved items and tooling limitations

- Designer/Bridge breakpoint and saved interaction metadata were unavailable because no active Designer MCP app was connected. Bridge was not installed or troubleshot.
- Current generated output has no IX2 evidence; unpublished or historical Designer interaction state cannot be excluded.
- No browser observation or screenshot comparison verified rendering, animation timing, focus order, back/forward behavior, hash behavior, or pixel equivalence.
- Collection Utility and the four CMS templates have no checked HTML source.
- 404, Password, Search, redirects, and canonical behavior were not exposed by the current inventory/tools.
- The exact deployed GitHub Pages bundle contents were not compared with local page bundles.
- Data API link settings sometimes reported `linkType: none` while checked generated HTML contained resolved `href` values; the published HTML is the stronger route evidence for those links.
- Google font binary URLs, licenses, and future availability remain unresolved.
- No local equivalent was found for the material Webflow-hosted assets; assets were not downloaded.
- Saved Designer state versus published output cannot be proven identical from these reads.

## Inputs for WF-MIG.6

WF-MIG.6 can use the following bounded facts without treating them as an architecture recommendation:

- Eight routes require coverage; only three have checked HTML snapshots.
- The site has four responsive breakpoint families and no observed custom large-screen breakpoint.
- Exact visual parity requires reproducing the shared generated CSS effects, two Google font families, visible static assets, responsive rules, and first-paint state.
- Exact behavioral parity requires responsive Navbar behavior, Exchange Tabs behavior/ARIA, Git DOM contracts, wallet/chain flows, timers, and runtime state transitions.
- Webflow's specific Navbar/Tabs implementations can be replaced by functional equivalents if the visible, responsive, keyboard, focus, ARIA, and Git integration contracts remain equivalent.
- Five form wrappers do not represent actual Webflow submission flows; native controls are the product behavior boundary.
- No current IX2 dependency was found in generated output.
- Collection Utility source, locally owned CSS, and local asset equivalents are evidenced gaps.
- The risk register, structured page/runtime inventory, asset/font inventory, and parity contracts in this ticket define the remaining validation seams; target architecture and effort remain deferred.
