# Correctness review coverage

## AUD-007 — completed application source pass (2026-11-23)

**COMPLETE SOURCE EXAMINATION — ONE CONFIRMED CONDITIONAL FINDING; NOT CLEAN.**
Outer runtime `9c678c7e92f247749a45b3f206823c53b9d5b55d`; independent Admin
runtime `3db964da8cc92b4aad500911c1be3dd65f03fa76`. Both were initially clean
on `ticket-AUD-007-full-correctness-review`. Working changes are investigation
documentation/evidence only. Node v22.16.0/npm 10.4.0; pinned Beacon 4.8.1,
Taquito 19.0.2/Parcel 2.16.4; no install. Public defaults to testnet/Shadownet;
Mainnet remains incomplete. SPLINTERED params are unchanged. Admin Drops/root
is legacy `KT1SZFfxFfRkbTcDUS17y1WVCKeudoLo8LX5`, Public Drops is dedicated
`KT1HMCqYqyP9fTDjzm8KAfyPhFn3tpmSW4kc`, Exchange is dedicated
`KT1Ue9es4biDzt528YhNctPGcNeqw9nDXnSv`. This implemented split does not establish
deployed identity or make Admin Drops writes affect Public Drops.

### Independent discovery and reconciliation

The candidate map was formed from current runtime registrations, DOM actions,
subscriptions/timers, direct contract entries, helper exports/callers, writers,
package commands and CI **before** opening historical findings or coverage.
Pre-reconciliation notes are retained in ignored `audits/work/AUD-007-discovery.md`.
Forward traces followed entries to effects; reverse searches started at Beacon
requests, FA2/XTZ effects, file/manifest/CMS writes and consequential publication;
boundary traces followed identities, amounts, generations, representations and
delivery ownership. Historical maps were consulted only afterward. No historical
workflow is intentionally excluded. Retained Public submissions, GitHub comparison,
signer provisioning and contract provenance are explicit boundaries below. These
were initially consolidated with their consumers/tooling, not dropped. Discovery
does not itself establish examination completion. The completed traces below
supersede the intermediate remainder notes; this is not a post-clean refresh.

| Workflow / boundaries and expected properties | Completed consequential source examination |
| --- | --- |
| Shell/Home/Utility/reveal: HTML -> host/environment loaders -> bundles/DOM; usable truthful visibility | All four entry modules, local shells' inline programs, root/environment wrapper siblings, first paint and reveal coordinator traced. Marquee/Utility SVG geometry has no financial authority. Missing regions, image/font timeout and failed imports release their owned visibility boundaries. Hosted CSS/Webflow behavior is external. |
| Public wallet: persisted/connect/event/mismatch/disconnect -> verified account -> page owners | Complete wallet module, mobile/button branches and complete balance pager traced. SDK 4.8.1 active-account/clear ordering reconciled with both consumers' pending/connected/disconnected generations, replay before boot, stale success/error and disconnect/reconnect. Transport and actual browser storage remain external. |
| Public holdings/CMS/mirrors/exclusions -> selectable exact identities | Full eligibility, metadata/presentation lookup, immutable CMS templates, default/clone/stamp, owned counts, selection and render/reveal branches traced against local shells. Network IDs remain payload identities; canonical keys locate presentation. **001 confirms an exclusion namespace violation before this resolution.** |
| Public Drops time/pause/inventory -> LIVE and transaction admission | Shared clock/time/countdown plus complete serial pause loop, abort/teardown/re-entry, standby/live recovery, supply recovery and final gates traced through buttons/flames/preview/visibility consumers. Unknown is distinct from zero/insufficient stock; schedule expiry does not authorize unpause or a trade. |
| Public Drops trade: selected balance -> approval/pair identity -> batch -> outcome/refresh | Entire handler and upstream selection traced through entry/final identity, account, amount, balance, LIVE, pause and complete redeem-inventory checks; exact approval/trade construction, reservation, rejection, confirmation and refresh/retry. Modal dismissal is not cancellation of an injected operation. |
| Public Exchange: economics/holdings -> bounded aggregate cart -> per-unit trade -> outcome | Entire module and local shell reconciled: edition producer/rounding, rows/tabs, scoped quantity controls, reset/actions, duplicate identities, 20/token and 50 total limits, exact matching pair/operations, captured outcomes and aggregate holdings reconciliation. Live CMS and wallet behavior remain external. |
| Public retained submissions: reserve/lock/hash/unknown -> attributed receipt -> balance admission | Complete shared journal/classifier/resolver/approval/deadline/confirmation/balance helpers and both consumers traced. Capacity/storage/lock failure blocks before send; ambiguous or missing hash remains retained; a matching receipt and complete balance reduction are separate authorities. Cross-origin/device enforcement is outside its browser-local contract. |
| Admin boot/network/wallet/identity: reload-boundary target and initiating authority | Bootstrap, surface switch, selector/reload, live targets, full wallet authority/SDK consumers, admin indicator, Exchange status and inert custody shim reconciled. Both initiating/controller and helper account awaits retain authority. Connected wallet is not on-chain admin proof. |
| Admin pause, both targets: current intent -> durable uncertain toggle -> attributed recovery | Full controller/helper/exclusion/settle/reconcile and display integration traced. Unknown blocks repeats; storage/admin/account/target and result ownership remain distinct. Exchange emits non-bubbling panel-local pause events; it cannot revoke global Drops authority through that path. |
| Admin treasury, both targets: exact recipient/assets/nats/mutez -> custody -> durable outcome | Full controllers/table/MAX/orchestrator/status/lifecycle/config/context/recovery/readers and chain-UI/catalog/local NFT/cache traced. Raw decimal rejection, safe nats, exact mutez, multiple-operation receipts, scope locks and reload recovery examined. Direct exported serializers/send helpers were traced independently of UI validation. |
| Admin pairs, both targets: mapping/set/edit/cleanup -> exact operations -> current publication | Entire controllers/targets, validators, Auto/debounced availability, set-panel views, modal session/content/widgets/shell, table and serializers traced. Stored token IDs survive amount-only edits; current fields feed exact payloads; cleanup validates the whole selection. Local metadata production does not provide the arbitrary delayed remote promise used by a rejected hypothesis. |
| Admin Drops normalize/build/translate -> initial/manual/Auto preview -> batch Send/status/countdown | Complete data/builder/audit, all initial/manual/Auto loaders, Send helpers/prefixes, controller/status/countdown and full views traced. Shared preview epoch retires loader success/rejection across modes; captured abort/phase/network/preview ownership fences old unpause reads. Cached intent and editable draft are distinct. **001 confirmed.** |
| Checklist: pause/pairs/supply + Health/CMS + GitHub -> truthful readiness | Complete module and rendered dots/parent preview reconciled: supply/unknown/depletion recomputation, epochs, pause/lifecycle, treasury/visibility, GitHub stable comparisons/throttle/in-flight ownership and polling/reset. GitHub equality is advisory local/remote content evidence, not hosted publication or chain readiness. |
| Health/imported CMS/economics/catalog -> complete truthful health and metadata | Entire active Health/CMS/parser/economics/store/catalog/chain-UI/cache/local NFT flow traced: complete pages and holder identities, unknown/zero/sink totals, forced freshness/in-flight snapshots, raw/normalized CSV and upload/restore/version ownership. Private dormant NFT remote recovery has no entry/caller; it is excluded from current workflows. |
| Local authoring/provider: session/preview/source version -> apply/readback/invalidation | Complete dev/production provider, transport, session/health/action controller, token helpers, form/view/preview and subscriber traced. Mode-specific actions, acknowledgement, edit/cancel/late responses and body deadlines examined; apply binds exact candidate/version/plan. Production isolation passes. Early busy diagnostic mismatch is dispositioned below. |
| Writer/projection/archive/recovery: supported CLI/service -> exact files/archive/journal | Complete schema/projector/claim lock/writer/recovery/archive/service HTTP+API/watcher/generator/launchers/status CLI traced. Cross-process preflight cannot bypass the writer's under-lock version/equality/journal checks. Real writer admission for 001 passes in a disposable copy. AUD-005-001 remains accepted unsupported external-editor concurrency. |
| Direct escrow: all public/admin/default entries -> exact custody/XTZ/storage/events | All eight active entrypoints/helpers/types/compilation target traced: sender and six stored trade terms for every item, repeated IDs, positive terms, grouped FA2 transfers, downstream failure atomicity, set/update/cleanup cardinality, pause, admin rescue/XTZ/default and event layouts. MockFA2 is test-only and not proof of actual FA2 authorization/honesty. |
| Contract provenance: canonical -> certified/promoted artifact -> originated identity | Canonical/snapshot/mechanical fixture/target, manifest/certification/freeze/promotion/deployment identity and interface reconciled; all 31 freeze checkout/blob identities pass, as do current payload decoders. Phase-11 observations are dated historical evidence, not current chain observations or certification of the legacy Admin root. No compilation/typecheck/live query. |
| Assets/CMS: input/backfill/manifest/rollback; exported CMS/image/upload/reconcile | Entire thumbnail input/backfill/manifest/capability-lock and exported Webflow CMS library traced, including no-current-caller exports: exclusive allocation, partial writes, ownership/rollback, complete pagination, explicit mutation ambiguity/no blind retry, upload/readback/equivalence/redaction. Filename JS escaping and URL encoding are distinct. Current generated manifest passes build check. |
| Build/delivery/dev/tooling/signer CLI: source/environment -> emitted identity; explicit chain admission | Packages/Pages CI, graph and first-paint verifiers, wrappers, manifest generator, exporter, port/Parcel/dev/sanity/harness/optimizers and Admin guard/pruner/isolation traced. Signer CLI's explicit execution, provider/chain/admin/ABI/empty-map and exact payload/readback gates examined. Required staging/Admin builds pass in bounded copies; no dev server, signer execution, deploy or publication. |

### Evidence and verification checkpoint

[AUD-007-001](AUD-007-findings.md) is a confirmed conditional P2: accepted canonical
HEN exclusion `0` removes unrelated canonical `94684` / Shadownet `0` in both
consumers. The real EDIT writer publishes it in a disposable copy; controls with
no exclusions and intentional exclusion `94684` pass. Current committed exclusion
`141634` is unaffected. No remediation was made. Historical dispositions have been
reconciled against the current producers/consumers in the completed rows above.
Admin countdown launched phase is distinct from current pause
authority (`paused-live` is explicit); that observation alone is not a defect.
The loopback service's `readWriterState` checks `owned`/`contended` for busy, whereas
another running process is reported as `active` by the projector: a source-observed
mismatch, **not a material finding in this pass**. Before a journal exists it can
misreport early READY/allow preview, but Apply still acquires the bounded shared
claim and checks journals, exact source version and equality under ownership.
Existing journals independently block authoring; waiting success or explicit
failure/new preview does not demonstrate lost edits or false write completion.
The [findings](AUD-007-findings.md) retain this diagnostic observation and other
challenged hypotheses separately from the confirmed defect.

### Adversarial depth and historical reconciliation

Expected properties came from project intent, exact financial/identity rules and
identified interfaces, rather than the historical tests. The full traces challenged
missing/malformed/negative/oversized values, exact decimal IDs beyond safe Numbers,
zero versus unknown, duplicated identities and summed quantities, independent pair
IDs versus cardinality, every batch item's terms, and failed downstream effects.
For each write family, examination followed authority at the actual request after
every account/permission/read await, serialized target/recipient/assets/amounts,
then confirmation attribution and refreshed evidence separately. A valid earlier
read or applied approval cannot authorize an obsolete or failed trade.

Async examination covered replacement success **and rejection**, current/obsolete
errors, resets, visibility/page re-entry, disconnect/reconnect, polling ownership,
cancelled reads that ignore abort, cached/generated/rendered state separation,
late response bodies, partial batches, retries and interrupted recovery. Finite
configuration/asset writers were traced through ownership, exact staging/readback,
rollback and unresolved journals/locks. External FA2 rejection causes whole-operation
rollback under Tezos semantics; a correctly typed malicious/no-op FA2 is still an
external trust boundary, not proof of burn or conservation. Cosmetic SVG geometry,
marquee motion and sizing do not authorize financial effects; their visibility and
startup interactions were included. Local shell parsing found repeated exported
form-control IDs in Public; current consequential quantity/selection code is
row/element scoped, so duplicate IDs alone are not an actionable failure here.

The final reverse/boundary sweep revisited all wallet request sites, file replacement,
manifest/CMS publication, durable browser records and readiness/LIVE/success sinks.
It reconciled API facades, direct escrow/helper calls, startup/background/operator
entries, provider/builder/view consumers and package/CI commands. No unexplained
consequential current entry or partially examined workflow remains within the
declared source scope. This is the completed original pass, not a new methodology
or a clean-result re-enumeration. No arbitrary delayed metadata producer or
unsupported concurrent external editor was invented to create a finding.

| Historical paths reconsidered after independent discovery | Current source/evidence on the exact AUD-007 revisions |
| --- | --- |
| Seven CHR known issues; AUD-002-001/002/003/007/008; AUD-003-001/002/010/011/012/013 | Generation-owned wallet clearing; complete pagers; reservation/storage/quantity bounds; continuing verified pause, full inventory and owned refresh; bounded attributed confirmation and aggregate duplicate reduction; four-shell navigation. Current Public/time/delivery suites and trade fixtures pass. |
| AUD-002-005/006/011; AUD-003-006/007/009; AUD-004-002 | Compatibility, exact string IDs, stored modal identity, malformed-page rejection, full-term pair identity and captured write authority traced through direct helpers and callers. New 001 concerns exclusion namespaces, not rounding or a bypass of the translation guard. |
| AUD-003-003/005; AUD-004-001 | Both Treasury/Pause scopes persist ambiguous outcomes and exclude repeats; complete receipt evidence, authority and exact raw withdrawal conversion remain. No operation is resent to resolve uncertainty. |
| AUD-003-004/014/015; AUD-004-005; AUD-005-002/004 | Complete holder/economics reads, explicit force/unknown, raw CANAAN ACID validation, supply-dependent recomputation, request-scoped status and full configured redemption coverage remain in current producers/consumers. Maintained Admin/Public cases pass. |
| AUD-002-004; AUD-003-008/016/017/018; AUD-004-003; AUD-005-001/003 | Strict three-copy equality, guarded projection, shared writer claim, journal/recovery base/target checks, provider invalidation and full-response deadline remain. AUD-005-001 is the accepted unsupported external-edit concurrency limitation; no new supported-path lost-edit evidence. |
| AUD-002-009/010; AUD-003-019/020; AUD-004-004; AUD-005-005 | Complete exported CMS pagination/explicit write ambiguity; thumbnail/manifest shared ownership, rollback and filename JS/URL identity traced. Asset/CMS and 37 Admin generator tests pass. |
| AUD-006-001/002; previous checklist 0.1/0.2 | Current initial/manual/Auto shared preview epoch fences both success and rejection; unpause continuation checks captured abort identity plus poll/phase/network/preview epochs. Full loader/countdown/view interactions re-examined; maintained ownership tests pass within the 2,078-test Admin suite. These original paths no longer supply unresolved implementation tickets. |

Historical reports, reproductions and revision-specific claims remain unchanged.
The canonical known-issues document still accurately describes the original seven
remediations; no unrelated documentation is rewritten. Only the completed pass's
one actionable finding enters the replacement remediation checklist. Accepted
external-edit concurrency, operator/admin/FA2 trust, incomplete Mainnet configuration
and unverified live integration remain explicit boundaries, not invented fix tickets.

| Actual command (Outer unless noted) | Outcome |
| --- | --- |
| `node audits/repro/AUD-007-exclusion-identity-repro.mjs`; `node --check audits/repro/AUD-007-exclusion-identity-repro.mjs` | Full consumer/writer reproduction passed twice with both controls; syntax check passed. |
| `node --test --experimental-vm-modules --experimental-test-isolation=none shared/beacon-setup.test.mjs shared/fa2-balances.test.mjs shared/public-trade-pairs.test.mjs shared/public-trade-outcomes.test.mjs shared/public-confirmation-deadline.test.mjs shared/hen-identity.test.mjs drops/js/burn-quantity.test.mjs drops/js/wallet-rendering.test.mjs drops/js/trade-lifecycle.test.mjs exchange/js/exchange-wallet.test.mjs` | 308 pass, 0 fail; `audits/work/AUD-007-public-tests.log`. |
| Admin `npm run test:runtime` | 2,078 pass, 0 fail; `audits/work/AUD-007-admin-runtime.log`. |
| `node shared/public-trade-ops.fixtures.mjs` | 20 retained-confirmation, approval and balance-reduction checks pass. |
| `node --test --experimental-test-isolation=none scripts/parcel-source-map-sources.test.mjs scripts/mainnet-runbook.test.mjs` | 4 pass, 0 fail (including source-map test-file execution). |
| Admin `npm run test:thumbs` | 37 pass, 0 fail; isolated temporary fixtures, approved child-process permission. |
| `node --test --experimental-test-isolation=none assets/thumbs/scripts/thumbs.test.mjs assets/webflow-cms/webflow-cms.test.mjs` | 66 pass, 0 fail, with approved child-process permission; disposable assets/mocked Webflow only. `audits/work/AUD-007-assets-tests.log`. |
| `node audits/repro/AUD-004-config-suite.mjs` | Five disposable suites pass: 25 authoring, 19 transaction, 10 service, 90 projection, 1 watcher; projection additionally reports 54 + 1 inner checks. Initial sandbox spawn EPERM; approved retry passed. `audits/work/AUD-007-config-tests.log`. |
| `node --test --experimental-test-isolation=none shared/drop-time.test.mjs shared/drop-countdown.test.mjs drops/js/countdown.test.mjs drops/js/countdown-lifecycle.test.mjs drops/js/drop-compatibility.test.mjs drops/js/token-rendering.test.mjs drops/js/reveal-coordinator.test.mjs shared/chain-registry.test.mjs loaders/loader-architecture.test.mjs scripts/verify-pages-loader-artifacts.test.mjs scripts/public-navigation.test.mjs scripts/shadownet-exchange-pairs.test.mjs` | 84 pass, 0 fail; `audits/work/AUD-007-time-delivery-tests.log`. |
| `node audits/repro/AUD-005-contract-abi-check.mjs` | Six current Admin entry families and both Public trade payloads decode. No compile/typecheck/execution. |
| `node audits/repro/AUD-004-contract-provenance-check.mjs` | Canonical/snapshot/mechanical-target/frozen-promoted identities pass. Canonical SHA-256 `0BC3B735377B92F1E5635ED7789B7693018DECA2256FA79DEEBD952279FC8BD9`; promoted `FE850EA74A082D8E57EE47D0E3D70339088D1490128D93A86BDDDB338947F0A9`. |
| Inline `node --input-type=module` SHA-256 check: parse all 31 certified rows in `PHASE-8-FREEZE-RECORD.md`; hash each checkout file and `git show HEAD:<path>` bytes | All 31 checkout and 31 HEAD-blob hashes match their respective recorded values. Initial sandbox Git-child spawn EPERM; approved read-only retry passed. No compilation/live query. |
| `npm run build:pages:staging` and Admin `npm run build:clean`, in a disposable `audits/work/AUD-007-build-*` copy | Both pass; six staging entry artifacts; Admin manifest/check/sync/guard and production prune/isolation pass. Logs: `AUD-007-outer-build.log`, `AUD-007-admin-build.log`. Existing per-repo installed dependencies were junction-linked read-only inputs; source/package/lockfiles copied, real journals/locks/archive excluded. Both junctions and the verified bounded fixture directory were removed afterward. No real generated files/build outputs changed. |

No browser, real wallet transport/signing, chain transaction, live RPC/indexer/time,
Webflow/CMS, published hosting/loader or deployed-contract verification occurred.
Authoritative TZIP-12 and Tezos operation semantics were consulted 2026-11-23 (links
in findings); actual FA2 honesty/behavior/finality and live identity remain unverified.
Legacy SmartPy execution is unavailable. Fresh Node-20/Linux installation, production
Outer build, combined staging/prod first-paint artifact checks and actual CI assembly
remain unperformed. Successful copied Windows builds are not those checks; stale
Browserslist-data and bundle-size warnings remain, without dependency updates.
Schema, keys, addresses/networks,
generated files, DOM/events, wallet/transaction behavior, certification and real
operational recovery state remain unchanged. No production remediation occurred.
The prescribed remediation checklist was finalized only after the complete source
pass, consolidating both affected consumers into one ticket; `audits/report.md` is
not created. One material finding remains, so there is no provisional clean verdict,
clean-result coverage refresh or final clean claim. No required source examination
remains; the external/unexecuted verification boundaries above constrain the result.

## AUD-006 — completed source examination (2026-11-23)

**COMPLETE APPLICATION SOURCE PASS — TWO CONFIRMED FINDINGS; NOT CLEAN.**
This continues the November 19 investigation, including its independently
discovered map and evidence. It does not restart enumeration or discard that
checkpoint. All twenty mapped workflows have now received the source audit-pass
procedure; no local consequential workflow remains partially examined. External
integration execution and legacy contract execution remain unverified as stated
below. Completion of source examination is not a deployment or clean verdict.

| Repository / existing branch | Exact reviewed and tested runtime revision |
| --- | --- |
| Outer / `ticket-AUD-006-full-correctness-review` | `5b465deb2e3ffc393a400458cff26725b1a2f612` |
| Admin / `ticket-AUD-006-full-correctness-review` | `3fda8b857d3f3374a49ff4d3e9f7273e96213bca` |

Runtime revisions, lockfiles, installed toolchain, network/address configuration
and scope are unchanged from the checkpoint below. The continuation began with
only the recorded coverage/README/findings changes and two Admin repros. Reviewed
working changes now comprise Outer audit documentation/checklist and four Admin
evidence runners. The two original runners are preserved; the loader runner adds
reverse-order cases. No runtime, schema, generated source/mirror, operational
journal/archive/lock, contract or deployment change was made.

Target identity stays explicit: current Admin Drops/root resolves the documented
legacy root `KT1SZFfxFfRkbTcDUS17y1WVCKeudoLo8LX5`; Public Drops resolves dedicated
`KT1HMCqYqyP9fTDjzm8KAfyPhFn3tpmSW4kc`. Exchange uses its dedicated configured
surface. No assumption is made that setting Admin Drops pairs changes Public
Drops storage. The current root/surface split is an implemented, documented
configuration boundary; the historical Phase-11 verification of the dedicated
instances does not certify the legacy root or its current ABI/storage.

Scope remains the implemented application, including direct contract and operator
entries, shared infrastructure, Public, Admin, assets and delivery. Cosmetic
effects without consequential visibility, future architecture proposals and
third-party internals beyond the identified interfaces remain excluded. Current
source and independently grounded authority/identity/conservation/recovery
properties supplied the oracle; old audit dispositions and passing suites did
not substitute for examination. The original forward/reverse/boundary discovery
and reconciliation are retained below. This is the completion of that same pass,
not the independent post-clean refresh required for a final clean claim: findings
remain, so no provisional clean result or post-clean refresh is claimed.

### Completed behavioral examination

The original map below retains the workflow boundaries, intended properties and
core source locations. This table supersedes its **examination status** column
and unfinished-work list. “Examined” means complete local consequential source
tracing under the stated external assumptions, not that every integration ran.

| Workflow | Completion of forward, reverse and boundary examination |
| --- | --- |
| W01 Arrival/navigation/reveal/Utility | **Examined.** All four local shells' app entries/inline scripts, shared first paint, reveal barrier, navigation and Utility startup traced. Independent early/application imports settle failure separately; inactive/unconfigured/missing-region paths release pending state. Utility SVG and marquee work has no financial authority. Hosted Webflow/CSS behavior is external. |
| W02 Public wallet | **Examined.** Initial, permission, SDK event, same-account, replacement, mismatch, disconnect and mobile entries through verified projections/final account reads. Stale success/rejection/clear completion cannot authorize a replacement. Transport and signing remain external. |
| W03 Holdings/identity/rendering | **Examined.** Complete balance pager through both consumers, canonical CMS snapshots, HEN mirror/exclusions, row cloning/stamping, selection restoration, missing metadata and unknown/zero states. Presentation names/images do not select operation identities; current wallet generations gate publication and exact selected balance gates submission. |
| W04 Drops schedule/pause/inventory | **Examined.** Initial/inactive/config-error, PRE/time-unavailable/standby/LIVE, pause/recovery, visibility/page lifecycle and full redemption thresholds traced through countdown, buttons, flames and final trade gates. Delayed/failed provider data does not establish current readiness. External time/indexer accuracy remains assumed. |
| W05 Public Drops trade | **Examined.** Each selection path through verified balance, approval fallback, unique six-term pair resolution, exact payload, final account/selection/time/pause/inventory check, retained submission, confirmation and balance refresh. Preflight liveness qualification below; no wallet execution. |
| W06 Public Exchange | **Examined.** Startup delay, all panes/tabs, quantity options, clear/remove/reset/cart rendering, duplicate identities, reward totals, per-unit expansion, final cart/account checks and retained receipt/balance reduction. Bounds precede allocation; malformed economics fail the authoritative cart gate. |
| W07 Retained Public submissions | **Examined.** Reservation/hash/unknown/rejection, scoped durable store, lock, retry, deadline, receipt attribution and final balance admission traced from both pages. Reload does not silently turn an ambiguous submitted operation into a fresh trade. Browser locking/storage and real receipts remain external. |
| W08 Admin boot/network/authority | **Examined.** Surface wiring, persisted selector/full reload, wallet SDK event consumers, immutable target capture, admin indicator and read-only Exchange status. Indicator unknown is distinct from verified admin; chain authority remains decisive. Read-only refresh controls serialize supported clicks. |
| W09 Pause/recovery | **Examined.** Both surface controllers through helper, final authority/target checks, persisted uncertainty, conflict/reload/recovery and refreshed pause publication. Rejected-before-request and ambiguous-after-request branches remain distinct. |
| W10 Treasury | **Examined.** Completed orchestrator/config/context/lifecycle/status/bridge and all button/event consumers around previously traced transfer/withdraw/MAX/table/recovery. Exact recipient, token nat and decimal mutez survive helpers; changing account/target/balance context retires pending authority. Unknown receipts retain recovery exclusion. |
| W11 Pairs | **Examined.** Both surfaces' table/create/edit/cleanup, set-panel view/widgets, modal shell/content/widgets/validators/context, custom/local token choices, locked Exchange redemption, status and serializers. Stored IDs survive amount-only edits and absent catalogs. Deferred local-metadata challenge is qualified below; it is not a current supported failure. |
| W12 Admin Drops | **Examined, findings 001/002 remain.** Full normalizer/translation audit/build/load/view/status/countdown/send graph, manual/Auto mutual ordering, reset/provider/network/phase retirement and error branches traced. Direct loader mutation escapes scoped status guards; cancelled unpause completion escapes same-phase ownership. Clicked cached-send intent and draft-input behavior were characterized separately. |
| W13 Checklist/Health/catalog | **Examined.** Completed GitHub comparison/cache/poll/epoch, Health summary mirrors, CSV upload/restore, token economics, full catalog enumeration, NFT/title/thumbnail and persistent cache producers. Known zero differs from unavailable evidence; failed supply recomputes dependents. Current NFT titles/previews are local-only; diagnostic cache is not transaction identity authority. |
| W14 Local authoring/provider | **Examined.** Form/time/token choices, disabled-row preservation, state/view/preview, validation/apply/readback and provider/subscriber invalidation traced. Edit invalidates reviewed candidate/preview; service CAS and consumed preview token govern apply. Production removes the development capability. |
| W15 Writer/projection/archive/recovery | **Examined.** Completed strict active/inactive/canonical schema, deterministic serialization, archive path/hash/schema/exclusive publication/collision/readback, watcher drain and CLI dispatch around full writer/projector/recovery/lock traces. Supported writers share the claim; pending/diverged state blocks projection/READY. External editor concurrency remains the accepted AUD-005-001 limitation. |
| W16 Direct contracts | **Examined source; execution unverified.** Every active escrow entry and meaningful validation/effect/failure branch traced, including all trade terms inside each loop, grouped/repeated identities, later-item and downstream failure, pair cardinality, admin custody/XTZ and default. Typed FA2 acceptance alone cannot prove movement or irreversible burning. |
| W17 Build/delivery/dev | **Examined.** Completed all root/environment wrappers, artifact verifier, first-paint verifiers, dev port/Parcel/harness/sanity scripts and CI assembly. Main owns permanent/prod loaders, staging owns staging loaders; byte provenance and referenced bundles are checked before artifact upload. Admin mirror/manifest/prune/isolation gates traced. Actual remote assembly/hosting and fresh Linux/Node-20 install remain unverified. |
| W18 Assets/CMS | **Examined.** Completed process-local manifest capability/ownership/release, standalone generator, input/backfill allocation/rollback, static optimizers and complete exported Webflow CMS library. Pagination validates completeness; writes are not blindly retried; transport/body/upload ambiguity remains explicit; image identity/content/readback checks are separate. No live CMS mutation or read was made. |
| W19 Pair provisioning CLI | **Examined.** Fixed payload/default dry-run, explicit execute admission, chain/admin/entrypoint/storage/empty-map checks, exact packing and complete readback. No signer/provider/execute invocation in this review. |
| W20 Contract provenance | **Examined local correspondence.** Source/snapshot/mechanical fixture/target, Phase 7/8 certification/freeze, Phase 10 promotion and Phase 11 deployment record traced. All 31 freeze-table checkout/blob identities rechecked, alongside canonical/promoted checks. Historical block-pinned observations are not new live verification. |

### Consequential branch and ordering review

- Public trades: entry/configuration and complete holdings; absent/ambiguous or
  mismatched pairs; approval present/absent/read error; exact per-trade terms and
  whole cart/batch limits; final identity/cart/pause/inventory; request rejection,
  no hash/unknown, applied/failed/unconfirmed, later refresh failure and retry.
  Approval and trade effects share the submitted operation group; source/protocol
  rollback reasoning is distinct from actually running the configured FA2.
  Preflight account/approval/pair reads have no application-wide deadline and may
  leave processing pending until provider settlement or reload. They precede the
  durable request reservation; reload cannot itself duplicate a request that was
  never made. If a held read later settles, final current-context checks still
  apply. The bounded confirmation deadline does not cover these preflight reads.
- Privileged operations: all six helper entry families and both escrow surfaces,
  initiating account/target through availability/permission/account awaits,
  exact nat/decimal conversion and recipient, each batch's request/confirmation,
  stale publication, no-hash/hash uncertainty and supported recovery. Direct
  contract entry bypasses UI checks but retains on-chain admin/sender/six-term
  validation. No admin setter exists; constructor identity is a deployment trust
  boundary. A failed later trade or FA2 call is not a successful partial trade.
- Admin Drops: initial/manual/Auto loaders, every asynchronous overlap/build/
  metadata/status/countdown continuation, success/rejection and reset/provider/
  network/phase replacements. Manual-to-manual and Auto-to-Auto use their own
  epochs; cross-kind supersession and rejected Auto are the 001 gap. Phase/network
  reset fences unpause; same-phase abort without a new poll epoch is 002. Pending
  sends retain per-batch receipts and stop after authoritative preview/config/
  account invalidation. Pure draft edits are discussed in findings, not asserted
  to be revocation without an independent cancellation requirement.
- Configuration/asset writers: admission/CAS, supported lock acquisition/reuse,
  staging/replacement/final equality, partial failure/rollback/reconciliation,
  archive-before-deactivation and collision/readback, watcher coalescing, manifest
  generator versus import rollback, and stale/unknown provider publication.
  Real external edits during apply remain unsupported. OS crash/power-loss and
  noncooperating external writers are not proved safe by disposable fixtures.

Cross-products without reachable effects were not invented: custom modal initial
metadata has no pending I/O in the current producer; changing Admin networks
normally reloads the app; catalog/title/image failures cannot themselves choose
financial terms; read-only Health diagnostics do not mint or transfer assets.
Newly exposed paths were pursued through their real producers and consumers,
including the two controlled but non-finding cases described in the findings.

### Historical reconciliation and actual continuation verification

All seven `docs/known-issues.md` paths, eleven AUD-002 findings, twenty AUD-003
findings (including the canonical 015 / ticket alias 008 distinction), five
AUD-004 findings and five AUD-005 findings were reassessed against current source.
The findings document records their current path dispositions. No prior finding
was dropped because an old report called it fixed. No additional actionable old
issue remains beyond current 001/002; AUD-005-001 remains an accepted unsupported
external-concurrency limitation, with no new supported-writer counterexample.

Continuation checks on November 23 used the exact revisions above. Logs are
ignored `audits/work/AUD-006-continuation-*.log`; commands did not mutate real
operational state. No test count is presented as proof of source examination.

| Actual command / selection | Result |
| --- | --- |
| Outer explicit top-level `shared`, `drops/js`, `exchange/js`, `scripts`, `loaders` `*.test.mjs`, plus Outer thumbnail and CMS suites; `node --test --experimental-vm-modules --experimental-test-isolation=none <enumerated paths>` | 462 selected: 452 pass; ten thumbnail child-process cases blocked at sandbox `spawn EPERM` |
| Permitted `node --test --experimental-test-isolation=none assets/thumbs/scripts/thumbs.test.mjs` | 27/27 pass, including all ten blocked cases |
| Admin `npm run test:runtime`; `npm run test:thumbs` | 1,961/1,961 and 37/37 pass |
| Permitted Outer `node audits/repro/AUD-004-config-suite.mjs` | Disposable unchanged suites: 25 authoring + 19 transaction + 10 service + 90 projection + 1 watcher = 145 pass |
| Admin original `AUD-006-drop-auto-error-repro.mjs` and `AUD-006-unpause-owner-repro.mjs` | Defects and positive controls reproduce; loader adds older-manual/newer-Auto success/rejection evidence |
| Admin `AUD-006-send-input-repro.mjs`; `AUD-006-modal-content-repro.mjs` | Characterization/control and injected-delay/control pass; neither is counted as a confirmed new defect |
| Outer `npm run test:public-trade-ops` | 20 named fixtures and 19 deadline tests pass; overlaps broad selection |
| Outer `node audits/repro/AUD-005-contract-abi-check.mjs`; `node audits/repro/AUD-004-contract-provenance-check.mjs` | Six Admin and both Public builders decode; canonical/snapshot/mechanical-target and frozen/promoted identities pass |
| `python "docs/EA-XYZ Contract Audit/tests/verify-invariant-coverage.py"`; read-only Python SHA-256 comparison of Phase-8 table to checkout and `git show HEAD:<path>` | 26/26 invariants, 181/181 obligations, 13 mapped tests; all 31 certified file checkout/blob pairs match. Mapping/identity only, not legacy execution |
| Outer `npm run build:pages:staging`; Admin `npm run build:clean` | Both pass; six Public bundles; Admin removes four development chunks and verifies eight production files. Existing Browserslist-age/size warnings |
| Outer `npm run verify:home-first-paint-build`; `npm run verify:drops-first-paint-build` | Both pass; staging freshly rebuilt, production output pre-existing |

The November 19 inert default 44-pair provisioning check remains applicable to
unchanged source; it was not repeated as live verification. Historical defect
scripts that assert pre-remediation failures were not repurposed as fix gates.
Both repositories' final diffs/status/whitespace and separate `ticket:diff`
exports are checked for the compact handoff. Indexes/HEADs/branches are preserved.

### Result and unverified boundaries

Completed: 20/20 local behavioral workflows examined, zero unfinished local
source rows. Confirmed: AUD-006-001 and AUD-006-002, both P2 and unremediated.
`audits/remediation-checklist.md` now contains only their actionable loader and
countdown tickets in the prescribed format. Historical findings/checkpoints are
preserved. No `audits/report.md`, final public report or clean claim is produced.

Unverified: current browser/Webflow DOM, custom code, CMS and hosted CSS/assets;
Beacon transport/signing and real browser storage/Web Locks; RPC/TzKT accuracy,
consistency/finality/reorg and time-provider accuracy; configured FA2 ledger,
operator/transfer behavior; present deployed escrow code/storage/admin/sink,
inventory and receipts; remote Pages/main/staging artifact identity and hosting.
No exact live Webflow site was inspected. No wallet/chain transaction, deployment,
dev/sanity server or manual browser smoke; no fresh dependency install, production
rebuild or Linux/Node-20 CI; no OS crash-durability campaign. Compatible legacy
SmartPy compile/scenario/native protocol checks were not run; historical
certification is identified historical evidence, not freshly executed assurance.

---

The following November 19 checkpoint is retained verbatim as partial-pass
history; the November 23 section above supersedes its current-status claims.

## AUD-006 — partial investigation (2026-11-19)

**PARTIAL — FULL APPLICATION EXAMINATION UNFINISHED. Two confirmed Admin
findings. No completed or clean pass is claimed.**
[Working findings and controls](AUD-006-findings.md) describe the evidence.
This section supersedes the current-review context only; historical sections and
their revision-specific claims remain intact. `audits/remediation-checklist.md`
is unchanged: the methodology's final checklist is conditional on completing the
full pass, and must not imply that this partial examination is complete.

| Repository | Exact runtime source reviewed and tested |
| --- | --- |
| Outer, including contracts and shared tooling | `5b465deb2e3ffc393a400458cff26725b1a2f612` |
| Independent Admin | `3fda8b857d3f3374a49ff4d3e9f7273e96213bca` |

Both verified branches are `ticket-AUD-006-full-correctness-review`; both initial
worktrees and indexes were clean. Runtime source stayed at these revisions.
Reviewed working changes are this section, `AUD-006-findings.md`, the evidence
README and two Admin `tests/repro/AUD-006-*.mjs` runners. No runtime remediation,
schema/address/network changes, new audit infrastructure or final public report.

### Scope, assumptions and independent discovery

The intended scope is the entire consequential implemented application: Public,
Admin, direct contract calls, shared configuration/writers, assets and
build/delivery. Exclusions are cosmetic effects without consequential visibility,
unimplemented proposals, and third-party internals beyond identified interfaces;
external effects themselves remain included as boundaries. Scope was **not**
silently narrowed to the examined rows below.

Before opening historical coverage/findings, source discovery read runtime page
and Admin registrations, wallet events, operation builders, contract entrypoints,
package commands, writer/service/projector entries, registry and Pages CI. An
18-group candidate behavioral map was recorded in ignored
`audits/work/AUD-006-discovery.md`. Forward tracing began at user/operator events,
startup/background work and direct-chain/CLI entries. Reverse tracing followed
wallet requests, FA2/XTZ effects, privileged/configuration writes and
balance/readiness/LIVE/outcome publications. Boundary tracing followed
account/network generations, CMS and mirror identities through cart/Micheline to
contract effects, source/projections/mirror, recovery state and artifact delivery.
Only after that candidate map were coverage and prior findings consulted.

Reconciliation retained the earlier W01–W20 behavioral distinctions, explicitly
separating provisioning and contract provenance from general delivery and
splitting public submission from trade construction. No earlier row was dropped
as already fixed. The table below is the current source-discovered map, **not a
claim that each workflow has received the complete audit-pass procedure**.

- Windows PowerShell, Node `v22.16.0`, npm `10.4.0`, installed dependencies; no
  install or upgrade. Beacon SDK 4.8.1/core+dapp 4.8.0, Taquito 19.0.2,
  Parcel 2.16.4, Sharp 0.35.3. Outer lockfile SHA-256
  `D0083CFF4CC978C52830D78062E2A4DE9D7D5C3C9C490AE773ABB664B83EC935`;
  Admin `8A79D21B6E5F50FBAE2E972CE8B665836E8151FF49D2865B83F7E1BEE334C3EB`.
- `NETWORK` unset; Public `testnet` means Shadownet. Admin retains its persisted
  selector/reload boundary. RPC `https://rpc.tzkt.io/shadownet`, indexer
  `https://api.shadownet.tzkt.io`; Drops
  `KT1HMCqYqyP9fTDjzm8KAfyPhFn3tpmSW4kc`, Exchange
  `KT1Ue9es4biDzt528YhNctPGcNeqw9nDXnSv`, legacy
  `KT1SZFfxFfRkbTcDUS17y1WVCKeudoLo8LX5`. Mainnet remains incomplete behind
  configuration gates. These are configured source values, not live observations.
- Current scheduled SPLINTERED source: mirror `testnet`, October 9 2026 3 PM
  seasonal EST zone, HEN burn 1 excluding canonical `141634`, CANAAN `29`
  redeem 1, planned supply 10. Tests use controlled alternative data and clocks.
- Reference reads on 2026-11-19: [Octez failure semantics](https://octez.tezos.com/docs/active/michelson.html#failures)
  and the [raw FA2 specification](https://gitlab.com/tezos/tzip/-/raw/master/proposals/tzip-12/tzip-12.md).
  These ground interface assumptions, not configured-provider behavior or deployed
  identity. No wallet, chain, CMS, Webflow or hosting mutation was performed.

### Behavioral coverage and examination status

Expected properties below derive independently from project intent, exact asset
identity/conservation, current authority, recovery and truthful evidence. Existing
tests were challenged with new ordered rejection/cancellation cases. Passing
tests are supporting seam evidence, not proof that a partial row is examined.

| ID / workflow and consequential source boundaries | Intended properties | Examination status at handoff |
| --- | --- | --- |
| W01 Arrival/navigation/reveal/Utility: shells → `webflow/*`, `shared/public-first-paint.js`, `drops/js/reveal-coordinator.js`, Utility entry | Font/image/load failures settle visibility; usable controls retain identity and local navigation | **Partial.** Shared reveal/Utility and loader registrations read; startup/navigation/reveal fixtures pass. Full shell/custom-code and all arrival alternatives not re-examined; live Webflow unverified. |
| W02 Public wallet: `shared/beacon-setup.js` → page subscribers and SDK | Only verified current network/account observations authorize state and actions; obsolete reads cannot clear replacements | **Local lifecycle examined.** Boot, account events, permission/connect deduplication, mismatch clearing, disconnect and mobile controls traced; current regressions pass. SDK account/request implementation inspected. Transport/signing and SDK asynchronous internals beyond the inspected seam remain external/unverified. |
| W03 Complete holdings/identity: `shared/tzkt-fa2-balances.js` → Drops rendering and Exchange verified quantities | Complete exact balances; unknown differs from zero; canonical CMS IDs/exclusions map to the intended wallet identity | **Core examination done; broader workflow partial.** Pager, cursor/caps, malformed/duplicate/unsafe values and both main consumers traced. Current FA2/wallet/identity suites pass. Full metadata/template and alternate rendering consumers still need examination. |
| W04 Drops time/pause/inventory/LIVE: shared time/countdown → `drops/js/events.js` polling/button guards | Trusted schedule plus current unpause and sufficient full redemption inventory before actionable trade | **Partial.** UTC uncertainty/DST, lifecycle retirement, pause fetch/body deadlines, continuing pause poll, inventory initial/recovery polling and final inventory gates examined. Full remaining UI/state cross-products not completed; provider truth unverified. |
| W05 Drops approval/trade: selected row → shared pair lookup/approval → request → escrow | Exact burn/redeem identities and six terms; current selected balance/wallet at request; no partial cart send | **Core high-impact construction traced; workflow partial.** One-trade payload, approval fallback, full-term uniqueness, entry/final gates and receipt admission read. ABI/current lifecycle tests pass. Remaining selection/metadata alternatives and unbounded preflight-read behavior need examination; no wallet/chain execution. |
| W06 Exchange cart/trade: `exchange/js/*` → shared operations → escrow | Exact per-unit reward, owned/aggregate limits, all intended entries, current cart/account and dedicated target | **Partial.** Cart quantity/duplicate limits, reward arithmetic, per-unit expansion, full-term pair lookup, final equality, confirmation and balance gating read. Remaining reset/tab/UI alternative paths not completely examined. |
| W07 Public retained submission/outcomes: shared store/poll → both page retry/refresh consumers | Ambiguous submission blocks repetition; attribution/terminal result differs from balance refresh; bounded confirmation | **Shared core examined.** Complete store/lock/reservation/rejection/poll/confirmation/reduction code read; page main/retry consumers traced. Fixtures/deadline and runtime controls pass. Browser storage/Web Locks, real receipt attribution, finality and indexer consistency unverified. |
| W08 Admin boot/network/authority: `admin.js`, `network.js`, Beacon, wallet/live-cfg → all writes/status | Correct surface/network and initiating account through awaits; chain admin authority is independent of UI | **Partial.** Startup surface wiring, network persistence/reload, send-authority capture, account events and helper checks examined. Indicator/read-only Exchange status and all event consumers remain to complete. |
| W09 Pause and recovery, both escrows: `pause*` → `escrow-ops.js` → stored request/status | Current target/authority; uncertain toggle cannot become a fresh retry; truthful refreshed status | **Local source examination done.** Controller, recovery locking/storage, final send checks, hash retention, confirmation and refresh ownership read; pause/runtime controls pass. No actual toggle, persisted browser recovery or external confirmation observed. |
| W10 Treasury custody/XTZ/MAX, both escrows: transfer/withdraw/table/recovery → helper → contract | Exact recipient, whole tokens/decimal mutez, current balance context, complete batch and durable uncertainty | **Partial.** Transfer/withdraw/MAX, table, recovery and serialization/confirmation core read. Runtime amount/pending/order/recovery controls pass. Complete orchestrator/config/status/lifecycle event graph still needs independent examination. No funds movement. |
| W11 Pairs list/create/edit/cleanup, both escrows: controllers/set panel/modal → helpers/TzKT | Exact terms/IDs, initiating authority, scoped complete reads, truthful confirmation and retained intent | **Partial.** Main controllers, Exchange locked redeem, modal save/refresh, set validation/availability and all helper serializers read. Pair authority/read/pagination/session controls pass. Full widget/content/set-panel wiring and rejected-await/publication matrix unfinished. |
| W12 Drop normalize/build/load/send/status/countdown: `features/drops/*` → pair helper and preview/checklist | Every asynchronous owner must retain source/network/wallet/UI intent; per-batch exact effects and honest partial results | **Partial, two confirmed findings.** Send/chunk construction and gates, loader ranges, request-scoped pair status, cancellation/epochs and countdown owner read. **001**: old Auto rejection clears newer manual preview. **002**: aborted unpause completion republishes old start ID/LIVE. Full normalization/translation/view and remaining phase/order combinations unfinished. |
| W13 Checklist/Health/CMS/economics/catalog: health and checklist modules → adapters/cache/CSV/TzKT | Current scoped complete evidence; unknown cannot imply zero/ready; exact CMS/token economics | **Partial.** Supply dependency publication, full-page balance economics, Health enumeration, CSV normalization/comparison and upload ownership core examined. Catalog reads and consumers traced. Remaining GitHub comparison/polling, health summary mirrors, NFT/cache/title and all event interactions need completion. |
| W14 Local authoring/provider: controller/client/provider/subscriber → loopback API | Reviewed preview/version owns apply; failed/stalled verification retires trusted params; no production writer authority | **Partial.** Controller request/session state, provider refresh constraints/retirement, full response deadline and apply readback examined. Runtime authoring/timeout tests pass. Form/view/token serialization and complete schema compatibility paths remain. |
| W15 Source/projection/mirror/archive/lock/recovery: service/CLI → writer/projector/watcher | Coordinated supported writers, CAS/idempotence, exact projections, preserved unresolved journal and recoverable partial writes | **Partial.** Complete writer/recovery/projector/lock and service request/apply flows read; isolated current suites pass. Full schema/archive/watcher/CLI examination unfinished. AUD-005-001 stays accepted unsupported independent-editor concurrency; no new supported-writer counterexample asserted. |
| W16 Direct escrow trade/admin/default: active legacy SmartPy plus Public/Admin builders | Every trade matches sender and six stored terms; correct custody/recipients; admin-only mutation; atomic failure and truthful events | **Source-logic examination done; execution unavailable.** Every executable escrow entry read: pause/empty/nonexistent/mismatched/later-item trades; repeated/grouped burn/redeem identities and external FA2 transfer effects; setup/update positive amounts/distinct contracts/duplicate IDs; cleanup cardinality/nonexistent IDs; admin rescue/withdraw and default XTZ receive. External rejection and insufficient inventory roll back under protocol assumptions. ABI decoding passes. Legacy compile/tests/deployed Michelson not verified. |
| W17 Public/Admin build/delivery/dev: packages/CI → projections/bundles → root/environment loaders → Pages | Branch-owned artifact graph and source provenance agree; no development authoring in production | **Partial.** Package/Pages stages, core root/early loader logic and Admin guards/prune/isolation read; both builds and graph fixture checks pass. Complete verifier, remaining loaders, dev/harness command effects, Linux/Node-20 and actual remote branch/deployment graph not fully examined. |
| W18 Thumbnail/site/CMS tooling: Outer asset input/backfill → Admin manifest; CMS library exports | Exact asset identity, originals/exclusive publication/rollback; complete reads and explicit ambiguous writes | **Partial.** Thumbnail conversion/allocation/rollback/backfill and current generator URL fix read; concurrency and filename suites pass. Webflow CMS library only entry-enumerated, not completely re-examined; manifest-lock implementation and static optimizers remain. No live site accessed. |
| W19 Signer provisioning: fixed pair CLI → provider/chain/admin/ABI → send/readback | Default inert; explicit authorized execute; fixed target/exact payload and complete readback | **Source flow examined; external execution unverified.** All command modes, payload validation/packing, signer/chain/entrypoint/storage checks, empty mapping/cardinality, request/confirmation/readback read. Default 44-pair dry-run and fixtures pass. ABI check is not deployed-code equivalence; no live verify/execute. |
| W20 Contract provenance/origination: canonical source → frozen/promoted artifacts and records | Current source, certified snapshot and originated identity remain distinct | **Partial.** Existing source/artifact identity checker and invariant-map checker pass; current payloads decode. Certification/promotion/deployment records and their complete correspondence still need full independent re-examination. Historical origination is not a current live observation. |

For W16, repeated trades do not reuse only the first validation: sender and all
six terms are checked inside the loop, each burn/redeem is accumulated and every
group invokes its FA2 transfer interface. Later validation or external rejection
cannot legitimately be called successful execution; source and protocol reasoning
do not execute these effects. There is no runtime admin/burn-address setter in
the active escrow source. Its constructor identities and actual FA2 behavior
remain deployment trust boundaries. MockFA2 and artifact/ABI checks do not
establish real operator policy or irreversible burning at the configured sink.

### Actual verification at these revisions

Logs are ignored `audits/work/AUD-006-*.log`. Commands below do not imply that
unexamined source was covered by reading or that mocks establish live behavior.

| Actual command or exact selection | Outcome |
| --- | --- |
| Outer PowerShell enumerated top-level `shared/*.test.mjs`, `drops/js/*.test.mjs`, `exchange/js/*.test.mjs`, `scripts/*.test.mjs`, `loaders/*.test.mjs`, plus `assets/thumbs/scripts/thumbs.test.mjs` and `assets/webflow-cms/webflow-cms.test.mjs`; passed paths to `node --test --experimental-vm-modules --experimental-test-isolation=none` | 462 selected: 452 pass, 10 fail solely at sandbox child-process `spawn EPERM` in thumbnail cases; no application assertion failure in the other cases |
| Permitted rerun: `node --test --experimental-test-isolation=none assets/thumbs/scripts/thumbs.test.mjs` | All 27 thumbnail tests pass, including all ten previously blocked cases |
| Admin `npm run test:runtime` | 1,961 pass, zero fail/skip |
| Admin `npm run test:thumbs` | 37 pass, zero fail/skip |
| Outer `node audits/repro/AUD-004-config-suite.mjs` | Initial sandbox `spawnSync EPERM`; permitted rerun passes unchanged suites in disposable copies: 25 schema/authoring + 19 transaction + 10 service + 90 projection + 1 watcher = 145 |
| Outer `npm run test:public-trade-ops` | 20 named fixtures and 19 deadline tests pass; overlaps broad selection |
| Admin `node tests/repro/AUD-006-drop-auto-error-repro.mjs`; `node tests/repro/AUD-006-unpause-owner-repro.mjs` | Both demonstrate their defects and positive controls, repeated successfully; not remediation gates |
| Outer `node audits/repro/AUD-005-contract-abi-check.mjs` | Six Admin operations and both Public handlers decode against promoted ABI, preserving tested terms/user/large IDs; no contract execution |
| Outer `node audits/repro/AUD-004-contract-provenance-check.mjs` | Canonical/snapshot, mechanical fixture/target and frozen/promoted identities pass; canonical SHA-256 `0BC3B735377B92F1E5635ED7789B7693018DECA2256FA79DEEBD952279FC8BD9`, promoted `FE850EA74A082D8E57EE47D0E3D70339088D1490128D93A86BDDDB338947F0A9` |
| `python "docs/EA-XYZ Contract Audit/tests/verify-invariant-coverage.py"` | Mapping checker: 26/26 invariants, 181/181 obligations, 13 mapped tests; not compile/test execution |
| Outer `node scripts/shadownet-exchange-pairs.mjs` | Inert default 44-pair payload/dry-run passes; no provider/signer/RPC/transaction |
| Outer `npm run build:pages:staging`; Admin `npm run build:clean` | Both pass; mirror/manifest guards, six Public bundles and Admin prune/isolation (four dev chunks removed, eight production files checked). Existing Browserslist-age and bundle-size warnings remain |
| Outer `npm run verify:home-first-paint-build`; `npm run verify:drops-first-paint-build` | Pass; staging freshly built, prod output pre-existing and not freshly rebuilt |

### Unfinished examination and result limits

The table's partial rows are unfinished work, not accepted risks or inferred
successes. Continue the original method on their remaining producers/consumers,
alternate entries, malformed/boundary inputs, rejection/cancellation orderings,
recovery and cross-system combinations. In particular, finish the Drops
normalization/translation/view and full async branch matrix; pair widgets/modal
content; Treasury orchestration; checklist GitHub/Health/NFT/cache graph; authoring
form/schema/archive/watcher; complete CMS/asset and build/dev delivery flows; and
historical finding reassessment/provenance. Fresh passing broad suites do not
replace this source examination. Newly exposed local findings 001/002 have been
traced and reproduced with controls; no other material local hypothesis is
asserted as a confirmed defect by this partial result.

Unverified integrations: current browser/Webflow DOM and custom code/CMS;
Beacon transport/wallet signing and real Web Locks/storage; RPC/TzKT pagination
truth, consistency/finality/reorg; time provider accuracy; external FA2 ledger,
operator and transfer behavior; deployed escrow source/code/storage/admin/sink,
inventory and operation outcomes; Pages/hosting/custom-code identity and remote
main/staging artifacts. No detailed Webflow read was performed; no exact site ID
was assumed. No dev/sanity server, fresh dependency install, fresh production
build, Linux/Node-20 CI, OS crash/power-loss durability or manual browser smoke.
Compatible legacy SmartPy tooling was not supplied: no legacy compile/tests,
modern substitute execution, manual Michelson edit or generated artifact.

No complete-pass disposition, no provisional/final clean claim and no conditional
post-clean coverage refresh. No final checklist update or `audits/report.md`.
The supported-workflow limitation in AUD-005-001 remains accepted; it was not
reopened as a production defect. Production behavior, network configuration,
runtime contracts, operational journals/archives/locks and historical evidence
are preserved. Final diff/status/whitespace checks and separate exports are
reported in the universal handoff.

## AUD-005 — current investigation (2026-11-19)

**COMPLETE AVAILABLE-SOURCE PASS — FIVE CONFIRMED FINDINGS.** No clean, deployment-readiness or live-integration claim. [Findings/evidence](AUD-005-findings.md) and the [remediation checklist](remediation-checklist.md) record the result. Historical sections below concern their identified older revisions.

| Repository | Exact reviewed/tested runtime revision and tree |
| --- | --- |
| Outer, including contracts/tooling | `fd47dda4adc4ccd23b71447d765acc8c1198d543`, branch `ticket-AUD-005-full-correctness-review`; initially clean, no implementation changes during review |
| Independent Admin | `9edef7cac18c04f40e75a9b15fca0517208f7c6a`, same branch; initially clean, no implementation changes during review |

Reviewed working-tree additions/edits are only this coverage note, `AUD-005-findings.md`, checklist/reproduction guidance, four Outer `AUD-005-*.mjs` evidence scripts and two Admin `tests/repro/AUD-005-*.mjs` scripts. All source verification remains bound to the above runtime revisions; no passing result is attributed to a fix. Ignored `audits/work/AUD-005-*` retains discovery notes and verification logs. No real configuration journal, archive, lock, thumbnail master or browser storage was recovered/cleared for the investigation.

### Assumptions and boundaries

- Windows PowerShell, Node `v22.16.0`, npm `10.4.0`; installed dependencies, no installation/upgrade. Beacon SDK 4.8.1 (core/dapp 4.8.0), Parcel 2.16.4, Taquito 19.0.2, Sharp 0.35.3. Outer lockfile SHA-256 `D0083CFF4CC978C52830D78062E2A4DE9D7D5C3C9C490AE773ABB664B83EC935`; Admin `8A79D21B6E5F50FBAE2E972CE8B665836E8151FF49D2865B83F7E1BEE334C3EB`. Pages specifies Node 20/Linux, not exercised here.
- `NETWORK` unset; Public default `testnet` is Shadownet; Admin uses its persisted selector/reload lifecycle (tests control storage). RPC `https://rpc.tzkt.io/shadownet`, TzKT `https://api.shadownet.tzkt.io`; Drops `KT1HMCqYqyP9fTDjzm8KAfyPhFn3tpmSW4kc`, Exchange `KT1Ue9es4biDzt528YhNctPGcNeqw9nDXnSv`, legacy `KT1SZFfxFfRkbTcDUS17y1WVCKeudoLo8LX5`. Mainnet remains incomplete behind configuration gates. No address, endpoint, Beacon value, selector or persisted key changed.
- Canonical SPLINTERED params: scheduled, mirror `testnet`, October 9 2026 at 3 PM seasonal EST zone, HEN burn 1 excluding canonical `141634`, CANAAN `29` redeem 1, planned supply 10. Controlled tests also examine other configurations accepted by current schema, especially redeem amount 3. Registry mirrors and surface-specific targets are consequential inputs; configured values are not live observations.
- Scope is all consequential implemented workflows in both repositories, direct contract calls, local tools and build/deployment source. Excluded: cosmetic effects without consequential visibility, proposed/unimplemented architecture, historical model code as runtime, marketplace behavior after navigation, third-party internal audits beyond identified interfaces. Optional/dormant exports were traced for actual callers; presentation-only coercion was distinguished from transaction identity.
- No current live Webflow site/custom code/CMS, Beacon transport/wallet, RPC/indexer/time-provider accuracy, external FA2 ledger/operator semantics, deployed escrow/bundle/hosting identity or live transaction was observed. No detailed site inspection or external mutations occurred. Reference reads on 2026-11-19: [Michelson semantics](https://octez.tezos.com/docs/active/michelson.html) and [FA2 specification](https://gitlab.com/tezos/tzip/-/blob/master/proposals/tzip-12/tzip-12.md); these are interface oracles, not observations of configured services.
- Compatible legacy SmartPy tooling was unavailable; active source was neither changed nor compiled/executed. No modern replacement, generated Michelson or substitute model was used as active-contract evidence. Native OS crash/power-loss durability, Linux/Node-20 CI, fresh dependency install, browser/manual smoke and production rebuild remain unverified. Staging and Admin builds were local only.

### Independent discovery, then historical reconciliation

Before opening prior coverage/findings, source entry registrations, package commands, registry, wallet/trade builders, contract entries and CI formed 15 behavioral candidate groups: wallet/network; page/reveal; Drops actionable state; Exchange cart; public submission/recovery; direct trade; privileged contract/XTZ; Admin pause; treasury; pairs; Drops planning/send; local authoring; health/catalog; assets/CMS; delivery/provenance. The ignored initial note is `audits/work/AUD-005-discovery.md`.

Forward traces started at every page/Admin boot, DOM/SDK event, timer/poll, direct entrypoint and CLI/service/build command. Reverse traces followed wallet requests, FA2/XTZ effects, source/asset writes and balance/readiness/success publications back to all reachable callers. Boundary traces checked account/network generations, exact financial identities through DOM/mirrors/cart/Micheline/storage, asynchronous cached/requested/rendered state, configuration projections/journals, imported assets and branch-owned delivery artifacts. Newly exposed callers entered the map before examination ended.

Only then were AUD-004 W01–W20 and AUD-003/AUD-002/CHR ledgers consulted. Reconciliation explicitly added signer-backed Exchange provisioning, separated frozen/current/deployed contract identity and split shared groups into the stable W01–W20 contracts below. No earlier consequential row was removed as “already fixed.” Cosmetic/dormant exclusions retain the reasons above. This reconciliation is initial discovery completion, not the conditional post-clean refresh.

### Behavioral map and complete pass dispositions

Every row received independent expected-property grounding, producer/consumer/alternate-entry tracing, applicable malformed/boundary/order/failure/recovery challenges and a classified result. “Examined” means explained current local flow under the stated interface assumptions; it does not mean every external effect was executed. Tests support the named seams and never define the property by themselves.

| ID / workflow | Expected property and current source boundaries | Examination / result |
| --- | --- | --- |
| W01 Arrival, navigation, reveal, Utility | Usable page/wallet regions despite font/image/load failure. Outer shells, `webflow/*`, `shared/public-first-paint.js`, `collection-utility/js/main.js`, reveal coordinator | Examined early/full startup, masks, duplicate boot, optional nodes, image/font failure, local routes and Utility controls. Loader/navigation/reveal tests and build graph checks pass. Live Webflow DOM/custom code unverified. |
| W02 Public wallet lifecycle | Only current verified account/network observations authorize or replace state. `shared/beacon-setup.js`, `network.js`, registry and page subscribers | Examined boot/permission/read resolution and rejection, mismatch cleanup before/after event replacement, null/same-address reconnect, mobile controls and SDK version migration. Current wallet tests/repro pass; installed SDK request/account implementation inspected. Transport remains external. |
| W03 Holdings and identity projection | Complete exact balances; unknown distinct from zero; canonical CMS identities mapped to wallet IDs. Shared FA2 pager, Drops token rendering and both page consumers | Examined page caps/cursor progress, failed/partial/malformed/duplicate/unsafe balances, exclusions/mirrors, eligible quantities, template/native row boundaries and retired refreshes. Public/FA2/identity suites pass. Indexer filter truth/completeness is an external assumption. |
| W04 Drops time/pause/inventory/LIVE | Trusted schedule observation and current pause plus sufficient redeem inventory before actionable trade. `events.js`, shared clock/countdown/time/compatibility | Examined DST/date/uncertainty, clock jump/suspension/resume, standby/live/paused/error, initial supply and recovery polling, zero/unknown and configured amounts. **004: positive but insufficient inventory enables trade.** Other lifecycle regressions pass; provider accuracy unverified. |
| W05 Drops trade/approvals | Exact selected identity and all six terms under current wallet/selection/escrow at request. `events.js`, shared trade helpers, contract | Examined configured burn/redeem quantities, selected balance, pair absence/ambiguity/pagination, approval fallback and order, final wallet/selection gates, serialized one-trade payload and errors. Actual handler/ABI checks pass; 004 remains a final inventory-precondition defect. |
| W06 Exchange cart/trades | Exact per-unit ratios, ownership/totals, all batch entries and final current account/cart. `exchange/js/*`, shared helpers, contract | Examined duplicate CMS identities, quantity caps, aggregate reductions, edition-derived terms, each expanded entry, approval grouping, missing one mapping blocks whole batch, final equality and reconnect. Suites/ABI check pass. Actual FA2 inventory/application unverified. |
| W07 Public durable submission/outcomes | Unresolved submission cannot authorize repeats; attributed terminal evidence is separate from refreshed holdings. Shared journal/confirmation/poll and both page consumers | Examined Web Locks, reservation capacity/size/storage failure/reload, matching cancellation versus ambiguous rejection/hashless state, complete receipt count/identity, deadline fetch/body/retry/late result, partial stale balances and recovery. Current tests/repros pass. No real wallet request, finality/reorg or journal reconciliation observed. |
| W08 Admin boot/network/authority | Correct surface target and current authority across awaits/reload; presentation cannot grant chain privilege. Admin bootstrap/network/Beacon/live-cfg/indicator/status | Examined both surface registrations, persisted/legacy keys, mismatch clearing, selector failure, account events and captured write authority, diagnostics and cache scope. AUD-004-002 current guards/tests hold. Mainnet remains gated; SDK/hosting boundaries unverified. |
| W09 Pause/recovery, both escrows | Stored admin authority and verified pause target; ambiguous toggle blocks repetition. `features/pause*`, `escrow-ops.js` | Traced storage/account/button gates, helper checks, durable pre-request reservation, late receipt, cross-tab conflict, confirmation and status-only recovery, failures and publication ownership. Pause suites/current repro pass. No actual toggle performed. |
| W10 Treasury custody/XTZ/MAX/recovery | Exact amounts/IDs/recipient/target, all operations attributed, durable uncertainty and current publication. `features/treasury/*`, escrow helpers, TzKT | Examined complete inventory, submit snapshot, whole-number transfers, decimal conversion, Max request/account context, all batch effects, rejection/confirmation/refresh and conflicting/reloaded recovery. AUD-004-001 corrected input controls and all Treasury suites pass. No custody movement performed. |
| W11 Pair list/create/edit/cleanup | Exact terms/IDs and initiating authority through availability and send; truthful attributed outcomes. `features/pairs/*`, escrow helpers, pair reads | Examined shared/Exchange forms, locked currency, ID availability/range/large nats, modal session and pending ownership, direct helpers, cleanup, list refresh and malformed/partial pages. Current pair-authority suites cover all write routes; original AUD-004-002 trigger rejected. External chain results unverified. |
| W12 Drop load/preview/build/chunked send/status | Source/translation/current UI owns every chunk and readiness publication; partial/unknown results stop continuation. `features/drops/*` services/controller/builder/status | Examined initial/manual/auto paths, canonical/mirror/exclusion and ID allocation, ranges/chunks, cached intent equality, pause/network/account/source changes around awaits, partial/unconfirmed batch history and final refresh. **002: same-context status reads lack per-request publication ownership.** Config resets still fence old status. |
| W13 Checklist/Health/CMS/economics/catalog | Current scoped evidence; complete enumeration and unknown remain explicit. Checklist, health modules, catalog/NFT/cache/CSV/econ utilities | Examined supply-derived depleted/pause/pairs recomputation, health/CMS events, upload/recheck ordering, header/quote/duplicate/missing IDs/ACID, local title/thumb identity, network caches and forced economics refresh. AUD-004-005 controls hold; 002 affects pairs-status input. Current Health/checklist tests pass. Local CSV checks do not certify live CMS/minting. |
| W14 Local authoring/provider | Reviewed immutable preview/source/version owns apply; failed verification revokes trusted params. Admin authoring/provider, Outer loopback API | Examined field serialization, disabled-row preservation, time/amount validation, preview expiry/binding, acknowledgement, edit/close/apply retirement, readback constraints, health loss/retry and production isolation. **003: body stall escapes deadline and retains READY.** Rejected health retires correctly. |
| W15 Source/projections/archive/lock/recovery/CLI | Source ownership, exact projections, concurrency, durable uncertainty and preserved independent edits. Outer `shared/drop-params/*`, CLI/service; Admin mirror guard | Examined CREATE/EDIT/DEACTIVATE, CAS/staging/replacements/final equality, archives/idempotency, lock/reclaim, pending/READY, every recovery outcome and external edits. **001: source save during ownership read is still lost.** Broader-window fix holds. Isolated 144-case config suite and original writer regression pass. |
| W16 Direct contract trades/admin/default | Every trade's sender and six terms; exact custody effects, admin-only mutations, atomic rejection and truthful events. Active legacy source plus all client builders | Exhaustive source branches: pause/empty/missing/mismatched/later-item trades; grouped contract/duplicate items/destinations; setup/update positive amounts and distinct contracts, duplicate IDs and cardinality/cleanup; rescue, XTZ/default and external FA2 failure. No new contract-source defect confirmed. No admin/burn-address setter exists. Legacy compile/execution and real FA2 effects unavailable. |
| W17 Public/Admin build/deploy/dev | Complete branch-owned artifact graph; projections/manifest and production-authoring isolation agree. Packages, Pages CI, loaders/verifier, Admin production scripts, dev/harness commands | Traced dual main/staging checkout, freshness, bundle/copy/provenance/source-map guards/upload/deploy, Admin sync/guard/prune/isolation and dev watcher/service/port/harness writes. Both builds and loader/tooling tests pass. No deploy, sanity server or fresh prod build; remote refs/CI/hosting identity unverified. |
| W18 Thumbnail/site/CMS tooling | Exact asset identity, retained originals, coordinated writes/rollback, complete reads and explicit ambiguous mutations. Outer asset tools/CMS exports; Admin manifest/lock | Examined suffix discovery, conversion/key allocation, exclusive archive/manifest ownership/rollback/backfill, static optimizers, CMS identity/pagination/retries/upload/content/hash/publication comparison/readback. **005: raw URL filename changes identity.** Apostrophe, lock/concurrency and normal-file controls pass. CMS exports have no active app/CLI mutation caller; no live site accessed. |
| W19 Signer provisioning | Default inert; explicit provider/chain/admin/ABI/exact payload and full readback. `scripts/shadownet-exchange-pairs.mjs`, registry, promoted ABI | Traced argument modes, fixed 44 pairs, RPC/chain/block/storage/entrypoint/admin checks, empty mapping/cardinality, signer construction boundary, send/confirmation/readback. Dry-run and tests pass. Script checks ABI, not executable deployed-code equivalence; it has no pause precondition. No current authorized requirement to add one was found; no execute/live verify invoked. |
| W20 Contract provenance/origination | Current source, certified frozen artifact and originated identity remain distinct. Canonical source, promoted artifacts, certification/promotion/deployment records | Current source/snapshot/mechanical fixture/target correspondence and frozen/promoted byte checks pass; actual Public/Admin payloads decode including huge nat. Historical origination record dated 2026-10-08 is not a current live observation. Legacy compile and current deployed code/storage/admin/sink/inventory unverified. |

For bounded financial/privileged paths, construction, request, confirmation and refreshed publication were examined separately. Invalid/missing/unsafe identities/amounts, duplicate and batch totals, account/network/source replacement, external transfer rejection/insufficient balance, partial/failed/ambiguous outcomes and recovery were challenged at their relevant seams. Contract per-element checks and all effects were traced independently of UI validation; native atomicity and FA2 compliance are external protocol assumptions, not a substitute local model. Asset/reveal-only paths have no chain rollback; their output ownership/visibility/failure semantics were examined instead.

### Verification, reconciliation and result note

- Outer public/shared/Drops/Exchange selection: **363 pass**. Script/loader/Outer thumbs/CMS selection: **87 pass**. Shared trade fixtures: **20 named checks + 19 deadline tests pass** (overlapping some broad tests). Windows file selections were enumerated explicitly with the recorded Node flags in the report.
- Admin `npm run test:runtime`: **1,908 pass**. `npm run test:thumbs`: **28 pass**; build's manifest freshness check passes. Real-tree transaction suites were not run; `node audits/repro/AUD-004-config-suite.mjs` ran copied unchanged suites: **25 + 19 + 10 + 89 + 1 = 144 pass**. No real journal was recovered or deleted.
- Five AUD-005 reproductions pass by demonstrating bad behavior and valid controls. The AUD-005 ABI probe passes; the original historical ABI VM lacked new authority/target dependencies. Provenance check, invariant map (**26/26**, **181/181**, **13 tests**) and 44-pair default provisioning dry-run pass. ABI/mapping checks do not compile/typecheck/execute the contract.
- Eleven maintained Outer AUD-003 runners pass: `exchange-duplicate-balance`, `pending-ready`, `projection-falsy`, `public-stalled-reads`, `public-stale-live`, `receipt`, `recovery-external-edit`, `thumb-generator-race`, `utility-footer`, `wallet`, `webflow-pagination`. Five Admin AUD-003 replacements pass. Outer `drop-authority` is not counted as passing: its obsolete helper VM lacks the new target resolver; current `drops-send-invalidation`/`pair-authority` tests provide replacement coverage. The old AUD-004 defect-asserting amount/pair/supply/apostrophe scripts were not treated as current remediation gates.
- All five AUD-004 corrections were reassessed from current code and current controls. Withdrawal/pair-authority/supply-dependency original triggers remain corrected. Thumbnail apostrophes are corrected but URL identity still fails (005). Writer staging edits are detected but the narrower read window still loses them (001). CHR and AUD-003/AUD-002 dispositions are reconciled in the report; passing former triggers is not an adjacent-correctness claim.
- `npm run build:pages:staging` and Admin `npm run build:clean` pass. Both first-paint build verifiers pass, including incidental reads of pre-existing prod output; only staging was freshly built. Admin prune removed four dev chunks and isolation checked eight production files. Existing Browserslist-age/large-bundle warnings remain. No tracked generated drift resulted. Initial native/child-process sandbox failures passed on permitted reruns; no application assertion was waived.
- Findings remain **001–005**. No additional unresolved material local hypothesis is asserted. Speculative branches involving unsupported finite range configuration, arbitrary nonconforming FA2 honesty or SDK transport-internal races were not promoted into findings without a demonstrated reachable local contract/oracle. Current defaults/ranges and pinned interfaces were examined; external uncertainty remains qualified above.
- Examination is complete for declared available-source workflows at the identified revisions. Findings prevent a provisional clean result; the conditional independent post-clean enumeration was **not invoked**, and no final-clean claim is made. Final whitespace/status/diff/export checks accompany the universal handoff. Production behavior, generated data, DOM/events/interfaces/network/wallet contracts and historical evidence remain unchanged.

## AUD-004 — historical investigation (2026-11-17)

**COMPLETE AVAILABLE-SOURCE EXAMINATION — WITH FIVE CONFIRMED FINDINGS.** One complete adversarial pass at the revisions below; no clean-result, deployment-readiness or live-integration claim. The independent W01–W18 candidate map was constructed before opening AUD-003 coverage/findings, then reconciled into W01–W20 below. The [findings and evidence](AUD-004-findings.md) and [current remediation checklist](remediation-checklist.md) record the completed pass. Historical results below identify earlier source only.

| Repository | Reviewed source baseline |
| --- | --- |
| Outer, including contracts | `ticket-AUD-004-full-correctness-review`, HEAD `9675ca35016d1fc9a84a3fd93aa12cfde8732873`; clean tracked/index/untracked state at start. |
| Independent Admin | Same ticket branch, HEAD `38e922c54b57d5645022a0f86f9991fc596576a6`; clean tracked/index/untracked state at start. |

Environment: Windows PowerShell; Node `v22.16.0`, npm `10.4.0`; installed dependencies and lockfiles identify the tested tree, with Pages CI separately specifying Node 20. Public defaults to `testnet` (Shadownet); registry Drops escrow `KT1HMCqYqyP9fTDjzm8KAfyPhFn3tpmSW4kc`, Exchange `KT1Ue9es4biDzt528YhNctPGcNeqw9nDXnSv`, legacy `KT1SZFfxFfRkbTcDUS17y1WVCKeudoLo8LX5`. Mainnet remains incomplete and disabled by configuration gates. No external/live observation is claimed merely from these configured targets.

Scope: all consequential available-source application behavior in both repositories, direct escrow calls, configuration/asset tooling and build/deployment boundaries. Exclusions: purely cosmetic styling/animation without consequential visibility effects; historical proposal/model code as active runtime; third-party implementation audit beyond identified interfaces; behavior after leaving the application for marketplaces. No production-code remediation, operational recovery, live transactions, deployment or external mutations are authorized. Legacy compilation, real crash/filesystem durability, live Webflow DOM/custom code, SDK transport/provider behavior, FA2 semantics/deployed code, RPC/indexer/time accuracy and current deployed bundle identities require separate evidence. Their absence limits integration conclusions, not the obligation to trace local consumers.

Discovery used forward page/Admin registrations, SDK/DOM/lifecycle callbacks, timers, all contract entrypoints, CLI/service commands and CI; reverse searches from wallet sends, asset/configuration writes and authority/readiness/balance/success publications; and boundary traces through account/network generations, token mirrors, DOM/cart/Micheline/FA2 identities, source/projections, journals and branch-owned loader graphs. This formed W01–W18 independently. Reconciliation with AUD-003 then exposed the signer-backed provisioning entry and contract provenance as explicit additional behavioral contracts, retained as W19/W20. No prior workflow is excluded merely because it was remediated. Prior rows are grouped below by shared contracts; all remain required examination.

| ID | Current workflow and consequential boundary | Source anchors (paths relative to their repository) | AUD-003 reconciliation |
| --- | --- | --- | --- |
| W01 | Public arrival/navigation/reveal/Utility: usable page and wallet controls despite image/font/load failures | Outer shells, `webflow/*`, `shared/public-first-paint.js`, `collection-utility/js/main.js` | Prior 1 |
| W02 | Public boot/connect/disconnect/persisted accounts: only current verified network/account may authorize effects | Outer `shared/beacon-setup.js`, `network.js`, `chain-registry.js`, page consumers | Prior 2–3 |
| W03 | Holdings/CMS projection: complete exact balances, canonical/mirror identity, unknown distinct from zero | Outer `shared/tzkt-fa2-balances.js`, `drops/js/token-rendering.js`, both page controllers | Prior 3–4, 7 |
| W04 | Drops schedule/pause/supply/LIVE: trusted time and current boolean pause/inventory evidence | Outer `drops/js/events-config.js`, `events.js`, shared time/countdown/compatibility | Prior 4–5 |
| W05 | Drops approval/selection/trade: exact terms, account and escrow at submission | Outer `drops/js/events.js`, `shared/public-trade-ops.js`, escrow source | Prior 6, 9 |
| W06 | Exchange cart/multi-token trade: exact ratios/totals/approvals, all batch entries, final authority | Outer `exchange/js/*`, `shared/public-trade-ops.js`, escrow source | Prior 7–9 |
| W07 | Public durable reservation/confirmation/recovery: no duplicate unresolved sends, scoped applied evidence and separate holdings reconciliation | Outer `shared/public-trade-ops.js`, both page controllers | Prior 6, 8–9 |
| W08 | Admin boot/network/wallet/surfaces/authority: target and generation ownership through awaits/reload | Admin `src/admin.js`, `network.js`, `beacon-setup.js`, `utils/live-cfg.js`, indicator/status | Prior 10–11, 20 |
| W09 | Admin pause and recovery: verified target/admin/state; unknown toggle outcome blocks repeat | Admin `src/features/pause*`, `src/escrow-ops.js` | Prior 11 |
| W10 | Treasury inventory/FA2 rescue/XTZ/MAX and recovery: exact amounts/destinations, current authority, durable uncertainty | Admin `src/features/treasury/*`, `src/escrow-ops.js`, `src/tzkt-api.js` | Prior 12–13 |
| W11 | Drops/Exchange pair list/create/edit/cleanup: exact IDs, complete reads, ownership and truthful operation outcomes | Admin `src/features/pairs/*`, `src/tzkt-api.js`, `src/escrow-ops.js` | Prior 14–15 |
| W12 | Drop snapshot/load/preview/build/chunked send: source/translation/ID assignment and partial-send boundaries | Admin `src/features/drops/*` excluding authoring/checklist | Prior 16–17 |
| W13 | Checklist/health/CMS/catalog/economics: current scoped readiness; incomplete/unknown/cache state remains explicit | Admin health, checklist/status services, adapters, NFT/cache/CMS/economics utilities | Prior 18–20 |
| W14 | Local authoring/provider: reviewed preview binds source/version/operation; production writer isolation | Admin authoring/provider; Outer loopback authoring service | Prior 21–22 |
| W15 | Source/projection/mirror writer/watch/archive/journal/lock/CLI: CAS, concurrency and interrupted recovery preserve authoritative state | Outer `shared/drop-params/*`, writer CLIs; Admin mirror guard | Prior 23–24 |
| W16 | Direct trade/admin contract entries: every trade's sender/terms, grouped effects, cardinality, rescue/XTZ authority, atomic rejection and event truth | Outer active legacy escrow source and client serializers | Prior 25–27 |
| W17 | Pages/Admin dev/build/release: branch-owned complete artifact graph, projection equality and production authoring exclusion | Both package/build scripts; Outer loaders/Pages CI/verifier; Admin production scripts | Prior 32–33 |
| W18 | Thumbnail/manifest/site asset tooling and exported Webflow CMS library: identity, transactional recovery, pagination and ambiguous mutation evidence | Outer `assets/*`, optimizers; Admin manifest generator/lock | Prior 30–31 |
| W19 | Signer-backed Exchange provisioning: default inert dry-run, fixed chain/admin/ABI/payload/readback | Outer `scripts/shadownet-exchange-pairs.mjs`, shared confirmation/registry | Prior 28; added explicitly during reconciliation |
| W20 | Contract source/frozen/promoted/deployment provenance: current source, certified artifact and originated identity remain distinct | Outer active source, contract artifacts, certification/release records | Prior 29; split from W16 during reconciliation |

Expected properties are independently grounded in `PROJECT_INTENT.md`, authority/conservation/exact-identity rules, repository safeguards and identified protocol interfaces. Code/tests describe behavior and are not their own oracle. All seven CHR known issues and all 20 AUD-003 findings were reassessed at these exact revisions; see the report's reconciliation ledger. Discovery reconciliation is not a post-clean coverage refresh.

### AUD-004 examination dispositions

Every row received expected-property grounding, producer/consumer and alternate-path tracing, relevant adversarial input/order/failure challenges, and evidence classification. “Examined” means local consequential flow was explained; external effects retain the limitations below. Passing tests support particular seams, not an independent correctness oracle or an absence-of-defects claim.

| Workflow | Completed examination and adversarial evidence | Result / consequential limit |
| --- | --- | --- |
| W01 | Page bootstrap/loaders, DOM masks and release owners through font/image failure, duplicate startup, missing optional nodes, local navigation, wallet controls and Utility connectors; first-paint, reveal, loader and footer tests/build checks. Cosmetic animation excluded after classifying its effects. | Examined; no additional confirmed material defect. Live Webflow shell/custom code remains unverified. |
| W02 | Persisted account/network verification, permission rejection, generation-fenced startup and account events, disconnect/reconnect, obsolete resolution/rejection; actual Beacon 4.8.1/4.8.0 account/request interfaces inspected. | Examined; current local tests reject prior stale-owner triggers. Wallet transport, permissions UI and mobile session behavior unverified. |
| W03 | Paged ID-cursor reads, partial/malformed/duplicate/unsafe balances, canonical/mirror translation, exclusions, CMS template cloning and stale rendering through both page consumers; unknown versus empty and aggregate quantities. | Examined with public/FA2/identity suites. Query-filter accuracy and current CMS rows are external assumptions. |
| W04 | Calendar/DST boundaries, trusted clock aging/latency/lifecycle reset, scheduled/unscheduled/incompatible params, pre/standby/live/paused/sold-out/unknown supply, poll retirement and retry. | Examined; current LIVE regressions pass. Real time-provider accuracy and current escrow state unverified. |
| W05 | All selected-token validations, exact six-term pair match, unique/paged mapping, operator read/fallback, final selection/wallet/target checks, approval-first batch and serialized unit trade; malformed/oversized balances and rejection/timeout paths. | Examined with real-handler payload decoding and Public tests. External FA2 operator compliance and application unverified. |
| W06 | Cart add/remove/clear, quantity and total caps, duplicate token identity aggregation, edition-derived redemption, each expanded unit trade, approval groups, final cart/account equality and refresh ownership. | Examined; aggregate-reduction and exact payload tests pass. No real multi-token operation executed. |
| W07 | Reservation/lock/storage failure and reload, hashless/ambiguous request outcome, matching applied/failed/backtracked/skipped evidence, bounded transport/body/retry deadline, stale or partial holdings after confirmed application. | Examined; no repeat authorization from unresolved state in tested paths. Actual indexer receipts/reorg behavior unverified. |
| W08 | Both Admin surface bootstraps and all write callers traced through config resolvers, selector reload, network/persisted account checks, authority events, indicator and diagnostics publication. | Examined; pair callers omit the authority binding used by other privileged writers (finding 002). Presentation is not chain authority. |
| W09 | Pause target/admin/pause reads, final ownership, wallet rejection, ambiguous send and timeout, durable conflict/reload/recovery and scoped storage confirmation on both surfaces. | Examined; current pause recovery/authority tests and maintained repro pass. No toggle performed. |
| W10 | Complete inventory, bulk recipient/FA2 identity/positive exact amounts, approval-free admin rescue, all intended operations' applied evidence; XTZ decimals/Max/snapshot invalidation, persisted unknown outcomes and recovery. | Examined; amount-input corruption confirmed (001); other tested custody/recovery boundaries hold. Real wallet signing and admin custody effects unverified. |
| W11 | All create/edit/cleanup entrypoints across shared and Exchange forms, ID availability/ranges, exact term serializers, safe/unsafe nat handling, complete mapping pages and attributed confirmations; form/render epoch and account-order challenges. | Examined; obsolete Set Pair intent can submit as replacement B (002). Other helper probes characterize omitted guards without claiming B signed or had admin rights. |
| W12 | Static/dev snapshots, falsy/invalid/drift retirement, canonical/mirror transforms, exclusions, explicit pairs, pair allocation/collision/chunk bounds; preview/cache/view-signature and source/account/network/pause invalidation before/after every chunk await. Partial/unknown chunks stop further work. | Examined; runtime suite and CHR/AUD-003 replacements pass. Already submitted chunks cannot be undone by UI retirement; no chain batch run. |
| W13 | Health pagination and holder validation, unknown editions, explicit refresh versus cached economics, CSV header/value/duplicate/missing-ID cases, local assets/catalogs, network scoping and checklist state dependency propagation. Local presentation caches traced separately from financial reads. | Examined; supply failure leaves depleted-derived pill/pair projections stale (005). Local CSV/assets/Git equality do not certify published CMS, minting or deployed readiness. |
| W14 | Authoring actions/delegation, form integer/date/token serialization including disabled-row preservation, validation/preview/acknowledgement, edit retirement, apply/read-back fencing, health loss/retry and production static provider. Service origin/host/path/method/payload/operation guards traced. | Examined; transaction writer's staging race affects this caller too (003). Loopback/service OS permissions and real browser interaction remain unverified. |
| W15 | CREATE/EDIT/DEACTIVATE and CLI, source hash/CAS, archives, staged files, writer/projector locks, source/JSON/mirror equality, pending journal/READY semantics, every replacement failure, rollback/reconciliation and external-edit recovery. Real mutating suites isolated in disposable copies. | Examined; normal apply loses a later external source edit (003). Recovery-specific AUD-003 trigger stays fixed. No real journal recovered/deleted; OS power-loss/fsync durability unverified. |
| W16 | Direct sender validation on every trade; pause, pair existence and all six stored terms; positive setup/update amounts; duplicates/count/remove/clear; same-FA2 prohibition; grouped burns and redeems, destinations, approvals, insufficient inventory/rejecting/no-op FA2 distinction, rescue/admin change/burn-address/XTZ/default and event fields. Client bypasses traced back to source guards. | Examined by source plus actual client payload decode against promoted ABI. No new confirmed source defect. Legacy SmartPy compile/execution and deployed Michelson/FA2 behavior not established by these checks. |
| W17 | Public entry/bundle/loader graph and staging/production ownership through Pages trigger/build/guard/verify/upload/deploy steps; Admin build mirror/manifest/production-authoring prune and isolation; dev port/watcher/service lifecycle. Missing/stale loader artifacts tested. | Examined; staging build and Admin clean build pass. Node 20 CI, remote runner/hosting/custom domain and deployed identities unverified. Pre-existing production bundles were not rebuilt. |
| W18 | Asset fetch/verify/transform, bounded retries/rollback, shared generation lock and output checks; numeric suffix/filename-to-JS boundary; Webflow library pagination/progress, incomplete/ambiguous mutation evidence and identity/hash/perceptual checks. | Examined; supported apostrophe filename emits invalid JS (004). CMS tooling tested inertly; no live site inspection/mutation or upload performed. |
| W19 | Default no-provider/no-network dry-run and fixed 44-pair economics; signer provider selection, Shadownet chain/admin/storage/ABI/paused checks, pinned read scope, exact payload, operation attribution and required full read-back. | Examined; default dry-run and provisioning tests pass. Execute/verify live modes deliberately not run; signer trust, current storage and actual chain outcome unverified. |
| W20 | Canonical/snapshot identity, mechanical legacy-test stripping with unchanged compilation target, frozen/promoted LF identity, manifest/certification/promotion versus historical originated-code observations. | Examined; current byte checks and ABI decoding pass. Historical certification is not a new compile, source-to-deployed equivalence proof or current deployment observation. |

For bounded financial/privileged flows, the examination followed each effect from input/authority through construction, send, outcome and refreshed publication separately. Invalid nat/amount/identity/pair, insufficient ownership/inventory, rejected external transfer, partial batch, ambiguous request/confirmation and account/network/source replacement were considered at each relevant seam. The contract's per-trade checks apply inside the loop, not just to its first element; native Tezos atomic execution is a protocol dependency, not a locally executed simulation result. Arbitrary nonconforming/no-op FA2 code cannot be made honest by client or escrow validation. UI/asset-only flows have no independent chain rollback branches; their applicable failure publication and generation/rollback boundaries were examined instead.

### AUD-004 verification, assumptions and external limits

- Windows/Node 22.16.0 verification used installed lockfile dependencies without installing or upgrading packages: Beacon SDK 4.8.1 (dapp/core 4.8.0), Parcel 2.16.4, Taquito 19.0.2 and Sharp 0.35.3. Node 20, Linux/browser filesystem semantics and fresh dependency installation were not exercised.
- Public/shared top-level and Drops/Exchange tests: **363 passed**. `npm run test:public-trade-ops`: **20 named fixture checks and 19 deadline tests passed** (deadline cases overlap the broad run). Admin `npm run test:runtime`: **1570 passed**. Script/loader/thumbnail/Webflow-library selection: **87 passed**. Admin `npm run test:thumbs`: **16 passed**; `npm run check:thumbs` passed.
- Configuration suites ran unchanged in workspace-bounded disposable copies: **25 authoring + 19 transaction + 10 service + 53 projection + 1 watcher = 108 passed**. The retained [safe runner](repro/AUD-004-config-suite.mjs) creates no operational state in the real source tree. Direct real-tree transaction tests were intentionally avoided.
- All twelve maintained Outer AUD-003 reproductions and five maintained Admin replacements passed. Frozen historical defect-asserting scripts were not misclassified as regression failures. Five new defect reproductions pass by demonstrating the current bad behavior with controls; they are not remediation gates. See the [reproduction guide](repro/README.md).
- `npm run build:pages:staging` and Admin `npm run build:clean` passed. Admin prune removed four development-only chunks and isolation verified eight production files. No tracked generated-file drift resulted. First-paint build verifiers passed for freshly built staging and also inspected existing production files; only staging's build belongs to this run. No Pages sanity/server/live publish test was run. Existing Browserslist-age and large-bundle warnings remain.
- Real current Public and Admin payloads decoded against the promoted Michelson parameter schema, preserving a nat larger than JS safe integer range. Mechanical provenance checks passed; invariant-map verifier reports **26/26 invariants, 181/181 obligations, 13 mapped tests**. This is mapping/identity/schema evidence, not execution of those SmartPy tests, Michelson typechecking or compilation. No compatible legacy compiler was provided or substituted.
- External reference interfaces consulted on **2026-11-17**: [HTML number input](https://html.spec.whatwg.org/multipage/input.html#number-state-(type=number)), [Octez Michelson execution](https://octez.tezos.com/docs/alpha/michelson.html), [Tezos FA2 overview](https://docs.tezos.com/architecture/tokens/FA2), and the [TzKT operation API controller source](https://github.com/baking-bad/tzkt/blob/master/Tzkt.Api/Controllers/OperationsController.cs). These identify interface assumptions, not observations of configured live services or a pinned deployed protocol/API revision. Installed SDK source and repository-pinned ABI provide version-specific local evidence.
- No live Webflow site was inspected. Local shell site marker `656cf42faa2b1a7a1582d9d2` is not verification of that site's current DOM/CMS/custom code. No RPC/TzKT/time-provider/account/signer/wallet session, deployed Pages/Admin bundle, current contract admin/pause/storage/inventory or FA2 transfer was observed. Historical Phase-11 deployment records concern their recorded date/targets; they are not refreshed here. Actual SDK transport, wallets, HTTP accuracy, finality/reorgs, conforming FA2 behavior and external service availability remain unverified integrations.
- Excluded cosmetic/decorative behavior, dormant historical model/test scaffolding and out-of-application marketplace actions do not authorize assets/configuration under the traced current source. Presentation metadata/thumbs and their caches do not establish token ownership, supply, admin rights or operation application.

Pass result: **20/20 workflows examined; zero locally unexamined workflows; five confirmed material failures, all still open because remediation is outside scope.** Potential extra issues (historical countdown phase versus current pause, unsafe presentation-only IDs, provider filter fidelity and SDK internal timing) were investigated without promoting ambiguous intent, a dormant consumer or an unverified upstream assumption to a confirmed failure. Their relevant boundaries are qualified above and in the report. No unresolved additional material local hypothesis is asserted. A provisional clean pass was not reached, so the conditional post-clean independent refresh/final-clean evaluation was not invoked. Reassess and repeat the complete pass after remediation; passing existing checks does not resolve these findings.

Only investigation documentation and evidence were changed; production source, configuration, generated projections/manifests, operational journals, contracts and lockfiles remain unchanged. Exact verification commands and new finding preconditions are in the report. Both HEADs/branches/index contents remained at the declared baselines throughout the examination.

**Historical result: AUD-003 COMPLETE SOURCE EXAMINATION — WITH FINDINGS — 2026-11-12.** All 33 established workflows below were reexamined against that review's source; 0 partial and 0 unexamined. The [AUD-003 findings](AUD-003-findings.md) consolidate 21 inert candidate reproductions into 20 distinct findings. Eleven Public fixture failures are classified separately. This is not a clean result or live deployment certification. Material findings preclude the conditional post-clean source-driven enumeration refresh.

## AUD-003 review context and dispositions

| Repository | Exact current source and state at investigation start |
| --- | --- |
| Outer, including contracts | `ticket-AUD-003-full-correctness-pass`, HEAD `d45e0549029ca383f1e8b08e7c88b16997f12a30`; tracked/staged content clean; 22 retained untracked AUD-003 reproduction/diagnostic scripts. |
| Independent Admin, read-only | `codex`, HEAD `2764a96daaed44dfefe6b970fc99a1c88626075d`; tracked/staged content clean. Its index byte hash differs from the initial protected snapshot as previously documented; no staged content differs. |

Source/toolchain assumptions remain Windows, Node `v22.16.0`, npm `10.4.0`, Beacon SDK `4.8.1`, Taquito `19.0.2`, Parcel `2.16.4`, Sharp `0.35.3`; Pages CI specifies Node 20. The current `testnet` slot is Shadownet, with separate Drops and Exchange escrows stated in the historical map below; Mainnet configuration remains incomplete. Active SPLINTERED source settings are unchanged. Historical release/provenance records and locally generated output do not identify current deployed Pages, originated escrow storage or live FA2 behavior.

Each row below names one already established workflow. “Examined” means its consequential available-source control/data paths, adverse inputs, effect boundaries and consumers were traced; external live dependencies remain qualified in the [findings report](AUD-003-findings.md). Findings may appear in more than one consumer row without becoming duplicate root findings.

| # | Workflow | AUD-003 disposition and finding references |
| --- | --- | --- |
| 1 | Public arrival/navigation/Utility | Examined; [013](AUD-003-findings.md#aud-003-013--collection-utility-footer-link-does-not-navigate-in-local-shells). |
| 2 | Network/escrow/token identity | Examined; source targets/strict selectors preserved, live targets unverified. |
| 3 | Public wallet lifecycle/holdings | Examined; [001](AUD-003-findings.md#aud-003-001--stale-public-wallet-helper-can-disconnect-a-newer-account). |
| 4 | Drops configuration/catalog/selection | Examined; current Public compatibility and exact CMS/registry identity gates traced. |
| 5 | Drop time/pause/inventory availability | Examined; [011](AUD-003-findings.md#aud-003-011--drops-remains-live-and-actionable-after-a-later-pause). |
| 6 | Drops burn/redeem and refresh | Examined; [002](AUD-003-findings.md#aud-003-002--unsafe-drops-starting-balance-can-strand-a-submitted-hash), [010](AUD-003-findings.md#aud-003-010--a-stalled-confirmation-fetch-defeats-the-public-timeout). |
| 7 | Exchange cart/economics | Examined; [012](AUD-003-findings.md#aud-003-012--duplicate-exchange-rows-undercount-balance-reduction). |
| 8 | Exchange multi-token submission | Examined; [010](AUD-003-findings.md#aud-003-010--a-stalled-confirmation-fetch-defeats-the-public-timeout), [012](AUD-003-findings.md#aud-003-012--duplicate-exchange-rows-undercount-balance-reduction). |
| 9 | Shared approval/pair/outcome evidence | Examined; [010](AUD-003-findings.md#aud-003-010--a-stalled-confirmation-fetch-defeats-the-public-timeout), [012](AUD-003-findings.md#aud-003-012--duplicate-exchange-rows-undercount-balance-reduction). |
| 10 | Admin boot/wallet/network | Examined; current authority and switching paths traced. |
| 11 | Admin authority/status/manual pause | Examined; [005](AUD-003-findings.md#aud-003-005--unknown-admin-pause-toggle-can-reverse-the-requested-state). |
| 12 | Admin Treasury FA2 inventory/rescue | Examined; [003](AUD-003-findings.md#aud-003-003--ambiguous-treasury-outcomes-permit-repeat-withdrawal-or-rescue). |
| 13 | Admin XTZ balance/Max/withdrawal | Examined; [003](AUD-003-findings.md#aud-003-003--ambiguous-treasury-outcomes-permit-repeat-withdrawal-or-rescue). |
| 14 | Admin Drops pair create/edit/cleanup | Examined; exact mutation/serialization and direct contract effects traced. |
| 15 | Admin Exchange pair management | Examined; dedicated escrow and locked terms traced. |
| 16 | Admin drop snapshot/load/preview | Examined; [007](AUD-003-findings.md#aud-003-007--rounded-pair-status-can-declare-the-wrong-exact-token-fully-set), [008](AUD-003-findings.md#aud-003-008--local-writer-health-loss-retains-an-actionable-old-drops-snapshot), [009](AUD-003-findings.md#aud-003-009--malformed-admin-pair-pages-become-false-missing-status). |
| 17 | Admin drop batch send | Examined; [006](AUD-003-findings.md#aud-003-006--admin-drops-send-can-hand-as-prepared-batch-to-wallet-b), [008](AUD-003-findings.md#aud-003-008--local-writer-health-loss-retains-an-actionable-old-drops-snapshot). |
| 18 | Admin lifecycle/readiness/checklist | Examined; [007](AUD-003-findings.md#aud-003-007--rounded-pair-status-can-declare-the-wrong-exact-token-fully-set), [009](AUD-003-findings.md#aud-003-009--malformed-admin-pair-pages-become-false-missing-status). |
| 19 | Admin Health/CMS/economics | Examined; [004](AUD-003-findings.md#aud-003-004--malformed-health-balances-can-be-counted-as-complete-circulation), [014](AUD-003-findings.md#aud-003-014--manual-health-refresh-can-reuse-stale-healthy-economics), [015](AUD-003-findings.md#aud-003-015--blank-canaan-acid-csv-value-can-pass-health). |
| 20 | Admin labels/catalogs/presentation caches | Examined; presentation does not establish financial identity/authority. |
| 21 | Local authoring UI/provider handoff | Examined; [008](AUD-003-findings.md#aud-003-008--local-writer-health-loss-retains-an-actionable-old-drops-snapshot), [018](AUD-003-findings.md#aud-003-018--pending-journal-can-be-published-as-ready). |
| 22 | Loopback authoring API | Examined; [018](AUD-003-findings.md#aud-003-018--pending-journal-can-be-published-as-ready). |
| 23 | Transactional config/archive/recovery | Examined; [016](AUD-003-findings.md#aud-003-016--falsy-generated-projections-can-receive-a-completed-journal), [017](AUD-003-findings.md#aud-003-017--automatic-recovery-can-overwrite-a-later-external-source-edit), [018](AUD-003-findings.md#aud-003-018--pending-journal-can-be-published-as-ready). |
| 24 | Projection/mirror propagation | Examined; [016](AUD-003-findings.md#aud-003-016--falsy-generated-projections-can-receive-a-completed-journal), [017](AUD-003-findings.md#aud-003-017--automatic-recovery-can-overwrite-a-later-external-source-edit), [018](AUD-003-findings.md#aud-003-018--pending-journal-can-be-published-as-ready). |
| 25 | Direct escrow trade/FA2 custody | Examined; no new direct-source defect; live FA2/protocol behavior unverified. |
| 26 | Direct privileged pair mutation | Examined; no new direct-source defect; deployed ABI/state unverified. |
| 27 | Direct pause/rescue/XTZ | Examined; direct authority and effects traced; [003](AUD-003-findings.md#aud-003-003--ambiguous-treasury-outcomes-permit-repeat-withdrawal-or-rescue), [005](AUD-003-findings.md#aud-003-005--unknown-admin-pause-toggle-can-reverse-the-requested-state) are UI outcome roots. |
| 28 | Signer-backed Exchange provisioning | Examined; [010](AUD-003-findings.md#aud-003-010--a-stalled-confirmation-fetch-defeats-the-public-timeout) shares poller; live signer/RPC unverified. |
| 29 | Contract provenance/origination | Examined; historical source/artifact/deployment identity reconciled, current live identity unverified. |
| 30 | Thumbnail/site asset authoring | Examined; [020](AUD-003-findings.md#aud-003-020--standalone-thumbnail-generation-can-be-lost-by-input-rollback). |
| 31 | Exported Webflow CMS/asset effects | Examined; [019](AUD-003-findings.md#aud-003-019--exported-cms-list-operations-silently-truncate-malformed-pages), presently unused exported path. |
| 32 | Public delivery/build/Pages | Examined; no new current-source failure; live assembled/deployed artifacts unverified. |
| 33 | Admin production/development/harness | Examined; source guards and inert isolation controls traced, compiled production output unverified. |

Verification and exclusions: unchanged-revision Admin runtime suite 1,392 pass; copied configuration suites 31 plus 28+1 inner pass; tooling/loader/asset/CMS/provisioning suite 50 pass. Public suite 268 total, 257 pass and 11 fixture failures, separately diagnosed. Twenty-one inert candidate reproductions have valid controls; they resolve to 20 findings (two Health input variants share one). No operational build, live wallet/chain/FA2/indexer/Webflow/Pages test or legacy SmartPy compilation was performed. The [findings report](AUD-003-findings.md#verification-fixture-failures-and-boundaries) states exact gaps. No tracked production source or Admin source was changed by AUD-003.

## Historical AUD-001 enumeration and context

**Historical status: ENUMERATED — NOT YET AUDITED on 2026-11-02.** The following original context, discovery notes and behavioral map are preserved as AUD-001 evidence; their older revisions and “future examination” wording do not supersede the current AUD-003 result above. The 33-row map remains the starting scope for AUD-003, not a post-clean refresh.

The authoritative [correctness-review method](../docs/correctness-review.md) is unchanged. Implementation facts below come from current source. Expected properties are future examination targets grounded in [project intent](../PROJECT_INTENT.md), [repository safeguards](../AGENTS.md), [contract guidance](../contracts/AGENTS.md), and the operating/interface contracts in the [developer guide](../docs/developer-guide.md), [operations guide](../docs/operations.md) and [network runbook](../docs/testnet-to-mainnet.md). They are not findings that the implementation satisfies those properties.

## Review context

Scope is the full EA-XYZ application represented by available source: public Home, Drops, Exchange and Collection Utility; shared wallet/trade/time runtime; independent Admin UI and privileged operations; escrow and direct-chain callers; generated configuration, persistence and recovery; asset/CMS tooling; development, build, loaders and deployment integration. Consequential external dependencies are traced to application-facing requests, authority, payloads and outcome consumers; inaccessible internals/live state are qualified below.

| Repository | Examined revision and working tree |
| --- | --- |
| Outer `eatacid-xyz` | Branch `ticket-AUD-001-initial-coverage`, HEAD `328f47bc28cdf33f06fbb051874dd5a9ffed1aaa`; clean at discovery start. Contracts belong to this revision. Only this document changes in AUD-001. |
| Independent `admin-ui` | Branch `codex`, HEAD `c831010483b3bd1e49f94c279045d1f008d6e5be`; clean at discovery start, examined read-only. Outer HEAD does not identify Admin source. |

- Public selection is evaluation/build-time `testnet` unless explicitly overridden with `NETWORK`. Admin defaults to `testnet`, persists `ea.admin.network`, supports a debug-gated window override, migrates a legacy key and clears the active account before reload-boundary switching. `testnet` means Shadownet: RPC `https://rpc.tzkt.io/shadownet`, TzKT `https://api.shadownet.tzkt.io`. Registry targets are Drops `KT1HMCqYqyP9fTDjzm8KAfyPhFn3tpmSW4kc`, Exchange `KT1Ue9es4biDzt528YhNctPGcNeqw9nDXnSv`, legacy escrow `KT1SZFfxFfRkbTcDUS17y1WVCKeudoLo8LX5`. Surface fallback rules differ by consumer. Mainnet escrow/ACID configuration is incomplete; no readiness or deployment is inferred.
- Authored snapshot: scheduled `SPLINTERED`, mirror network `testnet`, October 9, 2026, `3:00 PM EST`; HEN burn 1 excluding canonical ID `141634`; CANAAN redeem ID text `29`, amount 1, planned supply 10. Labels pass through shared timezone/DST conversion. A passed date/configuration does not unpause a contract.
- Both lockfiles pin Beacon SDK `4.8.1` / beacon-core `4.8.0` and Parcel `2.16.4`; Outer locks Taquito `19.0.2` and Sharp `0.35.3`. Lockfiles at the revisions above identify dependency trees, whose internals were not audited. Inspection host reports Node `v22.16.0`, npm `10.4.0`; Pages CI specifies Node `20`. No install/build/toolchain equivalence check ran. SmartPy is legacy syntax, subject to its manual compilation limits.
- Deployment assumptions are source-visible: exact production hostnames select `prod`, others select `staging`; CI separately checks out `main` and `staging`. Their deployment-time revisions/published bundles were not examined. Local shells identify Webflow site `656cf42faa2b1a7a1582d9d2`; no live site was confirmed or inspected. No external observation target/date evidence is claimed.

## Discovery and reconciliation

**Forward:** started from page/module startup, shell inline scripts, DOM actions, Beacon subscriptions, timers/lifecycle events, Admin feature registrations, every escrow entrypoint, service/CLI/configuration writers, package commands and Pages CI. Followed validation, transformations, requests, effects and outcome presentation through their consumers.

**Reverse:** independently located wallet operation requests, approvals, FA2/XTZ movements, privileged storage changes, filesystem/CMS writes, and consequential balance/supply/authority/readiness/LIVE/success decisions. Traced back to public and Admin actions, indirect events/background work, exported helpers, generator/watch/build commands, signer CLI and direct-chain calls. Submission, confirmation and refreshed balances were kept separate.

**Boundary:** followed wallet/network generations; canonical/mirror IDs; DOM/CMS editions and quantities through cart/Micheline/escrow mapping/FA2; cached/requested/rendered state; source JS/JSON/independent Admin mirror/provider; loopback API/filesystem recovery; and Webflow shell/router/environment loader/bundle/deployment ownership. Newly exposed metadata enrichment, GitHub checklist polling, asset/CMS tooling and signer provisioning were pursued below. Tracing stopped at explained source effects or explicitly inaccessible boundaries, not named modules.

Only after forming the candidate map was existing coverage consulted. It was an empty “NOT YET ENUMERATED” template: no old behavioral rows required retention/removal reconciliation. This is initial enumeration, not a post-audit refresh.

## Behavioral map

Paths are relative to Outer, including `admin-ui/` for the independent repository. “Escrow source” means the active SmartPy source linked below, not an originated contract. Expected properties derive from the intent/safeguards above and the stated interface; their satisfaction remains unaudited.

| Workflow | Observed path and consequential boundaries | Grounded expected properties | Relevant source locations |
| --- | --- | --- | --- |
| Public arrival/navigation/Utility | Four Webflow-derived shells load first paint, wallet and page modules. Fonts/hero, fail-open timeout, banner, image load/error, Webflow navigation/tabs and inline marquees/Utility connectors affect access. Outgoing marketplace links leave app authority. THE WAVE/ETH has presentation but no bridge/mint implementation found. | Available, truthful network/action presentation; presentation cannot grant financial authority. | [Home shell](../index.html), [Drops shell](../drops/index.html), [Exchange shell](../exchange/index.html), [Utility shell/runtime](../collection-utility/js/main.js), [Utility markup](../collection-utility/index.html), [first paint](../shared/public-first-paint.js), [Webflow Home entry](../webflow/home.js) |
| Network/escrow/token identity | Registry supplies public adapters, Admin live targets, collection addresses, pair-map paths/ranges and HEN/INTRODUCTIONS mirrors. Dedicated/fallback/incomplete-config rules differ by surface. Admin presentation translates canonical IDs. | Exact chain/escrow/FA2/token meaning across transformations; incomplete configuration cannot imply readiness. | [registry/resolvers/validators](../shared/chain-registry.js), [public network](../shared/network.js), [Drops config](../drops/js/events-config.js), [Exchange config](../exchange/js/exchange-config.js), [Admin network](../admin-ui/src/network.js), [live targets](../admin-ui/src/utils/live-cfg.js), [HEN IDs](../admin-ui/src/utils/hen-ids.js) |
| Public wallet lifecycle/holdings | Beacon client reuse, version-gated Matrix cleanup, permission requests and persisted-account network validation feed desktop/mobile controls. Startup/`ACTIVE_ACCOUNT_SET` publish document `publicWalletStateChanged` with account/NFT promise; Drops/Exchange own pending/error/retry/generation projections. Disconnect also emits `walletDisconnected`. TzKT supplies FA2 holdings. | Current verified wallet/network owns actionable state; obsolete observations cannot authorize later effects; unknown holdings differ from empty. | [wallet lifecycle/fetchNFTs](../shared/beacon-setup.js), [Drops synchronization](../drops/js/events.js), [Exchange synchronization](../exchange/js/exchange.js) |
| Drops configuration/catalog/selection | Bundled params drive scheduled/no-drop gates, details, exclusions and redeem preview. Captured CMS templates provide canonical IDs/labels/images; wallet holdings and mirror map produce eligible rows, burn thresholds and exclusive selection. Metadata/image/supply and wallet reveal owners are separate. | Preserve configured identity/amount/exclusions through CMS-to-wallet projection; metadata is not ownership; terminal unavailable states remain explicit. | [params entry](../shared/drop-params/index.js), [authored params](../shared/drop-params/drop-params.js), [Drops initialization/render/cart](../drops/js/events.js), [identity renderer](../drops/js/token-rendering.js), [reveal barrier](../drops/js/reveal-coordinator.js), [early masks](../webflow/drops-first-paint.js) |
| Drop time/pause/inventory availability | Shared calendar/DST conversion feeds trusted UTC sampling from timeapi.io with latency/age/clock/lifecycle invalidation and retries. Expiry enters standby then polls escrow storage for unpause. Initial/current escrow redeem holdings drive supply, sold-out and visible/live-phase polling; state feeds button action. | Countdown is not unpause authority; unknown time/storage/supply cannot become confident LIVE/sold-out/readiness; retired owners cannot publish. | [calendar conversion](../shared/drop-time.js), [trusted clock/countdown](../shared/drop-countdown.js), [pollForUnpause, startCountdown, supply/button state](../drops/js/events.js) |
| Drops burn/redeem and refresh | Selected contract/token/balance becomes configured-amount trade. Approval/pair reads precede final wallet/selection check, approval-first Beacon batch and `initiate_trade`. Hash confirmation precedes success/explorer; expected balance-reduction polling, confirmed-trade retention and retry handle refresh/account changes. | Exact wallet/terms/recipient at effect; distinguish request, application and holdings freshness; uncertain refresh must not authorize duplicate burn. | [handleEventExchange/balance guards](../drops/js/events.js), [trade helpers](../shared/public-trade-ops.js), [escrow initiate_trade](../contracts/burn-redeem-escrow/smartpy/burn-redeem-escrow-smartpy.py) |
| Exchange cart/economics | 419/CANAAN CMS rows receive registry attributes. Verified holdings enable quantities; add/remove/clear and totals use `ceil(100 / editions)`. Pending/disconnected/error/empty states and bottom actions depend on balance verification; send re-reads cart. | Owned quantities, exact identity, editions, derived amount and totals agree; unknown/malformed inputs cannot create actionable value. | [CMS shell](../exchange/index.html), [getEditionCount/getBurnCart/processWalletNFTs/updateTotal](../exchange/js/exchange.js), [config](../exchange/js/exchange-config.js) |
| Exchange multi-token submission | Each quantity expands into unit-burn trades grouped by FA2, redeeming ACID COIN #0 at derived per-unit amount. Approval/pair reads, final account/cart checks, Beacon send, scoped confirmation, reset and confirmed-trade balance refresh/retry use wallet generations/in-flight ownership. | Per-unit/whole-batch amounts and mappings agree; current wallet authorizes effect; truthful submitted/confirmed/refreshed outcomes. | [handleExchange/post-trade lifecycle](../exchange/js/exchange.js), [shared helpers](../shared/public-trade-ops.js), [escrow source](../contracts/burn-redeem-escrow/smartpy/burn-redeem-escrow-smartpy.py) |
| Shared approval/pair/outcome evidence | Both clients page active mapping for unique exact six-term match; operator reads check owner/operator/token and build missing `update_operators`, with add-approval fallback on read error. Approvals persist at external FA2. Operation polling matches destination/entrypoint/status; NFT polling separately compares starting quantity reduction. | Preserve approval authority and exact trade terms; failed/partial/ambiguous evidence is not confirmed application or complete balances. | [fetchTokenPairId/buildApprovalOps/pollForConfirmation/pollForNFTUpdate](../shared/public-trade-ops.js), [Drops caller](../drops/js/events.js), [Exchange caller](../exchange/js/exchange.js) |
| Admin boot/wallet/network switching | DOM startup wires both surfaces and providers; leaving Drops closes shared pair modal. Beacon validates accounts and emits document `wallet:disconnected`. Selector clears account, persists network then reloads. Localhost development dynamically imports authoring; production uses static provider. | Visibility grants no privilege; current verified account/target owns effects; switching retires old authority/state. | [bootstrap](../admin-ui/src/admin.js), [Beacon](../admin-ui/src/beacon-setup.js), [switch lifecycle](../admin-ui/src/network.js), [wallet helper](../admin-ui/src/utils/wallet.js), [ensureAccount](../admin-ui/src/escrow-ops.js) |
| Admin authority/status/manual pause | Indicator polls wallet/admin storage, caches authority by context. Exchange diagnostics and parameterized pause controllers read paused/admin/burn address; toggle sends then polls storage change. Document versus panel `escrow:paused:state` informs Drops gates/checklist. Privileged Exchange resolution rejects legacy fallback. | Only chain admin controls pause; stale/unknown observations cannot assert privilege/live state; unpause remains deliberate operator action. | [indicator](../admin-ui/src/features/admin-indicator.js), [Exchange status](../admin-ui/src/features/exchange-status.js), [pause controllers](../admin-ui/src/features/pause.js), [targets](../admin-ui/src/utils/live-cfg.js), [builder](../admin-ui/src/escrow-ops.js), [Drops consumer](../admin-ui/src/features/drops/drops.controller.js) |
| Admin treasury FA2 inventory/rescue | Separate surface buckets fetch target storage/holdings and enrich rows. Recipient/amount submission builds one `admin_transfer_token` per item, waits for every intended external transaction, emits namespaced submitted/confirmed events and schedules refreshes; Drops checklist consumes relevant events. | Exact target/token/amount/destination and admin-only movement; incomplete inventory/partial or unknown outcomes cannot imply full success. | [orchestration](../admin-ui/src/features/treasury/orchestrate.js), [surface config](../admin-ui/src/features/treasury/treasury.config.js), [transfer](../admin-ui/src/features/treasury/transfer.controller.js), [rows](../admin-ui/src/features/treasury/table.render.js), [holdings API](../admin-ui/src/tzkt-api.js), [builders/result polling](../admin-ui/src/escrow-ops.js), [checklist](../admin-ui/src/features/drops/drops.checklist.controller.js) |
| Admin XTZ balance/Max/withdrawal | Account/target-bound snapshots format mutez for balance/Max and invalidate on wallet/network events. Decimal input converts to mutez, submits `admin_withdraw_xtz`, confirms intended operation and refreshes. Recipient is storage admin. | Exact XTZ/mutez and snapshot authority; unknown is not zero/Max; submission, failure, unknown and application differ. | [withdraw controller](../admin-ui/src/features/treasury/withdraw.controller.js), [conversion](../admin-ui/src/features/treasury/fetchers.js), [builder/result polling](../admin-ui/src/escrow-ops.js), [escrow withdrawal](../contracts/burn-redeem-escrow/smartpy/burn-redeem-escrow-smartpy.py) |
| Admin Drops pair create/edit/cleanup | Paged mappings normalize six terms/range-filter rows. Set panel checks ID availability, collection/token/custom input and amounts; modal refreshes/edits baseline; cleanup consumes selected IDs. Builders send set/update/cleanup, legacy boolean confirmation triggers refresh/final events; asynchronous forms have epochs/session guards. | Admin-only intended-ID/term mutation; create cannot overwrite; updates/cleanup/events must retain exact meaning and target. | [controller](../admin-ui/src/features/pairs/pairs.controller.js), [data](../admin-ui/src/features/pairs/pairs.data.js), [set panel](../admin-ui/src/features/pairs/setpanel.controller.js), [validation](../admin-ui/src/features/pairs/setpanel.validators.js), [modal](../admin-ui/src/features/pairs/modal/modal.controller.js), [builders](../admin-ui/src/escrow-ops.js), [paged API](../admin-ui/src/tzkt-api.js) |
| Admin Exchange pair management | Separate table/set/edit targets THE EXCHANGE, gates to `testnet`, checks range/active ID and locks redeem side to ACID COIN #0. Shared forms feed Exchange-specific set/update wrappers, confirmation and refresh. | Dedicated target/financial terms survive shared UI; chain authority remains independent of UI/network gating. | [Exchange pairs/wrappers](../admin-ui/src/features/pairs/exchange-pairs.js), [set panel](../admin-ui/src/features/pairs/setpanel.controller.js), [modal](../admin-ui/src/features/pairs/modal/modal.controller.js), [builders](../admin-ui/src/escrow-ops.js) |
| Admin drop snapshot/load/preview | Production validates/freezes bundled mirror; local provider publishes verified snapshots into `updateParams`. Normalizer handles enabled collections, mirrors/exclusions/explicit pairs; builder allocates/chunks IDs. Startup preview, auto next-ID search, input/manual load, overlap checks, source/reset/network changes and status/countdown have distinct cached intent/epochs. | Source ownership, exact translated IDs/counts, collision-free reviewed intent and stale-state retirement across requested/cached/rendered boundaries. | [provider](../admin-ui/src/features/drops/drop-params.provider.js), [controller](../admin-ui/src/features/drops/drops.controller.js), [load paths](../admin-ui/src/features/drops/drops.load.service.js), [normalizer](../admin-ui/src/features/drops/drops.data.js), [builder](../admin-ui/src/features/drops/drops.builder.js), [translation](../admin-ui/src/features/drops/utils/validate-translation-audit.js), [state](../admin-ui/src/features/drops/drops.state.js), [panel events](../admin-ui/src/features/drops/drops.view.panel.js) |
| Admin drop batch send | Send validates cached/source terms, counts/chunks/view signature, network/escrow and verified pause. Sequential `set_token_pairs` chunks check ownership around account awaits, retain hash/status history, stop on uncertainty, refresh pair/status/checklist. Retiring UI cannot undo submitted chunks. | Reviewed intent equals payload at effect; no obsolete source/network/pause authorization; partial batches are not all-confirmed success. | [send validation](../admin-ui/src/features/drops/drops.controller.js), [send/history](../admin-ui/src/features/drops/drops.send.service.js), [builder/confirmation](../admin-ui/src/escrow-ops.js), [status consumers](../admin-ui/src/features/drops/drops.status.service.js) |
| Admin lifecycle/readiness/checklist | Trusted countdown enters standby then polls storage for live. Pair status compares intended terms with mapping: full/partial/missing/verification-required. Checklist combines pause/health/CMS, minted existence, planned/held supply, treasury, depletion and raw GitHub staging/main params equality, with polling/visibility/epoch resets. | Unknown/provenance/scope remain explicit; planned/remaining/redeemed supply and Git equality differ; neither countdown nor Git match proves deployment readiness. | [countdown](../admin-ui/src/features/drops/drops.countdown.service.js), [pair comparison](../admin-ui/src/features/drops/drops.pairs.status.js), [checklist/GitHub polls](../admin-ui/src/features/drops/drops.checklist.controller.js), [controller state](../admin-ui/src/features/drops/drops.public-state.js), [shared clock](../shared/drop-countdown.js), [API](../admin-ui/src/tzkt-api.js) |
| Admin health/CMS/economics | Startup/manual health enumerates token IDs and checks local titles/thumbs. Uploaded/stored per-network/collection CSV validates/translates IDs, compares local assets and chain circulating editions/ACID; balance sums exclude burn sink. Results feed summary/checklist; recheck/clear, row ownership and economics TTL/in-flight cache affect conclusions. | Unknown/incomplete differs from zero/mismatch/healthy; CSV, editions and formula share identity; local checks cannot prove published CMS equality. | [health](../admin-ui/src/features/health/health.controller.js), [CMS checks](../admin-ui/src/features/health/health.cms.js), [CSV parser](../admin-ui/src/utils/parse-csv.js), [persistence](../admin-ui/src/utils/cms-store.js), [economics](../admin-ui/src/utils/token-econ.js), [checklist consumer](../admin-ui/src/features/drops/drops.checklist.controller.js) |
| Admin labels/catalogs/presentation caches | Local titles/thumb manifest map canonical/mirrored identities for forms, previews, treasury, authoring and health. Chain UI layers memory/persistent cache, catalog and local NFT resolver. TzKT catalogs enumerate tokens; pair-modal warm can enrich metadata via HTTP/IPFS. TTL/network invalidation and UNDEFINED affect display. | Cached/enriched presentation cannot alter transaction identity or establish ownership/existence; preserve context and truthful missing labels. | [chain UI](../admin-ui/src/adapters/chain-ui.js), [catalog/enrichment](../admin-ui/src/adapters/collection-catalog.js), [NFT resolver](../admin-ui/src/utils/nft.js), [cache](../admin-ui/src/utils/cache.js), [titles](../admin-ui/src/titles.manifest.js), [thumb manifest](../admin-ui/src/thumbs.manifest.js), [modal choices](../admin-ui/src/features/pairs/modal/modal.view.content.js) |
| Local authoring UI/provider handoff | CREATE/EDIT/archive-DEACTIVATE use token/exclusion forms, lifecycle warnings, validation, preview, acknowledgement and apply. Edits retire preview; health refresh/retry and source-version/operation-guarded read-back publish immutable snapshots into Drops. Production is static. | Applied fields/source equal reviewed preview; offline/busy/drift/reconciliation cannot appear committed; authoring itself changes no chain state. | [entry/consumer](../admin-ui/src/features/drops/authoring/index.js), [controller](../admin-ui/src/features/drops/authoring/authoring.controller.js), [token serialization](../admin-ui/src/features/drops/authoring/authoring.tokens.js), [client](../admin-ui/src/features/drops/authoring/authoring.client.js), [dev provider](../admin-ui/src/features/drops/authoring/drop-params.provider.dev.js) |
| Loopback authoring API | `127.0.0.1:47831` validates Host/origin/method/route/body limit/nonce. State/validate/preview/apply expose snapshot and expiring single-use hash-bound preview. Apply rechecks repository/writer state and invokes writer; startup probes existing service/repository identity. | Local scoped browser-to-filesystem authority; preview is not write; stale/replayed/ambiguous request is not successful apply. | [service/API/probe](../shared/drop-params/drop-params-authoring-service.mjs), [launcher](../scripts/drop-params-authoring-service.mjs), [schema/serializer](../shared/drop-params/drop-params-authoring.mjs), [Admin client](../admin-ui/src/features/drops/authoring/authoring.client.js) |
| Transactional config/archive/recovery | CLI create/edit/deactivate and API share source-version checks, operation-ID idempotence, base/projection verification, staged/hash-verified replacement and durable journals. Deactivation archives first. Lock claims coordinate; reconciliation recognizes target/base or restores exact snapshots; failed rollback blocks. CLI status/reconcile is an alternate entry. | Consistent authoritative source/consumers or explicit fail-closed state; recover interruption without deleting evidence; immutable archive before deactivation. | [CLI](../scripts/drop-params-transaction.mjs), [writer/reconcile](../shared/drop-params/drop-params-transaction.mjs), [archive](../shared/drop-params/drop-params-archive.mjs), [locks/atomic paths](../shared/drop-params/drop-params-projector.mjs), [strict schema](../shared/drop-params/drop-params-authoring.mjs) |
| Projection/mirror propagation | Generator, queued/debounced watcher, Outer build/dev and Admin sync evaluate/validate source JS and project through shared lock/atomic helpers. Public imports source package; Admin bundles mirror. Direct generator/watch paths are distinct from transaction journal decisions. | Source owns generated copies; cross-repository equality, concurrent rebuild behavior and failures/drift remain visible on every write path. | [generator](../shared/drop-params/gen-drop-params-json.mjs), [watcher](../shared/drop-params/watch-drop-params-json.mjs), [projector/equality](../shared/drop-params/drop-params-projector.mjs), [Outer commands](../package.json), [Admin commands](../admin-ui/package.json), [mirror guard](../admin-ui/scripts/build-guard-drop-params-mirror.mjs) |
| Direct escrow trade/FA2 custody | Any caller bypasses UI via `initiate_trade`: unpaused/nonempty check, per-trade mapping/six terms/sender-user validation, grouped burn/redeem transfers and trade events. Burn moves caller tokens to stored sink; redeem moves custody to caller. Direct FA2 transfer can fund escrow. Approvals/balances/rejection/rollback cross external FA2/chain. | Every batch entry preserves sender/recipient/terms, conservation and failure atomicity. Sink transfer is not proof of FA2 supply destruction. | [escrow initiate_trade/FA2_TRANSFER_TYPE](../contracts/burn-redeem-escrow/smartpy/burn-redeem-escrow-smartpy.py), [Drops serializer](../drops/js/events.js), [Exchange serializer](../exchange/js/exchange.js), [approvals](../shared/public-trade-ops.js) |
| Direct privileged pair mutation | Admin set creates new positive/different-FA2 pairs and increments size; update changes existing terms/emits changed fields; cleanup deletes present IDs/decrements size and reports missing IDs. These calls bypass preview/pause/checklist UI restrictions. | Admin authority, exact mapping/cardinality and truthful single/batch/duplicate/missing-ID outcomes; no assumed UI-only restrictions on chain. | [escrow constructor/set/update/cleanup](../contracts/burn-redeem-escrow/smartpy/burn-redeem-escrow-smartpy.py), [Admin builders](../admin-ui/src/escrow-ops.js), [drop caller](../admin-ui/src/features/drops/drops.send.service.js), [signer CLI](../scripts/shadownet-exchange-pairs.mjs) |
| Direct pause/rescue/XTZ | Constructor fixes admin/burn address and paused/empty mapping. Direct admin toggle, arbitrary FA2 rescue to supplied recipient and positive XTZ withdrawal to stored admin emit events. Default accepts positive tez; attached tez on other entrypoints is also a boundary. No admin-replacement entrypoint found. | Admin-only custody/pause; exact amounts/destinations/events; account for tez ingress and external-call rejection/atomicity independently of UI. | [escrow verify_admin/toggle/rescue/withdraw/default](../contracts/burn-redeem-escrow/smartpy/burn-redeem-escrow-smartpy.py), [explicit/default-target helpers](../admin-ui/src/escrow-ops.js) |
| Signer-backed Exchange provisioning | Default dry-run validates 44 fixed pairs, registry and artifact hash/ABI. `--verify` reads RPC block/mapping/cardinality; explicit execute/provider imports signer, checks chain/admin/empty IDs, matches Taquito payload, sends, confirms and reads back. Bypasses Beacon/Admin. | Fixed chain/target/admin/payload provenance; dry-run cannot transact; confirmation differs from exact read-back. | [provision/verify/execute](../scripts/shadownet-exchange-pairs.mjs), [registry](../shared/chain-registry.js), [confirmation](../shared/public-trade-ops.js), [promoted Michelson](../contracts/burn-redeem-escrow/artifacts/burn-redeem-escrow-audited.tz) |
| Contract provenance/origination | Legacy source with embedded fixtures, frozen certified/promoted Michelson and historical check artifact have distinct roles/identities. Deployment note directs frozen release use; certification/promotion/deployment records are separate claims. Configured addresses/ABI consumers still require originated identity evidence. | Preserve release provenance/interface; source/repository/historical test identity does not certify deployed code/storage. | [source](../contracts/burn-redeem-escrow/smartpy/burn-redeem-escrow-smartpy.py), [deployment note](../contracts/burn-redeem-escrow/artifacts/deployment-notes/audited-release.md), [manifest](../docs/EA-XYZ%20Contract%20Audit/release/RELEASE-CANDIDATE-MANIFEST.md), [promotion](../docs/EA-XYZ%20Contract%20Audit/release/PHASE-10-PROMOTION-RECORD.md), [deployment record](../docs/EA-XYZ%20Contract%20Audit/release/PHASE-11-SHADOWNET-DEPLOYMENT.md) |
| Thumbnail/site asset authoring | Outer input converts images, allocates Admin master keys, regenerates Admin manifest, archives input and rolls back output/manifest on failure. Backfill clears managed review images/writes candidates/report. Admin generator/check detects stale/duplicate IDs. One-off optimizers produce local derivatives. | Asset/token identity, originals, exclusive writes and recovery across repositories; manifest matches shipped files. | [thumbnail workflow](../assets/thumbs/scripts/thumbs.mjs), [input launcher](../assets/thumbs/RUN_INPUT.cmd), [backfill launcher](../assets/thumbs/RUN_BACKFILL.cmd), [Admin generator/check](../admin-ui/scripts/gen-thumbs-manifest.mjs), [consumer](../admin-ui/src/utils/nft.js), [coin optimizer](../scripts/optimize-coin-image.mjs), [logos](../scripts/optimize-site-logos.mjs) |
| Exported Webflow CMS/asset effects | Library exports paged staged/live item/site-asset reads, asset creation/upload, field/image patch and publication. GET retries differ from mutations; content verification, naming, staged/live comparison, ambiguous-write read-back and redacted atomic evidence writes are distinct effects. No active application/CLI caller found. | Exact authorized site/collection/item/locale/asset; unknown writes cannot be blindly retried or claimed applied/unapplied; protect credentials. | [CMS client/upload/comparison/reconciliation](../assets/webflow-cms/webflow-cms.mjs) |
| Public delivery/build/Pages | Parcel generates environment artifacts after JSON. Four root routers select host environment; environment loaders start first-paint/page siblings with isolated errors. CI builds main/prod and staging/staging, checks JSON freshness, copies main-owned roots/prod loaders and staging loaders, strips maps, verifies graph/provenance then uploads/deploys under Pages permissions/concurrency. | Source/environment ownership and loader payloads agree; failures cannot silently select another financial environment; preserve release gates. | [commands](../package.json), [root routers](../loaders/root/home.js), [Drops](../loaders/root/drops.js), [Exchange](../loaders/root/exchange.js), [Utility](../loaders/root/collection-utility.js), [Home loader](../loaders/environment/home.js), [Drops loader](../loaders/environment/drops.js), [Exchange loader](../loaders/environment/exchange.js), [Utility loader](../loaders/environment/collection-utility.js), [CI](../.github/workflows/pages.yml), [artifact verifier](../scripts/verify-pages-loader-artifacts.mjs) |
| Admin production/local development/harness | Admin build checks thumbs, syncs/guards mirror, bundles, prunes authoring chunks and checks isolation. Dev runs watchers/service/Parcel. Outer dev checks port/starts watcher/Parcel; sanity rewrites shell script references, copies loaders and serves/opens local harness. These commands write/start processes; none ran here. | Development filesystem authority stays out of production; harness/build output is not deployment evidence; preserve assets and operational state. | [Admin commands](../admin-ui/package.json), [isolation verifier](../admin-ui/scripts/verify-production-authoring-isolation.mjs), [pruner](../admin-ui/scripts/prune-production-authoring.mjs), [Outer commands](../package.json), [port check](../scripts/check-dev-port.mjs), [Parcel wrapper](../scripts/parcel-dev.mjs), [harness](../scripts/sync-test-harness.mjs), [server](../scripts/run-sanity-server.mjs) |

## Exclusions, inaccessible boundaries and uncertainties

- No live Webflow/CMS, browser, wallet/Beacon transport, RPC/TzKT, timeapi.io, GitHub raw content, IPFS/metadata gateway, external FA2 or Pages/hosting observation occurred. Request/response seams are enumerated; provider correctness, pagination guarantees, consistency, CORS/caching, wallet signing, finality/reorg and external execution remain unverified. Source-visible URLs/addresses are not observed deployments.
- External FA2 source/operator/ledger behavior, originated escrow bytecode/storage/admin/sink, balances/funding and operation/event history are unavailable source boundaries. Direct callers are included; live compatibility/atomicity require separate evidence. Embedded MockFA2 is a fixture. Legacy SmartPy was not compiled/executed; historical certification/test artifacts are provenance context, not rerun or adopted as clean evidence.
- Tracked shells represent CMS/editions/Webflow references, not complete current live custom code, interactions or publication. Deployed loader revisions, hosting/DNS/settings/secrets remain unverified. Future CMS authoring/minting, Ethereum/THE WAVE and proposed Webflow migration are plans/presentation, not implemented paths found here. Marketplace behavior after navigation is excluded.
- Persistence/recovery producers and consumers were traced, without treating ignored journal/lock history, browser storage/caches, image masters/exports, earlier review exports or generated dist/sanity output as current runtime truth. Those assets were preserved. Admin `drops.data.js` file/URL/JS parsing exports have no current runtime caller; dormant remote NFT recovery does not replace local-only `getTokenUi`. Catalog enrichment remains reachable through pair-modal warm. Inert `exchange-custody.js` is not a second treasury controller.
- **Checkout observation, not a defect finding:** authored source, Outer JSON and Admin mirror parse to equal values. JSON is 519 bytes with LF; mirror is 550 bytes with CRLF. They match after newline normalization but not byte-for-byte. Since pipeline checks include semantic and byte equality, checkout normalization is material for subsequent examination. No generator/sync/service/recovery was run to change or diagnose behavior.
- Grounded financial/authority/truthfulness properties above do not settle every exceptional provider-outcome requirement. [Known issues](../docs/known-issues.md) remain prior evidence to reassess during audit; none is resolved, newly confirmed or dismissed here. No new defect reproduction/remediation ticket was produced.

## Historical AUD-002 result and focused verification

**AUD-002: COMPLETE — WITH FINDINGS — 2026-11-03.** This supersedes the enumeration-only status above and the November 2 partial result for the current investigation; AUD-001's map/context remains the historical baseline. Reviewed Outer `d0f2c293a2896174eb816677f0f32a017657398f` on `ticket-AUD-002-first-correctness-pass` and independent Admin `c831010483b3bd1e49f94c279045d1f008d6e5be` on `codex`. Revisions are unchanged at continuation; Outer contained only the expected prior coverage-result edit, and Admin remained clean/read-only. Only this result note and ignored working evidence change. No material source change or behavioral-map amendment was needed; the methodology is unchanged.

**All 33 source-level workflow examinations are complete; none remains partial or unexamined.** The continuation closes the previous 16 partial and five unexamined rows, retaining the twelve completed examinations against unchanged source. The [AUD-002 findings report](AUD-002-findings.md) records source/property reasoning, exact preconditions, controls, evidence and external limitations. Eleven AUD-002 findings remain: the original four plus accepted configuration/Public identity mismatch, rounded cleanup IDs, missing initial-supply recovery with actionable trade, conditional insufficient confirmation evidence, CMS write-outcome ambiguity, concurrent thumbnail rollback and amount-only edit changing an unlisted token to zero. Confirmation evidence failure is demonstrated with partial/misattributed provider fixtures; no live TzKT incident is asserted. All seven existing known issues remain confirmed/unresolved. The three prior hypotheses are resolved to these qualified findings; no remediation is implemented.

Executed evidence retains the original inert reproductions/config failure controls, 163 Public tests, 1,092 Admin runtime tests, seven signer-tool tests and 15 shared trade fixtures. New continuation/API/listener and isolated asset reproductions pass with controls; thumbnail tests (6), CMS tests (16), loader architecture and Pages artifact graph checks pass. Unchanged large suites were reused, not rerun. Source/frozen/promoted artifact identities and historical deployment-bundle hash agree with their records; parsing/historical evidence does not establish current deployed correctness. External Webflow/browser/wallet/provider/FA2/hosting integrations, real crash durability and legacy compilation remain unverified. Builds and real-path config suites were skipped to preserve read-only boundaries. Exact commands, evidence and limitations are in the tracked findings report, with four preserved inert scripts under `audits/repro/`. Temporary fixtures and large logs remain in ignored `audits/work/`; the original ignored evidence is retained. No public `audits/report.md`, clean result or post-clean refresh is claimed. Final whitespace/diff/export checks and exact export filenames accompany the universal handoff.
