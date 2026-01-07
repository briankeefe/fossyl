import type { RouteInfo, ValidationWarning, ValidationOptions } from '@fossyl/core';

/**
 * Validates path conventions for routes.
 *
 * Checks:
 * - Required prefix (e.g., all routes must start with '/api')
 * - File prefix consistency (routes in same file should share prefix)
 *
 * @param routes - Array of routes to validate
 * @param options - Validation options
 * @returns Array of validation warnings
 */
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
      const prefixes = new Set(fileRoutes.map((r) => extractPrefix(r.route.path)));

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

/**
 * Groups routes by their source file.
 *
 * @param routes - Array of routes to group
 * @returns Map of file path to routes in that file
 */
function groupByFile(routes: RouteInfo[]): Map<string, RouteInfo[]> {
  const grouped = new Map<string, RouteInfo[]>();
  for (const route of routes) {
    const existing = grouped.get(route.sourceFile) ?? [];
    grouped.set(route.sourceFile, [...existing, route]);
  }
  return grouped;
}

/**
 * Extracts the prefix from a route path.
 *
 * Takes the first two path segments as the prefix.
 * e.g., '/api/users/:id' -> '/api/users'
 *
 * @param path - The route path
 * @returns The extracted prefix
 */
function extractPrefix(path: string): string {
  const segments = path.split('/').filter(Boolean);
  return '/' + segments.slice(0, 2).join('/');
}
