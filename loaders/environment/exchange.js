function importBundle(specifier) {
  return import(specifier);
}

function startBundleImport(importModule, specifier, label, logger) {
  try {
    return Promise.resolve(importModule(specifier)).catch((err) => {
      logger.error(`[EA] ${label} bundle load failed:`, specifier, err);
      return null;
    });
  } catch (err) {
    logger.error(`[EA] ${label} bundle load failed:`, specifier, err);
    return Promise.resolve(null);
  }
}

function startExchangeBundles({
  importModule = importBundle,
  logger = console
} = {}) {
  const firstPaintLoad = startBundleImport(
    importModule,
    "./first-paint.js",
    "first-paint",
    logger
  );
  const exchangeLoad = startBundleImport(
    importModule,
    "./exchange.js",
    "exchange",
    logger
  );

  return { firstPaintLoad, exchangeLoad };
}

if (typeof window !== "undefined") {
  startExchangeBundles();
}

export { startExchangeBundles };
