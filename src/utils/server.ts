import fs from "fs";
import WebSocket from "ws";

class ServerLogger {
  private server: WebSocket.Server;
  private logFile: string;

  constructor(port: number, logFile: string = "server.log") {
    this.server = new WebSocket.Server({ port });
    this.logFile = logFile;

    this.initializeServer();
  }

  private initializeServer(): void {
    this.server.on("connection", this.handleConnection.bind(this));
    console.log(
      `WebSocket server is running on ws://localhost:${this.server.options.port}`
    );
  }

  private handleConnection(ws: WebSocket): void {
    ws.send("Connected to Logger");
    ws.on("message", this.handleMessage.bind(this));
  }

  private handleMessage(message: WebSocket.Data): void {
    const msg = message.toString() + "\n";
    this.writeToFile(msg);
  }

  private writeToFile(message: string): void {
    fs.appendFile(this.logFile, message, (err) => {
      if (err) {
        console.error("Error writing to log file:", err);
      }
    });
  }

  public close(): void {
    this.server.close(() => {
      console.log("WebSocket server closed");
    });
  }
}

export default ServerLogger;
