# Audit Prompts System

This package audits a repository progressively instead of trying to discover everything in one pass. Each phase has one job, and later phases consume the complete durable output of earlier phases. The goal is repeatable, exhaustive coverage with explicit closure, not a subjective “looks good” review.

The package includes exact distribution copies of the governing Constitution and schemas. Step 0 defines `AUDIT_PROMPTS_DIR`; supply the packaged contracts from `<AUDIT_PROMPTS_DIR>\Contracts\` without assuming that directory exists inside the repository under inspection.

## Default workspace and artifact storage

The default workspace layout is:

```text
C:\Users\njbut\Documents\EATACIDxyz
├─ Docs
│  └─ Audit Prompts System
├─ GitHub
│  └─ <audited repos>
└─ Audit Runs
   └─ <repo-name>
      └─ <run-name>
```

Store durable audit artifacts outside the audited repository. The default artifact root is `C:\Users\njbut\Documents\EATACIDxyz\Audit Runs\`; create one folder per audited repository and one subfolder per audit run. On another machine or workspace, use an analogous sibling `Audit Runs` folder. The absolute path above is an operating default, not a methodology requirement.

Use these canonical artifact filenames where applicable:

- `P1-L1-INVENTORY-v1.md`
- `P2-L1-CORRECTNESS-v1.md`
- `Execution Checklist.md`
- `remediation-git-log.txt`
- `Remediation Trace.md`
- `P3-L1-CLOSURE-v1.md`
- `P4-L1-COHERENCE-v1.md`
- `L1-HANDOFF-v2.md`
- `P5-L2-INVENTORY-v1.md`

Audit artifacts are operational records. They are not required to be committed to either the audited repository or the Audit Prompts System repository.

## Step-by-step workflow

0. **Create the audit-run directory and set operational variables**
   - `AUDIT_RUN_DIR` is the selected absolute audit-run artifact directory. Create it before Phase 1.
   - Default example: `C:\Users\njbut\Documents\EATACIDxyz\Audit Runs\<repo-name>\<run-name>`.
   - `AUDIT_PROMPTS_DIR` is the packaged prompt root.
   - Default: `C:\Users\njbut\Documents\EATACIDxyz\Docs\Audit Prompts System\Final Prompts`.
   - Include `AUDIT_RUN_DIR: <absolute path>` with every Codex phase and every Traditional-LLM helper invocation for the run.
   - Supply every Codex phase with these five governing contract files from `<AUDIT_PROMPTS_DIR>\Contracts\`:
     - `Audit System Constitution.md`
     - `Coverage Matrix.md`
     - `Finding Schema.md`
     - `Stopping Boundary Schema.md`
     - `Handoff Schema.md`
   - Do not assume `Final Prompts/Contracts/` or `<AUDIT_PROMPTS_DIR>\Contracts\` is relative to or present inside the audited repository. Supply the contracts through accessible absolute paths, attachments/context, or another non-mutating mechanism supported by the execution environment.
   - Do not copy contracts into the audited repository merely to satisfy prompt lookup unless that mutation is deliberately authorized.
   - On another machine or workspace, set both `AUDIT_RUN_DIR` and `AUDIT_PROMPTS_DIR` to the analogous absolute locations, using a sibling `Audit Runs\<repo-name>\<run-name>` directory for run artifacts.
   - Store every durable artifact for the run under `AUDIT_RUN_DIR` using its canonical filename. These artifacts are not required to be committed to either the audited repository or the Audit Prompts System repository.

1. **Run Phase 1 in Codex**
   - Work in the repository being audited and use `<AUDIT_PROMPTS_DIR>\Level 1\Phase 1 - Session Start.txt` with the governing contracts.
   - Save the complete output as `<AUDIT_RUN_DIR>\P1-L1-INVENTORY-v1.md`.
   - This establishes the Level-1 inventory and search space.

2. **Run Phase 2 in Codex**
   - In GitHub Desktop, switch to `staging` and confirm the exact current state to audit.
   - Give Codex `<AUDIT_RUN_DIR>\P1-L1-INVENTORY-v1.md`, `<AUDIT_PROMPTS_DIR>\Level 1\Phase 2 - Correctness Audit.txt`, and the governing contracts.
   - Save the complete output as `<AUDIT_RUN_DIR>\P2-L1-CORRECTNESS-v1.md`.
   - Use the full audited commit already recorded in `<AUDIT_RUN_DIR>\P2-L1-CORRECTNESS-v1.md` as `<PHASE_2_BASE_COMMIT>`; do not discover or invent a separate value.
   - This exhaustively audits the Level-1 search space and produces supported findings.

3. **Create the remediation branch**
   - In GitHub Desktop, create a dedicated integration branch from the exact audited state, such as `audit/phase-2-remediation`.
   - Keep `staging` unchanged while remediation and Phase 3 are in progress.

4. **Create the initial execution checklist**
   - Give `<AUDIT_RUN_DIR>\P2-L1-CORRECTNESS-v1.md` and `<AUDIT_PROMPTS_DIR>\Traditional LLM\Phase 2 - Ticket Reconciliation.txt` to a traditional LLM in `INITIAL` mode.
   - Reconcile the supported findings and derived work into a compact execution checklist and save the complete output as `<AUDIT_RUN_DIR>\Execution Checklist.md`.
   - Do not re-audit, invent findings, or reinterpret closure.

5. **Remediate the checklist**
   - In GitHub Desktop, branch each implementation ticket from `audit/phase-2-remediation` and merge it back into that branch when complete.
   - Include the exact checklist Ticket ID in every remediation ticket branch name, for example `ticket-0.1-...`.
   - Include the exact checklist Ticket ID in every remediation commit summary associated with that ticket.
   - Use GitHub Desktop for normal branch creation, switching, commits, merges, and pushing.

6. **Export remediation Git history**
   - After remediation work is complete and merged, use PowerShell/CLI to export the complete integration-branch history from the Phase-2 base commit to current `HEAD`:
     `git log --graph --decorate --format="%H %d %s" <PHASE_2_BASE_COMMIT>..HEAD > "<AUDIT_RUN_DIR>\remediation-git-log.txt"`
   - The exported history is `<AUDIT_RUN_DIR>\remediation-git-log.txt`.

7. **Create the provenance-reconciled execution checklist**
   - Give the existing `<AUDIT_RUN_DIR>\Execution Checklist.md`, `<AUDIT_RUN_DIR>\remediation-git-log.txt`, and `<AUDIT_PROMPTS_DIR>\Traditional LLM\Phase 2 - Ticket Reconciliation.txt` to a traditional LLM in `REMEDIATION_RECONCILIATION` mode.
   - Save the complete provenance-reconciled output back to `<AUDIT_RUN_DIR>\Execution Checklist.md`, preserving all Ticket IDs, source IDs, ordering, existing statuses, and history.
   - Assign each ticket the deterministic `Implementation-provenance state` defined by the helper: `NO_PROVENANCE_FOUND`, `PROVENANCE_FOUND`, or `UNTRACED`.
   - `NO_PROVENANCE_FOUND` means only that the supplied complete, reconcilable landed Git history contains no commit explicitly attributable to the exact Ticket ID. It does not mean work was never attempted or started.
   - `PROVENANCE_FOUND` means only that one or more landed commits are attributable through an exact Ticket ID in the commit summary; it does not mean the ticket objective is correct, acceptance criteria passed, verification passed, or closure was achieved.
   - Implementation-provenance state remains separate from the existing checklist `Status`, correctness, acceptance, verification, finding disposition, and closure. Preserve the existing `Status` and its history unchanged.
   - Keep missing, conflicting, or otherwise unreconcilable provenance `UNTRACED` rather than guessing. Phase 3 independently verifies remediation and owns finding closure.

8. **Generate the remediation trace**
   - Give a traditional LLM:
     - `<AUDIT_RUN_DIR>\P2-L1-CORRECTNESS-v1.md`
     - the provenance-reconciled `<AUDIT_RUN_DIR>\Execution Checklist.md`
     - `<AUDIT_RUN_DIR>\remediation-git-log.txt`
     - `<AUDIT_PROMPTS_DIR>\Level 1\Phase 3 - Closure Audit.txt`
     - `<AUDIT_PROMPTS_DIR>\Traditional LLM\Phase 2 - Remediation Trace Synthesis.txt`
   - Use the remediation-trace helper in `INITIAL` mode.
   - Save the complete pre-Phase-3 output as `<AUDIT_RUN_DIR>\Remediation Trace.md`.

9. **Run Phase 3 in Codex**
   - Run against the current `audit/phase-2-remediation` state using `<AUDIT_PROMPTS_DIR>\Level 1\Phase 3 - Closure Audit.txt` and the governing contracts.
   - Give Codex `<AUDIT_RUN_DIR>\P2-L1-CORRECTNESS-v1.md`, `<AUDIT_RUN_DIR>\Remediation Trace.md`, and the prior `<AUDIT_RUN_DIR>\P3-L1-CLOSURE-v1.md` only if this is a Phase-3 rerun.
   - Save the complete output as `<AUDIT_RUN_DIR>\P3-L1-CLOSURE-v1.md`.
   - Phase 3 reruns the entire current Level-1 denominator, not just fixed tickets.
   - If Phase 3 fails, use the ticket-reconciliation helper in `PHASE_3_CONTINUATION` mode with the existing `<AUDIT_RUN_DIR>\Execution Checklist.md` and latest failed `<AUDIT_RUN_DIR>\P3-L1-CLOSURE-v1.md`. Reconcile only its supported new or unresolved findings and recorded follow-up work into the checklist.
   - Remediate the additional tickets on the same integration branch, preserving Ticket IDs in branch names and every associated remediation commit summary.
   - Export a fresh complete `<AUDIT_RUN_DIR>\remediation-git-log.txt`, then run `REMEDIATION_RECONCILIATION` again before synthesizing the next trace.
   - Use the remediation-trace helper in `PHASE_3_RERUN` mode with `<AUDIT_RUN_DIR>\P2-L1-CORRECTNESS-v1.md`, the updated provenance-reconciled `<AUDIT_RUN_DIR>\Execution Checklist.md`, the fresh `<AUDIT_RUN_DIR>\remediation-git-log.txt`, the latest failed `<AUDIT_RUN_DIR>\P3-L1-CLOSURE-v1.md`, and the Phase-3 prompt. Regenerate `<AUDIT_RUN_DIR>\Remediation Trace.md` without dropping prior Phase-3 finding history.
   - Rerun Phase 3 with the updated inputs. Continue until Phase 3 reaches valid closure and its Phase-4 gate passes.

10. **Merge remediation into `staging`**
    - Only after valid Phase-3 closure and a passing Phase-4 gate, use GitHub Desktop to merge the validated `audit/phase-2-remediation` branch into `staging`.
    - If `staging` changed during remediation, do not merge blindly. Reconcile those changes into the remediation branch, rerun Phase 3, and promote only after closure and the gate pass again.

11. **Run Phase 4**
    - Operator package:
      - the current repository at the Phase-3-closed state
      - `<AUDIT_RUN_DIR>\P3-L1-CLOSURE-v1.md`
      - `<AUDIT_PROMPTS_DIR>\Level 1\Phase 4 - Unification Pass.txt`
      - the governing contracts
    - Save the complete output as `<AUDIT_RUN_DIR>\P4-L1-COHERENCE-v1.md`.
    - Phase 4 may record required coherence/unification work, but it does not itself implement remediation unless its governing prompt explicitly authorizes implementation.
    - Do not automatically perform post-Phase-4 changes before Phase 4.5 merely because Phase 4 records follow-up work. Preserve and follow any upstream re-adjudication and reclosure requirements recorded by the artifact.

12. **Run Phase 4.5**
    - Operator package:
      - `<AUDIT_RUN_DIR>\P1-L1-INVENTORY-v1.md`
      - `<AUDIT_RUN_DIR>\P2-L1-CORRECTNESS-v1.md`
      - `<AUDIT_RUN_DIR>\P3-L1-CLOSURE-v1.md`
      - `<AUDIT_RUN_DIR>\P4-L1-COHERENCE-v1.md`
      - `<AUDIT_PROMPTS_DIR>\Level 1\Phase 4.5 - Handoff Synthesis.txt`
      - the governing contracts
    - Save the complete output as `<AUDIT_RUN_DIR>\L1-HANDOFF-v2.md`.
    - Missing evidence stays missing; do not reconstruct it.

13. **Run Phase 5**
    - Operator package:
      - the current repository
      - a valid `<AUDIT_RUN_DIR>\L1-HANDOFF-v2.md`
      - `<AUDIT_PROMPTS_DIR>\Level 2\Phase 5 - Deep Systems Foundation.txt`
      - the governing contracts
    - Save the complete output as `<AUDIT_RUN_DIR>\P5-L2-INVENTORY-v1.md`.
    - Phase 5 expands exactly one level deeper and exhaustively enumerates Level-2 candidates. It is inventory/foundation work, not the Level-2 correctness audit.

## Current packaged stopping point

The current packaged workflow ends at Phase 5 and the Level-2 foundation handoff in `<AUDIT_RUN_DIR>\P5-L2-INVENTORY-v1.md`. Phase 6, the Level-2 correctness consumer, is not included in this package. Do not infer or create a Phase-6 prompt from the packaged materials.

## Important rules

- GitHub Desktop is the default Git interface. Use PowerShell/CLI only for explicit artifact or history export where it is useful, including the remediation-history export above.
- Risk changes inspection order, never scope.
- Findings never allow the audit to stop early.
- Remediation is not the same as verified closure.
- Missing evidence must remain missing/`UNTRACED`; do not reconstruct it.
- Deeper evidence that contradicts an earlier conclusion must use upward invalidation and reclosure.
- Unchanged inputs should converge on the same logical search space and stable IDs.
- Do not skip ahead if a required prior phase or gate is incomplete.

## Artifact handling

- Return every durable phase artifact, execution checklist, remediation trace, or handoff as one complete, self-contained, copy/pasteable plain-text or Markdown artifact inside one fenced block.
- Identify the intended artifact/output name at the beginning of that block. Do not split required content across surrounding commentary, multiple blocks, summaries, or `see above` references.
- When `AUDIT_RUN_DIR` is supplied and writable, write an exact `.md` or `.txt` copy of the complete artifact, as applicable, to its canonical filename under that directory. This external copy is in addition to, never instead of, the mandatory complete fenced response block and does not authorize mutation of the repository or system under inspection.
- If `AUDIT_RUN_DIR` is unavailable or unwritable, return the complete fenced artifact normally and report that the external copy was not written.
- If a complete required artifact cannot fit in the available response, explicitly report response delivery as incomplete; do not silently truncate, summarize, claim completion, or substitute a partial artifact for a required complete durable artifact. An external copy does not make an incomplete response complete.
- Keep the single-block output convention for every complete artifact.
- Read-only audit and closure phases must continue to obey all existing no-mutation rules; artifact delivery grants no mutation authority.

## Where to start

For a fresh audit, start with Phase 1 and proceed in order. If resuming, start from the earliest phase whose required artifact or gate is not already valid.

The files in `Final Prompts/` are packaged copies for normal use. The canonical editable prompt sources remain under `Level 1/Prompts/` and `Level 2/Prompts/`.
