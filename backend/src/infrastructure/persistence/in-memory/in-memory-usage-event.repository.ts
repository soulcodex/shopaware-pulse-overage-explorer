import { UsageEvent, createUsageEvent } from '../../../domain/shop/usage-event/usage-event.js';
import { ShopId } from '../../../domain/shop/model/shop-id.js';
import { TenantId } from '../../../domain/shop/model/tenant-id.js';
import { UsageEventRepository } from '../../../domain/shop/repository/usage-event.repository.js';

/**
 * In-memory implementation of UsageEventRepository
 */
export class InMemoryUsageEventRepository implements UsageEventRepository {
  private events: UsageEvent[] = [];

  /**
   * Clear all events - useful for test isolation
   */
  clear(): void {
    this.events = [];
  }

  /**
   * Load events from seed data
   */
  loadFromSeed(eventsData: Array<{
    id: string;
    tenantId: string;
    shopId: string;
    timestamp: string;
    orders: number;
    gmvEur: number;
  }>): void {
    this.events = eventsData.map(createUsageEvent);
  }

  async findByShopId(tenantId: TenantId, shopId: ShopId): Promise<UsageEvent[]> {
    return this.events.filter(
      (event) => event.tenantId.value === tenantId.value && event.shopId.value === shopId.value
    );
  }

  async findAllByTenantId(tenantId: TenantId): Promise<UsageEvent[]> {
    return this.events.filter((event) => event.tenantId.value === tenantId.value);
  }
}
