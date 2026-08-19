# Implementation roadmap

The roadmap is organized around vertical product value. The first target is not a generalized platform; it is one complete, safe **Add a New CANAAN** path.

## V1: Add a New CANAAN

### Product outcome

An operator can define one new CANAAN once, complete the current external/manual mint, import and verify the resulting identity, generate deterministic local artifacts, create and verify the Webflow representation, explicitly publish it, verify it live, and optionally prepare a separate drop proposal.

V1 is complete only when the path works end to end with interruption/reconciliation tests. A collection of disconnected foundation libraries is not the product outcome.

### Vertical sequence

1. **Canonical work record**
   - Finalize the smallest versioned schema and CANAAN policy.
   - Resolve record/journal locations, artwork roots, edition semantics, and fixture strategy.
   - Add a representative CANAAN fixture and deterministic plan hash.

2. **Admin new-work planner/form**
   - Add a structured CANAAN form and read-only plan/validation view.
   - Introduce the narrow loopback service with session/origin/path controls.
   - Do not expose arbitrary files, commands, or Webflow proxy calls.

3. **Source artwork validation**
   - Constrain the source to approved roots/types/sizes.
   - Decode, hash, and show exact intended content/profile.
   - Reject path escape, hash changes, and destination collisions.

4. **External/manual mint result import**
   - Keep the existing signing process outside V1.
   - Accept the actual supported result reference.
   - Independently verify network, collection, token identity, operation/token state, and required metadata evidence.
   - Stop on unknown or mismatched result.

5. **Deterministic local artifact generation**
   - Reuse the current thumbnail conversion contract.
   - Add explicit verified-token-ID mode; do not use next-number allocation.
   - Plan the title map, master, and generated manifest changes across the nested repo.
   - Apply only after exact-diff approval with rollback tests.

6. **Thumbnail/local verification**
   - Regenerate through supported code.
   - Verify the Admin resolves the exact title/image for the intended network/contract/token.
   - Confirm no unrelated paths changed.

7. **Staged Webflow CMS creation**
   - Freshly preflight site, CANAAN collection schema, fields, and locale.
   - Add application-level new-item creation; the retained library does not have it.
   - Detect duplicates by canonical collection/token identity.
   - Upload and verify the deterministic asset, capture IDs, populate exact CANAAN fields, and never auto-publish.

8. **Automatic staged verification**
   - Re-read staged/live states.
   - Verify every intended field and image by content.
   - Check relevant preservation scope and mutation outcome.

9. **Human preview**
   - Present the staged work and concise verification evidence.
   - Allow correction or rejection without automatic cleanup.

10. **Explicit publication**
    - Revalidate plan and staged state.
    - Require separate exact-item approval.
    - Publish only the captured item ID; never full-site publish as a shortcut.

11. **Live verification**
    - Verify live fields and content.
    - Verify publication flags/timestamps cover all updates.
    - Reconcile any uncertain publish result before retry.

12. **Optional CANAAN -> Drops handoff**
    - Offer **Prepare Drop** only after the work is complete.
    - Produce a proposal/diff, not an automatic save or chain action.
    - Keep drop-param apply, deployment, treasury/pairs, and unpause separately approved.

## Implementation increments within the vertical

The team may ship/review the vertical in safe increments, provided each remains explicitly incomplete until the end-to-end outcome exists:

- record + CANAAN policy + read-only planner;
- secure local service + explicit-ID local generation;
- verified external mint-result import;
- read-only Webflow preflight/verification adapter;
- staged item creation and asset handling;
- separate exact-item publication and live verification;
- optional drop proposal.

Each increment should add fault-injection tests for its write boundary and must preserve current runtime behavior.

## V1 hard gates

- No canonical identity derived from title/order/next filename.
- Existing thumbnail conversion/input/backfill tests remain green.
- HEN identity tests remain green even though V1 targets CANAAN.
- Local writes are path-allowlisted, optimistic, reviewable, and recover exact prior bytes.
- No API token or presigned upload detail enters UI-visible/tracked logs.
- Webflow writes target a preflighted site/collection/locale and one canonical work.
- Image verification is content-based.
- Staged publication remains human-approved and separately verified.
- Unknown mutation outcomes block and reconcile; they never auto-repeat.
- No Git stage/commit/push/deploy or chain write is hidden in completion.

## Later phases

### THE 419 SCRIPT vertical

Reuse the V1 platform with its distinct display ordinal, CMS mint-date/OBJKT fields, and no Drops handoff. Prove that collection policy branches rather than CANAAN conditionals control behavior.

### HEN and INTRODUCTIONS decisions

Decide whether new authoring is supported at all. If supported, implement explicit environment adapters and presentation-order rules without changing canonical identity.

### Optional mint submission

Only after the current mint mechanism, permissions, metadata hosting, payload, costs, result, and confirmation policy are documented. Add an exact-plan browser-wallet/external adapter with no private-key custody and no blind retry.

### Existing-work backfill

Consider importing existing works only after new-work V1 proves lossless projections. Do not make backfilling all completed CMS records a prerequisite for the first CANAAN.

### Drop tooling and operational lifecycle

A safe structured drop-param editor and a clearer live/sold-out operational UI have value but are separate from the authoring vertical. They must preserve the current drop source, chain authority, and go-live rules.

### Public runtime/Webflow replacement

The separate `docs/webflow-migration/` architecture may eventually change public data ownership. Do not combine it with V1 authoring.

## Open questions that block parts of V1

- canonical record/journal storage and retention;
- allowed source-art roots and managed-master policy;
- exact meaning of editions and required economic fields;
- current mint tool/result and sufficient verification/finality;
- current Webflow schema/locale and new-item creation behavior;
- slug approval/conflict policy;
- failed staged-item and orphan-asset retention/cleanup policy;
- approved staging/test identities for future external-write tests.

These questions do not change the immediate target. They should be resolved at the step that first depends on them.

## What not to build

- Do not resurrect migration batch orchestration.
- Do not ask authors to manage migration journals, baseline SHA fingerprints, or confirmation strings.
- Do not build generalized multi-collection abstractions before they are needed by the CANAAN vertical.
- Do not force every collection through Drops.
- Do not add private-key signing or integrated mint submission to V1.
- Do not treat Webflow asset IDs as image content identity.
- Do not accept staged/live equality as clean publication proof.
- Do not blindly retry uncertain writes.
- Do not auto-publish, auto-delete, auto-commit, auto-deploy, or auto-go-live.
- Do not edit generated projections by hand.
