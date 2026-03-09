import { Shop } from '../../../domain/shop/model/shop.js';
import { OverageSummary } from '../../../domain/shop/model/overage-summary.js';
import { UsageEvent } from '../../../domain/shop/usage-event/usage-event.js';

/**
 * Usage event DTO
 */
export interface UsageEventDTO {
  id: string;
  timestamp: string;
  orders: number;
  gmv_eur: number;
}

/**
 * Support note DTO
 */
export interface SupportNoteDTO {
  id: string;
  author: {
    id: string;
    name: string;
  };
  content: string;
  created_at: string;
}

/**
 * Shop detail DTO for single resource response
 */
export interface ShopDetailDTO {
  id: string;
  type: 'shop';
  attributes: {
    name: string;
    plan: string;
    status: string;
    billing_cycle_start: string;
    billing_cycle_end: string;
    summary: {
      total_orders: number;
      included_orders: number;
      overage_orders: number;
      overage_charges: number;
    };
    usage: UsageEventDTO[];
    notes: SupportNoteDTO[];
    created_at: string;
    updated_at: string;
  };
}

/**
 * Maps a Shop to ShopDetailDTO
 */
export function toShopDetailDTO(
  shop: Shop,
  overageSummary: OverageSummary,
  usageEvents: UsageEvent[]
): ShopDetailDTO {
  return {
    id: shop.id.value,
    type: 'shop',
    attributes: {
      name: shop.name,
      plan: shop.plan.id,
      status: shop.status,
      billing_cycle_start: shop.billingCycle.startDate,
      billing_cycle_end: shop.billingCycle.endDate,
      summary: {
        total_orders: overageSummary.totalOrders,
        included_orders: overageSummary.includedOrders,
        overage_orders: overageSummary.overageOrders,
        overage_charges: overageSummary.overageCharges,
      },
      usage: usageEvents.map((event) => ({
        id: event.id,
        timestamp: event.timestamp.toISOString(),
        orders: event.orders,
        gmv_eur: event.gmvEur,
      })),
      notes: shop.notes.map((note) => ({
        id: note.id,
        author: {
          id: note.author.id,
          name: note.author.name,
        },
        content: note.content,
        created_at: note.createdAt.toISOString(),
      })),
      created_at: shop.createdAt.toISOString(),
      updated_at: shop.updatedAt.toISOString(),
    },
  };
}
