import { resolve } from 'path';
import { writeFileSync } from 'fs';
import { loadConfig } from '../config/loader';
import { loadRoutes } from '../parser/route-loader';
import { validateRoutes } from '../validation';

/**
 * Options for the build command.
 */
export type BuildOptions = {
  config: string;
};

/**
 * Builds the fossyl application.
 *
 * - Loads configuration
 * - Loads and validates routes
 * - Generates code using the framework adapter
 * - Writes the generated code to the output file
 *
 * @param options - Command options
 */
export async function buildCommand(options: BuildOptions): Promise<void> {
  console.log('Building fossyl app...\n');

  const config = await loadConfig(options.config);
  console.log(`   Config: ${options.config}`);
  console.log(`   Adapter: ${config.adapters.framework.name}`);

  const routesPath = resolve(process.cwd(), config.routes);
  const routes = await loadRoutes(routesPath);
  console.log(`   Routes: ${routes.length} found`);

  const validation = validateRoutes(routes, config.validation);

  if (validation.errors.length > 0) {
    console.error('\nBuild failed:\n');
    for (const error of validation.errors) {
      console.error(`   ${error.file}: ${error.message}`);
    }
    process.exit(1);
  }

  if (validation.warnings.length > 0) {
    console.warn('\nWarnings:\n');
    for (const warning of validation.warnings) {
      console.warn(`   ${warning.file}: ${warning.message}`);
    }
  }

  const outputPath = resolve(process.cwd(), config.output);
  const code = config.adapters.framework.generate(routes, {
    outputPath: config.output,
    routesPath: config.routes,
    databaseAdapter: config.adapters.database,
  });

  writeFileSync(outputPath, code, 'utf-8');

  console.log(`\nGenerated ${config.output}`);
}
