const PROD_HOSTS = new Set(["eatacid.xyz", "www.eatacid.xyz"]);

const base = PROD_HOSTS.has(window.location.hostname) ? "./prod" : "./staging";

import(`${base}/drops.js`).catch((err) => {
  console.error("[EA] drops bundle load failed:", base, err);
});