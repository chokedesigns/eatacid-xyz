# EA-XYZ Contract Audit — Phase 7  
## Pristine Adversarial Release-Candidate Verification

You are performing the final pristine adversarial verification of the EA-XYZ smart-contract release candidate.

This phase is a **read-only release-candidate freeze gate**.

Your task is to determine whether the exact candidate presented to you, together with its completed Phase 0–6 audit evidence, is sufficiently supported to be frozen as the audited release candidate.

You are **not** developing the contract.

You are **not** improving the audit system.

You are **not** remediating findings.

You are independently attempting to invalidate the claim:

> The current EA-XYZ contract candidate satisfies its documented specification, invariants, security/correctness requirements, test obligations, artifact-identity requirements, and stated audit standard, with no unresolved contract defect or material assurance gap.

If you cannot invalidate that claim after a complete adversarial review, return **PASS**.

If you identify one or more material evidence-backed reasons that the claim is false or inadequately supported, return **BLOCKED**.

---

# 1. DESIGNATED REVIEW TARGET

The designated release-candidate branch for this certification is:

`audit/contract-freeze-candidate-261008`

Before beginning substantive review:

1. verify that `audit/contract-freeze-candidate-261008` is the currently checked-out branch;
2. verify that the Git working tree is clean;
3. record the exact HEAD commit SHA;
4. treat that exact commit and the audit artifacts reachable from it as the immutable candidate under review.

If:

- the checked-out branch differs from `audit/contract-freeze-candidate-261008`;
- the working tree contains uncommitted modifications;
- candidate identity cannot be established unambiguously;

return **BLOCKED** because the candidate cannot be certified as an immutable release target.

The exact HEAD commit recorded at the start of this phase is the candidate identity for this certification.

Do not silently substitute:

- another branch;
- another commit;
- a historical candidate;
- a locally modified file;
- an uncommitted artifact;
- a generated artifact from a different source state.

---

# 2. HARD EXECUTION BOUNDARY

This phase is strictly read-only.

You MUST NOT:

- modify any repository file;
- modify SmartPy source;
- modify Michelson;
- modify tests or fixtures;
- modify specifications or invariant definitions;
- modify coverage matrices;
- modify documentation;
- create remediation commits;
- provide or apply patches;
- silently correct errors you discover;
- expand the audit system merely because another design might be preferable;
- turn findings into fixes during this execution.

You MUST ALSO NOT:

- switch branches;
- merge;
- rebase;
- cherry-pick;
- commit;
- amend;
- stash or apply stashes;
- reset repository state;
- modify tracked files;
- modify untracked audit artifacts;
- otherwise alter repository or Git state during this review.

If you identify a valid finding, document it and continue auditing the remainder of the candidate.

The terminal result remains **BLOCKED**.

Remediation belongs to an upstream phase and must occur in a separate execution.

A remediated candidate is a new review target and requires a new pristine Phase-7 run.

A valid Phase-7 PASS requires:

- the reviewed branch to remain unchanged;
- the reviewed HEAD commit to remain unchanged;
- the working tree to remain clean for the entire execution.

---

# 3. CANDIDATE IDENTITY

Establish the exact release candidate under review.

Locate the canonical contract-audit workspace and its completed Phase 0–6 artifacts.

The review target should include, as applicable:

- canonical fixed SmartPy source;
- stripped audit fixture;
- standalone correctness test suite;
- realistic FA2 fixtures;
- hostile/non-standard trust-boundary fixtures;
- contract specification;
- complete invariant/security/correctness model;
- invariant/coverage matrix;
- compiled Michelson;
- compilation and native-typecheck evidence;
- source/artifact hashes;
- pinned toolchain information;
- reproducible verification commands;
- documented assumptions and limitations;
- formal audit history necessary to understand candidate provenance.

Record the exact identities/hashes already established by the audit record.

Do not silently substitute a different source file, generated artifact, historical candidate, legacy fixture, or unverified copy.

If candidate identity cannot be established unambiguously, that is a blocking provenance finding.

---

# 4. AUDIT HISTORY VS. CURRENT CANDIDATE

The repository may contain evidence from earlier audit iterations.

Historical findings are not automatically current findings.

In particular, distinguish among:

1. defects or gaps discovered in predecessor candidates;
2. remediation evidence for those defects or gaps;
3. the final candidate actually under review;
4. unresolved conditions affecting the final candidate.

A previously identified issue that has been fully remediated and reverified is part of the audit history, not a present defect.

Do not fail the final candidate merely because the audit process previously found something.

Conversely, do not assume a historical finding is closed merely because documentation says so. Verify that the final evidence supports closure.

The final verdict concerns the **exact current release candidate**.

---

# 5. REVIEW STANDARD

Perform a fresh adversarial review of the complete final candidate and Phase 0–6 evidence.

Do not merely confirm prior conclusions.

Attempt to falsify them.

At minimum, challenge the following.

## A. Contract semantic correctness

Determine whether the final SmartPy behavior actually implements the documented contract specification.

Review all meaningful contract state and entrypoints, including as applicable:

- administrator behavior;
- pause behavior;
- pair configuration and mutation;
- trade authorization and execution;
- burn semantics;
- redemption semantics;
- custody/inventory behavior;
- FA2 interactions;
- authorization;
- balance handling;
- failure behavior;
- atomicity;
- storage mutation;
- tez handling;
- emitted events;
- interaction among state transitions;
- boundary conditions.

Look specifically for semantic interactions that individual isolated tests might miss.

---

## B. Security/correctness invariants

Verify that the documented invariant set is:

- internally coherent;
- materially complete for the claimed security/correctness model;
- actually enforced by the candidate;
- meaningfully covered by evidence.

Attempt to identify important contract properties that should be invariants but were omitted.

A genuinely missing security/correctness invariant may be a blocking assurance gap.

Do not manufacture additional invariants merely because more defensive properties could theoretically be specified.

---

## C. Test architecture and correctness evidence

Challenge whether the completed standalone test suite materially demonstrates the claimed behavior.

Review:

- positive paths;
- negative paths;
- authorization failures;
- exact failure reasons where claimed;
- boundary conditions;
- atomic rollback;
- post-state assertions;
- balances;
- tez behavior;
- event assertions;
- hostile/trust-boundary fixture behavior;
- stale-state interactions;
- state-transition interactions.

Check that tests would actually fail if the corresponding invariant were broken.

Do not demand redundant tests where equivalent assurance is already clearly established.

---

## D. FA2 and external-contract trust boundary

Review the assumptions made about configured FA2 contracts.

Determine whether:

- authorization and balance semantics are modeled appropriately;
- hostile/non-standard behavior covered by the audit matches the stated threat model;
- residual trust assumptions are explicitly documented;
- the final security claims do not exceed what those assumptions support.

A documented external trust assumption is not itself a defect.

It becomes a finding only if:

- it is missing;
- internally inconsistent;
- contradicted by implementation;
- or the public/security claim materially overstates what is guaranteed.

---

## E. Coverage reconciliation

Independently inspect the final invariant/coverage mapping.

Determine whether:

- every claimed invariant has meaningful supporting evidence;
- every meaningful entrypoint/state transition is represented;
- obligations marked covered are genuinely covered;
- no material behavior has fallen between specification, tests, and coverage accounting.

Do not create findings for purely organizational or stylistic coverage differences.

The question is whether the claimed assurance is substantively supported.

---

## F. Event/schema correctness

Verify that event assertions meaningfully correspond to the contract's emitted event schemas and payload semantics.

Check exact compiled-type expectations where relevant, including distinctions such as:

- `nat`;
- `int`;
- addresses;
- token IDs;
- amounts;
- field ordering/layout as required by the compiled contract.

Do not treat equivalent presentation differences as defects unless they affect actual contract behavior or claimed schema identity.

---

## G. Compilation and artifact identity

Verify the evidence supporting the SmartPy → Michelson relationship.

Review:

- pinned SmartPy toolchain;
- compilation procedure;
- reproducibility claims;
- generated artifact identity;
- canonical Michelson identity;
- any semantic-equivalence evidence;
- native Octez typechecking evidence;
- hashes.

Determine whether the exact Michelson proposed for promotion/deployment is legitimately tied to the audited candidate.

Any unexplained source/artifact identity mismatch is potentially blocking.

---

## H. Provenance consistency

Challenge the internal consistency of the audit record.

Look for contradictions among:

- candidate hashes;
- source snapshots;
- audit fixtures;
- compiled artifacts;
- test results;
- coverage results;
- phase reports;
- remediation records;
- final claims.

Historical compiler provenance limitations that are already explicitly documented should not be rediscovered and relabeled as new findings unless they invalidate a current claim.

---

## I. Known limitations

Review every retained limitation.

Determine whether each is:

- accurately described;
- appropriately scoped;
- compatible with the release claim;
- non-blocking under the defined threat model.

A limitation does not become a finding merely because it exists.

A limitation is blocking only if it makes the candidate's claimed security/correctness level materially false or unsupported.

---

# 6. MATERIAL FINDING THRESHOLD

Phase 7 exists to detect material deficiencies, not generate endless optional hardening work.

A finding may block release only if it is evidence-backed and materially falls into at least one of these categories:

1. **Contract defect**  
   A security, correctness, authorization, state-transition, value-transfer, atomicity, or semantic flaw in the final candidate.

2. **Invariant failure**  
   A documented security/correctness invariant is false, inadequately enforced, or materially unsupported.

3. **Material assurance gap**  
   A meaningful behavior required to support the release claim is not adequately specified, tested, modeled, or reconciled.

4. **Threat-model/trust-assumption defect**  
   A material assumption is absent, contradicted, or causes the stated guarantees to exceed what the system can support.

5. **Coverage integrity problem**  
   The final audit claims coverage that the underlying evidence materially does not establish.

6. **Artifact/provenance identity failure**  
   The candidate source, tests, compiled Michelson, hashes, or verification evidence cannot be reliably tied to the same reviewed release candidate.

7. **Deployment-relevant incompatibility**  
   The evidence demonstrates a compatibility issue that would make the proposed audited artifact unsuitable for the intended deployment environment.

---

# 7. NON-FINDINGS

The following do NOT independently justify BLOCKED:

- stylistic preferences;
- naming preferences;
- documentation wording that does not affect the substantive claim;
- alternative contract architecture;
- additional defense-in-depth ideas not required by the threat model;
- redundant test suggestions;
- a desire for more tests when existing evidence already proves the property;
- speculative hypothetical behavior outside the stated trust model;
- preference for a different audit methodology;
- preference for different invariant organization;
- preference for a different toolchain where the pinned toolchain is valid;
- historical defects already demonstrably remediated;
- known limitations already accurately disclosed and compatible with the release claim;
- the mere possibility that a future reviewer or stronger model could examine the contract again.

Do not generate findings solely to make the review appear productive.

A legitimate pristine result may contain zero findings.

---

# 8. ADVERSARIAL EXPECTATION

Treat the candidate as untrusted.

Do not defer to prior PASS labels merely because they exist.

Do not assume earlier auditors were correct.

Do not assume the candidate is safe because it has extensive tests.

Independently inspect the actual evidence.

However, remain evidence-driven.

The goal is not to maximize the number of criticisms.

The goal is to determine whether a material reason exists to reject the candidate.

---

# 9. VERIFICATION EXECUTION

Where the repository and environment permit, independently execute the existing verification procedures necessary to validate the final evidence.

This may include:

- standalone correctness tests;
- compilation;
- hash verification;
- artifact comparison;
- Octez/native Michelson typechecking;
- coverage/reconciliation checks;
- existing audit verification scripts.

Do not modify scripts in order to make them pass.

If an existing required verification fails, record the failure.

If execution is impossible because a required dependency/artifact is unavailable, determine whether the existing recorded evidence is sufficient.

If essential evidence cannot be independently verified and is necessary to support the freeze claim, return BLOCKED.

Do not install or introduce a materially different toolchain merely to obtain a preferred result unless explicitly required by the recorded reproducible procedure.

---

# 10. PRIOR ADVERSARIAL HISTORY

The audit history may include an earlier high-capability adversarial review that identified assurance gaps and subsequently participated in their remediation.

Treat that run as historical adversarial-development evidence, not as the pristine Phase-7 certification being performed now.

Verify that its legitimate findings were actually closed in the current evidence state.

Do not assume that earlier review itself constitutes the current PASS.

This execution must independently reach its own verdict against the final candidate.

---

# 11. NO REMEDIATION

This instruction is absolute.

If you identify:

- a defect;
- a missing test;
- an incorrect invariant;
- an unsupported coverage claim;
- an identity mismatch;
- a provenance issue;
- or any other blocking condition,

DO NOT FIX IT.

DO NOT edit the affected artifact.

DO NOT create a replacement artifact.

DO NOT update the audit record to mark it closed.

Document the issue precisely and return BLOCKED.

---

# 12. REQUIRED REPORT

Produce a standalone report suitable for inclusion in the public audit provenance package.

Use the following structure exactly.

# Phase 7 — Pristine Adversarial Release-Candidate Verification

## A. Candidate Identity

Record:

- Branch: `audit/contract-freeze-candidate-261008`
- HEAD commit SHA at review start
- Working tree status at review start
- HEAD commit SHA at review completion
- Working tree status at review completion

Record the exact release candidate and the relevant source/artifact identities reviewed.

Include the hashes already established by the canonical audit record where available.

State whether candidate identity is unambiguous.

A valid PASS requires:

- the branch to remain `audit/contract-freeze-candidate-261008`;
- HEAD at completion to exactly match HEAD at start;
- the working tree to be clean at both start and completion;
- no repository mutation during the review.

## B. Evidence Reviewed

Concise inventory of the Phase 0–6 evidence actually reviewed.

## C. Independent Verification Performed

Record commands/checks/tests actually executed or independently validated.

Report their results.

Do not claim execution that did not occur.

## D. Adversarial Review

Summarize the substantive areas challenged:

- contract semantics;
- invariants;
- authorization/security model;
- state interactions;
- failure/atomicity behavior;
- FA2 trust boundary;
- event schemas;
- test sufficiency;
- coverage integrity;
- compilation;
- artifact identity;
- provenance;
- limitations.

Keep this section factual.

## E. Findings

Classify all material findings under:

### Contract Defects

### Assurance Gaps

### Provenance / Identity Inconsistencies

For every finding include:

- identifier;
- classification;
- affected invariant/claim/artifact;
- concrete evidence;
- why it is material;
- release impact.

Do not include optional improvements as findings.

If there are no findings in a category, state `None`.

## F. Known Limitations

List the retained limitations applicable to the final candidate.

State whether any limitation invalidates the release claim.

Do not convert an accurately documented limitation into a finding without evidence that the existing release claim is materially overstated.

## G. Final Counts

Report exactly:

- Contract defects: `<N>`
- Assurance gaps: `<N>`
- Provenance / identity inconsistencies: `<N>`
- Unresolved blocking findings: `<N>`

## H. Final Verdict

The verdict MUST be exactly one of:

`PASS`

or

`BLOCKED`

### PASS criteria

Return `PASS` only if:

- Contract defects = 0
- Assurance gaps = 0
- Provenance / identity inconsistencies = 0
- Unresolved blocking findings = 0
- the candidate's Phase 0–6 evidence substantively supports the defined release standard;
- the designated review branch remained unchanged;
- the exact HEAD commit remained unchanged;
- the working tree remained clean;
- no repository mutation occurred during the review.

On PASS, state:

> The exact release candidate reviewed in this phase satisfies the defined EA-XYZ contract-audit freeze gate and is eligible to be frozen.

### BLOCKED criteria

Return `BLOCKED` if one or more material findings remain.

Also return `BLOCKED` if candidate identity or repository immutability cannot be established.

On BLOCKED, state:

> The release candidate is not eligible to be frozen. Remediation must occur outside Phase 7, followed by the applicable upstream reverification and a new pristine Phase-7 review of the resulting candidate.

---

# 13. STOPPING RULE

Once the report is complete:

STOP.

Do not begin remediation.

Do not propose patches unless necessary to explain the nature of a finding.

Do not alter the repository.

Do not initiate the next phase.

This phase exists solely to answer:

> Does this exact candidate, supported by this exact completed audit record, pass the EA-XYZ pristine adversarial freeze gate?

Answer that question rigorously and nothing more.
