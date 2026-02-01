import * as fs from 'node:fs';
import * as path from 'node:path';
import * as p from '@clack/prompts';
import { promptForOptions } from '../prompts';
import { generateFiles, writeFiles } from '../scaffold';

export async function createCommand(projectName?: string): Promise<void> {
  const options = await promptForOptions(projectName);

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
        p.cancel(`Directory "${options.name}" already exists and is not empty.`);
        return;
      }
    }
  }

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
