# EA-XYZ Audited Release Candidate Manifest

## A. Release Candidate Identity

- Project: EA-XYZ / eatacid-xyz, BurnRedeemEscrow smart contract.
- Repository: https://github.com/chokedesigns/eatacid-xyz.git (outer repository only; admin-ui is outside this freeze).
- Branch reviewed by Phase 7: `audit/contract-freeze-candidate-261008`.
- Phase-7-certified commit and Phase-8 pre-freeze HEAD: `3d2d7651651ad46b475e7ee39c88abffe8d15c0c`.
- Freeze date: 2026-10-08 (America/Chicago).
- Working tree before Phase 8: clean, including untracked files.
- Freeze commit SHA: the unique Git commit that first adds this manifest and the freeze record, whose sole parent is the certified commit above. Resolve its literal SHA using the command below. The literal result is also recorded in the post-commit Phase-8 completion report.

```powershell
git log --diff-filter=A --format=%H -- 'docs/EA-XYZ Contract Audit/release/PHASE-8-FREEZE-RECORD.md'
```

A commit cannot contain its own literal SHA: changing that field changes its tree and therefore its SHA. This immutable Git creation-commit reference avoids a second commit or an amend. Require exactly one result, parent `3d2d7651651ad46b475e7ee39c88abffe8d15c0c`, and only the five release/provenance additions listed below. Resolve the creation commit from history even after later packaging commits; later HEAD is not automatically the freeze commit.

The `release/` directory did not previously exist and no other canonical release naming convention was present in the audited workspace. These paths implement the Phase-8 requested naming convention.

## B. Certified Contract Artifacts

All paths are repository-relative. Both hash columns are SHA-256 of exact bytes, not Git object IDs. The checkout column records the untouched Windows checkout observed in Phase 8; the Git blob column hashes `git show 3d2d7651651ad46b475e7ee39c88abffe8d15c0c:<path>` as bytes. All candidate files match the certified commit; differences between the two columns are solely Git CRLF checkout conversion.

| Role | Repository path | SHA-256 checkout bytes | SHA-256 certified Git blob bytes |
|---|---|---|---|
| Historical canonical compiled artifact | `contracts/burn-redeem-escrow/artifacts/checks/burn-redeem-escrow-michelson.tz` | `D74F3ED4A0A6FB7DA410E3136A10C3F7B893AD501343257CDD2E55C915A735A2` | `5020738310D71B57C417DFA2602890B8190CC99AA1EBA034D0E5A58C1322F7F1` |
| Canonical contract source | `contracts/burn-redeem-escrow/smartpy/burn-redeem-escrow-smartpy.py` | `0BC3B735377B92F1E5635ED7789B7693018DECA2256FA79DEEBD952279FC8BD9` | `E5427B26C472517D7555C1A431FF190C7F4E420996E46E96D6901CC69B84C422` |
| Release-critical deterministic audited build | `docs/EA-XYZ Contract Audit/artifacts/burn-redeem-escrow-audited.tz` | `1CC23C16256BF6A237E9E6F5BFFBFDD3AA2822ACE3A0ED987C23FB517DE32FFC` | `FE850EA74A082D8E57EE47D0E3D70339088D1490128D93A86BDDDB338947F0A9` |
| Historical retained evidence (not the release build) | `docs/EA-XYZ Contract Audit/evidence/audit-only-tests/burn-redeem-adversarial.py` | `0275ADF51553222B72820E6072434763F2453F1758ED69A2DD94D3F57D86B9CC` | `04724DB5EB8C63EC054D6F6F809CA519A3856CC550CCA11E4DFFB8658B69E31C` |
| Historical retained evidence (not the release build) | `docs/EA-XYZ Contract Audit/evidence/checked-in-michelson-normalized.tz` | `0EE3629F68AACA2333B260E660A8ACCF66DA9DAF039C8D1F86CD17AE6D5D6E4D` | `AE95C392BBC5217D9AC0E8AB04D58A36316A5A561FD6BC13807658FA41655C0B` |
| Historical retained evidence (not the release build) | `docs/EA-XYZ Contract Audit/evidence/generated-michelson.tz` | `17C9F7394DF40F1379BCDDE4644CAC64AC176FE369CB39A59F254CE28549D61D` | `AF8BD83AA41DEB281B5E8B4A88774EB7A17B0DE41E9E72074FECD868FA4FB88B` |
| Mechanically stripped compilation fixture | `docs/EA-XYZ Contract Audit/source/burn-redeem-escrow-audit.py` | `68E5F2931FE40BD4B3779098E8607C4E67877C83C0AA97B8C5E32BABED5CC50B` | `9F2FA57AA7CBE43F41A25FD8ABDD295E4BFBD88B72D48DBDFDB549CEA4C8760B` |
| Byte-identical canonical source snapshot | `docs/EA-XYZ Contract Audit/source/legacy/burn-redeem-escrow-with-legacy-tests.py` | `0BC3B735377B92F1E5635ED7789B7693018DECA2256FA79DEEBD952279FC8BD9` | `E5427B26C472517D7555C1A431FF190C7F4E420996E46E96D6901CC69B84C422` |
| Standalone T01-T13 suite and conforming/rejecting/no-op FA2 fixtures | `docs/EA-XYZ Contract Audit/tests/burn-redeem-correctness-suite.py` | `1D9CEC43EF14490A99CAD7C33B70A5C7F91C3498F45A72367E9E339C5095F3D5` | `99CA0F89037A454C33A4215235BB0CF365A13FCB923B2F77695358E6D2D1E04E` |
| Coverage manifest | `docs/EA-XYZ Contract Audit/tests/invariant-coverage.json` | `02F6F9D0B55DFAEE962976F72A643FD43FDA48FBFE6D16A0FECDFB334F0FB363` | `716D9BA47767AD4301951D0CCB1E2ED3BEC7AD017A72AAC78BE9BE9863D09715` |
| Invariant and obligation verifier | `docs/EA-XYZ Contract Audit/tests/verify-invariant-coverage.py` | `7437BFEC4F744D83C3E481478789528B87C97FC78CE511EC79B34AA1D61E05D9` | `A05670B9970BB2240C1D091A8D4BA6AD4E9EBF1038BDC7A600A4FF986EA7BB60` |
| Event and compiled-schema verifier | `docs/EA-XYZ Contract Audit/tests/verify-smartpy-output.py` | `C792D29FD73D0C903927F41913D3DEFF3688A941BD389A43DCFCE1F91323DB1E` | `90416E774EAD95A50B1B9CBFE54B83146FBBDE7BF0D66D56DD0F064B1F950CAE` |

Relationships and release identity:

- Canonical SmartPy and the legacy snapshot are byte-identical in the checkout and at the certified commit.
- The stripped fixture was independently reconstructed in memory from canonical source by removing only the legacy test block and dedenting the unchanged compilation-target block: exact byte match, 705/705 lines. No source file was written or regenerated.
- The standalone correctness suite includes conforming, rejecting, accepting-no-op FA2 fixtures, the tez-admin proxy, and assertion helpers. Their identities are covered by the suite hash.
- The release-critical frozen Michelson identity is its exact committed/build LF hash `FE850EA74A082D8E57EE47D0E3D70339088D1490128D93A86BDDDB338947F0A9`. The pristine Phase-7 pass established fresh deterministic reproduction of those bytes. CRLF checkout bytes are not the native build/promotion byte identity.
- Canonical Michelson has the separate exact committed LF identity `5020738310D71B57C417DFA2602890B8190CC99AA1EBA034D0E5A58C1322F7F1`. It is not byte-identical to the frozen build. Phase 7 established 37 compiler-generated integer payload differences immediately before FAILWITH, and equivalence only for the established source-reachable behavior of the fixed target. The pristine report preserves its clarification of the historical narrative's reversed integer-location direction; no historical evidence is corrected here.
- The two `evidence/*.tz` files and the audit-only adversarial suite are historical evidence with their own identities. They do not substitute for the frozen release artifact or the standalone correctness suite.
- Certified constructor target: admin `tz1hcAYJhEB9n6ezLFcbuejzZ821zrL1c3vW`, burn address `tz1dpaqpwKqPSft4SFvd5tA9bx7iDUNHnVsz`; initial storage paused=True, empty token mapping, mapping size=0. These are recorded from the certified semantic model and fixture; deployment verification remains separate.

## C. Audit Evidence Identity

The current `audit/` semantic model, invariant set, test architecture, coverage requirements, invariant-to-test map, `tests/invariant-coverage.json`, reconciliation report, and Phase 6 provenance form the final Phase 0-6 evidence as reviewed at the certified commit. Numbered reports 01-09 and retained evidence are historical context, not replacements for the final evidence. Exact hashes below freeze their contents without revising historical status wording.

| Role | Repository path | SHA-256 checkout bytes | SHA-256 certified Git blob bytes |
|---|---|---|---|
| Canonical contract specification/orientation | `contracts/burn-redeem-escrow/README.md` | `F5B08F52372F4CDB84501DA9121F22F8ED6CD9B9D950F5C0A5D0C5D3447DE10D` | `7FE80954C0E4554DA929F3E3744826EB7BB5D327F58DDA805D68C5530FFF92FC` |
| Historical early audit evidence | `docs/EA-XYZ Contract Audit/01-semantic-model.md` | `2359D4E901AE74E85453DB272E351FDA5957C479494D940AE2B9DEDD97A56BB6` | `4DA174AAA9A95985EA36132A406939FAB5275163F4318D7CB779486040AA4BA7` |
| Historical early audit evidence | `docs/EA-XYZ Contract Audit/02-smartpy-michelson-correspondence.md` | `EFD678D520B97C2A2F3C71EB80EEBAAEEA6753AF0D929A95B01AFA6270B83D73` | `BEF4974363D3EF6C46B2FB6C70CEE52DBF2E2BE457DFBFA1DFCC5000470F4BF5` |
| Historical early audit evidence | `docs/EA-XYZ Contract Audit/03-existing-sim-review.md` | `580722F1291313E131855AF931400ED4C947BB9255C2DB72875D2414E31E26E3` | `EE9C953E2F30BC1F1BA07478EFD760BBD2ED369370E27EDECA4CCA495C15FEBF` |
| Historical early audit evidence | `docs/EA-XYZ Contract Audit/04-security-invariants.md` | `D9EA09C07A1633167F0DD4D8EBBD4DA833B2AC1A1F18FFB46E4EFF2AFA0F46C7` | `4069DB4E6E14265483B1405DC4BB34D6B289B6CCDAE545F96E6C24089EAFE514` |
| Historical early audit evidence | `docs/EA-XYZ Contract Audit/05-threat-model.md` | `FD50AB2385900B4722B50B00195120FEE6995C4E9BB19455156D3CF3378568B4` | `2BB7E3E1AED9E8940EF9F9A1B6ACCCC92102F2ECA4737231FDAAD74C6FDE718E` |
| Historical early audit evidence | `docs/EA-XYZ Contract Audit/06-findings.md` | `69515A173893CD264FF67A5C163317C928185700B1DB01124E8B006C07440A0B` | `7281EAAE61D4D8B6845382BD563814DEE6AB81639BEE9013EA0E7BC7B89B3E97` |
| Historical early audit evidence | `docs/EA-XYZ Contract Audit/07-test-coverage-matrix.md` | `74013DE7C40B49213FA667B578DB58479B8E75ED0B12882EBDB299B2521DD2CA` | `F01A6F080AAD32658E1ED9D164BA5688C09E810B8A6776DB3092EB9CE7ACCC85` |
| Historical early audit evidence | `docs/EA-XYZ Contract Audit/08-adversarial-test-results.md` | `66511098083DC0A512D222797A1619AF8FCBA19331A02E21283EAD1E6F79BCB9` | `BF7857A4374C21C40E13DCB1C54BE998CAEC1D8A9F737D7FE10E29E4907F4818` |
| Historical early audit evidence | `docs/EA-XYZ Contract Audit/09-final-security-report.md` | `0FA966E95F705D04BD7B26743C30C76C2B288DC9323D0F9961E95CBFFDAB6AD9` | `A94FC42B4635FC6FBA25EF8FB4DFC46B09AAB7C0B7DAFCE57F13FAF9F476DDAF` |
| Current audit evidence | `docs/EA-XYZ Contract Audit/audit/coverage-reconciliation.md` | `7CA0CDA2717B3E862A258DE2BB409DFCBB7238EFFA4779244BA24875160DBB97` | `BEE199FBA5A75706A73065B413F2E35B59A2FA5C2A83E4032BAC98AD9F3F4737` |
| Historical adversarial-development report (not pristine authorization) | `docs/EA-XYZ Contract Audit/audit/final-adversarial-review.md` | `DB377875F7803A8B5D70569B7AD8CB4428DD235A136CCAD5B67C9AFB94B39EF1` | `3D52FEA2156A7207B7591B66615EEA734E762B3B2429D04AE773886E397B6652` |
| Current audit evidence | `docs/EA-XYZ Contract Audit/audit/invariant-test-map.md` | `75527BE366FBB0DF5C7FE02337F4104232DB838A6CD14828078B69491AEA4B41` | `7F690466A0BFBB3218AC97CC049B3AC52C063564C17CC88B115C20BDC19CE882` |
| Current audit evidence | `docs/EA-XYZ Contract Audit/audit/security-invariants.md` | `594E3BD9D3D7B4B4AFDD1287581CF21EFD3FD01DBD480ECC854D6D77037D7104` | `6625522E2274BCB58BB4A5A79D123EA9E18D9B5C4EAF6E27251D932A298BE276` |
| Current audit evidence | `docs/EA-XYZ Contract Audit/audit/semantic-model.md` | `5E4AB9D38702EC314E4BF1DE46B6CA71C7E4B9EE452A79577F3C4EEAC70B1ADC` | `15030E27D4C3DB4209A2FB84259E6D67542D2E0947E39B09FECD2B6ABE9FBE65` |
| Current audit evidence | `docs/EA-XYZ Contract Audit/audit/test-architecture.md` | `3928B180C1353483A46E2B7ED92EF8E4C27BE18296C024A6D9698D8E8F6A9612` | `DC3DA0099FEA9BBF1A725CC69EE6F4A7F2E11CAB7BAE8F91C8F0F16537490694` |
| Current audit evidence | `docs/EA-XYZ Contract Audit/audit/test-coverage-requirements.md` | `FECEE6C5F5035BA5C5F0B53D72ACA5865FB9C926EEEFE3D532FB7A660E80BA7E` | `438A43D1E800A753C463F9D1D432D52160E30C26618F430471229D3240BFF169` |
| Phase 6 build provenance | `docs/EA-XYZ Contract Audit/provenance/build-provenance.md` | `807F5E90A10FB9E32FBDD27432673204712B8BD09D07C6A0551681EB4CC08B34` | `5FAD466F2DD3ED48D9B9D5681F7C86211764B7C9879C31D07A80D6742FDE54E4` |
| Source and fixture derivation provenance | `docs/EA-XYZ Contract Audit/provenance/source-provenance.md` | `2CEDD999CF87A04CFC25A21A707C850041CFBFE14A497E117DBB475892740597` | `8ACD61A945C3E7A9D81CB3A488CC5FC90A13AC22BF602660E39D91C9AB1D2370` |

Distinct pristine Phase-7 archives added by Phase 8:

| Artifact | Repository path | SHA-256 exact archive/committed bytes |
|---|---|---|
| Verbatim successful Phase-7 prompt | `docs/EA-XYZ Contract Audit/release/PHASE-7-PRISTINE-FREEZE-GATE-PROMPT.md` | `79F1F5C575AD146ECF54C0AF02C04EB177C924D634A45C0C4442FB0998691CC4` |
| Verbatim final pristine PASS output | `docs/EA-XYZ Contract Audit/release/PHASE-7-PRISTINE-CERTIFICATION.md` | `AAAB970E0ADA89E8B559836F8BFCE2B44201AD6C4FF3194FAA7EE8FAF0BF904F` |
| Archive line-ending preservation rules | `docs/EA-XYZ Contract Audit/release/.gitattributes` | `D4DFCE47872FD54528BD03E96AA0EFD326AAF59249BC21624AD5126E2F3577DA` |

The raw archives preserve the exact decoded message text, encoded as UTF-8 without BOM, with no added heading, correction, or terminal newline. The report retains its original plain-text code fence. The prompt retains its original CR characters, including doubled CR before LF where present. Scoped `-text` rules preserve those bytes across Git staging/checkout; existing certified files are unaffected. Only the verbatim prompt archive disables blank-at-EOL/EOF whitespace diagnostics to retain its historical bytes; newly authored records retain ordinary whitespace checks.

Archive source: local Codex session `01a11cb9-b046-7bc2-9e22-4483a091cbad`, rollout `rollout-2026-10-08T13-14-53-01a11cb9-b046-7bc2-9e22-4483a091cbad.jsonl`. Prompt message: `2026-10-08T18:14:55.869Z`. Final report message: `2026-10-08T18:23:56.353Z`. This is the latest completed pristine run located for the exact candidate; it includes fresh compilation and native typechecking. Both files are preserved output/provenance of that completed run, not a new Phase-7 execution. The previously committed `audit/final-adversarial-review.md` is the historical review that resolved three gaps and is preserved unchanged.

## D. Phase-7 Freeze Authorization

- Certified branch: `audit/contract-freeze-candidate-261008`.
- Certified commit: `3d2d7651651ad46b475e7ee39c88abffe8d15c0c`.
- Final result: **PASS**.
- Contract defects: **0**.
- Assurance gaps: **0**.
- Provenance / identity inconsistencies: **0**.
- Unresolved blocking findings: **0**.

The [verbatim final pristine certification](PHASE-7-PRISTINE-CERTIFICATION.md) establishes fresh executable verification:

- 13/13 standalone correctness scenarios.
- 90 event cases across eight entrypoints.
- Eight exact compiled event types; compiled nat-to-int schema challenge rejected.
- 11 staged-event rollbacks.
- 26/26 invariants and 181/181 audit obligations.
- Two deterministic compilation outputs, byte-identical and exactly reproducing the committed frozen audited Michelson.
- Expected constructor addresses and initial storage.
- Native Octez typechecking of both exact committed LF Michelson artifacts: `Well typed` in the pinned default Alpha mockup context; 1039055.711 gas units remaining in each check.
- Unchanged branch/HEAD and clean working tree at review start and completion.

Phase 8 independently checked candidate identities, mechanical fixture derivation, archival fidelity, and Git content boundaries. Phase 8 did not rerun an adversarial audit, correctness execution, compilation, or native typechecking. The execution results above are those established by the archived final Phase-7 pass.

## E. Toolchain

- SmartPy pinned image: `morum/smartpy@sha256:445853de4f23a25b9e6b48cd0cb2f786319c5b44cc2219d207589880f7cf54ba`.
- SmartPy version available in committed provenance: `0.17.4` (image repository tag; not a newly observed binary version).
- Compiler executable: `/smartpy/smartpyc` with `/smartpy` installation, as recorded in Phase 6 and pristine Phase 7.
- Octez pinned image: `tezos/tezos-bare@sha256:ea2297e0ebd1e2181516d4a93501a927b219aa4e2a13812f95a8d28e852372d3`.
- Observed Octez version: `25.2` (`build: 0` in Phase 6).
- Observed Octez revision: `f6062853`.
- Native-validation context: `octez-client --mode mockup`, default Alpha protocol selected by the pinned image; no explicit deployed protocol.

No toolchain image substitution or compilation was performed in Phase 8.

## F. Known Limitations

1. Configured FA2 contracts must honestly implement compatible authorization, balance, and transfer semantics.
2. Administrator custody, configuration, and pause authority remain trusted and permanent.
3. Burn-address key control and unspendability are not enforced or proved by the escrow contract.
4. Historical compiler provenance for canonical Michelson remains unknown; canonical/frozen equivalence is confined to the established source-reachable behavior.
5. Native validation applies to the pinned Alpha mockup context.
6. Deployed-contract identity and compatibility with a specific deployed protocol remain unverified.
7. SmartPy scenarios and logs are simulation evidence, not live-chain receipts.
8. No formal proof, exhaustive state exploration, comprehensive fuzzing, production-FA2 campaign, or comprehensive gas/resource-limit campaign was performed.

These are retained assurance boundaries established by Phase 7, not newly discovered defects. None is removed or softened by freeze.

## G. Freeze Rule

> This manifest freezes the exact EA-XYZ contract release candidate certified by Phase 7. Any subsequent modification to the audited contract source, audit fixture, correctness suite, specification, invariant set, coverage evidence, compiled Michelson, or other artifact materially relied upon by the Phase-7 certification creates a new candidate and invalidates this certification for the modified state.

> Documentation or packaging work that does not alter the certified candidate may be added after freeze, but must not change the identities or substantive claims recorded in this manifest.

## H. Promotion Rule

> Only artifacts whose identities exactly match this frozen manifest are eligible for promotion into production contract locations and subsequent deployment.

For release-critical Michelson, use the exact committed/build byte identity above, not Windows text-converted checkout bytes.

## I. Deployment Rule

> Deployment does not itself extend the Phase-7 certification. The originated contract must later be independently verified against the exact frozen Michelson and expected initial storage/configuration before deployed identity can be claimed.

## Phase-8 record boundary

The dedicated freeze commit adds only `release/.gitattributes`, the two raw Phase-7 archives, this manifest, and `PHASE-8-FREEZE-RECORD.md`. No Phase 0-7 certified input is changed. The freeze record contains this manifest's exact SHA-256. A file does not embed its own hash; the freeze commit's Git tree binds all five additions, and the post-commit completion report records their hashes and the literal freeze commit SHA. No public package, promotion, chain-registry update, configuration change, or deployment is part of this freeze.
