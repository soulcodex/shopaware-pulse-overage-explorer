## Code Review

### Purpose

Code review exists to catch bugs, share knowledge, and maintain consistency — not to enforce
personal style preferences. Reviews should be constructive and specific.

### What to Check

**Correctness**
- Does the code do what it claims to do?
- Are edge cases handled (empty inputs, null values, off-by-one errors, concurrent access)?
- Are errors handled and propagated correctly?

**Security**
- Does the change introduce any vulnerability? (injection, auth bypass, secret exposure)
- Are inputs validated at system boundaries?

**Test Coverage**
- Are the happy path, error cases, and edge cases tested?
- Do tests actually assert meaningful behavior, not just that code runs?
- Are tests deterministic (no flaky timeouts, no reliance on external state)?

**Design**
- Is the code in the right place? (single responsibility, correct layer)
- Does it introduce unnecessary coupling or break existing abstractions?
- Is it over-engineered? Could a simpler solution achieve the same result?

**Readability**
- Is the intent clear without needing to read comments?
- Are names descriptive and accurate?
- Is complex logic explained where necessary?

**Performance**
- Are there N+1 queries or unnecessary iterations?
- Is data fetched lazily when appropriate?
- Are memory allocations within reason for the hot path?

### How to Give Feedback

- Be specific: reference line numbers and exact code. Vague feedback helps no one.
- Distinguish severity: prefix with `[blocking]`, `[suggestion]`, or `[nit]`.
- Explain *why*, not just *what*: "This N+1 query will degrade under load" beats "fix query".
- Acknowledge good work. A review with only criticism misses an opportunity to reinforce patterns.
- Assume good intent. "I think this could be clearer if..." is better than "this is wrong".

### Review Output Format

```
## Summary
[One paragraph: overall quality, main concerns, recommendation (approve / request changes)]

## Blocking Issues
- [Line X] [blocking] Description of the issue and why it must be fixed.

## Suggestions
- [Line Y] [suggestion] Description of an improvement worth considering.

## Nits
- [Line Z] [nit] Minor style or wording note.

## Positives
- [What was done well and should be continued]
```
