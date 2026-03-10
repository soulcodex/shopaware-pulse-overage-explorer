import { describe, it, expect } from 'vitest';
import { OverageSummary } from '../../../src/domain/shop/model/overage-summary';
import { Plan } from '../../../src/domain/shop/model/plan';

describe('OverageSummary value object', () => {
  const starterPlan = new Plan({
    id: 'starter',
    name: 'Starter',
    includedOrders: 200,
    overagePerOrderCents: 5,
  });

  const growPlan = new Plan({
    id: 'grow',
    name: 'Grow',
    includedOrders: 1000,
    overagePerOrderCents: 3,
  });

  it('computes zero overage when total orders equal included orders', () => {
    const summary = new OverageSummary({
      totalOrders: 200,
      plan: starterPlan,
    });

    expect(summary.totalOrders).toBe(200);
    expect(summary.includedOrders).toBe(200);
    expect(summary.overageOrders).toBe(0);
    expect(summary.overageCharges).toBe(0);
  });

  it('computes zero overage when total orders are below included orders', () => {
    const summary = new OverageSummary({
      totalOrders: 150,
      plan: starterPlan,
    });

    expect(summary.totalOrders).toBe(150);
    expect(summary.includedOrders).toBe(200);
    expect(summary.overageOrders).toBe(0);
    expect(summary.overageCharges).toBe(0);
  });

  it('computes correct overage charges for orders above the limit', () => {
    const summary = new OverageSummary({
      totalOrders: 250,
      plan: starterPlan,
    });

    expect(summary.overageOrders).toBe(50);
    // 50 * 5 cents / 100 = 2.5 EUR
    expect(summary.overageCharges).toBe(2.5);
  });

  it('throws when totalOrders is negative', () => {
    expect(() => {
      new OverageSummary({
        totalOrders: -1,
        plan: starterPlan,
      });
    }).toThrow('totalOrders must be a non-negative integer');
  });

  it('throws when totalOrders is a float', () => {
    expect(() => {
      new OverageSummary({
        totalOrders: 100.5,
        plan: starterPlan,
      });
    }).toThrow('totalOrders must be a non-negative integer');
  });

  it('overageCharges is exact with no floating-point error (regression test)', () => {
    // Test with orders that historically caused float errors
    // (1234-1000)*3/100 = 7.02 exactly
    const summary = new OverageSummary({
      totalOrders: 1234,
      plan: growPlan,
    });

    expect(summary.overageOrders).toBe(234);
    expect(summary.overageCharges).toBe(7.02);
  });
});
