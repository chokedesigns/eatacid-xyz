import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { classifyPublicTradeRequestRejection, createSubmittedTradeStore, pollForConfirmation } from './public-trade-ops.js';

test('TX-002: abort classification requires wallet response provenance and never trusts loose hash hints', () => {
  const context = { originType: 'extension', senderId: 'wallet-sender' };
  const abort = { type: 'error', version: '2', id: 'request-id', senderId: 'wallet-sender', errorType: 'ABORTED_ERROR' };
  assert.equal(classifyPublicTradeRequestRejection(abort, context).notSubmitted, true);
  for (const error of [null, 'ABORTED_ERROR', new Error('User rejected'),
    { ...abort, id: '' }, { ...abort, version: '3' }, { ...abort, type: 'disconnect' },
    { ...abort, senderId: '' }, { ...abort, senderId: 'other-wallet' },
    { ...abort, errorType: 'BROADCAST_ERROR' }, { ...abort, errorType: 'UNKNOWN_ERROR' },
    { ...abort, errorData: { hash: 'unverified-hash' } }, { ...abort, opHash: 'unverified-hash' },
    { ...abort, transactionHash: 'unverified-hash' }, { ...abort, operationHash: 'unverified-hash' }]) {
    assert.deepEqual(classifyPublicTradeRequestRejection(error, context), { hash: null, notSubmitted: false });
  }
  for (const originType of ['walletconnect', 'website', 'unknown', undefined]) {
    assert.equal(classifyPublicTradeRequestRejection(abort, { ...context, originType }).notSubmitted, false);
  }
  assert.equal(classifyPublicTradeRequestRejection(abort).notSubmitted, false);
  const response = { ...abort, type: 'operation_response', transactionHash: 'returned-hash' };
  assert.deepEqual(classifyPublicTradeRequestRejection(response, context), { hash: 'returned-hash', notSubmitted: false });
  assert.equal(classifyPublicTradeRequestRejection({ ...response, senderId: 'other-wallet' }, context).hash, null);
});

test('TX-002: installed Beacon 4.8.1 WalletConnect collapses transport and user rejection into the same abort', async () => {
  const sdk = JSON.parse(readFileSync(new URL('../node_modules/@airgap/beacon-sdk/package.json', import.meta.url), 'utf8'));
  assert.equal(sdk.version, '4.8.1');
  const source = readFileSync(new URL('../node_modules/@airgap/beacon-transport-walletconnect/dist/esm/communication-client/WalletConnectCommunicationClient.js', import.meta.url), 'utf8');
  const start = source.indexOf('    async sendOperations('), end = source.indexOf('    isMobileSesion(', start);
  assert.ok(start >= 0 && end > start, 'Installed SDK operation-request boundary is available');
  // Execute the installed method, with inert SignClient/session/notification boundaries.
  const sendOperations = vm.runInNewContext(`({${source.slice(start, end)}}).sendOperations`, {
    PermissionScopeMethods: { OPERATION_REQUEST: 'operation' }, TEZOS_PLACEHOLDER: 'tezos', isPublicKeySC: () => false,
    BeaconMessageType: { Error: 'error', OperationResponse: 'operation_response' },
    BeaconErrorType: { ABORTED_ERROR: 'ABORTED_ERROR' }
  });
  for (const rejection of [new Error('inert post-submit transport failure'),
    { code: 4001, message: 'User rejected' }, { transactionHash: 'lost-hash', message: 'response lost' }]) {
    let notify;
    const result = new Promise(resolve => { notify = resolve; });
    await sendOperations.call({
      getSignClient: async () => ({ request: () => Promise.reject(rejection) }),
      getSession: () => ({ topic: 'session' }), getPermittedMethods: () => ['operation'],
      checkAndExtendSession: async () => {}, getActiveNetwork: () => 'testnet', getAccountOrPK: async () => 'wallet-A',
      validateNetworkAndAccount() {}, checkWalletReadiness() {}, getTopicFromSession: () => 'session',
      messageIds: ['request-id'], notifyListeners: (_topic, response) => notify(response)
    }, { operationDetails: [] });
    assert.equal(JSON.stringify(await result), JSON.stringify({ type: 'error', id: 'request-id', errorType: 'ABORTED_ERROR' }));
  }
});

function fixture() {
  const rows = new Map();
  const storage = { get length() { return rows.size; }, key: i => [...rows.keys()][i],
    getItem: k => rows.get(k), setItem: (k, v) => rows.set(k, v), removeItem: k => rows.delete(k) };
  const held = new Map();
  const locks = { request(name, options, run) {
    const callback = run || options;
    if (run && options.ifAvailable && held.has(name)) return Promise.resolve(callback(null));
    const prior = held.get(name) || Promise.resolve();
    const result = prior.then(() => callback({}), () => callback({}));
    held.set(name, result);
    return result.finally(() => { if (held.get(name) === result) held.delete(name); });
  } };
  const store = () => createSubmittedTradeStore({ storage: () => storage, locks: () => locks });
  const scope = { network: 'testnet', tzktBase: 'https://inert.test', escrowAddress: 'escrow', account: 'wallet-A' };
  const operations = [{ destination: 'escrow', parameters: { entrypoint: 'initiate_trade', value: [{ int: '1' }] } }];
  const tokens = [{ contractAddress: 'burn', tokenId: '4', quantity: 1, startingBalance: 5 }];
  const journal = store();
  const reserve = (owner = journal, context = scope) => owner.reserve(context, operations, tokens);
  const submit = () => journal.submitted(reserve(), 'returned-hash');
  const evidence = (status = 'applied') => [{ id: 1, type: 'transaction', hash: 'returned-hash',
    sender: { address: 'wallet-A' }, target: { address: 'escrow' }, parameter: { entrypoint: 'initiate_trade' }, status }];
  const poll = (hash, receipt) => pollForConfirmation({ tzktBase: receipt.tzktBase, opHash: hash,
    submittedTrade: receipt, timeout: 7, interval: 0 });
  return { rows, storage, store, journal, scope, reserve, submit, evidence, poll, operations, tokens };
}

test('TX-002: receipt scope, immutable intent, persistence and bounded fail-closed storage', async () => {
  const f = fixture(), record = f.submit();
  record.operations[0].parameters.value[0].int = '9';
  assert.equal(f.journal.get(f.scope).operations[0].parameters.value[0].int, '1');
  for (const field of ['network', 'tzktBase', 'escrowAddress', 'account']) {
    assert.equal(f.journal.get({ ...f.scope, [field]: 'other' }), null);
  }
  const reload = f.store();
  assert.equal(reload.get(f.scope).hash, 'returned-hash');
  assert.throws(() => f.reserve(reload), /reconciled/);
  await assert.rejects(reload.reconcile({ ...record, account: 'other' }, f.poll), /receipt changed/);
  // Interrupted wallet request remains blocked even without a returned hash.
  const other = { ...f.scope, account: 'wallet-B' };
  f.reserve(reload, other);
  await assert.rejects(f.store().reconcile(reload.get(other), f.poll), /no operation hash/);
  for (let i = 2; i < 32; i++) f.reserve(reload, { ...f.scope, account: `wallet-${i}` });
  assert.throws(() => f.reserve(reload, { ...f.scope, account: 'full' }), /full/);
  f.rows.set([...f.rows.keys()][0], '{}');
  assert.throws(() => reload.get(f.scope), /invalid/);
  f.storage.getItem = () => { throw new Error('inert blocked storage'); };
  assert.throws(() => f.reserve(), /blocked storage/);
});

test('TX-002: real poller rejects unrelated, incomplete, malformed and contradictory evidence without deleting receipt', async () => {
  const f = fixture(), record = f.submit(), originalFetch = globalThis.fetch;
  const valid = f.evidence();
  const cases = [[], {}, null, [{ ...valid[0], hash: 'different' }], [{ ...valid[0], sender: { address: 'other' } }],
    [{ ...valid[0], target: { address: 'other' } }], [{ ...valid[0], parameter: { entrypoint: 'update_operators' } }],
    [{ ...valid[0], id: undefined }], [...valid, { ...valid[0], id: 2, status: 'failed' }]];
  try {
    for (const body of cases) {
      globalThis.fetch = async () => ({ ok: true, json: async () => body });
      await assert.rejects(f.journal.reconcile(record, f.poll), /timed out/);
      assert.equal(f.journal.get(f.scope).status, 'submitted');
    }
    for (const response of [
      async () => { throw new Error('outage'); },
      async () => ({ ok: false, status: 503, text: async () => 'unavailable' }),
      async () => ({ ok: true, json: async () => { throw new SyntaxError('invalid JSON'); } })
    ]) {
      globalThis.fetch = response;
      await assert.rejects(f.journal.reconcile(record, f.poll), /timed out/);
      assert.equal(f.store().get(f.scope).hash, record.hash);
    }
    // Two grouped trade calls require two distinct matching rows, all terminal.
    f.journal.cancel(record);
    const batch = f.journal.submitted(f.journal.reserve(f.scope, [...f.operations, ...f.operations], f.tokens), 'returned-hash');
    for (const body of [valid, [...valid, valid[0]], [...valid, { ...valid[0], id: 2, status: 'failed' }]]) {
      globalThis.fetch = async () => ({ ok: true, json: async () => body });
      await assert.rejects(f.journal.reconcile(batch, f.poll), /timed out/);
    }
    globalThis.fetch = async () => ({ ok: true, json: async () => [...valid, { ...valid[0], id: 2 }] });
    assert.equal((await f.journal.reconcile(batch, f.poll)).status, 'applied');
    f.journal.clearApplied(f.scope); assert.equal(f.journal.get(f.scope), null);
  } finally { globalThis.fetch = originalFetch; }
});

test('TX-002: verified failed/backtracked/skipped evidence alone releases retry, never unknown', async () => {
  const originalFetch = globalThis.fetch;
  try {
    for (const status of ['failed', 'backtracked', 'skipped']) {
      const f = fixture(), record = f.submit();
      globalThis.fetch = async () => ({ ok: true, json: async () => f.evidence(status) });
      await assert.rejects(f.journal.reconcile(record, f.poll), error => error.code === 'PUBLIC_TRADE_FAILED' && error.message.includes(status));
      assert.equal(f.journal.get(f.scope), null); assert.ok(f.reserve());
    }
  } finally { globalThis.fetch = originalFetch; }
});

test('TX-002: overlapping polls coalesce across pages; late queued callbacks cannot republish or erase receipts', async () => {
  const f = fixture(), record = f.submit();
  let resolve, calls = 0;
  const delayed = () => { calls++; return new Promise(yes => { resolve = yes; }); };
  const first = f.journal.reconcile(record, delayed), second = f.journal.reconcile(record, delayed);
  assert.equal(first, second);
  await new Promise(setImmediate); assert.equal(calls, 1);
  const otherTab = f.store();
  let otherCalls = 0;
  const other = otherTab.reconcile(record, async () => { otherCalls++; throw new Error('obsolete failure'); });
  resolve(); await first;
  await other; assert.equal(otherCalls, 0, 'A queued attempt observes applied evidence without polling again');
  assert.equal(f.journal.get(f.scope).status, 'applied');
  f.journal.clearApplied(f.scope);
  const next = f.submit();
  await assert.rejects(otherTab.reconcile(record, async () => {}), /receipt changed/);
  assert.equal(f.journal.get(f.scope).id, next.id);
});

test('TX-002: same-origin submissions use an exclusive lock; unavailable locking fails before wallet access', async () => {
  const f = fixture(), other = f.store();
  let resolve, sends = 0;
  const first = f.journal.withSubmissionLock(async () => {
    const record = f.reserve(); sends++;
    await new Promise(yes => { resolve = yes; });
    return f.journal.submitted(record, 'returned-hash');
  });
  await new Promise(setImmediate);
  await assert.rejects(other.withSubmissionLock(() => { sends++; f.reserve(other); }), /in progress/);
  resolve(); await first;
  await assert.rejects(other.withSubmissionLock(() => { f.reserve(other); sends++; }), /reconciled/);
  assert.equal(sends, 1);
  const unsupported = createSubmittedTradeStore({ locks: () => null });
  await assert.rejects(unsupported.withSubmissionLock(() => { sends++; }), /unavailable/);
  assert.equal(sends, 1);
});

test('TX-002: post-hash storage failure keeps the hash in memory and the reload reservation blocked', async () => {
  const f = fixture(), reservation = f.reserve(), save = f.storage.setItem;
  f.storage.setItem = () => { throw new Error('inert quota failure'); };
  assert.throws(() => f.journal.submitted(reservation, 'returned-hash'), /persist/);
  assert.equal(f.journal.get(f.scope).hash, 'returned-hash');
  assert.equal(f.store().get(f.scope).status, 'submitting');
  assert.throws(() => f.reserve(f.store()), /reconciled/);
  f.storage.setItem = save;
  await f.journal.reconcile(f.journal.get(f.scope), async () => {});
  assert.equal(f.store().get(f.scope).status, 'applied');
  const unreadable = fixture(), reserved = unreadable.reserve(), read = unreadable.storage.getItem;
  unreadable.storage.getItem = () => { throw new Error('inert storage access failure'); };
  assert.throws(() => unreadable.journal.submitted(reserved, 'retained-hash'), /storage access/);
  assert.equal(unreadable.journal.get(unreadable.scope).hash, 'retained-hash');
  assert.throws(() => unreadable.journal.get({ ...unreadable.scope, account: 'other' }), /storage access/);
  unreadable.storage.getItem = read;
  assert.equal(unreadable.store().get(unreadable.scope).status, 'submitting');
});
