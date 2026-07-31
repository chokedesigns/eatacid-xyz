# WF-MIG.4 Reconciliation Discrepancies

## Blocking

None observed.

## High

### Exact public image independence is not established

- collection: THE 419 SCRIPTs, CANAANs, HENs, INTRODUCTIONs
- token ID: all 66 identities
- field: Image
- source values: Webflow/HTML = 66 Webflow media assets with exact `fileId`, URL, `src`, and `srcset`; `STATIC_ASSET` = 66 local token-thumbnail candidates with no content-equivalence proof
- classification: UNRESOLVED
- likely explanation: public pages were generated from Webflow media while admin thumbnails were produced separately
- current behavioral impact: checked-in public pages still load Webflow-hosted images
- migration impact: removing Webflow hosting without preserving assets or verifying local equivalents risks visible image loss/drift
- evidence: `docs/webflow-migration/02-items.json`, `drops/index.html`, `exchange/index.html`, `admin-ui/src/thumbs.manifest.js`, `admin-ui/src/thumbs/**`
- follow-up dependency: authorized asset/content comparison and migration planning; this ticket intentionally did not download files

## Medium

### HEN mainnet thumbnail keys do not use sparse main token IDs

- collection: HENs
- token ID: `94684, 103062, 104492, 114368, 125115, 135460, 141634, 147893, 175592, 200717, 209650, 279300, 369693, 397098, 422822, 455835, 526531`
- field: Image / thumbnail manifest identity
- source values: `GIT_CONFIG` main IDs = the 17 sparse values above; `STATIC_ASSET` mainnet HEN manifest keys = `0-16`
- classification: CONFLICT
- likely explanation: both HEN contract blocks reuse Shadownet mirror/display indices
- current behavioral impact: no active Shadownet public Drops impact; direct mainnet admin lookup by sparse ID can miss and fall back
- migration impact: a replacement must explicitly translate main IDs to thumbnail indices or re-key the mainnet mapping
- evidence: `shared/chain-registry.js` `testnet.mirrors.HEN`; `admin-ui/src/thumbs.manifest.js` blocks for `KT1GnV...` and `KT1RJ6...`; `admin-ui/src/utils/nft.js` direct `THUMBS[contract][tokenId]` lookup; 17 per-item discrepancy records
- follow-up dependency: later data-model decision; no repair is authorized here

### Editions have no structured Git source

- collection: all four collections
- token ID: all 66 identities
- field: Editions
- source values: current `WEBFLOW_CMS` = 66 values; `GIT_GENERATED_HTML` = matching values across 97 rows; `GIT_STRUCTURED` = NOT_FOUND
- classification: GENERATED_HTML_ONLY
- likely explanation: Webflow CMS has historically owned the presentation counts
- current behavioral impact: Exchange uses baked edition text for quantity limits and `$ACID`; Drops displays/copies it
- migration impact: a structured replacement must extract/import all 66 exact values and retain their intended semantic, which is not proven to be circulating supply
- evidence: `docs/webflow-migration/02-items.json`, both checked-in HTML files, `exchange/js/exchange.js`, repository-wide manifest/metadata search
- follow-up dependency: later schema/import ticket; chain semantic validation if required

### Mint Dates exist only in Webflow evidence

- collection: THE 419 SCRIPTs, HENs, INTRODUCTIONs
- token ID: 35 collection/token identities recorded in `04-item-reconciliation.json`
- field: Mint Date
- source values: current `WEBFLOW_CMS` = 35 UTC-midnight date strings; repository source = NOT_FOUND
- classification: WEBFLOW-ONLY
- likely explanation: curated CMS dates were never mirrored to a Git manifest
- current behavioral impact: INTRODUCTION list sorting uses Mint Date; SCRIPT/HEN current rows do not display it
- migration impact: exact dates must be imported to preserve semantic content; INTRO equal-date ordering also needs explicit treatment
- evidence: `docs/webflow-migration/02-items.json`, `docs/webflow-migration/03-collection-lists.json`, repository-wide date/manifest search
- follow-up dependency: data import and, if semantics matter, read-only chain-date validation

### Exact route slugs exist only in Webflow evidence

- collection: all four collections
- token ID: all 66 identities
- field: Slug
- source values: current `WEBFLOW_CMS` = 66 exact slugs; `GIT_STRUCTURED` = NOT_FOUND; naive derivation mismatch example = CANAAN token 3 `the-heros-journey` versus `the-hero-s-journey`
- classification: WEBFLOW-ONLY / ROUTE-COMPATIBILITY REQUIRED
- likely explanation: slugs are Webflow-managed route metadata rather than public runtime data
- current behavioral impact: Drops/Exchange do not use them; four CMS template route families do
- migration impact: exact slugs must be imported unless a later scope explicitly abandons route compatibility
- evidence: `docs/webflow-migration/01-page-inventory.json`, `docs/webflow-migration/02-items.json`, deterministic slug comparison
- follow-up dependency: route-parity decision in a later ticket

## Low

### Legacy and current Webflow image hosts differ

- collection: THE 419 SCRIPTs and CANAANs
- token ID: 41 item identities classified in `04-item-reconciliation.json`
- field: Image URL
- source values: current Webflow uses `https://uploads-ssl.webflow.com/...` for 41 items while HTML uses `https://cdn.prod.website-files.com/...`; URL pathname and asset filename/ID are identical
- classification: SAME WEBFLOW ASSET, DIFFERENT HOST
- likely explanation: Webflow CDN hostname migration/normalization in compiled output
- current behavioral impact: none observed from source identity
- migration impact: compare content/asset identity rather than hostname; do not preserve the legacy hostname as semantic data
- evidence: exact per-item Webflow URL and HTML `src` values in the two JSON reconciliation files
- follow-up dependency: none unless content verification later contradicts path identity

## Informational

### OBJKT routes use current and legacy formats

- collection: THE 419 SCRIPTs, HENs, INTRODUCTIONs
- token ID: 35 identities with an OBJKT Link
- field: OBJKT Link
- source values: SCRIPT = 13 `/asset/{contract}/{token}` routes; HEN = 17 legacy `/tokens/hicetnunc/{token}` routes; INTRODUCTION = 5 legacy `/tokens/{contract}/{token}` routes
- classification: DERIVABLE MATCH / LEGACY BUT VALID FORMAT
- likely explanation: the collections were entered into Webflow across different OBJKT/Hic et Nunc route generations
- current behavioral impact: none on Drops/Exchange because the field is not bound or read
- migration impact: preserve the collection-specific route rule; do not normalize legacy paths without an explicit route/availability decision
- evidence: exact `fieldData.objkt-link` values in `docs/webflow-migration/02-items.json`; main contracts in `shared/chain-registry.js`; 35 per-item comparisons
- follow-up dependency: none for source reconciliation; live route validation was intentionally not performed

## Unresolved

### Saved-versus-published equality

- collection: all four collections
- token ID: all 66 identities
- field: saved/published state
- source values: site `lastUpdated=2026-07-24T21:16:21.758Z`; `lastPublished=2026-07-24T21:16:04.114Z`; all 66 current item reads include a `lastPublished` timestamp, but no separate published payload was returned
- classification: UNRESOLVED
- likely explanation: `list_collection_items` exposes the current item payload and publication timestamp, not separate saved and published field-value payloads
- current behavioral impact: no difference proven
- migration impact: published parity cannot be distinguished from saved Designer state using current evidence
- evidence: current read-only site list/details evidence; four complete `list_collection_items` reads; WF-MIG.3 saved/published limitation
- follow-up dependency: read-only published/staged comparison if a future authorized surface exposes it

### Chain semantics and live balances were not independently queried

- collection: all four collections
- token ID: all 66 identities
- field: Editions semantics, current supply, active eligibility, pair state, mint timestamp
- source values: repository/runtime derivations are documented; independent chain observation = UNRESOLVED
- classification: UNRESOLVED
- likely explanation: repository and Webflow evidence resolved the source reconciliation without requiring external chain calls
- current behavioral impact: no mismatch proven; Editions must not be labeled circulating supply
- migration impact: later functional validation may need read-only chain evidence for supply/eligibility semantics
- evidence: `shared/chain-registry.js`, drop/exchange runtime files, absence of committed supply/mint manifests
- follow-up dependency: later scoped chain validation only if required
