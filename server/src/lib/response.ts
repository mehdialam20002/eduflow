import type { Response } from 'express';

/** The `meta` block of the canon list envelope. */
export interface ListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SuccessEnvelope<T> {
  success: true;
  data: T;
  meta?: ListMeta;
}

/** Builds `meta` from the paging input and the row count, so no route does the maths itself. */
export function listMeta(page: number, limit: number, total: number): ListMeta {
  const safeLimit = Math.max(1, Math.min(limit, 100));
  return {
    page: Math.max(1, page),
    limit: safeLimit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / safeLimit),
  };
}

export function ok<T>(res: Response, data: T): void {
  res.status(200).json({ success: true, data } satisfies SuccessEnvelope<T>);
}

export function okList<T>(res: Response, items: T[], meta: ListMeta): void {
  res.status(200).json({ success: true, data: items, meta } satisfies SuccessEnvelope<T[]>);
}

/** 201 plus the `Location` header the API standard asks for on every create. */
export function created<T>(res: Response, data: T, location?: string): void {
  if (location !== undefined) res.setHeader('Location', location);
  res.status(201).json({ success: true, data } satisfies SuccessEnvelope<T>);
}

export function noContent(res: Response): void {
  res.status(204).end();
}
