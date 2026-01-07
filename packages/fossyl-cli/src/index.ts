#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init';
import { buildCommand } from './commands/build';
import { devCommand } from './commands/dev';
import { validateCommand } from './commands/validate';
import { routesCommand } from './commands/routes';

const program = new Command();

program
  .name('fossyl')
  .description('Type-safe REST API framework for AI-assisted development')
  .version('0.1.0');

program
  .command('init')
  .description('Create fossyl.config.ts')
  .option('--adapter <adapter>', 'Framework adapter (express, hono)', 'express')
  .action(initCommand);

program
  .command('build')
  .description('Generate code from fossyl routes')
  .option('-c, --config <path>', 'Path to config file', 'fossyl.config.ts')
  .action(buildCommand);

program
  .command('dev')
  .description('Start development server with hot reload')
  .option('-c, --config <path>', 'Path to config file', 'fossyl.config.ts')
  .option('-p, --port <port>', 'Port to run server', '3000')
  .action(devCommand);

program
  .command('validate')
  .description('Validate routes without generating code')
  .option('-c, --config <path>', 'Path to config file', 'fossyl.config.ts')
  .action(validateCommand);

program
  .command('routes')
  .description('List all registered routes')
  .option('-c, --config <path>', 'Path to config file', 'fossyl.config.ts')
  .action(routesCommand);

program.parse();
