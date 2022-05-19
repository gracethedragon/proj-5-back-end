import assert from "assert";

import request from "supertest";

import app from "../express/index.js";

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
