# WF-MIG.7 Effort Estimate

## Estimation basis

This estimate uses only committed WF-MIG.1–WF-MIG.6 evidence on `ticket-WF-MIG-webflow-to-git-feasibility-audit`. It estimates the 21 proposed implementation tickets after authoritative renumbering from old WF-MIG.7–WF-MIG.27 to new WF-MIG.8–WF-MIG.28. Completed audit work through this WF-MIG.7 closure is excluded from future labor; repository evidence does not establish historical audit hours.

The scope remains the WF-MIG.6 decision: deterministic static HTML generated from Git-owned structured data/templates; retained wallet, Drops, Exchange and transaction runtime; owned Navbar, Tabs and visible-first modules; local CSS/assets/fonts/JavaScript; one immutable same-origin artifact; Webflow read-only as baseline and rollback until closure. No redesign, mainnet enablement, transaction rewrite, live CMS replacement, or destructive Webflow deletion is estimated.

All figures are hands-on labor hours. Expected values are most-likely judgments and are not arithmetic midpoints.

## Current Codex-assisted workflow

The working model is one scoped ticket at a time. An optimized prompt is prepared, Codex inspects current repository evidence, implements the bounded change, adds/runs relevant validation and returns a completion report. The user reviews the report and affected behavior/artifacts, supplies blocked decisions or authorization, witnesses or performs manual checks, accepts or requests a focused fix pass, and commits accepted work. Branch state remains clean and reviewable between tickets. There is no autonomous multi-ticket run and no assumption that first passes always succeed.

The ticket estimates include ordinary investigation, one primary Codex pass, focused review, expected targeted fixes, and ticket-specific manual checks. Shared prompt/branch/commit/continuity work is added separately under Workflow overhead.

## Labor categories

| Category | Counted labor |
|---|---|
| CODEX EXECUTION AND ITERATION | Active scoped-session time for repository investigation, code/data/test work, validation interpretation, correction and expected fix passes. |
| USER REVIEW AND DECISION | Reviewing completion reports/results, answering blockers, approving decisions, witnessing checks, and accepting/committing work. |
| MANUAL EXTERNAL WORK | Browser actions, authorization/provenance/licensing decisions, DNS/domain work, wallet confirmation, approved Shadownet activity, visual acceptance, monitoring and rollback rehearsal that Codex cannot independently complete. |
| PASSIVE MACHINE TIME | Unattended builds, downloads, screenshot/browser suites, deploy propagation, DNS/cache waiting and monitoring-window elapsed duration. Excluded from labor totals. |

## Estimation assumptions

Low assumes evidence/access are available, the first implementation is substantially correct, no material architecture surprise occurs, and one normal review cycle is sufficient. Expected assumes one primary Codex pass, one focused review, ordinary targeted correction, expected browser/manual checks, and no architecture reversal. High assumes multiple fix passes, difficult browser/CSS/environment behavior, external friction, and one material but contained surprise.

The estimate further assumes the audited scope remains four static routes, four CMS route families, 66 exact CMS item paths, four collections/66 items/36 field occurrences, five runtime-sensitive lists/97 rendered row occurrences, 13 material non-CMS assets, 66 CMS media records, four responsive families, and the current wallet/network/transaction contracts. GitHub Pages remains the expected host only if its capability gates pass.

## Ticket-level estimate summary

Ticket IDs below are the authoritative execution numbering.

| Ticket | Phase | Critical | Codex L/E/H | User L/E/H | Manual L/E/H | Total L/E/H | Primary / fix passes | Confidence |
|---|---|---:|---:|---:|---:|---:|---:|---|
| WF-MIG.8 — Capture and freeze the published baseline | 1 | Yes | 6/10/16 | 2/3/5 | 2/4/7 | 10/17/28 | 1 / 1 | MEDIUM |
| WF-MIG.9 — Acquire and verify Webflow-hosted assets | 2 | Yes | 6/12/20 | 2/4/7 | 4/8/14 | 12/24/41 | 1 / 1 | LOW |
| WF-MIG.10 — Verify and implement independent font delivery | 2 | Yes | 4/8/14 | 1.5/3/5 | 2.5/5/9 | 8/16/28 | 1 / 1 | MEDIUM |
| WF-MIG.11 — Create canonical CMS replacement data | 3 | Yes | 7/12/19 | 2/3.5/6 | 0/0.5/1 | 9/16/26 | 1 / 1 | HIGH |
| WF-MIG.12 — Resolve HEN sparse-token thumbnail mapping | 3 | Yes | 4/7/12 | 1.5/2.5/4 | 0/0.5/1 | 5.5/10/17 | 1 / 1 | MEDIUM |
| WF-MIG.13 — Localize the Webflow CSS baseline | 4 | Yes | 7/13/22 | 2/4/7 | 1/2/4 | 10/19/33 | 1 / 1 | MEDIUM |
| WF-MIG.14 — Reconstruct Collection Utility locally | 4 | Yes | 8/15/26 | 2.5/5/8 | 1.5/3/6 | 12/23/40 | 1 / 2 | LOW |
| WF-MIG.15 — Implement deterministic page and route generation | 5 | Yes | 8/14/23 | 2/4/7 | 0.5/1/2 | 10.5/19/32 | 1 / 1 | MEDIUM |
| WF-MIG.16 — Generate CMS rows with DOM-contract parity | 5 | Yes | 7/12/20 | 2/4/6 | 0.5/1/2 | 9.5/17/28 | 1 / 1 | MEDIUM |
| WF-MIG.17 — Replace the Webflow Navbar runtime | 6 | Yes | 5/9/15 | 1.5/3/5 | 1/2/3 | 7.5/14/23 | 1 / 1 | MEDIUM |
| WF-MIG.18 — Replace Exchange Tabs and the 500 ms seam | 6 | Yes | 6/11/19 | 2/4/7 | 1/2/4 | 9/17/30 | 1 / 2 | MEDIUM |
| WF-MIG.19 — Harden first paint with visible-first enhancement | 6 | Yes | 5/9/16 | 1.5/3/5 | 1/2/4 | 7.5/14/25 | 1 / 1 | MEDIUM |
| WF-MIG.20 — Build the reproducible static deployment pipeline | 7 | Yes | 7/13/22 | 2/4/7 | 2/4/8 | 11/21/37 | 1 / 1 | LOW |
| WF-MIG.21 — Enforce automated data, route, dependency, and DOM contracts | 8 | Yes | 8/15/25 | 2/4/7 | 0.5/1/2 | 10.5/20/34 | 1 / 1 | MEDIUM |
| WF-MIG.22 — Validate browser behavior, accessibility, wallet, and transactions | 8 | Yes | 9/17/28 | 3/6/10 | 3/6/11 | 15/29/49 | 1 / 2 | MEDIUM |
| WF-MIG.23 — Establish visual and responsive regression gates | 9 | Yes | 10/20/34 | 5/10/17 | 4/8/15 | 19/38/66 | 1 / 2 | LOW |
| WF-MIG.24 — Close route and Webflow-independence validation | 9 | Yes | 6/11/18 | 2/4/7 | 1/3/6 | 9/18/31 | 1 / 1 | MEDIUM |
| WF-MIG.25 — Execute and rehearse the staging cutover | 10 | Yes | 6/10/17 | 3/6/10 | 4/8/14 | 13/24/41 | 1 / 1 | LOW |
| WF-MIG.26 — Execute the approved production cutover | 11 | Yes | 5/8/14 | 3/5/9 | 4/7/12 | 12/20/35 | 1 / 1 | LOW |
| WF-MIG.27 — Close rollback window and decommission Webflow | 12 | Yes | 4/7/12 | 3/5/8 | 3/6/10 | 10/18/30 | 1 / 1 | LOW |
| WF-MIG.28 — Perform post-migration presentation and legacy cleanup | Deferred | No | 10/20/36 | 3/6/10 | 0.5/1/3 | 13.5/27/49 | 4 / 2 | LOW |

Complexity drivers, assumptions and risks for every ticket are recorded in `07-ticket-estimates.json`. The expected critical-path ticket labor before shared overhead is 394 hours; deferred ticket labor is 27 hours.

## Phase estimates

Phase totals are ticket labor only. Workflow overhead is intentionally not embedded in these rows.

| Phase | Tickets | Total L/E/H | Expected Codex | Expected user review | Expected manual | Major uncertainty | Exit gate |
|---|---|---:|---:|---:|---:|---|---|
| 1. Baseline and freeze | 8 | 10/17/28 | 10 | 3 | 4 | Published access; Collection Utility evidence | Hash-addressed comparator, freeze and route/runtime capture reviewed. |
| 2. Asset and font ownership | 9–10 | 20/40/69 | 20 | 7 | 13 | Asset rights/equivalence; font licenses/metrics | 13+66 media dependencies and required font faces have authorized independent paths or explicit blockers. |
| 3. Structured content | 11–12 | 14.5/26/43 | 19 | 6 | 1 | Freeze drift; HEN consumer boundary | Four collections/66 items validate and 17-ID HEN mapping is bijective. |
| 4. Local presentation baseline | 13–14 | 22/42/73 | 28 | 9 | 5 | CSS order/URL drift; missing Collection Utility source | Four local pages have no known missing presentation dependency. |
| 5. Page generation | 15–16 | 20/36/60 | 26 | 8 | 2 | Route semantics; selector-sensitive row DOM | Deterministic complete route tree and all five/97 row contracts pass. |
| 6. Widget and initialization replacement | 17–19 | 24/45/78 | 29 | 10 | 6 | Browser timing, a11y and transaction-sensitive Tabs readiness | Navbar, Tabs and visible-first behavior pass without Webflow JS. |
| 7. Deployment pipeline | 20 | 11/21/37 | 13 | 4 | 4 | GitHub Pages, cache/custom-domain and rollback capability | Same retained artifact can be built, verified, promoted and rolled back. |
| 8. Functional validation | 21–22 | 25.5/49/83 | 32 | 10 | 7 | Browser/provider matrix; wallet and Shadownet evidence | Automated contracts and authorized functional/transaction checks pass. |
| 9. Visual and responsive validation | 23–24 | 28/56/97 | 31 | 14 | 11 | Screenshot stability, CSS corrections and residual dependencies | Visual matrix is approved and no blocking Webflow/route risk remains. |
| 10. Staging cutover | 25 | 13/24/41 | 10 | 6 | 8 | Production-like host and rollback rehearsal | Exact candidate and rollback procedure pass staging; no production approval implied. |
| 11. Production cutover | 26 | 12/20/35 | 8 | 5 | 7 | DNS/TLS/cache and production-only behavior | Validated bytes serve with immediate checks passing and rollback actionable. |
| 12. Webflow rollback and decommission | 27 | 10/18/30 | 7 | 5 | 6 | Monitoring-window and decommission authorization | Stability/removal criteria pass and reversible decommission is explicitly approved. |
| 13. Deferred cleanup | 28 | 13.5/27/49 | 20 | 6 | 1 | Optional breadth and legacy coupling | Each selected cleanup passes focused contract/visual gates independently. |

The critical path through safe Webflow independence is WF-MIG.8–WF-MIG.27: 210/394/674 ticket hours plus 20/30/40 workflow-overhead hours, or **230/424/714 hours**.

## Workflow overhead

| Included tickets | Low | Expected | High |
|---|---:|---:|---:|
| Minimum foundation, 12 tickets | 12 | 18 | 24 |
| Cutover-ready, 17 tickets | 17 | 25.5 | 34 |
| Through production cutover, 19 tickets | 19 | 28.5 | 38 |
| Through safe independence, 20 tickets | 20 | 30 | 40 |
| Deferred cleanup, 1 ticket | 1 | 1.5 | 2 |
| Complete program, 21 tickets | 21 | 31.5 | 42 |

The allowance is 1.0/1.5/2.0 hours per ticket for prompt drafting/refinement, branch/status continuity, commit handling, closure/fix prompt coordination, blocked-question resolution and dependency handoff. It is assigned to USER REVIEW AND DECISION. Ticket-specific completion-report review and expected fixes are already in ticket estimates and are not counted again.

## Minimum implementation foundation

| Low | Expected | High | Confidence |
|---:|---:|---:|---|
| 122.5 | 224 | 375 | MEDIUM |

Includes WF-MIG.8–WF-MIG.19 and their 12/18/24 overhead: enough to prove the architecture locally through frozen evidence, owned inputs, canonical data, CSS/Collection Utility, deterministic routes/rows, Navbar, Tabs and visible-first enhancement. Excludes the deployment pipeline, complete automated/browser/visual validation, staging, production and decommission.

## Cutover-ready migration

| Low | Expected | High | Confidence |
|---:|---:|---:|---|
| 192 | 357.5 | 602 | MEDIUM |

Includes WF-MIG.8–WF-MIG.24 and 17/25.5/34 overhead. This is the minimum viable independence effort before production cutover: a production-candidate artifact with automated, functional, transaction, accessibility, visual, responsive, route and zero-required-Webflow-dependency evidence. Excludes staging promotion, production promotion, monitoring-window closeout, Webflow decommission and optional cleanup.

## Production cutover

| Low | Expected | High | Confidence |
|---:|---:|---:|---|
| 219 | 404.5 | 682 | LOW |

Cumulative through WF-MIG.26 with 19/28.5/38 overhead. It includes staging deployment/rollback rehearsal, approved production promotion, DNS/cache/TLS actions, fetched-byte and route checks, wallet/network/transaction-safety smoke, immediate monitoring and actionable rollback. It excludes passive propagation/waiting, monitoring-window elapsed duration, closure of the rollback window, Webflow decommission and cleanup.

The incremental staging-and-production segment after a cutover-ready candidate is 27/47/80 hours.

## Safe Webflow independence

| Low | Expected | High | Confidence |
|---:|---:|---:|---|
| 230 | 424 | 714 | LOW |

Cumulative through WF-MIG.27 with 20/30/40 overhead. It includes production stability evidence, rollback-window closure, Git source-of-truth handoff, archived rollback evidence, all removal criteria and separately authorized reversible Webflow decommission. It excludes destructive site deletion and cleanup. The closure increment after production cutover is 11/19.5/32 hours.

Expected ownership is 233 hours CODEX EXECUTION AND ITERATION, 117 hours USER REVIEW AND DECISION including 30 hours of workflow overhead, and 74 hours MANUAL EXTERNAL WORK.

## Deferred cleanup

| Low | Expected | High | Confidence |
|---:|---:|---:|---|
| 14.5 | 28.5 | 51 | LOW |

This non-critical allowance covers WF-MIG.28 plus 1/1.5/2 hours overhead. It anticipates several separately scoped child tickets for CSS extraction, dead `.w-*` removal, entrypoint renaming, jQuery removal, unique-ID repair, asset optimization or similar behavior-preserving work. It excludes redesign, features, route/content changes and a single broad cleanup patch.

## Complete-program estimate

| Low | Expected | High | Confidence |
|---:|---:|---:|---|
| 244.5 | 452.5 | 765 | LOW |

This is safe Webflow independence plus optional cleanup, with all 21 ticket overhead allowances counted once. Expected ownership is 253 Codex execution/iteration hours, 124.5 user review/decision hours including 31.5 hours overhead, and 75 manual external-work hours.

## Scenario sensitivity

| Scenario | Through production cutover | Through safe independence | Including cleanup | Interpretation |
|---|---:|---:|---:|---|
| BEST PRACTICAL CASE | 219 | 230 | 244.5 | Local thumbnails are equivalent; fonts self-host cleanly; Collection Utility capture is complete; GitHub Pages passes; visual drift is minimal. |
| EXPECTED CASE | 404.5 | 424 | 452.5 | Ordinary asset/font/CSS work; one or two widget/runtime fixes; ordinary responsive corrections; GitHub Pages remains viable. |
| DIFFICULT BUT CONTAINED CASE | 682 | 714 | 765 | Asset acquisition, font metrics, Collection Utility, CSS, Tabs/first-paint and responsive fixes expand; hosting needs a contained adjustment, not a new architecture. |
| ARCHITECTURE-INVALIDATING CASE | Re-estimation required | Re-estimation required | Re-estimation required | A normal high band is invalid; reopen the architecture decision. |

## Alternative-scope comparison

These options are mutually exclusive, non-additive program choices.

| Option | Labor L/E/H | Benefits | Retained Webflow dependency | Long-term impact / risk | Recommendation |
|---|---:|---|---|---|---|
| Full recommended migration | 230/424/714 through safe independence | Deterministic Git source, no required Webflow request, strong gates and rollback | Baseline/rollback only until approved decommission | Lowest source duplication; medium delivery risk concentrated in known seams | Recommended with conditions. |
| Minimal dependency reduction | 45/75/130 | Smallest near-term effort; hardens selected Git bundles/first paint | Hosting, HTML, CMS, CSS, assets/fonts, widgets and deployment | Split ownership and platform dependence continue; low change risk but high retained dependency | Use only if independence is deferred. |
| Snapshot-based partial migration | 170/300/500 | Faster static-host path and high initial DOM compatibility | Operational fetching can end, but Webflow-derived duplicated HTML remains the authoring model | Manual duplicated shell/row/66-route upkeep; medium-high drift risk | Viable fallback, not supported over WF-MIG.6 by current evidence. |

The full migration’s expected 424 hours is proportionate if durable Webflow independence, reproducible Git ownership and tested rollback are strategic goals. It is not proportionate if the real objective is only near-term first-paint hardening; the 75-hour expected minimal option would better match that narrower objective.

## Passive elapsed-time dependencies

Excluded from labor totals:

- DNS propagation, certificate issuance and cache expiration after staging/production changes.
- Static-host deployment propagation and CDN invalidation.
- CI builds, deterministic double builds, downloads, screenshot runs and browser-suite runtime while unattended.
- Provider/chain response waiting that does not require active troubleshooting.
- The approved production monitoring-window elapsed duration.

Active interpretation, retry, visual review, incident response, monitoring checks and rollback decisions are counted in the affected ticket’s Codex, user or manual-external estimate. These dependencies can lengthen elapsed delivery without increasing labor proportionally.

## Estimate confidence

Confidence is MEDIUM for the local foundation and cutover-ready candidate because WF-MIG.1–6 provide unusually complete architecture, data, DOM and risk inventories. It falls to LOW for production and decommission because assets/fonts remain unverified, Collection Utility has no checked source, browser/visual parity is unproven, GitHub Pages capability is conditional, and DNS/wallet/transaction/monitoring actions require external authorization and real environments.

The expected range is most sensitive to asset equivalence/provenance, font metrics/licensing, Collection Utility reconstruction, CSS localization, Tabs/first-paint timing, screenshot exception volume, GitHub Pages route/cache/rollback behavior, approved Shadownet access and production DNS/monitoring operations.

## Estimate-invalidating conditions

Re-estimation and a new architecture decision are required if any of the following is established:

- Published behavior depends on undiscovered server-side functionality.
- Live CMS authoring is required after migration instead of Git-based content updates.
- The transaction runtime cannot operate against contract-preserving generated DOM without a material rewrite.
- Required assets/fonts cannot legally or technically be hosted independently and no approved equivalent exists.
- Static hosting cannot provide required nested-route, unknown-path, TLS, cache, staging and rollback behavior.
- A critical inaccessible IX2 or other Webflow-only interaction is discovered.
- The audited route/CMS/asset/responsive/browser scope grows materially.
- The no-redesign, no-mainnet or retained-runtime boundary changes.

These are not represented by the high band.

## Engineering-equivalent versus attended time

The accepted estimates use four original labor categories, but those categories are an engineering-equivalent allocation rather than a literal stopwatch model. In particular, CODEX EXECUTION AND ITERATION measures the agent-led investigation, implementation, correction and validation embodied by a ticket. It does not mean the user must remain present for that many hours, and it does not assert that literal Codex wall-clock runtime equals the allocation.

USER REVIEW AND DECISION and MANUAL EXTERNAL WORK likewise express the effort and risk carried by active oversight and external gates. Their sum is deliberately conservative for project planning: some report review overlaps a witnessed browser check, some monitoring is periodic rather than continuous, and some manual allowances represent decision risk rather than uninterrupted attendance.

The practical layer therefore uses four separate clocks:

1. **ENGINEERING-EQUIVALENT COMBINED LABOR** measures project size, implementation burden and contingency exposure. Existing totals are unchanged.
2. **USER-ATTENDED WORK** measures active prompt launch, blocker answers, review, checks, decisions, approvals, wallet/DNS/rollback actions and commits. USER-CHECK-IN TIME is included here, not added again.
3. **UNATTENDED CODEX/TOOL WALL-CLOCK** estimates time when agent runs, scripts, builds, downloads, browser automation, screenshots, validators or deploy probes can progress without continuous user attention. It is not labor and is not added to the first clock.
4. **PASSIVE ELAPSED TIME** covers external queues, DNS/cache/TLS/deploy propagation, monitoring-window duration and service waiting. It is neither labor nor attended time.

## Practical user-attended estimates

| Milestone | Low | Expected | High | Confidence |
|---|---:|---:|---:|---|
| Minimum foundation | 32.5 | 61 | 105 | MEDIUM |
| Cutover-ready migration | 53 | 98 | 169 | LOW |
| Production cutover | 63.5 | 117 | 201 | LOW |
| Safe Webflow independence | 68 | 125 | 214.5 | LOW |
| Deferred cleanup | 3 | 5.5 | 10.5 | LOW |
| Complete program | 71 | 130.5 | 225 | LOW |

The conversion was performed ticket by ticket from user-review hours, manual-external hours, pass/fix patterns, external gates and confidence. It retains active report/diff review, visual acceptance, licensing/authorization decisions, browser/accessibility checks, wallet confirmations, DNS/domain actions, production and rollback decisions, and commits. It discounts overlap between review and witnessed checks, agent-led branch/status work, unattended test execution, non-continuous monitoring and conservative engineering allowance.

Ticket practical estimates exclude shared workflow overhead. Milestones add that overhead exactly once at 0.5/1.0/1.5 attended hours per included ticket for low/expected/high: 6/12/18 hours at minimum foundation, 8.5/17/25.5 at cutover-ready, 9.5/19/28.5 through production, 10/20/30 through safe independence, 0.5/1/1.5 for cleanup, and 10.5/21/31.5 for the complete program. This covers prompt refinement/launch, brief check-ins, focused fix approval, continuity and commits.

The practical conversion has lower confidence than the engineering-equivalent model because actual review style, interruption rate, authorization friction and failure frequency have not yet been observed.

Alternative-scope personal planning ranges remain non-additive:

| Option | User-attended low/expected/high | Confidence |
|---|---:|---|
| Full recommended migration through safe independence | 68/125/214.5 | LOW |
| Minimal dependency reduction | 14/27/50 | LOW |
| Snapshot-based partial migration | 45/82/145 | LOW |

## Unattended Codex and tool runtime

| Milestone | Low | Expected | High | Confidence |
|---|---:|---:|---:|---|
| Minimum foundation | 33 | 74 | 146 | LOW |
| Cutover-ready migration | 57 | 132 | 264 | LOW |
| Production cutover | 64 | 149 | 302 | LOW |
| Safe Webflow independence | 66 | 154 | 314 | LOW |
| Deferred cleanup | 5 | 14 | 30 | LOW |
| Complete program | 71 | 168 | 344 | LOW |

These cumulative wall-clock ranges are planning aids for serialized, one-ticket-at-a-time execution. They estimate unattended portions of primary Codex passes, expected fix passes, routine build/contract/browser execution, screenshot comparison and deploy verification. They do not assume the 233 expected Codex engineering-equivalent hours through safe independence equal 233 literal runtime hours.

Indicative execution assumptions are 1–6 low, 3–12 expected and 6–20 high unattended hours for a primary scoped ticket depending on complexity; 0.5–2, 1–4 and 2–8 hours for a focused fix pass; 0.25–1, 0.5–2 and 1–4 hours for a routine build/contract run; 0.5–2, 1–4 and 2–8 hours for a browser run; 1–3, 3–8 and 6–16 hours for a visual suite; and 0.5–2, 1–4 and 2–8 hours for deploy verification. These activities occur in different combinations per ticket and are not added mechanically.

Brief completion/error/relaunch/clarification check-ins remain inside user-attended time. Routine tool execution is counted once in this wall-clock; exceptional queues, propagation and external waiting remain passive elapsed dependencies.

## Four-clock milestone summary

| Milestone | Engineering-equivalent L/E/H | User-attended L/E/H | Unattended Codex/tool L/E/H | Passive elapsed-time dependencies | Confidence |
|---|---:|---:|---:|---|---|
| Minimum foundation | 122.5/224/375 | 32.5/61/105 | 33/74/146 | Access/authorization waits; exceptional browser/download queueing | MEDIUM for engineering, LOW–MEDIUM for practical clocks |
| Cutover-ready migration | 192/357.5/602 | 53/98/169 | 57/132/264 | CI/browser/screenshot queues; provider and external-service waits | MEDIUM for engineering, LOW for practical clocks |
| Production cutover | 219/404.5/682 | 63.5/117/201 | 64/149/302 | DNS, TLS, cache and deploy propagation; monitoring-window elapsed duration | LOW |
| Safe Webflow independence | 230/424/714 | 68/125/214.5 | 66/154/314 | Monitoring-window duration, DNS/cache settlement and decommission propagation | LOW |
| Deferred cleanup | 14.5/28.5/51 | 3/5.5/10.5 | 5/14/30 | CI/browser/screenshot queue/runtime variance | LOW |
| Complete program | 244.5/452.5/765 | 71/130.5/225 | 71/168/344 | All safe-independence waits plus optional-cleanup queue variance | LOW |

Passive dependencies have no labor conversion and no promised duration. Some clocks can overlap, so summing them does not produce a calendar schedule.

## How to use these estimates

- For **personal commitment**, use the practical attended clock: **117 expected hours through production cutover** or **125 expected hours through safe Webflow independence**. For deciding whether the full independence program is worth undertaking personally, 125 hours is the best single planning number, with the 68–214.5 range kept visible.
- For **project size, engineering risk and contingency**, use the unchanged engineering-equivalent clock: **424 expected hours through safe independence**, with **714 hours** as the difficult-but-contained high case.
- For **agent/tool occupancy**, use the unattended wall-clock: **154 expected hours through safe independence**. It indicates time the user need not continuously attend; it is not extra labor.
- For **calendar waiting**, use the passive dependency notes rather than an hour total. DNS/cache/TLS/deploy propagation, service delays and the monitoring window can extend elapsed delivery independently.

Therefore, 424 hours is not the user's expected personal time. It is the expected combined engineering-equivalent effort embodied by the migration. The clocks answer different questions and must not be added together.
