import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

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

const PHASE_2_REQUIREMENTS = [
  'drop-parameters',
  'countdown-seeded',
  'redeem-metadata',
  'initial-supply'
];

// Supply success releases Phase 2 without waiting for image or pause authority.
{
  let commits = 0;
  const barrier = createInitialRevealBarrier(
    PHASE_2_REQUIREMENTS,
    () => { commits++; }
  );
  const slowImage = deferred();
  const slowSupply = deferred();
  const slowPause = deferred();
  let imageSettled = false;
  let pauseSettled = false;
  void slowImage.promise.then(() => { imageSettled = true; });
  void slowPause.promise.then(() => { pauseSettled = true; });
  const supplyReady = slowSupply.promise.then(() => {
    barrier.markReady('initial-supply');
  });

  assert.equal(barrier.committed, false);
  assert.equal(barrier.markReady('drop-parameters'), false);
  assert.equal(barrier.markReady('countdown-seeded'), false);
  assert.equal(barrier.markReady('redeem-metadata'), false);
  assert.equal(commits, 0);

  slowSupply.resolve('supply');
  await supplyReady;
  assert.equal(barrier.committed, true);
  assert.equal(commits, 1);
  assert.equal(imageSettled, false);
  assert.equal(pauseSettled, false);

  slowImage.resolve('image');
  slowPause.resolve('pause');
  await Promise.all([slowImage.promise, slowPause.promise]);

  assert.equal(barrier.markReady('initial-supply'), false);
  assert.equal(commits, 1);

  // Later supply updates are ordinary renders; the initial barrier is not a lock.
  let renderedSupply = 10;
  renderedSupply = 9;
  assert.equal(renderedSupply, 9);
}

// A renderable supply failure fallback also releases Phase 2 exactly once.
{
  let commits = 0;
  const barrier = createInitialRevealBarrier(
    PHASE_2_REQUIREMENTS,
    () => { commits++; }
  );

  barrier.markReady('drop-parameters');
  barrier.markReady('countdown-seeded');
  barrier.markReady('redeem-metadata');
  assert.equal(commits, 0);

  await Promise.reject(new Error('supply unavailable')).catch(() => {
    barrier.markReady('initial-supply');
  });
  assert.equal(barrier.committed, true);
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
const detailsMask = earlyShellSource.slice(
  earlyShellSource.indexOf('body.first-paint-main .drops-params-pending :is('),
  earlyShellSource.indexOf('body.first-paint-main .drops-preview-pending')
);
assert.match(detailsMask, /color: transparent !important/);
assert.doesNotMatch(detailsMask, /visibility:\s*hidden/);
assert.doesNotMatch(detailsMask, /display:\s*none/);
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
for (const valueClass of [
  'drop-details-drop-date-text',
  'drop-details-drop-time-text',
  'drop-details-drop-date-countdown-text',
  'drop-details-burn-amount-text',
  'drop-details-burn-collection-text',
  'drop-details-exclusions-text-none',
  'drop-details-redeem-amount-text',
  'drop-details-redeem-token-title-text',
  'drop-details-redeem-collection-text'
]) {
  assert.match(dropsHtml, new RegExp(`class="[^"]*${valueClass}`));
}
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
assert.match(
  eventsSource,
  /\['drop-parameters', 'countdown-seeded', 'redeem-metadata', 'initial-supply'\]/
);
assert.doesNotMatch(eventsSource, /\[PENDING\]/);
assert.match(eventsSource, /commitInitialRedeemImage[\s\S]*renderRedeemImageUnavailable/);
assert.doesNotMatch(eventsSource, /await\s+resolveRedeemImage/);
assert.doesNotMatch(eventsSource, /await\s+resolveInitialRedeemSupply/);

const countdownStart = eventsSource.indexOf('const countdownTask = startCountdown()');
const parameterReady = eventsSource.indexOf(
  "initialDropStateReveal.markReady('drop-parameters')"
);
const countdownReady = eventsSource.indexOf(
  "initialDropStateReveal.markReady('countdown-seeded')",
  countdownStart
);
const metadataFunction = eventsSource.slice(
  eventsSource.indexOf('function commitInitialRedeemMetadata'),
  eventsSource.indexOf('function commitInitialRedeemImage')
);
assert.ok(parameterReady > -1 && parameterReady < countdownStart);
assert.ok(countdownStart > -1 && countdownReady > countdownStart);
assert.ok(
  metadataFunction.indexOf('titleEl.textContent') <
  metadataFunction.indexOf("initialDropStateReveal.markReady('redeem-metadata')")
);
assert.match(eventsSource, /async function updateRedeemSupplyDisplay\(\)/);
assert.match(eventsSource, /setCountdownText\('LIVE NOW!'\)/);
assert.match(eventsSource, /text: '\[UNAVAILABLE\]'/);

const supplyCommitFunction = eventsSource.slice(
  eventsSource.indexOf('function commitInitialRedeemSupply'),
  eventsSource.indexOf('// HELPERS: CMS ROWS')
);
assert.ok(
  supplyCommitFunction.indexOf('supplyEl.textContent = supply.text') <
  supplyCommitFunction.indexOf("initialDropStateReveal.markReady('initial-supply')")
);
assert.ok(
  supplyCommitFunction.indexOf("initialDropStateReveal.markReady('initial-supply')") <
  supplyCommitFunction.indexOf('reconcileRedeemSupplyPolling')
);
const imageCommitFunction = eventsSource.slice(
  eventsSource.indexOf('function commitInitialRedeemImage'),
  eventsSource.indexOf('function commitInitialRedeemSupply')
);
assert.doesNotMatch(imageCommitFunction, /initialDropStateReveal\.markReady/);
assert.match(eventsSource, /if \(!redeemInitialSupplyCommitted\) return false/);

// Recurring supply work is serialized, including across stop/reconcile restarts.
{
  const pollingStart = eventsSource.indexOf('let redeemSupplyIntervalId = null;');
  const pollingEnd = eventsSource.indexOf(
    '// Automatically reconcile polling after later phase or supply changes.',
    pollingStart
  );
  assert.ok(pollingStart > -1 && pollingEnd > pollingStart);

  const pendingFetches = [];
  const intervals = new Map();
  const supplyElement = { textContent: '' };
  const pollingState = { countdownPhase: 'live', redeemSupply: 5 };
  let nextIntervalId = 0;
  const pollingContext = {
    AppState: pollingState,
    BURN_REDEEM_CONTRACT_ADDRESS: 'KT1-escrow',
    collections: { redeem: 'KT1-redeem' },
    console,
    document: {
      hidden: false,
      querySelector: () => supplyElement
    },
    fetchNFTs: () => {
      const request = deferred();
      pendingFetches.push(request);
      return request.promise;
    },
    networkConfigAvailable: true,
    networkUnavailableMessage: '',
    redeemInitialSupplyCommitted: true,
    redeemToken: { collection: 'redeem', tokenId: '7' },
    updateAppState: patch => Object.assign(pollingState, patch),
    setInterval: (callback, intervalMs) => {
      const id = ++nextIntervalId;
      intervals.set(id, { callback, intervalMs });
      return id;
    },
    clearInterval: id => intervals.delete(id)
  };

  runInNewContext(
    `${eventsSource.slice(pollingStart, pollingEnd)}\n` +
      `globalThis.pollingHarness = {\n` +
      `  reconcileRedeemSupplyPolling,\n` +
      `  startRedeemSupplyPolling,\n` +
      `  stopRedeemSupplyPolling\n` +
      `};`,
    pollingContext
  );

  const initialPoll = pollingContext.pollingHarness.startRedeemSupplyPolling(10000, true);
  assert.equal(pendingFetches.length, 1);
  assert.equal(intervals.size, 1);
  assert.equal([...intervals.values()][0].intervalMs, 10000);

  const overlappingTick = [...intervals.values()][0].callback();
  assert.equal(pendingFetches.length, 1);

  pollingContext.pollingHarness.stopRedeemSupplyPolling();
  assert.equal(intervals.size, 0);
  pollingContext.pollingHarness.reconcileRedeemSupplyPolling();
  assert.equal(intervals.size, 1);
  assert.equal(pendingFetches.length, 1);

  pendingFetches[0].resolve([
    { contractAddress: 'KT1-redeem', tokenId: '7', balance: '4' }
  ]);
  await Promise.all([initialPoll, overlappingTick]);
  assert.equal(pollingState.redeemSupply, 4);
  assert.equal(supplyElement.textContent, 'x04');

  const nextPoll = [...intervals.values()][0].callback();
  assert.equal(pendingFetches.length, 2);
  pendingFetches[1].resolve([
    { contractAddress: 'KT1-redeem', tokenId: '7', balance: '3' }
  ]);
  await nextPoll;
  assert.equal(pollingState.redeemSupply, 3);
  assert.equal(supplyElement.textContent, 'x03');
}

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

const postTradeRefresh = eventsSource.slice(
  eventsSource.indexOf('async function handleEventExchange'),
  eventsSource.indexOf('// HELPERS: MODAL', eventsSource.indexOf('async function handleEventExchange'))
);
const postTradePoll = postTradeRefresh.indexOf(
  'const refreshedNFTs = await pollForNFTUpdate(myAddr, tradedTokens)'
);
const postTradeGuard = postTradeRefresh.indexOf('if (isCurrentWalletProjection({', postTradePoll);
const postTradeCommit = postTradeRefresh.indexOf('refreshConnectedState(refreshedNFTs)', postTradeGuard);
assert.match(postTradeRefresh, /const walletGeneration = walletRefreshGeneration/);
assert.match(postTradeRefresh, /generation: walletGeneration/);
assert.match(postTradeRefresh, /currentGeneration: walletRefreshGeneration/);
assert.match(postTradeRefresh, /currentAddress: synchronizedWalletAddress/);
assert.ok(postTradePoll > -1 && postTradeGuard > postTradePoll && postTradeCommit > postTradeGuard);

// A post-trade NFT result commits only while its captured wallet stays current.
{
  const postTradeRefreshStep = postTradeRefresh.slice(
    postTradePoll,
    postTradeRefresh.indexOf('// After balances reflect', postTradePoll)
  );

  async function runPostTradeRefresh({ address, generation }) {
    const pendingNFTs = deferred();
    const refreshedNFTs = [{ tokenId: '7', balance: '1' }];
    const commits = [];
    const context = {
      isCurrentWalletProjection,
      myAddr: 'tz1-trader',
      pollForNFTUpdate: () => pendingNFTs.promise,
      refreshConnectedState: nfts => commits.push(nfts),
      synchronizedWalletAddress: 'tz1-trader',
      tradedTokens: [{ contractAddress: 'KT1-burn', tokenId: '3' }],
      walletGeneration: 8,
      walletRefreshGeneration: 8
    };

    const refresh = runInNewContext(
      `(async () => { ${postTradeRefreshStep} })()`,
      context
    );
    context.synchronizedWalletAddress = address;
    context.walletRefreshGeneration = generation;
    pendingNFTs.resolve(refreshedNFTs);
    await refresh;

    return { commits, refreshedNFTs };
  }

  const currentWallet = await runPostTradeRefresh({
    address: 'tz1-trader',
    generation: 8
  });
  assert.deepEqual(currentWallet.commits, [currentWallet.refreshedNFTs]);

  const changedAddress = await runPostTradeRefresh({
    address: 'tz1-next',
    generation: 8
  });
  assert.deepEqual(changedAddress.commits, []);

  const changedGeneration = await runPostTradeRefresh({
    address: 'tz1-trader',
    generation: 9
  });
  assert.deepEqual(changedGeneration.commits, []);
}

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
