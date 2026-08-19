# Decisions and invariants

This is the terse authoritative decision log for Architecture v2. **Accepted** means the architecture decision is settled; it does not mean the capability is implemented.

## Accepted decisions

### A-001 — Canonical work record

- **Status:** Accepted; not implemented.
- **Decision:** A versioned canonical work record will be the future source of truth for operator-authored work facts and captured verified integration identities.
- **Rationale:** Current facts are re-entered across local files, external minting, CMS, and drop configuration.
- **Implication:** Generators and adapters consume the record; registry, chain, Webflow, and active drop state retain their own authority.

### A-002 — External/manual mint result in V1

- **Status:** Accepted.
- **Decision:** V1 prepares/validates authoring data, allows the current external/manual mint, imports and verifies its result, then continues deterministic downstream work.
- **Rationale:** No mint implementation or proven current mint contract exists in the repositories.
- **Implication:** Preparing, submitting/signing, and observing/verifying are separate operations. Integrated signing is later.

### A-003 — Explicit CMS publication approval

- **Status:** Accepted.
- **Decision:** Staging and publication are separate phases; publication requires explicit human approval of the exact intended item after fresh verification.
- **Rationale:** Publication is a go-live external mutation with an independent failure/recovery boundary.
- **Implication:** No stage operation or successful API response may auto-publish.

### A-004 — CANAAN drop handoff is downstream

- **Status:** Accepted.
- **Decision:** A completed CANAAN may optionally expose Prepare Drop; the handoff is not part of minting or CMS publication.
- **Rationale:** Work authoring and drop configuration/chain activation have different authorities and approvals.
- **Implication:** The handoff proposes configuration only and never automatically saves, deploys, transfers, seeds pairs, or unpauses.

### A-005 — THE 419 SCRIPT is not inherently a drop

- **Status:** Accepted.
- **Decision:** THE 419 SCRIPT authoring normally ends after verified local integration and CMS publication.
- **Rationale:** Its current Exchange/runtime role does not establish new redeem-drop eligibility.
- **Implication:** Shared infrastructure must not add a CANAAN drop branch to SCRIPT.

### A-006 — HEN mirror IDs are adapters only

- **Status:** Accepted.
- **Decision:** Canonical/mainnet HEN token IDs remain canonical; Shadownet IDs from `shared/chain-registry.js` are environment lookup adapters.
- **Rationale:** CMS/title identity is sparse canonical ID while Shadownet uses `0` through `16`.
- **Implication:** Mirror IDs never replace canonical work/CMS identity; translations must be explicit and total.

### A-007 — CMS image verification is content-based

- **Status:** Accepted.
- **Decision:** Verify the resulting CMS Image against approved local content, dimensions, and format/equivalence policy.
- **Rationale:** Webflow may normalize asset ID, URL, extension, and encoding.
- **Implication:** `fileId`, filename, submitted asset ID, or URL alone cannot prove correctness.

### A-008 — Ambiguous mutations require reconciliation

- **Status:** Accepted.
- **Decision:** Reads may use bounded retries; uncertain mutations are not blindly repeated and must be reconciled from actual state.
- **Rationale:** Repeating an applied-but-unacknowledged write can duplicate assets/items/mints or repeat publication/chain effects.
- **Implication:** Unknown outcome is an explicit blocking state across Webflow, minting, and chain operations.

### A-009 — Retired migration orchestration is not Admin architecture

- **Status:** Accepted.
- **Decision:** CMS image migration batches, baselines, ticket targets, rollout journals, and confirmation mechanics remain retired.
- **Rationale:** The one-time migration completed; reusable primitives and lessons were extracted separately.
- **Implication:** Future Admin code composes `assets/webflow-cms/webflow-cms.mjs` without resurrecting CMS-IMG workflows.

### A-010 — Safety internals stay behind the normal UI

- **Status:** Accepted.
- **Decision:** The normal flow uses product actions and concise approvals; low-level hashes, journal events, retry data, and IDs remain available as troubleshooting evidence.
- **Rationale:** Operators need safety without migration-style ceremony.
- **Implication:** Do not require batch IDs, baseline hashes, journal phases, or confirmation strings during successful routine authoring.

### A-011 — Clean publication is more than content equality

- **Status:** Accepted.
- **Decision:** Clean publication requires intended staged/live content plus draft/archive and update/publication metadata showing all updates are covered.
- **Rationale:** A content-identical queued staged revision can remain unpublished.
- **Implication:** Staged/live equality alone cannot complete CMS publication.

### A-012 — Collection policy controls workflow differences

- **Status:** Accepted.
- **Decision:** Shared validators/generators/adapters are composed through explicit collection policies.
- **Rationale:** CANAAN, SCRIPT, HEN, and INTRODUCTIONS have different identity, CMS, presentation, and downstream semantics.
- **Implication:** No universal Drops, marketplace-link, CMS-field, or ID strategy.

### A-013 — Narrow local orchestration boundary

- **Status:** Accepted design; not implemented.
- **Decision:** A loopback-only service will own narrowly allowlisted local writes and server-side credentials; the browser remains the Admin UI and wallet-signing boundary.
- **Rationale:** A static browser cannot safely write both repositories or hold a Webflow token.
- **Implication:** No generic filesystem/shell/Webflow proxy and no private-key custody.

### A-014 — First vertical is Add a New CANAAN

- **Status:** Accepted.
- **Decision:** Implementation starts with one end-to-end CANAAN vertical, including external mint-result import and optional downstream drop proposal.
- **Rationale:** It delivers product value and tests all major boundaries without pretending every collection is identical.
- **Implication:** Foundation work remains scoped to what the vertical needs; SCRIPT and other collections follow separately.

## Unresolved decisions

### A-015 — Canonical persistence details

- **Status:** Open.
- **Decision needed:** Record format/path, schema migrations, journal/evidence path, and retention.
- **Implication:** The conceptual record is authoritative design, but no implementation should invent persistence silently.

### A-016 — Artwork custody and constraints

- **Status:** Open.
- **Decision needed:** Allowed roots/types/sizes and copy-into-managed-store versus reference-in-place.
- **Implication:** Local-service path policy and reproducibility depend on this.

### A-017 — Editions and supply semantics

- **Status:** Open.
- **Decision needed:** Distinguish authored edition count, minted supply, CMS display value, drop initial supply, and current remaining supply.
- **Implication:** Field names/validation must not overload `supply`.

### A-018 — Mint result/finality contract

- **Status:** Open.
- **Decision needed:** Current mint tool, returned identifiers, creator/metadata checks, hosting authority, and sufficient confirmation/finality.
- **Implication:** V1 importer cannot be finalized until representative real results are documented.

### A-019 — CMS creation and cleanup policy

- **Status:** Open.
- **Decision needed:** Current locale/required-field behavior, slug conflicts, and retention/archive/delete policy for failed new staged items/orphan assets.
- **Implication:** Safe default is retain and reconcile; destructive cleanup is never automatic.

### A-020 — Additional collection authoring

- **Status:** Open.
- **Decision needed:** Whether new HEN or INTRODUCTIONS authoring is supported and whether any collection beyond CANAAN may ever be a redeem-drop candidate.
- **Implication:** Default is no unsupported authoring/drop branch.

## Non-negotiable invariant checklist

- One canonical identity; environment IDs are adapters.
- Intended local image content is verification authority.
- Clean publication includes publication metadata.
- Uncertain writes reconcile before retry.
- Planned and implemented status remain explicit.
- Generated files are changed only through supported generation.
- Mint signing, CMS publication, drop configuration, deployment, and go-live are distinct approvals.
- Runtime external truth is observed, not copied into authored facts.
- Normal authors do not operate migration machinery.
