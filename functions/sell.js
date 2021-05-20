const binance = require('../binance');
const { readFile, writeFile } = require('fs').promises;
const {
  returnPercentageOfX,
  returnTimeLog,
  savePortfolio,
  readPortfolio,
  getBinanceConfig,
} = require('./helpers');

const { MARKET_FLAG, TRAILING_MODE, TEST_MODE } = require('../constants');
const { TP_THRESHOLD, SL_THRESHOLD } = process.env;

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

const saveSuccessOrder = async (order, coinRecentPrice) => {
  try {
    const successOrders = JSON.parse(await readFile('sold-assets.json'));
    const displayProfit = ((coinRecentPrice - order.bought_at) / order.bought_at) * 100;

    const successOrder = {
      ...order,
      sell_time: new Date().toLocaleString(),
      sell_at: Number(coinRecentPrice),
      profit: `${displayProfit.toFixed(2)}%`,
    };
    successOrders.push(successOrder);
    await writeFile('sold-assets.json', JSON.stringify(successOrders, null, 4), { flag: 'w' });
    const { symbol, profit } = successOrder;
    console.log(
      `${returnTimeLog()} The asset ${symbol} has been sold sucessfully at the profit of ${profit} and recorded in sold-assets.json`
    );
  } catch (error) {
    throw `Error in saving success order: ${error}`;
  }
};

const handleSellData = async (sellData, coinRecentPrice, order) => {
  try {
    const { symbol, TP_Threshold, SL_Threshold, quantity } = order;
    if (TEST_MODE ? sellData.status : sellData.status === 'FILLED') {
      if (coinRecentPrice >= TP_Threshold) {
        console.log(`${returnTimeLog()} ${symbol} price has hit TP threshold`);
      } else if (coinRecentPrice <= SL_Threshold) {
        console.log(`${returnTimeLog()} ${symbol} price has hit SL threshold`);
      }
      await saveSuccessOrder(order, coinRecentPrice);
      await removeSymbolFromPortfolio(symbol);
    } else {
      console.log(
        `${returnTimeLog()} Sell order: ${quantity} of ${symbol} not executed properly by Binance, waiting for another chance to sell...`
      );
    }
  } catch (error) {
    throw `Error in handling sell data ${error.body || JSON.stringify(error)}`;
  }
};

const changeOrderThresholds = async ({ symbol }, coinRecentPrice) => {
  try {
    const orders = await readPortfolio();
    const updatedOrders = orders.map((order) => {
      if (order.symbol !== symbol) {
        return order;
      } else {
        // The TP threshold achieved will act as the base for new TP_Threshold and SL_Threshold
        const updatedOrder = {
          ...order,
          updated_at: new Date().toLocaleString(),
          TP_Threshold: Number(coinRecentPrice) + returnPercentageOfX(Number(coinRecentPrice), TP_THRESHOLD),
          SL_Threshold: Number(coinRecentPrice) - returnPercentageOfX(Number(coinRecentPrice), SL_THRESHOLD),
        };
        return updatedOrder;
      }
    });
    await savePortfolio(updatedOrders);
    console.log(
      `${returnTimeLog()} The ${symbol} has hit TP threshold and we continue to hold as TRAILING MODE activated`
    );
  } catch (error) {
    throw `Error in changing order thresholds: ${error}`;
  }
};

const handlePriceHitThreshold = async (exchangeConfig, order, coinRecentPrice) => {
  try {
    const { TP_Threshold, SL_Threshold } = order;

    // In TRAILING_MODE, only sell if the asset's price hits SL
    if (TRAILING_MODE && coinRecentPrice >= TP_Threshold) {
      await changeOrderThresholds(order, coinRecentPrice);
    } else if (!TRAILING_MODE || coinRecentPrice <= SL_Threshold) {
      const sellData = await sell(exchangeConfig, order);
      await handleSellData(sellData, coinRecentPrice, order);
    }
  } catch (error) {
    throw `Error in handling price hitting threshold: ${error.body || JSON.stringify(error)}`;
  }
};

const handleSell = async (lastestPrice) => {
  const orders = await readPortfolio();
  if (orders.length) {
    const exchangeConfig = await getBinanceConfig();
    orders.forEach(async (order) => {
      try {
        const { symbol, TP_Threshold, SL_Threshold, quantity } = order;
        const { price: coinRecentPrice } = lastestPrice[symbol];

        if (coinRecentPrice >= TP_Threshold || coinRecentPrice <= SL_Threshold) {
          await handlePriceHitThreshold(exchangeConfig, order, coinRecentPrice);
        } else {
          console.log(
            `${returnTimeLog()} ${symbol} price hasn't hit SL or TP threshold, continue to wait...`
          );
        }
      } catch (error) {
        console.log(`${returnTimeLog()} Error in excuting sell function: ${JSON.stringify(error)}`);
      }
    });
  } else {
    console.log(`${returnTimeLog()} The portfolio is currently empty, wait for the chance to sell...`);
  }
};

const removeSymbolFromPortfolio = async (symbol) => {
  try {
    const orders = await readPortfolio();
    const updatedOrders = orders.filter((order) => order.symbol !== symbol);
    await savePortfolio(updatedOrders);
  } catch (error) {
    console.log(`${returnTimeLog()} Error in removing symbol from portfolio: ${error}`);
  }
};

module.exports = { handleSell, sell, handleSellData };
