# AUD-010 — full adversarial correctness examination

**COMPLETE / NOT CLEAN.** One independent source-driven pass completed on
2026-11-24 across Outer `b547c1617b5a136f833894c873e6e862645a04bf` and Admin
`57e9fb616526e2a0c9da34643c180e10a16e5f7b`, both initially clean on
`ticket-AUD-010-full-correctness-review`. Each HEAD equals the merge base with
its local normal base (`staging` / `codex`). No implementation changed.

The [current coverage entry](coverage.md#aud-010--independent-full-application-investigation-2026-11-24)
records discovery, all examined scopes, the 33-workflow/20-group reconciliation,
commands, evidence and limits. Initial discovery is preserved in ignored
`work/AUD-010-independent-discovery.md`; it was formed before opening previous
coverage/findings. Subsequent historical comparison did not supply the starting
map. The confirmed issue below prevents a provisional clean verdict; there is
no clean-result refresh or public `report.md`. No additional audit is prescribed.

## AUD-010-001 — duplicate pair terms block Public while Admin remains green

**Confirmed failure, P2.** Supported privileged pair creation can make an
otherwise working Public trade unresolvable without making Admin's active-drop
status fail. This affects availability and the truth of actionable readiness,
not unauthorized transfer or an observed loss of funds.

**Expected property.** Pair authoring, on-chain configuration and Public
resolution must agree on what constitutes a usable trade. A green active-drop
readiness result must expose configuration blockers that prevent resolution of
the exact intended burn/redeem terms. This follows from `PROJECT_INTENT.md`'s
configuration, identity and actionable-state requirements. It does not require
a contract-wide prohibition on equivalent mappings or removal of Public's
deliberate ambiguity guard.

**Reachable producers and consumers.**

- Admin `src/features/pairs/pairs.controller.js:648` checks whether the proposed
  **pair ID** is occupied, then `:656` calls `setTokenPairs`. The set panel accepts
  the same burn/redeem token IDs, addresses and positive amounts under another
  free pair ID; there is no six-term uniqueness check. The parallel Exchange
  path (`src/features/pairs/exchange-pairs.js:548`, `:566`, `:575`) has the same
  distinction. Pair update can also introduce duplicate terms at existing IDs.
- Outer's canonical contract `set_token_pairs` at
  `contracts/burn-redeem-escrow/smartpy/burn-redeem-escrow-smartpy.py:499`
  rejects duplicate **IDs** at `:534`, validates positive amounts and distinct
  FA2 addresses, then stores the record. It permits identical six-term values at
  distinct IDs. `update_token_pair:565` requires an existing ID but does not
  enforce term uniqueness either. This establishes source reachability without
  assuming a defect in the indexer or bypassing chain validation.
- Admin `src/features/drops/drops.pairs.status.js:380` scores the best aligned
  contiguous block. Once all expected entries match, `:473`/`:477` stop the
  search. Extra equivalent rows elsewhere do not invalidate `full`.
  `drops.view.panel.js:364` presents `FULLY SET ON-CHAIN`; the checklist's
  `syncPairsOnChainDot:544` maps `full` to green in active scheduled phases.
- Public `shared/public-trade-ops.js:207` scans the complete active mapping and
  compares all six terms. A second match at `:258` rejects as ambiguous and
  returns `null`. Drops and Exchange call this shared resolver before their
  wallet operation request, so an otherwise authorized matching trade stops.

**Deterministic demonstration.**
`node audits/repro/AUD-010-pair-readiness-repro.mjs` runs current native schema
validation, normalization, builder, complete Admin pair API, status classifier
and Public resolver. HTTP is inert; it returns the same valid complete mapping
to both consumers. The actual checklist consumer runs in the maintained VM
harness with an inert DOM, and the actual pair serializer/authority helper
reaches one inert wallet seam for an unused ID carrying duplicate terms.

The committed SPLINTERED configuration produces 16 expected pairs. A complete
block at IDs 100–115 gives `full`, and Public resolves its first term to `100`.
Adding the same first term at unused ID `500` preserves Admin `full`/16 matches
and a green `pairsOnChain` dot, but Public emits its ambiguity diagnostic and
returns `null`. Duplicating all 16 terms at distinct unused IDs blocks all 16
Public resolutions while Admin remains `full`. Removing only the additional
rows restores Public resolution. The final runner records 23 inert HTTP reads
and one inert pair request. Successful exit **observes the defect and controls**;
it does not mean the production defect is fixed.

The reproduction does not dispatch a fabricated Send event or bypass the
drop panel's full-status Send lock. That view correctly blocks Send when a
complete block already exists. The supported conflicting producer is manual
pair management (or a direct authorized administrator call). Wallet signing,
contract execution, naturally occurring duplicates and deployed inventory were
not observed. The contract's acceptance is decisive source evidence; no legacy
SmartPy execution is claimed.

**Consequence and remediation.** One duplicate disables the corresponding
Public choice; duplicates across the block disable the whole drop. Inventory
can remain in escrow while an operator sees a fully-set green block. Direct
contract trade calls can still work; Public fails before submitting the trade,
and funds remain subject to ordinary admin rescue. The same authoring/resolver
contract mismatch applies to Exchange, although its read-only pair list is not
the demonstrated drop-readiness green claim.

Align pair management and readiness with Public's resolution contract: detect
equivalent active terms at other IDs, handle already-existing duplicates
explicitly in status, and prevent supported creation/update from silently
introducing a Public blocker. Preserve exact term comparison, surface targeting,
authority, occupied-ID checks and recovery behavior. Use the failing/control
seam for remediation validation. This is one practical cross-consumer ticket;
no contract redeployment or change to Public's safety policy is authorized by
this report.

## Historical correction reassessment

These dispositions result from the current pass, not inherited clean claims.
The historical reports and specialist evidence remain unchanged. Existing
defect-asserting scripts are not all passing regression gates.

| Historical triggers | Current examination / disposition |
| --- | --- |
| CHR-001; AUD-003-001 | Public boot/helper/account observations are fenced before mismatched-account clearing; a losing clear cannot publish disconnection. Connect deduplication and both page consumers retain current generation/address ownership. Original trigger not reproduced. |
| CHR-002/003; AUD-003-003/005/006; AUD-004-001/002 | Admin send authority spans account/permission/availability awaits, each helper boundary and each drop chunk. Pause/Treasury reserve before wallet and retain uncertain outcomes through reload and late receipts. Withdraw input preserves exact decimal intent. Original triggers not reproduced. |
| CHR-004/006; AUD-003-002/004/014/015; AUD-004-005 | Complete holdings/Health enumeration rejects malformed/duplicate/nonadvancing/partial data; unsafe receipts reject before send; unknown economics stays unknown; forced checks bypass stale economics; CANAAN ACID is explicit; supply loss recomputes dependent sold-out state. AUD-003-015's historical 008 alias remains an alias. |
| CHR-005; AUD-002-007; AUD-003-011; AUD-005-004 | HTTP/boolean pause evidence, serial continued pause polling, supply recovery and inventory at least the full configured redemption gate Public entry/final send. Original unavailable/later-pause/multi-unit triggers not reproduced. |
| CHR-007; AUD-002-005/006/011; AUD-003-007/009/012 | Exact IDs remain through canonical exclusion/translation, cached preview, status, modal edit, cleanup and payload. Unsupported Public shape/malformed pages fail closed; duplicate burn quantities aggregate. AUD-010-001 instead concerns duplicate **mapping terms across IDs**. |
| AUD-002-001/002/003/008; AUD-003-010/013 | Complete Public paging, durable scoped receipts, 20-per-token/50-total bounds, all-intended Admin confirmation, fetch/body deadline and local Utility navigation remain. Original triggers not reproduced. |
| AUD-002-004; AUD-003-008/016/017/018; AUD-004-003; AUD-005-003 | Projection consults unresolved journals; equality includes falsy values; apply/recovery validate exact file ownership; provider loss retires trusted params/readiness; pending operations block READY; authoring client bounds decoding as well as fetch. Supported writer exclusion reassessed separately below. |
| AUD-005-001 | **Accepted unsupported external-edit limitation preserved.** The final ownership read and file replacement are not a filesystem compare-and-swap against an independent editor. No new supported-path evidence reopens the accepted limitation; no external save, real recovery or cleanup was performed. |
| AUD-002-009/010; AUD-003-019/020; AUD-004-004; AUD-005-005 | CMS pagination requires complete consistent totals/unique identities; transport/body/upload ambiguity stays unknown without blind mutation retry. Thumbnail imports and standalone generators share a process-local lock capability; rollback, interrupted retained locks, JS escaping and URL identity are preserved. |
| AUD-005-002; AUD-006-001/002 | Current status requests retire prior same-context publications; initial/manual/Auto load ownership, rejection paths, reset/provider epochs and unpause abort/preview/poll ownership retain their corrections. |
| AUD-007-001 | Exclusions apply to canonical keys before translation. Exhausted maps do not fall back into another namespace; duplicate translation identities reject. Both Public/Admin consumer tests retain the correction. |
| AUD-008-001 | Post-trade holdings require an attributed complete snapshot and relevant applied block level, rather than mandatory net depletion. Incoming transfers, repeated identities, missing/zero rows, snapshot mutation, scope and retry were re-examined. Live indexer attribution remains unverified. |
| AUD-008-002 | Replacing params retires published pair/checklist/GitHub/supply readiness even while provider health stays READY. Current source and composed consumer regressions retain the correction. |
| AUD-009-001 | **Corrected at reviewed Outer HEAD.** Complete metadata is staged, synced and published exclusively by hard link; a suspended creator has no visible incomplete claim to reclaim/revive. Live choosing/waiting/owned claims are protected by PID liveness; unique claim paths prevent old reclaimers removing new acquisitions. Ticket/choosing ordering, ownership snapshots, timeout/cancellation, collision/error cleanup and nested projection authority were challenged. All 17 lock tests pass, including actual delayed creation past production grace, delayed publication completion, equal tickets, reversed reclaimers, real child death and progress controls. This is source/isolated filesystem evidence, not a universal filesystem guarantee. |

## Examination limits and result

All eight direct contract entrypoints were traced through authorization, exact
parameters, storage and external effects. Every trade item validates sender and
all pair terms; repeated/heterogeneous trades group burns to the sink and
redeems from escrow to the caller. Later invalid items, insufficient aggregate
balances/inventory, missing/revoked operators and external FA2 rejection require
whole-operation failure atomicity. Earlier separate confirmed Admin batches can
survive a later batch's failure; their receipts are not evidence of full success.
Admin pause/rescue/XTZ/default, pair count/create/update/cleanup, missing/duplicate
cleanup IDs, arbitrary caller fields and attached XTZ were examined separately.
An operation applied by the escrow is not proof that a dishonest FA2 moved its
ledger; a sink transfer is not proof of token destruction.

The embedded MockFA2 lacks real operator enforcement. The standalone
conforming/rejecting/no-op fixtures are stronger bounded oracles, but neither was
freshly executed under a compatible legacy toolchain. ABI decoding and exact
source/frozen hashes passed; they do not compile SmartPy, typecheck/execute
Michelson or verify current originated code. Historical certification and
deployment records remain dated evidence, not a new execution or live identity
claim. Fresh legacy compile/native execution remains unavailable.

Relevant primary interface grounding was checked against installed Beacon 4.8.1
and Taquito 19.0.2 sources, [FA2 operators/transfer documentation](https://docs.tezos.com/architecture/tokens/FA2),
[Michelson semantics](https://octez.tezos.com/docs/active/michelson.html) and
[Webflow item pagination](https://developers.webflow.com/data/reference/cms/collection-items/staged-items/list-items).
The TzKT documentation landing page yielded no readable endpoint schema; actual
provider pagination, balance-level attribution and reorg/finality behavior remain
unverified. Documentation reads used no connected account or application API.

Actual browser/Web Locks/storage, Beacon/wallet transport and signing, time
provider, RPC/TzKT/IPFS/GitHub raw, Webflow DOM/CMS, hosting and CI were not
exercised. Mainnet remains incomplete. No live integration, operational mutation,
transaction or deployment occurred. No remaining material local-source
hypothesis is promoted to a finding without a supported path. These external
limits qualify the completed source examination; they are not passing evidence.

Verification details are in coverage. The [remediation checklist](remediation-checklist.md)
contains only the new actionable implementation root. No production fixes, clean
verdict, merge approval or release authorization are provided.
