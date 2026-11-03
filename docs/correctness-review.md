# EA-XYZ correctness review

Use this method for a feature, a consequential subsystem, or the full application. Scope changes the breadth of coverage, not the examination standard. The aim is consequential defect discovery: failures affecting funds, authority, identity, configuration, availability, recovery, or the truth of actionable state and outcomes.

[Project intent](../PROJECT_INTENT.md) supplies intended properties; the [developer guide](developer-guide.md) supplies architectural orientation. Current source establishes implementation facts. Requirements, implementation, historical rationale, and verification evidence remain distinct. Follow applicable `AGENTS.md` instructions and the [universal ticket workflow](codex-workflow.md) for execution and remediation.

## Declare the review

In [coverage](../audits/coverage.md), state the selected behavior, exclusions, and consequential dependencies. Identify each relevant repository's commit and any reviewed working-tree changes; identify tested revisions again when they change. Record relevant network, configuration, dependency/toolchain, and deployment assumptions. For external observations, record the target and observation date. A branch name alone is insufficient to identify reviewed source.

Bound scope by behavior and effects. Follow consequential dependencies across repository and external boundaries even for a feature review. If access or authorization prevents examination, state the resulting limitation and narrow the claim; do not silently treat the dependency as covered. Reviewing source does not authorize deployment, transactions, or operational mutations.

## Discover coverage: use the same procedure initially and at refresh

1. Start from the declared scope and current source, using guides only as navigation. Locate runtime registrations, user/operator actions, startup and background work, contract entrypoints, configuration writers, and build/deployment entries. Follow actual callers, consumers, and configuration rather than stopping at named modules.
2. Apply all three lenses below. Trace until consequential effects and their dependencies are explained. Pursue newly exposed paths through the same lenses until no unexplained consequential path remains within the declared scope; mark inaccessible boundaries explicitly.
3. Consolidate the traces into a compact behavioral map. Each row names a workflow, consequential boundaries, expected properties, and relevant source locations across producers and consumers. Combine paths sharing a behavioral contract; split when authority, effects, or expected properties differ. Record exclusions and unresolved coverage questions explicitly. This is not a file/function inventory.
4. Only after forming this source-driven candidate map, compare it with existing coverage, if any. Reconcile additions, changed relationships, and removals against current source; retain explanations for exclusions. At refresh, discover independently before consulting the old map, so the comparison can expose omissions rather than merely confirm previous rows.

| Lens | Trace | EA-XYZ orientation, to challenge against current source |
| --- | --- | --- |
| Forward | Consequential user, operator, and runtime entrypoints through validation, state changes, external requests, effects, and reported outcomes. | Public Home, Drops, Exchange, Collection Utility and shared wallet events; Admin pause, treasury, pairs, drop configuration, and health; direct contract calls; timers, retries, recovery and startup; build/release commands. |
| Reverse | Every discovered asset movement, privileged operation, configuration mutation, and consequential state decision back to **all reachable entrypoints**, including indirect/background and direct-chain paths. | Approval, burn/redeem, FA2/XTZ transfers and rescue; pause/admin/pair changes; drop authoring and recovery; balance, supply, readiness, LIVE and success decisions. Check paths bypassing UI validation. |
| Boundary | Authority and financial identities across transformations, generated state, repositories, and external systems, in both directions. | Wallet/account/network generations; contract/token IDs, amounts and destinations; DOM/CMS to cart to serialized operation to contract/storage/event; source to JSON/Admin mirror; cached/requested/rendered state; Webflow, Beacon, RPC, TzKT, time provider and FA2 contracts; routers/loaders/bundles and deployed identity. |

Useful source starting points are `shared/beacon-setup.js`, `shared/public-trade-ops.js`, `drops/js/`, `exchange/js/`, `collection-utility/js/`, `shared/chain-registry.js`, and `shared/drop-params/`; Admin's `src/` in its independent repository; `contracts/burn-redeem-escrow/smartpy/`; and `webflow/`, `loaders/`, build scripts and `.github/workflows/pages.yml`. These are navigation aids, not completed coverage or a fixed exhaustive list. Local Webflow-derived shells and generated artifacts do not establish live integration or deployed identity.

## Investigate: repeat this complete audit pass

Apply these steps to every workflow in the selected map on every pass. Hypotheses may vary; the required examination does not become a regression-only rerun after fixes.

1. **Ground expected properties independently.** Derive them from project intent, authorized requirements, financial conservation/identity rules, authority rules, and applicable protocol/interface contracts. Check external contracts against authoritative specifications or identified dependency versions. Existing code and tests are evidence of behavior, not their own correctness oracle. Expose conflicting or missing requirements instead of inventing intent. Reassess relevant [known issues](known-issues.md) against the reviewed revision; their absence from a new finding list does not resolve them.
2. **Examine all consequential behavior in each workflow.** Read complete control/data flow and relevant producers/consumers, including alternate entries, validation, transformations, side effects, publication, and failure/recovery paths. Compare each transition and effect with the expected properties. Check what authorizes an action at the moment of effect, not only at startup. Follow construction, send, confirmation, and refreshed state separately; a successful request is not proof of chain application or current balances.
3. **Challenge the workflow adversarially.** Examine unexpected, missing, malformed, oversized, duplicate and boundary inputs; unknown versus zero; exact token IDs and integer amounts through parsing/arithmetic/serialization; rounding, overflow and batch totals. Consider account/network/privilege changes across awaits, disconnect/reconnect, reentrancy or repeated actions, out-of-order results, stale caches, cancellation, timeout, retry and interrupted recovery. Challenge HTTP errors, partial/paginated or inconsistent indexer data, unavailable providers, rejected/failed operations, chain/indexer disagreement, DOM/CMS mismatch, generated-copy drift and build/deployment mismatch. Apply relevant cross-system combinations, explaining inapplicable cases briefly rather than mechanically multiplying tests.
4. **Retain depth where consequences demand it.** For bounded high-impact operations, exhaustively trace reachable branches and meaningful state/order combinations: authorization, exact payloads, recipients, approvals, batch behavior, contract direct calls, storage invariants, external-call rejection, failure atomicity and recovery. For example, follow an escrow trade from each client builder through direct entrypoint validation and FA2 effects, including insufficient inventory and per-trade versus whole-batch behavior. Elsewhere use proportionate source examination and targeted checks; expand when a consequential uncertainty appears. Proportionate verification does not permit skipping consequential behavior in declared coverage.
5. **Demonstrate and classify.** Reproduce substantive suspected defects deterministically where feasible at the real implementation seam. Control clocks, deferred promises/event ordering, wallet/SDK/network responses and serialization as needed. Assert the violated property and observable effect; pair the failing case with a valid-input or unchanged-authority control that distinguishes the defect from a broken harness. Check harness fidelity to the actual path and repeatability. Use relevant existing tests, builds and supporting integration checks; state exactly what they establish. If reproduction is infeasible, explain why and what evidence supports the conclusion. Respect the legacy SmartPy toolchain limits in [contract guidance](../contracts/AGENTS.md); a substitute model does not verify the active contract or deployed Michelson.

Keep conclusions explicit:

- **Confirmed failure:** identified source violates a grounded property on a reachable path; give preconditions, source locations, expected/actual behavior, consequence, and reproduction or decisive source evidence. State any missing reproduction and live-impact limits.
- **Hypothesis:** plausible failure with an unresolved path, assumption, or oracle; say what would confirm or refute it. Do not present it as a confirmed finding.
- **Unverified integration:** external/live behavior not established by the available source, fixtures, or observations; identify the boundary and needed evidence.
- **Limitation:** incomplete examination, unavailable tooling/access, or excluded behavior that constrains the result.

A material finding affects the consequential properties above; prioritize by credible impact and reachability, not hypothetical worst-case language. Unresolved consequential hypotheses require investigation or an explicit qualification of the claim. Preserve useful reproduction evidence and regression tests normally, without making extra process artifacts a prerequisite.

## Iterate

1. Enumerate initial coverage with the discovery procedure above.
2. Audit the complete selected coverage with the audit-pass procedure above.
3. Report confirmed findings with their evidence and impact; keep hypotheses and limitations distinct. If examination is incomplete, report progress without claiming a completed pass.
4. Remediate through the existing [universal Codex ticket workflow](codex-workflow.md), under authorized ticket scope. Findings do not authorize fixes. Reuse its implementation, review and handoff rules.
5. Repeat the same complete audit pass against the improved implementation, including prior finding paths, adjacent effects and the rest of selected coverage. Ordinary fixes do not trigger full re-enumeration. Material new or changed consequential behavior enters affected coverage immediately and is examined before the pass can finish.
6. After a provisional clean pass, refresh enumeration with the **original discovery procedure**, independently challenging current source before comparison with the map.
7. Incorporate any coverage gaps and resume investigation with the same audit method; after another provisional clean pass, refresh again. If no gaps remain, evaluate final clean evidence below.

Keep a compact pass/result note with source revisions, examination completion, verification outcomes, remaining findings/uncertainties, and refresh outcome in coverage or working notes. Reuse evidence only where its source and assumptions remain applicable; a new pass must still examine all selected behavior. Do not require an arbitrary number of consecutive clean passes.

## Clean-result standard

A provisional clean pass requires completed examination of declared coverage, no unresolved material findings within it, relevant deterministic and supporting verification, and an explicit account of unverified external/live behavior and other limitations. Accepted risk or an unavailable check does not turn a material failure into a clean result. Resolve consequential uncertainty or qualify/narrow the claim transparently.

A final clean claim additionally requires a successful source-driven coverage refresh with no remaining gaps on the identified source revisions. If source or relevant environment assumptions change afterward, reassess affected evidence and coverage before publishing. State scope, revisions, assumptions, checks, and unresolved external/live boundaries alongside the result. Full-application language requires full-application coverage; a bounded clean result cannot imply it.

A clean source review is evidence about examined source under stated assumptions, never independently verified production security, deployment readiness, or absence of all defects. Live Webflow, wallet/provider behavior, RPC/indexer accuracy, deployed contract identity and operation outcomes need their own identified evidence; mocked success cannot establish them.

## Workspace

Use [audits/coverage.md](../audits/coverage.md) for the compact behavioral map and current review context. Use ignored `audits/work/` for temporary traces, harnesses and investigation notes. Preserve useful technical evidence in normal task-authorized locations and regression tests with their implementation; do not discard it merely because temporary work is ignored.

Create `audits/report.md` only when a final public report is genuinely ready. Until then, communicate findings through working evidence and the existing ticket loop. No additional artifact set or procedural tracking system is required.
