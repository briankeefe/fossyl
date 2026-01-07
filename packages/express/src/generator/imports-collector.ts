import type { RouteInfo, DatabaseAdapter } from '@fossyl/core';
import type { ExpressAdapterOptions } from "../types";
import * as path from "path";

/**
 * Options for import collection.
 */
type CollectImportsOptions = ExpressAdapterOptions & {
  outputPath: string;
  routesPath: string;
  databaseAdapter?: DatabaseAdapter;
};

/**
 * Collected import information organized by source.
 */
export type CollectedImports = {
  /** Express core imports */
  expressImports: string[];
  /** Route source file imports */
  routeImports: Map<string, Set<string>>;
  /** Database adapter imports (if configured) */
  databaseImports: string | null;
  /** Error code imports from @fossyl/express */
  errorImports: string;
};

/**
 * Collects all required imports for the generated Express app.
 *
 * @param routes - Array of RouteInfo objects
 * @param options - Adapter options including paths
 * @returns CollectedImports object
 */
export function collectImports(
  routes: RouteInfo[],
  options: CollectImportsOptions
): CollectedImports {
  const routeImports = new Map<string, Set<string>>();

  // Collect imports from each route's source file
  for (const routeInfo of routes) {
    const route = routeInfo.route;
    const sourceFile = routeInfo.sourceFile;

    // Calculate relative path from output to source
    const relativePath = calculateRelativePath(options.outputPath, sourceFile);

    if (!routeImports.has(relativePath)) {
      routeImports.set(relativePath, new Set());
    }

    const imports = routeImports.get(relativePath)!;

    // Import the route export
    imports.add(routeInfo.exportName);

    // If there's an authenticator, we need to import it
    // (authenticators are usually defined in the same file or imported there)
    if ("authenticator" in route && route.authenticator) {
      const authName = route.authenticator.name;
      if (authName && authName !== "anonymous") {
        imports.add(authName);
      }
    }

    // Same for validators
    if ("validator" in route && route.validator) {
      const validatorName = route.validator.name;
      if (validatorName && validatorName !== "anonymous") {
        imports.add(validatorName);
      }
    }
  }

  // Database adapter imports
  const databaseImports = options.databaseAdapter
    ? options.databaseAdapter.emitSetup()
    : null;

  return {
    expressImports: ["express", "Request", "Response", "NextFunction"],
    routeImports,
    databaseImports,
    errorImports: "{ ERROR_CODES, createErrorResponse }",
  };
}

/**
 * Formats collected imports into TypeScript import statements.
 *
 * @param collected - CollectedImports object
 * @returns Formatted import statements as string
 */
export function formatImports(collected: CollectedImports): string {
  const lines: string[] = [];

  // Express imports
  lines.push(
    `import express, { Request, Response, NextFunction } from 'express';`
  );

  // Route imports
  for (const [sourcePath, exportNames] of collected.routeImports) {
    const names = Array.from(exportNames).sort().join(", ");
    lines.push(`import { ${names} } from '${sourcePath}';`);
  }

  // Database adapter setup (if configured)
  if (collected.databaseImports) {
    lines.push("");
    lines.push("// Database adapter setup");
    lines.push(collected.databaseImports);
  }

  return lines.join("\n");
}

/**
 * Calculates the relative path from output file to source file.
 */
function calculateRelativePath(outputPath: string, sourcePath: string): string {
  const outputDir = path.dirname(outputPath);
  let relativePath = path.relative(outputDir, sourcePath);

  // Ensure it starts with ./ or ../
  if (!relativePath.startsWith(".")) {
    relativePath = "./" + relativePath;
  }

  // Remove .ts extension for imports
  if (relativePath.endsWith(".ts")) {
    relativePath = relativePath.slice(0, -3);
  }

  return relativePath;
}

/**
 * Emits the error response helper imports inline.
 * These are duplicated in the generated code to avoid requiring @fossyl/express at runtime.
 */
export function emitInlineErrorTypes(): string {
  return `
// Error handling types (inlined from @fossyl/express)
declare const errorCodeBrand: unique symbol;
type ErrorCode = number & { readonly [typeof errorCodeBrand]: 'ErrorCode' };

const ERROR_CODES = {
  AUTHENTICATION_FAILED: 1001 as ErrorCode,
  INVALID_TOKEN: 1002 as ErrorCode,
  TOKEN_EXPIRED: 1003 as ErrorCode,
  VALIDATION_FAILED: 2001 as ErrorCode,
  INVALID_REQUEST_BODY: 2002 as ErrorCode,
  INVALID_QUERY_PARAMETERS: 2003 as ErrorCode,
  RESOURCE_NOT_FOUND: 3001 as ErrorCode,
  RESOURCE_CONFLICT: 3002 as ErrorCode,
  INTERNAL_SERVER_ERROR: 5001 as ErrorCode,
} as const;

type ErrorResponse = {
  status_code: number;
  error_code: ErrorCode;
  message: string;
};

function createErrorResponse(
  statusCode: number,
  errorCode: ErrorCode,
  message: string
): ErrorResponse {
  return { status_code: statusCode, error_code: errorCode, message };
}
`.trim();
}
