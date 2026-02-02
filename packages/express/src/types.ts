import type { Application } from 'express';
import type { DatabaseAdapter, LoggerAdapter } from '@fossyl/core';

/**
 * CORS configuration options.
 */
export type CorsOptions = {
  origin?: string | string[] | boolean;
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
};

/**
 * Metrics recorder for tracking request metrics.
 */
export type MetricsRecorder = {
  /** Called at the start of each request */
  onRequestStart: (info: { method: string; path: string; requestId: string }) => void;

  /** Called at the end of each request */
  onRequestEnd: (info: {
    method: string;
    path: string;
    requestId: string;
    statusCode: number;
    durationMs: number;
  }) => void;

  /** Called when a request errors */
  onRequestError: (info: {
    method: string;
    path: string;
    requestId: string;
    error: Error;
    durationMs: number;
  }) => void;
};

/**
 * Options for creating an Express adapter.
 */
export type ExpressAdapterOptions = {
  /** Existing Express app (optional - creates one if not provided) */
  app?: Application;

  /** Enable CORS (default: false) */
  cors?: boolean | CorsOptions;

  /** Database adapter for transaction support */
  database?: DatabaseAdapter;

  /** Logger adapter for request logging (default: console-based) */
  logger?: LoggerAdapter;

  /** Metrics recorder for request tracking */
  metrics?: MetricsRecorder;
};
