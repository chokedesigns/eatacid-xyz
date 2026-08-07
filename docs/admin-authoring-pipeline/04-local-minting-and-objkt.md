# Local minting and OBJKT audit

## What exists today

**CURRENT STATE.** No mint implementation exists in the outer or Admin repository. There is no OBJKT client dependency, no metadata pinning writer, no mint entrypoint builder, no mint CLI, no local signer, and no code that captures a minted token ID.

The codebase does contain:

- browser Beacon clients for mainnet/Shadownet permission and operation requests (`shared/beacon-setup.js:88-154`, `admin-ui/src/beacon-setup.js:109-164`);
- public burn/redeem and exchange operation builders (`drops/js/events.js:931-1118`; `exchange/js/exchange.js:1054-1200`);
- Admin pause, transfer, withdraw, and pair-write operations (`admin-ui/src/escrow-ops.js`; `admin-ui/src/features/drops/drops.send.service.js:99-279`);
- TzKT token/metadata readers, including IPFS metadata resolution (`admin-ui/src/adapters/collection-catalog.js:46-123`, `admin-ui/src/utils/nft.js:583-685`);
- CMS OBJKT links for 35 audited items (`docs/webflow-migration/02-cms-schema.md:151-180`).

The Admin checklist label “Redeem token MINTED on OBJKT” resolves the configured collection contract and calls the generic TzKT token-existence endpoint. It proves only that the token exists at the selected contract/ID; it does not prove the marketplace used, creator, mint operation, metadata equality, or ownership (`admin-ui/src/features/drops/drops.checklist.controller.js:492-528`; `admin-ui/src/tzkt-api.js:308-327`).

**OPEN QUESTION.** How the operator mints today—OBJKT web UI, another wallet dapp, a script outside this repo, a collection contract UI, or another service—is not in repository evidence.

## Information boundaries

### Known before minting

The desired future workflow can know these facts before execution, once a canonical record exists:

- collection policy and intended network;
- source artwork bytes/hash;
- exact title and collection-specific metadata;
- intended edition/mint quantity;
- safe mint options and intended creator/recipient;
- expected metadata document and all referenced content hashes;
- local derivative plan and CMS field projection;
- whether the collection may ever offer a drop-candidate handoff.

Today these facts are not modeled together. Title JSON, thumbnail input, CMS fields, and external mint UI each receive some subset.

### Authoritative only after minting

- actual operation hash and applied/failed status;
- actual collection contract and token ID;
- confirmed block/time and finality depth;
- actual on-chain metadata URI/content;
- observed minted supply/ownership where the contract exposes it;
- marketplace URL only after a route rule and identity are verified.

**RECOMMENDATION.** Downstream generators must consume a verified `mint.result`. A token ID text box may be used only for importing an external mint result, and import must independently verify contract/token/metadata on chain before accepting it.

## Current post-mint manual updates

For CANAAN or THE 419 SCRIPT, current repository structure implies these manual steps:

1. add token ID/title to the appropriate `admin-ui/src/titles/*.json` file;
2. place artwork in the collection input folder;
3. run thumbnail input processing, which currently assigns the next numeric local key and regenerates `admin-ui/src/thumbs.manifest.js` (`assets/thumbs/scripts/thumbs.mjs:220-301`);
4. create/populate a Webflow CMS item outside current tooling, including token ID, title/name/slug, editions, image, collection, and collection-specific fields;
5. export/select a Webflow CSV for Admin CMS health (`admin-ui/src/features/health/health.cms.js:549-684`);
6. for an explicitly chosen CANAAN drop, edit `shared/drop-params/drop-params.js` and complete escrow/pair/publish preflight.

**INFERENCE.** Mint date, OBJKT URL, creator metadata, and CMS item identity are also manually managed externally where their collection schema requires them. The repository cannot prove the exact operator procedure.

## Safe first integration: verified external result import

**RECOMMENDATION.** The first mint-related implementation should not submit a mint. It should accept an operation hash or contract/token tuple from the existing external process and perform read-only verification:

1. freeze the validated authoring-record hash;
2. accept the external result reference;
3. query the configured TzKT/chain endpoint;
4. require an applied operation or independently confirmed token existence;
5. verify network, contract, token ID, metadata URI/content, and expected hashes where technically available;
6. record the result and confirmation evidence;
7. unlock deterministic local/CMS projections.

This eliminates token-ID retyping downstream without changing the current signing experience.

## Future mint adapter

**RECOMMENDATION.** Add mint execution only after the actual current path is documented and tested. Define an adapter interface, not an OBJKT assumption:

```text
prepare(authoringRecord) -> immutable review plan
requestApproval(planHash) -> explicit operator gate
submit(plan) -> wallet request / external handoff
capture(response) -> operation reference, never assumed success
reconcile(reference) -> verified MintResult or actionable failure
```

The adapter may render a browser-wallet Beacon operation, deep-link/handoff to an external OBJKT flow, or call an approved API. The record and journal should not care which adapter produced the verified result.

### Approval boundary

Mint submission is an irreversible/signing action. The UI should show:

- network and collection contract;
- creator/recipient;
- title and edition quantity;
- artifact/metadata hashes and URIs;
- fees/cost limits if available;
- exact number and kind of operations;
- warning that retrying an unknown result may mint twice.

Any change invalidates the approval plan hash. Beacon or the external wallet remains the signer; the local service never receives private keys or seed phrases.

## Failure and recovery rules

| Outcome | Required behavior |
|---|---|
| Validation fails before wallet request | No side effect; correct record and revalidate |
| Wallet rejects/cancels | Record rejection; remain pre-mint; safe to retry after new approval |
| Submission returns operation hash | Enter confirming; do not integrate until applied and verified |
| Network fails after request | Mark outcome unknown; reconcile operation/account/token state; never blindly resubmit |
| Operation fails | Record chain failure; keep immutable failed attempt; require new approval for changed plan |
| Token exists but metadata/contract differs | Block as identity mismatch; do not generate local/CMS outputs |
| Mint succeeds but local integration fails | Mint is not rolled back; resume deterministic local integration from captured result |
| Duplicate token/item is detected | Stop and reconcile; no overwrite by title or order |

## OBJKT-specific limits

**CURRENT STATE.** Existing CMS route families differ. The migration model records SCRIPT as `/asset/{mainnetContract}/{mainTokenId}`, HEN as `/tokens/hicetnunc/{mainTokenId}`, and INTRODUCTIONS as `/tokens/{mainnetContract}/{mainTokenId}`; CANAAN's audited CMS schema has no OBJKT-link field (`docs/webflow-migration/06-data-model.json`; `docs/webflow-cms-image-audit/CMS-IMG-1.audit.md:54-59`).

**RECOMMENDATION.** Do not implement one universal OBJKT URL rule. Collection policy may derive a link only after current URL behavior is reverified. Marketplace availability is verification/presentation, not mint success authority.

## Verdict

Local orchestration can safely own validation, payload preparation, immutable review, result capture, reconciliation, and deterministic downstream generation. Actual mint signing must remain an explicit wallet/external approval. Because the repository does not reveal today's mint method, an integrated mint writer is a high-risk dependency and should follow—not precede—the canonical record and verified-result importer.
