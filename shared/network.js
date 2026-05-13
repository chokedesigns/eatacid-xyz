// =============================================================================
// SHARED: NETWORK CONFIGURATION
// =============================================================================

import { chainRegistry, getChainConfig } from './chain-registry.js';

// Single source of truth:
// - Change this to 'mainnet' when you're ready to flip that branch to mainnet.
// - Keep it 'testnet' on staging if you want staging to stay ghostnet.
const DEFAULT_NETWORK = 'testnet';

// Allow NODE/CI override only if you *explicitly* set it.
// In the browser, `process` may not exist (or may be shimmed), so guard it.
const ENV_NETWORK =
  (typeof process !== 'undefined' && process?.env?.NETWORK) ? process.env.NETWORK : null;

const network = ENV_NETWORK || DEFAULT_NETWORK;

const rpc = Object.fromEntries(
  Object.entries(chainRegistry).map(([key, config]) => [key, config.rpc])
);

const tzkt = Object.fromEntries(
  Object.entries(chainRegistry).map(([key, config]) => [key, config.tzkt])
);

function getCurrentPublicNetworkConfig() {
  return getChainConfig(network);
}

export {
  DEFAULT_NETWORK,
  ENV_NETWORK,
  network,
  rpc,
  tzkt,
  getCurrentPublicNetworkConfig
};

export default {
  network,
  rpc,
  tzkt,
  getCurrentPublicNetworkConfig
};
