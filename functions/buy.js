const { readFile, writeFile } = require('fs').promises;
const binance = require('../binance');
const { MARKET_FLAG, FIATS } = require('../constants');
const { returnPercentageOfX } = require('./helpers');

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
    throw `Error in calculating quantity: ${error.body || JSON.stringify(error)}`;
  }
};

const buy = async (coin, quantity) => {
  try {
    const orderData = await binance.marketBuy(coin, quantity, (flags = MARKET_FLAG));
    // const orderData = await buy(coin, quantity);
    return orderData;
  } catch (error) {
    throw `Error in executing buy function: ${error.body || JSON.stringify(error)}`;
  }
};

const handleBuy = (volatiles) => {
  // const handleBuy = (volatiles = ['XRPUSDT', 'TRXUSDT']) => {
  if (volatiles.length) {
    volatiles.forEach(async (coin) => {
      try {
        const quantity = await calculateBuyingQuantity(coin, volatiles.length);
        const purchaseData = await buy(coin, quantity);
        const portfolio = JSON.parse(await readFile('orders.json'));
        const { price } = purchaseData.fills[0];
        const orderData = {
          symbol: coin,
          quantity,
          orderId: purchaseData.orderId,
          price: Number(price),
          TP_Threshold: Number(price) + returnPercentageOfX(Number(price), process.env.TP_THRESHOLD),
          SL_Threshold: Number(price) - returnPercentageOfX(Number(price), process.env.SL_THRESHOLD),
        };
        portfolio.push(orderData);
        await writeFile('orders.json', JSON.stringify(portfolio, null, 4), { flag: 'w' });
        console.log(`Successfully place an order: ${JSON.stringify(orderData)}`);
      } catch (error) {
        console.log(`Error in executing buying volatiles function: ${error.body || JSON.stringify(error)}`);
      }
    });
  } else {
    const { VOLATILE_TRIGGER, INTERVAL } = process.env;
    console.log(`No coin has moved more than ${VOLATILE_TRIGGER}% in the last ${INTERVAL / 60000} minutes`);
  }
};

module.exports = { handleBuy };
