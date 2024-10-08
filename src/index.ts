import { ClientLogger } from "./client/client";
import { LoggingServer } from "./server/server";

export { ClientLogger } from "./client/client";
export { LoggingServer } from "./server/server";
export { LogLevel } from "./types";

const s = new LoggingServer(8080);
const l = new ClientLogger("ws://localhost:8080/", "new");

setInterval(() => {
  l.info("Info Message", { hey: "world" });
  l.error("Error message");
  l.warn("Warn message");
  l.debug("Debug message");
}, 100);
