/**
 * Validation error from route checking.
 * Errors prevent code generation.
 */
export type ValidationError = {
  type: 'duplicate-route' | 'invalid-path' | 'type-error' | 'missing-export';
  message: string;
  file: string;
  line?: number;
  column?: number;
};

/**
 * Validation warning from route checking.
 * Warnings don't prevent code generation but are reported.
 */
export type ValidationWarning = {
  type: 'mixed-prefix' | 'naming-convention';
  message: string;
  file: string;
  line?: number;
};

/**
 * Result of validating routes.
 */
export type ValidationResult = {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
};
