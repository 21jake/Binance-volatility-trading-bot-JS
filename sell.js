const binance = require('./binance');
const { readFile, writeFile } = require('fs').promises;
const { returnPercentageOfX } = require('./helpers');
const { MARKET_FLAG } = require('./constants');

const sell = async (exchangeConfig, { symbol, quantity }) => {
  try {
    const { stepSize } = exchangeConfig[symbol];
    const actualQty = returnPercentageOfX(quantity, process.env.ACTUAL_SELL_RATIO);
    const roundedQty = await binance.roundStep(actualQty, stepSize);
    const sellData = await binance.marketSell(symbol, roundedQty, (flags = MARKET_FLAG));
    return sellData;
  } catch (error) {
    throw `Error in selling ${quantity} of ${symbol}: ${error.body || JSON.stringify(error)}`;
  }
};
const handleSellData = async (sellData, coinRecentPrice, order) => {
  try {
    const { symbol, TP_Threshold, SL_Threshold, quantity } = order;
    if (sellData.status === 'FILLED') {
      if (coinRecentPrice >= TP_Threshold) {
        console.log(`${symbol} price has hit TP threshold and the asset is sold`);
      } else if (coinRecentPrice <= SL_Threshold) {
        console.log(`${symbol} price has hit SL threshold and the asset is sold`);
      }
      await removeSymbolFromPortfolio(symbol);
    } else {
      console.log(
        `Sell order: ${quantity} of ${symbol} not executed properly by Binance, waiting for another chance to sell...`
      );
    }
  } catch (error) {
    throw `Error in handling sell data ${error.body || JSON.stringify(error)}`;
  }
};

const handleSell = async (lastestPrice) => {
  const orders = JSON.parse(await readFile('orders.json'));
  if (orders.length) {
    const exchangeConfig = JSON.parse(await readFile('exchange-config.json'));
    orders.forEach(async (order) => {
      try {
        const { symbol, TP_Threshold, SL_Threshold, quantity } = order;
        const { price: coinRecentPrice } = lastestPrice[symbol];
        if (coinRecentPrice >= TP_Threshold || coinRecentPrice <= SL_Threshold) {
          const sellData = await sell(exchangeConfig, order);
          await handleSellData(sellData, coinRecentPrice, order);
        } else {
          console.log(`${symbol} price hasn't hit SL or TP threshold, continue to wait...`);
        }
      } catch (error) {
        console.log(`Error in excuting sell function: ${JSON.stringify(error)}`);
      }
    });
  } else {
    console.log('The portfolio is currently empty, wait for the chance to buy...');
  }
};

const removeSymbolFromPortfolio = async (symbol) => {
  try {
    const orders = JSON.parse(await readFile('orders.json'));
    const updatedOrders = orders.filter((order) => order.symbol !== symbol);
    await writeFile('orders.json', JSON.stringify(updatedOrders, null, 4), { flag: 'w' });
  } catch (error) {
    console.log(`Error in removing symbol from portfolio: ${error}`);
  }
};

module.exports = { handleSell };
