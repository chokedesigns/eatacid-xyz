export function createPublicLogger({ enabled = false, scope = '' } = {}) {
  return {
    scope,
    log: (...args) => {
      if (enabled) console.log(...args);
    },
    debug: (...args) => {
      if (!enabled) return;
      if (console.debug) {
        console.debug(...args);
      } else {
        console.log(...args);
      }
    },
    groupCollapsed: (...args) => {
      if (enabled && console.groupCollapsed) console.groupCollapsed(...args);
    },
    groupEnd: () => {
      if (enabled && console.groupEnd) console.groupEnd();
    },
    warn: (...args) => console.warn(...args),
    error: (...args) => console.error(...args),
  };
}
