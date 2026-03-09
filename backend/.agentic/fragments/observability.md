## Observability

### Three Pillars

- **Logs**: what happened and when. Narrative, timestamped events.
- **Metrics**: how much, how often, how fast. Numeric time-series data.
- **Traces**: the journey of a request across services. Timing and causal chains.

Together they answer: "What is happening?", "How often?", "Why?".

### Structured Logging

Always emit JSON logs:

```json
{
  "level": "info",
  "message": "Order placed",
  "timestamp": "2026-03-01T12:00:00.000Z",
  "traceId": "abc-123",
  "spanId": "def-456",
  "service": "order-service",
  "orderId": "ord-789",
  "customerId": "usr-101",
  "durationMs": 42
}
```

Rules:
- Every log line must have `level`, `message`, `timestamp`, `traceId`, `service`.
- Add domain context fields (`orderId`, `userId`, etc.) — do not embed them in the message string.
- Never log PII (email addresses, names, phone numbers, payment card data) without masking.
- Use log levels correctly:
  - `debug`: internal state useful during development only.
  - `info`: normal operational events (request received, job started).
  - `warn`: recoverable anomalies (retry triggered, cache miss rate elevated).
  - `error`: failures that need attention (request failed, third-party unavailable).

### Metrics

Emit the following for every service:
- **Request rate**: requests per second by endpoint.
- **Error rate**: errors per second / error percentage by endpoint.
- **Latency**: p50, p95, p99 by endpoint.
- **Saturation**: queue depth, goroutine count, thread pool utilization.

Naming convention: `{service}_{subsystem}_{metric}_{unit}` — e.g., `order_http_request_duration_seconds`.

Track business metrics alongside technical ones: `orders_placed_total`, `payments_failed_total`.

### Distributed Tracing

Use OpenTelemetry SDK. Propagate trace context across all service calls:
- HTTP: `traceparent` header (W3C Trace Context)
- Message queues: embed trace context in message metadata

Every span must have:
- A meaningful name: `POST /v1/orders`, `order.place`, `postgres.query`
- Status (ok / error)
- Duration
- Relevant attributes: `db.statement` (sanitized), `http.status_code`, `rpc.method`

### Health Endpoints

Every service exposes two health check endpoints:
- `GET /health/live` — liveness: "Is the process running?" Returns 200 always unless crashed.
- `GET /health/ready` — readiness: "Can the service handle traffic?" Checks DB connection,
  message broker connection, etc. Returns 503 if a dependency is down.

Kubernetes uses liveness to restart pods and readiness to route traffic.

### Alerting

Alert on symptoms, not causes:
- "Error rate > 1% for 5 minutes" → alert (symptom).
- "Database connection pool > 80%" → alert (leading indicator).
- "Service restarted 3 times in 10 minutes" → alert (symptom).

Avoid alert fatigue: every alert must be actionable. If an alert fires and the response is
"nothing to do", remove it or make it a notification.
