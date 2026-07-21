// =============================================================================
// SHARED: Beacon SDK Setup
// =============================================================================

import { DAppClient, NetworkType, BeaconEvent } from '@airgap/beacon-sdk';
import cfg from './network.js';
import { createPublicLogger } from './public-logger.js';

const { network, tzkt, getCurrentPublicNetworkConfig } = cfg;
const DEBUG = false;
const logger = createPublicLogger({ enabled: DEBUG, scope: 'wallet' });

const BEACON_SDK_VERSION_KEY = 'beacon:sdk_version';
// Beacon SDK 4.8.1 currently persists its beacon-core version, 4.8.0.
const CURRENT_BEACON_STORAGE_VERSION = [4, 8, 0];
const LEGACY_MATRIX_TRANSPORT_KEYS = [
'beacon:matrix-selected-node',
'beacon:sdk-matrix-preserved-state',
'beacon:matrix-peer-rooms'
];

function parseBeaconStorageVersion(value) {
if (typeof value !== 'string') {
return null;
}

const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(value);
if (!match) {
return null;
}

const version = match.slice(1).map(Number);

return version.every(Number.isSafeInteger) ? version : null;
}

function isLegacyBeaconStorageVersion(version) {
for (let index = 0; index < CURRENT_BEACON_STORAGE_VERSION.length; index += 1) {
if (version[index] < CURRENT_BEACON_STORAGE_VERSION[index]) {
return true;
}

if (version[index] > CURRENT_BEACON_STORAGE_VERSION[index]) {
return false;
}
}

return false;
}

function migrateLegacyBeaconMatrixTransportState() {
try {
const storage = window.localStorage;
const storedVersion = parseBeaconStorageVersion(
storage.getItem(BEACON_SDK_VERSION_KEY)
);

// Missing or malformed metadata is ambiguous, so leave transport state intact.
if (!storedVersion || !isLegacyBeaconStorageVersion(storedVersion)) {
return false;
}

const keysToRemove = LEGACY_MATRIX_TRANSPORT_KEYS.filter(
key => storage.getItem(key) !== null
);

if (keysToRemove.length === 0) {
return false;
}

keysToRemove.forEach(key => storage.removeItem(key));
return true;
} catch (error) {
logger.log(
'Beacon Matrix transport migration skipped because localStorage is unavailable:',
error
);
return false;
}
}


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
const migratedLegacyMatrixTransport =
migrateLegacyBeaconMatrixTransportState();

// ----------------------------------------------------------------------------
// Initialize or reuse the Beacon client
// ----------------------------------------------------------------------------

if (migratedLegacyMatrixTransport) {
window.dAppClient = undefined;
}

if (!window.dAppClient) {
logger.log('Initializing Beacon DAppClient on network:', network);
logger.log('Beacon network:', beaconNetwork);
logger.log('Beacon client network:', JSON.stringify(clientNetwork));

window.dAppClient = new DAppClient({
name: 'eatacid.xyz',
network: clientNetwork
});
} else {
logger.log('Reusing existing Beacon DAppClient on network:', network);
}

const dAppClient = window.dAppClient;

export const PUBLIC_WALLET_STATE_EVENT = 'publicWalletStateChanged';

let publicWalletState = {
status: 'pending',
account: null,
nftsPromise: null
};

export function getPublicWalletState() {
return publicWalletState;
}

function publishPublicWalletState(status, account = null, nftsPromise = null) {
const nextAddress = account?.address || null;
const currentAddress = publicWalletState.account?.address || null;

if (
publicWalletState.status === status &&
currentAddress === nextAddress
) {
return;
}

publicWalletState = {
status,
account,
nftsPromise
};

document.dispatchEvent(
new CustomEvent(PUBLIC_WALLET_STATE_EVENT, {
detail: publicWalletState
})
);
}

// ----------------------------------------------------------------------------
// State guard to prevent duplicate UI updates
// ----------------------------------------------------------------------------
let lastButtonState = { status: null, address: null };
let clearingMismatchedActiveAccount = false;
let walletLifecycleGeneration = 0;
let walletConnectionRequestPromise = null;

// ----------------------------------------------------------------------------
// Helper: Get wallet button elements
// ----------------------------------------------------------------------------
function getWalletButtons() {
const pendingButton = document.querySelector(
'.button-primary.wallet-pending'
);

const connectButton = document.querySelector(
'.button-primary.wallet-connect'
);

const connectedButton = document.querySelector(
'.button-primary.connected-state'
);

const disconnectButton = document.querySelector(
'.button-primary.disconnect-hover'
);

return {
pendingButton,
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
const error = new Error('Missing TzKT base URL for network: ' + network);
console.error(error.message);
throw error;
}

const apiUrl =
baseUrl + '/v1/tokens/balances' +
'?account=' + address +
'&token.standard=fa2';

try {
const response = await fetch(apiUrl);

if (!response.ok) {
  const body = await response.text().catch(() => '');

  throw new Error(
    'TzKT request failed ' + response.status + ': ' + apiUrl +
    (body ? '\n' + body : '')
  );
}

const nfts = await response.json();

if (!Array.isArray(nfts)) {
  throw new TypeError('TzKT NFT response was not an array: ' + apiUrl);
}

logger.log('NFTs fetched from ' + network + ':', nfts);

return nfts.map(nft => ({
  tokenId: nft.token.tokenId,
  contractAddress: nft.token.contract.address,
  balance: nft.balance
}));

} catch (error) {
console.error('Error fetching NFTs:', error);
throw error;
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
pendingButton,
connectButton,
connectedButton,
disconnectButton
} = getWalletButtons();

[pendingButton, connectButton, connectedButton, disconnectButton].forEach(btn => {
if (btn) btn.style.display = 'none';
});

if (status === 'pending') {
if (pendingButton) {
pendingButton.style.display = 'inline-block';
}

if (window.appState) {
window.appState.isConnected = false;
}

return;
}

if (status === 'connected' && address) {
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

function isActiveAccountForClientNetwork(account) {
return account?.network?.type === clientNetwork.type;
}

function syncDisconnectedWalletState() {
walletLifecycleGeneration += 1;

if (typeof resetUI === 'function') {
  resetUI();
}

updateButtonState('unconnected');

publishPublicWalletState('unconnected');

document.dispatchEvent(
  new Event('walletDisconnected')
);
}

async function clearMismatchedActiveAccount(account) {
if (clearingMismatchedActiveAccount) {
return;
}

clearingMismatchedActiveAccount = true;

try {
logger.log('Clearing mismatched Beacon account:', {
  address: account?.address || null,
  accountNetwork: account?.network?.type || null,
  expectedNetwork: clientNetwork.type
});

await dAppClient.clearActiveAccount();
} catch (error) {
console.error('Error clearing mismatched Beacon account:', error);
} finally {
clearingMismatchedActiveAccount = false;
}

syncDisconnectedWalletState();
}

export async function verifyPublicActiveAccount(account) {
if (!account) {
return null;
}

if (isActiveAccountForClientNetwork(account)) {
return account;
}

await clearMismatchedActiveAccount(account);
return null;
}

export async function getVerifiedPublicActiveAccount() {
try {
const activeAccount = await dAppClient.getActiveAccount();
return verifyPublicActiveAccount(activeAccount);
} catch (error) {
console.error('Error reading Beacon active account:', error);
return null;
}
}

// ----------------------------------------------------------------------------
// Connect / Disconnect Flows
// ----------------------------------------------------------------------------
async function connectWallet() {
if (walletConnectionRequestPromise) {
return walletConnectionRequestPromise;
}

walletConnectionRequestPromise = (async () => {
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
})();

try {
return await walletConnectionRequestPromise;
} finally {
walletConnectionRequestPromise = null;
}
}

export async function requestPublicWalletConnection() {
return connectWallet();
}

async function disconnectWallet() {
try {
logger.log('Disconnecting wallet...');

await dAppClient.clearActiveAccount();

logger.log('Wallet disconnected.');

syncDisconnectedWalletState();

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
const generation = ++walletLifecycleGeneration;

if (account) {
logger.log(
`${BeaconEvent.ACTIVE_ACCOUNT_SET} triggered:`,
account.address
);

  const verifiedAccount = await verifyPublicActiveAccount(account);
  if (!verifiedAccount) {
    return;
  }

  if (generation !== walletLifecycleGeneration) {
    return;
  }

  if (
    publicWalletState.status === 'connected' &&
    publicWalletState.account?.address === verifiedAccount.address
  ) {
    return;
  }

  const nftsPromise = fetchNFTs(verifiedAccount.address);
  nftsPromise.catch(err => {
    console.error('Error fetching NFTs after account set:', err);
  });

  updateButtonState('connected', verifiedAccount.address);
  publishPublicWalletState('connected', verifiedAccount, nftsPromise);
  return;
}

logger.log('No active account detected via subscription.');

updateButtonState('unconnected');
publishPublicWalletState('unconnected');

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

logger.log('bootWalletButtons → initializing wallet buttons');

const {
connectButton,
connectedButton,
disconnectButton
} = getWalletButtons();

updateButtonState('pending');

const generation = walletLifecycleGeneration;
const activeAccount = await getVerifiedPublicActiveAccount();

if (generation !== walletLifecycleGeneration) {
logger.log('Shared wallet boot result superseded by an account event.');
} else if (activeAccount) {
logger.log('Active account on load:', activeAccount.address);

// Flip UI immediately. Do not wait for NFT fetch.
updateButtonState('connected', activeAccount.address);

// Fetch NFTs in the background.
const nftsPromise = fetchNFTs(activeAccount.address);
publishPublicWalletState('connected', activeAccount, nftsPromise);
nftsPromise.catch(err => {
  console.error('Error fetching NFTs after connect:', err);
});

} else {
updateButtonState('unconnected');
publishPublicWalletState('unconnected');
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

