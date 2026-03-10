## Documentation

### Philosophy

Documentation should explain *why*, not *what*. Code already shows what happens.
A comment restating the code in English adds noise without adding value.

```typescript
// Bad: states the obvious
// Increment counter
counter++;

// Good: explains non-obvious intent
// Compensate for zero-based index when rendering to the user
counter++;
```

### Inline Comments

- Comment on *intent* and *trade-offs*, not mechanics.
- Comment non-obvious algorithm choices: "Using Fisher-Yates instead of sort+random because
  sort+random is biased toward certain permutations."
- Document known limitations and TODOs with a ticket reference: `// TODO(#456): handle DST`
- Remove commented-out code. Use git history instead.

### Public API Documentation

Every exported/public function, method, class, and type must have a docstring that includes:
- **What it does** (one sentence)
- **Parameters** (non-obvious ones; don't restate types)
- **Return value** (what it represents, edge cases)
- **Errors/exceptions** it can produce

```typescript
/**
 * Transfers funds between two accounts atomically.
 *
 * Both accounts must belong to the same currency. The transfer is applied
 * in a single database transaction — either both balances update or neither does.
 *
 * @throws InsufficientFundsError when source balance < amount
 * @throws AccountFrozenError when either account is in a frozen state
 */
async transfer(from: AccountId, to: AccountId, amount: Money): Promise<void>
```

### Architecture Decision Records (ADRs)

Record significant technical decisions in `docs/adr/`:

```
docs/adr/
├── 0001-use-hexagonal-architecture.md
├── 0002-postgresql-as-primary-store.md
└── 0003-reject-graphql-in-favor-of-rest.md
```

ADR format:
```markdown
# ADR-NNNN: Title

**Status**: Accepted | Deprecated | Superseded by ADR-XXXX
**Date**: YYYY-MM-DD

## Context
What is the situation or problem that prompted this decision?

## Decision
What was decided?

## Consequences
What are the trade-offs, risks, and implications of this decision?
```

### README Standards

Every service/package must have a `README.md` with:
1. What it does (1-3 sentences)
2. How to run it locally (exact commands)
3. How to run tests
4. Environment variables (reference `.env.example`)
5. Architecture overview (optional, link to ADRs)

The README must always be current. A stale README is worse than no README.
