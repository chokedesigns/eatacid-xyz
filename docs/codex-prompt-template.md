# Codex prompt reference

**Minimize total prompt and execution token consumption without sacrificing correctness, security, investigation quality, or necessary verification.**

Use [AGENTS.md](../AGENTS.md) and the [universal workflow](codex-workflow.md) as durable instructions. For a fresh ZIP conversation, first use the [session foundation](session-foundation.md). Keep ticket prompts limited to the specific objective, scope, constraints, acceptance criteria, and necessary verification. Do not paste the workflow, handoff, or historical audit into each ticket.

## Choose a compact profile

Select by actual affected behavior and risk, not patch size. Profiles use the same ticket workflow; they grant no additional authority.

| Profile | Appropriate use | Add only what is needed |
| --- | --- | --- |
| ROUTINE | Documentation or bounded maintenance with low behavioral risk | Focused current-file inspection, acceptance checks, and applicable verification. |
| SENSITIVE | Wallet/account authority, funds, identities/amounts, transactions, networks, asynchronous state, shared contracts, or release safeguards | Trace changed producers and consumers; check relevant failure, stale-result, cancellation, retry, and adversarial cases. Retain applicable regression, build, and smoke gates. |
| INVESTIGATION | A bounded question, defect hypothesis, or consequential uncertainty requiring evidence | Define the question, entrypoints, evidence needed, and stopping condition. Trace source and consumers and use adversarial checks where warranted; distinguish demonstrated failures from hypotheses and untested live behavior. |

An investigation may require sensitive-level care. Expand inspection when evidence exposes an unresolved consequential dependency; report remaining uncertainty if the question cannot be resolved within scope. Findings do not authorize unrelated implementation. Proposed remediation needs its own authorized scope.

## Copyable ticket skeleton

```text
# <ID> — <title>
Profile: <ROUTINE / SENSITIVE / INVESTIGATION>
Repositories / owner-prepared branches: <affected repositories and branches>
Follow applicable AGENTS.md and docs/codex-workflow.md.

Objective / acceptance: <specific resulting behavior or question to resolve>
Scope: <files or surfaces; explicit exclusions if needed>
Task-specific constraints: <only additions or explicit exceptions to durable rules>
Verification: <checks required for this change; justified skips or substitutions>
Profile focus: <only the relevant tracing, failure cases, or investigation bound>

Use the universal workflow's review export and standardized completion handoff.
```

Omit unused fields and profile details. Owner-prepared branch names are task context, not permission to create or switch branches. Keep Outer and Admin scope explicit. Default verification still applies unless the ticket specifies otherwise; documentation-only work can explicitly omit application builds.

## Keep execution proportional

Reuse inspected evidence while it remains current; batch independent focused searches and avoid repeated repository-wide scans. Inspect current files before editing and revisit dependencies when findings require it. Prefer the smallest sufficient verification set, while preserving all applicable safety gates. Run builds in affected repositories when required; justify extra builds, dev servers, or live checks by a concrete uncertainty.

Bound investigations by a decision or evidence question, rather than an open-ended request to find everything. Report separate issues without implementing them. Finish with the workflow's compact completion block, actual verification outcomes, exact per-repository export filenames, limitations, and final Git state. Detailed investigation evidence belongs only in task-requested artifacts; do not add a second routine report or imply merge approval.
