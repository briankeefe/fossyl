/**
 * Branded error code type for type-safe error handling.
 * This ensures error codes are used consistently throughout the application.
 */
declare const errorCodeBrand: unique symbol;
export type ErrorCode = number & { readonly [errorCodeBrand]: "ErrorCode" };

/**
 * Creates a branded error code from a number.
 */
function createErrorCode(code: number): ErrorCode {
  return code as ErrorCode;
}

/**
 * Standard error codes for Express routes.
 * Organized by category with consistent numbering:
 * - 1000-1999: Authentication errors
 * - 2000-2999: Validation errors
 * - 3000-3999: Resource errors
 * - 5000-5999: Internal errors
 */
export const ERROR_CODES = {
  // Authentication (1000-1999)
  AUTHENTICATION_FAILED: createErrorCode(1001),
  INVALID_TOKEN: createErrorCode(1002),
  TOKEN_EXPIRED: createErrorCode(1003),

  // Validation (2000-2999)
  VALIDATION_FAILED: createErrorCode(2001),
  INVALID_REQUEST_BODY: createErrorCode(2002),
  INVALID_QUERY_PARAMETERS: createErrorCode(2003),

  // Resources (3000-3999)
  RESOURCE_NOT_FOUND: createErrorCode(3001),
  RESOURCE_CONFLICT: createErrorCode(3002),

  // Internal (5000-5999)
  INTERNAL_SERVER_ERROR: createErrorCode(5001),
} as const;

/**
 * Standard error response structure.
 */
export type ErrorResponse = {
  status_code: number;
  error_code: ErrorCode;
  message: string;
};

/**
 * Creates a standardized error response object.
 */
export function createErrorResponse(
  statusCode: number,
  errorCode: ErrorCode,
  message: string
): ErrorResponse {
  return { status_code: statusCode, error_code: errorCode, message };
}
