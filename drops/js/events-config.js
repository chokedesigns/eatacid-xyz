// =============================================================================
// EVENTS CONFIG
// =============================================================================

import networkConfig from '../../shared/network.js';
import dropParams from 'ea-drop-params';
import { validatePublicDropCompatibility } from '../../shared/public-drop-compatibility.js';
import {
  chainRegistry,
  PUBLIC_DROPS_COLLECTION_KEYS,
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

    collections: Object.fromEntries(
      PUBLIC_DROPS_COLLECTION_KEYS.map(key => [key, collections[key]])
    ),

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

export function createDropsConfig(params, selectedNetwork = network) {
  const baseValidation = validatePublicDropsConfig(selectedNetwork);
  const compatibility = validatePublicDropCompatibility(params, selectedNetwork);
  const activeValidation = {
    ok: baseValidation.ok && compatibility.ok,
    missing: [...baseValidation.missing, ...compatibility.errors.map(error => `${error.path}: ${error.message}`)]
  };

  return {
    network: selectedNetwork,
    validation: activeValidation,
    isConfigured: activeValidation.ok,
    unavailableMessage: !compatibility.ok
      ? `Drop configuration is not supported: ${compatibility.errors.map(error => error.message).join('; ')}`
      : selectedNetwork === 'mainnet'
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
}

export default createDropsConfig(dropParams);
