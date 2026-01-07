import { resolve } from 'path';
import { pathToFileURL } from 'url';
import type { FossylConfig } from '@fossyl/core';
import { validateConfig } from './validator';

/**
 * Loads and validates a fossyl configuration file.
 *
 * Uses dynamic import to load TypeScript config files.
 * Requires tsx to be installed for TypeScript execution.
 *
 * @param configPath - Path to the config file (relative or absolute)
 * @returns The validated configuration object
 * @throws Error if config file not found or invalid
 */
export async function loadConfig(configPath: string): Promise<FossylConfig> {
  const absolutePath = resolve(process.cwd(), configPath);

  try {
    // tsx allows importing TypeScript files directly
    const configUrl = pathToFileURL(absolutePath).href;
    const module = await import(configUrl);
    const config = module.default as FossylConfig;

    validateConfig(config);
    return config;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ERR_MODULE_NOT_FOUND') {
      throw new Error(
        `Config file not found: ${configPath}\n` +
          `Run 'npx fossyl init' to create one.`
      );
    }
    throw error;
  }
}
