import { ListShopsQuery } from './list-shops.query';
import { ShopSummaryDTO, toShopSummaryDTO } from './shop-summary.dto';
import { ShopRepository } from '../../../domain/shop/repository/shop.repository';
import { UsageEventRepository } from '../../../domain/shop/repository/usage-event.repository';
import { OverageSummary } from '../../../domain/shop/model/overage-summary';

/**
 * ListShopsHandler - handles the ListShopsQuery
 */
export class ListShopsHandler {
  constructor(
    private readonly shopRepository: ShopRepository,
    private readonly usageEventRepository: UsageEventRepository
  ) {}

  async handle(query: ListShopsQuery): Promise<ShopSummaryDTO[]> {
    // Get all shops for the tenant with filters
    const shops = await this.shopRepository.findAll(query.tenantId, query.filters);

    // Get all usage events for the tenant
    const allEvents = await this.usageEventRepository.findAllByTenantId(query.tenantId);

    // Create a map of shopId -> total orders, filtered by each shop's billing cycle
    const ordersByShop = new Map<string, number>();
    for (const shop of shops) {
      const shopEvents = allEvents.filter(
        (event) =>
          event.shopId.value === shop.id.value &&
          event.timestamp.getTime() >= shop.billingCycle.start.getTime() &&
          event.timestamp.getTime() <= shop.billingCycle.end.getTime()
      );
      const totalOrders = shopEvents.reduce((sum, event) => sum + event.orders, 0);
      ordersByShop.set(shop.id.value, totalOrders);
    }

    // Compute overage summary for each shop and map to DTO
    const results = shops.map((shop) => {
      const totalOrders = ordersByShop.get(shop.id.value) ?? 0;
      const overageSummary = new OverageSummary({ totalOrders, plan: shop.plan });
      return toShopSummaryDTO(shop, overageSummary);
    });

    // Apply sorting if specified
    if (query.filters.sort === '-overage_charges') {
      results.sort((a, b) => b.attributes.overage_charges - a.attributes.overage_charges);
    } else if (query.filters.sort === '-name') {
      results.sort((a, b) => b.attributes.name.localeCompare(a.attributes.name));
    }

    return results;
  }
}
