# Drop lifecycle and LIVE NOW / SOLD OUT audit

## Existing authoritative semantics

### NO DROP

**CURRENT STATE.** `dropScheduled:false` is the existing no-drop sentinel (`shared/drop-params/drop-params.js:5-10`). Public Drops shows “No Drops Scheduled” and returns early (`drops/js/events.js:384-431`). Admin hides the preview card and shows “NO DROPS SCHEDULED,” while the pair-management section remains visible (`admin-ui/src/features/drops/drops.view.preview.js:162-216`).

The static pre-drop checklist remains in the DOM and its controller neutralizes the dots. There is no top-level lifecycle router that replaces the checklist card (`admin-ui/index.html:438-605`; `admin-ui/src/features/drops/drops.checklist.controller.js:949-1021`).

### PRE-DROP and STANDBY

**CURRENT STATE.** When params are scheduled and the configured instant is in the future, Admin/public phase is `pre`. At or after the instant, the phase becomes `standby` while escrow is paused. Both surfaces poll storage every three seconds (`admin-ui/src/features/drops/drops.countdown.service.js:39-110`, `admin-ui/src/features/drops/drops.countdown.service.js:150-187`; `drops/js/events.js:2024-2198`).

The pre-drop checklist correctly treats pause as good before launch and warns if the contract is unpaused too early (`admin-ui/src/features/drops/drops.checklist.controller.js:261-327`).

### LIVE

**OBSERVED BEHAVIOR.** The authoritative existing transition is:

```text
dropScheduled is true
AND configured instant has been reached
AND a fresh escrow storage read observes paused === false
=> countdown phase becomes live
```

Admin sets `adminCountdownPhase = 'live'` only inside the unpause poll (`admin-ui/src/features/drops/drops.countdown.service.js:52-70`). Public does the same after `pollForUnpause` returns on `paused === false` (`drops/js/events.js:2028-2066`, `drops/js/events.js:2138-2198`). The proposed UI must reuse this rule.

**EDGE CASE.** “Has ever gone live” is not durable. If a drop is later paused and the page reloads after the scheduled time, the current code sees `paused === true` and remains in standby. A future live surface may show a live-but-paused operational status only if a durable launch observation or reliable chain-history proof is introduced. It must not fabricate that history from the date alone.

### SOLD OUT

**CURRENT STATE.** Public Drops reads the escrow's FA2 balance for the configured redeem contract/token and polls it at ten-second intervals when visible and nonzero (`drops/js/events.js:818-922`). When phase is live and balance is zero, the countdown becomes “SOLD OUT!” (`drops/js/events.js:2640-2658`). The exchange button also has a sold-out state, but that branch additionally requires a connected wallet and selected burn token (`drops/js/events.js:2251-2277`).

Admin has no sold-out phase or live supply model. Its checklist compares current balance to planned `totalSupply`: exact is green, zero red, any nonzero mismatch yellow (`admin-ui/src/features/drops/drops.checklist.controller.js:532-643`). Once one redeem occurs, a healthy live drop therefore appears incomplete.

## Current checklist semantics

The eight current checks and their proper lifecycle scope are:

| Check | Current source | Pre-drop meaning | Live meaning |
|---|---|---|---|
| Params loaded/scheduled | imported mirror | Required | Configuration identity only |
| Redeem token exists | TzKT token query | Required | Stable identity/health |
| Local titles/thumbs | TzKT enumeration + local manifests | Required | Presentation health |
| Front-end CMS synced | stored Webflow CSV comparison | Required but potentially stale | Health signal, not a launch preflight |
| Redeem tokens in escrow `have/planned` | TzKT FA2 balance | Seed readiness | Remaining supply; mismatch is expected depletion |
| Contract paused | storage | Required before pair writes/launch | Operational pause status; unpaused is normal live |
| Pairs on-chain | storage comparison | Readiness | Contract/drop health |
| Params on GitHub staging/main | raw JSON equality | Deployment readiness | Config propagation health, not preflight |

**RECOMMENDATION.** The checklist exists only for configured, not-yet-live drops. After the existing live predicate is observed, replace it with an operational surface rather than recoloring the same checks.

## Available live data

| Desired field | Existing data source | Readiness |
|---|---|---|
| Collection/token/title/image | drop params + registry + local title/thumb resolver | Available |
| Initial drop supply | `redeemToken.totalSupply` | Available as plan, not chain truth |
| Remaining supply | TzKT FA2 balance for escrow/contract/token | Available; already used |
| Dispensed/redeemed quantity | `initial - remaining` | Conditionally derivable only if no replenishment/withdrawal and quantity semantics are accounted for |
| Burned count | `initiate_trade` operations and burn amounts | Not currently aggregated; cannot equate blindly with redeemed quantity |
| Pause/admin/burn-address health | escrow storage | Available in Admin pause diagnostics (`admin-ui/src/features/pause.js:245-289`) |
| Expected versus actual pairs | current pair status evaluator | Available (`admin-ui/src/features/drops/drops.pairs.status.js:508-593`) |
| Recent redeem activity | TzKT target transactions | Endpoint helper exists, no UI/parser (`admin-ui/src/tzkt-api.js:292-295`) |
| Freshness | timestamps captured by future reads | Not consistently exposed today |

### Redeem activity feed feasibility

**INFERENCE.** A feed is technically feasible using `getRecentOps` or a more specific TzKT query for applied transactions targeting the exact escrow with `parameter.entrypoint=initiate_trade`. Public operation payloads contain burn contract/token/amount, redeem contract/token, pair ID, and recipient (`drops/js/events.js:998-1043`).

Implementation still needs to:

- filter to the selected network and exact escrow;
- accept only applied transactions and handle reorg/indexer delay;
- parse single and batched trade payloads;
- verify redeem collection/token matches the active params;
- distinguish user wallet, sender, recipient, and contract target;
- paginate/dedupe by operation hash plus internal index;
- show observed/indexed timestamps and stale/error states;
- avoid claiming “burned” or “redeemed” counts when parsing is incomplete.

No durable activity feed or retention policy exists today.

## Proposed UI lifecycle

```text
NO DROP
  -- approved drop params with dropScheduled:true --> PRE-DROP CHECKLIST
PRE-DROP CHECKLIST
  -- scheduled instant reached, still paused --> STANDBY
PRE-DROP CHECKLIST / STANDBY
  -- fresh storage observes paused:false after instant --> LIVE NOW
LIVE NOW
  -- confirmed remaining supply > 0 --> LIVE NOW
LIVE NOW
  -- confirmed remaining supply == 0 --> SOLD OUT
SOLD OUT
  -- stays informational indefinitely --> SOLD OUT
PRE-DROP / LIVE / SOLD OUT
  -- explicit approved params save with dropScheduled:false --> NO DROP
```

Invalid/stale reads do not advance the lifecycle. They produce `UNKNOWN/DEGRADED` health within the current surface.

### PRE-DROP CHECKLIST

- Current eight checks, but scope CMS requirements to collections actually involved in the configured drop rather than every non-ACID registry collection.
- Keep pause good, supply exactness meaningful, and pair seeding protected.
- Show standby after the instant while paused.
- Never auto-unpause.

### LIVE NOW

- Active collection, token ID, exact title/image.
- Configured initial supply and verified remaining escrow balance as distinct values.
- Redeemed/dispensed estimate only with an explicit derivation label and reconciliation status.
- Pause state, pair-match state, TzKT freshness, and contract address/network.
- Recent applied activity when parsing is reliable.
- Manual refresh and bounded polling with stale-data indication.
- No preflight “must equal initial supply” warning.

### SOLD OUT

- Same operational identity and final remaining balance zero.
- Last activity and freshness.
- Explicit message that sold out does not clear params, remove pairs, pause, transfer, or publish anything.
- Manual “prepare clear/no-drop diff” action only; saving remains separately approved.

## State transitions already present versus needed

| Transition/capability | Existing | Needed |
|---|---|---|
| `dropScheduled:false` no-drop | Yes | Route all Admin lifecycle surfaces, including checklist |
| Scheduled pre countdown | Yes | Keep |
| Post-time paused standby | Yes | Keep |
| Post-time unpause live | Yes | Reuse as single authoritative live trigger |
| Public zero-balance sold-out display | Partial | Add Admin phase/surface independent of wallet selection |
| Live operational health | No | New read-only view model/UI |
| Activity feed | Helper only | Query/filter/parser/UI/freshness |
| Durable has-ever-live | No | Optional journal/chain-history design decision |
| Manual clear to no-drop | File edit exists | Safe params proposal/editor; never automatic |

## Edge cases and required behavior

- **Partial depletion:** show remaining and progress; do not mark escrow seeding incomplete.
- **Zero balance before live:** preflight failure, not sold out.
- **Sold out then replenished:** return to LIVE NOW after a confirmed positive balance; journal the anomaly/change.
- **Paused after live:** show operational pause prominently. On reload, current semantics may look like standby; do not solve by date-only inference.
- **Stale TzKT:** retain last value with timestamp and stale badge; do not transition to sold out from an error/default zero. Current public `fetchRedeemSupply` returns zero when network config is unavailable (`drops/js/events.js:823-835`), so a new model must represent unavailable separately.
- **RPC/TzKT disagreement:** degrade and block consequential actions until reconciled.
- **Reload/network switch/disconnect:** invalidate timers, polls, and cached state. Existing Admin uses epoch/abort guards that should be reused (`admin-ui/src/features/drops/drops.countdown.service.js:42-95`; `admin-ui/src/features/drops/drops.state.js:1-83`).
- **Invalid params:** show config error; never use permissive defaults to enter live.
- **Pair drift during live:** health alert; no automatic repair.
- **Params cleared while contract remains unpaused/pairs remain:** NO DROP UI must still expose a separate contract warning/diagnostic; UI clearing does not mutate chain state.
- **Indexer reorg or delayed operation:** activity remains provisional until chosen confirmation policy.

## Recommendation

Implement the lifecycle revamp as a read-side/UI ticket before tying it to the future authoring pipeline. It has independent operational value and can reuse existing phase, pause, balance, pair, and poll contracts. No new definition of live is required. The key correction is lifecycle routing: preflight checks before launch; operational metrics after launch; sold out informational until the operator deliberately saves the no-drop sentinel.
