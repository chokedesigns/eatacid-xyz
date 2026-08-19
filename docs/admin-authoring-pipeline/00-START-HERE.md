# Admin Authoring Pipeline: start here

Architecture version: 2

Project status: documented architecture; the authoring pipeline itself is not implemented.

## What this project is

The Admin Authoring Pipeline is the planned local workflow for adding an artwork to EAT ACID once and carrying the same verified facts through mint-result capture, local Admin assets, Webflow CMS publication, and any collection-specific downstream action.

It exists to replace a fragmented process in which title, token ID, artwork, editions, CMS fields, local thumbnail keys, and optional drop configuration are entered or inferred in several places. The goal is not a universal database or a one-click release button. The goal is one canonical work record, deterministic projections, explicit approvals, and evidence-based verification at every external boundary.

The first product slice is **Add a New CANAAN**.

## Implemented today

- A static Parcel Admin UI with local title data, local thumbnail lookup, browser-wallet Tezos operations, health checks, and Drops operations.
- Network, contract, and environment-ID authority in `shared/chain-registry.js`, with HEN translation consumed through `admin-ui/src/utils/hen-ids.js`.
- Canonical Admin thumbnail masters under `admin-ui/src/thumbs/`, a generated `admin-ui/src/thumbs.manifest.js`, and deterministic thumbnail tooling under `assets/thumbs/`.
- Shared drop configuration in `shared/drop-params/drop-params.js` with generated/mirrored JSON outputs.
- Webflow CMS as the public presentation system. Admin CMS health currently consumes manually selected CSV exports; it is not an API authoring UI.
- Reusable Webflow primitives in `assets/webflow-cms/webflow-cms.mjs` for authenticated reads, asset handling, explicit field patches, exact-ID publication, verification, safe retry classification, redaction, and ambiguous-write reconciliation.
- External/manual minting followed by repository updates. The repositories contain no mint builder, submitter, metadata writer, or mint-result importer.

See [Current system](01-current-system.md) for the full implemented/planned split.

## Planned end state

A local Admin author enters or confirms work facts once. The pipeline validates the record, imports and verifies the result of the existing external mint flow, generates local artifacts from the verified identity, creates and verifies a staged CMS representation, pauses for human preview and publication approval, verifies the live result, and then offers only the downstream actions allowed by that collection.

For CANAAN, one optional downstream action is **Prepare Drop**. Authoring and CMS publication do not configure, seed, publish, or activate a drop.

V1 does not sign or submit mints. It separates:

1. preparing and validating mint data;
2. submitting/signing through the current external process;
3. importing and independently verifying the result.

## Settled architectural rules

- A work has one canonical identity. Mainnet/canonical collection and token identity is used for authored and CMS facts; environment-specific lookup IDs are adapters.
- The future canonical work record owns operator-authored facts and captured integration results. It does not replace the chain registry, live chain state, Webflow staged/live state, or active drop params.
- Planned state must never be described as implemented state.
- Local intended image content is the verification authority. A Webflow asset-library ID and the Image identity returned from a CMS item may legitimately differ.
- Matching staged/live field content does not prove clean publication. Publication flags and timestamps must show that publication covers the updates.
- Reads may retry within a bound. A write with an uncertain outcome is reconciled from actual state before any retry.
- CMS staging and CMS publication are separate operations; publication requires explicit human approval.
- Collection policy controls workflow branches. Shared infrastructure does not make every collection a Drops workflow.
- Safety machinery belongs behind the normal authoring flow. Migration batch IDs, baseline hashes, journal phases, and confirmation strings are not normal author inputs.

The authoritative decision log is [Decisions and invariants](12-decisions-and-invariants.md).

## Authoritative source locations

| Question | Current authority or implementation |
|---|---|
| Network, collection contracts, environment mirrors | `shared/chain-registry.js` |
| HEN canonical/network translation consumed by Admin | `admin-ui/src/utils/hen-ids.js` |
| Admin-local titles | `admin-ui/src/titles/*.json` and `admin-ui/src/titles.manifest.js` |
| Thumbnail conversion/input/backfill tooling | `assets/thumbs/` |
| Admin thumbnail masters | `admin-ui/src/thumbs/` |
| Generated Admin thumbnail lookup | `admin-ui/src/thumbs.manifest.js` via `admin-ui/scripts/gen-thumbs-manifest.mjs` |
| Reusable Webflow layer | `assets/webflow-cms/webflow-cms.mjs` |
| Active drop configuration | `shared/drop-params/drop-params.js` |
| Generated drop projections | `shared/drop-params/drop-params.json`, `admin-ui/src/drop-params.mirror.json` |
| Minted identity and runtime chain facts | Tezos, observed through configured RPC/TzKT readers |
| CMS staged/live state and returned item/asset identities | Webflow API at operation time |
| Future authored work facts | Canonical work record; design accepted, storage path/schema unresolved and not implemented |

For the complete authority matrix, read [Identity and source of truth](02-identity-and-source-of-truth.md).

## What not to infer from the CMS image migration

The completed image migration proved production safety rules and left reusable code. Its batch orchestration, targets, rollout baselines, migration journals, and confirmation rituals were retired. They are not the Admin architecture, and their absence does not mean the safety lessons were discarded.

Do not infer that:

- the Admin authoring pipeline exists because Webflow primitives exist;
- new CMS item creation exists because known items can be patched;
- migration batch or journal concepts should appear in the authoring UI;
- the completed image migration implemented minting, canonical work records, local generation orchestration, or drop handoff;
- historical CMS snapshots replace a fresh schema/state preflight before a future write.

The concise historical evidence is `docs/webflow-cms-image-migration.md`; it is supporting reading, not required orientation for ordinary AUTHOR work.

## FOR A NEW LLM CONVERSATION

Before proposing a change:

1. Read this file, [Current project state](13-current-project-state.md), and the task-relevant document below.
2. Inspect the exact current source paths named by those documents. The repository, not prior chat or historical commands, is the source of truth.
3. Verify the outer and nested Git roots/statuses and follow both applicable `AGENTS.md` files when touching Admin code.
4. Classify every claim as **implemented today**, **planned**, or **unresolved**. Do not silently promote a design into current capability.
5. Preserve canonical identity, collection-policy branches, staged/published separation, and uncertain-mutation reconciliation.
6. Treat external writes, wallet signing, publication, drop configuration, and go-live as distinct authorization boundaries.
7. For implementation work, start with the vertical V1 in the roadmap and the mutable current-state handoff; do not resurrect the retired migration workflow.

### Task-based reading map

| Task | Read first |
|---|---|
| What exists now? | [Current system](01-current-system.md) |
| Identity or authority question | [Identity and source of truth](02-identity-and-source-of-truth.md) |
| Canonical record/schema question | [Canonical work record](03-canonical-work-record.md) |
| Thumbnail/title/local generation | [Local artifact generation](04-local-artifact-generation.md) |
| Webflow API, staging, image, or publication | [Webflow CMS adapter](05-webflow-cms-adapter.md) |
| Collection-specific behavior | [Collection policies](06-collection-policies.md) |
| Workflow states or recovery | [Work lifecycle](07-work-lifecycle.md) |
| CANAAN and Drops | [CANAAN drop handoff](08-canaan-drop-handoff.md) |
| Minting, wallets, credentials, or signing | [Minting, security, and wallets](09-minting-security-and-wallets.md) |
| Component boundaries and end state | [Target architecture](10-target-architecture.md) |
| What to build next | [Implementation roadmap](11-implementation-roadmap.md) and [Current project state](13-current-project-state.md) |
| Settled rules and anti-goals | [Decisions and invariants](12-decisions-and-invariants.md) |
