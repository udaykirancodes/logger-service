// src/client/client.ts
import { WebSocket } from "ws";
import { LogLevel, LogMessage } from "../types";

// Client-side logger that sends logs to the logging server
export class ClientLogger {
  private Colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    gray: "\x1b[90m",
  } as const;
  private ws: WebSocket;
  private serviceName: string;
  private connected: boolean = false;
  private messageQueue: LogMessage[] = []; // Queue for messages when disconnected
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private readonly reconnectInterval = 5000; // 5 seconds between reconnection attempts
  private printOnConsole: boolean = false;
  constructor(serverUrl: string, serviceName: string, printOnConsole: boolean) {
    this.serviceName = serviceName;
    this.printOnConsole = printOnConsole;
    this.ws = this.createWebSocket(serverUrl);
  }

  // Create a new WebSocket connection with event handlers
  private createWebSocket(serverUrl: string): WebSocket {
    const ws = new WebSocket(serverUrl);

    // When connection is established
    ws.on("open", () => {
      this.connected = true;
      this.flushMessageQueue(); // Send any queued messages
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
    });

    // When connection is closed
    ws.on("close", () => {
      this.connected = false;
      this.scheduleReconnect(serverUrl);
    });

    // When a connection error occurs
    ws.on("error", (error: Error) => {
      console.error("WebSocket error:", error);
      if (!this.reconnectTimeout) {
        this.scheduleReconnect(serverUrl);
      }
    });

    return ws;
  }

  // Schedule a reconnection attempt
  private scheduleReconnect(serverUrl: string) {
    if (!this.reconnectTimeout) {
      this.reconnectTimeout = setTimeout(() => {
        this.ws = this.createWebSocket(serverUrl);
        this.reconnectTimeout = null;
      }, this.reconnectInterval);
    }
  }

  // Send any queued messages once connection is restored
  private flushMessageQueue() {
    while (this.messageQueue.length > 0 && this.connected) {
      const message = this.messageQueue.shift();
      if (message) {
        this.sendLogMessage(message);
      }
    }
  }

  // Send a log message or queue it if disconnected
  private sendLogMessage(logMessage: LogMessage) {
    if (this.connected) {
      this.ws.send(JSON.stringify(logMessage));
    } else {
      this.messageQueue.push(logMessage);
    }
  }
  formatLevel(level: LogLevel): string {
    switch (level) {
      case LogLevel.ERROR:
        return `${this.Colors.red}${this.Colors.bright}ERROR${this.Colors.reset}`;
      case LogLevel.WARN:
        return `${this.Colors.yellow}${this.Colors.bright}WARN ${this.Colors.reset}`;
      case LogLevel.INFO:
        return `${this.Colors.blue}${this.Colors.bright}INFO ${this.Colors.reset}`;
      case LogLevel.DEBUG:
        return `${this.Colors.gray}${this.Colors.bright}DEBUG${this.Colors.reset}`;
    }
  }
  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return `${this.Colors.gray}${date.toLocaleTimeString()}${
      this.Colors.reset
    }`;
  }

  formatLogMessage(logMessage: LogMessage): string {
    const { level, message, timestamp, service, metadata } = logMessage;

    let formattedMessage = `${this.formatTimestamp(
      timestamp
    )} ${this.formatLevel(level)} ${this.Colors.bright}[${service}]${
      this.Colors.reset
    } ${message}`;

    if (metadata && Object.keys(metadata).length > 0) {
      const formattedMetadata = JSON.stringify(metadata, null, 2)
        .split("\n")
        .map((line, index) => (index === 0 ? line : "  " + line)) // Indent metadata
        .join("\n");
      formattedMessage +=
        "\n" + this.Colors.gray + formattedMetadata + this.Colors.reset;
    }

    return formattedMessage;
  }

  // Generic logging method
  log(level: LogLevel, message: string, metadata?: Record<string, any>) {
    const logMessage: LogMessage = {
      level,
      message,
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      metadata,
    };
    if (this.printOnConsole) {
      console.log(this.formatLogMessage(logMessage));
    }
    this.sendLogMessage(logMessage);
  }

  // Convenience methods for different log levels
  error(message: string, metadata?: Record<string, any>) {
    this.log(LogLevel.ERROR, message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>) {
    this.log(LogLevel.WARN, message, metadata);
  }

  info(message: string, metadata?: Record<string, any>) {
    this.log(LogLevel.INFO, message, metadata);
  }

  debug(message: string, metadata?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  // Clean up resources
  close() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.ws.close();
  }
}
