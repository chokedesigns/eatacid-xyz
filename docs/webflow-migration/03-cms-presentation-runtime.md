# WF-MIG.3 CMS Presentation and Runtime Dependencies

## Audit scope and safety

This audit maps current CMS presentation and Git-owned runtime dependencies for EATACID.xyz site 656cf42faa2b1a7a1582d9d2, Drops page 67be119ce0fb23251217c7a9 (/drops), and The Exchange page 65dcf9fcd636fdd5996f46ec (/exchange). The exact site identity was confirmed by a read-only site-details operation before detailed inspection. The site reports short name staging-eatacid-xyz and last published 2026-07-24T21:16:04.114Z.

Only read operations were used: Webflow guide, site details, site instruction search, page element trees, raw element/list settings, style metadata, page/site custom code, and capability discovery. No CMS/site/Designer mutation endpoint and no publishing endpoint was invoked. Mutation count: 0. Publishing count: 0.

Repository evidence includes the WF-MIG.1 and WF-MIG.2 committed inputs, current checked-in page snapshots, the public loader/import graphs, all reachable Drops/Exchange row consumers, scoped CSS, shared chain/drop configuration, and admin title/thumbnail sources only to test whether public runtime imports them. Evidence labels are:

- [WEBFLOW]: directly observed through read-only Webflow MCP.
- [REPOSITORY]: confirmed in the current checked-out branch.
- [INFERENCE]: an explicit conclusion joining observed facts.
- UNRESOLVED: not exposed or not provable through the allowed read surfaces.

The requested root paths src/app.css, src/admin.js, home.js, drops.js, and exchange.js do not exist as root source files. Relevant current paths are docs/webflow-migration/evidence/eatacid-xyz-webflow-reference-snapshot.css, the ignored local duplicate exchange/css/eatacid-xyz-01-webflow.css, admin-ui/src/app.css, admin-ui/src/admin.js, webflow/drops.js, webflow/exchange.js, drops/js/main.js, and exchange/js/main.js. No absent path was treated as evidence.

## Confirmed Collection List inventory

[WEBFLOW] Current evidence confirms exactly the five lists reported by WF-MIG.1:

| Page | List element | Collection | Configuration | Context |
| --- | --- | --- | --- | --- |
| Drops | ae68042e-a003-3b81-3054-355b079d3ad1 | HENs, 67be12e2583121ead44b79ed | Token ID ascending; limit 100; offset 0; no filter/pagination | Events Wallet UI Div; not a component/nested list |
| Drops | d8f397d1-f69c-180a-7ee6-b53dda6483b1 | INTRODUCTIONs, 67be31a0b7084dfce75026fd | Mint Date ascending; limit 100; offset 0; no filter/pagination | Events Wallet UI Div; not a component/nested list |
| Drops | 10d66a25-e077-73df-b103-49c09151fb87 | CANAANs, 65a1be9dcae2314a8ac50aae | Token ID ascending; limit 100; offset 0; no filter/pagination | Events Wallet UI Div; not a component/nested list |
| The Exchange | ae68042e-a003-3b81-3054-355b079d3ad1 | THE 419 SCRIPTs, 656f7e02b503790c02f0edff | Token ID ascending; limit 100; offset 0; no filter/pagination | Webflow Tabs pane data-w-tab=419; not a component/nested list |
| The Exchange | f158e130-ffad-eb67-3544-150761deb4e2 | CANAANs, 65a1be9dcae2314a8ac50aae | Token ID ascending; limit 100; offset 0; no filter/pagination | Webflow Tabs pane data-w-tab=CANAAN; not a component/nested list |

All five report queryMode=dynamic, curatedItemIds=[], filterMatch=all, visibility=true, empty DOM ID, and no list-level custom attributes. Each has a DynamoList, one template DynamoItem, and DynamoEmpty text No items found. No pagination controls occur. The complete ID/ancestor/configuration record is in 03-collection-lists.json.

Saved-versus-published equivalence is UNRESOLVED. Site lastUpdated is 17.644 seconds after lastPublished, but that timestamp difference neither proves nor disproves list-setting drift.

## Field-to-element binding summary

The five list templates expose 28 observed binding occurrences representing six binding roles:

| Role | HEN | INTRO | Drops CANAAN | Exchange SCRIPT | Exchange CANAAN |
| --- | ---: | ---: | ---: | ---: | ---: |
| Title -> .collection-item-title-text | yes | yes | yes | yes | yes |
| Editions -> .collection-item-editions-text-number | yes | yes | yes | yes | yes |
| Image -> img.collection-item-01-image asset/src | yes | yes | yes | yes | yes |
| Collection -> .collection-item-collection-text | yes | yes | yes | yes | yes |
| Token ID -> .token-id-number text | yes | yes | yes | yes | yes |
| $ACID Value -> second .collection-item-value-text | n/a | n/a | yes | yes | yes |

Every observed binding is direct and unformatted. Editions and $ACID have a static x sibling rather than a binding prefix. There is no observed date formatting, number formatting, truncation, casing transform, suffix, or zero-padding on the bound node. Image settings use altText=inherit; there is no independent CMS image-alt binding. No row has a CMS-bound href, custom attribute, metadata value, or conditional visibility.

The machine-readable map has one record for every field definition in each relevant list occurrence: 44 records covering all 36 unique WF-MIG.2 field IDs. Mint Date, OBJKT Link, Name, and Slug are not bound in HEN/INTRO/SCRIPT rows; CANAAN Name and Slug are not bound. INTRO Mint Date affects sorting but is not rendered. All non-bound conclusions are constrained to these two pages.

Classification details:

- DISPLAYED AND RUNTIME-CONSUMED: Title, Editions, and Image on all five lists; Collection on Drops HEN/INTRO.
- RUNTIME-CONSUMED: hidden Token ID on all five lists.
- DISPLAYED: Collection on Drops CANAAN and both Exchange rows; $ACID Value on the three quantity rows.
- PRESENT IN DOM BUT APPARENTLY UNUSED: static control/presentation nodes are documented in the DOM contract but are not CMS fields; no CMS field binding falls solely into this classification.
- NOT BOUND ON THESE PAGES: the 16 per-list records described above.
- UNRESOLVED: no observed binding; unresolved applies only to inaccessible saved/published/interaction state.

## Drops presentation dependencies

Drops uses two row designs. HEN and INTRODUCTIONS are checkbox/owned rows with .collection-item-02-div, a static initial owned value 00, and input.events_checkbox.w-checkbox-input. CANAAN is a value/quantity row with .collection-item-01-div, visible CMS $ACID, static coin image, and select.token-qty.w-select.

Runtime discovers all three outer .w-dyn-item groups, stamps token/contract identity on the outer item, and retains the complete generated item as the presentation source. HEN/INTRO rows are removed and deep-cloned as wallet state changes. The clone carries image, text, form control, classes, and Webflow helper structure; runtime rewrites hidden/data Token ID for configured-environment mirror IDs.

The visible HEN/INTRO collection label is runtime data because getTokenData copies it into the cart preview. CANAAN Collection and $ACID are display-only in scoped Drops runtime. CANAAN title, editions, token ID, and image are runtime presentation inputs for the configured redeem row. Drops active eligibility is not CMS-driven: Git drop parameters, registry contracts/mirrors, and chain wallet balances decide which burn/redeem identities are active.

An existing seam is directly confirmed: current Webflow and checked-in markup use .intros-collection, and findCMSRows correctly special-cases INTRODUCTIONS to intros. getWalletTokenPanes and displayDefaultTokens instead query .introductions-collection. The audit records this drift without changing behavior.

## Exchange presentation dependencies

SCRIPT and CANAAN use the same quantity/value row design. Their semantic difference comes from Webflow Tabs membership, not visible Collection text: getPaneElements selects .w-tab-pane[data-w-tab="419"] or CANAAN, then the first .exchange-ui-div and .w-dyn-list. exchange/js/exchange-config.js maps those pane names to Git-owned contracts.

Runtime stamps identity on the inner .collection-item-01-div, not the outer .w-dyn-item. Quantity inputs must remain descendants of that inner row; closest traversal is used for editions and stamped attributes. Wallet processing hides all rows, matches chain NFTs by contract/token, reveals owned rows, and caps options by balance and edition count.

Title and image are copied to the dynamic cart. Editions is parsed as a positive integer both to build quantity options and to calculate Math.ceil(100 / editionCount) * quantity. The visible CMS $ACID field is not read. Collection text is not read. This creates a parity obligation for both visible CMS value and runtime-derived value even though their value-level reconciliation is deferred to WF-MIG.4.

Webflow Tabs classes/data attributes and active state participate in current behavior. The internal Tabs library can be replaced functionally later, but the current runtime still expects pane data-w-tab, .tab-link, aria-selected/aria-controls observation, and the pane/list hierarchy.

## Runtime selector dependencies

03-runtime-dependencies.json records each CMS-sensitive selector/traversal with source location, expected structure/value, downstream use, ordering classification, failure mode, and parity requirement. The hard seams are:

- Drops collection wrapper to .w-dyn-item discovery.
- Hidden .token-id-number to runtime data attributes.
- Drops outer-row versus Exchange inner-row stamping location.
- Checkbox/select classes and closest ancestry.
- Image nesting differences: Drops reads .collection-item-image-div img; Exchange reads .collection-item-01-image.
- Exact pane/list membership used as collection/contract identity.
- Complete cloneability of Drops HEN/INTRO item wrappers.
- DOM availability before page initialization.

Neither public runtime uses getElementById, sibling traversal, CMS href parsing, or a CMS custom data attribute to identify token rows. Repeated generated IDs are therefore not a runtime contract.

## Runtime data extraction

| Semantic value | Source and extraction | Kind | Downstream use / fallback |
| --- | --- | --- | --- |
| Token ID | CMS Token ID -> hidden .token-id-number -> trim -> runtime data-token-id | DOM, hard identity | Balance match, mirror lookup, cart/payload; missing row is skipped/unusable |
| Collection identity | Drops list key/wrapper plus events-config; Exchange data-w-tab pane plus EXCHANGE_PANES | inferred from membership + Git | Contract routing; visible Collection text is not the authoritative Exchange identity |
| Token title | CMS Title -> .collection-item-title-text -> trim | DOM | Cart/redeem labels; Drops fallback unavailable/raw ID; Exchange malformed rows skipped |
| Edition count | CMS Editions -> .collection-item-editions-text-number; Exchange parseInt | DOM | Presentation; Exchange option limit and ACID formula; invalid becomes zero |
| $ACID value | CMS $ACID -> visible value node, but runtime Exchange derives ceil(100/Editions) * quantity | displayed DOM + runtime derivation | Row display versus cart/total; no DOM fallback from CMS value |
| Image/thumbnail | CMS Image -> img src/srcset | DOM | Row and cart/redeem preview; Drops has image-unavailable fallback |
| Marketplace URL | OBJKT Link field is not bound and no scoped runtime reads it | not used | None on these pages |
| Mint date | INTRO list sort uses CMS Mint Date; no row node/runtime read | Webflow configuration | Initial presentation order only |
| Active drop eligibility | shared/drop-params, collection registry/mirror mapping, current time/drop logic, chain balances | Git + derived + chain | Drops burn/redeem availability; not CMS field-driven |
| Exchange eligibility | pane-configured contract plus chain-returned balance and stamped Token ID | Git + chain + DOM identity | Row display and select enabled state |
| Transaction amount | Drops quantity is 1 for the selected checkbox row; Exchange uses selected quantity and derived ACID | derived/runtime input | Trade construction |
| Contract address | shared/chain-registry via list key/pane, stamped to row | Git lookup | NFT/pair matching and transaction payload |
| Pair ID | fetched through chain trade/pair lookup from contract/token | chain | Transaction construction; never list index |
| Drop ID/config identity | active Git drop parameters; list membership supplies presentation row | Git lookup | Active Drops experience |

admin-ui/src/titles/*.json and admin-ui/src/thumbs.manifest.js contain collection/token presentation equivalents, but no public Drops/Exchange import reaches them. They are parity candidates for later value reconciliation, not current public runtime dependencies. admin-ui/src/app.css and admin-ui/src/admin.js do not style or query public CMS rows.

## Ordering dependencies

| List/consumer | Observed order/configuration | Runtime assumption | Classification |
| --- | --- | --- | --- |
| Drops HEN | Token ID ascending; sparse IDs; checked-in 17 rows | Identity from token text; captured order affects initial presentation; connected rows explicitly numeric-sort main IDs | SOFT PRESENTATION for list order; HARD for token text |
| Drops INTRODUCTIONS | Mint Date ascending; current five dates equal; checked-in IDs 4,3,2,1,0 | Initial tie order is accepted; connected rows use numeric mirror-key order | UNRESOLVED tie; SOFT PRESENTATION otherwise |
| Drops CANAAN | Token ID 0-30 ascending | Redeem row found by exact token ID, not index | SOFT PRESENTATION for order; HARD for token text |
| Exchange SCRIPT | Token ID 0-12 ascending | Stamping and chain match by token text; cart iteration follows dropdown DOM order | SOFT PRESENTATION for cart/list order; HARD for token text/pane |
| Exchange CANAAN | Token ID 0-30 ascending | Same as SCRIPT | SOFT PRESENTATION for cart/list order; HARD for token text/pane |
| Chain wallet results | API-defined order not used | find/match by contract and token ID | NO DEPENDENCY |
| Pair identity | Chain lookup from contract/token | No array/DOM position conversion | NO DEPENDENCY on list order; HARD on lookup |

No scoped code assigns CANAAN 0-30, SCRIPT 0-12, sparse HEN IDs, drop IDs, or pair IDs from NodeList position. Exchange dynamic-cart remove-button indices reference the current dropdown object only; they do not establish token identity.

## CMS-sensitive styling

Current checked-in pages load the remote Webflow CSS:

https://cdn.prod.website-files.com/656cf42faa2b1a7a1582d9d2/css/staging-eatacid-xyz.webflow.shared.f47fa79a6.css

Git retains the older historical Webflow export at docs/webflow-migration/evidence/eatacid-xyz-webflow-reference-snapshot.css as migration, debugging, and reference evidence. The byte-identical exchange/css/eatacid-xyz-01-webflow.css is an ignored local duplicate, not a tracked file. Neither file is a runtime dependency or current Webflow CSS authority; the hosted stylesheet above remains authoritative for browser behavior. Current Webflow style metadata confirms the relevant style identities, including .collection-item-01-div, .collection-item-02-div, .collection-item-01-image, .collection-item-title-text, .collection-item-editions-text-number, .collection-item-collection-text, .collection-item-value-div, .collection-item-owned-text, .token-id-container, .token-id-number, .token-qty, .hen-collection, .intros-collection, .canaan-collection, .exchange-collection-01, and .exchange-ui-div.exchange-wallet-tokens-pending.

| Selectors | Material effect in Git snapshot | Origin | Preservation |
| --- | --- | --- | --- |
| .collection-item-01-div | full-width dark flex row, centering, spacing, radius; responsive row layout | Webflow | exact class while current JS/CSS remains; equivalent layout if both are replaced later |
| .collection-item-02-div; .header-editions-div; .token-pair-id-div | current Webflow style identities structure checkbox rows; local CSS snapshots expose .header-editions-div/.token-pair-id-div rules but no .collection-item-02-div rule | Webflow | exact structure for current presentation; current remote-property detail for .collection-item-02-div remains external/unresolved |
| .collection-item-image-div, .collection-item-01-image | image column, sizing, radius, fitting/margins | Webflow | selector-compatible image ancestry required by Drops; visual equivalent sizing required |
| title/edition/collection/value/owned/redeem classes | widths, typography, alignment, borders, flex layout | Webflow | presentation parity; title/edition/collection/owned also runtime-sensitive |
| .token-id-container containing .token-id-number | parent display:none; child retains runtime-readable text | Webflow | hidden DOM must remain readable to JS; exact visual hiding required |
| .token-qty, .w-select | 60x35 control, responsive layout, Webflow select baseline | Webflow helper + custom | exact event selector under unchanged runtime; equivalent visual/control semantics |
| .w-checkbox-input.events_checkbox | custom checkbox and checked state from Drops page custom CSS | Webflow helper + custom/runtime selector | exact event selector/control semantics |
| .exchange-wallet-tokens-pending | page custom CSS hides children except spinner while pending; runtime removes/adds class | Webflow combo + runtime | exact current state contract or functional equivalent wired to runtime |
| .w-dyn-empty; .w-dyn-hide/.w-dyn-bind-empty/.w-condition-invisible | empty-state padding/background; forced hiding | Webflow base | presentation-only for current nonempty lists |
| max-width:767 title/collection rules | hides title and collection columns; changes row/image/control layout | Webflow responsive | visual parity; hidden nodes must stay in DOM because JS still reads them |

The Git snapshots place core rules around lines 2085-2092, 2826-2930, 3203-3265, 3435-3445, and responsive rules around 3833-3975 in both page CSS files. A complete site-wide CSS audit was not performed.

## Webflow interactions and component involvement

[WEBFLOW] No target list or descendant is inside a ComponentInstance, slot, or nested collection. The reusable navigation component is elsewhere and does not own CMS rows.

Exchange lists are descendants of a built-in TabsWrapper/TabsContent/TabsPane structure. [REPOSITORY] checked-in HTML includes .w-tabs/.w-tab-menu/.w-tab-link/.w-tab-content/.w-tab-pane, data-w-tab, generated ARIA state, and Webflow runtime scripts. This is a widget boundary that materially groups collections and provides current tab switching.

All inspected list/field raw settings have visibility=true and no conditional visibility binding. The hidden checkbox label is static visibility=false. Token IDs are hidden by CSS, not CMS conditions. Runtime, not CMS binding, controls pending/owned/eligible display.

No interaction-read capability was available through the current MCP tool surface. Checked-in HTML has no data-w-id attributes on the page, which is evidence against compiled IX markers but is not conclusive Designer metadata. Bridge was not installed because the missing interaction internals do not block the presentation/runtime dependency map; exact interaction and breakpoint visual confirmation is deferred to WF-MIG.5.

## Webflow versus checked-in HTML

[REPOSITORY + WEBFLOW] The checked-in HTML is a strong structural snapshot of the current five Designer templates:

- The same page IDs, wrapper/list/item classes, child order, field nodes, forms, Tabs grouping, and runtime-sensitive ancestors occur.
- Checked-in counts are HEN 17, INTRODUCTIONS 5, Drops CANAAN 31, SCRIPT 13, and Exchange CANAAN 31.
- Token structure/order is sparse ascending HEN, INTRO 4-to-0 under its equal-date sort, and numeric ascending CANAAN/SCRIPT.
- No structurally missing or duplicated token row was found within those expected token-ID sets. This is structural evidence, not a full value reconciliation.

Differences and reliability limits:

- Designer exposes one template DynamoItem and DynamoEmpty; compiled HTML bakes every current item and omits the nonactive empty-state node.
- Compiled rows repeat form/input/select IDs and data-wf-element-id values. Runtime ignores those IDs.
- Checked-in HTML loads local js/main.js, while current Webflow custom code loads deployed drops.js/exchange.js. Both reach the same Git module graph, but they are different delivery paths.
- Checked-in HTML loads remote hashed Webflow CSS and Webflow JS. The generated assets are external to Git ownership; the tracked historical CSS evidence and ignored local duplicate are reference-only.
- Every CMS value and asset URL is baked into checked-in HTML, so the file can become stale when CMS changes. Current structural counts/order match; item-level values are deferred to WF-MIG.4.
- The .introductions-collection runtime selector mismatch exists against both current Webflow and checked-in markup; it is not snapshot drift.

[INFERENCE] The checked-in pages are reliable structural exemplars for these row contracts at audit time, but not authoritative local CMS data sources or proof of saved/published identity.

## Minimum local replacement contract

| Requirement | Classification |
| --- | --- |
| Render all five collection/list memberships on the two correct pages and Exchange panes | EXACT PARITY REQUIRED |
| Supply Title, Editions, Image, Collection, Token ID, and quantity-row $ACID presentation as mapped | EXACT PARITY REQUIRED for current visible output; runtime status varies by field |
| Preserve hidden integer Token ID nodes and the correct outer/inner stamping ancestor | EXACT PARITY REQUIRED |
| Preserve runtime selectors/classes, checkbox/select event targets, closest ancestry, and cloneable Drops wrapper | EXACT PARITY REQUIRED under unchanged runtime |
| Preserve current initial list order and all current items; never derive identity from index | EXACT PARITY REQUIRED for identity; order is presentation parity |
| Keep Exchange SCRIPT/CANAAN pane membership aligned to configured contracts | EXACT PARITY REQUIRED |
| Provide valid image src and optional responsive alternatives | FUNCTIONAL EQUIVALENT ACCEPTABLE for URL/implementation; visual output required |
| Reproduce tab switching, active state, ARIA relationship, pending/no-token transitions | FUNCTIONAL EQUIVALENT ACCEPTABLE internally; observable behavior required |
| Reproduce CSS layout, mobile hiding/layout, overflow, row/control dimensions, and state visibility | FUNCTIONAL EQUIVALENT ACCEPTABLE internally; visual parity required |
| Preserve Webflow element IDs or repeated form/control IDs | APPARENTLY UNUSED; unique local IDs acceptable |
| Render Collection on CANAAN/Exchange and CMS $ACID values | PRESENTATION-ONLY to scoped JS |
| Carry Mint Date as an INTRO sort input | PRESENTATION-ONLY with SOFT/UNRESOLVED tie-order effect |
| Carry OBJKT Link, Name, or Slug into these rows | APPARENTLY UNUSED on these pages |
| Reproduce Designer interaction metadata exactly | UNRESOLVED; behavior/visual verification deferred |

This contract intentionally does not choose a local data format, rendering model, framework, or build architecture.

## Migration risks

No evidence-based BLOCKING risk was identified for understanding the current contract.

| Severity | Risk | Evidence / impact |
| --- | --- | --- |
| HIGH | Hidden Token ID is the bridge from CMS presentation to chain identity | Both runtimes parse hidden text and stamp attributes; missing/malformed identity disables matching/transactions |
| HIGH | Collection identity depends on wrapper/pane grouping and Git keys | Exchange does not validate visible Collection text; misgrouped rows receive the wrong contract |
| HIGH | Git runtime relies on Webflow helper/custom classes and generated hierarchy | Discovery, closest, cloning, event delegation, and styling use those exact seams |
| HIGH | .introductions-collection versus .intros-collection drift | Two Drops helpers currently cannot match the INTRO wrapper |
| HIGH | Current checked-in pages depend on remote hashed Webflow CSS/JS | Full Git ownership requires reproducing currently external styling/widget behavior |
| HIGH | Checked-in CMS rows are baked snapshots | They match structurally now but can silently stale when CMS values/items change |
| MEDIUM | Exchange displays CMS $ACID but calculates cart value independently from Editions | A value mismatch could show one row value and transact/display another; WF-MIG.4 must reconcile values |
| MEDIUM | Numeric text parsing has permissive fallbacks | Invalid edition becomes zero; invalid owned becomes zero; missing token makes row unusable |
| MEDIUM | Drops removes/clones/reorders generated outer items | Replacement must retain complete controls, descendants, and event-compatible clone structure |
| MEDIUM | INTRO equal-date sort has no exposed tie break | Current initial ID order is 4-to-0, while connected rendering can become numeric |
| MEDIUM | Mobile CSS hides title/collection nodes that runtime still reads | Removing rather than hiding them would break cart metadata |
| MEDIUM | Saved-versus-published and interaction metadata are inaccessible | Current structure is observed, but publication/Designer-only equivalence is not proven |
| LOW | Repeated generated form/control IDs are invalid/fragile markup | Current JS avoids ID selectors; a local replacement can make IDs unique |
| INFORMATIONAL | CMS OBJKT Link, Name, and Slug are not used by these rows | They need not be assumed runtime inputs solely because they exist in CMS |

## Unresolved items and MCP limitations

- Whether the current list/binding settings are saved state, published state, or identical in both.
- Webflow interaction assignments and exact Tabs/widget initialization internals; no interaction read endpoint was available.
- INTRODUCTIONS sort tie-break behavior when Mint Date values are equal.
- Whether any Designer-only behavior is attached to the otherwise unused Drops CANAAN quantity form.
- Exact live visual output at every breakpoint; structural responsive selectors were inspected, but the site-wide visual audit belongs to WF-MIG.5.
- Item-by-item title, edition, image, collection, $ACID, date, and link reconciliation; explicitly deferred to WF-MIG.4.

These gaps did not require a write operation, publishing, Bridge installation, or expansion beyond the five deliverables.

## Inputs for WF-MIG.4 and WF-MIG.5

WF-MIG.4 should use the exact field/list/target IDs in 03-field-bindings.json and the structurally matched row counts/order to reconcile values. Priority seams are CMS $ACID versus the Exchange edition formula, titles/images used in carts, sparse HEN and mirrored environment IDs, INTRO equal-date ordering, and the fact that OBJKT Link/Name/Slug are not rendered here. admin-ui title/thumbnail files are possible comparison sources but are not current public runtime imports.

WF-MIG.5 should verify visual and interaction parity for the two row designs at desktop/mobile breakpoints, Webflow Tabs behavior, initial pending/no-token transitions, hidden token nodes, row cloning/removal, checkbox/select states, empty states, and the current .intros/.introductions selector seam. It should also determine whether Bridge exposes interaction metadata that materially changes the observed contracts.
