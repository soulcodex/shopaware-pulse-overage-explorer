import type { Context } from 'hono';
import { ZodError } from 'zod';
import { REQUEST_ID_CONTEXT_KEY } from '../types.js';

// ---------------------------------------------------------------------------
// Exception registry
//
// Maps domain exception names to their HTTP representation.
// The domain layer has zero knowledge of this mapping — all HTTP concerns
// live here in the ports layer. To register a new domain exception, add one
// entry using the exception's `name` property (set in its constructor).
//
// We key by `error.name` (a plain string) rather than by constructor identity.
// Constructor-based `instanceof` checks are unreliable across ESM module
// boundaries — the same class can be evaluated twice, producing two distinct
// constructor references that fail `instanceof` even for the same logical type.
// ---------------------------------------------------------------------------

interface HttpErrorMapping {
  readonly statusCode: number;
  readonly code: string;
  readonly title: string;
  readonly detail: (error: Error) => string;
}

const EXCEPTION_REGISTRY = new Map<string, HttpErrorMapping>([
  [
    'ShopNotFoundException',
    {
      statusCode: 404,
      code: 'SHOP_NOT_FOUND',
      title: 'Shop not found',
      detail: (e) => e.message,
    },
  ],
]);

function resolveMapping(error: unknown): HttpErrorMapping | undefined {
  if (!(error instanceof Error)) return undefined;
  return EXCEPTION_REGISTRY.get(error.name);
}

// ---------------------------------------------------------------------------
// Error handler
//
// Registered via app.onError() — receives (error, context) so it catches
// errors from all mounted subrouters, not just direct routes.
//
// Precedence:
//   1. Registered domain exceptions  → prescribed HTTP mapping from registry
//   2. ZodError                      → 400 VALIDATION_ERROR with field pointers
//   3. Everything else               → logged and returned as 500
// ---------------------------------------------------------------------------

/**
 * Global error handler for the Hono application.
 *
 * Must be registered with `app.onError(errorHandler)` — not as a `use('*')`
 * middleware — so it catches errors thrown inside mounted subrouters.
 * Route handlers must not catch and re-format errors themselves; they let
 * errors propagate here or throw a registered domain exception.
 */
export function errorHandler(error: unknown, c: Context): Response {
  const requestId = c.get(REQUEST_ID_CONTEXT_KEY) ?? 'unknown';

  const mapping = resolveMapping(error);
  if (mapping !== undefined) {
    return c.json(
      {
        errors: [
          {
            status: String(mapping.statusCode),
            code: mapping.code,
            title: mapping.title,
            detail: mapping.detail(error as Error),
          },
        ],
        meta: { request_id: requestId },
      },
      mapping.statusCode as 400 | 401 | 403 | 404 | 409 | 422 | 500,
      { Vary: 'X-API-Version' },
    );
  }

  if (error instanceof ZodError) {
    const errors = error.issues.map((issue) => ({
      status: '400',
      code: 'VALIDATION_ERROR',
      title: 'Validation failed',
      detail: issue.message,
      source: { pointer: '/' + issue.path.join('/') },
    }));

    return c.json(
      { errors, meta: { request_id: requestId } },
      400,
      { Vary: 'X-API-Version' },
    );
  }

  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  console.error(
    JSON.stringify({
      level: 'error',
      message: 'Unhandled error',
      timestamp: new Date().toISOString(),
      request_id: requestId,
      error: message,
      stack,
    }),
  );

  return c.json(
    {
      errors: [
        {
          status: '500',
          code: 'INTERNAL_SERVER_ERROR',
          title: 'Internal server error',
          detail: 'An unexpected error occurred',
        },
      ],
      meta: { request_id: requestId },
    },
    500,
    { Vary: 'X-API-Version' },
  );
}
