const PROD_HOSTS = new Set(["eatacid.xyz", "www.eatacid.xyz"]);

function selectDropsLoaderBase(hostname) {
  return PROD_HOSTS.has(hostname) ? "./prod" : "./staging";
}

function importEnvironmentLoader(specifier) {
  return import(specifier);
}

function startDropsLoader({
  hostname = window.location.hostname,
  importModule = importEnvironmentLoader,
  logger = console
} = {}) {
  const base = selectDropsLoaderBase(hostname);
  const specifier = `${base}/drops-loader.js`;
  let loaderLoad;

  try {
    loaderLoad = Promise.resolve(importModule(specifier)).catch((err) => {
      logger.error("[EA] drops environment loader failed:", base, err);
      return null;
    });
  } catch (err) {
    logger.error("[EA] drops environment loader failed:", base, err);
    loaderLoad = Promise.resolve(null);
  }

  return { base, loaderLoad };
}

if (typeof window !== "undefined") {
  startDropsLoader();
}

export { selectDropsLoaderBase, startDropsLoader };
