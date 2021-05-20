const https = require('https');
require('./functions/getExchangeConfig');
const { handleBuy } = require('./functions/buy');
const { handleSell } = require('./functions/sell');
const getPrices = require('./functions/getPrices');
const { sleep, detectVolatiles, returnTimeLog } = require('./functions/helpers');
const safeScan = require('./functions/scan');
const { SAFE_MODE } = require('./constants');

const app = https.createServer();

const { INTERVAL, SCAN_INTERVAL } = process.env;
const intervalInMs = INTERVAL * 60000;
const scanIntervalInMs = SCAN_INTERVAL * 60000;

const main = async () => {
  try {
    const initialPrices = await getPrices();
    while (initialPrices['BTCUSDT'].time > new Date().getTime() - intervalInMs) {
      console.log(`${returnTimeLog()} Wait for the bot to gather data to check price volatility...`);
      await sleep(intervalInMs);
    }
    const lastestPrice = await getPrices();
    const volatiles = detectVolatiles(initialPrices, lastestPrice);
    await handleSell(lastestPrice);
    await handleBuy(volatiles);
  } catch (error) {
    console.log(`${returnTimeLog()} Error in excuting main function: ${error || JSON.stringify(error)}`);
  }
};

main();
setInterval(main, intervalInMs);

if (SAFE_MODE) {
  setInterval(safeScan, scanIntervalInMs);
}

module.exports = app;
