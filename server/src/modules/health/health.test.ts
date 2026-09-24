import request from 'supertest';
import { describe, expect, it } from '@eduflow/shared/testing';
import { createApp } from '../../app.ts';

const app = createApp();

describe('health module', () => {
  it('answers the liveness check without touching a dependency', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('ok');
    expect(response.body.data.version).toBe('test');
    expect(response.body.data.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(typeof response.body.data.startedAt).toBe('string');
  });

  it('puts a trace id on every response', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.headers['x-request-id']).toMatch(/^req_[0-9a-f]{12}$/);
  });

  it('reuses a trace id the caller sent', async () => {
    const sent = 'req_0123456789ab';
    const response = await request(app).get('/api/v1/health').set('X-Request-Id', sent);

    expect(response.headers['x-request-id']).toBe(sent);
  });

  it('refuses to cache a response', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  // The suite runs with or without PostgreSQL, so both outcomes are valid: what must always
  // hold is the shape of the answer.
  it('reports readiness in the canon envelope', async () => {
    const response = await request(app).get('/api/v1/ready');

    expect([200, 503]).toContain(response.status);
    if (response.status === 200) {
      expect(response.body.success).toBe(true);
      expect(response.body.data.ready).toBe(true);
      expect(response.body.data.checks.some((c: { name: string }) => c.name === 'database')).toBe(
        true,
      );
    } else {
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SERVICE_UNAVAILABLE');
      expect(response.body.error.details[0].field).toBe('database');
      expect(response.body.requestId).toMatch(/^req_[0-9a-f]{12}$/);
      expect(response.headers['retry-after']).toBe('30');
    }
  });

  it('serves the same probe at the catalogue path /health/ready', async () => {
    const response = await request(app).get('/api/v1/health/ready');

    expect([200, 503]).toContain(response.status);
  });

  it('turns an unknown route into the canon error envelope', async () => {
    const response = await request(app).get('/api/v1/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(response.body.error.details).toEqual([]);
    expect(response.body.requestId).toMatch(/^req_[0-9a-f]{12}$/);
  });

  it('ignores a stray token on a public route', async () => {
    const response = await request(app).get('/api/v1/health').set('Authorization', 'Bearer nope');

    // Health is public, so a stray token changes nothing.
    expect(response.status).toBe(200);
  });
});
