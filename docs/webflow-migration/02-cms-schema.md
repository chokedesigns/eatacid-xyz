# WF-MIG.2 Webflow CMS Schema

## Audit scope and safety

- Ticket: `WF-MIG.2`; branch: `ticket-WF-MIG-webflow-to-git-feasibility-audit`; profile: `AUDIT / CLOSURE`.
- [WEBFLOW] The authenticated site list returned `EATACID.xyz` with site ID `656cf42faa2b1a7a1582d9d2` and short name `staging-eatacid-xyz`.
- [REPOSITORY] The four WF-MIG.1 inputs exist, are tracked, and last changed in commit `ad0f09d692cdb490ac8386ec3a1a0fb9062fed16`.
- [REPOSITORY] The starting tracked state was clean.
- Webflow reads used: `list_sites`, `get_collection_list`, `get_collection_details`, and `list_collection_items`.
- No Webflow create, update, delete, publish, unpublish, archive, upload, reorder, or other mutation action was invoked. Mutation count: 0. Publishing count: 0.
- Local inspection was limited to the committed WF-MIG.1 artifacts and the six source groups named by this ticket. Local writes are limited to the five WF-MIG.2 deliverables.
- Evidence labels used below: `[WEBFLOW]` is directly observed from Webflow; `[REPOSITORY]` is confirmed in current checked-out files; `[INFERENCE]` is an explicit interpretation; `[UNRESOLVED]` is not exposed or not established.

## Confirmed collection inventory

[WEBFLOW] `get_collection_list` returned exactly four collections. The expected WF-MIG.1 set was confirmed and no additional collection was returned.

| Collection | Collection ID | Slug | Items | Template page ID | Route family | Collection List pages | Reference targets |
| --- | --- | --- | ---: | --- | --- | --- | --- |
| THE 419 SCRIPTs | `656f7e02b503790c02f0edff` | `the-419-script` | 13 | `656f7e03b503790c02f0ee0a` | `/the-419-script/{item-slug}` | The Exchange (65dcf9fcd636fdd5996f46ec) | none |
| CANAANs | `65a1be9dcae2314a8ac50aae` | `canaan` | 31 | `65a1be9ecae2314a8ac50ac1` | `/canaan/{item-slug}` | Drops (67be119ce0fb23251217c7a9); The Exchange (65dcf9fcd636fdd5996f46ec) | none |
| HENs | `67be12e2583121ead44b79ed` | `hen` | 17 | `67be12e2583121ead44b7a2a` | `/hen/{item-slug}` | Drops (67be119ce0fb23251217c7a9) | none |
| INTRODUCTIONs | `67be31a0b7084dfce75026fd` | `introductions` | 5 | `67be31a0b7084dfce7502995` | `/introductions/{item-slug}` | Drops (67be119ce0fb23251217c7a9) | none |

The collection-list page IDs and CMS template mappings are [REPOSITORY] facts carried forward from the authoritative WF-MIG.1 page inventory; they were not re-audited as bindings here.

## Collection-by-collection schema

### THE 419 SCRIPTs

- [WEBFLOW] Collection ID: `656f7e02b503790c02f0edff`; singular name: `THE 419 SCRIPT`; collection slug: `the-419-script`.
- [WEBFLOW] Created `2023-12-05T19:46:10.872Z`; schema last updated `2025-07-10T21:19:51.803Z`; 13 items returned.
- [REPOSITORY] Template route: `/the-419-script/{item-slug}`, from committed WF-MIG.1 page inventory.
- [INFERENCE] The collection is an NFT collection presentation set and each item is an NFT token presentation row.

| Field | API name | Webflow type | Required | Populated | Empty | Distinct | Semantic role | Local equivalent |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| Title | `title` | PlainText | false | 13 | 0 | 13 | CONFIRMED SEMANTIC ROLE: token title | YES |
| Editions | `editions` | Number | false | 13 | 0 | 1 | INFERRED SEMANTIC ROLE: edition count | PARTIAL |
| Image | `image` | Image | false | 13 | 0 | 13 | CONFIRMED SEMANTIC ROLE: token image/thumbnail | YES |
| Collection | `collection` | PlainText | false | 13 | 0 | 1 | CONFIRMED SEMANTIC ROLE: collection identity label | YES |
| Token ID | `token-id` | Number | false | 13 | 0 | 13 | CONFIRMED SEMANTIC ROLE: token ID | YES |
| Mint Date | `mint-date` | DateTime | false | 13 | 0 | 2 | INFERRED SEMANTIC ROLE: mint date | NO |
| OBJKT Link | `objkt-link` | Link | false | 13 | 0 | 13 | CONFIRMED SEMANTIC ROLE: OBJKT marketplace token URL | NO |
| $ACID Value | `acid-value` | Number | false | 13 | 0 | 1 | INFERRED SEMANTIC ROLE: burn/exchange value denominated in $ACID | PARTIAL |
| Name | `name` | PlainText | true | 13 | 0 | 13 | CONFIRMED SEMANTIC ROLE: Webflow item name and token title | YES |
| Slug | `slug` | PlainText | true | 13 | 0 | 13 | CONFIRMED SEMANTIC ROLE: CMS item route slug | NO |

### CANAANs

- [WEBFLOW] Collection ID: `65a1be9dcae2314a8ac50aae`; singular name: `CANAAN`; collection slug: `canaan`.
- [WEBFLOW] Created `2024-01-12T22:35:09.987Z`; schema last updated `2025-07-10T21:19:51.808Z`; 31 items returned.
- [REPOSITORY] Template route: `/canaan/{item-slug}`, from committed WF-MIG.1 page inventory.
- [INFERENCE] The collection is an NFT collection presentation set and each item is an NFT token presentation row.

| Field | API name | Webflow type | Required | Populated | Empty | Distinct | Semantic role | Local equivalent |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| Title | `title` | PlainText | false | 31 | 0 | 31 | CONFIRMED SEMANTIC ROLE: token title | YES |
| Editions | `editions` | Number | false | 31 | 0 | 12 | INFERRED SEMANTIC ROLE: edition count | PARTIAL |
| Image | `image` | Image | false | 31 | 0 | 31 | CONFIRMED SEMANTIC ROLE: token image/thumbnail | YES |
| Collection | `collection` | PlainText | false | 31 | 0 | 1 | CONFIRMED SEMANTIC ROLE: collection identity label | YES |
| Token ID | `token-id` | Number | false | 31 | 0 | 31 | CONFIRMED SEMANTIC ROLE: token ID | YES |
| $ACID Value | `acid-value` | Number | false | 31 | 0 | 11 | INFERRED SEMANTIC ROLE: burn/exchange value denominated in $ACID | PARTIAL |
| Name | `name` | PlainText | true | 31 | 0 | 31 | CONFIRMED SEMANTIC ROLE: Webflow item name and token title | YES |
| Slug | `slug` | PlainText | true | 31 | 0 | 31 | CONFIRMED SEMANTIC ROLE: CMS item route slug | NO |

### HENs

- [WEBFLOW] Collection ID: `67be12e2583121ead44b79ed`; singular name: `HEN`; collection slug: `hen`.
- [WEBFLOW] Created `2025-02-25T18:58:42.493Z`; schema last updated `2025-07-10T21:19:51.805Z`; 17 items returned.
- [REPOSITORY] Template route: `/hen/{item-slug}`, from committed WF-MIG.1 page inventory.
- [INFERENCE] The collection is an NFT collection presentation set and each item is an NFT token presentation row.

| Field | API name | Webflow type | Required | Populated | Empty | Distinct | Semantic role | Local equivalent |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| Title | `title` | PlainText | false | 17 | 0 | 17 | CONFIRMED SEMANTIC ROLE: token title | YES |
| Editions | `editions` | Number | false | 17 | 0 | 13 | INFERRED SEMANTIC ROLE: edition count | PARTIAL |
| Image | `image` | Image | false | 17 | 0 | 17 | CONFIRMED SEMANTIC ROLE: token image/thumbnail | YES |
| Collection | `collection` | PlainText | false | 17 | 0 | 1 | CONFIRMED SEMANTIC ROLE: collection identity label | YES |
| Token ID | `token-id` | Number | false | 17 | 0 | 17 | CONFIRMED SEMANTIC ROLE: token ID | YES |
| Mint Date | `mint-date` | DateTime | false | 17 | 0 | 17 | INFERRED SEMANTIC ROLE: mint date | NO |
| OBJKT Link | `objkt-link` | Link | false | 17 | 0 | 17 | CONFIRMED SEMANTIC ROLE: OBJKT marketplace token URL | NO |
| Name | `name` | PlainText | true | 17 | 0 | 17 | CONFIRMED SEMANTIC ROLE: Webflow item name and token title | YES |
| Slug | `slug` | PlainText | true | 17 | 0 | 17 | CONFIRMED SEMANTIC ROLE: CMS item route slug | NO |

### INTRODUCTIONs

- [WEBFLOW] Collection ID: `67be31a0b7084dfce75026fd`; singular name: `INTRODUCTIONS`; collection slug: `introductions`.
- [WEBFLOW] Created `2025-02-25T21:09:52.210Z`; schema last updated `2025-07-10T21:19:51.810Z`; 5 items returned.
- [REPOSITORY] Template route: `/introductions/{item-slug}`, from committed WF-MIG.1 page inventory.
- [INFERENCE] The collection is an NFT collection presentation set and each item is an NFT token presentation row.

| Field | API name | Webflow type | Required | Populated | Empty | Distinct | Semantic role | Local equivalent |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| Title | `title` | PlainText | false | 5 | 0 | 5 | CONFIRMED SEMANTIC ROLE: token title | YES |
| Editions | `editions` | Number | false | 5 | 0 | 3 | INFERRED SEMANTIC ROLE: edition count | PARTIAL |
| Image | `image` | Image | false | 5 | 0 | 5 | CONFIRMED SEMANTIC ROLE: token image/thumbnail | YES |
| Collection | `collection` | PlainText | false | 5 | 0 | 1 | CONFIRMED SEMANTIC ROLE: collection identity label | YES |
| Token ID | `token-id` | Number | false | 5 | 0 | 5 | CONFIRMED SEMANTIC ROLE: token ID | YES |
| Mint Date | `mint-date` | DateTime | false | 5 | 0 | 1 | INFERRED SEMANTIC ROLE: mint date | NO |
| OBJKT Link | `objkt-link` | Link | false | 5 | 0 | 5 | CONFIRMED SEMANTIC ROLE: OBJKT marketplace token URL | NO |
| Name | `name` | PlainText | true | 5 | 0 | 5 | CONFIRMED SEMANTIC ROLE: Webflow item name and token title | YES |
| Slug | `slug` | PlainText | true | 5 | 0 | 5 | CONFIRMED SEMANTIC ROLE: CMS item route slug | NO |

Across the four collections, Webflow returned 36 field definitions. The only built-in fields present in collection details were `Name` and `Slug`. Item metadata separately returned created, updated, published, draft, archived, and locale values; Webflow did not expose those metadata properties as collection-field records.

No Option, File, RichText, Reference, or MultiReference field was returned. All image fields are Webflow `Image` fields. All link fields are Webflow `Link` fields.

## Field population patterns

- [WEBFLOW] Every one of the 36 collection fields is populated on every item in its collection. Field-level empty/null/missing count is 0 throughout.
- [WEBFLOW] `Name` equals `Title` for all 66 items. Both are unique within each collection.
- [WEBFLOW] Every item slug is systematically derived from its item name. All 66 slugs are unique within their collection.
- [WEBFLOW] Every item has an Image object with `fileId`, `url`, and `alt`; all 66 `alt` values are null. Image dimensions, MIME types, and file sizes were not returned.
- [WEBFLOW] Image URL hosts are mixed: 41 values use `uploads-ssl.webflow.com` and 25 use `cdn.prod.website-files.com`.
- [WEBFLOW] `Collection` is constant inside each collection: `THE 419 SCRIPT`, `CANAAN`, `HIC ET NUNC`, and `INTRODUCTIONS`, respectively.
- [WEBFLOW] `$ACID Value` exists only in THE 419 SCRIPTs and CANAANs. For all 44 affected items, the value equals `ceil(100 / Editions)`.
- [WEBFLOW] Number fields were returned as JSON numbers, DateTime values as ISO 8601 strings, Link values as URL strings, and Image values as objects.
- [WEBFLOW] There are no duplicate token IDs or duplicate slugs within any collection.

| Collection | Items | Draft | Archived | Token ID range | Contiguous | Image URL hosts |
| --- | ---: | ---: | ---: | --- | --- | --- |
| THE 419 SCRIPTs | 13 | 0 | 0 | 0–12 | yes | cdn.prod.website-files.com: 1; uploads-ssl.webflow.com: 12 |
| CANAANs | 31 | 0 | 0 | 0–30 | yes | cdn.prod.website-files.com: 2; uploads-ssl.webflow.com: 29 |
| HENs | 17 | 0 | 0 | 94684–526531 | no | cdn.prod.website-files.com: 17 |
| INTRODUCTIONs | 5 | 0 | 0 | 0–4 | yes | cdn.prod.website-files.com: 5 |

HEN token IDs are sparse external identifiers: `94684, 103062, 104492, 114368, 125115, 135460, 141634, 147893, 175592, 200717, 209650, 279300, 369693, 397098, 422822, 455835, 526531`. The other three collections have contiguous numeric token IDs.

## Item population summary

- [WEBFLOW] Complete export total: 66 items — THE 419 SCRIPTs 13, CANAANs 31, HENs 17, INTRODUCTIONs 5.
- [WEBFLOW] Draft items: 0. Archived items: 0.
- [WEBFLOW] Every item returned the same `cmsLocaleId`, `656d1d76a2cda12f26e04687`; the locale name and primary/secondary status were not returned.
- [WEBFLOW] Each collection was requested with `limit: 100` and `offset: 0`. Returned counts equaled each reported total, so no follow-up page was required.
- [WEBFLOW] All returned item fieldData, state flags, item timestamps, locale IDs, media URLs, file IDs, and alt values are preserved in `02-items.json`.
- No RichText field exists, so no long-body summarization was required.

## Reference and multi-reference relationships

[WEBFLOW] None of the 36 field definitions has type `Reference` or `MultiReference`. Therefore:

- collection reference targets: none;
- item-level reference IDs: none;
- multi-reference ID arrays: none;
- dangling references: none;
- self-references: none.

This is a no-reference result based on all four complete collection schemas and all 66 complete item reads, not an inference from field names.

## Apparent NFT content model

The likely interpretation is confirmed at the presentation-row level.

- [WEBFLOW] Every item has a token ID, token title, edition count, image, collection label, item name, and route slug.
- [WEBFLOW] Three collections also have token-specific OBJKT URLs and mint dates; two collections have a numeric `$ACID Value`.
- [REPOSITORY] `shared/chain-registry.js` identifies matching CANAAN, THE 419 SCRIPT, HEN, and INTRODUCTIONS collection contracts on configured networks.
- [REPOSITORY] Collection-specific title maps and thumbnail mappings contain 31, 13, 17, and 5 entries, matching the Webflow item totals.
- [INFERENCE] Each Webflow collection represents one NFT collection or legacy NFT set, and each CMS item represents one NFT token presentation row.

Observed semantic categories:

| Field category | Role and confidence | Canonical/presentation interpretation |
| --- | --- | --- |
| `Token ID` | CONFIRMED SEMANTIC ROLE — token identifier | [INFERENCE] canonical token identity |
| `Title` / `Name` | CONFIRMED SEMANTIC ROLE — token title | [INFERENCE] canonical content duplicated into a Webflow built-in field |
| `Image` | CONFIRMED SEMANTIC ROLE — token image/thumbnail | [INFERENCE] canonical presentation asset |
| `Editions` | INFERRED SEMANTIC ROLE — edition count | [INFERENCE] token metadata used by presentation and exchange calculations |
| `Mint Date` | INFERRED SEMANTIC ROLE — mint date | [INFERENCE] token metadata |
| `OBJKT Link` | CONFIRMED SEMANTIC ROLE — marketplace token URL | [INFERENCE] external presentation/navigation metadata |
| `Collection` | CONFIRMED SEMANTIC ROLE — collection label | [INFERENCE] presentation-only duplicate of collection identity |
| `$ACID Value` | INFERRED SEMANTIC ROLE — burn/exchange value | [INFERENCE] derived presentation/transaction value |
| `Slug` | CONFIRMED SEMANTIC ROLE — CMS route slug | [INFERENCE] Webflow routing metadata |

Per collection:

- THE 419 SCRIPTs: 13 token rows, token IDs 0–12, all with mint date, OBJKT link, and $ACID value.
- CANAANs: 31 token rows, token IDs 0–30, with $ACID value but without mint-date or OBJKT-link fields.
- HENs: 17 token rows with sparse Hic et Nunc token IDs, mint dates, and `objkt.com/tokens/hicetnunc/{id}` links.
- INTRODUCTIONs: 5 token rows, token IDs 0–4, mint dates, and token-specific OBJKT links.

## High-level Git-owned source overlap

This is a source-presence cross-check only; item-by-item value reconciliation is deferred to WF-MIG.4.

| CMS category | Status | Obvious current local source |
| --- | --- | --- |
| Token title / item name | YES | `admin-ui/src/titles/*.json`; per-collection entry totals exactly match Webflow |
| Token ID | YES | Keys in `admin-ui/src/titles/*.json`; HEN mirror IDs also appear in `shared/chain-registry.js` |
| Image / thumbnail | YES | `admin-ui/src/thumbs.manifest.js` has per-collection thumbnail maps with matching coverage |
| Collection identity / contract | YES | `shared/chain-registry.js` defines matching collection keys and network-specific contracts |
| Active drop collection/token selection | PARTIAL | `shared/drop-params/drop-params.js` names HEN, INTRODUCTIONS, CANAAN and selected token ID 29 only |
| Edition count | PARTIAL | Rendered CMS rows in `drops/index.html` and `exchange/index.html`; no obvious structured canonical source in allowed inputs |
| $ACID value | PARTIAL | Rendered CMS rows in `drops/index.html` and `exchange/index.html`; no obvious structured canonical source in allowed inputs |
| Mint date | NO | No obvious equivalent in the allowed local sources |
| OBJKT link | NO | No obvious equivalent in the allowed local sources |
| CMS item slug / route | NO | No obvious structured per-item equivalent in the allowed local sources |
| Draft/archive/publish timestamps | NO | No obvious equivalent in the allowed local sources |
| SEO fields / descriptive copy | UNRESOLVED | No such CMS fields were returned; template bodies are empty in the saved element-tree reads |

## Collection-specific anomalies

- THE 419 SCRIPTs and CANAANs have `$ACID Value`; HENs and INTRODUCTIONs do not.
- CANAANs lacks `Mint Date` and `OBJKT Link`, which exist in the other three collections.
- `Title` duplicates built-in `Name` on all 66 items. `Collection` is also a repeated plain-text label rather than a reference.
- HENs uses the constant `Collection` value `HIC ET NUNC`, which differs from the CMS display name `HENs` and the registry key `HEN`.
- HEN token IDs are noncontiguous, while THE 419 SCRIPTs, CANAANs, and INTRODUCTIONs are contiguous.
- THE 419 SCRIPT slugs are title ordinals (`01` through `13`), not token IDs (`0` through `12`).
- INTRODUCTION token IDs run 0–4 while titles run `FIVE // FIVE` down to `ONE // FIVE`.
- All 66 Image alt values are null.
- Image URLs mix 41 legacy `uploads-ssl.webflow.com` values and 25 current `cdn.prod.website-files.com` values.
- THE 419 SCRIPT token 12 (`// 13`) was created in 2025 and published in 2026, later than the original 12 rows; its recorded mint date is 2024-03-28 while the original rows use 2023-05-16.
- CANAAN token 29 (`SPLINTERED`) and token 30 (`BD25`) were created and published in 2026; the other CANAAN rows use the legacy image host.
- CANAANs reports singular name `CANAAN`; INTRODUCTIONs reports singular name `INTRODUCTIONS`, which remains plural-looking.
- No duplicate slugs, duplicate token IDs, missing field values, draft items, archived items, inconsistent JSON numeric representations, or dangling references were found.
- No RichText, File, Option, Reference, or MultiReference fields were found.

## Unresolved items and MCP limitations

- [UNRESOLVED] `get_collection_details` did not return field help text, default values, explicit option metadata, or metadata explaining Image behavior; unavailable values are null or empty arrays in `02-fields.json`.
- [UNRESOLVED] Image dimensions, MIME types, byte sizes, and responsive variants were not returned. Assets were not downloaded.
- [UNRESOLVED] The locale ID was returned, but locale display name and primary/secondary status were not.
- [UNRESOLVED] The CMS reads do not state whether the returned schema/item values represent saved Designer state, last-published state, or a merged staged view. Item `lastPublished` timestamps are preserved but do not remove this ambiguity.
- [UNRESOLVED] Collection detail reads do not expose the linked template page; template IDs and route families are repository-confirmed from WF-MIG.1.
- [UNRESOLVED] Created/updated/published/draft/archived item properties are returned as item metadata, not as collection field definitions.
- The four item requests used a page size of 100; totals were 13, 31, 17, and 5. No endpoint-enforced truncation or additional page was encountered.
- No rate limit occurred and no retry was required.
- A read-only Webflow AI helper request for CMS payload documentation failed, but the required Data API reads remained available and complete.
- Item reads exposed every schema field for every item; no field-value gap was observed.
- The four saved CMS template element trees were empty per WF-MIG.1. That limits template interpretation but does not limit the collection schema or item reads.

## Inputs for WF-MIG.3 and WF-MIG.4

- WF-MIG.3 can use the four collection IDs, 36 field IDs/API names, four template page IDs, five Collection List page usages, and the no-reference result without re-enumerating CMS content.
- WF-MIG.4 can reconcile the 66-item export against the matching title maps, thumbnail manifest, chain registry, rendered page rows, and drop parameters.
- Specific reconciliation seams are the duplicated Name/Title values, derived slugs, sparse HEN IDs, HEN/HIC ET NUNC naming, collection-specific missing fields, mixed image hosts, and $ACID-value calculation pattern.
- Binding-to-element mapping, exhaustive selector analysis, item-by-item local reconciliation, final local schema design, migration recommendations, and effort estimates remain deferred.

