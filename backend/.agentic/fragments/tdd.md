## Test-Driven Development (TDD)

### The Cycle

1. **Red**: Write a failing test that describes the behavior you are about to implement.
   Run it — confirm it fails for the right reason.
2. **Green**: Write the minimum code to make the test pass. Do not optimize yet.
3. **Refactor**: Clean up the code (and tests) without changing behavior. Re-run tests
   to confirm they still pass.

Repeat. Each cycle should take minutes, not hours.

### Writing the Test First

- The test describes the *what*, not the *how*.
- If you cannot write the test before the code, you likely do not understand the requirement yet.
- A failing test is a precise, executable specification.

### What to Test First

Start with the most important behavior, not the easiest:
- Happy path for the most critical use case.
- Then error cases and edge cases.
- Then less-critical behaviors.

Avoid writing tests for implementation details you haven't decided on yet.

### Test Quality in TDD

Because tests are written before the code, they tend to be cleaner and more behavior-focused.
Maintain that quality:
- Each test covers exactly one behavior.
- Tests do not share mutable state.
- Tests name the behavior they specify, not the method they call.

### Designing for Testability

TDD surfaces design problems early. If a test is hard to write, the design needs attention:
- **Hard to instantiate** the class under test → too many dependencies; break it up.
- **Hard to control inputs** → hidden global state; inject it instead.
- **Hard to observe outputs** → behavior is buried inside side effects; use ports/adapters.

TDD is a design technique as much as a testing technique.

### Applying TDD to Existing Code

When adding behavior to untested code:
1. Write a characterization test that captures current behavior (even if it's wrong).
2. Write a test for the new behavior.
3. Make it pass.
4. Refactor.

Never add a new feature to untested code without first writing at least a smoke test.

### When to Skip TDD

TDD is most valuable for:
- Domain logic, business rules, complex algorithms.
- Code that must handle edge cases correctly.

TDD adds less value for:
- Glue code, configuration, framework wiring (test at a higher level).
- Exploratory spikes (throw the spike away when done; start fresh with TDD).
- Infrastructure code tested best with integration tests.
