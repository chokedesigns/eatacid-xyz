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

Webflow may normalize a submitted CMS Image into a different `fileId`, URL, or
JPEG encoding. Identity equality is therefore not a success condition. The
tool reuses the CMS-IMG-2 verifier: it downloads the resulting image and checks
format, dimensions, strict decoded/perceptual equivalence, expected `alt`, all
non-image fields, and unrelated collection items.

All runtime snapshots, comparisons, uploads, and journals stay beneath the
ignored `runtime/` directory. Structured state and errors are redacted before
writing. `WEBFLOW_API_TOKEN` is never logged or persisted.
