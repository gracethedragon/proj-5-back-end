import express from "express";
import http from "http";
import cors from "cors";

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: "*" }));

app.use("is-server-online", (_, res) => res.sendStatus(200));

export default server;
