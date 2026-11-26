# Session foundation

Use this procedure to reconstruct working context from the latest complete repository ZIP, including the independent nested `admin-ui` repository, and a short startup prompt. It establishes understanding, not operational authority, a new audit framework, or a requirement to enumerate the whole system.

## Read the durable context

1. Read [project intent](../PROJECT_INTENT.md), Outer [AGENTS.md](../AGENTS.md), the [universal ticket workflow](codex-workflow.md), and [known issues](known-issues.md).
2. Read the [developer guide](developer-guide.md) for current architecture and ownership. Consult the [operations guide](operations.md) and [testnet-to-mainnet runbook](testnet-to-mainnet.md) for task-relevant procedures, release limitations, and network boundaries. Use [README.md](../README.md) as orientation, not a substitute for those authorities.
3. Read scoped instructions and documentation for the work being considered: [Admin AGENTS.md](../admin-ui/AGENTS.md) for Admin and [contracts AGENTS.md](../contracts/AGENTS.md) plus the [contract README](../contracts/burn-redeem-escrow/README.md) for contracts. Follow additional applicable instructions found along affected paths. The [prompt reference](codex-prompt-template.md) helps frame a subsequent ticket.

Do not reread unrelated dossiers or every source file by default. Historical records and future designs are useful when the task depends on their decisions. For example, the [Admin Authoring Pipeline state](admin-authoring-pipeline/13-current-project-state.md) describes that initiative, not the whole application's implementation status; check its date and named source before relying on it. When the subsequent task is a correctness audit, follow the canonical [correctness-review procedure](correctness-review.md); session orientation does not establish audit coverage or replace its source discovery and batch examination.

## Verify consequential boundaries selectively

Inspect a small set of current entrypoints, configuration sources, and relevant producers/consumers to confirm the architecture needed for this conversation. For general orientation, sample the public router/loader/runtime chain, shared network and drop-parameter authority, Admin bootstrap, and contract source boundary. Use the developer guide's paths to choose those reads; avoid dumping entire trees.

Recognize two independent repositories with separate histories, statuses, and exports. Their normal development bases are Outer `staging` and Admin `codex`; these names do not establish the ZIP's actual branch. Shared configuration and generators can cross the boundary, so inspect their effects before running them. Reading Admin for context does not authorize changing it.

If usable Git metadata is present, verify the relevant repository's root, branch, and status under the workflow before editing. If absent, explicitly state that branch, commit, history, and working-tree cleanliness cannot be verified from this ZIP. Do not infer them from folder names, old reports, or the requested branch. Do not initialize Git to manufacture provenance. Source analysis can proceed; Git-dependent exports or integration remain unavailable until a suitable checkout is supplied.

Separate observed code behavior, documented intentions, recorded historical rationale, and verification evidence. Check relevant known defects against the proposed work; do not treat general safety descriptions as proof that listed exceptions are resolved. Identify applicable release blockers and missing context, including live Webflow, wallet, chain, deployment, or approval evidence that a ZIP cannot establish. A configured Mainnet slot alone is not readiness evidence.

Flag contradictions with paths and their practical consequence. Do not invent a historical explanation or silently choose the most reassuring account. Ask for clarification only where uncertainty blocks correct work; otherwise state the bounded assumption and continue within authorized scope. Deep source investigation remains available when the task or risk warrants it.

## Foundational-understanding summary

Before substantive task work, give a concise summary covering:

- Application purpose, engineering priorities, and human decision boundaries.
- Verified architecture and source ownership, including Outer/Admin separation.
- Current development state relevant to the task, known defects, and release limitations.
- Evidence inspected, contradictions, and important unknowns, including unverifiable Git identity.
- Intended task scope and the next focused inspection or verification needed.

Keep this to a few bullets rather than a new report or approval gate. With sufficient context, continue the authorized task using the universal workflow and its completion handoff. This foundation neither authorizes unrelated fixes nor changes existing safeguards.

## Copyable conversation-start prompt

```text
Use the attached latest complete eatacid-xyz ZIP, including admin-ui, as the current source snapshot. Start with PROJECT_INTENT.md, AGENTS.md, docs/codex-workflow.md, and docs/session-foundation.md. Follow the session foundation: read relevant guidance and known issues, selectively verify source boundaries, and summarize your foundational understanding before substantive work. Distinguish facts, intentions, recorded rationale, and evidence; flag contradictions and missing context. Do not claim branch or commit identity without verifiable Git metadata. This startup prompt grants no implementation or operational authority; follow the task I provide.
```
