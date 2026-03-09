import { readFile } from 'fs/promises';
import { InMemoryShopRepository } from './in-memory-shop.repository.js';
import { InMemoryUsageEventRepository } from './in-memory-usage-event.repository.js';
import { ShopStatus } from '../../../domain/shop/model/shop.js';

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

    // Load shops
    this.shopRepository.loadFromSeed(
      data.shops.map((s) => ({
        id: s.id,
        tenantId: s.tenantId,
        name: s.name,
        status: s.status as ShopStatus,
        planId: s.planId as 'starter' | 'grow' | 'scale',
        billingCycleStart: s.billingCycleStart,
        billingCycleEnd: s.billingCycleEnd,
        createdAt: '2026-03-01T00:00:00Z',
        updatedAt: '2026-03-01T00:00:00Z',
      }))
    );

    // Load usage events
    this.usageEventRepository.loadFromSeed(data.usageEvents);
  }
}
