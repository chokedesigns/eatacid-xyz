import {
  getChainConfig,
  PUBLIC_DROPS_BURN_COLLECTION_KEYS,
  PUBLIC_DROPS_COLLECTION_KEYS,
  validatePublicDropsConfig
} from './chain-registry.js';

// HEN has an explicit burn-only role. Other collection admission still belongs
// to registry/schema validation and the existing Public surface capabilities.
export function isDropRedeemCollectionEligible(collection) {
  return collection !== 'HEN';
}

// Shared by authoring and Public's runtime gate. The schema validator owns types,
// amounts and exclusions; this boundary owns what the current surface can express.
export function validatePublicDropCompatibility(params, network) {
  const errors = [];
  const reject = (path, message) => errors.push({ path, message, code: 'public_compatibility' });
  if (!isDropRedeemCollectionEligible(params?.redeemToken?.collection)) {
    reject('$.redeemToken.collection', 'HEN is eligible for Drop burning only, not redemption');
  }
  if (params?.dropScheduled !== true) return { ok: errors.length === 0, errors };

  if (params.mirrorNetwork !== network) {
    reject('$.mirrorNetwork', `must match the selected Public network (${network})`);
  }
  const config = validatePublicDropsConfig(network);
  if (!config.ok) {
    reject('$.mirrorNetwork', `Public Drops network is not configured: ${config.missing.join(', ')}`);
  }

  if (Array.isArray(params.burnTokens)) {
    const collections = getChainConfig(network)?.collections || {};
    const redeemAddress = collections[params.redeemToken?.collection];
    const enabled = params.burnTokens.filter(token => token?.enabled === true);
    if (enabled.length !== 1) {
      reject('$.burnTokens', 'Public Drops requires exactly one enabled burn collection');
    }
    params.burnTokens.forEach((token, index) => {
      if (token?.enabled === true && !PUBLIC_DROPS_BURN_COLLECTION_KEYS.includes(token.collection)) {
        reject(`$.burnTokens[${index}].collection`,
          `has no Public Drops burn pane; supported collections: ${PUBLIC_DROPS_BURN_COLLECTION_KEYS.join(', ')}`);
      }
      if (token?.enabled === true && redeemAddress && collections[token.collection] === redeemAddress) {
        reject(`$.burnTokens[${index}].collection`, 'Public Drops requires distinct burn and redeem FA2 contracts');
      }
    });
  }
  if (params.redeemToken && !PUBLIC_DROPS_COLLECTION_KEYS.includes(params.redeemToken.collection)) {
    reject('$.redeemToken.collection',
      `has no Public Drops redeem catalog; supported collections: ${PUBLIC_DROPS_COLLECTION_KEYS.filter(isDropRedeemCollectionEligible).join(', ')}`);
  }
  return { ok: errors.length === 0, errors };
}
