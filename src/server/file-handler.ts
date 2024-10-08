import * as fs from "fs";
import * as path from "path";
import { LogLevel, LogMessage } from "../types";

export class FileHandler {
  private logDir: string; // Directory where log files will be stored
  private writeStreams: Map<string, fs.WriteStream>; // Map to hold open file streams
  private rotationSize: number; // File size that triggers rotation
  private maxFiles: number; // Maximum number of backup files to keep

  constructor(
    logDir: string,
    rotationSize: number = 5 * 1024 * 1024, // Default 5MB
    maxFiles: number = 5 // Default 5 backup files
  ) {
    this.logDir = logDir;
    this.writeStreams = new Map();
    this.rotationSize = rotationSize;
    this.maxFiles = maxFiles;
    this.ensureLogDirectory();
  }

  // Create the log directory if it doesn't exist
  private ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  // Get or create a write stream for a specific log level
  private getWriteStream(level: string): fs.WriteStream {
    if (!this.writeStreams.has(level)) {
      const filePath = path.join(this.logDir, `${level}.log`);
      // 'a' flag means append to file if it exists
      const stream = fs.createWriteStream(filePath, { flags: "a" });
      this.writeStreams.set(level, stream);
    }
    return this.writeStreams.get(level)!;
  }

  // Handle log file rotation when size limit is reached
  private async rotateFile(level: string) {
    const baseFilePath = path.join(this.logDir, `${level}.log`);

    try {
      const stats = await fs.promises.stat(baseFilePath);
      // Only rotate if file size exceeds the limit
      if (stats.size < this.rotationSize) return;

      // Rotate files: file.3.log -> file.4.log, file.2.log -> file.3.log, etc.
      for (let i = this.maxFiles - 1; i >= 0; i--) {
        const oldFile =
          i === 0 ? baseFilePath : path.join(this.logDir, `${level}.${i}.log`);
        const newFile = path.join(this.logDir, `${level}.${i + 1}.log`);

        if (fs.existsSync(oldFile)) {
          if (i === this.maxFiles - 1) {
            // Delete the oldest file if we've reached maxFiles
            await fs.promises.unlink(oldFile);
          } else {
            // Rename existing files
            await fs.promises.rename(oldFile, newFile);
          }
        }
      }

      // Close and reopen the write stream for the rotated file
      const stream = this.writeStreams.get(level);
      if (stream) {
        stream.end();
        this.writeStreams.delete(level);
      }
    } catch (error) {
      console.error("Error rotating log file:", error);
    }
  }

  // Write a log message to the appropriate file(s)
  async writeLog(logMessage: LogMessage) {
    const { level, ...messageWithoutLevel } = logMessage;
    // Convert log message to JSON string with newline for easy parsing
    const logString =
      JSON.stringify({
        level,
        ...messageWithoutLevel,
      }) + "\n";

    // Check if we need to rotate the log file
    await this.rotateFile(level);

    // Write to level-specific log file
    this.getWriteStream(level).write(logString);

    // Also write to combined log file for complete history
    this.getWriteStream("combined").write(logString);

    // Console output for debugging and errors
    if (level === LogLevel.ERROR) {
      console.error(logString);
    } else if (process.env.NODE_ENV !== "production") {
      console.log(logString);
    }
  }

  // Properly close all open file streams
  closeStreams() {
    for (const stream of this.writeStreams.values()) {
      stream.end();
    }
    this.writeStreams.clear();
  }
}
