import { resolve } from 'path';
import type { RouteInfo } from '@fossyl/core';
import { loadConfig } from '../config/loader';
import { loadRoutes } from '../parser/route-loader';

/**
 * Options for the routes command.
 */
export type RoutesOptions = {
  config: string;
};

/**
 * Lists all registered routes.
 *
 * Routes are grouped by their path prefix for easier reading.
 *
 * @param options - Command options
 */
export async function routesCommand(options: RoutesOptions): Promise<void> {
  const config = await loadConfig(options.config);
  const routesPath = resolve(process.cwd(), config.routes);
  const routes = await loadRoutes(routesPath);

  console.log(`\nRoutes (${routes.length} total)\n`);

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

/**
 * Groups routes by their path prefix.
 *
 * @param routes - Array of routes to group
 * @returns Map of prefix to routes
 */
function groupByPrefix(routes: RouteInfo[]): Map<string, RouteInfo[]> {
  const grouped = new Map<string, RouteInfo[]>();

  for (const route of routes) {
    const prefix = extractPrefix(route.route.path);
    const existing = grouped.get(prefix) ?? [];
    grouped.set(prefix, [...existing, route]);
  }

  return grouped;
}

/**
 * Extracts the prefix from a route path.
 *
 * @param path - The route path
 * @returns The extracted prefix
 */
function extractPrefix(path: string): string {
  const segments = path.split('/').filter(Boolean);
  return '/' + segments.slice(0, 2).join('/');
}
