const { TESTNET_URLS, MAINNET_URLS, TEST_MODE } = require('./constants');
const Binance = require('node-binance-api');

const { API_KEY_TEST, API_SECRET_TEST, API_KEY_MAIN, API_SECRET_MAIN } = process.env;

const binance = new Binance().options({
  verbose: !TEST_MODE,
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
