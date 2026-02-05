# fossyl

## 0.14.0

### Minor Changes

- Fixed CLI scaffolding I think

## 0.12.0

### Minor Changes

- CLEAN it up

## 0.11.0

### Minor Changes

- CLI fixes

## 0.10.0

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

## 0.1.6

### Patch Changes

- SVG

## 0.1.5

### Patch Changes

- Finally getting SVG to work.

## 0.1.4

### Patch Changes

- Should fix Readme

## 0.1.3

### Patch Changes

- Fixed SVG

## 0.1.2

### Patch Changes

- Added the ReadMe and SVG logo.

## 0.1.1

### Patch Changes

- First release, ensuring monorepo structure works. Types are Ready to go!
