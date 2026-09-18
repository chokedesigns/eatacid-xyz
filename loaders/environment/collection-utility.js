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

function startCollectionUtilityBundles({
  importModule = importBundle,
  logger = console
} = {}) {
  const firstPaintLoad = startBundleImport(
    importModule,
    "./first-paint.js",
    "first-paint",
    logger
  );
  const collectionUtilityLoad = startBundleImport(
    importModule,
    "./collection-utility.js",
    "collection utility",
    logger
  );

  return { firstPaintLoad, collectionUtilityLoad };
}

if (typeof window !== "undefined") {
  startCollectionUtilityBundles();
}

export { startCollectionUtilityBundles };
