import config from "./config/index.js";
import server from "./express/index.js";

const SERVER_LISTENING_PORT = config.ingressPort;

server.listen(SERVER_LISTENING_PORT, () => {
  console.log(`Server listening ${SERVER_LISTENING_PORT}`);
});
