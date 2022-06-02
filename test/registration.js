import assert from "assert";

import request from "supertest";
import crypto from "crypto";
import app from "../express/index.js";
import { httpGetAllTransactions } from "../test-helpers/index.js";
import { getTokenResponseFns } from "../test-helpers/index.js";
const username = "user1" + crypto.randomUUID().toString().slice(0, 6);
const password = "tss";

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
    const { token, username: usernameReceived } = body;

    assert(!!token);
    assert(usernameReceived, username);

    assert.ok(!!body);
    assert.ok(!!token);
  });
});
