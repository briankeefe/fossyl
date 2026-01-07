# Core Plan

## Overview

`@fossyl/core` is the runtime package containing type definitions, `createRouter`, `defineConfig`, and adapter interfaces. It has zero CLI dependencies and minimal footprint.

## Package Info

- **Name**: `@fossyl/core`
- **Type**: Runtime (dependency, not devDependency)
- **Dependencies**: None (pure TypeScript types and utilities)

---

## Responsibilities

1. **Route Types**: Define `Route`, `RouteInfo`, and route builder types
2. **Router Factory**: `createRouter()` for building type-safe routes
3. **Config Types**: `defineConfig()` and `FossylConfig` type
4. **Adapter Interfaces**: `FrameworkAdapter`, `DatabaseAdapter`, `ValidationAdapter`
5. **Validation Types**: Error and warning types for validation

---

## Package Structure

```
packages/core/
├── src/
│   ├── index.ts                      # Public exports
│   ├── router.ts                     # createRouter implementation
│   ├── endpoint.ts                   # Endpoint builder
│   ├── config.ts                     # defineConfig and config types
│   ├── adapters.ts                   # Adapter interface definitions
│   ├── validation.ts                 # Validation types
│   └── types.ts                      # Core route types
├── package.json
├── tsconfig.json
└── CLAUDE.md
```

---

## Public API

### Exports from `index.ts`

```typescript
// Router
export { createRouter } from './router';

// Config
export { defineConfig } from './config';
export type { FossylConfig, ValidationOptions } from './config';

// Adapters
export type {
  FrameworkAdapter,
  DatabaseAdapter,
  ValidationAdapter,
  AdaptersConfig,
  GeneratorContext,
  DevServer,
} from './adapters';

// Types
export type {
  Route,
  RouteInfo,
  OpenRoute,
  AuthenticatedRoute,
  ValidatedRoute,
  FullRoute,
  HttpMethod,
} from './types';

// Validation
export type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from './validation';
```

---

## Type Definitions

### `src/types.ts`

Core route types with full type safety.

```typescript
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// URL params type - extracts params from path like '/users/:id'
export type ExtractUrlParams<Path extends string> =
  Path extends `${string}:${infer Param}/${infer Rest}`
    ? { [K in Param | keyof ExtractUrlParams<`/${Rest}`>]: string }
    : Path extends `${string}:${infer Param}`
    ? { [K in Param]: string }
    : Record<string, never>;

// Base route params
export type RouteParams<TUrl extends string, TQuery = undefined> = {
  url: ExtractUrlParams<TUrl>;
  query: TQuery extends undefined ? never : TQuery;
};

// Open route - no auth, no validation
export type OpenRoute<
  TPath extends string = string,
  TQuery = undefined,
  TResponse = unknown
> = {
  type: 'open';
  path: TPath;
  method: HttpMethod;
  queryValidator?: (data: unknown) => TQuery;
  handler: (params: RouteParams<TPath, TQuery>) => Promise<TResponse> | TResponse;
};

// Authenticated route - has auth, no body validation
export type AuthenticatedRoute<
  TPath extends string = string,
  TAuth = unknown,
  TQuery = undefined,
  TResponse = unknown
> = {
  type: 'authenticated';
  path: TPath;
  method: HttpMethod;
  authenticator: (headers: Record<string, string | undefined>) => Promise<TAuth> | TAuth;
  queryValidator?: (data: unknown) => TQuery;
  handler: (
    params: RouteParams<TPath, TQuery>,
    auth: TAuth
  ) => Promise<TResponse> | TResponse;
};

// Validated route - has body validation, no auth
export type ValidatedRoute<
  TPath extends string = string,
  TBody = unknown,
  TQuery = undefined,
  TResponse = unknown
> = {
  type: 'validated';
  path: TPath;
  method: HttpMethod;
  validator: (data: unknown) => TBody;
  queryValidator?: (data: unknown) => TQuery;
  handler: (
    params: RouteParams<TPath, TQuery>,
    body: TBody
  ) => Promise<TResponse> | TResponse;
};

// Full route - has auth and body validation
export type FullRoute<
  TPath extends string = string,
  TAuth = unknown,
  TBody = unknown,
  TQuery = undefined,
  TResponse = unknown
> = {
  type: 'full';
  path: TPath;
  method: HttpMethod;
  authenticator: (headers: Record<string, string | undefined>) => Promise<TAuth> | TAuth;
  validator: (data: unknown) => TBody;
  queryValidator?: (data: unknown) => TQuery;
  handler: (
    params: RouteParams<TPath, TQuery>,
    auth: TAuth,
    body: TBody
  ) => Promise<TResponse> | TResponse;
};

// Union of all route types
export type Route<
  TPath extends string = string,
  TAuth = unknown,
  TBody = unknown,
  TQuery = undefined,
  TResponse = unknown
> =
  | OpenRoute<TPath, TQuery, TResponse>
  | AuthenticatedRoute<TPath, TAuth, TQuery, TResponse>
  | ValidatedRoute<TPath, TBody, TQuery, TResponse>
  | FullRoute<TPath, TAuth, TBody, TQuery, TResponse>;

// Route with metadata for code generation
export type RouteInfo = {
  route: Route;
  sourceFile: string;
  exportName: string;
};
```

---

### `src/router.ts`

Router factory for building type-safe routes.

```typescript
import type {
  Route,
  OpenRoute,
  AuthenticatedRoute,
  ValidatedRoute,
  FullRoute,
  HttpMethod,
  ExtractUrlParams,
} from './types';

export type EndpointBuilder<TBasePath extends string, TPath extends string> = {
  get<TQuery = undefined, TResponse = unknown>(options: {
    queryValidator?: (data: unknown) => TQuery;
    handler: (params: { url: ExtractUrlParams<TPath>; query: TQuery }) => Promise<TResponse> | TResponse;
  }): OpenRoute<TPath, TQuery, TResponse>;

  get<TAuth, TQuery = undefined, TResponse = unknown>(options: {
    authenticator: (headers: Record<string, string | undefined>) => Promise<TAuth> | TAuth;
    queryValidator?: (data: unknown) => TQuery;
    handler: (
      params: { url: ExtractUrlParams<TPath>; query: TQuery },
      auth: TAuth
    ) => Promise<TResponse> | TResponse;
  }): AuthenticatedRoute<TPath, TAuth, TQuery, TResponse>;

  post<TBody, TQuery = undefined, TResponse = unknown>(options: {
    validator: (data: unknown) => TBody;
    queryValidator?: (data: unknown) => TQuery;
    handler: (
      params: { url: ExtractUrlParams<TPath>; query: TQuery },
      body: TBody
    ) => Promise<TResponse> | TResponse;
  }): ValidatedRoute<TPath, TBody, TQuery, TResponse>;

  post<TAuth, TBody, TQuery = undefined, TResponse = unknown>(options: {
    authenticator: (headers: Record<string, string | undefined>) => Promise<TAuth> | TAuth;
    validator: (data: unknown) => TBody;
    queryValidator?: (data: unknown) => TQuery;
    handler: (
      params: { url: ExtractUrlParams<TPath>; query: TQuery },
      auth: TAuth,
      body: TBody
    ) => Promise<TResponse> | TResponse;
  }): FullRoute<TPath, TAuth, TBody, TQuery, TResponse>;

  put<TAuth, TBody, TQuery = undefined, TResponse = unknown>(options: {
    authenticator: (headers: Record<string, string | undefined>) => Promise<TAuth> | TAuth;
    validator: (data: unknown) => TBody;
    queryValidator?: (data: unknown) => TQuery;
    handler: (
      params: { url: ExtractUrlParams<TPath>; query: TQuery },
      auth: TAuth,
      body: TBody
    ) => Promise<TResponse> | TResponse;
  }): FullRoute<TPath, TAuth, TBody, TQuery, TResponse>;

  delete<TAuth, TQuery = undefined, TResponse = unknown>(options: {
    authenticator: (headers: Record<string, string | undefined>) => Promise<TAuth> | TAuth;
    queryValidator?: (data: unknown) => TQuery;
    handler: (
      params: { url: ExtractUrlParams<TPath>; query: TQuery },
      auth: TAuth
    ) => Promise<TResponse> | TResponse;
  }): AuthenticatedRoute<TPath, TAuth, TQuery, TResponse>;
};

export type Router<TBasePath extends string> = {
  basePath: TBasePath;
  endpoint<TSubPath extends string>(
    subPath: TSubPath
  ): EndpointBuilder<TBasePath, `${TBasePath}${TSubPath}`>;
};

export function createRouter<TBasePath extends string>(basePath: TBasePath): Router<TBasePath> {
  return {
    basePath,
    endpoint<TSubPath extends string>(subPath: TSubPath) {
      const fullPath = `${basePath}${subPath}` as `${TBasePath}${TSubPath}`;

      return {
        get(options: Record<string, unknown>): Route {
          return createRoute('GET', fullPath, options);
        },
        post(options: Record<string, unknown>): Route {
          return createRoute('POST', fullPath, options);
        },
        put(options: Record<string, unknown>): Route {
          return createRoute('PUT', fullPath, options);
        },
        delete(options: Record<string, unknown>): Route {
          return createRoute('DELETE', fullPath, options);
        },
        patch(options: Record<string, unknown>): Route {
          return createRoute('PATCH', fullPath, options);
        },
      } as EndpointBuilder<TBasePath, `${TBasePath}${TSubPath}`>;
    },
  };
}

function createRoute(
  method: HttpMethod,
  path: string,
  options: Record<string, unknown>
): Route {
  const hasAuth = 'authenticator' in options;
  const hasValidator = 'validator' in options;

  let type: Route['type'];
  if (hasAuth && hasValidator) {
    type = 'full';
  } else if (hasAuth) {
    type = 'authenticated';
  } else if (hasValidator) {
    type = 'validated';
  } else {
    type = 'open';
  }

  return {
    type,
    path,
    method,
    ...options,
  } as Route;
}
```

---

### `src/config.ts`

Configuration types and `defineConfig` helper.

```typescript
import type { FrameworkAdapter, DatabaseAdapter, ValidationAdapter } from './adapters';

export type ValidationOptions = {
  /** Required prefix for all routes (e.g., '/api') */
  requirePrefix?: string;

  /** Enforce that routes in same file share prefix */
  enforceFilePrefix?: boolean;
};

export type AdaptersConfig = {
  /** Required: HTTP framework adapter */
  framework: FrameworkAdapter;

  /** Optional: Database adapter for transactions */
  database?: DatabaseAdapter;

  /** Optional: Validation adapter (rarely needed) */
  validation?: ValidationAdapter;
};

export type FossylConfig = {
  /** Path to routes directory or file */
  routes: string;

  /** Output path for generated code */
  output: string;

  /** Adapter configuration */
  adapters: AdaptersConfig;

  /** Validation options */
  validation?: ValidationOptions;
};

export function defineConfig(config: FossylConfig): FossylConfig {
  return config;
}
```

---

### `src/adapters.ts`

Adapter interface definitions.

```typescript
import type { RouteInfo } from './types';

// Context passed to framework adapter during generation
export type GeneratorContext = {
  outputPath: string;
  routesPath: string;
  databaseAdapter?: DatabaseAdapter;
};

// Dev server interface
export type DevServer = {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  reload: () => Promise<void>;
};

// Dev server options
export type DevServerOptions = {
  port: number;
  routesPath: string;
};

// Framework adapter (Express, Hono, etc.)
export type FrameworkAdapter = {
  type: 'framework';
  name: string;

  /** Generate TypeScript code from routes */
  generate: (routes: RouteInfo[], ctx: GeneratorContext) => string;

  /** Optional: Create dev server for hot reload */
  createDevServer?: (routes: RouteInfo[], options: DevServerOptions) => DevServer;
};

// Database adapter (Prisma-Kysely, Drizzle, etc.)
export type DatabaseAdapter = {
  type: 'database';
  name: string;

  /** Path to database client module */
  clientPath: string;

  /** Whether routes use transactions by default */
  defaultTransaction: boolean;

  /** Auto-run migrations on startup */
  autoMigrate: boolean;

  /** Emit setup code (imports, context creation) */
  emitSetup: () => string;

  /** Emit wrapper code for transaction handling */
  emitWrapper: (handlerCode: string, useTransaction: boolean) => string;

  /** Emit startup code (migrations, etc.) */
  emitStartup: () => string;
};

// Validation adapter (Zod, Valibot, etc.) - mostly for error formatting
export type ValidationAdapter = {
  type: 'validation';
  name: string;

  /** Format validation errors for response */
  formatError: (error: unknown) => { message: string; details?: unknown };
};
```

---

### `src/validation.ts`

Validation types for CLI use.

```typescript
export type ValidationError = {
  type: 'duplicate-route' | 'invalid-path' | 'type-error' | 'missing-export';
  message: string;
  file: string;
  line?: number;
  column?: number;
};

export type ValidationWarning = {
  type: 'mixed-prefix' | 'naming-convention';
  message: string;
  file: string;
  line?: number;
};

export type ValidationResult = {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
};
```

---

### `src/index.ts`

Public exports.

```typescript
// Router
export { createRouter } from './router';
export type { Router, EndpointBuilder } from './router';

// Config
export { defineConfig } from './config';
export type { FossylConfig, ValidationOptions, AdaptersConfig } from './config';

// Adapters
export type {
  FrameworkAdapter,
  DatabaseAdapter,
  ValidationAdapter,
  GeneratorContext,
  DevServer,
  DevServerOptions,
} from './adapters';

// Types
export type {
  Route,
  RouteInfo,
  OpenRoute,
  AuthenticatedRoute,
  ValidatedRoute,
  FullRoute,
  HttpMethod,
  RouteParams,
  ExtractUrlParams,
} from './types';

// Validation
export type {
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from './validation';
```

---

## Usage Example

```typescript
// src/routes/users.ts
import { createRouter } from '@fossyl/core';
import { zodValidator } from '@fossyl/zod';
import { z } from 'zod';
import { jwtAuth } from '../middleware/auth';

const router = createRouter('/api/users');

const updateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export const getUser = router.endpoint('/:id').get({
  authenticator: jwtAuth,
  handler: async ({ url }, auth) => {
    // url.id is typed as string
    // auth is typed based on jwtAuth return type
    return { id: url.id, requestedBy: auth.userId };
  },
});

export const updateUser = router.endpoint('/:id').put({
  authenticator: jwtAuth,
  validator: zodValidator(updateUserSchema),
  handler: async ({ url }, auth, body) => {
    // body is typed as { name: string, email: string }
    return { updated: true, id: url.id };
  },
});

export default [getUser, updateUser];
```

---

## Package Configuration

### `package.json`

```json
{
  "name": "@fossyl/core",
  "version": "0.1.0",
  "description": "Core types and utilities for fossyl",
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
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "dev": "tsup src/index.ts --format cjs,esm --dts --watch",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.8.0"
  }
}
```

---

## Implementation Order

1. Set up package structure
2. Implement `types.ts` (route types)
3. Implement `validation.ts` (validation types)
4. Implement `adapters.ts` (adapter interfaces)
5. Implement `config.ts` (defineConfig)
6. Implement `router.ts` (createRouter)
7. Implement `index.ts` (exports)
8. Write tests for type inference
9. Write CLAUDE.md

---

## Success Criteria

- [ ] `createRouter` provides full type inference for URL params
- [ ] Handler params are correctly typed based on route type
- [ ] `defineConfig` validates config structure
- [ ] Adapter interfaces are complete and extensible
- [ ] Zero runtime dependencies
- [ ] Works with TypeScript strict mode
- [ ] URL param extraction works: `/users/:id` → `{ id: string }`
