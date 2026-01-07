/**
 * Emits the authentication middleware factory function.
 * This creates Express middleware from fossyl authenticator functions.
 */
export function emitAuthMiddlewareFactory(): string {
  return `
function createAuthMiddleware<TAuth>(
  authenticator: (headers: Record<string, string | undefined>) => Promise<TAuth> | TAuth
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const auth = await authenticator(req.headers as Record<string, string | undefined>);
      req.fossylAuth = auth;
      next();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      res.status(401).json(createErrorResponse(401, ERROR_CODES.AUTHENTICATION_FAILED, message));
    }
  };
}
`.trim();
}

/**
 * Emits the validation middleware factory function.
 * This creates Express middleware from fossyl validator functions.
 */
export function emitValidationMiddlewareFactory(): string {
  return `
function createValidationMiddleware<TBody>(
  validator: (data: unknown) => TBody
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const body = validator(req.body);
      req.fossylBody = body;
      next();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Validation failed';
      res.status(400).json(createErrorResponse(400, ERROR_CODES.VALIDATION_FAILED, message));
    }
  };
}
`.trim();
}

/**
 * Emits the query validation middleware factory function.
 */
export function emitQueryValidationMiddlewareFactory(): string {
  return `
function createQueryValidationMiddleware<TQuery>(
  validator: (data: unknown) => TQuery
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const query = validator(req.query);
      (req as Request & { fossylQuery: TQuery }).fossylQuery = query;
      next();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid query parameters';
      res.status(400).json(createErrorResponse(400, ERROR_CODES.INVALID_QUERY_PARAMETERS, message));
    }
  };
}
`.trim();
}
