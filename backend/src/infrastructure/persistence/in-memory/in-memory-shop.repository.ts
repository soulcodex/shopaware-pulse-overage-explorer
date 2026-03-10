import { Shop, createShop, ShopStatus } from '../../../domain/shop/model/shop';
import { ShopId } from '../../../domain/shop/model/shop-id';
import { TenantId } from '../../../domain/shop/model/tenant-id';
import { ShopRepository, ShopFilters } from '../../../domain/shop/repository/shop.repository';
import type { Plan, PlanId } from '../../../domain/shop/model/plan';

/**
 * In-memory implementation of ShopRepository
 */
export class InMemoryShopRepository implements ShopRepository {
  private shops: Map<string, Shop> = new Map();

  /**
   * Clear all shops - useful for test isolation
   */
  clear(): void {
    this.shops.clear();
  }

  /**
   * Load shops from seed data
   */
  loadFromSeed(
    shopsData: Array<{
      id: string;
      tenantId: string;
      name: string;
      status: ShopStatus;
      planId: PlanId;
      billingCycleStart: string;
      billingCycleEnd: string;
      createdAt?: string;
      updatedAt?: string;
    }>,
    plans: Map<PlanId, Plan>
  ): void {
    for (const shopData of shopsData) {
      const shop = createShop(shopData, plans);
      this.shops.set(shop.id.value, shop);
    }
  }

  async findAll(tenantId: TenantId, filters: ShopFilters): Promise<Shop[]> {
    const tenantShops = Array.from(this.shops.values()).filter(
      (shop) => shop.tenantId.value === tenantId.value
    );

    let results = tenantShops;

    // Apply search filter (case-insensitive)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      results = results.filter((shop) => shop.name.toLowerCase().includes(searchLower));
    }

    // Apply plan filter
    if (filters.plan) {
      results = results.filter((shop) => shop.plan.id === filters.plan);
    }

    // Apply status filter
    if (filters.status) {
      results = results.filter((shop) => shop.status === filters.status);
    }

    // Sorting is handled in the query handler, not here
    return results;
  }

  async findById(tenantId: TenantId, shopId: ShopId): Promise<Shop | null> {
    const shop = this.shops.get(shopId.value);
    if (!shop) {
      return null;
    }
    // Must match tenant
    if (shop.tenantId.value !== tenantId.value) {
      return null;
    }
    return shop;
  }

  async save(shop: Shop): Promise<void> {
    this.shops.set(shop.id.value, shop);
  }
}
