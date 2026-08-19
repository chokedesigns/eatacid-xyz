# CMS-IMG-5 — final Webflow CMS thumbnail migration reconciliation

Generated: `2026-08-19T16:57:03.235Z`

Site: `656cf42faa2b1a7a1582d9d2` (EATACID.xyz, `staging-eatacid-xyz`)

## Closure result

**PASSED: 66/66 staged and live images are exact, and 66/66 items are cleanly Published.**

CMS-IMG-5A issued one exact collection-item batch publication request for the 30 content-identical queued CANAAN revisions. No asset creation, upload, CMS field patch, unpublish, asset deletion, or unrelated collection publication occurred.

## Exact repaired scope

- token 0: `65a1bef667f967865601b215` — SERIOUSLY STONED (`seriously-stoned`)
- token 2: `65a1bf5b7d17dc5aea534acf` — THIS VERY MOMENT (`this-very-moment`)
- token 3: `65a1bf85612e9792b512811e` — THE HERO'S JOURNEY (`the-heros-journey`)
- token 4: `65a1bfa583784c8c84d01982` — ALIGNMENT PERFECTUS (`alignment-perfectus`)
- token 5: `65a1bfc87dbe94da28b7a98c` — GOOD TIMES (`good-times`)
- token 6: `65a1bfe8e5760e9cf81a65ec` — ROYALS (`royals`)
- token 7: `65a1c119847caa5268e2bf38` — ALL UP IN IT (`all-up-in-it`)
- token 8: `65a1c15d83784c8c84d104cc` — THE EXPLORER (`the-explorer`)
- token 9: `65a1c18507efc2af8049a607` — DENSITY (`density`)
- token 10: `65a1c1ae7dbe94da28b89e36` — THE PAGE (`the-page`)
- token 11: `65a1c2b93a064c4ad4db3d68` — YELLOW JACKETS (`yellow-jackets`)
- token 12: `65a1c2e6fc7fdb5d377b41c6` — THE CLASSIC (`the-classic`)
- token 13: `65a1c314e5760e9cf81c2935` — SELF (`self`)
- token 14: `65a1c33d8c1ee331dbe5ea19` — IN BLOOM (`in-bloom`)
- token 15: `65a1c382b6ff8e5ea08a3db9` — FEEL Ü (`feel-u`)
- token 16: `65a1c3b567f9678656043651` — FYEA 2.0 (`fyea-2-0`)
- token 17: `65a1c3d5cae2314a8ac83fb1` — KINGPIN (`kingpin`)
- token 18: `65dcff4ce6ba60dec918f46a` — TEK (`tek`)
- token 19: `65dcff9e27226dc26e8b1130` — INVERTED KINGPIN (`inverted-kingpin`)
- token 20: `65dcffe577389bbb31da21ba` — microDOSR (`microdosr`)
- token 21: `65dd0025addade1b7c9e8c32` — FACE MELTER (`face-melter`)
- token 22: `65dd005654c63a120e5649b9` — BETWEEN TWO WORLDS (`between-two-worlds`)
- token 23: `65dd0082eedbb748322e33c1` — EVT (`evt`)
- token 24: `65dd00eed55f0c8789540c86` — HONK IF YOU BONK (`honk-if-you-bonk`)
- token 25: `65dd029bf32f19961dfb353f` — COPY MACHINE GO BRRRRR (`copy-machine-go-brrrrr`)
- token 26: `65dd02d613a6d26ad46296ca` — BLUE (`blue`)
- token 27: `65dd03455b33e6a25317985c` — EAT, PRAY, LSD. (`eat-pray-lsd`)
- token 28: `65dd0373b8e24ee5a59d2956` — A WAY BACK HOME (`a-way-back-home`)
- token 29: `6a1a0af1a5e9ac44f04c94d3` — SPLINTERED (`splintered`)
- token 30: `6a1a0c033b962bc5f194b9b8` — BD25 (`bd25`)

CANAAN token 1 (`65a1bf3dc64d193880da0093`) remained unchanged and cleanly Published.

## Global reconciliation

| Collection | Staged exact | Live exact | Identity | Non-image | Cleanly Published |
|---|---:|---:|---:|---:|---:|
| CANAAN | 31/31 | 31/31 | 31/31 | 31/31 | 31/31 |
| THE 419 SCRIPT | 13/13 | 13/13 | 13/13 | 13/13 | 13/13 |
| INTRODUCTIONS | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 |
| HEN | 17/17 | 17/17 | 17/17 | 17/17 | 17/17 |
| **Total** | **66/66** | **66/66** | **66/66** | **66/66** | **66/66** |

Queued revisions: **0**. Unexpected CMS drift: **0**. Local runtime reconciliationRequired: **0**.

The closure rerun was read-only: 145 GET requests, 0 non-GET requests, and 0 external mutations. The preceding repair used 1 publication request for exactly 30 item IDs.

## Asset inventory preservation

The CMS-IMG-5 inventory remains unchanged: 66 active referenced CMS Image assets, 66 unreferenced content-identical migration upload assets, 65 likely safe to delete later, and 1 ambiguous token-1 pilot asset. No asset cleanup was performed.

## Runtime history

Historical CMS-IMG-3 and CMS-IMG-4 journals were read but not rewritten. Active-token blocked history, HTTP 429 evidence, and HEN DISORDER reconciliation history remain preserved. Fresh Webflow truth is authoritative for this closure.

## Validation and repository safety

- CMS image rollout suite: **70/70 passing**.
- CMS image pilot suite: **40/40 passing**.
- Rollout, pilot, and ticket-runner syntax checks: passed.
- Authoritative mapping, rollout-plan, asset-inventory, and final-reconciliation JSON integrity checks: passed.
- CMS-IMG-3 status and CMS-IMG-4 HEN status: all items remain `published-verified`, with zero `reconciliationRequired` state.
- Outer staging build: passed.
- `git diff --check`: passed.

The outer repository remained on `ticket-CMS-IMG-5A-canaan-publication-repair`. The nested `admin-ui` repository remained on `codex` with only its two protected pre-existing modifications. Their starting SHA-256 hashes were preserved:

- `admin-ui/src/drop-params.mirror.json`: `8a83956411d83a47c39a3c6b741f3dea188aa8ba40d93389859bdb12f1013b8a`
- `admin-ui/src/thumbs.manifest.js`: `3217d2b5cb4bdafd66773dd3d213072e2ad39d5b090496707a0c23d75575b6e3`

No commit, merge, or push was performed.

## Final result

`CMS-IMG-5A PUBLICATION REPAIR COMPLETE — 66/66 LIVE + PUBLISHED VERIFIED`
