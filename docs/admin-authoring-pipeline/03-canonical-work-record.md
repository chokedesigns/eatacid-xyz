# Canonical work record

Status: **DESIGNED, NOT IMPLEMENTED**.

## Purpose

The canonical work record is the planned source of truth for facts an operator authors once and for verified identities/results captured from external systems. It allows deterministic projections without copying every downstream system into one database.

The record must not duplicate:

- network endpoints, contracts, or mirrors from `shared/chain-registry.js`;
- active drop configuration from `shared/drop-params/drop-params.js`;
- current chain balances, pause state, pair state, or operation status;
- Webflow’s current staged/live state;
- secrets, private keys, wallet state, API tokens, or presigned upload credentials.

Attempts, approvals, errors, and reconciliation evidence belong in a separate operation journal/evidence store. That store is also planned, not implemented.

## Conceptual categories

This is a domain model, not a final JSON schema.

| Category | Canonical or captured facts | Typical projections/verification |
|---|---|---|
| Work identity | schema version, stable pre-mint `workId`, collection key | collection policy and destination selection |
| Authored content | exact title, artwork/source reference and SHA-256, edition intent with named semantics, non-derivable collection metadata | mint preparation, local title, thumbnail job, CMS fields |
| Canonical minted identity | verified network, collection contract, token ID, operation/reference, metadata URI/hash and observation evidence where available | every identity-dependent local/CMS reference |
| CMS intent/result | approved slug or non-derivable fields; captured site/collection/item/locale/asset identities and verification summaries | resume by exact ID, staged/live comparison |
| Local artifacts | expected destinations, generated hashes, generator/profile version, integration status | reproducibility and local health |
| Lifecycle | last verified product state plus reconciliation requirement | legal next actions; never inferred from button clicks alone |
| Drop eligibility/handoff | default no handoff; explicit CANAAN candidate/proposal reference when approved | optional drop-param draft, never automatic activation |

## Identity before and after mint

The stable local `workId` exists so a draft can be edited before a token exists. It is not a substitute for minted identity.

After verification, the minted tuple becomes the canonical token identity for downstream work. A token ID field is not accepted merely because an operator typed it. V1 may import an operation hash or contract/token tuple from the current external mint process, but it must independently verify the result before identity-dependent generation.

For HEN, the stored/captured identity uses the canonical/mainnet token ID. A Shadownet lookup ID is derived from `shared/chain-registry.js` only at an environment boundary.

## Store once

- stable `workId` and schema version;
- collection key;
- exact title, including punctuation, case, Unicode, and leading-zero significance;
- approved artwork reference plus content hash;
- intended edition/economic inputs with unambiguous names;
- collection-specific facts that cannot be derived;
- exact slug only when policy or operator approval requires it;
- verified mint result and evidence references;
- returned Webflow item/locale/asset identities;
- explicit downstream intent, defaulting to none.

## Derive or capture, do not re-enter

- collection contracts and environment translation from `shared/chain-registry.js`;
- HEN lookup ID from its explicit mirror;
- Admin title destination and thumbnail folder from collection policy;
- local thumbnail key from verified identity, not next-file order;
- CMS field payload from record plus collection policy;
- CMS Name from title unless policy explicitly separates them;
- `$ACID` value as `ceil(100 / editions)` only for the currently supported CANAAN/THE 419 SCRIPT policy;
- marketplace URL only from a verified collection route policy;
- Webflow item/asset identifiers from API responses and reconciliation;
- mint operation/token identity from verified external results;
- current publication, balance, pause, pair, and operation state from fresh external reads.

## Lifecycle state in the record

State names represent completed verification gates, not attempted actions. A useful minimum progression is defined in [Work lifecycle](07-work-lifecycle.md).

An incomplete or uncertain write must preserve the last verified state and set a separate reconciliation requirement. It must not optimistically advance or erase the attempt.

## Validation expectations

### Record validation

- supported schema version and collection policy;
- required collection-specific fields present;
- artwork path constrained to an approved root and hash matches current bytes;
- positive/bounded numeric values with named semantics;
- no secret-shaped fields;
- no canonical token ID without verified imported/minted result evidence;
- no environment mirror ID stored as canonical identity.

### Projection validation

- planned destinations do not collide;
- current consumer files match expected preconditions;
- generated title/thumb identity agrees with the verified token result;
- CMS projection contains exactly the collection’s allowed/required fields;
- optional drop action is exposed only by collection policy.

### External-result validation

- expected network and collection contract;
- independently observed token/operation result;
- metadata/artwork relationship where current chain/provider evidence makes that check possible;
- captured external IDs sufficient to resume without title/order searches;
- explicit unknown/unresolved classification when evidence is insufficient.

## Deliberately unresolved schema questions

The first implementation must resolve these with fixtures and migration tests rather than treating this conceptual shape as final:

- record storage location, serialization format, and schema migration policy;
- journal/evidence location and retention;
- allowed artwork roots, formats, size limits, and whether masters are copied or referenced;
- exact edition/minted-supply/display semantics;
- required mint-result evidence and finality policy;
- slug suggestion/approval rules;
- whether existing works are backfilled or V1 begins with new CANAAN records;
- representation of failed/replaced external integration attempts without corrupting canonical facts.

## First schema fixture

The first real fixture should model one new CANAAN through the **Add a New CANAAN** V1. Additional fixtures should prove that the model can represent:

- a THE 419 SCRIPT title whose display ordinal differs from token ID;
- a HEN canonical ID with a Shadownet lookup adapter;
- an INTRODUCTIONS work whose presentation order does not define identity.

Fixtures validate the abstraction; they do not authorize backfilling or modifying current consumer files.
