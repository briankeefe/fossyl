# @fossyl/zod - AI Development Guide

**Zod validation adapter for fossyl**

## Overview

`@fossyl/zod` is a tiny validation adapter that provides type-safe validator wrappers for Zod schemas. It extracts the type from the schema so handlers receive properly typed body/query params.

## Installation

```bash
npm install @fossyl/zod zod
# or
pnpm add @fossyl/zod zod
```

Note: `zod` is a peer dependency and must be installed separately.

## Usage

### Body Validation

```typescript
import { createRouter } from 'fossyl';
import { zodValidator } from '@fossyl/zod';
import { z } from 'zod';

const router = createRouter('/api');

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

const createUser = router.createEndpoint('/users').post({
  validator: zodValidator(userSchema),
  handler: async ({ url }, body) => {
    // body is { name: string, email: string }
    return { created: true, name: body.name };
  },
});
```

### Query Validation

```typescript
import { zodQueryValidator } from '@fossyl/zod';

const querySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
});

const listUsers = router.createEndpoint('/users').get({
  queryValidator: zodQueryValidator(querySchema),
  handler: async ({ query }) => {
    // query is { page: number, limit: number }
    return { page: query.page, results: [] };
  },
});
```

## API Reference

### `zodValidator<T>(schema: T)`

Creates a type-safe body validator from a Zod schema.

- **Parameters**: `schema` - A Zod schema (`z.ZodType`)
- **Returns**: A validator function `(data: unknown) => z.infer<T>`
- **Throws**: Zod validation errors if data doesn't match schema

### `zodQueryValidator<T>(schema: T)`

Creates a type-safe query validator from a Zod schema. Functionally identical to `zodValidator` but semantically indicates query parameter validation.

- **Parameters**: `schema` - A Zod schema (`z.ZodType`)
- **Returns**: A validator function `(data: unknown) => z.infer<T>`
- **Throws**: Zod validation errors if data doesn't match schema

## Why This Exists

Without the wrapper, you lose type inference:

```typescript
// Without @fossyl/zod - body is unknown
validator: (data) => userSchema.parse(data),
handler: async ({ url }, body) => {
  body.name  // Error: 'body' is of type 'unknown'
}

// With @fossyl/zod - body is inferred from schema
validator: zodValidator(userSchema),
handler: async ({ url }, body) => {
  body.name  // string - properly typed!
}
```

## Package Size

This is an extremely small package (~20 lines). The entire implementation is just type wrappers around `schema.parse()`.
