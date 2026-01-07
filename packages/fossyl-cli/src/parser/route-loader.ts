import type { RouteInfo } from '@fossyl/core';
import { scanRouteFiles } from './file-scanner';
import { collectRoutes } from './route-collector';

/**
 * Loads all routes from a routes directory.
 *
 * Scans the directory for TypeScript files and collects
 * route definitions from their exports.
 *
 * @param routesPath - Path to the routes directory
 * @returns Array of all RouteInfo objects found
 */
export async function loadRoutes(routesPath: string): Promise<RouteInfo[]> {
  const files = await scanRouteFiles(routesPath);
  const allRoutes: RouteInfo[] = [];

  for (const file of files) {
    const routes = await collectRoutes(file);
    allRoutes.push(...routes);
  }

  return allRoutes;
}
