import type { Route } from './router/types/routes.types';

/**
 * HTTP methods supported by fossyl routes.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

/**
 * Framework adapter type (Express, Hono, etc.)
 *
 * Framework adapters register fossyl routes with an HTTP framework at runtime.
 * They handle the mapping between fossyl route definitions and framework-specific
 * request/response handling.
 *
 * @example
 * ```typescript
 * import { expressAdapter } from '@fossyl/express';
 *
 * const app = expressAdapter({ cors: true });
 * app.register(routes);
 * app.listen(3000);
 * ```
 */
export type FrameworkAdapter<TApp = unknown> = {
  type: 'framework';
  name: string;

  /** The underlying framework app instance (Express app, Hono instance, etc.) */
  app: TApp;

  /** Register fossyl routes with the framework */
  register: (routes: Route[]) => void;

  /** Start the server */
  listen: (port: number) => Promise<void>;

  /** Stop the server */
  close: () => Promise<void>;
};

/**
 * Database context passed to route handlers.
 */
export type DatabaseContext<TClient = unknown> = {
  client: TClient;
  inTransaction: boolean;
};

/**
 * Database adapter type (Prisma-Kysely, Drizzle, etc.)
 *
 * Database adapters provide automatic transaction handling
 * at runtime. They wrap route handlers to provide database
 * context and optional transaction management.
 *
 * @example
 * ```typescript
 * import { prismaKyselyAdapter } from '@fossyl/prisma-kysely';
 *
 * export default defineConfig({
 *   adapters: {
 *     database: prismaKyselyAdapter({
 *       client: db,
 *       autoMigrate: true,
 *     }),
 *   },
 * });
 * ```
 */
export type DatabaseAdapter<TClient = unknown> = {
  type: 'database';
  name: string;

  /** Database client instance */
  client: TClient;

  /** Whether routes use transactions by default */
  defaultTransaction: boolean;

  /** Auto-run migrations on startup */
  autoMigrate: boolean;

  /** Called once when server starts (run migrations, etc.) */
  onStartup: () => Promise<void>;

  /** Wrap a handler with transaction support */
  withTransaction: <T>(
    fn: (ctx: DatabaseContext<TClient>) => Promise<T>
  ) => Promise<T>;

  /** Execute without transaction (just provides client context) */
  withClient: <T>(
    fn: (ctx: DatabaseContext<TClient>) => Promise<T>
  ) => Promise<T>;
};

/**
 * Validation adapter type (Zod, Valibot, etc.)
 *
 * Validation adapters format validation errors for HTTP responses.
 * Most users won't need this - the default formatting is sufficient.
 */
export type ValidationAdapter = {
  type: 'validation';
  name: string;

  /** Format validation errors for response */
  formatError: (error: unknown) => { message: string; details?: unknown };
};

/**
 * Logger interface returned by LoggerAdapter for each request.
 */
export type Logger = {
  info: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, meta?: Record<string, unknown>) => void;
};

/**
 * Logger adapter type for request logging.
 *
 * Logger adapters create per-request logger instances that can be
 * used throughout the request lifecycle.
 *
 * @example
 * ```typescript
 * const pinoLogger: LoggerAdapter = {
 *   type: 'logger',
 *   name: 'pino',
 *   createLogger: (requestId) => ({
 *     info: (msg, meta) => pino.info({ requestId, ...meta }, msg),
 *     warn: (msg, meta) => pino.warn({ requestId, ...meta }, msg),
 *     error: (msg, meta) => pino.error({ requestId, ...meta }, msg),
 *   }),
 * };
 * ```
 */
export type LoggerAdapter = {
  type: 'logger';
  name: string;

  /** Create a logger instance for a specific request */
  createLogger: (requestId: string) => Logger;
};
