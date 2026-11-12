import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createProductionDropParamsProvider, DROP_PARAMS_PROVIDER_STATUSES } from '../../admin-ui/src/features/drops/drop-params.provider.js';
import { createServiceBackedDropParamsProvider } from '../../admin-ui/src/features/drops/authoring/drop-params.provider.dev.js';

const params = createProductionDropParamsProvider().getSnapshot().params;
const sourceVersion = 'a'.repeat(64);
const healthy = {
  service: { status: 'READY' },
  representations: { equal: true },
  writer: { blocked: false, busy: false },
  sourceVersion,
  params,
};
const blocked = {
  ...healthy,
  writer: { blocked: true, busy: false },
};
let response = healthy;
const provider = createServiceBackedDropParamsProvider({ load: async () => response });
const publishes = [];
let initCount = 0;
const runtime = {
  params: null,
  updateParams(next) {
    this.params = next;
    publishes.push(next);
  },
};

// Execute the actual local-authoring subscription; CSS/UI/service imports are
// replaced by inert dependencies. The provider is the production module above.
const source = readFileSync(new URL('../../admin-ui/src/features/drops/authoring/index.js', import.meta.url), 'utf8')
  .replace(/^import .*;\r?\n/gm, '')
  .replace(/^export default .*;\r?\n/gm, '')
  .replace(/export /g, '');
const realm = vm.createContext({
  createAuthoringController: () => ({ init() {} }),
  createDropParamsAuthoringClient: () => ({}),
  createAuthoringView: () => ({}),
  createDevelopmentDropParamsProvider: () => provider,
  localTokenRows: () => [],
  resolveThumbUrl: () => '',
  getLiveCfg: () => ({ collections: {} }),
});
vm.runInContext(`${source}\nglobalThis.start = initDropParamsAuthoring;`, realm);
realm.start({ initDrops: snapshot => {
  initCount++;
  runtime.params = snapshot;
  return runtime;
} });

await provider.refresh();
assert.equal(initCount, 1, 'valid snapshot initializes Drops');
assert.equal(provider.getSnapshot().status, 'READY');
const first = runtime.params;
response = blocked;
await assert.rejects(provider.refresh(), { code: 'reconciliation_required' });
assert.equal(provider.getSnapshot().status, DROP_PARAMS_PROVIDER_STATUSES.RECONCILIATION_REQUIRED);
assert.equal(runtime.params, first, 'Drops retains old snapshot after provider health loss');
assert.equal(publishes.length, 0, 'subscriber never invalidates the Drops runtime');

// Valid recovery control: a new committed source reaches Drops.
response = { ...healthy, sourceVersion: 'b'.repeat(64) };
await provider.refresh();
assert.equal(provider.getSnapshot().status, 'READY');
assert.equal(publishes.length, 1);
assert.notEqual(runtime.params, first);
console.log('local snapshot: reconciliation retains old Drops params; valid recovery publishes replacement');
