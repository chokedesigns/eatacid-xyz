// Inert complete-page/invalid-next-page evidence through real economics and CMS comparison.
import assert from 'node:assert/strict';
import { load } from '../../admin-ui/tests/runtime/treasury.fixture.mjs';

for (const nextPage of ['malformed', 'valid', 'http-error']) {
  let reads = 0;
  const warnings = [];
  const first = Array.from({ length: 10000 }, (_, id) => ({ id,
    token: { tokenId: '0' }, account: { address: `inert-holder-${id}` }, balance: '1',
  }));
  const econ = load('utils/token-econ', {
    getLiveCfg: () => ({ network: 'testnet', tzktBase: 'https://inert.invalid' }),
    console: { warn: (...args) => warnings.push(args) },
    fetch: async () => ({ ok: ++reads === 1 || nextPage !== 'http-error', status: 503,
      json: async () => reads === 1 ? first : nextPage === 'malformed' ? { error: 'invalid provider body' }
        : [{ id: 10000, token: { tokenId: '0' }, account: { address: 'inert-final-holder' }, balance: '1' }],
    }),
  });
  const cms = load('features/health/health.cms', {
    getExpectedEconForToken: econ.getExpectedEconForToken, acidFromEditions: econ.acidFromEditions,
    logWarn: (...args) => warnings.push(args),
  });
  const issues = await cms.compareCsvEconToChain({ net: 'testnet', label: 'CANAAN', kt1: 'inert-contract',
    cmsMap: new Map([['0', { editions: 10000, acidValue: 1 }]]),
  });
  assert.equal(reads, 2);
  if (nextPage === 'malformed') {
    assert.equal(issues.length, 0, 'Failure: partial total is accepted as verified CMS economics');
    assert.equal((await econ.getExpectedEconForToken({ kt1: 'inert-contract', tokenId: '0' })).editions, 10000);
    assert.equal(reads, 2, 'Partial result was cached as successful');
  } else if (nextPage === 'valid') {
    assert.equal(issues.length, 1);
    assert.match(issues[0], /circulating chain: 10001/);
  } else {
    assert.equal(issues.length, 1);
    assert.match(issues[0], /Failed to read circulating chain editions/);
  }
}
console.log('Health evidence: malformed second page caches a partial total and passes CMS economics; valid continuation and HTTP-error controls detect mismatch/unavailability.');
