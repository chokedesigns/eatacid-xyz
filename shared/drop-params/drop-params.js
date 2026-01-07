// drop-params.js

export default {
  // ============================================================
  // TOP-LEVEL DROP SCHEDULE TOGGLE
  // ------------------------------------------------------------
  // true  = Show Drops UI
  // false = Show "No Drops Scheduled" panel
  // ============================================================
  dropScheduled: true,

  // ============================================================
  // DROP NAME
  // ============================================================
  dropName: "GHOSTNET",

  // ============================================================
  // DROP DATE
  // ============================================================
  dropDate: {
    month: "January",    // "January"–"December", "Jan"–"Dec", or "1"–"12"
    day:   "26",          // "1"–"31"
    year:  "2026"         // four-digit year, "XXXX"
  },

  // ============================================================
  // DROP TIME
  // ============================================================
  dropTime: {
    time:     "12:59",    // "H:MM" or "HH:MM" (12-hour clock)
    period:   "AM",       // "AM" | "PM"
    timezone: "EST"       // "CST" | "EST" | "PST"
  },

  // ============================================================
  // BURN TOKENS
  // ============================================================
  burnTokens: [
    {
      collection: "HEN",
      enabled:    true,
      exclude:    ["141634"],
      burnAmount: 1
    },
    {
      collection: "INTRODUCTIONS",
      enabled:    false,
      exclude:    [""],
      burnAmount: 1
    }
  ],

  // ============================================================
  // REDEEM TOKEN
  // ============================================================
  redeemToken: {
    collection:   "CANAAN",
    tokenId:      "29",
    redeemAmount: 1,
    totalSupply:  10
  }
};