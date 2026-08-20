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

function startHomeBundles({
  importModule = importBundle,
  logger = console
} = {}) {
  const firstPaintLoad = startBundleImport(
    importModule,
    "./first-paint.js",
    "first-paint",
    logger
  );
  const homeLoad = startBundleImport(
    importModule,
    "./home.js",
    "home",
    logger
  );

  return { firstPaintLoad, homeLoad };
}

if (typeof window !== "undefined") {
  startHomeBundles();
}

export { startHomeBundles };
