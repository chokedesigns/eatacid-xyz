# PERF-2A — Home loader deploy path

Date: 2026-08-20

Profile: AUDIT / CLOSURE

Status: historical pre-PERF-2B audit. The paths and compatibility guard below
describe the deployment architecture at the time of this audit. PERF-2B
replaces it with main-owned stable root routers plus branch-owned environment
loaders; see `PERF-2B.staging-loader-isolation.md`.

## Finding

The PERF-2 staging runtime check did not exercise PERF-2. The browser made no `first-paint.js` request and served the old root `home.js`, followed by the large staging `home.js`. Slow-4G LCP was therefore effectively unchanged at about 12.474 seconds versus the 12.471-second PERF-1 baseline.

The browser response was not a stale generated file in this checkout. It exactly matched the loader on `origin/main`.

## Authoritative provenance and source matrix

The Pages workflow always checks out both branches and assembles one shared artifact:

```text
main:loaders/home.loader.js
-> .github/workflows/pages.yml copy
-> assembled dist/home.js
-> actions/upload-pages-artifact
-> actions/deploy-pages
-> https://chokedesigns.github.io/eatacid-xyz/home.js
```

| Published path | Authoritative input before assembly |
| --- | --- |
| `/home.js` | `main:loaders/home.loader.js` |
| `/prod/home.js` | Parcel `webflow/home.js` build from `main` |
| `/prod/first-paint.js` | Parcel `webflow/first-paint.js` build from `main`, after PERF-2 promotion |
| `/staging/home.js` | Parcel `webflow/home.js` build from `staging` |
| `/staging/first-paint.js` | Parcel `webflow/first-paint.js` build from `staging` |

At the failed runtime-validation point, `main` was commit `6da2599`: its loader was old and its build did not contain the PERF-2 entry. `staging` was commit `17870e8` and contained PERF-2. The workflow correctly copied the production-authoritative main loader, so the staging-only PERF-2 change could not alter shared `/home.js`.

Deployment invariant:

```text
Shared root loaders must not be ahead of the production artifact set they may select.
```

Copying the shared loader from staging would violate that invariant: production could request `/prod/first-paint.js` before main emits it. The fix therefore keeps main authoritative and requires promotion of the complete staging history containing PERF-2.

## Compatibility guard

`scripts/verify-pages-home-loader-artifacts.mjs` validates the final assembled Pages tree and the authoritative main loader source. It fails before upload when:

- root `home.js` or the supplied authoritative main loader is absent, empty, or not a file;
- assembled `home.js` is not byte-identical to `repo-main/loaders/home.loader.js`;
- the root loader lacks production/staging selection, the first-paint reference, or the Home reference;
- either `/prod` or `/staging` lacks the referenced `first-paint.js` or `home.js`;
- a first-paint artifact lacks the coordinator state marker.

The workflow runs the verifier after every build and copy operation and immediately before `actions/upload-pages-artifact`. There is no intervening or later `dist/home.js` copy. The validated tree is therefore the uploaded tree. The verifier itself is invoked from `repo-main`, so a staging-only push while main lacks the guard/PERF-2 fails closed rather than publishing another incompatible artifact.

## Local artifact validation

Workflow-equivalent `--no-optimize` Parcel builds from the current branch produced:

| Representative published path | Raw bytes | Local gzip bytes |
| --- | ---: | ---: |
| `/home.js` on this Windows checkout | 1,233 | 495 |
| `/prod/first-paint.js` | 30,404 | 7,527 |
| `/prod/home.js` | 4,992,426 | 1,538,295 |
| `/staging/first-paint.js` | 30,404 | 7,527 |
| `/staging/home.js` | 4,992,426 | 1,538,295 |

The representative promoted artifact used those actual outputs and passed. Removing actual `/prod/first-paint.js` made the verifier exit nonzero with a missing-production-artifact diagnostic. Focused tests also reject the exact old root-loader shape, a missing staging first-paint file, either missing Home bundle, wrong first-paint content, and a stale root overwrite after an earlier successful check.

## Required promotion

Current local ancestry shows `main` is an ancestor of this branch, with no main-only commits. After committing PERF-2A, the safe promotion is a fast-forward of this complete branch to main, not cherry-picking PERF-2/PERF-2A. Cherry-picking would risk omitting the earlier staging commits that introduced the coordinator and its supporting runtime.

Re-fetch and re-check ancestry before promotion. If it remains unchanged:

```text
git switch main
git pull --ff-only origin main
git merge --ff-only ticket-PERF-2A-audit-home-loader-deploy-path
git push origin main
```

After the main Pages deployment succeeds, fast-forward `staging` to the same branch commit and push it so both long-lived refs contain the compatibility guard. Do not push staging first: before main promotion, the new fail-closed step intentionally cannot pass from `repo-main`.

## Runtime validation still required

After the main-triggered Pages run completes, inspect root `/home.js`, confirm it contains independent `${base}/first-paint.js` and `${base}/home.js` loads, and confirm Network requests `/staging/first-paint.js` on the staging Home page. Then repeat the PERF-1 no-throttling and Slow-4G traces and visual/wallet checks. The previous 12.474-second trace is not a PERF-2 result, and this static/deployment validation makes no LCP-success claim.
