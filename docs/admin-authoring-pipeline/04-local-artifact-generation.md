# Local artifact generation

This document defines the existing local title/thumbnail contract and how the planned authoring pipeline may reuse it.

## IMPLEMENTED TODAY

### Thumbnail masters and lookup

Canonical Admin thumbnail masters are stored under:

```text
admin-ui/src/thumbs/
```

Collection folders currently include `canaan`, `the_419_script`, `hen`, `introductions`, and `acid_coin`. `admin-ui/scripts/gen-thumbs-manifest.mjs`:

- derives collection-contract bindings from every configured network in `shared/chain-registry.js`;
- maps collection labels to local folders;
- reads the leading numeric segment of each image filename as the lookup token ID;
- emits contract-to-token URL maps in `admin-ui/src/thumbs.manifest.js`;
- reuses one asset constant when mainnet and Shadownet contracts share a folder.

The manifest is generated output. Do not edit it by hand.

If multiple filenames share a numeric prefix, the current generator and non-writing checker reject the duplicate numeric token ID and fail validation.

### Thumbnail conversion contract

`assets/thumbs/scripts/thumbs.mjs` is the reusable implementation. For identical source bytes and toolchain, its canonical conversion produces:

- 300-pixel width with proportional height;
- auto-orientation;
- sRGB color space;
- JPEG quality 84;
- progressive JPEG encoding;
- removed EXIF/ICC/IPTC/XMP and related retained metadata;
- a warning when a source narrower than 300 pixels is enlarged;
- a warning when generated output exceeds the current 150 KiB informational threshold;
- post-generation decoding/format/width/color/metadata validation.

`assets/thumbs/scripts/thumbs.test.mjs` covers deterministic conversion, input constraints, manifest rollback, collision behavior, backfill isolation, master preservation, metadata stripping, and Windows runner behavior.

### Current input workflow

The input workflow supports only:

- CANAAN;
- THE 419 SCRIPT.

For each collection it accepts no more than one pending image, chooses `max(existing numeric key) + 1`, converts it, writes a new master exclusively, runs the Admin manifest generator, and archives the input only after success. If manifest generation or archiving fails, it removes the new output and restores the prior manifest bytes.

This is production-quality transaction handling around a manual input convention. It is not minted-identity integration. “Next numeric key” can diverge from the actual minted token ID and therefore cannot be the new authoring contract.

### Current backfill/review workflow

Backfill/review supports CANAAN, THE 419 SCRIPT, HEN, and INTRODUCTIONS. It audits current masters, skips already compliant files, writes conversion candidates under `assets/thumbs/review/`, reports warnings/errors, and preserves canonical masters. Review candidates do not become canonical automatically.

### Local titles

Admin-local title authority is separate from thumbnails:

```text
admin-ui/src/titles/*.json
admin-ui/src/titles.manifest.js
```

`admin-ui/src/utils/nft.js` uses those titles and the generated thumbnail manifest for normal Admin presentation. HEN title lookup canonicalizes the active-environment token ID before reading the sparse mainnet-keyed title map.

## PLANNED AUTHORING CONTRACT

The future local-artifact operation should consume a validated canonical work record plus a verified minted identity and should:

1. select the collection policy and exact destinations;
2. require the explicit canonical/network lookup token IDs appropriate to that consumer;
3. validate source bytes/hash and transformation profile;
4. generate title and thumbnail candidates in an isolated temporary area;
5. reject any existing-path, duplicate-key, title, or identity collision;
6. render exact outer/nested repository diffs before apply;
7. apply only after explicit local-write approval;
8. regenerate the manifest through the supported generator;
9. verify local title and image resolution through current Admin helpers;
10. restore exact before bytes if the local transaction fails.

The existing input/backfill commands should remain intact until an explicit-ID authoring mode has its own tests. The pipeline should reuse `convertThumbnail`; it should not silently change the established image profile.

## Identity rules by collection

- CANAAN and THE 419 SCRIPT currently use direct numeric IDs for local masters.
- THE 419 SCRIPT display labels are one ahead of token IDs; labels cannot name files.
- HEN titles use canonical sparse IDs, while current Shadownet/local thumbnail lookup uses mapped IDs `0` through `16`. Translation must be explicit.
- INTRODUCTIONS presentation order is not an identity rule.

See [Collection policies](06-collection-policies.md) for the complete policy table.

## Protected/generated boundaries

- `admin-ui/src/thumbs.manifest.js` is generated. Normal Admin build/dev commands run the non-writing `npm run check:thumbs` freshness validation and fail if the tracked manifest is stale; intentional regeneration uses `npm run gen:thumbs` directly or the outer thumbnail-authoring pipeline.
- `admin-ui/src/drop-params.mirror.json` is unrelated generated output that may also be touched by Admin build/dev commands.
- A documentation or read-only task must not run those generators merely for convenience.
- An implementation ticket that intentionally generates artifacts must verify both Git repositories independently and preserve pre-existing user state.

## Anti-goals

- Do not treat `assets/thumbs/input/` as the canonical artwork record.
- Do not infer token identity from the next filename, title ordinal, directory order, or Webflow row order.
- Do not edit the generated manifest by hand.
- Do not make backfill candidates canonical without explicit review/apply.
- Do not couple thumbnail generation to mint signing or CMS publication.
- Do not widen the current conversion profile during the first authoring slice.
