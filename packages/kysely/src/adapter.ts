import type { DatabaseAdapter, DatabaseContext } from 'fossyl';
import type { Kysely } from 'kysely';
import { transactionContext } from './context';
import { runMigrations } from './migrations';
import type { KyselyAdapterOptions } from './types';

/**
 * Creates a Kysely database adapter for fossyl.
 *
 * This adapter provides:
 * - Type-safe query building with Kysely
 * - Automatic transaction handling for write operations
 * - AsyncLocalStorage for transaction context propagation
 * - Optional migration support on startup
 *
 * @example
 * ```typescript
 * import { Kysely, PostgresDialect } from 'kysely';
 * import { Pool } from 'pg';
 * import { kyselyAdapter, createMigrationProvider } from '@fossyl/kysely';
 * import type { DB } from './generated/types';
 *
 * const db = new Kysely<DB>({
 *   dialect: new PostgresDialect({
 *     pool: new Pool({ connectionString: process.env.DATABASE_URL }),
 *   }),
 * });
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
 * const database = kyselyAdapter({ client: db, migrations, autoMigrate: true });
 * ```
 */
export function kyselyAdapter<DB>(
  options: KyselyAdapterOptions<DB>
): DatabaseAdapter<Kysely<DB>> {
  const {
    client,
    migrations,
    autoMigrate = false,
    defaultTransaction = true,
  } = options;

  return {
    type: 'database',
    name: 'kysely',
    client,
    defaultTransaction,
    autoMigrate,

    async onStartup(): Promise<void> {
      if (autoMigrate && migrations) {
        const result = await runMigrations(client, migrations);

        if (result.error) {
          throw new Error(
            `Migration failed: ${result.error.message}. ` +
              `Executed: ${result.executed.join(', ') || 'none'}`
          );
        }

        if (result.executed.length > 0) {
          console.log(`Migrations applied: ${result.executed.join(', ')}`);
        }
      }
    },

    async withTransaction<T>(
      fn: (ctx: DatabaseContext<Kysely<DB>>) => Promise<T>
    ): Promise<T> {
      return client.transaction().execute(async (trx) => {
        const ctx: DatabaseContext<Kysely<DB>> = {
          client: trx as unknown as Kysely<DB>,
          inTransaction: true,
        };
        return transactionContext.run({ trx, inTransaction: true }, () =>
          fn(ctx)
        );
      });
    },

    async withClient<T>(
      fn: (ctx: DatabaseContext<Kysely<DB>>) => Promise<T>
    ): Promise<T> {
      const ctx: DatabaseContext<Kysely<DB>> = {
        client,
        inTransaction: false,
      };
      return transactionContext.run({ trx: client, inTransaction: false }, () =>
        fn(ctx)
      );
    },
  };
}
