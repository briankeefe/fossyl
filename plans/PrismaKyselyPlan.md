# Prisma-Kysely Adapter Plan

## Overview

`@fossyl/prisma-kysely` is a **database adapter** that provides automatic transaction handling using AsyncLocalStorage and a proxy pattern. Prisma handles schema/migrations, Kysely handles queries.

## Package Info

- **Name**: `@fossyl/prisma-kysely`
- **Type**: Database Adapter
- **Peer Dependencies**: `@fossyl/core`, `kysely`, `prisma`

---

## Responsibilities

1. **Transaction Context**: AsyncLocalStorage-based transaction handling
2. **Proxy Pattern**: Automatic transaction detection for Kysely queries
3. **Auto-Migration**: Run `prisma db push` on startup (optional)
4. **Code Emission**: Generate setup code for framework adapters
5. **Type Bridge**: Ensure Prisma schema types work with Kysely

---

## How It Works

### The Problem
Handler code shouldn't need to know about transactions. This is infrastructure, not business logic.

### The Solution
Use AsyncLocalStorage + Proxy to automatically route queries through active transactions.

```typescript
// Handler code - no transaction awareness
handler: async ({ url }, auth) => {
  const user = await kq.selectFrom('users').where('id', '=', url.id).executeTakeFirst();
  return user;
}

// Generated wrapper handles transaction
const result = await withTransaction(async () => {
  return handler({ url: req.params }, auth);
  // kq queries inside automatically use transaction from context
});
```

---

## Package Structure

```
packages/prisma-kysely/
├── src/
│   ├── index.ts                      # Public exports
│   ├── adapter.ts                    # prismaKyselyAdapter() implementation
│   ├── context.ts                    # AsyncLocalStorage transaction context
│   ├── proxy.ts                      # Kysely proxy for transaction detection
│   ├── emitter.ts                    # Code emission for framework adapters
│   └── types.ts                      # Adapter-specific types
├── package.json
├── tsconfig.json
└── CLAUDE.md
```

---

## Public API

### `prismaKyselyAdapter(options)`

```typescript
import type { DatabaseAdapter } from '@fossyl/core';

export type PrismaKyselyAdapterOptions = {
  /** Path to Kysely client module (exports kq) */
  kysely: string;

  /** Run prisma db push on startup (default: false) */
  autoMigrate?: boolean;

  /** Use transactions by default (default: true) */
  defaultTransaction?: boolean;
};

export function prismaKyselyAdapter(options: PrismaKyselyAdapterOptions): DatabaseAdapter;
```

### Usage in Config

```typescript
// fossyl.config.ts
import { defineConfig } from '@fossyl/core';
import { expressAdapter } from '@fossyl/express';
import { prismaKyselyAdapter } from '@fossyl/prisma-kysely';

export default defineConfig({
  routes: './src/routes',
  output: './src/server.generated.ts',
  adapters: {
    framework: expressAdapter({ cors: true }),
    database: prismaKyselyAdapter({
      kysely: './src/lib/db',
      autoMigrate: true,
      defaultTransaction: true,
    }),
  },
});
```

---

## Transaction Context

### `src/context.ts`

AsyncLocalStorage-based transaction context.

```typescript
import { AsyncLocalStorage } from 'node:async_hooks';
import type { Transaction } from 'kysely';

// Store for active transaction
const transactionContext = new AsyncLocalStorage<Transaction<unknown>>();

/**
 * Get active transaction from context, if any
 */
export function getActiveTransaction(): Transaction<unknown> | undefined {
  return transactionContext.getStore();
}

/**
 * Run callback within a transaction context
 */
export async function withTransaction<T>(
  db: { transaction: () => { execute: <R>(cb: (tx: Transaction<unknown>) => Promise<R>) => Promise<R> } },
  callback: () => Promise<T>
): Promise<T> {
  return db.transaction().execute(async (tx) => {
    return transactionContext.run(tx, callback);
  });
}

/**
 * Run callback without transaction (even if parent has one)
 */
export async function withoutTransaction<T>(callback: () => Promise<T>): Promise<T> {
  return transactionContext.run(undefined as unknown as Transaction<unknown>, callback);
}

export { transactionContext };
```

---

## Kysely Proxy

### `src/proxy.ts`

Proxy that routes queries through active transaction.

```typescript
import type { Kysely, Transaction } from 'kysely';
import { getActiveTransaction } from './context';

/**
 * Create a proxy around Kysely that automatically uses
 * active transaction from AsyncLocalStorage context
 */
export function createTransactionProxy<DB>(db: Kysely<DB>): Kysely<DB> {
  return new Proxy(db, {
    get(target, prop, receiver) {
      // Check for active transaction
      const activeTx = getActiveTransaction();

      if (activeTx) {
        // Route to transaction
        return Reflect.get(activeTx, prop, activeTx);
      }

      // No active transaction, use base db
      return Reflect.get(target, prop, receiver);
    },
  });
}
```

---

## Adapter Implementation

### `src/adapter.ts`

```typescript
import type { DatabaseAdapter } from '@fossyl/core';
import type { PrismaKyselyAdapterOptions } from './types';
import { emitSetup, emitWrapper, emitStartup } from './emitter';

export function prismaKyselyAdapter(options: PrismaKyselyAdapterOptions): DatabaseAdapter {
  return {
    type: 'database',
    name: 'prisma-kysely',
    clientPath: options.kysely,
    defaultTransaction: options.defaultTransaction ?? true,
    autoMigrate: options.autoMigrate ?? false,

    emitSetup() {
      return emitSetup(options);
    },

    emitWrapper(handlerCode: string, useTransaction: boolean) {
      return emitWrapper(handlerCode, useTransaction);
    },

    emitStartup() {
      return emitStartup(options);
    },
  };
}
```

---

## Code Emitter

### `src/emitter.ts`

Generates code for framework adapters to include.

```typescript
import type { PrismaKyselyAdapterOptions } from './types';

/**
 * Emit setup code (imports, context, proxy)
 */
export function emitSetup(options: PrismaKyselyAdapterOptions): string {
  return `
// ============================================
// Database: Prisma-Kysely Transaction Context
// ============================================

import { AsyncLocalStorage } from 'node:async_hooks';
import type { Transaction } from 'kysely';
import { kq as _kq } from '${options.kysely}';

// Transaction context
const txContext = new AsyncLocalStorage<Transaction<unknown>>();

function getActiveTransaction(): Transaction<unknown> | undefined {
  return txContext.getStore();
}

// Proxy that routes queries through active transaction
const kq = new Proxy(_kq, {
  get(target, prop, receiver) {
    const activeTx = getActiveTransaction();
    if (activeTx) {
      return Reflect.get(activeTx, prop, activeTx);
    }
    return Reflect.get(target, prop, receiver);
  },
});

// Transaction wrapper
async function withTransaction<T>(callback: () => Promise<T>): Promise<T> {
  return _kq.transaction().execute(async (tx) => {
    return txContext.run(tx, callback);
  });
}
`.trim();
}

/**
 * Emit wrapper code for a handler
 */
export function emitWrapper(handlerCode: string, useTransaction: boolean): string {
  if (useTransaction) {
    return `await withTransaction(async () => {
  ${handlerCode}
})`;
  }

  return handlerCode;
}

/**
 * Emit startup code (migrations)
 */
export function emitStartup(options: PrismaKyselyAdapterOptions): string {
  if (!options.autoMigrate) {
    return '';
  }

  return `
// Auto-migrate on startup
if (process.env.NODE_ENV !== 'test') {
  const { execSync } = await import('child_process');
  console.log('Running database migrations...');
  execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
}
`.trim();
}
```

---

## Generated Output Example

When framework adapter composes with this database adapter:

```typescript
// server.generated.ts

import express, { Request, Response, NextFunction } from 'express';

// ============================================
// Database: Prisma-Kysely Transaction Context
// ============================================

import { AsyncLocalStorage } from 'node:async_hooks';
import type { Transaction } from 'kysely';
import { kq as _kq } from './lib/db';

const txContext = new AsyncLocalStorage<Transaction<unknown>>();

function getActiveTransaction(): Transaction<unknown> | undefined {
  return txContext.getStore();
}

const kq = new Proxy(_kq, {
  get(target, prop, receiver) {
    const activeTx = getActiveTransaction();
    if (activeTx) {
      return Reflect.get(activeTx, prop, activeTx);
    }
    return Reflect.get(target, prop, receiver);
  },
});

async function withTransaction<T>(callback: () => Promise<T>): Promise<T> {
  return _kq.transaction().execute(async (tx) => {
    return txContext.run(tx, callback);
  });
}

// Auto-migrate on startup
if (process.env.NODE_ENV !== 'test') {
  const { execSync } = await import('child_process');
  console.log('Running database migrations...');
  execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
}

// ============================================
// Routes
// ============================================

const app = express();
app.use(express.json());

const usersRouter = express.Router();

// GET /api/users/:id (with transaction)
usersRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = req.fossylAuth;
    const result = await withTransaction(async () => {
      // Handler code - kq automatically uses transaction
      const user = await kq.selectFrom('users').where('id', '=', req.params.id).executeTakeFirst();
      return user;
    });
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/health (no transaction - opted out)
usersRouter.get('/health', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // No withTransaction wrapper
    const result = { status: 'ok' };
    res.json({ data: result });
  } catch (error) {
    next(error);
  }
});

app.use('/api/users', usersRouter);

export { app };
```

---

## Route Transaction Opt-Out

Routes can opt out of default transaction behavior:

```typescript
// src/routes/users.ts
import { createRouter } from '@fossyl/core';

const router = createRouter('/api/users');

// Uses transaction (default)
export const getUser = router.endpoint('/:id').get({
  authenticator: jwtAuth,
  handler: async ({ url }, auth) => {
    return kq.selectFrom('users').where('id', '=', url.id).executeTakeFirst();
  },
});

// Opts out of transaction
export const healthCheck = router.endpoint('/health').get({
  transaction: false,  // No transaction for this route
  handler: async () => {
    return { status: 'ok', timestamp: Date.now() };
  },
});

export default [getUser, healthCheck];
```

Note: The `transaction` property needs to be added to route types in `@fossyl/core`.

---

## User's Kysely Setup

### `src/lib/db.ts`

User sets up Kysely with Prisma-generated types:

```typescript
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import type { DB } from 'prisma/kysely-types';  // Generated by prisma-kysely

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const kq = new Kysely<DB>({
  dialect: new PostgresDialect({ pool }),
});
```

### Type Generation

Use `prisma-kysely` package to generate Kysely types from Prisma schema:

```prisma
// prisma/schema.prisma
generator kysely {
  provider = "prisma-kysely"
  output   = "./kysely-types.ts"
}

model User {
  id    String @id @default(uuid())
  name  String
  email String @unique
}
```

---

## Package Configuration

### `package.json`

```json
{
  "name": "@fossyl/prisma-kysely",
  "version": "0.1.0",
  "description": "Prisma-Kysely database adapter for fossyl",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "peerDependencies": {
    "@fossyl/core": "^0.1.0",
    "kysely": "^0.27.0"
  },
  "devDependencies": {
    "@fossyl/core": "workspace:*",
    "kysely": "^0.27.0",
    "tsup": "^8.0.0",
    "typescript": "^5.8.0"
  }
}
```

---

## Implementation Order

1. Set up package structure
2. Implement `types.ts`
3. Implement `context.ts` (AsyncLocalStorage)
4. Implement `proxy.ts` (Kysely proxy)
5. Implement `emitter.ts` (code generation)
6. Implement `adapter.ts` (public API)
7. Update `@fossyl/core` to add `transaction` property to routes
8. Write tests
9. Write CLAUDE.md

---

## Success Criteria

- [ ] Transactions are automatic by default
- [ ] Routes can opt out with `transaction: false`
- [ ] AsyncLocalStorage context works across async calls
- [ ] Proxy correctly routes queries through active transaction
- [ ] Auto-migrate runs `prisma db push` on startup
- [ ] Generated code is readable and debuggable
- [ ] Works with any Kysely dialect (Postgres, SQLite, MySQL)
