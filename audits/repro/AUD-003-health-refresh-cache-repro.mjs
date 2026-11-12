// Manual Health/CMS rechecks call the cached economics reader without force.
import assert from 'node:assert/strict';
import { load } from '../../admin-ui/tests/runtime/treasury.fixture.mjs';

const csv = { net: 'testnet', label: 'CANAAN', kt1: 'KT1inert',
  cmsMap: new Map([['0', { editions: 5, acidValue: 20 }]]),
};
function fixture(initial) {
  let balance = initial;
  let reads = 0;
  const econ = load('utils/token-econ', {
    getLiveCfg: () => ({ network: 'testnet', tzktBase: 'https://inert.invalid' }),
    fetch: async () => { reads++; return { ok: true, json: async () => [
      { token: { tokenId: '0' }, account: { address: 'tz1inert-holder' }, balance: String(balance) },
    ] }; },
  });
  const cms = load('features/health/health.cms', {
    getExpectedEconForToken: econ.getExpectedEconForToken,
    acidFromEditions: econ.acidFromEditions,
  });
  return { cms, setBalance: value => { balance = value; }, reads: () => reads };
}

const active = fixture(5);
assert.equal((await active.cms.compareCsvEconToChain(csv)).length, 0, 'valid initial five-edition control');
active.setBalance(4);
assert.equal((await active.cms.compareCsvEconToChain(csv)).length, 0,
  'a later Health/CMS recheck incorrectly keeps a green result from the five-minute cache');
assert.equal(active.reads(), 1, 'recheck makes no new chain read');

const fresh = fixture(4);
const issues = await fresh.cms.compareCsvEconToChain(csv);
assert.equal(fresh.reads(), 1);
assert.match(issues.join(' '), /Editions mismatch.*circulating chain: 4/,
  'uncached current-chain control identifies the mismatch');
console.log('Health: manual recheck can repeat cached healthy economics after chain balance changes; fresh read detects mismatch.');
