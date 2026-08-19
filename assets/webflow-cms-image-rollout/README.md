# CMS-IMG-3 direct-map rollout tooling

This package generalizes the CMS-IMG-2 content-verification and durable-journal
patterns for collection-local multi-item batches. It consumes the CMS-IMG-1
mapping authority and the tracked CMS-IMG-2 completion record; it never embeds
the 48 rollout mappings in source.

Offline/read-only local commands:

```powershell
npm run cms:image-rollout -- plan
npm run cms:image-rollout -- status
```

`plan` reads repository files and writes only the tracked deterministic
Markdown/JSON plan. `status` reads the plan and ignored local journals. Neither
constructs a Webflow client or reads `WEBFLOW_API_TOKEN`.

CMS-IMG-4 HEN planning is a separate read-only namespace and does not read or
write CMS-IMG-3 batch journals:

```powershell
npm run cms:image-rollout -- hen-plan testnet
npm run cms:image-rollout -- hen-status
```

The HEN planner consumes the audited CMS-IMG-4 mapping, the centralized
`shared/chain-registry.js` mirror, canonical titles, and current local bytes.
For the `testnet` registry slot (Shadownet), a canonical CMS token ID resolves
through `testnet.mirrors.HEN` before locating the local thumbnail. For
`mainnet`, the lookup ID is the canonical ID itself and no mirror translation
occurs. Unknown networks, unknown testnet tokens, missing/duplicate/gapped
mirror entries, audit/registry disagreement, and missing or changed local files
fail closed.

Current checked-in HEN files are Shadownet-keyed `0.jpg` through `16.jpg`, so
the testnet plan is materializable now. Sparse canonical mainnet filenames are
a later file-layout concern; the mainnet planner intentionally fails on those
missing files instead of introducing a permanent canonical-to-`0..16` mirror.

The testnet HEN execution plan has two exact deterministic batches: `H1` is
the first five canonical IDs in ascending order and `H2` is the remaining 12.
Execution state is derived beneath `runtime/CMS-IMG-4/HEN/testnet/`; HEN
commands never read or normalize CMS-IMG-3 batch directories.

The HEN lifecycle is deliberately split at the publication boundary:

```text
hen-plan testnet
-> hen-stage-batch
-> hen-verify-staged
-> STOP / human authorization
-> hen-publish-batch
-> hen-reconcile-published
```

```powershell
npm run cms:image-rollout -- hen-stage-batch --batch H1
npm run cms:image-rollout -- hen-verify-staged --batch H1
$env:CMS_IMG_4_HEN_PUBLISH_CONFIRM='<exact CMS-IMG-4 confirmation>'
npm run cms:image-rollout -- hen-publish-batch --batch H1
npm run cms:image-rollout -- hen-reconcile-published --batch H1
```

`hen-stage-batch` and `hen-publish-batch` are write-capable and must not be run
without an authorized execution pass. Staging reuses the generalized fresh
preflight, immutable baseline, canonical active-token protection, sequential
asset verification/upload, Image-only patch, content verification, durable
journal, and resume reconciliation machinery. The mirror-derived lookup ID is
used only to select local bytes; Webflow identity checks and asset names retain
the canonical HEN token ID.

`hen-verify-staged` and `hen-reconcile-published` are GET-only with respect to
Webflow. They require exact batch membership and no reconciliation-required
item. Publishing rereads and verifies the full staged batch, requires every
item to be staged-verified plus the exact ticket-aware confirmation, and sends
only the authorized CMS item IDs. It performs no asset upload or Image patch.
Mutation requests are never blindly retried; bounded retry/backoff applies only
to GET requests. An uncertain mutation outcome preserves the last verified
phase, marks reconciliation required, and stops.

Terminal HEN reconciliation requires content-correct staged and live images,
unchanged canonical token/non-image identity, clean draft/archive flags,
non-null valid publication markers covering every update, and no queued
content-identical revision. Content equality alone is not published-verified.

Later execution commands are deliberately separate:

```powershell
npm run cms:image-rollout -- stage-batch --batch B1
npm run cms:image-rollout -- verify-staged --batch B1
npm run cms:image-rollout -- reconcile-published --batch B1
```

`stage-batch` is write-capable. It processes one item at a time, verifies each
result by retrievable image content, reconciles the full staged batch, and
stops before publication. `verify-staged` and `reconcile-published` use GETs
only. No execution command may proceed through a reconciliation-required item.
Every `stage-batch` invocation rereads current drop parameters and current
staged/live CMS state before another write is possible. The original pre-write
batch baseline is immutable once created. A resumed invocation must prove that
current state equals that original baseline plus journaled, content-verified
rollout progress. The tool blocks unexplained Image, non-image, live, identity,
locale, or unrelated-item drift instead of refreshing the baseline to absorb
it. A newly protected active redeem token therefore blocks a resumed batch
before any upload or CMS mutation.

Publishing is a distinct write-capable command. It rereads and verifies the
whole staged batch, then requires the exact process-local confirmation emitted
by `publishConfirmation(batchId, itemIds)`:

```powershell
$env:CMS_IMG_3_PUBLISH_CONFIRM='<exact generated value>'
npm run cms:image-rollout -- publish-batch --batch B1
```

Only the explicit verified item IDs are sent. Staging never cascades into
publishing. A failed or uncertain write preserves the last successful phase,
appends a blocked attempt, and requires reconciliation before another write.

Terminal `published-verified` reconciliation requires clean Webflow publication
metadata in addition to staged/live content equivalence. Both representations
must have valid `lastPublished` values, and their publication markers must
cover the newest staged/live update. A queued staged revision such as
`staged.lastUpdated > staged.lastPublished` fails terminal verification and is
recorded as reconciliation-required; exact timestamp equality is not required.

Webflow may normalize a submitted CMS Image into a different `fileId`, URL, or
JPEG encoding. Identity equality is therefore not a success condition. The
tool reuses the CMS-IMG-2 verifier: it downloads the resulting image and checks
format, dimensions, strict decoded/perceptual equivalence, expected `alt`, all
non-image fields, and unrelated collection items.

All runtime snapshots, comparisons, uploads, and journals stay beneath the
ignored `runtime/` directory. Structured state and errors are redacted before
writing. `WEBFLOW_API_TOKEN` is never logged or persisted.
