import * as Sentry from "@sentry/react-native";

/**
 * Log an error to Sentry with optional context
 */
export function logError(error: Error | string, context?: Record<string, any>) {
  if (typeof error === "string") {
    error = new Error(error);
  }

  if (context) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}

/**
 * Log a message to Sentry
 */
export function logMessage(message: string, level: Sentry.SeverityLevel = "info") {
  Sentry.captureMessage(message, level);
}

/**
 * Log API errors with full context
 */
export function logApiError(
  endpoint: string,
  error: Error,
  responseStatus?: number,
  requestData?: any
) {
  Sentry.withScope((scope) => {
    scope.setTag("api_endpoint", endpoint);
    scope.setExtra("response_status", responseStatus);
    scope.setExtra("request_data", requestData);
    Sentry.captureException(error);
  });
}

/**
 * Set user context for all future events
 */
export function setSentryUser(userId: string, email?: string, username?: string) {
  Sentry.setUser({
    id: userId,
    email,
    username,
  });
}

/**
 * Clear user context (on logout)
 */
export function clearSentryUser() {
  Sentry.setUser(null);
}
