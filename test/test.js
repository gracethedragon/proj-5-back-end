import assert from "assert";

import request from "supertest";
import crypto from "crypto";
import app from "../express/index.js";

const username = "user1" + crypto.randomUUID().toString().slice(0, 6);
const password = "tss";

const gettokenResponse = async () => {
  const res = await request(app)
    .get("/login")
    .set("Accept", "application/json")
    .query({ email: username, password });

  return res;
};

const httpGetAllTransactions = async (app, token) =>
  await request(app)
    .get("/all-transactions")
    .set("Accept", "application/json")
    .send({
      token,
    });

describe("GET /is-server-online", () => {
  it("should echo 200", (done) => {
    request(app)
      .get("/is-server-online")
      .set("Accept", "application/json")
      .expect(200, done);
  });
});

describe("User Story 1+ ", async () => {
  it("should register user", async () => {
    const res = await request(app)
      .post("/register")
      .set("Accept", "application/json")
      .send({ username, password, password2: password });

    assert.strictEqual(res.status, 200);
  });

  it("should login registered user", async () => {
    const res = await gettokenResponse();
    assert.strictEqual(res.status, 200);
  });

  it("Server should provision an access token", async () => {
    const res = await gettokenResponse();

    assert.strictEqual(200, res.status);

    const { body } = res;
    const { token } = body;

    assert.ok(!!body);
    assert.ok(!!token);
  });
});

describe("some", async () => {
  it("[001]Should be able to record a transaction ", async () => {
    // Login

    const _res = await gettokenResponse();
    const token = _res.body.token;
    const usernameReceived = _res.body.username;
    assert(!!token);
    assert(usernameReceived, username);

    // Malformed Request
    const resOfMalformedRequest = await request(app)
      .post("/track-transaction")
      .set("Accept", "application/json")
      .send({
        token,
        transactionType: "asdfkusgadfasdf",
        transactionHash:
          "0x53285927aeb2594eaa5af6d9bd8560b4abcf7e6795ae40450496770d47e075ac",
      });

    // Record 3 transactions - START
    assert.strictEqual(400, resOfMalformedRequest.status);
    const resOfTransaction_Transfer = await request(app)
      .post("/track-transaction")
      .set("Accept", "application/json")
      .send({
        token,
        transactionType: "TRANSFER-IN",
        transactionHash:
          "0x53285927aeb2594eaa5af6d9bd8560b4abcf7e6795ae40450496770d47e075ac",
      });

    const resOfTransaction_Buy = await request(app)
      .post("/track-transaction")
      .set("Accept", "application/json")
      .send({
        token,
        transactionType: "BUY",
        transactionHash:
          "0x53285927aeb2594eaa5af6d9bd8560b4abcf7e6795ae40450496770d47e075ac",
      });

    const resOfTransaction_Sell = await request(app)
      .post("/track-transaction")
      .set("Accept", "application/json")
      .send({
        token,
        transactionType: "SELL",
        transactionHash:
          "0x53285927aeb2594eaa5af6d9bd8560b4abcf7e6795ae40450496770d47e075ac",
      });

    assert.strictEqual(200, resOfTransaction_Transfer.status);
    assert.strictEqual(200, resOfTransaction_Buy.status);
    assert.strictEqual(200, resOfTransaction_Sell.status);
    // Record 3 transactions - END

    await (async () => {
      assert.notStrictEqual(null, resOfTransaction_Buy.body.transactions);
      assert.notStrictEqual(undefined, resOfTransaction_Buy.body.transactions);
      const { transactions } = resOfTransaction_Buy.body;

      assert(Array.isArray(transactions));

      assert.strictEqual(1, transactions.length);

      const transaction = transactions[0];
      console.log(" -----[001] checkpoint 1 ");

      assert(!!transaction.id);

      const resOfTransaction_ViewBuy = await request(app)
        .get("/get-transaction")
        .set("Accept", "application/json")
        .send({
          token,
          dbtransactionId: transaction.id,
        });
      console.log(
        " -----[001] resOfTransaction_ViewBuy Should return status 200"
      );

      assert.strictEqual(200, resOfTransaction_ViewBuy.status);

      assert.strictEqual(
        "0x53285927aeb2594eaa5af6d9bd8560b4abcf7e6795ae40450496770d47e075ac",
        transaction.hash
      );
      assert.strictEqual(0.5, transaction.qty);

      assert.strictEqual("ETH", transaction.network);
      assert.strictEqual("BUY", transaction.transactionType);
      assert.notStrictEqual(null, transaction.txValue);
      assert.notStrictEqual(undefined, transaction.txValue);

      const { txValue } = transaction;
      console.log(txValue);
      assert.strictEqual(1045.678, Number(txValue.value.toFixed(3)));

      assert.notStrictEqual(null, transaction.currentValue);
      assert.notStrictEqual(undefined, transaction.currentValue);

      const { currentValue } = transaction;

      console.log(currentValue);

      const { stats } = resOfTransaction_Buy.body;

      assert.notStrictEqual(null, stats);
      assert.notStrictEqual(undefined, stats);

      assert.notStrictEqual(null, stats.outlay);
      assert.notStrictEqual(undefined, stats.outlay);
      assert.strictEqual(1045.678, Number(stats.outlay.toFixed(3)));
      assert.notStrictEqual(null, stats.unrealrev);
      assert.notStrictEqual(undefined, stats.unrealrev);
      assert(!Number.isNaN(Number(stats.unrealrev.toFixed(3))));
      assert.strictEqual(0, Number(stats.saleoutlay.toFixed(3)));
    })();

    /**
     * Get the transactions
     */

    const allTransactionsResponse = await httpGetAllTransactions(app, token);
    assert.strictEqual(200, allTransactionsResponse.status);

    await (async () => {
      const { transactions } = allTransactionsResponse.body;
      assert.strictEqual(3, transactions.length);

      const transactionBuyIdFromTrackedTransaction =
        resOfTransaction_Buy.body.transactions[0].id;
      const buyTransactionIdReceivedFromGetAllTransactions =
        transactions.filter(
          ({ id }) => id === transactionBuyIdFromTrackedTransaction
        )[0].id;
      assert.strictEqual(
        buyTransactionIdReceivedFromGetAllTransactions,
        transactionBuyIdFromTrackedTransaction
      );

      const viewBuyTransactionResponse = await request(app)
        .get("/get-transaction")
        .set("Accept", "application/json")
        .send({
          token,
          dbtransactionId: buyTransactionIdReceivedFromGetAllTransactions,
        });
      assert.strictEqual(200, viewBuyTransactionResponse.status);
      const deleteBuyTransactionResponse = await request(app)
        .delete("/transaction")
        .set("Accept", "application/json")
        .send({
          token,
          dbtransactionId: buyTransactionIdReceivedFromGetAllTransactions,
        });

      assert.strictEqual(200, deleteBuyTransactionResponse.status);

      const allTxCountAfterDeleteOne = (
        await httpGetAllTransactions(app, token)
      ).body.transactions.length;

      assert.strictEqual(2, allTxCountAfterDeleteOne);
    })();

    /** TODO
     */

    await (async () => {
      console.info("TODO - verify statistics");
    })();

    await (async () => {})();
  }).timeout(0);
});
