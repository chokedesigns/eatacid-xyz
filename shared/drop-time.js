// =============================================================================
// SHARED DROP TIME PARSER
// - Canonical, strict parsing for dropDate + dropTime
// - Used by both front-end (events.js) and admin UI
// =============================================================================

// -----------------------------------------------------------------------------
// TIMEZONE SUPPORT
// -----------------------------------------------------------------------------

// Allowed base timezones for dropTime.timezone
const SUPPORTED_DROP_TIMEZONES = ['CST', 'EST', 'PST'];

/**
 * Normalize a raw timezone string from dropTime.
 *
 * @param {string} raw
 * @returns {string|null} Uppercased valid code (e.g. "CST") or null if invalid.
 */
function normalizeDropTimezone(raw) {
  const v = (raw || '').trim().toUpperCase();
  if (!v) return null;
  return SUPPORTED_DROP_TIMEZONES.includes(v) ? v : null;
}

// Authored abbreviations denote seasonal US zones, not fixed UTC offsets.
const DROP_ZONES = {
  CST: { name: 'America/Chicago', offsets: [6, 5] },
  EST: { name: 'America/New_York', offsets: [5, 4] },
  PST: { name: 'America/Los_Angeles', offsets: [8, 7] }
};

// -----------------------------------------------------------------------------
// DATE PARSING (STRICT)
// -----------------------------------------------------------------------------

// Canonical month names used for formatting + Date string construction
const MONTHS_FULL = [
  'January', 'February', 'March',     'April',
  'May',     'June',     'July',      'August',
  'September','October', 'November',  'December'
];

/**
 * Parse month from:
 *  - numeric "1".."12"
 *  - EXACT 3-letter abbrev ("JAN","FEB",...)
 *  - full name ("JANUARY","FEBRUARY",...)
 *
 * No random partials like "NOVE" etc.
 *
 * @param {string|number} raw
 * @returns {number|null} 0-based month index, or null if invalid
 */
function parseMonth(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;

  // Numeric month 1–12
  const n = Number(s);
  if (Number.isInteger(n) && n >= 1 && n <= 12) {
    return n - 1;  // convert to 0-based
  }

  const up = s.toUpperCase();
  if (up.length === 3) {
    // 3-letter abbrev
    const idx = MONTHS_FULL.findIndex(
      name => name.slice(0, 3).toUpperCase() === up
    );
    return idx >= 0 ? idx : null;
  }

  // Full name only
  const idx = MONTHS_FULL.findIndex(
    name => name.toUpperCase() === up
  );
  return idx >= 0 ? idx : null;
}

/**
 * Parse day as integer 1–31 ONLY.
 * Any non-numeric or out-of-range input is rejected.
 *
 * @param {string|number} raw
 * @returns {number|null}
 */
function parseDay(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;

  const n = Number(s);
  if (!Number.isInteger(n)) return null;
  if (n < 1 || n > 31) return null;
  return n;
}

/**
 * Parse year as exactly 4 digits.
 * Any other shape is rejected.
 *
 * @param {string|number} raw
 * @returns {number|null}
 */
function parseYear(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!/^\d{4}$/.test(s)) return null;
  const n = Number(s);
  // You can tighten this further if you want (e.g. n >= 2020)
  if (n < 1970 || n > 9999) return null;
  return n;
}

/**
 * Validate dropDate = { month, day, year } with:
 *  - strict month/day/year parsing
 *  - hard check that the combination is a real calendar date
 *    (prevents "November 31 → December 1" rollover).
 *
 * Returns:
 *  - { ok: true, year, monthIndex, day, date }
 *  - { ok: false, error: 'BAD_DATE' | 'MISSING' }
 *
 * @param {{month:string|number, day:string|number, year:string|number}} dropDate
 */
export function validateDropDate(dropDate) {
  if (!dropDate) {
    return { ok: false, error: 'MISSING' };
  }

  const monthIndex = parseMonth(dropDate.month);
  const day        = parseDay(dropDate.day);
  const year       = parseYear(dropDate.year);

  if (monthIndex == null || day == null || year == null) {
    return { ok: false, error: 'BAD_DATE' };
  }

  // Calendar validation must not depend on the viewer's timezone.
  const candidate = new Date(Date.UTC(year, monthIndex, day));
  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth()    !== monthIndex ||
    candidate.getUTCDate()     !== day
  ) {
    // This catches things like "November 31" turning into December 1
    return { ok: false, error: 'BAD_DATE' };
  }

  return {
    ok: true,
    year,
    monthIndex,
    day,
    date: candidate
  };
}

// -----------------------------------------------------------------------------
// TIME PARSING (LIGHTLY STRICT)
// -----------------------------------------------------------------------------

/**
 * Parse dropTime.time ("H:MM" or "HH:MM") + period ("AM"/"PM").
 *
 * We keep this relatively forgiving but numeric-only:
 *  - hour 1–12
 *  - minute 0–59
 *
 * @param {{ time:string, period:string }} dropTime
 * @returns {{ ok:true, hour:number, minute:number } | { ok:false, error:string }}
 */
function parseDropWallClock(dropTime) {
  if (!dropTime || !dropTime.time || !dropTime.period) {
    return { ok: false, error: 'MISSING_TIME' };
  }

  const rawTime   = String(dropTime.time).trim();
  const rawPeriod = String(dropTime.period).trim().toUpperCase();

  const m = rawTime.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) {
    return { ok: false, error: 'BAD_TIME' };
  }

  let hour   = Number(m[1]);
  const min  = Number(m[2]);

  if (!Number.isInteger(hour) || !Number.isInteger(min)) {
    return { ok: false, error: 'BAD_TIME' };
  }
  if (min < 0 || min > 59) {
    return { ok: false, error: 'BAD_TIME' };
  }

  if (rawPeriod !== 'AM' && rawPeriod !== 'PM') {
    return { ok: false, error: 'BAD_TIME_PERIOD' };
  }

  if (hour < 1 || hour > 12) {
    return { ok: false, error: 'BAD_TIME' };
  }

  // Convert to 24h for Date construction later
  if (rawPeriod === 'PM' && hour !== 12) {
    hour += 12;
  } else if (rawPeriod === 'AM' && hour === 12) {
    hour = 0; // midnight
  }

  return { ok: true, hour, minute: min };
}

// -----------------------------------------------------------------------------
// MAIN: computeDropInstant
// -----------------------------------------------------------------------------

/**
 * Compute a concrete Date for the drop start, with strict validation.
 *
 * dropDate: { month, day, year }
 * dropTime: { time, period, timezone }
 *
 * Returns:
 *  - { ok:true, date: Date }
 *  - { ok:false, error:'BAD_TZ'|'BAD_DATE'|'BAD_DATE_TZ'|'BAD_TIME'|... }
 */
export function computeDropInstant(dropDate, dropTime) {
  if (!dropDate || !dropTime) {
    return { ok: false, error: 'MISSING' };
  }

  // 1) Validate date
  const dateCheck = validateDropDate(dropDate);
  if (!dateCheck.ok) {
    return { ok: false, error: 'BAD_DATE' };
  }
  const { year, monthIndex, day } = dateCheck;

  // 2) Validate timezone
  const tzBase = normalizeDropTimezone(dropTime.timezone);
  if (!tzBase) {
    return { ok: false, error: 'BAD_TZ' };
  }

  // 3) Parse wall-clock time
  const timeCheck = parseDropWallClock(dropTime);
  if (!timeCheck.ok) {
    return { ok: false, error: timeCheck.error };
  }
  const { hour, minute } = timeCheck;

  // Round-trip both possible offsets through the named zone's own DST rules.
  // Zero matches is a spring gap; two matches is an ambiguous autumn fold.
  // Neither can publish one instant with the existing authoring schema.
  const zone = DROP_ZONES[tzBase];
  let matches;
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: zone.name, hourCycle: 'h23',
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric'
    });
    matches = zone.offsets.map(offset => new Date(
      Date.UTC(year, monthIndex, day, hour, minute) + offset * 3600000
    )).filter(date => {
      const parts = Object.fromEntries(formatter.formatToParts(date).map(p => [p.type, p.value]));
      return Number(parts.year) === year && Number(parts.month) === monthIndex + 1
        && Number(parts.day) === day && Number(parts.hour) === hour
        && Number(parts.minute) === minute;
    });
  } catch {
    return { ok: false, error: 'BAD_DATE_TZ' };
  }
  if (matches.length !== 1) {
    return { ok: false, error: 'BAD_DATE_TZ' };
  }
  return { ok: true, date: matches[0] };
}
