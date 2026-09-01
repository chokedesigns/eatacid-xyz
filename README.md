# EATACID.xyz public repository

This repository owns the Git-side public runtime for EATACID.xyz. Its public application surfaces are Home, Drops, and Exchange. Webflow supplies the live page presentation and loads stable JavaScript module URLs served by GitHub Pages; Git owns the behavior behind those URLs. The two systems therefore have separate ownership boundaries rather than one being a complete copy of the other.

## Repository boundaries

The outer `eatacid-xyz` repository contains the public runtime, its build and deployment tooling, tracked Webflow-derived development shells, and public configuration. `admin-ui/` is an independent nested Git repository with separate status and history; outer-repository work must not casually modify it. The `contracts/` subtree contains contract-specific implementation and documentation whose concerns are narrower than the public web runtime.

## Architecture at a glance

```text
Webflow-hosted page
-> stable GitHub Pages root router
-> prod or staging environment loader
-> early first-paint and full Parcel artifacts
-> shared and page-specific runtime
```

The stable public module URLs are backed by `home.js`, `drops.js`, and `exchange.js` root routers. They select an environment from the browser hostname, while the selected environment loader starts the corresponding artifacts. See the [developer guide](docs/developer-guide.md) for ownership and dependency details.

## Current network status

The public runtime currently defaults to the `testnet` registry slot. That slot is configured for Tezos Shadownet. The current `main` and `staging` refs both use this default, so main and staging currently target Shadownet unless an explicit supported build-time `NETWORK` override is supplied. A `mainnet` configuration slot exists, but mainnet is not the public default and its presence does not mean cutover is ready.

A dedicated testnet-to-mainnet runbook will be added in REPO-2B3.

## Getting started

Use Node.js 20 as the development baseline: the package does not declare an `engines` range, while the Pages workflow builds with Node 20.

```text
npm ci
npm run start
```

`npm run start` first checks that port 4000 is free, then opens a Parcel development server for the Home, Drops, and Exchange HTML shells at `http://localhost:4000/`. In parallel it watches `shared/drop-params/drop-params.js`, regenerates the tracked JSON projection, and mirrors that projection into the nested Admin repository when content changes. Check both repositories before retaining any generated change.

## Common commands

| Command | Purpose |
| --- | --- |
| `npm run start` | Run the three local Webflow-derived shells with Parcel on port 4000 and watch drop parameters. |
| `npm run build:pages:staging` | Regenerate drop parameters and build the five current public Parcel entries into ignored `dist/staging/` output. |
| `npm run build:pages:prod` | Regenerate drop parameters and build the same source entries into ignored `dist/prod/` output. |
| `npm run pages:sanity` | Build staging and launch the generated direct-bundle sanity harness. |
| `npm run pages:sanity:loader-chain` | Build staging and launch the generated stable-router/environment-loader sanity harness. |
| `npm run test:loader-architecture` | Check hostname routing, sibling artifact loading, failure isolation, and first-paint startup behavior. |
| `npm run test:public-trade-ops` | Run deterministic fixtures for shared approval, confirmation, and NFT-refresh helpers. |

A dedicated operations guide will be added in REPO-2B2.

## Development and staging workflow

The normal delivery direction is:

```text
ticket branch
-> relevant deterministic validation
-> staging
-> deployed staging verification
-> production/main
```

The combined Pages workflow checks out both `main` and `staging`. It freshly builds production from `main` and staging from `staging`, then assembles both environments with main-owned stable root routers. Production is therefore rebuilt from `main`; the exact staging bundle bytes are not promoted unchanged.

## Generated versus authored warning

Do not mistake generated or local reference paths for source. `dist/` and `pages-sanity/` are ignored outputs. `shared/drop-params/drop-params.json` is a tracked generated projection of `drop-params.js`. Webflow reference/export paths such as `drops/css/`, `exchange/css/`, and `assets/site/` are ignored. `ticket.*.diff` and `ticket.*.stat.txt` are ignored review artifacts. `admin-ui/` is an ignored outer path because it is a separate repository, not because its contents are disposable.

The [developer guide](docs/developer-guide.md#generated-versus-authored-paths) contains the detailed classification.

## Documentation map

- [Developer guide](docs/developer-guide.md) — canonical current architecture and source ownership.
- [Performance dossiers](docs/performance/) — specialist implementation history and evidence for loader and first-paint work; not the primary current-state guide.
- [Webflow migration dossier](docs/webflow-migration/) — historical migration audit, evidence, and planning material; current executable code wins where it differs.
- [Webflow CMS image migration](docs/webflow-cms-image-migration.md) — specialist CMS image migration reference.
- [Burn/redeem escrow contract](contracts/burn-redeem-escrow/README.md) — contract-specific implementation and deployment documentation.

The planned primary documentation set will also include `docs/operations.md` in REPO-2B2 and `docs/testnet-to-mainnet.md` in REPO-2B3. Those files do not exist yet and are intentionally not linked.

## Mainnet cutover

The public runtime currently defaults to testnet. Mainnet transition is a controlled, multi-step procedure: do not improvise it by changing a single network constant. The dedicated runbook will be authored separately in REPO-2B3.
