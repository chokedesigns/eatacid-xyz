#!/usr/bin/env python3
"""Fail closed when the Phase 1 invariant denominator is not fully mapped."""

import json
import re
import sys
from pathlib import Path

ORDER = ["P", "N", "B", "S", "Bal", "Fail", "Evt", "Bat"]
ROWS = [
    "P N S", "P N S Bal Fail Evt", "P N S Bal Fail Evt",
    "P N B S Fail Evt Bat", "P N B S Fail Evt Bat", "P N B S Fail Evt",
    "P N B S Fail Evt Bat", "P N B S Bal Fail Evt Bat",
    "P N B S Bal Fail Evt Bat", "P N S Bal Fail Evt Bat",
    "P N B S Bal Fail Evt Bat", "P N B S Bal Fail Evt Bat",
    "P N B S Bal Fail Evt Bat", "P N B S Bal Fail Evt Bat",
    "P N B S Bal Fail Evt Bat", "P N B S Bal Evt Bat",
    "P N S Bal Fail Evt Bat", "P N B S Bal Fail Evt Bat",
    "P N S Bal Fail Evt", "P N B S Bal Fail Evt", "P N B S Bal Fail Evt",
    "P N B S Evt Bat", "P N B S Bal Fail Evt Bat", "P N S Bal Evt Bat",
    "P N S Bal Fail Evt Bat", "P N S Bal Fail Evt Bat"
]
REQUIRED = {
    "I-{:02d}".format(index + 1): row.split()
    for index, row in enumerate(ROWS)
}
TEST_RE = re.compile(r'@sp\.add_test\(name="([^"]+)"\)')


def fail(message):
    print("coverage-verifier: FAIL: " + message, file=sys.stderr)
    return 1


def main():
    folder = Path(__file__).resolve().parent
    try:
        manifest = json.loads((folder / "invariant-coverage.json").read_text(encoding="utf-8"))
        suite = (folder / "burn-redeem-correctness-suite.py").read_text(encoding="utf-8")
        implemented = set(TEST_RE.findall(suite))
        coverage = manifest["coverage"]
        if set(coverage) != set(REQUIRED):
            raise ValueError("invariant IDs differ from I-01..I-26")
        mapped = 0
        for invariant, required in REQUIRED.items():
            row = coverage[invariant]
            if row.get("obligations") != required:
                raise ValueError("{} obligations: expected {}, found {}".format(
                    invariant, required, row.get("obligations")
                ))
            tests = row.get("tests", [])
            if not tests:
                raise ValueError(invariant + " has no mapped tests")
            missing = set(tests) - implemented
            if missing:
                raise ValueError("{} names missing tests: {}".format(invariant, sorted(missing)))
            mapped += len(required)
        denominator = manifest.get("denominator", {})
        if denominator != {"invariants": 26, "obligations": 181, "entrypoints": 8}:
            raise ValueError("denominator metadata changed: {!r}".format(denominator))
        if mapped != 181:
            raise ValueError("mapped obligation count is {}, expected 181".format(mapped))
        expected_tests = {"T{:02d}_".format(index) for index in range(1, 14)}
        if len(implemented) != 13 or any(
            not any(name.startswith(prefix) for name in implemented)
            for prefix in expected_tests
        ):
            raise ValueError("implemented named-test set is not exactly T01-T13")
    except (OSError, KeyError, TypeError, ValueError, json.JSONDecodeError) as error:
        return fail(str(error))
    print("coverage-verifier: PASS: 26/26 invariants; 181/181 obligations; 13 tests")
    return 0


if __name__ == "__main__":
    sys.exit(main())
