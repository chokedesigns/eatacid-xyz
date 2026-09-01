# AGENTS.md — eatacid-xyz workspace

## Purpose

Durable rules for Codex work in the outer `eatacid-xyz` repo and nested `admin-ui` repo.

Keep work narrow, reversible, and grounded in the CURRENT checked-out repositories.

Ticket prompts may specify one profile:

* `ROUTINE`
* `SENSITIVE`
* `AUDIT / CLOSURE`

Follow the selected profile. If none is specified, default to `ROUTINE`.

---

## Instruction precedence

When instructions overlap, use this order:

1. Explicit current ticket prompt
2. Repo-local `AGENTS.md` for the repo being modified
3. This outer workspace `AGENTS.md`
4. Prior discussion, summaries, or assumptions

A ticket prompt may narrow scope or explicitly authorize a change.

It must not silently override unrelated safety rules.

---

## Core rules

* Preserve existing behavior unless the ticket explicitly requests a behavior change.
* Prefer the smallest diff that fully satisfies the ticket.
* Treat CURRENT checked-out files as the source of truth.
* Inspect the current implementation before editing.
* Stay inside the explicit ticket allowlist.
* Do not perform drive-by cleanup, formatting sweeps, opportunistic renames, or unrelated refactors.
* If a separate issue is discovered, report it briefly instead of widening scope.
* Do not retain unrelated lockfile churn, generated-file noise, caches, build outputs, or temporary files.

---

## Documentation maintenance

For outer-repo implementation work:

* If a code or configuration change makes an existing canonical document inaccurate, update that document in the same ticket.
* Otherwise, do not touch documentation.
* Do not perform a broad documentation audit merely to satisfy this rule.

Canonical ownership:

* Architecture, runtime behavior, source ownership, and repository structure → `docs/developer-guide.md`
* Commands, builds, sanity checks, deployment, troubleshooting, and ordinary rollback → `docs/operations.md`
* Network configuration, Mainnet readiness, wallet-network behavior, and testnet-to-Mainnet cutover → `docs/testnet-to-mainnet.md`

Additional rules:

* Update `README.md` only when its high-level orientation, current-status summary, or documentation links become inaccurate.
* Do not rewrite historical evidence, performance records, or project dossiers merely to reflect current implementation; update them only when the ticket directly changes the contract, status, or evidence they intentionally record.
* Generated artifacts are not documentation authority.
* `admin-ui` implementation documentation belongs to the nested Admin repository and its applicable `AGENTS.md`.
* Keep documentation changes in the same implementation branch/ticket that makes them necessary.

---

## Repository boundaries

This workspace contains two separate Git repositories:

```text
eatacid-xyz/
└─ admin-ui/
```

Rules:

* Confirm which repo or repos the ticket applies to before editing.
* Run Git commands from the repo being modified.
* Keep outer and nested changes logically separated.
* Export diff/stat artifacts separately from each modified repo.
* Report changed files grouped by repo.
* If working inside `admin-ui`, also follow `admin-ui/AGENTS.md`.
* If a ticket applies to one repo only, leave the other repo untouched.

---

## Webflow MCP boundary

* Webflow MCP access is read-only unless the current ticket explicitly authorizes specific mutations.
* Before detailed inspection, confirm the exact target site ID stated by the ticket.
* During read-only tickets, do not invoke any Webflow operation that creates, updates, deletes, publishes, archives, uploads, reorders, or otherwise mutates site data.
* If required information cannot be obtained through read operations, report it as unresolved.
* Write Webflow audit artifacts only to local repository paths explicitly allowed by the ticket.

---

## Runtime contracts

Preserve these unless the ticket explicitly changes them:

* DOM IDs, classes, data attributes, and Webflow structure
* user-facing copy
* event dispatch targets and payload shapes
* wallet connect/disconnect lifecycle
* persisted-account validation
* network-switch behavior
* timers, polling, retries, resets, cancellation, and stale-write protection
* cached, mirrored, generated, and rendered state boundaries
* transaction construction and send/load/status pipelines

Before changing a sensitive contract, inspect its current producers and consumers.

Do not guess cross-module behavior.

---

## Shared drop-params contract

Authoritative source:

```text
shared/drop-params/drop-params.js
```

Generated or mirrored outputs:

```text
shared/drop-params/drop-params.json
admin-ui/src/drop-params.mirror.json
```

Rules:

* Do not edit generated JSON outputs by hand.
* Preserve the supported regeneration flow.
* Do not change schema or keys unless explicitly requested.
* If admin needs authoritative mirrored metadata, add it explicitly to the shared source instead of inferring it from display text such as `dropName`.

---

## Network rules

* Do not enable mainnet or change address blocks unless explicitly requested.
* The app's `testnet` slot currently targets Shadownet.
* Preserve the distinction between:

  * registry slot: `testnet`
  * configured environment: Shadownet
  * production slot: `mainnet`
* Do not alter RPC URLs, TzKT URLs, Beacon network values, selectors, persisted network keys, or switch behavior unless the ticket explicitly requires it.

---

## Error handling and logging

* Do not introduce silent failures in logic paths.
* Empty `catch {}` blocks are acceptable only for best-effort cleanup such as listener removal or detach operations.
* Avoid always-on console noise.
* Gate diagnostics behind an explicit debug mechanism.
* Preserve meaningful warnings and actual error reporting unless explicitly requested.

---

## Baseline verification workflow

Follow this order unless the ticket prompt requires a different sequence.

### 1. Confirm repo identity and starting state

Run in each repo being modified:

```powershell
git rev-parse --show-toplevel
git branch --show-current
git status --short
```

If unexpected tracked changes exist, stop and report them.

### 2. Inspect before editing

* Confirm the ticket premise against CURRENT files.
* Inspect nearby producers and consumers when the contract is sensitive.
* Do not turn a routine ticket into a broad audit.

### 3. Apply the smallest valid patch

* Stay inside the allowlist.
* Avoid unrelated formatting or newline churn.
* Preserve unrelated behavior.

### 4. Inspect the focused diff

Run:

```powershell
git status --short
git diff --stat
git diff --check
```

Also inspect the ticket-relevant focused diff.

Confirm only allowed changes remain.

### 5. Run the relevant hard gate

Outer repo, usually:

```powershell
npm run build:pages:staging
```

Use only when specifically justified:

```powershell
npm run pages:sanity
```

Nested `admin-ui`, from `/admin-ui`:

```powershell
npm run build:clean
```

Do not launch optional dev servers merely as a formality.

### 6. Restore incidental side effects

After verification:

* restore tracked generated files touched only by builds
* remove build outputs, caches, and temporary files
* preserve only the intended patch
* use workspace-bounded cleanup only

### 7. Confirm final tracked state

Run:

```powershell
git status --short
git diff --stat
git diff --check
```

### 8. Export patch artifacts

From each repo with an intended tracked patch:

```powershell
git rev-parse --show-toplevel
npm run ticket:diff
```

Confirm creation or overwrite of:

```text
ticket.<branch>.diff
ticket.<branch>.stat.txt
```

For read-only verification tickets, export empty artifacts only when the ticket prompt requests them.

If export causes Git-index side effects, restore the intended index state while preserving the artifact files.

---

## Completion response

Return one fenced plain-text completion summary using the profile-scaled format supplied by the ticket prompt.

Rules:

* Do not add commentary outside the fenced block.
* Do not claim checks that were not run.
* Do not claim merge readiness or checklist approval.
* Keep `ROUTINE` handoffs compact.
* Include relevant contract-preservation checks for `SENSITIVE` tickets.
* Include detailed reconciliation, limitations, deferrals, seams, and blockers for `AUDIT / CLOSURE`.
* Treat exported diff/stat artifacts as the source of truth for second-pass review.