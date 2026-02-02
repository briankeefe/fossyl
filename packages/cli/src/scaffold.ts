import * as fs from 'node:fs';
import * as path from 'node:path';
import type { ProjectOptions } from './prompts';
import {
  generatePackageJson,
  generateTsConfig,
  generateEnvExample,
  generateClaudeMd,
} from './templates/base';
import { generateExpressIndex, generateByoServerIndex } from './templates/server/express';
import { generateByoServerPlaceholder } from './templates/server/byo';
import { generateKyselySetup, generateDbTypes, generateMigrationIndex, generatePingMigration } from './templates/database/kysely';
import { generateByoDatabasePlaceholder } from './templates/database/byo';
import { generateZodValidators } from './templates/validator/zod';
import { generateByoValidatorPlaceholder } from './templates/validator/byo';
import { generatePingRoute, generatePingService, generatePingRepo } from './templates/feature/ping';
import { generateDockerfile, generateDockerignore, generateDockerCompose } from './templates/docker';

export interface FileEntry {
  path: string;
  content: string;
}

export function generateFiles(options: ProjectOptions): FileEntry[] {
  const files: FileEntry[] = [];

  // Base files
  files.push({
    path: 'package.json',
    content: generatePackageJson(options),
  });
  files.push({
    path: 'tsconfig.json',
    content: generateTsConfig(),
  });
  files.push({
    path: '.env.example',
    content: generateEnvExample(options),
  });
  files.push({
    path: 'CLAUDE.md',
    content: generateClaudeMd(options),
  });

  // Main entry point
  if (options.server === 'express') {
    files.push({
      path: 'src/index.ts',
      content: generateExpressIndex(options),
    });
  } else {
    files.push({
      path: 'src/index.ts',
      content: generateByoServerIndex(options),
    });
    files.push({
      path: 'src/server.ts',
      content: generateByoServerPlaceholder(),
    });
  }

  // Database files
  if (options.database === 'kysely') {
    files.push({
      path: 'src/db.ts',
      content: generateKyselySetup(options.dialect),
    });
    files.push({
      path: 'src/types/db.ts',
      content: generateDbTypes(),
    });
    files.push({
      path: 'src/migrations/index.ts',
      content: generateMigrationIndex(),
    });
    files.push({
      path: 'src/migrations/001_create_ping.ts',
      content: generatePingMigration(options.dialect),
    });
  } else {
    files.push({
      path: 'src/db.ts',
      content: generateByoDatabasePlaceholder(),
    });
    files.push({
      path: 'src/types/db.ts',
      content: '// TODO: Define your database types here\nexport interface DB {}\n',
    });
  }

  // Validator files
  if (options.validator === 'zod') {
    files.push({
      path: 'src/features/ping/validators/ping.validators.ts',
      content: generateZodValidators(),
    });
  } else {
    files.push({
      path: 'src/features/ping/validators/ping.validators.ts',
      content: generateByoValidatorPlaceholder(),
    });
  }

  // Feature files (ping)
  files.push({
    path: 'src/features/ping/routes/ping.route.ts',
    content: generatePingRoute(options),
  });
  files.push({
    path: 'src/features/ping/services/ping.service.ts',
    content: generatePingService(options),
  });
  files.push({
    path: 'src/features/ping/repo/ping.repo.ts',
    content: generatePingRepo(options),
  });

  // Docker files
  if (options.docker) {
    files.push({
      path: 'Dockerfile',
      content: generateDockerfile(),
    });
    files.push({
      path: '.dockerignore',
      content: generateDockerignore(),
    });
    files.push({
      path: 'docker-compose.yml',
      content: generateDockerCompose(options.dialect),
    });
  }

  return files;
}

export function writeFiles(projectPath: string, files: FileEntry[]): void {
  for (const file of files) {
    const fullPath = path.join(projectPath, file.path);
    const dir = path.dirname(fullPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(fullPath, file.content, 'utf-8');
  }
}
