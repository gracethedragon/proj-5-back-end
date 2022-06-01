import assert from "assert";

import { getStats } from "../operations/statistics.js";

const cpc = {
  ETH: {
    date: Date(),
    value: 1745.29,
  },

  BTC: {
    date: Date(),

    value: 1,
  },
};

describe("Statistics", () => {
  it("getStats of Three buy transactions", async () => {
    const transactionType = "BUY";
    const buy1 = {
      id: "1",
      network: "ETH",
      token:"ETH",
      createdAt: Date(),
      updatedAt: Date(),
      qty: 66,
      txValue: {
        date: new Date("May-23-2022 06:34:56").toUTCString(),
        value: 130066.2,
      },
      cuurentValue: {},

      hash: "0xf9e10f158459c93624f8b76b81649c4911d6abb846f89d68b59c3ff4a4163dd9",
      transactionType,
    };

    const buy2 = {
      id: "2",
      network: "ETH",
      token:"ETH",
      createdAt: Date(),
      updatedAt: Date(),
      qty: 54.54,
      txValue: {
        date: new Date("May-20-2022 07:56:03 PM").toUTCString(),
        value: 106728.24,
      },
      hash: "0x607e05812d36d29dde45585da542bbe546596f1a342d814e5496f8f951d8b59a",
      transactionType,
    };

    const buy3 = {
      id: "3",
      network: "ETH",
      token:"ETH",
      createdAt: Date(),
      updatedAt: Date(),
      qty: 80,

      txValue: {
        date: new Date("May-19-2022 11:37:49 PM").toUTCString(),
        value: 161422.4,
      },

      hash: "0x607e05812d36d29dde45585da542bbe546596f1a342d814e5496f8f951d8b59a",
      transactionType,
    };

    const stats = getStats([buy1, buy2, buy3], cpc);

    const { outlay, unrealrev, saleoutlay, actualrev, unrealgl, realgl } =
      stats;

    console.log(stats);

    assert.strictEqual(398216.84, Number(outlay.toFixed(2)));

    assert.strictEqual(350000.4566, unrealrev);
    assert.strictEqual(0, saleoutlay);
    assert.strictEqual(0, actualrev);
    assert.strictEqual(0, realgl);

    assert.strictEqual(-0.1378, Number(unrealgl.toFixed(4)));
  });

  it("getStats of 2 buy transactions and 1 sell", async () => {
    const buy1 = {
      id: "1",
      token: "ETH",
      network: "ETH",
      createdAt: Date(),
      updatedAt: Date(),
      qty: 66,
      txValue: {
        date: new Date("May-23-2022 06:34:56").toUTCString(),
        value: 130066.2,
      },
      cuurentValue: {},

      hash: "0xf9e10f158459c93624f8b76b81649c4911d6abb846f89d68b59c3ff4a4163dd9",
      transactionType: "BUY",
    };

    const buy2 = {
      id: "2",
      token: "ETH",
      network: "ETH",
      createdAt: Date(),
      updatedAt: Date(),
      qty: 54.54,
      txValue: {
        date: new Date("May-20-2022 07:56:03 PM").toUTCString(),
        value: 106728.24,
      },
      hash: "0x607e05812d36d29dde45585da542bbe546596f1a342d814e5496f8f951d8b59a",
      transactionType: "BUY",
    };

    const sell1 = {
      id: "3",
      network: "ETH",
      token: "ETH",
      createdAt: Date(),
      updatedAt: Date(),
      qty: 80,

      txValue: {
        date: new Date("May-19-2022 11:37:49 PM").toUTCString(),
        value: 161422.4,
      },

      hash: "0x607e05812d36d29dde45585da542bbe546596f1a342d814e5496f8f951d8b59a",
      transactionType: "SELL",
    };

    const stats = getStats([buy1, buy2, sell1], cpc);

    const { outlay, unrealrev, saleoutlay, actualrev, unrealgl, realgl } =
      stats;

    console.log(stats);

    assert.strictEqual(236794.44, Number(outlay.toFixed(2)));

    assert.strictEqual(210377.2566, unrealrev);

    assert.strictEqual(-0.1256, Number(unrealgl.toFixed(4)));

    assert.strictEqual(157155.7591, Number(saleoutlay.toFixed(4)));
    assert.strictEqual(0.0264, Number(realgl.toFixed(4)));
    assert.strictEqual(161422.4, actualrev);
  });
});
