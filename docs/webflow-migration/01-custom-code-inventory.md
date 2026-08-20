# WF-MIG.1 Custom Code Inventory

## Scope and evidence

This report records readable site/page custom code and its repository runtime relationships for Webflow site `656cf42faa2b1a7a1582d9d2`. It summarizes code purpose and preserves exact public identifiers/URLs where architecturally useful. It does not reproduce secrets (none were observed), audit every CSS declaration, or analyze CMS content.

Evidence labels:

- **WEBFLOW** — read directly from site/page freeform code or other Webflow read endpoints.
- **REPOSITORY** — confirmed in the current checked-out repository.
- **INFERENCE** — derived relationship, explicitly labeled.
- **UNRESOLVED** — unavailable through this read-only pass.

## Site-level custom code

**WEBFLOW:** both site-level freeform locations are empty:

| Location | Content |
| --- | --- |
| Head | empty |
| Footer | empty |

**WEBFLOW:** registered scripts total `0`. Site applied-script lookup returned HTTP 404 `Custom code block not found`; this is consistent with no applied registered-script block but is recorded as an endpoint result rather than a second count.

**WEBFLOW:** `googleTagIds` is an empty array. No site-level analytics/tracking snippet was observed.

## Page-level custom code

| Page | ID | Head | Footer | Module URL |
| --- | --- | --- | --- | --- |
| Home | `656cf42faa2b1a7a1582d9db` | empty | CSS + module | `https://chokedesigns.github.io/eatacid-xyz/home.js` |
| Collection Utility | `6978f5a970f1cfe7b14f7b09` | empty | CSS + module | `https://chokedesigns.github.io/eatacid-xyz/home.js` |
| Drops | `67be119ce0fb23251217c7a9` | CSS | CSS + module | `https://chokedesigns.github.io/eatacid-xyz/drops.js` |
| The Exchange | `65dcf9fcd636fdd5996f46ec` | empty | CSS + module | `https://chokedesigns.github.io/eatacid-xyz/exchange.js` |
| THE 419 SCRIPTs Template | `656f7e03b503790c02f0ee0a` | empty | empty | none |
| CANAANs Template | `65a1be9ecae2314a8ac50ac1` | empty | empty | none |
| HENs Template | `67be12e2583121ead44b7a2a` | empty | empty | none |
| INTRODUCTIONs Template | `67be31a0b7084dfce7502995` | empty | empty | none |

Page applied-script lookups returned HTTP 404 `Custom code block not found` for all eight pages. The freeform code above is a separate surface and was readable.

### Shared Home / Collection Utility footer code

**WEBFLOW directly observed identifiers:**

- `.button-primary.connected-state.w-button`
- `.button-primary.disconnect-hover.w-button`
- `.scroll-banner-text`
- `--scroll-speed: 70s`
- `@keyframes eatacid-marquee`
- `@media (prefers-reduced-motion: reduce)`

Purpose:

- Hides connected/disconnect wallet-control states initially.
- Generates a duplicated pseudo-element “EAT ACID” marquee and animates it continuously.
- Disables marquee animation for reduced-motion users.
- Loads `home.js` as an ES module.

**REPOSITORY relationship:** `webflow/home.js` imports `shared/public-first-paint.js` and `shared/beacon-setup.js`. The first-paint module consumes `first-paint-*`, testnet, and home-hero selectors. Beacon setup consumes the Nav Bar wallet selectors and owns wallet connection state. No Collection Utility-specific module is present.

### Drops head code

**WEBFLOW directly observed selector/state families:**

- Drop text layout: `.drop-details-burn-collection-text`, `.drop-details-redeem-token-title-text`, `.drop-details-drop-time-text`.
- Action color/state: `.event-cart-exchange-button-no-select.w-button` and `.live`.
- Flame layout: `.flame-icon-mobile-l`, `.flame-icon-mobile-l-animated`.
- Utility/state classes: `.hidden`, `.standby-anim`, `@keyframes pulse`.
- Live panel state: `.event-cart-burn-token-div-main`, `.event-cart-redeem-token-div-main`, `.live-panels`.
- Flame-container state: `.events-arrow-flame-icon-div`, `.live-panels .events-arrow-flame-icon-div`.

Purpose: page-specific visual state and transition rules for repository-driven drop/cart state.

### Drops footer code

**WEBFLOW directly observed selector/state families:**

- Initial wallet controls: `.button-primary.connected-state.w-button`, `.button-primary.disconnect-hover.w-button`.
- Custom burn selection control: `input[type="checkbox"].w-checkbox-input.events_checkbox`, checked state, and a flame checkmark pseudo-element.
- Marquee: `.scroll-banner-header-div`, `.scroll-banner-text`, and `eatacid-marquee`.
- ES module URL: `https://chokedesigns.github.io/eatacid-xyz/drops.js`.

**REPOSITORY relationship:** `webflow/drops.js` imports `drops/js/main.js`; that imports shared first-paint, shared Beacon setup, and `drops/js/events.js`. `events.js` directly consumes Webflow CMS/list/form/text/image selectors, manages drop state and wallet filtering, and owns chain transaction behavior.

### The Exchange footer code

**WEBFLOW directly observed identifiers:**

- `.button-primary.connected-state.w-button`
- `.button-primary.disconnect-hover.w-button`
- `.scroll-banner-text`
- `--scroll-speed: 70s`
- `@keyframes eatacid-marquee`
- `@media (prefers-reduced-motion: reduce)`
- ES module URL: `https://chokedesigns.github.io/eatacid-xyz/exchange.js`

Purpose: initial wallet-control visibility, marquee presentation, and Exchange runtime boot.

**REPOSITORY relationship:** `webflow/exchange.js` imports `exchange/js/main.js`; that imports shared first-paint, shared Beacon setup, and `exchange/js/exchange.js`. The Exchange runtime consumes Webflow tabs, Collection Lists, selects, cart/modal/button nodes, and owns wallet/chain state and transactions.

## GitHub Pages loader relationships

**REPOSITORY directly observed deployment flow:**

1. `.github/workflows/pages.yml` copies:
   - main's `loaders/root/*.js` to the stable deployed root names;
   - main's `loaders/environment/*.js` to deployed `prod/*-loader.js`;
   - staging's `loaders/environment/*.js` to deployed `staging/*-loader.js`.
2. Each root router treats `eatacid.xyz` and `www.eatacid.xyz` as production hosts.
3. Root routers dynamically import the selected environment loader. Home's environment loader independently starts `first-paint.js` and `home.js`; Drops and Exchange start their matching application bundle.
4. `package.json` builds the Parcel entrypoints into `dist/prod` or `dist/staging` without changing the prod/staging bundle layout.

```text
Webflow footer module URL
  -> main-owned deployed root router
  -> host-selected branch-owned environment loader
  -> same-environment application bundle(s)
  -> webflow/*.js Parcel entry
  -> shared and page-specific repository runtime
```

This is the principal custom-code boundary between Webflow-owned presentation and Git-owned behavior.

## Script and stylesheet dependencies

### Webflow custom-code dependencies

The only external script URLs directly present in Webflow freeform code are the three GitHub Pages module URLs listed above. No external stylesheet URL appears in freeform code; page CSS is inline.

No HtmlEmbed or CodeBlock element was found in any page tree. No registered Webflow script was found.

### Current checked-in rendered entrypoints

**REPOSITORY:** `index.html`, `drops/index.html`, and `exchange/index.html` identify the same Webflow site/page IDs and load:

- Hosted Webflow shared CSS:
  `https://cdn.prod.website-files.com/656cf42faa2b1a7a1582d9d2/css/staging-eatacid-xyz.webflow.shared.f47fa79a6.css`
- Google WebFont Loader 1.6.26:
  `https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js`
- Google font families:
  `Changa One:400,400italic` and `Inconsolata:400,700`
- jQuery 3.5.1:
  `https://d3e54v103j8qbb.cloudfront.net/js/jquery-3.5.1.min.dc5e7f18c8.js?site=656cf42faa2b1a7a1582d9d2`
- Webflow runtime chunks under:
  `https://cdn.prod.website-files.com/656cf42faa2b1a7a1582d9d2/js/`
- Webflow/other asset media under:
  `https://cdn.prod.website-files.com/`

The checked-in HTML snapshots substitute local repository entrypoints for the absolute GitHub loader tags:

- Home: `./shared/public-first-paint.js` and `./shared/beacon-setup.js`.
- Drops: `js/main.js`.
- Exchange: `js/main.js`.

This difference is recorded as a repository/Webflow seam, not treated as a defect.

## External integrations

- **Webflow runtime:** navbar, tabs, Collection Lists, forms, hosted CSS/runtime, and CDN assets.
- **GitHub Pages:** host-selecting loader and Parcel bundle delivery.
- **Beacon SDK:** **REPOSITORY** `shared/beacon-setup.js` initializes/reuses `DAppClient`, validates network/account state, manages connect/disconnect, fetches NFTs, and publishes shared wallet state.
- **TzKT / chain RPC and contract runtime:** **REPOSITORY** page modules own public NFT/chain reads and transaction pipelines. Exact endpoint/address inventory is outside this Webflow architecture pass.
- **Google Fonts/WebFont:** globally loaded by current rendered entrypoints.
- **Outbound site links:** Objkt, OpenSea, Rarible, Foundation, Mallow, Exchange.art, X, Instagram, and Discord. These are links, not embedded SDK integrations.
- **Analytics/tracking:** none observed in `googleTagIds`, site freeform code, page freeform code, registered scripts, or page element embeds.

## Unexplained or Bridge-dependent code

- **UNRESOLVED:** why Collection Utility loads the Home runtime despite having no local route or dedicated feature module.
- **UNRESOLVED:** why the Nav Button - FLOW and Nav Button - UTILITY definitions both contain DROPS text; these definitions have zero instances.
- **UNRESOLVED:** current Webflow interaction definitions; the remote element read does not return interaction configuration.
- **UNRESOLVED:** exact current breakpoint-specific and pseudo-state declarations; the style API returned metadata only and the read-only Designer breakpoint request could not connect.
- **UNRESOLVED:** exact saved-versus-published custom-code correspondence. Webflow reports `lastUpdated` after `lastPublished`, while local HTML timestamps align with the publish instant.
- **UNRESOLVED:** applied site/page script endpoints returned “custom code block not found”; no registered scripts exist, and all useful code was available through the separate freeform-code reads.
- **UNRESOLVED:** ownership of Webflow CDN site path `656d1d76a2cda12f26e04688` used by rendered CMS NFT images.

No Designer session was opened and no Webflow mutation or publishing action was invoked.
