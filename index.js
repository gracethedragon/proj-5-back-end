import http from "http";

import config from "./config/index.js";
import server from "./express/index.js";

import app from "./express/index.js";

const server = http.createServer(app);

const SERVER_LISTENING_PORT = config.ingressPort;

server.listen(SERVER_LISTENING_PORT, () => {
  console.log(`Server listening ${SERVER_LISTENING_PORT}`);
});
