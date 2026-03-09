import { ShopId } from './shop-id.js';
import { TenantId } from './tenant-id.js';
import { Plan, PlanId, getPlan } from './plan.js';
import { BillingCycle } from './billing-cycle.js';
import { SupportNote } from '../note/support-note.js';

/**
 * Shop status
 */
export type ShopStatus = 'active' | 'past_due' | 'cancelled';

/**
 * Shop aggregate root
 */
export class Shop {
  readonly id: ShopId;
  readonly tenantId: TenantId;
  readonly name: string;
  readonly status: ShopStatus;
  readonly plan: Plan;
  readonly billingCycle: BillingCycle;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  private _notes: SupportNote[] = [];

  constructor(data: {
    id: ShopId;
    tenantId: TenantId;
    name: string;
    status: ShopStatus;
    plan: Plan;
    billingCycle: BillingCycle;
    createdAt: Date;
    updatedAt: Date;
    notes?: SupportNote[];
  }) {
    this.id = data.id;
    this.tenantId = data.tenantId;
    this.name = data.name;
    this.status = data.status;
    this.plan = data.plan;
    this.billingCycle = data.billingCycle;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    if (data.notes) {
      this._notes = data.notes;
    }
  }

  get notes(): readonly SupportNote[] {
    return this._notes;
  }

  /**
   * Add a support note to this shop
   */
  addNote(note: SupportNote): void {
    // Verify the note belongs to this shop
    if (note.shopId.value !== this.id.value) {
      throw new Error('Note does not belong to this shop');
    }
    this._notes.push(note);
  }
}

/**
 * Shop factory - creates a Shop from raw seed data
 */
export function createShop(data: {
  id: string;
  tenantId: string;
  name: string;
  status: ShopStatus;
  planId: PlanId;
  billingCycleStart: string;
  billingCycleEnd: string;
  createdAt?: string;
  updatedAt?: string;
  notes?: SupportNote[];
}): Shop {
  return new Shop({
    id: new ShopId(data.id),
    tenantId: new TenantId(data.tenantId),
    name: data.name,
    status: data.status,
    plan: getPlan(data.planId),
    billingCycle: new BillingCycle({
      start: new Date(data.billingCycleStart),
      end: new Date(data.billingCycleEnd),
    }),
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
    ...(data.notes !== undefined && { notes: data.notes }),
  });
}
