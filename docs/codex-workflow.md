# Universal Codex ticket workflow

Use the existing ticket loop for features, remediation, and maintenance: owner-prepared branch, inspection, implementation, relevant verification, exported review, and fix passes on the same branch. Repository-local `AGENTS.md` safety requirements and the current ticket's scope still apply.

## Ownership and execution

1. The owner creates and manages one branch per ticket in each affected repository. Normal development bases are current `staging` for Outer and current `codex` for Admin, unless the ticket specifies another base. Outer and `admin-ui` are separate repositories; verify each root, branch, and working-tree state before editing. Stop and report unexpected pre-existing changes rather than overwriting them.
2. Codex reads current instructions and implementation, inspects producers and consumers where relevant, implements only the authorized scope, and runs checks proportionate to the changed behavior and risk. Preserve useful existing functionality and local safeguards. Report separate issues without broadening the patch.
3. Codex inspects each final diff and status, then runs `npm run ticket:diff` in each affected repository to export its changes for review. Cross-repository tickets require one invocation in Outer and one in Admin. Codex never creates or switches branches, stages, commits, resets, merges, or pushes without explicit authorization. Exporting must not modify the real indexes or source files.
4. ChatGPT reviews the actual exported changes against the ticket requirements and reported verification. A summary or passing checks alone do not replace change review. Fix passes use the same ticket branch and repeat the relevant checks and export, replacing the previous review artifacts.
5. The owner alone decides when to commit, merge, and push. Codex reports evidence and limitations, never merge approval. Deployment and transactions retain their separate authorization requirements.

Routine, sensitive, and investigation tasks use these same execution conventions. Scale verification to risk: focused checks may suffice for documentation/tooling; runtime, wallet, network, transaction, and release changes retain their applicable regression/build/smoke gates. Investigations may be read-only and produce findings that become ordinary remediation tickets; they do not establish a separate implementation workflow.

Correctness audits follow the canonical [correctness-review procedure](correctness-review.md), including bounded batch execution and its completion criteria. For audit progress sessions, defer broad final verification and review exports until audit finalization unless needed to validate a specific batch; state those deferrals in the compact handoff. Finalization retains complete per-repository exports, including new/untracked evidence, independent review of the entire exported patch, and owner-controlled integration.

Keep ticket prompts short: state the objective, repositories/branches, scope, acceptance criteria, and any exceptions. Reference this guide and local instructions instead of repeating durable rules or historical procedures.

## Review export

Run `npm run ticket:diff` from the repository being reviewed. Both npm commands use `admin-ui/scripts/export-ticket-diff.ps1`; the invoking repository alone is exported, directly into its root. The identifier is the full suffix of the current `ticket-<identifier>` branch (for example, `WF-001-universal-codex-workflow`). Each repository writes only its own pair:

- Outer: `ticket.<identifier>.outer.diff` and `ticket.<identifier>.outer.stat.txt`
- Admin: `ticket.<identifier>.admin.diff` and `ticket.<identifier>.admin.stat.txt`

Each diff compares that repository's `HEAD` with its combined current content, including staged, unstaged, and nonignored untracked files. Binary changes use Git binary patches. Repeated exports on the same branch overwrite that ticket's pair; an unchanged repository produces zero-byte diff and stat files. These are current snapshots, not branch-base comparisons or an archive of intermediate staging states. The artifacts are Git-ignored and never included in subsequent exports. Other tickets' exports and older naming formats are left untouched.

The exporter resolves the invoking repository's root and requires an existing `HEAD` on a `ticket-<identifier>` branch, with an identifier containing letters, digits, dots, underscores, or hyphens and starting with a letter or digit. Detached HEADs and unsupported branch names fail visibly. It copies the index into a private system-temporary directory and stores newly hashed objects there. It never runs `git add -N` or writes the real index. Git errors, unresolved index conflicts, inherited Git location overrides, missing artifact ignore rules, and output failures are fatal. A failed export invalidates only the current ticket's pair once the output lock is acquired; do not review an export unless the command succeeds. An exclusive, ignored `.ticket-diff.lock` file in the repository root prevents simultaneous exports of that repository; the empty lock file remains for reuse. Temporary export data is removed after the run; unrelated files are preserved.

## Completion handoff

Always conclude an implementation ticket with one compact fenced plain-text block containing these fields in this order, including for complete, partial, or blocked work. Identify the ticket, status, and verified branches; group concise changes by repository; give actual verification commands and outcomes; state outstanding issues and skipped verification; list exact export filenames with their repository roots; and report final Git state. Do not imply merge approval or add a detailed audit report.

```text
TICKET: <ticket ID>
STATUS: <complete / partial / blocked>
REPOS / BRANCHES: <affected repositories and verified branches>
CHANGES: <files grouped by repository and resulting behavior>
VERIFICATION: <actual commands and outcomes>
LIMITATIONS / SEPARATE ISSUES: <outstanding issues and skipped verification, or none>
EXPORT LOCATION: <exact diff/stat filenames grouped by repository root, or reason unavailable>
GIT STATE: <intended changes, index/HEAD/branch preservation; no commit/merge/push>
```
