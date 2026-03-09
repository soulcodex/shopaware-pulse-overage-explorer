import { createApp, resetRepositories } from '../../src/ports/http/server.js';
import { describe, it, expect, beforeEach } from 'vitest';

describe('Get Shop Detail API', () => {
  let app: Awaited<ReturnType<typeof createApp>>;

  beforeEach(async () => {
    resetRepositories();
    app = await createApp();
  });

  it('returns full detail for eu_001 with JSON:API shape', async () => {
    const res = await app.request('/api/shops/eu_001', {
      headers: { 'X-Tenant-Id': 'tnt_eu_01' },
    });

    expect(res.status).toBe(200);
    const body = await res.json() as { data: { type: string; id: string; attributes: Record<string, unknown> }; meta: { request_id: string } };
    expect(body.data.type).toBe('shop');
    expect(body.data.id).toBe('eu_001');
    expect(body.data.attributes).toHaveProperty('name');
    expect(body.data.attributes).toHaveProperty('billing_cycle_start');
    expect(body.data.attributes).toHaveProperty('billing_cycle_end');
    expect(body.data.attributes).toHaveProperty('summary');
    expect(body.data.attributes).toHaveProperty('usage');
    expect(body.data.attributes).toHaveProperty('notes');
    expect(body.meta.request_id).toBeDefined();
  });

  it('attributes.summary.total_orders = 250', async () => {
    const res = await app.request('/api/shops/eu_001', {
      headers: { 'X-Tenant-Id': 'tnt_eu_01' },
    });

    const body = await res.json() as { data: { attributes: { summary: { total_orders: number } } } };
    expect(body.data.attributes.summary.total_orders).toBe(250);
  });

  it('attributes.summary.overage_orders = 50', async () => {
    const res = await app.request('/api/shops/eu_001', {
      headers: { 'X-Tenant-Id': 'tnt_eu_01' },
    });

    const body = await res.json() as { data: { attributes: { summary: { overage_orders: number } } } };
    expect(body.data.attributes.summary.overage_orders).toBe(50);
  });

  it('attributes.summary.overage_charges = 2.5', async () => {
    const res = await app.request('/api/shops/eu_001', {
      headers: { 'X-Tenant-Id': 'tnt_eu_01' },
    });

    const body = await res.json() as { data: { attributes: { summary: { overage_charges: number } } } };
    expect(body.data.attributes.summary.overage_charges).toBe(2.5);
  });

  it('attributes.usage has 3 events with gmv_eur field', async () => {
    const res = await app.request('/api/shops/eu_001', {
      headers: { 'X-Tenant-Id': 'tnt_eu_01' },
    });

    const body = await res.json() as { data: { attributes: { usage: Array<{ gmv_eur: number }> } } };
    expect(body.data.attributes.usage).toHaveLength(3);
    for (const event of body.data.attributes.usage) {
      expect(event.gmv_eur).toBeDefined();
      expect(typeof event.gmv_eur).toBe('number');
    }
  });

  it('attributes.notes is empty initially', async () => {
    const res = await app.request('/api/shops/eu_001', {
      headers: { 'X-Tenant-Id': 'tnt_eu_01' },
    });

    const body = await res.json() as { data: { attributes: { notes: unknown[] } } };
    expect(body.data.attributes.notes).toEqual([]);
  });

  it('attributes.billing_cycle_start and billing_cycle_end are present', async () => {
    const res = await app.request('/api/shops/eu_001', {
      headers: { 'X-Tenant-Id': 'tnt_eu_01' },
    });

    const body = await res.json() as { data: { attributes: { billing_cycle_start: string; billing_cycle_end: string } } };
    expect(body.data.attributes.billing_cycle_start).toBe('2026-03-01');
    expect(body.data.attributes.billing_cycle_end).toBe('2026-03-31');
  });

  it('returns 404 for unknown shopId', async () => {
    const res = await app.request('/api/shops/unknown_shop', {
      headers: { 'X-Tenant-Id': 'tnt_eu_01' },
    });

    expect(res.status).toBe(404);
    const body = await res.json() as { errors: Array<{ code: string }> };
    expect(body.errors[0].code).toBe('SHOP_NOT_FOUND');
  });

  it('returns 404 when eu_001 is requested with tnt_us_01', async () => {
    const res = await app.request('/api/shops/eu_001', {
      headers: { 'X-Tenant-Id': 'tnt_us_01' },
    });

    expect(res.status).toBe(404);
    const body = await res.json() as { errors: Array<{ code: string }> };
    expect(body.errors[0].code).toBe('SHOP_NOT_FOUND');
  });

  it('returns 400 when X-Tenant-Id is missing', async () => {
    const res = await app.request('/api/shops/eu_001');
    expect(res.status).toBe(400);
    
    const body = await res.json() as { errors: Array<{ code: string }> };
    expect(body.errors[0].code).toBe('MISSING_TENANT_ID');
  });

  it('returns 400 when X-Tenant-Id is blank', async () => {
    const res = await app.request('/api/shops/eu_001', {
      headers: { 'X-Tenant-Id': '   ' },
    });
    expect(res.status).toBe(400);
    
    const body = await res.json() as { errors: Array<{ code: string }> };
    expect(body.errors[0].code).toBe('MISSING_TENANT_ID');
  });
});
