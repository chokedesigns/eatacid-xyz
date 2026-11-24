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
http://localhost:4000/collection-utility/  Collection Utility
```

Parcel may write ignored `.parcel-cache/` content. The watcher may regenerate tracked `shared/drop-params/drop-params.json` and, when the nested checkout exists, `admin-ui/src/drop-params.mirror.json`. Inspect both Git repositories before retaining those changes.

Stop the command with `Ctrl+C` in its terminal. Local Parcel development exercises the tracked local module substitutions; it is not equivalent to Pages loader-chain validation.

## 4. Drop-parameter workflow

For schedule/time regressions, run `npm run test:drop-time` from the outer repository and `npm run test:runtime` from Admin. The countdown requires browser access to `https://timeapi.io/api/time/current/zone?timeZone=UTC`; a blocked request, provider failure, stale sample, suspension, or clock discontinuity shows `TIME UNAVAILABLE` until synchronization succeeds. It retries automatically, including on visibility/resume and connectivity recovery. Do not substitute the device clock or a chain block timestamp when the reference is unavailable. This time reference affects the published countdown only; manual contract unpause remains a separate action.

The ownership chain is:

```text
shared/drop-params/drop-params.js
-> authoritative authored source

shared/drop-params/drop-params.json
-> tracked generated outer projection

admin-ui/src/drop-params.mirror.json
-> generated mirror in the independent Admin repository
```

Direct manual editing of `drop-params.js` is supported outside Admin authoring and transaction/recovery activity. Do not overlap editor saves, Git source replacement or custom file writers with those operations; use the Admin controls or transaction CLI while authoring. After a deliberate manual source change, regenerate the outer projection:

```text
npm run dropparams:json
```

This command cache-busts and validates `drop-params.js`, serializes deterministic LF-terminated JSON, and atomically writes `shared/drop-params/drop-params.json` only when its bytes differ. It does **not** update the Admin mirror.

`npm run start` runs `npm run dev:watch:params`. The watcher generates the outer JSON once at startup and after source changes, then copies those exact bytes into `admin-ui/src/drop-params.mirror.json` when the nested target exists and differs. Projection and mirroring share the repository-scoped Drop Params transaction lock with writer operations, and rapid source events are coalesced without racing a writer. Under that lock, every projection entrypoint checks the recovery journals before writing. Pending or `reconciliation_required` operations block ordinary generation and mirroring until explicit reconciliation; invalid or unreadable recovery state also blocks projection. The generator and one-shot synchronization exit unsuccessfully, and the running watcher reports stale projections without changing protected outputs. Projection never reconciles recovery state itself.

The local fallback writer uses the same lock, schema, serializer, projector, archive, and rollback implementation as later service integration:

```text
npm run dropparams:transaction -- create
npm run dropparams:transaction -- edit
npm run dropparams:transaction -- deactivate
npm run dropparams:transaction -- status
npm run dropparams:transaction -- reconcile
```

`create`, `edit`, and `deactivate` accept exactly one JSON request object on standard input. Every mutation request includes `operationId` and the exact current `expectedSourceVersion`; CREATE/EDIT also include a complete active `candidate`. The command accepts no caller-supplied paths. DEACTIVATE publishes and verifies a schema-version-1 artifact under `shared/drop-params/archive/` before resetting all three current representations to the exact inactive template. Archives are history, never current-config authority, and remain after a rolled-back deactivation.

The ignored `shared/drop-params/.drop-params.operations/` directory holds narrowly scoped local recovery journals and staging files. A failed rollback marks the writer `reconciliation_required` and blocks later mutations, generation, and mirroring. Inspect with `status`; after independently restoring or validating the recorded exact state, use `reconcile`. Do not delete an unresolved journal merely to bypass the block.

Normal apply also checks exact file ownership before each replacement and completion. An external save observed outside the expected write state reports `apply_state_diverged` in the unresolved journal and requires explicit reconciliation without automatically rolling back over that save. Preserve the external content and follow the same status/resolution/reconcile procedure below; a fresh preview alone cannot clear this block. Exact-byte re-saves remain allowed. These checks preserve edits observed at write boundaries, but do not guarantee filesystem compare-and-swap against an editor racing the final check and rename.

Recovery checks every current representation against its recorded exact base or target bytes before rollback, then rechecks ownership at each file replacement. An external edit or missing file outside those states reports `recovery_state_diverged`, preserves the current files and unresolved journal/staging evidence, and blocks later writers. Explicit `reconcile` applies the same checks; it does not force an overwrite. Preserve the external content separately, independently resolve the files to a reviewed recorded state, then reconcile and inspect status before retrying with a fresh source version/preview. Matching all recorded target files permits completion (with archive verification); matching all base files permits rollback, and an unchanged partial base/target mixture can be restored normally.

AUD-005-001 records a confirmed unsupported external-concurrency limitation: an independent save during the final ownership read or before rename can still be lost in apply or recovery. Supported service/CLI mutations, projection, watching, mirroring and reconciliation participate in the existing lock/recovery safeguards. The owner excludes concurrent direct editing from the supported authoring workflow, so this finding is not a supported-path launch blocker; no code fix or OS-enforced exclusion is claimed. See [the ownership reconciliation](../audits/AUD-005-001-source-ownership.md). Never delete unresolved journals, locks or staging to bypass recovery.

Status also reports `blocked: true` for every `pending` operation. Matching source/projection/mirror files and a released or stale lock do not prove completion: the local provider remains non-READY and the service rejects authoring previews/apply until supported reconciliation resolves the journal. Use the same `status`/`reconcile` procedure after interruption; read-only health/status/preview requests never reconcile implicitly.

For development-only Admin authoring, start from the nested Admin repository:

```text
cd admin-ui
npm run dev
```

This one command starts the Admin frontend on port 3000, both existing projection/thumbnail watchers, and the Drop Params authoring service. The service reports `READY` in the shared terminal and binds only `127.0.0.1:47831`; it accepts only the Admin development origins `http://localhost:3000` and `http://127.0.0.1:3000`. `Ctrl+C` stops the child processes together. If the same repository's service is already listening, startup reports that it is reusing it. If an unrelated process owns port 47831, startup reports `port_occupied`, terminates the other newly started children, and exits unsuccessfully instead of leaving a partial Admin development session. The standalone outer-repository command remains available for diagnostics and recovery:

```text
npm run dropparams:authoring-service
```

The Admin authoring status retries briefly while the service starts, then checks availability at a modest interval. Local Drops initializes only from a verified, representation-equal service snapshot. It moves from `OFFLINE` to `READY` without a page refresh, moves back to `OFFLINE` if the service stops while leaving the rest of Admin usable, and publishes the current snapshot when the service returns. Production Admin continues to use only its bundled static mirror.

### Admin authoring lifecycle

The authoring controls are available only in local Admin development. They edit repository files through the fixed loopback API; they do not alter live systems.

The production Admin build removes Parcel's unreachable development-only authoring chunks before running its isolation verifier. Production runtime continues to consume the bundled static mirror and has no localhost authoring transport or controls.

- **CREATE:** when no drop is scheduled, select **Schedule Drop**, complete the structured form, validate, preview the exact plan, and apply. After verified transaction success, Admin fetches the committed service snapshot, verifies its operation and `sourceVersion`, publishes it through the local provider, and re-renders immediately without a reload. A completed no-op settles immediately.
- **EDIT:** for an active drop, select **Edit Drop Params**. The form starts from the canonical values returned by the service. Validate, preview, and apply; the committed provider snapshot immediately supplies both Drops and its checklist.
- **DEACTIVATE:** for an active drop, select **Deactivate Drop**, review the archive/reset preview, and acknowledge that no on-chain mutation occurs. **Archive & Deactivate** first publishes and verifies the immutable archive, then resets the canonical source, synchronizes both projections, verifies the transaction, and publishes the exact inactive provider snapshot. The Drops empty state and development-only **Schedule Drop** control update without reload. Failure, rollback, reconciliation, and already-inactive results settle immediately without waiting for a build.

The active authority is always `shared/drop-params/drop-params.js`. `shared/drop-params/drop-params.json` is the generated outer projection, and `admin-ui/src/drop-params.mirror.json` is its exact Admin mirror. Files under `shared/drop-params/archive/` are immutable deactivation history, not active authority. Do not hand-edit projections, archives, operation journals, or lock files.

Authoring does **not** pause or unpause contracts, add or remove token pairs, fund or transmit tokens, deploy, publish, commit or push Git, mutate GitHub or Webflow, or change chain state.

### Authoring recovery

- **Service is `OFFLINE`:** allow the bounded startup retries to complete. Check the shared `npm run dev` terminal for the service result. If the child stopped, stop the full dev command with `Ctrl+C` and restart it; use the standalone service command only as a diagnostic fallback. The rest of Admin remains usable.
- **Port 47831 is occupied:** same-repository instances are reused automatically. A `port_occupied` error means the listener did not identify as this repository's service; stop or reconfigure that unrelated process, then rerun `npm run dev`. Do not bypass the fixed port or service identity checks.
- **`sourceVersion` is stale:** discard the stale preview, allow Admin to refresh canonical state, reopen the operation, and validate/preview again. Never force-apply an old preview.
- **A completed write cannot verify its committed snapshot:** the repository transaction may already have committed, so do not reapply. Inspect the reported `sourceVersion`, service health, representation equality, and transaction status. Restore service/equality health and let the bounded provider refresh recover the current snapshot; no Parcel rebuild or reload is part of synchronization.
- **Source/projection/mirror drift is detected:** stop authoring and run the supported generator/watcher flow (`npm run dropparams:json`, then Admin `npm run sync:drop-params` when required). Inspect the resulting diffs and equality before retrying. Do not hand-edit either JSON projection.
- **A transaction rolls back:** read the reported rollback result. A verified rollback preserves the pre-operation current files; inspect status and retry with a fresh source version and preview only after the cause is resolved. An archive already published by DEACTIVATE remains immutable history.
- **`reconciliation_required` is raised:** authoring stays blocked. Run `npm run dropparams:transaction -- status`, independently restore or validate the exact recorded state, then run `npm run dropparams:transaction -- reconcile`. Do not edit or delete journals, locks, projections, or archives to bypass the block.

Never hand-edit either generated JSON file. After deliberate generation, expect the outer source and projection to form one reviewable diff; if the watcher ran, separately inspect the Admin mirror diff. If generation was not intentional, stop and resolve the unexpected change rather than carrying it into another ticket.

## 5. Primary deterministic tests

Run the tests that match the changed contract. These commands do not intentionally change repository files; the Pages-artifact, Webflow-CMS, and thumbnail suites create fixtures under the operating system's temporary directory.

| Command | Run when changing | What it proves |
| --- | --- | --- |
| `npm run test:fa2-balances` | Public/Admin FA2 completeness and its Public consumers | Inert production fetch/consumer seams retain tokens after page one, reject incomplete reads, preserve genuine absence, and guard wallet/post-trade publication. Also run Admin `npm run test:runtime` and `node --experimental-vm-modules audits/repro/AUD-002-repro.mjs --balances-only` for the cross-repository BAL-001 regression. |
| `npm run test:loader-architecture` | Root routers, environment loaders, first-paint startup, or loader failure handling | Host selection, sibling artifact startup, and failure isolation match the encoded Home/Drops/Exchange/Collection Utility architecture. |
| `npm run test:pages-loader-artifacts` | Pages workflow assembly, loader provenance, or artifact verification | The verifier accepts the supported assembled graph, rejects ownership/marker/map violations, and the workflow keeps verification after map removal with no later artifact mutation. |
| `npm run test:public-trade-ops` | Shared approvals, operation confirmation, pair matching, or NFT refresh behavior | Deterministic trade-helper fixtures preserve approval fallback, confirmation matching/retry, and refresh completion rules; deadline tests bound stalled fetch/JSON/HTTP-error bodies, total retry time and late-result isolation. |
| `npm run test:drops-reveal` | Drops early paint, readiness barriers, pending states, or environment loading | The initial and wallet reveal contracts, early-shell markers, and Drops sibling loading remain coordinated. |
| `npm run test:hen-identity` | HEN IDs, registry mirrors, or network identity adapters | Canonical and Shadownet HEN IDs round-trip without altering other collections. |
| `npm run test:drop-params` | Drop Params validation, serialization, projection, writer/archive transactions, loopback authoring service, locking, generator, or watcher behavior | Strict schema rules, deterministic source/JSON output, archive-first deactivation, exact rollback/fail-closed recovery, source hashing, projection equality, service request/token security, inactive consumer compatibility, and rapid-save lock coordination remain enforced. |
| `npm run test:public-drop-compatibility` | Authored collection combinations, Public catalog/pane support, or network compatibility | Inert authoring, Admin builder, Public render-identity and exact pair-lookup seams accept supported configurations and reject unsupported publication/trades without configuration writes. Use `node --test --experimental-test-isolation=none shared/drop-params/drop-params-projection.test.mjs` to exercise writer/service/watcher recovery in disposable repository fixtures; these tests do not mutate real canonical files or mirrors. |
| `npm run test:webflow-cms` | Webflow CMS list pagination, image tooling, retry/mutation handling, publication comparison, or evidence persistence | Staged/live item and asset listings require valid totals/offsets/limits, stable totals, unique row identities (item ID plus locale, or asset ID), and complete enumeration; invalid reads reject and fresh calls can recover. Request safety, ambiguity handling, content comparison, deterministic naming, and credential redaction behave as encoded. |
| `npm run test:thumbs` | Thumbnail conversion, input/backfill workflow, or Windows launchers | Image normalization, safe archival/rollback, backfill reporting, and launcher behavior remain deterministic. |

`npm run test:home-first-paint` is a compatibility alias for `test:loader-architecture`, not a separate validation layer.

AUD-005-001's unsupported external-save demonstrations are opt-in historical evidence, outside normal test discovery and verification gates: `npm run evidence:drop-params:external-concurrency` runs the preserved assertions in disposable fixtures and currently exits 1 with nine passing controls and six failing preservation assertions. Those failures remain failures; they are not passing regressions or evidence of a code fix. The supported-path service/CLI contention check remains in `shared/drop-params/drop-params-projection.test.mjs` alongside projection/recovery regressions.

### Public applied-trade recovery

A confirmed trade retains its `applied` journal receipt until a complete holdings read provides post-operation evidence for every exact traded token. `RETRY BALANCES` reads holdings again, and re-polls the captured hash if an older receipt lacks usable operation block evidence. It never constructs or sends another trade. Reload/reconnect preserve the receipt. Never delete browser receipts to bypass this gate.

A current incoming transfer of the same token can offset or exceed the burn. Recovery therefore compares the balance row's `lastLevel` to the attributed operation's `level`, rather than requiring a net decrease. Both values must be positive safe integers; all matching submitted top-level calls must agree on one block. Every traded identity needs an explicit row for the exact owner from the configured TzKT complete reader. A zero balance with valid attribution can recover; an omitted row cannot.

The provider basis is TzKT source revision `047ac70ffdec0aa5f6260a68f73da6438e3d8457`: [block processing](https://github.com/baking-bad/tzkt/blob/047ac70ffdec0aa5f6260a68f73da6438e3d8457/Tzkt.Sync/Protocols/ProtocolHandler.cs#L55) commits the block and post-processing in one database transaction; [token accounting](https://github.com/baking-bad/tzkt/blob/047ac70ffdec0aa5f6260a68f73da6438e3d8457/Tzkt.Sync/Protocols/Handlers/Proto5/Commits/TokensCommit.cs#L694) updates each balance and its `LastLevel` together; [API balance reads](https://github.com/baking-bad/tzkt/blob/047ac70ffdec0aa5f6260a68f73da6438e3d8457/Tzkt.Api/Repositories/TokensRepository.cs#L281) select the balance and that same row's `LastLevel`. This supports interpreting a row changed at or after the applied block as reflecting that block, including incoming transfers within the same block. It does not establish deployed service version, provider honesty, finality or a single atomic snapshot across paginated HTTP responses. Existing confirmation/finality assumptions remain unchanged. An indexer head observation, an operation receipt, or an HTTP success alone does not date the holdings response.

If freshness remains unverified, keep the receipt and use the existing balance retry after provider recovery. Precise missing guarantees include: omitted traded rows lack a snapshot-level watermark proving post-operation absence; missing/invalid `lastLevel` cannot attribute a row to the applied block; missing/inconsistent operation levels cannot establish that block. Repeated reads and elapsed time cannot repair missing evidence. Such providers/responses stay fail-closed until they supply supported evidence; there is no manual balance-based bypass.

Run `npm run test:public-trade-freshness` (also preserved as `node audits/repro/AUD-008-public-net-balance-repro.mjs`) for corrective reader, journal, poller and actual Drops/Exchange consumer evidence. Fixtures are disposable and inert; they do not verify a live wallet, chain or hosted indexer.

### Thumbnail input coordination and recovery

`npm run thumbs:input` and Admin's standalone `npm run gen:thumbs` serialize manifest writers across collections and Node processes using the exclusive directory `admin-ui/src/.thumbs.manifest.js.input.lock`. For imports, the lock covers pending-input inspection, key selection, conversion, manifest snapshot/regeneration, source archival, and rollback. Standalone generation acquires the same lock before scanning masters and holds it through the manifest write. Imports invoke the generator in-process with a live capability for that exact manifest; no CLI flag, environment variable, or copied owner record bypasses acquisition. A contender waits up to five seconds, then reports failure without changing transaction files. Ordinary completion and successful rollback release the lock; failed rollback, uncertain file cleanup, failed standalone writes, or interruption leave it blocking further writers. `owner.json` identifies the owner with a random token, PID, and start time. Age or an absent PID never establishes that recovery is safe.

For a retained lock, stop thumbnail import processes and any generator children before recovery. Preserve the lock and asset evidence, inspect pending inputs, masters, processed sources, and manifest together, and independently reconcile the interrupted transaction. Standalone manifest generation also waits or fails on this retained lock; it cannot perform recovery. After reconciliation, use Admin's read-only `npm run check:thumbs` to verify the manifest against masters; also verify the intended pending/archived source state. Remove only the exact reviewed thumbnail lock directory after confirming no owner or generator remains and recovery is complete. Do not delete a lock merely to retry an uncertain import. This procedure does not apply to Drop Params recovery state.

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
4. build the six current `webflow/` Parcel entries without content hashes or scope hoisting.

Staging output goes to ignored `dist/staging/`; production output goes to ignored `dist/prod/`. Branch-local output retains Parcel source maps for local analysis. The GitHub Pages workflow removes maps only after it combines both branch builds.

Use the staging build for normal ticket validation. Use the production build when a production-shaped branch-local build is specifically relevant, such as promotion preparation. Neither command creates the final assembled Pages artifact: stable root routers and environment loaders are added by the Pages workflow, or partially copied by loader-chain sanity.

## 7. Direct Pages sanity

Run:

```text
npm run pages:sanity
```

The command:

1. produces a staging build in `dist/staging/`;
2. creates ignored `pages-sanity/home.html`, `drops.html`, `exchange.html`, and `collection-utility.html` from the four tracked Webflow-derived shells;
3. strips tracked local application module tags and any prior harness injection;
4. injects direct `../dist/staging/{surface}.js` application artifacts;
5. starts `npx serve . -l 8080` through `cmd.exe` and opens all four sanity URLs in the default browser.

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
/collection-utility.js
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

The workflow requires all four root routers from `main`. It removes maps only after final assembly, verifies that zero `.map` files remain, then runs provenance verification. No step mutates the assembled `dist/` graph between that verifier and artifact upload. Branch-local `dist/prod/` and `dist/staging/` builds retain their source maps.

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
| `ticket.<identifier>.<repo>.diff`, `ticket.<identifier>.<repo>.stat.txt` | Generated review exports in each repository root; ignored | `npm run ticket:diff` overwrites only the invoking repository's pair for its current `ticket-<identifier>` branch (`<repo>` is `outer` or `admin`). Remove only the exact artifacts when review no longer needs them. |
| `shared/drop-params/drop-params.json` | Generated by `npm run dropparams:json`; tracked | Regenerate from `drop-params.js`; do not delete or hand-edit it. A freshness diff is an error in CI unless the source and projection are committed together. |
| `shared/drop-params/.drop-params.operations/` | Local transaction journal/staging; ignored | Use `npm run dropparams:transaction -- status` and `reconcile`; never remove unresolved state to bypass a fail-closed block. Completed/rolled-back records may be retained for idempotent retry evidence. |
| `shared/drop-params/archive/*.json` | Immutable deactivation history; created exclusively by the writer | Do not edit, replace, or use as current configuration. A matching verified artifact may be reused only by the same operation ID. |

Before cleanup, use `git status --short` in both repositories. Prefer the scoped scripts above; do not use broad recursive cleanup against the workspace.

## 16. Refreshing Webflow-derived HTML/reference material

This procedure refreshes the four Git-tracked development/sanity shells:

```text
index.html
drops/index.html
exchange/index.html
collection-utility/index.html
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
6. **Verify the intended page.** Check the URL, Home/Drops/Exchange/Collection Utility surface, expected content, publish freshness, and Webflow site/page identity where observable.
7. **Compare; do not blindly overwrite.** Diff the captured HTML against the corresponding tracked shell. Separate Webflow-origin changes from Git-owned local substitutions and sanity integration. Preserve or deliberately reapply the supported local module entries: Home uses `./shared/public-first-paint.js` and `./shared/beacon-setup.js`; Drops, Exchange, and Collection Utility use their local `js/main.js`. The sanity generator depends on recognizing and replacing these entries.
8. **Review DOM/class contract impact.** For meaningful changes, inspect selectors, IDs/classes, CMS/list structure, element ancestry, runtime-required elements, and hosted CSS/runtime dependencies. Use the historical/specialist [Webflow DOM contracts](webflow-migration/03-dom-contracts.md) and [runtime dependency data](webflow-migration/03-runtime-dependencies.json) as evidence, then verify against current consumers.
9. **Validate every affected surface.** Home-only success does not prove Drops, Exchange, or Collection Utility. Run relevant deterministic tests and builds, direct sanity to isolate bundle/runtime behavior, and loader-chain sanity when the deployed integration graph could be affected.
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

After an intended patch is stable, run the review exporter from each affected repository:

```text
npm run ticket:diff
```

It derives `<identifier>` from the full suffix of the current `ticket-<identifier>` branch and writes only the invoking repository's pair directly in its root. Repeated exports on that branch overwrite the same Git-ignored files:

```text
Outer: ticket.<identifier>.outer.diff
       ticket.<identifier>.outer.stat.txt
Admin: ticket.<identifier>.admin.diff
       ticket.<identifier>.admin.stat.txt
```

The diff captures combined staged, unstaged, and nonignored untracked content relative to `HEAD`, including new files and Git binary patches. Private temporary Git state preserves the real index, HEAD, branch, and source contents. Unchanged repositories produce empty diff and stat files. The artifacts and exporter lock are ignored and excluded from subsequent exports. Cross-repository tickets require a separate invocation in Outer and Admin.

Failures are reported with a nonzero exit, including detached HEADs and branch names that do not match the supported ticket naming convention. After acquiring its output lock, a failed run removes only the current ticket's pair to avoid stale or partial evidence. Use artifacts only after a successful run. Temporary Git state is cleaned up; the ignored `.ticket-diff.lock` file remains for reuse. Other tickets' exports and older naming formats are left untouched. See [the universal Codex workflow](codex-workflow.md) for ticket ownership, review, and the required compact completion handoff with actual commands/outcomes, skipped checks, exact export filenames, and final Git state.

## Mainnet operations boundary

Ordinary deployment and rollback procedures in this guide are not sufficient for network cutover. Production currently defaults to the `testnet` registry slot configured for Shadownet. Follow the [testnet-to-mainnet runbook](testnet-to-mainnet.md) for the blocking prerequisite manifest, two-phase cutover, contract containment, production verification, and compatible-graph rollback.

## Deep troubleshooting references

- [Developer guide](developer-guide.md) - canonical architecture, ownership, runtime model, and generated/authored classification.
- [Performance dossiers](performance/) - specialist loader and first-paint implementation history and evidence.
- [Webflow migration dossier](webflow-migration/README.md) - historical migration audit and planning index; current executable source wins.
- [Webflow DOM contracts](webflow-migration/03-dom-contracts.md) - specialist selector, ancestry, and CMS row evidence.
- [Webflow runtime dependency data](webflow-migration/03-runtime-dependencies.json) - machine-readable historical consumer/dependency evidence.
- [Webflow CMS image migration](webflow-cms-image-migration.md) - specialist CMS media migration reference.
