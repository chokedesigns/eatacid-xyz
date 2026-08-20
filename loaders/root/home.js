const PROD_HOSTS = new Set(["eatacid.xyz", "www.eatacid.xyz"]);

function selectHomeLoaderBase(hostname) {
  return PROD_HOSTS.has(hostname) ? "./prod" : "./staging";
}

function importEnvironmentLoader(specifier) {
  return import(specifier);
}

function startHomeLoader({
  hostname = window.location.hostname,
  importModule = importEnvironmentLoader,
  logger = console
} = {}) {
  const base = selectHomeLoaderBase(hostname);
  const specifier = `${base}/home-loader.js`;
  let loaderLoad;

  try {
    loaderLoad = Promise.resolve(importModule(specifier)).catch((err) => {
      logger.error("[EA] home environment loader failed:", base, err);
      return null;
    });
  } catch (err) {
    logger.error("[EA] home environment loader failed:", base, err);
    loaderLoad = Promise.resolve(null);
  }

  return { base, loaderLoad };
}

if (typeof window !== "undefined") {
  startHomeLoader();
}

export { selectHomeLoaderBase, startHomeLoader };
