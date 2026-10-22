import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import { pollForNFTUpdate } from '../../shared/public-trade-ops.js';

// Execute the complete page module with inert DOM, wallet and indexer boundaries.
const source = readFileSync(process.env.EA_T013_SOURCE || new URL('./exchange.js', import.meta.url), 'utf8')
  .replace(/import[\s\S]*?from\s+['"][^'"]+['"];\s*/g, '');
const flush = () => new Promise(resolve => setImmediate(resolve));
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
class Element {
  constructor(classes = '', text = '') {
    this.classes = new Set(classes.split(' ').filter(Boolean));
    this.textContent = text; this.style = {}; this.children = []; this.attributes = {}; this.listeners = {};
    this.value = ''; this.disabled = false;
    this.classList = { add: name => this.classes.add(name), remove: name => this.classes.delete(name),
      contains: name => this.classes.has(name) };
  }
  matches(selector) {
    return [...selector.matchAll(/\.([\w-]+)/g)].every(([, name]) => this.classes.has(name)) &&
      [...selector.matchAll(/\[([\w-]+)="([^"]*)"\]/g)].every(([, key, value]) => this.attributes[key] === value);
  }
  querySelectorAll(selector) {
    return this.children.flatMap(child => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]);
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  closest(selector) { return this.matches(selector) ? this : this.parent?.closest(selector); }
  appendChild(child) { child.parent = this; this.children.push(child); return child; }
  setAttribute(key, value) { this.attributes[key] = String(value); }
  getAttribute(key) { return this.attributes[key] ?? null; }
  removeAttribute(key) { delete this.attributes[key]; }
  get options() { return this.children; }
  set innerHTML(value) {
    this.children = []; this.html = value;
    if (value.includes('burn-cart-remove-row-button')) this.appendChild(new Element('burn-cart-remove-row-button'));
  }
  get innerHTML() { return this.html || ''; }
  addEventListener(type, listener) { (this.listeners[type] ||= []).push(listener); }
  async click() { for (const listener of this.listeners.click || []) await listener({ preventDefault() {} }); }
}
const nft = (balance, contractAddress = 'KT1419', tokenId = '0') => ({ balance, contractAddress, tokenId });
function fixture() {
  const document = new Element(); document.readyState = 'loading'; document.body = document;
  document.createElement = () => new Element();
  const rows = [], dropdowns = [], panes = [];
  for (const [tab, contract] of [['419', 'KT1419'], ['CANAAN', 'KT1Canaan']]) {
    const pane = document.appendChild(new Element('w-tab-pane')); pane.setAttribute('data-w-tab', tab); panes.push(pane);
    const wrapper = pane.appendChild(new Element('exchange-ui-div'));
    wrapper.appendChild(new Element('loading-spinner-01-exchange-ui'));
    wrapper.appendChild(new Element(`no-tokens-in-walet-div---${tab.toLowerCase()}`));
    const row = wrapper.appendChild(new Element('w-dyn-list')).appendChild(new Element('collection-item-01-div'));
    row.appendChild(new Element('token-id-number', '0'));
    row.appendChild(new Element('collection-item-editions-text-number', '31'));
    row.appendChild(new Element('collection-item-title-text', contract));
    row.appendChild(new Element('collection-item-01-image')).src = 'inert.png';
    dropdowns.push(row.appendChild(new Element('token-qty w-select'))); rows.push(row);
  }
  const header = document.appendChild(new Element('available-burn-tokens-exchange-text'));
  const total = document.appendChild(new Element('total-display'));
  const cart = document.appendChild(new Element('burn-cart-display'));
  cart.appendChild(new Element('empty-cart-div'));
  const cartRows = cart.appendChild(new Element('burn-cart-display-structure-div'));
  const controls = {};
  for (const key of ['pending', 'connect', 'empty', 'live']) {
    controls[key] = document.appendChild(new Element(key === 'live' ? 'exchange-button w-button' : `exchange-button-${key} w-button`, key === 'connect' ? 'CONNECT' : ''));
  }
  const modal = document.appendChild(new Element('loading-modal-div'));
  for (const cls of ['loading-modal-text', ...[2, 3, 4, 5, 6].map(i => `loading-modal-text-${i}`), 'loading-spinner-01', 'loading-checkbox-01']) {
    modal.appendChild(new Element(cls));
  }
  const timers = [], intervals = new Set(), sent = [], approvals = [], pairs = [], errors = [], polls = [];
  const h = { document, rows, dropdowns, panes, header, total, controls, cartRows, modal, timers, intervals, sent, approvals, pairs, errors, polls,
    account: { address: 'wallet-A' }, walletState: { status: 'pending' },
    fetchRows: async () => [nft(0)], verify: async () => h.account,
    approve: async () => [{ kind: 'approval' }], pair: async () => '7', confirm: async () => {},
    poll: async opts => opts.fetchNFTs(opts.address), connectCalls: 0 };
  const context = vm.createContext({ document, window: {},
    cfg: { network: 'testnet', rpc: {}, tzkt: { testnet: 'https://inert.test' }, contracts: { testnet: {
      collections: { pane0: 'KT1419', pane1: 'KT1Canaan' }, escrow: 'KT1Escrow', redeemTokenContract: 'KT1Redeem' } } },
    createPublicLogger: () => ({ log() {}, debug() {} }),
    PUBLIC_WALLET_STATE_EVENT: 'wallet', getPublicWalletState: () => h.walletState,
    getVerifiedPublicActiveAccount: () => h.verify(), requestPublicWalletConnection: async () => { h.connectCalls++; },
    buildSharedApprovalOps: async opts => { approvals.push(opts); return h.approve(opts); },
    fetchSharedTokenPairId: async opts => { pairs.push(opts); return h.pair(opts); },
    pollForSharedConfirmation: opts => h.confirm(opts),
    pollForSharedNFTUpdate: opts => { polls.push(opts); return h.poll(opts); },
    fetch: async url => ({ ok: true, json: async () => (await h.fetchRows(url)).map(n => ({ balance: n.balance,
      token: { tokenId: n.tokenId, contract: { address: n.contractAddress } } })) }),
    Option: function(text, value) { const el = new Element('', String(text)); el.value = String(value); return el; },
    MutationObserver: class { observe() {} },
    setTimeout: fn => { timers.push(fn); return timers.length; },
    setInterval: fn => { intervals.add(fn); return fn; }, clearInterval: fn => intervals.delete(fn),
    console: { error: (...args) => errors.push(args), warn() {} },
  });
  context.window.dAppClient = { requestOperation: async payload => { sent.push(payload); return { transactionHash: 'inert-hash' }; } };
  vm.runInContext(source, context);
  h.context = context; h.call = code => vm.runInContext(code, context);
  context.bootExchangePage(); timers.shift()();
  h.state = state => { h.walletState = state; context.receivePublicWalletState(state); };
  h.connect = async (address = 'wallet-A', rows = [nft(1)]) => {
    h.account = { address }; h.state({ status: 'connected', account: h.account, nftsPromise: Promise.resolve(rows) }); await flush();
  };
  h.disconnect = () => { h.account = null; h.state({ status: 'unconnected', account: null }); };
  h.select = (value = '1', index = 0) => { dropdowns[index].value = value; context.updateTotal(); };
  h.trade = () => context.handleExchange();
  return h;
}
function unavailable(h) {
  for (const dropdown of h.dropdowns) {
    assert.equal(dropdown.disabled, true, 'Unknown balances must disable quantity selection');
    assert.deepEqual(dropdown.options.map(option => option.value), [''], 'Unknown balances must expose no quantities');
  }
  assert.equal(h.cartRows.children.length, 0); assert.equal(h.controls.live.style.display, 'none');
}

test('FIND-P2-016: confirmed burn then refresh failure never restores edition-sized quantities; retry recovers', async () => {
  const h = fixture(); await h.connect(); h.select();
  h.fetchRows = async () => { throw new Error('inert indexer outage'); };
  await h.trade();
  assert.equal(h.sent.length, 1);
  assert.equal(h.dropdowns[0].options.length, 1, 'Post-burn refresh failure must not restore 31 edition-sized options');
  unavailable(h);
  assert.equal(h.controls.connect.textContent, 'RETRY BALANCES');
  assert.match(h.header.textContent, /UNAVAILABLE/);
  assert.match(h.modal.querySelector('.loading-modal-text').innerHTML, /BURN COMPLETE/);
  assert.equal(h.intervals.size, 0, 'Refresh rejection must release countdown');
  h.select('31'); await h.trade(); assert.equal(h.sent.length, 1, 'Programmatic retry cannot submit unavailable holdings');
  h.fetchRows = async () => [nft(1)];
  await h.controls.connect.click(); unavailable(h); // stale pre-burn indexer snapshot
  h.fetchRows = async () => [nft(0)];
  await h.controls.connect.click();
  assert.equal(h.controls.connect.textContent, 'CONNECT');
  assert.equal(h.controls.empty.style.display, 'block'); assert.equal(h.connectCalls, 0);
});

test('Startup, disconnect, pending and legacy hooks cannot manufacture ownership from edition sizes', async () => {
  const h = fixture(); unavailable(h);
  h.context.window.updateDropdownOptions(h.dropdowns[0], 31); unavailable(h);
  h.context.window.receiveNFTs([nft(31)]); unavailable(h);
  await h.connect(); assert.equal(h.dropdowns[0].options.length, 2);
  h.context.window.updateDropdownOptions(h.dropdowns[0], 31);
  assert.equal(h.dropdowns[0].options.length, 2);
  h.disconnect(); unavailable(h); h.context.window.receiveNFTs([nft(31)]); unavailable(h);
  h.select(); await h.trade(); assert.equal(h.sent.length, 0);
  await h.controls.connect.click(); assert.equal(h.connectCalls, 1);
});

test('Successful refresh uses owned bounds on both panes, exact unit trades and configured pair terms', async () => {
  const h = fixture(); await h.connect('wallet-A', [nft(3), nft(2, 'KT1Canaan')]);
  h.select('2'); h.select('1', 1);
  assert.equal(h.total.textContent, 12);
  h.fetchRows = async () => [nft(1), nft(1, 'KT1Canaan')];
  await h.trade(); assert.equal(h.sent.length, 1); assert.equal(h.errors.length, 0);
  assert.deepEqual(h.dropdowns.map(d => d.options.length), [2, 2]);
  const ops = h.sent[0].operationDetails;
  assert.equal(ops[0].kind, 'approval'); assert.deepEqual(Array.from(ops.slice(1), op => op.parameters.value.length), [2, 1]);
  assert.ok(ops.slice(1).every(op => op.destination === 'KT1Escrow' && op.parameters.entrypoint === 'initiate_trade'));
  assert.deepEqual(h.pairs.map(p => [p.burnAmount, p.redeemAmount, p.redeemTokenId, p.escrowAddress]), [[1, 4, 0, 'KT1Escrow'], [1, 4, 0, 'KT1Escrow']]);
  assert.equal(h.intervals.size, 0); h.select(); assert.equal(h.controls.live.style.display, 'block');
});

test('Initial refresh failure supports repeated failure then successful retry without reconnecting', async () => {
  const h = fixture(); h.account = { address: 'wallet-A' };
  h.state({ status: 'connected', account: h.account, nftsPromise: Promise.reject(new Error('inert failure')) }); await flush();
  unavailable(h); h.fetchRows = async () => { throw new Error('inert retry failure'); };
  await h.controls.connect.click(); unavailable(h);
  h.fetchRows = async () => [nft(2)]; await h.controls.connect.click();
  assert.equal(h.dropdowns[0].disabled, false); assert.equal(h.dropdowns[0].options.length, 3);
  h.select('2'); assert.equal(h.controls.live.style.display, 'block');
});

test('Late wallet refresh success and rejection cannot replace a different or reconnected account', async () => {
  for (const transition of ['switch', 'disconnect', 'pending', 'reconnect']) {
    for (const fail of [false, true]) {
      const h = fixture(), old = deferred(); h.account = { address: 'wallet-A' };
      h.state({ status: 'connected', account: h.account, nftsPromise: old.promise });
      if (transition === 'switch') await h.connect('wallet-B', [nft(2)]);
      else if (transition === 'pending') h.state({ status: 'pending' });
      else { h.disconnect(); if (transition === 'reconnect') await h.connect('wallet-A', [nft(2)]); }
      if (fail) old.reject(new Error('inert stale failure')); else old.resolve([nft(31)]);
      await flush();
      if (transition === 'switch' || transition === 'reconnect') {
        assert.equal(h.dropdowns[0].options.length, 3); assert.equal(h.dropdowns[0].disabled, false);
      } else unavailable(h);
    }
  }
});

test('Post-trade delayed success and failure cannot overwrite a new wallet projection, including same-address reconnect', async () => {
  for (const reconnect of [false, true]) for (const fail of [false, true]) {
    const h = fixture(), poll = deferred(); await h.connect(); h.select(); h.poll = () => poll.promise;
    const trade = h.trade(); await flush(); unavailable(h);
    h.poll = async opts => opts.fetchNFTs(opts.address);
    h.disconnect(); await h.connect(reconnect ? 'wallet-A' : 'wallet-B', [nft(reconnect ? 0 : 2)]);
    if (fail) poll.reject(new Error('inert old poll')); else poll.resolve([nft(31)]);
    await trade;
    assert.equal(h.dropdowns[0].disabled, reconnect); assert.equal(h.dropdowns[0].options.length, reconnect ? 1 : 3);
    assert.equal(h.controls.connect.style.display, 'none'); assert.equal(h.intervals.size, 0);
  }
});

test('Invalid selections fail closed even when option DOM is forged; no approval or wallet request occurs', async () => {
  for (const value of ['2', '1.5', '-1', 'Infinity', '1x', '9007199254740993']) {
    const h = fixture(); await h.connect();
    const option = new Element(); option.value = value; h.dropdowns[0].appendChild(option); h.select(value);
    assert.equal(h.total.textContent, 0); assert.equal(h.controls.live.style.display, 'none');
    await h.trade(); assert.equal(h.approvals.length, 0, value); assert.equal(h.sent.length, 0, value);
  }
});

test('Account, cart and ownership changes during account verification, approvals or pair lookup prevent send', async () => {
  for (const stage of ['verify', 'approve', 'pair', 'finalVerify']) for (const change of ['switch', 'pending', 'disconnect', 'cart']) {
    const h = fixture(), pause = deferred(); await h.connect('wallet-A', [nft(2)]); h.select();
    if (stage === 'verify') h.verify = () => pause.promise;
    if (stage === 'approve') h.approve = () => pause.promise;
    if (stage === 'pair') h.pair = () => pause.promise;
    if (stage === 'finalVerify') { let calls = 0; h.verify = async () => ++calls === 1 ? h.account : pause.promise; }
    const trade = h.trade(); await flush();
    if (change === 'switch') await h.connect('wallet-B', [nft(2)]);
    if (change === 'pending') h.state({ status: 'pending' });
    if (change === 'disconnect') h.disconnect();
    if (change === 'cart') h.select(stage === 'verify' ? '3' : '2');
    pause.resolve(stage === 'approve' ? [] : stage === 'pair' ? '7' : { address: 'wallet-A' });
    await trade; assert.equal(h.sent.length, 0, `${stage}/${change}`);
  }
});

test('Malformed balances remain unavailable; zero and later valid balances recover safely', async () => {
  for (const balance of ['1.5', '-1', 'invalid', '9007199254740993', null]) {
    const h = fixture(); await h.connect('wallet-A', [nft(balance)]); unavailable(h);
    h.fetchRows = async () => [nft(0)]; await h.controls.connect.click(); unavailable(h);
    h.disconnect(); await h.connect('wallet-A', [nft(1)]); assert.equal(h.dropdowns[0].disabled, false);
  }
});

test('Failed transaction confirmation remains an error and never claims burn success', async () => {
  const h = fixture(); await h.connect(); h.select(); h.confirm = async () => { throw new Error('operation failed'); };
  await h.trade(); unavailable(h);
  assert.equal(h.modal.querySelector('.loading-modal-text').innerHTML, 'ERROR');
  assert.match(h.modal.querySelector('.loading-modal-text-2').innerHTML, /operation failed/);
  assert.equal(h.polls.length, 0); h.fetchRows = async () => [nft(1)]; await h.controls.connect.click();
  assert.equal(h.dropdowns[0].disabled, false);
});

test('Repeated connected notifications cannot supersede an in-flight post-burn retry with pre-burn holdings', async () => {
  const h = fixture(); await h.connect(); h.select();
  h.fetchRows = async () => { throw new Error('inert outage'); }; await h.trade();
  const refresh = deferred(); h.poll = () => refresh.promise;
  const retry = h.controls.connect.click(); await flush(); unavailable(h);
  h.context.receivePublicWalletState(h.walletState); await flush(); unavailable(h);
  refresh.resolve([nft(0)]); await retry;
  assert.equal(h.controls.empty.style.display, 'block'); assert.equal(h.dropdowns[0].disabled, true);
});

test('Retry results are ignored after wallet change, pending, disconnect or same-address reconnect', async () => {
  for (const transition of ['switch', 'pending', 'disconnect', 'reconnect']) for (const fail of [false, true]) {
    const h = fixture(); await h.connect(); h.select();
    h.fetchRows = async () => { throw new Error('inert outage'); }; await h.trade();
    const refresh = deferred(); h.poll = () => refresh.promise;
    const retry = h.controls.connect.click(); await flush(); unavailable(h);
    h.poll = async opts => opts.fetchNFTs(opts.address);
    if (transition === 'switch') await h.connect('wallet-B', [nft(2)]);
    else if (transition === 'pending') h.state({ status: 'pending' });
    else { h.disconnect(); if (transition === 'reconnect') await h.connect('wallet-A', [nft(0)]); }
    if (fail) refresh.reject(new Error('inert stale retry')); else refresh.resolve([nft(0)]);
    await retry;
    if (transition === 'switch' || transition === 'reconnect') {
      assert.equal(h.dropdowns[0].options.length, transition === 'reconnect' ? 1 : 3);
      assert.equal(h.dropdowns[0].disabled, transition === 'reconnect');
    } else unavailable(h);
  }
});

test('Active-account verification invalidates holdings even before the wallet lifecycle event arrives', async () => {
  for (const stage of ['initial', 'send', 'retry']) for (const account of [null, { address: 'wallet-B' }]) {
    const h = fixture(); await h.connect(); h.select();
    if (stage === 'retry') {
      h.fetchRows = async () => { throw new Error('inert outage'); }; await h.trade();
      h.verify = async () => account; await h.controls.connect.click(); await flush();
    } else {
      let count = 0;
      h.verify = async () => stage === 'send' && ++count === 1 ? h.account : account;
      await h.trade();
      assert.equal(h.sent.length, 0);
    }
    if (!account) unavailable(h);
    assert.equal(h.call('synchronizedWalletAddress'), account?.address || null);
    assert.equal(h.intervals.size, 0);
  }
});

test('Duplicate clicks are held through confirmation and release after refresh or failure', async () => {
  const h = fixture(), confirmation = deferred(); await h.connect(); h.select();
  h.confirm = () => confirmation.promise;
  const trade = h.trade(); await flush(); unavailable(h);
  await h.trade(); assert.equal(h.sent.length, 1);
  confirmation.resolve(); await trade;
  h.disconnect(); await h.connect(); h.select(); await h.trade(); assert.equal(h.sent.length, 2);
});

for (const transition of ['disconnect', 'pending', 'replacement']) {
  for (const response of ['outage', 'stale', 'partial', 'other-token-stale']) {
    test(`FIND-P3-014: ${transition}/${response} retains the full confirmed delta and recovers`, async () => {
      const h = fixture(); await h.connect('wallet-A', [nft(5), nft(3, 'KT1Canaan')]);
      h.select('2'); h.select('1', 1);
      h.fetchRows = async () => { throw new Error('inert post-confirmation outage'); };
      await h.trade(); unavailable(h);
      assert.match(h.modal.querySelector('.loading-modal-text').innerHTML, /BURN COMPLETE/);
      if (transition === 'disconnect') h.disconnect();
      if (transition === 'pending') h.state({ status: 'pending' });
      if (transition === 'replacement') {
        await h.connect('wallet-B', [nft(2)]);
        assert.equal(h.dropdowns[0].options.length, 3, 'Wallet A cannot constrain wallet B');
      }
      const stale = response === 'partial' ? [nft(4), nft(2, 'KT1Canaan')]
        : response === 'other-token-stale' ? [nft(3), nft(3, 'KT1Canaan')]
        : [nft(5), nft(3, 'KT1Canaan')];
      h.fetchRows = async () => {
        if (response === 'outage') throw new Error('inert reconnect outage');
        return stale;
      };
      await h.connect('wallet-A', stale); unavailable(h);
      assert.equal(h.controls.connect.textContent, 'RETRY BALANCES');
      h.select(); await h.trade(); assert.equal(h.sent.length, 1, 'No second wallet request for stale holdings');
      h.fetchRows = async () => stale;
      await h.controls.connect.click(); unavailable(h);
      h.fetchRows = async () => [nft(3), nft(2, 'KT1Canaan')];
      await h.controls.connect.click();
      assert.deepEqual(h.dropdowns.map(d => d.options.length), [4, 3]);
      assert.equal(h.controls.connect.textContent, 'CONNECT');
      assert.equal(h.intervals.size, 0);
      // Once verified, ordinary reconnect uses the shared snapshot again.
      h.disconnect(); await h.connect('wallet-A', [nft(6)]);
      assert.equal(h.dropdowns[0].options.length, 7);
      h.fetchRows = async () => [nft(5)]; h.select(); await h.trade();
      assert.equal(h.sent.length, 2, 'A fresh authorized trade remains usable');
    });
  }
}

for (const transition of ['disconnect', 'pending', 'replacement', 'reconnect']) {
  test(`FIND-P3-014: confirmation during ${transition} records the original wallet burn`, async () => {
    const h = fixture(), confirmation = deferred(); await h.connect('wallet-A', [nft(5)]); h.select('2');
    h.confirm = () => confirmation.promise;
    const trade = h.trade(); await flush();
    if (transition === 'pending') h.state({ status: 'pending' });
    else if (transition === 'replacement') await h.connect('wallet-B', [nft(2)]);
    else { h.disconnect(); if (transition === 'reconnect') await h.connect('wallet-A', [nft(5)]); }
    h.fetchRows = async () => [nft(5)]; confirmation.resolve(); await trade;
    assert.match(h.modal.querySelector('.loading-modal-text').innerHTML, /SUCCESS|BURN COMPLETE/);
    if (transition === 'replacement') {
      assert.equal(h.dropdowns[0].options.length, 3);
      assert.equal(h.polls.length, 0, 'Detached confirmation cannot refresh the replacement wallet');
    } else unavailable(h);
    if (transition !== 'reconnect') await h.connect('wallet-A', [nft(5)]);
    unavailable(h);
    h.fetchRows = async () => [nft(4)]; await h.controls.connect.click(); unavailable(h);
    h.fetchRows = async () => [nft(3)]; await h.controls.connect.click();
    assert.equal(h.dropdowns[0].options.length, 4);
    assert.equal(h.intervals.size, 0); assert.equal(h.sent.length, 1);
  });
}

for (const fail of [false, true]) {
  test(`FIND-P3-014: confirmation supersedes an unresolved reconnect snapshot (${fail ? 'failure' : 'success'})`, async () => {
    const h = fixture(), confirmation = deferred(), snapshot = deferred();
    await h.connect(); h.select(); h.confirm = () => confirmation.promise;
    const trade = h.trade(); await flush(); h.disconnect(); h.account = { address: 'wallet-A' };
    h.state({ status: 'connected', account: h.account, nftsPromise: snapshot.promise });
    h.fetchRows = async () => [nft(1)]; confirmation.resolve(); await trade; unavailable(h);
    h.fetchRows = async () => []; await h.controls.connect.click();
    assert.equal(h.controls.empty.style.display, 'block');
    if (fail) snapshot.reject(new Error('inert obsolete snapshot')); else snapshot.resolve([nft(31)]);
    await flush();
    assert.equal(h.controls.empty.style.display, 'block');
    assert.equal(h.controls.connect.style.display, 'none');
    assert.equal(h.dropdowns[0].options.length, 1);
    assert.equal(h.sent.length, 1); assert.equal(h.intervals.size, 0);
  });
}

test('FIND-P3-014: two wallets retain independent unverified burns until each recovers', async () => {
  const h = fixture();
  for (const address of ['wallet-A', 'wallet-B']) {
    await h.connect(address, [nft(5)]); h.select('2');
    h.fetchRows = async () => { throw new Error('inert outage'); }; await h.trade(); unavailable(h);
  }
  h.fetchRows = async () => [nft(4)]; await h.connect('wallet-A', [nft(4)]); unavailable(h);
  h.fetchRows = async () => [nft(3)]; await h.controls.connect.click();
  assert.equal(h.dropdowns[0].options.length, 4);
  h.fetchRows = async () => [nft(4)]; await h.connect('wallet-B', [nft(4)]); unavailable(h);
  h.fetchRows = async () => [nft(3)]; await h.controls.connect.click();
  assert.equal(h.dropdowns[0].options.length, 4); assert.equal(h.sent.length, 2);
});

for (const [balance, quantity, stale, remaining] of [[1, 1, 1, 0], [5, 2, 4, 3]]) {
  test(`FIND-P3-014: shared timeout/refetch cannot publish ${stale} after burning ${quantity} from ${balance}`, async () => {
    const h = fixture(); await h.connect('wallet-A', [nft(balance)]); h.select(String(quantity));
    h.poll = opts => pollForNFTUpdate({ ...opts, timeout: 0 });
    h.fetchRows = async () => { throw new Error('inert initial refresh failure'); };
    await h.trade(); unavailable(h);
    assert.match(h.modal.querySelector('.loading-modal-text').innerHTML, /BURN COMPLETE/);
    h.fetchRows = async () => [nft(stale)];
    h.disconnect(); await h.connect('wallet-A', [nft(stale)]); unavailable(h);
    h.context.window.receiveNFTs([nft(balance)]); await flush(); unavailable(h);
    h.select(); await h.trade(); assert.equal(h.sent.length, 1);
    await h.controls.connect.click(); unavailable(h);
    h.fetchRows = async () => remaining ? [nft(remaining)] : [];
    await h.controls.connect.click();
    assert.equal(h.dropdowns[0].options.length, remaining + 1);
    assert.equal(h.controls.connect.style.display, 'none');
    assert.equal(h.controls.empty.style.display, 'block');
    assert.equal(h.intervals.size, 0);
    assert.ok(h.polls.every(opts => opts.fetchBeforePolling && opts.refetchOnTimeout));
  });
}
