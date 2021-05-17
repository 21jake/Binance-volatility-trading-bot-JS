const { readFile, writeFile } = require('fs').promises;
const binance = require('../binance');
const { MARKET_FLAG } = require('../constants');
const { returnPercentageOfX } = require('./helpers');

const { VOLATILE_TRIGGER, INTERVAL, QUANTITY, MIN_QUANTITY, TP_THRESHOLD, SL_THRESHOLD } = process.env;

const calculatePortfolioValue = (portfolio) => {
  let value = 0;
  if (portfolio.length) {
    portfolio.forEach(({ quantity, price }) => {
      value += quantity * price;
    });
  }
  return value;
};

const buy = async (coin, quantity) => {
  try {
    const orderData = await binance.marketBuy(coin, quantity, (flags = MARKET_FLAG));
    return orderData;
  } catch (error) {
    throw `Error in executing buy function: ${error.body || JSON.stringify(error)}`;
  }
};

const calculateBuyingQuantity = async (symbol, length, portfolio) => {
  try {
    const exchangeConfig = JSON.parse(await readFile('exchange-config.json'));
    const { stepSize } = exchangeConfig[symbol];
    const currentPortfolioValue = calculatePortfolioValue(portfolio);

    // The budget is splited equally for each order
    let allowedAmountToSpend = QUANTITY / length;

    /* Generally the bot will not spend 100% (only like 98-99%) of the budget because the the actual quantity is rounded down
     Do not buy if current portolio value is greater than 90% of the orignal quantity */
    if (currentPortfolioValue >= returnPercentageOfX(QUANTITY, 90)) {
      throw `Current portfolio value exceeds the initial quantity, waiting for the current asset(s) to be sold first...`;
    }

    /* 
      In case the allowed amount smaller than the min qty, proceed to buy the with the min qty
      For example in an interval, there are 4 coins to buy and the budget is 30...
      since you can't buy with 30/4 = 7.5 USDT, the allowed amount is increased to 11
      In this case, only the first two coins in this batch will be bought at 11 USDT each, 8 USDT won't be spent
    */
    if (allowedAmountToSpend < MIN_QUANTITY) {
      allowedAmountToSpend = MIN_QUANTITY;
    }

    const price = await binance.prices(symbol);
    const quantity = allowedAmountToSpend / price[symbol];
    const quantityBasedOnStepSize = await binance.roundStep(quantity, stepSize);
    return quantityBasedOnStepSize;
  } catch (error) {
    console.log(error);
    throw `Error in calculating quantity: ${JSON.stringify(error)}`;
  }
};

const handleBuy = async (volatiles) => {
  if (volatiles.length) {
    for (const symbol of volatiles) {
      try {
        const portfolio = JSON.parse(await readFile('orders.json'));
        const quantity = await calculateBuyingQuantity(symbol, volatiles.length, portfolio);
        const purchaseData = await buy(symbol, quantity);
        const { price } = purchaseData.fills[0];
        const orderData = {
          symbol,
          quantity,
          orderId: purchaseData.orderId,
          bought_at: Number(price),
          order_ATH: Number(price),
          TP_Threshold: Number(price) + returnPercentageOfX(Number(price), TP_THRESHOLD),
          SL_Threshold: Number(price) - returnPercentageOfX(Number(price), SL_THRESHOLD),
          purchase_time: new Date().toLocaleString(),
          updated_at: new Date().toLocaleString(),
        };
        portfolio.push(orderData);
        console.log(`Successfully place an order: ${JSON.stringify(orderData)}`);
        await writeFile('orders.json', JSON.stringify(portfolio, null, 4), { flag: 'w' });
      } catch (error) {
        console.log(`Error in executing buying volatiles function: ${error.body || JSON.stringify(error)}`);
      }
    }
  } else {
    console.log(`No coin has risen more than ${VOLATILE_TRIGGER}% in the last ${INTERVAL} minutes`);
  }
};

module.exports = { handleBuy };
