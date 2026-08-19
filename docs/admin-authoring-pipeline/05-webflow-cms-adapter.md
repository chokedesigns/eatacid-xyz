# Webflow CMS adapter

## Boundary

The completed CMS image migration is not the Admin Authoring Pipeline. Its orchestration was retired. The surviving `assets/webflow-cms/webflow-cms.mjs` is a reusable library that a future application-level adapter can compose.

The Admin UI does not currently call this layer. Current Admin CMS health uses manually selected CSV exports.

## IMPLEMENTED REUSABLE CAPABILITIES

Direct code and test coverage show that the retained layer provides:

### Authenticated requests and reads

- Webflow v2 bearer-authenticated requests with credential-safe error details;
- collection metadata reads;
- paginated staged item listing;
- paginated live item listing;
- paginated site asset listing and exact asset reads;
- bounded GET retry for transport failures and HTTP 429, honoring `Retry-After` where supplied.

The GET policy is bounded, not a promise to retry every status indefinitely.

### Assets and images

- asset creation metadata requests;
- presigned multipart content upload;
- deterministic asset filenames built from normalized collection, token ID, slug, width, and content-hash prefix;
- asset read-back with expected-name and exact uploaded-byte SHA-256 verification;
- CMS Image shape/retrievability checks;
- content-based CMS image comparison after downloading the resulting CMS URL;
- acceptance of byte-exact or tightly bounded perceptual equivalence only when format and dimensions match;
- reporting when Webflow changes `fileId`, URL, or extension during normalization.

The local intended image is authoritative. Asset-library identity and CMS Image identity are related integration results, not content identity.

### Explicit CMS mutations

- PATCH of only supplied fields for a known collection/item/locale tuple;
- an image-specific wrapper over that explicit field patch;
- publication of a non-empty, duplicate-free, exact item-ID set.

The client does **not** implement CMS item creation, archive/delete, collection creation, full-site publication, or an Admin workflow.

### State verification

- stable comparisons that ignore only Webflow system timestamps;
- target and unrelated-item set comparison;
- staged/live content comparison;
- clean-publication verification using draft/archive flags and publication/update timestamps;
- read-only, caller-defined reconciliation of ambiguous mutations;
- atomic redacted JSON persistence helpers for evidence, without providing a complete authoring journal.

### Mutation safety and diagnostics

- no automatic retry for POST/PATCH operations;
- transport loss or mutation HTTP 408/429/5xx is classified as an ambiguous, unknown write outcome;
- definite non-retryable mutation errors are classified as not applied;
- recursive redaction for bearer tokens, credentials, signatures, policy fields, presigned upload URLs, and related query values.

## Image invariant

Webflow may re-encode or normalize an uploaded image. The CMS item may return a different `fileId`, URL, extension, or JPEG byte stream from the submitted asset.

Correct verification is:

```text
approved local intended bytes
  -> upload and exact asset-library byte verification
  -> set/read CMS Image
  -> download resulting CMS Image URL
  -> verify format + dimensions + content equivalence
```

Comparing only submitted/returned asset IDs, filenames, or URLs can reject a correct normalized image or accept the wrong content.

## Publication invariant

Staged/live content equality does not prove a clean publication state. A content-identical queued staged revision can exist.

The current verifier requires all of the following:

- staged and live records have valid `lastUpdated` and `lastPublished` values;
- both records have publication markers;
- neither staged nor live is draft or archived;
- each record’s update is not later than its publication marker;
- the publication markers collectively cover the newest staged/live update;
- intended field/image content separately matches.

Application-level completion should also verify the exact item/locale identity and any required non-target preservation scope.

## Mutation invariant

Read operations may retry within a bound. Mutations must not be blindly retried.

After an uncertain create, upload, patch, publish, mint, or chain write:

1. preserve the intended operation identity and last verified state;
2. mark reconciliation required;
3. perform only reads needed to observe actual state;
4. classify the outcome as applied, definitively not applied, or unresolved;
5. continue or request a new approval only when evidence makes the next action safe.

This is a system-wide design principle, not merely a Webflow workaround.

## PLANNED APPLICATION-LEVEL OPERATIONS

The future Admin-facing adapter should hide API mechanics behind domain operations:

- `plan staged CMS representation`;
- `create staged CMS representation`;
- `verify staged CMS representation`;
- `publish exact intended item`;
- `verify clean live publication`;
- `reconcile uncertain external mutation`.

Before the first write it still needs implementation for:

- current site, collection, schema, field, and locale preflight;
- collection-specific required/optional field projection;
- duplicate detection by canonical collection/token identity;
- new staged item creation and immediate returned-ID capture;
- slug conflict policy;
- approval binding and durable operation evidence;
- failed-new-item/orphan-asset retention policy;
- integration with the canonical record and Admin UI.

## Required operation flow

```text
plan from canonical record
  -> fresh schema/identity/duplicate preflight
  -> explicit approval to stage
  -> create or resume exact staged item
  -> create/upload/verify asset as needed
  -> patch exact fields
  -> re-read and verify staged state
  -> human preview
  -> separate exact-item publication approval
  -> publish exact ID
  -> re-read and verify live content + clean publication
```

A successful HTTP response alone is never completion.

## What must not return

- migration batch IDs or batch membership;
- rollout baseline fingerprints;
- migration-specific journal namespaces/phases;
- global confirmation strings for normal use;
- hard-coded one-ticket targets;
- blind write retries;
- full-site publication as a shortcut;
- automatic deletion of staged items or assets after failure.

`docs/webflow-cms-image-migration.md` is supporting historical evidence for these invariants. Normal AUTHOR implementation should start with this document and current code, not reconstruct the retired migration CLI.
