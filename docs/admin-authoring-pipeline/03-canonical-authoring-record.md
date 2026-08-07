# Canonical authoring record

## Decision

**RECOMMENDATION.** A canonical local authoring record is appropriate, but it should be small and compositional rather than a database-shaped copy of every downstream system.

The repository already has three durable authorities that should not be duplicated:

- network/contracts/mirrors in `shared/chain-registry.js`;
- active drop intent in `shared/drop-params/drop-params.js`;
- live/minted facts on Tezos, read through TzKT/Beacon.

The record should own only:

1. operator-authored work facts;
2. approved collection-specific choices;
3. captured authoritative results from mint/CMS operations;
4. references and hashes needed to reproduce/verify generated outputs.

Attempts, errors, approvals, and uncertain outcomes belong in a separate operation journal.

## Existing model to reuse

**CURRENT STATE.** The Webflow migration already designed a token content model with stable identity `{collectionKey}:{mainTokenId}`, explicit HEN environment translation, exact titles/slugs/editions/order, and derivation rules for contracts, `$ACID`, OBJKT routes, and names (`docs/webflow-migration/06-data-model.json`; `docs/webflow-migration/06-target-architecture.md:217-221`). That model is oriented toward importing 66 existing CMS records and a future Webflow-independent site.

**RECOMMENDATION.** Reuse its proven identity and derivation decisions, but do not make the AUTHOR pipeline depend on the unimplemented `site/data/**` target or copy migration-only Webflow provenance into runtime authoring records. The authoring model adds lifecycle, mint inputs/results, local artifact hashes, CMS integration references, and explicit drop intent.

## Smallest coherent model

The following is a conceptual contract, not a final schema. Field names and file layout should be finalized in an implementation ticket with fixtures and version migration tests.

| Section | Stored facts | Derived or captured behavior |
|---|---|---|
| Identity | `schemaVersion`, stable local `workId`, `collectionKey` | Collection policy, registry contract, CMS collection, folders |
| Authoring | exact title, source artwork path/hash, intended edition count, collection-specific metadata, approved CMS-only overrides | Mint metadata payload, local title entry, thumbnail job, CMS field payload, `$ACID` where applicable |
| Mint plan | network slot, safe mint options, metadata/artifact content hashes; no secrets | Dry-run plan and wallet request summary |
| Mint result | network, contract, token ID, operation hash, block/confirmation, metadata URI, observed timestamp/supply when verified | Stable chain identity and all downstream token references |
| Local integration | generated-file references and hashes, generator/tool version | Reproducibility/health result; generated files remain consumer outputs |
| CMS integration | site/collection/item/locale/asset IDs, staged/live verification hashes/status | Resume/reconcile without searching by title/order |
| Drop handoff | `intent: none | candidate`; optional approved draft reference | Only eligible collection policy enables a drop proposal; no automatic params write |

A non-normative sketch:

```json
{
  "schemaVersion": "authoring-record/v1",
  "workId": "locally-generated-stable-id",
  "collectionKey": "CANAAN",
  "authoring": {
    "title": "EXACT OPERATOR TITLE",
    "artwork": {
      "sourcePath": "operator-approved/repository-relative/path",
      "sha256": "content-hash"
    },
    "editionCount": 10,
    "collectionMetadata": {},
    "cmsOverrides": {
      "slug": "explicit-only-when-needed"
    }
  },
  "mint": {
    "plan": {
      "network": "mainnet-or-approved-slot",
      "options": {}
    },
    "result": null
  },
  "integrations": {
    "local": null,
    "webflow": null
  },
  "drop": {
    "intent": "none"
  }
}
```

The implementation must not use the example's path, keys, or optional fields without a schema decision.

## Stored versus derived fields

### Store once

- `workId`: stable local identity before a token ID exists.
- `collectionKey`: closed enum from collection policy.
- exact operator title and non-derivable collection metadata.
- artwork source reference and content hash.
- edition/mint intent with unambiguous semantics.
- exact slug only when the operator approves it or compatibility requires importing it. The current repository has evidence that title-to-slug is not universally reversible (`docs/webflow-migration/06-data-model.json`, `slug`).
- verified mint result.
- returned Webflow item/asset identities.
- explicit `drop.intent`, default `none`.

### Derive

- collection contracts and active-network translations from `shared/chain-registry.js`;
- local title JSON destination and thumbnail folder;
- local thumbnail filename from verified active-environment token identity, not next-number inference;
- CMS collection/field policy;
- CMS Name from title unless policy says otherwise;
- `$ACID` as the currently proven `ceil(100 / editions)` only for CANAAN/THE 419 SCRIPT (`admin-ui/src/utils/token-econ.js:1-59`);
- OBJKT URL only for a collection route strategy proven by current data;
- drop-candidate availability from collection policy, never from title/contract guesses;
- current remaining supply, pause, pairs, and live status from fresh chain reads.

### Capture external results

- contract/token ID, operation hash, metadata URI, confirmation/block, and timestamp after mint;
- CMS item ID, locale ID, asset ID/URL, staged/live hashes, and timestamps;
- chain operation statuses for transfers/pairs/unpause;
- generation hashes and tool versions.

## Collection policy

**RECOMMENDATION.** Keep collection-level differences in one policy module/data file. Do not spread them through UI conditionals.

| Policy dimension | CANAAN | THE 419 SCRIPT | HEN | INTRODUCTIONS | ACID COIN |
|---|---|---|---|---|---|
| New authoring supported first | Yes | Yes | No evidence; defer | No evidence; defer | No evidence; defer |
| Current thumbnail new-input support | Yes | Yes | No, backfill only | No, backfill only | No |
| CMS schema | Title/name/slug, editions, image, collection, token ID, `acid-value`; no audited mint-date/OBJKT field | Adds mint-date and OBJKT link | Mint-date/OBJKT; sparse mainnet IDs | Mint-date/OBJKT; explicit identity mirror | CMS skipped |
| New-work drop candidate | Optional, explicit | Never | Unresolved, default never | Unresolved, default never | Never |
| Current Drops runtime role | Redeem; also public list | None | Burn input | Burn input | None |
| ID mapping | Identity in current audited sets | Identity with one-based display title | Explicit sparse mainnet to active map | Explicit identity map | Registry identity |

The current schema facts are documented at `docs/webflow-cms-image-audit/CMS-IMG-1.audit.md:50-61`; runtime collection lists are explicit at `shared/chain-registry.js:106-115`; input/backfill support is explicit at `assets/thumbs/scripts/thumbs.mjs:10-15`.

## Validation layers

### Record validation

- schema version supported;
- one valid collection policy;
- required collection-specific fields present;
- repository-relative asset path remains inside the allowlisted asset root after realpath resolution;
- content hash matches current bytes;
- positive, bounded numeric quantities;
- no secret-shaped fields or environment values;
- state/result consistency: a token ID cannot exist without a verified mint result or approved external-import verification.

### Pre-mint validation

- exact artwork and metadata hashes frozen for the approval;
- network/contract/creator policy explicit;
- edition semantics and cost summary shown;
- no destination output collision;
- mint request payload rendered for review;
- approval expires if any input hash changes.

### Post-mint validation

- wallet response operation hash captured;
- operation confirmed/applied through an independent chain read;
- expected collection/contract, creator where applicable, metadata URI/hash, and token ID verified;
- ambiguous outcome enters reconciliation, never a second mint attempt.

### Integration validation

- generated local title and thumbnail resolve through existing Admin helpers;
- local health passes for the new token;
- CMS staged item has the captured token ID, exact fields, and verified image;
- non-target CMS state remains unchanged;
- live publication is a separate approval and verification;
- completion requires every required collection-specific gate, not merely a successful API response.

## Operation journal

**RECOMMENDATION.** Store journal records separately from canonical content so retries do not churn authoring facts. Reuse the CMS pilot's durable-phase pattern: atomic writes, `lastSuccessfulPhase`, `reconciliationRequired`, attempts, blocked attempts, redacted errors, and exact verification results (`assets/webflow-cms-image-pilot/cms-image-pilot.mjs:118-177`; `assets/webflow-cms-image-pilot/README.md:57-60`).

Minimum event fields:

- operation/run ID and work ID;
- phase, attempt number, started/completed timestamps;
- input record hash and generated plan hash;
- action classification: read, reversible local write, external stage, sign/chain, publish;
- approval identity/time without wallet secrets;
- redacted request summary and response identifiers;
- before/after hashes and verification result;
- failure classification: pre-write, known-not-applied, applied, or unknown;
- next legal resume action.

Journal writes must be atomic and ignored or stored in a deliberately versioned audit area according to the future retention decision. Presigned URLs, bearer tokens, signed payloads, private keys, and full wallet transport state must never be journaled.

## Migration of current records

**RECOMMENDATION.** Do not require importing all 66 works before proving new-item authoring. Start with schema fixtures for one existing direct-ID CANAAN record, one THE 419 SCRIPT record, and one HEN mirror record. Compare generated projections against current title maps, thumbnails, migration data, and CMS audit mapping without writing any consumer.

Only after the projection is lossless should a separate ticket decide whether existing records are backfilled into the canonical store or the store initially covers new works only.
