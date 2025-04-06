type LogLevel = 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  method?: string;
  path?: string;
  [key: string]: any;
}

export function apiLogger(level: LogLevel, message: string, context?: LogContext) {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    level,
    message,
    ...context
  };

  switch (level) {
    case 'error':
      console.error(JSON.stringify(logData));
      break;
    case 'warn':
      console.warn(JSON.stringify(logData));
      break;
    default:
      console.log(JSON.stringify(logData));
  }
}

export const log = {
  info: (message: string, context?: LogContext) => apiLogger('info', message, context),
  warn: (message: string, context?: LogContext) => apiLogger('warn', message, context),
  error: (message: string, context?: LogContext) => apiLogger('error', message, context)
}; 