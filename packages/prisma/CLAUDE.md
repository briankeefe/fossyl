# @fossyl/prisma - AI Development Guide

**Prisma runtime database adapter for fossyl**

This adapter provides:
- **Prisma Client** for type-safe database access with auto-generated types from your schema
- **Interactive transactions** via `$transaction` with configurable timeout and isolation
- **AsyncLocalStorage** for client/transaction context propagation
- **Automatic migrations** on startup via Prisma CLI

## Quick Start

```typescript
import { PrismaClient } from '@prisma/client';
import { prismaAdapter } from '@fossyl/prisma';
import { expressAdapter } from '@fossyl/express';

const prisma = new PrismaClient();

const database = prismaAdapter({
  client: prisma,
  autoMigrate: true,
});

const adapter = expressAdapter({ database, cors: true });
adapter.register(routes);
await adapter.listen(3000);
```

## Adapter Options

```typescript
const database = prismaAdapter({
  // PrismaClient instance (required)
  client: prisma,

  // Run migrations on startup (default: false)
  autoMigrate?: boolean,

  // Use transactions by default for write operations (default: true)
  defaultTransaction?: boolean,

  // Default transaction options for all withTransaction calls (optional)
  transactionOptions?: {
    maxWait?: number,        // ms to acquire transaction (default: 2000)
    timeout?: number,        // ms for transaction execution (default: 5000)
    isolationLevel?: 'ReadUncommitted' | 'ReadCommitted' | 'RepeatableRead' | 'Snapshot' | 'Serializable',
  },

  // Shell command to run for migrations (default: 'npx prisma migrate deploy')
  migrationCommand?: string,
});
```

## Accessing the Database in Handlers

Use `getClient()` to access the current Prisma client or transaction client from anywhere in your call stack:

```typescript
import { getClient } from '@fossyl/prisma';
import type { PrismaClient } from '@prisma/client';

// In a service function called from your handler
async function createUser(name: string, email: string) {
  const db = getClient<PrismaClient>();
  return db.user.create({
    data: { name, email },
  });
}

async function getUserById(id: string) {
  const db = getClient<PrismaClient>();
  return db.user.findUnique({
    where: { id },
  });
}
```

## Transaction Behavior

The framework adapter (`@fossyl/express`) automatically wraps handlers:

- **POST/PUT routes** (validated/full): Wrapped with `withTransaction()` - all database operations run in a Prisma interactive transaction that commits on success or rolls back on error
- **GET/DELETE routes** (open/authenticated): Wrapped with `withClient()` - database operations run against the base PrismaClient without a transaction

This is controlled by the `defaultTransaction` option.

### Checking Transaction Status

```typescript
import { isInTransaction } from '@fossyl/prisma';

async function doSomething() {
  if (isInTransaction()) {
    // We're inside a transaction
  }
}
```

### Transaction Options

Configure transaction behavior globally:

```typescript
const database = prismaAdapter({
  client: prisma,
  transactionOptions: {
    maxWait: 5000,     // Wait up to 5s to acquire transaction
    timeout: 30000,    // Allow transactions to run for 30s
    isolationLevel: 'Serializable',
  },
});
```

## Migrations

Prisma migrations are CLI-driven. When `autoMigrate` is enabled, the adapter runs the migration command during `onStartup()`.

### Production (default)

```typescript
// Runs: npx prisma migrate deploy
prismaAdapter({ client: prisma, autoMigrate: true });
```

### Development

```typescript
// Runs: npx prisma db push
prismaAdapter({
  client: prisma,
  autoMigrate: true,
  migrationCommand: 'npx prisma db push',
});
```

### Custom Migration Command

```typescript
prismaAdapter({
  client: prisma,
  autoMigrate: true,
  migrationCommand: 'npx prisma migrate deploy --schema=./prisma/schema.prisma',
});
```

## Package Exports

```typescript
// Main adapter factory
export { prismaAdapter } from '@fossyl/prisma';

// Context accessor - use in services/handlers
export { getClient, isInTransaction, prismaContext } from '@fossyl/prisma';

// Types
export type {
  PrismaAdapterOptions,
  TransactionOptions,
  PrismaContext,
} from '@fossyl/prisma';
```

## Error Handling

When `autoMigrate` is enabled, migration errors will cause startup to fail with a descriptive error message.

If `getClient()` is called outside of a database context (i.e., not within a handler wrapped by the framework adapter), it throws:

```
Error: No Prisma context available. Ensure your code is called within a fossyl route handler.
```

## Integration with Express Adapter

```typescript
import { createRouter } from '@fossyl/core';
import { expressAdapter } from '@fossyl/express';
import { prismaAdapter, getClient } from '@fossyl/prisma';
import type { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const api = createRouter('/api');

const routes = [
  api.createEndpoint('/users').post({
    validator: (data): { name: string; email: string } => data as any,
    handler: async ({ url }, body) => {
      const db = getClient<PrismaClient>();
      const user = await db.user.create({ data: body });
      return { typeName: 'User' as const, ...user };
    },
  }),

  api.createEndpoint('/users/:id').get({
    handler: async ({ url }) => {
      const db = getClient<PrismaClient>();
      const user = await db.user.findUniqueOrThrow({
        where: { id: url.id },
      });
      return { typeName: 'User' as const, ...user };
    },
  }),
];

const database = prismaAdapter({ client: prisma, autoMigrate: true });
const adapter = expressAdapter({ database });
adapter.register(routes);
await adapter.listen(3000);
```

## Comparison with @fossyl/kysely

| Feature | @fossyl/prisma | @fossyl/kysely |
|---|---|---|
| Query style | Model-based (`db.user.create()`) | Query builder (`db.insertInto('users')`) |
| Schema | `schema.prisma` file | TypeScript types + migrations |
| Migrations | CLI-driven (`prisma migrate`) | Programmatic (Kysely Migrator) |
| Type generation | Auto from schema (`prisma generate`) | Manual or `kysely-codegen` |
| Transaction API | `$transaction` interactive | `client.transaction().execute()` |
| Context accessor | `getClient<PrismaClient>()` | `getTransaction<DB>()` |

## Development Notes

- AsyncLocalStorage ensures client/transaction context is properly isolated per-request
- The `withTransaction` method uses Prisma's interactive transaction API (`$transaction(async (tx) => ...)`) which handles commit/rollback automatically
- The transaction client (`tx`) has the same API as `PrismaClient` but all operations run within the transaction
- Prisma tracks migrations in a `_prisma_migrations` table automatically
- For existing databases, use `prisma db pull` to introspect and generate the schema
