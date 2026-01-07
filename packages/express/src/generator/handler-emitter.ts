import type { RouteInfo, Route, DatabaseAdapter } from '@fossyl/core';
import type { AnalyzedMiddleware } from "./middleware-analyzer";
import { isAuthenticatorHoisted } from "./middleware-analyzer";

/**
 * Options for handler emission.
 */
type HandlerEmitOptions = {
  wrapResponses: boolean;
  databaseAdapter?: DatabaseAdapter;
};

/**
 * Emits an individual route handler as Express middleware.
 *
 * @param routeInfo - The route to emit
 * @param analyzed - Analyzed middleware for hoisting decisions
 * @param options - Emission options
 * @returns TypeScript code for the route handler
 */
export function emitRouteHandler(
  routeInfo: RouteInfo,
  analyzed: AnalyzedMiddleware,
  options: HandlerEmitOptions
): string {
  const route = routeInfo.route;
  const method = route.method.toLowerCase();

  // Get the path relative to the router (remove common prefix)
  const routePath = getRelativeRoutePath(route.path);

  // Build middleware chain
  const middlewares = buildMiddlewareChain(routeInfo, analyzed);

  // Build the handler
  const handler = buildHandler(routeInfo, options);

  // Combine middleware and handler
  const allMiddleware =
    middlewares.length > 0 ? `\n  ${middlewares.join(",\n  ")},` : "";

  return `router.${method}('${routePath}',${allMiddleware}
  ${handler}
);`;
}

/**
 * Gets the path relative to the router mount point.
 * For now, returns the full path - router prefixing is handled at mount time.
 */
function getRelativeRoutePath(fullPath: string): string {
  // Convert fossyl path params to Express format (they're the same: :id)
  return fullPath;
}

/**
 * Builds the middleware chain for a route.
 */
function buildMiddlewareChain(
  routeInfo: RouteInfo,
  analyzed: AnalyzedMiddleware
): string[] {
  const middlewares: string[] = [];
  const route = routeInfo.route;

  // Add authentication middleware if not hoisted
  if (
    "authenticator" in route &&
    route.authenticator &&
    !isAuthenticatorHoisted(routeInfo, analyzed)
  ) {
    const authName = route.authenticator.name || "authenticator";
    middlewares.push(`createAuthMiddleware(${authName})`);
  }

  // Add body validation middleware for POST/PUT routes
  if ("validator" in route && route.validator) {
    const validatorName = route.validator.name || "validator";
    middlewares.push(`createValidationMiddleware(${validatorName})`);
  }

  // Add query validation middleware if present
  if ("queryValidator" in route && route.queryValidator) {
    const queryValidatorName =
      (route.queryValidator as { name?: string }).name || "queryValidator";
    middlewares.push(`createQueryValidationMiddleware(${queryValidatorName})`);
  }

  return middlewares;
}

/**
 * Builds the main handler function for a route.
 */
function buildHandler(
  routeInfo: RouteInfo,
  options: HandlerEmitOptions
): string {
  const route = routeInfo.route;
  const handlerCall = buildHandlerCall(route);

  // Optionally wrap with database transaction
  const wrappedCall = options.databaseAdapter
    ? options.databaseAdapter.emitWrapper(handlerCall, true)
    : handlerCall;

  const responseWrapper = options.wrapResponses
    ? "wrapResponse(result)"
    : "result";

  return `async (req: Request, res: Response, next: NextFunction) => {
    try {
      ${wrappedCall}
      res.json(${responseWrapper});
    } catch (error) {
      next(error);
    }
  }`;
}

/**
 * Builds the handler invocation code based on route type.
 */
function buildHandlerCall(route: Route): string {
  const exportName = getHandlerName(route);

  // Build params object
  const paramsObj = buildParamsObject(route);

  switch (route.type) {
    case "open":
      return `const result = await ${exportName}.handler(${paramsObj});`;

    case "authenticated": {
      const authType = getAuthType(route);
      return `const auth = req.fossylAuth as ${authType};
      const result = await ${exportName}.handler(${paramsObj}, auth);`;
    }

    case "validated":
      return `const body = req.fossylBody;
      const result = await ${exportName}.handler(${paramsObj}, body);`;

    case "full": {
      const authType = getAuthType(route);
      return `const auth = req.fossylAuth as ${authType};
      const body = req.fossylBody;
      const result = await ${exportName}.handler(${paramsObj}, auth, body);`;
    }
  }
}

/**
 * Builds the params object for handler invocation.
 */
function buildParamsObject(route: Route): string {
  const hasQuery = "queryValidator" in route && route.queryValidator;

  if (hasQuery) {
    return `{ url: req.params, query: (req as Request & { fossylQuery: unknown }).fossylQuery }`;
  }

  return `{ url: req.params }`;
}

/**
 * Gets the handler export name from a route.
 * Uses the route path to generate a reasonable name.
 */
function getHandlerName(route: Route): string {
  // This would typically come from routeInfo.exportName
  // For now, generate from path + method
  const pathParts = route.path.split("/").filter(Boolean);
  const name = pathParts
    .map((p) => (p.startsWith(":") ? p.slice(1) : p))
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");

  return `${route.method.toLowerCase()}${name}`;
}

/**
 * Gets the authentication type annotation for a route.
 */
function getAuthType(route: Route): string {
  // In a real implementation, this would extract the actual type
  // For now, use a generic type
  return "unknown";
}

/**
 * Emits a complete router with all its routes.
 *
 * @param prefix - The router mount prefix (e.g., "/api/users")
 * @param routes - Routes to include in this router
 * @param analyzed - Analyzed middleware for hoisting decisions
 * @param options - Emission options
 * @returns TypeScript code for the router
 */
export function emitRouter(
  prefix: string,
  routes: RouteInfo[],
  analyzed: AnalyzedMiddleware,
  options: HandlerEmitOptions
): string {
  const routerName = prefixToRouterName(prefix);

  // Sort routes: static before dynamic
  const sortedRoutes = sortRoutesBySpecificity(routes);

  const routeHandlers = sortedRoutes
    .map((routeInfo) => {
      const relativePath = getRouteRelativePath(routeInfo.route.path, prefix);
      return emitSingleRoute(routeInfo, relativePath, analyzed, options);
    })
    .join("\n\n");

  return `
// Routes: ${prefix}
const ${routerName} = express.Router();

${routeHandlers}

app.use('${prefix}', ${routerName});
`.trim();
}

/**
 * Converts a URL prefix to a valid router variable name.
 */
function prefixToRouterName(prefix: string): string {
  const parts = prefix.split("/").filter(Boolean);
  if (parts.length === 0) return "rootRouter";

  return (
    parts
      .map((p) => (p.startsWith(":") ? p.slice(1) : p))
      .map((p, i) =>
        i === 0 ? p.toLowerCase() : p.charAt(0).toUpperCase() + p.slice(1)
      )
      .join("") + "Router"
  );
}

/**
 * Gets the route path relative to the router prefix.
 */
function getRouteRelativePath(fullPath: string, prefix: string): string {
  if (fullPath === prefix) return "/";
  if (fullPath.startsWith(prefix)) {
    const relative = fullPath.slice(prefix.length);
    return relative.startsWith("/") ? relative : "/" + relative;
  }
  return fullPath;
}

/**
 * Sorts routes so static paths come before dynamic params.
 */
function sortRoutesBySpecificity(routes: RouteInfo[]): RouteInfo[] {
  return [...routes].sort((a, b) => {
    const aSegments = a.route.path.split("/");
    const bSegments = b.route.path.split("/");

    // Compare segment by segment
    const minLen = Math.min(aSegments.length, bSegments.length);
    for (let i = 0; i < minLen; i++) {
      const aIsParam = aSegments[i].startsWith(":");
      const bIsParam = bSegments[i].startsWith(":");

      if (!aIsParam && bIsParam) return -1;
      if (aIsParam && !bIsParam) return 1;
    }

    // Shorter paths first if all else equal
    return aSegments.length - bSegments.length;
  });
}

/**
 * Emits a single route within a router.
 */
function emitSingleRoute(
  routeInfo: RouteInfo,
  relativePath: string,
  analyzed: AnalyzedMiddleware,
  options: HandlerEmitOptions
): string {
  const route = routeInfo.route;
  const method = route.method.toLowerCase();
  const exportName = routeInfo.exportName;

  // Build middleware chain
  const middlewares = buildMiddlewareChain(routeInfo, analyzed);

  // Build the handler invocation
  const handlerInvocation = buildRouteHandlerInvocation(routeInfo, options);

  const middlewareStr =
    middlewares.length > 0 ? `\n  ${middlewares.join(",\n  ")},` : "";

  return `${routerName(relativePath, method)}.${method}('${relativePath}',${middlewareStr}
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      ${handlerInvocation}
    } catch (error) {
      next(error);
    }
  }
);`.replace(`${routerName(relativePath, method)}.`, "router.");
}

/**
 * Helper to generate consistent router variable reference.
 */
function routerName(_path: string, _method: string): string {
  return "router";
}

/**
 * Builds the handler invocation code for a route.
 */
function buildRouteHandlerInvocation(
  routeInfo: RouteInfo,
  options: HandlerEmitOptions
): string {
  const route = routeInfo.route;
  const exportName = routeInfo.exportName;

  // Build params object
  const hasQuery = "queryValidator" in route && route.queryValidator;
  const paramsObj = hasQuery
    ? "{ url: req.params, query: (req as Request & { fossylQuery: unknown }).fossylQuery }"
    : "{ url: req.params }";

  const responseWrapper = options.wrapResponses
    ? "wrapResponse(result)"
    : "result";

  let handlerCall: string;

  switch (route.type) {
    case "open":
      handlerCall = `const result = await ${exportName}.handler(${paramsObj});`;
      break;

    case "authenticated":
      handlerCall = `const auth = req.fossylAuth;
      const result = await ${exportName}.handler(${paramsObj}, auth);`;
      break;

    case "validated":
      handlerCall = `const body = req.fossylBody;
      const result = await ${exportName}.handler(${paramsObj}, body);`;
      break;

    case "full":
      handlerCall = `const auth = req.fossylAuth;
      const body = req.fossylBody;
      const result = await ${exportName}.handler(${paramsObj}, auth, body);`;
      break;
  }

  // Wrap with database transaction if configured
  if (options.databaseAdapter) {
    handlerCall = options.databaseAdapter.emitWrapper(handlerCall, true);
  }

  return `${handlerCall}
      res.json(${responseWrapper});`;
}
