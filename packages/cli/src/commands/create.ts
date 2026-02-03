import * as fs from 'node:fs';
import * as path from 'node:path';
import * as p from '@clack/prompts';
import { promptForOptions } from '../prompts';
import { generateFiles, writeFiles } from '../scaffold';
import type { CliOptions, ProjectOptions } from '../prompts';

export async function createCommand(projectName?: string, cliOptions?: CliOptions | null): Promise<void> {
  let options: ProjectOptions | null;

  // If CLI options provided, use non-interactive mode
  if (cliOptions) {
    if (!projectName) {
      console.error('Error: Project name is required in non-interactive mode.');
      console.error('Usage: npx fossyl --create <project-name> --server express ...');
      process.exit(1);
    }

    options = {
      name: projectName,
      server: cliOptions.server!,
      validator: cliOptions.validator!,
      database: cliOptions.database!,
      dialect: cliOptions.dialect,
      docker: cliOptions.docker!,
    };

    console.log(`Creating fossyl project: ${projectName}`);
    console.log(`  Server: ${options.server}`);
    console.log(`  Validator: ${options.validator}`);
    console.log(`  Database: ${options.database}${options.dialect ? ` (${options.dialect})` : ''}`);
    console.log(`  Docker: ${options.docker}`);
    console.log();
  } else {
    // Interactive mode
    options = await promptForOptions(projectName);
  }

  if (!options) {
    return;
  }

  const projectPath =
    options.name === '.' ? process.cwd() : path.resolve(process.cwd(), options.name);

  // Check if directory exists and is not empty
  if (options.name !== '.') {
    if (fs.existsSync(projectPath)) {
      const files = fs.readdirSync(projectPath);
      if (files.length > 0) {
        if (cliOptions) {
          console.error(`Error: Directory "${options.name}" already exists and is not empty.`);
          process.exit(1);
        } else {
          p.cancel(`Directory "${options.name}" already exists and is not empty.`);
        }
        return;
      }
    }
  }

  if (cliOptions) {
    // Non-interactive mode - simple console output
    console.log('Creating project files...');
    try {
      const files = generateFiles(options);
      writeFiles(projectPath, files);
      console.log('Project files created!\n');

      console.log('Next steps:');
      console.log(`  cd ${options.name === '.' ? '.' : options.name}`);
      console.log('  pnpm install');
      console.log('  pnpm dev\n');

      const adapters: string[] = [];
      if (options.server === 'express') adapters.push('@fossyl/express');
      if (options.validator === 'zod') adapters.push('@fossyl/zod');
      if (options.database === 'kysely') adapters.push('@fossyl/kysely');

      if (adapters.length > 0) {
        console.log(`Using fossyl adapters: ${adapters.join(', ')}`);
      }

      if (options.server === 'byo' || options.validator === 'byo' || options.database === 'byo') {
        console.log('Note: Check TODO comments in generated files for BYO setup instructions.');
      }

      console.log('\nHappy coding!');
    } catch (error) {
      console.error('Failed to create project files.');
      throw error;
    }
  } else {
    // Interactive mode - use clack spinners and styling
    const s = p.spinner();
    s.start('Creating project files...');

    try {
      const files = generateFiles(options);
      writeFiles(projectPath, files);
      s.stop('Project files created!');

      p.note(
        `cd ${options.name === '.' ? '.' : options.name}\npnpm install\npnpm dev`,
        'Next steps'
      );

      const adapters: string[] = [];
      if (options.server === 'express') adapters.push('@fossyl/express');
      if (options.validator === 'zod') adapters.push('@fossyl/zod');
      if (options.database === 'kysely') adapters.push('@fossyl/kysely');

      if (adapters.length > 0) {
        p.log.info(`Using fossyl adapters: ${adapters.join(', ')}`);
      }

      if (options.server === 'byo' || options.validator === 'byo' || options.database === 'byo') {
        p.log.warn('Check TODO comments in generated files for BYO setup instructions.');
      }

      p.outro('Happy coding!');
    } catch (error) {
      s.stop('Failed to create project files.');
      throw error;
    }
  }
}
