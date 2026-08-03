# WF-MIG.6 Implementation Plan

## Guiding constraints

- The selected architecture is generated static HTML with targeted client enhancement. The first pass preserves current DOM selectors, hierarchy, copy, network/wallet contracts, transaction pipelines, and the four responsive families.
- Webflow stays read-only except for a separately authorized rollback action. It remains the published comparator and rollback source through the approved monitoring window.
- Canonical SOURCE is structured Git data, templates, local CSS/assets/fonts, existing Git runtime/config, and pinned build scripts. Generated HTML and `dist/site` are not edited by hand.
- Migration-critical work is separated from cleanup. No selector normalization, `.w-*` purge, framework adoption, CSS redesign, content redesign, asset optimization, route retirement, mainnet enablement, or runtime relocation occurs on the critical path.
- Every phase is independently reviewable, has a rollback point, and cannot pass on assertion alone. Confirmed audit facts, new captured evidence, and explicit unresolved items remain distinguishable.
- Phase numbers are architectural workstreams. Ordered implementation tickets in `06-ticket-backlog.json` subdivide them and are the execution dependency authority.

## Phase 1 — Baseline and freeze

- **Objective:** establish the exact published comparator and prevent the saved/published ambiguity from contaminating later imports.
- **Prerequisites:** WF-MIG.1-WF-MIG.6 committed evidence; read-only access to the exact site `656cf42faa2b1a7a1582d9d2`; authorization to write only baseline fixtures/artifacts in the later ticket.
- **Dependencies:** WF-MIG.7 is the first implementation ticket and depends only on the accepted WF-MIG.6 plan and read-only published-site access.
- **Scope:** capture HTTP status/headers/head/body/DOM, exact stylesheet and runtime URLs/hashes, all four static routes, representative/all 66 item routes as required, unknown-path behavior, four responsive screenshot families, material states, Collection Utility structure, current external network inventory, and content timestamps; define content freeze and fixture sanitization.
- **Permitted changes:** sanitized migration fixtures, audit manifests, screenshots, and freeze documentation only; no site source, dependency, or Webflow change.
- **Deliverables:** versioned published snapshot manifest; sanitized DOM/HTTP fixtures; screenshot inventory; exact Collection Utility recovery evidence; CSS/runtime hashes; content-freeze record; difference policy draft.
- **Validation gate:** site ID exact; route inventory reconciles with WF-MIG.1; captured static/CMS responses parse; Collection Utility source gap is bounded; no secret/session data is retained; snapshot manifest hashes verify.
- **Rollback point:** no production mutation; discard/recreate local fixtures from the still-published Webflow baseline.
- **Risks:** CDN nondeterminism, session/wallet-dependent states, saved-versus-published difference, inaccessible headers/metadata.
- **Completion criteria:** a reviewer can reproduce which published bytes/DOM/screenshots define parity and identify every value intentionally not captured.

## Phase 2 — Asset and font ownership

- **Objective:** establish independent, lawful, content-equivalent ownership of 13 material site assets, 66 CMS media records, responsive variants, and required fonts.
- **Prerequisites:** Phase 1 manifest and freeze; explicit download/redistribution authorization; known source URLs/file IDs; target naming policy.
- **Dependencies:** WF-MIG.8 and WF-MIG.9 consume the same frozen WF-MIG.7 baseline; their outputs constrain data paths, CSS, widgets, and generation.
- **Scope:** acquire exact bytes; record hash/MIME/dimensions/animation/provenance; compare local thumbnail candidates; resolve HEN sparse-main-ID versus mirror-index asset mapping; preserve favicon/webclip/hero/banner/logo/state art; identify Changa One 400 normal/italic and Inconsolata 400/700 binaries and licenses; plan/prep local font-face/preloads; replace webflow-icons with an owned menu glyph in the later widget phase.
- **Permitted changes:** authorized asset/font files, acquisition/provenance manifests, naming/mapping tests, and isolated delivery definitions; no public integration or content redesign.
- **Deliverables:** acquisition/provenance manifests; canonical local asset tree; responsive variant records; equivalence results; HEN asset adapter specification and tests; font license/binary decision.
- **Validation gate:** 13/13 material site assets and 66/66 media records accounted for; hashes and dimensions recorded; animated assets remain animated; no ambiguous HEN lookup; all distributed fonts have verified provenance and metric baselines.
- **Rollback point:** keep current Webflow URLs active; imported files are unused until integration passes.
- **Risks:** unavailable source binaries, encoded-byte differences, unverified local candidate equivalence, licensing restrictions, missing responsive variants, animation/reduced-motion differences.
- **Completion criteria:** every future local path maps to verified content/provenance and font delivery has an approved independent route; unresolved equivalence is explicitly blocking.

## Phase 3 — Structured content

- **Objective:** create the canonical four-collection/66-item Git model without changing public behavior.
- **Prerequisites:** Phase 1 frozen item snapshot; Phase 2 canonical asset naming and HEN mapping decision; `06-data-model.json` accepted.
- **Dependencies:** WF-MIG.10 depends on WF-MIG.7/.8; WF-MIG.11 depends on the acquired assets and canonical records; current `shared/chain-registry.js` remains the contract/mirror authority.
- **Scope:** import exact titles, IDs, Editions, 35 Mint Dates, 66 slugs, labels, image paths/alts, and explicit list order; reference registry contracts/mirrors; derive Name, 44 `$ACID` values, 35 OBJKT URLs, and active identities; retain Webflow publication/media metadata only in migration provenance.
- **Permitted changes:** new canonical schemas/data, import provenance, and read-only validators; no HTML generation, registry/network mutation, or runtime behavior change.
- **Deliverables:** schemas; collection records; four token data files; import/provenance fixture; validators; source-of-truth documentation.
- **Validation gate:** four collections, 66 items, 36 physical Webflow-field occurrences mapped; stable keys/slugs unique; exact-value reconciliation passes; derived values equal all audited values; HEN map complete/bijective; INTRO order explicitly 4,3,2,1,0.
- **Rollback point:** data is additive and not yet used to render production; remove the import patch without runtime impact.
- **Risks:** treating Editions/Mint Date as a new semantic, regenerating slugs, normalizing labels/titles, mixing active and main token IDs.
- **Completion criteria:** the entire CMS presentation dataset validates without Webflow reads and no unresolved field is disguised as derived.

## Phase 4 — Local presentation baseline

- **Objective:** reproduce current presentation locally before structural templating changes.
- **Prerequisites:** Phase 1 exact CSS hash/screenshots; Phase 2 local assets/font decision; Collection Utility capture complete.
- **Dependencies:** WF-MIG.12 consumes WF-MIG.7/.8/.9; WF-MIG.13 consumes the frozen Collection Utility evidence and the local presentation inputs.
- **Scope:** vendor the exact generated Webflow CSS baseline; localize URL references through a reviewed override/manifest; own load order, reset/base, inline page CSS, responsive rules, form/widget/state styles; reconstruct Collection Utility source using captured published evidence; keep existing three pages structurally unchanged for this phase.
- **Permitted changes:** local baseline/override CSS, CSS provenance/scanners, and the missing Collection Utility page source; no selector cleanup, redesign, or changes to the three existing page structures.
- **Deliverables:** immutable local baseline CSS with provenance; local URL/font override layers; Collection Utility local page source; four-route local presentation harness; stylesheet dependency scanner.
- **Validation gate:** no remote Webflow stylesheet request; CSS hash/provenance recorded; all four routes parse; four responsive families and first-paint/wallet static states match baseline within approved policy; Collection Utility DOM and assets reconcile.
- **Rollback point:** retain existing checked pages and remote CSS references on production; local presentation is tested only in isolated staging/harness.
- **Risks:** URL rewrites alter baseline bytes, missing Collection Utility serialization, CSS order drift, font metrics, hidden-first behavior masking content.
- **Completion criteria:** all four static pages can be rendered from local page/CSS inputs with no known missing visual dependency, while runtime remains unchanged.

## Phase 5 — Page generation

- **Objective:** replace snapshot/CMS authoring with deterministic templates and statically generated routes.
- **Prerequisites:** Phases 3 and 4; accepted DOM transition contract; output path/404 decisions from Phase 1.
- **Dependencies:** WF-MIG.14 depends on canonical data, CSS, and Collection Utility; WF-MIG.15 additionally depends on the HEN adapter and stable generator foundation.
- **Scope:** implement shared shell and page templates; generate Home, Collection Utility, Drops, Exchange; generate five CMS lists from canonical data; generate equivalent-empty compatibility pages for all exact slugs according to captured status behavior; emit route/asset manifests; retain selector-sensitive classes/hierarchy and existing entrypoint semantics.
- **Permitted changes:** build scripts, templates, generated-file policy, route/asset manifests, validators, and generated output; no client behavior rewrite or manual generated-output edit.
- **Deliverables:** build-time template foundation; row components with controlled HEN/INTRO and page/pane variants; complete `dist/site`; deterministic-build and source/output drift checks.
- **Validation gate:** all eight route families and all 66 item paths accounted for; five list contracts/97 current row occurrences reconcile; generated output parses; two clean builds are byte-equal except explicitly normalized metadata; no DOM identity derives from order.
- **Rollback point:** existing checked-in snapshots remain deployable and Webflow remains live; generated output is a separate artifact.
- **Risks:** abstraction erases list-specific differences, HTML escaping changes exact titles, template routes reproduce the wrong status/head, shared-shell drift changes wallet selectors.
- **Completion criteria:** a clean checkout deterministically produces a complete static artifact from canonical data and templates, with current runtime consumers still passing contract tests.

## Phase 6 — Widget and initialization replacement

- **Objective:** eliminate Webflow JavaScript and permanent-hide behavior without changing transaction semantics.
- **Prerequisites:** Phase 5 stable generated DOM; widget/accessibility baselines; current consumer tests; local CSS/font/assets.
- **Dependencies:** WF-MIG.16/.17/.18 depend on generated DOM and local CSS; Tabs integration also depends on generated CMS panes/rows; all converge before deployment.
- **Scope:** implement standalone Navbar; implement accessible Exchange Tabs; replace fixed 500 ms consumption with explicit Tabs readiness; implement visible-first/fail-open first paint; remove WebFont Loader, Webflow common/page runtime, and unnecessary jQuery only where proven unused by remaining Git code; retain wallet/network and transaction modules.
- **Permitted changes:** widget/first-paint modules, their markup/state CSS, narrowly required entrypoint/Exchange readiness integration, and focused tests; no transaction, network, route, or content redesign.
- **Deliverables:** Navbar/Tabs/first-paint modules and state CSS; integration contract/event; no-JS styles; browser/accessibility tests; forbidden Webflow runtime scan.
- **Validation gate:** Navbar pointer/keyboard/focus/ARIA/resize/wallet controls pass; Tabs pane/contract identity, keyboard/ARIA, initial state, and readiness pass; first-paint no-JS/slow/error/offline/font/image cases stay visible; no required Webflow JS request; Drops/Exchange transaction precondition fixtures remain unchanged.
- **Rollback point:** deploy prior generated artifact or current Webflow; each widget module is separately revertible before production.
- **Risks:** focus regression, hidden active controls, early Exchange identity read, changed event ordering, accidental removal of a jQuery consumer, altered first-paint layout.
- **Completion criteria:** all current Webflow widget/initialization behavior has an owned tested replacement and Webflow JS is absent from the artifact/network trace.

## Phase 7 — Deployment pipeline

- **Objective:** produce, validate, publish, identify, and roll back a complete static artifact reproducibly.
- **Prerequisites:** Phases 5-6 green; hosting capability inventory; staging/custom-domain/DNS access plan.
- **Dependencies:** WF-MIG.19 consumes all migration-critical assets/fonts/templates/data/widgets/runtime outputs and precedes every closure validation/cutover ticket.
- **Scope:** pinned clean CI build; content-hashed/versioned modules/assets; root-relative same-origin URLs; static directory routes and `404.html`; environment/hostname validation; deploy manifest; fetched-byte verification; cache policy; artifact retention; atomic promotion/rollback workflow.
- **Permitted changes:** build/deployment scripts/config, pinned tooling only when required, artifact/manifest production, and staging deployment; no production cutover or vendor change without capability evidence.
- **Deliverables:** CI/workflow and deployment config; release manifest; staging deployment; cache/route probes; rollback procedure and retained prior artifacts.
- **Validation gate:** clean build and validators pass; same artifact bytes reach staging/production promotion; direct/refresh nested routes work; fetched hashes match; no absolute GitHub Pages bundle dependency remains; hostname selects intended Shadownet behavior on staging.
- **Rollback point:** redeploy the prior immutable artifact or restore the Webflow domain target; DNS values and cache steps are documented before change.
- **Risks:** GitHub Pages limitations, custom-domain certificate/DNS delay, stale HTML cache, root-path assumptions, production/staging artifact divergence.
- **Completion criteria:** one identified artifact can be deployed and rolled back without rebuilding, and every fetched critical byte is attributable to its manifest.

## Phase 8 — Functional validation

- **Objective:** prove owned runtime behavior matches intended behavior before visual approval or cutover.
- **Prerequisites:** Phases 5-7 staging artifact; deterministic fixture states; approved Shadownet/manual accounts and transaction scope.
- **Dependencies:** WF-MIG.20 establishes machine contracts; WF-MIG.21 consumes that green artifact for browser/accessibility/wallet/transaction validation.
- **Scope:** automated static/DOM/accessibility smoke; Navbar; Tabs; Drops filtering/cloning/selection/cart; Exchange quantity/cart/identity; wallet disconnected/pending/connected/disconnect; persisted account; network switch; HEN mirror; transaction preconditions and safe Shadownet flows; no-JS/slow/offline/failed-asset behavior; all direct routes.
- **Permitted changes:** tests, fixtures, validation reports, and narrowly scoped fixes returned to the owning implementation ticket; no hidden implementation inside a validation-only patch.
- **Deliverables:** browser test suite/results; fixture inventory; manual transaction/wallet evidence; defect log classified by blocker severity.
- **Validation gate:** all AUTOMATED REQUIRED scenarios pass; manual wallet/network and authorized Shadownet scenarios pass; zero unresolved identity, transaction, route, or permanent-hide blocker.
- **Rollback point:** staging-only; fix or revert the owning ticket/artifact with Webflow unchanged.
- **Risks:** flaky chain/provider responses, insufficient transaction fixture coverage, tests asserting implementation rather than behavior, unsafe live-account use.
- **Completion criteria:** functional evidence covers every hard contract and cutover-blocking flow without mainnet enablement.

## Phase 9 — Visual and responsive validation

- **Objective:** establish visible and responsive parity under owned assets/fonts and failure states.
- **Prerequisites:** Phase 8 functional pass; owned screenshot baseline/difference policy; stable browser/version/viewport matrix.
- **Dependencies:** WF-MIG.22 consumes the frozen WF-MIG.7 screenshots and functionally green WF-MIG.21 artifact; WF-MIG.23 closes independence only after visual approval.
- **Scope:** Home, Collection Utility, Drops material states, Exchange material states; desktop/base and boundary-adjacent <=991/<=767/<=479 widths; font loaded/failed; image loaded/failed; pre/post enhancement; nav/tabs open states; wallet and modal states; animation/reduced motion; layout shift.
- **Permitted changes:** visual scenarios, baselines, difference-policy records, and fixes routed to owning source tickets; no screenshot-mask broadening or redesign.
- **Deliverables:** versioned screenshots; automated diffs; approved-difference records with rationale/owner; manual review record; updated blocker list.
- **Validation gate:** all required scenarios captured; differences are either within the defined threshold or explicitly reviewed; no unreviewed clipping, hiding, focus, typography, image, or breakpoint regression.
- **Rollback point:** staging artifact remains unpromoted; revert presentation/widget/asset changes by owning ticket.
- **Risks:** nondeterministic font/image timing, animations, environment-specific antialiasing, approving broad masks that hide regressions.
- **Completion criteria:** visual parity is evidenced, not inferred, across all pages, states, and responsive families required by WF-MIG.5.

## Phase 10 — Staging cutover

- **Objective:** dual-run the complete Git-owned site at a production-like staging origin and rehearse operations.
- **Prerequisites:** Phases 1-9 green; content freeze and final import reconciliation; staging DNS/TLS; rollback artifacts; monitoring probes.
- **Dependencies:** WF-MIG.24 requires WF-MIG.23 closure; its exact immutable artifact and successful rollback rehearsal are mandatory inputs to WF-MIG.25.
- **Scope:** deploy the exact candidate artifact; exercise custom-domain-like root paths, cache behavior, direct links, external dependencies, wallet/Shadownet behavior, transactions within approved scope, monitoring, and rollback rehearsal; compare against frozen Webflow.
- **Permitted changes:** staging deployment/configuration, final evidence/reconciliation, and rehearsed rollback operations; no production switch or Webflow mutation.
- **Deliverables:** staging URL/artifact ID; final route/network/dependency evidence; rollback rehearsal record; cutover checklist; approved exception list.
- **Validation gate:** no required Webflow request; all acceptance criteria marked passed or explicitly not-yet-applicable; rollback rehearsal succeeds; no unresolved BLOCKING BEFORE CUTOVER risk.
- **Rollback point:** redeploy prior staging artifact; Webflow production remains untouched.
- **Risks:** hostname-dependent network behavior, cache/CDN differences, late content drift, incomplete production-domain simulation.
- **Completion criteria:** the exact candidate artifact and operating procedure are approved for a separately authorized production cutover; this phase does not itself approve production.

## Phase 11 — Production cutover

- **Objective:** switch the production domain to the already validated immutable Git artifact while retaining immediate rollback.
- **Prerequisites:** explicit cutover approval; Phase 10 complete; DNS/custom-domain records and TTL/cache plan; content and Webflow freeze; on-call monitoring/rollback authority defined without assigning named people; transaction-safety checklist green.
- **Dependencies:** WF-MIG.25 depends strictly on WF-MIG.24 and the identical retained candidate artifact; WF-MIG.26 cannot begin closure until production monitoring evidence exists.
- **Scope:** verify artifact hashes; lower/invalidate caches as planned; switch deployment/domain; probe routes/assets/fonts/bundles; verify wallet/network and safe transaction preconditions; monitor errors and user-visible states; do not mutate/delete Webflow.
- **Permitted changes:** the explicitly approved production deployment/domain/cache operations and evidence records; no rebuild, source cleanup, mainnet change, or Webflow deletion.
- **Deliverables:** production artifact/deploy record; DNS/cache change record; post-deploy probe results; incident/rollback decision log; source-of-truth handoff record.
- **Validation gate:** fetched production bytes match candidate manifest; routes and external scan pass; intended network remains correct; wallet and transaction smoke pass; monitoring stays within approved thresholds.
- **Rollback point:** restore prior DNS/domain/deploy target or redeploy retained known-good artifact according to the rehearsed procedure; preserve all logs/evidence.
- **Risks:** DNS propagation, stale caches, certificate transition, environment-only wallet/provider behavior, unobserved browser variance.
- **Completion criteria:** production is serving the validated Git artifact and remains inside the defined monitoring window with a tested live rollback path. This does not authorize Webflow deletion.

## Phase 12 — Webflow rollback and decommission

- **Objective:** retain Webflow safely through the rollback window, then remove every operational dependency only after explicit approval.
- **Prerequisites:** Phase 11 stable for the approved evidence-based monitoring window; no unresolved blocking incident; rollback artifacts/baselines archived; all removal criteria passed.
- **Dependencies:** WF-MIG.26 depends on production stability, monitoring exit conditions, retained rollback evidence, and explicit decommission authority; WF-MIG.27 is optional and follows closure.
- **Scope:** monitor routes/errors/wallet/transactions/assets; keep Webflow frozen and recoverable; close source-of-truth handoff; verify no Webflow CSS/JS/CMS/assets/custom code/deployment dependency; detach domain/unpublish only through separately authorized reversible steps; retain non-destructive archive; schedule destructive deletion, if ever desired, as a distinct ticket.
- **Permitted changes:** monitoring/closure records and only the exact authorized reversible Webflow/domain decommission operations; no destructive deletion or optional cleanup.
- **Deliverables:** monitoring closeout; formal acceptance checklist; retained baseline and last Webflow rollback evidence; decommission record; post-cutover cleanup backlog.
- **Validation gate:** every REQUIRED removal criterion passes; conditionally required criteria are resolved; rollback window and retention policy satisfied; explicit decommission approval recorded; zero unresolved BLOCKING risk.
- **Rollback point:** until final approved detachment, point production back to frozen Webflow; after detachment, redeploy retained Webflow/static rollback according to the proven capability. No destructive deletion is part of this phase by default.
- **Risks:** premature decommission, expired credentials/domain ownership, losing historical baseline, treating low traffic as proof of parity.
- **Completion criteria:** Webflow has no runtime/presentation/CMS/asset/deployment role, approved retention is satisfied, and decommission is explicitly accepted.

## Deferred cleanup

The following is optional after the production rollback window unless a validation failure makes a specific item necessary: extract/refactor the vendored CSS baseline; remove dead `.w-*` helpers and repeated form wrappers/IDs; normalize `.intros-collection` only with coordinated consumers; relocate/rename `webflow/*.js`; remove jQuery after complete consumer proof; convert/compress images; introduce design tokens; add useful CMS item content; retire/redirect template routes; fix footer link inconsistencies; redesign alt text/content; improve reduced-motion treatment beyond parity; change tab hash/history behavior; adopt a framework; or redesign layouts. Each behavior-affecting cleanup requires its own baseline and rollback.

## Dependency graph

```text
WF-MIG.7 baseline/freeze
  ├─> WF-MIG.8 assets ─> WF-MIG.11 HEN adapter ─┐
  ├─> WF-MIG.9 fonts ──────────────────────────┤
  ├─> WF-MIG.10 structured data ───────────────┤
  ├─> WF-MIG.12 CSS localization ──────────────┤
  └─> WF-MIG.13 Collection Utility ────────────┤
                                                v
                                      WF-MIG.14 generation foundation
                                                v
                                      WF-MIG.15 CMS row generation
                                  ┌─────────────┼─────────────┐
                                  v             v             v
                             WF-MIG.16     WF-MIG.17     WF-MIG.18
                               Navbar        Tabs       first paint
                                  └─────────────┼─────────────┘
                                                v
                                      WF-MIG.19 deployment
                                                v
                                      WF-MIG.20 contract validation
                                      ┌─────────┴─────────┐
                                      v                   v
                                 WF-MIG.21           WF-MIG.22
                                  functional             visual
                                      └─────────┬─────────┘
                                                v
                                      WF-MIG.23 independence/route closure
                                                v
                                      WF-MIG.24 staging cutover
                                                v
                                      WF-MIG.25 production cutover
                                                v
                                      WF-MIG.26 rollback/decommission
                                                v
                                      WF-MIG.27 optional cleanup
```

WF-MIG.8, .9, .10, .12, and .13 may proceed in parallel only when their file allowlists do not overlap and each consumes the same frozen WF-MIG.7 manifest. Their outputs converge before generation. Cutover tickets remain strictly sequential.

## Critical path

The critical path is WF-MIG.7 → WF-MIG.8 → WF-MIG.11 → WF-MIG.10 (with the canonical asset naming constraint reconciled) → WF-MIG.12/WF-MIG.13 → WF-MIG.14 → WF-MIG.15 → WF-MIG.17/WF-MIG.18 (and WF-MIG.16 before removal of Webflow JS) → WF-MIG.19 → WF-MIG.20 → WF-MIG.21/WF-MIG.22 → WF-MIG.23 → WF-MIG.24 → WF-MIG.25 → WF-MIG.26. Font delivery (WF-MIG.9) must converge before local presentation validation. Work can overlap where shown, but no gate may be bypassed by parallel execution.

The first implementation ticket is WF-MIG.7. It is an AUDIT ticket because published-baseline evidence must be owned before any acquisition, reconstruction, or parity implementation.

## Completion criteria

WF-MIG.6 planning is implemented only when later tickets establish all of the following: canonical 66-item data; complete local CSS/assets/fonts; generated four static routes and four exact-slug route families; preserved hard DOM contracts; owned Navbar/Tabs/first-paint behavior; deterministic same-origin bundles; automated static/DOM/route/dependency gates; functional/accessibility/visual parity; successful staging and production procedures; retained rollback; no required Webflow request/service; no unresolved BLOCKING risk; and explicit Webflow decommission approval. Passing source builds alone is insufficient.
