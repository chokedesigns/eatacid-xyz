// AUD-011 B3: observed defects, not remediation tests. No network or wallet sends.
// Run: node --experimental-vm-modules audits/repro/AUD-011-public-observations-repro.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import * as trade from '../../shared/public-trade-ops.js';
import * as tradeFixtures from '../../shared/public-trade-test-fixtures.mjs';
import { fetchFa2BalancePages } from '../../shared/tzkt-fa2-balances.js';
import * as countdown from '../../shared/drop-countdown.js';
import * as clockFixtures from '../../shared/drop-countdown.fixtures.mjs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8').replace(/\r\n?/g, '\n');
const walletText = read('../../shared/beacon-setup.js');
const dropsText = read('../../drops/js/events.js');
const settle = () => new Promise(resolve => setImmediate(resolve));
const require = createRequire(import.meta.url);
const { DAppClient, BeaconEvent, BeaconEventHandler } = require('@airgap/beacon-sdk');
const { ExposedPromise } = require('@airgap/beacon-utils');
const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};

// Reuse existing inert fixtures, stopping before their tests. Each evaluates the
// current implementation. No production statements are replaced or repaired.
function loadFixture(path, stop, extras = {}) {
  const url = new URL(path, import.meta.url);
  const full = read(path);
  const end = full.indexOf(stop);
  assert.ok(end > 0, `Missing fixture stop: ${path}`);
  const prefix = full.slice(0, end)
    .replace(/import[\s\S]*?from\s+['"][^'"]+['"];\s*/g, '')
    .replaceAll('import.meta.url', JSON.stringify(url.href))
    .replace(/const walletSource = await readFile\([^\n]+\);/, 'const walletSource = walletText;');
  const context = vm.createContext({ assert, readFileSync, vm, process: { env: {} },
    URL, setImmediate, Event, EventTarget, AbortController,
    ...trade, ...tradeFixtures, ...countdown, ...clockFixtures,
    fetchFa2BalancePages, ...extras });
  vm.runInContext(prefix, context, { filename: url.pathname });
  return context;
}

// A slow disconnect must not retire a newer account publication. Use installed
// SDK getter/setter/clear/emitter methods, with inert transport and deferred
// storage. No client is constructed. Only the directly relevant SDK lifecycle
// dependency is exercised; the prior Admin operation-binding proof is not run.
{
  const f = loadFixture('../../shared/beacon-setup.test.mjs', '\n{\n  const initialAccount = deferred();', {
    walletText, createContext: vm.createContext, SourceTextModule: vm.SourceTextModule,
    SyntheticModule: vm.SyntheticModule,
  });
  const make = vm.runInContext('createWalletFixture', f);
  const account = address => ({ address, accountIdentifier: address, origin: { type: 'extension' },
    network: { type: 'shadownet' } });
  for (const replacement of [false, true]) {
    const h = await make(Promise.resolve(null));
    await settle();
    await h.client.accountListener(account('wallet-A'));
    const clearEntered = deferred(), releaseClear = deferred();
    const bEntered = deferred(), releaseB = deferred();
    const transport = { connectionStatus: 'CONNECTED' };
    const events = {
      callbackMap: { [BeaconEvent.ACTIVE_ACCOUNT_SET]: [h.client.accountListener, active => {
        // Resolve B's storage at the null event. The real emitter's microtask
        // ordering lets B publish before the old disconnect continuation.
        if (!active) releaseB.resolve();
      }] },
      emit(...args) { return BeaconEventHandler.prototype.emit.call(this, ...args); },
    };
    const sdk = {
      isGetActiveAccountHandled: true, _activeAccount: ExposedPromise.resolve(account('wallet-A')),
      _transport: { isResolved: () => true }, transport, postMessageTransport: transport, events,
      getActiveAccount() { return DAppClient.prototype.getActiveAccount.call(this); },
      setActiveAccount(...args) { return DAppClient.prototype.setActiveAccount.call(this, ...args); },
      isInvalidState: async () => false, initInternalTransports: async () => {},
      setActivePeer: async () => {}, setTransport: async () => {}, getPeer: async () => ({}),
      storage: { set: async (_key, value) => {
        if (value === undefined) { clearEntered.resolve(); await releaseClear.promise; }
        if (value === 'wallet-B') { bEntered.resolve(); await releaseB.promise; }
      } },
    };
    h.client.clearActiveAccount = () => DAppClient.prototype.clearActiveAccount.call(sdk);
    h.client.getActiveAccount = () => sdk.getActiveAccount();
    const clearing = h.wallet.disconnectWallet();
    await clearEntered.promise;
    let switching;
    if (replacement) {
      switching = DAppClient.prototype.setActiveAccount.call(sdk, account('wallet-B'));
      await bEntered.promise;
    }
    releaseClear.resolve();
    await Promise.all([clearing, switching]);
    assert.equal(h.wallet.getPublicWalletState().status, 'unconnected');
    const verified = await h.wallet.getVerifiedPublicActiveAccount();
    assert.equal(verified?.address ?? null, replacement ? 'wallet-B' : null);
    if (replacement) {
      assert.deepEqual(Array.from(h.events.filter(event => event.type === h.wallet.PUBLIC_WALLET_STATE_EVENT),
        event => event.detail.account?.address ?? null), [null, 'wallet-A', null, 'wallet-B', null]);
      assert.equal(h.elements.connected.style.display, 'none');
      assert.equal(h.elements.connect.style.display, 'inline-block');
      await h.client.accountListener(account('wallet-B'));
      assert.equal(h.wallet.getPublicWalletState().account.address, 'wallet-B', 'a new event recovers');
    }
    assert.equal(h.fetches.some(url => !url.startsWith('https://tzkt.invalid/')), false);
  }
  console.log('B3-001 observed: delayed disconnect hides verified B; unchanged-disconnect and recovery controls pass.');
}

// Existing lifecycle fixture uses real countdown and pause-loop source, but
// stubs cosmetic ellipsis. Timers deliberately do not run during suspension;
// the browser can deliver visibility before an overdue polling task.
{
  const f = loadFixture('../../drops/js/countdown-lifecycle.test.mjs', "\ntest('public replacement");
  const make = vm.runInContext('fixture', f);
  const h = make({ past: true });
  h.call('startCountdown()');
  await clockFixtures.flush();
  h.storage[0].resolve({ ok: true, json: async () => ({ paused: false }) });
  await clockFixtures.flush();
  Object.assign(h.state, { walletConnected: true, activeAccount: { address: 'inert-wallet' },
    selectedTokenId: '0', redeemSupply: 3 });
  assert.equal(h.state.countdownPhase, 'live');
  assert.equal(typeof h.buttonState().clickAction, 'function');
  assert.equal(h.f.timers.size, 0, 'trusted countdown has retired at expiry');
  const reads = h.storage.length;
  h.f.document.hidden = true;
  h.f.document.dispatchEvent(new Event('visibilitychange'));
  h.f.advance(3600000);
  h.advancePauseRead(3600000);
  h.f.document.hidden = false;
  h.f.document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(h.storage.length, reads, 'resume performs no pause read');
  assert.equal(h.state.contractPaused, false);
  assert.equal(h.pills[0].textContent, 'LIVE NOW!');
  assert.equal(typeof h.buttonState().clickAction, 'function', 'hour-old evidence still authorizes the action');
  await h.retry();
  h.storage.at(-1).resolve({ ok: true, json: async () => ({ paused: true }) });
  await clockFixtures.flush();
  assert.equal(h.state.countdownPhase, 'standby');
  assert.equal(h.buttonState().clickAction, null, 'a fresh paused response closes the gate');
  h.call('stopPublicCountdown()');
  console.log('B3-002 observed: hidden/resumed LIVE remains actionable from hour-old pause evidence; fresh-pause control passes.');
}

// Edition counts are indivisible positive counts; a numeric prefix is not a
// validated count. Stop at the actual cart/total inputs; never call the handler.
{
  const f = loadFixture('../../exchange/js/exchange-wallet.test.mjs', "\ntest('AUD-008-001");
  const make = vm.runInContext('fixture', f);
  for (const [text, reward] of [['31', 4], ['100', 1], ['1e2', 100], ['1.5', 100], ['31oops', 4], ['1,000', 100]]) {
    const h = make();
    await h.connect();
    h.rows[0].querySelector('.collection-item-editions-text-number').textContent = text;
    h.select('1');
    const cart = h.call('getBurnCart()');
    assert.equal(cart.length, 1);
    assert.equal(cart[0].redeemAmount, reward);
    assert.equal(Number(h.total.textContent), reward);
    assert.equal(h.controls.live.style.display, 'block');
    assert.equal(h.errors.length, 0);
    assert.equal(h.sent.length + h.approvals.length + h.pairs.length, 0);
  }
  for (const text of ['', '0', '-1', 'n/a']) {
    const h = make();
    await h.connect();
    h.rows[0].querySelector('.collection-item-editions-text-number').textContent = text;
    h.select('1');
    assert.equal(h.controls.live.style.display, 'none');
    assert.throws(() => h.call('getBurnCart()'), /reward total/);
    assert.equal(h.sent.length, 0);
  }
  console.log('B3-003 observed: malformed edition prefixes become actionable exact rewards; valid and wholly-invalid controls pass.');
}

// Relevant visual evidence: real standby punctuation is mistaken for already
// truncated content. No layout engine is needed: a wide element never overflows.
{
  const el = { textContent: 'TIME UNAVAILABLE', dataset: {}, style: {}, clientWidth: 1000, scrollWidth: 100,
    classList: { contains: name => name === 'drop-details-drop-date-countdown-text-mobile' },
    setAttribute() {}, removeAttribute() {} };
  const context = vm.createContext({ document: { querySelectorAll: () => [el] } });
  vm.runInContext(dropsText.slice(dropsText.indexOf('function applyEllipsis()'),
    dropsText.indexOf('function enableTapToRevealEllipsis(')), context);
  context.applyEllipsis();
  el.textContent = 'STANDBY…';
  context.applyEllipsis();
  assert.equal(el.textContent, 'TIME UNAVAILABLE');
  el.textContent = 'LIVE NOW!';
  context.applyEllipsis();
  assert.equal(el.textContent, 'LIVE NOW!');
  console.log('Visual evidence observed: standby ellipsis restores old mobile text; LIVE text control passes.');
}

console.log('PASS: current source reproduced all bounded observations; no external requests or operation submission.');
