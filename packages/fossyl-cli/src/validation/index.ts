import type { RouteInfo, ValidationResult, ValidationOptions } from '@fossyl/core';
import { validateNoDuplicateRoutes } from './duplicate-routes';
import { validatePathConventions } from './path-conventions';

/**
 * Validates routes against all validation rules.
 *
 * Combines duplicate route checking and path convention validation.
 * Returns a result object with errors (blocking) and warnings (non-blocking).
 *
 * @param routes - Array of routes to validate
 * @param options - Validation options
 * @returns Validation result with errors and warnings
 */
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
