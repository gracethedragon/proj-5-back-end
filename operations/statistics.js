import axios from "axios";

import "../typings/typings.js";

import CoinGecko from "coingecko-api";
const CoinGeckoClient = new CoinGecko();

const idsOfToken = await [
  { id: "tether", symbol: "usdt", name: "Tether" },
  { id: "binancecoin", symbol: "bnb", name: "BNB" },
  { id: "bitcoin", symbol: "btc", name: "Bitcoin" },
  { id: "axie-infinity", symbol: "axs", name: "Axie Infinity" },
  { id: "uniswap", symbol: "uni", name: "Uniswap" },
  { id: "kucoin-shares", symbol: "kcs", name: "KuCoin" },
  { id: "the-sandbox", symbol: "sand", name: "The Sandbox" },
  { id: "decentraland", symbol: "mana", name: "Decentraland" },
  { id: "aave", symbol: "aave", name: "Aave" },
  { id: "frax", symbol: "frax", name: "Frax" },
  { id: "hex", symbol: "hex", name: "HEX" },
  { id: "huobi-btc", symbol: "hbtc", name: "Huobi BTC" },
  { id: "paxos-standard", symbol: "usdp", name: "Pax Dollar" },
  { id: "ethereum", symbol: "eth", name: "Ethereum" },
  { id: "fantom", symbol: "ftm", name: "Fantom" },
  { id: "usd-coin", symbol: "usdc", name: "USD Coin" },
  { id: "shiba-inu", symbol: "shib", name: "Shiba Inu" },
  { id: "crypto-com-chain", symbol: "cro", name: "Cronos" },
  { id: "matic-network", symbol: "matic", name: "Polygon" },
  { id: "chainlink", symbol: "link", name: "Chainlink" },
  { id: "okb", symbol: "okb", name: "OKB" },
  { id: "the-graph", symbol: "grt", name: "The Graph" },
  { id: "waves", symbol: "waves", name: "Waves" },
  { id: "true-usd", symbol: "tusd", name: "TrueUSD" },
  { id: "wrapped-bitcoin", symbol: "wbtc", name: "Wrapped Bitcoin" },
  { id: "dai", symbol: "dai", name: "Dai" },
].reduce(async (obj, { id, symbol }) => {
  const SYM = symbol.toUpperCase();
  return { ...(await obj), [SYM]: id };
}, {});

export const getGeckoUSDPrice = async (_date, token) => {
  console.log(`[getGeckoUSDPrice] ${_date} ${token} ${idsOfToken[token]}`);
  const date = new Date(_date).toLocaleDateString("es-CL").toString();
  // const date = _date

  // new Date('2022-06-02T17:50:59.311Z').toLocaleDateString("es-CL").toString()
  console.log(`[getGeckoUSDPrice] ${date} `);
  const data = await CoinGeckoClient.coins.fetchHistory(idsOfToken[token], {
    date,
  });
  console.log(data.success);

  return data?.data?.market_data?.current_price?.usd;
};

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
 * @param {TransactionDV}
 * @returns {Promise<PriceChecker>}
 */
export const CurrentPriceChecker = async (transactionDvs) => {
  console.log(`[cpc] transactionDvs`);

  console.log(transactionDvs);
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

  return {
    PriceChecker,
    getPrice: (token) => {
      if (!PriceChecker[token]) {
        console.log("Price Checker cannot get price");
      }
      return PriceChecker[token];
    },
  };
};

/**
 *
 * @param {Array<TransactionFE>} transactions
 * @param {PriceChecker} priceChecker
 * @returns
 */
export const getStats = (transactions, priceChecker) => {
  const tokens = ((txs) => {
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
    const { transactionType, token, txValue, qty } = tx;
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
      console.log(`  ${token}`);
      return unr + priceChecker.getPrice(token).value * qtyLeft;
    },
    0
  );
  const actualrev = Object.entries(tokens).reduce((s, [_, { actualrev }]) => {
    return s + actualrev;
  }, 0);

  const totalBoughtValue = transactions.reduce(
    (acc, { boughtValue }) => acc + boughtValue,
    0
  );
  const totalSoldValue = transactions.reduce(
    (acc, { soldValue }) => acc + soldValue,
    0
  );
  return {
    outlay,
    unrealrev,
    saleoutlay,
    unrealgl: unrealrev === 0 ? unrealrev : (unrealrev - outlay) / unrealrev,
    realgl: actualrev === 0 ? actualrev : (actualrev - saleoutlay) / actualrev,
    actualrev,
    totalSoldValue,
    totalBoughtValue,
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
 * @param {TransactionDV} transactionDv
 * @param {PriceChecker} priceChecker
 * @returns {TransactionFE}
 */
export const transactionDvToFrondEnd = (transactionDv, priceChecker) => {
  const {
    transactionHash: hash,
    value,
    network,
    token,
    type: transactionType,
    date,
    id,
    boughtDate: _boughtDate,
    boughtValue: _boughtValue,
    valueUSD,
    boughtUnitPrice: _boughtUnitPrice,
  } = transactionDv;

  console.log(`[transactionDbToFrontEnd]`);

  console.log({ valueUSD });
  const currentUnitPrice = priceChecker.getPrice(token);
  const qty = value;
  const currentValue = {
    date: currentUnitPrice.date,
    value: currentUnitPrice.value * qty,
  };
  const txValue = { date, value: valueUSD };

  const { boughtData, soldData } = ((_txType) => {
    if (_txType === "BUY") {
      const boughtData = [date, _boughtUnitPrice, _boughtValue];

      const sellPrice = priceChecker.getPrice(token);
      const soldData = [sellPrice.date, sellPrice.value, sellPrice.value * qty];

      return { boughtData, soldData };
    } else if (_txType === "SELL") {
      console.log([_boughtDate, _boughtUnitPrice, _boughtValue]);
      const boughtData = [_boughtDate, _boughtUnitPrice, _boughtValue];

      const soldData = [date, valueUSD / value, valueUSD];
      return { boughtData, soldData };
    }
  })(transactionType);

  const [boughtDate, boughtUnitPrice, boughtValue] = boughtData;
  const [soldDate, soldUnitPrice, soldValue] = soldData;

  const tx = {
    hash,
    token,
    soldValue,
    soldDate,
    soldUnitPrice,
    qty,
    id,
    network,
    boughtDate,
    boughtValue,
    boughtUnitPrice,
    transactionType,
    txValue,
    currentValue,
  };
  return tx;
};

/**
 * Exports
 */

/**
 *
 * @param {TransactionDV} transactionDvs
 * @returns {TransactionView}
 */
export const getView = async (transactionDvs) => {
  console.log(`TransactionDV`);
  const priceChecker = await CurrentPriceChecker(transactionDvs);

  const transactions = transactionDvsToFrondEnd(transactionDvs, priceChecker);
  const stats = getStats(transactions, priceChecker);

  return { stats, transactions };
};

const getHashDatas = {
  eth: async (transactionHash) => {
    console.log(`[getHashDatas] getHashData - eth network`);

    const network = "ETH";

    try {
      const txData = await axios.get(
        `https://api.blockchair.com/ethereum/dashboards/transaction/${transactionHash}?events=true&erc_20=true&erc_721=true&assets_in_usd=true&effects=true&trace_mempool=true`
      );

      const details = txData.data.data[transactionHash].transaction;
      const erc20 = txData.data.data[transactionHash].layer_2.erc_20;

      if (erc20.length === 0) {
        console.log(`[getHashDatas] getHashData - eth, layer 2 data not found`);

        console.log(details);
        const { value_usd, time: date, value: qtyStr } = details;
        const qty = Number(qtyStr) / 1000000000000000000;

        const token = network;
        const valueUSD = (await getGeckoUSDPrice(date, token)) * qty;

        return {
          valueUSD,
          value: qty,
          date,
          token,
          network,
          transactionHash,
        };
      } else {
        const { value_usd, time: date } = details;
        console.log(`[getHashDatas] getHashData - eth, layer 2 data found`);
        const firstErcLog = erc20[0];

        const { token_symbol: token, value_approximate: value } = firstErcLog;
        if (token === "") {
          return null;
        }
        const valueUSD = (await getGeckoUSDPrice(date, token)) * value;

        console.log({ valueUSD, date, token, network, transactionHash });

        if (valueUSD === 0) {
          console.warn(`[getHashDatas] getHashData - eth valueUSD missing`);
        }
        console.log(`${valueUSD}`);
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
      return hashData;
    }
  }

  return null;
};
