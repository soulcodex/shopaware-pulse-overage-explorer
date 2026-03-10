import { ShopId } from '../model/shop-id';
import { TenantId } from '../model/tenant-id';

/**
 * Validates that a date is valid
 */
function assertValidDate(date: Date, label: string): void {
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date for ${label}`);
  }
}

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
    // Validate orders is a non-negative integer
    if (!Number.isInteger(data.orders) || data.orders < 0) {
      throw new Error('orders must be a non-negative integer');
    }

    // Validate gmvEur is non-negative
    if (typeof data.gmvEur !== 'number' || data.gmvEur < 0) {
      throw new Error('gmvEur must be a non-negative number');
    }

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
  const timestamp = new Date(data.timestamp);
  assertValidDate(timestamp, 'timestamp');

  return new UsageEvent({
    id: data.id,
    tenantId: new TenantId(data.tenantId),
    shopId: new ShopId(data.shopId),
    timestamp,
    orders: data.orders,
    gmvEur: data.gmvEur,
  });
}
