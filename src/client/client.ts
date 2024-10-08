// src/client/client.ts
import { WebSocket } from "ws";
import { LogLevel, LogMessage } from "../types";

// Client-side logger that sends logs to the logging server
export class ClientLogger {
  private ws: WebSocket;
  private serviceName: string;
  private connected: boolean = false;
  private messageQueue: LogMessage[] = []; // Queue for messages when disconnected
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private readonly reconnectInterval = 5000; // 5 seconds between reconnection attempts

  constructor(serverUrl: string, serviceName: string) {
    this.serviceName = serviceName;
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

  // Generic logging method
  log(level: LogLevel, message: string, metadata?: Record<string, any>) {
    const logMessage: LogMessage = {
      level,
      message,
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      metadata,
    };

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
