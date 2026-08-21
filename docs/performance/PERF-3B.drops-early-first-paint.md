# PERF-3B — Drops early first paint

Date: 2026-08-21

## Deployment and runtime contract

Before PERF-3B, the Drops environment loader started only the full application:

```text
/drops.js
-> /prod|staging/drops-loader.js
-> ./drops.js
-> webflow/drops.js
-> drops/js/main.js
-> shared/public-first-paint.js
```

That made the large application graph, including Beacon and the Drops runtime, a
prerequisite for shared first-paint. PERF-3B uses a tiny Drops-specific early
shell because the raw Webflow shell contains unresolved parameter, redeem, and
wallet-token values that must not become authoritative merely because the outer
surface is revealed sooner:

```text
/drops.js
-> /prod|staging/drops-loader.js
   |-> ./drops-first-paint.js
   `-> ./drops.js
```

The two imports start synchronously and independently. Synchronous or
asynchronous failure of either import is isolated from the other. The early
entry imports the existing `shared/public-first-paint.js` singleton and adds
only local CSS for the already-present `drops-params-pending`,
`drops-preview-pending`, and `drops-wallet-tokens-pending` classes. The full
Drops application retains its shared first-paint fallback import, so
`window.__EA_PUBLIC_FIRST_PAINT__` still owns one coordinator regardless of
which artifact evaluates first.

The early shell may show static chrome, the generic Drops heading and marquee,
the configuration-derived testnet banner, and explicit wallet-pending chrome.
Drop parameters, redeem preview/supply, and wallet-token content remain hidden
until the existing application lifecycle removes their pending classes. The
early entry does not import drop parameters, Beacon, wallet or NFT code, TzKT,
transaction code, cart/selection logic, or `drops/js/events.js`.

The checked-in HTML still contains `GHOSTNET DROP //`, while current drop config
is `SPLINTERED`. The referenced Webflow stylesheet keeps `.drop-title-header`
at `display: none` at all breakpoints, so the stale title cannot flash during
early reveal and no title mutation or HTML cleanup is part of this ticket.

Pause/LIVE remains chain-storage authoritative. Redeem supply remains TzKT
authoritative, and redeem preview release still waits for its existing supply
and image completion. Past-drop parameter release still waits for the existing
pause-status path. These lifecycles were intentionally left unchanged so a
post-deployment trace can identify the actual remaining LCP candidate before a
follow-up optimization is considered.

## Staging-first rollout

The Pages verifier derives artifact requirements separately from the
authoritative environment loader in each checkout:

```text
prod    -> repo-main/loaders/environment/drops.js
staging -> repo-staging/loaders/environment/drops.js
```

During staging-first rollout, a legacy main Drops loader may reference only
`./drops.js`, while staging references both `./drops-first-paint.js` and
`./drops.js`. After promotion, both source loaders naturally require both local
artifacts. The verifier checks each referenced artifact against its owner build,
requires non-empty environment-local output, and checks both the Drops early
shell marker and shared first-paint coordinator marker. Root-router provenance
is unchanged.

The loader-chain harness already copies environment loaders generically and
therefore follows the new Drops sibling imports without a Drops-specific harness
path. Direct-bundle sanity remains available for application-bundle diagnosis.

## Manual staging validation

Local validation does not establish an LCP improvement. After the PERF-3B branch
is merged to `staging`, pushed, and deployed through the normal Pages pipeline:

1. In Network, confirm `/drops.js` requests `/staging/drops-loader.js`, which
   directly starts both `/staging/drops-first-paint.js` and
   `/staging/drops.js`.
2. Capture a fresh no-throttling navigation. Record the first visible shell,
   actual LCP element, `drops.js` completion, layout shift, and any stale or
   incorrect content flash.
3. Capture a clean Slow 4G navigation. Determine whether LCP occurs before the
   full Drops bundle finishes and whether the previous bundle-gated interval is
   gone. If LCP moves to parameters/details, redeem image, another image, or a
   chain-gated region, record it without optimizing it in this ticket.
4. Test disconnected startup through `early shell -> wallet pending ->
   disconnected`, and connected startup through `early shell -> wallet pending
   -> connected address -> NFT ownership state`.
5. Confirm the countdown starts once; past-drop standby remains truthful;
   pause/unpause and supply polling each run once; redeem image and sold-out
   behavior are unchanged; cart, selection, flame, and transaction behavior are
   unchanged; stale wallet generations cannot commit; and no duplicate
   intervals, polls, listeners, or console errors appear. A transaction is not
   required unless another result is suspicious.
