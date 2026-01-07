import { resolve } from 'path';
import { loadConfig } from '../config/loader';
import { loadRoutes } from '../parser/route-loader';

/**
 * Options for the dev command.
 */
export type DevOptions = {
  config: string;
  port: string;
};

/**
 * Starts the development server with hot reload.
 *
 * Requires the framework adapter to support createDevServer.
 *
 * @param options - Command options
 */
export async function devCommand(options: DevOptions): Promise<void> {
  const config = await loadConfig(options.config);
  const port = parseInt(options.port, 10);

  console.log('Starting dev server...\n');

  const routesPath = resolve(process.cwd(), config.routes);
  const routes = await loadRoutes(routesPath);

  if (!config.adapters.framework.createDevServer) {
    console.error('Adapter does not support dev server');
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
