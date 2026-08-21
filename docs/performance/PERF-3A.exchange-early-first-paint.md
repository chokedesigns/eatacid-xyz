# PERF-3A — Exchange early first paint

Date: 2026-08-21

## Deployment and runtime contract

Exchange retains the PERF-2B stable-router boundary and now starts the existing
same-environment first-paint artifact independently from the full application:

```text
/exchange.js
-> /prod|staging/exchange-loader.js
   |-> ./first-paint.js
   `-> ./exchange.js
```

The two dynamic imports begin synchronously from the environment-loader call and
have isolated synchronous and asynchronous failure handling. Neither import is
awaited before the other starts. The loader-chain harness already copies and
serves environment loaders generically, so it exercises this graph without an
Exchange-specific harness path. The direct-bundle sanity path remains available
for application-bundle diagnosis.

The early entry reuses `webflow/first-paint.js` and the existing
`shared/public-first-paint.js` coordinator. The full Exchange application keeps
its fallback import, and `window.__EA_PUBLIC_FIRST_PAINT__` prevents duplicate
coordinator creation regardless of which bundle evaluates first. No separate
Exchange first-paint state machine or build entry was added.

The outer/static Exchange shell may reveal before wallet resolution. Wallet and
account presentation remains pending until Beacon resolves, and connected NFT
ownership, row visibility, and balance-derived dropdown capacities remain
pending until the existing TzKT/NFT synchronization resolves. The optimization
does not change wallet, NFT, cart, dropdown, transaction, CMS, observer, or
contract authority. Exchange application boot and `INIT_DELAY_MS = 500` remain
unchanged.

## Manual staging validation

After the normal branch-to-staging merge, push, and Pages deployment, use the
staging hostname and confirm the following live checks. Local build validation
does not establish an LCP improvement.

1. In Network, confirm `/exchange.js` requests
   `/staging/exchange-loader.js`, which starts both
   `/staging/first-paint.js` and `/staging/exchange.js` as sibling requests.
2. Capture one clean no-throttling Performance navigation. Record the first
   visible/static shell, selected LCP element, application-bundle timing, layout
   shifts, and any blank state.
3. Capture one clean Slow 4G navigation. Confirm architecturally that the
   truthful static/pending shell can become visible without waiting for the full
   Exchange application bundle or wallet/NFT completion; no exact timing target
   is required.
4. Test disconnected startup through `pending -> Beacon unconnected -> CONNECT`
   and connected startup through `pending -> address -> NFT ownership loading ->
   owned rows/dropdown capacities`.
5. Confirm there is no false connected/disconnected state, duplicate
   initialization or `MutationObserver`, cart/dropdown regression, generation
   guard regression, or unexpected console error. A transaction is unnecessary
   unless another result is suspicious.
