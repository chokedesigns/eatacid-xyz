function importBundle(specifier) {
  return import(specifier);
}

function startDropsBundle({
  importModule = importBundle,
  logger = console
} = {}) {
  const specifier = "./drops.js";
  let bundleLoad;

  try {
    bundleLoad = Promise.resolve(importModule(specifier)).catch((err) => {
      logger.error("[EA] drops bundle load failed:", specifier, err);
      return null;
    });
  } catch (err) {
    logger.error("[EA] drops bundle load failed:", specifier, err);
    bundleLoad = Promise.resolve(null);
  }

  return { bundleLoad };
}

if (typeof window !== "undefined") {
  startDropsBundle();
}

export { startDropsBundle };
