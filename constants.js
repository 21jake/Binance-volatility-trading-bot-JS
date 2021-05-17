const MARKET_FLAG = { type: 'MARKET' };

// List of pairs to exclude
// by default we're excluding the most popular fiat pairs
// and some margin keywords, as we're only working on the SPOT account
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

// set TEST_MODE = false to switch to the mainnet with REAL money
const TEST_MODE = true;

// set TRAILING_MODE = false to sell whenever an asset hits the TP threshold
const TRAILING_MODE = true;

module.exports = { MARKET_FLAG, FIATS, TESTNET_URLS, MAINNET_URLS, TEST_MODE, TRAILING_MODE };
