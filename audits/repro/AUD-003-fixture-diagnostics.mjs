// Audit evidence only: execute existing fixtures without registering their tests.
// Compare omitted dependencies with the corresponding current production code.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function definitions(path, names, transform = source => source) {
  const url = new URL(path, import.meta.url);
  let source = await readFile(url, 'utf8');
  source = source.replace("import test from 'node:test';", 'const test = () => {};')
    .replaceAll('import.meta.url', JSON.stringify(url.href))
    .replace(/from '(\.[^']+)'/g, (_, relative) => `from '${new URL(relative, url).href}'`);
  source = transform(source);
  return import(`data:text/javascript;base64,${Buffer.from(source + `\nexport { ${names} };`).toString('base64')}`);
}

const burn = await definitions('../../drops/js/burn-quantity.test.mjs', 'fixture');
assert.throws(() => burn.fixture(), /createSubmittedTradeStore is not defined/);

const exchangeSource = await readFile(new URL('../../exchange/js/exchange.js', import.meta.url), 'utf8');
const start = exchangeSource.indexOf('function assertExchangeQuantityLimits(');
const end = exchangeSource.indexOf('\n}', start) + 2;
assert.ok(start >= 0 && end > start);
const constants = exchangeSource.match(/^const (?:MAX_EXCHANGE_TOKEN_QUANTITY|MAX_EXCHANGE_SUBMISSION_UNITS|EXCHANGE_QUANTITY_LIMIT_MESSAGE) = .*;$/gm);
assert.equal(constants.length, 3);
const currentQuantityGuard = constants.join('\n') + '\n' + exchangeSource.slice(start, end);
const options = { rows: [{ key: '15', active: true, value: {
  burn_contract_address: 'KT1Burn', burn_token_id: '0', burn_amount: '1',
  redeem_contract_address: 'KT1ExchangeRedeem', redeem_token_id: '0', redeem_amount: '10',
} }] };
const original = await definitions('../../shared/public-trade-pairs.test.mjs', 'consumer');
const broken = original.consumer('exchange', options);
await broken.run();
assert.equal(broken.sent.length, 0);
assert.match(broken.errors.flat().map(String).join('\n'), /assertExchangeQuantityLimits is not defined/);

const composed = await definitions('../../shared/public-trade-pairs.test.mjs', 'consumer', source =>
  source.replace('vm.runInContext(code, context);',
    `vm.runInContext(${JSON.stringify(currentQuantityGuard)} + '\\n' + code, context);`));
const valid = composed.consumer('exchange', options);
await valid.run();
assert.equal(valid.sent.length, 1, 'The same fixture with the actual current guard sends the valid control');
assert.equal(valid.errors.length, 0);
const invalid = composed.consumer('exchange', { ...options, cart: [
  { contractAddress: 'KT1Burn', tokenId: '0', quantity: 21, startingBalance: 30, redeemAmount: 10 },
] });
await invalid.run();
assert.equal(invalid.sent.length, 0);
assert.doesNotMatch(invalid.errors.flat().map(String).join('\n'), /is not defined/);

const dropsSource = await readFile(new URL('../../drops/js/events.js', import.meta.url), 'utf8');
assert.match(dropsSource, /function restoreSubmittedTrade\(account\)/);
assert.match(dropsSource, /import \{[\s\S]*?createSubmittedTradeStore,[\s\S]*?from ['"]\.\.\/\.\.\/shared\/public-trade-ops\.js['"]/);
const revealSource = await readFile(new URL('../../drops/js/reveal-coordinator.test.mjs', import.meta.url), 'utf8');
assert.doesNotMatch(revealSource, /['"]restoreSubmittedTrade['"]|restoreSubmittedTrade\s*[:(]/);
console.log('Fixture evidence: burn fixture omits the imported journal; reveal fixture omits a defined page helper; Exchange fixture omits the current quantity guard. Real-guard valid/over-limit controls pass.');
