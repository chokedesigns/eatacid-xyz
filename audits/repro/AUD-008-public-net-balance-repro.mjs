// Historical executable entrypoint, now maintained corrective evidence for AUD-008-001.
// Runs the production reader/journal/poller and both real page-consumer seams.
// Inert wallets/indexers/storage only; no operational transactions or writes.
import '../../shared/public-trade-freshness.test.mjs';
import '../../exchange/js/exchange-wallet.test.mjs';
import '../../drops/js/wallet-rendering.test.mjs';
