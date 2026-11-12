// A balance row must identify its holder before Health can classify circulation.
import assert from 'node:assert/strict';
import { load } from '../../admin-ui/tests/runtime/treasury.fixture.mjs';

for (const [caseName, account, expectedEditions, expectedIssues] of [
  ['valid burn sink', { address: 'tz1burnburnburnburnburnburnburjAYjjX' }, 0, 1],
  ['valid circulating holder', { address: 'tz1inert-holder' }, 5, 0],
  ['missing account', undefined, 5, 0],
]) {
  const row = { token: { tokenId: '0' }, balance: '5' };
  if (account) row.account = account;
  const econ = load('utils/token-econ', {
    getLiveCfg: () => ({ network: 'testnet', tzktBase: 'https://inert.invalid' }),
    fetch: async () => ({ ok: true, json: async () => [row] }),
  });
  const cms = load('features/health/health.cms', {
    getExpectedEconForToken: econ.getExpectedEconForToken,
    acidFromEditions: econ.acidFromEditions,
  });
  const observed = await econ.getEditionsForToken('KT1inert', '0');
  assert.equal(observed, expectedEditions, caseName);
  const issues = await cms.compareCsvEconToChain({
    net: 'testnet', label: 'CANAAN', kt1: 'KT1inert',
    cmsMap: new Map([['0', { editions: 5, acidValue: 20 }]]),
  });
  assert.equal(issues.length, expectedIssues, `${caseName}: CMS outcome`);
}
console.log('Health: valid sink is excluded; valid holder is counted; missing holder is incorrectly counted and can pass CSV economics.');
