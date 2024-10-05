import WebSocket from "ws";

import { PORT } from "./config";
import logger from "./utils/winston";

const webSocket = new WebSocket.Server({ port: PORT });

webSocket.on("connection", (ws) => {
  ws.send("Connected to Logger");
  // Listen for messages from clients
  ws.on("message", (message) => {
    logger.info(message);
  });
});

console.log(`WebSocket server is running on ws://localhost:${PORT}`);

type Message = {
  message: string;
  from: string;
  level: "info" | "debug" | "error";
  time: string;
};
