import axios from "axios";

// const res = await axios.get(
//   "https://api.blockchair.com/ethereum/dashboards/transaction/0x53285927aeb2594eaa5af6d9bd8560b4abcf7e6795ae40450496770d47e075ac"
// );

// const details =
//   res.data.data[
//     "0x53285927aeb2594eaa5af6d9bd8560b4abcf7e6795ae40450496770d47e075ac"
//   ].transaction;

// console.log(details.value_usd);
// console.log(details.time);

const params = new URLSearchParams({ foo: "bar" });

const coinmarketcapDvlpConfig = {
  urls: {
    prices: "https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest",
  },
  key: "32288ef2-77bd-4808-8e19-2015887e2738",
};

("https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?symbol=ETH&convert=USD");
try {
  const response = await axios.get(`${coinmarketcapDvlpConfig.urls.prices}`, {
    headers: { "X-CMC_PRO_API_KEY": coinmarketcapDvlpConfig.key },
    params: { symbol: "ETH", convert: "USD" },
  });

  console.log("aaa");

  console.log(response.data.data);
} catch (err) {
  console.log("err");
  console.log(err);
}
