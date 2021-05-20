const MARKET_FLAG = { type: 'MARKET' };

/* List of pairs to exclude
  by default we're excluding the most popular fiat pairs
  and some margin keywords, as we're only working on the SPOT account
*/
const FIATS = ['EURUSDT', 'GBPUSDT', 'JPYUSDT', 'USDUSDT', 'DOWN', 'UP'];
const TESTNET_URLS = {
  base: 'https://testnet.binance.vision/api/',
  combineStream: 'wss://testnet.binance.vision/stream?streams=',
  stream: 'wss://testnet.binance.vision/ws/',
};
const MAINNET_URLS = {
  base: 'https://api.binance.com/api/',
  combineStream: 'wss://stream.binance.com:9443/stream?streams=',
  stream: 'wss://stream.binance.com:9443/ws/',
};

// Set TEST_MODE = false to switch to the mainnet to trade with REAL money
const TEST_MODE = true;

/* 
 Every time an asset hits the TP, the bot doesn't sell it immediately. 
 The SL and TP threshold of that asset is increased.
 If an asset hits the SL, we sell (In fact, we just sell at SL).

 For example, BTCUSDT is bought at 100. TP is 106 (6%) and SL is 97 (3%). 
 When it hits 106, the TP is adjusted to ~109 and SL is ~103. 
 Whenever it hits SL (97 or 103...), the bot sells.

Disable this feature by setting "TRAILING_MODE" below to false
*/
const TRAILING_MODE = true;

/* 
  SAFE MODE description: To avoid the rapid ups and immediate downs within the next interval,
  after an asset is bought, the bot scan to check the asset price every 1 minute 
  (1 is the default value, you can change the SCAN_INTERVAL in the config.env file).
  If the asset price hits SL threshold during that 1 minute, the bot will proceed to sell the asset.
  Turning off the scan by setting "SAFE_MODE" below to false
*/
const SAFE_MODE = true;

module.exports = { MARKET_FLAG, FIATS, TESTNET_URLS, MAINNET_URLS, TEST_MODE, TRAILING_MODE, SAFE_MODE };
