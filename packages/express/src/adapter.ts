import type { FrameworkAdapter, RouteInfo, GeneratorContext } from '@fossyl/core';
import type { ExpressAdapterOptions } from "./types";
import { buildRouteTree } from "./generator/route-tree-builder";
import { analyzeMiddleware } from "./generator/middleware-analyzer";
import { emitExpressApp } from "./generator/code-emitter";

/**
 * Creates an Express framework adapter for fossyl.
 *
 * The adapter generates optimized Express.js TypeScript code from fossyl routes,
 * including route tree organization, middleware hoisting, and proper error handling.
 *
 * @param options - Configuration options for the adapter
 * @returns A FrameworkAdapter instance for use in fossyl config
 *
 * @example
 * ```typescript
 * import { defineConfig } from '@fossyl/core';
 * import { expressAdapter } from '@fossyl/express';
 *
 * export default defineConfig({
 *   routes: './src/routes',
 *   output: './src/server.generated.ts',
 *   adapters: {
 *     framework: expressAdapter({
 *       cors: true,
 *       wrapResponses: true,
 *     }),
 *   },
 * });
 * ```
 */
export function expressAdapter(
  options: ExpressAdapterOptions = {}
): FrameworkAdapter {
  return {
    type: "framework",
    name: "express",

    generate(routes: RouteInfo[], ctx: GeneratorContext): string {
      // Build route tree for efficient organization
      const tree = buildRouteTree(routes);

      // Analyze middleware for hoisting decisions
      const analyzed = analyzeMiddleware(routes, options.hoistThreshold ?? 3);

      // Generate the Express app code
      return emitExpressApp(tree, routes, analyzed, {
        ...options,
        outputPath: ctx.outputPath,
        routesPath: ctx.routesPath,
        databaseAdapter: ctx.databaseAdapter,
      });
    },
  };
}
