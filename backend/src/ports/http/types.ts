import type { Context } from 'hono';

/**
 * Tenant context key
 */
export const TENANT_ID_CONTEXT_KEY = 'tenantId';

/**
 * Shop ID context key (set by route handlers)
 */
export const SHOP_ID_CONTEXT_KEY = 'shopId';

/**
 * Request ID context key
 */
export const REQUEST_ID_CONTEXT_KEY = 'requestId';

/**
 * App-specific context variables
 */
export interface AppBindings {
  Variables: {
    tenantId: string;
    shopId: string;
    requestId: string;
  };
}

/**
 * Type helper to get typed context
 */
export type AppContext = Context<AppBindings>;
