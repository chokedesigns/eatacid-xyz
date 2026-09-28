#!/usr/bin/env python3
"""Verify deterministic SmartPy event output for foundation cases."""

import re
import sys
from pathlib import Path


CASE = "FOUNDATION_PAUSE"
SCENARIO = "foundation_08_event_output"
EXPECTED = [("PauseStateToggled", "sp.record(paused = False)")]
EVENT_PATTERN = re.compile(
    r'^\s*\+ Event\(tag: "([^"]+)"\)\r?\n([^\r\n]+)',
    re.MULTILINE
)


def fail(message):
    print("event-verifier: FAIL: " + message, file=sys.stderr)
    return 1


def main():
    if len(sys.argv) != 2:
        return fail("usage: verify-smartpy-output.py OUTPUT_DIRECTORY")

    log_path = Path(sys.argv[1]) / SCENARIO / "log.txt"
    if not log_path.is_file():
        return fail("missing scenario log: " + str(log_path))

    log = log_path.read_text(encoding="utf-8")
    marker = "h1: EVENT_CASE::" + CASE
    if log.count(marker) != 1:
        return fail("expected exactly one " + marker)

    segment = log.split(marker, 1)[1]
    next_marker = segment.find("EVENT_CASE::")
    if next_marker >= 0:
        segment = segment[:next_marker]

    observed = [
        (tag, payload.strip())
        for tag, payload in EVENT_PATTERN.findall(segment)
    ]
    if observed != EXPECTED:
        return fail(
            "event mismatch; expected {!r}, observed {!r}".format(
                EXPECTED,
                observed
            )
        )

    print("event-verifier: PASS: {} {} x{}".format(
        CASE,
        EXPECTED[0][0],
        len(observed)
    ))
    return 0


if __name__ == "__main__":
    sys.exit(main())
