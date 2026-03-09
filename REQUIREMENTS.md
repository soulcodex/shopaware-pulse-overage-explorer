# Shopaware Pulse Overage Explorer Requirements

## Functional Requirements

- Expose a small HTTP API that the frontend can call.
- Implement multi-tenant isolation via request header: `X-Tenant-Id`.
- Requests without it must fail.
- Cross-tenant access must not be possible.
- Load seed data from a local JSON file (in-memory is fine).
- Calculate usage totals + overage charges for the billing cycle.
- Provide a way to create and list internal support notes per shop.
- Provide an OpenAPI spec (`openapi.yaml` / `openapi.json`) that matches what you implemented.
- Provide a simple health endpoint.

## Non-Functional Requirements

- All API responses follow [JSON:API](https://jsonapi.org) structure (see contracts below).
- All request bodies follow JSON:API structure where applicable.
- Author identity in support notes is caller-supplied for this iteration (see ADR-0005).
- `overage_charges` is a JSON number rounded to 2 decimal places (e.g. `2.50` stored as `2.5` is acceptable; display formatting is a frontend concern).

## API Contracts

> **Versioning**: All `/api/*` endpoints accept an optional `X-API-Version: 1` header.
> When absent the server defaults to version 1. Unsupported versions return `400`.
> See ADR-0004 for the full versioning policy.

### GET /api/shops

#### Request

- Method: `GET`
- URL: `/api/shops`
- Query Parameters:
  - `search` — case-insensitive substring match on shop name (optional)
  - `plan` — exact match: `starter | grow | scale` (optional)
  - `status` — exact match: `active | past_due | cancelled` (optional)
  - `sort` — sort field with direction prefix: `-overage_charges | -name` (optional, minus = descending)
- Headers:
  - `X-Tenant-Id` (required) — tenant scope; missing or blank value returns `400`
  - `X-API-Version` (optional) — defaults to `1`

#### Response

- **200 OK**

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
  "meta": {
    "request_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

- **400 Bad Request** — missing or blank `X-Tenant-Id`

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
  "meta": {
    "request_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

- **400 Bad Request** — unsupported `X-API-Version`

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
  "meta": {
    "request_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

---

### GET /api/shops/{shopId}

#### Request

- Method: `GET`
- URL: `/api/shops/{shopId}`
- Headers:
  - `X-Tenant-Id` (required)
  - `X-API-Version` (optional, defaults to `1`)

#### Response

- **200 OK**

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
          "author": {
            "id": "usr_01",
            "name": "Alice"
          },
          "content": "Contacted merchant about upcoming renewal.",
          "created_at": "2026-03-09T12:00:00Z"
        }
      ],
      "created_at": "2026-03-01T00:00:00Z",
      "updated_at": "2026-03-01T00:00:00Z"
    }
  },
  "meta": {
    "request_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

- **404 Not Found** — shop does not exist or belongs to a different tenant (cross-tenant access
  is masked as 404 to prevent tenant enumeration; see ADR-0003)

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
  "meta": {
    "request_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

---

### POST /api/shops/{shopId}/notes

#### Request

- Method: `POST`
- URL: `/api/shops/{shopId}/notes`
- Headers:
  - `Content-Type: application/json`
  - `X-Tenant-Id` (required)
  - `X-API-Version` (optional, defaults to `1`)
- Body (JSON:API document):

```json
{
  "data": {
    "type": "note",
    "attributes": {
      "author": {
        "id": "usr_01",
        "name": "Alice"
      },
      "content": "Contacted merchant about upcoming renewal."
    }
  }
}
```

> **Note**: `author.id` and `author.name` are caller-supplied and not cryptographically verified
> in this iteration. See ADR-0005 and the Improvements section for the production evolution path.

#### Response

- **204 No Content** — note created successfully (no body)
- **404 Not Found** — shop not found or cross-tenant access
- **400 Bad Request** — validation error (missing fields, blank content, missing author)

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
  "meta": {
    "request_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

---

### GET /health

No tenant guard. No versioning header required.

#### Request

- Method: `GET`
- URL: `/health`
- Headers: none required
- Query Parameters: none
- Body: none

#### Response

- **200 OK**

```json
{
  "status": "ok",
  "timestamp": "2026-03-09T12:00:00Z",
  "version": "1.0.0"
}
```

> The health endpoint intentionally does not use the JSON:API envelope — it is a simple
> operational probe consumed by infrastructure (Kubernetes, load balancers), not by API clients.

- **503 Service Unavailable** — application is unhealthy

```json
{
  "status": "unhealthy",
  "timestamp": "2026-03-09T12:00:00Z",
  "version": "1.0.0"
}
```

- **500 Internal Server Error** — unexpected error during health check

```json
{
  "status": "error",
  "timestamp": "2026-03-09T12:00:00Z",
  "version": "1.0.0"
}
```

---

## Improvements

1. **Author identity via JWT**: fetch user identity from a JWT token issued by a single source
   of truth (Auth0, Okta, etc.) instead of accepting caller-supplied `author` in the request
   body. See ADR-0005.
2. **Pagination**: implement cursor-based pagination for `GET /api/shops` to handle large
   datasets efficiently. The JSON:API `meta` envelope is already structured to support this
   (add `next_cursor`, `has_more`).
3. **Dedicated notes endpoint**: `GET /api/shops/{shopId}/notes` as a separate paginated
   endpoint. The current approach embeds notes in the shop detail response, which does not
   scale for shops with many notes.
4. **Sort extensibility**: the current `sort` parameter supports `-overage_charges` and `-name`.
   Additional sort fields (`-usage`, `-status`) can be added without a breaking change.
