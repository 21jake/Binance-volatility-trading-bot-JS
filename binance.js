const { TESTNET_URLS, MAINNET_URLS } = require('./constants');
const Binance = require('node-binance-api');

// set TEST_MODE = false to switch to the mainnet with REAL money
const TEST_MODE = true;

const { API_KEY_TEST, API_SECRET_TEST, API_KEY_MAIN, API_SECRET_MAIN } = process.env;

const binance = new Binance().options({
  verbose: TEST_MODE ? false : true,
  urls: TEST_MODE ? TESTNET_URLS : MAINNET_URLS,
  APIKEY: TEST_MODE ? API_KEY_TEST : API_KEY_MAIN,
  APISECRET: TEST_MODE ? API_SECRET_TEST : API_SECRET_MAIN,
});

if (!TEST_MODE) {
  console.log(
    "You're using the bot on the mainnet with real money, be cautious and don't start with too much quantity!!"
  );
}

module.exports = binance;
