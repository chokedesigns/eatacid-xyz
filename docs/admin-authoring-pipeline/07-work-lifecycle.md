# Work lifecycle

Status: **PLANNED**. The states below describe the intended human-facing workflow, not a current state machine in code.

## Happy path

```text
Create Work
  -> Validate
  -> Obtain / Import Minted Identity
  -> Generate Local Artifacts
  -> Stage CMS
  -> Verify
  -> Human Preview
  -> Publish
  -> Verify Live
  -> Optional Downstream Action
```

For CANAAN, the optional downstream action may be **Prepare Drop**. For THE 419 SCRIPT, normal authoring ends after verified publication. HEN and INTRODUCTIONS new-work lifecycles remain unresolved.

## Human-facing stages and proof

| Stage | Human meaning | Minimum proof before advancing |
|---|---|---|
| Create Work | Capture draft facts and source artwork | Stable draft identity; no downstream writes |
| Validate | Check record, collection policy, source content, and planned projections | Valid record/artwork hash; no identity or path collision |
| Obtain / Import Minted Identity | Complete the current external mint and provide its result | Independent network/contract/token/result verification; unresolved evidence blocks progress |
| Generate Local Artifacts | Produce exact local title/thumb/manifest changes | Verified minted identity, exact diff approval, generated consumer health |
| Stage CMS | Create/populate only the staged representation | Fresh schema/duplicate preflight, exact target approval, returned IDs captured |
| Verify | Re-read staged state and compare fields/image/non-target scope | Exact intended staged representation; no unresolved mutation |
| Human Preview | Operator reviews the staged work as a product | Explicit approval decision; preview itself writes nothing |
| Publish | Publish only the captured intended item | Fresh verification and separate publication approval |
| Verify Live | Prove intended content and clean publication | Live content/image match plus clean publication metadata |
| Optional Downstream Action | Enter a collection-allowed separate workflow | Explicit collection policy and new approval boundary |

## Internal verified states

An implementation may use more precise internal states, but they should map cleanly to the human flow:

```text
DRAFT
  -> VALIDATED
  -> MINT_RESULT_AWAITING_IMPORT
  -> MINTED_IDENTITY_VERIFIED
  -> LOCAL_ARTIFACTS_PLANNED
  -> LOCAL_INTEGRATED
  -> CMS_STAGE_AWAITING_APPROVAL
  -> CMS_STAGED
  -> CMS_STAGED_VERIFIED
  -> CMS_PUBLISH_AWAITING_APPROVAL
  -> CMS_LIVE_VERIFIED
  -> COMPLETE
```

State records verification gates, not button clicks or HTTP responses.

## Authoring and publication are not downstream activation

`COMPLETE` means the collection’s authoring/local/CMS requirements passed. It does not mean:

- mint signing was performed by Admin;
- drop params were edited;
- a Git branch was pushed or deployed;
- redeem supply was transferred;
- pairs were written;
- a contract was unpaused;
- a drop is live.

Those actions live in separate operational workflows.

## Exceptional states

Errors should be represented beside the last verified product state rather than inventing a second happy path.

### Validation blocked

No write was attempted. The operator corrects the canonical input, receives a new plan hash, and validates again.

### Definite mutation failure

Evidence shows the write was not applied. Preserve the attempt, refresh current state, and require a new legal action/approval where appropriate.

### Ambiguous mutation

A write may have been applied, but its response was lost or inconclusive.

```text
last verified state remains unchanged
  + reconciliationRequired = true
  -> read actual external state
  -> classify applied | not applied | unresolved
```

No uncertain CMS, mint, publish, or chain write is blindly repeated.

### Applied but verification failed

The external state exists but does not match intent. Stop downstream progress. Preserve exact IDs and evidence. Offer only scoped correction, restore, or separately approved cleanup actions supported by policy.

### Local transaction failed

Restore exact before bytes when safe, verify restoration, and leave the source/work record available for a corrected plan. Never use Git reset/stash/checkout as application rollback.

### Human rejected or cancelled

Remain at the last verified non-consequential stage. Rejection is not an error and does not authorize cleanup of external staged state.

## Resume rules

On resume, the pipeline should:

1. load the canonical record and operation evidence;
2. verify that current input hashes still match the approved plan;
3. identify the last verified stage and any possibly applied write;
4. re-read current local/external state;
5. reconcile before offering retry or continue;
6. invalidate approvals when their bound facts changed.

The operator should see simple actions such as **Continue**, **Review staged item**, or **Reconcile uncertain publish**. Low-level journal phases and migration confirmation strings remain troubleshooting details.

## Separation from Drops lifecycle

The work lifecycle ends or hands off at a boundary. Drop configuration/readiness/live/sold-out states are owned by the Drops system and current chain/config authorities, not folded into the authoring record. See [CANAAN drop handoff](08-canaan-drop-handoff.md).
