import type { Context, Next } from 'hono';
import { REQUEST_ID_CONTEXT_KEY } from '../types.js';

/**
 * Error handler middleware - maps domain exceptions to HTTP responses
 */
export async function errorHandler(c: Context, next: Next): Promise<Response | void> {
  try {
    await next();
  } catch (error) {
    const requestId = c.get(REQUEST_ID_CONTEXT_KEY) ?? 'unknown';

    // Handle ShopNotFoundException - check by message since name might get transformed
    if (error instanceof Error && error.message.includes('not found') && error.message.includes('Shop with id')) {
      // Extract the shop ID from the message
      const match = error.message.match(/Shop with id '([^']+)'/);
      const shopId = match ? match[1] : 'unknown';
      
      return c.json(
        {
          errors: [
            {
              status: '404',
              code: 'SHOP_NOT_FOUND',
              title: 'Shop not found',
              detail: `No shop with id '${shopId}' was found`,
            },
          ],
          meta: { request_id: requestId },
        },
        404,
        { 'Content-Type': 'application/json', 'Vary': 'X-API-Version' }
      );
    }

    // Handle validation errors from Zod - these have 'issues' array
    // Hono/zod-openapi wraps Zod errors with { success: false, error: { issues, name } }
    if (error && typeof error === 'object') {
      // Check for direct Zod error (error.issues)
      let issues: Array<{ path: string[]; message: string }> | undefined;
      
      if ('issues' in error) {
        issues = (error as { issues?: Array<{ path: string[]; message: string }> }).issues;
      } else if ('error' in error && error.error && typeof error.error === 'object' && 'issues' in error.error) {
        // Check for Hono-wrapped Zod error (error.error.issues)
        issues = (error.error as { issues?: Array<{ path: string[]; message: string }> }).issues;
      }
      
      if (issues && issues.length > 0) {
        const firstIssue = issues[0];
        if (!firstIssue) {
          return c.json(
            {
              errors: [
                {
                  status: '400',
                  code: 'VALIDATION_ERROR',
                  title: 'Validation failed',
                  detail: 'Unknown validation error',
                },
              ],
              meta: { request_id: requestId },
            },
            400,
            { 'Content-Type': 'application/json', 'Vary': 'X-API-Version' }
          );
        }
        const pointer = '/data/' + firstIssue.path.join('/attributes/');
        return c.json(
          {
            errors: [
              {
                status: '400',
                code: 'VALIDATION_ERROR',
                title: 'Validation failed',
                detail: firstIssue.message,
                source: { pointer },
              },
            ],
            meta: { request_id: requestId },
          },
          400,
          { 'Content-Type': 'application/json', 'Vary': 'X-API-Version' }
        );
      }
    }

    // Handle generic errors - log with level based on type
    if (error instanceof Error) {
      console.error(JSON.stringify({
        level: 'error',
        message: 'Unhandled error',
        timestamp: new Date().toISOString(),
        request_id: requestId,
        error: error.message,
        stack: error.stack,
      }));
    } else {
      console.error(JSON.stringify({
        level: 'error',
        message: 'Unhandled error',
        timestamp: new Date().toISOString(),
        request_id: requestId,
        error: String(error),
      }));
    }

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
      { 'Content-Type': 'application/json', 'Vary': 'X-API-Version' }
    );
  }
}
