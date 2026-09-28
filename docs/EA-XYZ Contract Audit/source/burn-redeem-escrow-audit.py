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
            sp.record(paused=self.data.paused),
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
                redeem_amount=sp.TNat,
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
                (trade.redeem_amount == token_pair.redeem_amount) &
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
                        token_id_amount=sp.pair(token_pair.redeem_token_id, trade.redeem_amount)
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
        Adds new token pairs to the mapping.
        Duplicate token-pair IDs are rejected.
        Use update_token_pair to modify an existing mapping.
    
        Parameters:
            params.token_pairs (List[TokenPair]): List of new token pairs to add.
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
# ======== COMPILATION TARGET ================================================
# =============================================================================

sp.add_compilation_target("burn_redeem_escrow", BurnRedeemEscrow(
    admin=sp.address("tz1hcAYJhEB9n6ezLFcbuejzZ821zrL1c3vW"),  # Admin address
    initial_burn_address=sp.address("tz1dpaqpwKqPSft4SFvd5tA9bx7iDUNHnVsz")  # Burn address
))
