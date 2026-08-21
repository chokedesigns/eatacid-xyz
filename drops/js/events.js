// =============================================================================
// DEBUG CONFIG
// =============================================================================
const DEBUG_LOGGING = false; // flip to true when you want logs
const ENABLE_DESKTOP_ELLIPSIS_TEST = true;

// =============================================================================
// IMPORTS & CONFIGURATION
// =============================================================================

import eventsNetworkConfig from './events-config.js';
import dropParams from 'ea-drop-params';
import { computeDropInstant, validateDropDate } from '../../shared/drop-time.js';
import { createPublicLogger } from '../../shared/public-logger.js';
import {
  PUBLIC_WALLET_STATE_EVENT,
  getPublicWalletState,
  getVerifiedPublicActiveAccount
} from '../../shared/beacon-setup.js';
import {
  createInitialRevealBarrier,
  isCurrentWalletProjection,
  setRegionPending
} from './reveal-coordinator.js';
import {
  buildApprovalOps as buildSharedApprovalOps,
  fetchTokenPairId as fetchSharedTokenPairId,
  pollForConfirmation as pollForSharedConfirmation,
  pollForNFTUpdate as pollForSharedNFTUpdate
} from '../../shared/public-trade-ops.js';

const logger = createPublicLogger({ enabled: DEBUG_LOGGING, scope: 'drops' });

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
const {
  network,
  rpc,
  tzkt,
  contracts,
  validation,
  isConfigured,
  unavailableMessage
} = eventsNetworkConfig;
const current = contracts[network] || {
  escrow: '',
  collections: {},
  tokenMapping: {}
};
const networkConfigAvailable = isConfigured !== false;
const networkUnavailableMessage = unavailableMessage || 'This network is not configured yet.';

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
const REDEEM_CONTRACT_ADDRESS = collections[redeemToken?.collection] || '';

// ── Debug Logging ───────────────────────────────────────────────────────────
logger.groupCollapsed('🚀 Events.js config');
logger.log(`Network: ${network}`);
logger.log(`RPC endpoint: ${RPC_ENDPOINT}`);
logger.log(`TzKT base URL: ${TZKT_BASE}`);
logger.log(`Burn-Redeem escrow contract: ${BURN_REDEEM_CONTRACT_ADDRESS}`);
logger.log('Collections defined:', collections);
logger.log('Drop parameters:', { dropName, dropDate, dropTime });
logger.log('Burn tokens config:', burnTokens);
logger.log('Redeem token config:', redeemToken);
logger.log('Token mapping defined:', tokenMapping);
logger.groupEnd();
if (!networkConfigAvailable) {
  console.error(
    `Drops network config missing required values for ${network}: ${validation?.missing?.join(', ') || 'unknown'}`
  );
}

// =============================================================================
// GLOBAL UI STATE PLACEHOLDERS
// =============================================================================

/**
 * Single source of truth for all mutable UI state.
 */
const AppState = {
  activeAccount: null,                                   // currently connected wallet
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
  const selectors = [
    '.drop-details-burn-collection-text',
    '.drop-details-redeem-token-title-text',
    '.drop-details-drop-date-text',
    '.drop-details-drop-time-text',
    '.drop-details-drop-date-countdown-text-mobile',
    '.drop-details-exclusions-text-none',
    '.drop-details-burn-amount-text',
    '.drop-details-redeem-amount-text'
  ];

  // Elements whose contents can change over time (countdown, etc.)
  const dynamicClasses = new Set([
    'drop-details-drop-date-text',
    'drop-details-drop-time-text',
    'drop-details-drop-date-countdown-text-mobile',
    'drop-details-exclusions-text-none'
  ]);

  document.querySelectorAll(selectors.join(',')).forEach(el => {
    // Ensure we can actually measure overflow and force 1-line behavior
    // (critical for elements that would otherwise wrap)
    el.style.whiteSpace = 'nowrap';
    el.style.overflow = 'hidden';
    el.style.maxWidth = '100%';
    el.style.minWidth = '0';     // critical in flex layouts
    el.style.flexShrink = '1';   // critical in flex layouts

    // If the element has no measurable width, don't mutate it.
    // (e.g. display:none or not laid out yet)
    if (!el.clientWidth) return;

    const domText = (el.textContent || '').trim();
    const isDynamic = Array.from(dynamicClasses).some(cls => el.classList.contains(cls));

    // If the DOM currently shows an ellipsized string, DO NOT treat that as "full text".
    const domLooksTruncated = domText.endsWith('…');

    // Determine the best "full text" source:
    // - prefer previously stored fullText (restores when layout widens)
    // - for dynamic elements, update stored fullText only when DOM is NOT already truncated
    let full = (el.dataset.fullText || '').trim();

    if (!full) {
      full = domText;
    } else if (isDynamic) {
      // Dynamic: allow updates when the DOM text changes, but never overwrite with a truncated DOM string
      if (domText && !domLooksTruncated && domText !== full) {
        full = domText;
      }
    }

    // Persist full text so we can always restore
    el.dataset.fullText = full;

    // Native tooltip + accessibility label
    if (full) {
      el.setAttribute('title', full);
      el.setAttribute('aria-label', full);
    } else {
      el.removeAttribute('title');
      el.removeAttribute('aria-label');
    }

    // Reset to full before truncation
    el.textContent = full;

    // Truncate until it fits (leave at least 1 char before ellipsis)
    let truncated = full;
    while (el.scrollWidth > el.clientWidth && truncated.length > 1) {
      truncated = truncated.slice(0, -2);
      el.textContent = truncated + '…';
    }
  });
}

function enableTapToRevealEllipsis(selectors) {
  // Enable on touch devices; also allow desktop click for testing
  const isTouch = window.matchMedia?.('(hover: none)').matches || ('ontouchstart' in window);

  let tip = document.getElementById('ea-ellipsis-tip');
  if (!tip) {
    tip = document.createElement('div');
    tip.id = 'ea-ellipsis-tip';
    Object.assign(tip.style, {
      position: 'fixed',
      left: '50%',
      bottom: '24px',
      transform: 'translateX(-50%)',
      maxWidth: '92vw',
      padding: '10px 12px',
      borderRadius: '10px',
      background: 'rgba(0,0,0,0.85)',
      color: '#fff',
      fontSize: '14px',
      lineHeight: '1.2',
      zIndex: 999999,
      display: 'none'
    });
    document.body.appendChild(tip);
  }

  function show(text) {
    tip.textContent = text;
    tip.style.display = 'block';
    clearTimeout(show._t);
    show._t = setTimeout(() => (tip.style.display = 'none'), 2500);
  }

  document.addEventListener('click', (e) => {
    // Only run on touch devices (or let desktop click work for testing)
    if (!isTouch && !ENABLE_DESKTOP_ELLIPSIS_TEST) return;

    const sel = selectors.join(',');
    const target = e.target.closest(sel);
    if (!target) return;

    // Determine if the element is actually truncated
    const visible = (target.textContent || '').trim();
    const full = (target.dataset.fullText || target.getAttribute('title') || visible).trim();

    const isTruncated =
      visible.endsWith('…') ||
      (target.scrollWidth > target.clientWidth);

    if (isTruncated && full && full !== visible) {
      e.preventDefault();
      e.stopPropagation();
      show(full);
    }
  }, { passive: false });
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

/** Releases both drop-state masks in the same visual commit. */
function releaseInitialDropStatePending() {
  document.querySelector('.drops-params-pending')
    ?.classList.remove('drops-params-pending');
  document.querySelector('.drops-preview-pending')
    ?.classList.remove('drops-preview-pending');
}

const initialDropStateReveal = createInitialRevealBarrier(
  ['parameters', 'redeem-metadata'],
  releaseInitialDropStatePending
);

/** Renders a deliberate terminal fallback if parameter initialization fails. */
function renderDropParamsUnavailable() {
  const selectors = [
    '.drop-details-drop-date-text',
    '.drop-details-drop-time-text',
    '.drop-details-drop-date-countdown-text',
    '.drop-details-drop-date-countdown-text-mobile',
    '.drop-details-burn-amount-text',
    '.drop-details-burn-collection-text',
    '.drop-details-exclusions-text',
    '.drop-details-exclusions-text-none',
    '.drop-details-redeem-amount-text',
    '.drop-details-redeem-token-title-text',
    '.drop-details-redeem-collection-text'
  ];

  selectors.forEach(selector => {
    const el = document.querySelector(selector);
    if (el) el.textContent = '[UNAVAILABLE]';
  });
}

/** Owns the initial parameter render and its one-time pending release. */
function initializeDropParameterRegion() {
  try {
    setEventContractAndTokenAttributes();
    renderDropDetails();

    const countdownTask = startCountdown();
    initialDropStateReveal.markReady('parameters');

    Promise.resolve(countdownTask).catch(error => {
      console.error('Error updating Drops countdown state:', error);
    });
  } catch (error) {
    console.error('Error initializing Drops parameters:', error);
    renderDropParamsUnavailable();
    initialDropStateReveal.markReady('parameters');
  }
}

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

function renderNetworkUnavailable() {
  const spinner = document.querySelector('.drops-page-load-spinner-div');
  const dropsUI = document.querySelector('.drops-ui-div');
  const noDrops = document.querySelector('.no-drops-scheduled-div');
  const exchangeButton = document.querySelector('.event-cart-exchange-button-no-select.w-button');

  if (spinner) spinner.style.display = 'none';
  if (dropsUI) dropsUI.style.display = 'none';
  if (noDrops) {
    noDrops.style.display = 'flex';
    noDrops.textContent = networkUnavailableMessage;
  }
  if (exchangeButton) {
    exchangeButton.textContent = networkUnavailableMessage;
    exchangeButton.setAttribute('aria-disabled', 'true');
    if ('disabled' in exchangeButton) exchangeButton.disabled = true;
  }

  initialDropStateReveal.markReady('parameters');
  initialDropStateReveal.markReady('redeem-metadata');
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

let redeemMetadataCommitted = false;
let redeemImageCommitted = false;
let redeemInitialSupplyCommitted = false;
let redeemInitialSupplyPublishing = false;

/** Returns deliberate metadata values when the configured redeem token is unavailable. */
function getRedeemMetadataUnavailable() {
  return {
    title: '[UNAVAILABLE]',
    collection: '[UNAVAILABLE]',
    editions: '--'
  };
}

/** Replaces an unresolved redeem image with a stable, truthful fallback. */
function renderRedeemImageUnavailable(imgWrap) {
  if (!imgWrap) return;

  imgWrap.querySelector('img.event-cart-redeem-img')?.remove();
  let fallback = imgWrap.querySelector('.event-cart-redeem-image-unavailable');
  if (!fallback) {
    fallback = document.createElement('div');
    fallback.className = 'event-cart-redeem-image-unavailable';
    fallback.textContent = '[IMAGE UNAVAILABLE]';
    Object.assign(fallback.style, {
      alignItems: 'center',
      display: 'flex',
      height: '188px',
      justifyContent: 'center',
      textAlign: 'center',
      width: '150px'
    });
    imgWrap.appendChild(fallback);
  }
}

/** Stages authoritative local metadata before the coordinated Phase 2 reveal. */
function commitInitialRedeemMetadata(container, metadata) {
  if (redeemMetadataCommitted || !container) return;

  const titleEl    = container.querySelector('.collection-item-events-title-text');
  const collEl     = container.querySelector('.collection-item-events-collection-text');
  const editionsEl = container.querySelector('.collection-item-events-editions-text');
  const supplyEl   = container.querySelector('.supply-text-number');

  if (titleEl)    titleEl.textContent    = metadata.title;
  if (collEl)     collEl.textContent     = metadata.collection;
  if (editionsEl) editionsEl.textContent = metadata.editions;
  if (supplyEl)   supplyEl.textContent   = '[PENDING]';

  redeemMetadataCommitted = true;
  initialDropStateReveal.markReady('redeem-metadata');
}

/** Replaces the reserved image substate without holding the rest of Phase 2. */
function commitInitialRedeemImage(imgWrap, spinner, image) {
  if (redeemImageCommitted) return;

  if (imgWrap) {
    imgWrap.querySelector('img.event-cart-redeem-img')?.remove();
    imgWrap.querySelector('.event-cart-redeem-image-unavailable')?.remove();
    if (image.status === 'loaded') {
      imgWrap.appendChild(image.element);
    } else {
      renderRedeemImageUnavailable(imgWrap);
    }
  }

  if (spinner) spinner.style.display = 'none';
  redeemImageCommitted = true;
}

/** Publishes initial supply independently from the image substate. */
function commitInitialRedeemSupply(container, supply) {
  if (redeemInitialSupplyCommitted || !container) return;

  const supplyEl = container.querySelector('.supply-text-number');
  if (supplyEl) supplyEl.textContent = supply.text;
  redeemInitialSupplyCommitted = true;

  // Publish the resolved supply, then reconcile against phase state retained during loading.
  redeemInitialSupplyPublishing = true;
  try {
    if (supply.available) {
      updateAppState({ redeemSupply: supply.value });
    }
  } finally {
    redeemInitialSupplyPublishing = false;
    reconcileRedeemSupplyPolling({ runImmediately: false });
  }
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

async function fetchTokenPairId(burnContractAddress, burnTokenId) {
  return fetchSharedTokenPairId({
    tzktBase: TZKT_BASE,
    escrowAddress: BURN_REDEEM_CONTRACT_ADDRESS,
    burnContractAddress,
    burnTokenId
  });
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
  return buildSharedApprovalOps({
    tzktBase: TZKT_BASE,
    escrowAddress: BURN_REDEEM_CONTRACT_ADDRESS,
    userWalletAddress,
    burnCart
  });
}

// =============================================================================
// HELPERS: ON‑CHAIN POLLING
// =============================================================================

/**
 * Polls the TzKT API for operation confirmation until the transaction is applied or timeout.
 */
async function pollForConfirmation(opHash, timeout = 120000, interval = 5000) {
  return pollForSharedConfirmation({
    tzktBase: TZKT_BASE,
    opHash,
    timeout,
    interval,
    expectedDestination: BURN_REDEEM_CONTRACT_ADDRESS,
    expectedEntrypoint: 'initiate_trade'
  });
}

/**
 * Polls until each traded token’s on‑chain balance has dropped to zero (or timeout).
 */
async function pollForNFTUpdate(address, tradedTokens, timeout = 30000, interval = 3000) {
  return pollForSharedNFTUpdate({
    fetchNFTs,
    address,
    tradedTokens,
    timeout,
    interval,
    refetchOnTimeout: true
  });
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
  renderWalletTokenLoadingState();

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

  // 4) Reset the burn-token panel
  updateEventCartBurnToken();

  const remainingRows = document.querySelectorAll(
    '.events-wallet-ui-div .w-dyn-list [data-token-id]'
  ).length;
  renderConnectedWalletTokenState(remainingRows);
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
  if (!networkConfigAvailable) {
    console.error(networkUnavailableMessage);
    return 0;
  }

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
  if (!redeemInitialSupplyCommitted) return false;

  try {
    const supply = await fetchRedeemSupply();
    const el = document.querySelector('.supply-text-number');
    if (el) {
      el.textContent = 'x' + String(supply).padStart(2, '0');
    }

    updateAppState({ redeemSupply: supply });
    return true;
  } catch (err) {
    console.error('Error polling redeem supply:', err);
    return false;
  }
}

/** Resolves the initial supply without mutating the preview or AppState. */
async function resolveInitialRedeemSupply() {
  try {
    const supply = await fetchRedeemSupply();
    return {
      available: true,
      value: supply,
      text: 'x' + String(supply).padStart(2, '0')
    };
  } catch (error) {
    console.error('Error resolving initial redeem supply:', error);
    return {
      available: false,
      value: null,
      text: '[UNAVAILABLE]'
    };
  }
}

/**
 * Starts a repeated poll (optionally running immediately, then every intervalMs),
 * but only if not already running.
 *
 * @param {number} [intervalMs=10000] How often, in milliseconds, to refresh.
 * @param {boolean} [runImmediately=true] Whether to update before the first interval.
 */
function startRedeemSupplyPolling(intervalMs = 10000, runImmediately = true) {
  if (!redeemInitialSupplyCommitted || redeemSupplyIntervalId != null) return null;
  const initialUpdate = runImmediately ? updateRedeemSupplyDisplay() : null;
  // then every X seconds
  redeemSupplyIntervalId = setInterval(updateRedeemSupplyDisplay, intervalMs);
  return initialUpdate;
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

/** Reconciles the single supply interval against retained phase, supply, and visibility state. */
function reconcileRedeemSupplyPolling({ runImmediately = true } = {}) {
  if (!redeemInitialSupplyCommitted) return;

  const shouldPoll =
    !document.hidden &&
    AppState.countdownPhase === 'live' &&
    AppState.redeemSupply > 0;

  if (shouldPoll) {
    startRedeemSupplyPolling(10000, runImmediately);
  } else {
    stopRedeemSupplyPolling();
  }
}

// Automatically reconcile polling after later phase or supply changes.
subscribeToAppState(() => {
  if (redeemInitialSupplyPublishing) return;
  reconcileRedeemSupplyPolling();
});

// =============================================================================
// HANDLER: EVENTS EXCHANGE FLOW
// =============================================================================

/**
 * Handles the single‐token burn/redeem flow on the Events page.
 */
let eventExchangeInFlight = false;

async function handleEventExchange() {
  if (!networkConfigAvailable) {
    console.error(networkUnavailableMessage);
    showModal('ERROR', networkUnavailableMessage);
    setTimeout(hideModal, 3000);
    return;
  }

  if (eventExchangeInFlight) return;
  eventExchangeInFlight = true;

  // Base URL for block-explorer links
  const EXPLORER_BASE = network === 'mainnet'
    ? 'https://tzkt.io'
    : 'https://shadownet.tzkt.io';
  try {
    logger.log(`🚀 Exchange button clicked! Starting process on ${network}...`);

    // Step 1: Show waiting for wallet confirmation modal
    showModal('PROCESSING...', '[WAITING FOR WALLET CONFIRMATION...]');

    // Ensure wallet is connected
    const activeAccount = await getVerifiedPublicActiveAccount();
    if (!activeAccount) {
      console.error('❌ No wallet connected.');
      showModal('ERROR', '[NO WALLET CONNECTED.]');
      setTimeout(hideModal, 3000);
      return;
    }
    const myAddr = activeAccount.address;
    logger.log('✅ User wallet address:', myAddr);

    // Gather burn-cart items
    const { contractAddress, tokenId, oldBalance } = getSelectedEventTokenWithBalance();
    const burnCart = [{ contractAddress, tokenId, quantity: 1, startingBalance: oldBalance }];
    logger.log('📜 Burn cart:', burnCart);

    // Build or skip operator-approval ops
    const approvalOps = await buildApprovalOps(myAddr, burnCart);
    if (approvalOps.length > 0) {
      logger.log('🚀 Approval operations to include:', approvalOps);
    } else {
      logger.log('✅ All tokens already approved.');
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
    logger.log('✅ Updated burnCart with token_pair_id:', burnCart);

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

    logger.log('🚀 Sending batched approval and trade operations:', JSON.stringify(batchedOps, null, 2));

    // Step 2: Prompt wallet to sign and send
    const opResponse = await window.dAppClient.requestOperation({
      operationDetails: batchedOps
    });
    logger.log('✅ Operation submitted!', opResponse);

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
    const tradedTokens = burnCart.map(item => ({
      contractAddress: item.contractAddress,
      tokenId: item.tokenId,
      quantity: item.quantity,
      startingBalance: item.startingBalance
    }));
    const refreshedNFTs = await pollForNFTUpdate(myAddr, tradedTokens);
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
  } finally {
    eventExchangeInFlight = false;
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
  logger.log("CMS rows grouped by collection:", window.cmsRowsByCollection);
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
    logger.log("Drop name updated to:", el.innerHTML);
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
  if (dateEl) {
    if (!dropDate) {
      dateEl.innerHTML = 'CONFIG ERROR: MISSING DATE';
    } else {
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

  logger.log(
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

  logger.log("Drop exclusions updated:", exclEl?.innerHTML);
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
  logger.log("Drop exclusion list updated:", listEl.innerHTML);
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
  if (!networkConfigAvailable) {
    console.error(networkUnavailableMessage);
    return [];
  }

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
  logger.log("Owned token counts updated.");
}

const WALLET_TOKEN_PENDING_CLASS = 'drops-wallet-tokens-pending';

function getWalletTokenPanes() {
  return ['hen', 'introductions']
    .map(coll => document.querySelector(`.${coll}-collection.w-dyn-list`))
    .filter(Boolean);
}

function clearWalletTokenRows() {
  getWalletTokenPanes().forEach(pane => {
    pane.style.display = 'none';
    while (pane.firstChild) pane.removeChild(pane.firstChild);
  });
}

function setWalletTokenPanesVisible(visible) {
  getWalletTokenPanes().forEach(pane => {
    if (!visible) {
      pane.style.display = 'none';
      return;
    }

    pane.style.display = pane.querySelector('[data-token-id]') ? 'block' : 'none';
  });
}

function setWalletTokenRegionPending(pending) {
  setRegionPending(
    document.querySelector('.events-wallet-ui-div'),
    WALLET_TOKEN_PENDING_CLASS,
    pending
  );
}

function commitWalletTokenRegion({
  headingText = '',
  headingVisible = false,
  spinnerVisible = false,
  noTokensVisible = false,
  rowsVisible = false,
  terminal = false
} = {}) {
  const walletDiv = document.querySelector('.events-wallet-ui-div');
  const heading = document.querySelector('.available-burn-tokens-exchange-text');
  const spinner = document.querySelector('.available-token-ui-loading---events');
  const noTokens = document.querySelector('.no-tokens-in-walet-div---events');

  if (walletDiv) walletDiv.style.visibility = 'visible';

  if (heading) {
    heading.textContent = headingVisible ? headingText : '';
    heading.style.visibility = headingVisible ? 'visible' : 'hidden';
    heading.style.display = headingVisible ? 'block' : 'none';
  }

  if (spinner) spinner.style.display = spinnerVisible ? 'flex' : 'none';
  if (noTokens) noTokens.style.display = noTokensVisible && !spinnerVisible ? 'flex' : 'none';

  setWalletTokenPanesVisible(rowsVisible);

  if (terminal) setWalletTokenRegionPending(false);
}

function renderWalletTokenLoadingState({ clearRows = false } = {}) {
  setWalletTokenRegionPending(true);

  if (clearRows) {
    clearWalletTokenRows();
    renderBalances({});
  } else {
    setWalletTokenPanesVisible(false);
  }

  commitWalletTokenRegion({
    spinnerVisible: true
  });
}

function renderDisconnectedWalletTokenState() {
  displayDefaultTokens();
  renderBalances({});
  commitWalletTokenRegion({
    headingText: 'ELIGIBLE BURN TOKENS',
    headingVisible: true,
    rowsVisible: true,
    terminal: true
  });
}

function renderConnectedWalletTokenState(eligibleCount) {
  commitWalletTokenRegion({
    headingText: 'AVAILABLE BURN TOKENS',
    headingVisible: true,
    noTokensVisible: eligibleCount === 0,
    rowsVisible: eligibleCount > 0,
    terminal: true
  });
}

function renderConnectedWalletTokenFailureState() {
  clearWalletTokenRows();
  renderBalances({});
  commitWalletTokenRegion({
    headingText: 'AVAILABLE BURN TOKENS',
    headingVisible: true,
    terminal: true
  });
}

/**
 * Takes the user's NFTs and re-renders the available token grid.
 * Keeps the grid hidden and spinner visible until everything is ready,
 * then in a single step hides the spinner and shows the grid.
 *
 * @param {Array} nfts - Array of NFT objects.
 */
async function updateTokensWithWalletData(nfts) {
  logger.log("updateTokensWithWalletData called with NFTs:", nfts);

  const prevRow = document.querySelector('.w-checkbox-input.events_checkbox:checked')
    ?.closest('[data-token-id]');
  const prevToken = prevRow?.getAttribute('data-token-id') || null;

  renderWalletTokenLoadingState({ clearRows: true });
  updateEventCartBurnToken();

  ['HEN', 'INTRODUCTIONS'].forEach(coll => {
    const slug = getCollectionSlug(coll);
    const pane = document.querySelector(`.${slug}-collection.w-dyn-list`);
    if (pane) {
      pane.style.display = 'none';
      pane.innerHTML = '';
    }
  });

  const eligible = nfts.filter(nft => {
    const entry = burnTokens.find(t =>
      normalizeString(nft.contractAddress) === normalizeString(collections[t.collection]) &&
      !t.exclude.includes(nft.tokenId) &&
      Number(nft.balance) > 0
    );
    return Boolean(entry);
  });
  logger.log("Eligible NFTs:", eligible);

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

          wrappedRow.setAttribute(
            'data-contract-address',
            collections[key]
          );

          wrappedRow.style.display = "";
          parent.appendChild(wrappedRow);

          logger.log(
            `[DEBUG] Appended row for ${key} token ${testId} in .${slug}-collection (contract=${collections[key]})`
          );
        }
      });
  });

  updateOwnedTokenCounts(nfts);

  if (prevToken) {
    const sel = document.querySelector(
      `.events-wallet-ui-div [data-token-id="${prevToken}"] .w-checkbox-input.events_checkbox`
    );
    if (sel) {
      sel.checked = true;
      updateEventCartBurnToken();
    }
  }

  renderConnectedWalletTokenState(eligible.length);
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
 * Local metadata participates in Phase 2; image and supply retain explicit,
 * independently resolving substates so neither delays the authoritative text.
 */
async function updateEventCartRedeemToken() {
  // 1) Configuration & container
  const cfg       = redeemToken;
  const container = document.querySelector('.event-cart-redeem-token-div-main');
  const spinner = container?.querySelector('.loading-spinner-02-redeem-token')
               || document.querySelector('.loading-spinner-02-redeem-token');
  if (!container) {
    initialDropStateReveal.markReady('redeem-metadata');
    console.warn("Event cart redeem token container not found.");
    return;
  }

  // 2) Spinner setup via helper
  const imgWrap = container.querySelector('.event-cart-burn-token-image-div');
  showRedeemSpinner(imgWrap, spinner);

  try {
    const collection = typeof cfg?.collection === 'string'
      ? cfg.collection.trim()
      : '';
    const tokenId = cfg?.tokenId != null ? String(cfg.tokenId).trim() : '';
    let metadata = getRedeemMetadataUnavailable();
    let row = null;

    if (!collection || !tokenId) {
      console.warn('Redeem token configuration is missing collection or tokenId.');
    } else {
      const key = collection.toUpperCase();
      row = findRedeemRow({ ...cfg, tokenId }, key);
      metadata = resolveRedeemMetadata(row, cfg, key);
    }

    // Start independent work before the visual commit; do not serialize it.
    const imagePromise = resolveRedeemImage(row);
    const supplyPromise = resolveInitialRedeemSupply();

    commitInitialRedeemMetadata(container, metadata);

    await Promise.all([
      imagePromise.then(image => {
        commitInitialRedeemImage(imgWrap, spinner, image);
      }),
      supplyPromise.then(supply => {
        commitInitialRedeemSupply(container, supply);
      })
    ]);
  } catch (error) {
    console.error('Error initializing redeem preview:', error);
    commitInitialRedeemMetadata(container, getRedeemMetadataUnavailable());
    commitInitialRedeemImage(
      imgWrap,
      spinner,
      { status: 'unavailable', element: null }
    );
    commitInitialRedeemSupply(
      container,
      { available: false, value: null, text: '[UNAVAILABLE]' }
    );
  }
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
 * Resolves title, collection, and edition-count values without mutating the preview.
 *
 * @param {Element|null} row  The matched CMS row or null.
 * @param {{redeemAmount:string, totalSupply:number}} cfg
 * @param {string} key  Uppercase collection key.
 * @returns {{title:string, collection:string, editions:string}}
 */
function resolveRedeemMetadata(row, cfg, key) {
  const editions = row?.querySelector('.collection-item-editions-text-number')?.textContent.trim()
    || (cfg?.redeemAmount != null ? String(cfg.redeemAmount).trim() : '');
  let title = row?.querySelector('.collection-item-title-text')?.textContent.trim() || '';

  if (
    !row ||
    !title ||
    !key ||
    !editions
  ) {
    return getRedeemMetadataUnavailable();
  }

  if (title.length > 12) title = title.slice(0,12) + '...';
  return { title, collection: key, editions };
}

/**
 * Resolves the redeem image off-DOM into a loaded element or unavailable result.
 *
 * @param {Element|null} row   The matched CMS row or null.
 * @returns {Promise<{status:string, element:Element|null}>}
 */
function resolveRedeemImage(row) {
  if (!row) {
    console.warn('No matching CMS row for redeem token.');
    return Promise.resolve({ status: 'unavailable', element: null });
  }

  const cmsImg = row.querySelector('.collection-item-image-div img');
  if (!cmsImg?.src) {
    console.warn('Redeem token image is unavailable.');
    return Promise.resolve({ status: 'unavailable', element: null });
  }

  return new Promise(resolve => {
    const pre = new Image();
    pre.width    = 150;
    pre.height   = 188;
    pre.alt      = row.querySelector('.collection-item-title-text')?.textContent.trim() || '';
    pre.className = 'event-cart-redeem-img';
    pre.style.visibility = 'hidden';

    pre.onload = () => {
      pre.style.visibility = 'visible';
      logger.log('Event cart redeem token image loaded:', cmsImg.src);
      resolve({ status: 'loaded', element: pre });
    };
    pre.onerror = () => {
      console.warn('Redeem token image failed to load:', cmsImg.src);
      resolve({ status: 'unavailable', element: null });
    };

    if (cmsImg.srcset) pre.srcset = cmsImg.srcset;
    pre.src = cmsImg.src;
  });
}

/**
 * Shows every CMS row in each burn-token list (pre-wallet UI).
 * Hides the wallet-token spinner once the rows are back in the DOM.
 */
function displayDefaultTokens() {
  logger.log("Displaying default tokens.");
  ['hen','introductions'].forEach(coll => {
    const pane = document.querySelector(`.${coll}-collection.w-dyn-list`);
    if (!pane) return;
    pane.style.display = 'none';
    while (pane.firstChild) pane.removeChild(pane.firstChild);
    const rows = window.cmsRowsByCollection?.[coll.toUpperCase()] || [];
    rows.forEach(row => {
      const wrapped = wrapTokenRow(buildEventTokenRow(row, row.dataset.tokenId), coll.toUpperCase());
      wrapped.style.display = "";
      pane.appendChild(wrapped);
    });
  });
}

// =============================================================================
// COUNTDOWN & CONTRACT UNPAUSE
// =============================================================================

/**
 * Polls the escrow contract’s storage until its `paused` flag flips to false,
 * then re-fetches & re-renders the user's NFTs.
 */
async function pollForUnpause(contractAddress, interval = 3000, onPauseStatus) {
  if (!networkConfigAvailable) {
    console.error(networkUnavailableMessage);
    return;
  }

  // entering standby-polling: mark on-chain paused
  updateAppState({ contractPaused: true });

  logger.log(`[pollForUnpause] polling ${contractAddress} every ${interval}ms`);
  let attempt = 0;
  while (true) {
    attempt++;
    logger.log(`[pollForUnpause] attempt #${attempt}`);
    try {
      const res = await fetch(
        `${TZKT_BASE}/v1/contracts/${contractAddress}/storage`
      );
      const storage = await res.json();
      logger.log(`[pollForUnpause] paused =`, storage.paused);

      const paused = typeof storage.paused === 'boolean' ? storage.paused : null;
      onPauseStatus?.(paused);

      if (paused === false) {
        logger.log("[pollForUnpause] detected unpause!");
        updateAppState({ contractPaused: false });

        if (AppState.walletConnected) {
          const account = AppState.activeAccount;
          if (account) {
            const nfts = await fetchNFTs(account.address);
            if (AppState.activeAccount?.address !== account.address) return;
            await updateTokensWithWalletData(nfts);
          }
        }
        return;
      }
    } catch (err) {
      console.error(`[pollForUnpause] fetch error:`, err);
      onPauseStatus?.(null);
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
  const countdownElMobile = document.querySelector('.drop-details-drop-date-countdown-text-mobile');

  // Helper: write the exact same text to both (if present)
  function setCountdownText(text) {
    if (countdownEl) countdownEl.textContent = text;
    if (countdownElMobile) countdownElMobile.textContent = text;
    applyEllipsis();
  }

  // If neither element exists, bail early
  if (!countdownEl && !countdownElMobile) {
    console.warn("[startCountdown] Missing elements or config; aborting.");
    return;
  }

  if (!dropDate || !dropTime) {
    const msg = 'CONFIG ERROR: MISSING DATE/TIME';
    console.warn('[startCountdown] Missing elements or config; aborting.');
    setCountdownText(msg);
    updateAppState({
      countdownPhase:   'config-error',
      currentCountdown: msg
    });
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
    if (result.error === 'BAD_TZ')           msg = "CONFIG ERROR: BAD TZ";
    else if (result.error === 'BAD_DATE')    msg = "CONFIG ERROR: BAD DATE/TIME";
    else if (result.error === 'BAD_DATE_TZ') msg = "CONFIG ERROR: BAD DATE/TZ";

    setCountdownText(msg);
    updateAppState({
      countdownPhase:   'config-error',
      currentCountdown: msg
    });
    return;
  }

  const dropDateTime = result.date;
  logger.log("[startCountdown] Drop date/time:", dropDateTime);

  // initial phase = pre
  updateAppState({ countdownPhase: 'pre', currentCountdown: '00:00:00' });

  // if already past drop → immediately standby + poll
  if (new Date() >= dropDateTime) {
    logger.log("[startCountdown] Past drop time; entering standby immediately");
    updateAppState({ countdownPhase: 'standby' });
    setCountdownText("STANDBY…");

    return new Promise(resolveInitialStatus => {
      let initialStatusResolved = false;
      let receivedPauseStatus = false;
      const resolveOnce = () => {
        if (initialStatusResolved) return;
        initialStatusResolved = true;
        resolveInitialStatus();
      };

      pollForUnpause(BURN_REDEEM_CONTRACT_ADDRESS, 3000, paused => {
        if (paused === true) {
          receivedPauseStatus = true;
          setCountdownText('STANDBY…');
          resolveOnce();
        } else if (paused == null && !receivedPauseStatus) {
          setCountdownText('STATUS UNAVAILABLE');
          resolveOnce();
        }
      })
        .then(() => {
          logger.log('[startCountdown] Unpaused → LIVE');
          setCountdownText('LIVE NOW!');
          updateAppState({ countdownPhase: 'live', currentCountdown: 'LIVE NOW!' });
          resolveOnce();
        })
        .catch(err => {
          console.error('[startCountdown] pollForUnpause error:', err);
          setCountdownText('STATUS UNAVAILABLE');
          resolveOnce();
        });
    });
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

      logger.log("[startCountdown] Hit zero → entering standby");
      updateAppState({ countdownPhase: 'standby' });
      setCountdownText("STANDBY…");

      pollForUnpause(BURN_REDEEM_CONTRACT_ADDRESS)
        .then(() => {
          logger.log("[startCountdown] Unpaused → LIVE");
          setCountdownText("LIVE NOW!");
          updateAppState({ countdownPhase: 'live', currentCountdown: 'LIVE NOW!' });
        })
        .catch(err => console.error("[startCountdown] pollForUnpause error:", err));
      return;
    }

    // still pre-drop: update "DAYS • HH:MM:SS" / "TODAY • HH:MM:SS" / "0 DAYS • HH:MM:SS"
    const now      = new Date();
    const totalSec = Math.floor(diffMs / 1000);

    let s      = totalSec;
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
      labelPart = (days === 1) ? '1 DAY' : `${days} DAYS`;
    } else {
      labelPart = sameLocalDay ? 'TODAY' : '0 DAYS';
    }

    const timePart  = `${hh}:${mm}:${ss}`;
    const formatted = `${labelPart} • ${timePart}`;

    setCountdownText(formatted);

    // If you already switched to storing the formatted label+time for the exchange hover,
    // keep it consistent here:
    updateAppState({ currentCountdown: formatted });
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

  // Smaller font only when we're showing the long pre-drop countdown on hover
  const showingPreCountdown =
    isHover &&
    state.countdownPhase === 'pre' &&
    state.walletConnected &&
    state.selectedTokenId;

  if (showingPreCountdown) {
    btn.style.fontSize = '18px';
    btn.style.lineHeight = '1';          // important: prevents extra vertical slack
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';      // vertical center
    btn.style.justifyContent = 'center';  // horizontal center
  } else {
    btn.style.removeProperty('font-size');
    btn.style.removeProperty('line-height');
    btn.style.removeProperty('display');
    btn.style.removeProperty('align-items');
    btn.style.removeProperty('justify-content');
  }

  // —— pulse logic, now respecting the `pulse` flag even when sold-out ——
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
    logger.log('👆 Hover exchange:', {
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

let synchronizedWalletAddress;
let walletRefreshGeneration = 0;
let dropsWalletSyncReady = false;
let pendingPublicWalletState = null;

/**
 * Called when a wallet is connected. Updates AppState,
 * clears any old checkbox selection so we never briefly
 * re-create a selectedTokenId, then resets the UI.
 */
function handleWalletConnected(account) {
  logger.log("Wallet connected; resetting burn-token display to loading state.");

  updateAppState({ activeAccount: account });

  document
    .querySelectorAll('.w-checkbox-input.events_checkbox:checked')
    .forEach(cb => { cb.checked = false; });

  updateAppState({
    walletConnected: true,
    selectedTokenId: null
  });

  updateEventCartBurnToken();
  renderWalletTokenLoadingState({ clearRows: true });
}

/**
 * Called when a wallet is disconnected. Clears AppState, resets all UI,
 * and switches headers/buttons back to their disconnected defaults.
 */
function handleWalletDisconnected() {
  logger.log("Wallet disconnected; restoring default tokens and clearing selections.");

  updateAppState({
    activeAccount: null,
    walletConnected: false,
    selectedTokenId: null
  });

  if (AppState.exchangeButtonInterval) {
    clearInterval(AppState.exchangeButtonInterval);
    updateAppState({ exchangeButtonInterval: null });
  }

  document.querySelectorAll('.w-checkbox-input.events_checkbox')
    .forEach(cb => cb.checked = false);

  updateEventCartBurnToken();
  renderDisconnectedWalletTokenState();

  const exchBtn = document.querySelector('.event-cart-exchange-button-no-select.w-button');
  if (exchBtn) exchBtn.textContent = 'EXCHANGE';
}

async function refreshDropsWallet(account, generation, nftsPromise) {
  try {
    const nfts = await (nftsPromise || fetchNFTs(account.address));

    if (!isCurrentWalletProjection({
      generation,
      address: account.address,
      currentGeneration: walletRefreshGeneration,
      currentAddress: synchronizedWalletAddress
    })) {
      return;
    }

    await updateTokensWithWalletData(nfts);
  } catch (error) {
    if (isCurrentWalletProjection({
      generation,
      address: account.address,
      currentGeneration: walletRefreshGeneration,
      currentAddress: synchronizedWalletAddress
    })) {
      console.error('Error refreshing Drops wallet state:', error);
      renderConnectedWalletTokenFailureState();
      updateEventCartBurnToken();
    }
  }
}

function synchronizeDropsWalletState(walletState) {
  if (!walletState || walletState.status === 'pending') {
    synchronizedWalletAddress = undefined;
    walletRefreshGeneration++;
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
    handleWalletDisconnected();
    return;
  }

  handleWalletConnected(account);
  void refreshDropsWallet(account, generation, walletState.nftsPromise);
}

function receivePublicWalletState(walletState) {
  if (!dropsWalletSyncReady) {
    pendingPublicWalletState = walletState;
    return;
  }

  synchronizeDropsWalletState(walletState);
}

document.addEventListener(PUBLIC_WALLET_STATE_EVENT, event => {
  receivePublicWalletState(event.detail);
});

// =============================================================================
// INITIALIZATION & EVENT BINDING
// =============================================================================

async function bootDropsPage() {
  // Guard: prevent double-boot (double event binding) if the module is ever loaded twice.
  // This should be a no-op in the normal case (single load).
  if (window.__EA_DROPS_BOOTED__) return;
  window.__EA_DROPS_BOOTED__ = true;

  if (!networkConfigAvailable) {
    renderNetworkUnavailable();
    return;
  }

  // 0) Drop-schedule early gate (page-level)
  //     - Hides .drops-page-load-spinner-div
  //     - Shows either .drops-ui-div or .no-drops-scheduled-div
  //     - Returns early if no drop is scheduled
  if (!applyDropScheduledGate()) {
    initialDropStateReveal.markReady('parameters');
    initialDropStateReveal.markReady('redeem-metadata');
    return;
  }

  // 0a) Preload our flame-animation GIFs so toggles are instant
  preloadFlameIcons();

  // 0b) Ensure unresolved wallet-token and redeem regions start in pending-safe states.
  const redeemSpinner = document.querySelector('.loading-spinner-02-redeem-token');
  if (redeemSpinner) redeemSpinner.style.display = 'block';
  renderWalletTokenLoadingState();

  // 1) Capture default “add token” markup for resets
  const addDiv = document.querySelector('.event-cart-add-token-text-div');
  if (addDiv) defaultAddTokenMarkup = addDiv.innerHTML;

  // 2-3) Build the CMS lookup, render details, and release pending when coherent
  initializeDropParameterRegion();

  // 4) Populate and coherently release the Redeem-Token preview panel
  void updateEventCartRedeemToken();

  // 4a) Ensure redeem-token panel sits above the (empty) burn-token panel
  const redeemPanel = document.querySelector('.event-cart-redeem-token-div-main');
  if (redeemPanel) redeemPanel.style.zIndex = '10';

  // 5) Wire up checkboxes & exchange-button handlers
  setupExclusiveCheckboxesWallet();
  attachExchangeButtonHandlers();

  // 6a) 🔥 Re-hook exchange button state machine (labels/colors/pulse/clickAction)
  subscribeToAppState(updateExchangeButtonState);
  updateExchangeButtonState(AppState); // initial sync (subscribers don't auto-run on subscribe)

  // 7) Ellipsis on resize/orientation (and tap-to-reveal on touch devices)
  applyEllipsis();

  enableTapToRevealEllipsis([
    '.drop-details-burn-collection-text',
    '.drop-details-redeem-token-title-text',
    '.drop-details-drop-date-text',
    '.drop-details-drop-time-text',
    '.drop-details-drop-date-countdown-text-mobile',
    '.drop-details-exclusions-text-none',
    '.drop-details-burn-amount-text',
    '.drop-details-redeem-amount-text'
  ]);

  window.addEventListener('resize', applyEllipsis);
  window.addEventListener('orientationchange', applyEllipsis);

  // 8) Sync exchange-button and countdown state
  subscribeToAppState(({ countdownPhase, redeemSupply }) => {
    const els = [
      document.querySelector('.drop-details-drop-date-countdown-text'),
      document.querySelector('.drop-details-drop-date-countdown-text-mobile')
    ].filter(Boolean);

    if (!els.length) return;

    if (countdownPhase === 'live' && redeemSupply === 0) {
      els.forEach(el => {
        el.textContent = 'SOLD OUT!';
        el.classList.remove('standby-anim');
      });
    } else {
      const pulse = countdownPhase === 'standby' || countdownPhase === 'live';
      els.forEach(el => {
        el.classList.toggle('standby-anim', pulse);
      });
    }
  });

  // 8b) Reflect disabled state accessibly (do NOT block hover with pointer-events)
  // Note: updateExchangeButtonState already handles click gating + cursor via clickAction.
  subscribeToAppState(({ exchangeDisabled }) => {
    const btn = document.querySelector('.event-cart-exchange-button-no-select.w-button');
    if (!btn) return;

    btn.setAttribute('aria-disabled', exchangeDisabled ? 'true' : 'false');

    // Only apply native disabled when the element actually supports it.
    const tag = (btn.tagName || '').toUpperCase();
    if (tag === 'BUTTON' || tag === 'INPUT') {
      btn.disabled = !!exchangeDisabled;
    }
  });

  // 9) Flame-icon hookup
  subscribeToAppState(updateFlames);
  updateFlames();  // initial sync
  window.addEventListener('resize', updateFlames);
  window.addEventListener('orientationchange', updateFlames);

  // 10) Resolve wallet-dependent state from the shared verified lifecycle.
  dropsWalletSyncReady = true;
  const initialWalletState = pendingPublicWalletState || getPublicWalletState();
  pendingPublicWalletState = null;
  receivePublicWalletState(initialWalletState);

  // 11) Reconcile redeem-supply polling on page visibility
  document.addEventListener('visibilitychange', () => {
    reconcileRedeemSupplyPolling();
  });

  // — no spinner toggles here any more — each spinner hides itself in its success path —
}

// IMPORTANT: loader + dynamic import() can execute after DOMContentLoaded has already fired.
// This ensures we still boot in that case.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => { void bootDropsPage(); });
} else {
  void bootDropsPage();
}
