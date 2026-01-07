import { existsSync, writeFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Options for the init command.
 */
export type InitOptions = {
  adapter: string;
};

const CONFIG_TEMPLATE = `import { defineConfig } from '@fossyl/core';
import { expressAdapter } from '@fossyl/express';

export default defineConfig({
  routes: './src/routes',
  output: './src/server.generated.ts',

  adapters: {
    framework: expressAdapter({
      cors: true,
      wrapResponses: true,
    }),
    // database: prismaKyselyAdapter({ ... }),
  },

  validation: {
    requirePrefix: '/api',
    enforceFilePrefix: true,
  },
});
`;

/**
 * Creates a new fossyl.config.ts file in the current directory.
 *
 * @param options - Command options
 */
export async function initCommand(options: InitOptions): Promise<void> {
  const configPath = resolve(process.cwd(), 'fossyl.config.ts');

  if (existsSync(configPath)) {
    console.error('fossyl.config.ts already exists');
    process.exit(1);
  }

  let template = CONFIG_TEMPLATE;
  if (options.adapter !== 'express') {
    template = template
      .replace('@fossyl/express', `@fossyl/${options.adapter}`)
      .replace('expressAdapter', `${options.adapter}Adapter`);
  }

  writeFileSync(configPath, template, 'utf-8');

  console.log('Created fossyl.config.ts\n');
  console.log('Next steps:');
  console.log(`  1. npm install -D fossyl`);
  console.log(`  2. npm install @fossyl/core @fossyl/${options.adapter}`);
  console.log('  3. Create routes in ./src/routes/');
  console.log('  4. npx fossyl build');
}
