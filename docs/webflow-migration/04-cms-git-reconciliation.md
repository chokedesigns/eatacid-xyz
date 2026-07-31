# WF-MIG.4 Webflow CMS and Git Reconciliation

## Audit scope and safety

This AUDIT / FIX PASS reconciles EATACID.xyz Webflow site `656cf42faa2b1a7a1582d9d2` against the current checked-out branch and the committed WF-MIG.1-WF-MIG.3 evidence. The connected authorization exposed exactly one site: display name `EATACID.xyz`, short name `staging-eatacid-xyz`, and ID `656cf42faa2b1a7a1582d9d2`. The four current collection identities, all 36 current field definitions, and all 66 current items were read successfully. No Webflow mutation or publishing operation was invoked.

Repository evidence was taken from the current outer repository only. The three preceding audit commits are `ad0f09d` (WF-MIG.1), `fbba828` (WF-MIG.2), and `b13214c` (WF-MIG.3). Public runtime/config, all five title maps, the thumbnail manifest and local token thumbnails, both checked-in HTML snapshots, shared chain/mirror configuration, and active drop parameters were inspected. No source, config, generated HTML, prior audit artifact, dependency, or asset was changed.

Evidence categories used here are `WEBFLOW_CMS`, `GIT_STRUCTURED`, `GIT_CONFIG`, `GIT_GENERATED_HTML`, `RUNTIME_DERIVED`, `CHAIN_DERIVED`, `STATIC_ASSET`, `EXTERNAL_URL`, `NOT_FOUND`, and `UNRESOLVED`. The original WF-MIG.4 run encountered OAuth `invalid_grant`; this fix pass reauthenticated successfully and completed four read-only `list_collection_items` calls. Each collection fit in one page at limit 100/offset 0, and every returned count equaled the API total. The normalized current payloads are byte-for-byte equal to the committed WF-MIG.2 snapshot generated `2026-07-31T19:00:57.425Z`.

## Current Webflow item confirmation

Current read-only observations confirm exactly four collections with the expected IDs and names:

| Collection | ID | Current schema fields | WF-MIG.2 items | Live items | Live versus WF-MIG.2 |
| --- | --- | ---: | ---: | ---: | --- |
| THE 419 SCRIPTs | `656f7e02b503790c02f0edff` | 10 | 13 | 13 | 13 `NO CHANGE` |
| CANAANs | `65a1be9dcae2314a8ac50aae` | 8 | 31 | 31 | 31 `NO CHANGE` |
| HENs | `67be12e2583121ead44b79ed` | 9 | 17 | 17 | 17 `NO CHANGE` |
| INTRODUCTIONs | `67be31a0b7084dfce75026fd` | 9 | 5 | 5 | 5 `NO CHANGE` |

The live collection list and live schema values match the committed collection/field inventories. Matching by collection ID plus Token ID produced 66 unique identities; all 66 item IDs corroborate those matches. Current totals are 66 `NO CHANGE`, zero `NEW ITEM`, zero `REMOVED ITEM`, zero `VALUE CHANGED`, zero `STATE CHANGED`, zero `IDENTITY CHANGED`, and zero `UNRESOLVED`. All 66 are non-draft, non-archived, and have a `publishedOn` timestamp. `04-item-reconciliation.json` records every current value, state, timestamp, locale, image file ID/URL/alt value, evidence, and empty changed-field set.

## Reconciliation identity model

The canonical key is:

`normalized collection key | mainnet contract | main token ID`

This is independent of CMS order, DOM position, title, slug, and image filename. SCRIPT, CANAAN, and INTRODUCTIONS currently use identity token IDs between mainnet and Shadownet. HEN uses the explicit Git mapping from sparse main IDs `94684, 103062, 104492, 114368, 125115, 135460, 141634, 147893, 175592, 200717, 209650, 279300, 369693, 397098, 422822, 455835, 526531` to Shadownet IDs `0-16`. All 66 identities have HIGH confidence from collection ID, main contract, token ID, title-map key, HTML hidden token text, and, where required, mirror config.

## Collection-level reconciliation

| Normalized key | CMS display / singular | CMS row label | Mainnet contract | Active Shadownet contract | Public membership |
| --- | --- | --- | --- | --- | --- |
| `THE_419_SCRIPT` | THE 419 SCRIPTs / THE 419 SCRIPT | THE 419 SCRIPT | `KT1EzmMokbtPS9nYJW1n5Darfgwf7HVtcsyq` | `KT1WczRb1giprHqCp3ADRn8JrkGBT6aENJmV` | Exchange pane `419` |
| `CANAAN` | CANAANs / CANAAN | CANAAN | `KT1UqqSTPPFQk6btXKgv2adjj83YD2V5YBt1` | `KT1GCvVdxELA4mPUn4DiBpPAd8ARRtyoEpke` | Drops CANAAN list; Exchange pane `CANAAN` |
| `HEN` | HENs / HEN | HIC ET NUNC | `KT1RJ6PbjHpwc3M5rw5s2Nbmefwbuwbdxton` | `KT1GnVnQvvb7R6h4EhveBmN17ysaTuGRDoWW` | Drops HEN list |
| `INTRODUCTIONS` | INTRODUCTIONs / INTRODUCTIONS | INTRODUCTIONS | `KT1FmqojETK4Ux44oeudyDbQ6zQDYrD5DaP5` | `KT1B53naqjqZiNBHDv2PPHMroL7geiXzxcT1` | Drops INTRO list |

Runtime collection/contract identity is Git-authoritative: Drops list keys and Exchange pane membership resolve configured contracts. Visible CMS Collection text is presentation, although Drops copies HEN/INTRO text into its cart preview.

## Token titles and names

All five title maps were enumerated. The four relevant maps contain exactly 66 entries: SCRIPT 13, CANAAN 31, HEN 17 sparse main IDs, and INTRODUCTIONS 5. The separate `$acid.json` contains one non-CMS token and is outside the 66-item set. Every Webflow Title is an exact byte-for-character match to its title-map value and all checked-in HTML occurrences after decoding HTML entities. This includes `// 01` through `// 13`, `THE HERO'S JOURNEY`, `FEEL Ü`, `FUCK YOU, EAT ACID`, and `COMMS TEST v1.4.2`.

Every Webflow Name equals its Title and local title value. Name is not bound on Drops or Exchange and can be derived from the structured title for current parity. The local title key is always the main token ID, not display number or array position. SCRIPT display labels are one-based while their title-map/CMS token keys are zero-based `0-12`.

## Token IDs and mirror mappings

All 66 Webflow Token IDs match local title keys and hidden `.token-id-number` text across all 97 row occurrences. SCRIPT is `0-12`, CANAAN `0-30`, HEN uses 17 sparse main IDs, and INTRODUCTIONS is `0-4`. The 17 HEN main-to-Shadownet mappings and all five INTRODUCTION identity mappings were enumerated from `shared/chain-registry.js`.

The material conflict is in `admin-ui/src/thumbs.manifest.js`: both the active HEN contract and the mainnet HEN contract are keyed `0-16`. That is correct for current Shadownet mirror lookup but does not directly cover sparse mainnet HEN IDs. The per-item reconciliation records 17 MEDIUM differences. It does not affect the current public Drops DOM, which uses Webflow images and explicit mirror translation.

## Editions and supply

All 66 current Webflow Editions values match checked-in HTML, including both CANAAN occurrences; all 97 rendered rows reconcile. No independent structured edition/supply manifest, mint manifest, burn manifest, token metadata set, or committed chain-supply snapshot was found. Editions is therefore Webflow-authoritative for content and present in Git only as generated HTML/audit evidence.

The repository does not establish whether Editions means original edition count, minted amount, circulating supply, remaining supply, or a presentation cap. Exchange treats it as a positive integer that caps quantity options and drives the `$ACID` formula. No chain API was queried, so circulating-supply equivalence remains unresolved.

## $ACID values

SCRIPT and CANAAN define 44 unique CMS `$ACID Value` fields. All 44 equal `ceil(100 / Editions)`. All 75 rendered quantity-row occurrences also match: 31 Drops CANAAN, 13 Exchange SCRIPT, and 31 Exchange CANAAN. There is no explicit Git `$ACID` table or drop/pair override for these rows.

Visible rows display the CMS/HTML value, while Exchange transaction/cart behavior independently computes `Math.ceil(100 / editionCount) * quantity`. The display and runtime agree for every baseline item. Every existing `$ACID` value is mechanically reproducible from Editions; the field is redundant at value level but remains a current presentation source.

## Images and thumbnails

Every current item has a Webflow image file ID, URL, and null CMS alt value; every HTML occurrence has a `src`, optional `srcset`, and empty rendered alt. Comparison by URL pathname/file identity finds 25 item-level exact URL matches and 41 instances where `uploads-ssl.webflow.com` versus `cdn.prod.website-files.com` is the only difference. No conflicting Webflow asset path/file ID was observed.

The thumbnail manifest and local directories supply one candidate token thumbnail for every active-environment identity: 31 CANAAN JPGs, 13 SCRIPT PNGs, 17 HEN JPGs addressed by mirror index, and 5 INTRODUCTION JPGs. These are structured local candidates, not proven content equivalents: the ticket prohibited downloads, and no pixel/content hash comparison to Webflow media was performed. Checked-in Drops/Exchange still depend on Webflow-hosted image URLs. Exact removal parity therefore requires preserving/downloading the 66 Webflow assets or later proving each local thumbnail is visually sufficient. HEN mainnet thumbnail keying remains a separate conflict.

## Collection labels and contract identity

`HEN`, `HENs`, and `HIC ET NUNC` are respectively an internal/config key, CMS collection name, and legacy visible row label. `INTRODUCTION`, `INTRODUCTIONS`, and `INTRODUCTIONs` are singular/display/internal variants; Git consistently uses `INTRODUCTIONS`, while the CMS collection display name is unusually cased `INTRODUCTIONs`. SCRIPT and CANAAN likewise use plural CMS display names and singular row/config labels.

These are intentional display/internal/legacy differences, not contract conflicts. Runtime-critical identity is the Git key plus list/pane membership. Exact `HIC ET NUNC` and `INTRODUCTIONS` row labels remain presentation/runtime-preview values and must not be normalized away while current cart behavior remains.

## Mint dates

Mint Date exists for 35 items: 13 SCRIPT, 17 HEN, and 5 INTRODUCTIONS. No corresponding Git manifest, metadata date, config date, commit-time export outside the Webflow audit snapshot, or checked-in row value was found. CANAAN has no Mint Date field. The values are date-at-midnight UTC strings, but the repository does not establish whether they mean on-chain mint, creation, or another curated event.

INTRODUCTIONS uses Mint Date for list sorting; all five values are `2021-12-31T00:00:00.000Z`, so the observed `4,3,2,1,0` order depends on an unexposed tie break. The 35 dates must be imported to preserve the CMS semantic values; current visual ordering could alternatively be preserved by an explicit order, but this audit does not choose that architecture.

## OBJKT links

OBJKT Link exists for the same 35 SCRIPT/HEN/INTRODUCTION items and is absent from the CANAAN schema. All 35 stored URLs are mechanically reproducible, but they use three exact route families: 13 SCRIPT links use `/asset/{mainnetContract}/{mainTokenId}`, 17 HEN links use the legacy `/tokens/hicetnunc/{mainTokenId}` form, and 5 INTRODUCTION links use the legacy `/tokens/{mainnetContract}/{mainTokenId}` form. No Drops/Exchange row binds or reads the link. The route family must be preserved as data/derivation input rather than normalized silently. Live marketplace pages were not browsed.

## Slugs and route metadata

All 66 exact item slugs exist only in Webflow/audit exports. Four current CMS template route families exist: `/the-419-script/{item-slug}`, `/canaan/{item-slug}`, `/hen/{item-slug}`, and `/introductions/{item-slug}`. WF-MIG.1 found empty template Bodies, and neither Drops nor Exchange links to an item template route, but preserving existing route compatibility requires exact slugs.

A simple deterministic slugger reproduces 65 values. CANAAN token 3 demonstrates the unsafe edge: Webflow stores `the-heros-journey`, while a simple punctuation separator produces `the-hero-s-journey`. Slugs must be imported exactly unless a later ticket explicitly drops route compatibility.

## Checked-in HTML snapshot status

Deterministic parsing found exactly five lists and 97 rows:

| Page/list | Rows | Token order | Snapshot comparison |
| --- | ---: | --- | --- |
| Drops HEN | 17 | sparse main IDs ascending | all bound values match current Webflow |
| Drops INTRODUCTIONS | 5 | `4,3,2,1,0` | all bound values match current Webflow; equal-date tie unresolved |
| Drops CANAAN | 31 | `0-30` | all bound values match current Webflow |
| Exchange SCRIPT | 13 | `0-12` | all bound values match current Webflow |
| Exchange CANAAN | 31 | `0-30` | all bound values match current Webflow |

There are no missing, extra, or duplicate token rows. Token ID, title, editions, collection label, and applicable `$ACID` values all match current Webflow. Image differences are only same-asset host aliases. Because all current payloads equal WF-MIG.2, `04-html-snapshot-reconciliation.json` certifies all 97 checked-in occurrences as current and records zero newly stale occurrences.

## Current source-of-truth ownership

| Semantic category | Current practical ownership |
| --- | --- |
| Token identity | DUPLICATED, CONSISTENT across Webflow, title keys, hidden HTML, and Git mirror config |
| Collection/contract identity | GIT AUTHORITATIVE through registry plus list/pane membership |
| Title/name | DUPLICATED, CONSISTENT; public rows use generated HTML, admin uses structured maps |
| Editions | WEBFLOW AUTHORITATIVE; generated HTML is a snapshot/runtime input |
| Image | WEBFLOW AUTHORITATIVE for current public output; local candidates are unverified and HEN mainnet keys conflict |
| Mint date | WEBFLOW AUTHORITATIVE |
| OBJKT link | DERIVED AUTHORITATIVE from main contract/token ID, though stored in Webflow |
| `$ACID` | DERIVED AUTHORITATIVE for transaction behavior; Webflow/HTML display is consistent |
| Slug/publication state | WEBFLOW AUTHORITATIVE |
| Ordering | NO CLEAR AUTHORITY across Webflow sort, compiled order, and runtime re-sorting |
| Contract/mirror mapping | GIT AUTHORITATIVE |
| Active drop/exchange eligibility | DERIVED AUTHORITATIVE from Git config/runtime plus chain state |

## Migration-data requirements

All 66 current row presentations can be reconstructed from Git-owned evidence because the complete row values and external image URLs are baked into HTML. They cannot yet be reconstructed entirely from structured Git without dependencies or semantic loss.

- Already structured: exact titles, main token identities, collection keys, mainnet/Shadownet contracts, HEN/INTRO mirror mappings, active drop parameters, and pane/list contract routing.
- Present only in generated HTML as usable Git evidence: all 66 Editions values, four exact visible row labels, current row ordering, and current Webflow image `src/srcset` values.
- Derivable: 66 Names from titles, 44 `$ACID` values from Editions, 35 OBJKT links from route family plus main contract/token identity, and environment token IDs from mirror config.
- Must be imported exactly: 66 route slugs and 35 Mint Dates. Publication timestamps/state are optional for current visible parity but cannot be reproduced exactly without import.
- Asset migration planning: preserve/download all 66 Webflow image assets unless later content comparison proves local thumbnails sufficient; retain exact alt state and any required responsive variants.
- Exact values to preserve: title punctuation/case/Unicode, main and mirror IDs, Editions numbers, `HIC ET NUNC`/other visible labels, route slugs, Webflow image content, and Mint Dates where semantic preservation is required.
- Per-item redundant/presentation fields: Name duplicates Title; `$ACID` duplicates the Editions formula; OBJKT is contract/token-derived; Collection text is per-collection presentation rather than transaction identity.
- Absent from structured Git: Editions, Mint Dates, exact slugs, publication timestamps/state, Webflow media file IDs/URLs, and explicit per-collection public display labels.
- Decision-required conflict: HEN mainnet thumbnail lookup keys `0-16` versus sparse main token IDs.

## Discrepancies and risks

No BLOCKING value conflict or live-versus-WF-MIG.2 difference was observed across the 66 current items. The remaining HIGH risk is dependence on 66 unverified Webflow-hosted image assets. MEDIUM risks are the 17 HEN mainnet thumbnail key conflicts, lack of structured Editions, 35 Webflow-only Mint Dates, and 66 Webflow-only route slugs. LOW is the 41-item legacy/CDN host variation, because asset path identity remains stable. Exact per-item HEN conflicts and source evidence are in `04-item-reconciliation.json`; the consolidated risk register is `04-discrepancies.md`.

The live-refresh totals are four collections, 66 live items, 66 reconciled items, 66 `NO CHANGE`, and zero new, removed, value-changed, state-changed, identity-changed, or unresolved classifications. The preserved Git reconciliation remains 49 items without a recorded Git conflict and 17 with the HEN thumbnail-key difference.

## Unresolved items and limitations

- `list_collection_items` exposes the current payload and `lastPublished` timestamp but not a separate published payload, so saved-versus-published field-value equality is not exposed.
- Chain supply, balances, token metadata, pair state, and mint timestamps were not independently queried.
- Webflow/local image visual equivalence was not pixel-verified and assets were not downloaded.
- INTRODUCTION equal-date sort tie-breaking is not exposed.
- Template-route availability was not live-browsed; route families and empty template Bodies come from committed read-only audits.
- This ticket does not select a replacement architecture, estimate effort, or assert Webflow-removal/implementation readiness.

## Inputs for WF-MIG.5 and WF-MIG.6

WF-MIG.5 can use the five deterministic row lists, exact labels, image URL/asset-ID records, responsive `srcset` evidence, local candidate paths, and the explicit 66-asset verification gap for visual parity work. It should treat host equality as insufficient and compare actual visual content when authorized.

WF-MIG.6 can use the canonical reconciliation keys, contracts/mirrors, exact title coverage, 66 Editions values recoverable from HTML, 44 derived `$ACID` values, 35 route-family-aware OBJKT derivations, 66 exact slugs requiring import, 35 Mint Dates requiring import, publication-state limitation, HEN thumbnail key conflict, and ownership classifications. The target architecture and migration effort remain deliberately deferred.
