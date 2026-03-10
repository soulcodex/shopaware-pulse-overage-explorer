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
  readonly overagePerOrderCents: number;

  constructor(data: {
    id: PlanId;
    name: string;
    includedOrders: number;
    overagePerOrderCents: number;
  }) {
    this.id = data.id;
    this.name = data.name;
    this.includedOrders = data.includedOrders;
    this.overagePerOrderCents = data.overagePerOrderCents;
  }

  equals(other: Plan): boolean {
    return (
      this.id === other.id &&
      this.name === other.name &&
      this.includedOrders === other.includedOrders &&
      this.overagePerOrderCents === other.overagePerOrderCents
    );
  }
}

/**
 * Predefined plans
 */
export const PLANS: Record<PlanId, Plan> = {
  starter: new Plan({ id: 'starter', name: 'Starter', includedOrders: 200, overagePerOrderCents: 5 }),
  grow: new Plan({ id: 'grow', name: 'Grow', includedOrders: 1000, overagePerOrderCents: 3 }),
  scale: new Plan({ id: 'scale', name: 'Scale', includedOrders: 5000, overagePerOrderCents: 1 }),
};

export function getPlan(planId: PlanId): Plan {
  const plan = PLANS[planId];
  if (!plan) {
    throw new Error(`Unknown plan: ${planId}`);
  }
  return plan;
}
