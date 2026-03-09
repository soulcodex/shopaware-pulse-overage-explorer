import { TenantId } from '../model/tenant-id.js';
import { ShopId } from '../model/shop-id.js';
import { UsageEvent } from '../usage-event/usage-event.js';

/**
 * UsageEventRepository port - read-only query interface
 */
export interface UsageEventRepository {
  /**
   * Find all usage events for a shop within a tenant
   */
  findByShopId(tenantId: TenantId, shopId: ShopId): Promise<UsageEvent[]>;

  /**
   * Find all usage events for a tenant
   */
  findAllByTenantId(tenantId: TenantId): Promise<UsageEvent[]>;
}
