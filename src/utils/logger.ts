/**
 * Production-safe logging utility.
 * In development, logs to console. In production, can be swapped for error reporting service.
 */

const isDev = import.meta.env.DEV;

export const logger = {
  /** Development-only log (stripped in production builds) */
  debug(...args: unknown[]) {
    if (isDev) {
      console.log('[DEBUG]', ...args);
    }
  },

  /** Non-critical warnings — visible in dev, silent in prod */
  warn(...args: unknown[]) {
    if (isDev) {
      console.warn('[WARN]', ...args);
    }
  },

  /** Errors that should be tracked — always visible, extensible for Sentry/etc */
  error(...args: unknown[]) {
    console.error('[ERROR]', ...args);
    // Future: send to error tracking service
    // e.g. Sentry.captureException(args[0]);
  },
};
