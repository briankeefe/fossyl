#!/usr/bin/env node

/**
 * Script to verify and update CLAUDE.md based on codebase changes
 * Uses Claude API to check if documentation needs updating
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);

const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY;
const CORE_PATH = join(process.cwd(), 'packages/core');
const CLAUDE_MD_PATH = join(CORE_PATH, 'CLAUDE.md');

if (!CLAUDE_API_KEY) {
  console.warn('⚠️  Warning: ANTHROPIC_API_KEY environment variable not set');
  console.warn('⚠️  Skipping CLAUDE.md validation. Set the API key to enable automatic updates.');
  console.warn('⚠️  See DEVELOPMENT.md for setup instructions.\n');
  process.exit(0); // Exit successfully but skip validation
}

async function getGitDiff() {
  try {
    const { stdout } = await execAsync('git diff --cached');
    return stdout;
  } catch (error) {
    console.error('Error getting git diff:', error.message);
    return '';
  }
}

async function getCurrentClaudeMd() {
  try {
    return await readFile(CLAUDE_MD_PATH, 'utf-8');
  } catch (error) {
    console.error('Error reading CLAUDE.md:', error.message);
    return '';
  }
}

async function getRelevantFiles() {
  try {
    const { stdout: indexTs } = await execAsync(`cat ${join(CORE_PATH, 'src/index.ts')}`);
    const { stdout: packageJson } = await execAsync(`cat ${join(CORE_PATH, 'package.json')}`);
    const { stdout: exampleTs } = await execAsync(`cat ${join(CORE_PATH, 'src/example.ts')}`);

    return { indexTs, packageJson, exampleTs };
  } catch (error) {
    console.error('Error reading relevant files:', error.message);
    return {};
  }
}

async function checkWithClaude(diff, currentClaudeMd, files) {
  const prompt = `You are tasked with maintaining CLAUDE.md, an AI-friendly documentation file for the Fossyl TypeScript REST API framework.

# Current CLAUDE.md:
\`\`\`markdown
${currentClaudeMd}
\`\`\`

# Git diff (staged changes):
\`\`\`diff
${diff || 'No changes staged'}
\`\`\`

# Current package.json:
\`\`\`json
${files.packageJson || ''}
\`\`\`

# Current index.ts exports:
\`\`\`typescript
${files.indexTs || ''}
\`\`\`

# Example usage:
\`\`\`typescript
${files.exampleTs || ''}
\`\`\`

# Your task:
1. Review the staged changes in the diff
2. Determine if CLAUDE.md needs to be updated to reflect these changes
3. If updates are needed, provide a completely rewritten CLAUDE.md that:
   - Reflects any API changes
   - Updates examples if needed
   - Maintains the same structure and AI-friendly format
   - Keeps the note about adapter libraries not being ready yet
   - Ensures all code examples are correct and type-safe

# Response format:
If CLAUDE.md needs updating, respond with:
UPDATE_NEEDED
---
[Full updated CLAUDE.md content here]

If CLAUDE.md is already satisfactory, respond with:
NO_UPDATE_NEEDED`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.content[0].text;

    if (content.startsWith('UPDATE_NEEDED')) {
      const newContent = content.split('---')[1].trim();
      return { needsUpdate: true, newContent };
    }

    return { needsUpdate: false };
  } catch (error) {
    console.error('Error calling Claude API:', error.message);
    throw error;
  }
}

async function main() {
  console.log('🔍 Checking if CLAUDE.md needs updating...');

  const diff = await getGitDiff();
  const currentClaudeMd = await getCurrentClaudeMd();
  const files = await getRelevantFiles();

  // Only check if there are actual code changes
  if (!diff || diff.trim().length === 0) {
    console.log('✓ No changes staged, skipping check');
    process.exit(0);
  }

  // Skip if only CLAUDE.md itself was changed
  if (diff.includes('CLAUDE.md') && !diff.match(/^diff --git a\/packages\/core\/src/m)) {
    console.log('✓ Only CLAUDE.md changed, skipping check');
    process.exit(0);
  }

  const result = await checkWithClaude(diff, currentClaudeMd, files);

  if (result.needsUpdate) {
    console.log('📝 CLAUDE.md needs updating. Writing new version...');
    await writeFile(CLAUDE_MD_PATH, result.newContent, 'utf-8');

    // Add the updated file to the commit
    await execAsync('git add packages/core/CLAUDE.md');

    console.log('✓ CLAUDE.md has been updated and staged');
    process.exit(0);
  } else {
    console.log('✓ CLAUDE.md is up to date');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
