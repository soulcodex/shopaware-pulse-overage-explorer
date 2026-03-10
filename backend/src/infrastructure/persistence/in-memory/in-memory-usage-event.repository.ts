import { UsageEvent, createUsageEvent } from '../../../domain/shop/usage-event/usage-event';
import { ShopId } from '../../../domain/shop/model/shop-id';
import { TenantId } from '../../../domain/shop/model/tenant-id';
import { UsageEventRepository } from '../../../domain/shop/repository/usage-event.repository';

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

  async findByShopIdWithinBillingCycle(
    tenantId: TenantId,
    shopId: ShopId,
    start: Date,
    end: Date
  ): Promise<UsageEvent[]> {
    return this.events.filter(
      (event) =>
        event.tenantId.value === tenantId.value &&
        event.shopId.value === shopId.value &&
        event.timestamp.getTime() >= start.getTime() &&
        event.timestamp.getTime() <= end.getTime()
    );
  }

  async findAllByTenantIdWithinBillingCycle(
    tenantId: TenantId,
    start: Date,
    end: Date
  ): Promise<UsageEvent[]> {
    return this.events.filter(
      (event) =>
        event.tenantId.value === tenantId.value &&
        event.timestamp.getTime() >= start.getTime() &&
        event.timestamp.getTime() <= end.getTime()
    );
  }
}
