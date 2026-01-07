/**
 * CORS configuration options for Express adapter.
 */
export type CorsOptions = {
  /** Origin(s) to allow - can be a string or array of strings */
  origin?: string | string[];
  /** Allowed HTTP methods */
  methods?: string;
  /** Allowed headers */
  allowedHeaders?: string;
  /** Whether to include credentials */
  credentials?: boolean;
};

/**
 * Configuration options for the Express adapter.
 */
export type ExpressAdapterOptions = {
  /** Enable CORS (default: false) */
  cors?: boolean | CorsOptions;

  /** Wrap responses in { data: ... } (default: true) */
  wrapResponses?: boolean;

  /** Min routes to trigger middleware hoisting (default: 3) */
  hoistThreshold?: number;
};
