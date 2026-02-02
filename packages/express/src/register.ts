import type { Route } from '@fossyl/core';

/**
 * A group of routes that share a common prefix.
 */
export type RouteGroup = {
  prefix: string;
  routes: Route[];
};

/**
 * Groups routes by their common static path prefix.
 */
export function groupRoutes(routes: Route[]): RouteGroup[] {
  const prefixGroups = new Map<string, Route[]>();

  for (const route of routes) {
    const prefix = getRoutePrefix(route.path);
    const group = prefixGroups.get(prefix) ?? [];
    group.push(route);
    prefixGroups.set(prefix, group);
  }

  const result: RouteGroup[] = [];
  for (const [prefix, groupRoutes] of prefixGroups) {
    result.push({ prefix, routes: groupRoutes });
  }

  return result;
}

/**
 * Extracts the static prefix from a route path.
 * Stops at the first dynamic segment.
 *
 * Examples:
 * /api/users/:id -> /api/users
 * /api/users     -> /api/users
 * /:id           -> /
 */
function getRoutePrefix(path: string): string {
  const segments = path.split('/').filter(Boolean);
  const staticSegments: string[] = [];

  for (const seg of segments) {
    if (seg.startsWith(':')) break;
    staticSegments.push(seg);
  }

  return '/' + staticSegments.join('/');
}
