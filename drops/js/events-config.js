// =============================================================================
// EVENTS CONFIG
// =============================================================================

import networkConfig from '../../shared/network.js';
import { chainRegistry, validatePublicDropsConfig } from '../../shared/chain-registry.js';

const network = networkConfig.network;

function buildDropsContracts(config) {
  const collections = config?.collections || {};

  return {
    escrow: config?.escrow || '',

    collections: {
      HEN: collections.HEN,
      CANAAN: collections.CANAAN,
      INTRODUCTIONS: collections.INTRODUCTIONS
    },

    tokenMapping: {
      ...(config?.mirrors || {})
    }
  };
}

const contracts = Object.fromEntries(
  Object.entries(chainRegistry).map(([networkKey, config]) => [
    networkKey,
    buildDropsContracts(config)
  ])
);

const activeValidation = validatePublicDropsConfig(network);
if (!activeValidation.ok) {
  throw new Error(
    `Drops network config missing required values for ${network}: ${activeValidation.missing.join(', ')}`
  );
}

export default {
  network,

  rpc: {
    testnet: networkConfig.rpc.testnet,
    mainnet: networkConfig.rpc.mainnet
  },

  tzkt: {
    testnet: networkConfig.tzkt.testnet,
    mainnet: networkConfig.tzkt.mainnet
  },

  contracts
};
