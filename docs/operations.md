# EATACID.xyz outer repository operations

## 1. Purpose and operational safety

This is the canonical day-to-day operations guide for developing, validating, staging, promoting, troubleshooting, and maintaining the outer/public repository. Use the [repository README](../README.md) for orientation and the [developer guide](developer-guide.md) for architecture, ownership, and runtime contracts.

- `admin-ui/` is a separate nested Git repository. Check and manage its status independently.
- Work staging-first unless the current ticket explicitly requires a different base or destination.
- GitHub Pages production deployment is controlled by `.github/workflows/pages.yml` and the current `main` and `staging` refs.
- Generated files and local reference exports are not authoring sources.
- Mainnet cutover is outside this guide. Ordinary build and deployment success does not authorize it; follow the [testnet-to-mainnet runbook](testnet-to-mainnet.md).

Before changing files, confirm the branch, outer status, and nested status. Stop if either repository has unexpected tracked changes:

```text
git branch --show-current
git status --short
git -C admin-ui status --short
```

If `admin-ui/` is not present in a fresh outer clone, omit the last command. It is not an outer-repository submodule.

## 2. Fresh clone / setup

The Pages workflow uses Node.js 20. Use that as the local baseline; `package.json` does not declare an `engines` range. From the outer repository root:

```text
git branch --show-current
git status --short
npm ci
```

`npm ci` installs exactly from the committed `package-lock.json`; do not replace the lockfile as a setup side effect. There is no required `.env` contract. The repository ignores `.env*`, but Parcel can expose a supported `NETWORK` value to `shared/network.js` at build time. Check for a local ignored `.env*` or shell-level `NETWORK` override before a build when the selected network matters.

If a separate `admin-ui/` checkout is present, also run `git -C admin-ui status --short`. Its dependencies, branch, and working tree are independent.

## 3. Local development

Run:

```text
npm run start
```

The command first checks `127.0.0.1:4000`. If the port is occupied, it stops before starting Parcel and prints owner diagnostics where available. Otherwise it starts two concurrent processes:

- a Parcel development server on port 4000 with browser opening enabled;
- the drop-parameter watcher described in the next section.

The served tracked shells are:

```text
http://localhost:4000/           Home
http://localhost:4000/drops/     Drops
http://localhost:4000/exchange/  Exchange
```

Parcel may write ignored `.parcel-cache/` content. The watcher may regenerate tracked `shared/drop-params/drop-params.json` and, when the nested checkout exists, `admin-ui/src/drop-params.mirror.json`. Inspect both Git repositories before retaining those changes.

Stop the command with `Ctrl+C` in its terminal. Local Parcel development exercises the tracked local module substitutions; it is not equivalent to Pages loader-chain validation.

## 4. Drop-parameter workflow

The ownership chain is:

```text
shared/drop-params/drop-params.js
-> authoritative authored source

shared/drop-params/drop-params.json
-> tracked generated outer projection

admin-ui/src/drop-params.mirror.json
-> generated mirror in the independent Admin repository
```

After deliberately changing `drop-params.js`, regenerate the outer projection:

```text
npm run dropparams:json
```

This command reads `drop-params.js`, preserves the existing JSON file's line-ending style, and writes `shared/drop-params/drop-params.json` only when content differs. It does **not** update the Admin mirror.

`npm run start` runs `npm run dev:watch:params`. The watcher generates the outer JSON once at startup and after source changes, then copies that exact JSON into `admin-ui/src/drop-params.mirror.json` when the nested target exists and differs. The watcher waits for successful outer generation before mirroring.

Never hand-edit either generated JSON file. After deliberate generation, expect the outer source and projection to form one reviewable diff; if the watcher ran, separately inspect the Admin mirror diff. If generation was not intentional, stop and resolve the unexpected change rather than carrying it into another ticket.

## 5. Primary deterministic tests

Run the tests that match the changed contract. These commands do not intentionally change repository files; the Pages-artifact, Webflow-CMS, and thumbnail suites create fixtures under the operating system's temporary directory.

| Command | Run when changing | What it proves |
| --- | --- | --- |
| `npm run test:loader-architecture` | Root routers, environment loaders, first-paint startup, or loader failure handling | Host selection, sibling artifact startup, and failure isolation match the encoded Home/Drops/Exchange architecture. |
| `npm run test:pages-loader-artifacts` | Pages workflow assembly, loader provenance, or artifact verification | The verifier accepts the supported assembled graph, rejects ownership/marker/map violations, and the workflow keeps verification after map removal with no later artifact mutation. |
| `npm run test:public-trade-ops` | Shared approvals, operation confirmation, pair matching, or NFT refresh behavior | Deterministic trade-helper fixtures preserve approval fallback, confirmation matching/retry, and refresh completion rules. |
| `npm run test:drops-reveal` | Drops early paint, readiness barriers, pending states, or environment loading | The initial and wallet reveal contracts, early-shell markers, and Drops sibling loading remain coordinated. |
| `npm run test:hen-identity` | HEN IDs, registry mirrors, or network identity adapters | Canonical and Shadownet HEN IDs round-trip without altering other collections. |
| `npm run test:webflow-cms` | Webflow CMS image tooling, retry/mutation handling, publication comparison, or evidence persistence | Request safety, ambiguity handling, content comparison, deterministic naming, and credential redaction behave as encoded. |
| `npm run test:thumbs` | Thumbnail conversion, input/backfill workflow, or Windows launchers | Image normalization, safe archival/rollback, backfill reporting, and launcher behavior remain deterministic. |

`npm run test:home-first-paint` is a compatibility alias for `test:loader-architecture`, not a separate validation layer.

## 6. Production and staging builds

Use the branch-local Pages builds:

```text
npm run build:pages:staging
npm run build:pages:prod
```

Both commands:

1. run `npm run dropparams:json`;
2. remove `.parcel-cache/`;
3. remove only their target environment directory;
4. build the five current `webflow/` Parcel entries without content hashes or scope hoisting.

Staging output goes to ignored `dist/staging/`; production output goes to ignored `dist/prod/`. Branch-local output retains Parcel source maps for local analysis. The GitHub Pages workflow removes maps only after it combines both branch builds.

Use the staging build for normal ticket validation. Use the production build when a production-shaped branch-local build is specifically relevant, such as promotion preparation. Neither command creates the final assembled Pages artifact: stable root routers and environment loaders are added by the Pages workflow, or partially copied by loader-chain sanity.

## 7. Direct Pages sanity

Run:

```text
npm run pages:sanity
```

The command:

1. produces a staging build in `dist/staging/`;
2. creates ignored `pages-sanity/home.html`, `drops.html`, and `exchange.html` from the three tracked Webflow-derived shells;
3. strips tracked local application module tags and any prior harness injection;
4. injects direct `../dist/staging/{surface}.js` application artifacts;
5. starts `npx serve . -l 8080` through `cmd.exe` and opens all three sanity URLs in the default browser.

This runner is currently Windows-specific. Its child window is not hidden. `serve` is not a declared package dependency, so `npx` may need network access or may offer to obtain it when it is not already cached. The server remains active until stopped with `Ctrl+C`.

Direct sanity deliberately bypasses the stable root routers and environment loaders. Use it to isolate full-bundle or runtime problems independently of the loader chain; do not treat it as the primary deployment-chain test.

## 8. Loader-chain Pages sanity

Run:

```text
npm run pages:sanity:loader-chain
```

This performs the same staging build and generated-shell transformation, then also copies:

```text
loaders/root/{surface}.js
-> dist/{surface}.js

loaders/environment/{surface}.js
-> dist/staging/{surface}-loader.js
```

The harness injects the stable `../dist/{surface}.js` router. On localhost, the router selects `./staging`, imports the surface's staging environment loader, and that loader starts its sibling first-paint and full-application artifacts. The same Windows, browser-opening, `npx serve`, port 8080, and stop behavior described for direct sanity applies.

This is the closer local simulation of the deployed Pages chain. It is required or strongly recommended for changes to root routers, environment loaders, first paint, wallet bootstrap, public DOM/runtime integration, network selection/defaults, and later mainnet-readiness work.

## 9. Normal ticket workflow

Use this delivery direction unless the current ticket specifies otherwise:

```text
current staging
-> isolated ticket branch
-> implementation
-> relevant deterministic/build/sanity validation
-> commit
-> merge ticket into staging
-> push staging
-> deployed staging verification
```

Start a ticket from current `staging` unless the task explicitly requires another base. Keep ticket branches isolated and preserve the ticket's file allowlist. Passing local checks is not a reason to merge directly to `main`. Git commits, merges, and pushes performed by automation still require the current task's authorization.

Generated `ticket.*` review artifacts are not implementation files and should not enter the implementation commit.

## 10. Staging deployment

A push to `staging` triggers the same combined Pages workflow as a push to `main`. Operationally, the workflow:

1. checks out `main` and `staging` into separate directories;
2. installs each checkout independently with Node.js 20 and `npm ci`;
3. regenerates each branch's drop-parameter JSON and fails if that changes the tracked projection;
4. builds `dist/prod/` from `main`;
5. builds `dist/staging/` from `staging`;
6. assembles one Pages artifact with stable routers and both environments;
7. removes every `.map` file from the assembled artifact;
8. asserts that no map remains;
9. verifies the loader graph, referenced artifacts, markers, and branch provenance;
10. uploads and deploys the artifact.

Important: a staging push rebuilds the combined deployed Pages artifact, but `/prod/*` still comes from `main`.

## 11. Production promotion

The normal conceptual promotion is:

```text
validated staging
-> merge staging into main
-> push main
-> combined Pages rebuild
-> verify production
```

Perform merges and pushes only under the project's current authorization and review process. Production is rebuilt from `main`; exact staging bundle bytes are **not** promoted unchanged. Production therefore needs post-deployment verification even when staging passed.

## 12. GitHub Pages artifact assembly

The final Pages artifact has this practical shape:

```text
/home.js
/drops.js
/exchange.js
/prod/*
/staging/*
```

Ownership is:

```text
main
-> stable root routers
-> prod environment loaders
-> prod Parcel artifacts

staging
-> staging environment loaders
-> staging Parcel artifacts
```

The workflow requires all three root routers from `main`. It removes maps only after final assembly, verifies that zero `.map` files remain, then runs provenance verification. No step mutates the assembled `dist/` graph between that verifier and artifact upload. Branch-local `dist/prod/` and `dist/staging/` builds retain their source maps.

See the [developer guide](developer-guide.md#stable-root-router-architecture) for the architectural rationale.

## 13. Deployment verification

After a staging or production deployment:

- Confirm the Pages workflow and deployment job succeeded.
- Open the intended published page in a fresh/private session when cache or session state could obscure the result.
- In DevTools Network, confirm the stable root router loaded.
- Confirm hostname selection loaded the expected environment loader.
- Confirm the expected sibling first-paint and full-application artifacts loaded.
- Check the console and failed requests for obvious loader, bundle, or runtime errors.
- Confirm each affected page surface renders and its changed behavior works.
- Confirm no `.map` files were published in the Pages artifact.
- If wallet/bootstrap/trade behavior changed, exercise the relevant supported testnet behavior and verify stale-account/network protections still work.

Host routing is exact:

```text
eatacid.xyz or www.eatacid.xyz
-> /prod

every other hostname, including Webflow staging and localhost
-> /staging
```

For production, verify both production hostnames where practical. For Webflow/non-production staging, verify that the stable router selects `/staging` rather than assuming the page's visual environment proves bundle selection.

## 14. Ordinary rollback

This is a Git/deployment rollback, not an on-chain rollback:

1. Identify the known-good Git ref and the source change that caused the regression.
2. Revert the relevant source change on the appropriate branch through the normal reviewed Git process.
3. Preserve a compatible root-router, environment-loader, and referenced-artifact graph; do not roll back only one deployed bundle in isolation outside the supported assembled graph.
4. Push the appropriate branch so the complete Pages artifact rebuilds.
5. Wait for the workflow and deployment to finish, then repeat the deployment checklist.
6. Use a hard refresh or new browser session when stable filenames or browser caching could retain the prior result.

Git rollback does not undo any on-chain transaction.

## 15. Troubleshooting generated output

| Path | Created by / status | Regeneration and cleanup |
| --- | --- | --- |
| `.parcel-cache/` | Parcel cache; ignored | Safe to regenerate. Use `npm run clean:cache` when resolving cache/build inconsistencies. |
| `dist/` | Parcel branch builds and local loader-chain copies; ignored | Rebuild from source. `npm run clean:prod` removes only `dist/prod/`; `npm run clean:staging` removes only `dist/staging/`. The root loader copies made by loader-chain sanity are not removed by those commands. |
| `pages-sanity/` | Generated by either sanity command; ignored | Safe to regenerate. Remove this exact directory only when the sanity server is stopped and stale harness HTML is no longer needed. There is no `clean:generated` command. |
| `ticket.*.diff`, `ticket.*.stat.txt` | Generated review exports; ignored | Safe to overwrite with `npm run ticket:diff`. Remove only the exact artifacts when review no longer needs them. |
| `shared/drop-params/drop-params.json` | Generated by `npm run dropparams:json`; tracked | Regenerate from `drop-params.js`; do not delete or hand-edit it. A freshness diff is an error in CI unless the source and projection are committed together. |

Before cleanup, use `git status --short` in both repositories. Prefer the scoped scripts above; do not use broad recursive cleanup against the workspace.

## 16. Refreshing Webflow-derived HTML/reference material

This procedure refreshes the three Git-tracked development/sanity shells:

```text
index.html
drops/index.html
exchange/index.html
```

Keep three states distinct:

- **Published Webflow state:** the live staging document browsers can fetch.
- **Saved but unpublished Designer state:** editable Webflow state that is not yet represented by the published document.
- **Local tracked shell state:** a Git-owned snapshot with deliberate local module substitutions for development and sanity.

Webflow publishing is a mutation. Perform step 1 only with explicit project/ticket authority for the intended site and pages.

1. **Publish the intended Webflow state to staging.** A Designer save is not proof that the public staging document changed. Publish all intended dependencies before capture.
2. **Open each affected published staging page in Incognito/private browsing.** This reduces extension, authentication, and stale-session contamination.
3. **Open DevTools and disable cache.** Keep DevTools open so the setting remains effective during capture.
4. **Hard refresh.** On Windows/Chrome-family browsers, use `Ctrl+Shift+R`; otherwise use the browser's equivalent. Confirm the document request is fresh.
5. **Capture the actual HTML document.** Prefer **View Page Source** and save/copy that response. If it is unavailable or suspect, use **DevTools -> Network -> Document -> Response**. Do not use the runtime-mutated Elements DOM as the primary capture unless runtime mutation is the subject of the investigation.
6. **Verify the intended page.** Check the URL, Home/Drops/Exchange surface, expected content, publish freshness, and Webflow site/page identity where observable.
7. **Compare; do not blindly overwrite.** Diff the captured HTML against the corresponding tracked shell. Separate Webflow-origin changes from Git-owned local substitutions and sanity integration. Preserve or deliberately reapply the supported local module entries: Home uses `./shared/public-first-paint.js` and `./shared/beacon-setup.js`; Drops and Exchange use their local `js/main.js`. The sanity generator depends on recognizing and replacing these entries.
8. **Review DOM/class contract impact.** For meaningful changes, inspect selectors, IDs/classes, CMS/list structure, element ancestry, runtime-required elements, and hosted CSS/runtime dependencies. Use the historical/specialist [Webflow DOM contracts](webflow-migration/03-dom-contracts.md) and [runtime dependency data](webflow-migration/03-runtime-dependencies.json) as evidence, then verify against current consumers.
9. **Validate every affected surface.** Home-only success does not prove Drops or Exchange. Run relevant deterministic tests and builds, direct sanity to isolate bundle/runtime behavior, and loader-chain sanity when the deployed integration graph could be affected.
10. **Review the final shell diff.** Reject accidental runtime-mutated HTML, unexpected CDN/runtime drift, removed local modules, unrelated CMS changes, or changes outside the intended surfaces.
11. **Roll back a bad capture from Git.** After preserving any other intended work, restore the affected tracked shell from its prior known-good Git version. Do not try to repair live Webflow by manipulating generated local HTML.

Live/published Webflow HTML, CMS serialization, DOM/class structure, and hosted Webflow CSS remain Webflow authority. The local tracked shells are development/sanity snapshots. Ignored CSS/reference exports are not current runtime authority, and tracked historical CSS evidence is evidence only. See the [Webflow integration boundary](developer-guide.md#webflow-integration-boundary).

## 17. Ignored local Webflow exports

Current `.gitignore` rules classify these as local reference/export material:

```text
drops/css/
exchange/css/
assets/site/
```

They are not deployed application or live CSS authority. A local Webflow capture/export may recreate them; do not commit them merely because they appeared during refresh. Historical tracked evidence lives separately under [`docs/webflow-migration/`](webflow-migration/), including its `evidence/` subtree, and remains specialist evidence rather than current runtime authority.

## 18. Ticket/review artifacts

After an intended patch is stable, the repository's review exporter is:

```text
npm run ticket:diff
```

It derives a safe name from the current branch, overwrites:

```text
ticket.<branch>.diff
ticket.<branch>.stat.txt
```

and uses `git add -N .` so untracked files appear in the exported working-tree diff without staging their content. Inspect and restore any resulting intent-to-add index state before handoff when the ticket requires a clean index.

These files are ignored review artifacts, not application source, and should not be committed unless a ticket explicitly says otherwise. They remain on disk after branch switching or merging; whether Git hides them depends on the ignore rules in the branch currently checked out.

## Mainnet operations boundary

Ordinary deployment and rollback procedures in this guide are not sufficient for network cutover. Production currently defaults to the `testnet` registry slot configured for Shadownet. Follow the [testnet-to-mainnet runbook](testnet-to-mainnet.md) for the blocking prerequisite manifest, two-phase cutover, contract containment, production verification, and compatible-graph rollback.

## Deep troubleshooting references

- [Developer guide](developer-guide.md) - canonical architecture, ownership, runtime model, and generated/authored classification.
- [Performance dossiers](performance/) - specialist loader and first-paint implementation history and evidence.
- [Webflow migration dossier](webflow-migration/README.md) - historical migration audit and planning index; current executable source wins.
- [Webflow DOM contracts](webflow-migration/03-dom-contracts.md) - specialist selector, ancestry, and CMS row evidence.
- [Webflow runtime dependency data](webflow-migration/03-runtime-dependencies.json) - machine-readable historical consumer/dependency evidence.
- [Webflow CMS image migration](webflow-cms-image-migration.md) - specialist CMS media migration reference.
