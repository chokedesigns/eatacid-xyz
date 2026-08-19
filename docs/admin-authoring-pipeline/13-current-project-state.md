# Current project state

This is the mutable handoff. Update it when implementation changes; keep durable architectural rules in the other documents.

Snapshot date: 2026-08-19

## CURRENT PHASE

Architecture v2 is documented. The Admin Authoring Pipeline has not entered implementation.

## COMPLETED

- AUTHOR-1 audited the fragmented current workflow and design space; its useful conclusions are incorporated into Architecture v2.
- The one-time CMS image migration completed for 66 items and its orchestration was retired.
- Durable migration lessons were extracted: canonical/environment identity separation, content-based image verification, clean publication metadata, bounded reads, and reconciliation of uncertain mutations.
- Reusable Webflow and thumbnail code was retained with focused tests.

Completion of the image migration is not implementation of the authoring pipeline.

## IMPLEMENTED BUT NOT YET INTEGRATED INTO AUTHORING

- `assets/webflow-cms/webflow-cms.mjs`: authenticated/paginated reads, asset create/upload/verification, explicit known-item field patches, exact-ID publication, staged/live and clean-publication verification, redaction, and ambiguous-write reconciliation. It does not create CMS items.
- `assets/thumbs/`: deterministic thumbnail conversion, current CANAAN/SCRIPT input flow, four-collection backfill review, validation, collision handling, and manifest rollback.
- `admin-ui/src/thumbs/` plus `admin-ui/scripts/gen-thumbs-manifest.mjs`: local masters and generated lookup flow.
- `admin-ui/src/titles/*.json` and title helpers: Admin-local title presentation.
- `shared/chain-registry.js`, `admin-ui/src/utils/hen-ids.js`, and `shared/hen-identity.test.mjs`: current network/contract and HEN adapter authority/coverage.
- Admin health: local title/thumb/chain checks and manual Webflow CSV comparison.
- Existing Beacon/TzKT wallet, operation, and Drops mechanisms.
- `shared/drop-params/drop-params.js` and its generated projection flow.

## DESIGNED / DOCUMENTED

- canonical work record and authority hierarchy;
- collection policy model;
- human work lifecycle and exceptional reconciliation states;
- narrow loopback local-service boundary;
- V1 external/manual mint-result import boundary;
- application-level Webflow stage/verify/preview/publish operations;
- optional downstream CANAAN drop proposal;
- **Add a New CANAAN** vertical roadmap and anti-goals.

## NOT STARTED

- canonical record schema/files and migration mechanism;
- operation journal/evidence implementation;
- Admin authoring form/planner;
- loopback orchestration service;
- explicit-ID title/thumbnail generation mode;
- verified external mint-result importer;
- fresh Webflow authoring preflight adapter;
- CMS new staged item creation;
- Admin staged preview/publication/reconciliation UI;
- optional CANAAN drop proposal/editor handoff;
- integrated mint submission (later phase, intentionally outside V1).

## KNOWN OPEN QUESTIONS

- Where records and operation evidence live and how they migrate/expire.
- Which artwork roots/formats/sizes are allowed and how source masters are managed.
- Exact editions/minted/display/drop supply semantics.
- The operator’s current mint tool, result contract, metadata host, and required finality.
- Current Webflow site/schema/locale requirements at implementation time.
- New-item slug conflicts and failed staged-item/orphan-asset retention policy.
- Approved external test site/items/wallets for future write pilots.
- Whether existing works are backfilled after V1.
- Whether new HEN/INTRODUCTIONS authoring or any non-CANAAN drop candidacy is ever supported.

## IMMEDIATE NEXT TARGET

Implement the **Add a New CANAAN** V1 vertical described in [Implementation roadmap](11-implementation-roadmap.md).

The first implementation increment inside that vertical is the smallest versioned canonical record + CANAAN collection policy + read-only planner/fixture. It must be designed as the beginning of the vertical, not as an abstract multi-collection platform.

## Re-entry checklist

Before the next implementation ticket:

1. read [Start here](00-START-HERE.md), this file, and the task-specific architecture document;
2. inspect current source files named in those documents;
3. verify both Git repositories and protected/generated files before running generators;
4. resolve only the open questions required by the next vertical increment;
5. keep external writes at zero unless the ticket explicitly authorizes a scoped test;
6. preserve the accepted decisions in [Decisions and invariants](12-decisions-and-invariants.md).
