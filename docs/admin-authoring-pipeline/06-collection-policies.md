# Collection policies

Shared infrastructure does not imply identical workflows. Collection policy controls identity translation, local projections, CMS fields, mint relationship, and allowed downstream actions.

No collection has an implemented Admin authoring workflow today.

## Policy summary

| Collection | Canonical identity | Current local artifacts | Last audited CMS needs | Mint relationship | Drop relationship |
|---|---|---|---|---|---|
| CANAAN | mainnet collection + direct token ID | titles and masters keyed by direct numeric ID; input tooling enabled | core work fields plus `acid-value`; no audited `mint-date` or `objkt-link` field | current mint is external/manual; V1 imports verified result | may explicitly hand off to Prepare Drop after authoring/publication |
| THE 419 SCRIPT | mainnet collection + direct token ID; display ordinal is not identity | titles `// 01` through `// 13` map to token IDs `0` through `12`; input tooling enabled | core fields plus `mint-date`, `objkt-link`, and `acid-value` | current mint is external/manual; later authoring slice | not inherently a Drops workflow |
| HEN | mainnet HEN collection + sparse canonical token ID | titles keyed by sparse canonical IDs; current Shadownet thumbs keyed by mapped `0` through `16`; backfill only | core fields plus `mint-date` and HEN-specific `objkt-link`; CMS token ID remains canonical | new-work authoring/mint policy unresolved | current Drops burn input; this does not make new HEN works redeem-drop candidates |
| INTRODUCTIONS | mainnet collection + token ID; environment identity map is explicit | titles/thumbs `0` through `4`; backfill only; displayed title/order is not identity | core fields plus `mint-date` and `objkt-link` | new-work authoring/mint policy unresolved | current Drops burn input; new-work drop eligibility unresolved/default no |

The checked-in CMS schema is an audited snapshot at `docs/webflow-migration/02-cms-schema.md`. A future write must preflight the current remote schema and locale. Policy must not silently add fields missing from a collection.

## CANAAN

### Identity

Canonical identity is the mainnet CANAAN contract from `shared/chain-registry.js` plus the verified token ID. Current mainnet and Shadownet sets use direct token IDs; the registry remains the contract authority.

### Local artifact policy

Current titles and masters are keyed directly by token ID. `assets/thumbs/` input mode supports CANAAN, but its next-key allocation is not suitable for V1. New authoring must generate against the imported, verified minted identity.

### CMS policy

The audited collection has title/name, slug, editions, image, collection, token ID, and `acid-value`. It does not have the audited mint-date/OBJKT fields present on the other collections. Do not invent those fields or a universal marketplace-link rule.

### Mint policy

V1 uses the current external/manual mint process and imports the verified result. It does not sign or submit a mint.

### Drop policy

CANAAN is the first authoring vertical and the only currently accepted new-work collection that may expose **Prepare Drop**. The action is optional, explicit, and downstream of completed authoring/CMS publication. It proposes drop configuration; it does not save params, seed escrow, set pairs, publish Git, or unpause.

## THE 419 SCRIPT

### Identity and presentation special case

Token IDs are `0` through `12`; titles are `// 01` through `// 13`. A title ordinal, slug, list index, or filename order must never be converted into token identity by arithmetic inference.

### Local/CMS policy

Current input thumbnail tooling supports this collection. The audited CMS adds mint date and OBJKT link to the common work fields and has `acid-value`. Any future URL policy must preserve/verify the collection’s actual route family rather than applying a CANAAN or HEN rule.

### Mint and drop policy

Minting is currently external/manual. THE 419 SCRIPT participates in the Exchange runtime, but it is not inherently a Drops workflow and must not automatically branch to drop preparation. It is a likely later authoring vertical after CANAAN, not part of CANAAN V1.

## HEN

### Canonical identity

HEN’s sparse mainnet IDs are canonical. `shared/chain-registry.js` owns the Shadownet map and `admin-ui/src/utils/hen-ids.js` translates for consumers.

```text
canonical/mainnet HEN token ID
  -> mainnet lookup: same ID
  -> Shadownet lookup: explicit mapped ID
```

The mapped `0` through `16` IDs are adapters only. They must not appear as canonical work/CMS identity.

### Local/CMS special cases

Local titles use canonical sparse IDs. Current thumbnail lookup uses the environment-facing numeric key, so a future generator must make that adapter explicit. The audited CMS uses canonical sparse token IDs, `HIC ET NUNC` as its collection field value, mint date, and a HEN-specific OBJKT route family. Labels and routes are presentation policy, not contract identity.

### Mint/drop policy

HEN currently supplies burn tokens to Drops. The repository does not establish a new-HEN authoring/mint workflow or permission for new HEN works to become redeem drops. Default to no new-work/drop behavior until a later decision.

## INTRODUCTIONS

### Identity and presentation special case

Current canonical IDs are `0` through `4`, and the Shadownet registry includes an explicit identity map. Local titles display FIVE through ONE; observed presentation order does not define identity.

### Local/CMS policy

Current tooling supports backfill/review but not new input. The audited CMS has mint date and OBJKT link but no `acid-value`.

### Mint/drop policy

INTRODUCTIONS currently supplies burn tokens to Drops. The repository does not establish new-work authoring or redeem-drop eligibility. Default to no authoring/drop handoff until explicitly decided.

## ACID COIN scope note

ACID COIN has local Admin presentation and an Exchange role but is not one of the four CMS authoring collections. No authoring/mint/CMS policy is defined for it in Architecture v2.

## Policy implementation rules

- Contracts and mirrors are referenced from `shared/chain-registry.js`, never copied into policy as a competing authority.
- CMS collection/field IDs must be freshly preflighted before external writes.
- Policy must fail closed when a required translation or field rule is missing.
- Runtime participation and new-work eligibility are separate dimensions.
- A collection can share validators/generators without sharing lifecycle branches.
- Adding a new collection behavior requires an explicit decision and tests; it must not be inferred from similar labels or data shapes.
