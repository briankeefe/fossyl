# Zod Adapter Plan

## Overview

`@fossyl/zod` is a tiny **validation adapter** that provides type-safe validator wrappers for Zod schemas. It extracts the type from the schema so handlers receive properly typed body/query params.

## Package Info

- **Name**: `@fossyl/zod`
- **Type**: Validation Adapter (utility)
- **Peer Dependencies**: `zod`
- **Size**: ~10 lines of code

---

## Why This Exists

Without the wrapper, you lose type inference:

```typescript
// Without @fossyl/zod - body is unknown
validator: (data) => userSchema.parse(data),
handler: async ({ url }, body) => {
  body.name  // ❌ Error: 'body' is of type 'unknown'
}

// With @fossyl/zod - body is inferred from schema
validator: zodValidator(userSchema),
handler: async ({ url }, body) => {
  body.name  // ✅ string
}
```

---

## Package Structure

```
packages/zod/
├── src/
│   └── index.ts                      # Everything in one file
├── package.json
├── tsconfig.json
└── CLAUDE.md
```

---

## Implementation

### `src/index.ts`

The entire package:

```typescript
import type { z } from 'zod';

/**
 * Create a type-safe validator from a Zod schema.
 * Extracts the inferred type so handlers receive properly typed data.
 *
 * @example
 * ```typescript
 * import { zodValidator } from '@fossyl/zod';
 * import { z } from 'zod';
 *
 * const userSchema = z.object({
 *   name: z.string(),
 *   email: z.string().email(),
 * });
 *
 * router.endpoint('/users').post({
 *   validator: zodValidator(userSchema),
 *   handler: async ({ url }, body) => {
 *     // body is { name: string, email: string }
 *     console.log(body.name);
 *   },
 * });
 * ```
 */
export function zodValidator<T extends z.ZodType>(
  schema: T
): (data: unknown) => z.infer<T> {
  return (data: unknown) => schema.parse(data);
}

/**
 * Create a type-safe query validator from a Zod schema.
 * Same as zodValidator, but semantically indicates query params.
 *
 * @example
 * ```typescript
 * const querySchema = z.object({
 *   page: z.coerce.number().default(1),
 *   limit: z.coerce.number().default(10),
 * });
 *
 * router.endpoint('/users').get({
 *   queryValidator: zodQueryValidator(querySchema),
 *   handler: async ({ url, query }) => {
 *     // query is { page: number, limit: number }
 *     console.log(query.page);
 *   },
 * });
 * ```
 */
export function zodQueryValidator<T extends z.ZodType>(
  schema: T
): (data: unknown) => z.infer<T> {
  return (data: unknown) => schema.parse(data);
}
```

That's it. ~20 lines including docs.

---

## Usage

### Body Validation

```typescript
// src/routes/users.ts
import { createRouter } from '@fossyl/core';
import { zodValidator } from '@fossyl/zod';
import { z } from 'zod';

const router = createRouter('/api/users');

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().optional(),
});

export const createUser = router.endpoint('/').post({
  validator: zodValidator(createUserSchema),
  handler: async ({ url }, body) => {
    // body is { name: string, email: string, age?: number }
    return { created: true, name: body.name };
  },
});
```

### Query Validation

```typescript
const listQuerySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  search: z.string().optional(),
});

export const listUsers = router.endpoint('/').get({
  queryValidator: zodQueryValidator(listQuerySchema),
  handler: async ({ query }) => {
    // query is { page: number, limit: number, search?: string }
    return { page: query.page, results: [] };
  },
});
```

### With Authentication

```typescript
const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
});

export const updateUser = router.endpoint('/:id').put({
  authenticator: jwtAuth,
  validator: zodValidator(updateUserSchema),
  handler: async ({ url }, auth, body) => {
    // url.id is string
    // auth is typed from jwtAuth
    // body is { name?: string, email?: string }
    return { updated: true };
  },
});
```

---

## Package Configuration

### `package.json`

```json
{
  "name": "@fossyl/zod",
  "version": "0.1.0",
  "description": "Zod validation adapter for fossyl",
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
    "zod": "^3.0.0"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.8.0",
    "zod": "^3.23.0"
  }
}
```

---

## Why Not Other Validation Libraries?

Future packages could follow the same pattern:

### `@fossyl/valibot`

```typescript
import type { BaseSchema, InferOutput } from 'valibot';
import { parse } from 'valibot';

export function valibotValidator<T extends BaseSchema>(
  schema: T
): (data: unknown) => InferOutput<T> {
  return (data: unknown) => parse(schema, data);
}
```

### `@fossyl/yup`

```typescript
import type { Schema, InferType } from 'yup';

export function yupValidator<T extends Schema>(
  schema: T
): (data: unknown) => InferType<T> {
  return (data: unknown) => schema.validateSync(data);
}
```

Each is ~5-10 lines. The pattern is identical.

---

## Implementation Order

1. Create package structure
2. Write `index.ts` (5 minutes)
3. Write tests
4. Write CLAUDE.md

---

## Success Criteria

- [ ] Type inference works: `body` has schema type
- [ ] Query validation works with `zodQueryValidator`
- [ ] Works with `z.infer<T>` for complex schemas
- [ ] Zero runtime overhead (just calls `schema.parse`)
- [ ] Tiny bundle size (<1KB)
