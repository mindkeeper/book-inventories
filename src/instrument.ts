import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

// Ensure to call this before requiring any other modules!
const sentryDsn =
  process.env.SENTRY_DSN || 'https://examplePublicKey@o0.ingest.sentry.io/0';
const environment = process.env.NODE_ENV || 'development';

Sentry.init({
  dsn: sentryDsn,
  environment,
  integrations: [
    // Add our Profiling integration
    nodeProfilingIntegration(),
  ],
  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for tracing.
  // We recommend adjusting this value in production
  tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
  // Set profilesSampleRate to 1.0 to profile 100%
  // of sampled transactions.
  // This is relative to tracesSampleRate
  profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
  enableLogs: true,
  sendDefaultPii: true,
  profileLifecycle: 'trace',

  // Add debug mode for development
  debug: environment === 'development',

  // Add beforeSend hook for validation
  beforeSend(event) {
    if (environment === 'development') {
      // Extract error message from different possible locations
      let errorMessage = event.message;

      // For exceptions, the message is usually in exception.values
      if (!errorMessage && event.exception?.values?.[0]) {
        errorMessage =
          event.exception.values[0].value || event.exception.values[0].type;
      }

      // For other events, check logentry
      if (!errorMessage && event.logentry) {
        errorMessage = event.logentry.message;
      }

      // Fallback to event type
      if (!errorMessage) {
        errorMessage = `${event.type || 'Unknown'} event`;
      }

      console.log('🔍 Sentry Event Captured:', {
        type: event.type,
        message: errorMessage,
        level: event.level,
        timestamp: event.timestamp,
        environment: event.environment,
        // Additional debug info
        hasException: !!event.exception,
        exceptionCount: event.exception?.values?.length || 0,
        tags: event.tags,
      });
    }
    return event;
  },
});

// Log Sentry initialization status
if (environment === 'development') {
  console.log('🚀 Sentry initialized with:', {
    dsn: sentryDsn.includes('examplePublicKey')
      ? '❌ PLACEHOLDER DSN - Replace with real DSN'
      : '✅ Valid DSN',
    environment,
    debug: true,
  });
}
