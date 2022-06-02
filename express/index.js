import express from "express";
import cors from "cors";
import { dbConfig, systemConfig } from "../config/index.js";

import connectSequelize from "../database/connection/index.js";
import initDatabase from "../database/index.js";
import { getHashData, getGeckoUSDPrice } from "../operations/statistics.js";
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

const mw = ((db) => {
  return {
    user: {
      register: async (req, res) => {
        const {
          email: username,
          password: plainPassword,
          password2,
        } = req.body;
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
          const { token, filterBy: _filterByStr } = req.query;

          const [_, sub, __] = await db.api.auth.verifyToken(token);
          const username = await db.api.auth.getUsernameOfUserId(sub);
          console.log(_filterByStr);
          const filterBy = ((_filterByStr) => {
            try {
              return JSON.parse(_filterByStr ? _filterByStr : "{}");
            } catch {
              return _filterByStr;
            }
          })(_filterByStr);

          try {
            const transactions = await db.api.transaction.getTransactionsOfUser(
              {
                username,
                filterBy,
              }
            );

            console.log(
              `[get /all-transactions] transactions of Users Retrieved`
            );

            console.log(transactions);

            const view = await getView(transactions);
            return res.status(200).json(view);
          } catch (err) {
            console.log(
              `[get /all-transactions] transactions of Users Retrieval Error`
            );
            console.log(err);
            return res.status(400).json({ msg: err });
          }
        } catch (err) {
          console.log(err);

          res.sendStatus(501);
        }
      },
      delete: async (req, res) => {
        console.log(`Server [DELETE /transaction]`);

        const { token, dbtransactionId } = req.query;

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
        const {
          token,
          transactionType: type,
          transactionHash,
          boughtDate,
        } = req.body;

        console.log(`req.body`);
        console.log(req.body);
        try {
          const [_, sub, __] = await db.api.auth.verifyToken(token);
          /** @type {Tracker} */
          const username = await db.api.auth.getUsernameOfUserId(sub);
          const hashData = await getHashData(transactionHash);
          if (!hashData) {
            return res
              .status(400)
              .sendStatus({ msg: "insufficient hash data" });
          }
          const boughtData = await (async (_type) => {
            if (_type === "BUY") {
              let _boughtDate = hashData.date;

              const boughtUnitPrice = await getGeckoUSDPrice(
                _boughtDate,
                hashData.token
              );

              if (!boughtUnitPrice) {
                throw Error("No bought unit price found for buy transaction");
              }
              return {
                boughtDate: _boughtDate,
                boughtValue: boughtUnitPrice * hashData.value,
                boughtUnitPrice,
              };
            } else if (_type === "SELL") {
              const boughtUnitPrice = await getGeckoUSDPrice(
                boughtDate,
                hashData.token
              );

              if (!boughtUnitPrice) {
                throw Error("No bought unit price found for sell transaction");
              }
              return {
                boughtDate,
                boughtUnitPrice,
                boughtValue: boughtUnitPrice * hashData.value,
              };
            }
          })(type);

          if (hashData.valueUSD === 0 || !hashData.valueUSD) {
            console.warn("valueUSD missing");
          }
          const transactionToSubmit = {
            tracker: username,
            type,
            ...hashData,
            ...boughtData,
          };
          console.log(`[transactionToSubmit]`);
          console.log(transactionToSubmit);
          const trackedTransaction = await db.api.transaction.record(
            transactionToSubmit
          );

          /** @type {TransactionDV} */
          const dataValues = trackedTransaction.dataValues;

          const view = await getView([dataValues]);
          return res.status(200).json(view);
        } catch (err) {
          console.log(err);
          res.status(400).json(err);
        }
      },
      get_: async (req, res) => {
        console.log(`Server [GET /get-transaction]`);
        console.log(req.query);
        const { token, dbtransactionId } = req.query;
        const [_, sub, __] = await db.api.auth.verifyToken(token);
        if (!sub) {
          return res.sendStatus(401);
        }
        const username = await db.api.auth.getUsernameOfUserId(sub);

        try {
          const trackedTransaction =
            await db.api.transaction.getTransactionById(dbtransactionId);

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

    view: {
      rename: async (req, res) => {
        console.log(`[rename View]`);

        const { token, viewId, viewname: viewName } = req.body;

        try {
          const renamedViewMeta = await db.api.view.rename({
            viewId,
            viewName,
          });

          res.status(200).send({ renamedViewMeta });
        } catch (err) {
          res.sendStatus(501);
        }
      },
      getOfTransactions: async (req, res) => {
        console.log(`[getOfTransactions]`);
        const { token, transactionId } = req.query;
        try {
          const views =
            await db.api.view.getViewIdsOfTransactionByTransactionId({
              transactionId,
            });

          const viewIds = views.map((view) => view.txViewId);

          console.log(`[getOfTransactions] viewIds`);
          console.log(viewIds);

          const viewInfo = await db.api.view.getViewInfoByIds({
            viewIds,
          });

          console.log(viewInfo);
          res
            .status(200)
            .json({ viewInfo: viewInfo.map(({ id, name }) => ({ id, name })) });
        } catch (err) {
          console.log(err);
          return res.sendStatus(500);
        }
      },

      get_: async (req, res) => {
        const { token, viewId } = req.query;
        const [_, sub, __] = await db.api.auth.verifyToken(token);
        if (!sub) {
          return res.sendStatus(401);
        }

        try {
          const transactionIds = await db.api.view.getTransactionIdsOfView({
            viewId,
          });
          const viewName = await db.api.view.getViewNameById({ viewId });
          console.log(`[GET /get-?] transactionIds`);

          console.log(transactionIds);

          const transactions = await db.api.transaction.getTransactionsByIds({
            transactionIds,
          });
          console.log(transactions);

          const view = await getView(transactions);

          return res.status(200).json({ view, viewId, viewName });
        } catch (err) {
          return res.sendStatus(501);
        }
      },
      getAll: async (req, res) => {
        const { token } = req.query;
        const [_, sub, __] = await db.api.auth.verifyToken(token);
        if (!sub) {
          return res.sendStatus(401);
        }
        const username = await db.api.auth.getUsernameOfUserId(sub);

        try {
          const viewsOfUser = await db.api.view.getViewList({
            owner: username,
          });

          console.log(`[viewsOfUser]`);

          console.log(viewsOfUser);

          const viewFEs = viewsOfUser.map(
            ({ id, name: viewname, createdAt: createdDate }) => {
              return { id, viewname, createdDate };
            }
          );
          res.status(200).json({ views: viewFEs });
        } catch (err) {
          console.log(`[GET /all-views] error`);
          console.log(err);
          res.sendStatus(400);
        }
      },

      delete: async (req, res) => {
        console.log(`Server [DELETE /view]`);
        console.log(req.query);
        const { token, viewId } = req.query;

        const [_, sub, __] = await db.api.auth.verifyToken(token);

        if (!sub) {
          return res.sendStatus(401);
        }

        try {
          const removed = await db.api.view.deleteViewById({ id: viewId });
          if (removed === 1) {
            return res.sendStatus(200);
          }
          if (removed === 0) {
            return res.sendStatus(404);
          }
          throw new Error("Server route should only delete at most 1 entry.");
        } catch (err) {
          console.log(err);
          res.sendStatus(500);
        }
      },
      new_: async (req, res) => {
        console.log(`[POST /new-view]`);
        const { token, transactionIds, viewname: name } = req.body;

        console.log({ token, transactionIds });

        const [_, sub, __] = await db.api.auth.verifyToken(token);
        if (!sub) {
          return res.sendStatus(401);
        }
        const username = await db.api.auth.getUsernameOfUserId(sub);

        try {
          const view = await db.api.view.create({ owner: username, name });

          const { id: viewId } = view?.dataValues;

          await db.api.view.addTxsToView({ viewId, transactionIds });

          res.status(200).json({ id: viewId });
        } catch (err) {
          res.sendStatus(400);
        }
      },
    },
  };
})(db);

app.post("/register", mw.user.register);
app.get("/login", mw.user.login);

app.post("/track-transaction", mw.transaction.track);

app.get("/all-transactions", mw.transaction.all);
app.get("/get-transaction", mw.transaction.get_);

app.delete("/transaction", mw.transaction.delete);

app.delete("/view", mw.view.delete);

app.post("/new-view", mw.view.new_);
app.get("/all-views", mw.view.getAll);
app.get("/get-view", mw.view.get_);

app.get("/get-views-of-transaction", mw.view.getOfTransactions);

// TODO
app.post("/rename-view", mw.view.rename);

export default app;
