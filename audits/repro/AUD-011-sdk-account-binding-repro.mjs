import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { load, pairWriteDependencies, deferred, recoveryEnvironment } from '../../admin-ui/tests/runtime/treasury.fixture.mjs';
import { createDropsWallet, WALLET_A, WALLET_B } from '../../admin-ui/tests/runtime/drops-wallet.fixture.mjs';

// No DAppClient is constructed. Execute the installed SDK's actual account
// getter/setter, request, permission and serialization/dispatch methods. Only
// transport/storage/lifecycle boundaries are inert. Never sign or contact a peer.
const require = createRequire(import.meta.url);
const { DAppClient, Serializer, BeaconEvent } = require('@airgap/beacon-sdk');
const { ExposedPromise } = require('@airgap/beacon-utils');
assert.equal(JSON.parse(readFileSync(new URL('../../node_modules/@airgap/beacon-sdk/package.json', import.meta.url))).version, '4.8.1');
const cfg = { network: 'testnet', tzktBase: 'https://inert.invalid',
  escrow: 'KT1HMCqYqyP9fTDjzm8KAfyPhFn3tpmSW4kc' };
const account = value => ({ ...value, senderId: value.accountIdentifier, scopes: ['operation_request'],
  origin: { type: 'extension', id: value.address } });
const pair = { token_pair_id: '1',
  burn_contract_address: 'KT1GnVnQvvb7R6h4EhveBmN17ysaTuGRDoWW', burn_token_id: '0', burn_amount: '1',
  redeem_contract_address: 'KT1GCvVdxELA4mPUn4DiBpPAd8ARRtyoEpke', redeem_token_id: '29', redeem_amount: '1' };
const actions = {
  set: (ops, authority) => ops.setTokenPairs([pair], cfg.escrow, { authority }),
  update: (ops, authority) => ops.updateTokenPair({ ...pair,
    burn_contract: pair.burn_contract_address, redeem_contract: pair.redeem_contract_address }, cfg.escrow, { authority }),
  cleanup: (ops, authority) => ops.cleanupTokenPairs(['1'], cfg.escrow, { authority }),
  pause: (ops, authority) => ops.togglePause(cfg.escrow, { authority }),
  withdraw: (ops, authority) => ops.adminWithdrawXtz({ amountMutez: '1000001' }, cfg.escrow, { authority }),
  transfer: (ops, authority) => ops.adminBatchTransferTokens({ to: 'tz1burnburnburnburnburnburnburjAYjjX',
    items: [{ contract: pair.redeem_contract_address, tokenId: '29', amount: '1' }] }, cfg.escrow, { authority }),
};

for (const [name, action] of Object.entries(actions)) {
  for (const scenario of ['unchanged', 'event-before-read', 'sdk-state-before-event']) {
    const f = createDropsWallet({ getLiveCfg: () => cfg });
    Object.assign(f.window, recoveryEnvironment());
    await f.wallet.emitAccount(account(WALLET_A));
    const gate = deferred(), changed = deferred();
    const emitted = [];
    let response, switching;
    const transport = { connectionStatus: 'CONNECTED', connect: async () => {},
      getPeers: async () => [WALLET_A, WALLET_B].map(value => ({ id: `peer-${value.address}`, senderId: value.accountIdentifier })),
      send: async (payload, peer) => {
        emitted.push({ ...await new Serializer().deserialize(payload), peer });
        response.resolve({ message: { transactionHash: 'inert-hash' }, connectionInfo: {} });
      } };
    const sdk = {
      _activeAccount: ExposedPromise.resolve(account(WALLET_A)), isGetActiveAccountHandled: true,
      getActiveAccount() { return DAppClient.prototype.getActiveAccount.call(this); },
      isInvalidState(...args) { return DAppClient.prototype.isInvalidState.call(this, ...args); },
      setActiveAccount(...args) { return DAppClient.prototype.setActiveAccount.call(this, ...args); },
      initInternalTransports(...args) { return DAppClient.prototype.initInternalTransports.call(this, ...args); },
      // The genuine internal-transports method reads the seed BEFORE its early
      // return for an already initialized transport. Hold only that storage read.
      setTransport: async () => {}, setActivePeer: async () => {}, storage: {
        get: async () => { changed.resolve(); await gate.promise; return 'cd'.repeat(32); }, set: async () => {} },
      _transport: { isResolved: () => true }, postMessageTransport: transport,
      analytics: { track() {} }, sendMetrics() {}, buildPayload: async () => ({}),
      multiTabChannel: { init: async () => {}, isLeader: () => true },
      checkMakeRequest(...args) { return DAppClient.prototype.checkMakeRequest.call(this, ...args); },
      _initPromise: Promise.resolve(),
      init(...args) { return DAppClient.prototype.init.call(this, ...args); },
      addRequestAndCheckIfRateLimited: async () => false,
      checkPermissions(...args) { return DAppClient.prototype.checkPermissions.call(this, ...args); },
      beaconId: 'ab'.repeat(32), addOpenRequest: (id, exposed) => { response = exposed; },
      getPeer(...args) { return DAppClient.prototype.getPeer.call(this, ...args); },
      events: { emit: async (type, active) => {
        if (type === BeaconEvent.ACTIVE_ACCOUNT_SET) await f.wallet.emitAccount(active);
      } },
      tryToAppSwitch() {}, transport, notifySuccess: async () => {}, getWalletInfo: async () => ({}), blockExplorer: {},
      makeRequest(...args) { return DAppClient.prototype.makeRequest.call(this, ...args); },
    };
    const authority = f.wallet.captureAdminSendAuthority();
    let appReads = 0;
    f.window.dAppClient.getActiveAccount = () => {
      // The genuine getter captures A's already-resolved promise. Start the
      // concurrent real setter immediately afterward; do not substitute B as
      // the old read's result or delay/replace production getter semantics.
      const captured = sdk.getActiveAccount();
      if (++appReads === 1 && scenario === 'sdk-state-before-event') switching = sdk.setActiveAccount(account(WALLET_B));
      return captured;
    };
    f.window.dAppClient.requestOperation = input => DAppClient.prototype.requestOperation.call(sdk, input);
    const globals = { window: f.window, crypto: globalThis.crypto };
    const pauseRecovery = load('features/pause-recovery', globals);
    const treasuryRecovery = load('features/treasury/recovery', globals);
    const ops = load('escrow-ops', { ...pairWriteDependencies(), ...globals, getLiveCfg: () => cfg,
      verifyAdminActiveAccount: f.beacon.verifyAdminActiveAccount,
      captureAdminSendAuthority: f.wallet.captureAdminSendAuthority,
      requestPauseOperation: pauseRecovery.requestPauseOperation,
      requestTreasuryOperation: treasuryRecovery.requestTreasuryOperation });
    if (scenario === 'event-before-read') {
      gate.resolve();
      await sdk.setActiveAccount(account(WALLET_B));
      assert.equal(authority.isCurrent(), false);
      await assert.rejects(action(ops, authority), /authority is no longer current/);
      assert.equal(emitted.length, 0);
    } else {
      await action(ops, authority);
      assert.equal(emitted.length, 1);
      const expected = scenario === 'unchanged' ? WALLET_A : WALLET_B;
      assert.equal(emitted[0].sourceAddress, expected.address);
      assert.equal(emitted[0].peer.id, `peer-${expected.address}`);
      assert.equal(authority.isCurrent(), true, 'application has not received the SDK change event');
      if (['pause', 'withdraw', 'transfer'].includes(name)) {
        const rows = [...f.window.data.values()].map(JSON.parse);
        assert.equal(rows.length, 1);
        assert.equal(typeof rows[0].account === 'string' ? rows[0].account : rows[0].account.address, WALLET_A.address,
          'the real durable reservation still attributes this request to A');
      }
      if (scenario === 'sdk-state-before-event') {
        await changed.promise;
        assert.equal((await sdk.getActiveAccount()).address, WALLET_B.address);
      }
      gate.resolve();
      await switching;
      assert.equal(authority.isCurrent(), scenario === 'unchanged');
    }
    authority.release();
    console.log(`PASS ${name}: ${scenario}${scenario === 'sdk-state-before-event' ? ' emitted B for captured A intent (defect)' : ' (control)'}`);
  }
}
console.log('AUD-011: six Admin write paths reproduce account rebinding; twelve unchanged/event-first controls pass. Inert SDK transport only.');
