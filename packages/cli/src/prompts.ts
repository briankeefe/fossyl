import * as p from '@clack/prompts';

export type ServerChoice = 'express' | 'byo';
export type ValidatorChoice = 'zod' | 'byo';
export type DatabaseChoice = 'kysely' | 'byo';

export interface ProjectOptions {
  name: string;
  server: ServerChoice;
  validator: ValidatorChoice;
  database: DatabaseChoice;
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

  return { name, server, validator, database };
}
