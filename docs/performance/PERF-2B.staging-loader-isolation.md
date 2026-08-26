# PERF-2B — staging loader isolation

Date: 2026-08-20

Migration status: completed.

The stable root-router cutover is complete. Candidate URLs and the zero-root/
pre-cutover deployment mode are retired. Future rollback stays within the
stable root-router/environment-loader architecture by reverting Git and the
deployment to a known-good revision that preserves that architecture.

## Deployment contract

The stable Webflow-facing URLs remain `/home.js`, `/drops.js`, and
`/exchange.js`. Each is a main-owned root router whose only runtime job is to
read `window.location.hostname`, select `./prod` for `eatacid.xyz` and
`www.eatacid.xyz` or `./staging` for every other hostname, and import the
surface's environment loader.

```text
main:loaders/root/{surface}.js
  -> /{surface}.js
  -> /prod/{surface}-loader.js       from main
     or /staging/{surface}-loader.js from staging
  -> same-environment application artifact(s)
```

Home's environment loader independently starts `./first-paint.js` and
`./home.js`. Exchange follows the same sibling-import pattern for
`./first-paint.js` and `./exchange.js`. Drops independently starts
`./drops-first-paint.js` and `./drops.js`. Page bootstrap, first-paint
sequencing, Beacon setup, and feature behavior stay below the stable router
boundary.

Normal validation is staging-first: merge a ticket branch to `staging`, let the
combined Pages workflow build and publish it, validate the staging hostname's
root-router/environment-loader/application chain, then promote to `main`.
Changing a root router is an infrastructure change because the same main-owned
bytes select both environments; ordinary staging loader work changes only the
staging environment-loader source and staging-built bundles.

## Historical additive migration and stable cutover

During migration, the workflow detected whether main contained all three new
root-router sources. While main contained none, it preserved main's legacy
stable root bytes and published staging's new routers at temporary root-level
paths:

```text
/candidate-home.js
/candidate-drops.js
/candidate-exchange.js
```

Those retired candidate paths resolved relative imports exactly as the future
stable roots would and were for staging-host validation only. They routed to
staging-owned `/staging/*-loader.js` files. The retired pre-cutover verifier
also confirmed that the legacy stable roots retained their complete
prod/staging application paths. It did not create a prod environment loader
from staging or make production depend on the first-paint artifact absent from
the old main build.

When the complete change reached main, a fresh Pages assembly atomically copied
main's routers to the stable root names and main's environment loaders to
`/prod`, then required `prod/first-paint.js` plus every other referenced
prod/staging artifact before upload. Candidate files ceased to be emitted at
cutover. The permanent workflow now requires exactly three main-owned root
routers and fails assembly and verification if any are missing.

## Validation and rollback

`npm run pages:sanity:loader-chain` builds staging bundles, creates local
stable root-router and staging environment-loader copies, and injects the
stable root URLs into the existing Webflow HTML harness. The original
`npm run pages:sanity` direct-bundle path remains available for bundle-only
diagnosis.

The historical pre-cutover rollback path was removal/reversion of the additive
staging candidate change while stable URLs still used legacy main. That path is
now retired. Current rollback reverts Git and deployment to a known-good
revision where stable root routers, prod environment loaders, staging
environment loaders, and their bundles remain one compatible permanent
architecture. Do not roll back only a root router or only its environment
loader.
