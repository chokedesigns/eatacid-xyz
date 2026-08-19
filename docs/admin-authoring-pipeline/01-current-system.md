# Current system

This document describes implemented reality. Future architecture is labeled **PLANNED** and is not a current capability.

## IMPLEMENTED TODAY

### Repository and application boundaries

The workspace contains two Git repositories:

- outer `eatacid-xyz`: public runtime, shared chain/drop configuration, thumbnail tooling, reusable Webflow code, and architecture documentation;
- nested `admin-ui`: static Parcel Admin application, local titles and thumbnail masters, health and Drops features, and browser-wallet operations.

The repositories share source paths but do not share Git state. Existing generators can modify both roots, so future tooling must report and protect them independently.

The Admin UI is a browser application. It has no current authoring workspace, privileged local service, canonical record store, or general filesystem write API.

### Current work data and local presentation

Admin titles are hand-maintained JSON maps:

- `admin-ui/src/titles/canaan.json`
- `admin-ui/src/titles/the419script.json`
- `admin-ui/src/titles/hen.json`
- `admin-ui/src/titles/introductions.json`
- `admin-ui/src/titles/$acid.json`

`admin-ui/src/titles.manifest.js` exposes those maps. `admin-ui/src/utils/nft.js` deliberately resolves normal Admin titles from the local maps and images from `admin-ui/src/thumbs.manifest.js`; it does not use remote metadata for normal presentation.

Thumbnail masters live in `admin-ui/src/thumbs/`. `admin-ui/scripts/gen-thumbs-manifest.mjs` maps configured collection contracts to those files and generates `admin-ui/src/thumbs.manifest.js`. The generator treats the leading numeric filename segment as its token lookup key.

`assets/thumbs/scripts/thumbs.mjs` supplies deterministic conversion plus two current workflows:

- input processing for CANAAN and THE 419 SCRIPT;
- non-destructive backfill/review for CANAAN, THE 419 SCRIPT, HEN, and INTRODUCTIONS.

Input processing still assigns the next numeric local key. No mint result feeds that allocation.

### Network and identity configuration

`shared/chain-registry.js` owns configured network labels, Beacon/RPC/TzKT endpoints, collection contracts, escrow configuration, pair ranges, and explicit environment mirrors. The registry key `testnet` currently means Shadownet; it is not mainnet.

HEN uses sparse canonical/mainnet token IDs. On Shadownet, the registry maps those IDs to lookup IDs `0` through `16`. `admin-ui/src/utils/hen-ids.js` performs both directions of translation for Admin consumers. `shared/hen-identity.test.mjs` verifies the complete round trip.

### Webflow CMS and Admin CMS health

Webflow CMS remains the public presentation authority for CMS-backed collection rows. The last checked-in schema audit describes four collections and their different field sets in `docs/webflow-migration/02-cms-schema.md`; it is historical evidence, not a substitute for a future live preflight.

Admin does not currently create or update CMS items through the API. Its health feature asks the operator to select a Webflow CSV export, stores the CSV per network/collection in browser local storage, and compares normalized CMS rows with local titles, local thumbs, and chain-derived economics. Relevant implementations are:

- `admin-ui/src/features/health/health.cms.js`
- `admin-ui/src/utils/parse-csv.js`
- `admin-ui/src/utils/cms-store.js`

The retained `assets/webflow-cms/webflow-cms.mjs` library can read staged/live items and assets, create/upload/verify assets, patch explicit fields on known item IDs, publish exact item IDs, and verify/reconcile results. It has no CMS item-creation method and no Admin UI integration.

### Minting and chain writes

There is no mint implementation in either repository: no mint payload builder, metadata writer/uploader, mint submitter, local signer, or result importer.

The current exact mint procedure is outside repository evidence. After an external/manual mint, the operator currently has to carry token facts into local and CMS representations separately.

Existing Tezos writes are unrelated but reusable patterns:

- public Drops/Exchange transaction construction;
- Admin escrow transfer, pair, pause, and withdrawal operations;
- browser-wallet signing through Beacon;
- operation-hash capture and TzKT observation in applicable flows.

The Admin checklist phrase “MINTED on OBJKT” calls the generic TzKT token-existence reader in `admin-ui/src/tzkt-api.js`; it does not prove marketplace, creator, mint operation, metadata equality, or the current mint process.

### Drops

`shared/drop-params/drop-params.js` is the editable authority for configured drop intent. `shared/drop-params/drop-params.json` and `admin-ui/src/drop-params.mirror.json` are generated projections and must not be edited by hand.

At this architecture snapshot, `dropScheduled` is `false` and the redeem collection/token fields are empty. That mutable operational value is not a permanent architecture rule.

Current Admin/public Drops code already handles configuration loading, token existence, local presentation, manually loaded CMS health, escrow balance, pause state, pairs, branch-copy parity, countdown, and wallet-authorized operations. Those systems are operational consumers; they are not a work-authoring pipeline.

## Current fragmented workflow

The repository supports this only as a set of disconnected actions:

```text
external/manual mint
  -> manually capture token identity
  -> update local title data
  -> process/copy thumbnail and regenerate manifest
  -> create/update Webflow CMS outside Admin
  -> load CMS CSV for Admin health comparison
  -> optionally edit drop params and use existing Drops operations
```

No single record or orchestrator guarantees that each step describes the same work.

## PLANNED

- A versioned canonical work record and collection-policy model.
- An Admin new-work planner/form backed by a narrow loopback orchestration service.
- Explicit minted-result import and independent verification.
- Explicit-token-ID local artifact generation.
- Application-level CMS operations, including new staged item creation.
- Durable operation/reconciliation records and resumable lifecycle states.
- A separately approved per-item publication flow.
- An optional CANAAN-to-Drops proposal/handoff.
- Later, only after its real contract is understood, an optional wallet/external mint-submission adapter.

None of those planned capabilities should be inferred from existing UI labels, migration history, or reusable low-level libraries.

## Current limitations that shape v2

- There is no global work source of truth.
- “Next thumbnail key” is not proof of a minted token ID.
- CMS CSV health can be stale and cannot distinguish current staged/live state.
- The Webflow library can patch known items but cannot create new ones.
- Current local and CMS representations have collection-specific differences.
- Runtime chain truth, authored intent, generated files, and external integration identities are different kinds of data and must remain distinct.
- Mainnet escrow configuration is incomplete in `shared/chain-registry.js`; AUTHOR work must not silently enable it.
