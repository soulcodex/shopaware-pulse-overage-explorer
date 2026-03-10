# Implementation Plan — Pulse Overage Explorer (Backend)

> **Status**: Approved — ready for implementation  
> **Date**: 2026-03-09  
> **Iteration scope**: Backend API only. No domain unit tests. Functional/acceptance tests via HTTP-level integration tests.

---

## 1. Decisions (locked)

| # | Decision | ADR |
|---|---|---|
| Storage | In-memory adapter seeded from `seed-data.json`; PostgreSQL evolution documented | [ADR-0001](docs/adr/0001-in-memory-adapter-over-database.md) |
| HTTP framework | Hono + `@hono/zod-openapi` | [ADR-0002](docs/adr/0002-hono-as-http-framework.md) |
| Tenant isolation | Middleware (fast-fail) + repository-level scoping (structural) | [ADR-0003](docs/adr/0003-tenant-isolation-strategy.md) |
| API versioning | `X-API-Version: 1` header; default v1 when absent | [ADR-0004](docs/adr/0004-api-versioning-via-header.md) |
| Author identity | Caller-supplied `{ id, name }`; security concern raised + evolution path documented | [ADR-0005](docs/adr/0005-author-identity-in-support-notes.md) |
| Response/request shape | JSON:API document structure for all `/api/*` endpoints; health endpoint uses plain JSON | REQUIREMENTS.md |
| Nice-to-have | Structured logging: `tenantId`, `shopId`, `requestId`, `durationMs` on every request | — |

---

## 2. API Contract (final)

All `/api/*` endpoints:
- Accept `X-API-Version: 1` (or absent — defaults to v1; unknown version → `400`)
- Require `X-Tenant-Id` (missing **or blank/whitespace** → `400`)
- Return JSON:API document structure
- Return `Vary: X-API-Version` response header

### `GET /api/shops`

**Query parameters:**

| Param | Type | Description |
|---|---|---|
| `search` | string (optional) | Case-insensitive substring match on `name` |
| `plan` | `starter\|grow\|scale` (optional) | Exact match on `planId` |
| `status` | `active\|past_due\|cancelled` (optional) | Exact match on `status` |
| `sort` | string (optional) | `-overage_charges` or `-name` (minus prefix = descending) |

**Response 200:**
```json
{
  "data": [
    {
      "type": "shop",
      "id": "eu_001",
      "attributes": {
        "name": "Blue Bicycle",
        "plan": "starter",
        "status": "active",
        "usage": 250,
        "included_usage": 200,
        "overage_charges": 2.5,
        "created_at": "2026-03-01T00:00:00Z",
        "updated_at": "2026-03-01T00:00:00Z"
      }
    }
  ],
  "meta": { "request_id": "uuid-v4" }
}
```

**Response 400** (missing/blank `X-Tenant-Id`):
```json
{
  "errors": [
    {
      "status": "400",
      "code": "MISSING_TENANT_ID",
      "title": "Missing required header",
      "detail": "X-Tenant-Id header is required and must not be blank"
    }
  ],
  "meta": { "request_id": "uuid-v4" }
}
```

**Response 400** (unsupported `X-API-Version`):
```json
{
  "errors": [
    {
      "status": "400",
      "code": "UNSUPPORTED_API_VERSION",
      "title": "Unsupported API version",
      "detail": "X-API-Version '2' is not supported. Supported versions: 1"
    }
  ],
  "meta": { "request_id": "uuid-v4" }
}
```

---

### `GET /api/shops/:shopId`

**Response 200:**
```json
{
  "data": {
    "type": "shop",
    "id": "eu_001",
    "attributes": {
      "name": "Blue Bicycle",
      "plan": "starter",
      "status": "active",
      "billing_cycle_start": "2026-03-01",
      "billing_cycle_end": "2026-03-31",
      "summary": {
        "total_orders": 250,
        "included_orders": 200,
        "overage_orders": 50,
        "overage_charges": 2.5
      },
      "usage": [
        {
          "id": "evt_0001",
          "timestamp": "2026-03-02T10:15:00Z",
          "orders": 50,
          "gmv_eur": 6000
        }
      ],
      "notes": [
        {
          "id": "01JNMXYZ...",
          "author": { "id": "usr_01", "name": "Alice" },
          "content": "Contacted merchant about upcoming renewal.",
          "created_at": "2026-03-09T12:00:00Z"
        }
      ],
      "created_at": "2026-03-01T00:00:00Z",
      "updated_at": "2026-03-01T00:00:00Z"
    }
  },
  "meta": { "request_id": "uuid-v4" }
}
```

**Response 404** (not found or cross-tenant — masked deliberately; see ADR-0003):
```json
{
  "errors": [
    {
      "status": "404",
      "code": "SHOP_NOT_FOUND",
      "title": "Shop not found",
      "detail": "No shop with id 'eu_001' was found"
    }
  ],
  "meta": { "request_id": "uuid-v4" }
}
```

---

### `POST /api/shops/:shopId/notes`

**Request body (JSON:API):**
```json
{
  "data": {
    "type": "note",
    "attributes": {
      "author": { "id": "usr_01", "name": "Alice" },
      "content": "Contacted merchant about upcoming renewal."
    }
  }
}
```

**Response 204**: No Content  
**Response 404**: Shop not found / cross-tenant (same 404 shape as above)  
**Response 400**: Validation error

```json
{
  "errors": [
    {
      "status": "400",
      "code": "VALIDATION_ERROR",
      "title": "Validation failed",
      "detail": "'content' must not be blank",
      "source": { "pointer": "/data/attributes/content" }
    }
  ],
  "meta": { "request_id": "uuid-v4" }
}
```

---

### `GET /health`

No tenant guard. No versioning. Plain JSON (not JSON:API — health probes are consumed by
infrastructure, not API clients).

**Response 200:** `{ "status": "ok", "timestamp": "...", "version": "1.0.0" }`  
**Response 503:** `{ "status": "unhealthy", "timestamp": "...", "version": "1.0.0" }`  
**Response 500:** `{ "status": "error", "timestamp": "...", "version": "1.0.0" }`

---

## 3. Domain Rules (locked)

```
overageOrders = max(0, totalOrders − plan.includedOrders)
overageEur    = overageOrders × plan.overagePerOrderEur   [rounded to 2 decimal places]
```

**Money representation**: `overage_charges` is serialised as a JSON **number** (e.g. `2.5`,
not `"2.50"`). The server rounds to 2 decimal places internally via
`Math.round(value * 100) / 100`. Display formatting (trailing zero, currency symbol) is a
frontend responsibility. This avoids JSON string/number type ambiguity.

**Seed data overage truth table** (regression anchors for acceptance tests):

| Shop | Plan | Total orders | Included | Overage orders | Overage EUR |
|---|---|---|---|---|---|
| eu_001 Blue Bicycle | starter (200, €0.05) | 250 | 200 | 50 | 2.5 |
| eu_002 KaffeeKult | grow (1000, €0.03) | 1150 | 1000 | 150 | 4.5 |
| eu_003 Nordic Gear | starter (200, €0.05) | 210 | 200 | 10 | 0.5 |
| eu_004 Pet Paradise | scale (5000, €0.01) | 5000 | 5000 | 0 | 0 |
| us_001 Sunrise Electronics | grow (1000, €0.03) | 1100 | 1000 | 100 | 3 |
| us_002 Trail Outfitters | starter (200, €0.05) | 160 | 200 | 0 | 0 |
| us_003 Book Bazaar | starter (200, €0.05) | 45 | 200 | 0 | 0 |
| us_004 Sneaker Hub | scale (5000, €0.01) | 5200 | 5000 | 200 | 2 |

---

## 4. Aggregate Boundaries

**`Shop`** is the only aggregate root. It owns:
- Its identity (`ShopId`), `TenantId`, `Plan` (value object), `BillingCycle` (value object), `status`
- A collection of `SupportNote` entities (child entities, accessed only through `Shop`)

**`UsageEvent`** is **not** an aggregate and has no aggregate root of its own. It is a
read-model concern: a stream of events scoped to a shop and tenant. `UsageEventRepository`
is a query-side port — only query handlers use it. No command handler ever loads or mutates
usage events. The repository is in `domain/shop/repository/` because the domain defines the
contract, but it serves the read path only.

**`OverageSummary`** is a computed value object derived from `UsageEvent[]` + `Plan`. The
computation happens in the application query handler (not in the HTTP layer, not in the
repository). The result is mapped to a DTO and never stored.

---

## 5. Project Structure

```
src/
├── domain/
│   └── shop/
│       ├── model/
│       │   ├── shop.ts                    # Shop aggregate root (owns SupportNote children)
│       │   ├── shop-id.ts                 # ShopId value object
│       │   ├── tenant-id.ts               # TenantId value object
│       │   ├── billing-cycle.ts           # BillingCycle value object (start + end dates)
│       │   ├── plan.ts                    # Plan value object (includedOrders, overagePerOrderEur)
│       │   └── overage-summary.ts         # OverageSummary value object (computed, not stored)
│       ├── usage-event/
│       │   └── usage-event.ts             # UsageEvent (read-model entity, not an aggregate)
│       ├── note/
│       │   ├── support-note.ts            # SupportNote entity (child of Shop aggregate)
│       │   └── note-author.ts             # NoteAuthor value object (caller-supplied; see ADR-0005)
│       ├── exception/
│       │   └── shop-not-found.exception.ts # Thrown by query/command handlers; mapped to 404 at HTTP boundary
│       └── repository/
│           ├── shop.repository.ts         # ShopRepository port (read + write)
│           └── usage-event.repository.ts  # UsageEventRepository port (read-only, query side)
│
├── application/
│   ├── command/
│   │   └── create-note/
│   │       ├── create-note.command.ts
│   │       └── create-note.handler.ts
│   └── query/
│       ├── list-shops/
│       │   ├── list-shops.query.ts
│       │   ├── list-shops.handler.ts      # Computes OverageSummary per shop
│       │   └── shop-summary.dto.ts        # JSON:API resource shape for list
│       └── get-shop-detail/
│           ├── get-shop-detail.query.ts
│           ├── get-shop-detail.handler.ts # Computes OverageSummary + assembles detail
│           └── shop-detail.dto.ts         # JSON:API resource shape for detail
│
├── infrastructure/
│   └── persistence/
│       └── in-memory/
│           ├── in-memory-shop.repository.ts       # Implements ShopRepository
│           ├── in-memory-usage-event.repository.ts # Implements UsageEventRepository
│           └── seed-loader.ts                     # Loads seed-data.json at startup
│
└── ports/
    └── http/
        ├── server.ts                      # Hono app factory + DI wiring
        ├── middleware/
        │   ├── tenant-guard.middleware.ts  # X-Tenant-Id: missing/blank → 400
        │   ├── version-guard.middleware.ts # X-API-Version: unknown → 400; absent → v1
        │   ├── request-logger.middleware.ts # Structured JSON logging + requestId generation
        │   └── error-handler.middleware.ts # Maps domain exceptions → JSON:API error responses
        └── routes/
            ├── shops.router.ts            # GET /api/shops, GET /api/shops/:id, POST /api/shops/:id/notes
            └── health.router.ts           # GET /health (no guards)

tests/
└── acceptance/
    ├── list-shops.test.ts
    ├── get-shop-detail.test.ts
    ├── create-note.test.ts
    └── health.test.ts
```

---

## 6. Acceptance Test Coverage Plan

All tests use Hono's `app.request()` — no real TCP port, fully deterministic, seeded from
`seed-data.json`. Each test file creates a fresh app instance to avoid shared state between
test suites.

### `list-shops.test.ts`

| Test | What it validates |
|---|---|
| Returns shops for tenant `tnt_eu_01` with correct JSON:API shape | basic listing + response structure |
| Returns 400 when `X-Tenant-Id` is missing | mandatory header guard |
| Returns 400 when `X-Tenant-Id` is blank (whitespace only) | blank header guard |
| Returns 400 when `X-API-Version` is an unknown value | version guard |
| Passes through when `X-API-Version` is absent (defaults to v1) | version default |
| Does not return shops belonging to `tnt_us_01` when queried as `tnt_eu_01` | cross-tenant isolation |
| `?search=blue` returns only "Blue Bicycle" | search filter |
| `?search=BLUE` returns only "Blue Bicycle" (case-insensitive) | search case-insensitivity |
| `?plan=starter` returns only starter-plan shops for the tenant | plan filter |
| `?status=active` returns only active shops | status filter |
| `?sort=-overage_charges` returns shops ordered highest overage first | sort by overage descending |
| `?sort=-name` returns shops ordered Z→A by name | sort by name descending |
| Response for eu_001 has `overage_charges: 2.5` | domain rule — starter plan overage |
| Response for eu_002 has `overage_charges: 4.5` | domain rule — grow plan overage |
| Response for eu_004 has `overage_charges: 0` (exactly at limit) | domain rule — zero overage path |
| Response includes `Vary: X-API-Version` header | versioning cache directive |

### `get-shop-detail.test.ts`

| Test | What it validates |
|---|---|
| Returns full detail for `eu_001` with JSON:API shape | detail response structure |
| `attributes.summary.total_orders = 250` | order aggregation |
| `attributes.summary.overage_orders = 50` | overage order count |
| `attributes.summary.overage_charges = 2.5` | overage EUR calculation |
| `attributes.usage` contains all 3 events for eu_001 with `gmv_eur` field | usage events + gmvEur exposed |
| `attributes.notes` is an empty array initially | initial state |
| `attributes.billing_cycle_start` and `billing_cycle_end` are present | billing cycle fields |
| Returns 404 for a shopId that does not exist | not-found path |
| Returns 404 when shopId `eu_001` is requested with tenant `tnt_us_01` | cross-tenant masking as 404 |
| Returns 400 when `X-Tenant-Id` is missing | mandatory header guard |
| Returns 400 when `X-Tenant-Id` is blank | blank header guard |

### `create-note.test.ts`

| Test | What it validates |
|---|---|
| Creates a note and subsequent `GET /api/shops/:id` returns it | note lifecycle (write + read) |
| Returns 204 No Content on success | response code |
| Created note has a server-generated `id` (not from request body) | server-side id generation |
| Created note has a server-generated `created_at` | server-side timestamp |
| `tenantId` on stored note matches the `X-Tenant-Id` header, not any body field | tenant integrity |
| Returns 404 when `shopId` does not exist | not-found guard |
| Returns 404 when `shopId` belongs to a different tenant | cross-tenant guard |
| Returns 400 when request body `data.attributes.content` is missing | input validation |
| Returns 400 when request body `data.attributes.content` is blank | blank content guard |
| Returns 400 when request body `data.attributes.author` is missing | input validation |
| Returns 400 when request body `data.type` is not `"note"` | JSON:API type validation |
| Returns 400 when `X-Tenant-Id` is missing | mandatory header guard |
| Error response `source.pointer` correctly points to the failing field | JSON:API error pointer |

### `health.test.ts`

| Test | What it validates |
|---|---|
| Returns 200 with `{ status: "ok", timestamp, version }` | health contract |
| Does not require `X-Tenant-Id` | no tenant guard on health route |
| `timestamp` is a valid ISO 8601 string | response shape |
| `GET /docs` returns 200 (OpenAPI UI is served) | OpenAPI spec is accessible |

---

## 7. Structured Logging (nice-to-have)

Every request emits a single JSON log line after the response is sent:

```json
{
  "level": "info",
  "message": "request completed",
  "timestamp": "2026-03-09T12:00:00.000Z",
  "request_id": "uuid-v4",
  "tenant_id": "tnt_eu_01",
  "shop_id": "eu_001",
  "method": "GET",
  "path": "/api/shops/eu_001",
  "status": 200,
  "duration_ms": 4
}
```

- `request_id` is generated at middleware entry (UUID v4) and threaded through Hono context.
- `tenant_id` is set by `tenant-guard.middleware` after successful header extraction.
- `shop_id` is set by route handlers when the route includes `:shopId`; omitted otherwise.
- Failed requests (4xx, 5xx) are logged at `warn` / `error` level respectively.

---

## 8. OpenAPI Spec

Generated automatically from `@hono/zod-openapi` route schema definitions. The spec is:
- Committed to `openapi.yaml` at the backend root — the source of truth
- Served interactively at `GET /docs` (Swagger UI) in non-production environments
- The `health.test.ts` suite verifies `GET /docs` returns `200` to prevent spec-serve regressions

The spec cannot drift from the implementation because routes and schemas are co-located:
Zod schemas define both runtime validation and OpenAPI documentation from a single source.

---

## 9. Known Limitations (to document in README)

1. Notes are ephemeral — lost on process restart (in-memory; see ADR-0001).
2. Author identity is caller-supplied and unverified — any caller can impersonate any author (see ADR-0005).
3. No pagination on `GET /api/shops` — acceptable for the seed dataset (8 shops); see REQUIREMENTS.md improvement #2.
4. `X-Tenant-Id` is trusted without cryptographic verification (see ADR-0003 production evolution path).
5. Sort supports `-overage_charges` and `-name` only in this iteration; additional fields are additive changes (non-breaking).
6. `billingCycleStart` / `billingCycleEnd` are fixed from seed data — no system clock dependency (deterministic by design, per case description).
7. `overage_charges` is a JSON number; trailing zero display (e.g. `2.50`) is a frontend formatting concern.
