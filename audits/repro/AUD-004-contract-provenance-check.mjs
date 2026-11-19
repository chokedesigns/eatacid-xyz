import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

// Repository-byte identity and mechanical fixture correspondence only.
// This does not compile, typecheck, execute or query any deployed contract.
const root = new URL('../../', import.meta.url);
const bytes = path => readFileSync(new URL(path, root));
const hash = value => createHash('sha256').update(value).digest('hex').toUpperCase();
const canonical = bytes('contracts/burn-redeem-escrow/smartpy/burn-redeem-escrow-smartpy.py');
const snapshot = bytes('docs/EA-XYZ Contract Audit/source/legacy/burn-redeem-escrow-with-legacy-tests.py');
const fixture = bytes('docs/EA-XYZ Contract Audit/source/burn-redeem-escrow-audit.py');
const frozen = bytes('docs/EA-XYZ Contract Audit/artifacts/burn-redeem-escrow-audited.tz');
const promoted = bytes('contracts/burn-redeem-escrow/artifacts/burn-redeem-escrow-audited.tz');
assert.equal(hash(canonical), '0BC3B735377B92F1E5635ED7789B7693018DECA2256FA79DEEBD952279FC8BD9');
assert.deepEqual(canonical, snapshot);
assert.equal(hash(fixture), '68E5F2931FE40BD4B3779098E8607C4E67877C83C0AA97B8C5E32BABED5CC50B');
assert.equal(hash(promoted), 'FE850EA74A082D8E57EE47D0E3D70339088D1490128D93A86BDDDB338947F0A9');
const lf = value => value.toString('utf8').replaceAll('\r\n', '\n');
assert.equal(lf(frozen), lf(promoted));
const source = lf(canonical);
const testBanner = '# =============================================================================\n# =================== BURN & REDEEM ESCROW TEST SUITE';
const targetBanner = '    # =============================================================================\n    # ======== COMPILATION TARGET';
assert.ok(source.includes(testBanner) && source.includes(targetBanner));
const reconstructed = source.slice(0, source.indexOf(testBanner))
  + source.slice(source.lastIndexOf(targetBanner)).replace(/^ {4}/gm, '');
assert.equal(reconstructed.trimEnd(), lf(fixture).trimEnd());
console.log('PASS: canonical/snapshot identity, mechanical test stripping and unchanged target, frozen/promoted LF identity');
console.log(`canonical checkout SHA-256 ${hash(canonical)}`);
console.log(`promoted checkout SHA-256 ${hash(promoted)}`);
