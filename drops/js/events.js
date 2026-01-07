// =============================================================================
// DEBUG CONFIG & GLOBAL LOGGER OVERRIDE
// =============================================================================
const DEBUG = true; // ← flip to true when you want logs

// Keep a reference to the real console.log
const __log = console.log.bind(console);

// Override console.log globally
console.log = (...args) => {
  if (DEBUG) __log(...args);
};

// =============================================================================
// IMPORTS & CONFIGURATION
// =============================================================================

import eventsNetworkConfig from './events-config.js';
import dropParams from 'ea-drop-params';
import { computeDropInstant, validateDropDate } from '../../shared/drop-time.js';

/**
 * Convert a collection key to its CSS slug.
 * INTRODUCTIONS → "intros", everything else → lowercased.
 *
 * @param {string} collKey
 * @returns {string}
 */
function getCollectionSlug(collKey) {
  return collKey === 'INTRODUCTIONS'
    ? 'intros'
    : collKey.toLowerCase();
}

// ── Network & Contract Endpoints ─────────────────────────────────────────────
const { network, rpc, tzkt, contracts } = eventsNetworkConfig;
const current = contracts[network];

// RPC & TzKT endpoints for the active network:
const RPC_ENDPOINT = rpc[network];
const TZKT_BASE    = tzkt[network];

// Escrow & collection settings:
const {
  escrow: BURN_REDEEM_CONTRACT_ADDRESS,
  collections,
  tokenMapping
} = current;

// ── Drop Parameters ─────────────────────────────────────────────────────────
const {
  dropName,
  dropDate,
  dropTime,
  burnTokens,
  redeemToken
} = dropParams;

// Derive the redeem contract address for your redeem token:
const REDEEM_CONTRACT_ADDRESS = collections[redeemToken.collection];

// ── Debug Logging ───────────────────────────────────────────────────────────
console.groupCollapsed('🚀 Events.js config');
console.log(`Network: ${network}`);
console.log(`RPC endpoint: ${RPC_ENDPOINT}`);
console.log(`TzKT base URL: ${TZKT_BASE}`);
console.log(`Burn-Redeem escrow contract: ${BURN_REDEEM_CONTRACT_ADDRESS}`);
console.log('Collections defined:', collections);
console.log('Drop parameters:', { dropName, dropDate, dropTime });
console.log('Burn tokens config:', burnTokens);
console.log('Redeem token config:', redeemToken);
console.log('Token mapping defined:', tokenMapping);
console.groupEnd();

// =============================================================================
// GLOBAL UI STATE PLACEHOLDERS
// =============================================================================

/**
 * Single source of truth for all mutable UI state.
 */
const AppState = {
  activeAccount: window.activeAccount || null,           // currently connected wallet
  cartItems: [],                                         // will hold items added to the cart
  contractPaused: false,                                 // reflects on-chain pause status
  countdownTimerId: null,                                // will be set in countdown logic
  exchangeButtonInterval: window.exchangeButtonInterval || null, // hover/debounce timer
  exchangeDisabled: false,                               // drives Exchange button disabled state
  hoveringExchange: false,                               // tracks whether the mouse is over the exchange button
  selectedTokenId: null,                                 // ID of the token the user has selected
  walletConnected: false                                 // tracks whether a wallet is connected (default: false)
};

/** 
 * Holds the default “add token” markup so we can reset the cart panel 
 */
let defaultAddTokenMarkup = "";

// =============================================================================
// APPLICATION STATE
// =============================================================================

// Subscribers to run whenever AppState changes
const stateListeners = new Set();

/**
 * Merge in new state and notify listeners.
 * @param {Object} patch — partial update to AppState
 */
function updateAppState(patch) {
  Object.assign(AppState, patch);
  stateListeners.forEach(fn => fn(AppState));
}

/**
 * Listen for any state updates.
 * @param {Function} fn — called with the new AppState
 */
function subscribeToAppState(fn) {
  stateListeners.add(fn);
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

// =============================================================================
// HELPERS: STRING & GENERIC UTILITIES
// =============================================================================

/**
 * @returns {string} Trimmed, lowercased string.
 */
function normalizeString(input) {
  const str = input != null ? String(input) : '';
  return str.trim().toLowerCase();
}

/**
 * @returns {string} Padded string (e.g. "07").
 */
function pad(n) {
  return n < 10 ? '0' + n : String(n);
}

// =============================================================================
// HELPERS: UI TRUNCATION & PRELOADING
// =============================================================================

/** Truncates over-long drop-details text elements with “…” to fit their container. */
function applyEllipsis() {
  document.querySelectorAll(
    '.drop-details-burn-collection-text,' +
    '.drop-details-redeem-token-title-text,' +
    '.drop-details-drop-time-text'
  ).forEach(el => {
    const full = el.dataset.fullText || el.textContent.trim();
    el.dataset.fullText = full;
    let truncated = full;
    el.textContent = truncated;
    while (el.scrollWidth > el.clientWidth && truncated.length) {
      truncated = truncated.slice(0, -2);
      el.textContent = truncated + '…';
    }
  });
}

/** Preloads animated flame-icon `<img>`s so toggles are instant. */
function preloadFlameIcons() {
  const selectors = [
    '.flame-icon-animated',
    '.flame-icon-mobile-l-animated',
    '.flame-icon-mobile-animated'
  ];
  selectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(img => {
      const pre = new Image();
      pre.src = img.src;
      if (img.srcset) pre.srcset = img.srcset;
    });
  });
}

// =============================================================================
// HELPERS: DROP-SCHEDULE GATE
// =============================================================================

/**
 * Evaluates DROP_PARAMS.dropScheduled and switches the top-level panels.
 * Hides the page-load spinner in both branches.
 * 
 * @returns {boolean} true  → proceed with full initialization
 *                    false → show “No Drops Scheduled” and bail early
 */
function applyDropScheduledGate() {
  const spinner = document.querySelector('.drops-page-load-spinner-div');
  const dropsUI = document.querySelector('.drops-ui-div');
  const noDrops = document.querySelector('.no-drops-scheduled-div');

  // spinner always goes away once we decide
  if (spinner) spinner.style.display = 'none';

  // default to “scheduled” unless explicitly set false, so older params won’t break
  const scheduled = dropParams?.dropScheduled !== false;

  if (scheduled) {
    if (dropsUI) dropsUI.style.display = 'flex';
    if (noDrops) noDrops.style.display = 'none';
    return true;
  } else {
    if (dropsUI) dropsUI.style.display = 'none';
    if (noDrops) noDrops.style.display = 'flex';
    return false;
  }
}

// =============================================================================
// HELPERS: MODAL & UI RESET FUNCTIONS
// =============================================================================

/**
 * Displays the loading modal with messages.
 */
function showModal(message1 = 'PROCESSING...', message2 = '[AWAITING WALLET CONFIRMATION]') {
  const modal = document.querySelector('.loading-modal-div');
  if (!modal) return console.error('Modal element not found!');
  const [txt1, txt2, ...extras] = Array.from(modal.querySelectorAll(
    '.loading-modal-text, .loading-modal-text-2, .loading-modal-text-3, .loading-modal-text-4, .loading-modal-text-5, .loading-modal-text-6'
  ));
  txt1.innerHTML = message1;
  txt2.innerHTML = message2;
  extras.forEach(el => el.style.display = 'none');

  const spinner  = modal.querySelector('.loading-spinner-01');
  const check    = modal.querySelector('.loading-checkbox-01');
  if (spinner) spinner.style.display = 'inline-block';
  if (check) {
    check.style.display = 'none';
    // restart GIF
    const src = check.src;
    check.src = ''; void check.offsetWidth; check.src = src;
  }

  modal.style.display = 'flex';
}

/**
 * Hides the loading modal.
 */
function hideModal() {
  const modal = document.querySelector('.loading-modal-div');
  if (modal) modal.style.display = 'none';
  else console.error('Modal element not found!');
}

// =============================================================================
// HELPERS: CART PANEL
// =============================================================================

/**
 * Reads the necessary fields off a CMS-row to build a “burn token” data object.
 * @param {Element} cmsRow
 * @returns {Object} { id, title, collection, editions, imgSrc, imgSrcset }
 */
function getTokenData(cmsRow) {
  return {
    id: cmsRow.getAttribute('data-token-id') || '',
    title: cmsRow.querySelector('.collection-item-title-text')?.textContent.trim() || "[TOKEN TITLE NOT FOUND]",
    collection: cmsRow.querySelector('.collection-item-collection-text')?.textContent.trim() || '',
    editions: cmsRow.querySelector('.collection-item-editions-text-number')?.textContent.trim() || '',
    imgSrc: cmsRow.querySelector('.collection-item-image-div img')?.getAttribute('src') || '',
    imgSrcset: cmsRow.querySelector('.collection-item-image-div img')?.getAttribute('srcset') || ''
  };
}

/**
 * Renders a burn token’s details into the cart panel.
 * @param {Element} container
 * @param {Object} data
 */
function renderBurnTokenUI(container, data) {
  const { title, collection, editions, imgSrc, imgSrcset } = data;
  const truncated = title.length > 12 ? title.slice(0, 12) + "..." : title;

  const titleEl  = container.querySelector('.collection-item-events-title-text');
  const collEl   = container.querySelector('.collection-item-events-collection-text');
  const editEl   = container.querySelector('.event-cart-editions-div .collection-item-events-editions-text');
  const addDiv   = container.querySelector('.event-cart-add-token-text-div');

  clearBurnTokenUI(container);

  if (titleEl) titleEl.textContent = truncated;
  if (collEl)  collEl.textContent  = collection.toUpperCase();
  if (editEl)  editEl.textContent  = editions;

  if (addDiv) {
    addDiv.style.display = 'flex';
    addDiv.innerHTML     = '';
    if (imgSrc) {
      const pre = new Image();
      pre.src               = imgSrc;
      if (imgSrcset) pre.srcset = imgSrcset;
      pre.width             = 150;
      pre.height            = 188;
      pre.alt               = truncated;
      pre.className         = 'token-image';
      pre.style.visibility  = 'hidden';
      pre.onload = () => {
        pre.style.visibility = 'visible';
      };
      addDiv.appendChild(pre);
    }
  }
}

/**
 * Returns the one selected burn‑token’s contractAddress, tokenId,
 * and the user’s current on‑screen balance (oldBalance).
 */
function getSelectedEventTokenWithBalance() {
  // 1) find the checked checkbox
  const checked = document.querySelector('.w-checkbox-input.events_checkbox:checked');
  if (!checked) throw new Error("No token selected");

  // 2) climb to the CMS row
  const row = checked.closest('[data-token-id]');
  if (!row) throw new Error("Couldn’t find token row");

  // 3) grab contractAddress & tokenId from the row dataset
  const contractAddress = row.dataset.contractAddress;
  const tokenId         = row.dataset.tokenId;

  // 4) read the owned count text & parse to number
  const ownedEl    = row.querySelector('.collection-item-owned-text');
  const oldBalance = ownedEl 
    ? parseInt(ownedEl.textContent.trim(), 10) || 0 
    : 0;

  return { contractAddress, tokenId, oldBalance };
}

// =============================================================================
// HELPERS: REDEEM PANEL
// =============================================================================

/** Centers & shows the spinner inside a redeem-image wrapper. */
function showRedeemSpinner(imgWrap, spinner) {
  if (!imgWrap || !spinner) return;
  imgWrap.style.position = 'relative';
  Object.assign(spinner.style, {
    display:   'block',
    position:  'absolute',
    top:       '50%',
    left:      '50%',
    transform: 'translate(-50%, -50%)',
    width:     '70px',
    height:    '70px'
  });
}


// =============================================================================
// HELPERS: CMS ROWS
// =============================================================================

/** @returns {Record<string,Element[]>} Map collKey → all its `.w-dyn-item` elements. */
function findCMSRows(collectionKeys) {
  const result = {};
  collectionKeys.forEach(collKey => {
    const slug     = getCollectionSlug(collKey);
    const selector = `.${slug}-collection .w-dyn-item`;
    result[collKey] = Array.from(document.querySelectorAll(selector));
  });
  return result;
}

/** Stamps each row with its `dataset.tokenId` & `dataset.contractAddress`. */
function stampRowAttributes(row, contractAddress) {
  const idEl = row.querySelector('.token-id-number') || row.querySelector('.token-id-container');
  if (!idEl) return;
  row.dataset.tokenId = idEl.textContent.trim();
  row.dataset.contractAddress = contractAddress;
}

// =============================================================================
// HELPERS: BLOCKCHAIN CALLS
// =============================================================================

/**
 * Looks up the on‑chain token_pair_id for a given burn contract & token.
 *
 * @param {string} burnContractAddress - FA2 contract address.
 * @param {number|string} burnTokenId   - Token ID to look up.
 * @returns {Promise<number>}           - The token_pair_id.
 */
async function fetchTokenPairId(burnContractAddress, burnTokenId) {
  try {
    console.log(`🔍 Fetching token_pair_id for ${burnContractAddress}, token ${burnTokenId}`);

    // Only fetch ACTIVE entries from token_mapping
    const url =
      `${TZKT_BASE}/v1/contracts/${BURN_REDEEM_CONTRACT_ADDRESS}` +
      `/bigmaps/token_mapping/keys?active=true&limit=10000`;

    const response = await fetch(url);
    const raw = await response.json();
    console.log("📜 Retrieved raw token_mapping data:", raw);

    // Mirror admin logic: drop inactive / null-valued rows
    const tokenMappings = (raw || []).filter(
      (entry) => entry && entry.active !== false && entry.value != null
    );

    console.log("📜 Filtered active token_mapping data:", tokenMappings);

    const matching = tokenMappings.find(
      (entry) =>
        entry.value.burn_contract_address === burnContractAddress &&
        parseInt(entry.value.burn_token_id, 10) === parseInt(burnTokenId, 10)
    );

    if (matching) {
      console.log(`✅ Found token_pair_id: ${matching.key}`);
      return Number(matching.key);
    }

    console.warn(`❌ No token_pair_id for ${burnContractAddress} / ${burnTokenId}`);
    return null;
  } catch (err) {
    console.error("❌ Error fetching token_pair_id:", err);
    return null;
  }
}

// =============================================================================
// HELPERS: BALANCE PROCESSING
// =============================================================================

/**
 * @returns {Record<string,number>} Map "contract:tokenId" → total balance.
 */
function computeBalances(nfts) {
  return nfts.reduce((acc, nft) => {
    const key = `${nft.contractAddress}:${nft.tokenId}`;
    const count = Number(nft.balance ?? 0);
    acc[key] = (acc[key] || 0) + count;
    return acc;
  }, {});
}

// =============================================================================
// HELPERS: FA2 OPERATOR APPROVALS
// =============================================================================

/**
 * Queries TzKT to see which tokens are already approved
 * and returns only the missing update_operators calls.
 */
async function buildApprovalOps(userWalletAddress, burnCart) {
  const groups = burnCart.reduce((acc, item) => {
    (acc[item.contractAddress] ||= []).push(item);
    return acc;
  }, {});
  const approvalOps = [];

  for (const contractAddress of Object.keys(groups)) {
    try {
      const url = `${TZKT_BASE}/v1/contracts/${contractAddress}/bigmaps/operators/keys?active=true`;
      const response = await fetch(url);
      const operators = await response.json();

      groups[contractAddress].forEach(token => {
        const isApproved = operators.some(op =>
          op.key.owner    === userWalletAddress &&
          op.key.operator === BURN_REDEEM_CONTRACT_ADDRESS &&
          parseInt(op.key.token_id, 10) === parseInt(token.tokenId, 10)
        );

        if (!isApproved) {
          approvalOps.push({
            kind:        'transaction',
            destination: contractAddress,
            amount:      '0',
            parameters: {
              entrypoint: 'update_operators',
              value: [
                {
                  prim: 'Left',
                  args: [
                    {
                      prim: 'Pair',
                      args: [
                        { string: userWalletAddress },
                        {
                          prim: 'Pair',
                          args: [
                            { string: BURN_REDEEM_CONTRACT_ADDRESS },
                            { int: token.tokenId.toString() }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          });
        }
      });
    } catch (error) {
      console.error(`Error checking operators for ${contractAddress}:`, error);
      // Optimistically queue approvals if the check fails
      groups[contractAddress].forEach(token => {
        approvalOps.push({
          kind:        'transaction',
          destination: contractAddress,
          amount:      '0',
          parameters: {
            entrypoint: 'update_operators',
            value: [
              {
                prim: 'Left',
                args: [
                  {
                    prim: 'Pair',
                    args: [
                      { string: userWalletAddress },
                      {
                        prim: 'Pair',
                        args: [
                          { string: BURN_REDEEM_CONTRACT_ADDRESS },
                          { int: token.tokenId.toString() }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        });
      });
    }
  }

  return approvalOps;
}

// =============================================================================
// HELPERS: ON‑CHAIN POLLING
// =============================================================================

/**
 * Polls the TzKT API for operation confirmation until the transaction is applied or timeout.
 */
async function pollForConfirmation(opHash, timeout = 120000, interval = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const res = await fetch(`${TZKT_BASE}/v1/operations/${opHash}`);
    const ops = await res.json();
    const confirmed = Array.isArray(ops)
      ? ops.some(o => o.status === 'applied' || o.metadata?.operation_result?.status === 'applied')
      : ops.status === 'applied';
    if (confirmed) return ops;
    await new Promise(r => setTimeout(r, interval));
  }
  throw new Error('Transaction confirmation timed out.');
}

/**
 * Polls until each traded token’s on‑chain balance has dropped to zero (or timeout).
 */
async function pollForNFTUpdate(address, tradedTokenIds, timeout = 30000, interval = 3000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const nfts = await fetchNFTs(address);
    const allGone = tradedTokenIds.every(id => {
      const match = nfts.find(n => String(n.tokenId) === String(id));
      return !match || Number(match.balance) === 0;
    });
    if (allGone) return nfts;
    await new Promise(r => setTimeout(r, interval));
  }
  return await fetchNFTs(address);
}

// =============================================================================
// HELPERS: UI RESET
// =============================================================================

/**
 * Clears any selected token checkboxes and resets the burn-token panel.
 */
function resetEventsUI() {
  // Deselect all selected token checkboxes
  document.querySelectorAll('.w-checkbox-input.events_checkbox:checked')
    .forEach(cb => cb.checked = false);

  // Reset the burn-token panel
  updateEventCartBurnToken();
}

// =============================================================================
// HELPERS: POST-TRADE REFRESH
// =============================================================================

/**
 * Refreshes the UI after a trade: re‑stamps rows, updates token grid, 
 * removes sold‑out rows, and resets the burn‑token panel.
 *
 * @param {Array} nfts - Updated list of NFTs.
 */
function refreshConnectedState(nfts) {
  // 1) Re‑map CMS rows with correct token IDs & contracts
  setEventContractAndTokenAttributes();

  // 2) Update the “Owned” counts on existing CMS rows
  updateOwnedTokenCounts(nfts);

  // 3) Remove any rows for tokens the user no longer owns
  const balances = computeBalances(nfts);
  document.querySelectorAll('.w-dyn-item[data-token-id]').forEach(wrapper => {
    const { tokenId, contractAddress } = wrapper.dataset;
    const key = `${contractAddress}:${tokenId}`;
    if (!balances[key]) {
      wrapper.remove();
    }
  });

  // 4) Reset the burn‑token panel
  updateEventCartBurnToken();
}

// =============================================================================
// HELPERS: REDEEM‑SUPPLY POLLING
// =============================================================================

let redeemSupplyIntervalId = null;

/**
 * Queries TzKT (via your fetchNFTs util) for every token held by the burn+redeem contract,
 * then picks out the one token ID you want to monitor.
 *
 * @returns {Promise<number>} The on‑chain balance of the redeem token.
 */
async function fetchRedeemSupply() {
  const holdings = await fetchNFTs(BURN_REDEEM_CONTRACT_ADDRESS);
  const redeemAddr = collections[redeemToken.collection];
  const match = holdings.find(n =>
    n.contractAddress === redeemAddr &&
    String(n.tokenId) === String(redeemToken.tokenId)
  );
  return match ? Number(match.balance) : 0;
}

/**
 * Fetches the contract’s redeem‑token supply, writes it into the UI,
 * and pushes it into AppState for downstream consumers.
 */
async function updateRedeemSupplyDisplay() {
  try {
    const supply = await fetchRedeemSupply();
    const el = document.querySelector('.supply-text-number');
    if (el) {
      el.textContent = 'x' + String(supply).padStart(2, '0');
    }

    updateAppState({ redeemSupply: supply });
  } catch (err) {
    console.error('Error polling redeem supply:', err);
  }
}

/**
 * Starts a repeated poll (runs immediately + every intervalMs),
 * but only if not already running.
 *
 * @param {number} [intervalMs=10000] How often, in milliseconds, to refresh.
 */
function startRedeemSupplyPolling(intervalMs = 10000) {
  if (redeemSupplyIntervalId != null) return;
  // initial fetch
  updateRedeemSupplyDisplay();
  // then every X seconds
  redeemSupplyIntervalId = setInterval(updateRedeemSupplyDisplay, intervalMs);
}

/**
 * Stops the redeem‑supply poll if it's running.
 */
function stopRedeemSupplyPolling() {
  if (redeemSupplyIntervalId != null) {
    clearInterval(redeemSupplyIntervalId);
    redeemSupplyIntervalId = null;
  }
}

// Automatically start/stop polling based on live phase AND remaining supply
subscribeToAppState(({ countdownPhase, redeemSupply }) => {
  if (countdownPhase === 'live' && redeemSupply > 0) {
    startRedeemSupplyPolling();
  } else {
    stopRedeemSupplyPolling();
  }
});

// =============================================================================
// HANDLER: EVENTS EXCHANGE FLOW
// =============================================================================

/**
 * Handles the single‐token burn/redeem flow on the Events page.
 */
async function handleEventExchange() {
  // Base URL for block-explorer links
  const EXPLORER_BASE = network === 'mainnet'
    ? 'https://tzkt.io'
    : 'https://ghostnet.tzkt.io';
  try {
    console.log(`🚀 Exchange button clicked! Starting process on ${network}...`);

    // Step 1: Show waiting for wallet confirmation modal
    showModal('PROCESSING...', '[WAITING FOR WALLET CONFIRMATION...]');

    // Ensure wallet is connected
    const activeAccount = await window.dAppClient.getActiveAccount();
    if (!activeAccount) {
      console.error('❌ No wallet connected.');
      showModal('ERROR', '[NO WALLET CONNECTED.]');
      setTimeout(hideModal, 3000);
      return;
    }
    const myAddr = activeAccount.address;
    console.log('✅ User wallet address:', myAddr);

    // Gather burn-cart items
    const { contractAddress, tokenId, oldBalance } = getSelectedEventTokenWithBalance();
    const burnCart = [{ contractAddress, tokenId, quantity: 1 }];
    console.log('📜 Burn cart:', burnCart);

    // Build or skip operator-approval ops
    const approvalOps = await buildApprovalOps(myAddr, burnCart);
    if (approvalOps.length > 0) {
      console.log('🚀 Approval operations to include:', approvalOps);
    } else {
      console.log('✅ All tokens already approved.');
    }

    // Lookup token_pair_id for each burn item
    for (let item of burnCart) {
      item.tokenPairId = await fetchTokenPairId(item.contractAddress, item.tokenId);
      if (item.tokenPairId == null) {
        console.warn(`❌ Token mapping not found for ${item.tokenId}`);
        showModal('ERROR', `[TOKEN MAPPING NOT FOUND FOR ${item.tokenId}]`);
        setTimeout(hideModal, 3000);
        return;
      }
    }
    console.log('✅ Updated burnCart with token_pair_id:', burnCart);

    // Group by contract and build trade payloads
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
                  { string: REDEEM_CONTRACT_ADDRESS },
                  { int: String(redeemToken.tokenId) }
                ]
              },
              // 3) token_pair_id
              { int: String(item.tokenPairId) },
              // 4) recipient address
              { string: myAddr }
            ]
          });
        }
      });
      return {
        kind: 'transaction',
        destination: BURN_REDEEM_CONTRACT_ADDRESS,
        amount: '0',
        parameters: {
          entrypoint: 'initiate_trade',
          value: trades
        }
      };
    });

    // Combine approvals + trades and send
    const batchedOps = approvalOps.length > 0
      ? [...approvalOps, ...tradeOperations]
      : tradeOperations;

    console.log('🚀 Sending batched approval and trade operations:', JSON.stringify(batchedOps, null, 2));

    // Step 2: Prompt wallet to sign and send
    const opResponse = await window.dAppClient.requestOperation({
      operationDetails: batchedOps
    });
    console.log('✅ Operation submitted!', opResponse);

    // Step 3: Update modal to processing state
    showModal('PROCESSING...', '[APPROVING TRANSFERS + EXECUTING BURN... 🔥]');

    // Grab the returned operation hash
    const opHash = opResponse.transactionHash || opResponse.opHash || '';
    if (!opHash) throw new Error('OPERATION HASH NOT RETURNED.');

    // Step 4: Poll for on-chain confirmation
    await pollForConfirmation(opHash);

    // Step 5: Show success in the modal
    showModal('SUCCESS!', '[BURN COMPLETE. ✅]');

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

    // Start a 30-second countdown in text6
    let countdownInterval;
    if (text6) {
      text6.style.display = 'block';
      countdownInterval = startCountdown(30, text6);
    }

    // Reset just the exchange UI (cart + totals)
    resetEventsUI();

    // Step 6: Wait for the actual NFT balances to update on-chain
    const tradedTokenIds = burnCart.map(item => item.tokenId);
    const refreshedNFTs = await pollForNFTUpdate(myAddr, tradedTokenIds);
    refreshConnectedState(refreshedNFTs);

    // After balances reflect, swap spinner to checkbox & finalize
    if (text6) {
      clearInterval(countdownInterval);
      text6.textContent = '[SUCCESS!]';
    }
    const spinner = document.querySelector('.loading-spinner-01');
    const checkbox = document.querySelector('.loading-checkbox-01');
    if (spinner) spinner.style.display = 'none';
    if (checkbox) checkbox.style.display = 'inline-block';

    // Close modal after 3s
    setTimeout(hideModal, 3000);
  } catch (error) {
    console.error('❌ Error during exchange process:', error);
    showModal('ERROR', `${error.message || 'Unknown issue'}`);
    setTimeout(hideModal, 3000);
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

// =============================================================================
// UI STATE TOGGLING: FLAME ICONS & LIVE/SOLD‑OUT PANEL STYLING
// =============================================================================

/**
 * Returns the currently visible flame container element.
 *
 * @returns {Element|null} The visible flame container, or null if none.
 */
function getCurrentFlameContainer() {
  return Array.from(
    document.querySelectorAll('.flame-div-default, .flame-div-mobile-l, .flame-div-mobile')
  ).find(el => window.getComputedStyle(el).display !== 'none') || null;
}

/**
 * Toggles static vs animated flame icons and panel borders
 * based on the current AppState (walletConnected, phase, pause, supply, etc.).
 *
 * @returns {void}
 */
function updateFlames() {
  const {
    walletConnected,
    selectedTokenId,
    countdownPhase,
    contractPaused,
    redeemSupply
  } = AppState;

  // “Live” with supply > 0 triggers animated flame + white panels
  const liveActive =
    walletConnected &&
    !!selectedTokenId &&
    countdownPhase === 'live' &&
    !contractPaused &&
    redeemSupply > 0;

  // “Sold‑Out” specifically: live phase but supply is 0
  const soldOutLive =
    countdownPhase === 'live' &&
    redeemSupply === 0;

  // —— Flame icon logic ——
  const container = getCurrentFlameContainer();
  if (container) {
    const staticImg   = container.querySelector(
      'img.flame-icon, img.flame-icon-mobile-l, img.flame-icon-mobile'
    );
    const animatedImg = container.querySelector(
      'img.flame-icon-animated, img.flame-icon-mobile-l-animated, img.flame-icon-mobile-animated'
    );

    if (liveActive) {
      staticImg?.removeAttribute('style');
      animatedImg?.removeAttribute('style');
      staticImg   && (staticImg.style.display   = 'none');
      animatedImg && (animatedImg.style.display = 'block');
    } else {
      staticImg   && (staticImg.style.display   = 'block');
      animatedImg && (animatedImg.style.display = 'none');
    }
  }

  // Toggle panel border & background via body.live‑panels
  document.body.classList.toggle('live-panels', liveActive);

  // —— Sold‑Out override for redeem panel border ——
  const redeemPanel = document.querySelector('.event-cart-redeem-token-div-main');
  if (redeemPanel) {
    if (soldOutLive) {
      // greyed‑out border when sold out
      redeemPanel.style.backgroundColor = '#f3f3f380';
    } else {
      // remove override so CSS (.live‑panels or default) takes back over
      redeemPanel.style.removeProperty('border-color');
    }
  }
}

// =============================================================================
// CMS ROW MAPPING & ROW BUILDERS
// =============================================================================

/**
 * Scans each collection’s Webflow wrapper (.w-dyn-item), groups rows by collection key,
 * and stamps each with its tokenId and contractAddress.
 */
function setEventContractAndTokenAttributes() {
  // 1) Find all rows for each collection
  const allRows = findCMSRows(Object.keys(collections));

  // 2) Stamp each row with its tokenId + contractAddress
  Object.entries(allRows).forEach(([collKey, rows]) => {
    const contractAddress = collections[collKey];
    rows.forEach(row => stampRowAttributes(row, contractAddress));
  });

  // 3) Expose map for lookups elsewhere
  window.cmsRowsByCollection = allRows;
  console.log("CMS rows grouped by collection:", window.cmsRowsByCollection);
}

/**
 * Deep-clone the entire wrapper (.w-dyn-item) so we inherit all of
 * its original CSS (including padding/margins), then swap in our
 * testnet tokenId text and carry over the contract address.
 */
function buildEventTokenRow(originalWrapper, testnetTokenId) {
  const clone = originalWrapper.cloneNode(true);

  // preserve any inline margins/padding
  const cs = window.getComputedStyle(originalWrapper);
  [
    'marginTop','marginRight','marginBottom','marginLeft',
    'paddingTop','paddingRight','paddingBottom','paddingLeft'
  ].forEach(prop => {
    clone.style[prop] = cs[prop];
  });

  // stamp on testnet token ID
  clone.dataset.tokenId = testnetTokenId;
  const idEl =
    clone.querySelector('.token-id-number') ||
    clone.querySelector('.token-id-container');
  if (idEl) idEl.textContent = testnetTokenId;

  // **<— carry over the contract address so updateOwnedTokenCounts can match it**
  clone.dataset.contractAddress = originalWrapper.dataset.contractAddress;

  return clone;
}

/**
 * Since buildEventTokenRow now returns a full .w-dyn-item clone,
 * we don’t need to wrap it again—just return it directly.
 */
function wrapTokenRow(tokenRow, collectionKey) {
  return tokenRow;
}

// =============================================================================
// DROP DETAILS RENDERING
// =============================================================================

/**
 * Renders all drop‐detail UI elements from `drop-params.js`.
 */
function renderDropDetails() {
  updateDropName();
  updateDropDateTime();
  updateDropMechanics();
  updateDropExclusions();
  updateDropExclusionsList();
  updateRedeemTokenTitle();
}

/**
 * Updates the drop title.
 */
function updateDropName() {
  const el = document.querySelector('.drop-title-header-text');
  if (el && dropName) {
    el.innerHTML = dropName.toUpperCase() + " DROP //";
    console.log("Drop name updated to:", el.innerHTML);
  }
}

/**
 * Updates the drop date and time display.
 * - Date row uses strict validateDropDate so invalid combos
 *   (e.g. "November 31") show a config error instead of rolling over.
 * - Time row uses computeDropInstant so malformed time/period/timezone
 *   never leak into the pill; instead you see a CONFIG ERROR that
 *   matches the countdown pill.
 */
function updateDropDateTime() {
  const dateEl = document.querySelector('.drop-details-drop-date-text');
  const timeEl = document.querySelector('.drop-details-drop-time-text');

  // ----- DATE LABEL (strict via validateDropDate) -----
  if (dateEl && dropDate) {
    const validation = validateDropDate(dropDate);

    if (!validation.ok) {
      // Hard error in UI for malformed Y-M-D
      dateEl.innerHTML = 'CONFIG ERROR: BAD DATE';
    } else {
      const { date } = validation;
      const opts = { weekday: "long", month: "long", day: "2-digit" };
      dateEl.innerHTML = date.toLocaleDateString("en-US", opts).toUpperCase();
    }
  }

  // ----- TIME LABEL (strict via computeDropInstant) -----
  if (timeEl) {
    // If either date or time config is missing, treat as a hard config error.
    if (!dropDate || !dropTime) {
      timeEl.innerHTML = "CONFIG ERROR: MISSING DATE/TIME";
      console.warn("[updateDropDateTime] Missing dropDate or dropTime in params.");
    } else {
      const result = computeDropInstant(dropDate, dropTime);

      if (!result.ok) {
        // Mirror the countdown’s error semantics so both pills agree.
        let msg = "CONFIG ERROR";
        if (result.error === 'BAD_TZ') {
          msg = "CONFIG ERROR: BAD TZ";
        } else if (result.error === 'BAD_DATE') {
          msg = "CONFIG ERROR: BAD DATE/TIME";
        } else if (result.error === 'BAD_DATE_TZ') {
          msg = "CONFIG ERROR: BAD DATE/TZ";
        }

        timeEl.innerHTML = msg;
        console.error("[updateDropDateTime] Invalid dropDate/dropTime:", {
          dropDate,
          dropTime,
          error: result.error
        });
      } else {
        // Valid config: render the exact H:MM / HH:MM the user supplied
        // with AM/PM and TZ — no truncation of :00 minutes.
        const { time, period, timezone } = dropTime;

        const safeTime   = String(time || "");
        const safePeriod = String(period || "").toUpperCase();
        const safeTz     = String(timezone || "").toUpperCase();

        const [h, m] = safeTime.split(":");
        const ts = `${h}:${m}${safePeriod} ${safeTz}`;

        timeEl.innerHTML = ts.toUpperCase();
      }
    }
  }

  console.log(
    "Drop date/time updated to:",
    dateEl?.innerHTML,
    timeEl?.innerHTML
  );
}

/**
 * Updates burn/redeem mechanics text.
 */
function updateDropMechanics() {
  const burnAmtEl   = document.querySelector('.drop-details-burn-amount-text');
  const burnColEl   = document.querySelector('.drop-details-burn-collection-text');
  const redeemAmtEl = document.querySelector('.drop-details-redeem-amount-text');
  const redeemColEl = document.querySelector('.drop-details-redeem-collection-text');

  const enabled = burnTokens.filter(t => t.enabled);
  if (enabled.length === 0) {
    burnColEl.innerHTML = "[NONE]";
    burnAmtEl.innerHTML = "";
  } else if (enabled.length > 1) {
    burnColEl.innerHTML = "ERROR: CHECK CONFIG";
    burnAmtEl.innerHTML = "";
  } else {
    const bt = enabled[0];
    burnAmtEl.innerHTML = "x" + bt.burnAmount;
    let disp = bt.collection.toUpperCase();
    if (disp === "HEN") disp = "HIC ET NUNC";
    burnColEl.innerHTML = disp;
  }

  if (redeemAmtEl && redeemToken && redeemColEl) {
    redeemAmtEl.innerHTML = "x" + redeemToken.redeemAmount;
    redeemColEl.innerHTML = redeemToken.collection.toUpperCase();
  } else {
    console.warn("Redeem details not fully found.");
  }
}

/**
 * Updates the exclusions summary line.
 */
function updateDropExclusions() {
  const exclEl = document.querySelector('.drop-details-exclusions-text');
  let all = [];

  burnTokens.forEach(e => {
    if (e.exclude?.length) all = all.concat(e.exclude);
  });

  if (exclEl) {
    exclEl.innerHTML = all.length ? all.join(", ") : "[NONE]";
  }

  console.log("Drop exclusions updated:", exclEl?.innerHTML);
}

/**
 * Updates the exclusion‐detail list (titles).
 */
function updateDropExclusionsList() {
  const listEl = document.querySelector('.drop-details-exclusions-text-none');
  if (!listEl) return;

  const enabled = burnTokens.filter(t => t.enabled);
  if (enabled.length !== 1) {
    listEl.innerHTML = "[ERROR]";
    return;
  }

  const excl = enabled[0].exclude || [];
  if (!excl.length) {
    listEl.innerHTML = "[NONE]";
    return;
  }

  const key = enabled[0].collection.toUpperCase();
  const rows = window.cmsRowsByCollection?.[key] || [];
  const titles = excl.map(id => {
    const r = rows.find(r => r.getAttribute('data-token-id') === id);
    return r?.querySelector('.collection-item-title-text')?.textContent.trim() || id;
  });

  listEl.innerHTML = titles.join(", ");
  console.log("Drop exclusion list updated:", listEl.innerHTML);
}

/**
 * Updates the redeem‐token title text.
 */
function updateRedeemTokenTitle() {
  const cfg = redeemToken;
  const titleEl = document.querySelector('.drop-details-redeem-token-title-text');
  if (!titleEl) return;

  const key = cfg.collection.toUpperCase();
  let match = window.cmsRowsByCollection?.[key]?.find(
    r => r.getAttribute('data-token-id') === cfg.tokenId
  );

  if (!match && key === "CANAAN") {
    const rows = document.querySelectorAll('.canaan-collection .collection-item-01.w-dyn-item');
    rows.forEach(r => {
      if (r.querySelector('.token-id-number')?.textContent.trim() === cfg.tokenId) {
        match = r;
      }
    });
  }

  if (match) {
    const t = match.querySelector('.collection-item-title-text')?.textContent.trim();
    titleEl.innerHTML = t || "[TOKEN TITLE NOT FOUND]";
  } else {
    titleEl.innerHTML = "[TOKEN TITLE NOT FOUND]";
  }
}

// =============================================================================
// NFT PROCESSING & CMS ROW MANAGEMENT
// =============================================================================

/**
 * Proxy to the global `fetchNFTs` implementation.
 *
 * @param {string} address - Wallet address to fetch NFTs for.
 * @returns {Promise<Array>} Array of NFT objects.
 */
async function fetchNFTs(address) {
  if (typeof window.fetchNFTs === 'function') {
    return await window.fetchNFTs(address);
  } else {
    console.error('fetchNFTs is not available on window');
    return [];
  }
}

/**
 * Renders all “owned” counts from a balance map.
 *
 * @param {Record<string, number>} balances
 * @returns {void}
 */
function renderBalances(balances) {
  // Walk every current row in the DOM that has a data-token-id
  document
    .querySelectorAll('.w-dyn-item[data-token-id]')
    .forEach(wrapper => {
      const ownedEl = wrapper.querySelector('.collection-item-owned-text');
      if (!ownedEl) return;
      const { tokenId, contractAddress } = wrapper.dataset;
      const key = `${contractAddress}:${tokenId}`;
      const count = balances[key] || 0;
      ownedEl.textContent = count > 0 ? String(count) : '00';
    });
}

/**
 * Updates the "owned" count for each CMS row based on the user's NFT balances.
 *
 * @param {{tokenId:string, contractAddress:string, balance:number}[]} nfts
 * @returns {void}
 */
function updateOwnedTokenCounts(nfts) {
  const balances = computeBalances(nfts);
  renderBalances(balances);
  console.log("Owned token counts updated.");
}

/**
 * Takes the user's NFTs and re-renders the available token grid.
 * Keeps the grid hidden and spinner visible until everything is ready,
 * then in a single step hides the spinner and shows the grid.
 *
 * @param {Array} nfts - Array of NFT objects.
 */
async function updateTokensWithWalletData(nfts) {
  console.log("updateTokensWithWalletData called with NFTs:", nfts);

  // Preserve previous selection
  const prevRow = document.querySelector('.w-checkbox-input.events_checkbox:checked')
    ?.closest('[data-token-id]');
  const prevToken = prevRow?.getAttribute('data-token-id') || null;

  // Grab UI elements
  const walletDiv = document.querySelector('.events-wallet-ui-div');
  const spinner   = document.querySelector('.available-token-ui-loading---events');

  // 1) show spinner, hide grid
  if (spinner)   spinner.style.display  = 'block';
  if (walletDiv) walletDiv.style.visibility = 'hidden';

  // Update the burn-token cart area immediately
  updateEventCartBurnToken();

  // Clear and rebuild each collection container
  ['HEN', 'INTRODUCTIONS'].forEach(coll => {
    const slug = getCollectionSlug(coll);
    const pane = document.querySelector(`.${slug}-collection.w-dyn-list`);
    if (pane) {
      pane.style.display = "block";
      pane.innerHTML     = '';
    }
  });

  // Filter eligible NFTs
  const eligible = nfts.filter(nft => {
    const entry = burnTokens.find(t =>
      normalizeString(nft.contractAddress) === normalizeString(collections[t.collection]) &&
      !t.exclude.includes(nft.tokenId) &&
      Number(nft.balance) > 0
    );
    return Boolean(entry);
  });
  console.log("Eligible NFTs:", eligible);

  // Toggle “no tokens” message
  const noTokens = document.querySelector('.no-tokens-in-walet-div---events');
  if (noTokens) {
    noTokens.style.display = eligible.length ? 'none' : 'flex';
  }

  // For each enabled burnToken config, clone & append any held rows
  burnTokens.forEach(config => {
    if (!config.enabled) return;

    const key     = config.collection.toUpperCase();
    const slug    = getCollectionSlug(key);
    const parent  = document.querySelector(`.${slug}-collection.w-dyn-list`);
    const cmsRows = (window.cmsRowsByCollection[key] || [])
                      .sort((a, b) => Number(a.dataset.tokenId) - Number(b.dataset.tokenId));

    Object.entries(tokenMapping[key] || {})
      .filter(([mainId]) => !config.exclude.includes(mainId))
      .forEach(([mainId, testId]) => {
        if (
          eligible.some(n =>
            n.tokenId === testId &&
            n.contractAddress === collections[key]
          )
        ) {
          const orig = cmsRows.find(r => r.dataset.tokenId === mainId);
          if (!orig || !parent) return;

          const wrappedRow = wrapTokenRow(
            buildEventTokenRow(orig, testId),
            key
          );

          // — force the real contractAddress onto the clone —
          wrappedRow.setAttribute(
            'data-contract-address',
            collections[key]
          );

          wrappedRow.style.display = "";
          parent.appendChild(wrappedRow);

          // — DEBUG —
          console.log(
            `[DEBUG] Appended row for ${key} token ${testId} in .${slug}-collection (contract=${collections[key]})`
          );
        }
      });
  });

  // **–– NEW LINE ––** update the “Owned” column for all rows
  updateOwnedTokenCounts(nfts);

  // Restore previous checkbox
  if (prevToken) {
    const sel = document.querySelector(
      `.events-wallet-ui-div [data-token-id="${prevToken}"] .w-checkbox-input.events_checkbox`
    );
    if (sel) {
      sel.checked = true;
      updateEventCartBurnToken();
    }
  }

  // 2) hide spinner & show grid
  setTimeout(() => {
    if (spinner)   spinner.style.display  = 'none';
    if (walletDiv) walletDiv.style.visibility = 'visible';
  }, 0);
}

// =============================================================================
// EVENT CART UPDATES
// =============================================================================

/**
 * Clears the burn-token panel back to its default state:
 *  - Restores the “add token” markup
 *  - Clears title, edition, collection text, and any token image
 *
 * @param {Element} container  The `.event-cart-burn-token-div-main` element
 * @returns {void}
 */
function clearBurnTokenUI(container) {
  const addDiv     = container.querySelector('.event-cart-add-token-text-div');
  const titleEl    = container.querySelector('.collection-item-events-title-text');
  const editionsEl = container.querySelector('.event-cart-editions-div .collection-item-events-editions-text');
  const collEl     = container.querySelector('.collection-item-events-collection-text');
  const img        = container.querySelector('img.token-image');

  if (addDiv)     { addDiv.style.display = 'flex'; addDiv.innerHTML = defaultAddTokenMarkup; }
  if (titleEl)    titleEl.textContent = '';
  if (editionsEl) editionsEl.textContent = '00';
  if (collEl)     collEl.textContent = '';
  if (img)        img.remove();
}

/**
 * Returns the count of checked burn-token checkboxes.
 *
 * @returns {number}
 */
function getSelectedCheckboxCount() {
  return document.querySelectorAll('.w-checkbox-input.events_checkbox:checked').length;
}

/**
 * Updates the “Burn Token” panel in the event cart based on the selected checkbox.
 * If none is selected, restores default UI and clears cartItems.
 */
function updateEventCartBurnToken() {
  const checked   = document.querySelector('.w-checkbox-input.events_checkbox:checked');
  const container = document.querySelector('.event-cart-burn-token-div-main');
  if (!container) {
    console.warn("Event cart burn token container not found.");
    return;
  }

  // ————— No token checked: reset UI + clear state —————
  if (!checked) {
    clearBurnTokenUI(container);
    updateAppState({
      selectedTokenId: null,
      cartItems: []
    });
    return;
  }

  // ————— Token selected: extract data, render, update state —————
  const cmsRow = checked.closest('[data-token-id]');
  if (!cmsRow) {
    console.warn("No [data-token-id] ancestor found.");
    clearBurnTokenUI(container);
    updateAppState({
      selectedTokenId: null,
      cartItems: []
    });
    return;
  }

  // 1) Gather token data via helper
  const data = getTokenData(cmsRow);

  // 2) Render into UI via helper
  renderBurnTokenUI(container, data);

  // 3) Update state: selectedTokenId + cartItems
  const newItem = {
    id: data.id,
    title: data.title,
    collection: data.collection,
    editionCount: data.editions,
    imgSrc: data.imgSrc,
    imgSrcset: data.imgSrcset
  };
  updateAppState({
    selectedTokenId: data.id,
    cartItems: [
      ...AppState.cartItems.filter(item => item.id !== data.id),
      newItem
    ]
  });
}

/**
 * Updates the “Redeem Token” panel in the event cart.
 * Shows spinner until the CMS image is fully loaded, then swaps it in center-aligned.
 */
function updateEventCartRedeemToken() {
  // 1) Configuration & container
  const cfg       = redeemToken;
  const container = document.querySelector('.event-cart-redeem-token-div-main');
  if (!container) {
    console.warn("Event cart redeem token container not found.");
    return;
  }

  // 2) Spinner setup via helper
  const imgWrap = container.querySelector('.event-cart-burn-token-image-div');
  const spinner = imgWrap?.querySelector('.loading-spinner-02-redeem-token')
               || container.querySelector('.loading-spinner-02-redeem-token');
  showRedeemSpinner(imgWrap, spinner);

  // 3) Locate the appropriate CMS row via helper
  const key = cfg.collection.toUpperCase();
  const row = findRedeemRow(cfg, key);

  // 4) Render text fields via helper
  renderRedeemText(container, row, cfg, key);

  // 5) Preload & display image via helper
  preloadRedeemImage(imgWrap, row, spinner);
}

/**
 * Finds the CMS row matching the redeem token configuration.
 *
 * @param {{collection:string, tokenId:string}} cfg
 * @param {string} key  Uppercase collection key.
 * @returns {Element|null} The matched CMS row or null.
 */
function findRedeemRow(cfg, key) {
  let row = window.cmsRowsByCollection?.[key]?.find(r => r.dataset.tokenId === cfg.tokenId) || null;
  if (!row && key === "CANAAN") {
    document.querySelectorAll('.canaan-collection .collection-item-01.w-dyn-item')
      .forEach(r => {
        if (r.querySelector('.token-id-number')?.textContent.trim() === cfg.tokenId) {
          row = r;
        }
      });
  }
  return row;
}

/**
 * Updates the title, collection, editions, and supply text fields.
 *
 * @param {Element} container
 * @param {Element|null} row  The matched CMS row or null.
 * @param {{redeemAmount:string, totalSupply:number}} cfg
 * @param {string} key  Uppercase collection key.
 */
function renderRedeemText(container, row, cfg, key) {
  let title = row?.querySelector('.collection-item-title-text')?.textContent.trim() || "[TOKEN TITLE NOT FOUND]";
  if (title.length > 12) title = title.slice(0,12) + "...";

  const titleEl    = container.querySelector('.collection-item-events-title-text');
  const collEl     = container.querySelector('.collection-item-events-collection-text');
  const editionsEl = container.querySelector('.collection-item-events-editions-text');
  const supplyEl   = container.querySelector('.supply-text-number');

  if (titleEl)    titleEl.textContent    = title;
  if (collEl)     collEl.textContent     = key;
  if (editionsEl) editionsEl.textContent = row
    ? row.querySelector('.collection-item-editions-text-number')?.textContent.trim()
    : cfg.redeemAmount;
  if (supplyEl)   supplyEl.textContent   = "x" + cfg.totalSupply;
}

/**
 * Preloads the redeem image off-DOM and reveals it centered when loaded.
 * Hides the spinner once the image is visible.
 *
 * @param {Element} imgWrap    The `.event-cart-burn-token-image-div` wrapper.
 * @param {Element|null} row   The matched CMS row or null.
 * @param {Element} spinner    The spinner element to hide on load.
 */
function preloadRedeemImage(imgWrap, row, spinner) {
  // If no matching row, keep spinner visible and exit
  if (!row || !imgWrap) {
    spinner && (spinner.style.display = 'block');
    console.warn("No matching CMS row for redeem token; spinner remains.");
    return;
  }

  const cmsImg = row.querySelector('.collection-item-image-div img');
  if (!cmsImg) {
    spinner && (spinner.style.display = 'block');
    return;
  }

  const pre = new Image();
  pre.src      = cmsImg.src;
  if (cmsImg.srcset) pre.srcset = cmsImg.srcset;
  pre.width    = 150;
  pre.height   = 188;
  pre.alt      = pre.alt;
  pre.className = 'event-cart-redeem-img';
  pre.style.visibility = 'hidden';

  pre.onload = () => {
    spinner && (spinner.style.display = 'none');
    pre.style.visibility = 'visible';
    console.log("Event cart redeem token image loaded:", cmsImg.src);
  };

  // Replace any previous image
  imgWrap.querySelector('img.event-cart-redeem-img')?.remove();
  imgWrap.appendChild(pre);
}

/**
 * Shows every CMS row in each burn-token list (pre-wallet UI).
 * Hides both spinners once the rows are back in the DOM.
 */
function displayDefaultTokens() {
  console.log("Displaying default tokens.");
  ['hen','introductions'].forEach(coll => {
    const pane = document.querySelector(`.${coll}-collection.w-dyn-list`);
    if (!pane) return;
    pane.style.display = 'block';
    while (pane.firstChild) pane.removeChild(pane.firstChild);
    const rows = window.cmsRowsByCollection?.[coll.toUpperCase()] || [];
    rows.forEach(row => {
      const wrapped = wrapTokenRow(buildEventTokenRow(row, row.dataset.tokenId), coll.toUpperCase());
      wrapped.style.display = "";
      pane.appendChild(wrapped);
    });
  });

  // hide spinners now that default tokens are rendered
  const availSpinner = document.querySelector('.available-token-ui-loading---events');
  if (availSpinner) availSpinner.style.display = 'none';
  const redeemSpinner = document.querySelector('.loading-spinner-02-redeem-token');
  if (redeemSpinner) redeemSpinner.style.display = 'none';
}

// =============================================================================
// COUNTDOWN & CONTRACT UNPAUSE
// =============================================================================

/**
 * Polls the escrow contract’s storage until its `paused` flag flips to false,
 * then re-fetches & re-renders the user's NFTs.
 */
async function pollForUnpause(contractAddress, interval = 3000) {
  // entering standby-polling: mark on-chain paused
  updateAppState({ contractPaused: true });

  console.log(`[pollForUnpause] polling ${contractAddress} every ${interval}ms`);
  let attempt = 0;
  while (true) {
    attempt++;
    console.log(`[pollForUnpause] attempt #${attempt}`);
    try {
      const res = await fetch(
        `${TZKT_BASE}/v1/contracts/${contractAddress}/storage`
      );
      const storage = await res.json();
      console.log(`[pollForUnpause] paused =`, storage.paused);

      if (storage.paused === false) {
        console.log("[pollForUnpause] detected unpause!");
        updateAppState({ contractPaused: false });

        if (AppState.walletConnected) {
          const account = AppState.activeAccount;
          if (account) {
            const nfts = await fetchNFTs(account.address);
            updateTokensWithWalletData(nfts);
            updateOwnedTokenCounts(nfts);
          }
        }
        return;
      }
    } catch (err) {
      console.error(`[pollForUnpause] fetch error:`, err);
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

/**
 * Starts the countdown to the drop; handles pre-drop timer, standby,
 * and transitions by driving AppState only.
 *
 * - Uses shared computeDropInstant(dropDate, dropTime) for timezone-aware Date.
 * - Displays "N DAYS • HH:MM:SS", "1 DAY • HH:MM:SS", "0 DAYS • HH:MM:SS",
 *   or "TODAY • HH:MM:SS" depending on local calendar day.
 */
function startCountdown() {
  const countdownEl = document.querySelector('.drop-details-drop-date-countdown-text');
  if (!countdownEl || !dropDate || !dropTime) {
    console.warn("[startCountdown] Missing elements or config; aborting.");
    return;
  }

  // Use shared helper to compute the concrete drop Date
  const result = computeDropInstant(dropDate, dropTime);
  if (!result.ok) {
    console.error("[startCountdown] computeDropInstant error:", result.error, {
      dropDate,
      dropTime
    });

    let msg = "CONFIG ERROR";
    if (result.error === 'BAD_TZ')         msg = "CONFIG ERROR: BAD TZ";
    else if (result.error === 'BAD_DATE')  msg = "CONFIG ERROR: BAD DATE/TIME";
    else if (result.error === 'BAD_DATE_TZ') msg = "CONFIG ERROR: BAD DATE/TZ";

    countdownEl.textContent = msg;
    updateAppState({
      countdownPhase:   'config-error',
      currentCountdown: msg
    });
    return;
  }

  const dropDateTime = result.date;
  console.log("[startCountdown] Drop date/time:", dropDateTime);

  // initial phase = pre
  updateAppState({ countdownPhase: 'pre', currentCountdown: '00:00:00' });

  // if already past drop → immediately standby + poll
  if (new Date() >= dropDateTime) {
    console.log("[startCountdown] Past drop time; entering standby immediately");
    updateAppState({ countdownPhase: 'standby' });
    countdownEl.textContent = "STANDBY…";

    pollForUnpause(BURN_REDEEM_CONTRACT_ADDRESS)
      .then(() => {
        console.log("[startCountdown] Unpaused → LIVE");
        updateAppState({ countdownPhase: 'live', currentCountdown: 'LIVE NOW!' });
        countdownEl.textContent = "LIVE NOW!";
      })
      .catch(err => console.error("[startCountdown] pollForUnpause error:", err));
    return;
  }

  /**
   * Called every second before drop: updates the timer, transitions phases.
   */
  function tick() {
    const diffMs = dropDateTime - new Date();

    if (diffMs <= 0) {
      // stop the pre-drop interval
      clearInterval(AppState.countdownTimerId);
      AppState.countdownTimerId = null;

      console.log("[startCountdown] Hit zero → entering standby");
      updateAppState({ countdownPhase: 'standby' });
      countdownEl.textContent = "STANDBY…";

      pollForUnpause(BURN_REDEEM_CONTRACT_ADDRESS)
        .then(() => {
          console.log("[startCountdown] Unpaused → LIVE");
          updateAppState({ countdownPhase: 'live', currentCountdown: 'LIVE NOW!' });
          countdownEl.textContent = "LIVE NOW!";
        })
        .catch(err => console.error("[startCountdown] pollForUnpause error:", err));
      return;
    }

    // still pre-drop: update "DAYS • HH:MM:SS" / "TODAY • HH:MM:SS" / "0 DAYS • HH:MM:SS"
    const now      = new Date();
    const totalSec = Math.floor(diffMs / 1000);

    let s    = totalSec;
    const days = Math.floor(s / 86400); s -= days * 86400;
    const hrs  = Math.floor(s / 3600);  s -= hrs * 3600;
    const mins = Math.floor(s / 60);    s -= mins * 60;
    const secs = s;

    const hh = pad(hrs);
    const mm = pad(mins);
    const ss = pad(secs);

    // Local-day comparison for TODAY vs 0 DAYS
    const sameLocalDay = dropDateTime.toDateString() === now.toDateString();

    let labelPart;
    if (days > 0) {
      // Proper pluralization
      labelPart = (days === 1) ? '1 DAY' : `${days} DAYS`;
    } else {
      // < 24h remaining: distinguish TODAY vs "0 DAYS"
      labelPart = sameLocalDay ? 'TODAY' : '0 DAYS';
    }

    const timePart  = `${hh}:${mm}:${ss}`;
    const formatted = `${labelPart} • ${timePart}`;

    countdownEl.textContent = formatted;

    // AppState keeps the plain clock for exchange-button hover
    updateAppState({ currentCountdown: timePart });
  }

  // kick off the first tick immediately
  tick();

  // schedule recurring ticks and store the handle in AppState
  AppState.countdownTimerId = setInterval(tick, 1000);
}

// =============================================================================
// EXCHANGE BUTTON STATE MANAGEMENT
// =============================================================================

/**
 * Given the AppState flags, compute exactly what the exchange button
 * should display and how it should behave.
 */
function computeExchangeButtonState({
  walletConnected,
  selectedTokenId,
  countdownPhase,
  currentCountdown,
  hoveringExchange,
  contractPaused,
  redeemSupply
}) {
  // — SOLD‑OUT state: only when live, supply is zero, walletConnected & tokenSelected —
  if (
    countdownPhase === 'live' &&
    redeemSupply === 0 &&
    walletConnected &&
    selectedTokenId
  ) {
    // Always display SOLD OUT in the highlight color
    const soldOutColor = '#d4d4d4';
    return {
      defaultLabel: 'SOLD OUT!',
      hoverLabel:   'SOLD OUT!',
      defaultColor: soldOutColor,
      hoverColor:   soldOutColor,
      pulse:        false,
      liveClass:    !contractPaused,
      clickAction:  null
    };
  }

  // defaults
  let defaultLabel = 'EXCHANGE';
  let hoverLabel   = 'EXCHANGE';
  let defaultColor = '#363636';
  let hoverColor   = '#363636';
  let pulse        = false;
  let liveClass    = false;
  let clickAction  = null;

  // Case 1 & 3: no token selected
  if (!selectedTokenId) {
    hoverLabel = 'SELECT TOKEN';
    hoverColor = '#d4d4d4';
  }
  // Case 2: token selected but not connected
  else if (!walletConnected) {
    hoverLabel  = 'CONNECT';
    hoverColor  = '#d4d4d4';
    clickAction = () => document.querySelector('.button-primary.w-button')?.click();
  }
  // Now walletConnected && token selected
  else {
    switch (countdownPhase) {
      case 'pre':
        hoverLabel = currentCountdown;
        hoverColor = '#d4d4d4';
        break;
      case 'standby':
        hoverLabel = 'STANDBY…';
        hoverColor = '#d4d4d4';
        pulse      = true;
        break;
      case 'live':
        defaultColor = contractPaused ? '#363636' : '#d4d4d4';
        hoverLabel   = 'EXCHANGE';
        hoverColor   = '#f5c414';
        liveClass    = !contractPaused;
        clickAction  = handleEventExchange;
        break;
    }
  }

  return { defaultLabel, hoverLabel, defaultColor, hoverColor, pulse, liveClass, clickAction };
}

/**
 * Renders the exchange button UI purely from the computed state,
 * and pushes the disabled flag into AppState instead of setting it here.
 */
function updateExchangeButtonState(state) {
  const {
    defaultLabel,
    hoverLabel,
    defaultColor,
    hoverColor,
    pulse,
    liveClass,
    clickAction
  } = computeExchangeButtonState(state);

  // Determine and store disabled state centrally
  const disabled = !clickAction;
  if (state.exchangeDisabled !== disabled) {
    updateAppState({ exchangeDisabled: disabled });
  }

  const btn = document.querySelector('.event-cart-exchange-button-no-select.w-button');
  if (!btn) return;

  const isHover = state.hoveringExchange;

  // apply text & color
  btn.textContent = isHover ? hoverLabel : defaultLabel;
  btn.style.color = isHover ? hoverColor : defaultColor;

  // —— pulse logic, now respecting the `pulse` flag even when sold‑out ——
  const soldOutLive =
    state.countdownPhase === 'live' &&
    state.redeemSupply === 0 &&
    state.walletConnected &&
    state.selectedTokenId;

  if (soldOutLive) {
    if (pulse) {
      btn.classList.add('standby-anim');
    } else {
      btn.classList.remove('standby-anim');
    }
  } else {
    btn.classList.toggle('standby-anim', isHover && pulse);
  }

  // .live class for active drops
  btn.classList.toggle('live', liveClass);

  // click binding delegated from compute
  btn.onclick = e => {
    e.preventDefault();
    if (clickAction) clickAction();
  };

  // pointer cursor if actionable
  btn.style.cursor = clickAction ? 'pointer' : '';
}

/**
 * Ensures only one burn-token checkbox can ever be checked,
 * and updates the cart UI on every selection.
 */
function setupExclusiveCheckboxesWallet() {
  document.addEventListener('change', e => {
    if (!e.target.matches('.w-checkbox-input.events_checkbox')) return;
    const cb = e.target;
    // uncheck all others
    document.querySelectorAll('.w-checkbox-input.events_checkbox')
      .forEach(other => { if (other !== cb) other.checked = false; });

    // rebuild the cart panel & update AppState.selectedTokenId
    updateEventCartBurnToken();
  });
}

// =============================================================================
// EXCHANGE BUTTON EVENT BINDERS
// =============================================================================

function attachExchangeButtonHandlers() {
  const btn = document.querySelector('.event-cart-exchange-button-no-select.w-button');
  if (!btn) return;

  btn.addEventListener('mouseover', () => {
    console.log('👆 Hover exchange:', {
      selectedTokenId: AppState.selectedTokenId,
      walletConnected: AppState.walletConnected
    });
    updateAppState({ hoveringExchange: true });
  });

  btn.addEventListener('mouseout', () => {
    updateAppState({ hoveringExchange: false });
  });
}

// =============================================================================
// WALLET CONNECT / DISCONNECT
// =============================================================================

/**
 * Called when a wallet is connected. Updates AppState,
 * clears any old checkbox selection so we never briefly
 * re-create a selectedTokenId, then resets the UI.
 */
function handleWalletConnected(account) {
  console.log("Wallet connected; resetting burn-token display to default state.");

  // Persist active account in AppState instead of window.activeAccount
  updateAppState({ activeAccount: account });

  // 1) Clear any checked burn-token inputs immediately
  document
    .querySelectorAll('.w-checkbox-input.events_checkbox:checked')
    .forEach(cb => { cb.checked = false; });

  // 2) In one shot mark walletConnected and clear selectedTokenId
  updateAppState({
    walletConnected: true,
    selectedTokenId: null
  });

  // 3) Now rebuild the burn-token panel (will see no checked box)
  updateEventCartBurnToken();

  // 4) Update header text
  const header = document.querySelector('.available-burn-tokens-exchange-text');
  if (header) header.textContent = 'AVAILABLE BURN TOKENS';
}

/**
 * Called when a wallet is disconnected. Clears AppState, resets all UI,
 * and switches headers/buttons back to their disconnected defaults.
 */
function handleWalletDisconnected() {
  console.log("Wallet disconnected; restoring default tokens and clearing selections.");

  // Clear active account & related flags in AppState
  updateAppState({
    activeAccount: null,
    walletConnected: false,
    selectedTokenId: null
  });

  // Clear any running countdown-pulse interval
  if (AppState.exchangeButtonInterval) {
    clearInterval(AppState.exchangeButtonInterval);
    updateAppState({ exchangeButtonInterval: null });
  }

  // Deselect all checkboxes
  document.querySelectorAll('.w-checkbox-input.events_checkbox')
    .forEach(cb => cb.checked = false);

  // Reset burn-token UI and default token grid
  updateEventCartBurnToken();
  if (typeof displayDefaultTokens === 'function') {
    displayDefaultTokens();
  }

  // Hide the “no tokens” message
  const noTokensDiv = document.querySelector('.no-tokens-in-walet-div---events');
  if (noTokensDiv) noTokensDiv.style.display = 'none';

  // Restore exchange button text
  const exchBtn = document.querySelector('.event-cart-exchange-button-no-select.w-button');
  if (exchBtn) exchBtn.textContent = 'EXCHANGE';

  // Switch header back to “ELIGIBLE BURN TOKENS”
  const header = document.querySelector('.available-burn-tokens-exchange-text');
  if (header) header.textContent = 'ELIGIBLE BURN TOKENS';
}

// Ensure external disconnect events also clear AppState
window.addEventListener('walletDisconnected', () => {
  console.log("Wallet forcibly disconnected");
  updateAppState({
    activeAccount: null,
    walletConnected: false,
    selectedTokenId: null
  });

  const disconnectBtn = document.querySelector('.disconnect-wallet-button');
  const connectBtn    = document.querySelector('.connect-wallet-button');
  disconnectBtn?.style.setProperty('display', 'none');
  connectBtn?.style.setProperty('display', 'block');

  clearCartUI();
  renderDropDetails();
});

// =============================================================================
// INITIALIZATION & EVENT BINDING
// =============================================================================

document.addEventListener("DOMContentLoaded", async () => {
  // 0) Drop-schedule early gate (page-level)
  //     - Hides .drops-page-load-spinner-div
  //     - Shows either .drops-ui-div or .no-drops-scheduled-div
  //     - Returns early if no drop is scheduled
  if (!applyDropScheduledGate()) return;

  // 0a) Preload our flame-animation GIFs so toggles are instant
  preloadFlameIcons();

  // 0b) Ensure both spinners are visible on initial load (only when scheduled)
  const availSpinner  = document.querySelector('.available-token-ui-loading---events');
  const redeemSpinner = document.querySelector('.loading-spinner-02-redeem-token');
  if (availSpinner)  availSpinner.style.display  = 'flex';
  if (redeemSpinner) redeemSpinner.style.display = 'block';

  // 1) Capture default “add token” markup for resets
  const addDiv = document.querySelector('.event-cart-add-token-text-div');
  if (addDiv) defaultAddTokenMarkup = addDiv.innerHTML;

  // 2) Build CMS‑row lookup
  setEventContractAndTokenAttributes();

  // 3) Render drop details
  renderDropDetails();

  // 4) Populate Redeem‑Token panel
  updateEventCartRedeemToken();

  // 4a) Ensure redeem‑token panel sits above the (empty) burn‑token panel
  const redeemPanel = document.querySelector('.event-cart-redeem-token-div-main');
  if (redeemPanel) redeemPanel.style.zIndex = '10';

  // 4b) Start polling the on‑chain redeem‑token supply
  startRedeemSupplyPolling();

  // 5) Start countdown / standby / live‑unpause
  startCountdown();

  // 6) Wire up checkboxes & exchange‑button handlers
  setupExclusiveCheckboxesWallet();
  attachExchangeButtonHandlers();

  // 7) Ellipsis on resize/orientation
  applyEllipsis();
  window.addEventListener('resize', applyEllipsis);
  window.addEventListener('orientationchange', applyEllipsis);

  // 8) Sync exchange‑button and countdown state
  subscribeToAppState(updateExchangeButtonState);
  subscribeToAppState(({ countdownPhase, redeemSupply }) => {
    const el = document.querySelector('.drop-details-drop-date-countdown-text');
    if (!el) return;

    if (countdownPhase === 'live' && redeemSupply === 0) {
      // Sold out: override text and remove any animation
      el.textContent = 'SOLD OUT!';
      el.classList.remove('standby-anim');
    } else {
      // Otherwise, keep the normal pulse animation on standby/live
      const pulse = countdownPhase === 'standby' || countdownPhase === 'live';
      el.classList.toggle('standby-anim', pulse);
      // and let your countdown logic continue to update the text for pre/standby/live
    }
  });

  // 8b) Sync the disabled flag to the exchange button
  subscribeToAppState(({ exchangeDisabled }) => {
    const btn = document.querySelector('.event-cart-exchange-button-no-select.w-button');
    if (btn) btn.disabled = exchangeDisabled;
  });

  // 9) Flame‑icon hookup
  subscribeToAppState(updateFlames);
  updateFlames();  // initial sync
  window.addEventListener('resize', updateFlames);
  window.addEventListener('orientationchange', updateFlames);

  // 10) Fetch NFTs if already connected
  if (window.dAppClient?.getActiveAccount) {
    try {
      const account = await window.dAppClient.getActiveAccount();
      if (account) {
        handleWalletConnected(account);
        setTimeout(async () => {
          const nfts = await fetchNFTs(account.address);
          updateTokensWithWalletData(nfts);
          updateEventCartBurnToken();
          updateOwnedTokenCounts(nfts);
        }, 200);
      } else {
        displayDefaultTokens();
        updateEventCartBurnToken();
      }
    } catch {
      displayDefaultTokens();
      updateEventCartBurnToken();
    }
  } else {
    displayDefaultTokens();
    updateEventCartBurnToken();
  }

  // 11) Listen for wallet connect/disconnect events
  if (window.dAppClient?.subscribeToEvent) {
    window.dAppClient.subscribeToEvent("ACTIVE_ACCOUNT_SET", async account => {
      if (account) {
        handleWalletConnected(account);
        setTimeout(async () => {
          const nfts = await fetchNFTs(account.address);
          updateTokensWithWalletData(nfts);
          updateEventCartBurnToken();
          updateOwnedTokenCounts(nfts);
        }, 200);
      } else {
        displayDefaultTokens();
        updateEventCartBurnToken();
      }
    });
  }

  // 12) Manual disconnect
  document.addEventListener("walletDisconnected", handleWalletDisconnected);

  // 13) Pause/resume redeem‑supply polling on page visibility
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopRedeemSupplyPolling();
    } else if (AppState.countdownPhase === 'live') {
      startRedeemSupplyPolling();
    }
  });

  // — no spinner toggles here any more — each spinner hides itself in its success path —
});