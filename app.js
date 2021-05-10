const express = require('express');
require('./exchange-info');
const { readFile } = require('fs').promises;
const binance = require('./binance');

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
  console.log(initialPrices, 'initialPrices');

  while (initialPrices['BTCUSDT'].time > new Date().getTime() - process.env.INTERVAL) {
    await sleep(process.env.INTERVAL);
  }
  const lastestPrice = await getPrices();
  console.log(initialPrices, 'initialPrices');
  console.log(lastestPrice, 'lastestPrice');
  //   const volatiles = detectVolatiles(initialPrices, lastestPrice);

  //   console.log(util.inspect(prices, { showHidden: false, depth: null }));
};

const buy = (coin, quantity) => {
  return new Promise((resolve, reject) => {
    binance.marketBuy(coin, quantity, (flags = { type: 'MARKET' }), (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
};

const calculateBuyingQuantity = async (coin, length) => {
  try {
    const exchangeConfig = JSON.parse(await readFile('exchange-config.json'));
    const { stepSize } = exchangeConfig[coin];
    const allowedUSDTtoSpend = process.env.QUANTITY / length;
    const price = await binance.prices(coin);
    const quantity = allowedUSDTtoSpend / price[coin];
    const quantityBasedOnStepSize = await binance.roundStep(quantity, stepSize);
    return quantityBasedOnStepSize;
  } catch (error) {
    console.log(`Error in calculating quantity: ${error}`);
  }
};

const handleBuy = async (coin, quantity) => {
  try {
    const orderData = await binance.marketBuy(coin, quantity, (flags = { type: 'MARKET' }));
    return orderData;
  } catch (error) {
    console.log(`Error in executing buy function: ${error}`);
  }
};
const dummy = (volatiles = ['XRPUSDT', 'TRXUSDT']) => {
  try {
    volatiles.forEach(async (coin) => {
      const quantity = await calculateBuyingQuantity(coin, volatiles.length);
      const orderData = await handleBuy(coin, quantity);
      console.log(orderData);
      //     const orderData = await buy(coin, quantity);
      //   console.log(quantity, 'quantity');
    });
  } catch (error) {
    console.log(error, 'error');
  }
};

dummy();

// main();
// setInterval(() => {
//   main();
// }, process.env.INTERVAL);

module.exports = app;

// const calculateQuality =

// const data = await binance.balance();

// console.log(data, 'data');
