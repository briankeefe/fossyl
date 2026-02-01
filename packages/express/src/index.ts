// Main adapter export
export { expressAdapter } from './adapter';

// Context exports
export {
  getContext,
  getLogger,
  getRequestId,
  getDb,
  type RequestContext,
  type LoggerContext,
} from './context';

// Error exports
export {
  AuthenticationError,
  ValidationError,
  ERROR_CODES,
  createErrorResponse,
  type ErrorCode,
  type ErrorResponse,
} from './errors';

// Response exports
export { wrapResponse } from './response';

// Type exports
export type { ExpressAdapterOptions, CorsOptions, MetricsRecorder } from './types';
