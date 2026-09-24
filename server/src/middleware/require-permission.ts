import type { RequestHandler } from 'express';
import { SYSTEM_ROLE_KEYS, scopeFor, type PermissionKey, type SystemRole } from '@eduflow/shared';
import { forbidden, unauthenticated } from '../lib/errors.ts';
import { getStore } from '../lib/tenant-context.ts';
import type { GrantScope } from '../types/auth.ts';

const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Two roles on one user give the union, so the widest grant wins.
const RANK: Record<GrantScope, number> = { VIEW: 1, OWN: 2, CAMPUS: 3, ALL: 4 };

const STORED: Record<string, GrantScope | undefined> = {
  yes: 'ALL',
  campus: 'CAMPUS',
  own: 'OWN',
  view: 'VIEW',
};

function isSystemRole(role: string): role is SystemRole {
  return (SYSTEM_ROLE_KEYS as readonly string[]).includes(role);
}

/** The widest scope the user's roles give for this key, or undefined when no role holds it. */
export function resolveScope(roleKeys: string[], key: PermissionKey): GrantScope | undefined {
  let best: GrantScope | undefined;
  for (const role of roleKeys) {
    // Custom roles carry their grants in the database and arrive with the roles module.
    if (!isSystemRole(role)) continue;
    const stored = STORED[scopeFor(role, key)];
    if (stored === undefined) continue;
    if (best === undefined || RANK[stored] > RANK[best]) best = stored;
  }
  return best;
}

/**
 * Gate four and five of the request: does this user hold the key at all, and with which scope?
 * Which rows the scope allows is decided by the service, because only it knows the entity.
 */
export function requirePermission(key: PermissionKey): RequestHandler {
  return (req, _res, next) => {
    const auth = req.auth;
    if (auth === undefined) return next(unauthenticated('Sign in to continue'));

    const scope = resolveScope(auth.roleKeys, key);
    if (scope === undefined) {
      req.log.warn({ key, userId: auth.userId }, 'Permission denied');
      return next(forbidden('You do not have permission for this action'));
    }
    if (scope === 'VIEW' && !READ_METHODS.has(req.method)) {
      return next(forbidden('You may only view this data'));
    }

    req.permission = { key, scope };
    const store = getStore();
    if (store?.kind === 'tenant') store.permissions.push(key);
    return next();
  };
}
