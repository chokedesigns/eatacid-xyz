import assert from 'node:assert/strict';
import test from 'node:test';
import { computeDropInstant, validateDropDate } from './drop-time.js';

const date = (month, day, year = '2026') => ({ month, day: String(day), year });
const time = (value, timezone = 'EST', period = 'AM') => ({ time: value, timezone, period });

test('published instant is identical across viewer zones, winter/summer and US DST edges', () => {
  const original = process.env.TZ;
  try {
    for (const host of ['UTC', 'America/New_York', 'Asia/Tokyo', 'Australia/Sydney', 'Pacific/Apia']) {
      process.env.TZ = host;
      for (const [zone, winterHour, summerHour] of [['EST', 20, 19], ['CST', 21, 20], ['PST', 23, 22]]) {
        assert.equal(computeDropInstant(date('January', 9), time('3:00', zone, 'PM')).date.toISOString(),
          `2026-01-09T${winterHour}:00:00.000Z`);
        assert.equal(computeDropInstant(date('October', 9), time('3:00', zone, 'PM')).date.toISOString(),
          `2026-10-09T${summerHour}:00:00.000Z`);
        assert.equal(computeDropInstant(date('March', 8), time('1:59', zone)).ok, true);
        assert.deepEqual(computeDropInstant(date('March', 8), time('2:30', zone)),
          { ok: false, error: 'BAD_DATE_TZ' });
        assert.equal(computeDropInstant(date('March', 8), time('3:00', zone)).ok, true);
        assert.deepEqual(computeDropInstant(date('November', 1), time('1:30', zone)),
          { ok: false, error: 'BAD_DATE_TZ' });
        assert.equal(computeDropInstant(date('November', 1), time('2:00', zone)).ok, true);
      }
      assert.equal(computeDropInstant(date('March', 8), time('1:59')).date.toISOString(), '2026-03-08T06:59:00.000Z');
      assert.equal(computeDropInstant(date('March', 8), time('3:00')).date.toISOString(), '2026-03-08T07:00:00.000Z');
      assert.equal(computeDropInstant(date('November', 1), time('2:00')).date.toISOString(), '2026-11-01T07:00:00.000Z');
      assert.equal(computeDropInstant(date('January', 9), time('12:00')).date.toISOString(), '2026-01-09T05:00:00.000Z');
      assert.equal(computeDropInstant(date('January', 9), time('12:00', 'EST', 'PM')).date.toISOString(), '2026-01-09T17:00:00.000Z');
      // Even a calendar date skipped by the viewer's zone is valid in the schedule zone.
      assert.equal(validateDropDate(date('December', 30, '2011')).ok, true);
    }
  } finally {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  }
});

test('strict invalid-input contract is preserved', () => {
  for (const bad of [date('November', 31), date('February', 29), date('Nove', 3), date(13, 1),
    date('January', 0), date('January', 1, '26')]) {
    assert.deepEqual(computeDropInstant(bad, time('3:00')), { ok: false, error: 'BAD_DATE' });
  }
  assert.equal(validateDropDate(date('February', 29, '2024')).ok, true);
  for (const bad of ['0:00', '13:00', '1:60', '1:0', 'abc']) {
    assert.equal(computeDropInstant(date('January', 1), time(bad)).ok, false);
  }
  assert.deepEqual(computeDropInstant(date('January', 1), time('3:00', 'UTC')), { ok: false, error: 'BAD_TZ' });
  assert.deepEqual(computeDropInstant(null, null), { ok: false, error: 'MISSING' });
});
