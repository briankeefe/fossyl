import { AsyncLocalStorage } from 'node:async_hooks';
import type { Kysely, Transaction } from 'kysely';

/**
 * Transaction context stored in AsyncLocalStorage.
 */
export type TransactionContext<DB> = {
  trx: Transaction<DB> | Kysely<DB>;
  inTransaction: boolean;
};

/**
 * Internal storage type for AsyncLocalStorage.
 * Uses `any` internally to avoid variance issues with Kysely's complex types.
 */
type InternalTransactionContext = {
  trx: any;
  inTransaction: boolean;
};

/**
 * AsyncLocalStorage instance for managing transaction context.
 * This allows the transaction/client to be accessed anywhere in the call stack.
 */
export const transactionContext =
  new AsyncLocalStorage<InternalTransactionContext>();

/**
 * Get the current transaction or client from AsyncLocalStorage.
 * Use this in your service layer to access the database client.
 *
 * @throws Error if called outside of a database context
 *
 * @example
 * ```typescript
 * import { getTransaction } from '@fossyl/prisma-kysely';
 *
 * async function createUser(name: string) {
 *   const db = getTransaction<DB>();
 *   return db.insertInto('users').values({ name }).execute();
 * }
 * ```
 */
export function getTransaction<DB>(): Transaction<DB> | Kysely<DB> {
  const ctx = transactionContext.getStore();
  if (!ctx) {
    throw new Error('No database context available');
  }
  return ctx.trx as Transaction<DB> | Kysely<DB>;
}
