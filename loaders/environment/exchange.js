function importBundle(specifier) {
  return import(specifier);
}

function startExchangeBundle({
  importModule = importBundle,
  logger = console
} = {}) {
  const specifier = "./exchange.js";
  let bundleLoad;

  try {
    bundleLoad = Promise.resolve(importModule(specifier)).catch((err) => {
      logger.error("[EA] exchange bundle load failed:", specifier, err);
      return null;
    });
  } catch (err) {
    logger.error("[EA] exchange bundle load failed:", specifier, err);
    bundleLoad = Promise.resolve(null);
  }

  return { bundleLoad };
}

if (typeof window !== "undefined") {
  startExchangeBundle();
}

export { startExchangeBundle };
