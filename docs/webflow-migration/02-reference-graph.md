# WF-MIG.2 CMS Reference Graph

## Collection relationships

[WEBFLOW] Four complete collection schemas were read for site `656cf42faa2b1a7a1582d9d2`: THE 419 SCRIPTs, CANAANs, HENs, and INTRODUCTIONs. None contains a field whose Webflow type is `Reference` or `MultiReference`.

Collection relationship graph: four isolated collection nodes and zero reference edges.

## Reference fields

[WEBFLOW] Reference field count: 0 of 36 total field definitions.

Source collections: none. Target collections: none. Reference field IDs: none.

## Multi-reference fields

[WEBFLOW] MultiReference field count: 0 of 36 total field definitions.

Source collections: none. Target collections: none. Multi-reference field IDs: none.

## Item-level relationships

[WEBFLOW] All 66 items were read with complete pagination. No item field contains a reference ID or multi-reference ID array because no reference-capable field exists in any source schema.

Item-level relationship count: 0.

## Missing or dangling references

No missing, dangling, or self-reference was found. This is vacuously true for the observed model because the complete schema has zero reference fields and the complete item export has zero reference values.

## No-reference confirmation, if applicable

The no-reference result is directly supported by:

- `get_collection_list`: exactly four collections;
- `get_collection_details`: 36 total fields across all four collections, with no `Reference` or `MultiReference` type;
- `list_collection_items`: 66 of 66 items returned, with all schema fields present;
- `02-collections.json`: every `referenceTargets` array is empty;
- `02-fields.json`: every `referenceCollectionId` and `multiReferenceCollectionId` is null;
- `02-items.json`: every `references` array is empty.

## Limitations

- The conclusion covers the current values returned by the Webflow Data API for site `656cf42faa2b1a7a1582d9d2`.
- The API does not identify whether collection schema reads are saved-only, published-only, or identical in both states.
- No deep Collection List binding audit was performed; that is deferred to WF-MIG.3 and does not change the absence of reference-typed CMS fields.
- Empty saved CMS template bodies limit template interpretation but do not affect schema-level reference detection.

