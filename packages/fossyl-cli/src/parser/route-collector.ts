import { pathToFileURL } from 'url';
import type { RouteInfo, Route } from '@fossyl/core';

/**
 * Collects routes from a single file's exports.
 *
 * Looks for:
 * - Default export as an array of routes
 * - Named exports that are route objects
 *
 * @param filePath - Absolute path to the route file
 * @returns Array of RouteInfo objects found in the file
 */
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

/**
 * Type guard to check if a value is a valid Route object.
 *
 * @param value - The value to check
 * @returns True if the value is a Route
 */
function isRoute(value: unknown): value is Route {
  if (!value || typeof value !== 'object') return false;
  const route = value as Record<string, unknown>;
  return (
    typeof route.path === 'string' &&
    typeof route.method === 'string' &&
    typeof route.handler === 'function'
  );
}
