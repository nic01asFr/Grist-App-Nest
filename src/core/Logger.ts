/**
 * Structured Logger
 */

import type { LogLevel, LogEntry } from './types';

class Logger {
  private static formatTimestamp(): string {
    const now = new Date();
    const time = now.toLocaleTimeString('fr-FR', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const ms = now.getMilliseconds().toString().padStart(3, '0');
    return `${time}.${ms}`;
  }

  private static createLogEntry(
    level: LogLevel,
    icon: string,
    message: string,
    data?: unknown
  ): LogEntry {
    return {
      timestamp: this.formatTimestamp(),
      level,
      icon,
      message,
      data,
    };
  }

  static log(icon: string, message: string, data?: unknown): void {
    const entry = this.createLogEntry('info', icon, message, data);
    const logMessage = `[${entry.timestamp}] ${entry.icon} ${entry.message}`;

    if (data !== undefined) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }
  }

  static info(message: string, data?: unknown): void {
    this.log('ℹ️', message, data);
  }

  static success(message: string, data?: unknown): void {
    this.log('✅', message, data);
  }

  static warn(message: string, data?: unknown): void {
    const entry = this.createLogEntry('warn', '⚠️', message, data);
    const logMessage = `[${entry.timestamp}] ${entry.icon} ${entry.message}`;

    if (data !== undefined) {
      console.warn(logMessage, data);
    } else {
      console.warn(logMessage);
    }
  }

  static error(message: string, data?: unknown): void {
    const entry = this.createLogEntry('error', '❌', message, data);
    const logMessage = `[${entry.timestamp}] ${entry.icon} ${entry.message}`;

    if (data !== undefined) {
      console.error(logMessage, data);
    } else {
      console.error(logMessage);
    }
  }

  static debug(message: string, data?: unknown): void {
    const entry = this.createLogEntry('debug', '🐛', message, data);
    const logMessage = `[${entry.timestamp}] ${entry.icon} ${entry.message}`;

    if (data !== undefined) {
      console.debug(logMessage, data);
    } else {
      console.debug(logMessage);
    }
  }
}

export default Logger;
