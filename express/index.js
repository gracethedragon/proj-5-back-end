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
export const CurrentPriceChecker = async () => {
  const response = await axios.get(`${coinmarketConfig.urls.prices}`, {
    headers: { "X-CMC_PRO_API_KEY": coinmarketConfig.key },
    params: { symbol: "ETH", convert: "USD" },
  });
  const { data } = response;
  const { data: prices } = data;
  console.log(prices)
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

const transactionDvToFrondEnd = (transactionDv) => {
  console.log("txdvfe");
  console.log(transactionDv);
  const {
    transactionHash: hash,
    value,
    network,
    type: transactionType,
    date,
    id,
    valueUSD,
  } = transactionDv;

  return {
    hash,
    qty: value,
    id,
    network,
    transactionType,
    txValue: { date, value: valueUSD },
  };
};

const transactionDvsToFrondEnd = (transactionDvs, priceChecker) => {
  return transactionDvs.map((dv) => {
    const base = transactionDvToFrondEnd(dv);
    const currentValue = priceChecker[base.network];

    return { ...base, currentValue };
  });
};

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
  console.log(req.body)
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
    console.log(`[POST track-transaction] `)

    console.log(view)
    return res.status(200).json(view);
  } catch (err) {
    console.log(err);
    res.status(400).json(err);
  }
});


// TODO
app.delete("/transaction", (req)=> {

  // TODO MUST DELETE FROM VIEW ALSO
})


app.post("/add-view", (req)=> {

  // { token, transactionIds}

})



app.delete("/view", (req)=> {

  // { token, transactionId}

})

// TODO
app.get("/all-transactions", async (req, res) => {
  console.log(`[get /all-transactions]`);

  try {
    const { token, filterBy } = req.body;

    if(!["Network", "Date", undefined, null].includes(filterBy) ){

      return res.status(400).json({msg: "Invalid Filter Parameter"})

    }
    const [_, sub, __] = await db.api.auth.verifyToken(token);
    const username = await db.api.auth.getUsernameOfUserId(sub);
    // TODO// TODO// TODO// TODO
    const transactions =
      await db.api.transaction.getTransactionsOfUserWithStatistics({
        username, filterBy
      });

    res.status(200).json({ transactions });
  } catch (err) {}
});


app.get("/view-transaction", async (req, res) => {
  console.log(`Server [GET /view-transaction]`);
  const { authToken, dbtransactionId } = req.body;

  const [_, sub, __] = await db.api.auth.verifyToken(authToken);
  const username = await db.api.auth.getUsernameOfUserId(sub);

  if (!username) {
    return res.sendStatus(401);
  }

  try {
    const trackedTransaction = await db.api.transaction.getTransactionById(
      dbtransactionId
    );

    const { dataValues } = trackedTransaction;

    const view = await getView([dataValues]);

    return res.status(200).json(view);
  } catch (err) {
    res.sendStatus(500);
  }
});


export default app;
