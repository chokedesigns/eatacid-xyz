# AGENTS.md — Smart Contract Workspace

This directory contains the legacy SmartPy source, audit notes, and deployment workflow documentation for the burn/redeem escrow system.

## Prime directive

- Preserve 100% of existing contract behavior unless the ticket explicitly requests a behavior change.
- Contract changes are redeploy-sensitive.
- Prefer the smallest diff that satisfies the ticket.
- Do not broaden a contract ticket into a redesign, refactor, re-audit, modernization, or deployment task.

## Current-file truth rule

- Treat the current checked-out files as the source of truth.
- Do not rely on earlier summaries, prior ticket assumptions, old audit notes, previous contract versions, or inferred architecture if the current files do not support them.
- If current files conflict with prior expectations, current files win.

## Active contract workflow

The current active workflow is the legacy SmartPy workflow.

- The editable source of truth is the legacy SmartPy source file.
- The current legacy SmartPy source does not run under the modern local `smartpy-tezos` toolchain.
- Do not claim local SmartPy compile/test verification unless a compatible legacy toolchain is explicitly provided.
- Do not use modern SmartPy syntax unless the ticket explicitly starts a modernization phase.
- Modern SmartPy migration is deferred and out of scope unless explicitly requested.

## Active source artifact

The active source-controlled contract artifact is:

```text
contracts/burn-redeem-escrow/smartpy/burn-redeem-escrow-smartpy.py
```

The raw compiled Michelson artifact is not part of the normal Codex ticket loop during the legacy phase.

## Manual Michelson workflow

Michelson is generated manually outside Codex using the legacy SmartPy IDE/compiler workflow.

For SmartPy behavior tickets:

1. Codex updates the legacy SmartPy source only.
2. Codex exports diff/stat artifacts.
3. The reviewer checks the SmartPy diff.
4. The human manually compiles the updated SmartPy source through `legacy.smartpy.io`.
5. The manual compile/Michelson surface check is recorded during review/checkoff.
6. The ticket is considered complete only after both:
   - SmartPy diff review passes.
   - Manual legacy compile/Michelson check passes.

Codex must not:

- edit Michelson manually
- generate Michelson
- commit Michelson
- create per-ticket Michelson files
- claim Michelson compile verification
- treat modern `smartpy-tezos` output as valid for the current legacy source

Unless the ticket explicitly instructs otherwise.

## Ticket authority rule

- Treat the ticket goal and allowed scope as authoritative for execution.
- Do not broaden beyond the ticket unless explicitly instructed.
- Do not reframe the ticket into a broader audit, redesign, cleanup, modernization, or redeploy task.
- If you discover a separate issue, note it briefly in the completion summary instead of changing it.

## Scope control

Only touch files required for the current ticket.

No drive-by changes:

- no formatting sweeps
- no broad refactors
- no opportunistic renames
- no unrelated documentation edits
- no unrelated frontend/admin changes
- no manual generated-artifact churn
- no “while we’re here” cleanup
- no modern SmartPy migration during legacy tickets

## Expected directory context

Contract files are expected under:

```text
contracts/
  AGENTS.md
  burn-redeem-escrow/
    README.md
    smartpy/
      burn-redeem-escrow-smartpy.py
    artifacts/
      checks/
      deployment-notes/
```

If the current repo structure differs, use the current repo structure as truth and report the difference.

## Contract-specific safety constraints

Do not change any of the following unless the ticket explicitly requires it:

- entrypoint names
- parameter layout
- storage layout
- event tags
- event payload shapes
- error strings
- admin authority model
- pause/unpause behavior
- FA2 transfer interface
- public burn/redeem semantics
- token-pair storage shape
- XTZ handling behavior
- embedded test intent
- legacy SmartPy syntax style

## Legacy SmartPy rules

- The current source uses legacy SmartPy syntax.
- Preserve legacy syntax unless the ticket explicitly starts a modernization project.
- Do not convert legacy constructs to modern SmartPy syntax during normal audit-fix tickets.
- Do not rewrite helper structure or test scaffolding unless the ticket explicitly requires it.
- Do not remove comments or tests unless the ticket explicitly requires it.
- Update embedded SmartPy tests when the ticket explicitly requires test coverage changes.
- If a ticket changes behavior, keep the source/test changes tightly tied to that behavior.

## Required contract review posture

When modifying or reviewing contract logic, always consider:

- direct calls bypassing frontend assumptions
- single-trade behavior
- multi-trade behavior
- first-trade vs per-trade batch behavior
- caller-supplied `user_wallet`
- caller-supplied burn/redeem fields
- token-pair storage validation
- token-pair configuration mistakes
- redeem inventory custody
- burn address semantics
- pause/unpause state
- admin rescue authority
- XTZ receive/withdraw behavior
- event payload correctness
- FA2 transfer compatibility
- failure atomicity
- frontend/admin operation-builder compatibility
- manual Michelson compile/checkoff implications

## Frontend/admin compatibility rule

The contract is used by the public frontend and nested admin-ui.

Do not change contract-facing compatibility unless the ticket explicitly requires it.

Be especially careful around compatibility with:

- public Drops burn/redeem operation builders
- public Exchange burn/redeem operation builders
- Admin UI escrow operation builders
- token-pair setup/update/delete calls
- FA2 approval/update-operator logic
- TzKT token-pair lookup logic
- shared chain registry / escrow address config
- Micheline parameter layout expected by callers

If a SmartPy change may require frontend/admin follow-up, state that explicitly in the completion summary.

## Direct-call rule

Do not assume frontend validation makes contract behavior safe.

When reasoning about contract behavior, assume:

- any wallet can call public entrypoints directly
- caller-supplied parameters may be stale, malformed, mismatched, or adversarial
- admin entrypoints may be called directly by the admin or through imperfect tooling
- FA2 contracts may reject transfers
- redeem inventory may be insufficient
- indexer data may lag or be unavailable

## Documentation and deployment notes

For documentation-only tickets:

- Keep docs tied to the audit finding, ticket, or deployment checklist.
- Do not invent new procedures beyond the ticket scope.
- Do not mark a contract as deployment-ready unless the ticket explicitly performed the required verification.

Deployment notes belong under:

```text
contracts/burn-redeem-escrow/artifacts/deployment-notes/
```

Audit/check evidence belongs under:

```text
contracts/burn-redeem-escrow/artifacts/checks/
```

Manual compile/check notes may be recorded under `artifacts/checks/` only when the ticket explicitly asks for a check artifact.

## Verification workflow

Follow this order.

1. Confirm repo root first:

```bash
git rev-parse --show-toplevel
```

2. Confirm the current branch when relevant:

```bash
git branch --show-current
```

3. Inspect status before and after changes:

```bash
git status --short
```

4. Apply the ticket-scoped change.

5. For legacy SmartPy behavior tickets, do not claim local compile/test verification.

Instead, report:

- SmartPy source changed: yes/no
- embedded tests changed: yes/no
- local legacy compile: not run by Codex
- manual `legacy.smartpy.io` compile: pending human/reviewer check
- Michelson update: not performed by Codex

6. Export patch artifacts.

## Patch artifact requirement

Before writing the completion message, export a diff artifact that includes new/untracked files.

From the repo you modified:

1. Ensure new files appear in diff artifacts when necessary:

```bash
git add -N <new-file-paths>
```

2. Prefer the repo’s existing ticket artifact script when available:

```bash
npm run ticket:diff
```

3. If the ticket artifact script is unavailable, use:

```bash
git diff --stat > ticket.<branch>.stat.txt
git diff > ticket.<branch>.diff
```

4. Confirm the artifacts exist.

Notes:

- Always run `git rev-parse --show-toplevel` first to confirm repo context.
- Patch artifacts remain the source of truth for second-pass review.
- On fix passes, re-run artifact export after the fix.

## Routine permission-safe actions

When required to complete the standard ticket workflow, the agent may proceed without additional confirmation for:

- confirming repo root
- confirming current branch
- inspecting git status/diff shape
- running required hard-gate builds/checks that are documented for the affected repo area
- exporting patch artifacts
- using `git add -N` for new files so they appear in diff artifacts
- restoring generated files touched only as unintended build side effects
- refreshing git/index metadata when strictly necessary to produce clean, in-scope artifacts

## Still ask before

Ask before:

- modifying files outside the ticket scope
- broad filesystem cleanup
- manual Michelson edits
- adding Michelson artifacts back into the repo
- changing contract storage layout
- changing contract parameter layout
- changing entrypoint names
- changing frontend/admin operation builders from a contract ticket
- enabling mainnet or changing live address blocks
- deleting or moving contract artifacts
- starting modern SmartPy migration
- destructive or unusual git operations not clearly required for implementation, verification, or artifact export
- long-running watcher/dev-server commands not required for the ticket

## Allowed commands

Prefer existing repo scripts and documented commands.

Useful workspace commands:

```bash
git rev-parse --show-toplevel
git branch --show-current
git status --short
git diff --stat
git diff
npm run ticket:diff
```

Outer repo hard gates are governed by the root `AGENTS.md`.

Nested admin-ui hard gates are governed by `admin-ui/AGENTS.md`.

The current legacy SmartPy source is not compatible with the modern local `smartpy-tezos` toolchain, so do not run or claim modern SmartPy compile/test verification for legacy contract tickets.

## Completion message format

Always end with a copy/paste-ready completion summary for second-pass LLM review.

The completion summary is meant to be pasted by the human into this review wrapper:

```text
Codex task finished.

Codex completion message:
<paste Codex completion summary here>

Diff/stat artifacts attached.

Please review thoroughly against the ticket goal and current repo rules:
- Did the patch actually satisfy the ticket?
- Is the diff minimal and in scope?
- Are generated/build side effects handled correctly?
- Are the verification claims sufficient and accurate?
- Is this safe to check off / merge, or does it need a fix pass?
```

Do not output the wrapper yourself.

Only output the completion summary that belongs inside the `Codex completion message:` section.

Return exactly one copy/pasteable fenced text block.

Do not include prose before the block.
Do not include prose after the block.
Do not include markdown headings outside the block.

Use this exact completion summary structure:

```text
Task complete.

Ticket:
- <ticket number and title, if provided>
- Branch: <current branch name>

Summary:
- <brief factual summary of what changed>
- <explicitly mention any intentional behavior change, if the ticket requested one>
- <explicitly mention important behavior that was intentionally left unchanged>

Files changed:
Outer repo:
- <file path> — <brief reason>
or
- No changes.

Nested admin-ui repo:
- <file path> — <brief reason>
or
- No changes.

Contract artifacts:
- <file path> — <brief reason>
or
- No changes.

Verification steps:
- `<exact command>`
  - Result: <passed/failed/not run + relevant detail>
- `<exact command>`
  - Result: <passed/failed/not run + relevant detail>

Legacy SmartPy / Michelson status:
- SmartPy source changed: <yes/no>
- Embedded SmartPy tests changed: <yes/no/not applicable>
- Local SmartPy compile/test: <not run + reason, or not applicable>
- Manual legacy.smartpy.io compile: <pending human/reviewer check, already provided, or not applicable>
- Michelson artifact update: not performed by Codex.

Frontend / admin compatibility:
- <state whether public frontend or admin-ui operation builders are affected>
- <state whether follow-up review is required>
or
- Not applicable.

Manual / reasoning checks:
- <specific behavior or edge case checked>
- <specific behavior or edge case checked>
or
- None.

Patch artifact produced:
- <path/to/ticket.branch.diff>
- <path/to/ticket.branch.stat.txt>

Artifact stat:
- <paste the contents of the stat file, or a concise faithful summary>

Scope control:
- <confirm whether the patch stayed within intended ticket scope>
- <mention any generated-file side effects and whether they were restored>
- <mention any separate issues noticed but not changed>

Rollback note:
- <specific rollback instruction>
```

Completion message rules:

- Do not claim a check was run unless it was actually run.
- Do not claim local SmartPy tests passed.
- Do not claim local SmartPy compile passed.
- Do not claim Michelson was generated or checked by Codex.
- Do not claim merge readiness.
- Do not claim the ticket is safe to check off.
- Do not ask the reviewer to trust the summary.
- Keep the message factual, specific, and easy to paste into the review wrapper.
- The diff/stat artifacts remain the source of truth for review.
- If a section does not apply, say so directly instead of omitting it.
- For non-SmartPy tickets, mark legacy compile/manual Michelson fields as not applicable instead of pending.