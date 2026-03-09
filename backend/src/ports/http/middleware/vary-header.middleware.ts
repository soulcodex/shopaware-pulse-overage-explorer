import type { Context, Next } from 'hono';

/**
 * Vary header middleware - adds Vary: X-API-Version to all responses
 */
export async function addVaryHeader(c: Context, next: Next): Promise<void> {
  await next();
  
  // Add Vary header to the response
  const currentVary = c.res.headers.get('Vary');
  if (currentVary) {
    if (!currentVary.includes('X-API-Version')) {
      c.res.headers.set('Vary', currentVary + ', X-API-Version');
    }
  } else {
    c.res.headers.set('Vary', 'X-API-Version');
  }
}
