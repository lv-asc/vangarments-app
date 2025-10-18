import fs from 'fs';
import path from 'path';
import { localConfig } from '../config/local';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: any;
  error?: Error;
  requestId?: string;
  userId?: string;
}

class Logger {
  private logLevel: LogLevel;
  private logFilePath?: string;
  private enableConsole: boolean;
  private enableFile: boolean;

  constructor() {
    const config = localConfig.getConfig();
    this.logLevel = this.parseLogLevel(config.logging.level);
    this.enableConsole = config.logging.enableConsole;
    this.enableFile = config.logging.enableFile;
    
    if (this.enableFile) {
      this.logFilePath = path.resolve(config.logging.filePath);
      this.ensureLogDirectory();
    }
  }

  private parseLogLevel(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case 'error': return LogLevel.ERROR;
      case 'warn': return LogLevel.WARN;
      case 'info': return LogLevel.INFO;
      case 'debug': return LogLevel.DEBUG;
      default: return LogLevel.INFO;
    }
  }

  private ensureLogDirectory(): void {
    if (this.logFilePath) {
      const logDir = path.dirname(this.logFilePath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
    }
  }

  private formatLogEntry(entry: LogEntry): string {
    const { timestamp, level, message, context, error, requestId, userId } = entry;
    
    let logLine = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    if (requestId) {
      logLine += ` [RequestID: ${requestId}]`;
    }
    
    if (userId) {
      logLine += ` [UserID: ${userId}]`;
    }
    
    if (context) {
      logLine += ` Context: ${JSON.stringify(context)}`;
    }
    
    if (error) {
      logLine += `\nError: ${error.message}\nStack: ${error.stack}`;
    }
    
    return logLine;
  }

  private writeLog(level: LogLevel, message: string, context?: any, error?: Error, requestId?: string, userId?: string): void {
    if (level > this.logLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level].toLowerCase(),
      message,
      context,
      error,
      requestId,
      userId,
    };

    const formattedLog = this.formatLogEntry(entry);

    // Console output
    if (this.enableConsole) {
      const coloredLog = this.colorizeLog(level, formattedLog);
      console.log(coloredLog);
    }

    // File output
    if (this.enableFile && this.logFilePath) {
      try {
        fs.appendFileSync(this.logFilePath, formattedLog + '\n');
      } catch (err) {
        console.error('Failed to write to log file:', err);
      }
    }
  }

  private colorizeLog(level: LogLevel, message: string): string {
    const colors = {
      [LogLevel.ERROR]: '\x1b[31m', // Red
      [LogLevel.WARN]: '\x1b[33m',  // Yellow
      [LogLevel.INFO]: '\x1b[36m',  // Cyan
      [LogLevel.DEBUG]: '\x1b[37m', // White
    };
    
    const reset = '\x1b[0m';
    return `${colors[level]}${message}${reset}`;
  }

  public error(message: string, context?: any, error?: Error, requestId?: string, userId?: string): void {
    this.writeLog(LogLevel.ERROR, message, context, error, requestId, userId);
  }

  public warn(message: string, context?: any, requestId?: string, userId?: string): void {
    this.writeLog(LogLevel.WARN, message, context, undefined, requestId, userId);
  }

  public info(message: string, context?: any, requestId?: string, userId?: string): void {
    this.writeLog(LogLevel.INFO, message, context, undefined, requestId, userId);
  }

  public debug(message: string, context?: any, requestId?: string, userId?: string): void {
    this.writeLog(LogLevel.DEBUG, message, context, undefined, requestId, userId);
  }

  // Database operation logging
  public logDatabaseOperation(operation: string, table: string, duration: number, success: boolean, error?: Error, requestId?: string): void {
    const context = { operation, table, duration, success };
    
    if (success) {
      this.info(`Database operation completed: ${operation} on ${table}`, context, requestId);
    } else {
      this.error(`Database operation failed: ${operation} on ${table}`, context, error, requestId);
    }
  }

  // API request logging
  public logApiRequest(method: string, path: string, statusCode: number, duration: number, requestId?: string, userId?: string): void {
    const context = { method, path, statusCode, duration };
    
    if (statusCode >= 500) {
      this.error(`API request failed: ${method} ${path}`, context, undefined, requestId, userId);
    } else if (statusCode >= 400) {
      this.warn(`API request error: ${method} ${path}`, context, requestId, userId);
    } else {
      this.info(`API request: ${method} ${path}`, context, requestId, userId);
    }
  }

  // Authentication logging
  public logAuthEvent(event: string, userId?: string, success: boolean = true, error?: Error, requestId?: string): void {
    const context = { event, success };
    
    if (success) {
      this.info(`Authentication event: ${event}`, context, requestId, userId);
    } else {
      this.warn(`Authentication failed: ${event}`, context, requestId, userId);
    }
  }

  // File operation logging
  public logFileOperation(operation: string, filePath: string, success: boolean, error?: Error, requestId?: string): void {
    const context = { operation, filePath, success };
    
    if (success) {
      this.info(`File operation: ${operation}`, context, requestId);
    } else {
      this.error(`File operation failed: ${operation}`, context, error, requestId);
    }
  }

  // Configuration change logging
  public logConfigChange(section: string, key: string, oldValue: any, newValue: any, userId?: string, requestId?: string): void {
    const context = { section, key, oldValue, newValue };
    this.info(`Configuration changed: ${section}.${key}`, context, requestId, userId);
  }

  // Performance monitoring
  public logPerformanceMetric(metric: string, value: number, unit: string, context?: any, requestId?: string): void {
    const perfContext = { metric, value, unit, ...context };
    this.debug(`Performance metric: ${metric} = ${value}${unit}`, perfContext, requestId);
  }

  // Health check logging
  public logHealthCheck(service: string, status: 'healthy' | 'unhealthy', details?: any, requestId?: string): void {
    const context = { service, status, details };
    
    if (status === 'healthy') {
      this.debug(`Health check passed: ${service}`, context, requestId);
    } else {
      this.warn(`Health check failed: ${service}`, context, requestId);
    }
  }
}

export const logger = new Logger();
export default logger;