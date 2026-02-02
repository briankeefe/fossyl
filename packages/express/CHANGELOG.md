# @fossyl/express

## 2.0.0

### Minor Changes

- CLI fixes

### Patch Changes

- Updated dependencies
  - @fossyl/core@0.11.0

## 1.0.0

### Minor Changes

- Readme!
- ## 0.9.0 - Pre-release milestone

  ### CLI Package Separation
  - Moved CLI from `@fossyl/core` to unscoped `fossyl` package
  - Users can now run `npx fossyl --create my-api` instead of `npx @fossyl/core`
  - Core package now focused solely on router and types
  - CLI can be versioned independently

  ### Documentation
  - Added top-level README.md with getting started guide
  - Updated ROADMAP.md with completed milestones
  - Each package includes comprehensive CLAUDE.md for AI-assisted development

  ### Package Structure

  ```
  packages/
  ├── core/       # @fossyl/core - Router and types
  ├── cli/        # fossyl - Scaffolding CLI
  ├── express/    # @fossyl/express - Express adapter
  ├── zod/        # @fossyl/zod - Zod validation adapter
  ├── kysely/     # @fossyl/kysely - Kysely database adapter
  └── docs/       # Documentation site
  ```

- First big release before 1.0! Adapters ready, CLI ready, just publishing coming

### Patch Changes

- Updated dependencies
- Updated dependencies
- Updated dependencies
  - @fossyl/core@0.10.0
