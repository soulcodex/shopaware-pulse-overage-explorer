import { TenantId } from '../../../domain/shop/model/tenant-id';
import { ShopFilters } from '../../../domain/shop/repository/shop.repository';

/**
 * ListShopsQuery - query to list shops
 */
export class ListShopsQuery {
  readonly tenantId: TenantId;
  readonly filters: ShopFilters;

  constructor(data: { tenantId: TenantId; filters?: ShopFilters }) {
    this.tenantId = data.tenantId;
    this.filters = data.filters ?? {};
  }
}
