import type { RouteInfo, ValidationError } from '@fossyl/core';

/**
 * Validates that there are no duplicate routes.
 *
 * A duplicate route is when two routes have the same HTTP method and path.
 *
 * @param routes - Array of routes to validate
 * @returns Array of validation errors for duplicate routes
 */
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
