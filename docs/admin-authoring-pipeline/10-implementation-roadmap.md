# Implementation roadmap

## Sequencing principles

- Start with read-only modeling and verification.
- Preserve current public/Admin/runtime contracts.
- Make each ticket useful without requiring the final end-to-end orchestrator.
- Introduce one new write boundary at a time.
- Keep integrated mint submission late; manual verified-result import captures most transcription value first.
- Do not combine this work with the separate Webflow-removal/static-site migration.

## Ticket 1 — canonical record, collection policy, and read-only planner

**Goal.** Establish a versioned authoring contract and deterministic projections without changing consumer files.

**Scope.** Schema/fixtures; collection policies for CANAAN and THE 419 SCRIPT; read-only registry/title/thumb/CMS-audit projections; record hash; validation report; conceptual operation journal library.

**Non-goals.** UI writes, mint execution, CMS calls, drop params edits, migrating all 66 records.

**Dependencies.** Decisions on edition semantics, record location, and artwork roots.

**Likely files/systems.** New outer authoring schema/tooling/tests/docs; read-only imports from `shared/chain-registry.js`; fixtures modeled on existing title maps and `docs/webflow-migration/06-data-model.json`.

**Risks.** Overfitting to current CMS; duplicating registry facts; premature final schema.

**Gates.** Schema validation tests; CANAAN/SCRIPT/HEN projection fixtures; no consumer diff; secret-field rejection; deterministic plan hash.

**External writes/signing.** None.

**Rollback.** Remove isolated new tooling/fixtures; no data migration.

**Approval point.** Approve schema/policy contract in code review.

## Ticket 2 — explicit-ID local asset and metadata generation

**Goal.** Generate local title/thumbnail candidates from a validated record and verified token identity, eliminating next-number transcription.

**Scope.** Refactor reusable Sharp functions; add explicit collection/token output mode; generate title-map and manifest candidates in temp; collision and cross-repo diff report; exact-byte rollback; focused health fixtures.

**Non-goals.** Browser UI, CMS, minting, automatic Git actions, changes to current input/backfill behavior.

**Dependencies.** Ticket 1; explicit token-identity fixture.

**Likely files/systems.** `assets/thumbs/scripts/thumbs.mjs`, new orchestration modules/tests, `admin-ui/scripts/gen-thumbs-manifest.mjs` only if a safe callable API is needed; generated consumer paths in nested repo.

**Risks.** Cross-repository writes; pre-existing user changes; duplicate numeric keys; HEN mapping; generated manifest churn.

**Gates.** Existing `test:thumbs`; new explicit-ID/collision/rollback tests; nested build in an isolated clean fixture/worktree, not over user changes; exact planned-path verification.

**External writes/signing.** Reversible local writes only after approval.

**Rollback.** Restore exact before bytes for each planned file; never reset/stash the repo.

**Approval point.** Exact outer/nested local diff before apply.

## Ticket 3 — loopback orchestration service and authoring UI

**Goal.** Provide a structured Admin authoring surface and narrow local write bridge.

**Scope.** Loopback service; session capability/origin checks; allowlisted record/artwork/actions; structured draft/validate/plan; operation journal; read-only raw preview; optimistic concurrency; no generic filesystem/shell endpoint.

**Non-goals.** Mint submit, Webflow writes, drop params writes, raw writable editor.

**Dependencies.** Tickets 1-2; security review; decision on runtime journal retention/location.

**Likely files/systems.** New outer local service/package scripts; new nested Admin authoring feature/components/styles; shared API types.

**Risks.** CSRF/local-service abuse, path escape, leaking local files, service lifecycle/port collisions, cross-repo state.

**Gates.** Origin/Host/capability tests; traversal/symlink tests; concurrent-edit rejection; service binds loopback; browser e2e plan/apply fixture; no secret/log leakage.

**External writes/signing.** Local writes only; explicit apply approval.

**Rollback.** Disable/remove service entry and UI route; records remain readable files.

**Approval point.** Per-plan local apply plus architecture/security review before enabling mutations.

## Ticket 4 — verified external mint-result import

**Goal.** Capture authoritative post-mint identity from today's external flow without changing how minting is signed.

**Scope.** Operation-hash or contract/token input; TzKT/chain verification; metadata URI/hash comparison; result journal; unlock local integration.

**Non-goals.** Mint transaction construction, private/local signer, automatic downstream writes.

**Dependencies.** Tickets 1 and 3; documented real mint result shapes and network/confirmation policy.

**Likely files/systems.** Local service mint-verifier adapter; Admin result-import UI; TzKT/RPC read integration.

**Risks.** Accepting generic token existence as proof; indexer lag; wrong creator/contract; metadata gateway inconsistency.

**Gates.** Applied/failed/unknown fixtures; contract/token/metadata mismatch tests; reorg/stale response handling; idempotent re-import.

**External writes/signing.** Read-only external calls; no signing.

**Rollback.** Revoke an unverified/imported result by a versioned record correction; never delete audit history.

**Approval point.** Operator confirms accepting the independently verified mint result.

## Ticket 5 — generalized Webflow new-item staging

**Goal.** Create and fully verify one new staged CMS item and optimized asset without publishing.

**Scope.** Generalize pilot client/journal/redaction; schema/locale preflight; collection-specific payloads; duplicate token lookup; staged item create; asset upload; captured IDs; staged/live preservation verification; resume/reconcile.

**Non-goals.** Publication, batch creation, deleting failed items/assets, full-site publish.

**Dependencies.** Tickets 1, 3, 4; fresh Webflow schema verification; API token/scopes; decision on failed staged-item retention.

**Likely files/systems.** `assets/webflow-cms-image-pilot` code extracted/reused into a general adapter, service endpoints, Admin CMS stage view, Webflow API/assets.

**Risks.** Opaque/changing schema, duplicate item after unknown response, slug collision, orphan assets, accidentally changing non-target fields.

**Gates.** Mock API contract tests; dry-run fixture per collection; one authorized staging-only pilot; exact staged/live comparison; secret redaction; reconciliation after injected network loss.

**External writes/signing.** Webflow staged external writes; explicit stage approval; no wallet.

**Rollback.** Restore fields for existing item; retain newly created staged item/orphan asset and record pending an explicit cleanup policy.

**Approval point.** Exact site/collection/item payload and asset hash before staged write.

## Ticket 6 — per-item CMS publish and completion

**Goal.** Add a separately approved, verified publication gate.

**Scope.** Fresh staged/live gate; exact item confirmation; per-item publish; live re-read; optional authoritative route probe; published reconciliation; completion projection.

**Non-goals.** Full-site publish, automatic publish after stage, batches, item/asset deletion.

**Dependencies.** Successful Ticket 5 staging pilot; publication/route policy decision.

**Likely files/systems.** General Webflow adapter, journal, Admin publish/reconcile view.

**Risks.** Go-live of wrong item, stale staged state, publish timeout/unknown outcome, route ambiguity.

**Gates.** Exact confirmation tests; stale-plan rejection; live state proof after simulated lost response; rollback-publish rehearsal on approved pilot.

**External writes/signing.** Webflow publish; explicit final approval.

**Rollback.** Another staged update/publish using saved before state; no claim of instantaneous reversal.

**Approval point.** Fresh exact item ID plus staged/live hashes immediately before publish.

## Ticket 7 — Drops lifecycle router and operational LIVE/SOLD OUT surface

**Goal.** Stop showing preflight supply semantics after launch and expose read-only operational health.

**Scope.** Route NO DROP/PRE/STANDBY/LIVE/SOLD OUT; reuse current live predicate; remaining balance with unavailable/stale state; initial versus remaining; pause/pairs health; optional bounded recent activity after parser tests; sold-out informational state.

**Non-goals.** Drop params writes, automatic clear, automatic pause/pair repair, mint/CMS changes.

**Dependencies.** Decision on live-after-pause/reload semantics and activity retention; representative chain fixtures.

**Likely files/systems.** `admin-ui/src/features/drops/**`, `admin-ui/index.html`, CSS, `admin-ui/src/tzkt-api.js`; no outer runtime change unless shared read helpers are extracted.

**Risks.** Changing live meaning, treating unavailable as zero, stale poll writes after network switch, incorrect activity counts.

**Gates.** State-machine unit tests; time/pause/balance matrix; reload/network-switch/abort tests; stale/indexer-error fixtures; no chain writes; nested clean build and smoke.

**External writes/signing.** Read-only network calls only.

**Rollback.** Feature flag or revert isolated UI router; existing checklist logic remains intact until parity is proven.

**Approval point.** UX/semantics review, especially live and sold-out transitions.

## Ticket 8 — safe drop params editor and CANAAN handoff

**Goal.** Edit the actual existing drop params through structured Admin UI and offer an explicit CANAAN drop proposal.

**Scope.** Full schema/semantic validator; structured fields; read-only raw view; plan/diff; atomic source write; generator/mirror verification; Git read-only awareness; exact rollback; explicit `dropScheduled:false` clear proposal; CANAAN handoff prefill.

**Non-goals.** Git stage/commit/push, raw arbitrary JS writes, chain seeding/transfer/unpause, automatic drop promotion/clear.

**Dependencies.** Ticket 3; Ticket 7 lifecycle; drop schema/policy decisions; cross-repo single-writer design.

**Likely files/systems.** `shared/drop-params/**`, local service, new Admin editor feature, existing watcher/build guard/checklist readers.

**Risks.** Malformed or partially mirrored config, watcher race, overwriting user edits, mainnet/testnet confusion, UI save mistaken for deployment/go-live.

**Gates.** Schema/date/mirror/property tests; concurrent hash rejection; atomic failure injection and restore; all three files structurally equal; outer/nested diff scoped; current public/Admin build fixtures in clean environment.

**External writes/signing.** Reversible local cross-repo writes after approval; no external/chain writes.

**Rollback.** Exact source/mirror before bytes restored and verified; no Git mutation.

**Approval point.** Exact drop-param diff, resolved network/contracts/token/title, and explicit warning that save is not publish/unpause.

## Ticket 9 — optional mint submission adapter and end-to-end handoff

**Goal.** Only after the real mint path is proven, add exact-plan wallet/external submission and cohesive resume navigation across existing phases.

**Scope.** One approved mint adapter; immutable review; Beacon/external handoff; operation capture/reconcile; UI “continue next verified phase”; end-to-end fault injection.

**Non-goals.** Private-key signer, opaque one-click execution, automatic CMS publish/drop promotion/go-live.

**Dependencies.** Tickets 1-6; current mint process documentation; legal/platform/API review; wallet test environment.

**Likely files/systems.** Local service mint adapter, Admin wallet integration, external OBJKT/current mint path, chain verifier, journal.

**Risks.** Irreversible duplicate mint, platform/API drift, wrong network/contract, wallet callback ambiguity, metadata mismatch.

**Gates.** Full dry run; testnet approved mint; unknown-outcome recovery without duplicate; payload hash approval; security review; manual chain verification.

**External writes/signing.** Yes, wallet/chain; highest-risk explicit approval.

**Rollback.** No chain rollback. Stop downstream, preserve result/journal, and use a separately approved compensating policy if ever required.

**Approval point.** Wallet confirmation for the exact immutable mint plan.

## Low-risk / high-value early wins

1. Ticket 1 read-only canonical projections and duplication validator.
2. Ticket 4 verified external mint-result import before integrated mint submission.
3. Explicit-ID thumbnail planning/collision checks from Ticket 2.
4. Replace manual CSV-only CMS verification with a read-only API adapter before any CMS create write.
5. Ticket 7 lifecycle router with balance unavailable/stale modeled separately from zero.
6. Formal drop-params schema/validator in read-only mode before an editor can save.

## High-risk dependencies

- The actual current OBJKT/mint mechanism and operation/result contract are unknown.
- Mainnet Admin/Drops escrow configuration is incomplete in the registry and must not be silently enabled (`shared/chain-registry.js:64-93`).
- Webflow item-create schema/locale/required-field behavior has not been write-tested in this repo.
- The local helper would gain cross-repository write authority and needs security review.
- HEN's sparse mainnet/active mapping must remain explicit.
- Durable live-after-pause/reload semantics are unresolved.
- CMS public routes are not currently an authoritative publication signal (`assets/webflow-cms-image-pilot/README.md:62-70`).

## Before production versus after launch

### Before production or before the first production drop

- Freeze the authoring/drop identity rules and collection policy; no title/order inference.
- Add read-only schema validation and stale/unavailable balance semantics.
- If a production drop will run, implement and test the lifecycle router/LIVE/SOLD OUT surface before that first production drop, or explicitly accept the current misleading post-redeem checklist.
- Verify mainnet registry/escrow/network configuration through a separate controlled ticket; this audit does not enable it.
- Test operation reconciliation, wallet network validation, and pause/pair/supply gates against the intended production configuration.
- Keep CMS and mint writes manual until their pilots and rollback/reconciliation gates pass.

### Safer to defer until after production launch

- Integrated wallet mint submission.
- General Webflow new-item creation and automatic asset upload unless a new item is launch-critical.
- Writable drop params editor and CANAAN handoff automation.
- Raw writable config mode.
- Redeem activity history beyond a small read-only feed.
- Batch CMS operations and automatic publication.
- Migrating all existing works into the canonical record.

The concept can be parked after Ticket 1's schema/planner artifacts without creating pressure to implement the write adapters.
