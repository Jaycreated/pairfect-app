import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  data?: any;
  stack?: string;
}

class DebugLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private formatMessage(level: LogEntry['level'], message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? `\n${JSON.stringify(data, null, 2)}` : '';
    return `[${timestamp}] ${level}: ${message}${dataStr}`;
  }

  async log(level: LogEntry['level'], message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      stack: level === 'ERROR' ? new Error().stack : undefined,
    };

    this.logs.push(entry);
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Save to SecureStore for persistence
    try {
      await SecureStore.setItemAsync('debug_logs', JSON.stringify(this.logs));
    } catch (error) {
      console.error('Failed to save logs to storage:', error);
    }

    // Always log to console for development
    const formattedMessage = this.formatMessage(level, message, data);
    
    switch (level) {
      case 'ERROR':
        console.error(formattedMessage);
        break;
      case 'WARN':
        console.warn(formattedMessage);
        break;
      case 'DEBUG':
        console.debug(formattedMessage);
        break;
      default:
        console.log(formattedMessage);
    }

    // In development builds, also try to send to a remote endpoint
    if (__DEV__) {
      this.sendToRemoteLogger(entry).catch(() => {
        // Silently fail remote logging
      });
    }
  }

  info(message: string, data?: any) {
    this.log('INFO', message, data);
  }

  warn(message: string, data?: any) {
    this.log('WARN', message, data);
  }

  error(message: string, data?: any) {
    this.log('ERROR', message, data);
  }

  debug(message: string, data?: any) {
    this.log('DEBUG', message, data);
  }

  async getLogs(): Promise<LogEntry[]> {
    try {
      const stored = await SecureStore.getItemAsync('debug_logs');
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load logs from storage:', error);
    }
    return this.logs;
  }

  async clearLogs() {
    this.logs = [];
    try {
      await SecureStore.deleteItemAsync('debug_logs');
    } catch (error) {
      console.error('Failed to clear logs from storage:', error);
    }
  }

  async exportLogs(): Promise<string> {
    const logs = await this.getLogs();
    const deviceInfo = {
      platform: Platform.OS,
      version: Platform.Version,
      isDev: __DEV__,
      timestamp: new Date().toISOString(),
    };
    
    return JSON.stringify({
      deviceInfo,
      logs,
    }, null, 2);
  }

  private async sendToRemoteLogger(entry: LogEntry) {
    // Optional: Send logs to a remote service for debugging
    // You can set up a simple logging endpoint on your backend
    try {
      await fetch('https://your-backend.com/api/debug/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      // Silently fail - don't let logging errors break the app
    }
  }

  // Network request logging
  logNetworkRequest(url: string, method: string, headers?: any, body?: any) {
    this.debug('Network Request', {
      url,
      method,
      headers: this.sanitizeHeaders(headers),
      body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
    });
  }

  logNetworkResponse(url: string, status: number, response?: any, duration?: number) {
    const level = status >= 400 ? 'ERROR' : 'INFO';
    this.log(level, 'Network Response', {
      url,
      status,
      response: response ? JSON.stringify(response) : undefined,
      duration: duration ? `${duration}ms` : undefined,
    });
  }

  private sanitizeHeaders(headers?: any) {
    if (!headers) return undefined;
    
    const sanitized = { ...headers };
    // Hide sensitive headers
    if (sanitized.Authorization) {
      sanitized.Authorization = 'Bearer [REDACTED]';
    }
    return sanitized;
  }
}

export const debugLogger = new DebugLogger();

// Enhanced fetch wrapper for automatic network logging
export async function debugFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const startTime = Date.now();
  
  debugLogger.logNetworkRequest(url, options.method || 'GET', options.headers, options.body);
  
  try {
    const response = await fetch(url, options);
    const duration = Date.now() - startTime;
    
    // Try to parse response for logging
    let responseData;
    try {
      responseData = await response.clone().json();
    } catch {
      try {
        responseData = await response.clone().text();
      } catch {
        responseData = '[Unable to parse response]';
      }
    }
    
    debugLogger.logNetworkResponse(url, response.status, responseData, duration);
    
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    debugLogger.logNetworkResponse(url, 0, { error: errorMessage }, duration);
    throw error;
  }
}
