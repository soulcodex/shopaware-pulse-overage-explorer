## Testing Philosophy

### Core Principle

Tests exist to give confidence that the software works. A test that passes but doesn't
catch regressions has negative value — it creates false confidence and maintenance burden.

### Test Pyramid

```
        ▲  E2E / Integration  (few, slow, expensive — test critical journeys)
       ▲▲▲  Integration tests  (some — test component boundaries)
      ▲▲▲▲▲  Unit tests  (many, fast, cheap — test logic in isolation)
```

- Unit tests: pure functions, domain logic, value objects, command/query handlers.
- Integration tests: repository implementations, HTTP handlers (against real DB in test containers),
  message consumers.
- E2E tests: critical user journeys only. Avoid duplicating what integration tests already cover.

### Test Naming

Name tests as sentences describing behavior, not implementation:

```
// Good
it("returns empty cart when no items have been added")
it("throws InsufficientFundsError when balance is less than transfer amount")

// Bad
it("test cart")
it("testTransferError")
```

### Test Structure (AAA)

```
// Arrange — set up inputs and dependencies
// Act — execute the behavior under test
// Assert — verify the outcome
```

Keep each section small. If Arrange is long, extract a builder or factory.

### What Makes a Good Test

- **Deterministic**: same result every run. No randomness, no time-dependency (freeze time), no
  network calls unless specifically testing integration.
- **Isolated**: no shared mutable state between tests. Each test sets up and tears down its own
  fixtures.
- **Fast**: unit tests run in milliseconds. If a test is slow, question what it is actually testing.
- **Readable**: the test itself documents the behavior. A failing test should tell you exactly what
  broke and why.

### Coverage

- Aim for high coverage of domain logic and edge cases, not 100% line coverage.
- 100% line coverage with trivial assertions is worse than 70% coverage with meaningful tests.
- Mutations should be caught. If a mutation test tool is available, use it on critical modules.

### Test Data

- Use the minimum data necessary for the test.
- Avoid sharing test fixtures across unrelated tests.
- Use builder patterns for complex domain objects: `UserBuilder.aUser().withEmail("x@y.com").build()`.
- Never use production data in tests.

### What Not to Test

- Framework internals (trust the framework).
- Private implementation details (test public behavior).
- Trivial getters/setters with zero logic.
- Third-party library correctness (they have their own tests).
