import type { ProjectOptions } from '../prompts';

export function generatePackageJson(options: ProjectOptions): string {
  const dependencies: Record<string, string> = {
    '@fossyl/core': '^0.9.0',
  };

  const devDependencies: Record<string, string> = {
    '@types/node': '^22.0.0',
    tsx: '^4.0.0',
    typescript: '^5.8.0',
  };

  if (options.server === 'express') {
    dependencies['@fossyl/express'] = '^0.9.0';
    dependencies['express'] = '^4.21.0';
    devDependencies['@types/express'] = '^4.17.0';
  }

  if (options.validator === 'zod') {
    dependencies['@fossyl/zod'] = '^0.9.0';
    dependencies['zod'] = '^3.24.0';
  }

  if (options.database === 'kysely') {
    dependencies['@fossyl/kysely'] = '^0.9.0';
    dependencies['kysely'] = '^0.27.0';

    if (options.dialect === 'sqlite') {
      dependencies['better-sqlite3'] = '^11.0.0';
      devDependencies['@types/better-sqlite3'] = '^7.6.0';
    } else if (options.dialect === 'mysql') {
      dependencies['mysql2'] = '^3.11.0';
    } else {
      // PostgreSQL (default)
      dependencies['pg'] = '^8.13.0';
      devDependencies['@types/pg'] = '^8.11.0';
    }
  }

  const pkg = {
    name: options.name === '.' ? 'my-fossyl-api' : options.name,
    version: '0.1.0',
    type: 'module',
    scripts: {
      dev: 'tsx watch src/index.ts',
      build: 'tsc',
      start: 'node dist/index.js',
    },
    dependencies,
    devDependencies,
  };

  return JSON.stringify(pkg, null, 2) + '\n';
}

export function generateTsConfig(): string {
  const config = {
    compilerOptions: {
      target: 'ES2022',
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      esModuleInterop: true,
      strict: true,
      skipLibCheck: true,
      outDir: './dist',
      rootDir: './src',
      declaration: true,
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist'],
  };

  return JSON.stringify(config, null, 2) + '\n';
}

export function generateEnvExample(options: ProjectOptions): string {
  let content = `# Server
PORT=3000
`;

  if (options.database === 'kysely') {
    content += `
# Database
`;
    if (options.dialect === 'sqlite') {
      content += `DATABASE_PATH=./data/app.db
`;
    } else if (options.dialect === 'mysql') {
      content += `DATABASE_URL=mysql://user:password@localhost:3306/mydb
`;
    } else {
      // PostgreSQL (default)
      content += `DATABASE_URL=postgres://user:password@localhost:5432/mydb
`;
    }
  }

  return content;
}

export function generateAuth(): string {
  return `import { authWrapper } from '@fossyl/core';

// Authentication function (customize based on your auth strategy)
export const authenticator = async (headers: Record<string, string>) => {
  // TODO: Implement your authentication logic
  // Example: JWT verification, OAuth validation, API key check, etc.
  const userId = headers['x-user-id'];
  if (!userId) {
    throw new Error('Unauthorized');
  }
  return authWrapper({ userId });
};
`;
}

export function generateClaudeMd(options: ProjectOptions): string {
  const adapterDocs: string[] = [];

  if (options.server === 'express') {
    adapterDocs.push('- `@fossyl/express` - Express.js runtime adapter');
  }
  if (options.validator === 'zod') {
    adapterDocs.push('- `@fossyl/zod` - Zod validation adapter');
  }
  if (options.database === 'kysely') {
    adapterDocs.push('- `@fossyl/kysely` - Kysely database adapter');
  }

  const byoNotes: string[] = [];
  if (options.server === 'byo') {
    byoNotes.push(`
### Server (BYO)
You need to implement your own server adapter. See \`src/server.ts\` for the placeholder.
Check the @fossyl/express source for reference: https://github.com/YoyoSaur/fossyl/tree/main/packages/express`);
  }
  if (options.validator === 'byo') {
    byoNotes.push(`
### Validator (BYO)
You need to implement your own validators. See \`src/features/ping/validators/ping.validators.ts\` for the placeholder.
Check the @fossyl/zod source for reference: https://github.com/YoyoSaur/fossyl/tree/main/packages/zod`);
  }
  if (options.database === 'byo') {
    byoNotes.push(`
### Database (BYO)
You need to implement your own database layer. See \`src/db.ts\` for the placeholder.
Check the @fossyl/kysely source for reference: https://github.com/YoyoSaur/fossyl/tree/main/packages/kysely`);
  }

  return `# ${options.name} - AI Development Guide

**Fossyl REST API project**

## Project Structure

\`\`\`
src/
├── features/
│   └── ping/
│       ├── routes/ping.route.ts      # Route definitions
│       ├── services/ping.service.ts  # Business logic
│       ├── validators/               # Request validators
│       └── repo/ping.repo.ts         # Database access
├── migrations/                       # Database migrations
├── types/
│   └── db.ts                         # Database type definitions
├── db.ts                             # Database setup
└── index.ts                          # Main entry point
\`\`\`

## Adapters Used

${adapterDocs.join('\n')}

## Quick Start

\`\`\`bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
\`\`\`

## Adding New Features

1. Create a new feature directory under \`src/features/\`
2. Add route definitions in \`routes/\`
3. Add business logic in \`services/\`
4. Add database access in \`repo/\`
5. Add validators in \`validators/\`
6. Register routes in \`src/index.ts\`

## Route Types

Fossyl provides four route types:

- **OpenRoute**: No authentication or body validation
- **AuthenticatedRoute**: Requires authentication, no body validation
- **ValidatedRoute**: Requires body validation, no authentication
- **FullRoute**: Requires both authentication and body validation

## Handler Parameter Order

- Routes with body: \`handler(params, [auth,] body)\`
- Routes without body: \`handler(params [, auth])\`
${byoNotes.join('\n')}

## Documentation

- Core: https://github.com/YoyoSaur/fossyl/tree/main/packages/core
- Express: https://github.com/YoyoSaur/fossyl/tree/main/packages/express
- Zod: https://github.com/YoyoSaur/fossyl/tree/main/packages/zod
- Kysely: https://github.com/YoyoSaur/fossyl/tree/main/packages/kysely
`;
}
