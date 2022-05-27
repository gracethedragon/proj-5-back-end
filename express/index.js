import express from "express";
import cors from "cors";
import { dbConfig, systemConfig } from "../config/index.js";
import axios from "axios";

import connectSequelize from "../database/connection/index.js";
import initDatabase from "../database/index.js";
const { ENVIRONMENT } = systemConfig;
const sequelize = connectSequelize(ENVIRONMENT, dbConfig);
const db = initDatabase(sequelize);

await db.wipe();
await db.seed();

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

/**
 *
 *  @typedef {Object} Value
 * @property {Date} date
 * @property {number} value in USD
 */

/**
 *
 * @typedef {Object} TransactionFE
 *  @property {string} hash
 *  @property {number} qty
 *  @property {number} id
 * @property  {string} network
 * @property  {string} transactionType
 * @property  {TxValue} txValue
 * @property  {Value} currentValue
 */

/**
 *
 * @typedef {Object} PriceChecker
 * @property {Value} ETH
 */

app.get("/is-server-online", (_, res) => res.sendStatus(200));

app.post("/register", async (req, res) => {
  const { username, password: plainPassword, password2 } = req.body;
  const [id, msg] = await db.api.auth.registerUser({
    username,
    plainPassword,
    password2,
  });

  if (id) {
    return res.sendStatus(200);
  }

  res.status(404).json({ msg });
});

app.get("/login", async (req, res) => {
  console.log(`[GET /login]`);
  const { email, password } = req.query;

  console.log({ email, password });

  const data = await db.api.auth.getAuthToken({
    username: email,
    password,
  });

  console.log(data);
  const { authToken, msg, username: usernameInDb } = data;

  if (authToken) {
    return res.status(200).json({ token: authToken, username: usernameInDb });
  }

  res.status(404).json({ msg });
});

const CHAIN_NETWORK = "ethereum";

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

const getHashData = async (transactionHash) => {
  const txData = await axios.get(
    `https://api.blockchair.com/ethereum/dashboards/transaction/${transactionHash}`
  );

  const details = txData.data.data[transactionHash].transaction;
  const { value_usd: valueUSD, time: date, value: qtyStr } = details;
  const qty = Number(qtyStr) / 1000000000000000000;
  const network = "ETH";

  return { valueUSD, value: qty, date, network, transactionHash };
};

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
 * @param {*} transactionDvs
 * @param {*} priceChecker
 * @returns {Array<TransactionFE>} transactions
 */
const transactionDvsToFrondEnd = (transactionDvs, priceChecker) =>
  transactionDvs.map((dv) => transactionDvToFrondEnd(dv, priceChecker));

/**
 *
 * @typedef {Object} Statistics
 * @property {number} outlay
 * @property {number} unrealrev
 * @property {number} saleoutlay
 * @property {number} unrealgl
 * @property {number} realgl
 * @property {number} actualrev
 */

/**
 *
 * @typedef {Object} TransactionView
 * @property {Statistics} stats
 * @property {Array<TransactionFE>} transactions
 */

/**
 *
 * @param {TransactionDBColumns} transactionDvs
 * @returns {TransactionView}
 */
const getView = async (transactionDvs) => {
  const priceChecker = await CurrentPriceChecker();

  const transactions = transactionDvsToFrondEnd(transactionDvs, priceChecker);
  const stats = getStats(transactions, priceChecker);

  return { stats, transactions };
};

/**
 * axios.get(url, { params: data }) => req.queries
 * axios.post(url, data ) => req.body
 */
app.post("/track-transaction", async (req, res) => {
  console.log(`[POST /track-transaction]`);
  const { token, transactionType: type, transactionHash } = req.body;
  console.log(req.body);
  try {
    const [_, sub, __] = await db.api.auth.verifyToken(token);
    const username = await db.api.auth.getUsernameOfUserId(sub);

    const hashData = await getHashData(transactionHash);

    const tx = {
      tracker: username,
      type,
      ...hashData,
    };

    const trackedTransaction = await db.api.transaction.record(tx);

    ///

    const { dataValues } = trackedTransaction;

    const view = await getView([dataValues]);
    console.log(`[POST track-transaction] `);

    console.log(view);
    return res.status(200).json(view);
  } catch (err) {
    console.log(err);
    res.status(400).json(err);
  }
});

app.post("/add-view", (req) => {
  // { token, transactionIds}
});

app.delete("/view", async (req, res) => {
  
  console.log(`Server [DELETE /view]`);
  console.log(req.body);
  const { token, dbtransactionId } = req.body;

  const [_, sub, __] = await db.api.auth.verifyToken(token);

  if (!sub) {
    return res.sendStatus(401);
  }

  const username = await db.api.auth.getUsernameOfUserId(sub);

  // try {
  //   const removedTransactionCount =
  //     await db.api.transaction.deleteTransactionById(dbtransactionId, username);

  //   if (removedTransactionCount === 1) {
  //     return res.sendStatus(200);
  //   }
  //   if (removedTransactionCount === 0) {
  //     return res.sendStatus(404);
  //   }
  //   throw new Error("Server route should only delete at most 1 entry.");
  // } catch (err) {
  //   console.log(err);
  //   res.sendStatus(500);
  // }
});

app.post("/new-view", (req, res)=>{
  const {token, transactionIds} = req.body
  const is = false
  if (is) {
    res.sendStatus(200)
  } else {
    res.sendStatus(400)
  }
})

app.get("/all-views", (req,res)=>{
  const {token} = req.query
  const view = {id: -1, viewname :'default', createdDate :new Date()}
  res.status(200).json({views:[view]})
})

//return TransactionView
app.get("/get-view", (req,res)=>{
  const {token, viewId} = req.query
  res.status(200).json({})
})

// TODO
app.get("/all-transactions", async (req, res) => {
  console.log(`[get /all-transactions]`);

  try {
    
    const { token, filterBy={} } = req.query;  
    const {column, parameters} = filterBy
    // date is a range, network can be > 1

    // We enforce here instead of in the api
    if (!["Network", "Date", undefined, null].includes(column)) {
      return res.status(400).json({ msg: "Invalid Filter Column" });
    }
    const [_, sub, __] = await db.api.auth.verifyToken(token);
    if (!sub) {
      return res.sendStatus(401)
    }
    const username = await db.api.auth.getUsernameOfUserId(sub);
    const transactions = await db.api.transaction.getTransactionsOfUser({
      username,
      filterBy,
    });

    console.log(`[get /all-transactions] transactions of Users`);

    console.log(transactions);

    const view = await getView(transactions);
    res.status(200).json(view);
  } catch (err) {
    console.log(err);

    res.sendStatus(501);
  }
});

app.get("/get-transaction", async (req, res) => {
  console.log(`Server [GET /get-transaction]`);
  console.log(req.body);
  const { token, dbtransactionId } = req.query;

  const [_, sub, __] = await db.api.auth.verifyToken(token);

  if (!sub) {
    return res.sendStatus(401);
  }

  const username = await db.api.auth.getUsernameOfUserId(sub);

  try {
    const trackedTransaction = await db.api.transaction.getTransactionById(
      dbtransactionId
    );

    const { dataValues } = trackedTransaction;

    if (username !== dataValues.tracker) {
      return res
        .status(403)
        .json({ msg: "Requestor is not tracker of transaction." });
    }

    const view = await getView([dataValues]);

    return res.status(200).json(view);
  } catch (err) {
    res.sendStatus(500);
  }
});

// TODO
app.delete("/transaction", async (req, res) => {
  // TODO MUST DELETE FROM VIEW ALSO
  console.log(`Server [DELETE /transaction]`);
  console.log(req.body);
  const { token, dbtransactionId } = req.query;

  const [_, sub, __] = await db.api.auth.verifyToken(token);

  if (!sub) {
    return res.sendStatus(401);
  }

  const username = await db.api.auth.getUsernameOfUserId(sub);

  try {
    const removedTransactionCount =
      await db.api.transaction.deleteTransactionById(dbtransactionId, username);

    if (removedTransactionCount === 1) {
      return res.sendStatus(200);
    }
    if (removedTransactionCount === 0) {
      return res.sendStatus(404);
    }
    throw new Error("Server route should only delete at most 1 entry.");
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

export default app;
