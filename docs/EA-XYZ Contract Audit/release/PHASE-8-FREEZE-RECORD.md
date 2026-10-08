# Phase 8 - Audited Release-Candidate Freeze Record

Project/repository: EA-XYZ BurnRedeemEscrow / chokedesigns/eatacid-xyz (outer repository).
Freeze date: 2026-10-08 (America/Chicago).
Final freeze status: **FROZEN**, effective on the dedicated containing commit and successful post-commit verification recorded in the Phase-8 completion report.

## Immutable identity table

| Identity | Exact value |
|---|---|
| Phase-7 branch | `audit/contract-freeze-candidate-261008` |
| Phase-7-certified commit | `3d2d7651651ad46b475e7ee39c88abffe8d15c0c` |
| Phase-8 pre-freeze HEAD | `3d2d7651651ad46b475e7ee39c88abffe8d15c0c` |
| Final freeze commit SHA | Unique creation commit of this record; resolve using the command below. Literal SHA is in the post-commit completion report. |
| Required freeze parent | `3d2d7651651ad46b475e7ee39c88abffe8d15c0c` |
| Dedicated commit message | `audit: freeze Phase 7 certified contract release candidate` |
| Phase-7 final verdict/counts | PASS; defects=0; gaps=0; identity inconsistencies=0; unresolved blockers=0 |
| Pre-freeze working tree | Clean, including untracked files |
| Candidate/audit input mutation | No |
| Manifest path | `docs/EA-XYZ Contract Audit/release/RELEASE-CANDIDATE-MANIFEST.md` |
| Manifest SHA-256 (checkout and committed LF bytes) | `D46F35CFFB00F28A75A7210C5B15CFED8D10DDC4BDA1EAE4219BF2C8CE3CFC3B` |
| Pristine certification SHA-256 (exact raw archive bytes) | `AAAB970E0ADA89E8B559836F8BFCE2B44201AD6C4FF3194FAA7EE8FAF0BF904F` |
| Actual successful prompt SHA-256 (exact raw archive bytes) | `79F1F5C575AD146ECF54C0AF02C04EB177C924D634A45C0C4442FB0998691CC4` |
| Archive attributes SHA-256 (LF bytes) | `D4DFCE47872FD54528BD03E96AA0EFD326AAF59249BC21624AD5126E2F3577DA` |
| SmartPy image | `morum/smartpy@sha256:445853de4f23a25b9e6b48cd0cb2f786319c5b44cc2219d207589880f7cf54ba` |
| SmartPy version from committed provenance | `0.17.4` image tag |
| Octez image | `tezos/tezos-bare@sha256:ea2297e0ebd1e2181516d4a93501a927b219aa4e2a13812f95a8d28e852372d3` |
| Octez observed version/revision | `25.2` / `f6062853` |
| Native context | Default Alpha mockup protocol |

```powershell
git log --diff-filter=A --format=%H -- 'docs/EA-XYZ Contract Audit/release/PHASE-8-FREEZE-RECORD.md'
```

Require exactly one creation-commit SHA, its sole parent equal to the certified commit, and only the five authorized new release files. This self-identifying Git reference is necessary because embedding a commit's own literal SHA would change that SHA. It remains resolvable after later documentation/packaging work. The literal SHA and clean post-commit result are recorded in the Phase-8 completion report without amending this record or creating a second freeze commit.

## Certified file identities

SHA-256 values are exact Windows checkout bytes and exact certified Git blob bytes respectively. Committed/build LF bytes govern release-critical Michelson identity. Repository paths and artifact roles below are complete; the manifest explains relationships and retained limitations. All 31 files were compared with exact certified HEAD content; only Git CRLF conversion explains checkout differences.

| Role | Repository path | SHA-256 checkout bytes | SHA-256 certified Git blob bytes |
|---|---|---|---|
| Canonical contract specification/orientation | `contracts/burn-redeem-escrow/README.md` | `F5B08F52372F4CDB84501DA9121F22F8ED6CD9B9D950F5C0A5D0C5D3447DE10D` | `7FE80954C0E4554DA929F3E3744826EB7BB5D327F58DDA805D68C5530FFF92FC` |
| Historical canonical compiled artifact | `contracts/burn-redeem-escrow/artifacts/checks/burn-redeem-escrow-michelson.tz` | `D74F3ED4A0A6FB7DA410E3136A10C3F7B893AD501343257CDD2E55C915A735A2` | `5020738310D71B57C417DFA2602890B8190CC99AA1EBA034D0E5A58C1322F7F1` |
| Canonical contract source | `contracts/burn-redeem-escrow/smartpy/burn-redeem-escrow-smartpy.py` | `0BC3B735377B92F1E5635ED7789B7693018DECA2256FA79DEEBD952279FC8BD9` | `E5427B26C472517D7555C1A431FF190C7F4E420996E46E96D6901CC69B84C422` |
| Historical early audit evidence | `docs/EA-XYZ Contract Audit/01-semantic-model.md` | `2359D4E901AE74E85453DB272E351FDA5957C479494D940AE2B9DEDD97A56BB6` | `4DA174AAA9A95985EA36132A406939FAB5275163F4318D7CB779486040AA4BA7` |
| Historical early audit evidence | `docs/EA-XYZ Contract Audit/02-smartpy-michelson-correspondence.md` | `EFD678D520B97C2A2F3C71EB80EEBAAEEA6753AF0D929A95B01AFA6270B83D73` | `BEF4974363D3EF6C46B2FB6C70CEE52DBF2E2BE457DFBFA1DFCC5000470F4BF5` |
| Historical early audit evidence | `docs/EA-XYZ Contract Audit/03-existing-sim-review.md` | `580722F1291313E131855AF931400ED4C947BB9255C2DB72875D2414E31E26E3` | `EE9C953E2F30BC1F1BA07478EFD760BBD2ED369370E27EDECA4CCA495C15FEBF` |
| Historical early audit evidence | `docs/EA-XYZ Contract Audit/04-security-invariants.md` | `D9EA09C07A1633167F0DD4D8EBBD4DA833B2AC1A1F18FFB46E4EFF2AFA0F46C7` | `4069DB4E6E14265483B1405DC4BB34D6B289B6CCDAE545F96E6C24089EAFE514` |
| Historical early audit evidence | `docs/EA-XYZ Contract Audit/05-threat-model.md` | `FD50AB2385900B4722B50B00195120FEE6995C4E9BB19455156D3CF3378568B4` | `2BB7E3E1AED9E8940EF9F9A1B6ACCCC92102F2ECA4737231FDAAD74C6FDE718E` |
| Historical early audit evidence | `docs/EA-XYZ Contract Audit/06-findings.md` | `69515A173893CD264FF67A5C163317C928185700B1DB01124E8B006C07440A0B` | `7281EAAE61D4D8B6845382BD563814DEE6AB81639BEE9013EA0E7BC7B89B3E97` |
| Historical early audit evidence | `docs/EA-XYZ Contract Audit/07-test-coverage-matrix.md` | `74013DE7C40B49213FA667B578DB58479B8E75ED0B12882EBDB299B2521DD2CA` | `F01A6F080AAD32658E1ED9D164BA5688C09E810B8A6776DB3092EB9CE7ACCC85` |
| Historical early audit evidence | `docs/EA-XYZ Contract Audit/08-adversarial-test-results.md` | `66511098083DC0A512D222797A1619AF8FCBA19331A02E21283EAD1E6F79BCB9` | `BF7857A4374C21C40E13DCB1C54BE998CAEC1D8A9F737D7FE10E29E4907F4818` |
| Historical early audit evidence | `docs/EA-XYZ Contract Audit/09-final-security-report.md` | `0FA966E95F705D04BD7B26743C30C76C2B288DC9323D0F9961E95CBFFDAB6AD9` | `A94FC42B4635FC6FBA25EF8FB4DFC46B09AAB7C0B7DAFCE57F13FAF9F476DDAF` |
| Release-critical deterministic audited build | `docs/EA-XYZ Contract Audit/artifacts/burn-redeem-escrow-audited.tz` | `1CC23C16256BF6A237E9E6F5BFFBFDD3AA2822ACE3A0ED987C23FB517DE32FFC` | `FE850EA74A082D8E57EE47D0E3D70339088D1490128D93A86BDDDB338947F0A9` |
| Current audit evidence | `docs/EA-XYZ Contract Audit/audit/coverage-reconciliation.md` | `7CA0CDA2717B3E862A258DE2BB409DFCBB7238EFFA4779244BA24875160DBB97` | `BEE199FBA5A75706A73065B413F2E35B59A2FA5C2A83E4032BAC98AD9F3F4737` |
| Historical adversarial-development report (not pristine authorization) | `docs/EA-XYZ Contract Audit/audit/final-adversarial-review.md` | `DB377875F7803A8B5D70569B7AD8CB4428DD235A136CCAD5B67C9AFB94B39EF1` | `3D52FEA2156A7207B7591B66615EEA734E762B3B2429D04AE773886E397B6652` |
| Current audit evidence | `docs/EA-XYZ Contract Audit/audit/invariant-test-map.md` | `75527BE366FBB0DF5C7FE02337F4104232DB838A6CD14828078B69491AEA4B41` | `7F690466A0BFBB3218AC97CC049B3AC52C063564C17CC88B115C20BDC19CE882` |
| Current audit evidence | `docs/EA-XYZ Contract Audit/audit/security-invariants.md` | `594E3BD9D3D7B4B4AFDD1287581CF21EFD3FD01DBD480ECC854D6D77037D7104` | `6625522E2274BCB58BB4A5A79D123EA9E18D9B5C4EAF6E27251D932A298BE276` |
| Current audit evidence | `docs/EA-XYZ Contract Audit/audit/semantic-model.md` | `5E4AB9D38702EC314E4BF1DE46B6CA71C7E4B9EE452A79577F3C4EEAC70B1ADC` | `15030E27D4C3DB4209A2FB84259E6D67542D2E0947E39B09FECD2B6ABE9FBE65` |
| Current audit evidence | `docs/EA-XYZ Contract Audit/audit/test-architecture.md` | `3928B180C1353483A46E2B7ED92EF8E4C27BE18296C024A6D9698D8E8F6A9612` | `DC3DA0099FEA9BBF1A725CC69EE6F4A7F2E11CAB7BAE8F91C8F0F16537490694` |
| Current audit evidence | `docs/EA-XYZ Contract Audit/audit/test-coverage-requirements.md` | `FECEE6C5F5035BA5C5F0B53D72ACA5865FB9C926EEEFE3D532FB7A660E80BA7E` | `438A43D1E800A753C463F9D1D432D52160E30C26618F430471229D3240BFF169` |
| Historical retained evidence (not the release build) | `docs/EA-XYZ Contract Audit/evidence/audit-only-tests/burn-redeem-adversarial.py` | `0275ADF51553222B72820E6072434763F2453F1758ED69A2DD94D3F57D86B9CC` | `04724DB5EB8C63EC054D6F6F809CA519A3856CC550CCA11E4DFFB8658B69E31C` |
| Historical retained evidence (not the release build) | `docs/EA-XYZ Contract Audit/evidence/checked-in-michelson-normalized.tz` | `0EE3629F68AACA2333B260E660A8ACCF66DA9DAF039C8D1F86CD17AE6D5D6E4D` | `AE95C392BBC5217D9AC0E8AB04D58A36316A5A561FD6BC13807658FA41655C0B` |
| Historical retained evidence (not the release build) | `docs/EA-XYZ Contract Audit/evidence/generated-michelson.tz` | `17C9F7394DF40F1379BCDDE4644CAC64AC176FE369CB39A59F254CE28549D61D` | `AF8BD83AA41DEB281B5E8B4A88774EB7A17B0DE41E9E72074FECD868FA4FB88B` |
| Phase 6 build provenance | `docs/EA-XYZ Contract Audit/provenance/build-provenance.md` | `807F5E90A10FB9E32FBDD27432673204712B8BD09D07C6A0551681EB4CC08B34` | `5FAD466F2DD3ED48D9B9D5681F7C86211764B7C9879C31D07A80D6742FDE54E4` |
| Source and fixture derivation provenance | `docs/EA-XYZ Contract Audit/provenance/source-provenance.md` | `2CEDD999CF87A04CFC25A21A707C850041CFBFE14A497E117DBB475892740597` | `8ACD61A945C3E7A9D81CB3A488CC5FC90A13AC22BF602660E39D91C9AB1D2370` |
| Mechanically stripped compilation fixture | `docs/EA-XYZ Contract Audit/source/burn-redeem-escrow-audit.py` | `68E5F2931FE40BD4B3779098E8607C4E67877C83C0AA97B8C5E32BABED5CC50B` | `9F2FA57AA7CBE43F41A25FD8ABDD295E4BFBD88B72D48DBDFDB549CEA4C8760B` |
| Byte-identical canonical source snapshot | `docs/EA-XYZ Contract Audit/source/legacy/burn-redeem-escrow-with-legacy-tests.py` | `0BC3B735377B92F1E5635ED7789B7693018DECA2256FA79DEEBD952279FC8BD9` | `E5427B26C472517D7555C1A431FF190C7F4E420996E46E96D6901CC69B84C422` |
| Standalone T01-T13 suite and conforming/rejecting/no-op FA2 fixtures | `docs/EA-XYZ Contract Audit/tests/burn-redeem-correctness-suite.py` | `1D9CEC43EF14490A99CAD7C33B70A5C7F91C3498F45A72367E9E339C5095F3D5` | `99CA0F89037A454C33A4215235BB0CF365A13FCB923B2F77695358E6D2D1E04E` |
| Coverage manifest | `docs/EA-XYZ Contract Audit/tests/invariant-coverage.json` | `02F6F9D0B55DFAEE962976F72A643FD43FDA48FBFE6D16A0FECDFB334F0FB363` | `716D9BA47767AD4301951D0CCB1E2ED3BEC7AD017A72AAC78BE9BE9863D09715` |
| Invariant and obligation verifier | `docs/EA-XYZ Contract Audit/tests/verify-invariant-coverage.py` | `7437BFEC4F744D83C3E481478789528B87C97FC78CE511EC79B34AA1D61E05D9` | `A05670B9970BB2240C1D091A8D4BA6AD4E9EBF1038BDC7A600A4FF986EA7BB60` |
| Event and compiled-schema verifier | `docs/EA-XYZ Contract Audit/tests/verify-smartpy-output.py` | `C792D29FD73D0C903927F41913D3DEFF3688A941BD389A43DCFCE1F91323DB1E` | `90416E774EAD95A50B1B9CBFE54B83146FBBDE7BF0D66D56DD0F064B1F950CAE` |

## Preserved Phase-7 provenance

- Raw certification: `docs/EA-XYZ Contract Audit/release/PHASE-7-PRISTINE-CERTIFICATION.md`; original message `2026-10-08T18:23:56.353Z`.
- Exact prompt: `docs/EA-XYZ Contract Audit/release/PHASE-7-PRISTINE-FREEZE-GATE-PROMPT.md`; original message `2026-10-08T18:14:55.869Z`.
- Source session: `01a11cb9-b046-7bc2-9e22-4483a091cbad` (`rollout-2026-10-08T13-14-53-01a11cb9-b046-7bc2-9e22-4483a091cbad.jsonl`).
- UTF-8 byte fidelity is verified against the decoded original messages; no editorial changes or added newline. Scoped attributes disable text conversion for these two files.
- Historical `audit/final-adversarial-review.md` remains unchanged and is not substituted for the pristine certification.

## Authorization and verification boundary

The preserved final Phase-7 pass established 13/13 scenarios; 90 event cases; eight entrypoints; eight exact compiled event types; 11 staged-event rollbacks; 26/26 invariants; 181/181 obligations; deterministic compilation reproducing frozen LF Michelson exactly; and both exact committed Michelson artifacts `Well typed` under the pinned Alpha mockup context.

Phase 8 verifies hashes, HEAD/branch, source/snapshot identity, mechanical fixture derivation, raw archival fidelity, staging content, commit parent/content boundary, and clean post-commit state. It adds only this record, the manifest, the two raw archives, and scoped archive attributes. It performs no candidate modification, regenerated artifact replacement, fresh adversarial audit, promotion, public packaging, or deployment.

The manifest's eight limitations, freeze rule, promotion rule, and deployment rule are binding parts of this record. Any materially relied-upon certified input change creates a new candidate requiring upstream reverification and new pristine Phase-7 certification. Deployment identity and protocol compatibility remain unverified.
