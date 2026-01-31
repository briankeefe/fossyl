import type { FrameworkAdapter, DatabaseAdapter, ValidationAdapter } from './adapters';

/**
 * Adapter configuration for fossyl.
 */
export type AdaptersConfig = {
  /** Required: HTTP framework adapter */
  framework: FrameworkAdapter;

  /** Optional: Database adapter for transactions */
  database?: DatabaseAdapter;

  /** Optional: Validation adapter (rarely needed) */
  validation?: ValidationAdapter;
};

/**
 * Fossyl configuration type.
 *
 * Used in `fossyl.config.ts` to configure the CLI and runtime adapters.
 *
 * @example
 * ```typescript
 * // fossyl.config.ts
 * import { defineConfig } from 'fossyl';
 * import { expressAdapter } from '@fossyl/express';
 *
 * export default defineConfig({
 *   routes: './src/routes',
 *   adapters: {
 *     framework: expressAdapter({ cors: true }),
 *   },
 * });
 * ```
 */
export type FossylConfig = {
  /** Path to routes directory or file */
  routes: string;

  /** Adapter configuration */
  adapters: AdaptersConfig;
};

/**
 * Helper function to define fossyl configuration with type safety.
 *
 * This is a simple identity function that provides TypeScript
 * autocomplete and validation for your config file.
 *
 * @example
 * ```typescript
 * // fossyl.config.ts
 * import { defineConfig } from 'fossyl';
 * import { expressAdapter } from '@fossyl/express';
 *
 * export default defineConfig({
 *   routes: './src/routes',
 *   adapters: {
 *     framework: expressAdapter(),
 *   },
 * });
 * ```
 */
export function defineConfig(config: FossylConfig): FossylConfig {
  return config;
}
