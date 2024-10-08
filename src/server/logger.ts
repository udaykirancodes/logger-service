// src/server/logger.ts
import { LogMessage } from "../types";
import { FileHandler } from "./file-handler";

// Server-side logger that uses FileHandler to write logs
export class ServerLogger {
  private fileHandler: FileHandler;

  constructor(logDir: string = "logs") {
    this.fileHandler = new FileHandler(logDir);
  }

  async log(logMessage: LogMessage) {
    await this.fileHandler.writeLog(logMessage);
  }

  close() {
    this.fileHandler.closeStreams();
  }
}
