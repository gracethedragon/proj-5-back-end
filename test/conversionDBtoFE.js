import assert from "assert";

import request from "supertest";
import crypto from "crypto";
import app from "../express/index.js";
import { getTokenResponseFns, to2DecimalPlace } from "../test-helpers/index.js";
import { getStats, transactionDvToFrondEnd } from "../operations/statistics.js";

const username = "user1-converter" + crypto.randomUUID().toString().slice(0, 6);
const password = "tss";

const [getTokenResponse, getToken] = getTokenResponseFns(
  app,
  username,
  password
);

// MOCK

const Buy1_transactionDate = new Date("May-18-2022").toUTCString();
const Buy1_valueUSDatTimeOfTransaction = 1047.59;
/** @type {TransactionDV} */
const buy1DV = {
  id: 1,
  createdAt: Date(),
  updatedAt: Date(),
  transactionHash:
    "0x53285927aeb2594eaa5af6d9bd8560b4abcf7e6795ae40450496770d47e075ac",
  tracker: username,
  value: 0.5,
  date: Buy1_transactionDate,
  valueUSD: Buy1_valueUSDatTimeOfTransaction,
  token: "ETH",
  type: "BUY",
  network: "ETH",
  boughtUnitPrice: 2095.17888479672,
  boughtValue: Buy1_valueUSDatTimeOfTransaction,
};

const sell3_transactionDate = new Date("May-18-2022").toUTCString();

const sell3_boughtDate = new Date("20-Apr-2022").toUTCString();
const sell3_boughtUnitPrice = 0.00002;

const sell3_Qty = 15427798.31;

const sell3_UnitPriceAtTimeOfTx = 0.0000118133861354679;
const sell3_sellUnitPrice = sell3_UnitPriceAtTimeOfTx;
const sell3_valueUSDatTimeOfTransaction = sell3_sellUnitPrice * sell3_Qty;
const sell3_boughtValue = sell3_boughtUnitPrice * sell3_Qty;

/** @type {TransactionDV} */
const sell3DV = {
  id: 1,
  createdAt: Date(),
  updatedAt: Date(),
  transactionHash:
    "0x57bf07e61b2b8d48bb4a3a4a094e0d614e9a461e066d8146056aeb5a8adf7611",
  tracker: username,
  value: sell3_Qty,
  date: sell3_transactionDate,
  valueUSD: sell3_valueUSDatTimeOfTransaction,
  token: "SHIB",
  type: "SELL",
  network: "ETH",
  boughtUnitPrice: sell3_boughtUnitPrice,
  boughtDate: sell3_boughtDate,
  boughtValue: sell3_boughtValue,
};

const dateNow = Date();
const prices = {
  ETH: { value: 1827.09, date: dateNow },

  SHIB: { value: 0.09, date: dateNow },
};

const cpc = {
  ...prices,
  getPrice: (token) => prices[token],
};

describe("[mocha conversion DV to FE] Core (Wihout HTTP)", async () => {
  it("buy1DV should convert nicely", () => {
    const buy1FE = transactionDvToFrondEnd(buy1DV, cpc);

    assert.strictEqual(buy1FE.qty, 0.5);
    assert.strictEqual(buy1FE.boughtDate, Buy1_transactionDate);
    assert.strictEqual(buy1FE.boughtValue, Buy1_valueUSDatTimeOfTransaction);
    assert.strictEqual(buy1FE.soldDate, dateNow);
    assert.strictEqual(buy1FE.soldValue, prices.ETH.value * buy1FE.qty);
    assert.strictEqual(buy1FE.soldUnitPrice, prices.ETH.value);
  });

  it("sell3DV should convert nicely", () => {
    const sell3FE = transactionDvToFrondEnd(sell3DV, cpc);
    assert.strictEqual(sell3FE.qty, sell3_Qty);
    assert.strictEqual(sell3FE.boughtDate, sell3_boughtDate);
    assert.strictEqual(
      sell3FE.boughtValue,
      sell3_boughtValue,
      "bought value mismatch"
    );
    assert.strictEqual(sell3_transactionDate, sell3FE.soldDate);
    assert.strictEqual(sell3FE.soldValue, sell3DV.valueUSD);
    assert.strictEqual(sell3FE.soldUnitPrice, sell3DV.valueUSD / sell3DV.value);
  });

  it("viewOfBuy1and1Sell stats", () => {
    const buy1FE = transactionDvToFrondEnd(buy1DV, cpc);
    const sell3FE = transactionDvToFrondEnd(sell3DV, cpc);

    const { totalBoughtValue, totalSoldValue } = getStats(
      [buy1FE, sell3FE],
      cpc
    );

    assert.strictEqual(to2DecimalPlace(totalBoughtValue), 1356.15);
    assert.strictEqual(
      to2DecimalPlace(totalSoldValue),
      to2DecimalPlace(1095.799539)
    );
  });
}).timeout(0);

describe("", async () => {
  it("should register user", async () => {
    const res = await request(app)
      .post("/register")
      .set("Accept", "application/json")
      .send({ email: username, password, password2: password });

    assert.strictEqual(res.status, 200);
  });
});
