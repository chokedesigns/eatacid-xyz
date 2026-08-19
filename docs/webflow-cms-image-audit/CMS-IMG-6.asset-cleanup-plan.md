# CMS-IMG-6 Phase A — Webflow asset cleanup plan

This artifact is a strictly read-only proof. It authorizes no deletion or other Webflow mutation. A future Phase B must match the exact manifest fingerprint and receive separate authorization.

## Result

- Migration-related identities inventoried: **132** (66 active CMS identities + 66 migration-library identities).
- Conclusively unreferenced, content-identical duplicates: **65**.
- Exact proposed deletion count: **65**.
- Excluded count: **1**.
- Newly ambiguous assets: **0**.
- Discrepancy from prior 65 + 1 finding: **none**.
- External mutations performed: **0**.
- Deletion-manifest SHA-256: `0eeb04a7b71d1b6bd43b1d5ba4ea5f52fe33c45c09e406b2d51fcba3144cedca`.

Canonicalization: UTF-8 JSON; object keys recursively sorted; deletionManifest array order preserved; no trailing newline.

## Fresh closure revalidation

| Collection | Found | Staged exact | Live exact | Cleanly published | Queued revisions |
|---|---:|---:|---:|---:|---:|
| CANAAN | 31/31 | 31 | 31 | 31 | 0 |
| THE 419 SCRIPT | 13/13 | 13 | 13 | 13 | 0 |
| INTRODUCTIONS | 5/5 | 5 | 5 | 5 | 0 |
| HEN | 17/17 | 17 | 17 | 17 | 0 |

Global closure remains 66/66 staged exact, 66/66 live exact, 66/66 canonical identities preserved, 66/66 non-image fields preserved, 66/66 cleanly published, queued revisions 0, reconciliationRequired 0, and unexpected CMS drift 0. The initial and final fresh-read snapshots, active reference sets, asset populations, and deletion manifests were identical.

## Exact deletion manifest

Every row is a fresh-proven migration-library upload identity that is referenced by neither staged nor live CMS, is byte-exact to the local intended source, has a distinct fresh active CMS identity with the same exact content, and is linked to a published-verified rollout journal with no reconciliation required.

| # | Asset ID | Asset name | Collection | Token | Content SHA-256 | Bytes | Active CMS asset ID | Confidence |
|---:|---|---|---|---:|---|---:|---|---|
| 1 | `6a838687424095d065083a7b` | canaan-0-seriously-stoned-300w-f75371caa1a0.jpg | CANAAN | 0 | `f75371caa1a0e6d726ce4201464178f6c334877c90d91523c1195b84533735ea` | 31022 | `6a838688a858f56137c14c52` | HIGH |
| 2 | `6a83868a424095d065083c92` | canaan-2-this-very-moment-300w-9c97496b281d.jpg | CANAAN | 2 | `9c97496b281d4bb5a91119e85995289e3dfb12f8c906b68bb7e733479eb6bf91` | 26958 | `6a83868b2bd797b89f4c1dd3` | HIGH |
| 3 | `6a83868c35624994e7ece35f` | canaan-3-the-heros-journey-300w-94443ef9b2f7.jpg | CANAAN | 3 | `94443ef9b2f7b8bce58200281215c6886e0d26af65e70e6edae558fa96d683b7` | 34733 | `6a83868d4d9c1cde129c0b54` | HIGH |
| 4 | `6a83868f45bf00f4a9d10baf` | canaan-4-alignment-perfectus-300w-0930256cdb61.jpg | CANAAN | 4 | `0930256cdb61e104013e58ed84edae36c3b54ba5ee75969b16ace2ff937e5117` | 36766 | `6a83868f40a13155d489d88f` | HIGH |
| 5 | `6a83869266444123dc889a26` | canaan-5-good-times-300w-14e46ed4d599.jpg | CANAAN | 5 | `14e46ed4d599850dcb523d1278b5cdf17712a87829436e140012963e7adcf7c7` | 26212 | `6a8386924594f9a80c494d11` | HIGH |
| 6 | `6a8393af816b0366ab00965e` | canaan-6-royals-300w-290dcc03e743.jpg | CANAAN | 6 | `290dcc03e743b180aa728e63dd12dfeb6299415e06cb46dfe7cb59ebd4ec22d2` | 29238 | `6a8393b1891887db99e3c822` | HIGH |
| 7 | `6a8393b5d341a02f48b91e63` | canaan-7-all-up-in-it-300w-4e5d58c166f0.jpg | CANAAN | 7 | `4e5d58c166f0f9940f15a61ae97ff808fce3ee988f1b9659093bc8b5aff031e0` | 44184 | `6a8393b6a590c6540ac8daf4` | HIGH |
| 8 | `6a8393b87a5c22a5e2564c08` | canaan-8-the-explorer-300w-8d4f9623aeeb.jpg | CANAAN | 8 | `8d4f9623aeeb90fe9d97362ceabb4cee6b969573fcf6574183aad8e988367ea5` | 38663 | `6a8393b9e367ac2eff4bf56b` | HIGH |
| 9 | `6a8393bb42171e758591c01f` | canaan-9-density-300w-4f3c74f0648d.jpg | CANAAN | 9 | `4f3c74f0648d70ed156bc876d2f21de5b6921b569d31fc9af58cbbc47fe66cb9` | 32502 | `6a8393bc2f1dcfc025dc698b` | HIGH |
| 10 | `6a8393bf7a5c22a5e2564e2b` | canaan-10-the-page-300w-6e77902a1ee0.jpg | CANAAN | 10 | `6e77902a1ee09ca28fd54fa30d86bf4d47869124b3f84202531bac7d8754452a` | 25392 | `6a8393bf2ae658ab7c4ca05f` | HIGH |
| 11 | `6a8393c15782dd2d98ae732b` | canaan-11-yellow-jackets-300w-a51d24643957.jpg | CANAAN | 11 | `a51d24643957d57c579f23bf5f40874261a34c3d4f2172e6e0ebb354dd04eafe` | 40804 | `6a8393c106bcf103ca65ec4b` | HIGH |
| 12 | `6a8393c4816b0366ab00a169` | canaan-12-the-classic-300w-fcf2b2a0d1e7.jpg | CANAAN | 12 | `fcf2b2a0d1e7d0fb78534b5bd9c2e107c17318cf3d1f71a1037342d218ed5bb3` | 22062 | `6a8393c51b03db9bba719702` | HIGH |
| 13 | `6a8393c7408819b4ee7620ff` | canaan-13-self-300w-13eede0360fa.jpg | CANAAN | 13 | `13eede0360faff3bdf7492a0bc20ce4a0390697b426fd405bb151afe99e74765` | 39644 | `6a8393c7d940828c639124cb` | HIGH |
| 14 | `6a8393cb891887db99e3d671` | canaan-14-in-bloom-300w-832a6fc19c8e.jpg | CANAAN | 14 | `832a6fc19c8e33b858843600a99f564e408dcdcf9150264863ca1c6f47d3a73d` | 23837 | `6a8484e26a2db7aa5e617724` | HIGH |
| 15 | `6a8484e3cc36510848e9bc3c` | canaan-15-feel-u-300w-60403c450749.jpg | CANAAN | 15 | `60403c450749d52ada6f89dbb526a98b9ee3377708075e6e1174e1adf685a1ae` | 17117 | `6a8484e43940eaa8f410866e` | HIGH |
| 16 | `6a8484e6ba8485b2079a9e20` | canaan-16-fyea-2-0-300w-0e7371349d31.jpg | CANAAN | 16 | `0e7371349d31cb8c1a8166be313ddb1835418090298274675730db9299aac018` | 29391 | `6a8484e7e21168cd204e439b` | HIGH |
| 17 | `6a8484e8fcd0a90422eff603` | canaan-17-kingpin-300w-cdc83cef9d16.jpg | CANAAN | 17 | `cdc83cef9d1615c01d6702582924796e4ff8a3e9f3165c0aa48f2ed2f96fd768` | 20134 | `6a8484e9dd884989c6ae51d9` | HIGH |
| 18 | `6a8484ea2de4ad9e5fb378a3` | canaan-18-tek-300w-2fe4ec8769dc.jpg | CANAAN | 18 | `2fe4ec8769dc20a3968b67ea98ec14d787a5f4077b11aa366a69eb4ab82df010` | 31717 | `6a8484eb8ea6e51ef92e7f40` | HIGH |
| 19 | `6a84c5e014eebbf248e37665` | canaan-19-inverted-kingpin-300w-17663d56e391.jpg | CANAAN | 19 | `17663d56e3913945b8923e5a527ffa0e208e03a208ec30132c6e433c1ccef4d1` | 24976 | `6a84c5e1f988e0fa1b3bbbbc` | HIGH |
| 20 | `6a84c5e31527e816e097fb0b` | canaan-20-microdosr-300w-768278c1a8d1.jpg | CANAAN | 20 | `768278c1a8d10b1596dbe60e823a3c70eb5b079d3f4e4b71d504685a07e2a782` | 38831 | `6a84c5e4141a29fa72837d49` | HIGH |
| 21 | `6a84c5e5e06ed58d4d9ccf3e` | canaan-21-face-melter-300w-d6d4617191b0.jpg | CANAAN | 21 | `d6d4617191b0a88cf5ade81e296f89a396bf0a35bb868133ebe2cd473915ae36` | 17514 | `6a84c5e6b3cad8b41402dad2` | HIGH |
| 22 | `6a84c5e7a3c4d63d84e91c26` | canaan-22-between-two-worlds-300w-9403e63873f5.jpg | CANAAN | 22 | `9403e63873f5cdd0f7f39ccdfc7f7463e4ca5052a30fb08d7647aa4ac1c845a1` | 29918 | `6a84c5e879632a8312f1462c` | HIGH |
| 23 | `6a84c5eae06ed58d4d9cd01d` | canaan-23-evt-300w-6338a24e0ccc.jpg | CANAAN | 23 | `6338a24e0ccce5fcb8581527ae8239bd6cd51d6d61cc6fc2cefb6646c118ce18` | 18979 | `6a84c5eaa3c4d63d84e91c80` | HIGH |
| 24 | `6a84c5ecde5e0ac755a0bf8a` | canaan-24-honk-if-you-bonk-300w-d39e384b7088.jpg | CANAAN | 24 | `d39e384b70883bd6dd6d071e5b06a369d885a391c27ee1e31f14d57e135496f5` | 35326 | `6a84c5ed1527e816e097feb8` | HIGH |
| 25 | `6a84c5ee868aabf677c9909d` | canaan-25-copy-machine-go-brrrrr-300w-de132339265b.jpg | CANAAN | 25 | `de132339265bb3eb821db782a4cf0b7546a37a5360664705947e37ebcfd60a36` | 25744 | `6a84c5ef868aabf677c9910d` | HIGH |
| 26 | `6a84c5f1868aabf677c9927f` | canaan-26-blue-300w-fbbbee6d9f47.jpg | CANAAN | 26 | `fbbbee6d9f47885b010549936e7443f203ecf61a91471d0229971b7a573e70db` | 15430 | `6a84c5f2610fa4af7db0febd` | HIGH |
| 27 | `6a84c5f3c6029902a8c523f6` | canaan-27-eat-pray-lsd-300w-f6e5874fcaf0.jpg | CANAAN | 27 | `f6e5874fcaf03b2215c05b3812ea76f92b44b1bd0150edd8d4de176dbca34ae0` | 16183 | `6a84c5f4f988e0fa1b3bc334` | HIGH |
| 28 | `6a84c5f5b3cad8b41402de97` | canaan-28-a-way-back-home-300w-3f0355e5f5ae.jpg | CANAAN | 28 | `3f0355e5f5ae75c06a0198dccd2354677e45b17078020aa2aa3a57bea2f60658` | 17777 | `6a84c5f6f988e0fa1b3bc4a3` | HIGH |
| 29 | `6a84c5f7cd00ce806b6d31b5` | canaan-29-splintered-300w-52d389cb8749.jpg | CANAAN | 29 | `52d389cb8749fa9796f23e9c0c3aed92fe77fb93fb02f0983af012d6ccb6a840` | 25949 | `6a84c5f7f988e0fa1b3bc562` | HIGH |
| 30 | `6a84c5f9e06ed58d4d9cdb65` | canaan-30-bd25-300w-701a1d6bbeb7.jpg | CANAAN | 30 | `701a1d6bbeb7fd5df47bbbe95d8252980e33c5d7e7b22d8b98676a331b3a8883` | 39482 | `6a84c5fa610fa4af7db10244` | HIGH |
| 31 | `6a8488c057437623d950f8e8` | the-419-script-0-01-300w-f217000c324c.jpg | THE 419 SCRIPT | 0 | `f217000c324cf68dc311b640a5eca8fe50000cacb7d17ce557437063470b5445` | 37169 | `6a8488c1818c9feb333a1564` | HIGH |
| 32 | `6a8488c3b911113c649dc167` | the-419-script-1-02-300w-4f411da62786.jpg | THE 419 SCRIPT | 1 | `4f411da62786df1a726cd65d9101cdb90b51aeec9d2d447dd5746d6caf7ba921` | 32282 | `6a8488c4b0db13d153a9581c` | HIGH |
| 33 | `6a8488c6007ba80297fb53c3` | the-419-script-2-03-300w-414f0bf914eb.jpg | THE 419 SCRIPT | 2 | `414f0bf914ebfa13bb8f697ce5268c5589a583ed56dc1192b96b0f03c2efea2e` | 34871 | `6a8488c7b3fd2b07cf54f5d7` | HIGH |
| 34 | `6a8488c8fcd0a90422f134a2` | the-419-script-3-04-300w-56a4ebf6a3c5.jpg | THE 419 SCRIPT | 3 | `56a4ebf6a3c5c0f75334e2d987587fc54c4a8859ff1788b87964022d2941b7c0` | 32639 | `6a8488c9c8a813fd88d7aa15` | HIGH |
| 35 | `6a8488cbb3fd2b07cf54f89c` | the-419-script-4-05-300w-55e572cdc11a.jpg | THE 419 SCRIPT | 4 | `55e572cdc11ab4803d9723ba157c5a0a39b8dd76906807db89568b4956aa61d7` | 33744 | `6a8488cc0eee8f05b3f6e26d` | HIGH |
| 36 | `6a8488cec8a813fd88d7ab70` | the-419-script-5-06-300w-f7724b82dab6.jpg | THE 419 SCRIPT | 5 | `f7724b82dab651dc7480d00445e4becce73af7dbba071b063e51c479476ba21a` | 35924 | `6a8488cf968e3e0663666441` | HIGH |
| 37 | `6a8488d7909e5f3fcb2d8479` | the-419-script-6-07-300w-da251ed81fc8.jpg | THE 419 SCRIPT | 6 | `da251ed81fc8ddb0fc8ecd88fd508341570d5d3498c6c9b7e1397a30220f2823` | 34624 | `6a8488d8d43c895e641d2ba7` | HIGH |
| 38 | `6a8488dbdaf288d38d16c058` | the-419-script-7-08-300w-935fa74ba177.jpg | THE 419 SCRIPT | 7 | `935fa74ba17722bc2413c9ac82b96a10e35db0718f1cdeaa674d879636f1f4d8` | 31638 | `6a8488dbc8a813fd88d7b207` | HIGH |
| 39 | `6a8488ddd43c895e641d2f21` | the-419-script-8-09-300w-7c515aaf6c17.jpg | THE 419 SCRIPT | 8 | `7c515aaf6c17bfb094bcae3ec0c2a345f01c4420ee5d9f690170a032d08af7c4` | 35131 | `6a848eb4fcd0a90422f232ee` | HIGH |
| 40 | `6a848eb60ed1b70d28b2712f` | the-419-script-9-10-300w-a073303d1fb9.jpg | THE 419 SCRIPT | 9 | `a073303d1fb963c69c180de0d591f5961db1e4dcd3c5cee7370045fa0d05054c` | 38022 | `6a848eb80eee8f05b3f93fc9` | HIGH |
| 41 | `6a848eba7a4d8bf1c215950b` | the-419-script-10-11-300w-0c1c1862e51e.jpg | THE 419 SCRIPT | 10 | `0c1c1862e51e398b606662e5c9113108e7214c8463859b00f0e103de15a0b92b` | 28578 | `6a848ebb007ba80297fd8275` | HIGH |
| 42 | `6a848ebd968e3e0663682e0c` | the-419-script-11-12-300w-c2c0ce4f0152.jpg | THE 419 SCRIPT | 11 | `c2c0ce4f01527a337649b5ecc3e9d195cc2d15de1c9bfeac99ba3f8eddff73a2` | 31939 | `6a848ebdda48aa7aaf621e43` | HIGH |
| 43 | `6a848ebfa01de36952885ae0` | the-419-script-12-13-300w-cc0b9d415e11.jpg | THE 419 SCRIPT | 12 | `cc0b9d415e119bcefb2640486994b3b3bc940dda3fdf07662c76a11768fc65a9` | 36366 | `6a848ec1007ba80297fd8428` | HIGH |
| 44 | `6a8494b7a8300819c88b8075` | introductions-0-five-five-300w-0a565e523423.jpg | INTRODUCTIONS | 0 | `0a565e52342371981752100407f7815ed9635248741e9e2c9bdf6ea2652158f4` | 23644 | `6a8494b8ca8c9eb52d09c9ae` | HIGH |
| 45 | `6a8494baa01de369528b68f4` | introductions-1-four-five-300w-b800f746d2fe.jpg | INTRODUCTIONS | 1 | `b800f746d2fe99c20f75a6bc2635bebd2587ea3364f4ebd163174c1d9e204a83` | 22072 | `6a8494ba788e9546ca2592d1` | HIGH |
| 46 | `6a8494bcd43c895e6420207b` | introductions-2-three-five-300w-c969f36f1f78.jpg | INTRODUCTIONS | 2 | `c969f36f1f78491d428d4060b7ddf5c13ac31580f39a8547f21c8806a1f9619c` | 20284 | `6a8494bdcbef68a74d74348b` | HIGH |
| 47 | `6a8494beb260aa09956c054c` | introductions-3-two-five-300w-dfcc2af06455.jpg | INTRODUCTIONS | 3 | `dfcc2af064555b34f6856ef78e1241a3bd7faff1fe11d97bf6b9e61cfe789005` | 23870 | `6a8494bf48665d422d5ea20b` | HIGH |
| 48 | `6a8494c1d43c895e642022d3` | introductions-4-one-five-300w-081ad9c18f92.jpg | INTRODUCTIONS | 4 | `081ad9c18f926db9c568f39fa19394aa8b461c6310299a841e6c7b597d767479` | 21155 | `6a8494c248665d422d5ea4b6` | HIGH |
| 49 | `6a84f7d91f4a60faccb8c505` | hen-94684-paper-chaser-300w-66367a0949f8.jpg | HEN | 94684 | `66367a0949f8a64766b8c4a6f1791234c12bfd3f218d18facf96cbd66a8d41a6` | 22396 | `6a84f7da1c0ce7a02cfc784c` | HIGH |
| 50 | `6a84f7dc15803b16b80ffd03` | hen-103062-high-on-hen-300w-63ee5a2d2ca1.jpg | HEN | 103062 | `63ee5a2d2ca129bd8f5dd2ecee319e9a2c942fde0dac99dd85e5ed97f26d02b8` | 28711 | `6a84f7dd1a28ff3b648b588e` | HIGH |
| 51 | `6a84f7de055c59cb120467ba` | hen-104492-hen-is-love-300w-4bb21fd01bf6.jpg | HEN | 104492 | `4bb21fd01bf6224bf36bffda941803011b98805040046b8fddc3bce91971ba6a` | 30975 | `6a84f7df6dee60a62b1b6bb5` | HIGH |
| 52 | `6a84f7e272b189cf6df21533` | hen-114368-bent-300w-4f6a23f45fd6.jpg | HEN | 114368 | `4f6a23f45fd6ad7652ede1970dd1d10eb19f4664c52a58e40c557722ef04a15f` | 22555 | `6a84f7e2ec5ffad7abcb78a3` | HIGH |
| 53 | `6a84f7e42685dd39487cb1e7` | hen-125115-hungry-300w-314d91a0fc2b.jpg | HEN | 125115 | `314d91a0fc2bbe3f2478ab9d787fe824a91695946ff21cbc5e031412f9bd007c` | 28910 | `6a84f7e450d12066452d9581` | HIGH |
| 54 | `6a84fea008825f0a4f117140` | hen-135460-brand-awareness-300w-98c57fe13b59.jpg | HEN | 135460 | `98c57fe13b592f140b44cb37c59e1dd9fa7f1c44c54b6630c412272c4033b0aa` | 33045 | `6a84fea250d12066452eec6e` | HIGH |
| 55 | `6a84fea350d12066452eecc5` | hen-141634-copy-machine-300w-77904dee2e7c.jpg | HEN | 141634 | `77904dee2e7cd067705d3d2bf7609bff4741774354177a85fdfcd8a35f65fd11` | 23311 | `6a84fea4199c66b2724809fd` | HIGH |
| 56 | `6a84fea508825f0a4f11732f` | hen-147893-full-300w-54ab1a46fe44.jpg | HEN | 147893 | `54ab1a46fe448095520fe066f1e5991c10fc34e244a88ec8a94274a9ac15dadd` | 29433 | `6a84fea650d12066452eedba` | HIGH |
| 57 | `6a84fea7ce0d0af41b5bf958` | hen-175592-propaganda-300w-304420b515e4.jpg | HEN | 175592 | `304420b515e4f4889b32bd1f62aef66c8b40eacb32b34896c0c1d068a146b28c` | 27509 | `6a84fea8cd454fcbfc042aa2` | HIGH |
| 58 | `6a84feaa055c59cb1204ef38` | hen-200717-lens-shift-300w-b1bf219a90ab.jpg | HEN | 200717 | `b1bf219a90ab3feb62fb73f26193f04fb8956564fea34dfd2e74629d2b195203` | 31261 | `6a84feaad3caaa01f07033d8` | HIGH |
| 59 | `6a84feacc94a1e95ba7eb928` | hen-209650-fuck-you-eat-acid-300w-579179db9c9e.jpg | HEN | 209650 | `579179db9c9e8d411052b6686f83b0111dc00d531bb7cb0c49c4a42ec892d159` | 23109 | `6a84feac302fe4f667ddf463` | HIGH |
| 60 | `6a84feaec00e366ed54f52fd` | hen-279300-repeater-300w-5fdfe2c5d6e2.jpg | HEN | 279300 | `5fdfe2c5d6e204535c46104d700fcf1a5aae99cddd179a584fd7bfa0f30cc9c1` | 25265 | `6a84feae1c0ce7a02cffcfba` | HIGH |
| 61 | `6a84feb0271ce561b0f767b0` | hen-369693-war-paint-300w-03976410d3a9.jpg | HEN | 369693 | `03976410d3a908b75c774cdc44d6030cda45f1a469a05666989f33ea65ad790a` | 30526 | `6a84feb144d629bbc127ea94` | HIGH |
| 62 | `6a84feb3c94a1e95ba7ebaa9` | hen-397098-disorder-300w-0230ed6c8f73.jpg | HEN | 397098 | `0230ed6c8f737a8e57674ef1acb3c5f33ab9ba38aef05bee2ef5bc7ad026c7ed` | 29431 | `6a8502a4cffc1cd9c77a3641` | HIGH |
| 63 | `6a8502a62b9c135f85cb3fe2` | hen-422822-awkward-300w-ba5f4cf5c116.jpg | HEN | 422822 | `ba5f4cf5c116877b21aaf67fe5b8bcf30793a330c9097510becb956932d2d37c` | 20874 | `6a8502a7d22fc5555334056f` | HIGH |
| 64 | `6a8502a9451fde685b719b99` | hen-455835-purple-no-419-300w-f5c5cd48f07a.jpg | HEN | 455835 | `f5c5cd48f07a3c325569732bd3135ebea021e31a6bd54770ecfa6bc74b6bf03e` | 32970 | `6a8502a927dac1c7f134e728` | HIGH |
| 65 | `6a8502ab41be15308b0a7d9e` | hen-526531-comms-test-v1-4-2-300w-95a8b01c784e.jpg | HEN | 526531 | `95a8b01c784eb2d6ea21898431ec08e8845e6ca6f3e0cc9435c768f221fb9f39` | 26806 | `6a8502ac779751e909e00649` | HIGH |

## Excluded assets

| Asset ID | Asset name | Collection | Token | Disposition | Reason |
|---|---|---|---:|---|---|
| `6a75027d6dc3be886de27b3e` | canaan-1-i-am-bicycle-300w-bdc5527224ff.jpg | CANAAN | 1 | KEEP — AMBIGUOUS | CANAAN token-1 pilot is a hard deletion exclusion for Phase B. No retained pilot journal links the asset-library source identity to the CMS-normalized active identity, and deletion dependency was not mutation-tested. |

### CANAAN token-1 pilot

- Active CMS image identity: `6a750ded9c0200db0e8e4466`.
- Historical/pilot asset identity: `6a75027d6dc3be886de27b3e`.
- Disposition: **KEEP — AMBIGUOUS**.
- Reason: CANAAN token-1 pilot is a hard deletion exclusion for Phase B. No retained pilot journal links the asset-library source identity to the CMS-normalized active identity, and deletion dependency was not mutation-tested.
- Excluded from all Phase B authorized cleanup candidates: **yes**.

## Interrupted and reconciled operation checks

The following rows retain failed/blocked history. Fresh CMS reference checks distinguish the active CMS-normalized identity from the historical migration upload identity.

| Collection | Token | CMS item ID | Historical upload ID | Current active ID | Journal | Failed/blocked attempts |
|---|---:|---|---|---|---|---:|
| CANAAN | 14 | `65a1c33d8c1ee331dbe5ea19` | `6a8393cb891887db99e3d671` | `6a8484e26a2db7aa5e617724` | `assets/webflow-cms-image-rollout/runtime/B2/journal.json` | 1 |
| CANAAN | 29 | `6a1a0af1a5e9ac44f04c94d3` | `6a84c5f7cd00ce806b6d31b5` | `6a84c5f7f988e0fa1b3bc562` | `assets/webflow-cms-image-rollout/runtime/B3/journal.json` | 1 |
| THE 419 SCRIPT | 8 | `656f820cecafff42f8b004dc` | `6a8488ddd43c895e641d2f21` | `6a848eb4fcd0a90422f232ee` | `assets/webflow-cms-image-rollout/runtime/B4/journal.json` | 1 |
| HEN | 397098 | `67be2c70fe1b3497902330fe` | `6a84feb3c94a1e95ba7ebaa9` | `6a8502a4cffc1cd9c77a3641` | `assets/webflow-cms-image-rollout/runtime/CMS-IMG-4/HEN/testnet/H2/journal.json` | 1 |

## Pre-deletion snapshot

Snapshot SHA-256: `9db49e8e1e75c15593dfce7b7232884b1f207219c4f462ca786299244cd488b3`

Active reference-set SHA-256: `2b93a76d61fbedd4b7e64bb3ac357954c7fa3298965da4ae2934d3c95559833e`

| Collection | Token | CMS item ID | Staged Image ID | Live Image ID | Source SHA-256 | Last published |
|---|---:|---|---|---|---|---|
| CANAAN | 0 | `65a1bef667f967865601b215` | `6a838688a858f56137c14c52` | `6a838688a858f56137c14c52` | `f75371caa1a0e6d726ce4201464178f6c334877c90d91523c1195b84533735ea` | 2026-08-19T16:56:57.487Z |
| CANAAN | 1 | `65a1bf3dc64d193880da0093` | `6a750ded9c0200db0e8e4466` | `6a750ded9c0200db0e8e4466` | `bdc5527224ff0926202ddbd8696f756bfc9289ade76d577754a9651933a948f9` | 2026-08-17T22:34:36.922Z |
| CANAAN | 2 | `65a1bf5b7d17dc5aea534acf` | `6a83868b2bd797b89f4c1dd3` | `6a83868b2bd797b89f4c1dd3` | `9c97496b281d4bb5a91119e85995289e3dfb12f8c906b68bb7e733479eb6bf91` | 2026-08-19T16:56:57.540Z |
| CANAAN | 3 | `65a1bf85612e9792b512811e` | `6a83868d4d9c1cde129c0b54` | `6a83868d4d9c1cde129c0b54` | `94443ef9b2f7b8bce58200281215c6886e0d26af65e70e6edae558fa96d683b7` | 2026-08-19T16:56:57.459Z |
| CANAAN | 4 | `65a1bfa583784c8c84d01982` | `6a83868f40a13155d489d88f` | `6a83868f40a13155d489d88f` | `0930256cdb61e104013e58ed84edae36c3b54ba5ee75969b16ace2ff937e5117` | 2026-08-19T16:56:57.415Z |
| CANAAN | 5 | `65a1bfc87dbe94da28b7a98c` | `6a8386924594f9a80c494d11` | `6a8386924594f9a80c494d11` | `14e46ed4d599850dcb523d1278b5cdf17712a87829436e140012963e7adcf7c7` | 2026-08-19T16:56:57.536Z |
| CANAAN | 6 | `65a1bfe8e5760e9cf81a65ec` | `6a8393b1891887db99e3c822` | `6a8393b1891887db99e3c822` | `290dcc03e743b180aa728e63dd12dfeb6299415e06cb46dfe7cb59ebd4ec22d2` | 2026-08-19T16:56:57.532Z |
| CANAAN | 7 | `65a1c119847caa5268e2bf38` | `6a8393b6a590c6540ac8daf4` | `6a8393b6a590c6540ac8daf4` | `4e5d58c166f0f9940f15a61ae97ff808fce3ee988f1b9659093bc8b5aff031e0` | 2026-08-19T16:56:57.542Z |
| CANAAN | 8 | `65a1c15d83784c8c84d104cc` | `6a8393b9e367ac2eff4bf56b` | `6a8393b9e367ac2eff4bf56b` | `8d4f9623aeeb90fe9d97362ceabb4cee6b969573fcf6574183aad8e988367ea5` | 2026-08-19T16:56:57.559Z |
| CANAAN | 9 | `65a1c18507efc2af8049a607` | `6a8393bc2f1dcfc025dc698b` | `6a8393bc2f1dcfc025dc698b` | `4f3c74f0648d70ed156bc876d2f21de5b6921b569d31fc9af58cbbc47fe66cb9` | 2026-08-19T16:56:57.557Z |
| CANAAN | 10 | `65a1c1ae7dbe94da28b89e36` | `6a8393bf2ae658ab7c4ca05f` | `6a8393bf2ae658ab7c4ca05f` | `6e77902a1ee09ca28fd54fa30d86bf4d47869124b3f84202531bac7d8754452a` | 2026-08-19T16:56:57.455Z |
| CANAAN | 11 | `65a1c2b93a064c4ad4db3d68` | `6a8393c106bcf103ca65ec4b` | `6a8393c106bcf103ca65ec4b` | `a51d24643957d57c579f23bf5f40874261a34c3d4f2172e6e0ebb354dd04eafe` | 2026-08-19T16:56:57.538Z |
| CANAAN | 12 | `65a1c2e6fc7fdb5d377b41c6` | `6a8393c51b03db9bba719702` | `6a8393c51b03db9bba719702` | `fcf2b2a0d1e7d0fb78534b5bd9c2e107c17318cf3d1f71a1037342d218ed5bb3` | 2026-08-19T16:56:57.544Z |
| CANAAN | 13 | `65a1c314e5760e9cf81c2935` | `6a8393c7d940828c639124cb` | `6a8393c7d940828c639124cb` | `13eede0360faff3bdf7492a0bc20ce4a0390697b426fd405bb151afe99e74765` | 2026-08-19T16:56:57.604Z |
| CANAAN | 14 | `65a1c33d8c1ee331dbe5ea19` | `6a8484e26a2db7aa5e617724` | `6a8484e26a2db7aa5e617724` | `832a6fc19c8e33b858843600a99f564e408dcdcf9150264863ca1c6f47d3a73d` | 2026-08-19T16:56:57.461Z |
| CANAAN | 15 | `65a1c382b6ff8e5ea08a3db9` | `6a8484e43940eaa8f410866e` | `6a8484e43940eaa8f410866e` | `60403c450749d52ada6f89dbb526a98b9ee3377708075e6e1174e1adf685a1ae` | 2026-08-19T16:56:57.530Z |
| CANAAN | 16 | `65a1c3b567f9678656043651` | `6a8484e7e21168cd204e439b` | `6a8484e7e21168cd204e439b` | `0e7371349d31cb8c1a8166be313ddb1835418090298274675730db9299aac018` | 2026-08-19T16:56:57.418Z |
| CANAAN | 17 | `65a1c3d5cae2314a8ac83fb1` | `6a8484e9dd884989c6ae51d9` | `6a8484e9dd884989c6ae51d9` | `cdc83cef9d1615c01d6702582924796e4ff8a3e9f3165c0aa48f2ed2f96fd768` | 2026-08-19T16:56:57.422Z |
| CANAAN | 18 | `65dcff4ce6ba60dec918f46a` | `6a8484eb8ea6e51ef92e7f40` | `6a8484eb8ea6e51ef92e7f40` | `2fe4ec8769dc20a3968b67ea98ec14d787a5f4077b11aa366a69eb4ab82df010` | 2026-08-19T16:56:57.457Z |
| CANAAN | 19 | `65dcff9e27226dc26e8b1130` | `6a84c5e1f988e0fa1b3bbbbc` | `6a84c5e1f988e0fa1b3bbbbc` | `17663d56e3913945b8923e5a527ffa0e208e03a208ec30132c6e433c1ccef4d1` | 2026-08-19T16:56:57.485Z |
| CANAAN | 20 | `65dcffe577389bbb31da21ba` | `6a84c5e4141a29fa72837d49` | `6a84c5e4141a29fa72837d49` | `768278c1a8d10b1596dbe60e823a3c70eb5b079d3f4e4b71d504685a07e2a782` | 2026-08-19T16:56:57.463Z |
| CANAAN | 21 | `65dd0025addade1b7c9e8c32` | `6a84c5e6b3cad8b41402dad2` | `6a84c5e6b3cad8b41402dad2` | `d6d4617191b0a88cf5ade81e296f89a396bf0a35bb868133ebe2cd473915ae36` | 2026-08-19T16:56:57.427Z |
| CANAAN | 22 | `65dd005654c63a120e5649b9` | `6a84c5e879632a8312f1462c` | `6a84c5e879632a8312f1462c` | `9403e63873f5cdd0f7f39ccdfc7f7463e4ca5052a30fb08d7647aa4ac1c845a1` | 2026-08-19T16:56:57.467Z |
| CANAAN | 23 | `65dd0082eedbb748322e33c1` | `6a84c5eaa3c4d63d84e91c80` | `6a84c5eaa3c4d63d84e91c80` | `6338a24e0ccce5fcb8581527ae8239bd6cd51d6d61cc6fc2cefb6646c118ce18` | 2026-08-19T16:56:57.420Z |
| CANAAN | 24 | `65dd00eed55f0c8789540c86` | `6a84c5ed1527e816e097feb8` | `6a84c5ed1527e816e097feb8` | `d39e384b70883bd6dd6d071e5b06a369d885a391c27ee1e31f14d57e135496f5` | 2026-08-19T16:56:57.465Z |
| CANAAN | 25 | `65dd029bf32f19961dfb353f` | `6a84c5ef868aabf677c9910d` | `6a84c5ef868aabf677c9910d` | `de132339265bb3eb821db782a4cf0b7546a37a5360664705947e37ebcfd60a36` | 2026-08-19T16:56:57.423Z |
| CANAAN | 26 | `65dd02d613a6d26ad46296ca` | `6a84c5f2610fa4af7db0febd` | `6a84c5f2610fa4af7db0febd` | `fbbbee6d9f47885b010549936e7443f203ecf61a91471d0229971b7a573e70db` | 2026-08-19T16:56:57.606Z |
| CANAAN | 27 | `65dd03455b33e6a25317985c` | `6a84c5f4f988e0fa1b3bc334` | `6a84c5f4f988e0fa1b3bc334` | `f6e5874fcaf03b2215c05b3812ea76f92b44b1bd0150edd8d4de176dbca34ae0` | 2026-08-19T16:56:57.600Z |
| CANAAN | 28 | `65dd0373b8e24ee5a59d2956` | `6a84c5f6f988e0fa1b3bc4a3` | `6a84c5f6f988e0fa1b3bc4a3` | `3f0355e5f5ae75c06a0198dccd2354677e45b17078020aa2aa3a57bea2f60658` | 2026-08-19T16:56:57.425Z |
| CANAAN | 29 | `6a1a0af1a5e9ac44f04c94d3` | `6a84c5f7f988e0fa1b3bc562` | `6a84c5f7f988e0fa1b3bc562` | `52d389cb8749fa9796f23e9c0c3aed92fe77fb93fb02f0983af012d6ccb6a840` | 2026-08-19T16:56:57.452Z |
| CANAAN | 30 | `6a1a0c033b962bc5f194b9b8` | `6a84c5fa610fa4af7db10244` | `6a84c5fa610fa4af7db10244` | `701a1d6bbeb7fd5df47bbbe95d8252980e33c5d7e7b22d8b98676a331b3a8883` | 2026-08-19T16:56:57.534Z |
| THE 419 SCRIPT | 0 | `656f8042fafe53839534f2c9` | `6a8488c1818c9feb333a1564` | `6a8488c1818c9feb333a1564` | `f217000c324cf68dc311b640a5eca8fe50000cacb7d17ce557437063470b5445` | 2026-08-18T17:09:51.386Z |
| THE 419 SCRIPT | 1 | `656f80a3a2351dad65454831` | `6a8488c4b0db13d153a9581c` | `6a8488c4b0db13d153a9581c` | `4f411da62786df1a726cd65d9101cdb90b51aeec9d2d447dd5746d6caf7ba921` | 2026-08-18T17:09:51.390Z |
| THE 419 SCRIPT | 2 | `656f80efbed80d5266244eb4` | `6a8488c7b3fd2b07cf54f5d7` | `6a8488c7b3fd2b07cf54f5d7` | `414f0bf914ebfa13bb8f697ce5268c5589a583ed56dc1192b96b0f03c2efea2e` | 2026-08-18T17:09:51.395Z |
| THE 419 SCRIPT | 3 | `656f811bf98f1971052ae289` | `6a8488c9c8a813fd88d7aa15` | `6a8488c9c8a813fd88d7aa15` | `56a4ebf6a3c5c0f75334e2d987587fc54c4a8859ff1788b87964022d2941b7c0` | 2026-08-18T17:09:51.398Z |
| THE 419 SCRIPT | 4 | `656f815be9e0f0b55fda6ea2` | `6a8488cc0eee8f05b3f6e26d` | `6a8488cc0eee8f05b3f6e26d` | `55e572cdc11ab4803d9723ba157c5a0a39b8dd76906807db89568b4956aa61d7` | 2026-08-18T17:09:51.396Z |
| THE 419 SCRIPT | 5 | `656f81c424f6ae7a9375f0d6` | `6a8488cf968e3e0663666441` | `6a8488cf968e3e0663666441` | `f7724b82dab651dc7480d00445e4becce73af7dbba071b063e51c479476ba21a` | 2026-08-18T17:09:51.402Z |
| THE 419 SCRIPT | 6 | `656f81df76153a9b5cee63e8` | `6a8488d8d43c895e641d2ba7` | `6a8488d8d43c895e641d2ba7` | `da251ed81fc8ddb0fc8ecd88fd508341570d5d3498c6c9b7e1397a30220f2823` | 2026-08-18T17:09:51.415Z |
| THE 419 SCRIPT | 7 | `656f81f5c2c1d5213bcfe411` | `6a8488dbc8a813fd88d7b207` | `6a8488dbc8a813fd88d7b207` | `935fa74ba17722bc2413c9ac82b96a10e35db0718f1cdeaa674d879636f1f4d8` | 2026-08-18T17:09:51.417Z |
| THE 419 SCRIPT | 8 | `656f820cecafff42f8b004dc` | `6a848eb4fcd0a90422f232ee` | `6a848eb4fcd0a90422f232ee` | `7c515aaf6c17bfb094bcae3ec0c2a345f01c4420ee5d9f690170a032d08af7c4` | 2026-08-18T17:09:51.393Z |
| THE 419 SCRIPT | 9 | `656f82465d651729c6ef6612` | `6a848eb80eee8f05b3f93fc9` | `6a848eb80eee8f05b3f93fc9` | `a073303d1fb963c69c180de0d591f5961db1e4dcd3c5cee7370045fa0d05054c` | 2026-08-18T17:09:51.400Z |
| THE 419 SCRIPT | 10 | `656f828d47349dc899a2ff83` | `6a848ebb007ba80297fd8275` | `6a848ebb007ba80297fd8275` | `0c1c1862e51e398b606662e5c9113108e7214c8463859b00f0e103de15a0b92b` | 2026-08-18T17:09:51.388Z |
| THE 419 SCRIPT | 11 | `656f82a28c2e746cf88890a0` | `6a848ebdda48aa7aaf621e43` | `6a848ebdda48aa7aaf621e43` | `c2c0ce4f01527a337649b5ecc3e9d195cc2d15de1c9bfeac99ba3f8eddff73a2` | 2026-08-18T17:09:51.391Z |
| THE 419 SCRIPT | 12 | `69543cc3e0451cddbf1ffdda` | `6a848ec1007ba80297fd8428` | `6a848ec1007ba80297fd8428` | `cc0b9d415e119bcefb2640486994b3b3bc940dda3fdf07662c76a11768fc65a9` | 2026-08-18T17:09:51.418Z |
| INTRODUCTIONS | 0 | `67be340849f25c380c089452` | `6a8494b8ca8c9eb52d09c9ae` | `6a8494b8ca8c9eb52d09c9ae` | `0a565e52342371981752100407f7815ed9635248741e9e2c9bdf6ea2652158f4` | 2026-08-18T17:29:33.473Z |
| INTRODUCTIONS | 1 | `67be33ddc98a0659bcb2b379` | `6a8494ba788e9546ca2592d1` | `6a8494ba788e9546ca2592d1` | `b800f746d2fe99c20f75a6bc2635bebd2587ea3364f4ebd163174c1d9e204a83` | 2026-08-18T17:29:33.476Z |
| INTRODUCTIONS | 2 | `67be339fd239775b2a77f4d4` | `6a8494bdcbef68a74d74348b` | `6a8494bdcbef68a74d74348b` | `c969f36f1f78491d428d4060b7ddf5c13ac31580f39a8547f21c8806a1f9619c` | 2026-08-18T17:29:33.478Z |
| INTRODUCTIONS | 3 | `67be3361cc3b2ab001a7e073` | `6a8494bf48665d422d5ea20b` | `6a8494bf48665d422d5ea20b` | `dfcc2af064555b34f6856ef78e1241a3bd7faff1fe11d97bf6b9e61cfe789005` | 2026-08-18T17:29:33.479Z |
| INTRODUCTIONS | 4 | `67be332491b516d49aba0ef0` | `6a8494c248665d422d5ea4b6` | `6a8494c248665d422d5ea4b6` | `081ad9c18f926db9c568f39fa19394aa8b461c6310299a841e6c7b597d767479` | 2026-08-18T17:29:33.483Z |
| HEN | 94684 | `67be1933648307936604171f` | `6a84f7da1c0ce7a02cfc784c` | `6a84f7da1c0ce7a02cfc784c` | `66367a0949f8a64766b8c4a6f1791234c12bfd3f218d18facf96cbd66a8d41a6` | 2026-08-19T00:38:13.127Z |
| HEN | 103062 | `67be1c9596766e86c3f44837` | `6a84f7dd1a28ff3b648b588e` | `6a84f7dd1a28ff3b648b588e` | `63ee5a2d2ca129bd8f5dd2ecee319e9a2c942fde0dac99dd85e5ed97f26d02b8` | 2026-08-19T00:38:13.126Z |
| HEN | 104492 | `67be1d0b778de2c88f67284a` | `6a84f7df6dee60a62b1b6bb5` | `6a84f7df6dee60a62b1b6bb5` | `4bb21fd01bf6224bf36bffda941803011b98805040046b8fddc3bce91971ba6a` | 2026-08-19T00:38:13.131Z |
| HEN | 114368 | `67be1d6120a776c41a179438` | `6a84f7e2ec5ffad7abcb78a3` | `6a84f7e2ec5ffad7abcb78a3` | `4f6a23f45fd6ad7652ede1970dd1d10eb19f4664c52a58e40c557722ef04a15f` | 2026-08-19T00:38:13.129Z |
| HEN | 125115 | `67be1eac2c88aadbcbb1df1c` | `6a84f7e450d12066452d9581` | `6a84f7e450d12066452d9581` | `314d91a0fc2bbe3f2478ab9d787fe824a91695946ff21cbc5e031412f9bd007c` | 2026-08-19T00:38:13.133Z |
| HEN | 135460 | `67be1f3907c23f2b11fb4d80` | `6a84fea250d12066452eec6e` | `6a84fea250d12066452eec6e` | `98c57fe13b592f140b44cb37c59e1dd9fa7f1c44c54b6630c412272c4033b0aa` | 2026-08-19T01:20:18.152Z |
| HEN | 141634 | `67be1ff5711a00ca1a439a4e` | `6a84fea4199c66b2724809fd` | `6a84fea4199c66b2724809fd` | `77904dee2e7cd067705d3d2bf7609bff4741774354177a85fdfcd8a35f65fd11` | 2026-08-19T01:20:18.162Z |
| HEN | 147893 | `67be2049548d8d443e27191f` | `6a84fea650d12066452eedba` | `6a84fea650d12066452eedba` | `54ab1a46fe448095520fe066f1e5991c10fc34e244a88ec8a94274a9ac15dadd` | 2026-08-19T01:20:18.154Z |
| HEN | 175592 | `67be209a20a776c41a1a7c01` | `6a84fea8cd454fcbfc042aa2` | `6a84fea8cd454fcbfc042aa2` | `304420b515e4f4889b32bd1f62aef66c8b40eacb32b34896c0c1d068a146b28c` | 2026-08-19T01:20:18.157Z |
| HEN | 200717 | `67be20ead9d40ca490f1608e` | `6a84feaad3caaa01f07033d8` | `6a84feaad3caaa01f07033d8` | `b1bf219a90ab3feb62fb73f26193f04fb8956564fea34dfd2e74629d2b195203` | 2026-08-19T01:20:18.180Z |
| HEN | 209650 | `67be2b78735609355454b02e` | `6a84feac302fe4f667ddf463` | `6a84feac302fe4f667ddf463` | `579179db9c9e8d411052b6686f83b0111dc00d531bb7cb0c49c4a42ec892d159` | 2026-08-19T01:20:18.181Z |
| HEN | 279300 | `67be2bbb79255f0416aa1dea` | `6a84feae1c0ce7a02cffcfba` | `6a84feae1c0ce7a02cffcfba` | `5fdfe2c5d6e204535c46104d700fcf1a5aae99cddd179a584fd7bfa0f30cc9c1` | 2026-08-19T01:20:18.155Z |
| HEN | 369693 | `67be2c0772f70fe2b6133d73` | `6a84feb144d629bbc127ea94` | `6a84feb144d629bbc127ea94` | `03976410d3a908b75c774cdc44d6030cda45f1a469a05666989f33ea65ad790a` | 2026-08-19T01:20:18.160Z |
| HEN | 397098 | `67be2c70fe1b3497902330fe` | `6a8502a4cffc1cd9c77a3641` | `6a8502a4cffc1cd9c77a3641` | `0230ed6c8f737a8e57674ef1acb3c5f33ab9ba38aef05bee2ef5bc7ad026c7ed` | 2026-08-19T01:20:18.167Z |
| HEN | 422822 | `67be2cc849f25c380c01e199` | `6a8502a7d22fc5555334056f` | `6a8502a7d22fc5555334056f` | `ba5f4cf5c116877b21aaf67fe5b8bcf30793a330c9097510becb956932d2d37c` | 2026-08-19T01:20:18.159Z |
| HEN | 455835 | `67be2ed06004876108b063cc` | `6a8502a927dac1c7f134e728` | `6a8502a927dac1c7f134e728` | `f5c5cd48f07a3c325569732bd3135ebea021e31a6bd54770ecfa6bc74b6bf03e` | 2026-08-19T01:20:18.166Z |
| HEN | 526531 | `67be2f200e39e3baf53bcc67` | `6a8502ac779751e909e00649` | `6a8502ac779751e909e00649` | `95a8b01c784eb2d6ea21898431ec08e8845e6ca6f3e0cc9435c768f221fb9f39` | 2026-08-19T01:20:18.164Z |

The JSON companion contains the complete Image identities, source byte/dimension/format evidence, publication state, exact active reference set, full migration-asset inventory, historical operation linkage, and immutable Phase B asset-ID population. No credentials or signed URLs are present.

## Read-only boundary

Observed external reads: 294 total known operations (145 guarded GETs in the initial audit, 145 guarded GETs in final revalidation, plus the documented bootstrap reads). Non-GET requests dispatched: **0**. External mutations: **0**.
