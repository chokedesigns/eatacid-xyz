// =============================================================================
// SHARED: Public first-paint coordinator
// =============================================================================

import { network } from './network.js';

const STATE_KEY = '__EA_PUBLIC_FIRST_PAINT__';
const STYLE_ID = 'ea-public-first-paint-style';
const TESTNET_BANNER_HEIGHT = '35px';
const HOME_HERO_IMAGE_SELECTOR = '.home-hero-character-image';

// Keep first paint bounded: if critical webfonts are not ready within 1000ms,
// reveal the page using fallback state instead of waiting indefinitely.
const FONT_READY_TIMEOUT_MS = 1000;
const HOME_HERO_IMAGE_READY_TIMEOUT_MS = 1200;
const FAIL_OPEN_TIMEOUT_MS = FONT_READY_TIMEOUT_MS + 300;
const FONT_CHECK_INTERVAL_MS = 50;

const CRITICAL_FONT_LOADS = [
  'normal 400 1em "Changa One"',
  'italic 400 1em "Changa One"',
  'normal 400 1em "Inconsolata"',
  'normal 700 1em "Inconsolata"'
];

const REVEAL_CSS = `
body.first-paint-main .first-paint-testnet-banner {
  height: 0;
  opacity: 0;
  overflow: hidden;
  pointer-events: none;
  transition: height 180ms ease, opacity 150ms ease;
}

body.first-paint-main .first-paint-testnet-text {
  opacity: 0;
  transition: opacity 90ms ease 125ms;
}

body.first-paint-main .first-paint-surface {
  transition: opacity 220ms ease;
}

body.first-paint-main.is-testnet .first-paint-testnet-banner {
  will-change: height, opacity;
}

body.first-paint-main.is-testnet .home-viewport {
  block-size: calc(100svh - 125px);
}

body.first-paint-main.is-first-paint-ready .first-paint-chrome,
body.first-paint-main.is-first-paint-fallback .first-paint-chrome {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transition: none;
}

body.first-paint-main.is-first-paint-ready .first-paint-surface,
body.first-paint-main.is-first-paint-fallback .first-paint-surface {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

body.first-paint-main.is-testnet.is-first-paint-ready .first-paint-surface {
  transition-delay: 40ms;
}

body.first-paint-main.is-testnet.is-first-paint-ready .first-paint-testnet-banner {
  height: ${TESTNET_BANNER_HEIGHT};
  opacity: 1;
}

body.first-paint-main.is-testnet.is-first-paint-ready .first-paint-testnet-text {
  opacity: 1;
}

body.first-paint-main.is-first-paint-fallback .first-paint-testnet-banner,
body.first-paint-main.is-first-paint-fallback .first-paint-testnet-text,
body.first-paint-main.is-first-paint-fallback .first-paint-surface {
  transition: none;
}

body.first-paint-main.is-testnet.is-first-paint-fallback .first-paint-testnet-banner {
  height: ${TESTNET_BANNER_HEIGHT};
  opacity: 1;
}

body.first-paint-main.is-testnet.is-first-paint-fallback .first-paint-testnet-text {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  body.first-paint-main .first-paint-testnet-banner,
  body.first-paint-main .first-paint-testnet-text,
  body.first-paint-main .first-paint-surface {
    transition-duration: 1ms;
    transition-delay: 0ms;
  }
}
`;

function getRoot() {
  return typeof window !== 'undefined' ? window : globalThis;
}

function getBody() {
  return typeof document !== 'undefined' ? document.body : null;
}

function injectRevealStyles() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = REVEAL_CSS;
  (document.head || document.documentElement).appendChild(style);
}

function delay(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

function nextFrame() {
  if (typeof requestAnimationFrame !== 'function') {
    return delay(0);
  }

  return new Promise(resolve => {
    requestAnimationFrame(() => resolve());
  });
}

async function waitForCriticalFonts() {
  if (typeof document === 'undefined' || !document.fonts?.load) {
    return 'fonts-unavailable';
  }

  const fontVerificationPromise = verifyCriticalFontsUntilReady()
    .then(ready => ready ? 'fonts-ready' : 'fonts-timeout');

  return Promise.race([
    fontVerificationPromise,
    delay(FONT_READY_TIMEOUT_MS).then(() => 'fonts-timeout')
  ]);
}

async function verifyCriticalFontsUntilReady() {
  const startedAt = Date.now();

  while (Date.now() - startedAt < FONT_READY_TIMEOUT_MS) {
    if (await areCriticalFontsReady()) {
      return true;
    }

    await delay(FONT_CHECK_INTERVAL_MS);
  }

  return false;
}

async function areCriticalFontsReady() {
  const results = await Promise.all(
    CRITICAL_FONT_LOADS.map(font => isFontDescriptorReady(font))
  );

  return results.every(Boolean);
}

async function isFontDescriptorReady(font) {
  try {
    const faces = await document.fonts.load(font);
    const hasMatchingFace = Array.isArray(faces) && faces.length > 0;
    const passesFontCheck =
      typeof document.fonts.check !== 'function' || document.fonts.check(font);

    return hasMatchingFace && passesFontCheck;
  } catch {
    return false;
  }
}

async function waitForHomeHeroImage(body) {
  const image = body.querySelector(HOME_HERO_IMAGE_SELECTOR);

  if (!image) {
    return 'hero-not-required';
  }

  return Promise.race([
    waitForImagePaintReady(image),
    delay(HOME_HERO_IMAGE_READY_TIMEOUT_MS).then(() => 'hero-timeout')
  ]);
}

async function waitForImagePaintReady(image) {
  const loadStatus = isLoadedImage(image)
    ? 'hero-loaded'
    : await waitForImageLoad(image);

  if (loadStatus !== 'hero-loaded') {
    return loadStatus;
  }

  const decoded = await decodeImage(image);

  if (!decoded) {
    return 'hero-decode-failed';
  }

  await nextFrame();
  return 'hero-ready';
}

function isLoadedImage(image) {
  return image.complete && image.naturalWidth > 0;
}

function waitForImageLoad(image) {
  return new Promise(resolve => {
    if (isLoadedImage(image)) {
      resolve('hero-loaded');
      return;
    }

    if (image.complete) {
      resolve('hero-error');
      return;
    }

    const cleanup = () => {
      image.removeEventListener('load', onLoad);
      image.removeEventListener('error', onError);
    };
    const onLoad = () => {
      cleanup();
      resolve(isLoadedImage(image) ? 'hero-loaded' : 'hero-error');
    };
    const onError = () => {
      cleanup();
      resolve('hero-error');
    };

    image.addEventListener('load', onLoad, { once: true });
    image.addEventListener('error', onError, { once: true });
  });
}

async function decodeImage(image) {
  if (typeof image.decode !== 'function') {
    return true;
  }

  try {
    await image.decode();
    return true;
  } catch {
    return false;
  }
}

function applyNetworkState(body) {
  if (network === 'testnet') {
    body.classList.add('is-testnet');
    return;
  }

  body.classList.remove('is-testnet');
}

function forceInlineReveal(body) {
  const chromeElements = body.querySelectorAll('.first-paint-chrome');
  const surfaceElements = body.querySelectorAll('.first-paint-surface');
  const banner = body.querySelector('.first-paint-testnet-banner');
  const bannerText = body.querySelector('.first-paint-testnet-text');

  chromeElements.forEach(element => {
    element.style.opacity = '1';
    element.style.visibility = 'visible';
    element.style.pointerEvents = 'auto';
  });

  surfaceElements.forEach(element => {
    element.style.opacity = '1';
    element.style.visibility = 'visible';
    element.style.pointerEvents = 'auto';
  });

  if (body.classList.contains('is-testnet')) {
    if (banner) {
      banner.style.height = TESTNET_BANNER_HEIGHT;
      banner.style.opacity = '1';
      banner.style.overflow = 'hidden';
    }

    if (bannerText) {
      bannerText.style.opacity = '1';
    }
  }
}

function reveal(body, state, fallback = false) {
  if (!body || state.ready) {
    return;
  }

  state.ready = true;

  if (state.failOpenTimer) {
    clearTimeout(state.failOpenTimer);
    state.failOpenTimer = null;
  }

  if (fallback) {
    state.fallback = true;
    body.classList.add('is-first-paint-fallback');
  }

  body.classList.add('is-first-paint-ready');
}

function failOpen(body, state, error = null) {
  if (error) {
    console.error('[EA] public first paint failed open:', error);
  }

  applyNetworkState(body);
  reveal(body, state, true);
  forceInlineReveal(body);
}

async function runFirstPaint(body, state) {
  if (!body.classList.contains('first-paint-main')) {
    return;
  }

  injectRevealStyles();
  applyNetworkState(body);

  state.failOpenTimer = setTimeout(() => {
    failOpen(body, state);
  }, FAIL_OPEN_TIMEOUT_MS);

  await nextFrame();

  const [fontStatus, heroStatus] = await Promise.all([
    waitForCriticalFonts(),
    waitForHomeHeroImage(body)
  ]);
  const heroReady = heroStatus === 'hero-not-required' || heroStatus === 'hero-ready';
  reveal(body, state, fontStatus !== 'fonts-ready' || !heroReady);
}

function startPublicFirstPaint() {
  const root = getRoot();
  const existingState = root[STATE_KEY];

  if (existingState?.started) {
    return existingState;
  }

  const state = {
    started: true,
    ready: false,
    fallback: false,
    failOpenTimer: null
  };

  root[STATE_KEY] = state;

  try {
    const body = getBody();

    if (body) {
      void runFirstPaint(body, state).catch(error => {
        failOpen(body, state, error);
      });
      return state;
    }

    if (typeof document === 'undefined') {
      return state;
    }

    document.addEventListener('DOMContentLoaded', () => {
      const readyBody = getBody();
      if (readyBody) {
        void runFirstPaint(readyBody, state).catch(error => {
          failOpen(readyBody, state, error);
        });
      }
    }, { once: true });
  } catch (error) {
    const body = getBody();
    if (body) {
      failOpen(body, state, error);
    } else {
      throw error;
    }
  }

  return state;
}

const publicFirstPaint = startPublicFirstPaint();

export {
  FONT_READY_TIMEOUT_MS,
  HOME_HERO_IMAGE_READY_TIMEOUT_MS,
  startPublicFirstPaint,
  publicFirstPaint
};
