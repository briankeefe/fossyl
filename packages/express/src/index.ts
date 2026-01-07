// Main adapter export
export { expressAdapter } from "./adapter";

// Types
export type { ExpressAdapterOptions, CorsOptions } from "./types";

// Error handling utilities
export { ERROR_CODES, createErrorResponse } from "./error-codes";
export type { ErrorCode, ErrorResponse } from "./error-codes";

// Generator utilities (for advanced use cases)
export { buildRouteTree, groupRoutesByPrefix, extractRouterPrefixes } from "./generator/route-tree-builder";
export type { RouteNode } from "./generator/route-tree-builder";

export { analyzeMiddleware, isAuthenticatorHoisted, isValidatorHoisted } from "./generator/middleware-analyzer";
export type { AnalyzedMiddleware } from "./generator/middleware-analyzer";
