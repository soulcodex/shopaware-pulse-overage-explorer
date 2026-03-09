import { createApp, resetRepositories } from '../../src/ports/http/server.js';
import { describe, it, expect, beforeEach } from 'vitest';

describe('List Shops API', () => {
  let app: Awaited<ReturnType<typeof createApp>>;

  beforeEach(async () => {
    resetRepositories();
    app = await createApp();
  });

  it('returns shops for tenant tnt_eu_01 with correct JSON:API shape', async () => {
    const res = await app.request('/api/shops', {
      headers: { 'X-Tenant-Id': 'tnt_eu_01' },
    });

    expect(res.status).toBe(200);
    const body = await res.json() as { data: unknown[]; meta: { request_id: string } };
    expect(body.data).toBeInstanceOf(Array);
    expect(body.meta.request_id).toBeDefined();
    
    // Check first shop has expected shape
    const shop = body.data[0] as { type: string; id: string; attributes: Record<string, unknown> };
    expect(shop.type).toBe('shop');
    expect(shop.id).toBeDefined();
    expect(shop.attributes).toHaveProperty('name');
    expect(shop.attributes).toHaveProperty('plan');
    expect(shop.attributes).toHaveProperty('status');
  });

  it('returns 400 when X-Tenant-Id is missing', async () => {
    const res = await app.request('/api/shops');
    expect(res.status).toBe(400);
    
    const body = await res.json() as { errors: Array<{ code: string }> };
    expect(body.errors[0].code).toBe('MISSING_TENANT_ID');
  });

  it('returns 400 when X-Tenant-Id is blank', async () => {
    const res = await app.request('/api/shops', {
      headers: { 'X-Tenant-Id': '   ' },
    });
    expect(res.status).toBe(400);
    
    const body = await res.json() as { errors: Array<{ code: string }> };
    expect(body.errors[0].code).toBe('MISSING_TENANT_ID');
  });

  it('returns 400 when X-API-Version is unknown', async () => {
    const res = await app.request('/api/shops', {
      headers: { 'X-Tenant-Id': 'tnt_eu_01', 'X-API-Version': '99' },
    });
    expect(res.status).toBe(400);
    
    const body = await res.json() as { errors: Array<{ code: string }> };
    expect(body.errors[0].code).toBe('UNSUPPORTED_API_VERSION');
  });

  it('passes through when X-API-Version is absent', async () => {
    const res = await app.request('/api/shops', {
      headers: { 'X-Tenant-Id': 'tnt_eu_01' },
    });
    expect(res.status).toBe(200);
  });

  it('does not return shops from tnt_us_01 when queried as tnt_eu_01', async () => {
    const res = await app.request('/api/shops', {
      headers: { 'X-Tenant-Id': 'tnt_eu_01' },
    });

    const body = await res.json() as { data: Array<{ id: string }> };
    const shopIds = body.data.map((s) => s.id);
    
    // EU shops should not include US shop IDs
    expect(shopIds).not.toContain('us_001');
    expect(shopIds).not.toContain('us_002');
    expect(shopIds).not.toContain('us_003');
    expect(shopIds).not.toContain('us_004');
  });

  it('?search=blue returns only Blue Bicycle', async () => {
    const res = await app.request('/api/shops?search=blue', {
      headers: { 'X-Tenant-Id': 'tnt_eu_01' },
    });

    const body = await res.json() as { data: Array<{ attributes: { name: string } }> };
    expect(body.data).toHaveLength(1);
    expect(body.data[0].attributes.name).toBe('Blue Bicycle');
  });

  it('?search=BLUE returns only Blue Bicycle (case-insensitive)', async () => {
    const res = await app.request('/api/shops?search=BLUE', {
      headers: { 'X-Tenant-Id': 'tnt_eu_01' },
    });

    const body = await res.json() as { data: Array<{ attributes: { name: string } }> };
    expect(body.data).toHaveLength(1);
    expect(body.data[0].attributes.name).toBe('Blue Bicycle');
  });

  it('?plan=starter returns only starter-plan shops', async () => {
    const res = await app.request('/api/shops?plan=starter', {
      headers: { 'X-Tenant-Id': 'tnt_eu_01' },
    });

    const body = await res.json() as { data: Array<{ attributes: { plan: string } }> };
    expect(body.data.length).toBeGreaterThan(0);
    for (const shop of body.data) {
      expect(shop.attributes.plan).toBe('starter');
    }
  });

  it('?status=active returns only active shops', async () => {
    const res = await app.request('/api/shops?status=active', {
      headers: { 'X-Tenant-Id': 'tnt_eu_01' },
    });

    const body = await res.json() as { data: Array<{ attributes: { status: string } }> };
    expect(body.data.length).toBeGreaterThan(0);
    for (const shop of body.data) {
      expect(shop.attributes.status).toBe('active');
    }
  });

  it('?sort=-overage_charges returns highest overage first', async () => {
    const res = await app.request('/api/shops?sort=-overage_charges', {
      headers: { 'X-Tenant-Id': 'tnt_eu_01' },
    });

    const body = await res.json() as { data: Array<{ attributes: { overage_charges: number } }> };
    const overages = body.data.map((s) => s.attributes.overage_charges);
    
    // Should be sorted descending
    for (let i = 0; i < overages.length - 1; i++) {
      expect(overages[i]).toBeGreaterThanOrEqual(overages[i + 1]);
    }
  });

  it('?sort=-name returns Z to A by name', async () => {
    const res = await app.request('/api/shops?sort=-name', {
      headers: { 'X-Tenant-Id': 'tnt_eu_01' },
    });

    const body = await res.json() as { data: Array<{ attributes: { name: string } }> };
    const names = body.data.map((s) => s.attributes.name);
    
    // Should be sorted descending (Z to A)
    for (let i = 0; i < names.length - 1; i++) {
      expect(names[i].localeCompare(names[i + 1])).toBeGreaterThanOrEqual(0);
    }
  });

  it('eu_001 has overage_charges: 2.5', async () => {
    const res = await app.request('/api/shops', {
      headers: { 'X-Tenant-Id': 'tnt_eu_01' },
    });

    const body = await res.json() as { data: Array<{ id: string; attributes: { overage_charges: number } }> };
    const eu001 = body.data.find((s) => s.id === 'eu_001');
    expect(eu001).toBeDefined();
    expect(eu001!.attributes.overage_charges).toBe(2.5);
  });

  it('eu_002 has overage_charges: 4.5', async () => {
    const res = await app.request('/api/shops', {
      headers: { 'X-Tenant-Id': 'tnt_eu_01' },
    });

    const body = await res.json() as { data: Array<{ id: string; attributes: { overage_charges: number } }> };
    const eu002 = body.data.find((s) => s.id === 'eu_002');
    expect(eu002).toBeDefined();
    expect(eu002!.attributes.overage_charges).toBe(4.5);
  });

  it('eu_004 has overage_charges: 0', async () => {
    const res = await app.request('/api/shops', {
      headers: { 'X-Tenant-Id': 'tnt_eu_01' },
    });

    const body = await res.json() as { data: Array<{ id: string; attributes: { overage_charges: number } }> };
    const eu004 = body.data.find((s) => s.id === 'eu_004');
    expect(eu004).toBeDefined();
    expect(eu004!.attributes.overage_charges).toBe(0);
  });

  it('response includes Vary: X-API-Version header', async () => {
    const res = await app.request('/api/shops', {
      headers: { 'X-Tenant-Id': 'tnt_eu_01' },
    });

    expect(res.headers.get('Vary')).toContain('X-API-Version');
  });
});
