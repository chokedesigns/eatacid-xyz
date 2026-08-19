# CANAAN drop handoff

Status: **DESIGNED, NOT IMPLEMENTED**.

## Boundary

An authored and published CANAAN may become a drop candidate, but authoring and drop activation are different workflows.

```text
CANAAN CMS_LIVE_VERIFIED / COMPLETE
  -> optional explicit Prepare Drop
  -> drop proposal
  -> separate validation and save approval
  -> existing operational readiness actions
  -> separate go-live action
```

The handoff must never occur automatically merely because a CANAAN was minted, locally integrated, or published.

## Current drop authority

The editable authority is:

```text
shared/drop-params/drop-params.js
```

Generated projections are:

```text
shared/drop-params/drop-params.json
admin-ui/src/drop-params.mirror.json
```

The projections must not be edited by hand. Current public/Admin consumers import the authoritative/generated forms and combine them with registry and chain reads.

At this architecture snapshot `dropScheduled` is `false`, which is the existing **NO DROP** sentinel. The exact active value is mutable operational state and must be read at handoff time.

## What Prepare Drop may do in V1

The optional V1 handoff may prepare a validated proposal using already verified work facts:

- CANAAN collection selection;
- canonical minted token ID;
- exact title for preview;
- a draft name/schedule and explicitly named supply/economic inputs;
- resolved configured-environment contract/token lookup;
- a before/after preview of the authoritative drop-param source.

The proposal is not a save. A future safe editor/apply operation requires a separate plan, current-source hash, semantic validation, and exact-diff approval.

## What the handoff must not do

- automatically set `dropScheduled:true`;
- hand-edit either generated JSON projection;
- infer a network from `dropName` or display copy;
- enable mainnet or fill missing escrow configuration;
- transfer redeem supply;
- write token pairs;
- publish/push Git state;
- unpause the contract or declare the drop live;
- clear a prior drop automatically;
- make THE 419 SCRIPT, HEN, or INTRODUCTIONS redeem candidates by analogy.

## Existing operational workflow remains separate

Current Admin Drops behavior already checks or manages:

- params loaded/scheduled;
- configured redeem token existence through TzKT;
- local title/thumbnail health;
- manually loaded CMS CSV health;
- escrow balance versus configured plan;
- pause state;
- expected/actual pair state;
- branch-copy parity for generated drop JSON;
- wallet-authorized transfer/pair/pause operations.

Those checks do not become authoring stages. The handoff supplies a candidate configuration only; the existing operational system remains responsible for readiness and chain actions.

## Supply and lifecycle terms

Keep these distinct:

- `editionCount`: authored/presentation or mint-intent quantity under a still-open semantic decision;
- `mintedSupply`: independently observed mint result when available;
- `dropInitialSupply`: amount intended for the drop;
- `dropRemainingSupply`: fresh escrow balance;
- `redeemAmountPerTrade`: configured output per trade.

Do not overload `supply` or copy one value into another without policy.

Likewise:

- **drop configured** means params select a drop;
- **pre-drop ready** means required operational checks passed;
- **live** preserves the existing rule: scheduled time reached and a fresh storage read observes unpaused;
- **sold out** requires a confirmed remaining escrow balance of zero after live;
- **cleared/no drop** requires an explicit `dropScheduled:false` save and does not mutate chain state.

The authoring pipeline needs only the handoff boundary. A future Drops lifecycle UI may improve operational states independently.

## Failure and concurrency rules

- Re-read the current drop-param source immediately before planning and applying.
- Block or re-plan if the expected source hash changed.
- Treat outer and nested generated effects as separate Git worktrees.
- Restore exact before bytes if a local apply/generation transaction fails.
- Never stage, commit, push, reset, stash, or deploy as part of the editor.
- A partially generated local configuration is not a reason to mutate the chain.

## THE 419 SCRIPT contrast

THE 419 SCRIPT can share canonical-record, thumbnail, mint-result, and CMS infrastructure. Its normal authoring flow ends after verified CMS publication. Runtime Exchange participation does not imply a CANAAN-style drop handoff.
