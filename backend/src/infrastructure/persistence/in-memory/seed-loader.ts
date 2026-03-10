import { readFile } from 'fs/promises';
import Decimal from 'decimal.js';
import { InMemoryShopRepository } from './in-memory-shop.repository';
import { InMemoryUsageEventRepository } from './in-memory-usage-event.repository';
import { ShopStatus } from '../../../domain/shop/model/shop';
import { Plan, PlanId } from '../../../domain/shop/model/plan';

/**
 * Valid shop statuses
 */
const VALID_STATUSES: readonly string[] = ['active', 'past_due', 'cancelled'];

/**
 * Valid plan IDs
 */
const VALID_PLAN_IDS: readonly string[] = ['starter', 'grow', 'scale'];

/**
 * Asserts that a value is a valid shop status
 */
function assertShopStatus(value: string): ShopStatus {
  if (!VALID_STATUSES.includes(value)) {
    throw new Error(`Invalid shop status in seed data: "${value}"`);
  }
  return value as ShopStatus;
}

/**
 * Asserts that a value is a valid plan ID
 */
function assertPlanId(value: string): PlanId {
  if (!VALID_PLAN_IDS.includes(value)) {
    throw new Error(`Invalid plan ID in seed data: "${value}"`);
  }
  return value as PlanId;
}

/**
 * Seed data structure from JSON file
 */
interface SeedData {
  plans: Array<{
    id: string;
    name: string;
    includedOrders: number;
    overagePerOrderEur: number;
  }>;
  shops: Array<{
    id: string;
    tenantId: string;
    name: string;
    status: string;
    planId: string;
    billingCycleStart: string;
    billingCycleEnd: string;
  }>;
  usageEvents: Array<{
    id: string;
    tenantId: string;
    shopId: string;
    timestamp: string;
    orders: number;
    gmvEur: number;
  }>;
  notes: unknown[];
}

/**
 * SeedLoader - loads seed data from JSON file
 */
export class SeedLoader {
  private plans: Map<PlanId, Plan> = new Map();

  constructor(
    private readonly shopRepository: InMemoryShopRepository,
    private readonly usageEventRepository: InMemoryUsageEventRepository
  ) {}

  /**
   * Load seed data from file
   */
  async load(filePath: string): Promise<void> {
    const content = await readFile(filePath, 'utf-8');
    const data: SeedData = JSON.parse(content);

    // Load plans from seed data
    for (const planData of data.plans) {
      const planId = assertPlanId(planData.id);
      const overagePerOrderCents = new Decimal(planData.overagePerOrderEur).times(100).toNumber();
      const plan = new Plan({
        id: planId,
        name: planData.name,
        includedOrders: planData.includedOrders,
        overagePerOrderCents,
      });
      this.plans.set(planId, plan);
    }

    // Load shops
    this.shopRepository.loadFromSeed(
      data.shops.map((s) => ({
        id: s.id,
        tenantId: s.tenantId,
        name: s.name,
        status: assertShopStatus(s.status),
        planId: assertPlanId(s.planId),
        billingCycleStart: s.billingCycleStart,
        billingCycleEnd: s.billingCycleEnd,
        createdAt: '2026-03-01T00:00:00Z',
        updatedAt: '2026-03-01T00:00:00Z',
      })),
      this.plans
    );

    // Load usage events
    this.usageEventRepository.loadFromSeed(data.usageEvents);
  }
}
