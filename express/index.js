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

          const filterBy = JSON.parse(_filterByStr ? _filterByStr : "{}");

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
      get_: async (req, res) => {
        const { token, viewId } = req.query;
        const [_, sub, __] = await db.api.auth.verifyToken(token);
        if (!sub) {
          return res.sendStatus(401);
        }

        // TODO Security Check: Only view owner can retrieve view

        try {
          const transactionIds = await db.api.view.getTransactionIdsOfView({
            viewId,
          });

          console.log(`[GET /get-view] transactionIds`);

          console.log(transactionIds);

          const transactions = await db.api.transaction.getTransactionsByIds({
            transactionIds,
          });
          console.log(transactions);

          const view = await getView(transactions);

          return res.status(200).json({ view, viewId });
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
        const { token, transactionIds } = req.body;

        console.log({ token, transactionIds });

        const [_, sub, __] = await db.api.auth.verifyToken(token);
        if (!sub) {
          return res.sendStatus(401);
        }
        const username = await db.api.auth.getUsernameOfUserId(sub);

        try {
          const view = await db.api.view.create({ owner: username });

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

<<<<<<< HEAD
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
=======
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
>>>>>>> c992b60d830a49998a8a64550e325832a06c604c

export default app;
