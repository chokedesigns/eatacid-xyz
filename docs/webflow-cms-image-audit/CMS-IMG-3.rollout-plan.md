# CMS-IMG-3 direct-map thumbnail rollout plan

This deterministic plan was generated from `docs/webflow-cms-image-audit/CMS-IMG-1.mapping.json`, current local image bytes, and `docs/webflow-cms-image-audit/CMS-IMG-2.completion.json`. Content verification reuses `assets/webflow-cms-image-pilot/cms-image-pilot.mjs`; pilot completion evidence is retained at `assets/webflow-cms-image-pilot/README.md`. The ordering rule is: collection policy order, then numeric CMS token ID ascending, then CMS item ID. The batching rule is: CANAAN starts with exactly 5, then collection-local chunks of at most 13; later collections use collection-local chunks of at most 13.

## Population

- Total audited mappings: 66
- Eligible direct-map mappings (including the completed pilot): 49
- Excluded HEN mappings: 17
- Already migrated: 1
- Remaining CMS-IMG-3 rollout population: 48
- Remaining by collection: CANAAN 30; THE 419 SCRIPT 13; INTRODUCTIONS 5

HEN is explicitly ineligible for this rollout because its sparse mirror mapping belongs to CMS-IMG-4.

## Already complete / skipped

| Batch | Collection | Token | Title | CMS item ID | Slug | Local source | SHA-256 | Dimensions | Status / skip reason |
|---:|---|---:|---|---|---|---|---|---|---|
| — | CANAAN | 1 | I AM BICYCLE | `65a1bf3dc64d193880da0093` | `i-am-bicycle` | `admin-ui/src/thumbs/canaan/1.jpg` | `bdc5527224ff0926202ddbd8696f756bfc9289ade76d577754a9651933a948f9` | 300×375 | already-migrated — CMS-IMG-2 durable completion record: published-verified |

## Exact batches

### B1 — CANAAN (5)

| Batch | Collection | Token | Title | CMS item ID | Slug | Local source | SHA-256 | Dimensions | Status / skip reason |
|---:|---|---:|---|---|---|---|---|---|---|
| 1 | CANAAN | 0 | SERIOUSLY STONED | `65a1bef667f967865601b215` | `seriously-stoned` | `admin-ui/src/thumbs/canaan/0.jpg` | `f75371caa1a0e6d726ce4201464178f6c334877c90d91523c1195b84533735ea` | 300×375 | pending |
| 1 | CANAAN | 2 | THIS VERY MOMENT | `65a1bf5b7d17dc5aea534acf` | `this-very-moment` | `admin-ui/src/thumbs/canaan/2.jpg` | `9c97496b281d4bb5a91119e85995289e3dfb12f8c906b68bb7e733479eb6bf91` | 300×375 | pending |
| 1 | CANAAN | 3 | THE HERO'S JOURNEY | `65a1bf85612e9792b512811e` | `the-heros-journey` | `admin-ui/src/thumbs/canaan/3.jpg` | `94443ef9b2f7b8bce58200281215c6886e0d26af65e70e6edae558fa96d683b7` | 300×375 | pending |
| 1 | CANAAN | 4 | ALIGNMENT PERFECTUS | `65a1bfa583784c8c84d01982` | `alignment-perfectus` | `admin-ui/src/thumbs/canaan/4.jpg` | `0930256cdb61e104013e58ed84edae36c3b54ba5ee75969b16ace2ff937e5117` | 300×375 | pending |
| 1 | CANAAN | 5 | GOOD TIMES | `65a1bfc87dbe94da28b7a98c` | `good-times` | `admin-ui/src/thumbs/canaan/5.jpg` | `14e46ed4d599850dcb523d1278b5cdf17712a87829436e140012963e7adcf7c7` | 300×375 | pending |

### B2 — CANAAN (13)

| Batch | Collection | Token | Title | CMS item ID | Slug | Local source | SHA-256 | Dimensions | Status / skip reason |
|---:|---|---:|---|---|---|---|---|---|---|
| 2 | CANAAN | 6 | ROYALS | `65a1bfe8e5760e9cf81a65ec` | `royals` | `admin-ui/src/thumbs/canaan/6.jpg` | `290dcc03e743b180aa728e63dd12dfeb6299415e06cb46dfe7cb59ebd4ec22d2` | 300×375 | pending |
| 2 | CANAAN | 7 | ALL UP IN IT | `65a1c119847caa5268e2bf38` | `all-up-in-it` | `admin-ui/src/thumbs/canaan/7.jpg` | `4e5d58c166f0f9940f15a61ae97ff808fce3ee988f1b9659093bc8b5aff031e0` | 300×375 | pending |
| 2 | CANAAN | 8 | THE EXPLORER | `65a1c15d83784c8c84d104cc` | `the-explorer` | `admin-ui/src/thumbs/canaan/8.jpg` | `8d4f9623aeeb90fe9d97362ceabb4cee6b969573fcf6574183aad8e988367ea5` | 300×375 | pending |
| 2 | CANAAN | 9 | DENSITY | `65a1c18507efc2af8049a607` | `density` | `admin-ui/src/thumbs/canaan/9.jpg` | `4f3c74f0648d70ed156bc876d2f21de5b6921b569d31fc9af58cbbc47fe66cb9` | 300×375 | pending |
| 2 | CANAAN | 10 | THE PAGE | `65a1c1ae7dbe94da28b89e36` | `the-page` | `admin-ui/src/thumbs/canaan/10.jpg` | `6e77902a1ee09ca28fd54fa30d86bf4d47869124b3f84202531bac7d8754452a` | 300×375 | pending |
| 2 | CANAAN | 11 | YELLOW JACKETS | `65a1c2b93a064c4ad4db3d68` | `yellow-jackets` | `admin-ui/src/thumbs/canaan/11.jpg` | `a51d24643957d57c579f23bf5f40874261a34c3d4f2172e6e0ebb354dd04eafe` | 300×375 | pending |
| 2 | CANAAN | 12 | THE CLASSIC | `65a1c2e6fc7fdb5d377b41c6` | `the-classic` | `admin-ui/src/thumbs/canaan/12.jpg` | `fcf2b2a0d1e7d0fb78534b5bd9c2e107c17318cf3d1f71a1037342d218ed5bb3` | 300×375 | pending |
| 2 | CANAAN | 13 | SELF | `65a1c314e5760e9cf81c2935` | `self` | `admin-ui/src/thumbs/canaan/13.jpg` | `13eede0360faff3bdf7492a0bc20ce4a0390697b426fd405bb151afe99e74765` | 300×375 | pending |
| 2 | CANAAN | 14 | IN BLOOM | `65a1c33d8c1ee331dbe5ea19` | `in-bloom` | `admin-ui/src/thumbs/canaan/14.jpg` | `832a6fc19c8e33b858843600a99f564e408dcdcf9150264863ca1c6f47d3a73d` | 300×375 | pending |
| 2 | CANAAN | 15 | FEEL Ü | `65a1c382b6ff8e5ea08a3db9` | `feel-u` | `admin-ui/src/thumbs/canaan/15.jpg` | `60403c450749d52ada6f89dbb526a98b9ee3377708075e6e1174e1adf685a1ae` | 300×375 | pending |
| 2 | CANAAN | 16 | FYEA 2.0 | `65a1c3b567f9678656043651` | `fyea-2-0` | `admin-ui/src/thumbs/canaan/16.jpg` | `0e7371349d31cb8c1a8166be313ddb1835418090298274675730db9299aac018` | 300×375 | pending |
| 2 | CANAAN | 17 | KINGPIN | `65a1c3d5cae2314a8ac83fb1` | `kingpin` | `admin-ui/src/thumbs/canaan/17.jpg` | `cdc83cef9d1615c01d6702582924796e4ff8a3e9f3165c0aa48f2ed2f96fd768` | 300×375 | pending |
| 2 | CANAAN | 18 | TEK | `65dcff4ce6ba60dec918f46a` | `tek` | `admin-ui/src/thumbs/canaan/18.jpg` | `2fe4ec8769dc20a3968b67ea98ec14d787a5f4077b11aa366a69eb4ab82df010` | 300×375 | pending |

### B3 — CANAAN (12)

| Batch | Collection | Token | Title | CMS item ID | Slug | Local source | SHA-256 | Dimensions | Status / skip reason |
|---:|---|---:|---|---|---|---|---|---|---|
| 3 | CANAAN | 19 | INVERTED KINGPIN | `65dcff9e27226dc26e8b1130` | `inverted-kingpin` | `admin-ui/src/thumbs/canaan/19.jpg` | `17663d56e3913945b8923e5a527ffa0e208e03a208ec30132c6e433c1ccef4d1` | 300×375 | pending |
| 3 | CANAAN | 20 | microDOSR | `65dcffe577389bbb31da21ba` | `microdosr` | `admin-ui/src/thumbs/canaan/20.jpg` | `768278c1a8d10b1596dbe60e823a3c70eb5b079d3f4e4b71d504685a07e2a782` | 300×375 | pending |
| 3 | CANAAN | 21 | FACE MELTER | `65dd0025addade1b7c9e8c32` | `face-melter` | `admin-ui/src/thumbs/canaan/21.jpg` | `d6d4617191b0a88cf5ade81e296f89a396bf0a35bb868133ebe2cd473915ae36` | 300×375 | pending |
| 3 | CANAAN | 22 | BETWEEN TWO WORLDS | `65dd005654c63a120e5649b9` | `between-two-worlds` | `admin-ui/src/thumbs/canaan/22.jpg` | `9403e63873f5cdd0f7f39ccdfc7f7463e4ca5052a30fb08d7647aa4ac1c845a1` | 300×375 | pending |
| 3 | CANAAN | 23 | EVT | `65dd0082eedbb748322e33c1` | `evt` | `admin-ui/src/thumbs/canaan/23.jpg` | `6338a24e0ccce5fcb8581527ae8239bd6cd51d6d61cc6fc2cefb6646c118ce18` | 300×375 | pending |
| 3 | CANAAN | 24 | HONK IF YOU BONK | `65dd00eed55f0c8789540c86` | `honk-if-you-bonk` | `admin-ui/src/thumbs/canaan/24.jpg` | `d39e384b70883bd6dd6d071e5b06a369d885a391c27ee1e31f14d57e135496f5` | 300×375 | pending |
| 3 | CANAAN | 25 | COPY MACHINE GO BRRRRR | `65dd029bf32f19961dfb353f` | `copy-machine-go-brrrrr` | `admin-ui/src/thumbs/canaan/25.jpg` | `de132339265bb3eb821db782a4cf0b7546a37a5360664705947e37ebcfd60a36` | 300×375 | pending |
| 3 | CANAAN | 26 | BLUE | `65dd02d613a6d26ad46296ca` | `blue` | `admin-ui/src/thumbs/canaan/26.jpg` | `fbbbee6d9f47885b010549936e7443f203ecf61a91471d0229971b7a573e70db` | 300×375 | pending |
| 3 | CANAAN | 27 | EAT, PRAY, LSD. | `65dd03455b33e6a25317985c` | `eat-pray-lsd` | `admin-ui/src/thumbs/canaan/27.jpg` | `f6e5874fcaf03b2215c05b3812ea76f92b44b1bd0150edd8d4de176dbca34ae0` | 300×375 | pending |
| 3 | CANAAN | 28 | A WAY BACK HOME | `65dd0373b8e24ee5a59d2956` | `a-way-back-home` | `admin-ui/src/thumbs/canaan/28.jpg` | `3f0355e5f5ae75c06a0198dccd2354677e45b17078020aa2aa3a57bea2f60658` | 300×375 | pending |
| 3 | CANAAN | 29 | SPLINTERED | `6a1a0af1a5e9ac44f04c94d3` | `splintered` | `admin-ui/src/thumbs/canaan/29.jpg` | `52d389cb8749fa9796f23e9c0c3aed92fe77fb93fb02f0983af012d6ccb6a840` | 300×375 | pending |
| 3 | CANAAN | 30 | BD25 | `6a1a0c033b962bc5f194b9b8` | `bd25` | `admin-ui/src/thumbs/canaan/30.jpg` | `701a1d6bbeb7fd5df47bbbe95d8252980e33c5d7e7b22d8b98676a331b3a8883` | 300×375 | pending |

### B4 — THE 419 SCRIPT (13)

| Batch | Collection | Token | Title | CMS item ID | Slug | Local source | SHA-256 | Dimensions | Status / skip reason |
|---:|---|---:|---|---|---|---|---|---|---|
| 4 | THE 419 SCRIPT | 0 | // 01 | `656f8042fafe53839534f2c9` | `01` | `admin-ui/src/thumbs/the_419_script/0.jpg` | `f217000c324cf68dc311b640a5eca8fe50000cacb7d17ce557437063470b5445` | 300×386 | pending |
| 4 | THE 419 SCRIPT | 1 | // 02 | `656f80a3a2351dad65454831` | `02` | `admin-ui/src/thumbs/the_419_script/1.jpg` | `4f411da62786df1a726cd65d9101cdb90b51aeec9d2d447dd5746d6caf7ba921` | 300×386 | pending |
| 4 | THE 419 SCRIPT | 2 | // 03 | `656f80efbed80d5266244eb4` | `03` | `admin-ui/src/thumbs/the_419_script/2.jpg` | `414f0bf914ebfa13bb8f697ce5268c5589a583ed56dc1192b96b0f03c2efea2e` | 300×386 | pending |
| 4 | THE 419 SCRIPT | 3 | // 04 | `656f811bf98f1971052ae289` | `04` | `admin-ui/src/thumbs/the_419_script/3.jpg` | `56a4ebf6a3c5c0f75334e2d987587fc54c4a8859ff1788b87964022d2941b7c0` | 300×386 | pending |
| 4 | THE 419 SCRIPT | 4 | // 05 | `656f815be9e0f0b55fda6ea2` | `05` | `admin-ui/src/thumbs/the_419_script/4.jpg` | `55e572cdc11ab4803d9723ba157c5a0a39b8dd76906807db89568b4956aa61d7` | 300×386 | pending |
| 4 | THE 419 SCRIPT | 5 | // 06 | `656f81c424f6ae7a9375f0d6` | `06` | `admin-ui/src/thumbs/the_419_script/5.jpg` | `f7724b82dab651dc7480d00445e4becce73af7dbba071b063e51c479476ba21a` | 300×386 | pending |
| 4 | THE 419 SCRIPT | 6 | // 07 | `656f81df76153a9b5cee63e8` | `07` | `admin-ui/src/thumbs/the_419_script/6.jpg` | `da251ed81fc8ddb0fc8ecd88fd508341570d5d3498c6c9b7e1397a30220f2823` | 300×386 | pending |
| 4 | THE 419 SCRIPT | 7 | // 08 | `656f81f5c2c1d5213bcfe411` | `08` | `admin-ui/src/thumbs/the_419_script/7.jpg` | `935fa74ba17722bc2413c9ac82b96a10e35db0718f1cdeaa674d879636f1f4d8` | 300×386 | pending |
| 4 | THE 419 SCRIPT | 8 | // 09 | `656f820cecafff42f8b004dc` | `09` | `admin-ui/src/thumbs/the_419_script/8.jpg` | `7c515aaf6c17bfb094bcae3ec0c2a345f01c4420ee5d9f690170a032d08af7c4` | 300×386 | pending |
| 4 | THE 419 SCRIPT | 9 | // 10 | `656f82465d651729c6ef6612` | `10` | `admin-ui/src/thumbs/the_419_script/9.jpg` | `a073303d1fb963c69c180de0d591f5961db1e4dcd3c5cee7370045fa0d05054c` | 300×386 | pending |
| 4 | THE 419 SCRIPT | 10 | // 11 | `656f828d47349dc899a2ff83` | `11` | `admin-ui/src/thumbs/the_419_script/10.jpg` | `0c1c1862e51e398b606662e5c9113108e7214c8463859b00f0e103de15a0b92b` | 300×386 | pending |
| 4 | THE 419 SCRIPT | 11 | // 12 | `656f82a28c2e746cf88890a0` | `12` | `admin-ui/src/thumbs/the_419_script/11.jpg` | `c2c0ce4f01527a337649b5ecc3e9d195cc2d15de1c9bfeac99ba3f8eddff73a2` | 300×386 | pending |
| 4 | THE 419 SCRIPT | 12 | // 13 | `69543cc3e0451cddbf1ffdda` | `13` | `admin-ui/src/thumbs/the_419_script/12.jpg` | `cc0b9d415e119bcefb2640486994b3b3bc940dda3fdf07662c76a11768fc65a9` | 300×386 | pending |

### B5 — INTRODUCTIONS (5)

| Batch | Collection | Token | Title | CMS item ID | Slug | Local source | SHA-256 | Dimensions | Status / skip reason |
|---:|---|---:|---|---|---|---|---|---|---|
| 5 | INTRODUCTIONS | 0 | FIVE // FIVE | `67be340849f25c380c089452` | `five-five` | `admin-ui/src/thumbs/introductions/0.jpg` | `0a565e52342371981752100407f7815ed9635248741e9e2c9bdf6ea2652158f4` | 300×375 | pending |
| 5 | INTRODUCTIONS | 1 | FOUR // FIVE | `67be33ddc98a0659bcb2b379` | `four-five` | `admin-ui/src/thumbs/introductions/1.jpg` | `b800f746d2fe99c20f75a6bc2635bebd2587ea3364f4ebd163174c1d9e204a83` | 300×375 | pending |
| 5 | INTRODUCTIONS | 2 | THREE // FIVE | `67be339fd239775b2a77f4d4` | `three-five` | `admin-ui/src/thumbs/introductions/2.jpg` | `c969f36f1f78491d428d4060b7ddf5c13ac31580f39a8547f21c8806a1f9619c` | 300×375 | pending |
| 5 | INTRODUCTIONS | 3 | TWO // FIVE | `67be3361cc3b2ab001a7e073` | `two-five` | `admin-ui/src/thumbs/introductions/3.jpg` | `dfcc2af064555b34f6856ef78e1241a3bd7faff1fe11d97bf6b9e61cfe789005` | 300×375 | pending |
| 5 | INTRODUCTIONS | 4 | ONE // FIVE | `67be332491b516d49aba0ef0` | `one-five` | `admin-ui/src/thumbs/introductions/4.jpg` | `081ad9c18f926db9c568f39fa19394aa8b461c6310299a841e6c7b597d767479` | 300×375 | pending |

## Safety and publication boundary

Every `stage-batch` invocation rereads current drop parameters and staged/live CMS state before another write is possible. The first invocation saves an immutable pre-write baseline; a resumed invocation must reconcile current state to that original baseline plus known journaled progress. Unexplained drift blocks execution and is never absorbed by refreshing the baseline.

The lifecycle is fresh invocation safety gate → sequential stage and per-item verification → full staged-batch reconciliation → explicit human publish approval → exact-ID batch publish → fresh live CMS reconciliation. Staging never cascades into publication. The future `publish-batch` command requires the named batch, the exact staged-verified item IDs, an exact confirmation string, and no blocked or reconciliation-required item.

Hard stops:

- mapping ambiguity or unsupported collection
- duplicate CMS item, collection/token, or local path
- unexpected CMS identity or missing item
- a planned item is the currently configured active redeem token
- missing, undecodable, or metadata-mismatched local image
- content hash/dimension mismatch
- non-image field or unrelated-item drift
- stale or uncertain journal state requiring reconciliation
- failed content-based staged/live verification
- unknown upload, patch, or publish outcome
- publication response or live-state ambiguity

## Execution boundary

Generated entirely from repository mapping, local image bytes, and durable pilot evidence. No Webflow request or write was performed.
