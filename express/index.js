import express from "express";
import cors from "cors";

const app = express();

app.use(cors({ origin: "*" }));
app.get("/is-server-online", (_, res) => res.sendStatus(200));

export default app;
