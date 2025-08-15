// drop-params.js

export default {
  dropName: "GHOSTNET",

  dropDate: {
    month: "August",
    day:   "14",
    year:  "2025"
  },

  dropTime: {
    time:     "7:20",
    period:   "PM",
    timezone: "EST"
  },

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

  redeemToken: {
    collection:   "CANAAN",
    tokenId:      "29",
    redeemAmount: 1,
    totalSupply:  10
  }
};