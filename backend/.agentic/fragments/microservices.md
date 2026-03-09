## Microservices

### Service Boundaries

- Design service boundaries around business capabilities or bounded contexts, not technical layers.
- A service owns its data. No two services share a database, schema, or table.
- Services communicate via APIs (REST, gRPC) or asynchronous events (message queues).
- Prefer coarse-grained services over fine-grained ones. Avoid premature decomposition.

### Inter-Service Communication

**Synchronous (REST/gRPC)**
- Use for queries where the caller needs a response immediately.
- Always set timeouts. Never call a downstream service without a deadline.
- Implement retry with exponential backoff + jitter for transient failures.
- Use circuit breakers to prevent cascade failures (e.g., resilience4j, go-hystrix).

**Asynchronous (Events)**
- Use for commands and notifications where eventual consistency is acceptable.
- Events are immutable facts published to a message broker (Kafka, RabbitMQ, SQS).
- Consumers must be idempotent: processing the same event twice must not cause incorrect state.
- Use outbox pattern to guarantee at-least-once delivery without distributed transactions.

### Resilience

- **Timeout**: every external call has a timeout.
- **Retry**: transient failures are retried with backoff. Permanent failures are not.
- **Circuit breaker**: after N failures, open the circuit. Fail fast; don't queue up calls to a
  dead service.
- **Bulkhead**: isolate thread pools / connection pools per downstream. One slow service must not
  exhaust resources for all others.
- **Fallback**: define graceful degradation when a dependency is unavailable.

### API Design Between Services

- Version all APIs from day one: `/v1/`, `/v2/`.
- Never break a published API contract. Add fields; never remove or rename.
- Validate request schemas at the consumer boundary.
- Generate client code from OpenAPI/Protobuf specs — do not handwrite clients.

### Data Management

- Each service has its own datastore suited to its access patterns.
- Eventual consistency between services is acceptable; design the UX accordingly.
- Avoid distributed transactions (2PC). Use sagas (choreography or orchestration) for multi-step
  workflows that span services.
- Use event sourcing or the outbox pattern when you need reliable event publishing alongside
  database writes.

### Operational Concerns

- Every service exposes health endpoints: `/health/live` (liveness) and `/health/ready` (readiness).
- Structured JSON logs with a correlation/trace ID on every log line.
- Distributed tracing (OpenTelemetry) enabled by default.
- Each service is independently deployable without coordinating with other services.
- Container images are immutable: configuration comes from environment variables, not baked-in files.
