// =============================================================================
// INITIALIZATION & GLOBAL CONSTANTS
// =============================================================================

import cfg from './exchange-config.js';
import {
  buildApprovalOps as buildSharedApprovalOps,
  fetchTokenPairId as fetchSharedTokenPairId,
  pollForConfirmation as pollForSharedConfirmation,
  pollForNFTUpdate as pollForSharedNFTUpdate
} from '../../shared/public-trade-ops.js';
import { createPublicLogger } from '../../shared/public-logger.js';
import {
  getVerifiedPublicActiveAccount,
  getPublicWalletState,
  PUBLIC_WALLET_STATE_EVENT
} from '../../shared/beacon-setup.js';
const { network, rpc, tzkt, contracts, validation, isConfigured, unavailableMessage } = cfg;
// pick the right network’s contract set
const current = contracts[network] || {
  collections: {},
  escrow: ''
};
const networkConfigAvailable = isConfigured !== false;
const networkUnavailableMessage = unavailableMessage || 'This network is not configured yet.';

const DEBUG = false;
const logger = createPublicLogger({ enabled: DEBUG, scope: 'exchange' });

logger.log('Script running on network:', network);
if (!networkConfigAvailable) {
  console.error(
    `Exchange network config missing required values for ${network}: ${validation?.missing?.join(', ') || 'unknown'}`
  );
}

/**
 * RPC & TzKT endpoints based on network
 */
const RPC_ENDPOINT = rpc[network];
const TZKT_BASE    = tzkt[network];

/**
 * Base URL for block-explorer links
 */
const EXPLORER_BASE = network === 'mainnet'
  ? 'https://tzkt.io'
  : 'https://shadownet.tzkt.io';

/**
 * Contract addresses for NFT collections.
 * Maps tab identifiers to their respective NFT contract addresses.
 */
const tabContractAddresses = {
  'w-tabs-0-data-w-pane-0': current.collections.pane0,  // The 419 Script
  'w-tabs-0-data-w-pane-1': current.collections.pane1,  // Canaan
  '419': current.collections.pane0,
  'CANAAN': current.collections.pane1
};

logger.log("📌 Contract Addresses Loaded:", tabContractAddresses);

/**
 * Escrow and redeem token contract addresses
 */
const BURN_REDEEM_CONTRACT = current.escrow;
const REDEEM_TOKEN_CONTRACT = current.redeemTokenContract;

/**
 * Delay (in milliseconds) to ensure DOM elements are ready after load.
 */
const INIT_DELAY_MS = 500;

/**
 * Default edition count used when an NFT's edition count cannot be determined.
 */
const DEFAULT_EDITION_COUNT = 10;

/**
 * Exchange-specific state.
 * Tracks whether the burn cart has items.
 */
const exchangeState = {
  hasCartItems: false,
};
let exchangeInFlight = false;
const EXCHANGE_WALLET_PENDING_CLASS = 'exchange-wallet-tokens-pending';
const EXCHANGE_PANES = [
  {
    key: '419',
    tabName: '419',
    contractAddress: current.collections.pane0,
    noTokensSelector: '.no-tokens-in-walet-div---419'
  },
  {
    key: 'canaan',
    tabName: 'CANAAN',
    contractAddress: current.collections.pane1,
    noTokensSelector: '.no-tokens-in-walet-div---canaan'
  }
];
let exchangeWalletSyncReady = false;
let pendingPublicWalletState = null;
let synchronizedWalletAddress;
let walletRefreshGeneration = 0;
let exchangeWalletTokensPending = true;

// =============================================================================
// GLOBAL UTILITIES
// =============================================================================

/**
 * Retrieves the edition count from a dropdown's associated row.
 * Returns 0 if the edition count element is missing or invalid.
 *
 * @param {HTMLElement} dropdown - The dropdown element.
 * @returns {number} The edition count for the dropdown.
 */
window.getEditionCount = function (dropdown) {
  const row = dropdown.closest('.collection-item-01-div');
  const editionCountElem = row.querySelector('.collection-item-editions-text-number');

  if (editionCountElem) {
    const editionCount = parseInt(editionCountElem.textContent.trim(), 10);
    return isNaN(editionCount) ? 0 : editionCount;
  }
  return 0;
};

/**
 * Compatibility hook for legacy local callers after a confirmed connected refresh.
 * Shared wallet startup now enters through synchronizeExchangeWalletState().
 *
 * @param {Array} nfts - Array of NFTs fetched from the wallet.
 */
window.receiveNFTs = function (nfts) {
  logger.log('Processing NFTs through Exchange wallet-token lifecycle:', nfts);
  renderConnectedWalletTokenState(nfts);
};

// =============================================================================
// MODAL & UI RESET FUNCTIONS
// =============================================================================

/**
 * Displays the loading modal with optional messages.
 * Also hides extra modal text DIVs (3, 4, 5, and 6) initially,
 * and resets spinner and checkbox to their default states.
 *
 * @param {string} [message1='PROCESSING...'] - Primary modal message.
 * @param {string} [message2='[AWAITING WALLET CONFIRMATION]'] - Secondary modal message.
 */
function showModal(message1 = 'PROCESSING...', message2 = '[AWAITING WALLET CONFIRMATION]') {
  const modal = document.querySelector('.loading-modal-div');
  if (!modal) {
    console.error('Modal element not found!');
    return;
  }
  
  const text1 = modal.querySelector('.loading-modal-text');
  const text2 = modal.querySelector('.loading-modal-text-2');
  const text3 = modal.querySelector('.loading-modal-text-3');
  const text4 = modal.querySelector('.loading-modal-text-4');
  const text5 = modal.querySelector('.loading-modal-text-5');
  const text6 = modal.querySelector('.loading-modal-text-6'); // new element

  text1.innerHTML = message1;
  text2.innerHTML = message2;
  if (text3) text3.style.display = 'none';
  if (text4) text4.style.display = 'none';
  if (text5) text5.style.display = 'none';
  if (text6) text6.style.display = 'none';
  
  // Reset spinner and checkbox to default states.
  const spinner = modal.querySelector('.loading-spinner-01');
  const checkbox = modal.querySelector('.loading-checkbox-01');
  if (spinner) spinner.style.display = 'inline-block';   // default: spinner visible
  if (checkbox) {
    checkbox.style.display = 'none';    // default: checkbox hidden
    // Force reload of the checkbox GIF to restart its animation.
    const originalSrc = checkbox.src;
    checkbox.src = '';
    void checkbox.offsetWidth; // trigger reflow
    checkbox.src = originalSrc;
  }
  
  modal.style.display = 'flex';
}

/**
 * Hides the loading modal.
 */
function hideModal() {
  const modal = document.querySelector('.loading-modal-div');
  if (modal) {
    modal.style.display = 'none';
  } else {
    console.error('Modal element not found!');
  }
}

/**
 * Resets the entire UI, including dropdowns, rows, and the burn cart.
 * - Clears dropdown selections and repopulates options based on edition counts.
 * - Makes all rows visible and removes assigned data attributes.
 * - Clears the burn cart and resets the total display.
 */
function resetUI() {
  logger.log('Executing resetUI...');

  // Reset dropdown selections: repopulate options based on edition count.
  const dropdowns = document.querySelectorAll('.token-qty.w-select');
  dropdowns.forEach((dropdown) => {
    resetDropdown(dropdown);
    populateDropdown(dropdown, window.getEditionCount(dropdown));
    dropdown.value = ''; // Ensure no selection
  });

  // Reset all rows: ensure visibility and remove data attributes.
  const rows = document.querySelectorAll('.collection-item-01-div');
  rows.forEach((row) => {
    row.style.display = '';
    row.removeAttribute('data-contract-address');
    row.removeAttribute('data-token-id');
  });

  // Reset the burn cart: clear items and show the empty cart state.
  const burnCartContainer = document.querySelector('.burn-cart-display');
  if (burnCartContainer) {
    const emptyCartDiv = burnCartContainer.querySelector('.empty-cart-div');
    const burnCartStructureDiv = burnCartContainer.querySelector('.burn-cart-display-structure-div');
    if (emptyCartDiv && burnCartStructureDiv) {
      burnCartStructureDiv.innerHTML = '';
      emptyCartDiv.style.display = 'block';
      burnCartStructureDiv.style.display = 'none';
    }
  }

  // Reset the total display.
  resetTotalDisplay();
}

/**
 * Resets the total display element to 0.
 */
function resetTotalDisplay() {
  const totalDisplay = document.querySelector('.total-display');
  if (totalDisplay) {
    totalDisplay.textContent = '0';
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Normalizes a string by trimming whitespace and converting to lowercase.
 * Returns an empty string if the input is falsy.
 *
 * @param {string} str - The string to normalize.
 * @returns {string} The normalized string.
 */
function normalizeString(str) {
  return str ? str.trim().toLowerCase() : '';
}

function getPaneElements(config) {
  const pane = document.querySelector(`.w-tab-pane[data-w-tab="${config.tabName}"]`);
  const wrapper = pane?.querySelector('.exchange-ui-div') || null;

  return {
    ...config,
    pane,
    wrapper,
    spinner: wrapper?.querySelector('.loading-spinner-01-exchange-ui') || null,
    noTokens: wrapper?.querySelector(config.noTokensSelector) || null,
    rows: Array.from(wrapper?.querySelectorAll('.collection-item-01-div') || [])
  };
}

function getExchangePaneElements() {
  return EXCHANGE_PANES.map(getPaneElements);
}

function setBurnTokensHeaderText(text = '', visible = false) {
  const header = document.querySelector('.available-burn-tokens-exchange-text');
  if (!header) return;

  header.textContent = visible ? text : '';
  header.style.visibility = visible ? 'visible' : 'hidden';
  header.style.display = visible ? 'block' : 'none';
}

function setDropdownState(dropdown, { maxQty = 0, enabled = false } = {}) {
  if (!dropdown) return;

  resetDropdown(dropdown);
  populateDropdown(dropdown, maxQty);
  dropdown.value = '';
  dropdown.disabled = !enabled;
  dropdown.setAttribute('aria-disabled', enabled ? 'false' : 'true');
}

function isDropdownActionable(dropdown) {
  return Boolean(
    dropdown &&
    !dropdown.disabled &&
    !exchangeWalletTokensPending &&
    synchronizedWalletAddress
  );
}

function resetBurnCartDisplay() {
  const burnCartContainer = document.querySelector('.burn-cart-display');
  if (burnCartContainer) {
    const emptyCartDiv = burnCartContainer.querySelector('.empty-cart-div');
    const burnCartStructureDiv = burnCartContainer.querySelector('.burn-cart-display-structure-div');
    if (emptyCartDiv && burnCartStructureDiv) {
      burnCartStructureDiv.innerHTML = '';
      emptyCartDiv.style.display = 'block';
      burnCartStructureDiv.style.display = 'none';
    }
  }

  exchangeState.hasCartItems = false;
  resetTotalDisplay();
}

function setExchangeActionPendingState() {
  ['.exchange-button-connect.w-button', '.exchange-button-empty.w-button', '.exchange-button.w-button']
    .forEach((selector) => {
      const button = document.querySelector(selector);
      if (button) button.style.display = 'none';
    });
}

function commitPaneState(paneElements, {
  spinnerVisible = false,
  noTokensVisible = false,
  rowsVisible = false,
  terminal = false
} = {}) {
  const { wrapper, spinner, noTokens, rows } = paneElements;

  if (spinner) spinner.style.display = spinnerVisible ? 'block' : 'none';
  if (noTokens) noTokens.style.display = noTokensVisible && !spinnerVisible ? 'flex' : 'none';

  if (!rowsVisible) {
    rows.forEach((row) => {
      row.style.display = 'none';
    });
  }

  if (terminal && wrapper) {
    wrapper.classList.remove(EXCHANGE_WALLET_PENDING_CLASS);
  }
}

function renderWalletTokenLoadingState() {
  exchangeWalletTokensPending = true;
  setBurnTokensHeaderText('', false);
  getExchangePaneElements().forEach((paneElements) => {
    paneElements.wrapper?.classList.add(EXCHANGE_WALLET_PENDING_CLASS);
    paneElements.rows.forEach((row) => {
      setDropdownState(row.querySelector('.token-qty.w-select'));
      row.style.display = 'none';
    });
    commitPaneState(paneElements, { spinnerVisible: true });
  });
  resetBurnCartDisplay();
  setExchangeActionPendingState();
}

function renderDisconnectedWalletTokenState() {
  exchangeWalletTokensPending = false;
  resetUI();
  setContractAndTokenAttributes();
  setBurnTokensHeaderText('ELIGIBLE BURN TOKENS', true);

  getExchangePaneElements().forEach((paneElements) => {
    paneElements.rows.forEach((row) => {
      const dropdown = row.querySelector('.token-qty.w-select');
      setDropdownState(dropdown);
      row.style.display = '';
    });
    commitPaneState(paneElements, { rowsVisible: true, terminal: true });
  });

  updateCartButtons();
}

function renderConnectedWalletTokenFailureState() {
  exchangeWalletTokensPending = false;
  setContractAndTokenAttributes();
  setBurnTokensHeaderText('AVAILABLE BURN TOKENS', true);

  getExchangePaneElements().forEach((paneElements) => {
    paneElements.rows.forEach((row) => {
      setDropdownState(row.querySelector('.token-qty.w-select'));
      row.style.display = 'none';
    });
    commitPaneState(paneElements, { terminal: true });
  });

  resetBurnCartDisplay();
  updateCartButtons();
}

function renderConnectedWalletTokenState(nfts) {
  exchangeWalletTokensPending = false;
  setContractAndTokenAttributes();
  setBurnTokensHeaderText('AVAILABLE BURN TOKENS', true);

  const paneResults = processWalletNFTs(nfts);
  getExchangePaneElements().forEach((paneElements) => {
    const result = paneResults[paneElements.key] || { eligibleCount: 0 };
    commitPaneState(paneElements, {
      noTokensVisible: result.eligibleCount === 0,
      rowsVisible: result.eligibleCount > 0,
      terminal: true
    });
  });

  updateBurnCart();
}

async function refreshExchangeWallet(account, generation, nftsPromise) {
  try {
    const nfts = await (nftsPromise || fetchNFTs(account.address));

    if (
      generation !== walletRefreshGeneration ||
      synchronizedWalletAddress !== account.address
    ) {
      return;
    }

    renderConnectedWalletTokenState(nfts);
  } catch (error) {
    if (
      generation === walletRefreshGeneration &&
      synchronizedWalletAddress === account.address
    ) {
      console.error('Error refreshing Exchange wallet-token state:', error);
      renderConnectedWalletTokenFailureState();
    }
  }
}

function synchronizeExchangeWalletState(walletState) {
  if (!walletState || walletState.status === 'pending') {
    renderWalletTokenLoadingState();
    return;
  }

  const account = walletState.status === 'connected'
    ? walletState.account
    : null;
  const address = account?.address || null;

  if (address === synchronizedWalletAddress) return;

  synchronizedWalletAddress = address;
  const generation = ++walletRefreshGeneration;

  if (!account) {
    renderDisconnectedWalletTokenState();
    return;
  }

  renderWalletTokenLoadingState();
  void refreshExchangeWallet(account, generation, walletState.nftsPromise);
}

function receivePublicWalletState(walletState) {
  if (!exchangeWalletSyncReady) {
    pendingPublicWalletState = walletState;
    return;
  }

  synchronizeExchangeWalletState(walletState);
}

document.addEventListener(PUBLIC_WALLET_STATE_EVENT, event => {
  receivePublicWalletState(event.detail);
});

// =============================================================================
// CORE FUNCTIONALITY
// =============================================================================

/**
 * Assigns the appropriate contract address and token ID attributes to CMS rows.
 * Iterates through tab panes and their rows to set data attributes for matching wallet NFTs.
 */
function setContractAndTokenAttributes() {
  getExchangePaneElements().forEach((paneElements) => {
    if (!paneElements.contractAddress) return;

    paneElements.rows.forEach((row) => {
      const tokenIdElem = row.querySelector('.token-id-number');
      if (tokenIdElem) {
        const tokenId = normalizeString(tokenIdElem.textContent.trim());
        row.setAttribute('data-contract-address', paneElements.contractAddress);
        row.setAttribute('data-token-id', tokenId);
      }
    });
  });
}

/**
 * Extracts tokens from the burn cart based on dropdown selections.
 * Returns an array containing token ID, quantity, and contract address for each selected token.
 *
 * @returns {Array} Array of tokens in the burn cart.
 */
function getBurnCart() {
  const burnCart = [];
  const dropdowns = document.querySelectorAll('.token-qty.w-select');

  dropdowns.forEach((dropdown) => {
    if (!isDropdownActionable(dropdown)) return;

    const quantity = parseInt(dropdown.value) || 0;
    if (quantity > 0) {
      const row = dropdown.closest('.collection-item-01-div');
      const tokenId = row.getAttribute('data-token-id');
      const contractAddress = row.getAttribute('data-contract-address');
      const startingBalance = getDropdownMaxQuantity(dropdown);

      if (tokenId && contractAddress) {
        burnCart.push({ tokenId, quantity, contractAddress, startingBalance });
      }
    }
  });

  logger.log('Tokens in burn cart:', burnCart);
  return burnCart;
}

function getDropdownMaxQuantity(dropdown) {
  return Array.from(dropdown.options || []).reduce((max, option) => {
    const value = parseInt(option.value, 10);
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);
}

/**
 * Legacy helper retained for any local callers.
 *
 * Prepares a batch of update_operators operations for the tokens in the burn cart,
 * granting the escrow contract permission to burn.
 *
 * @param {string} userWalletAddress - The user's Tezos address.
 * @param {Array<{tokenId:string,quantity:number,contractAddress:string}>} burnCart
 * @returns {Promise<Array>} Array of batch operations ready for submission.
 */
async function prepareUpdateOperators(userWalletAddress, burnCart) {
  logger.log('Preparing update_operators via dynamic BURN_REDEEM_CONTRACT:', BURN_REDEEM_CONTRACT);
  return buildApprovalOps(userWalletAddress, burnCart);
}

// =============================================================================
// WALLET NFT PROCESSING
// =============================================================================

/**
 * Fetches NFTs for a specified wallet from the TzKT API.
 * Queries the TzKT API for FA2-standard tokens.
 *
 * @param {string} walletAddress - The wallet address to fetch NFTs for.
 * @returns {Promise<Array>} Promise resolving to an array of NFT objects.
 */
async function fetchNFTs(walletAddress) {
  if (!networkConfigAvailable) {
    const error = new Error(networkUnavailableMessage);
    console.error(networkUnavailableMessage);
    throw error;
  }

  logger.log("Fetching NFTs for wallet address:", walletAddress);

  // Use dynamic base URL
  const apiUrl = `${TZKT_BASE}/v1/tokens/balances?account=${walletAddress}&token.standard=fa2`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(
        `TzKT request failed ${response.status}: ${apiUrl}${body ? `\n${body}` : ''}`
      );
    }

    const nfts = await response.json();
    if (!Array.isArray(nfts)) {
      throw new TypeError(`TzKT NFT response was not an array: ${apiUrl}`);
    }

    logger.log(`NFTs fetched from ${network}:`, nfts);

    // Map to extract tokenId, contractAddress, and balance.
    return nfts.map((nft) => {
      const tokenId = nft?.token?.tokenId;
      const contractAddress = nft?.token?.contract?.address;
      if (tokenId == null || !contractAddress || nft?.balance == null) {
        throw new TypeError(`Malformed TzKT NFT balance payload: ${apiUrl}`);
      }

      return {
        tokenId,
        contractAddress,
        balance: nft.balance,
      };
    });
  } catch (error) {
    console.error("Error fetching NFTs:", error);
    throw error;
  }
}

/**
 * Processes the fetched NFTs and updates CMS rows in the UI.
 */
function processWalletNFTs(nfts) {
  logger.log("Processing wallet NFTs:", JSON.stringify(nfts, null, 2));

  return getExchangePaneElements().reduce((results, paneElements) => {
    let eligibleCount = 0;

    paneElements.rows.forEach(row => {
      const dropdown = row.querySelector('.token-qty.w-select');
      const contract = row.getAttribute('data-contract-address');
      const tokenId  = row.getAttribute('data-token-id');

      const match = nfts.find(nft =>
        normalizeString(nft.contractAddress) === normalizeString(contract) &&
        normalizeString(nft.tokenId)        === normalizeString(tokenId) &&
        Number(nft.balance) > 0
      );

      if (match) {
        eligibleCount += 1;
        setDropdownState(dropdown, {
          maxQty: Number(match.balance),
          enabled: true
        });
        row.style.display = '';
      } else {
        setDropdownState(dropdown);
        row.style.display = 'none';
      }
    });

    results[paneElements.key] = { eligibleCount };
    return results;
  }, {});
}

// =============================================================================
// DROPDOWN MANAGEMENT
// =============================================================================

/**
 * Updates a dropdown's options based on the provided maximum quantity.
 * Exposed globally for use across modules.
 *
 * @param {HTMLElement} dropdown - The dropdown element.
 * @param {number} maxQty - The maximum number of options to add.
 */
window.updateDropdownOptions = function(dropdown, maxQty) {
  resetDropdown(dropdown);
  populateDropdown(dropdown, maxQty);
};

/**
 * Resets a dropdown by clearing all options and adding a default "QTY" option.
 *
 * @param {HTMLElement} dropdown - The dropdown element to reset.
 */
function resetDropdown(dropdown) {
  dropdown.innerHTML = ''; // Clear existing options
  dropdown.appendChild(new Option('QTY', ''));
}

/**
 * Populates a dropdown with numeric options up to the specified maximum quantity.
 *
 * @param {HTMLElement} dropdown - The dropdown element to populate.
 * @param {number} maxQty - The maximum number of options to add.
 */
function populateDropdown(dropdown, maxQty) {
  for (let i = 1; i <= maxQty; i++) {
    dropdown.appendChild(new Option(i, i));
  }
}

// =============================================================================
// BURN CART MANAGEMENT
// =============================================================================

/**
 * Updates the burn cart UI based on current dropdown selections.
 * Iterates over all dropdowns to calculate redeem values, add cart rows,
 * and toggle the empty cart state.
 */
function updateBurnCart() {
  logger.log('Updating Burn Cart...');

  const burnCartContainer = document.querySelector('.burn-cart-display');
  if (!burnCartContainer) {
    console.error('Burn Cart Container not found!');
    return;
  }

  const emptyCartDiv = burnCartContainer.querySelector('.empty-cart-div');
  const burnCartStructureDiv = burnCartContainer.querySelector('.burn-cart-display-structure-div');
  if (!emptyCartDiv || !burnCartStructureDiv) {
    console.error('Burn Cart structure missing required elements!');
    return;
  }

  // Clear current cart contents.
  burnCartStructureDiv.innerHTML = '';

  const dropdowns = document.querySelectorAll('.token-qty.w-select');
  logger.log(`Found ${dropdowns.length} dropdowns.`);

  let hasItems = false; // Flag to track if the cart contains items.

  dropdowns.forEach((dropdown, index) => {
    if (!isDropdownActionable(dropdown)) return;

    const quantity = parseInt(dropdown.value) || 0;
    if (quantity === 0) return; // Skip if no quantity is selected.

    logger.log(`Processing dropdown #${index + 1}:`, dropdown);

    const row = dropdown.closest('.collection-item-01-div');
    if (!row) {
      console.warn(`Row not found for dropdown #${index + 1}`);
      return;
    }

    const titleElement = row.querySelector('.collection-item-title-text');
    const imageElement = row.querySelector('.collection-item-01-image');
    const editionElement = row.querySelector('.collection-item-editions-text-number');

    // Validate required elements.
    if (!titleElement || !imageElement || !editionElement) {
      console.warn('Missing required elements in row:', row);
      return;
    }

    // Extract item details.
    const tokenTitle = titleElement.textContent.trim();
    const imageUrl = imageElement.src;
    const editionCount = parseInt(editionElement.textContent.trim());
    const redeemValue = Math.ceil(100 / editionCount) * quantity;

    logger.log(`Adding to cart: Title = ${tokenTitle}, Quantity = ${quantity}, Redeem Value = ${redeemValue}`);

    hasItems = true;

    // Create a new cart row.
    const burnCartItemRow = document.createElement('div');
    burnCartItemRow.classList.add('burn-cart-display-structure');

    // The innerHTML payload is kept exactly as in the original code.
    burnCartItemRow.innerHTML = `
      <div class="header-image-div">
        <img src="${imageUrl}" alt="${tokenTitle}" class="burn-cart-image" style="width: 35px; height: auto;" />
      </div>
      <div class="header-title-div">
        <div class="burn-cart-display-title-text" style="font-family: 'Changa One', Impact, sans-serif; font-size: 20px; color: #f5c414;">
          ${tokenTitle}
        </div>
      </div>
      <div class="header-burn-div">
        <div class="burn-cart-burn-text-x" style="font-size: 16px;">x</div>
        <div class="burn-cart-display-burn-text" style="font-size: 16px;">${quantity}</div>
      </div>
      <div class="header-redeem-div-display">
        <div class="redeem-value-div" style="display: flex; align-items: center; gap: 5px;">
          <div class="burn-cart-burn-text-x" style="font-size: 16px;">x</div>
          <div class="burn-cart-display-redeem-text" style="font-size: 16px;">${redeemValue}</div>
          <img src="https://cdn.prod.website-files.com/656cf42faa2b1a7a1582d9d2/656fcb6bce08f2dc3bc115ef_EA_Coin_Spin_01_PNG_small.png" 
               style="width: 30px; height: auto;" class="collection-item-value-acid-coin-image" alt="Coin">
        </div>
      </div>
      <div class="burn-cart-remove-row-div">
        <button class="burn-cart-remove-row-button" data-index="${index}" style="font-size: 16px;">X</button>
      </div>
    `;

    // Append the new row to the burn cart.
    burnCartStructureDiv.appendChild(burnCartItemRow);

    // Attach click event to remove the row.
    const removeButton = burnCartItemRow.querySelector('.burn-cart-remove-row-button');
    removeButton.addEventListener('click', () => handleRemoveRow(index, dropdown));
  });

  // Toggle visibility based on whether items exist in the cart.
  if (hasItems) {
    emptyCartDiv.style.display = 'none';
    burnCartStructureDiv.style.display = 'flex';
    burnCartStructureDiv.style.flexDirection = 'column';
  } else {
    emptyCartDiv.style.display = 'block';
    burnCartStructureDiv.style.display = 'none';
  }

  // Update exchange state and cart buttons.
  exchangeState.hasCartItems = hasItems;
  updateCartButtons();

  logger.log('Burn Cart Update Complete!');
}

/**
 * Handles removal of a row from the burn cart.
 * Resets the associated dropdown and updates the total and cart UI.
 *
 * @param {number} index - Index of the dropdown.
 * @param {HTMLElement} dropdown - Dropdown element linked to the cart row.
 */
function handleRemoveRow(index, dropdown) {
  logger.log(`Removing row for dropdown #${index + 1}`);
  dropdown.value = ''; // Reset the dropdown value.
  updateTotal(); // Recalculate totals and update the cart.
}

/**
 * Updates the visibility of cart-related buttons based on wallet connection and cart state.
 */
function updateCartButtons() {
  if (exchangeWalletTokensPending) {
    setExchangeActionPendingState();
    return;
  }

  if (!networkConfigAvailable) {
    renderNetworkUnavailable();
    return;
  }

  // Select button elements.
  const connectButton = document.querySelector('.button-primary.w-button');
  const exchangeConnectButton = document.querySelector('.exchange-button-connect.w-button');
  const emptyCartButton = document.querySelector('.exchange-button-empty.w-button');
  const exchangeButton = document.querySelector('.exchange-button.w-button');

  getVerifiedPublicActiveAccount().then((account) => {
    if (exchangeWalletTokensPending) {
      setExchangeActionPendingState();
      return;
    }

    if (!account) {
      // Not connected: show connect and exchange connect, hide cart buttons.
      if (connectButton) connectButton.style.display = 'inline-block';
      if (exchangeConnectButton) exchangeConnectButton.style.display = 'inline-block';
      if (emptyCartButton) emptyCartButton.style.display = 'none';
      if (exchangeButton) exchangeButton.style.display = 'none';
    } else {
      // Connected: hide connect and exchange connect buttons.
      if (connectButton) connectButton.style.display = 'none';
      if (exchangeConnectButton) exchangeConnectButton.style.display = 'none';
      // If cart has items, show exchange button; otherwise, show empty cart button.
      if (exchangeState.hasCartItems) {
         if (exchangeButton) exchangeButton.style.display = 'block';
         if (emptyCartButton) emptyCartButton.style.display = 'none';
      } else {
         if (exchangeButton) exchangeButton.style.display = 'none';
         if (emptyCartButton) emptyCartButton.style.display = 'block';
      }
    }
  });
}

// =============================================================================
// TOTAL CALCULATION
// =============================================================================

/**
 * Calculates the total redeem value based on selected dropdown quantities
 * and updates the total display and burn cart.
 * Iterates over all visible dropdowns, computes each item's redeem value,
 * sums them, and updates the UI accordingly.
 */
function updateTotal() {
  logger.log('Running updateTotal: Checking dropdowns for quantities.');

  let total = 0; // Initialize total redeem value
  const dropdowns = document.querySelectorAll('.token-qty.w-select');

  // Calculate total redeem value from each visible dropdown.
  dropdowns.forEach((dropdown) => {
    if (!isDropdownActionable(dropdown)) return;

    const row = dropdown.closest('.collection-item-01-div');
    if (row && row.style.display === 'none') return; // Skip hidden rows

    const quantity = parseInt(dropdown.value) || 0;
    const redeemValue = Math.ceil(100 / window.getEditionCount(dropdown)); // Redeem value per item

    total += quantity * redeemValue;
  });

  logger.log(`Final total calculated: ${total}`);

  // Update the total display element.
  const totalDisplay = document.querySelector('.total-display');
  if (totalDisplay) {
    totalDisplay.textContent = total;
  }

  // Refresh the burn cart to reflect any changes.
  updateBurnCart();
}

// =============================================================================
// EVENT HANDLING & INITIALIZATION
// =============================================================================

/**
 * Handles dropdown change events to recalculate totals.
 *
 * @param {Event} event - The triggered change event.
 */
function handleDropdownChange(event) {
  if (
    event.target &&
    event.target.classList.contains('token-qty') &&
    event.target.classList.contains('w-select') &&
    isDropdownActionable(event.target)
  ) {
    logger.log('Dropdown changed, updating total...');
    updateTotal();
  }
}

// =============================================================================
// BLOCKCHAIN EXCHANGE & APPROVAL HANDLING
// =============================================================================

// -----------------------------------------------------
// FETCH TOKEN PAIR ID
// -----------------------------------------------------

async function fetchTokenPairId(burnContractAddress, burnTokenId) {
  return fetchSharedTokenPairId({
    tzktBase: TZKT_BASE,
    escrowAddress: BURN_REDEEM_CONTRACT,
    burnContractAddress,
    burnTokenId
  });
}

// -----------------------------------------------------
// BUILD OPERATOR APPROVAL OPERATIONS
// -----------------------------------------------------

/**
 * Builds update_operators ops for any tokens not yet approved on-chain.
 *
 * @param {string} userWalletAddress - The user’s Tezos address.
 * @param {Array<{tokenId:string,quantity:number,contractAddress:string}>} burnCart
 * @returns {Promise<Array>} List of Michelson transactions to send.
 */
async function buildApprovalOps(userWalletAddress, burnCart) {
  return buildSharedApprovalOps({
    tzktBase: TZKT_BASE,
    escrowAddress: BURN_REDEEM_CONTRACT,
    userWalletAddress,
    burnCart,
    operatorErrorPrefix: '❌ ',
    onApprovalCheck: ({ token, contractAddress, isApproved }) => {
      logger.log(
        `🔍 Checking token ${token.tokenId} on ${contractAddress}:`,
        isApproved ? "Approved ✅" : "Not approved ❌"
      );
    }
  });
}

// -----------------------------------------------------
// REFRESH CONNECTED STATE (WITHOUT RESETTING CMS ROWS)
// -----------------------------------------------------

function refreshConnectedState(nfts) {
  renderConnectedWalletTokenState(nfts);
}

// -----------------------------------------------------
// POLL FOR NFT UPDATES
// -----------------------------------------------------

async function pollForNFTUpdate(address, tradedTokens, timeout = 30000, interval = 3000) {
  return pollForSharedNFTUpdate({
    fetchNFTs,
    address,
    tradedTokens,
    timeout,
    interval,
    logPrefix: DEBUG ? '[exchange] ' : undefined,
    fetchBeforePolling: true,
    refetchOnTimeout: true
  });
}

// -----------------------------------------------------
// POLL FOR TRANSACTION CONFIRMATION
// -----------------------------------------------------

/**
 * Polls the TzKT API for operation confirmation until the transaction is confirmed or timeout.
 *
 * @param {string} opHash - The operation hash to poll for.
 * @param {number} [timeout=120000] - Maximum time in ms to poll.
 * @param {number} [interval=5000] - Polling interval in ms.
 * @returns {Promise<Object>} - The operation data once confirmed.
 */
async function pollForConfirmation(opHash, timeout = 120000, interval = 5000) {
  return pollForSharedConfirmation({
    tzktBase: TZKT_BASE,
    opHash,
    timeout,
    interval,
    logPrefix: DEBUG ? '[exchange] ' : undefined,
    expectedDestination: BURN_REDEEM_CONTRACT,
    expectedEntrypoint: 'initiate_trade'
  });
}

// -----------------------------------------------------
// HANDLE NFT EXCHANGE PROCESS (BATCHING APPROVAL & MULTIPLE TRADE CALLS)
// -----------------------------------------------------

async function handleExchange() {
  if (!networkConfigAvailable) {
    console.error(networkUnavailableMessage);
    showModal('ERROR', networkUnavailableMessage);
    setTimeout(hideModal, 3000);
    return;
  }

  if (exchangeInFlight) return;
  exchangeInFlight = true;

  try {
    logger.log(`🚀 Exchange button clicked! Starting process on ${network}...`);

    // Step 1: Show waiting for wallet confirmation modal.
    showModal('PROCESSING...', '[WAITING FOR WALLET CONFIRMATION...]');

    // Ensure wallet is connected.
    const activeAccount = await getVerifiedPublicActiveAccount();
    if (!activeAccount) {
      console.error('❌ No wallet connected.');
      showModal('ERROR', '[NO WALLET CONNECTED.]');
      setTimeout(hideModal, 3000);
      return;
    }
    const userWalletAddress = activeAccount.address;
    logger.log('✅ User wallet address:', userWalletAddress);

    // Gather burn-cart items.
    const burnCart = getBurnCart();
    if (burnCart.length === 0) {
      console.error('❌ Burn cart is empty. Cannot proceed.');
      showModal('ERROR', '[BURN CART IS EMPTY.]');
      setTimeout(hideModal, 3000);
      return;
    }
    logger.log('📜 Raw burnCart:', burnCart);

    // Build or skip operator-approval ops.
    const approvalOps = await buildApprovalOps(userWalletAddress, burnCart);
    if (approvalOps.length > 0) {
      logger.log('🚀 Approval operations to include:', approvalOps);
    } else {
      logger.log('✅ All tokens already approved.');
    }

    // Lookup token_pair_id for each burn item.
    for (let item of burnCart) {
      item.tokenPairId = await fetchTokenPairId(item.contractAddress, item.tokenId);
      if (item.tokenPairId === null) {
        showModal('ERROR', `[TOKEN MAPPING NOT FOUND FOR ${item.tokenId}]`);
        console.warn(`❌ Skipping trade for ${item.tokenId} (No token_pair_id found)`);
        return;
      }
    }
    logger.log('✅ Updated burnCart with token_pair_id:', burnCart);

    // Group by contract and build trade payloads.
    const tradesByContract = burnCart.reduce((acc, item) => {
      (acc[item.contractAddress] ||= []).push(item);
      return acc;
    }, {});

    const tradeOperations = Object.entries(tradesByContract).map(([contract, items]) => {
      const trades = [];
      items.forEach(item => {
        for (let i = 0; i < item.quantity; i++) {
          trades.push({
            prim: 'Pair',
            args: [
              // 1) burn count + burn contract + burn token
              {
                prim: 'Pair',
                args: [
                  { int: '1' },
                  {
                    prim: 'Pair',
                    args: [
                      { string: item.contractAddress },
                      { int: String(item.tokenId) }
                    ]
                  }
                ]
              },
              // 2) redeem contract + redeem token
              {
                prim: 'Pair',
                args: [
                  { string: REDEEM_TOKEN_CONTRACT },
                  { int: String(item.redeemTokenId || 0) }
                ]
              },
              // 3) token_pair_id
              { int: String(item.tokenPairId) },
              // 4) recipient address
              { string: userWalletAddress }
            ]
          });
        }
      });
      return {
        kind: 'transaction',
        destination: BURN_REDEEM_CONTRACT,
        amount: '0',
        parameters: {
          entrypoint: 'initiate_trade',
          value: trades
        }
      };
    });

    // Combine approvals + trades
    const batchedOps = approvalOps.length > 0
      ? [...approvalOps, ...tradeOperations]
      : tradeOperations;

    logger.log('🚀 Sending batched approval and trade operations:', JSON.stringify(batchedOps, null, 2));

    // Step 2: Prompt wallet to sign and send.
    const opResponse = await window.dAppClient.requestOperation({
      operationDetails: batchedOps
    });
    logger.log('✅ Operation submitted!', opResponse);

    // Update modal to processing state.
    showModal('PROCESSING...', '[APPROVING TRANSFERS + EXECUTING BURN... ️‍🔥]');

    // Grab the returned operation hash.
    const opHash = opResponse.transactionHash || opResponse.opHash || '';
    if (!opHash) throw new Error('OPERATION HASH NOT RETURNED.');

    // Step 3: Poll for on-chain confirmation.
    await pollForConfirmation(opHash);

    // Step 4: Show success in the modal.
    showModal('SUCCESS!', `[BURN COMPLETE. ✅]`);

    const modalElement = document.querySelector('.loading-modal-div');
    const text3 = modalElement.querySelector('.loading-modal-text-3');
    const text4 = modalElement.querySelector('.loading-modal-text-4');
    const text5 = modalElement.querySelector('.loading-modal-text-5');
    const text6 = modalElement.querySelector('.loading-modal-text-6');

    if (text3) {
      text3.style.display = 'block';
      text3.textContent = 'VIEW ON BLOCK EXPLORER...';
    }
    if (text4) {
      text4.style.display = 'block';
      const shortened = `${opHash.slice(0, 8)}…${opHash.slice(-6)}`;
      text4.innerHTML = `<a href="${EXPLORER_BASE}/${opHash}" target="_blank" style="color:#f5c414; text-decoration:underline;">${shortened}</a>`;
    }
    if (text5) {
      text5.style.display = 'block';
      text5.textContent = '[REFRESHING THE UI...]';
    }

    // Start a 30-second countdown in text6.
    let countdownInterval;
    if (text6) {
      text6.style.display = 'block';
      countdownInterval = startCountdown(30, text6);
    }

    // Reset just the exchange UI (cart + totals), not the entire page.
    resetExchangeUI();

    // Wait for the actual NFT balances to update on-chain.
    const tradedTokens = burnCart.map(item => ({
      contractAddress: item.contractAddress,
      tokenId: item.tokenId,
      quantity: item.quantity,
      startingBalance: item.startingBalance
    }));
    const refreshedNFTs = await pollForNFTUpdate(userWalletAddress, tradedTokens);
    if (synchronizedWalletAddress === userWalletAddress) {
      refreshConnectedState(refreshedNFTs);
    }

    // After balances reflect, swap spinner to checkbox & finalize.
    if (text6) {
      clearInterval(countdownInterval);
      text6.textContent = '[SUCCESS!]';
    }
    const spinner = document.querySelector('.loading-spinner-01');
    const checkbox = document.querySelector('.loading-checkbox-01');
    if (spinner) spinner.style.display = 'none';
    if (checkbox) checkbox.style.display = 'inline-block';

    // Close modal after 3s.
    setTimeout(hideModal, 3000);
  } catch (error) {
    console.error('❌ Error during exchange process:', error);
    showModal('ERROR', `${error.message || 'Unknown issue'}`);
    setTimeout(hideModal, 3000);
  } finally {
    exchangeInFlight = false;
  }

  /**
   * Shows a countdown in the given element.
   * @returns {number} interval ID
   */
  function startCountdown(seconds, element) {
    let remaining = seconds;
    element.textContent = `[~${remaining} SECONDS...]`;
    const intervalId = setInterval(() => {
      remaining--;
      element.textContent = remaining > 0
        ? `[~${remaining} SECONDS...]`
        : '[ALMOST DONE...]';
      if (remaining <= 0) clearInterval(intervalId);
    }, 1000);
    return intervalId;
  }
}

// -----------------------------------------------------
// RESET EXCHANGE UI (ONLY BURN CART, DROPDOWNS, & TOTAL)
// -----------------------------------------------------

function resetExchangeUI() {
  const dropdowns = document.querySelectorAll('.token-qty.w-select');
  dropdowns.forEach(dropdown => {
    dropdown.value = '';
    resetDropdown(dropdown);
    populateDropdown(dropdown, window.getEditionCount(dropdown));
  });

  const burnCartContainer = document.querySelector('.burn-cart-display');
  if (burnCartContainer) {
    const emptyCartDiv = burnCartContainer.querySelector('.empty-cart-div');
    const burnCartStructureDiv = burnCartContainer.querySelector('.burn-cart-display-structure-div');
    if (emptyCartDiv && burnCartStructureDiv) {
      burnCartStructureDiv.innerHTML = '';
      emptyCartDiv.style.display = 'block';
      burnCartStructureDiv.style.display = 'none';
    }
  }

  resetTotalDisplay();
}

function renderNetworkUnavailable() {
  const header = document.querySelector('.available-burn-tokens-exchange-text');
  if (header) header.textContent = networkUnavailableMessage;

  [
    '.button-primary.w-button',
    '.exchange-button-connect.w-button',
    '.exchange-button-empty.w-button',
    '.exchange-button.w-button'
  ].forEach((selector) => {
    const button = document.querySelector(selector);
    if (!button) return;

    button.style.display = selector === '.exchange-button-empty.w-button' ? 'block' : 'none';
    button.setAttribute('aria-disabled', 'true');
    if ('disabled' in button) button.disabled = true;
  });
}

// =============================================================================
// UI INITIALIZATION & EVENT BINDING
// =============================================================================

function bootExchangePage() {
  // Guard against double-binding if this module is ever evaluated twice
  if (window.__EA_EXCHANGE_BOOTED__) return;
  window.__EA_EXCHANGE_BOOTED__ = true;

  if (!networkConfigAvailable) {
    renderNetworkUnavailable();
    return;
  }

  logger.log('DOM fully loaded. Initializing UI...');
  renderWalletTokenLoadingState();

  setTimeout(() => {
    // Initialize dropdowns with token edition counts.
    const dropdowns = document.querySelectorAll('.token-qty.w-select');
    dropdowns.forEach((dropdown) => {
      const editionCount = window.getEditionCount(dropdown);
      window.updateDropdownOptions(dropdown, editionCount);
    });

    // Initialize CMS row attributes.
    setContractAndTokenAttributes();

    // Function to handle tab switching.
    function handleTabSwitch() {
      const activeTab = document.querySelector('.tab-link[aria-selected="true"]');
      if (!activeTab) return;
      const controlledPaneId = activeTab.getAttribute('aria-controls');
      const contractAddress = tabContractAddresses[controlledPaneId];
      if (contractAddress) {
        logger.log(`Active tab: ${controlledPaneId}, Contract address: ${contractAddress}`);
      }
    }

    // Bind clear-cart button event.
    const clearButton = document.querySelector('.clear-cart');
    if (clearButton) {
      clearButton.addEventListener('click', () => {
        const dropdowns = document.querySelectorAll('.token-qty.w-select');
        dropdowns.forEach((dropdown) => dropdown.value = '');
        updateTotal();
      });
    }

    // Bind tab switch events.
    document.querySelectorAll('.tab-link').forEach((tabLink) => {
      tabLink.addEventListener('click', handleTabSwitch);
    });
    // Trigger initial tab switch handler.
    handleTabSwitch();

    // Bind dropdown change event for total update.
    document.body.addEventListener('change', handleDropdownChange);

    // Bind exchange button event.
    const exchangeButton = document.querySelector('.exchange-button.w-button');
    if (exchangeButton) {
      exchangeButton.addEventListener('click', async () => {
        await handleExchange();
      });
    }

    // Bind Exchange Connect button event to trigger the primary wallet connect flow.
    const exchangeConnectButton = document.querySelector('.exchange-button-connect.w-button');
    if (exchangeConnectButton) {
      exchangeConnectButton.addEventListener('click', async () => {
        logger.log('Exchange Connect button clicked.');
        const primaryConnectButton = document.querySelector('.button-primary.w-button');
        if (primaryConnectButton) {
          primaryConnectButton.click();
        } else {
          console.error('Primary connect button not found.');
        }
      });
    }

    // Observe burn cart container for changes to update cart state.
    const burnCartStructureDiv = document.querySelector('.burn-cart-display-structure-div');
    if (burnCartStructureDiv) {
      const observer = new MutationObserver(() => {
        const hasItems = burnCartStructureDiv.children.length > 0;
        exchangeState.hasCartItems = hasItems;
        updateCartButtons();
      });
      observer.observe(burnCartStructureDiv, { childList: true });
    }

    // Resolve Exchange wallet-token state from the shared verified wallet lifecycle.
    renderWalletTokenLoadingState();
    exchangeWalletSyncReady = true;
    const initialWalletState = pendingPublicWalletState || getPublicWalletState();
    pendingPublicWalletState = null;
    receivePublicWalletState(initialWalletState);

  }, INIT_DELAY_MS);
}

// IMPORTANT: loader + dynamic import() can execute after DOMContentLoaded has already fired.
// This ensures we still boot in that case.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootExchangePage);
} else {
  bootExchangePage();
}
