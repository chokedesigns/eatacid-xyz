// A required CMS economics value must be present to earn a healthy comparison.
import assert from 'node:assert/strict';
import { load } from '../../admin-ui/tests/runtime/treasury.fixture.mjs';

const csv = load('utils/parse-csv', {});
const econ = load('utils/token-econ', {
  getLiveCfg: () => ({ network: 'testnet', tzktBase: 'https://inert.invalid' }),
  fetch: async () => ({ ok: true, json: async () => [
    { token: { tokenId: '0' }, account: { address: 'tz1inert-holder' }, balance: '5' },
  ] }),
});
const cms = load('features/health/health.cms', {
  ...csv,
  getExpectedEconForToken: econ.getExpectedEconForToken,
  acidFromEditions: econ.acidFromEditions,
});

for (const [value, expectedIssues] of [['20', 0], ['21', 2], ['', 0]]) {
  const source = `Name,Editions,Collection,Token ID,$ACID Value\nOne,5,CANAAN,0,${value}\n`;
  const rows = csv.parseWebflowCmsCsv(source);
  assert.doesNotThrow(() => cms.validateCmsCsv(source, rows));
  const map = csv.normalizeCmsRows(rows);
  const issues = await cms.compareCsvEconToChain({
    net: 'testnet', label: 'CANAAN', kt1: 'KT1inert', cmsMap: map,
  });
  assert.equal(issues.length, expectedIssues, `$ACID CSV value ${JSON.stringify(value)}`);
}
console.log('Health: correct and mismatched $ACID controls work; blank CANAAN $ACID passes validation and economics check.');
