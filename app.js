const https = require('https');
require('./functions/getExchangeConfig');
const { handleBuy } = require('./functions/buy');
const { handleSell } = require('./functions/sell');
const getPrices = require('./functions/getPrices');
const { sleep, detectVolatiles } = require('./functions/helpers');

const app = https.createServer();

const main = async () => {
  try {
    const initialPrices = await getPrices();
    while (initialPrices['BTCUSDT'].time > new Date().getTime() - process.env.INTERVAL) {
      console.log('Not enough time has passed, please wait...');
      await sleep(process.env.INTERVAL);
    }
    const lastestPrice = await getPrices();
    const volatiles = detectVolatiles(initialPrices, lastestPrice);

    await handleSell(lastestPrice);
    handleBuy(volatiles);
  } catch (error) {
    console.log(`Error in excuting main function: ${error || JSON.stringify(error)}`);
  }
};

main();
setInterval(main, process.env.INTERVAL);

module.exports = app;
// handleBuy(['XRPUSDT', 'TRXUSDT']);
