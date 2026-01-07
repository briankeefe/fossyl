import type { RouteInfo } from '@fossyl/core';

/**
 * Result of middleware analysis.
 * Contains maps of middleware names to the routes that use them.
 */
export type AnalyzedMiddleware = {
  /** Map of authenticator function names to routes using them */
  authenticators: Map<string, RouteInfo[]>;
  /** Map of validator function names to routes using them */
  validators: Map<string, RouteInfo[]>;
};

/**
 * Analyzes routes to detect shared middleware for hoisting decisions.
 * When multiple routes share the same middleware, it can be hoisted to
 * the router level for better performance and cleaner generated code.
 *
 * @param routes - Array of RouteInfo objects to analyze
 * @param hoistThreshold - Minimum routes sharing middleware before hoisting (default: 3)
 * @returns AnalyzedMiddleware with maps of shared middleware
 */
export function analyzeMiddleware(
  routes: RouteInfo[],
  hoistThreshold: number = 3
): AnalyzedMiddleware {
  const authenticators = new Map<string, RouteInfo[]>();
  const validators = new Map<string, RouteInfo[]>();

  for (const routeInfo of routes) {
    const route = routeInfo.route;

    // Check for authenticator
    if ("authenticator" in route && route.authenticator) {
      const name = route.authenticator.name || "anonymous";
      const existing = authenticators.get(name) ?? [];
      authenticators.set(name, [...existing, routeInfo]);
    }

    // Check for validator
    if ("validator" in route && route.validator) {
      const name = route.validator.name || "anonymous";
      const existing = validators.get(name) ?? [];
      validators.set(name, [...existing, routeInfo]);
    }
  }

  // Filter: only keep if >= threshold routes share it
  return {
    authenticators: filterByThreshold(authenticators, hoistThreshold),
    validators: filterByThreshold(validators, hoistThreshold),
  };
}

/**
 * Filters a map to only include entries with at least `threshold` items.
 */
function filterByThreshold<T>(
  map: Map<string, T[]>,
  threshold: number
): Map<string, T[]> {
  return new Map(
    Array.from(map.entries()).filter(([_, items]) => items.length >= threshold)
  );
}

/**
 * Checks if a route's authenticator should be hoisted (applied at router level).
 *
 * @param routeInfo - The route to check
 * @param analyzed - The analyzed middleware results
 * @returns true if the authenticator should be hoisted
 */
export function isAuthenticatorHoisted(
  routeInfo: RouteInfo,
  analyzed: AnalyzedMiddleware
): boolean {
  const route = routeInfo.route;

  if (!("authenticator" in route) || !route.authenticator) {
    return false;
  }

  const name = route.authenticator.name || "anonymous";
  return analyzed.authenticators.has(name);
}

/**
 * Checks if a route's validator should be hoisted (applied at router level).
 *
 * @param routeInfo - The route to check
 * @param analyzed - The analyzed middleware results
 * @returns true if the validator should be hoisted
 */
export function isValidatorHoisted(
  routeInfo: RouteInfo,
  analyzed: AnalyzedMiddleware
): boolean {
  const route = routeInfo.route;

  if (!("validator" in route) || !route.validator) {
    return false;
  }

  const name = route.validator.name || "anonymous";
  return analyzed.validators.has(name);
}

/**
 * Gets all unique authenticator names used in routes.
 *
 * @param routes - Array of RouteInfo objects
 * @returns Set of authenticator function names
 */
export function getUniqueAuthenticators(routes: RouteInfo[]): Set<string> {
  const names = new Set<string>();

  for (const routeInfo of routes) {
    const route = routeInfo.route;

    if ("authenticator" in route && route.authenticator) {
      const name = route.authenticator.name || "anonymous";
      names.add(name);
    }
  }

  return names;
}

/**
 * Gets all unique validator names used in routes.
 *
 * @param routes - Array of RouteInfo objects
 * @returns Set of validator function names
 */
export function getUniqueValidators(routes: RouteInfo[]): Set<string> {
  const names = new Set<string>();

  for (const routeInfo of routes) {
    const route = routeInfo.route;

    if ("validator" in route && route.validator) {
      const name = route.validator.name || "anonymous";
      names.add(name);
    }
  }

  return names;
}
