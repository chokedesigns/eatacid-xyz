const PROD_HOSTS = new Set(["eatacid.xyz", "www.eatacid.xyz"]);

function selectExchangeLoaderBase(hostname) {
  return PROD_HOSTS.has(hostname) ? "./prod" : "./staging";
}

function importEnvironmentLoader(specifier) {
  return import(specifier);
}

function startExchangeLoader({
  hostname = window.location.hostname,
  importModule = importEnvironmentLoader,
  logger = console
} = {}) {
  const base = selectExchangeLoaderBase(hostname);
  const specifier = `${base}/exchange-loader.js`;
  let loaderLoad;

  try {
    loaderLoad = Promise.resolve(importModule(specifier)).catch((err) => {
      logger.error("[EA] exchange environment loader failed:", base, err);
      return null;
    });
  } catch (err) {
    logger.error("[EA] exchange environment loader failed:", base, err);
    loaderLoad = Promise.resolve(null);
  }

  return { base, loaderLoad };
}

if (typeof window !== "undefined") {
  startExchangeLoader();
}

export { selectExchangeLoaderBase, startExchangeLoader };
