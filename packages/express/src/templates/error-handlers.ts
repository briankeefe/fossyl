/**
 * Emits the 404 not found handler.
 */
export function emit404Handler(): string {
  return `
// 404 Not Found Handler
app.use((req: Request, res: Response) => {
  res.status(404).json(
    createErrorResponse(404, ERROR_CODES.RESOURCE_NOT_FOUND, \`Route not found: \${req.method} \${req.path}\`)
  );
});
`.trim();
}

/**
 * Emits the global error handler.
 */
export function emitErrorHandler(): string {
  return `
// Global Error Handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error('Express error:', err);
  res.status(500).json(
    createErrorResponse(500, ERROR_CODES.INTERNAL_SERVER_ERROR, err.message || 'Internal Server Error')
  );
});
`.trim();
}

/**
 * Emits both error handlers combined.
 */
export function emitErrorHandlers(): string {
  return `
${emit404Handler()}

${emitErrorHandler()}
`.trim();
}
