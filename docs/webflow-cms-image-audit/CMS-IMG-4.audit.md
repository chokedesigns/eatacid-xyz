# CMS-IMG-4 HEN thumbnail-mapping audit

Generated: `2026-08-18T21:54:20.414Z`

Mode: **READ-ONLY**. No Webflow writes, asset uploads, CMS patches, publications, commits, merges, or pushes were performed.

## Result

**17/17 HEN testnet mappings are proven with zero ambiguity, duplicates, or gaps.**

HEN canonical/mainnet mapping is **1:1**:

`canonical HEN token ID → same thumbnail token/filename ID`

HEN does not inherently require special token mapping. Special translation applies only to the current `testnet` registry slot, which targets **Shadownet**:

`canonical HEN token ID → explicit Shadownet mirror token ID`

The testnet mirror is an **environment adapter, not the canonical identity model**. Mainnet has an empty mirror and therefore requires no translation.

The current Webflow HEN `token-id` fields contain the canonical/mainnet sparse IDs. They do not contain Shadownet IDs. The exact testnet migration join is therefore:

`current canonical CMS token → explicit Shadownet token → CMS item ID → current local Shadownet-keyed thumbnail`

No mapping was inferred from filename order, CMS order, title order, or numeric proximity.

## Authoritative mapping sources

- `shared/chain-registry.js`: HEN mainnet and Shadownet contracts; the explicit 17-entry `testnet.mirrors.HEN` map; `mainnet.mirrors` is empty.
- `shared/network.js`: public network selection; checked-in default is `testnet`, and this registry slot is labeled Shadownet. An explicit Node/CI `NETWORK` value can override it.
- `admin-ui/src/network.js`: admin default `testnet`, supported `testnet|mainnet` values, persistence key `ea.admin.network`, and registry-derived mirror access.
- `admin-ui/src/utils/hen-ids.js`: HEN translation executes only for `net === "testnet"`; all other networks return the input ID unchanged.
- `shared/drop-params/drop-params.js`: current `mirrorNetwork: "testnet"`.
- `admin-ui/src/titles/hen.json`: the 17 canonical sparse HEN IDs and names.
- `admin-ui/src/thumbs/hen/*.jpg`: current local thumbnail filenames and bytes.
- Fresh authenticated Webflow Data API staged/live reads: collection schema plus all HEN item identities, token IDs, names, slugs, locales, Image values, and flags.

The generated `admin-ui/src/thumbs.manifest.js` is not canonical identity authority. It currently exposes keys `0..16` for both HEN contracts because `admin-ui/scripts/gen-thumbs-manifest.mjs` reuses one physical folder's filename rows for every contract assigned to that folder. That current generated shape must not be generalized into “HEN always needs a special mapping.”

## Current network semantics

- Public checked-in default: `testnet` in `shared/network.js`.
- Admin checked-in default: `testnet` in `admin-ui/src/network.js`; a valid persisted selection can override it at runtime.
- Registry meaning: the `testnet` slot is **Shadownet**, not Tezos Ghostnet.
- HEN mainnet contract: `KT1RJ6PbjHpwc3M5rw5s2Nbmefwbuwbdxton`.
- HEN Shadownet contract: `KT1GnVnQvvb7R6h4EhveBmN17ysaTuGRDoWW`.
- Mainnet rule: `canonical ID → identical thumbnail ID`.
- Testnet rule: `canonical ID → testnet.mirrors.HEN[canonical ID]`.

The checked-in local HEN images are presently named by Shadownet IDs `0.jpg` through `16.jpg`. The canonical/mainnet expected filename is the sparse canonical ID plus `.jpg`, recorded below. Those canonical-named copies are not presently materialized; that is an implementation-layout seam, not a mapping ambiguity.

## Exact testnet migration mapping

- `94684 → 0 → 67be1933648307936604171f → admin-ui/src/thumbs/hen/0.jpg`
- `103062 → 1 → 67be1c9596766e86c3f44837 → admin-ui/src/thumbs/hen/1.jpg`
- `104492 → 2 → 67be1d0b778de2c88f67284a → admin-ui/src/thumbs/hen/2.jpg`
- `114368 → 3 → 67be1d6120a776c41a179438 → admin-ui/src/thumbs/hen/3.jpg`
- `125115 → 4 → 67be1eac2c88aadbcbb1df1c → admin-ui/src/thumbs/hen/4.jpg`
- `135460 → 5 → 67be1f3907c23f2b11fb4d80 → admin-ui/src/thumbs/hen/5.jpg`
- `141634 → 6 → 67be1ff5711a00ca1a439a4e → admin-ui/src/thumbs/hen/6.jpg`
- `147893 → 7 → 67be2049548d8d443e27191f → admin-ui/src/thumbs/hen/7.jpg`
- `175592 → 8 → 67be209a20a776c41a1a7c01 → admin-ui/src/thumbs/hen/8.jpg`
- `200717 → 9 → 67be20ead9d40ca490f1608e → admin-ui/src/thumbs/hen/9.jpg`
- `209650 → 10 → 67be2b78735609355454b02e → admin-ui/src/thumbs/hen/10.jpg`
- `279300 → 11 → 67be2bbb79255f0416aa1dea → admin-ui/src/thumbs/hen/11.jpg`
- `369693 → 12 → 67be2c0772f70fe2b6133d73 → admin-ui/src/thumbs/hen/12.jpg`
- `397098 → 13 → 67be2c70fe1b3497902330fe → admin-ui/src/thumbs/hen/13.jpg`
- `422822 → 14 → 67be2cc849f25c380c01e199 → admin-ui/src/thumbs/hen/14.jpg`
- `455835 → 15 → 67be2ed06004876108b063cc → admin-ui/src/thumbs/hen/15.jpg`
- `526531 → 16 → 67be2f200e39e3baf53bcc67 → admin-ui/src/thumbs/hen/16.jpg`

## Mapping and local-thumbnail proof

Every listed file exists. Each is a valid progressive JPEG (SOF2 / `0xC2`), 300×375 pixels.

| Canonical/mainnet HEN ID | Canonical/mainnet expected filename | Testnet/Shadownet HEN ID | Webflow CMS item ID | Title/name | Slug | Current local thumbnail | Bytes | SHA-256 | Dimensions | Confidence |
|---:|---|---:|---|---|---|---|---:|---|---|---|
| 94684 | `94684.jpg` | 0 | `67be1933648307936604171f` | PAPER CHASER | `paper-chaser` | `admin-ui/src/thumbs/hen/0.jpg` | 22396 | `66367a0949f8a64766b8c4a6f1791234c12bfd3f218d18facf96cbd66a8d41a6` | 300×375 | HIGH |
| 103062 | `103062.jpg` | 1 | `67be1c9596766e86c3f44837` | HIGH ON HEN | `high-on-hen` | `admin-ui/src/thumbs/hen/1.jpg` | 28711 | `63ee5a2d2ca129bd8f5dd2ecee319e9a2c942fde0dac99dd85e5ed97f26d02b8` | 300×375 | HIGH |
| 104492 | `104492.jpg` | 2 | `67be1d0b778de2c88f67284a` | HEN IS LOVE | `hen-is-love` | `admin-ui/src/thumbs/hen/2.jpg` | 30975 | `4bb21fd01bf6224bf36bffda941803011b98805040046b8fddc3bce91971ba6a` | 300×375 | HIGH |
| 114368 | `114368.jpg` | 3 | `67be1d6120a776c41a179438` | BENT | `bent` | `admin-ui/src/thumbs/hen/3.jpg` | 22555 | `4f6a23f45fd6ad7652ede1970dd1d10eb19f4664c52a58e40c557722ef04a15f` | 300×375 | HIGH |
| 125115 | `125115.jpg` | 4 | `67be1eac2c88aadbcbb1df1c` | HUNGRY | `hungry` | `admin-ui/src/thumbs/hen/4.jpg` | 28910 | `314d91a0fc2bbe3f2478ab9d787fe824a91695946ff21cbc5e031412f9bd007c` | 300×375 | HIGH |
| 135460 | `135460.jpg` | 5 | `67be1f3907c23f2b11fb4d80` | BRAND AWARENESS | `brand-awareness` | `admin-ui/src/thumbs/hen/5.jpg` | 33045 | `98c57fe13b592f140b44cb37c59e1dd9fa7f1c44c54b6630c412272c4033b0aa` | 300×375 | HIGH |
| 141634 | `141634.jpg` | 6 | `67be1ff5711a00ca1a439a4e` | COPY MACHINE | `copy-machine` | `admin-ui/src/thumbs/hen/6.jpg` | 23311 | `77904dee2e7cd067705d3d2bf7609bff4741774354177a85fdfcd8a35f65fd11` | 300×375 | HIGH |
| 147893 | `147893.jpg` | 7 | `67be2049548d8d443e27191f` | FULL | `full` | `admin-ui/src/thumbs/hen/7.jpg` | 29433 | `54ab1a46fe448095520fe066f1e5991c10fc34e244a88ec8a94274a9ac15dadd` | 300×375 | HIGH |
| 175592 | `175592.jpg` | 8 | `67be209a20a776c41a1a7c01` | PROPAGANDA | `propaganda` | `admin-ui/src/thumbs/hen/8.jpg` | 27509 | `304420b515e4f4889b32bd1f62aef66c8b40eacb32b34896c0c1d068a146b28c` | 300×375 | HIGH |
| 200717 | `200717.jpg` | 9 | `67be20ead9d40ca490f1608e` | LENS SHIFT | `lens-shift` | `admin-ui/src/thumbs/hen/9.jpg` | 31261 | `b1bf219a90ab3feb62fb73f26193f04fb8956564fea34dfd2e74629d2b195203` | 300×375 | HIGH |
| 209650 | `209650.jpg` | 10 | `67be2b78735609355454b02e` | FUCK YOU, EAT ACID | `fuck-you-eat-acid` | `admin-ui/src/thumbs/hen/10.jpg` | 23109 | `579179db9c9e8d411052b6686f83b0111dc00d531bb7cb0c49c4a42ec892d159` | 300×375 | HIGH |
| 279300 | `279300.jpg` | 11 | `67be2bbb79255f0416aa1dea` | REPEATER | `repeater` | `admin-ui/src/thumbs/hen/11.jpg` | 25265 | `5fdfe2c5d6e204535c46104d700fcf1a5aae99cddd179a584fd7bfa0f30cc9c1` | 300×375 | HIGH |
| 369693 | `369693.jpg` | 12 | `67be2c0772f70fe2b6133d73` | WAR PAINT | `war-paint` | `admin-ui/src/thumbs/hen/12.jpg` | 30526 | `03976410d3a908b75c774cdc44d6030cda45f1a469a05666989f33ea65ad790a` | 300×375 | HIGH |
| 397098 | `397098.jpg` | 13 | `67be2c70fe1b3497902330fe` | DISORDER | `disorder` | `admin-ui/src/thumbs/hen/13.jpg` | 29431 | `0230ed6c8f737a8e57674ef1acb3c5f33ab9ba38aef05bee2ef5bc7ad026c7ed` | 300×375 | HIGH |
| 422822 | `422822.jpg` | 14 | `67be2cc849f25c380c01e199` | AWKWARD | `awkward` | `admin-ui/src/thumbs/hen/14.jpg` | 20874 | `ba5f4cf5c116877b21aaf67fe5b8bcf30793a330c9097510becb956932d2d37c` | 300×375 | HIGH |
| 455835 | `455835.jpg` | 15 | `67be2ed06004876108b063cc` | PURPLE, NO. 419 | `purple-no-419` | `admin-ui/src/thumbs/hen/15.jpg` | 32970 | `f5c5cd48f07a3c325569732bd3135ebea021e31a6bd54770ecfa6bc74b6bf03e` | 300×375 | HIGH |
| 526531 | `526531.jpg` | 16 | `67be2f200e39e3baf53bcc67` | COMMS TEST v1.4.2 | `comms-test-v1-4-2` | `admin-ui/src/thumbs/hen/16.jpg` | 26806 | `95a8b01c784eb2d6ea21898431ec08e8845e6ca6f3e0cc9435c768f221fb9f39` | 300×375 | HIGH |

Source of every mapping: the explicit `shared/chain-registry.js testnet.mirrors.HEN` pair, joined by the fresh Webflow canonical `token-id`; title corroboration comes from `admin-ui/src/titles/hen.json`; thumbnail facts come from the exact local bytes. Filename order, CMS order, title order, and numeric proximity were not used.

## Fresh Webflow HEN state

Target site: EATACID.xyz `656cf42faa2b1a7a1582d9d2` (`staging-eatacid-xyz`).

Collection: HENs `67be12e2583121ead44b79ed`.

Collection fields used:

- Token ID: `24b3148425dbe6d85b7ca8c369fdd733` / `token-id` / Number
- Image: `b4827b58963f8c3df8304a1a1ef693ef` / `image` / Image
- Name: `c1abbe442bde4893e91f83066064f762`
- Slug: `306d657df6af610a63375e7f44661401`

Exactly 17 staged and 17 live items were returned. All staged records equal their live records, all use primary CMS locale `656d1d76a2cda12f26e04687`, and all are non-draft and non-archived.

| Canonical CMS token | CMS item ID | Title/name | Slug | Locale | Current Image field (file ID links to URL) | Draft | Archived | Publication comparison |
|---:|---|---|---|---|---|---|---|---|
| 94684 | `67be1933648307936604171f` | PAPER CHASER | `paper-chaser` | `656d1d76a2cda12f26e04687` | [`67be18520582582f4c09f0e1`](https://cdn.prod.website-files.com/656d1d76a2cda12f26e04688/67be18520582582f4c09f0e1_PAPER_CHASER_01.jpg) | false | false | staged = live |
| 103062 | `67be1c9596766e86c3f44837` | HIGH ON HEN | `high-on-hen` | `656d1d76a2cda12f26e04687` | [`67be19c3b85c39c8af21bfd5`](https://cdn.prod.website-files.com/656d1d76a2cda12f26e04688/67be19c3b85c39c8af21bfd5_HIGH_ON_HEN_01.jpg) | false | false | staged = live |
| 104492 | `67be1d0b778de2c88f67284a` | HEN IS LOVE | `hen-is-love` | `656d1d76a2cda12f26e04687` | [`67be1ce7c609cd50910ea66d`](https://cdn.prod.website-files.com/656d1d76a2cda12f26e04688/67be1ce7c609cd50910ea66d_HEN_IS_LOVE_01.jpg) | false | false | staged = live |
| 114368 | `67be1d6120a776c41a179438` | BENT | `bent` | `656d1d76a2cda12f26e04687` | [`67be1d35cc0b1b942744bf3a`](https://cdn.prod.website-files.com/656d1d76a2cda12f26e04688/67be1d35cc0b1b942744bf3a_BENT_01.jpg) | false | false | staged = live |
| 125115 | `67be1eac2c88aadbcbb1df1c` | HUNGRY | `hungry` | `656d1d76a2cda12f26e04687` | [`67be1e85b85c39c8af2653f3`](https://cdn.prod.website-files.com/656d1d76a2cda12f26e04688/67be1e85b85c39c8af2653f3_HUNGRY_01.jpg) | false | false | staged = live |
| 135460 | `67be1f3907c23f2b11fb4d80` | BRAND AWARENESS | `brand-awareness` | `656d1d76a2cda12f26e04687` | [`67be1f1f1b11b180877e49f4`](https://cdn.prod.website-files.com/656d1d76a2cda12f26e04688/67be1f1f1b11b180877e49f4_BRAND_AWARENESS_01.jpg) | false | false | staged = live |
| 141634 | `67be1ff5711a00ca1a439a4e` | COPY MACHINE | `copy-machine` | `656d1d76a2cda12f26e04687` | [`67be1fd40957a08a8137eab1`](https://cdn.prod.website-files.com/656d1d76a2cda12f26e04688/67be1fd40957a08a8137eab1_COPY_MACHINE_01.jpg) | false | false | staged = live |
| 147893 | `67be2049548d8d443e27191f` | FULL | `full` | `656d1d76a2cda12f26e04687` | [`67be202f80b1053ec89acecc`](https://cdn.prod.website-files.com/656d1d76a2cda12f26e04688/67be202f80b1053ec89acecc_FULL_01.jpg) | false | false | staged = live |
| 175592 | `67be209a20a776c41a1a7c01` | PROPAGANDA | `propaganda` | `656d1d76a2cda12f26e04687` | [`67be20780070f8a93c2dfa7a`](https://cdn.prod.website-files.com/656d1d76a2cda12f26e04688/67be20780070f8a93c2dfa7a_PROPAGANDA_01.jpg) | false | false | staged = live |
| 200717 | `67be20ead9d40ca490f1608e` | LENS SHIFT | `lens-shift` | `656d1d76a2cda12f26e04687` | [`67be20d01501a9a3a2a10c3f`](https://cdn.prod.website-files.com/656d1d76a2cda12f26e04688/67be20d01501a9a3a2a10c3f_LENS%20SHIFT_01.jpg) | false | false | staged = live |
| 209650 | `67be2b78735609355454b02e` | FUCK YOU, EAT ACID | `fuck-you-eat-acid` | `656d1d76a2cda12f26e04687` | [`67be2b5b8c286dc569e2ba75`](https://cdn.prod.website-files.com/656d1d76a2cda12f26e04688/67be2b5b8c286dc569e2ba75_FYEA_01.jpg) | false | false | staged = live |
| 279300 | `67be2bbb79255f0416aa1dea` | REPEATER | `repeater` | `656d1d76a2cda12f26e04687` | [`67be2b985f7202672ded6bdb`](https://cdn.prod.website-files.com/656d1d76a2cda12f26e04688/67be2b985f7202672ded6bdb_REPEATER_01.jpg) | false | false | staged = live |
| 369693 | `67be2c0772f70fe2b6133d73` | WAR PAINT | `war-paint` | `656d1d76a2cda12f26e04687` | [`67be2beafeeec8dc482edd25`](https://cdn.prod.website-files.com/656d1d76a2cda12f26e04688/67be2beafeeec8dc482edd25_WAR_PAINT_01.jpg) | false | false | staged = live |
| 397098 | `67be2c70fe1b3497902330fe` | DISORDER | `disorder` | `656d1d76a2cda12f26e04687` | [`67be2c552dd1b96b75a41b29`](https://cdn.prod.website-files.com/656d1d76a2cda12f26e04688/67be2c552dd1b96b75a41b29_DISORDER_01.jpg) | false | false | staged = live |
| 422822 | `67be2cc849f25c380c01e199` | AWKWARD | `awkward` | `656d1d76a2cda12f26e04687` | [`67be2ca9983834cd4965212f`](https://cdn.prod.website-files.com/656d1d76a2cda12f26e04688/67be2ca9983834cd4965212f_AWKWARD_01.jpg) | false | false | staged = live |
| 455835 | `67be2ed06004876108b063cc` | PURPLE, NO. 419 | `purple-no-419` | `656d1d76a2cda12f26e04687` | [`67be2eb17647c77d217657a9`](https://cdn.prod.website-files.com/656d1d76a2cda12f26e04688/67be2eb17647c77d217657a9_PURPLE_NO_419_01.jpg) | false | false | staged = live |
| 526531 | `67be2f200e39e3baf53bcc67` | COMMS TEST v1.4.2 | `comms-test-v1-4-2` | `656d1d76a2cda12f26e04687` | [`67be2ef4feeec8dc4831a942`](https://cdn.prod.website-files.com/656d1d76a2cda12f26e04688/67be2ef4feeec8dc4831a942_COMMS_TEST_v1.4.2_01.jpg) | false | false | staged = live |

Full Image objects, including `fileId`, `url`, and `alt`, plus publication timestamps are retained in `CMS-IMG-4.mapping.json`.

## Duplicate and gap checks

- Canonical IDs: 17 values / 17 unique.
- Testnet IDs: 17 values / 17 unique; exact complete set `0..16`.
- CMS item IDs: 17 values / 17 unique.
- Current local thumbnails: 17 paths / 17 unique.
- No two canonical IDs map to the same testnet ID.
- No two Webflow items map to the same local thumbnail.
- Every canonical title matches both Webflow `name`/`title` and `admin-ui/src/titles/hen.json`.
- Mainnet mirror: empty; mainnet translation count is zero.
- Ambiguous mappings: 0.
- Gaps: 0.

## CMS-IMG-3 preservation

CMS-IMG-3 runtime state was read but not modified. Existing ignored batch journals and `comparison.published.json` records were compared with fresh authenticated staged/live Webflow reads and current local SHA-256 values.

| Batch | Collection | Published-verified items | Fresh result |
|---|---|---:|---|
| B1 | CANAAN | 5/5 | staged = live; journal Image file ID/URL match; flags and publication metadata clean |
| B2 | CANAAN | 13/13 | staged = live; journal Image file ID/URL match; flags and publication metadata clean |
| B3 | CANAAN | 12/12 | staged = live; journal Image file ID/URL match; flags and publication metadata clean |
| B4 | THE 419 SCRIPT | 13/13 | staged = live; journal Image file ID/URL match; flags and publication metadata clean |
| B5 | INTRODUCTIONS | 5/5 | staged = live; journal Image file ID/URL match; flags and publication metadata clean |

Result: B1, B2, B3, B4, and B5 remain **published-verified** (48/48 batch items). No CMS-IMG-3 runtime file was changed.

## Repository state and limitations

The outer repository started clean on `ticket-CMS-IMG-4-audit-hen-thumbnail-mapping`.

The nested `admin-ui` repository started on `codex` with pre-existing user modifications to:

- `src/drop-params.mirror.json`
- `src/thumbs.manifest.js`

Neither nested file was modified by this audit. The current generated manifest's mainnet HEN `0..16` keys are documented above as a non-authoritative layout seam.

Unresolved mapping ambiguity: **none**.

Implementation note: a future mainnet/canonical file layout should address the absent sparse canonical filenames without introducing a mainnet mirror. That work is outside this read-only audit.

