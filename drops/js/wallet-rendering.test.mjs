import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import vm from 'node:vm';
import test from 'node:test';
import { resolveBurnTokenRenderIdentities } from './token-rendering.js';
import { isCurrentWalletProjection, setRegionPending } from './reveal-coordinator.js';
import { pollForNFTUpdate as pollForSharedNFTUpdate } from '../../shared/public-trade-ops.js';

// Run the page's current functions against inert CMS, wallet and indexer boundaries.
const root = process.env.EA_T005_SOURCE_ROOT
  ? pathToFileURL(`${process.env.EA_T005_SOURCE_ROOT}/`)
  : new URL('../../', import.meta.url);
const source = readFileSync(new URL('drops/js/events.js', root), 'utf8').replace(/\r\n?/g, '\n');
function section(start, end) {
  const begin = source.indexOf(start);
  const finish = source.indexOf(end, begin);
  assert.ok(begin >= 0 && finish > begin, `Missing page source anchors: ${start}, ${end}`);
  return source.slice(begin, finish);
}

class Element {
  constructor(classes = '', text = '') {
    this.classes = new Set(classes.split(' ').filter(Boolean));
    this.textContent = text;
    this.dataset = {};
    this.style = {};
    this.children = [];
    this.checked = false;
    this.classList = { toggle: (name, enabled) => enabled ? this.classes.add(name) : this.classes.delete(name) };
  }
  matches(selector) {
    const classes = [...selector.matchAll(/\.([\w-]+)/g)].map(match => match[1]);
    if (!classes.every(name => this.classes.has(name))) return false;
    if (selector.includes(':checked') && !this.checked) return false;
    for (const [, attr, value] of selector.matchAll(/\[([\w-]+)(?:="([^"]*)")?\]/g)) {
      const actual = this.getAttribute(attr);
      if (actual == null || (value !== undefined && value !== actual)) return false;
    }
    return true;
  }
  querySelectorAll(selector) {
    const parts = selector.split(/\s+/);
    const result = [];
    const walk = node => {
      for (const child of node.children) {
        if (child.matches(parts.at(-1))) {
          let parent = child.parent;
          let index = parts.length - 2;
          while (parent && index >= 0) {
            if (parent.matches(parts[index])) index--;
            parent = parent.parent;
          }
          if (index < 0) result.push(child);
        }
        walk(child);
      }
    };
    walk(this);
    return result;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  closest(selector) { return this.matches(selector) ? this : this.parent?.closest(selector); }
  appendChild(child) { child.remove(); child.parent = this; this.children.push(child); return child; }
  removeChild(child) { this.children.splice(this.children.indexOf(child), 1); child.parent = null; }
  remove() { this.parent?.removeChild(this); }
  get firstChild() { return this.children[0]; }
  set innerHTML(value) { assert.equal(value, ''); while (this.firstChild) this.removeChild(this.firstChild); }
  getAttribute(name) {
    return name.startsWith('data-') ? this.dataset[name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] : this[name];
  }
  setAttribute(name, value) {
    if (name.startsWith('data-')) this.dataset[name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = String(value);
    else this[name] = String(value);
  }
  cloneNode(deep) {
    const clone = new Element([...this.classes].join(' '), this.textContent);
    Object.assign(clone.dataset, this.dataset); Object.assign(clone.style, this.style);
    clone.checked = this.checked;
    if (deep) this.children.forEach(child => clone.appendChild(child.cloneNode(true)));
    return clone;
  }
}
function row(id) {
  const wrapper = new Element('collection-item-01 w-dyn-item');
  wrapper.appendChild(new Element('token-id-number', id));
  wrapper.appendChild(new Element('collection-item-title-text', `Canonical ${id}`));
  wrapper.appendChild(new Element('collection-item-owned-text', '00'));
  wrapper.appendChild(new Element('w-checkbox-input events_checkbox'));
  return wrapper;
}
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const flush = () => new Promise(resolve => setImmediate(resolve));
const nft = (tokenId, collection = 'HEN', balance = 2) => ({ contractAddress: `contract-${collection}`, tokenId, balance });

function fixture({ enabled = ['HEN', 'INTRODUCTIONS'] } = {}) {
  const document = new Element(); document.addEventListener = () => {};
  const wallet = document.appendChild(new Element('events-wallet-ui-div'));
  const panes = {};
  for (const [key, slug, ids] of [['HEN', 'hen', ['94684', '103062', '104492']], ['INTRODUCTIONS', 'intros', ['7', '8']]]) {
    panes[key] = wallet.appendChild(new Element(`${slug}-collection w-dyn-list`));
    const items = panes[key].appendChild(new Element('w-dyn-items'));
    ids.forEach(id => items.appendChild(row(id)));
  }
  const metadata = document.appendChild(new Element('canaan-collection w-dyn-list'));
  metadata.appendChild(row('29'));
  const heading = wallet.appendChild(new Element('available-burn-tokens-exchange-text'));
  const spinner = wallet.appendChild(new Element('available-token-ui-loading---events'));
  const empty = wallet.appendChild(new Element('no-tokens-in-walet-div---events'));
  const state = { activeAccount: null, walletConnected: false, selectedTokenId: null };
  const window = { getComputedStyle: el => el.style };
  const errors = [], requests = [];
  const context = vm.createContext({
    window, document, AppState: state, updateAppState: patch => Object.assign(state, patch),
    collections: { HEN: 'contract-HEN', INTRODUCTIONS: 'contract-INTRODUCTIONS', CANAAN: 'contract-CANAAN' },
    burnTokens: ['HEN', 'INTRODUCTIONS'].map(collection => ({ collection, enabled: enabled.includes(collection),
      burnAmount: 2, exclude: collection === 'HEN' ? ['103062'] : [] })),
    tokenMapping: { HEN: { '94684': '0', '103062': '1', '104492': '2' }, INTRODUCTIONS: {} },
    normalizeString: value => String(value ?? '').trim().toLowerCase(),
    logger: { log() {} }, console: { error: (...args) => errors.push(args) },
    setRegionPending, isCurrentWalletProjection, resolveBurnTokenRenderIdentities,
    updateEventCartBurnToken() {}, clearInterval() {}, PUBLIC_WALLET_STATE_EVENT: 'publicWalletStateChanged',
    fetchNFTs: address => { const task = deferred(); requests.push({ address, ...task }); return task.promise; },
  });
  const captureStart = source.includes('let canonicalCMSRowsByCollection')
    ? 'let canonicalCMSRowsByCollection' : 'function setEventContractAndTokenAttributes(';
  vm.runInContext([
    section('function getCollectionSlug(', '// ── Network'),
    section('function getBurnAmountForContract(', '/**\n * Returns the one selected'),
    section('function findCMSRows(', '// HELPERS: BLOCKCHAIN'),
    section('function computeBalances(', '// HELPERS: FA2'),
    section(source.includes('async function refreshConnectedState(') ? 'async function refreshConnectedState('
      : 'function refreshConnectedState(', '// HELPERS: REDEEM'),
    section(captureStart, '// DROP DETAILS RENDERING'),
    section('function renderBalances(', '// EVENT CART UPDATES'),
    section('function displayDefaultTokens(', '// COUNTDOWN & CONTRACT'),
    section('let synchronizedWalletAddress', 'document.addEventListener(PUBLIC_WALLET_STATE_EVENT'),
  ].join('\n'), context);
  const call = code => vm.runInContext(code, context);
  call('setEventContractAndTokenAttributes()');
  const templates = window.cmsRowsByCollection;
  const ids = key => panes[key].querySelectorAll('[data-token-id]').map(el => el.dataset.tokenId);
  const connect = (address, promise) => context.synchronizeDropsWalletState({ status: 'connected', account: { address }, nftsPromise: promise });
  const disconnect = () => context.synchronizeDropsWalletState({ status: 'unconnected', account: null });
  return { context, call, window, document, wallet, panes, metadata, state, errors, requests, heading, spinner, empty,
    templates, ids, connect, disconnect };
}
function assertCanonical(h) {
  assert.ok(h.window.cmsRowsByCollection === h.templates, 'Canonical template map retains its identity');
  assert.ok(Object.isFrozen(h.templates));
  assert.deepEqual(Array.from(h.templates.HEN, el => el.dataset.tokenId), ['94684', '103062', '104492']);
  assert.deepEqual(Array.from(h.templates.INTRODUCTIONS, el => el.dataset.tokenId), ['7', '8']);
  for (const rows of Object.values(h.templates)) {
    assert.ok(Object.isFrozen(rows));
    for (const el of rows) {
      assert.equal(el.parent, undefined, 'Canonical templates stay detached from wallet DOM');
      assert.equal(el.querySelector('.token-id-number').textContent, el.dataset.tokenId);
      assert.equal(el.querySelector('.collection-item-title-text').textContent, `Canonical ${el.dataset.tokenId}`);
      assert.equal(el.querySelector('.collection-item-owned-text').textContent, '00');
      assert.equal(el.querySelector('.w-checkbox-input.events_checkbox').checked, false);
    }
  }
}
function assertPending(h) {
  for (const pane of Object.values(h.panes)) assert.equal(pane.style.display, 'none');
  assert.equal(h.wallet['aria-busy'], 'true'); assert.equal(h.spinner.style.display, 'flex');
}

function tradeFixture(h, { confirmation = Promise.resolve(), holdings = [nft('0', 'HEN', 5)] } = {}) {
  const modals = [];
  Object.assign(h.context, {
    getVerifiedPublicActiveAccount: async () => h.state.activeAccount,
    getSelectedEventTokenWithBalance: () => ({ contractAddress: 'contract-HEN', tokenId: '0', oldBalance: 5 }),
    buildApprovalOps: async () => [], fetchTokenPairId: async () => '11',
    redeemToken: { collection: 'CANAAN', tokenId: '29', redeemAmount: 1 },
    REDEEM_CONTRACT_ADDRESS: 'contract-CANAAN', BURN_REDEEM_CONTRACT_ADDRESS: 'escrow',
    networkConfigAvailable: true, network: 'testnet', showModal: (...args) => modals.push(args), hideModal() {},
    resetEventsUI() {}, setTimeout() {}, pollForConfirmation: () => confirmation,
    pollForSharedNFTUpdate: args => pollForSharedNFTUpdate({ ...args, timeout: 0, interval: 0 }),
    fetchNFTs: async () => holdings,
  });
  h.window.dAppClient = { requestOperation: async () => ({ transactionHash: 'inert-hash' }) };
  h.document.appendChild(new Element('loading-modal-div'));
  vm.runInContext([
    section('async function pollForNFTUpdate(', '// HELPERS: UI RESET'),
    section('let eventExchangeInFlight', '// UI STATE TOGGLING:'),
    section('function computeExchangeButtonState(', '/**\n * Renders the exchange button'),
  ].join('\n'), h.context);
  return { modals, send: () => h.context.handleEventExchange(), setHoldings: value => { holdings = value; } };
}

test('EA-XYZ-P3-T013: timeout cannot publish pre-burn holdings; retry preserves applied status and recovers', async () => {
  const h = fixture(); h.connect('wallet-A', Promise.resolve([nft('0', 'HEN', 5)])); await flush();
  const trade = tradeFixture(h); await trade.send();
  assert.deepEqual(h.ids('HEN'), [], 'Burn 2 from 5 must not republish 5 after timeout');
  assert.equal(h.call('eventExchangeInFlight'), false);
  assert.equal(trade.modals.at(-1)[0], 'BURN COMPLETE. ✅');
  const button = h.context.computeExchangeButtonState({ walletConnected: true });
  assert.equal(button.defaultLabel, 'RETRY BALANCES');
  await button.clickAction();
  assert.deepEqual(h.ids('HEN'), [], 'Repeated stale retry remains unavailable');
  trade.setHoldings([nft('0', 'HEN', 4)]); await h.context.retryDropsBalances();
  assert.deepEqual(h.ids('HEN'), [], 'Partial burn delta remains unavailable');
  trade.setHoldings([nft('0', 'HEN', 3)]); await h.context.retryDropsBalances();
  assert.deepEqual(h.ids('HEN'), ['0']);
  assert.equal(h.panes.HEN.querySelector('.collection-item-owned-text').textContent, '3');
  assert.equal(h.call('dropsBalanceRefreshFailed'), false); assertCanonical(h);
});

for (const holdings of [[nft('0', 'HEN', 3)], [nft('0', 'HEN', 0)], []]) {
  test(`EA-XYZ-P3-T013: proven timeout refetch succeeds (balance=${holdings[0]?.balance ?? 'absent'})`, async () => {
    const h = fixture(); h.connect('wallet-A', Promise.resolve([nft('0', 'HEN', 5)])); await flush();
    const trade = tradeFixture(h, { holdings }); await trade.send();
    assert.equal(h.errors.length, 0); assert.equal(h.call('dropsBalanceRefreshFailed'), false);
    assert.deepEqual(h.ids('HEN'), holdings[0]?.balance ? ['0'] : []);
    assert.equal(trade.modals.at(-1)[0], 'SUCCESS!'); assertCanonical(h);
  });
}

test('EA-XYZ-P3-T013: successful polling verifies the full delta before publication', async () => {
  const h = fixture(); h.connect('wallet-A', Promise.resolve([nft('0', 'HEN', 5)])); await flush();
  const trade = tradeFixture(h, { holdings: [nft('0', 'HEN', 3)] });
  let polls = 0;
  h.context.pollForSharedNFTUpdate = args => pollForSharedNFTUpdate({ ...args, timeout: 1000, interval: 0,
    fetchNFTs: async () => [nft('0', 'HEN', ++polls === 1 ? 4 : 3)] });
  await trade.send(); assert.equal(polls, 2);
  assert.equal(h.panes.HEN.querySelector('.collection-item-owned-text').textContent, '3');
  assert.equal(h.errors.length, 0);
});

for (const fail of [false, true]) {
  test(`EA-XYZ-P3-T013: pre-confirmation request cannot overwrite verified holdings (failure=${fail})`, async () => {
    const h = fixture(); h.connect('wallet-A', Promise.resolve([nft('0', 'HEN', 5)])); await flush();
    const old = deferred();
    const oldRefresh = h.context.refreshDropsWallet({ address: 'wallet-A' }, h.call('walletRefreshGeneration'), old.promise);
    const trade = tradeFixture(h, { holdings: [nft('0', 'HEN', 3)] }); await trade.send();
    if (fail) old.reject(new Error('old request failed')); else old.resolve([nft('0', 'HEN', 5)]);
    await oldRefresh;
    assert.equal(h.panes.HEN.querySelector('.collection-item-owned-text').textContent, '3');
    assert.equal(h.errors.length, 0); assert.equal(h.call('dropsBalanceRefreshFailed'), false);
  });
}

for (const change of ['replacement', 'reconnect', 'pending']) {
  test(`EA-XYZ-P3-T013: late poll cannot overwrite ${change}; original wallet retains burn requirement`, async () => {
    const h = fixture(); h.connect('wallet-A', Promise.resolve([nft('0', 'HEN', 5)])); await flush();
    const trade = tradeFixture(h); const old = deferred();
    h.context.fetchNFTs = () => old.promise;
    const run = trade.send(); await flush();
    if (change === 'pending') h.context.synchronizeDropsWalletState({ status: 'pending' });
    else {
      if (change === 'reconnect') h.disconnect();
      h.connect(change === 'replacement' ? 'wallet-B' : 'wallet-A',
        Promise.resolve(change === 'reconnect' ? [nft('0', 'HEN', 5)] : [nft('2')]));
    }
    await flush(); old.resolve([nft('0', 'HEN', 5)]); await run;
    assert.deepEqual(h.ids('HEN'), change === 'replacement' ? ['2'] : []);
    h.disconnect(); h.connect('wallet-A', Promise.resolve([nft('0', 'HEN', 5)])); await flush();
    assert.deepEqual(h.ids('HEN'), [], 'Reconnect cannot erase an unverified burn');
    assert.equal(h.call('dropsBalanceRefreshFailed'), true);
  });
}

test('EA-XYZ-P3-T013: confirmation after same-address reconnect revokes stale rows and permits verified recovery', async () => {
  const h = fixture(); h.connect('wallet-A', Promise.resolve([nft('0', 'HEN', 5)])); await flush();
  const confirmation = deferred(); const trade = tradeFixture(h, { confirmation: confirmation.promise });
  const run = trade.send(); await flush(); h.disconnect();
  h.connect('wallet-A', Promise.resolve([nft('0', 'HEN', 5)])); await flush();
  confirmation.resolve(); await run;
  assert.deepEqual(h.ids('HEN'), []); assert.equal(h.call('dropsBalanceRefreshFailed'), true);
  trade.setHoldings([nft('0', 'HEN', 3)]); await h.context.retryDropsBalances();
  assert.deepEqual(h.ids('HEN'), ['0']);
});

test('EA-XYZ-P3-T013: newer verified refresh wins over an older trade poll in the same wallet session', async () => {
  const h = fixture(); h.connect('wallet-A', Promise.resolve([nft('0', 'HEN', 5)])); await flush();
  const trade = tradeFixture(h); const old = deferred(); h.context.fetchNFTs = () => old.promise;
  const run = trade.send(); await flush();
  await h.context.refreshDropsWallet({ address: 'wallet-A' }, h.call('walletRefreshGeneration'),
    Promise.resolve([nft('0', 'HEN', 3)]));
  old.resolve([nft('0', 'HEN', 5)]); await run;
  assert.equal(h.panes.HEN.querySelector('.collection-item-owned-text').textContent, '3');
  assert.equal(h.call('dropsBalanceRefreshFailed'), false); assert.equal(h.errors.length, 0);
});

for (const older of ['standby', 'trade']) {
  test(`EA-XYZ-P3-T013: ${older} NFT completion cannot overwrite the newer verified producer`, async () => {
    const h = fixture(); h.connect('wallet-A', Promise.resolve([nft('0', 'HEN', 5)])); await flush();
    const trade = tradeFixture(h, { holdings: [nft('0', 'HEN', 3)] }); const old = deferred();
    Object.assign(h.context, { TZKT_BASE: 'https://inert.invalid',
      fetch: async () => ({ json: async () => ({ paused: false }) }) });
    vm.runInContext(section('async function pollForUnpause(', 'function startCountdown('), h.context);
    h.context.fetchNFTs = () => old.promise;
    const first = older === 'standby' ? h.context.pollForUnpause('escrow') : trade.send();
    await flush(); h.context.fetchNFTs = async () => [nft('0', 'HEN', 3)];
    if (older === 'standby') await trade.send(); else await h.context.pollForUnpause('escrow');
    old.resolve([nft('0', 'HEN', 5)]); await first;
    assert.equal(h.panes.HEN.querySelector('.collection-item-owned-text').textContent, '3');
    assert.equal(h.errors.length, 0); assert.equal(h.call('dropsBalanceRefreshFailed'), false);
  });
}

for (const fail of [false, true]) {
  test(`EA-XYZ-P3-T013: overlapping retry ignores older completion (failure=${fail})`, async () => {
    const h = fixture(); h.connect('wallet-A', Promise.resolve([nft('0', 'HEN', 5)])); await flush();
    const trade = tradeFixture(h); await trade.send();
    const old = deferred(); h.context.fetchNFTs = () => old.promise;
    const retry = h.context.retryDropsBalances(); await flush();
    h.context.fetchNFTs = async () => [nft('0', 'HEN', 3)];
    await h.context.retryDropsBalances();
    if (fail) old.reject(new Error('old retry failed')); else old.resolve([nft('0', 'HEN', 5)]);
    await retry;
    assert.equal(h.panes.HEN.querySelector('.collection-item-owned-text').textContent, '3');
    assert.equal(h.call('dropsBalanceRefreshFailed'), false);
  });
}

test('EA-XYZ-P3-T013: provider failure after applied burn stays recoverable and blocks another send', async () => {
  const h = fixture(); h.connect('wallet-A', Promise.resolve([nft('0', 'HEN', 5)])); await flush();
  const trade = tradeFixture(h); h.context.fetchNFTs = async () => { throw new Error('indexer unavailable'); };
  await trade.send(); assert.equal(trade.modals.at(-1)[0], 'BURN COMPLETE. ✅');
  assert.deepEqual(h.ids('HEN'), []); const modalCount = trade.modals.length;
  await trade.send(); assert.equal(trade.modals.length, modalCount);
  h.context.fetchNFTs = async () => [nft('0', 'HEN', 3)]; await h.context.retryDropsBalances();
  assert.deepEqual(h.ids('HEN'), ['0']); assert.equal(h.call('eventExchangeInFlight'), false);
});

test('FIND-P2-002: confirmed refreshes retain every canonical template and reproject current native holdings', async () => {
  const h = fixture(); h.connect('wallet-A', Promise.resolve([nft('0'), nft('1'), nft('7', 'INTRODUCTIONS')])); await flush();
  assert.deepEqual(h.ids('HEN'), ['0']); assert.deepEqual(h.ids('INTRODUCTIONS'), ['7']);
  h.panes.HEN.querySelector('.events_checkbox').checked = true;
  for (const holdings of [[nft('0'), nft('7', 'INTRODUCTIONS')], [nft('2'), nft('8', 'INTRODUCTIONS')], [],
    [nft('0'), nft('1'), nft('2', 'HEN', 1)]]) {
    await h.context.refreshConnectedState(holdings);
    h.call('setEventContractAndTokenAttributes()'); // Reinitialization must also be idempotent.
    assertCanonical(h);
    assert.deepEqual(h.ids('HEN'), holdings.length ? [holdings[0].tokenId] : []);
    assert.deepEqual(h.ids('INTRODUCTIONS'), holdings.filter(n => n.contractAddress === 'contract-INTRODUCTIONS').map(n => n.tokenId));
  }
  assert.equal(h.templates.CANAAN[0].dataset.tokenId, '29', 'Redeem CMS template survives refresh');
  assert.equal(h.errors.length, 0);
});

test('FIND-P2-014: tracked intros pane clears on account replacement, disconnect and reconnect', async () => {
  const h = fixture({ enabled: ['INTRODUCTIONS'] });
  h.connect('wallet-A', Promise.resolve([nft('7', 'INTRODUCTIONS')])); await flush();
  assert.deepEqual(h.ids('INTRODUCTIONS'), ['7']);
  h.panes.INTRODUCTIONS.style.display = 'block'; // Audited trigger: a populated, visible tracked intros pane.
  h.panes.INTRODUCTIONS.querySelector('.events_checkbox').checked = true;
  const next = deferred(); h.connect('wallet-B', next.promise);
  assertPending(h); assert.deepEqual(h.ids('INTRODUCTIONS'), []); assert.deepEqual(h.ids('HEN'), []);
  next.resolve([nft('8', 'INTRODUCTIONS')]); await flush();
  assert.deepEqual(h.ids('INTRODUCTIONS'), ['8']); assert.equal(h.state.activeAccount.address, 'wallet-B');
  h.disconnect();
  assert.deepEqual(h.ids('INTRODUCTIONS'), ['7', '8'], 'Disconnect restores canonical preview, never the wallet subset');
  assert.equal(h.state.activeAccount, null); assert.equal(h.state.selectedTokenId, null);
  assert.equal(h.wallet['aria-busy'], 'false');
  assert.equal(h.panes.INTRODUCTIONS.querySelector('.collection-item-owned-text').textContent, '00');
  assert.equal(h.panes.INTRODUCTIONS.querySelector('.events_checkbox').checked, false);
  h.connect('wallet-A', Promise.resolve([nft('7', 'INTRODUCTIONS')])); await flush();
  assert.deepEqual(h.ids('INTRODUCTIONS'), ['7']); assert.deepEqual(h.ids('HEN'), []); assertCanonical(h);
});

test('Pending and disabled collection panes stay hidden; reconnect starts with no prior wallet rows', async () => {
  const h = fixture({ enabled: ['HEN'] });
  h.context.synchronizeDropsWalletState({ status: 'pending' }); assertPending(h);
  h.connect('wallet-A', Promise.resolve([nft('0'), nft('7', 'INTRODUCTIONS')])); await flush();
  assert.deepEqual(h.ids('HEN'), ['0']); assert.deepEqual(h.ids('INTRODUCTIONS'), []);
  h.context.synchronizeDropsWalletState({ status: 'pending' }); assertPending(h);
  h.connect('wallet-B', Promise.resolve([])); await flush();
  assert.deepEqual(h.ids('HEN'), []); assert.equal(h.empty.style.display, 'flex');
  assert.equal(h.wallet['aria-busy'], 'false'); assertCanonical(h);
});

test('Late success and failure cannot overwrite a replacement wallet, disconnect, or same-address reconnect', async () => {
  for (const transition of ['switch', 'disconnect', 'reconnect', 'pending']) for (const fail of [false, true]) {
    const h = fixture(); const old = deferred(); h.connect('wallet-A', old.promise);
    if (transition === 'switch') h.connect('wallet-B', Promise.resolve([nft('2'), nft('8', 'INTRODUCTIONS')]));
    if (transition === 'disconnect' || transition === 'reconnect') h.disconnect();
    if (transition === 'reconnect') h.connect('wallet-A', Promise.resolve([nft('2'), nft('8', 'INTRODUCTIONS')]));
    if (transition === 'pending') h.context.synchronizeDropsWalletState({ status: 'pending' });
    await flush();
    const before = JSON.stringify({ hen: h.ids('HEN'), intros: h.ids('INTRODUCTIONS'), heading: h.heading.textContent,
      styles: Object.values(h.panes).map(pane => pane.style.display), busy: h.wallet['aria-busy'] });
    if (fail) old.reject(new Error('stale indexer failure'));
    else old.resolve([nft('0'), nft('7', 'INTRODUCTIONS')]);
    await flush();
    assert.equal(JSON.stringify({ hen: h.ids('HEN'), intros: h.ids('INTRODUCTIONS'), heading: h.heading.textContent,
      styles: Object.values(h.panes).map(pane => pane.style.display), busy: h.wallet['aria-busy'] }), before, transition);
    assert.equal(h.errors.length, 0); assertCanonical(h);
  }
});

test('Current fetch failure clears both panes and reconnect recovers from canonical templates', async () => {
  const h = fixture(); h.connect('wallet-A'); assertPending(h);
  h.requests[0].reject(new Error('current indexer failure')); await flush();
  assert.equal(h.errors.length, 1); assert.deepEqual(h.ids('HEN'), []); assert.deepEqual(h.ids('INTRODUCTIONS'), []);
  assert.equal(h.spinner.style.display, 'none'); assert.equal(h.wallet['aria-busy'], 'false');
  h.disconnect(); h.connect('wallet-A'); h.requests[1].resolve([nft('2'), nft('8', 'INTRODUCTIONS')]); await flush();
  assert.deepEqual(h.ids('HEN'), ['2']); assert.deepEqual(h.ids('INTRODUCTIONS'), ['8']); assertCanonical(h);
});

test('Wallet change during confirmed refresh prevents its continuation from pruning the new preview', async () => {
  const h = fixture(); h.connect('wallet-A', Promise.resolve([nft('0')])); await flush();
  const refreshing = h.context.refreshConnectedState([nft('0')]);
  h.disconnect(); await refreshing;
  assert.deepEqual(h.ids('HEN'), ['94684', '103062', '104492']);
  assert.deepEqual(h.ids('INTRODUCTIONS'), ['7', '8']);
  assert.equal(h.heading.textContent, 'ELIGIBLE BURN TOKENS'); assertCanonical(h);
});

test('Confirmed trade NFT response cannot restore holdings after wallet replacement or reconnect', async () => {
  for (const reconnect of [false, true]) {
    const h = fixture(); h.connect('wallet-A', Promise.resolve([nft('0')])); await flush();
    const result = deferred(); let polling = false;
    Object.assign(h.context, {
      getVerifiedPublicActiveAccount: async () => h.state.activeAccount,
      getSelectedEventTokenWithBalance: () => ({ contractAddress: 'contract-HEN', tokenId: '0', oldBalance: 4 }),
      buildApprovalOps: async () => [], fetchTokenPairId: async () => '11',
      redeemToken: { collection: 'CANAAN', tokenId: '29', redeemAmount: 1 },
      REDEEM_CONTRACT_ADDRESS: 'contract-CANAAN', BURN_REDEEM_CONTRACT_ADDRESS: 'escrow',
      networkConfigAvailable: true, network: 'testnet', showModal() {}, hideModal() {},
      resetEventsUI() {}, setTimeout() {},
      pollForConfirmation: async () => {},
      pollForNFTUpdate: async () => { polling = true; return result.promise; },
    });
    h.window.dAppClient = { requestOperation: async () => ({ transactionHash: 'inert-hash' }) };
    h.document.appendChild(new Element('loading-modal-div'));
    vm.runInContext(section('let eventExchangeInFlight', '// UI STATE TOGGLING:'), h.context);
    const trade = h.context.handleEventExchange(); await flush(); assert.equal(polling, true);
    if (reconnect) h.disconnect();
    h.connect(reconnect ? 'wallet-A' : 'wallet-B', Promise.resolve([nft('2'), nft('8', 'INTRODUCTIONS')])); await flush();
    result.resolve([nft('0'), nft('7', 'INTRODUCTIONS')]); await trade;
    assert.deepEqual(h.ids('HEN'), ['2']); assert.deepEqual(h.ids('INTRODUCTIONS'), ['8']);
    assert.equal(h.errors.length, 0); assertCanonical(h);
  }
});
