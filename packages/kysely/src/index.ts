// Main adapter
export { kyselyAdapter } from './adapter';

// Context
export { getTransaction, transactionContext } from './context';
export type { TransactionContext } from './context';

// Migrations
export {
  createMigrationProvider,
  defineMigration,
  runMigrations,
  rollbackMigration,
  getMigrationStatus,
} from './migrations';
export type {
  KyselyMigration,
  MigrationRecord,
  MigrationResult,
} from './migrations';

// Types
export type { KyselyAdapterOptions } from './types';
