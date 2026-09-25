import { createHash, randomUUID } from "node:crypto";
import { Buffer } from "node:buffer";

import { chainRegistry, isPlaceholderAddress } from "../chain-registry.js";
import { computeDropInstant } from "../drop-time.js";

export const DROP_PARAMS_OPERATIONS = Object.freeze({
  CANONICAL: "canonical",
  AUTHORED: "authored",
  ACTIVE: "active",
  INACTIVE: "inactive"
});

export const INACTIVE_DROP_PARAMS = deepFreeze({
  dropScheduled: false,
  dropName: "",
  mirrorNetwork: null,
  dropDate: null,
  dropTime: null,
  burnTokens: [],
  redeemToken: null
});

const TOP_LEVEL_KEYS = Object.freeze([
  "dropScheduled",
  "dropName",
  "mirrorNetwork",
  "dropDate",
  "dropTime",
  "burnTokens",
  "redeemToken"
]);
const DROP_DATE_KEYS = Object.freeze(["month", "day", "year"]);
const DROP_TIME_KEYS = Object.freeze(["time", "period", "timezone"]);
const BURN_TOKEN_KEYS = Object.freeze([
  "collection",
  "enabled",
  "exclude",
  "burnAmount"
]);
const REDEEM_TOKEN_KEYS = Object.freeze([
  "collection",
  "tokenId",
  "redeemAmount",
  "totalSupply"
]);

export const SUPPORTED_MIRROR_NETWORKS = Object.freeze(Object.keys(chainRegistry));
export const KNOWN_COLLECTION_KEYS = Object.freeze([
  ...new Set(
    Object.values(chainRegistry).flatMap(config =>
      Object.keys(config?.collections || {})
    )
  )
]);

const supportedMirrorNetworks = new Set(SUPPORTED_MIRROR_NETWORKS);
const decimalTokenIdPattern = /^(?:0|[1-9]\d*)$/;

export class DropParamsValidationError extends TypeError {
  constructor(errors) {
    super(`Invalid Drop Params:\n${errors.map(error => `- ${error.path}: ${error.message}`).join("\n")}`);
    this.name = "DropParamsValidationError";
    this.errors = errors;
  }
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function addError(errors, path, message, code) {
  errors.push({ path, message, code });
}

function validateExactKeys(value, expectedKeys, path, errors) {
  if (!isRecord(value)) {
    addError(errors, path, "must be an object", "type");
    return false;
  }

  const expected = new Set(expectedKeys);
  for (const key of Object.keys(value)) {
    if (!expected.has(key)) {
      addError(errors, `${path}.${key}`, "is not an allowed field", "unknown_key");
    }
  }
  for (const key of expectedKeys) {
    if (!Object.hasOwn(value, key)) {
      addError(errors, `${path}.${key}`, "is required", "missing_key");
    }
  }
  return true;
}

function validateNonEmptyString(value, path, errors) {
  if (typeof value !== "string" || value.trim() === "") {
    addError(errors, path, "must be a non-empty string", "type");
  }
}

function validatePositiveSafeInteger(value, path, errors) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    addError(errors, path, "must be a positive safe integer", "integer");
  }
}

function validateDecimalTokenId(value, path, errors) {
  if (typeof value !== "string" || !decimalTokenIdPattern.test(value)) {
    addError(errors, path, "must be a canonical decimal token-ID string", "token_id");
  }
}

function validateCollection(value, mirrorNetwork, path, errors) {
  if (typeof value !== "string") {
    addError(errors, path, "must be a collection key string", "collection");
    return;
  }

  const networkCollections = chainRegistry[mirrorNetwork]?.collections;
  if (!networkCollections) return;

  if (!Object.hasOwn(networkCollections, value)) {
    addError(
      errors,
      path,
      `must be a collection key in the ${mirrorNetwork} registry slot`,
      "collection"
    );
    return;
  }

  const configuredAddress = networkCollections[value];
  if (isPlaceholderAddress(configuredAddress)) {
    addError(
      errors,
      path,
      `must have a usable configured address in the ${mirrorNetwork} registry slot`,
      "collection_network"
    );
  }
}

function validateFullAuthored(params, errors, { requireScheduled }) {
  if (typeof params.dropScheduled !== "boolean") {
    addError(errors, "$.dropScheduled", "must be a boolean", "type");
  } else if (requireScheduled && params.dropScheduled !== true) {
    addError(errors, "$.dropScheduled", "must be true for an active operation", "operation");
  }

  validateNonEmptyString(params.dropName, "$.dropName", errors);

  if (typeof params.mirrorNetwork !== "string" || !supportedMirrorNetworks.has(params.mirrorNetwork)) {
    addError(
      errors,
      "$.mirrorNetwork",
      `must be one of: ${SUPPORTED_MIRROR_NETWORKS.join(", ")}`,
      "network"
    );
  }

  const hasDateObject = validateExactKeys(params.dropDate, DROP_DATE_KEYS, "$.dropDate", errors);
  if (hasDateObject) {
    for (const key of DROP_DATE_KEYS) {
      validateNonEmptyString(params.dropDate[key], `$.dropDate.${key}`, errors);
    }
  }

  const hasTimeObject = validateExactKeys(params.dropTime, DROP_TIME_KEYS, "$.dropTime", errors);
  if (hasTimeObject) {
    for (const key of DROP_TIME_KEYS) {
      validateNonEmptyString(params.dropTime[key], `$.dropTime.${key}`, errors);
    }
  }

  if (hasDateObject && hasTimeObject) {
    const instant = computeDropInstant(params.dropDate, params.dropTime);
    if (!instant.ok) {
      addError(
        errors,
        "$.dropDate/$.dropTime",
        `is not a valid drop instant (${instant.error})`,
        "drop_time"
      );
    }
  }

  if (!Array.isArray(params.burnTokens)) {
    addError(errors, "$.burnTokens", "must be an array", "type");
  } else {
    if (params.dropScheduled === true && params.burnTokens.length === 0) {
      addError(
        errors,
        "$.burnTokens",
        "must contain at least one burn token for an active configuration",
        "min_items"
      );
    }
    const collections = new Set();
    params.burnTokens.forEach((burnToken, index) => {
      const path = `$.burnTokens[${index}]`;
      if (!validateExactKeys(burnToken, BURN_TOKEN_KEYS, path, errors)) return;

      validateCollection(
        burnToken.collection,
        params.mirrorNetwork,
        `${path}.collection`,
        errors
      );
      if (typeof burnToken.collection === "string") {
        if (collections.has(burnToken.collection)) {
          addError(errors, `${path}.collection`, "must be unique within burnTokens", "duplicate");
        }
        collections.add(burnToken.collection);
      }

      if (typeof burnToken.enabled !== "boolean") {
        addError(errors, `${path}.enabled`, "must be a boolean", "type");
      }
      validatePositiveSafeInteger(burnToken.burnAmount, `${path}.burnAmount`, errors);

      if (!Array.isArray(burnToken.exclude)) {
        addError(errors, `${path}.exclude`, "must be an array", "type");
        return;
      }

      const isLegacyDisabledSentinel =
        burnToken.enabled === false &&
        burnToken.exclude.length === 1 &&
        burnToken.exclude[0] === "";
      if (isLegacyDisabledSentinel) return;

      const exclusions = new Set();
      burnToken.exclude.forEach((tokenId, exclusionIndex) => {
        const exclusionPath = `${path}.exclude[${exclusionIndex}]`;
        validateDecimalTokenId(tokenId, exclusionPath, errors);
        if (typeof tokenId === "string") {
          if (exclusions.has(tokenId)) {
            addError(errors, exclusionPath, "must not duplicate another exclusion", "duplicate");
          }
          exclusions.add(tokenId);
        }
      });
    });
  }

  if (validateExactKeys(params.redeemToken, REDEEM_TOKEN_KEYS, "$.redeemToken", errors)) {
    validateCollection(
      params.redeemToken.collection,
      params.mirrorNetwork,
      "$.redeemToken.collection",
      errors
    );
    validateDecimalTokenId(params.redeemToken.tokenId, "$.redeemToken.tokenId", errors);
    validatePositiveSafeInteger(params.redeemToken.redeemAmount, "$.redeemToken.redeemAmount", errors);
    validatePositiveSafeInteger(params.redeemToken.totalSupply, "$.redeemToken.totalSupply", errors);
  }
}

function validateInactive(params, errors) {
  if (params.dropScheduled !== false) {
    addError(errors, "$.dropScheduled", "must be explicitly false for an inactive operation", "operation");
  }
  if (params.dropName !== "") addError(errors, "$.dropName", "must be an empty string", "inactive_shape");
  if (params.mirrorNetwork !== null) addError(errors, "$.mirrorNetwork", "must be null", "inactive_shape");
  if (params.dropDate !== null) addError(errors, "$.dropDate", "must be null", "inactive_shape");
  if (params.dropTime !== null) addError(errors, "$.dropTime", "must be null", "inactive_shape");
  if (!Array.isArray(params.burnTokens) || params.burnTokens.length !== 0) {
    addError(errors, "$.burnTokens", "must be an empty array", "inactive_shape");
  }
  if (params.redeemToken !== null) addError(errors, "$.redeemToken", "must be null", "inactive_shape");
}

function isInactiveShape(params) {
  return isRecord(params) &&
    params.dropScheduled === false &&
    params.dropName === "" &&
    params.mirrorNetwork === null &&
    params.dropDate === null &&
    params.dropTime === null &&
    Array.isArray(params.burnTokens) &&
    params.burnTokens.length === 0 &&
    params.redeemToken === null;
}

export function validateDropParams(params, options = {}) {
  const operation = options.operation || DROP_PARAMS_OPERATIONS.CANONICAL;
  const operations = new Set(Object.values(DROP_PARAMS_OPERATIONS));
  if (!operations.has(operation)) {
    throw new TypeError(`Unknown Drop Params operation: ${operation}`);
  }

  const errors = [];
  if (!validateExactKeys(params, TOP_LEVEL_KEYS, "$", errors)) {
    return { ok: false, operation, errors };
  }

  const validateAsInactive = operation === DROP_PARAMS_OPERATIONS.INACTIVE ||
    (operation === DROP_PARAMS_OPERATIONS.CANONICAL && isInactiveShape(params));

  if (validateAsInactive) {
    validateInactive(params, errors);
  } else {
    validateFullAuthored(params, errors, {
      requireScheduled: operation === DROP_PARAMS_OPERATIONS.ACTIVE
    });
  }

  return { ok: errors.length === 0, operation, errors };
}

export function assertValidDropParams(params, options = {}) {
  const result = validateDropParams(params, options);
  if (!result.ok) throw new DropParamsValidationError(result.errors);
  return params;
}

export function toCanonicalDropParams(params, options = {}) {
  assertValidDropParams(params, options);

  if (isInactiveShape(params)) {
    return {
      dropScheduled: false,
      dropName: "",
      mirrorNetwork: null,
      dropDate: null,
      dropTime: null,
      burnTokens: [],
      redeemToken: null
    };
  }

  return {
    dropScheduled: params.dropScheduled,
    dropName: params.dropName,
    mirrorNetwork: params.mirrorNetwork,
    dropDate: {
      month: params.dropDate.month,
      day: params.dropDate.day,
      year: params.dropDate.year
    },
    dropTime: {
      time: params.dropTime.time,
      period: params.dropTime.period,
      timezone: params.dropTime.timezone
    },
    burnTokens: params.burnTokens.map(burnToken => ({
      collection: burnToken.collection,
      enabled: burnToken.enabled,
      exclude: [...burnToken.exclude],
      burnAmount: burnToken.burnAmount
    })),
    redeemToken: {
      collection: params.redeemToken.collection,
      tokenId: params.redeemToken.tokenId,
      redeemAmount: params.redeemToken.redeemAmount,
      totalSupply: params.redeemToken.totalSupply
    }
  };
}

export function serializeDropParamsSource(params, options = {}) {
  const ordered = toCanonicalDropParams(params, options);
  return `export default ${JSON.stringify(ordered, null, 2)};\n`;
}

export async function evaluateSerializedDropParams(params, options = {}) {
  const source = serializeDropParamsSource(params, options);
  const dataUrl = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
  const namespace = await import(`${dataUrl}#${randomUUID()}`);
  return namespace.default;
}

export function sha256SourceBytes(sourceBytes) {
  if (
    typeof sourceBytes !== "string" &&
    !Buffer.isBuffer(sourceBytes) &&
    !(sourceBytes instanceof Uint8Array)
  ) {
    throw new TypeError("sourceBytes must be a string, Buffer, or Uint8Array");
  }
  return createHash("sha256").update(sourceBytes).digest("hex");
}

export function getCandidateSourceVersion(params, options = {}) {
  return sha256SourceBytes(serializeDropParamsSource(params, options));
}

export function getPlanVersion(planBytes) {
  return sha256SourceBytes(planBytes);
}
