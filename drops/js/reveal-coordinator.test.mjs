import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  createInitialRevealBarrier,
  isCurrentWalletProjection,
  setRegionPending
} from './reveal-coordinator.js';

function deferred() {
  let resolve;
  const promise = new Promise(resolvePromise => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function createFakeElement(initialClasses = []) {
  const classes = new Set(initialClasses);
  const attributes = new Map();

  return {
    classList: {
      contains(className) {
        return classes.has(className);
      },
      toggle(className, enabled) {
        if (enabled) classes.add(className);
        else classes.delete(className);
      }
    },
    getAttribute(name) {
      return attributes.get(name) ?? null;
    },
    setAttribute(name, value) {
      attributes.set(name, value);
    }
  };
}

// Phase 2 commits exactly once after its minimum local dependencies are ready.
{
  let commits = 0;
  const barrier = createInitialRevealBarrier(
    ['parameters', 'redeem-metadata'],
    () => { commits++; }
  );
  const slowImage = deferred();
  const slowSupply = deferred();
  const slowPause = deferred();

  assert.equal(barrier.committed, false);
  assert.equal(barrier.markReady('parameters'), false);
  assert.equal(commits, 0);
  assert.equal(barrier.markReady('redeem-metadata'), true);
  assert.equal(barrier.committed, true);
  assert.equal(commits, 1);

  slowImage.resolve('image');
  slowSupply.resolve('supply');
  slowPause.resolve('pause');
  await Promise.all([slowImage.promise, slowSupply.promise, slowPause.promise]);

  assert.equal(barrier.markReady('parameters'), false);
  assert.equal(barrier.markReady('redeem-metadata'), false);
  assert.equal(commits, 1);
}

// Phase 3 can return to pending for account changes and re-commit.
{
  const element = createFakeElement(['drops-wallet-tokens-pending']);

  setRegionPending(element, 'drops-wallet-tokens-pending', false);
  assert.equal(element.classList.contains('drops-wallet-tokens-pending'), false);
  assert.equal(element.getAttribute('aria-busy'), 'false');

  setRegionPending(element, 'drops-wallet-tokens-pending', true);
  assert.equal(element.classList.contains('drops-wallet-tokens-pending'), true);
  assert.equal(element.getAttribute('aria-busy'), 'true');

  setRegionPending(element, 'drops-wallet-tokens-pending', false);
  assert.equal(element.classList.contains('drops-wallet-tokens-pending'), false);
}

// A stale NFT generation/address can never authorize a visual commit.
assert.equal(isCurrentWalletProjection({
  generation: 4,
  address: 'tz1-current',
  currentGeneration: 4,
  currentAddress: 'tz1-current'
}), true);
assert.equal(isCurrentWalletProjection({
  generation: 3,
  address: 'tz1-old',
  currentGeneration: 4,
  currentAddress: 'tz1-current'
}), false);
assert.equal(isCurrentWalletProjection({
  generation: 4,
  address: 'tz1-old',
  currentGeneration: 4,
  currentAddress: 'tz1-current'
}), false);

const [earlyShellSource, eventsSource, dropsHtml] = await Promise.all([
  readFile(new URL('../../webflow/drops-first-paint.js', import.meta.url), 'utf8'),
  readFile(new URL('./events.js', import.meta.url), 'utf8'),
  readFile(new URL('../index.html', import.meta.url), 'utf8')
]);

// PERF-3B remains independent, while its masks now retain Phase 1 structure.
assert.match(earlyShellSource, /import '..\/shared\/public-first-paint\.js'/);
assert.match(earlyShellSource, /\.drops-params-pending :is\(/);
assert.match(earlyShellSource, /\.drops-preview-pending \.event-cart-redeem-token-div-main :is\(/);
assert.match(earlyShellSource, /\.drops-wallet-tokens-pending :is\(/);
assert.doesNotMatch(
  earlyShellSource,
  /\.drops-params-pending,\s*\nbody\.first-paint-main \.drops-preview-pending/
);
assert.doesNotMatch(
  earlyShellSource,
  /\.drops-wallet-tokens-pending \{\s*\n\s*visibility: hidden/
);
assert.doesNotMatch(earlyShellSource, /\.events-header-div/);
assert.match(dropsHtml, /drop-details-main-container drops-params-pending/);
assert.match(dropsHtml, /events-cart-token-div-main drops-preview-pending/);
assert.match(dropsHtml, /events-wallet-ui-div drops-wallet-tokens-pending/);

// Phase 2 starts image/supply work in parallel, then reveals local authority.
const imageStart = eventsSource.indexOf('const imagePromise = resolveRedeemImage(row)');
const supplyStart = eventsSource.indexOf('const supplyPromise = resolveInitialRedeemSupply()');
const metadataCommit = eventsSource.indexOf(
  'commitInitialRedeemMetadata(container, metadata)',
  imageStart
);
assert.ok(imageStart > -1 && supplyStart > -1 && metadataCommit > supplyStart);
assert.match(eventsSource, /\['parameters', 'redeem-metadata'\]/);
assert.match(eventsSource, /supplyEl\.textContent\s+=\s+'\[PENDING\]'/);
assert.match(eventsSource, /commitInitialRedeemImage[\s\S]*renderRedeemImageUnavailable/);
assert.doesNotMatch(eventsSource, /await\s+resolveRedeemImage/);
assert.doesNotMatch(eventsSource, /await\s+resolveInitialRedeemSupply/);

const countdownStart = eventsSource.indexOf('const countdownTask = startCountdown()');
const parameterReady = eventsSource.indexOf(
  "initialDropStateReveal.markReady('parameters')",
  countdownStart
);
const metadataFunction = eventsSource.slice(
  eventsSource.indexOf('function commitInitialRedeemMetadata'),
  eventsSource.indexOf('function commitInitialRedeemImage')
);
assert.ok(countdownStart > -1 && parameterReady > countdownStart);
assert.ok(
  metadataFunction.indexOf('titleEl.textContent') <
  metadataFunction.indexOf("initialDropStateReveal.markReady('redeem-metadata')")
);
assert.match(eventsSource, /async function updateRedeemSupplyDisplay\(\)/);
assert.match(eventsSource, /setCountdownText\('LIVE NOW!'\)/);
assert.match(eventsSource, /text: '\[UNAVAILABLE\]'/);

// Beacon pending is not guessed as disconnected, and NFT commits stay guarded.
const walletPendingBranch = eventsSource.slice(
  eventsSource.indexOf("walletState.status === 'pending'"),
  eventsSource.indexOf('const account = walletState.status')
);
assert.match(walletPendingBranch, /walletRefreshGeneration\+\+/);
assert.match(walletPendingBranch, /renderWalletTokenLoadingState\(\)/);
assert.doesNotMatch(walletPendingBranch, /handleWalletDisconnected/);
assert.match(eventsSource, /if \(!isCurrentWalletProjection\(\{/);
assert.match(eventsSource, /renderConnectedWalletTokenState\(eligible\.length\)/);

const disconnectedRender = eventsSource.slice(
  eventsSource.indexOf('function renderDisconnectedWalletTokenState'),
  eventsSource.indexOf('function renderConnectedWalletTokenState')
);
assert.ok(
  disconnectedRender.indexOf('displayDefaultTokens()') <
  disconnectedRender.indexOf('terminal: true')
);

const connectedProjection = eventsSource.slice(
  eventsSource.indexOf('async function updateTokensWithWalletData'),
  eventsSource.indexOf('// EVENT CART UPDATES')
);
assert.ok(
  connectedProjection.indexOf('updateOwnedTokenCounts(nfts)') <
  connectedProjection.indexOf('renderConnectedWalletTokenState(eligible.length)')
);

const connectedHandler = eventsSource.slice(
  eventsSource.indexOf('function handleWalletConnected'),
  eventsSource.indexOf('function handleWalletDisconnected')
);
assert.match(connectedHandler, /renderWalletTokenLoadingState\(\{ clearRows: true \}\)/);
assert.match(eventsSource, /if \(terminal\) setWalletTokenRegionPending\(false\)/);

console.log('Drops coordinated region reveal tests passed.');
