# Target architecture

## Architectural decisions

1. **Canonical authoring is local and versioned.** One record owns operator-authored work facts and captured integration identities.
2. **Registry, drop params, chain, and Webflow remain their own authorities.** The record references/derives from them; it does not duplicate live state.
3. **A loopback orchestration service is the privileged boundary.** Admin remains browser UI; Node owns narrow filesystem and credentialed adapters.
4. **The operation journal is separate.** It records approvals, attempts, hashes, external identities, failures, and reconciliation without contaminating content.
5. **Mint execution is adapter-based and optional.** Verified external-result import comes first.
6. **CMS staging and publishing are different phases/approvals.** Existing pilot-grade safety is generalized, not discarded.
7. **Collection policy drives branches.** THE 419 SCRIPT ends after local/CMS completion; CANAAN may explicitly enter drop preparation.
8. **Drop operational state is derived.** The existing post-time `paused === false` live rule and fresh balance/pair reads drive the UI.

## Components

```text
Admin browser UI
  Authoring workspace
  Validation/diff/approval views
  Existing Health, Drops, Wallet, Treasury, Pairs surfaces
        |
        | loopback HTTPS/HTTP + session capability, domain endpoints only
        v
Local orchestration service
  Record store + schema migration
  Collection policy resolver
  Read-only planner/diff engine
  Atomic local apply engine
  Operation journal/reconciler
  Adapters:
    - registry/drop-param readers
    - thumbnail/title/config generators
    - mint-result verifier
    - future wallet/external mint handoff
    - Webflow schema/item/asset staged-live adapter
    - Git read-only status/diff
        |
        +--> local Git working trees (no automatic Git mutation)
        +--> TzKT/RPC/IPFS reads
        +--> Webflow staged writes / separate publish
        +--> browser wallet approval for chain writes
```

## Ownership

| Component/source | Owns | Must not own |
|---|---|---|
| Authoring record | title, artwork/hash, edition intent, collection metadata, verified mint and CMS references, explicit drop intent | private keys, current chain balances, active drop state |
| Collection policy | allowed fields, generators, CMS projection, ID/URL strategy, drop eligibility | contract addresses duplicated from registry |
| Chain registry | network endpoints, contracts, mirrors | token title/CMS identity/drop selection |
| Drop params | configured drop intent and planned initial supply | minted/local/CMS lifecycle, current remaining supply |
| Operation journal | attempts, approvals, hashes, external IDs, reconciliation | canonical content or secrets |
| TzKT/chain | token existence/result, pause, pairs, balances, operations | operator intent |
| Webflow | staged/live CMS item and asset state | canonical local work facts |

## Local authoring and integration flow

### Draft/validate

- Admin edits one canonical record through a structured form.
- Service validates schema, collection policy, artwork path/hash, metadata, edition semantics, and derived projections.
- Planner shows expected local files, CMS fields, mint payload summary, and whether drop handoff is possible.
- No consumer files are changed.

### Mint

- Initial implementation imports an external operation hash or contract/token tuple and independently verifies it.
- Later adapter may prepare and request an exact Beacon/external mint approval.
- Service captures the authoritative token ID/result and stops on unknown outcome.
- The verified result, not operator retyping, unlocks identity-dependent outputs.

### Local apply

- Service creates generated candidates in a temporary workspace.
- It reuses the existing Sharp transform and manifest generator logic, but passes explicit verified IDs.
- It shows a path-scoped before/after diff across outer/nested repositories.
- On approval, it atomically applies, regenerates, and runs focused health checks.
- It never stages or commits.

### CMS stage/publish

- Adapter verifies current site/collection/schema/locale and duplicate token identity.
- It creates/captures one staged item, uploads/verifies one asset, populates fields, and re-reads staged/live state.
- It stops at `CMS_VERIFIED` for explicit publish approval.
- Publish targets only the captured item ID, followed by live verification and reconciliation.

### Optional CANAAN drop handoff

- Completion exposes “Prepare as drop candidate” only for eligible CANAAN policy.
- Operator explicitly opts in.
- Service proposes a drop-param draft using verified collection/token/title; it does not save automatically.
- The drop editor validates and saves only after a separate diff approval.
- Existing Treasury, pair send, pause/unpause, and GitHub parity flows remain separate actions.

## Token authoring state machine

The state represents verified gates, not button clicks. Failure/reconciliation is an orthogonal status that preserves the last verified state.

```text
DRAFT
  -> VALIDATED
  -> MINT_AWAITING_APPROVAL
  -> MINT_SUBMITTED / EXTERNAL_MINT_AWAITING_RESULT
  -> MINT_CONFIRMING
  -> MINTED_VERIFIED
  -> LOCAL_INTEGRATION_PLANNED
  -> LOCAL_INTEGRATED
  -> CMS_STAGE_AWAITING_APPROVAL
  -> CMS_STAGED
  -> CMS_VERIFIED
  -> CMS_PUBLISH_AWAITING_APPROVAL
  -> CMS_PUBLISHED_VERIFIED
  -> COMPLETE
```

Allowed variations:

- Artwork optimization may be prepared in DRAFT/VALIDATED, but final token-keyed integration waits for `MINTED_VERIFIED`.
- A collection with no CMS requirement could skip CMS states only if collection policy explicitly permits it. None of the four audited public collections currently does.
- THE 419 SCRIPT `COMPLETE` is terminal for this workflow.
- CANAAN `COMPLETE` may branch to `DROP_CANDIDATE`; it never does so automatically.

### State invariants

| State | Minimum proof |
|---|---|
| VALIDATED | record/artwork hash and all collection-specific validations pass |
| MINT_AWAITING_APPROVAL | immutable mint plan hash exists |
| MINTED_VERIFIED | chain independently confirms expected contract/token/metadata result |
| LOCAL_INTEGRATED | exact generated outputs applied; Admin resolves title/thumb; focused health passes |
| CMS_STAGED | captured Webflow item/locale identity and write observed |
| CMS_VERIFIED | fresh staged read matches plan; live/non-target preservation gates pass |
| CMS_PUBLISHED_VERIFIED | fresh live item matches approved staged result |
| COMPLETE | all required policy gates pass and journal has no reconciliation requirement |

Any network failure after a possible write sets `reconciliationRequired:true`; it does not regress or optimistically advance state. This follows the current CMS pilot pattern (`assets/webflow-cms-image-pilot/README.md:57-60`).

## Drop handoff and operational state machine

```text
COMPLETE (CANAAN only)
  -- explicit opt-in --> DROP_CANDIDATE
  --> DROP_CONFIG_DRAFT
  --> DROP_CONFIG_VALIDATED
  -- approved file save --> DROP_CONFIGURED
  --> PRE_DROP_READY
  -- scheduled instant, paused --> STANDBY
  -- fresh storage paused:false after instant --> LIVE
  -- fresh remaining balance zero --> SOLD_OUT
  -- explicit approved dropScheduled:false save --> CLEARED / NO DROP
```

`DROP_CONFIGURED` is not `PRE_DROP_READY`; params may select a token before title/CMS/supply/pairs/Git checks pass. `SOLD_OUT` is informational and persists. Clearing is manual and does not automatically pause, remove pairs, transfer assets, publish Git, or clean CMS.

Operational flags sit beside lifecycle state:

- `pause: paused | unpaused | unknown`;
- `pairs: full | partial | missing | unknown`;
- `remaining: value + observedAt + source | unknown`;
- `indexer: fresh | stale | unavailable | disagreeing`;
- `activity: verified | partial | unavailable`.

The existing live trigger is preserved (`admin-ui/src/features/drops/drops.countdown.service.js:39-110`). Durable “has gone live” across pause/reload remains a separate design decision; date alone is not enough.

## Generated outputs

The canonical record should project to current consumers rather than forcing an immediate runtime rewrite:

- entries in `admin-ui/src/titles/*.json`;
- optimized files in `admin-ui/src/thumbs/**`;
- regenerated `admin-ui/src/thumbs.manifest.js`;
- CMS create/update payload and local verification snapshot;
- optional drop-param proposal, never an automatic save;
- future static-site data if the separate Webflow migration architecture is implemented.

Generated files retain their current contracts. The roadmap should not combine authoring with a Webflow-removal or public runtime migration.

## Verification architecture

### Before any write

- validate current record and target authority versions;
- calculate plan hash and exact diffs;
- confirm repository roots/branches and target path hashes;
- verify external schemas/identity and no duplicate token;
- classify the action and require the corresponding approval.

### After local write

- regenerate through supported scripts;
- verify exact structural projection;
- run focused title/thumb/record tests;
- verify only planned paths changed;
- record before/after hashes and separately report outer/nested diffs.

### After external write

- re-read authoritative staged/live/chain state;
- compare identity and every intended/preserved field;
- record freshness, IDs, hashes, and status;
- if ambiguous, reconcile before retry.

## Interrupted operations

On startup/resume:

1. load canonical record and journal;
2. verify record hash matches the last plan;
3. inspect last successful phase and incomplete attempt;
4. re-read local/external state for any phase that might have written;
5. classify outcome as not applied, applied-and-valid, applied-but-invalid, or unresolved;
6. offer only legal next actions: retry read, reconcile, restore local before bytes, continue, or request a new explicit approval.

Never replay a mint, publish, CMS create, or chain operation just because the process stopped.

## Architecture verdict

The target is a local control plane over existing files/tools and external authorities, not a replacement database. The highest-value foundation is the record/policy/planner/journal. The highest-risk adapters—mint submission, Webflow item creation/publication, and local filesystem writes—remain narrow, separately approved, and independently reconcilable.
