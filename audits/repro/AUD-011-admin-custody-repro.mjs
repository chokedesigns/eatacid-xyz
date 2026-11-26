// AUD-011 B5 evidence. All browser, SDK transport, storage and HTTP I/O is inert.
// Run: node audits/repro/AUD-011-admin-custody-repro.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { getEventListeners } from 'node:events';
import vm from 'node:vm';
import * as registry from '../../shared/chain-registry.js';
import { load, deferred, settle, recoveryEnvironment, ESCROW, RECIPIENT } from '../../admin-ui/tests/runtime/treasury.fixture.mjs';
import { fixture as pauseFixture } from '../../admin-ui/tests/runtime/pause.fixture.mjs';
import { composed, evidence } from '../../admin-ui/tests/repro/AUD-003-treasury-repro.mjs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8').replace(/\r\n?/g, '\n');
function prefix(path, stop, extra = {}) {
  const url = new URL(path, import.meta.url), text = read(path), end = text.indexOf(stop);
  assert.ok(end > 0, `fixture boundary: ${path}`);
  const source = text.slice(0, end).replace(/^import\s[\s\S]*?;\s*/gm, '')
    .replaceAll('import.meta.url', JSON.stringify(url.href));
  const ctx = vm.createContext({ assert, readFileSync, vm, load, deferred, settle,
    recoveryEnvironment, ESCROW, RECIPIENT, getEventListeners,
    URL, Event, EventTarget, AbortController, setImmediate, ...extra });
  vm.runInContext(source, ctx);
  return ctx;
}

// Independent Admin consumer of B3-001: actual installed getter/setter/clear/
// emitter; no requestOperation, SDK client construction or repeated E2 proof.
{
  const ctx = prefix('../../admin-ui/tests/runtime/beacon-wallet-boot-race.test.mjs', "\ntest('PROBE-P3");
  const make = vm.runInContext('fixture', ctx);
  const require = createRequire(new URL('../../admin-ui/package.json', import.meta.url));
  const { DAppClient, BeaconEvent, BeaconEventHandler } = require('@airgap/beacon-sdk');
  const { ExposedPromise } = require('@airgap/beacon-utils');
  const account = address => ({ address, accountIdentifier: address,
    origin: { type: 'extension' }, network: { type: 'shadownet' } });
  for (const replacement of [false, true]) {
    const f = make(); await f.finish(account('wallet-A'));
    const clearEntered = deferred(), releaseClear = deferred(), bEntered = deferred(), releaseB = deferred();
    const transport = { connectionStatus: 'CONNECTED' };
    const events = { callbackMap: { [BeaconEvent.ACTIVE_ACCOUNT_SET]: [f.account, active => {
      if (!active) releaseB.resolve();
    }] }, emit(...args) { return BeaconEventHandler.prototype.emit.call(this, ...args); } };
    const sdk = { isGetActiveAccountHandled: true, _activeAccount: ExposedPromise.resolve(account('wallet-A')),
      _transport: { isResolved: () => true }, transport, postMessageTransport: transport, events,
      getActiveAccount() { return DAppClient.prototype.getActiveAccount.call(this); },
      setActiveAccount(...args) { return DAppClient.prototype.setActiveAccount.call(this, ...args); },
      isInvalidState: async () => false, initInternalTransports: async () => {},
      setActivePeer: async () => {}, setTransport: async () => {}, getPeer: async () => ({}),
      storage: { set: async (_key, value) => {
        if (value === undefined) { clearEntered.resolve(); await releaseClear.promise; }
        if (value === 'wallet-B') { bEntered.resolve(); await releaseB.promise; }
      } } };
    f.window.dAppClient.clearActiveAccount = () => DAppClient.prototype.clearActiveAccount.call(sdk);
    f.window.dAppClient.getActiveAccount = () => sdk.getActiveAccount();
    const clearing = f.beacon.disconnectWallet(); await clearEntered.promise;
    let switching;
    if (replacement) { switching = sdk.setActiveAccount(account('wallet-B')); await bEntered.promise; }
    releaseClear.resolve(); await Promise.all([clearing, switching]); f.render();
    assert.equal(f.connect.style.display, 'inline-block');
    assert.equal(f.connected.style.display, 'none');
    assert.equal((await f.beacon.getVerifiedAdminActiveAccount())?.address ?? null, replacement ? 'wallet-B' : null);
    if (replacement) {
      assert.equal(f.disconnectEvents.length, 1, 'obsolete explicit disconnect publishes after B');
      await f.account(account('wallet-B')); f.render();
      assert.equal(f.connected.style.display, 'inline-block', 'fresh event recovers');
    }
  }
  console.log('B3-001 Admin extension: obsolete disconnect hides verified B; normal disconnect/recovery controls PASS.');
}

// B5-001: terminal chain evidence cannot free an action whose subsequent read
// never settles. A newer successful Refresh retires publication but does not
// release the original busy owner. Settling that SAME old read releases it.
for (const surface of ['drops', 'exchange']) {
  const p = pauseFixture(surface, undefined, true); await settle();
  const finalRead = deferred(); let reads = 0;
  p.setRead(() => { reads++; return finalRead.promise; });
  p.setPoll(async check => check());
  let done = false;
  const toggling = p.controller.onToggle().then(() => { done = true; }); await settle();
  assert.equal(reads, 1); assert.equal(p.requests.length, 1);
  assert.equal(p.recovery.getPauseOperation(p.cfg(), `${surface}-escrow`), null, 'chain outcome already settled');
  p.setRead(async () => ({ paused: false, admin: 'admin' }));
  await p.refresh();
  assert.equal(p.diagnostic('paused').textContent, 'Live');
  assert.equal(p.button.disabled, true); assert.equal(done, false);
  await p.controller.onToggle(); assert.equal(p.requests.length, 1);
  finalRead.resolve({ paused: true, admin: 'admin' }); await toggling;
  assert.equal(p.button.disabled, false);
  assert.equal(p.diagnostic('paused').textContent, 'Live', 'old read cannot overwrite newer evidence');

  for (const stage of ['fetch', 'json']) {
    const f = composed(surface), held = deferred(); let entered = 0;
    f.balanceFetch = () => { entered++; return stage === 'fetch' ? held.promise
      : Promise.resolve({ ok: true, json: () => held.promise }); };
    let completed = false;
    const withdrawing = f.submit('withdraw').then(() => { completed = true; }); await settle();
    f.operations = evidence(f, 'withdraw');
    f.confirmation.resolve(await f.pollRead()); await settle();
    assert.equal(entered, 1);
    assert.equal(f.recovery.getTreasuryOperation(f.live, ESCROW), null);
    f.balanceFetch = async () => ({ ok: true, json: async () => ({ balance: 1234567 }) });
    await f.nodes.withdrawRefreshButton.fire('click');
    assert.equal(f.nodes.withdrawBalance.textContent, '1.234567');
    assert.equal(f.state.withdrawUi.busy, true); assert.equal(completed, false);
    await f.submit('withdraw'); assert.equal(f.requests.length, 1);
    held.resolve(stage === 'fetch' ? { ok: true, json: async () => ({ balance: 5000000 }) } : { balance: 5000000 });
    await withdrawing;
    assert.equal(f.state.withdrawUi.busy, false);
    assert.equal(f.nodes.withdrawBalance.textContent, '1.234567');
    assert.ok(f.statuses.some(([, text]) => text === f.config.labels.withdrawSuccess));
  }
}
{
  const ctx = prefix('../../admin-ui/tests/runtime/treasury-refresh-order.test.mjs', "\nfor (const surface of");
  const make = vm.runInContext('fixture', ctx);
  for (const surface of ['drops', 'exchange']) {
    const f = make(surface); await f.init();
    f.nodes.transferRows.children[0].input.value = '1';
    const held = deferred(); f.storage = () => held.promise;
    const oldRefresh = f.manual(); await settle();
    let completed = false;
    const sending = f.nodes.transferButton.fire('click').then(() => { completed = true; }); await settle();
    f.storage = null; await f.manual();
    assert.equal((await f.state.statePromise).escrow, ESCROW);
    assert.equal(f.state.transferUi.busy, true); assert.equal(completed, false);
    await f.nodes.transferButton.fire('click'); assert.equal(f.sends.length, 0);
    held.resolve({}); await oldRefresh; await sending;
    assert.equal(f.state.transferUi.busy, false);
    assert.equal(f.sends.length, 0, 'obsolete incomplete state cannot send');
  }
}
console.log('B5-001: 8 stalls (2 pause final reads, 4 withdrawal fetch/body reads, 2 superseded transfer preflights); replacement and eventual-response controls PASS.');

// B5-002: a successfully stored receipt whose verification read throws leaves
// emergency memory in tab A. Tab B can recover the durable receipt and start a
// new unresolved operation. A must compare the actual current durable ID before
// settlement; its old emergency row must not hide and overwrite B's new row.
for (const action of ['pause', 'treasury']) {
  for (const failReceiptReadback of [false, true]) {
    const env = recoveryEnvironment(), window = Object.assign(new EventTarget(), env);
    const originalGet = window.localStorage.getItem, originalSet = window.localStorage.setItem;
    let writes = 0, failNext = false, sends = 0;
    window.localStorage.setItem = (key, value) => {
      originalSet(key, value);
      if (++writes === 2 && failReceiptReadback) failNext = true;
    };
    window.localStorage.getItem = key => {
      if (failNext) { failNext = false; throw Error('inert receipt readback unavailable'); }
      return originalGet(key);
    };
    const a = load(action === 'pause' ? 'features/pause-recovery' : 'features/treasury/recovery', { window, crypto });
    const b = load(action === 'pause' ? 'features/pause-recovery' : 'features/treasury/recovery', { window, crypto });
    const cfg = { network: 'testnet', tzktBase: 'https://inert.invalid' };
    const get = owner => action === 'pause' ? owner.getPauseOperation(cfg, ESCROW) : owner.getTreasuryOperation(cfg, ESCROW);
    const send = owner => {
      const emit = async () => ({ hash: `inert-hash-${++sends}` });
      return action === 'pause' ? owner.requestPauseOperation({ cfg, account: { address: RECIPIENT }, escrow: ESCROW }, emit)
        : owner.requestTreasuryOperation({ cfg, account: { address: RECIPIENT }, operationDetails: [{
          destination: ESCROW, parameters: { entrypoint: 'admin_withdraw_xtz', value: { int: '1' } },
        }] }, emit);
    };
    const settleRow = (owner, id) => action === 'pause'
      ? owner.settlePauseOperation(cfg, ESCROW, id, 'applied', () => true)
      : owner.settleTreasuryOperation(cfg, ESCROW, id, 'applied', () => true);
    if (failReceiptReadback) await assert.rejects(send(a), /readback unavailable/);
    else await send(a);
    const old = get(a);
    assert.equal(get(b).hash, old.hash, 'receipt write succeeded; B has the real durable hash');
    assert.equal(await settleRow(b, old.id), true);
    await send(b);
    const next = get(b);
    assert.notEqual(next.id, old.id); assert.equal(next.hash, 'inert-hash-2');
    // This is the real ID-checked settlement seam called after polling A's old
    // hash. Both IDs have valid scoped evidence; B's hash has no terminal result.
    assert.equal(await settleRow(a, old.id), failReceiptReadback);
    if (failReceiptReadback) {
      assert.equal(get(b), null, 'A overwrote the NEW unresolved operation with OLD applied result');
      await send(b); assert.equal(sends, 3, 'a third wallet request now crosses the lost exclusion');
    } else {
      assert.equal(get(b).id, next.id, 'unchanged-persistence control preserves B');
      await assert.rejects(send(b), /pending/); assert.equal(sends, 2);
    }
  }
}
console.log('B5-002: Pause and Treasury emergency memory can erase a newer unresolved journal; durable-ID controls PASS.');

// Confirm reachability through the real Refresh consumers, not only the store
// exports. These are two inert tabs of the same surface; no signer is invoked.
for (const surface of ['drops', 'exchange']) {
  for (const action of ['pause', 'withdraw']) {
    const env = recoveryEnvironment(), originalGet = env.localStorage.getItem, originalSet = env.localStorage.setItem;
    let writes = 0, failNext = false;
    env.localStorage.setItem = (key, value) => { originalSet(key, value); if (++writes === 2) failNext = true; };
    env.localStorage.getItem = key => {
      if (failNext) { failNext = false; throw Error('inert receipt readback unavailable'); }
      return originalGet(key);
    };
    if (action === 'pause') {
      const a = pauseFixture(surface, undefined, true, env); await settle();
      await a.controller.onToggle();
      const b = pauseFixture(surface, undefined, true, env); await settle();
      b.setEvidence([{ hash: 'inert-operation', type: 'transaction', counter: 10, nonce: null,
        target: { address: `${surface}-escrow` }, parameter: { entrypoint: 'toggle_pause' }, status: 'applied' }]);
      b.setPoll(async check => check()); await b.refresh();
      assert.equal(b.recovery.getPauseOperation(b.cfg(), `${surface}-escrow`), null);
      b.setSend(async () => ({ opHash: 'inert-operation-B' }));
      b.setPoll(async () => false); await b.controller.onToggle();
      const next = b.recovery.getPauseOperation(b.cfg(), `${surface}-escrow`);
      assert.equal(next.hash, 'inert-operation-B');
      a.setPoll(async check => check()); await a.refresh();
      assert.equal(b.recovery.getPauseOperation(b.cfg(), `${surface}-escrow`), null);
      await b.controller.onToggle();
      assert.equal(a.requests.length + b.requests.length, 3);
    } else {
      const a = composed(surface, { recoveryEnv: env }); await a.submit('withdraw');
      const b = composed(surface, { recoveryEnv: env });
      const originalRequest = b.window.dAppClient.requestOperation;
      b.window.dAppClient.requestOperation = async request => {
        await originalRequest(request); return { transactionHash: `inert-operation-B-${b.requests.length}` };
      };
      const firstRecovery = b.recover(); await settle();
      b.operations = evidence(b, 'withdraw');
      b.confirmation.resolve(await b.pollRead()); await firstRecovery;
      b.nodes.withdrawAmount.value = '1'; await b.nodes.withdrawAmount.fire('input');
      const nextSend = b.submit('withdraw'); await settle();
      b.operations = []; b.confirmation.resolve(false); await nextSend;
      assert.equal(b.recovery.getTreasuryOperation(b.live, ESCROW).hash, 'inert-operation-B-1');
      const staleRecovery = a.recover(); await settle();
      a.operations = evidence(a, 'withdraw');
      a.confirmation.resolve(await a.pollRead()); await staleRecovery;
      assert.equal(b.recovery.getTreasuryOperation(b.live, ESCROW), null);
      const third = b.submit('withdraw'); await settle();
      assert.equal(a.requests.length + b.requests.length, 3);
      b.confirmation.resolve(false); await third;
    }
  }
}
console.log('B5-002 UI consumers: both surfaces x Pause/withdraw Refresh overwrite the newer unresolved journal; PASS (defect asserted).');

// Network changes own a reload boundary, not the network:change event that the
// controllers also support. Exercise actual set/get functions without a reload.
{
  for (const mode of ['ok', 'same', 'invalid', 'clear-fails', 'persist-fails', 'no-reload', 'no-clear']) {
    const data = new Map([['ea.admin.network', 'testnet']]), calls = [];
    const gate = deferred();
    const window = { localStorage: { getItem: key => data.get(key) ?? null,
      setItem: (key, value) => { if (mode === 'persist-fails') throw Error('inert quota'); calls.push('persist'); data.set(key, value); } },
      location: { reload: mode === 'no-reload' ? null : () => calls.push('reload') },
      dAppClient: { clearActiveAccount: mode === 'no-clear' ? null : async () => {
        calls.push('clear'); await gate.promise; if (mode === 'clear-fails') throw Error('inert clear failure');
      } } };
    const ctx = vm.createContext({ ...registry, window, console, isDebugEnabled: () => false, exposeDebugGlobals() {} });
    vm.runInContext(read('../../admin-ui/src/network.js').replace(/^import\s[\s\S]*?;\s*/gm, '')
      .replaceAll('import.meta.url', "'inert-module'").replace('export default CFG;', '')
      .replace(/^export /gm, ''), ctx);
    const next = mode === 'same' ? 'testnet' : mode === 'invalid' ? 'invalid' : 'mainnet';
    const result = ctx.setNetwork(next); const rejected = ['invalid', 'clear-fails', 'persist-fails', 'no-reload', 'no-clear'].includes(mode);
    const checked = rejected ? assert.rejects(result) : result;
    await settle();
    assert.equal(data.get('ea.admin.network'), 'testnet', 'selection remains old until clear finishes');
    gate.resolve(); await checked;
    assert.deepEqual(calls, mode === 'ok' ? ['clear', 'persist', 'reload']
      : ['clear-fails', 'persist-fails'].includes(mode) ? ['clear'] : []);
    assert.equal(data.get('ea.admin.network'), mode === 'ok' ? 'mainnet' : 'testnet');
  }
  const data = new Map([['network', 'mainnet']]);
  const window = { localStorage: { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) } };
  const ctx = vm.createContext({ ...registry, window, console, isDebugEnabled: () => false, exposeDebugGlobals() {} });
  vm.runInContext(read('../../admin-ui/src/network.js').replace(/^import\s[\s\S]*?;\s*/gm, '')
    .replaceAll('import.meta.url', "'inert-module'").replace('export default CFG;', '').replace(/^export /gm, ''), ctx);
  assert.equal(ctx.getNetwork(), 'mainnet'); assert.equal(data.get('ea.admin.network'), 'mainnet');
  data.set('ea.admin.network', 'invalid'); assert.equal(ctx.getNetwork(), 'testnet');
  console.log('Network controls: clear-before-persist/reload, failures, same/invalid slots and legacy migration PASS.');
}

// Ordinary surface selection changes visibility and closes Drops' shared modal;
// it does not change the initialized controllers' escrow or storage ownership.
{
  const node = () => ({ hidden: false, attributes: {}, handlers: {}, dataset: {},
    classList: { toggle() {} }, setAttribute(key, value) { this.attributes[key] = value; },
    addEventListener(name, fn) { this.handlers[name] = fn; } });
  const controls = ['drops', 'exchange'].map(name => Object.assign(node(), { dataset: { adminSurfaceControl: name } }));
  const dropsSurface = node(), exchangeSurface = node(); let closed = 0;
  const ctx = vm.createContext({ closeEditModal: () => { closed++; } });
  const admin = read('../../admin-ui/src/admin.js');
  vm.runInContext(admin.slice(admin.indexOf('function initAdminSurfaceSwitcher('), admin.indexOf('// Kick everything off')), ctx);
  ctx.initAdminSurfaceSwitcher({ controls, dropsSurface, exchangeSurface });
  assert.equal(dropsSurface.hidden, false); assert.equal(exchangeSurface.hidden, true);
  controls[1].handlers.click(); assert.equal(closed, 1); assert.equal(exchangeSurface.hidden, false);
  controls[1].handlers.click(); assert.equal(closed, 1);
  controls[0].handlers.click(); assert.equal(dropsSurface.hidden, false); assert.equal(exchangeSurface.hidden, true);
  assert.equal(controls[0].attributes['aria-selected'], 'true');
}
for (const mode of ['paused', 'live', 'malformed', 'error', 'unconfigured']) {
  const fields = new Map();
  const document = { getElementById: id => {
    if (!fields.has(id)) fields.set(id, { textContent: '', title: '', classList: { add() {} }, addEventListener() {} });
    return fields.get(id);
  } };
  const held = deferred(); let reads = 0;
  const status = load('features/exchange-status', { document, console: { error() {} },
    getLiveCfg: () => ({ network: 'testnet' }),
    resolveExchangeEscrowTarget: () => ({ address: mode === 'unconfigured' ? '' : ESCROW }),
    normalizeEscrowAddress: value => ({ address: value || '' }),
    getStorage: () => { reads++; return held.promise; } });
  const pending = status.renderExchangeStatus();
  if (mode === 'unconfigured') { await pending; assert.equal(reads, 0); }
  else {
    assert.equal(fields.get('btn-exchange-status-refresh').disabled, true);
    if (mode === 'error') held.reject(Error('inert HTTP failure'));
    else held.resolve({ paused: mode === 'malformed' ? null : mode === 'paused', admin: RECIPIENT, burn_address: RECIPIENT });
    await pending; assert.equal(fields.get('btn-exchange-status-refresh').disabled, false);
  }
  assert.equal(fields.get('exchange-status-paused').textContent,
    mode === 'paused' ? 'Paused' : mode === 'live' ? 'Live' : mode === 'unconfigured' ? '-' : 'Unknown');
}
console.log('Surface/status controls: visibility/modal ownership, pause booleans, unknown/error/unconfigured and read-only refresh lifecycle PASS.');
