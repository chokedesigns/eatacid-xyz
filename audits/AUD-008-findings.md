# AUD-008 — full adversarial correctness findings

**AUD-008-001 corrective addendum, 2026-11-24.** Checklist 0.1 is implemented
on `ticket-AUD-008-001-trade-balance-freshness`. The investigation below records
the original source revision and defect. Its historical executable entrypoint
now runs maintained corrective tests in `shared/public-trade-freshness.test.mjs`
and both existing Public consumer suites. Success now asserts safe recovery,
including incoming transfers, rather than the historical defect. See
[Public recovery](../docs/operations.md#public-applied-trade-recovery) for the
provider evidence, precise unsupported cases and verification limits.
AUD-008-002 and the original audit's other dispositions are unchanged.

**COMPLETE / NOT CLEAN, 2026-11-24.** Full source examination and explicit
behavioral reconciliation against both historical enumerations are complete.
Two confirmed conditional P2 findings remain. Source: Outer
`476b83c7267ce46dd2316942d122a983a44f6817`; independent Admin
`bfb9d26cb327723cbd6e76db4247ee8b922663fa`; both
`ticket-AUD-008-full-correctness-review`, initially clean. Runtime is unchanged;
only investigation documentation/reproduction evidence is added. Current
coverage, branch reasoning and actual verification are in [coverage](coverage.md).
No production fixes or external operations were performed.

## AUD-008-001 — incoming tokens can indefinitely block confirmed-trade recovery

**Confirmed conditional P2 availability defect.** Both Public Drops and Exchange
can retain an already applied trade and refuse all later trades by that account
on the affected escrow even when every new holdings read is complete and current.
No observed live incident, incorrect on-chain burn or loss of funds is claimed.

**Expected property.** A successful trade must allow recovery to a truthful,
actionable current balance after the indexer catches up. The old balance is not
an invariant of a transferable FA2 asset. Incoming transfers are ordinary token
behavior, including tokens returned from Admin treasury, and must not make an
otherwise valid wallet permanently unusable. Retaining an uncertain submission
is appropriate; treating its net balance decrease as the only possible proof of
freshness after attributed application is not sufficient.

**Supported preconditions and consequence.** A wallet starts with one unit of an
eligible token and burns one. Before the post-trade read, it receives one unit of
the same FA2/token ID. Its correct current balance is `1 - 1 + 1 = 1`. The operation
is correctly reported applied and the full holdings endpoint correctly returns
balance 1. This requires an ordinary incoming token transfer; it does not require
DOM/storage tampering, an incorrect indexer, an unsupported external source edit,
or changing project configuration. An Admin rescue transfer is another current
application producer of the incoming asset; no rescue transaction was executed.

**Implementation path.** Both handlers reserve the exact intended trade before
requesting the wallet, then reconcile it and retain `status: applied` in
`shared/public-trade-ops.js`. The page gates demand that the current balance be
at most `startingBalance - quantity`. Exchange uses
`areTradedTokensRefreshed` via `assertTradedBalancesRefreshed` in
`exchange/js/exchange.js`; Drops uses `assertDropsTradeBalances` in
`drops/js/events.js`. Correct current balance 1 exceeds required balance 0, so
both reject it as still updating. `restoreSubmittedTrade` restores the retained
traded-token snapshot before later render/retry attempts; their `clearApplied`
and confirmed-trade deletion run only after this gate succeeds. The durable
record restores the condition after reload. Retrying the same correct read
cannot recover it. The entire affected page's wallet-token projection fails,
so unrelated eligible tokens on that surface cannot be used either. Another
wallet/escrow scope remains independent. If a later external transfer lowers
this token's balance enough, the numerical gate can pass; the defect is not a
claim that all outside interventions are impossible.

**Deterministic evidence.** Run:

```text
node audits/repro/AUD-008-public-net-balance-repro.mjs
```

The script uses the production durable store, attributed operation classifier,
complete FA2 page reader, and unmodified gate functions extracted with checked
source anchors from both current consumers. It also reuses the maintained
`exchange/js/exchange-wallet.test.mjs` fixture to execute the complete production
Exchange page module: connect, select, send, attributed application, three balance
retries, disconnect/reconnect, reload with the same storage and correct current
holdings, and a refused subsequent trade. The applied receipt remains retained
and quantity selection disabled. The full-handler burn-only control clears its
receipt; separate gate controls accept an incoming different-identity token.
Addresses/provider responses are inert fixture values. Drops is demonstrated at
its real recovery gate plus source tracing; Exchange includes the full page
handler/consumer integration. Neither is a real browser/wallet/chain execution,
legacy SmartPy test or proof of deployed behavior. The script exits 0 when the
defect and controls are observed.

**Interface grounding.** FA2 permits independent transfers and per-token
operators; see [Tezos FA2 documentation](https://docs.tezos.com/architecture/tokens/FA2).
The current Admin `adminBatchTransferTokens` / contract `admin_transfer_token`
path also transfers escrow-held tokens to an explicit wallet independently of
Public's captured baseline. Chain rollback assumptions for the separate direct
trade review follow [Octez Michelson execution semantics](https://octez.tezos.com/docs/active/michelson.html).
These specifications do not establish any current deployed FA2's honesty or
indexer consistency. The reproduction assumes compliant transfers and correct
applied/current evidence.

## AUD-008-002 — replacement Drop Params retain an obsolete fully-set claim

**Confirmed conditional P2 readiness defect; Admin.** A supported active-to-active
provider update can display the new drop terms beside the old green
`FULLY SET ON-CHAIN` status while current verification is pending. This is a false
current-readiness claim. Send remains disabled; no unauthorized submission,
automatic unpause, loss of funds or observed live incident is asserted.

**Expected property and supported path.** On-chain readiness must describe the
current exact drop terms. Evidence of a previous burn amount cannot establish
that the replacement amount is set. Local authoring EDIT accepts a positive burn
amount change and publishes a new verified immutable provider snapshot through
`authoring/index.js` to `runtime.updateProviderState` / `updateParams` in
`admin-ui/src/features/drops/drops.controller.js:808`. Existing chain pairs do not
change when local parameters change. This is ordinary supported authoring, with
no external source edit, UI tampering, arbitrary delayed metadata producer or
incorrect indexer response required.

**Implementation and consequence.** `updateParams` bumps status guards, replaces
`currentDropParams` and `deps.DROP_PARAMS`, and directly calls `handleUiReset` in
`drops.load.service.js`. That resets cached Send intent, loop/preview epochs,
preview fields and controller state, then runs the initial preview for the new
terms. It does not dispatch the panel's `drops:ui:reset` event. The panel view's
own `statusSummary` and green label are reset by that event or a network event,
not by the controller-state publication. `resetDropsPreview` does not own that
label. Starting a new guarded status request fences obsolete completions but
does not retire already published evidence in `drops.view.panel.js:337`.

Consequently, the new preview can be shown while the old label and `Pairs Set`
presentation remain. The next successful current status result corrects them.
If the catalog or pair read stalls, the stale claim has no enforced expiration
at this boundary. It can mislead an operator's readiness assessment of the new
configuration. Freshness/authority for Send is separately retired and does not
depend on believing that label. This differs from corrected AUD-005-002: newest
request wins correctly once it completes; invalidating the previous completed
claim is the missing boundary here.

**Executable evidence.** Run from Outer:

```text
node audits/repro/AUD-008-admin-status-invalidation-repro.mjs
```

The reproduction composes the maintained `drops-status-ordering.test.mjs`
fixture's actual controller, loader, builder, normalizer, classifier, status
service, panel view and state publication. Harness-only changes expose the
already wired runtime and supply its real time/status/public-state dependencies;
production function bodies are unchanged. The fixture's controlled pair-read
promise models ordinary asynchronous indexer completion. A positive control
establishes FULLY SET for the old terms. Changing the enabled burn amount through
the real provider-consumer entry starts a new read but retains FULLY SET while
Send is disabled. Resolving that read with the **same unchanged old chain rows**
correctly yields NOT SET for the new terms. No hidden controller/loader exception
is permitted. The fixture stubs independent catalog/checklist/preview rendering
edges; their ownership was followed separately in source. This is a source/seam
reproduction, not a real browser, service apply or chain execution. Exit 0 asserts
the defect and distinguishing controls, not remediation.

**Remediation boundary.** Retire configuration-dependent status at the provider
replacement boundary across its view/checklist consumers, then admit only
matching current evidence. Preserve existing newest-request guards, cached Send
invalidation, pause/supply independence and recovery behavior. The related
checklist stores `__latestPairsStatus` separately and resets it for missing or
inactive params, but not at active-to-active replacement; GitHub match dots also
retain prior values until a new check. Those consumers belong in the same
invalidation review. Their precise visual duration is source-only evidence here,
not a second executable finding or a claim that a GitHub match proves deployment.

## Other dispositions and verification limits

- AUD-005-001 remains the documented unsupported concurrent external-editor
  limitation. Current writer/projector/lock/journal source examination has not
  established a new supported-path lost-edit defect; the external concurrency
  preservation suite was not reclassified or run as a supported regression gate.
- Pause's cached display and direct toggle semantics were challenged. The default
  action is explicitly `Pause // Resume`, not an expected-state setter. No new
  wrong-direction finding is established by a stale display alone. Both pause
  surfaces, recovery and the actual non-bubbling Exchange broadcasts were traced
  through their consumers; they do not spuriously reach the global Drops listener.
- Initial pair metadata is currently local-only through `chainUi.token` /
  `catalog.get` / `getTokenUi`. Known collections use local token lists; custom
  contracts use custom token mode. Injecting a pending remote metadata promise
  into initial modal population does not establish a supported current producer.
  Draft typing during already-clicked cached Send is likewise not an independently
  grounded requirement to cancel the authorized preview. Neither is a fix ticket.
- Both historical scope maps and all prior finding families are reconciled in
  coverage against the current producers/consumers, including original CHR issues,
  AUD-002 through AUD-007 and the accepted external-editor limitation. Historical
  counts, remediations and defect-asserting scripts are not proof of current behavior.
- Passing existing tests are supporting evidence, not coverage completion or an
  independent oracle. Exact-revision broad evidence retained from this audit:
  Public 299, Admin runtime 2,082, isolated projection 90, supporting 102,
  configuration/display 28, thumbnail 27 + 37; shared trade fixtures, ABI decode
  and mechanical source/artifact correspondence pass. Copied Outer staging and
  Admin clean builds pass. Continuation adds both final reproductions/syntax
  checks, 91 focused Admin cases and all 31 frozen checkout/HEAD-blob identities
  plus manifest identity. Initial subprocess EPERM checks passed on permitted
  reruns; no application failure was waived. Commands/logs are in coverage.
- Source examination includes all eight direct escrow entries and failed later
  batch effects. Embedded MockFA2 omits operator authorization; standalone
  conforming/rejecting/no-op fixtures and named invariant mappings are bounded
  oracles. Legacy SmartPy compilation/execution and native Michelson execution
  were unavailable. No current deployed identity, FA2 honesty, sink destruction
  or real rollback was established by hashes, ABI decoding or old certification.
- Real browser/wallet/Web Locks/storage, RPC/indexer/finality, time/IPFS/GitHub
  raw, Webflow/CMS/hosting and deployed contracts remain unverified. Production
  Outer build, both-variant first-paint build checks, actual Pages branch assembly
  and fresh Node-20/Linux CI installation were not executed. Builds used bounded
  copies, preserved real operational state, and retained Browserslist/bundle warnings.

The [remediation checklist](remediation-checklist.md) contains the two actionable
implementation roots, grouped independently; no production fix is included.
All local consequential examination and historical reconciliation are finished.
Material findings preclude a provisional clean verdict and the conditional
independent clean-result coverage refresh. No `audits/report.md`, clean claim,
launch/merge approval or external operation is implied.
