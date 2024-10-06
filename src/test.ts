import ServerLogger from "./utils/server";

import ClientLogger from "./utils/client";

const s = new ServerLogger(8080, "./logs/combined.log");

const logger = new ClientLogger({ url: "ws://localhost:8080/" });

setInterval(() => {
  logger.sendMessage("Helooo i'm udaykiran");
}, 1000);
