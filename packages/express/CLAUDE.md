# @fossyl/express - AI Development Guide

**Express framework adapter for fossyl - generates optimized Express.js TypeScript code**

## Overview

`@fossyl/express` is a framework adapter that generates Express.js TypeScript code from fossyl routes. It implements the `FrameworkAdapter` interface from fossyl and produces production-ready, type-safe Express applications.

## Installation

```bash
pnpm add @fossyl/express
```

## Quick Start

```typescript
// fossyl.config.ts
import { defineConfig } from 'fossyl';
import { expressAdapter } from '@fossyl/express';

export default defineConfig({
  routes: './src/routes',
  output: './src/server.generated.ts',
  adapters: {
    framework: expressAdapter({
      cors: true,
      wrapResponses: true,
    }),
  },
});
```

## Configuration Options

```typescript
type ExpressAdapterOptions = {
  // Enable CORS (default: false)
  cors?: boolean | CorsOptions;

  // Wrap responses in { data: ... } (default: true)
  wrapResponses?: boolean;

  // Min routes to trigger middleware hoisting (default: 3)
  hoistThreshold?: number;
};

type CorsOptions = {
  origin?: string | string[];
  methods?: string;
  allowedHeaders?: string;
  credentials?: boolean;
};
```

## Architecture

### Package Structure

```
src/
├── index.ts                      # Public exports
├── adapter.ts                    # expressAdapter() implementation
├── types.ts                      # ExpressAdapterOptions, CorsOptions
├── error-codes.ts                # Branded error codes
├── generator/
│   ├── code-emitter.ts           # Main code generation orchestrator
│   ├── route-tree-builder.ts     # Builds hierarchical route tree
│   ├── middleware-analyzer.ts    # Detects shared middleware for hoisting
│   ├── handler-emitter.ts        # Emits individual route handlers
│   └── imports-collector.ts      # Collects and formats imports
└── templates/
    ├── app-setup.ts              # Express app boilerplate
    ├── middleware-factories.ts   # Auth/validation middleware templates
    ├── error-handlers.ts         # 404 and error handler templates
    └── cors.ts                   # CORS middleware template
```

### Key Components

1. **Route Tree Builder** (`route-tree-builder.ts`)
   - Converts flat route array to hierarchical tree
   - Enables efficient Express router generation
   - Sorts routes: static before dynamic params

2. **Middleware Analyzer** (`middleware-analyzer.ts`)
   - Detects shared authenticators/validators
   - Determines hoisting candidates (>= threshold routes)
   - Optimizes generated middleware placement

3. **Code Emitter** (`code-emitter.ts`)
   - Orchestrates all code generation
   - Produces complete Express TypeScript file
   - Integrates with database adapters

## Generated Code Features

### Route Ordering
Static routes are registered before dynamic params:
```typescript
// /users/list registered before /users/:id
router.get('/list', ...);  // First
router.get('/:id', ...);   // Second
```

### Middleware Hoisting
When 3+ routes share middleware, it's hoisted to router level:
```typescript
// Instead of per-route middleware:
const usersRouter = express.Router();
usersRouter.use(createAuthMiddleware(jwtAuth)); // Hoisted
```

### Error Handling
Branded error codes for type-safe error responses:
```typescript
ERROR_CODES.AUTHENTICATION_FAILED  // 1001
ERROR_CODES.VALIDATION_FAILED      // 2001
ERROR_CODES.RESOURCE_NOT_FOUND     // 3001
ERROR_CODES.INTERNAL_SERVER_ERROR  // 5001
```

### Database Integration
Composes with database adapters for transaction wrapping:
```typescript
// With database adapter configured
const result = await withTransaction(async () => {
  return handler({ url: req.params }, auth);
});
```

## API Reference

### `expressAdapter(options?)`

Creates a fossyl FrameworkAdapter for Express.

```typescript
import { expressAdapter } from '@fossyl/express';

const adapter = expressAdapter({
  cors: true,
  wrapResponses: true,
  hoistThreshold: 3,
});
```

### Error Utilities

```typescript
import { ERROR_CODES, createErrorResponse } from '@fossyl/express';

// Create typed error response
const error = createErrorResponse(
  401,
  ERROR_CODES.AUTHENTICATION_FAILED,
  'Invalid token'
);
```

### Route Tree Utilities

```typescript
import { buildRouteTree, groupRoutesByPrefix } from '@fossyl/express';

// Build hierarchical route tree
const tree = buildRouteTree(routes);

// Group routes by common prefix
const groups = groupRoutesByPrefix(routes);
```

## Generated Output Example

Input route:
```typescript
// src/routes/users.ts
const router = createRouter('/api/users');

export const getUser = router.createEndpoint('/:id').get({
  authenticator: jwtAuth,
  handler: async ({ url }, auth) => {
    return { id: url.id, userId: auth.userId };
  },
});
```

Generated output:
```typescript
// src/server.generated.ts
import express, { Request, Response, NextFunction } from 'express';
import { getUser } from './routes/users';

const app = express();
app.use(express.json());

function createAuthMiddleware<TAuth>(
  authenticator: (headers: Record<string, string | undefined>) => Promise<TAuth> | TAuth
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = await authenticator(req.headers as Record<string, string | undefined>);
      req.fossylAuth = auth;
      next();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      res.status(401).json(createErrorResponse(401, ERROR_CODES.AUTHENTICATION_FAILED, message));
    }
  };
}

const apiUsersRouter = express.Router();

apiUsersRouter.get('/:id',
  createAuthMiddleware(getUser.authenticator),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = req.fossylAuth;
      const result = await getUser.handler({ url: req.params }, auth);
      res.json(wrapResponse(result));
    } catch (error) {
      next(error);
    }
  }
);

app.use('/api/users', apiUsersRouter);

export { app };
```

## Development

### Type Checking
```bash
pnpm run typecheck
```

### Building
```bash
pnpm run build
```

## Contributing

When modifying this package:

1. **Maintain zero `any` types** - Use proper TypeScript types throughout
2. **Test generated output** - Ensure generated code compiles and runs
3. **Follow route ordering** - Static routes must come before dynamic
4. **Preserve middleware semantics** - Auth before validation before handler
5. **Error codes are branded** - Don't use plain numbers for error codes
