# WF-MIG.6 Architecture Decision Record

## Status

**ACCEPTED WITH CONDITIONS**

The architecture can be selected from committed evidence. The conditions below block specific implementation work, cutover, or Webflow removal; they do not require a different rendering architecture. `ACCEPTED` without conditions would be inaccurate because published serialization, Collection Utility source, assets/fonts, pixel parity, deployment behavior, and rollback are not yet proven.

## Context

EATACID.xyz currently has four static pages and four CMS template route families on Webflow site `656cf42faa2b1a7a1582d9d2`. Git contains checked public HTML for Home, Drops, and Exchange, but not Collection Utility. The four CMS template Bodies exposed by the audit are empty. Four flat CMS collections contain 36 physical fields and 66 items; five Collection Lists render 97 current row occurrences across Drops/Exchange. Current CMS values match checked HTML and structured Git evidence where equivalents exist.

Git already owns network configuration, main/active contracts and mirrors, wallet lifecycle, eligibility, filtering/cloning, cart behavior, and transaction pipelines. Those modules consume Webflow-authored DOM classes, hierarchy, list/pane membership, hidden token IDs, controls, and state classes. One remote Webflow stylesheet owns the full presentation and four breakpoints. Webflow JavaScript owns responsive Navbar and Exchange Tabs behavior. Webflow hosts 13 material non-CMS assets, 66 CMS images, and generated/font delivery dependencies. Live Webflow pages load Git runtime through absolute GitHub Pages URLs. [WF-MIG.1-WF-MIG.5]

The required outcome is removal of Webflow as runtime, presentation, CMS, asset, and deployment dependency without combining that migration with a transaction rewrite or redesign.

## Decision

Build a complete static site at generation time from repository-owned structured data and reusable HTML templates, then enhance it with narrow client-side modules. Preserve the current selector-sensitive DOM contract through production cutover and rollback. Retain current Git-owned wallet, network, Drops, Exchange, and transaction behavior. Replace Webflow Navbar, Tabs, and hidden-first initialization with small standalone modules. Serve CSS, assets, fonts, HTML, and built JavaScript from one same-origin static artifact.

Use a staged presentation strategy: vendor the exact frozen Webflow CSS baseline locally first, then perform dead-style extraction/refactoring only after cutover. Import exact Editions, Mint Dates, slugs, media, labels, and presentation order; derive only proven values. Generate equivalent current CMS item-route behavior for all 66 exact slugs. Keep Webflow read-only as baseline and rollback until formal decommission criteria pass.

## Selected architecture

**Hybrid static generation with targeted client enhancement**:

- Rendering: generated static HTML; visible and useful before JavaScript.
- Generation: small Node/HTML template build, deterministic data/route/asset manifests, directory-index paths.
- Data: four collection records and 66 canonical token records; stable identity `{collectionKey}:{mainTokenId}`.
- Presentation: local vendored baseline CSS, local assets, independently delivered fonts, owned responsive/widget/state overrides.
- Runtime: existing entrypoints and transaction modules retained through cutover; standalone Navbar/Tabs/first-paint additions.
- Routing: `/`, `/collection-utility`, `/drops`, `/exchange`, and all exact item paths in four CMS route families; no SPA fallback.
- Deployment: immutable/versioned static artifact; GitHub Pages remains suitable if capability and rollback gates pass.
- Transition: separate Git staging dual-runs with frozen Webflow; production promotion uses the validated bytes; Webflow retained through an approved rollback window.

## Rejected alternatives

**Preserve checked-in Webflow HTML indefinitely — VIABLE BUT NOT PREFERRED.** It gives excellent immediate DOM compatibility but leaves duplicated CMS rows and shared shells as manual authoring sources, lacks Collection Utility, and weakens deterministic content ownership. It remains a useful transitional comparator, not the target.

**Pure static generation without explicit enhancement — VIABLE BUT INCOMPLETE.** It fits routes/content but cannot supply wallet/transaction behavior or replace Navbar/Tabs. The selected architecture includes static generation and names the required enhancement boundary.

**Client-rendered SPA/component framework — NOT RECOMMENDED.** It adds routing/hydration/runtime content creation with no evidence-based need, makes no-JS content worse, and forces simultaneous changes to markup consumers and high-risk transaction initialization.

**Server-rendered application or runtime headless CMS — DISQUALIFIED BY CURRENT NEED.** The content is flat and small, and no live authoring/API requirement was evidenced. Servers, credentials, runtime CMS availability, and cache invalidation would add dependencies the migration is meant to remove.

## Consequences

Positive consequences:

- Every route and CMS row becomes deterministic and reviewable from Git.
- Existing transaction/runtime consumers can be tested against deliberately compatible generated DOM.
- Static hosting, same-origin assets, visible no-JS content, and immutable artifacts simplify failure and rollback.
- Webflow dependencies can retire incrementally behind evidence gates.
- Shared templates eliminate long-term row/shell duplication without requiring a framework.

Costs and constraints:

- Migration must build and validate a template/data/tooling layer.
- The first pass intentionally retains legacy `.w-*` classes and `webflow/*.js` names.
- Vendored CSS is large and not immediately maintainable; extraction is deferred.
- Exact assets/fonts require acquisition/provenance work.
- Generated DOM must support list-specific differences rather than over-generalizing row components.
- Dual-running, screenshot ownership, browser tests, and rollback artifacts add deliberate closure work.

## Migration invariants

- Do not change network slots, Shadownet configuration, mainnet enablement, addresses, RPC/TzKT/Beacon values, selectors, persisted network keys, or switch behavior unless explicitly ticketed.
- Preserve wallet connect/disconnect/persisted-account lifecycle; event targets/payloads; timers/retries/resets/cancellation/stale-write protection; transaction construction/send/load/status pipelines.
- Preserve exact route/copy/title/label/slug values and all four responsive families in the first pass.
- Preserve hidden `.token-id-number`, list/pane membership, runtime ancestry, cloneable HEN/INTRO wrappers, controls, image/title/edition paths, pending/state classes, Drops outer stamping, and Exchange inner stamping.
- Never derive identity from DOM index, presentation order, title, slug, or image filename.
- Preserve `.intros-collection` as observed during migration; do not hide the `.introductions-collection` consumer drift.
- Keep `.w-*` compatibility until consumer/visual tests permit a separate cleanup.
- Generated output is never canonical and is never hand-edited.
- Webflow remains read-only unless a separate rollback/decommission ticket authorizes an exact mutation.

## Deferred decisions

- Exact small template implementation/package, provided it remains build-time only and deterministic.
- CSS extraction, design tokens, dead selector and `.w-*` cleanup.
- Legacy runtime entrypoint relocation/renaming and jQuery removal.
- Image re-encoding/compression and content-hash implementation details after exact source preservation.
- Meaningful alt copy beyond explicit parity-safe empty alt.
- CMS item page content, redirects, or retirement beyond reproducing captured current behavior.
- Tabs hash/history behavior; migration preserves no hash integration.
- Fix/normalization of `.intros-collection` after coordinated consumer evidence.
- A different static host, unless GitHub Pages fails a required capability test.
- Destructive Webflow deletion; it is not implied by decommission.

## Risks accepted

- No active IX2 dependency was observed in generated output, but unpublished/inaccessible metadata is not proven absent. Browser functional/visual validation is the control.
- External OBJKT route availability is outside site control. Exact current/legacy URL derivation is preserved; availability probing is optional unless separately elevated.
- Mint Date meaning is not independently established. Exact values and provenance are preserved without new claims.
- Editions meaning is not independently established. Exact integers are preserved and are not treated as live/circulating supply.
- Locally vendored Webflow-generated CSS may remain after cutover as a Git-owned baseline. Independence means Webflow is not fetched or needed to regenerate the deployed site; readability cleanup is deferred.

## Conditions before implementation

- WF-MIG.7 must run first and capture the published baseline, content freeze, CMS item response behavior, and exact Collection Utility evidence.
- Asset/font acquisition requires explicit authorization plus provenance/licensing checks before bytes are downloaded or redistributed.
- Collection Utility implementation cannot start until its published source/DOM/screenshots are captured sufficiently to bound parity.
- Each later ticket must use an explicit file allowlist, inspect current producers/consumers, and preserve unrelated outer/nested repository changes.
- No condition blocks beginning WF-MIG.7 itself.

## Conditions before cutover

- Canonical four-collection/66-item data and all 36 physical field decisions validate.
- The 13 material assets, 66 CMS images, required responsive/animated behavior, and fonts are independently owned and verified.
- HEN sparse/main/active asset mapping is explicit and tested.
- Local CSS, Collection Utility, all generated routes/rows, Navbar, Tabs readiness, and visible-first behavior pass.
- All required automated static/DOM/dependency/route gates pass.
- Functional, accessibility, responsive, visual, wallet/network, and approved Shadownet transaction validation pass.
- The exact staged artifact is deterministic, fetched-byte verified, and rollback-rehearsed.
- CMS template route status/body behavior, 404, custom domain/DNS/TLS/cache, and hostname/network behavior are proven.
- Zero unresolved `BLOCKING BEFORE CUTOVER` risk and explicit production authorization.

## Conditions before Webflow removal

- Production remains stable through the approved duration and every state-based monitoring exit condition.
- The published baseline and known-good Git/Webflow rollback artifacts are archived and hash-verified.
- Every REQUIRED and applicable CONDITIONALLY REQUIRED criterion in `06-cutover-validation.md` passes.
- Browser network/static scans prove no required Webflow CSS, JS, CMS, asset, custom code, or deployment dependency.
- Source-of-truth handoff to Git is recorded; Webflow content is frozen.
- Rollback retention obligations are satisfied and no blocking incident/risk remains.
- Exact decommission operation receives explicit approval. Domain detachment/unpublish must be reversible; destructive deletion requires a different future ticket.

## First implementation ticket

**WF-MIG.7 — Capture and freeze the published baseline** (`AUDIT`, recommended `gpt-5.6-sol`, high reasoning).

It precedes downloads, data import, CSS localization, and Collection Utility reconstruction because it resolves the saved/published ambiguity, owns the comparator, records exact route behavior, and prevents later work from targeting a moving Webflow state.
