import CoinGecko from "coingecko-api";

import fs from "fs";

const CoinGeckoClient = new CoinGecko();

const some = await CoinGeckoClient.coins.fetchHistory("bitcoin", {
  date: "30-12-2017",
});

const coinl = await CoinGeckoClient.coins.list();

const idsOfToken_ = {};

for (const { symbol, id } of coinl.data) {
  const SYM = symbol.toUpperCase();
  idsOfToken_[SYM] = id;
}

const some2 = await CoinGeckoClient.coins.fetchHistory("ethereum", {
  date: "30-12-2017",
});

const some3 = await CoinGeckoClient.coins.fetchHistory("ethereum-wormhole", {
  date: "30-12-2017",
});

const data = await CoinGeckoClient.coins.fetchHistory("hex", {
  date: "15-05-2020",
});

console.log(data);
