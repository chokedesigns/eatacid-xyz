# EATACID.xyz developer guide

## Purpose and scope

This is the canonical current-state guide to the outer/public runtime. It explains source ownership, repository boundaries, major runtime relationships, and the verification architecture so a contributor can determine what owns a change.

This guide is not a historical ticket log, a day-to-day command runbook, the testnet-to-mainnet cutover procedure, or Admin implementation documentation. Use the [operations guide](operations.md) for supported procedures. Specialist dossiers remain useful evidence, but executable source and configuration are authoritative for current behavior.

## Repository and Git boundaries

```text
eatacid-xyz/       outer Git repository and public runtime
├─ admin-ui/       independent nested Git repository
└─ contracts/      contract-specific implementations and documentation
```

The outer repository and `admin-ui/` have separate Git roots, branches, status, and history. Outer scripts may produce configuration for Admin: the drop-parameter watcher mirrors generated JSON to `admin-ui/src/drop-params.mirror.json`. That is a cross-boundary data flow, not permission to edit Admin implementation as part of an outer ticket. Always inspect both repositories after running a watcher or generator that crosses the boundary.

The outer `shared/chain-registry.js` also defines an Admin-oriented validator, but Admin implementation and its consumption rules remain outside this guide. The `contracts/` subtree owns smart-contract concerns; use its scoped documentation rather than treating public JavaScript as contract authority.

## Public surfaces

| Surface | Tracked local/Webflow-derived shell | Local development entry | Pages/Webflow deployment entry | Principal runtime modules |
| --- | --- | --- | --- | --- |
| Home | `index.html` | Shell modules `shared/public-first-paint.js` and `shared/beacon-setup.js` under Parcel serve | Stable `/home.js` router; full Parcel source `webflow/home.js` | Shared first-paint and wallet lifecycle |
| Drops | `drops/index.html` | `drops/js/main.js` | Stable `/drops.js` router; early/full Parcel sources `webflow/drops-first-paint.js` and `webflow/drops.js` | `drops/js/events.js`, reveal coordination, shared wallet/trade modules, drop parameters |
| Exchange | `exchange/index.html` | `exchange/js/main.js` | Stable `/exchange.js` router; full Parcel source `webflow/exchange.js` plus shared early first paint | `exchange/js/exchange.js`, shared wallet and trade modules |

The tracked shells are snapshots used for local development and generated sanity pages. They retain Webflow DOM, CMS rows, hosted CSS, runtime scripts, assets, and fonts, but they substitute local module entries for the stable GitHub Pages URLs used by the live Webflow pages.

## Source and Parcel entrypoints

The current `build:pages:staging` and `build:pages:prod` scripts define five public Parcel entries:

1. `webflow/first-paint.js`
2. `webflow/drops-first-paint.js`
3. `webflow/home.js`
4. `webflow/drops.js`
5. `webflow/exchange.js`

These roles are distinct:

- `index.html`, `drops/index.html`, and `exchange/index.html` are tracked local shells and are the HTML entries used by `npm run start`.
- `shared/public-first-paint.js`, `shared/beacon-setup.js`, `drops/js/main.js`, and `exchange/js/main.js` are local runtime entries referenced by those shells.
- `webflow/*.js` files are authored Pages deployment entries. They assemble the dependency graph Parcel emits for live use.
- `dist/prod/*.js` and `dist/staging/*.js` are generated Parcel artifacts. They are ignored locally and assembled by CI for Pages.

Because Pages builds the two branch refs independently, the exact entry graph deployed under `prod/` is the graph present on `main`, and the graph under `staging/` is the graph present on `staging`. The checked-out source has five entries; the current `main` ref still has the earlier four-entry graph until the Drops early-paint work reaches `main`.

## Stable root-router architecture

`loaders/root/home.js`, `loaders/root/drops.js`, and `loaders/root/exchange.js` back the stable public module URLs `/home.js`, `/drops.js`, and `/exchange.js`. The Pages workflow always takes these router sources from `main`, so one stable layer selects both environments.

Each router reads `window.location.hostname`. The exact production hostname set is `eatacid.xyz` and `www.eatacid.xyz`; those hosts select `./prod`. Every other hostname, including staging and localhost, selects `./staging`. The router then imports the surface-specific `{surface}-loader.js` and isolates loader failures.

Stable routers let Webflow keep permanent module URLs while Git can deploy separate prod and staging loaders and artifacts behind them. They own environment selection only. First-paint sequencing, wallet startup, and page behavior belong below this boundary.

## Environment loaders and artifact ownership

`loaders/environment/` contains one loader per surface. Each loader imports only same-directory artifacts and starts sibling imports without awaiting one before the other:

```text
main
-> main-owned stable root routers
-> /prod/*-loader.js from main
-> /prod/* Parcel artifacts freshly built from main

staging
-> the same main-owned stable root routers
-> /staging/*-loader.js from staging
-> /staging/* Parcel artifacts freshly built from staging
```

Home and Exchange start the shared `first-paint.js` artifact concurrently with their full application artifact. The current Drops loader starts `drops-first-paint.js` concurrently with `drops.js`. Each import has separate synchronous and asynchronous failure handling.

On a push to `main` or `staging`, `.github/workflows/pages.yml` checks out both refs, installs each ref independently, and builds production from `main` and staging from `staging`. It then assembles one Pages artifact: stable routers and prod loaders come from `main`; staging loaders come from `staging`; referenced bundles come from their corresponding builds. It removes source maps and verifies file equality, loader references, required markers, and provenance before upload.

Production is a fresh build from `main`. Tested staging bundle bytes are not copied unchanged into production.

For the current branch workflow and post-deployment checks, see [staging deployment](operations.md#10-staging-deployment), [production promotion](operations.md#11-production-promotion), and [deployment verification](operations.md#13-deployment-verification).

## First-paint and full-application split

The early path is deliberately much smaller than the Beacon- and feature-bearing application path.

`webflow/first-paint.js` imports only `shared/public-first-paint.js`. Home and Exchange environment loaders start that artifact beside `home.js` or `exchange.js`. Their full entries retain a first-paint import as a fallback; a global singleton guard prevents duplicate coordinator startup.

`shared/public-first-paint.js` owns shared reveal behavior. It applies the current testnet presentation, waits within bounded font and Home hero-image readiness windows, and reveals ready or fallback state. A 1,300 ms fail-open timer prevents the surface from remaining hidden indefinitely, and the error path also forces an inline reveal.

Drops uses `webflow/drops-first-paint.js`, which starts the shared coordinator and installs small pending-region CSS. The full Drops runtime independently resolves drop parameters/countdown, redeem metadata/supply, and wallet-derived rows. `drops/js/reveal-coordinator.js` commits the initial parameter/redeem region only after its required independent results are ready and uses a repeatable wallet pending state for account projections. This prevents unresolved Webflow placeholder or CMS content from being presented as authoritative merely because the outer shell can paint early.

Early and full imports are failure-isolated: failure of one does not prevent the other from starting. This preserves a bounded reveal path while keeping wallet, chain, transaction, and page application code out of the small early graph.

For implementation history and evidence, see [early Home first paint](performance/PERF-2.early-home-first-paint.md), [loader isolation](performance/PERF-2B.staging-loader-isolation.md), [Exchange early first paint](performance/PERF-3A.exchange-early-first-paint.md), [Drops early first paint](performance/PERF-3B.drops-early-first-paint.md), and [Drops coordinated reveal](performance/PERF-3C.drops-coordinated-region-reveal.md). These are historical dossiers; this guide is the current architecture summary.

## Shared runtime modules

| Module | Owns | Major consumers | Does not own |
| --- | --- | --- | --- |
| `shared/network.js` | Supported-slot selection, the default `testnet` slot, optional `process.env.NETWORK` selection, and active RPC/TzKT projections | First paint, Beacon, Drops, Exchange | Addresses, per-surface validation, or cutover procedure |
| `shared/chain-registry.js` | Per-slot labels, Beacon/RPC/TzKT values, collection addresses, escrow configuration, pair-map paths, mirror maps, resolution helpers, and validators | `network.js`, Drops/Exchange configs, Admin-facing shared validation | Runtime network switching or proof that a configured slot is cutover-ready |
| `shared/beacon-setup.js` | One shared `DAppClient`, permission/connect/disconnect lifecycle, active-account network validation, public wallet state, wallet controls, and TzKT NFT balance reads | Home, Drops, Exchange | Page-specific filtering, cart state, or transaction construction |
| `shared/public-first-paint.js` | Shared network class/banner state, bounded font/hero readiness, reveal/fallback behavior, and duplicate-start protection | Early entry, with full-entry fallbacks | Drops-specific authoritative-region readiness or application boot |
| `shared/public-trade-ops.js` | TzKT pair lookup, operator-approval construction, expected-operation confirmation polling, and post-trade NFT refresh polling | Drops and Exchange transaction flows | Page-specific cart/payload composition, modal state, or wallet send request |
| `shared/drop-params/drop-params.js` | Authored Drops schedule, display/mechanics, burn eligibility/exclusions, redeem identity, and mirror-network metadata | Drops runtime; JSON generator; Admin projection | Chain endpoints, addresses, live pause state, or live redeem supply |

`shared/drop-time.js` centralizes validation and conversion of configured drop date/time values. `shared/public-logger.js` provides explicitly gated public diagnostics. They are supporting shared concerns rather than configuration authorities.

## Network configuration architecture

The supported public slots are `testnet` and `mainnet`. `shared/network.js` currently sets `DEFAULT_NETWORK` to `testnet`, and both current `main` and `staging` refs share that value. In `shared/chain-registry.js`, the registry slot named `testnet` is labeled Shadownet and owns the native Beacon `shadownet` value plus its RPC, TzKT, collection, escrow, pair-map, range, and mirror configuration. The `mainnet` slot separately holds configured mainnet values.

`shared/network.js` accepts an optional `process.env.NETWORK` value at build/evaluation time and rejects unsupported slot names. There is no browser UI or browser-time network switch. The repository ignores `.env*`, no dotenv loader or required environment variable appears in the runtime/build scripts, and the normal checked-in contract therefore does not require an active `.env` file. An explicitly supplied supported `NETWORK` value is an override, not a general `.env` configuration system.

`shared/chain-registry.js` is the authority for RPC/TzKT/Beacon values, collection identities, mirrors, and escrow configuration. Its validators fail closed at the application surface when required data is missing. Drops resolves a surface-specific escrow with a legacy top-level fallback; Exchange requests strict surface-specific escrow resolution and does not accept that fallback. Page config modules project the active registry data into their runtime shape.

The `mainnet` slot demonstrates configured capability only. Some mainnet-required public values remain empty, and the validators expose that incompleteness. Configured mainnet capability is not mainnet cutover readiness.

## Wallet lifecycle

`shared/beacon-setup.js` initializes or reuses `window.dAppClient` with the Beacon network derived from the active registry slot. It performs a narrowly scoped migration of known legacy Beacon Matrix transport keys when an old stored SDK version proves that cleanup is needed.

The shared lifecycle:

- presents a pending state while it reads the active Beacon account;
- requests permissions through the shared client and deduplicates concurrent connect requests;
- verifies that an active or newly emitted account matches the configured Beacon network;
- clears a stale/wrong-network active account and publishes disconnected state;
- clears the active account on disconnect and dispatches the legacy `walletDisconnected` event;
- publishes `{status, account, nftsPromise}` through `publicWalletStateChanged` and exposes the current state to late consumers;
- reads FA2 balances from the active slot's TzKT endpoint without blocking the connected-address UI.

A wallet lifecycle generation prevents an older startup result from overwriting a newer account event. Drops and Exchange maintain their own address/generation guards so late NFT results cannot commit after wallet authority changes. Page modules consume shared wallet state, then own their own row filtering, balances, selections, carts, and failure presentation.

## Drops architecture

The tracked/live Webflow shell supplies CMS-derived burn/redeem rows and the DOM contract consumed by `drops/js/events.js`. `shared/drop-params/drop-params.js` is the authored authority for whether a drop is scheduled, its date/time and mechanics, enabled burn collections and exclusions, and the redeem token. Its JSON file is a generated projection, not a second authoring source.

`drops/js/events-config.js` combines the active network with registry-owned collections, mirror maps, and resolved Drops escrow configuration. `events.js` stamps CMS rows with contract/token identity, clones configured mirrored rows where required, filters rows against enabled parameters and wallet balances, and updates owned counts. Mirror behavior comes from explicit registry maps; it is not inferred from display order or title.

The runtime independently resolves configured parameter/countdown state, escrow pause state, redeem metadata/image, live redeem supply, and shared wallet state. Pending/reveal coordination keeps those authorities truthful while loading. `AppState` owns mutable selection, cart, countdown/pause/supply, hover, and wallet-dependent state. Only one eligible checkbox/selection is actionable at a time.

For a trade, Drops verifies the active wallet, builds any required operator approvals through `shared/public-trade-ops.js`, looks up the pair ID through TzKT, composes the page-specific `initiate_trade` operation, sends the batch through the shared Beacon client, verifies expected confirmation, polls changed NFT balances, and refreshes the UI. Contract source and deployment concerns remain in the contract subtree.

## Exchange architecture

The Webflow shell supplies two tab panes and serialized CMS rows for THE 419 SCRIPT and CANAAN. `exchange/js/exchange-config.js` projects the active registry collections, redeem-token contract, and strictly resolved Exchange escrow. If required strict configuration is absent, the surface renders unavailable rather than falling back to the legacy top-level escrow.

`exchange/js/exchange.js` maps tab pane identifiers to configured collection contracts, stamps CMS rows with contract/token identity, consumes shared wallet state and NFT balances, and reveals only actionable owned quantities. Each row's select capacity derives from the wallet balance; selected quantities feed the cart and total state. Account-generation guards prevent stale balance results from replacing the current wallet projection.

For exchange execution, the page obtains the verified active account and burn cart, uses `shared/public-trade-ops.js` for operator approvals and pair lookup, groups page-specific `initiate_trade` payloads, submits the batch through the shared Beacon client, verifies confirmation against the configured escrow and entrypoint, polls for balance changes, and refreshes row/cart state.

## Webflow integration boundary

### Webflow owns

For the current live integration, Webflow owns live page HTML and hosting, CMS content serialization, the DOM/class structure consumed by Git JavaScript, the hosted shared stylesheet and page custom CSS, the Webflow runtime (including widgets such as navigation and tabs), and hosted assets/fonts as applicable. Webflow page custom code loads the stable GitHub Pages module URLs.

### Git owns

Git owns the public JavaScript behavior, stable root routers and environment loaders, shared runtime, page application modules, network/registry configuration, drop parameters, transaction-side client logic, build scripts, verification, and GitHub Pages deployment assembly.

`index.html`, `drops/index.html`, and `exchange/index.html` are tracked Webflow-derived development and sanity shells. They are useful representations of the expected DOM contract, but they are not the live Webflow HTML authority. They load hosted Webflow CSS/runtime/assets and local application entries so Parcel can serve the repository runtime against representative markup.

The stylesheet at `docs/webflow-migration/evidence/eatacid-xyz-webflow-reference-snapshot.css` is tracked historical evidence. Ignored files under `drops/css/`, `exchange/css/`, and `assets/site/` are local reference/export material. None is the current live runtime CSS authority.

Follow [refreshing Webflow-derived HTML/reference material](operations.md#16-refreshing-webflow-derived-htmlreference-material) for the supported capture, comparison, and validation procedure.

## Generated versus authored paths

| Path | Classification | Authoritative? | Edit directly? |
| --- | --- | --- | --- |
| `shared/` | Authored shared runtime/configuration, except named generated projections | Yes, by module responsibility | Yes, within ticket scope |
| `drops/js/` | Authored Drops runtime | Yes for Drops behavior | Yes |
| `exchange/js/` | Authored Exchange runtime | Yes for Exchange behavior | Yes |
| `webflow/` | Authored Parcel deployment entry sources | Yes for deployed bundle entry graphs | Yes |
| `loaders/` | Authored stable routers, environment loaders, and loader tests | Yes for deployed routing/loading | Yes |
| `dist/` | Ignored generated Parcel/assembled output | No | No; rebuild |
| `pages-sanity/` | Ignored generated HTML sanity harness | No | No; regenerate |
| `shared/drop-params/drop-params.js` | Authored drop-parameter source | Yes | Yes |
| `shared/drop-params/drop-params.json` | Tracked generated projection | No; source is the JS file | No; run the generator |
| `drops/css/`, `exchange/css/` | Ignored local Webflow exports/reference | No | No as runtime source |
| `assets/site/` | Ignored local Webflow/performance reference assets | No | No as runtime source |
| `docs/webflow-migration/evidence/` | Tracked historical migration evidence | Evidence only, not runtime authority | Only in an evidence-scoped ticket |
| `admin-ui/` | Independent nested Git repository, ignored by the outer repo | Its own repo is authoritative for Admin | Never as an incidental outer edit |
| `ticket.*.diff` | Ignored generated review artifact | No | No; export from Git |
| `ticket.*.stat.txt` | Ignored generated review artifact | No | No; export from Git |

## Directory and change-location map

| Change | Start here | Related ownership to inspect |
| --- | --- | --- |
| Network selection/endpoints/addresses | `shared/network.js`, `shared/chain-registry.js` | Page config validators and all consumers of the changed slot |
| Wallet lifecycle | `shared/beacon-setup.js` | Drops/Exchange public wallet-state consumers |
| Drops behavior | `drops/js/`, `shared/drop-params/` | Registry identity/escrow and Webflow DOM contracts |
| Exchange behavior | `exchange/js/` | Registry identity/strict escrow and Webflow tabs/rows |
| First paint | `webflow/first-paint.js`, `webflow/drops-first-paint.js`, `shared/public-first-paint.js` | Environment loaders and Drops reveal coordination |
| Shared approval/confirmation/NFT refresh | `shared/public-trade-ops.js` | Both page-specific transaction composers |
| Stable deployed routing | `loaders/root/`, `loaders/environment/` | Pages workflow and loader verification |
| Pages deployment | `.github/workflows/pages.yml` | Build scripts, artifact verifier, branch provenance |
| Webflow DOM/class investigation | `docs/webflow-migration/` | Current tracked shells and current runtime consumers |
| Contract implementation/deployment | `contracts/burn-redeem-escrow/` | Registry configuration and page transaction expectations |

## Verification architecture

Validation is layered because no single check proves source logic, emitted dependency graphs, deployment provenance, and live integration at once.

| Layer | What it proves |
| --- | --- |
| Focused deterministic tests | Pure/runtime seams such as shared trade helpers, HEN identity, root routing and sibling-load isolation, Drops reveal barriers, and artifact-verifier fixtures behave as encoded. |
| Clean staging/prod builds | The current Parcel entries resolve and emit for the selected output environment; they do not prove browser behavior or cross-branch Pages provenance. |
| First-paint build verifiers | Source maps and emitted artifacts preserve the intended small early dependency graph, exclude wallet/application dependencies, retain required markers, and remain materially smaller than the full bundle. |
| Direct Pages sanity | Generated Webflow-derived shells can load the built staging application bundles directly, isolating bundle/application problems from router problems. |
| Loader-chain Pages sanity | The same shells can traverse stable router -> staging environment loader -> sibling artifacts locally. |
| CI artifact/provenance verification | The assembled Pages artifact contains main-owned roots/prod loaders, staging-owned staging loaders, matching branch-built referenced artifacts, no retired router shape, and no source maps. |
| Live deployed verification | Real Webflow custom code, hostname selection, hosting, network requests, browser timing, wallet/provider behavior, and the published DOM/CSS integration work together. This cannot be established by static checks alone. |

For operational sequencing, see [primary deterministic tests](operations.md#5-primary-deterministic-tests), [production and staging builds](operations.md#6-production-and-staging-builds), [direct Pages sanity](operations.md#7-direct-pages-sanity), [loader-chain Pages sanity](operations.md#8-loader-chain-pages-sanity), and [deployment verification](operations.md#13-deployment-verification).

## Deep-reference links

- [PERF-2: early Home first paint](performance/PERF-2.early-home-first-paint.md) — implementation history and build-graph evidence; historical measurements and manual follow-up remain dossier context.
- [PERF-2B: staging loader isolation](performance/PERF-2B.staging-loader-isolation.md) — stable-router migration history and the resulting deployment contract.
- [PERF-3A: Exchange early first paint](performance/PERF-3A.exchange-early-first-paint.md) — Exchange split rationale and validation evidence.
- [PERF-3B: Drops early first paint](performance/PERF-3B.drops-early-first-paint.md) and [PERF-3C: coordinated reveal](performance/PERF-3C.drops-coordinated-region-reveal.md) — Drops early-shell and region-readiness history.
- [Webflow migration dossier index](webflow-migration/README.md) — historical migration audit and planned future ownership; it is not current runtime authority where code has since changed.
- [Webflow custom-code inventory](webflow-migration/01-custom-code-inventory.md) — captured Webflow module URLs and integration evidence; some loader/first-paint descriptions predate later performance work.
- [Webflow DOM contracts](webflow-migration/03-dom-contracts.md) and [runtime dependency data](webflow-migration/03-runtime-dependencies.json) — selector and consumer evidence; verify against current code before changing a contract.
- [Webflow CMS image migration](webflow-cms-image-migration.md) — specialist CMS media migration reference.
- [Burn/redeem escrow README](../contracts/burn-redeem-escrow/README.md) — contract-specific build, test, and deployment documentation.
- [Split-escrow notes](../shared/chain-registry.split-escrow-notes.md) — historical registry/escrow migration notes; current `shared/chain-registry.js` is authoritative.

Use the [operations guide](operations.md) for day-to-day outer-repository work. A dedicated testnet-to-mainnet runbook will be added in REPO-2B3; that future file is intentionally not linked.
