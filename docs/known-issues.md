# Known issues

These seven unresolved defects were demonstrated on 2026-10-29 against Outer
`e4f4f1eef1d377664b94f7506f953d4d89bdefdb` and Admin
`10af957d3cc29a6defaaf955b0d697a0ae74a420`. They remain unfixed. Demonstrations
used inert SDK, network, DOM, or serializer boundaries; no live wallet or chain
transaction was performed. IDs below preserve the original evidence references.

- **CHR-20261029-001 — Stale Public boot read disconnects a newer wallet.**
  Outer `shared/beacon-setup.js`; consumers `drops/js/events.js` and
  `exchange/js/exchange.js`. Defer boot `getActiveAccount`, publish valid
  Shadownet account B, then resolve the old read with Mainnet account A.
  Mismatch cleanup clears the active account and publishes disconnection,
  replacing B. A stale same-network control preserves B. The old observation
  must lose authority before destructive mismatch validation.

- **CHR-20261029-002 — Pause submits after its authority is invalidated.**
  Admin `src/features/pause.js`, `src/escrow-ops.js`; consumer `src/admin.js`.
  Defer either outer or helper account lookup, invalidate the target/render a
  replacement context or deliver an SDK null-account event, then return the
  captured valid account. Drops and Exchange still request `toggle_pause` for
  the original escrow; obsolete result publication is suppressed but submission
  is not. Authority needs validation after each account await before submission.

- **CHR-20261029-003 — SDK account changes leave Treasury sends authorized.**
  Admin `src/beacon-setup.js`,
  `src/features/treasury/withdraw.controller.js`,
  `src/features/treasury/transfer.controller.js`; consumers `src/escrow-ops.js`
  and `src/features/treasury/orchestrate.js`.
  Defer the helper's second account read, deliver SDK `ACTIVE_ACCOUNT_SET` with
  null or same-network B, then return captured A. All eight surface/action/event
  cases request an operation. Explicit document-disconnect controls request
  none. SDK events invalidate Max balance without retiring the pending send.

- **CHR-20261029-004 — FA2 holdings stop at one page and missing supply becomes zero.**
  Admin `src/tzkt-api.js`; consumers
  `src/features/treasury/transfer.controller.js`,
  `src/features/treasury/table.render.js`, and
  `src/features/drops/drops.checklist.controller.js`.
  With 501 nonzero holdings and the redeem token at row 501, the API makes one
  `limit=500` request. Treasury receives an incomplete list without a completeness
  signal; the checklist publishes `__latestSupply=0` for an omitted token whose
  fixture balance is 1. No deployed escrow with 501 holdings was established.

- **CHR-20261029-005 — HTTP error can make Public standby publish LIVE.**
  Outer `drops/js/events.js` (`pollForUnpause` and countdown continuation).
  After countdown expiry in standby, HTTP 503 with `ok=false` and parsed
  `{paused:false}` is accepted without checking HTTP success. The continuation
  publishes `countdownPhase=live` and `LIVE NOW!` without an error. HTTP 200 is
  the valid control; no live provider incident was established.

- **CHR-20261029-006 — Health converts unknown chain editions to zero.**
  Admin `src/utils/token-econ.js`; consumer `src/features/health/health.cms.js`.
  A parsed balance of `not-a-nat` or `-1` intentionally produces a null edition
  value, but `getEditionsForToken` applies `Number(null)` and returns zero.
  Health reports an Editions mismatch against circulating chain zero instead
  of its unknown branch. Valid zero/five controls remain distinct. This is a
  diagnostic misclassification; no false healthy result was demonstrated.

- **CHR-20261029-007 — Drops Send rounds an accepted exact redeem token ID.**
  Admin `src/features/drops/drops.send.service.js`,
  `src/features/drops/drop-params.provider.js`, `src/escrow-ops.js`; Outer
  `shared/drop-params/drop-params-authoring.mjs`. The receiving schema is in
  `contracts/burn-redeem-escrow/smartpy/burn-redeem-escrow-smartpy.py` (Outer).
  An otherwise valid authored drop with redeem ID text `9007199254740993`
  passes validation. Send's cached/current conversions agree on a rounded
  Number and all three inert batch requests serialize `9007199254740992`.
  The committed ID `29` passes the control. Failure requires a future large-ID
  input; live token existence, wallet acceptance, and broadcast were not tested.
  Accepted identity must remain exact or be rejected before readiness/request.
