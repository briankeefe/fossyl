import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Prisma context stored in AsyncLocalStorage.
 *
 * Contains either the base PrismaClient or an interactive transaction client,
 * along with a flag indicating whether the current context is transactional.
 */
export type PrismaContext = {
  client: any;
  inTransaction: boolean;
};

/**
 * AsyncLocalStorage instance for managing Prisma client context.
 * This allows the client/transaction to be accessed anywhere in the call stack
 * without explicit parameter passing.
 */
export const prismaContext = new AsyncLocalStorage<PrismaContext>();

/**
 * Get the current Prisma client or transaction client from AsyncLocalStorage.
 * Use this in your service layer to access the database client.
 *
 * When called inside a `withTransaction` context, returns the transaction client.
 * When called inside a `withClient` context, returns the base PrismaClient.
 *
 * @throws Error if called outside of a database context
 *
 * @example
 * ```typescript
 * import { getClient } from '@fossyl/prisma';
 * import type { PrismaClient } from '@prisma/client';
 *
 * async function createUser(name: string, email: string) {
 *   const db = getClient<PrismaClient>();
 *   return db.user.create({ data: { name, email } });
 * }
 * ```
 */
export function getClient<T = unknown>(): T {
  const ctx = prismaContext.getStore();
  if (!ctx) {
    throw new Error(
      'No Prisma context available. ' +
        'Ensure your code is called within a fossyl route handler.'
    );
  }
  return ctx.client as T;
}

/**
 * Check whether the current context is inside a transaction.
 *
 * @returns `true` if inside a `withTransaction` call, `false` otherwise.
 *          Returns `false` if called outside any database context.
 */
export function isInTransaction(): boolean {
  const ctx = prismaContext.getStore();
  return ctx?.inTransaction ?? false;
}
