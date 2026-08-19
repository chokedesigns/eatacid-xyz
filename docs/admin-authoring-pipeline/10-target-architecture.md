# Target architecture

Status: **ACCEPTED DESIGN, NOT IMPLEMENTED**.

## Architectural shape

```text
Admin browser UI
  - new-work form and planner
  - validation, diff, preview, approval, and reconciliation views
  - existing Health, Drops, wallet, treasury, and pairs surfaces
            |
            | narrow loopback domain API + session capability
            v
Local authoring service
  - canonical work records + schema migrations
  - collection policies
  - deterministic planner and validators
  - local artifact generator/apply transaction
  - operation evidence/journal and reconciler
  - adapters:
      registry/drop-param readers
      mint-result observer/importer
      future optional mint handoff
      Webflow CMS/assets staged-live adapter
      read-only Git status/diff
            |
            +-> outer and nested working trees (no automatic Git mutation)
            +-> configured TzKT/RPC/IPFS reads
            +-> Webflow staged writes and separate exact-item publish
            +-> browser/external wallet only for signing
```

This is a local control plane over existing files, tools, and external authorities. It is not a replacement public runtime, a Webflow-removal project, or a general database/admin backend.

## Component ownership

| Component | Owns | Does not own |
|---|---|---|
| Canonical work record | authored facts, stable draft identity, verified minted identity, captured integration identities, lifecycle result | contracts/endpoints, current chain state, active drop, secrets |
| Collection policy | required authored fields, identity adapters, projection rules, allowed lifecycle branches | copied contract addresses or remote live schema truth |
| Chain registry | networks, contracts, environment mirrors, escrow config | titles, artwork, CMS item identity, drop selection |
| Local generator | deterministic candidate bytes and current consumer projections | canonical facts or permission to apply |
| Operation journal/evidence | attempts, approvals, plan/input hashes, redacted external results, reconciliation | canonical content or secret material |
| Webflow adapter | schema/state preflight, captured item/asset IDs, staged/live mutations and verification | canonical content identity |
| Mint observer/adapter | prepared request summary and verified external result | private keys, optimistic success, local/CMS completion |
| Drop params | currently configured drop intent | work authoring, minted identity authority, remaining supply |
| Chain/TzKT | token/operation/storage/balance runtime truth | operator intent |

## Planning before side effects

Every domain operation first produces a plan:

- exact inputs and content hashes;
- authority versions/preflight results;
- intended local paths or external targets;
- generated field payloads and diffs;
- action risk class and required approval;
- postcondition checks and recovery path;
- plan hash invalidated by any relevant change.

Reads and deterministic temporary generation may occur during planning. Consequential local/external writes require the approval appropriate to that operation.

## Local application model

The service has narrow, allowlisted actions rather than general filesystem access. It plans across the two Git roots, applies only intended paths after optimistic-concurrency checks, runs supported generators, verifies consumer behavior, and reports outer/nested diffs separately.

Existing formats remain in place initially:

- `admin-ui/src/titles/*.json`;
- `admin-ui/src/thumbs/**`;
- generated `admin-ui/src/thumbs.manifest.js`;
- shared drop params and generated mirrors when a separately approved handoff is implemented.

The canonical record projects into current consumers. V1 does not require rewriting the public site or Admin runtime around a new database.

## External integration model

### Mint

V1 prepares data and verifies an external/manual result. A later adapter may request signing, but the wallet remains the signing boundary and observation remains a separate step.

### Webflow

The service holds the Webflow credential and composes `assets/webflow-cms/webflow-cms.mjs` behind application operations. New item creation, collection policy, approval binding, and durable lifecycle evidence are added at this layer; they are not falsely attributed to the retained library.

Staging, human preview, exact-item publication, and live verification are separate states/actions.

### Drops

Only a completed CANAAN may expose an optional proposal. Active drop configuration and all chain operations remain separate authorities/actions.

## Record and operation evidence

Canonical content and operation history are separate:

- editing a title should not rewrite old attempts;
- retrying a read should not change canonical facts;
- a failed or ambiguous mutation remains visible without corrupting the current work;
- secret values are never persisted;
- resume uses captured IDs and hashes instead of searching by title or order.

The exact persistence paths and retention policy remain open implementation decisions.

## Verification model

### Before a local write

- validate record/policy/artwork and verified identity;
- confirm both repository roots, current path hashes, and collisions;
- generate candidates and exact diffs;
- bind approval to the plan hash.

### After a local write

- regenerate through supported code;
- verify exact projected structure and Admin lookup behavior;
- confirm only planned paths changed;
- record separate outer/nested results;
- restore exact before bytes on transactional failure.

### Before an external write

- perform fresh target/schema/identity/duplicate preflight;
- confirm exact collection/item/locale or intended creation key;
- snapshot needed preservation scope;
- request the operation-specific approval.

### After an external write

- capture returned identities immediately;
- re-read the authoritative external state;
- verify every intended field/content/postcondition;
- reconcile uncertain outcomes before any repeat;
- do not advance the product state until verification passes.

## User experience

The normal UI should expose the product flow:

```text
Create -> Validate -> Import Mint -> Generate -> Stage -> Preview -> Publish -> Complete
```

It should show exact diffs and consequential confirmations when needed, while keeping implementation details such as retry counts, journal events, content hashes, and API IDs in expandable troubleshooting evidence. Safety controls must remain real without turning routine authoring into migration operations.

## Deployment boundary

The target architecture does not automatically:

- commit or push either repository;
- deploy public/Admin builds;
- publish a Webflow site globally;
- sign a mint in V1;
- transfer tokens, set pairs, or unpause;
- enable mainnet or repair incomplete registry slots;
- remove Webflow from the public runtime.

Each is a distinct project or approval boundary.
