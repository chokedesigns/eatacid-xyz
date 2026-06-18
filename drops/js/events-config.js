// =============================================================================
// EVENTS CONFIG
// =============================================================================

import networkConfig from '../../shared/network.js';
import {
  chainRegistry,
  resolveDropsEscrow,
  validatePublicDropsConfig
} from '../../shared/chain-registry.js';

const network = networkConfig.network;

function buildDropsContracts(config) {
  const collections = config?.collections || {};
  const dropsEscrow = resolveDropsEscrow(config);

  return {
    escrow: dropsEscrow.dropsEscrow || '',
    dropsEscrow,
    surfaceEscrow: dropsEscrow,

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

export default {
  network,
  validation: activeValidation,
  isConfigured: activeValidation.ok,
  unavailableMessage: network === 'mainnet'
    ? 'Mainnet is not configured yet.'
    : 'This network is not configured yet.',

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
