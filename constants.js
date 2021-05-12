const MARKET_FLAG = { type: 'MARKET' };
const FIATS = [
  'EURUSDT',
  'GBPUSDT',
  'JPYUSDT',
  'USDUSDT',
  'DOWN',
  'UP',
  'VNDUSDT',
  'BCHDOWNUSDT',
  'BCHUPUSDT',
];
const TESTNET_URLS = {
  base: 'https://testnet.binance.vision/api/',
  combineStream: 'wss://testnet.binance.vision/stream?streams=',
  stream: 'wss://testnet.binance.vision/ws/',
};
module.exports = { MARKET_FLAG, FIATS, TESTNET_URLS };
