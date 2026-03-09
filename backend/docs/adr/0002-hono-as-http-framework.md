# ADR-0002: Hono as HTTP Framework

**Status**: Accepted  
**Date**: 2026-03-09

## Context

The backend needs a lightweight HTTP framework that:
- Has first-class TypeScript support (typed request/response, no `any` leakage)
- Supports middleware composition (tenant guard, structured logging, error handling)
- Makes integration testing trivial without spinning up a real TCP port
- Supports OpenAPI/schema generation or integrates cleanly with Zod
- Is well-maintained and production-proven

Candidates evaluated:

| Framework | TS support | Test ergonomics | Zod/OpenAPI | Bundle size | Notes |
|---|---|---|---|---|---|
| **Hono** | Excellent (native) | `app.request()` — no port needed | `@hono/zod-openapi` | Tiny | Edge-compatible |
| Express | Poor (DefinitelyTyped) | `supertest` required | Manual | Large | Legacy patterns |
| Fastify | Good | `inject()` built-in | `fastify-swagger` | Medium | More config |
| NestJS | Excellent | Full e2e setup required | Built-in | Large | Overkill for PoC |

## Decision

**Use Hono.**

Rationale:

1. **Native TypeScript**: route parameters, query params, and request bodies are typed at the
   framework level — no casting required at controller boundaries.
2. **Test ergonomics**: `app.request('/api/shops', { headers: { 'X-Tenant-Id': 'tnt_eu_01' } })`
   returns a standard `Response` — no real server, no port allocation, deterministic in CI.
3. **`@hono/zod-openapi`**: route schemas are defined once in Zod; the OpenAPI spec is derived
   automatically. This satisfies the "OpenAPI spec that matches what you implemented" requirement
   by construction — the spec cannot drift from the implementation.
4. **Middleware model**: `app.use('*', tenantGuard)` composes cleanly. The tenant guard,
   request logger, and error handler are all standard Hono middleware.
5. **Tiny footprint**: appropriate for a PoC that must be easy to run locally.

## Consequences

- ✅ OpenAPI spec is generated from code — spec/implementation drift is structurally impossible.
- ✅ Integration tests use `app.request()` — no `supertest`, no port, fast and deterministic.
- ✅ Route-level Zod validation means all input validation happens at the HTTP boundary, keeping
  the domain layer free of validation concerns.
- ⚠️ `@hono/zod-openapi` has some ergonomic rough edges (verbose route definitions). Acceptable
  for the endpoint count in this PoC.
- ⚠️ Hono's routing is less battle-tested in large monoliths than Express/Fastify, but this is
  not a concern at PoC scale.
