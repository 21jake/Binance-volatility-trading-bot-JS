const { readFile, writeFile } = require('fs').promises;
const binance = require('../binance');
const { MARKET_FLAG, FIATS } = require('../constants');
const { returnPercentageOfX } = require('./helpers');

const calculatePortfolioValue = (portfolio) => {
  let value = 0;
  if (portfolio.length) {
    portfolio.forEach(({ quantity, price }) => {
      value += quantity * price;
    });
  }
  return value;
};

const calculateBuyingQuantity = async (symbol, length, portfolio) => {
  try {
    const exchangeConfig = JSON.parse(await readFile('exchange-config.json'));
    const { stepSize } = exchangeConfig[symbol];
    const currentPortfolioValue = calculatePortfolioValue(portfolio);
    const allowedAmounttoSpend = (process.env.QUANTITY - currentPortfolioValue) / length;

    if (currentPortfolioValue >= process.env.QUANTITY) {
      throw `Current portfolio value exceeds the initial quantity, waiting for the current asset(s) to be sold first...`;
    }
    if (allowedAmounttoSpend < process.env.MIN_QUANTITY) {
      throw `The allowed amount (${allowedAmounttoSpend} ${process.env.PAIR_WITH}) to spend to buy ${symbol} is smaller than the allowed quantity (${process.env.MIN_QUANTITY} ${process.env.PAIR_WITH})`;
    }

    const price = await binance.prices(symbol);
    const quantity = allowedAmounttoSpend / price[symbol];
    const quantityBasedOnStepSize = await binance.roundStep(quantity, stepSize);
    return quantityBasedOnStepSize;
  } catch (error) {
    console.log(error);
    throw `Error in calculating quantity: ${JSON.stringify(error)}`;
  }
};

const buy = async (coin, quantity) => {
  try {
    const orderData = await binance.marketBuy(coin, quantity, (flags = MARKET_FLAG));
    return orderData;
  } catch (error) {
    throw `Error in executing buy function: ${error.body || JSON.stringify(error)}`;
  }
};

const isSymbolBought = (portfolio, symbol) => {
  if (portfolio.length) {
    return false;
  } else {
    return !portfolio.filter((order) => order.symbol === symbol).length;
  }
};

const handleBuy = (volatiles) => {
  if (volatiles.length) {
    volatiles.forEach(async (symbol) => {
      try {
        const portfolio = JSON.parse(await readFile('orders.json'));
        const quantity = await calculateBuyingQuantity(symbol, volatiles.length, portfolio);
        const purchaseData = await buy(symbol, quantity);
        const { price } = purchaseData.fills[0];
        const orderData = {
          symbol,
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
    console.log(`No coin has rised more than ${VOLATILE_TRIGGER}% in the last ${INTERVAL / 60000} minutes`);
  }
};

module.exports = { handleBuy };
