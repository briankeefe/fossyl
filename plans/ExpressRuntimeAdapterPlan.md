# Express Runtime Adapter Plan

## Overview

`@fossyl/express` is a **runtime framework adapter** that registers fossyl routes with Express.js at runtime. No code generation - routes are wired up dynamically when the server starts.

## Package Info

- **Name**: `@fossyl/express`
- **Type**: Framework Adapter (Runtime)
- **Peer Dependencies**: `@fossyl/core`, `express`

---

## Core Architecture

### Context via AsyncLocalStorage

Every request gets an isolated context accessible anywhere in the call stack:

```typescript
import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestContext = {
  readonly requestId: string;
  readonly databaseContext?: DatabaseContext;
  readonly logger: Logger;
};

export const requestContext = new AsyncLocalStorage<RequestContext>();

// Access anywhere in handler code
export function getContext(): RequestContext {
  const ctx = requestContext.getStore();
  if (!ctx) throw new Error('No request context available');
  return ctx;
}
```

### Route Registration Flow

```
1. expressAdapter() creates adapter with Express app
2. adapter.register(routes) iterates routes
3. For each route:
   a. Sort routes (static paths before dynamic :params)
   b. Create Express handler that:
      - Sets up RequestContext via AsyncLocalStorage
      - Runs authentication if configured
      - Validates body if configured
      - Calls handler with correct params based on route type
      - Wraps in transaction if DatabaseAdapter configured
      - Returns JSON response
      - Catches errors and returns standardized error response
4. adapter.listen(port) starts server
```

---

## Package Structure

```
packages/express/
├── src/
│   ├── index.ts              # Public exports
│   ├── adapter.ts            # expressAdapter() implementation
│   ├── context.ts            # AsyncLocalStorage context management
│   ├── register.ts           # Route registration logic
│   ├── handlers.ts           # Route handler factory for each route type
│   ├── errors.ts             # Error codes and response formatting
│   ├── sorting.ts            # Route sorting (static before dynamic)
│   └── types.ts              # Express-specific types
├── package.json
├── tsconfig.json
└── CLAUDE.md
```

---

## Public API

### `expressAdapter(options)`

```typescript
import type { FrameworkAdapter } from '@fossyl/core';
import type { Application } from 'express';

export type ExpressAdapterOptions = {
  /** Existing Express app (optional - creates one if not provided) */
  app?: Application;

  /** Enable CORS (default: false) */
  cors?: boolean | CorsOptions;

  /** Wrap successful responses in { data: ... } (default: false) */
  wrapResponses?: boolean;

  /** Database adapter for transaction support */
  database?: DatabaseAdapter;

  /** Custom logger factory (default: console) */
  logger?: (requestId: string) => Logger;
};

export type CorsOptions = {
  origin?: string | string[] | boolean;
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
};

export type Logger = {
  info: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, meta?: Record<string, unknown>) => void;
};

export function expressAdapter(options?: ExpressAdapterOptions): FrameworkAdapter<Application>;
```

### Usage

```typescript
import express from 'express';
import { expressAdapter } from '@fossyl/express';
import { routes } from './routes';

const adapter = expressAdapter({
  cors: true,
  wrapResponses: true,
});

adapter.register(routes);
await adapter.listen(3000);
```

### With Database Adapter

```typescript
import { expressAdapter } from '@fossyl/express';
import { prismaKyselyAdapter } from '@fossyl/prisma-kysely';
import { db } from './db';

const database = prismaKyselyAdapter({ client: db });
const adapter = expressAdapter({ database });

// Routes automatically get transaction support
adapter.register(routes);
await adapter.listen(3000);
```

---

## Context Management

### `src/context.ts`

```typescript
import { AsyncLocalStorage } from 'node:async_hooks';
import type { DatabaseContext } from '@fossyl/core';

export type Logger = {
  info: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, meta?: Record<string, unknown>) => void;
};

export type RequestContext = {
  readonly requestId: string;
  readonly databaseContext?: DatabaseContext;
  readonly logger: Logger;
};

export const requestContext = new AsyncLocalStorage<RequestContext>();

export function getContext(): RequestContext {
  const ctx = requestContext.getStore();
  if (!ctx) {
    throw new Error('No request context - are you inside a route handler?');
  }
  return ctx;
}

export function getDb<TClient>(): TClient {
  const ctx = getContext();
  if (!ctx.databaseContext) {
    throw new Error('No database context - did you configure a database adapter?');
  }
  return ctx.databaseContext.client as TClient;
}

export function getLogger(): Logger {
  return getContext().logger;
}

export function getRequestId(): string {
  return getContext().requestId;
}
```

---

## Route Sorting

### `src/sorting.ts`

Static paths must be registered before dynamic params to avoid Express matching issues.

```typescript
import type { Route } from '@fossyl/core';

export function sortRoutes(routes: Route[]): Route[] {
  return [...routes].sort((a, b) => {
    const aSegments = a.path.split('/');
    const bSegments = b.path.split('/');

    // Compare segment by segment
    const maxLen = Math.max(aSegments.length, bSegments.length);
    for (let i = 0; i < maxLen; i++) {
      const aSeg = aSegments[i] ?? '';
      const bSeg = bSegments[i] ?? '';

      const aIsParam = aSeg.startsWith(':');
      const bIsParam = bSeg.startsWith(':');

      // Static segments come before dynamic
      if (!aIsParam && bIsParam) return -1;
      if (aIsParam && !bIsParam) return 1;

      // Both static or both dynamic - alphabetical
      const cmp = aSeg.localeCompare(bSeg);
      if (cmp !== 0) return cmp;
    }

    // Shorter paths first
    return aSegments.length - bSegments.length;
  });
}
```

**Example ordering:**
```
/users/list      <- static, comes first
/users/search
/users/:id       <- dynamic, comes after static
/users/:id/posts
```

---

## Handler Factory

### `src/handlers.ts`

Creates Express handlers based on route type:

```typescript
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { Route, OpenRoute, AuthenticatedRoute, ValidatedRoute, FullRoute } from '@fossyl/core';
import { requestContext, type RequestContext } from './context';
import { createErrorResponse, ERROR_CODES } from './errors';
import type { ExpressAdapterOptions } from './types';

export function createHandler(
  route: Route,
  options: ExpressAdapterOptions
): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const requestId = crypto.randomUUID();
    const logger = options.logger?.(requestId) ?? createDefaultLogger(requestId);

    const ctx: RequestContext = {
      requestId,
      logger,
      databaseContext: undefined, // Set by transaction wrapper
    };

    try {
      await requestContext.run(ctx, async () => {
        const result = await executeRoute(route, req, options);
        const body = options.wrapResponses ? { data: result } : result;
        res.json(body);
      });
    } catch (error) {
      handleError(error, res, logger);
    }
  };
}

async function executeRoute(
  route: Route,
  req: Request,
  options: ExpressAdapterOptions
): Promise<unknown> {
  const params = { url: req.params, query: req.query };

  // Determine route type and execute accordingly
  if (isFullRoute(route)) {
    const auth = await route.authenticator(req.headers as Record<string, string>);
    const body = await route.validator(req.body);
    return options.database
      ? options.database.withTransaction((dbCtx) => {
          // Update context with database
          return route.handler(params, auth, body);
        })
      : route.handler(params, auth, body);
  }

  if (isAuthenticatedRoute(route)) {
    const auth = await route.authenticator(req.headers as Record<string, string>);
    return options.database
      ? options.database.withClient((dbCtx) => route.handler(params, auth))
      : route.handler(params, auth);
  }

  if (isValidatedRoute(route)) {
    const body = await route.validator(req.body);
    return options.database
      ? options.database.withTransaction((dbCtx) => route.handler(params, body))
      : route.handler(params, body);
  }

  // OpenRoute
  return options.database
    ? options.database.withClient((dbCtx) => route.handler(params))
    : route.handler(params);
}
```

---

## Error Handling

### `src/errors.ts`

```typescript
declare const errorCodeBrand: unique symbol;
export type ErrorCode = number & { readonly [errorCodeBrand]: 'ErrorCode' };

function createErrorCode(code: number): ErrorCode {
  return code as ErrorCode;
}

export const ERROR_CODES = {
  // Authentication (1000-1999)
  AUTHENTICATION_REQUIRED: createErrorCode(1001),
  AUTHENTICATION_FAILED: createErrorCode(1002),
  INVALID_TOKEN: createErrorCode(1003),

  // Validation (2000-2999)
  VALIDATION_FAILED: createErrorCode(2001),
  INVALID_REQUEST_BODY: createErrorCode(2002),
  INVALID_QUERY_PARAMS: createErrorCode(2003),

  // Resources (3000-3999)
  NOT_FOUND: createErrorCode(3001),
  CONFLICT: createErrorCode(3002),

  // Server (5000-5999)
  INTERNAL_ERROR: createErrorCode(5001),
} as const;

export type ErrorResponse = {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
};

export function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: unknown
): ErrorResponse {
  return {
    error: { code, message, details },
  };
}

export function handleError(
  error: unknown,
  res: Response,
  logger: Logger
): void {
  logger.error('Request failed', { error });

  if (error instanceof AuthenticationError) {
    res.status(401).json(
      createErrorResponse(ERROR_CODES.AUTHENTICATION_FAILED, error.message)
    );
    return;
  }

  if (error instanceof ValidationError) {
    res.status(400).json(
      createErrorResponse(ERROR_CODES.VALIDATION_FAILED, error.message, error.details)
    );
    return;
  }

  // Unknown error
  const message = error instanceof Error ? error.message : 'Internal server error';
  res.status(500).json(
    createErrorResponse(ERROR_CODES.INTERNAL_ERROR, message)
  );
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public details?: unknown) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

---

## Main Adapter

### `src/adapter.ts`

```typescript
import express, { type Application } from 'express';
import type { FrameworkAdapter, Route, DatabaseAdapter } from '@fossyl/core';
import type { ExpressAdapterOptions } from './types';
import { sortRoutes } from './sorting';
import { createHandler } from './handlers';
import type { Server } from 'node:http';

export function expressAdapter(
  options: ExpressAdapterOptions = {}
): FrameworkAdapter<Application> {
  const app = options.app ?? express();
  let server: Server | null = null;

  // Setup middleware
  app.use(express.json());

  if (options.cors) {
    app.use(createCorsMiddleware(options.cors));
  }

  return {
    type: 'framework',
    name: 'express',
    app,

    register(routes: Route[]): void {
      const sorted = sortRoutes(routes);

      for (const route of sorted) {
        const method = route.method.toLowerCase() as 'get' | 'post' | 'put' | 'delete';
        const handler = createHandler(route, options);

        app[method](route.path, handler);
      }

      // 404 handler
      app.use((req, res) => {
        res.status(404).json({
          error: {
            code: 3001,
            message: `Not found: ${req.method} ${req.path}`,
          },
        });
      });

      // Error handler
      app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
        console.error('Unhandled error:', err);
        res.status(500).json({
          error: {
            code: 5001,
            message: err.message || 'Internal server error',
          },
        });
      });
    },

    async listen(port: number): Promise<void> {
      // Run database startup if configured
      if (options.database) {
        await options.database.onStartup();
      }

      return new Promise((resolve) => {
        server = app.listen(port, () => {
          console.log(`Server listening on port ${port}`);
          resolve();
        });
      });
    },

    async close(): Promise<void> {
      return new Promise((resolve, reject) => {
        if (!server) {
          resolve();
          return;
        }
        server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    },
  };
}
```

---

## Usage Examples

### Basic Usage

```typescript
import { createRouter } from '@fossyl/core';
import { expressAdapter } from '@fossyl/express';

// Define routes
const router = createRouter('/api');

const getUsers = router.createEndpoint('/users').get({
  handler: async () => {
    return { users: [] };
  },
});

const getUser = router.createEndpoint('/users/:id').get({
  handler: async ({ url }) => {
    return { id: url.id, name: 'John' };
  },
});

// Create and start server
const adapter = expressAdapter({ cors: true });
adapter.register([getUsers, getUser]);
await adapter.listen(3000);
```

### With Authentication

```typescript
import { authWrapper } from '@fossyl/core';

const auth = async (headers: Record<string, string>) => {
  const token = headers['authorization'];
  if (!token) throw new AuthenticationError('Missing token');
  // Validate token...
  return authWrapper({ userId: '123', role: 'admin' });
};

const protectedRoute = router.createEndpoint('/admin/stats').get({
  authenticator: auth,
  handler: async ({ url }, auth) => {
    return { userId: auth.userId, stats: {} };
  },
});
```

### With Database

```typescript
import { expressAdapter } from '@fossyl/express';
import { prismaKyselyAdapter } from '@fossyl/prisma-kysely';
import { getDb } from '@fossyl/express';

const adapter = expressAdapter({
  database: prismaKyselyAdapter({ client: db }),
});

const createUser = router.createEndpoint('/users').post({
  validator: (data) => data as { name: string; email: string },
  handler: async ({ url }, body) => {
    // getDb() returns the database client from context
    const db = getDb();
    const user = await db.insertInto('users').values(body).execute();
    return user;
  },
});
```

### Accessing Context in Deep Functions

```typescript
import { getContext, getLogger, getRequestId } from '@fossyl/express';

// In any function called from a route handler
async function processOrder(orderId: string) {
  const logger = getLogger();
  const requestId = getRequestId();

  logger.info('Processing order', { orderId, requestId });

  // Database access
  const db = getDb();
  // ...
}
```

---

## Implementation Order

1. Set up package structure and dependencies
2. Implement `types.ts` - adapter options, logger types
3. Implement `errors.ts` - error codes and response formatting
4. Implement `context.ts` - AsyncLocalStorage setup
5. Implement `sorting.ts` - route sorting logic
6. Implement `handlers.ts` - route handler factory
7. Implement `adapter.ts` - main adapter implementation
8. Implement `index.ts` - public exports
9. Write tests
10. Write CLAUDE.md

---

## Success Criteria

- [ ] Routes register and respond correctly at runtime
- [ ] Static routes are matched before dynamic params
- [ ] All four route types work (open, authenticated, validated, full)
- [ ] Context is accessible via AsyncLocalStorage in handlers
- [ ] Database adapter integration works (transactions)
- [ ] Error responses use branded error codes
- [ ] CORS configuration works
- [ ] Server starts and stops cleanly
- [ ] Zero `any` types in implementation
