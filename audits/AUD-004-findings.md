# AUD-004 — full consequential correctness review

**Completed available-source adversarial pass, with five confirmed findings — 2026-11-17.** This is not a clean result, deployment approval or certification of live behavior. All findings remain open; no production remediation was performed.

Reviewed Outer `9675ca35016d1fc9a84a3fd93aa12cfde8732873` and independent Admin `38e922c54b57d5645022a0f86f9991fc596576a6`, both on `ticket-AUD-004-full-correctness-review`. Both repositories started clean. Subsequent changes are investigation documentation and evidence only. [Coverage](coverage.md) records independent forward/reverse/boundary discovery, reconciliation, all 20 workflow dispositions, assumptions, exclusions and external limitations. [Remediation checklist](remediation-checklist.md) contains the five resulting implementation tasks.

Expected properties came from project intent, exact financial identity/amount and custody rules, current-account authority, truthful unknown/outcome publication, source ownership and identified protocol contracts. Code/tests establish implementation behavior; they do not define correctness. Each workflow was examined through alternate/direct entries, await ordering, error/retry/recovery, cached/generated/rendered boundaries and consequential consumers. The pass did not stop at previous regression paths.

## Confirmed findings

P2 means a material correctness defect for ordinary remediation, with the stated trigger and bounded impact. No finding establishes a live incident or an unauthorized on-chain transfer.

| ID | Repository | Failure | Real implementation evidence |
| --- | --- | --- | --- |
| AUD-004-001 | Admin | Withdrawal input changes exponent/negative amounts into different positive values | Input listener, converter and submit controller on both surfaces |
| AUD-004-002 | Admin | Set Pair intent survives account replacement during its availability read | Set Pair controller, Beacon lifecycle and operation helper |
| AUD-004-003 | Outer | Normal config apply overwrites an external source save during staging | Writer/projector, later-save and unchanged controls |
| AUD-004-004 | Admin | Supported thumbnail suffix emits invalid JavaScript while generation succeeds | Actual generator/checker with copied assets |
| AUD-004-005 | Admin | Failed supply refresh retains green Sold out and depleted-derived pair display | Checklist controller, scoped events and controlled balance reads |

### AUD-004-001 — withdrawal input changes the requested amount (P2)

**Expected:** a financial amount retains numeric meaning through editing, validation and serialization. Unsupported representations should be rejected or normalized equivalently. HTML number inputs permit floating-point representations; exponent/negative text is not automatically excluded by `type`. This was checked against the [HTML number-state specification](https://html.spec.whatwg.org/multipage/input.html#number-state-(type=number)); the reproduction does not require an invalid arbitrary DOM string.

**Path:** both Drops and Exchange Treasury wire the [withdrawal input handler](../admin-ui/src/features/treasury/withdraw.controller.js#L364). It removes everything except digits/dots, then takes a decimal prefix of at most six fractional digits. The [submit controller](../admin-ui/src/features/treasury/withdraw.controller.js#L421) validates/converts the already changed input with `xtzToMutezStr`.

**Observed:** paste `1e-6`: input becomes `16`, and submission requests `16000000` mutez. The equivalent decimal `0.000001` requests `1` mutez. Enter `-1`: input becomes `1`, requesting `1000000` mutez instead of rejecting the negative value. No invalid-input warning accompanies the edit. Downstream exact-decimal validation cannot recover the original value.

**Impact/limits:** the wallet can receive a materially different withdrawal request, potentially depleting more escrow XTZ reserve than intended. The value visibly changes and wallet approval is still required. The contract pays its stored admin; no arbitrary-recipient theft or invisible signing is demonstrated. Actual signing/application and live inventory were not tested.

**Reproduce from Admin:** `node tests/repro/AUD-004-withdraw-input-repro.mjs`. Eight cases execute the actual input listener, submission flow and converter through the maintained Treasury fixture. Ordinary `1` and `0.000001` controls preserve exact values on both surfaces; exponent/negative cases show changed requests. DOM, wallet/indexer and confirmation boundaries are inert. Passing this script demonstrates the current defect, not remediation.

**Remediation boundary:** validate the complete representation before constructing an amount; preserve numeric intent or reject unsupported/negative/overprecision values. Retain exact mutez conversion, Max/snapshot invalidation and recovery. Silently deleting characters cannot satisfy this property.

### AUD-004-002 — Set Pair submits obsolete intent as a replacement account (P2)

**Expected:** a privileged operation initiated/reviewed under A retires if B replaces A before effect, unless the operator initiates a new action under B. Current network validity alone is not continuity of reviewing authority.

**Path:** the [Drops Set Pair listener](../admin-ui/src/features/pairs/pairs.controller.js#L602) calls `ensureAccount()`, constructs captured form data, awaits `hasActivePairId`, then calls `setTokenPairs` without captured authority. The [Exchange Set Pair caller](../admin-ui/src/features/pairs/exchange-pairs.js#L556) also omits it. [sendTx](../admin-ui/src/escrow-ops.js#L69) accepts optional authority, [setTokenPairs](../admin-ui/src/escrow-ops.js#L314) supports it, while [update/cleanup](../admin-ui/src/escrow-ops.js#L248) do not carry it through their interfaces. Edit/cleanup callers have adjacent omissions.

**Decisive observation:** submit the actual Set Pair form as verified A; hold only its network availability read; deliver the real Beacon module's active-account event replacing A with B on Shadownet; resolve the pair as free. Every SDK account read in this case immediately returns the current account. The listener sends A's prepared form through the real operation helper while B is current. No unusually stalled SDK account read is needed. Installed `DAppClient.requestOperation` reads its active account for `sourceAddress`; an earlier wrapper observation does not bind it to A.

**Impact/limits:** stale privileged intent reaches B's wallet. If B is target admin and approves, obsolete configuration can apply. Otherwise contract admin validation rejects it: this is not an admin bypass. Local evidence establishes request invocation/entrypoint, not SDK transport, signing or application.

**Reproduce from Admin:** `node tests/repro/AUD-004-pair-authority-repro.mjs`. The full Set Pair listener holds a real controller lookup with stable-A and A-to-B controls. Eight other cases exercise the cleanup controller and update/set helpers across a controlled older account read; they characterize guard omissions, not a claim that the installed SDK normally stalls resolved account reads. A set-helper control using existing captured authority suppresses the obsolete request; stable A sends. Fixture addresses are shape-valid local identities, not claimed live accounts.

This extends beyond remediated AUD-003-006: the dedicated Drops batch-send service now binds reviewing authority, but other reachable pair writers do not all use that contract.

**Remediation boundary:** bind every create/edit/cleanup intent across lookup/permission/account awaits through request, consistently on both surfaces. Preserve target selection, exact fields, attributed confirmations and form/session ownership.

### AUD-004-003 — normal apply loses a later authoritative source edit (P2)

**Expected:** a source-version-guarded write cannot silently replace an intervening independent authoritative-source edit. Equal generated copies after replacement do not prove ownership of the displaced source.

**Path:** [readVerifiedCurrentState](../shared/drop-params/drop-params-transaction.mjs#L136) checks `expectedSourceVersion` before journal/archive/staging awaits. Later [replaceTargets](../shared/drop-params/drop-params-transaction.mjs#L526) renames each staged file over its target without rechecking base ownership. The process lock coordinates supported writers/projectors, but an editor saving authoritative JS does not use that lock. Normal CREATE/EDIT/DEACTIVATE callers, including authoring and CLI, share this transition; the demonstrated case is EDIT.

**Observed:** start valid EDIT with current hash/candidate. After staging, immediately before the first replacement, save a different valid source and verify its hash differs from the reviewed base. Resume. Apply overwrites that save, returns `completed`, passes candidate source/JSON/mirror equality, and leaves writer status unblocked. Final equality proves internal agreement after replacement rather than ownership of the overwritten edit.

**Impact/limits:** valid operator work is lost and subsequent builds/authoring consume the older operation's config as completed truth. No deployment/financial action occurred. A real writer test hook controls an editor-save interleaving during asynchronous staging; this is not an observed editor/OS incident or power-loss test.

**Reproduce from Outer:** `node audits/repro/AUD-004-writer-cas-repro.mjs`. It copies actual writer/projector/schema/config modules into a bounded disposable tree. The unchanged-source control and later independent-save case both complete with equal projections; only the latter proves lost work. Cleanup is path-validated; real journals/archives/locks/config are untouched.

Maintained AUD-003-017 recovery/rollback tests pass. Ordinary successful apply is a distinct transition, not protected by that recovery fix.

**Remediation boundary:** preserve source ownership across staging/replacement; fail closed or reconcile when the reviewed base changes. Preserve later edits, archives, recovery journals/locks and coordinated projections. Do not delete unresolved state. True crash-atomic filesystem guarantees require a supported coordination design, not an unqualified promise based on one more check.

### AUD-004-004 — accepted thumbnail filename breaks the generated module (P2)

**Expected:** accepted asset names serialize into a loadable manifest; generator success cannot leave its next required checker/build unable to import output.

**Path:** [tokenIdOf/getFolderRows](../admin-ui/scripts/gen-thumbs-manifest.mjs#L78) supports numeric prefixes with descriptive suffixes and checks readable file/type. [buildManifestModel](../admin-ui/scripts/gen-thumbs-manifest.mjs#L222) inserts the filename unescaped into a single-quoted `new URL(...)` JavaScript string. [run](../admin-ui/scripts/gen-thumbs-manifest.mjs#L327) replaces the output and reports success without validating module importability.

**Observed:** rename copied valid CANAAN `29.jpg` to supported `29_artist's.jpg`. Generation succeeds but emits `new URL('./thumbs/canaan/29_artist's.jpg', import.meta.url)`, which is syntactically invalid. `checkManifest` rejects it as unable to load; Admin's required `check:thumbs` build precondition is blocked. Ordinary filenames generate/import/check successfully.

**Impact/limits:** a supported local naming operation can replace a good manifest with unusable output while reporting success, blocking builds until corrected. No remote filename control, live outage or execution exploit is claimed. Current checked-in assets pass freshness/build checks.

**Reproduce from Outer:** `node audits/repro/AUD-004-thumb-filename-repro.mjs`. Actual Admin generator/checker, disposable copies of current assets, ordinary-name control and apostrophe failure; bounded fixture cleanup only.

**Remediation boundary:** safely serialize accepted paths, or explicitly reject unsupported names before replacing output; verify generated importability before success. Preserve shared locks, atomic output replacement, ordinary suffix support and outer rollback coordination.

### AUD-004-005 — unknown supply leaves stale depleted-state conclusions (P2)

**Expected:** unavailable current supply must invalidate or explicitly qualify every dependent actionable conclusion, not just its balance label.

**Path:** [checklistLifecycle](../admin-ui/src/features/drops/drops.checklist.controller.js#L152) makes live-phase zero supply `depleted`. [Pause/pill projection](../admin-ui/src/features/drops/drops.checklist.controller.js#L189) shows green `Sold out`; [pairs projection](../admin-ui/src/features/drops/drops.checklist.controller.js#L541) suppresses missing-pairs warnings while depleted. Successful [supply updates](../admin-ui/src/features/drops/drops.checklist.controller.js#L472) synchronize all dependents. Invalid/missing/read-failure branches set `__latestSupply = null` but call only `syncRedeemSupplyDot()`.

**Observed:** during live phase establish zero remaining, paused true, pairs missing. Presentation is `Sold out`/`has-ok` with neutral pairs. Fail the next scoped supply refresh: balance becomes `-/-`/neutral, but green `Sold out` and neutral pairs remain. A six-unit successful control updates the pill to `Paused during live drop` and restores the missing-pairs warning. The failed branch omitted these unknown-supply implications.

**Impact/limits:** contradictory readiness can conceal pause/pair work when supply evidence fails or replenishment cannot be read. Stale conclusions last until a successful supply update or another event recomputes them; no indefinite persistence under every event schedule is claimed. This does not itself authorize a send. The live 15-second supply poll calls the same updater as the tested scoped confirmed-transfer event.

**Reproduce from Admin:** `node tests/repro/AUD-004-checklist-supply-repro.mjs`. Real controller/listeners, inert DOM/config/catalog/indexer edges, genuine zero evidence, failed subsequent read and replenished-balance control. No Treasury operation occurs. Existing lifecycle tests asserted the unknown balance label without asserting these dependents after failure.

**Remediation boundary:** recompute all dependent projections whenever supply evidence changes or is invalidated, including malformed/missing-config/exception/submitted/reset paths. Preserve scoped event validation, request/epoch ownership, polling and stale-result retirement.

## Prior issues reassessed at current revisions

“Pass” below means the former local trigger is rejected by current source and maintained checks. It does not close live risks or assume adjacent correctness. Historical reports/scripts remain intact; the [reproduction guide](repro/README.md) identifies frozen defect assertions versus executable replacements.

| Prior issue(s) | Current reassessment/evidence |
| --- | --- |
| CHR-001; AUD-003-001 | Public boot/permission/account reads fence obsolete resolution/rejection against newer events; wallet suite and maintained wallet repro pass. |
| CHR-002; AUD-003-005 | Both pause surfaces bind final authority and persist ambiguous conflict/reload/recovery; current pause suites/repro pass. |
| CHR-003; AUD-003-003 | Treasury transfer/withdraw authority and durable repeat/conflict exclusion hold in both surfaces' current tests/repro. New 001 is input editing, not recovery. |
| CHR-004; AUD-003-002 | Complete holdings pagination, malformed/partial rejection, unsafe/duplicate quantities and receipt validation traced through consumers; FA2/receipt/checklist tests pass. New 005 is dependent invalidation, not first-page enumeration. |
| CHR-005; AUD-003-011 | Public standby needs valid boolean storage; LIVE keeps pause checks and retires obsolete owners; countdown/lifecycle/stale-LIVE checks pass. |
| CHR-006; AUD-003-004 | Health rejects unknown/unsafe economics, incomplete/malformed balance pages and absent holders; current Health suite/repro pass. |
| CHR-007; AUD-003-007 | Exact string/bigint IDs survive Drops preview/build/send/status; unsafe numeric inputs reject. Runtime tests and actual ABI probe preserve a nat above JS safe-integer range. |
| AUD-003-006 | Dedicated Drops batch send binds authority around every chunk await; source/runtime invalidation tests pass. New 002 affects other pair callers. |
| AUD-003-008 | Provider health loss clears trusted params/version and revokes preview/readiness/send; current provider/invalidation replacements pass. |
| AUD-003-009 | Malformed HTTP-200 mapping pages reject unavailable; pair status remains verification-required. Pagination/status tests pass. |
| AUD-003-010 | One deadline bounds fetch/body/retry/late terminal results; maintained stalled-read repro and 19 deadline tests pass. |
| AUD-003-012 | Duplicate Exchange identities aggregate required reductions independent of order; current helper/consumer tests pass. |
| AUD-003-013 | Current Utility footer links resolve locally; maintained footer repro passes. |
| AUD-003-014 | Explicit Health refresh bypasses cached economics; failed refresh retires old success. Current Admin replacement passes. |
| AUD-003-015 | CANAAN CSV requires valid explicit ACID; missing/wrong cases reject. Current replacement passes; ticket alias 008 is not another finding. |
| AUD-003-016 | Equality no longer skips falsy projections; projection suite and maintained falsy repro pass. |
| AUD-003-017 | Pending recovery preserves/rejects independent source edits; current repro passes. New 003 is normal successful apply. |
| AUD-003-018 | Pending journal blocks READY/preview until explicit reconciliation; maintained pending-READY repro passes. |
| AUD-003-019 | CMS item/asset pagination rejects malformed/inconsistent/premature/failed evidence; library suite/repro pass. |
| AUD-003-020 | Standalone generator shares the outer input-rollback lock; concurrency/control repro passes. New 004 is serialization after coordination. |

The former eleven Public fixture failures were not observed in current broad suites; repaired fixtures run their transaction assertions. Old frozen harness dependency/binding errors are not new runtime defects. No prior issue entered the new checklist merely because it once existed.

## Verification performed

Windows PowerShell; Node `v22.16.0`, npm `10.4.0`; installed lockfile dependencies, no package upgrades. Windows file selections were enumerated explicitly where shell globbing would be ambiguous. Counts overlap across commands and are not a unique sum.

| Command / selection | Observed outcome |
| --- | --- |
| Outer top-level `shared/*.test.mjs`, `drops/js/*.test.mjs`, `exchange/js/*.test.mjs`: `node --test --experimental-vm-modules --experimental-test-isolation=none <enumerated files>` | 363 pass, zero failures/skips |
| Outer `npm run test:public-trade-ops` | 20 named fixtures + 19 deadline tests pass |
| Outer all `scripts/*.test.mjs`, `loaders/loader-architecture.test.mjs`, `assets/thumbs/scripts/thumbs.test.mjs`, `assets/webflow-cms/webflow-cms.test.mjs` with the same test flags | 87 pass, zero failures/skips |
| Outer `node audits/repro/AUD-004-config-suite.mjs` | Copied unchanged suites: 25 authoring + 19 transaction + 10 service + 53 projection + 1 watcher = 108 pass |
| Admin `npm run test:runtime` | 1570 pass, zero failures/skips |
| Admin `npm run check:thumbs`; `npm run test:thumbs` | Freshness pass; 16 tests pass |
| Twelve maintained Outer AUD-003 scripts with `node --experimental-vm-modules`; five Admin `tests/repro/AUD-003-*-repro.mjs` with Node | All pass; unadapted historical scripts excluded per existing guide |
| Two new Outer defect reproductions and three new Admin reproductions, commands above | Current failures and valid/unchanged controls demonstrated |
| Outer `node audits/repro/AUD-004-contract-abi-check.mjs` | Actual six Admin entry payloads and both Public trade handlers decode against promoted schema; exact huge nat retained |
| Outer `node audits/repro/AUD-004-contract-provenance-check.mjs` | Canonical/snapshot identity, mechanical fixture/target correspondence, frozen/promoted LF identity pass |
| Outer `python "docs/EA-XYZ Contract Audit/tests/verify-invariant-coverage.py"` | 26/26 invariants, 181/181 obligations, 13 mapped tests; mapping only |
| Outer `node scripts/shadownet-exchange-pairs.mjs` (default no-argument dry-run) | Fixed 44 pairs validated; no provider, signer, RPC or transaction |
| Outer `npm run build:pages:staging` | Six expected bundles built; existing Browserslist-age and large-bundle warnings |
| Outer `npm run verify:home-first-paint-build`; `npm run verify:drops-first-paint-build` | Staging and existing production checks pass; production not rebuilt |
| Admin `npm run build:clean` | Manifest/mirror guard/Parcel/prune/isolation pass; four dev chunks removed, eight production files verified |

Initial process/native-dependent runs hit sandbox `spawn EPERM`; approved access reruns passed. The disposable config runner initially required complete copied consumers and separate per-suite process isolation; corrected runs passed all 108 cases, including Windows deletion-pending behavior. Those were harness/environment failures, not application findings. An attempted provisioning `--dry-run` flag was rejected; its actual no-argument default then passed. No failing application assertion was waived.

Only Outer staging was freshly built. Verifiers' incidental inspection of existing production files does not attribute those bytes to this revision. No tracked generated-file drift resulted. No dev server, `pages:sanity`, remote CI/deployment, browser smoke, live wallet/FA2 operation or CMS mutation was run. Build success does not resolve the controlled filename failure.

## Contract, deployment and external limits

Direct source review followed each trade through per-element sender/pause/pair/all-six-term checks, grouped FA2 burns/redeems, destinations and events; plus pair count/removal/clear, admin changes, pause, rescue, burn-address and XTZ/default entries. Client validation does not replace direct-chain guards. Insufficient inventory/rejecting FA2 must reject the whole operation under [Michelson transactional execution](https://octez.tezos.com/docs/alpha/michelson.html); this was reasoned from source/protocol, not executed locally. Actual token balances/operators and [FA2 compliance](https://docs.tezos.com/architecture/tokens/FA2) remain dependencies. A sink transfer is not proof of irreversible supply destruction; successful calls cannot prove arbitrary no-op FA2 code honest.

Active legacy SmartPy was neither changed nor compiled. No compatible legacy toolchain was provided, no modern substitute used, no Michelson generated and no model run claimed as active-contract verification. Current canonical checkout SHA-256 `0BC3B735377B92F1E5635ED7789B7693018DECA2256FA79DEEBD952279FC8BD9` and promoted exact LF SHA-256 `FE850EA74A082D8E57EE47D0E3D70339088D1490128D93A86BDDDB338947F0A9` match frozen identities. Mechanical fixture correspondence and payload decoding establish repository/schema compatibility, not Michelson typechecking/execution or current deployed identity. Phase-7/8 certification, Phase-10 promotion and Phase-11 origination records remain historical evidence.

Configured Shadownet targets, Mainnet gates, Beacon values, loader roots, Admin surface targets and production-authoring isolation were traced. No live code/admin/storage/pause/inventory, RPC/TzKT/time accuracy, wallet transport, remote Webflow CMS/custom code, deployed bundle/version or hosting state was observed. No detailed site inspection occurred; a local site marker is not current site evidence. Node 20 CI/Linux/browser differences, real OS power-loss durability and process-crash recovery remain limitations beyond deterministic injection. External reads concerned identified reference interfaces on 2026-11-17, not configured live services; installed SDK source supplies version-specific local evidence.

No additional unresolved material local hypothesis is asserted. Historical countdown phase versus current pause was traced through separate checklist/pause consumers without inventing an oracle for another finding. Presentation-only unsafe IDs were separated from transaction identity; upstream filter accuracy and SDK transport/internal timing remain qualified external assumptions. Finding 002 instead uses the real controller's network-await interval with immediately resolved account reads.

Material findings prevented a provisional clean pass, so the conditional post-clean independent enumeration/final-clean step was not invoked. Remediation requires separate authorization and subsequent complete passes under `docs/correctness-review.md`. Production code/config/contracts and operational state remain untouched.
