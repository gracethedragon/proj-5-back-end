import axios from "axios";

import "../typings/typings.js";

const coinmarketcapSandboxConfig = {
  urls: {
    prices:
      "https://sandbox-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest",
  },
  key: "b54bcf4d-1bca-4e8e-9a24-22ff2c3d462c",
};
const coinmarketcapDvlpConfig = {
  urls: {
    prices: "https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest",
  },
  key: "CAT-FISH-DOG", // this should be invalid
};

const coinmarketConfig = coinmarketcapSandboxConfig;

/**
 *
 * @returns {Promise<PriceChecker>}
 */
export const CurrentPriceChecker = async () => {
  const response = await axios.get(`${coinmarketConfig.urls.prices}`, {
    headers: { "X-CMC_PRO_API_KEY": coinmarketConfig.key },
    params: { symbol: "ETH", convert: "USD" },
  });
  const { data } = response;
  const { data: prices } = data;
  const ETH = {
    value: prices["ETH"][0]["quote"]["USD"].price,
    date: prices["ETH"][0]["quote"]["USD"].last_updated,
  };

  return {
    ETH,
  };
};

/**
 *
 * @param {Array<TransactionFE>} transactions
 * @param {PriceChecker} priceChecker
 * @returns
 */
const getStats = (transactions, priceChecker) => {
  const coins = {
    ETH: {
      avgBuyPrice: 0,
      qtyLeft: 0,
      qtySold: 0,
    },
  };

  for (const tx of transactions) {
    const { transactionType, network, txValue, qty } = tx;

    const coin = coins[network];

    if (transactionType === "BUY") {
      coin.qtyLeft += qty;
      coin.avgBuyPrice += (txValue.value - coin.avgBuyPrice) / coin.qtyLeft;
    }
  }
  console.log(`---outlay`);
  console.log(Object.entries(coins));

  const saleoutlay = Object.entries(coins).reduce(
    (outlay, [coin, { avgBuyPrice, qtySold }]) => {
      return (outlay += avgBuyPrice * qtySold);
    },
    0
  );

  const outlay = Object.entries(coins).reduce(
    (outlay, [coin, { avgBuyPrice, qtyLeft }]) => {
      return (outlay += avgBuyPrice * qtyLeft);
    },
    0
  );

  const unrealrev = Object.entries(coins).reduce((unr, [coin, { qtyLeft }]) => {
    return (unr += priceChecker[coin].value * qtyLeft);
  }, 0);

  const actualrev = 0;
  const realgl = 0;
  console.log(`---unrealrev`);
  console.log(`---${unrealrev}`);
  console.log(priceChecker);
  return {
    outlay,
    unrealrev,
    saleoutlay,
    unrealgl: (unrealrev - outlay) / unrealrev,
    realgl,
    actualrev,
  };
};

/**
 *
 * @param {TransactionDBColumns} transactionDvs
 * @returns {TransactionView}
 */
export const getView = async (transactionDvs) => {
  console.log(`TransactionDBColumns`);
  console.log(transactionDvs);
  const priceChecker = await CurrentPriceChecker();

  const transactions = transactionDvsToFrondEnd(transactionDvs, priceChecker);
  const stats = getStats(transactions, priceChecker);

  return { stats, transactions };
};

/**
 *
 * @param {*} transactionDvs
 * @param {*} priceChecker
 * @returns {Array<TransactionFE>} transactions
 */
const transactionDvsToFrondEnd = (transactionDvs, priceChecker) =>
  transactionDvs.map((dv) => transactionDvToFrondEnd(dv, priceChecker));

/**
 *
 * @param {TransactionDBColumns} transactionDv
 * @param {PriceChecker} priceChecker
 * @returns
 */
const transactionDvToFrondEnd = (transactionDv, priceChecker) => {
  const {
    transactionHash: hash,
    value,
    network,
    type: transactionType,
    date,
    id,
    valueUSD,
  } = transactionDv;
  const currentValue = priceChecker[network];

  return {
    hash,
    qty: value,
    id,
    network,
    transactionType,
    txValue: { date, value: valueUSD },
    currentValue,
  };
};

/**
 *
 * @param {TransactionHash} transactionHash
 * @returns {HashData}
 */
export const getHashData = async (transactionHash) => {
  const txData = await axios.get(
    `https://api.blockchair.com/ethereum/dashboards/transaction/${transactionHash}`
  );

  const details = txData.data.data[transactionHash].transaction;
  const { value_usd: valueUSD, time: date, value: qtyStr } = details;
  const qty = Number(qtyStr) / 1000000000000000000;
  const network = "ETH";

  return { valueUSD, value: qty, date, network, transactionHash };
};
