import { parseArgs } from 'node:util';
import { createCommand } from './commands/create';

const { values, positionals } = parseArgs({
  options: {
    create: { type: 'boolean' },
    help: { type: 'boolean', short: 'h' },
    version: { type: 'boolean', short: 'v' },
  },
  allowPositionals: true,
});

function showHelp() {
  console.log(`
fossyl - CLI for scaffolding fossyl projects

Usage:
  npx fossyl --create <project-name>   Create a new fossyl project
  npx fossyl --help                    Show this help message
  npx fossyl --version                 Show version

Examples:
  npx fossyl --create my-api           Create a new project named "my-api"
  npx fossyl --create .                Create a new project in the current directory
`);
}

function showVersion() {
  console.log('fossyl v0.1.6');
}

async function main() {
  if (values.version) {
    showVersion();
  } else if (values.create) {
    await createCommand(positionals[0]);
  } else if (values.help) {
    showHelp();
  } else {
    showHelp();
  }
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
