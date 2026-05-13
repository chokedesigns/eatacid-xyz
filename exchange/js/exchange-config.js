// =============================================================================
// EXCHANGE CONFIG
// =============================================================================

import networkConfig from '../../shared/network.js';
import { chainRegistry, validatePublicExchangeConfig } from '../../shared/chain-registry.js';

const network = networkConfig.network;

function buildExchangeContracts(config) {
  const collections = config?.collections || {};

  return {
    collections: {
      pane0: collections['THE 419 SCRIPT'],
      pane1: collections.CANAAN
    },
    escrow: config?.escrow || '',
    redeemMaster: config?.exchange?.redeemMaster || ''
  };
}

const contracts = Object.fromEntries(
  Object.entries(chainRegistry).map(([networkKey, config]) => [
    networkKey,
    buildExchangeContracts(config)
  ])
);

const activeValidation = validatePublicExchangeConfig(network);
if (!activeValidation.ok) {
  throw new Error(
    `Exchange network config missing required values for ${network}: ${activeValidation.missing.join(', ')}`
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
