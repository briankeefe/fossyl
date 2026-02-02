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

## Route Types

Fossyl provides four route types based on validation requirements:

- **OpenRoute**: No authentication or body validation
- **AuthenticatedRoute**: Requires authentication, no body
- **ValidatedRoute**: Requires body validation, no authentication
- **FullRoute**: Requires both authentication and body validation

## Documentation

Each package includes a `CLAUDE.md` file with comprehensive documentation for AI-assisted development.

## License

GPL-3.0
