# AUD-009 — full adversarial correctness review

**COMPLETE / NOT CLEAN — one confirmed material finding.** Full consequential
source examination and reconciliation with both historical scope maps are
complete. No production remediation is included. The conditional clean-result
coverage refresh does not apply.

Reviewed on 2026-11-24 (America/Chicago), initially clean on
`ticket-AUD-009-full-correctness-review` in both independent repositories:

| Repository | Exact reviewed HEAD |
| --- | --- |
| Outer | `92d9b75ac70f4e4eeb2419ee71dc59b8f4621fcf` |
| Admin | `57e9fb616526e2a0c9da34643c180e10a16e5f7b` |

Node v22.16.0, npm 10.4.0; existing Beacon 4.8.1, Taquito 19.0.2 and Parcel 2.16.4.
No install, operational recovery, external mutation, transaction or deployment.
Runtime, network, generated and contract/provenance files are unchanged. The
[coverage record](coverage.md#aud-009--independent-full-application-investigation-2026-11-24)
contains the independent map, complete examination, historical equivalence,
commands, outcomes and assurance limits.

| ID | Priority | Boundary | Confirmed consequence |
| --- | --- | --- | --- |
| AUD-009-001 | P2 | Outer shared Drop Params writer/projector lock | Stale-invalid claim revival and reclamation admit two simultaneous live owners through supported acquisition calls. |

## AUD-009-001 — stale reclamation admits two live writer-lock owners

**Expected property.** Supported configuration transactions and projections must
share one exclusive critical section. A delayed claimant must retain its place,
restart, or fail before entering. This follows from the authoritative-source,
projection and recovery contract independently of the chosen lock algorithm.

**Supported reachability.** The transaction executor acquires the lock in
`shared/drop-params/drop-params-transaction.mjs:879`. Generation/watch/build
projection uses `withDropParamsLock` in
`shared/drop-params/drop-params-projector.mjs:450`. Local authoring/CLI transactions
and these background/build paths can contend normally. No external editor,
handwritten claim, unsupported `lock:false` call or real operational state is
required by the reproduction.

The interacting source boundaries in
`shared/drop-params/drop-params-projector.mjs` are:

- Lines 294–310 create a visible `wx` claim before writing/syncing metadata.
  Scheduler or I/O delay can leave that claim empty.
- Lines 176–197 classify invalid metadata as stale after the production default
  5,000 ms grace. A live PID cannot protect metadata that is not yet present.
- Lines 264–291 compare two stale snapshots, then asynchronously unlink the path.
  Between comparison and unlink, the claimant can publish live metadata and
  replace that same path with its `waiting` claim.
- Lines 392–404 select a ticket from visible claims. Removing the revived claim
  lets the reclaimer select the same ticket the claimant selected while the
  reclaimer was still `choosing`.
- Lines 407–432 exclude a missing claim, break equal tickets by token order and
  publish `owned` without establishing that this acquisition's waiting claim
  survived reclamation. The removed claimant can republish and enter after the
  reclaimer has entered.

**Reproduction.** Run the [retained runner](repro/AUD-009-writer-lock-repro.mjs):

```text
node audits/repro/AUD-009-writer-lock-repro.mjs
```

It copies unchanged production modules into a fresh bounded `audits/work/`
directory and calls actual `acquireDropParamsLock` twice. An instrumented native
`open('wx')` completion pauses A after file creation, before metadata publication;
real elapsed time exceeds the unchanged 5-second grace. B's existing
`beforeReclaim` test seam resumes A after the last stale comparison, before
unlink. A reaches valid live `waiting`, ticket 1, before B removes it. B then
acquires ticket 1. A's lower token wins the equal-ticket comparison and A acquires
too. Neither handle is released until both return `phase: owned`; both claim
files then exist. Deterministic UUIDs choose a possible ordinary random-token
ordering, without changing production ticket/comparison logic. The harness's
15-second timeout avoids interference from intentional delay; this schedule also
fits the production 10-second timeout.

The seam schedules an allowed interleaving between asynchronous filesystem
operations; it does not measure natural incidence on Windows or another
filesystem. No lock bytes or timestamps are edited. Simply deleting A's empty
claim would not suffice to prove the result: A could then see B's ticket and
wait. The runner specifically establishes the revived same-ticket case.

**Controls and certainty.** A complete live owner is not reclaimed even with zero
invalid-metadata grace; an ordinary second contender times out; normal release
returns `unlocked`. The race asserts both owned handles and equal tickets before
either release. Initial, repeat and final runner executions passed; final
`node --check` passed. Exit 0 means the defect and controls were observed, not a
successful fix. This is a confirmed mutual-exclusion failure under the stated
schedule, with natural frequency unmeasured.

**Impact and bounds.** Authoring/CLI publication and generation/watch/build can
enter their supposed exclusive section concurrently. Source-derived consequences
concern the isolation assumed by recovery inspection, journal/snapshot staging,
projection and multi-file publication. Atomic per-file replacement and byte/base
ownership checks still help but do not reestablish cross-operation exclusivity.
Actual lost edits, mixed publication, chain effects and user asset loss were not
reproduced and are not claimed. The trigger requires a delayed incomplete claim,
a particular revival/reclamation schedule and favorable equal-ticket ordering.
P2 reflects conditional configuration integrity/availability impact, without
asserting an exploit or immediate financial loss.

**Remediation scope.** Restore exclusive ownership across publication,
reclamation and entry, including revival of incomplete claims. Another non-atomic
read before unlink alone leaves a scheduling window. Preserve dead-owner
recovery, timeouts, nested projection ownership, unresolved journals, archive
provenance and the existing external-edit support boundary. No production fix or
prescribed implementation design is part of this investigation.

## Historical corrections and interactions

History was consulted after fresh source discovery. These are current-source
dispositions, not inherited clean verdicts. Grouped rows preserve all listed
triggers; tests supplement the producer/consumer examination.

| Historical family | Current-source disposition |
| --- | --- |
| CHR-001; AUD-003-001 | Public boot/permissions/active-account observations and destructive mismatch clearing are generation-owned; page rendering/rejections are account-scoped. Original stale-clear trigger not reproduced. |
| CHR-002/003; AUD-003-003/005/006; AUD-004-001/002 | Both pause/treasury scopes retain unknown outcomes and exclude conflicts/repeats; pair/Drops authority spans availability/account/wallet awaits; withdrawal text is validated rather than rewritten. Original triggers not reproduced. |
| CHR-004/006; AUD-003-002/004/014/015; AUD-004-005 | Complete holdings, unsafe-quantity/receipt rejection, unknown economics, forced refresh, explicit CANAAN ACID and dependent supply invalidation remain. Canonical AUD-003-015's historical ticket alias 008 is preserved, not another finding. |
| CHR-005; AUD-002-007; AUD-003-011; AUD-005-004 | Valid boolean pause, continuing recovery/polling and inventory at least the configured redemption amount gate entry and final submission. Original HTTP-error, later-pause and multi-unit inventory triggers not reproduced. |
| CHR-007; AUD-002-005/006/011; AUD-003-007/009/012 | Exact IDs survive normalization/preview/status/modal/cleanup/payloads; malformed pages reject; compatibility, all-six-term matching and aggregate duplicate burn requirements remain. Original rounding, zero-substitution and identity/quantity triggers not reproduced. |
| AUD-002-001/002/003/008; AUD-003-010/013 | Complete Public paging, durable scoped reservation/reload guard, 20-per-token/50-total bounds, all-intended Admin receipt matching, fetch/body deadlines and local Utility navigation retain their corrections. Live provider/storage behavior remains unverified. |
| AUD-002-004; AUD-003-008/016/017/018; AUD-004-003; AUD-005-003 | Strict equality includes falsy projections; recovery checks exact base/target ownership and preserves divergence; pending state blocks READY; provider health loss retires authority; timeout spans body decoding. Those corrections remain, but their shared serialization premise is separately challenged by AUD-009-001. Ordinary contention tests do not refute it. |
| AUD-005-001 | **Accepted unsupported-external-edit limitation retained.** An independent external editor can still race final ownership read/replacement; supported status/recovery procedures remain applicable. No new supported external-edit path was established. AUD-009-001 concerns two supported lock acquisitions and does not reopen this accepted limitation. The opt-in external-concurrency defect-evidence suite was not run as a passing gate. |
| AUD-002-009/010; AUD-003-019/020; AUD-004-004; AUD-005-005 | CMS complete pagination and transport/body/upload ambiguity remain explicit; input/standalone manifest generation share ownership and rollback protection; JS escaping and filename URL encoding preserve identity. No current original trigger reproduced; no live CMS mutation performed. |
| AUD-005-002; AUD-006-001/002 | Status request ordering and shared load ownership fence obsolete success/rejection; unpause verifies abort owner and preview/network/phase/poll epochs before publishing. Composed current consumers and runtime cases retain the corrections. |
| AUD-007-001 | Canonical exclusions precede network translation in Public eligibility/Admin normalization; translated IDs are not reinterpreted as canonical exclusions. Source and consumer tests retain the correction. |
| AUD-008-001 | Freshness uses attributed submission and indexed balance levels rather than mandatory net depletion. Both consumers enforce fresh full snapshot/scope/applied-level checks, including duplicates, incoming tokens, zero/missing rows and retry. Current freshness cases pass. |
| AUD-008-002 | Provider parameter updates retire checklist/readiness, advance ownership and request current evidence. Provider/normalized params propagate through preview/status/countdown/supply/readiness; obsolete async publication is fenced. Current Admin cases pass. |

No other material supported-path defect was confirmed. Examined non-findings
include stale display before a deliberate pause toggle (the supported action is
toggle), a pending remote promise substituted into currently local-only initial
modal metadata, and typing after Send on an already reviewed cached preview.
None establishes another supported trigger. Unknown reads and partial receipts
remain distinct from successful evidence.

## Verification and assurance limits

The full command ledger and outcomes are in coverage. Final native commands
passed: 298 Public cases, 2,092 Admin runtime cases, 134 supporting cases,
configuration suites 25/19/10/90/1, Outer thumbnails 27, CMS 39 and Admin thumbnails
37. Shared trade fixtures, actual client ABI decoding, mechanical provenance,
31/31 frozen checkout/HEAD-blob identities and invariant mapping passed. Mapping
reports 26/26 invariants, 181/181 obligations, 13 scenarios; this is not execution
of those SmartPy scenarios. Existing configuration subprocess EPERM, PowerShell's
VM-warning redirection error and one Python command quoting error were resolved
with successful permitted/native reruns; no application failure was waived.

Required Outer staging and Admin clean builds passed in a disposable tracked-file
copy using existing dependencies. Admin mirror/manifest guards, production
authoring pruning/isolation passed. Browserslist stale-data and emitted size
information remain in logs. Cleanup checked the bounded copy, unlinked dependency
junctions before removal, and left real caches, outputs, assets and operational
state intact. Small ignored discovery notes/scripts/logs remain as evidence;
this adds no audit framework.

All eight direct escrow entries and client serializers were examined, including
later-item failure, grouped transfers, revoked operators, aggregate insufficiency,
external rejection, custody, mapping cardinality and rollback expectations.
Embedded MockFA2 omits operator authorization; standalone conforming/rejecting/no-op
fixtures are stronger but bounded oracles. No compatible legacy SmartPy execution,
fresh compilation, native Michelson typecheck/execution or actual external FA2
behavior was verified. Hashes/ABI decoding and historical certification do not
establish those executions or current deployment identity. A sink transfer is not
proof of destruction; dishonest external FA2 behavior remains a trust boundary.

Testnet/Shadownet and dedicated surface targets remain configured; Mainnet stays
incomplete. Actual browser/wallet, Web Locks/storage, RPC/indexer/finality, time,
IPFS/GitHub raw, Webflow/CMS/hosting, CI and deployed contracts were not exercised.
Production Outer build, both-variant first-paint checks, actual Pages branch
assembly and a fresh Node-20/Linux CI install were not run. Source examination,
fixtures and copied builds do not substitute for those live environments.

The [remediation checklist](remediation-checklist.md) contains one implementation
root. Historical reports and specialist provenance remain preserved. No public
clean-result report, launch authorization or merge approval is issued. Examination
is complete with the stated external/toolchain limits; the material lock finding
is why this result is **COMPLETE / NOT CLEAN**.
