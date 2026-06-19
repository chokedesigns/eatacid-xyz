// =============================================================================
// SHARED: CHAIN REGISTRY
// =============================================================================

export const chainRegistry = {
  testnet: {
    label: 'Shadownet',
    beaconNetwork: 'shadownet',
    rpc: 'https://rpc.tzkt.io/shadownet',
    tzkt: 'https://api.shadownet.tzkt.io',
    escrow: 'KT1SZFfxFfRkbTcDUS17y1WVCKeudoLo8LX5',
    pairsMapPath: 'token_mapping',
    escrows: {
      drops: {
        address: '',
        pairsMapPath: ''
      },
      exchange: {
        address: 'KT1UikSTZgFj68HaShoWWAJoRki6Y9S1s2Y8',
        pairsMapPath: ''
      }
    },
    collections: {
      CANAAN: 'KT1GCvVdxELA4mPUn4DiBpPAd8ARRtyoEpke',
      'THE 419 SCRIPT': 'KT1WczRb1giprHqCp3ADRn8JrkGBT6aENJmV',
      HEN: 'KT1GnVnQvvb7R6h4EhveBmN17ysaTuGRDoWW',
      INTRODUCTIONS: 'KT1B53naqjqZiNBHDv2PPHMroL7geiXzxcT1',
      'ACID COIN': 'KT1WdWDKYmxHGNVWqnSPNnm7ZB6NeKNG6zPB'
    },
    pairIdRanges: {
      exchange: { start: 0, end: 999 },
      drops: { start: 1000, end: null }
    },
    mirrors: {
      HEN: {
        '94684': '0',
        '103062': '1',
        '104492': '2',
        '114368': '3',
        '125115': '4',
        '135460': '5',
        '141634': '6',
        '147893': '7',
        '175592': '8',
        '200717': '9',
        '209650': '10',
        '279300': '11',
        '369693': '12',
        '397098': '13',
        '422822': '14',
        '455835': '15',
        '526531': '16'
      },
      INTRODUCTIONS: {
        '0': '0',
        '1': '1',
        '2': '2',
        '3': '3',
        '4': '4'
      }
    }
  },

  mainnet: {
    label: 'Mainnet',
    beaconNetwork: 'mainnet',
    rpc: 'https://mainnet.smartpy.io',
    tzkt: 'https://api.tzkt.io',
    escrow: '',
    pairsMapPath: 'token_mapping',
    escrows: {
      drops: {
        address: '',
        pairsMapPath: ''
      },
      exchange: {
        address: '',
        pairsMapPath: ''
      }
    },
    collections: {
      CANAAN: 'KT1UqqSTPPFQk6btXKgv2adjj83YD2V5YBt1',
      'THE 419 SCRIPT': 'KT1EzmMokbtPS9nYJW1n5Darfgwf7HVtcsyq',
      HEN: 'KT1RJ6PbjHpwc3M5rw5s2Nbmefwbuwbdxton',
      INTRODUCTIONS: 'KT1FmqojETK4Ux44oeudyDbQ6zQDYrD5DaP5',
      'ACID COIN': ''
    },
    pairIdRanges: {
      exchange: { start: 0, end: 999 },
      drops: { start: 1000, end: null }
    },
    mirrors: {}
  }
};

export function getChainConfig(network) {
  return chainRegistry[network] || null;
}

export function getRequiredChainConfig(network) {
  const config = getChainConfig(network);
  if (!config) throw new Error(`Unknown network: ${network}`);
  return config;
}

const dropCollectionKeys = ['HEN', 'INTRODUCTIONS', 'CANAAN'];
const exchangeRedeemTokenCollectionKey = 'ACID COIN';
const exchangeCollectionKeys = ['THE 419 SCRIPT', 'CANAAN', exchangeRedeemTokenCollectionKey];
const adminCollectionKeys = [
  'HEN',
  'INTRODUCTIONS',
  'CANAAN',
  'THE 419 SCRIPT',
  'ACID COIN'
];

function resolveChainConfig(configOrNetwork) {
  if (typeof configOrNetwork === 'string') {
    return getChainConfig(configOrNetwork);
  }
  return configOrNetwork || null;
}

function validationResult(missing) {
  return { ok: missing.length === 0, missing };
}

function stringValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function addMissingText(missing, config, path) {
  const value = path.split('.').reduce((target, key) => target?.[key], config);
  if (typeof value !== 'string' || value.trim() === '') missing.push(path);
}

function addMissingAddress(missing, config, path) {
  const value = path.split('.').reduce((target, key) => target?.[key], config);
  if (isPlaceholderAddress(value)) missing.push(path);
}

function addMissingCollections(missing, config, keys) {
  keys.forEach((key) => {
    addMissingAddress(missing, config, `collections.${key}`);
  });
}

function addMissingExchangeRedeemTokenContract(missing, config) {
  if (isPlaceholderAddress(resolveExchangeRedeemTokenContract(config))) {
    missing.push(`collections.${exchangeRedeemTokenCollectionKey}`);
  }
}

function addMissingEffectiveSurfaceEscrow(missing, config, surface, options = {}) {
  const resolved = resolveSurfaceEscrow(config, surface, options);

  if (!isPlaceholderAddress(resolved.effectiveAddress)) return;

  if (options?.strict === true) {
    missing.push(`escrows.${surface}.address`);
    return;
  }

  missing.push(
    resolved.configuredAddress
      ? `escrows.${surface}.address`
      : 'escrow'
  );
}

export function isPlaceholderAddress(value) {
  if (value == null) return true;
  if (typeof value !== 'string') return true;

  const trimmed = value.trim();
  if (trimmed === '') return true;
  if (!trimmed.startsWith('KT1')) return true;

  const lower = trimmed.toLowerCase();
  if (lower.includes('placeholder') || lower.includes('your-') || lower.includes('tbd')) {
    return true;
  }

  const body = trimmed.slice(3);
  return /^[.\-_]+$/.test(body) || /^(.)\1+$/.test(body);
}

export function resolveSurfaceEscrow(configOrNetwork, surface, options = {}) {
  const config = resolveChainConfig(configOrNetwork);
  const strict = options?.strict === true;
  const surfaceConfig = config?.escrows?.[surface] || {};
  const configuredAddress = stringValue(surfaceConfig.address);
  const fallbackAddress = stringValue(config?.escrow);
  const configuredPairsMapPath = stringValue(surfaceConfig.pairsMapPath);
  const fallbackPairsMapPath = stringValue(config?.pairsMapPath);
  const hasConfiguredAddress = !isPlaceholderAddress(configuredAddress);
  const hasFallbackAddress = !isPlaceholderAddress(fallbackAddress);
  const effectiveAddress = hasConfiguredAddress
    ? configuredAddress
    : (!strict && hasFallbackAddress ? fallbackAddress : '');
  const source = hasConfiguredAddress
    ? 'surface'
    : (effectiveAddress ? 'legacy-fallback' : 'none');

  return {
    surface,
    configuredAddress,
    fallbackAddress,
    effectiveAddress,
    pairsMapPath: configuredPairsMapPath || fallbackPairsMapPath,
    source,
    strict
  };
}

export function resolveDropsEscrow(configOrNetwork) {
  const resolved = resolveSurfaceEscrow(configOrNetwork, 'drops');
  return {
    ...resolved,
    dropsEscrow: resolved.effectiveAddress
  };
}

export function resolveExchangeEscrow(configOrNetwork, options = {}) {
  const resolved = resolveSurfaceEscrow(configOrNetwork, 'exchange', options);
  return {
    ...resolved,
    exchangeEscrow: resolved.effectiveAddress
  };
}

export function resolveExchangeRedeemTokenContract(configOrNetwork) {
  const config = resolveChainConfig(configOrNetwork);
  return stringValue(config?.collections?.[exchangeRedeemTokenCollectionKey]);
}

export function validateNetworkBase(configOrNetwork) {
  const config = resolveChainConfig(configOrNetwork);
  const missing = [];

  if (!config) return validationResult(['network']);

  addMissingText(missing, config, 'rpc');
  addMissingText(missing, config, 'tzkt');
  addMissingText(missing, config, 'beaconNetwork');

  return validationResult(missing);
}

export function validatePublicDropsConfig(configOrNetwork) {
  const config = resolveChainConfig(configOrNetwork);
  const missing = validateNetworkBase(config).missing.slice();

  if (!config) return validationResult(missing);

  addMissingEffectiveSurfaceEscrow(missing, config, 'drops');
  addMissingText(missing, config, 'pairsMapPath');
  addMissingCollections(missing, config, dropCollectionKeys);

  return validationResult(missing);
}

export function validatePublicExchangeConfig(configOrNetwork) {
  const config = resolveChainConfig(configOrNetwork);
  const missing = validateNetworkBase(config).missing.slice();

  if (!config) return validationResult(missing);

  addMissingEffectiveSurfaceEscrow(missing, config, 'exchange', { strict: true });
  addMissingCollections(missing, config, exchangeCollectionKeys.filter(
    (key) => key !== exchangeRedeemTokenCollectionKey
  ));
  addMissingExchangeRedeemTokenContract(missing, config);

  return validationResult(missing);
}

export function validateAdminNetworkConfig(configOrNetwork) {
  const config = resolveChainConfig(configOrNetwork);
  const missing = validateNetworkBase(config).missing.slice();

  if (!config) return validationResult(missing);

  addMissingAddress(missing, config, 'escrow');
  addMissingText(missing, config, 'pairsMapPath');
  addMissingCollections(missing, config, adminCollectionKeys);

  return validationResult(missing);
}

export default chainRegistry;
