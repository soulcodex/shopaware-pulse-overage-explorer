import { createApp } from '../src/ports/http/server.ts';
import { describe, it, expect, beforeEach } from 'vitest';
describe('Create Note API', () => {
    let app;
    beforeEach(() => {
        app = createApp();
    });
    it('creates a note and subsequent GET returns it', async () => {
        // First, create a note
        const createRes = await app.request('/api/shops/eu_001/notes', {
            method: 'POST',
            headers: {
                'X-Tenant-Id': 'tnt_eu_01',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: {
                    type: 'note',
                    attributes: {
                        author: { id: 'usr_01', name: 'Alice' },
                        content: 'Contacted merchant about upcoming renewal.',
                    },
                },
            }),
        });
        expect(createRes.status).toBe(204);
        // Then, get the shop detail and verify note is there
        const getRes = await app.request('/api/shops/eu_001', {
            headers: { 'X-Tenant-Id': 'tnt_eu_01' },
        });
        const body = await getRes.json();
        expect(body.data.attributes.notes).toHaveLength(1);
        expect(body.data.attributes.notes[0].content).toBe('Contacted merchant about upcoming renewal.');
        expect(body.data.attributes.notes[0].author.id).toBe('usr_01');
        expect(body.data.attributes.notes[0].author.name).toBe('Alice');
    });
    it('returns 204 No Content on success', async () => {
        const res = await app.request('/api/shops/eu_001/notes', {
            method: 'POST',
            headers: {
                'X-Tenant-Id': 'tnt_eu_01',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: {
                    type: 'note',
                    attributes: {
                        author: { id: 'usr_02', name: 'Bob' },
                        content: 'Test note',
                    },
                },
            }),
        });
        expect(res.status).toBe(204);
    });
    it('created note has server-generated id', async () => {
        const createRes = await app.request('/api/shops/eu_001/notes', {
            method: 'POST',
            headers: {
                'X-Tenant-Id': 'tnt_eu_01',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: {
                    type: 'note',
                    attributes: {
                        author: { id: 'usr_03', name: 'Charlie' },
                        content: 'Note with generated ID',
                    },
                },
            }),
        });
        expect(createRes.status).toBe(204);
        // Get the shop and verify the note has an ID
        const getRes = await app.request('/api/shops/eu_001', {
            headers: { 'X-Tenant-Id': 'tnt_eu_01' },
        });
        const body = await getRes.json();
        const note = body.data.attributes.notes[body.data.attributes.notes.length - 1];
        expect(note.id).toBeDefined();
        expect(note.id.length).toBeGreaterThan(0);
        // Should be a UUID format
        expect(note.id).toMatch(/^[0-9a-f-]{36}$/);
    });
    it('created note has server-generated created_at', async () => {
        await app.request('/api/shops/eu_001/notes', {
            method: 'POST',
            headers: {
                'X-Tenant-Id': 'tnt_eu_01',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: {
                    type: 'note',
                    attributes: {
                        author: { id: 'usr_04', name: 'Diana' },
                        content: 'Note with timestamp',
                    },
                },
            }),
        });
        const getRes = await app.request('/api/shops/eu_001', {
            headers: { 'X-Tenant-Id': 'tnt_eu_01' },
        });
        const body = await getRes.json();
        const note = body.data.attributes.notes[body.data.attributes.notes.length - 1];
        expect(note.created_at).toBeDefined();
        // Should be ISO 8601
        expect(new Date(note.created_at).toISOString()).toBe(note.created_at);
    });
    it('returns 404 when shopId does not exist', async () => {
        const res = await app.request('/api/shops/nonexistent/notes', {
            method: 'POST',
            headers: {
                'X-Tenant-Id': 'tnt_eu_01',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: {
                    type: 'note',
                    attributes: {
                        author: { id: 'usr_01', name: 'Alice' },
                        content: 'Test note',
                    },
                },
            }),
        });
        expect(res.status).toBe(404);
        const body = await res.json();
        expect(body.errors[0].code).toBe('SHOP_NOT_FOUND');
    });
    it('returns 404 when shopId belongs to different tenant', async () => {
        const res = await app.request('/api/shops/eu_001/notes', {
            method: 'POST',
            headers: {
                'X-Tenant-Id': 'tnt_us_01',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: {
                    type: 'note',
                    attributes: {
                        author: { id: 'usr_01', name: 'Alice' },
                        content: 'Test note',
                    },
                },
            }),
        });
        expect(res.status).toBe(404);
        const body = await res.json();
        expect(body.errors[0].code).toBe('SHOP_NOT_FOUND');
    });
    it('returns 400 when data.attributes.content is missing', async () => {
        const res = await app.request('/api/shops/eu_001/notes', {
            method: 'POST',
            headers: {
                'X-Tenant-Id': 'tnt_eu_01',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: {
                    type: 'note',
                    attributes: {
                        author: { id: 'usr_01', name: 'Alice' },
                    },
                },
            }),
        });
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.errors[0].code).toBe('VALIDATION_ERROR');
        expect(body.errors[0].source.pointer).toBe('/data/attributes/content');
    });
    it('returns 400 when data.attributes.content is blank', async () => {
        const res = await app.request('/api/shops/eu_001/notes', {
            method: 'POST',
            headers: {
                'X-Tenant-Id': 'tnt_eu_01',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: {
                    type: 'note',
                    attributes: {
                        author: { id: 'usr_01', name: 'Alice' },
                        content: '   ',
                    },
                },
            }),
        });
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.errors[0].code).toBe('VALIDATION_ERROR');
        expect(body.errors[0].source.pointer).toBe('/data/attributes/content');
    });
    it('returns 400 when data.attributes.author is missing', async () => {
        const res = await app.request('/api/shops/eu_001/notes', {
            method: 'POST',
            headers: {
                'X-Tenant-Id': 'tnt_eu_01',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: {
                    type: 'note',
                    attributes: {
                        content: 'Test note',
                    },
                },
            }),
        });
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.errors[0].code).toBe('VALIDATION_ERROR');
        expect(body.errors[0].source.pointer).toBe('/data/attributes/author');
    });
    it('returns 400 when data.type is not "note"', async () => {
        const res = await app.request('/api/shops/eu_001/notes', {
            method: 'POST',
            headers: {
                'X-Tenant-Id': 'tnt_eu_01',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: {
                    type: 'not-a-note',
                    attributes: {
                        author: { id: 'usr_01', name: 'Alice' },
                        content: 'Test note',
                    },
                },
            }),
        });
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.errors[0].code).toBe('VALIDATION_ERROR');
    });
    it('returns 400 when X-Tenant-Id is missing', async () => {
        const res = await app.request('/api/shops/eu_001/notes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: {
                    type: 'note',
                    attributes: {
                        author: { id: 'usr_01', name: 'Alice' },
                        content: 'Test note',
                    },
                },
            }),
        });
        expect(res.status).toBe(400);
        const body = await res.json();
        expect(body.errors[0].code).toBe('MISSING_TENANT_ID');
    });
});
//# sourceMappingURL=create-note.test.js.map