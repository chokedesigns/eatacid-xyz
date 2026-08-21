import '../shared/public-first-paint.js';

const STATE_KEY = '__EA_DROPS_EARLY_FIRST_PAINT__';
const STYLE_ID = 'ea-drops-early-first-paint-style';
const PENDING_REGION_CSS = `
body.first-paint-main .drops-params-pending :is(
  .drop-details-drop-date-text,
  .drop-details-drop-time-text,
  .drop-details-drop-date-countdown-text,
  .drop-details-drop-date-countdown-text-mobile,
  .drop-details-burn-amount-text,
  .drop-details-burn-collection-text,
  .drop-details-exclusions-text,
  .drop-details-exclusions-text-none,
  .drop-details-redeem-amount-text,
  .drop-details-redeem-token-title-text,
  .drop-details-redeem-collection-text
),
body.first-paint-main .drops-preview-pending .event-cart-redeem-token-div-main :is(
  .collection-item-events-title-text,
  .collection-item-events-editions-text,
  .collection-item-events-collection-text,
  .supply-text-number
),
body.first-paint-main .drops-wallet-tokens-pending :is(
  .available-burn-tokens-tile-div-main,
  .no-tokens-in-walet-div---events,
  .w-dyn-list
) {
  visibility: hidden;
}

body.first-paint-main .drops-preview-pending,
body.first-paint-main .drops-wallet-tokens-pending {
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
