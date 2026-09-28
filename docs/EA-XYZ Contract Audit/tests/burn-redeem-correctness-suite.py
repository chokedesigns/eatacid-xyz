import smartpy as sp


target = sp.io.import_script_from_url(
    "file:docs/EA-XYZ Contract Audit/source/burn-redeem-escrow-audit.py"
)


FA2_TRANSFER_TYPE = sp.TList(
    sp.TRecord(
        from_=sp.TAddress,
        txs=sp.TList(
            sp.TRecord(
                to_=sp.TAddress,
                token_id_amount=sp.TPair(sp.TNat, sp.TNat)
            ).layout(("to_", "token_id_amount"))
        )
    ).layout(("from_", "txs"))
)

OPERATOR_KEY_TYPE = sp.TRecord(
    owner=sp.TAddress,
    operator=sp.TAddress,
    token_id=sp.TNat
).layout(("owner", ("operator", "token_id")))

TRANSFER_CALL_TYPE = sp.TRecord(
    caller=sp.TAddress,
    amount=sp.TMutez,
    transfers=FA2_TRANSFER_TYPE
).layout(("caller", ("amount", "transfers")))


class ConformingFA2(sp.Contract):
    """Small operator-enforcing FA2 fixture for economic assertions."""

    def __init__(self):
        self.init(
            ledger=sp.big_map(
                tkey=sp.TPair(sp.TAddress, sp.TNat),
                tvalue=sp.TNat
            ),
            operators=sp.big_map(tkey=OPERATOR_KEY_TYPE, tvalue=sp.TUnit),
            calls=sp.big_map(tkey=sp.TNat, tvalue=TRANSFER_CALL_TYPE),
            call_count=sp.nat(0)
        )

    @sp.entry_point
    def mint(self, params):
        sp.set_type(
            params,
            sp.TRecord(owner=sp.TAddress, token_id=sp.TNat, amount=sp.TNat)
        )
        key = sp.pair(params.owner, params.token_id)
        self.data.ledger[key] = self.data.ledger.get(key, 0) + params.amount

    @sp.entry_point
    def add_operator(self, params):
        sp.set_type(
            params,
            sp.TRecord(operator=sp.TAddress, token_id=sp.TNat)
        )
        self.data.operators[operator_key(
            sp.sender,
            params.operator,
            params.token_id
        )] = sp.unit

    @sp.entry_point
    def remove_operator(self, params):
        sp.set_type(
            params,
            sp.TRecord(operator=sp.TAddress, token_id=sp.TNat)
        )
        key = operator_key(sp.sender, params.operator, params.token_id)
        sp.if self.data.operators.contains(key):
            del self.data.operators[key]

    @sp.entry_point
    def transfer(self, params):
        sp.set_type(params, FA2_TRANSFER_TYPE)
        self.data.calls[self.data.call_count] = sp.record(
            caller=sp.sender,
            amount=sp.amount,
            transfers=params
        )
        self.data.call_count += 1

        sp.for transfer_op in params:
            sp.for tx in transfer_op.txs:
                token_id, amount = sp.match_pair(tx.token_id_amount)
                authorized = (
                    (sp.sender == transfer_op.from_) |
                    self.data.operators.contains(operator_key(
                        transfer_op.from_,
                        sp.sender,
                        token_id
                    ))
                )
                sp.verify(authorized, "FA2_NOT_OPERATOR")

                from_key = sp.pair(transfer_op.from_, token_id)
                to_key = sp.pair(tx.to_, token_id)
                from_balance = self.data.ledger.get(from_key, 0)
                sp.verify(
                    from_balance >= amount,
                    "FA2_INSUFFICIENT_BALANCE"
                )
                self.data.ledger[from_key] = sp.as_nat(from_balance - amount)
                self.data.ledger[to_key] = (
                    self.data.ledger.get(to_key, 0) + amount
                )


class RejectingFA2(sp.Contract):
    """Adversarial/non-conforming double that rejects every transfer."""

    def __init__(self):
        self.init(marker=sp.unit)

    @sp.entry_point
    def transfer(self, params):
        sp.set_type(params, FA2_TRANSFER_TYPE)
        sp.failwith("FA2_REJECTED")


class AcceptingNoOpFA2(sp.Contract):
    """Adversarial/non-conforming double that accepts but moves no tokens."""

    def __init__(self):
        self.init(
            ledger=sp.big_map(
                tkey=sp.TPair(sp.TAddress, sp.TNat),
                tvalue=sp.TNat
            ),
            calls=sp.big_map(tkey=sp.TNat, tvalue=TRANSFER_CALL_TYPE),
            call_count=sp.nat(0)
        )

    @sp.entry_point
    def mint(self, params):
        sp.set_type(
            params,
            sp.TRecord(owner=sp.TAddress, token_id=sp.TNat, amount=sp.TNat)
        )
        key = sp.pair(params.owner, params.token_id)
        self.data.ledger[key] = self.data.ledger.get(key, 0) + params.amount

    @sp.entry_point
    def transfer(self, params):
        sp.set_type(params, FA2_TRANSFER_TYPE)
        self.data.calls[self.data.call_count] = sp.record(
            caller=sp.sender,
            amount=sp.amount,
            transfers=params
        )
        self.data.call_count += 1


# Deployment and deterministic-account helpers.
def accounts():
    return {
        "admin": sp.test_account("Admin"),
        "user_a": sp.test_account("UserA"),
        "user_b": sp.test_account("UserB"),
        "outsider": sp.test_account("Outsider"),
        "burn_sink": sp.test_account("BurnSink")
    }


def deploy_escrow(scenario, actor):
    escrow = target.BurnRedeemEscrow(
        admin=actor["admin"].address,
        initial_burn_address=actor["burn_sink"].address
    )
    scenario += escrow
    return escrow


def deploy_fa2(scenario, fixture):
    scenario += fixture
    return fixture


# FA2 setup helpers.
def mint_balance(scenario, fa2, owner, token_id, amount):
    scenario += fa2.mint(
        owner=owner,
        token_id=token_id,
        amount=amount
    ).run(sender=owner)


def configure_operator(scenario, fa2, owner, operator, token_id, enabled):
    if enabled:
        scenario += fa2.add_operator(
            operator=operator,
            token_id=token_id
        ).run(sender=owner)
    else:
        scenario += fa2.remove_operator(
            operator=operator,
            token_id=token_id
        ).run(sender=owner)


# Data builders keep all contract-call fields visible at their call sites.
def operator_key(owner, operator, token_id):
    return sp.record(owner=owner, operator=operator, token_id=token_id)


def transfer_batch(from_, to_, token_id, amount):
    return sp.list([
        sp.record(
            from_=from_,
            txs=sp.list([
                sp.record(
                    to_=to_,
                    token_id_amount=sp.pair(token_id, amount)
                )
            ])
        )
    ])


def token_pair(
    token_pair_id,
    burn_contract,
    burn_token_id,
    burn_amount,
    redeem_contract,
    redeem_token_id,
    redeem_amount
):
    return sp.record(
        token_pair_id=token_pair_id,
        burn_contract_address=burn_contract,
        burn_token_id=burn_token_id,
        burn_amount=burn_amount,
        redeem_contract_address=redeem_contract,
        redeem_token_id=redeem_token_id,
        redeem_amount=redeem_amount
    )


def trade(pair, user_wallet):
    return sp.record(
        token_pair_id=pair.token_pair_id,
        user_wallet=user_wallet,
        burn_contract_address=pair.burn_contract_address,
        burn_token_id=pair.burn_token_id,
        burn_amount=pair.burn_amount,
        redeem_contract_address=pair.redeem_contract_address,
        redeem_token_id=pair.redeem_token_id,
        redeem_amount=pair.redeem_amount
    )


# Observation and direct assertion helpers.
def balance(fa2, owner, token_id):
    return fa2.data.ledger.get(sp.pair(owner, token_id), 0)


def assert_balance(scenario, fa2, owner, token_id, expected):
    scenario.verify(balance(fa2, owner, token_id) == expected)


def snapshot_relevant_state(
    admin,
    burn_address,
    paused,
    token_mapping_size,
    fa2,
    balances,
    pair_membership=None,
    call_count=0
):
    return {
        "admin": admin,
        "burn_address": burn_address,
        "paused": paused,
        "token_mapping_size": token_mapping_size,
        "fa2": fa2,
        "balances": balances,
        "pair_membership": pair_membership or [],
        "call_count": call_count
    }


def assert_unchanged_state(scenario, escrow, snapshot):
    scenario.verify(escrow.data.admin == snapshot["admin"])
    scenario.verify(escrow.data.burn_address == snapshot["burn_address"])
    scenario.verify(escrow.data.paused == snapshot["paused"])
    scenario.verify(
        escrow.data.token_mapping_size == snapshot["token_mapping_size"]
    )
    for pair_id, present in snapshot["pair_membership"]:
        scenario.verify(
            escrow.data.token_mapping.contains(pair_id) == present
        )
    for owner, token_id, expected in snapshot["balances"]:
        assert_balance(
            scenario,
            snapshot["fa2"],
            owner,
            token_id,
            expected
        )
    scenario.verify(
        snapshot["fa2"].data.call_count == snapshot["call_count"]
    )


@sp.add_test(name="foundation_01_burn_redeem_deploys")
def foundation_01_burn_redeem_deploys():
    scenario = sp.test_scenario()
    actor = accounts()
    escrow = deploy_escrow(scenario, actor)

    scenario.verify(escrow.data.paused)
    scenario.verify(escrow.data.admin == actor["admin"].address)
    scenario.verify(escrow.data.burn_address == actor["burn_sink"].address)
    scenario.verify(escrow.data.token_mapping_size == 0)


@sp.add_test(name="foundation_02_fa2_owner_transfer")
def foundation_02_fa2_owner_transfer():
    scenario = sp.test_scenario()
    actor = accounts()
    fa2 = deploy_fa2(scenario, ConformingFA2())
    mint_balance(scenario, fa2, actor["user_a"].address, 7, 10)

    scenario += fa2.transfer(transfer_batch(
        actor["user_a"].address,
        actor["user_b"].address,
        7,
        4
    )).run(sender=actor["user_a"])

    assert_balance(scenario, fa2, actor["user_a"].address, 7, 6)
    assert_balance(scenario, fa2, actor["user_b"].address, 7, 4)
    scenario.verify(fa2.data.call_count == 1)
    scenario.verify(fa2.data.calls[0].caller == actor["user_a"].address)
    scenario.verify(fa2.data.calls[0].amount == sp.mutez(0))


@sp.add_test(name="foundation_03_fa2_operator_transfer")
def foundation_03_fa2_operator_transfer():
    scenario = sp.test_scenario()
    actor = accounts()
    fa2 = deploy_fa2(scenario, ConformingFA2())
    mint_balance(scenario, fa2, actor["user_a"].address, 7, 10)
    configure_operator(
        scenario,
        fa2,
        actor["user_a"],
        actor["user_b"].address,
        7,
        True
    )
    scenario.verify(fa2.data.operators.contains(operator_key(
        actor["user_a"].address,
        actor["user_b"].address,
        7
    )))

    scenario += fa2.transfer(transfer_batch(
        actor["user_a"].address,
        actor["burn_sink"].address,
        7,
        3
    )).run(sender=actor["user_b"])

    assert_balance(scenario, fa2, actor["user_a"].address, 7, 7)
    assert_balance(scenario, fa2, actor["burn_sink"].address, 7, 3)
    scenario.verify(fa2.data.call_count == 1)
    configure_operator(
        scenario,
        fa2,
        actor["user_a"],
        actor["user_b"].address,
        7,
        False
    )
    scenario.verify(~fa2.data.operators.contains(operator_key(
        actor["user_a"].address,
        actor["user_b"].address,
        7
    )))


@sp.add_test(name="foundation_04_fa2_unauthorized_rejected")
def foundation_04_fa2_unauthorized_rejected():
    scenario = sp.test_scenario()
    actor = accounts()
    fa2 = deploy_fa2(scenario, ConformingFA2())
    escrow = deploy_escrow(scenario, actor)
    mint_balance(scenario, fa2, actor["user_a"].address, 7, 10)

    state = snapshot_relevant_state(
        actor["admin"].address,
        actor["burn_sink"].address,
        True,
        0,
        fa2,
        [
            (actor["user_a"].address, 7, 10),
            (actor["burn_sink"].address, 7, 0)
        ]
    )
    scenario += fa2.transfer(transfer_batch(
        actor["user_a"].address,
        actor["burn_sink"].address,
        7,
        3
    )).run(
        sender=actor["outsider"],
        valid=False,
        exception="FA2_NOT_OPERATOR"
    )
    assert_unchanged_state(scenario, escrow, state)


@sp.add_test(name="foundation_05_fa2_insufficient_balance_rejected")
def foundation_05_fa2_insufficient_balance_rejected():
    scenario = sp.test_scenario()
    actor = accounts()
    fa2 = deploy_fa2(scenario, ConformingFA2())
    mint_balance(scenario, fa2, actor["user_a"].address, 7, 2)

    scenario += fa2.transfer(transfer_batch(
        actor["user_a"].address,
        actor["user_b"].address,
        7,
        3
    )).run(
        sender=actor["user_a"],
        valid=False,
        exception="FA2_INSUFFICIENT_BALANCE"
    )

    assert_balance(scenario, fa2, actor["user_a"].address, 7, 2)
    assert_balance(scenario, fa2, actor["user_b"].address, 7, 0)
    scenario.verify(fa2.data.call_count == 0)


@sp.add_test(name="foundation_06_rejecting_fa2")
def foundation_06_rejecting_fa2():
    scenario = sp.test_scenario()
    actor = accounts()
    fa2 = deploy_fa2(scenario, RejectingFA2())

    scenario += fa2.transfer(transfer_batch(
        actor["user_a"].address,
        actor["user_b"].address,
        7,
        1
    )).run(
        sender=actor["user_a"],
        valid=False,
        exception="FA2_REJECTED"
    )


@sp.add_test(name="foundation_07_accepting_noop_fa2")
def foundation_07_accepting_noop_fa2():
    scenario = sp.test_scenario()
    actor = accounts()
    fa2 = deploy_fa2(scenario, AcceptingNoOpFA2())
    mint_balance(scenario, fa2, actor["user_a"].address, 7, 10)

    scenario += fa2.transfer(transfer_batch(
        actor["user_a"].address,
        actor["user_b"].address,
        7,
        4
    )).run(sender=actor["user_a"])

    assert_balance(scenario, fa2, actor["user_a"].address, 7, 10)
    assert_balance(scenario, fa2, actor["user_b"].address, 7, 0)
    scenario.verify(fa2.data.call_count == 1)
    scenario.verify(fa2.data.calls[0].caller == actor["user_a"].address)


@sp.add_test(name="foundation_08_event_output")
def foundation_08_event_output():
    scenario = sp.test_scenario()
    actor = accounts()
    escrow = deploy_escrow(scenario, actor)

    scenario.h1("EVENT_CASE::FOUNDATION_PAUSE")
    scenario += escrow.toggle_pause().run(sender=actor["admin"])
    scenario.verify(~escrow.data.paused)
