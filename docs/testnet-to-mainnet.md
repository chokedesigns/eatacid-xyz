# EATACID.xyz testnet-to-mainnet runbook

## 1. Purpose, authority, and safety

This is the canonical outer-repository procedure for moving the public Home, Drops, and Exchange runtime from the `testnet` registry slot (currently Tezos Shadownet) to Tezos Mainnet. Revalidate it against executable source before every cutover.

This runbook does not authorize contract deployment or administration, asset funding, pair mutation, wallet operations, Git merges/pushes, or production activation. Obtain those authorizations separately. Admin implementation is outside this document.

> **STOP - REQUIRED BEFORE CUTOVER**
>
> Never continue with an unknown, placeholder, source-only, or merely plausible mainnet value. Every blocking value must have an approved source of truth and an independent live verification result.

The current public frontend has no read-only/write-disable mode. A publicly reachable staging build targeting mainnet can construct real mainnet `update_operators` and `initiate_trade` requests. Keep both mainnet escrow contracts paused throughout readiness and production read-only verification unless a separately approved containment mechanism exists. The contract pause is the real containment layer: Exchange has no pause-state UI gate, and Drops' pause-derived presentation does not remove its live click action.

## 2. Current deployment and network model

The combined Pages workflow checks out `main` and `staging` independently on every push to either branch:

```text
main
-> stable /home.js, /drops.js, /exchange.js routers
-> /prod/* loaders and Parcel artifacts

staging
-> /staging/* loaders and Parcel artifacts
```

The stable routers select `/prod` only for `eatacid.xyz` and `www.eatacid.xyz`; every other hostname, including Webflow staging and localhost, selects `/staging`. Production is rebuilt from `main`. Exact staging bytes are not promoted unchanged.

`.github/workflows/pages.yml` does not set `NETWORK`. It assembles both ref-owned outputs, removes source maps, asserts none remain, verifies the loader graph and branch provenance, and only then uploads the artifact. No step mutates the assembled graph between provenance verification and upload.

`shared/network.js` supports only `testnet` and `mainnet`. It selects `process.env.NETWORK` when explicitly supplied; otherwise it uses `DEFAULT_NETWORK`, currently `testnet` on both `main` and `staging`. Parcel can expose a shell or ignored `.env*` `NETWORK` value at build time. Unsupported values throw. There is no browser-time override, URL switch, or user network selector.

The supported Phase A staging mechanism remains a branch-local source edit:

```js
// main: keep during Phase A
const DEFAULT_NETWORK = 'testnet';

// staging only during Phase A
const DEFAULT_NETWORK = 'mainnet';
```

Do not add a workflow override for this cutover.

## 3. Current network revalidation

| Topic | Authoritative source | Current state | Readiness classification |
| --- | --- | --- | --- |
| Default and slots | `shared/network.js` | `DEFAULT_NETWORK = 'testnet'`; slots are `testnet`, `mainnet` | KNOWN + VERIFIED IN SOURCE |
| Testnet identity | `shared/chain-registry.js` | `testnet` is labeled Shadownet and uses Beacon `shadownet` | KNOWN + VERIFIED IN SOURCE |
| Mainnet RPC | `chainRegistry.mainnet.rpc` | `https://mainnet.smartpy.io` | KNOWN BUT REQUIRES LIVE VERIFICATION |
| Mainnet TzKT | `chainRegistry.mainnet.tzkt` | `https://api.tzkt.io` | KNOWN BUT REQUIRES LIVE VERIFICATION |
| Beacon | Registry; `shared/beacon-setup.js` | `mainnet` maps to `NetworkType.MAINNET` | KNOWN + VERIFIED IN SOURCE; runtime test required |
| Browser switching | `shared/network.js`; consumers | None; selection is build/evaluation-time | KNOWN + VERIFIED IN SOURCE |
| Mainnet NFT collections | `chainRegistry.mainnet.collections` | Four nonblank addresses are checked in | KNOWN BUT REQUIRES LIVE VERIFICATION |
| Drops escrow | `mainnet.escrows.drops.address` and legacy `escrow` | Blank; no effective address | MISSING |
| Exchange escrow | `mainnet.escrows.exchange.address` | Blank; strict resolver has no fallback | MISSING |
| ACID COIN | `mainnet.collections['ACID COIN']` | Blank | MISSING |
| Mainnet mirrors | `mainnet.mirrors` | `{}` | OPERATOR DECISION REQUIRED |
| Drop parameters | `shared/drop-params/drop-params.js` | Scheduled `SPLINTERED`; `mirrorNetwork: 'testnet'`; May 28, 2026 at 9:00 PM EST; HEN burn excluding `141634`; CANAAN token `29`, amount `1`, declared supply `10` | OPERATOR DECISION REQUIRED |

Current validator result:

```text
validateNetworkBase('mainnet')          -> ok
validatePublicDropsConfig('mainnet')    -> missing: escrow
validatePublicExchangeConfig('mainnet') -> missing: escrows.exchange.address, collections.ACID COIN
validateAdminNetworkConfig('mainnet')   -> missing: escrow, collections.ACID COIN
```

## 4. Mainnet prerequisite/value manifest

`Current value` means checked-in source, not live approval. `Approved mainnet value` must be filled from the named authority before the associated gate passes.

| Component | Registry/config path | Current value | Required/approved mainnet value | Known now? | Source of truth | Independent verification | Blocking? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Mainnet RPC | `mainnet.rpc` | `https://mainnet.smartpy.io` | Approved Mainnet RPC | Source-known; live-unverified | Network/provider approval | Chain ID and head agree with independent provider | Yes |
| Mainnet TzKT | `mainnet.tzkt` | `https://api.tzkt.io` | Approved Mainnet TzKT API | Source-known; live-unverified | TzKT/operator approval | `/v1/head` healthy and agrees with RPC context | Yes |
| Beacon mainnet type | `mainnet.beaconNetwork` | `mainnet` | `mainnet` | Yes in source | Registry and Beacon SDK | Desktop/mobile permission shows Mainnet | Yes |
| CANAAN | `mainnet.collections.CANAAN` | `KT1UqqSTPPFQk6btXKgv2adjj83YD2V5YBt1` | Approved canonical collection | Source-known; live-unverified | Collection owner/deployment evidence | TzKT contract, storage/code, metadata, known-wallet balance | Yes |
| THE 419 SCRIPT | `mainnet.collections['THE 419 SCRIPT']` | `KT1EzmMokbtPS9nYJW1n5Darfgwf7HVtcsyq` | Approved canonical collection | Source-known; live-unverified | Collection owner/deployment evidence | Same plus expected Exchange CMS token IDs | Yes |
| HEN | `mainnet.collections.HEN` | `KT1RJ6PbjHpwc3M5rw5s2Nbmefwbuwbdxton` | Approved canonical collection | Source-known; live-unverified | HEN canonical evidence | Contract/metadata and known-wallet balance | Yes |
| INTRODUCTIONS | `mainnet.collections.INTRODUCTIONS` | `KT1FmqojETK4Ux44oeudyDbQ6zQDYrD5DaP5` | Approved canonical collection | Source-known; live-unverified | Collection owner/deployment evidence | Contract/metadata and known-wallet balance | Yes |
| ACID COIN | `mainnet.collections['ACID COIN']` | Blank | Approved Mainnet FA2 | No | Contract/Admin handoff | Origination, FA2 identity, token IDs, balances, payload review | Yes |
| Drops escrow | `mainnet.escrows.drops.address` (legacy fallback: `mainnet.escrow`) | Both blank | Approved dedicated Drops escrow | No | Contract deployment handoff | Origination, code, storage, admin, pause, entrypoints, pair map | Yes |
| Exchange escrow | `mainnet.escrows.exchange.address` | Blank | Approved dedicated Exchange escrow | No | Contract deployment handoff | Same; strict resolver reports `source: surface` | Yes |
| Pair-map path | Surface path, then `mainnet.pairsMapPath` | Surface blank; fallback `token_mapping` | Path proved by deployed storage | Deployment-unverified | Deployed storage schema | Named active big map exists on each escrow | Yes |
| Pair IDs/metadata | `mainnet.pairIdRanges.*`; escrow big maps | Both `{ start: 0, end: null }` | Approved contract-scoped IDs and pair manifest | No | Admin/contract pair handoff | Compare every active burn/redeem field | Yes |
| Mainnet mirrors | `mainnet.mirrors` | `{}` | Approval that none are needed, or approved mappings | No decision | Collection identity owner | Known-wallet/CMS identity comparison | Yes when Drops collection needs mirrors |
| Drop parameters | `shared/drop-params/drop-params.js` | See section 8 | Approved schedule/mechanics | No | Release/drop owner | Source/projection, UI, pair/inventory comparison | Yes if scheduled |
| Redeem inventory/supply | Escrow holdings; `redeemToken.totalSupply` | Declared `10`; Mainnet live unknown | Approved funded inventory and truthful assumption | No | Treasury/Admin handoff | Escrow FA2 balances and exposure reconciliation | Yes |
| Pause authority/state | Deployed escrow storage/custody | Unknown | Named reachable authority; both paused | No | Contract/Admin handoff | Storage read and authority confirmation | Yes |
| Administrator/provenance | Deployment records/storage | No Mainnet record in outer repo | Complete evidence per contract | No | Contract deployment handoff | Origination, code/version, storage/admin comparison | Yes |

For each blank address above:

> **STOP - REQUIRED BEFORE CUTOVER**
>
> **Value:** Mainnet Drops escrow, Mainnet Exchange escrow, or Mainnet ACID COIN (as applicable)
>
> **Source of truth:** approved contract/Admin handoff with origination evidence
>
> **Verification:** independently read the Mainnet contract, origination, code/storage identity, administrator, pause state, pair map, and inventory through approved RPC/TzKT endpoints
>
> Do not substitute a ticket comment, testnet address, source default, or placeholder.

## 5. External handoffs and contract provenance

| Outer dependency | Required handoff | Required before | Outer verification |
| --- | --- | --- | --- |
| Mainnet Drops escrow | Address and complete provenance | A3 | Resolver/validator plus live contract/storage/pause/pair reads |
| Mainnet Exchange escrow | Address and complete provenance | A3 | Strict surface resolver plus live contract/storage/pause/pair reads |
| Mainnet ACID COIN | FA2 address, token identity/ranges, provenance | A3 | Validator, contract/token/balance reads, payload comparison |
| Deployment evidence | Origination operation, network, code/version, storage shape | A3 | Compare explorer/RPC evidence to approved release artifact |
| Administrator/pause authority | Admin address/custody, operator, procedure, access proof | A12 and B8 | Storage read plus authority confirmation; do not toggle just to test |
| Pair maps | Per-escrow IDs and complete burn/redeem tuples | A15 | Compare every active `token_mapping` entry |
| Redeem inventory | Contract, token IDs, quantities, exposure limits | A15 | TzKT balances and supply reconciliation |
| Drop activation parameters | Approved schedule, eligibility, redemption, supply | A5 | Source/projection, UI, pair/inventory comparison |
| Admin drop-param mirror | Confirmation Admin mirror equals outer projection | A12 | Exact JSON comparison; Admin remains separately owned |
| Controlled write test | Scope, wallet, asset, pair, result, exposure, operators | A20/B9 | Two-person preflight and post-operation reconciliation |

Every Mainnet escrow/contract record must contain: address, network, deployment/origination operation, code/version identity, storage shape, administrator, pause state, pair-map path, expected pairs, and funding/inventory. Git source alone does not prove deployed identity. The [legacy contract README](../contracts/burn-redeem-escrow/README.md) describes the source/deployment evidence boundary. The [split-escrow notes](../shared/chain-registry.split-escrow-notes.md) are historical context; `shared/chain-registry.js` is current runtime authority.

## 6. Read-only verification commands

Run from the outer root. Validate checked-in configuration without contacting a chain:

```text
node --input-type=module -e "import { validateNetworkBase, validatePublicDropsConfig, validatePublicExchangeConfig, resolveDropsEscrow, resolveExchangeEscrow } from './shared/chain-registry.js'; console.log(JSON.stringify({ base: validateNetworkBase('mainnet'), drops: validatePublicDropsConfig('mainnet'), exchange: validatePublicExchangeConfig('mainnet'), dropsEscrow: resolveDropsEscrow('mainnet'), exchangeEscrow: resolveExchangeEscrow('mainnet', { strict: true }) }, null, 2));"
```

Expected after A3: all validators have `ok: true`; both effective escrows are approved; Exchange has `source: "surface"`. Any missing path is blocking.

After approving endpoints, verify chain identity/health without a wallet operation:

```text
Invoke-RestMethod -Uri 'https://mainnet.smartpy.io/chains/main/chain_id'
Invoke-RestMethod -Uri 'https://mainnet.smartpy.io/chains/main/blocks/head/hash'
Invoke-RestMethod -Uri 'https://api.tzkt.io/v1/head'
```

Substitute only an approved address:

```text
Invoke-RestMethod -Uri 'https://api.tzkt.io/v1/contracts/<APPROVED_KT1_ADDRESS>'
Invoke-RestMethod -Uri 'https://api.tzkt.io/v1/contracts/<APPROVED_ESCROW_ADDRESS>/storage'
Invoke-RestMethod -Uri 'https://api.tzkt.io/v1/contracts/<APPROVED_ESCROW_ADDRESS>/bigmaps/token_mapping/keys?active=true&limit=10000'
```

Read-only areas are: registry; RPC identity/head; TzKT health; collection/escrow existence; origination/code/storage; administrator/paused state; `token_mapping`; burn/redeem identities and quantities; pair IDs; inventory/supply; known-wallet NFTs; operator approvals; Home/Drops/Exchange rendering; testnet banner; network requests; explorer; Beacon permission/connect; and loader/artifact provenance.

> **STOP if:** chain identity disagrees; RPC/TzKT disagree materially; address/storage differs; a contract is unpaused; pair/inventory differs; or any Shadownet request/data appears.

## 7. Pre-cutover baseline and clean-environment gate

| Evidence | Value/result | Source | Verified by | Timestamp | Notes |
| --- | --- | --- | --- | --- | --- |
| Current `main` commit |  | Git |  |  |  |
| Current `staging` commit |  | Git |  |  |  |
| Successful Pages workflow/run |  | GitHub Actions |  |  |  |
| Known-good testnet rollback ref |  | Reviewed deployed ref |  |  |  |
| Live `/home.js` hash/fetched identity |  | Pages response |  |  |  |
| Live `/drops.js` hash/fetched identity |  | Pages response |  |  |  |
| Live `/exchange.js` hash/fetched identity |  | Pages response |  |  |  |
| Current testnet smoke result |  | Three surfaces |  |  |  |
| Current network default |  | `shared/network.js` |  |  |  |
| Mainnet pause authority/operator |  | Handoff/storage |  |  |  |
| Release operator/reviewer/monitor owner |  | Release approval |  |  |  |

Current Webflow evidence names `https://chokedesigns.github.io/eatacid-xyz/{home,drops,exchange}.js`; verify live custom code before relying on it. Fetch each response and record headers, body SHA-256, and Pages workflow/ref. In PowerShell, use `Invoke-WebRequest -OutFile` to an explicitly chosen temporary file then `Get-FileHash -Algorithm SHA256`; remove only those named files afterward.

Clean-environment gate:

```text
git branch --show-current
git status --short
git rev-parse HEAD
git -C admin-ui status --short
Get-ChildItem -Force -Name .env*
[Environment]::GetEnvironmentVariable('NETWORK', 'Process')
```

Expected: both repositories clean; no unexpected `.env*`; process `NETWORK` blank unless explicitly approved. Inspect runner/workflow variables too. Clean Git status does not prove ignored `.env*` absence.

> **STOP if:** either repo is unexpectedly dirty, branch/ref is wrong, rollback ref is absent, or an unreviewed environment source can change selection.

## 8. Drop-parameter mainnet reconciliation

`shared/drop-params/drop-params.js` is authoritative. Never hand-edit generated `shared/drop-params/drop-params.json` or `admin-ui/src/drop-params.mirror.json`.

| Field | Current source value | Mainnet-approved value | Approval/source | Validation |
| --- | --- | --- | --- | --- |
| `dropScheduled` | `true` |  | Release/drop owner | Correct scheduled UI |
| `dropName` | `SPLINTERED` |  | Release/drop owner | Approved identity |
| `mirrorNetwork` | `testnet` |  | Collection owner | Approved mirror policy/registry |
| burn collections | HEN; INTRODUCTIONS |  | Drop owner | Registry and pairs agree |
| enabled flags | HEN true; INTRODUCTIONS false |  | Drop owner | Only approved actionable |
| exclusions | HEN `141634`; INTRODUCTIONS blank |  | Drop owner | Exact eligibility review |
| burn amounts | `1` each |  | Pair manifest | Equals deployed pairs |
| redeem collection/token | CANAAN `29` |  | Drop owner/inventory | Address, metadata, balance |
| redeem amount | `1` |  | Pair manifest | Equals deployed pair |
| declared total supply | `10` |  | Treasury/inventory | Reconciles to inventory/exposure |
| schedule | May 28, 2026, 9:00 PM EST |  | Release/drop owner | Timezone/date/countdown review |

After an approved source edit:

```text
npm run dropparams:json
git diff -- shared/drop-params/drop-params.js shared/drop-params/drop-params.json
git -C admin-ui status --short
```

The generator updates only outer JSON. The watcher may copy it to Admin; this runbook does not authorize that Admin change.

> **STOP - ADMIN/CONTRACT HANDOFF REQUIRED:** do not deploy staging-mainnet until the independently owned Admin mirror is confirmed equal to the approved projection and Admin activation is separately approved.

## 9. Phase A - Mainnet readiness on staging

Phase A completes configuration/read-only verification while public production remains testnet and both Mainnet escrows remain paused.

### A1 - Freeze and record baseline

Run section 7. Record refs without switching/merging automatically:

```text
git rev-parse main
git rev-parse staging
```

Record workflow, rollback ref, live identities, testnet smoke, operators, reviewer, and monitoring owner.

### A2 - Complete external prerequisites

Complete every blocking manifest/handoff row. Independently verify the four source-known NFT addresses.

> **STOP until:** all addresses, provenance, pause authority, pairs, inventory, drop decisions, and people are known and verified.

### A3 - Populate only the mainnet registry slot

On reviewed staging-bound source, update only approved `chainRegistry.mainnet` fields in `shared/chain-registry.js`: endpoints/Beacon if approved values differ; legacy `escrow` only for an approved need; both surface escrow addresses/paths; collections including ACID COIN; pair metadata; mirrors. Keep public default `testnet`. Do not copy testnet values, infer addresses, or use ranges as pair contents.

### A4 - Validate mainnet registry/config

Run section 6's Node command. Require all public validators, approved effective addresses, and strict Exchange surface resolution.

> **STOP if:** a validator fails or resolver uses an unapproved fallback/address/path.

### A5 - Reconcile drop params

Complete section 8; edit authoritative JS, regenerate JSON, review both, obtain Admin mirror handoff. If no Mainnet drop should be active, explicitly approve `dropScheduled` rather than assuming it.

### A6 - Run deterministic tests

```text
npm run test:loader-architecture
npm run test:pages-loader-artifacts
npm run test:public-trade-ops
npm run test:drops-reveal
npm run test:hen-identity
```

These prove encoded seams, not live state or providers.

### A7 - Build while public default remains testnet

Re-run clean-environment gate, then:

```text
npm run build:pages:staging
git status --short
git -C admin-ui status --short
```

Reject unexpected generated/tracked changes.

### A8 - Verify first-paint/build architecture

```text
npm run verify:home-first-paint-build
npm run verify:drops-first-paint-build
```

Confirm intended early/full graphs.

### A9 - Switch staging only to mainnet

On `staging` only, change:

```js
// before
const DEFAULT_NETWORK = 'testnet';

// after on staging only
const DEFAULT_NETWORK = 'mainnet';
```

Confirm `main:shared/network.js` remains `testnet`. Do not use a hidden override as release mechanism.

### A10 - Rebuild and validate staging-mainnet locally

Confirm `.env*`/process `NETWORK`, then:

```text
npm run build:pages:staging
npm run test:loader-architecture
npm run test:public-trade-ops
npm run verify:home-first-paint-build
npm run verify:drops-first-paint-build
```

Inspect emitted network/address strings: Mainnet only; no Shadownet; banner hidden.

### A11 - Loader-chain sanity

```text
npm run pages:sanity:loader-chain
```

For all surfaces confirm stable router -> `/staging/*-loader.js` -> matching siblings; Mainnet RPC/TzKT/wallet; no `/prod` confusion. Stop server before cleanup.

> **STOP if:** provenance is ambiguous, artifacts are missing, Shadownet appears, or banner/network identity is wrong.

### A12 - Commit/merge/push staging through normal workflow

After authorization, use normal reviewed Git operations to deliver to `staging`; do not automate them from this runbook. A staging push rebuilds both environments, but `/prod` remains `main`-owned/testnet in Phase A.

### A13 - Verify deployed staging loader chain

In fresh/private sessions confirm stable root -> `/staging/*-loader.js` -> correct staging siblings for all surfaces. Record response identity and Pages provenance; confirm `/prod` remains main-owned.

### A14 - Verify chain identity/endpoints

Run section 6 endpoint checks and inspect browser requests. Require Mainnet chain, approved RPC/TzKT/explorer, Beacon Mainnet, zero Shadownet.

### A15 - Verify mainnet contract state read-only

Verify all collections, ACID COIN, and escrows: network/address, origination, code/version, storage, admin, pause, map path, every pair tuple, metadata, operator reads, inventory/supply. Both escrows paused; authority available.

> **STOP if:** unpaused, provenance incomplete, pair differs, inventory differs from approval, or operator state is unexpected.

### A16 - Verify Home read-only

Confirm staging Mainnet, reveal, hidden banner, truthful disconnected state, fresh connect without operation, address, Mainnet NFT read, refresh/new tab/private session, and no Shadownet/errors.

### A17 - Verify Drops read-only

Confirm schedule/name/date/time; burn collections/exclusions/mirrors/NFT filtering; Drops escrow; pairs; redeem identity/amount; inventory/supply; paused state; unavailable behavior; explorer/requests; no stale CMS placeholder. Do not approve or submit.

### A18 - Verify Exchange read-only

Confirm collection rows/token IDs; known-wallet filtering/quantities; ACID COIN and calculations; strict escrow; pairs; inventory; Mainnet explorer/requests. Do not click final Exchange: frontend has no pause gate.

### A19 - Verify wallet lifecycle

Without an operation, test:

- fresh desktop Mainnet connect;
- persisted Shadownet session (must clear/disconnect);
- disconnect/reconnect, refresh, hard refresh, new tab, private session;
- account switching and Mainnet NFT filtering on Home, Drops, Exchange;
- mobile wallet/deep-link connect and return.

Beacon account/peer state persists in browser storage and can survive refreshes and new tabs; a private session supplies an isolated storage context. The current module removes only known legacy Matrix transport keys when stored Beacon SDK version metadata proves they are old. Code clears an active account whose `account.network.type` differs, then publishes disconnected state. Provider storage/deep-link behavior still needs runtime proof. An existing `window.dAppClient` is reused without checking its constructor network, so new-document/private tests are mandatory; reconnect is expected after stale Shadownet account clearance.

> **STOP if:** stale account remains, provider targets wrong network, client reuse is inconsistent, or wrong-network NFTs appear.

### A20 - Optional controlled staging write test

**OPTIONAL - REQUIRES EXPLICIT AUTHORIZATION.** Not required for Phase A. If separately authorized, record dedicated wallet, expendable asset, exact pair, expected result, exact escrow, `initiate_trade`, pause authority, minimal exposure, two-person payload review, deliberate unpause/re-pause window, and post-TzKT reconciliation. This runbook does not authorize unpause or transaction.

### A21 - Phase A completion gate

Every go/no-go item below must have evidence. Re-pause after any separately authorized test. Production must still resolve testnet `/prod` from `main`.

## 10. Formal go/no-go checklist

No “probably correct,” conditional pass, or deferred verification passes.

### Configuration/provenance

- [ ] No unknown/placeholder Mainnet address remains.
- [ ] RPC/TzKT identity/health pass independently.
- [ ] Four NFT collections are live-verified.
- [ ] ACID COIN identity/use is live-verified.
- [ ] Both escrow provenance records are complete.
- [ ] Validators/resolvers pass with approved values.
- [ ] Drop JS/JSON/Admin mirror agree.
- [ ] Mirror/pair metadata decisions recorded.

### Contract readiness

- [ ] Both escrows are paused.
- [ ] Named pause authority reachable.
- [ ] Each `token_mapping` path proved.
- [ ] Every pair tuple matches live state.
- [ ] Inventory/exposure reconciles.
- [ ] Unexpected approvals absent/resolved.

### Build/test

- [ ] Clean-environment gate passes.
- [ ] A6 tests pass.
- [ ] Staging-mainnet build passes.
- [ ] First-paint verifiers pass.
- [ ] Loader-chain sanity passes all surfaces.

### Staging mainnet

- [ ] Deployed provenance/graph correct.
- [ ] All surfaces use approved Mainnet values.
- [ ] No Shadownet/banner leak.
- [ ] All surface read-only checks pass.

### Wallet

- [ ] Fresh desktop Mainnet connect passes.
- [ ] Persisted Shadownet account clears/reconnects.
- [ ] Disconnect/reconnect and session variants pass.
- [ ] Account switch/NFT filtering pass.
- [ ] Mobile/deep-link passes.

### Operations/ownership

- [ ] Release operator/reviewer available.
- [ ] Monitoring owner/window recorded.
- [ ] Activation handoff approved, not executed.
- [ ] Write-test disposition explicit.

### Rollback readiness

- [ ] Known-good testnet ref/artifact identities recorded.
- [ ] Rollback owner can deploy compatible graph.
- [ ] Pause authority can contain both contracts.

## 11. Phase B - Public production cutover

Start only after Phase A and formal go/no-go pass. Contracts remain paused through production read-only verification.

### B1 - Record formal go

Record approver, operator, reviewer, monitor, approved refs/manifest, timestamp, scope, and write-test decision.

### B2 - Promote approved mainnet source/config to main

Use normal reviewed Git promotion for registry, params/projection, and `DEFAULT_NETWORK = 'mainnet'`. Do not copy emitted staging files or assume byte identity.

### B3 - Confirm main source before push

```text
git branch --show-current
git status --short
git rev-parse HEAD
git -C admin-ui status --short
Get-ChildItem -Force -Name .env*
[Environment]::GetEnvironmentVariable('NETWORK', 'Process')
```

Inspect default, full registry slot, params, JSON equality, manifest, and section 6 validators.

> **STOP if:** source differs from approval, environment/Git is unclean, or validator/projection differs.

### B4 - Push main / Pages rebuild

Only authorized operator pushes. Workflow freshly builds both refs, assembles graph, removes maps, verifies provenance, deploys.

### B5 - Verify production artifact provenance

On both production hosts, confirm root -> `/prod/*-loader.js` -> current main-owned siblings for all surfaces. Record run/ref/response hashes and no maps. Staging success is not production proof.

### B6 - Production read-only verification while paused

Repeat A14-A18. Require Mainnet, hidden banner, no Shadownet, healthy surfaces, approved write targets. Keep escrows paused.

> **STOP and roll back immediately** for wrong chain/address/provenance, unsafe/blank surface, or unexpected unpause.

### B7 - Verify persisted-session behavior

Repeat stale Shadownet, fresh Mainnet, reconnect, refresh variants, account switch, desktop, and mobile/deep-link without operation.

### B8 - Activate public write paths separately

Only after B5-B7 may separately authorized Admin/contract operator activate. Record address, pre-state, authority/action/hash, post-state, exposure. Activate only approved surfaces.

> **STOP - ADMIN/CONTRACT HANDOFF REQUIRED:** frontend deployment does not authorize unpause, pairs, funding, approvals, or drop activation.

### B9 - Optional controlled production write test

**OPTIONAL - REQUIRES EXPLICIT AUTHORIZATION.** Apply A20 controls with production authorization/minimal exposure. Review exact destination/entrypoint/payload before signature; verify operation, transfers, balances, pair result, inventory; re-pause when planned or on mismatch.

### B10 - Observation window

Monitor provenance, failed requests, endpoints, wallet errors, data, contract state/operations, inventory, and reports for approved duration. Network/address/state errors are blocking.

### B11 - Close migration

Record final main/staging refs, Mainnet addresses, deployment/run/artifact identities, validation, activation timestamp, operator/reviewer, write-test disposition, observation, and nonblocking issues.

## 12. Production post-cutover verification

### BLOCKING

- [ ] Production hosts select current main root -> `/prod` graph.
- [ ] Prod selects Mainnet; banner hidden.
- [ ] No Shadownet request/data/explorer/wallet permission.
- [ ] RPC/TzKT identity/health correct.
- [ ] Collection, ACID COIN, escrow addresses approved.
- [ ] Drops params/mirrors/pair/redeem/supply/inventory correct.
- [ ] Exchange rows/pairs/ACID COIN/totals/inventory correct.
- [ ] Fresh Mainnet wallet connect works without operation.
- [ ] Stale Shadownet account clears/reconnects.
- [ ] Refresh/session/account/mobile tests pass.
- [ ] Contracts stay paused until B8.
- [ ] Constructed write targets only approved payload values.
- [ ] Provenance/no-source-map checks pass.

### OBSERVATIONAL

- [ ] Performance acceptable.
- [ ] Cosmetic differences recorded without obscuring safety.
- [ ] Provider-specific quirks recorded.
- [ ] CDN/cache settles within window.
- [ ] Noncritical external links recorded.

Wrong network, endpoint, address, pair, inventory, wallet chain, or provenance is never observational.

## 13. Immediate rollback triggers

Immediately roll back for: wrong chain; RPC/TzKT; collection; escrow; ACID COIN/redeem contract; production testnet/Shadownet data; blank/unusable surface; loader/provenance mismatch; systemic wallet network failure; wrong pair/inventory/supply; unapproved write target; unintended unpause/write availability; or unsafe API failure. Investigate in place only when clearly nonblocking, contracts verifiably paused, and no incorrect state is actionable.

## 14. Rollback procedure

1. Pause/re-pause affected Mainnet escrows if writes enabled; record operations/storage.
2. Identify/review known-good testnet ref.
3. Revert network default/config source through normal Git process.
4. Revert registry/authoritative params only as needed for compatible known-good source.
5. If params changed, run `npm run dropparams:json`; never hand-edit projection.
6. Re-run clean-environment gate, relevant tests, and `npm run build:pages:prod`.
7. Deploy through normal Pages workflow so complete compatible graph rebuilds.
8. Verify both hosts, `/prod`, three graphs, provenance, restored Shadownet identity.
9. Hard refresh/new/private session; verify stale Beacon Mainnet account is cleared/disconnected for Shadownet.
10. Keep Mainnet contracts paused until incident closure; record residual chain state.

Do not manually replace only a root router, loader, first-paint artifact, or application bundle. Rebuild/deploy the compatible assembled graph.

## 15. Irreversible on-chain state

> **IRREVERSIBLE - GIT ROLLBACK CANNOT UNDO CHAIN HISTORY**
>
> Git rollback cannot undo contract origination, `update_operators`, `initiate_trade`, burn/redeem transfers, pair creation/mutation/removal, escrow funding/withdrawal, or pause/unpause history. Operational response is containment/pause plus frontend/config rollback; there is no chain rollback.

## 16. Domain, DNS, and Webflow boundary

Domain/DNS is not part of the testnet-to-mainnet migration. Webflow serves HTML and stable GitHub Pages module URLs; hostname selects `/prod` or `/staging`; runtime config selects network.

No Webflow custom-code URL or DNS change is required. Local shells are not production authority. Testnet banner markup may remain in DOM but must be hidden on Mainnet. Verify DOM/runtime compatibility. Do not combine future Webflow hosting migration with cutover. For evidence only see [Webflow DOM contracts](webflow-migration/03-dom-contracts.md) and [runtime dependencies](webflow-migration/03-runtime-dependencies.json); current consumers win.

## 17. Write-capable path warning

### Drops

Drops reads wallet NFTs/inventory, checks escrow FA2 operator approvals, builds missing `update_operators`, scans active `token_mapping` for a burn pair, constructs `initiate_trade` to resolved Drops escrow with configured redeem token, submits the Beacon batch, verifies destination/entrypoint confirmation, polls balances, refreshes UI. Pause influences presentation but does not remove live click action; paused contract must reject trade.

### Exchange

Exchange performs approvals, pair lookup, batch request, confirmation, balance refresh against strict Exchange escrow. It burns THE 419 SCRIPT/CANAAN and names ACID COIN as redeem contract. It does not read pause or disable controls because paused. A configured Mainnet build is write-capable when wallet signs; pause is mandatory containment.

## 18. Operator evidence record

| Value/action | Source of truth | Verified by | Result | Timestamp | Notes/evidence |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

## 19. Final stop conditions

Stop when: a value/owner is unknown; identity/endpoint/validator/provenance/environment fails; escrow unpaused or authority unavailable; pair/redeem/inventory/supply/mirror/params differ; Shadownet or wrong-wallet network appears; artifact graph cannot tie to expected ref; read-only answer would require an irreversible action; or write test lacks exact authorization. Never continue and investigate later when chain/write safety is affected.
