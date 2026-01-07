import type { Route } from './router/types/routes.types';

/**
 * HTTP methods supported by fossyl routes.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

/**
 * Route with metadata for CLI/code generation.
 * Contains the route definition plus source file tracking.
 */
export type RouteInfo = {
  route: Route;
  sourceFile: string;
  exportName: string;
};

/**
 * Context passed to framework adapters during code generation.
 */
export type GeneratorContext = {
  outputPath: string;
  routesPath: string;
  databaseAdapter?: DatabaseAdapter;
};

/**
 * Dev server control interface.
 */
export type DevServer = {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  reload: () => Promise<void>;
};

/**
 * Dev server configuration options.
 */
export type DevServerOptions = {
  port: number;
  routesPath: string;
};

/**
 * Framework adapter type (Express, Hono, etc.)
 *
 * Framework adapters generate TypeScript code from fossyl routes.
 * They implement the code generation strategy for a specific HTTP framework.
 *
 * @example
 * ```typescript
 * import { expressAdapter } from '@fossyl/express';
 *
 * export default defineConfig({
 *   adapters: {
 *     framework: expressAdapter({ cors: true }),
 *   },
 * });
 * ```
 */
export type FrameworkAdapter = {
  type: 'framework';
  name: string;

  /** Generate TypeScript code from routes */
  generate: (routes: RouteInfo[], ctx: GeneratorContext) => string;

  /** Optional: Create dev server for hot reload */
  createDevServer?: (routes: RouteInfo[], options: DevServerOptions) => DevServer;
};

/**
 * Database adapter type (Prisma-Kysely, Drizzle, etc.)
 *
 * Database adapters provide automatic transaction handling
 * and emit setup/wrapper code for the generated server.
 *
 * @example
 * ```typescript
 * import { prismaKyselyAdapter } from '@fossyl/prisma-kysely';
 *
 * export default defineConfig({
 *   adapters: {
 *     database: prismaKyselyAdapter({
 *       kysely: './src/lib/db',
 *       autoMigrate: true,
 *     }),
 *   },
 * });
 * ```
 */
export type DatabaseAdapter = {
  type: 'database';
  name: string;

  /** Path to database client module */
  clientPath: string;

  /** Whether routes use transactions by default */
  defaultTransaction: boolean;

  /** Auto-run migrations on startup */
  autoMigrate: boolean;

  /** Emit setup code (imports, context creation) */
  emitSetup: () => string;

  /** Emit wrapper code for transaction handling */
  emitWrapper: (handlerCode: string, useTransaction: boolean) => string;

  /** Emit startup code (migrations, etc.) */
  emitStartup: () => string;
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
