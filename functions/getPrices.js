const { FIATS } = require('../constants');
const binance = require('../binance');

const getPrices = async () => {
  try {
    // const data = await binance.prices();
    let data = await binance.prices();
    const output = {};
    for (const coin in data) {
      if (coin.includes(process.env.PAIR_WITH) && !FIATS.includes(coin)) {
        output[coin] = {
          price: data[coin],
          time: new Date().getTime(),
        };
      }
    }
    // console.log(output, ' output');
    return output;
  } catch (error) {
    console.log(`There was an error getting prices: ${error.body || JSON.stringify(error)}`);
  }
};

module.exports = getPrices;
