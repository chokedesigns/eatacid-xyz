# PERF-3C — Drops coordinated region reveal

Date: 2026-08-21

## Why PERF-3B exposed the stagger

PERF-3B correctly split the tiny Drops first-paint artifact from the full
application bundle. That let shared chrome and the Webflow shell paint without
Beacon or `drops/js/events.js`, but the three existing pending classes owned
separate whole wrappers and were released on different clocks. Parameters
waited for the initial pause request, while the redeem preview waited for both
TzKT supply and image loading. The wallet region had a one-time release flag,
so later account projections relied on scattered inline display mutations.

PERF-3C retains the successful loader graph unchanged:

```text
/drops.js
-> drops-loader.js
   |-> drops-first-paint.js
   `-> drops.js
```

The early artifact still contains no Beacon, NFT, transaction, or Drops
application dependency.

## Current reveal ownership

The checked-in Webflow HTML supplies all three pending classes before scripts
run:

- `.drops-params-pending` is on `.drop-details-main-container`.
- `.drops-preview-pending` is on `.events-cart-token-div-main`.
- `.drops-wallet-tokens-pending` is on `.events-wallet-ui-div`.

`webflow/drops-first-paint.js` now applies those masks to authoritative
descendants rather than hiding each complete wrapper. `events.js` removes both
Phase 2 classes in `releaseInitialDropStatePending()`. Phase 3 uses
`setWalletTokenRegionPending(true|false)`, so account changes and NFT refreshes
can add the wallet class again before re-committing.

## Three-phase visual model

### Phase 1 — first paint

The early shell reveals shared chrome, the Drops marquee/header, section and
card frames, static DATE/TIME/BURN/EXCLUSIONS/REDEEM labels, the Burn Token and
Redeem Token card structure, arrows/flame, the table frame/header, the loading
substates, and non-authoritative structural controls. The parameter values,
redeem metadata/supply value, wallet heading/state, CMS rows, owned counts, and
wallet burn controls remain visibility-masked. `visibility` retains the
Webflow-owned layout boxes; the page is not globally re-hidden.

As documented in PERF-3B, the checked-in `GHOSTNET DROP //` text is inside a
Webflow element that the referenced stylesheet keeps at `display: none`; no
stale title is exposed by the early shell.

### Phase 2 — drop state

One initial barrier requires exactly:

1. local `dropParams` presentation (date, time, burn mechanics, exclusions,
   redeem mechanics) plus the synchronous initial countdown state; and
2. locally authoritative redeem metadata resolved from the configured token
   and stamped CMS lookup.

When both are staged, the parameter and preview masks are removed in the same
commit. The region can truthfully show pre-drop countdown, `STANDBY…`, or a
configuration fallback immediately. It does not wait for the first pause-chain
response.

Dependency classification:

| Dependency | Required for initial Phase 2? | Pending behavior |
| --- | --- | --- |
| local `dropParams` | Yes | Values stay masked until staged together. |
| local clock/countdown | Yes, synchronous seed only | Pre-drop countdown or truthful `STANDBY…` is staged before reveal. |
| pause/LIVE chain state | No | Past drops reveal `STANDBY…`; polling may later update to LIVE or status unavailable. |
| redeem metadata | Yes | Local title, collection, and editions are staged before reveal; invalid metadata uses `[UNAVAILABLE]`. |
| redeem supply | No | The reserved supply field shows `[PENDING]`, then publishes the independently resolved value or `[UNAVAILABLE]`. |
| redeem image | No | The existing image box and spinner reserve geometry; the loaded image or fixed-size failure fallback replaces it. |
| sold-out state | No separate dependency | It follows the normal LIVE + authoritative supply state after supply publication. |

Image and supply promises start before the metadata visual commit and settle
independently. A slow or failed image cannot delay supply, and a slow or failed
supply cannot delay the image or local metadata. The initial barrier is
idempotent; later countdown, pause, supply, sold-out, and image updates use the
normal render paths and are not frozen by the first reveal.

### Phase 3 — wallet/NFT state

Phase 3 begins with `.drops-wallet-tokens-pending`. The table header and loading
geometry remain visible, while the semantic heading, status message, CMS rows,
owned counts, and row burn controls are masked.

- Pending Beacon authority stays pending. It invalidates any older Drops NFT
  generation and never guesses disconnected state.
- Authoritative disconnected state builds the complete generic eligible-token
  catalog, clears owned counts and selection state, sets `ELIGIBLE BURN
  TOKENS`, then removes the pending class.
- Authoritative connected state immediately returns the region to pending.
  The existing `nftsPromise` (or fallback NFT fetch) continues in the
  background. Only the current generation and synchronized address may build
  rows, owned counts, restored selection/control state, and `AVAILABLE BURN
  TOKENS`; the pending class is removed after those mutations are complete.
- NFT failure commits the existing empty connected fallback coherently. Account
  change, disconnect, unpause refresh, and post-trade refresh may all re-enter
  pending and commit again.

The generation/address check remains above rendering, preserving stale-result
rejection. Phase 3 coordination layers on top of the shared Beacon authority;
it does not replace account validation or the shared `nftsPromise` lifecycle.

## Parallel and preserved behavior

Countdown setup, pause polling, redeem supply lookup, redeem image loading,
Beacon initialization, and wallet NFT fetching are not serialized by the
visual barriers. Redeem image and supply explicitly start together. Connected
wallet NFT work still starts in `shared/beacon-setup.js` before Drops consumes
the promise.

Countdown cadence, pause interval/unpause detection, supply interval and
visibility reconciliation, sold-out state, image failure semantics, wallet
generation guards, ownership/eligibility rules, selection/cart/flame state,
button enablement, transaction construction/status flow, and post-trade
authority remain unchanged. The only runtime ordering changes are the visual
pending mask and removal of duplicate owned/cart writes that previously ran
after the connected region had already been revealed.

## Browser validation plan

After the PERF-3C branch reaches staging and Pages through the normal workflow:

1. With no throttling, confirm Phase 1 is effectively immediate, Phase 2
   commits as one region, Phase 3 commits as one wallet projection, and no
   obvious visual regression appears.
2. Under Slow 4G, capture a filmstrip and confirm the sequence is stable shell,
   coordinated drop/redeem metadata, then coordinated wallet/NFT projection.
   Record actual LCP and CLS; do not impose a synthetic target.
3. Test disconnected and connected startup, account change, disconnect, NFT
   refresh, pre-drop countdown, past-drop standby, pause-to-LIVE, supply update,
   sold out, and redeem-image failure.
4. Confirm selection, cart, flame, and button states remain correct; confirm no
   duplicate listeners, polls, intervals, stale wallet commits, or console
   errors. A real transaction is not required unless another result is
   suspicious.

Local tests verify class/barrier and build contracts, but do not establish a
live visual improvement.
