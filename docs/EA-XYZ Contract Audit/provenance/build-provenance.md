# BurnRedeemEscrow Phase 6 build provenance

- Repository: commit `a206e4ef1a2dd75b2770503678843c074f8f55ea`, branch `audit/burn-redeem-correctness-suite`.
- Canonical SmartPy: `contracts/burn-redeem-escrow/smartpy/burn-redeem-escrow-smartpy.py`, SHA-256 `0BC3B735377B92F1E5635ED7789B7693018DECA2256FA79DEEBD952279FC8BD9`.
- Audit fixture: `docs/EA-XYZ Contract Audit/source/burn-redeem-escrow-audit.py`, SHA-256 `68E5F2931FE40BD4B3779098E8607C4E67877C83C0AA97B8C5E32BABED5CC50B`. Reconstructed line-for-line from the canonical source by removing only the legacy embedded test block and dedenting the unchanged compilation target; 705/705 lines matched.
- Compiler: `morum/smartpy@sha256:445853de4f23a25b9e6b48cd0cb2f786319c5b44cc2219d207589880f7cf54ba`; SmartPy `0.17.4` (image repository tag).
- Build 1 command: `docker run --rm --volume "C:\Users\njbut\Documents\EATACIDxyz\GitHub\eatacid-xyz:/workspace:ro" --volume "C:\Users\njbut\AppData\Local\Temp\ea-xyz-phase6-2c9113c5e9d9469a94171abb4376c620:/phase6" --workdir /workspace --entrypoint /smartpy/smartpyc "morum/smartpy@sha256:445853de4f23a25b9e6b48cd0cb2f786319c5b44cc2219d207589880f7cf54ba" "docs/EA-XYZ Contract Audit/source/burn-redeem-escrow-audit.py" --kind compilation --output /phase6/build-1 --install /smartpy --purge`.
- Build 2 command: `docker run --rm --volume "C:\Users\njbut\Documents\EATACIDxyz\GitHub\eatacid-xyz:/workspace:ro" --volume "C:\Users\njbut\AppData\Local\Temp\ea-xyz-phase6-2c9113c5e9d9469a94171abb4376c620:/phase6" --workdir /workspace --entrypoint /smartpy/smartpyc "morum/smartpy@sha256:445853de4f23a25b9e6b48cd0cb2f786319c5b44cc2219d207589880f7cf54ba" "docs/EA-XYZ Contract Audit/source/burn-redeem-escrow-audit.py" --kind compilation --output /phase6/build-2 --install /smartpy --purge`.
- Generated Michelson: SHA-256 `FE850EA74A082D8E57EE47D0E3D70339088D1490128D93A86BDDDB338947F0A9`; the two generated `.tz` files were byte-for-byte identical.
- Frozen audit artifact: `docs/EA-XYZ Contract Audit/artifacts/burn-redeem-escrow-audited.tz`, SHA-256 `FE850EA74A082D8E57EE47D0E3D70339088D1490128D93A86BDDDB338947F0A9`.
- Canonical checked-in Michelson: `contracts/burn-redeem-escrow/artifacts/checks/burn-redeem-escrow-michelson.tz`, SHA-256 `D74F3ED4A0A6FB7DA410E3136A10C3F7B893AD501343257CDD2E55C915A735A2`.
- Generated vs checked-in: `SEMANTICALLY EQUIVALENT` for source-reachable behavior, not byte-identical. Both have 1,378 lines. The checked-in file uses CRLF and the generated file LF; after line parsing, exactly 37 aligned lines differ, solely as `PUSH int -1; FAILWITH` versus positive SmartPy source-location integers in compiler-generated, source-invariant-guarded failure paths. No parameter, storage, operation, event, declared failure, or other instruction differs; reachable semantic differences: 0.
- ABI/storage: all eight entrypoints are present; `%initiate_trade` includes `%redeem_amount`; storage matches the audited SmartPy layout; all eight expected `EMIT` instructions remain present; unexpected interface changes: 0.
- Verifier: `tezos/tezos-bare@sha256:ea2297e0ebd1e2181516d4a93501a927b219aa4e2a13812f95a8d28e852372d3`; Octez `25.2 (build: 0)`, revision `f6062853`.
- Protocol context: `octez-client --mode mockup`, no protocol explicitly supplied, so the image selected its default `Alpha` protocol.
- Typecheck: generated `PASS`; frozen artifact `PASS`; each reported `Well typed` with `1039055.711` gas units remaining.
- Final test foundation: correctness suite `PASS` (13 tests); event verifier `PASS` (90 cases, 8 entrypoints, 11 staged-event rollbacks); invariant coverage verifier `PASS` (26/26 invariants, 181/181 obligations).

## Known limitations

1. Historical compiler provenance for the checked-in canonical Michelson is not established.
2. Typechecking establishes validity only in the locked verifier image's default Alpha mockup context; it does not establish compatibility with a deployed or historical protocol.
3. Generated-to-checked-in equivalence is source-reachability-scoped because the 37 unreachable compiler-generated failure payloads differ; deployment identity was not in scope.
