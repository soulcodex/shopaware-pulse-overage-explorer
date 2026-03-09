import { ShopId } from '../model/shop-id.js';
import { TenantId } from '../model/tenant-id.js';

/**
 * UsageEvent - read model entity for usage tracking
 * NOT an aggregate - used for read-only queries
 */
export class UsageEvent {
  readonly id: string;
  readonly tenantId: TenantId;
  readonly shopId: ShopId;
  readonly timestamp: Date;
  readonly orders: number;
  readonly gmvEur: number;

  constructor(data: {
    id: string;
    tenantId: TenantId;
    shopId: ShopId;
    timestamp: Date;
    orders: number;
    gmvEur: number;
  }) {
    this.id = data.id;
    this.tenantId = data.tenantId;
    this.shopId = data.shopId;
    this.timestamp = data.timestamp;
    this.orders = data.orders;
    this.gmvEur = data.gmvEur;
  }
}

/**
 * Creates a UsageEvent from raw seed data
 */
export function createUsageEvent(data: {
  id: string;
  tenantId: string;
  shopId: string;
  timestamp: string;
  orders: number;
  gmvEur: number;
}): UsageEvent {
  return new UsageEvent({
    id: data.id,
    tenantId: new TenantId(data.tenantId),
    shopId: new ShopId(data.shopId),
    timestamp: new Date(data.timestamp),
    orders: data.orders,
    gmvEur: data.gmvEur,
  });
}
