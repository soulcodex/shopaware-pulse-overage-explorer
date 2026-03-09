import type { Context, Next } from 'hono';
import { TENANT_ID_CONTEXT_KEY, REQUEST_ID_CONTEXT_KEY } from '../types.js';

// Re-export for convenience
export { TENANT_ID_CONTEXT_KEY } from '../types.js';

/**
 * Tenant guard middleware - validates X-Tenant-Id header
 */
export async function tenantGuard(c: Context, next: Next): Promise<Response | void> {
  const tenantIdHeader = c.req.header('X-Tenant-Id');

  // Missing header
  if (!tenantIdHeader) {
    return c.json(
      {
        errors: [
          {
            status: '400',
            code: 'MISSING_TENANT_ID',
            title: 'Missing required header',
            detail: "X-Tenant-Id header is required and must not be blank",
          },
        ],
        meta: { request_id: c.get(REQUEST_ID_CONTEXT_KEY) },
      },
      400,
      { 'Content-Type': 'application/json', 'Vary': 'X-API-Version' }
    );
  }

  // Blank header (empty or whitespace only)
  if (tenantIdHeader.trim().length === 0) {
    return c.json(
      {
        errors: [
          {
            status: '400',
            code: 'MISSING_TENANT_ID',
            title: 'Missing required header',
            detail: "X-Tenant-Id header is required and must not be blank",
          },
        ],
        meta: { request_id: c.get(REQUEST_ID_CONTEXT_KEY) },
      },
      400,
      { 'Content-Type': 'application/json', 'Vary': 'X-API-Version' }
    );
  }

  // Set tenant ID in context
  c.set(TENANT_ID_CONTEXT_KEY, tenantIdHeader);

  await next();
}
