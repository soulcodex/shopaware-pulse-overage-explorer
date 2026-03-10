# ADR-0004: API Versioning via Request Header

**Status**: Accepted  
**Date**: 2026-03-09

## Context

The API needs a versioning strategy from day one. Two main approaches were considered:

### Option A — URL path versioning (`/api/v1/shops`)

The version is embedded in the URL. This is the approach recommended by the project's own
`api-design.md` fragment:

> *"Version in the URL path (not headers) — easier to test, log, and route."*

Advantages:
- URLs are self-describing and version-visible in logs, CDN access logs, and browser history.
- No extra headers needed to `curl` or open in a browser.
- HTTP caches work correctly without `Vary` configuration.

Disadvantages:
- Changing the version means changing every URL — significant client-side refactor.
- The URL encodes a server implementation concern (version) rather than a resource identity.

### Option B — Header versioning (`X-API-Version: 1`) (chosen)

The version is expressed as a request header. The URL remains `/api/shops` regardless of version.

Advantages:
- URL stability: clients do not need to update URLs when versions change.
- Resources are identified by URL; the representation version is a separate negotiation concern
  (conceptually closer to `Accept` header content negotiation).
- Adding a new version is additive — old clients keep working with the same URLs, new clients
  opt into the new version via header.

Disadvantages:
- Not visible in browser address bar or basic `curl` without explicit header.
- Requires `Vary: X-API-Version` on all responses to prevent HTTP caches from serving wrong
  versions to different clients.
- Slightly more complex routing middleware.

## Decision

**Use `X-API-Version` header versioning.**

This departs from the `api-design.md` recommendation of URL path versioning. The rationale:

1. **URL stability matters for internal tooling**: internal consumers (frontend, support tools)
   benefit from stable URLs that don't require coordinated version bumps across services.
2. **Default to v1**: when `X-API-Version` is absent, the server treats the request as `v1`.
   This means existing clients that don't set the header continue to work — there is no breaking
   change from adding versioning.
3. **Explicit rejection of unknown versions**: if `X-API-Version` is present but not `"1"`,
   the server returns `400 Bad Request` with `{ error: { code: "UNSUPPORTED_API_VERSION" } }`.

## Implementation

A `versionGuard` middleware runs before `tenantGuard` on all `/api/*` routes. The runtime order is:

1. `requestLogger` — logs request/response
2. `versionGuard` — validates `X-API-Version` header
3. `addVaryHeader` — adds `Vary: X-API-Version` to responses
4. `tenantGuard` — validates `X-Tenant-Id` header

```
X-API-Version absent  → treat as v1 (pass through)
X-API-Version: 1      → pass through
X-API-Version: 2      → 400 Bad Request (UNSUPPORTED_API_VERSION)
```

Version guard runs before tenant guard because it is a cheaper check with no dependency on header state, and failing early on unsupported versions avoids unnecessary tenant validation work. All responses include `Vary: X-API-Version` to prevent cache collisions.

## Versioning rules going forward

A **breaking change** requires a new version:
- Removing or renaming a response field
- Changing a field's type
- Removing an endpoint
- Changing an HTTP status code's semantics

An **additive change** does not require a new version:
- Adding a new optional response field
- Adding a new endpoint
- Adding a new optional query parameter

## How to roll out a breaking change safely

1. Implement `v2` behaviour behind `X-API-Version: 2` while keeping `v1` unchanged.
2. Communicate the deprecation timeline to all consumers of `v1`.
3. Add a `Deprecation` response header to `v1` responses once `v2` is stable.
4. Monitor usage of `v1` (structured logs include the version); sunset when traffic drops to zero.
5. Remove `v1` handler after the sunset date.

## Consequences

- ✅ URL stability — clients do not update URLs across versions.
- ✅ Default-to-v1 means zero friction for clients that don't set the header.
- ✅ Unknown versions fail fast with a clear error.
- ⚠️ Responses must include `Vary: X-API-Version` — not set by default in Hono; must be added
  in middleware.
- ⚠️ Departing from the `api-design.md` URL versioning recommendation. This trade-off is
  explicit and documented here; the fragment's guidance remains valid for other contexts.
