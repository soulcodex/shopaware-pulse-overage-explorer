import type { Context, Next } from 'hono';
import { REQUEST_ID_CONTEXT_KEY } from '../types';

/**
 * Supported API versions
 */
const SUPPORTED_VERSIONS = [1];

/**
 * Version context key
 */
export const API_VERSION_CONTEXT_KEY = 'apiVersion';

/**
 * Version guard middleware - validates X-API-Version header
 */
export async function versionGuard(c: Context, next: Next): Promise<Response | void> {
  const versionHeader = c.req.header('X-API-Version');

  // No version header - default to v1
  if (!versionHeader) {
    c.set(API_VERSION_CONTEXT_KEY, 1);
    await next();
    return;
  }

  // Validate version header format - must be strictly numeric
  if (!/^\d+$/.test(versionHeader)) {
    return c.json(
      {
        errors: [
          {
            status: '400',
            code: 'UNSUPPORTED_API_VERSION',
            title: 'Unsupported API version',
            detail: `X-API-Version '${versionHeader}' is not supported. Supported versions: ${SUPPORTED_VERSIONS.join(', ')}`,
          },
        ],
        meta: { request_id: c.get(REQUEST_ID_CONTEXT_KEY) },
      },
      400,
      { 'Content-Type': 'application/json', 'Vary': 'X-API-Version' }
    );
  }

  // Parse version
  const version = parseInt(versionHeader, 10);

  // Invalid version format or unsupported version
  if (isNaN(version) || !SUPPORTED_VERSIONS.includes(version)) {
    return c.json(
      {
        errors: [
          {
            status: '400',
            code: 'UNSUPPORTED_API_VERSION',
            title: 'Unsupported API version',
            detail: `X-API-Version '${versionHeader}' is not supported. Supported versions: ${SUPPORTED_VERSIONS.join(', ')}`,
          },
        ],
        meta: { request_id: c.get(REQUEST_ID_CONTEXT_KEY) },
      },
      400,
      { 'Content-Type': 'application/json', 'Vary': 'X-API-Version' }
    );
  }

  // Valid version
  c.set(API_VERSION_CONTEXT_KEY, version);

  await next();
}
