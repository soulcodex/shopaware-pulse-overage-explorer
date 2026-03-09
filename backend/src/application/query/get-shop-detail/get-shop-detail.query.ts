import { TenantId } from '../../../domain/shop/model/tenant-id';
import { ShopId } from '../../../domain/shop/model/shop-id';

/**
 * GetShopDetailQuery - query to get shop details
 */
export class GetShopDetailQuery {
  readonly tenantId: TenantId;
  readonly shopId: ShopId;

  constructor(data: { tenantId: TenantId; shopId: ShopId }) {
    this.tenantId = data.tenantId;
    this.shopId = data.shopId;
  }
}
