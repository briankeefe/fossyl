import * as p from '@clack/prompts';

export type ServerChoice = 'express' | 'byo';
export type ValidatorChoice = 'zod' | 'byo';
export type DatabaseChoice = 'kysely' | 'byo';
export type DialectChoice = 'sqlite' | 'postgres' | 'mysql';

export interface ProjectOptions {
  name: string;
  server: ServerChoice;
  validator: ValidatorChoice;
  database: DatabaseChoice;
  dialect?: DialectChoice;
  docker: boolean;
}

export interface CliOptions {
  server?: ServerChoice;
  validator?: ValidatorChoice;
  database?: DatabaseChoice;
  dialect?: DialectChoice;
  docker?: boolean;
}

export async function promptForOptions(
  projectName?: string
): Promise<ProjectOptions | null> {
  p.intro('Create Fossyl App');

  const name =
    projectName ??
    ((await p.text({
      message: 'Project name:',
      placeholder: 'my-fossyl-api',
      validate: (v) => (!v ? 'Required' : undefined),
    })) as string);

  if (p.isCancel(name)) {
    p.cancel('Operation cancelled.');
    return null;
  }

  const server = (await p.select({
    message: 'Server adapter:',
    options: [
      { value: 'express', label: 'Express', hint: 'recommended' },
      { value: 'byo', label: 'Bring Your Own' },
    ],
  })) as ServerChoice;

  if (p.isCancel(server)) {
    p.cancel('Operation cancelled.');
    return null;
  }

  const validator = (await p.select({
    message: 'Validation library:',
    options: [
      { value: 'zod', label: 'Zod', hint: 'recommended' },
      { value: 'byo', label: 'Bring Your Own' },
    ],
  })) as ValidatorChoice;

  if (p.isCancel(validator)) {
    p.cancel('Operation cancelled.');
    return null;
  }

  const database = (await p.select({
    message: 'Database adapter:',
    options: [
      { value: 'kysely', label: 'Kysely', hint: 'recommended' },
      { value: 'byo', label: 'Bring Your Own' },
    ],
  })) as DatabaseChoice;

  if (p.isCancel(database)) {
    p.cancel('Operation cancelled.');
    return null;
  }

  let dialect: DialectChoice | undefined;
  if (database === 'kysely') {
    dialect = (await p.select({
      message: 'Database dialect:',
      options: [
        { value: 'sqlite', label: 'SQLite', hint: 'recommended - great for per-customer databases' },
        { value: 'postgres', label: 'PostgreSQL' },
        { value: 'mysql', label: 'MySQL' },
      ],
    })) as DialectChoice;

    if (p.isCancel(dialect)) {
      p.cancel('Operation cancelled.');
      return null;
    }
  }

  const docker = await p.confirm({
    message: 'Include Docker setup?',
    initialValue: true,
  });

  if (p.isCancel(docker)) {
    p.cancel('Operation cancelled.');
    return null;
  }

  return { name, server, validator, database, dialect, docker };
}
