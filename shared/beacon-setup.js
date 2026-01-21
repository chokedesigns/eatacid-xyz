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
// Helper: Get wallet button elements
// ----------------------------------------------------------------------------
function getWalletButtons() {
  const allConnect = Array.from(document.querySelectorAll('.button-primary.w-button'));
  const connectButton = allConnect.find(btn =>
    btn.textContent.trim().toLowerCase().includes('connect')
  ) || allConnect[0] || null;

  const connectedButton = document.querySelector('.button-primary.connected-state.w-button');
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
// Wallet Button UI Management
// ----------------------------------------------------------------------------
function updateButtonState(status, address = null) {
  if (lastButtonState.status === status && lastButtonState.address === address) {
    return;
  }
  lastButtonState = { status, address };

  const { connectButton, connectedButton, disconnectButton } = getWalletButtons();
  [connectButton, connectedButton, disconnectButton].forEach(btn => btn && (btn.style.display = 'none'));

  if (status === 'connected' && address) {
    setTimeout(() => {
      if (connectedButton) {
        connectedButton.style.display = 'inline-block';
        connectedButton.textContent = `${address.slice(0,3)}...${address.slice(-4)}`;
        connectedButton.onmouseover = () => {
          connectedButton.style.display = 'none';
          if (disconnectButton) disconnectButton.style.display = 'inline-block';
        };
      }
      if (disconnectButton) {
        disconnectButton.onmouseout = () => {
          disconnectButton.style.display = 'none';
          if (connectedButton) connectedButton.style.display = 'inline-block';
        };
      }
      window.appState && (window.appState.isConnected = true);
    }, 100);
  } else {
    connectButton && (connectButton.style.display = 'inline-block');
    [connectedButton, disconnectButton].forEach(btn => btn && (btn.onmouseover = btn.onmouseout = null));
    window.appState && (window.appState.isConnected = false);
  }
}

// ----------------------------------------------------------------------------
// Connect / Disconnect Flows
// ----------------------------------------------------------------------------
async function connectWallet() {
  try {
    await dAppClient.requestPermissions();
    // UI update and fetching NFTs are handled in the subscription callback
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
// Subscribe to account change events
// ----------------------------------------------------------------------------
dAppClient.subscribeToEvent(BeaconEvent.ACTIVE_ACCOUNT_SET, async account => {
  if (account) {
    console.log(`${BeaconEvent.ACTIVE_ACCOUNT_SET} triggered:`, account.address);
    await fetchNFTs(account.address);
    updateButtonState('connected', account.address);
  } else {
    console.log('No active account detected via subscription.');
    updateButtonState('unconnected');
  }
});

// ----------------------------------------------------------------------------
// Initialize (safe for loader + dynamic import timing)
// ----------------------------------------------------------------------------
async function bootWalletButtons() {
  // Guard against double-binding if this module is ever evaluated twice
  if (window.__EA_WALLET_BUTTONS_BOOTED__) return;
  window.__EA_WALLET_BUTTONS_BOOTED__ = true;

  console.log('bootWalletButtons → initializing wallet buttons');
  const { connectButton, connectedButton, disconnectButton } = getWalletButtons();

  updateButtonState('unconnected');

  const activeAccount = await dAppClient.getActiveAccount();
  if (activeAccount) {
    console.log('Active account on load:', activeAccount.address);
    await fetchNFTs(activeAccount.address);
    updateButtonState('connected', activeAccount.address);
  }

  connectButton?.addEventListener('click', connectWallet);
  connectedButton?.addEventListener('click', disconnectWallet);
  disconnectButton?.addEventListener('click', disconnectWallet);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { void bootWalletButtons(); });
} else {
  void bootWalletButtons();
}