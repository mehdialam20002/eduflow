// The wire shapes fixed by docs/prd/55-api-standards-and-conventions.md.
// Both the web app and the API import these, so neither side can invent its own envelope.

import type { ErrorCode } from '../generated/index.ts';

/** Rows per page never go above this; a larger `limit` is a VALIDATION_ERROR. */
export const MAX_PAGE_LIMIT = 100;

/** Rows per page when the caller sends no `limit`. */
export const DEFAULT_PAGE_LIMIT = 20;

/** Page counters that every list response carries in `meta`. */
export interface ListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** A single row, an object, or an action result. */
export interface ApiSuccess<TData> {
  success: true;
  data: TData;
}

/** A list response: the rows in `data`, the counters in `meta`. */
export interface ApiListSuccess<TItem> {
  success: true;
  data: TItem[];
  meta: ListMeta;
}

/** One bad field inside a VALIDATION_ERROR, using the request path: `guardians[0].relation`. */
export interface ApiErrorDetail {
  field: string;
  issue: string;
}

/** `code` is for machines and never changes; `message` is for humans and may change. */
export interface ApiErrorBody {
  code: ErrorCode;
  message: string;
  details?: ApiErrorDetail[];
}

/** Every 4xx and 5xx body. `requestId` matches the `X-Request-Id` response header. */
export interface ApiError {
  success: false;
  error: ApiErrorBody;
  requestId: string;
}

export type ApiResponse<TData> = ApiSuccess<TData> | ApiError;
export type ApiListResponse<TItem> = ApiListSuccess<TItem> | ApiError;

/** A page of rows with its counters, as services hand it to the controller. */
export interface Paginated<TItem> {
  items: TItem[];
  meta: ListMeta;
}

/** The outcome of one row inside a bulk call. */
export interface BulkRowResult {
  id: string;
  status: 'OK' | 'FAILED';
  error?: Pick<ApiErrorBody, 'code' | 'message'>;
}

/** Bulk calls answer 200 even when some rows failed; the caller reads `meta`. */
export interface BulkMeta {
  requested: number;
  succeeded: number;
  failed: number;
}

export interface BulkResult {
  results: BulkRowResult[];
}

export type BulkResponse = ApiSuccess<BulkResult> & { meta: BulkMeta };

/** Status of a queued import, export or PDF job. */
export type JobStatus =
  | 'QUEUED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'COMPLETED_WITH_ERRORS'
  | 'FAILED'
  | 'CANCELLED';

/** The 202 body: where to poll and how long to wait between polls. */
export interface AcceptedJob {
  jobId: string;
  jobType: 'IMPORT' | 'EXPORT' | 'PDF' | 'MESSAGE';
  status: JobStatus;
  statusUrl: string;
  pollAfterSeconds: number;
}

/** Request headers named in the API standards chapter, for typed client wrappers. */
export const API_HEADERS = {
  authorization: 'Authorization',
  campusId: 'X-Campus-Id',
  organizationId: 'X-Organization-Id',
  idempotencyKey: 'Idempotency-Key',
  requestId: 'X-Request-Id',
  acceptLanguage: 'Accept-Language',
  apiKey: 'X-Api-Key',
} as const;

export type ApiHeaderName = (typeof API_HEADERS)[keyof typeof API_HEADERS];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Narrows an unknown response body to the error envelope.
 * The client uses it before reading `body.error.code`, so a network shape it did not
 * expect can never be read as a success.
 */
export function isApiError(value: unknown): value is ApiError {
  if (!isRecord(value)) return false;
  if (value['success'] !== false) return false;
  if (typeof value['requestId'] !== 'string') return false;
  const error = value['error'];
  if (!isRecord(error)) return false;
  return typeof error['code'] === 'string' && typeof error['message'] === 'string';
}

/** Narrows an unknown response body to a non-list success envelope. */
export function isApiSuccess<TData>(value: unknown): value is ApiSuccess<TData> {
  return isRecord(value) && value['success'] === true && 'data' in value;
}

/** True when the success envelope also carries page counters. */
export function isApiListSuccess<TItem>(value: unknown): value is ApiListSuccess<TItem> {
  if (!isApiSuccess<TItem[]>(value)) return false;
  const meta = (value as unknown as Record<string, unknown>)['meta'];
  return Array.isArray(value.data) && isRecord(meta) && typeof meta['page'] === 'number';
}

/** `ceil(total / limit)`, with a floor of 1 so an empty list still reads "Page 1 of 1". */
export function toListMeta(page: number, limit: number, total: number): ListMeta {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
