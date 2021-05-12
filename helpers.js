const returnPercentageOfX = (x, percentage) => {
  return (percentage * x) / 100;
};
const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const intervalInMinutes = process.env.INTERVAL / 60000;

const detectVolatiles = (initialPrices, lastestPrices) => {
  const volatiles = [];
  for (const coin in initialPrices) {
    const changePercentage =
      ((lastestPrices[coin]['price'] - initialPrices[coin]['price']) / initialPrices[coin]['price']) * 100;
    if (changePercentage >= process.env.VOLATILE_TRIGGER) {
      const formatedChange = Number(changePercentage).toFixed(2);
      console.log(
        `The price of ${coin} has increased ${formatedChange}% within last ${intervalInMinutes} minutes...`
      );
      volatiles.push(coin);
    }
  }
  return volatiles;
};
module.exports = { returnPercentageOfX, sleep, detectVolatiles };
