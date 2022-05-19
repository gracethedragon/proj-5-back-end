import express from "express";
import http from "http";
import cors from "cors";


import config from "./config/index.js";

const SERVER_LISTENING_PORT = config.ingressPort;
const app = express(); 
const server = http.createServer(app);

app.use(cors({ origin: "*" }));

server.listen(SERVER_LISTENING_PORT, () => {
  console.log(`Server listening ${SERVER_LISTENING_PORT}`);
});
