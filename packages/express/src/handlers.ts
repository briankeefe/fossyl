import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { Route, ResponseData } from '@fossyl/core';
import { requestContext, type RequestContext, createDefaultLogger } from './context';
import { wrapResponse } from './response';
import { handleError } from './errors';
import type { ExpressAdapterOptions } from './types';

/**
 * Creates an Express request handler for a fossyl route.
 */
export function createHandler(route: Route, options: ExpressAdapterOptions): RequestHandler {
  return async (req: Request, res: Response, _next: NextFunction) => {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();
    const logger = options.logger?.createLogger(requestId) ?? createDefaultLogger(requestId);

    const ctx: RequestContext = {
      requestId,
      logger,
      databaseContext: undefined,
    };

    const metricsInfo = { method: req.method, path: route.path, requestId };
    options.metrics?.onRequestStart(metricsInfo);

    try {
      const result = await requestContext.run(ctx, async () => {
        return executeRoute(route, req, options);
      });

      res.json(wrapResponse(result));

      options.metrics?.onRequestEnd({
        ...metricsInfo,
        statusCode: 200,
        durationMs: Date.now() - startTime,
      });
    } catch (error) {
      handleError(error, res, logger);

      options.metrics?.onRequestError({
        ...metricsInfo,
        error: error instanceof Error ? error : new Error(String(error)),
        durationMs: Date.now() - startTime,
      });
    }
  };
}

/**
 * Executes a route handler based on route type.
 */
async function executeRoute(
  route: Route,
  req: Request,
  options: ExpressAdapterOptions
): Promise<ResponseData> {
  const params = { url: req.params, query: req.query };

  switch (route.type) {
    case 'full': {
      const auth = await route.authenticator(req.headers as Record<string, string>);
      const body = route.validator(req.body);

      return options.database
        ? options.database.withTransaction(() => route.handler(params, auth, body))
        : route.handler(params, auth, body);
    }

    case 'authenticated': {
      const auth = await route.authenticator(req.headers as Record<string, string>);

      return options.database
        ? options.database.withClient(() => route.handler(params, auth))
        : route.handler(params, auth);
    }

    case 'validated': {
      const body = route.validator(req.body);

      return options.database
        ? options.database.withTransaction(() => route.handler(params, body))
        : route.handler(params, body);
    }

    case 'open': {
      return options.database
        ? options.database.withClient(() => route.handler(params))
        : route.handler(params);
    }
  }
}
