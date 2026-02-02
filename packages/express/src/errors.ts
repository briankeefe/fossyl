import type { Response } from 'express';
import type { Logger } from '@fossyl/core';

declare const errorCodeBrand: unique symbol;

/**
 * Branded error code type for type safety.
 */
export type ErrorCode = number & { readonly [errorCodeBrand]: 'ErrorCode' };

function createErrorCode(code: number): ErrorCode {
  return code as ErrorCode;
}

/**
 * Standard error codes for API responses.
 */
export const ERROR_CODES = {
  // Authentication (1000-1999)
  AUTHENTICATION_REQUIRED: createErrorCode(1001),
  AUTHENTICATION_FAILED: createErrorCode(1002),
  INVALID_TOKEN: createErrorCode(1003),

  // Validation (2000-2999)
  VALIDATION_FAILED: createErrorCode(2001),
  INVALID_REQUEST_BODY: createErrorCode(2002),
  INVALID_QUERY_PARAMS: createErrorCode(2003),

  // Resources (3000-3999)
  NOT_FOUND: createErrorCode(3001),
  CONFLICT: createErrorCode(3002),

  // Server (5000-5999)
  INTERNAL_ERROR: createErrorCode(5001),
} as const;

/**
 * Standard error response format.
 */
export type ErrorResponse = {
  success: 'false';
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
};

/**
 * Creates a formatted error response.
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: unknown
): ErrorResponse {
  return {
    success: 'false',
    error: { code, message, details },
  };
}

/**
 * Error thrown when authentication fails.
 */
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Error thrown when validation fails.
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Handles errors and sends appropriate HTTP response.
 */
export function handleError(error: unknown, res: Response, logger: Logger): void {
  if (error instanceof AuthenticationError) {
    logger.warn('Authentication failed', { message: error.message });
    res
      .status(401)
      .json(createErrorResponse(ERROR_CODES.AUTHENTICATION_FAILED, error.message));
    return;
  }

  if (error instanceof ValidationError) {
    logger.warn('Validation failed', { message: error.message, details: error.details });
    res
      .status(400)
      .json(createErrorResponse(ERROR_CODES.VALIDATION_FAILED, error.message, error.details));
    return;
  }

  // Unknown error
  logger.error('Internal server error', {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  res.status(500).json(createErrorResponse(ERROR_CODES.INTERNAL_ERROR, 'Internal server error'));
}
