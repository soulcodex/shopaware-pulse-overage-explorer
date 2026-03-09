import { Shop, ShopStatus } from '../../../domain/shop/model/shop.js';
import { OverageSummary } from '../../../domain/shop/model/overage-summary.js';
import { PlanId } from '../../../domain/shop/model/plan.js';

/**
 * Shop summary DTO for list response
 */
export interface ShopSummaryDTO {
  id: string;
  type: 'shop';
  attributes: {
    name: string;
    plan: PlanId;
    status: ShopStatus;
    usage: number;
    included_usage: number;
    overage_charges: number;
    created_at: string;
    updated_at: string;
  };
}

/**
 * Maps a Shop to ShopSummaryDTO
 */
export function toShopSummaryDTO(shop: Shop, overageSummary: OverageSummary): ShopSummaryDTO {
  return {
    id: shop.id.value,
    type: 'shop',
    attributes: {
      name: shop.name,
      plan: shop.plan.id,
      status: shop.status,
      usage: overageSummary.totalOrders,
      included_usage: overageSummary.includedOrders,
      overage_charges: overageSummary.overageCharges,
      created_at: shop.createdAt.toISOString(),
      updated_at: shop.updatedAt.toISOString(),
    },
  };
}
