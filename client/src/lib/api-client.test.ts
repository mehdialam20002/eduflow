import { afterEach, describe, expect, it, vi } from '@eduflow/shared/testing';
import {
  ApiError,
  apiFetch,
  apiFetchList,
  setAccessToken,
  setActiveCampusId,
} from './api-client.ts';

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  setAccessToken(null);
  setActiveCampusId(null);
});

describe('apiFetch', () => {
  it('returns the data field of the success envelope', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { success: true, data: { id: 'a1' } }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await apiFetch<{ id: string }>('/students/a1');

    expect(result).toEqual({ id: 'a1' });
  });

  it('sends the campus header and the bearer token when both are set', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { success: true, data: null }));
    vi.stubGlobal('fetch', fetchMock);
    setAccessToken('token-123');
    setActiveCampusId('campus-main');

    await apiFetch('/auth/me');

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const headers = init.headers as Headers;
    expect(headers.get('X-Campus-Id')).toBe('campus-main');
    expect(headers.get('Authorization')).toBe('Bearer token-123');
    expect(init.credentials).toBe('include');
  });

  it('throws a typed ApiError built from the canon error envelope', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(400, {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Check the form.',
            details: [{ field: 'phone', issue: 'Invalid phone number' }],
          },
          requestId: 'req_8f3a',
        }),
      ),
    );

    const error = await apiFetch('/students', { method: 'POST', body: {} }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    const apiError = error as ApiError;
    expect(apiError.code).toBe('VALIDATION_ERROR');
    expect(apiError.status).toBe(400);
    expect(apiError.requestId).toBe('req_8f3a');
    expect(apiError.details).toEqual([{ field: 'phone', issue: 'Invalid phone number' }]);
    expect(apiError.isValidation).toBe(true);
  });

  it('retries a GET that the API could not serve', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(503, { success: false, error: { code: 'x', message: 'y' } }))
      .mockResolvedValueOnce(jsonResponse(200, { success: true, data: 'ok' }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiFetch<string>('/health')).resolves.toBe('ok');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('never retries a write that carries no idempotency key', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(503, { success: false, error: { code: 'x', message: 'y' } }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiFetch('/payments', { method: 'POST', body: {} })).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('apiFetchList', () => {
  it('splits the rows from the paging block', async () => {
    const meta = { page: 1, limit: 20, total: 134, totalPages: 7 };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(200, { success: true, data: [{ id: 'a' }], meta })),
    );

    const result = await apiFetchList<{ id: string }>('/students');

    expect(result.items).toEqual([{ id: 'a' }]);
    expect(result.meta).toEqual(meta);
  });
});
