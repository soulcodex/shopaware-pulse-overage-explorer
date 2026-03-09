import { Plan } from './plan.js';

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
    this.totalOrders = data.totalOrders;
    this.includedOrders = data.plan.includedOrders;
    this.overageOrders = Math.max(0, this.totalOrders - this.includedOrders);
    // Round to 2 decimal places
    this.overageCharges = Math.round(this.overageOrders * data.plan.overagePerOrderEur * 100) / 100;
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
