import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import params from '../shared/drop-params/drop-params.js';
import { computeDropInstant } from '../shared/drop-time.js';

// Exercise the operator's actual current-source rows. No generated projection or
// historical audit snapshot is used as authority for today's source facts.
const text = readFileSync(process.env.EA_T016_RUNBOOK_SOURCE
  || new URL('../docs/testnet-to-mainnet.md', import.meta.url), 'utf8');
const section = number => text.split(new RegExp(`^## ${number}\\.`, 'm'))[1]?.split(/^## /m)[0];
function row(number, key) {
  const cells = section(number)?.split('\n').filter(line => line.startsWith('| '))
    .map(line => line.split('|').slice(1, -1).map(cell => cell.trim().replaceAll('`', '')))
    .find(cells => cells[0] === key);
  assert.ok(cells, `Runbook section ${number} must contain ${key}`);
  return cells;
}
const current = key => row(8, key)[1];

test('FIND-P2-013: release inventory distinguishes current scheduled testnet from approved future Mainnet', () => {
  const inventory = row(3, 'Drop parameters');
  assert.ok(inventory[2].includes(`dropScheduled: ${params.dropScheduled}`));
  assert.ok(inventory[2].includes(`mirrorNetwork: '${params.mirrorNetwork}'`));
  assert.match(inventory[3], /requires A5 implementation and verification/);
  assert.doesNotMatch(inventory[3], /VERIFIED IN SOURCE/);
  const decision = row(4, 'Drop parameters');
  assert.match(decision[2], /Scheduled testnet/);
  assert.equal(decision[3], 'Initial Mainnet state unscheduled');
  assert.match(decision[4], /Mainnet target not applied/);
  assert.equal(row(8, 'dropScheduled')[2], 'false (target: initial Mainnet cutover has no scheduled drop)');
  assert.equal(row(8, 'dropScheduled')[3], 'Approved target decision; apply at A5');
  assert.match(text, /future target, conditional on the approved source edit, projection\/mirror reconciliation, and UI verification at A5/);
});

test('FIND-P2-013: operator parameter table agrees with authoritative identity and economics', () => {
  assert.equal(current('dropScheduled'), String(params.dropScheduled));
  assert.equal(current('dropName'), params.dropName);
  assert.equal(current('mirrorNetwork'), params.mirrorNetwork);
  // The accepted runbook describes this exact single-collection configuration.
  // Any future approved source change must reconcile the operational document.
  assert.equal(params.burnTokens.length, 1);
  const burn = params.burnTokens[0];
  assert.equal(current('burn collections'), `${burn.collection} only; INTRODUCTIONS absent`);
  assert.equal(current('enabled flags'), `${burn.collection} ${burn.enabled}; no INTRODUCTIONS entry`);
  assert.equal(current('exclusions'), `${burn.collection} ${burn.exclude.join(', ')}; no INTRODUCTIONS entry`);
  assert.equal(current('burn amounts'), `${burn.collection} ${burn.burnAmount}`);
  assert.equal(current('redeem collection/token'), `${params.redeemToken.collection} ${params.redeemToken.tokenId}`);
  assert.equal(current('redeem amount'), String(params.redeemToken.redeemAmount));
  assert.equal(current('declared total supply'), String(params.redeemToken.totalSupply));
});

test('FIND-P2-013: authored wall time and documented seasonal instant agree', () => {
  const { dropDate: date, dropTime: time } = params;
  assert.equal(current('schedule'), `${date.month} ${date.day}, ${date.year}, ${time.time} ${time.period}; authored timezone ${time.timezone}`);
  const resolved = computeDropInstant(date, time);
  assert.equal(resolved.ok, true);
  const utc = resolved.date.toISOString();
  const asOf = section(8).match(/past as of (\w+ \d+, \d{4}); `dropScheduled` remains `([^`]+)`/);
  assert.ok(asOf, 'As-of statement must explicitly describe the checked-in scheduled state');
  assert.equal(asOf[2], String(params.dropScheduled));
  assert.ok(resolved.date < new Date(`${asOf[1]} 00:00:00 GMT-0500`));
  assert.ok(section(8).includes(`seasonal \`America/New_York\` zone: this schedule resolves to ${date.month} ${date.day}, ${date.year}, ${utc.slice(11, 16)} UTC`));
});
