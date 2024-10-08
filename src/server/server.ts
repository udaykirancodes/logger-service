// src/server/server.ts
import { WebSocketServer } from "ws";
import { LogMessage } from "../types";
import { ServerLogger } from "./logger";

// WebSocket server that receives logs from clients
export class LoggingServer {
  private wss: WebSocketServer;
  private logger: ServerLogger;

  constructor(port: number = 3000) {
    // Create WebSocket server on specified port
    this.wss = new WebSocketServer({ port });
    this.logger = new ServerLogger();

    // Handle new client connections
    this.wss.on("connection", (ws) => {
      // Handle incoming messages from clients
      ws.on("message", async (data: string) => {
        try {
          // Parse and log the received message
          const logMessage: LogMessage = JSON.parse(data);
          await this.logger.log(logMessage);
        } catch (error) {
          console.error("Error processing log message:", error);
        }
      });
    });

    // Graceful shutdown handler
    process.on("SIGINT", () => {
      this.close();
      process.exit();
    });

    console.log(`Logging server started on port ${port}`);
  }

  // Clean up resources when shutting down
  close() {
    this.wss.close();
    this.logger.close();
  }
}
