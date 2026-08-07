# Open questions and decisions

These questions cannot be answered from the checked-out repositories. They should be resolved only when the dependent implementation ticket is scheduled.

## Minting and metadata

1. What exact tool/path is used today to mint CANAAN and THE 419 SCRIPT—OBJKT UI, another dapp, an external script, or a direct collection contract call?
2. Which network/collection contract/creator permissions apply to each new collection, and what result does the current mint path return?
3. What is the desired mint approval UX: prepared Beacon operation, external handoff/deep link, or manual mint followed by verified result import?
4. Which service owns artifact/metadata pinning, and what durability/content-hash guarantees are required?
5. What does “editions” mean for authoring and CMS—minted quantity, original edition size, or curated presentation value—and must a separately observed chain supply be stored?
6. Which operation confirmation/finality policy is sufficient before downstream integration begins?

## Canonical records and local operations

7. Where should canonical records and operation journals live, and how long should journals/snapshots be retained?
8. Should existing 66 works be backfilled into the record store, or should version 1 cover new works only?
9. Which artwork roots and file types/sizes are allowed, and should source masters be copied into a managed repository location or referenced in place?
10. Is an exact CMS slug always operator-approved, or may a generated suggestion be accepted automatically for new non-compatibility routes?
11. Should the Admin local service start only through an explicit CLI command, or as part of a dedicated authoring dev command?

## Webflow CMS

12. Should CMS publication always require a separate approval from item creation/staging? This audit recommends yes.
13. What should happen to a newly created staged CMS item or uploaded asset when later verification fails: retain for reconciliation, archive, or delete under a separate cleanup approval?
14. Are the checked-in site/collection IDs intended to remain fixed, and which locales are required for newly created items?
15. Is a public item route expected to exist and be verified for new items, given the current route 404/authority ambiguity?
16. Should CANAAN gain mint-date/OBJKT-link fields, or should the future adapter continue respecting its currently different CMS schema?

## Collection policy

17. Are new HEN or INTRODUCTIONS works ever expected, or should those remain legacy/read-only collections?
18. Should a newly integrated CANAAN work merely expose a “Prepare as drop candidate” action, or should candidate status itself require a separate operator approval? It must not edit params automatically.
19. Can any collection other than CANAAN ever be a new redeem-token drop candidate? Current runtime participation alone does not answer this.

## Drops lifecycle and editor

20. After a drop has gone live and is later paused, should LIVE NOW remain visible as “LIVE — PAUSED,” and what durable evidence should preserve that across reloads/machines?
21. What recent redeem activity depth/retention is useful, and should provisional/indexer-delayed operations be shown?
22. How should replenishment or administrative withdrawal affect redeemed-count calculations and SOLD OUT history?
23. May the operator clear to NO DROP from PRE-DROP or LIVE for cancellation/emergency, or only from SOLD OUT?
24. Should writable raw drop-params editing ever be supported, or remain a generated preview/diff permanently?
25. Does saving local drop params trigger only local mirror/health refresh, or should deployment remain an entirely separate existing process?

## Production sequencing

26. Is the first production drop part of the initial production launch? This determines whether the lifecycle router is a pre-launch requirement or a post-launch improvement.
27. Which approved staging/testnet wallets, Webflow site/environment, and test records may be used for future write pilots?
