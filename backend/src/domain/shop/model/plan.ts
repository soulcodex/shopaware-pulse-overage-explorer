/**
 * Plan type
 */
export type PlanId = 'starter' | 'grow' | 'scale';

/**
 * Plan value object - represents a billing plan
 */
export class Plan {
  readonly id: PlanId;
  readonly name: string;
  readonly includedOrders: number;
  readonly overagePerOrderEur: number;

  constructor(data: {
    id: PlanId;
    name: string;
    includedOrders: number;
    overagePerOrderEur: number;
  }) {
    this.id = data.id;
    this.name = data.name;
    this.includedOrders = data.includedOrders;
    this.overagePerOrderEur = data.overagePerOrderEur;
  }

  equals(other: Plan): boolean {
    return (
      this.id === other.id &&
      this.name === other.name &&
      this.includedOrders === other.includedOrders &&
      this.overagePerOrderEur === other.overagePerOrderEur
    );
  }
}

/**
 * Predefined plans
 */
export const PLANS: Record<PlanId, Plan> = {
  starter: new Plan({ id: 'starter', name: 'Starter', includedOrders: 200, overagePerOrderEur: 0.05 }),
  grow: new Plan({ id: 'grow', name: 'Grow', includedOrders: 1000, overagePerOrderEur: 0.03 }),
  scale: new Plan({ id: 'scale', name: 'Scale', includedOrders: 5000, overagePerOrderEur: 0.01 }),
};

export function getPlan(planId: PlanId): Plan {
  const plan = PLANS[planId];
  if (!plan) {
    throw new Error(`Unknown plan: ${planId}`);
  }
  return plan;
}
