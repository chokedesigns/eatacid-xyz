import smartpy as sp

target = sp.io.import_script_from_url(
    "file:docs/EA-XYZ Contract Audit/source/burn-redeem-escrow-audit.py"
)
FA2_TRANSFER_TYPE = sp.TList(sp.TRecord(
    from_=sp.TAddress,
    txs=sp.TList(sp.TRecord(
        to_=sp.TAddress,
        token_id_amount=sp.TPair(sp.TNat, sp.TNat)
    ).layout(("to_", "token_id_amount")))
).layout(("from_", "txs")))
OPERATOR_KEY_TYPE = sp.TRecord(
    owner=sp.TAddress, operator=sp.TAddress, token_id=sp.TNat
).layout(("owner", ("operator", "token_id")))
TRANSFER_CALL_TYPE = sp.TRecord(
    caller=sp.TAddress, amount=sp.TMutez, transfers=FA2_TRANSFER_TYPE
).layout(("caller", ("amount", "transfers")))
TRANSFER_ROW_TYPE = sp.TRecord(
    from_=sp.TAddress, to_=sp.TAddress, token_id=sp.TNat, amount=sp.TNat
).layout(("from_", ("to_", ("token_id", "amount"))))


class ConformingFA2(sp.Contract):
    def __init__(self):
        self.init(
            ledger=sp.big_map(tkey=sp.TPair(sp.TAddress, sp.TNat), tvalue=sp.TNat),
            operators=sp.big_map(tkey=OPERATOR_KEY_TYPE, tvalue=sp.TUnit),
            calls=sp.big_map(tkey=sp.TNat, tvalue=TRANSFER_CALL_TYPE),
            call_rows=sp.big_map(tkey=sp.TPair(sp.TNat, sp.TNat), tvalue=TRANSFER_ROW_TYPE),
            call_row_counts=sp.big_map(tkey=sp.TNat, tvalue=sp.TNat),
            call_count=sp.nat(0)
        )

    @sp.entry_point
    def mint(self, p):
        sp.set_type(p, sp.TRecord(owner=sp.TAddress, token_id=sp.TNat, amount=sp.TNat))
        key = sp.pair(p.owner, p.token_id)
        self.data.ledger[key] = self.data.ledger.get(key, 0) + p.amount

    @sp.entry_point
    def add_operator(self, p):
        sp.set_type(p, sp.TRecord(operator=sp.TAddress, token_id=sp.TNat))
        self.data.operators[op_key(sp.sender, p.operator, p.token_id)] = sp.unit

    @sp.entry_point
    def remove_operator(self, p):
        sp.set_type(p, sp.TRecord(operator=sp.TAddress, token_id=sp.TNat))
        key = op_key(sp.sender, p.operator, p.token_id)
        sp.if self.data.operators.contains(key):
            del self.data.operators[key]

    @sp.entry_point
    def transfer(self, p):
        sp.set_type(p, FA2_TRANSFER_TYPE)
        call_index = sp.local("call_index", self.data.call_count)
        row_index = sp.local("row_index", sp.nat(0))
        self.data.calls[call_index.value] = sp.record(
            caller=sp.sender, amount=sp.amount, transfers=p
        )
        self.data.call_count += 1
        sp.for transfer_op in p:
            sp.for tx in transfer_op.txs:
                token_id, amount = sp.match_pair(tx.token_id_amount)
                self.data.call_rows[sp.pair(call_index.value, row_index.value)] = sp.record(
                    from_=transfer_op.from_, to_=tx.to_, token_id=token_id, amount=amount
                )
                row_index.value += 1
                sp.verify(
                    (sp.sender == transfer_op.from_) |
                    self.data.operators.contains(op_key(
                        transfer_op.from_, sp.sender, token_id
                    )), "FA2_NOT_OPERATOR"
                )
                source = sp.pair(transfer_op.from_, token_id)
                destination = sp.pair(tx.to_, token_id)
                current = self.data.ledger.get(source, 0)
                sp.verify(current >= amount, "FA2_INSUFFICIENT_BALANCE")
                self.data.ledger[source] = sp.as_nat(current - amount)
                self.data.ledger[destination] = self.data.ledger.get(destination, 0) + amount
        self.data.call_row_counts[call_index.value] = row_index.value


class RejectingFA2(sp.Contract):
    def __init__(self):
        self.init(marker=sp.unit)

    @sp.entry_point
    def transfer(self, p):
        sp.set_type(p, FA2_TRANSFER_TYPE)
        sp.failwith("FA2_REJECTED")


class AcceptingNoOpFA2(sp.Contract):
    def __init__(self):
        self.init(
            ledger=sp.big_map(tkey=sp.TPair(sp.TAddress, sp.TNat), tvalue=sp.TNat),
            calls=sp.big_map(tkey=sp.TNat, tvalue=TRANSFER_CALL_TYPE),
            call_rows=sp.big_map(tkey=sp.TPair(sp.TNat, sp.TNat), tvalue=TRANSFER_ROW_TYPE),
            call_row_counts=sp.big_map(tkey=sp.TNat, tvalue=sp.TNat),
            call_count=sp.nat(0)
        )

    @sp.entry_point
    def mint(self, p):
        sp.set_type(p, sp.TRecord(owner=sp.TAddress, token_id=sp.TNat, amount=sp.TNat))
        key = sp.pair(p.owner, p.token_id)
        self.data.ledger[key] = self.data.ledger.get(key, 0) + p.amount

    @sp.entry_point
    def transfer(self, p):
        sp.set_type(p, FA2_TRANSFER_TYPE)
        call_index = sp.local("call_index", self.data.call_count)
        row_index = sp.local("row_index", sp.nat(0))
        self.data.calls[call_index.value] = sp.record(
            caller=sp.sender, amount=sp.amount, transfers=p
        )
        self.data.call_count += 1
        sp.for transfer_op in p:
            sp.for tx in transfer_op.txs:
                token_id, amount = sp.match_pair(tx.token_id_amount)
                self.data.call_rows[sp.pair(call_index.value, row_index.value)] = sp.record(
                    from_=transfer_op.from_, to_=tx.to_, token_id=token_id, amount=amount
                )
                row_index.value += 1
        self.data.call_row_counts[call_index.value] = row_index.value


class AdminProxy(sp.Contract):
    def __init__(self):
        self.init(marker=sp.unit)

    @sp.entry_point
    def withdraw(self, p):
        sp.set_type(p, sp.TRecord(escrow=sp.TAddress, amount=sp.TMutez))
        c = sp.contract(sp.TRecord(amount=sp.TMutez), p.escrow,
                        entry_point="admin_withdraw_xtz").open_some()
        sp.transfer(sp.record(amount=p.amount), sp.mutez(0), c)

    @sp.entry_point
    def default(self):
        pass


def actors():
    return {
        "admin": sp.test_account("Admin"), "user": sp.test_account("UserA"),
        "user2": sp.test_account("UserB"), "outsider": sp.test_account("Outsider"),
        "burn": sp.test_account("BurnSink")
    }


def deploy(s, c):
    s += c
    return c


def escrow(s, a, admin=None):
    return deploy(s, target.BurnRedeemEscrow(
        admin=a["admin"].address if admin is None else admin,
        initial_burn_address=a["burn"].address
    ))


def op_key(owner, operator, token_id):
    return sp.record(owner=owner, operator=operator, token_id=token_id)


def mint(s, fa2, owner, token_id, amount):
    s += fa2.mint(owner=owner, token_id=token_id, amount=amount).run(sender=owner)


def operator(s, fa2, owner, e, token_id, enabled=True):
    ep = fa2.add_operator if enabled else fa2.remove_operator
    s += ep(operator=e.address, token_id=token_id).run(sender=owner)


def pair(pid, burn, redeem, burn_id=7, burn_amount=2, redeem_id=8, redeem_amount=3):
    return sp.record(
        token_pair_id=pid, burn_contract_address=burn.address,
        burn_token_id=burn_id, burn_amount=burn_amount,
        redeem_contract_address=redeem.address, redeem_token_id=redeem_id,
        redeem_amount=redeem_amount
    )


def terms(pid, wallet, burn, burn_id, burn_amount, redeem, redeem_id, redeem_amount):
    return sp.record(
        token_pair_id=pid, user_wallet=wallet,
        burn_contract_address=burn, burn_token_id=burn_id, burn_amount=burn_amount,
        redeem_contract_address=redeem, redeem_token_id=redeem_id,
        redeem_amount=redeem_amount
    )


def trade(p, wallet):
    return terms(p.token_pair_id, wallet, p.burn_contract_address,
                 p.burn_token_id, p.burn_amount, p.redeem_contract_address,
                 p.redeem_token_id, p.redeem_amount)


def transfer_rows(rows):
    return sp.list([sp.record(
        from_=source,
        txs=sp.list([sp.record(to_=destination,
                               token_id_amount=sp.pair(token_id, amount))])
    ) for source, destination, token_id, amount in rows])


def transfer(source, destination, token_id, amount):
    return transfer_rows([(source, destination, token_id, amount)])


def add(s, e, sender, pairs, amount=sp.mutez(0)):
    s += e.set_token_pairs(token_pairs=sp.list(pairs)).run(sender=sender, amount=amount)


def unpause(s, e, admin):
    s += e.toggle_pause().run(sender=admin)


def balance(fa2, owner, token_id):
    return fa2.data.ledger.get(sp.pair(owner, token_id), 0)


def check_balance(s, fa2, owner, token_id, expected):
    s.verify(balance(fa2, owner, token_id) == expected)


def check_pair(s, e, p):
    s.verify(e.data.token_mapping.contains(p.token_pair_id))
    q = e.data.token_mapping[p.token_pair_id]
    s.verify(q.burn_contract_address == p.burn_contract_address)
    s.verify(q.burn_token_id == p.burn_token_id)
    s.verify(q.burn_amount == p.burn_amount)
    s.verify(q.redeem_contract_address == p.redeem_contract_address)
    s.verify(q.redeem_token_id == p.redeem_token_id)
    s.verify(q.redeem_amount == p.redeem_amount)


def check_core(s, e, a, paused, size, admin=None):
    s.verify(e.data.admin == (a["admin"].address if admin is None else admin))
    s.verify(e.data.burn_address == a["burn"].address)
    s.verify(e.data.paused == paused)
    s.verify(e.data.token_mapping_size == size)


def check_call(s, fa2, index, caller, expected_rows):
    s.verify(fa2.data.calls[index].caller == caller)
    s.verify(fa2.data.calls[index].amount == sp.mutez(0))
    s.verify(fa2.data.call_row_counts[index] == len(expected_rows))
    for row_index, (source, destination, token_id, amount) in enumerate(expected_rows):
        row = fa2.data.call_rows[sp.pair(index, row_index)]
        s.verify(row.from_ == source)
        s.verify(row.to_ == destination)
        s.verify(row.token_id == token_id)
        s.verify(row.amount == amount)


def event(s, name):
    s.h1("EVENT_CASE::" + name)


@sp.add_test(name="T01_construction_and_entrypoint_surface")
def t01():
    s, a = sp.test_scenario(), actors()
    e = escrow(s, a)
    b, r = deploy(s, ConformingFA2()), deploy(s, ConformingFA2())
    p = pair(0, b, r, 0, 1, 0, 1)
    check_core(s, e, a, True, 0)
    add(s, e, a["admin"], [p])
    s += e.update_token_pair(p).run(sender=a["admin"])
    s += e.cleanup_token_pairs(token_pair_ids=sp.list([0])).run(sender=a["admin"])
    s += e.default().run(sender=a["user"], amount=sp.mutez(1))
    s += e.toggle_pause().run(sender=a["admin"])
    check_core(s, e, a, False, 0)


@sp.add_test(name="T02_privileged_authorization_and_paused_nontrade")
def t02():
    s, a = sp.test_scenario(), actors()
    e = escrow(s, a)
    b, r = deploy(s, ConformingFA2()), deploy(s, ConformingFA2())
    p = pair(1, b, r)
    mint(s, b, e.address, 7, 10)
    event(s, "T02_DEFAULT")
    s += e.default().run(sender=a["user"], amount=sp.mutez(9))
    event(s, "T02_SET")
    add(s, e, a["admin"], [p])
    changed = pair(1, b, r, burn_amount=4)
    event(s, "T02_UPDATE")
    s += e.update_token_pair(changed).run(sender=a["admin"])
    event(s, "T02_TOKEN")
    s += e.admin_transfer_token(token_contract=b.address, token_id=7,
                                to_=a["user"].address, amount=2).run(sender=a["admin"])
    event(s, "T02_WITHDRAW")
    s += e.admin_withdraw_xtz(amount=sp.mutez(2)).run(sender=a["admin"])
    event(s, "T02_CLEANUP")
    s += e.cleanup_token_pairs(token_pair_ids=sp.list([1])).run(sender=a["admin"])
    check_core(s, e, a, True, 0)
    s.verify(e.balance == sp.mutez(7))
    check_balance(s, b, e.address, 7, 8)
    check_balance(s, b, a["user"].address, 7, 2)

    # Exact outsider failures for all six privileged entrypoints.
    failures = [
        ("SET", e.set_token_pairs(token_pairs=sp.list([p]))),
        ("UPDATE", e.update_token_pair(p)),
        ("CLEANUP", e.cleanup_token_pairs(token_pair_ids=sp.list([1]))),
        ("TOKEN", e.admin_transfer_token(token_contract=b.address, token_id=7,
                                          to_=a["outsider"].address, amount=1)),
        ("WITHDRAW", e.admin_withdraw_xtz(amount=sp.mutez(1))),
        ("TOGGLE", e.toggle_pause())
    ]
    for name, call in failures:
        event(s, "T02_UNAUTH_" + name)
        s += call.run(sender=a["outsider"], valid=False,
                      exception="Error: Unauthorized.")
    check_core(s, e, a, True, 0)
    s.verify(e.balance == sp.mutez(7))
    check_balance(s, b, e.address, 7, 8)
    check_balance(s, b, a["outsider"].address, 7, 0)
    s.verify(b.data.call_count == 1)
    invalid = pair(9, b, r, burn_amount=0)
    event(s, "T02_INVALID_PRECEDENCE")
    s += e.update_token_pair(invalid).run(
        sender=a["outsider"], valid=False, exception="Error: Invalid burn amount."
    )
    event(s, "T02_TOGGLE")
    s += e.toggle_pause().run(sender=a["admin"])
    check_core(s, e, a, False, 0)


@sp.add_test(name="T03_pair_lifecycle_cardinality_and_events")
def t03():
    s, a = sp.test_scenario(), actors()
    e = escrow(s, a)
    f1, f2, f3 = (deploy(s, ConformingFA2()) for _ in range(3))
    p0, p1 = pair(0, f1, f2, 0, 1, 0, 1), pair(1, f1, f2)
    event(s, "T03_SET_EMPTY")
    add(s, e, a["admin"], [])
    check_core(s, e, a, True, 0)
    event(s, "T03_ADD_MULTI")
    add(s, e, a["admin"], [p0, p1])
    check_pair(s, e, p0); check_pair(s, e, p1)
    check_core(s, e, a, True, 2)
    updates = [
        pair(1, f3, f2), pair(1, f3, f2, burn_id=17),
        pair(1, f3, f2, 17, 5), pair(1, f3, f1, 17, 5),
        pair(1, f3, f1, 17, 5, 18), pair(1, f3, f1, 17, 5, 18, 6)
    ]
    for i, p in enumerate(updates):
        event(s, "T03_UPDATE_" + str(i + 1))
        s += e.update_token_pair(p).run(sender=a["admin"])
        check_pair(s, e, p); s.verify(e.data.token_mapping_size == 2)
    all_changed = pair(1, f1, f2, 27, 7, 28, 8)
    event(s, "T03_UPDATE_ALL")
    s += e.update_token_pair(all_changed).run(sender=a["admin"])
    event(s, "T03_UPDATE_IDENTICAL")
    s += e.update_token_pair(all_changed).run(sender=a["admin"])
    check_pair(s, e, all_changed); s.verify(e.data.token_mapping_size == 2)
    event(s, "T03_CLEANUP_EMPTY")
    s += e.cleanup_token_pairs(token_pair_ids=sp.list([])).run(sender=a["admin"])
    event(s, "T03_CLEANUP_MIXED")
    s += e.cleanup_token_pairs(token_pair_ids=sp.list([9, 1, 1])).run(sender=a["admin"])
    s.verify(e.data.token_mapping.contains(0))
    s.verify(~e.data.token_mapping.contains(1))
    s.verify(~e.data.token_mapping.contains(9))
    s.verify(e.data.token_mapping_size == 1)
    event(s, "T03_READD")
    add(s, e, a["admin"], [p1])
    check_pair(s, e, p1); check_core(s, e, a, True, 2)


@sp.add_test(name="T04_pair_validation_and_add_atomicity")
def t04():
    s, a = sp.test_scenario(), actors()
    e = escrow(s, a)
    f1, f2 = deploy(s, ConformingFA2()), deploy(s, ConformingFA2())
    good = pair(1, f1, f2)
    add(s, e, a["admin"], [good])
    cases = [
        ("DUP_EXISTING", [good], "DUPLICATE_TOKEN_PAIR_ID"),
        ("ZERO_BURN", [pair(2, f1, f2, burn_amount=0)], "INVALID_BURN_AMOUNT"),
        ("ZERO_REDEEM", [pair(2, f1, f2, redeem_amount=0)], "INVALID_REDEEM_AMOUNT"),
        ("SAME_ADDRESS", [pair(2, f1, f1)], "BURN_REDEEM_CONTRACT_MISMATCH"),
        ("DUP_BATCH", [pair(2, f1, f2), pair(2, f1, f2)], "DUPLICATE_TOKEN_PAIR_ID"),
        ("LATE_INVALID", [pair(2, f1, f2), pair(3, f1, f2, redeem_amount=0)], "INVALID_REDEEM_AMOUNT")
    ]
    for name, pairs, error in cases:
        event(s, "T04_" + name)
        s += e.set_token_pairs(token_pairs=sp.list(pairs)).run(
            sender=a["admin"], valid=False, exception=error
        )
        check_pair(s, e, good)
        s.verify(~e.data.token_mapping.contains(2))
        s.verify(~e.data.token_mapping.contains(3))
        check_core(s, e, a, True, 1)
    bad_updates = [
        ("MISSING", pair(9, f1, f2), "Error: Token pair not found."),
        ("UPDATE_ZERO_BURN", pair(1, f1, f2, burn_amount=0), "Error: Invalid burn amount."),
        ("UPDATE_ZERO_REDEEM", pair(1, f1, f2, redeem_amount=0), "Error: Invalid redeem amount."),
        ("UPDATE_SAME_ADDRESS", pair(1, f1, f1), "Error: Burn and Redeem contract addresses cannot be the same.")
    ]
    for name, p, error in bad_updates:
        event(s, "T04_" + name)
        s += e.update_token_pair(p).run(sender=a["admin"], valid=False, exception=error)
        check_pair(s, e, good); s.verify(e.data.token_mapping_size == 1)


@sp.add_test(name="T05_pause_and_trade_presence_validation")
def t05():
    s, a = sp.test_scenario(), actors()
    e = escrow(s, a)
    b, r = deploy(s, ConformingFA2()), deploy(s, ConformingFA2())
    p = pair(1, b, r); add(s, e, a["admin"], [p])
    mint(s, b, a["user"].address, 7, 4)
    operator(s, b, a["user"], e, 7)
    mint(s, r, e.address, 8, 6)
    good = trade(p, a["user"].address)
    event(s, "T05_PAUSED")
    s += e.initiate_trade(trades=sp.list([good])).run(
        sender=a["user"], valid=False, exception="Error: Contract is paused."
    )
    check_balance(s, b, a["user"].address, 7, 4)
    check_balance(s, r, e.address, 8, 6)
    s.verify(b.data.call_count == 0); s.verify(r.data.call_count == 0)
    check_core(s, e, a, True, 1); check_pair(s, e, p)
    unpause(s, e, a["admin"])
    event(s, "T05_EMPTY")
    s += e.initiate_trade(trades=sp.list([])).run(
        sender=a["user"], valid=False, exception="EMPTY_TRADE_LIST"
    )
    missing = terms(9, a["user"].address, b.address, 7, 2, r.address, 8, 3)
    event(s, "T05_MISSING_FIRST")
    s += e.initiate_trade(trades=sp.list([missing])).run(
        sender=a["user"], valid=False, exception="Error: Token pair not found."
    )
    event(s, "T05_MISSING_LATE")
    s += e.initiate_trade(trades=sp.list([good, missing])).run(
        sender=a["user"], valid=False, exception="Error: Token pair not found."
    )
    check_balance(s, b, a["user"].address, 7, 4)
    check_balance(s, r, e.address, 8, 6)
    s.verify(b.data.call_count == 0); s.verify(r.data.call_count == 0)
    event(s, "T05_SUCCESS")
    s += e.initiate_trade(trades=sp.list([good])).run(sender=a["user"])
    check_balance(s, b, a["user"].address, 7, 2)
    check_balance(s, b, a["burn"].address, 7, 2)
    check_balance(s, r, e.address, 8, 3)
    check_balance(s, r, a["user"].address, 8, 3)
    check_core(s, e, a, False, 1); check_pair(s, e, p)


@sp.add_test(name="T06_trade_term_and_wallet_binding")
def t06():
    s, a = sp.test_scenario(), actors()
    e = escrow(s, a)
    b, r, d = (deploy(s, ConformingFA2()) for _ in range(3))
    p = pair(1, b, r); add(s, e, a["admin"], [p]); unpause(s, e, a["admin"])
    mint(s, b, a["user"].address, 7, 20); operator(s, b, a["user"], e, 7)
    mint(s, r, e.address, 8, 30)
    good = trade(p, a["user"].address)
    mismatches = [
        ("BURN_ADDRESS", terms(1, a["user"].address, d.address, 7, 2, r.address, 8, 3)),
        ("BURN_ID", terms(1, a["user"].address, b.address, 17, 2, r.address, 8, 3)),
        ("BURN_AMOUNT", terms(1, a["user"].address, b.address, 7, 1, r.address, 8, 3)),
        ("REDEEM_ADDRESS", terms(1, a["user"].address, b.address, 7, 2, d.address, 8, 3)),
        ("REDEEM_ID", terms(1, a["user"].address, b.address, 7, 2, r.address, 18, 3)),
        ("REDEEM_DECREASE", terms(1, a["user"].address, b.address, 7, 2, r.address, 8, 2)),
        ("REDEEM_INCREASE", terms(1, a["user"].address, b.address, 7, 2, r.address, 8, 4))
    ]
    for name, bad in mismatches:
        event(s, "T06_" + name)
        s += e.initiate_trade(trades=sp.list([bad])).run(
            sender=a["user"], valid=False, exception="Error: Invalid token parameters."
        )
        check_balance(s, b, a["user"].address, 7, 20)
        check_balance(s, r, e.address, 8, 30)
        s.verify(b.data.call_count == 0); s.verify(r.data.call_count == 0)
        check_pair(s, e, p)
    foreign = trade(p, a["user2"].address)
    for name, rows in [("WALLET_FIRST", [foreign]), ("WALLET_LATE", [good, foreign])]:
        event(s, "T06_" + name)
        s += e.initiate_trade(trades=sp.list(rows)).run(
            sender=a["user"], valid=False,
            exception="Error: Sender does not match user wallet."
        )
    event(s, "T06_TERM_LATE")
    s += e.initiate_trade(trades=sp.list([good, mismatches[1][1]])).run(
        sender=a["user"], valid=False, exception="Error: Invalid token parameters."
    )
    check_balance(s, b, a["user"].address, 7, 20)
    check_balance(s, r, e.address, 8, 30)
    s.verify(b.data.call_count == 0); s.verify(r.data.call_count == 0)
    event(s, "T06_SUCCESS_BATCH")
    s += e.initiate_trade(trades=sp.list([good, good])).run(sender=a["user"])
    check_balance(s, b, a["user"].address, 7, 16)
    check_balance(s, b, a["burn"].address, 7, 4)
    check_balance(s, r, e.address, 8, 24)
    check_balance(s, r, a["user"].address, 8, 6)
    burn_rows = [(a["user"].address, a["burn"].address, 7, 2)] * 2
    redeem_rows = [(e.address, a["user"].address, 8, 3)] * 2
    check_call(s, b, 0, e.address, burn_rows)
    check_call(s, r, 0, e.address, redeem_rows)
    check_core(s, e, a, False, 1); check_pair(s, e, p)


@sp.add_test(name="T07_single_trade_operator_balances_and_custody")
def t07():
    s, a = sp.test_scenario(), actors()
    e = escrow(s, a)
    b, r = deploy(s, ConformingFA2()), deploy(s, ConformingFA2())
    p = pair(1, b, r); add(s, e, a["admin"], [p]); unpause(s, e, a["admin"])
    mint(s, b, a["user"].address, 7, 2); operator(s, b, a["user"], e, 7)
    mint(s, r, e.address, 8, 6)
    s += e.initiate_trade(trades=sp.list([trade(p, a["user"].address)])).run(sender=a["user"])
    for fa2, owner, token_id, expected in [
        (b, a["user"].address, 7, 0), (b, a["burn"].address, 7, 2),
        (b, e.address, 7, 0), (r, e.address, 8, 3),
        (r, a["user"].address, 8, 3), (r, a["burn"].address, 8, 0)
    ]: check_balance(s, fa2, owner, token_id, expected)
    check_call(s, b, 0, e.address, [(a["user"].address, a["burn"].address, 7, 2)])
    check_call(s, r, 0, e.address, [(e.address, a["user"].address, 8, 3)])
    s.verify(b.data.operators.contains(op_key(a["user"].address, e.address, 7)))
    event(s, "T07_ZERO_TOKEN")
    s += e.admin_transfer_token(token_contract=r.address, token_id=8,
                                to_=a["user2"].address, amount=0).run(
        sender=a["admin"], valid=False,
        exception="Error: Amount must be greater than zero."
    )
    event(s, "T07_TOKEN_SHORT")
    s += e.admin_transfer_token(token_contract=r.address, token_id=8,
                                to_=a["user2"].address, amount=4).run(
        sender=a["admin"], valid=False, exception="FA2_INSUFFICIENT_BALANCE"
    )
    check_balance(s, r, e.address, 8, 3)
    check_balance(s, r, a["user2"].address, 8, 0)
    s.verify(r.data.call_count == 1)
    s += e.admin_transfer_token(token_contract=r.address, token_id=8,
                                to_=a["user2"].address, amount=3).run(sender=a["admin"])
    check_balance(s, r, e.address, 8, 0); check_balance(s, r, a["user2"].address, 8, 3)
    check_call(s, r, 1, e.address, [(e.address, a["user2"].address, 8, 3)])
    check_core(s, e, a, False, 1); check_pair(s, e, p)


@sp.add_test(name="T08_heterogeneous_batch_grouping_and_routing")
def t08():
    s, a = sp.test_scenario(), actors()
    e = escrow(s, a)
    b1, r1, b2, r2 = (deploy(s, ConformingFA2()) for _ in range(4))
    p1, p2 = pair(1, b1, r1), pair(2, b2, r2, 17, 5, 18, 1)
    add(s, e, a["admin"], [p1, p2]); unpause(s, e, a["admin"])
    mint(s, b1, a["user"].address, 7, 4); mint(s, b1, a["user"].address, 99, 11)
    mint(s, b2, a["user"].address, 17, 5)
    operator(s, b1, a["user"], e, 7); operator(s, b2, a["user"], e, 17)
    mint(s, r1, e.address, 8, 6); mint(s, r1, e.address, 99, 12)
    mint(s, r2, e.address, 18, 1)
    event(s, "T08_HETEROGENEOUS")
    s += e.initiate_trade(trades=sp.list([
        trade(p1, a["user"].address), trade(p2, a["user"].address),
        trade(p1, a["user"].address)
    ])).run(sender=a["user"])
    checks = [
        (b1, a["user"].address, 7, 0), (b1, a["burn"].address, 7, 4),
        (b2, a["user"].address, 17, 0), (b2, a["burn"].address, 17, 5),
        (r1, e.address, 8, 0), (r1, a["user"].address, 8, 6),
        (r2, e.address, 18, 0), (r2, a["user"].address, 18, 1),
        (b1, a["user"].address, 99, 11), (r1, e.address, 99, 12)
    ]
    for row in checks: check_balance(s, *row)
    for fa2 in [b1, b2, r1, r2]: s.verify(fa2.data.call_count == 1)
    check_call(s, b1, 0, e.address, [(a["user"].address, a["burn"].address, 7, 2)] * 2)
    check_call(s, b2, 0, e.address, [(a["user"].address, a["burn"].address, 17, 5)])
    check_call(s, r1, 0, e.address, [(e.address, a["user"].address, 8, 3)] * 2)
    check_call(s, r2, 0, e.address, [(e.address, a["user"].address, 18, 1)])
    check_core(s, e, a, False, 2); check_pair(s, e, p1); check_pair(s, e, p2)


@sp.add_test(name="T09_external_failure_atomicity_and_boundaries")
def t09():
    s, a = sp.test_scenario(), actors()
    e = escrow(s, a)
    b, r = deploy(s, ConformingFA2()), deploy(s, ConformingFA2())
    reject_b, reject_r = deploy(s, RejectingFA2()), deploy(s, RejectingFA2())
    p = pair(1, b, r); add(s, e, a["admin"], [p]); unpause(s, e, a["admin"])
    mint(s, b, a["user"].address, 7, 4); mint(s, r, e.address, 8, 6)
    t = trade(p, a["user"].address)
    for name in ["NO_OPERATOR"]:
        event(s, "T09_" + name)
        s += e.initiate_trade(trades=sp.list([t])).run(
            sender=a["user"], valid=False, exception="FA2_NOT_OPERATOR"
        )
    operator(s, b, a["user"], e, 7); operator(s, b, a["user"], e, 7, False)
    event(s, "T09_REVOKED_OPERATOR")
    s += e.initiate_trade(trades=sp.list([t])).run(
        sender=a["user"], valid=False, exception="FA2_NOT_OPERATOR"
    )
    check_balance(s, b, a["user"].address, 7, 4)
    check_balance(s, r, e.address, 8, 6)
    s.verify(b.data.call_count == 0); s.verify(r.data.call_count == 0)
    operator(s, b, a["user"], e, 7)
    # Aggregate burn one short.
    s += b.transfer(transfer(a["user"].address, a["user2"].address, 7, 1)).run(sender=a["user"])
    event(s, "T09_BURN_SHORT")
    s += e.initiate_trade(trades=sp.list([t, t])).run(
        sender=a["user"], valid=False, exception="FA2_INSUFFICIENT_BALANCE"
    )
    check_balance(s, b, a["user"].address, 7, 3)
    check_balance(s, b, a["burn"].address, 7, 0)
    check_balance(s, r, e.address, 8, 6)
    s.verify(b.data.call_count == 1); s.verify(r.data.call_count == 0)
    mint(s, b, a["user"].address, 7, 1)
    # Aggregate redeem inventory one short; burn and attached tez must roll back.
    s += r.transfer(transfer(e.address, a["user2"].address, 8, 1)).run(sender=e.address)
    s.verify(e.balance == sp.mutez(0))
    event(s, "T09_REDEEM_SHORT")
    s += e.initiate_trade(trades=sp.list([t, t])).run(
        sender=a["user"], amount=sp.mutez(7), valid=False,
        exception="FA2_INSUFFICIENT_BALANCE"
    )
    s.verify(e.balance == sp.mutez(0))
    check_core(s, e, a, False, 1); check_pair(s, e, p)
    check_balance(s, b, a["user"].address, 7, 4)
    check_balance(s, b, a["burn"].address, 7, 0)
    check_balance(s, r, e.address, 8, 5)
    check_balance(s, r, a["user"].address, 8, 0)
    s.verify(b.data.call_count == 1); s.verify(r.data.call_count == 1)
    mint(s, r, e.address, 8, 1)
    pb, pr = pair(2, reject_b, r), pair(3, b, reject_r)
    add(s, e, a["admin"], [pb, pr])
    event(s, "T09_REJECT_BURN")
    s += e.initiate_trade(trades=sp.list([
        t, trade(pb, a["user"].address)
    ])).run(
        sender=a["user"], valid=False, exception="FA2_REJECTED"
    )
    event(s, "T09_REJECT_REDEEM")
    s += e.initiate_trade(trades=sp.list([
        t, trade(pr, a["user"].address)
    ])).run(
        sender=a["user"], valid=False, exception="FA2_REJECTED"
    )
    event(s, "T09_REJECT_ADMIN")
    s += e.admin_transfer_token(token_contract=reject_r.address, token_id=8,
                                to_=a["user"].address, amount=1).run(
        sender=a["admin"], valid=False, exception="FA2_REJECTED"
    )
    check_balance(s, b, a["user"].address, 7, 4)
    check_balance(s, b, a["burn"].address, 7, 0)
    check_balance(s, r, e.address, 8, 6)
    s.verify(b.data.call_count == 1); s.verify(r.data.call_count == 1)

    # Minimum and feasible-large exact balances both deplete completely.
    big = 2 ** 60
    pmin = pair(4, b, r, 0, 1, 0, 1)
    pbig = pair(5, b, r, big, big, big, big)
    add(s, e, a["admin"], [pmin, pbig])
    mint(s, b, a["user"].address, 0, 1); mint(s, r, e.address, 0, 1)
    operator(s, b, a["user"], e, 0)
    mint(s, b, a["user"].address, big, big); mint(s, r, e.address, big, big)
    operator(s, b, a["user"], e, big)
    s += e.initiate_trade(trades=sp.list([
        trade(pmin, a["user"].address), trade(pbig, a["user"].address)
    ])).run(sender=a["user"])
    for fa2, owner, token_id, expected in [
        (b, a["user"].address, 0, 0), (r, e.address, 0, 0),
        (b, a["user"].address, big, 0), (b, a["burn"].address, big, big),
        (r, e.address, big, 0), (r, a["user"].address, big, big)
    ]: check_balance(s, fa2, owner, token_id, expected)
    check_core(s, e, a, False, 5)


@sp.add_test(name="T10_repeated_trades_and_stale_quotes")
def t10():
    s, a = sp.test_scenario(), actors()
    e = escrow(s, a)
    b, r = deploy(s, ConformingFA2()), deploy(s, ConformingFA2())
    p = pair(1, b, r); add(s, e, a["admin"], [p]); unpause(s, e, a["admin"])
    mint(s, b, a["user"].address, 7, 20); operator(s, b, a["user"], e, 7)
    mint(s, r, e.address, 8, 30)
    old = trade(p, a["user"].address)
    s += e.initiate_trade(trades=sp.list([old])).run(sender=a["user"])
    check_balance(s, b, a["user"].address, 7, 18)
    check_balance(s, b, a["burn"].address, 7, 2)
    check_balance(s, r, e.address, 8, 27)
    check_balance(s, r, a["user"].address, 8, 3)
    check_core(s, e, a, False, 1); check_pair(s, e, p)
    operator(s, b, a["user"], e, 7, False)
    event(s, "T10_REVOKED_AFTER_SUCCESS")
    s += e.initiate_trade(trades=sp.list([old])).run(
        sender=a["user"], valid=False, exception="FA2_NOT_OPERATOR"
    )
    operator(s, b, a["user"], e, 7)
    s += b.transfer(transfer(
        a["user"].address, a["user2"].address, 7, 17
    )).run(sender=a["user"])
    event(s, "T10_SHORT_AFTER_SUCCESS")
    s += e.initiate_trade(trades=sp.list([old])).run(
        sender=a["user"], valid=False, exception="FA2_INSUFFICIENT_BALANCE"
    )
    check_balance(s, b, a["user"].address, 7, 1)
    check_balance(s, b, a["user2"].address, 7, 17)
    check_balance(s, b, a["burn"].address, 7, 2)
    check_balance(s, r, e.address, 8, 27)
    check_balance(s, r, a["user"].address, 8, 3)
    s.verify(b.data.call_count == 2); s.verify(r.data.call_count == 1)
    check_core(s, e, a, False, 1); check_pair(s, e, p)
    s += b.transfer(transfer(
        a["user2"].address, a["user"].address, 7, 17
    )).run(sender=a["user2"])
    s += e.initiate_trade(trades=sp.list([old, old])).run(sender=a["user"])
    check_balance(s, b, a["user"].address, 7, 14)
    check_balance(s, b, a["burn"].address, 7, 6)
    check_balance(s, r, e.address, 8, 21)
    check_balance(s, r, a["user"].address, 8, 9)
    fresh_pair = pair(1, b, r, burn_amount=4, redeem_amount=5)
    s += e.update_token_pair(fresh_pair).run(sender=a["admin"])
    event(s, "T10_STALE")
    s += e.initiate_trade(trades=sp.list([old])).run(
        sender=a["user"], valid=False, exception="Error: Invalid token parameters."
    )
    check_balance(s, b, a["user"].address, 7, 14)
    check_balance(s, r, e.address, 8, 21)
    fresh = trade(fresh_pair, a["user"].address)
    s += e.initiate_trade(trades=sp.list([fresh])).run(sender=a["user"])
    check_balance(s, b, a["user"].address, 7, 10)
    check_balance(s, r, e.address, 8, 16)
    s += e.toggle_pause().run(sender=a["admin"])
    event(s, "T10_PAUSED_AFTER_SUCCESS")
    s += e.initiate_trade(trades=sp.list([fresh])).run(
        sender=a["user"], valid=False, exception="Error: Contract is paused."
    )
    s += e.toggle_pause().run(sender=a["admin"])
    s += e.cleanup_token_pairs(token_pair_ids=sp.list([1])).run(sender=a["admin"])
    event(s, "T10_DELETED")
    s += e.initiate_trade(trades=sp.list([fresh])).run(
        sender=a["user"], valid=False, exception="Error: Token pair not found."
    )
    check_balance(s, b, a["user"].address, 7, 10)
    check_balance(s, r, e.address, 8, 16)
    check_core(s, e, a, False, 0); s.verify(~e.data.token_mapping.contains(1))


@sp.add_test(name="T11_tez_custody_and_withdrawal")
def t11():
    s, a = sp.test_scenario(), actors()
    proxy = deploy(s, AdminProxy())
    e = escrow(s, a, proxy.address)
    b, r = deploy(s, ConformingFA2()), deploy(s, ConformingFA2())
    event(s, "T11_DEFAULT_MIN")
    s += e.default().run(sender=a["user"], amount=sp.mutez(1))
    event(s, "T11_DEFAULT_LARGE")
    s += e.default().run(sender=a["user"], amount=sp.mutez(10000000))
    p = pair(1, b, r)
    add(s, e, proxy.address, [p], sp.mutez(7))
    s.verify(e.balance == sp.mutez(10000008))
    event(s, "T11_ZERO_DEFAULT")
    s += e.default().run(
        sender=a["user"], amount=sp.mutez(0), valid=False,
        exception="Error: No XTZ sent. Only XTZ transfers are accepted by this entrypoint."
    )
    event(s, "T11_UNAUTH_WITHDRAW")
    s += e.admin_withdraw_xtz(amount=sp.mutez(1)).run(
        sender=a["outsider"], valid=False, exception="Error: Unauthorized."
    )
    event(s, "T11_ZERO_WITHDRAW")
    s += proxy.withdraw(escrow=e.address, amount=sp.mutez(0)).run(
        sender=a["admin"], valid=False, exception="Error: Amount must be greater than zero."
    )
    event(s, "T11_OVER_WITHDRAW")
    s += proxy.withdraw(escrow=e.address, amount=sp.mutez(10000009)).run(
        sender=a["admin"], valid=False, exception="Insufficient contract balance."
    )
    s.verify(e.balance == sp.mutez(10000008)); s.verify(proxy.balance == sp.mutez(0))
    event(s, "T11_WITHDRAW_PARTIAL")
    s += proxy.withdraw(escrow=e.address, amount=sp.mutez(8)).run(sender=a["admin"])
    s.verify(e.balance == sp.mutez(10000000)); s.verify(proxy.balance == sp.mutez(8))
    event(s, "T11_WITHDRAW_FULL")
    s += proxy.withdraw(escrow=e.address, amount=sp.mutez(10000000)).run(sender=a["admin"])
    s.verify(e.balance == sp.mutez(0)); s.verify(proxy.balance == sp.mutez(10000008))
    check_core(s, e, a, True, 1, proxy.address); check_pair(s, e, p)


@sp.add_test(name="T12_fa2_interface_and_noop_trust_boundary")
def t12():
    s, a = sp.test_scenario(), actors()
    e = escrow(s, a)
    b, r = deploy(s, AcceptingNoOpFA2()), deploy(s, AcceptingNoOpFA2())
    p = pair(1, b, r); add(s, e, a["admin"], [p]); unpause(s, e, a["admin"])
    mint(s, b, a["user"].address, 7, 10); mint(s, r, e.address, 8, 10)
    event(s, "T12_NOOP_TRADE")
    s += e.initiate_trade(trades=sp.list([
        trade(p, a["user"].address), trade(p, a["user"].address)
    ])).run(sender=a["user"])
    check_balance(s, b, a["user"].address, 7, 10)
    check_balance(s, b, a["burn"].address, 7, 0)
    check_balance(s, r, e.address, 8, 10)
    check_balance(s, r, a["user"].address, 8, 0)
    check_call(s, b, 0, e.address, [(a["user"].address, a["burn"].address, 7, 2)] * 2)
    check_call(s, r, 0, e.address, [(e.address, a["user"].address, 8, 3)] * 2)
    s.verify(b.data.call_count == 1); s.verify(r.data.call_count == 1)
    check_core(s, e, a, False, 1); check_pair(s, e, p)
    event(s, "T12_NOOP_ADMIN")
    s += e.admin_transfer_token(token_contract=r.address, token_id=8,
                                to_=a["user2"].address, amount=4).run(sender=a["admin"])
    check_balance(s, r, e.address, 8, 10); check_balance(s, r, a["user2"].address, 8, 0)
    check_call(s, r, 1, e.address, [(e.address, a["user2"].address, 8, 4)])
    event(s, "T12_BAD_ADMIN_INTERFACE")
    s += e.admin_transfer_token(token_contract=e.address, token_id=8,
                                to_=a["user"].address, amount=1).run(
        sender=a["admin"], valid=False,
        exception="Missing entrypoint target in contract"
    )
    bad = pair(2, e, r); add(s, e, a["admin"], [bad])
    event(s, "T12_BAD_TRADE_INTERFACE")
    s += e.initiate_trade(trades=sp.list([trade(bad, a["user"].address)])).run(
        sender=a["user"], valid=False,
        exception="Missing entrypoint target in contract"
    )
    s.verify(b.data.call_count == 1); s.verify(r.data.call_count == 2)
    check_balance(s, b, a["user"].address, 7, 10)
    check_balance(s, r, e.address, 8, 10)
    check_core(s, e, a, False, 2); check_pair(s, e, p); check_pair(s, e, bad)


@sp.add_test(name="T13_event_surface_and_backtracking")
def t13():
    s, a = sp.test_scenario(), actors()
    e = escrow(s, a)
    b, r = deploy(s, ConformingFA2()), deploy(s, ConformingFA2())
    reject = deploy(s, RejectingFA2())
    p = pair(1, b, r)
    event(s, "T13_XTZ_RECEIVED")
    s += e.default().run(sender=a["user"], amount=sp.mutez(5))
    event(s, "T13_PAIR_ADDED")
    add(s, e, a["admin"], [p])
    changed = pair(1, b, r, burn_amount=4, redeem_amount=6)
    event(s, "T13_PAIR_UPDATED")
    s += e.update_token_pair(changed).run(sender=a["admin"])
    event(s, "T13_UPDATE_NOOP")
    s += e.update_token_pair(changed).run(sender=a["admin"])
    mint(s, b, e.address, 7, 2)
    event(s, "T13_TOKEN_TRANSFERRED")
    s += e.admin_transfer_token(token_contract=b.address, token_id=7,
                                to_=a["user2"].address, amount=1).run(sender=a["admin"])
    event(s, "T13_TOKEN_BACKTRACK")
    s += e.admin_transfer_token(token_contract=reject.address, token_id=7,
                                to_=a["user2"].address, amount=1).run(
        sender=a["admin"], valid=False, exception="FA2_REJECTED"
    )
    mint(s, b, a["user"].address, 7, 8); operator(s, b, a["user"], e, 7)
    mint(s, r, e.address, 8, 12)
    event(s, "T13_PAUSE")
    s += e.toggle_pause().run(sender=a["admin"])
    event(s, "T13_TRADE_TWO")
    s += e.initiate_trade(trades=sp.list([
        trade(changed, a["user"].address), trade(changed, a["user"].address)
    ])).run(sender=a["user"])
    s.verify(b.data.call_count == 2); s.verify(r.data.call_count == 1)
    event(s, "T13_PAIR_DELETED")
    s += e.cleanup_token_pairs(token_pair_ids=sp.list([9, 1, 1])).run(sender=a["admin"])
    event(s, "T13_WITHDRAW")
    s += e.admin_withdraw_xtz(amount=sp.mutez(5)).run(sender=a["admin"])
    s.verify(e.balance == sp.mutez(0)); s.verify(e.data.token_mapping_size == 0)
    s.verify(~e.data.token_mapping.contains(1))
