import { Hono } from 'hono';

/**
 * Health check response
 */
interface HealthResponse {
  status: 'ok' | 'unhealthy' | 'error';
  timestamp: string;
  version: string;
}

/**
 * Health router - no tenant guard, no versioning
 */
export function createHealthRouter(): Hono {
  const app = new Hono();

  app.get('/health', (c) => {
    const response: HealthResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };

    return c.json(response, 200);
  });

  return app;
}
