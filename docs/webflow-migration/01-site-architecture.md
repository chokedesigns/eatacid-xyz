# WF-MIG.1 Webflow Site Architecture

## Audit scope and safety

This is the WF-MIG.1 read-only architecture inventory for Webflow site `656cf42faa2b1a7a1582d9d2`. It inventories pages, routes, ownership boundaries, components, style-system scale, variables, custom code, CMS presence, forms, redirects, assets, fonts, and external dependencies. It does not audit CMS fields/items, reconcile token content, estimate effort, propose a target architecture, or recommend cleanup.

Evidence labels used below:

- **WEBFLOW** — directly observed through a read action against the confirmed site ID.
- **REPOSITORY** — confirmed from the current checked-out outer repository.
- **INFERENCE** — a relationship derived from named evidence and explicitly identified as such.
- **UNRESOLVED** — unavailable through the current read surface or deliberately deferred.

Starting repository state was confirmed on branch `ticket-WF-MIG-webflow-to-git-feasibility-audit`; `git status --short` was empty. The outer repository alone is in scope. No Webflow create, update, delete, upload, reorder, archive, publish, or other mutation action was invoked. No build, dev server, generator, ticket-diff export, or commit was run.

Relevant Webflow read surfaces available and used were:

- Sites: list/get identity, domain, and publish timestamps.
- Pages and sitemap: list pages, page metadata, and supported static-page sitemap status.
- Elements/settings: full page/component trees, targeted Collection List queries, and raw Collection List settings.
- Components: definitions, instance counts, props, variants, and scoped component trees.
- Styles/variables: style metadata and type counts; variable collections and values.
- Scripts: site/page freeform code, registered scripts, and site/page applied-script lookups.
- CMS: collection list plus one-item pagination requests used only to obtain total counts.
- Forms, assets/folders, custom fonts, and Enterprise redirects.
- Designer: one read-only breakpoint request; it did not connect because no Designer Bridge session was running.

The current remote Data API did not expose exact breakpoint definitions, complete style declarations, Webflow interaction definitions, parent-folder IDs, or a saved-versus-live selector for element/style trees. Redirect listing was unavailable because the site is not on Enterprise hosting. These gaps remain unresolved; the Designer was not opened.

## Confirmed site identity

| Fact | Value | Evidence |
| --- | --- | --- |
| Site name | `EATACID.xyz` | **WEBFLOW** `list_sites`, `get_site` |
| Site ID | `656cf42faa2b1a7a1582d9d2` | **WEBFLOW** exact match before detailed inspection |
| Webflow short name | `staging-eatacid-xyz` | **WEBFLOW** `get_site` |
| Staging domain | `staging-eatacid-xyz.webflow.io` | **WEBFLOW** short name; **REPOSITORY** all three local entrypoints use this `data-wf-domain` |
| Workspace ID | `656cf141aa2b1a7a15811e54` | **WEBFLOW** `get_site` |
| Custom domains | none returned | **WEBFLOW** `customDomains: []` |
| Site created | `2023-12-03T21:33:35.799Z` | **WEBFLOW** `get_site` |
| Last published / compiled | `2026-07-24T21:16:04.114Z` | **WEBFLOW** `get_site` |
| Last updated | `2026-07-24T21:16:21.758Z` | **WEBFLOW** `get_site` |
| Google tag IDs | none returned | **WEBFLOW** `googleTagIds: []` |

The authenticated account returned exactly this one site. Site-specific agent-instruction discovery returned no instructions.

## Executive architecture summary

- **WEBFLOW:** Eight pages are exposed: four root-level static pages and four CMS template pages. All are non-draft, non-archived, non-branch pages with a `publishedPath`.
- **WEBFLOW:** The four static pages are Home, Collection Utility, Drops, and The Exchange. All four are application shells because they combine Webflow-owned page structure with GitHub Pages modules and repository-controlled wallet/first-paint or application behavior.
- **WEBFLOW:** Four collections drive four CMS route families and five Collection Lists on major static pages. The four template Bodies are currently empty in the saved element-tree read.
- **WEBFLOW:** The reusable component layer has six definitions. Nav Bar and its nested Brand Logo have four instances each; the other four definitions have zero instances. No component has props or slots; each exposes only its Base variant.
- **WEBFLOW:** The style catalog has 498 styles: 464 global classes, 33 combo classes, and one tag style (`body`). All 498 report `isFromLibrary: false`. The variable surface has one collection, one base mode, and two Color variables (`White`, `Black`).
- **WEBFLOW:** Page freeform custom code is present on the four static pages and absent on all templates. Site freeform code is empty, registered scripts total zero, and applied-script endpoints return “custom code block not found.”
- **REPOSITORY:** GitHub Pages root loaders dispatch to production or staging Parcel bundles. Those bundles own first-paint, Beacon wallet lifecycle, chain reads, state, and transaction pipelines while consuming Webflow classes, CMS rows, controls, and text/image nodes.
- **WEBFLOW:** Five forms are present, but their controls are quantity selects or burn-token checkboxes inside CMS rows rather than email-capture surfaces. Twenty-eight assets are all in the asset-library root; no asset folders and no uploaded custom fonts were returned.

## Page and route topology

The Pages API did not return parent IDs or folder objects. Every reported `publishedPath` is root-level, and no folder page was enumerated. `parentId` is therefore `null` in the JSON inventory, not an invented root identifier.

```text
staging-eatacid-xyz.webflow.io
/
├── collection-utility                 STATIC / APPLICATION SHELL
├── drops                              STATIC / APPLICATION SHELL
├── exchange                           STATIC / APPLICATION SHELL
├── introductions/{item-slug}          CMS TEMPLATE FAMILY (inferred suffix)
├── hen/{item-slug}                    CMS TEMPLATE FAMILY (inferred suffix)
├── canaan/{item-slug}                 CMS TEMPLATE FAMILY (inferred suffix)
└── the-419-script/{item-slug}         CMS TEMPLATE FAMILY (inferred suffix)
```

For CMS templates, **WEBFLOW** reports the base `publishedPath` and linked collection; `{item-slug}` is an **INFERENCE** representing normal Webflow collection-item routing. Item slugs were intentionally not enumerated.

Local entrypoint alignment:

| Webflow route | Page ID | Current local entrypoint | Result |
| --- | --- | --- | --- |
| `/` | `656cf42faa2b1a7a1582d9db` | `index.html` | **REPOSITORY:** exact site/page/domain IDs match |
| `/drops` | `67be119ce0fb23251217c7a9` | `drops/index.html` | **REPOSITORY:** exact site/page/domain IDs match |
| `/exchange` | `65dcf9fcd636fdd5996f46ec` | `exchange/index.html` | **REPOSITORY:** exact site/page/domain IDs match |
| `/collection-utility` | `6978f5a970f1cfe7b14f7b09` | none | **REPOSITORY:** no `collection-utility/index.html` |

No local entrypoints exist for the four CMS route families. No Webflow utility/system page was returned. “Collection Utility” is a normal static page, not an API-identified system utility page. Whether Webflow-managed 404/password/search utility surfaces exist outside the Pages API response is **UNRESOLVED**.

## Page classification

| Page | ID | Webflow type | Classification | Draft | Sitemap | Custom code | SEO / meta / OG |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Home | `656cf42faa2b1a7a1582d9db` | static | APPLICATION SHELL | no | included | footer | title yes / description yes / copied OG text yes, image no |
| Collection Utility | `6978f5a970f1cfe7b14f7b09` | static | APPLICATION SHELL | no | included | footer | title yes / description yes / copied OG text yes, image no |
| Drops | `67be119ce0fb23251217c7a9` | static | APPLICATION SHELL | no | included | head + footer | title yes / description yes / copied OG text yes, image no |
| The Exchange | `65dcf9fcd636fdd5996f46ec` | static | APPLICATION SHELL | no | included | footer | title yes / description yes / copied OG text yes, image no |
| INTRODUCTIONs Template | `67be31a0b7084dfce7502995` | CMS template | CMS TEMPLATE | no | unavailable | none | none exposed |
| HENs Template | `67be12e2583121ead44b7a2a` | CMS template | CMS TEMPLATE | no | unavailable | none | none exposed |
| CANAANs Template | `65a1be9ecae2314a8ac50ac1` | CMS template | CMS TEMPLATE | no | unavailable | none | none exposed |
| THE 419 SCRIPTs Template | `656f7e03b503790c02f0ee0a` | CMS template | CMS TEMPLATE | no | unavailable | none | none exposed |

The sitemap endpoint supports the four static pages and reports `includeInSitemap: true` for each. It does not support folder, collection template, or utility page endpoints, so template values are `null` in the JSON inventory.

All page metadata returned `canBranch: true` and `isBranch: false`. The API exposes current `draft: false`, `archived: false`, and `publishedPath`, but those facts do not prove byte-for-byte identity between saved Designer state and the last published deployment.

## Webflow/repository ownership boundaries

| Page/region | Ownership | Evidence |
| --- | --- | --- |
| Shared navigation | SHARED BOUNDARY | **WEBFLOW:** Nav Bar component supplies routes, wallet controls, responsive navbar, and Brand Logo. **REPOSITORY:** `shared/beacon-setup.js` queries `.wallet-pending`, `.wallet-connect`, `.connected-state`, and `.disconnect-hover`, updates their state, validates persisted accounts, and dispatches wallet state. |
| Shared testnet/first paint | SHARED BOUNDARY | **WEBFLOW:** static pages supply `first-paint-*` and testnet elements. **REPOSITORY:** `shared/public-first-paint.js` injects reveal rules and controls network/banner/surface/chrome state. |
| Shared footer and page chrome | WEBFLOW-OWNED | **WEBFLOW:** footer/navigation/link composition is page structure; the footer is repeated page markup rather than a component. Repository code does not own its static copy or layout. |
| Home hero/marquee | SHARED BOUNDARY | **WEBFLOW:** hero image/title, responsive composition, and marquee node. **REPOSITORY:** first-paint waits for `.home-hero-character-image`; page freeform CSS creates the marquee animation; home loader boots shared modules. |
| Collection Utility body | SHARED BOUNDARY / UNRESOLVED | **WEBFLOW:** `home-viewport`, Image 6, marquee, footer, and Nav Bar. **WEBFLOW:** page loads `home.js`. **REPOSITORY:** no dedicated route or feature runtime exists; `webflow/home.js` only imports shared first-paint and Beacon setup. |
| Drops static composition | WEBFLOW-OWNED | **WEBFLOW:** loading modal, drop details, empty/loading states, wallet-token region, cart, buttons, footer, responsive classes, and page custom CSS. |
| Drops CMS rows and controls | SHARED BOUNDARY | **WEBFLOW:** HEN, INTRODUCTION, and CANAAN Collection Lists plus checkbox/select forms. **REPOSITORY:** `drops/js/events.js` reads CMS text/images, stamps token/contract datasets, filters/clones rows, controls selections/cart, and updates presentation nodes. |
| Drops business/runtime pipeline | REPO-RUNTIME-OWNED | **REPOSITORY:** `drops/js/events.js`, its config/drop-params imports, and shared Beacon code own wallet/NFT reads, schedule/state, chain queries, transfer approval, burn/redeem transaction construction, send, status, and refresh behavior. |
| Exchange static composition | WEBFLOW-OWNED | **WEBFLOW:** loading modal, details, tabs, CMS regions, cart, action controls, footer, responsive classes, and page custom CSS. |
| Exchange CMS rows and controls | SHARED BOUNDARY | **WEBFLOW:** THE 419 SCRIPT and CANAAN Collection Lists plus quantity selects. **REPOSITORY:** `exchange/js/exchange.js` attaches contract/token state, filters rows by wallet, manages quantities/cart, and controls tabs/modals/buttons. |
| Exchange business/runtime pipeline | REPO-RUNTIME-OWNED | **REPOSITORY:** Exchange config/runtime and shared Beacon code own wallet/NFT reads, TzKT queries, value calculations, approvals, grouped trade construction, send, status, and refresh behavior. |
| CMS template pages | WEBFLOW-OWNED / UNRESOLVED | **WEBFLOW:** collection-linked route definitions exist, but each template element tree contains only an empty Body and no custom code. There is no observed repository runtime boundary on those templates. |

Repository loader chain:

```text
Webflow page custom code
  -> https://chokedesigns.github.io/eatacid-xyz/{home|drops|exchange}.js
  -> main-owned GitHub Pages root router copied by .github/workflows/pages.yml
  -> ./prod/{surface}-loader.js from main on eatacid.xyz / www.eatacid.xyz
     or ./staging/{surface}-loader.js from staging on other hosts
  -> same-environment application bundle(s)
  -> Parcel entry webflow/{home|drops|exchange}.js
  -> shared and page-specific repository modules
```

This chain is **REPOSITORY**-confirmed by `loaders/root/*.js`, `loaders/environment/*.js`, `package.json`, `.github/workflows/pages.yml`, `webflow/*.js`, `drops/js/main.js`, and `exchange/js/main.js`.

## Components and repeated structures

Six component definitions are directly observed:

| Component | ID | Instances | Purpose / observed state |
| --- | --- | ---: | --- |
| Nav Bar | `33cee78f-b5e2-edea-20f8-24dcd14c85bd` | 4 | Shared navbar, page links, wallet controls, nested Brand Logo; used on all four static pages |
| Brand Logo | `7071118a-87de-def0-e628-185bd2f6b11f` | 4 | Image component nested in Nav Bar; page usage is transitive through the four Nav Bar instances |
| Nav Button - THE EXCHANGE | `c3f54d45-c0a2-e7d1-d095-34c06136b65f` | 0 | Unused THE EXCHANGE Nav Link definition |
| Nav Button - FLOW | `8390f3d4-fc5d-5c84-e933-b11f4154d42a` | 0 | Unused definition whose observed text is DROPS |
| Nav Button - UTILITY | `3b3b8150-bcc4-7c4f-274f-5faf12d28a5c` | 0 | Unused definition whose observed text is also DROPS; intent unresolved |
| Nav Button - Connect Wallet | `07a2c535-7c07-89d5-e374-cae95d916be5` | 0 | Unused CONNECT button definition |

All six report empty props, empty slots, and only the Base variant. No code components or library-origin components were identified by the returned metadata.

Directly observable repeated structures that are not components:

- Footer link/copyright structure on the four static pages.
- Testnet banner on the four static pages.
- Scroll-banner structure on Home, Collection Utility, Drops, and Exchange.
- Loading modal and application-shell chrome on Drops and Exchange.
- Collection-row/form structures repeated by Webflow Collection Lists.

## Style system and variables

**WEBFLOW style metadata:**

- Total styles: **498**.
- Global classes: **464**.
- Combo classes: **33**.
- Tag styles: **1** (`body`).
- Library-origin styles: **0**; all 498 report `isFromLibrary: false`.
- Dominant first-word naming families include `Drop` (62), `Exchange` (43), `Collection` (32), `Text` (27), `Nav` (22), `Burn` (21), `Loading` (19), `Div` (18), `Event` (17), `Header` (16), and `Footer` (15).
- At least 103 names fall into generic/generated-looking families such as `Div Block`, `Text Block`, `Image`, `Container`, `Hero`, `Navbar`, `Tabs`, and `Tab Link`; suffixes such as `Copy`, `Copy2`, and numbered names are present.
- Runtime-state combo families include lower-case selectors such as `wallet-pending`, `connected-state`, `exchange-wallet-tokens-pending`, `drops-wallet-tokens-pending`, `drops-params-pending`, and `first-paint-*` classes.

The style read surface returned identity/type/selector metadata, not property declarations. Exact raw-value usage, per-breakpoint declarations, pseudo states, and variable references cannot be counted from this remote Data API response.

**WEBFLOW variables:**

| Collection | Mode | Variable | Type | CSS name | Value |
| --- | --- | --- | --- | --- | --- |
| Base collection (`collection-8d7bb9d7-6340-55d0-2c70-019e6d952a96`) | Base mode | White | Color | `--white` | `white` |
| Base collection | Base mode | Black | Color | `--black` | `black` |

Only two variables exist against 498 styles. This directly establishes a minimal variable system; the exact proportion of declarations using variables versus raw values is **UNRESOLVED** because declarations were not returned.

**Responsive structure:** the read-only Designer breakpoint request failed because no Designer Bridge session was running. The tracked historical evidence snapshot at `docs/webflow-migration/evidence/eatacid-xyz-webflow-reference-snapshot.css` and the ignored local duplicate at `exchange/css/eatacid-xyz-01-webflow.css` are byte-identical older Webflow exports and contain desktop/base rules plus `max-width: 991px`, `767px`, and `479px` breakpoints (and one `min-width: 768px` rule). That is **REPOSITORY** migration/reference evidence, not confirmation of current saved Designer breakpoints.

**Page CSS:** Home, Collection Utility, and Exchange have footer custom CSS for wallet-button initial visibility and the marquee. Drops has additional head/footer CSS for drop-detail truncation/alignment, action state colors, flame layout, hidden/standby/live states, panels, checkboxes, and the marquee. The three current local HTML entrypoints contain 2, 8, and 2 inline `<style>` blocks respectively and all link the current hosted Webflow stylesheet.

**Tracked evidence relation:** `docs/webflow-migration/evidence/eatacid-xyz-webflow-reference-snapshot.css` is a tracked 73,123-byte historical Webflow export retained for migration, debugging, and reference; `exchange/css/eatacid-xyz-01-webflow.css` is an ignored local byte-identical duplicate. Neither is a runtime dependency or current Webflow CSS authority. Current `index.html`, `drops/index.html`, and `exchange/index.html` instead reference the hosted `staging-eatacid-xyz.webflow.shared.f47fa79a6.css`, which remains authoritative for current browser behavior. The older evidence omits newer observed families such as `first-paint-*` and `home-hero-*`.

## CMS presence summary

Only collection identity, slug, total item count, template association, and major static-page Collection Lists are recorded here.

| Collection | ID | Slug | Items | Template page |
| --- | --- | --- | ---: | --- |
| THE 419 SCRIPTs | `656f7e02b503790c02f0edff` | `the-419-script` | 13 | `656f7e03b503790c02f0ee0a` |
| CANAANs | `65a1be9dcae2314a8ac50aae` | `canaan` | 31 | `65a1be9ecae2314a8ac50ac1` |
| HENs | `67be12e2583121ead44b79ed` | `hen` | 17 | `67be12e2583121ead44b7a2a` |
| INTRODUCTIONs | `67be31a0b7084dfce75026fd` | `introductions` | 5 | `67be31a0b7084dfce7502995` |

Total CMS items reported by pagination totals: **66**. One-item queries were used only to obtain totals; item content and fields were not analyzed.

Major static-page Collection Lists:

| Page | Collection | Query mode | Sort | Limit / pagination |
| --- | --- | --- | --- | --- |
| Drops | HENs | dynamic, no filters | `token-id` ascending | 100 / none |
| Drops | INTRODUCTIONs | dynamic, no filters | `mint-date` ascending | 100 / none |
| Drops | CANAANs | dynamic, no filters | `token-id` ascending | 100 / none |
| The Exchange | THE 419 SCRIPTs | dynamic, no filters | `token-id` ascending | 100 / none |
| The Exchange | CANAANs | dynamic, no filters | `token-id` ascending | 100 / none |

All four CMS template Bodies returned no child elements. CMS field definitions, items, references, complete Collection List bindings, and token/data reconciliation are deferred to WF-MIG.2 and WF-MIG.3.

## Forms, redirects, assets, and fonts

### Forms

Five forms are directly exposed. All are nested in Drops or Exchange Collection List items.

| Form ID | Name | Page | Field | Apparent purpose |
| --- | --- | --- | --- | --- |
| `67f59f3789e7857e4dbcd8bb` | Email Form | Drops | `Field 2` Select | CANAAN redeem quantity control |
| `67be5fe931957629455e774d` | Email Form 2 | Drops | `Checkbox 2` Checkbox | HEN/INTRO burn-token selection control; exact list association inferred from element order |
| `67be543c5d6138a6b7615af6` | Email Form 2 | Drops | `Checkbox` Checkbox | HEN/INTRO burn-token selection control; exact list association inferred from element order |
| `65dcfc712b19e3619fa67440` | Email Form | The Exchange | `Field 2` Select | CANAAN burn quantity control |
| `65dcfc712b19e3619fa6743e` | Email Form | The Exchange | `Field` Select | THE 419 SCRIPT burn quantity control |

All five have GET form settings with empty action/redirect and no email confirmation. **REPOSITORY** runtime code reads the checkbox/select controls and prevents relevant default actions; no hosted submission dependency was identified. A Git-owned parity implementation would still need equivalent form/control DOM and behavior if Webflow-generated markup is absent, while replacement of Webflow submission handling itself is not evidenced by this pass.

### Redirects

The read-only `list_301_redirects` call returned: “This site does not have an Enterprise hosting plan. This action requires an Enterprise site plan.” Redirect count, sources, and destinations are therefore **UNRESOLVED**, not zero.

### Assets

- Asset count: **28**.
- Asset folders: **0**; all 28 assets are in the root.
- Broad types: 7 GIF, 8 PNG, 9 JPEG, and 4 MP4.
- Sitewide patterns include logo, favicon/webclip, hero art, loading/typing/success spinners, flame/arrow UI art, ACID coin art, and background/rules video/banner media.
- Representative named assets include `EA_Logo_01.png`, `Kingping_Hero_Image_01.png`, `EA_Coin_Spin_*`, `Loading_Spinner_Optimized_01.gif`, `flame_thumb_*`, `arrows_*`, `Index_BG_Scroll_01.mp4`, and `Index_Scroll_02.mp4`.
- **REPOSITORY:** rendered CMS rows in `drops/index.html` and `exchange/index.html` contain many NFT `src`/`srcset` references under Webflow CDN site path `656d1d76a2cda12f26e04688`, while shared chrome assets use the audited site path. The ownership of that second CDN site ID is **UNRESOLVED**; this pass does not enumerate or reconcile those images.

### Fonts

The Webflow custom-font API returned **0 uploaded custom fonts**. **REPOSITORY:** current local exported HTML globally loads Google WebFont Loader `1.6.26` and requests `Changa One` (400, 400 italic) plus `Inconsolata` (400, 700). Exact current saved-style usage by selector was not exposed.

## External dependencies

Directly readable external presentation/runtime dependencies are:

- Hosted Webflow stylesheet: `https://cdn.prod.website-files.com/656cf42faa2b1a7a1582d9d2/css/staging-eatacid-xyz.webflow.shared.f47fa79a6.css` (**REPOSITORY**, current local exports).
- Webflow asset CDN under `cdn.prod.website-files.com` (**WEBFLOW** assets; **REPOSITORY** rendered HTML).
- Webflow runtime chunks under `cdn.prod.website-files.com/.../js/` and shared chunk `webflow.schunk.47d6c6fda17ce6cd.js`; Drops/Exchange also load an additional shared chunk (**REPOSITORY**).
- jQuery 3.5.1 from `d3e54v103j8qbb.cloudfront.net` (**REPOSITORY** current local exports).
- Google WebFont Loader 1.6.26 from `ajax.googleapis.com`, with Google Fonts/Gstatic connections for Changa One and Inconsolata (**REPOSITORY**).
- GitHub Pages page loaders:
  - `https://chokedesigns.github.io/eatacid-xyz/home.js` — Home and Collection Utility (**WEBFLOW** freeform code).
  - `https://chokedesigns.github.io/eatacid-xyz/drops.js` — Drops (**WEBFLOW** freeform code).
  - `https://chokedesigns.github.io/eatacid-xyz/exchange.js` — The Exchange (**WEBFLOW** freeform code).
- Repository runtime packages bundled behind those loaders include Beacon SDK and page-specific chain/runtime modules (**REPOSITORY** imports and package build flow).
- External footer destinations include Objkt, OpenSea, Rarible, Foundation, Mallow, Exchange.art, X, Instagram, and Discord (**WEBFLOW** element tree / **REPOSITORY** exported HTML). These are outbound links, not embedded code integrations.

No Google tag IDs, site-level freeform code, registered scripts, custom uploaded fonts, HtmlEmbed/CodeBlock elements, or readable analytics/tracking snippets were found. Webflow's navbar, tabs, Collection Lists, forms, hosted stylesheet, hosted runtime chunks, and Webflow CDN are the major platform-specific presentation dependencies.

## Confirmed discrepancies with the current repository

1. **Route coverage:** Webflow exposes four static routes and four CMS template families. The current root repository has HTML entrypoints only for `/`, `/drops`, and `/exchange`; `/collection-utility` and CMS route-family entrypoints are absent.
2. **Loader invocation:** Webflow freeform code loads GitHub Pages root loaders. The checked-in HTML snapshots do not retain those absolute loader tags: Home directly loads `./shared/public-first-paint.js` and `./shared/beacon-setup.js`, while Drops/Exchange load local `js/main.js`. This is an intentional-looking repository/Webflow boundary, but intent is not asserted.
3. **Published snapshot timing:** all three local HTML files declare `Last Published: Fri Jul 24 2026 21:16:03 GMT+0000`; Webflow reports last publish/compile at `2026-07-24T21:16:04.114Z`. Site `lastUpdated` is 17.644 seconds after `lastPublished`, so current saved state may contain changes not represented in the published/local snapshot.
4. **Historical CSS evidence:** the tracked evidence snapshot and ignored local Exchange duplicate are identical older exports related to older Webflow structure; current HTML references the authoritative hosted shared stylesheet and contains newer classes absent from that evidence.
5. **Collection Utility runtime seam:** Webflow routes Collection Utility and loads `home.js`, but the repository has no Collection Utility page or dedicated runtime. Its feature-specific behavior remains unresolved.
6. **CMS media origin:** rendered local CMS rows reference NFT images from a Webflow CDN site path different from the audited site ID. The current site's asset library contains 28 shared assets and no asset folders; the second CDN path's ownership is unresolved.

Titles, descriptions, site IDs, page IDs, staging domain, and the three corresponding route names in current local HTML agree with the current Webflow metadata.

## Unresolved items and MCP limitations

- Exact live/published element, style, component, and custom-code state versus saved Designer state. The Data API reads current data but does not provide a live/staged selector for these surfaces.
- Exact current breakpoint definitions. The Designer read could not connect; no Designer was opened or required.
- Per-breakpoint style declarations, pseudo states, raw-value counts, and variable-reference counts; the remote style read returned only metadata.
- Webflow interaction definitions and whether any element carries a configured interaction not visible in the element metadata.
- Parent folder IDs and definitive folder topology; Pages API results exposed paths but no parent/folder fields.
- Webflow system/utility pages outside the eight returned Pages API records.
- Redirect sources/destinations because redirect reads are Enterprise-plan gated.
- Exact font-to-selector mapping for current saved styles.
- Why the unused FLOW and UTILITY component definitions both render DROPS text.
- Collection Utility's missing local route and any feature-specific runtime beyond shared wallet/first-paint behavior.
- Ownership of Webflow CDN site path `656d1d76a2cda12f26e04688` used by rendered CMS NFT images.
- Applied site/page script endpoints returned 404 “custom code block not found”; freeform custom code was readable and is inventoried separately.
- One Exchange Collection List settings request initially hit HTTP 429; a later read-only retry succeeded, so no list-source fact remains unresolved from that limit.

## Inputs for WF-MIG.2 and WF-MIG.3

Deferred CMS inputs established by this pass:

- Collection IDs/slugs and totals: THE 419 SCRIPTs (13), CANAANs (31), HENs (17), INTRODUCTIONs (5).
- Template page IDs and empty saved template Bodies.
- Drops Collection Lists: HENs, INTRODUCTIONs, and CANAANs.
- Exchange Collection Lists: THE 419 SCRIPTs and CANAANs.
- List query shape: dynamic, unfiltered, limit 100, no pagination; sort fields are `token-id` except INTRODUCTIONs (`mint-date`).
- Runtime seam: Drops and Exchange read Webflow CMS-rendered titles, images, edition counts, token IDs, collection names, owned counts, checkboxes/selects, and related row structure.
- Media seam: current rendered HTML references NFT images under Webflow CDN site path `656d1d76a2cda12f26e04688`.

WF-MIG.2/WF-MIG.3 remain responsible for field schemas, item content, references, binding maps, token/catalog reconciliation, and deeper data ownership. No such analysis is included here.
