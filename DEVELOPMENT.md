# Fossyl Development Guide

## Setup

This is a monorepo managed with pnpm.

### Install Dependencies

```bash
pnpm install
```

### Build All Packages

```bash
pnpm build
```

### Run Tests

```bash
pnpm test
```

## Pre-commit Hook: CLAUDE.md Auto-Update

This repository includes a pre-commit hook that automatically verifies and updates `CLAUDE.md` based on code changes.

### How It Works

1. When you commit changes, the hook runs automatically
2. It analyzes the staged changes (git diff)
3. Uses Claude API to determine if `CLAUDE.md` needs updating
4. If updates are needed, it regenerates `CLAUDE.md` and adds it to your commit
5. If `CLAUDE.md` is already up-to-date, the commit proceeds normally

### Setup Requirements

**Optional but recommended:** Set your Anthropic API key as an environment variable to enable automatic CLAUDE.md updates.

#### Getting an API Key

1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Sign up or log in to your account
3. Navigate to **API Keys** in the dashboard
4. Click **Create Key** and give it a name (e.g., "fossyl-dev")
5. Copy the API key (it starts with `sk-ant-`)

**Note:** API usage is pay-as-you-go. The CLAUDE.md updates use minimal tokens (usually <$0.01 per commit).

#### Setting the API Key

```bash
export ANTHROPIC_API_KEY="sk-ant-your-key-here"
```

**Note:** If the API key is not set, the hook will display a warning but **will not block your commit**. The automatic CLAUDE.md validation will simply be skipped.

To make this permanent, add it to your shell profile:

**For bash** (`~/.bashrc` or `~/.bash_profile`):
```bash
echo 'export ANTHROPIC_API_KEY="your-api-key-here"' >> ~/.bashrc
source ~/.bashrc
```

**For zsh** (`~/.zshrc`):
```bash
echo 'export ANTHROPIC_API_KEY="your-api-key-here"' >> ~/.zshrc
source ~/.zshrc
```

**For fish** (`~/.config/fish/config.fish`):
```fish
echo 'set -x ANTHROPIC_API_KEY "your-api-key-here"' >> ~/.config/fish/config.fish
source ~/.config/fish/config.fish
```

### Hook Location

The pre-commit hook is located at:
- `.git/hooks/pre-commit` - The git hook script
- `scripts/update-claude-md.mjs` - The Node.js script that does the actual work

### Manual Update

You can manually trigger the CLAUDE.md update:

```bash
node scripts/update-claude-md.mjs
```

### Troubleshooting

**Hook not running?**
- Ensure the hook is executable: `chmod +x .git/hooks/pre-commit`
- Check that you have the API key set: `echo $ANTHROPIC_API_KEY`

**API errors?**
- Verify your API key is valid
- Check your internet connection
- Ensure you have API credits available

**Want to skip the hook?**
```bash
git commit --no-verify -m "your message"
```

## Package Structure

```
fossyl/
├── packages/
│   ├── core/          # Main fossyl package
│   │   ├── src/
│   │   ├── CLAUDE.md  # AI-friendly documentation (auto-generated)
│   │   └── package.json
│   └── docs/          # Documentation site
├── scripts/
│   └── update-claude-md.mjs  # CLAUDE.md update script
└── package.json       # Root package.json
```

## Contributing

1. Make your changes to the code
2. The pre-commit hook will automatically update `CLAUDE.md` if needed
3. Review the changes (including any updates to `CLAUDE.md`)
4. Commit proceeds with all changes
