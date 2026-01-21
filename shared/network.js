// =============================================================================
// SHARED: NETWORK CONFIGURATION
// =============================================================================

// Single source of truth:
// - Change this to 'mainnet' when you're ready to flip that branch to mainnet.
// - Keep it 'testnet' on staging if you want staging to stay ghostnet.
const DEFAULT_NETWORK = 'testnet';

// Allow NODE/CI override only if you *explicitly* set it.
// In the browser, `process` may not exist (or may be shimmed), so guard it.
const ENV_NETWORK =
  (typeof process !== 'undefined' && process?.env?.NETWORK) ? process.env.NETWORK : null;

const network = ENV_NETWORK || DEFAULT_NETWORK;

const rpc = {
  testnet: 'https://ghostnet.smartpy.io',
  mainnet: 'https://mainnet.smartpy.io'
};

const tzkt = {
  testnet: 'https://api.ghostnet.tzkt.io',
  mainnet: 'https://api.tzkt.io'
};

export default {
  network,
  rpc,
  tzkt
};