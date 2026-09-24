import { AsyncLocalStorage } from 'node:async_hooks';
import { logger } from './logger.ts';

/** Everything the request already knows about who is asking and for which tenant. */
export interface TenantContext {
  kind: 'tenant';
  orgId: string;
  userId: string;
  /** Campuses the user may reach. Empty means organization-wide, as an ORG_ADMIN has. */
  campusIds: string[];
  /** The single campus chosen with the X-Campus-Id header, when one was sent. */
  activeCampusId?: string;
  roles: string[];
  permissions: string[];
  requestId: string;
  /** Set when a SUPER_ADMIN acts inside this tenant. Every such request is audited. */
  impersonatorUserId?: string;
  inTransaction?: boolean;
}

/** Signup, login lookup, the platform console, webhooks and the seed run without a tenant. */
export interface PlatformContext {
  kind: 'platform';
  reason: string;
  requestId?: string;
  inTransaction?: boolean;
}

export type TenantInput = Omit<TenantContext, 'kind' | 'inTransaction'>;
type Store = TenantContext | PlatformContext;

const storage = new AsyncLocalStorage<Store>();

export class TenantContextMissingError extends Error {
  constructor(detail: string) {
    super(`Tenant context missing: ${detail}`);
    this.name = 'TenantContextMissingError';
  }
}

export function runWithTenant<T>(input: TenantInput, fn: () => Promise<T>): Promise<T> {
  return storage.run({ kind: 'tenant', ...input }, fn);
}

export function getStore(): Store | undefined {
  return storage.getStore();
}

export function getTenant(): TenantContext {
  const store = storage.getStore();
  if (store?.kind !== 'tenant') {
    throw new TenantContextMissingError('getTenant() called outside runWithTenant()');
  }
  return store;
}

/** Marks the context as "inside one database transaction". Used by lib/prisma.ts only. */
export function runInTransaction<T>(fn: () => Promise<T>): Promise<T> {
  const store = storage.getStore();
  if (store === undefined) throw new TenantContextMissingError('transaction without context');
  return storage.run({ ...store, inTransaction: true }, fn);
}

/**
 * Opens the wide door. A bug inside a tenant request must never be able to call this,
 * so it throws when a tenant context is already open, and the reason is always logged.
 */
export function runAsPlatform<T>(reason: string, fn: () => Promise<T>): Promise<T> {
  if (storage.getStore()?.kind === 'tenant') {
    throw new Error('runAsPlatform() is not allowed inside a tenant context');
  }
  if (reason.trim().length < 10) throw new Error('runAsPlatform() needs a clear reason');
  logger.info({ reason }, 'platform context opened');
  return storage.run({ kind: 'platform', reason }, fn);
}
