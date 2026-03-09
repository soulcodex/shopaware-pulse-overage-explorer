import { TenantId } from '../model/tenant-id.js';
import { ShopId } from '../model/shop-id.js';
import { Shop } from '../model/shop.js';

/**
 * Shop status filter type
 */
export type ShopStatusFilter = 'active' | 'past_due' | 'cancelled';

/**
 * Plan filter type
 */
export type PlanFilter = 'starter' | 'grow' | 'scale';

/**
 * Sort options for listing shops
 */
export type ShopSortOption = '-overage_charges' | '-name';

/**
 * Filters for listing shops
 */
export interface ShopFilters {
  search?: string;
  plan?: PlanFilter;
  status?: ShopStatusFilter;
  sort?: ShopSortOption;
}

/**
 * ShopRepository port - defines the contract for shop persistence
 */
export interface ShopRepository {
  /**
   * Find all shops for a tenant with optional filters
   */
  findAll(tenantId: TenantId, filters: ShopFilters): Promise<Shop[]>;

  /**
   * Find a shop by ID within a tenant scope
   */
  findById(tenantId: TenantId, shopId: ShopId): Promise<Shop | null>;

  /**
   * Save a shop (for adding notes)
   */
  save(shop: Shop): Promise<void>;
}
