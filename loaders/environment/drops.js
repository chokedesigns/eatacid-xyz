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

function startDropsBundles({
  importModule = importBundle,
  logger = console
} = {}) {
  const firstPaintLoad = startBundleImport(
    importModule,
    "./drops-first-paint.js",
    "drops first-paint",
    logger
  );
  const dropsLoad = startBundleImport(
    importModule,
    "./drops.js",
    "drops",
    logger
  );

  return { firstPaintLoad, dropsLoad };
}

if (typeof window !== "undefined") {
  startDropsBundles();
}

export { startDropsBundles };
