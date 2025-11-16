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

## Installation

```bash
npm install fossyl
# or
pnpm add fossyl
# or
yarn add fossyl
```

## Quick Start

```typescript
import { createRouter, authWrapper } from 'fossyl';

// Create a router
const router = createRouter();

// Define routes with full type safety
const userRoute = router.endpoint('/users/:id').get({
  handler: async ({ url }) => {
    const userId = url.id; // Fully typed!
    return { id: userId, name: 'John Doe' };
  }
});

// Routes with authentication (must be async for OAuth, JWT, etc.)
const authenticatedRoute = router.endpoint('/protected').get({
  authenticator: async (headers) => {
    // Your async auth logic here (OAuth, JWT verification, DB lookup, etc.)
    return authWrapper({ userId: headers['user-id'] });
  },
  handler: async ({ url }, auth) => {
    // auth is fully typed based on your authenticator!
    return { message: `Hello, user ${auth.userId}` };
  }
});

// Routes with request body validation
const createUserRoute = router.endpoint('/users').post({
  bodyValidator: (data) => {
    // Your validation logic here
    return data as { name: string; email: string };
  },
  handler: async ({ url, body }) => {
    // body is fully typed based on your validator!
    return { id: '123', ...body };
  }
});

// Routes with query parameters
const searchRoute = router.endpoint('/search').get({
  queryValidator: (data) => {
    return data as { q: string; limit?: number };
  },
  handler: async ({ url, query }) => {
    // query is fully typed!
    return { results: [], query: query.q };
  }
});
```

## Documentation

For more detailed documentation, visit the [GitHub repository](https://github.com/YoyoSaur/fossyl).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see the [LICENSE](LICENSE) file for details.
