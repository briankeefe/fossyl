# @fossyl/kysely - AI Development Guide

**Kysely runtime database adapter for fossyl**

This adapter provides:
- **Kysely** for type-safe query building
- **Migrations** with up/down support using Kysely's schema builder
- **AsyncLocalStorage** for transaction context propagation
- **Automatic transactions** for write operations

## Quick Start

```typescript
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { kyselyAdapter, createMigrationProvider } from '@fossyl/kysely';
import { expressAdapter } from '@fossyl/express';
import type { DB } from './generated/types';

const db = new Kysely<DB>({
  dialect: new PostgresDialect({
    pool: new Pool({ connectionString: process.env.DATABASE_URL }),
  }),
});

const migrations = createMigrationProvider({
  '001_create_users': {
    async up(db) {
      await db.schema
        .createTable('users')
        .addColumn('id', 'uuid', (col) => col.primaryKey())
        .addColumn('name', 'varchar(255)', (col) => col.notNull())
        .addColumn('email', 'varchar(255)', (col) => col.notNull().unique())
        .execute();
    },
    async down(db) {
      await db.schema.dropTable('users').execute();
    },
  },
});

const database = kyselyAdapter({ client: db, migrations, autoMigrate: true });
const adapter = expressAdapter({ database, cors: true });

adapter.register(routes);
await adapter.listen(3000);
```

## Adapter Options

```typescript
const database = kyselyAdapter({
  // Kysely instance (required)
  client: db,

  // Migration provider (optional)
  migrations?: MigrationProvider,

  // Run pending migrations on startup (default: false)
  autoMigrate?: boolean,

  // Use transactions by default for write operations (default: true)
  defaultTransaction?: boolean,
});
```

## Migrations

### Writing Migrations

Migrations are TypeScript objects with `up` and `down` functions:

```typescript
import { sql } from 'kysely';
import { defineMigration } from '@fossyl/kysely';

export default defineMigration({
  async up(db) {
    await db.schema
      .createTable('users')
      .addColumn('id', 'uuid', (col) =>
        col.primaryKey().defaultTo(sql`gen_random_uuid()`)
      )
      .addColumn('name', 'varchar(255)', (col) => col.notNull())
      .addColumn('email', 'varchar(255)', (col) => col.notNull().unique())
      .addColumn('created_at', 'timestamp', (col) =>
        col.notNull().defaultTo(sql`now()`)
      )
      .execute();

    await db.schema
      .createIndex('users_email_idx')
      .on('users')
      .column('email')
      .execute();
  },

  async down(db) {
    await db.schema.dropTable('users').execute();
  },
});
```

### Organizing Migrations

Use `createMigrationProvider` to bundle migrations:

```typescript
import { createMigrationProvider } from '@fossyl/kysely';

// Import individual migration files
import * as m001 from './migrations/001_create_users';
import * as m002 from './migrations/002_create_posts';
import * as m003 from './migrations/003_add_user_avatar';

export const migrations = createMigrationProvider({
  '001_create_users': m001.default,
  '002_create_posts': m002.default,
  '003_add_user_avatar': m003.default,
});
```

Migration names should be sortable (timestamps or numbered prefixes).

### Running Migrations Manually

```typescript
import { runMigrations, rollbackMigration, getMigrationStatus } from '@fossyl/kysely';

// Run all pending migrations
const result = await runMigrations(db, migrations);
console.log('Applied:', result.executed);

// Rollback the last migration
const rollback = await rollbackMigration(db, migrations);
console.log('Rolled back:', rollback.executed);

// Check migration status
const status = await getMigrationStatus(db, migrations);
console.log('Pending:', status.pending);
console.log('Executed:', status.executed);
```

## Accessing Database in Handlers

Use `getTransaction()` to access the current database client/transaction from anywhere in your call stack:

```typescript
import { getTransaction } from '@fossyl/kysely';
import type { DB } from './generated/types';

// In a service function called from your handler
async function createUser(name: string, email: string) {
  const db = getTransaction<DB>();
  return db
    .insertInto('users')
    .values({ name, email })
    .returningAll()
    .executeTakeFirstOrThrow();
}

async function getUserById(id: string) {
  const db = getTransaction<DB>();
  return db
    .selectFrom('users')
    .where('id', '=', id)
    .selectAll()
    .executeTakeFirst();
}
```

## Transaction Behavior

The framework adapter (`@fossyl/express`) automatically wraps handlers:

- **POST/PUT routes**: Wrapped with `withTransaction()` - all database operations run in a transaction that commits on success or rolls back on error
- **GET/DELETE routes**: Wrapped with `withClient()` - database operations run without a transaction

This is controlled by the `defaultTransaction` option.

## Type Generation

For existing databases, use `kysely-codegen` to generate types:

```bash
# Install
pnpm add -D kysely-codegen

# Generate types from database
DATABASE_URL=postgres://... npx kysely-codegen --out-file src/generated/types.ts
```

For new projects, define your types manually or generate them from your migrations.

## Package Exports

```typescript
// Main adapter factory
export { kyselyAdapter } from '@fossyl/kysely';

// Context accessor - use in services/handlers
export { getTransaction, transactionContext } from '@fossyl/kysely';

// Migration utilities
export {
  createMigrationProvider,
  defineMigration,
  runMigrations,
  rollbackMigration,
  getMigrationStatus,
} from '@fossyl/kysely';

// Types
export type {
  KyselyAdapterOptions,
  KyselyMigration,
  MigrationRecord,
  MigrationResult,
  TransactionContext,
} from '@fossyl/kysely';
```

## Error Handling

When `autoMigrate` is enabled, migration errors will cause startup to fail with a descriptive error message.

If `getTransaction()` is called outside of a database context (i.e., not within a handler wrapped by the framework adapter), it throws:

```
Error: No database context available
```

## Integration with Express Adapter

```typescript
import { createRouter } from 'fossyl';
import { expressAdapter } from '@fossyl/express';
import { kyselyAdapter, getTransaction, createMigrationProvider } from '@fossyl/kysely';

const router = createRouter('/api');

const routes = [
  router.createEndpoint('/users').post({
    validator: (data): { name: string; email: string } => data as any,
    handler: async ({ url }, body) => {
      const db = getTransaction<DB>();
      const user = await db
        .insertInto('users')
        .values(body)
        .returningAll()
        .executeTakeFirstOrThrow();
      return { typeName: 'User' as const, ...user };
    },
  }),
];

const migrations = createMigrationProvider({ /* ... */ });
const database = kyselyAdapter({ client: db, migrations, autoMigrate: true });
const adapter = expressAdapter({ database });
adapter.register(routes);
```

## Development Notes

- Migrations are tracked in a `kysely_migration` table automatically created by Kysely
- AsyncLocalStorage ensures transaction context is properly isolated per-request
- The `withTransaction` method uses Kysely's native transaction API which handles commit/rollback automatically
- Migration names are sorted alphabetically, so use numeric prefixes (001_, 002_) or timestamps
