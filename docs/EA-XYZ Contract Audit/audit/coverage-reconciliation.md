# Coverage reconciliation

## Method

Independently derived the 181 required cells from `test-coverage-requirements.md`, reconciled all I-01--I-26 rows and exact test names against the manifest, then inspected the mapped assertions, negative-path preconditions, storage/balance rollback, boundaries, batch routing/atomicity, SmartPy event-log segmentation, and FA2 test-double separation against the audit fixture. Mapping metadata and declared totals were not treated as proof.

## Result

- Invariants reviewed: 26/26.
- Required obligation cells reviewed: 181/181.
- Initial classification: 180 directly proven, 1 partially proven, 0 not proven, 0 not applicable among marked cells.
- Gap: I-18/N claimed post-success authorization and balance enforcement, but the mapped suite exercised those two failures only before any successful trade. Pause and stale-term enforcement after success were already direct.
- Remediation: T10 now proves exact `FA2_NOT_OPERATOR` and `FA2_INSUFFICIENT_BALANCE` failures after a successful trade, with exact balances, call counts, escrow storage, pair storage, and failed-call event absence. The event verifier was extended only for those two markers.
- Final classification: 181 directly proven, 0 partially proven, 0 not proven.
- Manifest verification: all 26 IDs and all required cells match the independently derived denominator; no non-required cells are counted; all 13 names resolve exactly. The verifier uses a separate fixed obligation table rather than trusting manifest totals, so no current self-reference defect was found.
- Assertion quality: storage, token/tez balances, exact failure causality, rollback, boundaries, heterogeneous/repeated batches, routing/quantities, and event tag/payload/order/multiplicity are adequate after remediation. Event cases are isolated by unique scenario-local markers and top-level transaction boundaries; failed segments are identified from actual SmartPy failure output, including staged-event backtracking.
- Trust boundaries: conforming FA2 drives economic assertions; rejecting FA2 drives deterministic rollback; accepting-no-op FA2 is confined to the external-token trust-boundary cases. Setup minting does not bypass transfer operator checks.
- Verification: two consecutive pinned SmartPy runs passed all 13 tests; each event verification passed 90 cases across 8 entrypoints with 11 staged-event rollbacks; each coverage verification passed 26/26 invariants and 181/181 obligations.

## Final status and limitations

Coverage is complete for the stated invariant denominator. One false-positive coverage narrative was corrected by the test remediation above. Residual limitations are the declared FA2 trust boundary and SmartPy scenario/log evidence; release compilation and provenance verification remain intentionally deferred to the next phase.
