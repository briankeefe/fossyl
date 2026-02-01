import type { Kysely, MigrationProvider } from 'kysely';

/**
 * Configuration options for the Kysely adapter.
 */
export type KyselyAdapterOptions<DB> = {
  /** Kysely instance configured with your database dialect */
  client: Kysely<DB>;

  /**
   * Migration provider for running migrations on startup.
   * Use `createMigrationProvider()` to create one from a record of migrations.
   *
   * @example
   * ```typescript
   * import { createMigrationProvider } from '@fossyl/kysely';
   *
   * const migrations = createMigrationProvider({
   *   '001_create_users': { up: ..., down: ... },
   * });
   *
   * kyselyAdapter({ client: db, migrations });
   * ```
   */
  migrations?: MigrationProvider;

  /**
   * Run pending migrations automatically on startup.
   * Requires `migrations` to be provided.
   * @default false
   */
  autoMigrate?: boolean;

  /**
   * Use transactions by default for write operations (POST/PUT).
   * @default true
   */
  defaultTransaction?: boolean;
};
