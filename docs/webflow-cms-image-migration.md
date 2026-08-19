# Webflow CMS image migration postmortem

## Scope and outcome

The one-time migration replaced 66 CMS thumbnails: CANAAN 31, THE 419 SCRIPT 13, INTRODUCTIONS 5, and HEN 17. All 66 staged images and all 66 live images were content-verified, all 66 items were cleanly published, queued revisions and reconciliation-required items ended at zero, and orphan cleanup removed all 65 authorized assets.

## Thumbnail contract

The reusable thumbnail pipeline remains under `assets/thumbs/`. It deterministically produces 300-pixel-wide, proportionally sized, progressive JPEGs at quality 84 in sRGB, strips metadata, warns when a source must be enlarged or a generated file exceeds the size threshold, validates output, preserves canonical masters, and maintains focused tests.

## Webflow lessons

An uploaded Webflow asset-library identity is not necessarily the Image identity Webflow later returns from a CMS item. Webflow can normalize the file ID, URL, extension, or JPEG encoding. Verification must retrieve the resulting CMS image and compare its content and dimensions; equality with the submitted asset ID or URL is not required and is not sufficient.

Staged/live content equality also does not prove a clean publication state. Draft/archive flags and publication timestamps must show that publication covers all staged and live updates; otherwise a content-identical queued revision can remain.

GET requests may use bounded retry/backoff. A write that loses its response must not be blindly retried: record the outcome as ambiguous, read the external state, and reconcile against the intended result before deciding whether another mutation is safe.

## HEN identity

The canonical/mainnet HEN token ID is authoritative and maps 1:1 on mainnet. Shadownet uses the `testnet.mirrors.HEN` mapping in `shared/chain-registry.js`; those values are environment lookup IDs only and must never replace canonical CMS identity. Application translation remains implemented in `admin-ui/src/utils/hen-ids.js`.

## Retained token-1 asset

One historical CANAAN token-1 pilot asset intentionally remains in Webflow. This is not a migration defect: deletion independence from the active CMS image was not conclusively proven, so the asset was excluded from cleanup.

## Reusable components retained

- `assets/thumbs/scripts/thumbs.mjs` and `thumbs.test.mjs`: deterministic thumbnail conversion, validation, input processing, and backfill review.
- `assets/webflow-cms/webflow-cms.mjs`: authenticated API access, staged/live reads, exact-ID writes and publication, bounded GET retry, ambiguous-write signaling and read-only reconciliation, redacted atomic journal writes, deterministic asset naming, presigned upload and exact asset verification, content-based CMS image verification, target/unrelated-item comparison, and clean-publication verification.
- `assets/webflow-cms/webflow-cms.test.mjs`: focused behavioral tests for those Webflow/CMS safety primitives.
- `shared/chain-registry.js` and `admin-ui/src/utils/hen-ids.js`: authoritative HEN canonical/network identity mapping.
- `shared/hen-identity.test.mjs`: canonical/mainnet identity and Shadownet mirror round-trip coverage.
- `admin-ui/src/thumbs/` and its generated manifest flow: canonical thumbnail masters and application lookup.

## Retired components

The retired material comprised the CANAAN pilot CLI, B1-B5 and H1-H2 rollout orchestration, migration-specific targets and state namespaces, immutable rollout baselines and journals, completed mapping/plan/reconciliation/cleanup evidence, migration-only scenario fixtures and tests, runtime logs, and obsolete npm commands. Git history remains the source for detailed execution evidence.
