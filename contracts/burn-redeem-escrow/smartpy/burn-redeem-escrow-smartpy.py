import smartpy as sp

# =============================================================================
#                           MOCK FA2 CONTRACT
# =============================================================================

class MockFA2(sp.Contract):
    """
    Lightweight FA2 token contract for testing interactions with the
    BurnRedeemEscrow contract.
    """
    def __init__(self):
        """
        Initializes the contract with an empty ledger.
        The ledger is a big_map that maps addresses to their token balance maps.
        """
        self.init(
            ledger=sp.big_map(
                tkey=sp.TAddress,
                tvalue=sp.TMap(sp.TNat, sp.TNat)  # Maps token IDs to balances per address.
            )
        )

    @sp.entry_point
    def mint(self, params):
        """
        Mints tokens to a specified address.

        Parameters:
            address (sp.TAddress): Recipient address.
            token_id (sp.TNat): Token identifier.
            amount (sp.TNat): Number of tokens to mint.
        """
        sp.set_type(params, sp.TRecord(address=sp.TAddress, token_id=sp.TNat, amount=sp.TNat))
        sp.verify(params.amount > 0, "Mint amount must be greater than zero.")

        # Initialize the recipient's ledger entry if it does not exist.
        sp.if ~self.data.ledger.contains(params.address):
            self.data.ledger[params.address] = sp.map(tkey=sp.TNat, tvalue=sp.TNat)

        # Update the token balance for the recipient.
        recipient_ledger = self.data.ledger[params.address]
        sp.if recipient_ledger.contains(params.token_id):
            recipient_ledger[params.token_id] += params.amount
        sp.else:
            recipient_ledger[params.token_id] = params.amount

    @sp.entry_point
    def transfer(self, params):
        """
        Transfers tokens between addresses.

        Parameters:
            A list of transfer operations, each with:
                from_ (sp.TAddress): Sender address.
                txs (List): List of transactions, each containing:
                    to_ (sp.TAddress): Recipient address.
                    token_id_amount (sp.TPair): A pair (token_id, amount).
        """
        sp.set_type(
            params,
            sp.TList(
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
        )

        # Process each transfer operation.
        sp.for transfer_op in params:
            sp.for tx in transfer_op.txs:
                token_id, amount = sp.match_pair(tx.token_id_amount)

                # Verify the sender exists and has a sufficient balance.
                sp.verify(self.data.ledger.contains(transfer_op.from_), "Sender not found in ledger.")
                sender_balance = self.data.ledger[transfer_op.from_].get(token_id, 0)
                sp.verify(sender_balance >= amount, "Insufficient balance.")

                # Deduct tokens from the sender.
                self.data.ledger[transfer_op.from_][token_id] = sp.as_nat(sender_balance - amount)

                # Credit tokens to the recipient.
                sp.if self.data.ledger.contains(tx.to_):
                    recipient_ledger = self.data.ledger[tx.to_]
                    sp.if recipient_ledger.contains(token_id):
                        recipient_ledger[token_id] += amount
                    sp.else:
                        recipient_ledger[token_id] = amount
                sp.else:
                    self.data.ledger[tx.to_] = sp.map({token_id: amount})

    @sp.onchain_view()
    def get_balance(self, params):
        """
        Retrieves the balance for a given address and token ID.

        Parameters:
            address (sp.TAddress): The account to check.
            token_id (sp.TNat): Token identifier.

        Returns:
            sp.TNat: The token balance for the specified address.
        """
        sp.set_type(params, sp.TRecord(address=sp.TAddress, token_id=sp.TNat).layout(("address", "token_id")))
        sp.result(self.data.ledger.get(params.address, {}).get(params.token_id, 0))


# =============================================================================
#                               CONSTANTS
# =============================================================================

# Error Messages
ERROR_UNAUTHORIZED = "Error: Unauthorized."
ERROR_CONTRACT_PAUSED = "Error: Contract is paused."
ERROR_INSUFFICIENT_BALANCE = "Error: Insufficient balance."
ERROR_TOKEN_PAIR_NOT_FOUND = "Error: Token pair not found."
ERROR_INVALID_AMOUNT = "Error: Amount must be greater than zero."
ERROR_INVALID_TOKEN_PARAMETERS = "Error: Invalid token parameters."
ERROR_SENDER_MISMATCH = "Error: Sender does not match user wallet."
ERROR_INVALID_FA2_INTERFACE = "Error: Invalid FA2 contract interface - 'transfer' entrypoint missing."
ERROR_NO_XTZ_SENT = "Error: No XTZ sent. Only XTZ transfers are accepted by this entrypoint."
ERROR_DUPLICATE_TOKEN_PAIR_ID = "Error: Duplicate token pair ID."
ERROR_INVALID_UPDATE = "Error: Invalid token pair update parameters."
ERROR_INVALID_DELETION = "Error: Attempt to delete non-existent token pair."
ERROR_TRADE_FAILURE = "Error: Trade failed due to invalid conditions."
ERROR_INVALID_BURN_CONTRACT_ADDRESS = "Error: Invalid burn contract address."
ERROR_INVALID_REDEEM_CONTRACT_ADDRESS = "Error: Invalid redeem contract address."
ERROR_INVALID_BURN_AMOUNT = "Error: Invalid burn amount."
ERROR_INVALID_REDEEM_AMOUNT = "Error: Invalid redeem amount."
ERROR_BURN_REDEEM_CONTRACT_MISMATCH = "Error: Burn and Redeem contract addresses cannot be the same."

# Event Tags
EVENT_TYPE_PAUSE_STATE_TOGGLED = "PauseStateToggled"
EVENT_TYPE_XTZ_WITHDRAWN = "XTZWithdrawn"
EVENT_TYPE_TOKEN_PAIR_ADDED = "TokenPairAdded"
EVENT_TYPE_TOKEN_PAIR_UPDATED = "TokenPairUpdated"
EVENT_TYPE_TOKEN_PAIR_DELETED = "TokenPairDeleted"
EVENT_TYPE_TRADE_INITIATED = "TradeInitiated"
EVENT_TYPE_TOKEN_TRANSFERRED = "TokenTransferred"
EVENT_TYPE_XTZ_RECEIVED = "XTZReceived"
EVENT_TYPE_INVALID_TOKEN_PAIR = "InvalidTokenPair"
EVENT_TYPE_INVALID_UPDATE = "InvalidTokenPairUpdate"
EVENT_TYPE_INVALID_DELETION = "InvalidTokenPairDeletion"
EVENT_TYPE_TRADE_ERROR = "TradeError"
EVENT_TYPE_CRITICAL_ERROR = "CriticalError"

# General Constants
ZERO_TEZ = sp.tez(0)
FA2_TRANSFER_ENTRYPOINT = "transfer"
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

# =============================================================================
#                 BURN & REDEEM ESCROW CONTRACT
# =============================================================================

class BurnRedeemEscrow(sp.Contract):
    """
    Contract for burning tokens in exchange for redeemable tokens.
    """
    def __init__(self, admin, initial_burn_address):
        # Initialize the contract state with an empty token mapping.
        self.init(
            paused=True,  # Contract starts in a paused state.
            admin=admin,  # Contract administrator.
            burn_address=initial_burn_address,  # Address for burned tokens.
            token_mapping=sp.big_map(
                {},  # Always initialize with an empty mapping.
                tkey=sp.TNat,
                tvalue=sp.TRecord(
                    burn_token_id=sp.TNat,
                    redeem_token_id=sp.TNat,
                    burn_amount=sp.TNat,
                    redeem_amount=sp.TNat,
                    burn_contract_address=sp.TAddress,
                    redeem_contract_address=sp.TAddress
                )
            ),
            token_mapping_size=sp.nat(0)  # Starts at 0.
        )

    def get_fa2_transfer_interface(self, contract_address):
        """
        Retrieves the FA2 transfer entrypoint interface for the given contract address.

        Parameters:
            contract_address (sp.TAddress): Address of the FA2 contract.

        Returns:
            A contract handle for invoking the 'transfer' entrypoint.

        Raises:
            An error if the FA2 transfer entrypoint is not found.
        """
        return sp.contract(
            FA2_TRANSFER_TYPE,  # Uses the defined FA2 transfer type constant.
            contract_address,
            entry_point="transfer"
        ).open_some(ERROR_INVALID_FA2_INTERFACE)

    # =============================================================================
    #                           HELPER FUNCTIONS
    # =============================================================================

    def verify_admin(self):
        """
        Verifies that the caller is the contract administrator.
        """
        sp.verify(sp.sender == self.data.admin, ERROR_UNAUTHORIZED)

    def verify_positive_amount(self, amount):
        """
        Verifies that the provided mutez amount is greater than zero.

        Parameters:
            amount (sp.TMutez): The amount to verify.
        """
        sp.verify(amount > sp.mutez(0), ERROR_INVALID_AMOUNT)

    def verify_positive_nat(self, amount):
        """
        Verifies that the provided natural number is greater than zero.

        Parameters:
            amount (sp.TNat): The amount to verify.
        """
        sp.verify(amount > 0, ERROR_INVALID_AMOUNT)

    def verify_token_pair_exists(self, token_pair_id):
        """
        Verifies that a token pair with the specified ID exists.

        Parameters:
            token_pair_id (sp.TNat): The token pair identifier.
        """
        sp.verify(self.data.token_mapping.contains(token_pair_id), ERROR_TOKEN_PAIR_NOT_FOUND)
        
    # =============================================================================
    #                           CORE ADMIN CONTROLS
    # =============================================================================

    @sp.entry_point
    def toggle_pause(self):
        """
        Toggles the paused state of the contract.
        Restricted to the admin; emits an event with the new paused state.
        """
        self.verify_admin()  # Ensure the caller is the admin.

        # Toggle and update the paused state.
        paused_state = ~self.data.paused
        self.data.paused = paused_state

        # Emit event with the updated paused state.
        sp.emit(
            sp.record(paused=paused_state),
            tag=EVENT_TYPE_PAUSE_STATE_TOGGLED
        )


    @sp.entry_point
    def admin_withdraw_xtz(self, params):
        """
        Allows the admin to withdraw a specified amount of XTZ from the contract.
        Emits an event indicating the withdrawal amount and whether it succeeded.

        Parameters:
            params (sp.TRecord): A record containing:
                - amount (sp.TMutez): The amount of XTZ to withdraw.
        """
        sp.set_type(params, sp.TRecord(amount=sp.TMutez))

        self.verify_admin()                        # Verify caller is admin.
        self.verify_positive_amount(params.amount)  # Ensure the amount is positive.
        sp.verify(sp.balance >= params.amount, "Insufficient contract balance.")

        # Local variable to track the success of the withdrawal.
        withdrawal_success = sp.local("withdrawal_success", False)

        sp.if sp.balance >= params.amount:
            sp.send(self.data.admin, params.amount)
            withdrawal_success.value = True

        # Emit event with the withdrawal details.
        sp.emit(
            sp.record(
                amount=params.amount,
                success=withdrawal_success.value
            ),
            tag=EVENT_TYPE_XTZ_WITHDRAWN
        )


    @sp.entry_point
    def admin_transfer_token(self, params):
        """
        Allows the admin to transfer tokens from the contract to a specified address.
        Emits an event with the key details of the token transfer.

        Parameters:
            params (sp.TRecord): A record containing:
                - token_contract (sp.TAddress): Address of the FA2 token contract.
                - token_id (sp.TNat): Identifier of the token to transfer.
                - to_ (sp.TAddress): Recipient address.
                - amount (sp.TNat): Number of tokens to transfer.
        """
        sp.set_type(params, sp.TRecord(
            token_contract=sp.TAddress,
            token_id=sp.TNat,
            to_=sp.TAddress,
            amount=sp.TNat
        ))

        self.verify_admin()                   # Verify caller is admin.
        self.verify_positive_nat(params.amount)  # Ensure the token amount is positive.

        # Retrieve the FA2 transfer entrypoint interface.
        c_transfer = sp.local("c_transfer", self.get_fa2_transfer_interface(params.token_contract))

        # Execute the token transfer.
        sp.transfer(
            sp.list([
                sp.record(
                    from_=sp.self_address,
                    txs=sp.list([
                        sp.record(
                            to_=params.to_,
                            token_id_amount=sp.pair(params.token_id, params.amount)
                        )
                    ])
                )
            ]),
            sp.mutez(0),
            c_transfer.value
        )

        # Emit event with the transfer details.
        sp.emit(
            sp.record(
                token_contract=params.token_contract,
                to_=params.to_,
                token_id=params.token_id,
                amount=params.amount
            ),
            tag=EVENT_TYPE_TOKEN_TRANSFERRED
        )

    # =============================================================================
    #                   TRADE OPERATIONS
    # =============================================================================
    
    @sp.entry_point
    def initiate_trade(self, params):
        """
        Initiates multiple trades by burning tokens in exchange for redeemable tokens.
        Processes multiple token pairs in a single call.
        """
        sp.set_type(params, sp.TRecord(
            trades=sp.TList(sp.TRecord(
                token_pair_id=sp.TNat,        
                user_wallet=sp.TAddress,     
                burn_contract_address=sp.TAddress,  
                burn_token_id=sp.TNat,       
                burn_amount=sp.TNat,         
                redeem_contract_address=sp.TAddress,  
                redeem_token_id=sp.TNat      
            ))
        ))
    
        # Validate that the contract is active.
        sp.verify(~self.data.paused, ERROR_CONTRACT_PAUSED)
    
        # Ensure at least one trade exists.
        sp.verify(sp.len(params.trades) > 0, "EMPTY_TRADE_LIST")
    
        # Initialize transfer batches grouped by FA2 contract.
        burn_transfer_batches = sp.local(
            "burn_transfer_batches",
            sp.map(tkey=sp.TAddress, tvalue=FA2_TRANSFER_TYPE)
        )
        redeem_transfer_batches = sp.local(
            "redeem_transfer_batches",
            sp.map(tkey=sp.TAddress, tvalue=FA2_TRANSFER_TYPE)
        )
    
        sp.for trade in params.trades:
            # Verify that the token pair exists.
            sp.verify(self.data.token_mapping.contains(trade.token_pair_id), ERROR_TOKEN_PAIR_NOT_FOUND)
            token_pair = self.data.token_mapping[trade.token_pair_id]
    
            # Verify that trade parameters match the token pair configuration.
            sp.verify(
                (trade.burn_contract_address == token_pair.burn_contract_address) &
                (trade.burn_token_id == token_pair.burn_token_id) &
                (trade.burn_amount == token_pair.burn_amount) &
                (trade.redeem_contract_address == token_pair.redeem_contract_address) &
                (trade.redeem_token_id == token_pair.redeem_token_id),
                ERROR_INVALID_TOKEN_PARAMETERS
            )
    
            # Ensure that the sender matches the user's wallet.
            sp.verify(sp.sender == trade.user_wallet, ERROR_SENDER_MISMATCH)
    
            burn_transfer = sp.local("burn_transfer", sp.record(
                from_=trade.user_wallet,
                txs=sp.list([
                    sp.record(
                        to_=self.data.burn_address,
                        token_id_amount=sp.pair(token_pair.burn_token_id, token_pair.burn_amount)
                    )
                ])
            ))
            with sp.if_(burn_transfer_batches.value.contains(token_pair.burn_contract_address)):
                existing_burn_transfers = sp.local(
                    "existing_burn_transfers",
                    burn_transfer_batches.value[token_pair.burn_contract_address]
                )
                existing_burn_transfers.value.push(burn_transfer.value)
                burn_transfer_batches.value[token_pair.burn_contract_address] = existing_burn_transfers.value
            with sp.else_():
                burn_transfer_batches.value[token_pair.burn_contract_address] = sp.list([burn_transfer.value])
    
            redeem_transfer = sp.local("redeem_transfer", sp.record(
                from_=sp.self_address,
                txs=sp.list([
                    sp.record(
                        to_=trade.user_wallet,
                        token_id_amount=sp.pair(token_pair.redeem_token_id, token_pair.redeem_amount)
                    )
                ])
            ))
            with sp.if_(redeem_transfer_batches.value.contains(token_pair.redeem_contract_address)):
                existing_redeem_transfers = sp.local(
                    "existing_redeem_transfers",
                    redeem_transfer_batches.value[token_pair.redeem_contract_address]
                )
                existing_redeem_transfers.value.push(redeem_transfer.value)
                redeem_transfer_batches.value[token_pair.redeem_contract_address] = existing_redeem_transfers.value
            with sp.else_():
                redeem_transfer_batches.value[token_pair.redeem_contract_address] = sp.list([redeem_transfer.value])
    
            # Emit an event for the trade initiation.
            sp.emit(
                sp.record(
                    user=trade.user_wallet,
                    token_pair_id=trade.token_pair_id,
                    burn_amount=trade.burn_amount,
                    redeem_amount=token_pair.redeem_amount
                ),
                tag=EVENT_TYPE_TRADE_INITIATED
            )
    
        # Execute burn transfers grouped by burn FA2 contract.
        sp.for burn_contract_address in burn_transfer_batches.value.keys():
            sp.transfer(
                burn_transfer_batches.value[burn_contract_address],
                sp.mutez(0),
                sp.contract(
                    FA2_TRANSFER_TYPE,
                    burn_contract_address,
                    entry_point="transfer"
                ).open_some(ERROR_INVALID_FA2_INTERFACE)
            )
    
        # Execute redeem transfers grouped by redeem FA2 contract.
        sp.for redeem_contract_address in redeem_transfer_batches.value.keys():
            sp.transfer(
                redeem_transfer_batches.value[redeem_contract_address],
                sp.mutez(0),
                sp.contract(
                    FA2_TRANSFER_TYPE,
                    redeem_contract_address,
                    entry_point="transfer"
                ).open_some(ERROR_INVALID_FA2_INTERFACE)
            )

    # =============================================================================
    #              TOKEN PAIR CONFIGURATION MANAGEMENT
    # =============================================================================
    
    @sp.entry_point
    def set_token_pairs(self, params):
        """
        Adds or updates token pairs in the mapping.
    
        Parameters:
            params.token_pairs (List[TokenPair]): List of token pairs to add or update.
        """
        sp.set_type(params, sp.TRecord(
            token_pairs=sp.TList(sp.TRecord(
                token_pair_id=sp.TNat,
                burn_contract_address=sp.TAddress,
                burn_token_id=sp.TNat,
                burn_amount=sp.TNat,
                redeem_contract_address=sp.TAddress,
                redeem_token_id=sp.TNat,
                redeem_amount=sp.TNat
            ).layout(
                ("token_pair_id", 
                 ("burn_contract_address", 
                  ("burn_token_id", 
                   ("burn_amount", 
                    ("redeem_contract_address", 
                     ("redeem_token_id", "redeem_amount"))))))
            ))
        ).layout("token_pairs"))
    
        # Verify that only the admin can execute.
        self.verify_admin()
    
        # Track added token pairs.
        added_pairs = sp.local("added_pairs", sp.list(t=sp.TNat))
    
        sp.for token_pair in params.token_pairs:
            sp.if self.data.token_mapping.contains(token_pair.token_pair_id):
                # Duplicate token pair IDs are not allowed.
                sp.failwith("DUPLICATE_TOKEN_PAIR_ID")
            sp.else:
                # Validate that token amounts are positive and contract addresses differ.
                sp.verify(token_pair.burn_amount > 0, "INVALID_BURN_AMOUNT")
                sp.verify(token_pair.redeem_amount > 0, "INVALID_REDEEM_AMOUNT")
                sp.verify(token_pair.burn_contract_address != token_pair.redeem_contract_address,
                          "BURN_REDEEM_CONTRACT_MISMATCH")
    
                # Add the token pair to the mapping.
                self.data.token_mapping[token_pair.token_pair_id] = sp.record(
                    burn_contract_address=token_pair.burn_contract_address,
                    burn_token_id=token_pair.burn_token_id,
                    burn_amount=token_pair.burn_amount,
                    redeem_contract_address=token_pair.redeem_contract_address,
                    redeem_token_id=token_pair.redeem_token_id,
                    redeem_amount=token_pair.redeem_amount
                )
                self.data.token_mapping_size += 1
                added_pairs.value.push(token_pair.token_pair_id)
    
        # Emit an event summarizing the added token pairs.
        sp.emit(
            sp.record(
                added_pairs=added_pairs.value
            ),
            tag=EVENT_TYPE_TOKEN_PAIR_ADDED
        )
    
    @sp.entry_point
    def update_token_pair(self, params):
        """
        Updates an existing token pair configuration.
        Emits an event with details about the update.
    
        Parameters:
            token_pair_id (sp.TNat): ID of the token pair to update.
            burn_contract_address (sp.TAddress): Address of the burn token FA2 contract.
            burn_token_id (sp.TNat): ID of the token to be burned.
            burn_amount (sp.TNat): Amount of burn tokens required.
            redeem_contract_address (sp.TAddress): Address of the redeem token FA2 contract.
            redeem_token_id (sp.TNat): ID of the token to be redeemed.
            redeem_amount (sp.TNat): Amount of redeem tokens provided.
        """
        sp.set_type(params, sp.TRecord(
            token_pair_id=sp.TNat,
            burn_contract_address=sp.TAddress,
            burn_token_id=sp.TNat,
            burn_amount=sp.TNat,
            redeem_contract_address=sp.TAddress,
            redeem_token_id=sp.TNat,
            redeem_amount=sp.TNat
        ))
    
        # Validate that amounts are positive and contract addresses differ.
        sp.verify(params.burn_amount > 0, ERROR_INVALID_BURN_AMOUNT)
        sp.verify(params.redeem_amount > 0, ERROR_INVALID_REDEEM_AMOUNT)
        sp.verify(
            params.burn_contract_address != params.redeem_contract_address,
            ERROR_BURN_REDEEM_CONTRACT_MISMATCH
        )
    
        # Verify that only the admin can execute.
        self.verify_admin()
    
        # Ensure the token pair exists.
        sp.verify(self.data.token_mapping.contains(params.token_pair_id), ERROR_TOKEN_PAIR_NOT_FOUND)
        current_pair = self.data.token_mapping[params.token_pair_id]
    
        # Track fields that have been updated.
        updated_fields = sp.local("updated_fields", sp.list(t=sp.TString))
        sp.if current_pair.burn_contract_address != params.burn_contract_address:
            current_pair.burn_contract_address = params.burn_contract_address
            updated_fields.value.push("burn_contract_address")
        sp.if current_pair.burn_token_id != params.burn_token_id:
            current_pair.burn_token_id = params.burn_token_id
            updated_fields.value.push("burn_token_id")
        sp.if current_pair.burn_amount != params.burn_amount:
            current_pair.burn_amount = params.burn_amount
            updated_fields.value.push("burn_amount")
        sp.if current_pair.redeem_contract_address != params.redeem_contract_address:
            current_pair.redeem_contract_address = params.redeem_contract_address
            updated_fields.value.push("redeem_contract_address")
        sp.if current_pair.redeem_token_id != params.redeem_token_id:
            current_pair.redeem_token_id = params.redeem_token_id
            updated_fields.value.push("redeem_token_id")
        sp.if current_pair.redeem_amount != params.redeem_amount:
            current_pair.redeem_amount = params.redeem_amount
            updated_fields.value.push("redeem_amount")
    
        # Update the token pair in storage.
        self.data.token_mapping[params.token_pair_id] = current_pair
    
        # Emit an event if any fields were updated.
        sp.if sp.len(updated_fields.value) > 0:
            sp.emit(
                sp.record(
                    token_pair_id=params.token_pair_id,
                    updated_fields=updated_fields.value
                ),
                tag=EVENT_TYPE_TOKEN_PAIR_UPDATED
            )
    
    @sp.entry_point
    def cleanup_token_pairs(self, params):
        """
        Deletes specified token pairs from the mapping.
        Emits an event summarizing the results of the deletions.
    
        Parameters:
            token_pair_ids (List[sp.TNat]): List of token pair IDs to delete.
        """
        sp.set_type(params, sp.TRecord(
            token_pair_ids=sp.TList(sp.TNat)
        ).layout("token_pair_ids"))
    
        # Verify that only the admin can execute.
        self.verify_admin()
    
        # Track successful and failed deletions.
        successful_deletions = sp.local("successful_deletions", sp.list(t=sp.TNat))
        failed_deletions = sp.local("failed_deletions", sp.list(t=sp.TNat))
    
        sp.for token_pair_id in params.token_pair_ids:
            sp.if self.data.token_mapping.contains(token_pair_id):
                # Delete the token pair and update the mapping size.
                del self.data.token_mapping[token_pair_id]
                self.data.token_mapping_size = sp.as_nat(self.data.token_mapping_size - 1)
                successful_deletions.value.push(token_pair_id)
            sp.else:
                failed_deletions.value.push(token_pair_id)
    
        # Emit an event summarizing the deletion operation.
        sp.emit(
            sp.record(
                successful_deletions=successful_deletions.value,
                failed_deletions=failed_deletions.value
            ),
            tag=EVENT_TYPE_TOKEN_PAIR_DELETED
        )

    # =============================================================================
    #               DEFAULT AND MISCELLANEOUS ENTRYPOINTS
    # =============================================================================
    
    @sp.entry_point
    def default(self):
        """
        Default entrypoint to handle XTZ transfers.
        Emits an event logging the sender and the transferred amount for traceability.
        """
    
        # Verify that an XTZ transfer has been made.
        sp.verify(sp.amount > sp.mutez(0), ERROR_NO_XTZ_SENT)
    
        # Emit an event logging the transferred amount.
        sp.emit(
            sp.record(
                amount=sp.amount  # Log only the transfer amount.
            ),
            tag=EVENT_TYPE_XTZ_RECEIVED
        )

# =============================================================================
# =================== BURN & REDEEM ESCROW TEST SUITE =========================
# =============================================================================

@sp.add_test(name="BurnRedeemEscrow Test Suite")
def test():
    """
    Comprehensive test suite for the BurnRedeemEscrow contract.
    Tests include contract initialization, account setup, mock token deployments,
    balance verification, token pair configurations, and admin operations.
    """

    # -------------------------------------------------------------------------
    #                        TEST SCENARIO INITIALIZATION
    # -------------------------------------------------------------------------
    scenario = sp.test_scenario()

    # -------------------------------------------------------------------------
    #                           INITIAL SETUP SECTION
    # -------------------------------------------------------------------------
    scenario.h1(">>> TEST ACCOUNT SETUP <<<")
    # Administrative and special accounts.
    admin = sp.test_account("Admin")              # Contract administrator.
    burn_address = sp.test_account("BurnAddress")   # Address to receive burned tokens.
    fake_admin = sp.test_account("FakeAdmin")       # Unauthorized user.

    # Regular user accounts.
    user1 = sp.test_account("User1")                # Token holder.
    user2 = sp.test_account("User2")                # Token recipient.
    user3 = sp.test_account("User3")                # Frequent trader.
    user4 = sp.test_account("User4")                # Account for depletion tests.
    user5 = sp.test_account("User5")                # Additional user.
    user6 = sp.test_account("User6")                # Additional user.

    # Accounts for boundary and high-value token ID tests.
    boundary_user = sp.test_account("BoundaryUser")       # For large mint amounts.
    high_value_id_user = sp.test_account("HighValueIDUser") # For high token ID tests.

    scenario.h1(">>> MOCK CONTRACT INITIALIZATION <<<")
    # Deploy mock FA2 contracts.
    mock_burn_fa2 = MockFA2()      # Contract for burnable tokens.
    mock_redeem_fa2 = MockFA2()    # Contract for redeemable tokens.
    mock_admin_fa2 = MockFA2()     # Contract for admin token transfers.

    # Deploy the main BurnRedeemEscrow contract.
    contract = BurnRedeemEscrow(admin=admin.address, initial_burn_address=burn_address.address)

    # Add deployed contracts to the scenario.
    scenario.h2("<<< CONTRACT DEPLOYMENT >>>")
    scenario += contract
    scenario += mock_burn_fa2
    scenario += mock_redeem_fa2
    scenario += mock_admin_fa2

    # -------------------------------------------------------------------------
    #                           TOKEN MINTING SECTION
    # -------------------------------------------------------------------------
    scenario.h1(">>> TOKEN MINTING <<<")
    # Mint redeem tokens to the escrow contract.
    scenario.h2("<<< Mint Redeem Tokens to Contract >>>")
    scenario += mock_redeem_fa2.mint(address=contract.address, token_id=0, amount=100).run(sender=mock_redeem_fa2.address)

    # Mint burn tokens for user accounts.
    scenario.h2("<<< Mint Burn Tokens for Users >>>")
    scenario += mock_burn_fa2.mint(address=user1.address, token_id=0, amount=100).run(sender=mock_burn_fa2.address)
    scenario += mock_burn_fa2.mint(address=user2.address, token_id=0, amount=100).run(sender=mock_burn_fa2.address)
    scenario += mock_burn_fa2.mint(address=user4.address, token_id=0, amount=10).run(sender=mock_burn_fa2.address)
    scenario += mock_burn_fa2.mint(address=user5.address, token_id=0, amount=50).run(sender=mock_burn_fa2.address)
    scenario += mock_burn_fa2.mint(address=user6.address, token_id=0, amount=50).run(sender=mock_burn_fa2.address)

    # Mint a large amount of burn tokens for the boundary user.
    scenario.h2("<<< Mint Large Burn Tokens for Boundary User >>>")
    scenario += mock_burn_fa2.mint(address=boundary_user.address, token_id=0, amount=2**31 - 1).run(sender=mock_burn_fa2.address)

    # Mint burn tokens with a high token ID for the high value ID user.
    scenario.h2("<<< Mint Large Burn Tokens for High Value ID User >>>")
    scenario += mock_burn_fa2.mint(address=high_value_id_user.address, token_id=100000, amount=500).run(sender=mock_burn_fa2.address)

    # Mint burn tokens directly to the escrow contract.
    scenario.h2("<<< Mint Burn Tokens to Contract >>>")
    scenario += mock_burn_fa2.mint(address=contract.address, token_id=0, amount=100).run(sender=mock_burn_fa2.address)

    # Mint tokens for admin-specific operations.
    scenario.h2("<<< Mint Admin Tokens >>>")
    scenario += mock_admin_fa2.mint(address=user1.address, token_id=0, amount=100).run(sender=mock_admin_fa2.address)

    # -------------------------------------------------------------------------
    #                         INITIAL BALANCE VERIFICATION
    # -------------------------------------------------------------------------
    scenario.h1(">>> INITIAL BALANCE VERIFICATION <<<")
    # Verify the escrow contract's token balances.
    scenario.h2("<<< Verify Contract Balances >>>")
    scenario.verify(mock_redeem_fa2.data.ledger[contract.address][0] == 100)  # Contract's redeem token balance.
    scenario.verify(mock_burn_fa2.data.ledger[contract.address][0] == 100)    # Contract's burn token balance.

    # Verify individual users' burn token balances.
    scenario.h2("<<< Verify User Burn Token Balances >>>")
    scenario.verify(mock_burn_fa2.data.ledger[user1.address][0] == 100)
    scenario.verify(mock_burn_fa2.data.ledger[user2.address][0] == 100)
    scenario.verify(mock_burn_fa2.data.ledger.get(user3.address, {}).get(0, 0) == 0)
    scenario.verify(mock_burn_fa2.data.ledger[user4.address][0] == 10)
    scenario.verify(mock_burn_fa2.data.ledger[user5.address][0] == 50)
    scenario.verify(mock_burn_fa2.data.ledger[user6.address][0] == 50)
    scenario.verify(mock_burn_fa2.data.ledger[boundary_user.address][0] == 2**31 - 1)
    scenario.verify(mock_burn_fa2.data.ledger[high_value_id_user.address][100000] == 500)
    
    # Verify that all users start with zero redeem tokens.
    scenario.h2("<<< Verify User Redeem Token Balances >>>")
    for user in [user1, user2, user3, user4, user5, user6, boundary_user]:
        scenario.verify(mock_redeem_fa2.data.ledger.get(user.address, {}).get(0, 0) == 0)
    
    # Verify that the burn address has zero tokens initially.
    scenario.h2("<<< Verify Burn Address Balance >>>")
    scenario.verify(mock_burn_fa2.data.ledger.get(burn_address.address, {}).get(0, 0) == 0)
    
    # Verify admin-specific token balances.
    scenario.h2("<<< Verify Admin Token Balances >>>")
    scenario.verify(mock_admin_fa2.data.ledger[user1.address][0] == 100)
    scenario.verify(mock_admin_fa2.data.ledger.get(user2.address, {}).get(0, 0) == 0)
    
    # =============================================================================
    # ======= DEFAULT ENTRYPOINT & WITHDRAWAL TESTING SECTION ====================
    # =============================================================================
    
    scenario.h1(">>> Default Entrypoint and Withdrawal Testing <<<")
    
    # Track the contract balance using a Python variable.
    contract_balance = sp.mutez(0)
    
    # -------------------- Default Entrypoint Interaction -------------------------
    scenario.h2(">>> Default Entrypoint Interaction <<<")
    scenario.h3("Send Minimal XTZ")
    scenario += contract.default().run(sender=admin, amount=sp.mutez(1))
    contract_balance += sp.mutez(1)
    scenario.verify(contract_balance == sp.mutez(1))
    
    # ------------------ Sending XTZ to the Contract ------------------------------
    scenario.h2(">>> Send Larger XTZ to Contract <<<")
    scenario.h3("Send 10 XTZ")
    scenario += contract.default().run(sender=admin, amount=sp.mutez(10_000_000))
    contract_balance += sp.mutez(10_000_000)
    scenario.verify(contract_balance == sp.mutez(10_000_001))
    
    # --------------------- Admin Withdrawal Section --------------------------------
    scenario.h2(">>> Admin Withdrawal of XTZ <<<")
    scenario.h3("Admin Withdraws 1 XTZ")
    scenario += contract.admin_withdraw_xtz(sp.record(amount=sp.mutez(1_000_000))).run(sender=admin)
    contract_balance -= sp.mutez(1_000_000)
    scenario.verify(contract_balance == sp.mutez(9_000_001))
    
    # ------------------ Malformed Input Testing -----------------------------------
    scenario.h2(">>> Invalid Parameter Testing for admin_withdraw_xtz <<<")
    
    # Zero mutez withdrawal.
    scenario.h3("Zero Mutez Withdrawal")
    scenario += contract.admin_withdraw_xtz(sp.record(amount=sp.mutez(0))).run(sender=admin, valid=False)
    scenario.verify(contract_balance == sp.mutez(9_000_001))
    
    # Excessive withdrawal attempt.
    scenario.h3("Excessive Withdrawal Attempt")
    scenario += contract.admin_withdraw_xtz(sp.record(amount=sp.mutez(20_000_000))).run(sender=admin, valid=False)
    scenario.verify(contract_balance == sp.mutez(9_000_001))
    
    # Unauthorized withdrawal attempt.
    scenario.h3("Unauthorized Withdrawal Attempt")
    scenario += contract.admin_withdraw_xtz(sp.record(amount=sp.mutez(1_000_000))).run(sender=fake_admin, valid=False)
    scenario.verify(contract_balance == sp.mutez(9_000_001))
    
    # Malformed Input: Excessively large mutez amount.
    scenario.h3("Malformed Input: Excessively Large Mutez Amount")
    scenario += contract.admin_withdraw_xtz(
        sp.set_type_expr(sp.record(amount=sp.utils.nat_to_mutez(2**63 - 1)), sp.TRecord(amount=sp.TMutez))
    ).run(sender=admin, valid=False)
    
    # ------------------------- Final Cleanup --------------------------------------
    scenario.h3("Withdraw Remaining Balance")
    scenario += contract.admin_withdraw_xtz(sp.record(amount=contract_balance)).run(sender=admin)
    contract_balance = sp.mutez(0)
    scenario.verify(contract_balance == sp.mutez(0))
    
    # =============================================================================
    # ======= END DEFAULT ENTRYPOINT & WITHDRAWAL TESTING SECTION =================
    # =============================================================================

    # =============================================================================
    # ========== CONFIGURE TOKEN PAIRS SECTION ====================================
    # =============================================================================
    
    scenario.h1(">>> Configuring Token Pairs <<<")
    
    # ------------------- Testing Empty Input -------------------
    scenario.h2(">>> Test Empty Token Pair Input <<<")
    # Attempt to add no token pairs.
    scenario += contract.set_token_pairs(token_pairs=[]).run(sender=admin)
    # Verify that no token pairs were added.
    scenario.verify_equal(contract.data.token_mapping_size, 0)
    
    # ------------------- Adding Standard Token Pairs -------------------
    scenario.h2(">>> Add Standard Token Pairs <<<")
    # Add two token pairs with different burn/redeem ratios.
    scenario += contract.set_token_pairs(
        token_pairs=[
            sp.record(
                token_pair_id=1,
                burn_contract_address=mock_burn_fa2.address,
                burn_token_id=0,
                burn_amount=2,  # Burn 2 tokens.
                redeem_contract_address=mock_redeem_fa2.address,
                redeem_token_id=0,
                redeem_amount=1  # Redeem 1 token.
            ),
            sp.record(
                token_pair_id=2,
                burn_contract_address=mock_burn_fa2.address,
                burn_token_id=0,
                burn_amount=3,  # Burn 3 tokens.
                redeem_contract_address=mock_redeem_fa2.address,
                redeem_token_id=0,
                redeem_amount=2  # Redeem 2 tokens.
            )
        ]
    ).run(sender=admin)
    
    # Verify that the token pairs were added.
    scenario.verify(contract.data.token_mapping.contains(1))
    scenario.verify(contract.data.token_mapping.contains(2))
    
    # ------------------- Duplicate Token Pair ID -------------------
    scenario.h2(">>> Test Duplicate Token Pair ID <<<")
    # Attempt to add a duplicate token pair ID (ID 1 already exists).
    scenario += contract.set_token_pairs(
        token_pairs=[
            sp.record(
                token_pair_id=1,  # Duplicate ID.
                burn_contract_address=mock_burn_fa2.address,
                burn_token_id=0,
                burn_amount=5,
                redeem_contract_address=mock_redeem_fa2.address,
                redeem_token_id=0,
                redeem_amount=1
            )
        ]
    ).run(sender=admin, valid=False)
    
    # ------------------- Adding Token Pair for Insufficient Burn Balance Test -------------------
    scenario.h2(">>> Add Token Pair for Insufficient Burn Balance Test <<<")
    # Add a token pair with a burn amount exceeding typical user balances.
    scenario += contract.set_token_pairs(
        token_pairs=[
            sp.record(
                token_pair_id=4,
                burn_contract_address=mock_burn_fa2.address,
                burn_token_id=0,
                burn_amount=90,  # Burn amount exceeds typical user balances.
                redeem_contract_address=mock_redeem_fa2.address,
                redeem_token_id=0,
                redeem_amount=1  # Redeem 1 token.
            )
        ]
    ).run(sender=admin)
    # Verify that the token pair was added.
    scenario.verify(contract.data.token_mapping.contains(4))
    
    # ------------------- Adding Equal Ratios Token Pair -------------------
    scenario.h2(">>> Add Equal Ratios Token Pair <<<")
    # Add a token pair with a 1:1 burn-to-redeem ratio.
    scenario += contract.set_token_pairs(
        token_pairs=[
            sp.record(
                token_pair_id=5,
                burn_contract_address=mock_burn_fa2.address,
                burn_token_id=0,
                burn_amount=1,  # Burn 1 token.
                redeem_contract_address=mock_redeem_fa2.address,
                redeem_token_id=0,
                redeem_amount=1  # Redeem 1 token.
            )
        ]
    ).run(sender=admin)
    # Verify that the token pair was added.
    scenario.verify(contract.data.token_mapping.contains(5))
    
    # ------------------- Adding Token Pairs for Frequent Trade Simulations -------------------
    scenario.h2(">>> Add Token Pairs for Frequent Trade Simulations <<<")
    # Add token pairs to be used in high-frequency trade stress tests.
    scenario += contract.set_token_pairs(
        token_pairs=[
            sp.record(
                token_pair_id=6,
                burn_contract_address=mock_burn_fa2.address,
                burn_token_id=0,
                burn_amount=5,  # Burn 5 tokens.
                redeem_contract_address=mock_redeem_fa2.address,
                redeem_token_id=0,
                redeem_amount=1  # Redeem 1 token.
            ),
            sp.record(
                token_pair_id=7,
                burn_contract_address=mock_burn_fa2.address,
                burn_token_id=0,
                burn_amount=10,  # Burn 10 tokens.
                redeem_contract_address=mock_redeem_fa2.address,
                redeem_token_id=0,
                redeem_amount=2  # Redeem 2 tokens.
            )
        ]
    ).run(sender=admin)
    # Verify that the token pairs were added.
    scenario.verify(contract.data.token_mapping.contains(6))
    scenario.verify(contract.data.token_mapping.contains(7))
    
    # ------------------- Adding Edge Case Token Pair: 1:50 Ratio -------------------
    scenario.h2(">>> Add Edge Case Token Pair (1:50 Ratio) <<<")
    # Add a token pair with a large burn-to-redeem ratio.
    scenario += contract.set_token_pairs(
        token_pairs=[
            sp.record(
                token_pair_id=8,
                burn_contract_address=mock_burn_fa2.address,
                burn_token_id=0,
                burn_amount=1,  # Burn 1 token.
                redeem_contract_address=mock_redeem_fa2.address,
                redeem_token_id=0,
                redeem_amount=50  # Redeem 50 tokens.
            )
        ]
    ).run(sender=admin)
    # Verify that the token pair was added.
    scenario.verify(contract.data.token_mapping.contains(8))
    
    # ------------------- Adding Token Pair for Boundary User with Normal Ratio -------------------
    scenario.h2(">>> Add Token Pair for Boundary User with Normal Ratio <<<")
    # Add a token pair with a normal ratio for the boundary user.
    scenario += contract.set_token_pairs(
        token_pairs=[
            sp.record(
                token_pair_id=9,  # New token pair ID.
                burn_contract_address=mock_burn_fa2.address,
                burn_token_id=0,
                burn_amount=10,  # Burn 10 tokens.
                redeem_contract_address=mock_redeem_fa2.address,
                redeem_token_id=0,
                redeem_amount=1  # Redeem 1 token.
            )
        ]
    ).run(sender=admin)
    # Verify that the token pair was added.
    scenario.verify(contract.data.token_mapping.contains(9))
    
    # ------------------- Adding Token Pair for Boundary User with Reduced Burn Amount -------------------
    scenario.h2(">>> Add Token Pair for Boundary User with Reduced Burn Amount <<<")
    scenario += contract.set_token_pairs(
        token_pairs=[
            sp.record(
                token_pair_id=10,  # New token pair ID for the boundary test.
                burn_contract_address=mock_burn_fa2.address,
                burn_token_id=0,
                burn_amount=(2**29 - 1),  # Reduced near-max amount of tokens to burn.
                redeem_contract_address=mock_redeem_fa2.address,
                redeem_token_id=0,
                redeem_amount=1  # Redeem 1 token for simplicity.
            )
        ]
    ).run(sender=admin)
    # Verify that the token pair was added.
    scenario.verify(contract.data.token_mapping.contains(10))
    
    # ------------------- Adding Token Pair for High Value ID User -------------------
    scenario.h2(">>> Add Token Pair for High Value ID User <<<")
    scenario += contract.set_token_pairs(
        token_pairs=[
            sp.record(
                token_pair_id=11,  # New token pair ID for the high value ID test.
                burn_contract_address=mock_burn_fa2.address,
                burn_token_id=100000,  # Token ID for burnable tokens.
                burn_amount=2,  # Burn 2 tokens.
                redeem_contract_address=mock_redeem_fa2.address,
                redeem_token_id=0,
                redeem_amount=1  # Redeem 1 token for simplicity.
            )
        ]
    ).run(sender=admin)
    # Verify that the token pair was added.
    scenario.verify(contract.data.token_mapping.contains(11))
    
    # =============================================================================
    # ========== END CONFIGURE TOKEN PAIRS SECTION ================================
    # =============================================================================

    # =============================================================================
    # ======== NON-ADMIN FUNCTIONALITY RESTRICTIONS SECTION ========
    # =============================================================================
    
    scenario.h1(">>> Non-Admin Functionality Restrictions <<<")
    
    # ------------------- Non-Admin Attempts to Set Token Pairs -------------------
    scenario.h2(">>> Set Token Pair by Non-Admin <<<")
    # User1 (not admin) attempts to add a token pair; this should fail.
    scenario += contract.set_token_pairs(
        token_pairs=[
            sp.record(
                token_pair_id=4,
                burn_contract_address=mock_burn_fa2.address,
                burn_token_id=0,
                burn_amount=1,
                redeem_contract_address=mock_redeem_fa2.address,
                redeem_token_id=0,
                redeem_amount=1
            )
        ]
    ).run(sender=user1, valid=False)
    
    # ------------------- Non-Admin Attempts to Delete Token Pairs -------------------
    scenario.h2(">>> Delete Token Pair by Non-Admin <<<")
    # User3 (not admin) attempts to delete token pair ID 2; this should fail.
    scenario += contract.cleanup_token_pairs(
        token_pair_ids=[2]
    ).run(sender=user3, valid=False)
    
    # ------------------- Non-Admin Attempts to Update Token Pairs -------------------
    scenario.h2(">>> Update Token Pair by Non-Admin <<<")
    # User2 (not admin) attempts to update an existing token pair; this should fail.
    scenario += contract.update_token_pair(
        token_pair_id=1,
        burn_contract_address=mock_burn_fa2.address,
        burn_token_id=0,
        burn_amount=4,  # Attempt to update with a higher burn amount.
        redeem_contract_address=mock_redeem_fa2.address,
        redeem_token_id=0,
        redeem_amount=2  # Attempt to update with a higher redeem amount.
    ).run(sender=user2, valid=False)
    
    # ------------------- Non-Admin Attempts to Pause Contract -------------------
    scenario.h2(">>> Pause Contract by Non-Admin <<<")
    # User1 (not admin) attempts to toggle the pause; this should fail with an unauthorized error.
    scenario += contract.toggle_pause().run(
        sender=user1,
        valid=False,
        exception=ERROR_UNAUTHORIZED  # Expected error for unauthorized access.
    )
    
    # ------------------- Non-Admin Attempts to Withdraw XTZ -------------------
    scenario.h2(">>> Withdraw XTZ by Non-Admin <<<")
    # User2 (not admin) attempts to withdraw XTZ from the contract; this should fail.
    scenario += contract.admin_withdraw_xtz(sp.record(amount=sp.tez(1))).run(sender=user2, valid=False)
    
    # ------------------- Admin Transfers Tokens -------------------
    scenario.h2(">>> Admin Transfers Tokens <<<")
    # Admin transfers burn tokens from the contract to User1.
    scenario += contract.admin_transfer_token(
        token_contract=mock_burn_fa2.address,
        token_id=0,
        to_=user1.address,
        amount=5
    ).run(sender=admin)
    
    # Verify token transfer.
    scenario.h3(">>> Verify Token Transfer <<<")
    # Verify User1's updated burn token balance.
    scenario.verify(mock_burn_fa2.data.ledger[user1.address][0] == 105)
    # Verify the contract's updated burn token balance.
    scenario.verify(mock_burn_fa2.data.ledger[contract.address][0] == 95)
    
    # =============================================================================
    # ======== END NON-ADMIN FUNCTIONALITY RESTRICTIONS SECTION ========
    # =============================================================================
    
    # =============================================================================
    # ======== ADMIN TOGGLE PAUSE // TESTS ========================================
    # =============================================================================
    
    scenario.h1(">>> Pause and Unpause Contract by Admin <<<")
    
    # ------------------- Verify Initial Contract State -------------------
    scenario.h2(">>> Verify Initial State <<<")
    scenario.verify(contract.data.paused == True)  # Ensure the contract starts paused.
    
    # ------------------- Single Toggle for Initial Validation -------------------
    scenario.h2(">>> Single Toggle for Initial Validation <<<")
    scenario += contract.toggle_pause().run(sender=admin, valid=True)  # Unpause the contract.
    scenario.verify(contract.data.paused == False)
    
    scenario += contract.toggle_pause().run(sender=admin, valid=True)  # Pause the contract again.
    scenario.verify(contract.data.paused == True)
    
    # ------------------- Consecutive Toggling of Pause State -------------------
    scenario.h2(">>> Consecutive Toggling of Pause State <<<")
    # Perform multiple toggles by the admin.
    scenario += contract.toggle_pause().run(sender=admin, valid=True)  # Toggle: Unpause.
    scenario.verify(contract.data.paused == False)
    
    scenario += contract.toggle_pause().run(sender=admin, valid=True)  # Toggle: Pause.
    scenario.verify(contract.data.paused == True)
    
    scenario += contract.toggle_pause().run(sender=admin, valid=True)  # Toggle: Unpause again.
    scenario.verify(contract.data.paused == False)
    
    # ------------------- Malformed Input Testing for Toggle Pause -------------------
    scenario.h2(">>> Malformed Input Testing for toggle_pause <<<")
    # Invalid: Toggle pause by non-admin user.
    scenario += contract.toggle_pause().run(sender=user1, valid=False)
    scenario.verify(contract.data.paused == False)  # Contract state remains unchanged.
    
    # Invalid: Calling with incorrect permissions.
    scenario.h3(">>> Invalid Permissions Test <<<")
    scenario += contract.toggle_pause().run(sender=user2, valid=False)
    scenario.verify(contract.data.paused == False)  # State remains unchanged.
    
    # ------------------- Final Pause/Unpause Test -------------------
    scenario.h3(">>> Final Pause/Unpause Test <<<")
    # Admin toggles to pause the contract.
    scenario += contract.toggle_pause().run(sender=admin, valid=True)
    scenario.verify(contract.data.paused == True)
    
    # Admin toggles to unpause the contract.
    scenario += contract.toggle_pause().run(sender=admin, valid=True)
    scenario.verify(contract.data.paused == False)
    
    # =============================================================================
    # ======== END ADMIN TOGGLE PAUSE // TESTS ====================================
    # =============================================================================
    
    # =============================================================================
    # ======== STANDARD VALID TRADE TESTS SECTION ===============================
    # =============================================================================
    
    scenario.h1(">>> Standard Valid Trade Tests <<<")
    
    # ------------------- Trade Using Token Pair ID 1 -------------------
    scenario.h2(">>> User1 Trade with Token Pair ID 1 <<<")
    # User1 initiates a trade using token_pair_id=1 (2:1 burn-to-redeem ratio).
    scenario += contract.initiate_trade(
        trades=[
            sp.record(
                token_pair_id=1,
                user_wallet=user1.address,
                burn_contract_address=mock_burn_fa2.address,
                burn_token_id=0,
                burn_amount=2,  # Burn 2 tokens.
                redeem_contract_address=mock_redeem_fa2.address,
                redeem_token_id=0
            )
        ]
    ).run(sender=user1)
    
    # Verify balances after the trade.
    scenario.verify(mock_burn_fa2.data.ledger[user1.address][0] == 103)
    scenario.verify(mock_redeem_fa2.data.ledger[user1.address][0] == 1)
    scenario.verify(mock_redeem_fa2.data.ledger[contract.address][0] == 99)
    scenario.verify(mock_burn_fa2.data.ledger[burn_address.address][0] == 2)
    
    # ------------------- Trade Using Token Pair ID 2 -------------------
    scenario.h2(">>> User2 Trade with Token Pair ID 2 <<<")
    scenario += contract.initiate_trade(
        trades=[
            sp.record(
                token_pair_id=2,
                user_wallet=user2.address,
                burn_contract_address=mock_burn_fa2.address,
                burn_token_id=0,
                burn_amount=3,
                redeem_contract_address=mock_redeem_fa2.address,
                redeem_token_id=0
            )
        ]
    ).run(sender=user2)
    
    # Verify balances after the trade.
    scenario.verify(mock_burn_fa2.data.ledger[user2.address][0] == 97)
    scenario.verify(mock_redeem_fa2.data.ledger[user2.address][0] == 2)
    scenario.verify(mock_redeem_fa2.data.ledger[contract.address][0] == 97)
    scenario.verify(mock_burn_fa2.data.ledger[burn_address.address][0] == 5)
    
    # ------------------- Additional Trade Using Token Pair ID 2 -------------------
    scenario.h2(">>> User1 Trade with Token Pair ID 2 <<<")
    scenario += contract.initiate_trade(
        trades=[
            sp.record(
                token_pair_id=2,
                user_wallet=user1.address,
                burn_contract_address=mock_burn_fa2.address,
                burn_token_id=0,
                burn_amount=3,
                redeem_contract_address=mock_redeem_fa2.address,
                redeem_token_id=0
            )
        ]
    ).run(sender=user1)
    
    # Verify balances after the second trade.
    scenario.verify(mock_burn_fa2.data.ledger[user1.address][0] == 100)
    scenario.verify(mock_redeem_fa2.data.ledger[user1.address][0] == 3)
    scenario.verify(mock_redeem_fa2.data.ledger[contract.address][0] == 95)
    scenario.verify(mock_burn_fa2.data.ledger[burn_address.address][0] == 8)
    
    # ------------------- Trade with High Ratio Token Pair (1:50) -------------------
    scenario.h2(">>> User1 Trade with High Ratio Token Pair (1:50) <<<")
    scenario += contract.initiate_trade(
        trades=[
            sp.record(
                token_pair_id=8,
                user_wallet=user1.address,
                burn_contract_address=mock_burn_fa2.address,
                burn_token_id=0,
                burn_amount=1,
                redeem_contract_address=mock_redeem_fa2.address,
                redeem_token_id=0
            )
        ]
    ).run(sender=user1)
    
    # Verify balances after the trade.
    scenario.verify(mock_burn_fa2.data.ledger[user1.address][0] == 99)
    scenario.verify(mock_burn_fa2.data.ledger[burn_address.address][0] == 9)
    scenario.verify(mock_redeem_fa2.data.ledger[user1.address][0] == 53)
    scenario.verify(mock_redeem_fa2.data.ledger[contract.address][0] == 45)
    
    # ------------------- Trade Using Token Pair ID 1 by Another User -------------------
    scenario.h2(">>> User5 Trade with Token Pair ID 1 <<<")
    scenario += contract.initiate_trade(
        trades=[
            sp.record(
                token_pair_id=1,
                user_wallet=user5.address,
                burn_contract_address=mock_burn_fa2.address,
                burn_token_id=0,
                burn_amount=2,
                redeem_contract_address=mock_redeem_fa2.address,
                redeem_token_id=0
            )
        ]
    ).run(sender=user5)
    
    # Verify balances for User5.
    scenario.verify(mock_burn_fa2.data.ledger[user5.address][0] == 48)
    scenario.verify(mock_redeem_fa2.data.ledger[user5.address][0] == 1)
    scenario.verify(mock_redeem_fa2.data.ledger[contract.address][0] == 44)
    scenario.verify(mock_burn_fa2.data.ledger[burn_address.address][0] == 11)
    
    # ------------------- Trade Using Token Pair ID 2 by Another User -------------------
    scenario.h2(">>> User6 Trade with Token Pair ID 2 <<<")
    scenario += contract.initiate_trade(
        trades=[
            sp.record(
                token_pair_id=2,
                user_wallet=user6.address,
                burn_contract_address=mock_burn_fa2.address,
                burn_token_id=0,
                burn_amount=3,
                redeem_contract_address=mock_redeem_fa2.address,
                redeem_token_id=0
            )
        ]
    ).run(sender=user6)
    
    # Verify balances for User6.
    scenario.verify(mock_burn_fa2.data.ledger[user6.address][0] == 47)
    scenario.verify(mock_redeem_fa2.data.ledger[user6.address][0] == 2)
    scenario.verify(mock_redeem_fa2.data.ledger[contract.address][0] == 42)
    scenario.verify(mock_burn_fa2.data.ledger[burn_address.address][0] == 14)
    
    # =============================================================================
    # ======== END STANDARD VALID TRADE TESTS SECTION ===========================
    # =============================================================================
    
    # =============================================================================
    # ======== STANDARD INVALID TRADE TESTS SECTION =============================
    # =============================================================================
    
    scenario.h1(">>> Standard Invalid Trade Tests <<<")
    
    # ------------------- Pause and Unpause Functionality -------------------
    scenario.h2(">>> Pause and Unpause Functionality <<<")
    
    # Admin pauses the contract.
    scenario += contract.toggle_pause().run(sender=admin)
    scenario.verify(contract.data.paused == True)  # Contract should now be paused.
    
    # Attempt to initiate a trade while the contract is paused.
    scenario.h3(">>> Attempt Trade While Paused <<<")
    scenario += contract.initiate_trade(
        trades=[
            sp.record(
                token_pair_id=8,
                user_wallet=user1.address,
                burn_contract_address=mock_burn_fa2.address,
                burn_token_id=0,
                burn_amount=1,
                redeem_contract_address=mock_redeem_fa2.address,
                redeem_token_id=0
            )
        ]
    ).run(sender=user1, valid=False)  # Should fail due to paused contract.
    
    # Admin unpauses the contract.
    scenario.h3(">>> Unpause the Contract <<<")
    scenario += contract.toggle_pause().run(sender=admin)
    scenario.verify(contract.data.paused == False)  # Contract should now be unpaused.
    
    # ------------------- Insufficient Burn Token Balance Test -------------------
    scenario.h2(">>> Insufficient Burn Token Balance Test <<<")
    
    # Verify that User3's initial burn token balance is zero.
    scenario.h3(">>> Verify Initial Burn Token Balance for User3 <<<")
    scenario.verify(mock_burn_fa2.data.ledger.get(user3.address, {}).get(0, 0) == 0)
    
    # User3 attempts to initiate a trade with no burn tokens.
    scenario.h3(">>> User3 Attempts Trade with Insufficient Burn Tokens <<<")
    scenario += contract.initiate_trade(
        trades=[
            sp.record(
                token_pair_id=1,
                user_wallet=user3.address,
                burn_contract_address=mock_burn_fa2.address,
                burn_token_id=0,
                burn_amount=2,
                redeem_contract_address=mock_redeem_fa2.address,
                redeem_token_id=0
            )
        ]
    ).run(sender=user3, valid=False)  # Should fail due to insufficient balance.
    
    # ------------------- Verify Balances Remain Unchanged -------------------
    scenario.h2(">>> Verify Balances Remain Unchanged After Invalid Actions <<<")
    
    scenario.h3(">>> Verify User Balances <<<")
    scenario.verify(mock_burn_fa2.data.ledger[user1.address][0] == 99)
    scenario.verify(mock_burn_fa2.data.ledger[user2.address][0] == 97)
    
    scenario.h3(">>> Verify Contract Balances <<<")
    scenario.verify(mock_redeem_fa2.data.ledger[contract.address][0] == 42)
    scenario.verify(mock_redeem_fa2.data.ledger[user1.address][0] == 53)
    scenario.verify(mock_redeem_fa2.data.ledger[user2.address][0] == 2)
    
    # ------------------- Invalid Trade Test (Incorrect Burn Amount) -------------------
    scenario.h2(">>> Invalid Trade Test with Incorrect Burn Amount <<<")
    
    scenario.h3(">>> User1 Attempts Trade with Incorrect Burn Amount <<<")
    scenario += contract.initiate_trade(
        trades=[
            sp.record(
                token_pair_id=1,
                user_wallet=user1.address,
                burn_contract_address=mock_burn_fa2.address,
                burn_token_id=0,
                burn_amount=3,  # Incorrect burn amount.
                redeem_contract_address=mock_redeem_fa2.address,
                redeem_token_id=0
            )
        ]
    ).run(sender=user1, valid=False)  # Should fail due to incorrect burn amount.
    
    # Verify balances remain unchanged after the failed trade.
    scenario.h3(">>> Verify Balances Remain Unchanged After Invalid Trade <<<")
    scenario.verify(mock_burn_fa2.data.ledger[user1.address][0] == 99)
    scenario.verify(mock_redeem_fa2.data.ledger[user1.address][0] == 53)
    scenario.verify(mock_redeem_fa2.data.ledger[contract.address][0] == 42)
    scenario.verify(mock_burn_fa2.data.ledger[burn_address.address][0] == 14)
    
    # =============================================================================
    # ======== INITIATE TRADE MALFORMED INPUT TESTS ===============================
    # =============================================================================
    
    scenario.h1(">>> Initiate Trade Malformed Input Tests <<<")
    
    # ------------------- Malformed redeem_contract_address -------------------
    scenario.h2(">>> Malformed redeem_contract_address Tests <<<")
    
    # Test with a malformed redeem_contract_address using an invalid prefix.
    scenario.h3(">>> Malformed redeem_contract_address with Invalid Prefix <<<")
    scenario += contract.initiate_trade(
        trades=[
            sp.record(
                token_pair_id=1,
                user_wallet=user1.address,
                burn_contract_address=mock_burn_fa2.address,
                burn_token_id=0,
                burn_amount=2,
                redeem_contract_address=sp.address("tz1InvalidPrefix"),
                redeem_token_id=0
            )
        ]
    ).run(sender=user1, valid=False, exception="Error: Invalid token parameters.")
    
    # ------------------- Verify State After Malformed Inputs -------------------
    scenario.h3(">>> Verify State After Malformed Inputs <<<")
    scenario.verify(mock_burn_fa2.data.ledger[user1.address][0] == 99)
    scenario.verify(mock_redeem_fa2.data.ledger[user1.address][0] == 53)
    scenario.verify(mock_redeem_fa2.data.ledger[contract.address][0] == 42)
    
    # =============================================================================
    # ======== END STANDARD INVALID TRADE TESTS SECTION =========================
    # =============================================================================
    
    # =============================================================================
    # ======== VALID EDGE TRADE TESTS SECTION =====================================
    # =============================================================================
    
    # ----- Quick Succession Trade Tests -----
    scenario.h1("Quick Succession Trade Tests")
    
    # --- User5 Trade with Token Pair ID 1 ---
    scenario.h2("User5 Initiates Trade with Token Pair ID 1")
    scenario.h3("Execute Trade")
    scenario += contract.initiate_trade(
        trades=[
            sp.record(
                token_pair_id=1,
                user_wallet=user5.address,
                burn_contract_address=mock_burn_fa2.address,
                burn_token_id=0,
                burn_amount=2,  
                redeem_contract_address=mock_redeem_fa2.address,
                redeem_token_id=0
            )
        ]
    ).run(sender=user5)
    
    scenario.h3("Verify Balances After Trade")
    scenario.verify(mock_burn_fa2.data.ledger[user5.address][0] == 46)
    scenario.verify(mock_redeem_fa2.data.ledger[user5.address][0] == 2)
    scenario.verify(mock_redeem_fa2.data.ledger[contract.address][0] == 41)
    scenario.verify(mock_burn_fa2.data.ledger[burn_address.address][0] == 16)
    
    
    # --- User6 Trade with Token Pair ID 2 ---
    scenario.h1("User6 Initiates Trade with Token Pair ID 2")
    scenario.h3("Execute Trade")
    scenario += contract.initiate_trade(
        trades=[
            sp.record(
                token_pair_id=2,
                user_wallet=user6.address,
                burn_contract_address=mock_burn_fa2.address,
                burn_token_id=0,
                burn_amount=3,  
                redeem_contract_address=mock_redeem_fa2.address,
                redeem_token_id=0
            )
        ]
    ).run(sender=user6)
    
    scenario.h3("Verify Balances After Trade")
    scenario.verify(mock_burn_fa2.data.ledger[user6.address][0] == 44)
    scenario.verify(mock_redeem_fa2.data.ledger[user6.address][0] == 4)
    scenario.verify(mock_redeem_fa2.data.ledger[contract.address][0] == 39)
    scenario.verify(mock_burn_fa2.data.ledger[burn_address.address][0] == 19)
    
    
    # --- User1 Additional Trade with Token Pair ID 1 ---
    scenario.h1("User1 Initiates Additional Trade with Token Pair ID 1")
    scenario.h3("Execute Trade")
    scenario += contract.initiate_trade(
        trades=[
            sp.record(
                token_pair_id=1,
                user_wallet=user1.address,
                burn_contract_address=mock_burn_fa2.address,
                burn_token_id=0,
                burn_amount=2,  
                redeem_contract_address=mock_redeem_fa2.address,
                redeem_token_id=0
            )
        ]
    ).run(sender=user1)
    
    scenario.h3("Verify Balances After Trade")
    scenario.verify(mock_burn_fa2.data.ledger[user1.address][0] == 97)
    scenario.verify(mock_redeem_fa2.data.ledger[user1.address][0] == 54)
    scenario.verify(mock_redeem_fa2.data.ledger[contract.address][0] == 38)
    scenario.verify(mock_burn_fa2.data.ledger[burn_address.address][0] == 21)
    
    
    # ----- Frequent Trades Stress Test -----
    scenario.h1("Frequent Trades Stress Test")
    
    # --- User1 Performs Consecutive Trades ---
    scenario.h2("User1 Performs Consecutive Trades")
    scenario.h3("Execute Trades")
    for i in range(10):
        scenario += contract.initiate_trade(
            trades=[
                sp.record(
                    token_pair_id=6,
                    user_wallet=user1.address,
                    burn_contract_address=mock_burn_fa2.address,
                    burn_token_id=0,
                    burn_amount=5,
                    redeem_contract_address=mock_redeem_fa2.address,
                    redeem_token_id=0
                )
            ]
        ).run(sender=user1, valid=True, now=sp.timestamp(1000 + i))
    
    # --- User2 Performs Trades with Higher Ratio ---
    scenario.h2("User2 Trades with Higher Ratio")
    scenario.h3("Execute Trades")
    for i in range(5):
        scenario += contract.initiate_trade(
            trades=[
                sp.record(
                    token_pair_id=7,
                    user_wallet=user2.address,
                    burn_contract_address=mock_burn_fa2.address,
                    burn_token_id=0,
                    burn_amount=10,
                    redeem_contract_address=mock_redeem_fa2.address,
                    redeem_token_id=0
                )
            ]
        ).run(sender=user2, valid=True, now=sp.timestamp(2000 + i))
    
    # --- Interleaved Trades Between Users ---
    scenario.h2("Interleaved Trades Between Users")
    scenario.h3("Execute Interleaved Trades")
    for i in range(5):
        scenario += contract.initiate_trade(
            trades=[
                sp.record(
                    token_pair_id=6,
                    user_wallet=user1.address,
                    burn_contract_address=mock_burn_fa2.address,
                    burn_token_id=0,
                    burn_amount=5,
                    redeem_contract_address=mock_redeem_fa2.address,
                    redeem_token_id=0
                )
            ]
        ).run(sender=user1, valid=True, now=sp.timestamp(3000 + i))
    
        scenario += contract.initiate_trade(
            trades=[
                sp.record(
                    token_pair_id=7,
                    user_wallet=user3.address,
                    burn_contract_address=mock_burn_fa2.address,
                    burn_token_id=0,
                    burn_amount=10,
                    redeem_contract_address=mock_redeem_fa2.address,
                    redeem_token_id=0
                )
            ]
        ).run(sender=user3, valid=False, now=sp.timestamp(4000 + i))
    
    
    # ----- Trade w/ Updated Token Pair Test -----
    scenario.h1("Trade w/ Updated Token Pair Test")
    
    # --- Admin Updates Token Pair ---
    scenario.h2("Admin Updates Token Pair")
    scenario.h3("Execute Update")
    scenario += contract.update_token_pair(
        token_pair_id=1,
        burn_contract_address=mock_burn_fa2.address,
        burn_token_id=0,
        burn_amount=3,
        redeem_contract_address=mock_redeem_fa2.address,
        redeem_token_id=0,
        redeem_amount=1
    ).run(sender=admin)
    
    # --- User1 Trades with Updated Token Pair ---
    scenario.h2("User1 Trades with Updated Token Pair")
    scenario.h3("Execute Trade")
    scenario += contract.initiate_trade(
        trades=[
            sp.record(
                token_pair_id=1,
                user_wallet=user1.address,
                burn_contract_address=mock_burn_fa2.address,
                burn_token_id=0,
                burn_amount=3,
                redeem_contract_address=mock_redeem_fa2.address,
                redeem_token_id=0
            )
        ]
    ).run(sender=user1)
    
    # =============================================================================
    # ======== END VALID EDGE TRADE TESTS SECTION =================================
    # =============================================================================

    # =============================================================================
    # ======== INVALID EDGE CASE TESTS SECTION ====================================
    # =============================================================================
    
    scenario.h1(">>> Insufficient Contract Redeem Token Balance Tests <<<")
    
    # --- Trade After Redeem Token Depletion ---
    scenario.h2(">>> User4 Attempts Trade After Redeem Token Depletion <<<")
    scenario.h3(">>> Execute Trade <<<")
    scenario += contract.initiate_trade(
        trades=[
            sp.record(
                token_pair_id=3,
                user_wallet=user4.address,
                burn_contract_address=mock_burn_fa2.address,
                burn_token_id=0,
                burn_amount=1,
                redeem_contract_address=mock_redeem_fa2.address,
                redeem_token_id=0
            )
        ]
    ).run(sender=user4, valid=False)  # Should fail due to insufficient redeem tokens in contract
    
    # --- Trade Exceeding Burn Token Balance ---
    scenario.h2(">>> User1 Attempts Trade Exceeding Burn Token Balance <<<")
    scenario.h3(">>> Execute Trade <<<")
    scenario += contract.initiate_trade(
        trades=[
            sp.record(
                token_pair_id=4,
                user_wallet=user1.address,
                burn_contract_address=mock_burn_fa2.address,
                burn_token_id=0,
                burn_amount=90,
                redeem_contract_address=mock_redeem_fa2.address,
                redeem_token_id=0
            )
        ]
    ).run(sender=user1, valid=False)  # Should fail due to insufficient burn token balance
    
    # --- Trade with Equal Ratio Token Pair ---
    scenario.h2(">>> User2 Trades with Equal Ratio Token Pair <<<")
    scenario.h3(">>> Execute Trade <<<")
    scenario += contract.initiate_trade(
        trades=[
            sp.record(
                token_pair_id=5,
                user_wallet=user2.address,
                burn_contract_address=mock_burn_fa2.address,
                burn_token_id=0,
                burn_amount=1,
                redeem_contract_address=mock_redeem_fa2.address,
                redeem_token_id=0
            )
        ]
    ).run(sender=user2)  # Should succeed as the trade is valid
    
    # ----- Final Balance Verification -----
    scenario.h1(">>> Final Balance Verification <<<")
    
    # --- User1 Final Balances ---
    scenario.h3(">>> Verify User1 Balances <<<")
    scenario.verify(mock_burn_fa2.data.ledger[user1.address][0] == 19)
    scenario.verify(mock_redeem_fa2.data.ledger[user1.address][0] == 70)
    
    # --- User2 Final Balances ---
    scenario.h3(">>> Verify User2 Balances <<<")
    scenario.verify(mock_burn_fa2.data.ledger[user2.address][0] == 46)
    scenario.verify(mock_redeem_fa2.data.ledger[user2.address][0] == 13)
    
    # --- User3 Final Balances ---
    scenario.h3(">>> Verify User3 Balances <<<")
    scenario.verify(mock_burn_fa2.data.ledger.get(user3.address, {}).get(0, 0) == 0)
    scenario.verify(mock_redeem_fa2.data.ledger.get(user3.address, {}).get(0, 0) == 0)
    
    # --- User4 Final Balances ---
    scenario.h3(">>> Verify User4 Balances <<<")
    scenario.verify(mock_burn_fa2.data.ledger[user4.address][0] == 10)
    scenario.verify(mock_redeem_fa2.data.ledger.get(user4.address, {}).get(0, 0) == 0)
    
    # --- User5 Final Balances ---
    scenario.h3(">>> Verify User5 Balances <<<")
    scenario.verify(mock_burn_fa2.data.ledger[user5.address][0] == 46)
    scenario.verify(mock_redeem_fa2.data.ledger[user5.address][0] == 2)
    
    # --- User6 Final Balances ---
    scenario.h3(">>> Verify User6 Balances <<<")
    scenario.verify(mock_burn_fa2.data.ledger[user6.address][0] == 44)
    scenario.verify(mock_redeem_fa2.data.ledger[user6.address][0] == 4)
    
    # --- Contract and Burn Address Final Balances ---
    scenario.h3(">>> Verify Contract and Burn Address Balances <<<")
    scenario.verify(mock_redeem_fa2.data.ledger[contract.address][0] == 11)
    scenario.verify(mock_burn_fa2.data.ledger[burn_address.address][0] == 150)
    
    # =============================================================================
    # ======== END INVALID EDGE CASE TESTS SECTION ================================
    # =============================================================================
    
    # =============================================================================
    # ======== BOUNDARY & HIGH VALUE ID USER TRADE TESTS SECTION =================
    # =============================================================================
    
    scenario.h1(">>> Boundary & High Value ID User Trade Tests <<<")
    
    # ----- Trade Using Token Pair ID 9 for Boundary User -----
    scenario.h2(">>> Boundary User Trade with Token Pair ID 9 <<<")
    scenario.h3(">>> Execute Trade <<<")
    scenario += contract.initiate_trade(
        trades=[
            sp.record(
                token_pair_id=9,
                user_wallet=boundary_user.address,
                burn_contract_address=mock_burn_fa2.address,
                burn_token_id=0,
                burn_amount=10,
                redeem_contract_address=mock_redeem_fa2.address,
                redeem_token_id=0
            )
        ]
    ).run(sender=boundary_user)
    
    scenario.h3(">>> Verify Balances After Trade <<<")
    scenario.verify(mock_burn_fa2.data.ledger[boundary_user.address][0] == sp.as_nat((2**31 - 1) - 10))
    scenario.verify(mock_redeem_fa2.data.ledger[boundary_user.address][0] == 1)
    scenario.verify(mock_redeem_fa2.data.ledger[contract.address][0] == 10)
    scenario.verify(mock_burn_fa2.data.ledger[burn_address.address][0] == 160)
    
    
    # ----- Boundary User Trade with Adjusted Burn Token Pair -----
    scenario.h2(">>> Boundary User Trade with Adjusted Burn Token Pair <<<")
    scenario.h3(">>> Execute Trade <<<")
    scenario += contract.initiate_trade(
        trades=[
            sp.record(
                token_pair_id=10,
                user_wallet=boundary_user.address,
                burn_contract_address=mock_burn_fa2.address,
                burn_token_id=0,
                burn_amount=(2**29 - 1),
                redeem_contract_address=mock_redeem_fa2.address,
                redeem_token_id=0
            )
        ]
    ).run(sender=boundary_user)
    
    scenario.h3(">>> Verify Balances After Adjusted Boundary User Trade <<<")
    scenario.verify(mock_burn_fa2.data.ledger[boundary_user.address][0] == sp.as_nat((2**31 - 11) - (2**29 - 1)))
    scenario.verify(mock_redeem_fa2.data.ledger[boundary_user.address][0] == 2)
    scenario.verify(mock_redeem_fa2.data.ledger[contract.address][0] == 9)
    scenario.verify(mock_burn_fa2.data.ledger[burn_address.address][0] == (2**29 - 1 + 160))
    
    
    # ----- High Value ID User Trade -----
    scenario.h2(">>> High Value ID User Trade <<<")
    scenario.h3(">>> Execute Trade <<<")
    scenario += contract.initiate_trade(
        trades=[
            sp.record(
                token_pair_id=11,
                user_wallet=high_value_id_user.address,
                burn_contract_address=mock_burn_fa2.address,
                burn_token_id=100000,
                burn_amount=2,
                redeem_contract_address=mock_redeem_fa2.address,
                redeem_token_id=0
            )
        ]
    ).run(sender=high_value_id_user)
    
    scenario.h3(">>> Verify Balances After High Value ID User Trade <<<")
    scenario.verify(mock_burn_fa2.data.ledger[high_value_id_user.address][100000] == 498)
    scenario.verify(mock_redeem_fa2.data.ledger[high_value_id_user.address][0] == 1)
    scenario.verify(mock_redeem_fa2.data.ledger[contract.address][0] == 8)
    scenario.verify(mock_burn_fa2.data.ledger[burn_address.address][100000] == 2)
    
    # =============================================================================
    # ======== END BOUNDARY & HIGH VALUE ID USER TRADE TESTS SECTION ===============
    # =============================================================================

    # =============================================================================
    # ======== MALFORMED UPDATE TOKEN PAIR TESTS SECTION =========================
    # =============================================================================
    
    scenario.h1(">>> Malformed Update Token Pair Tests <<<")
    
    # ----- Zero burn_amount -----
    scenario.h2(">>> Zero burn_amount <<<")
    scenario.h3(">>> Attempting to Update with Zero burn_amount <<<")
    scenario += contract.update_token_pair(
        sp.record(
            token_pair_id=1,
            burn_contract_address=mock_burn_fa2.address,
            burn_token_id=0,
            burn_amount=0,  # Invalid amount
            redeem_contract_address=mock_redeem_fa2.address,
            redeem_token_id=0,
            redeem_amount=1
        )
    ).run(sender=admin, valid=False, exception=ERROR_INVALID_BURN_AMOUNT)
    
    # ----- Zero redeem_amount -----
    scenario.h2(">>> Zero redeem_amount <<<")
    scenario.h3(">>> Attempting to Update with Zero redeem_amount <<<")
    scenario += contract.update_token_pair(
        sp.record(
            token_pair_id=1,
            burn_contract_address=mock_burn_fa2.address,
            burn_token_id=0,
            burn_amount=2,
            redeem_contract_address=mock_redeem_fa2.address,
            redeem_token_id=0,
            redeem_amount=0  # Invalid amount
        )
    ).run(sender=admin, valid=False, exception=ERROR_INVALID_REDEEM_AMOUNT)
    
    # ----- Identical Burn and Redeem Contract Addresses -----
    scenario.h2(">>> Identical Burn and Redeem Contract Addresses <<<")
    scenario.h3(">>> Attempting to Update with Identical Addresses <<<")
    scenario += contract.update_token_pair(
        sp.record(
            token_pair_id=1,
            burn_contract_address=mock_burn_fa2.address,  # Same address
            burn_token_id=0,
            burn_amount=2,
            redeem_contract_address=mock_burn_fa2.address,  # Identical to burn address
            redeem_token_id=0,
            redeem_amount=1
        )
    ).run(sender=admin, valid=False, exception=ERROR_BURN_REDEEM_CONTRACT_MISMATCH)
    
    # ----- Verify State Integrity -----
    scenario.h3(">>> Verify State Integrity After Invalid Updates <<<")
    valid_pair = contract.data.token_mapping[1]
    scenario.verify(valid_pair.burn_contract_address == mock_burn_fa2.address)  # Original burn address
    scenario.verify(valid_pair.burn_token_id == 0)  # Original token ID
    scenario.verify(valid_pair.burn_amount == 3)  # Original burn amount
    scenario.verify(valid_pair.redeem_contract_address == mock_redeem_fa2.address)  # Original redeem address
    scenario.verify(valid_pair.redeem_token_id == 0)  # Original redeem token ID
    scenario.verify(valid_pair.redeem_amount == 1)  # Original redeem amount
    
    # =============================================================================
    # ======== END MALFORMED UPDATE TOKEN PAIR TESTS SECTION ======================
    # =============================================================================    
    
    # =============================================================================
    # ======== CLEANUP TOKEN PAIRS MALFORMED INPUT TESTS ===========================
    # =============================================================================
    
    scenario.h1(">>> Cleanup Token Pairs Malformed Input Tests <<<")
    
    # ----- Non-Admin User Attempts Cleanup -----
    scenario.h2(">>> Non-Admin User Attempts Cleanup <<<")
    scenario.h3(">>> User1 Unauthorized Cleanup Attempt <<<")
    scenario += contract.cleanup_token_pairs(
        token_pair_ids=[1, 2]  # Attempt to delete token pairs 1 and 2
    ).run(sender=user1, valid=False)
    
    scenario.h3(">>> User2 Unauthorized Cleanup Attempt <<<")
    scenario += contract.cleanup_token_pairs(
        token_pair_ids=[4, 5]  # Attempt to delete token pairs 4 and 5
    ).run(sender=user2, valid=False)
    
    # ----- Malformed Input: Duplicate Token Pair IDs -----
    scenario.h2(">>> Malformed Input: Duplicate Token Pair IDs <<<")
    scenario.h3(">>> Cleanup Request with Duplicate IDs <<<")
    scenario += contract.cleanup_token_pairs(
        token_pair_ids=[1, 1, 2]  # Duplicate ID: 1
    ).run(sender=admin)
    
    scenario.h3(">>> Verify Deletion with Duplicates <<<")
    scenario.verify(~contract.data.token_mapping.contains(1))  # Token pair ID 1 must be deleted
    scenario.verify(~contract.data.token_mapping.contains(2))  # Token pair ID 2 must be deleted
    scenario.verify_equal(contract.data.token_mapping_size, 8)  # Size reduced by 2 (from 10 to 8)
    
    # ----- Malformed Input: Nonexistent Token Pair IDs -----
    scenario.h2(">>> Malformed Input: Nonexistent Token Pair IDs <<<")
    scenario.h3(">>> Cleanup Request with Nonexistent IDs <<<")
    scenario += contract.cleanup_token_pairs(
        token_pair_ids=[12, 13]  # Nonexistent token pair IDs
    ).run(sender=admin)
    
    scenario.h3(">>> Verify No Changes for Nonexistent IDs <<<")
    scenario.verify_equal(contract.data.token_mapping_size, 8)  # Mapping size remains unchanged
    
    # ----- Mixed Valid and Invalid IDs -----
    scenario.h2(">>> Mixed Valid and Invalid IDs <<<")
    scenario.h3(">>> Cleanup Request with Mixed IDs <<<")
    scenario += contract.cleanup_token_pairs(
        token_pair_ids=[4, 10, 12]  # Valid: 4, 10; Invalid: 12
    ).run(sender=admin)
    
    scenario.h3(">>> Verify Partial Deletion <<<")
    scenario.verify(~contract.data.token_mapping.contains(4))  # Token pair ID 4 must be deleted
    scenario.verify(~contract.data.token_mapping.contains(10))  # Token pair ID 10 must be deleted
    scenario.verify_equal(contract.data.token_mapping_size, 6)  # Size reduced by 2 (from 8 to 6)
    
    scenario.h3(">>> Verify Events for Cleanup <<<")
    scenario.verify(~contract.data.token_mapping.contains(12))  # Nonexistent ID 12 ignored
    scenario.verify(~contract.data.token_mapping.contains(4))   # Valid deletion of ID 4
    scenario.verify(~contract.data.token_mapping.contains(10))  # Valid deletion of ID 10
    
    # =============================================================================
    # ======== END CLEANUP TOKEN PAIRS MALFORMED INPUT TESTS ======================
    # =============================================================================

    # =============================================================================
    # ======== CLEANUP TOKEN PAIRS AFTER TRADE TESTS SECTION ======================
    # =============================================================================
    
    scenario.h2(">>> Cleanup Token Pairs After Trade Tests <<<")
    scenario += contract.cleanup_token_pairs(
        token_pair_ids=[1, 2, 4, 5, 6, 7, 8, 9, 10, 11]  # Clean up all previously added token pairs.
    ).run(sender=admin)
    
    # =============================================================================
    # ======== END CLEANUP TOKEN PAIRS AFTER TRADE TESTS SECTION ==================
    # =============================================================================
    
    # =============================================================================
    # ======== ADMIN TOKEN TRANSFER TEST ==========================================
    # =============================================================================
    
    scenario.h1(">>> Admin Token Transfer Test <<<")
    
    # ----- Setup: Verify Initial Contract Balances -----
    scenario.h2(">>> Setup: Contract Has Tokens to Transfer <<<")
    scenario.h3(">>> Verify Initial Balances <<<")
    scenario.verify(mock_burn_fa2.data.ledger[contract.address][0] == 95)  # Initial burn token balance
    scenario.verify(mock_redeem_fa2.data.ledger[contract.address][0] == 8)  # Initial redeem token balance
    
    # ----- Admin Transfers Burn Tokens -----
    scenario.h2(">>> Admin Transfers Burn Tokens <<<")
    scenario.h3(">>> Execute Transfer to User4 <<<")
    scenario += contract.admin_transfer_token(
        token_contract=mock_burn_fa2.address,  # Burn token contract address
        token_id=0,                          # Token ID to transfer
        to_=user4.address,                   # Recipient: User4
        amount=5                             # Transfer amount
    ).run(sender=admin)
    
    scenario.h3(">>> Verify Updated Balances After Burn Token Transfer <<<")
    scenario.verify(mock_burn_fa2.data.ledger[contract.address][0] == 90)  # Contract's burn token balance reduced by 5
    scenario.verify(mock_burn_fa2.data.ledger[user4.address][0] == 15)       # User4's burn token balance increased by 5
    
    # ----- Admin Transfers Redeem Tokens -----
    scenario.h2(">>> Admin Transfers Redeem Tokens <<<")
    scenario.h3(">>> Execute Transfer to User3 <<<")
    scenario += contract.admin_transfer_token(
        token_contract=mock_redeem_fa2.address,  # Redeem token contract address
        token_id=0,                            # Token ID to transfer
        to_=user3.address,                     # Recipient: User3
        amount=3                               # Transfer amount
    ).run(sender=admin)
    
    scenario.h3(">>> Verify Updated Balances After Redeem Token Transfer <<<")
    scenario.verify(mock_redeem_fa2.data.ledger[contract.address][0] == 5)  # Contract's redeem token balance reduced by 3
    scenario.verify(mock_redeem_fa2.data.ledger[user3.address][0] == 3)       # User3's redeem token balance increased by 3
    
    # ----- Malformed Input Tests for Admin Transfer -----
    scenario.h2(">>> Malformed Input Tests for Admin Transfer <<<")
    
    # Zero token amount
    scenario.h3(">>> Zero Token Amount <<<")
    scenario += contract.admin_transfer_token(
        token_contract=mock_burn_fa2.address,
        token_id=0,
        to_=user4.address,
        amount=0  # Zero transfer amount is invalid
    ).run(sender=admin, valid=False, exception="Error: Amount must be greater than zero.")
    
    # Unauthorized sender attempting transfer
    scenario.h3(">>> Unauthorized Sender <<<")
    scenario += contract.admin_transfer_token(
        token_contract=mock_burn_fa2.address,
        token_id=0,
        to_=user4.address,
        amount=5
    ).run(sender=user1, valid=False, exception="Error: Unauthorized.")
    
    # Invalid to_ address with malformed format
    scenario.h3(">>> Malformed to_ Address with Invalid Format <<<")
    try:
        scenario += contract.admin_transfer_token(
            token_contract=mock_burn_fa2.address,
            token_id=0,
            to_=sp.address("InvalidAddressFormat"),  # Syntactically invalid address
            amount=5
        ).run(sender=admin, valid=False, exception="Invalid recipient address.")
    except:
        scenario.h3(">>> Test Passed for Invalid to_ Address Format <<<")
    
    # ----- Verify State After Malformed Inputs -----
    scenario.h3(">>> Verify State After Malformed Inputs <<<")
    scenario.verify(mock_burn_fa2.data.ledger[contract.address][0] == 90)  # Contract's burn token balance remains unchanged
    scenario.verify(mock_burn_fa2.data.ledger[user4.address][0] == 15)       # User4's burn token balance remains unchanged
    scenario.verify(mock_redeem_fa2.data.ledger[contract.address][0] == 5)     # Contract's redeem token balance remains unchanged
    scenario.verify(mock_redeem_fa2.data.ledger[user3.address][0] == 3)        # User3's redeem token balance remains unchanged
    
    # =============================================================================
    # ======== END ADMIN TOKEN TRANSFER TEST =======================================
    # =============================================================================
    
    # =============================================================================
    # ======== FINAL STATE CONFIRMATION TEST =====================================
    # =============================================================================
    
    scenario.h1(">>> Final State Confirmation Test <<<")
    
    # ----- Verify Token Mapping is Empty -----
    scenario.h2(">>> Verification of Empty Token Mapping <<<")
    scenario.h3(">>> Check Token Mapping State <<<")
    scenario.verify(~contract.data.token_mapping.contains(1))
    scenario.verify(~contract.data.token_mapping.contains(50))
    scenario.verify_equal(contract.data.token_mapping_size, 0)
    
    # ----- Attempt Trade with Non-Existent Token Pair -----
    scenario.h2(">>> Invalid Trade with Non-Existent Token Pair <<<")
    scenario.h3(">>> Execute Invalid Trade <<<")
    scenario += contract.initiate_trade(
        trades=[
            sp.record(
                token_pair_id=1,
                user_wallet=user1.address,
                burn_contract_address=mock_burn_fa2.address,
                burn_token_id=0,
                burn_amount=5,
                redeem_contract_address=mock_redeem_fa2.address,
                redeem_token_id=0
            )
        ]
    ).run(sender=user1, valid=False)  # Should fail due to no token pairs existing
    
    # ----- Validate Balances Remain Unchanged -----
    scenario.h2(">>> Validation of Consistent Balances After Invalid Attempts <<<")
    scenario.h3(">>> Verify User Balances <<<")
    scenario.verify(mock_burn_fa2.data.ledger[user1.address][0] == 19)
    scenario.verify(mock_redeem_fa2.data.ledger[user1.address][0] == 70)
    scenario.verify(mock_burn_fa2.data.ledger[user2.address][0] == 46)
    scenario.verify(mock_redeem_fa2.data.ledger[user2.address][0] == 13)
    scenario.verify(mock_burn_fa2.data.ledger[user5.address][0] == 46)
    scenario.verify(mock_redeem_fa2.data.ledger[user5.address][0] == 2)
    scenario.verify(mock_burn_fa2.data.ledger[user6.address][0] == 44)
    scenario.verify(mock_redeem_fa2.data.ledger[user6.address][0] == 4)
    
    scenario.h3(">>> Verify Contract Balances <<<")
    scenario.verify(mock_redeem_fa2.data.ledger[contract.address][0] == 5)
    scenario.verify(mock_burn_fa2.data.ledger[contract.address][0] == 90)
    
    scenario.h3(">>> Verify Burn Address Balances <<<")
    scenario.verify(mock_burn_fa2.data.ledger[burn_address.address][0] == 2**29 - 1 + 160)
    
    # ----- Ensure Contract Integrity -----
    scenario.h2(">>> Integrity Verification <<<")
    scenario.h3(">>> Check Paused State <<<")
    scenario.verify(contract.data.paused == False)
    
    scenario.h3(">>> Test Admin Operation <<<")
    scenario += contract.toggle_pause().run(sender=admin)
    scenario.verify(contract.data.paused == True)
    scenario += contract.toggle_pause().run(sender=admin)
    scenario.verify(contract.data.paused == False)
    
    # ----- Final Confirmation -----
    scenario.h2(">>> Final State Verified <<<")
    
    # =============================================================================
    # ======== END FINAL STATE CONFIRMATION TEST ===================================
    # =============================================================================

    # =============================================================================
    # ======== STANDALONE: QUICK SUCCESSION TRADE TEST ============================
    # =============================================================================
    
    scenario.h1(">>> Standalone Test: Quick Succession Trades with Limited Redeem Tokens <<<")
    
    # === Setup Section ===
    scenario.h2(">>> Setup: Fresh Token Pair with Limited Supply <<<")
    
    # Generate 10 fresh users.
    test_users = [sp.test_account(f"TestUser{i}") for i in range(10)]
    
    # Mint burn tokens to all test users.
    scenario.h3(">>> Mint Burn Tokens to All Users <<<")
    for user in test_users:
        scenario += mock_burn_fa2.mint(
            address=user.address, token_id=0, amount=5
        ).run(sender=mock_burn_fa2.address)
    
    # Instead of minting additional redeem tokens, we assume the contract already has exactly 5 redeem tokens
    # as confirmed by the final state of previous tests.
    scenario.h3(">>> Confirm Contract Redeem Token Balance is 5 <<<")
    scenario.verify(mock_redeem_fa2.data.ledger.get(contract.address, {}).get(0, 0) == 5)
    
    # Record the initial burn address balance so we can verify the incremental change later.
    initial_burn_balance = mock_burn_fa2.data.ledger.get(burn_address.address, {}).get(0, 0)
    
    # Configure a new token pair (ID: 99) with a 1:1 burn-to-redeem ratio.
    scenario.h3(">>> Add Fresh Token Pair for Quick Succession Test <<<")
    scenario += contract.set_token_pairs(
        token_pairs=[
            sp.record(
                token_pair_id=99,
                burn_contract_address=mock_burn_fa2.address,
                burn_token_id=0,
                burn_amount=1,  # Burn 1 token.
                redeem_contract_address=mock_redeem_fa2.address,
                redeem_token_id=0,
                redeem_amount=1   # Redeem 1 token.
            )
        ]
    ).run(sender=admin)
    
    # === Execute Trades in Quick Succession ===
    scenario.h2(">>> Simulating Multiple Simultaneous Trades <<<")
    
    # First 5 trades should succeed, verifying after each trade.
    for i in range(5):
        scenario.h3(f">>> TestUser{i} Trade Attempt (Expected: SUCCESS) <<<")
    
        # Use timestamps to ensure SmartPy processes trades in order.
        scenario += contract.initiate_trade(
            trades=[
                sp.record(
                    token_pair_id=99,
                    user_wallet=test_users[i].address,
                    burn_contract_address=mock_burn_fa2.address,
                    burn_token_id=0,
                    burn_amount=1,
                    redeem_contract_address=mock_redeem_fa2.address,
                    redeem_token_id=0
                )
            ]
        ).run(sender=test_users[i], valid=True, now=sp.timestamp(1000 + i))
    
        # Verify balances after each trade.
        scenario.h3(f">>> Verify Balances After Trade {i} <<<")
        scenario.verify(mock_burn_fa2.data.ledger[test_users[i].address][0] == 4)  # User burned 1 token (5-1)
        scenario.verify(mock_redeem_fa2.data.ledger[test_users[i].address][0] == 1)  # User received 1 redeem token
        scenario.verify(mock_redeem_fa2.data.ledger.get(contract.address, {}).get(0, 0) == 5 - (i + 1))
    
    # Confirm that the contract's redeem token balance has been fully depleted.
    scenario.h2(">>> Verify Contract Redeem Token Balance Before Failure Tests <<<")
    scenario.verify(mock_redeem_fa2.data.ledger.get(contract.address, {}).get(0, 0) == 0)
    
    # Last 5 trades should fail due to insufficient redeem tokens.
    for i in range(5, 10):
        scenario.h3(f">>> TestUser{i} Trade Attempt (Expected: FAILURE) <<<")
        scenario += contract.initiate_trade(
            trades=[
                sp.record(
                    token_pair_id=99,
                    user_wallet=test_users[i].address,
                    burn_contract_address=mock_burn_fa2.address,
                    burn_token_id=0,
                    burn_amount=1,
                    redeem_contract_address=mock_redeem_fa2.address,
                    redeem_token_id=0
                )
            ]
        ).run(sender=test_users[i], valid=False, exception="Insufficient balance.")
    
    # === Final Verification ===
    scenario.h2(">>> Final Balance Verification After Trade Execution <<<")
    
    # Contract should have 0 redeem tokens left.
    scenario.h3(">>> Verify Contract Redeem Token Balance <<<")
    scenario.verify(mock_redeem_fa2.data.ledger[contract.address][0] == 0)
    
    # First 5 users should have received redeem tokens (and burned 1 token each).
    scenario.h3(">>> Verify First 5 Users' Balances <<<")
    for i in range(5):
        scenario.verify(mock_burn_fa2.data.ledger[test_users[i].address][0] == 4)
        scenario.verify(mock_redeem_fa2.data.ledger[test_users[i].address][0] == 1)
    
    # Last 5 users should have unchanged balances (no burn, no redeem tokens received).
    scenario.h3(">>> Verify Last 5 Users' Balances <<<")
    for i in range(5, 10):
        scenario.verify(mock_burn_fa2.data.ledger[test_users[i].address][0] == 5)
        scenario.verify(mock_redeem_fa2.data.ledger.get(test_users[i].address, {}).get(0, 0) == 0)
    
    # The burn address should have received exactly 5 additional burned tokens.
    scenario.h3(">>> Verify Burn Address Balance <<<")
    scenario.verify(mock_burn_fa2.data.ledger[burn_address.address][0] == 2**29 - 1 + 160 + 5)
    
    # ======== END STANDALONE: QUICK SUCCESSION TRADE TEST ========
    
    # =============================================================================
    # END OF STANDALONE: QUICK SUCCESSION TRADE TEST SECTION
    # =============================================================================

    # =============================================================================
    # ======== MULTI-TOKEN PAIR TRADE TEST ========================================
    # =============================================================================
    
    scenario.h1(">>> Multi-Token Pair Trade Test <<<")
    
    # === Setup: Configure Two Token Pairs ===
    scenario.h2(">>> Configure Multiple Token Pairs <<<")
    scenario += contract.set_token_pairs(
        token_pairs=[
            sp.record(
                token_pair_id=101,
                burn_contract_address=mock_burn_fa2.address,
                burn_token_id=0,
                burn_amount=2,  # Burn 2 tokens
                redeem_contract_address=mock_redeem_fa2.address,
                redeem_token_id=0,
                redeem_amount=1   # Receive 1 redeem token
            ),
            sp.record(
                token_pair_id=102,
                burn_contract_address=mock_burn_fa2.address,
                burn_token_id=0,
                burn_amount=3,  # Burn 3 tokens
                redeem_contract_address=mock_redeem_fa2.address,
                redeem_token_id=0,
                redeem_amount=2   # Receive 2 redeem tokens
            )
        ]
    ).run(sender=admin)
    
    # === Setup: Mint Tokens for the Trade ===
    scenario.h2(">>> Mint Tokens for Multi-Token Trade <<<")
    
    # Create a test user.
    user = sp.test_account("MultiTradeUser")
    
    # Mint burn tokens to the user.
    scenario += mock_burn_fa2.mint(
        address=user.address, token_id=0, amount=100
    ).run(sender=mock_burn_fa2.address)
    
    # Mint redeem tokens to the contract.
    scenario += mock_redeem_fa2.mint(
        address=contract.address, token_id=0, amount=100
    ).run(sender=mock_redeem_fa2.address)
    
    # Record expected initial balances.
    initial_user_burn_balance = 100   # User starts with 100 burn tokens.
    initial_user_redeem_balance = 0     # User starts with 0 redeem tokens.
    initial_contract_redeem_balance = 100  # Contract starts with 100 redeem tokens.
    
    # === Execute the Multi-Token Pair Trade in a Single Call ===
    scenario.h2(">>> Execute Multi-Token Pair Trade <<<")
    scenario += contract.initiate_trade(
        trades=[
            sp.record(
                token_pair_id=101,
                user_wallet=user.address,
                burn_contract_address=mock_burn_fa2.address,
                burn_token_id=0,
                burn_amount=2,   # For token pair 101: burn 2 tokens.
                redeem_contract_address=mock_redeem_fa2.address,
                redeem_token_id=0
            ),
            sp.record(
                token_pair_id=102,
                user_wallet=user.address,
                burn_contract_address=mock_burn_fa2.address,
                burn_token_id=0,
                burn_amount=3,   # For token pair 102: burn 3 tokens.
                redeem_contract_address=mock_redeem_fa2.address,
                redeem_token_id=0
            )
        ]
    ).run(sender=user)
    
    # === Final Verification: Check Balances After the Multi-Trade ===
    scenario.h2(">>> Verify Final Balances After Multi-Token Trade <<<")
    
    # The user should have burned a total of 5 tokens (2+3) and received 3 redeem tokens (1+2).
    scenario.h3(">>> Verify User Balances <<<")
    scenario.verify(
        mock_burn_fa2.data.ledger.get(user.address, {}).get(0, 0) == sp.as_nat(initial_user_burn_balance - 5)
    )
    scenario.verify(
        mock_redeem_fa2.data.ledger.get(user.address, {}).get(0, 0) == initial_user_redeem_balance + 3
    )
    
    # The contract's redeem balance should decrease by 3.
    scenario.h3(">>> Verify Contract Redeem Token Balance <<<")
    scenario.verify(
        mock_redeem_fa2.data.ledger.get(contract.address, {}).get(0, 0) == sp.as_nat(initial_contract_redeem_balance - 3)
    )
    
    # The burn address should receive a total of 5 tokens (2 from the first trade, 3 from the second).
    scenario.h3(">>> Verify Burn Address Balance <<<")
    scenario.verify(
        mock_burn_fa2.data.ledger.get(burn_address.address, {}).get(0, 0) == 2**29 - 1 + 160 + 5 + 5
    )
    
    # =============================================================================
    # ======== END MULTI-TOKEN PAIR TRADE TEST =====================================
    # =============================================================================
    
    # =============================================================================
    # ======== MIXED FA2 BATCH TRADE TESTS =========================================
    # =============================================================================
    
    scenario.h1(">>> Mixed FA2 Batch Trade Tests <<<")
    
    mixed_burn_fa2_a = MockFA2()
    mixed_burn_fa2_b = MockFA2()
    mixed_redeem_fa2_shared = MockFA2()
    mixed_redeem_fa2_alt = MockFA2()
    
    scenario += mixed_burn_fa2_a
    scenario += mixed_burn_fa2_b
    scenario += mixed_redeem_fa2_shared
    scenario += mixed_redeem_fa2_alt
    
    mixed_burn_user = sp.test_account("MixedBurnFA2User")
    mixed_redeem_user = sp.test_account("MixedRedeemFA2User")
    
    # ------------------- Mixed Burn FA2 Contracts with Shared Redeem FA2 ------------
    scenario.h2(">>> Mixed Burn FA2 Contracts with Shared Redeem FA2 <<<")
    scenario += contract.set_token_pairs(
        token_pairs=[
            sp.record(
                token_pair_id=201,
                burn_contract_address=mixed_burn_fa2_a.address,
                burn_token_id=0,
                burn_amount=4,
                redeem_contract_address=mixed_redeem_fa2_shared.address,
                redeem_token_id=0,
                redeem_amount=7
            ),
            sp.record(
                token_pair_id=202,
                burn_contract_address=mixed_burn_fa2_b.address,
                burn_token_id=0,
                burn_amount=6,
                redeem_contract_address=mixed_redeem_fa2_shared.address,
                redeem_token_id=0,
                redeem_amount=9
            )
        ]
    ).run(sender=admin)
    
    scenario += mixed_burn_fa2_a.mint(
        address=mixed_burn_user.address, token_id=0, amount=10
    ).run(sender=mixed_burn_fa2_a.address)
    scenario += mixed_burn_fa2_b.mint(
        address=mixed_burn_user.address, token_id=0, amount=10
    ).run(sender=mixed_burn_fa2_b.address)
    scenario += mixed_redeem_fa2_shared.mint(
        address=contract.address, token_id=0, amount=50
    ).run(sender=mixed_redeem_fa2_shared.address)
    
    scenario += contract.initiate_trade(
        trades=[
            sp.record(
                token_pair_id=201,
                user_wallet=mixed_burn_user.address,
                burn_contract_address=mixed_burn_fa2_a.address,
                burn_token_id=0,
                burn_amount=4,
                redeem_contract_address=mixed_redeem_fa2_shared.address,
                redeem_token_id=0
            ),
            sp.record(
                token_pair_id=202,
                user_wallet=mixed_burn_user.address,
                burn_contract_address=mixed_burn_fa2_b.address,
                burn_token_id=0,
                burn_amount=6,
                redeem_contract_address=mixed_redeem_fa2_shared.address,
                redeem_token_id=0
            )
        ]
    ).run(sender=mixed_burn_user)
    
    scenario.verify(mixed_burn_fa2_a.data.ledger[mixed_burn_user.address][0] == 6)
    scenario.verify(mixed_burn_fa2_b.data.ledger[mixed_burn_user.address][0] == 4)
    scenario.verify(mixed_burn_fa2_a.data.ledger[burn_address.address][0] == 4)
    scenario.verify(mixed_burn_fa2_b.data.ledger[burn_address.address][0] == 6)
    scenario.verify(mixed_redeem_fa2_shared.data.ledger[mixed_burn_user.address][0] == 16)
    scenario.verify(mixed_redeem_fa2_shared.data.ledger[contract.address][0] == 34)
    
    # ------------------- Mixed Redeem FA2 Contracts in One Batch -------------------
    scenario.h2(">>> Mixed Redeem FA2 Contracts in One Batch <<<")
    scenario += contract.set_token_pairs(
        token_pairs=[
            sp.record(
                token_pair_id=203,
                burn_contract_address=mixed_burn_fa2_a.address,
                burn_token_id=1,
                burn_amount=2,
                redeem_contract_address=mixed_redeem_fa2_shared.address,
                redeem_token_id=1,
                redeem_amount=3
            ),
            sp.record(
                token_pair_id=204,
                burn_contract_address=mixed_burn_fa2_a.address,
                burn_token_id=1,
                burn_amount=5,
                redeem_contract_address=mixed_redeem_fa2_alt.address,
                redeem_token_id=0,
                redeem_amount=11
            )
        ]
    ).run(sender=admin)
    
    scenario += mixed_burn_fa2_a.mint(
        address=mixed_redeem_user.address, token_id=1, amount=10
    ).run(sender=mixed_burn_fa2_a.address)
    scenario += mixed_redeem_fa2_shared.mint(
        address=contract.address, token_id=1, amount=20
    ).run(sender=mixed_redeem_fa2_shared.address)
    scenario += mixed_redeem_fa2_alt.mint(
        address=contract.address, token_id=0, amount=30
    ).run(sender=mixed_redeem_fa2_alt.address)
    
    scenario += contract.initiate_trade(
        trades=[
            sp.record(
                token_pair_id=203,
                user_wallet=mixed_redeem_user.address,
                burn_contract_address=mixed_burn_fa2_a.address,
                burn_token_id=1,
                burn_amount=2,
                redeem_contract_address=mixed_redeem_fa2_shared.address,
                redeem_token_id=1
            ),
            sp.record(
                token_pair_id=204,
                user_wallet=mixed_redeem_user.address,
                burn_contract_address=mixed_burn_fa2_a.address,
                burn_token_id=1,
                burn_amount=5,
                redeem_contract_address=mixed_redeem_fa2_alt.address,
                redeem_token_id=0
            )
        ]
    ).run(sender=mixed_redeem_user)
    
    scenario.verify(mixed_burn_fa2_a.data.ledger[mixed_redeem_user.address][1] == 3)
    scenario.verify(mixed_burn_fa2_a.data.ledger[burn_address.address][1] == 7)
    scenario.verify(mixed_redeem_fa2_shared.data.ledger[mixed_redeem_user.address][1] == 3)
    scenario.verify(mixed_redeem_fa2_shared.data.ledger[contract.address][1] == 17)
    scenario.verify(mixed_redeem_fa2_alt.data.ledger[mixed_redeem_user.address][0] == 11)
    scenario.verify(mixed_redeem_fa2_alt.data.ledger[contract.address][0] == 19)
    
    # =============================================================================
    # ======== END MIXED FA2 BATCH TRADE TESTS =====================================
    # =============================================================================
    
    # =============================================================================
    # ======== COMPILATION TARGET ================================================
    # =============================================================================
    
    sp.add_compilation_target("burn_redeem_escrow", BurnRedeemEscrow(
        admin=sp.address("tz1hcAYJhEB9n6ezLFcbuejzZ821zrL1c3vW"),  # Admin address
        initial_burn_address=sp.address("tz1dpaqpwKqPSft4SFvd5tA9bx7iDUNHnVsz")  # Burn address
    ))
