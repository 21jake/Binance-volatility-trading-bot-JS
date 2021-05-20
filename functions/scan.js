const { readPortfolio, returnTimeLog, getBinanceConfig } = require('./helpers');
const { sell, handleSellData } = require('./sell');
const getPrices = require('./getPrices');

const safeScan = async () => {
  try {
    const portfolio = await readPortfolio();
    if (!portfolio.length) {
      console.log(
        `${returnTimeLog()} Scanning: Current portfolio is empty, waiting for asset(s) to be bought first...`
      );
    } else {
      for (const asset of portfolio) {
        const { symbol } = asset;
        const lastestAssetPrice = await getAssetPrice(symbol);
        await sellAssetIfHitSL(asset, lastestAssetPrice);
      }
    }
  } catch (error) {
    console.log(`${returnTimeLog()} Error in scanning ${error}`);
  }
};

const sellAssetIfHitSL = async (asset, lastestAssetPrice) => {
  try {
    const { SL_Threshold, symbol } = asset;
    if (lastestAssetPrice <= SL_Threshold) {
      const exchangeConfig = await getBinanceConfig();
      const sellData = await sell(exchangeConfig, asset);
      await handleSellData(sellData, lastestAssetPrice, asset);
      console.log(
        `${returnTimeLog()} ${symbol} price hasn hit SL threshold during this scan and the asset is sold`
      );
    } else {
      console.log(
        `${returnTimeLog()} ${symbol} price hasn't hit SL threshold during this scan and the asset is kept`
      );
    }
  } catch (error) {
    throw `Error in selling asset when it hits SL threshold:  ${error}`;
  }
};

const getAssetPrice = async (symbol) => {
  try {
    const lastestPrice = await getPrices();
    const assetPrice = lastestPrice[symbol].price;
    return assetPrice;
  } catch (error) {
    throw `Error in getting asset price: ${error}`;
  }
};

module.exports = safeScan;
