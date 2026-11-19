# AUD-005-001 — supported ownership and external-concurrency limitation

Ticket `AUD-005-001-writer-source-ownership`, Outer only, 2026-11-19 (America/Chicago). **Current disposition: confirmed unsupported external-concurrency limitation; supported-path investigation complete.** The owner clarified that direct manual source editing during Admin authoring is not intended or supported. Concurrent editor/Git/custom source replacement during transaction apply, rollback or reconciliation is outside the supported ownership contract. Manual editing outside that activity remains supported, with normal projection/mirroring afterward. The read-window defect is real and unchanged; this is neither a code fix nor a launch blocker for the verified supported paths. Other audit findings and launch decisions are unaffected.

## Current supported-path reconciliation

Inspected the checked-out Outer runtime/scripts and read-only Admin entrypoints, including package scripts, browser authoring client, service routes and defaults, transaction helpers, projector, watcher, archive and recovery modules. Outer tracked-file reference searches plus explicit searches of nested Admin source/scripts found no application caller writing canonical JS outside the transaction writer. No production mutation implementation changed.

| Supported path | Consequential write boundary and verification |
| --- | --- |
| Admin authoring client/service | Browser client posts structured validate/preview/apply requests; it has no local file writer. The loopback service defaults to `executeDropParamsOperation`, checks representation equality/busy/unresolved state, binds the preview to source/candidate/plan hashes and consumes its token. Reads/previews are observations, not write reservations; the transaction revalidates after acquiring the lock. `options.execute` is an in-process test/embedding seam, not an HTTP request field or a production CLI override. |
| Local transaction CLI | `scripts/drop-params-transaction.mjs` delegates CREATE/EDIT/DEACTIVATE to the same exported transaction operations. `executeDropParamsOperation` acquires the repository claim lock before current-source validation, pending recovery, journals, archive publication, staging, replacement, rollback and completion, and releases it in `finally`. Stale source versions reject; callers cannot supply file paths. |
| Outer generation/build | `gen-drop-params-json.mjs` calls `generateOuterDropParamsJson`, which enters `withProjectionRecoveryGuard`: acquire the shared lock, reject invalid/unresolved journal state, then import canonical JS and atomically write outer JSON if changed. It does not mutate canonical JS or mirror by itself. Pages builds and CI call this generator. |
| Watcher | `watch-drop-params-json.mjs` calls `projectDropParams` at startup/on events or `--once`. Debouncing and the requested-epoch drain coalesce source saves; the projector holds the shared lock for source import and both output writes. Source changes outside transactional authoring remain supported; the watcher may transiently report stale projections while a save settles, and never writes canonical JS. |
| Admin mirror/dev/build synchronization | Admin `sync:drop-params` runs the same Outer watcher with `--once`; `watch:drop-params` runs that watcher continuously. The standalone `synchronizeAdminDropParamsMirror` also enters the guarded projector. Admin's build mirror guard only reads/parses the mirror, and production consumes a bundled mirror. No separate mirror copy writer was found. |
| Rollback/reconciliation | Automatic rollback remains inside the executing transaction's lock. New transaction admission reconciles pending operations under that lock; explicit `reconcileDropParamsTransactions` acquires it independently. Snapshot/hash validation, exact expected apply phases, recorded base/target recovery, archive verification and unresolved evidence retention remain in place. Ordinary projection never reconciles; both pending and reconciliation-required journals block it. |
| Shared helpers and lock reuse | `replaceDropParamsFileAtomic` / `writeDropParamsFileIfChanged` are exported low-level, allowlisted primitives, not independently locking authoring entrypoints. Their checked-out production callers are the locked transaction/projector paths above; direct custom calls are unsupported. Projection reuse requires the same active `withDropParamsLock` async scope; `lock:false` cannot bypass ownership or recovery and cannot reuse a released scope. Archive publication is create-exclusive with collision/read-back checks and is called by the transaction under its lock. Read-only status/inspection APIs do not mutate source. |

The supported contention regression in `shared/drop-params/drop-params-projection.test.mjs` exercises the real service reader/executor and real CLI in disposable files. With an owner holding the lock, the service rejects `writer_busy`, CLI/projector wait, and no protected bytes change. After release, the CLI completes with equal projections, the old service version is rejected, and a fresh preview/apply completes through the real writer. Existing cases cover simultaneous writers, projection contention in both orders, generator/watcher children, pending/invalid journals, failed rollback, interrupted reconciliation, archives and stale async lock scope. This supports application coordination; it does not establish OS exclusion of arbitrary file writers.

## Historical evidence disposition

The six failing preservation assertions are retained without changing their executable logic in [the external-concurrency evidence file](repro/AUD-005-writer-external-concurrency.evidence.mjs), moved out of `.test.mjs` discovery under `shared/`. The old `test:drop-params:source-ownership` npm command is retired. Explicit opt-in command:

```text
npm run evidence:drop-params:external-concurrency
```

It intentionally exits 1 with nine passing controls and six failed preservation assertions on the current writer. Its failures are historical evidence of unsupported concurrent saves, never passing regressions. Normal verification does not invoke it. The [original defect-asserting reproduction](repro/AUD-005-writer-read-window-repro.mjs) also remains opt-in historical evidence; its success does not prove a production correction. The unused native permission/broker feasibility probe was removed as exploratory tooling; its useful Windows/Linux measurements, broker costs, mapping limitations and unresolved crash-recovery findings remain recorded below.

Supported-path verification and the exact evidence outcomes are recorded at the end of this document. No broker, permission system, source/schema/network change or application fix is introduced. If a future supported application writer bypasses coordination, this disposition must be reassessed as an unresolved supported-path issue.

## Historical investigation record — superseded scope and gate requirements

The following sections retain the earlier investigation of preserving arbitrary external saves and enforcement feasibility. Earlier "open", corrective-gate and broker recommendations reflect that earlier scope; they do not override the current owner-defined workflow or establish launch conditions. Old commands/file locations in this historical record describe the executions at that time.

## Actual write and recovery paths

All names below refer to current `shared/drop-params/` modules; the CLI and loopback authoring service both delegate to `executeDropParamsOperation`.

| Phase | Actual behavior and ownership boundary |
| --- | --- |
| Admission | The transaction acquires the projector's repository-scoped claim lock. Pending operations are reconciled; unresolved operations block new writes. `readVerifiedCurrentState` reads source/JSON/mirror, checks the expected hash of the **source bytes read**, validates source, and requires semantic equality plus identical projection bytes. Neither the lock nor `sourceVersion` reserves the source pathname against an editor. |
| Durable intent | `executeLocked` records exact base bytes/hashes, target hashes and result in a pending journal before staging. DEACTIVATE publishes and verifies the immutable archive before serializing inactive targets. CREATE/EDIT use deterministic source serialization; source versions remain exact-byte SHA-256 values. |
| Staging | `stageAndVerifyTargets` writes exclusive, synced stage files, imports the staged source, validates it and compares both projections. These files establish candidate validity, not ownership of the live source. |
| Apply | `replaceTargets` runs `assertApplyFilesOwned` before each replacing `rename`. `filesMatch` sequentially reads source, outer JSON and mirror. A save after the source read can leave the captured bytes equal to base, then be replaced by the source rename. A save after the entire check also loses. Only successful writer renames advance its expected state. |
| Completion | Equality, the planned source hash, another exact-state check and the completed journal verify observed bytes. After an overwritten save the candidate satisfies all of them; neither the base journal nor deactivation archive contains that later save. No post-check can reconstruct bytes already lost. |
| Automatic rollback | A caught error first checks the expected apply state, then `restoreSnapshot` validates recovery snapshots and base/target membership. It rechecks all files before each restore and through `replaceDropParamsFileAtomic.beforeReplace` after synced temporary-file staging. That final read still precedes a replacing rename; a save in that read window can be lost while rollback reports success. |
| Explicit reconciliation | `reconcileRecord` recognizes all-target state (also verifying the archive) or all-base state; otherwise it calls the same `restoreSnapshot`. Unrecognized observed state remains unresolved with evidence retained. The destructive partial-restore path has the same read-window limitation. Matching reads used to mark an operation resolved are observations, not a multi-file atomic snapshot. |
| Projection/mirroring | Projector entrypoints share the claim lock, check unresolved journals and derive outputs from canonical JS; they never implicitly reconcile. They do not replace canonical JS. An ordinary editor bypasses this lock. The existing AUD-004 phase-specific guards and unresolved-journal protections remain unchanged. |

## Filesystem evidence and rejected substitutions

On the tested Windows/Node `v22.16.0` / libuv `1.49.2` environment, an independent Node child can save in place while both the repository lock and an ordinary source read handle are held. Replacing the open target by rename returns `EPERM`; after the handle closes, the child rename succeeds while the repository lock remains held. The writer uses that same replacing-rename primitive, so retaining this handle is not a usable exclusive read-through-replacement mechanism. This is an observed local constraint, not a guarantee for every Windows filesystem or editor.

The published [Node 22.16 rename interface](https://nodejs.org/download/release/v22.16.0/docs/api/fs.html#fspromisesrenameoldpath-newpath) takes old/new paths with no expected-content argument. [libuv 1.49.2 Windows implementation](https://github.com/libuv/libuv/blob/v1.49.2/src/win/fs.c#L1934-L1940) uses replacing `MoveFileExW`. The inference from these interfaces and the executable interleavings is narrow: the **current read/check/rename protocol** cannot condition replacement on the reviewed bytes. No universal impossibility claim about native OS mechanisms is made.

- Repeated asynchronous or synchronous reads, stat/inode checks, watching and post-write equality leave an interval before replacement. Blocking this process's event loop does not block an independent editor process.
- The existing claim lock protects participating processes. Requiring an editor to take it would change the supported authoring contract; an opt-in flag or an operator's statement does not enforce exclusion.
- A hard-link/copy backup made before replacement can miss a later pathname-replacing save; an open displaced inode can also receive later in-place writes. It cannot establish exclusive ownership.
- Moving the source aside and then using an exclusive create/link leaves the canonical pathname absent, breaks atomic replacement and adds unjournaled crash/recovery states. Restoring a backup by ordinary rename has the same overwrite hazard. This was not implemented.
- Read-only attributes/permissions toggled under the current user are not an ownership protocol for an already-open writer, directory replacement or other same-user tools. No production permission changes, native helper, dependency or persistence framework was introduced.

## Initial proposed resolution and closure conditions

The feasibility continuation below supersedes the initial permanent single-writer direction: manual editing must remain available outside protected operations. No production ownership mechanism has been implemented.

The initial proposed resolution was an **enforced single source writer**: protect both source content and its directory entries from direct editing by the operator's editor identity; admit manual edits through a version-checked operation participating in the existing transaction lock. Keep JS as canonical authority, preserve the current journal/archive/projector pipeline, and hold exclusive authority from the initial source read through every source replacement, rollback/reconciliation and resolution of the journal. Account for already-open handles, Git checkout and build/watch processes, crash release and supported operating systems. This requires an explicit operational/authoring contract change and a separately reviewed implementation; the current same-user checkout does not enforce it.

If ordinary uncoordinated editor saves must remain supported, a platform-specific mechanism must instead prove exclusion or atomically retain the actually displaced source across replacement, including open-handle writes and failed/restarted recovery, while keeping canonical availability. Merely selecting a native API or a backup filename is not that proof. No compatible mechanism is currently exposed or implemented by this repository's Node path-based writer. Native Windows and Linux behavior would need separate validation. Globally disabling source mutations would avoid this writer's overwrite but would break the required unchanged CREATE/EDIT/DEACTIVATE behavior, so it was not substituted as a fix.

Until then, do not overlap manual source editing/saving or Git source replacement with apply, rollback or reconciliation. Preserve unsaved work and an independent copy before a controlled write session. Quiescing editors is an operational mitigation only; no automatic exclusion is claimed. Preserve existing status/reconciliation procedures and all unresolved evidence. Do not use a fresh preview, matching projections or a completed result as proof that an independent save survived.

Closure requires the new corrective suite to pass without TODO/skip, the concurrency controls to reflect the chosen supported contract, and the existing AUD-004/transaction/projection/recovery checks and staging build to pass. A cooperative protocol must reject unsupported direct saves at the enforced boundary, rather than silently reduce the original preservation requirement.

## Maintained corrective regressions

Run from Outer:

```text
npm run test:drop-params:source-ownership
```

`shared/drop-params/drop-params-source-ownership.test.mjs` copies the current production modules unchanged into task-owned disposable repositories under ignored `audits/work/`. It synthesizes the disposable mirror from Outer JSON and does not mutate the real source, projections, nested Admin repository, journals, locks or archives. Filesystem seams are restored after each serial test; cleanup is constrained to each created fixture. The ordered save uses actual filesystem writes and independent read-back, never scheduler timing. The native rename-window seam also prevents a future extra read from falsely satisfying the test.

| Cases | Current result |
| --- | --- |
| Unchanged CREATE/EDIT/DEACTIVATE, version/equality/idempotency and deactivation archive | 3 pass |
| In-place/rename save before the ownership read; retained journal/staging, blocked projection and explicit recovery preserve it | 2 pass |
| Separate-process lock/read-handle assumptions and legitimate external edit projected from source | 2 pass |
| Partial failure automatic rollback and interrupted explicit reconciliation without an external save | 2 pass |
| Source save during the apply ownership read, in-place and rename | **2 fail: later save overwritten by candidate** |
| Source save after checks immediately before native rename, in-place and rename | **2 fail: later save overwritten by candidate** |
| Source save during the final recovery ownership read, automatic rollback and explicit reconciliation | **2 fail: later save overwritten by base** |

The command exits **1: 9 pass, 6 fail, zero skip/TODO**. These are unmet corrective assertions, not a passing reproduction that treats data loss as success. It is a separately named closure gate; passing the unchanged `test:drop-params` command alone does not close AUD-005-001. The historical read-window reproduction remains intact and is not a remediation gate.

## Initial partial-ticket verification

| Actual command | Outcome |
| --- | --- |
| `npm run test:drop-params:source-ownership` | Exit 1: 9 pass, 6 corrective assertions fail as detailed above |
| `npm run test:drop-params` in a disposable copy of current Outer shared/scripts/drops modules and read-only copies of Admin consumer modules | 54 authoring/transaction/service tests and 1 watcher test pass; no real configuration or Admin files were replaced by tests |
| `node --test --experimental-test-isolation=none shared/drop-params/drop-params-projection.test.mjs` in that disposable copy | 89 pass, including existing AUD-004 ownership/phase checks, pending-journal exclusion, projection blocking, archive and interrupted recovery controls |
| `node audits/repro/AUD-004-writer-cas-repro.mjs` | Original before-check protection and unchanged-operation control pass |
| `node audits/repro/AUD-005-writer-read-window-repro.mjs` | Original defect reproduction still confirms the lost save; historical reproduction success is not corrective success |
| `npm run build:pages:staging` from Outer | Pass, six public bundles; generator reports unchanged JSON; existing Browserslist age warning only |

The initial sandboxed ownership run could not spawn the two child controls (`EPERM`); a permitted rerun executed them. Their Windows open-target rename behavior was then recorded explicitly in the maintained control. All six final failures are preservation assertions, with no child-launch failures waived. Real source/projection and pre-existing journal/lock/archive file hashes checked before/after the build were unchanged. Disposable fixtures are removed by constrained cleanup. No native exclusion helper, crash/power-loss test, Linux/Node-20 run, manual browser check, Admin build, deployment or transaction was performed; those do not establish an implemented ownership guarantee here.

## Enforcement feasibility continuation — 2026-11-19

**Decision: no proportionate, fully demonstrated Windows/Linux production solution has been established.** Retain canonical JS and the transaction/recovery architecture. A native lock shim alone is insufficient. The recommended direction, if the operational cost is acceptable, is a **distinct-identity filesystem broker with temporary source and namespace protection**, including fail-closed admission for pre-existing writable handles/mappings. The Linux probe below proves a limited instance; the complete Windows boundary and production transitions remain unproven. Do not implement or claim the full guarantee from these probes.

### Reproducible measured guarantees

The historical `AUD-005-source-ownership-feasibility.py` capability probe (now retired exploratory tooling) used only disposable files. Windows used real Win32 calls through Python ctypes and independent child processes, temporarily changing a fixture file DACL and restoring its saved descriptor. Linux used real kernel locks, modes and separate processes; the broker probe used existing root/nobody identities without creating accounts. All scratch directories were removed. No real source, projection, journal, lock, archive, account or system policy was modified.

| Probe | Measured result and boundary |
| --- | --- |
| Windows `CreateFileW`, share READ only | Independent in-place write, replacement, unlink and parent rename fail. The writer's native `FileRenameInfoEx(REPLACE_IF_EXISTS | POSIX_SEMANTICS)` also fails with sharing violation 32. This excludes ordinary writes but cannot support replacing canonical JS while held. |
| Windows share READ + DELETE | In-place write denied; unlink succeeds. Native POSIX replacement succeeds, and an independent write to the new pathname then succeeds. Ordinary `os.replace` still failed on this host: success of a particular editor's save API is not a pathname guarantee. |
| Windows pre-existing writable handle or Python writable mapping | READ-only sharing guard refuses acquisition with error 32, including a mapping whose original Python stream was closed. Python retains a duplicated file handle; this does not prove admission safety for native mappings after every file handle closes. This is useful handle-admission evidence on this NTFS host, not a tested broker transition. |
| Windows `LockFileEx` across the file range | Ordinary write denied, mapped write succeeds and changes bytes. Byte-range locking is insufficient. |
| Windows transient file DACL | New write open denied, but an already-open independent writer still changes bytes. File-only DELETE denial also allows replacement using parent directory rights. Both content and namespace, plus existing handles, need protection. |
| Windows killed guard process | A new independent write succeeds after process termination; handle exclusion is volatile and releases without an unlock command. Manual editing also succeeds after normal release/DACL restoration. No power-loss or permission-broker crash was tested. |
| Linux `flock(LOCK_EX)` | Independent write and rename replacement both succeed: advisory coordination only. |
| Linux `F_SETLEASE(F_WRLCK)` alone | Independent rename replacement succeeds while the lease remains on the old inode: no pathname ownership. |
| Linux transient file/directory modes | New write/replacement denied; pre-opened writer still changes bytes; the same file owner can restore write permission. Mode toggles under the editor identity are not the required boundary. |
| Linux distinct-identity fixture | Root-owned trusted ancestor; UID 65534 can write/replace outside protection. Gate directory first, transfer source ownership to broker, restrict file write, then acquire a read lease: admission refuses an already-open editor writer (`EAGAIN`). After that handle closes, lease admission succeeds; editor writes/replacements fail before and after the broker's atomic rename of an already-protected stage file; parent renaming and restoring file write permission are also denied. Restoring outside-operation permissions allows manual write and replacement again. This proves these local capability transitions for an ordinary actor, not the complete transaction integration or a malicious root actor. |

Windows: build 26200, NTFS, Python 3.12.2. Linux: Ubuntu under WSL2 kernel `6.6.114.1-microsoft-standard-WSL2`, ordinary UID 1000 for baseline and root/UID 65534 for the broker fixture, Python 3.14.4. Baseline probes passed on native tmpfs `/tmp` and ext4 `/var/tmp`; broker probe passed on ext4. This is actual Linux filesystem evidence, **not** Windows-mounted DrvFS evidence or a GitHub runner/Node-20 test.

Native behavior agrees with the documented [Windows sharing rules](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createfilew), [POSIX rename flag](https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/ntifs/ns-ntifs-_file_rename_information), [mapped-I/O exception to byte locks](https://learn.microsoft.com/en-us/windows/win32/fileio/locking-and-unlocking-byte-ranges-in-files), and [file/parent access rights](https://learn.microsoft.com/en-us/windows/win32/fileio/file-security-and-access-rights). Linux [flock](https://man7.org/linux/man-pages/man2/flock.2.html) is advisory; [leases](https://man7.org/linux/man-pages/man2/F_SETLEASE.2const.html) can be forcibly broken after their timeout, so the broker proof depends on its independent permission boundary preventing new writer opens, not on an indefinite lease. Its lease is an admission check after gating, not a rename lock. These are measured examples plus scoped inferences, not a proof for every filesystem.

### Required workflow and implementation boundary

The smallest credible *next feasibility scope* is a Windows distinct-identity broker session proving the same source/namespace/admission/replacement sequence, plus crash recovery of its permission changes. A full implementation scope cannot yet be called small or proportionate. If pursued:

1. Use a separately protected broker identity and fixed filesystem operations. **Do not elevate the Node transaction writer**: it imports/evaluates manually editable canonical JS. The privileged helper must not evaluate JS or accept arbitrary paths/commands. Normal Node code retains validation, plan/source hashes, archives, journals and transaction orchestration; the helper performs bounded protected filesystem operations.
2. Enter protection before any authoritative read in apply or reconciliation. Gate namespace first (including source deletion, directory delete-child and renameable ancestors), protect the source, then establish kernel-backed admission that refuses existing writers/mappings. An edit acknowledged before admission must be included in the subsequent exact-version check or cause a stale/divergence rejection. Deny new write/delete access for editor identities while allowing broker access. Protect candidate/rollback bytes **before** publishing them; preserve protection across every source replacement and the final journal decision. Ordinary locks still serialize cooperating writer/projector requests.
3. Restore reviewed permissions only after completion/verified rollback; retain fail-closed evidence on uncertain release. A process death during a permission transition needs persisted original descriptors/modes and explicit privileged recovery tied to the existing operation journal. Never infer safe release from a timer, dead PID or stale lock alone; never discard an unresolved operation to regain manual access. The Windows probe tests killed handle ownership, not this persistent-gate lifecycle.
4. Outside protection, direct editor writes and rename saves remain available; inside, the editor must receive a visible save failure/busy result and retain its buffer. Restoring access must not automatically replay an old save over a newer writer result. Source reads/builds/watchers should remain possible where safe. Git read/diff should remain usable; checkout/restore/rebase or a Git GUI's writes to protected paths must fail. Git may partially update other files before such a failure, so the operational cost includes resolving partial Git operations; no Git mutation was run as a probe.
5. Source-file ownership alone is insufficient on Linux: an editor-owned writable ancestor could rename the protected directory. Protect the relevant namespace to a trusted root, or prove an equivalent mount/handle boundary while preserving the canonical path. This can affect more of the checkout than one JS file. Existing directory handles, hardlinks, writable mappings, ACL inheritance on stage files, reparse points/symlinks and replacement after owner changes require admission/transition tests. Root/admin, the broker identity, injected code in that identity, hostile filesystem filters and network filesystems are outside the demonstrated ordinary-editor boundary.

Costs include service/helper installation and updates, credentials/ACL provisioning, a privileged recovery command, Windows/Linux-specific implementations, failure/upgrade/uninstall handling, and policy over the checkout's ancestors. The current Linux CI uses Ubuntu/Node 20 and only projects/builds canonical data; projection must not require a privileged helper or acquire source-write authority. Mutation tests would need an explicit supported Linux backend and identity fixture, with unsupported mutation platforms failing closed, never silently falling back to advisory locking. No package installation, CI edit, source relocation, new persistence framework or production change was made.

Oplocks/leases are breakable coordination mechanisms, not an established indefinite exclusion boundary; filesystem filters or sandboxing all editors would add substantially greater deployment scope. Those were not prototyped. No universal impossibility claim is made: the negative finding is that a proportionate cross-platform production mechanism has not been proven within this bounded investigation.

### Existing six corrective assertions

**They cannot pass literally unchanged under an exclusion design.** Their `save()` first requires a successful write and read-back during the protected interval; rejection makes that premise fail, and blocking it deadlocks the ordered hook until the operation releases protection. Do not change a lost acknowledged save into expected success, swallow denial, mark tests TODO/skip, or weaken the byte-preservation assertion.

The new design requires separate assertions for (a) attempted saves rejected without changing bytes during protection, and (b) acknowledged saves outside/before acquisition preserved exactly or rejected by stale-version/divergence checks. Keep all six acknowledged-save preservation scenarios as obligations; adjust their admission/scheduling for the newly authorized exclusion contract and add native backend tests for the actual denial intervals across apply, automatic rollback and explicit reconciliation. A permission failure alone is not completion evidence. The existing suite remains untouched and red: nine controls pass, six preservation assertions fail. No end-to-end claim that a new writer satisfies it is made.

### Continuation verification

Commands below use the probe's absolute WSL-mounted repository path as `<probe>` (read-only code); all Linux data is in automatically cleaned native scratch directories.

| Actual check | Outcome |
| --- | --- |
| `python audits/repro/AUD-005-source-ownership-feasibility.py` | Exit 0 before the final assertion-strengthening edits; Windows native, DACL, Python mapping, process-kill and outside-edit observations above. Final rerun was not executed. |
| `wsl -d Ubuntu -- python3 <probe> --base /tmp` and `--base /var/tmp` | Both exit 0; ordinary-user Linux probes on tmpfs and ext4 |
| `wsl -d Ubuntu -u root -- python3 <probe> --base /var/tmp --broker-probe` | Exit 0; isolated distinct-identity gate/admission/atomic-replacement/manual-edit demonstration |
| `npm run test:drop-params:source-ownership` | Exit 1: unchanged nine passing controls and six failing preservation assertions, zero skips/TODOs |

Initial discovery runs corrected fixture assumptions (shared-delete permits unlink; a byte-lock blocks a second read handle; a guard child needs a retained stdin; Python ownership uses `os.chown`) before the successful gates. Sandboxed ACL and WSL access required permitted reruns. No failed application assertion was waived. There is no Windows broker, full transaction integration, broker crash/power-loss proof, native GitHub CI run, hostile-user audit or maintained exclusion backend yet. Earlier build and writer/projection results above remain historical; production builds are not repeated for this investigation-only probe/document change.

### Final review and proportionality decision

**Recommendation: defer the broker; no proportionate cross-platform enforcement solution is established for this project.** The demonstrated defect is real local authoring data loss and remains open. Current source ownership checks, journals, archives and operator mitigation reduce some failures but do not close it. This investigation establishes neither that a broker is impossible nor that a simpler untested OS mechanism cannot exist.

The local CLI/loopback development writer currently runs as the operator. A privileged, separately installed filesystem service would add identity provisioning, protected checkout ancestors, OS-specific backends and privileged recovery to that workflow. Those costs and the new privilege boundary are substantial relative to the demonstrated local configuration race; there is no evidence here of a multi-user authoring requirement or a live incident justifying them. Importantly, the writer evaluates canonical JS (`evaluateSourceBytes`); elevating it wholesale would increase the consequence of an editable configuration. The Linux root/UID-65534 fixture is a capability demonstration, not a least-privilege service design or a cost-effective deployment proposal.

The Windows mapping claim is deliberately narrowed after reviewing [CPython 3.12.2's implementation](https://github.com/python/cpython/blob/v3.12.2/Modules/mmapmodule.c#L1378-L1388): `mmap` duplicates and retains the file handle. Closing the original Python stream is not closing every writable OS file handle. Windows also permits [file mapping handles to close while views remain mapped](https://learn.microsoft.com/en-us/windows/win32/memory/closing-a-file-mapping-object). Admission with such surviving native views, and safe handling of their dirty pages, remain untested. The Linux broker fixture likewise does not test writable mappings, hardlink aliases or concurrent permission changes during acquisition.

Static lifecycle review identifies the following **unproved** requirements; the probe has no broker implementation in which to test them:

| Failure point | Required behavior before production adoption |
| --- | --- |
| During namespace/file gating, before source admission | Persist recoverable original ownership/permission state before changing it; perform no configuration replacement until admission succeeds. Refuse outstanding writers/mappings; retain any save acknowledged before admission. |
| After source replacement, before projection/journal completion | Restart with the protection boundary intact; use existing pending-operation recovery without executing editable JS with broker privilege. Unrecognized external bytes remain preserved and blocked. |
| After journal completion, before permission restoration | Distinguish completed data from incomplete access restoration; prove the correct original permissions can be recovered without replaying the configuration operation or clearing evidence. Existing completed status alone does not record this new lifecycle. |
| Broker death or partial ACL restoration | No timer/PID-based force-unlock; explicit authorized recovery of the recorded gate and ordinary transaction state. A killed share-handle process only proves handle release, not permission-gate recovery. |
| Release followed by an editor retry or delayed write | Once acknowledged, a save is external authoritative work; a later operation must admit/read/version-check it. Exclusion serializes writes but does not merge stale editor buffers or prevent an editor from intentionally replacing a newer file after release. |

A rejected attempt is not an acknowledged save and should leave the editor's buffer available. A delayed attempt must not be reported as saved before its actual success. A successful save later erased without detection is the original defect. The six existing corrective assertions are unchanged: none is excused by relabeling a lost acknowledged save as busy/rejected. Under the authorized exclusion design, future tests need both explicit denial behavior and exact preservation of every successful external save; that is a contract-aware extension, not permission to delete the original preservation obligation.

If enforced exclusion remains a project requirement despite these costs, the next bounded task should prove the Windows broker transition and all lifecycle rows above using fixed paths, protected staging, least privilege and native mapping/handle tests. Only then scope integration across apply, rollback and reconciliation, regression updates preserving successful-save assertions, and explicit Linux/Node-20 mutation/CI support. Until then, quiescing saves/Git writes is only an operator mitigation, and no minimal production implementation is recommended.

Completed probes were not repeated during final review. The last requested Windows and Linux reruns were not executed because automatic approval review hit its usage limit; this was review unavailability, not an unsafe-action finding. The final native assertion additions and the guard against optimized Python execution received static/syntax review only. Earlier measured results remain evidence for those particular executions, not a passing run of the final script. The current file parses successfully with `ast.parse` (no bytecode/cache output). Build/full writer suites were not rerun because this continuation changes investigation artifacts only; their earlier outcomes remain labeled historical. Standard diff/export checks are performed separately for the combined ticket snapshot.

## Reconciliation verification — current disposition

| Actual check | Outcome |
| --- | --- |
| Outer tracked reference search plus explicit read-only Admin package/source/script inspection | Service/CLI, generation, watcher, mirroring, archive and recovery write paths inventoried above; no reachable uncoordinated application writer found in those paths |
| `node --test --experimental-test-isolation=none shared/drop-params/drop-params-projection.test.mjs` | 90 pass, zero fail/skip/TODO; includes the supported service/CLI contention regression and the existing authoring/transaction/service/watcher suites executed in disposable repositories |
| `npm run evidence:drop-params:external-concurrency` — explicit opt-in | Exit 1: 9 passing controls, 6 unchanged failed preservation assertions, zero skip/TODO. This result is historical evidence, excluded from the supported verification result above. |
| Executable-content comparison with the previous exported preservation suite | Identical after removing comments; only evidence location and explanatory comments changed |

The first targeted test run encountered sandbox child-process `EPERM`. A permitted rerun showed that the real service rejects `writer_busy` rather than queuing; the test was corrected to assert that actual protection, then passed along with the full focused suite. No production failure was waived or fixed. Disposable fixtures keep the real source/mirror and operational journals/locks/archives untouched. No application code, schema, network or production permissions changed. Builds, browser smoke and native enforcement probes were not repeated for this documentation/test reconciliation. Existing AUD-004 regression safeguards remain in the passing suite; no broader launch or merge approval is asserted.
