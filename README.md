# Binance-volatility-trading-bot-JS

I take the idea from <a href="https://github.com/CyberPunkMetalHead/Binance-volatility-trading-bot"> this project</a>. The original bot is written in Python. I quite like it so I re-write it in Java Script to fix some issues and add some improvements. Shoutout to <a href="https://github.com/CyberPunkMetalHead"> CyberPunkMetalHead</a> for such an awesome contribution

Here's the main functions of the bot:

1. Listen to the prices on Binance for every interval of 4 minutes.
2. Figure out which coin's price has increase by 3% in each interval and proceed to buy.
3. Track the bought assets' prices every interval, sell at 6% profit or 3% stop loss.

All the of the variables: Budget, Interval, Take profit or Stop loss thresholds, The change in price to trigger the buy function... are configurable by the user

# Notes

1. Create a config.env file in the root folder and place your configurations there. <b>For the love of God don't expose this file since it contains your API keys</b>.
2. If you set the budget (QUANTITY) of 50 USDT, the bot will not spend more than 50 USDT on trading (It checks the current portfolio first before making the purchase decision).
3. If the inital QUANTITY is 50 USDT and there are 2 coins to buy in that interval, the bot allocates 25 USDT for each coin order.
4. If the inital QUANTITY is 50 USDT and there is one asset worths 30 USDT in the portfolio, the bot will spend 20 USDT for following orders.
5. The bot is default to sell 99.5% of the bought amount. The reason is sometimes you can't sell 100% of an asset on Binance. If you have some BNBs to pay for transactions then you can set the 99.5% ratio to 100%. This is configurable.
6. Generally, you better place an order with at least 11 USDT to be accepted by Binance.

# Installation

1. Requirements:
<ul>
    <li>
        <a href="https://nodejs.org/en/download/">Node JS</a>
    </li>
</ul>

2. Download the project <a href="https://github.com/21jake/Binance-volatility-trading-bot-JS.git">here</a>
3. Open the terminal at the root folder, run

   > npm install

   to install necessary packages

4. Create a new config.env file based on the config.env.example file at the root folder. Place your configurations there. <b>Again, whoever has this file can place orders from your account</b>
   <br/>
   To retrieve your Binance API Key and Secret on both Testnet and Mainnet, I find no better guide than this one over <a href="https://www.cryptomaton.org/2021/05/08/how-to-code-a-binance-trading-bot-that-detects-the-most-volatile-coins-on-binance/">here</a>

5. The bot is default to run on the Testnet. If you want to switch to Mainnet, set the TEST_MODE constant (in the binance.js file) to false

   > const TEST_MODE = false;

6. Finally, to start the script, open your terminal and run

   > npm run start

7. To stop the bot, hit Ctrl + C combination in the terminal

# Contribution

If you run into some issues or have some suggestions, feel free to open an issue at the project's repo. I would be more than happy to read/approve some pull requests :).
