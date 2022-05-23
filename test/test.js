import assert from "assert";

import request from "supertest";
import crypto from "crypto";
import app from "../express/index.js";

const username = "user1" + crypto.randomUUID().toString().slice(0, 6);
const password = "tss";

const getAuthTokenResponse = async () => {
  const res = await request(app)
    .get("/login-user")
    .set("Accept", "application/json")
    .send({ username, password });

  console.log(res.body);
  return res;
};

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
      .post("/register-user")
      .set("Accept", "application/json")
      .send({ username, password, password2: password });

    assert.strictEqual(res.status, 200);
  });

  it("Server should provision an access token", async () => {
    const res = await getAuthTokenResponse();

    assert.strictEqual(200, res.status);

    const { body } = res;
    const { token } = body;

    assert.ok(!!body);
    assert.ok(!!token);
  });
});

describe("some", async () => {
  it("Should be able to record a transaction ", async () => {
    const _res = await getAuthTokenResponse();
    const authToken = _res.body.token;
    assert(!!authToken);

    const resOfMalformedRequest = await request(app)
      .post("/track-transaction")
      .set("Accept", "application/json")
      .send({
        authToken,
        transactionType: "asdfkusgadfasdf",
        transactionHash:
          "0x53285927aeb2594eaa5af6d9bd8560b4abcf7e6795ae40450496770d47e075ac",
      });

    assert.strictEqual(400, resOfMalformedRequest.status);
    const resOfTransaction_Transfer = await request(app)
      .post("/track-transaction")
      .set("Accept", "application/json")
      .send({
        authToken,
        transactionType: "TRANSFER-IN",
        transactionHash:
          "0x53285927aeb2594eaa5af6d9bd8560b4abcf7e6795ae40450496770d47e075ac",
      });

    assert.strictEqual(200, resOfTransaction_Transfer.status);

    const resOfTransaction_Buy = await request(app)
      .post("/track-transaction")
      .set("Accept", "application/json")
      .send({
        authToken,
        transactionType: "BUY",
        transactionHash:
          "0x53285927aeb2594eaa5af6d9bd8560b4abcf7e6795ae40450496770d47e075ac",
      });

    assert.strictEqual(200, resOfTransaction_Buy.status);

    const resOfTransaction_Sell = await request(app)
      .post("/track-transaction")
      .set("Accept", "application/json")
      .send({
        authToken,
        transactionType: "SELL",
        transactionHash:
          "0x53285927aeb2594eaa5af6d9bd8560b4abcf7e6795ae40450496770d47e075ac",
      });

    assert.strictEqual(200, resOfTransaction_Sell.status);

    const getAllTransactionResponse = await request(app)
      .get("/all-transactions")
      .set("Accept", "application/json")
      .send({
        authToken,
      });

    assert.strictEqual(200, getAllTransactionResponse.status);

    const { transactions } = getAllTransactionResponse.body;

    assert.strictEqual(3, transactions.length);

    const totalOutLay = transactions.reduce((sum, tx) => {
      console.log(tx);
      try {
        const value = tx?.outlayUSD?.value ?? 0;
        return sum + value;
      } catch (err) {
        return sum;
      }
    }, 0);

    const totalAssetPrice = transactions.reduce((sum, tx) => {
      console.log(tx);
      try {
        const value = tx?.gainValueUSD?.value ?? 0;
        return sum + value;
      } catch (err) {
        return sum;
      }
    }, 0);

    assert.strictEqual(1045.68, Number(totalOutLay.toFixed(2)));
    assert.strictEqual(5045.68, Number(totalAssetPrice.toFixed(2)));
  }).timeout(0);
});
