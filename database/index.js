import initModels from "./models/index.js";
import crypto from "crypto";
import { systemConfig } from "../config/index.js";
import jwt from "jsonwebtoken";
import axios from "axios";
import { Op } from "sequelize";

import { Sequelize } from "sequelize";

// HELPERS
const hashPassword = (plain) =>
  crypto
    .createHmac("sha256", systemConfig.DB_PASSWORD_HASH)
    .update(plain)
    .digest("hex");

const JWT_SECRET = crypto.randomBytes(256).toString("base64");

/**
 *
 * @typedef {Object} JWTPayload
 * @property {string} sub identification of user
 */

/**
 *
 * @param {JWTPayload} payload
 * @returns
 */
const newAuthToken = (payload) => {
  console.log(`[newAuthToken]`);

  const token = jwt.sign(payload, JWT_SECRET);

  return token;
};

// ------

const attachAuthApi = (User) => {
  /**
   *  Hi
   * @returns {Promise<[boolean,string,Error]>} return verification status and subject if verified
   */
  const verifyToken = (authToken) => {
    console.log(`[verifyToken] verifying ${authToken}`);
    return new Promise((resolve, reject) => {
      jwt.verify(authToken, JWT_SECRET, (err, decoded) => {
        if (err) {
          console.log(`[verifyToken] Error`);
          resolve([false, null, err]);
        } else {
          console.log(`[Verify Token Ok] ${decoded}`);
          resolve([true, decoded.sub, null]);
        }
      });
    });
  };

  const createUser = async (username, plainPassword) => {
    const user = await User.create({
      username,
      password: hashPassword(plainPassword),
    });

    return user;
  };

  const getUserByUsername = async (username) =>
    await User.findOne({ where: { username } });

  const getUsernameOfUserId = async (id) => {
    console.log(`[getUsernameOfUserId] id ${id}`);
    try {
      const user = await User.findOne({ where: { id } });

      return user.getDataValue("username");
    } catch (err) {
      return null;
    }
  };

  const isUserExistingByUsername = async (username) =>
    !!(await getUserByUsername(username));

  const registerUser = async ({ username, plainPassword, password2 }) => {
    const is = await isUserExistingByUsername(username);

    if (is) {
      return [null, "Username taken :("];
    }
    console.log("username taken");

    if (plainPassword !== password2) {
      return [null, "Confirmation password mismatch."];
    }
    if (!username) {
      return [null, "Username must have at least 1 character"];
    }
    if (!plainPassword || !password2) {
      return [null, "Password must have at least 1 character"];
    }

    const user = await createUser(username, plainPassword);

    const id = user.getDataValue("id");
    const createdUsername = user.getDataValue("username");

    console.log(
      `[registerUser] user created { id : ${id} , username: ${createdUsername} }`
    );

    return [id, `Registration Success: #${id} : ${createdUsername} `];
  };

  /**
   * Produce an authorization token recognizable by this server.
   * @param {Object} credentials
   * @returns
   */
  const getAuthToken = async ({ username, password: clearPassword }) => {
    if (!username) {
      return {
        authToken: null,
        msg: "User field should not be empty :(",
      };
    }
    const details = await getUserByUsername(username);
    if (!details) {
      return {
        authToken: null,
        msg: "User not found.",
      };
    }
    const passwordReceivedHashed = hashPassword(clearPassword);
    const passwordDatabaseHashed = details.getDataValue("password");

    const userId = details.getDataValue("id");
    const usernameInDb = details.getDataValue("username");
    const isMatch = passwordReceivedHashed === passwordDatabaseHashed;

    if (!isMatch) {
      return {
        authToken: null,
        msg: "Credentials mismatch.",
      };
    }

    const authToken = newAuthToken({ sub: userId });
    return { authToken, msg: "ok", username: usernameInDb };
  };
  const isVerifiedToken = async (authToken) => {
    const [is, sub] = await verifyToken(authToken);

    return is;
  };

  return {
    registerUser,
    getAuthToken,
    isVerifiedToken,
    getUsernameOfUserId,
    verifyToken,
  };
};

const mockAssetValueETH = 2000;

const getCurrentUSDPrice = async (network, production) => {
  if (!(production === true || production === false)) {
    throw new Error("Environment for conversion rate not found");
  }
  switch (network) {
    case "ETH":
      if (production === true) {
        return await axios.get(
          "https://api.blockchain.com/v3/exchange/tickers/ETH-USD"
        );
      }
      return mockAssetValueETH;

    default:
      throw new Error("Conversion rate not found");
  }
};
const getOutlayAndAssetPrice = async (transaction, production) => {
  try {
    const type = transaction.type;

    if (type === "BUY") {
      const { date, value } = transaction;
      const outlay = { date, value };
      const _value = await getCurrentUSDPrice("ETH", production);

      const gainValue = { value: _value, date: Date.now() };
      return [outlay, gainValue];
    } else if (type === "TRANSFER-IN") {
      const outlay = null;
      const value = await getCurrentUSDPrice("ETH", production);
      const gainValue = { value, date: Date.now() };

      return [outlay, gainValue];
    } else if (type === "SELL") {
      const outlay = null;

      const { date, value } = transaction;
      const gainPrice = { date, value };
      return [outlay, gainPrice];
    }
  } catch (err) {
    console.log(err);
    return [null, null];
  }
};

const attachedTransactionApi = (
  { User, TrackedTransaction },
  sequelize,
  { production }
) => {
  const record = async ({
    tracker,
    type,
    unitCostPrice,
    token,
    transactionHash,
    value,
    valueUSD,
    network,
    date,
  }) => {
    console.log(`[Transaction Add Record]`);
    return await TrackedTransaction.create({
      tracker,
      type,
      token,
      transactionHash,
      value,
      valueUSD,
      unitCostPrice,
      date,
      network,
    });
  };

  const TransactionFilterColumns = {
    network: "Network",
    date: "Date",
  };

  const getTxOfUserWithFilterFn = (username, column, params) => {
    console.log(`[getTxOfUserWithFilterFn] column ${column}`);
    console.log(`[getTxOfUserWithFilterFn] params ${params}`);
    if (!column) {
      return async () =>
        await TrackedTransaction.findAll({
          where: { tracker: username },
        });
    } else if (column === TransactionFilterColumns.network) {
      const networks = params;
      return async () =>
        await TrackedTransaction.findAll({
          where: { tracker: username, network: { [Op.in]: networks } },
        });
    } else if (column === TransactionFilterColumns.date) {
      const [from, to] = params;
      return async () =>
        await TrackedTransaction.findAll({
          where: { tracker: username, date: { [Op.between]: [from, to] } },
        });
    }
  };
  const getTransactionsOfUser = async (
    { username, filterBy },
    production = false
  ) => {
    console.log(
      `[getTransactionsOfUser] for username ${username} production ${production}`
    );

    const { column, parameters: _params } = filterBy;
    if (!["Network", "Date", undefined, null].includes(column)) {
      throw new Error("Invalid Filter Parameter");
    }
    console.log("filter---");
    console.log(typeof filterBy);
    console.log(filterBy);
    if (column === "Network") {
      console.log("Filter by Network");

      console.log(filterBy);
    }

    const params = Array.isArray(_params) ? _params : [_params];
    const txsFn = getTxOfUserWithFilterFn(username, column, params);
    const txs = await txsFn();
    const dvs = txs.map(({ dataValues }) => dataValues);

    return dvs;
  };

  const getTransactionsByIds = async ({ transactionIds }) => {
    console.log(`[getTransactionsByIds]`);
    console.log(transactionIds);

    const txs = await TrackedTransaction.findAll({
      where: { id: transactionIds },
    });

    console.log(txs);
    const dvs = txs.map(({ dataValues }) => dataValues);

    return dvs;
  };

  const getTransactionById = async (id) =>
    await TrackedTransaction.findOne({
      where: { id },
    });

  const deleteTransactionById = async (id, tracker) =>
    await TrackedTransaction.destroy({
      where: { id, tracker },
    });

  return {
    record,
    getTransactionsOfUser,
    deleteTransactionById,
    getTransactionById,
    getTransactionsByIds,
  };
};

const attachViewApi = ({ User, TrackedTransaction, View, ViewOwnership }) => {
  const create = async ({ owner, name }) => {
    console.log(`[db.ap.view.create] creating view`);
    try {
      const _name =
        name ?? owner + "-view-" + crypto.randomUUID().toString().slice(0, 6);
      const result = await ViewOwnership.create({ owner, name: _name });
      console.log(`[db.ap.view.create] created`);
      return result;
    } catch (err) {
      console.log(`[db.ap.view.create] err`);
      return null;
    }
  };

  const addTxsToView = async ({ viewId, transactionIds }) => {
    try {
      for await (const transactionId of transactionIds) {
        const viewedTx = await View.create({ viewId, transactionId });
        console.log(`[addTxsToView] viewedTx`);
        console.log(viewedTx);
      }

      return true;
    } catch (err) {
      console.log(`[addTxsToView]`);
      console.log(err);
      return false;
    }
  };

  const getViewIdsOfTransactionByTransactionId = async ({ transactionId }) => {
    return (
      await View.findAll({
        where: { transactionId },
        attributes: [
          [Sequelize.fn("DISTINCT", Sequelize.col("view_id")), "txViewId"],
        ],
      })
    ).map(({ dataValues }) => dataValues);
  };

  const getViewInfoByIds = async ({ viewIds }) => {
    return await ViewOwnership.findAll({
      where: {
        id: viewIds,
      },
    });
  };
  const getViewList = async ({ owner }) => {
    return (await ViewOwnership.findAll({ where: { owner } })).map(
      ({ dataValues }) => dataValues
    );
  };

  const getView = async ({ viewId }) => {
    return (await View.findAll({ viewId })).map(({ dataValues }) => dataValues);
  };

  const getViewNameById = async ({ viewId }) => {
    const viewOwnership = await ViewOwnership.findOne({
      where: { id: viewId },
    });

    return viewOwnership.dataValues.name;
  };

  const getTransactionIdsOfView = async ({ viewId }) => {
    const viewedTransactions = await getView({ viewId });

    return viewedTransactions.map(({ transactionId }) => transactionId);
  };

  const deleteViewById = async ({ id }) =>
    await ViewOwnership.destroy({ where: { id } });

  return {
    create,
    addTxsToView,
    getViewNameById,
    getViewList,
    getTransactionIdsOfView,
    getView,
    getViewInfoByIds,
    getViewIdsOfTransactionByTransactionId,
    deleteViewById,
  };
};
export const initDatabase = (sequelize, production = false) => {
  initModels(sequelize);

  const models = sequelize.models;
  const { user, trackedTransaction, viewOwnership, view } = models;

  if (
    ![user, trackedTransaction, viewOwnership, view].every(
      (model) => model !== undefined && model !== null
    )
  ) {
    throw new Error("Some models not initiated");
  }

  const auth = attachAuthApi(user);
  const transaction = attachedTransactionApi(
    { User: user, TrackedTransaction: trackedTransaction },
    sequelize,
    { production }
  );

  const viewApi = attachViewApi({
    User: user,
    TrackedTransaction: trackedTransaction,
    ViewOwnership: viewOwnership,
    View: view,
  });

  const wipe = async () => {
    for await (const model of [view, viewOwnership, trackedTransaction, user]) {
      await model.destroy({ where: {} });
    }
  };

  const seed = async (_ = { isRandom: true }) => {
    // TODO - move to test
    const password = "t";
    await auth.registerUser({
      username: "t",
      plainPassword: password,
      password2: password,
    });
  };

  return {
    sequelize,
    Sequelize: sequelize.Sequelize,
    DataTypes: sequelize.DataTypes,
    models,
    wipe,
    seed,
    api: {
      auth,
      transaction,

      view: viewApi,
    },
  };
};

export default initDatabase;
