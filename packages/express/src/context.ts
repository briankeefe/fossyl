import { AsyncLocalStorage } from 'node:async_hooks';
import type { DatabaseContext, Logger } from '@fossyl/core';

/**
 * Request context available throughout the request lifecycle.
 */
export type RequestContext = {
  readonly requestId: string;
  readonly databaseContext?: DatabaseContext;
  readonly logger: Logger;
};

/**
 * Logger context passed to route handlers.
 */
export type LoggerContext = {
  readonly requestId: string;
  readonly logger: Logger;
};

/**
 * AsyncLocalStorage instance for request context.
 */
export const requestContext = new AsyncLocalStorage<RequestContext>();

/**
 * Gets the current request context.
 * @throws Error if called outside of a request context.
 */
export function getContext(): RequestContext {
  const ctx = requestContext.getStore();
  if (!ctx) throw new Error('No request context available');
  return ctx;
}

/**
 * Gets the current request logger.
 * @throws Error if called outside of a request context.
 */
export function getLogger(): Logger {
  return getContext().logger;
}

/**
 * Gets the current request ID.
 * @throws Error if called outside of a request context.
 */
export function getRequestId(): string {
  return getContext().requestId;
}

/**
 * Gets the current database context.
 * @throws Error if called outside of a request context or if no database is configured.
 */
export function getDb<T = unknown>(): DatabaseContext<T> {
  const ctx = getContext();
  if (!ctx.databaseContext) throw new Error('No database context available');
  return ctx.databaseContext as DatabaseContext<T>;
}

/**
 * Creates a default console-based logger.
 */
export function createDefaultLogger(requestId: string): Logger {
  const prefix = `[${requestId}]`;
  return {
    info: (message: string, meta?: Record<string, unknown>) => {
      console.log(prefix, message, meta ? JSON.stringify(meta) : '');
    },
    warn: (message: string, meta?: Record<string, unknown>) => {
      console.warn(prefix, message, meta ? JSON.stringify(meta) : '');
    },
    error: (message: string, meta?: Record<string, unknown>) => {
      console.error(prefix, message, meta ? JSON.stringify(meta) : '');
    },
  };
}
