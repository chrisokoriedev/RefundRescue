import * as Sentry from '@sentry/node';
import { config } from './index.js';

/**
 * Initialize Sentry for error tracking.
 * 
 * Only initializes if SENTRY_DSN is set.
 * In test mode, Sentry is disabled.
 */
export function initSentry() {
  if (process.env.NODE_ENV === 'test' || !config.sentryDsn) {
    return;
  }

  Sentry.init({
    dsn: config.sentryDsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1, // 10% of transactions for performance monitoring
    beforeSend(event) {
      // Don't send events for known operational errors (Zod validation, 404s, etc.)
      const type = event.exception?.values?.[0]?.type;
      if (type === 'AppError' || type === 'ZodError' || event.exception?.values?.[0]?.value?.includes('Not Found')) {
        return null;
      }
      return event;
    },
  });

  console.log('[Sentry] Error tracking initialized');
}

/**
 * Setup Sentry error handler on the Express app.
 * Must be called AFTER all routes but BEFORE the global error handler.
 */
export function setupSentryErrorHandler(app: any) {
  if (process.env.NODE_ENV === 'test' || !config.sentryDsn) {
    return; // No-op in test or when DSN not set
  }
  Sentry.setupExpressErrorHandler(app);
}
