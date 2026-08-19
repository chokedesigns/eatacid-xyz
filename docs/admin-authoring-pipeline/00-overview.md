# AUTHOR-1 architecture audit: overview

Audit date: 2026-08-07

Profile: AUDIT / CLOSURE

Scope: documentation only; current outer repository plus read-only inspection of the nested `admin-ui` repository

## Purpose and method

This audit documents the path from the current repository to a future local authoring, minting, Admin UI, Webflow CMS, and Drops workflow. It is based on the checked-out code and existing repository audit artifacts. No Webflow read or write was required for this ticket; current CMS facts come from `docs/webflow-migration/02-cms-schema.md:28-128`, with the completed image migration summarized in `docs/webflow-cms-image-migration.md`.

The workspace has two Git repositories:

- the outer `eatacid-xyz` repository owns public runtime, shared configuration, thumbnail tooling, Webflow migration tooling, and these documents;
- the nested `admin-ui` repository owns the Admin UI. It was inspected read-only. Its pre-existing modified `src/thumbs.manifest.js` was not altered.

## Executive conclusion

**CURRENT STATE.** There is no unified authoring pipeline and no mint implementation in either repository. The codebase has browser-wallet transaction mechanisms for the public Drops/Exchange flows and Admin escrow operations, but no OBJKT mint command, mint payload builder, local signer, metadata upload writer, or mint-result capture. The Admin checklist's “MINTED on OBJKT” check is actually a TzKT token-existence read (`admin-ui/src/features/drops/drops.checklist.controller.js:492-528`; `admin-ui/src/tzkt-api.js:308-327`). The way minting is performed today cannot be proven from the repository and remains an open question.

**CURRENT STATE.** Strong reusable components already exist:

- a strict shared drop-time parser (`shared/drop-time.js:143-186`, `shared/drop-time.js:243-301`);
- the authoritative registry for networks, contracts, and explicit HEN/INTRODUCTIONS mirrors (`shared/chain-registry.js:5-115`);
- deterministic thumbnail conversion plus transactional manifest restoration (`assets/thumbs/scripts/thumbs.mjs:10-84`, `assets/thumbs/scripts/thumbs.mjs:220-301`);
- a registry-backed Admin thumbnail manifest generator (`admin-ui/scripts/gen-thumbs-manifest.mjs:24-67`, `admin-ui/scripts/gen-thumbs-manifest.mjs:124-181`);
- local title/thumb, CMS CSV, and chain-economics health checks (`admin-ui/src/features/health/health.controller.js:430-583`; `admin-ui/src/features/health/health.cms.js:1-12`, `admin-ui/src/features/health/health.cms.js:469-528`);
- reusable staged/live Webflow CMS primitives with redaction, bounded reads, ambiguous-write signaling, content verification, and exact-ID publication (`assets/webflow-cms/webflow-cms.mjs`).

**OBSERVED BEHAVIOR.** The same token facts are maintained in different authorities for different surfaces: local title JSON, numeric thumbnail filenames, generated manifest keys, Webflow fields, chain registry mirrors, drop params, and live chain state. The public site currently consumes Webflow-rendered rows, while the Admin deliberately resolves titles and images locally (`admin-ui/src/utils/nft.js:691-755`). There is no global source of truth.

**RECOMMENDATION.** Introduce one versioned local authoring record per work and a separate append-only operation journal. The record stores operator facts and captured external identities; generators derive local titles, thumbnail paths, CMS payloads, `$ACID` values where the current formula applies, and optional drop handoff data. The journal records attempts, approvals, hashes, external responses, uncertain outcomes, and reconciliation. It must not store secrets.

**RECOMMENDATION.** Do not begin with integrated mint execution. First implement a read-only planner and schema, deterministic local generation, and a manual “import verified mint result” gate. That produces most transcription benefits while the real minting path and approval UX are still unresolved. Wallet-based mint submission can be a later adapter behind a separate explicit approval.

## Lifecycle distinctions

These states are different and must remain different:

| Concept | Evidence required | What it does not imply |
|---|---|---|
| Minted token | Verified collection contract/token ID and confirmed chain operation or authoritative chain read | Local title/thumb integration, CMS existence, or Drops eligibility |
| Locally integrated token | Generated local title/thumb/config outputs pass deterministic checks | CMS item exists or is published |
| CMS-integrated token | Webflow item identity is captured and staged/live state is verified as intended | Drop candidate or configured drop |
| Drop candidate | Explicit operator opt-in under collection policy | Drop params changed or pairs seeded |
| Configured drop | Authoritative drop params select the token and validate | Preflight complete or contract live |
| Live drop | Existing scheduled-time-plus-unpaused semantics have been observed | Sold out, complete, or cleared |
| Sold out | Live drop's verified remaining escrow balance is zero | Automatic cleanup, pause, pair removal, or `dropScheduled:false` |

New THE 419 SCRIPT works should end after local/CMS integration. New CANAAN works may be offered as an explicit drop-candidate action, never automatically promoted.

## Recommended target in one view

```text
Local Admin UI
  -> loopback-only authoring/orchestration service
       -> canonical authoring record + operation journal
       -> validators and collection policy
       -> existing thumbnail converter / local generators
       -> mint-result verifier (manual import first; wallet adapter later)
       -> Webflow staged-item adapter + existing pilot-grade verification
       -> drop-config proposal generator (CANAAN opt-in only)

Existing authorities retained
  shared/chain-registry.js       network/contracts/mirrors
  shared/drop-params/drop-params.js  active drop configuration
  chain/TzKT                    minted identity, pause, pairs, balances, operations
  Webflow staged/live reads     CMS integration verification
```

The browser must never receive filesystem-wide authority, Webflow secrets, or private keys. Consequential actions remain separate approvals: mint/sign, CMS stage, CMS publish, drop-param save, chain pair seeding/transfer, unpause/go-live, and clear/no-drop.

## Document map

- [Current state](01-current-state.md)
- [Data duplication and transcription map](02-data-duplication-map.md)
- [Canonical authoring record](03-canonical-authoring-record.md)
- [Local minting and OBJKT](04-local-minting-and-objkt.md)
- [Admin/CMS publishing pipeline](05-admin-cms-publishing-pipeline.md)
- [Drop lifecycle and live UI](06-drop-lifecycle-and-live-ui.md)
- [Drop params editor](07-drop-params-editor.md)
- [Security, wallet, and signing](08-security-wallet-and-signing.md)
- [Target architecture and state machines](09-target-architecture.md)
- [Implementation roadmap](10-implementation-roadmap.md)
- [Open questions](11-open-questions.md)

## Audit limits

**OPEN QUESTION.** The repository does not reveal the operator's current minting tool, OBJKT flow, metadata pinning provider, creator contract permissions, or desired wallet approval experience.

**OPEN QUESTION.** Existing checked-in Webflow artifacts are authoritative for the dates on which they were captured, not a fresh remote read on 2026-08-07. A future implementation ticket must preflight the live site, schemas, locales, and staged/live state before any CMS write.

**CURRENT STATE.** The mainnet Admin/Drops escrow slots are not fully configured (`shared/chain-registry.js:64-93`). This audit does not propose enabling them; production configuration remains a separate controlled dependency.
