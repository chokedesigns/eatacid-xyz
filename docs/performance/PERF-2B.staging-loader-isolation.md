# PERF-2B — staging loader isolation

Date: 2026-08-20

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
`./home.js`. Drops and Exchange environment loaders each start their matching
application bundle. Page bootstrap, first-paint sequencing, Beacon setup, and
feature behavior stay below the stable router boundary.

Normal validation is staging-first: merge a ticket branch to `staging`, let the
combined Pages workflow build and publish it, validate the staging hostname's
root-router/environment-loader/application chain, then promote to `main`.
Changing a root router is an infrastructure change because the same main-owned
bytes select both environments; ordinary staging loader work changes only the
staging environment-loader source and staging-built bundles.

## Additive migration and stable cutover

The workflow detects whether main contains all three new root-router sources.
While main contains none, it preserves main's legacy stable root bytes and
publishes staging's new routers at temporary root-level paths:

```text
/candidate-home.js
/candidate-drops.js
/candidate-exchange.js
```

Those candidate paths resolve relative imports exactly as the future stable
roots do and are for staging-host validation only. They route to staging-owned
`/staging/*-loader.js` files. The pre-cutover verifier also confirms the legacy
stable roots still have their complete prod/staging application paths. It does
not create a prod environment loader from staging or make production depend on
the first-paint artifact absent from the old main build.

After this complete change reaches main, a fresh Pages assembly atomically
copies main's routers to the stable root names, copies main's environment
loaders to `/prod`, and requires `prod/first-paint.js` plus every other
referenced prod/staging artifact before upload. Candidate files are not emitted
after cutover. A partial three-router main state fails assembly and verification.

## Validation and rollback

`npm run pages:sanity:loader-chain` builds staging bundles, creates local
candidate root/router and staging environment-loader copies, and injects the
candidate root URLs into the existing Webflow HTML harness. The original
`npm run pages:sanity` direct-bundle path remains available for bundle-only
diagnosis.

Rollback before cutover is simply removal/reversion of the additive staging
candidate change; stable URLs still use legacy main. After cutover, roll back
the complete main commit/deployment so root routers, prod environment loaders,
and prod bundles return as one compatible artifact. Do not roll back only a
root router or only its environment loader.
