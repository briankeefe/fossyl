import type { Kysely, Migration, MigrationProvider } from 'kysely';

/**
 * A migration with up and down functions.
 * Use Kysely's schema builder to define schema changes.
 *
 * @example
 * ```typescript
 * import type { KyselyMigration } from '@fossyl/kysely';
 *
 * export const migration: KyselyMigration = {
 *   async up(db) {
 *     await db.schema
 *       .createTable('users')
 *       .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
 *       .addColumn('name', 'varchar(255)', (col) => col.notNull())
 *       .addColumn('email', 'varchar(255)', (col) => col.notNull().unique())
 *       .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`now()`))
 *       .execute();
 *   },
 *   async down(db) {
 *     await db.schema.dropTable('users').execute();
 *   },
 * };
 * ```
 */
export type KyselyMigration = Migration;

/**
 * A record of migrations keyed by their name.
 * Names should be sortable (e.g., timestamps or numbered prefixes).
 *
 * @example
 * ```typescript
 * import type { MigrationRecord } from '@fossyl/kysely';
 *
 * export const migrations: MigrationRecord = {
 *   '001_create_users': {
 *     async up(db) { ... },
 *     async down(db) { ... },
 *   },
 *   '002_create_posts': {
 *     async up(db) { ... },
 *     async down(db) { ... },
 *   },
 * };
 * ```
 */
export type MigrationRecord = Record<string, Migration>;

/**
 * Creates a migration provider from a record of migrations.
 * This is the simplest way to provide migrations to the adapter.
 *
 * @example
 * ```typescript
 * import { createMigrationProvider } from '@fossyl/kysely';
 *
 * const migrations = createMigrationProvider({
 *   '001_create_users': {
 *     async up(db) {
 *       await db.schema.createTable('users')...
 *     },
 *     async down(db) {
 *       await db.schema.dropTable('users').execute();
 *     },
 *   },
 * });
 *
 * const database = kyselyAdapter({ client: db, migrations });
 * ```
 */
export function createMigrationProvider(
  migrations: MigrationRecord
): MigrationProvider {
  return {
    async getMigrations() {
      return migrations;
    },
  };
}

/**
 * Helper to define a migration with proper typing.
 *
 * @example
 * ```typescript
 * import { defineMigration } from '@fossyl/kysely';
 * import { sql } from 'kysely';
 *
 * export default defineMigration({
 *   async up(db) {
 *     await db.schema
 *       .createTable('users')
 *       .addColumn('id', 'uuid', (col) => col.primaryKey())
 *       .execute();
 *   },
 *   async down(db) {
 *     await db.schema.dropTable('users').execute();
 *   },
 * });
 * ```
 */
export function defineMigration(migration: Migration): Migration {
  return migration;
}

/**
 * Result of running migrations.
 */
export type MigrationResult = {
  /** Migrations that were executed */
  executed: string[];
  /** Any error that occurred */
  error?: Error;
};

/**
 * Run all pending migrations.
 * This is called automatically on startup if migrations are configured.
 */
export async function runMigrations<DB>(
  db: Kysely<DB>,
  provider: MigrationProvider
): Promise<MigrationResult> {
  const { Migrator } = await import('kysely');
  const migrator = new Migrator({
    db,
    provider,
  });

  const { error, results } = await migrator.migrateToLatest();

  const executed = (results ?? [])
    .filter((r) => r.status === 'Success')
    .map((r) => r.migrationName);

  if (error) {
    return { executed, error: error as Error };
  }

  return { executed };
}

/**
 * Rollback the last migration.
 */
export async function rollbackMigration<DB>(
  db: Kysely<DB>,
  provider: MigrationProvider
): Promise<MigrationResult> {
  const { Migrator } = await import('kysely');
  const migrator = new Migrator({
    db,
    provider,
  });

  const { error, results } = await migrator.migrateDown();

  const executed = (results ?? [])
    .filter((r) => r.status === 'Success')
    .map((r) => r.migrationName);

  if (error) {
    return { executed, error: error as Error };
  }

  return { executed };
}

/**
 * Get the status of all migrations.
 */
export async function getMigrationStatus<DB>(
  db: Kysely<DB>,
  provider: MigrationProvider
): Promise<{ pending: string[]; executed: string[] }> {
  const { Migrator } = await import('kysely');
  const migrator = new Migrator({
    db,
    provider,
  });

  const migrations = await migrator.getMigrations();

  const pending: string[] = [];
  const executed: string[] = [];

  for (const m of migrations) {
    if (m.executedAt) {
      executed.push(m.name);
    } else {
      pending.push(m.name);
    }
  }

  return { pending, executed };
}
