const express = require('express');
const Binance = require('node-binance-api');
const util = require('util');

const FIATS = ['EURUSDT', 'GBPUSDT', 'JPYUSDT', 'USDUSDT', 'DOWN', 'UP', 'VNDUSDT'];

const app = express();
const binance = new Binance().options({
  APIKEY: process.env.API_KEY_MAIN,
  APISECRET: process.env.API_SECRET_MAIN,
});

const getPrices = async () => {
  try {
    const data = await binance.prices();
    const output = {};
    for (const coin in data) {
      if (coin.includes(process.env.PAIR_WITH) && !FIATS.includes(coin)) {
        output[coin] = {
          price: data[coin],
          time: new Date().getTime(),
        };
      }
    }
    return output;
  } catch (error) {
    console.log(`There was an error getting prices: ${error}`);
  }
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const main = async () => {
  const initialPrices = await getPrices();
  while (initialPrices['BTCUSDT'].time > new Date().getTime() - process.env.INTERVAL) {
    await sleep(process.env.INTERVAL);
  }
  const lastestPrice = await getPrices();
  console.log(initialPrices, 'initialPrices');
  console.log(lastestPrice, 'lastestPrice');
  //   console.log(util.inspect(prices, { showHidden: false, depth: null }));
};

main();
setInterval(() => {
  main();
}, process.env.INTERVAL);

module.exports = app;
