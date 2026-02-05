import type { ProjectOptions } from '../../prompts';

export function generateExpressIndex(options: ProjectOptions): string {
  const imports: string[] = ["import { expressAdapter } from '@fossyl/express';"];

  if (options.database === 'kysely') {
    imports.push("import { kyselyAdapter } from '@fossyl/kysely';");
    imports.push("import { db } from './db';");
    imports.push("import { migrations } from './migrations';");
  }

  imports.push("import pingRoutes from './features/ping/routes/ping.route';");

  const adapterConfig: string[] = [];

  if (options.database === 'kysely') {
    adapterConfig.push(`const database = kyselyAdapter({
  client: db,
  migrations,
  autoMigrate: true,
});`);
  }

  const expressOptions: string[] = ['cors: true'];
  if (options.database === 'kysely') {
    expressOptions.push('database');
  }

  return `${imports.join('\n')}

${adapterConfig.join('\n\n')}

// Create Express adapter
const adapter = expressAdapter({
  ${expressOptions.join(',\n  ')},
});

// Register all routes
const routes = [...pingRoutes];
adapter.register(routes);

// Start server
const PORT = process.env.PORT ?? 3000;
adapter.listen(Number(PORT)).then(() => {
  console.log(\`Server running on http://localhost:\${PORT}\`);
});
`;
}

export function generateByoServerIndex(options: ProjectOptions): string {
  const imports: string[] = ["import { startServer } from './server';"];

  if (options.database === 'kysely') {
    imports.push("import { db } from './db';");
  }

  imports.push("import pingRoutes from './features/ping/routes/ping.route';");

  return `${imports.join('\n')}

// Collect all routes
const routes = [...pingRoutes];

// Start server (implement in ./server.ts)
const PORT = process.env.PORT ?? 3000;
startServer(routes, Number(PORT));
`;
}
