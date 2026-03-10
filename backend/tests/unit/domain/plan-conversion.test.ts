import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';

describe('Plan EUR to cents conversion via decimal.js (infra boundary)', () => {
  it('converts 0.05 EUR to 5 cents without floating-point error', () => {
    const eurValue = 0.05;
    const expectedCents = 5;
    const result = new Decimal(eurValue).times(100).toNumber();
    expect(result).toBe(expectedCents);
  });

  it('converts 0.03 EUR to 3 cents without floating-point error', () => {
    const eurValue = 0.03;
    const expectedCents = 3;
    const result = new Decimal(eurValue).times(100).toNumber();
    expect(result).toBe(expectedCents);
  });

  it('converts 0.01 EUR to 1 cent without floating-point error', () => {
    const eurValue = 0.01;
    const expectedCents = 1;
    const result = new Decimal(eurValue).times(100).toNumber();
    expect(result).toBe(expectedCents);
  });

  it('handles larger values correctly', () => {
    const eurValue = 0.99;
    const expectedCents = 99;
    const result = new Decimal(eurValue).times(100).toNumber();
    expect(result).toBe(expectedCents);
  });

  it('handles zero correctly', () => {
    const eurValue = 0;
    const expectedCents = 0;
    const result = new Decimal(eurValue).times(100).toNumber();
    expect(result).toBe(expectedCents);
  });
});
