import { Plan } from './plan';

/**
 * OverageSummary value object - computed from usage + plan
 * Not stored - computed at query time
 */
export class OverageSummary {
  readonly totalOrders: number;
  readonly includedOrders: number;
  readonly overageOrders: number;
  readonly overageCharges: number;

  constructor(data: { totalOrders: number; plan: Plan }) {
    // Validate totalOrders is a non-negative integer
    if (!Number.isInteger(data.totalOrders) || data.totalOrders < 0) {
      throw new Error('totalOrders must be a non-negative integer');
    }

    this.totalOrders = data.totalOrders;
    this.includedOrders = data.plan.includedOrders;
    this.overageOrders = Math.max(0, this.totalOrders - this.includedOrders);
    this.overageCharges = (this.overageOrders * data.plan.overagePerOrderCents) / 100;
  }

  equals(other: OverageSummary): boolean {
    return (
      this.totalOrders === other.totalOrders &&
      this.includedOrders === other.includedOrders &&
      this.overageOrders === other.overageOrders &&
      this.overageCharges === other.overageCharges
    );
  }
}
