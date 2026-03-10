import { describe, it, expect } from 'vitest';
import { UsageEvent } from '../../../src/domain/shop/usage-event/usage-event';
import { ShopId } from '../../../src/domain/shop/model/shop-id';
import { TenantId } from '../../../src/domain/shop/model/tenant-id';

describe('UsageEvent', () => {
  const validData = {
    id: 'evt_001',
    tenantId: new TenantId('tnt_eu_01'),
    shopId: new ShopId('eu_001'),
    timestamp: new Date('2026-03-15T10:00:00Z'),
    orders: 50,
    gmvEur: 1500.5,
  };

  it('is created with valid data', () => {
    const event = new UsageEvent(validData);

    expect(event.id).toBe('evt_001');
    expect(event.tenantId.value).toBe('tnt_eu_01');
    expect(event.shopId.value).toBe('eu_001');
    expect(event.orders).toBe(50);
    expect(event.gmvEur).toBe(1500.5);
  });

  it('throws when orders is negative', () => {
    expect(() => {
      new UsageEvent({
        ...validData,
        orders: -1,
      });
    }).toThrow('orders must be a non-negative integer');
  });

  it('throws when orders is a float', () => {
    expect(() => {
      new UsageEvent({
        ...validData,
        orders: 50.5,
      });
    }).toThrow('orders must be a non-negative integer');
  });

  it('throws when gmvEur is negative', () => {
    expect(() => {
      new UsageEvent({
        ...validData,
        gmvEur: -100,
      });
    }).toThrow('gmvEur must be a non-negative number');
  });

  it('allows zero orders', () => {
    const event = new UsageEvent({
      ...validData,
      orders: 0,
    });
    expect(event.orders).toBe(0);
  });

  it('allows zero gmvEur', () => {
    const event = new UsageEvent({
      ...validData,
      gmvEur: 0,
    });
    expect(event.gmvEur).toBe(0);
  });
});
