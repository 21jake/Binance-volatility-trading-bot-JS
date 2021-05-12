const express = require('express');
require('./getExchangeConfig');
const { buyVolatiles } = require('./buy');
const { handleSell } = require('./sell');
const getPrices = require('./getPrices');
const { sleep, detectVolatiles } = require('./helpers');
const binance = require('./binance');

const app = express();

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
    // buyVolatiles(['XRPUSDT', 'TRXUSDT']);
    buyVolatiles(volatiles);
  } catch (error) {
    console.log(`Error in excuting main function: ${error || JSON.stringify(error)}`);
  }
};

main();
setInterval(main, process.env.INTERVAL);

module.exports = app;
