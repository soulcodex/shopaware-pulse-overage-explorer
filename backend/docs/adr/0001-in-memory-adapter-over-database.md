# ADR-0001: In-Memory Adapter Over a Real Database

**Status**: Accepted  
**Date**: 2026-03-09

## Context

The project is a time-boxed PoC (case study, 2h30m) for a tool called *Pulse Overage Explorer*.
The dataset is deliberately small: 8 shops, 17 usage events, 0 initial notes, 3 plans — all
provided as a static `seed-data.json` file.

Two storage strategies were evaluated:

### Option A — In-memory adapter (chosen)

Data is loaded from `seed-data.json` once at startup into plain TypeScript `Map` structures.
Repositories are implemented against a `ShopRepository` / `UsageEventRepository` port with
an `InMemoryShopRepository` / `InMemoryUsageEventRepository` adapter.

### Option B — PostgreSQL with a materialized view

Schema migrations, a `docker-compose.yml`, connection pooling, and a materialized view
`shop_overage_summary` would be created. The view pre-computes overage per shop per billing
cycle, making `GET /api/shops` a single indexed query.

## Decision

**Use Option A (in-memory adapter) for this iteration.**

Rationale:

1. **Setup cost vs. benefit ratio**: The overage formula
   (`max(0, Σorders − includedOrders) × overageFee`) applied over 17 events costs microseconds
   in memory. A materialized view solves a problem that does not yet exist at this scale.
2. **Run-locally requirement**: The case description explicitly requires "make it easy to run
   locally." PostgreSQL introduces a mandatory Docker dependency and migration step.
3. **Port/adapter isolation is already present**: Because both repository interfaces are pure
   TypeScript ports with no leaking infrastructure types, swapping to a PostgreSQL adapter is
   a single file replacement + DI re-wiring — no domain or application code changes.
4. **The case description explicitly permits it**: *"Load seed data from a local JSON file
   (in-memory is fine)."*

### Known limitation

Notes added during runtime are lost on process restart. This is documented in the README and
is acceptable for a PoC with no persistence requirement.

## Production evolution path (how Option B would be implemented)

When usage volumes or operational requirements demand a real database:

1. **Schema**: Three tables — `shops`, `usage_events`, `support_notes`. Plans are config, not
   rows (they change infrequently and are referenced by `planId` string FK against a `plans`
   table or a config file).
2. **Materialized view** `shop_overage_summary(shop_id, tenant_id, total_orders,
   included_orders, overage_orders, overage_eur, refreshed_at)` — refreshed on a schedule or
   triggered by `usage_events` inserts via a Postgres `NOTIFY` / application-level hook.
3. **Async ingestion**: Usage events arrive via SQS/Kafka → a consumer writes to
   `usage_events` → triggers summary refresh. The HTTP read path queries the materialized view
   only (no aggregation at request time).
4. **Adapter swap**: Replace `InMemoryShopRepository` with `PostgresShopRepository` that
   implements the same `ShopRepository` port. The DI container wires the new adapter. Zero
   changes to domain or application layers.

## Consequences

- ✅ Zero external dependencies — `pnpm install && pnpm dev` is the full setup.
- ✅ Port/adapter pattern is demonstrated cleanly; the swap path to PostgreSQL is documented.
- ✅ Overage calculation stays in the domain layer (value object), not in SQL.
- ⚠️ Notes are ephemeral — lost on restart.
- ⚠️ No query-level filtering or sorting — all filtering/sorting is done in-process on the
  loaded dataset. Acceptable for 8 shops; would not scale to 10,000+.
