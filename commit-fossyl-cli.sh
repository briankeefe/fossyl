#!/bin/bash
set -e
cd /Users/grant/workdir/OpenSource/fossyl-worktrees/cli

# Stage the fossyl-cli package (excluding node_modules and dist)
git add packages/fossyl-cli/package.json
git add packages/fossyl-cli/tsconfig.json
git add packages/fossyl-cli/bin/
git add packages/fossyl-cli/src/
git add packages/fossyl-cli/CLAUDE.md

# Stage related changes
git add packages/core/package.json
git add pnpm-lock.yaml

echo "Staged files:"
git status

# Create commit
git commit -m "$(cat <<'EOF'
feat: Add fossyl CLI package with init, build, dev, validate, routes commands

Implements the fossyl CLI tool for the type-safe REST API framework:
- init: Creates fossyl.config.ts configuration file
- build: Generates code from routes using framework adapters
- dev: Starts development server with hot reload
- validate: Validates routes without code generation
- routes: Lists all registered routes grouped by prefix

Package includes:
- Config loading via tsx for TypeScript execution
- Route discovery through directory scanning
- Validation for duplicate routes and path conventions
- Support for Express and Hono adapters

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"

echo "Commit created successfully"
git log --oneline -1
