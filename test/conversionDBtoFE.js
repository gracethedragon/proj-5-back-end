import assert from "assert";

import request from "supertest";
import crypto from "crypto";
import app from "../express/index.js";
import { httpGetAllTransactions } from "../test-helpers/index.js";
import { getTokenResponseFns } from "../test-helpers/index.js";
import { transactionDvToFrondEnd } from "../operations/statistics.js";

const username = "user1-converter" + crypto.randomUUID().toString().slice(0, 6);
const password = "tss";

const [getTokenResponse, getToken] = getTokenResponseFns(
  app,
  username,
  password
);

/**
 *  value: number;
    date: Date;
    valueUSD: number;
    token: string;
    type: string;
    unitCostPrice: number;
    network: string;
 */

const transactionDateOfBuy1 = new Date("May-18-2022").toUTCString();

const USDatTimeOfTransaction = 1047.59;
/** @type {TransactionDBColumns} */
const buy1 = {
  id: 1,
  createdAt: Date(),
  updatedAt: Date(),
  transactionHash:
    "0x53285927aeb2594eaa5af6d9bd8560b4abcf7e6795ae40450496770d47e075ac",
  tracker: username,
  value: 0.5,
  date: transactionDateOfBuy1,
  valueUSD: USDatTimeOfTransaction,
  token: "ETH",
  type: "BUY",
  network: "ETH",
  unitCostPrice: 2095.17888479672,
};

const dateNow = Date();
const prices = {
  ETH: { value: 2000, date: dateNow },
};

const cpc = {
  ...prices,
  getPrice: (token) => prices[token],
};

describe("[mocha conversion]", async () => {
  it("should register user", async () => {
    const res = await request(app)
      .post("/register")
      .set("Accept", "application/json")
      .send({ email: username, password, password2: password });

    assert.strictEqual(res.status, 200);
  });

  it("should convert nicely", () => {
    const buy1FE = transactionDvToFrondEnd(buy1, cpc);

    assert.strictEqual(buy1FE.qty, 0.5);
    assert.strictEqual(buy1FE.boughtDate, transactionDateOfBuy1);
    assert.strictEqual(buy1FE.boughtValue, USDatTimeOfTransaction);
    assert.strictEqual(buy1FE.soldDate, dateNow);
    assert.strictEqual(buy1FE.soldValue, prices.ETH.value * buy1FE.qty);
  });
}).timeout(0);
