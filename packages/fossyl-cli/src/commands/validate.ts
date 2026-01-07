import { resolve } from 'path';
import { loadConfig } from '../config/loader';
import { loadRoutes } from '../parser/route-loader';
import { validateRoutes } from '../validation';

/**
 * Options for the validate command.
 */
export type ValidateOptions = {
  config: string;
};

/**
 * Validates routes without generating code.
 *
 * Useful for CI/CD pipelines or pre-commit hooks.
 *
 * @param options - Command options
 */
export async function validateCommand(options: ValidateOptions): Promise<void> {
  console.log('Validating routes...\n');

  const config = await loadConfig(options.config);
  const routesPath = resolve(process.cwd(), config.routes);
  const routes = await loadRoutes(routesPath);

  console.log(`   Found ${routes.length} routes\n`);

  const validation = validateRoutes(routes, config.validation);

  if (validation.errors.length > 0) {
    console.error('Errors:\n');
    for (const error of validation.errors) {
      console.error(`   ${error.file}: ${error.message}`);
    }
  }

  if (validation.warnings.length > 0) {
    console.warn('Warnings:\n');
    for (const warning of validation.warnings) {
      console.warn(`   ${warning.file}: ${warning.message}`);
    }
  }

  if (validation.valid && validation.warnings.length === 0) {
    console.log('All routes valid!');
  }

  process.exit(validation.valid ? 0 : 1);
}
