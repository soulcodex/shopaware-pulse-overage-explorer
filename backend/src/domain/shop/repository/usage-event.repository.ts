import { TenantId } from '../model/tenant-id';
import { ShopId } from '../model/shop-id';
import { UsageEvent } from '../usage-event/usage-event';

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

  /**
   * Find all usage events for a shop within a specific billing cycle window
   */
  findByShopIdWithinBillingCycle(
    tenantId: TenantId,
    shopId: ShopId,
    start: Date,
    end: Date
  ): Promise<UsageEvent[]>;

  /**
   * Find all usage events for a tenant within a specific billing cycle window
   */
  findAllByTenantIdWithinBillingCycle(
    tenantId: TenantId,
    start: Date,
    end: Date
  ): Promise<UsageEvent[]>;
}
