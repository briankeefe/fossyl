# Fossyl Development Roadmap

This roadmap outlines the development plan for Fossyl, organized by priority and dependency order.

All tasks are tracked as GitHub issues: https://github.com/YoyoSaur/fossyl/issues

## Core Philosophy

Fossyl follows a **pure functional, types-only** design philosophy:
- ✅ **Pure functions only** - No classes, no interfaces
- ✅ **Types-only approach** - Minimal runtime overhead
- ✅ **Validators are functions** - `(data: unknown) => T`
- ✅ **Zero dependencies in core** - Adapters are separate packages
- ✅ **Immutable data** - `readonly` types everywhere

---

## ✅ Completed

### #2: Refactor validation layer to pure functional types
**Status:** ✅ Complete

Pure functional validator abstraction implemented:
```typescript
export type Validator<T> = (data: unknown) => T;
```

Adapters available: `@fossyl/zod`

---

### #3: Write CLAUDE.md for AI-assisted development
**Status:** ✅ Complete

Each package includes comprehensive `CLAUDE.md` documentation for AI code generation.

---

### #4: Write comprehensive core documentation
**Status:** ✅ Complete

Core library documented with README and CLAUDE.md covering all route types, authentication patterns, and API reference.

---

### #5: Build Express runtime adapter
**Status:** ✅ Complete

`@fossyl/express` package available with full route registration and server lifecycle management.

---

### #10: Set up monorepo structure with pnpm workspaces
**Status:** ✅ Complete

Monorepo structure:
```
packages/
├── core/       # @fossyl/core - Router and types
├── cli/        # fossyl - Scaffolding CLI
├── express/    # @fossyl/express - Express adapter
├── zod/        # @fossyl/zod - Zod validation adapter
├── kysely/     # @fossyl/kysely - Kysely database adapter
└── docs/       # Documentation site
```

---

### #15: Add query parameter validation support
**Status:** ✅ Complete

Query validation implemented via `queryValidator`:
```typescript
queryValidator: zodQueryValidator(z.object({
  limit: z.coerce.number().optional()
}))
```

---

### Zod validation adapter
**Status:** ✅ Complete

`@fossyl/zod` package with `zodValidator` and `zodQueryValidator` helpers.

---

### Kysely database adapter
**Status:** ✅ Complete

`@fossyl/kysely` package with migration support and transaction context.

---

### CLI package separation (2025-02-01)
**Status:** ✅ Complete

CLI moved from `@fossyl/core` to unscoped `fossyl` package:
- Enables `npx fossyl --create my-api` (cleaner than `npx @fossyl/core`)
- Core package stays focused on router/types
- Independent versioning for CLI updates

---

## Phase 2: Core Features

### #6: Add route builder customization types
**Labels:** `enhancement`, `core`, `types`

Enable custom metadata and extensions for route builders.

**Dependencies:** None

---

### #7: Create validation adapters for Yup and ArkType
**Labels:** `enhancement`, `validation`

Provide alternative validators:
```typescript
export const yupAdapter = <T>(schema: yup.Schema<T>): Validator<T> => ...
export const arkAdapter = <T>(schema: Type<T>): Validator<T> => ...
```

**Dependencies:** #2 (validator abstraction) ✅

---

### #14: Implement standard error handling pattern
**Labels:** `enhancement`, `error-handling`

Pure functional error types:
```typescript
export type FossylError = {
  readonly type: 'validation' | 'authentication' | 'not-found' | 'internal';
  readonly message: string;
  readonly statusCode: number;
};

export const createError = (...) => ({ ... }); // Pure function
```

**Dependencies:** None
**Impact:** Consistent error handling across adapters

---

## Phase 3: Runtime Adapters

### #8: Build Hono runtime adapter
**Labels:** `enhancement`, `runtime-adapter`

Hono adapter following Express pattern.

**Dependencies:** #5 (reference Express implementation) ✅
**Blocks:** #12 (Hono+Drizzle starter)

---

### #9: Build Fastify runtime adapter
**Labels:** `enhancement`, `runtime-adapter`

Fastify adapter following Express pattern.

**Dependencies:** #5 (reference Express implementation) ✅
**Blocks:** #13 (Fastify+Kysely starter)

---

## Phase 4: Starter Templates

### #11: Create Express + Prisma starter template
**Labels:** `starter-template`, `priority:medium`

Complete opinionated starter with:
- Full CRUD example
- Authentication (JWT)
- Error handling
- Database integration

**Dependencies:** #5 (Express adapter) ✅, #14 (error handling)
**Impact:** Reference implementation for AI and developers

---

### #12: Create Hono + Drizzle starter template
**Labels:** `starter-template`

Edge-optimized starter for Cloudflare Workers.

**Dependencies:** #8 (Hono adapter)

---

### #13: Create Fastify + Kysely starter template
**Labels:** `starter-template`

High-performance starter with raw SQL.

**Dependencies:** #9 (Fastify adapter)

---

## Phase 5: Advanced Features (Future)

### #16: Add middleware support (functional approach)
**Labels:** `enhancement`, `middleware`, `future`

Pure functional middleware:
```typescript
export type Middleware<In, Out> = (context: In) => Out | Promise<Out>;
```

**Dependencies:** None

---

### #17: Implement response type validation
**Labels:** `enhancement`, `validation`, `future`

Optional dev-mode response validation.

**Dependencies:** #2 (validator abstraction) ✅

---

### #18: Generate OpenAPI/Swagger documentation from routes
**Labels:** `enhancement`, `documentation`, `future`

Auto-generate OpenAPI specs from route definitions.

**Dependencies:** #15 (query validation) ✅

---

### #19: Add HTTP status code typing to responses
**Labels:** `enhancement`, `types`, `future`

Type-safe status codes:
```typescript
return response({ todo }, 200);
return response({ error: 'Not found' }, 404);
```

**Dependencies:** None

---

### #20: Implement pagination pattern and types
**Labels:** `enhancement`, `future`

Standard pagination helpers:
```typescript
export const paginate = <T>(items: readonly T[], total: number, params: PaginationParams) => ...
```

**Dependencies:** None

---

### #21: Create testing utilities and patterns
**Labels:** `testing`, `future`

Pure functional testing helpers:
```typescript
export const testHandler = async <R extends Route>(route: R, params: {...}) => ...
```

**Dependencies:** None

---

## Documentation & Meta

### #1: Write comprehensive FAQ documentation
**Labels:** `documentation`

Cover common questions, troubleshooting, design decisions.

**Dependencies:** #4 (core docs) ✅

---

### #22: Add contribution guidelines
**Labels:** `documentation`, `meta`

CONTRIBUTING.md with:
- Pure functional code style
- PR process
- Testing requirements
- Architecture principles

**Dependencies:** #10 (monorepo structure) ✅

---

## Notes

- All implementations must follow **pure functional, types-only** philosophy
- No classes or interfaces - use types and pure functions
- Keep core dependency-free
- Maintain backward compatibility
- All new features need tests
- Update CLAUDE.md for AI-relevant changes

---

Last updated: 2025-02-01
