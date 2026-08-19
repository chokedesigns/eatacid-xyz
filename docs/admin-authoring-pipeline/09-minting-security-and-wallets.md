# Minting, security, and wallets

## Current reality

The repository contains no mint authoring or submission implementation. It does not reveal the operator’s exact current mint tool, metadata pinning path, result shape, or confirmation policy.

Existing public/Admin Tezos writes use Beacon browser-wallet permission and operation requests. They provide useful network/account/operation patterns, but they are not proof that an NFT mint can be built from the same payload or permissions.

The Admin checklist’s token-existence check is not a mint-result verifier. It proves only that a token exists at the queried configured contract/ID.

## V1 mint boundary

V1 deliberately separates three operations.

### 1. Prepare mint data

The authoring pipeline may validate and render:

- intended network and collection policy;
- exact title and edition intent;
- artwork and metadata content hashes;
- creator/recipient and safe non-secret options once established;
- a human-readable summary for the current external mint process.

Preparation does not submit, sign, or prove a mint.

### 2. Submit/sign externally

The operator uses the current/manual mint process. V1 does not hold a private key, construct an unverified production mint operation, or claim that an external handoff succeeded.

### 3. Observe/import/verify result

The pipeline accepts an operation reference or collection/token tuple supported by the actual external flow and independently checks the strongest evidence available, including:

- expected network and collection contract;
- applied operation or authoritative token existence;
- canonical token ID;
- metadata URI/content and intended hashes where the chain/provider representation permits verification;
- creator/recipient, timestamp, or supply where policy requires and evidence supports them;
- freshness/finality under a still-to-be-decided policy.

Insufficient evidence produces unresolved state; it does not unlock identity-dependent generation.

## Eventual mint automation

Mint submission is a later phase, after the current process and contract are documented and tested. A future adapter may:

```text
prepare immutable plan
  -> request explicit wallet/external approval
  -> submit once
  -> capture operation reference
  -> independently observe/reconcile result
```

It must not collapse preparation, wallet approval, submission, and result verification into one “Mint” success callback.

The browser wallet remains the signer. The local service must never request or receive seed phrases/private keys. A wallet callback is not final chain verification.

## Action and approval boundaries

| Action | Risk class | Rule |
|---|---|---|
| Local validation, hashing, plan, chain/Webflow reads | read-only | bounded retry and freshness reporting |
| Canonical/local artifact apply | reversible local write | exact diff, expected hash, atomic recovery |
| Webflow asset/item staging | external staged write | separate approval, exact target, reconcile uncertainty |
| Mint or other chain submission | signing/irreversible write | exact plan shown to wallet; never blind retry |
| CMS publish | go-live write | separate approval after fresh staged verification |
| Drop-param save | local operational configuration | separate exact-diff approval |
| Transfer/pairs/unpause | chain operations/go-live | existing wallet and safety gates; outside authoring |
| Archive/delete/cleanup | destructive external write | separate explicit scope and approval; never automatic recovery |

## Planned local-service boundary

The target architecture uses a narrow loopback-only Node service because browser code cannot safely write the repositories or hold a Webflow token. The service is not implemented.

Required constraints:

- bind only to loopback and validate Host/Origin;
- require an unguessable session capability;
- expose fixed domain actions, never arbitrary paths, shell commands, or a generic Webflow proxy;
- allowlist and realpath-check record, artwork, generated, and config locations;
- reject traversal and symlink/junction escape;
- use optimistic hashes so concurrent user edits are not overwritten;
- never stage, commit, reset, stash, push, or deploy;
- keep wallet signing in the browser/external signer;
- keep Webflow credentials only in process environment;
- redact diagnostics and durable evidence recursively.

## Secrets that must never enter tracked work records or logs

- seed phrases, private keys, signing keys, or recovery phrases;
- Beacon pairing/transport state or signed payloads;
- Webflow bearer/OAuth tokens;
- presigned upload URLs, policies, signatures, and credentials;
- third-party API secrets or local service capability tokens;
- raw environment dumps;
- unnecessary private absolute paths.

## Retry and reconciliation

| Operation | Automatic retry | Required recovery |
|---|---|---|
| TzKT/RPC/Webflow GET | bounded when policy allows | surface stale/unavailable state |
| Deterministic generation before apply | yes | same record hash/tool version |
| Local apply | only after current-hash check | restore exact before bytes on failed transaction |
| Asset create/upload, CMS create/patch | no after uncertain outcome | search/read by deterministic/captured identity and verify state |
| CMS publish | never blindly | re-read exact staged/live item and publication metadata |
| Mint/chain request | never blindly | use operation/account/chain evidence before any new approval |

The uncertain-mutation rule applies even if adding a retry would make the UI feel simpler. Safety logic should be hidden behind clear states, not removed.

## Open mint/security dependencies

- exact current mint tool and result contract;
- approved network/collection/creator permissions;
- artifact and metadata hosting/pinning authority;
- required metadata equivalence checks;
- operation finality policy;
- future wallet/external submission mechanism;
- allowed authoring asset roots and local-service deployment model.

Until resolved, V1 remains external/manual mint plus verified-result import.
