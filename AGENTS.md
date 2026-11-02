# Engineering guidance — eatacid-xyz

These rules cover the outer repository and the separate nested `admin-ui` repository.
The current task takes precedence; follow repo-local guidance for the files being changed.
Use [the universal Codex workflow](docs/codex-workflow.md) for all tickets, including its required completion handoff.

## Scope and repository boundaries

- Inspect current checked-out files before editing. Preserve behavior unless the task explicitly changes it.
- Keep changes narrow, reversible, and inside the requested scope. Avoid unrelated cleanup, formatting, renames, and refactors; report separate issues without fixing them.
- Before editing each affected repository, run `git rev-parse --show-toplevel`, `git branch --show-current`, and `git status --short`. Stop on unexpected tracked changes.
- Run Git commands from the repository being changed. Follow `admin-ui/AGENTS.md` for Admin work and `contracts/AGENTS.md` for contract work. Leave an out-of-scope repository untouched.
- Keep outer and Admin changes and review exports separate. Normal development bases are Outer `staging` and Admin `codex`. The owner manages ticket branches and decides when to commit, merge, and push. Do not create/switch branches, stage, commit, reset, merge, push, deploy, or perform transactions without explicit task authorization.

## Runtime and transaction safeguards

Preserve DOM IDs, classes, data attributes, Webflow structure, visible copy, event targets and payloads, exported interfaces, wallet connect/disconnect behavior, persisted-account validation, and network-switch behavior unless explicitly changed.

Preserve timers, polling, retries, resets, cancellation, stale-write protection, cached/generated/rendered state boundaries, and transaction construction and send/load/status pipelines. Inspect current producers and consumers before changing a sensitive contract; do not guess cross-module behavior.

- Do not introduce silent failures. Empty catches are allowed only for best-effort cleanup such as listener removal.
- Keep diagnostics behind explicit debug controls; preserve meaningful warnings and errors.
- Preserve regression tests, runtime translation validation, contract certification/provenance, and build, deployment, CI, and release safeguards.
- Preserve drop-parameter recovery journals and locks. Never delete unresolved state to bypass a fail-closed writer; use the supported status/recovery procedure in `docs/operations.md`.

## Generated data and networks

- `shared/drop-params/drop-params.js` is authoritative. Do not hand-edit `shared/drop-params/drop-params.json` or `admin-ui/src/drop-params.mirror.json`; preserve the regeneration/mirroring flow.
- Do not change schema or keys without explicit authorization. Add authoritative metadata to the shared source rather than infer it from display text such as `dropName`.
- The `testnet` registry slot targets Shadownet; `mainnet` is the production slot. Do not enable Mainnet, change address blocks, RPC/TzKT URLs, Beacon network values, selectors, persisted network keys, or switch behavior unless explicitly requested.

## Webflow access

- Webflow MCP is read-only unless the current task authorizes specific mutations. Confirm the exact target site ID before detailed inspection.
- During read-only work, do not create, update, delete, publish, archive, upload, reorder, or otherwise mutate site data. Report information unavailable through reads as unresolved.
- Write inspection artifacts only to paths authorized by the task.

## Documentation

Update an existing canonical document only when the change makes it inaccurate:

- Architecture, runtime behavior, source ownership, repository structure: `docs/developer-guide.md`.
- Commands, builds, deployment, troubleshooting, rollback: `docs/operations.md`.
- Networks, Mainnet readiness, wallet-network behavior, cutover: `docs/testnet-to-mainnet.md`.

Update `README.md` only when its orientation, status, or links become inaccurate. Preserve historical evidence and specialist dossiers unless the task directly changes their recorded contract or status. Generated artifacts are not documentation authority. Admin implementation documentation belongs to Admin.

## Verification and handoff

- Inspect the focused diff and run `git status --short`, `git diff --stat`, and `git diff --check` in each affected repository.
- Unless the task specifies otherwise, validate outer implementation changes with `npm run build:pages:staging` and Admin changes with `npm run build:clean` from Admin. Run `npm run pages:sanity` or dev servers only when specifically justified.
- Restore incidental tracked generated-file changes and remove only task-created outputs/caches/temporary files. Verify resolved cleanup paths stay inside the intended workspace; preserve pre-existing local assets and operational state.
- Confirm the final diff contains only intended changes. When review artifacts are required, run `npm run ticket:diff` in each affected repository to replace its ignored root-level `ticket.<identifier>.<repo>.diff` and `ticket.<identifier>.<repo>.stat.txt` (`<identifier>` is the full branch suffix after `ticket-`; `<repo>` is `outer` or `admin`), including new files without modifying the real index.
- Use the required compact handoff: changes grouped by repository, actual verification commands/outcomes, outstanding issues/skipped checks, exact export filenames, and final Git state. Report relevant preserved contracts; do not claim unperformed verification or merge approval.
