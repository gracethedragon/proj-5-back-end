import assert from "assert";

import request from "supertest";
import crypto from "crypto";
import app from "../express/index.js";
import { httpGetAllTransactions } from "../test-helpers/index.js";
import { getTokenResponseFns } from "../test-helpers/index.js";
const username = "user2" + crypto.randomUUID().toString().slice(0, 6);
const password = "tsasfs";

const [getTokenResponse, getToken] = getTokenResponseFns(
  app,
  username,
  password
);

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
      .send({ email: username, password, password2: password });

    assert.strictEqual(res.status, 200);
  });

  it("should login registered user", async () => {
    const res = await getTokenResponse();
    assert.strictEqual(res.status, 200);
  });

  it("Server should provision an access token", async () => {
    const res = await getTokenResponse();

    assert.strictEqual(200, res.status);

    const { body } = res;
    const { token } = body;

    assert.ok(!!body);
    assert.ok(!!token);
  });
});

describe("transactions", async () => {
  it("[001]Should be able to record a transaction ", async () => {
    const _res = await getTokenResponse();
    const token = _res.body.token;
    const usernameReceived = _res.body.username;
    assert(!!token);
    assert(usernameReceived, username);

    // Record 1 BTC transactions - START
    const resOfTransaction_Buy1 = await request(app)
      .post("/track-transaction")
      .set("Accept", "application/json")
      .send({
        token,
        transactionType: "BUY",
        transactionHash:
          "c2ef45cee6bf83f5caf0f9b6bf6542c25e551bc6b17fef889f4c44de0b0affc4",
      });

    assert.strictEqual(200, resOfTransaction_Buy1.status);
  }).timeout(0);

  it("[002] It should be able to get one transaction", async () => {
    const response = await httpGetAllTransactions(app, await getToken());

    assert.strictEqual(200, response.status);

    const { body } = response;
    const { transactions } = body;

    assert.strictEqual(1, transactions.length);
  });

  it("[003] Should add view with custom name", async () => {
    const token = await getToken();

    const response = await httpGetAllTransactions(app, token);

    const txId = response.body.transactions[0].id;
    const viewname = "view with custom name";
    const viewname2 = "view 22222";
    const newViewResponse = await request(app)
      .post("/new-view")
      .set("Accept", "application/json")
      .send({ token, transactionIds: [txId], viewname });

    await request(app)
      .post("/new-view")
      .set("Accept", "application/json")
      .send({ token, transactionIds: [txId], viewname: viewname2 });

    assert.strictEqual(200, newViewResponse.status);

    const { id: viewId } = newViewResponse.body;
    assert.notStrictEqual(undefined, viewId);
    assert.notStrictEqual(null, viewId);

    const allViewsResponse = await request(app)
      .get("/all-views")
      .set("Accept", "application/json")
      .query({ token });
    assert.strictEqual(200, allViewsResponse.status);

    assert.strictEqual(2, allViewsResponse.body.views.length);

    console.log(allViewsResponse.body.views);
    const firstViewIdOfUser = allViewsResponse.body.views[0].id;

    assert.notStrictEqual(null, firstViewIdOfUser);
    assert.notStrictEqual(undefined, firstViewIdOfUser);

    const getFirstViewResponse = await request(app)
      .get("/get-view")
      .set("Accept", "application/json")
      .query({ token, viewId: firstViewIdOfUser });
    assert.strictEqual(200, getFirstViewResponse.status);
    console.log(getFirstViewResponse.body);
    assert.strictEqual(1, getFirstViewResponse.body.view.transactions.length);
    assert.strictEqual(viewname, getFirstViewResponse.body.viewName);

    const getViewsOfTransaction = await request(app)
      .get("/get-views-of-transaction")
      .set("Accept", "application/json")
      .query({ transactionId: txId });

    assert.strictEqual(200, getViewsOfTransaction.status);
    assert.strictEqual(2, getViewsOfTransaction.body.viewInfo.length);
  });
});
