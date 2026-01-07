# Agent Enforcement Protocol (AEP)

**Vision:** Enable reliable, high-quality autonomous agentic coding through opinionated framework constraints and standardized context files.

## Problem Statement

Current agentic code output suffers from:
- Inconsistent patterns (each agent "invents" its own conventions)
- Missing business domain context (technically correct, semantically wrong)
- No architectural guardrails (over/under-engineered solutions)
- Agent-specific context formats (CLAUDE.md, AGENTS.md, CURSOR.md, etc.)

## Solution

A three-layer enforcement system:

```
┌─────────────────────────────────────────────────┐
│  Layer 3: Domain Context (AEP Context Files)    │
│  - Business logic documentation                 │
│  - Domain-specific patterns                     │
│  - Type semantics                               │
├─────────────────────────────────────────────────┤
│  Layer 2: Structural Validation (AEP Schema)    │
│  - Required sections enforcement                │
│  - Cross-reference validation                   │
│  - Completeness checks                          │
├─────────────────────────────────────────────────┤
│  Layer 1: Type Safety (Fossyl Core)             │
│  - REST semantics at compile-time               │
│  - Route type enforcement                       │
│  - Auth/validation patterns                     │
└─────────────────────────────────────────────────┘
```

## Universal Context File Format

### File Naming Convention

To support multiple AI coding agents, fossyl uses a universal approach:

```
microservice/
├── AGENTS.md          # Universal format (primary)
├── CLAUDE.md          # Symlink or auto-generated
├── CURSOR.md          # Symlink or auto-generated
└── src/
```

The `AGENTS.md` file is the source of truth. Agent-specific files can be:
1. Symlinks to AGENTS.md (simplest)
2. Auto-generated with agent-specific additions
3. Transpiled from AGENTS.md with agent-specific formatting

### Required Schema

```markdown
# {Microservice Name}

## Domain Context
<!-- Required: Business logic explanation -->
<!-- What does this microservice do? What business problem does it solve? -->

## Route Patterns
<!-- Required: How routes are structured -->
<!-- What fossyl patterns are used? What are the conventions? -->

## Types
<!-- Required: Key types and business meaning -->
<!-- What do the main types represent in domain terms? -->

## Dependencies
<!-- Required: Internal and external dependencies -->
<!-- What other microservices does this depend on? -->

## Authentication
<!-- Conditional: Required if any routes use auth -->
<!-- What auth patterns are used? What scopes/roles exist? -->

## Validation
<!-- Conditional: Required if custom validators exist -->
<!-- What validation patterns are used? -->
```

### Example: Orders Microservice

```markdown
# Orders Microservice

## Domain Context
Handles order lifecycle from creation through fulfillment. Orders are the
core transaction unit - they link customers, products, payments, and fulfillment.

Key concepts:
- **Order**: A customer's intent to purchase, containing line items
- **LineItem**: Individual product within an order
- **OrderStatus**: Enum tracking order state (pending → paid → fulfilled → completed)

Business rules:
- Orders cannot be modified after payment processing begins
- Refunds create new compensating transactions, never modify original order
- Order totals are calculated server-side, never trusted from client

## Route Patterns
All routes follow fossyl conventions:
- GET routes: OpenRoute or AuthenticatedRoute (no body)
- POST/PUT routes: ValidatedRoute or FullRoute (body required)

Naming: `/orders/:orderId/...` for order-specific operations

## Types
- `Order`: Core order entity with line items, totals, status
- `CreateOrderInput`: Validated input for order creation
- `OrderStatus`: Union type of valid statuses
- `PaymentIntent`: Represents pending payment, links to Stripe

## Dependencies
- **accounts**: Customer lookup and validation
- **menus**: Product availability and pricing
- **payments**: Payment processing delegation

## Authentication
All mutation routes require authentication via `orderAuthenticator`.
Scopes:
- `orders:read`: View orders
- `orders:write`: Create/modify orders
- `orders:admin`: Refunds, manual status changes

## Validation
Uses Zod schemas in `/orders/validators/`:
- `createOrderSchema`: Validates order creation input
- `updateOrderSchema`: Validates order modifications
```

## CLI Tooling

### Scaffold Command

```bash
fossyl create microservice orders
```

Creates:
```
src/microservices/orders/
├── AGENTS.md           # Pre-filled template
├── index.ts            # Barrel export
├── routes/
│   └── index.ts        # Route definitions
├── validators/
│   └── index.ts        # Zod schemas
├── services/
│   └── index.ts        # Business logic
└── types/
    └── index.ts        # Domain types
```

### Validate Command

```bash
fossyl validate                    # Validate all microservices
fossyl validate orders             # Validate specific microservice
fossyl validate --strict           # Fail on warnings
```

Validation checks:
1. **Schema compliance**: All required sections present
2. **Type references**: Types mentioned in AGENTS.md exist in code
3. **Route coverage**: All routes documented
4. **Dependency accuracy**: Listed dependencies match imports
5. **Auth consistency**: Auth section matches route authenticators

### Sync Command

```bash
fossyl sync agents                 # Generate agent-specific files from AGENTS.md
```

Generates CLAUDE.md, CURSOR.md, etc. from the universal AGENTS.md.

## Multi-Agent Support

### Agent Detection

Fossyl detects which agent is running via environment variables or context:

| Agent | Detection | Context File |
|-------|-----------|--------------|
| Claude Code | `CLAUDE_CODE=1` | CLAUDE.md |
| Cursor | `CURSOR=1` | CURSOR.md |
| Aider | `AIDER=1` | AGENTS.md |
| Continue | `CONTINUE=1` | AGENTS.md |
| OpenCode | `OPENCODE=1` | AGENTS.md |

### Agent-Specific Extensions

Each agent can have extended sections in their generated files:

```markdown
<!-- CLAUDE-SPECIFIC -->
## Claude Code Tips
- Use `fossyl validate` after making changes
- Route types are strictly enforced - check compile errors first
<!-- /CLAUDE-SPECIFIC -->
```

## Validation Rules

### Required Validations

| Rule | Severity | Description |
|------|----------|-------------|
| `schema/required-sections` | Error | All required sections must be present |
| `schema/section-content` | Error | Sections cannot be empty |
| `types/exist` | Error | Referenced types must exist in code |
| `routes/documented` | Warning | All routes should be mentioned |
| `deps/accurate` | Warning | Dependencies should match imports |

### Custom Rules

Projects can add custom validation rules via `fossyl.config.ts`:

```typescript
export default {
  aep: {
    rules: {
      'custom/require-examples': {
        severity: 'warning',
        validate: (agents) => {
          // Custom validation logic
        }
      }
    }
  }
}
```

## Implementation Phases

### Phase 1: Schema & Validation Foundation
- Define AGENTS.md JSON schema
- Implement `fossyl validate` command
- Basic required section checking
- Integration with fossyl CLI

### Phase 2: Scaffolding & Templates
- Implement `fossyl create microservice` command
- AGENTS.md template generation
- Directory structure scaffolding
- Starter route/type templates

### Phase 3: Type-Aware Validation
- Parse TypeScript to extract types
- Validate type references in AGENTS.md
- Route coverage checking
- Dependency graph validation

### Phase 4: Multi-Agent Sync
- Implement `fossyl sync agents` command
- Agent detection system
- Agent-specific file generation
- Extension section support

### Phase 5: IDE Integration
- VSCode extension for AGENTS.md
- Schema-aware autocomplete
- Inline validation warnings
- Jump-to-definition for type references

## Success Metrics

The AEP is successful when:
1. An agent can scaffold a new microservice with correct structure
2. An agent can implement routes that pass validation without human review
3. Multiple agents can work on different microservices concurrently
4. Code quality from agentic work matches human-written code

## Open Questions

1. **Versioning**: How do we handle AGENTS.md schema evolution?
2. **Inheritance**: Should microservices inherit from a base template?
3. **Cross-repo**: How do AGENTS.md files work in monorepos vs multi-repo?
4. **Runtime validation**: Should validation run as a git hook or CI step?
