import express from "express";
import http from "http";
import cors from "cors";

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: "*" }));

export default server;
