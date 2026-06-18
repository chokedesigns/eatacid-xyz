// =============================================================================
// EXCHANGE CONFIG
// =============================================================================

import networkConfig from '../../shared/network.js';
import {
  chainRegistry,
  resolveExchangeEscrow,
  validatePublicExchangeConfig
} from '../../shared/chain-registry.js';

const network = networkConfig.network;

function buildExchangeContracts(config) {
  const collections = config?.collections || {};
  const exchangeEscrow = resolveExchangeEscrow(config, { strict: true });

  return {
    collections: {
      pane0: collections['THE 419 SCRIPT'],
      pane1: collections.CANAAN
    },
    escrow: exchangeEscrow.exchangeEscrow || '',
    exchangeEscrow,
    surfaceEscrow: exchangeEscrow,
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
