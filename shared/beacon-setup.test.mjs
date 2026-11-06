import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createContext, SourceTextModule, SyntheticModule } from 'node:vm';
import test from 'node:test';
import { fetchFa2BalancePages } from './tzkt-fa2-balances.js';

const walletSource = await readFile(new URL('./beacon-setup.js', import.meta.url), 'utf8');

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function element(textContent = '') {
  const listeners = new Map();
  return {
    style: {},
    textContent,
    listeners,
    addEventListener(type, listener) {
      const handlers = listeners.get(type) || [];
      handlers.push(listener);
      listeners.set(type, handlers);
    },
    click() {
      const event = {
        defaultPrevented: false,
        preventDefault() { this.defaultPrevented = true; }
      };
      for (const listener of listeners.get('click') || []) listener(event);
      return event;
    }
  };
}

function account(address, type = 'shadownet') {
  return { address, network: { type } };
}

const addressA = 'tz1WalletAddress0001';
const addressB = 'tz1WalletAddress0002';
const short = address => `${address.slice(0, 3)}...${address.slice(-4)}`;
const settle = () => new Promise(resolve => setImmediate(resolve));

async function createWalletFixture(initialAccountPromise) {
  const elements = {
    pending: element(),
    connect: element('CONNECT'),
    connected: element('CONNECTED'),
    disconnect: element('DISCONNECT'),
    mobileSpinner: element(),
    mobileStatus: element(),
    mobileAddress: element('TZ1...EXMP'),
    mobileAction: element('CONNECT')
  };
  const mobileChildren = new Map([
    ['.wallet-pending-spinner.mobile', elements.mobileSpinner],
    ['.status-connected-wallet-div', elements.mobileStatus],
    ['.status-connected-wallet-address', elements.mobileAddress],
    ['.mobile-status-connect-button', elements.mobileAction]
  ]);
  const mobileWrapper = {
    style: {},
    querySelector(selector) { return mobileChildren.get(selector) || null; }
  };
  const bySelector = new Map([
    ['.button-primary.wallet-pending', elements.pending],
    ['.button-primary.wallet-connect', elements.connect],
    ['.button-primary.connected-state', elements.connected],
    ['.button-primary.disconnect-hover', elements.disconnect],
    ['.mobile-nav-status-main', mobileWrapper]
  ]);
  const events = [];
  const errors = [];
  const document = {
    readyState: 'complete',
    querySelector(selector) { return bySelector.get(selector) || null; },
    dispatchEvent(event) { events.push(event); }
  };
  const window = {
    localStorage: { getItem() { return null; } },
    appState: { isConnected: false }
  };
  const fixture = {
    elements, mobileWrapper, events, errors, document, window,
    client: null,
    accountReads: 0,
    fetches: [],
    permissionCalls: 0,
    clearCalls: 0,
    permissionResult: async () => {},
    clearResult: async () => {}
  };

  class FakeDAppClient {
    constructor(options) {
      this.options = options;
      this.subscriptions = [];
      fixture.client = this;
    }
    getActiveAccount() {
      fixture.accountReads += 1;
      return initialAccountPromise;
    }
    subscribeToEvent(name, listener) {
      this.subscriptions.push({ name, listener });
      this.accountListener = listener;
    }
    async requestPermissions() {
      fixture.permissionCalls += 1;
      return fixture.permissionResult();
    }
    async clearActiveAccount() {
      fixture.clearCalls += 1;
      return fixture.clearResult();
    }
  }

  const context = createContext({
    window,
    document,
    console: { error(...args) { errors.push(args); } },
    fetch: async url => {
      fixture.fetches.push(url);
      return { ok: true, json: async () => [] };
    },
    CustomEvent: class {
      constructor(type, options) { this.type = type; this.detail = options.detail; }
    },
    Event: class {
      constructor(type) { this.type = type; }
    }
  });
  const modules = new Map([
    ['@airgap/beacon-sdk', new SyntheticModule(
      ['DAppClient', 'NetworkType', 'BeaconEvent'],
      function () {
        this.setExport('DAppClient', FakeDAppClient);
        this.setExport('NetworkType', { MAINNET: 'mainnet', SHADOWNET: 'shadownet' });
        this.setExport('BeaconEvent', { ACTIVE_ACCOUNT_SET: 'ACTIVE_ACCOUNT_SET' });
      },
      { context }
    )],
    ['./tzkt-fa2-balances.js', new SyntheticModule(['fetchFa2BalancePages'], function () {
      this.setExport('fetchFa2BalancePages', fetchFa2BalancePages);
    }, { context })],
    ['./network.js', new SyntheticModule(['default'], function () {
      this.setExport('default', {
        network: 'testnet',
        tzkt: { testnet: 'https://tzkt.invalid' },
        getCurrentPublicNetworkConfig: () => ({ beaconNetwork: 'shadownet' })
      });
    }, { context })],
    ['./public-logger.js', new SyntheticModule(['createPublicLogger'], function () {
      this.setExport('createPublicLogger', () => ({ log() {} }));
    }, { context })]
  ]);
  // Export the existing private functions only inside this test's VM module.
  const module = new SourceTextModule(
    `${walletSource}\nexport { updateButtonState, publishPublicWalletState, bootWalletButtons, disconnectWallet };`,
    { context }
  );
  await module.link(specifier => {
    assert.ok(modules.has(specifier), `unexpected wallet import: ${specifier}`);
    return modules.get(specifier);
  });
  await module.evaluate();
  fixture.wallet = module.namespace;
  return fixture;
}

{
  const initialAccount = deferred();
  const fixture = await createWalletFixture(initialAccount.promise);
  const { wallet, client, elements, events, mobileWrapper } = fixture;

  assert.equal(client.subscriptions.length, 1);
  assert.equal(wallet.getPublicWalletState().status, 'pending');
  assert.equal(elements.mobileSpinner.style.display, '');
  assert.equal(elements.mobileStatus.style.display, 'none');
  assert.equal(elements.mobileAddress.textContent, '');
  assert.equal(elements.mobileAction.style.display, 'none');
  assert.equal(elements.pending.style.display, 'inline-block');
  assert.deepEqual(mobileWrapper.style, {});

  initialAccount.resolve(null);
  await settle();
  assert.equal(wallet.getPublicWalletState().status, 'unconnected');
  assert.equal(elements.mobileSpinner.style.display, 'none');
  assert.equal(elements.mobileStatus.style.display, 'none');
  assert.equal(elements.mobileAction.style.display, 'inline-block');
  assert.equal(elements.mobileAction.textContent, 'CONNECT');
  assert.equal(elements.connect.style.display, 'inline-block');
  assert.equal(elements.connect.textContent, 'CONNECT');
  assert.equal(elements.mobileAction.listeners.get('click').length, 1);
  await wallet.bootWalletButtons();
  assert.equal(elements.mobileAction.listeners.get('click').length, 1);

  wallet.publishPublicWalletState('pending');
  wallet.updateButtonState('pending');
  assert.equal(elements.mobileAction.click().defaultPrevented, true);
  assert.equal(fixture.permissionCalls, 0);
  wallet.publishPublicWalletState('unconnected');
  wallet.updateButtonState('unconnected');

  fixture.permissionResult = async () => { throw new Error('user canceled'); };
  assert.equal(elements.mobileAction.click().defaultPrevented, true);
  await settle();
  assert.equal(fixture.permissionCalls, 1);
  assert.equal(wallet.getPublicWalletState().status, 'unconnected');
  assert.equal(elements.mobileAction.textContent, 'CONNECT');
  assert.equal(events.filter(event =>
    event.type === wallet.PUBLIC_WALLET_STATE_EVENT && event.detail.status === 'connected'
  ).length, 0);

  const permission = deferred();
  fixture.permissionResult = () => permission.promise;
  elements.mobileAction.click();
  elements.mobileAction.click();
  assert.equal(fixture.permissionCalls, 2, 'shared connect flow deduplicates requests');
  permission.resolve();
  await settle();

  await client.accountListener(account(addressA));
  assert.equal(wallet.getPublicWalletState().status, 'connected');
  assert.equal(wallet.getPublicWalletState().account.address, addressA);
  assert.equal(elements.mobileSpinner.style.display, 'none');
  assert.equal(elements.mobileStatus.style.display, 'flex');
  assert.equal(elements.mobileAddress.textContent, short(addressA));
  assert.equal(elements.mobileAction.textContent, 'DISCONNECT');
  assert.equal(elements.mobileAction.style.display, 'inline-block');
  assert.equal(elements.connected.textContent, short(addressA));
  elements.connected.onmouseover();
  assert.equal(elements.connected.style.display, 'none');
  assert.equal(elements.disconnect.style.display, 'inline-block');
  elements.disconnect.onmouseout();
  assert.equal(elements.connected.style.display, 'inline-block');
  assert.equal(elements.disconnect.style.display, 'none');

  await client.accountListener(account(addressB));
  assert.equal(elements.mobileAddress.textContent, short(addressB));
  assert.equal(elements.connected.textContent, short(addressB));
  assert.ok(events.some(event =>
    event.type === wallet.PUBLIC_WALLET_STATE_EVENT &&
    event.detail.account?.address === addressB
  ));

  fixture.clearResult = async () => { throw new Error('disconnect failed'); };
  assert.equal(elements.mobileAction.click().defaultPrevented, true);
  await settle();
  assert.equal(wallet.getPublicWalletState().status, 'connected');
  assert.equal(elements.mobileAddress.textContent, short(addressB));
  assert.equal(elements.mobileAction.textContent, 'DISCONNECT');

  fixture.clearResult = async () => {};
  elements.mobileAction.click();
  await settle();
  assert.equal(wallet.getPublicWalletState().status, 'unconnected');
  assert.equal(elements.mobileAddress.textContent, '');
  assert.equal(elements.mobileStatus.style.display, 'none');
  assert.equal(elements.mobileAction.textContent, 'CONNECT');
  assert.equal(elements.connect.style.display, 'inline-block');
  assert.ok(events.some(event => event.type === 'walletDisconnected'));

  await client.accountListener(account(addressA));
  await client.accountListener(account(addressB, 'mainnet'));
  assert.equal(wallet.getPublicWalletState().status, 'unconnected');
  assert.equal(elements.mobileAddress.textContent, '');
  assert.equal(elements.mobileAction.textContent, 'CONNECT');
  assert.deepEqual(mobileWrapper.style, {});
}

function walletPublications(fixture) {
  return fixture.events.filter(event => event.type === fixture.wallet.PUBLIC_WALLET_STATE_EVENT);
}

async function assertSingleBinding(fixture) {
  await fixture.wallet.bootWalletButtons();
  assert.equal(fixture.client.subscriptions.length, 1);
  assert.equal(fixture.accountReads, 1);
  for (const name of ['connect', 'connected', 'disconnect', 'mobileAction']) {
    assert.equal(fixture.elements[name].listeners.get('click')?.length, 1, `${name}: one click binding`);
  }
}

test('WALLET-001: an unsuperseded valid boot connects and shares its NFT promise', async () => {
  const initialAccount = deferred();
  const fixture = await createWalletFixture(initialAccount.promise);
  initialAccount.resolve(account(addressA));
  await settle();
  assert.equal(fixture.wallet.getPublicWalletState().status, 'connected');
  assert.equal(fixture.elements.mobileAddress.textContent, short(addressA));
  assert.equal(fixture.elements.mobileAction.textContent, 'DISCONNECT');
  assert.equal(fixture.window.appState.isConnected, true);
  assert.deepEqual(await fixture.wallet.getPublicWalletState().nftsPromise, []);
  assert.equal(fixture.fetches.length, 1);
  assert.ok(fixture.fetches[0].includes(`?account=${addressA}&`));
  assert.equal(walletPublications(fixture).length, 1);
  assert.equal(fixture.clearCalls, 0);
  assert.equal(fixture.events.filter(event => event.type === 'walletDisconnected').length, 0);
  assert.deepEqual(fixture.errors, []);
  await assertSingleBinding(fixture);
});

for (const type of ['mainnet', 'shadownet']) {
  test(`WALLET-001: stale ${type} boot cannot clear, disconnect or overwrite B`, async () => {
    const initialAccount = deferred();
    const fixture = await createWalletFixture(initialAccount.promise);
    await fixture.wallet.bootWalletButtons(); // Re-entry while the first boot is pending.
    await fixture.client.accountListener(account(addressB));
    const currentState = fixture.wallet.getPublicWalletState();
    initialAccount.resolve(account(addressA, type));
    await settle();
    assert.equal(fixture.wallet.getPublicWalletState(), currentState);
    assert.equal(currentState.account.address, addressB);
    assert.equal(fixture.elements.mobileAddress.textContent, short(addressB));
    assert.equal(fixture.elements.connected.textContent, short(addressB));
    assert.equal(fixture.window.appState.isConnected, true);
    assert.equal(fixture.clearCalls, 0);
    assert.deepEqual(walletPublications(fixture).map(event => event.detail.account?.address), [addressB]);
    assert.equal(fixture.events.filter(event => event.type === 'walletDisconnected').length, 0);
    assert.equal(fixture.fetches.length, 1);
    assert.ok(fixture.fetches[0].includes(`?account=${addressB}&`));
    assert.deepEqual(fixture.errors, []);
    await assertSingleBinding(fixture);
  });
}

test('WALLET-001: a current wrong-network boot still clears and disconnects', async () => {
  const fixture = await createWalletFixture(Promise.resolve(account(addressA, 'mainnet')));
  await settle();
  assert.equal(fixture.clearCalls, 1);
  assert.equal(fixture.wallet.getPublicWalletState().status, 'unconnected');
  assert.equal(fixture.elements.mobileAddress.textContent, '');
  assert.equal(fixture.elements.mobileAction.textContent, 'CONNECT');
  assert.equal(fixture.window.appState.isConnected, false);
  assert.deepEqual(walletPublications(fixture).map(event => event.detail.status), ['unconnected']);
  assert.equal(fixture.events.filter(event => event.type === 'walletDisconnected').length, 1);
  assert.equal(fixture.fetches.length, 0);
  assert.deepEqual(fixture.errors, []);
  await assertSingleBinding(fixture);
});

for (const type of ['mainnet', 'shadownet']) {
  for (const source of ['null account event', 'explicit disconnect']) {
    test(`WALLET-001: ${source} retires a pending ${type} boot`, async () => {
      const initialAccount = deferred();
      const fixture = await createWalletFixture(initialAccount.promise);
      const explicitDisconnect = source === 'explicit disconnect';
      if (explicitDisconnect) await fixture.wallet.disconnectWallet();
      else await fixture.client.accountListener(null);
      const disconnectedState = fixture.wallet.getPublicWalletState();
      initialAccount.resolve(account(addressA, type));
      await settle();
      assert.equal(fixture.wallet.getPublicWalletState(), disconnectedState);
      assert.equal(disconnectedState.status, 'unconnected');
      assert.equal(fixture.elements.mobileAddress.textContent, '');
      assert.equal(fixture.elements.mobileAction.textContent, 'CONNECT');
      assert.equal(fixture.window.appState.isConnected, false);
      assert.equal(fixture.clearCalls, explicitDisconnect ? 1 : 0);
      assert.equal(walletPublications(fixture).length, 1);
      assert.equal(fixture.events.filter(event => event.type === 'walletDisconnected').length, explicitDisconnect ? 1 : 0);
      assert.equal(fixture.fetches.length, 0);
      assert.deepEqual(fixture.errors, []);
      await assertSingleBinding(fixture);
    });
  }
}

test('WALLET-001: a null event during current mismatch cleanup remains authoritative', async () => {
  const initialAccount = deferred();
  const fixture = await createWalletFixture(initialAccount.promise);
  fixture.clearResult = () => fixture.client.accountListener(null);
  initialAccount.resolve(account(addressA, 'mainnet'));
  await settle();
  assert.equal(fixture.clearCalls, 1);
  assert.equal(fixture.wallet.getPublicWalletState().status, 'unconnected');
  assert.deepEqual(walletPublications(fixture).map(event => event.detail.status), ['unconnected']);
  assert.equal(fixture.events.filter(event => event.type === 'walletDisconnected').length, 0);
  assert.equal(fixture.fetches.length, 0);
  assert.deepEqual(fixture.errors, []);
  await assertSingleBinding(fixture);
});

for (const outcome of ['resolve', 'reject']) {
  test(`WALLET-001: boot mismatch cleanup cannot publish over B after clear ${outcome}s`, async () => {
    const initialAccount = deferred();
    const clearing = deferred();
    const fixture = await createWalletFixture(initialAccount.promise);
    fixture.clearResult = () => clearing.promise;
    initialAccount.resolve(account(addressA, 'mainnet'));
    await settle();
    assert.equal(fixture.clearCalls, 1, 'current mismatched observation starts cleanup');
    await fixture.client.accountListener(account(addressB));
    const currentState = fixture.wallet.getPublicWalletState();
    if (outcome === 'resolve') clearing.resolve();
    else clearing.reject(new Error('inert clear failure'));
    await settle();
    assert.equal(fixture.wallet.getPublicWalletState(), currentState);
    assert.equal(currentState.account.address, addressB);
    assert.equal(fixture.elements.mobileAddress.textContent, short(addressB));
    assert.equal(fixture.window.appState.isConnected, true);
    assert.deepEqual(walletPublications(fixture).map(event => event.detail.account?.address), [addressB]);
    assert.equal(fixture.events.filter(event => event.type === 'walletDisconnected').length, 0);
    assert.equal(fixture.fetches.length, 1);
    assert.equal(fixture.errors.length, outcome === 'reject' ? 1 : 0);
    await assertSingleBinding(fixture);
  });
}

for (const outcome of ['resolve', 'reject']) {
  for (const replacement of ['valid B', 'null']) {
    test(`WALLET-001: event mismatch cleanup cannot supersede ${replacement} after clear ${outcome}s`, async () => {
      const fixture = await createWalletFixture(Promise.resolve(null));
      await settle();
      const clearing = deferred();
      fixture.clearResult = () => clearing.promise;
      const cleanup = fixture.client.accountListener(account(addressA, 'mainnet'));
      assert.equal(fixture.clearCalls, 1, 'current wrong-network event starts cleanup');
      await fixture.client.accountListener(replacement === 'valid B' ? account(addressB) : null);
      const currentState = fixture.wallet.getPublicWalletState();
      const currentEvents = fixture.events.slice();
      if (outcome === 'resolve') clearing.resolve();
      else clearing.reject(new Error('inert event clear failure'));
      await cleanup;
      await settle();
      assert.equal(fixture.wallet.getPublicWalletState(), currentState);
      assert.equal(currentState.status, replacement === 'valid B' ? 'connected' : 'unconnected');
      assert.equal(currentState.account?.address || null, replacement === 'valid B' ? addressB : null);
      assert.equal(fixture.elements.mobileAddress.textContent, replacement === 'valid B' ? short(addressB) : '');
      assert.equal(fixture.window.appState.isConnected, replacement === 'valid B');
      assert.deepEqual(fixture.events, currentEvents, 'retired cleanup publishes no wallet events');
      assert.equal(fixture.events.filter(event => event.type === 'walletDisconnected').length, 0);
      assert.equal(fixture.clearCalls, 1);
      assert.equal(fixture.fetches.length, replacement === 'valid B' ? 1 : 0);
      assert.equal(fixture.errors.length, outcome === 'reject' ? 1 : 0);
      await assertSingleBinding(fixture);
    });
  }
}

for (const page of ['index.html', 'collection-utility/index.html', 'drops/index.html', 'exchange/index.html']) {
  const html = await readFile(new URL(`../${page}`, import.meta.url), 'utf8');
  const classes = [...html.matchAll(/class="([^"]+)"/g)].map(match => match[1].split(' '));
  for (const name of [
    'navbar-wrapper', 'mobile-nav-status-main',
    'status-connected-wallet-div', 'status-connected-wallet-header',
    'status-connected-wallet-header-mp', 'status-connected-wallet-address',
    'mobile-status-connect-button', 'nav-menu-wrapper', 'nav-menu-two',
    'menu-button', 'wallet-pending', 'wallet-connect', 'connected-state',
    'disconnect-hover'
  ]) {
    assert.equal(classes.filter(tokens => tokens.includes(name)).length, 1, `${page}: ${name}`);
  }
  assert.equal(classes.filter(tokens => tokens.includes('wallet-pending-spinner')).length, 2);
  assert.equal(classes.filter(tokens =>
    tokens.includes('wallet-pending-spinner') && tokens.includes('mobile')
  ).length, 1, `${page}: mobile spinner`);
  assert.match(html, /class="mobile-status-connect-button w-button">CONNECT<\/a>/);
  assert.ok(
    html.indexOf('class="navbar-brand') < html.indexOf('class="mobile-nav-status-main"') &&
    html.indexOf('class="mobile-nav-status-main"') < html.indexOf('class="nav-menu-wrapper w-nav-menu"'),
    `${page}: mobile wallet must precede the collapsible nav menu`
  );
}

console.log('Shared mobile wallet and four-page navbar tests passed.');
