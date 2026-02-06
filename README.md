# Fossyl

[![npm version](https://img.shields.io/npm/v/@fossyl/core.svg)](https://www.npmjs.com/package/@fossyl/core)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-yellow.svg)](https://opensource.org/licenses/GPL-3.0)

**Type-safe REST API framework designed for AI-assisted development**

Fossyl provides full type inference for routes, parameters, and responses with REST semantics enforcement at compile-time.

## Getting Started

Create a new project with the CLI:

```bash
npx fossyl --create my-api
cd my-api
pnpm install
pnpm dev
```

The CLI will guide you through selecting adapters:
- **Server**: Express (recommended) or Bring Your Own
- **Validator**: Zod (recommended) or Bring Your Own
- **Database**: Kysely (recommended) or Bring Your Own

## Quick Example

```typescript
import { createRouter, authWrapper } from '@fossyl/core';
import { expressAdapter } from '@fossyl/express';

const api = createRouter('/api');

// Authentication function
const auth = async (headers: Record<string, string>) =>
  authWrapper({ userId: headers['x-user-id'] });

// Define routes
const getUser = api.createEndpoint('/users/:id').get({
  handler: async ({ url }) => ({
    typeName: 'User' as const,
    id: url.id,
    name: 'John Doe'
  })
});

const createUser = api.createEndpoint('/users').post({
  authenticator: auth,
  validator: (data): { name: string } => data as { name: string },
  handler: async ({ url }, auth, body) => ({
    typeName: 'User' as const,
    id: 'new-id',
    name: body.name,
    createdBy: auth.userId
  })
});

// Start server
const adapter = expressAdapter({ cors: true });
adapter.register([getUser, createUser]);
adapter.listen(3000);
```

## Packages

| Package | Description |
|---------|-------------|
| [`@fossyl/core`](./packages/core) | Router and type definitions |
| [`fossyl`](./packages/cli) | CLI for scaffolding projects |
| [`@fossyl/express`](./packages/express) | Express.js runtime adapter |
| [`@fossyl/zod`](./packages/zod) | Zod validation adapter |
| [`@fossyl/kysely`](./packages/kysely) | Kysely database adapter |
| [`@fossyl/prisma`](./packages/prisma) | Prisma database adapter *(this fork)* |

## Route Types

Fossyl provides four route types based on validation requirements:

- **OpenRoute**: No authentication or body validation
- **AuthenticatedRoute**: Requires authentication, no body
- **ValidatedRoute**: Requires body validation, no authentication
- **FullRoute**: Requires both authentication and body validation

## Documentation

Each package includes a `CLAUDE.md` file with comprehensive documentation for AI-assisted development.

## Integration Notes (from this fork)

This fork adds `@fossyl/prisma` and was tested by integrating fossyl into a real Next.js 14 SaaS boilerplate (~20 API routes, Prisma + PostgreSQL, NextAuth, Stripe). Below are the limitations and friction points found during integration.

### 1. All POST/PUT routes are wrapped in database transactions

The express adapter unconditionally wraps `ValidatedRoute` (POST with body, no auth) in `withTransaction` and `FullRoute` (POST/PUT with auth + body) in `withTransaction` whenever a `database` adapter is present. The `defaultTransaction` flag on the database adapter is not read by the express adapter.

This means routes that don't touch the database (e.g. a waitlist signup that only sends an email) still get wrapped in a `$transaction` call, which fails if the database is unreachable.

**Suggested fix**: Either respect `defaultTransaction: false` in the express adapter, or allow individual routes to opt out of transaction wrapping.

### 2. DELETE routes cannot have request bodies

Fossyl enforces REST semantics at the type level: `DELETE` routes use `createNoBodyMethod`, so there is no `validator` option. This is correct per HTTP spec, but many real-world APIs (including the boilerplate being integrated) send JSON bodies on DELETE requests (e.g. `DELETE /api/todo` with `{ id: "..." }`).

**Workaround**: Use path parameters instead (`DELETE /api/todo/:id`). This is more RESTful but requires frontend changes when migrating existing APIs.

### 3. Response envelope differs from common patterns

Fossyl wraps all responses in `{ success: "true", type: "TypeName", data: { typeName: "TypeName", ... } }`. Most existing frontends expect unwrapped responses like `{ todos: [...] }` or `{ user: {...} }`.

When migrating an existing API to fossyl, the frontend needs an adapter layer to unwrap the envelope. This fork includes a `fossylClient.ts` example in the integrated project.

### 4. Authenticated routes require a separate auth mechanism

Fossyl's `authenticator` function receives raw headers and must return auth context synchronously from those headers. This works well with JWT/Bearer tokens but does not directly support cookie-based sessions (e.g. NextAuth).

When integrating with a Next.js app that uses NextAuth cookie sessions, a bridge endpoint is needed on the Next.js side (`GET /api/auth/token`) that exchanges the session cookie for a JWT the fossyl server can validate.

### 5. Streaming responses are not supported

Fossyl's express adapter calls `res.json(wrapResponse(result))` on the handler's return value. Routes that need streaming responses (e.g. Server-Sent Events for AI chat via Vercel AI SDK's `toDataStreamResponse()`) cannot be migrated to fossyl and must remain as framework-native handlers.

### 6. Webhook routes with raw body access

Routes that need access to the raw request body (e.g. Stripe webhook signature verification) cannot use fossyl because the express adapter parses JSON via `express.json()` before the handler runs. These routes must remain outside fossyl.

## License

GPL-3.0
