const Binance = require('node-binance-api');
const binance = new Binance().options({
  APIKEY: process.env.API_KEY_TEST,
  APISECRET: process.env.API_SECRET_TEST,
  //   APIKEY: process.env.API_KEY_MAIN,
  //   APISECRET: process.env.API_SECRET_MAIN,
});

module.exports = binance;
