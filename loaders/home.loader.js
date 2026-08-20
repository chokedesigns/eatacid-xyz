const PROD_HOSTS = new Set(["eatacid.xyz", "www.eatacid.xyz"]);

function selectHomeBase(hostname) {
  return PROD_HOSTS.has(hostname) ? "./prod" : "./staging";
}

function importBundle(specifier) {
  return import(specifier);
}

function startBundleImport(importModule, specifier, label, base, logger) {
  try {
    return Promise.resolve(importModule(specifier)).catch((err) => {
      logger.error(`[EA] ${label} bundle load failed:`, base, err);
      return null;
    });
  } catch (err) {
    logger.error(`[EA] ${label} bundle load failed:`, base, err);
    return Promise.resolve(null);
  }
}

function startHomeBundles({
  hostname = window.location.hostname,
  importModule = importBundle,
  logger = console
} = {}) {
  const base = selectHomeBase(hostname);

  const firstPaintLoad = startBundleImport(
    importModule,
    `${base}/first-paint.js`,
    "first-paint",
    base,
    logger
  );
  const homeLoad = startBundleImport(
    importModule,
    `${base}/home.js`,
    "home",
    base,
    logger
  );

  return { base, firstPaintLoad, homeLoad };
}

if (typeof window !== "undefined") {
  startHomeBundles();
}

export { selectHomeBase, startHomeBundles };
