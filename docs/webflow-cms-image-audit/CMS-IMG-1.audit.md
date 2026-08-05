# CMS-IMG-1 — Webflow CMS thumbnail replacement feasibility audit

Generated: 2026-08-05T00:08:43.668Z

## Executive verdict

**Bulk classification: FEASIBLE THROUGH OFFICIAL WEBFLOW API SCRIPT, but NOT CURRENTLY SAFE TO AUTOMATE through the connected Webflow tool alone.**

The connected Webflow MCP v2.0.1 can identify the site, list collections, read schemas, enumerate staged and live items, expose every Image value, create asset metadata/presigned upload details, expose an existing-item update action, and expose per-item publish/unpublish actions. However:

1. no connected Webflow function accepts a local file path or local bytes; `data_assets_tool.create_asset` requires `site_id`, `file_name`, and the local file's MD5 `file_hash`, then a separate shell/Node/Python multipart POST must send the local bytes to the returned presigned S3 URL;
2. the connected `data_cms_tool` descriptor exposes `update_collection_items` and `publish_collection_items`, but its action payload schemas are opaque (`Array<unknown>`) and no write-shaped call was made during this read-only ticket;
3. official Webflow API documentation states that staged PATCH updates preserve unspecified `fieldData` keys, but that behavior was not write-tested in this connected environment;
4. all 66 existing CMS Image `fileId` values are absent from the connected site's 28-asset inventory, and direct reads of two representative IDs returned 404, so exact rollback by reusing the old `fileId` is not yet proven.

A one-item pilot ticket should first implement a narrowly scoped official API script (or explicitly approved MCP-plus-presigned-upload workflow), prove partial update behavior, and prove rollback before any batch ticket.

## Connected Webflow capabilities actually observed

| Capability | Connected function | Exact observed/proposed arguments | Result |
|---|---|---|---|
| Identify site | `data_sites_tool.list_sites`, `get_site` | `list_sites:{detail:"full"}`; `get_site:{site_id}` | Confirmed read |
| List collections | `data_cms_tool.get_collection_list` | `{siteId}` | Confirmed read |
| Read schema | `data_cms_tool.get_collection_details` | `{collection_id}` | Confirmed read |
| Read all items | `data_cms_tool.list_collection_items` | `{collection_id,request:{limit:100,offset:0,type:"staged"|"live"}}` | Confirmed read |
| Read Image values | same | returned `fieldData.image={fileId,url,alt}` | Confirmed |
| Distinguish staged/live | same | explicit `request.type` | Confirmed; all 66 matched |
| Read assets | `data_assets_tool.list_assets/get_asset` | `{site_id,limit,offset}`; `{asset_id}` | Confirmed read |
| Upload public URL | `asset_tool.upload_image_by_url` | `{siteId,actions:[{upload_image_by_url:{url,asset_name?,alt_text?}}]}` | Surface exists; public HTTP(S) only; not invoked |
| Prepare local upload | `data_assets_tool.create_asset` | `{site_id,file_name,file_hash,parent_folder?}` | Surface exists; returns `uploadUrl/uploadDetails`; not invoked |
| Send local bytes | no Webflow function | external multipart POST to presigned `uploadUrl`, file field accepts local path/bytes | Required external step; not invoked |
| Update existing items | `data_cms_tool.update_collection_items` | expected `{collection_id,request:{items:[{id,cmsLocaleId,fieldData:{image:{fileId,url,alt}}}]}}` | Action exists; payload schema/behavior not write-confirmed |
| Reread staged item | `list_collection_items` | filter by item ID plus `type:"staged"` | Read mechanism confirmed |
| Publish selected items | `data_cms_tool.publish_collection_items` | official v2 body is `{itemIds:[itemId]}`; connected wrapper payload remains opaque | Action exists; not invoked |
| Reread live item | `list_collection_items` | filter by item ID plus `type:"live"` | Read mechanism confirmed |
| Roll back Image | `update_collection_items`, then `publish_collection_items` | old exact Image object | Mechanism exists; legacy fileId reuse not proven |

No site-specific Webflow agent instructions were configured. `ask_webflow_ai` was attempted once for signatures and failed before any operation; `get_more_tools` confirmed the displayed tool list is complete.

## Confirmed site identity

- Site name: EATACID.xyz
- Site ID: `656cf42faa2b1a7a1582d9d2`
- Short name: `staging-eatacid-xyz`
- Staging domain: `staging-eatacid-xyz.webflow.io`
- Custom domains exposed: none
- Last published: `2026-08-04T17:41:57.841Z`
- Last updated: `2026-08-04T17:42:05.307Z`

## Collection identity and schema

| Collection | Collection ID | Display / singular | Image field | Token ID field | Name / slug | Items |
|---|---|---|---|---|---|---:|
| CANAAN | `65a1be9dcae2314a8ac50aae` | CANAANs / CANAAN | Image / `image` / `d3af580da0c1b7c0f486a0d86ca20ba6` | Token ID / `token-id` / `5568b8d3e695834bf80dcae1552c6d22` | `name` `d85126cb01e22a1e5f2c77fb67db40bb`; `slug` `7a68efae01cf5c6eddc975ef05d37f0e` | 31 |
| THE 419 SCRIPT | `656f7e02b503790c02f0edff` | THE 419 SCRIPTs / THE 419 SCRIPT | Image / `image` / `c826cf5e376ccb8f55bad734d09db1b7` | Token ID / `token-id` / `dbb1beb8648b9795cbaacd06f5f0b84a` | `name` `b92987af82b1a731d4a5dea215565914`; `slug` `756fac1077c08d225f0526b8e231645f` | 13 |
| HEN | `67be12e2583121ead44b79ed` | HENs / HEN | Image / `image` / `b4827b58963f8c3df8304a1a1ef693ef` | Token ID / `token-id` / `24b3148425dbe6d85b7ca8c369fdd733` | `name` `c1abbe442bde4893e91f83066064f762`; `slug` `306d657df6af610a63375e7f44661401` | 17 |
| INTRODUCTIONS | `67be31a0b7084dfce75026fd` | INTRODUCTIONs / INTRODUCTIONS | Image / `image` / `690d58d156dea12fda259b8f30ca547c` | Token ID / `token-id` / `c66bccdef4e9c2b5e76a0fd8f764cb82` | `name` `6798a458e449033c9c3392caee375576`; `slug` `ff89bb9201cc519812a653a0fa0993b4` | 5 |

All collections also have a separate optional Title field. Image and Token ID display/API names are identical across all four collections; only field IDs differ. THE 419 SCRIPT, HEN, and INTRODUCTIONS include date/link fields that CANAAN does not; CANAAN and THE 419 SCRIPT include `acid-value`, while HEN and INTRODUCTIONS do not.

All 66 staged items are non-draft and non-archived. All 66 live item values matched staged values at audit time.

## Mapping result

The complete mapping is in `CMS-IMG-1.mapping.json`.

- 66/66 local JPEGs exist.
- 66/66 mappings are HIGH confidence.
- No duplicate local path, duplicate collection token ID, missing local file, title discrepancy, or ambiguity was found.
- All local images are 300px wide.
- CANAAN, HEN, and INTRODUCTIONS are 300×375.
- THE 419 SCRIPT is 300×386.
- CANAAN maps CMS token IDs 0–30 directly to `thumbs/canaan/<token>.jpg`.
- THE 419 SCRIPT maps token IDs 0–12 directly. Display names `// 01` through `// 13` are intentionally one-based labels; token/basename identity remains zero-based, so no off-by-one mapping exists.
- INTRODUCTIONS maps token IDs 0–4 directly. Reverse-sounding title order (FIVE through ONE) does not control identity.
- HEN uses the explicit `shared/chain-registry.js` `testnet.mirrors.HEN` mapping from sparse mainnet CMS IDs to local/testnet indices 0–16. `titles/hen.json` independently matches the sparse IDs and CMS names. This is deterministic enough for automation if the script imports or snapshots that explicit map instead of guessing from filenames or title order.

HEN mapping:

| CMS mainnet token | Local basename | Name |
|---:|---:|---|
| 94684 | 0 | PAPER CHASER |
| 103062 | 1 | HIGH ON HEN |
| 104492 | 2 | HEN IS LOVE |
| 114368 | 3 | BENT |
| 125115 | 4 | HUNGRY |
| 135460 | 5 | BRAND AWARENESS |
| 141634 | 6 | COPY MACHINE |
| 147893 | 7 | FULL |
| 175592 | 8 | PROPAGANDA |
| 200717 | 9 | LENS SHIFT |
| 209650 | 10 | FUCK YOU, EAT ACID |
| 279300 | 11 | REPEATER |
| 369693 | 12 | WAR PAINT |
| 397098 | 13 | DISORDER |
| 422822 | 14 | AWKWARD |
| 455835 | 15 | PURPLE, NO. 419 |
| 526531 | 16 | COMMS TEST v1.4.2 |

## Current CMS image findings

| Collection | PNG | JPEG | WebP | GIF | Missing/empty | Alt present |
|---|---:|---:|---:|---:|---:|---:|
| CANAAN | 0 | 31 | 0 | 0 | 0 | 0 |
| THE 419 SCRIPT | 13 | 0 | 0 | 0 | 0 | 0 |
| HEN | 0 | 17 | 0 | 0 | 0 | 0 |
| INTRODUCTIONS | 0 | 5 | 0 | 0 | 0 | 0 |
| Total | 13 | 53 | 0 | 0 | 0 | 0 |

Every Image object contains exactly `fileId`, `url`, and `alt`; every `alt` is null. No Image URL or file ID is shared by multiple items. A future update must explicitly send `alt:null` to preserve current alt state; omission was not write-tested.

The connected site asset list contains 28 assets, but none of the 66 CMS Image file IDs. Two representative `get_asset` reads (CANAAN token 1 and token 30) returned 404. The CMS URLs use a different historical asset-site path (`656d1d76a2cda12f26e04688`) than the connected site ID. This does not make the current CMS Image value incomplete, but it makes exact rollback acceptance unproven.

## Recommended future pilot

CANAAN token 1, **I AM BICYCLE**:

- CMS item ID: `65a1bf3dc64d193880da0093`
- slug: `i-am-bicycle`
- local file: `admin-ui/src/thumbs/canaan/1.jpg`
- local size: 43,729 bytes
- dimensions: 300×375
- current image: `{"fileId":"65a1bf3789f7470b14f399b7","url":"https://uploads-ssl.webflow.com/656d1d76a2cda12f26e04688/65a1bf3789f7470b14f399b7_01_I_Am_Bicycle_01.jpg","alt":null}`
- non-draft, non-archived, present in staged and live, unique URL/file ID, direct token mapping
- current authoritative drop parameters schedule CANAAN token 29 (SPLINTERED), not token 1; therefore token 1 is not the configured redeem token
- the descriptive title should make manual visual confirmation straightforward, but active-drop status and visual recognition must still be manually reconfirmed immediately before the pilot

## Proposed one-item write sequence

1. Re-list/get site and collection; abort unless IDs match this report.
2. Read staged and live CANAAN item ID `65a1bf3dc64d193880da0093`.
3. Persist the complete before item, exact Image object, CMS locale ID, timestamps, and a canonical hash of all non-image fields.
4. Confirm the old hosted URL is retrievable and cache its bytes as emergency rollback material because the old asset ID is not asset-API-resolvable.
5. Compute MD5 of `admin-ui/src/thumbs/canaan/1.jpg`.
6. Call `data_assets_tool.create_asset` with site ID, a unique `.jpg` filename, and MD5. This does not accept a local path.
7. Multipart POST every returned `uploadDetails` field plus the local file bytes to `uploadUrl`; require HTTP 201. Record new asset ID and hosted URL.
8. Preflight-read the newly created asset.
9. Patch staged state only, one item, with only `fieldData.image={fileId,url,alt:null}`. Use `skipInvalidFiles=false`.
10. Reread staged state and compare every field. Require same item ID, locale, name, slug, token ID, title, flags, and every non-image value.
11. If any non-image difference appears, stop and roll back before publishing.
12. Publish only `itemIds:["65a1bf3dc64d193880da0093"]` after explicit approval.
13. Reread live item and compare with verified staged state.
14. Verify `https://staging-eatacid-xyz.webflow.io/canaan/i-am-bicycle` and the expected image response/render.
15. Retain before item, old Image object, old URL bytes/hash, new asset details, comparisons, and timestamps.

## Rollback

1. Patch the staged item with the exact saved previous Image object and no other field.
2. Reread staged and compare every field.
3. Publish only the one item.
4. Reread live and verify the public route.
5. If Webflow rejects the legacy old `fileId`, stop; do not publish further changes. Upload the cached old bytes as a new asset only with explicit approval, patch to that new asset, and record that this is visual/content rollback rather than restoration of the exact historical Image object.
6. Leave any orphaned replacement asset in place during incident handling; deletion is a separate destructive cleanup ticket.

## Failure responses

- Upload succeeds, patch fails: leave asset orphaned, record it, make no CMS change, retry only after cause is known.
- Patch succeeds, reread differs or extra fields change: immediately attempt exact Image rollback; do not publish.
- Staged differs from live before pilot: abort and reconcile; never overwrite unknown staged work.
- Publish fails: preserve verified staged state and before snapshot; retry only after connection/rate-limit diagnosis or roll back staged.
- Mapping ambiguity, duplicate token/local key, missing file: stop that item; no inferred fallback.
- Rollback value incomplete or legacy file ID rejected: stop; use cached old bytes only under explicitly approved visual rollback.
- Partial batch execution: process one item at a time with a durable journal and resume only after reconciliation.
- 429: honor Retry-After with bounded backoff; never submit an overlapping retry.
- OAuth/connection expiration: stop without switching credentials; reauthenticate and reread state before resuming.
- Orphaned asset: record; never auto-delete.
- Connection loss after write: treat outcome as unknown and reread staged/live before any retry.

## Bulk recommendation and ticket sequence

Use one item at a time for the pilot. If successful, use small sequential batches (recommended 5 items) with a durable per-item journal, but still patch and verify each item individually. Stage a whole small batch, reconcile it, then publish per item or per small batch of explicit item IDs. Do not update all 66 in one request and do not use full-site publishing.

Recommended follow-up tickets:

1. one-item pilot script and dry-run/journal implementation;
2. approved CANAAN token-1 pilot with explicit rollback test;
3. pilot closure/reconciliation, including orphaned asset handling;
4. small-batch CANAAN rollout;
5. remaining direct-map collections;
6. HEN rollout using the explicit mirror table;
7. final 66-item reconciliation and asset cleanup decision.

## Official fallback requirements

Use a Webflow site token or OAuth access token in `Authorization: Bearer <token>` with least-privilege scopes `cms:read`, `cms:write`, `assets:read`, and `assets:write`; add `sites:read` only if site discovery is required. Per-item CMS publishing uses `cms:write`; full-site publishing would additionally require `sites:write` and is not recommended.

Official references:

- https://developers.webflow.com/data/reference/assets/assets/create
- https://developers.webflow.com/data/reference/cms/collection-items/staged-items/update-items
- https://developers.webflow.com/data/v2.0.0/reference/cms/collection-items/staged-items/publish-item
- https://developers.webflow.com/data/reference/field-types-item-values
- https://developers.webflow.com/data/reference/scopes
