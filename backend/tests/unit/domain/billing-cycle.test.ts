import { describe, it, expect } from 'vitest';
import { BillingCycle } from '../../../src/domain/shop/model/billing-cycle';

describe('BillingCycle value object', () => {
  it('is created with valid start and end dates', () => {
    const cycle = new BillingCycle({
      start: new Date('2026-03-01'),
      end: new Date('2026-03-31'),
    });

    expect(cycle.start).toBeInstanceOf(Date);
    expect(cycle.end).toBeInstanceOf(Date);
    expect(cycle.startDate).toBe('2026-03-01');
    expect(cycle.endDate).toBe('2026-03-31');
  });

  it('throws when start date is invalid', () => {
    expect(() => {
      new BillingCycle({
        start: new Date('invalid'),
        end: new Date('2026-03-31'),
      });
    }).toThrow('Invalid date for billing cycle start');
  });

  it('throws when end date is invalid', () => {
    expect(() => {
      new BillingCycle({
        start: new Date('2026-03-01'),
        end: new Date('invalid'),
      });
    }).toThrow('Invalid date for billing cycle end');
  });

  it('throws when end is before start', () => {
    expect(() => {
      new BillingCycle({
        start: new Date('2026-03-31'),
        end: new Date('2026-03-01'),
      });
    }).toThrow('Billing cycle end must be after start');
  });

  it('startDate and endDate return ISO date strings', () => {
    const cycle = new BillingCycle({
      start: new Date('2026-03-01T10:00:00Z'),
      end: new Date('2026-03-31T23:59:59Z'),
    });

    expect(cycle.startDate).toBe('2026-03-01');
    expect(cycle.endDate).toBe('2026-03-31');
  });

  it('allows same start and end date (single-day cycle)', () => {
    const cycle = new BillingCycle({
      start: new Date('2026-03-15'),
      end: new Date('2026-03-15'),
    });

    expect(cycle.startDate).toBe('2026-03-15');
    expect(cycle.endDate).toBe('2026-03-15');
  });
});
