export function generateByoServerPlaceholder(): string {
  return `import type { Route } from '@fossyl/core';

/**
 * TODO: Implement your server adapter
 *
 * This function should:
 * 1. Create an HTTP server (Express, Fastify, Hono, etc.)
 * 2. Register each route from the routes array
 * 3. Handle request/response transformation
 * 4. Implement error handling
 *
 * Reference implementation: https://github.com/YoyoSaur/fossyl/tree/main/packages/express
 *
 * Example with Express:
 *
 * import express from 'express';
 *
 * export function startServer(routes: Route[], port: number) {
 *   const app = express();
 *   app.use(express.json());
 *
 *   for (const route of routes) {
 *     const method = route.method.toLowerCase();
 *     app[method](route.path, async (req, res) => {
 *       try {
 *         // Handle authentication if route.authenticator exists
 *         // Handle body validation if route.validator exists
 *         // Call route.handler with appropriate params
 *         const result = await route.handler(...);
 *         res.json({ success: 'true', type: result.typeName, data: result });
 *       } catch (error) {
 *         res.status(500).json({ success: 'false', error: { message: error.message } });
 *       }
 *     });
 *   }
 *
 *   app.listen(port, () => console.log(\`Server running on port \${port}\`));
 * }
 */
export function startServer(routes: Route[], port: number): void {
  // TODO: Implement your server
  console.log('TODO: Implement server adapter');
  console.log(\`Routes to register: \${routes.length}\`);
  console.log(\`Port: \${port}\`);

  throw new Error('Server adapter not implemented. See src/server.ts for instructions.');
}
`;
}
