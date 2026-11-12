// Inert evidence: execute the complete current Public wallet module; no SDK/network I/O.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createContext, SourceTextModule, SyntheticModule } from 'node:vm';

const source = await readFile(new URL('../../shared/beacon-setup.js', import.meta.url), 'utf8');
const account = (address, type = 'shadownet') => ({ address, network: { type } });
const settle = () => new Promise(resolve => setImmediate(resolve));
function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}
async function fixture() {
  const events = [];
  const f = { clears: 0, read: async () => null };
  class Client {
    getActiveAccount() { return f.read(); }
    subscribeToEvent(_event, listener) { f.listener = listener; }
    async clearActiveAccount() { f.clears++; }
  }
  const context = createContext({
    window: { localStorage: { getItem: () => null } },
    document: { readyState: 'complete', querySelector: () => null, dispatchEvent: event => events.push(event) },
    console: { error() {} },
    CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init.detail; } },
    Event: class { constructor(type) { this.type = type; } },
    fetch: () => { throw new Error('Network forbidden'); },
  });
  const dependencies = {
    '@airgap/beacon-sdk': { DAppClient: Client, NetworkType: { MAINNET: 'mainnet', SHADOWNET: 'shadownet' }, BeaconEvent: { ACTIVE_ACCOUNT_SET: 'account' } },
    './network.js': { default: { network: 'testnet', tzkt: { testnet: 'https://inert.invalid' }, getCurrentPublicNetworkConfig: () => ({ beaconNetwork: 'shadownet' }) } },
    './tzkt-fa2-balances.js': { fetchFa2BalancePages: async () => [] },
    './public-logger.js': { createPublicLogger: () => ({ log() {} }) },
  };
  const module = new SourceTextModule(source, { context });
  await module.link(specifier => {
    const dependency = dependencies[specifier];
    assert.ok(dependency, `Unexpected dependency ${specifier}`);
    return new SyntheticModule(Object.keys(dependency), function () {
      for (const [name, value] of Object.entries(dependency)) this.setExport(name, value);
    }, { context });
  });
  await module.evaluate();
  await settle(); // Complete the independent null-account boot first.
  return { ...f, f, wallet: module.namespace, events };
}

for (const staleNetwork of ['shadownet', 'mainnet']) {
  const { f, wallet } = await fixture();
  const oldRead = deferred();
  f.read = () => oldRead.promise;
  const pending = wallet.getVerifiedPublicActiveAccount();
  await f.listener(account('wallet-B'));
  assert.equal(wallet.getPublicWalletState().account.address, 'wallet-B');
  oldRead.resolve(account('wallet-A', staleNetwork));
  assert.equal(await pending, null, 'Obsolete runtime reads cannot return A as current');
  assert.equal(f.clears, 0, 'Obsolete runtime reads cannot start cleanup');
  assert.equal(wallet.getPublicWalletState().status, 'connected');
  assert.equal(wallet.getPublicWalletState().account.address, 'wallet-B');
}
{
  const { f, wallet } = await fixture();
  f.read = async () => account('wallet-A');
  assert.equal((await wallet.getVerifiedPublicActiveAccount()).address, 'wallet-A');
  assert.equal(f.clears, 0, 'Current valid read control succeeds without cleanup');
}
console.log('AUD-003 wallet regression: stale runtime reads retire without clearing B; current valid verification succeeds.');
