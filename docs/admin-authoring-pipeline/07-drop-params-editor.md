# Drop params editor audit

## Current authority and mirrors

**CURRENT STATE.** The editable authority is:

```text
shared/drop-params/drop-params.js
```

Generated/mirrored outputs are:

```text
shared/drop-params/drop-params.json
admin-ui/src/drop-params.mirror.json
```

The JavaScript source has `dropScheduled`, `dropName`, `mirrorNetwork`, `dropDate`, `dropTime`, `burnTokens[]`, and `redeemToken` (`shared/drop-params/drop-params.js:3-62`). The UI must remain an authoring surface over this authority, not create a second database.

## Current readers and consumers

- Public Drops imports the local workspace package `ea-drop-params`, whose entry exports `drop-params.js` (`drops/js/events.js:11-13`; `shared/drop-params/index.js:1-2`).
- The generator imports the JS source and writes shared JSON (`shared/drop-params/gen-drop-params-json.mjs:5-38`).
- The watcher observes the JS source, runs the generator, and mirrors JSON into Admin (`shared/drop-params/watch-drop-params-json.mjs:9-18`, `shared/drop-params/watch-drop-params-json.mjs:60-120`).
- Admin statically imports its JSON mirror (`admin-ui/src/features/drops/drops.controller.js:43-47`).
- Admin normalizes the mirrored object for preview/pair generation and checklist state (`admin-ui/src/features/drops/drops.data.js:230-410`).
- Admin compares the mirrored JSON structurally with GitHub raw `staging` and `main` copies every 15 seconds while scheduled (`admin-ui/src/features/drops/drops.checklist.controller.js:738-943`).
- The CMS image pilot reads the authoritative JS object to prevent changing the configured active redeem token (`assets/webflow-cms-image-pilot/cms-image-pilot.mjs:349-383`).

## Current validation

| Layer | Present | Gap |
|---|---|---|
| JavaScript module evaluation | Node import during generation/build | Syntax/runtime error blocks import but is not a user-friendly schema result |
| JSON syntax | Admin build guard parses mirror (`admin-ui/scripts/build-guard-drop-params-mirror.mjs:1-18`) | Does not validate fields/types/relationships |
| Date/time | Strict shared parser (`shared/drop-time.js:143-186`, `shared/drop-time.js:243-301`) | Host-timezone/DST behavior is documented as imperfect (`shared/drop-time.js:26-36`) |
| Normalization | Many aliases/legacy shapes supported (`admin-ui/src/features/drops/drops.data.js:118-223`) | Permissive heuristics can accept ambiguous shapes |
| Collection/network | Registry validation and translation audit | No unified params schema or collection-role policy |
| Pair plan | overlap, signature, expected/actual chain status, pause gating | Happens after load; not a complete pre-save validator |
| Planned supply | positive number if recognizable | No upper bound/semantic distinction from minted/current supply |

**CURRENT STATE.** `drops.data.parse()` supports JSON or JavaScript text by evaluating a transformed string with `new Function` (`admin-ui/src/features/drops/drops.data.js:35-75`). It is not wired to a current file input and must not be reused for untrusted raw editor content.

## Current watcher behavior

**OBSERVED BEHAVIOR.** The watcher:

- uses `fs.watch` on the JS source;
- debounces by 150ms;
- serializes requests with an epoch/in-flight queue;
- waits for the generator before mirroring;
- writes the Admin mirror via temp file + rename and cleans temp on failure (`shared/drop-params/watch-drop-params-json.mjs:20-39`, `shared/drop-params/watch-drop-params-json.mjs:60-120`).

The shared JSON generator uses direct `writeFileSync`, so only the nested mirror currently has an atomic replace (`shared/drop-params/gen-drop-params-json.mjs:34-38`).

## Local write capability

**CURRENT STATE.** Admin is a static Parcel browser application. It has browser file reads for CMS CSV, but no local server endpoint, filesystem API bridge, or Node process reachable from UI. Its only Node writers are build-time scripts (`admin-ui/package.json:6-15`; `admin-ui/scripts/gen-thumbs-manifest.mjs:181-185`). Browser code cannot safely edit `../shared/drop-params/drop-params.js` directly.

**RECOMMENDATION.** A small loopback-only Node orchestration service is appropriate because future authoring also needs controlled local asset writes, generator execution, and journals. Do not add an unrestricted generic file API.

## Recommended editor design

### Structured fields

- Schedule toggle using the existing `dropScheduled` sentinel.
- Drop name and explicit `mirrorNetwork`.
- Strict date/time fields using the shared parser.
- Exactly modeled burn-token rows: allowed collection, enabled, exclusions, burn amount.
- Redeem collection/token, amount, and planned initial supply.
- Derived preview: resolved contracts, active token IDs, burn set, pair count, local title/image, drop instant, and validation results.

### Raw view

Start as read-only generated preview plus before/after unified diff. Raw write should remain preview-only until there is a proven need, syntax highlighting/parser safety, and recovery UX. If writable raw mode is later approved, accept only a data representation validated against the same schema; never evaluate arbitrary JavaScript in the browser/service.

### Save protocol

1. `GET` returns source bytes, parsed model, source hash, Git root/branch/status for the one allowlisted path, and validation.
2. UI edits an in-memory draft and continuously validates.
3. `POST /plan` sends structured data plus expected source hash; service renders deterministic source/JSON previews and diffs without writing.
4. Operator approves the exact plan hash.
5. `POST /apply` re-reads source and rejects concurrent modification if hash changed.
6. Service validates again, writes source atomically, runs the supported generator/mirror flow, then verifies all three representations are structurally equal.
7. Service reports outer and nested Git diffs separately and refreshes Admin state through a deliberate reload/rebuild boundary.
8. Journal records before/after hashes and paths, not secrets.

Saving params is a reversible local write, but it may affect dev/staging behavior immediately through watchers. It therefore needs explicit approval. It does not publish Git or unpause the contract.

## Atomic write and recovery

**RECOMMENDATION.** Generalize the existing temp-and-rename approach:

- resolve the fixed allowlisted source path and reject symlinks/path traversal;
- create a same-directory temp file with restrictive permissions;
- write deterministic UTF-8 bytes, flush/fsync, parse/import the temp candidate, and run semantic validation;
- preserve exact before bytes in the operation journal's ignored runtime area;
- replace atomically where supported; on Windows, handle destination replacement deliberately rather than assuming POSIX rename semantics;
- fsync the directory where supported;
- regenerate outputs, verify equality/hashes, and report any cross-repo mirror change;
- if generation fails after the source replace, restore exact before bytes atomically and verify restoration;
- never auto-stage, commit, stash, reset, checkout, or push.

The supported watcher may also react to the source replacement. The service and watcher need a single-writer/epoch design so duplicate generation is harmless and verification waits for a stable final hash.

## Malformed-config prevention

- Versioned JSON Schema or equivalent structural validator for the exact current shape.
- Semantic checks for one valid network, collection roles, nonnegative integer IDs, positive amounts, bounded supply, one enabled burn strategy if that remains required, valid exclusions, and valid date/time.
- Registry resolution must succeed for selected network/collections.
- Mirror translation must be total where an explicit map is required.
- Selected redeem token must exist and resolve locally before save can be considered ready; a draft may be saved with explicit incomplete status only if product policy permits.
- Preview the exact normalized consumer model and pair plan.
- Never default malformed `dropScheduled` to true in the editor. Current normalizer does so for backward compatibility (`admin-ui/src/features/drops/drops.data.js:353-357`), but an authoring validator should require an explicit boolean.

## Git awareness

**CURRENT STATE.** The workspace's `ticket:diff` script exports whole-repo artifacts and deletes/rewrites prior artifact files (`admin-ui/scripts/export-ticket-diff.ps1:2-29`). It is a review tool, not an editor primitive.

**RECOMMENDATION.** Use read-only, path-scoped Git commands for editor awareness:

- `git status --short -- <path>`;
- `git diff -- <path>`;
- branch/root identity;
- optional diff against `HEAD` and against the source hash loaded into the editor.

Block apply on a concurrent path change unless the user reloads/rebases the draft. Do not require the whole repository to be clean, but display unrelated dirty state and never include it in apply/rollback.

## Security requirements

- Bind only to loopback and refuse non-loopback Host/Origin.
- Use an unguessable per-session capability token and strict origin checks to prevent browser/CSRF abuse.
- Expose fixed domain actions, not arbitrary path/command execution.
- Resolve real paths inside explicit roots; reject junction/symlink escape.
- Do not pass form values through a shell.
- Do not expose environment variables, wallet storage, Webflow tokens, or file contents outside allowed records/config.
- Rate-limit and journal mutation attempts.
- Separate params save from Git commit/push, chain pair writes, token transfers, contract unpause, and publication.

## Verdict

A structured editor plus read-only raw preview is the safest first version. The repository file remains authoritative. A loopback Node helper should implement optimistic concurrency, schema/semantic validation, atomic exact-byte recovery, supported regeneration, cross-repo diff reporting, and a strict no-Git-side-effects policy. Raw writes and automatic Git actions should be deferred.
