// =============================================================================
// EVENTS CONFIG
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
      escrow: "KT1XTgLfSM91seY8o61mcTemZec947agaXdG",

      collections: {
        HEN: "KT1MzZz5T5MqYrBoeqdKPfG6qx1AmyjxE8Gp",
        CANAAN: "KT1EUVvXwN4GcBUgQGomwCxRjj96F99cF69u",
        INTRODUCTIONS: "KT1DmDSBFJXX76Q2SFfyTBe9XSsw11FYyEHP"
      },

      tokenMapping: {
        HEN: {
          "94684":  "0",
          "103062": "1",
          "104492": "2",
          "114368": "3",
          "125115": "4",
          "135460": "5",
          "141634": "6",
          "147893": "7",
          "175592": "8",
          "200717": "9",
          "209650": "10",
          "279300": "11",
          "369693": "12",
          "397098": "13",
          "422822": "14",
          "455835": "15",
          "526531": "16"
        },
        INTRODUCTIONS: {
          "0": "0",
          "1": "1",
          "2": "2",
          "3": "3",
          "4": "4"
        }
      }
    },

    mainnet: {
      escrow: "KT1…your-escrow-mainnet-address…",

      collections: {
        HEN: "KT1…your-HEN-mainnet-address…",
        CANAAN: "KT1…your-CANAAN-mainnet-address…",
        INTRODUCTIONS: "KT1…your-INTRO-mainnet-address…"
      },

      tokenMapping: {}
    }
  }
};
