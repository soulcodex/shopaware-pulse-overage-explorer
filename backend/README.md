# Shopaware Pulse Overage Explorer — Backend

HTTP API that calculates usage overage charges per billing cycle for multi-tenant shops,
and allows internal support teams to annotate shops with notes.

## Requirements

- Node.js 20+
- pnpm 9+
- [`just`](https://just.systems) (optional — all recipes delegate to `pnpm`)

## Getting Started

```bash
pnpm install
just dev        # or: pnpm dev
```

The server starts on `http://localhost:3000`.  
Interactive API docs are available at `http://localhost:3000/docs`.

## Commands

| Recipe       | Description                                  |
| ------------ | -------------------------------------------- |
| `just dev`   | Start the development server with hot-reload |
| `just build` | Compile TypeScript to `dist/`                |
| `just test`  | Run the test suite once (CI-safe)            |
| `just lint`  | Run ESLint across the project                |
| `just check` | Lint + test — use before pushing             |

## Running Tests

```bash
just test       # or: pnpm test --run
```

All tests are acceptance-level HTTP tests. They create a fresh in-memory app instance per
file and make requests via Hono's `app.request()` — no TCP port or external process needed.

## Architecture

The service follows hexagonal architecture with DDD and CQRS across four strict layers:
`domain` → `application` → `infrastructure` → `ports`. The domain layer has zero framework
dependencies; all external concerns (HTTP, persistence) are adapters behind port interfaces.
Persistence is in-memory and seeded from `seed-data.json` at startup, with a documented
migration path to PostgreSQL (see ADR-0001).

Key architecture decisions:

| ADR                                                           | Decision                                                                   |
| ------------------------------------------------------------- | -------------------------------------------------------------------------- |
| [ADR-0001](docs/adr/0001-in-memory-adapter-over-database.md)  | In-memory persistence over a real database                                 |
| [ADR-0002](docs/adr/0002-hono-as-http-framework.md)           | Hono as the HTTP framework                                                 |
| [ADR-0003](docs/adr/0003-tenant-isolation-strategy.md)        | Multi-tenant isolation via `X-Tenant-Id` header + repository-level scoping |
| [ADR-0004](docs/adr/0004-api-versioning-via-header.md)        | API versioning via `X-API-Version` header (default: `v1`)                  |
| [ADR-0005](docs/adr/0005-author-identity-in-support-notes.md) | Caller-supplied author identity in support notes                           |
