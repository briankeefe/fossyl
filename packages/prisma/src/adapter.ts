import type { DatabaseAdapter, DatabaseContext } from '@fossyl/core';
import { prismaContext } from './context';
import type { PrismaAdapterOptions, PrismaClientLike } from './types';

/**
 * Creates a Prisma database adapter for fossyl.
 *
 * This adapter provides:
 * - Prisma Client for type-safe database access
 * - Automatic transaction handling for write operations
 * - AsyncLocalStorage for client/transaction context propagation
 * - Optional migration support on startup via CLI command
 *
 * The adapter accepts any PrismaClient instance via structural typing,
 * so it works with any generated PrismaClient without build-time coupling.
 *
 * @example
 * ```typescript
 * import { PrismaClient } from '@prisma/client';
 * import { prismaAdapter } from '@fossyl/prisma';
 * import { expressAdapter } from '@fossyl/express';
 *
 * const prisma = new PrismaClient();
 *
 * const database = prismaAdapter({
 *   client: prisma,
 *   autoMigrate: true,
 * });
 *
 * const adapter = expressAdapter({ database, cors: true });
 * adapter.register(routes);
 * await adapter.listen(3000);
 * ```
 */
export function prismaAdapter<TClient extends PrismaClientLike>(
  options: PrismaAdapterOptions<TClient>
): DatabaseAdapter<TClient> {
  const {
    client,
    autoMigrate = false,
    defaultTransaction = true,
    transactionOptions,
    migrationCommand = 'npx prisma migrate deploy',
  } = options;

  return {
    type: 'database',
    name: 'prisma',
    client,
    defaultTransaction,
    autoMigrate,

    async onStartup(): Promise<void> {
      if (autoMigrate) {
        const { execSync } = await import('node:child_process');
        try {
          execSync(migrationCommand, { stdio: 'inherit' });
        } catch (error) {
          throw new Error(
            `Prisma migration failed: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }
    },

    async withTransaction<T>(
      fn: (ctx: DatabaseContext<TClient>) => Promise<T>
    ): Promise<T> {
      return client.$transaction(async (tx: any) => {
        const ctx: DatabaseContext<TClient> = {
          client: tx as TClient,
          inTransaction: true,
        };
        return prismaContext.run({ client: tx, inTransaction: true }, () =>
          fn(ctx)
        );
      }, transactionOptions);
    },

    async withClient<T>(
      fn: (ctx: DatabaseContext<TClient>) => Promise<T>
    ): Promise<T> {
      const ctx: DatabaseContext<TClient> = {
        client,
        inTransaction: false,
      };
      return prismaContext.run({ client, inTransaction: false }, () =>
        fn(ctx)
      );
    },
  };
}
