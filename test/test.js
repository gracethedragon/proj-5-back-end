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
    const res = await request(app)
      .post("/track-transaction")
      .set("Accept", "application/json")
      .send({
        authToken,
        transactionType: "TRANSFER",
        transactionHash:
          "c2ef45cee6bf83f5caf0f9b6bf6542c25e551bc6b17fef889f4c44de0b0affc4",
      });

    assert.strictEqual(200, res.status);
  });
});
