# Split Escrow Registry Notes

Design contract for a future split between public Drops escrow, public Exchange
escrow, and admin escrow behavior. Treat consumer migration guidance below as
pending until later tickets update public and admin callers.

A.3 update: the registry now includes transitional `escrows.drops` and
`escrows.exchange` objects, plus runtime resolvers for effective Drops and
Exchange escrow addresses. Public and admin consumers still read the legacy
root `escrow` directly until later migration tickets update them.

A.4 update: public Drops and Exchange config modules expose resolver output and
keep their legacy `escrow` fields pinned to the root registry `escrow`. Runtime
callers still read the legacy config fields during this transition.

A.5 update: public Drops and Exchange config modules now feed their runtime
compatibility `escrow` fields from the resolved surface escrow effective address.
Both surfaces still fall back to root `escrow` while the surface addresses are
empty, and Exchange remains non-strict until the later activation ticket.

A.7 update: `pairIdRanges.exchange` is now declared as `{ start: 0, end: 999 }`
for legacy shared-escrow compatibility and admin/UI classification. This is
config-only during the transition. Public Exchange still discovers pair IDs by
burn contract/token lookup against the effective escrow `token_mapping`; it does
not require or enforce an Exchange range at runtime.

B.2 update: public Exchange config and validation now resolve the Exchange
surface escrow in strict mode. Exchange requires `escrows.exchange.address` and
does not fall back to root `escrow`; public Drops remains fallback-compatible.

B.4 update: public Exchange no longer reads a separate `exchange.redeemMaster`
registry field. Its strict `escrows.exchange.address` is used for approval,
`token_mapping` lookup, `initiate_trade`, and the trade payload redeem contract.

## Transitional Registry Shape

Keep the current root `escrow` during migration:

```js
{
  escrow: 'KT1...',              // legacy/shared fallback only
  pairsMapPath: 'token_mapping', // legacy/shared fallback only
  escrows: {
    drops: {
      address: 'KT1...',
      pairsMapPath: 'token_mapping'
    },
    exchange: {
      address: 'KT1...',
      pairsMapPath: 'token_mapping'
    }
  },
  pairIdRanges: {
    exchange: { start: 0, end: 999 },
    drops: { start: 1000, end: null }
  }
}
```

Meanings:

- `escrow`: legacy shared escrow fallback used by existing public and admin
  consumers until split-aware resolvers replace direct reads.
- `escrows.drops`: future authoritative Drops escrow config. If omitted during
  migration, Drops may fall back to root `escrow`.
- `escrows.exchange`: future authoritative Exchange escrow config. Exchange may
  initially fall back to root `escrow`, but should become strict after the second
  Exchange escrow contract is configured.
- `dropsEscrow` and `exchangeEscrow`: resolver output names only, not additional
  registry keys. They should mean the effective address chosen for that surface.
- `admin/default escrow`: unresolved until admin behavior is split. Admin must
  not silently choose Drops or Exchange once multi-contract admin behavior begins.
  A later admin ticket should define an explicit default, explicit surface
  selector, or explicit multi-contract readiness gate.
- `pairIdRanges.exchange`: legacy shared-escrow Exchange classification range.
  It reserves the lower IDs, currently `0..999`, when Exchange and Drops share
  one escrow/token map. It does not configure an Exchange escrow address and does
  not make range lookup mandatory for public Exchange.
- `pairIdRanges.drops`: Drops classification range. Drops remains `>= 1000`.

## Resolver Contract

Future resolver behavior should be explicit about both configured and effective
values:

- Drops resolver: `escrows.drops.address || escrow`.
- Exchange resolver, transition phase: `escrows.exchange.address || escrow`.
- Exchange resolver, strict phase: require `escrows.exchange.address`; do not
  allow root `escrow` fallback.
- Admin/global resolver: while legacy admin is single-contract, root `escrow` is
  the effective admin escrow. Once admin split behavior starts, fail closed unless
  the caller supplies an explicit surface or a later registry field defines the
  admin default.

Recommended resolver result shape:

```js
{
  surface: 'drops' | 'exchange' | 'admin',
  configuredAddress: 'KT1...' | '',
  fallbackAddress: 'KT1...' | '',
  effectiveAddress: 'KT1...' | '',
  pairsMapPath: 'token_mapping',
  source: 'surface' | 'legacy-fallback' | 'none',
  strict: true | false
}
```

## Validation Semantics

Validation should distinguish these states rather than reporting only
`escrow` missing:

- Legacy fallback configured: root `escrow` is a non-placeholder address.
- Drops configured: `escrows.drops.address` is a non-placeholder address.
- Drops effective: Drops configured, or root `escrow` is configured during the
  migration fallback window.
- Exchange configured: `escrows.exchange.address` is a non-placeholder address.
- Exchange effective, transition phase: Exchange configured, or root `escrow` is
  configured during the fallback window.
- Strict Exchange configured: Exchange configured without relying on root
  `escrow` fallback.
- Admin configured: legacy admin may use root `escrow`; future split admin must
  require explicit admin/default behavior and must not infer it from Drops or
  Exchange.
- Admin multi-contract ready: all admin surfaces needed by the UI are explicitly
  configured, and admin write/read actions know which escrow they target.

Missing paths should name the intended future field when strict, for example
`escrows.exchange.address`, and name fallback use separately when fallback is
allowed.

## Pair Map Authority

Each resolved escrow owns its own pair-map authority:

- Resolver output should include `pairsMapPath` for the effective escrow.
- Surface-specific `pairsMapPath` should override root `pairsMapPath`.
- Root `pairsMapPath` remains the legacy fallback and current default.
- The current default path remains `token_mapping`.
- Under the legacy shared escrow, Exchange pair IDs are globally reserved in the
  lower range declared by `pairIdRanges.exchange`, currently `0..999`.
- Drops pair IDs remain governed by `pairIdRanges.drops`, currently `>= 1000`.
- Under the future separate Exchange escrow, Exchange pair IDs are physically
  scoped by that contract's own `token_mapping`; the numeric range remains useful
  for admin/UI classification, migration clarity, and legacy shared-escrow
  compatibility, but is not a public Exchange runtime lookup requirement.
- During transition, both are true: the declared Exchange range documents the
  legacy shared-escrow reservation, while the future Exchange escrow will own its
  own per-contract mapping once configured.

## Current Consumer Seams

Known implementation seams for later tickets:

- Public Drops and Exchange runtime callers still read compatibility
  `current.escrow` fields, but those fields are now fed by resolved surface
  escrow effective addresses.
- Shared public trade ops currently fetch `bigmaps/token_mapping` directly and
  do not accept a resolved `pairsMapPath`.
- Admin `network.js` exports one `addresses[network].escrow` and one
  `pairsMapPath`; `getLiveCfg()` mirrors that single-contract shape.
- Pause emits `escrow:paused:state` on `document` with
  `{ paused, network, escrow, ...extra }`; Drops listeners compare the event
  escrow to the live config escrow before accepting state.
- Pairs, Drops, and Treasury admin flows use the single live escrow for storage
  reads, write destinations, stale-preview checks, balance reads, and polling.
- Drops status and autoload guard only `pairIdRanges.drops`.
- Public Exchange still fetches all active `token_mapping` keys and finds the
  pair by burn contract/token. It does not scan or validate
  `pairIdRanges.exchange`.
- Admin Pairs currently presents Exchange/Drops sections using the legacy
  `< 1000` versus `>= 1000` convention on the single live escrow. A future admin
  split ticket must decide whether to consume `pairIdRanges.exchange` directly
  and how to target a separate Exchange escrow.
