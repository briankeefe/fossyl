import type { RouteInfo } from '@fossyl/core';

/**
 * A node in the route tree structure.
 * Used to organize routes hierarchically for efficient Express router generation.
 */
export type RouteNode = {
  /** The path segment for this node (e.g., "users" or ":id") */
  segment: string;
  /** The full path from root to this node */
  fullPath: string;
  /** Routes that terminate at this node */
  routes: RouteInfo[];
  /** Child nodes keyed by segment */
  children: Map<string, RouteNode>;
  /** Whether this segment is a path parameter (starts with :) */
  isParam: boolean;
};

/**
 * Builds a tree structure from flat routes for efficient Express router generation.
 * Routes are organized hierarchically by path segments, with static routes
 * sorted before dynamic parameters to ensure correct Express route matching.
 *
 * @param routes - Array of RouteInfo objects from fossyl
 * @returns Root node of the route tree
 */
export function buildRouteTree(routes: RouteInfo[]): RouteNode {
  const root: RouteNode = {
    segment: "",
    fullPath: "",
    routes: [],
    children: new Map(),
    isParam: false,
  };

  for (const routeInfo of routes) {
    insertRoute(root, routeInfo);
  }

  sortRouteTree(root);
  return root;
}

/**
 * Inserts a route into the tree at the appropriate location.
 */
function insertRoute(node: RouteNode, routeInfo: RouteInfo): void {
  const segments = routeInfo.route.path.split("/").filter(Boolean);
  let current = node;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const isParam = segment.startsWith(":");

    if (!current.children.has(segment)) {
      current.children.set(segment, {
        segment,
        fullPath: "/" + segments.slice(0, i + 1).join("/"),
        routes: [],
        children: new Map(),
        isParam,
      });
    }

    current = current.children.get(segment)!;
  }

  current.routes.push(routeInfo);
}

/**
 * Sorts the route tree so static paths come before dynamic params.
 * This ensures /users/list is registered before /users/:id in Express,
 * which is critical for correct route matching.
 */
function sortRouteTree(node: RouteNode): void {
  // Static paths first, then dynamic params
  const entries = Array.from(node.children.entries()).sort(
    ([_aKey, aNode], [_bKey, bNode]) => {
      if (!aNode.isParam && bNode.isParam) return -1;
      if (aNode.isParam && !bNode.isParam) return 1;
      return aNode.segment.localeCompare(bNode.segment);
    }
  );

  node.children = new Map(entries);

  for (const child of node.children.values()) {
    sortRouteTree(child);
  }
}

/**
 * Extracts common path prefixes from a set of routes.
 * Used to determine where to mount Express sub-routers.
 *
 * @param routes - Array of RouteInfo objects
 * @returns Array of common prefixes (e.g., ["/api/users", "/api/posts"])
 */
export function extractRouterPrefixes(routes: RouteInfo[]): string[] {
  const prefixCounts = new Map<string, number>();

  for (const routeInfo of routes) {
    const path = routeInfo.route.path;
    const segments = path.split("/").filter(Boolean);

    // Build prefixes of increasing length
    for (let i = 1; i <= segments.length; i++) {
      const prefix = "/" + segments.slice(0, i).join("/");
      // Don't count param segments as prefixes
      if (!segments[i - 1].startsWith(":")) {
        prefixCounts.set(prefix, (prefixCounts.get(prefix) ?? 0) + 1);
      }
    }
  }

  // Find prefixes that have multiple routes (good candidates for routers)
  const prefixes: string[] = [];
  for (const [prefix, count] of prefixCounts.entries()) {
    if (count >= 2) {
      prefixes.push(prefix);
    }
  }

  // Sort by length descending to get most specific prefixes first
  return prefixes.sort((a, b) => b.length - a.length);
}

/**
 * Groups routes by their common prefix for router generation.
 *
 * @param routes - Array of RouteInfo objects
 * @returns Map of prefix to routes that start with that prefix
 */
export function groupRoutesByPrefix(
  routes: RouteInfo[]
): Map<string, RouteInfo[]> {
  const groups = new Map<string, RouteInfo[]>();

  // First, find the optimal prefixes
  const prefixes = extractRouterPrefixes(routes);

  // Track which routes have been assigned
  const assigned = new Set<RouteInfo>();

  // Assign routes to their most specific prefix
  for (const prefix of prefixes) {
    const matchingRoutes = routes.filter(
      (r) => r.route.path.startsWith(prefix) && !assigned.has(r)
    );

    if (matchingRoutes.length >= 2) {
      groups.set(prefix, matchingRoutes);
      matchingRoutes.forEach((r) => assigned.add(r));
    }
  }

  // Any remaining routes go to the root
  const remaining = routes.filter((r) => !assigned.has(r));
  if (remaining.length > 0) {
    const existing = groups.get("/") ?? [];
    groups.set("/", [...existing, ...remaining]);
  }

  return groups;
}
