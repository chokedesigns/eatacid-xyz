// AUD-011 B6: current production bodies, inert DOM/indexer/wallet boundaries.
// Run: node audits/repro/AUD-011-admin-orchestration-repro.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { exactTokenId, compareTokenIds } from '../../admin-ui/src/features/drops/utils/token-id.js';
import { pairWriteDependencies, deferred, settle, load as runtimeLoad, ESCROW } from '../../admin-ui/tests/runtime/treasury.fixture.mjs';
import { createDom } from '../../admin-ui/tests/runtime/harness.mjs';
import { createDropsWallet } from '../../admin-ui/tests/runtime/drops-wallet.fixture.mjs';
import { getViewSig } from '../../admin-ui/src/features/drops/utils/get-view-sig.js';
import { getDropsPublicState } from '../../admin-ui/src/features/drops/drops.public-state.js';

// Reuse setup only; no historical test body is run or changed. Keep source paths
// relative to each original fixture. The actual modal content/widgets/controller
// all execute, rather than replacing population with a synchronous mock.
async function prefix(path, stop, extra = {}) {
  const url = new URL(path, import.meta.url);
  const source = readFileSync(url, 'utf8').replace(/\r\n?/g, '\n');
  const end = source.indexOf(stop);
  assert.ok(end > 0, `fixture boundary: ${path}`);
  const body = source.slice(0, end).replace(/^import\s[\s\S]*?;\s*/gm, '')
    .replaceAll('import.meta.url', JSON.stringify(url.href));
  const ctx = vm.createContext({ assert, readFileSync, readFile: async (...args) => readFileSync(...args), vm, URL, console,
    Event, CustomEvent, EventTarget, AbortController, setImmediate, setTimeout, clearTimeout, structuredClone,
    exactTokenId, compareTokenIds, pairWriteDependencies, createDropsWallet,
    load: runtimeLoad, deferred, settle, ESCROW, createDom, ...extra });
  return vm.runInContext(`(async () => {\n${body}\nreturn { fixture };\n})()`, ctx, { filename: path });
}

// Qualified exported-hook evidence ONLY: the shipped uiToken is local-only and
// has no pending remote read. Holding it does not prove this inter-click ordering
// in the registered UI. Do not count this as an active material finding.
{
  const { fixture: make } = await prefix('../../admin-ui/tests/runtime/pair-modal-pending.test.mjs', '\nfor (const scenario of');
  for (const supersede of [false, true]) {
    const f = make(), held = deferred(), a = f.operation(), b = f.operation();
    const address = letter => `KT1${letter.repeat(33)}`;
    const pair = (id, token) => ({ id: String(id),
      burn: { contract: address('A'), tokenId: token, amount: '1' },
      redeem: { contract: address('B'), tokenId: '1', amount: '1' } });
    let entered = false;
    a.hooks.uiToken = () => { entered = true; return held.promise; };
    const pairA = pair(10, '0');
    pairA.burn.contract = address('D'); // Custom mode has its token before initial preview.
    const mountingA = f.open(pairA, a.hooks);
    await settle(); assert.equal(entered, true);
    if (supersede) {
      f.close(); await f.open(pair(20, '2'), b.hooks);
      f.edit('burn-amount', '7');
      assert.equal(f.node('burn-tokenId-select').value, '2');
    }
    held.resolve({ title: 'Old token', image: 'old-image' });
    await mountingA; await settle();
    if (supersede) {
      assert.equal(f.node('burn-tokenId-select').value, '0');
      assert.equal(f.snapshot().title, 'Edit Token Pair #20');
      assert.equal(f.node('burn-amount').value, '7');
      assert.equal(f.snapshot().disabled, false);
      const savingB = f.save();
      assert.equal(b.payloads.length, 1);
      assert.equal(b.payloads[0].token_pair_id, '20');
      assert.equal(b.payloads[0].burn_token_id, '0', 'old population changed newer pair terms');
      assert.equal(b.payloads[0].burn_amount, '7');
      assert.equal(a.payloads.length, 0);
      b.send.resolve({ opHash: 'inert-B' }); b.confirmation.resolve(false); await savingB;
    } else {
      assert.equal(f.node('burn-tokenId-custom').value, '0');
      assert.equal(f.snapshot().title, 'Edit Token Pair #10');
      assert.equal(f.snapshot().disabled, true, 'unchanged normal mount stays disabled');
    }
  }
  console.log('Exported-hook limitation only: a pending custom resolver permits old population to replace newer terms; normal mount control PASS. Shipped local resolver timing is NOT established by the held promise.');
}

// B6-001: actual registered Auto handlers. Their external availability/highest-ID
// producers may legitimately wait on HTTP. Inert view reset is deliberately not
// used to claim changed transaction fields: assert the actual Pair ID node and
// status writes, both of which come from the production controller.
{
  const { fixture: make } = await prefix('../../admin-ui/tests/runtime/set-pair-ownership.test.mjs', '\nfor (const surface of');
  for (const surface of ['drops', 'exchange']) {
    for (const supersede of [false, true]) {
      const f = make(), p = await f.ready(surface), held = deferred();
      const state = f.shared.makeSetPanelState(surface);
      const hooks = f.shared.getCurrentHooks(state);
      let entered = false;
      if (surface === 'drops') hooks.isPairIdAvailable = () => {
        if (entered) return Promise.resolve(true);
        entered = true; return held.promise;
      };
      else hooks.highestActivePairId = () => { entered = true; return held.promise; };
      p.nodes.btnAuto.dispatchEvent(new Event('click'));
      await settle(); assert.equal(entered, true);
      if (supersede) {
        p.nodes.btnRefresh.dispatchEvent(new Event('click')); await settle();
        p.nodes.pairIdEl.value = '90';
        p.nodes.pairIdEl.dispatchEvent(new Event('input'));
        assert.equal(p.nodes.pairIdEl.value, '90');
      }
      held.resolve(surface === 'drops' ? true : 3);
      await settle(); await settle();
      assert.equal(p.nodes.pairIdEl.value, surface === 'drops' ? '0' : '4');
      assert.ok(f.statusMessages.some(text => text.startsWith('Auto-filled Pair ID:')));
      assert.equal(f.writes.length, 0, 'Auto itself has no wallet side effect');
    }
  }
  console.log('B6-001: both registered Set Pair Auto handlers overwrite ID 90 after Reset/manual edit with their older result; unchanged Auto controls PASS.');
}

// B6-002: confirmed first chunk followed by a rejected request or absent hash.
// The stop-on-unconfirmed control differs from catch: catch leaves Send enabled
// and never refreshes the chain status. No actual SDK request is made here.
{
  const { fixture: make } = await prefix('../../admin-ui/tests/runtime/drops-send-invalidation.test.mjs', "\ntest('AUD-003-006");
  for (const outcome of ['applied', 'unconfirmed', 'request-error', 'no-hash']) {
    const f = make();
    const node = value => Object.assign(new EventTarget(), { value, textContent: '', dataset: {}, style: {},
      setAttribute() {}, classList: { add() {}, remove() {}, toggle() {} } });
    const nodes = new Map([['drops-panel', f.panel], ['drop-nextPairId', node('10')],
      ['drop-chunkSize', node('1')], ['btn-drop-send', node('')],
      ['drop-paused-dot', node('')], ['drop-paused-label', node('')]]);
    f.panel.querySelector = () => null;
    f.common.document.getElementById = id => nodes.get(id) || null;
    runtimeLoad('features/drops/drops.view.panel', { document: f.common.document,
      window: f.common.window, getLiveCfg: () => f.cfg, getViewSig }).initDropsPanelView();
    const sig = getViewSig({ nextPairId: '10', chunkSize: '1' });
    f.state.ui.viewSig = f.state.lastDropsState.viewSig = sig;
    Object.assign(f.panel.dataset, { previewSig: sig, paramsLoaded: '1', canSend: '1' });
    f.deps.emitDropsState = () => f.panel.dispatchEvent(new CustomEvent('drops:controller:state',
      { detail: getDropsPublicState(f.state) }));
    f.common.document.dispatchEvent(new CustomEvent('escrow:paused:state', { detail: {
      paused: true, network: f.cfg.network, escrow: f.cfg.escrow,
    } }));
    f.deps.emitDropsState();
    assert.equal(nodes.get('btn-drop-send').disabled, false);
    const original = f.deps.setTokenPairs;
    f.deps.setTokenPairs = async (...args) => {
      if (f.submissions.length === 1 && outcome === 'request-error') throw new Error('inert ambiguous transport error');
      const result = await original(...args);
      return f.submissions.length === 2 && outcome === 'no-hash' ? {} : result;
    };
    f.deps.waitForOperation = async hash => {
      f.waits.push(hash);
      return hash && !(outcome === 'unconfirmed' && f.waits.length === 2);
    };
    await f.send();
    const batches = f.state.sendHistory[0].batches;
    assert.equal(batches[0].status, 'applied');
    if (outcome === 'request-error') {
      assert.equal(batches[1].status, 'error');
      assert.equal(f.state.ui.canSend, true);
      assert.equal(f.panel.dataset.canSend, '1');
      assert.equal(nodes.get('btn-drop-send').disabled, false, 'actual Send view is ready after partial application');
      assert.equal(f.updates.length, 0, 'partial application never rechecks or retires pair status');
      assert.equal(f.events.includes('pairs:op:final'), false);
    } else if (outcome === 'applied') {
      assert.equal(f.submissions.length, 3);
      assert.equal(f.state.ui.canSend, false);
      assert.equal(nodes.get('btn-drop-send').disabled, true);
      assert.ok(f.statuses.some(([text]) => text === 'Drop pairs confirmed on-chain.'));
    } else {
      assert.equal(f.submissions.length, 2);
      assert.equal(f.state.ui.canSend, false);
      assert.equal(nodes.get('btn-drop-send').disabled, true);
      assert.equal(f.statuses.some(([text]) => text === 'Drop pairs confirmed on-chain.'), false);
    }
  }
  console.log('B6-002: chunk 1 applied/chunk 2 request error leaves Send ready, pair status untouched; full, unconfirmed and no-hash controls PASS.');
}

// B6-003: selected cleanup is a registered button -> exact serializer -> SDK
// seam. Hold confirmation, leaving the first request unresolved, and click a
// second time. No journal, lock or pending owner exists for this action.
{
  const { fixture: make } = await prefix('../../admin-ui/tests/runtime/pairs-cleanup.test.mjs', '\nfor (const selected of');
  for (const repeat of [false, true]) {
    const f = await make(['29']);
    f.select('29');
    f.confirmationGate = deferred();
    const first = f.click(); await settle();
    assert.equal(f.operations.length, 1);
    assert.equal(f.nodes['btn-pairs-cleanup'].disabled, false);
    let second;
    if (repeat) { second = f.click(); await settle(); }
    assert.equal(f.operations.length, repeat ? 2 : 1);
    for (const operation of f.operations) {
      const detail = operation.operationDetails[0];
      assert.equal(detail.destination, ESCROW);
      assert.equal(detail.parameters.entrypoint, 'cleanup_token_pairs');
      assert.deepEqual(JSON.parse(JSON.stringify(detail.parameters.value)), [{ int: '29' }]);
    }
    f.confirmationGate.resolve(); await Promise.all([first, second]);
    assert.equal(f.errors.length, 0);
  }
  console.log('B6-003: selected Drops cleanup remains enabled and opens two exact cleanup requests before the first confirmation; single-click control PASS.');
}

// B5-001 family extension: new B6 owners/producers, not another custody run.
{
  const { fixture: make } = await prefix('../../admin-ui/tests/runtime/set-pair-ownership.test.mjs', '\nfor (const surface of');
  for (const surface of ['drops', 'exchange']) {
    const f = make(), p = await f.ready(surface), held = deferred();
    const target = surface === 'drops' ? f.cfg.escrow : 'KT1GCvVdxELA4mPUn4DiBpPAd8ARRtyoEpke';
    f.availability[target] = held;
    await f.click(surface);
    const state = f.shared.makeSetPanelState(surface);
    const owner = state.submitOwner;
    assert.ok(owner); assert.equal(f.writes.length, 0);
    f.availability[target] = false;
    if (surface === 'drops') await f.pairs.render(f.configs.drops);
    else await f.exchange.renderExchangePairs();
    assert.equal(state.submitOwner, owner);
    assert.equal(p.nodes.btnSet.disabled, true);
    await f.click(surface); assert.equal(f.writes.length, 0);
    held.resolve(false); await settle();
    assert.equal(f.writes.length, 1);
    await f.finish(f.writes[0]);
    assert.equal(state.submitOwner, null);
  }
  console.log('B5-001 B6 extension: both pair creates retain old preflight ownership after newer table reads; settling the old read releases it.');
}
for (const stage of ['fetch', 'text']) {
  const button = { disabled: false, handlers: {}, addEventListener(type, fn) { this.handlers[type] = fn; } };
  const document = Object.assign(new EventTarget(), { hidden: false,
    getElementById: id => id === 'btn-drops-check-github-refresh' ? button : null });
  const held = deferred(), dots = new Map();
  let reads = 0;
  const cfg = { network: 'testnet', escrow: 'escrow', tzktBase: 'https://inert.invalid', collections: {} };
  const raw = { dropScheduled: true }, norm = { dropScheduled: true };
  const c = runtimeLoad('features/drops/drops.checklist.controller', {
    document, getLiveCfg: () => cfg, makeChainUi: () => ({ collectionsMap: {} }),
    tokenExists: async () => true, getFa2Balances: async () => [],
    poll: () => new Promise(() => {}), AbortController,
    logWarn() {}, setChecklistDot: (name, value) => dots.set(name, value),
    assertChecklistNeutralInvariant() {}, fetch: async () => {
      reads++;
      if (reads === 1) return stage === 'fetch' ? held.promise : { ok: true, text: () => held.promise };
      return { ok: true, text: async () => JSON.stringify(raw) };
    },
  });
  await c.refreshChecklistFromNorm(norm, raw);
  let done = false;
  const manual = button.handlers.click().then(() => { done = true; });
  await settle(); assert.equal(button.disabled, true);
  c.invalidateChecklistForParamsChange();
  await c.refreshChecklistFromNorm({ ...norm }, raw); await settle();
  assert.equal(dots.get('paramsGithubStaging'), 'ok');
  assert.equal(dots.get('paramsGithubMain'), 'ok');
  assert.equal(button.disabled, true); assert.equal(done, false);
  held.resolve(stage === 'fetch' ? { ok: true, text: async () => '{}' } : '{}');
  await manual;
  assert.equal(button.disabled, false);
  assert.equal(dots.get('paramsGithubStaging'), 'ok', 'old mismatch cannot replace new equal evidence');
  c.resetChecklistForNetworkChange();
}
console.log('B5-001 B6 extension: GitHub fetch/body stalls retain manual Refresh disabled after a new successful comparison; eventual-response/stale-publication controls PASS.');
