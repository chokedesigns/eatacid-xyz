# CMS-IMG-4 HEN thumbnail rollout plan

Network: **Shadownet** (`testnet`)

Resolution: canonical CMS HEN token ID -> authoritative Shadownet mirror ID -> local thumbnail.

This deterministic, read-only plan consumes `docs/webflow-cms-image-audit/CMS-IMG-4.mapping.json` and verifies it against `shared/chain-registry.js`, `admin-ui/src/titles/hen.json`, and current local image bytes. CMS-IMG-3 runtime/journal state is not consumed.

## Deterministic execution batches

- H1 (5): 94684, 103062, 104492, 114368, 125115
- H2 (12): 135460, 141634, 147893, 175592, 200717, 209650, 279300, 369693, 397098, 422822, 455835, 526531

Runtime namespace: `CMS-IMG-4/HEN/testnet`.

Execution flow: plan -> stage-batch -> verify-staged -> **STOP / human authorization** -> publish-batch -> reconcile-published.

| Canonical HEN ID | Network | Lookup ID | CMS item ID | Title | Slug | Locale | Local thumbnail | SHA-256 | Bytes | Dimensions | Format | Confidence | Phase |
|---:|---|---:|---|---|---|---|---|---|---:|---|---|---|---|
| 94684 | Shadownet (`testnet`) | 0 | `67be1933648307936604171f` | PAPER CHASER | `paper-chaser` | `656d1d76a2cda12f26e04687` | `admin-ui/src/thumbs/hen/0.jpg` | `66367a0949f8a64766b8c4a6f1791234c12bfd3f218d18facf96cbd66a8d41a6` | 22396 | 300x375 | jpeg | HIGH | pending |
| 103062 | Shadownet (`testnet`) | 1 | `67be1c9596766e86c3f44837` | HIGH ON HEN | `high-on-hen` | `656d1d76a2cda12f26e04687` | `admin-ui/src/thumbs/hen/1.jpg` | `63ee5a2d2ca129bd8f5dd2ecee319e9a2c942fde0dac99dd85e5ed97f26d02b8` | 28711 | 300x375 | jpeg | HIGH | pending |
| 104492 | Shadownet (`testnet`) | 2 | `67be1d0b778de2c88f67284a` | HEN IS LOVE | `hen-is-love` | `656d1d76a2cda12f26e04687` | `admin-ui/src/thumbs/hen/2.jpg` | `4bb21fd01bf6224bf36bffda941803011b98805040046b8fddc3bce91971ba6a` | 30975 | 300x375 | jpeg | HIGH | pending |
| 114368 | Shadownet (`testnet`) | 3 | `67be1d6120a776c41a179438` | BENT | `bent` | `656d1d76a2cda12f26e04687` | `admin-ui/src/thumbs/hen/3.jpg` | `4f6a23f45fd6ad7652ede1970dd1d10eb19f4664c52a58e40c557722ef04a15f` | 22555 | 300x375 | jpeg | HIGH | pending |
| 125115 | Shadownet (`testnet`) | 4 | `67be1eac2c88aadbcbb1df1c` | HUNGRY | `hungry` | `656d1d76a2cda12f26e04687` | `admin-ui/src/thumbs/hen/4.jpg` | `314d91a0fc2bbe3f2478ab9d787fe824a91695946ff21cbc5e031412f9bd007c` | 28910 | 300x375 | jpeg | HIGH | pending |
| 135460 | Shadownet (`testnet`) | 5 | `67be1f3907c23f2b11fb4d80` | BRAND AWARENESS | `brand-awareness` | `656d1d76a2cda12f26e04687` | `admin-ui/src/thumbs/hen/5.jpg` | `98c57fe13b592f140b44cb37c59e1dd9fa7f1c44c54b6630c412272c4033b0aa` | 33045 | 300x375 | jpeg | HIGH | pending |
| 141634 | Shadownet (`testnet`) | 6 | `67be1ff5711a00ca1a439a4e` | COPY MACHINE | `copy-machine` | `656d1d76a2cda12f26e04687` | `admin-ui/src/thumbs/hen/6.jpg` | `77904dee2e7cd067705d3d2bf7609bff4741774354177a85fdfcd8a35f65fd11` | 23311 | 300x375 | jpeg | HIGH | pending |
| 147893 | Shadownet (`testnet`) | 7 | `67be2049548d8d443e27191f` | FULL | `full` | `656d1d76a2cda12f26e04687` | `admin-ui/src/thumbs/hen/7.jpg` | `54ab1a46fe448095520fe066f1e5991c10fc34e244a88ec8a94274a9ac15dadd` | 29433 | 300x375 | jpeg | HIGH | pending |
| 175592 | Shadownet (`testnet`) | 8 | `67be209a20a776c41a1a7c01` | PROPAGANDA | `propaganda` | `656d1d76a2cda12f26e04687` | `admin-ui/src/thumbs/hen/8.jpg` | `304420b515e4f4889b32bd1f62aef66c8b40eacb32b34896c0c1d068a146b28c` | 27509 | 300x375 | jpeg | HIGH | pending |
| 200717 | Shadownet (`testnet`) | 9 | `67be20ead9d40ca490f1608e` | LENS SHIFT | `lens-shift` | `656d1d76a2cda12f26e04687` | `admin-ui/src/thumbs/hen/9.jpg` | `b1bf219a90ab3feb62fb73f26193f04fb8956564fea34dfd2e74629d2b195203` | 31261 | 300x375 | jpeg | HIGH | pending |
| 209650 | Shadownet (`testnet`) | 10 | `67be2b78735609355454b02e` | FUCK YOU, EAT ACID | `fuck-you-eat-acid` | `656d1d76a2cda12f26e04687` | `admin-ui/src/thumbs/hen/10.jpg` | `579179db9c9e8d411052b6686f83b0111dc00d531bb7cb0c49c4a42ec892d159` | 23109 | 300x375 | jpeg | HIGH | pending |
| 279300 | Shadownet (`testnet`) | 11 | `67be2bbb79255f0416aa1dea` | REPEATER | `repeater` | `656d1d76a2cda12f26e04687` | `admin-ui/src/thumbs/hen/11.jpg` | `5fdfe2c5d6e204535c46104d700fcf1a5aae99cddd179a584fd7bfa0f30cc9c1` | 25265 | 300x375 | jpeg | HIGH | pending |
| 369693 | Shadownet (`testnet`) | 12 | `67be2c0772f70fe2b6133d73` | WAR PAINT | `war-paint` | `656d1d76a2cda12f26e04687` | `admin-ui/src/thumbs/hen/12.jpg` | `03976410d3a908b75c774cdc44d6030cda45f1a469a05666989f33ea65ad790a` | 30526 | 300x375 | jpeg | HIGH | pending |
| 397098 | Shadownet (`testnet`) | 13 | `67be2c70fe1b3497902330fe` | DISORDER | `disorder` | `656d1d76a2cda12f26e04687` | `admin-ui/src/thumbs/hen/13.jpg` | `0230ed6c8f737a8e57674ef1acb3c5f33ab9ba38aef05bee2ef5bc7ad026c7ed` | 29431 | 300x375 | jpeg | HIGH | pending |
| 422822 | Shadownet (`testnet`) | 14 | `67be2cc849f25c380c01e199` | AWKWARD | `awkward` | `656d1d76a2cda12f26e04687` | `admin-ui/src/thumbs/hen/14.jpg` | `ba5f4cf5c116877b21aaf67fe5b8bcf30793a330c9097510becb956932d2d37c` | 20874 | 300x375 | jpeg | HIGH | pending |
| 455835 | Shadownet (`testnet`) | 15 | `67be2ed06004876108b063cc` | PURPLE, NO. 419 | `purple-no-419` | `656d1d76a2cda12f26e04687` | `admin-ui/src/thumbs/hen/15.jpg` | `f5c5cd48f07a3c325569732bd3135ebea021e31a6bd54770ecfa6bc74b6bf03e` | 32970 | 300x375 | jpeg | HIGH | pending |
| 526531 | Shadownet (`testnet`) | 16 | `67be2f200e39e3baf53bcc67` | COMMS TEST v1.4.2 | `comms-test-v1-4-2` | `656d1d76a2cda12f26e04687` | `admin-ui/src/thumbs/hen/16.jpg` | `95a8b01c784eb2d6ea21898431ec08e8845e6ca6f3e0cc9435c768f221fb9f39` | 26806 | 300x375 | jpeg | HIGH | pending |

## File-layout seam

Canonical sparse mainnet thumbnail filenames are not currently materialized. That is a later file-layout concern and does not introduce a mainnet mirror.

## Execution boundary

Generated entirely from repository audit authorities, registry semantics, title authority, and local image bytes. No Webflow request or write was performed.
