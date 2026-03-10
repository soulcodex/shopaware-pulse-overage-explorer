## Domain-Driven Design (DDD)

### Core Building Blocks

**Entity**: An object defined by its identity, not its attributes. Two entities with the same
attributes but different IDs are different entities.
- Always accessed and modified through the aggregate root.
- IDs are typed value objects, not raw primitives: `UserId`, not `string`.

**Value Object**: An object defined by its attributes, with no identity. Immutable.
- Equality is structural (all attributes equal = same value).
- Contains behavior related to what it represents: `Money.add()`, `Email.domain()`.
- Common examples: `Money`, `Email`, `Address`, `DateRange`, `Quantity`.

**Aggregate**: A cluster of entities and value objects treated as a single unit for data changes.
- Has one **aggregate root** — the only entry point for external code.
- Enforces all invariants within its boundary.
- Only root IDs may be referenced from outside the aggregate.
- Keep aggregates small. If an aggregate spans multiple database tables with many relations,
  it is likely too large.

**Domain Event**: Records something that happened in the domain. Immutable facts.
- Named in past tense: `OrderPlaced`, `UserEmailVerified`, `PaymentFailed`.
- Published by the aggregate root after a state change.
- Used to integrate between aggregates and bounded contexts.

**Repository**: Provides collection-like access to aggregates.
- Interface defined in `domain/`. Implementation in `infrastructure/`.
- Methods return domain objects, not ORM entities or raw rows.
- Never returns partial aggregates.

**Domain Service**: Encapsulates domain logic that does not belong to a single aggregate.
- Stateless.
- Operates on domain objects.
- Example: `TransferService` that coordinates two `Account` aggregates.

### Bounded Contexts

A bounded context defines the boundary within which a domain model applies.
- Each bounded context has its own ubiquitous language. The same word may mean different things
  in different contexts (`Account` in `Billing` vs `Account` in `IAM`).
- Bounded contexts communicate via published events or explicit anti-corruption layers (ACL),
  never by sharing a database or domain model.

### Ubiquitous Language

- Code (class names, method names, variable names) must use the exact words from the domain
  language agreed with domain experts.
- If a domain expert would not recognize a term in your code, rename it.
- Maintain a glossary in `docs/ubiquitous-language.md`.

### Invariants and Validation

- Invariants belong in the aggregate, enforced in the constructor and command methods.
- An aggregate must never be in an invalid state.
- Throw domain exceptions (`OrderAlreadyShippedException`) when invariants are violated — never
  return error codes from domain methods.
- Input validation (format, required fields) happens at the boundary (controller/handler),
  not in the domain.

### Anti-Patterns to Avoid

- **Anemic Domain Model**: entities with only getters/setters and no behavior. Behavior belongs
  in the domain, not in service classes that manipulate data bags.
- **God Aggregate**: aggregates that reference many other aggregates by value (not ID) and span
  the whole domain. Breaks transactional boundaries.
- **Repository for every entity**: only aggregate roots have repositories. Child entities are
  accessed through the root.
