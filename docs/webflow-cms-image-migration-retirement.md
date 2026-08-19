# Webflow CMS image migration retirement

## Removed

- `assets/webflow-cms-image-pilot/`: one-item target, migration CLI, runtime/journal behavior, README, and scenario tests.
- `assets/webflow-cms-image-rollout/`: B1-B5 and H1-H2 planning, batching, staging, publication, reconciliation CLI, migration state, README, and scenario tests.
- `docs/webflow-cms-image-audit/`: CMS-IMG-1 through CMS-IMG-6 audit, mapping, completion, rollout, reconciliation, asset-inventory, and cleanup evidence (16 files).
- The ignored pilot `runtime/run.log` and obsolete migration runtime ignore rules.
- Package commands `cms:image-pilot`, `test:cms-image-pilot`, `cms:image-rollout`, and `test:cms-image-rollout`.

No older migration ticket diff/stat exports were present in the working tree. Detailed historical evidence remains available through Git history.

## Retained and extracted

- `assets/thumbs/`, including deterministic 300px proportional progressive JPEG conversion at quality 84, sRGB conversion, metadata removal, warnings, validation, canonical-master preservation, input/backfill flows, and tests.
- `admin-ui/src/thumbs/` and the existing manifest generation flow; neither protected Admin output was regenerated or edited.
- `shared/chain-registry.js` and `admin-ui/src/utils/hen-ids.js` as the HEN canonical/network identity authority.
- New `shared/hen-identity.test.mjs` preserves round-trip coverage for every configured Shadownet lookup adapter and mainnet identity behavior.
- New `assets/webflow-cms/webflow-cms.mjs`, extracted from migration code and generalized to retain authenticated requests, staged/live and asset reads, exact field patches/publication, bounded GET retry, ambiguous mutation signaling, redacted atomic journal writes, deterministic asset naming, presigned upload and asset verification, content verification, target/unrelated-item comparison, clean-publication verification, and read-only reconciliation.
- New `assets/webflow-cms/webflow-cms.test.mjs` with 16 reusable behavioral tests. Migration batch membership, ticket fingerprints, immutable baselines, journal namespaces, plan fixtures, and completed execution scenarios were retired with the old suites.
- `docs/webflow-cms-image-migration.md` as the concise durable postmortem. Admin Authoring Pipeline references were redirected from deleted evidence and scripts to current authoritative sources.

## Reference reconciliation

The only remaining `CMS-IMG-1` through `CMS-IMG-6` source occurrences are this retirement record's description and reconciliation of the deleted evidence series. B1-B5/H1-H2 remain only in this record and the durable postmortem to identify retired orchestration. Generic SmartPy `scenario.h1()`/`scenario.h2()` headings and unrelated hashes are not migration references. Removed filenames and CLI commands appear only in this tombstone; they have no live imports, package wiring, or operational documentation.

## Validation

- Thumbnail tests: 6/6 passed.
- Reusable Webflow CMS tests: 16/16 passed.
- Public trade operation fixtures: 15/15 passed.
- HEN identity tests: 2/2 passed, covering every configured canonical/Shadownet mirror round trip.
- Relevant JavaScript syntax checks: passed.
- JSON integrity: 22 remaining JSON files parsed successfully.
- Staging pages build: passed; generated `dist/staging` and `.parcel-cache` were removed afterward.
- Removed-name/import/package reference searches: passed, with only the documented historical references above.
- `git diff --check`: passed before artifact export.
- External reads: 0. External mutations: 0.
