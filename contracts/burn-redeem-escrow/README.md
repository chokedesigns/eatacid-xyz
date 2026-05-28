# Burn/Redeem Escrow Contract

This directory contains the legacy SmartPy source for the burn/redeem escrow contract.

## Active source

The active source-controlled contract artifact is:

```text
contracts/burn-redeem-escrow/smartpy/burn-redeem-escrow-smartpy.py
```

## Current workflow

This contract currently uses legacy SmartPy syntax.

The legacy source is not expected to run under the modern local `smartpy-tezos` toolchain.

Codex edits the legacy SmartPy source only during the current legacy phase.

Codex does not compile, generate, edit, or commit Michelson during normal legacy contract tickets.

## Manual compile/checkoff

After a SmartPy behavior patch is reviewed, the updated source is manually compiled through:

```text
legacy.smartpy.io
```

Manual compile and Michelson surface review are separate human/reviewer checkoff steps.

Raw Michelson is not part of the normal Codex ticket loop.

## Deployment artifacts

Final deployable Michelson should be generated manually from the finished legacy SmartPy source during deployment preparation.

Deployment notes belong under:

```text
contracts/burn-redeem-escrow/artifacts/deployment-notes/
```

Audit/check evidence belongs under:

```text
contracts/burn-redeem-escrow/artifacts/checks/
```

## Deferred modernization

Modern SmartPy migration is deferred until after the legacy contract checklist is complete.