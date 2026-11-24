# AUD-007 correctness investigation

**COMPLETE application source pass — one confirmed conditional finding; not clean.**
Recorded 2026-11-23 (America/Chicago). This is investigation evidence, not the final
public report. The complete adversarial source pass is recorded in coverage and
the prescribed remediation checklist is finalized from its one actionable finding.
Historical records are preserved. No production remediation or deployment approval
is implied. Completion of source examination does not establish live correctness.

Reviewed runtime source: Outer `9c678c7e92f247749a45b3f206823c53b9d5b55d`
and independent Admin `3db964da8cc92b4aad500911c1be3dd65f03fa76`, both initially
clean on `ticket-AUD-007-full-correctness-review`. Reviewed working changes are
only AUD-007 investigation documentation and an inert/disposable reproduction.
[Coverage](coverage.md) records examination progress, remaining work and actual checks.

## AUD-007-001 — canonical exclusions are reapplied to translated token IDs

**Confirmed, conditional P2 availability/identity failure; Outer + Admin.**
The committed SPLINTERED exclusion `141634` does not trigger it. An accepted future
configuration supplied through the supported writer does. No live incident,
unauthorized transaction, incorrect burn, asset loss or bypass of the Admin
translation guard is demonstrated.

**Independently grounded property.** Token identity includes its contract and
network. Canonical IDs and mirror IDs are separate namespaces. Excluding one
canonical token must not exclude a distinct canonical token whose network ID has
the same decimal representation. In the current registry, canonical HEN `94684`
maps to Shadownet `0`; canonical exclusion `0` does not name that token. This is
also the key-based exclusion contract implemented by the mirror transform and
the independent translation audit. The general contract/ID identity rule is
specified in [TZIP-12](https://gitlab.com/tezos/tzip/-/blob/master/proposals/tzip-12/tzip-12.md)
(consulted 2026-11-23); external token existence is not needed for the local
cross-namespace counterexample.

**Supported reachability and source.**

- Outer strict authoring accepts any canonical decimal exclusion, without requiring
  membership in a mirror's canonical keys
  ([validator](../shared/drop-params/drop-params-authoring.mjs#L245)). The supported
  CLI forwards the structured candidate to the real transaction writer. The
  reproduction proves `editDropParams` completes and verifies all three
  representations in a disposable copy with `HEN.exclude = ["0"]`.
- Admin normalizes mirror values after excluding canonical **keys**, then
  [filters the resulting network IDs again](../admin-ui/src/features/drops/drops.data.js#L382)
  using the untransformed canonical exclusions. This incorrectly removes network
  `0`. The [translation audit](../admin-ui/src/features/drops/utils/validate-translation-audit.js#L139)
  correctly expects all 17 current HEN mirror values and reports
  `network-mirror-mismatch` against the 16-token normalized result. Status becomes
  verification-required and cached Send validation cannot authorize setup.
- Public [wallet eligibility](../drops/js/events.js#L1968) compares the same
  exclusions directly with wallet-native `nft.tokenId` before the correct
  canonical-key handling in `resolveBurnTokenRenderIdentities`. It silently removes
  the held Shadownet token `0`, so the real holdings renderer omits canonical HEN
  `94684` from the selectable burn rows. The later identity resolver cannot restore
  a token removed by the earlier filter.

**Deterministic evidence.** From Outer:

```text
node audits/repro/AUD-007-exclusion-identity-repro.mjs
```

The [runner](repro/AUD-007-exclusion-identity-repro.mjs) executes current schema,
serializer, real writer in a bounded temporary copy, current Admin normalizer,
builder and translation audit, and current Public production holdings functions
through the maintained inert DOM/CMS fixture. It uses the checked-out registry
without altering addresses/mirrors. Only DOM, wallet observation and temporary
filesystem boundaries are controlled; it performs no live reads or wallet request.

| Authored HEN exclusions | Intended canonical `94684` eligibility | Admin normalized / Public rendered eligibility | Translation audit |
| --- | --- | --- | --- |
| `[]` | Eligible | Eligible / eligible | Pass |
| `["94684"]` | Excluded | Excluded / excluded | Pass |
| `["0"]` | Eligible | **Excluded / excluded** | **network-mirror-mismatch** |

All three candidates pass strict active schema validation. The writer control
returns `completed` and source/JSON/Admin mirror equality for the third candidate.
The full runner passed twice with both controls and writer admission.
No failing assertion is suppressed: it asserts the defect's
actual result against an independently computed canonical-key oracle. The normal
308-test Public and 2,078-test Admin suites also pass on these revisions, showing
that those suites do not cover this configuration interaction.

**Consequence and scope.** A permitted CLI-authored configuration can disable
Admin pair setup and hide an otherwise eligible mirrored holding in Public.
That is a cross-component availability failure, not evidence of a wrong serialized
trade. Editing an inactive file while authoring applies is not involved;
AUD-005-001's accepted unsupported external-edit limitation remains unchanged.
Remediation is not authorized by this ticket. A future fix should preserve the
canonical exclusion namespace through both consumers and retain the independent
translation guard. The completed pass consolidates both consumers into one
implementation ticket in the remediation checklist.

## Investigated observations that are not confirmed findings

- Admin's launched countdown phase and current pause authority are separate.
  `drops.checklist.controller.js` explicitly represents `paused-live`, while
  `state.pause` independently gates Send. A retained `live` countdown phase alone
  is insufficient evidence of an actionable unpaused-state failure.
- `readWriterState` in the loopback service classifies `owned`/`contended` as busy,
  while the projector exposes another running process as `active`. This is a
  source-observed diagnostic mismatch, **not a material finding** in this pass.
  Before a journal exists, state/preview can appear READY during another process's
  claim. Apply still enters the real shared claim lock (bounded ten-second wait),
  then rechecks unresolved journals, source version and representation equality
  under ownership. Existing journals independently block state/preview/apply.
  A queued success or explicit failure requiring a new preview does not demonstrate
  a lost edit, false completed write or unsafe recovery. No lock bypass is inferred
  from the early busy flag, and no live cross-process service behavior was observed.
- Direct legacy read/helper exports with no current caller are not assumed to be
  exercised UI workflows. Reverse reconciliation includes their exports and actual
  callers; private dormant NFT remote-recovery code is not a current entrypoint.
- A delayed metadata promise can expose missing presentation fences in pair views,
  but the current `chainUi.token` -> catalog/getTokenUi producer resolves local
  titles/thumbs without a remote wait. Known collections use local token lists;
  unknown modal contracts use custom mode. Injecting arbitrary delayed metadata
  is insufficient to establish an ordinary current UI failure. Likewise Exchange
  pause broadcasts are non-bubbling panel events, so they do not reach the global
  Drops pause listener. These producer/consumer boundaries were checked directly.

## Verification boundaries

No browser, real wallet/provider, chain transaction, live RPC/TzKT/time observation,
Webflow/CMS inspection or mutation, deployed-contract query, deployment or external
publication occurred. The FA2 transfer/approval layouts and downstream rollback
reasoning were checked against TZIP-12 and
[Tezos operation semantics](https://docs.tezos.com/smart-contracts/logic/operations),
not by executing configured FA2 contracts. The legacy SmartPy compiler was not
provided or run. ABI decoding and byte correspondence checks do not compile,
typecheck or execute SmartPy/Michelson or certify deployed identity. Exact commands
and the completed workflow examination remain in coverage. Passing checks support
their exercised cases; the complete source traces, not test success, establish the
examination status. One finding remains, so no clean claim or clean-result refresh
is made. AUD-006's two original ownership paths are remediated in these revisions;
their historical findings are unchanged.
