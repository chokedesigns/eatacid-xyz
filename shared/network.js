// =============================================================================
// SHARED: NETWORK CONFIGURATION
// =============================================================================

const network = process.env.NETWORK || 'testnet';

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