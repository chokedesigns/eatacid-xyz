// =============================================================================
// SHARED: Beacon SDK Setup
// =============================================================================

import { DAppClient, NetworkType, BeaconEvent } from '@airgap/beacon-sdk';
import cfg from './network.js';
const { network, tzkt } = cfg;

// ----------------------------------------------------------------------------
// Initialize or reuse the Beacon client
// ----------------------------------------------------------------------------
if (!window.dAppClient) {
  console.log('Initializing Beacon DAppClient on network:', network);
  window.dAppClient = new DAppClient({
    name: 'eatacid.xyz',
    preferredNetwork:
      network === 'mainnet' ? NetworkType.MAINNET : NetworkType.GHOSTNET
  });
} else {
  console.log('Reusing existing Beacon DAppClient on network:', network);
}
const dAppClient = window.dAppClient;

// ----------------------------------------------------------------------------
// State guard to prevent duplicate UI updates
// ----------------------------------------------------------------------------
let lastButtonState = { status: null, address: null };

// ----------------------------------------------------------------------------
// Helper: Get wallet button elements (explicit selectors; no text sniffing)
// ----------------------------------------------------------------------------
function getWalletButtons() {
  // The plain "Connect" button is the primary style WITHOUT the state mods
  const connectButton = document.querySelector(
    '.button-primary.w-button:not(.connected-state):not(.disconnect-hover)'
  );

  const connectedButton  = document.querySelector('.button-primary.connected-state.w-button');
  const disconnectButton = document.querySelector('.button-primary.disconnect-hover.w-button');

  return { connectButton, connectedButton, disconnectButton };
}

// ----------------------------------------------------------------------------
// Fetch NFT Balances
// ----------------------------------------------------------------------------
async function fetchNFTs(address) {
  console.log('Fetching NFTs for wallet address:', address);
  const apiUrl = `${tzkt[network]}/v1/tokens/balances?account=${address}&token.standard=fa2`;
  try {
    const response = await fetch(apiUrl);
    const nfts = await response.json();
    console.log(`NFTs fetched from ${network}:`, nfts);
    return nfts.map(nft => ({
      tokenId: nft.token.tokenId,
      contractAddress: nft.token.contract.address,
      balance: nft.balance
    }));
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    return [];
  }
}
window.fetchNFTs = fetchNFTs;

// ----------------------------------------------------------------------------
// Wallet Button UI Management (atomic; no blank-frame gap)
// ----------------------------------------------------------------------------
function updateButtonState(status, address = null) {
  // Avoid redundant writes
  if (lastButtonState.status === status && lastButtonState.address === address) return;
  lastButtonState = { status, address };

  const { connectButton, connectedButton, disconnectButton } = getWalletButtons();

  if (status === 'connected' && address) {
    // Show CONNECTED immediately
    if (connectedButton) {
      connectedButton.textContent = `${address.slice(0, 3)}...${address.slice(-4)}`;
      connectedButton.style.display = 'inline-block';
      connectedButton.onmouseover = () => {
        connectedButton.style.display = 'none';
        if (disconnectButton) disconnectButton.style.display = 'inline-block';
      };
    }

    // Hide DISCONNECT except on hover
    if (disconnectButton) {
      disconnectButton.style.display = 'none';
      disconnectButton.onmouseout = () => {
        disconnectButton.style.display = 'none';
        if (connectedButton) connectedButton.style.display = 'inline-block';
      };
    }

    // Hide CONNECT last (no intermediate blank)
    if (connectButton) connectButton.style.display = 'none';

    if (window.appState) window.appState.isConnected = true;
  } else {
    // Unconnected state: show CONNECT, hide others
    if (connectButton) connectButton.style.display = 'inline-block';
    if (connectedButton) {
      connectedButton.style.display = 'none';
      connectedButton.onmouseover = null;
    }
    if (disconnectButton) {
      disconnectButton.style.display = 'none';
      disconnectButton.onmouseout = null;
    }
    if (window.appState) window.appState.isConnected = false;
  }
}

// ----------------------------------------------------------------------------
// Connect / Disconnect Flows
// ----------------------------------------------------------------------------
async function connectWallet() {
  try {
    await dAppClient.requestPermissions();
    // UI + fetch handled by subscription
  } catch (error) {
    console.error('Error connecting to wallet:', error);
  }
}

async function disconnectWallet() {
  try {
    console.log('Disconnecting wallet...');
    await dAppClient.clearActiveAccount();
    console.log('Wallet disconnected.');
    typeof resetUI === 'function' && resetUI();
    updateButtonState('unconnected');
    document.dispatchEvent(new Event('walletDisconnected'));
  } catch (error) {
    console.error('Error disconnecting wallet:', error);
  }
}

// ----------------------------------------------------------------------------
// Subscribe to account change events (UI first, fetch after)
// ----------------------------------------------------------------------------
dAppClient.subscribeToEvent(BeaconEvent.ACTIVE_ACCOUNT_SET, account => {
  if (account) {
    console.log(`${BeaconEvent.ACTIVE_ACCOUNT_SET} triggered:`, account.address);
    // UI immediately
    updateButtonState('connected', account.address);
    // Data after (no UI block)
    fetchNFTs(account.address).catch(err => console.error('Error fetching NFTs:', err));
  } else {
    console.log('No active account detected via subscription.');
    updateButtonState('unconnected');
  }
});

// ----------------------------------------------------------------------------
// Initialize on DOMContentLoaded
//  - Immediately set a stable default BEFORE any awaits
//  - Then resolve active account and adjust state without flashing
// ----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOMContentLoaded → initializing wallet buttons');
  const { connectButton, disconnectButton, connectedButton } = getWalletButtons();

  // 1) Stable default (no await): CONNECT visible, others hidden
  if (connectButton)   connectButton.style.display   = 'inline-block';
  if (connectedButton) connectedButton.style.display = 'none';
  if (disconnectButton)disconnectButton.style.display= 'none';

  // 2) Wire clicks
  connectButton?.addEventListener('click', connectWallet);
  disconnectButton?.addEventListener('click', disconnectWallet);

  // 3) Resolve active account and flip if needed (UI-first; fetch later)
  try {
    const activeAccount = await dAppClient.getActiveAccount();
    if (activeAccount) {
      console.log('Active account on load:', activeAccount.address);
      updateButtonState('connected', activeAccount.address);
      fetchNFTs(activeAccount.address).catch(console.error);
    }
  } catch (err) {
    console.warn('getActiveAccount failed:', err);
  }
});
