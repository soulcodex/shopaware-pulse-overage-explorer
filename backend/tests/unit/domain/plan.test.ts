import { describe, it, expect } from 'vitest';
import { Plan } from '../../../src/domain/shop/model/plan';

describe('Plan value object', () => {
  it('is created with valid integer cents and included orders', () => {
    const plan = new Plan({
      id: 'starter',
      name: 'Starter',
      includedOrders: 200,
      overagePerOrderCents: 5,
    });

    expect(plan.id).toBe('starter');
    expect(plan.name).toBe('Starter');
    expect(plan.includedOrders).toBe(200);
    expect(plan.overagePerOrderCents).toBe(5);
  });

  it('throws when overagePerOrderCents is not an integer', () => {
    expect(() => {
      new Plan({
        id: 'starter',
        name: 'Starter',
        includedOrders: 200,
        overagePerOrderCents: 5.5,
      });
    }).toThrow('overagePerOrderCents must be a non-negative integer');
  });

  it('throws when overagePerOrderCents is negative', () => {
    expect(() => {
      new Plan({
        id: 'starter',
        name: 'Starter',
        includedOrders: 200,
        overagePerOrderCents: -1,
      });
    }).toThrow('overagePerOrderCents must be a non-negative integer');
  });

  it('throws when overagePerOrderCents is a float (e.g. 0.5)', () => {
    expect(() => {
      new Plan({
        id: 'starter',
        name: 'Starter',
        includedOrders: 200,
        overagePerOrderCents: 0.5,
      });
    }).toThrow('overagePerOrderCents must be a non-negative integer');
  });

  it('throws when includedOrders is not a positive integer', () => {
    expect(() => {
      new Plan({
        id: 'starter',
        name: 'Starter',
        includedOrders: 200.5,
        overagePerOrderCents: 5,
      });
    }).toThrow('includedOrders must be a positive integer');
  });

  it('throws when includedOrders is zero', () => {
    expect(() => {
      new Plan({
        id: 'starter',
        name: 'Starter',
        includedOrders: 0,
        overagePerOrderCents: 5,
      });
    }).toThrow('includedOrders must be a positive integer');
  });

  it('throws when includedOrders is negative', () => {
    expect(() => {
      new Plan({
        id: 'starter',
        name: 'Starter',
        includedOrders: -100,
        overagePerOrderCents: 5,
      });
    }).toThrow('includedOrders must be a positive integer');
  });

  it('throws when includedOrders is a float', () => {
    expect(() => {
      new Plan({
        id: 'starter',
        name: 'Starter',
        includedOrders: 100.5,
        overagePerOrderCents: 5,
      });
    }).toThrow('includedOrders must be a positive integer');
  });
});
