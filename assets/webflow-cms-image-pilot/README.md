# CMS-IMG-2 Webflow image pilot

This tool is deliberately locked to CANAAN token 1 (`I AM BICYCLE`). It cannot
accept another site, collection, item, token, or local image path.

Set `WEBFLOW_API_TOKEN` in the process environment. The token must have
`cms:read`, `cms:write`, `assets:read`, and `assets:write`; `sites:write` is not
used. Runtime snapshots and rollback bytes are written only beneath the ignored
`runtime/` directory.

Run each phase separately:

```powershell
npm run cms:image-pilot -- dry-run
npm run cms:image-pilot -- apply-staged
npm run cms:image-pilot -- verify
npm run cms:image-pilot -- reconcile
npm run cms:image-pilot -- reconcile-published
```

`reconcile` is read-only against Webflow. It rereads staged and live collection
state, verifies the staged image against the local replacement, verifies the
live image against cached original bytes, and checks every target non-image
field and unrelated CANAAN item. Only a complete pass restores the durable
`staged-verified` phase and publish eligibility.

`reconcile-published` is a distinct, idempotent, read-only recovery path for an
already-sent one-item publish. It requires fresh staged and live CMS reads to
contain the approved replacement, verifies every preservation invariant, and
then records `published-verified` without patching CMS or issuing another
publish request. It must not be substituted with `reconcile`, whose live-state
expectation is the original pre-publish image.

Publishing requires a fresh verification plus an exact, process-local operator
confirmation:

```powershell
$env:CMS_IMG_2_PUBLISH_CONFIRM='CMS-IMG-2:PUBLISH:65a1bf3dc64d193880da0093'
npm run cms:image-pilot -- publish
```

Rollback is also split into staged and published phases:

```powershell
npm run cms:image-pilot -- rollback-staged
$env:CMS_IMG_2_ROLLBACK_PUBLISH_CONFIRM='CMS-IMG-2:ROLLBACK-PUBLISH:65a1bf3dc64d193880da0093'
npm run cms:image-pilot -- rollback-publish
```

Webflow may import an Image value into a new CMS-managed `fileId` and may change
a `.jpg` URL to `.jpeg`. Staged and rollback verification therefore require a
retrievable resulting URL, `alt: null`, matching decoded format and dimensions,
strict pixel/perceptual equivalence to the intended source bytes, unchanged
non-image fields and unrelated items, and unchanged live state before publish.
The submitted and resulting Image IDs/URLs are recorded but need not be equal.

The journal separates durable CMS phases from command attempts. Harmless
pre-write failures are appended to attempt/error history without replacing the
last successful phase. Unknown or potentially applied write outcomes set
`reconciliationRequired` and block publishing until `reconcile` passes.

Publish success is established primarily by fresh live CMS state. The nominal
`/canaan/i-am-bicycle` staging route is checked with bounded retries and stored
separately. Repository evidence identifies a CANAAN Collection Template and the
nominal route family, but also records an empty template Body, no application
link to item routes, and unresolved published HTTP behavior. Consequently that
route is not configured as an authoritative publish signal; its 404 remains a
warning unless later evidence proves the route authoritative. The Webflow site
metadata audit records `customDomains: []` and the staging hostname as
`staging-eatacid-xyz.webflow.io`.

During this fix pass, three bounded GET attempts to the nominal item route each
returned HTTP 404 without redirect, while the same hostname returned HTTP 200
for `/` and `/drops`. The retry therefore did not resolve the route, and the
working staging origin itself was not the cause of the item-route failure.

Manual observation supplied for the Aug 6, 2026 post-publish review: Webflow CMS
showed I AM BICYCLE as Published with an updated 6:19 PM timestamp, the optimized
300x375 replacement at approximately 42.7 KB, and no longer queued to publish;
surrounding CANAAN items remained published and no manual CMS edits were made.
This is CMS-side visual evidence only and is not public-page visual approval.

If the historical rollback Image cannot be imported at all, the script stops.
It does not upload the cached old bytes without a separate explicit approval
and code change. It never deletes assets or performs full-site publishing.
