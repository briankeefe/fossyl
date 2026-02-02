<div align="center">
  <img
    src="https://raw.githubusercontent.com/YoyoSaur/fossyl/main/packages/core/fossyl.svg"
    alt="Fossyl Logo"
    width="200"
  />

  # Fossyl

  **Type-safe REST API framework designed for AI-assisted development**

  [![npm version](https://badge.fury.io/js/fossyl.svg)](https://www.npmjs.com/package/fossyl)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
</div>

## Overview

Fossyl is a type-safe REST API framework built with TypeScript, specifically designed to work seamlessly with AI-assisted development tools like Claude. It provides inference-heavy APIs with crystal clear error messages, making it easy to build robust REST APIs with full type safety.

## Features

- **Type-Safe Routes**: Full TypeScript type inference for routes, parameters, and responses
- **REST Semantics Enforcement**: Compile-time validation of REST patterns (e.g., GET can't have body, POST requires body)
- **Pure Functional Design**: Validator-library agnostic with simple function types
- **Query Parameter Validation**: Optional type-safe query parameter validation
- **Authentication Support**: Type-safe authentication with custom authentication functions
- **AI-First Development**: Designed for seamless integration with AI coding assistants

## Getting Started

The easiest way to start a new Fossyl project is with the CLI:

```bash
npx @fossyl/core --create my-api
```

This will prompt you to select:
- **Server adapter**: Express (recommended) or Bring Your Own
- **Validation library**: Zod (recommended) or Bring Your Own
- **Database adapter**: Kysely (recommended) or Bring Your Own

Then install dependencies and start the dev server:

```bash
cd my-api
pnpm install
pnpm dev
```

Your API will be running at `http://localhost:3000` with a sample ping feature demonstrating all route types.

## Manual Installation

If you prefer to set up manually:

```bash
npm install @fossyl/core
# or
pnpm add @fossyl/core
# or
yarn add @fossyl/core
```

## Quick Start

```typescript
import { createRouter, authWrapper } from '@fossyl/core';

// Create a router with optional base path
const router = createRouter('/api');

// Define routes with full type safety
const userRoute = router.createEndpoint('/users/:id').get({
  handler: async ({ url }) => {
    const userId = url.id; // Fully typed!
    return { typeName: 'User' as const, id: userId, name: 'John Doe' };
  }
});

// Routes with authentication (must be async for OAuth, JWT, etc.)
const authenticatedRoute = router.createEndpoint('/protected').get({
  authenticator: async (headers) => {
    // Your async auth logic here (OAuth, JWT verification, DB lookup, etc.)
    return authWrapper({ userId: headers['user-id'] });
  },
  handler: async ({ url }, auth) => {
    // auth is fully typed based on your authenticator!
    return { typeName: 'Message' as const, message: `Hello, user ${auth.userId}` };
  }
});

// Routes with request body validation
const createUserRoute = router.createEndpoint('/users').post({
  validator: (data): { name: string; email: string } => {
    // Your validation logic here
    return data as { name: string; email: string };
  },
  handler: async ({ url }, body) => {
    // body is fully typed based on your validator!
    return { typeName: 'User' as const, id: '123', ...body };
  }
});

// Routes with query parameters
const searchRoute = router.createEndpoint('/search').get({
  queryValidator: (data): { q: string; limit?: number } => {
    return data as { q: string; limit?: number };
  },
  handler: async ({ url, query }) => {
    // query is fully typed!
    return { typeName: 'SearchResults' as const, results: [], query: query.q };
  }
});
```

## Documentation

For more detailed documentation, visit the [GitHub repository](https://github.com/YoyoSaur/fossyl).

## AI-Assisted Development

For AI-assisted development, see [CLAUDE.md](./CLAUDE.md).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see the [LICENSE](LICENSE) file for details.
