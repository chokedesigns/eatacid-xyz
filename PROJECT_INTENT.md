# EA-XYZ project intent

EA-XYZ (EATACID.xyz) is a Tezos application connecting public artwork and token experiences with operator administration and smart-contract execution. Public surfaces include Home, Drops, Exchange, and Collection Utility. Admin supports operational work such as escrow pause controls, treasury, token pairs, drop configuration, and health checks. Burn/redeem escrow contracts enforce on-chain exchange rules. These parts form one application, but they have distinct responsibilities and authorities.

## Engineering priorities

Financial correctness, wallet authority, and security take priority over convenience. Token identities, amounts, balances, approvals, destinations, and transaction outcomes must retain their meaning across interfaces. An obsolete account observation must not authorize a later action. Unknown or incomplete information must not become a confident balance, readiness signal, or success claim. These are intended properties; their statement here does not certify that every current path satisfies them.

Maintainability and minimal unnecessary complexity support those priorities. Prefer narrow changes, explicit ownership, understandable state transitions, and recoverable operations. Preserve useful functionality and consequential boundaries while changing only what the task requires. Complexity is justified by an application need or demonstrated risk, rather than by the opportunity to build a more general platform.

Credible evidence matters more than confident language. A passing fixture, successful build, reviewed source, and observed live operation support different conclusions. Reports should say what was examined, under which conditions, and what remains unverified. Neither documentation nor generated artifacts alone establish deployed identity, production readiness, or absence of defects.

## Architecture and authority

There are two independent Git repositories: Outer `eatacid-xyz` and nested `admin-ui`. Contracts reside within Outer. Independent histories do not eliminate shared operational dependencies: Outer owns the authoritative drop-parameter source and tooling that generates its JSON projection and Admin mirror; shared network and contract configuration also connects the surfaces. Generated copies are consumers, not competing authoring authorities.

The current public architecture combines Webflow-owned presentation with Git-owned JavaScript delivered through GitHub Pages routers, environment loaders, and built runtime artifacts. Public wallet lifecycle and trade helpers serve page-specific behavior. This describes the present implementation, not a commitment to retain every dependency indefinitely. Future architecture proposals must remain distinguishable from shipped behavior.

Humans retain control over Git integration, production decisions, material risk acceptance, deployment and transaction authorization, and manual contract unpausing. A published countdown or saved drop configuration does not itself unpause a contract. Neither an AI recommendation nor an automated check transfers those decisions to the tool.

## Knowledge and AI-assisted engineering

Keep four kinds of knowledge distinct: implementation facts observed in current source; intended behavior expressed by requirements; design rationale supported by recorded decisions; and verified evidence from identified checks or observations. Where the original reason for an architectural choice is not recorded, say that it is unknown. Present-day plausibility is not historical evidence. Conflicts between guides, code, known issues, and older records should remain visible until resolved.

AI assistants help reconstruct context, investigate defects, implement scoped changes, and review actual patches. In the universal workflow, Codex implements and exports, ChatGPT reviews the changes, and the owner decides integration. Assistants can trace relationships and challenge assumptions, but can also miss consumers, misread asynchronous authority, or overstate verification. An implementation summary is not a substitute for reviewing the exported changes. Human judgment remains necessary, and independent review is useful without being proof of correctness.

## Rejected approaches and retained lessons

The retired audit's central lesson is that rigorous defect investigation was useful, while accumulating procedural requirements became counterproductive. Preserve careful reasoning and evidence without reviving the retired audit as a standing authority or making every task a system-wide investigation. Process must serve the application; completing process must not become an independent objective.

Broad rewrites, speculative abstractions, and unrelated remediation are poor substitutes for a bounded, reviewable change. The historical [Webflow migration decision](docs/webflow-migration/06-decision-record.md) specifically rejected a client-rendered SPA and runtime server/CMS architecture for that migration because the evidenced needs did not justify their added dependencies and simultaneous runtime changes. That scoped rationale is not a universal ban on those technologies or proof that migration has shipped.

This document preserves purpose and principles. Current architecture, operating procedures, network readiness, known defects, and ticket execution remain in their [developer guide](docs/developer-guide.md), [operations guide](docs/operations.md), [network runbook](docs/testnet-to-mainnet.md), [known issues](docs/known-issues.md), and [universal workflow](docs/codex-workflow.md).
