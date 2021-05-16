const https = require('https');
require('./functions/getExchangeConfig');
const { handleBuy } = require('./functions/buy');
const { handleSell } = require('./functions/sell');
const getPrices = require('./functions/getPrices');
const { sleep, detectVolatiles } = require('./functions/helpers');

const app = https.createServer();
const intervalInMs = process.env.INTERVAL * 60000;

const main = async () => {
  try {
    const initialPrices = await getPrices();
    while (initialPrices['BTCUSDT'].time > new Date().getTime() - intervalInMs) {
      console.log('Wait for the bot to gather data to check price volatility...');
      await sleep(intervalInMs);
    }
    const lastestPrice = await getPrices();
    const volatiles = detectVolatiles(initialPrices, lastestPrice);
    await handleSell(lastestPrice);
    await handleBuy(volatiles);
  } catch (error) {
    console.log(`Error in excuting main function: ${error || JSON.stringify(error)}`);
  }
};

main();
setInterval(main, intervalInMs);

module.exports = app;
