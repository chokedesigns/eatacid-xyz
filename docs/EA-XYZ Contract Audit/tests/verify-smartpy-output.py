#!/usr/bin/env python3
"""Verify entrypoint surface plus exact committed events in SmartPy logs."""

import json
import re
import sys
from pathlib import Path

USER = "sp.address('tz1UDEFE7bCw8ckCyLpkuDSRg3FmF9qxKZvm')"
USER2 = "sp.address('tz1hWEG62fEobuBdUb9pToLuDnVF9326zvD7')"
K1 = "sp.address('KT1Tezooo1zzSmartPyzzSTATiCzzzyfC8eF')"
K2 = "sp.address('KT1Tezooo2zzSmartPyzzSTATiCzzzwqqQ4H')"


def ev(tag, payload):
    return (tag, payload)


TRADE_23 = ev(
    "TradeInitiated",
    "sp.record(burn_amount = 2, redeem_amount = 3, token_pair_id = 1, user = {})".format(USER)
)


# Exact payloads, multiplicity, and order for every selected marker. Empty means
# that the marked failed/backtracked transaction committed no event.
CASES = {
    "T02_privileged_authorization_and_paused_nontrade": {
        "T02_DEFAULT": [ev("XTZReceived", "sp.record(amount = sp.mutez(9))")],
        "T02_SET": [ev("TokenPairAdded", "sp.record(added_pairs = [1])")],
        "T02_UPDATE": [ev("TokenPairUpdated", "sp.record(token_pair_id = 1, updated_fields = ['burn_amount'])")],
        "T02_TOKEN": [ev("TokenTransferred", "sp.record(amount = 2, to_ = {}, token_contract = {}, token_id = 7)".format(USER, K1))],
        "T02_WITHDRAW": [ev("XTZWithdrawn", "sp.record(amount = sp.mutez(2), success = True)")],
        "T02_CLEANUP": [ev("TokenPairDeleted", "sp.record(failed_deletions = [], successful_deletions = [1])")],
        "T02_UNAUTH_SET": [], "T02_UNAUTH_UPDATE": [],
        "T02_UNAUTH_CLEANUP": [], "T02_UNAUTH_TOKEN": [],
        "T02_UNAUTH_WITHDRAW": [], "T02_UNAUTH_TOGGLE": [],
        "T02_INVALID_PRECEDENCE": [],
        "T02_TOGGLE": [ev("PauseStateToggled", "sp.record(paused = False)")],
    },
    "T04_pair_validation_and_add_atomicity": {
        **{"T04_" + name: [] for name in [
            "DUP_EXISTING", "ZERO_BURN", "ZERO_REDEEM", "SAME_ADDRESS",
            "DUP_BATCH", "LATE_INVALID", "MISSING", "UPDATE_ZERO_BURN",
            "UPDATE_ZERO_REDEEM", "UPDATE_SAME_ADDRESS"
        ]},
    },
    "T03_pair_lifecycle_cardinality_and_events": {
        "T03_SET_EMPTY": [ev("TokenPairAdded", "sp.record(added_pairs = [])")],
        "T03_ADD_MULTI": [ev("TokenPairAdded", "sp.record(added_pairs = [1, 0])")],
        "T03_UPDATE_1": [ev("TokenPairUpdated", "sp.record(token_pair_id = 1, updated_fields = ['burn_contract_address'])")],
        "T03_UPDATE_2": [ev("TokenPairUpdated", "sp.record(token_pair_id = 1, updated_fields = ['burn_token_id'])")],
        "T03_UPDATE_3": [ev("TokenPairUpdated", "sp.record(token_pair_id = 1, updated_fields = ['burn_amount'])")],
        "T03_UPDATE_4": [ev("TokenPairUpdated", "sp.record(token_pair_id = 1, updated_fields = ['redeem_contract_address'])")],
        "T03_UPDATE_5": [ev("TokenPairUpdated", "sp.record(token_pair_id = 1, updated_fields = ['redeem_token_id'])")],
        "T03_UPDATE_6": [ev("TokenPairUpdated", "sp.record(token_pair_id = 1, updated_fields = ['redeem_amount'])")],
        "T03_UPDATE_ALL": [ev("TokenPairUpdated", "sp.record(token_pair_id = 1, updated_fields = ['redeem_amount', 'redeem_token_id', 'redeem_contract_address', 'burn_amount', 'burn_token_id', 'burn_contract_address'])")],
        "T03_UPDATE_IDENTICAL": [],
        "T03_CLEANUP_EMPTY": [ev("TokenPairDeleted", "sp.record(failed_deletions = [], successful_deletions = [])")],
        "T03_CLEANUP_MIXED": [ev("TokenPairDeleted", "sp.record(failed_deletions = [1, 9], successful_deletions = [1])")],
        "T03_READD": [ev("TokenPairAdded", "sp.record(added_pairs = [1])")],
    },
    "T05_pause_and_trade_presence_validation": {
        "T05_PAUSED": [], "T05_EMPTY": [], "T05_MISSING_FIRST": [],
        "T05_MISSING_LATE": [], "T05_SUCCESS": [TRADE_23],
    },
    "T06_trade_term_and_wallet_binding": {
        **{"T06_" + name: [] for name in [
            "BURN_ADDRESS", "BURN_ID", "BURN_AMOUNT", "REDEEM_ADDRESS",
            "REDEEM_ID", "REDEEM_DECREASE", "REDEEM_INCREASE",
            "WALLET_FIRST", "WALLET_LATE", "TERM_LATE"
        ]},
        "T06_SUCCESS_BATCH": [TRADE_23, TRADE_23],
    },
    "T07_single_trade_operator_balances_and_custody": {
        "T07_ZERO_TOKEN": [], "T07_TOKEN_SHORT": [],
    },
    "T08_heterogeneous_batch_grouping_and_routing": {
        "T08_HETEROGENEOUS": [
            TRADE_23,
            ev("TradeInitiated", "sp.record(burn_amount = 5, redeem_amount = 1, token_pair_id = 2, user = {})".format(USER)),
            TRADE_23,
        ]
    },
    "T09_external_failure_atomicity_and_boundaries": {
        "T09_NO_OPERATOR": [], "T09_REVOKED_OPERATOR": [],
        "T09_BURN_SHORT": [], "T09_REDEEM_SHORT": [],
        "T09_REJECT_BURN": [], "T09_REJECT_REDEEM": [],
        "T09_REJECT_ADMIN": [],
    },
    "T10_repeated_trades_and_stale_quotes": {
        "T10_REVOKED_AFTER_SUCCESS": [], "T10_SHORT_AFTER_SUCCESS": [],
        "T10_STALE": [], "T10_PAUSED_AFTER_SUCCESS": [], "T10_DELETED": [],
    },
    "T11_tez_custody_and_withdrawal": {
        "T11_DEFAULT_MIN": [ev("XTZReceived", "sp.record(amount = sp.mutez(1))")],
        "T11_DEFAULT_LARGE": [ev("XTZReceived", "sp.record(amount = sp.tez(10))")],
        "T11_ZERO_DEFAULT": [],
        "T11_UNAUTH_WITHDRAW": [], "T11_ZERO_WITHDRAW": [],
        "T11_OVER_WITHDRAW": [],
        "T11_WITHDRAW_PARTIAL": [ev("XTZWithdrawn", "sp.record(amount = sp.mutez(8), success = True)")],
        "T11_WITHDRAW_FULL": [ev("XTZWithdrawn", "sp.record(amount = sp.tez(10), success = True)")],
    },
    "T12_fa2_interface_and_noop_trust_boundary": {
        "T12_NOOP_TRADE": [TRADE_23],
        "T12_NOOP_ADMIN": [ev("TokenTransferred", "sp.record(amount = 4, to_ = {}, token_contract = {}, token_id = 8)".format(USER2, K2))],
        "T12_BAD_ADMIN_INTERFACE": [], "T12_BAD_TRADE_INTERFACE": [],
    },
    "T13_event_surface_and_backtracking": {
        "T13_XTZ_RECEIVED": [ev("XTZReceived", "sp.record(amount = sp.mutez(5))")],
        "T13_PAIR_ADDED": [ev("TokenPairAdded", "sp.record(added_pairs = [1])")],
        "T13_PAIR_UPDATED": [ev("TokenPairUpdated", "sp.record(token_pair_id = 1, updated_fields = ['redeem_amount', 'burn_amount'])")],
        "T13_UPDATE_NOOP": [],
        "T13_TOKEN_TRANSFERRED": [ev("TokenTransferred", "sp.record(amount = 1, to_ = {}, token_contract = {}, token_id = 7)".format(USER2, K1))],
        "T13_TOKEN_BACKTRACK": [],
        "T13_PAUSE": [ev("PauseStateToggled", "sp.record(paused = False)")],
        "T13_TRADE_TWO": [
            ev("TradeInitiated", "sp.record(burn_amount = 4, redeem_amount = 6, token_pair_id = 1, user = {})".format(USER)),
            ev("TradeInitiated", "sp.record(burn_amount = 4, redeem_amount = 6, token_pair_id = 1, user = {})".format(USER)),
        ],
        "T13_PAIR_DELETED": [ev("TokenPairDeleted", "sp.record(failed_deletions = [1, 9], successful_deletions = [1])")],
        "T13_WITHDRAW": [ev("XTZWithdrawn", "sp.record(amount = sp.mutez(5), success = True)")],
    },
}

EVENT_RE = re.compile(r'^\s*\+ Event\(tag: "([^"]+)"\)\r?\n([^\r\n]+)', re.MULTILINE)
TOP_EXEC_RE = re.compile(r"^Executing (?!\(queue\))", re.MULTILINE)
ENTRYPOINTS = {
    "admin_transfer_token", "admin_withdraw_xtz", "cleanup_token_pairs", "default",
    "initiate_trade", "set_token_pairs", "toggle_pause", "update_token_pair"
}


def fail(message):
    print("event-verifier: FAIL: " + message, file=sys.stderr)
    return 1


def transaction_segment(log, marker):
    token = "h1: EVENT_CASE::" + marker
    if log.count(token) != 1:
        raise ValueError("expected exactly one " + token)
    tail = log.split(token, 1)[1]
    starts = list(TOP_EXEC_RE.finditer(tail))
    if not starts:
        raise ValueError("missing execution after " + token)
    start = starts[0].start()
    end = starts[1].start() if len(starts) > 1 else len(tail)
    return tail[start:end]


def collect_entrypoints(node, result):
    if node.get("prim") == "or":
        for child in node.get("args", []):
            collect_entrypoints(child, result)
        return
    annotations = [a for a in node.get("annots", []) if a.startswith("%")]
    if len(annotations) != 1:
        raise ValueError("parameter leaf lacks one entrypoint annotation: {!r}".format(node))
    result.add(annotations[0][1:])


def verify_surface(root):
    path = root / "T01_construction_and_entrypoint_surface" / "step_001_cont_0_contract.json"
    script = json.loads(path.read_text(encoding="utf-8"))
    parameter = next(item for item in script if item.get("prim") == "parameter")
    observed = set()
    collect_entrypoints(parameter["args"][0], observed)
    if observed != ENTRYPOINTS:
        raise ValueError("entrypoint surface: expected {!r}, observed {!r}".format(
            sorted(ENTRYPOINTS), sorted(observed)
        ))


def main():
    if len(sys.argv) != 2:
        return fail("usage: verify-smartpy-output.py OUTPUT_DIRECTORY")
    root = Path(sys.argv[1])
    try:
        verify_surface(root)
        verified = 0
        rollback_with_staged_event = 0
        for scenario, cases in CASES.items():
            log = (root / scenario / "log.txt").read_text(encoding="utf-8")
            for marker, expected in cases.items():
                segment = transaction_segment(log, marker)
                raw = [(tag, payload.strip()) for tag, payload in EVENT_RE.findall(segment)]
                failed = "Expected failure in transaction" in segment or "Expected exception" in segment
                observed = [] if failed else raw
                if observed != expected:
                    raise ValueError("{} {}: expected {!r}, observed {!r}".format(
                        scenario, marker, expected, observed
                    ))
                if failed and raw:
                    rollback_with_staged_event += 1
                verified += 1
        if rollback_with_staged_event < 1:
            raise ValueError("no downstream failure demonstrated event backtracking")
    except (OSError, ValueError, StopIteration, json.JSONDecodeError) as error:
        return fail(str(error))
    print("event-verifier: PASS: {} cases; 8 entrypoints; {} staged-event rollbacks".format(
        verified, rollback_with_staged_event
    ))
    return 0


if __name__ == "__main__":
    sys.exit(main())
