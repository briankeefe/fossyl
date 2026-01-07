# CLI Plan

## Overview

`fossyl` is the CLI package (installed as devDependency) that handles configuration loading, route parsing, validation, and orchestrates code generation via adapters.

## Package Info

- **Name**: `fossyl`
- **Type**: CLI (devDependency)
- **Dependencies**: `@fossyl/core`, `commander`, `tsx`

---

## Commands

```bash
npx fossyl init              # Create fossyl.config.ts
npx fossyl build             # Generate code from routes
npx fossyl dev               # Dev server with hot reload
npx fossyl validate          # Validate routes without generating
npx fossyl routes            # List all registered routes
```

---

## Package Structure

```
packages/fossyl/
├── src/
│   ├── index.ts                      # CLI entry point
│   ├── commands/
│   │   ├── init.ts                   # fossyl init
│   │   ├── build.ts                  # fossyl build
│   │   ├── dev.ts                    # fossyl dev
│   │   ├── validate.ts               # fossyl validate
│   │   └── routes.ts                 # fossyl routes
│   ├── config/
│   │   ├── loader.ts                 # Loads fossyl.config.ts
│   │   └── validator.ts              # Validates config structure
│   ├── parser/
│   │   ├── route-loader.ts           # Loads route files
│   │   ├── route-collector.ts        # Collects routes from exports
│   │   └── file-scanner.ts           # Scans directory for route files
│   └── validation/
│       ├── duplicate-routes.ts       # No duplicate METHOD+PATH
│       ├── path-conventions.ts       # Path prefix validation
│       └── index.ts                  # Validation orchestrator
├── bin/
│   └── fossyl.js                     # CLI binary entry
├── package.json
├── tsconfig.json
└── CLAUDE.md
```

---

## CLI Entry Point

### `src/index.ts`

```typescript
#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init';
import { buildCommand } from './commands/build';
import { devCommand } from './commands/dev';
import { validateCommand } from './commands/validate';
import { routesCommand } from './commands/routes';

const program = new Command();

program
  .name('fossyl')
  .description('Type-safe REST API framework for AI-assisted development')
  .version('0.1.0');

program
  .command('init')
  .description('Create fossyl.config.ts')
  .option('--adapter <adapter>', 'Framework adapter (express, hono)', 'express')
  .action(initCommand);

program
  .command('build')
  .description('Generate code from fossyl routes')
  .option('-c, --config <path>', 'Path to config file', 'fossyl.config.ts')
  .action(buildCommand);

program
  .command('dev')
  .description('Start development server with hot reload')
  .option('-c, --config <path>', 'Path to config file', 'fossyl.config.ts')
  .option('-p, --port <port>', 'Port to run server', '3000')
  .action(devCommand);

program
  .command('validate')
  .description('Validate routes without generating code')
  .option('-c, --config <path>', 'Path to config file', 'fossyl.config.ts')
  .action(validateCommand);

program
  .command('routes')
  .description('List all registered routes')
  .option('-c, --config <path>', 'Path to config file', 'fossyl.config.ts')
  .action(routesCommand);

program.parse();
```

### `bin/fossyl.js`

```javascript
#!/usr/bin/env node
import '../dist/index.mjs';
```

---

## Config Loader

### `src/config/loader.ts`

Loads `fossyl.config.ts` using tsx for TypeScript execution.

```typescript
import { resolve } from 'path';
import { pathToFileURL } from 'url';
import type { FossylConfig } from '@fossyl/core';
import { validateConfig } from './validator';

export async function loadConfig(configPath: string): Promise<FossylConfig> {
  const absolutePath = resolve(process.cwd(), configPath);

  try {
    // tsx allows importing TypeScript files directly
    const configUrl = pathToFileURL(absolutePath).href;
    const module = await import(configUrl);
    const config = module.default as FossylConfig;

    validateConfig(config);
    return config;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ERR_MODULE_NOT_FOUND') {
      throw new Error(
        `Config file not found: ${configPath}\n` +
        `Run 'npx fossyl init' to create one.`
      );
    }
    throw error;
  }
}
```

### `src/config/validator.ts`

```typescript
import type { FossylConfig } from '@fossyl/core';

export function validateConfig(config: unknown): asserts config is FossylConfig {
  if (!config || typeof config !== 'object') {
    throw new Error('Config must export a default object');
  }

  const c = config as Record<string, unknown>;

  if (typeof c.routes !== 'string') {
    throw new Error('Config must specify "routes" path');
  }

  if (!c.adapters || typeof c.adapters !== 'object') {
    throw new Error('Config must specify "adapters"');
  }

  const adapters = c.adapters as Record<string, unknown>;

  if (!adapters.framework || typeof adapters.framework !== 'object') {
    throw new Error('Config must specify "adapters.framework"');
  }

  if (typeof c.output !== 'string') {
    throw new Error('Config must specify "output" path');
  }
}
```

---

## Route Loader

### `src/parser/file-scanner.ts`

Scans directory for route files.

```typescript
import { readdir, stat } from 'fs/promises';
import { join, extname } from 'path';

export async function scanRouteFiles(routesPath: string): Promise<string[]> {
  const files: string[] = [];

  const entries = await readdir(routesPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(routesPath, entry.name);

    if (entry.isDirectory()) {
      const nestedFiles = await scanRouteFiles(fullPath);
      files.push(...nestedFiles);
    } else if (entry.isFile() && isRouteFile(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function isRouteFile(filename: string): boolean {
  const ext = extname(filename);
  // Only .ts files, ignore .d.ts
  return ext === '.ts' && !filename.endsWith('.d.ts');
}
```

### `src/parser/route-loader.ts`

Loads routes from files.

```typescript
import type { RouteInfo, Route } from '@fossyl/core';
import { scanRouteFiles } from './file-scanner';
import { collectRoutes } from './route-collector';

export async function loadRoutes(routesPath: string): Promise<RouteInfo[]> {
  const files = await scanRouteFiles(routesPath);
  const allRoutes: RouteInfo[] = [];

  for (const file of files) {
    const routes = await collectRoutes(file);
    allRoutes.push(...routes);
  }

  return allRoutes;
}
```

### `src/parser/route-collector.ts`

Collects routes from a single file's exports.

```typescript
import { pathToFileURL } from 'url';
import type { RouteInfo, Route } from '@fossyl/core';

export async function collectRoutes(filePath: string): Promise<RouteInfo[]> {
  const fileUrl = pathToFileURL(filePath).href;
  const module = await import(fileUrl);

  const routes: RouteInfo[] = [];

  // Check default export (expected: Route[])
  if (Array.isArray(module.default)) {
    for (const route of module.default) {
      if (isRoute(route)) {
        routes.push({
          route,
          sourceFile: filePath,
          exportName: 'default',
        });
      }
    }
  }

  // Also check named exports
  for (const [exportName, value] of Object.entries(module)) {
    if (exportName === 'default') continue;

    if (isRoute(value)) {
      routes.push({
        route: value as Route,
        sourceFile: filePath,
        exportName,
      });
    }
  }

  return routes;
}

function isRoute(value: unknown): value is Route {
  if (!value || typeof value !== 'object') return false;
  const route = value as Record<string, unknown>;
  return (
    typeof route.path === 'string' &&
    typeof route.method === 'string' &&
    typeof route.handler === 'function'
  );
}
```

---

## Validation

### `src/validation/duplicate-routes.ts`

```typescript
import type { RouteInfo, ValidationError } from '@fossyl/core';

export function validateNoDuplicateRoutes(routes: RouteInfo[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const seen = new Map<string, RouteInfo>();

  for (const routeInfo of routes) {
    const key = `${routeInfo.route.method} ${routeInfo.route.path}`;

    const existing = seen.get(key);
    if (existing) {
      errors.push({
        type: 'duplicate-route',
        message: `Duplicate route: ${key} (also defined in ${existing.sourceFile})`,
        file: routeInfo.sourceFile,
      });
    } else {
      seen.set(key, routeInfo);
    }
  }

  return errors;
}
```

### `src/validation/path-conventions.ts`

```typescript
import type { RouteInfo, ValidationWarning, ValidationOptions } from '@fossyl/core';

export function validatePathConventions(
  routes: RouteInfo[],
  options: ValidationOptions = {}
): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  if (options.requirePrefix) {
    for (const routeInfo of routes) {
      if (!routeInfo.route.path.startsWith(options.requirePrefix)) {
        warnings.push({
          type: 'naming-convention',
          message: `Route path should start with "${options.requirePrefix}"`,
          file: routeInfo.sourceFile,
        });
      }
    }
  }

  if (options.enforceFilePrefix) {
    const byFile = groupByFile(routes);

    for (const [file, fileRoutes] of byFile) {
      const prefixes = new Set(fileRoutes.map(r => extractPrefix(r.route.path)));

      if (prefixes.size > 1) {
        warnings.push({
          type: 'mixed-prefix',
          message: `Routes have inconsistent prefixes: ${Array.from(prefixes).join(', ')}`,
          file,
        });
      }
    }
  }

  return warnings;
}

function groupByFile(routes: RouteInfo[]): Map<string, RouteInfo[]> {
  const grouped = new Map<string, RouteInfo[]>();
  for (const route of routes) {
    const existing = grouped.get(route.sourceFile) ?? [];
    grouped.set(route.sourceFile, [...existing, route]);
  }
  return grouped;
}

function extractPrefix(path: string): string {
  const segments = path.split('/').filter(Boolean);
  return '/' + segments.slice(0, 2).join('/');
}
```

### `src/validation/index.ts`

```typescript
import type { RouteInfo, ValidationResult, ValidationOptions } from '@fossyl/core';
import { validateNoDuplicateRoutes } from './duplicate-routes';
import { validatePathConventions } from './path-conventions';

export function validateRoutes(
  routes: RouteInfo[],
  options?: ValidationOptions
): ValidationResult {
  const errors = validateNoDuplicateRoutes(routes);
  const warnings = validatePathConventions(routes, options);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
```

---

## Commands

### `src/commands/build.ts`

```typescript
import { resolve } from 'path';
import { writeFileSync } from 'fs';
import { loadConfig } from '../config/loader';
import { loadRoutes } from '../parser/route-loader';
import { validateRoutes } from '../validation';

type BuildOptions = {
  config: string;
};

export async function buildCommand(options: BuildOptions): Promise<void> {
  console.log('🔨 Building fossyl app...\n');

  const config = await loadConfig(options.config);
  console.log(`   Config: ${options.config}`);
  console.log(`   Adapter: ${config.adapters.framework.name}`);

  const routesPath = resolve(process.cwd(), config.routes);
  const routes = await loadRoutes(routesPath);
  console.log(`   Routes: ${routes.length} found`);

  const validation = validateRoutes(routes, config.validation);

  if (validation.errors.length > 0) {
    console.error('\n❌ Build failed:\n');
    for (const error of validation.errors) {
      console.error(`   ${error.file}: ${error.message}`);
    }
    process.exit(1);
  }

  if (validation.warnings.length > 0) {
    console.warn('\n⚠️  Warnings:\n');
    for (const warning of validation.warnings) {
      console.warn(`   ${warning.file}: ${warning.message}`);
    }
  }

  const outputPath = resolve(process.cwd(), config.output);
  const code = config.adapters.framework.generate(routes, {
    outputPath: config.output,
    routesPath: config.routes,
    databaseAdapter: config.adapters.database,
  });

  writeFileSync(outputPath, code, 'utf-8');

  console.log(`\n✅ Generated ${config.output}`);
}
```

### `src/commands/init.ts`

```typescript
import { existsSync, writeFileSync } from 'fs';
import { resolve } from 'path';

type InitOptions = {
  adapter: string;
};

const CONFIG_TEMPLATE = `import { defineConfig } from '@fossyl/core';
import { expressAdapter } from '@fossyl/express';

export default defineConfig({
  routes: './src/routes',
  output: './src/server.generated.ts',

  adapters: {
    framework: expressAdapter({
      cors: true,
      wrapResponses: true,
    }),
    // database: prismaKyselyAdapter({ ... }),
  },

  validation: {
    requirePrefix: '/api',
    enforceFilePrefix: true,
  },
});
`;

export async function initCommand(options: InitOptions): Promise<void> {
  const configPath = resolve(process.cwd(), 'fossyl.config.ts');

  if (existsSync(configPath)) {
    console.error('❌ fossyl.config.ts already exists');
    process.exit(1);
  }

  let template = CONFIG_TEMPLATE;
  if (options.adapter !== 'express') {
    template = template
      .replace('@fossyl/express', `@fossyl/${options.adapter}`)
      .replace('expressAdapter', `${options.adapter}Adapter`);
  }

  writeFileSync(configPath, template, 'utf-8');

  console.log('✅ Created fossyl.config.ts\n');
  console.log('Next steps:');
  console.log(`  1. npm install -D fossyl`);
  console.log(`  2. npm install @fossyl/core @fossyl/${options.adapter}`);
  console.log('  3. Create routes in ./src/routes/');
  console.log('  4. npx fossyl build');
}
```

### `src/commands/validate.ts`

```typescript
import { resolve } from 'path';
import { loadConfig } from '../config/loader';
import { loadRoutes } from '../parser/route-loader';
import { validateRoutes } from '../validation';

type ValidateOptions = {
  config: string;
};

export async function validateCommand(options: ValidateOptions): Promise<void> {
  console.log('🔍 Validating routes...\n');

  const config = await loadConfig(options.config);
  const routesPath = resolve(process.cwd(), config.routes);
  const routes = await loadRoutes(routesPath);

  console.log(`   Found ${routes.length} routes\n`);

  const validation = validateRoutes(routes, config.validation);

  if (validation.errors.length > 0) {
    console.error('❌ Errors:\n');
    for (const error of validation.errors) {
      console.error(`   ${error.file}: ${error.message}`);
    }
  }

  if (validation.warnings.length > 0) {
    console.warn('⚠️  Warnings:\n');
    for (const warning of validation.warnings) {
      console.warn(`   ${warning.file}: ${warning.message}`);
    }
  }

  if (validation.valid && validation.warnings.length === 0) {
    console.log('✅ All routes valid!');
  }

  process.exit(validation.valid ? 0 : 1);
}
```

### `src/commands/routes.ts`

```typescript
import { resolve } from 'path';
import { loadConfig } from '../config/loader';
import { loadRoutes } from '../parser/route-loader';

type RoutesOptions = {
  config: string;
};

export async function routesCommand(options: RoutesOptions): Promise<void> {
  const config = await loadConfig(options.config);
  const routesPath = resolve(process.cwd(), config.routes);
  const routes = await loadRoutes(routesPath);

  console.log(`\n📍 Routes (${routes.length} total)\n`);

  const grouped = groupByPrefix(routes);

  for (const [prefix, prefixRoutes] of grouped) {
    console.log(`${prefix}/`);
    for (const r of prefixRoutes) {
      const method = r.route.method.padEnd(6);
      const path = r.route.path;
      const type = r.route.type;
      console.log(`  ${method} ${path}  (${type})`);
    }
    console.log('');
  }
}

function groupByPrefix(routes: RouteInfo[]): Map<string, RouteInfo[]> {
  const grouped = new Map<string, RouteInfo[]>();

  for (const route of routes) {
    const prefix = extractPrefix(route.route.path);
    const existing = grouped.get(prefix) ?? [];
    grouped.set(prefix, [...existing, route]);
  }

  return grouped;
}

function extractPrefix(path: string): string {
  const segments = path.split('/').filter(Boolean);
  return '/' + segments.slice(0, 2).join('/');
}
```

### `src/commands/dev.ts`

```typescript
import { resolve } from 'path';
import { loadConfig } from '../config/loader';
import { loadRoutes } from '../parser/route-loader';

type DevOptions = {
  config: string;
  port: string;
};

export async function devCommand(options: DevOptions): Promise<void> {
  const config = await loadConfig(options.config);
  const port = parseInt(options.port, 10);

  console.log('🚀 Starting dev server...\n');

  const routesPath = resolve(process.cwd(), config.routes);
  const routes = await loadRoutes(routesPath);

  if (!config.adapters.framework.createDevServer) {
    console.error('❌ Adapter does not support dev server');
    process.exit(1);
  }

  const server = config.adapters.framework.createDevServer(routes, {
    port,
    routesPath: config.routes,
  });

  await server.start();

  console.log(`   Server running on http://localhost:${port}`);
  console.log('   Watching for changes...\n');

  // TODO: File watcher for hot reload
}
```

---

## Package Configuration

### `package.json`

```json
{
  "name": "fossyl",
  "version": "0.1.0",
  "description": "CLI for fossyl - Type-safe REST API framework",
  "type": "module",
  "bin": {
    "fossyl": "./bin/fossyl.js"
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts",
    "dev": "tsup src/index.ts --format esm --dts --watch"
  },
  "dependencies": {
    "@fossyl/core": "workspace:*",
    "commander": "^12.0.0",
    "tsx": "^4.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.8.0"
  }
}
```

---

## Implementation Order

1. Set up package structure
2. Implement config loader and validator
3. Implement file scanner and route collector
4. Implement validation modules
5. Implement `init` command
6. Implement `build` command
7. Implement `validate` command
8. Implement `routes` command
9. Implement `dev` command (basic, no hot reload)
10. Add file watching for hot reload
11. Write CLAUDE.md

---

## Success Criteria

- [ ] `npx fossyl init` creates valid config
- [ ] `npx fossyl build` generates code via adapter
- [ ] `npx fossyl validate` catches duplicate routes
- [ ] `npx fossyl routes` displays route table
- [ ] `npx fossyl dev` starts dev server
- [ ] Config loading handles TypeScript files
- [ ] Clear error messages for all failure cases
