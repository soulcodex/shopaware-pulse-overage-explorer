import { createApp } from '../src/ports/http/server.ts';
import { describe, it, expect, beforeEach } from 'vitest';
describe('Health API', () => {
    let app;
    beforeEach(() => {
        app = createApp();
    });
    it('returns 200 with ok status', async () => {
        const res = await app.request('/health');
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.status).toBe('ok');
        expect(body.timestamp).toBeDefined();
        expect(body.version).toBe('1.0.0');
    });
    it('timestamp is valid ISO 8601', async () => {
        const res = await app.request('/health');
        const body = await res.json();
        const date = new Date(body.timestamp);
        expect(date.toISOString()).toBe(body.timestamp);
    });
    it('does not require X-Tenant-Id', async () => {
        const res = await app.request('/health');
        expect(res.status).toBe(200);
    });
    it('GET /docs returns 200', async () => {
        const res = await app.request('/docs');
        expect(res.status).toBe(200);
    });
});
//# sourceMappingURL=health.test.js.map