# Code Review Checklist

Use this checklist when performing a code review. Every item must be evaluated.

## Correctness
- [ ] Does the code do what it claims to do?
- [ ] Are edge cases handled? (null/undefined, empty collections, zero values, negative numbers)
- [ ] Are errors handled and surfaced correctly? No silent failures.
- [ ] Is concurrent access safe where applicable?
- [ ] Are off-by-one errors possible in loops or index operations?
- [ ] Are external API responses validated before use?

## Security
- [ ] No secrets, tokens, or credentials in code or config files.
- [ ] All external inputs validated at the system boundary.
- [ ] No SQL/command/LDAP injection vectors (parameterized queries used).
- [ ] No XSS vectors (output properly escaped).
- [ ] Authorization checked — not just authentication.
- [ ] Sensitive data not logged.

## Tests
- [ ] Happy path covered.
- [ ] Error cases covered.
- [ ] Edge cases covered (empty input, boundary values).
- [ ] Tests are deterministic (no random data, no time dependency without freezing).
- [ ] Tests are isolated (no shared mutable state between tests).
- [ ] Tests name the behavior, not the method.

## Design
- [ ] Code is in the correct layer (domain/application/infrastructure/ports).
- [ ] No unnecessary coupling introduced.
- [ ] No domain logic leaking into infrastructure or controllers.
- [ ] Abstraction level is appropriate — not over- or under-engineered.
- [ ] Follows the project's established patterns and conventions.

## Readability
- [ ] Names (variables, functions, classes) are accurate and descriptive.
- [ ] No dead code, commented-out code, or TODO without a ticket reference.
- [ ] Complex logic is explained with a comment where intent is not obvious.
- [ ] Functions are small enough to read end-to-end comfortably.

## Performance
- [ ] No N+1 query patterns introduced.
- [ ] No unnecessary data loaded (select only what is needed).
- [ ] No unbounded collections or pagination missing.
- [ ] Hot-path allocations are reasonable.

## Observability
- [ ] Errors are logged with context (traceId, relevant IDs).
- [ ] Metrics emitted for significant operations.
- [ ] No PII in log messages.
