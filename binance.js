const { TESTNET_URLS, MAINNET_URLS } = require('./constants');
const Binance = require('node-binance-api');

// set TEST_MODE = false to switch to the mainnet with REAL money, don't forget to replace the API keys
const TEST_MODE = true;

const binance = new Binance().options({
  urls: TEST_MODE ? TESTNET_URLS : MAINNET_URLS,
  APIKEY: process.env.API_KEY_TEST,
  APISECRET: process.env.API_SECRET_TEST,
  // APIKEY: process.env.API_KEY_MAIN,
  // APISECRET: process.env.API_SECRET_MAIN,
});

if (TEST_MODE) {
  console.log(
    "You're using the bot on the mainnet with real money, be cautious and don't start with too much quantity!!"
  );
}

module.exports = binance;
