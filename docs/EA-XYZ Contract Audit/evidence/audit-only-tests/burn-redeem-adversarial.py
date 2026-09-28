import smartpy as sp

target = sp.io.import_script_from_url(
    "file:contracts/burn-redeem-escrow/smartpy/burn-redeem-escrow-smartpy.py"
)


TRANSFER_TYPE = sp.TList(
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


class StrictFA2(sp.Contract):
    """Minimal audit double that enforces FA2-style owner/operator authority."""

    def __init__(self):
        self.init(
            ledger=sp.big_map(tkey=sp.TPair(sp.TAddress, sp.TNat), tvalue=sp.TNat),
            operators=sp.big_map(
                tkey=sp.TRecord(
                    owner=sp.TAddress,
                    operator=sp.TAddress,
                    token_id=sp.TNat
                ).layout(("owner", ("operator", "token_id"))),
                tvalue=sp.TUnit
            )
        )

    @sp.entry_point
    def mint(self, params):
        sp.set_type(params, sp.TRecord(owner=sp.TAddress, token_id=sp.TNat, amount=sp.TNat))
        key = sp.pair(params.owner, params.token_id)
        self.data.ledger[key] = self.data.ledger.get(key, 0) + params.amount

    @sp.entry_point
    def add_operator(self, params):
        sp.set_type(params, sp.TRecord(operator=sp.TAddress, token_id=sp.TNat))
        self.data.operators[sp.record(
            owner=sp.sender,
            operator=params.operator,
            token_id=params.token_id
        )] = sp.unit

    @sp.entry_point
    def transfer(self, params):
        sp.set_type(params, TRANSFER_TYPE)
        sp.for transfer_op in params:
            sp.for tx in transfer_op.txs:
                token_id, amount = sp.match_pair(tx.token_id_amount)
                operator_key = sp.record(
                    owner=transfer_op.from_,
                    operator=sp.sender,
                    token_id=token_id
                )
                sp.verify(
                    (sp.sender == transfer_op.from_) |
                    self.data.operators.contains(operator_key),
                    "FA2_NOT_OPERATOR"
                )
                from_key = sp.pair(transfer_op.from_, token_id)
                to_key = sp.pair(tx.to_, token_id)
                from_balance = self.data.ledger.get(from_key, 0)
                sp.verify(from_balance >= amount, "FA2_INSUFFICIENT_BALANCE")
                self.data.ledger[from_key] = sp.as_nat(from_balance - amount)
                self.data.ledger[to_key] = self.data.ledger.get(to_key, 0) + amount


class NoOpFA2(sp.Contract):
    """Hostile configured token: accepts transfer calls without moving assets."""

    def __init__(self):
        self.init(calls=sp.nat(0))

    @sp.entry_point
    def transfer(self, params):
        sp.set_type(params, TRANSFER_TYPE)
        self.data.calls += 1


def pair(pair_id, burn, redeem, burn_amount=2, redeem_amount=1):
    return sp.record(
        token_pair_id=pair_id,
        burn_contract_address=burn.address,
        burn_token_id=0,
        burn_amount=burn_amount,
        redeem_contract_address=redeem.address,
        redeem_token_id=0,
        redeem_amount=redeem_amount
    )


def trade(pair_id, user, burn, redeem, burn_amount=2):
    return sp.record(
        token_pair_id=pair_id,
        user_wallet=user.address,
        burn_contract_address=burn.address,
        burn_token_id=0,
        burn_amount=burn_amount,
        redeem_contract_address=redeem.address,
        redeem_token_id=0
    )


@sp.add_test(name="Audit-only operator atomicity and validation")
def operator_atomicity_test():
    scenario = sp.test_scenario()
    admin = sp.test_account("AuditAdmin")
    user = sp.test_account("AuditUser")
    other = sp.test_account("OtherCaller")
    sink = sp.test_account("BurnSink")
    burn = StrictFA2()
    redeem = StrictFA2()
    escrow = target.BurnRedeemEscrow(admin.address, sink.address)
    scenario += burn
    scenario += redeem
    scenario += escrow

    scenario += burn.mint(owner=user.address, token_id=0, amount=10)
    scenario += redeem.mint(owner=escrow.address, token_id=0, amount=2)
    scenario += escrow.set_token_pairs(token_pairs=[pair(1, burn, redeem)]).run(sender=admin)
    scenario += escrow.toggle_pause().run(sender=admin)

    # Empty batches and wallet impersonation are rejected before any transfer.
    scenario += escrow.initiate_trade(trades=[]).run(
        sender=user, valid=False, exception="EMPTY_TRADE_LIST"
    )
    scenario += escrow.initiate_trade(trades=[trade(1, user, burn, redeem)]).run(
        sender=other, valid=False, exception=target.ERROR_SENDER_MISMATCH
    )

    # A real authorization check rejects the escrow until the owner approves it.
    scenario += escrow.initiate_trade(trades=[trade(1, user, burn, redeem)]).run(
        sender=user, valid=False, exception="FA2_NOT_OPERATOR"
    )
    scenario.verify(burn.data.ledger[sp.pair(user.address, 0)] == 10)
    scenario.verify(redeem.data.ledger[sp.pair(escrow.address, 0)] == 2)

    scenario += burn.add_operator(operator=escrow.address, token_id=0).run(sender=user)
    scenario += escrow.initiate_trade(trades=[trade(1, user, burn, redeem)]).run(sender=user)
    scenario.verify(burn.data.ledger[sp.pair(user.address, 0)] == 8)
    scenario.verify(burn.data.ledger[sp.pair(sink.address, 0)] == 2)
    scenario.verify(redeem.data.ledger[sp.pair(user.address, 0)] == 1)
    scenario.verify(redeem.data.ledger[sp.pair(escrow.address, 0)] == 1)

    # Two further trades need two redeem tokens; only one remains. Failure is atomic.
    scenario += escrow.initiate_trade(
        trades=[trade(1, user, burn, redeem), trade(1, user, burn, redeem)]
    ).run(sender=user, valid=False, exception="FA2_INSUFFICIENT_BALANCE")
    scenario.verify(burn.data.ledger[sp.pair(user.address, 0)] == 8)
    scenario.verify(burn.data.ledger[sp.pair(sink.address, 0)] == 2)
    scenario.verify(redeem.data.ledger[sp.pair(user.address, 0)] == 1)
    scenario.verify(redeem.data.ledger[sp.pair(escrow.address, 0)] == 1)


@sp.add_test(name="Audit-only pair batch and tez acceptance")
def pair_and_tez_test():
    scenario = sp.test_scenario()
    admin = sp.test_account("PairAdmin")
    sink = sp.test_account("PairSink")
    burn = StrictFA2()
    redeem = StrictFA2()
    escrow = target.BurnRedeemEscrow(admin.address, sink.address)
    scenario += burn
    scenario += redeem
    scenario += escrow

    # A duplicate ID within one call fails atomically.
    scenario += escrow.set_token_pairs(
        token_pairs=[pair(7, burn, redeem), pair(7, burn, redeem, 3, 1)]
    ).run(sender=admin, valid=False, exception="DUPLICATE_TOKEN_PAIR_ID")
    scenario.verify(escrow.data.token_mapping_size == 0)
    scenario.verify(~escrow.data.token_mapping.contains(7))

    # Non-default entrypoints accept tez; a subsequent exact withdrawal proves custody.
    scenario += escrow.toggle_pause().run(sender=admin, amount=sp.mutez(7))
    scenario += escrow.admin_withdraw_xtz(amount=sp.mutez(7)).run(sender=admin)


@sp.add_test(name="Audit-only hostile configured FA2 trust boundary")
def hostile_fa2_test():
    scenario = sp.test_scenario()
    admin = sp.test_account("HostileAdmin")
    user = sp.test_account("HostileUser")
    sink = sp.test_account("HostileSink")
    hostile_burn = NoOpFA2()
    redeem = StrictFA2()
    escrow = target.BurnRedeemEscrow(admin.address, sink.address)
    scenario += hostile_burn
    scenario += redeem
    scenario += escrow

    scenario += redeem.mint(owner=escrow.address, token_id=0, amount=1)
    scenario += escrow.set_token_pairs(
        token_pairs=[pair(9, hostile_burn, redeem, burn_amount=1, redeem_amount=1)]
    ).run(sender=admin)
    scenario += escrow.toggle_pause().run(sender=admin)
    scenario += escrow.initiate_trade(
        trades=[trade(9, user, hostile_burn, redeem, burn_amount=1)]
    ).run(sender=user)

    scenario.verify(hostile_burn.data.calls == 1)
    scenario.verify(redeem.data.ledger[sp.pair(user.address, 0)] == 1)
    scenario.verify(redeem.data.ledger[sp.pair(escrow.address, 0)] == 0)


@sp.add_test(name="Audit-only pending trade redeem repricing")
def pending_trade_repricing_test():
    scenario = sp.test_scenario()
    admin = sp.test_account("RepriceAdmin")
    user = sp.test_account("RepriceUser")
    sink = sp.test_account("RepriceSink")
    burn = StrictFA2()
    redeem = StrictFA2()
    escrow = target.BurnRedeemEscrow(admin.address, sink.address)
    scenario += burn
    scenario += redeem
    scenario += escrow

    scenario += burn.mint(owner=user.address, token_id=0, amount=2)
    scenario += redeem.mint(owner=escrow.address, token_id=0, amount=5)
    scenario += burn.add_operator(operator=escrow.address, token_id=0).run(sender=user)
    scenario += escrow.set_token_pairs(
        token_pairs=[pair(11, burn, redeem, burn_amount=2, redeem_amount=5)]
    ).run(sender=admin)
    scenario += escrow.toggle_pause().run(sender=admin)

    # The user's trade payload binds every pair field except redeem_amount.
    pending_trade = trade(11, user, burn, redeem, burn_amount=2)

    # An update ordered before the signed trade changes only the unbound output amount.
    scenario += escrow.update_token_pair(
        token_pair_id=11,
        burn_contract_address=burn.address,
        burn_token_id=0,
        burn_amount=2,
        redeem_contract_address=redeem.address,
        redeem_token_id=0,
        redeem_amount=1
    ).run(sender=admin)
    scenario += escrow.initiate_trade(trades=[pending_trade]).run(sender=user)

    scenario.verify(burn.data.ledger[sp.pair(user.address, 0)] == 0)
    scenario.verify(burn.data.ledger[sp.pair(sink.address, 0)] == 2)
    scenario.verify(redeem.data.ledger[sp.pair(user.address, 0)] == 1)
    scenario.verify(redeem.data.ledger[sp.pair(escrow.address, 0)] == 4)
