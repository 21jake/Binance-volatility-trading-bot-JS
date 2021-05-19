const binance = require('../binance');
const { FIATS } = require('../constants');
const { writeFile } = require('fs').promises;
const { returnTimeLog } = require('./helpers');

const formatExchangeConfig = (data) => {
  let minimums = {};
  for (let obj of data.symbols) {
    if (obj.symbol.includes(process.env.PAIR_WITH) && !FIATS.includes(obj.symbol)) {
      let filters = { status: obj.status };
      for (let filter of obj.filters) {
        if (filter.filterType == 'MIN_NOTIONAL') {
          filters.minNotional = filter.minNotional;
        } else if (filter.filterType == 'PRICE_FILTER') {
          filters.minPrice = filter.minPrice;
          filters.maxPrice = filter.maxPrice;
          filters.tickSize = filter.tickSize;
        } else if (filter.filterType == 'LOT_SIZE') {
          filters.stepSize = filter.stepSize;
          filters.minQty = filter.minQty;
          filters.maxQty = filter.maxQty;
        }
      }
      filters.orderTypes = obj.orderTypes;
      filters.icebergAllowed = obj.icebergAllowed;
      minimums[obj.symbol] = filters;
    }
  }
  return minimums;
};

const getExchangeConfig = () => {
  return new Promise((resolve, reject) => {
    binance.exchangeInfo((err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

module.exports = (async () => {
  try {
    const data = await getExchangeConfig();
    const formatedData = formatExchangeConfig(data);
    await writeFile('exchange-config.json', JSON.stringify(formatedData, null, 4));
  } catch (error) {
    console.log(`${returnTimeLog()} Error in getting exchange config: ${error}`);
  }
})();
