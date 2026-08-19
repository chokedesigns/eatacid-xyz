# CMS-IMG-5 — final Webflow CMS thumbnail migration reconciliation

Generated: `2026-08-19`

Mode: **READ-ONLY**. The audit runner rejected every non-GET HTTP method. It issued 145 GET requests and 0 mutation requests. No Webflow asset, CMS item, publication state, drop parameter, network setting, or runtime journal was changed.

## Verdict

**FAILED: 30 CANAAN items have content-identical queued staged revisions.**

All 66 expected CMS items were found. Every staged and live image is a content match for its canonical local JPEG, every canonical identity is preserved, and every non-image field matches the immutable pre-migration baseline. However, CANAAN tokens `0` and `2..30` have staged `lastUpdated` values around `2026-08-19T01:32:42.791Z`–`2026-08-19T01:32:43.000Z`, later than their respective `lastPublished` markers. Their live records remain at the earlier clean publication timestamps. CANAAN token `1` is clean.

This is a closure blocker under the ticket's explicit rule that content equality is insufficient when an unpublished staged revision exists. No remediation was attempted.

## Reconciliation totals

| Collection | Found | Staged exact | Live exact | Canonical identity | Non-image preserved | Clean publication | Overall pass |
|---|---:|---:|---:|---:|---:|---:|---:|
| CANAAN | 31/31 | 31/31 | 31/31 | 31/31 | 31/31 | 1/31 | 1/31 |
| THE 419 SCRIPT | 13/13 | 13/13 | 13/13 | 13/13 | 13/13 | 13/13 | 13/13 |
| INTRODUCTIONS | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 |
| HEN | 17/17 | 17/17 | 17/17 | 17/17 | 17/17 | 17/17 | 17/17 |
| **Total** | **66/66** | **66/66** | **66/66** | **66/66** | **66/66** | **36/66** | **36/66** |

- Queued staged revisions: **30**.
- Unexpected CMS content/identity drift: **0**.
- Draft or archived items: **0**.
- Missing or invalid `lastPublished` markers: **0**.
- Staged/live image or non-image content discrepancies: **0**.

The machine-readable record for every item, including Image objects, hashes, dimensions, timestamps, content-verifier metrics, non-image comparisons, publication checks, and pass/fail state, is in `CMS-IMG-5.final-reconciliation.json`.

## Network and drop state

- Current checked-in network: `testnet`.
- Current network label: Shadownet.
- `dropScheduled`: `false`.
- Active canonical redeem target: none (`collection` and `tokenId` are empty).
- HEN semantics remain canonical sparse CMS token ID → `testnet.mirrors.HEN` → Shadownet thumbnail lookup ID. Mirror IDs `0..16` do not appear as canonical CMS identities.

## Image and local-source proof

All 66 local source files exist, match their audited SHA-256 values and byte counts, decode as JPEG, and have the expected dimensions. CANAAN, INTRODUCTIONS, and HEN are 300×375; THE 419 SCRIPT is 300×386. All staged and live hosted images passed the established decoded/perceptual content verifier and `alt:null` check against those local sources.

The current Shadownet HEN layout remains `admin-ui/src/thumbs/hen/0.jpg` through `16.jpg`. Canonical/mainnet identity remains the sparse HEN token ID. Sparse canonical mainnet filenames are not materialized, and no mainnet mirror exists or was introduced. This remains a separate future file-layout seam; it does not explain or invalidate the verified HEN migration content.

## Identity and non-image preservation

For all 66 items, CMS item ID, canonical token ID, collection value, title/name, slug, locale, flags, references, links, dates, editions, ACID values, and every other non-image field match the immutable pre-migration staged/live baselines. The only allowed content change—the Image field—matches the authoritative local source in both representations.

## Publication blocker detail

CANAAN token `1` has clean staged/live publication markers at `2026-08-17T22:34:36.922Z`. The other 30 CANAAN items have content-identical staged and live fields, but their staged records were all newly updated within a roughly 209 ms window around `2026-08-19T01:32:43Z`. Their staged `lastPublished` and live `lastUpdated`/`lastPublished` remain at their prior successful CMS-IMG-3 publication times. This pattern creates 30 queued revisions and prevents formal closure.

No attempt was made to publish, patch, reconcile, or normalize these records. A separately authorized investigation/remediation pass is required before rerunning CMS-IMG-5.

## Runtime and migration-history assessment

CMS-IMG-3 local runtime currently records B1–B5 as `published-verified` for 48/48 batch items with `reconciliationRequired=0`. CMS-IMG-4 records H1–H2 as `published-verified` for 17/17 HEN items with `reconciliationRequired=0`. Publish approvals are present for every batch.

The journals preserve their historical recovery evidence:

- B2 retains the CANAAN token 14 asset GET 429 and later reconciliation.
- B3 retains the CANAAN token 29 active-redeem safety block and later authorized continuation.
- B4 retains the THE 419 SCRIPT token 8 asset GET 429 and later reconciliation.
- H2 retains the HEN `DISORDER` token 397098 asset GET 429 and later reconciliation.

The history is internally coherent and was not rewritten. Fresh external truth now disagrees with the CMS-IMG-3 terminal state for 30 CANAAN items because later queued staged revisions occurred after the recorded successful reconciliations. The local runtime is therefore historically valid but stale for current CANAAN publication cleanliness. CMS-IMG-4 agrees with fresh HEN truth.

## Asset inventory and cleanup recommendation

The asset inventory found 66 active CMS-normalized Image assets (category A, **KEEP**) and 66 unreferenced migration upload assets whose bytes match active CMS images (category C candidate duplicates). Of the unreferenced assets:

- 65 have exact journal provenance, identical content to an active image, and no staged/live CMS references: **LIKELY SAFE TO DELETE LATER**.
- The CANAAN token 1 pilot upload asset `6a75027d6dc3be886de27b3e` has identical bytes to the active image and no staged/live reference, but its current runtime journal is absent: **DO NOT DELETE — AMBIGUOUS**.

No asset was deleted. Because 66 candidates are meaningful rather than trivial, a separate, explicitly authorized asset-cleanup ticket is recommended after the CMS publication blocker is resolved. That ticket must recheck all staged/live references and preserve the ambiguous pilot asset unless stronger provenance is recovered.

Full asset IDs, filenames, hashes, dimensions, staged/live reference results, related tokens, journal references, confidence, and recommendations are in `CMS-IMG-5.asset-inventory.json`.

## Tooling health

- CMS image rollout suite: **70/70 passing**.
- CMS image pilot suite: **40/40 passing**.
- Rollout and pilot syntax checks: passed.
- CMS-IMG-3 `plan` and `status`: passed; status reports all B1–B5 items `published-verified` and zero local `reconciliationRequired`.
- `hen-plan testnet` and `hen-status`: passed; H1/H2 report 17/17 `published-verified`, zero local `reconciliationRequired`, and no CMS-IMG-3 runtime consumption.
- JSON integrity checks: passed for the authoritative mapping/plan files and both CMS-IMG-5 JSON artifacts.
- `git diff --check`: recorded in final branch review verification.

## Repository safety

The outer repository started clean on `ticket-CMS-IMG-5-final-reconciliation`. The nested `admin-ui` repository started on `codex` with only the two protected pre-existing user modifications:

- `src/drop-params.mirror.json` — SHA-256 `8a83956411d83a47c39a3c6b741f3dea188aa8ba40d93389859bdb12f1013b8a`
- `src/thumbs.manifest.js` — SHA-256 `3217d2b5cb4bdafd66773dd3d213072e2ad39d5b090496707a0c23d75575b6e3`

Neither protected file was regenerated, normalized, or edited. Runtime journals were read only. No commit, merge, or push was performed.

## Final result

`CMS IMAGE MIGRATION CLOSURE AUDIT FAILED — 30 CANAAN ITEMS HAVE CONTENT-IDENTICAL QUEUED STAGED REVISIONS`
