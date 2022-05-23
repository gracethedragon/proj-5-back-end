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

app.post("/register-user", async (req, res) => {
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

app.get("/login-user", async (req, res) => {
  console.log(`[GET /login-user]`);
  const { username, password } = req.body;
  const data = await db.api.auth.getAuthToken({
    username,
    password,
  });
  console.log(data);
  const { authToken, msg } = data;

  if (authToken) {
    return res.status(200).json({ token: authToken });
  }

  res.status(404).json({ msg });
});

const CHAIN_NETWORK = "ethereum";
app.post("/track-transaction", async (req, res) => {
  console.log(`[POST /track-transaction]`);
  const { authToken, transactionType: type, transactionHash } = req.body;

  try {
    const [_, sub, __] = await db.api.auth.verifyToken(authToken);

    const txData = await axios.get(
      `https://api.blockchair.com/ethereum/dashboards/transaction/${transactionHash}`
    );

    const details = txData.data.data[transactionHash].transaction;
    const { value_usd, time } = details;

    const username = await db.api.auth.getUsernameOfUserId(sub);
    const trackedTransaction = await db.api.transaction.record({
      tracker: username,
      type,
      value: value_usd,
      date: time,
      transactionHash,
    });

    return res.sendStatus(200);
  } catch (err) {
    console.log(err);
    res.status(400).json(err);
  }
});

app.get("/all-transactions", async (req, res) => {
  console.log(`[get /all-transactions]`);

  try {
    const { authToken } = req.body;

    const [_, sub, __] = await db.api.auth.verifyToken(authToken);
    const username = await db.api.auth.getUsernameOfUserId(sub);

    const transactions =
      await db.api.transaction.getTransactionsOfUserWithStatistics({
        username,
      });

    res.status(200).json({ transactions });
  } catch (err) {}
});
export default app;
