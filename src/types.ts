export enum LogLevel {
  ERROR = "error",
  WARN = "warn",
  INFO = "info",
  DEBUG = "debug",
}
export interface LogMessage {
  level: LogLevel; // The severity level of the log
  message: string; // The actual log message
  timestamp: string; // When the log was created
  service: string; // Which microservice generated this log
  metadata?: Record<string, any>; // Optional additional data
}
