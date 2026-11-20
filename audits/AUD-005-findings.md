# AUD-005 — full consequential correctness review

Completed available-source adversarial pass, with **five confirmed findings**, on 2026-11-19 (America/Chicago). One is a remaining window in AUD-004-003; the other four are distinct adjacent failures. No production remediation, clean-result claim, deployment approval or live incident is asserted.

Reviewed Outer `fd47dda4adc4ccd23b71447d765acc8c1198d543` and independent Admin `9edef7cac18c04f40e75a9b15fca0517208f7c6a`, both on `ticket-AUD-005-full-correctness-review`, initially clean. Working-tree changes contain investigation documentation and inert/disposable evidence only. [Coverage](coverage.md) records source-driven discovery, all workflow dispositions, exact environment assumptions and external limitations. The [checklist](remediation-checklist.md) contains only the five implementation follow-ups below.

Expected properties derive from project intent, exact financial identity/conservation, current authority, source ownership, recovery and truthful actionable-state requirements. Code and passing tests are behavioral evidence, not their own oracle. P2 denotes a material, bounded correctness issue for remediation; none demonstrates theft or an unauthorized chain operation.

| ID | Repository | Confirmed failure |
| --- | --- | --- |
| AUD-005-001 | Outer | Source save during the ownership read can still be overwritten by normal apply |
| AUD-005-002 | Admin | Older drop-pair status can overwrite a newer same-context result |
| AUD-005-003 | Admin development | Stalled authoring response body escapes the timeout and retains READY authority |
| AUD-005-004 | Outer | Drops enables/submits a redemption with less inventory than its configured amount |
| AUD-005-005 | Admin generator | Accepted filename URL characters change asset identity after successful generation |

## AUD-005-001 — source ownership still has a lost-edit window (P2)

**Current ticket disposition (2026-11-19): confirmed unsupported external-concurrency limitation.** The owner clarified that direct source editing during Admin authoring is unsupported. [Supported-path reconciliation](AUD-005-001-source-ownership.md) traces the service/CLI, projection, watcher, mirroring and recovery writes through their shared coordination; no uncoordinated application writer was found in those checked-out paths. This is a support-boundary classification, not a completed code fix or a launch blocker for supported paths. `npm run evidence:drop-params:external-concurrency` preserves the six failing assertions as explicitly opt-in historical evidence; normal verification does not count them as passing regressions. The original audit property, reproduction and consequences below remain unchanged historical evidence. This disposition does not resolve the other four findings or approve a launch.

**Property and path.** A version-guarded configuration apply must preserve an independent authoritative-source save rather than report success after erasing it. The AUD-004 correction adds [exact-state checks](../shared/drop-params/drop-params-transaction.mjs#L212) before each [replacement](../shared/drop-params/drop-params-transaction.mjs#L548). `filesMatch` reads source, JSON and mirror asynchronously in sequence. It can read the old source successfully, then an editor saves new source before the remaining reads and rename. The captured old source bytes still satisfy the check; the rename replaces the later save. Cooperating writer/projector locks do not coordinate an ordinary editor.

**Demonstration.** [Read-window reproduction](repro/AUD-005-writer-read-window-repro.mjs), run from Outer:

```text
node audits/repro/AUD-005-writer-read-window-repro.mjs
```

The runner copies current writer/projector/schema/config modules unchanged into disposable workspace directories. A module hook wraps only the writer's native `readFile` boundary: after it obtains the old source bytes in the ownership check, it makes and independently reads back a different valid editor save, then returns those obtained bytes. The real writer proceeds through the other checks, rename, equality and completed journal. Final source is the reviewed candidate, the later save is gone, all projections agree, and status is unblocked. No alternate writer model is substituted.

Controls: unchanged apply completes; saving before the ownership check preserves the later bytes and requires reconciliation. The existing AUD-004 writer regression passes that broader-window control. The new ordered interleaving exposes the narrower remaining failure, rather than relying on scheduler luck or claiming a real editor incident.

**Consequence and remediation boundary.** Valid local operator work can still be silently lost, and builds/providers consume the candidate as completed truth. This is the unresolved source-ownership property from AUD-004-003, not a new unrelated recovery issue. Preserve external saves across the actual read-to-replacement boundary; merely repeating the same non-atomic check does not establish compare-and-replace ownership. Preserve journals, archives, coordinated projections and supported reconciliation. No real operational files or locks were modified; actual OS crash/power-loss behavior remains unverified.

## AUD-005-002 — stale same-context drop status replaces newer evidence (P2)

**Property and path.** A superseded status request must not publish over a newer completed request for the same drop. The [pairs-final listener](../admin-ui/src/features/drops/drops.controller.js#L718) starts `refreshStatusFromPairsOpFinal` without claiming a new publication generation. [Status guards](../admin-ui/src/features/drops/drops.controller.js#L132) reject obsolete configuration epochs, but both refreshes share one epoch. The [consumer](../admin-ui/src/features/drops/drops.status.service.js#L126) therefore accepts both results and publishes whichever resolves last, including an older one.

**Demonstration.** From Admin:

```text
node tests/repro/AUD-005-drop-status-order-repro.mjs
```

The [reproduction](../admin-ui/tests/repro/AUD-005-drop-status-order-repro.mjs) composes actual current normalization, builder, translation validation, classifier, status guards, panel wrapper and pairs-final service using the current bundled drop and registry. Only indexer completion order and the two UI sinks are inert. Start an old read that contains the complete intended mapping, then a new read after pair removal that contains no rows. Resolve the new read first: both checklist and panel publish `missing`. Resolve the old read: both publish `full` over it. Chronological completion ends `missing`; a configuration-epoch reset also correctly rejects the old `full` response.

**Consequence and remediation boundary.** The checklist and panel can claim pairs are set after their newer evidence found them missing, concealing setup/cleanup work and affecting the panel's readiness controls. This requires overlapping refreshes and reordered reads, not an account/network change or malformed provider response. No actual deletion or stale live-indexer incident occurred. Give every status refresh current-request ownership across building, reading, failure and publication; preserve existing configuration epochs, translation validation, event contracts and send ownership. AUD-004-005's supply-dependent recomputation is corrected and does not cover this request-order failure.

## AUD-005-003 — authoring body stall leaves the old trusted snapshot active (P2)

**Property and path.** Local authoring health must stop trusting its last snapshot when a current verification cannot complete within its deadline. The [client](../admin-ui/src/features/drops/authoring/authoring.client.js#L21) clears the AbortController timer when `fetch` returns headers. `decode` subsequently awaits `response.json()` outside that timer. A stalled body never rejects, so the [provider](../admin-ui/src/features/drops/authoring/drop-params.provider.dev.js#L74) keeps READY/params and shares its stuck refresh promise with later compatible health requests. The actual [Drops subscriber](../admin-ui/src/features/drops/authoring/index.js#L25) receives no invalidation. The controller schedules its next health check only after the pending refresh finishes.

**Demonstration.** From Admin:

```text
node tests/repro/AUD-005-authoring-body-repro.mjs
```

The [reproduction](../admin-ui/tests/repro/AUD-005-authoring-body-repro.mjs) uses the current client, provider and actual subscriber, with inert HTTP and a controlled clock. Establish healthy READY, then return successful headers with a deferred JSON body. After 60 simulated seconds, the signal is not aborted, refresh remains unsettled, READY and the old params remain in the Drops subscriber, and another health refresh performs no new read. Resolving that body with representation drift immediately revokes the snapshot. A separate stalled-headers control times out at the advertised 1.5-second deadline and publishes OFFLINE/null params correctly.

**Consequence and remediation boundary.** During a body stall, local authoring/health can remain stuck and a previously loaded Drops snapshot retains action authority even though current verification never finishes. The source failure is confirmed; no real local-service stall, stale wallet send or deployed exposure was observed. Production authoring isolation passed, so this finding concerns development authoring. Bound the entire response consumption and retire failed verification through the existing provider/subscriber lifecycle; preserve apply uncertainty, preview binding and late-response ownership. AUD-003-008 correctly handles rejected verification, but cannot act while this request never rejects.

## AUD-005-004 — positive inventory is insufficient for a multi-unit redemption (P2)

**Remediation (AUD-005-004, 2026-11-19):** Outer now requires known exact inventory covering the complete configured redeem amount in presentation and entry/final send guards. The [maintained lifecycle regressions](../drops/js/trade-lifecycle.test.mjs) replace the defect assertions in the audit command below and cover multi-unit and amount-one thresholds, exact identity/integer handling, unknown/invalid inventory, pre-send refresh invalidation, captured-action bypasses, pause/LIVE authority and confirmation failure. The original property, reproduction observations and limits below are historical evidence; a sufficient observed balance still does not guarantee chain success.

**Property and path.** A known inventory balance must cover the entire configured redemption before the application presents the action as available or requests it. The [Drops send guard](../drops/js/events.js#L1066) and [button state](../drops/js/events.js#L2646) require only positive finite supply. They do not compare it with `redeemToken.redeemAmount`. Current authoring explicitly permits positive safe-integer redeem amounts greater than one. With amount 3 and supply 1 or 2, both gates allow a request for 3.

**Demonstration.** From Outer:

```text
node audits/repro/AUD-005-drops-inventory-repro.mjs
```

The [reproduction](repro/AUD-005-drops-inventory-repro.mjs) first verifies that current authoring/compatibility validation accepts redeem amount 3. It reuses the maintained fixture's actual current trade handler and loads the real button-state function. At supply 1 and 2, the button has a trade action and the wallet seam receives an `initiate_trade` requesting 3. Zero blocks; supply 3 and 4 sends the same exact amount as valid controls. Wallet, confirmation and DOM edges are inert. No SmartPy/Michelson execution was simulated or claimed.

**Consequence and limits.** A supported amount-3 drop funded with 10 leaves one unredeemable token after three trades; that positive remainder continues to authorize an impossible redemption. The current committed SPLINTERED configuration uses amount 1, so this is a supported-configuration defect, not evidence that the configured live drop has this condition. The contract sends the configured amount from escrow; insufficient inventory in a conforming FA2 rejects the operation atomically under the [FA2 transfer contract](https://gitlab.com/tezos/tzip/-/blob/master/proposals/tzip-12/tzip-12.md). This inference does not establish wallet simulation, injection, gas paid or a live incident. No funds-loss claim is made.

**Remediation boundary.** Require full configured redeem inventory in both presentation and final submission checks, handling unknown, insufficient, zero and sufficient states consistently. Preserve exact terms, manual pause authority, polling/recovery and confirmation-versus-balance separation. Client checks cannot guarantee inventory remains unchanged after observation; that separate race remains a chain rejection boundary.

## AUD-005-005 — JavaScript escaping does not preserve URL asset identity (P2)

**Property and path.** Every accepted local thumbnail filename must resolve to that same asset in the generated manifest. [Filename discovery](../admin-ui/scripts/gen-thumbs-manifest.mjs#L78) accepts numeric-prefix descriptive suffixes. The AUD-004 fix safely escapes JavaScript string characters, but [URL generation](../admin-ui/scripts/gen-thumbs-manifest.mjs#L222) still inserts the raw filename as a URL reference. `#` begins a fragment and percent sequences are decoded as URL escapes. Both are valid local filename content on this Windows environment.

**Demonstration.** From Outer:

```text
node audits/repro/AUD-005-thumb-url-repro.mjs
```

The [reproduction](repro/AUD-005-thumb-url-repro.mjs) copies actual assets into a disposable fixture and runs the actual Admin generator, imports its output and invokes its checker. Ordinary `29.jpg` and corrected `29_artist's.jpg` controls generate, resolve to their exact files and pass. `29_artist#proof.jpg` and `29_artist%20proof.jpg` both generate successfully but their manifest URLs resolve to different filesystem paths; freshness checking rejects the newly generated manifest. The apostrophe correction remains effective; URL encoding is a distinct representation boundary.

**Consequence and remediation boundary.** A supported local asset rename can replace a valid manifest with incorrect asset URLs while reporting success, blocking the required Admin checker/build until corrected. Current tracked names/build pass. No untrusted remote naming, live outage or code execution was established. Preserve filename identity through URL path encoding, or reject unsupported names before replacement; keep existing JavaScript escaping, shared lock and import rollback coordination.

## Prior findings reassessed

| Prior evidence | Current disposition at the reviewed revisions |
| --- | --- |
| AUD-004-001 withdrawal editing | Original exponent/negative text is no longer rewritten; exact decimal input and final conversion reject unsupported representations. Both surfaces' current `treasury-withdraw-input.test.mjs` cases passed in the runtime suite. Max, pending/recovery and submit invalidation also passed. |
| AUD-004-002 pair authority | Initiating create/controller/helper authority now spans availability/account/permission awaits; edit/cleanup helpers capture it before wallet awaits. Current `pair-authority.test.mjs` covers both surfaces, all write entries and unchanged-account controls; broad suite passed. No claim about real signing or SDK transport timing. |
| AUD-004-003 normal apply ownership | Original before-check trigger is blocked and the maintained writer regression passes. The read-window trigger in 001 remains confirmed; the overall lost-edit property is not closed. Recovery-specific external-edit and pending-READY controls still pass. |
| AUD-004-004 thumbnail apostrophe | Current generator imports/checks the apostrophe case successfully; 28 Admin manifest tests pass. URL-identity failure 005 remains distinct. The old defect-asserting script is historical. |
| AUD-004-005 supply dependents | All supply invalidations now recompute the balance, pause pill and pairs dot through `publishRedeemEscrowSupply`; current lifecycle/supply cases pass. Finding 002 concerns separate status-request ordering. |
| CHR-001 / AUD-003-001; CHR-002 / AUD-003-005; CHR-003 / AUD-003-003 / AUD-003-006 | Public stale boot/permission observations, Pause/Treasury/Drop send authority and ambiguous durable recovery re-traced; current wallet, pause, treasury, pair and Drops invalidation suites pass. Maintained wallet and current Pause/Treasury reproductions pass. |
| CHR-004 / AUD-003-002; CHR-005 / AUD-003-011; CHR-006 / AUD-003-004 / 014 / 015; CHR-007 / AUD-003-007 | Complete holdings and Health enumeration, unknown economics, pause/LIVE polling, explicit economic refresh, CANAAN ACID validation and exact token identities re-traced; current suites and applicable reproductions pass. Five new findings do not reopen the old triggers without stated evidence. |
| AUD-003-008 / 009 / 010 / 012 | Provider rejection invalidation, invalid mapping-page rejection, bounded public confirmation and duplicate burn reductions hold in their current tests. Finding 003 exposes a different unbounded response-body interval. |
| AUD-003-013 / 016 / 017 / 018 / 019 / 020 | Footer navigation, falsy equality validation, external-edit recovery, pending journal exclusion, CMS pagination and manifest-writer coordination hold in current source and maintained reproductions. Normal-apply 001 differs from interrupted recovery. |
| AUD-002 and earlier | Reconciled through AUD-003/004 ledgers and current source: no earlier issue was silently omitted, adopted as an oracle or declared resolved by an old report. Current confirmation, amount/identity, projection, pair editing, public compatibility and asset controls support the scoped dispositions above. Historical defect-asserting fixtures remain historical evidence. |

## Verification and evidence limits

All final successful checks tested the unchanged runtime revisions named above. Windows PowerShell; Node `v22.16.0`, npm `10.4.0`; installed dependencies, no install/update. Beacon SDK 4.8.1/core+dapp 4.8.0, Parcel 2.16.4, Taquito 19.0.2 and Sharp 0.35.3. `NETWORK` unset; Shadownet default. Exact lockfile hashes and configured targets are in coverage.

| Actual command / selection | Outcome |
| --- | --- |
| Outer `node --test --experimental-vm-modules --experimental-test-isolation=none` with explicitly enumerated top-level `shared/*.test.mjs`, `drops/js/*.test.mjs`, `exchange/js/*.test.mjs` | 363 pass, zero fail/skip |
| Same flags, all `scripts/*.test.mjs`, loader architecture, Outer thumbs and Webflow CMS tests | 87 pass, zero fail/skip |
| `npm run test:public-trade-ops` | 20 named fixtures and 19 deadline tests pass; some overlap above |
| `node audits/repro/AUD-004-config-suite.mjs` | Unchanged suites in disposable copies: 25 authoring + 19 transaction + 10 service + 89 projection + 1 watcher = 144 pass |
| Admin `npm run test:runtime` | 1,908 pass, zero fail/skip |
| Admin `npm run test:thumbs` | 28 pass; build's `check:thumbs` also passes |
| Five new defect reproductions, commands above | All reproduce stated failures with valid controls; these assert defects and are not remediation gates |
| `node audits/repro/AUD-004-writer-cas-repro.mjs` | Original corrected window and unchanged control pass |
| Eleven maintained AUD-003 Outer scripts (all except `drop-authority`) using `node --experimental-vm-modules` | All pass; names/logs in coverage |
| Five Admin `tests/repro/AUD-003-*-repro.mjs` scripts | All pass |
| `node audits/repro/AUD-005-contract-abi-check.mjs` | Six actual Admin payloads and both Public handlers decode against promoted ABI; huge exact nat preserved |
| `node audits/repro/AUD-004-contract-provenance-check.mjs` | Canonical/snapshot and fixture/target correspondence, frozen/promoted LF identities pass |
| `python "docs/EA-XYZ Contract Audit/tests/verify-invariant-coverage.py"` | 26/26 invariants, 181/181 obligations, 13 mapped tests; mapping evidence only |
| `node scripts/shadownet-exchange-pairs.mjs` | Default inert 44-pair dry-run passes; provider/signer/RPC/execute/verify live modes not invoked |
| `npm run build:pages:staging`; Admin `npm run build:clean` | Pass; six public bundles; Admin mirror/manifest/Parcel/prune/isolation pass (four dev chunks removed, eight production files verified) |
| `npm run verify:home-first-paint-build`; `npm run verify:drops-first-paint-build` | Pass for fresh staging and pre-existing production artifacts; production was not rebuilt |

Initial configuration/tooling runs hit sandbox `EPERM` for child/native processes; permitted reruns passed. The historical AUD-004 ABI probe failed because its VM omitted the newly required pair authority/target dependencies; the AUD-005 copy supplies the maintained fixture dependencies and passes without changing production code. Historical AUD-003 `drop-authority` similarly stops before its expected second wallet read because its helper fixture omits the new target resolver. It is not counted as a passing regression; the current `drops-send-invalidation` and `pair-authority` suites provide its executable coverage. No failing application assertion was waived as a harness failure.

The direct contract pass covered every current admin/default/trade entry, all trades rather than the first only, exact stored terms, custody destinations, pair cardinality, repeated IDs, positive amounts, external rejection/insufficient inventory and event fields. Public approval/trade batching and all Admin serializers were followed to these consumers. The contract has no current admin-change or burn-address-change entrypoint; those constructor identities are deployment trust boundaries. Atomic external failure behavior depends on [Michelson execution semantics](https://octez.tezos.com/docs/active/michelson.html) and conforming FA2s. A sink transfer does not itself prove irreversible burning; an arbitrary no-op FA2 is not made honest by successful invocation. MockFA2 omits real operator policy.

Legacy SmartPy was unchanged and not compiled/executed. No compatible legacy compiler was supplied, no modern substitute used and no Michelson generated. Canonical checkout SHA-256 `0BC3B735377B92F1E5635ED7789B7693018DECA2256FA79DEEBD952279FC8BD9`; promoted LF SHA-256 `FE850EA74A082D8E57EE47D0E3D70339088D1490128D93A86BDDDB338947F0A9`. Repository byte/ABI checks and the historical Phase-7/8/10/11 records are not new compile, typechecking, deployed-code or chain-outcome evidence.

No current live Webflow site/custom code, wallet transport, RPC/TzKT/time response, external FA2, deployed bundle or hosting identity was observed. External reads on 2026-11-19 concerned protocol/interface reference pages only. Browser/manual smoke, Linux/Node-20 CI, fresh dependency install, actual OS crash durability, production rebuild, dev/sanity server, deployment and transactions were not performed. Unverified integrations remain explicitly unverified; none is promoted to a confirmed live failure or clean evidence.

The five findings prevent a provisional clean pass, so the conditional post-clean independent coverage refresh was not invoked. No additional unresolved material local hypothesis is asserted. Remediation and a subsequent complete pass require their own authorized ticket scope.
