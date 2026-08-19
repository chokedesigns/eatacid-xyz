# Security, wallet, signing, and trust boundaries

## Existing boundaries

**CURRENT STATE.** Tezos signing is browser-wallet based through Beacon. Both public and Admin code request permissions and operations from the active wallet and do not contain private keys (`shared/beacon-setup.js:431-478`; `admin-ui/src/beacon-setup.js:348-405`). Admin verifies the account network and clears mismatches (`admin-ui/src/beacon-setup.js:310-363`). Network switches clear the active account before persisting/reloading (`admin-ui/src/network.js:63-118`).

**CURRENT STATE.** Admin chain writes are guarded by live storage and admin/account checks. Pause UI reads storage `admin`, blocks non-admin toggle, broadcasts verified/unknown pause state, and does not optimistically claim success (`admin-ui/src/features/pause.js:355-475`). Drop pair sends require verified paused state (`admin-ui/src/features/drops/drops.send.service.js:99-108`).

**CURRENT STATE.** Webflow API access uses a process environment token. The retained CMS client keeps the token out of source control and redacts authorization, token, signature, credential, policy, and presigned-upload fields (`assets/webflow-cms/webflow-cms.mjs`). The retired migration runtime is no longer an active repository workflow.

## Action classification

| Class | Examples | Default approval/retry policy |
|---|---|---|
| READ-ONLY | local record validation, hashes, Git diff, TzKT token/storage/balance/ops, Webflow schema/staged/live reads | No consequential approval; bounded retry; display freshness |
| REVERSIBLE LOCAL WRITE | canonical record, generated title/thumb/config, journal, drop-param source | Exact diff approval; atomic before bytes; optimistic concurrency; no Git stage/commit |
| EXTERNAL STAGED WRITE | Webflow asset upload, staged CMS item create/update | Separate approval; durable journal; reconcile unknown outcomes; no automatic publish/delete |
| SIGNING / CHAIN WRITE | mint, FA2 transfer, pair set, pause/unpause, withdraw, burn/redeem | Wallet approval for exact plan; operation hash capture; never blind retry |
| PUBLISH / GO-LIVE | Webflow item publish, Git deployment/push, contract unpause at/after scheduled time | Separate final approval after fresh verification; smallest explicit target |
| DESTRUCTIVE CLEANUP | CMS item/archive/delete, asset delete, branch/reset/stash cleanup | Separate ticket/approval; never automatic recovery behavior |

## Wallet and mint boundary

**RECOMMENDATION.** The local orchestrator may prepare a mint operation but must not sign. The operator should see and approve the exact network, contract, recipient, quantity, metadata/artifact hashes, and costs. The wallet remains the signing boundary.

Rules:

- never request a seed phrase/private key;
- never introduce a tracked or environment-based local signer by default;
- bind approval to a content/plan hash and expire it on any change;
- capture the returned operation hash before polling;
- verify independently through chain/TzKT;
- on timeout/connection loss after submission, mark unknown and reconcile before any retry;
- do not treat a wallet callback alone as final success.

The same rules apply to Admin transfer/pair/pause operations. Existing request-operation and polling patterns are reusable (`admin-ui/src/escrow-ops.js:219-318`; `admin-ui/src/features/drops/drops.send.service.js:239-279`).

## Webflow boundary

The future service—not browser code—should hold `WEBFLOW_API_TOKEN`. It should expose domain-specific actions such as “plan item,” “stage item,” “verify staged,” and “publish captured item,” never a generic proxy.

Required controls:

- least privilege: site discovery only if needed, CMS/assets read/write for staging, no full-site publish permission;
- fixed expected site and collection IDs from policy, reverified before writes;
- exact item IDs and locale IDs captured from responses;
- one item at a time initially;
- full before snapshots and non-target preservation comparison;
- separate publish confirmation bound to fresh staged verification;
- recursive redaction in logs/errors/journals;
- presigned upload URL treated as a secret and never retained unredacted;
- no automatic orphan asset/item deletion.

The retained Webflow CMS module demonstrates bounded reads, no blind write retry, explicit ambiguous outcomes, redaction, exact-ID publication, and read-only reconciliation (`assets/webflow-cms/webflow-cms.mjs`). Application-level approvals and durable journaling remain work for the Admin pipeline.

## Local filesystem boundary

A browser cannot receive general filesystem authority. The proposed Node helper must:

- bind to loopback only;
- require a per-session capability and enforce Origin/Host;
- expose an explicit allowlist of record, artwork, generated-output, and drop-param paths;
- resolve realpath and reject `..`, absolute user input, symlink/junction escape, devices, and network paths;
- use no user-controlled shell strings;
- enforce expected hashes to prevent overwriting concurrent user work;
- write same-directory temp files, validate, flush, atomically replace, and preserve exact before bytes;
- report cross-repository effects and never stage/commit/stash/reset/checkout;
- limit file sizes/types and image decoding resources;
- avoid serving local source bytes to unrelated browser origins.

## External network/API boundary

Allowlist outbound hosts/actions by adapter:

- configured RPC/TzKT endpoints from the registry for reads/verification;
- approved IPFS gateways for metadata reads;
- Webflow API and returned presigned upload host for explicit staged writes;
- the proven mint/OBJKT endpoint only after a dedicated integration decision.

Do not follow arbitrary URLs from authoring fields. Metadata URI resolution needs protocol/size/time limits and content hashing. Existing Admin IPFS reads use bounded gateway/timeouts but are read-side only (`admin-ui/src/adapters/collection-catalog.js:46-123`; `admin-ui/src/utils/io.js:49-123`).

## Secrets that must never enter tracked files

- wallet seed phrases, private keys, signing keys, recovery phrases;
- Beacon pairing/transport state or signed payloads;
- Webflow bearer/OAuth tokens;
- presigned upload URLs, policies, signatures, credentials;
- third-party API secrets;
- session capability tokens;
- private local absolute paths if journal/docs may be shared;
- raw environment dumps or HTTP authorization headers.

Add secret-pattern checks to journal serialization and pre-commit/CI documentation scans, but do not rely on regex alone. Construct logs from allowlisted fields and use recursive redaction as defense in depth.

## Retry and idempotency matrix

| Operation | Safe automatic retry? | Required key/reconciliation |
|---|---|---|
| TzKT/Webflow GET | Bounded yes | URL/query, timeout, freshness |
| Local deterministic generation before apply | Yes | record hash + tool version |
| Atomic local apply | Only after current-hash check | before/after bytes and plan hash |
| Webflow asset metadata/upload | Not after ambiguous response | deterministic asset name + byte hash; search/read-back |
| CMS staged create/update | Not after ambiguous response | work ID + collection/token + captured item ID; staged re-read |
| CMS publish | Never blind retry | captured item ID + expected staged/live hashes; live re-read |
| Mint/chain request | Never blind retry | operation hash/account/counter/chain query |
| Drop clear/save | New explicit approval if source changed | expected source hash + diff |

## Irreversible versus reversible

- Local source/config writes are reversible if exact before bytes are retained and no concurrent change is overwritten.
- Webflow staged updates are externally reversible only with another API write; newly created items have no natural exact-before state.
- Webflow publication is a go-live action and rollback is another publish.
- Tezos operations, including mint/burn/transfer/pause/pair writes, are irreversible ledger history even if later compensating operations exist.
- Git push/deploy and contract unpause are separate go-live actions; neither should be hidden behind authoring “Complete.”

## Recommended explicit approvals

1. Apply local generated diffs.
2. Submit mint to wallet/external service.
3. Accept verified mint identity if imported manually.
4. Create/upload/update Webflow staged state.
5. Publish the exact CMS item.
6. Save a CANAAN drop-param proposal.
7. Transfer supply and seed pairs through existing wallet flows.
8. Unpause/go live.
9. Clear to NO DROP.

Each approval should summarize only the action it authorizes. “Run pipeline” may advance through read/validate/plan phases, but must pause at every boundary above.

## Security verdict

The safest architecture keeps private signing in the existing browser wallet, Webflow credentials in a loopback service process environment, filesystem writes behind narrow domain endpoints, and all consequential actions separately approved. The existing wallet validation, pause/send gates, and retained CMS redaction/reconciliation primitives are good patterns to reuse. The largest new risks are a local write bridge, ambiguous mint retries, and adding general authoring orchestration without weakening target/preservation checks.
