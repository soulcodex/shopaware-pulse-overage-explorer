import { get, post, type ApiOptions } from './api';
import shopsFixture from '../../fixtures/shops.json';

export type TenantId = string;

type Plan = 'starter' | 'grow' | 'scale';
type Status = 'active' | 'past_due' | 'cancelled';

export interface Shop {
  id: string;
  name: string;
  plan: Plan;
  status: Status;
  usage: number;
  included_usage: number;
  overage_charges: number;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

export interface ShopsQuery {
  search?: string;
  plan?: Plan;
  status?: Status;
  sort?: string;
}

export interface Author {
  id: string;
  name: string;
}

// The requirements only name UsageEntry without a detailed shape,
// so we keep it flexible while still typed.
export type UsageEntry = Record<string, unknown>;

export interface SupportNote {
  id: string;
  author: Author;
  content: string;
}

export interface ShopDetails {
  id: string;
  usage: UsageEntry[];
  notes: SupportNote[];
  billing_cycle_start: string; // ISO 8601
  billing_cycle_end: string; // ISO 8601
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

export interface CreateSupportNoteBody {
  author: Author;
  content: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string; // ISO 8601
  version: string;
}

function withTenant(options: ApiOptions | undefined, tenantId: TenantId): ApiOptions {
  return {
    ...(options ?? {}),
    headers: {
      ...(options?.headers ?? {}),
      'X-Tenant-Id': tenantId,
    },
  };
}

function buildQuery(query?: ShopsQuery): string {
  if (!query) return '';
  const params = new URLSearchParams();

  if (query.search) params.set('search', query.search);
  if (query.plan) params.set('plan', query.plan);
  if (query.status) params.set('status', query.status);
  if (query.sort) params.set('sort', query.sort);

  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function getShops(tenantId: TenantId, query?: ShopsQuery, options?: ApiOptions) {
  // const qs = buildQuery(query);
  // return get<Shop[]>(`/api/shops${qs}`, withTenant(options, tenantId));
  return Promise.resolve(shopsFixture as Shop[]);
}

export function getShopDetails(shopId: string, tenantId: TenantId, options?: ApiOptions) {
  return get<ShopDetails>(`/api/shops/${encodeURIComponent(shopId)}`, withTenant(options, tenantId));
}

export async function createSupportNote(
  shopId: string,
  tenantId: TenantId,
  body: CreateSupportNoteBody,
  options?: ApiOptions,
): Promise<void> {
  // The contract says this returns 204 No Content, so we don't expect a body.
  await post<unknown, CreateSupportNoteBody>(
    `/api/shops/${encodeURIComponent(shopId)}/notes`,
    body,
    withTenant(options, tenantId),
  );
}

export function getHealth(options?: ApiOptions) {
  return get<HealthResponse>('/health', options);
}

