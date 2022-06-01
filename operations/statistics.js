import axios from "axios";

import "../typings/typings.js";

// Config
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
 * @param {TransactionDBColumns}
 * @returns {Promise<PriceChecker>}
 */
export const CurrentPriceChecker = async (transactionDvs) => {
  const PriceChecker = {};

  for await (const { network } of transactionDvs) {
    const token = network;
    if (!PriceChecker[token]) {
      console.log(`[PriceChecker ] adding ${token}`);

      const response = await axios.get(`${coinmarketConfig.urls.prices}`, {
        headers: { "X-CMC_PRO_API_KEY": coinmarketConfig.key },
        params: { symbol: token, convert: "USD" },
      });

      const { data } = response;
      const { data: prices } = data;

      PriceChecker[token] = {
        value: prices[token][0]["quote"]["USD"].price,
        date: prices[token][0]["quote"]["USD"].last_updated,
      };
    }
  }

  console.log(`[PriceChecker]`);
  console.log(PriceChecker);

  return PriceChecker;
};

/**
 *
 * @param {Array<TransactionFE>} transactions
 * @param {PriceChecker} priceChecker
 * @returns
 */
export const getStats = (transactions, priceChecker) => {
  const coins = ((txs) => {
    const _coins = {};

    for (const { network } of txs) {
      if (!_coins[network]) {
        _coins[network] = {
          outlay: 0,
          qtyLeft: 0,
          qtySold: 0,
          actualrev: 0,
        };
      }
    }

    return _coins;
  })(transactions);

  for (const tx of transactions) {
    const { transactionType, network, txValue, qty } = tx;

    const coin = coins[network];

    if (transactionType === "BUY") {
      coin.qtyLeft += qty;
      coin.outlay += txValue.value;
    }
    if (transactionType === "SELL") {
      coin.qtySold += qty;

      coin.actualrev += txValue.value;
    }
  }

  console.log(`---outlay`);
  console.log(Object.entries(coins));

  const saleoutlay = Object.entries(coins).reduce(
    (sum, [_, { qtySold, qtyLeft, outlay }]) => {
      const avgBuyPrice = qtyLeft === 0 ? 0 : outlay / qtyLeft;
      return sum + avgBuyPrice * qtySold;
    },
    0
  );

  const outlay = Object.entries(coins).reduce((sum, [_, { outlay }]) => {
    return outlay + sum;
  }, 0);

  const unrealrev = Object.entries(coins).reduce((unr, [coin, { qtyLeft }]) => {
    return unr + priceChecker[coin].value * qtyLeft;
  }, 0);
  const actualrev = Object.entries(coins).reduce((s, [coin, { actualrev }]) => {
    return s + actualrev;
  }, 0);

  return {
    outlay,
    unrealrev,
    saleoutlay,
    unrealgl: unrealrev === 0 ? unrealrev : (unrealrev - outlay) / unrealrev,
    realgl: actualrev === 0 ? actualrev : (actualrev - saleoutlay) / actualrev,
    actualrev,
  };
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
 * @returns {TransactionFE}
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
    unitCostPrice,
  } = transactionDv;
  const currentValue = priceChecker[network];

  return {
    hash,
    qty: value,
    id,
    network,
    unitCostPrice,
    transactionType,
    txValue: { date, value: valueUSD },
    currentValue,
  };
};

/**
 * Exports
 */

/**
 *
 * @param {TransactionDBColumns} transactionDvs
 * @returns {TransactionView}
 */
export const getView = async (transactionDvs) => {
  console.log(`TransactionDBColumns`);
  console.log(transactionDvs);
  const priceChecker = await CurrentPriceChecker(transactionDvs);

  const transactions = transactionDvsToFrondEnd(transactionDvs, priceChecker);
  const stats = getStats(transactions, priceChecker);

  return { stats, transactions };
};

const getHashDatas = {
  eth: async (transactionHash) => {
    console.log(`[getHashDatas] eth`);

    const network = "ETH";

    try {
      const txData = await axios.get(
        `https://api.blockchair.com/ethereum/dashboards/transaction/${transactionHash}`
      );

      const details = txData.data.data[transactionHash].transaction;
      const { value_usd: valueUSD, time: date, value: qtyStr } = details;
      const qty = Number(qtyStr) / 1000000000000000000;

      return { valueUSD, value: qty, date, network, transactionHash };
    } catch (err) {
      console.log(`[getHashDatas] eth error`);
      return null;
    }
  },

  btc: async (transactionHash) => {
    console.log(`[getHashDatas] btc`);

    try {
      const txData = await axios.get(
        `https://api.blockchair.com/bitcoin/dashboards/transaction/${transactionHash}`
      );

      const details = txData.data.data[transactionHash].transaction;
      const {
        output_total_usd: valueUSD,
        time: date,
        output_total: qtyStr,
      } = details;
      const qty = Number(qtyStr) / 100000000;
      const network = "BTC";

      return { valueUSD, value: qty, date, network, transactionHash };
    } catch (err) {
      console.log(`[getHashDatas] btc error`);

      return null;
    }
  },
};

/**
 *
 * @param {TransactionHash} transactionHash
 * @returns {HashData}
 */
export const getHashData = async (transactionHash) => {
  console.log(`[getHashData]`);

  for await (const _getHashData of [getHashDatas.eth, getHashDatas.btc]) {
    const hashData = await _getHashData(transactionHash);
    if (hashData) {
      console.log(hashData);

      return hashData;
    }
  }
};
