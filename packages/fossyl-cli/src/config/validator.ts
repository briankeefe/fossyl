import type { FossylConfig } from '@fossyl/core';

/**
 * Validates that a configuration object has the required structure.
 *
 * This is a runtime validation to catch configuration errors early,
 * providing clear error messages for common mistakes.
 *
 * @param config - The configuration object to validate
 * @throws Error if the configuration is invalid
 */
export function validateConfig(config: unknown): asserts config is FossylConfig {
  if (!config || typeof config !== 'object') {
    throw new Error('Config must export a default object');
  }

  const c = config as Record<string, unknown>;

  if (typeof c.routes !== 'string') {
    throw new Error('Config must specify "routes" path');
  }

  if (!c.adapters || typeof c.adapters !== 'object') {
    throw new Error('Config must specify "adapters"');
  }

  const adapters = c.adapters as Record<string, unknown>;

  if (!adapters.framework || typeof adapters.framework !== 'object') {
    throw new Error('Config must specify "adapters.framework"');
  }

  if (typeof c.output !== 'string') {
    throw new Error('Config must specify "output" path');
  }
}
