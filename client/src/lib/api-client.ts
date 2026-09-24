import type { ErrorCode } from '@eduflow/shared';
import { env } from './env.ts';

// The only file in client/ that calls fetch. Everything else goes through a
// feature api/ function, so the token, the campus header, the canon envelopes
// and the retry rules live in one place.

export interface ApiErrorDetail {
  field: string;
  issue: string;
}

/** Paging block that the API adds to list answers. */
export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiListResult<T> {
  items: T[];
  meta: PageMeta;
}

interface SuccessEnvelope<T> {
  success: true;
  data: T;
  meta?: PageMeta;
}

interface ErrorEnvelope {
  success: false;
  error: { code: string; message: string; details?: ApiErrorDetail[] };
  requestId?: string;
}

/** Thrown for every answer that is not 2xx, built from the canon error envelope. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly details: ApiErrorDetail[];
  readonly requestId: string | null;

  constructor(init: {
    status: number;
    code: ErrorCode;
    message: string;
    details?: ApiErrorDetail[];
    requestId?: string | null;
  }) {
    super(init.message);
    this.name = 'ApiError';
    this.status = init.status;
    this.code = init.code;
    this.details = init.details ?? [];
    this.requestId = init.requestId ?? null;
  }

  /** True while the user can fix it themselves, so the screen shows it on the form. */
  get isValidation(): boolean {
    return this.code === 'VALIDATION_ERROR' || this.status === 422;
  }
}

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface ApiFetchOptions {
  method?: HttpMethod;
  body?: unknown;
  query?: Record<string, string | number | boolean | null | undefined>;
  /** Required by the canon on payment-creating POSTs. It also makes a replay safe. */
  idempotencyKey?: string;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

// The access token lives in a module variable, never in localStorage and never
// in a cookie that JavaScript can read. A reload restores it from /auth/refresh.
let accessToken: string | null = null;
let activeCampusId: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setActiveCampusId(campusId: string | null): void {
  activeCampusId = campusId;
}

export function getActiveCampusId(): string | null {
  return activeCampusId;
}

const SAFE_METHODS: ReadonlySet<HttpMethod> = new Set<HttpMethod>(['GET']);
const RETRYABLE_STATUSES: ReadonlySet<number> = new Set([429, 502, 503, 504]);
const MAX_ATTEMPTS = 3;

function buildUrl(path: string, query: ApiFetchOptions['query']): string {
  const base = env.apiUrl.replace(/\/$/, '');
  const url = new URL(`${base}/${path.replace(/^\//, '')}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== null && value !== undefined) url.searchParams.set(key, String(value));
  }
  return url.toString();
}

function buildHeaders(options: ApiFetchOptions): Headers {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (options.body !== undefined) headers.set('Content-Type', 'application/json');
  if (accessToken !== null) headers.set('Authorization', `Bearer ${accessToken}`);
  if (activeCampusId !== null) headers.set('X-Campus-Id', activeCampusId);
  if (options.idempotencyKey !== undefined) {
    headers.set('Idempotency-Key', options.idempotencyKey);
  }
  return headers;
}

/** A replayed write is only safe when the server can recognise the replay. */
function canRetry(method: HttpMethod, options: ApiFetchOptions): boolean {
  return SAFE_METHODS.has(method) || options.idempotencyKey !== undefined;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function offlineError(): ApiError {
  return new ApiError({
    status: 0,
    code: 'SERVICE_UNAVAILABLE',
    message: 'Could not reach EduFlow. Check your internet and try again.',
  });
}

async function readEnvelope(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text.length === 0) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function toApiError(response: Response, payload: unknown): ApiError {
  const envelope = payload as ErrorEnvelope | null;
  const error = envelope?.error;
  if (error === undefined) {
    return new ApiError({
      status: response.status,
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong. Try again in a moment.',
      requestId: response.headers.get('x-request-id'),
    });
  }
  return new ApiError({
    status: response.status,
    code: error.code as ErrorCode,
    message: error.message,
    ...(error.details === undefined ? {} : { details: error.details }),
    requestId: envelope?.requestId ?? response.headers.get('x-request-id'),
  });
}

// Parallel calls that all see TOKEN_EXPIRED must share one refresh. Two refreshes
// rotate the same cookie twice, and the API then revokes the whole token family.
let refreshInFlight: Promise<boolean> | null = null;

async function requestRefresh(): Promise<boolean> {
  const response = await fetch(buildUrl('/auth/refresh', undefined), {
    method: 'POST',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) return false;
  const payload = (await readEnvelope(response)) as SuccessEnvelope<{
    accessToken: string;
  }> | null;
  const token = payload?.data?.accessToken;
  if (typeof token !== 'string') return false;
  accessToken = token;
  return true;
}

async function refreshSession(): Promise<boolean> {
  refreshInFlight ??= requestRefresh()
    .catch(() => false)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

function onSessionLost(): void {
  accessToken = null;
  if (typeof window === 'undefined') return;
  const next = `${window.location.pathname}${window.location.search}`;
  window.location.assign(`/login?next=${encodeURIComponent(next)}`);
}

async function sendOnce(path: string, options: ApiFetchOptions): Promise<Response> {
  return fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    credentials: 'include',
    headers: buildHeaders(options),
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    ...(options.signal === undefined ? {} : { signal: options.signal }),
  });
}

async function send(path: string, options: ApiFetchOptions): Promise<Response> {
  const method = options.method ?? 'GET';
  const attempts = canRetry(method, options) ? MAX_ATTEMPTS : 1;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let response: Response;
    try {
      response = await sendOnce(path, options);
    } catch {
      if (options.signal?.aborted === true || attempt === attempts) throw offlineError();
      await delay(attempt * 400);
      continue;
    }

    if (!RETRYABLE_STATUSES.has(response.status) || attempt === attempts) return response;
    const retryAfter = Number(response.headers.get('retry-after'));
    const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : attempt * 400;
    await delay(wait);
  }

  throw offlineError();
}

async function request(path: string, options: ApiFetchOptions): Promise<unknown> {
  let response = await send(path, options);

  if (response.status === 401) {
    const error = toApiError(response, await readEnvelope(response));
    if (error.code !== 'TOKEN_EXPIRED' || !(await refreshSession())) {
      onSessionLost();
      throw error;
    }
    response = await send(path, options);
  }

  const payload = await readEnvelope(response);
  if (!response.ok) throw toApiError(response, payload);
  return payload;
}

function unreadableAnswer(what: string): ApiError {
  return new ApiError({
    status: 200,
    code: 'INTERNAL_ERROR',
    message: `The server sent ${what} EduFlow could not read.`,
  });
}

/** Calls the API and returns the `data` field of the canon success envelope. */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const payload = (await request(path, options)) as SuccessEnvelope<T> | null;
  if (payload === null || payload.success !== true) throw unreadableAnswer('an answer');
  return payload.data;
}

/** Calls a list endpoint and returns its rows together with the paging block. */
export async function apiFetchList<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<ApiListResult<T>> {
  const payload = (await request(path, options)) as SuccessEnvelope<T[]> | null;
  if (payload === null || payload.success !== true || !Array.isArray(payload.data)) {
    throw unreadableAnswer('a list');
  }
  const meta = payload.meta ?? {
    page: 1,
    limit: payload.data.length,
    total: payload.data.length,
    totalPages: 1,
  };
  return { items: payload.data, meta };
}
