"0xcbbf97a3376e30039c5784c5386a023550a8294275b7deabad06f0c219097660"; // binance hash
"https://api.etherscan.io/api?module=proxy&action=eth_getTransactionReceipt&txhash=0xcbbf97a3376e30039c5784c5386a023550a8294275b7deabad06f0c219097660&apikey=1WR3YZFJ4ZKSX2ZW52NI5WY6JKEP52HD7R";

const data = {
  jsonrpc: "2.0",
  id: 1,
  result: {
    blockHash:
      "0x22be0f9966672c6c28db306561dc98cae87a558cb73468c6c127ce6bca97224c",
    blockNumber: "0xe30876",
    contractAddress: null,
    cumulativeGasUsed: "0xeee87a",
    effectiveGasPrice: "0x826299e00",
    from: "0x3391ddec47ccb6f1916d10556c108de9275d882c",
    gasUsed: "0x76f6",
    logs: [
      {
        address: "0xb8c77482e45f1f44de1745f52c74426c631bdd52",
        topics: [
          "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
          "0x0000000000000000000000003391ddec47ccb6f1916d10556c108de9275d882c",
          "0x000000000000000000000000f60c2ea62edbfe808163751dd0d8693dcb30019c",
        ],
        data: "0x00000000000000000000000000000000000000000000000003067dd851090000",
        blockNumber: "0xe30876",
        transactionHash:
          "0xcbbf97a3376e30039c5784c5386a023550a8294275b7deabad06f0c219097660",
        transactionIndex: "0xee",
        blockHash:
          "0x22be0f9966672c6c28db306561dc98cae87a558cb73468c6c127ce6bca97224c",
        logIndex: "0x14e",
        removed: false,
      },
    ],
    logsBloom:
      "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040000000000000400000800000000000000000000000000000000000000008000000000000000000000000000000000000000000000000080004000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000800000000000800000000001000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000",
    status: "0x1",
    to: "0xb8c77482e45f1f44de1745f52c74426c631bdd52",
    transactionHash:
      "0xcbbf97a3376e30039c5784c5386a023550a8294275b7deabad06f0c219097660",
    transactionIndex: "0xee",
    type: "0x2",
  },
};

"https://api.etherscan.io/api?module=proxy&action=eth_call&to=0xb8c77482e45f1f44de1745f52c74426c631bdd52&data=0xddf252ad&tag=latest&apikey=YourApiKeyToken";