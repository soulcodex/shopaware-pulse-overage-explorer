/**
 * Validates that a date is valid
 */
function assertValidDate(date: Date, label: string): void {
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date for ${label}`);
  }
}

/**
 * BillingCycle value object - represents a billing period
 */
export class BillingCycle {
  readonly start: Date;
  readonly end: Date;

  constructor(data: { start: Date; end: Date }) {
    assertValidDate(data.start, 'billing cycle start');
    assertValidDate(data.end, 'billing cycle end');

    if (data.end < data.start) {
      throw new Error('Billing cycle end must be after start');
    }
    this.start = data.start;
    this.end = data.end;
  }

  get startDate(): string {
    return this.start.toISOString().split('T')[0] as string;
  }

  get endDate(): string {
    return this.end.toISOString().split('T')[0] as string;
  }

  equals(other: BillingCycle): boolean {
    return this.start.getTime() === other.start.getTime() && this.end.getTime() === other.end.getTime();
  }
}
