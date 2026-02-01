# @fossyl/express - AI Development Guide

**Express.js runtime adapter for fossyl**

## Quick Start

```typescript
import { createRouter } from 'fossyl';
import { expressAdapter } from '@fossyl/express';

const router = createRouter('/api');
const routes = [
  router.createEndpoint('/api/health').get({
    handler: async () => ({ typeName: 'Health' as const, status: 'ok' }),
  }),
];

const adapter = expressAdapter({ cors: true });
adapter.register(routes);
await adapter.listen(3000);
```

## Adapter Options

```typescript
import type { LoggerAdapter, DatabaseAdapter } from 'fossyl';

const adapter = expressAdapter({
  // Existing Express app (optional - creates one if not provided)
  app?: Application;

  // Enable CORS (default: false)
  cors?: boolean | CorsOptions;

  // Database adapter for transaction support
  database?: DatabaseAdapter;

  // Logger adapter for request logging (default: console-based)
  logger?: LoggerAdapter;

  // Metrics recorder for request tracking
  metrics?: MetricsRecorder;
});
```

## CORS Options

```typescript
type CorsOptions = {
  origin?: string | string[] | boolean;
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
};
```

## Logger Integration

The adapter accepts a `LoggerAdapter` from `fossyl` core. If not provided, a default console-based logger is used.

```typescript
import type { LoggerAdapter } from 'fossyl';

const pinoLogger: LoggerAdapter = {
  type: 'logger',
  name: 'pino',
  createLogger: (requestId) => ({
    info: (msg, meta) => pino.info({ requestId, ...meta }, msg),
    warn: (msg, meta) => pino.warn({ requestId, ...meta }, msg),
    error: (msg, meta) => pino.error({ requestId, ...meta }, msg),
  }),
};

const adapter = expressAdapter({ logger: pinoLogger });
```

## Metrics Integration

```typescript
const adapter = expressAdapter({
  metrics: {
    onRequestStart: ({ method, path, requestId }) => {
      // Called at request start
    },
    onRequestEnd: ({ method, path, requestId, statusCode, durationMs }) => {
      // Called on successful completion
    },
    onRequestError: ({ method, path, requestId, error, durationMs }) => {
      // Called on error
    },
  },
});
```

## Accessing Request Context

Use these functions anywhere in your handler call stack:

```typescript
import { getContext, getLogger, getRequestId, getDb } from '@fossyl/express';

// In a handler or any called function:
const logger = getLogger();
const requestId = getRequestId();
const dbContext = getDb(); // If database adapter configured
```

## Error Handling

Throw these errors in handlers for proper HTTP responses:

```typescript
import { AuthenticationError, ValidationError } from '@fossyl/express';

// Returns 401
throw new AuthenticationError('Invalid token');

// Returns 400
throw new ValidationError('Invalid input', { field: 'email' });
```

## Response Format

All responses are wrapped automatically:

```typescript
// Handler returns:
{ typeName: 'User', id: '123', name: 'John' }

// Client receives:
{
  success: "true",
  type: "User",
  data: { typeName: 'User', id: '123', name: 'John' }
}
```

Error responses:
```typescript
{
  success: "false",
  error: {
    code: 1002,  // Branded ErrorCode
    message: "Authentication failed",
    details?: unknown
  }
}
```

## Package Exports

```typescript
// Main adapter
export { expressAdapter } from '@fossyl/express';

// Context accessors
export { getContext, getLogger, getRequestId, getDb } from '@fossyl/express';

// Errors
export { AuthenticationError, ValidationError, ERROR_CODES, createErrorResponse } from '@fossyl/express';

// Response wrapper
export { wrapResponse } from '@fossyl/express';

// Types
export type {
  ExpressAdapterOptions,
  CorsOptions,
  MetricsRecorder,
  RequestContext,
  LoggerContext,
  ErrorCode,
  ErrorResponse,
} from '@fossyl/express';
```

## Integration with Other Adapters

When using with database adapters:

```typescript
import { expressAdapter } from '@fossyl/express';
// Future: import { prismaKyselyAdapter } from '@fossyl/prisma-kysely';

const adapter = expressAdapter({
  database: databaseAdapter, // Provides withTransaction/withClient
  logger: loggerAdapter,
});
```

The framework adapter will:
- Call `database.onStartup()` when `listen()` is called
- Wrap handlers with `withTransaction()` for POST/PUT routes
- Wrap handlers with `withClient()` for GET/DELETE routes

## Development Notes

- Routes are sorted so static paths match before dynamic params
- Routes are grouped by common prefix for efficient Express routing
- Request context uses `AsyncLocalStorage` for isolation
- All route types (open, authenticated, validated, full) are supported
