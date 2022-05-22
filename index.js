import http from "http";

import { systemConfig } from "./config/index.js";

import app from "./express/index.js";

const server = http.createServer(app);

const SERVER_LISTENING_PORT = systemConfig.ingressPort;

server.listen(SERVER_LISTENING_PORT, () => {
  console.log(`Server listening ${SERVER_LISTENING_PORT}`);
});
