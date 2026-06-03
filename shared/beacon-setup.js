// =============================================================================
// SHARED: Beacon SDK Setup
// =============================================================================

import { DAppClient, NetworkType, BeaconEvent, Regions } from '@airgap/beacon-sdk';
import cfg from './network.js';
import { createPublicLogger } from './public-logger.js';

const { network, tzkt, getCurrentPublicNetworkConfig } = cfg;
const DEBUG = true;
const logger = createPublicLogger({ enabled: DEBUG, scope: 'wallet' });

const BEACON_NODE_URLS = [
'beacon-node-1.diamond.papers.tech'
];

const BEACON_MATRIX_NODES = Object.fromEntries(
Object.values(Regions).map((region) => [region, BEACON_NODE_URLS])
);

const currentNetworkConfig = getCurrentPublicNetworkConfig?.() || null;

const beaconNetwork = currentNetworkConfig?.beaconNetwork || null;

// ----------------------------------------------------------------------------
// Resolve Beacon network type
//
// Public app-level "testnet" currently maps to native Beacon Shadownet through
// shared/chain-registry.js. Beacon SDK 4.6.4 exports NetworkType.SHADOWNET.
// ----------------------------------------------------------------------------
function getClientNetwork() {
if (beaconNetwork === 'mainnet') {
return { type: NetworkType.MAINNET };
}

if (beaconNetwork === 'shadownet') {
return { type: NetworkType.SHADOWNET };
}

throw new Error(`Unsupported Beacon network for ${network}: ${beaconNetwork}`);
}

function logBeaconError(error) {
console.error('Error connecting to wallet:', error);
console.error('Beacon error name:', error?.name);
console.error('Beacon error title:', error?.title);
console.error('Beacon error message:', error?.message);
console.error('Beacon error description:', error?.description);
console.error('Beacon error data:', error?.data);
console.error('Beacon error stack:', error?.stack);

try {
console.error(
'Beacon error full JSON:',
JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
);
} catch (jsonError) {
console.error('Beacon error could not be JSON-stringified:', jsonError);
}

if (error?.errorType) {
console.error('Beacon error type:', error.errorType);
}

if (error?.cause) {
console.error('Beacon error cause:', error.cause);
}
}

const clientNetwork = getClientNetwork();

// ----------------------------------------------------------------------------
// Initialize or reuse the Beacon client
// ----------------------------------------------------------------------------
logger.log('Beacon matrix nodes override:', JSON.stringify(BEACON_MATRIX_NODES));

if (!window.dAppClient) {
logger.log('Initializing Beacon DAppClient on network:', network);
logger.log('Beacon network:', beaconNetwork);
logger.log('Beacon client network:', JSON.stringify(clientNetwork));

window.dAppClient = new DAppClient({
name: 'eatacid.xyz',
network: clientNetwork,
matrixNodes: BEACON_MATRIX_NODES
});
} else {
logger.log('Reusing existing Beacon DAppClient on network:', network);
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

const connectButton =
allConnect.find(btn =>
btn.textContent.trim().toLowerCase().includes('connect')
) ||
allConnect[0] ||
null;

const connectedButton = document.querySelector(
'.button-primary.connected-state.w-button'
);

const disconnectButton = document.querySelector(
'.button-primary.disconnect-hover.w-button'
);

return {
connectButton,
connectedButton,
disconnectButton
};
}

// ----------------------------------------------------------------------------
// Fetch NFT Balances
// ----------------------------------------------------------------------------
async function fetchNFTs(address) {
logger.log('Fetching NFTs for wallet address:', address);

const baseUrl = tzkt[network];

if (!baseUrl) {
console.error(`Missing TzKT base URL for network: ${network}`);
return [];
}

const apiUrl =
`${baseUrl}/v1/tokens/balances` +
`?account=${address}` +
`&token.standard=fa2`;

try {
const response = await fetch(apiUrl);

if (!response.ok) {
  const body = await response.text().catch(() => '');

  throw new Error(
    `TzKT request failed ${response.status}: ${apiUrl}` +
    `${body ? `\n${body}` : ''}`
  );
}

const nfts = await response.json();

logger.log(`NFTs fetched from ${network}:`, nfts);

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
if (
lastButtonState.status === status &&
lastButtonState.address === address
) {
return;
}

lastButtonState = {
status,
address
};

const {
connectButton,
connectedButton,
disconnectButton
} = getWalletButtons();

[connectButton, connectedButton, disconnectButton].forEach(btn => {
if (btn) btn.style.display = 'none';
});

if (status === 'connected' && address) {
setTimeout(() => {
if (connectedButton) {
connectedButton.style.display = 'inline-block';
connectedButton.textContent =
`${address.slice(0, 3)}...${address.slice(-4)}`;

    connectedButton.onmouseover = () => {
      connectedButton.style.display = 'none';

      if (disconnectButton) {
        disconnectButton.style.display = 'inline-block';
      }
    };
  }

  if (disconnectButton) {
    disconnectButton.onmouseout = () => {
      disconnectButton.style.display = 'none';

      if (connectedButton) {
        connectedButton.style.display = 'inline-block';
      }
    };
  }

  if (window.appState) {
    window.appState.isConnected = true;
  }
}, 100);

return;

}

if (connectButton) {
connectButton.style.display = 'inline-block';
}

[connectedButton, disconnectButton].forEach(btn => {
if (btn) {
btn.onmouseover = null;
btn.onmouseout = null;
}
});

if (window.appState) {
window.appState.isConnected = false;
}
}

// ----------------------------------------------------------------------------
// Connect / Disconnect Flows
// ----------------------------------------------------------------------------
async function connectWallet() {
try {
logger.log(
'Requesting wallet permissions using constructor network:',
JSON.stringify(clientNetwork)
);

await dAppClient.requestPermissions();

// UI update and fetching NFTs are handled in the subscription callback.

} catch (error) {
logBeaconError(error);
}
}

async function disconnectWallet() {
try {
logger.log('Disconnecting wallet...');

await dAppClient.clearActiveAccount();

logger.log('Wallet disconnected.');

if (typeof resetUI === 'function') {
  resetUI();
}

updateButtonState('unconnected');

document.dispatchEvent(
  new Event('walletDisconnected')
);

} catch (error) {
console.error('Error disconnecting wallet:', error);
}
}

// ----------------------------------------------------------------------------
// Subscribe to account change events
// ----------------------------------------------------------------------------
dAppClient.subscribeToEvent(
BeaconEvent.ACTIVE_ACCOUNT_SET,
async account => {
if (account) {
logger.log(
`${BeaconEvent.ACTIVE_ACCOUNT_SET} triggered:`,
account.address
);

  await fetchNFTs(account.address);

  updateButtonState('connected', account.address);
  return;
}

logger.log('No active account detected via subscription.');

updateButtonState('unconnected');

}
);

// ----------------------------------------------------------------------------
// Initialize (safe for loader + dynamic import timing)
// ----------------------------------------------------------------------------
async function bootWalletButtons() {
// Guard against double-binding if this module is ever evaluated twice.
if (window.__EA_WALLET_BUTTONS_BOOTED__) {
return;
}

window.__EA_WALLET_BUTTONS_BOOTED__ = true;

logger.log('bootWalletButtons â†’ initializing wallet buttons');

const {
connectButton,
connectedButton,
disconnectButton
} = getWalletButtons();

updateButtonState('unconnected');

const activeAccount = await dAppClient.getActiveAccount();

if (activeAccount) {
logger.log('Active account on load:', activeAccount.address);

// Flip UI immediately. Do not wait for NFT fetch.
updateButtonState('connected', activeAccount.address);

// Fetch NFTs in the background.
fetchNFTs(activeAccount.address).catch(err => {
  console.error('Error fetching NFTs after connect:', err);
});

}

connectButton?.addEventListener('click', connectWallet);
connectedButton?.addEventListener('click', disconnectWallet);
disconnectButton?.addEventListener('click', disconnectWallet);
}

if (document.readyState === 'loading') {
document.addEventListener('DOMContentLoaded', () => {
void bootWalletButtons();
});
} else {
void bootWalletButtons();
}

