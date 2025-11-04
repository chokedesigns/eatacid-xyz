// =============================================================================
// EXCHANGE CONFIG
// =============================================================================

import networkConfig from '../../shared/network.js';

const network = networkConfig.network;

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

  contracts: {
    testnet: {
      collections: {
        pane0: "KT194J5ips31A3ZDKn11cL8GZZ7wxRTBifPN",
        pane1: "KT1EUVvXwN4GcBUgQGomwCxRjj96F99cF69u"
      },
      escrow: "KT1XTgLfSM91seY8o61mcTemZec947agaXdG",
      redeemMaster: "KT1JCjaj6HYj8MwhaWTBFQLyAGu6YGtUoxNd"
    },

    mainnet: {
      collections: {
        pane0: "KT1EzmMokbtPS9nYJW1n5Darfgwf7HVtcsyq",
        pane1: "KT1UqqSTPPFQk6btXKgv2adjj83YD2V5YBt1"
      },
      escrow: "KT1…your-escrow-mainnet-address…",
      redeemMaster: "KT1…your-redeemMaster-mainnet-address…"
    }
  }
};
