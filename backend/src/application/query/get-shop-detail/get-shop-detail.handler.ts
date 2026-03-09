import { GetShopDetailQuery } from './get-shop-detail.query';
import { ShopDetailDTO, toShopDetailDTO } from './shop-detail.dto';
import { ShopRepository } from '../../../domain/shop/repository/shop.repository';
import { UsageEventRepository } from '../../../domain/shop/repository/usage-event.repository';
import { OverageSummary } from '../../../domain/shop/model/overage-summary';
import { ShopNotFoundException } from '../../../domain/shop/exception/shop-not-found.exception';

/**
 * GetShopDetailHandler - handles the GetShopDetailQuery
 */
export class GetShopDetailHandler {
  constructor(
    private readonly shopRepository: ShopRepository,
    private readonly usageEventRepository: UsageEventRepository
  ) {}

  async handle(query: GetShopDetailQuery): Promise<ShopDetailDTO> {
    // Find the shop
    const shop = await this.shopRepository.findById(query.tenantId, query.shopId);

    if (!shop) {
      throw new ShopNotFoundException(query.shopId);
    }

    // Get usage events for this shop
    const usageEvents = await this.usageEventRepository.findByShopId(query.tenantId, query.shopId);

    // Calculate total orders
    const totalOrders = usageEvents.reduce((sum, event) => sum + event.orders, 0);

    // Compute overage summary
    const overageSummary = new OverageSummary({ totalOrders, plan: shop.plan });

    return toShopDetailDTO(shop, overageSummary, usageEvents);
  }
}
