const express = require('express');
require('./exchange-info');
const { readFile, writeFile } = require('fs').promises;
const binance = require('./binance');
const { MARKET_FLAG, FIATS } = require('./constants');

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
    console.log(`There was an error getting prices: ${error.body || JSON.stringify(error)}`);
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
  try {
    const initialPrices = await getPrices();
    while (initialPrices['BTCUSDT'].time > new Date().getTime() - process.env.INTERVAL) {
      console.log('Not enough time has passed, please wait...');
      await sleep(process.env.INTERVAL);
    }
    const lastestPrice = await getPrices();
    const volatiles = detectVolatiles(initialPrices, lastestPrice);
    handleSell(lastestPrice);
    buyVolatiles(volatiles);
  } catch (error) {
    console.log(`Error in excuting main function: ${error.body || JSON.stringify(error)}`);
  }
};

const handleSell = async (lastestPrice) => {
  const orders = JSON.parse(await readFile('orders.json'));
  const newOrders = [...orders];
  if (orders.length) {
    orders.forEach(async ({ symbol, TP_Threshold, SL_Threshold, quantity }) => {
      try {
        const { price: coinRecentPrice } = lastestPrice[symbol];
        if (coinRecentPrice >= TP_Threshold || coinRecentPrice <= SL_Threshold) {
          const exchangeConfig = JSON.parse(await readFile('exchange-config.json'));
          const { stepSize } = exchangeConfig[symbol];
          const acutalQty = returnPercentageOfX(quantity, process.env.ACTUAL_SELL_RATIO);
          const roundedQty = await binance.roundStep(acutalQty, stepSize);
          const sellData = await binance.marketSell(symbol, roundedQty, (flags = MARKET_FLAG));

          if (sellData.status === 'FILLED') {
            newOrders.filter((order) => order.symbol !== symbol);
          } else {
            console.log(
              `Sell order: ${roundedQty} of ${symbol} not executed properly, waiting for another chance to sell...`
            );
          }
        } else {
          console.log(`${symbol} price hasn't hit SL or TP threshold, continue to wait...`);
        }
      } catch (error) {
        console.log(`Error in excuting sell function: ${error.body || JSON.stringify(error)}`);
      }
    });
    await writeFile('orders.json', JSON.stringify(newOrders, null, 4), { flag: 'w' });
  } else {
    console.log('The portfolio is currently empty, wait for the chance to buy...');
  }
};

main();
setInterval(() => {
  main();
}, process.env.INTERVAL);

// const buy = (coin, quantity) => {
//   return new Promise((resolve, reject) => {
//     binance.marketBuy(coin, quantity, (flags = MARKET_FLAG), (err, res) => {
//       if (err) {
//         reject(err);
//       } else {
//         resolve(res);
//       }
//     });
//   });
// };

const calculateBuyingQuantity = async (coin, length) => {
  try {
    const exchangeConfig = JSON.parse(await readFile('exchange-config.json'));
    const { stepSize } = exchangeConfig[coin];
    const allowedUSDTtoSpend = process.env.QUANTITY / length;
    const price = await binance.prices(coin);
    const quantity = allowedUSDTtoSpend / price[coin];
    const quantityBasedOnStepSize = await binance.roundStep(quantity, stepSize);
    return { quantityBasedOnStepSize, stepSize };
  } catch (error) {
    throw `Error in calculating quantity: ${error.body || JSON.stringify(error)}`;
  }
};

const handleBuy = async (coin, quantity) => {
  try {
    const orderData = await binance.marketBuy(coin, quantity, (flags = MARKET_FLAG));
    // const orderData = await buy(coin, quantity);
    return orderData;
  } catch (error) {
    throw `Error in executing buy function: ${error.body || JSON.stringify(error)}`;
  }
};
const returnPercentageOfX = (x, percentage) => {
  return (percentage * x) / 100;
};
const buyVolatiles = (volatiles) => {
  // const buyVolatiles = (volatiles = ['XRPUSDT', 'TRXUSDT']) => {
  if (volatiles.length) {
    volatiles.forEach(async (coin) => {
      try {
        const { quantityBasedOnStepSize: quantity, stepSize } = await calculateBuyingQuantity(
          coin,
          volatiles.length
        );
        const purchaseData = await handleBuy(coin, quantity);
        const exisitingOrders = JSON.parse(await readFile('orders.json'));
        const { price } = purchaseData.fills[0];
        const orderData = {
          symbol: coin,
          quantity,
          orderId: purchaseData.orderId,
          price: Number(price),
          TP_Threshold: Number(price) + returnPercentageOfX(Number(price), process.env.TP_THRESHOLD),
          SL_Threshold: Number(price) - returnPercentageOfX(Number(price), process.env.SL_THRESHOLD),
        };
        exisitingOrders.push(orderData);
        await writeFile('orders.json', JSON.stringify(exisitingOrders, null, 4), { flag: 'w' });
        console.log(`Successfully place an order: ${JSON.stringify(orderData)}`);
      } catch (error) {
        console.log(error, 'buyVolatiles error');
      }
    });
  }
};

module.exports = app;
