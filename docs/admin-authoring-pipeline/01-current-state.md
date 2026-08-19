# Current-state architecture

## Repository topology and ownership

**CURRENT STATE.** `eatacid-xyz/` and `eatacid-xyz/admin-ui/` are separate Git repositories. Shared inputs cross that boundary:

- `shared/chain-registry.js` is imported by public and Admin code;
- `shared/drop-params/drop-params.js` generates `shared/drop-params/drop-params.json` and mirrors it into `admin-ui/src/drop-params.mirror.json` (`shared/drop-params/watch-drop-params-json.mjs:9-18`, `shared/drop-params/watch-drop-params-json.mjs:41-57`);
- outer thumbnail tooling writes masters under `admin-ui/src/thumbs/` and invokes the nested manifest generator (`assets/thumbs/scripts/thumbs.mjs:32-43`, `assets/thumbs/scripts/thumbs.mjs:195-217`).

This is already an orchestration seam, but it also means a future write service must understand two Git roots and must never stage or commit across them implicitly.

## Current end-to-end flow

**OBSERVED BEHAVIOR.** The current flow is fragmented rather than orchestrated:

```text
External/manual mint (repo has no implementation)
  -> operator learns token ID outside the repo
  -> manually updates local title JSON
  -> places artwork into a collection input folder
  -> thumbnail tool assigns next numeric local key and regenerates Admin manifest
  -> operator creates/updates Webflow CMS separately
  -> Admin health compares a manually loaded Webflow CSV with local/chain data
  -> operator edits shared drop params for a drop, when applicable
  -> generator mirrors params into Admin
  -> Admin preflight validates token existence, balance, pause, pairs, CMS CSV, and GitHub copies
  -> wallet-signed Admin/public operations seed/manage/execute the drop
```

No code captures a mint result and feeds it into the local/CMS pipeline.

## Minting, Tezos, and wallets

**CURRENT STATE.** Both applications use `@airgap/beacon-sdk` 4.8.1 (`package.json:30-34`; `admin-ui/package.json:21-24`). The public and Admin clients instantiate a browser `DAppClient`, request wallet permissions, validate the active account's network, and clear mismatched/stale accounts (`shared/beacon-setup.js:88-154`, `shared/beacon-setup.js:373-478`; `admin-ui/src/beacon-setup.js:109-164`, `admin-ui/src/beacon-setup.js:310-405`).

**OBSERVED BEHAVIOR.** Chain writes use Beacon `requestOperation`, not a repository-held private key. Public Drops builds FA2 operator approvals plus `initiate_trade` transactions (`drops/js/events.js:998-1054`). Admin escrow operations request permission, submit operations, capture an operation hash, and poll TzKT (`admin-ui/src/escrow-ops.js:25-48`, `admin-ui/src/escrow-ops.js:219-318`). Drop-pair sends are blocked unless the pause state is verified and `paused === true` (`admin-ui/src/features/drops/drops.send.service.js:99-108`, `admin-ui/src/features/drops/drops.send.service.js:224-279`).

**CURRENT STATE.** There is no OBJKT or mint dependency, no mint transaction builder, no local signer, and no metadata/upload authoring implementation. OBJKT appears as CMS link data and checklist wording. The checklist resolves a collection contract from the registry and calls TzKT `tokenExists`; it does not query OBJKT specifically (`admin-ui/src/features/drops/drops.checklist.controller.js:492-528`; `admin-ui/src/tzkt-api.js:308-327`).

**INFERENCE.** Minting is currently performed outside these repositories. The exact tool and approvals cannot be inferred safely.

## Canonical network and collection configuration

**CURRENT STATE.** `shared/chain-registry.js` owns testnet/Shadownet and mainnet RPC/TzKT values, collection contracts, escrow targets, pair ranges, and explicit mirrors (`shared/chain-registry.js:5-93`). Public staging defaults to the registry's `testnet` slot, which is Shadownet (`shared/network.js:7-27`). Admin persists its selected slot in local storage and clears the Beacon account before a reload-boundary switch (`admin-ui/src/network.js:18-118`).

Current collection roles are not uniform:

| Collection | Local titles/thumbs | CMS | Current runtime participation | New-item authoring evidence |
|---|---|---|---|---|
| CANAAN | IDs 0-30; direct thumbnail keys | 31 audited items; CMS has `acid-value`, no mint-date/OBJKT-link fields | Drops redeem token; Drops/Exchange presentation; Exchange burn input | Thumbnail input enabled; repository has no mint creator |
| THE 419 SCRIPT | IDs 0-12; labels `// 01`-`// 13` are one ahead of token ID | 13 audited items; mint-date, OBJKT link, `acid-value` | Exchange burn input; absent from Drops collection allowlist | Thumbnail input enabled; repository has no mint creator |
| HEN | Local title keys are sparse mainnet IDs; local thumbs are active IDs 0-16 | 17 audited sparse mainnet IDs | Drops burn input | Backfill/review only; no new-item input path or mint creator |
| INTRODUCTIONS | IDs 0-4; title order is FIVE to ONE | 5 audited items | Drops burn input | Backfill/review only; no new-item input path or mint creator |
| ACID COIN / `$ACID` | One local title/thumb | No CMS sync (explicitly skipped) | Exchange redeem asset and Admin registry surface | No authoring/mint path in repo |

Evidence: collection contracts and surface lists are explicit at `shared/chain-registry.js:23-29` and `shared/chain-registry.js:106-115`; title tables are assembled at `admin-ui/src/titles.manifest.js:1-29`; CMS collection fields are recorded at `docs/webflow-migration/02-cms-schema.md:28-128`; thumbnail input supports only CANAAN and THE 419 SCRIPT while backfill covers all four CMS collections (`assets/thumbs/scripts/thumbs.mjs:10-15`).

**RECOMMENDATION.** Model “participates in the Drops runtime” separately from “newly minted works may become redeem-token drop candidates.” HEN and INTRODUCTIONS currently participate as burn collections, but this does not prove that new works should be minted or offered as future redeem drops. CANAAN is the only requested new-work drop-candidate policy; THE 419 SCRIPT must be `dropEligible:false`.

## Local title and thumbnail systems

**CURRENT STATE.** Admin titles are hand-maintained JSON maps keyed by token ID. `getTokenUi` deliberately treats those maps and the generated thumbnail manifest as local-only display authority and does not hydrate remote metadata (`admin-ui/src/utils/nft.js:691-755`). HEN canonical title lookup uses an explicit mainnet/active-ID adapter (`admin-ui/src/utils/hen-ids.js`; `shared/chain-registry.js:34-60`).

**OBSERVED BEHAVIOR.** The thumbnail input tool:

- accepts only one pending image per supported collection (`assets/thumbs/scripts/thumbs.mjs:220-246`);
- calculates the next local numeric key from existing filenames (`assets/thumbs/scripts/thumbs.mjs:143-167`);
- emits a 300px-wide JPEG at quality 84 (`assets/thumbs/scripts/thumbs.mjs:10-14`, `assets/thumbs/scripts/thumbs.mjs:68-106`);
- writes the Admin master, regenerates `src/thumbs.manifest.js`, then archives the source;
- removes the new output and restores the old manifest if regeneration fails (`assets/thumbs/scripts/thumbs.mjs:270-291`).

The Admin generator derives collection-folder bindings from every registry network, takes leading digits from filenames as token IDs, and emits contract-to-token URL maps (`admin-ui/scripts/gen-thumbs-manifest.mjs:24-61`, `admin-ui/scripts/gen-thumbs-manifest.mjs:72-121`, `admin-ui/scripts/gen-thumbs-manifest.mjs:137-181`). If duplicate filenames share a numeric prefix, the first sorted filename wins in that generator (`admin-ui/scripts/gen-thumbs-manifest.mjs:101-116`), although the outer input tool refuses ambiguous existing keys before adding a new master (`assets/thumbs/scripts/thumbs.mjs:143-167`).

**RISK.** “Next unused thumbnail filename” is not necessarily “authoritative post-mint token ID.” A future new-item flow must accept the verified mint ID explicitly and fail on collision; it must not infer identity from order or next-number allocation.

## Admin health and CMS synchronization

**CURRENT STATE.** Health checks enumerate tokens from TzKT, then require local title and thumbnail resolution for each configured collection (`admin-ui/src/features/health/health.controller.js:430-583`). CMS sync is not an API integration: the operator selects a Webflow CSV file in the browser, and the text is stored per network/collection in local storage (`admin-ui/src/features/health/health.cms.js:549-684`; `admin-ui/src/utils/cms-store.js`).

The CSV normalizer reads Title/Name, Editions, Collection, Token ID, `$ACID Value`, Draft, and Archived columns (`admin-ui/src/utils/parse-csv.js:213-279`). Health then compares:

- collection/token/title against local title JSON;
- thumbnail availability through `getTokenUi`;
- editions and derived `$ACID` against chain metadata/economics;
- HEN IDs through the explicit mirror (`admin-ui/src/features/health/health.cms.js:259-377`, `admin-ui/src/features/health/health.cms.js:380-515`).

ACID COIN is intentionally excluded, but all other registry collections—including THE 419 SCRIPT—are required by the Drops checklist CMS dot (`admin-ui/src/features/drops/drops.checklist.controller.js:394-465`).

**LIMITATION.** This is a useful reconciliation engine, but it depends on a manually exported/selected CSV and cannot create or update CMS items.

## Webflow tooling

**CURRENT STATE.** The completed migration covered four collections and 66 items (`docs/webflow-cms-image-migration.md`). Collection-specific schema differences remain documented in `docs/webflow-migration/02-cms-schema.md`: THE 419 SCRIPT, HEN, and INTRODUCTIONS have mint-date and OBJKT-link fields; CANAAN does not; CANAAN and THE 419 SCRIPT have `acid-value`.

The one-time migration CLI has been retired. The retained `assets/webflow-cms/webflow-cms.mjs` module can list staged/live items and assets, create/upload assets, patch explicit item fields, publish exact item IDs, verify image content, and verify clean publication; it does not create a CMS item or provide an active migration workflow.

**REUSABLE.** Redaction, retry policy, atomic local journaling, before snapshots, staged/live preservation comparisons, deterministic asset naming, upload verification, explicit confirmation, unknown-outcome reconciliation, and rollback separation.

**MIGRATION-SPECIFIC.** Hard-coded site/collection/item/token/path, comparison against all unrelated CANAAN items, image-only PATCH payload, cached legacy image rollback, and nominal route policy.

## Drop params and lifecycle

**CURRENT STATE.** The sole editable authority is `shared/drop-params/drop-params.js`. It contains:

- `dropScheduled`, currently `true`;
- `dropName` and `mirrorNetwork`;
- date/time objects;
- burn-token collection, enabled, exclusions, and amount;
- redeem collection, token ID, amount, and planned total supply (`shared/drop-params/drop-params.js:3-62`).

`dropScheduled:false` is the existing NO DROP sentinel. Public Drops hides its main drop UI (`drops/js/events.js:384-431`); Admin renders “NO DROPS SCHEDULED” in the preview but leaves management outside the preview visible (`admin-ui/src/features/drops/drops.view.preview.js:162-216`). The pre-drop checklist card itself is static markup and remains present, with neutralized dots (`admin-ui/index.html:438-605`; `admin-ui/src/features/drops/drops.checklist.controller.js:949-1021`).

The full current checklist is:

1. params loaded/scheduled;
2. redeem token exists (“MINTED on OBJKT” label);
3. local titles/thumbs healthy;
4. front-end CMS CSV synced;
5. escrow redeem balance equals planned supply;
6. contract paused;
7. expected token pairs match chain;
8. local params JSON matches raw GitHub `staging` and `main` (`admin-ui/index.html:457-604`; `admin-ui/src/features/drops/drops.checklist.controller.js:738-943`).

**OBSERVED BEHAVIOR.** Live is not merely “time has passed.” Both public and Admin enter standby after the configured instant and poll escrow storage. They transition to `live` only after observing `storage.paused === false` (`drops/js/events.js:2024-2198`; `admin-ui/src/features/drops/drops.countdown.service.js:39-110`, `admin-ui/src/features/drops/drops.countdown.service.js:150-187`). This is the authoritative existing live rule.

**OBSERVED BEHAVIOR.** The public surface polls the escrow's FA2 balance for the selected redeem contract/token every ten seconds while appropriate (`drops/js/events.js:818-922`). It already displays SOLD OUT when live and remaining supply is zero, although one button path additionally requires a connected wallet and selected burn token (`drops/js/events.js:2251-2277`, `drops/js/events.js:2640-2658`). Admin has no dedicated LIVE or SOLD OUT surface; its planned-supply checklist turns a post-redeem `9/10` into a warning (`admin-ui/src/features/drops/drops.checklist.controller.js:532-643`).

**CURRENT STATE.** `admin-ui/src/tzkt-api.js` exposes recent target transactions (`getRecentOps`) but no consumer uses it (`admin-ui/src/tzkt-api.js:292-295`). A redeem activity feed is technically feasible, but parameter parsing, applied/failed filtering, pagination, batching, indexer lag, and identity verification still need implementation.

## Drop-param generation and validation

**CURRENT STATE.** `gen-drop-params-json.mjs` imports the JavaScript authority and writes JSON when normalized contents change (`shared/drop-params/gen-drop-params-json.mjs:5-38`). The watcher debounces `fs.watch` by 150ms, serializes generator requests by epoch, and atomically replaces only the Admin mirror (`shared/drop-params/watch-drop-params-json.mjs:20-39`, `shared/drop-params/watch-drop-params-json.mjs:60-120`). The shared JSON write itself is not atomic.

Admin imports `drop-params.mirror.json` at bundle time (`admin-ui/src/features/drops/drops.controller.js:43-47`). Its build runs thumbnail generation, one-shot param sync, a JSON-parse guard, then Parcel (`admin-ui/package.json:6-15`; `admin-ui/scripts/build-guard-drop-params-mirror.mjs:1-18`). There is no browser-to-filesystem write bridge or local API server.

Validation is layered but incomplete:

- JSON syntax guard for the mirror;
- strict shared date/time parsing;
- permissive normalization with multiple legacy aliases and heuristics (`admin-ui/src/features/drops/drops.data.js:20-75`, `admin-ui/src/features/drops/drops.data.js:118-223`);
- registry/network validation;
- collection/mirror translation audits, range-overlap checks, pause/send gating, and on-chain status checks.

There is no single schema validator for the complete drop-params object. `drops.data.parse()` can evaluate a selected JavaScript string with `new Function`, but no current UI wires this helper and it should not become the basis of a writable raw editor (`admin-ui/src/features/drops/drops.data.js:28-75`).

## Current disagreements and seams

1. **HEN identity:** CMS/title identity uses sparse mainnet token IDs; Shadownet/local thumbs use 0-16. The explicit `shared/chain-registry.js` mirror and `admin-ui/src/utils/hen-ids.js` translation remain authoritative; mirror IDs are lookup adapters, not CMS identity.
2. **THE 419 SCRIPT labels:** token IDs 0-12 map to titles `// 01`-`// 13`; title ordinal is not token identity (`admin-ui/src/titles/the419script.json`).
3. **INTRODUCTIONS order:** IDs 0-4 map to reverse-sounding FIVE-to-ONE titles; order cannot determine identity (`admin-ui/src/titles/introductions.json`).
4. **Slug derivation:** exact slugs are CMS-only inputs; existing migration evidence records at least one CANAAN slug that cannot safely be regenerated from title (`docs/webflow-migration/06-data-model.json`, `slug` field decision).
5. **Editions:** CMS and HTML treat editions as curated presentation data, while Admin also attempts chain-economic comparison. Existing migration design explicitly warns not to relabel Editions as live supply (`docs/webflow-migration/06-target-architecture.md:217-221`).
6. **CMS authority:** public rows are Webflow-owned today, while Admin local title/thumb resolution is repository-owned. Neither can silently overwrite the other without a staged comparison.

## Current state verdict

The repository is well positioned for a safe local orchestrator because it already has deterministic generators, explicit registry identity, read-side health checks, browser wallet boundaries, and a strong one-item CMS journal/reconciliation pattern. The missing core is not a “one-click” UI; it is a canonical record, collection policy, write bridge, mint-result contract, generalized CMS item adapter, and lifecycle-aware operational state.
