import express from "express";
import cors from "cors";
import { dbConfig, systemConfig } from "../config/index.js";

import connectSequelize from "../database/connection/index.js";
import initDatabase from "../database/index.js";
import { getHashData } from "../operations/statistics.js";
import { getView } from "../operations/statistics.js";

import "../typings/typings.js";

const { ENVIRONMENT } = systemConfig;
const sequelize = connectSequelize(ENVIRONMENT, dbConfig);
const db = initDatabase(sequelize);

await db.wipe();
await db.seed();

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

app.get("/is-server-online", (_, res) => res.sendStatus(200));

const mw = {
  user: {
    register: async (req, res) => {
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
    },
    login: async (req, res) => {
      console.log(`[GET /login]`);
      const { email, password } = req.query;

      const data = await db.api.auth.getAuthToken({
        username: email,
        password,
      });

      const { authToken, msg, username: usernameInDb } = data;

      if (authToken) {
        return res
          .status(200)
          .json({ token: authToken, username: usernameInDb });
      }

      res.status(404).json({ msg });
    },
  },

  transaction: {
    all: async (req, res) => {
      console.log(`[get /all-transactions]`);

      try {
        const { token, filterBy } = req.body;

        // We enforce here instead of in the api
        if (!["Network", "Date", undefined, null].includes(filterBy)) {
          return res.status(400).json({ msg: "Invalid Filter Parameter" });
        }
        const [_, sub, __] = await db.api.auth.verifyToken(token);
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
    },
    delete: async (req, res) => {
      // TODO MUST DELETE FROM VIEW ALSO
      console.log(`Server [DELETE /transaction]`);
      console.log(req.body);
      const { token, dbtransactionId } = req.body;

      const [_, sub, __] = await db.api.auth.verifyToken(token);

      if (!sub) {
        return res.sendStatus(401);
      }

      const username = await db.api.auth.getUsernameOfUserId(sub);

      try {
        const removedTransactionCount =
          await db.api.transaction.deleteTransactionById(
            dbtransactionId,
            username
          );

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
    },
    track: async (req, res) => {
      console.log(`[POST /track-transaction]`);
      const { token, transactionType: type, transactionHash } = req.body;
      try {
        const [_, sub, __] = await db.api.auth.verifyToken(token);
        /** @type {Tracker} */
        const username = await db.api.auth.getUsernameOfUserId(sub);

        const hashData = await getHashData(transactionHash);

        const transactionToSubmit = {
          tracker: username,
          type,
          ...hashData,
        };

        const trackedTransaction = await db.api.transaction.record(
          transactionToSubmit
        );

        /** @type {TransactionDBColumns} */
        const dataValues = trackedTransaction.dataValues;

        const view = await getView([dataValues]);
        return res.status(200).json(view);
      } catch (err) {
        res.status(400).json(err);
      }
    },
    view: async (req, res) => {
      console.log(`Server [GET /view-transaction]`);
      console.log(req.body);
      const { token, dbtransactionId } = req.body;

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
    },
  },

  general: {
    unimplemented: async (req, res) => res.sendStatus(501),
  },
};

app.post("/register", mw.user.register);
app.get("/login", mw.user.login);

app.post("/track-transaction", mw.transaction.track);

app.get("/all-transactions", mw.transaction.all);
app.get("/view-transaction", mw.transaction.view);

app.delete("/transaction", mw.transaction.delete);

app.post("/add-view", mw.general.unimplemented);
app.delete("/view", mw.general.unimplemented);

export default app;
