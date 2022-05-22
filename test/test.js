import assert from "assert";

import request from "supertest";
import crypto from "crypto";
import app from "../express/index.js";
import { noop } from "mocha/lib/utils.js";

describe("Array", () => {
  describe("#indexOf()", () => {
    it("should return -1 when the value is not present", function () {
      assert.equal([1, 2, 3].indexOf(4), -1);
    });
  });
});

describe("GET /is-server-online", () => {
  it("should echo 200", (done) => {
    request(app)
      .get("/is-server-online")
      .set("Accept", "application/json")
      .expect(200, done);
  });
});

describe("GET /register-user", () => {
  const username = "user1" + crypto.randomUUID().toString().slice(0, 6);
  const password = "t";
  it("should register user", async () => {
    request(app)
      .post("/register-user")
      .set("Accept", "application/json")
      .send({ username, password, password2: password })
      .expect(200);
  });
});
