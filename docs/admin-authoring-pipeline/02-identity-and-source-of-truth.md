# Identity and source of truth

## Identity invariant

A work has one canonical identity.

Before minting, a stable local `workId` identifies the draft. After mint verification, the work also has one canonical minted identity: collection plus canonical network/contract/token ID. Downstream token references are derived from or verified against that result; they are not independently retyped.

For the current collections, canonical CMS identity uses the mainnet/canonical token ID. Environment-specific token IDs exist only to query or render a configured environment.

### HEN example

```text
canonical HEN identity
  mainnet contract + sparse mainnet token ID (for example 94684)
        |
        +-- mainnet lookup -> 94684
        |
        +-- Shadownet lookup adapter from shared/chain-registry.js -> 0
```

The Shadownet ID is not a second work identity and must not replace the canonical token ID in the work record or CMS. `admin-ui/src/utils/hen-ids.js` is the current consumer translation implementation.

Title, slug, filename, array position, DOM order, and display ordinal are forbidden identity substitutes. THE 419 SCRIPT title `// 13`, for example, belongs to token ID `12`.

## Authority hierarchy

There is no authority that legitimately owns every kind of fact. The future work record coordinates authorities; it does not erase their boundaries.

| Domain | Current authority | Projection/consumer | Future relationship |
|---|---|---|---|
| Network labels, endpoints, collection contracts, environment mirrors | `shared/chain-registry.js` | public/Admin network and collection readers | Record stores a collection/network key and derives registry facts |
| HEN consumer translation | Registry mirror data | `admin-ui/src/utils/hen-ids.js` | Reuse/test the adapter; never store mirror ID as canonical identity |
| Minted token existence and operation result | Tezos chain; observed through configured RPC/TzKT | Admin readers and future verifier | Capture a verified result; refresh runtime facts from chain |
| Operator-authored title, source artwork reference/hash, edition intent, collection metadata | Currently split/manual | title files, external mint UI, CMS | Future canonical work record becomes authority |
| Admin title presentation | `admin-ui/src/titles/*.json` | `admin-ui/src/titles.manifest.js`, `admin-ui/src/utils/nft.js` | Generated projection from the record for new works |
| Admin thumbnail content | masters in `admin-ui/src/thumbs/` | generated `admin-ui/src/thumbs.manifest.js` | Deterministic projection from approved source and verified identity |
| Thumbnail transformation contract | `assets/thumbs/scripts/thumbs.mjs` | input/backfill workflows | Reuse conversion; add explicit-ID authoring mode later |
| Webflow API behavior and reusable verification | `assets/webflow-cms/webflow-cms.mjs` | future application adapter | Compose primitives; the library is not content authority |
| Current CMS item/asset/staged/live state | Webflow at read time | public Webflow pages and future verifier | Capture returned IDs; verify external state against intended content |
| Checked-in CMS schema snapshot | `docs/webflow-migration/02-cms-schema.md` | architecture evidence | Historical starting point only; preflight remote schema before writes |
| Active drop intent | `shared/drop-params/drop-params.js` | public/Admin Drops | Optional CANAAN handoff proposes a change; record does not own active drop |
| Drop JSON copies | Generated from the JS authority | `shared/drop-params/drop-params.json`, `admin-ui/src/drop-params.mirror.json` | Generated projections; never hand-edit |
| Pause, pairs, balances, remaining supply, live operations | Tezos chain/TzKT at read time | public/Admin Drops | Runtime external truth; never stored as authored fact |
| Work lifecycle and captured integration results | Not implemented | none | Future canonical record plus separate operation journal/evidence |

## Stored, derived, generated, and observed

Use these terms consistently:

- **Stored canonical fact:** entered once because it cannot be derived safely, such as exact title or source artwork hash.
- **Captured result:** returned by and verified against an external authority, such as minted token ID or Webflow item ID.
- **Derived value:** computed from canonical facts and authoritative policy, such as the current `$ACID` formula where applicable.
- **Generated projection:** a consumer-specific file or payload, such as a title-map entry, thumbnail, manifest, or CMS field payload.
- **Observed runtime truth:** mutable external state read when needed, such as publication state, token balance, pause state, or operation status.

Generated files and captured external IDs are not replacements for intended content. Runtime observations are not copied into the canonical record as if they were durable authored facts.

## Current duplication to eliminate

The following are currently re-entered or inferred across systems:

- collection/token identity across chain, titles, filenames, CMS, and drop params;
- title across local JSON and Webflow fields;
- editions across external mint context, CMS, and economic derivation;
- artwork across source files, thumbnail input, minted metadata, and CMS image;
- slug and marketplace URL in CMS;
- optional CANAAN selection in drop params.

V2 makes the record authoritative for author-entered facts, captures minted/CMS identities once, and generates or verifies the downstream forms. It does not make Webflow, the chain registry, or chain state subordinate to a local copy.

## Image authority

The approved local intended bytes are authoritative for image verification. Webflow may normalize JPEG encoding, extension, URL, and Image `fileId` after an asset is submitted. Consequently:

- exact uploaded asset bytes can verify the asset-library upload;
- resulting CMS Image correctness is verified by retrieving the CMS URL and comparing decoded content, format, and dimensions to local intent;
- submitted asset ID, returned CMS `fileId`, filename, or URL alone is neither necessary nor sufficient proof.

See [Webflow CMS adapter](05-webflow-cms-adapter.md).

## Publication authority

Webflow staged and live reads are the external evidence. Content equality is one check, not the whole result. Clean publication also requires non-draft/non-archived flags, valid publication markers, and timestamps showing every staged/live update is covered by publication.

## Authority rules for implementation

1. Resolve exact paths and producers/consumers before changing a contract.
2. Never infer canonical identity from presentation.
3. Never write a generated projection by hand when its supported generator is authoritative.
4. Re-read external state after writes; a successful response is not final verification.
5. When a write outcome is uncertain, reconcile the external authority before retrying.
6. Keep active drop intent and work authoring separate.
7. Do not define the future record’s storage path or final schema until its implementation ticket resolves the open questions in [Current project state](13-current-project-state.md).
