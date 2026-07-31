# WF-MIG.3 CMS DOM Contracts

## Shared page-level structure

Evidence labels in this document are [WEBFLOW] for direct read-only Designer/settings observations, [REPOSITORY] for current checked-in files, and [INFERENCE] for conclusions that join those facts.

[WEBFLOW] Drops page 67be119ce0fb23251217c7a9 places all three lists beneath:

    body#656cf42faa2b1a7a1582d9de
      div.main-div.first-paint-surface
        div.main-container
          div.events-main-container
            div.drops-ui-div
              div.events-wallet-ui-div.drops-wallet-tokens-pending
                [HEN, INTROs, and CANAAN DynamoWrapper siblings]

[WEBFLOW] The Exchange page 65dcf9fcd636fdd5996f46ec places each list in a different Webflow Tabs pane:

    body#656cf42faa2b1a7a1582d9de
      div.main-div.first-paint-surface
        div.main-container
          div.exchange-main-container
            div.exchange-ui-main
              div.tabs-2.w-tabs
                div.tabs-content-2.w-tab-content
                  div.w-tab-pane[data-w-tab="419"]
                    div.exchange-ui-div.exchange-wallet-tokens-pending
                      [THE 419 SCRIPT DynamoWrapper]
                  div.w-tab-pane[data-w-tab="CANAAN"]
                    div.exchange-ui-div.exchange-wallet-tokens-pending
                      [CANAAN DynamoWrapper]

No inspected list is inside a ComponentInstance, component slot, or another Collection List. Exchange uses a built-in Tabs widget, not a reusable Designer component. All raw list settings report dynamic mode, limit 100, offset 0, no filters, no pagination, no curated items, and visible=true. None exposes a bound DOM ID or list-level conditional visibility.

## Drops HEN row

- Source collection: HENs, 67be12e2583121ead44b79ed.
- Webflow list configuration: DynamoWrapper ae68042e-a003-3b81-3054-355b079d3ad1; Token ID ascending; limit 100; no filters or pagination.
- Simplified HTML-shaped hierarchy:

    div.hen-collection.w-dyn-list                         # wrapper ae680...3ad1
      div.w-dyn-items                                    # list ae680...3ad2
        div.hen-collection-item-01.w-dyn-item             # item ae680...3ad3
          div.collection-item-02-div                      # row 2b023...
            div.collection-item-image-div
              img.collection-item-01-image                # d7310a91... {{Image}}
            div.collection-item-title-div
              div.collection-item-title-text              # 32ab85e2... {{Title}}
            div.header-editions-div
              div.collection-item-editions-text-x         # static "x"
              div.collection-item-editions-text-number    # 713a5ee6... {{Editions}}
            div.token-id-container                        # hidden
              div.token-id-number                         # 35742425... {{Token ID}}
            div.collection-item-collection-div
              div.collection-item-collection-text         # b6d0ee60... {{Collection}}
            div.collection-item-owned-div
              div.collection-item-editions-text-x         # static "x"
              div.collection-item-owned-text              # static initial "00"; runtime-owned
            div.collection-item-redeem-div
              div.collection-item-redeem-checkbox-form.w-form
                form.form#email-form-2
                  label.checkbox-field.w-checkbox
                    input.events_checkbox.w-checkbox-input#Checkbox-2[type=checkbox]
                    span.checkbox-label.w-form-label      # visibility=false

- Field bindings: Image to image asset/src with inherited alt; Title, Editions, Token ID, and Collection to direct text. Mint Date, OBJKT Link, Name, and Slug are not bound. The static x nodes, initial owned 00, form attributes, and checkbox are not CMS-bound.
- Runtime-sensitive selectors: .hen-collection .w-dyn-item; .token-id-number; .collection-item-title-text; .collection-item-collection-text; .collection-item-editions-text-number; .collection-item-image-div img; .collection-item-owned-text; .w-checkbox-input.events_checkbox; closest stamped [data-token-id].
- Runtime-sensitive ordering: Webflow presents sparse HEN IDs ascending (checked-in snapshot: 94684 through 526531). Runtime captures this order but identifies rows by token text; connected Shadownet rows are explicitly sorted by numeric main ID and cloned through the Git mirror mapping. No array index becomes a token or pair ID.
- CSS-sensitive classes: .collection-item-02-div, .header-editions-div, image/title/collection/owned/redeem wrappers, .collection-item-01-image, .token-id-container, .token-id-number, .events_checkbox, .w-checkbox-input, and .w-dyn-item.
- Exact-parity requirements: selector-compatible wrapper/item/control classes; one hidden, unformatted Token ID text per row; title/collection/edition/image nodes at the expected descendant relationships; checkbox beneath the stamped row; cloneable complete outer item.
- Functionally equivalent elements: Webflow element IDs and repeated form/input IDs are not queried; a local implementation may use unique IDs. Image URLs may differ if the same visual asset remains loadable. Form submission success/failure structures are not used by public runtime.
- Unresolved details: interaction assignment is not exposed by the available read-only MCP surface. The compiled snapshot has no data-w-id markers on these rows, but that does not prove the absence of Designer interaction metadata.

## Drops INTRODUCTIONS row

- Source collection: INTRODUCTIONs, 67be31a0b7084dfce75026fd.
- Webflow list configuration: DynamoWrapper d8f397d1-f69c-180a-7ee6-b53dda6483b1; Mint Date ascending; limit 100; no filters or pagination.
- Simplified HTML-shaped hierarchy:

    div.intros-collection.w-dyn-list                      # wrapper d8f397...b1
      div.collection-list-4.w-dyn-items                   # list ...b2
        div.intros-collection-item-01.w-dyn-item           # item ...b3
          div.collection-item-02-div
            div.collection-item-image-div
              img.collection-item-01-image                # b1e0fa4c... {{Image}}
            div.collection-item-title-div
              div.collection-item-title-text              # 6729ac7f... {{Title}}
            div.token-pair-id-div
              div.collection-item-editions-text-x         # static "x"
              div.collection-item-editions-text-number    # 7f0956fa...f6 {{Editions}}
            div.token-id-container
              div.token-id-number                         # ffe74600... {{Token ID}}
            div.collection-item-collection-div
              div.collection-item-collection-text         # 60e47db4... {{Collection}}
            div.collection-item-owned-div
              div.collection-item-editions-text-x         # static "x"
              div.collection-item-owned-text              # static initial "00"
            div.collection-item-redeem-div
              div.collection-item-redeem-checkbox-form.w-form
                form.form#email-form-2
                  label.checkbox-field.w-checkbox
                    input.events_checkbox.w-checkbox-input#Checkbox[type=checkbox]
                    span.checkbox-label.w-form-label      # visibility=false

- Field bindings: the same five binding roles as HEN. Mint Date is a list sort key but has no item element. OBJKT Link, Name, and Slug are not bound.
- Runtime-sensitive selectors: identical row descendants to HEN, with .intros-collection for discovery. getWalletTokenPanes and displayDefaultTokens instead request .introductions-collection.w-dyn-list, which does not match current Webflow/Git markup.
- Runtime-sensitive ordering: Webflow sorts Mint Date ascending, but all five current items share the same date and the checked-in order is Token IDs 4,3,2,1,0. Tie-break behavior is unresolved. Connected wallet rendering uses numeric main-ID order through the mirror map.
- CSS-sensitive classes: the shared checkbox-row classes plus .token-pair-id-div, .intros-collection, .collection-list-4, and .intros-collection-item-01. Unlike HEN, INTRO does not use .header-editions-div for its edition wrapper.
- Exact-parity requirements: the HEN checkbox-row contract and the actually used .intros-collection discovery class. Token text remains the hard identity.
- Functionally equivalent elements: unique IDs, equivalent image URLs, and non-submitting control wrappers are acceptable if unchanged runtime selectors/events still match.
- Unresolved details: the current .introductions-collection selector drift is an observed seam, not a proposed target; saved-versus-published state and equal-date tie behavior are unavailable.

## Drops CANAAN row

- Source collection: CANAANs, 65a1be9dcae2314a8ac50aae.
- Webflow list configuration: DynamoWrapper 10d66a25-e077-73df-b103-49c09151fb87; Token ID ascending; limit 100; no filters or pagination.
- Simplified HTML-shaped hierarchy:

    div.canaan-collection.w-dyn-list
      div.collection-list-5.w-dyn-items
        div.collection-item-01.w-dyn-item
          div.collection-item-01-div
            div.collection-item-image-div
              img.collection-item-01-image                # ...fb8c {{Image}}
            div.collection-item-title-div
              div.collection-item-title-text              # ...fb8e {{Title}}
            div.token-pair-id-div
              div.collection-item-editions-text-x         # static "x"
              div.collection-item-editions-text-number    # ...fb92 {{Editions}}
            div.token-id-container
              div.token-id-number                         # ...fb94 {{Token ID}}
            div.collection-item-collection-div
              div.collection-item-collection-text         # ...fb96 {{Collection}}
            div.collection-item-value-div
              div.collection-item-value-text              # static "x"
              div.collection-item-value-text              # ...fb9a {{$ACID Value}}
              img.collection-item-value-acid-coin-image   # static coin
            div.collection-item-redeem-div
              div.collection-item-redeem-qty-form.w-form
                form.form#email-form
                  select.token-qty.w-select#field-2
                    option "" "QTY"; options 1 through 10
                div.w-form-done
                div.w-form-fail

- Field bindings: Image, Title, Editions, Token ID, Collection, and $ACID Value. Name and Slug are not bound. No href, custom attribute, metadata, or visibility field binding was observed.
- Runtime-sensitive selectors: .canaan-collection .collection-item-01.w-dyn-item; .token-id-number; .collection-item-title-text; .collection-item-editions-text-number; .collection-item-image-div img. Drops uses this list primarily as redeem-presentation lookup; it does not read the CMS $ACID node or the quantity select.
- Runtime-sensitive ordering: current and checked-in order is Token IDs 0-30 ascending. Runtime resolves the configured redeem row by exact token ID, not position.
- CSS-sensitive classes: .collection-item-01-div and all image/title/pair/collection/value/redeem classes; .token-qty and .w-select affect layout even though Drops runtime does not consume the select.
- Exact-parity requirements: selector-compatible outer item, hidden token node, title/edition/image descendants, and numeric Token ID identity. The visual value/coin block is required for current presentation parity.
- Functionally equivalent elements: repeated form/select IDs, form result markup, exact CDN URLs, and Webflow element IDs are not runtime dependencies. The quantity control is presentation-only on Drops unless future behavior outside current scoped code consumes it.
- Unresolved details: whether the unused Drops CANAAN quantity controls have Designer-only behavior is not exposed.

## Exchange THE 419 SCRIPT row

- Source collection: THE 419 SCRIPTs, 656f7e02b503790c02f0edff.
- Webflow list configuration: DynamoWrapper ae68042e-a003-3b81-3054-355b079d3ad1 inside data-w-tab=419; Token ID ascending; limit 100; no filters or pagination.
- Simplified HTML-shaped hierarchy:

    div.w-tab-pane[data-w-tab="419"]
      div.exchange-ui-div.exchange-wallet-tokens-pending
        img.loading-spinner-01-exchange-ui
        div.no-tokens-in-walet-div---419
        div.exchange-collection-01.w-dyn-list
          div.collection-list-3.w-dyn-items
            div.collection-item-01.w-dyn-item
              div.collection-item-01-div
                div.collection-item-image-div
                  img.collection-item-01-image             # db668b2e... {{Image}}
                div.collection-item-title-div
                  div.collection-item-title-text           # 421a2f3d... {{Title}}
                div.token-pair-id-div
                  div.collection-item-editions-text-x      # static "x"
                  div.collection-item-editions-text-number # 59f4016c... {{Editions}}
                div.token-id-container
                  div.token-id-number                      # afb81943... {{Token ID}}
                div.collection-item-collection-div
                  div.collection-item-collection-text      # a4057416... {{Collection}}
                div.collection-item-value-div
                  div.collection-item-value-text           # static "x"
                  div.collection-item-value-text           # 4a214264... {{$ACID Value}}
                  img.collection-item-value-acid-coin-image
                div.collection-item-redeem-div
                  div.collection-item-redeem-qty-form.w-form
                    form.form#email-form
                      select.token-qty.w-select#field
                        option "" "QTY"; options 1 through 10

- Field bindings: Image, Title, Editions, Token ID, Collection, and $ACID Value. Mint Date, OBJKT Link, Name, and Slug are not bound.
- Runtime-sensitive selectors: pane data-w-tab=419, .exchange-ui-div, first .w-dyn-list, .collection-item-01-div, .token-id-number, .token-qty.w-select, title/image/edition descendants, and runtime data attributes on the inner row.
- Runtime-sensitive ordering: Webflow and checked-in output are Token IDs 0-12 ascending. Cart display follows select DOM order, but chain matching and pair lookup use stamped token identity.
- CSS-sensitive classes: all quantity-row classes, .exchange-collection-01, .collection-list-3, .exchange-ui-div.exchange-wallet-tokens-pending, spinner/no-token classes, and Webflow Tabs classes/attributes.
- Exact-parity requirements: pane/list grouping, all selectors and ancestor relations, numeric edition/token text, a real select event target, and initial pending state compatible with runtime transitions.
- Functionally equivalent elements: exact Webflow widget implementation, generated ARIA IDs, repeated form/select IDs, and image CDN URLs may change if tab switching, accessibility relationships, event delivery, and visuals remain equivalent.
- Unresolved details: Webflow Tabs initialization and any Designer interaction metadata are not readable through the current MCP surface.

## Exchange CANAAN row

- Source collection: CANAANs, 65a1be9dcae2314a8ac50aae.
- Webflow list configuration: DynamoWrapper f158e130-ffad-eb67-3544-150761deb4e2 inside data-w-tab=CANAAN; Token ID ascending; limit 100; no filters or pagination.
- Simplified HTML-shaped hierarchy:

    div.w-tab-pane[data-w-tab="CANAAN"]
      div.exchange-ui-div.exchange-wallet-tokens-pending
        img.loading-spinner-01-exchange-ui
        div.no-tokens-in-walet-div---canaan
        div.exchange-collection-01.w-dyn-list
          div.collection-list-5.w-dyn-items
            div.collection-item-01.w-dyn-item
              div.collection-item-01-div
                div.collection-item-image-div
                  img.collection-item-01-image             # 7c5ad02b... {{Image}}
                div.collection-item-title-div
                  div.collection-item-title-text           # 028e76f0... {{Title}}
                div.token-pair-id-div
                  div.collection-item-editions-text-x
                  div.collection-item-editions-text-number # 987d1637... {{Editions}}
                div.token-id-container
                  div.token-id-number                      # 367dcaf6... {{Token ID}}
                div.collection-item-collection-div
                  div.collection-item-collection-text      # c0a8de6d... {{Collection}}
                div.collection-item-value-div
                  div.collection-item-value-text           # static "x"
                  div.collection-item-value-text           # d1c5f2b1... {{$ACID Value}}
                  img.collection-item-value-acid-coin-image
                div.collection-item-redeem-div
                  div.collection-item-redeem-qty-form.w-form
                    form.form#email-form
                      select.token-qty.w-select#field-2
                        option "" "QTY"; options 1 through 10

- Field bindings: the same six CANAAN bindings as Drops, but different target element IDs. Name and Slug are not bound.
- Runtime-sensitive selectors: identical to the SCRIPT quantity row, but pane data-w-tab=CANAAN and its no-token selector determine the Git contract group.
- Runtime-sensitive ordering: Token IDs 0-30 ascending in Webflow and checked-in HTML. There is no index-to-token or index-to-pair conversion.
- CSS-sensitive classes: identical quantity-row classes to SCRIPT; list class is collection-list-5 rather than collection-list-3.
- Exact-parity requirements: identical to the SCRIPT row with correct CANAAN pane membership.
- Functionally equivalent elements: identical to SCRIPT. Visible CMS $ACID may be rendered equivalently, but runtime derives its cart value from Editions.
- Unresolved details: Tabs/interaction internals and saved-versus-published relationship.

## Empty states

[WEBFLOW] Each of the five DynamoWrappers has one DynamoEmpty sibling to the DynamoList. Each contains a plain block with No items found. No CMS binding, conditional visibility, link, image, or custom attribute is attached. Current collections are nonempty, so [REPOSITORY] the checked-in compiled HTML contains rendered rows and no .w-dyn-empty node for these lists. The local CSS snapshot defines .w-dyn-empty with a gray background and 10px padding and .w-dyn-hide/.w-dyn-bind-empty/.w-condition-invisible as display:none!important.

Runtime does not query .w-dyn-empty. A functionally equivalent empty presentation is acceptable, but a local replacement still needs the page-level wallet no-token states separately because those are runtime-controlled and not the CMS empty state.

## Pagination structures

All five raw settings report pagination=null, limit=100, offset=0. No next/previous controls occur under any inspected DynamoWrapper. Exact parity means emitting no pagination controls for the present site; a replacement must still render all current rows because each collection is below the 100-item limit.

## Runtime-added state

- Drops stamps data-token-id and data-contract-address on the outer .w-dyn-item, writes .collection-item-owned-text, checks/unchecks inputs, removes ineligible wrappers, deep-clones eligible HEN/INTRO wrappers, rewrites mapped token IDs, reorders appended clones, hides empty panes inline, and removes drops-wallet-tokens-pending.
- Drops may add body.live-panels and state classes outside the row. Those do not originate in CMS.
- Exchange stamps data-token-id and data-contract-address on the inner .collection-item-01-div, sets inline row display, disables/enables and repopulates .token-qty selects, and removes/adds exchange-wallet-tokens-pending.
- Exchange creates separate cart DOM; its dynamic cart rows are not CMS Collection Items.
- Repeated generated IDs are present in checked-in output: HEN form/input IDs, INTRO form/input IDs, and quantity form/select IDs repeat per item. Runtime uses classes and ancestry, not these IDs. Exact duplication is unnecessary and valid unique IDs are acceptable.

## Cross-list structural comparison

The five rows reduce to two genuine row designs:

| Design | Lists | Shared contract | Differences |
| --- | --- | --- | --- |
| Checkbox/owned row | Drops HEN, Drops INTRODUCTIONS | outer .w-dyn-item; inner .collection-item-02-div; image/title/edition/hidden-token/collection/owned/checkbox in the same semantic order | wrapper/item/list classes, template IDs, checkbox ID/name; HEN uses .header-editions-div while INTRO uses .token-pair-id-div; INTRO sort key differs |
| Quantity/value row | Drops CANAAN, Exchange SCRIPT, Exchange CANAAN | outer .collection-item-01.w-dyn-item; inner .collection-item-01-div; image/title/edition/hidden-token/collection/$ACID/quantity | page/list/pane grouping, list class, template IDs, select ID; Exchange runtime consumes quantity while Drops does not |

[WEBFLOW] Direct tree comparison, not collection-name inference, establishes these equivalences. HEN and INTRO share the semantic child types/order but are not class-identical because the edition wrapper differs. The three quantity rows share child types/order and classes. Drops and Exchange nevertheless use different stamping levels: outer wrapper on Drops versus inner row on Exchange.

## Minimum parity contract

- EXACT PARITY REQUIRED: collection-to-page/list membership; Exchange 419/CANAAN pane grouping; .w-dyn-list/.w-dyn-item and runtime-referenced wrapper classes; inner row classes; hidden .token-id-number integer text; title/edition/image descendants; HEN/INTRO checkbox targets; Exchange quantity select targets; runtime stamping locations; initial pending regions; current field text semantics.
- EXACT PARITY REQUIRED: Token IDs as stable identity. CANAAN 0-30, SCRIPT 0-12, sparse HEN IDs, and INTRO 0-4 must not be replaced by DOM indices. Pair IDs remain chain-derived.
- FUNCTIONAL EQUIVALENT ACCEPTABLE: Webflow element IDs, repeated form IDs, exact CDN URLs, Webflow-generated srcset strings, form success/failure wrappers, and the internal tabs implementation, provided unchanged runtime selectors and behaviors remain satisfied or an equivalent consumer is supplied later.
- PRESENTATION-ONLY: visible CMS $ACID nodes, static x labels/coin image, Collection text on CANAAN and Exchange rows, empty-state treatment, and responsive hiding of title/collection text. These still require visual parity even when runtime does not read them.
- APPARENTLY UNUSED: Mint Date except INTRO list sorting; OBJKT Link; Name; Slug; image-alt CMS binding (none exists). Drops CANAAN quantity controls are not consumed by scoped public runtime.
- UNRESOLVED: saved versus published list/binding state, Designer interaction metadata, Webflow Tabs initialization details, and INTRO equal-date tie breaking.

## Limitations

The read-only element/settings surfaces expose current Designer structure, raw CMS bindings, list configuration, and style identities but do not label saved versus published state. No interaction read endpoint was available; no Bridge was installed because this gap does not block the row/runtime contract and is deferred to WF-MIG.5. The checked-in HTML supplies concrete compiled structure and counts, but item-by-item value reconciliation is deferred to WF-MIG.4. This document is not a site-wide visual or CSS audit.
