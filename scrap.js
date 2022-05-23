import axios from "axios";

const res = await axios.get(
  "https://api.blockchair.com/ethereum/dashboards/transaction/0x53285927aeb2594eaa5af6d9bd8560b4abcf7e6795ae40450496770d47e075ac"
);

const details =
  res.data.data[
    "0x53285927aeb2594eaa5af6d9bd8560b4abcf7e6795ae40450496770d47e075ac"
  ].transaction;

console.log(details.value_usd);
console.log(details.time);
