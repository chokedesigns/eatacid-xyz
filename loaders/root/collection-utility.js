const PROD_HOSTS = new Set(["eatacid.xyz", "www.eatacid.xyz"]);

function selectCollectionUtilityLoaderBase(hostname) {
  return PROD_HOSTS.has(hostname) ? "./prod" : "./staging";
}

function importEnvironmentLoader(specifier) {
  return import(specifier);
}

function startCollectionUtilityLoader({
  hostname = window.location.hostname,
  importModule = importEnvironmentLoader,
  logger = console
} = {}) {
  const base = selectCollectionUtilityLoaderBase(hostname);
  const specifier = `${base}/collection-utility-loader.js`;
  let loaderLoad;

  try {
    loaderLoad = Promise.resolve(importModule(specifier)).catch((err) => {
      logger.error("[EA] collection utility environment loader failed:", base, err);
      return null;
    });
  } catch (err) {
    logger.error("[EA] collection utility environment loader failed:", base, err);
    loaderLoad = Promise.resolve(null);
  }

  return { base, loaderLoad };
}

if (typeof window !== "undefined") {
  startCollectionUtilityLoader();
}

export { selectCollectionUtilityLoaderBase, startCollectionUtilityLoader };
