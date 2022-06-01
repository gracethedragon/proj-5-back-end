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
  key: "32288ef2-77bd-4808-8e19-2015887e2738", // this should be invalid
};

const coinmarketConfig = coinmarketcapDvlpConfig;

/**
 * @param {TransactionDBColumns}
 * @returns {Promise<PriceChecker>}
 */
export const CurrentPriceChecker = async (transactionDvs) => {
  const PriceChecker = {};

  for await (const { token } of transactionDvs) {
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
  const tokens = ((txs) => {
    console.log(`[getStats ] making tokens`);
    console.log(txs);
    const _coins = {};

    for (const { token } of txs) {
      console.log(`[getState] token ${token}`);
      if (!_coins[token]) {
        _coins[token] = {
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
    const { transactionType, network, token, txValue, qty } = tx;

    const coin = tokens[token];

    if (transactionType === "BUY") {
      coin.qtyLeft += qty;
      coin.outlay += txValue.value;
    }
    if (transactionType === "SELL") {
      coin.qtySold += qty;

      coin.actualrev += txValue.value;
    }
  }

  console.log(`---tokens`);
  console.log(Object.entries(tokens));
  console.log(`---priceChecker`);
  console.log(priceChecker);
  const saleoutlay = Object.entries(tokens).reduce(
    (sum, [_, { qtySold, qtyLeft, outlay }]) => {
      const avgBuyPrice = qtyLeft === 0 ? 0 : outlay / qtyLeft;
      return sum + avgBuyPrice * qtySold;
    },
    0
  );

  const outlay = Object.entries(tokens).reduce((sum, [_, { outlay }]) => {
    return outlay + sum;
  }, 0);

  const unrealrev = Object.entries(tokens).reduce(
    (unr, [token, { qtyLeft }]) => {
      console.log(
        `  const unrealrev = Object.entries(tokens).reduce((unr, [token, { qtyLeft }]) => {`
      );
      console.log(`  ${token}`);
      return unr + priceChecker[token].value * qtyLeft;
    },
    0
  );
  const actualrev = Object.entries(tokens).reduce((s, [_, { actualrev }]) => {
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
    token,
    type: transactionType,
    date,
    id,
    valueUSD,
    unitCostPrice,
  } = transactionDv;
  const currentUnitPrice = priceChecker[token];
  const qty = value
  const currentValue = {date: currentUnitPrice.date, value: currentUnitPrice.value*qty }

  return {
    hash,
    token,
    qty,
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

const ACCEPTED_ERC20_TOKENS = ["BNB"];
const getHashDatas = {
  eth: async (transactionHash) => {
    console.log(`[getHashDatas] getHashData - eth`);

    const network = "ETH";

    try {
      console.log(`[getHashDatas] getHashData - eth, querying`);

      const txData = await axios.get(
        `https://api.blockchair.com/ethereum/dashboards/transaction/${transactionHash}?events=true&erc_20=true&erc_721=true&assets_in_usd=true&effects=true&trace_mempool=true`
      );

      console.log(`[getHashDatas] getHashData - eth, data received`);
      console.log(`txData.data.data`);
      console.log(txData.data.data);

      console.log(txData.data.data[transactionHash].transaction);

      console.log(`txData.data.data[transactionHash].layer_2`);
      console.log(txData.data.data[transactionHash].layer_2);
      const details = txData.data.data[transactionHash].transaction;
      const erc20 = txData.data.data[transactionHash].layer_2.erc_20;

      if (
        erc20.length === 0 ||
        !ACCEPTED_ERC20_TOKENS.includes(erc20[0].token_symbol)
      ) {
        console.log(`[getHashDatas] getHashData - eth, layer 2 data not found`);
        const { value_usd: valueUSD, time: date, value: qtyStr } = details;
        const qty = Number(qtyStr) / 1000000000000000000;

        return {
          valueUSD,
          value: qty,
          date,
          token: network,
          network,
          transactionHash,
        };
      } else {
        const { value_usd: valueUSD, time: date } = details;

        console.log(`[getHashDatas] getHashData - eth, layer 2 data found`);
        const firstErcLog = erc20[0];
        const { token_symbol: token, value_approximate: value } = firstErcLog;

        return { valueUSD, value, date, token, network, transactionHash };
      }
    } catch (err) {
      console.log(`[getHashDatas] eth error`);
      return null;
    }
  },

  btc: async (transactionHash) => {
    console.log(`[getHashDatas] getHashData - btc`);

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

      return {
        valueUSD,
        value: qty,
        date,
        token: network,
        network,
        transactionHash,
      };
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
  console.log(`[getHashData] ${transactionHash}`);

  for await (const _getHashData of [getHashDatas.eth, getHashDatas.btc]) {
    const hashData = await _getHashData(transactionHash);
    if (hashData) {
      console.log(hashData);

      return hashData;
    }
  }
};
