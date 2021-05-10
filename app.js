const express = require('express');
const Binance = require('node-binance-api');
const util = require('util');

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

const app = express();
const binance = new Binance().options({
  APIKEY: process.env.API_KEY_MAIN,
  APISECRET: process.env.API_SECRET_MAIN,
});

const intervalInMinutes = process.env.INTERVAL / 60000;

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

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
const detectVolatiles = (initialPrices, lastestPrices) => {
  const volatiles = [];
  for (const coin in initialPrices) {
    const changePercentage =
      ((lastestPrices[coin]['price'] - initialPrices[coin]['price']) / initialPrices[coin]['price']) * 100;
    if (changePercentage >= process.env.VOLATILE_TRIGGER) {
      const formatedChange = Number(changePercentage).toFixed(2);
      console.log(
        `The ${coin} has the votality of ${formatedChange}% within last ${intervalInMinutes} minutes`
      );
      volatiles.push(coin);
    }
  }
  return volatiles;
};

const main = async () => {
  const initialPrices = await getPrices();
  while (initialPrices['BTCUSDT'].time > new Date().getTime() - process.env.INTERVAL) {
    await sleep(process.env.INTERVAL);
  }
  const lastestPrice = await getPrices();
  const volatiles = detectVolatiles(initialPrices, lastestPrice);

  //   console.log(util.inspect(prices, { showHidden: false, depth: null }));
};

main();
setInterval(() => {
  main();
}, process.env.INTERVAL);

module.exports = app;
