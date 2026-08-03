# WF-MIG.5 Page Parity Contracts

Classification terms are the ticket-defined `EXACT VISUAL PARITY REQUIRED`, `EXACT BEHAVIORAL PARITY REQUIRED`, `FUNCTIONAL EQUIVALENT ACCEPTABLE`, `STRUCTURAL EQUIVALENT ACCEPTABLE`, `PRESENTATION-ONLY`, `APPARENTLY UNUSED`, and `UNRESOLVED`.

## Shared site shell

Applies to the four current static routes: Home `656cf42faa2b1a7a1582d9db`, Collection Utility `6978f5a970f1cfe7b14f7b09`, Drops `67be119ce0fb23251217c7a9`, and The Exchange `65dcf9fcd636fdd5996f46ec`.

- **Required hierarchy — STRUCTURAL EQUIVALENT ACCEPTABLE:** Body; testnet banner; Nav Bar/Brand Logo; page main; marquee; footer. Preserve ordering where CSS, first-paint, or Git selectors depend on it.
- **Required visible sections — EXACT VISUAL PARITY REQUIRED:** dark site surface, banner, navigation, wallet states, marquee, footer navigation/marketplaces/social/copyright, page-specific main.
- **Required assets — EXACT VISUAL PARITY REQUIRED:** Webflow-hosted logo and spinner, favicon/webclip where site chrome applies; exact inventory in `05-assets-fonts.json`.
- **Required typography — EXACT VISUAL PARITY REQUIRED:** Changa One 400 normal/italic and Inconsolata 400/700 with current metrics, weights, transforms, spacing, line height, and fallbacks. Hamburger technology may change if appearance remains equivalent.
- **Required responsive behavior — EXACT VISUAL PARITY REQUIRED:** desktop, <=991px, <=767px, and <=479px generated outcomes; footer stacking and nav presentation.
- **Required interactive behavior — EXACT BEHAVIORAL PARITY REQUIRED:** responsive nav open/close, current route, wallet connect/pending/connected/disconnect, external/internal links, marquee reduced-motion behavior.
- **Required runtime states — EXACT BEHAVIORAL PARITY REQUIRED:** first-paint hidden/reveal, testnet banner/network state, wallet states, `w--current` equivalent, mobile nav open/closed state.
- **Required accessibility behavior — EXACT BEHAVIORAL PARITY REQUIRED:** Navbar click/Space/Enter/Escape/arrow/Home/End behavior, focus handling, control naming, `aria-expanded`, current-page semantics, visible keyboard focus, native link semantics.
- **Required Git integrations — EXACT BEHAVIORAL PARITY REQUIRED:** `shared/public-first-paint.js`, `shared/beacon-setup.js`, current network/registry semantics, public wallet events and state selectors.
- **Exact-parity requirements:** visible shared layout, spacing, colors, borders, typography, assets, hidden/visible state, breakpoints, and user-facing copy.
- **Functionally equivalent areas:** Webflow component identity, generated wrapper implementation, icon-font technology, Navbar implementation, and hosting URLs may differ if all observable and Git integration contracts remain equivalent.
- **Unresolved details:** Collection Utility serialization; saved-versus-published equality; browser/pixel validation; external-link and hash behavior beyond static attributes.

## Home

Route `/`; page ID `656cf42faa2b1a7a1582d9db`; checked source `index.html`.

- **Required hierarchy:** shared shell > `.home-viewport` > `.home-hero` > title and hero image; marquee then footer. Preserve first-paint selector targets or update Git/CSS together.
- **Required visible sections:** banner, shared nav, hero title/image, marquee, footer.
- **Required assets:** logo, `6a63b0067c91ab95d4f2a132` hero with 500/800 variants, spinner, favicon, webclip.
- **Required typography:** shared fonts; Changa One hero/navigation metrics are layout-critical.
- **Required responsive behavior:** column hero at <=991px; shared mobile nav/footer; about 95% viewport width; center-bottom hero positioning; current portrait minimum width; current testnet-dependent viewport height.
- **Required interactive behavior:** shared Navbar/wallet; first-paint waits for fonts and hero then reveals; marquee respects reduced motion.
- **Required runtime states:** `.first-paint-main`, banner, surface, and chrome state; `is-testnet`; wallet states; mobile menu/current route.
- **Required accessibility behavior:** responsive menu semantics; logo/home link; current page semantics; preserve current hero/decorative alt behavior unless separately authorized.
- **Required Git integrations:** checked `webflow/home.js` source graph or an equivalent execution of first-paint and Beacon setup. Live currently loads the absolute GitHub Pages `home.js`.
- **Exact-parity requirements:** hero image/content/crop, layout, type, shared chrome, first visible state.
- **Functionally equivalent areas:** local component/rendering mechanism, responsive image generator, first-paint implementation and Navbar technology.
- **Unresolved details:** deployed bundle equality, saved/published byte equality, measured FOUC/layout shift, pixel equivalence.

## Drops

Route `/drops`; page ID `67be119ce0fb23251217c7a9`; checked source `drops/index.html`.

- **Required hierarchy:** loading modal; shared shell; `.main-div.first-paint-surface` and main container; desktop/mobile headers; schedule/loading/no-schedule/details/wallet/cart/action states; HEN, INTRODUCTION, and CANAAN list hierarchies; footer. WF-MIG.3 list-specific row contracts and hidden Token ID nodes remain authoritative.
- **Required visible sections:** all current scheduled/unscheduled/loading/wallet/no-token/drop-live/cart/transaction states as selected by Git; no simultaneous stale states.
- **Required assets:** shared logo/spinner/icons; completion GIF; static/animated fire; horizontal/vertical arrows; ACID coin; the exact CMS media records grouped through WF-MIG.4.
- **Required typography:** shared font metrics plus current centered/truncated title and control styling.
- **Required responsive behavior:** header swap at <=991px; mobile flame swap at <=767px; portrait flame/arrows/cart direction/title-column rules at <=479px; current row, button, footer, overflow, width, margin, and image behavior.
- **Required interactive behavior:** responsive Navbar; exclusive HEN/INTRO checkbox selection; row cloning/filtering; cart/action controls; tooltip/ellipsis timing; hover/click; countdown; supply polling; wallet/visibility/resize/orientation handling; transaction pipeline and modal/status updates.
- **Required runtime states:** first-paint; loading/no-schedule/live/standby/pending/disabled; wallet/no-token/cart; flame; modal/operation; cloned-row state. Preserve cancellation and stale-write boundaries in the current Git code.
- **Required accessibility behavior:** shared Navbar; native checkbox keyboard/focus semantics; associated visual checked/focus state; meaningful disabled action state. Generic Webflow form submission messages are APPARENTLY UNUSED.
- **Required Git integrations:** `drops/js/main.js`, `drops/js/events.js`, schedule/config, shared first-paint, Beacon/network/registry/drop-time/logger modules, and transaction consumers. Live loads absolute GitHub Pages `drops.js`.
- **Exact-parity requirements:** visible hierarchy, CMS row contract/data, media, responsive states, action affordances, timing-visible states, and current copy.
- **Functionally equivalent areas:** CMS row generation and Webflow list/form wrappers; native checkbox implementation; Navbar; animation encoding; local CSS organization. Equivalent structure must remain cloneable and satisfy Git selectors.
- **Unresolved details:** remote bundle equality, browser/pixel behavior, saved-versus-published equality. Known `.intros-collection`/`.introductions-collection` selector drift is preserved and not fixed.

## The Exchange

Route `/exchange`; page ID `65dcf9fcd636fdd5996f46ec`; checked source `exchange/index.html`.

- **Required hierarchy:** loading modal; shared shell; first-paint main/container; details; Tabs menu with `419` and `CANAAN`; corresponding panes and CMS lists; quantity forms; burn cart; action bar; footer. Pane membership remains part of contract identity.
- **Required visible sections:** initial 419 tab/pane, switchable CANAAN pane, eligible-token states, cart/action/pending/modal states, shared chrome.
- **Required assets:** shared logo/spinner/favicon/webclip; completion GIF; static and animated ACID coin; grouped exact CMS media from WF-MIG.4.
- **Required typography:** shared fonts and current tab/detail/row/control metrics.
- **Required responsive behavior:** shared four families; current tab width/layout; row-column contraction/hiding; mobile control/spacing/footer changes; portrait behavior that hides current loading modal/exchange button variants.
- **Required interactive behavior:** Navbar; tabs click and arrow/Home/End behavior; 300ms-in/100ms-out visible state; select options/change; cart mutation; wallet/NFT reads; approval/trade/send/status/explorer pipeline.
- **Required runtime states:** first-paint; active tab/pane; `aria-selected`; wallet/pending/no-token; select/cart/action; loading/completion/error modal; contract/token attributes.
- **Required accessibility behavior:** exact Tabs roles, associations, selected state, roving focus and keyboard navigation; shared Navbar; native select keyboard/focus semantics; meaningful disabled/action state.
- **Required Git integrations:** `exchange/js/main.js`, `exchange/js/exchange.js`, config and shared trade/wallet/network/registry/first-paint modules. Tabs must be ready before Git consumes active selection after its current fixed 500ms delay. Live loads absolute GitHub Pages `exchange.js`.
- **Exact-parity requirements:** visible shell, pane membership and identity result, CMS row/data/media, responsive presentation, state copy and transaction feedback.
- **Functionally equivalent areas:** Tabs and Navbar implementations, CMS generation, form wrappers/native select styling, animation encoding, and CSS organization if observable/a11y/Git contracts remain equivalent.
- **Unresolved details:** fixed-delay reliability under slow delivery, deployed bundle equality, saved/published equality, browser/pixel behavior.

## About

No About page exists in the current WF-MIG.1/current Webflow page inventory. No route or page ID is available, and no hierarchy, visible section, asset, font, responsive, interactive, runtime, accessibility, navigation, Git integration, exact-parity, or functional-equivalent contract is invented. Page existence and any future requirements are **UNRESOLVED** outside this current inventory.

## Roadmap

No Roadmap page exists in the current WF-MIG.1/current Webflow page inventory. No route or page ID is available, and no hierarchy, visible section, asset, font, responsive, interactive, runtime, accessibility, navigation, Git integration, exact-parity, or functional-equivalent contract is invented. Page existence and any future requirements are **UNRESOLVED** outside this current inventory.

## FAQ

No FAQ page exists in the current WF-MIG.1/current Webflow page inventory. No route or page ID is available, and no hierarchy, visible section, asset, font, responsive, interactive, runtime, accessibility, navigation, Git integration, exact-parity, or functional-equivalent contract is invented. Page existence and any future requirements are **UNRESOLVED** outside this current inventory.

## Additional static pages

### Collection Utility

Route `/collection-utility`; page ID `6978f5a970f1cfe7b14f7b09`; no checked HTML source.

- **Required hierarchy:** observed shared banner/nav > `.home-viewport` > `.home-main-div` > `Image 6`; separate marquee and footer. This observed tree is the minimum current structural evidence.
- **Required visible sections:** shared shell and Discord Rules Banner page content.
- **Required assets:** shared logo/spinner plus `68953810fbd7e6400b64aea9` Discord Rules Banner and its 500/800/1080/1600/2000/2600 variants; site favicon/webclip inclusion is inferred.
- **Required typography:** shared Changa One/Inconsolata metrics.
- **Required responsive behavior:** shared navigation/footer and home-family viewport/image rules; exact serialized `sizes`, loading, and custom page behavior are UNRESOLVED.
- **Required interactive behavior:** shared Navbar, wallet/network behavior, marquee/reduced-motion; live custom code loads `home.js`.
- **Required runtime states:** shared banner/wallet/current-route state. The observed viewport/footer omit Home's first-paint surface/chrome classes, so full-page first-paint coupling is UNRESOLVED and must not be assumed.
- **Required accessibility behavior:** shared Navbar/focus/current-route behavior; current image alt metadata is null, and exported behavior is unavailable.
- **Required Git integrations:** equivalent execution of `home.js` first-paint/Beacon imports without inventing feature-specific behavior.
- **Exact-parity requirements:** visible image, shared shell, page spacing/layout, fonts, breakpoints, and current copy.
- **Functionally equivalent areas:** source/rendering system, responsive image generation, Navbar and hosting.
- **Unresolved details:** the entire serialized source/load order, exact body/head/runtime attributes, published link state, image loading/sizes, first-paint intent, and pixel behavior. This is a material source gap.

## CMS template pages

Current routes and IDs:

| Template | Route | Page ID |
|---|---|---|
| THE 419 SCRIPTs | `/the-419-script/{item-slug}` | `656f7e03b503790c02f0ee0a` |
| CANAANs | `/canaan/{item-slug}` | `65a1be9ecae2314a8ac50ac1` |
| HENs | `/hen/{item-slug}` | `67be12e2583121ead44b7a2a` |
| INTRODUCTIONs | `/introductions/{item-slug}` | `67be31a0b7084dfce7502995` |

- **Required hierarchy/visible sections:** current read-only element trees expose an empty Body only; reproducing that observed absence is a STRUCTURAL EQUIVALENT ACCEPTABLE baseline, not proof of the published HTTP shell.
- **Required assets/typography/responsive behavior/interactive behavior/runtime states/accessibility behavior/Git integrations:** none directly observed in Body. Item slugs and media/value ownership remain governed by WF-MIG.4.
- **Exact-parity requirements:** route patterns and current exact slugs where routes are served. Do not invent visible template content.
- **Functionally equivalent areas:** empty-body serialization, if current published behavior is confirmed.
- **Unresolved details:** no checked snapshots; actual published response shell/head/SEO/canonical/404 behavior; generated stylesheet/runtime inclusion; whether an item route renders an empty body in-browser.

## Utility and system pages

No 404, Password, Search, or other utility/system page is present in WF-MIG.1 or the refreshed current page list. No page IDs/routes exist to bind a hierarchy, visible section, asset, font, breakpoint, interaction, runtime state, accessibility, navigation, Git integration, exact-parity, or functional-equivalent requirement. Custom 404/fallback behavior, redirects, and host-level password/search behavior are **UNRESOLVED**; they must not be inferred from absence in the page list.

## Responsive parity

- **EXACT VISUAL PARITY REQUIRED:** base/desktop rules; <=991px tablet; <=767px mobile landscape; <=479px mobile portrait; cascading behavior; page layouts, typography, spacing, visibility, overflow, intrinsic sizes, cropping, footer, row/cart state, and current responsive images.
- **EXACT BEHAVIORAL PARITY REQUIRED:** Navbar becomes operable when CSS hides desktop menu; Exchange Tabs remain switchable and correctly identify their pane at all widths; all Git actions remain reachable at their current breakpoint scopes.
- **FUNCTIONAL EQUIVALENT ACCEPTABLE:** implementation of media queries, Navbar overlay, Tabs layout, responsive image generation, and hamburger icon, provided the exact observable result and accessibility contract are maintained.
- **UNRESOLVED:** Collection Utility serialization; portrait modal intent versus generated grouping; browser/device rendering and custom large-screen Designer metadata. No custom large-screen CSS family was observed.

## Accessibility parity

- Preserve Navbar naming, `aria-controls`, `aria-haspopup`, `aria-expanded`, keyboard open/close/navigation, Escape behavior, and focus handling.
- Preserve Tabs roles, link/panel associations, `aria-selected`, `tabindex`, click and arrow/Home/End navigation before Git reads the active tab.
- Preserve `aria-current="page"` or an equivalent current-route signal, visible focus behavior, native checkbox/select semantics, and meaningful disabled controls.
- Preserve the current decorative/empty image-alt behavior for exact parity unless a separate accessibility change is authorized; live asset alt metadata is null.
- The generated focus-visible compatibility attribute can be replaced by standards-based CSS where browser support yields equivalent visible keyboard focus.
- **UNRESOLVED:** browser-tested focus order, screen-reader announcements, repeated generated form-ID effects, and Collection Utility image semantics.

## Runtime initialization parity

- **HARD:** site CSS must establish correct initial presentation before paint; first-paint code must release hidden surfaces/chrome even when fonts/hero time out.
- **HARD:** current Webflow runtime requires jQuery first; any replacement may remove that relationship only by replacing the dependent behavior.
- **HARD:** Exchange active-tab ARIA/state must exist before Git's current 500ms initialization reads it.
- **HARD:** CMS rows, pane membership, hidden identity nodes, and list-specific classes must exist before Drops/Exchange initialization.
- **HARD:** current live pages require GitHub Pages bundles; a replacement URL is acceptable if execution/import/failure semantics are retained.
- **SOFT:** font and hero readiness are capped; preserve the fail-open visible outcome.
- Preserve DOMContentLoaded-safe boot, observers, polling, timer/reset/cancellation/stale-write behavior, wallet initialization, and visible error reporting in Git code.

## Functional equivalents

The following Webflow-specific mechanisms may be replaced without preserving generated implementation details, subject to the exact contracts above:

- Navbar markup/runtime and embedded `webflow-icons` font.
- Tabs markup/runtime and generated element IDs.
- Webflow component expansion.
- CMS list generation and `.w-dyn-*` wrappers, if WF-MIG.3 DOM/identity behavior and visible list/empty states remain equivalent.
- Webflow form wrappers and generic submission success/error nodes, because actual product interactions are native Git-handled control changes and no submission occurs.
- Generated CSS file organization/selectors, only when coordinated with every Git consumer and with exact visible/responsive/state results.
- External font/image/script hosting URLs, after equivalent owned assets/runtime exist.
- Current first-paint mechanism, if it preserves no-FOUC/no-permanent-hide behavior and the same visible readiness outcome.

This list is not a target architecture or a statement that replacement work is complete.

## Unresolved parity requirements

- Collection Utility has no checked source; exact published DOM/head/assets/load order and first-paint behavior require later extraction or observation.
- CMS template routes have empty live Bodies but no published snapshots; HTTP/head/SEO/canonical/404 behavior is unknown.
- Saved Designer state versus published output is not provably identical.
- Designer/Bridge interaction metadata was unavailable. Generated output shows zero IX2 config and zero `data-w-id`, but unpublished state remains inaccessible.
- No browser/pixel pass verified visual equivalence, focus order, animation timing, layout shift, route history, hashes, redirects, or mobile device behavior.
- Exact deployed GitHub Pages bundle equality with current local source is unresolved.
- Google font binaries/licensing and all asset local equivalents remain unresolved.
- Target architecture, effort, implementation readiness, and Webflow-removal readiness are deferred to later work.
