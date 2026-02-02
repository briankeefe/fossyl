import express, { type Application, Router, type Request, type Response, type NextFunction } from 'express';
import type { Server } from 'node:http';
import type { FrameworkAdapter, Route } from '@fossyl/core';
import type { ExpressAdapterOptions, CorsOptions } from './types';
import { sortRoutes } from './sorting';
import { groupRoutes } from './register';
import { createHandler } from './handlers';
import { createErrorResponse, ERROR_CODES } from './errors';

/**
 * Creates CORS middleware from options.
 */
function createCorsMiddleware(corsOptions: boolean | CorsOptions) {
  const options: CorsOptions =
    typeof corsOptions === 'boolean' ? { origin: true, credentials: true } : corsOptions;

  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;

    // Handle origin
    if (options.origin === true) {
      res.setHeader('Access-Control-Allow-Origin', origin ?? '*');
    } else if (typeof options.origin === 'string') {
      res.setHeader('Access-Control-Allow-Origin', options.origin);
    } else if (Array.isArray(options.origin) && origin && options.origin.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }

    // Handle methods
    if (options.methods) {
      res.setHeader('Access-Control-Allow-Methods', options.methods.join(', '));
    } else {
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    }

    // Handle headers
    if (options.allowedHeaders) {
      res.setHeader('Access-Control-Allow-Headers', options.allowedHeaders.join(', '));
    } else {
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    // Handle credentials
    if (options.credentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    // Handle preflight
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    next();
  };
}

/**
 * Creates an Express framework adapter for fossyl.
 *
 * @example
 * ```typescript
 * import { expressAdapter } from '@fossyl/express';
 *
 * const adapter = expressAdapter({ cors: true });
 * adapter.register(routes);
 * await adapter.listen(3000);
 * ```
 */
export function expressAdapter(options: ExpressAdapterOptions = {}): FrameworkAdapter<Application> {
  const app = options.app ?? express();
  let server: Server | null = null;

  app.use(express.json());

  if (options.cors) {
    app.use(createCorsMiddleware(options.cors));
  }

  return {
    type: 'framework',
    name: 'express',
    app,

    register(routes: Route[]): void {
      const sorted = sortRoutes(routes);
      const groups = groupRoutes(sorted);

      for (const group of groups) {
        const router = Router();

        for (const route of group.routes) {
          const method = route.method.toLowerCase() as 'get' | 'post' | 'put' | 'delete';
          const subPath = route.path.slice(group.prefix.length) || '/';

          router[method](subPath, createHandler(route, options));
        }

        app.use(group.prefix, router);
      }

      // 404 handler
      app.use((req: Request, res: Response) => {
        res.status(404).json(
          createErrorResponse(ERROR_CODES.NOT_FOUND, `Not found: ${req.method} ${req.path}`)
        );
      });
    },

    async listen(port: number): Promise<void> {
      if (options.database) {
        await options.database.onStartup();
      }

      return new Promise((resolve) => {
        server = app.listen(port, () => {
          console.log(`Server listening on port ${port}`);
          resolve();
        });
      });
    },

    async close(): Promise<void> {
      return new Promise((resolve, reject) => {
        if (!server) {
          resolve();
          return;
        }
        server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    },
  };
}
