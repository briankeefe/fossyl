# Fossyl - AI Development Guide

**Type-safe REST API framework designed for AI-assisted development**

> **Important:** Load `CLAUDE.md` from all `@fossyl/*` packages in this monorepo for full context on available adapters.

## Quick Overview

Fossyl is a TypeScript REST API framework that provides:
- Full type inference for routes, parameters, and responses
- REST semantics enforcement at compile-time
- Validator-library agnostic design
- Type-safe authentication and query parameter validation
- Configuration-driven code generation with framework adapters

## Installation

```bash
npm install fossyl
# or
pnpm add fossyl
# or
yarn add fossyl
```

## Core Concepts

### 1. Creating a Router

```typescript
import { createRouter } from 'fossyl';

const router = createRouter('/api'); // Optional base path
```

### 2. Basic Routes

```typescript
// Simple GET endpoint
const getUserRoute = router.createEndpoint('/users/:id').get({
  handler: async ({ url }) => {
    const userId = url.id; // Fully typed from URL params
    return { 
      typeName: 'User' as const,
      id: userId, 
      name: 'John Doe' 
    };
  }
});

// POST endpoint with body validation
const createUserRoute = router.createEndpoint('/users').post({
  validator: (data): { name: string; email: string } => {
    // Your validation logic (use any validator library)
    return data as { name: string; email: string };
  },
  handler: async ({ url }, body) => {
    // body type is inferred from validator return type
    return { 
      typeName: 'User' as const,
      id: '123', 
      ...body 
    };
  }
});
```

### 3. Authentication

**Important:** Authentication functions **must** return a `Promise`. This allows for async operations like OAuth, database lookups, JWT verification, etc.

```typescript
import { authWrapper } from 'fossyl';

// Define your async authentication function
const authenticator = async (headers: Record<string, string>) => {
  // Perform async operations: OAuth, JWT verification, database lookup, etc.
  // Example: await validateJWT(headers.authorization)

  return authWrapper({
    userId: headers['x-user-id'],
    role: headers['x-user-role']
  });
};

// Use in routes
const protectedRoute = router.createEndpoint('/protected').get({
  authenticator,
  handler: async ({ url }, auth) => {
    // auth is fully typed from authWrapper return
    return { 
      typeName: 'Protected' as const,
      message: `Hello user ${auth.userId}` 
    };
  }
});
```

**OAuth Example:**

```typescript
const oauthAuthenticator = async (headers: Record<string, string>) => {
  const token = headers.authorization?.replace('Bearer ', '');

  // Async OAuth token validation
  const userInfo = await fetch('https://oauth-provider.com/userinfo', {
    headers: { Authorization: `Bearer ${token}` }
  }).then(r => r.json());

  return authWrapper({
    userId: userInfo.sub,
    email: userInfo.email,
    scopes: userInfo.scopes
  });
};
```

### 4. Query Parameters

```typescript
const searchRoute = router.createEndpoint('/search').get({
  queryValidator: (data): { q: string; limit?: number } => {
    return data as { q: string; limit?: number };
  },
  handler: async ({ url, query }) => {
    // query type is inferred from queryValidator
    return { 
      typeName: 'SearchResult' as const,
      results: [], 
      query: query.q 
    };
  }
});
```

### 5. Combined Features

```typescript
const fullRoute = router.createEndpoint('/api/resource/:id').post({
  authenticator,
  validator: (data): { title: string } => data as { title: string },
  queryValidator: (data): { draft?: boolean } => data as { draft?: boolean },
  handler: async ({ url, query }, auth, body) => {
    // All parameters are fully typed
    return {
      typeName: 'Resource' as const,
      id: url.id,
      title: body.title,
      draft: query.draft ?? false,
      createdBy: auth.userId
    };
  }
});
```

## Configuration & Code Generation

Fossyl uses a configuration file to generate TypeScript code for your chosen HTTP framework.

### 1. Configuration File

Create a `fossyl.config.ts` file:

```typescript
import { defineConfig } from 'fossyl';
// Note: Framework adapters are in development
// import { expressAdapter } from '@fossyl/express';

export default defineConfig({
  routes: './src/routes',
  output: './src/server.generated.ts',
  adapters: {
    // framework: expressAdapter({ cors: true }), // Coming soon
    framework: customFrameworkAdapter, // Build your own for now
  },
  validation: {
    requirePrefix: '/api',
    enforceFilePrefix: true,
  },
});
```

### 2. Adapter Types

Fossyl supports four types of adapters:

**Framework Adapters** (Required):
```typescript
type FrameworkAdapter = {
  type: 'framework';
  name: string;
  generate: (routes: RouteInfo[], ctx: GeneratorContext) => string;
  createDevServer?: (routes: RouteInfo[], options: DevServerOptions) => DevServer;
};
```

**Database Adapters** (Optional):
```typescript
type DatabaseAdapter = {
  type: 'database';
  name: string;
  clientPath: string;
  defaultTransaction: boolean;
  autoMigrate: boolean;
  emitSetup: () => string;
  emitWrapper: (handlerCode: string, useTransaction: boolean) => string;
  emitStartup: () => string;
};
```

**Validation Adapters** (Optional):
```typescript
type ValidationAdapter = {
  type: 'validation';
  name: string;
  formatError: (error: unknown) => { message: string; details?: unknown };
};
```

**Logger Adapters** (Optional):
```typescript
type LoggerAdapter = {
  type: 'logger';
  name: string;
  createLogger: (requestId: string) => Logger;
};

type Logger = {
  info: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, meta?: Record<string, unknown>) => void;
};
```

## Response Data Format

**Important:** All route handlers must return objects with a `typeName` property for proper type inference and response formatting:

```typescript
const handler = async (params) => {
  return {
    typeName: 'UserResponse' as const, // Required!
    id: '123',
    name: 'John Doe'
  };
};
```

The framework will wrap your response data in a standardized format:
```typescript
type ApiResponse<T> = {
  success: 'true';
  type: T['typeName'];
  data: T;
};
```

## REST Method Types

Available methods: `get`, `post`, `put`, `delete`

**REST Semantics Enforcement:**
- `GET` and `DELETE` cannot have a body validator
- `POST` and `PUT` require a body validator
- All methods can have authentication and query validation

**Handler Parameter Order:**
- Routes with body validation: `handler(params, [auth,] body)`
- Routes without body validation: `handler(params [, auth])`

Where:
- `params` contains `{ url, query }` (query only if queryValidator provided)
- `auth` is provided if authenticator is used
- `body` is provided if validator is used

## Route Types

Fossyl provides four distinct route types based on what validation is required:

### OpenRoute
- No authentication or body validation required
- Handler: `(params) => Promise<ResponseData>`
- Use for: Public endpoints, health checks

### AuthenticatedRoute  
- Requires authentication, no body validation
- Handler: `(params, auth) => Promise<ResponseData>`
- Use for: Protected GET/DELETE endpoints

### ValidatedRoute
- Requires body validation, no authentication  
- Handler: `(params, body) => Promise<ResponseData>`
- Use for: Public POST/PUT endpoints (e.g., registration)

### FullRoute
- Requires both authentication and body validation
- Handler: `(params, auth, body) => Promise<ResponseData>`
- Use for: Protected POST/PUT endpoints (most common)

## Adapter Libraries

**Note:** The first adapter library is now available:
- `@fossyl/express` - Express.js runtime adapter (available now!)
- `@fossyl/fastify` - Fastify adapter (coming soon)
- `@fossyl/prisma-kysely` - Prisma + Kysely database adapter (coming soon)

### Using @fossyl/express

```typescript
import { createRouter } from 'fossyl';
import { expressAdapter } from '@fossyl/express';

// Define your routes
const api = createRouter('/api');
const routes = [
  api.createEndpoint('/users').get({
    handler: async () => ({ 
      typeName: 'UserList' as const, 
      users: [] 
    })
  })
];

// Create and start server
const adapter = expressAdapter({
  cors: true,
  // Optional: database, logger, metrics
});

adapter.register(routes);
await adapter.listen(3000);
```

**For other frameworks, you'll need to build your own adapter** to integrate Fossyl routes with your HTTP framework. The route handlers return standard promises that resolve to response objects, making integration straightforward.

## Type Exports

### Core Types
```typescript
import type {
  Authentication,
  ResponseData,
  ApiResponse,
  OpenRoute,
  AuthenticatedRoute,
  ValidatedRoute,
  FullRoute,
  RestMethod,
  Route,
  ValidatorFunction,
  AuthenticationFunction,
  Endpoint,
  Router,
  Params
} from 'fossyl';
```

### Configuration Types
```typescript
import type {
  FossylConfig,
  ValidationOptions,
  AdaptersConfig
} from 'fossyl';
```

### Adapter Types
```typescript
import type {
  FrameworkAdapter,
  DatabaseAdapter,
  ValidationAdapter,
  LoggerAdapter,
  Logger,
  GeneratorContext,
  DevServer,
  DevServerOptions,
  RouteInfo,
  HttpMethod
} from 'fossyl';
```

### Validation Types
```typescript
import type {
  ValidationResult,
  ValidationError,
  ValidationWarning
} from 'fossyl';
```

## Development Tips for AI Assistants

1. **Type Inference**: Fossyl heavily uses TypeScript's type inference. Let the types flow naturally from validators and authenticators.

2. **Response Format**: Always include `typeName` in response objects for proper type inference and API consistency.

3. **Validation Libraries**: Use any validation library (Zod, Yup, io-ts, etc.) in your `validator` functions. Just ensure the function returns the validated type.

4. **Error Messages**: Fossyl provides clear compile-time errors when REST semantics are violated (e.g., trying to add a body to a GET request).

5. **Authentication Pattern**:
   - Authentication functions **must** return a `Promise<T & Authentication>`
   - Always use `authWrapper()` to wrap authentication data for proper type inference
   - This enables async operations: OAuth flows, JWT verification, database lookups, etc.
   - Make your auth function `async` or explicitly return a Promise

6. **Handler Parameter Order**: Pay attention to parameter order in handlers:
   - Body validation routes: parameters come first, then auth (if present), then body
   - No body validation: parameters come first, then auth (if present)

7. **URL Parameters**: Parameters in the route path (e.g., `:id`, `:userId`) are automatically typed and available in `url` object.

8. **Configuration**: Use `defineConfig()` helper for type-safe configuration with autocomplete.

9. **Adapters**: When building custom adapters, the `Route` union type represents all possible route configurations.

10. **Logger Integration**: Use the `LoggerAdapter` type to create per-request logger instances for structured logging.

## Example: Complete API

```typescript
import { createRouter, authWrapper } from 'fossyl';

// Async auth function (supports OAuth, JWT, database lookups, etc.)
const auth = async (headers: Record<string, string>) =>
  authWrapper({ userId: headers['user-id'] });

// Router
const api = createRouter('/api');

// Routes
const routes = {
  listUsers: api.createEndpoint('/users').get({
    handler: async () => ({ 
      typeName: 'UserList' as const,
      users: [] 
    })
  }),

  getUser: api.createEndpoint('/users/:id').get({
    handler: async ({ url }) => ({ 
      typeName: 'User' as const,
      id: url.id, 
      name: 'User' 
    })
  }),

  createUser: api.createEndpoint('/users').post({
    authenticator: auth,
    validator: (data): { name: string; email: string } =>
      data as { name: string; email: string },
    handler: async ({ url }, auth, body) => ({
      typeName: 'User' as const,
      id: 'new-id',
      ...body,
      createdBy: auth.userId
    })
  }),

  updateUser: api.createEndpoint('/users/:id').put({
    authenticator: auth,
    validator: (data): { name?: string; email?: string } =>
      data as { name?: string; email?: string },
    handler: async ({ url }, auth, body) => ({
      typeName: 'User' as const,
      id: url.id,
      ...body,
      updatedBy: auth.userId
    })
  }),

  deleteUser: api.createEndpoint('/users/:id').delete({
    authenticator: auth,
    handler: async ({ url }, auth) => ({
      typeName: 'DeleteResult' as const,
      id: url.id,
      deleted: true
    })
  })
};
```

## Repository Structure

This is a monorepo:
- `packages/core` - The fossyl core library
- `packages/express` - Express.js runtime adapter
- `packages/docs` - Documentation site

## Contributing

When working on this codebase:
- Maintain type safety throughout
- Follow REST semantics strictly
- Keep error messages clear and actionable
- Test with TypeScript strict mode enabled
- Consider adapter extensibility when adding features
- Always include `typeName` in response objects
- Use ESLint configuration for code quality