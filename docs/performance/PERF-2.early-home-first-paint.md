# PERF-2 — Early Home first paint

Date: 2026-08-20

Profile: AUDIT / CLOSURE

## Implementation

`webflow/first-paint.js` is a dedicated Parcel entry that imports only the existing `shared/public-first-paint.js` coordinator. The coordinator itself is unchanged, preserving its network state, image/font readiness gates, bounded timeouts, animation-frame sequencing, ready/fallback classes, fail-open path, reveal choreography, banner presentation, and global duplicate-start guard.

`loaders/home.loader.js` now selects production or staging once and immediately starts two sibling dynamic imports. Each import has its own rejection handling, so neither load is sequenced behind or blocked by the other. `webflow/home.js` retains its coordinator import as a fallback; the coordinator's global state prevents a second initialization regardless of which bundle evaluates first.

Old dependency chain:

```text
HTML -> root Home loader -> Home bundle -> first-paint coordinator -> reveal
                                 `-> Beacon/wallet graph
```

New dependency chain:

```text
                         /-> first-paint entry -> coordinator -> reveal
HTML -> root Home loader
                         \-> Home bundle -> Beacon/wallet application
```

There is no `await` or promise chain between the two loader calls.

## Emitted output

Workflow-equivalent Parcel builds used `--no-optimize`, `--no-content-hash`, and `--no-scope-hoist`.

| Artifact | Raw bytes | Local gzip bytes |
| --- | ---: | ---: |
| Root `home.loader.js` | 1,181 | 488 |
| Staging `first-paint.js` | 30,404 | 7,527 |
| Staging `home.js` | 4,992,426 | 1,538,295 |
| Production `first-paint.js` | 30,404 | 7,527 |
| Production `home.js` | 4,992,426 | 1,538,295 |

The source-map-backed early dependency graph contains exactly:

- `webflow/first-paint.js`
- `shared/public-first-paint.js`
- `shared/network.js`
- `shared/chain-registry.js`
- Parcel's ES-module helper

The early artifact is self-contained and imports no emitted shared chunk. It contains no Beacon SDK, Beacon setup, `DAppClient`, `WalletClient`, or WalletConnect source/marker. The Home source map provides the positive comparison: it contains `shared/beacon-setup.js`, `@airgap/beacon-sdk`, and the wallet graph. Retaining the Home fallback import therefore did not compromise early-path isolation.

## Failure and static validation

Focused tests cover staging/production selection, immediate sibling import initiation, either import resolving first, near-simultaneous resolution, asynchronous and synchronous first-paint failure, Home failure, independent fail-open timer startup, and duplicate coordinator evaluation. A successful early entry starts the existing 1,300 ms fail-open protection without waiting for Home. If the early entry fails, Home still attempts to load and its retained import can start the coordinator. If Home fails or never evaluates, a successful early entry still owns readiness and fail-open release.

`scripts/verify-home-first-paint-build.mjs` checks both emitted variants, rejects shared-chunk imports or Beacon/wallet markers in the early graph, confirms the expected small source graph, and verifies the early output remains substantially smaller than Home.

Static validation establishes the intended dependency order and isolation, but it is not a new browser LCP measurement. Directionally, Slow-4G LCP should move toward hero availability/decode plus the existing bounded reveal choreography instead of waiting for Home application delivery. The PERF-1 trace's hero response completed around 4.35 seconds; no final LCP is predicted here.

## Manual runtime validation required

Use the same browser, viewport, device-pixel ratio, navigation method, cache policy, and interaction used for PERF-1. On the deployed staging build:

1. Capture a clean-navigation Performance trace with no throttling; record LCP, INP, CLS, the LCP element, and reveal appearance.
2. Repeat with the same Slow 4G profile; record the same values and the hero resource completion, first-paint bundle completion, ready/fallback class time, Home bundle completion, and LCP time.
3. Confirm the root loader starts `/staging/first-paint.js` and `/staging/home.js` as overlapping sibling requests and that first-paint can evaluate before Home completes.
4. Confirm the testnet banner and reveal look unchanged, the hero never flashes at an improper size or shifts layout, Connect/wallet controls initialize normally, and the console has no duplicate-import or rejected-loader errors during normal loading.
5. For failure-seam spot checks, block only `/staging/home.js` and confirm first-paint still releases/fails open; then block only `/staging/first-paint.js` and confirm Home still boots and its fallback coordinator releases the surface. Expected blocked-request loader errors should be distinguished from errors in the normal runs.

Do not declare PERF-2 performance success until those browser traces are complete.
