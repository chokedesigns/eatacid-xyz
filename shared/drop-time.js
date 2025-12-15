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

/**
 * @returns {boolean} True if DST is in effect for `date` (host environment).
 *
 * NOTE: This uses the *host* environment's timezone offsets, which is not
 * perfect, but it's good enough to flip CST→CDT, EST→EDT, PST→PDT on the
 * right part of the calendar.
 */
function isDST(date = new Date()) {
  const janOffset = new Date(date.getFullYear(), 0, 1).getTimezoneOffset();
  const julOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
  return date.getTimezoneOffset() < Math.max(janOffset, julOffset);
}

/**
 * Given a base US timezone ("CST" | "EST" | "PST") and a calendar date,
 * return the correct standard/DST abbreviation ("CST"/"CDT", etc.).
 *
 * @param {string} stdAbbrev
 * @param {Date} date
 * @returns {string}
 */
function getTzAbbrev(stdAbbrev, date) {
  const map = {
    CST: { std: 'CST', dst: 'CDT' },
    EST: { std: 'EST', dst: 'EDT' },
    PST: { std: 'PST', dst: 'PDT' }
  };
  const key   = stdAbbrev?.toUpperCase();
  const entry = map[key];
  if (!entry) return stdAbbrev;
  return isDST(date) ? entry.dst : entry.std;
}

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

  // Build a naive local Date and make sure nothing "rolls over"
  const candidate = new Date(year, monthIndex, day);
  if (
    candidate.getFullYear() !== year ||
    candidate.getMonth()    !== monthIndex ||
    candidate.getDate()     !== day
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

  // 4) Decide DST variant ("EST" vs "EDT", etc.) using a safe date
  const safeCalendarDate = new Date(year, monthIndex, day);
  const tzAbbrev = getTzAbbrev(tzBase, safeCalendarDate);

  // 5) Build a stable Date string using a canonical month name,
  //    but *only* after we've proven the Y-M-D combo is valid.
  const monthName = MONTHS_FULL[monthIndex];
  const hh = String(((hour + 11) % 12) + 1); // convert back to 1–12 for display
  const mm = String(minute).padStart(2, '0');
  const period = hour >= 12 ? 'PM' : 'AM';

  const baseLabel = `${monthName} ${day}, ${year} ${hh}:${mm} ${period}`;
  const fullLabel = `${baseLabel} ${tzAbbrev}`;
  const dropDateTime = new Date(fullLabel);

  if (!Number.isFinite(dropDateTime.getTime())) {
    return { ok: false, error: 'BAD_DATE_TZ' };
  }

  return { ok: true, date: dropDateTime };
}