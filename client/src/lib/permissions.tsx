'use client';

import type { ReactNode } from 'react';
import { PERMISSIONS, type PermissionKey } from '@eduflow/shared';
import { useSession, type GrantScope } from '@/providers/session-provider';

// Hiding a button is only for comfort. The API checks the same key and the same
// scope on every request, because anyone can call it directly.

export interface PermissionsApi {
  /** Every key the signed-in user holds, with the scope the grant carries. */
  grants: ReadonlyMap<PermissionKey, GrantScope>;
  can: (key: PermissionKey) => boolean;
  canAny: (keys: readonly PermissionKey[]) => boolean;
  canAll: (keys: readonly PermissionKey[]) => boolean;
  scopeOf: (key: PermissionKey) => GrantScope | null;
  /** The one-line meaning of a key from the generated permission map. */
  meaningOf: (key: PermissionKey) => string;
}

const NO_GRANTS: ReadonlyMap<PermissionKey, GrantScope> = new Map();

export function usePermissions(): PermissionsApi {
  const { session } = useSession();
  const grants = session?.grants ?? NO_GRANTS;

  const can = (key: PermissionKey): boolean => grants.has(key);

  return {
    grants,
    can,
    canAny: (keys) => keys.some(can),
    canAll: (keys) => keys.every(can),
    scopeOf: (key) => grants.get(key) ?? null,
    meaningOf: (key) => PERMISSIONS[key].meaning,
  };
}

export interface CanProps {
  /** A single key the user must hold. */
  permission?: PermissionKey;
  /** Or any one key out of several, for a menu group. */
  anyOf?: readonly PermissionKey[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Shows its children only when the user holds the grant. A missing grant hides
 * the item; it is never greyed out, because a custom role would then see a wall
 * of dead buttons.
 */
export function Can({ permission, anyOf, children, fallback = null }: CanProps): ReactNode {
  const { canAny } = usePermissions();
  const keys = [...(anyOf ?? []), ...(permission === undefined ? [] : [permission])];
  const allowed = keys.length > 0 && canAny(keys);
  return <>{allowed ? children : fallback}</>;
}
