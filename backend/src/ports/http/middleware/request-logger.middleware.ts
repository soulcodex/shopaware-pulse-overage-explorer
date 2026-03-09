import type { Context, Next } from 'hono';
import { REQUEST_ID_CONTEXT_KEY, SHOP_ID_CONTEXT_KEY, TENANT_ID_CONTEXT_KEY } from '../types';

/**
 * Request logger middleware - generates request ID and logs request completion
 */
export async function requestLogger(c: Context, next: Next): Promise<void> {
  // Generate UUID v4 request ID
  const requestId = crypto.randomUUID();
  c.set(REQUEST_ID_CONTEXT_KEY, requestId);

  // Start timer
  const start = Date.now();

  await next();

  // Calculate duration
  const durationMs = Date.now() - start;

  // Get context values
  const tenantId = c.get(TENANT_ID_CONTEXT_KEY);
  const shopId = c.get(SHOP_ID_CONTEXT_KEY);
  const method = c.req.method;
  const path = c.req.path;
  const status = c.res.status;

  // Log structured JSON
  const logEntry = {
    level: status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info',
    message: 'request completed',
    timestamp: new Date().toISOString(),
    request_id: requestId,
    tenant_id: tenantId ?? undefined,
    shop_id: shopId ?? undefined,
    method,
    path,
    status,
    duration_ms: durationMs,
  };

  console.log(JSON.stringify(logEntry));
}
