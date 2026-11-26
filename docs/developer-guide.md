# EATACID.xyz developer guide

## Purpose and scope

This is the canonical current-state guide to the outer/public runtime. It explains source ownership, repository boundaries, major runtime relationships, and the verification architecture so a contributor can determine what owns a change. Use the [testnet-to-mainnet runbook](testnet-to-mainnet.md) for network cutover procedure.

This guide is not a historical ticket log, a day-to-day command runbook, the testnet-to-mainnet cutover procedure, or Admin implementation documentation. Use the [operations guide](operations.md) for supported procedures. Specialist dossiers remain useful evidence, but executable source and configuration are authoritative for current behavior.

## Repository and Git boundaries

```text
eatacid-xyz/       outer Git repository and public runtime
├─ admin-ui/       independent nested Git repository
└─ contracts/      contract-specific implementations and documentation
```

The outer repository and `admin-ui/` have separate Git roots, branches, status, and history. Outer scripts may produce configuration for Admin: the drop-parameter watcher mirrors generated JSON to `admin-ui/src/drop-params.mirror.json`. That is a cross-boundary data flow, not permission to edit Admin implementation as part of an outer ticket. Always inspect both repositories after running a watcher or generator that crosses the boundary.

The outer `shared/chain-registry.js` also defines an Admin-oriented validator, but Admin implementation and its consumption rules remain outside this guide. The `contracts/` subtree owns smart-contract concerns; use its scoped documentation rather than treating public JavaScript as contract authority.

## Public surfaces

| Surface | Tracked local/Webflow-derived shell | Local development entry | Pages/Webflow deployment entry | Principal runtime modules |
| --- | --- | --- | --- | --- |
| Home | `index.html` | Shell modules `shared/public-first-paint.js` and `shared/beacon-setup.js` under Parcel serve | Stable `/home.js` router; full Parcel source `webflow/home.js` | Shared first-paint and wallet lifecycle |
| Drops | `drops/index.html` | `drops/js/main.js` | Stable `/drops.js` router; early/full Parcel sources `webflow/drops-first-paint.js` and `webflow/drops.js` | `drops/js/events.js`, reveal coordination, shared wallet/trade modules, drop parameters |
| Exchange | `exchange/index.html` | `exchange/js/main.js` | Stable `/exchange.js` router; full Parcel source `webflow/exchange.js` plus shared early first paint | `exchange/js/exchange.js`, shared wallet and trade modules |
| Collection Utility | `collection-utility/index.html` | `collection-utility/js/main.js` | Stable `/collection-utility.js` router; full Parcel source `webflow/collection-utility.js` plus shared early first paint | Six image/spinner reveal pairs, shared first-paint, and shared wallet lifecycle |

The tracked shells are snapshots used for local development and generated sanity pages. They retain Webflow DOM, CMS rows, hosted CSS, runtime scripts, assets, and fonts, but they substitute local module entries for the stable GitHub Pages URLs used by the live Webflow pages.

## Source and Parcel entrypoints

The current `build:pages:staging` and `build:pages:prod` scripts define six public Parcel entries:

1. `webflow/first-paint.js`
2. `webflow/drops-first-paint.js`
3. `webflow/home.js`
4. `webflow/drops.js`
5. `webflow/exchange.js`
6. `webflow/collection-utility.js`

These roles are distinct:

- `index.html`, `drops/index.html`, `exchange/index.html`, and `collection-utility/index.html` are tracked local shells and are the HTML entries used by `npm run start`.
- `shared/public-first-paint.js`, `shared/beacon-setup.js`, `drops/js/main.js`, `exchange/js/main.js`, and `collection-utility/js/main.js` are local runtime entries referenced by those shells.
- `webflow/*.js` files are authored Pages deployment entries. They assemble the dependency graph Parcel emits for live use.
- `dist/prod/*.js` and `dist/staging/*.js` are generated Parcel artifacts. They are ignored locally and assembled by CI for Pages.

Because Pages builds the two branch refs independently, the exact entry graph deployed under `prod/` is the graph present on `main`, and the graph under `staging/` is the graph present on `staging`. The checked-out source has six entries; the current `main` ref still has the earlier four-entry graph until the Drops early-paint and Collection Utility work reach `main`.

## Stable root-router architecture

`loaders/root/home.js`, `loaders/root/drops.js`, `loaders/root/exchange.js`, and `loaders/root/collection-utility.js` back the stable public module URLs `/home.js`, `/drops.js`, `/exchange.js`, and `/collection-utility.js`. The Pages workflow always takes these router sources from `main`, so one stable layer selects both environments.

Each router reads `window.location.hostname`. The exact production hostname set is `eatacid.xyz` and `www.eatacid.xyz`; those hosts select `./prod`. Every other hostname, including staging and localhost, selects `./staging`. The router then imports the surface-specific `{surface}-loader.js` and isolates loader failures.

Stable routers let Webflow keep permanent module URLs while Git can deploy separate prod and staging loaders and artifacts behind them. They own environment selection only. First-paint sequencing, wallet startup, and page behavior belong below this boundary.

## Environment loaders and artifact ownership

`loaders/environment/` contains one loader per surface. Each loader imports only same-directory artifacts and starts sibling imports without awaiting one before the other:

```text
main
-> main-owned stable root routers
-> /prod/*-loader.js from main
-> /prod/* Parcel artifacts freshly built from main

staging
-> the same main-owned stable root routers
-> /staging/*-loader.js from staging
-> /staging/* Parcel artifacts freshly built from staging
```

Home, Exchange, and Collection Utility start the shared `first-paint.js` artifact concurrently with their full application artifact. The current Drops loader starts `drops-first-paint.js` concurrently with `drops.js`. Each import has separate synchronous and asynchronous failure handling.

On a push to `main` or `staging`, `.github/workflows/pages.yml` checks out both refs, installs each ref independently, and builds production from `main` and staging from `staging`. It then assembles one Pages artifact: stable routers and prod loaders come from `main`; staging loaders come from `staging`; referenced bundles come from their corresponding builds. It removes source maps and verifies file equality, loader references, required markers, and provenance before upload.

Production is a fresh build from `main`. Tested staging bundle bytes are not copied unchanged into production.

For the current branch workflow and post-deployment checks, see [staging deployment](operations.md#10-staging-deployment), [production promotion](operations.md#11-production-promotion), and [deployment verification](operations.md#13-deployment-verification).

## First-paint and full-application split

The early path is deliberately much smaller than the Beacon- and feature-bearing application path.

`webflow/first-paint.js` imports only `shared/public-first-paint.js`. Home, Exchange, and Collection Utility environment loaders start that artifact beside their full application artifact. Their full entries retain a first-paint import as a fallback; a global singleton guard prevents duplicate coordinator startup.

`shared/public-first-paint.js` owns shared reveal behavior. It applies the current testnet presentation, waits within bounded font and Home hero-image readiness windows, and reveals ready or fallback state. A 1,300 ms fail-open timer prevents the surface from remaining hidden indefinitely, and the error path also forces an inline reveal.

Drops uses `webflow/drops-first-paint.js`, which starts the shared coordinator and installs small pending-region CSS. The full Drops runtime independently resolves drop parameters/countdown, redeem metadata/supply, and wallet-derived rows. `drops/js/reveal-coordinator.js` commits the initial parameter/redeem region only after its required independent results are ready and uses a repeatable wallet pending state for account projections. This prevents unresolved Webflow placeholder or CMS content from being presented as authoritative merely because the outer shell can paint early.

Early and full imports are failure-isolated: failure of one does not prevent the other from starting. This preserves a bounded reveal path while keeping wallet, chain, transaction, and page application code out of the small early graph.

For implementation history and evidence, see [early Home first paint](performance/PERF-2.early-home-first-paint.md), [loader isolation](performance/PERF-2B.staging-loader-isolation.md), [Exchange early first paint](performance/PERF-3A.exchange-early-first-paint.md), [Drops early first paint](performance/PERF-3B.drops-early-first-paint.md), and [Drops coordinated reveal](performance/PERF-3C.drops-coordinated-region-reveal.md). These are historical dossiers; this guide is the current architecture summary.

## Shared runtime modules

| Module | Owns | Major consumers | Does not own |
| --- | --- | --- | --- |
| `shared/network.js` | Supported-slot selection, the default `testnet` slot, optional `process.env.NETWORK` selection, and active RPC/TzKT projections | First paint, Beacon, Drops, Exchange, Collection Utility | Addresses, per-surface validation, or cutover procedure |
| `shared/chain-registry.js` | Per-slot labels, Beacon/RPC/TzKT values, collection addresses, escrow configuration, pair-map paths, mirror maps, resolution helpers, and validators | `network.js`, Drops/Exchange configs, Admin-facing shared validation | Runtime network switching or proof that a configured slot is cutover-ready |
| `shared/beacon-setup.js` | One shared `DAppClient`, permission/connect/disconnect lifecycle, active-account network validation, public wallet state, wallet controls, and TzKT NFT balance reads | Home, Drops, Exchange, Collection Utility | Page-specific filtering, cart state, or transaction construction |
| `shared/tzkt-fa2-balances.js` | Complete FA2 balance pagination with bounded reads and exact row identity validation | Shared Public wallet reads, independent Exchange reads, Admin `getFa2Balances` | Wallet lifecycle publication, eligibility, or financial calculations |
| `shared/public-first-paint.js` | Shared network class/banner state, bounded font/hero readiness, reveal/fallback behavior, and duplicate-start protection | Early entry, with full-entry fallbacks | Drops-specific authoritative-region readiness or application boot |
| `shared/public-trade-ops.js` | TzKT pair lookup, operator-approval construction, retained submitted receipts, scoped confirmation polling, and post-trade NFT refresh polling | Drops and Exchange transaction flows | Page-specific cart/payload composition, modal lifecycle, or wallet send request |
| `shared/drop-params/drop-params.js` | Authored Drops schedule, display/mechanics, burn eligibility/exclusions, redeem identity, and mirror-network metadata | Drops runtime; JSON generator; Admin projection | Chain endpoints, addresses, live pause state, or live redeem supply |
| `shared/drop-params/drop-params-authoring.mjs` | Strict operation-aware authored schema, exact inactive template, deterministic full-source serialization, and source/candidate hashing | Drop Params writer and loopback authoring-service operations; focused tests | Applying mutations, archive/deactivation policy, or Admin UI state |
| `shared/drop-params/drop-params-projector.mjs` | Cache-busted canonical import, deterministic projection, atomic allowlisted replacement, outer/Admin equality verification, the shared transaction lock, and recovery-gated projection | Generator, watcher, and writer operations | Changing canonical authority or accepting arbitrary paths/source text |
| `shared/drop-params/drop-params-archive.mjs` | Version-1 immutable deactivation archive construction, validation, create-exclusive publication, collision handling, and read-back verification | Drop Params deactivation transactions | Current-config authority, live-chain state, or archive replacement/deletion |
| `shared/drop-params/drop-params-recovery.mjs` | Shared read-only journal validation and unresolved-recovery gate; no implicit recovery | Writer status/reconciliation and every ordinary projection entrypoint under the transaction lock | Restoring files, clearing journals, or authorizing reconciliation |
| `shared/drop-params/drop-params-transaction.mjs` | Fixed-path CREATE/EDIT/DEACTIVATE transactions, exact-byte rollback, local operation recovery, and fail-closed reconciliation | Local CLI and loopback authoring service | HTTP/session semantics, Admin UI, chain/wallet operations, or deployment |
| `shared/drop-params/drop-params-authoring-service.mjs` | Loopback/Host/Origin/nonce request boundary, verified current snapshots, strict validation, exact preview plans, short-lived single-use tokens, transaction delegation, and same-repository listener identification | Development-only Admin Drop Params provider/authoring client and Admin dev startup | Generic file/command access, chain/wallet writes, Git/Webflow/cloud writes, deployment, or production startup |

Projection APIs acquire the transaction lock before checking recovery state and writing outputs. Calls within `withDropParamsLock` reuse that call chain's active ownership; `lock: false` requires that scope and cannot bypass recovery checks. The writer retains its explicit reconciliation and rollback write paths.

Writer-lock claims publish complete `choosing` metadata using a same-directory, no-replace hard link from a written, synced, closed private staging file. Staging names are never claims. Phase changes replace complete metadata atomically, so a supported visible claim always identifies its live PID until release or process death. Invalid-metadata reclamation therefore cannot race a supported delayed publisher's revival: before publication there is no claim to reclaim, and afterward PID liveness protects it. Dead processes cannot resume; PID reuse conservatively blocks reclamation rather than granting ownership. Ticket selection and token tie ordering remain unchanged. Acquisition verifies its own snapshot before phase replacement and critical-section entry; release/error cleanup removes only the expected snapshot. Missing/replaced claims fail with `lock_ownership_lost`, and optional `lockOptions.signal` cancellation removes only the cancelling acquisition's claim.

This protocol assumes unique per-acquisition UUID tokens, a coherent local filesystem, and contenders in one host/PID namespace. It relies on [Node's hard-link operation](https://nodejs.org/download/release/v22.16.0/docs/api/fs.html#fspromiseslinkexistingpath-newpath), [POSIX atomic directory operations](https://pubs.opengroup.org/onlinepubs/9799919799/functions/V2_chap02.html#tag_16_09_07) on Linux, and [Windows NTFS hard links](https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-createhardlinkw). Unsupported hard links fail closed; there is no create-then-write fallback. Private files abandoned by process death are ignored, not promoted or swept by other acquisitions. Stop old writer/generator/watcher processes before upgrading: mixed versions with the former incomplete-publication protocol, shared network volumes, external claim edits/removal and machine/power-loss durability are not covered. Snapshot reads are detection/cleanup guards, not filesystem compare-and-swap; exclusivity under supported contention follows from complete publication, live-PID protection and distinct claim paths. The accepted AUD-005-001 external-edit limitation and journal recovery procedure remain unchanged.

Normal writer apply checks every representation against its expected exact bytes immediately before each replacement and before recording completion. Only the writer's successful replacements advance that expected state from base to target. Divergence blocks automatic rollback and preserves current files and journal/staging evidence as `reconciliation_required`, including an external save matching a recorded base or target at the wrong write boundary. These checks do not provide filesystem compare-and-swap against an uncoordinated edit racing the final check and rename.

Writer rollback and reconciliation validate recorded recovery snapshots and require each observed file to match its exact recorded base or target state before destructive recovery. Rollback rechecks that state immediately before replacement and skips files already observed at base. Observed divergence preserves current content and unresolved journal/staging evidence as `reconciliation_required`. These recovery checks also have a read-to-rename window: an uncoordinated save during the final source read can be overwritten by restored base bytes. Resolved records alone release staging evidence and permit later writers. Canonical authority, the shared lock, archive-first deactivation, and strict final representation equality remain enforced.

Supported source mutations use the Admin authoring service or local transaction CLI, both delegating to the locked transaction writer. Generation, watchers and Admin synchronization use the guarded projector; rollback and explicit reconciliation retain the transaction lock. Direct manual saves, Git source replacement and custom uncoordinated writers must not overlap authoring/apply/recovery. Manual source editing outside that activity remains supported, followed by the existing generation/mirroring flow.

AUD-005-001 is a confirmed unsupported external-concurrency limitation under this ownership contract, not a code fix or a launch blocker for supported paths. The shared claim lock does not exclude ordinary editors, and read/check/rename is not filesystem compare-and-swap. [The ownership reconciliation](../audits/AUD-005-001-source-ownership.md) records the caller inventory, preserved historical failures and opt-in evidence command. No broker or permissions boundary is implemented.

Writer status uses the same unresolved-journal rule as projection: both `pending` and `reconciliation_required` set `blocked`, even when every file matches and no writer owns the lock. The authoring service passes that state to the local provider and rejects preview/apply while blocked; only resolved journals permit a new READY provider snapshot. `service.status` describes service availability, while `writer.blocked` independently gates authoring readiness.

`shared/drop-time.js` centralizes validation and conversion of configured drop date/time values. `shared/public-logger.js` provides explicitly gated public diagnostics. They are supporting shared concerns rather than configuration authorities.

The normal nested Admin `npm run dev` command uses the existing cross-platform process runner to start its frontend, projection watchers, and the loopback Drop Params authoring service as one fail-fast process group. In local development, a provider fetches the service's verified, representation-equal snapshot before initializing Drops and supplies that same immutable params object to the Drops controller and checklist. Successful authoring refreshes that provider against the committed operation and `sourceVersion`, then re-renders without waiting for Parcel, HMR, page reload, or a build marker. Bounded health retries publish a later READY snapshot after an initial outage while the rest of Admin remains usable. Production Admin uses only the bundled `src/drop-params.mirror.json` provider; after Parcel emits the statically unreachable development split point, the production build removes those development-only authoring chunks and the isolation verifier rejects any remaining authoring transport, controls, or chunk files.

## Network configuration architecture

The supported public slots are `testnet` and `mainnet`. `shared/network.js` currently sets `DEFAULT_NETWORK` to `testnet`, and both current `main` and `staging` refs share that value. In `shared/chain-registry.js`, the registry slot named `testnet` is labeled Shadownet and owns the native Beacon `shadownet` value plus its RPC, TzKT, collection, escrow, pair-map, range, and mirror configuration. The `mainnet` slot separately holds configured mainnet values.

`shared/network.js` accepts an optional `process.env.NETWORK` value at build/evaluation time and rejects unsupported slot names. There is no browser UI or browser-time network switch. The repository ignores `.env*`, no dotenv loader or required environment variable appears in the runtime/build scripts, and the normal checked-in contract therefore does not require an active `.env` file. An explicitly supplied supported `NETWORK` value is an override, not a general `.env` configuration system.

`shared/chain-registry.js` is the authority for RPC/TzKT/Beacon values, collection identities, mirrors, and escrow configuration. Its validators fail closed at the application surface when required data is missing. Drops resolves a surface-specific escrow with a legacy top-level fallback; Exchange requests strict surface-specific escrow resolution and does not accept that fallback. Page config modules project the active registry data into their runtime shape.

The `mainnet` slot demonstrates configured capability only. Some mainnet-required public values remain empty, and the validators expose that incompleteness. Configured mainnet capability is not mainnet cutover readiness.

## Wallet lifecycle

`shared/beacon-setup.js` initializes or reuses `window.dAppClient` with the Beacon network derived from the active registry slot. It performs a narrowly scoped migration of known legacy Beacon Matrix transport keys when an old stored SDK version proves that cleanup is needed.

The shared lifecycle:

- presents a pending state while it reads the active Beacon account;
- requests permissions through the shared client and deduplicates concurrent connect requests;
- verifies that an active or newly emitted account matches the configured Beacon network;
- binds boot and runtime account reads to their initiating lifecycle generation, retires superseded observations before network validation, and suppresses disconnected publication if cleanup loses authority while clearing;
- clears a current wrong-network active account and publishes disconnected state;
- clears the active account on disconnect and dispatches the legacy `walletDisconnected` event;
- publishes `{status, account, nftsPromise}` through `publicWalletStateChanged` and exposes the current state to late consumers;
- reads FA2 balances from the active slot's TzKT endpoint without blocking the connected-address UI.

A wallet lifecycle generation prevents an older startup or runtime read from overwriting a newer account event. Exported verification helpers return `null` if their generation changes during verification, including for same-network accounts. The supplied-account helper binds authority at invocation; callers must still guard any earlier asynchronous observation and later use. Beacon's `clearActiveAccount()` has no conditional-clear or cancellation API: our guards prevent obsolete cleanup from starting and suppress its late application-side disconnected publication, but cannot undo an SDK clear already in progress. If that clear later emits a null-account event, the event remains authoritative. Drops and Exchange maintain their own address/generation guards so late NFT results cannot commit after wallet authority changes. Page modules consume shared wallet state, then own their own row filtering, balances, selections, carts, and failure presentation.

Public FA2 reads use ascending balance-row IDs in 100-row pages through `shared/tzkt-fa2-balances.js`. A short valid page establishes completeness; request/body timeouts (15 seconds per page), malformed data, repeated/nonadvancing rows, and the 200-page safety cap reject the whole read. Token IDs and quantities remain unchanged. Only complete retrieval can establish absence for supply, holdings, or post-trade reconciliation; callers retain their existing unknown/retry handling and lifecycle guards across all pages.

## Drops architecture

The tracked/live Webflow shell supplies CMS-derived burn/redeem rows and the DOM contract consumed by `drops/js/events.js`. `shared/drop-params/drop-params.js` is the authored authority for whether a drop is scheduled, its date/time and mechanics, enabled burn collections and exclusions, and the redeem token. Its JSON file is a generated projection, not a second authoring source.

Canonical configuration validity and scheduling are distinct. `dropScheduled:false` means **NO DROP SCHEDULED**. The canonical validator accepts either the exact empty `INACTIVE_DROP_PARAMS` template or an otherwise valid complete authored configuration with that flag. Populated unscheduled content remains subject to its schema and registry validation; it must not be silently cleared or treated as an active Drop. Source identity, projection equality, locking, and recovery safeguards still apply.

In either false configuration, populated fields do not make Drop actions eligible. Public's schedule gate shows the no-drop state and returns before full Drops initialization. Normal Admin CREATE/EDIT publishes scheduled configurations (`dropScheduled:true`); normal DEACTIVATE archives the previous scheduled Drop and resets the source and both projections to the exact empty inactive template. That reset result is one valid unscheduled shape, not the definition of every unscheduled source.

The current Admin providers do not support the full canonical domain: they require every false snapshot to match the empty template. A valid populated unscheduled snapshot therefore throws `invalid_snapshot` during production provider creation or leaves the development provider in `ERROR` with null params, preventing Drops initialization. [AUD-011 B2-002](../audits/AUD-011-findings.md#aud-011-b2-002--valid-unscheduled-canonical-content-prevents-admin-initialization), tracked as remediation Checklist 0.2, records this still-unfixed provider limitation; it does not make the canonical source invalid.

Active authoring and the Public runtime share `shared/public-drop-compatibility.js`. The current surface admits exactly one enabled HEN or INTRODUCTIONS burn and an INTRODUCTIONS or CANAAN redeem, with distinct burn/redeem FA2 contracts. The shared eligibility rule rejects HEN redemption regardless of token-ID form or scheduling, including authored configurations and externally supplied Public configurations. Admin redeem choices and authoring-service redeem capabilities use the same rule; HEN remains in burn choices. Existing collection-policy design records describe current burn roles and future new-work restrictions but do not supply a complete current redeem eligibility matrix; no additional collection restriction is inferred here. Addresses and token mirrors still come only from `shared/chain-registry.js`. Other registry collections and multiple enabled burns fail active authoring before preview/publication and before Public wallet operations. Active `mirrorNetwork` must match the selected, configured Public network from `shared/network.js`; it does not switch Public's network. Disabled rows and unscheduled/inactive content otherwise keep their existing schema rules. Redeem token IDs are exact network IDs in lookup and payloads; inverse mirror lookup is used only to locate canonical CMS presentation rows.

`shared/drop-time.js` resolves the published schedule to one absolute instant. Existing CST/EST/PST authoring values denote the seasonal zones America/Chicago, America/New_York, and America/Los_Angeles. The schedule zone's DST rules apply regardless of the viewer's timezone; nonexistent spring times and ambiguous autumn times return `BAD_DATE_TZ` because the current schema cannot disambiguate them. Calendar-date labels use UTC calendar fields rather than viewer offsets.

Public Drops and Admin use `shared/drop-countdown.js` to count down to that published instant. Its HTTPS TimeAPI UTC reference is independent of the device clock; responses are requested without caching and with a unique nonce. Synchronization applies midpoint latency compensation, rejects round trips above 1.5 seconds, refreshes every 30 seconds, and expires samples after 60 seconds. Monotonic elapsed time advances a sample with a conservative 1000 ppm drift allowance. The device wall clock only detects discontinuities, never supplies countdown time. Lifecycle changes, delayed ticks, clock discontinuities, failed synchronization, and an uncertain boundary display `TIME UNAVAILABLE`; retries run every five seconds and resume/connectivity events require a fresh sample. Admin preview consumes the same time snapshot instead of recalculating from its own clock. HTTPS establishes the provider identity; absolute accuracy still depends on that provider and the browser's clock facilities, not on independent NTP verification by this static client.

The countdown targets the published schedule, not contract eligibility. Confirmed schedule expiry enters the standby/pause polling flow. An administrator still manually unpauses the escrow; that separate chain authority determines `LIVE NOW!`. One owned, serial escrow poll continues throughout LIVE, using the existing three-second delay between observations and bypassing the browser cache. Each storage fetch and body read has a ten-second deadline. A successful HTTP response with boolean `paused === false` is required for LIVE; later pauses or HTTP, status, parsing, transport, timeout, or network-configuration failures retire LIVE and trading eligibility until verified recovery. Unpause transitions refresh current wallet holdings, then re-read pause before publishing LIVE; unchanged LIVE observations do not repeat the holdings refresh. Owner replacement and pagehide revoke eligibility and abort pending reads/retries; a cached-page return creates a fresh owner. Countdown synchronization does not send operations or alter release logic.

`drops/js/events-config.js` combines the active network with registry-owned collections, mirror maps, and resolved Drops escrow configuration. `events.js` stamps CMS rows with contract/token identity, clones configured mirrored rows where required, filters rows against enabled parameters and wallet balances, and updates owned counts. Mirror behavior comes from explicit registry maps; it is not inferred from display order or title.

Burn exclusions name canonical token IDs. Public applies them when resolving canonical CMS identities to native wallet IDs, never directly to translated wallet IDs. Shadownet rendering requires a valid, unambiguous mirror; missing entries cannot become identity translations. Rendered rows retain the exact native contract/token identity for selection and transactions, and the empty state reflects the rows actually rendered. The historical `audits/repro/AUD-007-exclusion-identity-repro.mjs` entrypoint is maintained positive cross-consumer evidence (`npm run test:exclusion-identity`), including supported writer admission in a disposable copy.

Drops accepts only safe nonnegative integer burn balances, including each row and its aggregate per token identity. Malformed or overflowing holdings keep wallet rows unavailable. Selection validates the complete displayed count, and the final pre-wallet reservation validates captured balances and quantities against the same journal invariants used on reload; an invalid new receipt is never written. Existing corrupt journals remain retained and block trading.

The runtime independently resolves configured parameter/countdown state, escrow pause state, redeem metadata/image, live redeem supply, and shared wallet state. Pending/reveal coordination keeps those authorities truthful while loading. `AppState` owns mutable selection, cart, countdown/pause/supply, hover, and wallet-dependent state. Only one eligible checkbox/selection is actionable at a time.

Drops represents unavailable redeem supply as `null`. A failed initial or later complete balance read displays `[UNAVAILABLE]` and blocks trading, including a final supply check immediately before the wallet request. Only a known nonnegative safe-integer balance of the exact configured redeem contract/token ID covering the complete positive safe-integer `redeemAmount` enables the action and live styling. Zero remains sold out; a positive remainder below the required amount stays disabled without being reported as zero or unknown. After the initial reveal commits, one nonoverlapping 10-second poll recovers unknown or insufficient positive inventory while the page is visible and live; hidden, pre, and standby states stop the interval. Verified zero does not automatically poll for replenishment. Observed sufficient inventory does not guarantee chain success; transaction confirmation and recovery remain separate authorities.

For a trade, Drops requires current LIVE/unpaused state at entry and again immediately before reservation and the wallet request, alongside the existing final supply, account, and selection checks. It verifies the active wallet, builds any required operator approvals through `shared/public-trade-ops.js`, looks up the pair ID through TzKT, composes the page-specific `initiate_trade` operation, sends the batch through the shared Beacon client, verifies expected confirmation, polls changed NFT balances, and refreshes the UI. Reconciliation of already-submitted trades remains available while paused. Contract source and deployment concerns remain in the contract subtree.

Both Public consumers retain submitted trades in the same-origin `localStorage` journal (`ea.public-trades.v1.*`). A receipt captures the exact trade operations, starting burn balances, account, configured network/indexer, escrow and returned hash before confirmation polling or UI callbacks. A browser Web Lock serializes same-origin submission across tabs, with the final account/cart checks inside the lock. Unsupported lock/storage APIs fail before sending. A persisted reservation precedes the wallet request; only a matching raw Beacon v2 user/wallet abort from the captured extension/P2P sender clears it. Generic/transport errors, WalletConnect aborts, missing provenance, interrupted requests and responses without a hash remain blocked. Beacon 4.8.1 WalletConnect maps every operation rejection to `ABORTED_ERROR`, and account reset can synthesize that code too; neither the code alone nor an `AbortedBeaconError` name/message proves non-submission. Rejected `ErrorResponse` messages have no hash contract: loose hash fields/errorData remain unverified; a complete matching `OperationResponse` preserves its hash if surfaced as a rejection. The journal holds at most 32 receipts (up to 100,000 characters each), never expires/evicts unresolved entries, and blocks new trades if storage is unavailable, malformed or full. Retention is browser/origin-local; clearing browser data, using another origin/device, or concurrent independent clients is outside exactly-once enforcement.

Any retained receipt blocks further trades in its account/network/indexer/escrow scope, including different carts that could repeat part of the burn. Closing the modal, cart resets, balance retries and reconnects do not clear it. `RETRY CONFIRMATION` only polls the captured hash and uses the configured network's explorer link. Confirmation requires distinct TzKT rows for every submitted top-level trade call, scoped to the hash, sender, escrow and entrypoint. One overall confirmation deadline bounds fetch, HTTP validation/body reads, JSON parsing and retry delays, including non-cooperative reads. Expiry aborts supported requests, clears timers and returns to confirmation retry without interpreting late responses or releasing the retained hash/receipt. Missing/partial/malformed evidence, HTTP errors and timeouts stay unknown; only all-applied evidence advances to balance reconciliation, or verified all-terminal-failed evidence permits a fresh submission. Overlapping status attempts coalesce, and late results cannot downgrade an applied receipt. A missing-hash reservation requires checking wallet operation history; it cannot be resolved by balances or automatically rebroadcast.

After confirmation, Drops clears actionable holdings until a complete holdings read carries post-operation block evidence for every exact traded identity. Timeout or refresh failure retains the applied-operation status and exposes `RETRY BALANCES` on the exchange button. Applied receipts survive reloads and wallet changes until verified balance reconciliation, including reconnects; wallet and holdings-request guards reject older asynchronous completions. A retry or later wallet refresh must satisfy those requirements before publishing quantities again.

## Exchange architecture

The Webflow shell supplies two tab panes and serialized CMS rows for THE 419 SCRIPT and CANAAN. `exchange/js/exchange-config.js` projects the active registry collections, redeem-token contract, and strictly resolved Exchange escrow. If required strict configuration is absent, the surface renders unavailable rather than falling back to the legacy top-level escrow.

`exchange/js/exchange.js` maps tab pane identifiers to configured collection contracts, stamps CMS rows with contract/token identity, consumes shared wallet state and NFT balances, and reveals only actionable owned quantities. Each row offers quantities from 1 through the smaller of its verified balance and 20; small balances retain their existing options. The full verified balance remains authoritative for ownership and post-trade refresh. Exchange enforces at most 20 units per token identity and 50 units across all rows/contracts per submission, producing at most 50 per-unit trade entries. These conservative client resource limits keep numeric selects and synchronous nested payload construction small; they are not verified blockchain/protocol maxima or guarantees of wallet acceptance. Dropdown tooltips and validation errors explain the limits. Oversized or malformed selections are rejected without changing the selected amount; cart extraction, totals and the check immediately before payload construction share validation. Account-generation guards prevent stale balance results from replacing the current wallet projection.

For exchange execution, the page obtains the verified active account and burn cart, uses `shared/public-trade-ops.js` for operator approvals and pair lookup, groups page-specific `initiate_trade` payloads, submits the batch through the shared Beacon client, verifies confirmation against the configured escrow and entrypoint, polls for balance changes, and refreshes row/cart state.

Confirmed trades on both Public surfaces retain their durable applied receipt until holdings publication and journal cleanup verify the same evidence. The receipt records one positive safe-integer `appliedLevel` only when all attributed top-level trade rows agree on their block. Missing or ambiguous block evidence does not undo confirmation, but cannot unlock holdings. Balance retry re-polls the captured operation for legacy applied receipts without usable block evidence; it never resubmits.

Public fetchers request the shared reader's projected array without discarding its private in-memory completeness/account/indexer evidence. Each traded FA2/token ID must have an explicit balance row for the exact owner, with no alternate address entrypoint, whose integer `lastLevel` is at least `appliedLevel`. This uses TzKT's balance-row ledger-change attribution, not an elapsed-time or indexer-head heuristic. Independent incoming transfers may leave balances unchanged or higher. Quantities and duplicate selections remain in the exact retained intent; a later trade uses the verified current balance. Copied/modified arrays, incomplete reads, stale rows, unsupported/malformed evidence and omitted traded-token rows cannot clear a receipt. An explicit attributed zero row supports full depletion; absence alone has no block attribution. See [operations](operations.md#public-applied-trade-recovery) for recovery limits and the source guarantee.

Shared polling, both final holdings gates and journal cleanup enforce this boundary, including timeout/refetch snapshots. Pending, disconnect, account replacement, and same-address reconnect preserve it. Confirmation invalidates an in-flight reconnect snapshot for the same wallet; stale or failed refreshes keep quantities unavailable and expose the existing balance retry control.

## Webflow integration boundary

### Webflow owns

For the current live integration, Webflow owns live page HTML and hosting, CMS content serialization, the DOM/class structure consumed by Git JavaScript, the hosted shared stylesheet and page custom CSS, the Webflow runtime (including widgets such as navigation and tabs), and hosted assets/fonts as applicable. Webflow page custom code loads the stable GitHub Pages module URLs.

### Git owns

Git owns the public JavaScript behavior, stable root routers and environment loaders, shared runtime, page application modules, network/registry configuration, drop parameters, transaction-side client logic, build scripts, verification, and GitHub Pages deployment assembly.

`index.html`, `drops/index.html`, `exchange/index.html`, and `collection-utility/index.html` are tracked Webflow-derived development and sanity shells. They are useful representations of the expected DOM contract, but they are not the live Webflow HTML authority. They load hosted Webflow CSS/runtime/assets and local application entries so Parcel can serve the repository runtime against representative markup.

The stylesheet at `docs/webflow-migration/evidence/eatacid-xyz-webflow-reference-snapshot.css` is tracked historical evidence. Ignored files under `drops/css/`, `exchange/css/`, and `assets/site/` are local reference/export material. None is the current live runtime CSS authority.

Follow [refreshing Webflow-derived HTML/reference material](operations.md#16-refreshing-webflow-derived-htmlreference-material) for the supported capture, comparison, and validation procedure.

## Generated versus authored paths

| Path | Classification | Authoritative? | Edit directly? |
| --- | --- | --- | --- |
| `shared/` | Authored shared runtime/configuration, except named generated projections | Yes, by module responsibility | Yes, within ticket scope |
| `drops/js/` | Authored Drops runtime | Yes for Drops behavior | Yes |
| `exchange/js/` | Authored Exchange runtime | Yes for Exchange behavior | Yes |
| `collection-utility/js/` | Authored Collection Utility runtime | Yes for Collection Utility behavior | Yes |
| `webflow/` | Authored Parcel deployment entry sources | Yes for deployed bundle entry graphs | Yes |
| `loaders/` | Authored stable routers, environment loaders, and loader tests | Yes for deployed routing/loading | Yes |
| `dist/` | Ignored generated Parcel/assembled output | No | No; rebuild |
| `pages-sanity/` | Ignored generated HTML sanity harness | No | No; regenerate |
| `shared/drop-params/drop-params.js` | Authored drop-parameter source | Yes | Yes |
| `shared/drop-params/drop-params.json` | Tracked generated projection | No; source is the JS file | No; run the generator |
| `shared/drop-params/archive/` | Immutable deactivation history | Historical evidence only | No; publish through the transaction writer |
| `shared/drop-params/.drop-params.operations/` | Ignored local operation journal and staging | No | No; inspect/reconcile through the transaction writer |
| `drops/css/`, `exchange/css/` | Ignored local Webflow exports/reference | No | No as runtime source |
| `assets/site/` | Ignored local Webflow/performance reference assets | No | No as runtime source |
| `docs/webflow-migration/evidence/` | Tracked historical migration evidence | Evidence only, not runtime authority | Only in an evidence-scoped ticket |
| `admin-ui/` | Independent nested Git repository, ignored by the outer repo | Its own repo is authoritative for Admin | Never as an incidental outer edit |
| `ticket.*.diff` | Ignored generated review artifact | No | No; export from Git |
| `ticket.*.stat.txt` | Ignored generated review artifact | No | No; export from Git |

## Directory and change-location map

| Change | Start here | Related ownership to inspect |
| --- | --- | --- |
| Network selection/endpoints/addresses | `shared/network.js`, `shared/chain-registry.js` | Page config validators and all consumers of the changed slot |
| Wallet lifecycle | `shared/beacon-setup.js` | Drops/Exchange public wallet-state consumers |
| Drops behavior | `drops/js/`, `shared/drop-params/` | Registry identity/escrow and Webflow DOM contracts |
| Exchange behavior | `exchange/js/` | Registry identity/strict escrow and Webflow tabs/rows |
| First paint | `webflow/first-paint.js`, `webflow/drops-first-paint.js`, `shared/public-first-paint.js` | Environment loaders and Drops reveal coordination |
| Shared approval/confirmation/NFT refresh | `shared/public-trade-ops.js` | Both page-specific transaction composers |
| Stable deployed routing | `loaders/root/`, `loaders/environment/` | Pages workflow and loader verification |
| Pages deployment | `.github/workflows/pages.yml` | Build scripts, artifact verifier, branch provenance |
| Webflow DOM/class investigation | `docs/webflow-migration/` | Current tracked shells and current runtime consumers |
| Contract implementation/deployment | `contracts/burn-redeem-escrow/` | Registry configuration and page transaction expectations |

## Verification architecture

Validation is layered because no single check proves source logic, emitted dependency graphs, deployment provenance, and live integration at once.

| Layer | What it proves |
| --- | --- |
| Focused deterministic tests | Pure/runtime seams such as shared trade helpers, HEN identity, root routing and sibling-load isolation, Drops reveal barriers, and artifact-verifier fixtures behave as encoded. |
| Clean staging/prod builds | The current Parcel entries resolve and emit for the selected output environment; they do not prove browser behavior or cross-branch Pages provenance. |
| First-paint build verifiers | Source maps and emitted artifacts preserve the intended small early dependency graph, exclude wallet/application dependencies, retain required markers, and remain materially smaller than the full bundle. |
| Direct Pages sanity | Generated Webflow-derived shells can load the built staging application bundles directly, isolating bundle/application problems from router problems. |
| Loader-chain Pages sanity | The same shells can traverse stable router -> staging environment loader -> sibling artifacts locally. |
| CI artifact/provenance verification | The assembled Pages artifact contains main-owned roots/prod loaders, staging-owned staging loaders, matching branch-built referenced artifacts, no retired router shape, and no source maps. |
| Live deployed verification | Real Webflow custom code, hostname selection, hosting, network requests, browser timing, wallet/provider behavior, and the published DOM/CSS integration work together. This cannot be established by static checks alone. |

For operational sequencing, see [primary deterministic tests](operations.md#5-primary-deterministic-tests), [production and staging builds](operations.md#6-production-and-staging-builds), [direct Pages sanity](operations.md#7-direct-pages-sanity), [loader-chain Pages sanity](operations.md#8-loader-chain-pages-sanity), and [deployment verification](operations.md#13-deployment-verification).

## Deep-reference links

- [PERF-2: early Home first paint](performance/PERF-2.early-home-first-paint.md) — implementation history and build-graph evidence; historical measurements and manual follow-up remain dossier context.
- [PERF-2B: staging loader isolation](performance/PERF-2B.staging-loader-isolation.md) — stable-router migration history and the resulting deployment contract.
- [PERF-3A: Exchange early first paint](performance/PERF-3A.exchange-early-first-paint.md) — Exchange split rationale and validation evidence.
- [PERF-3B: Drops early first paint](performance/PERF-3B.drops-early-first-paint.md) and [PERF-3C: coordinated reveal](performance/PERF-3C.drops-coordinated-region-reveal.md) — Drops early-shell and region-readiness history.
- [Webflow migration dossier index](webflow-migration/README.md) — historical migration audit and planned future ownership; it is not current runtime authority where code has since changed.
- [Webflow custom-code inventory](webflow-migration/01-custom-code-inventory.md) — captured Webflow module URLs and integration evidence; some loader/first-paint descriptions predate later performance work.
- [Webflow DOM contracts](webflow-migration/03-dom-contracts.md) and [runtime dependency data](webflow-migration/03-runtime-dependencies.json) — selector and consumer evidence; verify against current code before changing a contract.
- [Webflow CMS image migration](webflow-cms-image-migration.md) — specialist CMS media migration reference.
- [Burn/redeem escrow README](../contracts/burn-redeem-escrow/README.md) — contract-specific build, test, and deployment documentation.
- [Split-escrow notes](../shared/chain-registry.split-escrow-notes.md) — historical registry/escrow migration notes; current `shared/chain-registry.js` is authoritative.

Use the [operations guide](operations.md) for day-to-day outer-repository work and the [testnet-to-mainnet runbook](testnet-to-mainnet.md) for Mainnet readiness, cutover, verification, containment, and rollback.
