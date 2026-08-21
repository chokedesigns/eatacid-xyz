import '../shared/public-first-paint.js';

const STATE_KEY = '__EA_DROPS_EARLY_FIRST_PAINT__';
const STYLE_ID = 'ea-drops-early-first-paint-style';
const PENDING_REGION_CSS = `
body.first-paint-main .drops-params-pending,
body.first-paint-main .drops-preview-pending,
body.first-paint-main .drops-wallet-tokens-pending {
  visibility: hidden;
  pointer-events: none;
}
`;

function installDropsEarlyShell() {
  const root = typeof window !== 'undefined' ? window : globalThis;
  const existingState = root[STATE_KEY];

  if (existingState?.started) {
    return existingState;
  }

  const state = { started: true };
  root[STATE_KEY] = state;

  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) {
    return state;
  }

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = PENDING_REGION_CSS;
  (document.head || document.documentElement).appendChild(style);

  return state;
}

const dropsEarlyShell = installDropsEarlyShell();

export { installDropsEarlyShell, dropsEarlyShell };
