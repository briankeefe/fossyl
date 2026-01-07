# Express Adapter Plan

## Overview

`@fossyl/express` is a **framework adapter** that generates optimized Express.js TypeScript code from fossyl routes. It implements the `FrameworkAdapter` interface from `@fossyl/core`.

## Package Info

- **Name**: `@fossyl/express`
- **Type**: Framework Adapter
- **Peer Dependencies**: `@fossyl/core`, `express`

---

## Responsibilities

1. **Code Generation**: Emit readable Express.js TypeScript code
2. **Route Tree Building**: Group routes by path prefix for efficient Express routers
3. **Route Ordering**: Static routes before dynamic params (`/users/list` before `/users/:id`)
4. **Middleware Hoisting**: Detect shared middleware and hoist to router level
5. **Database Integration**: Compose with database adapter for transaction wrapping
6. **Error Handling**: Standardized error responses with branded error codes

---

## Package Structure

```
packages/express/
├── src/
│   ├── index.ts                      # Public exports
│   ├── adapter.ts                    # expressAdapter() implementation
│   ├── generator/
│   │   ├── code-emitter.ts           # Main code generation
│   │   ├── route-tree-builder.ts     # Builds route tree from flat array
│   │   ├── middleware-analyzer.ts    # Detects shared middleware
│   │   ├── handler-emitter.ts        # Emits individual route handlers
│   │   └── imports-collector.ts      # Collects required imports
│   ├── templates/
│   │   ├── app-setup.ts              # Express app boilerplate
│   │   ├── middleware-factories.ts   # Auth/validation middleware templates
│   │   ├── error-handlers.ts         # 404 and error handler templates
│   │   └── cors.ts                   # CORS middleware template
│   ├── error-codes.ts                # Branded error codes registry
│   └── types.ts                      # Express-specific types
├── package.json
├── tsconfig.json
└── CLAUDE.md
```

---

## Public API

### `expressAdapter(options)`

```typescript
import type { FrameworkAdapter } from '@fossyl/core';

export type ExpressAdapterOptions = {
  /** Enable CORS (default: false) */
  cors?: boolean | CorsOptions;

  /** Wrap responses in { data: ... } (default: true) */
  wrapResponses?: boolean;

  /** Min routes to trigger middleware hoisting (default: 3) */
  hoistThreshold?: number;
};

export type CorsOptions = {
  origin?: string | string[];
  methods?: string;
  allowedHeaders?: string;
  credentials?: boolean;
};

export function expressAdapter(options?: ExpressAdapterOptions): FrameworkAdapter;
```

### Usage in Config

```typescript
// fossyl.config.ts
import { defineConfig } from '@fossyl/core';
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

---

## Adapter Implementation

### `src/adapter.ts`

```typescript
import type { FrameworkAdapter, RouteInfo, GeneratorContext } from '@fossyl/core';
import type { ExpressAdapterOptions } from './types';
import { buildRouteTree } from './generator/route-tree-builder';
import { analyzeMiddleware } from './generator/middleware-analyzer';
import { emitExpressApp } from './generator/code-emitter';

export function expressAdapter(options: ExpressAdapterOptions = {}): FrameworkAdapter {
  return {
    type: 'framework',
    name: 'express',

    generate(routes: RouteInfo[], ctx: GeneratorContext): string {
      const tree = buildRouteTree(routes);
      const analyzed = analyzeMiddleware(routes, options.hoistThreshold ?? 3);

      return emitExpressApp(tree, routes, analyzed, {
        ...options,
        outputPath: ctx.outputPath,
        routesPath: ctx.routesPath,
        databaseAdapter: ctx.databaseAdapter,
      });
    },
  };
}
```

---

## Route Tree Builder

### `src/generator/route-tree-builder.ts`

Builds a tree structure from flat routes for efficient Express router generation.

```typescript
import type { RouteInfo } from '@fossyl/core';

export type RouteNode = {
  segment: string;
  fullPath: string;
  routes: RouteInfo[];
  children: Map<string, RouteNode>;
  isParam: boolean;
};

export function buildRouteTree(routes: RouteInfo[]): RouteNode {
  const root: RouteNode = {
    segment: '',
    fullPath: '',
    routes: [],
    children: new Map(),
    isParam: false,
  };

  for (const routeInfo of routes) {
    insertRoute(root, routeInfo);
  }

  sortRouteTree(root);
  return root;
}

function insertRoute(node: RouteNode, routeInfo: RouteInfo): void {
  const segments = routeInfo.route.path.split('/').filter(Boolean);
  let current = node;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const isParam = segment.startsWith(':');

    if (!current.children.has(segment)) {
      current.children.set(segment, {
        segment,
        fullPath: '/' + segments.slice(0, i + 1).join('/'),
        routes: [],
        children: new Map(),
        isParam,
      });
    }

    current = current.children.get(segment)!;
  }

  current.routes.push(routeInfo);
}

function sortRouteTree(node: RouteNode): void {
  // Static paths first, then dynamic params
  // Ensures /users/list is registered before /users/:id
  const entries = Array.from(node.children.entries()).sort(
    ([_aKey, aNode], [_bKey, bNode]) => {
      if (!aNode.isParam && bNode.isParam) return -1;
      if (aNode.isParam && !bNode.isParam) return 1;
      return aNode.segment.localeCompare(bNode.segment);
    }
  );

  node.children = new Map(entries);

  for (const child of node.children.values()) {
    sortRouteTree(child);
  }
}
```

---

## Middleware Analyzer

### `src/generator/middleware-analyzer.ts`

Detects shared middleware for hoisting decisions.

```typescript
import type { RouteInfo } from '@fossyl/core';

export type AnalyzedMiddleware = {
  authenticators: Map<string, RouteInfo[]>;
  validators: Map<string, RouteInfo[]>;
};

export function analyzeMiddleware(
  routes: RouteInfo[],
  hoistThreshold: number = 3
): AnalyzedMiddleware {
  const authenticators = new Map<string, RouteInfo[]>();
  const validators = new Map<string, RouteInfo[]>();

  for (const routeInfo of routes) {
    const route = routeInfo.route;

    if ('authenticator' in route && route.authenticator) {
      const name = route.authenticator.name || 'anonymous';
      const existing = authenticators.get(name) ?? [];
      authenticators.set(name, [...existing, routeInfo]);
    }

    if ('validator' in route && route.validator) {
      const name = route.validator.name || 'anonymous';
      const existing = validators.get(name) ?? [];
      validators.set(name, [...existing, routeInfo]);
    }
  }

  // Filter: only keep if >= threshold routes share it
  return {
    authenticators: filterByThreshold(authenticators, hoistThreshold),
    validators: filterByThreshold(validators, hoistThreshold),
  };
}

function filterByThreshold<T>(
  map: Map<string, T[]>,
  threshold: number
): Map<string, T[]> {
  return new Map(
    Array.from(map.entries()).filter(([_, items]) => items.length >= threshold)
  );
}
```

---

## Code Emitter

### `src/generator/code-emitter.ts`

Generates the final Express TypeScript code.

```typescript
import type { RouteInfo } from '@fossyl/core';
import type { RouteNode } from './route-tree-builder';
import type { AnalyzedMiddleware } from './middleware-analyzer';
import type { ExpressAdapterOptions } from '../types';
import type { DatabaseAdapter } from '@fossyl/core';

type EmitOptions = ExpressAdapterOptions & {
  outputPath: string;
  routesPath: string;
  databaseAdapter?: DatabaseAdapter;
};

export function emitExpressApp(
  tree: RouteNode,
  routes: RouteInfo[],
  analyzed: AnalyzedMiddleware,
  options: EmitOptions
): string {
  const imports = collectImports(routes, options);
  const setup = emitAppSetup(options);
  const middlewareFactories = emitMiddlewareFactories(options);
  const routers = emitRouterTree(tree, analyzed, options);
  const errorHandlers = emitErrorHandlers();

  return `
// ============================================
// Generated by fossyl with @fossyl/express
// Do not edit - regenerate with: npx fossyl build
// ============================================

${imports}

${setup}

${middlewareFactories}

${routers}

${errorHandlers}

export { app };
`.trim();
}
```

---

## Database Adapter Integration

When a database adapter is configured, the Express adapter composes with it:

```typescript
// Without database adapter
usersRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await handler({ url: req.params }, auth);
    res.json(wrapResponse(result));
  } catch (error) {
    next(error);
  }
});

// With database adapter (transaction wrapper)
usersRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await withTransaction(async () => {
      return handler({ url: req.params }, auth);
    });
    res.json(wrapResponse(result));
  } catch (error) {
    next(error);
  }
});
```

The `withTransaction` wrapper is provided by the database adapter's `emitWrapper()` method.

---

## Error Codes

### `src/error-codes.ts`

Branded error codes for type-safe error handling.

```typescript
declare const errorCodeBrand: unique symbol;
export type ErrorCode = number & { readonly [errorCodeBrand]: 'ErrorCode' };

function createErrorCode(code: number): ErrorCode {
  return code as ErrorCode;
}

export const ERROR_CODES = {
  // Authentication (1000-1999)
  AUTHENTICATION_FAILED: createErrorCode(1001),
  INVALID_TOKEN: createErrorCode(1002),
  TOKEN_EXPIRED: createErrorCode(1003),

  // Validation (2000-2999)
  VALIDATION_FAILED: createErrorCode(2001),
  INVALID_REQUEST_BODY: createErrorCode(2002),
  INVALID_QUERY_PARAMETERS: createErrorCode(2003),

  // Resources (3000-3999)
  RESOURCE_NOT_FOUND: createErrorCode(3001),
  RESOURCE_CONFLICT: createErrorCode(3002),

  // Internal (5000-5999)
  INTERNAL_SERVER_ERROR: createErrorCode(5001),
} as const;

export type ErrorResponse = {
  status_code: number;
  error_code: ErrorCode;
  message: string;
};

export function createErrorResponse(
  statusCode: number,
  errorCode: ErrorCode,
  message: string
): ErrorResponse {
  return { status_code: statusCode, error_code: errorCode, message };
}
```

---

## Generated Output Example

Input route:
```typescript
// src/routes/users.ts
import { createRouter } from '@fossyl/core';
import { jwtAuth } from '../middleware/auth';

const router = createRouter('/api/users');

export const getUser = router.get('/:id', {
  authenticator: jwtAuth,
  handler: async ({ url }, auth) => {
    return { id: url.id, userId: auth.userId };
  },
});

export default [getUser];
```

Generated output:
```typescript
// src/server.generated.ts
import express, { Request, Response, NextFunction } from 'express';
import { jwtAuth } from './middleware/auth';
import { ERROR_CODES, createErrorResponse } from '@fossyl/express';

const app = express();
app.use(express.json());

declare global {
  namespace Express {
    interface Request {
      fossylAuth?: unknown;
      fossylBody?: unknown;
    }
  }
}

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

// Routes: /api/users
const usersRouter = express.Router();

usersRouter.get('/:id',
  createAuthMiddleware(jwtAuth),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth = req.fossylAuth as { userId: string };
      const result = await (async () => {
        return { id: req.params.id, userId: auth.userId };
      })();
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  }
);

app.use('/api/users', usersRouter);

// Error handlers
app.use((req: Request, res: Response) => {
  res.status(404).json(
    createErrorResponse(404, ERROR_CODES.RESOURCE_NOT_FOUND, `Route not found: ${req.method} ${req.path}`)
  );
});

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error('Express error:', err);
  res.status(500).json(
    createErrorResponse(500, ERROR_CODES.INTERNAL_SERVER_ERROR, err.message || 'Internal Server Error')
  );
});

export { app };
```

---

## Package Configuration

### `package.json`

```json
{
  "name": "@fossyl/express",
  "version": "0.1.0",
  "description": "Express framework adapter for fossyl",
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
    "@fossyl/core": "^0.1.0"
  },
  "devDependencies": {
    "@fossyl/core": "workspace:*",
    "@types/express": "^5.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.8.0"
  }
}
```

---

## Implementation Order

1. Set up package structure
2. Implement `types.ts` and `error-codes.ts`
3. Implement `route-tree-builder.ts`
4. Implement `middleware-analyzer.ts`
5. Implement code emitter templates
6. Implement `code-emitter.ts` (main orchestration)
7. Implement `adapter.ts` (public API)
8. Write tests
9. Write CLAUDE.md

---

## Success Criteria

- [ ] Generates valid, runnable Express TypeScript code
- [ ] Static routes ordered before dynamic params
- [ ] Middleware hoisting works correctly
- [ ] Integrates with database adapter for transaction wrapping
- [ ] Error responses use branded error codes
- [ ] Zero `any` types in generated code
- [ ] Generated code passes TypeScript strict mode
