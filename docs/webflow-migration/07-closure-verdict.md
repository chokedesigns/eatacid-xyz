# WF-MIG.7 Feasibility Closure Verdict

## Verdict

PROCEED WITH CONDITIONS

## Executive conclusion

The migration is technically feasible, operationally reasonable, and proportionate to the benefit of durable Git ownership if full Webflow independence remains the goal. The selected hybrid static-generation architecture remains recommended: committed evidence shows a small static route surface, complete recoverable CMS data, existing Git-owned wallet/transaction logic, and bounded Webflow-owned presentation/widget seams.

The expected hands-on labor is **404.5 hours through production cutover**, **424 hours through safe Webflow independence**, and **28.5 optional cleanup hours afterward**. The complete program including that cleanup allowance is **452.5 hours expected**. These are Codex-assisted iterative-workflow estimates, not guarantees or calendar schedules.

Proceed ticket by ticket. Do not authorize production cutover or Webflow removal from this verdict alone.

## Technical feasibility

Feasibility is supported by four static pages, four CMS route families, 66 fully reconciled current items, deterministic Git evidence for all visible row values, five bounded list contracts/97 row occurrences, existing Git-owned network/wallet/transaction pipelines, and a static architecture that does not require server rendering or a replacement CMS.

Known gaps are bounded implementation/validation work, not present architecture blockers: freeze the published comparator; capture Collection Utility exactly; acquire/prove 13+66 assets and fonts; import canonical data; preserve HEN mappings and DOM contracts; localize CSS; replace Navbar/Tabs/hidden-first behavior; prove static hosting, visual/browser/accessibility/transaction parity; and rehearse rollback.

An architecture-invalidating discovery requires re-estimation rather than absorption into the high band.

## Recommended architecture

Retain the WF-MIG.6 architecture without modification:

- deterministic static HTML generated from canonical Git data and reusable templates;
- targeted client enhancement using retained wallet, Drops, Exchange and transaction runtime;
- standalone local Navbar, Tabs and visible-first initialization modules;
- local CSS, assets, fonts, HTML and JavaScript;
- one immutable same-origin deploy artifact;
- Webflow read-only as comparator and rollback until formal closure.

Preserve current DOM selectors/hierarchy, routes, copy, Shadownet configuration, wallet lifecycle and transaction pipelines through cutover. Defer cleanup and redesign.

## Expected effort

| Milestone | Low | Expected | High | Confidence |
|---|---:|---:|---:|---|
| Minimum implementation foundation | 122.5 | 224 | 375 | MEDIUM |
| Cutover-ready migration / minimum viable independence before production | 192 | 357.5 | 602 | MEDIUM |
| Through production cutover | 219 | 404.5 | 682 | LOW |
| Through safe Webflow independence | 230 | 424 | 714 | LOW |
| Deferred cleanup only | 14.5 | 28.5 | 51 | LOW |
| Complete program including cleanup | 244.5 | 452.5 | 765 | LOW |
| Complete-program workflow overhead component | 21 | 31.5 | 42 | MEDIUM |

Production cutover adds 27/47/80 hours after a cutover-ready candidate. Safe-independence closure adds another 11/19.5/32 hours. Passive build/test/deploy/DNS/cache and monitoring-window elapsed time is excluded; only active monitoring and iteration is counted.

## Effort by ownership

Through safe Webflow independence, the expected 424 hours divide into:

| Ownership | Expected hours |
|---|---:|
| CODEX EXECUTION AND ITERATION | 233 |
| USER REVIEW AND DECISION | 117 |
| MANUAL EXTERNAL WORK | 74 |
| Total | 424 |

The user figure includes 30 expected hours of inter-ticket prompt, branch/status, commit and continuity overhead. Complete-program ownership including optional cleanup is 253 Codex, 124.5 user and 75 manual-external hours, totaling 452.5.

## Largest uncertainty drivers

- Authorization, provenance and decoded equivalence for 13 material assets and 66 CMS media records.
- Exact font binaries/licenses and responsive layout metrics.
- Missing checked source and potentially undiscovered runtime for Collection Utility.
- Local CSS load order, asset URL rewriting and page-specific responsive drift.
- Transaction-sensitive Exchange Tabs readiness and visible-first timing.
- Four-page/material-state/four-family visual and accessibility review volume.
- GitHub Pages route, staging, cache, custom-domain and rollback capabilities.
- Shadownet wallet/transaction access, production DNS/TLS/cache behavior and monitoring-window evidence.

## Codex-suitable work

Codex is well suited to repository inspection; canonical data/schema/import work; HEN adapters; deterministic generators; DOM-contract-preserving templates; local CSS integration; Navbar/Tabs/first-paint modules; CI/build/manifest tooling; route/dependency/DOM scanners; browser and screenshot automation; mocked wallet/transaction fixtures; diff interpretation; targeted correction; evidence manifests; and closure reconciliation.

Codex can prepare and interpret manual procedures, but it cannot independently supply legal authorization, subjective acceptance or privileged external confirmation.

## User-required work

The user must authorize asset acquisition and redistribution, decide provenance/licensing and acceptable equivalence, approve visual differences, perform or witness manual browser/accessibility checks, provide wallet confirmation and approved controlled Shadownet transaction actions, authorize/configure hosting and DNS/custom domains, approve production promotion and rollback thresholds, monitor real production behavior, approve closure of the rollback window, authorize reversible Webflow decommission, and commit accepted tickets.

## Conditions to proceed

1. Start with the frozen published baseline; do not begin asset, data, CSS or Collection Utility implementation first.
2. Preserve the accepted architecture and runtime/network/DOM invariants unless evidence triggers a new ADR.
3. Obtain explicit asset/font authorization and provenance before acquisition or redistribution.
4. Keep Webflow read-only, published and recoverable through the approved monitoring/rollback window.
5. Treat every BLOCKING BEFORE CUTOVER item and required validation gate as non-waivable without a new explicit decision.
6. Retain one-ticket-at-a-time review, expected fix passes, clean branch state and immutable artifact promotion.
7. Re-estimate if an architecture-invalidating condition is found.

There is no blocker to starting the first implementation ticket, provided its required read-only published/browser access is available. This verdict does not authorize any Webflow mutation.

## Blockers before cutover

Production cutover remains blocked until published/saved equality and exact route behavior are frozen; Collection Utility is reconstructed; all assets/fonts are independently authorized and verified; canonical data/HEN mapping/routes/rows pass; CSS and owned Navbar/Tabs/visible-first behavior pass; transaction/wallet/network contracts pass automated and authorized Shadownet checks; visual/responsive/accessibility matrices pass; GitHub Pages or an approved static host passes deployment/rollback gates; the candidate makes no required Webflow request; all residual blocking risks close; and explicit production authorization is recorded.

Webflow removal is further blocked until production stability and the approved monitoring-window exit conditions pass, both rollback paths and evidence are retained, Git ownership is handed off, every removal criterion passes, and a separate reversible decommission action is explicitly authorized.

## Deferred cleanup

WF-MIG.28 is optional and non-critical. Its 14.5/28.5/51-hour allowance covers separately ticketed CSS extraction, dead `.w-*` cleanup, legacy entrypoint renaming, jQuery removal, unique-ID improvements, asset optimization and similar behavior-preserving work after rollback closure. It does not block production cutover or safe independence.

## What is proven

- The current architecture and reconciliation evidence exists in committed WF-MIG.1–6 artifacts.
- The audited surface is four static pages, four CMS template route families, four collections, 66 items, 36 physical field occurrences, five lists and 97 row occurrences.
- Current CMS values reconcile with checked HTML and Git evidence where equivalents exist.
- Git already owns the material network, mirror, wallet, Drops, Exchange and transaction logic.
- The migration can be decomposed into bounded static-generation, presentation, widget, deployment and validation work.
- The selected architecture is technically feasible on current evidence.

## What is planned

- Authoritative execution numbering is WF-MIG.8–WF-MIG.28, preserving the old WF-MIG.7–WF-MIG.27 order and dependencies.
- WF-MIG.8–WF-MIG.27 form the critical path through safe independence.
- WF-MIG.28 is deferred cleanup.
- Staging, production promotion, monitoring, rollback closure and reversible decommission remain separate gated tickets.

## What is estimated

- Ticket-level Codex, user-review and manual-external low/expected/high labor.
- Expected primary and fix-pass counts, confidence, assumptions and risks.
- Phase, workflow-overhead, milestone, ownership, scenario and alternative-scope totals.
- Expected labor of 357.5 hours to a cutover-ready candidate, 404.5 through production cutover, 424 through safe independence and 452.5 including optional cleanup.

The estimate is a planning model, not a guarantee.

## What remains unproven

Published visual/behavioral parity, exact Collection Utility serialization/runtime, asset equivalence and licensing, font provenance/metrics, independent local presentation, generated route/DOM behavior, browser/accessibility parity, wallet/transaction behavior against generated DOM, GitHub Pages capability, staging/production behavior, rollback rehearsal, monitoring stability and Webflow-removal eligibility remain unproven.

No production cutover, visual parity, transaction validation or Webflow removal is approved by this audit.

## Audit closure

WF-MIG.7 closes the feasibility-audit phase with a decisive **PROCEED WITH CONDITIONS** verdict and an authoritative renumbered backlog. It does not implement the migration, approve cutover, prove parity, guarantee hours, authorize Webflow removal or establish a calendar schedule.

Future implementation prompts must use WF-MIG.8–WF-MIG.28. Any reference to the old proposed WF-MIG.7–WF-MIG.27 numbering is superseded by `07-renumbered-backlog.json`.

## First implementation ticket

**WF-MIG.8 — Capture and freeze the published baseline**

It must run before downloads, data import, CSS localization or Collection Utility reconstruction because it owns the published comparator, content freeze, exact route/status behavior, external dependency evidence and the missing Collection Utility boundary.

## What 424 hours does and does not mean

The **424-hour expected safe-independence estimate is not the user's expected personal attended time**. It is the expected combined engineering-equivalent effort embodied by WF-MIG.8–WF-MIG.27: 233 hours of agent-led engineering allocation, 117 hours of user-review/decision allocation including engineering workflow overhead, and 74 hours of manual-external allocation.

CODEX EXECUTION AND ITERATION is an engineering-equivalent measure of investigation, implementation, correction and validation burden. It is neither a requirement that the user remain present nor a claim that Codex literally runs for that many wall-clock hours. The user-review and manual allocations also include conservative project-risk allowance and activities that can overlap or require only periodic attention.

The accepted engineering-equivalent totals and PROCEED WITH CONDITIONS verdict are unchanged.

## Practical personal-time estimate

| Milestone | User-attended low | Expected | High | Confidence |
|---|---:|---:|---:|---|
| Minimum foundation | 32.5 | 61 | 105 | MEDIUM |
| Cutover-ready migration | 53 | 98 | 169 | LOW |
| Production cutover | 63.5 | 117 | 201 | LOW |
| Safe Webflow independence | 68 | 125 | 214.5 | LOW |
| Deferred cleanup | 3 | 5.5 | 10.5 | LOW |
| Complete program | 71 | 130.5 | 225 | LOW |

User-attended time includes prompt launch/refinement, blocker answers, report/diff review, short check-ins, manual or witnessed checks, visual and licensing decisions, wallet confirmations, DNS/domain actions, production/rollback approvals and commits. It excludes unattended agent reasoning, unattended tools/builds/browser suites, passive propagation and monitoring-window duration. Check-in time is included once and is not a separate additive estimate.

The practical conversion is lower confidence than the original engineering model. The best single personal-planning number for the full independence objective is **125 expected attended hours**, while **117 hours** is the expected personal commitment through production cutover.

## Unattended agent and tool time

Expected unattended Codex/tool wall-clock is 74 hours to minimum foundation, 132 to cutover-ready, 149 through production cutover, 154 through safe independence, 14 for optional cleanup and 168 for the complete program. Corresponding low/high ranges are 33–146, 57–264, 64–302, 66–314, 5–30 and 71–344 hours.

This is the portion in which primary/fix Codex passes, scripts, routine builds, validators, browser automation, screenshot suites and deploy verification can progress without continuous user attention. Brief error/completion/relaunch decisions are already included in attended time. The wall-clock is not labor, is not guaranteed, and is not added to 424 hours.

DNS, TLS, cache and deploy propagation, exceptional CI/browser queues, provider/service delays and monitoring-window elapsed duration form a fourth passive clock. They remain outside labor and personal-time totals.

## Which estimate to use

- Use **125 expected attended hours through safe Webflow independence** for personal commitment and the decision whether the full migration is worth undertaking; retain the 68–214.5 range because confidence is LOW.
- Use **117 expected attended hours** when planning only through production cutover.
- Use **424 expected engineering-equivalent hours**, with the 714-hour difficult-but-contained high case, for engineering-risk, scope and contingency planning.
- Use **154 expected unattended Codex/tool hours** to anticipate serialized agent/tool occupancy that does not require continuous attendance.
- Do not convert passive propagation or monitoring-window duration into a labor or personal-time estimate.

Alternative-scope practical attended estimates are 68/125/214.5 hours for the full recommended migration through safe independence, 14/27/50 for minimal dependency reduction and 45/82/145 for snapshot-based partial migration. These alternatives remain non-additive and do not change the selected architecture.
