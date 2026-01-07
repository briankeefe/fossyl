# Fossyl CLI - AI Development Guide

**CLI for the fossyl type-safe REST API framework**

## Quick Overview

The fossyl CLI is a development tool that:
- Loads and validates `fossyl.config.ts` configuration files
- Scans directories for route definitions
- Validates routes (duplicates, naming conventions)
- Generates TypeScript code via framework adapters
- Provides a development server with hot reload

## Installation

```bash
npm install -D fossyl
# or
pnpm add -D fossyl
# or
yarn add -D fossyl
```

## Commands

### `fossyl init`

Creates a new `fossyl.config.ts` file in the current directory.

```bash
npx fossyl init
npx fossyl init --adapter hono  # Use Hono instead of Express
```

### `fossyl build`

Generates code from routes using the configured framework adapter.

```bash
npx fossyl build
npx fossyl build -c custom.config.ts  # Custom config path
```

### `fossyl validate`

Validates routes without generating code. Useful for CI/CD.

```bash
npx fossyl validate
npx fossyl validate -c custom.config.ts
```

### `fossyl routes`

Lists all registered routes grouped by prefix.

```bash
npx fossyl routes
npx fossyl routes -c custom.config.ts
```

### `fossyl dev`

Starts development server with hot reload.

```bash
npx fossyl dev
npx fossyl dev -p 8080  # Custom port
```

## Configuration

The CLI loads configuration from `fossyl.config.ts`:

```typescript
import { defineConfig } from '@fossyl/core';
import { expressAdapter } from '@fossyl/express';

export default defineConfig({
  routes: './src/routes',
  output: './src/server.generated.ts',

  adapters: {
    framework: expressAdapter({
      cors: true,
      wrapResponses: true,
    }),
  },

  validation: {
    requirePrefix: '/api',
    enforceFilePrefix: true,
  },
});
```

### Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `routes` | `string` | Path to routes directory or file |
| `output` | `string` | Output path for generated code |
| `adapters.framework` | `FrameworkAdapter` | Required framework adapter |
| `adapters.database` | `DatabaseAdapter` | Optional database adapter |
| `validation.requirePrefix` | `string` | Required prefix for all routes |
| `validation.enforceFilePrefix` | `boolean` | Routes in same file must share prefix |

## Package Structure

```
packages/fossyl-cli/
├── src/
│   ├── index.ts                # CLI entry point
│   ├── commands/
│   │   ├── init.ts             # fossyl init
│   │   ├── build.ts            # fossyl build
│   │   ├── dev.ts              # fossyl dev
│   │   ├── validate.ts         # fossyl validate
│   │   └── routes.ts           # fossyl routes
│   ├── config/
│   │   ├── loader.ts           # Loads fossyl.config.ts
│   │   └── validator.ts        # Validates config structure
│   ├── parser/
│   │   ├── route-loader.ts     # Loads route files
│   │   ├── route-collector.ts  # Collects routes from exports
│   │   └── file-scanner.ts     # Scans directory for route files
│   └── validation/
│       ├── duplicate-routes.ts # No duplicate METHOD+PATH
│       ├── path-conventions.ts # Path prefix validation
│       └── index.ts            # Validation orchestrator
├── bin/
│   └── fossyl.js               # CLI binary entry
├── package.json
├── tsconfig.json
└── CLAUDE.md
```

## How It Works

### Config Loading

The CLI uses dynamic imports to load TypeScript config files. This requires `tsx` to be installed (included as a dependency).

```typescript
// Config is loaded using dynamic import
const configUrl = pathToFileURL(absolutePath).href;
const module = await import(configUrl);
const config = module.default;
```

### Route Discovery

Routes are discovered by:
1. Scanning the routes directory for `.ts` files (excluding `.d.ts`)
2. Loading each file via dynamic import
3. Checking for route objects in default exports (arrays) and named exports

```typescript
// Default export as array
export default [getUserRoute, createUserRoute];

// Named exports
export const getUserRoute = router.createEndpoint('/users/:id').get({ ... });
```

### Route Validation

Routes are validated for:
- **Duplicate routes**: Same METHOD + PATH combination
- **Naming conventions**: Required prefix, file prefix consistency

Errors block code generation. Warnings are reported but don't block.

### Code Generation

The framework adapter's `generate()` function receives:
- Array of `RouteInfo` objects (route + source file + export name)
- Generator context (output path, routes path, database adapter)

The adapter returns a string of TypeScript code that is written to the output file.

## Development Tips for AI Assistants

1. **Config Loading**: Config files are TypeScript and loaded via dynamic import with tsx
2. **Route Files**: Only `.ts` files are processed; `.d.ts` files are ignored
3. **Validation Order**: Errors are checked before warnings
4. **Exit Codes**: Commands exit with 0 on success, 1 on failure
5. **Framework Adapters**: The CLI doesn't generate code itself - it delegates to adapters

## Dependencies

- `commander` - CLI argument parsing
- `tsx` - TypeScript execution for config loading
- `@fossyl/core` (peer) - Core types and utilities

## Type Exports

The CLI primarily uses types from the `@fossyl/core` package:

```typescript
import type {
  FossylConfig,
  ValidationOptions,
  RouteInfo,
  Route,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  FrameworkAdapter,
  DatabaseAdapter,
  GeneratorContext,
  DevServer,
  DevServerOptions,
} from '@fossyl/core';
```

## Error Messages

The CLI provides clear error messages for common issues:

- Config file not found: Suggests running `fossyl init`
- Invalid config structure: Lists missing or invalid fields
- Duplicate routes: Shows both file locations
- Missing prefix: Shows required prefix
- Mixed prefixes: Lists all prefixes found in file
