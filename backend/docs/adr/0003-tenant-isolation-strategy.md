# ADR-0003: Tenant Isolation Strategy

**Status**: Accepted  
**Date**: 2026-03-09

## Context

The system is multi-tenant: multiple tenants (`tnt_eu_01`, `tnt_us_01`, …) share the same
running process. The case description mandates:

- Requests without `X-Tenant-Id` must fail.
- Cross-tenant data access must not be possible.
- Auth is handled upstream; the service only receives `X-Tenant-Id`.

Three places where isolation could be enforced were considered:

1. **HTTP middleware only** — reject requests missing the header before they reach any handler.
2. **Repository layer only** — every query is scoped by `tenantId`; no middleware guard.
3. **Both layers** (chosen) — middleware rejects missing headers; repositories enforce tenant
   scope structurally.

## Decision

**Enforce isolation at two independent layers.**

### Layer 1 — HTTP Middleware (fast-fail)

A `tenantGuard` middleware runs on every route under `/api/*`. It:
1. Reads `X-Tenant-Id` from request headers.
2. If absent or empty → returns `400 Bad Request` immediately with a structured error body.
3. If present → attaches `tenantId` to Hono's context (`c.set('tenantId', value)`).

No handler ever reads `X-Tenant-Id` directly from headers. They consume it from the typed
context variable set by the middleware.

### Layer 2 — Repository-level tenant scoping

Every method on `ShopRepository` and `UsageEventRepository` accepts `tenantId` as a mandatory
parameter. The in-memory implementation filters by `tenantId` before returning any data.

```typescript
// Port — tenant scope is structurally required
interface ShopRepository {
  findAll(tenantId: TenantId, filters: ShopFilters): Promise<Shop[]>
  findById(tenantId: TenantId, shopId: ShopId): Promise<Shop | null>
}
```

A shop belonging to `tnt_eu_01` **cannot** be returned by a query scoped to `tnt_us_01` —
not through a bug in the middleware, not through a misconfigured route. The data layer enforces
this independently.

When `findById` returns `null` (either shop not found, or shop exists but belongs to another
tenant), the query handler returns a `404 Not Found` — deliberately not `403 Forbidden`. This
prevents tenant enumeration: a caller cannot distinguish "this shop doesn't exist" from "this
shop exists but belongs to someone else."

## Production evolution path

This PoC accepts `X-Tenant-Id` at face value (no cryptographic verification). In production:

1. **JWT-based tenant claim**: the upstream API gateway issues a signed JWT containing
   `tenantId` as a claim. The service verifies the JWT signature (public key from Auth0/Okta
   JWKS endpoint) and extracts `tenantId` — the header is no longer trusted as a plain string.
2. **Row-Level Security (PostgreSQL)**: if using PostgreSQL, `SET app.current_tenant = $1` at
   the start of each transaction + RLS policies on all tables ensure that even a SQL injection
   cannot read cross-tenant data.
3. **RBAC at the gateway**: the API gateway enforces which tenants a caller may access before
   the request reaches this service.

## Consequences

- ✅ Missing header is caught immediately — no wasted computation.
- ✅ Cross-tenant access is impossible at the data layer regardless of middleware state.
- ✅ `404` on cross-tenant access prevents tenant enumeration attacks.
- ✅ `tenantId` flows from middleware → context → handler → repository as a typed value object,
  never as a raw string after the boundary.
- ⚠️ `X-Tenant-Id` is trusted without cryptographic verification in this PoC. Documented as a
  known limitation; see production evolution path above.
- ⚠️ No rate limiting per tenant in this PoC. In production, this would be enforced at the
  gateway layer.
