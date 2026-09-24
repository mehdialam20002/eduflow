// Helpers over the generated permission map in ../generated/permissions.ts.
//
// The map itself is produced from docs/permissions.md and is never edited by hand. These
// helpers only read it, so a permission can never exist in code without existing in the
// specification, the seed and the RBAC matrix.

import type {
  PERMISSION_PREFIXES} from '../generated/index.ts';
import {
  PERMISSION_KEYS,
  PERMISSIONS,
  scopeFor,
  type PermissionKey,
  type PermissionScope,
  type SystemRole,
} from '../generated/index.ts';

/** The module part of a permission key: the `fees` in `fees.collect`. */
export type PermissionPrefix = (typeof PERMISSION_PREFIXES)[number];

// Distributes over the union, so each key contributes only its own action.
type ActionPart<TKey> = TKey extends `${string}.${infer TAction}` ? TAction : never;

/** The actions that really exist for one module, taken from the generated key union. */
export type PermissionActionOf<TPrefix extends PermissionPrefix> = ActionPart<
  Extract<PermissionKey, `${TPrefix}.${string}`>
>;

const PERMISSION_KEY_SET: ReadonlySet<string> = new Set<string>(PERMISSION_KEYS);

/** Narrows any text to a real permission key before it is used to guard a route. */
export function isPermissionKey(value: string): value is PermissionKey {
  return PERMISSION_KEY_SET.has(value);
}

/**
 * Builds a permission key from its two parts and refuses, at compile time, any pair that the
 * specification does not list. `permissionKey('fees', 'collect')` is `'fees.collect'`;
 * `permissionKey('fees', 'teleport')` does not compile.
 */
export function permissionKey<
  TPrefix extends PermissionPrefix,
  TAction extends PermissionActionOf<TPrefix>,
>(module: TPrefix, action: TAction): Extract<PermissionKey, `${TPrefix}.${TAction}`> {
  return `${module}.${action}` as Extract<PermissionKey, `${TPrefix}.${TAction}`>;
}

/** True when the signed-in user carries this key. Ownership is still checked in the service. */
export function hasPermission(
  userPermissions: Iterable<string>,
  key: PermissionKey,
): boolean {
  if (userPermissions instanceof Set) {
    return userPermissions.has(key);
  }
  for (const held of userPermissions) {
    if (held === key) return true;
  }
  return false;
}

/** True when the user carries at least one of the keys, for a screen with several entry points. */
export function hasAnyPermission(
  userPermissions: Iterable<string>,
  keys: readonly PermissionKey[],
): boolean {
  const held = toPermissionSet(userPermissions);
  return keys.some((key) => held.has(key));
}

/** True when the user carries every key, for an action that touches two modules at once. */
export function hasAllPermissions(
  userPermissions: Iterable<string>,
  keys: readonly PermissionKey[],
): boolean {
  const held = toPermissionSet(userPermissions);
  return keys.every((key) => held.has(key));
}

/** Reads a list of keys once so repeated checks on one request stay cheap. */
export function toPermissionSet(userPermissions: Iterable<string>): ReadonlySet<string> {
  return userPermissions instanceof Set ? userPermissions : new Set(userPermissions);
}

/** The plain-English meaning of a key, for the role editor and the permission matrix screen. */
export function permissionMeaning(key: PermissionKey): string {
  return PERMISSIONS[key].meaning;
}

/** Every key a system role may call at all, useful for seeding and for the role editor. */
export function permissionsForRole(role: SystemRole): PermissionKey[] {
  return PERMISSION_KEYS.filter((key) => scopeFor(role, key) !== 'no');
}

/** Every key belonging to one module, in the order the specification lists them. */
export function permissionsForModule(prefix: PermissionPrefix): PermissionKey[] {
  return PERMISSION_KEYS.filter((key) => key.startsWith(`${prefix}.`));
}

/** The module part of a key, for grouping the role editor by module. */
export function prefixOf(key: PermissionKey): PermissionPrefix {
  return key.slice(0, key.indexOf('.')) as PermissionPrefix;
}

/** The whole organization, every campus. */
export function isOrganizationScope(role: SystemRole, key: PermissionKey): boolean {
  return scopeFor(role, key) === 'yes';
}

/** Only the campuses in the user's `user_campuses` rows; `X-Campus-Id` narrows it further. */
export function isCampusScope(role: SystemRole, key: PermissionKey): boolean {
  return scopeFor(role, key) === 'campus';
}

/** Own records only: a parent's children, a student's own row, a teacher's own batches. */
export function isOwnScope(role: SystemRole, key: PermissionKey): boolean {
  return scopeFor(role, key) === 'own';
}

/** The route may be called, but nothing may be changed through it. */
export function isReadOnlyScope(role: SystemRole, key: PermissionKey): boolean {
  return scopeFor(role, key) === 'view';
}

/** True when the service must still filter rows by owner or campus after the route is allowed. */
export function needsRowFilter(role: SystemRole, key: PermissionKey): boolean {
  const scope: PermissionScope = scopeFor(role, key);
  return scope === 'own' || scope === 'campus';
}
