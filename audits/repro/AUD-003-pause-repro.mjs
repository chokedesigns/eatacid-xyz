import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { load } from '../../admin-ui/tests/runtime/treasury.fixture.mjs';

// Execute the existing inert fixture's real pause controller, Beacon authority,
// and optional escrow helper. Only the scheduler, wallet, DOM and HTTP are fake.
const testUrl = new URL('../../admin-ui/tests/runtime/pause-pending.test.mjs', import.meta.url);
const sourceText = readFileSync(fileURLToPath(testUrl), 'utf8');
const start = sourceText.indexOf('const source = path =>');
const end = sourceText.indexOf('\nasync function duplicate(', start);
assert.ok(start >= 0 && end > start);
const prelude = sourceText.slice(start, end).replace(
  "const source = path => readFileSync(new URL(path, import.meta.url), 'utf8');",
  "const source = path => readFileSync(new URL(path, auditBase), 'utf8');",
);
const realm = { assert, readFileSync, auditBase: testUrl, URL, vm, load,
  EventTarget, Event, setImmediate, structuredClone, console };
vm.runInNewContext(`${prelude}\nglobalThis.auditFixture = fixture; globalThis.auditSettle = settle;`, realm);

for (const surface of ['drops', 'exchange']) {
  const f = realm.auditFixture(surface, undefined, true);
  await realm.auditSettle();
  assert.equal(f.button.disabled, false, `${surface}: valid admin starts enabled`);
  let releaseSend;
  const sending = new Promise(resolve => { releaseSend = resolve; });
  f.setSend(() => sending);
  const first = f.controller.onToggle();
  await realm.auditSettle();
  assert.equal(f.requests.length, 1, `${surface}: first request submitted`);
  await f.controller.onToggle();
  assert.equal(f.requests.length, 1, `${surface}: in-flight duplicate blocked`);
  releaseSend();
  await first; // poll returns unknown: no definitive applied/failed receipt.
  assert.equal(f.events.at(-1).detail.error, 'toggle_not_confirmed');
  assert.equal(f.button.disabled, false, `${surface}: unknown outcome re-enables button`);
  await f.controller.onToggle();
  assert.equal(f.requests.length, 2, `${surface}: second identical toggle submitted`);

  const applied = realm.auditFixture(surface, undefined, true);
  await realm.auditSettle();
  applied.setPoll(async check => {
    applied.setStorage({ paused: false, admin: 'admin' });
    return check();
  });
  await applied.controller.onToggle();
  assert.equal(applied.requests.length, 1);
  assert.equal(applied.events.at(-1).detail.paused, false,
    `${surface}: applied control confirms known transition`);
  console.log(`${surface}: unknown first receipt permits a second toggle; pending gate and applied control pass`);
}
