# Admin, local assets, and CMS publishing pipeline

## Current local asset path

**CURRENT STATE.** New thumbnail input is supported only for CANAAN and THE 419 SCRIPT; backfill/review covers CANAAN, HEN, INTRODUCTIONS, and THE 419 SCRIPT (`assets/thumbs/scripts/thumbs.mjs:10-15`). Input converts one source image per collection to a 300px-wide JPEG, writes it into `admin-ui/src/thumbs/<collection>/<numeric-key>.jpg`, invokes the Admin manifest generator, then archives the source (`assets/thumbs/scripts/thumbs.mjs:68-106`, `assets/thumbs/scripts/thumbs.mjs:220-301`).

The manifest generator derives contract/folder bindings from the chain registry and writes `admin-ui/src/thumbs.manifest.js` (`admin-ui/scripts/gen-thumbs-manifest.mjs:22-67`, `admin-ui/scripts/gen-thumbs-manifest.mjs:124-181`). Admin title data remains a separate hand-maintained JSON file (`admin-ui/src/titles.manifest.js:1-54`).

**REUSABLE.** Sharp transformation profile, metadata checks, exclusive output writes, collision detection in the outer input tool, transaction rollback around manifest generation, collection folders, and registry-backed manifest generation.

**MIGRATION-SPECIFIC OR INSUFFICIENT.** “Next numeric key” allocation, one-image folder polling, and immediate cross-repo output mutation without an authoring record. A new-item job must use the verified mint result's ID and should plan all writes before applying them.

## Current Admin health path

**CURRENT STATE.** The local health controller enumerates collection tokens from TzKT and resolves each through local title/thumbnail helpers (`admin-ui/src/features/health/health.controller.js:430-583`). CMS health reads manually chosen Webflow CSV exports, stores them in browser local storage, and compares identity/title/thumb/economics (`admin-ui/src/features/health/health.cms.js:1-12`, `admin-ui/src/features/health/health.cms.js:469-528`, `admin-ui/src/features/health/health.cms.js:549-741`).

**REUSABLE.** Collection-label normalization, explicit HEN translation, local-title comparison, missing-CMS detection, thumbnail lookup, and economics comparison.

**LIMITATION.** CSV health cannot prove current staged versus live state, cannot create/update items, and can be stale. A future API adapter should emit the same normalized comparison model from fresh staged/live reads; CSV remains an offline/manual fallback.

## Current Webflow image pilot

**CURRENT STATE.** The one-item pilot is deliberately locked to an existing CANAAN item and path (`assets/webflow-cms-image-pilot/README.md:1-9`). It supports separate dry-run, staged update, verify, reconcile, publish, and rollback commands (`assets/webflow-cms-image-pilot/README.md:11-48`).

Reusable mechanisms:

- least-privilege bearer token from `WEBFLOW_API_TOKEN`, never source control (`assets/webflow-cms-image-pilot/README.md:6-9`);
- recursive secret/presigned-URL redaction (`assets/webflow-cms-image-pilot/cms-image-pilot.mjs:60-111`);
- atomic journal/snapshot writes and durable phases (`assets/webflow-cms-image-pilot/cms-image-pilot.mjs:118-177`);
- bounded API retry behavior and sanitized errors (`assets/webflow-cms-image-pilot/cms-image-pilot.mjs:203-231`);
- staged/live pagination, asset creation, item patch, and per-item publish (`assets/webflow-cms-image-pilot/cms-image-pilot.mjs:233-267`);
- byte upload to the Webflow presigned destination plus read-back verification (`assets/webflow-cms-image-pilot/cms-image-pilot.mjs:579-615`);
- before snapshots, non-target preservation comparisons, exact publish confirmation, and unknown-outcome reconciliation (`assets/webflow-cms-image-pilot/cms-image-pilot.mjs:619-729`, `assets/webflow-cms-image-pilot/cms-image-pilot.mjs:760-953`).

Migration-specific constraints to remove only in a new adapter:

- hard-coded one-item `TARGET`;
- dependence on `CMS-IMG-1.mapping.json` for a pre-existing item;
- image-only PATCH and legacy-image rollback;
- CANAAN-specific unrelated-item comparison;
- nominal route policy tied to one existing slug.

## New-item creation gap

**CURRENT STATE.** No code calls Webflow's collection-item creation endpoint. The pilot can only PATCH a known item ID (`assets/webflow-cms-image-pilot/cms-image-pilot.mjs:260-267`). The existing CMS audit observed action surfaces for existing-item update and publish but did not write-test item creation (`docs/webflow-cms-image-audit/CMS-IMG-1.audit.md:18-36`).

A future creation adapter must add:

- current site/collection/schema/locale preflight;
- collection-specific required-field projection;
- duplicate lookup by collection plus authoritative token ID, never title/order;
- staged item creation and returned item/locale ID capture;
- slug conflict handling without auto-renaming after approval;
- image asset create/upload/read-back;
- staged full-field comparison and unrelated-item preservation checks;
- explicit per-item publish and live re-read;
- non-destructive failure policy for orphan assets/items;
- recovery when request outcome is unknown.

**OPEN QUESTION.** Whether failed staged item creation should be archived, deleted, or deliberately retained for reconciliation is a product/operations decision. The safe default is retain and record; deletion is destructive and separately approved.

## Recommended new-item pipeline

### Phase 1: local preparation

1. Validate canonical record and collection policy.
2. Hash source artwork and render planned mint/CMS projections.
3. After verified mint result, bind the exact contract/token identity.
4. Run the existing image transform under an explicit-token-ID mode.
5. Generate title and thumbnail consumer outputs in a temporary workspace.
6. Compare planned diffs; atomically apply only after local-write approval.
7. Regenerate the Admin manifest and run focused local health for the new identity.

### Phase 2: CMS dry run

1. Resolve expected site and collection from policy.
2. Fetch current collection schema/locales and abort on drift.
3. Search staged and live items for the authoritative token ID.
4. Render exact create payload, including collection-specific optional fields.
5. Validate slug uniqueness and field types.
6. Verify local optimized image bytes, dimensions, MIME, and hash.
7. Persist a redacted plan and before snapshot.

### Phase 3: CMS staged integration

1. Require explicit “create staged item/upload asset” approval.
2. Create the staged item or resume an already-created item by captured ID.
3. Capture item/locale identity immediately.
4. Create/upload/read-back the asset with deterministic naming.
5. Patch/populate the staged item's image and fields if creation/upload requires multiple calls.
6. Re-read staged and live state.
7. Require exact target fields, unchanged live state, and no unrelated changes.
8. Mark `CMS_VERIFIED`; do not publish.

### Phase 4: publication

1. Require a fresh staged/live verification and exact item ID.
2. Require separate publish approval bound to current record/plan hashes.
3. Publish only the captured item ID.
4. Re-read live state and verify fields/image.
5. Treat the public route as an additional signal only if the route is proven authoritative; the pilot currently records route ambiguity (`assets/webflow-cms-image-pilot/README.md:62-70`).
6. Mark CMS integrated only after live verification.

## Collection-specific CMS projections

| Collection | Populate | Do not assume |
|---|---|---|
| CANAAN | title/name, approved slug, editions, image, collection, token ID, derived `acid-value` | No audited mint-date or OBJKT-link field |
| THE 419 SCRIPT | CANAAN-like core plus mint date and OBJKT link | Title ordinal is not token ID; slug may preserve leading zeros |
| HEN | core plus mint date/OBJKT; sparse mainnet token identity | Local 0-16 thumbnail key is not CMS token ID |
| INTRODUCTIONS | core plus mint date/OBJKT | Title/order does not determine token ID or presentation order |

Source: `docs/webflow-cms-image-audit/CMS-IMG-1.audit.md:50-76` and `docs/webflow-migration/02-cms-schema.md:151-215`.

## Idempotency and rollback

- Idempotency key: work ID plus verified collection contract/token ID and planned payload hash.
- Before any retry, search by captured item ID; if missing, search exact collection/token ID and reconcile duplicates.
- Never create a second asset merely because an upload response was lost; search deterministic name and verify bytes first, as the pilot does (`assets/webflow-cms-image-pilot/cms-image-pilot.mjs:592-615`).
- Local writes can restore exact before bytes.
- Staged CMS fields can be restored from complete before snapshots where an item existed.
- A newly created staged item has no exact “before item”; default rollback is to leave it staged and recorded until an explicit archive/delete policy exists.
- Publishing is reversible only by another external write and therefore is not equivalent to local rollback.
- Never auto-delete orphaned Webflow assets; record them for a separate cleanup decision (`docs/webflow-cms-image-audit/CMS-IMG-1.audit.md:155-167`).

## Completion definition

“CMS integrated” requires captured item identity, verified staged fields/image, explicit publication when desired, verified live fields/image, and a final journal entry. A successful HTTP create response alone is not completion. Local integration and CMS integration remain independent statuses so either can be resumed without repeating mint or overwriting the other.
