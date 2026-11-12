// Real Admin controllers, wallet authority, serializers and confirmation matcher.
// Only DOM, SDK, HTTP and poll scheduling are inert. No real operation is sent.
import assert from 'node:assert/strict';
import { fixture, load, settle, RECIPIENT } from '../../admin-ui/tests/runtime/treasury.fixture.mjs';

function composed(surface) {
  return fixture(surface, { indexer: true, escrowOps(common, f) {
    f.requests = [];
    Object.assign(common.window.dAppClient, {
      getActiveAccount: async () => ({ address: RECIPIENT, network: { type: 'shadownet' } }),
      requestPermissions: async () => { throw new Error('Unexpected permissions request'); },
      requestOperation: async payload => {
        f.requests.push(structuredClone(payload));
        return { transactionHash: `inert-operation-${f.requests.length}` };
      },
    });
    return load('escrow-ops', { ...common, verifyAdminActiveAccount: f.beacon.verifyAdminActiveAccount });
  } });
}

for (const surface of ['drops', 'exchange']) {
  for (const action of ['transfer', 'withdraw']) {
    const f = composed(surface);
    const first = f.submit(action);
    await settle();
    assert.equal(f.requests.length, 1);
    assert.equal(await f.pollRead(), false, 'No indexed operation is not proof of failure');
    // The existing poll scheduler is inert; resolve its timeout, retaining the
    // real waitForOperationResult classification and all downstream consumers.
    f.confirmation.resolve(false);
    await first;
    assert.match(f.statuses.at(-1)[1], /Not confirmed yet/);
    const retry = f.submit(action);
    await settle();
    assert.equal(f.requests.length, 2);
    assert.deepEqual(f.requests[1], f.requests[0], 'Unresolved intent is submitted again unchanged');
    f.confirmation.resolve(false);
    await retry;

    const control = composed(surface);
    const pending = control.submit(action);
    await settle();
    await control.submit(action);
    assert.equal(control.requests.length, 1, 'In-flight control blocks repeated submission');
    control.operations = [{ type: 'transaction', hash: 'inert-operation-1', counter: 10, nonce: null,
      target: { address: control.requests[0].operationDetails[0].destination },
      parameter: { entrypoint: action === 'transfer' ? 'admin_transfer_token' : 'admin_withdraw_xtz' }, status: 'applied' }];
    assert.equal(await control.pollRead(), true);
    control.confirmation.resolve(true);
    await pending;
    assert.ok(control.statuses.some(([, text]) => text === control.config.labels[`${action}Success`]));
  }
}
console.log('AUD-003 Treasury evidence: four surface/action cases resend identical unresolved intent; in-flight/applied controls pass.');
